# Setup — Pipeline de Imagens Francielly Costa

## 1. Instalar dependências

```bash
cd Marketing/francielly-ai
pip install -r requirements.txt
```

## 2. Configurar credenciais

```bash
cp .env.example .env
```

Edita o `.env`:
- `GCP_PROJECT_ID` — o teu projecto Google Cloud (pode ser o mesmo do Biogé)
- `GOOGLE_APPLICATION_CREDENTIALS` — caminho para o JSON da service account

> A mesma `credentials.json` do Biogé funciona se o Vertex AI estiver ativo nesse projecto.

## 3. Instalar fontes (obrigatório para qualidade visual)

Descarrega de Google Fonts e instala em Windows (duplo clique → Instalar):
- [Playfair Display](https://fonts.google.com/specimen/Playfair+Display)
- [Inter](https://fonts.google.com/specimen/Inter)

## 4. Fluxo completo

### Passo 1 — Gerar imagem hero com Vertex AI Imagen 3

```bash
# Listar tipos disponíveis
python generate.py --listar

# Gerar 2 variações do tipo panfleto hero (1:1 Instagram)
python generate.py --tipo panfleto_hero --n 2

# Gerar para story (9:16)
python generate.py --tipo panfleto_hero --n 2 --aspeto 9:16

# Outros tipos úteis
python generate.py --tipo brow_closeup --n 3
python generate.py --tipo fiberbrows_hero --n 2
python generate.py --tipo reel_cover --n 4 --aspeto 9:16
```

As imagens ficam em `outputs/`.

### Passo 2 — Compor o panfleto

```bash
# Panfleto square (Instagram post) com a imagem gerada
python compose_flyer.py --imagem outputs/panfleto_hero_xxx_1.png --formato square

# Story / Reel
python compose_flyer.py --imagem outputs/panfleto_hero_xxx_1.png --formato story

# A4 para impressão
python compose_flyer.py --imagem outputs/panfleto_hero_xxx_1.png --formato a4

# Teste sem imagem AI (fundo creme)
python compose_flyer.py --demo --formato square
```

### Fluxo de afinação (iterativo)

1. Corre `generate.py --tipo panfleto_hero --n 4`
2. Escolhe a melhor imagem
3. Corre `compose_flyer.py --imagem <melhor> --formato square`
4. Vê o resultado, ajusta prompts em `prompts.py` se necessário
5. Repete

## 5. Formatos disponíveis

| Formato  | Dimensões     | Uso                          |
|----------|---------------|------------------------------|
| square   | 1080 × 1080px | Instagram post               |
| story    | 1080 × 1920px | Instagram story / Reel capa  |
| a4       | 2480 × 3508px | Impressão A4 (300 DPI)       |
| banner   | 1200 × 628px  | Facebook / LinkedIn          |

## 6. Tipos de imagem disponíveis

| Tipo             | Descrição                              |
|------------------|----------------------------------------|
| panfleto_hero    | Rosto com sobrancelhas perfeitas       |
| lifestyle_studio | Interior do estúdio elegante           |
| hands_procedure  | Mãos a trabalhar — procedimento        |
| brow_closeup     | Close-up da sobrancelha — resultado    |
| lips_result      | Resultado de micropigmentação labial   |
| fiberbrows_hero  | Hero FiberBROWS — técnica exclusiva    |
| reel_cover       | Capa de Reel — olhar direto            |
| carousel_cover   | Flat lay para capa de carrossel        |
