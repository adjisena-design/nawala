/* The theme collection (tema/). Owner's decisions, 21 Nov 2026:
   - its own page, so scrolling moves the page and nothing behind it;
   - numbered per tier (D-001, P-001, E-001; the number comes from the themes table, else from the list order), with
     #tags under each card (tier and family, colour, painting style, what it shows: assets/js/tema-tags.js);
   - a masonry of mixed sizes that drifts, floats and rises in, with the theme nearest the middle shown faintly behind;
   - visitors see about half of each tier; the rest fades out softly and opens with an access code from us (WhatsApp);
   - tabs per tier, family chips, a search box and "only ones I can open"; a tap opens a sheet with the full cover,
     Simpan, "Buka undangan" (the sample in browse mode) and "Gunakan tema ini" (back to the contact box).
   Needs themes.js (window.NAWALA), db.js, simpan.js and tema-tags.js. */
(function () {
  'use strict';
  var N = window.NAWALA, DB = window.NAWALA_DB, SAVE = window.NAWALA_SAVE, TAGS = window.NAWALA_TAGS || {};
  if (!N) return;
  var doc = document, root = doc.documentElement;
  var $ = function (s, c) { return (c || doc).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || doc).querySelectorAll(s)); };
  var query = new URLSearchParams(location.search);
  var calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var WA = '6281379211628';
  /* Premium and Exclusive worlds with a working sample, until the database answers with its kit column (as in site.js) */
  var BUILT = ' pendopo-jawa akad-putih istana-awan teater-tua kapal-bulan kyoto seribu-lentera ';
  var PREFIX = { dasar: 'D', premium: 'P', eksklusif: 'E' };
  var FAMTAG = { alam: 'alam', royal: 'kerajaan', religi: 'religi', nusa: 'nusantara', dunia: 'mancanegara', era: 'lintasmasa', elemen: 'elemen',
    bunga: 'bunga', tempat: 'indonesia', budaya: 'budaya', waktu: 'musim' };

  /* ---------- Language ---------- */
  var lang = root.lang === 'en' ? 'en' : 'id';
  function t(id, en) { return lang === 'en' ? en : id; }
  $$('[data-en]').forEach(function (el) { el.setAttribute('data-id', el.textContent); });
  $$('[data-en-label]').forEach(function (el) { el.setAttribute('data-id-label', el.getAttribute('aria-label') || ''); });
  $$('[data-en-placeholder]').forEach(function (el) { el.setAttribute('data-id-placeholder', el.placeholder); });
  function applyLang() {
    root.lang = lang;
    $$('[data-en]').forEach(function (el) { el.textContent = el.getAttribute('data-' + lang); });
    $$('[data-en-label]').forEach(function (el) { el.setAttribute('aria-label', el.getAttribute(lang === 'en' ? 'data-en-label' : 'data-id-label')); });
    $$('[data-en-placeholder]').forEach(function (el) { el.placeholder = el.getAttribute('data-' + lang + '-placeholder'); });
    $$('[data-lang]').forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-lang') === lang)); });
    doc.title = t('Koleksi tema Nawala', 'The Nawala theme collection');
  }
  $$('[data-lang]').forEach(function (b) {
    b.addEventListener('click', function () {
      lang = b.getAttribute('data-lang');
      try { localStorage.setItem('nawala-lang', lang); } catch (e) {}
      applyLang(); fams(); render();
    });
  });

  /* ---------- Themes ---------- */
  var slug = N.slug, meta = N.meta;
  function ready(th) { var m = meta(slug(th)); return m ? !!m.kit : (th[0] === 'dasar' || BUILT.indexOf(' ' + slug(th) + ' ') > -1); }
  function kitOf(th) { var m = meta(slug(th)); return m && m.kit ? m.kit : slug(th); }
  function owned(th) { var m = meta(slug(th)); return m ? !!m.owned : (N.OWNED || '').indexOf(' ' + slug(th) + ' ') > -1; }
  function tierList(tier) { return N.ALL.filter(function (th) { return th[0] === tier; }); }
  function numberOf(th) {
    var m = meta(slug(th)), n = m && m.no ? m.no : tierList(th[0]).indexOf(th) + 1;
    return (PREFIX[th[0]] || 'T') + '-' + String(n).padStart(3, '0');
  }
  function tagsOf(th) {
    var out = ['#' + th[0]];
    if (FAMTAG[th[5]]) out.push('#' + FAMTAG[th[5]]);
    (TAGS[slug(th)] || []).forEach(function (x) { if (out.indexOf('#' + x) < 0) out.push('#' + x); });
    return out;
  }
  function famName(th) { var f = N.FAMILIES[th[5]]; return f ? t(f[0], f[1]) : ''; }
  function tierName(tier) { var x = N.TIERS[tier]; return x ? t(x[0], x[1]) : tier; }
  function cover(th, size) { return N.cover(th, size); }
  function unlocked() { return !!(SAVE && SAVE.inRoom()); }
  /* about half of each tier is open to visitors, in number order */
  /* themes with a working sample come first, so every invitation that can be opened is among the open half */
  var openCache = {};
  function openSet(tier) {
    if (openCache[tier]) return openCache[tier];
    var list = tierList(tier), keep = Math.ceil(list.length / 2);
    var ranked = list.slice().sort(function (a, b) { return ((ready(a) ? 0 : 1) - (ready(b) ? 0 : 1)) || (list.indexOf(a) - list.indexOf(b)); });
    var set = {}; ranked.slice(0, keep).forEach(function (th) { set[slug(th)] = true; });
    return (openCache[tier] = set);
  }
  function isOpen(th) { return unlocked() || !!openSet(th[0])[slug(th)]; }

  /* ---------- State ---------- */
  var TIERS = ['semua', 'dasar', 'premium', 'eksklusif', 'kustom', 'tersimpan'];
  var tier = TIERS.indexOf(query.get('tier')) > -1 ? query.get('tier') : 'semua';
  var fam = '', words = '', onlyOpen = false;
  var tabs = $$('#tabs button'), groupsEl = $('#groups'), countEl = $('#count'), custom = $('#custom');

  function fams() {
    var have = {};
    N.ALL.forEach(function (th) { if ((tier === 'semua' || th[0] === tier) && N.FAMILIES[th[5]]) have[th[5]] = true; });
    var keys = Object.keys(N.FAMILIES).filter(function (k) { return have[k]; });
    if (fam && !have[fam]) fam = '';
    var box = $('#fams');
    box.hidden = !keys.length;
    box.innerHTML = '<button type="button" data-fam="" aria-pressed="' + (!fam) + '">' + t('Semua keluarga', 'All families') + '</button>' +
      keys.map(function (k) { return '<button type="button" data-fam="' + k + '" aria-pressed="' + (fam === k) + '">' + t(N.FAMILIES[k][0], N.FAMILIES[k][1]) + '</button>'; }).join('');
  }
  function matches(th) {
    if (fam && th[5] !== fam) return false;
    if (onlyOpen && (!ready(th) || owned(th))) return false;
    if (!words) return true;
    var hay = (numberOf(th) + ' ' + numberOf(th).replace('-', '') + ' ' + th[1] + ' ' + th[2] + ' ' + tagsOf(th).join(' ') + ' ' + famName(th)).toLowerCase();
    return words.split(/\s+/).every(function (w) { return hay.indexOf(w.replace(/^#/, '')) > -1; });
  }

  /* ---------- Cards ---------- */
  var SIZES = ['tall', 'mid', 'tall', 'short', 'mid', 'wide', 'tall', 'mid', 'short', 'tall'];
  function sizeOf(i) { return SIZES[i % SIZES.length]; }
  var RATIO = { tall: 16 / 9, mid: 4 / 3, short: 1, wide: 5 / 4 };
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function card(th, i, locked) {
    var sl = slug(th), kept = SAVE && SAVE.isSaved(sl), size = sizeOf(i), fl = !locked && i % 4 === 1;
    var badge = owned(th) ? t('Sudah dimiliki', 'Owned') : ready(th) ? '' : t('Segera', 'Soon');
    var tg = tagsOf(th).slice(0, 5).map(function (x) { return '<span>' + esc(x) + '</span>'; }).join('');
    return '<button class="card card--' + size + (fl ? ' card--float' : '') + '" type="button" data-slug="' + sl + '"' + (locked ? ' tabindex="-1" aria-hidden="true"' : '') +
      (fl ? ' style="--bt:' + (8 + (i % 5)) + 's;--bd:-' + (i % 7) + 's;--pt:' + (12 + (i % 6)) + 's"' : '') + '>' +
      '<span class="card__art"><img src="' + cover(th, 'm') + '" alt="" loading="lazy" decoding="async" width="400" height="' + Math.round(400 * RATIO[size]) + '">' +
      (badge ? '<em class="card__badge">' + badge + '</em>' : '') +
      (kept ? '<i class="card__heart" title="' + t('Tersimpan', 'Saved') + '"><svg viewBox="0 0 24 24"><path d="M12 20.5c-5-3.6-8-6.5-8-10a4.3 4.3 0 0 1 8-2.3 4.3 4.3 0 0 1 8 2.3c0 3.5-3 6.4-8 10z"/></svg></i>' : '') +
      '</span><span class="card__meta"><span class="card__no">' + numberOf(th) + '</span><span class="card__name">' + esc(t(th[1], th[2])) + '</span>' +
      '<span class="tags">' + tg + '</span></span></button>';
  }
  function colCount() { var w = innerWidth; return w < 560 ? 2 : w < 980 ? 3 : w < 1400 ? 4 : 5; }
  /* masonry: each card goes to the shortest column so far */
  function masonry(list, startIndex, locked) {
    var n = colCount(), cols = [], h = [];
    for (var c = 0; c < n; c++) { cols.push([]); h.push(0); }
    list.forEach(function (th, k) {
      var i = startIndex + k, s = 0;
      for (var c = 1; c < n; c++) if (h[c] < h[s] - 1) s = c;
      cols[s].push(card(th, i, locked)); h[s] += RATIO[sizeOf(i)] + 0.5;
    });
    return '<div class="cols">' + cols.map(function (cs) { return '<div class="col">' + cs.join('') + '</div>'; }).join('') + '</div>';
  }

  /* ---------- One tier's group: what is open, then a soft fade over a few locked cards, then the way to open them ---------- */
  function group(tierKey, withHead) {
    var all = tierList(tierKey), open = all.filter(isOpen), shut = all.filter(function (th) { return !isOpen(th); });
    var shown = open.filter(matches), shutMatch = shut.filter(matches);
    if (!shown.length && !shutMatch.length) return '';
    var html = '<section class="group" data-group="' + tierKey + '">';
    if (withHead) html += '<div class="group__head"><h2>' + tierName(tierKey) + '</h2><p>' + all.length + ' ' + t('tema', 'themes') + '</p></div>';
    if (shown.length) html += masonry(shown, 0, false);
    else html += '<p class="empty">' + t('Yang cocok ada di bagian yang masih terkunci.', 'The matches are in the part that is still locked.') + '</p>';
    if (shut.length) {
      html += '<div class="locked" aria-hidden="true">' + masonry((shutMatch.length ? shutMatch : shut).slice(0, colCount() * 2), shown.length, true) + '</div>';
      html += '<div class="unlock"><h3>' + t(shut.length + ' tema ' + tierName(tierKey) + ' lainnya', shut.length + ' more ' + tierName(tierKey) + ' themes') + '</h3>' +
        '<p>' + (shutMatch.length && (words || fam) ? t(shutMatch.length + ' di antaranya cocok dengan pencarian kalian. ', shutMatch.length + ' of them match your search. ') : '') +
        t('Semuanya terbuka dengan kode akses dari kami. Mintalah lewat WhatsApp, tanpa biaya.', 'They all open with an access code from us. Ask for one on WhatsApp; it is free.') + '</p>' +
        '<div class="acts"><a class="btn btn--glow" target="_blank" rel="noopener" href="' + waLink() + '">' + t('Minta kode lewat WhatsApp', 'Ask for a code on WhatsApp') + '</a>' +
        '<button class="btn btn--glass" type="button" data-unlock>' + t('Saya punya kode akses', 'I have an access code') + '</button></div></div>';
    }
    return html + '</section>';
  }
  function waLink() {
    return 'https://wa.me/' + WA + '?text=' + encodeURIComponent(t('Halo Nawala, saya ingin kode akses untuk melihat semua tema.', 'Hello Nawala, I would like an access code to see every theme.'));
  }

  function render() {
    tabs.forEach(function (b) { var on = b.getAttribute('data-tier') === tier; b.setAttribute('aria-selected', String(on)); b.tabIndex = on ? 0 : -1; });
    custom.hidden = tier !== 'kustom'; savedChip();
    $('#filters').hidden = tier === 'kustom';
    root.classList.toggle('is-open-all', unlocked());
    $('#key-btn').hidden = unlocked();
    var html = '', total = 0;
    if (tier === 'kustom') { groupsEl.innerHTML = ''; countEl.textContent = ''; return; }
    if (tier === 'tersimpan') {
      var mine = SAVE ? SAVE.list() : [];
      var list = N.ALL.filter(function (th) { return mine.indexOf(slug(th)) > -1 && matches(th); });
      total = list.length;
      html = list.length ? '<section class="group">' + masonry(list, 0, false) + '</section>'
        : '<p class="empty">' + t('Belum ada tema yang disimpan. Buka sebuah tema, lalu tekan Simpan atau geser ke kanan di undangannya.', 'No themes saved yet. Open a theme, then press Save, or swipe right in its invitation.') + '</p>';
      countEl.textContent = savedNote();
    } else {
      (tier === 'semua' ? ['dasar', 'premium', 'eksklusif'] : [tier]).forEach(function (k) {
        total += tierList(k).filter(function (th) { return isOpen(th) && matches(th); }).length;
        html += group(k, tier === 'semua');
      });
      countEl.textContent = total + ' ' + t('tema terbuka', 'open themes') + (unlocked() ? '' : t(', sisanya dengan kode akses', ', the rest with an access code'));
      if (!html) html = '<p class="empty">' + t('Tidak ada tema yang cocok. Coba kata lain, atau hapus pilihan keluarga.', 'No theme matches. Try another word, or clear the family choice.') + '</p>';
    }
    groupsEl.innerHTML = html;
    watch();
    drift(); behind(true);
  }
  function savedNote() {
    var n = SAVE ? SAVE.list().length : 0;
    if (SAVE && SAVE.inRoom()) return t(n + ' dari 30 tema tersimpan di ruang kalian di Nawala.', n + ' of 30 themes saved in your room with Nawala.');
    return t(n + ' dari 10 tema tersimpan di browser ini saja. Jika data browser dihapus atau ponsel direset, simpanan ini hilang. Masuk dengan kode akses agar tersimpan di Nawala.',
      n + ' of 10 themes saved, in this browser only. If the browser data is cleared or the phone is reset, they are gone. Enter an access code to keep them with Nawala.');
  }
  function savedChip() { var n = SAVE ? SAVE.list().length : 0; $('#saved-n').textContent = n; $('#saved-chip').classList.toggle('has', n > 0); $('#saved-chip').setAttribute('aria-pressed', String(tier === 'tersimpan')); }

  /* ---------- Controls ---------- */
  function setTier(k, push) {
    tier = k; fams(); render();
    if (push) try { history.replaceState(null, '', '?tier=' + k); } catch (e) {}
    var bar = $('#bar'); if (bar.getBoundingClientRect().top < 0) scrollTo({ top: bar.offsetTop - 4, behavior: calm ? 'auto' : 'smooth' });
  }
  tabs.forEach(function (b, k) {
    b.addEventListener('click', function () { setTier(b.getAttribute('data-tier'), true); });
    b.addEventListener('keydown', function (e) {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      var n = tabs[(k + (e.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length]; n.focus(); n.click();
    });
  });
  $('#fams').addEventListener('click', function (e) { var b = e.target.closest('[data-fam]'); if (!b) return; fam = b.getAttribute('data-fam'); fams(); saringN(); render(); });
  var typing;
  $('#q').addEventListener('input', function (e) { clearTimeout(typing); var v = e.target.value; typing = setTimeout(function () { words = v.trim().toLowerCase(); render(); }, 180); });
  $('#only-open').addEventListener('click', function (e) { onlyOpen = !onlyOpen; e.currentTarget.setAttribute('aria-pressed', String(onlyOpen)); saringN(); render(); });
  var drawer = $('#drawer'), saring = $('#saring');
  saring.addEventListener('click', function () { drawer.hidden = !drawer.hidden; saring.setAttribute('aria-expanded', String(!drawer.hidden)); });
  function saringN() { var n = (fam ? 1 : 0) + (onlyOpen ? 1 : 0), b = $('#saring-n'); b.hidden = !n; b.textContent = n; }
  $('#saved-chip').addEventListener('click', function () { setTier(tier === 'tersimpan' ? 'semua' : 'tersimpan', true); });
  $('#custom-wa').href = 'https://wa.me/' + WA + '?text=' + encodeURIComponent('Halo Nawala, saya ingin tema kustom. Saya akan kirim inspirasinya.');

  /* ---------- Moving: entrance, floating, drifting columns, the theme behind ---------- */
  var io = 'IntersectionObserver' in window ? new IntersectionObserver(function (es) {
    es.forEach(function (en) { en.target.classList.toggle('is-on', en.isIntersecting); if (en.isIntersecting) en.target.classList.add('is-in'); });
  }, { rootMargin: '80px 0px' }) : null;
  function watch() { $$('.card', groupsEl).forEach(function (c) { if (io) io.observe(c); else c.classList.add('is-in', 'is-on'); }); }
  var K = [0, -0.06, 0.045, -0.035, 0.055];
  function drift() {
    if (calm) return;
    var vh = innerHeight;
    $$('.cols', groupsEl).forEach(function (cs) {
      var r = cs.getBoundingClientRect(); if (r.bottom < -200 || r.top > vh + 200) return;
      var p = vh / 2 - r.top;
      $$('.col', cs).forEach(function (col, i) { var y = Math.max(-46, Math.min(46, p * K[i % K.length])); col.style.transform = 'translate3d(0,' + y.toFixed(1) + 'px,0)'; });
    });
  }
  var layers = [$('#bg-a'), $('#bg-b')], front = 0, shownSlug = '';
  function behind(force) {
    var mid = innerHeight / 2, best = null, bestD = 1e9;
    $$('.group > .cols .card', groupsEl).forEach(function (c) {
      var r = c.getBoundingClientRect(); if (r.bottom < 0 || r.top > innerHeight) return;
      var d = Math.abs(r.top + r.height / 2 - mid); if (d < bestD) { bestD = d; best = c; }
    });
    var sl = best ? best.getAttribute('data-slug') : '';
    if (!sl || (sl === shownSlug && !force)) return;
    var th = N.ALL.filter(function (x) { return slug(x) === sl; })[0]; if (!th) return;
    shownSlug = sl;
    var next = layers[1 - front]; next.style.backgroundImage = 'url(' + cover(th, 's') + ')';
    next.classList.add('is-on'); layers[front].classList.remove('is-on'); front = 1 - front;
  }
  var ticking = false, lastBehind = 0;
  addEventListener('scroll', function () {
    if (ticking) return; ticking = true;
    requestAnimationFrame(function () {
      ticking = false; drift();
      var now = Date.now(); if (now - lastBehind > 350) { lastBehind = now; behind(false); }
    });
  }, { passive: true });
  var lastCols = colCount();
  addEventListener('resize', function () { if (colCount() !== lastCols) { lastCols = colCount(); render(); } });

  /* ---------- One theme ---------- */
  var sheet = $('#detail'), viewing = null;
  function queueAfter(th) {
    var list = tierList(th[0]), at = list.indexOf(th), out = [];
    for (var k = 1; k < list.length; k++) {
      var o = list[(at + k) % list.length], sl = slug(o);
      if (isOpen(o) && ready(o) && !owned(o) && !(SAVE && (SAVE.isSaved(sl) || SAVE.isPassed(sl)))) out.push(sl);
    }
    return out;
  }
  function tell(s) { var m = $('#d-msg'); m.hidden = !s; m.textContent = s || ''; }
  function saveLabel() {
    var b = $('#d-save'), kept = viewing && SAVE && SAVE.isSaved(slug(viewing));
    b.setAttribute('aria-pressed', String(!!kept)); b.textContent = kept ? t('Tersimpan, lepas', 'Saved, let go') : t('Simpan', 'Save');
  }
  function show(th) {
    viewing = th; var sl = slug(th), can = ready(th) && !owned(th), isX = th[0] === 'eksklusif';
    var cv = $('#d-cover'); cv.className = 'd__cover' + (th[0] === 'premium' ? ' is-wide' : ''); cv.style.backgroundImage = 'url(' + cover(th, 't') + ')';
    $('#d-no').textContent = numberOf(th);
    $('#d-name').textContent = t(th[1], th[2]);
    $('#d-fam').textContent = tierName(th[0]) + (famName(th) ? ', ' + famName(th) : '');
    $('#d-tags').innerHTML = tagsOf(th).map(function (x) { return '<span>' + esc(x) + '</span>'; }).join('');
    $('#d-desc').textContent = t(th[3], th[4]) + ' ' + (can ? t('Buka undangannya dan jalani seperti seorang tamu: geser naik turun untuk melihat isinya, geser ke kanan untuk menyimpan, ke kiri untuk melewati.', 'Open the invitation and walk it as a guest would: swipe up and down to see inside, right to save it, left to pass.')
      : owned(th) ? '' : t('Undangannya segera hadir. Kalian sudah bisa menyimpannya.', 'Its invitation is coming soon. You can already save it.'));
    var open = $('#d-open'); open.hidden = !can;
    open.href = can ? '../undangan/' + (th[0] === 'dasar' ? 'dasar.html' : '') + '?tema=' + encodeURIComponent(kitOf(th)) + '&to=Bapak+dan+Ibu+Santoso&jelajah=' + th[0] + '&antre=' + queueAfter(th).join(',') : '#';
    var one = $('#d-one'); one.hidden = !isX;
    one.textContent = owned(th) ? t('Tema ini sudah dimiliki satu pasangan dan tidak dijual lagi.', 'This theme already belongs to a couple and is no longer for sale.')
      : t('Untuk satu pasangan saja. Setelah kalian pilih, tema ini menjadi milik kalian dan tidak kami pakai lagi.', 'For one couple only. Once you choose it, it is yours and we never use it again.');
    var use = $('#d-use'); use.hidden = owned(th); use.href = '../?pilih=' + encodeURIComponent(sl) + '#kontak';
    $('#d-save').hidden = owned(th) || !SAVE; saveLabel(); tell('');
    if (sheet.showModal) sheet.showModal(); else sheet.setAttribute('open', '');
  }
  groupsEl.addEventListener('click', function (e) {
    var c = e.target.closest('.card'); if (!c || c.closest('.locked')) return;
    var th = N.ALL.filter(function (x) { return slug(x) === c.getAttribute('data-slug'); })[0]; if (th) show(th);
  });
  $('#d-save').addEventListener('click', function () {
    if (!viewing || !SAVE) return; var sl = slug(viewing);
    if (SAVE.isSaved(sl)) { SAVE.remove(sl); tell(''); }
    else {
      var r = SAVE.save(sl);
      if (r.full) tell(SAVE.inRoom() ? t('Sudah 30 tema tersimpan. Lepas satu dulu di ruang kalian.', '30 themes are already saved. Let one go in your room first.')
        : t('Browser ini sudah menyimpan 10 tema. Masuk dengan kode akses untuk menyimpan sampai 30, atau lepas satu di Tersimpan.', 'This browser already keeps 10 themes. Enter an access code to keep up to 30, or let one go under Saved.'));
      else if (r.first) { SAVE.told(); tell(t('Tersimpan di browser ini saja, paling banyak 10 tema. Jika data browser dihapus atau ponsel direset, simpanan ini hilang. Masuk dengan kode akses agar tersimpan di Nawala.', 'Saved in this browser only, 10 themes at most. If the browser data is cleared or the phone is reset, these saves are gone. Enter an access code to keep them with Nawala.')); }
      else tell('');
    }
    saveLabel();
  });
  doc.addEventListener('click', function (e) {
    if (e.target.closest('[data-close]') || (e.target.tagName === 'DIALOG')) { var d = e.target.closest('dialog'); if (d) d.close(); return; }
    if (e.target.closest('[data-unlock]')) { if (sheet.open) sheet.close(); openUnlock(); }
  });

  /* ---------- Access code ---------- */
  var un = $('#unlock');
  function openUnlock() { $('#u-wa').href = waLink(); $('#u-msg').hidden = true; if (un.showModal) un.showModal(); setTimeout(function () { try { $('#u-code').focus(); } catch (e) {} }, 60); }
  function umsg(html) { var m = $('#u-msg'); m.innerHTML = html; m.hidden = false; }
  $('#u-form').addEventListener('submit', function (e) {
    e.preventDefault();
    var c = $('#u-code').value.trim().toUpperCase().replace(/[^A-Z0-9-]/g, '');
    if (c.length < 4) return umsg(t('Tulis kode akses Anda dulu.', 'Please type your access code first.'));
    var later = t('Kode belum bisa diperiksa sekarang. Kirim kode Anda lewat WhatsApp, dan kami bukakan temanya. ', 'The code cannot be checked right now. Send it to us on WhatsApp and we will open the themes for you. ') +
      '<a href="https://wa.me/' + WA + '?text=' + encodeURIComponent('Halo Nawala, kode akses saya: ' + c) + '" target="_blank" rel="noopener">' + t('Buka WhatsApp', 'Open WhatsApp') + '</a>';
    if (!DB) return umsg(later);
    DB.rpc('check_access_code', { code: c }).then(function (ok) {
      if (ok !== true) return umsg(t('Kode itu tidak kami kenali. Periksa lagi, atau hubungi kami lewat WhatsApp.', 'We do not recognise that code. Check it again, or reach us on WhatsApp.'));
      try { sessionStorage.setItem('nawala-code', c); } catch (err) {}
      umsg(t('Kode diterima. Seluruh koleksi terbuka.', 'Code accepted. The whole collection is open.'));
      if (SAVE) SAVE.reopen().then(function () { render(); savedChip(); setTimeout(function () { if (un.open) un.close(); }, 1200); });
    }, function () { umsg(later); });
  });

  /* ---------- Start ---------- */
  applyLang(); fams(); render(); savedChip();
  N.load().then(function () { openCache = {}; fams(); render(); });
  if (SAVE) { SAVE.ready().then(function () { render(); savedChip(); }); SAVE.onChange(function () { savedChip(); if (tier === 'tersimpan') render(); }); }
  if (query.get('masuk') === '1') openUnlock();
})();
