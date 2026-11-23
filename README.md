# Abinash & Mousumi — Wedding Invitations

Four mobile-first invitations built with plain HTML, CSS and JavaScript, generated from one shared template. The generated pages are committed, so hosting needs no build step.

| Invitation | URL |
|---|---|
| Bride v1 (Engagement, Sangeet & Mehendi, Haldi, Wedding) | `/pari/v1/` |
| Bride v2 (Haldi, Wedding) | `/pari/v2/` |
| Groom v1 (Engagement, Mehendi, Haldi, Wedding, Reception) | `/abinash/v1/` |
| Groom v2 (Haldi, Wedding, Reception) | `/abinash/v2/` |

The root `/` shows only a neutral "please open the link you were sent" page. Bride pages list Mousumi first, groom pages list Abinash first.

```
├── index.html                  # neutral landing page (generated)
├── pari/v1|v2/index.html       # generated
├── abinash/v1|v2/index.html    # generated
├── css/styles.css              # all styles (design tokens at the top)
├── js/main.js                  # envelope, countdown, reveal, nav, RSVP, popup, .ics
├── assets/
│   ├── bg.jpg                  # hero / envelope artwork
│   ├── events/                 # per-event card art: scattered border strips (svg) + watercolour paintings (webp)
│   └── *-placeholder.svg       # couple photos, swap for real ones
└── tools/
    ├── build.mjs               # page template + event data → the 4 pages
    ├── sprite.html             # inline SVG icon sprite used by the template
    ├── make-illustrations.py   # draws the scattered border strips around each card (assets/events/frame-*.svg)
    ├── prepare-paintings.py    # cuts the paper away and feathers the paintings from tools/source/*.webp; prints the edge colours
    └── source/                 # original illustration sheets (light set + dark wedding/reception)
```

## Editing content

Events, venues, map links, names, the RSVP number and which events each invitation shows all live at the top of **`tools/build.mjs`**. After editing, regenerate and commit:

```bash
node tools/build.mjs                  # rewrites the four pages + index.html
python3 tools/make-illustrations.py   # border strips
python3 tools/prepare-paintings.py    # paintings (needs Pillow + numpy)
# Card background colours (--g0..--g3 per event in css/styles.css) are matched to each painting's edge colour,
# so a new painting needs its card colour updated too.
```

Do not edit the generated `index.html` files by hand. Your changes will be overwritten. Page markup shared by all four invitations is the template inside `build.mjs`.

| What | Where |
|---|---|
| Events, venues, map links, time | `EV` / `VENUE` / `PAGES` in `tools/build.mjs` |
| RSVP WhatsApp number, wedding date | `RSVP_NUMBER`, `WEDDING_ISO` in `tools/build.mjs` |
| Couple photos | Put `groom.jpg` / `bride.jpg` in `assets/` and point the two `<img>` tags in the template at them (3:4 portrait) |
| Colours and fonts | CSS custom properties in `:root` in `css/styles.css` |

## RSVPs

On submit, WhatsApp opens with a formatted RSVP message addressed to the number in `RSVP_NUMBER`, and the guest presses send. The message includes which invitation it came from (e.g. "Bride v1"). If the browser blocks the popup, a button on the thank-you card opens it again. A copy of the response is also saved on the guest's device.

## Deploy

**GitHub Pages:** in **Settings → Pages**, choose **Deploy from a branch**, then **main** and **/ (root)**. Served at https://abinashpatra1.github.io/WeddingInvitation/ and every push to `main` redeploys it.

> If you move the site to another URL, update `SITE` in `tools/build.mjs` and rebuild. Link previews on WhatsApp and Facebook need absolute URLs.

**Local preview:**

```bash
python3 -m http.server 8000   # then open http://localhost:8000/pari/v1/
```
