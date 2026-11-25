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
const GROOM_OR = "ଅବିନାଶ";
const BRIDE_OR = "ମୌସୁମୀ";
const WEDDING_ISO = "2027-02-10T19:00:00+05:30";
const RSVP_NUMBER = "917438013279";

/* ------------------------------------------------------------------ event catalogue */
const WEDDING_PLAN = [
  { time: "10:00 PM", t24: "22:00", label: "Baarat", labelOr: "ବରଯାତ୍ରା" },
  { time: "11:00 PM", t24: "23:00", label: "Reception", labelOr: "ରିସେପ୍ସନ୍" },
  { time: "1:00 AM", t24: "01:00", note: "11 Feb", noteOr: "୧୧ ଫେବୃ", label: "Hata Ganthi / Bahaghara", labelOr: "ହାତଗଣ୍ଠି / ବାହାଘର" },
  { time: "6:00 AM", t24: "06:00", note: "11 Feb", noteOr: "୧୧ ଫେବୃ", label: "Bidai", labelOr: "ବିଦାୟ" },
];
const MAPS = {
  parija: "https://maps.app.goo.gl/33aai4weEGtk834v9",
  patra: "https://maps.app.goo.gl/cMWfeXijimVZaX8m6",
  mandap: "https://maps.app.goo.gl/RopJnxUpWHEfgMF47",
  noc: "https://maps.app.goo.gl/n7MHrjqUbhgPd3dr6",
};
const VENUE = {
  parija: { name: "Residence of Mrs & Mr Parija", addr: "Tentulipada, Tirtol, Jagatsinghpur", map: MAPS.parija,
    nameOr: "ଶ୍ରୀମତୀ ଓ ଶ୍ରୀ ପରିଜାଙ୍କ ବାସଭବନ", addrOr: "ତେନ୍ତୁଳିପଡ଼ା, ତିର୍ତୋଲ, ଜଗତସିଂହପୁର" },
  patra: { name: "Residence of Mrs & Mr Patra", addr: "Chetana Bhavan, Kukudapada, Balia, Baleswar", map: MAPS.patra,
    nameOr: "ଶ୍ରୀମତୀ ଓ ଶ୍ରୀ ପାତ୍ରଙ୍କ ବାସଭବନ", addrOr: "ଚେତନା ଭବନ, କୁକୁଡ଼ାପଦା, ବାଲିଆ, ବାଲେଶ୍ୱର" },
  mandap: { name: "Binapani Mandap", addr: "Cuttack-Paradip Road, Tirtol, Jagatsinghpur", map: MAPS.mandap,
    nameOr: "ବୀଣାପାଣି ମଣ୍ଡପ", addrOr: "କଟକ-ପାରାଦୀପ ରୋଡ୍, ତିର୍ତୋଲ, ଜଗତସିଂହପୁର" },
  noc: { name: "NOCCi Residency", addr: "NOCCi Business Park, Bampada, Kuruda, Baleswar", map: MAPS.noc,
    nameOr: "ନୋସି ରେସିଡେନ୍ସି", addrOr: "ନୋସି ବିଜନେସ୍ ପାର୍କ, ବାମ୍ପଦା, କୁରୁଡ଼ା, ବାଲେଶ୍ୱର" },
};
/* start/end are IST. End times are assumptions used only for the "Save to calendar" file. */
const EV = {
  sangeetMehendi: { art: "sangeet", paint: "sangeet-mehendi", icon: "i-music", title: "Sangeet & Mehendi", date: "2027-02-09", start: "19:00", end: "23:00", venue: VENUE.parija },
  mehendiGroom: { art: "mehendi", paint: "mehendi", icon: "i-music", title: "Mehendi", date: "2027-02-09", start: "19:00", end: "23:00", venue: VENUE.patra },
  haldiBride: { art: "haldi", icon: "i-haldi", title: "Haldi", date: "2027-02-10", start: "09:00", end: "13:00", venue: VENUE.parija },
  haldiGroom: { art: "haldi", icon: "i-haldi", title: "Haldi", date: "2027-02-10", start: "09:00", end: "13:00", venue: VENUE.patra },
  wedding: { art: "wedding", icon: "i-mandap", title: "Wedding", date: "2027-02-10", start: "19:00", end: "07:00+1", venue: VENUE.mandap, plan: WEDDING_PLAN, dark: true, main: true },
  reception: { art: "reception", icon: "i-glass", title: "Reception", date: "2027-02-12", start: "19:00", end: "23:00", venue: VENUE.noc, dark: true },
};

/* ------------------------------------------------------------------ the four invitations */
const PAGES = [
  { path: "pari/v1", label: "Bride v1", side: "bride", events: [EV.sangeetMehendi, EV.haldiBride, EV.wedding] },
  { path: "pari/v2", label: "Bride v2", side: "bride", events: [EV.haldiBride, EV.wedding] },
  { path: "abinash/v1", label: "Groom v1", side: "groom", events: [EV.mehendiGroom, EV.haldiGroom, EV.wedding, EV.reception] },
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

/* ---- Odia support: every translatable element carries its Odia text in data-or; js/main.js swaps it in ---- */
const OD_DIGITS = "୦୧୨୩୪୫୬୭୮୯";
const od = (s) => String(s).replace(/\d/g, (d) => OD_DIGITS[d]);
const OD_DAYS = ["ରବିବାର", "ସୋମବାର", "ମଙ୍ଗଳବାର", "ବୁଧବାର", "ଗୁରୁବାର", "ଶୁକ୍ରବାର", "ଶନିବାର"];
const OD_MONTHS = ["ଜାନୁଆରୀ", "ଫେବୃଆରୀ", "ମାର୍ଚ୍ଚ", "ଏପ୍ରିଲ", "ମଇ", "ଜୁନ", "ଜୁଲାଇ", "ଅଗଷ୍ଟ", "ସେପ୍ଟେମ୍ବର", "ଅକ୍ଟୋବର", "ନଭେମ୍ବର", "ଡିସେମ୍ବର"];
const OD_MON_SHORT = ["ଜାନୁ", "ଫେବୃ", "ମାର୍ଚ୍ଚ", "ଏପ୍ରି", "ମଇ", "ଜୁନ", "ଜୁଲା", "ଅଗ", "ସେପ୍ଟେ", "ଅକ୍ଟୋ", "ନଭେ", "ଡିସେ"];
const OD_TITLES = {
  "Sangeet & Mehendi": "ସଂଗୀତ ଓ ମେହେନ୍ଦି",
  "Mehendi": "ମେହେନ୍ଦି",
  "Haldi": "ହଳଦୀ",
  "Wedding": "ବିବାହ",
  "Reception": "ରିସେପ୍ସନ୍",
};
const tr = (en, or) => `<span data-or="${esc(or)}">${en}</span>`;
const ph = (or) => ` data-or-ph="${esc(or)}"`;
function odDayLabel(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  return `${OD_DAYS[new Date(Date.UTC(y, m - 1, d)).getUTCDay()]} · ${od(d)} ${OD_MONTHS[m - 1]} ${od(y)}`;
}
function odShort(iso) {
  const [, m, d] = iso.split("-").map(Number);
  return `${od(d)} ${OD_MON_SHORT[m - 1]}`;
}
function odClock(hhmm) {
  const [h, m] = hhmm.split(":").map(Number);
  const part = h < 4 ? "ରାତି" : h < 12 ? "ସକାଳ" : h < 16 ? "ଅପରାହ୍ନ" : h < 20 ? "ସନ୍ଧ୍ୟା" : "ରାତି";
  return `${part} ${od(h % 12 === 0 ? 12 : h % 12)}:${od(pad2(m))}`;
}

/* A light-hearted line on the back of each portrait. PLACEHOLDERS: replace with real fun facts. */
const FACTS = {
  groom: { en: "He says he can cook. We'll let you be the judge! 🍳", or: "ସେ କହେ ସେ ରାନ୍ଧିପାରେ। ବିଚାର ଆପଣ କରନ୍ତୁ! 🍳" },
  bride: { en: "She can spot the perfect shade of anything from a mile away. 🎨", or: "ସେ ଯେକୌଣସି ଜିନିଷର ସବୁଠୁ ସୁନ୍ଦର ରଙ୍ଗ ଦୂରରୁ ଚିହ୍ନିପାରେ। 🎨" },
};

function eventCard(ev, i, total, up) {
  const { start, end } = isoRange(ev);
  const dir = ev.venue.map;
  const plan = ev.plan
    ? `<details class="more">
                  <summary>${tr("More details", "ଅଧିକ ବିବରଣୀ")}<svg aria-hidden="true"><use href="#i-chevron"/></svg></summary>
                  <ol class="timeline" aria-label="Wedding day order of events">${ev.plan
                    .map((p) => `<li><time>${tr(p.time, odClock(p.t24))}${p.note ? `<small>${tr(p.note, p.noteOr)}</small>` : ""}</time><span>${tr(esc(p.label), p.labelOr)}</span></li>`)
                    .join("")}</ol>
                </details>`
    : "";
  return `
          <li data-fx="${ev.art === "sangeet" ? "mehendi" : ev.art}" class="event event--${ev.art}${ev.dark ? " event--dark" : ""}${ev.main ? " event--main" : ""} reveal"
              data-title="${esc(ev.title)} · ${esc(GROOM)} &amp; ${esc(BRIDE)}"
              data-start="${start}" data-end="${end}"
              data-location="${esc(ev.venue.name + ", " + ev.venue.addr)}">
            <span class="event__frame" aria-hidden="true"></span>
            <div class="event__panel">
              <div class="event__head">
                <span class="event__count" aria-hidden="true">${tr(`${pad2(i + 1)} / ${pad2(total)}`, od(`${pad2(i + 1)} / ${pad2(total)}`))}</span>
                <button class="event__icon" type="button" aria-label="${esc(ev.title)}: tap for a little surprise"><svg aria-hidden="true"><use href="#${ev.icon}"/></svg></button>
                <span class="event__tap" aria-hidden="true">${tr("Tap here", "ଏଠାରେ ଟାପ୍ କରନ୍ତୁ")}</span>
                <p class="event__day">${tr(dayLabel(ev.date), odDayLabel(ev.date))}</p>
                <h3 class="event__name">${tr(esc(ev.title), OD_TITLES[ev.title])}</h3>
                <p class="event__time"><svg aria-hidden="true"><use href="#i-clock"/></svg>${tr(`${clock(ev.start)} onwards`, `${odClock(ev.start)} ଠାରୁ`)}</p>
                ${plan}
              </div>
              <div class="event__mid" aria-hidden="true">
                <img class="event__paint" src="${up}assets/events/paint-${ev.paint || ev.art}.webp" alt="" loading="lazy" decoding="async" />
              </div>
              <div class="event__foot">
                <div class="event__venue">
                  <svg aria-hidden="true"><use href="#i-pin"/></svg>
                  <p><strong>${tr(esc(ev.venue.name), ev.venue.nameOr)}</strong><br />${tr(esc(ev.venue.addr), ev.venue.addrOr)}</p>
                </div>
                <div class="event__actions">
                  <a class="btn btn--gold" target="_blank" rel="noopener" href="${dir}">
                    <svg aria-hidden="true"><use href="#i-nav"/></svg>${tr("Get Directions", "ରାସ୍ତା ଦେଖନ୍ତୁ")}
                  </a>
                  <button class="btn btn--ghost js-ics" type="button" aria-label="Save ${esc(ev.title)} to calendar">
                    <svg aria-hidden="true"><use href="#i-calendar"/></svg>${tr("Save", "ସେଭ୍ କରନ୍ତୁ")}
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
  const firstOr = bridePage ? BRIDE_OR : GROOM_OR;
  const secondOr = bridePage ? GROOM_OR : BRIDE_OR;
  const initials = `${first[0]}<i>&amp;</i>${second[0]}`;
  const initialsOr = `${firstOr[0]}<i>ଓ</i>${secondOr[0]}`;
  const url = `${SITE}/${p.path}/`;
  const up = "../../";
  const pageTitle = `${first} &amp; ${second} · Wedding Invitation`;
  const ogDesc = "Join us as we begin our forever. 10 February 2027 · Tirtol, Odisha";
  const coupleCard = (key, name, nameOr, prefixOr, role, kinEn, kinOr, fact) => `
          <figure class="couple__card reveal">
            <button class="flip" type="button" aria-pressed="false" aria-label="Tap to flip the photo of ${name}">
              <span class="flip__face flip__front">
                <!-- Photo: edit tools/source/couple-${key}.webp, then run tools/prepare-couple-photos.py -->
                <img src="${up}assets/${key}.webp" alt="Portrait of ${name}" width="900" height="1200" loading="lazy" decoding="async" />
                <span class="flip__badge" aria-hidden="true"><svg><use href="#i-flip"/></svg></span>
              </span>
              <span class="flip__face flip__back" aria-hidden="true" style="background-image:url('${up}assets/back-${key}.webp')">
                <span class="flip__inner">
                  <span class="flip__q">${tr("Did you know?", "ଜାଣିଥିଲେ କି?")}</span>
                  <span class="flip__fact">${tr(esc(fact.en), fact.or)}</span>
                  <svg class="flip__heart" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.2a4.3 4.3 0 0 1 7.5 2.6C19.5 15.4 12 20 12 20z" fill="currentColor"/></svg>
                </span>
              </span>
            </button>
            <figcaption>
              <span class="couple__prefix" lang="or">${prefixOr}</span>
              <span class="couple__name" data-or="${esc(nameOr)}">${name}</span>
              <span class="couple__role">${role}</span>
              <span class="couple__kin">${tr(kinEn, kinOr)}</span>
            </figcaption>
          </figure>`;
  const groomCard = coupleCard("groom", GROOM, GROOM_OR, "ଆୟୁଷ୍ମାନ", "The Groom", "Elder son of<br />Mr. Pashupati Patra<br />&amp; Mrs. Muktirani Patra", "ପଶୁପତି ପାତ୍ର ଓ ମୁକ୍ତିରଣି ପାତ୍ରଙ୍କର,<br />ଜ୍ୟେଷ୍ଠ ପୁତ୍ର", FACTS.groom);
  const brideCard = coupleCard("bride", BRIDE, BRIDE_OR, "ଆୟୁଷ୍ମତି", "The Bride", "Daughter of<br />Mr. Parameswar Parija<br />&amp; Mrs. Subhashree Parija", "ପରମେଶ୍ୱର ପରିଜା ଓ ଶୁଭଶ୍ରୀ ପରିଜାଙ୍କର,<br />ପୁତ୍ରୀ", FACTS.bride);
  const events = p.events.map((e, i) => eventCard(e, i, p.events.length, up)).join("\n");
  const eventChips = p.events
    .map((e) => `<label class="chip"><input type="checkbox" name="events" value="${esc(e.title)}" checked /><span class="chip__body"><span class="chip__title">${tr(esc(e.title), OD_TITLES[e.title])}</span><span class="chip__date">${tr(shortDate(e.date), odShort(e.date))}</span></span></label>`)
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

  <!-- Fonts: Cormorant Garamond (serif headings), Pinyon Script (names), Jost (body), Tiro Devanagari Hindi (Om), Noto Sans Oriya (Odia text), Noto Serif Oriya (Odia names) -->
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,500&family=Jost:wght@300;400;500;600&family=Pinyon+Script&family=Tiro+Devanagari+Hindi&family=Noto+Sans+Oriya:wght@400;500;600&family=Noto+Serif+Oriya:wght@400;500;600&display=swap" rel="stylesheet" />

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
        <span class="envelope__letter-names">${tr(first, firstOr)} <em>${tr("&amp;", "ଓ")}</em> ${tr(second, secondOr)}</span>
        <span class="envelope__letter-line">10 · 02 · 2027</span>
      </span>
      <span class="envelope__pocket" aria-hidden="true"></span>
      <span class="envelope__flap" aria-hidden="true"></span>
      <span class="envelope__seal" aria-hidden="true"><span>${tr(initials, initialsOr)}</span></span>
      <span class="sr-only">Open the invitation</span>
    </button>

    <p class="opener__hint" id="opener-label">
      <span class="opener__for">${tr("You are cordially invited", "ଆପଣଙ୍କୁ ସାଦର ନିମନ୍ତ୍ରଣ")}</span>
      <span class="opener__tap">${tr("Tap to open", "ଖୋଲିବାକୁ ଟାପ୍ କରନ୍ତୁ")}</span>
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
        <button class="hero__mantra" type="button" lang="or" id="mantra" aria-label="Tap for a blessing">॥ ଶ୍ରୀ ଗଣେଶାୟ ନମଃ ॥</button>
        <span class="divider" aria-hidden="true"></span>
        <p class="hero__lead">${tr("Join us for", "ଆମ ସହ ଆନନ୍ଦ ବାଣ୍ଟିବାକୁ ଆସନ୍ତୁ")}</p>
        <p class="hero__the">${tr("The Wedding of", "ଶୁଭ ବିବାହ ଉତ୍ସବ")}</p>
        <h1 class="hero__names" data-order="${bridePage ? "mo-ab" : "ab-mo"}">
          <span class="hero__name" data-n="${first === "Abinash" ? "ab" : "mo"}" data-or="${esc(firstOr)}">${first}</span>
          <span class="hero__amp">${tr("&amp;", "ଓ")}</span>
          <span class="hero__name" data-n="${second === "Abinash" ? "ab" : "mo"}" data-or="${esc(secondOr)}">${second}</span>
        </h1>
        <p class="hero__date">
          <time datetime="2027-02-10">${tr("Wednesday · 10 February 2027", "ବୁଧବାର · ୧୦ ଫେବୃଆରୀ ୨୦୨୭ · ସନ୍ଧ୍ୟା ୭:୦୦")}</time>
          <span class="hero__tithi" lang="or">ଫାଲ୍ଗୁନ କୃଷ୍ଣ ପକ୍ଷ, ନବମୀ ତିଥି</span>
        </p>
        <p class="hero__place">${tr("Tirtol, Odisha", "ତିର୍ତୋଲ, ଓଡ଼ିଶା")}</p>
      </div>

      <a class="scroll-cue" href="#countdown" aria-label="Scroll to details">
        <span class="scroll-cue__mouse" aria-hidden="true"><span></span></span>
      </a>
    </header>

    <main>

      <!-- COUNTDOWN -->
      <section class="section section--countdown" id="countdown" aria-labelledby="countdown-title">
        <p class="eyebrow reveal">${tr("Counting down to forever", "ଚିରସାଥୀ ହେବାର ଗଣନା")}</p>
        <h2 class="section__title reveal" id="countdown-title">${tr("The Big Day", "ଶୁଭ ଦିନ")}</h2>
        <div class="countdown reveal" id="countdown-timer" role="timer" aria-live="off">
          <button type="button" class="countdown__unit" data-fact="days"><span class="countdown__num" data-unit="days">--</span><span class="countdown__label">${tr("Days", "ଦିନ")}</span></button>
          <button type="button" class="countdown__unit" data-fact="hours"><span class="countdown__num" data-unit="hours">--</span><span class="countdown__label">${tr("Hours", "ଘଣ୍ଟା")}</span></button>
          <button type="button" class="countdown__unit" data-fact="minutes"><span class="countdown__num" data-unit="minutes">--</span><span class="countdown__label">${tr("Minutes", "ମିନିଟ୍")}</span></button>
          <button type="button" class="countdown__unit" data-fact="seconds"><span class="countdown__num" data-unit="seconds">--</span><span class="countdown__label">${tr("Seconds", "ସେକେଣ୍ଡ")}</span></button>
        </div>
        <p class="countdown__fact" id="countdown-fact" aria-live="polite">Tap a box for a fun fact</p>
        <p class="countdown__done" id="countdown-done" hidden>${tr("We're married! Thank you for your blessings. ✨", "ଆମେ ବିବାହିତ! ଆପଣଙ୍କ ଆଶୀର୍ବାଦ ପାଇଁ ଧନ୍ୟବାଦ। ✨")}</p>
        <p class="section__note reveal">${tr("10 February 2027 · 7:00 PM IST", "୧୦ ଫେବୃଆରୀ ୨୦୨୭ · ସନ୍ଧ୍ୟା ୭:୦୦ (IST)")}</p>
      </section>

      <!-- FIREWORKS: tap a rocket, it flies up and bursts -->
      <section class="sky" id="sky" aria-label="Fireworks">
        <div class="sky__stage reveal">
          <p class="sky__hint" id="sky-hint"><span class="sky__hand" aria-hidden="true">👆</span> ${tr("Tap on the fireworks", "ଆତସବାଜିରେ ଟାପ୍ କରନ୍ତୁ")}</p>
          <div class="sky__ground" aria-hidden="true"></div>
          <div class="sky__rockets">
            <button class="rocket" type="button" style="left:9%;--c:#e9b949;--c2:#b9852a" data-kind="willow" data-hue="44" aria-label="Launch a firework">
              <svg viewBox="0 0 30 80" aria-hidden="true"><g class="rocket__body"><rect x="14" y="44" width="2" height="36" fill="#c9a56a"/><path class="flame" d="M10.5 50 Q15 76 19.5 50Z" fill="#ffb347"/><path d="M8 46 L3 56 L9 52Z M22 46 L27 56 L21 52Z" fill="var(--c2)"/><rect x="8" y="14" width="14" height="34" rx="3" fill="var(--c)"/><rect x="8" y="27" width="14" height="5" fill="#fff" opacity=".55"/><path d="M8 15 L15 0 L22 15Z" fill="var(--c2)"/></g></svg>
            </button>
            <button class="rocket" type="button" style="left:29%;--c:#e6788f;--c2:#b04560" data-kind="heart" data-hue="340" aria-label="Launch a firework">
              <svg viewBox="0 0 30 80" aria-hidden="true"><g class="rocket__body"><rect x="14" y="44" width="2" height="36" fill="#c9a56a"/><path class="flame" d="M10.5 50 Q15 76 19.5 50Z" fill="#ffb347"/><path d="M8 46 L3 56 L9 52Z M22 46 L27 56 L21 52Z" fill="var(--c2)"/><rect x="8" y="14" width="14" height="34" rx="3" fill="var(--c)"/><rect x="8" y="27" width="14" height="5" fill="#fff" opacity=".55"/><path d="M8 15 L15 0 L22 15Z" fill="var(--c2)"/></g></svg>
            </button>
            <button class="rocket" type="button" style="left:50%;--c:#7fc4a8;--c2:#4a8b72" data-kind="ring" data-hue="160" aria-label="Launch a firework">
              <svg viewBox="0 0 30 80" aria-hidden="true"><g class="rocket__body"><rect x="14" y="44" width="2" height="36" fill="#c9a56a"/><path class="flame" d="M10.5 50 Q15 76 19.5 50Z" fill="#ffb347"/><path d="M8 46 L3 56 L9 52Z M22 46 L27 56 L21 52Z" fill="var(--c2)"/><rect x="8" y="14" width="14" height="34" rx="3" fill="var(--c)"/><rect x="8" y="27" width="14" height="5" fill="#fff" opacity=".55"/><path d="M8 15 L15 0 L22 15Z" fill="var(--c2)"/></g></svg>
            </button>
            <button class="rocket" type="button" style="left:71%;--c:#9b86e0;--c2:#6551b4" data-kind="peony" data-hue="265" aria-label="Launch a firework">
              <svg viewBox="0 0 30 80" aria-hidden="true"><g class="rocket__body"><rect x="14" y="44" width="2" height="36" fill="#c9a56a"/><path class="flame" d="M10.5 50 Q15 76 19.5 50Z" fill="#ffb347"/><path d="M8 46 L3 56 L9 52Z M22 46 L27 56 L21 52Z" fill="var(--c2)"/><rect x="8" y="14" width="14" height="34" rx="3" fill="var(--c)"/><rect x="8" y="27" width="14" height="5" fill="#fff" opacity=".55"/><path d="M8 15 L15 0 L22 15Z" fill="var(--c2)"/></g></svg>
            </button>
            <button class="rocket" type="button" style="left:90%;--c:#f08a4b;--c2:#bf5a22" data-kind="peony" data-hue="22" aria-label="Launch a firework">
              <svg viewBox="0 0 30 80" aria-hidden="true"><g class="rocket__body"><rect x="14" y="44" width="2" height="36" fill="#c9a56a"/><path class="flame" d="M10.5 50 Q15 76 19.5 50Z" fill="#ffb347"/><path d="M8 46 L3 56 L9 52Z M22 46 L27 56 L21 52Z" fill="var(--c2)"/><rect x="8" y="14" width="14" height="34" rx="3" fill="var(--c)"/><rect x="8" y="27" width="14" height="5" fill="#fff" opacity=".55"/><path d="M8 15 L15 0 L22 15Z" fill="var(--c2)"/></g></svg>
            </button>
          </div>
        </div>
      </section>

      <!-- COUPLE -->
      <section class="section section--couple" id="couple" aria-labelledby="couple-title">
        <p class="eyebrow reveal">${tr("Two souls, one journey", "ଦୁଇ ଆତ୍ମା, ଗୋଟିଏ ଯାତ୍ରା")}</p>
        <h2 class="section__title reveal" id="couple-title">${tr("The Couple", "ଦମ୍ପତି")}</h2>

        <div class="couple">${bridePage ? brideCard + groomCard : groomCard + brideCard}
          <div class="couple__hearts" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></div>
        </div>

        <blockquote class="quote reveal">
          <p><span class="quote__line">${tr("“Like Shiva and Shakti, two halves of one whole —", "“ଶିବ ଓ ଶକ୍ତିଙ୍କ ପରି, ଗୋଟିଏ ସମ୍ପୂର୍ଣ୍ଣତାର ଦୁଇ ଅଂଶ —")}</span> <span class="quote__line">${tr("bound by love, blessed by the divine.”", "ପ୍ରେମରେ ବାନ୍ଧି, ଭଗବାନଙ୍କ ଆଶୀର୍ବାଦରେ ଧନ୍ୟ।”")}</span></p>
        </blockquote>
      </section>

      <!-- EVENTS -->
      <section class="section section--events" id="events" aria-labelledby="events-title">
        <p class="eyebrow reveal">${tr("Celebrations", "ଉତ୍ସବ")}</p>
        <h2 class="section__title reveal" id="events-title">${tr("Events &amp; Schedule", "କାର୍ଯ୍ୟକ୍ରମ ସୂଚୀ")}</h2>

        <ol class="events">
${events}
        </ol>
      </section>

      <!-- GIFTS (the humorous one) -->
      <section class="section section--gifts" id="gifts" aria-labelledby="gifts-title">
        <p class="eyebrow reveal">${tr("The Shagun Desk", "ଶଗୁଣ କାଉଣ୍ଟର")}</p>
        <h2 class="section__title reveal" id="gifts-title">${tr("Gift Registry<sup>*</sup>", "ଉପହାର ତାଲିକା<sup>*</sup>")}</h2>

        <div class="shagun card reveal">
          <div class="shagun__coins" aria-hidden="true"><span>💸</span><span>💰</span><span>🪙</span></div>
          <p class="shagun__pitch">${tr("We have a home to set up, a honeymoon to plan, and a mysterious spreadsheet called <em>“Wedding Budget”</em> that is crying in a corner.", "ଆମକୁ ଘର ସଜାଇବାକୁ ଅଛି, ହନିମୁନ୍ ଯୋଜନା କରିବାକୁ ଅଛି, ଆଉ <em>“ବିବାହ ବଜେଟ୍”</em> ନାମକ ଏକ ରହସ୍ୟମୟ ସ୍ପ୍ରେଡ୍‌ସିଟ୍ କୋଣରେ କାନ୍ଦୁଛି।")}</p>
          <p class="shagun__pitch">${tr("Your blessings are priceless. Cash, however, is also accepted. 😇", "ଆପଣଙ୍କ ଆଶୀର୍ବାଦ ଅମୂଲ୍ୟ। ହେଲେ, ନଗଦ ଟଙ୍କା ମଧ୍ୟ ଗ୍ରହଣୀୟ। 😇")}</p>
          <button class="btn btn--gold btn--block shagun__btn" type="button" id="shagun-btn">
            <svg aria-hidden="true"><use href="#i-gift"/></svg>${tr("Send Shagun", "ଶଗୁଣ ପଠାନ୍ତୁ")}
          </button>
          <p class="shagun__fine">${tr("<sup>*</sup>Terms &amp; conditions apply. Clicking may cause guilt.", "<sup>*</sup>ସର୍ତ୍ତ ପ୍ରଯୁଜ୍ୟ। କ୍ଲିକ୍ କଲେ ଦୋଷବୋଧ ହୋଇପାରେ।")}</p>
        </div>
      </section>

      <!-- RSVP -->
      <section class="section section--rsvp" id="rsvp" aria-labelledby="rsvp-title">
        <p class="eyebrow reveal">${tr("Kindly respond by 15 January 2027", "ଦୟାକରି ୧୫ ଜାନୁଆରୀ ୨୦୨୭ ମଧ୍ୟରେ ଜଣାନ୍ତୁ")}</p>
        <h2 class="section__title reveal" id="rsvp-title">${tr("RSVP", "ଉତ୍ତର ଜଣାନ୍ତୁ")}</h2>

        <div class="rsvp reveal">
          <span class="rsvp__corner rsvp__corner--tl" aria-hidden="true"></span>
          <span class="rsvp__corner rsvp__corner--tr" aria-hidden="true"></span>
          <span class="rsvp__corner rsvp__corner--bl" aria-hidden="true"></span>
          <span class="rsvp__corner rsvp__corner--br" aria-hidden="true"></span>

          <form class="form" id="rsvp-form" novalidate>
            <div class="rsvp__head">
              <span class="rsvp__seal" aria-hidden="true"><svg><use href="#i-mail"/></svg></span>
              <p class="rsvp__lead">${tr("Will you celebrate with us?", "ଆପଣ ଆମ ସହ ଉତ୍ସବ ପାଳନ କରିବେ କି?")}</p>
              <p class="rsvp__sub">${tr("Takes less than a minute", "ଏକ ମିନିଟରୁ କମ୍ ସମୟ ଲାଗିବ")}</p>
            </div>

            <fieldset class="field" data-field="attending">
              <legend class="sr-only">Will you attend? *</legend>
              <div class="tiles tiles--2">
                <label class="tile"><input type="radio" name="attending" value="yes" required aria-describedby="e-attending" /><span class="tile__body"><span class="tile__emoji" aria-hidden="true">🎉</span><span class="tile__title">${tr("Joyfully accept", "ଖୁସିରେ ଆସିବି")}</span><span class="tile__sub">${tr("Count me in!", "ମୋତେ ଗଣନ୍ତୁ!")}</span></span></label>
                <label class="tile"><input type="radio" name="attending" value="no" /><span class="tile__body"><span class="tile__emoji" aria-hidden="true">🙏</span><span class="tile__title">${tr("Regretfully decline", "ଦୁଃଖିତ, ଆସିପାରିବି ନାହିଁ")}</span><span class="tile__sub">${tr("Sending blessings", "ଆଶୀର୍ବାଦ ପଠାଉଛି")}</span></span></label>
              </div>
              <p class="field__error" id="e-attending" aria-live="polite"></p>
            </fieldset>

            <div class="field" data-field="name">
              <label for="f-name">${tr("Your name", "ଆପଣଙ୍କ ନାମ")} <span aria-hidden="true">*</span></label>
              <input id="f-name" name="name" type="text" autocomplete="name" placeholder="e.g. Priya Sharma"${ph("ଯଥା: ପ୍ରିୟା ଶର୍ମା")}
                     required minlength="2" maxlength="60" aria-describedby="e-name" />
              <p class="field__error" id="e-name" aria-live="polite"></p>
            </div>

            <div class="form__attending" id="attending-extra" hidden>
              <fieldset class="field" data-field="events">
                <legend>${tr("Events I'm attending", "ମୁଁ ଯେଉଁ କାର୍ଯ୍ୟକ୍ରମରେ ଯୋଗ ଦେବି")} <span aria-hidden="true">*</span></legend>
                <div class="chips" id="event-chips">${eventChips}</div>
                <p class="field__error" id="e-events" aria-live="polite"></p>
              </fieldset>

              <div class="field" data-field="guests">
                <label for="f-guests">${tr("How many of you are coming?", "ଆପଣମାନେ କେତେ ଜଣ ଆସୁଛନ୍ତି?")} <span class="field__opt">${tr("(including you)", "(ଆପଣଙ୍କୁ ମିଶାଇ)")}</span></label>
                <div class="stepper">
                  <button type="button" class="stepper__btn" data-step="-1" aria-label="Fewer guests">−</button>
                  <input id="f-guests" name="guests" type="number" inputmode="numeric" min="1" max="10" value="1" aria-describedby="e-guests" />
                  <button type="button" class="stepper__btn" data-step="1" aria-label="More guests">+</button>
                </div>
                <p class="field__error" id="e-guests" aria-live="polite"></p>
              </div>

              <fieldset class="field" data-field="food">
                <legend>${tr("Food preference", "ଖାଦ୍ୟ ପସନ୍ଦ")} <span aria-hidden="true">*</span></legend>
                <div class="tiles tiles--3">
                  <label class="tile tile--sm"><input type="radio" name="food" value="veg" aria-describedby="e-food" /><span class="tile__body"><span class="tile__emoji" aria-hidden="true">🥗</span><span class="tile__title">${tr("Veg", "ନିରାମିଷ")}</span></span></label>
                  <label class="tile tile--sm"><input type="radio" name="food" value="non-veg" /><span class="tile__body"><span class="tile__emoji" aria-hidden="true">🍗</span><span class="tile__title">${tr("Non-veg", "ଆମିଷ")}</span></span></label>
                </div>
                <p class="field__error" id="e-food" aria-live="polite"></p>
              </fieldset>
            </div>

            <div class="field" data-field="message">
              <label for="f-message">${tr("A wish for the couple", "ଦମ୍ପତିଙ୍କ ପାଇଁ ଶୁଭେଚ୍ଛା")} <span class="field__opt">${tr("(optional)", "(ଇଚ୍ଛାଧୀନ)")}</span></label>
              <textarea id="f-message" name="message" rows="4" maxlength="300"
                        placeholder="Share your blessings, a memory or a warm wish…"${ph("ଆପଣଙ୍କ ଆଶୀର୍ବାଦ, ସ୍ମୃତି ବା ଶୁଭେଚ୍ଛା ଲେଖନ୍ତୁ…")} aria-describedby="e-message c-message"></textarea>
              <div class="field__foot">
                <p class="field__error" id="e-message" aria-live="polite"></p>
                <span class="field__count" id="c-message">0 / 300</span>
              </div>
            </div>

            <button class="btn btn--primary btn--block" type="submit" id="rsvp-submit">
              <span class="btn__label" data-or="ହ୍ୱାଟସଆପ୍ ଜରିଆରେ ପଠାନ୍ତୁ">Send RSVP via WhatsApp</span>
              <span class="btn__spinner" aria-hidden="true"></span>
            </button>
            <p class="form__note">${tr("Next, we'll open WhatsApp with your RSVP ready to go.", "ପରେ, ଆପଣଙ୍କ ଉତ୍ତର ସହ ହ୍ୱାଟସଆପ୍ ଖୋଲିବ।")}</p>
            <p class="form__status" id="rsvp-status" role="status" aria-live="polite"></p>
          </form>

          <div class="rsvp__done" id="rsvp-done" hidden tabindex="-1">
            <div class="rsvp__done-icon" aria-hidden="true"><svg><use href="#i-heart"/></svg></div>
            <h3 class="rsvp__done-title" id="rsvp-done-title">Thank you!</h3>
            <p class="rsvp__done-text" id="rsvp-done-text"></p>
            <a class="btn btn--whatsapp btn--block" id="rsvp-whatsapp" target="_blank" rel="noopener" href="#">
              <svg aria-hidden="true"><use href="#i-whatsapp"/></svg>${tr("Send RSVP on WhatsApp", "ହ୍ୱାଟସଆପ୍‌ରେ ପଠାନ୍ତୁ")}
            </a>
            <button class="btn btn--ghost btn--block" type="button" id="rsvp-edit">${tr("Edit my response", "ମୋ ଉତ୍ତର ବଦଳାନ୍ତୁ")}</button>
          </div>
        </div>
      </section>

    </main>

    <footer class="footer">
      <svg class="footer__heart" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.2a4.3 4.3 0 0 1 7.5 2.6C19.5 15.4 12 20 12 20z" fill="currentColor"/></svg>
      <p class="footer__names">${tr(first, firstOr)} <span>${tr("&amp;", "ଓ")}</span> ${tr(second, secondOr)}</p>
      <p class="footer__text">${tr("With love and gratitude, we look forward to celebrating with you.", "ପ୍ରେମ ଓ କୃତଜ୍ଞତା ସହ, ଆପଣଙ୍କ ସହ ଏହି ଉତ୍ସବ ପାଳନ କରିବାକୁ ଅପେକ୍ଷାରେ ଅଛୁ।")}</p>
      <p class="footer__tag">#AbinashWedsMousumi</p>
    </footer>

    <!-- Bottom nav (social-app style) -->
    <nav class="tabbar" id="tabbar" aria-label="Sections">
      <a class="tabbar__item is-active" href="#home"><svg aria-hidden="true"><use href="#i-home"/></svg><span>${tr("Home", "ହୋମ୍")}</span></a>
      <a class="tabbar__item" href="#events"><svg aria-hidden="true"><use href="#i-calendar"/></svg><span>${tr("Events", "କାର୍ଯ୍ୟକ୍ରମ")}</span></a>
      <a class="tabbar__item" href="#gifts"><svg aria-hidden="true"><use href="#i-gift"/></svg><span>${tr("Gifts", "ଉପହାର")}</span></a>
      <a class="tabbar__item" href="#rsvp"><svg aria-hidden="true"><use href="#i-mail"/></svg><span>${tr("RSVP", "ଉତ୍ତର")}</span></a>
      <button class="tabbar__item" type="button" id="share-btn"><svg aria-hidden="true"><use href="#i-share"/></svg><span>${tr("Share", "ଶେୟାର୍")}</span></button>
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
        <button class="btn btn--ghost btn--block" type="button" id="shagun-insist" data-or="ନା, ମୁଁ ଜିଦ୍ କରୁଛି! 😤">No, I insist! 😤</button>
      </div>
    </div>
  </dialog>

  <!-- WhatsApp reminder popup -->
  <dialog class="modal" id="wa-modal" aria-labelledby="wa-title">
    <div class="modal__card">
      <h3 class="modal__title" id="wa-title">${tr("One last step 💚", "ଶେଷ ପଦକ୍ଷେପ 💚")}</h3>
      <p class="modal__text">${tr("<strong>Please do not forget to press “Send” in WhatsApp.</strong> Your RSVP only reaches us once you send it.", "<strong>ଦୟାକରି ହ୍ୱାଟସଆପ୍‌ରେ “Send” ଦାବିବାକୁ ଭୁଲିବେ ନାହିଁ।</strong> ଆପଣ ପଠାଇଲେ ହିଁ ଆପଣଙ୍କ ଉତ୍ତର ଆମ ପାଖରେ ପହଞ୍ଚିବ।")}</p>
      <img class="modal__img" src="${up}assets/whatsapp-send.svg" data-src-or="${up}assets/whatsapp-send-or.svg" alt="In WhatsApp, tap the green send arrow at the bottom right" width="360" height="210" />
      <div class="modal__actions">
        <a class="btn btn--whatsapp btn--block" id="wa-open" target="_blank" rel="noopener" href="#">
          <svg aria-hidden="true"><use href="#i-whatsapp"/></svg>${tr("Open WhatsApp", "ହ୍ୱାଟସଆପ୍ ଖୋଲନ୍ତୁ")}
        </a>
        <button class="btn btn--ghost btn--block" type="button" id="wa-cancel">${tr("Go back", "ପଛକୁ ଯାଆନ୍ତୁ")}</button>
      </div>
    </div>
  </dialog>

  <button class="lang" id="lang-btn" type="button" aria-label="Switch language: English or Odia">ଓଡ଼ିଆ</button>

  <div class="progress" aria-hidden="true"><span id="progress-bar"></span></div>

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
