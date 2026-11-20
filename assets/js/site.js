/* Nawala home page behaviour. No libraries. Everything here is optional polish:
   the page reads and works with this file missing. */
(function () {
  'use strict';

  var CONFIG = {
    whatsapp: '6281379211628',
    // Fill these two in once the Nawala Supabase project exists (see supabase/migrations).
    // While they are empty, the contact box hands the three answers to WhatsApp instead.
    supabaseUrl: '',
    supabaseKey: ''
  };

  var doc = document, root = doc.documentElement;
  var $ = function (s, c) { return (c || doc).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || doc).querySelectorAll(s)); };
  var query = new URLSearchParams(location.search);
  var calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var desktop = matchMedia('(min-width: 900px)');
  var conn = navigator.connection || {};
  var lowData = !!conn.saveData || /(^|-)2g|3g/.test(conn.effectiveType || '');
  var clamp = function (v) { return v < 0 ? 0 : v > 1 ? 1 : v; };

  /* ---------- Language ---------- */
  var lang = root.lang === 'en' ? 'en' : 'id';
  var HEADLINES = {
    '2': ['Kabar bahagia, diantar dengan sayap.', 'Good news, delivered on wings.'],
    '3': ['Setiap tamu disambut, bukan sekadar dikirimi tautan.', 'Every guest is welcomed, not just sent a link.']
  };
  var h1 = $('[data-h1]');
  if (h1 && HEADLINES[query.get('h')]) {
    h1.textContent = HEADLINES[query.get('h')][0];
    h1.setAttribute('data-en', HEADLINES[query.get('h')][1]);
  }
  $$('[data-en]').forEach(function (el) { el.setAttribute('data-id', el.textContent); });
  $$('[data-en-placeholder]').forEach(function (el) { el.setAttribute('data-id-placeholder', el.placeholder); });
  function t(id, en) { return lang === 'en' ? en : id; }

  function applyLang() {
    root.lang = lang;
    $$('[data-en]').forEach(function (el) { el.textContent = el.getAttribute('data-' + lang); });
    $$('[data-en-placeholder]').forEach(function (el) { el.placeholder = el.getAttribute('data-' + lang + '-placeholder'); });
    $$('[data-lang]').forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-lang') === lang)); });
    $$('[data-wa]').forEach(function (a) {
      var msg = a.getAttribute(lang === 'en' ? 'data-wa-en' : 'data-wa');
      a.href = 'https://wa.me/' + CONFIG.whatsapp + '?text=' + encodeURIComponent(msg);
      a.target = '_blank'; a.rel = 'noopener';
    });
    doc.title = t('Nawala, surat yang hidup', 'Nawala, the living letter');
    if (typeof refreshAsk === 'function') refreshAsk();
  }
  $$('[data-lang]').forEach(function (b) {
    b.addEventListener('click', function () {
      lang = b.getAttribute('data-lang');
      try { localStorage.setItem('nawala-lang', lang); } catch (e) {}
      applyLang();
    });
  });

  /* ---------- Menu (phones) ---------- */
  var menuBtn = $('.menu-btn'), rail = $('.rail'), veil = $('.menu-veil');
  function setMenu(open) {
    root.classList.toggle('menu-open', open);
    menuBtn.setAttribute('aria-expanded', String(open));
    if (open) { veil.hidden = false; veil.offsetWidth; }
    else setTimeout(function () { if (!root.classList.contains('menu-open')) veil.hidden = true; }, 420);
  }
  menuBtn.addEventListener('click', function () { setMenu(!root.classList.contains('menu-open')); });
  veil.addEventListener('click', function () { setMenu(false); });
  rail.addEventListener('click', function (e) { if (e.target.closest('a')) setMenu(false); });
  doc.addEventListener('keydown', function (e) { if (e.key === 'Escape' && root.classList.contains('menu-open')) { setMenu(false); menuBtn.focus(); } });

  /* which section are we in */
  var navLinks = $$('[data-nav]');
  if ('IntersectionObserver' in window) {
    var navIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        navLinks.forEach(function (a) {
          var on = a.getAttribute('data-nav') === en.target.id;
          a.classList.toggle('is-here', on);
          if (on) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current');
        });
        if (en.target.id === 'beranda') navLinks.forEach(function (a) { a.classList.remove('is-here'); a.removeAttribute('aria-current'); });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    ['beranda', 'tentang', 'layanan', 'tema', 'kontak'].forEach(function (id) { var s = doc.getElementById(id); if (s) navIO.observe(s); });
  }

  /* ---------- Scroll progress: two numbers per section ----------
     --e: 0 when the section's top reaches the bottom of the screen, 1 when it reaches the top.
     --p: 0 when the section's top reaches the top of the screen, 1 when the section has passed. */
  var scrollEls = $$('[data-scroll]').map(function (el) { return { el: el, e: -1, p: -1 }; });
  var about = $('.about'), says = $$('.say'), pips = $$('.about__pips i'), aboutStep = -1;
  var ticking = false;
  function measure() {
    ticking = false;
    var vh = window.innerHeight;
    scrollEls.forEach(function (s) {
      var r = s.el.getBoundingClientRect();
      if (r.bottom < -vh || r.top > vh * 2) return;
      var e = Math.round(clamp(1 - r.top / vh) * 1000) / 1000;
      var span = r.height > vh * 1.4 ? r.height - vh : r.height;
      var p = Math.round(clamp(-r.top / Math.max(1, span)) * 1000) / 1000;
      if (e !== s.e) { s.e = e; s.el.style.setProperty('--e', e); }
      if (p !== s.p) { s.p = p; s.el.style.setProperty('--p', p); }
      if (s.el === about) {
        var step = Math.min(2, Math.floor(p * 3));
        if (step !== aboutStep) {
          aboutStep = step;
          says.forEach(function (x, i) { x.classList.toggle('is-on', i === step); });
          pips.forEach(function (x, i) { x.classList.toggle('is-on', i === step); });
        }
      }
    });
  }
  function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(measure); } }
  if (!calm) {
    addEventListener('scroll', onScroll, { passive: true });
    addEventListener('resize', onScroll);
    measure();
  }

  /* ---------- Hero: Nawala follows the pointer a little (desktop only) ---------- */
  var mascotBox = $('.hero__mascot');
  if (!calm && mascotBox && matchMedia('(hover: hover) and (pointer: fine)').matches) {
    var mx = 0, my = 0, pending = false;
    $('.hero').addEventListener('pointermove', function (e) {
      mx = (e.clientX / innerWidth - .5) * 26; my = (e.clientY / innerHeight - .5) * 18;
      if (!pending) { pending = true; requestAnimationFrame(function () { pending = false; mascotBox.style.setProperty('--mx', mx.toFixed(1)); mascotBox.style.setProperty('--my', my.toFixed(1)); }); }
    });
  }

  /* ---------- Hero: specks of light in the sunbeams ---------- */
  (function dust() {
    var cv = $('.hero__dust'), hero = $('.hero');
    if (!cv || calm || lowData || !cv.getContext) return;
    var ctx = cv.getContext('2d'), w = 0, h = 0, dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    var n = (navigator.deviceMemory && navigator.deviceMemory <= 2) ? 10 : (desktop.matches ? 30 : 16);
    var bits = [], running = false, raf = 0;
    function size() { w = hero.clientWidth; h = hero.clientHeight; cv.width = w * dpr; cv.height = h * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); }
    function make(fresh) {
      return { x: Math.random() * w, y: fresh ? Math.random() * h : h + 10, r: 1 + Math.random() * 2.2, vy: .12 + Math.random() * .3, vx: (Math.random() - .5) * .22, a: .25 + Math.random() * .55, ph: Math.random() * 6.28, pink: Math.random() < .3 };
    }
    function frame(tm) {
      ctx.clearRect(0, 0, w, h);
      for (var i = 0; i < bits.length; i++) {
        var b = bits[i];
        b.y -= b.vy; b.x += b.vx + Math.sin(tm / 1400 + b.ph) * .15;
        if (b.y < -10 || b.x < -10 || b.x > w + 10) bits[i] = b = make(false);
        ctx.globalAlpha = b.a * (.6 + .4 * Math.sin(tm / 600 + b.ph));
        ctx.fillStyle = b.pink ? '#F4A6C0' : '#FFE9A8';
        ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, 6.2832); ctx.fill();
      }
      if (running) raf = requestAnimationFrame(frame);
    }
    size(); for (var i = 0; i < n; i++) bits.push(make(true));
    addEventListener('resize', size);
    new IntersectionObserver(function (en) {
      var on = en[0].isIntersecting;
      if (on && !running) { running = true; raf = requestAnimationFrame(frame); }
      if (!on) { running = false; cancelAnimationFrame(raf); }
    }).observe(hero);
  })();

  /* ---------- Hero: the looping film, only where it is cheap to play ---------- */
  (function film() {
    var v = $('.hero__video');
    if (!v || calm || lowData || !matchMedia('(min-width: 1024px)').matches || query.get('video') === '0') return;
    addEventListener('load', function () {
      v.poster = 'assets/img/hero-forest-desktop-sm.webp';
      [['assets/video/hero-forest-loop.webm', 'video/webm'], ['assets/video/hero-forest-loop.mp4', 'video/mp4']].forEach(function (s) {
        var el = doc.createElement('source'); el.src = s[0]; el.type = s[1]; v.appendChild(el);
      });
      v.addEventListener('playing', function () { root.classList.add('has-video'); }, { once: true });
      v.load();
      var pr = v.play(); if (pr && pr.catch) pr.catch(function () {});
    });
  })();

  /* ---------- Services: the phone stays, the screen changes ---------- */
  (function services() {
    var phone = $('#phone-screen'), items = $$('.svc');
    if (!phone || !items.length) return;
    var screens = items.map(function (li) { return $('.svc__screen', li); });
    var qr = $('.qr');
    if (qr) qr.innerHTML = fakeQr();
    function place() {
      screens.forEach(function (s, i) {
        if (desktop.matches) phone.appendChild(s); else items[i].insertBefore(s, items[i].firstChild);
      });
      setActive(current);
    }
    var current = 0;
    function setActive(i) {
      current = i;
      items.forEach(function (li, k) { li.classList.toggle('is-on', k === i); });
      screens.forEach(function (s, k) { s.classList.toggle('is-on', k === i); });
    }
    place();
    if (desktop.addEventListener) desktop.addEventListener('change', place);
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) { if (en.isIntersecting && desktop.matches) setActive(items.indexOf(en.target)); });
      }, { rootMargin: '-48% 0px -48% 0px' });
      items.forEach(function (li) { io.observe(li); });
    }
  })();

  /* a drawing that reads as a QR code; it does not encode anything */
  function fakeQr() {
    var n = 21, seed = 7, cells = '';
    function rnd() { seed = (seed * 16807) % 2147483647; return seed / 2147483647; }
    function finder(x, y) { return '<rect x="' + x + '" y="' + y + '" width="7" height="7" rx="1.4"/><rect x="' + (x + 1) + '" y="' + (y + 1) + '" width="5" height="5" rx="1" fill="#FBF6EA"/><rect x="' + (x + 2) + '" y="' + (y + 2) + '" width="3" height="3" rx=".6"/>'; }
    for (var y = 0; y < n; y++) for (var x = 0; x < n; x++) {
      var inFinder = (x < 8 && y < 8) || (x > n - 9 && y < 8) || (x < 8 && y > n - 9);
      if (!inFinder && rnd() > .52) cells += '<rect x="' + x + '" y="' + y + '" width="1" height="1"/>';
    }
    return '<svg viewBox="-1 -1 23 23" fill="#16301F" aria-hidden="true">' + cells + finder(0, 0) + finder(14, 0) + finder(0, 14) + '</svg>';
  }

  /* ---------- Themes: pin the section and move the row sideways (desktop) ---------- */
  (function themes() {
    var sec = $('.themes'), track = $('.themes__track');
    if (!sec || !track) return;
    function fit() {
      sec.classList.remove('is-pinned');
      if (!desktop.matches || calm) return;
      sec.classList.add('is-pinned');
      var dx = track.offsetWidth - window.innerWidth;
      if (dx < 60) { sec.classList.remove('is-pinned'); return; }
      sec.style.setProperty('--dx', dx);
      sec.style.setProperty('--pin-h', (window.innerHeight + dx) + 'px');
      onScroll();
    }
    fit();
    addEventListener('resize', fit);
    addEventListener('load', fit);
  })();

  /* ---------- Contact: three questions, one at a time ---------- */
  var refreshAsk;
  (function ask() {
    var box = $('#ask'); if (!box) return;
    var form = $('.ask__form', box), steps = $$('.ask__step', box), err = $('.ask__error', box);
    var back = $('.ask__back', box), next = $('.ask__next', box), count = $('#ask-n');
    var sendView = $('.ask__send', box), doneView = $('.ask__done', box), doneP = $('#ask-done-p'), waLink = $('#ask-wa');
    var nameI = $('#q-name'), monthS = $('#q-month'), yearS = $('#q-year'), tbd = $('#q-tbd'), waI = $('#q-wa'), row = $('.ask__row', box);
    var MONTHS = {
      id: ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'],
      en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
    };
    var i = 0, y0 = new Date().getFullYear();
    for (var y = y0; y <= y0 + 4; y++) yearS.add(new Option(String(y), String(y)));
    yearS.add(new Option('', ''), 0); yearS.value = '';

    refreshAsk = function () {
      var keepM = monthS.value;
      monthS.length = 0;
      monthS.add(new Option(t('Bulan', 'Month'), ''));
      MONTHS[lang].forEach(function (m, k) { monthS.add(new Option(m, String(k + 1))); });
      monthS.value = keepM;
      yearS.options[0].text = t('Tahun', 'Year');
      monthS.setAttribute('aria-label', t('Bulan', 'Month')); yearS.setAttribute('aria-label', t('Tahun', 'Year'));
      next.textContent = i === steps.length - 1 ? t('Kirim', 'Send') : t('Lanjut', 'Continue');
      err.hidden = true;
    };

    function show(k, goingBack) {
      i = k;
      steps.forEach(function (s, n) { s.hidden = n !== k; s.classList.toggle('is-on', n === k); s.classList.toggle('is-back', n === k && !!goingBack); });
      count.textContent = String(k + 1);
      back.hidden = k === 0;
      refreshAsk();
      var f = $('input:not([type=checkbox]), select', steps[k]);
      if (f) try { f.focus({ preventScroll: true }); } catch (e) {}
    }
    function fail(id, en) { err.textContent = t(id, en); err.hidden = false; return false; }
    function phone() {
      var d = waI.value.replace(/\D/g, '');
      if (d.indexOf('0') === 0) d = '62' + d.slice(1); else if (d.indexOf('8') === 0) d = '62' + d;
      return d;
    }
    function valid() {
      err.hidden = true;
      if (i === 0) return nameI.value.trim().length >= 2 || fail('Tulis nama Anda dulu.', 'Please write your name first.');
      if (i === 1) return tbd.checked || (monthS.value && yearS.value) ? true : fail('Pilih bulan dan tahun, atau centang "Belum ditentukan".', 'Choose a month and year, or tick "Not decided yet".');
      var d = phone();
      return (d.length >= 10 && d.length <= 15) || fail('Nomor WhatsApp belum lengkap.', 'That WhatsApp number looks incomplete.');
    }
    tbd.addEventListener('change', function () { row.classList.toggle('is-off', tbd.checked); err.hidden = true; });
    back.addEventListener('click', function () { if (i > 0) show(i - 1, true); });

    function answers() {
      return {
        name: nameI.value.trim().slice(0, 80),
        wedding_month: tbd.checked ? null : Number(monthS.value),
        wedding_year: tbd.checked ? null : Number(yearS.value),
        whatsapp: phone(),
        lang: lang,
        source: 'home'
      };
    }
    function finish(viaWhatsApp) {
      form.hidden = true; sendView.hidden = true; doneView.hidden = false;
      if (viaWhatsApp) {
        doneP.setAttribute('data-id', 'Pesan Anda terbuka di WhatsApp. Setelah Anda mengirimnya, kami membalas di sana.');
        doneP.setAttribute('data-en', 'Your message is open in WhatsApp. Once you send it, we will reply there.');
        doneP.textContent = doneP.getAttribute('data-' + lang);
      }
      box.classList.add('is-done');
      try { doneView.focus({ preventScroll: true }); } catch (e) {}
    }
    function handOver(a) {
      var when = a.wedding_month ? MONTHS[lang][a.wedding_month - 1] + ' ' + a.wedding_year : t('belum ditentukan', 'not decided yet');
      var msg = t(
        'Halo Nawala, saya ' + a.name + '. Rencana pernikahan: ' + when + '. Nomor WhatsApp saya: +' + a.whatsapp + '.',
        'Hello Nawala, I am ' + a.name + '. Wedding date: ' + when + '. My WhatsApp number: +' + a.whatsapp + '.');
      waLink.href = 'https://wa.me/' + CONFIG.whatsapp + '?text=' + encodeURIComponent(msg);
      form.hidden = true; sendView.hidden = false;
      try { waLink.focus({ preventScroll: true }); } catch (e) {}
    }
    waLink.addEventListener('click', function () { setTimeout(function () { finish(true); }, 600); });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!valid()) return;
      if (i < steps.length - 1) return show(i + 1);
      var a = answers();
      if (!CONFIG.supabaseUrl || !CONFIG.supabaseKey) return handOver(a);
      next.disabled = true; next.textContent = t('Mengirim', 'Sending');
      fetch(CONFIG.supabaseUrl + '/rest/v1/leads', {
        method: 'POST',
        headers: { apikey: CONFIG.supabaseKey, Authorization: 'Bearer ' + CONFIG.supabaseKey, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
        body: JSON.stringify(a)
      }).then(function (r) { if (!r.ok) throw new Error(String(r.status)); finish(false); })
        .catch(function () { next.disabled = false; handOver(a); });
    });
    refreshAsk();
  })();

  applyLang();
})();
