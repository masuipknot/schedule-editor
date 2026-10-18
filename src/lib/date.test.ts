import { describe, expect, it } from 'vitest'
import {
  addDays,
  compareYmd,
  dayOfWeek,
  diffDays,
  formatMD,
  formatYmdSlash,
  isValidDate,
  isWeekend,
  parseDateInput,
  startOfMonth,
  weekdayJa,
} from './date'

describe('addDays / diffDays', () => {
  it('月末・年末・うるう年をまたいで加算できる', () => {
    expect(addDays('2026-04-30', 1)).toBe('2026-05-01')
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01')
    expect(addDays('2028-02-28', 1)).toBe('2028-02-29')
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28')
  })

  it('日数の差を返す', () => {
    expect(diffDays('2026-04-01', '2026-04-01')).toBe(0)
    expect(diffDays('2026-04-01', '2026-04-10')).toBe(9)
    expect(diffDays('2026-04-10', '2026-04-01')).toBe(-9)
    expect(diffDays('2026-01-01', '2027-01-01')).toBe(365)
  })

  it('1日ずつ1年分足しても日付がずれない(UTC で計算しているため)', () => {
    let d = '2026-01-01'
    for (let i = 0; i < 365; i++) d = addDays(d, 1)
    expect(d).toBe('2027-01-01')
  })
})

describe('曜日', () => {
  it('2026-04-01 は水曜日', () => {
    expect(dayOfWeek('2026-04-01')).toBe(3)
    expect(weekdayJa('2026-04-01')).toBe('水')
  })

  it('土日を判定する', () => {
    expect(isWeekend('2026-04-04')).toBe(true) // 土
    expect(isWeekend('2026-04-05')).toBe(true) // 日
    expect(isWeekend('2026-04-06')).toBe(false) // 月
  })
})

describe('その他のユーティリティ', () => {
  it('compareYmd', () => {
    expect(compareYmd('2026-04-01', '2026-04-02')).toBe(-1)
    expect(compareYmd('2026-04-02', '2026-04-02')).toBe(0)
    expect(compareYmd('2026-12-01', '2026-04-02')).toBe(1)
  })

  it('startOfMonth', () => {
    expect(startOfMonth('2026-10-18')).toBe('2026-10-01')
  })

  it('isValidDate は存在しない日付を弾く', () => {
    expect(isValidDate(2026, 2, 28)).toBe(true)
    expect(isValidDate(2026, 2, 29)).toBe(false)
    expect(isValidDate(2028, 2, 29)).toBe(true)
    expect(isValidDate(2026, 13, 1)).toBe(false)
    expect(isValidDate(2026, 4, 31)).toBe(false)
  })

  it('表示用フォーマット', () => {
    expect(formatMD('2026-04-01')).toBe('4/1')
    expect(formatYmdSlash('2026-04-01')).toBe('2026/4/1')
  })
})

describe('parseDateInput', () => {
  const viewStart = '2026-04-01'

  it.each([
    ['4/1', '2026-04-01'],
    ['04/01', '2026-04-01'],
    ['4-1', '2026-04-01'],
    ['2026/4/1', '2026-04-01'],
    ['2026-04-01', '2026-04-01'],
    ['４／１', '2026-04-01'],
    ['２０２６／４／１', '2026-04-01'],
    [' 4/1 ', '2026-04-01'],
  ])('%s → %s', (input, expected) => {
    expect(parseDateInput(input, viewStart)).toBe(expected)
  })

  it('年を省略した場合は表示開始日から1年以内の年を選ぶ', () => {
    expect(parseDateInput('3/1', '2026-10-01')).toBe('2027-03-01')
    expect(parseDateInput('10/1', '2026-10-01')).toBe('2026-10-01')
    expect(parseDateInput('9/30', '2026-10-01')).toBe('2027-09-30')
    expect(parseDateInput('12/31', '2026-10-01')).toBe('2026-12-31')
  })

  it('年を省略した 2/29 は、該当する年がうるう年のときだけ受け付ける', () => {
    expect(parseDateInput('2/29', '2027-10-01')).toBe('2028-02-29')
    expect(parseDateInput('2/29', '2026-10-01')).toBeNull()
  })

  it.each(['', 'abc', '4/', '4/31', '13/1', '2026/2/30', '4/1/2026', '2026.4.1'])(
    '解釈できない "%s" は null',
    (input) => {
      expect(parseDateInput(input, viewStart)).toBeNull()
    },
  )
})
