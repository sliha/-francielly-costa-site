import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { services, getServiceBySlug } from '@/data/services'
import ServiceDetailPage from '@/components/servicos/ServiceDetailPage'
import FiberBROWSDetailPage from '@/components/servicos/FiberBROWSDetailPage'
import TricoPigmentacaoDetailPage from '@/components/servicos/TricoPigmentacaoDetailPage'
import JsonLd, { breadcrumbSchema, serviceSchema, faqSchema, SITE_URL } from '@/components/JsonLd'
import { fiberbrowsFaq } from '@/data/fiberbrowsFaq'

interface Props {
  params: { slug: string }
}

export async function generateStaticParams() {
  return services.map((service) => ({ slug: service.slug }))
}

const SEO_TITLES: Record<string, { title: string; description: string }> = {
  fiberbrows: {
    title: 'FiberBROWS em Braga — Sobrancelhas Naturais 6 Meses | Agende Online',
    description:
      'FiberBROWS em Braga com a Francielly Costa, primeira profissional certificada em Portugal. Técnica estética não cirúrgica com fios biocompatíveis, profundidade máxima 2mm, resultado natural de 6 meses. Marcações abertas — agende online.',
  },
  tricopigmentacao: {
    title: 'Tricopigmentação em Braga — Micropigmentação Capilar',
    description:
      'Procedimento estético para calvície e cabelo ralo. Ilusão perfeita de folículos capilares. Resultado imediato, sem cirurgia, sem recuperação.',
  },
  microblading: {
    title: 'Microblading em Braga — Sobrancelhas Naturais',
    description:
      'Técnica de pigmentação japonesa com Tebori. Fios individualizados, sobrancelhas tridimensionais e resultados ultra-realistas em Braga.',
  },
  microshading: {
    title: 'Microshading em Braga — Sobrancelhas Densas e Naturais',
    description:
      'Sombreamento suave em pixel para sobrancelhas densas e definidas. Ideal para pele oleosa. Especialista certificada em Braga.',
  },
  eyeliner: {
    title: 'Eyeliner Permanente em Braga — Delineado Duradouro',
    description:
      'Micropigmentação eyeliner ao longo da linha dos cílios. Olhar definido 24h, resistente à água. Resultado natural ou marcado.',
  },
  'micropigmentacao-labial': {
    title: 'Micropigmentação Labial em Braga — Lábios Perfeitos',
    description:
      'Contorno e cor perfeitos para lábios rejuvenescidos. Corrige assimetrias e uniformiza coloração. Resultado natural e duradouro.',
  },
}

const SEO_KEYWORDS: Record<string, string[]> = {
  fiberbrows: [
    'fiberbrows braga',
    'fiberbrows portugal',
    'fiberbrows 360',
    'sobrancelhas de fio braga',
    'sobrancelhas naturais braga',
    'alternativa a transplante de sobrancelhas',
    'preenchimento de sobrancelhas braga',
    'francielly costa fiberbrows',
  ],
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const url = `${SITE_URL}/servicos/${params.slug}`
  const seo = SEO_TITLES[params.slug]
  const service = getServiceBySlug(params.slug)

  const title = seo?.title ?? (service ? `${service.name} em Braga | Francielly Costa` : 'Serviço')
  const description = seo?.description ?? service?.shortDescription ?? ''
  const keywords = SEO_KEYWORDS[params.slug]

  if (!seo && !service) return {}

  return {
    title,
    description,
    ...(keywords ? { keywords } : {}),
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      siteName: 'Francielly Costa',
      locale: 'pt_PT',
      type: 'website',
      images: [{ url: '/og-image.png', width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ['/og-image.png'],
    },
  }
}

export default function ServicePage({ params }: Props) {
  const url = `${SITE_URL}/servicos/${params.slug}`
  const service = getServiceBySlug(params.slug)
  const isFiber = params.slug === 'fiberbrows'
  const isTrico = params.slug === 'tricopigmentacao'

  if (!service && !isFiber && !isTrico) notFound()

  const seo = SEO_TITLES[params.slug]
  const serviceName = service?.name ?? (isFiber ? 'FiberBROWS' : 'Tricopigmentação')
  const description = seo?.description ?? service?.shortDescription ?? ''

  return (
    <>
      <JsonLd
        id={`ld-breadcrumb-${params.slug}`}
        data={breadcrumbSchema([
          { name: 'Início', url: SITE_URL },
          { name: 'Serviços', url: `${SITE_URL}/servicos` },
          { name: serviceName, url },
        ])}
      />
      <JsonLd
        id={`ld-service-${params.slug}`}
        data={serviceSchema({
          serviceType: serviceName,
          description,
          url,
          priceRange: service?.priceRange,
        })}
      />
      {isFiber && (
        <JsonLd
          id="ld-faq-fiberbrows"
          data={faqSchema(fiberbrowsFaq.map((f) => ({ question: f.q, answer: f.a })))}
        />
      )}
      {isFiber ? (
        <FiberBROWSDetailPage />
      ) : isTrico ? (
        <TricoPigmentacaoDetailPage />
      ) : (
        <ServiceDetailPage service={service!} />
      )}
    </>
  )
}
