---
title: Painel admin — rotas
tags:
  - rotas
  - admin
atualizado: 2026-06-12
---

# Painel admin — rotas e funções

Área de gestão sob `/admin` (autenticada via Supabase Auth; acesso gerido por `is_admin()` — ver [[seguranca]]).
Todas as páginas são `noindex`.

## Rotas (`src/app/admin/`)
- `/admin` — **dashboard** com dados reais (era mock antes de 2026-06-12)
- `/admin/login` — entrada
- `/admin/agenda` e `/admin/agenda/nova` — agenda e marcação manual
- `/admin/clientes` — clientes
- `/admin/consentimentos` — termos/anamnese; alertas de risco
- `/admin/consultas-virtuais` — consultas virtuais
- `/admin/contactos` — mensagens de contacto
- `/admin/acompanhamento` — acompanhamento pós-procedimento (fotos/mensagens)
- `/admin/galeria` — gerir galeria (ver [[galeria]])
- `/admin/certificacoes` — certificados
- `/admin/blog` — artigos
- `/admin/servicos` — serviços e preços (`settings.servicos`)
- `/admin/referencias` — programa de referências
- `/admin/lista-espera` e `/admin/fiberbrows-waitlist` — listas de espera
- `/admin/relatorio` — relatórios
- `/admin/definicoes` — definições do negócio (`settings.negocio`, about, etc.)
- `/admin/diagnostico` — diagnóstico (stats, synclog do Google Calendar)

## Navegação mobile
- `BottomNav` com 4 tabs + folha "Mais" que expõe 13 páginas antes inacessíveis (com badge de alerta).

## Backend
- API admin em `/api/admin/*` e operações de domínio — ver [[api-rotas]].
- Uploads via signed URL (`/api/admin/upload-url` + `src/lib/upload.ts`), bucket `media`/`acompanhamentos`.

> [!danger] Se o painel der 403
> Quase sempre é a permissão `EXECUTE` da `is_admin()` para `authenticated`. Ver a regra em [[seguranca]].
