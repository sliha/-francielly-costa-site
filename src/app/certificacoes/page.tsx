import type { Metadata } from 'next'
import CertificacoesClient from './CertificacoesClient'
import JsonLd, { breadcrumbSchema, SITE_URL } from '@/components/JsonLd'

const url = `${SITE_URL}/certificacoes`

export const metadata: Metadata = {
  title: 'Certificações e Formação Internacional | Francielly Costa',
  description:
    'Francielly Costa: especialista certificada em Dermopigmentação Avançada, com formação internacional e credenciais reconhecidas em Portugal.',
  alternates: { canonical: url },
  openGraph: {
    title: 'Certificações e Formação Internacional | Francielly Costa',
    description: 'Especialista certificada em Dermopigmentação com formação internacional.',
    url,
    siteName: 'Francielly Costa',
    locale: 'pt_PT',
    type: 'website',
    images: [{ url: '/og-image.jpg', width: 1200, height: 630, alt: 'Certificações Francielly Costa' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Certificações | Francielly Costa',
    description: 'Especialista certificada com formação internacional.',
    images: ['/og-image.jpg'],
  },
}

export default function Certificacoes() {
  return (
    <>
      <JsonLd
        id="ld-breadcrumb-certificacoes"
        data={breadcrumbSchema([
          { name: 'Início', url: SITE_URL },
          { name: 'Certificações', url },
        ])}
      />
      <CertificacoesClient />
    </>
  )
}
