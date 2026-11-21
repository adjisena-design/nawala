/* Browsing: an invitation opened from the home page's theme list (?jelajah=<tier>&antre=<the themes still to see>).
   The visitor walks the real invitation up and down as any guest would; a swipe to the right saves the theme, a swipe to
   the left passes it, and the next theme in the list opens. Two buttons do the same for mouse and keyboard.
   Saves go through NAWALA_SAVE (assets/js/simpan.js): this browser for a visitor (10), the couple's room with a code (30).
   Works on both engines (index.html and dasar.html); it only touches #tools and adds its own elements. */
(function () {
  'use strict';
  var q; try { q = new URLSearchParams(location.search); } catch (e) { return; }
  var tier = (q.get('jelajah') || '').replace(/[^a-z]/g, ''), slug = (q.get('tema') || '').toLowerCase();
  var queue = (q.get('antre') || '').split(',').filter(function (s) { return /^[a-z0-9-]{2,40}$/.test(s); });
  var S = window.NAWALA_SAVE;
  if (!tier || !/^[a-z0-9-]{2,40}$/.test(slug) || !S) return;
  var root = document.documentElement, calm = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function t(id, en) { return root.lang === 'en' ? en : id; }
  function el(tag, cls, html) { var n = document.createElement(tag); if (cls) n.className = cls; if (html) n.innerHTML = html; return n; }
  root.classList.add('is-browsing');

  var css = el('style');
  css.textContent =
    '.is-browsing #review{display:none!important}' +
    '.jl-tool[aria-pressed="true"]{color:#F4A6C0}.jl-tool[aria-pressed="true"] svg{fill:currentColor}' +
    '.jl-wash{position:fixed;inset:0;z-index:300;display:flex;align-items:center;justify-content:center;pointer-events:none;opacity:0;color:#FBF6EA;background:rgba(22,48,31,.92)}' +
    '.jl-wash--save{background:rgba(216,67,107,.92)}' +
    '.jl-wash svg{width:84px;height:84px;fill:none;stroke:currentColor;stroke-width:1.6;stroke-linecap:round;stroke-linejoin:round}' +
    '.jl-wash--save svg{fill:currentColor}' +
    '.jl-wash.is-go{animation:jl-in .42s cubic-bezier(.2,.8,.2,1) both}' +
    '@keyframes jl-in{from{opacity:0;transform:translate3d(calc(var(--jd,1) * -100%),0,0)}to{opacity:1;transform:none}}' +
    '.jl-hint{position:fixed;z-index:120;left:50%;bottom:calc(max(.7rem,env(safe-area-inset-bottom)) + 5.6rem);transform:translate(-50%,10px);width:min(92vw,400px);padding:.8rem 1.1rem;border-radius:18px;font-size:1.0625rem;line-height:1.4;text-align:center;color:#FBF6EA;background:rgba(14,22,18,.9);box-shadow:0 14px 34px -14px rgba(0,0,0,.7);opacity:0;pointer-events:none;transition:opacity .5s,transform .5s}' +
    '.jl-hint.is-on{opacity:1;transform:translate(-50%,0)}' +
    '.jl-sheet{width:min(92vw,430px);margin:auto;padding:1.4rem 1.3rem 1.2rem;border:0;border-radius:26px;color:#FBF6EA;background:rgba(14,22,18,.97);box-shadow:0 30px 80px -20px rgba(0,0,0,.8)}' +
    '.jl-sheet::backdrop{background:rgba(6,10,8,.7)}' +
    '.jl-sheet h2{margin:0 0 .5rem;font:600 1.5rem/1.2 var(--display,serif);letter-spacing:-.01em}' +
    '.jl-sheet p{margin:0 0 1rem;font-size:1.0625rem;line-height:1.5}' +
    '.jl-sheet div{display:flex;flex-wrap:wrap;gap:.5rem}' +
    '.jl-sheet button,.jl-sheet a{flex:1 1 auto;display:inline-flex;align-items:center;justify-content:center;min-height:50px;padding:.5rem 1.1rem;border-radius:999px;border:0;cursor:pointer;font:inherit;font-weight:650;font-size:1rem;text-decoration:none;color:#FBF6EA;background:rgba(251,246,234,.14)}' +
    '.jl-sheet .jl-main{color:#16301F;background:#FBF6EA}';
  document.head.appendChild(css);

  var ICON = {
    back: '<path d="M15 5 8 12l7 7"/>',
    pass: '<path d="m6 6 12 12M18 6 6 18"/>',
    save: '<path d="M12 20.500c-5-3.600-8-6.500-8-10a4.300 4.300 0 0 1 8-2.300 4.300 4.300 0 0 1 8 2.300c0 3.500-3 6.400-8 10z"/>'
  };
  function tool(kind, tag) {
    var b = el(tag || 'button', 'tool tool--round jl-tool', '<svg viewBox="0 0 24 24" aria-hidden="true" style="width:22px;height:22px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round">' + ICON[kind] + '</svg>');
    if (b.tagName === 'BUTTON') b.type = 'button';
    return b;
  }
  function home(tab) { return '../?tema=' + (tab || tier) + '#tema'; }
  var group = document.querySelector('#tools .tools__group');
  if (!group) return;
  var back = tool('back', 'a'), no = tool('pass'), yes = tool('save');
  back.href = home();
  group.appendChild(back); group.appendChild(no); group.appendChild(yes);
  function labels() {
    back.setAttribute('aria-label', t('Kembali ke daftar tema', 'Back to the theme list'));
    no.setAttribute('aria-label', t('Lewati tema ini', 'Pass on this theme'));
    yes.setAttribute('aria-label', t('Simpan tema ini', 'Save this theme'));
    yes.setAttribute('aria-pressed', String(S.isSaved(slug)));
  }
  labels(); S.ready().then(labels);
  var langBtn = document.getElementById('lang'); if (langBtn) langBtn.addEventListener('click', function () { setTimeout(labels, 60); });

  /* ---------- moving on ---------- */
  var leaving = false;
  function next() {
    var n = queue.shift();
    if (!n) { location.href = home('tersimpan'); return; }
    q.set('tema', n); q.set('antre', queue.join(',')); q.delete('step');
    location.search = '?' + q.toString();
  }
  function wash(kind, then) {
    if (calm) return then();
    var w = el('div', 'jl-wash jl-wash--' + kind, '<svg viewBox="0 0 24 24" aria-hidden="true">' + ICON[kind] + '</svg>');
    w.style.setProperty('--jd', kind === 'save' ? 1 : -1);
    document.body.appendChild(w); void w.offsetWidth; w.classList.add('is-go');
    setTimeout(then, 440);
  }
  function sheet(title, text, buttons) {
    var d = el('dialog', 'jl-sheet'), row = el('div');
    d.appendChild(el('h2', '', title)); d.appendChild(el('p', '', text));
    buttons.forEach(function (b) {
      var n = el(b.href ? 'a' : 'button', b.main ? 'jl-main' : '', b.label);
      if (b.href) n.href = b.href; else { n.type = 'button'; n.addEventListener('click', function () { d.close(); d.remove(); if (b.then) b.then(); }); }
      row.appendChild(n);
    });
    d.appendChild(row); document.body.appendChild(d);
    d.addEventListener('cancel', function (e) { e.preventDefault(); });
    if (d.showModal) d.showModal(); else d.setAttribute('open', '');
  }
  function save() {
    if (leaving) return;
    S.ready().then(function () {
      var r = S.save(slug, true);
      if (r.full) {
        return sheet(t('Sudah ' + S.cap() + ' tema tersimpan', S.cap() + ' themes are already saved'),
          S.inRoom() ? t('Lepas satu dulu di ruang kalian, lalu simpan yang ini.', 'Let one go in your room first, then save this one.')
            : t('Tanpa kode akses, browser ini menyimpan paling banyak 10 tema. Masuk dengan kode akses untuk menyimpan sampai 30, atau lepas satu dari daftar Tersimpan.', 'Without an access code this browser keeps 10 themes at most. Enter an access code to keep up to 30, or let one go from your Saved list.'),
          [{ label: t('Lihat yang tersimpan', 'See what is saved'), href: home('tersimpan'), main: true },
            { label: t('Masuk dengan kode', 'Enter a code'), href: '../?masuk=1' },
            { label: t('Tutup', 'Close') }]);
      }
      if (!r.ok) return;
      labels();
      if (r.first) {
        S.told();
        return sheet(t('Tersimpan di browser ini', 'Saved in this browser'),
          t('Kalian belum masuk, jadi tema ini kami simpan di browser ini saja, paling banyak 10 tema. Jika data browser dihapus atau ponsel direset, simpanan ini hilang. Masuk dengan kode akses agar pilihan kalian tersimpan di Nawala.', 'You are not logged in, so this theme is kept in this browser only, 10 themes at most. If the browser data is cleared or the phone is reset, these saves are gone. Enter an access code to keep your choices with Nawala.'),
          [{ label: t('Lanjut ke tema berikutnya', 'On to the next theme'), main: true, then: function () { leaving = true; next(); } },
            { label: t('Masuk dengan kode', 'Enter a code'), href: '../?masuk=1' }]);
      }
      leaving = true; wash('save', next);
    });
  }
  function pass() {
    if (leaving) return; leaving = true;
    S.ready().then(function () { S.pass(slug, true); wash('pass', next); });
  }
  yes.addEventListener('click', save); no.addEventListener('click', pass);

  /* ---------- the sideways swipe (up and down belongs to the invitation) ---------- */
  var sx = 0, sy = 0, st = 0, live = false;
  document.addEventListener('touchstart', function (e) {
    var tg = e.target;
    live = e.touches.length === 1 && !(tg.closest && tg.closest('input,textarea,select,dialog,.seg,.gallery__thumbs,[data-noswipe]'));
    if (live) { sx = e.touches[0].clientX; sy = e.touches[0].clientY; st = Date.now(); }
  }, { passive: true });
  document.addEventListener('touchend', function (e) {
    if (!live) return; live = false;
    var p = e.changedTouches[0], dx = p.clientX - sx, dy = p.clientY - sy;
    if (Date.now() - st > 900 || Math.abs(dx) < 76 || Math.abs(dx) < Math.abs(dy) * 2.2) return;
    if (dx > 0) save(); else pass();
  }, { passive: true });

  /* ---------- said once per visit ---------- */
  var told = false; try { told = sessionStorage.getItem('nawala-jelajah') === '1'; sessionStorage.setItem('nawala-jelajah', '1'); } catch (e) {}
  if (!told) {
    var hint = el('p', 'jl-hint');
    var show = function () {
      hint.textContent = t('Geser ke kanan untuk menyimpan tema ini, ke kiri untuk melewati. Naik dan turun untuk melihat isinya.', 'Swipe right to save this theme, left to pass. Up and down to see inside.');
      document.body.appendChild(hint); void hint.offsetWidth; hint.classList.add('is-on');
      setTimeout(function () { hint.classList.remove('is-on'); setTimeout(function () { hint.remove(); }, 700); }, 6500);
    };
    var wait = setInterval(function () { if (root.classList.contains('is-inside')) { clearInterval(wait); setTimeout(show, 1400); } }, 400);
  }
})();
