/* Rasa: every box answers the hand (owner, 22 Nov 2026, from his "glassy carousel" reference video).
   With a mouse a box lifts a little, tilts toward the pointer and a soft light follows the pointer across it;
   on touch it presses down and springs back. The motion is a small spring run here (no CSS transition is set),
   written to the separate translate / rotate / scale properties, so a box's own transitions and transform
   animations keep working untouched. Off under reduced motion.
   Opt in with [data-rasa] or the selectors in window.NAWALA_RASA. data-rasa="kecil" tilts more (small cards),
   data-rasa="datar" lifts without tilting; buttons are "datar". */
(function () {
  'use strict';
  var d = document;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var SEL = window.NAWALA_RASA || '[data-rasa]';
  var fine = matchMedia('(hover: hover) and (pointer: fine)');
  var live = [], cur = null, raf = 0, px = 0, py = 0;
  function kind(el) { return el.getAttribute('data-rasa') || (el.classList.contains('btn') ? 'datar' : ''); }
  function st(el) {
    if (!el._rasa) {
      el._rasa = { a: 0, ax: 0, ay: 1, y: 0, s: 1, ta: 0, tx: 0, ty: 1, tyy: 0, ts: 1 };
      if (!el.querySelector(':scope > .rasa-sheen')) { var i = d.createElement('i'); i.className = 'rasa-sheen'; i.setAttribute('aria-hidden', 'true'); el.appendChild(i); }
      var pos = getComputedStyle(el).position; if (pos === 'static') el.style.position = 'relative';
    }
    if (live.indexOf(el) < 0) live.push(el);
    return el._rasa;
  }
  function aim() {
    if (!cur) return;
    var r = cur.getBoundingClientRect(); if (!r.width) return;
    var x = Math.max(0, Math.min(1, (px - r.left) / r.width)), y = Math.max(0, Math.min(1, (py - r.top) / r.height));
    if (kind(cur) === 'hp') { follow(); return; }
    var k = kind(cur), max = k === 'datar' ? 0 : k === 'kecil' ? 9 : Math.max(1.4, Math.min(5, 900 / r.width));
    var ax = -(y - .5), ay = (x - .5), len = Math.sqrt(ax * ax + ay * ay) || 1, o = cur._rasa;
    o.tx = ax / len; o.ty = ay / len; o.ta = Math.min(1, len * 2) * max;
    o.tyy = k === 'datar' ? -3 : k === 'kecil' ? -8 : -5; o.ts = k === 'kecil' ? 1.04 : k === 'datar' ? 1.02 : 1.012;
    cur.style.setProperty('--rasa-mx', (x * 100).toFixed(1) + '%');
    cur.style.setProperty('--rasa-my', (y * 100).toFixed(1) + '%');
  }
  function tick() {
    raf = 0; aim();
    for (var i = live.length - 1; i >= 0; i--) {
      var el = live[i], o = el._rasa, k = .16;
      o.a += (o.ta - o.a) * k; o.ax += (o.tx - o.ax) * k; o.ay += (o.ty - o.ay) * k; o.y += (o.tyy - o.y) * k; o.s += (o.ts - o.s) * (o.ts < 1 ? .35 : k);
      var done = Math.abs(o.ta - o.a) < .02 && Math.abs(o.tyy - o.y) < .05 && Math.abs(o.ts - o.s) < .0005;
      if (done && o.ta === 0 && o.tyy === 0 && o.ts === 1) { el.style.translate = el.style.rotate = el.style.scale = ''; live.splice(i, 1); continue; }
      el.style.translate = '0 ' + o.y.toFixed(2) + 'px';
      el.style.rotate = o.a > .01 ? o.ax.toFixed(3) + ' ' + o.ay.toFixed(3) + ' 0 ' + o.a.toFixed(2) + 'deg' : '';
      el.style.scale = o.s.toFixed(4);
    }
    if (live.length) raf = requestAnimationFrame(tick);
  }
  /* a services item that is not the one on screen stays still: no peeking at the next card (owner, 22 Nov 2026) */
  function asleep(el) { return el.classList.contains('svc') && !el.classList.contains('is-on') && innerWidth >= 900; }
  function kick() { if (!raf) raf = requestAnimationFrame(tick); }
  function enter(el) { if (cur === el) return; if (cur) leave(cur); cur = el; st(el); el.classList.add('is-rasa'); kick(); }
  function leave(el) { var o = el._rasa; if (o) { o.ta = 0; o.tyy = 0; o.ts = 1; } el.classList.remove('is-rasa'); if (cur === el) cur = null; kick(); }
  d.addEventListener('pointerover', function (e) {
    if (!fine.matches || e.pointerType !== 'mouse') return;
    var el = e.target.closest && e.target.closest(SEL);
    if (el && asleep(el)) el = null;
    if (el) enter(el); else if (cur) leave(cur);
  });
  d.addEventListener('pointermove', function (e) { if (cur && e.pointerType === 'mouse') { px = e.clientX; py = e.clientY; kick(); } }, { passive: true });
  d.addEventListener('pointerout', function (e) { if (cur && !(e.relatedTarget && cur.contains(e.relatedTarget))) leave(cur); });
  addEventListener('scroll', function () { if (cur) { if (asleep(cur)) leave(cur); else kick(); } }, { passive: true });

  /* Phones (data-rasa="hp"): they rest leaned and turned (CSS transform) and follow the pointer anywhere in their
     section, not only under it; on touch screens they follow the device's own tilt where the browser gives it
     without asking, and lean a little with each swipe (owner, 22 Nov 2026, 22:15). */
  var hps = [].slice.call(d.querySelectorAll('[data-rasa="hp"]')), gx = 0, gy = 0, gOn = false, swipe = 0;
  function visible(el) { var r = el.getBoundingClientRect(); return r.width && r.bottom > 0 && r.top < innerHeight; }
  function follow() {
    for (var i = 0; i < hps.length; i++) {
      var el = hps[i]; if (!visible(el)) continue;
      var o = st(el), r = el.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2, nx, ny;
      if (fine.matches) { nx = (px - cx) / (innerWidth / 2); ny = (py - cy) / (innerHeight / 2); }
      else { nx = gOn ? gx : 0; ny = (gOn ? gy : 0) + swipe; }
      nx = Math.max(-1, Math.min(1, nx)); ny = Math.max(-1, Math.min(1, ny));
      var ax = -ny, ay = nx, len = Math.sqrt(ax * ax + ay * ay);
      if (len < .001) { o.ta = 0; } else { o.tx = ax / len; o.ty = ay / len; o.ta = Math.min(1, len) * 11; }
      o.tyy = el.classList.contains('is-rasa') ? -6 : 0; o.ts = el.classList.contains('is-rasa') ? 1.02 : 1;
    }
  }
  if (hps.length) {
    d.addEventListener('pointermove', function (e) { if (e.pointerType === 'mouse') { px = e.clientX; py = e.clientY; follow(); kick(); } }, { passive: true });
    addEventListener('deviceorientation', function (e) {
      if (e.gamma == null) return; gOn = true;
      gx = Math.max(-1, Math.min(1, e.gamma / 25)); gy = Math.max(-1, Math.min(1, ((e.beta || 0) - 45) / 30));
      follow(); kick();
    }, { passive: true });
    var lastY = scrollY, calmT = 0;
    addEventListener('scroll', function () {
      if (fine.matches) return;
      var v = scrollY - lastY; lastY = scrollY;
      swipe = Math.max(-.6, Math.min(.6, v / 60)); follow(); kick();
      clearTimeout(calmT); calmT = setTimeout(function () { swipe = 0; follow(); kick(); }, 160);
    }, { passive: true });
  }
  /* touch: press down, spring back */
  d.addEventListener('pointerdown', function (e) {
    if (e.pointerType === 'mouse') return;
    var el = e.target.closest && e.target.closest(SEL); if (!el) return;
    var o = st(el); o.ts = .965; kick();
    var up = function () { o.ts = 1; kick(); d.removeEventListener('pointerup', up); d.removeEventListener('pointercancel', up); };
    d.addEventListener('pointerup', up); d.addEventListener('pointercancel', up); setTimeout(up, 900);
  }, { passive: true });
})();
