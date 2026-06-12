# Estado de Segurança & Migrações — Auditoria 2026-06

> Registo do endurecimento de segurança/RGPD/SEO/performance feito a **2026-06-12**
> e das correções pós-deploy. Serve de referência para fechar a sessão em segurança
> e para a próxima pessoa que mexer no projeto.
>
> Projeto Supabase: `vptyaaxzjrhsjmyrbbxm` · Repositório: `github.com/sliha/-francielly-costa-site` · Deploy: Vercel (auto em `main`)

---

## 1. Resumo do que foi feito

### Segurança (código)
- **Códigos de acompanhamento** passaram a CSPRNG de 12 chars (`crypto.randomInt`) — antes eram `Math.random` de 6 dígitos, enumeráveis (IDOR de dados de saúde/PII).
- **Tokens de consentimento** passaram a `randomBytes(24)` (192 bits).
- **Rate limiting** (`src/lib/rateLimit.ts`) em todas as rotas públicas: agendar, contacto, chat, simulador, waitlist, consulta-virtual, acompanhamento — com lockout anti-enumeração por IP.
- **Fotos de acompanhamento** (dados de saúde, Art. 9 RGPD) movidas para bucket **privado** `acompanhamentos` com signed URLs; uploads validados (tipo/tamanho, nome gerado no servidor).
- **Checkout Stripe** lê o valor/dados do servidor — nunca confia no body do cliente.
- **Escaping HTML** em todos os emails (anti-injeção/phishing).
- **Headers**: Permissions-Policy, X-Robots-Tag (admin/áreas privadas `noindex`), HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy.

### RGPD / legal
- Páginas de **Privacidade, Termos e Cookies** reescritas à stack real (Supabase, Vercel, Stripe, Resend, Google, Anthropic, Meta): subprocessadores, bases legais, prazos de retenção, dados de saúde (Art. 9), CNPD, RAL e Livro de Reclamações.
- **Consentimento de cookies granular** (analytics vs marketing) + Google Consent Mode v2.
- **Divulgação de IA** no chat (Sofia) e no simulador (foto → Anthropic, com consentimento).

### SEO (Google/Meta Ads)
- JSON-LD `BeautySalon` server-rendered (visível a crawlers); `aggregateRating` fabricado removido.
- OG image e ícones PWA gerados; sitemap dinâmico do blog; canonical por página.

### Performance
- Removido `@import` de Google Fonts render-blocking; hero LCP estático (CSS).
- `ChatWidget` em dynamic import; `next/image` no blog/galeria/instagram; ISR no blog.

### Bugs do painel admin
- Dashboard com dados reais (era 100% mock); BottomNav mobile com menu "Mais" (12 páginas estavam inacessíveis).
- Validação de conflito em marcação manual; cancelar consulta virtual remove o evento no Google Calendar.

---

## 2. Migrações Supabase aplicadas nesta auditoria

> Aplicadas via MCP no projeto `vptyaaxzjrhsjmyrbbxm`. O projeto **não versiona** as migrações
> numa pasta `supabase/migrations`, por isso ficam aqui registadas para rasto.

| Versão | Nome | O que faz |
|---|---|---|
| `20260612114025` | `harden_storage_and_pages_rls` | RLS do Storage `media` restrita a `is_admin()` (escrita); bucket privado `acompanhamentos`; RLS na tabela `pages`. |
| `20260612122150` | `revoke_is_admin_rpc_from_public` | Revoga `is_admin()` como RPC de `public`. |
| `20260612122213` | `revoke_is_admin_from_public_role` | Revoga `is_admin()` de `public`. |
| `20260612123157` | `fix_creator_stats_security_invoker` | View `creator_stats` (app fitpro) `SECURITY DEFINER` → `security_invoker` (corrige CRITICAL do advisor). |
| `20260612133735` | `grant_is_admin_execute_to_authenticated` | **Correção pós-deploy** — devolve `EXECUTE` da `is_admin()` ao role `authenticated` (mantém fora do `anon`). |

### ⚠️ Regra importante sobre `is_admin()` e RLS
A função `public.is_admin()` é `SECURITY DEFINER`, `STABLE`, `search_path` fixo a `public`, e só verifica se o **próprio** `auth.uid()` é um admin ativo em `profiles`.

**Todas** as políticas RLS do painel — tabelas (`alertas`, `galeria`, `certificacoes`, `agendamentos`, …) **e** `storage.objects` (uploads) — chamam `is_admin()`. Por isso o role `authenticated` **tem** de ter `EXECUTE` sobre ela. Revogá-la só de `anon`/`public` é seguro; revogá-la de `authenticated` **parte o painel inteiro** (erro "permission denied for function" → PostgREST devolve **403** em leituras, escritas e uploads).

---

## 3. Correções pós-deploy

1. **Galeria parecia "sem mídia"** (commit `5f09c8a`). A `GaleriaPage` abria sempre no separador `FiberBROWS`, mas a tabela `galeria` só tem fotos de microblading/microshading/eyeliner/labial → a galeria aparecia vazia, embora as fotos estivessem todas no Storage (HTTP 200). Fix: só mostra separadores de categorias com mídia e abre no primeiro com fotos. **Nenhuma mídia foi perdida.**

2. **403 no painel admin / upload de fotos** (migração `grant_is_admin_execute_to_authenticated`). Ver regra na secção 2. Correção só na BD — sem deploy.

---

## 4. Verificações de segurança (estado de fecho)

- `.env.local` **ignorado** pelo git; único `.env*` versionado é o `.env.example` (placeholders).
- **Zero segredos** hardcoded no código (`sk_live`, `whsec`, `sk-ant`, `service_role`).
- Storage `media` público com leitura pública intacta; `acompanhamentos` privado.
- RLS: `public_read` nas tabelas públicas (galeria/pages/settings/certificacoes/blog_posts); `is_admin()` no resto.
- Advisor Supabase **sem CRITICAL** (a view `SECURITY DEFINER` foi corrigida).
- Signups públicos **desativados** no Supabase Auth.

---

## 5. PENDÊNCIA — ação manual no painel Supabase (não há API)

- **Ativar "Leaked Password Protection"** em **Authentication → Sign In / Providers**. É a única recomendação do advisor que não consigo aplicar por ferramenta.
- Nota: as tabelas `leads`/`creators`/`creator_stats` e o bucket `fitpro-assets` pertencem a **outra app (fitpro)** no mesmo projeto Supabase — não mexer; idealmente separar em projetos distintos.
