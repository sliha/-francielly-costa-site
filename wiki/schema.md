---
title: Schema do wiki — Site Francielly Costa
tags:
  - meta
  - schema
atualizado: 2026-06-12
---

# Schema do wiki — Site Francielly Costa

> [!info] Para que serve este ficheiro
> Ensina ao Claude **como** este wiki está organizado e que fluxos seguir.
> Co-evolui: sempre que descobrirmos uma convenção melhor, atualiza-se aqui.

## O que é este projeto

Site oficial de **Francielly Costa** — estúdio de dermopigmentação avançada em Braga, Portugal
(microblading, microshading, eyeliner, micropigmentação labial, tricopigmentação, FiberBROWS).
É uma app **Next.js 14 (App Router)** com **site público** + **painel de gestão (admin)**,
marcações com pagamento Stripe, sincronização com Google Calendar, chat IA e simulador.
Estado: **em produção** na Vercel (`franciellycosta.pt`), backend **Supabase**.
Está em curso o fim da migração de Firebase → Vercel+Supabase. Ver [[migracao-firebase-supabase]].

## Camadas

- **Fontes (imutáveis):** todo o resto da pasta do projeto (`src/`, `public/`, configs, `docs/`).
  Nunca mover/renomear/reorganizar ficheiros-fonte por causa do wiki.
- **Wiki (`wiki/`):** esta pasta — markdown que o Claude escreve e mantém.
- **Schema (este ficheiro):** as convenções e fluxos.

> [!warning] Regra de ouro
> O wiki fica **por cima** das fontes. Nunca reorganizar código/assets para encaixar no wiki.

## Estrutura da pasta `wiki/`

- `index.md` — catálogo de todas as páginas (link + 1 linha), por categoria.
- `log.md` — registo cronológico append-only. Cada entrada começa com
  `## [AAAA-MM-DD] <tipo> | <título>` (`tipo` = ingest | query | lint | decisão).
- `schema.md` — este ficheiro.
- `paginas/` — páginas de entidades e conceitos (1 assunto por ficheiro, `kebab-case.md`).

## Convenções de página

- 1 assunto por ficheiro; liga assuntos relacionados com `[[nome-do-ficheiro]]` (sem extensão).
- Frontmatter YAML no topo: `title`, `tags`, `atualizado`, e `fontes` quando aplicável.
- Usa sintaxe Obsidian: `[[wikilinks]]`, callouts `> [!type]`, `==destaques==`, properties.
- O Claude escreve o wiki; o utilizador lê e dirige no Obsidian. Fontes nunca são editadas.

## Fluxos

- **Ingest:** nova fonte/decisão → cria/atualiza páginas tocadas → atualiza [[index]] →
  acrescenta entrada ao [[log]].
- **Query:** lê [[index]] → abre as páginas relevantes → responde com referências.
  Respostas valiosas (comparações, análises) são arquivadas como nova página.
- **Lint:** procura contradições, páginas órfãs, conceitos sem página, claims desatualizados;
  sugere o que investigar a seguir.

## Disciplina de tokens

- No arranque, ler só [[index]] + este [[schema]]. **Não varrer o projeto inteiro.**
- Atualizar o wiki ao **fim** de uma tarefa, não a cada micro-passo.

## Relação com a memória do Claude

Existe memória persistente em `~/.claude/projects/.../memory/` (índice em `MEMORY.md`).
A memória guarda **factos sobre o utilizador e o trabalho**; o wiki guarda **conhecimento sobre o
projeto/código**. Quando se sobrepõem, o wiki é a fonte detalhada e a memória aponta para ele.
