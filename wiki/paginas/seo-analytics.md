---
title: SEO e analytics
tags:
  - seo
  - analytics
  - ads
atualizado: 2026-08-11
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
- **Meta Pixel** + **Google Analytics / Google Ads** (componente `Analytics`, lib `analytics.ts`).
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

## Performance (impacta SEO)
- Removido `@import` de Google Fonts render-blocking; **hero LCP estático** (CSS).
- `ChatWidget` em dynamic import; `next/image` no blog/galeria/instagram; **ISR** no blog.
- `next.config.mjs`: AVIF/WebP, `deviceSizes`/`imageSizes`, cache longo de imagens/fonts/estáticos.

> [!note] Domínios de imagem autorizados
> `next.config.mjs > images.remotePatterns` inclui `vptyaaxzjrhsjmyrbbxm.supabase.co`,
> `franciellycosta.pt/.com`, `images.unsplash.com`, `firebasestorage.googleapis.com` (legado).
