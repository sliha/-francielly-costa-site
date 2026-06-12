---
title: API routes
tags:
  - rotas
  - backend
  - api
atualizado: 2026-06-12
---

# API routes (backend serverless)

Mapa real das `route.ts` em `src/app/api/`. Rotas públicas têm **rate limiting** (ver [[seguranca]]).

## Marcações e agenda
- `/api/agendar` — cria marcação (resolve serviço/slot no servidor, revalida disponibilidade)
- `/api/slots` — slots disponíveis
- `/api/agendamento/criar-manual` — marcação manual (valida conflito → 409)
- `/api/agendamento/confirmar-manual`, `/mudar-estado`, `/reagendar`, `/cancelar`
- `/api/dia-bloqueado/criar`, `/apagar`
- `/api/lista-espera/notificar`

## Pagamento (Stripe)
- `/api/pagamento/checkout` — sessão de checkout (valor lido do servidor)
- `/api/pagamento/webhook` — confirma pagamento (idempotente)

## Acompanhamento (código de cliente, anti-enumeração)
- `/api/acompanhamento/[codigo]` (+ `/foto`, `/mensagem`, `/retoque`)

## Consentimentos / referências / consultas
- `/api/consentimentos/enviar-link`, `/submeter`
- `/api/referencia/meu-codigo` — devolve código real do cliente (ou mensagem neutra)
- `/api/consulta-virtual/agendar`, `/cancelar` (remove evento Google)

## IA e contacto
- `/api/chat` — chat "Sofia" (Anthropic)
- `/api/simulador` — simulador IA
- `/api/contacto`, `/api/fiberbrows-waitlist`

## Google Calendar
- `/api/google-calendar/webhook` — push do Google
- `/api/admin/google-calendar/*` — register/renew/stop watch, auto-renew, full-resync
- `/api/admin/calendar/*` — full-reconcile, resync-all, test
- `/api/health/calendar-sync`

## Admin / infra
- `/api/admin/upload-url` — signed URL para upload/leitura/delete no Storage (allowlist `media`/`acompanhamentos`)
- `/api/admin/auth/grant-claim` — claim de admin
- `/api/admin/diagnostico/stats`, `/synclog`
- `/api/admin/clean-test-data`

> [!note]
> Lógica de domínio nas libs `src/lib/*` (ver [[stack-tecnica]]). Integrações em [[integracoes]].
