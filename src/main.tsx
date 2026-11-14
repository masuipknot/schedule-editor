import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// フォントは npm で同梱して自前で配信する(外部への通信をしないため。SPEC 2章)。
// 可変フォント版なので、1つのファイルで太さ 400〜600 をまかなえる。
// Noto Sans JP は文字の範囲ごとにファイルが分かれていて、ブラウザは画面に出た文字の分だけ取得する
import '@fontsource-variable/inter'
import '@fontsource-variable/noto-sans-jp'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
