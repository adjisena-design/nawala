/* Every box has a source. A dialog grows out of the button, card or link that opened it and shrinks
   back into it when it closes; a panel marked data-from does the same when its hidden attribute changes.
   Only transform and opacity move. Nothing animates under reduced motion.
   Shared by the home page, tema/, tim/, ruang/ and the invitations; load it before the page's own script.

   - Dialogs: showModal(), show() and close() are wrapped once for the whole page, and the Esc key goes
     through the same close. A dialog's own entrance animation is switched off so the two never fight.
   - Panels: add data-from to an element that is shown and hidden with the hidden attribute. Its source is
     the control that was just used, or the element named in data-from="#id" when that is set.
   - window.NAWALA_ORIGIN.from(el, src) and .to(el, src, done) can be called by hand for anything else. */
(function () {
  'use strict';
  if (window.NAWALA_ORIGIN) return;
  var doc = document, reduce = window.matchMedia ? matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };
  var canAnimate = !!(Element.prototype.animate);
  var EASE_IN = 'cubic-bezier(.16,1,.3,1)', EASE_OUT = 'cubic-bezier(.5,0,.75,0)';

  /* the control the visitor touched last */
  var last = null, lastAt = 0;
  var CONTROL = 'button,a,[role="button"],[role="tab"],[data-open],label,summary,.tc,[tabindex]';
  function note(e) {
    var el = e.target && e.target.closest && e.target.closest(CONTROL);
    if (el && !el.closest('dialog[data-closing]')) { last = el; lastAt = Date.now(); }
  }
  doc.addEventListener('pointerdown', note, true);
  doc.addEventListener('click', note, true);
  doc.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') note(e); }, true);

  function fresh() { return last && Date.now() - lastAt < 1500 ? last : null; }
  function rectOf(src) {
    if (!src || !src.isConnected) return null;
    var r = src.getBoundingClientRect();
    if (r.width < 2 && r.height < 2) return null;
    if (r.bottom < 0 || r.top > innerHeight || r.right < 0 || r.left > innerWidth) return null;
    return r;
  }
  /* the transform that puts box b on top of source s */
  function onto(b, s) {
    if (!s) return 'translate3d(0,18px,0) scale(.92)';
    /* never smaller than 40%: a box shrunk to a dot shows its writing as a smear for a few frames */
    var k = Math.max(.4, Math.min(1, Math.min(s.width / b.width, s.height / b.height) * 1.15));
    var dx = (s.left + s.width / 2) - (b.left + b.width / 2), dy = (s.top + s.height / 2) - (b.top + b.height / 2);
    return 'translate3d(' + dx.toFixed(1) + 'px,' + dy.toFixed(1) + 'px,0) scale(' + k.toFixed(3) + ')';
  }
  /* only the animations this script starts are ever cancelled; a page's own CSS animations are left alone */
  var mine = new WeakMap();
  function run(el, keys, opts, host) {
    try { var a = el.animate(keys, opts); var l = mine.get(host) || []; l.push(a); mine.set(host, l); return a; } catch (e) { return null; }
  }
  function stop(host) { (mine.get(host) || []).forEach(function (a) { try { a.cancel(); } catch (e) {} }); mine.delete(host); }
  /* what the eye sees of a dialog: its box, when the dialog itself is only a clear frame */
  function vis(el) {
    if (!(el instanceof HTMLElement) || el.tagName !== 'DIALOG') return el;
    var box = el.querySelector(':scope > .pop__box, :scope > .sheet__box');
    if (box) return box;
    var only = el.children.length === 1 ? el.firstElementChild : null, bg = getComputedStyle(el).backgroundColor;
    return only && (bg === 'transparent' || /rgba\(.*,\s*0\)$/.test(bg)) ? only : el;
  }
  function grow(el, src, backdrop) {
    if (reduce.matches || !canAnimate) return;
    var host = el; stop(host); el = vis(el);
    var b = el.getBoundingClientRect(), from = onto(b, rectOf(src));
    var a = run(el, [
      { transform: from, opacity: 0, offset: 0, easing: EASE_IN },
      { transform: 'none', opacity: 1, offset: 1 }
    ], { duration: 520 }, host);
    if (a) run(el, [{ opacity: 0 }, { opacity: 1, offset: .55 }, { opacity: 1 }], { duration: 520, easing: 'linear', composite: 'replace' }, host);
    if (backdrop) run(host, [{ opacity: 0 }, { opacity: 1 }], { duration: 360, easing: 'ease-out', pseudoElement: '::backdrop' }, host);
    return a;
  }
  function shrink(el, src, backdrop, done) {
    if (reduce.matches || !canAnimate) { done(); return; }
    var host = el; el = vis(el);
    var b = el.getBoundingClientRect(), to = onto(b, rectOf(src));
    var a = run(el, [
      { transform: 'none', opacity: 1, offset: 0, easing: EASE_OUT },
      { transform: to, opacity: 0, offset: 1 }
    ], { duration: 300, fill: 'forwards' }, host);
    if (backdrop) run(host, [{ opacity: 1 }, { opacity: 0 }], { duration: 320, easing: 'ease-in', fill: 'forwards', pseudoElement: '::backdrop' }, host);
    if (!a) { done(); return; }
    var called = false;
    function end() { if (called) return; called = true; done(); stop(host); }
    a.onfinish = end; a.oncancel = end;
    setTimeout(end, 520);
  }

  /* ---------- dialogs ---------- */
  var P = window.HTMLDialogElement && HTMLDialogElement.prototype;
  if (P && P.showModal) {
    var nShowModal = P.showModal, nShow = P.show, nClose = P.close;
    var sources = new WeakMap();
    function finish(d) {   // a dialog still shrinking is closed at once before it opens again
      if (!d.hasAttribute('data-closing')) return;
      d.removeAttribute('data-closing');
      stop(d);
      nClose.call(d, d.__rv);
    }
    function opener(d, native, modal) {
      return function () {
        finish(this);
        var src = fresh();
        native.apply(this, arguments);
        if (src && !this.contains(src)) sources.set(this, src); else sources.delete(this);
        grow(this, sources.get(this), modal);
      };
    }
    P.showModal = opener(null, nShowModal, true);
    P.show = opener(null, nShow, false);
    P.close = function (rv) {
      var d = this;
      if (!d.open || d.hasAttribute('data-closing')) { if (!d.open) nClose.call(d, rv); return; }
      d.setAttribute('data-closing', '');
      d.__rv = rv;
      shrink(d, sources.get(d), d.matches(':modal'), function () {
        if (!d.hasAttribute('data-closing')) return;
        d.removeAttribute('data-closing');
        nClose.call(d, rv);
      });
    };
    /* Esc closes through the same path */
    doc.addEventListener('cancel', function (e) {
      var d = e.target;
      if (!(d instanceof HTMLDialogElement) || e.defaultPrevented) return;
      e.preventDefault();
      d.close();
    }, false);
    /* a form with method="dialog" closes through it too */
    doc.addEventListener('submit', function (e) {
      var f = e.target, d = f.closest && f.closest('dialog');
      if (!d || (f.getAttribute('method') || '').toLowerCase() !== 'dialog' || e.defaultPrevented) return;
      e.preventDefault();
      d.close(e.submitter && e.submitter.value || '');
    }, false);
  }

  /* ---------- panels shown with the hidden attribute ---------- */
  var quiet = new WeakSet(), panelSrc = new WeakMap();
  function srcFor(el) {
    var sel = el.getAttribute('data-from');
    if (sel && sel.charAt(0) === '#') { var named = doc.querySelector(sel); if (named) return named; }
    return fresh();
  }
  function watch(m) {
    m.forEach(function (r) {
      var el = r.target;
      if (r.attributeName !== 'hidden' || !el.hasAttribute('data-from')) return;
      if (quiet.has(el)) { quiet.delete(el); return; }
      if (!el.hidden) {
        var s = srcFor(el); if (s && !el.contains(s)) panelSrc.set(el, s);
        grow(el, panelSrc.get(el), false);
      } else if (!reduce.matches && canAnimate && el.isConnected) {
        quiet.add(el); el.hidden = false;           // put it back for its last moment on screen
        shrink(el, panelSrc.get(el) || srcFor(el), false, function () { quiet.add(el); el.hidden = true; });
      }
    });
  }
  if (window.MutationObserver) new MutationObserver(watch).observe(doc.documentElement, { attributes: true, attributeFilter: ['hidden'], subtree: true });

  /* the dialogs' own entrances would fight the grow */
  var css = doc.createElement('style');
  css.textContent = '.pop[open] .pop__box,.sheet[open] .sheet__box{animation:none!important}';
  doc.head.appendChild(css);

  window.NAWALA_ORIGIN = {
    from: function (el, src) { return grow(el, src || fresh(), false); },
    to: function (el, src, done) { shrink(el, src || fresh(), false, done || function () {}); },
    source: fresh
  };
})();
