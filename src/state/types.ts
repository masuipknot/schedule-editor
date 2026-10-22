import type { Ymd } from '../lib/date'

// 1行 = 1タスク。バーは開始日・終了日から「導出」されるもので、独立したデータを持たない
export type Task = {
  id: string
  /** 項目名(他の要素に影響しない) */
  name: string
  /** 開始日。end と「両方 null」か「両方あり、かつ start <= end」のどちらか */
  start: Ymd | null
  end: Ymd | null
}

/** カレンダーの表示範囲 */
export type ViewRange = {
  /** 表示の初日 */
  start: Ymd
  /** 表示日数 */
  days: number
}

export type ScheduleState = {
  tasks: Task[]
  view: ViewRange
}

// reducer が受け付ける操作の一覧。状態を変えたいときは必ずこのどれかを dispatch する。
// Phase 3 以降で PASTE_CELLS / ADD_ROWS などを足していく
export type ScheduleAction =
  | { type: 'UPDATE_NAME'; id: string; name: string }
  | { type: 'SET_DATES'; id: string; start: Ymd | null; end: Ymd | null }
  | { type: 'CLEAR_DATES'; id: string }
  | { type: 'SET_VIEW_START'; start: Ymd }
  /** 表示日数を days 日分延ばす(ドラッグ中に右端まで自動スクロールしたとき) */
  | { type: 'EXTEND_VIEW_DAYS'; days: number }
