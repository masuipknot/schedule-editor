// 日付ユーティリティ
//
// アプリ内では日付を "YYYY-MM-DD" 文字列で扱う。Date への変換はこのファイルの中だけで行う。
// new Date("2026-04-01") は UTC の 0 時として解釈されるため、日本時間の環境では
// getDate() などで読むと前日になることがある。ここでは Date.UTC で作って getUTC* で読む、
// という「UTC だけで完結する」書き方に統一して、タイムゾーンの影響を受けないようにしている。

/** "YYYY-MM-DD" 形式の日付文字列(型としては string の別名。読みやすさのため) */
export type Ymd = string

const MS_PER_DAY = 24 * 60 * 60 * 1000
const WEEKDAYS_JA = ['日', '月', '火', '水', '木', '金', '土'] as const

function pad2(n: number): string {
  return String(n).padStart(2, '0')
}

/** 年月日の数値から "YYYY-MM-DD" を作る(存在しない日付のチェックはしない) */
function toYmd(year: number, month: number, day: number): Ymd {
  return `${year}-${pad2(month)}-${pad2(day)}`
}

/** "YYYY-MM-DD" を年・月・日の数値に分解する */
function splitYmd(ymd: Ymd): { year: number; month: number; day: number } {
  const [year, month, day] = ymd.split('-').map(Number)
  return { year, month, day }
}

/** "YYYY-MM-DD" → UTC 0 時の Date。外には出さない */
function toUtcDate(ymd: Ymd): Date {
  const { year, month, day } = splitYmd(ymd)
  return new Date(Date.UTC(year, month - 1, day))
}

/** UTC の Date → "YYYY-MM-DD" */
function fromUtcDate(date: Date): Ymd {
  return toYmd(date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate())
}

/** 実在する日付かどうか(2/30 や 13/1 を弾くため) */
export function isValidDate(year: number, month: number, day: number): boolean {
  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) return false
  if (month < 1 || month > 12 || day < 1) return false
  // Date.UTC は 2/30 を 3/2 に繰り上げるので、作り直して元と一致するかで判定する
  const d = new Date(Date.UTC(year, month - 1, day))
  return d.getUTCFullYear() === year && d.getUTCMonth() === month - 1 && d.getUTCDate() === day
}

/** 今日の日付。「今日」は利用者の手元の暦で決まるので、ここだけはローカル時刻で読む */
export function today(): Ymd {
  const now = new Date()
  return toYmd(now.getFullYear(), now.getMonth() + 1, now.getDate())
}

/** n 日後(負なら n 日前) */
export function addDays(ymd: Ymd, n: number): Ymd {
  const d = toUtcDate(ymd)
  d.setUTCDate(d.getUTCDate() + n)
  return fromUtcDate(d)
}

/** to - from の日数。同じ日なら 0 */
export function diffDays(from: Ymd, to: Ymd): number {
  // UTC 同士なので夏時間などのずれがなく、割り切れる
  return Math.round((toUtcDate(to).getTime() - toUtcDate(from).getTime()) / MS_PER_DAY)
}

/**
 * 日付の大小比較。"YYYY-MM-DD" はゼロ埋めされているので、文字列の比較がそのまま日付の比較になる。
 * 関数にしておくのは「文字列比較でよい理由」を1か所に書いておくため
 */
export function compareYmd(a: Ymd, b: Ymd): number {
  return a < b ? -1 : a > b ? 1 : 0
}

/** その月の1日 */
export function startOfMonth(ymd: Ymd): Ymd {
  const { year, month } = splitYmd(ymd)
  return toYmd(year, month, 1)
}

/** 年・月・日をそれぞれ数値で取り出す(表示用) */
export function getYmdParts(ymd: Ymd): { year: number; month: number; day: number } {
  return splitYmd(ymd)
}

/** 曜日番号(0=日〜6=土) */
export function dayOfWeek(ymd: Ymd): number {
  return toUtcDate(ymd).getUTCDay()
}

/** 曜日の日本語1文字(月火水木金土日) */
export function weekdayJa(ymd: Ymd): string {
  return WEEKDAYS_JA[dayOfWeek(ymd)]
}

export function isWeekend(ymd: Ymd): boolean {
  const w = dayOfWeek(ymd)
  return w === 0 || w === 6
}

/** 画面表示用 "M/D"(例: 4/1) */
export function formatMD(ymd: Ymd): string {
  const { month, day } = splitYmd(ymd)
  return `${month}/${day}`
}

/** 年付きの表示 "YYYY/M/D"(例: 2026/4/1)。ツールチップや、後でスプレッドシートへのコピーに使う */
export function formatYmdSlash(ymd: Ymd): string {
  const { year, month, day } = splitYmd(ymd)
  return `${year}/${month}/${day}`
}

/** 全角数字・全角スラッシュ・全角ハイフンを半角にそろえる */
function normalizeInput(text: string): string {
  return text
    .trim()
    .replace(/[０-９]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xfee0))
    .replace(/／/g, '/')
    .replace(/[－−]/g, '-')
}

/**
 * 利用者が入力した日付文字列を "YYYY-MM-DD" に変換する。解釈できなければ null。
 *
 * 受け付ける形式: 4/1, 04/01, 4-1, 2026/4/1, 2026-04-01(全角も可)
 * 年を省略した場合は、表示開始日(viewStart)から365日以内に入る年を選ぶ。
 * 例: 表示開始が 2026-10-01 のとき "3/1" は 2027-03-01 になる。
 * 「今年」ではなく表示開始日を基準にするのは、年をまたぐ案件で後半の日付を入れたときに
 * 過去の日付として解釈されてしまうのを防ぐため。
 */
export function parseDateInput(text: string, viewStart: Ymd): Ymd | null {
  const s = normalizeInput(text)

  const full = /^(\d{4})[/-](\d{1,2})[/-](\d{1,2})$/.exec(s)
  if (full) {
    const [year, month, day] = full.slice(1).map(Number)
    return isValidDate(year, month, day) ? toYmd(year, month, day) : null
  }

  const short = /^(\d{1,2})[/-](\d{1,2})$/.exec(s)
  if (short) {
    const [month, day] = short.slice(1).map(Number)
    const baseYear = splitYmd(viewStart).year
    // 表示開始日と同じ年で、表示開始日以降ならその年。そうでなければ翌年。
    // どちらでも表示開始日から1年以内に収まる
    for (const year of [baseYear, baseYear + 1]) {
      if (isValidDate(year, month, day)) {
        const candidate = toYmd(year, month, day)
        if (compareYmd(candidate, viewStart) >= 0) return candidate
      }
    }
    return null
  }

  return null
}
