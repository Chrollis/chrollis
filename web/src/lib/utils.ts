export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ')
}

export function formatDate(input: string | Date, sep = '.'): string {
  const d = typeof input === 'string' ? new Date(input) : input
  if (Number.isNaN(d.getTime())) return String(input)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}${sep}${pad(d.getMonth() + 1)}${sep}${pad(d.getDate())}`
}

const MINUTE_MS = 60_000
const HOUR_MS = 60 * MINUTE_MS
const DAY_MS = 24 * HOUR_MS
const WEEK_MS = 7 * DAY_MS
const MONTH_MS = 30 * DAY_MS
const YEAR_MS = 365 * DAY_MS

const RELATIVE_RUNGS: ReadonlyArray<readonly [limit: number, unit: number, label: string]> = [
  [HOUR_MS, MINUTE_MS, 'MIN'],
  [DAY_MS, HOUR_MS, 'H'],
  [WEEK_MS, DAY_MS, 'D'],
  [MONTH_MS, WEEK_MS, 'W'],
  [YEAR_MS, MONTH_MS, 'MO'],
  [Number.POSITIVE_INFINITY, YEAR_MS, 'Y'],
]

export function formatRelative(input: string | Date, now: Date = new Date()): string {
  const d = typeof input === 'string' ? new Date(input) : input
  if (Number.isNaN(d.getTime())) return String(input)

  const elapsed = now.getTime() - d.getTime()
  if (elapsed < MINUTE_MS) return 'NOW'

  for (const [limit, unit, label] of RELATIVE_RUNGS) {
    if (elapsed < limit) return `${Math.floor(elapsed / unit)} ${label}`
  }

  return 'NOW'
}

export function readingTime(markdown: string): number {
  const text = markdown
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`[^`]*`/g, '')
    .replace(/!?\[[^\]]*\]\([^)]*\)/g, '')

  const cjk = (text.match(/[\u3400-\u4dbf\u4e00-\u9fff\u3040-\u30ff\uac00-\ud7af]/g) ?? []).length
  const words = (
    text
      .replace(/[\u3400-\u4dbf\u4e00-\u9fff\u3040-\u30ff\uac00-\ud7af]/g, ' ')
      .match(/\b[\w'-]+\b/g) ?? []
  ).length

  return Math.max(1, Math.round(cjk / 400 + words / 220))
}

export function stripMarkdown(markdown: string, maxLength = 160): string {
  const text = markdown
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`([^`]*)`/g, '$1')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/^\s{0,3}#{1,6}\s+/gm, '')
    .replace(/^\s{0,3}>\s?/gm, '')
    .replace(/[*_~]/g, '')
    .replace(/\s+/g, ' ')
    .trim()

  return text.length <= maxLength ? text : `${text.slice(0, maxLength).trimEnd()}...`
}

export function padIndex(n: number, size = 2): string {
  return String(n).padStart(size, '0')
}

export function debounce<T extends (...args: never[]) => void>(fn: T, wait = 200) {
  let timer: ReturnType<typeof setTimeout> | undefined
  return (...args: Parameters<T>) => {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => fn(...args), wait)
  }
}
