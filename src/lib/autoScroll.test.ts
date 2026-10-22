import { describe, expect, it } from 'vitest'
import { autoScrollSpeed } from './autoScroll'

// カレンダーが見えている領域: x = 420 〜 1280。端から 40px 以内で、最大 20px/フレーム
describe('autoScrollSpeed', () => {
  it('端から離れていればスクロールしない', () => {
    expect(autoScrollSpeed(800, 420, 1280)).toBe(0)
    expect(autoScrollSpeed(420 + 40, 420, 1280)).toBe(0)
    expect(autoScrollSpeed(1280 - 40, 420, 1280)).toBe(0)
  })

  it('右端に近づくと右向き(プラス)、近いほど速い', () => {
    const far = autoScrollSpeed(1280 - 30, 420, 1280)
    const near = autoScrollSpeed(1280 - 5, 420, 1280)
    expect(far).toBeGreaterThan(0)
    expect(near).toBeGreaterThan(far)
  })

  it('左端に近づくと左向き(マイナス)', () => {
    expect(autoScrollSpeed(420 + 10, 420, 1280)).toBeLessThan(0)
  })

  it('端ちょうど、または領域の外(ウィンドウの外も含む)では最大の速さ', () => {
    expect(autoScrollSpeed(1280, 420, 1280)).toBe(20)
    expect(autoScrollSpeed(1500, 420, 1280)).toBe(20)
    expect(autoScrollSpeed(420, 420, 1280)).toBe(-20)
    expect(autoScrollSpeed(100, 420, 1280)).toBe(-20) // 左ペインの上
    expect(autoScrollSpeed(-50, 420, 1280)).toBe(-20)
  })

  it('端の範囲に入ったばかりでも、最低 1px は動く', () => {
    expect(autoScrollSpeed(1280 - 39.9, 420, 1280)).toBe(1)
  })
})
