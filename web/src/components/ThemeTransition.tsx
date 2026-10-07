import { useEffect, useRef } from 'react'

import { registerThemeSwap, setTheme } from '@/lib/theme'
import type { Theme } from '@/lib/theme'

const IN_MS = 240
const HOLD_MS = 60
const OUT_MS = 320
const TOTAL_MS = IN_MS + HOLD_MS + OUT_MS

const SCANLINE_ALPHA = 0.06

const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2)

type Rgb = [number, number, number]

function channels(value: string): Rgb {
  const parts = value.trim().split(/\s+/).map(Number)
  return [parts[0] || 0, parts[1] || 0, parts[2] || 0]
}

function paletteOf(theme: Theme): { bg: Rgb; line: string } {
  const root = document.documentElement
  const previous = root.getAttribute('data-theme')
  root.setAttribute('data-theme', theme)
  const style = getComputedStyle(root)
  const bg = channels(style.getPropertyValue('--ak-bg'))
  const line = style.getPropertyValue('--ak-text').trim() || '0 0 0'
  if (previous === null) root.removeAttribute('data-theme')
  else root.setAttribute('data-theme', previous)
  return { bg, line }
}

export default function ThemeTransition() {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const element = ref.current
    if (!element) return

    let frame = 0
    let commitTimer = 0
    let clearTimer = 0

    let shown: Rgb | null = null

    const stop = () => {
      cancelAnimationFrame(frame)
      window.clearTimeout(commitTimer)
      window.clearTimeout(clearTimer)
    }

    const run = (next: Theme) => {
      const { bg: to, line } = paletteOf(next)
      const from =
        shown ?? channels(getComputedStyle(document.documentElement).getPropertyValue('--ak-bg'))

      element.style.backgroundImage = `repeating-linear-gradient(0deg, rgb(${line} / ${SCANLINE_ALPHA}) 0 1px, transparent 1px 4px)`

      stop()
      const start = performance.now()
      let committed = false

      const commit = () => {
        if (committed) return
        committed = true
        setTheme(next)
      }

      const tick = (now: number) => {
        const elapsed = now - start

        if (elapsed >= TOTAL_MS) {
          element.style.opacity = '0'
          shown = null
          return
        }

        let opacity: number
        if (elapsed < IN_MS) opacity = easeInOut(elapsed / IN_MS)
        else if (elapsed < IN_MS + HOLD_MS) opacity = 1
        else opacity = Math.pow(1 - (elapsed - IN_MS - HOLD_MS) / OUT_MS, 2)

        if (elapsed >= IN_MS) commit()

        const k = elapsed < IN_MS ? easeInOut(elapsed / IN_MS) : 1
        const colour: Rgb = [
          from[0] + (to[0] - from[0]) * k,
          from[1] + (to[1] - from[1]) * k,
          from[2] + (to[2] - from[2]) * k,
        ]

        shown = colour
        element.style.backgroundColor = `rgb(${Math.round(colour[0])} ${Math.round(colour[1])} ${Math.round(colour[2])})`
        element.style.opacity = String(opacity)
        frame = requestAnimationFrame(tick)
      }

      commitTimer = window.setTimeout(commit, IN_MS)
      clearTimer = window.setTimeout(() => {
        commit()
        element.style.opacity = '0'
        shown = null
      }, TOTAL_MS + 120)

      frame = requestAnimationFrame(tick)
    }

    registerThemeSwap(run)
    return () => {
      registerThemeSwap(null)
      stop()
    }
  }, [])

  return (
    <div ref={ref} aria-hidden className="pointer-events-none fixed inset-0 z-[70] opacity-0" />
  )
}
