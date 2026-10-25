import { describe, expect, it } from 'vitest'
import { containsPos, movePos, rectOf } from './cellRange'

describe('rectOf', () => {
  it('どちら向きに選んでも、上下左右の端をそろえた矩形になる', () => {
    expect(rectOf({ row: 5, col: 2 }, { row: 1, col: 0 })).toEqual({
      top: 1,
      bottom: 5,
      left: 0,
      right: 2,
    })
  })

  it('1セルだけでも矩形になる', () => {
    expect(rectOf({ row: 3, col: 1 }, { row: 3, col: 1 })).toEqual({
      top: 3,
      bottom: 3,
      left: 1,
      right: 1,
    })
  })
})

describe('containsPos', () => {
  const rect = { top: 1, bottom: 3, left: 1, right: 2 } as const
  it('範囲の内側(端を含む)なら true', () => {
    expect(containsPos(rect, { row: 1, col: 1 })).toBe(true)
    expect(containsPos(rect, { row: 3, col: 2 })).toBe(true)
  })
  it('範囲の外なら false', () => {
    expect(containsPos(rect, { row: 0, col: 1 })).toBe(false)
    expect(containsPos(rect, { row: 2, col: 0 })).toBe(false)
  })
})

describe('movePos', () => {
  it('上下左右に動く', () => {
    expect(movePos({ row: 2, col: 1 }, 1, 0, 30)).toEqual({ row: 3, col: 1 })
    expect(movePos({ row: 2, col: 1 }, 0, -1, 30)).toEqual({ row: 2, col: 0 })
  })

  it('表の端で止まる', () => {
    expect(movePos({ row: 0, col: 0 }, -1, -1, 30)).toEqual({ row: 0, col: 0 })
    expect(movePos({ row: 29, col: 2 }, 1, 1, 30)).toEqual({ row: 29, col: 2 })
  })
})
