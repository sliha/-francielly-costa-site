'use client'
import Link from 'next/link'
import { XCircle } from 'lucide-react'
import { trackContactWhatsapp } from '@/lib/analytics'

export default function AgendamentoCancelado() {
  return (
    <main className="min-h-screen bg-cream flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="bg-white rounded-3xl shadow-soft p-10">
          <div className="flex justify-center mb-6">
            <XCircle className="w-20 h-20 text-rose-400" />
          </div>
          <h1 className="font-playfair font-bold text-3xl text-text-primary mb-3">
            Pagamento Cancelado
          </h1>
          <p className="text-text-secondary font-inter mb-8">
            O pagamento foi cancelado e a sua marcação não foi confirmada. Pode tentar novamente ou contactar-nos diretamente.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/agendar" className="btn-primary">
              Tentar Novamente
            </Link>
            <a
              href="https://wa.link/kwctpf"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackContactWhatsapp({ source: 'agendamento_cancelado' })}
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
