/* Nawala's reading pages (layanan/, faq/, mitra/, kabar/). No libraries; the pages read and work without it.
   Language (data-en, shared key nawala-lang with the home page), WhatsApp links (data-wa), the sample invitation
   in a phone (loaded only on a tap), menus that close on an outside tap, and panels that rise once. */
(function () {
  'use strict';
  var WA = '6281379211628';   // same number as CONFIG.whatsapp in site.js
  var root = document.documentElement, $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var lang = root.lang === 'en' ? 'en' : 'id';

  $$('[data-en]').forEach(function (el) { el.setAttribute('data-id', el.textContent); });
  $$('[data-en-label]').forEach(function (el) { el.setAttribute('data-id-label', el.getAttribute('aria-label') || ''); });
  $$('[data-en-title]').forEach(function (el) { el.setAttribute('data-id-title', el.getAttribute('title') || ''); });
  function apply() {
    root.lang = lang;
    $$('[data-en]').forEach(function (el) { var v = el.getAttribute('data-' + lang); if (v != null && el.textContent !== v) el.textContent = v; });
    $$('[data-en-label]').forEach(function (el) { el.setAttribute('aria-label', el.getAttribute(lang === 'en' ? 'data-en-label' : 'data-id-label')); });
    $$('[data-lang]').forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-lang') === lang)); });
    $$('[data-wa]').forEach(function (a) {
      a.href = 'https://wa.me/' + WA + '?text=' + encodeURIComponent(a.getAttribute(lang === 'en' ? 'data-wa-en' : 'data-wa'));
      a.target = '_blank'; a.rel = 'noopener';
    });
    /* links into the sample invitations and the demos follow the language */
    $$('[data-langlink]').forEach(function (a) {
      var u = a.getAttribute('data-langlink');
      a.href = lang === 'en' ? u + (u.indexOf('?') < 0 ? '?' : '&') + 'lang=en' : u;
    });
    var t = document.querySelector('meta[name="nawala-title-en"]');
    if (t) { if (!root.dataset.titleId) root.dataset.titleId = document.title; document.title = lang === 'en' ? t.content : root.dataset.titleId; }
  }
  $$('[data-lang]').forEach(function (b) {
    b.addEventListener('click', function () {
      lang = b.getAttribute('data-lang');
      try { localStorage.setItem('nawala-lang', lang); } catch (e) {}
      apply();
    });
  });
  apply();

  /* menus: one open at a time, closed by a tap outside or Escape */
  var menus = $$('details.drop, details.top__menu');
  document.addEventListener('click', function (e) {
    menus.forEach(function (d) { if (d.open && !d.contains(e.target)) d.open = false; });
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') menus.forEach(function (d) { if (d.open) { d.open = false; var s = d.querySelector('summary'); if (s) s.focus(); } });
  });
  menus.forEach(function (d) {
    d.addEventListener('toggle', function () { if (d.open) menus.forEach(function (o) { if (o !== d) o.open = false; }); });
    $$('a', d).forEach(function (a) { a.addEventListener('click', function () { d.open = false; }); });
  });

  /* the sample invitation runs in the phone only after a tap: no music or film loads before the visitor asks */
  $$('[data-phone]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var ph = btn.closest('.phone'), box = ph && ph.querySelector('.phone__in');
      if (!box || ph.classList.contains('is-on')) return;
      var f = document.createElement('iframe'), src = btn.getAttribute('data-phone');
      f.title = lang === 'en' ? 'Sample invitation' : 'Undangan contoh';
      f.allow = 'autoplay';
      f.src = lang === 'en' ? src + (src.indexOf('?') < 0 ? '?' : '&') + 'lang=en' : src;
      box.appendChild(f); ph.classList.add('is-on');
    });
  });

  /* panels rise once as they come into view */
  var rise = $$('[data-rise]');
  if ('IntersectionObserver' in window && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    root.classList.add('rise-on');
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -8% 0px' });
    rise.forEach(function (el) { io.observe(el); });
  } else rise.forEach(function (el) { el.classList.add('is-in'); });
})();
