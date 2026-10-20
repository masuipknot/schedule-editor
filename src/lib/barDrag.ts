// バーのドラッグ操作の計算(React に依存しない純粋関数)。
// 「マウス位置 → 何日目か」「ドラッグ量 → 新しい開始日・終了日」をここにまとめ、
// 画面を触らなくてもテストで正しさを確認できるようにしている。

import { addDays, compareYmd, type Ymd } from './date'

/**
 * ドラッグの種類
 * - move: 期間を保ったまま左右に移動
 * - resize-start / resize-end: 左端 / 右端をつかんで開始日 / 終了日を変更
 */
export type DragMode = 'move' | 'resize-start' | 'resize-end'

/** pointerdown からこれ以上(px)動いたらドラッグ。未満で離したらクリック扱い */
export const DRAG_THRESHOLD_PX = 4

/**
 * 画面上の x 座標(clientX)が、カレンダーの何日目(0 始まり)に当たるか。
 *
 * calendarLeft は「カレンダーが見えている領域の左端」の画面座標で、スクロールしても変わらない。
 * そこに scrollLeft を足すことで、スクロールで隠れている分も含めた位置になる。
 * scrollLeft を足し忘れると、自動スクロール中に日付がずれる
 */
export function dayIndexAt(
  clientX: number,
  calendarLeft: number,
  scrollLeft: number,
  dayWidth: number,
): number {
  return Math.floor((clientX - calendarLeft + scrollLeft) / dayWidth)
}

/** ドラッグを始めた時点の日付と、何日分動かしたかから、新しい日付を求める */
export function applyDrag(
  mode: DragMode,
  original: { start: Ymd; end: Ymd },
  deltaDays: number,
): { start: Ymd; end: Ymd } {
  switch (mode) {
    case 'move':
      return { start: addDays(original.start, deltaDays), end: addDays(original.end, deltaDays) }

    case 'resize-start': {
      // 最小期間は1日。終了日を越えようとしたら、終了日と同じ日で止める
      const start = addDays(original.start, deltaDays)
      return { start: compareYmd(start, original.end) > 0 ? original.end : start, end: original.end }
    }

    case 'resize-end': {
      const end = addDays(original.end, deltaDays)
      return { start: original.start, end: compareYmd(end, original.start) < 0 ? original.start : end }
    }
  }
}
