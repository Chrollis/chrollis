import { useEffect, useRef } from 'react'

const REF_DT = 1000 / 60

const MAX_DT = 64

const perFrame = (k: number, frames: number) => 1 - Math.pow(1 - k, frames)

const CELL = 26
const DOT_RADIUS = 1.2

const BASE_ALPHA = 0.16
const LIT_ALPHA = 0.72

const EASE = 0.045

const RETARGET_CHANCE = 0.005

const TEAL_RATIO = 0.14

const ATTRACT_RADIUS = 82

const ATTRACT_FORCE = 3

const RING_STEP = 12

const trackRadius = (track: number) => RING_STEP * (track + 1)

const trackCapacity = (track: number) => Math.floor(trackRadius(track) / 2)

const CAPTURE_RADIUS = RING_STEP * 3

const SLOT_EASE = 0.08

const RING_EASE = 0.16

const ORBIT_SPEED = 0.0015

const ORBIT_REF_RADIUS = RING_STEP * 2

const trackSpeed = (track: number) => (ORBIT_SPEED * ORBIT_REF_RADIUS) / trackRadius(track)

const trackSpin = (track: number) => ((track + 1) % 2 === 1 ? 1 : -1)

const shortestAngle = (angle: number) => angle - Math.PI * 2 * Math.round(angle / (Math.PI * 2))

const wrapAngle = (angle: number) => {
  const wrapped = angle % (Math.PI * 2)
  return wrapped < 0 ? wrapped + Math.PI * 2 : wrapped
}

const SPOKE_ALPHA_CENTER = 0
const SPOKE_ALPHA_OUTER = 0.45

const BREAK_SPEED = 18

const SPRING = 0.035

const DAMPING = 0.82

const GLOW_BOOST = 0.5

const POINTER_EASE = 0.35

const POINTER_GLOW = 0.28

const MAX_DPR = 2

const ALPHA_BUCKETS = 32

const MAX_DRAW_ALPHA = 0.95

const BUCKET_MIN_ALPHA = 0.045

const BUCKET_RATIO = Math.pow(MAX_DRAW_ALPHA / BUCKET_MIN_ALPHA, 1 / (ALPHA_BUCKETS - 1))

const BUCKET_LOG = Math.log(BUCKET_RATIO)

const bucketAlpha = (index: number) => BUCKET_MIN_ALPHA * Math.pow(BUCKET_RATIO, index)

const bucketIndex = (alpha: number) => {
  if (alpha <= BUCKET_MIN_ALPHA) return 0
  if (alpha >= MAX_DRAW_ALPHA) return ALPHA_BUCKETS - 1
  return Math.min(ALPHA_BUCKETS - 1, Math.round(Math.log(alpha / BUCKET_MIN_ALPHA) / BUCKET_LOG))
}

const YELLOW = '#ffd100'
const TEAL = '#00b3a4'

const BUCKET_LUT_SIZE = 256
const BUCKET_LUT = new Uint8Array(BUCKET_LUT_SIZE)
for (let i = 0; i < BUCKET_LUT_SIZE; i++) BUCKET_LUT[i] = bucketIndex(i / BUCKET_LUT_SIZE)

interface Dot {
  hx: number
  hy: number

  x: number
  y: number
  vx: number
  vy: number
  alpha: number
  target: number
  teal: boolean

  bound: boolean

  track: number

  slot: number

  angle: number

  orbit: number
}

export default function DotMatrix({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d', { alpha: true })
    if (!ctx) return

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    let dots: Dot[] = []
    let width = 0
    let height = 0
    let cols = 0
    let rows = 0
    let frame = 0

    let lastTime = 0

    let rebuildPending = false

    let pointerX = 0
    let pointerY = 0
    let px = 0
    let py = 0
    let pointerActive = false
    let pointerDown = false

    const occupied: number[] = []

    const phase: number[] = []

    const ringDots: Dot[] = []

    const buckets = Array.from({ length: ALPHA_BUCKETS }, (_, index) => ({
      alpha: bucketAlpha(index),
      yellow: [] as number[],
      teal: [] as number[],
    }))

    let seed = 0x9e3779b9
    const rand = () => {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0
      return seed / 0x100000000
    }

    let inkRgb = '242 242 242'
    const readInk = () => {
      inkRgb = getComputedStyle(canvas).getPropertyValue('--ak-text').trim() || '242 242 242'
    }
    readInk()

    const rollTarget = () => (rand() > 0.78 ? LIT_ALPHA * (0.72 + rand() * 0.28) : BASE_ALPHA)

    const layout = () => {
      cols = Math.max(1, Math.round(width / CELL)) + 1
      rows = Math.max(1, Math.round(height / CELL)) + 1
    }

    const build = () => {
      rebuildPending = false

      const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR)
      width = canvas.clientWidth
      height = canvas.clientHeight

      const backingWidth = Math.max(1, Math.round(width * dpr))
      const backingHeight = Math.max(1, Math.round(height * dpr))
      if (canvas.width !== backingWidth) canvas.width = backingWidth
      if (canvas.height !== backingHeight) canvas.height = backingHeight
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

      const prevCols = cols
      const prevRows = rows
      const prevDots = dots
      layout()

      seed = 0x9e3779b9
      dots = []

      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const x = col * CELL
          const y = row * CELL

          let carried: Dot | undefined

          if (prevDots.length && col < prevCols && row < prevRows) {
            carried = prevDots[row * prevCols + col]
          }

          if (carried) {
            dots.push({ ...carried, hx: x, hy: y })
            continue
          }

          const target = rollTarget()
          const teal = rand() < TEAL_RATIO
          dots.push({
            hx: x,
            hy: y,
            x,
            y,
            vx: 0,
            vy: 0,

            alpha: target,
            target,
            teal,
            bound: false,
            track: -1,
            slot: -1,

            angle: 0,
            orbit: 0,
          })
        }
      }
    }

    const draw = (atX: number, atY: number, pointerGlow: number) => {
      ctx.clearRect(0, 0, width, height)

      for (const bucket of buckets) {
        bucket.yellow.length = 0
        bucket.teal.length = 0
      }

      const radiusBase = DOT_RADIUS

      let outermost = -1
      for (const dot of ringDots) {
        if (dot.track > outermost) outermost = dot.track
      }

      if (outermost >= 0) {
        const gradient = ctx.createRadialGradient(atX, atY, 0, atX, atY, trackRadius(outermost))
        gradient.addColorStop(0, `rgb(${inkRgb} / ${SPOKE_ALPHA_CENTER})`)
        gradient.addColorStop(1, `rgb(${inkRgb} / ${SPOKE_ALPHA_OUTER})`)

        ctx.save()
        ctx.lineWidth = 1
        ctx.strokeStyle = gradient

        ctx.setLineDash([2, 3])
        ctx.beginPath()
        for (const dot of ringDots) {
          ctx.moveTo(atX, atY)
          ctx.lineTo(dot.x, dot.y)
        }
        ctx.stroke()
        ctx.restore()
      }

      const captureSq = CAPTURE_RADIUS * CAPTURE_RADIUS
      for (const dot of dots) {
        let boost = 0
        if (pointerGlow) {
          if (dot.bound) {
            boost = pointerGlow
          } else {
            const dx = dot.x - atX
            const dy = dot.y - atY
            const distSq = dx * dx + dy * dy
            if (distSq < captureSq) boost = pointerGlow * (1 - Math.sqrt(distSq) / CAPTURE_RADIUS)
          }
        }

        const alpha = Math.min(MAX_DRAW_ALPHA, dot.alpha + boost)
        if (alpha < BUCKET_MIN_ALPHA * 0.5) continue

        const index = BUCKET_LUT[Math.min(BUCKET_LUT_SIZE - 1, (alpha * BUCKET_LUT_SIZE) | 0)]
        const bucket = buckets[index]
        const points = dot.teal ? bucket.teal : bucket.yellow

        points.push(dot.x, dot.y, radiusBase * (1 + POINTER_GLOW * boost))
      }

      for (const bucket of buckets) {
        ctx.globalAlpha = Math.min(1, bucket.alpha)

        for (const [colour, points] of [
          [YELLOW, bucket.yellow],
          [TEAL, bucket.teal],
        ] as const) {
          if (points.length === 0) continue
          ctx.fillStyle = colour
          ctx.beginPath()
          for (let i = 0; i < points.length; i += 3) {
            ctx.moveTo(points[i] + points[i + 2], points[i + 1])
            ctx.arc(points[i], points[i + 1], points[i + 2], 0, Math.PI * 2)
          }
          ctx.fill()
        }
      }

      ctx.globalAlpha = 1
    }

    const step = (time: number) => {
      frame = requestAnimationFrame(step)

      if (rebuildPending) build()

      const dt = lastTime === 0 ? REF_DT : Math.min(Math.max(time - lastTime, 1), MAX_DT)
      lastTime = time
      const frames = dt / REF_DT
      const ease = perFrame(EASE, frames)
      const pointerEase = perFrame(POINTER_EASE, frames)
      const slotEase = perFrame(SLOT_EASE, frames)
      const ringEase = perFrame(RING_EASE, frames)
      const retargetChance = perFrame(RETARGET_CHANCE, frames)
      const damping = Math.pow(DAMPING, frames)
      const spring = SPRING * frames
      const attractForce = ATTRACT_FORCE * frames

      const prevPx = px
      const prevPy = py
      px += (pointerX - px) * pointerEase
      py += (pointerY - py) * pointerEase

      const cursorSpeed = pointerDown ? Math.hypot(px - prevPx, py - prevPy) / frames : 0
      const breakNow = cursorSpeed > BREAK_SPEED

      const pointerGlow = pointerDown ? GLOW_BOOST : 0

      const attractRadius = ATTRACT_RADIUS

      const releaseDistance = (track: number) => trackRadius(track) * 1.8

      if (!pointerDown || breakNow) {
        for (const dot of dots) {
          dot.bound = false
          dot.track = -1
        }

        occupied.length = 0
      } else {
        occupied.length = 0
        for (const dot of dots) if (dot.bound) occupied[dot.track] = (occupied[dot.track] ?? 0) + 1

        for (const dot of dots) {
          const dx = px - dot.x
          const dy = py - dot.y
          const distSq = dx * dx + dy * dy

          if (dot.bound) {
            const release = releaseDistance(dot.track)
            if (distSq > release * release) {
              occupied[dot.track] = (occupied[dot.track] ?? 1) - 1
              dot.bound = false
              dot.track = -1
            }
            continue
          }

          if (distSq > CAPTURE_RADIUS * CAPTURE_RADIUS) continue

          let track = 0
          while ((occupied[track] ?? 0) >= trackCapacity(track)) track++

          occupied[track] = (occupied[track] ?? 0) + 1
          dot.bound = true
          dot.track = track

          dot.angle = Math.atan2(dot.y - py, dot.x - px)
          dot.orbit = Math.sqrt(distSq)
        }
      }

      ringDots.length = 0
      for (const dot of dots) if (dot.bound) ringDots.push(dot)
      ringDots.sort((a, b) => {
        if (a.track !== b.track) return a.track - b.track

        const half = Math.PI / (occupied[a.track] ?? 1)
        const ra = wrapAngle(a.angle - (phase[a.track] ?? 0) + half)
        const rb = wrapAngle(b.angle - (phase[a.track] ?? 0) + half)
        return ra - rb
      })
      for (let i = 0; i < ringDots.length;) {
        const track = ringDots[i].track
        let end = i
        while (end < ringDots.length && ringDots[end].track === track) end++
        for (let k = i; k < end; k++) ringDots[k].slot = k - i
        i = end
      }

      for (let i = 0; i < dots.length; i++) {
        const dot = dots[i]

        if (rand() < retargetChance) {
          dot.target = rollTarget()
        }
        dot.alpha += (dot.target - dot.alpha) * ease

        if (pointerDown && !breakNow && !dot.bound) {
          const dx = px - dot.x
          const dy = py - dot.y
          const distSq = dx * dx + dy * dy
          if (distSq < attractRadius * attractRadius && distSq > 0.5) {
            const dist = Math.sqrt(distSq)
            const falloff = 1 - dist / attractRadius
            const magnitude = attractForce * falloff * falloff
            dot.vx += (dx / dist) * magnitude
            dot.vy += (dy / dist) * magnitude
          }
        }

        if (dot.bound && (occupied[dot.track] ?? 0) > 0) {
          const count = occupied[dot.track] ?? 1
          const target = (phase[dot.track] ?? 0) + (dot.slot / count) * Math.PI * 2

          const angularError = shortestAngle(target - dot.angle)

          dot.angle = wrapAngle(dot.angle + angularError * slotEase)
          dot.orbit += (trackRadius(dot.track) - dot.orbit) * ringEase

          const nextX = px + Math.cos(dot.angle) * dot.orbit
          const nextY = py + Math.sin(dot.angle) * dot.orbit

          dot.vx = (nextX - dot.x) / frames
          dot.vy = (nextY - dot.y) / frames
          dot.x = nextX
          dot.y = nextY

          continue
        } else {
          dot.vx += (dot.hx - dot.x) * spring
          dot.vy += (dot.hy - dot.y) * spring
          dot.vx *= damping
          dot.vy *= damping
        }

        dot.x += dot.vx * frames
        dot.y += dot.vy * frames
      }

      for (let track = 0; track < occupied.length; track++) {
        if (occupied[track]) {
          phase[track] = wrapAngle(
            (phase[track] ?? 0) + trackSpin(track) * trackSpeed(track) * frames,
          )
        }
      }

      draw(px, py, pointerGlow)
    }

    const onPointerMove = (event: PointerEvent) => {
      if (!pointerActive) {
        px = event.clientX
        py = event.clientY
      }
      pointerX = event.clientX
      pointerY = event.clientY
      pointerActive = true
    }
    const onPointerDown = (event: PointerEvent) => {
      pointerX = event.clientX
      pointerY = event.clientY
      pointerActive = true

      px = event.clientX
      py = event.clientY
      pointerDown = true
    }
    const onPointerUp = () => {
      pointerDown = false
    }

    const onPointerCancel = () => {
      pointerDown = false
      pointerActive = false
    }
    const onPointerLeave = () => {
      pointerActive = false
      pointerDown = false
    }

    build()

    if (reduced) {
      draw(0, 0, 0)

      const staticObserver = new ResizeObserver(() => {
        build()
        draw(0, 0, 0)
      })
      staticObserver.observe(canvas)

      return () => staticObserver.disconnect()
    }

    const observer = new ResizeObserver(() => {
      rebuildPending = true
    })
    observer.observe(canvas)

    frame = requestAnimationFrame(step)

    window.addEventListener('pointermove', onPointerMove, { passive: true })
    window.addEventListener('pointerdown', onPointerDown, { passive: true })
    window.addEventListener('pointerup', onPointerUp, { passive: true })
    window.addEventListener('pointercancel', onPointerCancel, { passive: true })
    document.addEventListener('pointerleave', onPointerLeave)
    window.addEventListener('blur', onPointerLeave)

    const themeObserver = new MutationObserver(readInk)
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    })

    return () => {
      if (frame) cancelAnimationFrame(frame)
      observer.disconnect()
      themeObserver.disconnect()
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerdown', onPointerDown)
      window.removeEventListener('pointerup', onPointerUp)
      window.removeEventListener('pointercancel', onPointerCancel)
      document.removeEventListener('pointerleave', onPointerLeave)
      window.removeEventListener('blur', onPointerLeave)
    }
  }, [])

  return <canvas ref={canvasRef} className={className} aria-hidden />
}
