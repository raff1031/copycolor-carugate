(function () {
  "use strict";

  // Anno nel footer
  var yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // Menu mobile
  var toggle = document.getElementById("navToggle");
  var nav = document.getElementById("main-nav");
  if (toggle && nav) {
    var setOpen = function (open) {
      toggle.setAttribute("aria-expanded", String(open));
      toggle.setAttribute("aria-label", open ? "Chiudi il menu" : "Apri il menu");
      nav.classList.toggle("is-open", open);
    };
    toggle.addEventListener("click", function () {
      setOpen(toggle.getAttribute("aria-expanded") !== "true");
    });
    nav.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () { setOpen(false); });
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") setOpen(false);
    });
  }

  // Aperto / chiuso adesso (ora di Roma)
  // Orari: lunedì–venerdì 9:00–12:30 e 15:00–18:45, festivi nazionali chiuso.
  var SLOTS = [[9 * 60, 12 * 60 + 30], [15 * 60, 18 * 60 + 45]];
  var FIXED_HOLIDAYS = ["01-01", "01-06", "04-25", "05-01", "06-02", "08-15", "11-01", "12-08", "12-25", "12-26"];
  var DAYS = ["domenica", "lunedì", "martedì", "mercoledì", "giovedì", "venerdì", "sabato"];

  function pad(n) { return (n < 10 ? "0" : "") + n; }
  function hhmm(min) { return Math.floor(min / 60) + ":" + pad(min % 60); }

  function easterMonday(y) {
    var a = y % 19, b = Math.floor(y / 100), c = y % 100, d = Math.floor(b / 4), e = b % 4;
    var f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3);
    var h = (19 * a + b - d - g + 15) % 30, i = Math.floor(c / 4), k = c % 4;
    var l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451);
    var month = Math.floor((h + l - 7 * m + 114) / 31), day = ((h + l - 7 * m + 114) % 31) + 1;
    var sunday = new Date(Date.UTC(y, month - 1, day));
    sunday.setUTCDate(sunday.getUTCDate() + 1);
    return pad(sunday.getUTCMonth() + 1) + "-" + pad(sunday.getUTCDate());
  }

  function isWorkday(date) {
    var wd = date.getUTCDay();
    if (wd === 0 || wd === 6) return false;
    var key = pad(date.getUTCMonth() + 1) + "-" + pad(date.getUTCDate());
    if (FIXED_HOLIDAYS.indexOf(key) !== -1) return false;
    return key !== easterMonday(date.getUTCFullYear());
  }

  function romeNow() {
    var parts = {};
    new Intl.DateTimeFormat("en-GB", {
      timeZone: "Europe/Rome", year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", hourCycle: "h23"
    }).formatToParts(new Date()).forEach(function (p) { parts[p.type] = p.value; });
    return {
      date: new Date(Date.UTC(+parts.year, +parts.month - 1, +parts.day)),
      minutes: (+parts.hour) * 60 + (+parts.minute)
    };
  }

  function statusText() {
    var now = romeNow();
    if (isWorkday(now.date)) {
      for (var s = 0; s < SLOTS.length; s++) {
        if (now.minutes >= SLOTS[s][0] && now.minutes < SLOTS[s][1]) {
          return { open: true, text: "Aperto ora, fino alle " + hhmm(SLOTS[s][1]) };
        }
        if (now.minutes < SLOTS[s][0]) {
          return { open: false, text: "Chiuso ora, " + (s === 0 ? "apre" : "riapre") + " alle " + hhmm(SLOTS[s][0]) };
        }
      }
    }
    for (var i = 1; i <= 10; i++) {
      var next = new Date(now.date.getTime());
      next.setUTCDate(next.getUTCDate() + i);
      if (isWorkday(next)) {
        var when = i === 1 ? "domani" : DAYS[next.getUTCDay()];
        return { open: false, text: "Chiuso ora, riapre " + when + " alle " + hhmm(SLOTS[0][0]) };
      }
    }
    return null;
  }

  var statusEls = document.querySelectorAll("[data-open-status]");
  function renderStatus() {
    var st;
    try { st = statusText(); } catch (e) { st = null; }
    statusEls.forEach(function (el) {
      if (!st) { el.hidden = true; return; }
      el.textContent = st.text;
      el.classList.toggle("is-open", st.open);
      el.hidden = false;
    });
  }
  if (statusEls.length) {
    renderStatus();
    setInterval(renderStatus, 60 * 1000);
  }
})();
