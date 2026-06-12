---
title: Integrações externas
tags:
  - integracoes
atualizado: 2026-06-12
---

# Integrações externas

## Stripe — pagamento da caução
- `/api/pagamento/checkout` cria a sessão de checkout; **lê o agendamento e o valor do servidor**
  (`getAgendamentoPorId`), nunca confia no body do cliente. Ver [[seguranca]].
- `/api/pagamento/webhook` confirma o pagamento (idempotência via `processed_events`).
- Caução configurável em `settings.negocio` (campo `caucao`).

## Resend — emails transacionais
- `src/lib/email.ts`: confirmação de marcação (cliente + admin) e lembrete.
- Remetente `noreply@franciellycosta.com`; admin em `ADMIN_EMAIL`.
- Todo o input do cliente passa por `escapeHtml()` (anti-injeção).

## Google Calendar — sync bidirecional
- `src/lib/googleCalendar.ts` + `googleCalendarSync.ts` + `syncLog.ts`.
- Watch/push channel renovado por rotas em `/api/admin/google-calendar/*` e `/api/google-calendar/webhook`.
- Cancelar consulta virtual remove o evento no Calendar (`/api/consulta-virtual/cancelar`).
- Estado do sync em `settings.googleCalendarSync` (não exposto publicamente).

## Anthropic — IA
- **Chat "Sofia"** (`/api/chat`) e **simulador** (`/api/simulador`) — com rate limiting e limites de tamanho.
- Divulgação de uso de IA ao utilizador (ver [[rgpd-legal]]).

## Gemini
- Usado no contexto de IA (geração/apoio). Confirmar detalhe de uso ao tocar nessa zona.

## Meta / Google Ads
- Pixel + Analytics + eventos de conversão. Ver [[seo-analytics]].

> [!info] Segredos
> Todas as chaves vivem em variáveis de ambiente (Vercel + `.env.local`), nunca no repo.
> Lista de variáveis em `.env.example`. Ver [[seguranca]].
