const UPPER = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
const LOWER = 'abcdefghijklmnopqrstuvwxyz'
const DIGITS = '0123456789'
const PUNCT = '#%&*+-/<>|_=~^$@?!'

export const CJK_NOISE =
  '魔繁藏覆攀耀露霸徽翼巍颤警蘑藻灌籍壤疆霞霜鹰瀑藤瞬蹈躁稽穆爵骤凝磨燃融镜雕篮箭墨慕暮潮蕴澜磐潜澄翻穗鞠鞭簇' +
  '想感需影题整精演满换航联篇都章项道家能海站钱清情接推提报真笑爱难高请读起播边达迎运近返还通速造采里重量' +
  '链销错键闭问间闻阅阿际限院除随隐集顶预领频风馈腾自至致良色艺节花英范荐获营落表被装见观规视算觉角解言计' +
  '订认让议讯记许论设访证评识诉词试话询该详语说调象财责账货质购贴费资走超越足路身车转软轻载较辑过这进远连' +
  '送适选部配金'

export async function warmNoiseFont(): Promise<void> {
  if (typeof document === 'undefined' || !document.fonts) return
  try {
    await Promise.allSettled([
      document.fonts.load('400 1rem "Noto Sans SC"', CJK_NOISE),
      document.fonts.load('700 1rem "Noto Sans SC"', CJK_NOISE),
    ])
  } catch {}
}

const CJK_RE = /[\u3000-\u303f\u3040-\u30ff\u3400-\u9fff\uac00-\ud7af\uff00-\uffef]/
const BREAK_AT = 0.21
const CLEAR_AT = 0.35
const HOLD_AT = 0.46
const GROW_AT = 0.64
const MS_PER_CHAR = 23
const MIN_MS = 480
const MAX_MS = 2000

export function scrambleDuration(from: string): number {
  return Math.min(MAX_MS, Math.max(MIN_MS, from.length * MS_PER_CHAR))
}

const FLICKER_MS = 90

function hash(a: number, b: number): number {
  let h = Math.imul(a + 1, 0x9e3779b1) ^ Math.imul(b + 1, 0x85ebca6b)
  h ^= h >>> 15
  h = Math.imul(h, 0xc2b2ae35)
  h ^= h >>> 13
  h = Math.imul(h, 0x27d4eb2f)
  h ^= h >>> 16
  return (h >>> 0) / 0x100000000
}

const flickerOffset = (index: number, salt: number) => hash(index + salt, 0x51ed2701) * FLICKER_MS

function glitch(ch: string, index: number, elapsed: number, salt: number): string {
  if (ch === ' ' || ch === '\u00a0') return ch
  const epoch = Math.floor((elapsed + flickerOffset(index, salt)) / FLICKER_MS)
  const rand = hash(index + salt, epoch)
  if (CJK_RE.test(ch)) return CJK_NOISE[(rand * CJK_NOISE.length) | 0]
  if (ch >= 'a' && ch <= 'z') return LOWER[(rand * LOWER.length) | 0]
  if (ch >= 'A' && ch <= 'Z') return UPPER[(rand * UPPER.length) | 0]
  if (ch >= '0' && ch <= '9') return DIGITS[(rand * DIGITS.length) | 0]
  return PUNCT[(rand * PUNCT.length) | 0]
}

const mapChars = (text: string, map: (ch: string, index: number) => string) =>
  Array.from(text, map).join('')

const lockAt = (index: number, salt: number) => hash(index + salt, 0x1f16d2c9) * 0.85

export function scrambleFrame(from: string, to: string, elapsed: number, salt = 0): string {
  const duration = scrambleDuration(from)
  const breakEnd = duration * BREAK_AT
  const clearEnd = duration * CLEAR_AT
  const holdEnd = duration * HOLD_AT
  const growEnd = duration * GROW_AT

  if (elapsed < breakEnd) {
    const progress = elapsed / breakEnd
    return mapChars(from, (ch, index) =>
      lockAt(index, salt ^ 0x9e3779b9) <= progress ? glitch(ch, index, elapsed, salt) : ch,
    )
  }

  if (elapsed < clearEnd) {
    const progress = (elapsed - breakEnd) / (clearEnd - breakEnd)
    const kept = Math.max(0, Math.ceil(from.length * (1 - progress)))
    return mapChars(from.slice(0, kept), (ch, index) => glitch(ch, index, elapsed, salt))
  }

  if (elapsed < holdEnd) return '\u00a0'

  if (elapsed < growEnd) {
    const progress = (elapsed - holdEnd) / (growEnd - holdEnd)
    const shown = Math.floor(progress * to.length)
    return mapChars(to.slice(0, shown), (ch, index) => glitch(ch, index, elapsed, salt))
  }

  const progress = Math.min(1, (elapsed - growEnd) / (duration - growEnd))
  return mapChars(to, (ch, index) =>
    lockAt(index, salt) <= progress ? ch : glitch(ch, index, elapsed, salt),
  )
}
