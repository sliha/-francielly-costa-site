---
title: SEO e analytics
tags:
  - seo
  - analytics
  - ads
atualizado: 2026-08-14
---

# SEO e analytics

## SEO técnico
- **JSON-LD** `BeautySalon` **server-rendered** (componente `JsonLd`, `<script type="application/ld+json">`),
  visível a crawlers. `aggregateRating` fabricado foi **removido**.
- **Canonical** por página; **breadcrumb schema** nas páginas internas.
- **OG image** gerada em `/og-image.png` (ImageResponse, edge); ícones PWA `/icon-192.png`, `/icon-512.png`.
- **Sitemap dinâmico** (`src/app/sitemap.ts`) — inclui blog publicado, revalida a cada hora.
- `robots.txt`; `noindex` nas áreas privadas (ver [[seguranca]]).

> [!bug] Cuidado conhecido (build)
> Em rotas `*.png/route.tsx`, **não** usar `export const size` (dá erro de tipo). Passar
> `{ width, height }` inline nas opções do `ImageResponse`.

## Tracking (campanhas Meta/Google Ads)
- **Meta Pixel** + **Google Analytics 4** (`G-500PEGQ6Y4`) + **Google Ads** (`AW-18387543172`),
  no componente `Analytics`, lib `analytics.ts`. O GA4 e o Ads partilham um único `gtag.js`.
- Eventos de conversão: clique no WhatsApp e **conversão "Marcação"** (`conversion_event_book_appointment`)
  na marcação, no checkout Stripe e na consulta virtual.
- **Google Consent Mode v2** ligado ao consentimento granular de cookies (ver [[rgpd-legal]]).

### Endurecimento do Meta Pixel (2026-08-11, commit `3ae77d3`)
- **`Purchase` com dedup**: só dispara em `/agendamento/confirmado` quando há `session_id` do Stripe
  (sem `session_id` não houve compra, não dispara). Uma vez por sessão, com guard
  `localStorage['purchase:' + session_id]`. Envia `eventID = session_id` (o helper `fbq` passou a
  aceitar um 4º arg de options), base para a **CAPI** server-side futura. Valor fixo `€30` = caução
  real cobrada (valor dinâmico fica para depois).
- **`Lead`** novo na conclusão da **consulta virtual** (`source: consulta_virtual`), disparado uma vez
  quando o formulário confirma (`useEffect` na etapa + `useRef` anti-repetição).
- **Google Ads intocado** nesta ronda. ==Item em aberto:== enviar também uma conversão de Ads no
  `Purchase`/`Lead`; hoje só o clique no WhatsApp envia conversão de Ads (`AW-...` em `trackContactWhatsapp`).

> [!todo] Pendências de tracking
> - **Meta CAPI** (Conversions API) server-side, deduplicada pelo `eventID` já enviado no browser (task futura).
> - **Validar em Test Events** (Meta Events Manager): `Purchase` 1x sem duplicar no refresh e `Lead` na consulta virtual.

### GA4 migrado para `G-500PEGQ6Y4` (2026-08-12)
- Novo measurement id do GA4: **`G-500PEGQ6Y4`** (substitui o antigo `G-GM7S2XXBZS`).
- Passou a estar **fixo no `Analytics.tsx`** (deixou de ler `NEXT_PUBLIC_GA_ID`), para o ID correto
  entrar no deploy sem depender de uma env var na Vercel, que teria precedência sobre o fallback.
  A env var `NEXT_PUBLIC_GA_ID` na Vercel ficou **órfã** (já não é lida; pode ser removida).
- **Nada mais mexido:** Google Ads (`AW-18049747314`), Meta Pixel, Metricool e o Consent Mode v2
  continuam iguais. GA4 e Ads partilham o mesmo `gtag.js`.
- Verificado em **build limpo**: `G-500PEGQ6Y4` presente, `G-GM7S2XXBZS` com **0** ocorrências, Ads presente.

> [!note] Nota para quem lê o dev preview
> O browser de preview (dev) pode continuar a mostrar o ID antigo por causa do cache de chunks de
> dev (nomes estáveis). A verdade é o **build de produção**, confirmado por grep ao `.next`.

### Consent Mode fica em BÁSICO (avançado descartado, 2026-08-13)
- O Google reportou "tag não detectada em www.franciellycosta.pt". Experimentou-se o **Consent
  Mode avançado** (2 commits locais: o `gtag.js` carregaria sempre, a arrancar em `denied`), mas
  **reverteu-se** com `git reset --hard origin/main` para `ca2752e`. Produção mantém-se em **básico**.
- **Porquê básico:** o `gtag` só monta **depois** do opt-in de cookies (nada carrega antes),
  coerente com o banner granular e o RGPD (ver [[rgpd-legal]]). O avançado carregaria o gtag e
  enviaria pings sem cookies mesmo sem consentimento, trade-off que não se quis assumir.
- **O aviso é esperado:** o robô do Google não consente cookies, logo no básico a tag nunca carrega
  para ele ("não detectada"). Quem aceita cookies **é medido na mesma**.
- **Verificado em produção:** sem consentimento não carrega nada; com consentimento carrega
  `G-500PEGQ6Y4` (sem o antigo `G-GM7S2XXBZS`), e o Google Ads `AW-18049747314` continua no
  mesmo gtag. Sem marcadores do avançado (`wait_for_update`) no HTML.

> [!note] Como recuperar o avançado
> Os 2 commits do avançado ficaram no `git reflog`. Para os trazer de volta: `git cherry-pick`
> desses commits (os hashes estavam em `ae05b8f` e `5f4a329` antes do reset).

### Google Ads: conta nova e conversão "Marcação" (2026-08-14, commit `ac9af59`)
- A conta Google Ads mudou. Nova etiqueta: **`AW-18387543172`** (a antiga `AW-18049747314` era de
  outra conta e deixa de contar). Como no GA4, o id passou a estar **fixo no `Analytics.tsx`** (sem
  `process.env`), porque a env var `NEXT_PUBLIC_GOOGLE_ADS_ID` tinha o valor antigo e, por
  precedência sobre o fallback, mantinha a conta morta no build. A env var fica **órfã** na Vercel
  (removível, não urgente).
- **Novo evento de conta** criado no Ads: `conversion_event_book_appointment`. Disparado pela função
  `trackMarcacaoAds()` (`gtag('event', 'conversion_event_book_appointment')`), **uma vez** em cada:
  marcação sem caução (`BookingFlow`, ramo `!CAUCAO_ATIVA`), checkout Stripe (`/agendamento/confirmado`,
  com o dedup por `session_id` do `Purchase`) e consulta virtual (etapa `confirmado`, `useRef`
  anti-repetição). Só dispara com consentimento de marketing (o `config` do Ads é gated, coerente
  com o Consent Mode básico).
- **Removida a conversão de Ads morta** em `trackContactWhatsapp` (apontava para
  `AW-18049747314/n0zqCIe-iZIcEPKS5Z5D`, conta antiga). Mantidos o `fbq('Contact')` e o
  `gtag('contact_whatsapp')`. Isto fecha o ==item em aberto== da secção do Meta Pixel (enviar
  conversão de Ads na marcação, não só no clique do WhatsApp).
- Verificado em **build limpo** (output servido): antiga `AW-18049747314` **0x**, nova
  `AW-18387543172` **2x**, evento **10x**, `send_to` morto **0x**. `tsc`/`build` verdes.

## Performance (impacta SEO)
- Removido `@import` de Google Fonts render-blocking; **hero LCP estático** (CSS).
- `ChatWidget` em dynamic import; `next/image` no blog/galeria/instagram; **ISR** no blog.
- `next.config.mjs`: AVIF/WebP, `deviceSizes`/`imageSizes`, cache longo de imagens/fonts/estáticos.

> [!note] Domínios de imagem autorizados
> `next.config.mjs > images.remotePatterns` inclui `vptyaaxzjrhsjmyrbbxm.supabase.co`,
> `franciellycosta.pt/.com`, `images.unsplash.com`, `firebasestorage.googleapis.com` (legado).
