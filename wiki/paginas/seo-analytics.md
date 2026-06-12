---
title: SEO e analytics
tags:
  - seo
  - analytics
  - ads
atualizado: 2026-06-12
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

## Performance (impacta SEO)
- Removido `@import` de Google Fonts render-blocking; **hero LCP estático** (CSS).
- `ChatWidget` em dynamic import; `next/image` no blog/galeria/instagram; **ISR** no blog.
- `next.config.mjs`: AVIF/WebP, `deviceSizes`/`imageSizes`, cache longo de imagens/fonts/estáticos.

> [!note] Domínios de imagem autorizados
> `next.config.mjs > images.remotePatterns` inclui `vptyaaxzjrhsjmyrbbxm.supabase.co`,
> `franciellycosta.pt/.com`, `images.unsplash.com`, `firebasestorage.googleapis.com` (legado).
