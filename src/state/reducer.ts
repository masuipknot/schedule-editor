// スケジュール全体の状態を変更する唯一の入口(useReducer 用)。
// 操作の種類が増えても状態変更がここに集まるので、不変条件のチェックや、
// 後から Undo/Redo・自動保存を足すときにこのファイルを見れば済む。

import type { CellPatch } from '../lib/cells'
import { addDays, compareYmd, diffDays, startOfMonth, type Ymd } from '../lib/date'
import type { ScheduleAction, ScheduleState, Task, ViewRange } from './types'

export const INITIAL_ROW_COUNT = 30
export const INITIAL_VIEW_DAYS = 120
/** 表示範囲を自動で広げるとき、日付の先に余白として足す日数(バーの右端が画面の端に貼り付かないように) */
export const VIEW_EXTEND_MARGIN_DAYS = 7
/** ドラッグ中に右端まで自動スクロールしたとき、一度に延ばす表示日数 */
export const VIEW_EXTEND_CHUNK_DAYS = 30

function createEmptyTask(): Task {
  return { id: crypto.randomUUID(), name: '', start: null, end: null }
}

/** 初期状態: 空行30行、表示範囲は当月1日から120日 */
export function createInitialState(todayYmd: Ymd): ScheduleState {
  return {
    tasks: Array.from({ length: INITIAL_ROW_COUNT }, createEmptyTask),
    view: { start: startOfMonth(todayYmd), days: INITIAL_VIEW_DAYS },
  }
}

/**
 * 開始日・終了日を不変条件に合うように整える。
 * - 片方だけなら、もう片方を同じ日付で補完(1日タスク)
 * - 開始 > 終了 なら入れ替える
 */
export function normalizeDates(
  start: Ymd | null,
  end: Ymd | null,
): { start: Ymd | null; end: Ymd | null } {
  if (start === null && end === null) return { start: null, end: null }
  const s = start ?? end!
  const e = end ?? start!
  return compareYmd(s, e) <= 0 ? { start: s, end: e } : { start: e, end: s }
}

/**
 * 表示範囲の外(または右端の余白内)に日付が入力されたら、その日付が見えるように範囲を広げる。
 * 左側に広げるときは月初めから表示する(初期表示が月初めなので、それに合わせる)
 */
export function extendViewToInclude(view: ViewRange, start: Ymd, end: Ymd): ViewRange {
  let viewStart = view.start
  let viewEnd = addDays(view.start, view.days - 1)

  if (compareYmd(start, viewStart) < 0) viewStart = startOfMonth(start)
  // 終了日が右端ぎりぎりに収まっている場合も、余白が取れるところまで広げる
  const wantedEnd = addDays(end, VIEW_EXTEND_MARGIN_DAYS)
  if (compareYmd(wantedEnd, viewEnd) > 0) viewEnd = wantedEnd

  if (viewStart === view.start && viewEnd === addDays(view.start, view.days - 1)) return view
  return { start: viewStart, days: diffDays(viewStart, viewEnd) + 1 }
}

/**
 * 1行分の書き換え(CellPatch)をタスクに当てはめる。開始日・終了日の不変条件(SPEC 4章)もここで守る。
 * - 日付のある行で、片方だけをこの書き換えで空にした → 両方を空にする
 *   (補完ルールのままだと、空にした側が反対側の日付で埋め直されてしまうため)
 * - それ以外で片方だけ日付がある(空の行に片方だけ入れた、新しい日付と空欄を一緒に貼った など)
 *   → もう片方を同じ日付で補完する
 * - 開始 > 終了 なら入れ替える
 */
export function applyCellPatch(task: Task, patch: CellPatch): Task {
  const name = patch.name ?? task.name
  const start = patch.start !== undefined ? patch.start : task.start
  const end = patch.end !== undefined ? patch.end : task.end

  const clearedOneSideOfExistingDates =
    (start === null && patch.start === null && end !== null && patch.end === undefined) ||
    (end === null && patch.end === null && start !== null && patch.start === undefined)
  if (clearedOneSideOfExistingDates) return { ...task, name, start: null, end: null }

  return { ...task, name, ...normalizeDates(start, end) }
}

/**
 * top 行目から順に書き換えを当てはめる。行が足りなければ空行を追加する(ペースト用)。
 * 書き換えのない行は同じオブジェクトのまま残す
 */
function applyPatches(tasks: Task[], top: number, patches: CellPatch[]): Task[] {
  const next = [...tasks]
  while (next.length < top + patches.length) next.push(createEmptyTask())
  patches.forEach((patch, i) => {
    next[top + i] = applyCellPatch(next[top + i], patch)
  })
  return next
}

/** 書き換えで入った日付が見えるように表示範囲を広げる(SET_DATES と同じ考え方) */
function extendViewForTasks(view: ViewRange, tasks: Task[]): ViewRange {
  const dated = tasks.filter((t): t is Task & { start: Ymd; end: Ymd } => t.start !== null && t.end !== null)
  if (dated.length === 0) return view
  const start = dated.map((t) => t.start).reduce((a, b) => (compareYmd(a, b) <= 0 ? a : b))
  const end = dated.map((t) => t.end).reduce((a, b) => (compareYmd(a, b) >= 0 ? a : b))
  return extendViewToInclude(view, start, end)
}

/** id が一致するタスクだけを差し替える。他の行はそのまま(同じオブジェクト)を使う */
function updateTask(tasks: Task[], id: string, update: (task: Task) => Task): Task[] {
  return tasks.map((task) => (task.id === id ? update(task) : task))
}

export function scheduleReducer(state: ScheduleState, action: ScheduleAction): ScheduleState {
  switch (action.type) {
    case 'UPDATE_NAME':
      return {
        ...state,
        tasks: updateTask(state.tasks, action.id, (task) => ({ ...task, name: action.name })),
      }

    case 'SET_DATES': {
      const { start, end } = normalizeDates(action.start, action.end)
      return {
        tasks: updateTask(state.tasks, action.id, (task) => ({ ...task, start, end })),
        view: start && end ? extendViewToInclude(state.view, start, end) : state.view,
      }
    }

    case 'CLEAR_DATES':
      return {
        ...state,
        tasks: updateTask(state.tasks, action.id, (task) => ({ ...task, start: null, end: null })),
      }

    case 'SET_VIEW_START':
      // 利用者が明示的に表示開始日を変えたときは、範囲外になったバーがあっても自動では広げない
      // (広げてしまうと、後ろの期間だけを見たいときに開始日を動かせなくなるため)
      return { ...state, view: { ...state.view, start: action.start } }

    case 'EXTEND_VIEW_DAYS':
      // 縮める使い方は想定していないので、0 以下は無視する(誤って表示範囲が消えないように)
      if (action.days <= 0) return state
      return { ...state, view: { ...state.view, days: state.view.days + action.days } }

    case 'PASTE_CELLS': {
      const tasks = applyPatches(state.tasks, action.top, action.patches)
      const pasted = tasks.slice(action.top, action.top + action.patches.length)
      return { tasks, view: extendViewForTasks(state.view, pasted) }
    }

    case 'CLEAR_CELLS':
      // 空にするだけなので、行の追加や表示範囲の変更はない
      return { ...state, tasks: applyPatches(state.tasks, action.top, action.patches) }
  }
}
