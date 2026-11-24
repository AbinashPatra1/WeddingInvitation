#!/usr/bin/env python3
"""Prepares the watercolour paintings used in the middle of the event cards.

Sources (tools/source/):
  event-illustrations.webp   six light paintings on cream paper (sangeet, mehendi, haldi, wedding, reception)
  reception-dark.webp        dark reception painting (cream paper around a purple wash)
  wedding-dark.webp          dark wedding painting (full-bleed plum background)

For each painting the cream paper around it is removed (flood-filled from the edges) and the outline is
feathered into a soft, uneven shape. The script prints the median colour of each painting's faded edge: use
it as the card background colour (--ev-edge in css/styles.css) so the edge disappears completely.

Run from the repo root:  python3 tools/prepare-paintings.py      (needs Pillow + numpy)
"""
import os
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

ROOT = os.path.join(os.path.dirname(__file__), "..")
SRC = os.path.join(ROOT, "tools", "source")
OUT = os.path.join(ROOT, "assets", "events")

# crop boxes in the 1536x1024 light sheet: left, top, right, bottom
LIGHT_CROPS = {
    "sangeet":    (522, 44, 1022, 394),
    "mehendi":    (1026, 44, 1506, 394),
    "haldi":      (28, 520, 505, 884),
    "wedding":    (498, 516, 1014, 884),
    "reception":  (1026, 520, 1506, 884),
}
OUT_W = 640
SENTINEL = (255, 0, 255)


def feather_mask(w, h, seed, n=2.6, wobble=0.10, feather=0.34, blur=0.03, inset=0.97):
    """Soft, uneven super-ellipse alpha mask (float 0..1)."""
    rng = np.random.default_rng(seed)
    yy, xx = np.mgrid[0:h, 0:w]
    u = (xx - w / 2) / (w / 2)
    v = (yy - h / 2) / (h / 2)
    d = (np.abs(u) ** n + np.abs(v) ** n) ** (1 / n)
    noise = rng.normal(size=(7, 9))
    noise = (noise - noise.min()) / np.ptp(noise)
    noise = np.asarray(Image.fromarray((noise * 255).astype("uint8")).resize((w, h), Image.BICUBIC)).astype("float32") / 255.0
    noise = (noise - 0.5) * 2 * wobble
    t = np.clip((inset + noise - d) / feather, 0, 1)
    t = t * t * (3 - 2 * t)
    m = Image.fromarray((t * 255).astype("uint8")).filter(ImageFilter.GaussianBlur(w * blur))
    return np.asarray(m).astype("float32") / 255.0


def outside_paper(rgb, thresh):
    """Boolean mask of paper-coloured pixels connected to the image border."""
    work = rgb.copy()
    w, h = work.size
    seeds = [(x, y) for x in range(0, w, 5) for y in (0, h - 1)] + [(x, y) for y in range(0, h, 5) for x in (0, w - 1)]
    for s in seeds:
        if work.getpixel(s) != SENTINEL:
            ImageDraw.floodfill(work, s, SENTINEL, thresh=thresh)
    return np.all(np.asarray(work) == SENTINEL, axis=2)


def soften(mask_bool, grow, blur):
    m = Image.fromarray((mask_bool * 255).astype("uint8"))
    if grow:
        m = m.filter(ImageFilter.MaxFilter(grow * 2 + 1))
    m = m.filter(ImageFilter.GaussianBlur(blur))
    return np.asarray(m).astype("float32") / 255.0


def finish(rgb, alpha, width):
    im = rgb.convert("RGBA")
    im.putalpha(Image.fromarray((np.clip(alpha, 0, 1) * 255).astype("uint8")))
    return im.resize((width, round(im.height * width / im.width)), Image.LANCZOS)


def centre_on_content(im, pad, width):
    """Crop to the bounding box of the visible pixels (plus a margin) so the content sits dead centre."""
    a = np.asarray(im)[..., 3]
    ys, xs = np.where(a > 40)
    l, r, t, b = xs.min(), xs.max(), ys.min(), ys.max()
    mx, my = round((r - l) * pad), round((b - t) * pad)
    box = (max(l - mx, 0), max(t - my, 0), min(r + mx, im.width), min(b + my, im.height))
    c = im.crop(box)
    return c.resize((width, round(c.height * width / c.width)), Image.LANCZOS)


def edge_colour(im):
    a = np.asarray(im).astype("float32")
    al = a[..., 3] / 255.0
    band = (al > 0.35) & (al < 0.9)
    if band.sum() < 50:
        band = al > 0.35
    return tuple(int(v) for v in np.median(a[..., :3][band], axis=0))


def save(im, name):
    im.save(os.path.join(OUT, f"paint-{name}.webp"), "WEBP", quality=88, method=6)
    print(f"  {name:16s} edge colour rgb{edge_colour(im)}")


def light(sheet, name, box, seed):
    rgb = sheet.crop(box).convert("RGB")
    w, h = rgb.size
    outside = soften(outside_paper(rgb, 34), 2, 2.2)
    alpha = (1 - outside) * feather_mask(w, h, seed, n=3.0, wobble=0.08, feather=0.26, blur=0.02, inset=0.99)
    return rgb, alpha


def main():
    sheet = Image.open(os.path.join(SRC, "event-illustrations.webp"))
    print("light paintings:")
    done = {}
    for i, (name, box) in enumerate(LIGHT_CROPS.items()):
        if name in ("wedding", "reception"):  # replaced by the dark versions below
            continue
        rgb, alpha = light(sheet, name, box, seed=i + 11)
        done[name] = finish(rgb, alpha, OUT_W)
        save(done[name], name)

    # Sangeet & Mehendi card: the two paintings overlapped diagonally
    a = done["sangeet"].resize((450, round(done["sangeet"].height * 450 / done["sangeet"].width)), Image.LANCZOS)
    b = done["mehendi"].resize((430, round(done["mehendi"].height * 430 / done["mehendi"].width)), Image.LANCZOS)
    canvas = Image.new("RGBA", (680, 560), (0, 0, 0, 0))
    canvas.alpha_composite(b, (250, 200))
    canvas.alpha_composite(a, (0, 0))
    save(canvas, "sangeet-mehendi")

    print("dark paintings:")
    # reception: dark purple wash on cream paper -> drop the paper, keep the wash, then centre on the content
    rec = Image.open(os.path.join(SRC, "reception-dark.webp")).convert("RGB")
    w, h = rec.size
    outside = soften(outside_paper(rec, 60), 15, 7)
    paper = np.clip(((1 - outside) - 0.55) / 0.45, 0, 1) ** 1.5     # thin out the mauve fringe of the wash
    # the soft shape is applied afterwards (not thresholded) so the bottom edge fades smoothly instead of being cut
    alpha = paper * feather_mask(w, h, 5, n=2.8, wobble=0.07, feather=0.50, blur=0.035, inset=0.93)
    # the paper line under the tablecloth leaves ragged dark bumps: melt the bottom edge out gradually
    ramp = np.clip((0.95 - np.linspace(0, 1, h)) / 0.20, 0, 1)
    alpha = alpha * (ramp * ramp * (3 - 2 * ramp))[:, None]
    full = rec.convert("RGBA")
    full.putalpha(Image.fromarray((np.clip(alpha, 0, 1) * 255).astype("uint8")))
    save(centre_on_content(full, pad=0.05, width=820), "reception")

    # wedding: plum background all the way to the edge -> centre the mandap, then feather the rectangle away
    wed = Image.open(os.path.join(SRC, "wedding-dark.webp")).convert("RGB")
    bg = tuple(int(v) for v in np.median(np.concatenate([np.asarray(wed)[:30].reshape(-1, 3), np.asarray(wed)[-30:].reshape(-1, 3)]), axis=0))
    diff = np.linalg.norm(np.asarray(wed).astype("float32") - np.array(bg, dtype="float32"), axis=2)
    diff = np.asarray(Image.fromarray(np.clip(diff * 3, 0, 255).astype("uint8")).filter(ImageFilter.GaussianBlur(4))).astype("float32") / 3
    ys, xs = np.where(diff > 42)
    l, r, t, b2 = xs.min(), xs.max(), ys.min(), ys.max()
    cw, ch = round((r - l) * 1.3), round((b2 - t) * 1.3)
    canvas = Image.new("RGB", (cw, ch), bg)
    canvas.paste(wed, (round(cw / 2 - (l + r) / 2), round(ch / 2 - (t + b2) / 2)))
    alpha = feather_mask(cw, ch, 9, n=3.0, wobble=0.07, feather=0.30, blur=0.02, inset=1.0)
    save(finish(canvas, alpha, 820), "wedding")
    print("  wedding raw background rgb", bg)


if __name__ == "__main__":
    main()
