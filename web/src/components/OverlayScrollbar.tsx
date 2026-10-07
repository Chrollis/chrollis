import { useCallback, useEffect, useRef, useState } from 'react'

const MIN_THUMB = 28

const IDLE_MS = 1200
const RAIL_INSET = 6

export default function OverlayScrollbar() {
  const railRef = useRef<HTMLDivElement>(null)
  const thumbRef = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)
  const [active, setActive] = useState(false)

  const metrics = useRef({ thumbSize: 0, travel: 0, maxScroll: 0 })
  const dragging = useRef(false)

  const position = useCallback(() => {
    const thumb = thumbRef.current
    if (!thumb) return
    const { travel, maxScroll, thumbSize } = metrics.current
    if (maxScroll <= 0) return

    const progress = Math.min(1, Math.max(0, window.scrollY / maxScroll))
    thumb.style.transform = `translate3d(0, ${progress * travel}px, 0)`
    thumb.style.height = `${thumbSize}px`
  }, [])

  const measure = useCallback(() => {
    const track = window.innerHeight - RAIL_INSET
    const viewport = window.innerHeight
    const total = document.documentElement.scrollHeight

    if (total <= viewport) {
      setVisible(false)
      return
    }

    const ratio = viewport / total
    const thumbSize = Math.max(MIN_THUMB, Math.round(track * ratio))
    const travel = track - thumbSize
    const maxScroll = total - viewport

    metrics.current = { thumbSize, travel, maxScroll }
    setVisible(true)

    position()
  }, [position])

  useEffect(() => {
    if (visible) position()
  }, [visible, position])

  useEffect(() => {
    if (window.matchMedia('(hover: none)').matches) return

    let idleTimer = 0

    const onScroll = () => {
      position()
      setActive(true)
      window.clearTimeout(idleTimer)
      idleTimer = window.setTimeout(() => setActive(false), IDLE_MS)
    }

    const onResize = () => measure()

    const onVisibility = () => {
      if (!document.hidden) measure()
    }

    const observer = new ResizeObserver(() => measure())
    observer.observe(document.documentElement)
    if (document.body) observer.observe(document.body)

    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onResize)
    document.addEventListener('visibilitychange', onVisibility)

    const initial = window.setTimeout(() => measure(), 0)

    return () => {
      window.clearTimeout(idleTimer)
      window.clearTimeout(initial)
      observer.disconnect()
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onResize)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [measure, position])

  useEffect(() => {
    const thumb = thumbRef.current
    if (!thumb) return

    const onPointerDown = (event: PointerEvent) => {
      event.preventDefault()
      dragging.current = true
      thumb.setPointerCapture(event.pointerId)
      setActive(true)

      const startY = event.clientY
      const startScroll = window.scrollY

      const onMove = (moveEvent: PointerEvent) => {
        const { travel, maxScroll } = metrics.current
        if (travel <= 0) return
        const delta = moveEvent.clientY - startY

        window.scrollTo({ top: startScroll + (delta / travel) * maxScroll })
      }

      const onUp = () => {
        dragging.current = false
        thumb.removeEventListener('pointermove', onMove)
        thumb.removeEventListener('pointerup', onUp)
        thumb.removeEventListener('pointercancel', onUp)
      }

      thumb.addEventListener('pointermove', onMove)
      thumb.addEventListener('pointerup', onUp)
      thumb.addEventListener('pointercancel', onUp)
    }

    thumb.addEventListener('pointerdown', onPointerDown)
    return () => thumb.removeEventListener('pointerdown', onPointerDown)
  }, [])

  const onRailClick = (event: React.MouseEvent<HTMLDivElement>) => {
    const rail = railRef.current
    if (!rail) return
    const rect = rail.getBoundingClientRect()
    const progress = (event.clientY - rect.top) / rect.height
    window.scrollTo({
      top: progress * (document.documentElement.scrollHeight - window.innerHeight),
    })
  }

  if (!visible) return null

  return (
    <div
      ref={railRef}
      onClick={onRailClick}
      aria-hidden
      className={`fixed right-0 top-0 z-[90] h-screen w-3 transition-opacity duration-300 ${
        active ? 'opacity-100' : 'opacity-35'
      }`}
      style={{ paddingTop: RAIL_INSET }}
    >
      <div
        ref={thumbRef}
        className="ml-auto h-24 w-[3px] bg-ak-accent/70 transition-colors duration-ak hover:bg-ak-accent"
        style={{ marginRight: 3 }}
      />
    </div>
  )
}
