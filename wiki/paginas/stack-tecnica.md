---
title: Stack técnica
tags:
  - arquitetura
  - stack
atualizado: 2026-06-12
---

# Stack técnica

## Frontend / framework
- **Next.js 14.2.5** (App Router), **React 18**, **TypeScript**.
- **Tailwind CSS** (`tailwind.config.ts`) + **Framer Motion** (animações).
- `lucide-react` (ícones). `optimizePackageImports` para `lucide-react` e `framer-motion`.
- Fontes: Playfair (display) + Inter (texto). LCP do hero estático em CSS (ver [[seo-analytics]]).

## Backend / dados
- **Supabase** (projeto `vptyaaxzjrhsjmyrbbxm`): Postgres 17, Auth, Storage, RLS.
  Cliente browser em `src/lib/supabase/client.ts`; admin (service_role) em `src/lib/supabase/admin.ts`.
- Detalhe das tabelas, RLS e buckets em [[arquitetura-dados]].

## Deploy / infra
- **Vercel** — deploy automático no push para `main`. Configuração em `next.config.mjs` e `vercel.json`.
- Domínio `franciellycosta.pt` (redireciona `www` → apex).
- Cron/agendamentos: renovação do watch do Google Calendar, etc. (rotas em [[api-rotas]]).

## Integrações externas
Ver [[integracoes]]: **Stripe** (checkout + webhook), **Resend** (emails), **Google Calendar**
(sync bidirecional), **Anthropic** (chat Sofia + simulador), **Gemini**, **Meta Pixel** + **Google Analytics/Ads**.

## Bibliotecas de domínio (`src/lib/`)
| Lib | Responsabilidade |
|---|---|
| `booking.ts`, `slots`(API) | marcações e disponibilidade |
| `acompanhamentos.ts` | acompanhamento pós-procedimento (fotos/mensagens) |
| `consentimentos.ts` | termos de consentimento + anamnese |
| `referencias.ts` | programa de referências |
| `consultasVirtuais.ts` | consultas virtuais |
| `googleCalendar.ts`, `googleCalendarSync.ts`, `syncLog.ts` | integração Calendar |
| `email.ts` | emails transacionais (Resend) |
| `rateLimit.ts`, `sanitize.ts`, `consent.ts`, `idempotency.ts`, `retry.ts` | infra de segurança/robustez |
| `upload.ts` | upload para Storage via signed URLs |
| `blog.ts`, `alertas.ts`, `useServicosPrecos.ts` | conteúdo e dados de apoio |

## Legado (a remover)
`firebase.json`, `firestore.rules`, `storage.rules`, `apphosting.yaml`, `dataconnect/`, `_migration/`
são remanescentes da fase Firebase. Ver [[migracao-firebase-supabase]].
