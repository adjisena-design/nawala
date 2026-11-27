/* Inside the Studio's preview (dasar.html?edit=2, loaded only then). The Studio is the slot editor (owner, 27 Nov 2026):
   the theme stays locked, and only what it opens can be tapped.
   - A tap chooses one slot: a name or the date (word), a text box, a photo, a sticker, or a locked part (the guest's
     name, the Nawala mark). Nothing is chosen by a scroll; the page scrolls freely.
   - A chosen photo moves inside its frame with one finger and zooms with two (or the wheel). The frame itself never moves.
   - Stickers move only in sticker mode, and never onto the guarded parts (names, date, guest's name, the answer
     form, the countdown, the Nawala mark): a sticker dropped there goes back to where it was.
   Talks to the Studio through window.parent.NAWALA_STUDIO (same site). */
(function () {
  'use strict';
  var ED = window.parent && window.parent !== window && window.parent.NAWALA_STUDIO;
  if (!ED) return;
  var root = document.documentElement, sel = null, mode = 'sentuh';
  root.classList.add('is-studio'); root.setAttribute('data-st', mode);
  var GUARD = '.cover h1, .cover__date, .cover__to, #form, #count, .madeby';
  function guards() { Array.prototype.forEach.call(document.querySelectorAll(GUARD), function (el) { el.classList.add('st-guard'); }); }
  guards();

  /* links, buttons and the form do nothing while editing */
  document.addEventListener('click', function (e) {
    var t = e.target;
    if (t.closest('a, button, input, textarea, label, .shot')) e.preventDefault();
    var it = t.closest('.it'), fr = t.closest('.fr'), bx = t.closest('[data-box]');
    if (it) return choose({ kind: 'item', id: it.getAttribute('data-item') }, it);
    if (mode === 'stiker') return choose(null);
    if (fr) return choose({ kind: 'photo', id: fr.getAttribute('data-slot'), real: fr.classList.contains('is-photo') }, fr);
    var nw = t.closest('.madeby, .duo'); if (nw) return choose({ kind: 'lock', id: 'nawala' }, nw);
    var to = t.closest('.cover__to'); if (to) return choose({ kind: 'lock', id: 'tamu' }, to);
    var w = t.closest('[data-f]');
    if (w && w.getAttribute('data-f') !== 'guest') return choose({ kind: 'word', id: w.getAttribute('data-f'), box: bx ? bx.getAttribute('data-box') : '', head: /^H[1-3]$/.test(w.tagName) || !!w.closest('h1,h2,h3') }, w, bx);
    if (bx) return choose({ kind: 'box', id: bx.getAttribute('data-box') }, bx);
    choose(null);
  }, true);
  document.addEventListener('submit', function (e) { e.preventDefault(); }, true);

  function mark(el, bx) {
    Array.prototype.forEach.call(document.querySelectorAll('.is-sel, .is-selbox'), function (x) { x.classList.remove('is-sel', 'is-selbox'); });
    if (el) el.classList.add('is-sel');
    if (bx && bx !== el) bx.classList.add('is-selbox');
  }
  function choose(s, el, bx) {
    sel = s ? { kind: s.kind, id: s.id, box: s.box, el: el } : null;
    mark(el, bx);
    ED.select(s);
  }
  function find(s) {
    if (!s) return null;
    if (s.kind === 'item') return document.querySelector('[data-item="' + s.id + '"]');
    if (s.kind === 'photo') return document.querySelector('.fr[data-slot="' + s.id + '"]');
    if (s.kind === 'box') return document.querySelector('[data-box="' + s.id + '"]');
    if (s.kind === 'lock') return document.querySelector(s.id === 'tamu' ? '.cover__to' : '.madeby');
    var b = s.box && document.querySelector('[data-box="' + s.box + '"]');
    return (b && b.querySelector('[data-f="' + s.id + '"]')) || document.querySelector('main [data-f="' + s.id + '"], .cover [data-f="' + s.id + '"]');
  }
  /* how much of a guarded part a sticker covers: more than a third of it is too much */
  function covers(el) {
    var a = el.getBoundingClientRect(), blk = el.parentNode;
    return Array.prototype.some.call(blk.querySelectorAll('.st-guard'), function (p) {
      var b = p.getBoundingClientRect(); if (!b.width || !b.height) return false;
      var ix = Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left)), iy = Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));
      return ix * iy > .34 * b.width * b.height;
    });
  }
  function bad(el, id) { return !ED.free(id) && covers(el); }

  window.NAWALA_EDIT = {
    mode: function (m) { mode = m; root.setAttribute('data-st', m); },
    reselect: function (s) {
      var el = find(s);
      sel = el ? { kind: s.kind, id: s.id, box: s.box, el: el } : null;
      mark(el, s && s.kind === 'word' && s.box ? document.querySelector('[data-box="' + s.box + '"]') : null);
    },
    scrollTo: function (s) {
      var el = typeof s === 'string' ? document.getElementById(s) : find(s);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: typeof s === 'string' ? 'start' : 'center' });
    },
    /* on a phone the panel covers the lower part of the preview: bring a chosen slot up into the clear part */
    lift: function (s, clear) {
      var el = find(s); if (!el) return;
      var r = el.getBoundingClientRect(), h = window.innerHeight * (clear || .4);
      if (r.bottom > h - 10 || r.top < 6) window.scrollBy({ top: r.top - Math.max(14, (h - r.height) / 2), behavior: 'smooth' });
    },
    /* where the middle of the screen is, so a new sticker lands where the couple is looking */
    middle: function (frac) {
      var y = window.innerHeight * (frac || .5), best = null, bd = 1e9;
      ED.blocks().forEach(function (b) {
        var el = document.getElementById(b); if (!el || !el.offsetParent) return;
        var r = el.getBoundingClientRect(), d = Math.abs(r.top + r.height / 2 - y);
        if (r.top < y && r.bottom > y) d = 0;
        if (d < bd) { bd = d; best = { b: b, y: Math.min(90, Math.max(10, (y - r.top) / r.height * 100)) }; }
      });
      return best || { b: 'salam', y: 50 };
    },
    /* does this sticker sit on a guarded part now? (asked after a slider changed its size) */
    blocked: function (id) { var el = document.querySelector('[data-item="' + id + '"]'); return !!el && bad(el, id); },
    isPhoto: function (slot) { var el = document.querySelector('.fr[data-slot="' + slot + '"]'); return !!el && el.classList.contains('is-photo'); }
  };

  /* ---------- Moving with fingers or the mouse ---------- */
  var pts = {}, start = null;
  function list() { return Object.keys(pts).map(function (k) { return pts[k]; }); }
  function geo() {
    var p = list(); if (!p.length) return null;
    if (p.length === 1) return { x: p[0].x, y: p[0].y, d: 0, a: 0 };
    return { x: (p[0].x + p[1].x) / 2, y: (p[0].y + p[1].y) / 2, d: Math.hypot(p[1].x - p[0].x, p[1].y - p[0].y), a: Math.atan2(p[1].y - p[0].y, p[1].x - p[0].x) * 180 / Math.PI };
  }
  function movable() {
    if (!sel || !sel.el) return false;
    if (sel.kind === 'item') return mode === 'stiker' && ED.may('stiker');
    return sel.kind === 'photo' && sel.el.classList.contains('is-photo') && ED.may('foto');
  }
  function begin(first) {
    var g = geo(); if (!g || !sel) return;
    var v = ED.value(sel);
    start = { g: g, v: v, v0: first ? v : (start && start.v0) || v, moved: start ? start.moved : false, box: (sel.kind === 'item' ? sel.el.parentNode : sel.el).getBoundingClientRect() };
  }
  document.addEventListener('pointerdown', function (e) {
    if (!movable() || !sel.el.contains(e.target)) return;
    e.preventDefault();
    var first = !list().length;
    pts[e.pointerId] = { x: e.clientX, y: e.clientY };
    try { e.target.setPointerCapture(e.pointerId); } catch (x) {}
    begin(first);
  });
  document.addEventListener('pointermove', function (e) {
    if (!pts[e.pointerId] || !start) return;
    pts[e.pointerId] = { x: e.clientX, y: e.clientY };
    var g = geo(), v = start.v, b = start.box, out = {};
    if (Math.abs(g.x - start.g.x) + Math.abs(g.y - start.g.y) > 2 || g.d) start.moved = true;
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
    if (sel.kind === 'item') { var el = find(sel); if (el) { sel.el = el; el.classList.toggle('is-bad', bad(el, sel.id)); } }
  });
  function end(e) {
    if (!pts[e.pointerId]) return;
    delete pts[e.pointerId];
    if (list().length) { begin(false); return; }   /* one finger left: carry on from here */
    if (start && start.moved) {
      var el = sel.kind === 'item' ? find(sel) : null;
      if (el && bad(el, sel.id)) { el.classList.remove('is-bad'); ED.reject(sel, start.v0); }
      else ED.done(sel);
    }
    start = null;
  }
  document.addEventListener('pointerup', end);
  document.addEventListener('pointercancel', end);
  /* the mouse wheel zooms a chosen photo or resizes a chosen sticker on a computer */
  var wt = 0, w0 = null;
  document.addEventListener('wheel', function (e) {
    if (!movable() || !sel.el.contains(e.target)) return;
    e.preventDefault();
    var v = ED.value(sel), k = e.deltaY < 0 ? 1.06 : 1 / 1.06, s = sel;
    if (!w0) w0 = v;
    ED.live(s, s.kind === 'item' ? { w: +Math.min(120, Math.max(4, v.w * k)).toFixed(1) } : { z: +Math.min(3, Math.max(1, v.z * k)).toFixed(2) });
    clearTimeout(wt);
    wt = setTimeout(function () {
      var el = s.kind === 'item' ? find(s) : null;
      if (el && bad(el, s.id)) ED.reject(s, w0); else ED.done(s);
      w0 = null;
    }, 300);
  }, { passive: false });
})();
