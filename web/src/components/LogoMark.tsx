import { MARK_INSET_VIEW_BOX, MARK_PATH } from '@/data/brand'

export default function LogoMark({ size = 36, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox={MARK_INSET_VIEW_BOX}
      className={className}
      aria-hidden
      focusable="false"
    >
      <path d={MARK_PATH} fill="currentColor" />
    </svg>
  )
}
