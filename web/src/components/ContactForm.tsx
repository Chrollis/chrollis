import { useId, useState } from 'react'
import { motion } from 'framer-motion'
import { Check, Loader2, Send, TriangleAlert } from 'lucide-react'

import AuthSlider from '@/components/AuthSlider'
import { isBlank, site, fullEmail } from '@/data/site'
import { useLocale } from '@/lib/locale'
import { fadeUp } from '@/lib/motion'
import { isContactField, validateContact, validateField } from '@/lib/validate'
import type { ContactError, ContactErrors } from '@/lib/validate'

type Status = 'idle' | 'sending' | 'ok' | 'error'

export default function ContactForm() {
  const { t } = useLocale()
  const [status, setStatus] = useState<Status>('idle')
  const [message, setMessage] = useState('')
  const [errors, setErrors] = useState<ContactErrors>({})
  const [authorized, setAuthorized] = useState(false)
  const [nudge, setNudge] = useState(0)
  const [sends, setSends] = useState(0)

  const { provider, web3formsKey } = site.contactForm

  if (provider === 'none') return null
  if (provider === 'web3forms' && isBlank(web3formsKey)) return null

  const endpoint =
    provider === 'web3forms'
      ? 'https://api.web3forms.com/submit'
      : `https://formsubmit.co/ajax/${fullEmail()}`

  const errorText: Record<ContactError, string> = {
    required: t.contact.required,
    emailMissingAt: t.contact.emailMissingAt,
    emailIncompleteDomain: t.contact.emailIncompleteDomain,
    emailUnusable: t.contact.emailUnusable,
  }

  const check = (name: string, value: string, phase: 'blur' | 'input') => {
    if (!isContactField(name)) return
    setErrors((current) => {
      if (phase === 'input' && current[name] === undefined) return current
      const error = validateField(name, value)
      if (error === current[name]) return current
      const next = { ...current }
      if (error) next[name] = error
      else delete next[name]
      return next
    })
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget

    tidy(form)

    const data = new FormData(form)
    const found = validateContact({
      name: String(data.get('name') ?? ''),
      email: String(data.get('email') ?? ''),
      message: String(data.get('message') ?? ''),
    })

    if (Object.keys(found).length > 0) {
      setErrors(found)
      setStatus('error')
      for (const field of ['name', 'email', 'message'] as const) {
        if (!found[field]) continue
        const control = form.elements.namedItem(field)
        if (control instanceof HTMLElement) control.focus()
        break
      }
      return
    }

    if (!authorized) {
      setNudge((count) => count + 1)
      return
    }

    setErrors({})
    setStatus('sending')
    setMessage('')

    if (provider === 'web3forms') data.append('access_key', web3formsKey)
    data.append('subject', `Message from ${site.url}`)
    data.append('from_name', site.name)

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { Accept: 'application/json' },
        body: data,
      })
      const result = (await response.json().catch(() => ({}))) as {
        success?: boolean
        message?: string
      }

      if (!response.ok || result.success === false) {
        throw new Error(result.message ?? `HTTP ${response.status}`)
      }

      setStatus('ok')
      setMessage(t.contact.sent)
      form.reset()
      setAuthorized(false)
      setNudge(0)
      setSends((count) => count + 1)
    } catch (error) {
      setStatus('error')
      console.error('[contact] submit failed:', error)
      setMessage(`${t.contact.sendFailed}. ${t.contact.sendFailedHint}`)
    }
  }

  const label =
    provider === 'web3forms' ? t.contact.formProviderWeb3 : t.contact.formProviderFormSubmit

  const pending = Object.keys(errors).length
  const needsAuth = nudge > 0 && !authorized

  return (
    <motion.form
      variants={fadeUp}
      onSubmit={handleSubmit}
      noValidate
      className="ak-panel p-5 md:p-6"
    >
      <div className="flex items-center justify-between border-b border-ak-border pb-3">
        <span className="ak-label">{t.contact.message}</span>
        <span className="ak-index">{label}</span>
      </div>

      <div className="mt-5 space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label={t.contact.name}
            name="name"
            placeholder={t.contact.namePlaceholder}
            autoComplete="name"
            maxLength={80}
            required
            error={errors.name && errorText[errors.name]}
            onCheck={check}
          />
          <Field
            label={t.contact.email}
            name="email"
            type="email"
            placeholder={t.contact.emailPlaceholder}
            autoComplete="email"
            maxLength={254}
            required
            error={errors.email && errorText[errors.email]}
            onCheck={check}
          />
        </div>
        <Field
          label={t.contact.subject}
          name="subject_custom"
          placeholder={t.contact.subjectPlaceholder}
          maxLength={120}
          note={t.contact.optional}
          onCheck={check}
        />

        <Field
          label={t.contact.message}
          name="message"
          placeholder={t.contact.messagePlaceholder}
          multiline
          maxLength={5000}
          required
          error={errors.message && errorText[errors.message]}
          onCheck={check}
        />
        <input
          type="text"
          name="_honey"
          className="sr-only"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
        />
      </div>

      <AuthSlider
        key={sends}
        authorized={authorized}
        onAuthorize={() => setAuthorized(true)}
        nudge={nudge}
      />

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-ak-border pt-4">
        <button
          type="submit"
          disabled={status === 'sending'}
          className="ak-btn ak-btn--solid ak-notch-sm disabled:cursor-not-allowed disabled:opacity-60"
        >
          {status === 'sending' ? (
            <>
              <Loader2 size={14} className="animate-spin" />
              {t.contact.sending}
            </>
          ) : (
            <>
              <Send size={14} />
              {t.contact.send}
            </>
          )}
        </button>

        <p
          role="status"
          aria-live="polite"
          className={`flex items-center gap-1.5 font-mono text-2xs tracking-ak ${
            pending > 0 || needsAuth || status === 'error'
              ? 'text-ak-danger'
              : status === 'ok'
                ? 'text-ak-accent-2'
                : 'text-ak-muted'
          }`}
        >
          {status === 'ok' && <Check size={12} aria-hidden />}
          {(pending > 0 || needsAuth || status === 'error') && (
            <TriangleAlert size={12} aria-hidden />
          )}
          {pending > 0
            ? t.contact.formIncomplete
            : needsAuth
              ? t.contact.authRequired
              : message || t.contact.privacy}
        </p>
      </div>
    </motion.form>
  )
}

function tidy(form: HTMLFormElement) {
  for (const element of Array.from(form.elements)) {
    if (!(element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement)) continue
    const trimmed = element.value.trim()
    if (element.value !== trimmed) element.value = trimmed
  }
}

type FieldProps = {
  label: string
  name: string
  type?: string
  placeholder?: string
  autoComplete?: string
  maxLength?: number
  required?: boolean
  multiline?: boolean
  note?: string
  error?: string
  onCheck: (name: string, value: string, phase: 'blur' | 'input') => void
}

function Field({
  label,
  name,
  type = 'text',
  placeholder,
  autoComplete,
  maxLength,
  required,
  multiline,
  note,
  error,
  onCheck,
}: FieldProps) {
  const errorId = useId()
  const shared = {
    name,
    required,
    placeholder,
    maxLength,
    'aria-invalid': error ? true : undefined,
    'aria-describedby': error ? errorId : undefined,
    onBlur: (event: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      onCheck(name, event.currentTarget.value, 'blur'),
    onInput: (event: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      onCheck(name, event.currentTarget.value, 'input'),
  }

  return (
    <label className="block">
      <span className="flex items-baseline justify-between gap-3">
        <span className="ak-label">{label}</span>
        {note && <span className="ak-label text-ak-muted/60">{note}</span>}
      </span>

      {multiline ? (
        <textarea {...shared} rows={6} className="ak-field mt-2 resize-y" />
      ) : (
        <input {...shared} type={type} autoComplete={autoComplete} className="ak-field mt-2" />
      )}

      {error && (
        <p id={errorId} className="ak-label mt-1.5 text-ak-danger">
          {error}
        </p>
      )}
    </label>
  )
}
