import { describe, expect, it } from 'vitest'
import {
  applyDrag,
  createRangeBetweenLines,
  dayIndexAt,
  dayLineAt,
  nearestLineIndex,
} from './barDrag'

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

describe('nearestLineIndex', () => {
  // セルの大きさ 26px。線 n は n 番目のセルの左端
  it('セルの前半分なら、そのセルの左端の線', () => {
    expect(nearestLineIndex(26 * 3, 26)).toBe(3) // セル3の左端ちょうど
    expect(nearestLineIndex(26 * 3 + 12, 26)).toBe(3) // セル3の中央より少し左
  })

  it('セルの後ろ半分なら、次のセルの左端の線', () => {
    expect(nearestLineIndex(26 * 3 + 13, 26)).toBe(4) // セル3の中央
    expect(nearestLineIndex(26 * 3 + 25, 26)).toBe(4)
  })

  it('狙ったセルの左端を少し左に外しても、狙ったセルの線になる', () => {
    expect(nearestLineIndex(26 * 3 - 5, 26)).toBe(3)
  })
})

describe('dayLineAt', () => {
  it('スクロール量を足してから一番近い線を求める', () => {
    // カレンダーの左端が x=420、260px スクロール済み。x=430 は 270px 地点 → 10.4 → 線 10
    expect(dayLineAt(430, 420, 260, 26)).toBe(10)
    expect(dayLineAt(445, 420, 260, 26)).toBe(11)
  })
})

describe('createRangeBetweenLines', () => {
  it('右へ引いたら、線と線の間の日が期間になる', () => {
    expect(createRangeBetweenLines(3, 7, false)).toEqual({ startIndex: 3, endIndex: 6 })
  })

  it('左へ引いても、線と線の間の日が期間になる', () => {
    expect(createRangeBetweenLines(7, 3, true)).toEqual({ startIndex: 3, endIndex: 6 })
  })

  it('同じ線のままなら、ドラッグした向きの1日', () => {
    expect(createRangeBetweenLines(3, 3, false)).toEqual({ startIndex: 3, endIndex: 3 })
    expect(createRangeBetweenLines(3, 3, true)).toEqual({ startIndex: 2, endIndex: 2 })
  })
})
