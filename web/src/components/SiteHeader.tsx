import { useEffect, useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Menu, Search as SearchIcon, X } from 'lucide-react'

import LocaleToggle from '@/components/LocaleToggle'
import LogoMark from '@/components/LogoMark'
import SearchDialog from '@/components/SearchDialog'
import SocialLinks from '@/components/SocialLinks'
import ThemeToggle from '@/components/ThemeToggle'
import { site } from '@/data/site'
import { useLocale } from '@/lib/locale'
import { EASE_AK } from '@/lib/motion'
import { useScrollLock } from '@/lib/scrollLock'
import { cn } from '@/lib/utils'

const DESKTOP_NAV_QUERY = '(min-width: 900px)'

export default function SiteHeader() {
  const { t } = useLocale()
  const [menuOpen, setMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setSearchOpen((open) => !open)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  useScrollLock(menuOpen)

  useEffect(() => {
    const desktop = window.matchMedia(DESKTOP_NAV_QUERY)

    const onChange = (event: MediaQueryListEvent) => {
      if (event.matches) setMenuOpen(false)
    }
    desktop.addEventListener('change', onChange)
    return () => desktop.removeEventListener('change', onChange)
  }, [])

  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-overlay focus:border focus:border-ak-accent focus:bg-ak-bg focus:px-3 focus:py-2 focus:font-mono focus:text-xs"
      >
        {t.common.skipToContent}
      </a>

      <header
        className={cn(
          'sticky top-0 z-nav border-b transition-colors duration-ak',
          scrolled ? 'border-ak-border bg-ak-bg/88 backdrop-blur-md' : 'border-transparent',
        )}
      >
        <div className="ak-container grid h-16 grid-cols-2 items-center gap-4 min-[900px]:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]">
          <Link
            to="/"
            className="group flex h-10 w-10 shrink-0 items-center justify-center justify-self-start border border-ak-border text-ak-text transition-colors duration-ak hover:border-ak-accent hover:text-ak-accent"
            aria-label={`${site.name} - ${t.pages.home}`}
          >
            <LogoMark size={36} className="shrink-0" />
          </Link>
          <nav className="hidden items-center min-[900px]:flex" aria-label={t.nav.primary}>
            {site.nav.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  cn(
                    'group relative flex items-center gap-2 px-3 py-2 transition-colors duration-ak',
                    isActive ? 'text-ak-accent' : 'text-ak-muted hover:text-ak-text',
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <span
                      className={cn(
                        'font-mono text-[0.5625rem] tracking-ak transition-opacity duration-ak',
                        isActive ? 'opacity-100' : 'opacity-45',
                      )}
                    >
                      {item.index}
                    </span>
                    <span className="whitespace-nowrap text-xs font-semibold uppercase tracking-ak">
                      {t.pages[item.key]}
                    </span>

                    <span
                      className={cn(
                        'absolute inset-x-3 bottom-1 h-px bg-ak-accent transition-all duration-ak',
                        isActive ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100',
                      )}
                      style={{ transformOrigin: 'left' }}
                    />
                  </>
                )}
              </NavLink>
            ))}
          </nav>
          <div className="flex min-w-0 shrink items-center justify-self-end gap-2">
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className="flex h-10 w-10 shrink-0 items-center justify-center border border-ak-border text-ak-muted transition-colors duration-ak hover:border-ak-accent hover:text-ak-accent max-[183px]:hidden"
              aria-label={t.nav.search}
            >
              <SearchIcon size={15} strokeWidth={1.75} className="shrink-0" />
            </button>

            <ThemeToggle className="max-[279px]:hidden" />

            <LocaleToggle className="max-[231px]:hidden" />

            <button
              type="button"
              onClick={() => setMenuOpen((open) => !open)}
              className="flex h-10 w-10 shrink-0 items-center justify-center border border-ak-border text-ak-muted transition-colors duration-ak hover:border-ak-accent hover:text-ak-accent min-[900px]:hidden"
              aria-label={menuOpen ? t.nav.closeMenu : t.nav.openMenu}
              aria-expanded={menuOpen}
            >
              {menuOpen ? (
                <X size={16} className="shrink-0" />
              ) : (
                <Menu size={16} className="shrink-0" />
              )}
            </button>
          </div>
        </div>

        <div
          className={cn(
            'absolute bottom-0 left-0 h-px bg-ak-accent/70 transition-all duration-ak',
            scrolled ? 'w-full' : 'w-0',
          )}
        />
      </header>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            className="fixed inset-0 z-overlay min-[900px]:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.16 }}
          >
            <button
              type="button"
              className="absolute inset-0 bg-ak-bg/80 backdrop-blur-sm"
              onClick={() => setMenuOpen(false)}
              aria-label={t.nav.closeMenu}
            />

            <motion.nav
              className="absolute right-0 top-0 flex h-full w-[86%] max-w-sm flex-col border-l border-ak-border bg-ak-surface"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'tween', ease: EASE_AK, duration: 0.22 }}
              aria-label={t.nav.drawer}
            >
              <div className="flex h-16 shrink-0 items-center justify-between border-b border-ak-border px-5">
                <span className="ak-label">{t.nav.label}</span>
                <button
                  type="button"
                  onClick={() => setMenuOpen(false)}
                  className="text-ak-muted hover:text-ak-accent"
                  aria-label={t.nav.closeMenu}
                >
                  <X size={16} />
                </button>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
                <ul className="divide-y divide-ak-border">
                  {site.nav.map((item) => (
                    <li key={item.to}>
                      <NavLink
                        to={item.to}
                        end={item.to === '/'}
                        onClick={() => setMenuOpen(false)}
                        className={({ isActive }) =>
                          cn(
                            'relative flex items-center justify-between px-5 py-4 transition-colors duration-ak',
                            isActive ? 'bg-ak-bg text-ak-accent' : 'text-ak-text hover:bg-ak-bg',
                          )
                        }
                      >
                        {({ isActive }) => (
                          <>
                            <span className="flex items-baseline gap-3">
                              <span className="ak-index">{item.index}</span>
                              <span className="text-lg">{t.pages[item.key]}</span>
                            </span>
                            {isActive && <span className="h-1.5 w-1.5 bg-ak-accent" />}
                          </>
                        )}
                      </NavLink>
                    </li>
                  ))}
                </ul>
                label and first chip sat 0px apart at 320px, and with a gap the list still could not
                fit beside it below 375px. The drawer is at most 384px wide, so
                <div className="border-t border-ak-border px-5 py-5">
                  <span className="ak-label">{t.nav.links}</span>
                  <SocialLinks variant="full" className="mt-3" />
                </div>
              </div>
            </motion.nav>
          </motion.div>
        )}
      </AnimatePresence>

      <SearchDialog open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  )
}
