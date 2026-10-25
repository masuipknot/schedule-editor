// 左ペインのセル位置と範囲の計算(React に依存しない純粋関数)

/** 左ペインの列。0 = 項目名、1 = 開始日、2 = 終了日 */
export type ColumnIndex = 0 | 1 | 2
export const COLUMN_COUNT = 3

/** セルの位置(行は 0 始まり) */
export type CellPos = { row: number; col: ColumnIndex }

/** 矩形の範囲(上下左右の端を含む) */
export type CellRect = { top: number; bottom: number; left: ColumnIndex; right: ColumnIndex }

function toColumn(col: number): ColumnIndex {
  return Math.min(COLUMN_COUNT - 1, Math.max(0, col)) as ColumnIndex
}

/** 2つのセル(選択を始めたセルと、今いるセル)を対角とする矩形 */
export function rectOf(a: CellPos, b: CellPos): CellRect {
  return {
    top: Math.min(a.row, b.row),
    bottom: Math.max(a.row, b.row),
    left: toColumn(Math.min(a.col, b.col)),
    right: toColumn(Math.max(a.col, b.col)),
  }
}

export function containsPos(rect: CellRect, pos: CellPos): boolean {
  return pos.row >= rect.top && pos.row <= rect.bottom && pos.col >= rect.left && pos.col <= rect.right
}

/** セルを上下左右に動かす。表の外には出ない(端で止まる) */
export function movePos(pos: CellPos, dRow: number, dCol: number, rowCount: number): CellPos {
  return {
    row: Math.min(rowCount - 1, Math.max(0, pos.row + dRow)),
    col: toColumn(pos.col + dCol),
  }
}
