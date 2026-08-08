---
title: Segurança
tags:
  - seguranca
  - rls
atualizado: 2026-08-08
fontes:
  - docs/SEGURANCA-ESTADO-2026-06.md
---

# Segurança

Resumo vivo da postura de segurança. Detalhe completo e migrações em [[fonte-seguranca-estado-2026-06]].

## `is_admin()` — a peça central
Função `public.is_admin()`: `SECURITY DEFINER`, `STABLE`, `search_path` fixo a `public`.
Verifica se o **próprio** `auth.uid()` é um admin ativo em `profiles`.

> [!danger] Regra crítica — não voltar a partir o painel
> **Todas** as políticas RLS do admin (tabelas E `storage.objects` para uploads) chamam `is_admin()`.
> Logo o role **`authenticated` TEM de ter `EXECUTE`** sobre ela. Revogar só de `anon`/`public` é seguro;
> revogar de `authenticated` parte o painel inteiro → "permission denied for function" → **403**
> em leituras, escritas e uploads. (Foi exatamente o bug de 2026-06-12, corrigido pela migração
> `grant_is_admin_execute_to_authenticated`.)

> [!note] Decisão 2026-08-08 (auditoria advisor): manter `SECURITY DEFINER`
> O advisor sinaliza `SECURITY DEFINER`, mas mantém-se por opção deliberada. O `search_path`
> está fixo em `public` e a função só revela o estado do próprio caller (se é ou não admin).
> As alternativas partiam o sistema: revogar `EXECUTE` ou passar a `SECURITY INVOKER` quebrava
> ou tornava recursivo o RLS `admin_all` (a política consulta `profiles` chamando `is_admin()`,
> que por sua vez lê `profiles`). É o portão do RLS `admin_all` em ~20 tabelas. Advisor **aceite**.

## RLS em `profiles` (self-read otimizado)
Política `profiles_self_read` passou a usar `(id = (select auth.uid()))` em vez de `auth.uid()`
direto. O `select` faz o Postgres avaliar a função de auth uma única vez (initplan) e não por
cada linha. Migração MCP `fix_profiles_self_read_initplan` (2026-08-08). O advisor
`auth_rls_initplan` deixou de aparecer.

## Anti-abuso e PII
- **Rate limiting** (`src/lib/rateLimit.ts`) em todas as rotas públicas + lockout anti-enumeração por IP.
- **Códigos de acompanhamento**: CSPRNG 12 chars (`crypto.randomInt`) — antes `Math.random` (IDOR).
- **Tokens de consentimento**: `randomBytes(24)` (192 bits).
- **Fotos de acompanhamento** (dados de saúde, Art. 9 RGPD): bucket **privado** + signed URLs;
  uploads validados (tipo/tamanho, nome gerado no servidor). Ver [[arquitetura-dados]] e [[rgpd-legal]].
- **Checkout Stripe** lê valor/dados do servidor — nunca confia no body do cliente. Ver [[integracoes]].
- **Escaping HTML** em todos os emails (anti-injeção). `src/lib/sanitize.ts`.

## Headers (next.config.mjs)
HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy,
e `X-Robots-Tag: noindex` em `/admin`, `/acompanhamento`, `/consentimento`.

## Segredos
- `.env.local` **ignorado** pelo git; único `.env*` versionado é `.env.example` (placeholders).
- Sem segredos hardcoded no código (verificado: `sk_live`, `whsec`, `sk-ant`, `service_role`).

## Migrações de segurança
**2026-06-12:** `harden_storage_and_pages_rls`, `revoke_is_admin_rpc_from_public`,
`revoke_is_admin_from_public_role`, `fix_creator_stats_security_invoker`,
`grant_is_admin_execute_to_authenticated`.
**2026-08-08:** `fix_profiles_self_read_initplan` (RLS initplan), `archive_fitpro_leftover_tables`
e `archive_fitpro_creator_stats_view` (leftover FitPro para o schema `archive`, ver [[arquitetura-dados]]).

## Estado do advisor Supabase
Sem **CRITICAL** (view `SECURITY DEFINER` corrigida; signups públicos desativados).
Auditoria 2026-08-08: `auth_rls_initplan` resolvido (acima) e o `SECURITY DEFINER` de
`is_admin()` aceite por decisão (acima). Fica o TODO manual abaixo.

> [!todo] Pendência (ação manual no painel Supabase — sem API)
> Ativar **"Leaked Password Protection"** em Authentication → Providers (Email) → Password
> strength and leaked password protection. Só disponível no plano **Pro** ou superior.
