'use client'
import { useState, useEffect, useCallback } from 'react'
import { Shield, CheckCircle2, Clock, Search, Eye, Send, Plus, X, AlertTriangle, Download } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { supabase, getAccessToken } from '@/lib/supabase/client'
import { rowToAgendamento } from '@/lib/mappers'
import type { Consentimento } from '@/lib/consentimentos'
import type { Agendamento } from '@/lib/booking'
import { PASSOS, CONSENTIMENTO, CONSENTIMENTO_VERSAO } from '@/data/anamneseFiber'

function rowToConsentimento(r: Record<string, any>): Consentimento {
  return {
    id: r.id,
    token: r.token,
    agendamentoId: r.agendamento_id ?? undefined,
    clienteNome: r.cliente_nome ?? '',
    clienteEmail: r.cliente_email ?? '',
    clienteTelefone: r.cliente_telefone ?? undefined,
    servicoNome: r.servico_nome ?? '',
    dataAgendamento: r.data_agendamento ?? '',
    estado: r.estado,
    dataLinkEnviado: r.data_link_enviado ?? null,
    dataSubmissao: r.data_submissao ?? null,
    respostas: r.respostas ?? undefined,
    assinaturaNome: r.assinatura_nome ?? undefined,
    consentimentoAceite: r.consentimento_aceite ?? undefined,
    rgpdAceite: r.rgpd_aceite ?? undefined,
    alertas: r.alertas ?? undefined,
    criadoEm: r.criado_em ?? undefined,
    tipoFormulario: r.tipo_formulario ?? undefined,
    origem: r.origem ?? undefined,
    progressoStep: r.progresso_step ?? undefined,
    autorizacaoImagem: r.autorizacao_imagem ?? undefined,
    assinaturaImagem: r.assinatura_imagem ?? undefined,
    documentoVersao: r.documento_versao ?? undefined,
    documentoHash: r.documento_hash ?? undefined,
    atualizadoEm: r.atualizado_em ?? undefined,
  }
}

function escapeHtmlAdmin(s: unknown): string {
  return String(s ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

// Gera um documento imprimível (guardável como PDF) da anamnese de uma cliente.
function gerarHtmlAnamnese(c: Consentimento): string {
  const r = (c.respostas || {}) as Record<string, unknown>
  const idsId = new Set(['nome', 'email', 'telefone', 'cc', 'nif'])
  const linhas = PASSOS
    .filter((p) => !idsId.has(p.id) && ['texto', 'textarea', 'single', 'multi'].includes(p.tipo))
    .map((p) => `<tr><td class="lbl">${escapeHtmlAdmin(p.pergunta)}</td><td>${escapeHtmlAdmin(formatarResposta(r[p.id], p.opcoes))}</td></tr>`)
    .join('')
  const li = (arr: string[]) => arr.map((i) => `<li>${escapeHtmlAdmin(i)}</li>`).join('')
  const dataSub = c.dataSubmissao ? new Date(c.dataSubmissao).toLocaleString('pt-PT') : '—'
  const alertas = (c.alertas?.length ?? 0) > 0
    ? `<div class="alert"><strong>Alertas clínicos</strong><ul>${li(c.alertas!)}</ul></div>` : ''
  const assinatura = c.assinaturaImagem
    ? `<img src="${c.assinaturaImagem}" alt="assinatura" style="max-width:280px;border:1px solid #ddd;border-radius:6px" />`
    : '<em>Sem traço registado</em>'
  return `<!doctype html><html lang="pt"><head><meta charset="utf-8"><title>Anamnese ${escapeHtmlAdmin(r.nome || c.clienteNome)}</title>
<style>
*{box-sizing:border-box}body{font-family:Georgia,'Times New Roman',serif;color:#333;max-width:760px;margin:24px auto;padding:0 24px;line-height:1.5}
h1{color:#B76E79;margin:0 0 2px;font-size:24px}h2{color:#B76E79;font-size:16px;border-bottom:1px solid #eee;padding-bottom:4px;margin-top:26px}
.sub{color:#C9A96E;margin:0 0 16px}.meta{color:#888;font-size:12px}
table{width:100%;border-collapse:collapse;font-size:13px}td{padding:6px 8px;border-bottom:1px solid #f0f0f0;vertical-align:top}td.lbl{color:#666;width:55%}
ul{margin:6px 0;padding-left:20px}.alert{background:#fff8e1;border:1px solid #ffe08a;border-radius:8px;padding:10px 14px;margin:14px 0;font-size:13px}
.card{background:#faf7f5;border-radius:8px;padding:10px 14px;margin:10px 0;font-size:13px}
@media print{.noprint{display:none}body{margin:0}}
.noprint{text-align:center;margin:22px 0}button{background:#B76E79;color:#fff;border:0;padding:10px 22px;border-radius:8px;font-size:14px;cursor:pointer}
</style></head><body>
<h1>Francielly Costa</h1><p class="sub">Ficha de Anamnese e Consentimento Informado, FiberBROWS</p>
<div class="card"><strong>${escapeHtmlAdmin(r.nome || c.clienteNome)}</strong><br>
${escapeHtmlAdmin(r.email || c.clienteEmail || '')} · ${escapeHtmlAdmin(r.telefone || c.clienteTelefone || '')}<br>
${r.cc ? 'CC/BI: ' + escapeHtmlAdmin(r.cc) : ''}${r.nif ? ' · NIF: ' + escapeHtmlAdmin(r.nif) : ''}</div>
${alertas}
<h2>Anamnese</h2><table>${linhas}</table>
<h2>Consentimento</h2>
<p>${escapeHtmlAdmin(CONSENTIMENTO.procedimento)}</p>
<p><strong>Riscos:</strong></p><ul>${li(CONSENTIMENTO.riscos)}</ul>
<p><strong>Contraindicações:</strong></p><ul>${li(CONSENTIMENTO.contraindicacoes)}</ul>
<p><strong>Cuidados pós-procedimento:</strong></p><ul>${li(CONSENTIMENTO.cuidados)}</ul>
<p><strong>Declarações:</strong></p><ul>${li(CONSENTIMENTO.declaracoes)}</ul>
<p class="meta">${escapeHtmlAdmin(CONSENTIMENTO.rgpd)}</p>
<h2>Autorização de imagem</h2><p>${escapeHtmlAdmin(AUT_IMAGEM[c.autorizacaoImagem || ''] || '—')}</p>
<h2>Assinatura</h2><p>${assinatura}</p><p><strong>${escapeHtmlAdmin(c.assinaturaNome || '')}</strong></p>
<p class="meta">Documento: ${escapeHtmlAdmin(c.documentoVersao || CONSENTIMENTO_VERSAO)} · Submetido: ${escapeHtmlAdmin(dataSub)}${c.documentoHash ? ' · Hash: ' + escapeHtmlAdmin(c.documentoHash) : ''}</p>
<div class="noprint"><button onclick="window.print()">Imprimir / Guardar como PDF</button></div>
<script>window.addEventListener('load',function(){setTimeout(function(){window.print()},400)})</script>
</body></html>`
}

function descarregarAnamnese(c: Consentimento) {
  const html = gerarHtmlAnamnese(c)
  const w = window.open('', '_blank')
  if (!w) {
    alert('Permita as janelas pop-up neste site para descarregar a ficha.')
    return
  }
  w.document.open()
  w.document.write(html)
  w.document.close()
}

export default function ConsentimentosAdminPage() {
  const [busca, setBusca] = useState('')
  const [consentimentos, setConsentimentos] = useState<Consentimento[]>([])
  const [loading, setLoading] = useState(true)
  const [enviandoId, setEnviandoId] = useState<string | null>(null)
  const [verConsentimento, setVerConsentimento] = useState<Consentimento | null>(null)
  const [showNovoModal, setShowNovoModal] = useState(false)
  const [agendamentosSemConsentimento, setAgendamentosSemConsentimento] = useState<Agendamento[]>([])
  const [carregandoAgendamentos, setCarregandoAgendamentos] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await supabase
        .from('consentimentos')
        .select('*')
        .order('criado_em', { ascending: false })
      setConsentimentos((data ?? []).map(rowToConsentimento))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const filtrados = consentimentos.filter((c) =>
    c.clienteNome.toLowerCase().includes(busca.toLowerCase()) ||
    c.servicoNome.toLowerCase().includes(busca.toLowerCase())
  )

  const submetidos = consentimentos.filter((c) => c.estado === 'submetido')
  const pendentes = consentimentos.filter((c) => c.estado !== 'submetido')
  const comAlertas = consentimentos.filter((c) => (c.alertas?.length ?? 0) > 0)

  const enviarLink = async (c: Consentimento, agendamento?: Agendamento) => {
    const id = c.id || agendamento?.id || ''
    setEnviandoId(id)
    try {
      const token = await getAccessToken()
      const res = await fetch('/api/consentimentos/enviar-link', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          agendamentoId: c.agendamentoId || agendamento?.id,
          clienteNome: c.clienteNome || agendamento?.clienteNome,
          clienteEmail: c.clienteEmail || agendamento?.clienteEmail,
          clienteTelefone: c.clienteTelefone || agendamento?.clienteTelefone,
          servicoNome: c.servicoNome || agendamento?.servicoNome,
          dataAgendamento: c.dataAgendamento || agendamento?.data,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        alert(data.error || 'Erro ao enviar link.')
        return
      }
      if (data.warning) {
        alert(`Atenção: ${data.warning}\n\nLink: ${data.link}`)
      } else {
        alert('Link enviado por email com sucesso!')
      }
      await load()
      setShowNovoModal(false)
    } catch {
      alert('Erro de rede.')
    } finally {
      setEnviandoId(null)
    }
  }

  const abrirNovoModal = async () => {
    setShowNovoModal(true)
    setCarregandoAgendamentos(true)
    try {
      const { data } = await supabase
        .from('agendamentos')
        .select('*')
        .order('data', { ascending: false })
        .order('hora_inicio')
      const todos = (data ?? []).map(rowToAgendamento)
      const tokensEnviados = new Set(consentimentos.filter((c) => c.agendamentoId).map((c) => c.agendamentoId))
      const futuros = todos.filter((a) => {
        if (a.estado === 'cancelado' || a.estado === 'concluido') return false
        if (tokensEnviados.has(a.id)) return false
        try {
          return parseISO(a.data) >= new Date(new Date().setHours(0, 0, 0, 0))
        } catch {
          return false
        }
      })
      setAgendamentosSemConsentimento(futuros)
    } finally {
      setCarregandoAgendamentos(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0F0F0F] text-white">
      <div className="px-4 pt-6 pb-4 md:px-8 md:pt-8 flex items-center justify-between">
        <div>
          <h1 className="text-white text-2xl font-playfair font-semibold">Consentimentos</h1>
          <p className="text-white/40 text-sm mt-0.5">Formulários de anamnese e consentimento informado</p>
        </div>
        <button onClick={abrirNovoModal}
          className="flex items-center gap-1.5 bg-rose-gold text-white text-sm px-3 py-2 rounded-xl font-medium hover:bg-opacity-90 transition-colors">
          <Plus size={14} />
          Enviar
        </button>
      </div>

      <div className="px-4 md:px-8 pb-8 space-y-4">
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-[#1A1A1A] rounded-2xl p-4 border border-white/5 text-center">
            <p className="text-2xl font-bold text-emerald-400">{submetidos.length}</p>
            <p className="text-white/40 text-xs mt-1">Submetidos</p>
          </div>
          <div className="bg-[#1A1A1A] rounded-2xl p-4 border border-white/5 text-center">
            <p className="text-2xl font-bold text-amber-400">{pendentes.length}</p>
            <p className="text-white/40 text-xs mt-1">Pendentes</p>
          </div>
          <div className="bg-[#1A1A1A] rounded-2xl p-4 border border-white/5 text-center">
            <p className="text-2xl font-bold text-red-400">{comAlertas.length}</p>
            <p className="text-white/40 text-xs mt-1">Com Alertas</p>
          </div>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-start gap-2">
          <Shield size={14} className="text-white/40 flex-shrink-0 mt-0.5" />
          <p className="text-white/40 text-xs">
            Envie o link manualmente. O cliente recebe email com o formulário e submete online.
          </p>
        </div>

        <div className="relative">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
          <input
            type="text"
            placeholder="Pesquisar cliente ou serviço..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-full bg-[#1A1A1A] border border-white/5 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-rose-gold/50 transition-colors"
          />
        </div>

        {loading ? (
          <div className="bg-[#1A1A1A] rounded-2xl p-8 text-center border border-white/5">
            <div className="w-5 h-5 border-2 border-rose-gold border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        ) : filtrados.length === 0 ? (
          <div className="bg-[#1A1A1A] rounded-2xl p-8 text-center border border-white/5">
            <Shield size={28} className="text-white/20 mx-auto mb-2" />
            <p className="text-white/40 text-sm">
              {consentimentos.length === 0 ? 'Sem consentimentos. Clica em "Enviar" para criar.' : 'Nenhum resultado.'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtrados.map((c) => {
              const dataFmt = (() => {
                try { return format(parseISO(c.dataAgendamento), "d 'de' MMM yyyy", { locale: ptBR }) }
                catch { return c.dataAgendamento }
              })()
              const temAlertas = (c.alertas?.length ?? 0) > 0
              return (
                <div key={c.id} className={`bg-[#1A1A1A] rounded-2xl border overflow-hidden ${
                  temAlertas ? 'border-amber-400/30' : 'border-white/5'
                }`}>
                  <div className="p-4">
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                        c.estado === 'submetido' ? 'bg-emerald-400/10' : c.estado === 'rascunho' ? 'bg-sky-400/10' : 'bg-amber-400/10'
                      }`}>
                        {c.estado === 'submetido'
                          ? <CheckCircle2 size={20} className="text-emerald-400" />
                          : <Clock size={20} className={c.estado === 'rascunho' ? 'text-sky-400' : 'text-amber-400'} />}
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="text-white font-medium text-sm">{c.clienteNome}</p>
                        <p className="text-white/40 text-xs">{c.servicoNome} · {dataFmt}</p>
                        {temAlertas && (
                          <div className="mt-2 bg-amber-400/10 border border-amber-400/20 rounded-lg px-2 py-1.5 space-y-0.5">
                            {c.alertas!.map((a, i) => (
                              <p key={i} className="text-amber-400 text-xs flex items-start gap-1">
                                <AlertTriangle size={10} className="flex-shrink-0 mt-0.5" />{a}
                              </p>
                            ))}
                          </div>
                        )}
                      </div>

                      <span className={`text-xs px-2.5 py-1 rounded-full flex-shrink-0 ${
                        c.estado === 'submetido' ? 'bg-emerald-400/10 text-emerald-400'
                          : c.estado === 'rascunho' ? 'bg-sky-400/10 text-sky-400'
                          : 'bg-amber-400/10 text-amber-400'
                      }`}>
                        {c.estado === 'submetido' ? 'Submetido' : c.estado === 'rascunho' ? 'Em curso' : 'Pendente'}
                      </span>
                    </div>

                    <div className="flex gap-2 mt-3">
                      {c.estado === 'submetido' ? (
                        <button onClick={() => setVerConsentimento(c)}
                          className="flex-1 flex items-center justify-center gap-1.5 text-xs bg-white/5 text-white/70 hover:bg-white/10 rounded-lg py-1.5 transition-colors">
                          <Eye size={12} />Ver Formulário
                        </button>
                      ) : c.estado === 'rascunho' ? (
                        <button onClick={() => setVerConsentimento(c)}
                          className="flex-1 flex items-center justify-center gap-1.5 text-xs bg-sky-400/10 text-sky-400 hover:bg-sky-400/20 rounded-lg py-1.5 transition-colors">
                          <Eye size={12} />Ver progresso
                        </button>
                      ) : (
                        <button onClick={() => enviarLink(c)} disabled={enviandoId === c.id}
                          className="flex-1 flex items-center justify-center gap-1.5 text-xs bg-rose-gold/10 text-rose-gold hover:bg-rose-gold/20 rounded-lg py-1.5 transition-colors font-medium disabled:opacity-50">
                          <Send size={12} />
                          {enviandoId === c.id ? 'A enviar...' : 'Reenviar Link'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Modal: ver formulário submetido */}
      {verConsentimento && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-[#1A1A1A] rounded-2xl border border-white/10 p-5 w-full max-w-lg max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-semibold flex items-center gap-2">
                <Shield size={16} className="text-rose-gold" />
                {verConsentimento.estado === 'submetido' ? 'Formulário Submetido' : 'Ficha em curso'}
              </h3>
              <div className="flex items-center gap-2">
                {verConsentimento.estado === 'submetido' && (
                  <button onClick={() => descarregarAnamnese(verConsentimento)}
                    className="flex items-center gap-1.5 text-xs bg-rose-gold/15 text-rose-gold hover:bg-rose-gold/25 rounded-lg px-3 py-1.5 font-medium">
                    <Download size={13} /> Descarregar
                  </button>
                )}
                <button onClick={() => setVerConsentimento(null)}
                  className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center hover:bg-white/10">
                  <X size={14} className="text-white/60" />
                </button>
              </div>
            </div>
            <FormDetails c={verConsentimento} />
          </div>
        </div>
      )}

      {/* Modal: novo link */}
      {showNovoModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-[#1A1A1A] rounded-2xl border border-white/10 p-5 w-full max-w-md max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-semibold">Enviar Consentimento</h3>
              <button onClick={() => setShowNovoModal(false)}
                className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center hover:bg-white/10">
                <X size={14} className="text-white/60" />
              </button>
            </div>

            {carregandoAgendamentos ? (
              <div className="text-center py-6">
                <div className="w-5 h-5 border-2 border-rose-gold border-t-transparent rounded-full animate-spin mx-auto" />
              </div>
            ) : agendamentosSemConsentimento.length === 0 ? (
              <p className="text-white/40 text-sm text-center py-6">
                Não existem agendamentos futuros sem consentimento.
              </p>
            ) : (
              <div className="space-y-2">
                <p className="text-white/40 text-xs mb-2">Seleciona um agendamento futuro:</p>
                {agendamentosSemConsentimento.map((a) => (
                  <button key={a.id} onClick={() => {
                    enviarLink({
                      token: '',
                      clienteNome: a.clienteNome,
                      clienteEmail: a.clienteEmail,
                      clienteTelefone: a.clienteTelefone,
                      servicoNome: a.servicoNome,
                      dataAgendamento: a.data,
                      agendamentoId: a.id,
                      estado: 'pendente',
                    } as Consentimento, a)
                  }}
                    disabled={enviandoId === a.id}
                    className="w-full text-left bg-white/5 hover:bg-white/10 rounded-xl p-3 transition-colors disabled:opacity-50">
                    <p className="text-white text-sm font-medium">{a.clienteNome}</p>
                    <p className="text-white/40 text-xs mt-0.5">
                      {a.servicoNome} · {(() => {
                        try { return format(parseISO(a.data), "d MMM", { locale: ptBR }) } catch { return a.data }
                      })()} · {a.horaInicio}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

const AUT_IMAGEM: Record<string, string> = {
  local: 'Apenas o local do procedimento',
  rosto: 'Rosto inteiro',
  nao: 'Não autorizado',
}

function formatarResposta(valor: unknown, opcoes?: { valor: string; label: string }[]): string {
  if (valor == null || valor === '') return '—'
  if (Array.isArray(valor)) {
    if (valor.length === 0) return '—'
    return valor
      .map((v) => opcoes?.find((o) => o.valor === v)?.label || String(v))
      .join(', ')
  }
  if (opcoes) return opcoes.find((o) => o.valor === valor)?.label || String(valor)
  return String(valor)
}

function FormDetailsFiber({ c }: { c: Consentimento }) {
  const r = (c.respostas || {}) as Record<string, unknown>
  const idsIdentificacao = new Set(['nome', 'email', 'telefone', 'cc', 'nif'])
  const passosResp = PASSOS.filter(
    (p) => !idsIdentificacao.has(p.id) && ['texto', 'textarea', 'single', 'multi'].includes(p.tipo),
  )

  return (
    <div className="space-y-3 text-sm">
      <div className="bg-white/5 rounded-xl p-3">
        <p className="text-white/40 text-xs mb-1">Cliente</p>
        <p className="text-white">{(r.nome as string) || c.clienteNome}</p>
        <p className="text-white/60 text-xs">{(r.email as string) || c.clienteEmail}</p>
        <p className="text-white/60 text-xs">{(r.telefone as string) || c.clienteTelefone || ''}</p>
        <div className="flex gap-4 mt-1">
          {r.cc ? <p className="text-white/50 text-xs">CC/BI: {r.cc as string}</p> : null}
          {r.nif ? <p className="text-white/50 text-xs">NIF: {r.nif as string}</p> : null}
        </div>
      </div>

      {(c.alertas?.length ?? 0) > 0 && (
        <div className="bg-amber-400/10 border border-amber-400/20 rounded-xl p-3">
          <p className="text-amber-400 text-xs uppercase tracking-wider mb-2">Alertas clínicos</p>
          {c.alertas!.map((a, i) => (
            <p key={i} className="text-amber-300 text-xs flex items-start gap-1.5 py-0.5">
              <AlertTriangle size={11} className="flex-shrink-0 mt-0.5" />{a}
            </p>
          ))}
        </div>
      )}

      <div className="bg-white/5 rounded-xl p-3 space-y-2.5">
        <p className="text-white/40 text-xs uppercase tracking-wider mb-1">Anamnese</p>
        {passosResp.map((p) => (
          <Item key={p.id} label={p.pergunta} value={formatarResposta(r[p.id], p.opcoes)} />
        ))}
      </div>

      <div className="bg-white/5 rounded-xl p-3">
        <p className="text-white/40 text-xs mb-1">Autorização de imagem</p>
        <p className="text-white">{AUT_IMAGEM[c.autorizacaoImagem || ''] || '—'}</p>
      </div>

      <div className="bg-white/5 rounded-xl p-3">
        <p className="text-white/40 text-xs mb-2">Assinatura</p>
        {c.assinaturaImagem ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={c.assinaturaImagem} alt="Assinatura" className="bg-white rounded-lg w-full max-w-[260px] border border-white/10" />
        ) : (
          <p className="text-white/40 text-xs">Sem traço registado.</p>
        )}
        <p className="text-white italic mt-2">{c.assinaturaNome || '—'}</p>
        {c.estado === 'submetido' && (
          <p className="text-emerald-400 text-xs mt-1">✓ Consentimento e RGPD aceites</p>
        )}
      </div>

      {c.estado === 'submetido' && (
        <div className="bg-white/5 rounded-xl p-3 space-y-1">
          <p className="text-white/40 text-xs uppercase tracking-wider mb-1">Prova / integridade</p>
          <Item label="Documento" value={c.documentoVersao || '—'} />
          <Item label="Submetido em" value={c.dataSubmissao ? new Date(c.dataSubmissao).toLocaleString('pt-PT') : '—'} />
          {c.documentoHash && <Item label="Hash SHA-256" value={c.documentoHash} />}
        </div>
      )}
    </div>
  )
}

function FormDetails({ c }: { c: Consentimento }) {
  if (c.tipoFormulario === 'fiber') return <FormDetailsFiber c={c} />

  const r = c.respostas || {}
  return (
    <div className="space-y-3 text-sm">
      <div className="bg-white/5 rounded-xl p-3">
        <p className="text-white/40 text-xs mb-1">Cliente</p>
        <p className="text-white">{c.clienteNome}</p>
        <p className="text-white/60 text-xs">{c.clienteEmail}</p>
      </div>
      <div className="bg-white/5 rounded-xl p-3">
        <p className="text-white/40 text-xs mb-1">Serviço · Data</p>
        <p className="text-white">{c.servicoNome}</p>
        <p className="text-white/60 text-xs">{c.dataAgendamento}</p>
      </div>

      <div className="bg-white/5 rounded-xl p-3 space-y-2">
        <p className="text-white/40 text-xs uppercase tracking-wider mb-1">Anamnese</p>
        <Item label="Alergias" value={r.alergias || '—'} />
        <Item label="Medicação" value={r.medicacao || '—'} />
        <ItemBool label="Grávida ou amamenta" value={r.gravidaOuAmamenta} />
        <ItemBool label="Doenças cardiovasculares" value={r.doencasCardiovasculares} />
        <ItemBool label="Problemas de coagulação" value={r.problemasCoagulacao} />
        <ItemBool label="Diabetes" value={r.diabetes} />
        <ItemBool label="Tendência a queloides" value={r.queloides} />
        <ItemBool label="Procedimento anterior" value={r.procedimentoAnterior} />
        {r.notasAdicionais && <Item label="Notas" value={r.notasAdicionais} />}
      </div>

      {(c.alertas?.length ?? 0) > 0 && (
        <div className="bg-amber-400/10 border border-amber-400/20 rounded-xl p-3">
          <p className="text-amber-400 text-xs uppercase tracking-wider mb-2">Alertas</p>
          {c.alertas!.map((a, i) => (
            <p key={i} className="text-amber-300 text-xs flex items-start gap-1.5 py-0.5">
              <AlertTriangle size={11} className="flex-shrink-0 mt-0.5" />{a}
            </p>
          ))}
        </div>
      )}

      <div className="bg-white/5 rounded-xl p-3">
        <p className="text-white/40 text-xs mb-1">Assinatura</p>
        <p className="text-white italic">{c.assinaturaNome || '—'}</p>
        <p className="text-emerald-400 text-xs mt-1">✓ Termos e RGPD aceites</p>
      </div>
    </div>
  )
}

function Item({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-white/40 text-xs">{label}</p>
      <p className="text-white text-sm break-words">{value}</p>
    </div>
  )
}

function ItemBool({ label, value }: { label: string; value: boolean | undefined }) {
  return (
    <div className="flex items-center justify-between">
      <p className="text-white/60 text-xs">{label}</p>
      <span className={`text-xs font-medium ${value ? 'text-amber-400' : 'text-white/40'}`}>
        {value === true ? 'Sim' : value === false ? 'Não' : '—'}
      </span>
    </div>
  )
}
