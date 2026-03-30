import type { Metadata } from 'next'
import ContactoPage from '@/components/contacto/ContactoPage'

export const metadata: Metadata = {
  title: 'Contacto',
  description:
    'Entre em contacto com Francielly Costa para agendar a sua consulta de Dermopigmentação em Braga. Formulário online, WhatsApp ou telefone.',
}

export default function Contacto() {
  return <ContactoPage />
}
