export type Sample = { readonly x: number; readonly y: number; readonly t: number }
export type Pointer = 'mouse' | 'touch' | 'pen'
export type Reason = 'few' | 'fast' | 'straight' | 'even' | 'flat' | 'monotone'
export type State = 'ok' | 'short' | 'noise'
export type Verdict = {
  readonly state: State
  readonly score: number
  readonly reasons: readonly Reason[]
}

export type Attempt = {
  readonly reach: number
  readonly samples: readonly Sample[]
  readonly input: Pointer
}

export const REACH_MIN = 0.98
export const HOLD_MS = 1200
const WEIGHT: Record<Reason, number> = {
  few: 0.6,
  fast: 0.4,
  straight: 0.35,
  even: 0.35,
  flat: 0.2,
  monotone: 0.2,
}

const PASS = 0.5
const FAST_MS = 120
const READ_MIN = 8
const DEV_MIN = 0.4
const EVEN_MAX = 0.05
const FEW = 4
const FLAT_SPREAD = 1

const ratio = (values: readonly number[]) => {
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length
  if (mean === 0) return 0
  const variance =
    values.reduce((sum, value) => sum + (value - mean) * (value - mean), 0) / values.length
  return Math.sqrt(variance) / mean
}
export function judgeTrace(attempt: Attempt): Verdict {
  if (attempt.reach < REACH_MIN) return { state: 'short', score: 0, reasons: [] }

  const { samples, input } = attempt
  const reasons: Reason[] = []
  const first = samples[0]
  const last = samples[samples.length - 1]
  const duration = first && last ? last.t - first.t : 0

  if (duration < FAST_MS) reasons.push('fast')
  if (input === 'mouse') {
    if (samples.length < FEW) {
      reasons.push('few')
    } else if (first && last && samples.length >= READ_MIN) {
      const dx = last.x - first.x
      const dy = last.y - first.y
      const net = Math.hypot(dx, dy)
      let deviation = 0
      if (net > 0) {
        for (const sample of samples) {
          const cross = (sample.x - first.x) * dy - (sample.y - first.y) * dx
          deviation = Math.max(deviation, Math.abs(cross) / net)
        }
      }
      if (deviation < DEV_MIN) reasons.push('straight')

      const gaps = samples.slice(1).map((sample, index) => sample.t - samples[index].t)
      if (gaps.length >= 2 && ratio(gaps) < EVEN_MAX) reasons.push('even')

      const ys = samples.map((sample) => sample.y)
      if (Math.max(...ys) - Math.min(...ys) < FLAT_SPREAD) reasons.push('flat')

      let turned = false
      for (let i = 2; i < samples.length; i++) {
        if (samples[i].x < samples[i - 1].x) turned = true
      }
      if (!turned) reasons.push('monotone')
    }
  }

  const penalty = reasons.reduce((sum, reason) => sum + WEIGHT[reason], 0)
  const score = Math.max(0, Math.min(1, 1 - penalty))
  return { state: score >= PASS ? 'ok' : 'noise', score, reasons }
}
export function judgeHold(duration: number): Verdict {
  return duration >= HOLD_MS
    ? { state: 'ok', score: 1, reasons: [] }
    : { state: 'short', score: 0, reasons: [] }
}
