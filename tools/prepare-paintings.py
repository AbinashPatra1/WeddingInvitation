#!/usr/bin/env python3
"""Cuts the six watercolour illustrations out of tools/source/event-illustrations.webp,
softens their edges into an uneven feathered shape and writes assets/events/paint-*.webp.
Run from the repo root:  python3 tools/prepare-paintings.py"""
import os
import numpy as np
from PIL import Image, ImageFilter

ROOT = os.path.join(os.path.dirname(__file__), "..")
SRC = os.path.join(ROOT, "tools", "source", "event-illustrations.webp")
OUT = os.path.join(ROOT, "assets", "events")

# (name, crop box in the 1536x1024 source: left, top, right, bottom)
CROPS = {
    "engagement": (6, 30, 500, 398),
    "sangeet":    (522, 44, 1022, 394),
    "mehendi":    (1026, 44, 1506, 394),
    "haldi":      (28, 520, 505, 884),
    "wedding":    (498, 516, 1014, 884),
    "reception":  (1026, 520, 1506, 884),
}
OUT_W = 620  # px, ~2x the largest on-screen width

def feather_mask(w, h, seed, n=2.6, wobble=0.10, feather=0.34):
    """Soft, uneven super-ellipse alpha mask."""
    rng = np.random.default_rng(seed)
    yy, xx = np.mgrid[0:h, 0:w]
    u = (xx - w / 2) / (w / 2)
    v = (yy - h / 2) / (h / 2)
    d = (np.abs(u) ** n + np.abs(v) ** n) ** (1 / n)
    noise = rng.normal(size=(7, 9))
    noise = np.asarray(Image.fromarray(((noise - noise.min()) / np.ptp(noise) * 255).astype("uint8"))
                       .resize((w, h), Image.BICUBIC)).astype("float32") / 255.0
    noise = (noise - 0.5) * 2 * wobble
    t = np.clip((0.97 + noise - d) / feather, 0, 1)
    t = t * t * (3 - 2 * t)  # smoothstep
    m = Image.fromarray((t * 255).astype("uint8")).filter(ImageFilter.GaussianBlur(w * 0.03))
    return m

def cut(src, box, seed):
    im = src.crop(box).convert("RGB")
    w, h = im.size
    im.putalpha(feather_mask(w, h, seed))
    return im

def resized(im, width):
    return im.resize((width, round(im.height * width / im.width)), Image.LANCZOS)

def save(im, name):
    im.save(os.path.join(OUT, f"paint-{name}.webp"), "WEBP", quality=88, method=6)

def main():
    src = Image.open(SRC)
    parts = {name: cut(src, box, seed=i + 11) for i, (name, box) in enumerate(CROPS.items())}
    for name in ("engagement", "haldi", "wedding", "reception", "mehendi", "sangeet"):
        save(resized(parts[name], OUT_W), name)
    # "Sangeet & Mehendi" card: the two paintings overlapped diagonally
    a, b = resized(parts["sangeet"], 440), resized(parts["mehendi"], 420)
    canvas = Image.new("RGBA", (660, 560), (0, 0, 0, 0))
    canvas.alpha_composite(b, (240, 200))
    canvas.alpha_composite(a, (0, 0))
    save(canvas, "sangeet-mehendi")
    print("wrote paintings to", OUT)

if __name__ == "__main__":
    main()
