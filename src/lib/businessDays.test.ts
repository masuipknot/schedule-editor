import { describe, expect, it } from 'vitest'
import { countBusinessDays, formatBusinessDays, formatDragLabel } from './businessDays'

describe('countBusinessDays', () => {
  it('土日を除く(2026/11/9 月〜11/15 日 は5日)', () => {
    expect(countBusinessDays('2026-11-09', '2026-11-15')).toBe(5)
  })

  it('祝日を除く(2026/11/2〜11/6 は 11/3 文化の日を除いて4日)', () => {
    expect(countBusinessDays('2026-11-02', '2026-11-06')).toBe(4)
  })

  it('振替休日・国民の休日も除く(2026/9/19 土〜9/23 水 はすべて休み)', () => {
    // 9/21 敬老の日、9/22 国民の休日、9/23 秋分の日
    expect(countBusinessDays('2026-09-19', '2026-09-23')).toBe(0)
    // 5/6 はこどもの日の振替休日
    expect(countBusinessDays('2026-05-06', '2026-05-08')).toBe(2)
  })

  it('1日だけのタスク', () => {
    expect(countBusinessDays('2026-11-16', '2026-11-16')).toBe(1) // 月曜
    expect(countBusinessDays('2026-11-15', '2026-11-15')).toBe(0) // 日曜
  })

  it('月や年をまたいでも数えられる', () => {
    // 2026/12/28 月〜2027/1/5 火: 12/28〜31 の4日 + 1/4・1/5 の2日(1/1 元日、1/2・1/3 は土日)
    expect(countBusinessDays('2026-12-28', '2027-01-05')).toBe(6)
  })

  it('開始日が終了日より後なら 0', () => {
    expect(countBusinessDays('2026-11-20', '2026-11-16')).toBe(0)
  })
})

describe('formatBusinessDays', () => {
  it('「○営業日」の形にする', () => {
    expect(formatBusinessDays('2026-11-02', '2026-11-06')).toBe('4営業日')
  })
})

describe('formatDragLabel', () => {
  it('期間と営業日数を並べる(バーの右の営業日数と同じ数え方)', () => {
    // 11/5 木〜11/18 水: 土日(7・8・14・15日)を除いて 10営業日
    expect(formatDragLabel('2026-11-05', '2026-11-18')).toBe('11/5(木)〜11/18(水) 10営業日')
    // 祝日を含む: 11/2 月〜11/6 金 は 11/3 文化の日を除いて 4営業日
    expect(formatDragLabel('2026-11-02', '2026-11-06')).toBe('11/2(月)〜11/6(金) 4営業日')
  })
})
