import DotMatrix from '@/components/DotMatrix'

export default function SiteBackground() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      <div className="absolute inset-0 bg-ak-bg" />
      <DotMatrix className="absolute inset-0 h-full w-full" />

      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,rgb(var(--ak-bg)/0.9)_100%)]" />
    </div>
  )
}
