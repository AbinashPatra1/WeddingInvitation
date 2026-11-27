#!/usr/bin/env python3
"""Builds the link-preview image (assets/og-preview.jpg, 1200 x 630) shown by WhatsApp, Facebook, iMessage, etc.

The tall poster (tools/source/preview-poster.webp) is shown whole in the middle, over a soft blurred copy of itself
that fills the wide frame. Kept under ~300 KB because WhatsApp ignores bigger preview images.

Run from the repo root:  python3 tools/make-preview-image.py        (needs Pillow)
"""
import os
from PIL import Image, ImageFilter, ImageEnhance

ROOT = os.path.join(os.path.dirname(__file__), "..")
W, H = 1200, 630

poster = Image.open(os.path.join(ROOT, "tools", "source", "preview-poster.webp")).convert("RGB")

# background: the poster blown up to fill the frame, blurred and a little lighter
scale = W / poster.width
bg = poster.resize((W, round(poster.height * scale)), Image.LANCZOS)
top = round((bg.height - H) * 0.42)
bg = bg.crop((0, top, W, top + H)).filter(ImageFilter.GaussianBlur(28))
bg = ImageEnhance.Brightness(bg).enhance(1.05)

# foreground: the whole poster, full height with a small margin
ph = H - 36
pw = round(poster.width * ph / poster.height)
fg = poster.resize((pw, ph), Image.LANCZOS)

# soft shadow behind it
shadow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
box = Image.new("RGBA", (pw, ph), (60, 40, 20, 130))
shadow.paste(box, ((W - pw) // 2 + 4, 18 + 8))
shadow = shadow.filter(ImageFilter.GaussianBlur(14))
out = bg.convert("RGBA")
out.alpha_composite(shadow)
out.paste(fg, ((W - pw) // 2, 18))

out = out.convert("RGB")
path = os.path.join(ROOT, "assets", "og-preview.jpg")
for q in (88, 82, 76, 70, 64):
    out.save(path, "JPEG", quality=q, optimize=True, progressive=True)
    if os.path.getsize(path) < 280 * 1024:
        break
print(f"wrote assets/og-preview.jpg  {W}x{H}  {os.path.getsize(path) // 1024} KB (quality {q})")
