/* Shared by the two consoles (tim/ and ruang/): language, views, small helpers. No libraries.
   The data itself comes from the database through assets/js/db.js; this file only draws and switches. */
window.K = (function () {
  'use strict';
  var doc = document, root = doc.documentElement;
  function $(s, c) { return (c || doc).querySelector(s); }
  function $$(s, c) { return Array.prototype.slice.call((c || doc).querySelectorAll(s)); }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  /* ---------- Language: the same key as the home page, so the choice travels with the visitor ---------- */
  var lang = 'id';
  try { if (localStorage.getItem('nawala-lang') === 'en') lang = 'en'; } catch (e) {}
  function t(id, en) { return lang === 'en' ? en : id; }
  var afterLang = [];
  function keep(scope) {
    $$('[data-en]', scope).forEach(function (el) { if (!el.hasAttribute('data-id')) el.setAttribute('data-id', el.textContent); });
    $$('[data-en-placeholder]', scope).forEach(function (el) { if (!el.hasAttribute('data-id-placeholder')) el.setAttribute('data-id-placeholder', el.placeholder); });
  }
  function applyLang() {
    root.lang = lang;
    keep(doc);
    $$('[data-en]').forEach(function (el) { el.textContent = el.getAttribute('data-' + lang); });
    $$('[data-en-placeholder]').forEach(function (el) { el.placeholder = el.getAttribute('data-' + lang + '-placeholder'); });
    $$('[data-lang]').forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-lang') === lang)); });
    afterLang.forEach(function (fn) { fn(); });
  }
  $$('[data-lang]').forEach(function (b) {
    b.addEventListener('click', function () {
      lang = b.getAttribute('data-lang');
      try { localStorage.setItem('nawala-lang', lang); } catch (e) {}
      applyLang();
    });
  });

  /* ---------- Icons (24 grid, 2px stroke) ---------- */
  var ICON = {
    home: '<path d="M4 11.500 12 4l8 7.500"/><path d="M6 10v9h12v-9"/>',
    inbox: '<path d="M4 6h16v12H4z"/><path d="m4 7 8 6 8-6"/>',
    letter: '<path d="M5 4h14v16H5z"/><path d="M9 9h6M9 13h6M9 17h3"/>',
    themes: '<path d="m12 3 9 5-9 5-9-5z"/><path d="m3 13 9 5 9-5"/>',
    key: '<circle cx="8" cy="15" r="4"/><path d="m11 12 9-9M16 7l3 3"/>',
    search: '<circle cx="11" cy="11" r="6.500"/><path d="m16 16 4.500 4.500"/>',
    heart: '<path d="M12 20c-5-3.600-8-6.500-8-10a4.300 4.300 0 0 1 8-2.300A4.300 4.300 0 0 1 20 10c0 3.500-3 6.400-8 10z"/>',
    x: '<path d="m6 6 12 12M18 6 6 18"/>',
    undo: '<path d="M8 7 4 11l4 4"/><path d="M4 11h10a5 5 0 0 1 0 10h-3"/>',
    calendar: '<rect x="4" y="5" width="16" height="15" rx="3"/><path d="M4 10h16M9 3v4M15 3v4"/>',
    check: '<path d="m5 12.500 4.500 4.500L19 7.500"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    copy: '<rect x="8" y="8" width="12" height="12" rx="2.500"/><path d="M16 8V6.500A2.500 2.500 0 0 0 13.500 4h-7A2.500 2.500 0 0 0 4 6.500v7A2.500 2.500 0 0 0 6.500 16H8"/>',
    cards: '<rect x="7" y="4" width="12" height="16" rx="2.500"/><path d="M4 7v10"/>',
    grid: '<path d="M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z"/>',
    tune: '<path d="M4 7h10M18 7h2M4 17h2M10 17h10"/><circle cx="16" cy="7" r="2"/><circle cx="8" cy="17" r="2"/>',
    chat: '<path d="M5 5h14v11H10l-5 4z"/>',
    pulse: '<path d="M3 12h4l2.500-6 4 12 2.500-6H21"/>',
    shield: '<path d="M12 3 5 6v6c0 4.200 3 7.500 7 9 4-1.500 7-4.800 7-9V6z"/>',
    seat: '<circle cx="12" cy="12" r="4"/><circle cx="12" cy="3.500" r="1.400"/><circle cx="12" cy="20.500" r="1.400"/><circle cx="3.500" cy="12" r="1.400"/><circle cx="20.500" cy="12" r="1.400"/>',
    tasks: '<rect x="4" y="4" width="16" height="16" rx="3"/><path d="m8 9 1.5 1.5L12 8M8 15l1.5 1.5L12 14M14 9.500h2.500M14 15.500h2.500"/>',
    video: '<rect x="3" y="6" width="13" height="12" rx="3"/><path d="m16 10 5-3v10l-5-3"/>'
  };
  function ic(name) { return '<svg class="ic" viewBox="0 0 24 24" aria-hidden="true">' + (ICON[name] || '') + '</svg>'; }
  $$('[data-ic]').forEach(function (el) { el.insertAdjacentHTML('afterbegin', ic(el.getAttribute('data-ic'))); });

  /* ---------- Views: the rail switches them; the address keeps a plain #name ---------- */
  var views = $$('.view'), links = $$('.k__rail a'), onShow = {};
  function show(name) {
    /* a view can be closed to this person (hidden): it then cannot be reached by its address either */
    var found = views.some(function (v) { return v.getAttribute('data-view') === name && !v.hidden; });
    if (!found) name = views[0].getAttribute('data-view');
    views.forEach(function (v) { v.classList.toggle('is-on', v.getAttribute('data-view') === name); });
    links.forEach(function (a) {
      if (a.getAttribute('href') === '#' + name) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
    });
    window.scrollTo(0, 0);
    if (onShow[name]) onShow[name]();
  }
  function go(name) {
    if (location.hash === '#' + name) show(name); else location.hash = name;
  }
  window.addEventListener('hashchange', function () { show(location.hash.slice(1)); });
  doc.addEventListener('click', function (e) {
    var a = e.target.closest('[data-go]');
    if (a) { e.preventDefault(); go(a.getAttribute('data-go')); }
  });

  /* ---------- Toast ---------- */
  var toastEl, toastTimer;
  function toast(msg) {
    if (!toastEl) { toastEl = doc.createElement('div'); toastEl.className = 'toast'; toastEl.setAttribute('role', 'status'); doc.body.appendChild(toastEl); }
    toastEl.textContent = msg;
    toastEl.classList.add('is-on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove('is-on'); }, 3200);
  }
  function offline() { toast(t('Database Nawala belum bisa dihubungi. Coba lagi sebentar lagi.', 'The Nawala database cannot be reached. Please try again in a moment.')); }

  /* ---------- Tooltip for chart marks: [data-tip] on anything that can be hovered or focused ---------- */
  var tipEl;
  function tipShow(el) {
    if (!tipEl) { tipEl = doc.createElement('div'); tipEl.className = 'tip'; doc.body.appendChild(tipEl); }
    var r = el.getBoundingClientRect(), top = el.getAttribute('data-tip-top');
    tipEl.innerHTML = el.getAttribute('data-tip');
    tipEl.style.left = Math.min(window.innerWidth - 90, Math.max(90, r.left + r.width / 2)) + 'px';
    tipEl.style.top = (r.top + (top ? r.height * (1 - parseFloat(top)) : 0) - 8) + 'px';
    tipEl.classList.add('is-on');
  }
  function tipHide() { if (tipEl) tipEl.classList.remove('is-on'); }
  ['pointerover', 'focusin'].forEach(function (ev) {
    doc.addEventListener(ev, function (e) { var el = e.target.closest && e.target.closest('[data-tip]'); if (el) tipShow(el); });
  });
  ['pointerout', 'focusout'].forEach(function (ev) {
    doc.addEventListener(ev, function (e) { if (e.target.closest && e.target.closest('[data-tip]')) tipHide(); });
  });

  /* ---------- Greeting by the clock, date in words ---------- */
  function greeting() {
    var h = new Date().getHours();
    if (h < 11) return t('Selamat pagi', 'Good morning');
    if (h < 15) return t('Selamat siang', 'Good afternoon');
    if (h < 18) return t('Selamat sore', 'Good evening');
    return t('Selamat malam', 'Good evening');
  }
  var DAYS = [['Minggu', 'Sunday'], ['Senin', 'Monday'], ['Selasa', 'Tuesday'], ['Rabu', 'Wednesday'], ['Kamis', 'Thursday'], ['Jumat', 'Friday'], ['Sabtu', 'Saturday']];
  var MONTHS = [['Januari', 'January'], ['Februari', 'February'], ['Maret', 'March'], ['April', 'April'], ['Mei', 'May'], ['Juni', 'June'], ['Juli', 'July'], ['Agustus', 'August'], ['September', 'September'], ['Oktober', 'October'], ['November', 'November'], ['Desember', 'December']];
  function day(d) { return t.apply(null, DAYS[d.getDay()]); }
  function date(d, short) {
    var m = t.apply(null, MONTHS[d.getMonth()]);
    if (short) m = m.slice(0, 3);
    return d.getDate() + ' ' + m;
  }
  function month(n) { return t.apply(null, MONTHS[(n - 1 + 12) % 12]); }   /* 1 to 12 */
  /* how long ago, in words */
  function ago(iso) {
    var s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000), m = Math.round(s / 60), h = Math.round(s / 3600), d = Math.round(s / 86400);
    if (m < 2) return t('baru saja', 'just now');
    if (m < 60) return m + t(' menit lalu', ' minutes ago');
    if (h < 24) return h + t(' jam lalu', h === 1 ? ' hour ago' : ' hours ago');
    if (d < 2) return t('kemarin', 'yesterday');
    if (d < 14) return d + t(' hari lalu', ' days ago');
    return Math.round(d / 7) + t(' minggu lalu', ' weeks ago');
  }
  function plusDays(n) { var d = new Date(); d.setHours(12, 0, 0, 0); d.setDate(d.getDate() + n); return d; }

  function themeName(th) { return lang === 'en' ? th[2] : th[1]; }
  function tierName(key) { var T = window.NAWALA.TIERS[key]; return T ? t(T[0], T[1]) : key; }

  function start() {
    applyLang();
    show(location.hash.slice(1));
  }

  return { $: $, $$: $$, esc: esc, t: t, lang: function () { return lang; }, onLang: function (fn) { afterLang.push(fn); }, keep: keep,
    ic: ic, show: show, go: go, onShow: onShow, toast: toast, offline: offline, greeting: greeting, day: day, date: date, month: month, ago: ago, plusDays: plusDays,
    themeName: themeName, tierName: tierName, start: start };
})();
