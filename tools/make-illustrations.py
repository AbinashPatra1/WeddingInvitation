#!/usr/bin/env python3
"""Generates the scattered, event-specific border strips around each event card (assets/events/frame-*.svg).
Run from the repo root:  python3 tools/make-illustrations.py"""
import math, random, os

OUT = os.path.join(os.path.dirname(__file__), "..", "assets", "events")
W, H = 400, 800
os.makedirs(OUT, exist_ok=True)

def svg(body, defs=""):
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" '
            f'preserveAspectRatio="xMidYMax slice"><defs>{defs}</defs>{body}</svg>')

def write(name, s):
    with open(os.path.join(OUT, name), "w", encoding="utf-8") as f:
        f.write(s)

def star(cx, cy, r, fill, op=1):
    p = [(cx, cy - r), (cx + r * .22, cy - r * .22), (cx + r, cy), (cx + r * .22, cy + r * .22),
         (cx, cy + r), (cx - r * .22, cy + r * .22), (cx - r, cy), (cx - r * .22, cy - r * .22)]
    pts = " ".join(f"{x:.1f},{y:.1f}" for x, y in p)
    return f'<polygon points="{pts}" fill="{fill}" opacity="{op}"/>'

# Reusable marigold flower (symbol, drawn around 0,0 radius ~16)
def marigold_symbol(id_="mg", c1="#f59e0b", c2="#fbbf24", core="#b45309"):
    petals = "".join(
        f'<ellipse cx="0" cy="-9" rx="4.6" ry="8.5" fill="{c1 if i % 2 else c2}" transform="rotate({i*30})"/>'
        for i in range(12))
    inner = "".join(
        f'<ellipse cx="0" cy="-5" rx="3.4" ry="5.4" fill="{c2 if i % 2 else c1}" transform="rotate({i*30+15})"/>'
        for i in range(12))
    return f'<symbol id="{id_}" viewBox="-18 -18 36 36" overflow="visible">{petals}{inner}<circle r="3.4" fill="{core}"/></symbol>'

def garland(points, sym="mg", size=24, rot=True):
    return "".join(
        f'<use href="#{sym}" x="{x-size/2:.1f}" y="{y-size/2:.1f}" width="{size}" height="{size}" '
        f'transform="rotate({(i*37)%360} {x:.1f} {y:.1f})"/>' for i, (x, y) in enumerate(points))

def curve_pts(x0, y0, x1, y1, sag, n):
    pts = []
    for i in range(n):
        t = i / (n - 1)
        pts.append((x0 + (x1 - x0) * t, y0 + (y1 - y0) * t + math.sin(math.pi * t) * sag))
    return pts

# =====================================================================================
#  Border decoration: scattered, event-specific motifs (strips for the band around the card)
#  The pastel paintings in the middle of the cards are cut from tools/source (prepare-paintings.py).
# =====================================================================================
BAND = 26

def glow_defs(col):
    return (f'<radialGradient id="g" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="{col}" stop-opacity=".95"/>'
            f'<stop offset=".35" stop-color="{col}" stop-opacity=".45"/><stop offset="1" stop-color="{col}" stop-opacity="0"/></radialGradient>')

def m_flower(x, y, s, rot, c1, c2, core, n=5, edge=None):
    stroke = f' stroke="{edge}" stroke-width=".6"' if edge else ""
    pet = "".join(f'<ellipse cx="0" cy="{-s*.5:.1f}" rx="{s*.3:.1f}" ry="{s*.5:.1f}" fill="{c1 if i%2 else c2}"{stroke} transform="rotate({i*360/n:.0f})"/>' for i in range(n))
    return f'<g transform="translate({x:.1f} {y:.1f}) rotate({rot:.0f})">{pet}<circle r="{s*.2:.1f}" fill="{core}"/></g>'

def m_ring(x, y, s, rot):
    return (f'<g transform="translate({x:.1f} {y:.1f}) rotate({rot:.0f})"><circle r="{s*.42:.1f}" fill="none" stroke="#c99a3c" stroke-width="{s*.16:.1f}"/>'
            f'<circle r="{s*.42:.1f}" fill="none" stroke="#fbeab8" stroke-width="{s*.05:.1f}" opacity=".8"/>'
            f'<polygon points="0,{-s*.62:.1f} {s*.14:.1f},{-s*.48:.1f} 0,{-s*.3:.1f} {-s*.14:.1f},{-s*.48:.1f}" fill="#eaf6ff" stroke="#c99a3c" stroke-width=".7"/></g>')

def m_double_ring(x, y, s, rot):
    return (f'<g transform="translate({x:.1f} {y:.1f}) rotate({rot:.0f})"><circle cx="{-s*.22:.1f}" r="{s*.34:.1f}" fill="none" stroke="#c99a3c" stroke-width="{s*.13:.1f}"/>'
            f'<circle cx="{s*.22:.1f}" r="{s*.34:.1f}" fill="none" stroke="#e2bd6a" stroke-width="{s*.13:.1f}"/></g>')

def m_dhol(x, y, s, rot):
    w, h = s * 1.5, s * .8
    ropes = "".join(f'<path d="M{-w/2 + k*w/6:.1f} {-h/2:.1f} l{w/12:.1f} {h:.1f}" stroke="#7a4220" stroke-width=".7"/>' for k in range(1, 6))
    return (f'<g transform="translate({x:.1f} {y:.1f}) rotate({rot:.0f})">'
            f'<path d="M{-w/2:.1f} {-h*.42:.1f} C{-w*.2:.1f} {-h*.6:.1f} {w*.2:.1f} {-h*.6:.1f} {w/2:.1f} {-h*.42:.1f} L{w/2:.1f} {h*.42:.1f} C{w*.2:.1f} {h*.6:.1f} {-w*.2:.1f} {h*.6:.1f} {-w/2:.1f} {h*.42:.1f}Z" fill="#c9722f"/>'
            f'{ropes}<ellipse cx="{-w/2:.1f}" cy="0" rx="{h*.18:.1f}" ry="{h*.42:.1f}" fill="#f6dcb4"/><ellipse cx="{w/2:.1f}" cy="0" rx="{h*.18:.1f}" ry="{h*.42:.1f}" fill="#f6dcb4"/>'
            f'<rect x="{-w*.12:.1f}" y="{-h*.52:.1f}" width="{w*.1:.1f}" height="{h*1.04:.1f}" fill="#e0407f" opacity=".9"/></g>')

def m_light(x, y, s):
    return (f'<circle cx="{x:.1f}" cy="{y:.1f}" r="{s*1.1:.1f}" fill="url(#g)"/>'
            f'<circle cx="{x:.1f}" cy="{y:.1f}" r="{s*.26:.1f}" fill="#fff7d6"/>')

def m_petal(x, y, s, rot, col):
    return f'<ellipse cx="{x:.1f}" cy="{y:.1f}" rx="{s*.2:.1f}" ry="{s*.45:.1f}" fill="{col}" opacity=".9" transform="rotate({rot:.0f} {x:.1f} {y:.1f})"/>'

THEMES = {
    "engagement": dict(seed=3, glow="#fff1c9", items=[
        ("ring", 4), ("dring", 2), ("spark", 3), ("petal", 3)], petal="#f4a6b8", spark="#fffdf2"),
    "sangeet": dict(seed=7, glow="#ffe9a3", items=[
        ("dhol", 3), ("flower", 5), ("spark", 2), ("light", 2)], petal="#e0407f", spark="#fff4cc"),
    "haldi": dict(seed=11, step=(30, 52), glow="#fff3b0", items=[
        ("flower", 8), ("petal", 3), ("spark", 1)], petal="#fbbf24", spark="#fffbe0"),
    "wedding": dict(seed=17, glow="#ffd88a", items=[
        ("light", 7), ("spark", 3)], petal="#f59e0b", spark="#ffe9b0"),
    "reception": dict(seed=23, glow="#ffe3a8", items=[
        ("light", 5), ("flower", 3), ("spark", 2)], petal="#d9c2f5", spark="#fff6d0"),
}

def pick(rnd, items):
    pool = [k for k, w in items for _ in range(w)]
    return rnd.choice(pool)

def draw_item(kind, name, rnd, x, y):
    t = THEMES[name]
    s = rnd.uniform(10, 17)
    rot = rnd.uniform(0, 360)
    if kind == "ring":   return m_ring(x, y, s * .95, rnd.uniform(-30, 30))
    if kind == "dring":  return m_double_ring(x, y, s * 1.15, rnd.uniform(-40, 40))
    if kind == "dhol":   return m_dhol(x, y, s * .95, rnd.uniform(-40, 40))
    if kind == "light":  return m_light(x, y, rnd.uniform(5, 9))
    if kind == "spark":  return star(x, y, rnd.uniform(3, 5.5), t["spark"], .95)
    if kind == "petal":  return m_petal(x, y, s, rot, t["petal"])
    if kind == "flower":
        if name == "sangeet":
            return m_flower(x, y, s * .9, rot, "#d6204f", "#ef5a7e", "#ffd35c", 5)
        if name == "haldi":
            return m_flower(x, y, s, rot, "#f9b414", "#ffd23f", "#d97706", 8, "#d98a06")
        return m_flower(x, y, s * .95, rot, "#ffffff", "#e6dafb", "#f6dd9a", 6)   # reception
    return ""

ANIM_CLASS = {"light": "tw", "spark": "sp", "flower": "sw", "ring": "sw", "dring": "sw", "dhol": "sw", "petal": "dr"}
SVG_CSS = (
    ".tw,.sp,.sw,.dr{transform-box:fill-box;transform-origin:center}"
    ".tw{animation:tw 3s ease-in-out infinite}"
    "@keyframes tw{0%,100%{opacity:.3}50%{opacity:1}}"
    ".sp{animation:sp 2.6s ease-in-out infinite}"
    "@keyframes sp{0%,100%{opacity:.2;transform:scale(.55)}50%{opacity:1;transform:scale(1.2)}}"
    ".sw{animation:sw 4s ease-in-out infinite}"
    "@keyframes sw{0%,100%{transform:rotate(-13deg)}50%{transform:rotate(13deg)}}"
    ".dr{animation:dr 5s ease-in-out infinite}"
    "@keyframes dr{0%,100%{transform:translateY(-2px) rotate(-22deg)}50%{transform:translateY(4px) rotate(24deg)}}"
    "@media (prefers-reduced-motion:reduce){.tw,.sp,.sw,.dr{animation:none}}"
)

def animate(kind, rnd, svg_item):
    cls = ANIM_CLASS.get(kind)
    if not cls or not svg_item:
        return svg_item
    dur = rnd.uniform(2.4, 5.6)
    delay = -rnd.uniform(0, dur)
    return f'<g class="{cls}" style="animation-duration:{dur:.1f}s;animation-delay:{delay:.1f}s">{svg_item}</g>'


def strip(name, length, vertical):
    t = THEMES[name]
    rnd = random.Random(t["seed"] * (3 if vertical else 1))
    body, pos = "", 16
    while pos < length - 16:
        y = BAND / 2 + rnd.uniform(-4.5, 4.5)
        kind = pick(rnd, t["items"])
        body += animate(kind, rnd, draw_item(kind, name, rnd, pos, y))
        pos += rnd.uniform(*t.get("step", (17, 34)))
    if vertical:
        w, h = BAND, length
        inner = f'<g transform="translate({BAND} 0) rotate(90)">{body}</g>'
    else:
        w, h = length, BAND
        inner = body
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" width="{w}" height="{h}">'
            f'<defs>{glow_defs(t["glow"])}<style>{SVG_CSS}</style></defs>{inner}</svg>')

for nm in THEMES:
    write(f"frame-{nm}-h.svg", strip(nm, 480, False))
    write(f"frame-{nm}-v.svg", strip(nm, 880, True))
print("border strips done")
