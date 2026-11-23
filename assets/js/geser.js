/* Geser: rows of big cards that move sideways (owner, 23 Nov 2026: "always ensure the swipe gesture is locked,
   never allow diagonal card swipe"). The track never scrolls by itself (overflow hidden, touch-action pan-y): the
   page keeps every vertical gesture, and a gesture that starts sideways moves only the cards. Touch and mouse: drag,
   with a flick going one card further; trackpad and wheel: the first movement of a gesture picks the axis; arrows,
   the counter and the arrow keys. It settles on a card after every move. Nothing glides under reduced motion.
   Second pass (owner, 23 Nov 2026, 17:46: the dots could not tell the third card from the fourth, and the cards were
   dull): a spacer at the end lets every card reach the left edge, so "2 / 5" always means the second card; the cards
   lean with the speed of a swipe or a wheel turn (transform on the card, so Rasa's hover tilt still adds on top). */
(function () {
  'use strict';
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  Array.prototype.forEach.call(document.querySelectorAll('[data-geser]'), function (g) {
    var track = g.querySelector('.geser__track'); if (!track) return;
    var cards = Array.prototype.slice.call(track.children);
    var dots = g.querySelector('.geser__dots'), cnt = g.querySelector('.geser__count'), prev = g.querySelector('[data-dir="-1"]'), next = g.querySelector('[data-dir="1"]');
    if (dots) cards.forEach(function () { dots.appendChild(document.createElement('i')); });
    if (cnt) cnt.querySelector('span').textContent = String(cards.length);
    /* the spacer: room after the last card so it too can stand at the left edge */
    var spacer = document.createElement('i'); spacer.className = 'geser__end'; spacer.setAttribute('aria-hidden', 'true'); track.appendChild(spacer);
    function room() {
      spacer.style.flexBasis = '0px';
      var last = cards[cards.length - 1], need = (last.offsetLeft - cards[0].offsetLeft) - max();
      spacer.style.flexBasis = Math.max(0, need) + 'px';
    }
    function lefts() { var o = cards[0].offsetLeft; return cards.map(function (c) { return c.offsetLeft - o; }); }
    function max() { return Math.max(0, track.scrollWidth - track.clientWidth); }
    function idx() {
      var L = lefts(), x = track.scrollLeft, b = 0;
      if (x >= max() - 2) return cards.length - 1 - countTail(L);
      L.forEach(function (l, i) { if (Math.abs(l - x) < Math.abs(L[b] - x)) b = i; });
      return b;
    }
    /* cards that never reach the left edge because the row ends first: the last stop stands for all of them */
    function countTail(L) { var m = max(), n = 0; for (var i = L.length - 1; i > 0 && L[i] > m + 2; i--) n++; return n; }
    function go(i) {
      var L = lefts(); i = Math.max(0, Math.min(cards.length - 1, i));
      track.scrollTo({ left: Math.min(L[i], max()), behavior: reduce ? 'auto' : 'smooth' });
    }
    var painted = -1;
    function paint() {
      var x = track.scrollLeft, m = max(), L = lefts(), i = 0;
      L.forEach(function (l, k) { if (l <= x + 4) i = k; });
      if (x >= m - 2 && countTail(L) > 0) i = cards.length - 1;
      if (dots && i !== painted) Array.prototype.forEach.call(dots.children, function (d, k) { d.classList.toggle('is-on', k === i); });
      if (cnt && i !== painted) cnt.querySelector('b').textContent = String(i + 1);
      if (i !== painted) cards.forEach(function (c, k) { c.classList.toggle('is-cur', k === i); });
      painted = i;
      if (prev) prev.disabled = x <= 2;
      if (next) next.disabled = x >= m - 2;
      g.classList.toggle('is-static', m <= 2);
    }
    var raf = 0;
    /* the lean: follows how fast the row moves, springs back when it stops */
    var lean = 0, lastX = track.scrollLeft, leanRaf = 0;
    function leanTick() {
      leanRaf = 0;
      var x = track.scrollLeft, v = x - lastX; lastX = x;
      var target = Math.max(-1, Math.min(1, v / 40));
      lean += (target - lean) * .22;
      if (Math.abs(lean) < .004 && Math.abs(target) < .004) { lean = 0; track.style.removeProperty('--sw'); return; }
      track.style.setProperty('--sw', lean.toFixed(3));
      leanRaf = requestAnimationFrame(leanTick);
    }
    track.addEventListener('scroll', function () {
      if (!raf) raf = requestAnimationFrame(function () { raf = 0; paint(); });
      if (!reduce && !leanRaf) { leanRaf = requestAnimationFrame(leanTick); }
    }, { passive: true });
    window.addEventListener('resize', function () { room(); paint(); });
    if (prev) prev.addEventListener('click', function () { step(-1); });
    if (next) next.addEventListener('click', function () { step(1); });
    function step(d) {
      var L = lefts(), x = track.scrollLeft, i;
      if (d > 0) { for (i = 0; i < L.length && L[i] <= x + 4; i++); go(i); }
      else { for (i = L.length - 1; i >= 0 && L[i] >= x - 4; i--); go(Math.max(0, i)); }
    }
    if (dots) dots.addEventListener('click', function (e) { var k = Array.prototype.indexOf.call(dots.children, e.target); if (k >= 0) go(k); });
    track.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') { e.preventDefault(); step(1); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); step(-1); }
    });

    /* drag: the first 6 px decide the axis; vertical is left to the page (the browser then cancels the pointer) */
    var drag = null, moved = false;
    track.addEventListener('pointerdown', function (e) {
      if (e.button !== 0) return;
      drag = { x: e.clientX, y: e.clientY, sl: track.scrollLeft, axis: null, id: e.pointerId, lx: e.clientX, lt: e.timeStamp, v: 0 };
      moved = false;
    });
    track.addEventListener('pointermove', function (e) {
      if (!drag || e.pointerId !== drag.id) return;
      var dx = e.clientX - drag.x, dy = e.clientY - drag.y;
      if (!drag.axis) {
        if (Math.abs(dx) < 6 && Math.abs(dy) < 6) return;
        drag.axis = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
        if (drag.axis === 'y') { drag = null; return; }
        try { track.setPointerCapture(drag.id); } catch (err) {}
        g.classList.add('is-drag'); moved = true;
      }
      e.preventDefault();
      track.scrollLeft = drag.sl - dx;
      var dt = Math.max(1, e.timeStamp - drag.lt);
      drag.v = (e.clientX - drag.lx) / dt; drag.lx = e.clientX; drag.lt = e.timeStamp;
    });
    function end(e) {
      if (!drag || (e && e.pointerId !== drag.id)) return;
      var d = drag; drag = null; g.classList.remove('is-drag');
      if (d.axis !== 'x') return;
      if (Math.abs(d.v) > 0.35) step(d.v < 0 ? 1 : -1); else go(idx());
    }
    track.addEventListener('pointerup', end);
    track.addEventListener('pointercancel', function () { if (drag && drag.axis === 'x') go(idx()); drag = null; g.classList.remove('is-drag'); });
    /* a drag is not a click on the card's button */
    track.addEventListener('click', function (e) { if (moved) { e.preventDefault(); e.stopPropagation(); moved = false; } }, true);
    track.addEventListener('dragstart', function (e) { e.preventDefault(); });

    /* wheel and trackpad: one axis per gesture (a gesture = events less than 220 ms apart) */
    var wAxis = null, wT = 0, snap = 0, wDir = 0;
    /* settle in the direction of travel: forward to the next card's edge, back to the previous one */
    function settle(dir) {
      var L = lefts(), x = track.scrollLeft, i;
      if (Math.abs(dir) < 8) return go(idx());
      if (dir > 0) { for (i = 0; i < L.length && L[i] < x - 4; i++); go(i); }
      else { for (i = L.length - 1; i > 0 && L[i] > x + 4; i--); go(i); }
    }
    track.addEventListener('wheel', function (e) {
      var now = e.timeStamp || Date.now();
      if (now - wT > 220) wAxis = null;
      wT = now;
      if (!wAxis) wAxis = (Math.abs(e.deltaX) > Math.abs(e.deltaY) || (e.shiftKey && e.deltaY)) ? 'x' : 'y';
      if (wAxis === 'y') return;          // the page scrolls; the cards stay
      e.preventDefault();
      var d = e.deltaX || e.deltaY;
      if (!snap) wDir = 0;
      wDir += d;
      track.scrollLeft += d;
      clearTimeout(snap); snap = setTimeout(function () { snap = 0; settle(wDir); }, 180);
    }, { passive: false });

    room(); paint();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { room(); paint(); });
  });
})();
