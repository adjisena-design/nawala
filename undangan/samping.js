/* The wide-screen side of an invitation (owner, 22 Nov 2026: "invitation left, picture right").
   On a computer the invitation keeps its phone column, moved to the left, and the rest of the screen becomes part
   of it: the couple's own wide picture (photos.side), else their cover photo, else the theme's own artwork, with
   their names and date resting on it. Loaded by both engines (index.html and dasar.html) after the couple file.
   Not in a frame (editor, previews), not under 1100px. Only opacity and transform move; nothing under reduced motion. */
(function () {
  'use strict';
  if (window.top !== window.self) return;
  var D = window.NAWALA_INVITE; if (!D) return;
  var mq = window.matchMedia('(min-width:1100px)');
  var root = document.documentElement, PH = D.photos || {};
  function okPhoto(u) { return typeof u === 'string' && /^https:\/\/erwddnobnagpglkpvdfm\.supabase\.co\/storage\/v1\/object\/public\/media\/inv\/[a-z0-9\/-]+\.(webp|jpg)$/.test(u)
    || (window.NAWALA_IMAJINASI === true && typeof u === 'string' && /^data:image\/(jpeg|webp|png);base64,[A-Za-z0-9+\/=]+$/.test(u)); }

  var css = [
    'html.side-on{--colx:clamp(24px,4vw,72px)}',
    'html.side-on .stage,html.side-on .page{margin-left:var(--colx);margin-right:0}',
    'html.side-on.js .stage,html.side-on .js .gate,html.side-on.js .gate,html.side-on .tools,html.side-on .bar,html.side-on .backdrop,html.side-on .jl-hint{left:calc(var(--colx) + min(100vw, var(--col)) / 2)}',
    'html.side-on body::before{background:rgba(10,20,14,.82)}',
    '.side{position:fixed;z-index:1;top:24px;bottom:24px;right:24px;left:calc(var(--colx) + var(--col) + clamp(24px,3vw,56px));border-radius:30px;overflow:hidden;',
    '  background:#1c2a21 var(--side-pic) 50% 40%/cover no-repeat;box-shadow:0 40px 90px -40px rgba(0,0,0,.7),inset 0 0 0 1px rgba(255,255,255,.12);opacity:0;transition:opacity 1.2s cubic-bezier(.16,1,.3,1)}',
    '.side.is-in{opacity:1}',
    '.side::after{content:"";position:absolute;inset:auto 0 0 0;height:46%;background:linear-gradient(180deg,rgba(8,16,11,0),rgba(8,16,11,.62))}',
    '.side__say{position:absolute;z-index:1;left:clamp(28px,4vw,64px);right:clamp(28px,4vw,64px);bottom:clamp(28px,5vh,56px);color:#FBF6EA;text-shadow:0 2px 24px rgba(0,0,0,.35)}',
    '.side__names{display:block;font-family:var(--display,Fraunces),Georgia,serif;font-weight:500;font-size:clamp(2.6rem,4.4vw,4.6rem);line-height:1.02;letter-spacing:-.02em}',
    '.side__date{display:block;margin-top:.7rem;font-size:1.125rem;font-weight:600;opacity:.9}',
    '.side--art{background-size:cover}',
    '@media (prefers-reduced-motion:reduce){.side{transition:none}}'
  ].join('\n');

  var side, say;
  function picture() {
    if (okPhoto(PH.side)) return 'url("' + PH.side + '")';
    if (okPhoto(PH.cover)) return 'url("' + PH.cover + '")';
    if (root.getAttribute('data-kit') === 'umum') return 'url("../assets/img/plate-sky-desktop-sm.webp")';
    var sky = document.querySelector('[data-scene="sky"]');
    var v = getComputedStyle(sky || root).getPropertyValue('--plate').trim();
    if ((!v || v === 'none') && sky) v = getComputedStyle(root).getPropertyValue('--plate').trim();
    return v && v !== 'none' ? v : '';
  }
  function words() {
    var en = (root.lang || '').slice(0, 2) === 'en';
    var b = D.bride || {}, g = D.groom || {};
    var names = (b.short || '') + (b.short && g.short ? ' & ' : '') + (g.short || '');
    var date = '';
    if (/^\d{4}-\d{2}-\d{2}$/.test(D.date || '')) {
      var p = D.date.split('-');
      try { date = new Date(Date.UTC(+p[0], +p[1] - 1, +p[2], 12)).toLocaleDateString(en ? 'en-GB' : 'id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }); } catch (e) {}
    }
    say.innerHTML = '';
    var n = document.createElement('span'); n.className = 'side__names'; n.textContent = names; say.appendChild(n);
    if (date) { var d = document.createElement('span'); d.className = 'side__date'; d.textContent = date; say.appendChild(d); }
  }
  function build() {
    var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
    side = document.createElement('aside'); side.className = 'side'; side.setAttribute('aria-hidden', 'true');
    say = document.createElement('div'); say.className = 'side__say'; side.appendChild(say);
    document.body.appendChild(side);
    new MutationObserver(words).observe(root, { attributes: true, attributeFilter: ['lang'] });
  }
  function apply() {
    var on = mq.matches;
    root.classList.toggle('side-on', on);
    if (!on) { if (side) side.classList.remove('is-in'); return; }
    if (!side) build();
    side.style.setProperty('--side-pic', picture());
    if (!okPhoto(PH.side) && !okPhoto(PH.cover)) side.classList.add('side--art');
    words();
    requestAnimationFrame(function () { side.classList.add('is-in'); });
  }
  function start() { apply(); if (mq.addEventListener) mq.addEventListener('change', apply); else mq.addListener(apply); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
