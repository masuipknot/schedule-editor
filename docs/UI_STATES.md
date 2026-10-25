# UI 状態の一覧

最終更新: 2026-10-25(Phase 4 時点のプロトタイプの見た目)

画面に出てくるすべての要素と状態を、**現在の見た目** と **関係する CSS 変数** つきで一覧にしたもの。
Phase 5 で Claude Design のデザインを作るときのチェックリストとして使う(SPEC 10章)。

---

## 0. 見た目の値はどこで変えるか

| 種類 | 場所 | 備考 |
|---|---|---|
| 色・文字・線・角丸・影・余白 | `src/index.css` の `:root` | デザインの反映は、原則としてここの値を変えるだけで済むようにしている |
| 行の高さ・1日の列幅・左ペインの列幅 | **`src/layout.ts`** | ドラッグ判定(マウス位置 → 日付・行)の計算でも同じ値を使うため、JS の定数を正として CSS 変数に渡している。**`index.css` に書いても効かない**。変える場合は SPEC 3章のとおり、ドラッグ判定への影響を確認する |

### `src/layout.ts` で管理している寸法

| CSS 変数 | 値 | 内容 |
|---|---|---|
| `--row-height` | 22px | 1行の高さ(カレンダーのヘッダー1段の高さも同じ) |
| `--day-width` | 26px | カレンダーの1日の列幅 |
| `--name-col-width` | 250px | 項目名の列幅 |
| `--date-col-width` | 85px | 開始日・終了日の列幅(各) |
| `--left-pane-width` | 420px | 左ペイン全体の幅(上の3列の合計。自動計算) |
| `--header-height` | 66px | 列見出し・カレンダーのヘッダーの高さ(行の高さ × 3。自動計算) |

---

## 1. 画面全体

| 要素 | 状態 | 現在の見た目 | CSS 変数 |
|---|---|---|---|
| 画面の地 | 通常 | 白地に濃いグレーの文字、システムフォント | `--surface-color` `--text-color` `--font-family` |
| ツールバー | 通常 | 画面上部の帯。薄いグレー地、下に1pxの線 | `--toolbar-color` `--toolbar-height` `--toolbar-padding-x` `--toolbar-gap` `--grid-line-width` `--grid-line-strong-color` |
| アプリ名 | 通常 | 「スケジュール編集」15px 太字 | `--font-size-title` |
| 表示開始日の入力欄 | 通常 / フォーカス | 見出し 13px。入力欄はブラウザ標準の日付入力(独自の見た目はなし) | `--font-size-body` `--field-gap` |
| お知らせ | 表示中(5秒で消える) | 濃いグレー地に白文字の小さな帯。例「1件の日付を読み取れず、スキップしました」 | `--tooltip-color` `--tooltip-text-color` `--badge-padding` `--radius-small` `--font-size-small` |
| 開発中の表示 | 常時(Phase 6 で差し替え) | 右端。薄いオレンジ地、オレンジの枠、茶色の文字「開発中:データは保存されません」 | `--notice-color` `--notice-border-color` `--notice-text-color` `--badge-padding` `--radius-small` `--font-size-small` |
| スクロール領域 | 縦横スクロール | ブラウザ標準のスクロールバー(独自の見た目はなし)。横スクロールバーは常に画面下端 | — |
| 左ペインの区切り | 横スクロール中 | 左ペインが固定され、右端に2pxのグレーの線が出る | `--pane-divider-width` `--grid-line-strong-color` |
| ヘッダー | 縦スクロール中 | 列見出し・カレンダーのヘッダーが上に固定される | `--surface-color` |

---

## 2. 左ペイン(項目名・開始日・終了日)

### 2-1. 列見出し

| 状態 | 現在の見た目 | CSS 変数 |
|---|---|---|
| 通常 | 12px 太字、下寄せ。右と下に1pxの線 | `--font-size-small` `--font-weight-strong` `--cell-padding-x` `--header-label-padding-bottom` `--grid-line-width` `--grid-line-color` |
| ホバー | 見た目の変化なし。カーソルが指(pointer) | — |
| 列全体を選択中 | 見出しの背景が薄い青 | `--selection-color` |

### 2-2. セル

| 状態 | 現在の見た目 | CSS 変数 |
|---|---|---|
| 通常 | 13px。項目名は左寄せ、日付は右寄せで `M/D`。右に1pxの線、下に点線 | `--font-size-body` `--cell-padding-x` `--grid-line-width` `--grid-line-color` `--row-line-style` |
| ホバー | 見た目の変化なし。カーソルが十字(cell) | — |
| 選択中(今いるセル) | 内側に2pxの青い枠。文字カーソルは出さない | `--focus-ring-width` `--focus-color` |
| 範囲選択に含まれる | 背景が薄い青(今いるセルは青い枠も付く) | `--selection-color` |
| 編集中 | 白地、内側に2pxの青い枠と、外側に薄い影。文字カーソルが出る。カーソルの形は I | `--surface-color` `--focus-ring-width` `--focus-color` `--shadow-editing` |
| エラー(解釈できない日付を確定しようとした) | 内側に2pxの赤い枠。値は元に戻る。別のセルへ移ると消える | `--focus-ring-width` `--error-color` |
| 日付セルのツールチップ | マウスを乗せると年付きの日付(例: 2026/10/5)。ブラウザ標準の title 表示 | — |

---

## 3. カレンダーのヘッダー(月 / 日 / 曜日)

| 要素 | 状態 | 現在の見た目 | CSS 変数 |
|---|---|---|---|
| 月の見出し | 通常 | 「2026年10月」(先頭と1月だけ年付き)。横スクロールしても左ペインの右隣に残る | `--font-size-small` `--month-label-padding-x` `--grid-line-width` `--grid-line-color` |
| 日・曜日のセル | 平日 | 12px、中央寄せ。右と下に1pxの線 | `--font-size-small` `--grid-line-width` `--grid-line-color` |
| 〃 | 土日・祝日 | 背景がグレー | `--day-off-color` |
| 〃 | 今日 | 文字が赤の太字 | `--today-color` `--font-weight-strong` |
| 〃 | 祝日のツールチップ | マウスを乗せると「2026/9/22 国民の休日」など。ブラウザ標準の title 表示 | — |

---

## 4. カレンダーの本体

| 要素 | 状態 | 現在の見た目 | CSS 変数 |
|---|---|---|---|
| 日ごとの縦の帯 | 平日 | 白地、右に1pxの縦罫線 | `--grid-line-width` `--grid-line-color` |
| 〃 | 土日・祝日 | 背景がグレー | `--day-off-color` |
| 今日の目印 | 常時 | 今日の列の中央に、薄い赤の縦線(2px、濃さ35%) | `--today-color` `--today-line-width` `--today-line-opacity` |
| 行の横罫線 | 常時 | 点線 | `--grid-line-width` `--row-line-style` `--grid-line-color` |
| 空き部分 | 新規作成できる位置にポインタがある | 見た目の変化なし。カーソルが十字(crosshair) | — |

---

## 5. バー

| 状態 | 現在の見た目 | CSS 変数 |
|---|---|---|
| 通常 | 黄色地、濃い黄色の1pxの枠、角丸3px。行の上下に4pxずつ隙間 | `--bar-color` `--bar-border-color` `--bar-border-width` `--radius-small` `--bar-inset-y` |
| ホバー(中央) | 見た目の変化なし。カーソルが手のひら(grab) | — |
| ホバー(左右の端) | 見た目の変化なし。カーソルが ↔(ew-resize)。つかめる幅は各6px | `--bar-handle-width` |
| 選択中 | 濃い黄色地、茶色の2pxの枠 | `--bar-selected-color` `--bar-selected-border-color` `--bar-selected-border-width` |
| ドラッグ中(移動・伸縮・新規作成) | 選択中の見た目に、浮いたような影が付く | `--shadow-dragging` |
| 表示範囲の外に続いている | 切れている側の枠が破線になり、角丸がなくなる | `--bar-clipped-border-style` |

### 5-1. ドラッグ中のツールチップ

| 状態 | 現在の見た目 | CSS 変数 |
|---|---|---|
| ドラッグ中 | バーの左端の下(6px 下)に、濃いグレー地・白文字で「10/8(木)〜10/12(月) 5日間」 | `--tooltip-color` `--tooltip-text-color` `--tooltip-padding` `--tooltip-offset` `--radius-small` `--font-size-small` |

---

## 6. カーソルの種類

| 場所・状態 | カーソル |
|---|---|
| 列見出し | pointer(指) |
| 左ペインのセル(選択モード) | cell(太い十字) |
| 左ペインのセル(編集中) | text(I の形) |
| バーの中央 | grab(手のひら) |
| バーの左右の端 | ew-resize(↔) |
| カレンダーの空き部分(新規作成できる位置) | crosshair(十字) |
| 移動のドラッグ中(画面のどこでも) | grabbing(握った手) |
| 伸縮のドラッグ中(画面のどこでも) | ew-resize(↔) |
| 新規作成のドラッグ中(画面のどこでも) | crosshair(十字) |

カーソルの形は CSS 変数にしていない(デザインで変える想定がないため)。変える場合は `src/index.css` の `html[data-dragging...]` と、各コンポーネントの CSS の `cursor` を直す。

---

## 7. デザインで決めてほしいこと(現在は見た目がない、またはブラウザ標準のもの)

- **ホバーの見た目:** バー・セル・列見出しはいずれも、カーソルの形が変わるだけで見た目は変わらない
- **ツールバーの日付入力欄・スクロールバー:** ブラウザ標準のまま
- **ツールチップの種類:** セル・祝日はブラウザ標準(title)、ドラッグ中だけ独自。そろえるかどうか
- **ダークモード:** 未対応
- **キーボード操作のフォーカス表示:** 左ペインのセル以外(ツールバーの入力欄など)はブラウザ標準
