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

## [2026-07-21] diagnóstico | Emails de produção caem no spam da iCloud (não falham) + ADMIN_EMAIL errado
Marcação de teste de FiberBROWS (email real do utilizador) não chegou. Investiguei com
um endpoint temporário (`/api/diag-email`, já removido) que corre com as env vars reais
da Vercel:
- Chave Resend de produção OK e `franciellycosta.pt:verified` (a chave do `.env.local`
  é do outro projeto, FitPro, só serve local). Um envio de teste devolveu `200` e o
  Resend marcou `last_event: delivered`. Logo os emails SÃO entregues; o problema é
  colocação: aterram no Lixo/Spam da iCloud (domínio de envio novo, sem reputação).
- Falta **DMARC**: `_dmarc.franciellycosta.pt` não existe. SPF e DKIM do Resend estão OK.
  Fix no DNS: TXT `_dmarc` = `v=DMARC1; p=none; rua=mailto:geral@franciellycosta.pt`.
- Bug de config: env `ADMIN_EMAIL = geral@franciellycosta.com` (.com, domínio que não é
  da Francielly) → as notificações de nova marcação vão para o sítio errado. Corrigir
  para `.pt` na Vercel + redeploy (não acessível a partir daqui).

Conclusão: a [[servicos|Opção A]] (email de confirmação com botão da anamnese) funciona
ponta a ponta; só a ENTREGA precisa do DMARC para não cair no spam. Marcação e cliente
de teste limpos da BD.

## [2026-07-21] feature | Ligar a anamnese ao fluxo de marcação (só FiberBROWS)
A anamnese deixou de estar solta: passa a ser oferecida ao cliente assim que marca
FiberBROWS. Duas frentes (Opção A + B), condicionadas por `isFiberBrows(servicoId)`
(novo helper isomórfico em `src/lib/horariosServico.ts`, ao lado de `FIBERBROWS_ID`).

**A) Email de confirmação** (`src/lib/email.ts`): `BookingData` ganha `servicoId`
(passado por `src/app/api/agendar/route.ts`). Só no FiberBROWS acrescenta um bloco
com botão "Preencher a minha ficha de anamnese" a apontar para `/anamnese`. Outros
serviços continuam com o email igual.

**B) Ecrã final da marcação** (`src/components/booking/BookingFlow.tsx`): ao concluir
uma marcação de FiberBROWS (sem caução), mostra CTA imediato para `/anamnese` e faz
redirect automático com contagem de 6s (botão para ir já + opção "cancelar", que
revela o WhatsApp). Só dispara quando `step === 'pagamento' && !CAUCAO_ATIVA &&
isFiberBrows`.

Continua a valer o ecrã sem caução; a anamnese em si é sempre a genérica de FiberBROWS.
Verificado por type-check limpo + `npm run build` OK. Ver [[servicos]] e [[integracoes]].

## [2026-07-14] feature | Anamnese FiberBROWS interativa + consentimento (TCLE) em PT + assinatura simples
Anamnese online nova, pensada para não cansar (as 27 perguntas do forms.app oficial).

**Fluxo (cliente):** `/anamnese` (início público) e `/anamnese/[token]` (retomar).
Uma pergunta por ecrã, cores por secção, barra de progresso, microinterações
(framer-motion). Ecrã focado sem navbar/rodapé/chat (via [[integracoes|PublicShell]],
mesma lógica do /admin). "Guardar e continuar mais tarde" cria rascunho e envia link
por email para retomar onde ficou. Persistência também em localStorage.

**Consentimento (TCLE):** adaptado do POP FiberBROWS (doc do utilizador) para PT:
NIF em vez de CPF, RGPD (art. 9.º), sem referências à Anvisa/RDC brasileiras; inclui
procedimento, riscos, contraindicações, cuidados pós e declarações. Texto e versão
em `src/data/anamneseFiber.ts` (`CONSENTIMENTO`, `CONSENTIMENTO_VERSAO`).

**Assinatura simples (eIDAS art. 25):** canvas (`AssinaturaCanvas.tsx`) + carimbo de
data/hora, IP, user-agent, versão do documento e hash SHA-256 de integridade. Cópia
enviada por email à cliente. Autorização de imagem (local/rosto/não).

**Backend:** tabela `consentimentos` estendida (migração `anamnese_fiber_interativa`):
estado `rascunho`, `tipo_formulario`, `origem`, `progresso_step`, `assinatura_imagem`,
`assinatura_ip`, `documento_versao`, `documento_hash`, `autorizacao_imagem`. Funções em
`src/lib/consentimentos.ts`: `upsertRascunhoFiber`, `submeterAnamneseFiber`,
`computarAlertasFiber` (alertas clínicos: gravidez, diabetes, oncológicos, isotretinoína,
alergias...). Rotas públicas `POST /api/anamnese/guardar` e `/submeter` (rate-limited).
Emails em `src/lib/emailAnamnese.ts`. `/consentimento/[token]` agora redireciona para
`/anamnese/[token]`; o link do admin (`enviar-link`) aponta para o novo fluxo.

**Admin:** `/admin/consentimentos` mostra estado "Em curso" (rascunho) e o detalhe
completo das 27 respostas + assinatura desenhada + autorização + versão/hash.

**Verificação:** rotas guardar/submeter testadas ponta a ponta (registo com alertas,
hash, assinatura e IP na BD), type-check e build de produção OK, SSR de `/anamnese` sem
chrome (200) e link inválido a funcionar em produção. O percorrer animado passo-a-passo
não foi validado no ambiente de automação (separador oculto, sem requestAnimationFrame),
fica para validar no telemóvel. Commit `a1247ec`.

**Documento à parte:** POP interno completo adaptado a PT gerado em Word,
`Desktop\POP FiberBROWS - PT.docx` (Anvisa/RDC removidas, CPF→NIF, CNPJ do equipamento
só como origem, resíduos e enquadramento legal marcados para confirmação por jurista).

## [2026-07-14] decisão | Horário restrito do FiberBROWS + correção do domínio .pt em todo o site
Duas tarefas numa sessão.

**1. Horário de marcação específico do FiberBROWS (só este serviço).**
- Novo módulo isomórfico `src/lib/horariosServico.ts` com as janelas por dia da semana:
  Seg–Qua e Sex–Sáb `10:00–12:30`, Qui `14:00–17:30`, Dom encerrado. Sábado passa a
  estar aberto (só para o FiberBROWS; os outros serviços continuam Seg–Sex 10h–18h).
- Regra de encaixe: a marcação tem de caber inteira na janela (`início + duração <= fim`).
  Como o FiberBROWS dura 90 min, dá 3 horas de manhã (10:00/10:30/11:00) e 5 à quinta
  (14:00–16:00).
- Ligado em 3 pontos: `getSlotsDisponiveis(data, duração, servicoId?)` em [[api-rotas|booking.ts]]
  (gera slots só dentro das janelas), `GET /api/slots` (aceita `servicoId`, usa
  `servicoAbreNoDia`) e `POST /api/agendar` (valida dia + `horaDentroDaJanela`, defesa em
  profundidade). No cliente, `BookingFlow` usa `servicoAbreNoDia` no calendário (mostra
  sábados para o FiberBROWS) e `descricaoHorario` no subtítulo.
- As rotas admin (`criar-manual`, `reagendar`) ficam sem restrição de propósito: a Francielly
  marca a qualquer hora manualmente.
- Verificado com o dev server: `/api/slots` devolve exatamente as janelas esperadas por dia;
  `POST /api/agendar` a 400 para hora fora da janela e para domingo. Build de produção OK.

**2. Email de contacto: `.com` → `.pt` em todo o site.**
- O rodapé (e várias páginas) mostrava `geral@franciellycosta.com`, que está errado: o
  domínio real e verificado é `.pt`. Corrigido em todo o `src/`: Footer, Termos, Privacidade,
  Cookies, Contacto, LocationSection (`info@…com` → `geral@…pt`), JsonLd (SEO), Sofia
  (`/api/chat`), login e definições admin (email + `website`).
- **Bug latente encontrado:** três fluxos enviavam email DE `noreply@franciellycosta.com`
  (`lib/alertas.ts`, `consulta-virtual/agendar`, `consentimentos/enviar-link`). Como o `.com`
  não está verificado no Resend, esses emails falhavam em silêncio. Passaram para
  `@franciellycosta.pt`. Ver [[integracoes]].
- `next.config.mjs`: removidos os hosts de imagem `.com`. `.env.example` atualizado.
- Verificado: `grep franciellycosta.com src/` = 0; HTML da homepage mostra só `.pt`.

## [2026-07-12] decisão | Email a funcionar: domínio .pt verificado + diagnóstico + logo
Fecho da configuração de email (continuação da entrada anterior).
- **Domínio `franciellycosta.pt` verificado no Resend** e o 1º email real enviado com sucesso
  (o pedido de confirmação à cliente Isabel). O utilizador adicionou os 3 registos DNS (DKIM
  TXT `resend._domainkey`, SPF MX `send`, SPF TXT `send`), rodou a chave exposta e pôs uma
  nova `RESEND_API_KEY` na Vercel.
- **Diagnóstico Resend no painel**: `GET /api/admin/diagnostico/resend` (admin-auth) usa a
  chave da Vercel (sem a revelar) para listar os domínios da conta e o estado de verificação.
  UI em Admin → Diagnóstico → secção "Email (Resend)". Serve para saber se o domínio está na
  conta certa e verificado. Foi o que destravou o problema (a chave e o domínio tinham de estar
  na mesma conta Resend).
- **Logo nos emails**: `public/logo/logo-francielly-branco.png` (PNG 600x228 convertido do SVG
  branco, porque clientes de email não renderizam SVG; conversão feita com `sharp`). O cabeçalho
  do template (`emailTemplate.ts`) passou a mostrar a logo sobre o gradiente + filete dourado/rosa.
- **Referência de config de email** (para o futuro): remetente/reply-to controlados por env
  `EMAIL_FROM`/`EMAIL_REPLY_TO` (default `geral@franciellycosta.pt`); a caixa real que recebe
  respostas é `geral@franciellycosta.pt`. Todos os emails usam o layout partilhado de
  `src/lib/emailTemplate.ts` (`emailShell` + `saudacao`/`cartaoDetalhes`/`botao`/`paragrafo`).
Verificado: type-check + build + logo servida em produção (200 image/png) + email real entregue.

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
