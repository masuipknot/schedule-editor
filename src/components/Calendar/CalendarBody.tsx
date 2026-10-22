import { useState, type PointerEvent } from 'react'
import type { DragPreview } from '../../hooks/useBarDrag'
import { nearestLineIndex } from '../../lib/barDrag'
import { diffDays, formatRangeLabel } from '../../lib/date'
import { ROW_HEIGHT } from '../../layout'
import type { Task, ViewRange } from '../../state/types'
import { Bar } from '../Bar'
import type { CalendarDay } from './calendarDays'
import styles from './Calendar.module.css'

type Props = {
  days: CalendarDay[]
  tasks: Task[]
  view: ViewRange
  selectedId: string | null
  preview: DragPreview | null
  onBarPointerDown: (e: PointerEvent, task: Task) => void
  /** 日付のない行の空き部分を押したとき(ドラッグで新規作成する)。task は新規作成の対象の行 */
  onEmptyRowPointerDown: (e: PointerEvent, task: Task) => void
}

/**
 * カレンダーの本体。「行 × 日」のセルは作らず、
 *  - 日ごとの縦ストライプ(土日祝の休日色と縦罫線)
 *  - 行ごとの横罫線
 *  - 行ごとに最大1本のバー
 * を重ねて描く。セル方式だと 30行 × 120日 = 3600 個以上の要素になり、操作が重くなるため
 */
export function CalendarBody({
  days,
  tasks,
  view,
  selectedId,
  preview,
  onBarPointerDown,
  onEmptyRowPointerDown,
}: Props) {
  // ポインタが「新規作成できる位置」の上にあるか。カーソルを十字にするために使う
  const [hoverCreatable, setHoverCreatable] = useState(false)

  /**
   * ポインタの位置から、新規作成の対象になる行を求める(対象がなければ null)。
   * 行は「一番近い横線」で決める: 行の上半分ならその行、下半分なら下の行。
   * 日付のある行や、最終行より下は対象外
   */
  function creatableTaskAt(e: PointerEvent<HTMLDivElement>): Task | null {
    // バーの上では、バーの操作(選択・移動・伸縮)を優先する
    if (e.target instanceof Element && e.target.closest('[data-bar]')) return null
    const offsetY = e.clientY - e.currentTarget.getBoundingClientRect().top
    const task = tasks.at(nearestLineIndex(offsetY, ROW_HEIGHT))
    return task && task.start === null ? task : null
  }

  return (
    <div
      className={[styles.body, hoverCreatable && styles.creatable].filter(Boolean).join(' ')}
      style={{ height: `calc(var(--row-height) * ${tasks.length})` }}
      // 押した行ではなく「一番近い横線」で対象の行が決まるので、行ごとではなく本体全体で受ける
      onPointerDown={(e) => {
        const task = creatableTaskAt(e)
        if (task) onEmptyRowPointerDown(e, task)
      }}
      onPointerMove={(e) => setHoverCreatable(creatableTaskAt(e) !== null)}
      onPointerLeave={() => setHoverCreatable(false)}
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
            preview={preview?.taskId === task.id ? preview : null}
            onPointerDown={(e) => onBarPointerDown(e, task)}
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
  /** このバーをドラッグ中なら、その仮の日付 */
  preview: DragPreview | null
  onPointerDown: (e: PointerEvent) => void
}

/** タスクの日付から、バーを表示範囲のどこに置くかを計算する */
function TaskBar({ task, view, selected, preview, onPointerDown }: TaskBarProps) {
  // ドラッグ中はプレビューの日付で描く。確定するまで task 自体は書き換えない
  const start = preview?.start ?? task.start
  const end = preview?.end ?? task.end
  if (start === null || end === null) return null

  const startIndex = diffDays(view.start, start)
  const endIndex = diffDays(view.start, end) // 終了日も含むので、右端は endIndex + 1
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
      dragging={preview !== null}
      tooltip={preview ? formatRangeLabel(start, end) : null}
      onPointerDown={onPointerDown}
    />
  )
}
