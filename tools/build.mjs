#!/usr/bin/env node
/* Generates the four invitation pages (and the root landing page) from one template.
   Run from the repo root:   node tools/build.mjs
   Edit event details / names / labels in the data below, then re-run and commit the output. */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SITE = "https://abinashpatra1.github.io/WeddingInvitation";
const SPRITE = readFileSync(join(ROOT, "tools", "sprite.html"), "utf8");

/* ------------------------------------------------------------------ shared facts */
const GROOM = "Abinash";
const BRIDE = "Mousumi";
const WEDDING_ISO = "2027-02-10T19:00:00+05:30";
const RSVP_NUMBER = "917438013279";

/* ------------------------------------------------------------------ event catalogue */
const WEDDING_PLAN = [
  { time: "10:00 PM", label: "Baarat" },
  { time: "11:00 PM", label: "Reception" },
  { time: "1:00 AM", note: "11 Feb", label: "Hata Ganthi / Bahaghara" },
  { time: "6:00 AM", note: "11 Feb", label: "Bidia" },
];
const MAPS = {
  temple: "https://maps.app.goo.gl/hMyFZrRNAsmVHJ2B6",
  parija: "https://maps.app.goo.gl/33aai4weEGtk834v9",
  patra: "https://maps.app.goo.gl/cMWfeXijimVZaX8m6",
  mandap: "https://maps.app.goo.gl/RopJnxUpWHEfgMF47",
  noc: "https://maps.app.goo.gl/n7MHrjqUbhgPd3dr6",
};
const VENUE = {
  temple: { name: "Shree Rama Nigameswar Temple", addr: "Ring Rd, Chahata Nagar, Kaphala Colony, Kataka", map: MAPS.temple },
  parija: { name: "Residence of Mrs & Mr Parija", addr: "Tentulipada, Tirtol, Jagatsinghpur", map: MAPS.parija },
  patra: { name: "Residence of Mrs & Mr Patra", addr: "Chetana Bhavan, Kukudapada, Balia, Baleswar", map: MAPS.patra },
  mandap: { name: "Binapani Mandap", addr: "Cuttack-Paradip Road, Nausira, Jagatsinghpur", map: MAPS.mandap },
  noc: { name: "NOCCi Residency", addr: "NOCCi Business Park, Bampada, Kuruda, Baleswar", map: MAPS.noc },
};
/* start/end are IST. End times are assumptions used only for the "Save to calendar" file. */
const EV = {
  engagement: { art: "engagement", icon: "i-rings", title: "Engagement", date: "2027-01-27", start: "10:00", end: "12:00", venue: VENUE.temple },
  sangeetMehendi: { art: "sangeet", paint: "sangeet-mehendi", icon: "i-music", title: "Sangeet & Mehendi", date: "2027-02-09", start: "19:00", end: "23:00", venue: VENUE.parija, dark: true },
  mehendiGroom: { art: "sangeet", paint: "mehendi", icon: "i-music", title: "Mehendi", date: "2027-02-09", start: "19:00", end: "23:00", venue: VENUE.patra, dark: true },
  haldiBride: { art: "haldi", icon: "i-haldi", title: "Haldi", date: "2027-02-10", start: "09:00", end: "13:00", venue: VENUE.parija },
  haldiGroom: { art: "haldi", icon: "i-haldi", title: "Haldi", date: "2027-02-10", start: "09:00", end: "13:00", venue: VENUE.patra },
  wedding: { art: "wedding", icon: "i-mandap", title: "Wedding", date: "2027-02-10", start: "19:00", end: "07:00+1", venue: VENUE.mandap, plan: WEDDING_PLAN, dark: true, main: true },
  reception: { art: "reception", icon: "i-glass", title: "Reception", date: "2027-02-12", start: "19:00", end: "23:00", venue: VENUE.noc, dark: true },
};

/* ------------------------------------------------------------------ the four invitations */
const PAGES = [
  { path: "pari/v1", label: "Bride v1", side: "bride", events: [EV.engagement, EV.sangeetMehendi, EV.haldiBride, EV.wedding] },
  { path: "pari/v2", label: "Bride v2", side: "bride", events: [EV.haldiBride, EV.wedding] },
  { path: "abinash/v1", label: "Groom v1", side: "groom", events: [EV.engagement, EV.mehendiGroom, EV.haldiGroom, EV.wedding, EV.reception] },
  { path: "abinash/v2", label: "Groom v2", side: "groom", events: [EV.haldiGroom, EV.wedding, EV.reception] },
];

/* ------------------------------------------------------------------ helpers */
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
function dayLabel(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  const wd = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  return `${DAYS[wd]} · ${d} ${MONTHS[m - 1]} ${y}`;
}
function shortDate(iso) {
  const [, m, d] = iso.split("-").map(Number);
  return `${d} ${MONTHS[m - 1]}`;
}
function clock(hhmm) {
  const [h, m] = hhmm.split(":").map(Number);
  const hr = h % 12 === 0 ? 12 : h % 12;
  return `${hr}:${String(m).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`;
}
function addDay(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + 1)).toISOString().slice(0, 10);
}
function isoRange(ev) {
  const end = ev.end.endsWith("+1") ? `${addDay(ev.date)}T${ev.end.slice(0, 5)}` : `${ev.date}T${ev.end}`;
  return { start: `${ev.date}T${ev.start}:00+05:30`, end: `${end}:00+05:30` };
}
const pad2 = (n) => String(n).padStart(2, "0");

function eventCard(ev, i, total, up) {
  const { start, end } = isoRange(ev);
  const dir = ev.venue.map;
  const plan = ev.plan
    ? `<details class="more">
                  <summary><span>More details</span><svg aria-hidden="true"><use href="#i-chevron"/></svg></summary>
                  <ol class="timeline" aria-label="Wedding day order of events">${ev.plan
                    .map((p) => `<li><time>${p.time}${p.note ? `<small>${p.note}</small>` : ""}</time><span>${esc(p.label)}</span></li>`)
                    .join("")}</ol>
                </details>`
    : "";
  return `
          <li class="event event--${ev.art}${ev.dark ? " event--dark" : ""}${ev.main ? " event--main" : ""} reveal"
              data-title="${esc(ev.title)} · ${esc(GROOM)} &amp; ${esc(BRIDE)}"
              data-start="${start}" data-end="${end}"
              data-location="${esc(ev.venue.name + ", " + ev.venue.addr)}">
            <span class="event__frame" aria-hidden="true"></span>
            <div class="event__panel">
              <div class="event__head">
                <span class="event__count" aria-hidden="true">${pad2(i + 1)} / ${pad2(total)}</span>
                <div class="event__icon" aria-hidden="true"><svg><use href="#${ev.icon}"/></svg></div>
                <p class="event__day">${dayLabel(ev.date)}</p>
                <h3 class="event__name">${esc(ev.title)}</h3>
                <p class="event__time"><svg aria-hidden="true"><use href="#i-clock"/></svg>${clock(ev.start)} onwards</p>
                ${plan}
              </div>
              <div class="event__mid" aria-hidden="true">
                <img class="event__paint" src="${up}assets/events/paint-${ev.paint || ev.art}.webp" alt="" loading="lazy" decoding="async" />
              </div>
              <div class="event__foot">
                <div class="event__venue">
                  <svg aria-hidden="true"><use href="#i-pin"/></svg>
                  <p><strong>${esc(ev.venue.name)}</strong><br />${esc(ev.venue.addr)}</p>
                </div>
                <div class="event__actions">
                  <a class="btn btn--gold" target="_blank" rel="noopener" href="${dir}">
                    <svg aria-hidden="true"><use href="#i-nav"/></svg>Get Directions
                  </a>
                  <button class="btn btn--ghost js-ics" type="button" aria-label="Save ${esc(ev.title)} to calendar">
                    <svg aria-hidden="true"><use href="#i-calendar"/></svg>Save
                  </button>
                </div>
              </div>
            </div>
          </li>`;
}

/* ------------------------------------------------------------------ page template */
function page(p) {
  const bridePage = p.side === "bride";
  const first = bridePage ? BRIDE : GROOM;
  const second = bridePage ? GROOM : BRIDE;
  const initials = `${first[0]}<i>&amp;</i>${second[0]}`;
  const url = `${SITE}/${p.path}/`;
  const up = "../../";
  const pageTitle = `${first} &amp; ${second} · Wedding Invitation`;
  const ogDesc = "Join us as we begin our forever. 10 February 2027 · Jagatsinghpur, Odisha";
  const groomCard = `
          <figure class="couple__card reveal">
            <div class="arch-frame">
              <!-- Replace with your photo: assets/groom.jpg -->
              <img src="${up}assets/groom-placeholder.svg" alt="Portrait of ${GROOM}" width="300" height="400" loading="lazy" decoding="async" />
            </div>
            <figcaption><span class="couple__name">${GROOM}</span><span class="couple__role">The Groom</span></figcaption>
          </figure>`;
  const brideCard = `
          <figure class="couple__card reveal">
            <div class="arch-frame">
              <!-- Replace with your photo: assets/bride.jpg -->
              <img src="${up}assets/bride-placeholder.svg" alt="Portrait of ${BRIDE}" width="300" height="400" loading="lazy" decoding="async" />
            </div>
            <figcaption><span class="couple__name">${BRIDE}</span><span class="couple__role">The Bride</span></figcaption>
          </figure>`;
  const events = p.events.map((e, i) => eventCard(e, i, p.events.length, up)).join("\n");
  const eventChips = p.events
    .map((e) => `<label class="chip"><input type="checkbox" name="events" value="${esc(e.title)}" checked /><span class="chip__body"><span class="chip__title">${esc(e.title)}</span><span class="chip__date">${shortDate(e.date)}</span></span></label>`)
    .join("");
  const inviteCfg = JSON.stringify({
    id: p.label, first, second, weddingDate: WEDDING_ISO, whatsappNumber: RSVP_NUMBER,
    storageKey: `am-wedding-rsvp-${p.path.replace("/", "-")}`,
  });

  return `<!DOCTYPE html>
<html lang="en" class="no-js">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
  <meta name="theme-color" content="#f4ebdc" />
  <meta name="robots" content="noindex, nofollow" />
  <title>${pageTitle}</title>
  <meta name="description" content="With the blessings of Lord Ganesha, join us for the wedding of ${first} &amp; ${second}." />

  <!-- Social share preview -->
  <meta property="og:type" content="website" />
  <meta property="og:title" content="${pageTitle}" />
  <meta property="og:description" content="${ogDesc}" />
  <meta property="og:url" content="${url}" />
  <meta property="og:image" content="${SITE}/assets/bg.jpg" />
  <meta property="og:image:width" content="736" />
  <meta property="og:image:height" content="1308" />
  <meta name="twitter:card" content="summary_large_image" />
  <link rel="canonical" href="${url}" />

  <link rel="icon" href="${up}assets/favicon.svg" type="image/svg+xml" />
  <link rel="preload" as="image" href="${up}assets/bg.jpg" />

  <!-- Fonts: Cormorant Garamond (serif headings), Pinyon Script (names), Jost (body), Tiro Devanagari Hindi -->
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,500&family=Jost:wght@300;400;500;600&family=Pinyon+Script&family=Tiro+Devanagari+Hindi&display=swap" rel="stylesheet" />

  <link rel="stylesheet" href="${up}css/styles.css" />
</head>
<body class="is-locked">

  <!-- ============ SVG ICON SPRITE ============ -->
${SPRITE.trimEnd()}

  <!-- ============ ENVELOPE OPENER ============ -->
  <div class="opener" id="opener" role="dialog" aria-modal="true" aria-labelledby="opener-label">
    <div class="opener__veil" aria-hidden="true"></div>

    <button class="envelope" id="envelope" type="button" aria-describedby="opener-label">
      <span class="envelope__back" aria-hidden="true"></span>
      <span class="envelope__letter" aria-hidden="true">
        <span class="envelope__letter-om">ॐ</span>
        <span class="envelope__letter-names">${first} <em>&amp;</em> ${second}</span>
        <span class="envelope__letter-line">10 · 02 · 2027</span>
      </span>
      <span class="envelope__pocket" aria-hidden="true"></span>
      <span class="envelope__flap" aria-hidden="true"></span>
      <span class="envelope__seal" aria-hidden="true"><span>${initials}</span></span>
      <span class="sr-only">Open the invitation</span>
    </button>

    <p class="opener__hint" id="opener-label">
      <span class="opener__for">You are cordially invited</span>
      <span class="opener__tap">Tap to open</span>
    </p>
  </div>

  <!-- ============ APP SHELL ============ -->
  <div class="app" id="app">

    <!-- HERO -->
    <header class="hero" id="home">
      <div class="hero__petals" aria-hidden="true">
        <i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i>
      </div>

      <div class="hero__content">
        <p class="hero__mantra" lang="hi">॥ श्री गणेशाय नमः ॥</p>
        <span class="divider" aria-hidden="true"></span>
        <p class="hero__lead">Join us for</p>
        <p class="hero__the">The Wedding of</p>
        <h1 class="hero__names">
          <span class="hero__name">${first}</span>
          <span class="hero__amp">&amp;</span>
          <span class="hero__name">${second}</span>
        </h1>
        <p class="hero__date">
          <time datetime="2027-02-10">Wednesday · 10 February 2027</time>
        </p>
        <p class="hero__place">Jagatsinghpur, Odisha</p>
      </div>

      <a class="scroll-cue" href="#countdown" aria-label="Scroll to details">
        <span class="scroll-cue__mouse" aria-hidden="true"><span></span></span>
      </a>
    </header>

    <main>

      <!-- COUNTDOWN -->
      <section class="section section--countdown" id="countdown" aria-labelledby="countdown-title">
        <p class="eyebrow reveal">Counting down to forever</p>
        <h2 class="section__title reveal" id="countdown-title">The Big Day</h2>
        <div class="countdown reveal" id="countdown-timer" role="timer" aria-live="off">
          <div class="countdown__unit"><span class="countdown__num" data-unit="days">--</span><span class="countdown__label">Days</span></div>
          <div class="countdown__unit"><span class="countdown__num" data-unit="hours">--</span><span class="countdown__label">Hours</span></div>
          <div class="countdown__unit"><span class="countdown__num" data-unit="minutes">--</span><span class="countdown__label">Minutes</span></div>
          <div class="countdown__unit"><span class="countdown__num" data-unit="seconds">--</span><span class="countdown__label">Seconds</span></div>
        </div>
        <p class="countdown__done" id="countdown-done" hidden>We're married! Thank you for your blessings. ✨</p>
        <p class="section__note reveal">10 February 2027 · 7:00 PM IST</p>
      </section>

      <!-- COUPLE -->
      <section class="section section--couple" id="couple" aria-labelledby="couple-title">
        <p class="eyebrow reveal">Two souls, one journey</p>
        <h2 class="section__title reveal" id="couple-title">The Couple</h2>

        <div class="couple">${bridePage ? brideCard + groomCard : groomCard + brideCard}
        </div>

        <blockquote class="quote reveal">
          <p>“Like Shiva and Shakti, two halves of one whole — bound by love, blessed by the divine.”</p>
        </blockquote>
      </section>

      <!-- EVENTS -->
      <section class="section section--events" id="events" aria-labelledby="events-title">
        <p class="eyebrow reveal">Celebrations</p>
        <h2 class="section__title reveal" id="events-title">Events &amp; Schedule</h2>

        <ol class="events">
${events}
        </ol>
      </section>

      <!-- GIFTS (the humorous one) -->
      <section class="section section--gifts" id="gifts" aria-labelledby="gifts-title">
        <p class="eyebrow reveal">The Shagun Desk</p>
        <h2 class="section__title reveal" id="gifts-title">Gift Registry<sup>*</sup></h2>

        <div class="shagun card reveal">
          <div class="shagun__coins" aria-hidden="true"><span>💸</span><span>💰</span><span>🪙</span></div>
          <p class="shagun__pitch">We have a home to set up, a honeymoon to plan, and a mysterious spreadsheet called <em>“Wedding Budget”</em> that is crying in a corner.</p>
          <p class="shagun__pitch">Your blessings are priceless. Cash, however, is also accepted. 😇</p>
          <button class="btn btn--gold btn--block shagun__btn" type="button" id="shagun-btn">
            <svg aria-hidden="true"><use href="#i-gift"/></svg>Send Shagun
          </button>
          <p class="shagun__fine"><sup>*</sup>Terms &amp; conditions apply. Clicking may cause guilt.</p>
        </div>
      </section>

      <!-- RSVP -->
      <section class="section section--rsvp" id="rsvp" aria-labelledby="rsvp-title">
        <p class="eyebrow reveal">Kindly respond by 15 January 2027</p>
        <h2 class="section__title reveal" id="rsvp-title">RSVP</h2>

        <div class="rsvp reveal">
          <span class="rsvp__corner rsvp__corner--tl" aria-hidden="true"></span>
          <span class="rsvp__corner rsvp__corner--tr" aria-hidden="true"></span>
          <span class="rsvp__corner rsvp__corner--bl" aria-hidden="true"></span>
          <span class="rsvp__corner rsvp__corner--br" aria-hidden="true"></span>

          <form class="form" id="rsvp-form" novalidate>
            <div class="rsvp__head">
              <span class="rsvp__seal" aria-hidden="true"><svg><use href="#i-mail"/></svg></span>
              <p class="rsvp__lead">Will you celebrate with us?</p>
              <p class="rsvp__sub">Takes less than a minute</p>
            </div>

            <fieldset class="field" data-field="attending">
              <legend class="sr-only">Will you attend? *</legend>
              <div class="tiles tiles--2">
                <label class="tile"><input type="radio" name="attending" value="yes" required aria-describedby="e-attending" /><span class="tile__body"><span class="tile__emoji" aria-hidden="true">🎉</span><span class="tile__title">Joyfully accept</span><span class="tile__sub">Count me in!</span></span></label>
                <label class="tile"><input type="radio" name="attending" value="no" /><span class="tile__body"><span class="tile__emoji" aria-hidden="true">🙏</span><span class="tile__title">Regretfully decline</span><span class="tile__sub">Sending blessings</span></span></label>
              </div>
              <p class="field__error" id="e-attending" aria-live="polite"></p>
            </fieldset>

            <div class="field" data-field="name">
              <label for="f-name">Your name <span aria-hidden="true">*</span></label>
              <input id="f-name" name="name" type="text" autocomplete="name" placeholder="e.g. Priya Sharma"
                     required minlength="2" maxlength="60" aria-describedby="e-name" />
              <p class="field__error" id="e-name" aria-live="polite"></p>
            </div>

            <div class="form__attending" id="attending-extra" hidden>
              <fieldset class="field" data-field="events">
                <legend>Events I'm attending <span aria-hidden="true">*</span></legend>
                <div class="chips" id="event-chips">${eventChips}</div>
                <p class="field__error" id="e-events" aria-live="polite"></p>
              </fieldset>

              <div class="field" data-field="guests">
                <label for="f-guests">How many of you are coming? <span class="field__opt">(including you)</span></label>
                <div class="stepper">
                  <button type="button" class="stepper__btn" data-step="-1" aria-label="Fewer guests">−</button>
                  <input id="f-guests" name="guests" type="number" inputmode="numeric" min="1" max="10" value="1" aria-describedby="e-guests" />
                  <button type="button" class="stepper__btn" data-step="1" aria-label="More guests">+</button>
                </div>
                <p class="field__error" id="e-guests" aria-live="polite"></p>
              </div>

              <fieldset class="field" data-field="food">
                <legend>Food preference <span aria-hidden="true">*</span></legend>
                <div class="tiles tiles--3">
                  <label class="tile tile--sm"><input type="radio" name="food" value="veg" aria-describedby="e-food" /><span class="tile__body"><span class="tile__emoji" aria-hidden="true">🥗</span><span class="tile__title">Veg</span></span></label>
                  <label class="tile tile--sm"><input type="radio" name="food" value="non-veg" /><span class="tile__body"><span class="tile__emoji" aria-hidden="true">🍗</span><span class="tile__title">Non-veg</span></span></label>
                  <label class="tile tile--sm"><input type="radio" name="food" value="jain" /><span class="tile__body"><span class="tile__emoji" aria-hidden="true">🌿</span><span class="tile__title">Jain</span></span></label>
                </div>
                <p class="field__error" id="e-food" aria-live="polite"></p>
              </fieldset>
            </div>

            <div class="field" data-field="message">
              <label for="f-message">A wish for the couple <span class="field__opt">(optional)</span></label>
              <textarea id="f-message" name="message" rows="4" maxlength="300"
                        placeholder="Share your blessings, a memory or a warm wish…" aria-describedby="e-message c-message"></textarea>
              <div class="field__foot">
                <p class="field__error" id="e-message" aria-live="polite"></p>
                <span class="field__count" id="c-message">0 / 300</span>
              </div>
            </div>

            <button class="btn btn--primary btn--block" type="submit" id="rsvp-submit">
              <span class="btn__label">Send RSVP via WhatsApp</span>
              <span class="btn__spinner" aria-hidden="true"></span>
            </button>
            <p class="form__note">Next, we'll open WhatsApp with your RSVP ready to go.</p>
            <p class="form__status" id="rsvp-status" role="status" aria-live="polite"></p>
          </form>

          <div class="rsvp__done" id="rsvp-done" hidden tabindex="-1">
            <div class="rsvp__done-icon" aria-hidden="true"><svg><use href="#i-heart"/></svg></div>
            <h3 class="rsvp__done-title" id="rsvp-done-title">Thank you!</h3>
            <p class="rsvp__done-text" id="rsvp-done-text"></p>
            <a class="btn btn--whatsapp btn--block" id="rsvp-whatsapp" target="_blank" rel="noopener" href="#">
              <svg aria-hidden="true"><use href="#i-whatsapp"/></svg>Send RSVP on WhatsApp
            </a>
            <button class="btn btn--ghost btn--block" type="button" id="rsvp-edit">Edit my response</button>
          </div>
        </div>
      </section>

    </main>

    <footer class="footer">
      <p class="footer__names">${first} <span>&amp;</span> ${second}</p>
      <p class="footer__text">With love and gratitude, we look forward to celebrating with you.</p>
      <p class="footer__tag">#AbinashWedsMousumi</p>
    </footer>

    <!-- Bottom nav (social-app style) -->
    <nav class="tabbar" id="tabbar" aria-label="Sections">
      <a class="tabbar__item is-active" href="#home"><svg aria-hidden="true"><use href="#i-home"/></svg><span>Home</span></a>
      <a class="tabbar__item" href="#events"><svg aria-hidden="true"><use href="#i-calendar"/></svg><span>Events</span></a>
      <a class="tabbar__item" href="#gifts"><svg aria-hidden="true"><use href="#i-gift"/></svg><span>Gifts</span></a>
      <a class="tabbar__item" href="#rsvp"><svg aria-hidden="true"><use href="#i-mail"/></svg><span>RSVP</span></a>
      <button class="tabbar__item" type="button" id="share-btn"><svg aria-hidden="true"><use href="#i-share"/></svg><span>Share</span></button>
    </nav>
  </div>

  <!-- Shagun popup -->
  <dialog class="modal" id="shagun-modal" aria-labelledby="shagun-title">
    <div class="modal__card">
      <p class="modal__emoji" id="shagun-emoji" aria-hidden="true">🥹</p>
      <h3 class="modal__title" id="shagun-title">Wait… you really wanted to gift us?</h3>
      <p class="modal__text" id="shagun-text">Aww, that's sweet! But your <strong>presence</strong> is the only present we need. Come hungry, dance hard and bless us. That is the whole gift list.</p>
      <div class="modal__actions">
        <button class="btn btn--gold btn--block" type="button" id="shagun-yes">Fine, I'll come! 🤗</button>
        <button class="btn btn--ghost btn--block" type="button" id="shagun-insist">No, I insist! 😤</button>
      </div>
    </div>
  </dialog>

  <!-- WhatsApp reminder popup -->
  <dialog class="modal" id="wa-modal" aria-labelledby="wa-title">
    <div class="modal__card">
      <h3 class="modal__title" id="wa-title">One last step 💚</h3>
      <p class="modal__text"><strong>Please do not forget to press “Send” in WhatsApp.</strong> Your RSVP only reaches us once you send it.</p>
      <img class="modal__img" src="${up}assets/whatsapp-send.svg" alt="In WhatsApp, tap the green send arrow at the bottom right" width="360" height="210" />
      <div class="modal__actions">
        <a class="btn btn--whatsapp btn--block" id="wa-open" target="_blank" rel="noopener" href="#">
          <svg aria-hidden="true"><use href="#i-whatsapp"/></svg>Open WhatsApp
        </a>
        <button class="btn btn--ghost btn--block" type="button" id="wa-cancel">Go back</button>
      </div>
    </div>
  </dialog>

  <div class="toast" id="toast" role="status" aria-live="polite"></div>

  <script>window.INVITE = ${inviteCfg};</script>
  <script src="${up}js/main.js" defer></script>
</body>
</html>
`;
}

/* ------------------------------------------------------------------ landing page at / */
function landing() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="robots" content="noindex, nofollow" />
  <title>${GROOM} &amp; ${BRIDE} · Wedding</title>
  <link rel="icon" href="assets/favicon.svg" type="image/svg+xml" />
  <link rel="stylesheet" href="css/styles.css" />
  <style>
    .landing { min-height: 100svh; display: grid; place-items: center; padding: 32px 24px; text-align: center; }
    .landing h1 { font-family: var(--font-script); font-weight: 400; font-size: 3.2rem; line-height: 1.15; color: var(--charcoal); }
    .landing p { max-width: 28ch; margin: 12px auto 0; font-family: var(--font-serif); font-style: italic; font-size: 1.2rem; color: var(--muted); }
  </style>
</head>
<body>
  <main class="landing">
    <div>
      <h1>${GROOM} &amp; ${BRIDE}</h1>
      <p>Please open the invitation link that was shared with you.</p>
    </div>
  </main>
</body>
</html>
`;
}

/* ------------------------------------------------------------------ write */
for (const p of PAGES) {
  const dir = join(ROOT, p.path);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "index.html"), page(p));
  console.log("wrote", p.path + "/index.html", `(${p.events.length} events)`);
}
writeFileSync(join(ROOT, "index.html"), landing());
console.log("wrote index.html (landing)");
