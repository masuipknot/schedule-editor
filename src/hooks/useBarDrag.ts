import {
  useEffect,
  useRef,
  useState,
  type Dispatch,
  type PointerEvent as ReactPointerEvent,
  type RefObject,
} from 'react'
import {
  applyDrag,
  createRangeBetweenLines,
  dayIndexAt,
  dayLineAt,
  DRAG_THRESHOLD_PX,
  type DragMode,
} from '../lib/barDrag'
import { addDays, type Ymd } from '../lib/date'
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
  /** ドラッグ開始時の日付。移動量の計算の基準に使う(create のときは押した日1日分) */
  original: { start: Ymd; end: Ymd }
  startClientX: number
  /** 押した位置。move は「何日目のセルか」、それ以外は「何本目の縦線か」(positionAt を参照) */
  startPosition: number
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
  /** 表示範囲の初日。新規作成で「押した位置が何日か」を求めるのに使う */
  viewStart: Ymd
  /** バーを(ドラッグせずに)クリックしたとき、またはドラッグを始めたときに呼ぶ */
  onSelect: (taskId: string) => void
}

/**
 * バーの移動・伸縮・新規作成のドラッグ処理。
 *
 * - ドラッグ中の日付は preview(このフックの state)にだけ持ち、pointerup で初めて SET_DATES を送る。
 *   1回のドラッグ = 1回の状態変更になり、将来 Undo を付けるときの単位として自然になる
 * - setPointerCapture はバーではなくスクロールコンテナに対して行う。
 *   バーはドラッグ中に再描画され、表示範囲の外に出ると消えることもあるので、
 *   消えない要素にイベントを受け取らせたほうが確実なため
 */
export function useBarDrag({ scrollRef, dispatch, viewStart, onSelect }: Options) {
  // ポインタが動くたびに変わる値は ref に持つ(state にすると毎回再描画が起きるうえ、
  // イベント処理の中で古い値が見えてしまうことがある)
  const sessionRef = useRef<DragSession | null>(null)
  // 画面に反映したい値(プレビュー)だけを state にする
  const [preview, setPreview] = useState<DragPreview | null>(null)

  /**
   * 画面上の x 座標を、ドラッグの計算に使う位置の番号に変換する。
   * - move: ポインタが乗っている日(セル)。バーをつかんだ位置からの移動日数だけが大事なので、セル単位でよい
   * - 伸縮・新規作成: 一番近い縦線。端を狙う操作なので、セルの後ろ半分を押したら次のセルの左端として扱う
   */
  function positionAt(mode: DragMode, clientX: number): number {
    const el = scrollRef.current
    if (!el) return 0
    // カレンダーが見えている左端 = スクロールコンテナの左端 + 固定された左ペインの幅
    const calendarLeft = el.getBoundingClientRect().left + LEFT_PANE_WIDTH
    return mode === 'move'
      ? dayIndexAt(clientX, calendarLeft, el.scrollLeft, DAY_WIDTH)
      : dayLineAt(clientX, calendarLeft, el.scrollLeft, DAY_WIDTH)
  }

  /** ドラッグの後片付け。取り消し・確定・中断のどの場合も最後にこれを呼ぶ */
  function endSession() {
    sessionRef.current = null
    setPreview(null)
    delete document.documentElement.dataset.dragging
  }

  /** ドラッグの準備。バーを押したときも、空き部分を押したときも、ここで同じように始める */
  function beginSession(
    e: ReactPointerEvent,
    taskId: string,
    mode: DragMode,
    original: { start: Ymd; end: Ymd },
  ) {
    const el = scrollRef.current
    if (!el) return
    sessionRef.current = {
      taskId,
      mode,
      pointerId: e.pointerId,
      original,
      startClientX: e.clientX,
      startPosition: positionAt(mode, e.clientX),
      dragging: false,
      current: original,
    }
    // カーソルがバーやウィンドウの外に出ても、pointermove / pointerup を受け取り続けるため
    el.setPointerCapture(e.pointerId)
  }

  /** バーの上で pointerdown したとき(Bar から呼ばれる) */
  function handleBarPointerDown(e: ReactPointerEvent, task: Task) {
    // 左ボタン以外(右クリックなど)や、日付のない行は対象外
    if (e.button !== 0 || task.start === null || task.end === null) return
    const handle = e.target instanceof Element ? e.target.closest('[data-drag-mode]') : null
    beginSession(
      e,
      task.id,
      toDragMode(handle?.getAttribute('data-drag-mode')),
      { start: task.start, end: task.end },
    )
  }

  /** 日付のない行の空き部分で pointerdown したとき(新規作成の起点) */
  function handleEmptyRowPointerDown(e: ReactPointerEvent, task: Task) {
    if (e.button !== 0 || task.start !== null) return
    // 新規作成は「押した位置に一番近い縦線」から始まる。その線の右の1日を仮の日付にしておく
    const pressed = addDays(viewStart, positionAt('create', e.clientX))
    beginSession(e, task.id, 'create', { start: pressed, end: pressed })
  }

  /** 新規作成: 押した線と今の線の間を期間にする */
  function createDates(s: DragSession, clientX: number): { start: Ymd; end: Ymd } {
    const range = createRangeBetweenLines(
      s.startPosition,
      positionAt('create', clientX),
      clientX < s.startClientX, // 押した位置より左にいるか(同じ線のとき、どちら側の1日にするか)
    )
    return { start: addDays(viewStart, range.startIndex), end: addDays(viewStart, range.endIndex) }
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

    const next =
      s.mode === 'create'
        ? createDates(s, e.clientX)
        : applyDrag(s.mode, s.original, positionAt(s.mode, e.clientX) - s.startPosition)
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
      // ほとんど動かさずに離した = クリック。バーなら選択する。
      // 空き部分のクリックではバーを作らない(作成はドラッグしたときだけ)
      if (s.mode !== 'create') onSelect(s.taskId)
    } else if (
      // 新規作成は、1日分でもドラッグしたら作る。移動・伸縮は日付が変わったときだけ送る
      s.mode === 'create' ||
      s.current.start !== s.original.start ||
      s.current.end !== s.original.end
    ) {
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
    handleEmptyRowPointerDown,
    containerHandlers: { onPointerMove, onPointerUp, onPointerCancel },
  }
}
