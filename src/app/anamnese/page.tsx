import type { Metadata } from 'next'
import AnamneseInterativa from '@/components/anamnese/AnamneseInterativa'

export const metadata: Metadata = {
  title: 'Ficha de Anamnese FiberBROWS | Francielly Costa',
  robots: { index: false, follow: false },
}

export default function AnamnesePage() {
  return <AnamneseInterativa />
}
