import { useLocale } from '@/lib/locale'

export default function LocaleToggle({ className }: { className?: string }) {
  const { t, toggle } = useLocale()

  return (
    <button
      type="button"
      onClick={toggle}
      className={`group relative flex h-10 w-10 items-center justify-center border border-ak-border text-ak-muted transition-colors duration-ak hover:border-ak-accent hover:text-ak-accent ${className ?? ''}`}
      aria-label={t.locale.switchTo}
      title={t.locale.switchTo}
      lang={t.locale.short === '中' ? 'zh-Hans' : 'en'}
    >
      <span className="text-[0.8125rem] font-semibold leading-none">{t.locale.short}</span>
      <span className="absolute -bottom-px left-0 h-px w-0 bg-ak-accent transition-all duration-ak group-hover:w-full" />
    </button>
  )
}
