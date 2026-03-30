import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { services, getServiceBySlug } from '@/data/services'
import ServiceDetailPage from '@/components/servicos/ServiceDetailPage'

interface Props {
  params: { slug: string }
}

export async function generateStaticParams() {
  return services.map((service) => ({ slug: service.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const service = getServiceBySlug(params.slug)
  if (!service) return {}

  return {
    title: service.name,
    description: service.shortDescription,
  }
}

export default function ServicePage({ params }: Props) {
  const service = getServiceBySlug(params.slug)
  if (!service) notFound()

  return <ServiceDetailPage service={service} />
}
