import { useCallback, useEffect, useRef, useState } from 'react'

import { useLocale } from '@/lib/locale'
import { warmNoiseFont } from '@/lib/scramble'
import { useScrollLock } from '@/lib/scrollLock'
import { cn } from '@/lib/utils'

const DURATION_MS = 2400

const RESOURCE_BUDGET_MS = 2000

const FADE_MS = 700

const HOLD_MS = 160

type Phase = 'loading' | 'hiding' | 'done'

const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2)

export default function LoadingScreen() {
  const { t } = useLocale()
  const [phase, setPhase] = useState<Phase>('loading')

  const [ready, setReady] = useState(false)

  const trackRef = useRef<HTMLDivElement>(null)
  const counterRef = useRef<HTMLDivElement>(null)
  const barRef = useRef<HTMLSpanElement>(null)

  const skip = useCallback(() => setPhase('hiding'), [])

  useEffect(() => {
    if (phase !== 'loading') return

    const counter = counterRef.current
    const track = trackRef.current
    if (!counter || !track) return

    const start = performance.now()
    let frame = 0
    let finished = false

    let pageReady = document.readyState === 'complete'
    let fontsReady = false
    let readyAt: number | null = null

    const markReady = () => {
      if (readyAt !== null) return
      readyAt = performance.now()
      setReady(true)
    }
    const checkReady = () => {
      if (pageReady && fontsReady) markReady()
    }

    let travel = 0
    const measure = () => {
      const previous = counter.textContent
      counter.textContent = '100%'
      const counterWidth = counter.offsetWidth
      counter.textContent = previous
      travel = Math.max(0, track.offsetWidth - counterWidth)
    }

    const paint = (value: number) => {
      counter.textContent = `${Math.round(value)}%`

      counter.style.transform = `translate3d(${(value / 100) * travel}px,0,0)`
      if (barRef.current) barRef.current.style.transform = `scaleX(${value / 100})`
    }

    const finish = () => {
      if (finished) return
      finished = true
      if (frame) {
        cancelAnimationFrame(frame)
        frame = 0
      }
      paint(100)

      window.setTimeout(() => setPhase('hiding'), HOLD_MS)
    }

    const tick = (now: number) => {
      if (finished) return
      const elapsed = now - start
      paint(100 * easeInOut(Math.min(1, elapsed / DURATION_MS)))

      if (elapsed >= DURATION_MS && readyAt !== null) {
        finish()
        return
      }
      frame = requestAnimationFrame(tick)
    }

    const onLoad = () => {
      pageReady = true
      checkReady()
    }
    if (!pageReady) window.addEventListener('load', onLoad, { once: true })

    void warmNoiseFont().then(() => {
      fontsReady = true
      checkReady()
    })

    const capTimer = window.setTimeout(() => {
      setReady(true)
      finish()
    }, DURATION_MS + RESOURCE_BUDGET_MS)

    measure()
    window.addEventListener('resize', measure)

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      paint(100)
      const timer = window.setTimeout(() => setPhase('hiding'), 400)
      return () => {
        window.clearTimeout(timer)
        window.clearTimeout(capTimer)
        window.removeEventListener('resize', measure)
        window.removeEventListener('load', onLoad)
      }
    }

    paint(0)
    frame = requestAnimationFrame(tick)

    return () => {
      if (frame) cancelAnimationFrame(frame)
      window.clearTimeout(capTimer)
      window.removeEventListener('resize', measure)
      window.removeEventListener('load', onLoad)
    }
  }, [phase, skip])

  useEffect(() => {
    const onPointerDown = (event: PointerEvent) => {
      if (ready || event.pointerType === 'touch') skip()
    }
    const onKeyDown = () => {
      if (ready) skip()
    }
    window.addEventListener('pointerdown', onPointerDown)
    window.addEventListener('keydown', onKeyDown)
    return () => {
      window.removeEventListener('pointerdown', onPointerDown)
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [ready, skip])

  useEffect(() => {
    if (phase !== 'hiding') return
    const timer = window.setTimeout(() => setPhase('done'), FADE_MS)
    return () => window.clearTimeout(timer)
  }, [phase])

  useScrollLock(phase === 'loading')

  const done = phase === 'done'
  const faded = phase === 'hiding' || done

  return (
    <div
      className={`[--ak-boot:clamp(1.375rem,7.32vw,5.5rem)] [--ak-boot-frame:clamp(1rem,2.2vw,1.5rem)] fixed inset-0 z-[100] min-h-[var(--ak-min-height)] min-w-[var(--ak-min-width)] overflow-hidden bg-ak-bg text-[length:var(--ak-boot)] transition-opacity duration-700 ${
        faded ? 'pointer-events-none opacity-0' : 'opacity-100'
      }`}
      style={done ? { display: 'none' } : undefined}
      role="status"
      aria-live="polite"
      aria-label={t.common.loading}
      aria-hidden={faded}
    >
      <div className="absolute inset-0 bg-ak-bg" />
      <svg
        aria-hidden
        className="absolute inset-0 h-full w-full text-ak-border"
        preserveAspectRatio="none"
        viewBox="0 0 1200 800"
        fill="none"
        stroke="currentColor"
      >
        <path d="M-100 640 C 220 580, 500 720, 780 620 S 1160 540, 1320 600" opacity="0.3" />
      </svg>
      <div className="ak-scanlines absolute inset-0" />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 flex select-none items-center justify-center"
      >
        <span className="ak-loading-backdrop">{t.common.loading}</span>
      </div>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-[var(--ak-boot-frame)] border border-ak-border/70"
      >
        <span className="absolute -left-px -top-px h-6 w-6 border-l-2 border-t-2 border-ak-accent" />
        <span className="absolute -bottom-px -right-px h-6 w-6 border-b-2 border-r-2 border-ak-accent" />
      </div>
      <div className="relative flex h-full w-full flex-col justify-between p-[calc(var(--ak-boot-frame)_+_1.25rem)]">
        <div className="flex items-center justify-between">
          <span className="ak-label">{t.boot.label}</span>
          <span className="ak-index">{t.boot.serial}</span>
        </div>
        <div className="mx-auto w-full max-w-4xl">
          <div className="flex items-center gap-[0.32em]">
            <Slash />
            <div className="min-w-0 flex-1">
              <div ref={trackRef} className="relative h-[0.91em]">
                <div
                  ref={counterRef}
                  className="absolute -top-[0.047em] bottom-[0.047em] flex items-center font-mono text-[1em] font-bold leading-none tracking-tighter text-ak-accent will-change-transform"
                >
                  0%
                </div>
              </div>
              <div className="relative mt-[0.23em]">
                <div className="h-px w-full bg-ak-border" />
                <span
                  ref={barRef}
                  aria-hidden
                  className="ak-progress-fill absolute inset-x-0 top-0 h-px bg-ak-accent"
                />
                <div aria-hidden className="absolute inset-x-0 -top-1 flex justify-between">
                  {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((tick) => (
                    <span
                      key={tick}
                      className={`w-px ${tick % 4 === 0 ? 'h-2 bg-ak-accent/60' : 'h-1 bg-ak-border'}`}
                    />
                  ))}
                </div>
              </div>
            </div>
            <Slash flip />
          </div>
        </div>
        <div className="relative flex items-center justify-between">
          <span className="ak-label">{t.boot.status}</span>
          <span className="ak-index">{t.boot.statusSerial}</span>
          <p
            className={cn(
              'ak-label absolute inset-x-0 bottom-full mb-2 text-center text-ak-muted/50',
              !ready && 'invisible',
            )}
          >
            {t.boot.skip}
          </p>
        </div>
      </div>
    </div>
  )
}

function Slash({ flip = false }: { flip?: boolean }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 100 300"
      className={`h-[0.82em] w-auto shrink-0 text-ak-muted/40 ${flip ? '-scale-x-100' : ''}`}
      fill="currentColor"
    >
      <polygon points="74,0 0,300 26,300 100,0" />
    </svg>
  )
}
