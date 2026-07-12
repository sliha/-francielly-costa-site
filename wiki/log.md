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

## [2026-07-12] decisão | Domínio de email .pt no Resend + templates unificados
Configuração de email para o domínio real `franciellycosta.pt` (o `.com` que era usado
não estava verificado no Resend, os emails falhavam em silêncio).
- **Domínio adicionado ao Resend** via API (id `e514c524-...`, região eu-west-1, estado
  inicial `not_started`). Falta a Francielly meter os 3 registos DNS (DKIM TXT, SPF MX,
  SPF TXT) para verificar. Depois disso, a chave dessa conta Resend tem de ficar na
  `RESEND_API_KEY` da Vercel.
- **Template de email unificado** em `src/lib/emailTemplate.ts`: layout de marca partilhado
  (`emailShell` com cabeçalho gradiente rosa/dourado + rodapé de contactos), blocos
  reutilizáveis (`saudacao`, `cartaoDetalhes`, `botao`, `paragrafo`) e `sendEmail` (envia via
  Resend, from/reply-to configuráveis por env `EMAIL_FROM`/`EMAIL_REPLY_TO`, default
  `geral@franciellycosta.pt`).
- **Todos os emails migrados** para o template + `.pt`: confirmação de marcação (cliente+admin),
  lembrete, pedido de confirmação (em `email.ts`), contacto (cliente+admin), e lista de espera.
  Removidos os HTML inline duplicados e os remetentes `@franciellycosta.com`.
- Segurança: a chave Resend foi partilhada em chat pelo utilizador — recomendado rodar depois
  e guardar só na env da Vercel.
Verificado: type-check + build + render do template (rota temporária, cabeçalho/cartão/botão/
rodapé .pt corretos, zero `.com`).

## [2026-07-12] decisão | Caução desativada (teste do site sem caução)
A Francielly decidiu não cobrar caução durante um teste. Desativada com um interruptor
único `CAUCAO_ATIVA` em `src/lib/caucao.ts` (a `false`). A infraestrutura de pagamento
(Stripe, `/api/pagamento/checkout`, webhook, definição do valor no admin) fica INTACTA —
para reativar basta pôr a flag a `true`.
- **Fluxo de marcação** (`BookingFlow`): salta o passo de pagamento e mostra ecrã de
  sucesso ("Vamos entrar em contacto para confirmar"); `trackSchedule` passa a disparar
  na confirmação. `/api/agendar` cria a marcação como `pendente` (não `pendente_pagamento`).
- **Menções públicas removidas/escondidas**: página `/agendar` (metadata + copy), passo
  final do BookingFlow, `termos` (secção reescrita sem caução), `privacidade` (pagamentos
  Stripe agora condicionais), prompt da Sofia (`api/chat` — instruída a nunca pedir
  pagamento), CTA do FiberBROWS, email da lista de espera, e descrição do evento no Google
  Calendar. Tudo atrás da flag, reversível.
- **Admin**: escondido o selo "Caução paga/pendente" (clientes) e ajustados os textos de
  ajuda da lista de espera enquanto a flag está off. A definição "Valor da Caução" no admin
  mantém-se (é a opção para reativar/configurar).
- As menções "€7.000-€30.000" são comparações de preço (transplante), não caução — mantidas.
Verificado: type-check + build + runtime (páginas públicas sem caução; marcação de teste
criada como `pendente` e depois apagada; barra de progresso mostra "Concluído", não "Caução").

## [2026-07-12] decisão | Recuperar marcações pendentes + dados completos + campos obrigatórios
Três melhorias no fluxo de marcações, motivadas pela 1ª marcação real de FiberBROWS
(cliente desistiu no passo da caução):
- **Botão "Pedir confirmação" (admin)**: novo endpoint `POST /api/admin/agendamento/pedir-confirmacao`
  (admin-auth via `verifyAdminRequest`) + botão no cartão da agenda (estados pendente/pendente_pagamento).
  Envia email à cliente a pedir que CONFIRME por resposta, sem caução (`sendPedidoConfirmacao` em
  `email.ts`). Não altera estado nem cria evento no Google; a confirmação real fica manual depois da
  resposta. Serve para recuperar quem desiste por causa do pagamento.
  - Email sai de `geral@franciellycosta.pt` (from + reply-to), configurável por env
    `CONFIRM_FROM_EMAIL`/`CONFIRM_REPLY_TO`. ATENÇÃO: enviar DE @franciellycosta.pt exige esse
    domínio verificado no Resend (o resto do site envia de @franciellycosta.com). Se falhar, o
    endpoint devolve 502 com o erro do Resend (não é silencioso) e basta pôr `CONFIRM_FROM_EMAIL`
    a apontar para o domínio verificado.
- **Todos os dados no cartão da agenda**: passou a mostrar email (mailto), notas/observações da
  cliente e origem (Feito no site / Manual / Sofia), além do que já mostrava (nome, telefone, hora).
- **Telefone obrigatório no servidor**: `/api/agendar` e `/api/contacto` passaram a exigir telefone
  (antes só validavam nome+email/serviço). Os frontends já o exigiam; isto fecha o lado do servidor.
Verificado: type-check + build + runtime (contacto/agendar sem telefone → 400; endpoint sem auth → 401).

## [2026-07-09] decisão | FiberBROWS passou de lista de espera a marcações reais
A Francielly já trabalha com FiberBROWS, por isso o serviço deixou de ser "em breve"/waitlist
e passou a aceitar marcações normais (o `BookingFlow` já iterava `SERVICES`, que inclui o
fiberbrows; o backend `/api/agendar` resolve o serviço por id, sem whitelist). Mudanças:
- `FiberBROWSDetailPage.tsx`: removidos countdown (`TARGET_DATE` 2026-05-01) e `WaitlistForm`;
  CTAs passam a `/agendar?servico=fiberbrows` (hero, investimento, secção final `#agendar`).
- Secção home (`FiberBROWSSection`) e blog (`blogContent`): copy "em breve / Maio 2026 / lista
  de espera" → "já disponível em Braga / agende online".
- `services.ts`: `duration` 'A definir' → '1h – 1h30', `duracaoMinutos` 60 → 90; "fios
  sintéticos" → "fios estéticos" (o guia de marca no chat proíbe "sintético" para o FiberBROWS).
- Removida a infra de waitlist: `api/fiberbrows-waitlist/route.ts`, `admin/fiberbrows-waitlist/page.tsx`,
  links no `SideNav`/`BottomNav`, `trackWaitlistFiberbrows` em `analytics.ts`. A tabela
  `fiberbrows_waitlist` no Supabase estava **vazia** (0 registos) — mantida no schema mas órfã
  (pode ser dropada mais tarde; ainda é referida por `cleanTestData.ts`/`definicoes`).
- SEO reforçado (ver [[seo-analytics]]): título/descrição com intenção de marcação, `keywords`
  próprias, e novo JSON-LD `FAQPage` (15 perguntas) na página do serviço.
- FAQ extraído para `src/data/fiberbrowsFaq.ts` (partilhado entre a página e o JSON-LD).
Verificado: type-check + build de produção + testes de runtime (página 200, 3 links de marcação,
FAQPage presente, slots de 90min OK, homepage/agendar 200, zero vestígios de waitlist).

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
