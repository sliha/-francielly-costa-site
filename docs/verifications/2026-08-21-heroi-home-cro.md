# Verificação — Herói da home orientado a marcação (CRO)

- Data: 2026-08-21
- Projeto: franciellycosta.pt (site) · Supabase/Vercel: não aplicável (front-end, local)
- Commits: 92572f8 feat(home) herói orientado a marcação · 4b3d99f fix(home) selo 5.0 Google -> Maps
- Acesso do verificador: repo sim (montado) · Supabase n/a · Vercel n/a (não deployado)
- Veredicto: APROVADO
- Verificador: Cowork (independente do CC)

## Provas duras (Camada 0, corridas pelo Sérgio)
- npx tsc --noEmit -> tsc_exit=True (sucesso, sem erros de tipo)
- npm run build -> build_exit=0, rotas compiladas (inclui /servicos/[slug] -> microblading)

## Alegações verificadas (evidência de primeira mão do repo)
| # | Alegação | Veredicto | Evidência |
|---|---|---|---|
| 1 | 92572f8 só mudou HeroSection.tsx | VERIFICADO | git diff --stat: 1 ficheiro, +59/-57 |
| 2 | 2 commits locais, sem push, tree limpo | VERIFICADO | git log origin/main..HEAD = 92572f8 + 4b3d99f |
| 3 | H1 "Sobrancelhas perfeitas, resultado natural" | VERIFICADO | diff + grep |
| 4 | Subtítulo com prova social | VERIFICADO | grep |
| 5 | CTA "Marcar avaliação gratuita" -> /agendar | VERIFICADO | diff; rota existe |
| 6 | CTA "Ver serviços e preços" -> /servicos | VERIFICADO | diff; rota existe |
| 7 | Selo 5.0 Google -> perfil Maps real | VERIFICADO | 4b3d99f: GOOGLE_REVIEWS_URL = link Maps, +2/-2 |
| 8 | Badge FiberBROWS movido para o fim do herói | VERIFICADO | diff |
| 9 | Removidos "Agendar com a Sofia" + openChat + Sparkles | VERIFICADO | grep 0; ChatWidget continua a ouvir 'openChat' (sem órfãos) |
| 10 | Travessão removido do banner FiberBROWS | VERIFICADO | banner "·"; 3 restantes só em comentários |
| 11 | Fix hidratação (framer-motion -> animate-hero) | VERIFICADO | 0 motion.button no ficheiro |
| 12 | tsc verde | VERIFICADO | tsc_exit=True |
| 13 | build verde | VERIFICADO | build_exit=0 |

## Segurança e rollback
- Secret scan aos dois diffs: limpo.
- Âmbito: 1 assunto por commit, reversível.
- Rollback: antes do push git reset --hard <sha>; depois do deploy git revert <sha> && git push, ou rollback na Vercel.

## Notas
- Remoção do CTA "Agendar com a Sofia" (não pedida, mas declarada e verificada; não parte o chat).
- O selo usa um link de PESQUISA do Maps (estável). Ideal futuro: trocar pelo link curto g.page/r/.../review do Perfil de Empresa (abre a caixa de escrever avaliação).
