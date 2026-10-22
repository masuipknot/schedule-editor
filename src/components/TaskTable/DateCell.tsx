import { useRef, useState } from 'react'
import { formatMD, formatYmdSlash, parseDateInput, type Ymd } from '../../lib/date'
import styles from './TaskTable.module.css'

type Props = {
  value: Ymd | null
  /** 年を省略した入力の解釈に使う(表示開始日) */
  viewStart: Ymd
  /** 確定した値を渡す。空欄にした場合は null */
  onCommit: (value: Ymd | null) => void
  ariaLabel: string
}

/**
 * 開始日・終了日の入力セル(Phase 1 の簡易版。選択/編集モードは Phase 4 で作る)。
 *
 * 入力中の文字列(draft)はこの部品の中だけで持ち、確定(blur / Enter)したときに初めて
 * 日付として解釈して親に渡す。入力のたびに解釈すると、"4/" のような打ちかけの状態で
 * データが壊れてしまうため。
 */
export function DateCell({ value, viewStart, onCommit, ariaLabel }: Props) {
  // null = 編集していない(保存済みの値を M/D で表示する)
  const [draft, setDraft] = useState<string | null>(null)
  // 解釈できない入力を確定しようとしたら赤枠にする。次に入力を始めたら消す
  const [invalid, setInvalid] = useState(false)
  // Esc で取り消したとき、直後の blur で確定処理が走らないようにする目印。
  // state だと blur の時点ではまだ古い値が見えてしまうので、すぐに反映される ref を使う
  const cancelingRef = useRef(false)

  const display = value ? formatMD(value) : ''

  function commit() {
    if (cancelingRef.current) {
      cancelingRef.current = false
      setDraft(null)
      return
    }
    if (draft === null) return
    const text = draft.trim()
    setDraft(null)
    if (text === display) return // 変更なし
    if (text === '') {
      setInvalid(false)
      onCommit(null)
      return
    }
    const parsed = parseDateInput(text, viewStart)
    if (parsed === null) {
      // 確定せず元の値に戻す(draft を null にしたので value の表示に戻る)
      setInvalid(true)
      return
    }
    setInvalid(false)
    onCommit(parsed)
  }

  return (
    <input
      className={[styles.cell, styles.dateCell, invalid && styles.invalid].filter(Boolean).join(' ')}
      value={draft ?? display}
      // 表示は M/D だけなので、年をまたぐときに見分けられるよう年付きの日付をツールチップで出す
      title={value ? formatYmdSlash(value) : undefined}
      aria-label={ariaLabel}
      aria-invalid={invalid}
      onFocus={() => setDraft(display)}
      onChange={(e) => {
        setDraft(e.target.value)
        setInvalid(false)
      }}
      onBlur={commit}
      onKeyDown={(e) => {
        // 日本語入力の変換確定の Enter では確定しない
        if (e.nativeEvent.isComposing) return
        if (e.key === 'Enter') {
          e.currentTarget.blur() // blur → commit が呼ばれる
        } else if (e.key === 'Escape') {
          cancelingRef.current = true
          e.currentTarget.blur() // blur → commit が呼ばれるが、取り消しとして扱われる
        }
      }}
    />
  )
}
