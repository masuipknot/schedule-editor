// 祝日判定
//
// 祝日ライブラリ(@holiday-jp/holiday_jp)への依存はこのファイルだけに閉じ込める。
// 将来ライブラリを差し替えたり、会社独自の休日を足したりするときに、直すのがここだけで済むようにするため。

import holidayJp from '@holiday-jp/holiday_jp'
import { isWeekend, type Ymd } from './date'

// ライブラリの holidays は "YYYY-MM-DD" をキーにした表になっている。
// isHoliday(Date) も用意されているが、Date を渡すとタイムゾーンの影響を受けるので、
// 文字列キーで直接引く(このアプリの日付も同じ形式なので変換が要らない)
const holidays: Readonly<Record<string, { name: string } | undefined>> = holidayJp.holidays

// ライブラリでは「国民の休日」(祝日に挟まれた平日)の名前が単に「休日」になっているので、
// ツールチップで意味が伝わるように言い換える
const NAME_OVERRIDES: Readonly<Record<string, string>> = {
  休日: '国民の休日',
}

/** 祝日・振替休日・国民の休日なら true(土日は含まない) */
export function isHoliday(date: Ymd): boolean {
  return holidays[date] !== undefined
}

/** 祝日名。祝日でなければ null */
export function holidayName(date: Ymd): string | null {
  const name = holidays[date]?.name
  if (name === undefined) return null
  return NAME_OVERRIDES[name] ?? name
}

/** 土日または祝日(カレンダーをグレーにする日) */
export function isDayOff(date: Ymd): boolean {
  return isWeekend(date) || isHoliday(date)
}
