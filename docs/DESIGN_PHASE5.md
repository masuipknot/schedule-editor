# Phase 5 デザイン作業の記録

最終更新: 2026-11-05

Phase 5(デザイン適用)のために Claude のデザインキャンバスで作った案と、決まったことの記録。
アプリのコードにはまだ反映していない(handoff bundle を受け取ってから、SPEC 10章の手順で反映する)。

## デザインキャンバス

- URL: https://claude.ai/artifact/Rvbu6VfinBAq2s6UW8NmS8 (非公開。共有するときはページの Share メニューから)
- アートボード

| アートボード | 内容 |
|---|---|
| 画面(トークン案A) | アプリの画面全体。採用したトークンを反映済み |
| UI 状態の一覧(トークン案A) | `docs/UI_STATES.md` の全状態。採用したトークンを反映済み |
| CSS 変数(現在のアプリの値) | 比較用。今のアプリ(`src/index.css`)の値のまま |
| トークン案A: クリア(採用) | 採用案。プレビュー、数字の書体の比較、「現在値 → 案の値」の表 |
| トークン案B: スプレッドシート準拠 | 不採用(比較用に残している) |
| トークン案C: あたたかい紙 | 不採用(比較用に残している) |

## 決まったこと(2026-11-05)

1. トークン案A(クリア)を採用: 白基調、青系のバー、薄いグレーの休日、実線の罫線
2. 修正
   - 角丸 `--radius-small` は 3px(案A当初の 6px から控えめに)
   - 書体は、日本語を Noto Sans JP、数字・英字を Inter(候補: Inter / Roboto / IBM Plex Sans から Inter を推奨・採用)。数字の幅をそろえる(tabular-nums)
   - 今日の目印は赤い縦線をやめ、今日の列を薄い暖色で塗る
3. 寸法(`src/layout.ts` 管理の行の高さ・列幅)は変えない

## 採用したトークンの値

変数名は `src/index.css` と同じ。「現在」は今のアプリの値。

### 文字

| 変数 | 現在 | 採用 |
|---|---|---|
| `--font-family` | system-ui ほか | `'Inter', 'Noto Sans JP', sans-serif` |
| `--font-variant-numeric` | (なし) | `tabular-nums` **(追加)** |
| `--font-size-title` | 15px | 15px |
| `--font-size-body` | 13px | 13px |
| `--font-size-small` | 12px | 12px |
| `--font-weight-strong` | bold | 600 |

### 色

| 変数 | 現在 | 採用 |
|---|---|---|
| `--text-color` | #222 | #1f2328 |
| `--surface-color` | #fff | #ffffff |
| `--toolbar-color` | #f6f7f9 | #ffffff |
| `--grid-line-color` | #d9d9d9 | #e5e7eb |
| `--grid-line-strong-color` | #b5b5b5 | #c9ced6 |
| `--day-off-color` | #cccccc | #f1f3f5 |
| `--today-color` | #d93025 | #b54708(今日の日付の文字) |
| `--today-bg-color` | (なし) | #fff1e0 **(追加。今日の列の背景)** |
| `--bar-color` | #ffd966 | #cfe1ff |
| `--bar-border-color` | #e0b400 | #5b8def |
| `--bar-selected-color` | #ffc928 | #a9c8ff |
| `--bar-selected-border-color` | #b07d00 | #1f5fd1 |
| `--tooltip-color` | #333 | #1f2328 |
| `--tooltip-text-color` | #fff | #ffffff |
| `--focus-color` | #1a73e8 | #1f6feb |
| `--selection-color` | #e8f0fe | #e7f0ff |
| `--error-color` | #d93025 | #cf222e |
| `--notice-color` | #fff4e5 | #fff8e5 |
| `--notice-border-color` | #f0b25a | #e6b44d |
| `--notice-text-color` | #8a4b00 | #7a4e00 |

### 線・角丸・影

| 変数 | 現在 | 採用 |
|---|---|---|
| `--grid-line-width` | 1px | 1px |
| `--row-line-style` | dotted | solid |
| `--pane-divider-width` | 2px | 1px |
| `--focus-ring-width` | 2px | 2px |
| `--bar-border-width` | 1px | 1px |
| `--bar-selected-border-width` | 2px | 2px |
| `--bar-clipped-border-style` | dashed | dashed |
| `--today-line-width` | 2px | **(廃止)** |
| `--today-line-opacity` | 0.35 | **(廃止)** |
| `--radius-small` | 3px | 3px |
| `--shadow-dragging` | 0 2px 6px rgb(0 0 0 / 0.25) | 0 4px 12px rgb(15 23 42 / 0.18) |
| `--shadow-editing` | 0 1px 4px rgb(0 0 0 / 0.2) | 0 2px 8px rgb(15 23 42 / 0.15) |

### 余白・位置

| 変数 | 現在 | 採用 |
|---|---|---|
| `--toolbar-height` | 44px | 48px |
| `--toolbar-padding-x` | 12px | 16px |
| `--toolbar-gap` | 16px | 20px |
| `--field-gap` | 6px | 8px |
| `--cell-padding-x` | 6px | 8px |
| `--header-label-padding-bottom` | 4px | 6px |
| `--month-label-padding-x` | 4px | 6px |
| `--bar-inset-y` | 4px | 4px |
| `--bar-handle-width` | 6px | 6px |
| `--tooltip-offset` | 6px | 6px |
| `--tooltip-padding` | 2px 6px | 3px 8px |
| `--badge-padding` | 2px 8px | 3px 10px |

## アプリへ反映するときの注意(Phase 5 の実装時に確認する)

- **値の変更だけでは済まないもの**
  - 今日の目印: 縦線(`Calendar.module.css` の `.todayLine`)をやめ、今日の列(本体の縦の帯とヘッダーの日・曜日)の背景を `--today-bg-color` にする。休日色より優先する
  - 変数の追加(`--today-bg-color`、`--font-variant-numeric`)と廃止(`--today-line-width`、`--today-line-opacity`)
  - `docs/UI_STATES.md` の該当箇所の更新
- **Web フォントの読み込み**: Noto Sans JP と Inter を読み込む必要がある。Google Fonts の `<link>` を `index.html` に足すか、npm パッケージ(`@fontsource` など)で自前配信するかを決める(後者はパッケージ追加なので CLAUDE.md のとおり事前に確認する)
- **未決**: バーだけ角丸を変えたくなった場合は `--bar-radius` を分ける案がある(現在は `--radius-small` を共用)

## 次にやること

1. デザインキャンバスで細部を詰める(必要なら)
2. handoff bundle を受け取る
3. bundle のデザイントークンと `src/index.css` の変数の対応を整理してから反映する(SPEC 10章 Phase 5)
