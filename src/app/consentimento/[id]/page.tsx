'use client'
import { useState } from 'react'
import { useParams } from 'next/navigation'
import {
  Shield,
  CheckCircle2,
  Circle,
  ChevronRight,
  ChevronLeft,
  AlertCircle,
  Download,
  Check,
} from 'lucide-react'

type Etapa = 'intro' | 'anamnese' | 'consentimento' | 'assinatura' | 'concluido'

const perguntasAnamnese = [
  { id: 'alergias', label: 'Tem alergias conhecidas a pigmentos, anestésicos ou outros produtos?', tipo: 'sim_nao_detalhe' },
  { id: 'medicacao', label: 'Toma alguma medicação actualmente? (anticoagulantes, isotretinoína, etc.)', tipo: 'sim_nao_detalhe' },
  { id: 'gravidez', label: 'Está grávida ou a amamentar?', tipo: 'sim_nao' },
  { id: 'pele', label: 'Tem alguma condição de pele na zona a tratar? (psoríase, eczema, acne activa)', tipo: 'sim_nao_detalhe' },
  { id: 'diabetes', label: 'Tem diabetes ou problemas de coagulação?', tipo: 'sim_nao' },
  { id: 'herpes', label: 'Tem historial de herpes labial? (relevante para micropigmentação labial)', tipo: 'sim_nao' },
  { id: 'procedimentos_anteriores', label: 'Já realizou algum procedimento de micropigmentação anteriormente?', tipo: 'sim_nao_detalhe' },
  { id: 'exposicao_solar', label: 'Esteve exposta ao sol nas últimas 2 semanas na zona a tratar?', tipo: 'sim_nao' },
]

const clausulasConsentimento = [
  'Fui informada sobre o procedimento de micropigmentação, os seus riscos, benefícios e alternativas disponíveis.',
  'Compreendo que os resultados variam de pessoa para pessoa e dependem das características individuais da minha pele.',
  'Estou ciente de que poderão ser necessárias 1 a 2 sessões de retoque para atingir o resultado desejado.',
  'Compreendo que o resultado definitivo só é visível após a cicatrização completa (aproximadamente 30 dias).',
  'Fui informada sobre os cuidados pós-procedimento e comprometo-me a segui-los.',
  'Autorizo a Francielly Costa a registar fotografias do procedimento para fins de documentação clínica.',
  'Os meus dados pessoais serão tratados de acordo com o RGPD e a Política de Privacidade da Francielly Costa.',
  'Declaro que as informações prestadas no formulário de anamnese são verdadeiras e completas.',
]

const dadosProcedimentoMock = {
  clienteNome: 'Ana Silva',
  servico: 'Microblading',
  data: '5 de Abril de 2026',
  hora: '10:00',
}

export default function ConsentimentoPage() {
  const params = useParams()
  const [etapa, setEtapa] = useState<Etapa>('intro')
  const [anamnese, setAnamnese] = useState<Record<string, { resposta: 'sim' | 'nao' | ''; detalhe: string }>>({})
  const [clausulasAceites, setClausulasAceites] = useState<boolean[]>(Array(clausulasConsentimento.length).fill(false))
  const [todasAceites, setTodasAceites] = useState(false)
  const [assinatura, setAssinatura] = useState('')
  const [submetido, setSubmetido] = useState(false)

  const setResposta = (id: string, resposta: 'sim' | 'nao') => {
    setAnamnese(prev => ({ ...prev, [id]: { resposta, detalhe: prev[id]?.detalhe || '' } }))
  }

  const setDetalhe = (id: string, detalhe: string) => {
    setAnamnese(prev => ({ ...prev, [id]: { resposta: prev[id]?.resposta || '', detalhe } }))
  }

  const toggleClausula = (idx: number) => {
    const nova = clausulasAceites.map((v, i) => i === idx ? !v : v)
    setClausulasAceites(nova)
    setTodasAceites(nova.every(Boolean))
  }

  const aceitarTodas = () => {
    const todas = Array(clausulasConsentimento.length).fill(true)
    setClausulasAceites(todas)
    setTodasAceites(true)
  }

  const anamneseCompleta = perguntasAnamnese.every(p => anamnese[p.id]?.resposta)

  const submeter = () => {
    setEtapa('concluido')
  }

  if (etapa === 'concluido') {
    return (
      <div className="min-h-screen bg-[#0F0F0F] flex items-center justify-center px-4">
        <div className="max-w-sm w-full text-center">
          <div className="w-20 h-20 rounded-full bg-emerald-400/10 flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 size={40} className="text-emerald-400" />
          </div>
          <h1 className="text-white text-2xl font-playfair font-semibold mb-3">Consentimento Registado</h1>
          <p className="text-white/50 text-sm leading-relaxed mb-6">
            O seu formulário foi guardado com sucesso. A Francielly Costa terá acesso antes do procedimento.
          </p>
          <div className="bg-[#1A1A1A] rounded-2xl p-4 border border-white/5 text-left mb-6">
            <p className="text-white/40 text-xs mb-1">Procedimento</p>
            <p className="text-white font-medium">{dadosProcedimentoMock.servico}</p>
            <p className="text-white/50 text-sm">{dadosProcedimentoMock.data} às {dadosProcedimentoMock.hora}</p>
          </div>
          <button className="w-full flex items-center justify-center gap-2 bg-white/5 text-white/60 border border-white/10 rounded-xl py-3 text-sm hover:bg-white/10 transition-colors">
            <Download size={16} />
            Descarregar PDF
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0F0F0F] text-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-rose-gold to-golden px-4 pt-10 pb-6">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center gap-2 mb-2">
            <Shield size={18} className="text-white/70" />
            <span className="text-white/70 text-sm">Documentação Digital</span>
          </div>
          <h1 className="text-white text-xl font-playfair font-semibold">Consentimento Informado</h1>
          <p className="text-white/70 text-sm mt-1">
            {dadosProcedimentoMock.servico} · {dadosProcedimentoMock.data}
          </p>
        </div>
      </div>

      {/* Progress steps */}
      <div className="px-4 py-4 max-w-lg mx-auto">
        <div className="flex items-center gap-2">
          {(['intro', 'anamnese', 'consentimento', 'assinatura'] as Etapa[]).map((e, idx) => {
            const etapas: Etapa[] = ['intro', 'anamnese', 'consentimento', 'assinatura']
            const current = etapas.indexOf(etapa)
            const isDone = idx < current
            const isActive = idx === current
            return (
              <div key={e} className="flex items-center flex-1">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                  isDone ? 'bg-emerald-400 text-white' :
                  isActive ? 'bg-rose-gold text-white' :
                  'bg-white/10 text-white/30'
                }`}>
                  {isDone ? <Check size={12} /> : idx + 1}
                </div>
                {idx < 3 && <div className={`flex-1 h-0.5 mx-1 ${idx < current ? 'bg-emerald-400' : 'bg-white/10'}`} />}
              </div>
            )
          })}
        </div>
        <div className="flex justify-between mt-1 text-xs text-white/30">
          <span>Intro</span>
          <span>Anamnese</span>
          <span>Consentimento</span>
          <span>Assinatura</span>
        </div>
      </div>

      <div className="px-4 pb-8 max-w-lg mx-auto">
        {/* Intro */}
        {etapa === 'intro' && (
          <div className="space-y-4">
            <div className="bg-[#1A1A1A] rounded-2xl p-5 border border-white/5">
              <h2 className="text-white font-semibold mb-3">Olá, {dadosProcedimentoMock.clienteNome}!</h2>
              <p className="text-white/60 text-sm leading-relaxed">
                Antes do seu procedimento de <span className="text-white">{dadosProcedimentoMock.servico}</span>, precisamos que preencha este formulário digital.
              </p>
              <p className="text-white/60 text-sm leading-relaxed mt-3">
                Inclui um <span className="text-white">questionário de saúde</span> e o <span className="text-white">consentimento informado</span>. Demora apenas 3-5 minutos.
              </p>
              <div className="mt-4 p-3 bg-rose-gold/5 border border-rose-gold/20 rounded-xl flex items-start gap-2">
                <Shield size={14} className="text-rose-gold flex-shrink-0 mt-0.5" />
                <p className="text-white/50 text-xs">Os seus dados são protegidos pelo RGPD e ficam guardados de forma segura.</p>
              </div>
            </div>

            <button
              onClick={() => setEtapa('anamnese')}
              className="w-full bg-rose-gold text-white py-4 rounded-2xl font-medium flex items-center justify-center gap-2 hover:bg-rose-gold-dark transition-colors"
            >
              Começar
              <ChevronRight size={18} />
            </button>
          </div>
        )}

        {/* Anamnese */}
        {etapa === 'anamnese' && (
          <div className="space-y-4">
            <div>
              <h2 className="text-white font-semibold text-lg mb-1">Questionário de Saúde</h2>
              <p className="text-white/40 text-sm">Responda com honestidade para garantir a sua segurança.</p>
            </div>

            <div className="space-y-3">
              {perguntasAnamnese.map(p => (
                <div key={p.id} className="bg-[#1A1A1A] rounded-2xl p-4 border border-white/5">
                  <p className="text-white/80 text-sm leading-relaxed mb-3">{p.label}</p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setResposta(p.id, 'sim')}
                      className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors ${
                        anamnese[p.id]?.resposta === 'sim'
                          ? 'bg-rose-gold text-white'
                          : 'bg-white/5 text-white/50 hover:text-white/70'
                      }`}
                    >
                      Sim
                    </button>
                    <button
                      onClick={() => setResposta(p.id, 'nao')}
                      className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors ${
                        anamnese[p.id]?.resposta === 'nao'
                          ? 'bg-white/20 text-white'
                          : 'bg-white/5 text-white/50 hover:text-white/70'
                      }`}
                    >
                      Não
                    </button>
                  </div>
                  {p.tipo === 'sim_nao_detalhe' && anamnese[p.id]?.resposta === 'sim' && (
                    <textarea
                      placeholder="Por favor, especifique..."
                      value={anamnese[p.id]?.detalhe || ''}
                      onChange={(e) => setDetalhe(p.id, e.target.value)}
                      rows={2}
                      className="mt-3 w-full bg-white/5 rounded-xl px-3 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none resize-none"
                    />
                  )}
                </div>
              ))}
            </div>

            <div className="flex gap-3">
              <button onClick={() => setEtapa('intro')} className="w-12 bg-white/5 text-white/60 rounded-xl flex items-center justify-center">
                <ChevronLeft size={18} />
              </button>
              <button
                onClick={() => setEtapa('consentimento')}
                disabled={!anamneseCompleta}
                className="flex-1 bg-rose-gold text-white py-3 rounded-xl font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-rose-gold-dark transition-colors flex items-center justify-center gap-2"
              >
                Continuar
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}

        {/* Consentimento */}
        {etapa === 'consentimento' && (
          <div className="space-y-4">
            <div>
              <h2 className="text-white font-semibold text-lg mb-1">Consentimento Informado</h2>
              <p className="text-white/40 text-sm">Leia e aceite cada cláusula individualmente.</p>
            </div>

            <button
              onClick={aceitarTodas}
              className="w-full bg-white/5 border border-white/10 text-white/60 hover:text-white text-sm py-2.5 rounded-xl transition-colors"
            >
              Aceitar Todas as Cláusulas
            </button>

            <div className="space-y-2">
              {clausulasConsentimento.map((c, idx) => (
                <button
                  key={idx}
                  onClick={() => toggleClausula(idx)}
                  className="w-full flex items-start gap-3 bg-[#1A1A1A] rounded-2xl p-4 border border-white/5 text-left hover:border-rose-gold/20 transition-colors"
                >
                  {clausulasAceites[idx] ? (
                    <CheckCircle2 size={18} className="text-emerald-400 flex-shrink-0 mt-0.5" />
                  ) : (
                    <Circle size={18} className="text-white/20 flex-shrink-0 mt-0.5" />
                  )}
                  <p className={`text-sm leading-relaxed ${clausulasAceites[idx] ? 'text-white/50' : 'text-white/70'}`}>
                    {c}
                  </p>
                </button>
              ))}
            </div>

            {!todasAceites && (
              <div className="flex items-center gap-2 text-amber-400 text-xs">
                <AlertCircle size={14} />
                <span>Deve aceitar todas as cláusulas para continuar</span>
              </div>
            )}

            <div className="flex gap-3">
              <button onClick={() => setEtapa('anamnese')} className="w-12 bg-white/5 text-white/60 rounded-xl flex items-center justify-center">
                <ChevronLeft size={18} />
              </button>
              <button
                onClick={() => setEtapa('assinatura')}
                disabled={!todasAceites}
                className="flex-1 bg-rose-gold text-white py-3 rounded-xl font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-rose-gold-dark transition-colors flex items-center justify-center gap-2"
              >
                Assinar
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}

        {/* Assinatura */}
        {etapa === 'assinatura' && (
          <div className="space-y-4">
            <div>
              <h2 className="text-white font-semibold text-lg mb-1">Assinatura Digital</h2>
              <p className="text-white/40 text-sm">Escreva o seu nome completo como assinatura.</p>
            </div>

            <div className="bg-[#1A1A1A] rounded-2xl p-5 border border-white/5">
              <p className="text-white/40 text-xs mb-3">Eu, <span className="text-rose-gold">{dadosProcedimentoMock.clienteNome}</span>, declaro que li e compreendi toda a informação acima e consinto livremente na realização do procedimento.</p>

              <div className="border-b-2 border-rose-gold/40 pb-2 mt-6">
                <input
                  type="text"
                  placeholder="Escreva o seu nome completo"
                  value={assinatura}
                  onChange={(e) => setAssinatura(e.target.value)}
                  className="w-full bg-transparent text-white text-lg font-playfair italic placeholder-white/20 focus:outline-none text-center"
                />
              </div>
              <p className="text-white/20 text-xs text-center mt-1">Assinatura</p>

              <p className="text-white/30 text-xs text-center mt-4">
                Data: {new Date().toLocaleDateString('pt-PT', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setEtapa('consentimento')} className="w-12 bg-white/5 text-white/60 rounded-xl flex items-center justify-center">
                <ChevronLeft size={18} />
              </button>
              <button
                onClick={submeter}
                disabled={assinatura.trim().length < 3}
                className="flex-1 bg-rose-gold text-white py-3 rounded-xl font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-rose-gold-dark transition-colors"
              >
                Submeter Consentimento
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
