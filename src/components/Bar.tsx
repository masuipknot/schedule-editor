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
  onSelect: () => void
}

/**
 * バー1本。位置と長さだけを受け取る「見た目専用」の部品にしておき、
 * 日付からの計算や選択状態の管理は呼び出し側で行う
 */
export function Bar({ startIndex, span, clippedStart, clippedEnd, selected, onSelect }: Props) {
  const className = [
    styles.bar,
    clippedStart && styles.clippedStart,
    clippedEnd && styles.clippedEnd,
    selected && styles.selected,
  ]
    .filter(Boolean)
    .join(' ')
  return (
    <div
      className={className}
      // 「バー以外をクリックしたら選択解除」の判定用の目印(useBarSelection.ts で使う)
      data-bar
      style={{
        left: `calc(var(--day-width) * ${startIndex})`,
        width: `calc(var(--day-width) * ${span})`,
      }}
      onClick={onSelect}
    />
  )
}
