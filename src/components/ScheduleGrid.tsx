import { useMemo, type Dispatch } from 'react'
import { useBarSelection } from '../hooks/useBarSelection'
import { layoutCssVars } from '../layout'
import type { ScheduleAction, ScheduleState } from '../state/types'
import { CalendarBody } from './Calendar/CalendarBody'
import { CalendarHeader } from './Calendar/CalendarHeader'
import { buildCalendarDays } from './Calendar/calendarDays'
import styles from './ScheduleGrid.module.css'
import { TaskTable, TaskTableHeader } from './TaskTable/TaskTable'

type Props = {
  state: ScheduleState
  dispatch: Dispatch<ScheduleAction>
}

/**
 * 縦横スクロールするコンテナ全体。
 *
 * スクロールする箱は1つだけにして、左ペインとヘッダーを position: sticky で固定している。
 * 左右を別々のスクロール領域にすると縦スクロール位置を JS で合わせる必要があり、
 * 行がずれる原因になる。1つの箱なら、左右の行は同じ流れの中にあるので高さが自然にそろう
 */
export function ScheduleGrid({ state, dispatch }: Props) {
  const { tasks, view } = state
  // 祝日判定などを含むので、表示範囲が変わったときだけ計算し直す
  const days = useMemo(() => buildCalendarDays(view), [view])
  const { selectedId, select } = useBarSelection(dispatch)

  return (
    <div className={styles.scroll} style={layoutCssVars}>
      <div
        className={styles.inner}
        style={{ width: `calc(var(--left-pane-width) + var(--day-width) * ${view.days})` }}
      >
        <div className={styles.headerArea}>
          <div className={styles.corner}>
            <TaskTableHeader />
          </div>
          <CalendarHeader days={days} />
        </div>
        <div className={styles.bodyArea}>
          <div className={styles.leftPane}>
            <TaskTable tasks={tasks} viewStart={view.start} dispatch={dispatch} />
          </div>
          <div className={styles.calendar}>
            <CalendarBody
              days={days}
              tasks={tasks}
              view={view}
              selectedId={selectedId}
              onSelect={select}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
