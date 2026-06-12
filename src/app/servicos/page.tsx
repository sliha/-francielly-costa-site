import type { Metadata } from 'next'
import ServicosPage from '@/components/servicos/ServicosPage'
import JsonLd, { breadcrumbSchema, SITE_URL } from '@/components/JsonLd'
import { services } from '@/data/services'

const url = `${SITE_URL}/servicos`

export async function generateMetadata(): Promise<Metadata> {
  const list = services.map((s) => s.name).join(', ')
  return {
    title: 'Serviços de Dermopigmentação em Braga',
    description: `Conheça todos os serviços de Dermopigmentação Avançada em Braga: ${list}. Especialista certificada com +8 anos de experiência.`,
    alternates: { canonical: url },
    openGraph: {
      title: 'Serviços de Dermopigmentação em Braga',
      description: `Microblading, micropigmentação labial, eyeliner, tricopigmentação e FiberBROWS em Braga.`,
      url,
      siteName: 'Francielly Costa',
      locale: 'pt_PT',
      type: 'website',
      images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'Serviços Francielly Costa' }],
    },
    twitter: {
      card: 'summary_large_image',
      title: 'Serviços de Dermopigmentação — Francielly Costa',
      description: 'Microblading, micropigmentação labial, eyeliner, tricopigmentação e FiberBROWS em Braga.',
      images: ['/og-image.png'],
    },
  }
}

export default function Servicos() {
  return (
    <>
      <JsonLd
        id="ld-breadcrumb-servicos"
        data={breadcrumbSchema([
          { name: 'Início', url: SITE_URL },
          { name: 'Serviços', url },
        ])}
      />
      <ServicosPage />
    </>
  )
}
