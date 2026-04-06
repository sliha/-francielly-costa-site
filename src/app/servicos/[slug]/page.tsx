import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { services, getServiceBySlug } from '@/data/services'
import ServiceDetailPage from '@/components/servicos/ServiceDetailPage'
import FiberBROWSDetailPage from '@/components/servicos/FiberBROWSDetailPage'
import TricoPigmentacaoDetailPage from '@/components/servicos/TricoPigmentacaoDetailPage'

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
  if (params.slug === 'tricopigmentacao') {
    return {
      title: 'Tricopigmentação — Micropigmentação Capilar',
      description:
        'Procedimento estético para calvície e cabelo ralo. Ilusão perfeita de folículos capilares. Resultado imediato, sem cirurgia, sem recuperação.',
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
  if (params.slug === 'fiberbrows') return <FiberBROWSDetailPage />
  if (params.slug === 'tricopigmentacao') return <TricoPigmentacaoDetailPage />

  const service = getServiceBySlug(params.slug)
  if (!service) notFound()

  return <ServiceDetailPage service={service} />
}
