import type { useCellSelection } from '../../hooks/useCellSelection'
import type { CellPos, ColumnIndex } from '../../lib/cellRange'
import { formatYmdSlash } from '../../lib/date'
import type { Task } from '../../state/types'
import styles from './TaskTable.module.css'

/** useCellSelection が返すもの(左ペインの操作一式)。見出しと本体の両方で使う */
type CellSelection = ReturnType<typeof useCellSelection>

const COLUMNS: { col: ColumnIndex; label: string; className: string }[] = [
  { col: 0, label: '項目名', className: styles.nameCol },
  { col: 1, label: '開始日', className: styles.dateCol },
  { col: 2, label: '終了日', className: styles.dateCol },
]

/**
 * 左ペインの列見出し(左上の角。縦横どちらにスクロールしても固定される)。
 * クリックで列全体、Shift+クリックで複数列を選ぶ
 */
export function TaskTableHeader({ selection }: { selection: CellSelection }) {
  return (
    <div className={styles.headerRow}>
      {COLUMNS.map(({ col, label, className }) => (
        <div
          key={col}
          className={[
            styles.headerCell,
            className,
            selection.isColumnSelected(col) && styles.headerSelected,
          ]
            .filter(Boolean)
            .join(' ')}
          onPointerDown={(e) => selection.handleHeaderPointerDown(e, col)}
        >
          {label}
        </div>
      ))}
    </div>
  )
}

type Props = {
  tasks: Task[]
  selection: CellSelection
}

/**
 * 左ペイン(項目名・開始日・終了日)。
 * 表示は tasks から、選択・編集の状態は selection(useCellSelection)から受け取るだけで、
 * 自分では状態を持たない。キーボード・コピー/ペーストは、セルから伝わってきたイベントを
 * この外枠でまとめて受け取る
 */
export function TaskTable({ tasks, selection }: Props) {
  return (
    <div role="grid" aria-label="タスク一覧" {...selection.containerHandlers}>
      {tasks.map((task, row) => (
        <div key={task.id} className={styles.row} role="row">
          {COLUMNS.map(({ col, label }) => (
            <Cell
              key={col}
              task={task}
              pos={{ row, col }}
              label={`${row + 1}行目 ${label}`}
              selection={selection}
            />
          ))}
        </div>
      ))}
    </div>
  )
}

type CellProps = {
  task: Task
  pos: CellPos
  label: string
  selection: CellSelection
}

/**
 * 1つのセル。選択モードでも編集モードでも、中身は同じ input にしておく。
 * 選択モードではカーソルを隠し、マウスでの文字選択を止めているので、見た目は表のセルとして振る舞う。
 * こうしておくと「選択中に文字を打ったら、その文字から編集が始まる」が、日本語入力でも自然に動く
 */
function Cell({ task, pos, label, selection }: CellProps) {
  const { editing, focused, inRange, invalid, value } = selection.cellState(pos)
  const date = pos.col === 1 ? task.start : pos.col === 2 ? task.end : null

  return (
    <input
      ref={(el) => selection.registerInput(pos, el)}
      className={[
        styles.cell,
        pos.col === 0 ? styles.nameCol : styles.dateCell,
        inRange && styles.inRange,
        focused && styles.focused,
        editing && styles.editing,
        invalid && styles.invalid,
      ]
        .filter(Boolean)
        .join(' ')}
      value={value}
      // 表示は M/D だけなので、年をまたぐときに見分けられるよう年付きの日付をツールチップで出す
      title={date ? formatYmdSlash(date) : undefined}
      aria-label={label}
      aria-invalid={invalid}
      // Tab キーは表の中の移動に使うので、ブラウザ標準の Tab 移動で止まるのは1セルだけにする
      // (選んでいるセル。何も選んでいなければ先頭のセル)
      tabIndex={focused || (!selection.hasSelection && pos.row === 0 && pos.col === 0) ? 0 : -1}
      onChange={(e) => selection.setDraft(pos, e.target.value)}
      onPointerDown={(e) => selection.handleCellPointerDown(e, pos)}
      onPointerEnter={() => selection.handleCellPointerEnter(pos)}
      onDoubleClick={() => selection.handleCellDoubleClick(pos)}
      onFocus={() => selection.handleCellFocus(pos)}
    />
  )
}
