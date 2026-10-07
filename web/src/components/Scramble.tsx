import { useLayoutEffect, useRef } from 'react'

import { scrambleDuration, scrambleFrame } from '@/lib/scramble'

const HEIGHT_MS = 260

const MIN_GROW = 5

export default function Scramble({ text }: { text: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  const previous = useRef(text)

  useLayoutEffect(() => {
    const element = ref.current
    if (!element) return

    const from = previous.current
    previous.current = text

    if (from === text || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      element.textContent = text
      return
    }

    try {
      return run(element, from, text)
    } catch (error) {
      console.error('[scramble] failed, showing the plain text:', error)
      element.textContent = text
      return undefined
    }
  }, [text])

  return (
    <>
      <span ref={ref} aria-hidden />
      <span className="sr-only">{text}</span>
    </>
  )
}

function run(element: HTMLSpanElement, from: string, text: string): () => void {
  const block = element.parentElement
  const duration = scrambleDuration(from)

  const salt = (Math.random() * 0xffffffff) | 0
  let endHeight = 0
  let restoreBox: (() => void) | undefined
  let settleTimer = 0

  if (block) {
    element.textContent = from
    const startHeight = block.offsetHeight
    element.textContent = text
    endHeight = block.offsetHeight

    let maxHeight = Math.max(startHeight, endHeight)
    for (const at of [0.05, 0.11, 0.18]) {
      element.textContent = scrambleFrame(from, text, duration * at, salt)
      maxHeight = Math.max(maxHeight, block.offsetHeight)
    }

    if (maxHeight > startHeight) maxHeight = Math.max(maxHeight, startHeight + MIN_GROW)

    const inline = {
      height: block.style.height,
      overflow: block.style.overflow,
      transition: block.style.transition,
    }
    restoreBox = () => {
      block.style.height = inline.height
      block.style.overflow = inline.overflow
      block.style.transition = inline.transition
    }

    block.style.overflow = 'hidden'
    block.style.height = `${startHeight}px`

    void block.offsetHeight
    block.style.transition = `height ${HEIGHT_MS}ms var(--ak-ease)`
    block.style.height = `${maxHeight}px`
  }

  const finish = () => {
    element.textContent = text
    if (block && restoreBox) {
      block.style.height = `${endHeight}px`
      settleTimer = window.setTimeout(restoreBox, HEIGHT_MS + 40)
    }
  }

  let frame = 0
  const start = performance.now()
  const tick = (now: number) => {
    try {
      const elapsed = now - start
      if (elapsed >= duration) {
        finish()
        return
      }
      element.textContent = scrambleFrame(from, text, elapsed, salt)
      frame = requestAnimationFrame(tick)
    } catch (error) {
      console.error('[scramble] failed mid-effect, showing the plain text:', error)
      finish()
    }
  }

  element.textContent = scrambleFrame(from, text, 0, salt)
  frame = requestAnimationFrame(tick)
  return () => {
    cancelAnimationFrame(frame)
    window.clearTimeout(settleTimer)
    restoreBox?.()
  }
}
