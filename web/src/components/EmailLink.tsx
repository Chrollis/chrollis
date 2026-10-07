import { fullEmail } from '@/data/site'

export default function EmailLink({
  className,
  children,
}: {
  className?: string

  children?: React.ReactNode
}) {
  const address = fullEmail()

  return (
    <a href={`mailto:${address}`} title={address} className={className}>
      {children ?? address}
    </a>
  )
}
