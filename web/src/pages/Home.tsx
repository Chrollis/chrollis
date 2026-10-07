import CoverSection from '@/sections/CoverSection'
import { useSeo } from '@/lib/seo'

export default function Home() {
  useSeo({ path: '/' })

  return <CoverSection />
}
