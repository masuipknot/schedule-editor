import type { PointerEvent } from 'react'
import styles from './Bar.module.css'

type Props = {
  /** 表示範囲の何日目から始まるか */
  startIndex: number
  /** 何日分の長さか */
  span: number
  /** 表示範囲の外にはみ出していて、左端 / 右端が切れているか */
  clippedStart: boolean
  clippedEnd: boolean
  selected: boolean
  /** ドラッグ中か(見た目を変える) */
  dragging: boolean
  /** ドラッグ中に出す「4/13(月)〜4/16(木) 4日間」のような説明。なければ出さない */
  tooltip: string | null
  onPointerDown: (e: PointerEvent) => void
}

/**
 * バー1本。位置と長さだけを受け取る「見た目専用」の部品にしておき、
 * 日付からの計算やドラッグの処理は呼び出し側(フック)で行う。
 *
 * 左右の端に幅 6px の透明なつまみを重ねている。どこをつかんだかを data-drag-mode で
 * 伝えるのと同時に、CSS だけでカーソルの形(ew-resize / grab)を切り替えられるため
 */
export function Bar({
  startIndex,
  span,
  clippedStart,
  clippedEnd,
  selected,
  dragging,
  tooltip,
  onPointerDown,
}: Props) {
  const className = [
    styles.bar,
    clippedStart && styles.clippedStart,
    clippedEnd && styles.clippedEnd,
    selected && styles.selected,
    dragging && styles.dragging,
  ]
    .filter(Boolean)
    .join(' ')
  return (
    <div
      className={className}
      // 「バー以外をクリックしたら選択解除」の判定用の目印(useBarSelection.ts で使う)
      data-bar
      data-drag-mode="move"
      style={{
        left: `calc(var(--day-width) * ${startIndex})`,
        width: `calc(var(--day-width) * ${span})`,
      }}
      onPointerDown={onPointerDown}
    >
      <div className={`${styles.handle} ${styles.handleStart}`} data-drag-mode="resize-start" />
      <div className={`${styles.handle} ${styles.handleEnd}`} data-drag-mode="resize-end" />
      {tooltip && <div className={styles.tooltip}>{tooltip}</div>}
    </div>
  )
}
