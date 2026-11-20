#!/usr/bin/env python3
"""Generates the five event-card illustrations into assets/events/*.svg.
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

# ------------------------------------------------------------------ ENGAGEMENT
def engagement():
    defs = '''
<linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fdeee6"/><stop offset=".5" stop-color="#f9d3c5"/><stop offset="1" stop-color="#f1a994"/></linearGradient>
<radialGradient id="sun" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#fff6d6"/><stop offset=".5" stop-color="#ffe0a6" stop-opacity=".8"/><stop offset="1" stop-color="#ffd0a0" stop-opacity="0"/></radialGradient>
<linearGradient id="stone" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#8e4b44"/><stop offset=".55" stop-color="#6f3633"/><stop offset="1" stop-color="#5a2b2a"/></linearGradient>
<linearGradient id="ring" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f6dd9a"/><stop offset="1" stop-color="#b48a42"/></linearGradient>''' + marigold_symbol("mg", "#fb923c", "#fbbf24")
    b = '<rect width="400" height="800" fill="url(#sky)"/>'
    b += '<circle cx="200" cy="470" r="230" fill="url(#sun)"/>'
    b += '<circle cx="200" cy="470" r="70" fill="#fff4cf" opacity=".85"/>'
    # distant hills
    b += '<path d="M0 690 C80 650 140 680 200 664 C270 646 330 680 400 656 L400 800 L0 800Z" fill="#e8998a" opacity=".7"/>'
    # temple (rekha deul)
    b += '<path d="M146 708 C146 570 168 450 187 388 L213 388 C232 450 254 570 254 708Z" fill="url(#stone)"/>'
    for i, y in enumerate(range(420, 706, 22)):
        t = (y - 388) / 320
        half = 13 + 41 * (t ** 0.8)
        b += f'<path d="M{200-half-3:.1f} {y} h{2*half+6:.1f}" stroke="#a45f55" stroke-width="3" opacity=".55"/>'
    b += '<ellipse cx="200" cy="380" rx="23" ry="8" fill="#8e4b44"/><ellipse cx="200" cy="371" rx="15" ry="6" fill="#a45f55"/>'
    b += '<ellipse cx="200" cy="358" rx="7" ry="10" fill="#e6b95b"/><path d="M200 348 V318" stroke="#5a2b2a" stroke-width="2"/>'
    b += '<path d="M200 318 l22 8 -22 8z" fill="#d6492f"/>'
    # jagamohana (porch)
    b += '<path d="M84 724 L84 690 L120 650 L280 650 L316 690 L316 724Z" fill="#74393a"/>'
    b += '<path d="M96 690 L128 656 L272 656 L304 690Z" fill="#8e4b44"/>'
    b += '<path d="M124 668 L150 640 L250 640 L276 668Z" fill="#74393a"/><path d="M158 642 L178 622 L222 622 L242 642Z" fill="#8e4b44"/>'
    b += '<path d="M176 724 V698 a24 24 0 0 1 48 0 V724Z" fill="#ffd98a"/>'
    b += '<rect x="60" y="722" width="280" height="12" fill="#5a2b2a"/>'
    # ground + diyas
    b += '<path d="M0 736 C100 722 300 722 400 736 V800 H0Z" fill="#c9786a"/>'
    for x in (70, 120, 280, 330):
        b += f'<ellipse cx="{x}" cy="770" rx="16" ry="6" fill="#8a3f33"/><ellipse cx="{x}" cy="767" rx="11" ry="3.5" fill="#ffcf66"/>'
        b += f'<path d="M{x} 762 c-5 -8 -2 -13 0 -17 c2 4 5 9 0 17z" fill="#ff8a30"/>'
    for (x, y, r) in [(90, 120, 9), (320, 140, 11), (110, 250, 7), (300, 260, 8), (250, 90, 6), (150, 80, 7)]:
        b += star(x, y, r, '#fff7dc', .95)
    # garland swag
    b += garland(curve_pts(-10, 8, 410, 8, 46, 18), "mg", 28)
    return svg(b, defs)

# ------------------------------------------------------------------ SANGEET & MEHENDI
def sangeet():
    rnd = random.Random(9)
    defs = '''
<linearGradient id="bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#12413a"/><stop offset=".6" stop-color="#1b5c4f"/><stop offset="1" stop-color="#7a1f4d"/></linearGradient>
<radialGradient id="glow" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#ffe9a3" stop-opacity=".95"/><stop offset="1" stop-color="#ffe9a3" stop-opacity="0"/></radialGradient>
<radialGradient id="magenta" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#e0407f" stop-opacity=".6"/><stop offset="1" stop-color="#e0407f" stop-opacity="0"/></radialGradient>
<linearGradient id="skin" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f7d8b8"/><stop offset="1" stop-color="#e9b891"/></linearGradient>'''
    b = '<rect width="400" height="800" fill="url(#bg)"/><circle cx="200" cy="640" r="260" fill="url(#magenta)"/>'
    # string lights
    for k, (y0, sag) in enumerate([(24, 40), (74, 34)]):
        pts = curve_pts(-10, y0, 410, y0 + (8 if k else 0), sag, 14)
        d = "M" + " L".join(f"{x:.1f} {y:.1f}" for x, y in pts)
        b += f'<path d="{d}" stroke="#0a2a25" stroke-width="2" fill="none"/>'
        for (x, y) in pts[1:-1]:
            b += f'<circle cx="{x:.1f}" cy="{y+9:.1f}" r="22" fill="url(#glow)" opacity=".55"/><circle cx="{x:.1f}" cy="{y+9:.1f}" r="5.5" fill="#fff0b8"/>'
    # music notes
    def note(x, y, s, rot=0):
        return (f'<g transform="translate({x} {y}) rotate({rot}) scale({s})" fill="#ffd9a0" opacity=".9">'
                '<ellipse cx="0" cy="0" rx="9" ry="6.5" transform="rotate(-20)"/><rect x="6.5" y="-34" width="3" height="34"/>'
                '<path d="M9.5 -34 c10 3 14 10 11 20 c-1 -8 -5 -11 -11 -12z"/></g>')
    b += note(70, 250, 1.1, -10) + note(320, 210, 1.3, 8) + note(95, 345, .9, 6) + note(305, 330, 1, -8)
    # paisleys
    def paisley(x, y, s, rot, col):
        return (f'<g transform="translate({x} {y}) rotate({rot}) scale({s})"><path d="M0 -26 C22 -22 26 14 6 26 C-14 36 -30 12 -14 -4 C-4 -14 6 -8 4 0 C2 8 -6 6 -6 2" '
                f'fill="{col}" opacity=".9"/><circle cx="6" cy="-10" r="3.2" fill="#fff4cc"/></g>')
    b += paisley(60, 470, 1.3, -20, "#f0b429") + paisley(345, 450, 1.1, 25, "#e0407f") + paisley(40, 560, .9, 10, "#e0407f") + paisley(365, 560, 1, -15, "#f0b429")
    # dholak
    b += '<g transform="translate(70 705) rotate(-14)"><ellipse cx="0" cy="0" rx="62" ry="30" fill="#9a4b1e"/><rect x="-62" y="-30" width="124" height="60" rx="0" fill="#b9602a" opacity="0"/>'
    b += '<path d="M-62 0 a62 30 0 0 1 124 0 a62 30 0 0 1 -124 0" fill="#c9722f"/><ellipse cx="-62" cy="0" rx="12" ry="28" fill="#f2dcb4"/><ellipse cx="62" cy="0" rx="12" ry="28" fill="#f2dcb4"/>'
    for i in range(-5, 6):
        b += f'<path d="M{i*10} -29 l{5} 58 M{i*10+5} -29 l-5 58" stroke="#ffd98a" stroke-width="2" opacity=".85"/>'
    b += '</g>'
    # henna hand
    hand = '<g transform="translate(200 640) scale(1.5)">'
    hand += '<path d="M-40 20 C-70 -4 -78 -34 -62 -44 C-50 -50 -40 -34 -36 -22 Z" fill="url(#skin)" stroke="#7a2e1d" stroke-width="1.6"/>'
    for (x, h) in [(-34, 82), (-12, 98), (10, 94), (32, 76)]:
        hand += f'<rect x="{x-9}" y="{-h}" width="18" height="{h+30}" rx="9" fill="url(#skin)" stroke="#7a2e1d" stroke-width="1.6"/>'
    hand += '<path d="M-44 -4 H44 V62 C44 82 30 96 0 96 C-30 96 -44 82 -44 62Z" fill="url(#skin)" stroke="#7a2e1d" stroke-width="1.6"/>'
    # henna patterns
    hn = '#7a2e1d'
    hand += f'<g fill="none" stroke="{hn}" stroke-width="1.5" stroke-linecap="round">'
    hand += '<circle cx="0" cy="44" r="22"/><circle cx="0" cy="44" r="14"/><circle cx="0" cy="44" r="6" fill="#7a2e1d"/>'
    for i in range(12):
        a = i * 30 * math.pi / 180
        hand += f'<path d="M{math.cos(a)*22:.1f} {44+math.sin(a)*22:.1f} q{math.cos(a)*8:.1f} {math.sin(a)*8:.1f} {math.cos(a+.3)*12:.1f} {math.sin(a+.3)*12:.1f}"/>'
    for (x, h) in [(-34, 82), (-12, 98), (10, 94), (32, 76)]:
        for j in range(int(h / 14)):
            hand += f'<circle cx="{x}" cy="{-h+16+j*14}" r="1.9" fill="{hn}" stroke="none"/>'
        hand += f'<path d="M{x} {-h+10} V10"/>'
    hand += '<path d="M-40 6 q10 14 0 28 M40 6 q-10 14 0 28 M-30 78 q30 22 60 0"/></g></g>'
    b += hand
    # sparkles
    for _ in range(14):
        b += star(rnd.randint(20, 380), rnd.randint(130, 600), rnd.choice([3, 4, 5]), "#fff4cc", .8)
    b += '<path d="M0 768 C120 752 280 752 400 768 V800 H0Z" fill="#4d1030"/>'
    return svg(b, defs)

# ------------------------------------------------------------------ HALDI
def haldi():
    rnd = random.Random(4)
    defs = '''
<linearGradient id="bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff4c2"/><stop offset=".55" stop-color="#ffdd6e"/><stop offset="1" stop-color="#f7b733"/></linearGradient>
<radialGradient id="rays" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#fffbe0"/><stop offset="1" stop-color="#fffbe0" stop-opacity="0"/></radialGradient>
<linearGradient id="brass" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#9a6a1c"/><stop offset=".4" stop-color="#f2cf73"/><stop offset="1" stop-color="#8a5c14"/></linearGradient>
<linearGradient id="paste" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffc21a"/><stop offset="1" stop-color="#e09a00"/></linearGradient>''' + marigold_symbol("mg") + marigold_symbol("mg2", "#f97316", "#fb923c", "#9a3412")
    b = '<rect width="400" height="800" fill="url(#bg)"/>'
    b += '<g opacity=".55" transform="translate(200 120)">' + "".join(
        f'<path d="M0 0 L{math.cos(a)*520:.0f} {math.sin(a)*520:.0f} L{math.cos(a+.1)*520:.0f} {math.sin(a+.1)*520:.0f}Z" fill="#fff6c8" opacity=".5"/>'
        for a in [i * math.pi / 8 for i in range(16)]) + '</g>'
    b += '<circle cx="200" cy="120" r="110" fill="url(#rays)"/><circle cx="200" cy="120" r="42" fill="#fff9d6"/>'
    # hanging marigold strands
    for x in (40, 110, 290, 360):
        n = rnd.randint(7, 11)
        b += f'<path d="M{x} -10 V{n*30}" stroke="#3f6b2a" stroke-width="2.5"/>'
        b += garland([(x + rnd.uniform(-3, 3), 14 + i * 28) for i in range(n)], "mg" if x in (40, 290) else "mg2", 30)
    # leaves + flower heap
    for _ in range(26):
        x = rnd.uniform(20, 380); y = rnd.uniform(655, 740); a = rnd.uniform(-60, 60)
        b += f'<path d="M0 0 C10 -14 24 -14 34 0 C24 12 10 12 0 0Z" fill="#4e8a2e" transform="translate({x:.0f} {y:.0f}) rotate({a:.0f})"/>'
    b += garland([(rnd.uniform(20, 380), rnd.uniform(660, 760)) for _ in range(30)], "mg", 36)
    # brass bowl with turmeric paste
    b += '<ellipse cx="200" cy="640" rx="104" ry="22" fill="#ffcc33" opacity=".5"/>'
    b += '<path d="M96 556 C96 640 148 686 200 686 C252 686 304 640 304 556Z" fill="url(#brass)"/>'
    b += '<ellipse cx="200" cy="556" rx="104" ry="26" fill="#c99a3a"/><ellipse cx="200" cy="556" rx="92" ry="20" fill="#7a4e0e"/>'
    b += '<path d="M112 556 C130 500 170 480 200 480 C232 480 272 500 288 556 C260 576 140 576 112 556Z" fill="url(#paste)"/>'
    b += '<ellipse cx="170" cy="520" rx="22" ry="8" fill="#ffe27a" opacity=".7"/>'
    b += '<path d="M150 590 C170 612 230 612 250 590" stroke="#ffe6a0" stroke-width="3" fill="none" opacity=".7"/>'
    b += '<path d="M168 686 h64 l8 22 h-80z" fill="url(#brass)"/><ellipse cx="200" cy="710" rx="52" ry="8" fill="#8a5c14"/>'
    # petals falling
    for _ in range(20):
        x, y, a = rnd.uniform(10, 390), rnd.uniform(220, 520), rnd.uniform(0, 180)
        b += f'<ellipse cx="{x:.0f}" cy="{y:.0f}" rx="4" ry="8" fill="#fb923c" opacity=".85" transform="rotate({a:.0f} {x:.0f} {y:.0f})"/>'
    return svg(b, defs)

# ------------------------------------------------------------------ WEDDING
def wedding():
    rnd = random.Random(21)
    defs = '''
<linearGradient id="bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2a0812"/><stop offset=".55" stop-color="#52121f"/><stop offset="1" stop-color="#7d1d2a"/></linearGradient>
<linearGradient id="gold" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#9a6e1f"/><stop offset=".45" stop-color="#f6dd9a"/><stop offset="1" stop-color="#9a6e1f"/></linearGradient>
<radialGradient id="fire" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#ffd27a" stop-opacity=".95"/><stop offset="1" stop-color="#ff8a30" stop-opacity="0"/></radialGradient>
<linearGradient id="flame" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#e0431c"/><stop offset=".6" stop-color="#ff9a1f"/><stop offset="1" stop-color="#ffe27a"/></linearGradient>''' + marigold_symbol("mg", "#fb923c", "#fbbf24")
    b = '<rect width="400" height="800" fill="url(#bg)"/>'
    for _ in range(40):
        b += star(rnd.randint(10, 390), rnd.randint(10, 420), rnd.choice([2, 3, 4]), "#ffe9b0", rnd.uniform(.4, .9))
    b += '<g transform="translate(50 200) scale(.75)">'
    b += '<circle cx="200" cy="610" r="260" fill="url(#fire)" opacity=".5"/>'
    # mandap pillars
    for x in (70, 330):
        b += f'<rect x="{x-9}" y="230" width="18" height="480" fill="url(#gold)"/>'
        for y in range(262, 700, 46):
            b += f'<rect x="{x-13}" y="{y}" width="26" height="7" rx="3" fill="#f6dd9a"/>'
        b += f'<rect x="{x-17}" y="704" width="34" height="16" rx="3" fill="url(#gold)"/>'
    for x in (130, 270):
        b += f'<rect x="{x-6}" y="260" width="12" height="440" fill="url(#gold)" opacity=".55"/>'
    # canopy
    b += '<path d="M40 232 L200 150 L360 232Z" fill="#a3182c"/><path d="M40 232 L360 232 L360 248 L40 248Z" fill="url(#gold)"/>'
    b += '<path d="M200 150 L200 232 M120 190 L120 232 M280 190 L280 232" stroke="#f6dd9a" stroke-width="2" opacity=".7"/>'
    for i in range(11):
        x = 52 + i * 29.6
        b += f'<path d="M{x-14:.1f} 248 q14 30 28 0Z" fill="#e5b84b"/><circle cx="{x:.1f}" cy="270" r="3.5" fill="#ffe9b0"/>'
    b += '<path d="M188 150 l12 -24 12 24z" fill="url(#gold)"/><circle cx="200" cy="122" r="6" fill="#ffe9b0"/>'
    # drapes
    b += '<path d="M44 248 C70 330 70 420 52 520 L44 520Z" fill="#c4263b" opacity=".85"/><path d="M356 248 C330 330 330 420 348 520 L356 520Z" fill="#c4263b" opacity=".85"/>'
    # garlands
    b += garland(curve_pts(70, 262, 330, 262, 62, 11), "mg", 26)
    b += garland([(70 + rnd.uniform(-2, 2), 300 + i * 26) for i in range(6)], "mg", 22)
    b += garland([(330 + rnd.uniform(-2, 2), 300 + i * 26) for i in range(6)], "mg", 22)
    # rangoli floor
    b += '<ellipse cx="200" cy="730" rx="190" ry="44" fill="#6a1623"/>'
    for r, col in [(170, "#e5b84b"), (140, "#c4263b"), (110, "#f08a2d"), (80, "#f6dd9a"), (52, "#c4263b")]:
        b += f'<ellipse cx="200" cy="732" rx="{r}" ry="{r*0.23:.0f}" fill="none" stroke="{col}" stroke-width="5" stroke-dasharray="{r//8} {r//10}"/>'
    # havan kund + fire
    b += '<path d="M138 706 L262 706 L278 740 L122 740Z" fill="url(#gold)"/><rect x="146" y="688" width="108" height="20" rx="3" fill="#7a4a14"/>'
    b += '<path d="M156 690 L246 676 M164 682 L244 696" stroke="#4a2808" stroke-width="9" stroke-linecap="round"/>'
    b += '<path d="M200 684 C168 640 176 600 196 566 C198 592 214 598 218 574 C246 608 238 650 200 684Z" fill="url(#flame)"/>'
    b += '<path d="M200 684 C184 660 188 636 200 618 C216 638 214 662 200 684Z" fill="#ffe27a"/>'
    b += '<path d="M168 690 C150 668 154 646 166 630 C176 650 180 664 168 690Z" fill="url(#flame)" opacity=".9"/><path d="M236 690 C252 670 250 650 240 636 C228 654 224 670 236 690Z" fill="url(#flame)" opacity=".9"/>'
    # kalash x2
    for x in (62, 338):
        b += f'<path d="M{x-18} 668 C{x-26} 690 {x-18} 712 {x} 712 C{x+18} 712 {x+26} 690 {x+18} 668Z" fill="url(#gold)"/><rect x="{x-12}" y="660" width="24" height="10" rx="2" fill="#f6dd9a"/>'
        b += f'<path d="M{x-14} 660 q14 -20 28 0" fill="#4e8a2e"/><ellipse cx="{x}" cy="640" rx="11" ry="14" fill="#9a6a2a"/><path d="M{x-8} 660 L{x-20} 636 M{x+8} 660 L{x+20} 636" stroke="#4e8a2e" stroke-width="4"/>'
    # sparks
    for _ in range(16):
        b += star(rnd.randint(140, 260), rnd.randint(500, 640), rnd.choice([2, 3]), "#ffd27a", .85)
    b += '</g>'
    return svg(b, defs)

# ------------------------------------------------------------------ RECEPTION
def reception():
    rnd = random.Random(33)
    defs = '''
<linearGradient id="bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#150a33"/><stop offset=".6" stop-color="#2d1163"/><stop offset="1" stop-color="#5a1a70"/></linearGradient>
<linearGradient id="glass" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#ffffff" stop-opacity=".55"/><stop offset=".5" stop-color="#ffffff" stop-opacity=".15"/><stop offset="1" stop-color="#ffffff" stop-opacity=".4"/></linearGradient>
<linearGradient id="wine" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffe9a8"/><stop offset="1" stop-color="#f0b84c"/></linearGradient>
<radialGradient id="burst" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#fff6d0"/><stop offset=".4" stop-color="#ffd98a" stop-opacity=".6"/><stop offset="1" stop-color="#ffd98a" stop-opacity="0"/></radialGradient>'''
    b = '<rect width="400" height="800" fill="url(#bg)"/>'
    for _ in range(36):
        x, y, r = rnd.uniform(0, 400), rnd.uniform(60, 760), rnd.uniform(8, 34)
        col = rnd.choice(["#ffd98a", "#ff8fb8", "#b79bff", "#fff0c0"])
        b += f'<circle cx="{x:.0f}" cy="{y:.0f}" r="{r:.0f}" fill="{col}" opacity="{rnd.uniform(.08,.28):.2f}"/>'
    # chandelier
    b += '<path d="M200 0 V60" stroke="#e8c76a" stroke-width="2"/><path d="M150 100 C150 70 250 70 250 100Z" fill="#e8c76a"/>'
    b += '<path d="M130 100 H270" stroke="#e8c76a" stroke-width="3"/>'
    for x in range(140, 270, 20):
        L = 22 + (x % 3) * 10
        b += f'<path d="M{x} 100 V{100+L}" stroke="#f6e3a8" stroke-width="1.5"/><path d="M{x} {100+L} l-4 8 4 8 4 -8z" fill="#fff6d0"/>'
    b += '<circle cx="200" cy="96" r="60" fill="url(#burst)" opacity=".5"/>'
    # string lights
    for y0, sag in [(190, 50), (240, 36)]:
        pts = curve_pts(-10, y0, 410, y0 + 6, sag, 12)
        d = "M" + " L".join(f"{x:.1f} {y:.1f}" for x, y in pts)
        b += f'<path d="{d}" stroke="#0c0620" stroke-width="2" fill="none"/>'
        for (x, y) in pts[1:-1]:
            b += f'<circle cx="{x:.1f}" cy="{y+8:.1f}" r="18" fill="url(#burst)" opacity=".6"/><circle cx="{x:.1f}" cy="{y+8:.1f}" r="4.5" fill="#fff6d0"/>'
    # clink burst
    b += '<circle cx="200" cy="470" r="110" fill="url(#burst)"/>'
    for a in range(0, 360, 30):
        r1, r2 = 26, 56 if a % 60 == 0 else 42
        b += f'<path d="M{200+math.cos(math.radians(a))*r1:.1f} {470+math.sin(math.radians(a))*r1:.1f} L{200+math.cos(math.radians(a))*r2:.1f} {470+math.sin(math.radians(a))*r2:.1f}" stroke="#fff6d0" stroke-width="3" stroke-linecap="round"/>'
    # two flutes
    def flute(cx, rot):
        g = f'<g transform="translate({cx} 700) rotate({rot})">'
        glass = ("M-24 -230 L24 -230 C26 -170 22 -110 5 -78 L4 10 L4 60 Q4 70 20 76 L20 82 L-20 82 L-20 76 "
                 "Q-4 70 -4 60 L-4 10 L-5 -78 C-22 -110 -26 -170 -24 -230Z")
        g += f'<path d="{glass}" fill="url(#glass)" stroke="#ffffff" stroke-opacity=".7" stroke-width="1.6"/>'
        g += '<path d="M-24.4 -196 L24.4 -196 C24.6 -150 20 -110 5 -80 L-5 -80 C-20 -110 -24.6 -150 -24.4 -196Z" fill="url(#wine)" opacity=".92"/>'
        g += '<path d="M-17 -216 C-19 -170 -15 -130 -4 -96" stroke="#fff" stroke-opacity=".7" stroke-width="3" fill="none" stroke-linecap="round"/>'
        g += '</g>'
        return g
    b += flute(128, 14) + flute(272, -14)
    for _ in range(26):
        b += f'<circle cx="{rnd.uniform(150,250):.0f}" cy="{rnd.uniform(430,610):.0f}" r="{rnd.uniform(1.2,3):.1f}" fill="#fff6d0" opacity=".8"/>'
    for (x, y, r) in [(120, 380, 9), (285, 400, 11), (200, 340, 7), (90, 520, 6), (320, 540, 7)]:
        b += star(x, y, r, "#fff6d0", .95)
    b += '<path d="M0 770 C120 756 280 756 400 770 V800 H0Z" fill="#12082b"/>'
    return svg(b, defs)

for name, fn in [("engagement", engagement), ("sangeet", sangeet), ("haldi", haldi),
                 ("wedding", wedding), ("reception", reception)]:
    write(f"{name}.svg", fn())
    print("wrote", name)
