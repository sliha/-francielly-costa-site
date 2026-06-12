---
title: Visão geral
tags:
  - overview
atualizado: 2026-06-12
---

# Visão geral — Site Francielly Costa

## Negócio
**Francielly Costa** é um estúdio de **dermopigmentação avançada** em Braga, Portugal.
Serviços: microblading, microshading, eyeliner permanente, micropigmentação labial,
tricopigmentação e **FiberBROWS** (técnica de destaque, "primeira certificada em Portugal").
Morada: Av. Dr. António Palha 53, 4715-091 Braga. Email: `geral@franciellycosta.com`.

## A app
Uma aplicação [[stack-tecnica|Next.js 14]] com duas grandes superfícies:

- **[[site-publico]]** — montra de serviços, galeria de antes/depois, blog, sobre,
  páginas legais, e um funil de **marcação online** com caução via Stripe.
- **[[painel-admin]]** — gestão de agenda, clientes, marcações, consentimentos (anamnese),
  galeria, certificações, blog, referências, consultas virtuais e definições.

Funcionalidades transversais: **chat IA "Sofia"** e **simulador IA** (Anthropic),
**sincronização bidirecional com Google Calendar**, **emails transacionais** (Resend),
**acompanhamento pós-procedimento** com fotos (bucket privado), e **programa de referências**.

## Estado
- **Em produção** na Vercel (`franciellycosta.pt`), deploy automático no push para `main`.
- Backend **Supabase** (Postgres 17 + Auth + Storage + RLS). Ver [[arquitetura-dados]].
- A terminar a [[migracao-firebase-supabase|migração de Firebase]] (restam ficheiros legados na raiz).
- Auditoria de segurança/RGPD/SEO/performance concluída a 2026-06-12. Ver [[seguranca]] e [[rgpd-legal]].

> [!note] Onde está o quê
> Código em `src/`; libs de domínio em `src/lib/`; doc técnico antigo em `PROJETO SITE FRAN.md`
> ([[fonte-projeto-site-fran|parcialmente desatualizado]]); estado de segurança em
> [[fonte-seguranca-estado-2026-06]].
