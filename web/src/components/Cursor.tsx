import { useEffect, useRef } from 'react'

const TRAIL = 0.22
const LOCK_TRAIL = 0.14
const EPSILON = 0.05

const IDLE_HALF = 7
const HOVER_HALF = 20

const LOCK_OUTSET = 3

const MIN_LOCK_HALF = 7

const MAX_FRAMED = 320

const SPIN_PERIOD = 9000

const ROTATE_EASE = 0.16

const PRESS_SCALE = 0.86
const SCALE_EASE = 0.25

const NUDGE_GAIN = 0.25
const NUDGE_DECAY = 0.9
const NUDGE_LIMIT = 18

const TAU = Math.PI * 2

const INTERACTIVE =
  'a, button, input, textarea, select, summary, label, [role="button"], [data-cursor]'

export default function Cursor() {
  const rootRef = useRef<HTMLDivElement>(null)
  const dotRef = useRef<HTMLDivElement>(null)
  const reticleRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!window.matchMedia('(pointer: fine)').matches) return

    const root = rootRef.current
    const dot = dotRef.current
    const reticle = reticleRef.current
    if (!root || !dot || !reticle) return

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    let pointerX = 0
    let pointerY = 0
    let centreX = 0
    let centreY = 0

    let angle = 0
    let halfX = IDLE_HALF
    let halfY = IDLE_HALF
    let scale = 1

    let nudgeX = 0
    let nudgeY = 0

    let framed: Element | null = null

    let drawnDotX = Number.NaN
    let drawnDotY = Number.NaN
    let drawnCentreX = Number.NaN
    let drawnCentreY = Number.NaN
    let drawnAngle = Number.NaN
    let drawnHalfX = Number.NaN
    let drawnHalfY = Number.NaN
    let drawnScale = Number.NaN

    let placed = false
    let visible = false
    let pressed = false
    let overTarget = false
    let lastTarget: EventTarget | null = null
    let lastTime = 0
    let frame = 0

    const paintState = () => {
      const next = pressed ? 'press' : overTarget ? 'hover' : 'idle'
      if (root.dataset.state !== next) root.dataset.state = next
    }

    const show = () => {
      if (visible) return
      visible = true
      root.dataset.visible = 'true'
    }

    const hide = () => {
      if (!visible) return
      visible = false
      root.dataset.visible = 'false'

      placed = false
    }

    const axisAligned = (value: number) => Math.round(value / Math.PI) * Math.PI

    const onPointerMove = (event: PointerEvent) => {
      const dx = event.clientX - pointerX
      const dy = event.clientY - pointerY
      pointerX = event.clientX
      pointerY = event.clientY

      if (!placed) {
        centreX = pointerX
        centreY = pointerY
        placed = true
      }

      if (framed !== null && !reduced) {
        nudgeX = Math.max(
          -NUDGE_LIMIT,
          Math.min(NUDGE_LIMIT, (nudgeX + dx * NUDGE_GAIN) * NUDGE_DECAY),
        )
        nudgeY = Math.max(
          -NUDGE_LIMIT,
          Math.min(NUDGE_LIMIT, (nudgeY + dy * NUDGE_GAIN) * NUDGE_DECAY),
        )
      }

      show()

      if (event.target !== lastTarget) {
        lastTarget = event.target
        const hit = event.target instanceof Element ? event.target.closest(INTERACTIVE) : null
        const next = hit !== null

        const box = hit?.getBoundingClientRect()
        const frameable =
          box && box.width <= MAX_FRAMED && box.height <= MAX_FRAMED && box.width > 0 ? hit : null

        if (frameable !== framed) {
          framed = frameable

          nudgeX = 0
          nudgeY = 0
        }

        if (next !== overTarget) {
          overTarget = next
          paintState()
        }
      }
    }

    const onPointerDown = () => {
      pressed = true
      paintState()
    }

    const onPointerUp = () => {
      pressed = false
      paintState()
    }

    const onPointerOut = (event: PointerEvent) => {
      if (event.relatedTarget === null) hide()
    }

    const onBlur = () => hide()
    const onVisibility = () => {
      if (document.hidden) hide()
    }

    const tick = (time: number) => {
      frame = requestAnimationFrame(tick)

      const elapsed = lastTime === 0 ? 16 : Math.min(64, time - lastTime)
      lastTime = time

      const rect = framed?.getBoundingClientRect()
      const locked = rect !== undefined && rect.width > 0

      const targetX = locked ? rect.left + rect.width / 2 : pointerX
      const targetY = locked ? rect.top + rect.height / 2 : pointerY
      const wantHalfX = locked
        ? Math.max(MIN_LOCK_HALF, rect.width / 2 + LOCK_OUTSET)
        : overTarget
          ? HOVER_HALF
          : IDLE_HALF
      const wantHalfY = locked
        ? Math.max(MIN_LOCK_HALF, rect.height / 2 + LOCK_OUTSET)
        : overTarget
          ? HOVER_HALF
          : IDLE_HALF

      const attending = locked || overTarget

      if (!attending && !reduced) angle += (elapsed / SPIN_PERIOD) * TAU

      if (attending || reduced) {
        const want = attending ? axisAligned(angle) : 0
        let delta = want - angle
        delta -= TAU * Math.round(delta / TAU)
        angle += delta * (reduced ? 1 : ROTATE_EASE)
      }

      const extentEase = reduced ? 1 : locked ? LOCK_TRAIL : TRAIL
      halfX += (wantHalfX - halfX) * extentEase
      halfY += (wantHalfY - halfY) * extentEase

      const positionEase = reduced ? 1 : locked ? LOCK_TRAIL : TRAIL
      centreX += (targetX - centreX) * positionEase
      centreY += (targetY - centreY) * positionEase

      if (locked) {
        nudgeX *= NUDGE_DECAY
        nudgeY *= NUDGE_DECAY
      } else {
        nudgeX = 0
        nudgeY = 0
      }

      const drawX = centreX + nudgeX
      const drawY = centreY + nudgeY

      const wantScale = pressed ? PRESS_SCALE : 1
      scale += (wantScale - scale) * (reduced ? 1 : SCALE_EASE)

      if (Math.abs(targetX - centreX) < EPSILON) centreX = targetX
      if (Math.abs(targetY - centreY) < EPSILON) centreY = targetY

      if (pointerX !== drawnDotX || pointerY !== drawnDotY) {
        dot.style.transform = `translate3d(${pointerX}px, ${pointerY}px, 0)`
        drawnDotX = pointerX
        drawnDotY = pointerY
      }

      if (drawX !== drawnCentreX || drawY !== drawnCentreY) {
        reticle.style.transform = `translate3d(${drawX}px, ${drawY}px, 0)`
        drawnCentreX = drawX
        drawnCentreY = drawY
      }

      if (halfX !== drawnHalfX || halfY !== drawnHalfY) {
        root.style.setProperty('--ak-cursor-x', `${halfX}px`)
        root.style.setProperty('--ak-cursor-y', `${halfY}px`)
        drawnHalfX = halfX
        drawnHalfY = halfY
      }
      if (angle !== drawnAngle) {
        root.style.setProperty('--ak-cursor-angle', `${angle}rad`)
        drawnAngle = angle
      }
      if (scale !== drawnScale) {
        root.style.setProperty('--ak-cursor-scale', String(scale))
        drawnScale = scale
      }
    }

    document.documentElement.classList.add('ak-cursor-active')

    window.addEventListener('pointermove', onPointerMove, { passive: true })
    window.addEventListener('pointerdown', onPointerDown, { passive: true })
    window.addEventListener('pointerup', onPointerUp, { passive: true })
    document.addEventListener('pointerout', onPointerOut)
    window.addEventListener('blur', onBlur)
    document.addEventListener('visibilitychange', onVisibility)

    frame = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(frame)
      document.documentElement.classList.remove('ak-cursor-active')
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerdown', onPointerDown)
      window.removeEventListener('pointerup', onPointerUp)
      document.removeEventListener('pointerout', onPointerOut)
      window.removeEventListener('blur', onBlur)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [])

  return (
    <div
      ref={rootRef}
      className="ak-cursor"
      data-visible="false"
      data-state="idle"
      aria-hidden="true"
    >
      <div ref={dotRef} className="ak-cursor-dot" />

      <div ref={reticleRef} className="ak-cursor-reticle">
        <div className="ak-cursor-brackets">
          <i className="ak-cursor-arm" data-corner="tl" />
          <i className="ak-cursor-arm" data-corner="tr" />
          <i className="ak-cursor-arm" data-corner="br" />
          <i className="ak-cursor-arm" data-corner="bl" />
        </div>
      </div>
    </div>
  )
}
