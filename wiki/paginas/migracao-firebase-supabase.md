---
title: Migração Firebase → Vercel + Supabase
tags:
  - migracao
  - legado
atualizado: 2026-06-12
---

# Migração Firebase → Vercel + Supabase

O projeto nasceu em **Firebase** (Firestore + Storage + App Hosting) e migrou para
**Vercel + Supabase**. A app em produção já corre **inteiramente em Supabase**; restam
apenas ficheiros legados na raiz, ainda não removidos.

## Limpeza dos legados (feita 2026-06-12)
Removidos do repositório após verificação (sem deps/imports Firebase; 0 imagens vivas a apontar
para `firebasestorage` na BD ou no código; build OK):
- `firebase.json`, `firestore.rules`, `storage.rules` — regras Firebase.
- `apphosting.yaml` — Firebase App Hosting (substituído por Vercel). As 2 dicas em
  `src/lib/googleCalendar.ts` que o citavam foram atualizadas para "Environment Variables da Vercel".
- `dataconnect/` — Firebase Data Connect.
- `firebasestorage.googleapis.com` retirado dos `remotePatterns` do `next.config.mjs`.

> [!note] `_migration/` mantido localmente
> A pasta `_migration/` (export do Firestore + scripts de import) está **gitignored** (nunca foi
> commitada) — já não polui o repo. Foi **deixada no disco** como backup local; apagá-la seria
> irreversível (o git não a recupera). Decisão de a apagar fica com o utilizador.

## Já feito antes
- Dados, contas e calendário migrados; backend 100% Supabase (ver [[arquitetura-dados]]).
- `src/lib/firebaseAdmin.ts` (shim morto) **removido** na auditoria.

## Notas
- Detalhes do blueprint da migração na memória do Claude (`migracao-vercel-supabase`).
- O doc técnico `PROJETO SITE FRAN.md` ainda descreve o **Firestore** na secção 9 →
  [[fonte-projeto-site-fran|parcialmente desatualizado]].
