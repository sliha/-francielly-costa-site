import type { Metadata } from 'next'
import BookingFlow from '@/components/booking/BookingFlow'

export const metadata: Metadata = {
  title: 'Agendar Online — Microblading, Lábios, Eyeliner em Braga',
  description:
    'Agende o seu procedimento de dermopigmentação online em menos de 2 minutos. Escolha o serviço, a data e a hora — confirmação imediata.',
  alternates: { canonical: '/agendar' },
  openGraph: {
    title: 'Agendar Online — Francielly Costa, Braga',
    description:
      'Escolha o serviço, a data e a hora. Marque o seu procedimento de dermopigmentação em poucos minutos.',
    url: '/agendar',
    type: 'website',
  },
}

interface Props {
  searchParams: Promise<{ servico?: string; ref?: string; id?: string }>
}

export default async function AgendarPage({ searchParams }: Props) {
  const params = await searchParams
  const servicoPreSelecionado = params.servico
  const isFromWaitlist = params.ref === 'lista-espera'

  return (
    <main className="min-h-screen bg-cream py-20 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="font-playfair font-bold text-4xl text-text-primary mb-3">
            Agendar Consulta
          </h1>
          {isFromWaitlist ? (
            <p className="text-text-secondary font-inter">
              Ótima notícia! Surgiu uma vaga para si. Escolha a data e a hora que prefere para confirmar a sua marcação.
            </p>
          ) : (
            <p className="text-text-secondary font-inter">
              Escolha o serviço, a data e a hora que prefere. Confirmamos a sua marcação de seguida.
            </p>
          )}
        </div>
        <BookingFlow servicoPreSelecionado={servicoPreSelecionado} />
      </div>
    </main>
  )
}
