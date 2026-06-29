---
title: Log — Site Francielly Costa
tags:
  - meta
  - log
---

# Log — Site Francielly Costa

Registo cronológico append-only. Cada entrada:
`## [AAAA-MM-DD] <tipo> | <título>`  (tipo = ingest | query | lint | decisão)

Dica: `grep "^## \[" log.md | tail -5` mostra as 5 últimas entradas.

---

## [2026-06-29] decisão | Tracking Metricool adicionado (atrás de consentimento)
Adicionado o tracker do Metricool (`tracker.metricool.com/resources/be.js`, hash
`103e1418e76e4353b021093bb6841c8`) em `src/components/Analytics.tsx`, via `next/script`
(`strategy="afterInteractive"`, `onLoad` chama `beTracker.t({hash})`). Tal como GA, Meta Pixel
e Google Ads, só monta com `consent.analytics` ativo, para manter a postura RGPD/Consent Mode.
Hash configurável por `NEXT_PUBLIC_METRICOOL_HASH`. Tipagem `window.beTracker` em
`src/types/globals.d.ts`. Verificado com type-check + build de produção. Ver [[seo-analytics]].

## [2026-06-19] decisão | Pasta Marketing criada (marca e Instagram)
Criada `Marketing/` na raiz com material de marca para divulgação e rebranding do Instagram,
a entregar ao Cowork. Quatro documentos: `README.md` (índice + incoerências a alinhar),
`Conceito-e-Marca.md` (posicionamento, personas, identidade visual com hex reais, tom de voz,
serviços/preços, provas sociais), `Rebranding-Instagram.md` (bio, destaques, grelha, pilares,
hashtags, KPIs) e `Plano-de-Conteudo.md` (calendário, ideias, legendas) + `Briefing-Cowork.md`.
Tudo extraído do site real (cores `#B76E79`/`#C9A96E`/`#FDF8F5`, fontes Playfair+Inter,
IG `@franciellycostamaster`). Registadas incoerências do site a alinhar: stats +2300 vs +200,
horário rodapé vs agendamento, prazo caução 24h vs 48h.

## [2026-06-12] decisão | Limpeza dos ficheiros legados do Firebase
Removidos do repo (build verificado): `firebase.json`, `firestore.rules`, `storage.rules`,
`apphosting.yaml`, `dataconnect/`, e o domínio `firebasestorage` do `next.config.mjs`.
Dicas em `googleCalendar.ts` atualizadas para a Vercel. `_migration/` (gitignored, export do
Firestore) mantido no disco como backup. Detalhe em [[migracao-firebase-supabase]].

## [2026-06-12] decisão | Wiki criado
Camada de conhecimento llm-wiki inicializada para o site Francielly Costa, com as
convenções Obsidian (wikilinks, properties, callouts). Páginas-núcleo criadas:
[[schema]], [[index]], [[log]]; páginas de conceito: [[visao-geral]], [[stack-tecnica]],
[[arquitetura-dados]], [[seguranca]], [[rgpd-legal]], [[seo-analytics]], [[integracoes]],
[[migracao-firebase-supabase]], [[site-publico]], [[painel-admin]], [[api-rotas]], [[galeria]].
Fontes do conhecimento: sessão de auditoria 2026-06-12 + mapa real de rotas (`src/app`).

## [2026-06-12] ingest | Auditoria de segurança/RGPD/SEO/perf + correções pós-deploy
Hardening ponta-a-ponta (commits `a7a9dd0`, `da550f9`). Correções pós-deploy:
galeria abria em separador vazio (`5f09c8a`, ver [[galeria]]); 403 no painel admin por
revogação do EXECUTE de `is_admin()` ao `authenticated` (migração corretiva, ver [[seguranca]]).
Estado documentado em [[fonte-seguranca-estado-2026-06]].
