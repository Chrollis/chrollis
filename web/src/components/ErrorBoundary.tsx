import { Component } from 'react'
import type { ErrorInfo, ReactNode } from 'react'

import { useLocale } from '@/lib/locale'

interface Props {
  children: ReactNode

  fallback?: ReactNode

  label?: string
}

interface State {
  failed: boolean
}

export default class ErrorBoundary extends Component<Props, State> {
  override state: State = { failed: false }

  static getDerivedStateFromError(): State {
    return { failed: true }
  }

  override componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(
      `[${this.props.label ?? 'boundary'}] caught an error:`,
      error,
      info.componentStack,
    )
  }

  override render() {
    if (this.state.failed) return this.props.fallback ?? null
    return this.props.children
  }
}

export function CrashFallback() {
  const { t } = useLocale()
  return (
    <div className="ak-container flex min-h-screen flex-col justify-center py-20">
      <div className="flex items-center gap-3">
        <span className="h-1.5 w-1.5 bg-ak-danger" />
        <span className="ak-label">{t.crash.label}</span>
      </div>
      <h1 className="mt-6 font-mono text-3xl font-bold text-ak-text">{t.crash.title}</h1>
      <p className="mt-4 max-w-lg text-sm leading-relaxed text-ak-muted">{t.crash.body}</p>
      <div className="mt-8 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="ak-btn ak-btn--solid ak-notch-sm"
        >
          {t.crash.reload}
        </button>
        <a
          href="https://github.com/Chrollis"
          target="_blank"
          rel="noreferrer noopener"
          className="ak-btn ak-notch-sm"
        >
          {t.socials.github}
        </a>
      </div>
    </div>
  )
}
