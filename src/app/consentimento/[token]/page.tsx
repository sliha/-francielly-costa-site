import { redirect } from 'next/navigation'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// A anamnese/consentimento passou a viver em /anamnese/[token] (fluxo interativo).
// Mantemos esta rota a redirecionar para não quebrar links já enviados.
export default function ConsentimentoRedirect({ params }: { params: { token: string } }) {
  redirect(`/anamnese/${params.token || ''}`)
}
