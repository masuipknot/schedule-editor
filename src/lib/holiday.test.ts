import { describe, expect, it } from 'vitest'
import { holidayName, isDayOff, isHoliday } from './holiday'

// SPEC 5章「確認用テストケース(2026年)」。
// 振替休日・国民の休日は漏れやすいので、ライブラリが正しく返すことをここで確認しておく
describe('2026年の祝日', () => {
  it.each([
    ['2026-04-29', '昭和の日'],
    ['2026-05-03', '憲法記念日'],
    ['2026-05-04', 'みどりの日'],
    ['2026-05-05', 'こどもの日'],
    ['2026-05-06', 'こどもの日 振替休日'],
    ['2026-09-21', '敬老の日'],
    ['2026-09-22', '国民の休日'],
    ['2026-09-23', '秋分の日'],
  ])('%s は %s', (date, name) => {
    expect(isHoliday(date)).toBe(true)
    expect(holidayName(date)).toBe(name)
    expect(isDayOff(date)).toBe(true)
  })

  it('平日は祝日ではない', () => {
    expect(isHoliday('2026-04-28')).toBe(false)
    expect(holidayName('2026-04-28')).toBeNull()
    expect(isDayOff('2026-04-28')).toBe(false)
  })

  it('土日は祝日ではないが休み扱い', () => {
    expect(isHoliday('2026-04-04')).toBe(false)
    expect(isDayOff('2026-04-04')).toBe(true)
  })
})
