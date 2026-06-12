---
title: Galeria (antes/depois)
tags:
  - componente
  - galeria
atualizado: 2026-06-12
---

# Galeria de antes/depois

Componente `src/components/galeria/GaleriaPage.tsx` (rota [[site-publico|/galeria]]).
Lê a tabela `galeria` (ver [[arquitetura-dados]]) via chave anon, filtra por categoria de serviço,
com lightbox e suporte a foto/vídeo.

## Particularidade: categorias são data-driven
A lista de categorias (`categories`) tem 6 serviços, mas a tabela `galeria` só tem media de
**microblading, microshading, eyeliner, labial** — **não** tem fiberbrows nem tricopigmentacao.

> [!bug] Bug corrigido (2026-06-12, commit `5f09c8a`)
> A galeria abria **sempre** no separador `fiberbrows` (vazio) e o código não mostrava placeholder
> quando havia itens noutras categorias → parecia **completamente vazia**, embora as fotos
> estivessem todas no Storage (HTTP 200). **Nenhuma mídia foi apagada.**
>
> **Fix:** só mostra separadores de categorias **com** media (`visibleCategories`) e abre
> automaticamente no primeiro separador com fotos (`useEffect` que salta de uma categoria vazia).

## Implicação para o futuro
Se forem adicionadas fotos de fiberbrows/tricopigmentacao na BD, os separadores aparecem sozinhos.
Não é preciso tocar no código por causa disso.

> [!tip] Verificar em dev (Windows)
> O watcher do `next dev` por vezes não recompila com Edits e os chunks de dev têm nome estável
> (o browser serve cache HTTP). Para verificar mudanças: apagar `.next` + reiniciar +
> `fetch(url, {cache:'reload'})` aos chunks antes do reload. (Registado em [[fonte-seguranca-estado-2026-06]].)
