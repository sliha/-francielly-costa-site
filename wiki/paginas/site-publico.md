---
title: Site público — rotas
tags:
  - rotas
  - frontend
atualizado: 2026-06-12
---

# Site público — rotas e páginas

Mapa real das `page.tsx` fora de `/admin` (App Router, `src/app/`).

## Montra
- `/` — homepage (hero, serviços, sobre-preview, antes/depois, Instagram)
- `/servicos` e `/servicos/[slug]` — serviços (detalhe por serviço)
- `/galeria` — galeria de antes/depois (ver [[galeria]])
- `/sobre` — sobre a Francielly
- `/certificacoes` — certificados
- `/blog`, `/blog/[slug]`, `/blog/ebook-designer-de-sobrancelhas` — blog + landing do eBook
- `/contacto` — formulário de contacto

## Funil de marcação
- `/agendar` — escolher serviço, data/slot e dados; cria marcação
- `/agendamento/confirmado` e `/agendamento/cancelado` — estados pós-checkout (ver [[integracoes]])
- `/consulta-virtual` — pedir consulta virtual

## Áreas com token/código (privadas, noindex)
- `/acompanhamento/[id]` — cliente vê o seu acompanhamento (fotos/mensagens) por código
- `/consentimento/[token]` — cliente preenche anamnese/consentimento (ver [[rgpd-legal]])
- `/referencia` — cliente obtém o seu código de referência real (via `/api/referencia/meu-codigo`)

## Legais
- `/privacidade`, `/termos`, `/cookies` — ver [[rgpd-legal]]

> [!note]
> Backend destas páginas em [[api-rotas]]. Componentes de UI em `src/components/` (home, servicos,
> sobre, galeria, layout, …). Gestão correspondente em [[painel-admin]].
