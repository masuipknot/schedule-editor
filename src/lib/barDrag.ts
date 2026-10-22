// バーのドラッグ操作の計算(React に依存しない純粋関数)。
// 「マウス位置 → 何日目か」「ドラッグ量 → 新しい開始日・終了日」をここにまとめ、
// 画面を触らなくてもテストで正しさを確認できるようにしている。

import { addDays, compareYmd, type Ymd } from './date'

/**
 * ドラッグの種類
 * - move: 期間を保ったまま左右に移動
 * - resize-start / resize-end: 左端 / 右端をつかんで開始日 / 終了日を変更
 * - create: 日付のない行の空き部分をドラッグして、新しくバーを作る
 */
export type DragMode = 'move' | 'resize-start' | 'resize-end' | 'create'

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

/**
 * 位置(offset)に一番近い「線」の番号。線 n は n 番目のセルの左端(上端)にある。
 * セルの前半分なら そのセルの左端(n)、後ろ半分なら 次のセルの左端(n + 1) になる。
 *
 * セルの中で「どのセルか」を決める dayIndexAt だと、狙ったセルの左端を少し外しただけで
 * 左隣のセルになってしまう。端を狙う操作(新規作成・伸縮・行の選択)では、
 * 一番近い線に吸い付かせたほうが、狙いどおりの位置になりやすい
 */
export function nearestLineIndex(offset: number, cellSize: number): number {
  return Math.round(offset / cellSize)
}

/** 画面上の x 座標に一番近い日付の境目(縦線)の番号。考え方は dayIndexAt と同じ */
export function dayLineAt(
  clientX: number,
  calendarLeft: number,
  scrollLeft: number,
  dayWidth: number,
): number {
  return nearestLineIndex(clientX - calendarLeft + scrollLeft, dayWidth)
}

/**
 * 新規作成のドラッグで、2本の縦線の間を期間にする(戻り値は表示範囲の何日目〜何日目か)。
 *
 * 線 a から線 b まで引いたら、a 日目〜(b - 1)日目。左向きでも同じ。
 * 2本が同じ線のときも最短1日にするため、ドラッグした向き(leftward)の側の1日を返す
 */
export function createRangeBetweenLines(
  startLine: number,
  currentLine: number,
  leftward: boolean,
): { startIndex: number; endIndex: number } {
  if (currentLine > startLine) return { startIndex: startLine, endIndex: currentLine - 1 }
  if (currentLine < startLine) return { startIndex: currentLine, endIndex: startLine - 1 }
  return leftward
    ? { startIndex: startLine - 1, endIndex: startLine - 1 }
    : { startIndex: startLine, endIndex: startLine }
}

/**
 * 移動・伸縮で、ドラッグを始めた時点の日付と、何日分動かしたかから、新しい日付を求める。
 * (新規作成は「線と線の間」で決まるので createRangeBetweenLines を使う)
 */
export function applyDrag(
  mode: Exclude<DragMode, 'create'>,
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
