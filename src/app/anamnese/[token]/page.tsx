import type { Metadata } from 'next'
import { AlertTriangle } from 'lucide-react'
import { getConsentimentoPorToken } from '@/lib/consentimentos'
import AnamneseInterativa from '@/components/anamnese/AnamneseInterativa'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const metadata: Metadata = {
  title: 'Ficha de Anamnese FiberBROWS | Francielly Costa',
  robots: { index: false, follow: false },
}

export default async function AnamneseTokenPage({ params }: { params: { token: string } }) {
  const token = params.token || ''
  const doc = token ? await getConsentimentoPorToken(token) : null

  if (!doc) {
    return (
      <div className="min-h-screen bg-[#F4ECE8] flex items-center justify-center px-4">
        <div className="bg-white rounded-3xl shadow p-8 max-w-md text-center">
          <AlertTriangle size={36} className="text-amber-500 mx-auto mb-3" />
          <h1 className="text-xl font-playfair font-semibold text-gray-800 mb-2">Link inválido</h1>
          <p className="text-gray-600 text-sm">
            Este link já não é válido ou expirou. Contacte-nos em geral@franciellycosta.pt.
          </p>
        </div>
      </div>
    )
  }

  return (
    <AnamneseInterativa
      tokenInicial={doc.token}
      respostasIniciais={(doc.respostas as unknown as Record<string, string | string[]>) || undefined}
      progressoInicial={doc.progressoStep ?? 0}
      nomePre={doc.clienteNome || undefined}
      emailPre={doc.clienteEmail || undefined}
      jaSubmetido={doc.estado === 'submetido'}
    />
  )
}
