---
title: Arquitetura de dados
tags:
  - arquitetura
  - supabase
  - dados
atualizado: 2026-08-08
---

# Arquitetura de dados (Supabase)

Projeto Supabase `vptyaaxzjrhsjmyrbbxm` — Postgres 17 com **RLS ativa em todas as tabelas**.

## Tabelas (schema `public`)

| Tabela | Conteúdo | Leitura pública? |
|---|---|---|
| `agendamentos` | marcações | não (só admin) |
| `clientes` | clientes + `codigo_referencia` | não |
| `consentimentos` | termo + anamnese (dados de saúde) | não |
| `consultas_virtuais` | pedidos de consulta virtual | não |
| `contactos` | mensagens do formulário de contacto | não |
| `acompanhamentos`, `acompanhamento_fotos`, `acompanhamento_mensagens` | acompanhamento pós-procedimento | não |
| `referencias` | programa de referências | não |
| `dias_bloqueados` | dias sem marcações | não |
| `lista_espera`, `fiberbrows_waitlist` | listas de espera | não |
| `alertas` | alertas do painel (anamnese de risco, etc.) | não |
| `settings` | config do negócio (`servicos`, `homepage-about`, `negocio`, `googleCalendarSync`) | **sim** (exceto `googleCalendarSync`) |
| `galeria` | media de antes/depois (ver [[galeria]]) | **sim** (`ativa = true`) |
| `certificacoes` | certificados | **sim** |
| `blog_posts` | artigos do blog | **sim** (`published = true`) |
| `profiles` | perfis admin (`is_active`) — base do `is_admin()` | self-read (otimizado, ver [[seguranca]]) |
| `processed_events`, `sync_log` | idempotência e log de sync | não |

> [!warning] Leftover de OUTRA app (FitPro) no mesmo projeto
> `creators`, `leads` e `pages` eram leftover do projeto **FitPro** (landing "isco"/Treino 7 dias):
> 0 uso no código deste site, sem FKs. Em **2026-08-08** foram movidas de `public` para o schema
> **`archive`** (migração MCP `archive_fitpro_leftover_tables`). Saíram da API pública, dados
> preservados. Reversível: `ALTER TABLE archive.<t> SET SCHEMA public`. DROP definitivo em aberto.
> A view `creator_stats` também foi para `archive` no mesmo dia (migração MCP
> `archive_fitpro_creator_stats_view`). Já só o bucket `fitpro-assets` continua a pertencer à
> outra app. **Não mexer.**

## RLS — padrão
- Tabelas privadas: política `admin_all` `FOR ALL TO authenticated USING (is_admin())`.
- Tabelas públicas: política `public_read FOR SELECT TO anon, authenticated` com condição
  (`true`, `ativa = true`, `published = true`, etc.).
- `is_admin()` é central — ver a regra crítica em [[seguranca]].

## Storage (buckets)
| Bucket | Público | Uso |
|---|---|---|
| `media` | **sim** | galeria, fotos de serviços, sobre, capas de blog, certificações (31 ficheiros) |
| `acompanhamentos` | **não** (privado) | fotos de acompanhamento (dados de saúde) — leitura via signed URLs |
| `fitpro-assets` | sim | **outra app** — não mexer |

- Escrita no Storage restrita a `is_admin()` (políticas `media_admin_*`, `acomp_admin_*`).
- Upload feito por signed URL pedido a `/api/admin/upload-url` (ver [[api-rotas]] e `src/lib/upload.ts`).

## Migrações
Aplicadas via MCP (não versionadas em `supabase/migrations`). As 5 de 2026-06-12 estão
listadas em [[fonte-seguranca-estado-2026-06]] e resumidas em [[seguranca]].
2026-08-08 (auditoria BD): `fix_profiles_self_read_initplan` (RLS initplan em `profiles`),
`archive_fitpro_leftover_tables` e `archive_fitpro_creator_stats_view` (leftover FitPro movido
para o schema `archive`). Ver [[seguranca]] e [[log]].
