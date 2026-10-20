import { diffDays } from '../../lib/date'
import type { Task, ViewRange } from '../../state/types'
import { Bar } from '../Bar'
import type { CalendarDay } from './calendarDays'
import styles from './Calendar.module.css'

type Props = {
  days: CalendarDay[]
  tasks: Task[]
  view: ViewRange
  selectedId: string | null
  onSelect: (id: string) => void
}

/**
 * カレンダーの本体。「行 × 日」のセルは作らず、
 *  - 日ごとの縦ストライプ(土日祝のグレーと縦罫線)
 *  - 行ごとの横罫線
 *  - 行ごとに最大1本のバー
 * を重ねて描く。セル方式だと 30行 × 120日 = 3600 個以上の要素になり、操作が重くなるため
 */
export function CalendarBody({ days, tasks, view, selectedId, onSelect }: Props) {
  return (
    <div
      className={styles.body}
      style={{ height: `calc(var(--row-height) * ${tasks.length})` }}
    >
      {days.map((d) => (
        <div
          key={d.date}
          className={[styles.stripe, d.dayOff && styles.dayOff].filter(Boolean).join(' ')}
          style={{ left: `calc(var(--day-width) * ${d.index})` }}
        >
          {d.isToday && <div className={styles.todayLine} />}
        </div>
      ))}

      {tasks.map((task, row) => (
        <div
          key={task.id}
          className={styles.rowLine}
          style={{ top: `calc(var(--row-height) * ${row})` }}
        >
          <TaskBar
            task={task}
            view={view}
            selected={task.id === selectedId}
            onSelect={() => onSelect(task.id)}
          />
        </div>
      ))}
    </div>
  )
}

type TaskBarProps = {
  task: Task
  view: ViewRange
  selected: boolean
  onSelect: () => void
}

/** タスクの日付から、バーを表示範囲のどこに置くかを計算する */
function TaskBar({ task, view, selected, onSelect }: TaskBarProps) {
  if (task.start === null || task.end === null) return null

  const startIndex = diffDays(view.start, task.start)
  const endIndex = diffDays(view.start, task.end) // 終了日も含むので、右端は endIndex + 1
  // 表示開始日を後ろにずらした場合などは、見えている部分だけを描く
  const left = Math.max(startIndex, 0)
  const right = Math.min(endIndex + 1, view.days)
  if (right <= left) return null

  return (
    <Bar
      startIndex={left}
      span={right - left}
      clippedStart={startIndex < 0}
      clippedEnd={endIndex + 1 > view.days}
      selected={selected}
      onSelect={onSelect}
    />
  )
}
