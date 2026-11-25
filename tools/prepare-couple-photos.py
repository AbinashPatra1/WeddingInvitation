#!/usr/bin/env python3
"""Prepares the two couple photos (watercolour portraits with torn, blurry borders).

Sources (tools/source/):  couple-groom.webp, couple-bride.webp
Outputs (assets/):
  groom.webp, bride.webp           the photos. The white paper around them is tinted to the page colour (IVORY), so the
                                   torn / blurry border shows against the page and never as a white box.
  back-groom.webp, back-bride.webp the same torn outline filled with warm paper: the back of the card when it is flipped.

A small translucent star (a generator watermark) sits on the bottom-right of both pictures; it is painted out first.

Needs: pip install pillow numpy      Run from the repo root:  python3 tools/prepare-couple-photos.py
"""
import os
import numpy as np
from PIL import Image, ImageFilter

ROOT = os.path.join(os.path.dirname(__file__), "..")
SRC = os.path.join(ROOT, "tools", "source")
OUT = os.path.join(ROOT, "assets")
W, H = 900, 1200
IVORY = np.array([251, 247, 240], dtype="float32")     # --ivory in css/styles.css (background of the couple section)
STAR_WINDOW = (1320, 1830, 1480, 1985)                  # left, top, right, bottom in the 1493 x 2000 sources


def blur(a, r):
    return np.asarray(Image.fromarray(np.clip(a, 0, 255).astype("uint8")).filter(ImageFilter.GaussianBlur(r))).astype("float32")


def star_mask(img):
    """The star is lighter than its surroundings; find it inside a small window."""
    a = img.astype("float32")
    l, t, r, b = STAR_WINDOW
    lum = a.mean(axis=2)
    local = np.asarray(Image.fromarray(lum.astype("uint8")).filter(ImageFilter.GaussianBlur(26))).astype("float32")
    lift = lum - local
    m = np.zeros(lum.shape, dtype="float32")
    sub = (lift[t:b, l:r] > 9) & (lum[t:b, l:r] < 246)          # lighter than around it, but not the white paper
    m[t:b, l:r] = sub
    m = np.asarray(Image.fromarray((m * 255).astype("uint8")).filter(ImageFilter.MaxFilter(13)).filter(ImageFilter.GaussianBlur(3))).astype("float32") / 255.0
    return m


def remove_star(img):
    a = img.astype("float32")
    m = star_mask(img)
    if m.max() == 0:
        return img
    paint = (a.min(axis=2) < 225)                          # only real paint may feed the fill, never the white paper
    keep = ((m <= 0.2) & paint).astype("float32")[..., None]
    # smooth fill from the pixels around the hole ...
    def fill_from_around(r):
        num = np.stack([blur(a[..., c] * keep[..., 0], r) for c in range(3)], axis=2)
        den = blur(keep[..., 0] * 255, r)[..., None] / 255.0
        return num / np.maximum(den, 0.02), den
    near, den_near = fill_from_around(14)
    far, _ = fill_from_around(60)                          # the middle of the hole has no neighbours at radius 14
    w = np.clip(den_near / 0.3, 0, 1)
    base = near * w + far * (1 - w)
    # ... plus real texture borrowed from the neighbouring paint, so the patch is not flat
    shifted = np.roll(a, 115, axis=0)                      # the paint just above the star
    hp = shifted - np.stack([blur(shifted[..., c], 6) for c in range(3)], axis=2)
    hp = np.clip(hp, -22, 22)                              # texture only, never a dark or bright blob
    fill = np.clip(base + hp * 0.8, 0, 255)
    mm = m[..., None]
    return np.clip(a * (1 - mm) + fill * mm, 0, 255).astype("uint8")


BRIGHTEN = {"groom": 1.14, "bride": 1.0}   # exposure gain; the groom's photo is darker than the bride's


def brighten(img, gain):
    """Lift the painting only (shadows and mid-tones), leaving the white paper border alone."""
    if gain == 1.0:
        return img
    a = img.astype("float32") / 255.0
    lifted = np.clip(a ** (1.0 / gain), 0, 1)
    paper = np.clip((a.min(axis=2, keepdims=True) - 0.85) / 0.1, 0, 1)
    return (np.clip(lifted * (1 - paper) + a * paper, 0, 1) * 255).astype("uint8")


def tint_paper(img):
    """Multiply by the page colour: white becomes IVORY, the painting barely changes."""
    a = img.astype("float32") / 255.0
    return np.clip(a * IVORY, 0, 255).astype("uint8")


def torn_shape(img):
    """Soft alpha of the torn outline (anything that is not near-white paper)."""
    a = img.astype("float32")
    nonwhite = (a.min(axis=2) < 244).astype("float32") * 255
    m = Image.fromarray(nonwhite.astype("uint8")).filter(ImageFilter.MaxFilter(9)).filter(ImageFilter.MinFilter(9)).filter(ImageFilter.GaussianBlur(5))
    s = np.asarray(m).astype("float32") / 255.0
    s = np.clip((s - 0.25) / 0.6, 0, 1)
    return s * s * (3 - 2 * s)


def paper(w, h):
    yy, xx = np.mgrid[0:h, 0:w]
    t = np.clip((yy / h) * 0.8 + (xx / w) * 0.2, 0, 1)[..., None]
    c0, c1, c2 = np.array([255, 248, 232]), np.array([245, 230, 196]), np.array([248, 226, 214])
    bg = np.where(t < 0.55, c0 * (1 - t / 0.55) + c1 * (t / 0.55), c1 * (1 - (t - 0.55) / 0.45) + c2 * ((t - 0.55) / 0.45))
    return bg.astype("float32")


def make(name):
    img = np.asarray(Image.open(os.path.join(SRC, f"couple-{name}.webp")).convert("RGB"))
    clean = remove_star(img)
    shape = torn_shape(clean)
    photo = Image.fromarray(tint_paper(brighten(clean, BRIGHTEN[name]))).resize((W, H), Image.LANCZOS)
    photo.save(os.path.join(OUT, f"{name}.webp"), "WEBP", quality=88, method=6)
    sh = Image.fromarray((shape * 255).astype("uint8")).resize((W, H), Image.LANCZOS)
    back = Image.fromarray(np.clip(paper(W, H), 0, 255).astype("uint8")).convert("RGBA")
    back.putalpha(sh)
    back.save(os.path.join(OUT, f"back-{name}.webp"), "WEBP", quality=88, method=6)
    print(f"  {name}: photo + back written")


if __name__ == "__main__":
    for n in ("groom", "bride"):
        make(n)
