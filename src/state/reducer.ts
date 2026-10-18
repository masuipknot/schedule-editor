// スケジュール全体の状態を変更する唯一の入口(useReducer 用)。
// 操作の種類が増えても状態変更がここに集まるので、不変条件のチェックや、
// 後から Undo/Redo・自動保存を足すときにこのファイルを見れば済む。

import { addDays, compareYmd, diffDays, startOfMonth, type Ymd } from '../lib/date'
import type { ScheduleAction, ScheduleState, Task, ViewRange } from './types'

export const INITIAL_ROW_COUNT = 30
export const INITIAL_VIEW_DAYS = 120
/** 表示範囲を自動で広げるとき、日付の先に余白として足す日数(バーの右端が画面の端に貼り付かないように) */
export const VIEW_EXTEND_MARGIN_DAYS = 7

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
  }
}
