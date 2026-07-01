# -*- coding: utf-8 -*-
"""
prompts.py — Biblioteca de prompts Vertex AI para Francielly Costa.

Identidade visual:
  Paleta: rose gold #B76E79, dourado #C9A96E, creme #FDF8F5, escuro #1A1A1A
  Estética: premium, feminino, quente, elegante, resultado natural
  Palavras-chave visuais: soft light, warm tones, clean studio, brow close-up,
                          rose gold details, cream background, bokeh
"""

# ─── ESTILO BASE (acrescentar a todos os prompts) ────────────────────────────
STYLE_SUFFIX = (
    "editorial beauty photography, soft warm studio lighting, "
    "rose gold and cream color palette, elegant premium aesthetic, "
    "clean background, professional cosmetic studio, "
    "sharp focus on subject, subtle bokeh, "
    "Portugal beauty industry, ultra-realistic, 4K"
)

NEGATIVE_PROMPT = (
    "cartoon, illustration, text overlay, watermark, logo, "
    "harsh shadows, neon colors, blue tones, generic stock photo, "
    "artificial looking, over-edited, tattoo style, ugly, distorted, "
    "blurry, low quality, amateur"
)

# ─── PROMPTS POR TIPO DE PEÇA ────────────────────────────────────────────────

PROMPTS = {

    # Panfleto hero — imagem principal do website / divulgação
    "panfleto_hero": {
        "positive": (
            "Close-up portrait of a confident Portuguese woman in her 30s, "
            "flawlessly defined natural-looking eyebrows, "
            "warm rose gold tones, soft cream background, "
            "premium beauty studio atmosphere, "
            "subtle professional makeup, skin glowing, "
            "elegant and trustworthy expression, "
            f"{STYLE_SUFFIX}"
        ),
        "description": "Hero image para panfleto — rosto com sobrancelhas perfeitas",
    },

    # Antes/depois lifestyle
    "lifestyle_studio": {
        "positive": (
            "Elegant beauty studio interior in Portugal, "
            "cream and rose gold decor, professional aesthetic workstation, "
            "warm ambient lighting, clean and luxurious space, "
            "small golden details, plants, minimal design, "
            f"{STYLE_SUFFIX}"
        ),
        "description": "Estúdio elegante — bastidores / ambiente",
    },

    # Procedimento — mãos a trabalhar
    "hands_procedure": (
        "Close-up of professional artist's hands carefully working on "
        "a client's eyebrow with a precision tool, "
        "clean studio gloves, warm skin tones, "
        "rose gold background elements, shallow depth of field, "
        "luxury beauty procedure, dermopigmentation, "
        f"{STYLE_SUFFIX}"
    ),

    # Detalhe sobrancelha — resultado
    "brow_closeup": {
        "positive": (
            "Extreme close-up of perfectly shaped natural eyebrows, "
            "hair-stroke microblading technique, "
            "flawless skin texture, warm golden light from the side, "
            "ultra-sharp detail, beauty macro photography, "
            "rose gold tones in background, "
            f"{STYLE_SUFFIX}"
        ),
        "description": "Close-up do resultado — sobrancelha",
    },

    # Lábios — micropigmentação labial
    "lips_result": {
        "positive": (
            "Close-up of perfectly defined natural-looking lips, "
            "subtle lip blush permanent makeup result, "
            "soft pink tones, healthy skin, "
            "cream and warm background, beauty editorial, "
            f"{STYLE_SUFFIX}"
        ),
        "description": "Resultado de micropigmentação labial",
    },

    # FiberBROWS — destaque exclusivo
    "fiberbrows_hero": {
        "positive": (
            "Close-up portrait of a woman with incredibly natural-looking "
            "eyebrows using biocompatible aesthetic fibers technique, "
            "each hair individually placed, ultra-realistic result, "
            "warm rose gold lighting, cream background, premium feel, "
            "Portugal exclusive technique, confidence and beauty, "
            f"{STYLE_SUFFIX}"
        ),
        "description": "Hero image FiberBROWS — técnica exclusiva",
    },

    # Instagram Reel thumbnail
    "reel_cover": {
        "positive": (
            "Beautiful Portuguese woman looking directly at camera, "
            "natural glowing skin, defined arched eyebrows, "
            "confident smile, warm cream background, "
            "rose gold color grading, beauty influencer aesthetic, "
            "vertical format composition, "
            f"{STYLE_SUFFIX}"
        ),
        "description": "Capa de Reel — olhar direto, sobrancelhas definidas",
    },

    # Carrossel educativo — mockup device
    "carousel_cover": {
        "positive": (
            "Flat lay beauty arrangement on cream linen background, "
            "rose gold cosmetic tools, golden tweezers, soft flowers, "
            "warm light, luxury beauty editorial, "
            "top-down photography, premium aesthetic, "
            f"{STYLE_SUFFIX}"
        ),
        "description": "Capa de carrossel — flat lay elegante",
    },
}
