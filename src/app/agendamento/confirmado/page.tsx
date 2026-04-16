'use client'
import { useEffect } from 'react'
import Link from 'next/link'
import { CheckCircle } from 'lucide-react'

export default function AgendamentoConfirmado() {
  useEffect(() => {
    // Scroll to top
    window.scrollTo(0, 0)
  }, [])

  return (
    <main className="min-h-screen bg-cream flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="bg-white rounded-3xl shadow-soft p-10">
          <div className="flex justify-center mb-6">
            <CheckCircle className="w-20 h-20 text-green-500" />
          </div>
          <h1 className="font-playfair font-bold text-3xl text-text-primary mb-3">
            Marcação Confirmada!
          </h1>
          <p className="text-text-secondary font-inter mb-2">
            O seu pagamento foi processado com sucesso. A sua marcação está confirmada.
          </p>
          <p className="text-text-secondary font-inter mb-8">
            Receberá uma confirmação por email com todos os detalhes. Até breve!
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/" className="btn-primary">
              Voltar ao Início
            </Link>
            <a
              href="https://wa.link/kwctpf"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-outline"
            >
              WhatsApp
            </a>
          </div>
        </div>
      </div>
    </main>
  )
}
