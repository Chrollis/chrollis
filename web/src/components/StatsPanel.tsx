import { motion } from 'framer-motion'

import { site } from '@/data/site'
import { languageColours, stats } from '@/lib/github'
import { useLocale } from '@/lib/locale'
import { fadeUp } from '@/lib/motion'

export default function StatsPanel() {
  const { t } = useLocale()
  const topLanguages = stats.languages.slice(0, 8)

  if (stats.overview.length === 0 && topLanguages.length === 0) {
    return (
      <motion.div variants={fadeUp}>
        <div className="ak-panel flex items-center justify-between px-4 py-3">
          <span className="ak-label">{t.about.statsUnavailable}</span>
          <a
            href={`https://github.com/${site.statsRepo}`}
            target="_blank"
            rel="noreferrer noopener"
            className="ak-index transition-colors hover:text-ak-accent"
          >
            {site.statsRepo}
          </a>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div variants={fadeUp} className="space-y-5">
      {stats.overview.length > 0 && (
        <div className="ak-panel overflow-clip">
          <div className="flex items-center justify-between border-b border-ak-border px-4 py-3">
            <span className="ak-label">{t.about.stats}</span>
            <a
              href={`https://github.com/${site.statsRepo}`}
              target="_blank"
              rel="noreferrer noopener"
              className="ak-index transition-colors hover:text-ak-accent"
            >
              {site.statsRepo}
            </a>
          </div>

          <div className="grid grid-cols-2 gap-px bg-ak-border sm:grid-cols-3">
            {stats.overview.map((stat) => (
              <div key={stat.label} className="bg-ak-surface px-4 py-3.5">
                <p className="ak-label line-clamp-2 h-[3.25em] text-[0.5625rem] leading-relaxed">
                  {stat.label}
                </p>
                <p className="mt-1.5 font-mono text-xl font-bold leading-none text-ak-text">
                  {stat.value}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {topLanguages.length > 0 && (
        <div className="ak-panel overflow-clip">
          <div className="flex items-center justify-between border-b border-ak-border px-4 py-3">
            <span className="ak-label">{t.projects.languages}</span>
            <span className="ak-index">{t.about.statsByVolume}</span>
          </div>

          <div className="p-4">
            <div className="flex h-2 w-full overflow-clip bg-ak-border">
              {topLanguages.map((language) => (
                <span
                  key={language.name}
                  style={{
                    width: `${language.percent}%`,
                    backgroundColor: languageColours[language.name] ?? 'rgb(var(--ak-accent))',
                  }}
                  title={`${language.name} ${language.percent}%`}
                />
              ))}
            </div>

            <ul className="mt-4 grid gap-x-6 gap-y-2 sm:grid-cols-2">
              {topLanguages.map((language) => (
                <li key={language.name} className="flex items-center gap-2">
                  <span
                    aria-hidden
                    className="h-2 w-2 shrink-0"
                    style={{
                      backgroundColor: languageColours[language.name] ?? 'rgb(var(--ak-accent))',
                    }}
                  />
                  <span className="flex-1 truncate text-xs text-ak-text">{language.name}</span>
                  <span className="font-mono text-2xs text-ak-muted">
                    {language.percent.toFixed(1)}%
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </motion.div>
  )
}
