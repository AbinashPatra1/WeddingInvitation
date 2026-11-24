#!/usr/bin/env python3
"""Cuts the groom and bride out of their original photos, puts both on the same soft backdrop and gives both
the same colour grade, so the two portraits on the invitation look like a matching pair.

Sources (tools/source/):  portrait-groom.jpg, portrait-bride.jpg
Outputs (assets/):        groom.webp, bride.webp   (900 x 1200, 3:4 like the arch frame)

Needs:  pip install rembg onnxruntime pillow numpy      (the first run downloads a ~170 MB segmentation model)
Run from the repo root:   python3 tools/prepare-portraits.py
"""
import os
import numpy as np
from PIL import Image, ImageFilter, ImageEnhance

ROOT = os.path.join(os.path.dirname(__file__), "..")
SRC = os.path.join(ROOT, "tools", "source")
OUT = os.path.join(ROOT, "assets")
W, H = 900, 1200

# Where to cut each photo: left, top, right, bottom in the ORIGINAL pixels (same 3:4 shape for both).
# Both crops are chosen so the head is roughly the same size and sits at the same height.
CROPS = {
    "groom": (60, 640, 960, 1840),
    "bride": (128, 170, 1103, 1470),
}

# shared look
BG_CENTRE = (252, 240, 228)     # warm cream
BG_EDGE = (238, 205, 190)       # blush
TARGET_LUM = 0.47               # average brightness of the person
TARGET_SAT = 0.40               # average colour strength of the person


def cutout_mask(img):
    from rembg import new_session, remove
    session = new_session("u2net_human_seg")
    small = img.copy()
    small.thumbnail((900, 1600))
    # alpha matting refines the outline (hair, sleeves) so no old background colour survives at the edge
    mask = remove(small, session=session, only_mask=True, alpha_matting=True,
                  alpha_matting_foreground_threshold=235, alpha_matting_background_threshold=15, alpha_matting_erode_size=12)
    return mask.resize(img.size, Image.LANCZOS)


def clean_edge(mask):
    """Pull the edge in a hair and soften it, so no old background colour survives around the person."""
    m = mask.filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(1.6))
    a = np.asarray(m).astype("float32") / 255.0
    a = np.clip((a - 0.1) / 0.8, 0, 1)
    a = a * a * (3 - 2 * a)
    return a


def drop_green(crop, alpha):
    """Garden foliage that survives next to the hair is green; the people themselves never are, so remove it."""
    a = np.asarray(crop).astype("float32")
    green = a[..., 1] - np.maximum(a[..., 0], a[..., 2])
    keep = np.clip(1 - (green - 3) / 14, 0, 1)
    keep = np.asarray(Image.fromarray((keep * 255).astype("uint8")).filter(ImageFilter.GaussianBlur(1.6))).astype("float32") / 255.0
    return alpha * keep


def backdrop(w, h):
    yy, xx = np.mgrid[0:h, 0:w]
    d = np.sqrt(((xx - w * 0.5) / (w * 0.75)) ** 2 + ((yy - h * 0.42) / (h * 0.7)) ** 2)
    d = np.clip(d, 0, 1)[..., None]
    c0, c1 = np.array(BG_CENTRE, dtype="float32"), np.array(BG_EDGE, dtype="float32")
    bg = c0 * (1 - d) + c1 * d
    rng = np.random.default_rng(4)
    bg += rng.normal(0, 1.6, size=(h, w, 1))             # a whisper of paper grain
    return bg


def grade(person, alpha):
    """Bring both people to the same brightness / colour strength, then apply one shared warm tone."""
    a = np.asarray(person).astype("float32") / 255.0
    inside = alpha > 0.9
    lum = (a @ np.array([0.299, 0.587, 0.114], dtype="float32"))
    cur = float(lum[inside].mean())
    # exposure: a gamma that moves the average brightness to the target
    gamma = np.log(TARGET_LUM) / np.log(max(cur, 1e-3))
    gamma = float(np.clip(gamma, 0.55, 1.5))
    a = np.clip(a, 0, 1) ** gamma
    img = Image.fromarray((a * 255).astype("uint8"))
    # colour strength
    hsv = np.asarray(img.convert("HSV")).astype("float32") / 255.0
    cur_sat = float(hsv[..., 1][inside].mean())
    img = ImageEnhance.Color(img).enhance(float(np.clip(TARGET_SAT / max(cur_sat, 1e-3), 0.7, 1.6)))
    img = ImageEnhance.Contrast(img).enhance(1.06)
    # one shared warm tone (highlights a touch golden, shadows a touch plum)
    a = np.asarray(img).astype("float32") / 255.0
    a[..., 0] = np.clip(a[..., 0] * 1.035 + 0.006, 0, 1)
    a[..., 1] = np.clip(a[..., 1] * 1.005, 0, 1)
    a[..., 2] = np.clip(a[..., 2] * 0.955 + 0.012, 0, 1)
    return (a * 255).astype("float32"), cur, gamma


def make(name):
    img = Image.open(os.path.join(SRC, f"portrait-{name}.jpg")).convert("RGB")
    mask = cutout_mask(img)
    box = CROPS[name]
    crop = img.crop(box).resize((W, H), Image.LANCZOS)
    mcrop = mask.crop(box).resize((W, H), Image.LANCZOS)
    alpha = drop_green(crop, clean_edge(mcrop))
    person, cur, gamma = grade(crop, alpha)
    bg = backdrop(W, H)
    # a soft, warm glow right behind the person lifts them off the backdrop
    glow = np.asarray(Image.fromarray((alpha * 255).astype("uint8")).filter(ImageFilter.GaussianBlur(60))).astype("float32") / 255.0
    bg = bg + glow[..., None] * np.array([10, 6, 2], dtype="float32")
    out = person * alpha[..., None] + bg * (1 - alpha[..., None])
    Image.fromarray(np.clip(out, 0, 255).astype("uint8")).save(os.path.join(OUT, f"{name}.webp"), "WEBP", quality=88, method=6)
    print(f"  {name}: average brightness {cur:.2f} -> {TARGET_LUM}  (gamma {gamma:.2f})")


if __name__ == "__main__":
    for n in ("groom", "bride"):
        make(n)
    print("wrote assets/groom.webp and assets/bride.webp")
