import { addDays, getYmdParts, today, type Ymd } from '../../lib/date'
import { holidayName, isDayOff } from '../../lib/holiday'
import type { ViewRange } from '../../state/types'

// カレンダーの1日分の表示情報。ヘッダーと背景ストライプの両方で使うので、
// 祝日判定などを1回だけ計算してまとめておく
export type CalendarDay = {
  date: Ymd
  /** 表示範囲の何日目か(0 始まり)。横位置 = index × 列幅 */
  index: number
  dayOff: boolean
  holiday: string | null
  isToday: boolean
}

export function buildCalendarDays(view: ViewRange): CalendarDay[] {
  const todayYmd = today()
  return Array.from({ length: view.days }, (_, index) => {
    const date = addDays(view.start, index)
    return {
      date,
      index,
      dayOff: isDayOff(date),
      holiday: holidayName(date),
      isToday: date === todayYmd,
    }
  })
}

/** ヘッダー1段目用: 同じ月が続く日をひとまとめにする */
export type MonthSpan = { year: number; month: number; startIndex: number; days: number }

export function groupByMonth(days: CalendarDay[]): MonthSpan[] {
  const spans: MonthSpan[] = []
  for (const day of days) {
    const { year, month } = getYmdParts(day.date)
    const last = spans.at(-1)
    if (last && last.year === year && last.month === month) {
      last.days++
    } else {
      spans.push({ year, month, startIndex: day.index, days: 1 })
    }
  }
  return spans
}
