import { describe, expect, it } from 'vitest'
import { parseTsv, toTsv } from './tsv'

describe('toTsv', () => {
  it('セル間はタブ、行間は改行', () => {
    expect(
      toTsv([
        ['2026/4/1', '2026/4/10'],
        ['2026/4/13', '2026/4/16'],
      ]),
    ).toBe('2026/4/1\t2026/4/10\n2026/4/13\t2026/4/16')
  })

  it('空のセルもタブで区切って残す', () => {
    expect(toTsv([['', '2026/4/1', '']])).toBe('\t2026/4/1\t')
  })

  it('タブ・改行・ダブルクォートを含むセルは "..." で囲み、" は "" にする', () => {
    expect(toTsv([['要件\t定義', '1行目\n2行目', '"重要"']])).toBe(
      '"要件\t定義"\t"1行目\n2行目"\t"""重要"""',
    )
  })
})

describe('parseTsv', () => {
  it('タブと改行で分ける', () => {
    expect(parseTsv('a\tb\nc\td')).toEqual([
      ['a', 'b'],
      ['c', 'd'],
    ])
  })

  it('\\r\\n の改行にも対応する', () => {
    expect(parseTsv('a\tb\r\nc\td')).toEqual([
      ['a', 'b'],
      ['c', 'd'],
    ])
  })

  it('最後の改行は空行として数えない', () => {
    expect(parseTsv('a\tb\n')).toEqual([['a', 'b']])
  })

  it('空のセルや空行も残す', () => {
    expect(parseTsv('\ta\n\n')).toEqual([['', 'a'], ['']])
  })

  it('"..." で囲まれたセルの中のタブ・改行・"" を戻す', () => {
    expect(parseTsv('"要件\t定義"\t"1行目\n2行目"\t"""重要"""')).toEqual([
      ['要件\t定義', '1行目\n2行目', '"重要"'],
    ])
  })

  it('toTsv で作ったものを parseTsv で戻すと元どおり', () => {
    const rows = [
      ['要件定義', '2026/4/1', '2026/4/10'],
      ['改行\nあり', '', '"引用"'],
    ]
    expect(parseTsv(toTsv(rows))).toEqual(rows)
  })

  it('1セルだけ', () => {
    expect(parseTsv('4/1')).toEqual([['4/1']])
  })

  it('空文字は行なし', () => {
    expect(parseTsv('')).toEqual([])
  })
})
