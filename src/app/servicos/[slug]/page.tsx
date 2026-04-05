import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { services, getServiceBySlug } from '@/data/services'
import ServiceDetailPage from '@/components/servicos/ServiceDetailPage'
import FiberBROWSDetailPage from '@/components/servicos/FiberBROWSDetailPage'

interface Props {
  params: { slug: string }
}

export async function generateStaticParams() {
  return services.map((service) => ({ slug: service.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  if (params.slug === 'fiberbrows') {
    return {
      title: 'FiberBROWS — A Revolução das Sobrancelhas',
      description:
        'Técnica estética não cirúrgica com fios sintéticos biocompatíveis. Profundidade máxima 2mm, resultado 6 meses. Primeira profissional certificada em Portugal.',
    }
  }
  const service = getServiceBySlug(params.slug)
  if (!service) return {}
  return {
    title: service.name,
    description: service.shortDescription,
  }
}

export default function ServicePage({ params }: Props) {
  if (params.slug === 'fiberbrows') {
    return <FiberBROWSDetailPage />
  }

  const service = getServiceBySlug(params.slug)
  if (!service) notFound()

  return <ServiceDetailPage service={service} />
}
