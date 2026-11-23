/* Slaid: a band of full-width slides (the contest band, owner 23 Nov 2026, 18:44: hand-made and AI-made as two slides
   in one section). Two tabs choose a slide; a sideways swipe or drag moves one slide; vertical gestures stay with the
   page (the first 6 px decide, as in geser.js). The track moves with a transform; the slide not shown is inert.
   Nothing glides under reduced motion. */
(function () {
  'use strict';
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  Array.prototype.forEach.call(document.querySelectorAll('[data-slaid]'), function (box) {
    var track = box.querySelector('[data-slaid-track]'), items = box.querySelectorAll('[data-slaid-item]');
    var tabs = box.querySelectorAll('[data-slaid-tab]'), count = box.querySelector('.lb-say__count b'), cur = 0;
    if (!track || items.length < 2) return;
    function go(i, still) {
      cur = Math.max(0, Math.min(items.length - 1, i));
      track.style.transition = still || reduce ? 'none' : '';
      track.style.transform = 'translateX(' + (-100 * cur) + '%)';
      Array.prototype.forEach.call(items, function (it, k) { it.inert = k !== cur; it.setAttribute('aria-hidden', String(k !== cur)); });
      Array.prototype.forEach.call(tabs, function (t, k) { t.setAttribute('aria-selected', String(k === cur)); t.tabIndex = k === cur ? 0 : -1; });
      if (count) count.textContent = String(cur + 1);
      box.setAttribute('data-cur', String(cur));
    }
    Array.prototype.forEach.call(tabs, function (t, k) {
      t.addEventListener('click', function () { go(k); });
      t.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { e.preventDefault(); go(cur + (e.key === 'ArrowRight' ? 1 : -1)); tabs[cur].focus(); }
      });
    });
    var d = null;
    track.addEventListener('pointerdown', function (e) {
      if (e.button !== 0 || (e.target.closest && e.target.closest('a,button'))) return;
      d = { x: e.clientX, y: e.clientY, id: e.pointerId, axis: null, dx: 0 };
    });
    track.addEventListener('pointermove', function (e) {
      if (!d || e.pointerId !== d.id) return;
      var dx = e.clientX - d.x, dy = e.clientY - d.y;
      if (!d.axis) {
        if (Math.abs(dx) < 6 && Math.abs(dy) < 6) return;
        d.axis = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
        if (d.axis === 'y') { d = null; return; }
        try { track.setPointerCapture(d.id); } catch (err) {}
        track.style.transition = 'none';
      }
      d.dx = dx;
      track.style.transform = 'translateX(calc(' + (-100 * cur) + '% + ' + dx * .9 + 'px))';
    });
    function end() {
      if (!d) return;
      var dx = d.dx, axis = d.axis; d = null;
      if (axis !== 'x') return;
      go(Math.abs(dx) > track.clientWidth * .12 ? cur + (dx < 0 ? 1 : -1) : cur);
    }
    track.addEventListener('pointerup', end);
    track.addEventListener('pointercancel', end);
    go(0, true);
  });
})();
