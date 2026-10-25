import { describe, expect, it } from 'vitest'
import type { Task } from '../state/types'
import { cellText, clearPatches, pasteToPatches, rectTexts } from './cells'

const tasks: Task[] = [
  { id: 'a', name: '要件定義', start: '2026-04-01', end: '2026-04-10' },
  { id: 'b', name: '', start: null, end: null },
]

describe('cellText / rectTexts', () => {
  it('日付は年付きで出す', () => {
    expect(cellText(tasks[0], 1)).toBe('2026/4/1')
    expect(cellText(tasks[0], 2)).toBe('2026/4/10')
  })

  it('空の日付は空文字', () => {
    expect(cellText(tasks[1], 1)).toBe('')
  })

  it('範囲の値を行 × 列で取り出す(開始日・終了日の2列)', () => {
    expect(rectTexts(tasks, { top: 0, bottom: 1, left: 1, right: 2 })).toEqual([
      ['2026/4/1', '2026/4/10'],
      ['', ''],
    ])
  })
})

describe('pasteToPatches', () => {
  const viewStart = '2026-04-01'

  it('開始日の列から貼ると、開始日・終了日に入る', () => {
    expect(pasteToPatches([['2026/4/13', '2026/4/16']], 1, viewStart)).toEqual({
      patches: [{ start: '2026-04-13', end: '2026-04-16' }],
      skipped: 0,
    })
  })

  it('項目名の列から3列分を貼る', () => {
    expect(pasteToPatches([['設計', '4/13', '4/16']], 0, viewStart).patches).toEqual([
      { name: '設計', start: '2026-04-13', end: '2026-04-16' },
    ])
  })

  it('終了日より右にはみ出す分は捨てる', () => {
    expect(pasteToPatches([['4/13', '4/16', '担当A', 'メモ']], 1, viewStart).patches).toEqual([
      { start: '2026-04-13', end: '2026-04-16' },
    ])
  })

  it('空欄は「空にする」(null)', () => {
    expect(pasteToPatches([['4/13', '']], 1, viewStart).patches).toEqual([
      { start: '2026-04-13', end: null },
    ])
  })

  it('解釈できない日付は書き込まず、件数を数える', () => {
    expect(pasteToPatches([['未定', '4/16'], ['4/20', 'abc']], 1, viewStart)).toEqual({
      patches: [{ end: '2026-04-16' }, { start: '2026-04-20' }],
      skipped: 2,
    })
  })

  it('項目名だけを貼る', () => {
    expect(pasteToPatches([['要件定義'], ['設計']], 0, viewStart).patches).toEqual([
      { name: '要件定義' },
      { name: '設計' },
    ])
  })
})

describe('clearPatches', () => {
  it('範囲に入っている列だけを空にする', () => {
    expect(clearPatches({ top: 2, bottom: 3, left: 1, right: 2 })).toEqual([
      { start: null, end: null },
      { start: null, end: null },
    ])
    expect(clearPatches({ top: 0, bottom: 0, left: 0, right: 0 })).toEqual([{ name: '' }])
  })
})
