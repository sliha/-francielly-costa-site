import type { Metadata } from 'next'
import ContactoPage from '@/components/contacto/ContactoPage'
import JsonLd, { breadcrumbSchema, SITE_URL } from '@/components/JsonLd'

const url = `${SITE_URL}/contacto`

export const metadata: Metadata = {
  title: 'Contacto e Localização em Braga',
  description:
    'Entre em contacto e agende a sua consulta de Dermopigmentação em Braga. Av. Dr. António Palha 53. Telefone, WhatsApp ou formulário online.',
  alternates: { canonical: url },
  openGraph: {
    title: 'Contacto — Francielly Costa | Braga',
    description: 'Marque a sua consulta em Braga. Telefone, WhatsApp ou formulário online.',
    url,
    siteName: 'Francielly Costa',
    locale: 'pt_PT',
    type: 'website',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'Contacto Francielly Costa' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Contacto — Francielly Costa',
    description: 'Marque a sua consulta em Braga.',
    images: ['/og-image.png'],
  },
}

export default function Contacto() {
  return (
    <>
      <JsonLd
        id="ld-breadcrumb-contacto"
        data={breadcrumbSchema([
          { name: 'Início', url: SITE_URL },
          { name: 'Contacto', url },
        ])}
      />
      <ContactoPage />
    </>
  )
}
