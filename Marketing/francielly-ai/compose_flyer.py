# -*- coding: utf-8 -*-
"""
compose_flyer.py - Compositor de panfleto Francielly Costa.

USO:
  python compose_flyer.py --imagem outputs/panfleto_hero_xxx_1.png --formato square
  python compose_flyer.py --demo --formato square
"""
import argparse
import sys
import time
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROSE_GOLD  = (183, 110, 121)
GOLD       = (201, 169, 110)
CREAM      = (253, 248, 245)
CREAM_DARK = (245, 237, 230)
DARK       = ( 26,  26,  26)
TEXT_SOFT  = (153, 153, 153)
WHITE      = (255, 255, 255)

FORMATS = {
    "square": (1080, 1080),
    "story":  (1080, 1920),
    "a4":     (2480, 3508),
    "banner": (1200,  628),
}

HERE    = Path(__file__).resolve().parent
OUT_DIR = HERE / "outputs"
OUT_DIR.mkdir(exist_ok=True)


def _load_font(name_hints, size):
    search_dirs = [
        Path("C:/Windows/Fonts"),
        Path.home() / "AppData/Local/Microsoft/Windows/Fonts",
        Path.home() / ".fonts",
        Path("/usr/share/fonts"),
        HERE / "fonts",
    ]
    for hint in name_hints:
        for d in search_dirs:
            for ext in ("ttf", "otf", "TTF", "OTF"):
                p = d / f"{hint}.{ext}"
                if p.exists():
                    try:
                        return ImageFont.truetype(str(p), size)
                    except Exception:
                        pass
    return ImageFont.load_default()


def get_fonts(scale=1.0):
    s = lambda n: max(10, int(n * scale))
    return {
        "headline":    _load_font(["PlayfairDisplay-Bold", "PlayfairDisplay-Regular",
                                   "Italiana-Regular", "Georgia-Bold", "Georgia"], s(78)),
        "subheadline": _load_font(["PlayfairDisplay-Regular", "Italiana-Regular", "Georgia"], s(46)),
        "body":        _load_font(["Inter-Regular", "Inter", "Outfit-Regular", "Arial"], s(34)),
        "small":       _load_font(["Inter-Regular", "Inter", "Outfit-Regular", "Arial"], s(26)),
        "cta":         _load_font(["Inter-Bold", "Outfit-Bold", "Arial-Bold", "Arial"], s(38)),
        "watermark":   _load_font(["Italiana-Regular", "Georgia"], s(22)),
    }


def make_gradient_bar(width, height):
    bar  = Image.new("RGBA", (width, height))
    draw = ImageDraw.Draw(bar)
    for x in range(width):
        t = x / max(width - 1, 1)
        r = int(ROSE_GOLD[0] + (GOLD[0] - ROSE_GOLD[0]) * t)
        g = int(ROSE_GOLD[1] + (GOLD[1] - ROSE_GOLD[1]) * t)
        b = int(ROSE_GOLD[2] + (GOLD[2] - ROSE_GOLD[2]) * t)
        draw.line([(x, 0), (x, height)], fill=(r, g, b, 255))
    return bar


def make_dark_overlay(width, height, alpha=150):
    overlay = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    draw    = ImageDraw.Draw(overlay)
    for y in range(height):
        t = y / max(height - 1, 1)
        a = int(alpha * t * t)
        draw.line([(0, y), (width, y)], fill=(*DARK, a))
    return overlay


def compose_flyer(hero_img, size, output_path):
    W, H  = size
    scale = W / 1080

    canvas = Image.new("RGBA", (W, H), (*CREAM, 255))
    draw   = ImageDraw.Draw(canvas)
    fonts  = get_fonts(scale)

    # Zona hero (top 58%)
    hero_h = int(H * 0.58)
    if hero_img:
        hero = hero_img.convert("RGBA").resize((W, hero_h), Image.LANCZOS)
        canvas.paste(hero, (0, 0), hero)
        overlay = make_dark_overlay(W, hero_h, alpha=140)
        canvas.alpha_composite(overlay, (0, 0))
    else:
        for y in range(hero_h):
            t = y / max(hero_h - 1, 1)
            r = int(CREAM[0] + (CREAM_DARK[0] - CREAM[0]) * t)
            g = int(CREAM[1] + (CREAM_DARK[1] - CREAM[1]) * t)
            b = int(CREAM[2] + (CREAM_DARK[2] - CREAM[2]) * t)
            draw.line([(0, y), (W, y)], fill=(r, g, b, 255))

    # Barra gradiente
    bar_h = int(7 * scale)
    bar   = make_gradient_bar(W, bar_h)
    canvas.alpha_composite(bar, (0, hero_h))

    # Fundo creme na zona de conteudo
    content_y = hero_h + bar_h
    draw.rectangle([(0, content_y), (W, H)], fill=(*CREAM, 255))

    # Tagline sobre a foto
    pad  = int(40 * scale)
    tag  = "A beleza que ja existe em si,"
    tag2 = "realcada por maos certificadas."

    t1_w = fonts["headline"].getlength(tag)
    t1_x = max(pad, (W - t1_w) // 2)
    t1_y = hero_h - int(210 * scale)
    draw.text((t1_x + 2, t1_y + 2), tag,  font=fonts["headline"], fill=(*DARK, 120))
    draw.text((t1_x,     t1_y),     tag,  font=fonts["headline"], fill=(*WHITE,))

    t2_w = fonts["headline"].getlength(tag2)
    t2_x = max(pad, (W - t2_w) // 2)
    t2_y = t1_y + int(92 * scale)
    draw.text((t2_x + 2, t2_y + 2), tag2, font=fonts["headline"], fill=(*DARK, 120))
    draw.text((t2_x,     t2_y),     tag2, font=fonts["headline"], fill=(*WHITE,))

    # Marca d'agua discreta
    wm   = "Francielly Costa"
    wm_w = fonts["watermark"].getlength(wm)
    draw.text((W - wm_w - int(16*scale), hero_h - int(30*scale)), wm,
              font=fonts["watermark"], fill=(*WHITE, 140))

    # Nome da marca
    brand = "Francielly Costa"
    b_w   = fonts["subheadline"].getlength(brand)
    b_y   = content_y + int(30 * scale)
    draw.text(((W - b_w) // 2, b_y), brand, font=fonts["subheadline"], fill=(*ROSE_GOLD,))

    # Linha decorativa
    line_y = b_y + int(54 * scale)
    line_w = int(180 * scale)
    bar_s  = make_gradient_bar(line_w, max(2, int(2 * scale)))
    canvas.alpha_composite(bar_s, ((W - line_w) // 2, line_y))

    # Servicos
    servicos = [
        "FiberBROWS  |  1.a certificada em Portugal",
        "Microblading  |  Microshading  |  Labios  |  Eyeliner",
        "Tricopigmentacao  |  Reparacao de cicatrizes",
    ]
    svc_y = line_y + int(18 * scale)
    for svc in servicos:
        svc_y += int(46 * scale)
        svc_w  = fonts["body"].getlength(svc)
        draw.text(((W - svc_w) // 2, svc_y), svc, font=fonts["body"], fill=(*GOLD,))

    # Credenciais
    creds = "Master PMU  |  Formacao em Milao  |  +2300 clientes  |  5.0 Google"
    crd_w = fonts["small"].getlength(creds)
    crd_y = svc_y + int(36 * scale)
    draw.text(((W - crd_w) // 2, crd_y), creds, font=fonts["small"], fill=(*TEXT_SOFT,))

    # CTA
    cta      = "Marca a tua avaliacao em franciellycosta.pt"
    cta_w    = fonts["cta"].getlength(cta)
    cta_y    = crd_y + int(38 * scale)
    btn_pad  = int(18 * scale)
    btn_h    = int(52 * scale)
    cta_x    = (W - cta_w) // 2
    draw.rounded_rectangle(
        [(cta_x - btn_pad, cta_y - int(8*scale)),
         (cta_x + cta_w + btn_pad, cta_y + btn_h)],
        radius=int(7 * scale), fill=(*ROSE_GOLD,)
    )
    draw.text((cta_x, cta_y), cta, font=fonts["cta"], fill=(*WHITE,))

    # Rodape
    footer = "@franciellycostamaster  |  +351 917 132 116  |  Braga, Portugal"
    ftr_w  = fonts["small"].getlength(footer)
    ftr_y  = H - int(38 * scale)
    draw.text(((W - ftr_w) // 2, ftr_y), footer, font=fonts["small"], fill=(*TEXT_SOFT,))

    # Guardar
    canvas.convert("RGB").save(str(output_path), "PNG", dpi=(300, 300))
    print(f"  OK  Guardado: {output_path}")
    return output_path


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--imagem",  default=None)
    parser.add_argument("--formato", default="square")
    parser.add_argument("--saida",   default=None)
    parser.add_argument("--demo",    action="store_true")
    args = parser.parse_args()

    size = FORMATS.get(args.formato, FORMATS["square"])
    ts   = int(time.time())

    hero = None
    if args.imagem and not args.demo:
        p = Path(args.imagem)
        if not p.exists():
            print(f"Imagem nao encontrada: {p}")
            sys.exit(1)
        hero = Image.open(p)

    out_path = Path(args.saida) if args.saida else (
        OUT_DIR / f"panfleto_{args.formato}_{ts}.png"
    )

    print(f"\nCompor panfleto - formato: {args.formato} ({size[0]}x{size[1]}px)")
    compose_flyer(hero, size, out_path)
    print(f"\nConcluido: {out_path}\n")


if __name__ == "__main__":
    main()
