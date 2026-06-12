import type { Metadata } from 'next'
import GaleriaPage from '@/components/galeria/GaleriaPage'
import JsonLd, { breadcrumbSchema, SITE_URL } from '@/components/JsonLd'

const url = `${SITE_URL}/galeria`

export const metadata: Metadata = {
  title: 'Galeria de Resultados — Antes e Depois',
  description:
    'Galeria de trabalhos reais — antes e depois de Microblading, Microshading, Eyeliner Permanente e Micropigmentação Labial em Braga, com mais de 2300 clientes satisfeitos.',
  alternates: { canonical: url },
  openGraph: {
    title: 'Galeria de Resultados — Antes e Depois | Francielly Costa',
    description: 'Veja trabalhos reais de Dermopigmentação realizados em Braga.',
    url,
    siteName: 'Francielly Costa',
    locale: 'pt_PT',
    type: 'website',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'Galeria Francielly Costa' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Galeria de Resultados — Francielly Costa',
    description: 'Antes e depois de Microblading, Eyeliner e Micropigmentação Labial.',
    images: ['/og-image.png'],
  },
}

export default function Galeria() {
  return (
    <>
      <JsonLd
        id="ld-breadcrumb-galeria"
        data={breadcrumbSchema([
          { name: 'Início', url: SITE_URL },
          { name: 'Galeria', url },
        ])}
      />
      <GaleriaPage />
    </>
  )
}
