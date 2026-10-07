import {
  AfdianIcon,
  BilibiliIcon,
  ExternalIcon,
  GithubIcon,
  MailIcon,
  RssIcon,
} from '@/components/BrandIcons'
import type { BrandIconComponent } from '@/components/BrandIcons'
import EmailLink from '@/components/EmailLink'
import { isBlank, site } from '@/data/site'
import type { SocialIcon } from '@/data/site'
import { useLocale } from '@/lib/locale'
import { cn } from '@/lib/utils'

const iconMap: Record<SocialIcon, BrandIconComponent> = {
  github: GithubIcon,
  mail: MailIcon,
  rss: RssIcon,
  bilibili: BilibiliIcon,
  afdian: AfdianIcon,
  external: ExternalIcon,
  twitter: ExternalIcon,
  zhihu: ExternalIcon,
  steam: ExternalIcon,
  youtube: ExternalIcon,
}

interface Props {
  className?: string

  variant?: 'compact' | 'full'
  orientation?: 'row' | 'column'
}

export default function SocialLinks({
  className,
  variant = 'compact',
  orientation = 'row',
}: Props) {
  const { t } = useLocale()

  const links = site.socials.filter((link) => link.key === 'email' || !isBlank(link.href))

  return (
    <ul
      className={cn(
        'flex',

        orientation === 'row' ? 'flex-row flex-wrap items-center gap-1' : 'flex-col gap-2',
        className,
      )}
    >
      {links.map((link) => {
        const Icon = iconMap[link.icon]
        const isExternal = !link.href.startsWith('/')
        const chip = cn(
          'group flex items-center gap-2 border border-transparent px-2 py-1.5',
          'text-ak-muted transition-colors duration-ak',
          'hover:border-ak-border hover:text-ak-accent',
          variant === 'full' && 'px-3',
        )
        const label = (
          <>
            <Icon size={15} />
            {variant === 'full' && (
              <span className="font-mono text-2xs tracking-ak">
                {t.socials[link.key].toUpperCase()}
              </span>
            )}
          </>
        )

        return (
          <li key={link.key}>
            {link.key === 'email' ? (
              <EmailLink className={chip}>{label}</EmailLink>
            ) : (
              <a
                href={link.href}
                {...(isExternal ? { target: '_blank', rel: 'noreferrer noopener' } : {})}
                className={chip}
                aria-label={t.socials[link.key]}
              >
                {label}
              </a>
            )}
          </li>
        )
      })}
    </ul>
  )
}
