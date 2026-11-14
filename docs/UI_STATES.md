# UI 状態の一覧

最終更新: 2026-11-14(Phase 5 の確定デザインを反映)

画面に出てくるすべての要素と状態を、**今の見た目** と **関係する CSS 変数** つきで一覧にしたもの。
確定デザインの経緯とトークンの全一覧は `docs/DESIGN_PHASE5.md`、デザインキャンバスの「UI 状態の一覧(確定デザイン)」と対応している。

---

## 0. 見た目の値はどこで変えるか

| 種類 | 場所 | 備考 |
|---|---|---|
| 色・文字・線・角丸・影・余白 | `src/index.css` の `:root` | デザインの変更は、原則としてここの値を変えるだけで済む |
| 書体 | `src/main.tsx`(読み込み)と `--font-family` | `@fontsource-variable/inter`(数字・英字)と `@fontsource-variable/noto-sans-jp`(日本語)を自前で配信 |
| 行の高さ・1日の列幅・左ペインの列幅 | **`src/layout.ts`** | ドラッグ判定(マウス位置 → 日付・行)の計算でも同じ値を使うため、JS の定数を正として CSS 変数に渡している。**`index.css` に書いても効かない**。変える場合は SPEC 3章のとおり、ドラッグ判定への影響を確認する |

### `src/layout.ts` で管理している寸法

| CSS 変数 | 値 | 内容 |
|---|---|---|
| `--row-height` | 22px | 1行の高さ |
| `--day-width` | 26px | カレンダーの1日の列幅 |
| `--name-col-width` | 250px | 項目名の列幅 |
| `--date-col-width` | 85px | 開始日・終了日の列幅(各) |
| `--left-pane-width` | 420px | 左ペイン全体の幅(上の3列の合計。自動計算) |
| `--header-height` | 66px | 列見出し・カレンダーのヘッダーの高さ(行の高さ × 3。自動計算) |

---

## 1. 画面全体

| 要素 | 状態 | 今の見た目 | CSS 変数 |
|---|---|---|---|
| 画面の地 | 通常 | 薄いグレー。表は白いカードに入る | `--app-bg-color` |
| ヘッダー(1段目) | 通常 | 白地。アプリ名 20px・太字、右端に開発中の表示 | `--toolbar-color` `--toolbar-height` `--toolbar-padding-x` `--font-size-title` `--font-weight-strong` `--grid-line-strong-color` |
| 開発中の表示 | 常時(Phase 6 で差し替え) | 両端が丸い形。薄い黄色の地・黄土色の枠・茶色の文字 | `--notice-color` `--notice-border-color` `--notice-text-color` `--radius-pill` `--badge-padding` |
| ツールバー(2段目) | 通常 | グレーの地に「表示開始日」と日付入力欄 | `--toolbar-row-padding-y` `--field-gap` `--muted-text-color` |
| 表示開始日の入力欄 | 通常 | 白地・角丸 6px・グレーの枠。カレンダーのポップアップはブラウザ標準 | `--control-height` `--control-padding-x` `--control-border-color` `--radius-control` |
| 〃 | フォーカス | 青い枠と、薄い青の外枠 | `--focus-color` `--selection-color` |
| お知らせ | 表示中(5秒で消える) | ツールバーの日付入力欄の右。両端が丸い濃いグレーの地に白い文字。例「1件の日付を読み取れず、スキップしました」 | `--tooltip-color` `--tooltip-text-color` `--radius-pill` `--badge-padding` |
| 表のカード | 通常 | 白地・角丸 8px・薄い枠と影。枠線はスクロールする要素の外側の囲みに付けている(ドラッグ判定をずらさないため) | `--surface-color` `--grid-line-strong-color` `--radius-panel` `--shadow-panel` |
| スクロールバー | 縦横スクロール | ブラウザ標準のまま。横スクロールバーは常にカードの下端に見える | — |
| 左ペインの区切り | 横スクロール中 | 左ペインが固定され、右端に 1px の線 | `--pane-divider-width` `--grid-line-strong-color` |

---

## 2. 左ペイン(項目名・開始日・終了日)

### 2-1. 列見出し

| 状態 | 今の見た目 | CSS 変数 |
|---|---|---|
| 通常 | 薄いグレーの地に、控えめな色の 12px 太字。日付の列は右寄せで左に縦線。下に濃いめの線 | `--header-bg-color` `--muted-text-color` `--font-size-small` `--font-weight-strong` `--grid-line-color` `--grid-line-strong-color` |
| ホバー(カーソル: pointer) | 地が少し明るくなり、文字が濃くなる | `--row-hover-color` `--text-color` |
| 列全体を選択中 | 薄い青の地に青い文字 | `--selection-color` `--focus-color` |

### 2-2. セル

| 状態 | 今の見た目 | CSS 変数 |
|---|---|---|
| 通常(カーソル: cell) | 項目名は 13px・左寄せ。日付は 12px・控えめな色・右寄せで `M/D`。日付の列は左に縦線。下に実線 | `--font-size-body` `--font-size-small` `--muted-text-color` `--cell-padding-x` `--grid-line-color` `--row-line-style` |
| マウスを乗せた行 | 行全体の地が少し明るくなる(カレンダーの同じ行も一緒に) | `--row-hover-color` |
| 選択中(今いるセル) | 内側に 2px の青い枠。文字カーソルは出さない | `--focus-ring-width` `--focus-color` |
| 範囲選択に含まれる | 薄い青の地(今いるセルは青い枠も付く) | `--selection-color` |
| 編集中(カーソル: text) | 白地、内側に 2px の青い枠と、外側にやわらかい影。文字カーソルが出る | `--surface-color` `--focus-ring-width` `--focus-color` `--shadow-editing` |
| エラー(解釈できない日付を確定しようとした) | 内側に 2px の赤い枠。値は元に戻る。別のセルへ移ると消える | `--focus-ring-width` `--error-color` |
| 日付セルのツールチップ | マウスを乗せると年付きの日付(例: 2026/11/2)。ブラウザ標準の title 表示 | — |

---

## 3. カレンダーのヘッダー

| 要素 | 状態 | 今の見た目 | CSS 変数 |
|---|---|---|---|
| ヘッダー全体 | 通常 | 薄いグレーの地。下に濃いめの線。高さは左ペインの列見出しと同じ 66px | `--header-bg-color` `--grid-line-strong-color` |
| 月の見出し | 通常 | 「2026年11月」(先頭と1月だけ年付き)。12px・太字。月の始まりに縦線。横スクロールしても左ペインの右隣に残る | `--font-size-small` `--font-weight-strong` `--month-label-padding-x` |
| 曜日・日付 | 平日 | 曜日(10px・控えめな色)の下に日付(12px) | `--font-size-weekday` `--muted-text-color` `--font-size-small` |
| 〃 | 土日・祝日 | 地が休日色。日付も控えめな色 | `--day-off-color` `--muted-text-color` |
| 〃 | 今日 | 日付をオレンジの丸(20px)で囲み、白い太字。今日が土日祝でもこの見た目を優先。列の色は変えない | `--today-badge-color` `--today-color` `--today-badge-size` `--radius-pill` `--font-weight-strong` |
| 〃 | 祝日のツールチップ | マウスを乗せると「2026/11/3 文化の日」など。ブラウザ標準の title 表示 | — |

---

## 4. カレンダーの本体

| 要素 | 状態 | 今の見た目 | CSS 変数 |
|---|---|---|---|
| 日ごとの縦の帯 | 平日 | 白地。各日の左に細い縦線 | `--grid-line-width` `--grid-line-color` |
| 〃 | 土日・祝日 | ごく薄いグレー | `--day-off-color` |
| 〃 | 週の始まり(月曜) | 縦線が少し濃い | `--grid-line-strong-color` |
| 行の横罫線 | 常時 | 実線 | `--grid-line-width` `--row-line-style` `--grid-line-color` |
| 行 | マウスを乗せた行 | 地が少し明るくなる(左ペインの同じ行も一緒に)。ドラッグ中は変えない | `--row-hover-color` |
| 空き部分 | 新規作成できる位置にポインタがある | 見た目の変化なし。カーソルが十字(crosshair) | — |

---

## 5. バー

| 状態 | 今の見た目 | CSS 変数 |
|---|---|---|
| 通常 | 薄い青の地、青い 1px の枠、角丸 4px。行の高さいっぱい | `--bar-color` `--bar-border-color` `--bar-border-width` `--radius-small` `--bar-inset-y` |
| 営業日数 | バーの右(6px あけて)に「4営業日」。11px・本文より少しグレー寄り。マウス操作の対象にしない。右端が表示範囲の外なら出さない。ドラッグ中は仮の日付で数え直す | `--bar-label-color` `--font-size-caption` `--bar-label-gap` |
| ホバー(中央) | 見た目の変化なし。カーソルが手のひら(grab) | — |
| ホバー(左右の端) | 見た目の変化なし。カーソルが ↔(ew-resize)。つかめる幅は各 6px | `--bar-handle-width` |
| 選択中 | 濃い青で塗りつぶし、枠も濃い青 | `--bar-selected-color` `--bar-selected-border-color` `--bar-selected-border-width` |
| ドラッグ中(移動・伸縮・新規作成) | 選択中の見た目に、やわらかい影が付く | `--shadow-dragging` |
| 表示範囲の外に続いている | 切れている側の枠が破線になり、角丸がなくなる | `--bar-clipped-border-style` |

### 5-1. ドラッグ中のツールチップ

| 状態 | 今の見た目 | CSS 変数 |
|---|---|---|
| ドラッグ中 | バーの左端の下(6px 下)に、濃いグレー地・白文字で「11/12(木)〜11/18(水) 5営業日」。日数はバーの右の営業日数と同じ数え方(土日・祝日を除く) | `--tooltip-color` `--tooltip-text-color` `--tooltip-padding` `--tooltip-offset` `--radius-small` `--font-size-small` |

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

## 7. まだ決めていないこと

- **ツールチップの種類:** セル・祝日はブラウザ標準(title)、ドラッグ中だけ独自。そろえるかどうか
- **スクロールバー・日付入力のカレンダーのポップアップ:** ブラウザ標準のまま
- **ダークモード:** 未対応
- **キーボード操作のフォーカス表示:** 左ペインのセルと日付入力欄以外(列見出しなど)はブラウザ標準
- **営業日数の休日の範囲:** 今は土日祝のみ。会社独自の休日を含めるかは SPEC 11章 #6・#9
