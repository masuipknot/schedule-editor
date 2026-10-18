import type { Dispatch } from 'react'
import type { Ymd } from '../../lib/date'
import type { ScheduleAction, Task } from '../../state/types'
import { DateCell } from './DateCell'
import styles from './TaskTable.module.css'

type Props = {
  tasks: Task[]
  viewStart: Ymd
  dispatch: Dispatch<ScheduleAction>
}

/** 左ペインの列見出し(左上の角。縦横どちらにスクロールしても固定される) */
export function TaskTableHeader() {
  return (
    <div className={styles.headerRow}>
      <div className={`${styles.headerCell} ${styles.nameCol}`}>項目名</div>
      <div className={`${styles.headerCell} ${styles.dateCol}`}>開始日</div>
      <div className={`${styles.headerCell} ${styles.dateCol}`}>終了日</div>
    </div>
  )
}

/**
 * 左ペイン(項目名・開始日・終了日)。
 * 自分では状態を持たず、表示は tasks から、変更は dispatch で reducer に頼む。
 * こうしておくと、右のバーと左の日付が必ず同じデータを表示することになる
 */
export function TaskTable({ tasks, viewStart, dispatch }: Props) {
  return (
    <div>
      {tasks.map((task, row) => (
        <div key={task.id} className={styles.row}>
          <input
            className={`${styles.cell} ${styles.nameCol}`}
            value={task.name}
            aria-label={`${row + 1}行目 項目名`}
            onChange={(e) => dispatch({ type: 'UPDATE_NAME', id: task.id, name: e.target.value })}
          />
          <DateCell
            value={task.start}
            viewStart={viewStart}
            ariaLabel={`${row + 1}行目 開始日`}
            onCommit={(start) =>
              dispatch(
                start === null
                  ? { type: 'CLEAR_DATES', id: task.id }
                  : { type: 'SET_DATES', id: task.id, start, end: task.end },
              )
            }
          />
          <DateCell
            value={task.end}
            viewStart={viewStart}
            ariaLabel={`${row + 1}行目 終了日`}
            onCommit={(end) =>
              dispatch(
                end === null
                  ? { type: 'CLEAR_DATES', id: task.id }
                  : { type: 'SET_DATES', id: task.id, start: task.start, end },
              )
            }
          />
        </div>
      ))}
    </div>
  )
}
