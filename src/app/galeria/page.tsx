import type { Metadata } from 'next'
import GaleriaPage from '@/components/galeria/GaleriaPage'

export const metadata: Metadata = {
  title: 'Galeria',
  description:
    'Galeria de trabalhos de Francielly Costa. Antes e depois de Microblading, Microshading, Eyeliner Permanente e Micropigmentação Labial em Braga.',
}

export default function Galeria() {
  return <GaleriaPage />
}
