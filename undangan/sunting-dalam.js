/* Inside the editor's preview (dasar.html?edit=1, loaded only then): tap to choose a text box, a photo or an added
   element; once chosen, one finger moves it and two fingers resize and turn it (a photo pans and zooms inside its frame).
   Nothing is chosen by a scroll: the first tap only chooses, so the page still scrolls freely on a phone.
   Talks to the editor through window.parent.NAWALA_EDITOR (same site): select(), live(), done(). */
(function () {
  'use strict';
  var ED = window.parent && window.parent !== window && window.parent.NAWALA_EDITOR;
  if (!ED) return;
  var sel = null;   /* {kind: 'box'|'photo'|'item', id, el} */

  /* links, buttons and the form do nothing while editing */
  document.addEventListener('click', function (e) {
    var t = e.target;
    if (t.closest('a, button, input, textarea, label, .shot')) { e.preventDefault(); }
    var it = t.closest('.it'), fr = t.closest('.fr'), bx = t.closest('[data-box]');
    if (it) choose('item', it.getAttribute('data-item'), it);
    else if (fr) choose('photo', fr.getAttribute('data-slot'), fr);
    else if (bx) choose('box', bx.getAttribute('data-box'), bx);
    else choose(null);
  }, true);
  document.addEventListener('submit', function (e) { e.preventDefault(); }, true);

  function choose(kind, id, el) {
    if (sel && sel.el) sel.el.classList.remove('is-sel');
    sel = kind ? { kind: kind, id: id, el: el } : null;
    if (sel) el.classList.add('is-sel');
    ED.select(sel ? { kind: kind, id: id } : null);
  }
  /* the editor redraws after a change: keep the outline on the same thing */
  window.NAWALA_EDIT = {
    reselect: function (s) {
      if (!s) return choose(null);
      var el = s.kind === 'item' ? document.querySelector('[data-item="' + s.id + '"]') : s.kind === 'photo' ? document.querySelector('.fr[data-slot="' + s.id + '"]') : document.querySelector('[data-box="' + s.id + '"]');
      if (sel && sel.el) sel.el.classList.remove('is-sel');
      sel = el ? { kind: s.kind, id: s.id, el: el } : null;
      if (el) el.classList.add('is-sel');
    },
    scrollTo: function (s) {
      var el = s.kind === 'item' ? document.querySelector('[data-item="' + s.id + '"]') : document.getElementById(s.id);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    },
    /* where the middle of the screen is, so a new element lands where the couple is looking */
    middle: function (frac) {
      var y = window.innerHeight * (frac || .5), best = null, bd = 1e9;
      ED.blocks().forEach(function (b) {
        var el = document.getElementById(b); if (!el || !el.offsetParent) return;
        var r = el.getBoundingClientRect(), d = Math.abs(r.top + r.height / 2 - y);
        if (r.top < y && r.bottom > y) d = 0;
        if (d < bd) { bd = d; best = { b: b, y: Math.min(90, Math.max(10, (y - r.top) / r.height * 100)) }; }
      });
      return best || { b: 'salam', y: 50 };
    }
  };

  /* ---------- Moving with fingers or the mouse ---------- */
  var pts = {}, start = null;
  function list() { return Object.keys(pts).map(function (k) { return pts[k]; }); }
  function geo() {
    var p = list(); if (!p.length) return null;
    if (p.length === 1) return { x: p[0].x, y: p[0].y, d: 0, a: 0 };
    return { x: (p[0].x + p[1].x) / 2, y: (p[0].y + p[1].y) / 2, d: Math.hypot(p[1].x - p[0].x, p[1].y - p[0].y), a: Math.atan2(p[1].y - p[0].y, p[1].x - p[0].x) * 180 / Math.PI };
  }
  function begin() {
    var g = geo(); if (!g || !sel) return;
    start = { g: g, v: ED.value(sel), box: (sel.kind === 'item' ? sel.el.parentNode : sel.el).getBoundingClientRect() };
  }
  document.addEventListener('pointerdown', function (e) {
    if (!sel || sel.kind === 'box' || !sel.el.contains(e.target)) return;
    e.preventDefault();
    pts[e.pointerId] = { x: e.clientX, y: e.clientY };
    try { e.target.setPointerCapture(e.pointerId); } catch (x) {}
    begin();
  });
  document.addEventListener('pointermove', function (e) {
    if (!pts[e.pointerId] || !start) return;
    pts[e.pointerId] = { x: e.clientX, y: e.clientY };
    var g = geo(), v = start.v, b = start.box, out = {};
    if (sel.kind === 'item') {
      out.x = +(v.x + (g.x - start.g.x) / b.width * 100).toFixed(1);
      out.y = +(v.y + (g.y - start.g.y) / b.height * 100).toFixed(1);
      if (start.g.d && g.d) { out.w = +Math.min(120, Math.max(4, v.w * g.d / start.g.d)).toFixed(1); out.r = Math.round(v.r + g.a - start.g.a); }
    } else {
      /* a photo: dragging the picture moves what shows inside the frame (the opposite way to the finger) */
      out.x = +Math.min(100, Math.max(0, v.x - (g.x - start.g.x) / b.width * 100 / v.z)).toFixed(1);
      out.y = +Math.min(100, Math.max(0, v.y - (g.y - start.g.y) / b.height * 100 / v.z)).toFixed(1);
      if (start.g.d && g.d) out.z = +Math.min(3, Math.max(1, v.z * g.d / start.g.d)).toFixed(2);
    }
    ED.live(sel, out);
  });
  function end(e) {
    if (!pts[e.pointerId]) return;
    delete pts[e.pointerId];
    if (list().length) { begin(); return; }   /* one finger left: carry on from here */
    if (start) ED.done(sel);
    start = null;
  }
  document.addEventListener('pointerup', end);
  document.addEventListener('pointercancel', end);
  /* the mouse wheel resizes on a computer */
  document.addEventListener('wheel', function (e) {
    if (!sel || sel.kind === 'box' || !sel.el.contains(e.target)) return;
    e.preventDefault();
    var v = ED.value(sel), k = e.deltaY < 0 ? 1.06 : 1 / 1.06;
    ED.live(sel, sel.kind === 'item' ? { w: +Math.min(120, Math.max(4, v.w * k)).toFixed(1) } : { z: +Math.min(3, Math.max(1, v.z * k)).toFixed(2) });
    clearTimeout(window.__wt); window.__wt = setTimeout(function () { ED.done(sel); }, 300);
  }, { passive: false });
})();
