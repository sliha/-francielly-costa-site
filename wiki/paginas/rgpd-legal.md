---
title: RGPD e legal
tags:
  - rgpd
  - legal
atualizado: 2026-06-12
---

# RGPD e legal

## Páginas legais (reescritas à stack real em 2026-06-12)
- `/privacidade` — política de privacidade
- `/termos` — termos de uso
- `/cookies` — política de cookies + botão "Gerir Cookies"

Conteúdo cobre: **subprocessadores** (Supabase, Vercel, Stripe, Resend, Google, Anthropic, Meta),
**bases legais**, **prazos de retenção**, **dados de saúde (Art. 9)**, **CNPD**, **RAL** e
**Livro de Reclamações** (link no footer).

## Consentimento de cookies
- Banner **granular**: separa **analytics** vs **marketing** (componente `CookieBanner` + `consent.ts`).
- Integra **Google Consent Mode v2** (ver [[seo-analytics]]).
- Botão "Personalizar" + revogação posterior via "Gerir Cookies".

## Dados de saúde (anamnese)
- Os termos de consentimento (`consentimentos`) recolhem dados clínicos (alergias, medicação,
  gravidez, etc.) → categoria especial (Art. 9 RGPD).
- Fotos de acompanhamento guardadas em **bucket privado** com signed URLs. Ver [[seguranca]].
- `computarAlertas()` gera alertas de risco a partir da anamnese (ex.: grávida → contraindicado).

## Divulgação de IA
- **Chat "Sofia"** e **simulador IA** divulgam que usam IA (foto → Anthropic, com consentimento).

> [!note] Objetivo
> Proteger a proprietária e os criadores do site de coimas/processos em Portugal/UE.
> Relacionado com [[seguranca]] (PII) e [[integracoes]] (subprocessadores).
