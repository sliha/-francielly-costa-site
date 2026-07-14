import { AlertTriangle } from 'lucide-react'
import { getConsentimentoPorToken } from '@/lib/consentimentos'
import ConsentimentoForm from './ConsentimentoForm'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export default async function ConsentimentoFormPage({
  params,
}: {
  params: { token: string }
}) {
  const token = params.token || ''
  const doc = token ? await getConsentimentoPorToken(token) : null

  if (!doc) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow p-8 max-w-md text-center">
          <AlertTriangle size={36} className="text-amber-500 mx-auto mb-3" />
          <h1 className="text-xl font-playfair font-semibold text-gray-800 mb-2">Link inválido</h1>
          <p className="text-gray-600 text-sm">
            Este link de consentimento não é válido ou expirou. Contacte-nos em geral@franciellycosta.pt.
          </p>
        </div>
      </div>
    )
  }

  return <ConsentimentoForm token={token} doc={doc} />
}
