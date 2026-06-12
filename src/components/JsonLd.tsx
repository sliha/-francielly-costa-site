interface JsonLdProps {
  id: string
  data: Record<string, unknown> | Record<string, unknown>[]
}

/**
 * JSON-LD como <script> simples (padrão recomendado pelo Next.js): sai no HTML
 * renderizado no servidor, visível para crawlers sem JS (Google, Meta, validadores
 * de anúncios). next/script com beforeInteractive não suporta inline no App Router.
 */
export default function JsonLd({ id, data }: JsonLdProps) {
  return (
    <script
      id={id}
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  )
}

export const SITE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://franciellycosta.pt'

export const localBusinessSchema = {
  '@context': 'https://schema.org',
  // BeautySalon é o subtipo mais específico de LocalBusiness para este negócio.
  '@type': 'BeautySalon',
  '@id': `${SITE_URL}/#localbusiness`,
  name: 'Francielly Costa — Dermopigmentação Avançada',
  image: `${SITE_URL}/og-image.png`,
  logo: `${SITE_URL}/apple-icon.png`,
  url: SITE_URL,
  telephone: '+351917132116',
  email: 'geral@franciellycosta.com',
  address: {
    '@type': 'PostalAddress',
    streetAddress: 'Av. Dr. António Palha 53',
    addressLocality: 'Braga',
    postalCode: '4715-091',
    addressCountry: 'PT',
  },
  geo: {
    '@type': 'GeoCoordinates',
    latitude: 41.5518,
    longitude: -8.4229,
  },
  openingHoursSpecification: [
    {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      opens: '10:00',
      closes: '18:00',
    },
  ],
  // Nota: aggregateRating removido — o Google exige avaliações reais e visíveis
  // na página; usar o n.º de clientes como n.º de reviews arrisca ação manual
  // sobre os dados estruturados e reprovação de anúncios por misrepresentation.
  priceRange: '€€',
  sameAs: [
    'https://www.instagram.com/franciellycostamaster',
    'https://www.facebook.com/Franciellycostaespecialista/',
  ],
}

interface BreadcrumbItem {
  name: string
  url: string
}

export function breadcrumbSchema(items: BreadcrumbItem[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, idx) => ({
      '@type': 'ListItem',
      position: idx + 1,
      name: item.name,
      item: item.url,
    })),
  }
}

interface ServiceSchemaInput {
  serviceType: string
  description: string
  url: string
  image?: string
  priceRange?: string
}

export function serviceSchema({ serviceType, description, url, image, priceRange }: ServiceSchemaInput) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    serviceType,
    name: serviceType,
    description,
    url,
    ...(image ? { image } : {}),
    ...(priceRange ? { offers: { '@type': 'Offer', priceRange } } : {}),
    provider: {
      '@type': 'LocalBusiness',
      '@id': `${SITE_URL}/#localbusiness`,
      name: 'Francielly Costa — Dermopigmentação Avançada',
      telephone: '+351917132116',
      address: {
        '@type': 'PostalAddress',
        streetAddress: 'Av. Dr. António Palha 53',
        addressLocality: 'Braga',
        postalCode: '4715-091',
        addressCountry: 'PT',
      },
    },
    areaServed: [
      { '@type': 'City', name: 'Braga' },
      { '@type': 'City', name: 'Porto' },
      { '@type': 'Country', name: 'Portugal' },
    ],
  }
}

interface FAQItem {
  question: string
  answer: string
}

export function faqSchema(items: FAQItem[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((it) => ({
      '@type': 'Question',
      name: it.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: it.answer,
      },
    })),
  }
}

interface BookSchemaInput {
  name: string
  description: string
  url: string
  image: string
  pdfUrl: string
  numberOfPages: number
  datePublished: string
  about?: string[]
}

export function bookSchema({ name, description, url, image, pdfUrl, numberOfPages, datePublished, about }: BookSchemaInput) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Book',
    name,
    description,
    url,
    image,
    numberOfPages,
    datePublished,
    bookFormat: 'https://schema.org/EBook',
    inLanguage: 'pt-PT',
    ...(about ? { about } : {}),
    isAccessibleForFree: true,
    author: {
      '@type': 'Person',
      name: 'Francielly Costa',
      url: `${SITE_URL}/sobre`,
    },
    publisher: {
      '@type': 'Organization',
      name: 'Francielly Costa',
      logo: { '@type': 'ImageObject', url: `${SITE_URL}/og-image.png` },
    },
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'EUR',
      availability: 'https://schema.org/InStock',
      url: pdfUrl,
    },
    workExample: {
      '@type': 'Book',
      bookFormat: 'https://schema.org/EBook',
      encoding: { '@type': 'MediaObject', encodingFormat: 'application/pdf', contentUrl: pdfUrl },
      inLanguage: 'pt-PT',
      isAccessibleForFree: true,
    },
  }
}

interface ArticleSchemaInput {
  headline: string
  description: string
  url: string
  datePublished: string
  dateModified?: string
  image?: string
}

export function articleSchema({ headline, description, url, datePublished, dateModified, image }: ArticleSchemaInput) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline,
    description,
    url,
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
    datePublished,
    dateModified: dateModified ?? datePublished,
    ...(image ? { image } : { image: `${SITE_URL}/og-image.png` }),
    author: {
      '@type': 'Person',
      name: 'Francielly Costa',
      url: `${SITE_URL}/sobre`,
    },
    publisher: {
      '@type': 'Organization',
      name: 'Francielly Costa',
      logo: {
        '@type': 'ImageObject',
        url: `${SITE_URL}/og-image.png`,
      },
    },
  }
}
