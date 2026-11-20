/* Nawala home page behaviour. No libraries. Everything here is optional polish:
   the page reads and works with this file missing. */
(function () {
  'use strict';

  var CONFIG = {
    whatsapp: '6281379211628',
    // Fill these two in once the Nawala Supabase project exists (see supabase/migrations).
    // While they are empty, the contact box hands the three answers to WhatsApp instead,
    // and the log-in box says plainly that codes cannot be checked here yet.
    supabaseUrl: '',
    supabaseKey: ''
  };

  /* The first themes: seven families, four directions each. Covers are colour fields until they are painted. */
  var FAMILIES = {
    alam: ['Alam', 'Nature', 'Hutan, pantai, gunung, taman, dan langit.', 'Forest, coast, mountain, garden and sky.'],
    royal: ['Kerajaan', 'Royal', 'Balairung istana dalam sepuluh warna, selalu berpadu emas.', 'Palace halls in ten colours, always with gold.'],
    religi: ['Religi', 'Faith', 'Untuk akad, pemberkatan, dan setiap upacara keagamaan.', 'For akad, blessing and every ceremony of faith.'],
    nusa: ['Nusantara', 'Nusantara', 'Betawi, Jawa, Sunda, Bali, Palembang, dan banyak lagi.', 'Betawi, Javanese, Sundanese, Balinese, Palembang and more.'],
    dunia: ['Mancanegara', 'The world', 'Toskana, Paris, Santorini, Kyoto.', 'Tuscany, Paris, Santorini, Kyoto.'],
    era: ['Lintas masa', 'Eras', 'Tempo doeloe, noir, koboi, zaman samurai.', 'Old days, noir, the Old West, the age of samurai.'],
    elemen: ['Elemen', 'Elements', 'Air, api, bumi, emas, mutiara.', 'Water, fire, earth, gold, pearl.']
  };
  var THEMES = [
    ['alam', 'Hutan Pagi', 'Morning Forest'], ['royal', 'Balairung Merah', 'Crimson Hall'], ['religi', 'Akad Putih', 'White Akad'], ['nusa', 'Pendopo Jawa', 'Javanese Pendopo'],
    ['dunia', 'Toskana', 'Tuscany'], ['era', 'Tempo Doeloe', 'Old Days'], ['elemen', 'Air', 'Water'],
    ['alam', 'Padang Bunga', 'Flower Meadow'], ['royal', 'Istana Zamrud', 'Emerald Palace'], ['religi', 'Pemberkatan', 'The Blessing'], ['nusa', 'Saung Sunda', 'Sundanese Saung'],
    ['dunia', 'Paris', 'Paris'], ['era', 'Noir', 'Noir'], ['elemen', 'Api', 'Fire'],
    ['alam', 'Lembah Kabut', 'Misty Valley'], ['royal', 'Takhta Biru', 'Sapphire Throne'], ['religi', 'Pawiwahan', 'Pawiwahan'], ['nusa', 'Taman Bali', 'Balinese Garden'],
    ['dunia', 'Santorini', 'Santorini'], ['era', 'Koboi', 'Old West'], ['elemen', 'Emas', 'Gold'],
    ['alam', 'Tepi Danau', 'Lakeside'], ['royal', 'Mahkota Emas', 'Golden Crown'], ['religi', 'Doa Senja', 'Evening Prayer'], ['nusa', 'Songket Palembang', 'Palembang Songket'],
    ['dunia', 'Kyoto', 'Kyoto'], ['era', 'Samurai', 'Samurai'], ['elemen', 'Mutiara', 'Pearl']
  ];

  var doc = document, root = doc.documentElement;
  var $ = function (s, c) { return (c || doc).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || doc).querySelectorAll(s)); };
  var query = new URLSearchParams(location.search);
  var calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var desktop = matchMedia('(min-width: 900px)');
  var clamp = function (v) { return v < 0 ? 0 : v > 1 ? 1 : v; };
  var ease = function (v) { return v * v * (3 - 2 * v); };
  var lerp = function (a, b, k) { return a + (b - a) * k; };

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
  var afterLang = [];

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
    afterLang.forEach(function (fn) { fn(); });
  }
  $$('[data-lang]').forEach(function (b) {
    b.addEventListener('click', function () {
      lang = b.getAttribute('data-lang');
      try { localStorage.setItem('nawala-lang', lang); } catch (e) {}
      applyLang();
    });
  });

  /* ---------- Menu panel (phones) ---------- */
  var nav = $('.nav'), menuBtn = $('.menu-btn'), sheet = $('.nav__items'), veil = $('.menu-veil');
  function setMenu(open) {
    root.classList.toggle('menu-open', open);
    menuBtn.setAttribute('aria-expanded', String(open));
    if (open) { veil.hidden = false; veil.offsetWidth; }
    else setTimeout(function () { if (!root.classList.contains('menu-open')) veil.hidden = true; }, 420);
  }
  menuBtn.addEventListener('click', function () { setMenu(!root.classList.contains('menu-open')); });
  veil.addEventListener('click', function () { setMenu(false); });
  sheet.addEventListener('click', function (e) { if (e.target.closest('a, [data-open]')) setMenu(false); });
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
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    ['beranda', 'tentang', 'layanan', 'tema', 'kontak'].forEach(function (id) { var s = doc.getElementById(id); if (s) navIO.observe(s); });
  }

  /* ---------- Menu morph: top bar on the hero, rail on the left after it ----------
     Every link is laid out in its rail position. For the bar we work out where each one
     sits in the top row and move it there with a transform. */
  var flips = $$('[data-flip]').map(function (el) { return { el: el, dx: 0, dy: 0 }; });
  var lastM = -1;
  function layoutNav() {
    lastM = -1;
    if (!desktop.matches) { flips.forEach(function (f) { f.el.style.cssText = ''; }); return; }
    flips.forEach(function (f) { f.el.style.setProperty('--fx', 0); f.el.style.setProperty('--fy', 0); });
    var right = window.innerWidth - 30;
    for (var i = flips.length - 1; i >= 0; i--) {
      var f = flips[i], r = f.el.getBoundingClientRect(), label = $('span', f.el);
      var w = 48 + (label ? label.offsetWidth + 2 : 0);
      var isLang = f.el.hasAttribute('data-lang');
      var x = right - w;
      right = x - (isLang ? (f.el.getAttribute('data-lang') === 'id' ? 22 : 6) : (f.el.classList.contains('nav__login') ? 18 : 8));
      f.dx = x - r.left; f.dy = (isLang ? 28 : 24) - r.top; f.bx = x;
    }
  }
  function navMorph(y, vh) {
    var D = desktop.matches;
    var m = calm ? 1 : clamp(y / (vh * (D ? .5 : .28)));
    if (m === lastM) return;
    lastM = m;
    var a = clamp(m / .55), b = clamp((m - .4) / .6);
    root.style.setProperty('--na', D ? a.toFixed(4) : m.toFixed(3));
    root.style.setProperty('--nb', b.toFixed(4));
    nav.classList.toggle('is-bar', a < 1);
    nav.classList.toggle('is-top', m === 0);
    nav.classList.toggle('is-rail', m === 1);
    root.classList.toggle('bar-gone', m > .42);
    if (!D) return;
    /* the bar's right edge pulls back like a curtain; each link fades as the edge reaches it,
       then reappears in the rail and slides down into its place */
    var edge = 88 + (window.innerWidth - 104) * (1 - a);
    root.style.setProperty('--lab', a < 1 ? 1 : 0);
    root.style.setProperty('--wm', clamp((edge - 180) / 60).toFixed(3));
    flips.forEach(function (f, i) {
      var fx, fy, o;
      if (a < 1) { fx = f.dx; fy = f.dy; o = clamp((edge - f.bx - 44) / 60); }
      else { var k = clamp((b - .25) / .75); fx = 0; fy = f.dy * (1 - k); o = clamp((b - .25 - i * .035) / .3); }
      f.el.style.setProperty('--fx', fx.toFixed(1)); f.el.style.setProperty('--fy', fy.toFixed(1)); f.el.style.setProperty('--fo', o.toFixed(3));
    });
  }

  /* ---------- Scroll progress: two numbers per section ----------
     --e: 0 when the section's top reaches the bottom of the screen, 1 when it reaches the top.
     --p: 0 when the section's top reaches the top of the screen, 1 when the section has passed. */
  var scrollEls = $$('[data-scroll]').map(function (el) { return { el: el, e: -1, p: -1 }; });
  var about = $('.about'), says = $$('.say'), pips = $$('.about__pips i'), aboutStep = -1;
  function measure(vh) {
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

  /* ---------- Nawala: one letter, travelling down the page ----------
     A list of waypoints tied to scroll positions. Between two waypoints the position, size and turn
     are blended; the pose is the one of the waypoint just passed. */
  var nw = $('#nw'), ask = $('#ask'), services = $('.services'), themes = $('.themes'), contact = $('.contact'), pair = $('#pair');
  var W = [], nwBase = 190, nwIdx = -1, poseNow = 'fly', poseHold = '', mx = 0, my = 0, pairTop = 0, pairSpan = 1;
  var travel = !calm && !!nw;
  function docTop(el) { return el.getBoundingClientRect().top + window.scrollY; }
  function plan() {
    var vw = window.innerWidth, vh = window.innerHeight, D = desktop.matches;
    var maxY = Math.max(1, root.scrollHeight - vh);
    if (pair) { pairTop = docTop(pair); pairSpan = Math.max(80, Math.min(vh * .5, vh - (pairTop - maxY) - 30)); }
    if (!travel) return;
    nwBase = D ? 300 : 190;
    var A = docTop(about), aS = about.offsetHeight - vh, S = docTop(services), sH = services.offsetHeight, T = docTop(themes), C = docTop(contact);
    var pr = $('#themes-panel').getBoundingClientRect(), pT = pr.top + window.scrollY;
    var br = ask.getBoundingClientRect(), bT = br.top + window.scrollY;
    var ph = D ? $('.services__phone').getBoundingClientRect() : null;
    var perchS = D ? .5 : .78, perchY = bT - nwBase * .3636 * perchS + (D ? 24 : 5);
    var land0 = Math.max(T + vh * .5, bT - vh * .74), land1 = Math.min(Math.max(land0 + vh * .3, bT - vh * .3), maxY);
    var side = D ? ph.left - 84 : vw - 58, sideS = D ? .5 : .42;
    var cx = D ? .6 : .5;
    W = [
      { at: 0, x: (D ? .73 : .5) * vw, y: (D ? .47 : .6) * vh, s: D ? 1.3 : 1.2, r: -4, pose: 'fly' },
      { at: A - vh * .45, x: (D ? .67 : .6) * vw, y: (D ? .4 : .5) * vh, s: 1.02, r: 10, pose: 'tilt' },
      { at: A - vh * .02, x: (cx + .04) * vw, y: (D ? .6 : .74) * vh, s: .85, r: -6, pose: 'fly' },
      { at: A + aS * .3, x: cx * vw, y: (D ? .56 : .7) * vh, s: .7, r: 0, pose: 'fly', cue: 'flip' },
      { at: A + aS * .36, x: (cx - .015) * vw, y: (D ? .52 : .66) * vh, s: .55, r: -3, pose: 'back34' },
      { at: A + aS * .62, x: (cx - .04) * vw, y: (D ? .47 : .6) * vh, s: .3, r: 0, pose: 'back34' },
      { at: A + aS * .7, x: cx * vw, y: (D ? .52 : .68) * vh, s: .82, r: 0, pose: 'open' },
      { at: A + aS, x: (cx + .02) * vw, y: (D ? .5 : .66) * vh, s: .95, r: 0, pose: 'open' },
      { at: S - vh * .5, x: (cx + .02) * vw, y: .42 * vh, s: .74, r: 12, pose: 'tilt' },
      { at: S + vh * .12, x: side, y: D ? .26 * vh : 60, s: sideS, r: -5, pose: 'fly' },
      { at: S + sH * .5, x: side - (D ? 8 : 0), y: D ? .5 * vh : 62, s: sideS, r: 4, pose: 'fly', cue: 'flip' },
      { at: T - vh, x: side, y: D ? .64 * vh : 60, s: sideS, r: 0, pose: 'fly' },
      { at: T - vh * .55, x: (D ? .6 : .7) * vw, y: .32 * vh, s: .58, r: 8, pose: 'fly' },
      { at: T - vh * .25, x: pr.right - (D ? 96 : 70), dy: pT - nwBase * .2, s: .58, r: 0, pose: 'fly', cue: 'bump' },
      { at: T - vh * .23, x: pr.right - (D ? 96 : 70), dy: pT - nwBase * .2, s: .58, r: 0, pose: 'tumble' },
      { at: T + vh * .25, x: D ? Math.min(vw - 120, pr.right + vw * .16) : .8 * vw, y: .76 * vh, s: .56, r: 400, pose: 'tumble' },
      { at: land0 - vh * .12, x: (D ? .72 : .7) * vw, y: .48 * vh, s: .5, r: 720, pose: 'tumble' },
      { at: land0, x: br.left + (D ? 56 : 48), dy: perchY, s: perchS, r: 720, pose: 'perch', hop: 4 },
      { at: land1, x: br.right - (D ? 86 : 62), dy: perchY, s: perchS, r: 720, pose: 'perch' }
    ];
    for (var i = 1; i < W.length; i++) if (W[i].at <= W[i - 1].at) W[i].at = W[i - 1].at + 1;
    nwIdx = -1;
  }
  function setPose(p) {
    if (p === poseNow) return;
    poseNow = p; nw.setAttribute('data-pose', p);
  }
  var cueTimer = {};
  function cue(name, ms) {
    nw.classList.remove('is-' + name); nw.offsetWidth; nw.classList.add('is-' + name);
    clearTimeout(cueTimer[name]);
    cueTimer[name] = setTimeout(function () { nw.classList.remove('is-' + name); }, ms);
  }
  function nwMove(y, vh) {
    if (!travel || !W.length) return;
    var i = 0;
    while (i < W.length - 1 && y >= W[i + 1].at) i++;
    var a = W[i], b = W[Math.min(i + 1, W.length - 1)];
    var k = b === a ? 0 : clamp((y - a.at) / (b.at - a.at)), ke = ease(k);
    var ay = a.dy != null ? a.dy - y : a.y, by = b.dy != null ? b.dy - y : b.y;
    var x = lerp(a.x, b.x, ke), yy = lerp(ay, by, ke), s = lerp(a.s, b.s, ke), r = lerp(a.r, b.r, ke);
    if (a.hop) {
      x = lerp(a.x, b.x, k);
      var wave = Math.abs(Math.sin(k * Math.PI * a.hop));
      yy -= wave * 34 * s; r += Math.sin(k * Math.PI * a.hop * 2) * 6;
    }
    if (y < vh) { var near = 1 - y / vh; x += mx * near; yy += my * near; }
    var done = ask.classList.contains('is-done') && i >= W.length - 2;
    setPose(poseHold || (done ? 'open' : a.pose));
    if (done) yy -= 26;
    nw.style.transform = 'translate3d(' + (x - nwBase / 2).toFixed(1) + 'px,' + (yy - nwBase * .367).toFixed(1) + 'px,0) rotate(' + r.toFixed(1) + 'deg) scale(' + s.toFixed(3) + ')';
    if (nwIdx !== -1 && i !== nwIdx) {
      if (i > nwIdx) { for (var n = nwIdx + 1; n <= i; n++) if (W[n].cue) cue(W[n].cue, W[n].cue === 'flip' ? 1100 : 600); }
      else if (W[nwIdx].cue === 'flip') cue('flip', 1100);
    }
    nwIdx = i;
  }
  /* touch it and it turns to face you, blushes, and spins once */
  if (nw) {
    var tap = $('.nw__tap', nw), holdTimer = 0;
    var face = function (ms) {
      poseHold = 'front'; nw.classList.add('is-blush'); requestTick();
      clearTimeout(holdTimer);
      holdTimer = setTimeout(function () { nw.classList.remove('is-blush'); poseHold = ''; requestTick(); }, ms);
    };
    if (travel) {
      tap.addEventListener('pointerenter', function (e) { if (e.pointerType === 'mouse') face(60000); });
      tap.addEventListener('pointerleave', function (e) { if (e.pointerType === 'mouse') face(500); });
      tap.addEventListener('click', function () { face(1900); cue('flip', 1100); });
    }
    addEventListener('load', function () {
      $$('img[data-src]', nw).forEach(function (im) { im.src = im.getAttribute('data-src'); });
      nw.classList.add('can-blush');
    });
  }
  if (travel && matchMedia('(hover: hover) and (pointer: fine)').matches) {
    $('.hero').addEventListener('pointermove', function (e) {
      mx = (e.clientX / innerWidth - .5) * 26; my = (e.clientY / innerHeight - .5) * 18; requestTick();
    });
  }

  /* bride and groom hop toward each other, taking turns */
  var metNow = false;
  function pairHop(y, vh) {
    if (!pair) return;
    var q = clamp((vh - (pairTop - y)) / pairSpan);
    var w = Math.sin(q * Math.PI * 6);
    pair.style.setProperty('--hx', ease(q).toFixed(3));
    pair.style.setProperty('--hop', (q < 1 ? Math.max(0, w) * 24 : 0).toFixed(1));
    pair.style.setProperty('--hop2', (q < 1 ? Math.max(0, -w) * 24 : 0).toFixed(1));
    pair.style.setProperty('--lean', (q < 1 ? w * 5 : 0).toFixed(1));
    var met = q >= .97;
    if (met !== metNow) { metNow = met; pair.classList.toggle('is-met', met); }
  }

  var ticking = false;
  function tick() {
    ticking = false;
    var y = window.scrollY, vh = window.innerHeight;
    navMorph(y, vh);
    if (calm) return;
    measure(vh);
    nwMove(y, vh);
    pairHop(y, vh);
  }
  function requestTick() { if (!ticking) { ticking = true; requestAnimationFrame(tick); } }
  function replan() { layoutNav(); plan(); requestTick(); }
  afterLang.push(replan);
  addEventListener('scroll', requestTick, { passive: true });
  addEventListener('resize', replan);
  addEventListener('load', replan);
  if (doc.fonts && doc.fonts.ready) doc.fonts.ready.then(replan);
  if (travel) { nw.classList.add('is-live'); root.classList.add('nw-live'); }
  if (calm && pair) pair.classList.add('is-met');
  /* pictures used as CSS backgrounds and masks wait until their section is close */
  if ('IntersectionObserver' in window) {
    var nearIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('is-near'); nearIO.unobserve(en.target); } });
    }, { rootMargin: '120% 0px' });
    [services, pair].forEach(function (el) { if (el) nearIO.observe(el); });
  } else { [services, pair].forEach(function (el) { if (el) el.classList.add('is-near'); }); }

  /* ---------- Services: the phone stays, the screen changes ---------- */
  (function () {
    var phone = $('#phone-screen'), items = $$('.svc');
    if (!phone || !items.length) return;
    var screens = items.map(function (li) { return $('.svc__screen', li); });
    var qr = $('.qr');
    if (qr) qr.innerHTML = fakeQr();
    var current = 0;
    function setActive(i) {
      current = i;
      items.forEach(function (li, k) { li.classList.toggle('is-on', k === i); });
      screens.forEach(function (s, k) { s.classList.toggle('is-on', k === i); });
    }
    function place() {
      screens.forEach(function (s, i) {
        if (desktop.matches) phone.appendChild(s); else items[i].insertBefore(s, items[i].firstChild);
      });
      setActive(current);
    }
    place();
    if (desktop.addEventListener) desktop.addEventListener('change', function () { place(); replan(); });
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

  /* ---------- Themes: the river behind, the collection in a pop-up ---------- */
  var chosen = null, showChosen = function () {};
  function turn(i) { return Math.floor(i / 7); }
  (function () {
    var river = $('#river');
    if (river) {
      var rows = desktop.matches ? 3 : 2, per = desktop.matches ? 14 : 8, html = '';
      for (var r = 0; r < rows; r++) {
        var cards = '';
        for (var c = 0; c < per; c++) { var i = (r * 9 + c * 5) % THEMES.length; cards += '<i class="rc cf cf--' + THEMES[i][0] + '" style="--k:' + turn(i) + '"></i>'; }
        html += '<div class="river__row">' + cards + cards + '</div>';
      }
      river.innerHTML = html;
      if (!calm && 'IntersectionObserver' in window) {
        new IntersectionObserver(function (en) { themes.classList.toggle('is-live', en[0].isIntersecting); }, { rootMargin: '10% 0px' }).observe(themes);
      }
    }

    var pops = { themes: $('#pop-themes'), login: $('#pop-login') };
    var grid = $('#theme-grid'), list = $('#pop-list'), detail = $('#pop-detail'), built = false, viewing = -1;
    function build() {
      built = true;
      grid.innerHTML = THEMES.map(function (th, i) {
        return '<button class="tc" type="button" data-i="' + i + '"><span class="tc__art cf cf--' + th[0] + '" style="--k:' + turn(i) + '"></span><b>' + t(th[1], th[2]) + '</b><small>' + t(FAMILIES[th[0]][0], FAMILIES[th[0]][1]) + '</small></button>';
      }).join('');
    }
    function showList(focusCard) {
      detail.hidden = true; list.hidden = false;
      if (focusCard && viewing > -1) { var c = $('[data-i="' + viewing + '"]', grid); if (c) c.focus({ preventScroll: true }); }
      viewing = -1;
    }
    function showDetail(i) {
      viewing = i; var th = THEMES[i], fam = FAMILIES[th[0]];
      $('#detail-cover').className = 'detail__cover cf cf--' + th[0];
      $('#detail-cover').style.setProperty('--k', turn(i));
      $('#detail-fam').textContent = t(fam[0], fam[1]);
      $('#detail-name').textContent = t(th[1], th[2]);
      $('#detail-desc').textContent = t(fam[2], fam[3]) + ' ' + t('Sampulnya masih dilukis; warna ini menunjukkan arahnya.', 'Its cover is still being painted; this colour shows where it is heading.');
      list.hidden = true; detail.hidden = false; detail.scrollTop = 0;
      try { detail.focus({ preventScroll: true }); } catch (e) {}
    }
    function closeAll() { Object.keys(pops).forEach(function (k) { if (pops[k] && pops[k].open) pops[k].close(); }); }
    function open(name) {
      var d = pops[name]; if (!d || !d.showModal) { location.hash = name === 'themes' ? 'tema' : 'kontak'; return; }
      closeAll();
      if (name === 'themes') { if (!built) build(); showList(false); }
      if (name === 'login') { var m = $('#login-msg'); m.hidden = true; }
      d.showModal();
      if (name === 'login') $('#login-code').focus();
    }
    function goTo(id) {
      closeAll();
      var el = doc.getElementById(id); if (!el) return;
      el.scrollIntoView({ behavior: calm ? 'auto' : 'smooth', block: 'start' });
      if (id === 'kontak') setTimeout(function () { var f = $('#q-name'); if (f && !f.closest('[hidden]')) try { f.focus({ preventScroll: true }); } catch (e) {} }, 900);
    }
    doc.addEventListener('click', function (e) {
      var o = e.target.closest('[data-open]'); if (o) { e.preventDefault(); return open(o.getAttribute('data-open')); }
      var g = e.target.closest('[data-goto]'); if (g) return goTo(g.getAttribute('data-goto'));
      if (e.target.closest('[data-close]')) return closeAll();
      if (e.target.classList && e.target.classList.contains('pop')) return closeAll();   // a tap on the dark area around the box
      var card = e.target.closest('.tc'); if (card) return showDetail(Number(card.getAttribute('data-i')));
    });
    $('#detail-back').addEventListener('click', function () { showList(true); });
    $('#detail-use').addEventListener('click', function () {
      chosen = THEMES[viewing]; showChosen(); goTo('kontak');
    });
    afterLang.push(function () { if (built) { var v = viewing; build(); if (v > -1) showDetail(v); } });

    /* log in with an access code. Codes live in the Nawala database, which is not connected yet. */
    var form = $('#login-form'), code = $('#login-code'), msg = $('#login-msg');
    function say(html) { msg.innerHTML = html; msg.hidden = false; }
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var c = code.value.trim().toUpperCase().replace(/[^A-Z0-9-]/g, '');
      if (c.length < 4) return say(t('Tulis kode akses Anda dulu.', 'Please type your access code first.'));
      var wa = 'https://wa.me/' + CONFIG.whatsapp + '?text=' + encodeURIComponent(t('Halo Nawala, kode akses saya: ' + c, 'Hello Nawala, my access code is: ' + c));
      var later = t('Kode belum bisa diperiksa di halaman ini. Kirim kode Anda lewat WhatsApp, dan kami bukakan temanya untuk Anda. ', 'Codes cannot be checked on this page yet. Send us your code on WhatsApp and we will open the themes for you. ') +
        '<a href="' + wa + '" target="_blank" rel="noopener">' + t('Buka WhatsApp', 'Open WhatsApp') + '</a>';
      if (!CONFIG.supabaseUrl || !CONFIG.supabaseKey) return say(later);
      fetch(CONFIG.supabaseUrl + '/rest/v1/rpc/check_access_code', {
        method: 'POST',
        headers: { apikey: CONFIG.supabaseKey, Authorization: 'Bearer ' + CONFIG.supabaseKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: c })
      }).then(function (r) { if (!r.ok) throw new Error(String(r.status)); return r.json(); })
        .then(function (ok) {
          if (ok !== true) return say(t('Kode itu tidak kami kenali. Periksa lagi, atau hubungi kami lewat WhatsApp.', 'We do not recognise that code. Check it again, or reach us on WhatsApp.'));
          try { sessionStorage.setItem('nawala-code', c); } catch (err) {}
          say(t('Kode diterima. Tema tambahan akan muncul di sini begitu selesai dilukis.', 'Code accepted. More themes will appear here as soon as they are painted.'));
        })
        .catch(function () { say(later); });
    });
  })();

  /* ---------- Contact: three questions, one at a time ---------- */
  (function () {
    var box = ask; if (!box) return;
    var form = $('.ask__form', box), steps = $$('.ask__step', box), err = $('.ask__error', box);
    var back = $('.ask__back', box), next = $('.ask__next', box), count = $('#ask-n');
    var sendView = $('.ask__send', box), doneView = $('.ask__done', box), doneP = $('#ask-done-p'), waLink = $('#ask-wa');
    var nameI = $('#q-name'), monthS = $('#q-month'), yearS = $('#q-year'), tbd = $('#q-tbd'), waI = $('#q-wa'), row = $('.ask__row', box);
    var chip = $('.ask__theme', box);
    var MONTHS = {
      id: ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'],
      en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
    };
    var i = 0, y0 = new Date().getFullYear();
    for (var y = y0; y <= y0 + 4; y++) yearS.add(new Option(String(y), String(y)));
    yearS.add(new Option('', ''), 0); yearS.value = '';

    showChosen = function () {
      chip.hidden = !chosen;
      if (chosen) $('b', chip).textContent = t(chosen[1], chosen[2]);
      replan();
    };
    $('.ask__theme-x', box).addEventListener('click', function () { chosen = null; showChosen(); });

    function refresh() {
      var keepM = monthS.value;
      monthS.length = 0;
      monthS.add(new Option(t('Bulan', 'Month'), ''));
      MONTHS[lang].forEach(function (m, k) { monthS.add(new Option(m, String(k + 1))); });
      monthS.value = keepM;
      yearS.options[0].text = t('Tahun', 'Year');
      monthS.setAttribute('aria-label', t('Bulan', 'Month')); yearS.setAttribute('aria-label', t('Tahun', 'Year'));
      next.textContent = i === steps.length - 1 ? t('Kirim', 'Send') : t('Lanjut', 'Continue');
      err.hidden = true;
      if (chosen) $('b', chip).textContent = t(chosen[1], chosen[2]);
    }
    afterLang.unshift(refresh);

    function show(k, goingBack) {
      i = k;
      steps.forEach(function (s, n) { s.hidden = n !== k; s.classList.toggle('is-on', n === k); s.classList.toggle('is-back', n === k && !!goingBack); });
      count.textContent = String(k + 1);
      back.hidden = k === 0;
      refresh();
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
        source: chosen ? 'home, tema: ' + chosen[1] : 'home'
      };
    }
    function finish(viaWhatsApp) {
      form.hidden = true; sendView.hidden = true; doneView.hidden = false; chip.hidden = true;
      if (viaWhatsApp) {
        doneP.setAttribute('data-id', 'Pesan Anda terbuka di WhatsApp. Setelah Anda mengirimnya, kami membalas di sana.');
        doneP.setAttribute('data-en', 'Your message is open in WhatsApp. Once you send it, we will reply there.');
        doneP.textContent = doneP.getAttribute('data-' + lang);
      }
      box.classList.add('is-done');
      try { doneView.focus({ preventScroll: true }); } catch (e) {}
      replan();
    }
    function handOver(a) {
      var when = a.wedding_month ? MONTHS[lang][a.wedding_month - 1] + ' ' + a.wedding_year : t('belum ditentukan', 'not decided yet');
      var theme = chosen ? t(' Tema pilihan: ' + chosen[1] + '.', ' Chosen theme: ' + chosen[2] + '.') : '';
      var msg = t(
        'Halo Nawala, saya ' + a.name + '. Rencana pernikahan: ' + when + '. Nomor WhatsApp saya: +' + a.whatsapp + '.',
        'Hello Nawala, I am ' + a.name + '. Wedding date: ' + when + '. My WhatsApp number: +' + a.whatsapp + '.') + theme;
      waLink.href = 'https://wa.me/' + CONFIG.whatsapp + '?text=' + encodeURIComponent(msg);
      form.hidden = true; sendView.hidden = false;
      try { waLink.focus({ preventScroll: true }); } catch (e) {}
      replan();
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
  })();

  applyLang();
})();
