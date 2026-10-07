import { useEffect, useRef, useState } from 'react'

import { HOLD_MS, judgeHold, judgeTrace } from '@/lib/human'
import type { Pointer, Sample } from '@/lib/human'
import { useLocale } from '@/lib/locale'

const TICKS = Array.from({ length: 13 }, (_, index) => index)
const MOVE_SLOP = 6
const GRAB_PX = 12
const TRACE_MS = 420

type Phase = 'idle' | 'holding' | 'sampling' | 'ok' | 'short' | 'noise'

type Props = {
  authorized: boolean
  onAuthorize: () => void
  nudge: number
}

export default function AuthSlider({ authorized, onAuthorize, nudge }: Props) {
  const { t } = useLocale()
  const [phase, setPhase] = useState<Phase>('idle')

  const inputRef = useRef<HTMLInputElement>(null)
  const fillRef = useRef<HTMLSpanElement>(null)
  const readoutRef = useRef<HTMLSpanElement>(null)
  const liveRef = useRef<HTMLSpanElement>(null)
  const trace = useRef<Sample[]>([])
  const down = useRef<{ x: number; y: number; pointer: Pointer } | null>(null)
  const mode = useRef<'hold' | 'drag' | null>(null)
  const box = useRef<DOMRect | null>(null)
  const timers = useRef<number[]>([])

  const after = (ms: number, run: () => void) => {
    timers.current.push(window.setTimeout(run, ms))
  }

  const say = (text: string) => {
    if (readoutRef.current) readoutRef.current.textContent = text
  }

  const announce = (text: string) => {
    if (liveRef.current) liveRef.current.textContent = text
  }

  const fill = (value: number) => {
    if (fillRef.current)
      fillRef.current.style.transform = `scaleX(${Math.max(0, Math.min(1, value))})`
  }

  const clearTimers = () => {
    timers.current.forEach((timer) => window.clearTimeout(timer))
    timers.current = []
  }

  const sample = (event: PointerEvent): Sample => ({
    x: event.clientX - (box.current?.left ?? 0),
    y: event.clientY - (box.current?.top ?? 0),
    t: event.timeStamp,
  })

  const rearm = (readout: string, tone: Phase = 'idle') => {
    if (inputRef.current) inputRef.current.value = '0'
    fill(0)
    say(readout)
    setPhase(tone)
  }

  const settle = (state: 'ok' | 'short' | 'noise', score: number, traced = true) => {
    if (state === 'ok') {
      say(traced ? `${t.contact.authTrace} ${score.toFixed(2)}` : t.contact.authOk)
      setPhase('ok')
      after(TRACE_MS, () => {
        say(t.contact.authOk)
        announce(t.contact.authOk)
        onAuthorize()
      })
      return
    }

    if (state === 'short') {
      rearm(t.contact.authShort, state)
      announce(t.contact.authShort)
      return
    }

    setPhase(state)
    say(`${t.contact.authTrace} ${score.toFixed(2)}`)
    after(TRACE_MS, () => {
      rearm(t.contact.authNoise, state)
      announce(t.contact.authNoise)
    })
  }

  const onPointerDown = (event: React.PointerEvent<HTMLInputElement>) => {
    if (authorized || down.current) return
    clearTimers()

    const input = event.currentTarget
    const rect = input.getBoundingClientRect()
    box.current = rect

    const thumbX = rect.left + (Number(input.value) / 100) * rect.width
    if (Math.abs(event.clientX - thumbX) > GRAB_PX) {
      event.preventDefault()
      input.focus()
    }

    const pointer: Pointer =
      event.pointerType === 'mouse' ? 'mouse' : event.pointerType === 'pen' ? 'pen' : 'touch'

    down.current = { x: event.clientX, y: event.clientY, pointer }
    mode.current = 'hold'
    trace.current = [sample(event.nativeEvent)]
    setPhase('holding')

    const started = performance.now()
    const tick = (now: number) => {
      if (mode.current !== 'hold') return
      const held = now - started
      fill(held / HOLD_MS)
      say(`${t.contact.authHold} ${Math.min(100, Math.round((held / HOLD_MS) * 100))}%`)
      if (held >= HOLD_MS) {
        mode.current = null
        down.current = null
        input.value = '100'
        settle('ok', judgeHold(held).score, false)
        return
      }
      window.requestAnimationFrame(tick)
    }
    window.requestAnimationFrame(tick)
  }

  const onPointerMove = (event: React.PointerEvent<HTMLInputElement>) => {
    if (!down.current || authorized) return

    const native = event.nativeEvent
    const moves = native.getCoalescedEvents?.() ?? [native]
    moves.forEach((move) => trace.current.push(sample(move)))

    if (mode.current === 'hold') {
      const travelled = Math.hypot(event.clientX - down.current.x, event.clientY - down.current.y)
      if (travelled <= MOVE_SLOP) return
      mode.current = 'drag'
      setPhase('sampling')
    }

    fill(Number(event.currentTarget.value) / 100)
    say(`${t.contact.authSampling} ${trace.current.length}`)
  }

  const onPointerUp = (event: React.PointerEvent<HTMLInputElement>) => {
    const attempt = down.current
    const how = mode.current
    down.current = null
    mode.current = null
    if (!attempt || authorized) return

    if (how === 'hold') {
      rearm(t.contact.authHold)
      return
    }

    const verdict = judgeTrace({
      reach: Number(event.currentTarget.value) / 100,
      samples: trace.current,
      input: attempt.pointer,
    })
    settle(verdict.state, verdict.score)
  }

  const onInput = (event: React.FormEvent<HTMLInputElement>) => {
    if (authorized) {
      event.currentTarget.value = '100'
      return
    }
    const value = Number(event.currentTarget.value)

    if (!down.current) {
      if (value >= 100) {
        fill(1)
        say(t.contact.authOk)
        announce(t.contact.authOk)
        onAuthorize()
      }
      return
    }

    fill(value / 100)
  }

  useEffect(() => {
    if (!nudge || authorized) return
    inputRef.current?.focus()
    say(t.contact.authRequired)
  }, [nudge, authorized, t.contact.authRequired])

  useEffect(() => {
    say(t.contact.authHold)
    return clearTimers
  }, [])

  const readoutTone =
    phase === 'noise' || phase === 'short'
      ? 'text-ak-danger'
      : phase === 'ok'
        ? 'text-ak-accent'
        : 'text-ak-muted'

  return (
    <div className="mt-5 border-t border-ak-border pt-4">
      <div className="flex items-baseline justify-between gap-3">
        <span className="ak-label">{t.contact.auth}</span>
        <span ref={readoutRef} className={`ak-index ${readoutTone}`} aria-hidden />
      </div>

      <div className="relative mt-2">
        <span
          ref={fillRef}
          aria-hidden
          className="ak-progress-fill absolute inset-x-0 top-1/2 h-px bg-ak-accent"
          style={{ transform: 'scaleX(0)' }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-1/2 flex -translate-y-full items-end justify-between"
        >
          {TICKS.map((tick) => (
            <span
              key={tick}
              className={`w-px ${tick % 4 === 0 ? 'h-2 bg-ak-accent/60' : 'h-1 bg-ak-border'}`}
            />
          ))}
        </div>
        <input
          ref={inputRef}
          type="range"
          min={0}
          max={100}
          step={1}
          defaultValue={0}
          aria-disabled={authorized}
          aria-label={t.contact.auth}
          className="ak-auth"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          onInput={onInput}
        />
      </div>

      <span ref={liveRef} role="status" aria-live="polite" className="sr-only" />
    </div>
  )
}
