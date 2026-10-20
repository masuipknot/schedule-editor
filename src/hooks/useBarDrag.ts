import {
  useEffect,
  useRef,
  useState,
  type Dispatch,
  type PointerEvent as ReactPointerEvent,
  type RefObject,
} from 'react'
import { applyDrag, dayIndexAt, DRAG_THRESHOLD_PX, type DragMode } from '../lib/barDrag'
import type { Ymd } from '../lib/date'
import { DAY_WIDTH, LEFT_PANE_WIDTH } from '../layout'
import type { ScheduleAction, Task } from '../state/types'

/** ドラッグ中に画面へ見せる「仮の」日付。確定するまで reducer には入れない */
export type DragPreview = {
  taskId: string
  mode: DragMode
  start: Ymd
  end: Ymd
}

/** 1回のドラッグ(pointerdown 〜 pointerup)の間だけ覚えておく情報 */
type DragSession = {
  taskId: string
  mode: DragMode
  pointerId: number
  /** ドラッグ開始時の日付。Esc で戻すときや、移動量の計算の基準に使う */
  original: { start: Ymd; end: Ymd }
  startClientX: number
  startDayIndex: number
  /** しきい値(4px)を超えて「ドラッグ」になったか。false のまま離したらクリック */
  dragging: boolean
  /** 今プレビューしている日付 */
  current: { start: Ymd; end: Ymd }
}

/** バーの端・中央の要素に付けた data-drag-mode を、型付きの DragMode に変換する */
function toDragMode(value: string | null | undefined): DragMode {
  return value === 'resize-start' || value === 'resize-end' ? value : 'move'
}

type Options = {
  /** 縦横スクロールするコンテナ。ポインタのキャプチャ先と、スクロール量の読み取りに使う */
  scrollRef: RefObject<HTMLDivElement | null>
  dispatch: Dispatch<ScheduleAction>
  /** バーを(ドラッグせずに)クリックしたとき、またはドラッグを始めたときに呼ぶ */
  onSelect: (taskId: string) => void
}

/**
 * バーの移動・伸縮のドラッグ処理。
 *
 * - ドラッグ中の日付は preview(このフックの state)にだけ持ち、pointerup で初めて SET_DATES を送る。
 *   1回のドラッグ = 1回の状態変更になり、将来 Undo を付けるときの単位として自然になる
 * - setPointerCapture はバーではなくスクロールコンテナに対して行う。
 *   バーはドラッグ中に再描画され、表示範囲の外に出ると消えることもあるので、
 *   消えない要素にイベントを受け取らせたほうが確実なため
 */
export function useBarDrag({ scrollRef, dispatch, onSelect }: Options) {
  // ポインタが動くたびに変わる値は ref に持つ(state にすると毎回再描画が起きるうえ、
  // イベント処理の中で古い値が見えてしまうことがある)
  const sessionRef = useRef<DragSession | null>(null)
  // 画面に反映したい値(プレビュー)だけを state にする
  const [preview, setPreview] = useState<DragPreview | null>(null)

  /** 画面上の x 座標を「表示範囲の何日目か」に変換する */
  function dayIndexFromClientX(clientX: number): number {
    const el = scrollRef.current
    if (!el) return 0
    // カレンダーが見えている左端 = スクロールコンテナの左端 + 固定された左ペインの幅
    const calendarLeft = el.getBoundingClientRect().left + LEFT_PANE_WIDTH
    return dayIndexAt(clientX, calendarLeft, el.scrollLeft, DAY_WIDTH)
  }

  /** ドラッグの後片付け。取り消し・確定・中断のどの場合も最後にこれを呼ぶ */
  function endSession() {
    sessionRef.current = null
    setPreview(null)
    delete document.documentElement.dataset.dragging
  }

  /** バーの上で pointerdown したとき(Bar から呼ばれる) */
  function handleBarPointerDown(e: ReactPointerEvent, task: Task) {
    // 左ボタン以外(右クリックなど)や、日付のない行は対象外
    if (e.button !== 0 || task.start === null || task.end === null) return
    const el = scrollRef.current
    if (!el) return

    const handle = e.target instanceof Element ? e.target.closest('[data-drag-mode]') : null
    const original = { start: task.start, end: task.end }
    sessionRef.current = {
      taskId: task.id,
      mode: toDragMode(handle?.getAttribute('data-drag-mode')),
      pointerId: e.pointerId,
      original,
      startClientX: e.clientX,
      startDayIndex: dayIndexFromClientX(e.clientX),
      dragging: false,
      current: original,
    }
    // カーソルがバーやウィンドウの外に出ても、pointermove / pointerup を受け取り続けるため
    el.setPointerCapture(e.pointerId)
  }

  // 以下の4つはスクロールコンテナに付ける(キャプチャしたイベントはそこに届く)

  function onPointerMove(e: ReactPointerEvent) {
    const s = sessionRef.current
    if (!s || e.pointerId !== s.pointerId) return

    let justStarted = false
    if (!s.dragging) {
      // 選択しようとしただけでバーが1日ずれないよう、少し動くまではドラッグにしない
      if (Math.abs(e.clientX - s.startClientX) < DRAG_THRESHOLD_PX) return
      s.dragging = true
      justStarted = true
      onSelect(s.taskId)
      // ドラッグ中はどこにカーソルがあっても同じ形にする(index.css で指定)
      document.documentElement.dataset.dragging = s.mode
    }

    const next = applyDrag(s.mode, s.original, dayIndexFromClientX(e.clientX) - s.startDayIndex)
    // 日付が変わったときだけ再描画する(1px 動くたびに描き直さないため)。
    // ただしドラッグになった瞬間は、ツールチップを出すために必ず描く
    if (!justStarted && next.start === s.current.start && next.end === s.current.end) return
    s.current = next
    setPreview({ taskId: s.taskId, mode: s.mode, ...next })
  }

  function onPointerUp(e: ReactPointerEvent) {
    const s = sessionRef.current
    if (!s || e.pointerId !== s.pointerId) return

    if (!s.dragging) {
      onSelect(s.taskId) // ほとんど動かさずに離した = クリック
    } else if (s.current.start !== s.original.start || s.current.end !== s.original.end) {
      dispatch({ type: 'SET_DATES', id: s.taskId, ...s.current })
    }
    endSession()
  }

  // ブラウザ側の都合でポインタ操作が中断されたとき(タッチのスクロール開始など)は、確定せずに終える
  function onPointerCancel(e: ReactPointerEvent) {
    if (sessionRef.current?.pointerId === e.pointerId) endSession()
  }

  // ドラッグ中の Esc で取り消す
  useEffect(() => {
    if (!preview) return

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key !== 'Escape') return
      // 選択解除(useBarSelection)の Esc まで動かないよう、ここでイベントを止める
      e.stopPropagation()
      const s = sessionRef.current
      if (s && scrollRef.current?.hasPointerCapture(s.pointerId)) {
        scrollRef.current.releasePointerCapture(s.pointerId)
      }
      endSession() // SET_DATES を送らずに終えるので、元の日付のまま
    }

    // 第3引数 true(キャプチャ段階)で登録し、ほかの keydown リスナーより先に受け取る
    window.addEventListener('keydown', handleKeyDown, true)
    return () => window.removeEventListener('keydown', handleKeyDown, true)
  }, [preview, scrollRef])

  return {
    preview,
    handleBarPointerDown,
    containerHandlers: { onPointerMove, onPointerUp, onPointerCancel },
  }
}
