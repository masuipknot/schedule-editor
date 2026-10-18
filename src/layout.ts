import type { CSSProperties } from 'react'

// 画面の寸法(px)。
// バーの位置計算など JS 側でも数値が必要になるので、ここを正として持ち、
// CSS へは layoutCssVars で CSS 変数として渡す(値を2か所に書かないため)。
// 色は JS で使わないので index.css の :root に置いている
export const ROW_HEIGHT = 22
export const DAY_WIDTH = 26
export const NAME_COL_WIDTH = 250
export const DATE_COL_WIDTH = 85
export const LEFT_PANE_WIDTH = NAME_COL_WIDTH + DATE_COL_WIDTH * 2
/** カレンダーのヘッダーは 月 / 日 / 曜日 の3段 */
export const HEADER_HEIGHT = ROW_HEIGHT * 3

// React の style には任意のプロパティ名を書けないので、CSSProperties として扱うために型を付け直している
export const layoutCssVars = {
  '--row-height': `${ROW_HEIGHT}px`,
  '--day-width': `${DAY_WIDTH}px`,
  '--name-col-width': `${NAME_COL_WIDTH}px`,
  '--date-col-width': `${DATE_COL_WIDTH}px`,
  '--left-pane-width': `${LEFT_PANE_WIDTH}px`,
  '--header-height': `${HEADER_HEIGHT}px`,
} as CSSProperties
