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

## Ficheiros/pastas legados (candidatos a limpeza)
- `firebase.json`, `firestore.rules`, `storage.rules` — regras Firebase (não usadas).
- `apphosting.yaml` — Firebase App Hosting (substituído por Vercel).
- `dataconnect/` — Firebase Data Connect.
- `_migration/` — scripts/dados da migração.
- Em `next.config.mjs`, `firebasestorage.googleapis.com` continua nos `remotePatterns` (imagens legadas).

> [!warning] Antes de apagar
> Confirmar que nenhuma imagem/asset em produção ainda aponta para `firebasestorage.googleapis.com`
> e que `_migration/` já não é necessário. Só então remover, num commit dedicado.

## Já feito
- Dados, contas e calendário migrados; backend 100% Supabase (ver [[arquitetura-dados]]).
- `src/lib/firebaseAdmin.ts` (shim morto) **removido** na auditoria.

## Notas
- Detalhes do blueprint da migração na memória do Claude (`migracao-vercel-supabase`).
- O doc técnico `PROJETO SITE FRAN.md` ainda descreve o **Firestore** na secção 9 →
  [[fonte-projeto-site-fran|parcialmente desatualizado]].
