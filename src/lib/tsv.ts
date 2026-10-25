// TSV(タブ区切りテキスト)の生成と解析。
// スプレッドシートとのコピー&ペーストは、クリップボード上ではこの形式でやり取りされる。
//
// セルの中にタブ・改行・ダブルクォートが含まれる場合、Google スプレッドシートや Excel は
// そのセルを "..." で囲み、中の " を "" と書く。ここでも同じ決まりで読み書きする。

/** セルの値を TSV 用に書き出す。区切り文字などを含むときだけ "..." で囲む */
function quoteIfNeeded(value: string): string {
  return /[\t\n\r"]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value
}

/** 2次元配列(行 × セル)を TSV 文字列にする。セル間はタブ、行間は改行 */
export function toTsv(rows: string[][]): string {
  return rows.map((cells) => cells.map(quoteIfNeeded).join('\t')).join('\n')
}

/**
 * TSV 文字列を2次元配列(行 × セル)にする。
 * - 改行は \n / \r\n のどちらでもよい
 * - 最後の行のあとの改行(スプレッドシートからのコピーで付くことがある)は空行として数えない
 */
export function parseTsv(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let cell = ''
  let i = 0
  // セルの先頭が " のときだけ「囲まれたセル」として扱う(途中の " はただの文字)
  let quoted = false

  while (i < text.length) {
    const ch = text[i]

    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') {
        cell += '"' // "" は " 1文字
        i += 2
      } else if (ch === '"') {
        quoted = false // 囲みの終わり
        i++
      } else {
        cell += ch
        i++
      }
      continue
    }

    if (ch === '"' && cell === '') {
      quoted = true
      i++
    } else if (ch === '\t') {
      row.push(cell)
      cell = ''
      i++
    } else if (ch === '\r' || ch === '\n') {
      row.push(cell)
      rows.push(row)
      row = []
      cell = ''
      i += ch === '\r' && text[i + 1] === '\n' ? 2 : 1
    } else {
      cell += ch
      i++
    }
  }

  // 最後の行(改行で終わっていない場合)を追加する
  if (cell !== '' || row.length > 0) {
    row.push(cell)
    rows.push(row)
  }
  return rows
}
