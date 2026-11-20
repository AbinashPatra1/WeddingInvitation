# Abinash & Mousumi — Wedding Invitation

A mobile-first static wedding invitation built with plain HTML, CSS and JavaScript. There is no build step and no dependencies.

```
wedding/
├── index.html          # markup + inline SVG icon sprite
├── css/styles.css      # all styles (design tokens at the top)
├── js/main.js          # envelope, countdown, reveal, nav, RSVP, copy, .ics
└── assets/
    ├── bg.jpg                      # hero / envelope background artwork
    ├── groom-placeholder.svg       # swap for a real photo
    ├── bride-placeholder.svg       # swap for a real photo
    └── favicon.svg
```

## Customise

| What | Where |
|---|---|
| Countdown date, RSVP endpoint, WhatsApp number | `CONFIG` at the top of `js/main.js` |
| Names, date and city on the hero | `.hero__content` in `index.html` |
| Events (times, venues, map links, calendar data) | `<li class="event">` blocks in `index.html` (`data-start`, `data-end`, `data-location`, and the `destination=` part of the Maps URL) |
| UPI ID and bank details | `#gifts` section in `index.html`. Update both the visible text and `data-copy` |
| Couple photos | Put `groom.jpg` and `bride.jpg` in `assets/` and point the two `<img>` tags at them (3:4 portrait works best) |
| Colours and fonts | CSS custom properties in `:root` in `css/styles.css` |

> All venues, the UPI ID and the bank details are **placeholders**. Replace them before you share the link.

### Receiving RSVPs

The site is fully static, so RSVPs need somewhere to go:

1. **WhatsApp (default):** when a guest submits, WhatsApp opens with a formatted RSVP message addressed to `CONFIG.whatsappNumber` (country code + digits, e.g. `"919876543210"`). The guest just presses send. A fallback button on the thank-you card reopens it if the browser blocked the popup.

## Deploy

**Azure Static Web Apps:** create a Static Web App pointing at this repo with app location `/` and no build command or output location.

**GitHub Pages:** in **Settings → Pages**, choose **Deploy from a branch**, then **main** and **/ (root)**. The site is served at https://abinashpatra1.github.io/WeddingInvitation/ and every push to `main` redeploys it.

> If you move the site to another URL, update `og:url`, `og:image` and `canonical` in `index.html`. Link previews on WhatsApp and Facebook need absolute URLs.

**Any other static host:** upload the folder as-is. All asset paths are relative.

**Local preview:**

```bash
npx serve .
```
