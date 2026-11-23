/* Tanya: the questions (owner, 23 Nov 2026: smoother opening and closing, a search bar on top, after the
   Jabar Open FAQ). Two jobs:
   1. Every question list (.qa, .lb-qa) opens and closes softly: the answer fades and slides in, and the questions
      below glide to their new place (measured before and after, moved with transform only). Nothing moves under
      reduced motion.
   2. A [data-tanya] box gets a search pill, category chips, a live count and a friendly empty state. On the home
      page it starts on the popular questions; on the FAQ page on all of them, with "Salin tautan" under each answer
      and a link (#t-<key>) that opens one question straight away.
   Load it before the page's language script (site.js or halaman.js), so the words it adds are switched too. */
(function () {
  'use strict';
  var root = document.documentElement, reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var EASE = 'cubic-bezier(.2,.8,.2,1)';
  var en = function () { return root.lang === 'en'; };
  function $$(s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); }

  /* ---------- 1. soft open and close ---------- */
  function below(d) {
    // what sits under this question in the same box: the later questions and the group headings
    var box = d.closest('[data-tanya]') || d.parentNode, all = $$('details, .qa__group > h2, .tanya__none, .lb-more', box), out = [];
    var after = false;
    all.forEach(function (el) { if (el === d) { after = true; return; } if (after && el.offsetParent) out.push(el); });
    return out;
  }
  function glide(els, before) {
    els.forEach(function (el, i) {
      var dy = before[i] - el.getBoundingClientRect().top;
      if (Math.abs(dy) > .5) el.animate([{ transform: 'translateY(' + dy + 'px)' }, { transform: 'none' }], { duration: 380, easing: EASE });
    });
  }
  function toggle(d) {
    var a = d.querySelector('.qa__a');
    if (reduce || !d.animate || !a) { d.open = !d.open; return; }
    if (d.classList.contains('is-moving')) return;
    var els = below(d), tops = els.map(function (el) { return el.getBoundingClientRect().top; });
    if (!d.open) {
      d.open = true;
      a.animate([{ opacity: 0, transform: 'translateY(-8px)' }, { opacity: 1, transform: 'none' }], { duration: 340, easing: EASE });
      glide(els, tops);
    } else {
      d.classList.add('is-moving', 'is-closing');
      var f = a.animate([{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'translateY(-6px)' }], { duration: 170, easing: 'ease-in' });
      f.onfinish = function () {
        tops = els.map(function (el) { return el.getBoundingClientRect().top; });
        d.open = false; d.classList.remove('is-moving', 'is-closing');
        glide(els, tops);
      };
    }
  }
  document.addEventListener('click', function (e) {
    var s = e.target.closest('.qa summary, .lb-qa summary');
    if (!s) return;
    e.preventDefault();
    toggle(s.parentNode);
  });

  /* ---------- 2. search and chips ---------- */
  var norm = function (t) { return String(t || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); };
  $$('[data-tanya]').forEach(function (box) {
    var mode = box.getAttribute('data-tanya'), home = mode === 'home';
    var input = box.querySelector('.tanya__search input'), clear = box.querySelector('.tanya__clear');
    var chips = box.querySelector('.tanya__chips'), count = box.querySelector('.tanya__count'), none = box.querySelector('.tanya__none');
    var items = $$('details', box), groups = $$('[data-group]', box);
    if (!input || !items.length) return;
    if (home) {   // the home page opens on its eight popular questions
      var pop = document.createElement('button');
      pop.type = 'button'; pop.className = 'tanya__chip'; pop.setAttribute('data-cat', 'pop');
      pop.textContent = 'Populer'; pop.setAttribute('data-en', 'Popular');
      chips.insertBefore(pop, chips.firstChild);
    }
    if (mode === 'page') items.forEach(function (d) {
      var p = document.createElement('p'); p.className = 'tanya__link';
      var b = document.createElement('button'); b.type = 'button'; b.className = 'tanya__copy';
      b.textContent = 'Salin tautan'; b.setAttribute('data-en', 'Copy link');
      p.appendChild(b); d.querySelector('.qa__a').appendChild(p);
      b.addEventListener('click', function () { copy(b, d.id); });
    });
    var hay = items.map(function (d) {
      var t = d.textContent;
      $$('[data-en]', d).forEach(function (x) { t += ' ' + x.getAttribute('data-en'); });
      return norm(t);
    });
    var cat = home ? 'pop' : '*';
    function draw() {
      var words = norm(input.value.trim()).split(/\s+/).filter(Boolean), n = 0;
      items.forEach(function (d, i) {
        var show = words.length ? words.every(function (w) { return hay[i].indexOf(w) >= 0; })
          : cat === '*' ? true : cat === 'pop' ? d.hasAttribute('data-pop') : d.getAttribute('data-cat') === cat;
        d.hidden = !show; if (show) n++;
      });
      groups.forEach(function (g) { g.hidden = !$$('details', g).some(function (d) { return !d.hidden; }); });
      $$('.tanya__chip', chips).forEach(function (c) { c.setAttribute('aria-pressed', String(!words.length && c.getAttribute('data-cat') === cat)); });
      count.textContent = words.length ? (en() ? n + (n === 1 ? ' question' : ' questions') : n + ' pertanyaan') : '';
      if (none) none.hidden = n > 0;
      if (clear) clear.hidden = !input.value;
    }
    var tm = 0;
    input.addEventListener('input', function () { clearTimeout(tm); tm = setTimeout(draw, 110); });
    if (clear) clear.addEventListener('click', function () { input.value = ''; draw(); input.focus(); });
    chips.addEventListener('click', function (e) {
      var c = e.target.closest('.tanya__chip'); if (!c) return;
      cat = c.getAttribute('data-cat'); input.value = ''; draw();
    });
    new MutationObserver(draw).observe(root, { attributes: true, attributeFilter: ['lang'] });

    function copy(b, id) {
      var url = location.origin + location.pathname + '#' + id, done = function (ok) {
        var old = b.textContent; b.textContent = ok ? (en() ? 'Link copied' : 'Tautan disalin') : url; b.classList.add('is-done');
        setTimeout(function () { b.textContent = old; b.classList.remove('is-done'); }, 2200);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(url).then(function () { done(true); }, function () { done(false); });
      else done(false);
    }
    function openHash() {
      var id = decodeURIComponent((location.hash || '').slice(1)), d = id && document.getElementById(id);
      if (!d || items.indexOf(d) < 0) return;
      input.value = ''; cat = '*'; draw();
      d.open = true; d.classList.add('is-flash');
      setTimeout(function () { d.classList.remove('is-flash'); }, 2400);
      setTimeout(function () { d.scrollIntoView({ block: 'center', behavior: reduce ? 'auto' : 'smooth' }); }, 40);
    }
    draw();
    if (mode === 'page') { openHash(); window.addEventListener('hashchange', openHash); }
  });
})();
