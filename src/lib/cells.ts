// 左ペインのセルの値と、コピー/ペースト・削除で「何をどう書き換えるか」の計算(純粋関数)

import type { Task } from '../state/types'
import type { CellRect, ColumnIndex } from './cellRange'
import { COLUMN_COUNT } from './cellRange'
import { formatYmdSlash, parseDateInput, type Ymd } from './date'

/**
 * 1行分の書き換え内容。
 * プロパティがない(undefined)列は「触らない」、null は「空にする」という意味
 */
export type CellPatch = {
  name?: string
  start?: Ymd | null
  end?: Ymd | null
}

/**
 * コピー用に、セルの値を文字列にする。
 * 日付は年付き(2026/4/1)。スプレッドシートは年のない "4/1" を「今年の4/1」と解釈するので、
 * 年をまたぐ案件で日付がずれないように年まで渡す(SPEC 6-3)
 */
export function cellText(task: Task, col: ColumnIndex): string {
  if (col === 0) return task.name
  const date = col === 1 ? task.start : task.end
  return date ? formatYmdSlash(date) : ''
}

/** 範囲内のセルの値を、行 × 列の2次元配列で取り出す(コピー用) */
export function rectTexts(tasks: Task[], rect: CellRect): string[][] {
  const rows: string[][] = []
  for (let r = rect.top; r <= rect.bottom; r++) {
    const row: string[] = []
    for (let c = rect.left; c <= rect.right; c++) row.push(cellText(tasks[r], c as ColumnIndex))
    rows.push(row)
  }
  return rows
}

/**
 * 貼り付けるセル(行 × 列の文字列)を、行ごとの書き換え内容に変換する。
 * - left 列から右へ順に当てはめ、終了日(3列目)より右にはみ出す分は捨てる
 * - 日付列は 6-2 のルールで解釈する。空欄は「空にする」、解釈できない値はスキップして数える
 */
export function pasteToPatches(
  cells: string[][],
  left: ColumnIndex,
  viewStart: Ymd,
): { patches: CellPatch[]; skipped: number } {
  let skipped = 0
  const patches = cells.map((rowCells) => {
    const patch: CellPatch = {}
    rowCells.forEach((raw, i) => {
      const col = left + i
      if (col >= COLUMN_COUNT) return // 終了日より右は捨てる
      if (col === 0) {
        patch.name = raw
        return
      }
      const text = raw.trim()
      let value: Ymd | null
      if (text === '') {
        value = null
      } else {
        const parsed = parseDateInput(text, viewStart)
        if (parsed === null) {
          skipped++
          return // 解釈できない値は書き込まない(その列は元の値のまま)
        }
        value = parsed
      }
      if (col === 1) patch.start = value
      else patch.end = value
    })
    return patch
  })
  return { patches, skipped }
}

/** 範囲内のセルを空にするための書き換え内容(Delete / Backspace 用) */
export function clearPatches(rect: CellRect): CellPatch[] {
  const patch: CellPatch = {}
  if (rect.left <= 0 && rect.right >= 0) patch.name = ''
  if (rect.left <= 1 && rect.right >= 1) patch.start = null
  if (rect.left <= 2 && rect.right >= 2) patch.end = null
  return Array.from({ length: rect.bottom - rect.top + 1 }, () => ({ ...patch }))
}
