import ContactSection from '@/sections/ContactSection'
import { PageHeader, PageShell } from '@/components/Primitives'
import { useLocale } from '@/lib/locale'
import { useSeo } from '@/lib/seo'

export default function ContactPage() {
  const { t } = useLocale()
  useSeo({
    title: t.pages.contact,
    path: '/contact',
    description: t.meta.contact,
  })

  return (
    <PageShell>
      <PageHeader index="04" title={t.pages.contact} subtitle={t.contact.subtitle} />
      <ContactSection />
    </PageShell>
  )
}
