import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Termos e Condições',
  description: 'Termos e Condições de Francielly Costa – Dermopigmentação Avançada em Braga.',
}

export default function Termos() {
  return (
    <div className="pt-20 min-h-screen bg-cream">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-text-secondary hover:text-rose-gold transition-colors duration-200 mb-8 font-inter text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar ao Início
        </Link>

        <h1 className="font-playfair font-bold text-4xl text-text-primary mb-6">
          Termos e Condições
        </h1>
        <div className="divider-rose-left mb-8" />

        <div className="prose prose-lg max-w-none space-y-6 text-text-secondary font-inter">
          <p>
            Ao utilizar os serviços da Francielly Costa, concorda com os
            presentes Termos e Condições. Por favor, leia-os atentamente.
          </p>

          <h2 className="font-playfair font-bold text-2xl text-text-primary mt-8">
            Serviços
          </h2>
          <p>
            Os serviços de dermopigmentação são prestados mediante agendamento
            prévio. Os preços indicados no site são orientativos e podem variar
            consoante a avaliação individual de cada cliente.
          </p>

          <h2 className="font-playfair font-bold text-2xl text-text-primary mt-8">
            Agendamentos
          </h2>
          <p>
            Os agendamentos podem ser cancelados ou remarcados com um mínimo de
            48 horas de antecedência. O não comparecimento sem aviso pode implicar
            o pagamento parcial do tratamento.
          </p>

          <h2 className="font-playfair font-bold text-2xl text-text-primary mt-8">
            Contraindicações
          </h2>
          <p>
            É responsabilidade da cliente informar sobre condições de saúde que
            possam constituir contraindicação. A Francielly Costa reserva-se o
            direito de recusar tratamentos que possam colocar em risco a saúde
            da cliente.
          </p>

          <h2 className="font-playfair font-bold text-2xl text-text-primary mt-8">
            Resultados
          </h2>
          <p>
            Os resultados dos tratamentos de dermopigmentação variam de pessoa
            para pessoa. Os resultados apresentados são exemplos reais mas não
            garantem resultados idênticos para todos os casos.
          </p>

          <h2 className="font-playfair font-bold text-2xl text-text-primary mt-8">
            Contacto
          </h2>
          <p>
            Para questões sobre os termos e condições:{' '}
            <a
              href="mailto:info@franciellycosta.com"
              className="text-rose-gold hover:underline"
            >
              info@franciellycosta.com
            </a>
          </p>

          <p className="text-sm text-text-muted">
            Última atualização: Janeiro de 2024
          </p>
        </div>
      </div>
    </div>
  )
}
