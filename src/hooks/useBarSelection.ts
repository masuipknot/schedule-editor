import { useEffect, useState, type Dispatch } from 'react'
import type { ScheduleAction } from '../state/types'

/** バーの要素には data-bar 属性を付けている(Bar.tsx)。「バー以外をクリックしたか」の判定に使う */
const BAR_SELECTOR = '[data-bar]'

/** キー入力が文字入力欄に向いているか(セル編集中の Delete は文字の削除なので、バー削除にしない) */
function isTypingTarget(target: EventTarget | null): boolean {
  return (
    target instanceof HTMLElement &&
    (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName))
  )
}

/**
 * カレンダー上のバーの選択状態を管理する。
 *
 * 選択は「画面上の一時的な状態」なので reducer(保存するデータ)には入れず、ここで useState で持つ。
 * 選択中のバーを消すときだけ、reducer に CLEAR_DATES を頼む。
 */
export function useBarSelection(dispatch: Dispatch<ScheduleAction>) {
  const [selectedId, setSelectedId] = useState<string | null>(null)

  useEffect(() => {
    // 何も選ばれていないときはイベントを監視する必要がない
    if (selectedId === null) return
    // 下の関数の中でも「null ではない」ことが型で分かるよう、定数に入れておく
    const id = selectedId

    function handleKeyDown(e: KeyboardEvent) {
      if (e.isComposing || isTypingTarget(e.target)) return
      // Mac の「delete」キーは Backspace として届くので、両方を処理する
      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault() // ブラウザによっては Backspace で「戻る」が動くのを防ぐ
        dispatch({ type: 'CLEAR_DATES', id })
        setSelectedId(null)
      } else if (e.key === 'Escape') {
        setSelectedId(null)
      }
    }

    // バー以外の場所(左ペインやツールバーも含む)を押したら選択解除。
    // 画面のどこを押しても検知できるよう、個々の要素ではなく window で受ける
    function handlePointerDown(e: PointerEvent) {
      if (e.target instanceof Element && e.target.closest(BAR_SELECTOR)) return
      setSelectedId(null)
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('pointerdown', handlePointerDown)
    // 選択が変わる・画面が消えるときに、付けたリスナーを外す(付けっぱなしだと二重に反応する)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('pointerdown', handlePointerDown)
    }
  }, [selectedId, dispatch])

  return { selectedId, select: setSelectedId }
}
