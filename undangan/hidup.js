/* Nawala Dasar, the living themes: builds the moving scenery of a theme of family "hidup" (see hidup.css).
   Data: window.NAWALA_HIDUP (hidup-data.js, written by tools/hidup.py): { r: {piece: width / height}, themes: {slug: {...}} }.
   A theme: far, top, foot (fixed layers), hero (the cover), gaps (interludes, used in turn), fx (particles), fly, corner.
   dasar.js calls NAWALA_HIDUP_ENGINE.set(slug) from setTheme(); any other slug clears the scenery.
   ?still=1 freezes everything (used by tools/hidup.py to bake a theme's still picture). */
(function () {
  'use strict';
  var H = window.NAWALA_HIDUP;
  if (!H) return;
  var root = document.documentElement;
  var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var still = /[?&]still=1(&|$)/.test(location.search);
  var small = (navigator.hardwareConcurrency || 4) <= 4 || (navigator.deviceMemory || 4) < 4;   /* fewer particles on modest phones */
  var hd = null, made = [], layers = [], gaps = [], seen = null, raf = 0, slugNow = null, mx = 0, my = 0;

  function url(k) { return 'url("../assets/img/hidup/' + k + '.webp")'; }
  function el(tag, cls, vars) {
    var e = document.createElement(tag); if (cls) e.className = cls;
    for (var k in vars) if (k !== 'lazy' && vars[k] !== undefined && vars[k] !== null) e.style.setProperty(k, vars[k]);
    return e;
  }
  /* one piece: <i> carries place and size, <b> carries the picture and its own movement */
  function piece(cls, p, vars) {
    vars = vars || {};
    vars['--r'] = H.r[p.k] || 1;
    if (p.w !== undefined) vars['--w'] = p.w + '%';
    if (p.x !== undefined) vars['--x'] = p.x + '%';
    if (p.y !== undefined) vars['--y'] = p.y + '%';
    if (p.o !== undefined) vars['--o'] = p.o;
    if (p.a !== undefined) vars['--a'] = p.a + 'deg';
    if (p.t !== undefined) vars['--t'] = p.t + 's';
    var i = el('i', cls + (p.flip ? ' is-flip' : '') + (p.right ? ' is-right' : ''), vars);
    var b = el('b'); if (vars.lazy) b.setAttribute('data-bg', p.k); else b.style.backgroundImage = url(p.k); i.appendChild(b);
    return i;
  }
  function rnd(seed) { var s = seed; return function () { s = (s * 16807 + 11) % 2147483647; return (s % 100000) / 100000; }; }

  function clear() {
    made.forEach(function (e) { if (e.parentNode) e.parentNode.removeChild(e); });
    made = []; layers = []; gaps = []; hd = null;
    if (seen) { seen.disconnect(); seen = null; }
    root.removeAttribute('data-corner');
  }

  function build(slug) {
    clear(); slugNow = slug;
    var T = H.themes[slug];
    if (!T) return;
    var back = document.querySelector('.backdrop'); if (!back) return;
    var R = rnd(slug.length * 7919 + slug.charCodeAt(0) * 131 + slug.charCodeAt(slug.length - 1));
    hd = el('div', 'hd'); back.appendChild(hd); made.push(hd);
    if (!T.corner) root.setAttribute('data-corner', 'none');

    (T.far || []).forEach(function (p, n) {
      var i = piece('hd__far', p, { '--dl': (-n * 2.3) + 's' });
      if (p.move) i.setAttribute('data-move', p.move);
      hd.appendChild(i); layers.push({ el: i, d: p.d === undefined ? .12 : p.d, kind: 'far' });
    });
    var fx = T.fx;
    if (fx && !reduced) {
      var box = el('div', 'hd__fx'); box.setAttribute('data-kind', fx.kind || 'fall');
      if (fx.dot) box.style.setProperty('--hd-dot', fx.dot);
      var n = Math.round((fx.n || 12) * (small ? .7 : 1)), src = fx.src || [];
      for (var j = 0; j < n; j++) {
        var s = (fx.s0 || 14) + R() * ((fx.s1 || 28) - (fx.s0 || 14));
        var d = (fx.d0 || 9) + R() * ((fx.d1 || 16) - (fx.d0 || 9));
        var it = el('i', src.length ? '' : 'dot', {
          '--x': (R() * 96).toFixed(1) + '%', '--s': s.toFixed(0) + 'px', '--d': d.toFixed(1) + 's', '--dl': (-R() * d).toFixed(1) + 's',
          '--dx': ((R() - .5) * 26).toFixed(1) + 'vw', '--o': ((fx.o0 || .65) + R() * ((fx.o1 || 1) - (fx.o0 || .65))).toFixed(2),
          '--y0': (12 + R() * 76).toFixed(0) + 'vh', '--ft': (2.4 + R() * 2.6).toFixed(1) + 's',
          '--r0': (-70 * R()).toFixed(0) + 'deg', '--r1': (20 + 90 * R()).toFixed(0) + 'deg'
        });
        var bb = el('b'); if (src.length) bb.style.backgroundImage = url(src[j % src.length]);
        it.appendChild(bb); box.appendChild(it);
      }
      hd.appendChild(box);
    }
    (T.fly || []).forEach(function (p, n) {
      if (reduced) return;
      var i = piece('hd__fly', p, { '--w': (p.px || 84) + 'px', '--d': (p.dur || 22) + 's', '--dl': (2 + n * 7) + 's', '--dy': (p.dy === undefined ? -6 : p.dy) + 'vh' });
      i.style.removeProperty('--x'); hd.appendChild(i);
    });
    (T.foot || []).forEach(function (p, n) {
      var i = piece('hd__foot', p, { '--down': p.down || 0, '--dl': (-n * 1.7) + 's' });
      hd.appendChild(i); layers.push({ el: i, d: p.d === undefined ? .3 : p.d, kind: 'foot' });
    });
    (T.top || []).forEach(function (p, n) {
      var i = piece('hd__top', p, { '--up': p.up || 0, '--dl': (-n * 2.9) + 's' });
      hd.appendChild(i); layers.push({ el: i, d: p.d === undefined ? .2 : p.d, kind: 'top' });
    });

    /* the cover */
    var cover = document.querySelector('.cover');
    if (cover && T.hero && T.hero.length) {
      var hero = el('div', 'hd-hero'); hero.setAttribute('aria-hidden', 'true');
      T.hero.forEach(function (p) { hero.appendChild(piece('', p, {})); });
      cover.insertBefore(hero, cover.firstChild); made.push(hero);
      gaps.push({ el: hero, parts: [].slice.call(hero.children).map(function (c, n) { return { el: c, sp: (T.hero[n].sp === undefined ? -.5 : T.hero[n].sp) }; }), on: true, hero: true });
    }
    /* interludes: one before each of these blocks, the compositions used in turn */
    var before = ['mempelai', 'cerita', 'acara', 'galeri', 'rsvp', 'ucapan', 'hadiah', 'penutup'], used = 0;
    if (T.gaps && T.gaps.length) before.forEach(function (id) {
      var block = document.getElementById(id); if (!block) return;
      var comp = T.gaps[used % T.gaps.length]; used++;
      var g = el('div', 'hd-gap'); g.setAttribute('aria-hidden', 'true');
      if (comp.h) g.style.setProperty('--gh', 'min(' + comp.h + 'vw,' + Math.round(comp.h * 4.8) + 'px)');
      var parts = [];
      comp.p.forEach(function (p, n) {
        var i = piece('', p, { '--dl': (n * .14) + 's', '--r0': (n % 2 ? 12 : -12) + 'deg', lazy: !still });
        g.appendChild(i); parts.push({ el: i, sp: p.sp === undefined ? (n % 2 ? .9 : -.6) : p.sp });
      });
      block.insertBefore(g, block.firstChild); made.push(g);
      gaps.push({ el: g, parts: parts, on: false });
    });
    /* an interlude's pictures are fetched when it comes within two screens */
    function fetchGap(g) { [].forEach.call(g.querySelectorAll('b[data-bg]'), function (b) { b.style.backgroundImage = url(b.getAttribute('data-bg')); b.removeAttribute('data-bg'); }); }
    if ('IntersectionObserver' in window) {
      var soon = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { fetchGap(e.target); soon.unobserve(e.target); } }); }, { rootMargin: '200% 0px' });
      gaps.forEach(function (g) { if (!g.hero) soon.observe(g.el); });
      made.push({ parentNode: { removeChild: function () { soon.disconnect(); } } });
    } else gaps.forEach(function (g) { fetchGap(g.el); });
    if (still || reduced) gaps.forEach(function (g) { g.el.classList.add('is-in'); });
    else if ('IntersectionObserver' in window) {
      seen = new IntersectionObserver(function (es) {
        es.forEach(function (e) {
          gaps.forEach(function (g) { if (g.el === e.target) { g.on = e.isIntersecting; if (e.isIntersecting && e.intersectionRatio > .25) g.el.classList.add('is-in'); } });
        });
        kick();
      }, { rootMargin: '10% 0px', threshold: [0, .3] });
      gaps.forEach(function (g) { seen.observe(g.el); });
    } else gaps.forEach(function (g) { g.el.classList.add('is-in'); g.on = true; });
    if (still) root.classList.add('hd-still');
    frame();
  }

  /* the scroll: one transform per fixed layer, and per piece of the interludes on screen */
  function frame() {
    raf = 0;
    if (!hd) return;
    var vh = window.innerHeight || 1, doc = document.documentElement;
    var max = Math.max(1, doc.scrollHeight - vh), p = Math.min(1, Math.max(0, (window.pageYOffset || 0) / max));
    if (still || reduced) p = 0;
    for (var i = 0; i < layers.length; i++) {
      var L = layers[i], y, x = mx * L.d * 26;
      if (L.kind === 'far') y = -p * L.d * vh * .9 + my * L.d * 14;
      else if (L.kind === 'top') y = -p * L.d * vh * .22;
      else y = (p - .5) * -L.d * vh * .12;
      L.el.style.transform = 'translate3d(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px,0)';
    }
    if (still || reduced) return;
    for (var k = 0; k < gaps.length; k++) {
      var g = gaps[k]; if (!g.on) continue;
      var r = g.el.getBoundingClientRect(), c = (r.top + r.height / 2 - vh / 2) / vh;
      if (g.hero) c = r.top / vh;
      for (var m = 0; m < g.parts.length; m++) g.parts[m].el.style.transform = 'translate3d(0,' + (c * g.parts[m].sp * 90).toFixed(1) + 'px,0)';
    }
  }
  function kick() { if (!raf) raf = requestAnimationFrame(frame); }
  window.addEventListener('scroll', kick, { passive: true });
  window.addEventListener('resize', kick);
  if (window.matchMedia && window.matchMedia('(hover:hover) and (pointer:fine)').matches && !reduced) {
    window.addEventListener('pointermove', function (e) {
      mx = (e.clientX / window.innerWidth - .5) * -2; my = (e.clientY / window.innerHeight - .5) * -2; kick();
    }, { passive: true });
  }

  window.NAWALA_HIDUP_ENGINE = { set: build, has: function (slug) { return !!H.themes[slug]; }, current: function () { return slugNow; } };
})();
