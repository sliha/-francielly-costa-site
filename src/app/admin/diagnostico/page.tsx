'use client'
import { useState, useEffect, useCallback } from 'react'
import { Activity, RefreshCw, AlertTriangle, CheckCircle2, Clock, Database } from 'lucide-react'
import { auth, db } from '@/lib/firebase'
import { collection, query, where, onSnapshot } from 'firebase/firestore'

interface Stats {
  sync: {
    channelId: string | null
    channelExpiration: number | null
    lastSyncAt: number | null
    lastSyncStatus: string | null
    lastError: string | null
    syncTokenPresent: boolean
  } | null
  agendamentos: {
    ativos: number
    comGoogle: number
    semGoogle: number
    semGoogleList: Array<{
      id: string
      clienteNome: string
      servicoNome: string
      data: string
      horaInicio: string
      estado: string
    }>
  }
  bloqueios: { total: number; externos: number }
  idempotencia: { stripe30d: number; google30d: number }
  alertas: Array<{
    id: string
    tipo: string
    severidade: string
    mensagem: string
    criadoEm: number | null
  }>
}

interface SyncLogEntry {
  id: string
  timestamp: number | null
  operation: string
  status: string
  durationMs: number
  errorMessage?: string
  attempt?: number
  metadata?: Record<string, unknown>
}

const OPS = ['', 'create_event', 'update_event', 'delete_event', 'block_event', 'webhook_stripe', 'webhook_google', 'full_resync', 'full_reconcile', 'auto_renew', 'register_watch', 'stop_watch']
const STATUSES = ['', 'ok', 'error', 'retry', 'skip']

export default function DiagnosticoPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [logs, setLogs] = useState<SyncLogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [filterOp, setFilterOp] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [resyncing, setResyncing] = useState<string | null>(null)
  const [reconciling, setReconciling] = useState(false)
  const [reconcileResult, setReconcileResult] = useState<string | null>(null)
  const [alertasReal, setAlertasReal] = useState<number>(0)

  const fetchWithAuth = useCallback(async (url: string, init?: RequestInit) => {
    const user = auth?.currentUser
    if (!user) throw new Error('Não autenticado')
    const token = await user.getIdToken()
    return fetch(url, {
      ...init,
      headers: { ...(init?.headers || {}), Authorization: `Bearer ${token}` },
    })
  }, [])

  const loadStats = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetchWithAuth('/api/admin/diagnostico/stats')
      if (res.ok) setStats(await res.json())
    } finally {
      setLoading(false)
    }
  }, [fetchWithAuth])

  const loadLogs = useCallback(async () => {
    try {
      const params = new URLSearchParams({ limit: '50' })
      if (filterOp) params.set('operation', filterOp)
      if (filterStatus) params.set('status', filterStatus)
      const res = await fetchWithAuth(`/api/admin/diagnostico/synclog?${params.toString()}`)
      if (res.ok) {
        const data = await res.json()
        setLogs(data.entries || [])
      }
    } catch { /* ignored */ }
  }, [filterOp, filterStatus, fetchWithAuth])

  useEffect(() => { loadStats() }, [loadStats])
  useEffect(() => { loadLogs() }, [loadLogs])

  // Real-time alertas count
  useEffect(() => {
    if (!db) return
    const q = query(collection(db, 'alertas'), where('resolvido', '==', false))
    const unsub = onSnapshot(q, (snap) => setAlertasReal(snap.size), () => setAlertasReal(0))
    return () => unsub()
  }, [])

  const handleReconcile = async () => {
    if (!confirm('Executar reconciliação completa? Vai comparar Firestore com Google Calendar e resolver discrepâncias.')) return
    setReconciling(true)
    setReconcileResult(null)
    try {
      const res = await fetchWithAuth('/api/admin/calendar/full-reconcile', { method: 'POST' })
      const data = await res.json()
      if (!res.ok || !data.success) {
        setReconcileResult(`Erro: ${data.error || res.status}`)
      } else {
        const c = data.counters
        setReconcileResult(
          `OK em ${data.durationMs}ms — agendamentos: ${c.agendamentosTotal} (criados ${c.agendamentosCriados}, atualizados ${c.agendamentosAtualizados}, cancelados ${c.agendamentosCancelados}, órfãos ${c.agendamentosOrfaos}); bloqueios: criados ${c.bloqueiosCriados}, apagados ${c.bloqueiosApagados}; erros ${data.erros?.length || 0}`,
        )
      }
      await loadStats()
      await loadLogs()
    } catch (err) {
      setReconcileResult(`Erro: ${err instanceof Error ? err.message : String(err)}`)
    } finally {
      setReconciling(false)
    }
  }

  const handleSyncOne = async (id: string) => {
    setResyncing(id)
    try {
      await fetchWithAuth('/api/admin/calendar/full-reconcile', { method: 'POST' })
      await loadStats()
    } finally {
      setResyncing(null)
    }
  }

  const sync = stats?.sync
  const channelOk = sync?.channelId && sync.channelExpiration && sync.channelExpiration > Date.now()
  const daysLeft = sync?.channelExpiration
    ? Math.max(0, Math.floor((sync.channelExpiration - Date.now()) / (24 * 60 * 60 * 1000)))
    : 0
  const lastSyncDate = sync?.lastSyncAt ? new Date(sync.lastSyncAt) : null

  return (
    <div className="min-h-screen bg-[#0F0F0F] text-white">
      <div className="px-4 pt-5 pb-3 md:px-6 md:pt-6 flex items-center justify-between border-b border-white/5">
        <div>
          <h1 className="text-white text-xl font-playfair font-semibold flex items-center gap-2">
            <Activity size={18} className="text-rose-gold" />
            Diagnóstico
          </h1>
          <p className="text-white/40 text-xs mt-0.5">Sincronização Google Calendar + auditoria</p>
        </div>
        <button onClick={() => { loadStats(); loadLogs() }}
          className="flex items-center gap-1.5 bg-white/5 hover:bg-white/10 text-white/70 text-xs px-3 py-2 rounded-xl">
          <RefreshCw size={13} /> Refresh
        </button>
      </div>

      <div className="px-4 md:px-6 pb-8 pt-4 space-y-4">
        {/* Alertas ativos */}
        {alertasReal > 0 && stats?.alertas && stats.alertas.length > 0 && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 space-y-2">
            <h2 className="text-red-400 font-semibold text-sm flex items-center gap-2">
              <AlertTriangle size={14} /> {alertasReal} alerta(s) por resolver
            </h2>
            {stats.alertas.map((a) => (
              <div key={a.id} className="text-xs text-red-300/90">
                <span className="font-mono">[{a.severidade}]</span> {a.mensagem}
              </div>
            ))}
          </div>
        )}

        {/* Estado da Sincronização */}
        <Section title="Estado da Sincronização">
          {loading ? <Loading /> : (
            <div className="space-y-1.5 text-xs">
              <Row label="Canal Google" value={channelOk ? `🟢 ativo (expira em ${daysLeft}d)` : '🔴 inativo'} />
              <Row label="Última sync" value={lastSyncDate ? `${lastSyncDate.toLocaleString('pt-PT')} (${sync?.lastSyncStatus})` : '—'} />
              <Row label="SyncToken" value={sync?.syncTokenPresent ? '✓ presente' : '✗ em falta'} />
              {sync?.lastError && (
                <div className="text-red-400/80 text-[11px] break-words mt-1">Erro: {sync.lastError}</div>
              )}
            </div>
          )}
          <button onClick={handleReconcile} disabled={reconciling}
            className="w-full mt-3 flex items-center justify-center gap-2 bg-rose-gold/10 hover:bg-rose-gold/20 border border-rose-gold/30 text-rose-gold py-2.5 rounded-xl text-xs font-medium disabled:opacity-50">
            {reconciling && <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />}
            {reconciling ? 'A reconciliar...' : 'Executar Full Reconcile'}
          </button>
          {reconcileResult && (
            <div className="text-[11px] text-white/60 mt-2 break-words">{reconcileResult}</div>
          )}
        </Section>

        {/* Agendamentos não sincronizados */}
        <Section title={`Agendamentos sem googleEventId (${stats?.agendamentos.semGoogle || 0})`}>
          {loading ? <Loading /> : stats?.agendamentos.semGoogle === 0 ? (
            <p className="text-emerald-400/80 text-xs flex items-center gap-1.5">
              <CheckCircle2 size={12} /> Tudo sincronizado.
            </p>
          ) : (
            <ul className="space-y-1.5 text-xs">
              {stats?.agendamentos.semGoogleList.map((a) => (
                <li key={a.id} className="flex items-center justify-between gap-2 bg-white/5 rounded-lg px-2 py-1.5">
                  <div className="min-w-0 flex-1">
                    <p className="text-white/80 truncate">{a.clienteNome} — {a.servicoNome}</p>
                    <p className="text-white/40 text-[10px]">{a.data} {a.horaInicio} · {a.estado}</p>
                  </div>
                  <button onClick={() => handleSyncOne(a.id)} disabled={resyncing === a.id}
                    className="text-[11px] bg-rose-gold/20 text-rose-gold rounded-lg px-2 py-1 disabled:opacity-50">
                    {resyncing === a.id ? '...' : 'Sync'}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Section>

        {/* Contadores */}
        <Section title="Contadores">
          {loading ? <Loading /> : (
            <div className="grid grid-cols-2 gap-2 text-xs">
              <Stat label="Agendamentos ativos" value={stats?.agendamentos.ativos ?? 0} />
              <Stat label="Com googleEventId" value={stats?.agendamentos.comGoogle ?? 0} />
              <Stat label="Bloqueios totais" value={stats?.bloqueios.total ?? 0} />
              <Stat label="Bloqueios externos" value={stats?.bloqueios.externos ?? 0} />
              <Stat label="Stripe events 30d" value={stats?.idempotencia.stripe30d ?? 0} />
              <Stat label="Google events 30d" value={stats?.idempotencia.google30d ?? 0} />
            </div>
          )}
        </Section>

        {/* SyncLog */}
        <Section title="Últimas 50 entradas de syncLog">
          <div className="flex gap-2 mb-3 flex-wrap">
            <select value={filterOp} onChange={(e) => setFilterOp(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-xs text-white">
              {OPS.map((op) => <option key={op} value={op} className="bg-[#1A1A1A]">{op || 'todas operations'}</option>)}
            </select>
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-xs text-white">
              {STATUSES.map((s) => <option key={s} value={s} className="bg-[#1A1A1A]">{s || 'todos status'}</option>)}
            </select>
          </div>
          <div className="space-y-1 text-[11px] max-h-96 overflow-y-auto">
            {logs.length === 0 ? (
              <p className="text-white/40">Sem entries.</p>
            ) : (
              logs.map((l) => (
                <div key={l.id} className={`flex items-center gap-2 rounded-lg px-2 py-1 ${l.status === 'error' ? 'bg-red-500/10 text-red-300' : l.status === 'skip' ? 'bg-white/5 text-white/40' : 'bg-white/5 text-white/70'}`}>
                  <Clock size={9} className="opacity-50 flex-shrink-0" />
                  <span className="text-[10px] opacity-60 whitespace-nowrap">{l.timestamp ? new Date(l.timestamp).toLocaleTimeString('pt-PT') : '—'}</span>
                  <span className="font-mono text-[10px]">{l.operation}</span>
                  <span className={`text-[10px] ${l.status === 'error' ? 'text-red-400' : l.status === 'ok' ? 'text-emerald-400' : 'text-white/40'}`}>{l.status}</span>
                  <span className="text-[10px] opacity-50 ml-auto whitespace-nowrap">{l.durationMs}ms</span>
                  {l.errorMessage && <span className="text-[10px] opacity-70 truncate">{l.errorMessage}</span>}
                </div>
              ))
            )}
          </div>
        </Section>
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-[#1A1A1A] rounded-2xl p-4 border border-white/5 space-y-2">
      <h2 className="text-white/50 text-[11px] font-semibold uppercase tracking-wider flex items-center gap-1.5">
        <Database size={11} /> {title}
      </h2>
      {children}
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-white/40">{label}</span>
      <span className="text-white/80 text-right">{value}</span>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-white/5 rounded-lg p-2.5">
      <p className="text-white/40 text-[10px] uppercase tracking-wider">{label}</p>
      <p className="text-white font-semibold text-base">{value}</p>
    </div>
  )
}

function Loading() {
  return <div className="text-white/40 text-xs">A carregar...</div>
}
