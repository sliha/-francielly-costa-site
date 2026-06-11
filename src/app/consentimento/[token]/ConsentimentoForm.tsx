'use client'
import { useState } from 'react'
import { CheckCircle2, AlertTriangle, Shield } from 'lucide-react'
import type { Consentimento, RespostasAnamnese } from '@/lib/consentimentos'

interface Props {
  token: string
  doc: Consentimento
}

export default function ConsentimentoForm({ token, doc }: Props) {
  const [submetendo, setSubmetendo] = useState(false)
  const [submetido, setSubmetido] = useState(doc.estado === 'submetido')
  const [erro, setErro] = useState<string | null>(null)

  const [respostas, setRespostas] = useState<RespostasAnamnese>({
    alergias: '',
    medicacao: '',
    gravidaOuAmamenta: false,
    doencasCardiovasculares: false,
    problemasCoagulacao: false,
    diabetes: false,
    procedimentoAnterior: false,
    queloides: false,
    notasAdicionais: '',
  })
  const [assinaturaNome, setAssinaturaNome] = useState(doc.clienteNome || '')
  const [consentimentoAceite, setConsentimentoAceite] = useState(false)
  const [rgpdAceite, setRgpdAceite] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErro(null)
    if (!consentimentoAceite || !rgpdAceite) {
      setErro('É necessário aceitar os termos para continuar.')
      return
    }
    if (!assinaturaNome.trim()) {
      setErro('Por favor escreva o seu nome completo como assinatura.')
      return
    }
    setSubmetendo(true)
    try {
      const res = await fetch('/api/consentimentos/submeter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          respostas,
          assinaturaNome: assinaturaNome.trim(),
          consentimentoAceite,
          rgpdAceite,
        }),
      })
      const data = await res.json()
      if (!res.ok || !data.ok) {
        setErro(data.error || 'Erro ao submeter')
        return
      }
      setSubmetido(true)
    } catch {
      setErro('Erro de rede ao submeter')
    } finally {
      setSubmetendo(false)
    }
  }

  if (submetido) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow p-8 max-w-md text-center">
          <CheckCircle2 size={48} className="text-emerald-500 mx-auto mb-3" />
          <h1 className="text-2xl font-playfair font-semibold text-gray-800 mb-2">Obrigado!</h1>
          <p className="text-gray-600 text-sm leading-relaxed">
            O seu formulário foi submetido com sucesso. Vemo-nos no dia do procedimento.
          </p>
          <p className="text-gray-500 text-xs mt-4">
            {doc.clienteNome} · {doc.servicoNome}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-cream py-10 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-6">
          <h1 className="text-rose-gold text-3xl font-playfair font-semibold">Francielly Costa</h1>
          <p className="text-golden text-sm mt-1">Formulário de Consentimento Informado</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-white rounded-2xl shadow-sm p-5">
            <p className="text-sm text-gray-600">
              <strong>Cliente:</strong> {doc.clienteNome}<br />
              <strong>Serviço:</strong> {doc.servicoNome}<br />
              <strong>Data:</strong> {new Date(doc.dataAgendamento + 'T12:00:00').toLocaleDateString('pt-PT', {
                weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
              })}
            </p>
          </div>

          <Section title="1. Anamnese — Informações de Saúde">
            <Field label="Tem alergias conhecidas? (anestésicos, pigmentos, látex, etc.)">
              <textarea
                value={respostas.alergias}
                onChange={(e) => setRespostas({ ...respostas, alergias: e.target.value })}
                rows={2}
                placeholder="Descreva as alergias, ou escreva 'Nenhuma'."
                className="form-input"
              />
            </Field>
            <Field label="Toma medicação regular?">
              <textarea
                value={respostas.medicacao}
                onChange={(e) => setRespostas({ ...respostas, medicacao: e.target.value })}
                rows={2}
                placeholder="Anticoagulantes, AINEs, isotretinoína, etc., ou 'Nenhuma'."
                className="form-input"
              />
            </Field>

            <YesNo label="Está grávida ou a amamentar?"
              value={respostas.gravidaOuAmamenta}
              onChange={(v) => setRespostas({ ...respostas, gravidaOuAmamenta: v })} />
            <YesNo label="Tem doenças cardiovasculares (hipertensão, arritmia, etc.)?"
              value={respostas.doencasCardiovasculares}
              onChange={(v) => setRespostas({ ...respostas, doencasCardiovasculares: v })} />
            <YesNo label="Tem problemas de coagulação ou hemofilia?"
              value={respostas.problemasCoagulacao}
              onChange={(v) => setRespostas({ ...respostas, problemasCoagulacao: v })} />
            <YesNo label="Tem diabetes?"
              value={respostas.diabetes}
              onChange={(v) => setRespostas({ ...respostas, diabetes: v })} />
            <YesNo label="Tendência a queloides ou cicatrização anómala?"
              value={respostas.queloides}
              onChange={(v) => setRespostas({ ...respostas, queloides: v })} />
            <YesNo label="Já realizou procedimento de dermopigmentação anteriormente?"
              value={respostas.procedimentoAnterior}
              onChange={(v) => setRespostas({ ...respostas, procedimentoAnterior: v })} />

            <Field label="Notas adicionais (opcional)">
              <textarea
                value={respostas.notasAdicionais}
                onChange={(e) => setRespostas({ ...respostas, notasAdicionais: e.target.value })}
                rows={2}
                placeholder="Alguma informação relevante sobre a sua saúde."
                className="form-input"
              />
            </Field>
          </Section>

          <Section title="2. Consentimento Informado">
            <p className="text-xs text-gray-600 leading-relaxed mb-3">
              Declaro que fui informado(a) sobre o procedimento de dermopigmentação, os seus benefícios, riscos
              (incluindo possíveis reações alérgicas, infeção, alterações na cor ao longo do tempo) e cuidados
              pós-procedimento. Compreendi que o resultado pode variar de pessoa para pessoa e que retoques podem
              ser necessários. Declaro também que as informações que prestei são verdadeiras.
            </p>
            <label className="flex items-start gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={consentimentoAceite} onChange={(e) => setConsentimentoAceite(e.target.checked)}
                className="mt-1 accent-rose-gold" />
              <span className="text-gray-700">
                Li e aceito os termos do procedimento e da anamnese.
              </span>
            </label>
          </Section>

          <Section title="3. Proteção de Dados (RGPD)">
            <p className="text-xs text-gray-600 leading-relaxed mb-3">
              Os seus dados serão tratados de forma confidencial, exclusivamente para fins clínicos e de gestão
              do procedimento. Pode aceder, retificar ou solicitar a eliminação dos seus dados em qualquer
              momento contactando geral@franciellycosta.com.
            </p>
            <label className="flex items-start gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={rgpdAceite} onChange={(e) => setRgpdAceite(e.target.checked)}
                className="mt-1 accent-rose-gold" />
              <span className="text-gray-700">
                Aceito o tratamento dos meus dados de acordo com o RGPD.
              </span>
            </label>
          </Section>

          <Section title="4. Assinatura">
            <Field label="Escreva o seu nome completo (assinatura digital)">
              <input
                type="text"
                value={assinaturaNome}
                onChange={(e) => setAssinaturaNome(e.target.value)}
                placeholder="Nome completo"
                className="form-input"
                required
              />
            </Field>
            <p className="text-xs text-gray-500 italic mt-1">
              Ao escrever o seu nome, está a assinar este formulário digitalmente.
            </p>
          </Section>

          {erro && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-start gap-2">
              <AlertTriangle size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-red-700 text-sm">{erro}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={submetendo}
            className="w-full bg-rose-gold hover:bg-opacity-90 text-white py-3.5 rounded-2xl font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {submetendo && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
            {submetendo ? 'A submeter...' : 'Submeter Formulário'}
          </button>

          <p className="text-center text-xs text-gray-500 flex items-center justify-center gap-1.5">
            <Shield size={11} />
            Os seus dados estão protegidos. Submissão segura via HTTPS.
          </p>
        </form>
      </div>

      <style jsx>{`
        .form-input {
          width: 100%;
          background: #fff;
          border: 1px solid #e5e7eb;
          border-radius: 10px;
          padding: 10px 12px;
          font-size: 14px;
          color: #1f2937;
          outline: none;
        }
        .form-input:focus { border-color: #B76E79; }
      `}</style>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm p-5 space-y-3">
      <h2 className="text-base font-playfair font-semibold text-gray-800">{title}</h2>
      {children}
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
      {children}
    </div>
  )
}

function YesNo({ label, value, onChange }: { label: string; value: boolean | undefined; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between gap-3 py-1.5">
      <p className="text-sm text-gray-700 flex-1">{label}</p>
      <div className="flex gap-1.5 flex-shrink-0">
        <button type="button" onClick={() => onChange(true)}
          className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
            value === true ? 'bg-rose-gold text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}>
          Sim
        </button>
        <button type="button" onClick={() => onChange(false)}
          className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
            value === false ? 'bg-rose-gold text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}>
          Não
        </button>
      </div>
    </div>
  )
}
