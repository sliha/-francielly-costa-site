# DOSSIÊ — Experiência do Cliente no Site franciellycosta.pt

> Documento de referência para produção de vídeo tutorial "Como usar o site da Francielly Costa".
> Gerado a partir do código-fonte real (commit `03b983f`, 2026-06-12).
> Foco exclusivo no que o **cliente final** vê e pode fazer. A área `/admin` é privada da Francielly e fica fora deste dossiê.

---

## 1. Visão geral

O site **www.franciellycosta.pt** é a montra digital e central de atendimento da Francielly Costa, especialista em dermopigmentação avançada em Braga (Av. Dr. António Palha 53, 4715-091 Braga). O cliente pode, sem criar conta nem fazer login:

1. **Agendar um procedimento online** com escolha de data/hora em tempo real e pagamento de caução de 30 € (Stripe ou WhatsApp)
2. **Marcar uma consulta virtual gratuita** de 15 minutos por Google Meet
3. **Falar com a Sofia**, assistente virtual com IA, disponível 24/7 em qualquer página
4. **Simular o resultado** de um procedimento na própria cara com IA (upload de selfie)
5. **Explorar serviços, galeria de resultados, depoimentos e certificações**
6. **Ler o blog** e **descarregar um eBook gratuito** de 28 páginas (sem registo)
7. **Entrar na lista de espera FiberBROWS** (novidade exclusiva em Portugal)
8. **Preencher o consentimento digital** antes do procedimento (link privado por email)
9. **Acompanhar a recuperação pós-procedimento** numa área pessoal com checklist, fotos e chat direto com a Francielly
10. **Contactar** por formulário, telefone, email, WhatsApp ou Instagram

Idioma: português europeu. Design premium rose-gold/dourado, fontes Playfair Display + Inter. Totalmente responsivo (mobile-first).

---

## 2. Navegação e estrutura

### Navbar (fixa no topo)
- Logo (clicável → Início)
- Menu: **Início · Sobre · Serviços · Galeria · Blog · Contacto**
- Botão destacado: **"Agendar"** → `/agendar`
- Mobile: menu hambúrguer lateral com "Agendar Consulta" em destaque

### Footer
- 4 colunas: marca + redes sociais (Instagram, Facebook) · navegação · serviços diretos · contactos e horário
- Links legais: Privacidade · Cookies · Termos e Condições

### Elementos presentes em todas as páginas
- **Chat Sofia** — botão flutuante no canto inferior direito
- **Banner de cookies** — primeira visita (Aceitar / Recusar)
- **Popup Instagram** — aparece após ~45 segundos de navegação (1x por sessão): "Novo resultado publicado!" com link para o Instagram

### Mapa de rotas públicas
| Rota | Conteúdo |
|---|---|
| `/` | Homepage |
| `/servicos` | Lista de serviços |
| `/servicos/[slug]` | Detalhe de cada serviço (com Simulador IA) |
| `/galeria` | Galeria de resultados com filtros |
| `/sobre` | Biografia da Francielly |
| `/certificacoes` | Certificações e formação |
| `/blog` | Blog (artigos dinâmicos com capas) |
| `/blog/[slug]` | Artigo individual |
| `/blog/ebook-designer-de-sobrancelhas` | Landing do eBook gratuito |
| `/contacto` | Formulário + mapa + contactos |
| `/agendar` | Fluxo de agendamento (5 etapas) |
| `/consulta-virtual` | Agendamento de consulta virtual gratuita |
| `/consentimento/[token]` | Formulário de consentimento (link privado) |
| `/acompanhamento/[codigo]` | Área pessoal pós-procedimento (link privado) |
| `/privacidade` · `/cookies` · `/termos` | Páginas legais |

---

## 3. Homepage — secções pela ordem em que aparecem

1. **Hero** — fundo escuro com partículas douradas animadas. Banner "✨ Novo em Portugal — FiberBROWS", título "Dermopigmentação Avançada", badge "Especialista Certificada em Portugal" (→ certificações). CTAs: **"Descubra a FiberBROWS"** (rola até à secção FiberBROWS) e **"Agendar com a Sofia"** (abre o chat IA). Stats animados: +2300 clientes, +8 anos, 5 serviços. Avaliações Google 5.0 ⭐
2. **FiberBROWS em destaque** — 4 cartões de diferenciais (conforto, duração 6 meses, profundidade máx. 2 mm, preço a partir de 1.000 €). CTAs: "Quero Saber Mais" e "Falar com a Sofia"
3. **Números** — contadores animados ao entrar em vista
4. **Transformações (Antes/Depois interativo)** — 3 sliders comparativos que o cliente **arrasta com o dedo/rato** para revelar o antes e o depois (Microblading, Microshading, Eyeliner)
5. **Serviços** — grid de cartões com duração, sessões e preço; "Saber Mais" em cada um
6. **Sobre (preview)** — resumo + "Saber Mais"
7. **Depoimentos** — carrossel automático (5 s) com avaliações 5 estrelas de clientes reais; navegável por setas e pontos
8. **Instagram** — 3 fotos de trabalhos + botão "Ver no Instagram"
9. **FAQ** — 6 perguntas em acordeão (o que é, dor, duração, sessões, recuperação, contraindicações)
10. **Localização** — mapa Google interativo + cartões de morada, telefone, email, horário + botão verde **"Falar pelo WhatsApp"**

---

## 4. JORNADA PRINCIPAL — Agendar um procedimento (`/agendar`)

Fluxo de **5 etapas** com indicador de progresso (✨ Serviço → 📅 Data → 🕐 Hora → 👤 Dados → 💳 Caução). Botão "Voltar" disponível em qualquer etapa.

### Etapa 1 — Escolher o serviço
Cartões com nome, duração e n.º de sessões. Serviços agendáveis:

| Serviço | Duração | Sessões | Preço |
|---|---|---|---|
| FiberBROWS | ~1h | 1 | a partir de 1.000 € |
| Microblading | 45min–1h | 2 | 200–350 € |
| Microshading | 45min–1h | 2 | 180–300 € |
| Micropigmentação Labial | 1h30–2h30 | 2 | 200–350 € |
| Eyeliner | 45min–1h | 2 | 150–250 € |
| Tricopigmentação | 2h–4h/sessão | 3 | sob consulta |

### Etapa 2 — Escolher a data
- Grid com os próximos **30 dias úteis** (segunda a sexta), apresentados como "seg 15 jan"
- Exclui automaticamente: hoje, fins de semana e dias bloqueados pela Francielly
- Janela de marcação: **10h às 18h**

### Etapa 3 — Escolher a hora
- Slots de **30 em 30 minutos**, calculados **em tempo real** contra a agenda (inclui sincronização com o Google Calendar da Francielly)
- Slot disponível = clicável; ocupado = cinzento riscado
- O sistema só mostra horas onde o serviço **cabe por inteiro** (ex.: serviço de 1h30 não aparece às 17h)

### Etapa 4 — Dados pessoais
| Campo | Obrigatório |
|---|---|
| Nome completo | ✅ |
| Telemóvel | ✅ |
| Email | ✅ |
| Notas/observações (alergias, etc.) | opcional |
| **Código de referência** (de uma amiga) | opcional |

Botão **"Confirmar Marcação →"** (só ativa com os 3 campos obrigatórios).

### Etapa 5 — "Marcação Recebida!" + caução
- Resumo da marcação (serviço, data, hora, nome)
- Mensagem: *"Para confirmar a sua reserva, pedimos uma caução de **30 €** (descontada no procedimento)."*
- **Opção A — "Pagar Caução €30 →"**: abre o checkout **Stripe** em português (cartão de crédito/débito, pagamento seguro)
- **Opção B — "Prefere pagar via WhatsApp?"**: abre conversa direta com a Francielly (MB Way, transferência, etc.)

### Após o pagamento
- **Sucesso** → página "Marcação Confirmada!" com botões "Voltar ao Início" e "WhatsApp". A marcação entra automaticamente na agenda da Francielly (Google Calendar)
- **Cancelado** → página "Pagamento Cancelado" com "Tentar Novamente" e "WhatsApp"

### Emails automáticos
- O cliente recebe **email imediato** "Marcação recebida — [Serviço]" com todos os detalhes, morada e contactos
- Após pagar, a marcação fica confirmada e o cliente recebe a confirmação

### Regras importantes (para comunicar no vídeo)
- A caução de 30 € é **descontada no valor do procedimento**
- **Não reembolsável** em caso de falta sem aviso prévio de 24h
- Cancelamento/remarcação: contactar por **WhatsApp ou email com 48h de antecedência** (não há botão de auto-cancelamento no site — é deliberado, por segurança)

---

## 5. Consulta Virtual Gratuita (`/consulta-virtual`)

Ideal para clientes fora de Braga ou indecisas. **Grátis, 15 minutos, por Google Meet.**

Como funciona (4 passos mostrados na página):
1. Escolher data e hora
2. Receber link Google Meet por email
3. Videochamada com a Francielly (mostra a zona a tratar, recebe avaliação e recomendação)
4. Agendar o procedimento com confiança

Formulário: nome, telefone, email, serviço de interesse (inclui "Não sei ainda / Quero aconselhar-me"), data, hora (09:00–11:30 e 14:00–15:30) e dúvida opcional.
Confirmação no ecrã com o **link da videochamada** + envio por email.

---

## 6. Sofia — Assistente Virtual com IA (chat)

- **Botão flutuante** no canto inferior direito, em todas as páginas
- Apresentação: *"Olá! Sou a Sofia, assistente virtual da Francielly Costa…"*
- Responde **em segundos, 24/7, no idioma do cliente**
- Sabe tudo sobre: os 6 serviços (técnicas, duração, sessões, preços), localização, horário, contactos, caução
- **Não agenda diretamente** — recolhe a intenção e encaminha para o botão "Agendar" ou WhatsApp
- Histórico guardado durante a sessão do navegador
- Motor: Claude (Anthropic)

---

## 7. Simulador IA — "Veja como ficaria em si"

Disponível **na página de cada serviço** (`/servicos/[slug]`). Gratuito.

Passo a passo do cliente:
1. Clicar em **"Veja como ficaria em si · Análise personalizada com IA · Gratuito"**
2. Escolher **"Selfie"** (abre a câmara) ou **"Galeria"** (escolher foto)
3. Clicar **"Analisar"** — a IA avalia formato do rosto, tom de pele e proporções
4. Receber uma análise personalizada (3–4 parágrafos) de como o procedimento ficaria
5. CTAs finais: **"Gostou? Agende já!"** ou **"Tentar com outra foto"**

Privacidade (destacar no vídeo): **a foto não é guardada** — é analisada na hora e descartada.

---

## 8. Páginas de serviço (`/servicos` e `/servicos/[slug]`)

- `/servicos`: cada serviço em secção alternada com foto/gradiente, descrição, grid de info (duração, sessões, nível de dor, duração do resultado), 3 benefícios e botões "Saber Mais" + "Agendar"
- Página de detalhe inclui: stats, **benefícios**, **"indicado para"**, **como funciona (passos numerados)**, **recuperação**, **galeria de fotos/vídeos do serviço** (lightbox), **FAQ específico** e o **Simulador IA**
- FiberBROWS e Tricopigmentação têm páginas especiais próprias

---

## 9. Galeria (`/galeria`)

- **Filtros por categoria**: FiberBROWS · Tricopigmentação · Microblading · Microshading · Eyeliner · Labial
- Grid responsivo de fotos e vídeos de **trabalhos reais** (alguns antes/depois)
- Clicar abre **lightbox** em ecrã cheio com navegação por setas
- Vídeos com ícone de play

---

## 10. Blog e eBook gratuito

### Blog (`/blog`)
Artigos com capas (geridos dinamicamente), ~5–7 min de leitura. Temas: FiberBROWS, tricopigmentação, microblading (o que é, cuidados pós), microblading vs microshading, história da dermopigmentação, eyeliner permanente, mitos da dermopigmentação.

### eBook "A Chave para o Sucesso" (`/blog/ebook-designer-de-sobrancelhas`)
- **Curso de Designer de Sobrancelhas** — o manual que a Francielly usa para formar profissionais
- **28 páginas, 12 módulos** (ferramentas, anatomia, laminação, design, tipos de rosto, ética…)
- Inclui o "Método Francielly Costa" com medidas exatas da sobrancelha perfeita
- **100% grátis e sem registo** (não pede email!)
- Duas formas de aceder:
  - **"Descarregar eBook"** → PDF completo (8 MB)
  - **"Folhear online"** → leitor interativo com setas, arrastar para virar página, miniaturas, barra de progresso e ecrã inteiro

---

## 11. FiberBROWS — lista de espera

- Técnica exclusiva, **Francielly é a primeira certificada em Portugal**
- Fios estéticos biocompatíveis, resultado ~6 meses, a partir de 1.000 €
- Na página FiberBROWS: countdown + formulário de **lista de espera** (nome, email, telefone)
- Após registar: email automático de confirmação com **prioridade de marcação** quando abrir a agenda

---

## 12. Consentimento digital (antes do procedimento)

- O cliente recebe **um link privado por email** (`/consentimento/[token]`) — não precisa de login
- Preenche no telemóvel ou computador:
  1. **Anamnese** — alergias, medicação, perguntas sim/não de saúde (gravidez, diabetes, coagulação, queloides…)
  2. **Consentimento informado** — checkbox de aceitação
  3. **RGPD** — checkbox de proteção de dados
  4. **Assinatura digital** — escrever o nome completo
- Dados da marcação (nome, serviço, data) já vêm pré-preenchidos
- Mensagem final: *"Obrigado! O seu formulário foi submetido com sucesso. Vemo-nos no dia do procedimento."*
- Poupa tempo no estúdio: chega e está tudo tratado

---

## 13. Acompanhamento pós-procedimento (área pessoal da cliente)

- Após o procedimento, a cliente recebe **um link/código pessoal** (`/acompanhamento/[codigo]`) — sem login, só o código
- Saudação personalizada: *"Bem-vinda de volta, [Nome]"* + dados do procedimento
- **3 separadores:**
  1. **Recuperação** — timeline de 5 fases (Dia 1, 3, 7, 14, 30), cada uma com instruções e **checklist interativa** (a cliente vai marcando o que cumpriu; barra de progresso por fase)
  2. **Fotos** — upload de fotos da evolução (pode tirar foto na hora), galeria pessoal
  3. **Chat** — mensagens **diretas com a Francielly** (ela responde a partir do painel dela)
- Notificação de **sessão de retoque** com botão "Confirmar" quando agendada

---

## 14. Contacto (`/contacto`)

- **Formulário**: nome*, telefone*, email*, serviço de interesse (dropdown), mensagem. Botão "Enviar Mensagem" → confirmação "Mensagem Enviada!"
- **Cartões**: morada (link Google Maps), telefones (+351 913 112 232 · +351 917 132 116 WhatsApp), email (geral@franciellycosta.pt), horário
- **Botões grandes**: WhatsApp (verde), Instagram, Facebook
- **Mapa Google** interativo

---

## 15. Cookies e privacidade

- Banner na primeira visita: **"Aceitar"** ou **"Recusar"**
- Essenciais sempre ativos; analytics (Google/Meta) só com consentimento
- Páginas `/privacidade`, `/cookies`, `/termos` linkadas no footer
- Termos incluem: política de cancelamento 48h, caução, contraindicações

---

## 16. Usar o site "como uma app" — estado real

- **Não há botão/banner de instalação para o público** (isso existe só na área admin da Francielly)
- O manifest público está configurado em modo `standalone`, por isso o cliente **pode adicionar manualmente ao ecrã principal**:
  - **iPhone (Safari)**: Partilhar → "Adicionar ao ecrã principal" → abre em ecrã completo como app (ícone Apple existe)
  - **Android (Chrome)**: Menu ⋮ → "Adicionar ao ecrã principal" → cria atalho
- ⚠️ **Limitação técnica atual**: o `manifest.json` público tem `icons: []` (vazio) — no Android o atalho pode ficar com ícone genérico e o Chrome não oferece prompt de instalação. **Recomendação: adicionar ícones 192px e 512px ao manifest antes de gravar a cena "instalar como app".**
- Sem notificações push nem modo offline para o público

---

## 17. ⚠️ Incoerências a corrigir/decidir ANTES de gravar o vídeo

1. **Programa de referências (`/referencia`)** — a página pública mostra um **código fixo de demonstração ("ANA2026")** igual para toda a gente, e **não está ligada em nenhum menu**. O campo "Código de referência" no agendamento funciona (regista a indicação; recompensas anunciadas: 15% para quem indica, 10% para a amiga), mas a página em si é um placeholder. **Não mostrar a página `/referencia` no vídeo** — no máximo mencionar o campo de código no agendamento.
2. **Horários divergentes**: o footer/contacto diz "Seg–Sex 9h–18h · Sáb 9h–13h", mas o agendamento online só oferece **Seg–Sex 10h–18h**. Alinhar a mensagem do vídeo (sugestão: usar o horário do agendamento online).
3. **Prazo da caução**: o checkout Stripe diz "não reembolsável sem aviso de **24h**", os termos falam em cancelamento com **48h**. Escolher um número para o vídeo (sugestão: pedir 48h).
4. **Ícones PWA vazios** no manifest público (ver §16).
5. **Stats da homepage**: a secção Hero diz "+2300 clientes / 5 serviços" e a secção Stats diz "+200 clientes / 4 serviços" — verificar antes de filmar close-ups.

---

## 18. Sugestão de estrutura do vídeo (8 cenas, ~6–8 min)

| # | Cena | Conteúdo | Duração |
|---|---|---|---|
| 1 | Boas-vindas | Homepage: navegação, antes/depois interativo (arrastar!), depoimentos | 60s |
| 2 | Conhecer os serviços | `/servicos` → página de detalhe → preços, FAQ, galeria do serviço | 60s |
| 3 | Simulador IA | Selfie → análise personalizada → "a foto não é guardada" | 45s |
| 4 | **Agendar (cena principal)** | 5 etapas: serviço → data → hora → dados → caução 30 € (Stripe ou WhatsApp) → email de confirmação | 90s |
| 5 | Consulta virtual gratuita | Para quem está longe ou indecisa: 15 min por Google Meet, grátis | 45s |
| 6 | Sofia, a assistente | Abrir chat, fazer uma pergunta, mostrar resposta instantânea | 40s |
| 7 | eBook + blog | Landing do eBook → folhear online → descarregar PDF grátis sem registo | 45s |
| 8 | Depois da marcação | Consentimento digital por email + área de acompanhamento (checklist, fotos, chat com a Francielly) + contactos/WhatsApp | 75s |

**Mensagens-chave a repetir**: não precisa de criar conta para nada · a caução é descontada no procedimento · a Sofia está sempre disponível · em caso de dúvida, WhatsApp.

---

*Dossiê gerado automaticamente a partir do código-fonte. Contactos do negócio: Av. Dr. António Palha 53, 4715-091 Braga · +351 913 112 232 · WhatsApp +351 917 132 116 · geral@franciellycosta.pt · www.franciellycosta.pt*
