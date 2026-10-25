import { useMemo, useRef, type Dispatch } from 'react'
import { useBarDrag } from '../hooks/useBarDrag'
import { useBarSelection } from '../hooks/useBarSelection'
import { useCellSelection } from '../hooks/useCellSelection'
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
  /** 利用者への短いお知らせ(ペーストで日付をスキップした件数など)を出す */
  onNotice: (message: string) => void
}

/**
 * 縦横スクロールするコンテナ全体。
 *
 * スクロールする箱は1つだけにして、左ペインとヘッダーを position: sticky で固定している。
 * 左右を別々のスクロール領域にすると縦スクロール位置を JS で合わせる必要があり、
 * 行がずれる原因になる。1つの箱なら、左右の行は同じ流れの中にあるので高さが自然にそろう
 */
export function ScheduleGrid({ state, dispatch, onNotice }: Props) {
  const { tasks, view } = state
  // 祝日判定などを含むので、表示範囲が変わったときだけ計算し直す
  const days = useMemo(() => buildCalendarDays(view), [view])
  const { selectedId, select } = useBarSelection(dispatch)
  // スクロールコンテナの DOM 要素。ドラッグ処理でスクロール量を読んだり、ポインタをキャプチャしたりする
  const scrollRef = useRef<HTMLDivElement>(null)
  const { preview, handleBarPointerDown, handleEmptyRowPointerDown, containerHandlers } =
    useBarDrag({ scrollRef, dispatch, viewStart: view.start, onSelect: select })
  // 左ペインのセル選択・編集・コピー/ペースト。列見出し(角)と本体の両方で使うので、ここで持つ
  const cellSelection = useCellSelection({ tasks, viewStart: view.start, dispatch, onNotice })

  return (
    <div ref={scrollRef} className={styles.scroll} style={layoutCssVars} {...containerHandlers}>
      <div
        className={styles.inner}
        style={{ width: `calc(var(--left-pane-width) + var(--day-width) * ${view.days})` }}
      >
        <div className={styles.headerArea}>
          <div className={styles.corner}>
            <TaskTableHeader selection={cellSelection} />
          </div>
          <CalendarHeader days={days} />
        </div>
        <div className={styles.bodyArea}>
          <div className={styles.leftPane}>
            <TaskTable tasks={tasks} selection={cellSelection} />
          </div>
          <div className={styles.calendar}>
            <CalendarBody
              days={days}
              tasks={tasks}
              view={view}
              selectedId={selectedId}
              preview={preview}
              onBarPointerDown={handleBarPointerDown}
              onEmptyRowPointerDown={handleEmptyRowPointerDown}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
