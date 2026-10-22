import { useReducer } from 'react'
import styles from './App.module.css'
import { ScheduleGrid } from './components/ScheduleGrid'
import { today } from './lib/date'
import { createInitialState, scheduleReducer } from './state/reducer'

export default function App() {
  // 状態はここで1つだけ持ち、子コンポーネントには state と dispatch を渡す。
  // 第3引数に初期化関数を渡すと、初回の描画時だけ呼ばれる(毎回30行を作り直さずに済む)
  const [state, dispatch] = useReducer(scheduleReducer, today(), createInitialState)

  return (
    <div className={styles.app}>
      <header className={styles.toolbar}>
        <h1 className={styles.title}>スケジュール編集</h1>
        <label className={styles.field}>
          表示開始日
          {/* type="date" の値は "YYYY-MM-DD" 文字列なので、アプリ内の形式のまま受け渡しできる */}
          <input
            type="date"
            value={state.view.start}
            onChange={(e) => {
              // 入力途中や「クリア」ボタンでは空文字になるので、そのときは何もしない
              if (e.target.value) dispatch({ type: 'SET_VIEW_START', start: e.target.value })
            }}
          />
        </label>
        {/* 保存機能(Phase 6)ができるまでの注意書き。Phase 6 で
            「データはこのブラウザ内にのみ保存されます」の表示に差し替える */}
        <p className={styles.devNotice} role="note">
          開発中:データは保存されません
        </p>
      </header>
      <main className={styles.main}>
        <ScheduleGrid state={state} dispatch={dispatch} />
      </main>
    </div>
  )
}
