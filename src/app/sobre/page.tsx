import type { Metadata } from 'next'
import SobrePage from '@/components/sobre/SobrePage'

export const metadata: Metadata = {
  title: 'Sobre Mim',
  description:
    'Conheça Francielly Costa, especialista em Dermopigmentação Avançada em Braga, Portugal. Mais de 8 anos de experiência, formada em Milão, Itália.',
}

export default function Sobre() {
  return <SobrePage />
}
