import styles from './Bar.module.css'

type Props = {
  /** 表示範囲の何日目から始まるか */
  startIndex: number
  /** 何日分の長さか */
  span: number
  /** 表示範囲の外にはみ出していて、左端 / 右端が切れているか */
  clippedStart: boolean
  clippedEnd: boolean
}

/**
 * バー1本。位置と長さだけを受け取る「見た目専用」の部品にしておき、
 * 日付からの計算は呼び出し側で行う。Phase 2 でドラッグ操作を足すときもここを拡張する
 */
export function Bar({ startIndex, span, clippedStart, clippedEnd }: Props) {
  const className = [styles.bar, clippedStart && styles.clippedStart, clippedEnd && styles.clippedEnd]
    .filter(Boolean)
    .join(' ')
  return (
    <div
      className={className}
      style={{
        left: `calc(var(--day-width) * ${startIndex})`,
        width: `calc(var(--day-width) * ${span})`,
      }}
    />
  )
}
