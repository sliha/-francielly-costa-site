# Sincronização Bidirecional com Google Calendar

Este documento explica como funciona a sincronização entre o site e o Google Calendar da Francielly (`masterfranciellycosta@gmail.com`), e como operá-la.

## Visão geral

```
Site ──────────────► Google Calendar    (Fase 1 — escritas)
Site ◄───── push ──── Google Calendar   (Fase 2 — leitura via webhook)
```

- **Site → Google**: cada criação/atualização/cancelamento de marcação ou bloqueio em `/admin/agenda` propaga-se ao Google Calendar.
- **Google → Site**: o Google envia uma notificação HTTPS (push) sempre que algo muda no calendário; o site puxa as alterações via `events.list` com `syncToken` e atualiza o Firestore.

## Componentes

| Peça | Onde | O que faz |
|---|---|---|
| Service Account JSON | Secret Manager: `GOOGLE_SERVICE_ACCOUNT_KEY` | Autentica chamadas Calendar API |
| Calendar ID | `apphosting.yaml`: `GOOGLE_CALENDAR_ID` | Calendário-alvo |
| Webhook secret | Secret Manager: `GOOGLE_CALENDAR_WEBHOOK_SECRET` | Valida HMAC do push token do Google |
| Cron secret | Secret Manager: `CRON_SECRET` | Autentica chamadas do cron externo de renovação |
| Coleção sync | Firestore `settings/googleCalendarSync` | Guarda `channelId`, `channelResourceId`, `channelExpiration`, `syncToken`, `lastSyncAt` |
| Lib | `src/lib/googleCalendarSync.ts` | register/stop/renew/process |
| Webhook | `POST /api/google-calendar/webhook` | Recebe push da Google |
| Endpoints admin | `/api/admin/google-calendar/{register-watch,renew-watch,stop-watch,full-resync,auto-renew}` | Gestão manual + cron |

## Setup inicial (uma vez)

### 1. Gerar os 2 segredos

```bash
openssl rand -hex 32   # GOOGLE_CALENDAR_WEBHOOK_SECRET
openssl rand -hex 32   # CRON_SECRET
```

Guarda ambos num cofre seguro (1Password, Bitwarden).

### 2. Adicionar ao Secret Manager via Firebase CLI

```bash
firebase apphosting:secrets:set GOOGLE_CALENDAR_WEBHOOK_SECRET
# Cola o primeiro hex quando pedir.

firebase apphosting:secrets:set CRON_SECRET
# Cola o segundo hex quando pedir.

firebase apphosting:secrets:grantaccess GOOGLE_CALENDAR_WEBHOOK_SECRET --backend francielly-costa
firebase apphosting:secrets:grantaccess CRON_SECRET --backend francielly-costa
```

Alternativa GUI: Firebase Console → Build → App Hosting → backend → Secrets.

### 3. Re-deploy

O `apphosting.yaml` já referencia ambos os secrets. Após o `firebase apphosting:secrets:set`, basta um `git push` (ou aguardar pelo próximo) para que o App Hosting injete-os no runtime.

### 4. Registar o canal push

Faz login em `https://www.franciellycosta.pt/admin/login`, vai a **Definições** → secção **"Sincronização Google Calendar (Bidirecional)"** → clica **"Iniciar Sincronização Bidirecional"**.

O sistema:
1. Gera um `channelId` (UUID).
2. Chama `events.watch` com `address=https://www.franciellycosta.pt/api/google-calendar/webhook`.
3. Faz um full sync inicial (lê tudo o que já existe no calendário) e guarda o `nextSyncToken`.
4. Grava `channelId`, `channelResourceId`, `channelExpiration` em `settings/googleCalendarSync`.

Aparece "🟢 Canal ativo (expira em 7 dias)".

### 5. Configurar cron externo de renovação

Os canais do Google Calendar expiram em **no máximo 7 dias**. Para renovar automaticamente, configura um cron job externo:

#### Opção A — cron-job.org (grátis)

1. Cria conta em https://cron-job.org
2. **New cronjob**:
   - Title: `FC Calendar Auto-renew`
   - URL: `https://www.franciellycosta.pt/api/admin/google-calendar/auto-renew`
   - Method: `POST`
   - Schedule: **Every day at 03:00 UTC**
   - Advanced → Headers:
     - `X-Cron-Secret: <valor do CRON_SECRET>`
   - Save

3. **Test now** → deve devolver `{ ok: true, renewed: false, hoursLeft: ... }` se ainda faltarem >48h.

#### Opção B — EasyCron / GitHub Actions

Mesmo princípio: chamar o endpoint diariamente com o header `X-Cron-Secret`.

#### Lógica do endpoint

- Lê `channelExpiration` em `settings/googleCalendarSync`.
- Se faltarem **menos de 48h** → renova (stop + register).
- Caso contrário → no-op.

Assim o cron pode correr todos os dias mas só renova quando necessário.

## Como funciona uma alteração

### Cenário A — Marcação criada no site

```
Cliente paga via Stripe
  → webhook /api/pagamento/webhook
  → cria evento Google via createCalendarEvent()
  → Firestore: agendamentos.{id}.googleEventId + lastGoogleSyncAt
  → Google envia push ao nosso webhook (eco)
  → processCalendarChanges() lê o evento
  → applyEventToFirestore() compara event.updated vs lastGoogleSyncAt
  → diff < 5s → IGNORA (eco do nosso próprio write)
```

### Cenário B — Evento criado externamente no Google

```
Francielly abre Google Calendar no telemóvel → cria "Almoço médico" 14h
  → Google envia push
  → processCalendarChanges() lê o evento via events.list(syncToken)
  → applyEventToFirestore():
      - Sem fcAgendamentoId / fcType
      - Cria doc em diasBloqueados com id = ext_<sha256(eventId)[0..20]>
      - { data, motivo, bloqueioTotal, horasBloqueadas, origem: 'google-externo', googleEventId }
  → /admin/agenda mostra dia com ícone 🌐 cinzento
  → /api/slots devolve esse horário como indisponível
```

### Cenário C — Francielly arrasta um evento nosso no Google

```
Evento "[CONFIRMADO] Francielly Costa — Ana — Microblading" arrastado de 10h para 16h
  → push
  → processCalendarChanges() vê event com fcType=agendamento, fcAgendamentoId
  → applyEventToFirestore() atualiza agendamentos.{id}.horaInicio = '16:00' (+ horaFim)
  → grava lastGoogleSyncAt
```

### Cenário D — Francielly apaga um evento externo no Google

```
"Almoço médico" apagado
  → push (event.status === 'cancelled')
  → applyEventToFirestore() encontra extId em diasBloqueados → apaga doc
  → slot volta a estar livre
```

## Operação diária

| Tarefa | Onde |
|---|---|
| Ver estado do canal | `/admin/definicoes` → "Sincronização Google Calendar (Bidirecional)" |
| Forçar re-sync se algo parecer fora de sincronia | botão "Forçar Re-sync Completo" |
| Parar sincronização temporariamente | botão "Parar Sincronização" |
| Renovar manualmente | botão "Renovar Canal" |

## Troubleshooting

### "🔴 Canal não registado" mesmo depois de clicar "Iniciar Sincronização Bidirecional"

1. Verificar logs do Firebase App Hosting (`POST /api/admin/google-calendar/register-watch`).
2. Possíveis erros:
   - `GOOGLE_SERVICE_ACCOUNT_KEY ausente` — secret não está acessível ao backend (grant-access).
   - `Push URL not authorized` — o domínio `www.franciellycosta.pt` precisa de estar verificado em [Google Search Console](https://search.google.com/search-console) E o **mesmo project Google Cloud** da service account precisa de o ter listado em [Domain verification](https://console.cloud.google.com/apis/credentials/domainverification). Ver "Domain verification" abaixo.

### Push do Google chega mas devolve 401 ("Token inválido")

- `GOOGLE_CALENDAR_WEBHOOK_SECRET` está diferente entre quando se registou o canal e o webhook. Cenário típico: o secret foi rodado no Secret Manager mas o canal não foi re-registado.
- **Solução**: clicar "Parar Sincronização" → "Iniciar Sincronização Bidirecional".

### Push chega mas devolve 410 ("Canal desconhecido")

- O canal foi registado mas a doc Firestore `settings/googleCalendarSync` foi apagada / o `channelId` foi sobrescrito.
- **Solução**: idem — Parar + Iniciar.

### Slot continua disponível para o cliente mesmo com evento no Google

1. Verificar última sincronização em `/admin/definicoes`.
2. Clicar "Forçar Re-sync Completo".
3. Se persistir: verificar que o canal está ativo (não expirado). Cron de renovação a funcionar?

### Loop infinito (vários writes consecutivos)

- O guard `lastGoogleSyncAt + 5s` impede que ecos sejam reaplicados.
- Se aparecerem loops, verificar que **todas** as escritas Site → Google estão a chamar `atualizarEstadoAgendamento(..., { lastGoogleSyncAt: serverTimestamp() })`.

### Cron auto-renew devolve 401

- Header `X-Cron-Secret` em falta ou diferente do `CRON_SECRET` no Secret Manager.

## Domain verification (Google requisito)

Para que `events.watch` aceite uma `address`, esse domínio tem de estar **verificado** no Google Cloud Console **a partir da conta dona da service account** (não da Francielly):

1. Abrir [Search Console](https://search.google.com/search-console).
2. Add property → `https://www.franciellycosta.pt`.
3. Verificar via DNS TXT record OU HTML file no `/public/`.
4. Abrir [Cloud Console → APIs → Domain verification](https://console.cloud.google.com/apis/credentials/domainverification).
5. **Add domain** → `www.franciellycosta.pt`.

Sem este passo, o registo do canal falha com `Push URL not authorized`.

## Custo

- Google Calendar API: **grátis** até quotas elevadas. Push notifications não consomem quota adicional.
- cron-job.org: **grátis**.

## Limites operacionais

- Canal max **7 dias** — renovação obrigatória.
- Push pode ter **latência de alguns segundos** (~1-10s tipicamente).
- Eventos cancelados mantêm-se no histórico do Google durante um período — `processCalendarChanges` processa-os via `showDeleted: true`.

## Esquema da coleção

```ts
// Firestore: settings/googleCalendarSync
{
  syncToken: 'CN...',                  // último token incremental válido
  channelId: '<uuid>',                 // UUID do canal push atual
  channelResourceId: '<resource>',     // devolvido pela Google
  channelExpiration: 1747654321000,    // epoch ms
  channelCreatedAt: Timestamp,
  lastSyncAt: Timestamp,
  lastSyncStatus: 'ok' | 'error' | 'full-resync-needed',
  lastError: 'mensagem se houver'
}

// Firestore: diasBloqueados/ext_<hash>  (eventos externos)
{
  data: '2026-05-12',
  motivo: 'Almoço médico',
  bloqueioTotal: false,
  horasBloqueadas: ['14:00'],
  origem: 'google-externo',
  googleEventId: '<id do Google>',
  googleEventUpdated: '2026-05-11T...',
  atualizadoEm: Timestamp
}

// Firestore: agendamentos/{id} (novo campo)
{
  ...
  lastGoogleSyncAt: Timestamp          // antiloop
}
```

---

## Fase 3 — Robustez, idempotência e observabilidade

### Idempotência

Cada webhook (Stripe e Google) grava um doc em `processedEvents/{key}` ao processar:

```ts
{
  source: 'stripe' | 'google-calendar',
  processedAt: Timestamp,
  result: 'ok' | 'error',
  errorMessage?: string,
  ttlExpiresAt: Timestamp  // 30 dias
}
```

**Stripe key**: `stripe-{event.id}`.
**Google key**: `google-calendar-{event.id}-{event.updated}`.

Reentregas com `result: 'ok'` retornam 200 imediatamente sem reprocessar. Reentregas com `result: 'error'` são reprocessadas. **Onde olhar quando há suspeita de duplicação:** coleção `processedEvents` → procurar key correspondente.

### Retry com backoff exponencial

`src/lib/retry.ts` envolve todas as chamadas Google API. Padrão:

- `maxAttempts: 3`
- `initialDelayMs: 500` (cresce para 500ms → 1000ms → 2000ms + jitter)
- Retentar em: `ECONNRESET`, `ETIMEDOUT`, `ENOTFOUND`, HTTP 429, HTTP 5xx, `rateLimitExceeded`, `userRateLimitExceeded`, `backendError`, `quotaExceeded`.

Cada tentativa é logada com `console.warn` no formato `[label] tentativa N/3 falhou (erro). A retentar em Xms.` — visível no Firebase App Hosting logs.

### Observabilidade — coleção `syncLog`

Cada operação relevante grava entry em `syncLog`. Acesso UI em `/admin/diagnostico`:

```ts
{
  timestamp: Timestamp,
  operation: 'webhook_stripe' | 'webhook_google' | 'create_event' | 'update_event' |
             'delete_event' | 'block_event' | 'full_resync' | 'full_reconcile' |
             'auto_renew' | 'register_watch' | 'stop_watch',
  status: 'ok' | 'error' | 'retry' | 'skip',
  durationMs: number,
  agendamentoId?: string,
  googleEventId?: string,
  errorMessage?: string,
  metadata?: Record<string, unknown>,
  ttlExpiresAt: Timestamp  // 90 dias
}
```

**Como interpretar**:
- `status: skip` para webhook = era reentrega duplicada (idempotência funcionou).
- `status: error` com `errorMessage` = causa raiz visível.
- `durationMs > 5000` em webhooks = sinal de problema (Google API lenta ou retentativas).

### Alertas

A coleção `alertas` grava docs quando algo importante quebra:

```ts
{
  tipo: 'sync_drift' | 'channel_expired' | 'multiple_failures',
  severidade: 'critico' | 'aviso',
  mensagem: string,
  criadoEm: Timestamp,
  resolvido: boolean,
  metadata?: Record<string, unknown>
}
```

**Quando disparam:**
- `multiple_failures` — 3 falhas consecutivas no `processCalendarChanges`. Email automático para `ADMIN_EMAILS`.

**Anti-flood:** não cria 2 alertas iguais em menos de 1h.

**Como resolver:** abrir `/admin/diagnostico`, ver o motivo no `syncLog`, corrigir a causa, depois marcar `alertas/{id}.resolvido: true` no Firestore Console (ou via UI futura).

O `AdminSideNav` mostra **badge vermelho** em "Diagnóstico" enquanto houver alertas não resolvidos (real-time via `onSnapshot`).

### Reconciliação completa

Endpoint `POST /api/admin/calendar/full-reconcile` (admin OU cron secret):

**Algoritmo:**
1. Lista eventos futuros (90 dias) no Google.
2. Lista agendamentos ativos futuros no Firestore.
3. Compara cada agendamento com o evento Google correspondente — decide vencedor por `updated` timestamp.
4. Agendamentos sem evento Google → cria.
5. Eventos Google sem agendamento mas com `fcAgendamentoId` órfão → apaga do Google.
6. Eventos Google sem `fcType` → upsert em `diasBloqueados` como `origem: google-externo`.
7. Bloqueios externos cujos eventos Google já não existem → apaga.

Devolve `{ counters, erros, durationMs }`.

**Quando correr:**
- Manual via `/admin/diagnostico` → "Executar Full Reconcile".
- Cron diário (recomendado) — adicionar segundo cron-job.org chamando este endpoint com `X-Cron-Secret`.

### Health check

`GET /api/health/calendar-sync` (público, sem auth):

```json
{
  "status": "ok" | "degraded" | "down",
  "lastSyncAt": "2026-05-11T10:32:00Z",
  "minutesSinceLastSync": 4,
  "channelActive": true,
  "channelExpiresInDays": 5,
  "checks": {
    "firestore": "ok",
    "calendarApiReachable": "skipped",
    "syncTokenPresent": "ok"
  }
}
```

- **ok** → HTTP 200
- **degraded** → HTTP 200 (alerta soft: `minutesSinceLastSync > 60` ou `channelExpiresInDays < 2`)
- **down** → HTTP 503 (Firestore inacessível ou sem canal)

**Configurar UptimeRobot:**
- Tipo: HTTP(s)
- URL: `https://franciellycosta.pt/api/health/calendar-sync`
- Intervalo: 5 min
- Alerta por email quando status code ≠ 2xx.

### Troubleshooting (expandido)

| Sintoma | Investigação |
|---|---|
| Cliente pagou mas evento não apareceu no Google | 1) `processedEvents/stripe-{event.id}` existe? 2) `syncLog` filtra `operation=webhook_stripe`. 3) Stripe Dashboard → webhook entregue? 4) Se `result=error` em processedEvents → mensagem está lá. |
| Bloqueio externo que não criaste | `/admin/agenda` → lista. Origem do evento está no Google (não no site). Apagar no Google e o site reflete em ~30s. Ou usar Full Reconcile. |
| Canal expirou | `/admin/definicoes` → "Renovar Canal" (faz stop + register). Se cron auto-renew não estava ativo, configurar. |
| Eventos antigos como bloqueio externo | Limitar janela em `full-reconcile` (atualmente 90 dias). Editar `listFutureEvents(client, calendarId, 90)`. |
| Vejo `status: retry` no syncLog | Foi uma falha transitória que retentou e (potencialmente) recuperou. Se o próximo evento na mesma operation é `ok`, está tudo bem. |
| Badge vermelho no sidebar não desaparece | Marca `alertas/{id}.resolvido: true` no Firestore Console depois de resolver a causa raiz. |

### TTL: configurar no Firebase Console

Coleções com `ttlExpiresAt` (apagam automaticamente):
- `processedEvents` → 30 dias
- `syncLog` → 90 dias

**Como ativar TTL policy (uma vez):**
1. https://console.cloud.google.com/firestore/databases/-default-/ttl?project=francielly-7b35c
2. Add policy → Collection group: `processedEvents` → Field: `ttlExpiresAt` → Create.
3. Repete para `syncLog`.

Sem TTL configurado, as coleções crescem indefinidamente. Crítico para custo a longo prazo.

### Cron adicional para reconciliação diária

Em `cron-job.org`, cria segundo cronjob:
- URL: `https://franciellycosta.pt/api/admin/calendar/full-reconcile`
- Method: POST
- Schedule: diário 04:00 UTC (1h depois do auto-renew)
- Header: `X-Cron-Secret: <valor do CRON_SECRET>`
