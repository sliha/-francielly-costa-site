import type { Metadata } from 'next'
import ConsultaVirtualClient from '@/components/consulta-virtual/ConsultaVirtualClient'
import JsonLd, { breadcrumbSchema, SITE_URL } from '@/components/JsonLd'

const url = `${SITE_URL}/consulta-virtual`

export const metadata: Metadata = {
  title: 'Consulta Virtual Gratuita por Videochamada',
  description:
    'Avaliação gratuita de 15 minutos por Google Meet com a Francielly Costa. Ideal para clientes fora de Braga — tire dúvidas e receba uma recomendação antes de agendar.',
  alternates: { canonical: url },
  openGraph: {
    title: 'Consulta Virtual Gratuita — Francielly Costa',
    description:
      'Avaliação gratuita de 15 minutos por videochamada. Mostre a zona a tratar e receba uma recomendação personalizada.',
    url,
    type: 'website',
  },
}

export default function ConsultaVirtualPage() {
  return (
    <>
      <JsonLd
        id="ld-breadcrumb-consulta-virtual"
        data={breadcrumbSchema([
          { name: 'Início', url: SITE_URL },
          { name: 'Consulta Virtual', url },
        ])}
      />
      <ConsultaVirtualClient />
    </>
  )
}
