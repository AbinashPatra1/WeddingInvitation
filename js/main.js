/* =========================================================
   Abinash & Mousumi — Wedding Invitation
   Vanilla JS: envelope, countdown, reveal, nav, RSVP, copy
   ========================================================= */
(function () {
  "use strict";

  /* ---------- CONFIG: edit these ---------- */
  var CONFIG = {
    // Countdown target (IST)
    weddingDate: "2027-02-12T19:30:00+05:30",

    // WhatsApp number that receives every RSVP (country code + digits only, no "+" or spaces).
    // e.g. "919876543210". On submit, WhatsApp opens with the RSVP message pre-filled for this number.
    whatsappNumber: "",

    storageKey: "am-wedding-rsvp"
  };

  var doc = document;
  var body = doc.body;
  var $ = function (sel, ctx) { return (ctx || doc).querySelector(sel); };
  var $$ = function (sel, ctx) { return Array.prototype.slice.call((ctx || doc).querySelectorAll(sel)); };
  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  doc.documentElement.classList.remove("no-js");

  /* Safe storage helpers (private mode / blocked storage) */
  var store = {
    get: function (k) { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } },
    set: function (k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* ignore */ } }
  };

  /* ---------- Toast ---------- */
  var toastEl = $("#toast");
  var toastTimer;
  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add("is-visible");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove("is-visible"); }, 2200);
  }

  /* ---------- 1. Envelope opener ---------- */
  var opener = $("#opener");
  var envelope = $("#envelope");
  var opened = false;

  function openInvite() {
    if (opened) return;
    opened = true;
    envelope.classList.add("is-open");
    opener.classList.add("is-opening");
    if (navigator.vibrate) { try { navigator.vibrate(15); } catch (e) { /* ignore */ } }

    var delay = reduceMotion ? 50 : 1700;
    setTimeout(function () {
      opener.classList.add("is-gone");
      body.classList.remove("is-locked");
      body.classList.add("is-open");
      window.scrollTo(0, 0);
      setTimeout(function () { opener.setAttribute("hidden", ""); }, 900);
    }, delay);
  }
  envelope.addEventListener("click", openInvite);
  opener.addEventListener("click", function (e) { if (e.target === opener || e.target.closest(".opener__hint")) openInvite(); });

  /* ---------- 2. Countdown ---------- */
  var target = new Date(CONFIG.weddingDate).getTime();
  var numEls = {};
  $$(".countdown__num").forEach(function (el) { numEls[el.getAttribute("data-unit")] = el; });
  var last = {};
  var cdTimer;

  function pad(n) { return n < 10 ? "0" + n : String(n); }
  function setUnit(unit, val) {
    if (last[unit] === val) return;
    last[unit] = val;
    var el = numEls[unit];
    el.textContent = val;
    if (!reduceMotion) {
      el.classList.remove("tick");
      void el.offsetWidth; // restart animation
      el.classList.add("tick");
    }
  }
  function updateCountdown() {
    var diff = target - Date.now();
    if (diff <= 0) {
      clearInterval(cdTimer);
      $("#countdown-timer").hidden = true;
      $("#countdown-done").hidden = false;
      return;
    }
    var s = Math.floor(diff / 1000);
    setUnit("days", String(Math.floor(s / 86400)));
    setUnit("hours", pad(Math.floor((s % 86400) / 3600)));
    setUnit("minutes", pad(Math.floor((s % 3600) / 60)));
    setUnit("seconds", pad(s % 60));
  }
  updateCountdown();
  cdTimer = setInterval(updateCountdown, 1000);

  /* ---------- 3. Reveal on scroll ---------- */
  var reveals = $$(".reveal");
  if ("IntersectionObserver" in window && !reduceMotion) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
    reveals.forEach(function (el, i) {
      // gentle stagger for siblings
      el.style.transitionDelay = (i % 3) * 80 + "ms";
      io.observe(el);
    });
  } else {
    reveals.forEach(function (el) { el.classList.add("is-visible"); });
  }

  /* ---------- 4. Bottom nav: active state + smooth scroll ---------- */
  var tabs = $$(".tabbar__item[href]");
  var sectionIds = { home: "home", countdown: "home", couple: "home", events: "events", rsvp: "rsvp", gifts: "gifts" };

  function setActive(id) {
    tabs.forEach(function (t) {
      var on = t.getAttribute("href") === "#" + id;
      t.classList.toggle("is-active", on);
      if (on) t.setAttribute("aria-current", "true"); else t.removeAttribute("aria-current");
    });
  }
  if ("IntersectionObserver" in window) {
    var navIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) setActive(sectionIds[entry.target.id] || "home");
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    Object.keys(sectionIds).forEach(function (id) { var el = doc.getElementById(id); if (el) navIO.observe(el); });
  }

  $$('a[href^="#"]').forEach(function (a) {
    a.addEventListener("click", function (e) {
      var id = a.getAttribute("href").slice(1);
      var el = id && doc.getElementById(id);
      if (!el) return;
      e.preventDefault();
      el.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
      if (history.replaceState) history.replaceState(null, "", "#" + id);
    });
  });

  /* ---------- 5. Share ---------- */
  $("#share-btn").addEventListener("click", function () {
    var data = {
      title: "Abinash & Mousumi · Wedding Invitation",
      text: "You're invited to the wedding of Abinash & Mousumi — 12 Feb 2027, Bhubaneswar 💐",
      url: location.href.split("#")[0]
    };
    if (navigator.share) {
      navigator.share(data).catch(function () { /* user cancelled */ });
    } else {
      copyText(data.url).then(function () { toast("Invitation link copied"); });
    }
  });

  /* ---------- 6. Add to calendar (.ics) ---------- */
  function icsDate(iso) {
    return new Date(iso).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  }
  function icsEscape(s) { return String(s).replace(/([,;\\])/g, "\\$1").replace(/\n/g, "\\n"); }

  $$(".js-ics").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var ev = btn.closest(".event");
      var d = ev.dataset;
      var ics = [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "PRODID:-//AbinashMousumi//Wedding//EN",
        "BEGIN:VEVENT",
        "UID:" + icsDate(d.start) + "-am-wedding@invite",
        "DTSTAMP:" + icsDate(new Date().toISOString()),
        "DTSTART:" + icsDate(d.start),
        "DTEND:" + icsDate(d.end),
        "SUMMARY:" + icsEscape(d.title),
        "LOCATION:" + icsEscape(d.location),
        "DESCRIPTION:" + icsEscape("We can't wait to celebrate with you! " + location.href.split("#")[0]),
        "END:VEVENT",
        "END:VCALENDAR"
      ].join("\r\n");
      var blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
      var url = URL.createObjectURL(blob);
      var a = doc.createElement("a");
      a.href = url;
      a.download = d.title.split(" · ")[0].replace(/[^a-z0-9]+/gi, "-").toLowerCase() + ".ics";
      doc.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
      toast("Added to your calendar file");
    });
  });

  /* ---------- 7. Copy to clipboard ---------- */
  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text);
    }
    return new Promise(function (resolve, reject) {
      var ta = doc.createElement("textarea");
      ta.value = text;
      ta.setAttribute("readonly", "");
      ta.style.cssText = "position:fixed;top:0;left:0;opacity:0;";
      doc.body.appendChild(ta);
      ta.select();
      ta.setSelectionRange(0, text.length);
      try { doc.execCommand("copy") ? resolve() : reject(); } catch (e) { reject(e); }
      ta.remove();
    });
  }

  $$("[data-copy]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var label = btn.querySelector("span");
      copyText(btn.getAttribute("data-copy")).then(function () {
        toast("Copied to clipboard");
        if (btn.classList.contains("copy-btn")) {
          btn.classList.add("is-copied");
          btn.querySelector("use").setAttribute("href", "#i-check");
          if (label) label.textContent = "Copied";
          setTimeout(function () {
            btn.classList.remove("is-copied");
            btn.querySelector("use").setAttribute("href", "#i-copy");
            if (label) label.textContent = "Copy";
          }, 1800);
        }
      }).catch(function () { toast("Couldn't copy — please long-press to select"); });
    });
  });

  /* ---------- 8. RSVP form ---------- */
  var form = $("#rsvp-form");
  var extra = $("#attending-extra");
  var submitBtn = $("#rsvp-submit");
  var statusEl = $("#rsvp-status");
  var doneEl = $("#rsvp-done");
  var msg = $("#f-message");
  var counter = $("#c-message");
  var guests = $("#f-guests");
  var nameInput = $("#f-name");
  var phoneInput = $("#f-phone");

  var validators = {
    name: function () {
      var v = nameInput.value.trim();
      if (!v) return "Please tell us your name.";
      if (v.length < 2) return "Name looks a little short.";
      if (!/^[\p{L}\p{M}' .-]+$/u.test(v)) return "Please use letters only.";
      return "";
    },
    phone: function () {
      var v = phoneInput.value.trim();
      if (!v) return "";
      var digits = v.replace(/\D/g, "");
      if (!/^[+\d\s()-]+$/.test(v) || digits.length < 10 || digits.length > 13) return "Please enter a valid phone number.";
      return "";
    },
    attending: function () {
      return form.attending.value ? "" : "Please let us know if you can make it.";
    },
    guests: function () {
      if (form.attending.value !== "yes") return "";
      var n = Number(guests.value);
      if (!Number.isInteger(n) || n < 1 || n > 10) return "Please choose between 1 and 10 guests.";
      return "";
    },
    food: function () {
      if (form.attending.value !== "yes") return "";
      return form.food.value ? "" : "Please pick a food preference.";
    },
    message: function () {
      return msg.value.length > 300 ? "Please keep your wish under 300 characters." : "";
    }
  };

  function fieldWrap(name) { return form.querySelector('[data-field="' + name + '"]'); }

  function validateField(name, showValid) {
    var error = validators[name]();
    var wrap = fieldWrap(name);
    var errEl = $("#e-" + name);
    if (!wrap) return !error;
    wrap.classList.toggle("is-invalid", !!error);
    wrap.classList.toggle("is-valid", !error && !!showValid);
    if (errEl) errEl.textContent = error;
    $$("input, textarea", wrap).forEach(function (inp) {
      if (error) inp.setAttribute("aria-invalid", "true"); else inp.removeAttribute("aria-invalid");
    });
    return !error;
  }

  // Immediate feedback: validate on blur, re-validate live once a field has been touched
  var touched = {};
  ["name", "phone"].forEach(function (name) {
    var input = $("#f-" + name);
    input.addEventListener("blur", function () {
      if (input.value.trim() || touched[name]) { touched[name] = true; validateField(name, !!input.value.trim()); }
    });
    input.addEventListener("input", function () {
      if (touched[name]) validateField(name, !!input.value.trim());
    });
  });

  function toggleExtra() {
    var yes = form.attending.value === "yes";
    extra.hidden = !yes;
    if (!yes) { fieldWrap("food").classList.remove("is-invalid"); $("#e-food").textContent = ""; }
  }
  $$('input[name="attending"]').forEach(function (r) {
    r.addEventListener("change", function () { validateField("attending"); toggleExtra(); });
  });
  $$('input[name="food"]').forEach(function (r) {
    r.addEventListener("change", function () { validateField("food"); });
  });

  // Guest stepper
  $$(".stepper__btn").forEach(function (b) {
    b.addEventListener("click", function () {
      var n = (parseInt(guests.value, 10) || 1) + Number(b.getAttribute("data-step"));
      guests.value = Math.min(10, Math.max(1, n));
      validateField("guests");
    });
  });
  guests.addEventListener("input", function () { validateField("guests"); });

  // Message counter
  function updateCounter() {
    var len = msg.value.length;
    counter.textContent = len + " / 300";
    counter.classList.toggle("is-near", len > 260);
  }
  msg.addEventListener("input", function () { updateCounter(); validateField("message"); });

  function collect() {
    var attending = form.attending.value;
    return {
      name: nameInput.value.trim(),
      phone: phoneInput.value.trim(),
      attending: attending,
      guests: attending === "yes" ? Number(guests.value) : 0,
      food: attending === "yes" ? form.food.value : "",
      diet: attending === "yes" ? form.diet.value.trim() : "",
      message: msg.value.trim(),
      submittedAt: new Date().toISOString()
    };
  }

  function whatsappLink(d) {
    var foodLabel = { veg: "Veg", "non-veg": "Non-veg", jain: "Jain" }[d.food] || "";
    var yes = d.attending === "yes";
    var lines = [
      "💌 *New RSVP — Abinash & Mousumi's Wedding*",
      "",
      "👤 *Name:* " + d.name
    ];
    if (d.phone) lines.push("📞 *Phone:* " + d.phone);
    lines.push(yes ? "✅ *Attending:* Joyfully accepts 🎉" : "❌ *Attending:* Regretfully declines 🙏");
    if (yes) {
      lines.push("👥 *Guests:* " + d.guests);
      lines.push("🍽️ *Food:* " + foodLabel);
      if (d.diet) lines.push("⚠️ *Dietary notes:* " + d.diet);
    }
    if (d.message) { lines.push(""); lines.push("💬 *Wish:* " + d.message); }
    var base = CONFIG.whatsappNumber ? "https://wa.me/" + CONFIG.whatsappNumber : "https://wa.me/";
    return base + "?text=" + encodeURIComponent(lines.join("\n"));
  }

  function showDone(d, noFocus) {
    var first = d.name.split(" ")[0];
    $("#rsvp-done-title").textContent = d.attending === "yes" ? "Thank you, " + first + "!" : "We'll miss you, " + first;
    $("#rsvp-done-text").textContent = d.attending === "yes"
      ? "We're so happy you'll be celebrating with us" + (d.guests > 1 ? " — all " + d.guests + " of you" : "") + ". See you soon!"
      : "Thank you for letting us know. Your blessings mean the world to us.";
    $("#rsvp-whatsapp").href = whatsappLink(d);
    form.hidden = true;
    doneEl.hidden = false;
    if (!noFocus) doneEl.focus({ preventScroll: true });
  }

  function fillForm(d) {
    nameInput.value = d.name || "";
    phoneInput.value = d.phone || "";
    $$('input[name="attending"]').forEach(function (r) { r.checked = r.value === d.attending; });
    guests.value = d.guests || 1;
    $$('input[name="food"]').forEach(function (r) { r.checked = r.value === d.food; });
    form.diet.value = d.diet || "";
    msg.value = d.message || "";
    toggleExtra();
    updateCounter();
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    statusEl.textContent = "";
    var order = ["name", "phone", "attending", "guests", "food", "message"];
    var firstBad = null;
    order.forEach(function (name) {
      touched[name] = true;
      var ok = validateField(name, name === "name" || (name === "phone" && phoneInput.value.trim()));
      if (!ok && !firstBad) firstBad = name;
    });
    if (firstBad) {
      var wrap = fieldWrap(firstBad);
      wrap.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "center" });
      var focusEl = $("input, textarea", wrap);
      if (focusEl) setTimeout(function () { focusEl.focus({ preventScroll: true }); }, 350);
      return;
    }

    var data = collect();
    store.set(CONFIG.storageKey, data);
    showDone(data);
    // Opened synchronously inside the submit gesture so popup blockers allow it.
    // If it is blocked, the "Send on WhatsApp" button on the thank-you card still works.
    window.open(whatsappLink(data), "_blank", "noopener");
  });

  $("#rsvp-edit").addEventListener("click", function () {
    doneEl.hidden = true;
    form.hidden = false;
    $(".btn__label", submitBtn).textContent = "Update RSVP";
    nameInput.focus();
    $(".btn__label", submitBtn).dataset.idle = "Update RSVP";
  });

  // Restore a previous response from this device
  var saved = store.get(CONFIG.storageKey);
  if (saved && saved.name) {
    fillForm(saved);
    showDone(saved, true);
  }
  updateCounter();
})();
