import type { Metadata } from 'next'
import SobrePage from '@/components/sobre/SobrePage'
import JsonLd, { breadcrumbSchema, SITE_URL } from '@/components/JsonLd'

const url = `${SITE_URL}/sobre`

export const metadata: Metadata = {
  title: {
    absolute: 'Sobre Francielly Costa — Especialista Certificada em Dermopigmentação em Braga',
  },
  description:
    'Conheça Francielly Costa: +8 anos de experiência, +2300 clientes, formação internacional em Itália. Especialista em Dermopigmentação Avançada em Braga, Portugal.',
  alternates: { canonical: url },
  openGraph: {
    title: 'Sobre Francielly Costa — Especialista em Dermopigmentação',
    description: 'Especialista certificada em Dermopigmentação Avançada com formação internacional.',
    url,
    siteName: 'Francielly Costa',
    locale: 'pt_PT',
    type: 'profile',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'Francielly Costa' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Sobre Francielly Costa',
    description: 'Especialista certificada em Dermopigmentação em Braga.',
    images: ['/og-image.png'],
  },
}

export default function Sobre() {
  const personSchema = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: 'Francielly Costa',
    jobTitle: 'Especialista em Dermopigmentação Avançada',
    url,
    image: `${SITE_URL}/og-image.png`,
    worksFor: { '@id': `${SITE_URL}/#localbusiness` },
    knowsAbout: [
      'Microblading',
      'Microshading',
      'Micropigmentação Labial',
      'Eyeliner Permanente',
      'Tricopigmentação',
      'FiberBROWS',
    ],
    sameAs: [
      'https://www.instagram.com/franciellycostamaster',
      'https://www.facebook.com/Franciellycostaespecialista/',
    ],
  }

  return (
    <>
      <JsonLd
        id="ld-breadcrumb-sobre"
        data={breadcrumbSchema([
          { name: 'Início', url: SITE_URL },
          { name: 'Sobre', url },
        ])}
      />
      <JsonLd id="ld-person-sobre" data={personSchema} />
      <SobrePage />
    </>
  )
}
