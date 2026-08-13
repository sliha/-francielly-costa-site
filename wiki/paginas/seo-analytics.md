---
title: SEO e analytics
tags:
  - seo
  - analytics
  - ads
atualizado: 2026-08-12
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
- **Meta Pixel** + **Google Analytics 4** (`G-500PEGQ6Y4`) + **Google Ads** (`AW-18049747314`),
  no componente `Analytics`, lib `analytics.ts`. O GA4 e o Ads partilham um único `gtag.js`.
- Eventos de conversão: clique no WhatsApp e botões de marcação.
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

## Performance (impacta SEO)
- Removido `@import` de Google Fonts render-blocking; **hero LCP estático** (CSS).
- `ChatWidget` em dynamic import; `next/image` no blog/galeria/instagram; **ISR** no blog.
- `next.config.mjs`: AVIF/WebP, `deviceSizes`/`imageSizes`, cache longo de imagens/fonts/estáticos.

> [!note] Domínios de imagem autorizados
> `next.config.mjs > images.remotePatterns` inclui `vptyaaxzjrhsjmyrbbxm.supabase.co`,
> `franciellycosta.pt/.com`, `images.unsplash.com`, `firebasestorage.googleapis.com` (legado).
