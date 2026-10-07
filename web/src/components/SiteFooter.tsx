import { Link } from 'react-router-dom'

import LogoMark from '@/components/LogoMark'
import Scramble from '@/components/Scramble'
import SocialLinks from '@/components/SocialLinks'
import { site } from '@/data/site'
import { assetUrl } from '@/lib/assets'
import { useLocale } from '@/lib/locale'
import { COPYRIGHT } from '@/lib/glyphs'

export default function SiteFooter() {
  const { t } = useLocale()
  const year = new Date().getFullYear()
  const range = site.since === year ? `${year}` : `${site.since}-${year}`

  return (
    <footer className="relative z-10 mt-auto border-t border-ak-border bg-ak-bg/80 backdrop-blur-sm">
      <div className="ak-container py-10">
        <div className="grid grid-cols-[minmax(0,1fr)] gap-8 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] sm:gap-10 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)_minmax(0,1fr)] lg:gap-12">
          <div className="sm:col-span-2 lg:col-span-1">
            <div className="flex items-center gap-3">
              <LogoMark size={36} className="shrink-0 text-ak-text" />
              <div>
                <p className="text-sm font-bold tracking-ak text-ak-text">{site.nameUpper}</p>
                <p className="mt-1 font-mono text-[0.625rem] tracking-ak text-ak-muted">
                  {t.content.role.toUpperCase()}
                </p>
              </div>
            </div>

            <p className="ak-cjk mt-4 max-w-sm text-sm leading-relaxed text-ak-muted">
              <Scramble text={t.content.description} />
            </p>

            <div className="mt-5">
              <SocialLinks variant="full" />
            </div>
          </div>

          <nav aria-label={t.nav.footer}>
            <h2 className="ak-footer-heading">{t.nav.sitemap}</h2>
            <ul className="mt-4 space-y-2.5">
              {site.nav.map((item) => (
                <li key={item.to} className="flex min-w-0 items-baseline gap-2">
                  <Link
                    to={item.to}
                    className="ak-link shrink-0 font-mono text-xs tracking-ak text-ak-muted hover:text-ak-text"
                  >
                    {t.pages[item.key].toUpperCase()}
                  </Link>
                  <span className="ak-leader" aria-hidden />
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <h2 className="ak-footer-heading">{t.footer.meta}</h2>
            <ul className="mt-4 space-y-2.5">
              {(
                [
                  { key: 'rss', file: 'feeds/rss.xml' },
                  { key: 'sitemap', file: 'feeds/sitemap.xml' },
                  { key: 'robots', file: 'robots.txt' },
                ] as const
              ).map((entry) => (
                <li key={entry.key} className="flex min-w-0 items-baseline gap-2">
                  <a
                    href={assetUrl(entry.file)}
                    className="ak-link shrink-0 font-mono text-xs tracking-ak text-ak-muted hover:text-ak-text"
                  >
                    {t.files[entry.key]}
                  </a>
                  <span className="ak-leader" aria-hidden />
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="mt-10 flex flex-col gap-3 border-t border-ak-border pt-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-mono text-2xs tracking-ak text-ak-muted">
            {COPYRIGHT} {range} {site.nameUpper}
          </p>
          <p className="font-mono text-2xs tracking-ak text-ak-muted/70">{t.footer.builtWith}</p>
        </div>
      </div>
    </footer>
  )
}
