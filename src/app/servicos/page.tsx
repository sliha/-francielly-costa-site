import type { Metadata } from 'next'
import ServicosPage from '@/components/servicos/ServicosPage'

export const metadata: Metadata = {
  title: 'Serviços',
  description:
    'Conheça todos os serviços de Dermopigmentação de Francielly Costa: Microblading, Microshading, Eyeliner Permanente e Micropigmentação Labial em Braga.',
}

export default function Servicos() {
  return <ServicosPage />
}
