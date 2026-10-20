import { describe, expect, it } from 'vitest'
import { applyDrag, dayIndexAt } from './barDrag'

describe('dayIndexAt', () => {
  // カレンダーの見えている左端が画面の x=335、列幅 26px
  it('スクロールしていなければ、左端からの距離 ÷ 列幅', () => {
    expect(dayIndexAt(335, 335, 0, 26)).toBe(0)
    expect(dayIndexAt(360, 335, 0, 26)).toBe(0) // 1日目の右端ぎりぎり
    expect(dayIndexAt(361, 335, 0, 26)).toBe(1)
  })

  it('スクロールした分(scrollLeft)を足して数える', () => {
    expect(dayIndexAt(335, 335, 260, 26)).toBe(10)
  })

  it('左端より左はマイナスになる', () => {
    expect(dayIndexAt(300, 335, 0, 26)).toBe(-2)
  })
})

describe('applyDrag', () => {
  const original = { start: '2026-04-13', end: '2026-04-16' }

  it('move は期間を保ったまま動かす', () => {
    expect(applyDrag('move', original, 3)).toEqual({ start: '2026-04-16', end: '2026-04-19' })
    expect(applyDrag('move', original, -13)).toEqual({ start: '2026-03-31', end: '2026-04-03' })
  })

  it('resize-start は開始日だけを変える', () => {
    expect(applyDrag('resize-start', original, -2)).toEqual({ start: '2026-04-11', end: '2026-04-16' })
    expect(applyDrag('resize-start', original, 2)).toEqual({ start: '2026-04-15', end: '2026-04-16' })
  })

  it('resize-start で終了日を越えようとしたら1日の長さで止まる', () => {
    expect(applyDrag('resize-start', original, 3)).toEqual({ start: '2026-04-16', end: '2026-04-16' })
    expect(applyDrag('resize-start', original, 10)).toEqual({ start: '2026-04-16', end: '2026-04-16' })
  })

  it('resize-end は終了日だけを変える', () => {
    expect(applyDrag('resize-end', original, 4)).toEqual({ start: '2026-04-13', end: '2026-04-20' })
    expect(applyDrag('resize-end', original, -1)).toEqual({ start: '2026-04-13', end: '2026-04-15' })
  })

  it('resize-end で開始日を越えようとしたら1日の長さで止まる', () => {
    expect(applyDrag('resize-end', original, -10)).toEqual({ start: '2026-04-13', end: '2026-04-13' })
  })

  it('動かしていなければ元のまま', () => {
    expect(applyDrag('move', original, 0)).toEqual(original)
  })
})
