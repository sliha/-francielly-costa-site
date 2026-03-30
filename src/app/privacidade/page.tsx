import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Política de Privacidade',
  description: 'Política de Privacidade de Francielly Costa – Dermopigmentação Avançada em Braga.',
}

export default function Privacidade() {
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
          Política de Privacidade
        </h1>
        <div className="divider-rose-left mb-8" />

        <div className="prose prose-lg max-w-none space-y-6 text-text-secondary font-inter">
          <p>
            A Francielly Costa está comprometida com a proteção da sua privacidade.
            Esta política explica como recolhemos, utilizamos e protegemos as suas
            informações pessoais.
          </p>

          <h2 className="font-playfair font-bold text-2xl text-text-primary mt-8">
            Dados Recolhidos
          </h2>
          <p>
            Recolhemos apenas os dados estritamente necessários para prestar os
            nossos serviços: nome, email, telefone e informações relacionadas com
            os tratamentos agendados.
          </p>

          <h2 className="font-playfair font-bold text-2xl text-text-primary mt-8">
            Utilização dos Dados
          </h2>
          <p>
            Os seus dados são utilizados exclusivamente para gestão de
            agendamentos, comunicação sobre os nossos serviços e melhoria da
            qualidade do atendimento.
          </p>

          <h2 className="font-playfair font-bold text-2xl text-text-primary mt-8">
            Proteção dos Dados
          </h2>
          <p>
            Os seus dados são armazenados de forma segura e nunca são partilhados
            com terceiros sem o seu consentimento, conforme o Regulamento Geral
            sobre a Proteção de Dados (RGPD).
          </p>

          <h2 className="font-playfair font-bold text-2xl text-text-primary mt-8">
            Contacto
          </h2>
          <p>
            Para exercer os seus direitos (acesso, retificação, eliminação) ou para
            qualquer questão sobre privacidade, contacte-nos em:{' '}
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
