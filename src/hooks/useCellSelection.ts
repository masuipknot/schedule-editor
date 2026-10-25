import {
  useEffect,
  useRef,
  useState,
  type ClipboardEvent,
  type Dispatch,
  type FocusEvent,
  type KeyboardEvent,
  type PointerEvent,
} from 'react'
import {
  containsPos,
  movePos,
  rectOf,
  COLUMN_COUNT,
  type CellPos,
  type CellRect,
  type ColumnIndex,
} from '../lib/cellRange'
import { clearPatches, pasteToPatches, rectTexts } from '../lib/cells'
import { formatMD, parseDateInput, type Ymd } from '../lib/date'
import { parseTsv, toTsv } from '../lib/tsv'
import type { ScheduleAction, Task } from '../state/types'

/** 編集モード中のセルと、入力途中の文字列 */
type EditState = { pos: CellPos; draft: string }

type Options = {
  tasks: Task[]
  /** 年を省略した日付の解釈に使う(表示開始日) */
  viewStart: Ymd
  dispatch: Dispatch<ScheduleAction>
  /** 利用者に短いお知らせを出す(ペーストでスキップした件数など) */
  onNotice: (message: string) => void
}

/** 選択モードで表示する文字。日付は M/D(年は title のツールチップで出す) */
export function displayText(task: Task, col: ColumnIndex): string {
  if (col === 0) return task.name
  const date = col === 1 ? task.start : task.end
  return date ? formatMD(date) : ''
}

function samePos(a: CellPos | null, b: CellPos | null): boolean {
  return a !== null && b !== null && a.row === b.row && a.col === b.col
}

/**
 * 左ペインのスプレッドシート的な操作(SPEC 6章)。
 *
 * - 「選択モード」と「編集モード」の2段階にする。選択モードでもセルの input にフォーカスは置くが、
 *   文字は打ち込ませず、矢印キーやコピー/ペーストを表として扱う。
 *   文字を打ったら、その時点で編集モードに切り替えて中身を置き換える
 * - どのセルを選んでいるか・編集中の文字列は画面上の一時的な状態なので reducer には入れず、
 *   値を確定するときだけ dispatch する
 */
export function useCellSelection({ tasks, viewStart, dispatch, onNotice }: Options) {
  // 範囲選択の起点(Shift を押しながら動かしても変わらない側)と、今いるセル
  const [anchor, setAnchor] = useState<CellPos | null>(null)
  const [focus, setFocus] = useState<CellPos | null>(null)
  const [edit, setEdit] = useState<EditState | null>(null)
  // 解釈できない日付を確定しようとしたセル(赤枠を出す)。そのセルで編集を始めるか、別のセルへ移ったら消す
  const [invalidPos, setInvalidPos] = useState<CellPos | null>(null)
  // マウスのボタンを押したままセルをなぞっている間 true(範囲選択のドラッグ)
  const [draggingSelect, setDraggingSelect] = useState(false)

  // 各セルの input 要素。キーボードで動かしたとき、そのセルにフォーカスを移すために使う
  const inputRefs = useRef(new Map<string, HTMLInputElement>())
  const keyOf = (pos: CellPos) => `${pos.row}-${pos.col}`

  const rect: CellRect | null = anchor && focus ? rectOf(anchor, focus) : null
  const rowCount = tasks.length

  // 今いるセルが変わったら、その input にフォーカスを移す(ブラウザが自動で見える位置までスクロールする)。
  // あわせて中身を全選択しておく。こうすると、選択モードで打った文字は(キー入力でも、日本語入力や
  // 音声入力のようにキーのイベントが届かない入力方法でも)必ず中身の置き換えになる
  useEffect(() => {
    if (!focus) return
    const input = inputRefs.current.get(keyOf(focus))
    input?.focus()
    input?.select()
  }, [focus])

  // 範囲選択のドラッグは、セルの外(ウィンドウの外も含む)でボタンを離しても終わらせる
  useEffect(() => {
    if (!draggingSelect) return
    const stop = () => setDraggingSelect(false)
    window.addEventListener('pointerup', stop)
    return () => window.removeEventListener('pointerup', stop)
  }, [draggingSelect])

  /** 1つのセルだけを選ぶ */
  function selectCell(pos: CellPos) {
    if (!samePos(invalidPos, pos)) setInvalidPos(null)
    setAnchor(pos)
    setFocus(pos)
  }

  /** 起点は動かさず、今いるセルだけを動かす(Shift+矢印・Shift+クリック) */
  function extendTo(pos: CellPos) {
    if (!anchor) setAnchor(pos)
    setFocus(pos)
  }

  function clearSelection() {
    // 赤枠(invalidPos)はここでは消さない。解釈できない日付のままほかの場所をクリックしたときも、
    // 元の値に戻ったことが分かるように残しておく
    setAnchor(null)
    setFocus(null)
    setEdit(null)
  }

  /**
   * 編集モードを始める。
   * replace = true は「選択中に文字を打った」場合で、中身を全選択しておくと、
   * ブラウザが打った文字(日本語入力も含む)で置き換えてくれる
   */
  function startEdit(pos: CellPos, replace: boolean) {
    const task = tasks[pos.row]
    setInvalidPos(null)
    setEdit({ pos, draft: displayText(task, pos.col) })
    const input = inputRefs.current.get(keyOf(pos))
    if (!input) return
    if (replace) input.select()
    else input.setSelectionRange(input.value.length, input.value.length) // カーソルを末尾に
  }

  /**
   * 編集中の値を確定する。日付が解釈できなければ確定せず、赤枠にして false を返す。
   * 確定できたら(または変更がなければ)true
   */
  function commitEdit(): boolean {
    if (!edit) return true
    const { pos, draft } = edit
    const task = tasks[pos.row]
    setEdit(null)

    if (pos.col === 0) {
      if (draft !== task.name) dispatch({ type: 'UPDATE_NAME', id: task.id, name: draft })
      return true
    }

    const text = draft.trim()
    if (text === displayText(task, pos.col)) return true // 変更なし(年の解釈し直しもしない)
    if (text === '') {
      // 片方を空にしたら両方クリア(SPEC 4章)
      dispatch({ type: 'CLEAR_DATES', id: task.id })
      return true
    }
    const date = parseDateInput(text, viewStart)
    if (date === null) {
      setInvalidPos(pos) // 元の値に戻して赤枠
      return false
    }
    dispatch(
      pos.col === 1
        ? { type: 'SET_DATES', id: task.id, start: date, end: task.end }
        : { type: 'SET_DATES', id: task.id, start: task.start, end: date },
    )
    return true
  }

  function cancelEdit() {
    setEdit(null)
  }

  /** 確定して隣のセルへ(Enter で下、Tab で右、Shift+Tab で左) */
  function commitAndMove(dRow: number, dCol: number) {
    if (!commitEdit() || !focus) return // 解釈できなければその場にとどまる(赤枠を見せる)
    selectCell(movePos(focus, dRow, dCol, rowCount))
  }

  // ---- キーボード ----

  function handleKeyDown(e: KeyboardEvent) {
    // 日本語入力の変換中(変換確定の Enter など)は、表の操作として扱わない
    if (e.nativeEvent.isComposing || !focus) return

    if (edit) {
      if (e.key === 'Enter') {
        e.preventDefault()
        commitAndMove(1, 0)
      } else if (e.key === 'Tab') {
        e.preventDefault()
        commitAndMove(0, e.shiftKey ? -1 : 1)
      } else if (e.key === 'Escape') {
        e.preventDefault()
        cancelEdit()
      }
      // それ以外のキーは、ふつうの文字入力として input に任せる
      return
    }

    // ---- ここから選択モード ----
    const arrows: Record<string, [number, number]> = {
      ArrowUp: [-1, 0],
      ArrowDown: [1, 0],
      ArrowLeft: [0, -1],
      ArrowRight: [0, 1],
    }
    const arrow = arrows[e.key]
    if (arrow) {
      e.preventDefault()
      const next = movePos(focus, arrow[0], arrow[1], rowCount)
      if (e.shiftKey) extendTo(next)
      else selectCell(next)
      return
    }

    if (e.key === 'Tab') {
      e.preventDefault()
      selectCell(movePos(focus, 0, e.shiftKey ? -1 : 1, rowCount))
    } else if (e.key === 'Enter' || e.key === 'F2') {
      e.preventDefault()
      startEdit(focus, false)
    } else if (e.key === 'Delete' || e.key === 'Backspace') {
      // Mac の「delete」キーは Backspace として届くので、両方を処理する
      e.preventDefault()
      if (rect) dispatch({ type: 'CLEAR_CELLS', top: rect.top, patches: clearPatches(rect) })
    } else if (e.key === 'Escape') {
      selectCell(focus) // 範囲選択を解除して、今いるセルだけにする
    } else if (
      // 文字のキー(修飾キーなし)、または日本語入力の開始('Process')なら、置き換えて編集開始。
      // preventDefault しないので、打った文字はそのまま input に入る
      (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) ||
      e.key === 'Process'
    ) {
      startEdit(focus, true)
    }
  }

  // ---- コピー / ペースト ----

  function handleCopy(e: ClipboardEvent) {
    if (edit || !rect) return // 編集中は、ふつうの文字のコピー
    e.preventDefault()
    e.clipboardData.setData('text/plain', toTsv(rectTexts(tasks, rect)))
  }

  function handleCut(e: ClipboardEvent) {
    // 切り取りは仕様にないので、選択モードでは何もしない(input の文字が消えないように止める)
    if (!edit) e.preventDefault()
  }

  function handlePaste(e: ClipboardEvent) {
    if (edit || !rect) return // 編集中は、ふつうの文字の貼り付け
    e.preventDefault()
    const cells = parseTsv(e.clipboardData.getData('text/plain'))
    if (cells.length === 0) return

    const { patches, skipped } = pasteToPatches(cells, rect.left, viewStart)
    dispatch({ type: 'PASTE_CELLS', top: rect.top, patches })

    // 貼り付けた範囲を選択し直す(どこに入ったか分かるように)
    const width = Math.max(...cells.map((row) => row.length))
    setAnchor({ row: rect.top, col: rect.left })
    setFocus({
      row: rect.top + cells.length - 1,
      col: Math.min(COLUMN_COUNT - 1, rect.left + width - 1) as ColumnIndex,
    })
    if (skipped > 0) onNotice(`${skipped}件の日付を読み取れず、スキップしました`)
  }

  // ---- フォーカスが左ペインの外へ出たとき ----

  function handleBlur(e: FocusEvent<HTMLElement>) {
    // 左ペインの中の別のセルへ移っただけなら何もしない
    if (e.relatedTarget instanceof Node && e.currentTarget.contains(e.relatedTarget)) return
    commitEdit()
    clearSelection()
  }

  // ---- マウス ----

  function handleCellPointerDown(e: PointerEvent, pos: CellPos) {
    if (e.button !== 0) return
    // 編集中のセルの中のクリックは、カーソル位置の移動など、ふつうの文字入力の操作にする
    if (samePos(edit?.pos ?? null, pos)) return
    // ブラウザ標準の「input にフォーカスして文字を選択する」動きを止め、表のセル選択として扱う
    // (SPEC 6-1: 文字の選択とセル範囲の選択がぶつからないようにするため)
    e.preventDefault()
    if (edit && !commitEdit()) return
    if (e.shiftKey && focus) extendTo(pos)
    else selectCell(pos)
    setDraggingSelect(true)
  }

  function handleCellPointerEnter(pos: CellPos) {
    if (draggingSelect) extendTo(pos)
  }

  /** Tab キーなどでブラウザ側から左ペインにフォーカスが入ったときも、そのセルを選択状態にする */
  function handleCellFocus(pos: CellPos) {
    if (!samePos(focus, pos)) selectCell(pos)
  }

  /** 編集をやめて選択モードに戻ったとき、もう一度中身を全選択しておく(上の useEffect と同じ理由) */
  useEffect(() => {
    if (edit || !focus) return
    inputRefs.current.get(keyOf(focus))?.select()
  }, [edit, focus])

  function handleCellDoubleClick(pos: CellPos) {
    if (!samePos(edit?.pos ?? null, pos)) startEdit(pos, false)
  }

  /** 列見出しのクリックで列全体を選ぶ。Shift+クリックで複数列 */
  function handleHeaderPointerDown(e: PointerEvent, col: ColumnIndex) {
    if (e.button !== 0 || rowCount === 0) return
    e.preventDefault()
    if (edit && !commitEdit()) return
    const anchorCol = e.shiftKey && anchor ? anchor.col : col
    // 今いるセル(フォーカスを置くセル)は先頭行にする。最終行にすると、そこまでスクロールしてしまうため
    setAnchor({ row: rowCount - 1, col: anchorCol })
    setFocus({ row: 0, col })
  }

  /** 列全体が選ばれているか(列見出しの強調表示用) */
  function isColumnSelected(col: ColumnIndex): boolean {
    return rect !== null && rect.top === 0 && rect.bottom === rowCount - 1 && col >= rect.left && col <= rect.right
  }

  // ---- 各セルの表示用の情報 ----

  function cellState(pos: CellPos) {
    const editing = samePos(edit?.pos ?? null, pos)
    return {
      editing,
      focused: samePos(focus, pos),
      inRange: rect !== null && containsPos(rect, pos),
      invalid: samePos(invalidPos, pos),
      value: editing && edit ? edit.draft : displayText(tasks[pos.row], pos.col),
    }
  }

  function setDraft(pos: CellPos, draft: string) {
    // 選択モードで文字を打った直後(startEdit が反映される前)の入力も、編集として受け取る
    setInvalidPos(null)
    setEdit({ pos, draft })
  }

  function registerInput(pos: CellPos, el: HTMLInputElement | null) {
    if (el) inputRefs.current.set(keyOf(pos), el)
    else inputRefs.current.delete(keyOf(pos))
  }

  return {
    cellState,
    setDraft,
    registerInput,
    isColumnSelected,
    /** 何かのセルが選ばれているか */
    hasSelection: focus !== null,
    containerHandlers: {
      onKeyDown: handleKeyDown,
      onCopy: handleCopy,
      onCut: handleCut,
      onPaste: handlePaste,
      onBlur: handleBlur,
    },
    handleCellPointerDown,
    handleCellPointerEnter,
    handleCellDoubleClick,
    handleCellFocus,
    handleHeaderPointerDown,
  }
}
