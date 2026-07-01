# -*- coding: utf-8 -*-
"""
generate.py — Geração de imagens para Francielly Costa via Vertex AI Imagen 3.

USO:
  python generate.py --tipo panfleto_hero
  python generate.py --tipo brow_closeup --n 3
  python generate.py --listar

SETUP:
  pip install -r requirements.txt
  cp .env.example .env   # preenche com o teu projecto GCP
  # Credenciais: GOOGLE_APPLICATION_CREDENTIALS → service account JSON
  # (a mesma usada para o projecto Biogé serve se for o mesmo projecto GCP)
"""
import os
import sys
import io
import json
import time
import base64
import argparse
import urllib.request
import urllib.error
from pathlib import Path

# Força UTF-8 no Windows (cp1252 rebenta em caracteres especiais)
for _s in (sys.stdout, sys.stderr):
    try:
        _s.reconfigure(encoding="utf-8")
    except (AttributeError, ValueError):
        pass

try:
    from dotenv import load_dotenv
    load_dotenv(Path(__file__).parent / ".env", override=True)
except ImportError:
    pass  # python-dotenv opcional — pode usar variáveis de ambiente directas

from PIL import Image

HERE = Path(__file__).resolve().parent
OUT_DIR = HERE / "outputs"
OUT_DIR.mkdir(exist_ok=True)

# ─── CONFIGURAÇÃO ────────────────────────────────────────────────────────────
PROJECT    = os.getenv("GCP_PROJECT_ID", "")
LOCATION   = os.getenv("GCP_LOCATION_IMAGE", "us-central1")
MODEL      = os.getenv("FC_IMAGE_MODEL", "imagen-3.0-generate-001")
SA_PATH    = os.getenv("GOOGLE_APPLICATION_CREDENTIALS", "")
ASPECT     = os.getenv("FC_ASPECT_RATIO", "1:1")   # 1:1 | 9:16 | 16:9

# Retry (Vertex devolve 429 em quota preview)
RETRY_429  = int(os.getenv("FC_RETRY_429_SECS", "60"))
RETRY_NET  = int(os.getenv("FC_RETRY_NET_SECS", "15"))
MAX_TRIES  = int(os.getenv("FC_MAX_TRIES", "6"))

# ─── AUTENTICAÇÃO ─────────────────────────────────────────────────────────────

def _get_access_token() -> str:
    """
    Obtém o access token do Google via service account JWT.
    Usa apenas stdlib + a chave JSON em GOOGLE_APPLICATION_CREDENTIALS.
    """
    import json, time, base64, urllib.request, urllib.parse
    try:
        import cryptography  # noqa
        from cryptography.hazmat.primitives import hashes, serialization
        from cryptography.hazmat.primitives.asymmetric import padding
        HAVE_CRYPTO = True
    except ImportError:
        HAVE_CRYPTO = False

    sa_path = SA_PATH or ""
    if not sa_path or not Path(sa_path).exists():
        raise RuntimeError(
            f"GOOGLE_APPLICATION_CREDENTIALS não encontrado: {sa_path!r}\n"
            "Define a variável no .env ou como variável de ambiente."
        )

    sa = json.loads(Path(sa_path).read_text(encoding="utf-8"))

    if not HAVE_CRYPTO:
        # Fallback: usa gcloud se disponível
        import subprocess
        try:
            token = subprocess.check_output(
                ["gcloud", "auth", "print-access-token"], text=True
            ).strip()
            return token
        except Exception:
            raise RuntimeError(
                "Precisa de 'cryptography' (pip install cryptography) "
                "ou de ter 'gcloud' no PATH."
            )

    # JWT manual (não precisa de google-auth SDK)
    scope = "https://www.googleapis.com/auth/cloud-platform"
    now   = int(time.time())
    header  = base64.urlsafe_b64encode(
        json.dumps({"alg": "RS256", "typ": "JWT"}).encode()
    ).rstrip(b"=")
    payload = base64.urlsafe_b64encode(
        json.dumps({
            "iss": sa["client_email"],
            "scope": scope,
            "aud": "https://oauth2.googleapis.com/token",
            "iat": now, "exp": now + 3600,
        }).encode()
    ).rstrip(b"=")

    signing_input = header + b"." + payload
    private_key = serialization.load_pem_private_key(
        sa["private_key"].encode(), password=None
    )
    sig = base64.urlsafe_b64encode(
        private_key.sign(signing_input, padding.PKCS1v15(), hashes.SHA256())
    ).rstrip(b"=")

    jwt = (signing_input + b"." + sig).decode()
    data = urllib.parse.urlencode({
        "grant_type": "urn:ietf:params:oauth:grant-type:jwt-bearer",
        "assertion": jwt,
    }).encode()
    req  = urllib.request.Request(
        "https://oauth2.googleapis.com/token", data=data,
        headers={"Content-Type": "application/x-www-form-urlencoded"}
    )
    with urllib.request.urlopen(req) as r:
        return json.loads(r.read())["access_token"]


# ─── CHAMADA VERTEX AI IMAGEN ────────────────────────────────────────────────

def generate_images(
    prompt: str,
    negative_prompt: str = "",
    n: int = 1,
    aspect_ratio: str = None,
) -> list[Image.Image]:
    """
    Chama Vertex AI Imagen 3 e devolve lista de PIL Images.
    Tem retry nativo para 429 e erros de rede.
    """
    aspect_ratio = aspect_ratio or ASPECT
    project = PROJECT
    if not project and SA_PATH and Path(SA_PATH).exists():
        try:
            project = json.loads(Path(SA_PATH).read_text())["project_id"]
        except Exception:
            pass
    if not project:
        raise RuntimeError("GCP_PROJECT_ID não definido.")

    token    = _get_access_token()
    endpoint = (
        f"https://{LOCATION}-aiplatform.googleapis.com/v1/projects/{project}"
        f"/locations/{LOCATION}/publishers/google/models/{MODEL}:predict"
    )
    body = json.dumps({
        "instances": [{"prompt": prompt}],
        "parameters": {
            "sampleCount":      n,
            "negativePrompt":   negative_prompt,
            "aspectRatio":      aspect_ratio,
            "safetyFilterLevel": "block_some",
            "personGeneration": "allow_adult",
        }
    }).encode("utf-8")

    headers = {
        "Authorization":  f"Bearer {token}",
        "Content-Type":   "application/json; charset=utf-8",
    }

    for attempt in range(1, MAX_TRIES + 1):
        try:
            req = urllib.request.Request(endpoint, data=body, headers=headers)
            with urllib.request.urlopen(req, timeout=120) as r:
                resp = json.loads(r.read())
            images = []
            for pred in resp.get("predictions", []):
                b64 = pred.get("bytesBase64Encoded", "")
                if b64:
                    images.append(Image.open(io.BytesIO(base64.b64decode(b64))))
            return images

        except urllib.error.HTTPError as e:
            body_err = e.read().decode("utf-8", errors="replace")
            if e.code == 429:
                wait = RETRY_429 * attempt
                print(f"  ⏳ 429 quota — aguardar {wait}s (tentativa {attempt}/{MAX_TRIES})…")
                time.sleep(wait)
            else:
                raise RuntimeError(f"HTTP {e.code}: {body_err}") from e
        except (urllib.error.URLError, OSError) as e:
            wait = RETRY_NET * attempt
            print(f"  🔌 Erro de rede ({e}) — aguardar {wait}s…")
            time.sleep(wait)

    raise RuntimeError(f"Falhou após {MAX_TRIES} tentativas.")


# ─── MAIN CLI ────────────────────────────────────────────────────────────────

def main():
    from prompts import PROMPTS, NEGATIVE_PROMPT

    parser = argparse.ArgumentParser(
        description="Gerar imagens de marketing para Francielly Costa via Vertex AI Imagen 3."
    )
    parser.add_argument("--tipo",    default="panfleto_hero",
                        help="Tipo de imagem (ver --listar)")
    parser.add_argument("--listar",  action="store_true",
                        help="Listar os tipos disponíveis")
    parser.add_argument("--n",       type=int, default=2,
                        help="Número de variações a gerar (default: 2)")
    parser.add_argument("--aspeto",  default=None,
                        help="Aspect ratio: 1:1 | 9:16 | 16:9 (default no .env)")
    parser.add_argument("--prompt",  default=None,
                        help="Override total do prompt (avançado)")
    args = parser.parse_args()

    if args.listar:
        print("\nTipos disponíveis:\n")
        for k, v in PROMPTS.items():
            desc = v["description"] if isinstance(v, dict) else k
            print(f"  {k:<25} — {desc}")
        print()
        return

    tipo = args.tipo
    if args.prompt:
        positive = args.prompt
    elif tipo in PROMPTS:
        entry = PROMPTS[tipo]
        positive = entry["positive"] if isinstance(entry, dict) else entry
    else:
        print(f"Tipo '{tipo}' não encontrado. Usa --listar para ver os disponíveis.")
        sys.exit(1)

    print(f"\n📸  Gerar {args.n} imagem(ns) — tipo: {tipo}")
    print(f"    Modelo: {MODEL}  |  Aspeto: {args.aspeto or ASPECT}")
    print(f"    Prompt: {positive[:120]}…\n")

    images = generate_images(
        prompt=positive,
        negative_prompt=NEGATIVE_PROMPT,
        n=args.n,
        aspect_ratio=args.aspeto,
    )

    saved = []
    ts = int(time.time())
    for i, img in enumerate(images):
        fname = OUT_DIR / f"{tipo}_{ts}_{i+1}.png"
        img.save(fname, "PNG")
        saved.append(fname)
        print(f"  ✔  Guardado: {fname}")

    print(f"\n✅  {len(saved)} imagem(ns) em: {OUT_DIR}\n")


if __name__ == "__main__":
    main()
