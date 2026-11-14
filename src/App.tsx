import { useEffect, useReducer, useState } from 'react'
import styles from './App.module.css'
import { ScheduleGrid } from './components/ScheduleGrid'
import { today } from './lib/date'
import { createInitialState, scheduleReducer } from './state/reducer'

/** お知らせを表示しておく時間 */
const NOTICE_DURATION_MS = 5000

export default function App() {
  // 状態はここで1つだけ持ち、子コンポーネントには state と dispatch を渡す。
  // 第3引数に初期化関数を渡すと、初回の描画時だけ呼ばれる(毎回30行を作り直さずに済む)
  const [state, dispatch] = useReducer(scheduleReducer, today(), createInitialState)
  // ツールバーに一時的に出すお知らせ。作業を止めないよう、ダイアログではなく数秒で消える表示にする
  const [notice, setNotice] = useState<string | null>(null)
  useEffect(() => {
    if (notice === null) return
    const timer = setTimeout(() => setNotice(null), NOTICE_DURATION_MS)
    // 次のお知らせが来たら、前のタイマーは止めて新しいほうを最後まで見せる
    return () => clearTimeout(timer)
  }, [notice])

  return (
    <div className={styles.app}>
      {/* 1段目: アプリ名と、画面全体に関わる表示 */}
      <header className={styles.header}>
        <h1 className={styles.title}>スケジュール編集</h1>
        {/* 保存機能(Phase 6)ができるまでの注意書き。Phase 6 で
            「データはこのブラウザ内にのみ保存されます」の表示に差し替える */}
        <p className={styles.devNotice} role="note">
          開発中:データは保存されません
        </p>
      </header>

      {/* 2段目: 表を操作するための道具(Phase 6 で「行を追加」「すべて消去」のボタンをここに置く) */}
      <div className={styles.toolbar}>
        <label className={styles.field}>
          表示開始日
          {/* type="date" の値は "YYYY-MM-DD" 文字列なので、アプリ内の形式のまま受け渡しできる */}
          <input
            className={styles.dateInput}
            type="date"
            value={state.view.start}
            onChange={(e) => {
              // 入力途中や「クリア」ボタンでは空文字になるので、そのときは何もしない
              if (e.target.value) dispatch({ type: 'SET_VIEW_START', start: e.target.value })
            }}
          />
        </label>
        {notice && (
          <p className={styles.notice} role="status">
            {notice}
          </p>
        )}
      </div>

      <main className={styles.main}>
        {/* 表は白いカードに入れる。枠線・角丸・影はこの外側の囲みに付け、
            中のスクロールする要素(ScheduleGrid)には付けない。
            スクロールする要素に枠線があると、ドラッグ判定が読む左端の位置が枠線の分ずれるため(SPEC 3章) */}
        <div className={styles.card}>
          <ScheduleGrid state={state} dispatch={dispatch} onNotice={setNotice} />
        </div>
      </main>
    </div>
  )
}
