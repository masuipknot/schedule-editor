// 営業日数の計算(SPEC 5章)
//
// 休日かどうかの判定は holiday.ts の isDayOff に任せる。
// こうしておくと、祝日ライブラリへの依存は holiday.ts に閉じたままで、
// 将来「会社独自の休日」を足すときも isDayOff を直せば営業日数にも反映される(SPEC 11章 #6・#9)

import { addDays, diffDays, formatDateRange, type Ymd } from './date'
import { isDayOff } from './holiday'

/**
 * start〜end(両端を含む)のうち、土日・祝日(振替休日・国民の休日を含む)を除いた日数。
 * start > end のときは 0(不変条件で起きない想定だが、念のため)
 */
export function countBusinessDays(start: Ymd, end: Ymd): number {
  const days = diffDays(start, end) + 1
  let count = 0
  for (let i = 0; i < days; i++) {
    if (!isDayOff(addDays(start, i))) count++
  }
  return count
}

/** バーの右に出す表示(例: 「4営業日」) */
export function formatBusinessDays(start: Ymd, end: Ymd): string {
  return `${countBusinessDays(start, end)}営業日`
}

/**
 * ドラッグ中のツールチップ(例: 「11/5(木)〜11/18(水) 10営業日」)。
 * 日数はバーの右の営業日数と同じ数え方にそろえる(同じ関数を使うので、表示が食い違わない)
 */
export function formatDragLabel(start: Ymd, end: Ymd): string {
  return `${formatDateRange(start, end)} ${formatBusinessDays(start, end)}`
}
