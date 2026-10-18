import { formatYmdSlash, getYmdParts, weekdayJa } from '../../lib/date'
import { groupByMonth, type CalendarDay } from './calendarDays'
import styles from './Calendar.module.css'

type Props = {
  days: CalendarDay[]
}

/** カレンダーのヘッダー3段(月 / 日 / 曜日) */
export function CalendarHeader({ days }: Props) {
  const months = groupByMonth(days)

  return (
    <div className={styles.header}>
      <div className={styles.headerRow}>
        {months.map((m, i) => (
          <div
            key={`${m.year}-${m.month}`}
            className={styles.monthCell}
            // 幅は「その月の表示日数 × 列幅」。列幅は CSS 変数なので calc で掛け算する
            style={{ width: `calc(var(--day-width) * ${m.days})` }}
          >
            {/* 先頭と1月だけ年を出す(年の切り替わりが分かるように) */}
            <span className={styles.monthLabel}>
              {i === 0 || m.month === 1 ? `${m.year}年${m.month}月` : `${m.month}月`}
            </span>
          </div>
        ))}
      </div>
      <div className={styles.headerRow}>
        {days.map((d) => (
          <DayCell key={d.date} day={d} label={String(getYmdParts(d.date).day)} />
        ))}
      </div>
      <div className={styles.headerRow}>
        {days.map((d) => (
          <DayCell key={d.date} day={d} label={weekdayJa(d.date)} />
        ))}
      </div>
    </div>
  )
}

function DayCell({ day, label }: { day: CalendarDay; label: string }) {
  const className = [styles.dayCell, day.dayOff && styles.dayOff, day.isToday && styles.today]
    .filter(Boolean)
    .join(' ')
  // 祝日はマウスを乗せると祝日名を表示。title 属性ならブラウザ標準のツールチップで済む
  const title = day.holiday ? `${formatYmdSlash(day.date)} ${day.holiday}` : undefined
  return (
    <div className={className} title={title}>
      {label}
    </div>
  )
}
