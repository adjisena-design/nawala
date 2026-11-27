/* The Studio (studio.html): the slot editor for Dasar invitations (owner, 27 Nov 2026).
   One order's invitation runs in a frame (dasar.html?preview=1&edit=2, or the sample couple with ?edit=2&tema=<slug>);
   undangan/studio-dalam.js inside it reports what was tapped. The Studio changes two things:
     the design   draft.design (assets/js/desain.js): faces, text size, boxes, frames, photo crops, colourway, stickers,
                  the opening, Nawala, and the team's permissions (hak). Saved by room_design_save / team_design_save.
     the words    the couple's names and date, straight into the order's draft (room_order_save / team_order_save),
                  and a replaced photo (the media bucket), so the couple need not go back to the form for them.
   Three ways to change the design, one engine underneath:
     Sentuh  a tap chooses a slot, the panel offers short rows of choices for that slot only
     Gaya    whole looks (ND.LOOKS), colourways (ND.PALS), "Kejutkan saya"
     Stiker  free placement on a layer above the theme; guarded parts cannot be covered
   What a couple may change: ND.can(design, level, cap, team). The team may change everything and sets the couple's
   rights per order in Hak. The sample saves nothing (this tab's sessionStorage only). */
(function () {
  'use strict';
  var K = window.K, DB = window.NAWALA_DB, B = window.NAWALA_BUILDER, ND = window.NAWALA_DESIGN, t = K.t, esc = K.esc, $ = K.$, $$ = K.$$;
  var P = {}; try { new URLSearchParams(location.search).forEach(function (v, k) { P[k] = v; }); } catch (e) {}
  var AS = P.as === 'tim' ? 'tim' : P.as === 'ruang' ? 'ruang' : 'contoh', SLUG = P.u || '', SAMPLE = AS === 'contoh';
  var KEY = 'nawala-studio-contoh', IMA = 'nawala-imajinasi';
  var who = '', order = null, rows = [], design = ND.norm({}), hist = [], pos = -1, sel = null, mode = 'sentuh', scope = 'semua';
  var fontCat = { judul: 'saran', teks: 'saran' }, elCat = 'bunga', level = 2, view = 'pasangan', tema = /^[a-z0-9-]{2,40}$/.test(P.tema || '') ? P.tema : 'sage-pagi', kata = {};
  var confirmReset = false, page = null, pv = $('#pv'), wide = window.matchMedia('(min-width:900px)'), keepY = 0, first = true, slide0 = null;
  var LEVELS = [['Dasar', 'Basic'], ['Menengah', 'Middle'], ['Maksimal', 'Full']];
  /* a short row first, like the lock screen: eight faces that sit well on most themes; the full list is one tap away */
  var SARAN = { judul: ['great-vibes', 'playfair-display', 'cormorant-garamond', 'cinzel', 'parisienne', 'italiana', 'prata', 'pinyon-script'],
    teks: ['lora', 'eb-garamond', 'jost', 'nunito-sans', 'cormorant-garamond', 'raleway', 'spectral', 'quicksand'] };
  var DEMO_THEMES = [['sage-pagi', 'Sage Pagi'], ['mawar-debu', 'Mawar Debu'], ['navy-emas', 'Navy Emas'], ['putih-klasik', 'Putih Klasik'], ['terakota', 'Terakota'], ['toba', 'Danau Toba'],
    ['peoni', 'Peoni'], ['malam-bintang', 'Malam Bintang'], ['lila', 'Lila'], ['bromo', 'Bromo Subuh']];

  /* ---------- Small helpers ---------- */
  function relabel() {
    $$('[data-en]').forEach(function (el) { if (!el.hasAttribute('data-id')) el.setAttribute('data-id', el.textContent); el.textContent = K.lang() === 'en' ? el.getAttribute('data-en') : el.getAttribute('data-id'); });
    $('#undo').setAttribute('aria-label', t('Urungkan', 'Undo')); $('#redo').setAttribute('aria-label', t('Ulangi', 'Redo'));
    $$('[data-setlang]').forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-setlang') === K.lang())); });
    document.documentElement.lang = K.lang();
  }
  var toastTimer = 0;
  function toast(m) { var el = $('#toast'); el.textContent = m; el.classList.add('is-on'); clearTimeout(toastTimer); toastTimer = setTimeout(function () { el.classList.remove('is-on'); }, 3200); }
  function stop(h, p, href, label) {
    $('#gate-h').textContent = h; $('#gate-p').textContent = p; $('#gate-a').href = href; $('#gate-a').textContent = label;
    $('#gate').hidden = false; document.body.classList.remove('is-loading');
  }
  function stored(k) { try { return sessionStorage.getItem(k) || localStorage.getItem(k) || ''; } catch (e) { return ''; } }
  function nowIso() { return new Date().toISOString(); }
  function uid() { return 'i' + Date.now().toString(36).slice(-6) + Math.floor(Math.random() * 36).toString(36); }
  function rnd(a) { return a[Math.floor(Math.random() * a.length)]; }
  function team() { return AS === 'tim' || (SAMPLE && view === 'tim'); }
  function can(cap) { return ND.can(design, level, cap, team()); }
  function capName(cap) { var c = ND.CAPS.filter(function (x) { return x[0] === cap; })[0]; return c ? t(c[1], c[2]) : cap; }
  function capLevel(cap) { var c = ND.CAPS.filter(function (x) { return x[0] === cap; })[0]; return c ? c[3] : 3; }
  function deny(cap) {
    var closed = design.hak && design.hak[cap] === false;
    toast(closed ? t('"' + capName(cap) + '" dikunci tim Nawala untuk pesanan ini. Hubungi kami bila ingin dibuka.', '"' + capName(cap) + '" is locked by the Nawala team for this order. Ask us to open it.')
      : t('"' + capName(cap) + '" terbuka di tingkat ' + LEVELS[capLevel(cap) - 1][0] + '. Tim Nawala juga bisa membukanya untuk pesanan kalian.', '"' + capName(cap) + '" opens at the ' + LEVELS[capLevel(cap) - 1][1] + ' level. The Nawala team can also open it for your order.'));
  }
  /* the theme's own colours, read from the invitation itself */
  function palette() {
    var out = { paper: '#FFFDF8', main: '#3A3035', accent: '#D8436B', soft: '#F4A6C0', wash: '#FBDCE6' };
    try {
      var cs = page.getComputedStyle(page.document.documentElement);
      [['paper', '--paper'], ['main', '--main'], ['accent', '--accent'], ['soft', '--accent-soft'], ['wash', '--accent-wash']].forEach(function (k) { var v = cs.getPropertyValue(k[1]).trim(); if (/^#[0-9a-f]{6}$/i.test(v)) out[k[0]] = v; });
    } catch (e) {}
    return out;
  }
  function invite() { return (page && page.NAWALA_INVITE) || {}; }
  function names() { var D = invite(); return ((D.bride && D.bride.short) || 'Laras') + ' & ' + ((D.groom && D.groom.short) || 'Bima'); }

  /* ---------- Loading ---------- */
  function boot() {
    relabel();
    $$('[data-setlang]').forEach(function (b) { b.addEventListener('click', function () { try { localStorage.setItem('nawala-lang', b.getAttribute('data-setlang')); } catch (e) {} location.reload(); }); });
    var back = $('#back'), send = $('#send');
    if (SAMPLE) {
      try { var s = JSON.parse(sessionStorage.getItem(KEY) || 'null'); if (s) { design = ND.norm(s.design); level = s.level || 2; kata = s.kata || {}; if (!P.tema && s.tema) tema = s.tema; } } catch (e) {}
      back.href = '../tema/'; back.target = '_top';
      $('#who').textContent = t('Laras & Bima, pasangan contoh', 'Laras & Bima, the sample couple');
      $('#demo').hidden = false; document.body.classList.add('has-demo');
      sendLabel();
      demoBar();
      return show('dasar.html?edit=2&tema=' + encodeURIComponent(tema));
    }
    if (AS === 'tim') {
      back.href = '../tim/#undangan';
      sendLabel(); send.href = '../tim/#undangan';
      $('#mode-hak').hidden = false;
      who = stored('nawala-tim');
      if (!who) return stop(t('Masuk dulu ke konsol tim', 'Log in to the team console first'), t('Studio dibuka dari pesanan di konsol tim.', 'The Studio opens from an order in the team console.'), '../tim/', t('Buka konsol tim', 'Open the team console'));
      return DB.rpc('team_data', { t: who }).then(function (d) {
        if (!d || d.denied) return stop(t('Token tidak berlaku', 'This token no longer works'), t('Masuk lagi di konsol tim, lalu buka Studio dari pesanan.', 'Log in again in the team console, then open the Studio from the order.'), '../tim/', t('Buka konsol tim', 'Open the team console'));
        rows = d.themes || [];
        order = (d.invitations || []).filter(function (o) { return o.slug === SLUG; })[0];
        go();
      }, offline);
    }
    back.href = '../ruang/#undangan';
    sendLabel();
    who = stored('nawala-code');
    if (!who) return stop(t('Masuk dulu ke ruang pasangan', 'Open your room first'), t('Studio dibuka dari halaman undangan di ruang kalian.', 'The Studio opens from the invitation page in your room.'), '../ruang/', t('Buka ruang pasangan', 'Open your room'));
    Promise.all([DB.rpc('room_open', { p_code: who }), DB.rpc('site_themes', {})]).then(function (r) {
      if (!r[0]) return stop(t('Kode tidak berlaku', 'This code no longer works'), t('Masa berlaku kode habis. Hubungi kami lewat WhatsApp dan kami perpanjang.', 'The code has reached its end date. Tell us on WhatsApp and we will extend it.'), '../ruang/', t('Buka ruang pasangan', 'Open your room'));
      order = r[0].order; rows = (r[1] || []).map(function (x) { return { slug: x.slug, tier: x.tier, kit: x.kit }; });
      go();
    }, offline);
  }
  function offline() { stop(t('Database Nawala belum terhubung', 'The Nawala database is out of reach'), t('Periksa sambungan, lalu muat ulang halaman ini.', 'Check the connection, then reload this page.'), location.href, t('Muat ulang', 'Reload')); }
  function go() {
    if (!order) return stop(t('Pesanan tidak ditemukan', 'Order not found'), t('Buka Studio dari pesanan yang masih berjalan.', 'Open the Studio from an order that is still running.'), $('#back').href, t('Kembali', 'Back'));
    var r = B.route(order.theme, rows);
    if (r.route !== 'dasar') return stop(t('Studio menyusul untuk tema ini', 'The Studio comes later for this theme'), t('Studio tersedia untuk tema Dasar lebih dulu. Untuk tema ini, tim Nawala yang menata desainnya bersama kalian.', 'The Studio is ready for Dasar themes first. For this theme, the Nawala team arranges the design with you.'), $('#back').href, t('Kembali', 'Back'));
    $('#who').textContent = order.couple + (AS === 'tim' ? ' (' + order.slug + ')' : '');
    order.draft = B.norm(order.draft);
    level = +order.level || 2;
    design = ND.norm(order.draft.design);
    preview();
    show('dasar.html?preview=1&edit=2&to=' + encodeURIComponent(t('Tamu undangan', 'Our guest')));
  }
  function preview() {
    var c = B.compile(order.draft, order, rows, true);
    c.data.design = design;
    try { localStorage.setItem('nawala-preview', JSON.stringify(c.data)); } catch (e) {}
  }
  pv.addEventListener('load', function () {
    page = pv.contentWindow;
    if (!page || !page.NAWALA_DESIGN) return;
    if (SAMPLE) words();
    apply();
    if (page.NAWALA_EDIT) page.NAWALA_EDIT.mode(mode);
    if (keepY) { try { page.scrollTo({ top: keepY, behavior: 'instant' }); } catch (e) { page.scrollTo(0, keepY); } keepY = 0; }
    if (first) {
      first = false; remember(true);
      document.body.classList.remove('is-loading');
      setState(SAMPLE ? t('Contoh', 'Sample') : t('Tersimpan', 'Saved'));
    }
    setMode(mode, true);
  });
  function show(src) { pv.src = src; }
  /* some changes need the page drawn again (the date, a new photo, another theme's own pictures) */
  function reload(src) {
    try { keepY = page.scrollY || 0; } catch (e) { keepY = 0; }
    sel = null;
    if (!SAMPLE) preview();
    if (SAMPLE) pv.src = 'dasar.html?edit=2&tema=' + encodeURIComponent(tema) + '&r=' + Date.now(); else if (src) pv.src = src; else page.location.reload();
  }
  /* the sample's own names live in this tab only */
  function words() {
    var D = invite();
    Object.keys(kata).forEach(function (p) { var k = p.split('.'); if (D[k[0]] && typeof kata[p] === 'string' && kata[p]) D[k[0]][k[1]] = kata[p]; });
    if (page.NAWALA_PAGE && page.NAWALA_PAGE.refill) page.NAWALA_PAGE.refill();
  }

  /* ---------- Applying, remembering, saving ---------- */
  function apply() {
    if (!page || !page.NAWALA_DESIGN) return;
    page.NAWALA_DESIGN.apply(design);
    if (page.NAWALA_EDIT) page.NAWALA_EDIT.reselect(sel);
  }
  function remember(start) {
    var s = JSON.stringify(design);
    if (!start && hist[pos] === s) return;
    hist = hist.slice(0, pos + 1); hist.push(s); if (hist.length > 80) hist.shift(); pos = hist.length - 1;
    buttons();
  }
  function buttons() { $('#undo').disabled = pos <= 0; $('#redo').disabled = pos >= hist.length - 1; }
  function commit(redraw) {
    design.at = nowIso();
    design = ND.norm(design);
    apply(); remember(); save();
    if (redraw !== false) panel();
  }
  var saveTimer = 0, draftTimer = 0;
  function setState(s) { $('#state').textContent = s; }
  function keepSample() { try { sessionStorage.setItem(KEY, JSON.stringify({ design: design, level: level, tema: tema, kata: kata })); } catch (e) {} }
  function save() {
    if (SAMPLE) return keepSample();
    setState(t('Menyimpan...', 'Saving...'));
    clearTimeout(saveTimer);
    saveTimer = setTimeout(function () {
      var call = AS === 'tim' ? DB.rpc('team_design_save', { t: who, p_slug: SLUG, p_design: design }) : DB.rpc('room_design_save', { p_code: who, p_design: design });
      call.then(function (ok) {
        if (ok === false || ok === null) { setState(t('Belum tersimpan', 'Not saved')); toast(AS === 'tim' ? t('Belum tersimpan. Periksa token Anda di konsol tim.', 'Not saved. Check your token in the team console.') : t('Belum tersimpan. Kode kalian mungkin sudah habis masa berlakunya.', 'Not saved. Your code may have reached its end date.')); return; }
        setState(AS === 'tim' ? t('Tersimpan, belum diterbitkan', 'Saved, not published yet') : t('Tersimpan, menunggu tim', 'Saved, waiting for the team'));
      }, function () { setState(t('Belum tersimpan', 'Not saved')); toast(t('Belum tersimpan ke Nawala. Kami coba lagi pada perubahan berikutnya.', 'Not saved to Nawala yet. We try again with the next change.')); });
    }, 900);
  }
  /* the words and photos live in the order's draft, beside the design; the server keeps the stored design on this save */
  function saveDraft(now) {
    if (SAMPLE) return keepSample();
    setState(t('Menyimpan...', 'Saving...'));
    clearTimeout(draftTimer);
    draftTimer = setTimeout(function () {
      var d = JSON.parse(JSON.stringify(order.draft)); delete d.design;
      var call = AS === 'tim' ? DB.rpc('team_order_save', { t: who, p_slug: SLUG, p_patch: { draft: d } }) : DB.rpc('room_order_save', { p_code: who, p_draft: d });
      call.then(function (ok) { setState(ok ? t('Tersimpan', 'Saved') : t('Belum tersimpan', 'Not saved')); }, function () { setState(t('Belum tersimpan', 'Not saved')); });
    }, now ? 0 : 900);
  }
  function step(to) { pos = to; design = ND.norm(JSON.parse(hist[pos])); design.at = nowIso(); apply(); save(); buttons(); panel(); }
  $('#undo').addEventListener('click', function () { if (pos > 0) step(pos - 1); });
  $('#redo').addEventListener('click', function () { if (pos < hist.length - 1) step(pos + 1); });
  $('#send').addEventListener('click', function (e) {
    if (AS === 'tim') return;
    e.preventDefault();
    if (SAMPLE) { (window.top || window).location.href = new URL('../?pilih=' + encodeURIComponent(tema) + '#kontak', location.href).href; return; }
    DB.rpc('room_order_submit', { p_code: who }).then(function () { toast(t('Terkirim ke tim Nawala. Kami kabari lewat WhatsApp.', 'Sent to the Nawala team. We will reply on WhatsApp.')); }, function () { toast(t('Belum terkirim. Coba lagi sebentar lagi.', 'Not sent yet. Try again in a moment.')); });
  });

  /* ---------- What the preview tells us (undangan/studio-dalam.js) ---------- */
  function itemBy(id) { for (var i = 0; i < design.items.length; i++) if (design.items[i].id === id) return design.items[i]; return null; }
  function photoOf(slot) { return design.photos[slot] || (design.photos[slot] = { x: 50, y: 50, z: 1, r: 0, s: 1, al: 'c' }); }
  window.NAWALA_STUDIO = {
    select: function (s) {
      sel = s; scope = 'semua'; confirmReset = false;
      if (s && s.kind === 'item') { if (mode !== 'stiker') return setMode('stiker', true); }
      else if (s && mode !== 'sentuh') return setMode('sentuh', true);
      if (s && !wide.matches) { $('#side').classList.remove('is-shut'); setTimeout(function () { var pr = pv.getBoundingClientRect(); if (page.NAWALA_EDIT.lift) page.NAWALA_EDIT.lift(s, ($('#side').offsetTop - pr.top) / pr.height); }, 80); }
      panel();
    },
    value: function (s) { if (s.kind === 'item') { var it = itemBy(s.id); return it ? { x: it.x, y: it.y, w: it.w, r: it.r } : { x: 50, y: 50, w: 40, r: 0 }; } var p = photoOf(s.id); return { x: p.x, y: p.y, z: p.z }; },
    live: function (s, out) {
      var o = s.kind === 'item' ? itemBy(s.id) : photoOf(s.id); if (!o) return;
      Object.keys(out).forEach(function (k) { o[k] = out[k]; });
      apply();
    },
    done: function () { commit(); },
    /* a sticker was dropped on a guarded part: it goes back */
    reject: function (s, v0) {
      var o = itemBy(s.id); if (o && v0) Object.keys(v0).forEach(function (k) { o[k] = v0[k]; });
      apply(); panel();
      toast(t('Bagian itu dijaga (nama, tanggal, nama tamu, formulir, hitung mundur). Stiker dikembalikan ke tempatnya.', 'That part is guarded (names, date, guest name, the form, the countdown). The sticker went back.'));
    },
    /* frames, wreaths and arches are made to stand around the names, so they may */
    free: function (id) { var it = itemBy(id), e = it && it.k === 'el' && ND.elById(it.s); return !!e && e[1] === 'bingkai'; },
    may: function (cap) { return can(cap); },
    blocks: function () { return ND.BLOCKS; }
  };

  /* ---------- Modes ---------- */
  var HEAD = {
    sentuh: [['Sentuh apa saja di undangan', 'Tap anything in the invitation'], ['Satu sentuhan memilih satu bagian. Pilihannya muncul di sini, tinggal geser dan pilih.', 'One tap chooses one part. Its choices appear here; scroll and pick.']],
    gaya: [['Ganti seluruh gaya sekali sentuh', 'Change the whole look in one tap'], ['Setiap gaya disusun tim Nawala, jadi tema tidak bisa rusak.', 'Every look was set up by the Nawala team, so the theme cannot break.']],
    stiker: [['Lapisan stiker', 'Sticker layer'], ['Satu-satunya bagian yang bebas digeser. Stiker berada di atas tema dan tidak bisa menutupi bagian yang dijaga.', 'The only free placement. Stickers sit above the theme and cannot cover the guarded parts.']],
    pembuka: [['Pembuka undangan', 'The opening'], ['Yang pertama dilihat tamu sebelum undangan terbuka.', 'What a guest sees first, before the invitation opens.']],
    hak: [['Hak sunting pasangan', 'What this couple may change'], ['Buka atau kunci tiap bagian untuk pesanan ini saja. Tema dan tingkat pesanan tidak berubah.', 'Open or lock each part for this order only. The theme and the order\'s level stay as they are.']]
  };
  function setMode(m, keepSel) {
    if (m === 'hak' && !team()) m = 'sentuh';
    mode = m; confirmReset = false;
    if (!keepSel || (sel && ((sel.kind === 'item') !== (m === 'stiker')))) { sel = null; }
    $$('#modes [data-mode]').forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-mode') === mode)); });
    if (page && page.NAWALA_EDIT) { page.NAWALA_EDIT.mode(mode); page.NAWALA_EDIT.reselect(sel); }
    panel();
  }
  $('#modes').addEventListener('click', function (e) {
    var b = e.target.closest('[data-mode]'); if (!b) return;
    var m = b.getAttribute('data-mode'), side = $('#side');
    if (!wide.matches && m === mode && !side.classList.contains('is-shut')) { side.classList.add('is-shut'); return; }
    side.classList.remove('is-shut');
    setMode(m);
  });
  /* phones: the sheet follows a finger on its grip or heading; let go past a third and it closes (the mode bar opens it again) */
  (function () {
    var side = $('#side'), y0 = null, dy = 0, moved = false;
    function down(e) { if (wide.matches) return; y0 = e.clientY; dy = 0; moved = false; try { e.currentTarget.setPointerCapture(e.pointerId); } catch (x) {} }
    function move(e) { if (y0 === null) return; dy = Math.max(0, e.clientY - y0); if (dy > 4) { moved = true; side.classList.add('is-drag'); side.style.transform = 'translateY(' + dy + 'px)'; side.style.opacity = String(Math.max(.3, 1 - dy / 400)); } }
    function up() { if (y0 === null) return; var shut = dy > Math.min(120, side.offsetHeight / 3); y0 = null; side.classList.remove('is-drag'); side.style.transform = ''; side.style.opacity = ''; if (shut) side.classList.add('is-shut'); }
    [$('#grip'), $('.side__head')].forEach(function (el) { el.addEventListener('pointerdown', down); el.addEventListener('pointermove', move); el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up); });
    $('#grip').addEventListener('click', function () { if (!moved) side.classList.add('is-shut'); });
  })();
  /* short words for the one main action on phones, so the bar keeps its title */
  function sendLabel() {
    var s = !wide.matches;
    $('#send').textContent = SAMPLE ? (s ? t('Pakai tema', 'Use theme') : t('Gunakan tema ini', 'Use this theme')) : AS === 'tim' ? (s ? t('Pesanan', 'Order') : t('Kembali ke pesanan', 'Back to the order')) : (s ? t('Kirim', 'Send') : t('Kirim untuk diperiksa', 'Send for a check'));
  }
  if (wide.addEventListener) wide.addEventListener('change', sendLabel);

  /* ---------- Building blocks of the panel ---------- */
  var LOCK = '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>';
  function lockTag(cap) {
    if (can(cap)) return '';
    return '<span class="lock">' + LOCK + (design.hak && design.hak[cap] === false ? t('Dikunci tim', 'Locked by the team') : t('Tingkat ', '') + LEVELS[capLevel(cap) - 1][K.lang() === 'en' ? 1 : 0] + t('', ' level')) + '</span>';
  }
  function rw(cap, label, inner, val) {
    var ok = !cap || can(cap);
    return '<div class="rw' + (ok ? '' : ' is-locked') + '"' + (cap ? ' data-cap="' + cap + '"' : '') + '><div class="rw__l">' + label + (val ? ' <span class="v">' + val + '</span>' : '') + (cap ? lockTag(cap) : '') + '</div><div class="rw__in">' + inner + '</div></div>';
  }
  function chip(act, v, label, on, dis, extra) { return '<button type="button" class="chip" data-act="' + act + '" data-v="' + esc(v) + '"' + (extra || '') + ' aria-pressed="' + !!on + '"' + (dis ? ' disabled' : '') + '>' + label + '</button>'; }
  function range(act, v, lo, hi, stepBy, l1, l2) { return '<div class="range"><span>' + l1 + '</span><input type="range" data-act="' + act + '" min="' + lo + '" max="' + hi + '" step="' + (stepBy || 1) + '" value="' + v + '"><span>' + l2 + '</span></div>'; }
  function swatches(act, cur, withDefault) {
    var p = palette(), list = [[p.paper, t('Kertas tema', 'Theme paper')], ['#FFFFFF', t('Putih', 'White')], [p.wash, t('Warna tema muda', 'Light theme colour')], [p.soft, t('Warna tema', 'Theme colour')],
      [p.accent, t('Aksen tema', 'Theme accent')], [p.main, t('Warna utama', 'Main colour')], ['#2F272B', t('Arang', 'Charcoal')]], free = can('bebas');
    return '<div class="sw">' + (withDefault ? '<button type="button" data-act="' + act + '" data-v="" aria-pressed="' + !cur + '" aria-label="' + t('Bawaan tema', 'Theme default') + '" title="' + t('Bawaan tema', 'Theme default') + '" style="background:linear-gradient(135deg,' + p.paper + ' 50%,' + p.accent + ' 50%)"></button>' : '') +
      list.map(function (c) { return '<button type="button" data-act="' + act + '" data-v="' + c[0] + '" aria-pressed="' + (cur === c[0]) + '" aria-label="' + esc(c[1]) + '" title="' + esc(c[1]) + '" style="background:' + c[0] + '"></button>'; }).join('') +
      (free ? '<label aria-label="' + t('Warna bebas', 'Any colour') + '" title="' + t('Warna bebas', 'Any colour') + '"><input type="color" data-act="' + act + '" value="' + (cur || p.paper) + '"></label>'
        : '<label class="is-off" data-deny="bebas" title="' + t('Warna bebas', 'Any colour') + '"></label>') + '</div>';
  }
  function boxId() { return sel && sel.kind === 'box' ? sel.id : sel && sel.kind === 'word' ? sel.box : ''; }
  function boxTarget() { var id = boxId(); if (scope === 'ini' && id) return design.boxes[id] || (design.boxes[id] = {}); return design.box; }
  function scopeRow(all, one) { return '<div class="chips">' + chip('scope', 'semua', all, scope === 'semua') + chip('scope', 'ini', one, scope === 'ini') + '</div>'; }
  /* the font row: a few picks first, then the whole shelf by kind; every chip shows the couple's own words */
  function fontRow(role) {
    var b = boxTarget(), own = scope === 'ini' && boxId(), cur = own ? (role === 'judul' ? b.fj : b.ft) || '' : design.font[role];
    var cats = [['saran', 'Pilihan', 'Picks']].concat(ND.FONT_CATS.filter(function (c) { return role !== 'teks' || c[0] !== 'script'; }));
    var cat = fontCat[role]; if (!cats.some(function (c) { return c[0] === cat; })) cat = fontCat[role] = 'saran';
    var list = cat === 'saran' ? SARAN[role].map(ND.fontById) : ND.FONTS.filter(function (f) { return f[0] && f[2] === cat; });
    if (cur && cat === 'saran' && SARAN[role].indexOf(cur) < 0) list = [ND.fontById(cur)].concat(list);
    var sample = role === 'judul' ? names() : t('Dengan penuh syukur', 'With grateful hearts');
    var out = '<div class="scr scr--chips" data-k="fc-' + role + '">' + cats.map(function (c) { return chip('fcat', c[0], t(c[1], c[2]), cat === c[0], false, ' data-role="' + role + '"'); }).join('') + '</div>' +
      '<div class="scr" data-k="f-' + role + '"><button type="button" class="fc" data-act="font" data-role="' + role + '" data-v="" aria-pressed="' + !cur + '"><b style="font-family:' + (role === 'judul' ? 'var(--display)' : 'var(--body)') + '">' + esc(sample) + '</b><span>' + (own ? t('Ikut semua', 'Same as all') : t('Bawaan tema', 'Theme default')) + '</span></button>';
    list.forEach(function (f) {
      if (!f) return;
      ND.loadFont(f[0]);
      out += '<button type="button" class="fc" data-act="font" data-role="' + role + '" data-v="' + f[0] + '" aria-pressed="' + (cur === f[0]) + '"><b style="font-family:' + esc(ND.face(f[0])) + '">' + esc(sample) + '</b><span>' + esc(f[1]) + '</span></button>';
    });
    return out + '</div>';
  }
  function sizeRow() { var z = design.font.z || 100; return rw('huruf', t('Ukuran semua tulisan', 'Size of all writing'), range('fz', z, 90, 115, 1, t('Kecil', 'Small'), t('Besar', 'Large')), z + '%'); }

  /* ---------- Sentuh: one slot at a time ---------- */
  var WORDS = { 'bride.short': ['Nama panggilan mempelai wanita', 'The bride\'s short name', 24], 'groom.short': ['Nama panggilan mempelai pria', 'The groom\'s short name', 24],
    'bride.full': ['Nama lengkap mempelai wanita', 'The bride\'s full name', 60], 'groom.full': ['Nama lengkap mempelai pria', 'The groom\'s full name', 60],
    'date': ['Tanggal pernikahan', 'The wedding date'], 'bride.parents': ['Orang tua mempelai wanita', 'The bride\'s parents'], 'groom.parents': ['Orang tua mempelai pria', 'The groom\'s parents'] };
  var JUMP = [['sampul', 'Sampul', 'Cover'], ['mempelai', 'Mempelai', 'The couple'], ['acara', 'Acara', 'Events'], ['galeri', 'Galeri', 'Gallery'], ['rsvp', 'RSVP', 'RSVP'], ['penutup', 'Penutup', 'Closing']];
  var SLOTS = { bride: ['Foto mempelai wanita', 'The bride\'s photo'], groom: ['Foto mempelai pria', 'The groom\'s photo'], cover: ['Foto sampul', 'The cover photo'] };
  function wordValue(path) { var k = path.split('.'), D = invite(), v = k.length === 1 ? D[k[0]] : D[k[0]] && D[k[0]][k[1]]; return Array.isArray(v) ? v[K.lang() === 'en' ? 1 : 0] : v || ''; }
  function formLink() { return SAMPLE ? '' : ' <a href="' + (AS === 'tim' ? '../tim/#undangan' : '../ruang/#undangan') + '">' + t('Buka Data undangan', 'Open Invitation details') + '</a>'; }
  function pSentuh() {
    if (!sel || sel.kind === 'item') {
      return [t('Sentuh apa saja di undangan', 'Tap anything in the invitation'), HEAD.sentuh[1][K.lang() === 'en' ? 1 : 0],
        rw('', t('Lompat ke bagian', 'Jump to a part'), '<div class="chips">' + JUMP.map(function (j) { return chip('jump', j[0], t(j[1], j[2])); }).join('') + '</div>') + sizeRow() +
        '<p class="note">' + t('Nama, tanggal, kotak teks, dan foto bisa disentuh. Nama tamu dan tanda Nawala dijaga tema.', 'Names, the date, text boxes and photos can be tapped. The guest\'s name and the Nawala mark are kept by the theme.') + '</p>'];
    }
    if (sel.kind === 'lock') {
      return sel.id === 'tamu'
        ? [t('Nama tamu', 'The guest\'s name'), t('Bagian ini dikunci tema.', 'This part is locked by the theme.'), '<p class="note note--pink">' + t('Nama tamu terisi sendiri dari tautan tiap tamu di daftar tamu kalian, jadi tidak diubah di sini.', 'The guest\'s name fills itself in from each guest\'s own link in your guest list, so it is not changed here.') + '</p>']
        : [t('Tanda Nawala', 'The Nawala mark'), t('Bagian ini dikunci tema.', 'This part is locked by the theme.'), '<p class="note note--pink">' + t('Nawala kecil selalu ada di akhir undangan. Nawala yang ikut di sepanjang undangan bisa dimatikan di Pembuka.', 'A small Nawala always stays at the end of the invitation. The Nawala that travels through the invitation can be switched off under Opening.') + '</p>'];
    }
    if (sel.kind === 'photo') return pFoto();
    var out = '', title, role = sel.kind === 'word' && !sel.head ? 'teks' : 'judul';
    if (sel.kind === 'word') {
      var W = WORDS[sel.id] || [sel.id, sel.id], v = wordValue(sel.id);
      title = t(W[0], W[1]);
      if (sel.id === 'date') out += rw('kata', t('Tanggal', 'Date'), '<input class="field" type="date" data-act="wdate" value="' + esc(invite().date || '') + '">');
      else if (W[2]) out += rw('kata', t('Tulisan', 'Words'), '<input class="field" type="text" data-act="word" maxlength="' + W[2] + '" value="' + esc(v) + '">');
      else out += '<p class="note">' + t('Baris ini disusun dari urutan anak dan nama orang tua di Data undangan.', 'This line is composed from the child order and the parents\' names in Invitation details.') + formLink() + '</p>';
    } else title = t('Kotak teks', 'Text box');
    if (sel.kind === 'word') out += rw('huruf', role === 'judul' ? t('Huruf nama dan judul', 'Font for names and headings') : t('Huruf teks bacaan', 'Font for running text'), fontRow(role));
    else out += rw('huruf', t('Huruf nama dan judul', 'Font for names and headings'), fontRow('judul')) + rw('huruf', t('Huruf teks bacaan', 'Font for running text'), fontRow('teks'));
    out += rw('', t('Huruf dan kotak berlaku untuk', 'Fonts and box apply to'), scopeRow(t('Semua tulisan dan kotak', 'All writing and boxes'), t('Kotak ini saja', 'This box only')));
    var b = boxTarget(), a = b.a !== undefined ? b.a : (scope === 'ini' && design.box.a !== undefined ? design.box.a : 100), r = b.r !== undefined ? b.r : (scope === 'ini' && design.box.r !== undefined ? design.box.r : 28);
    out += rw('kotak', t('Warna kotak', 'Box colour'), swatches('boxc', b.c || '', true)) +
      rw('kotak', t('Kepadatan kotak', 'Box solidity'), range('boxa', a, 0, 100, 5, t('Bening', 'Clear'), t('Padat', 'Solid')), a + '%') +
      rw('kotak', t('Sudut kotak', 'Box corners'), range('boxr', r, 0, 40, 2, t('Tegas', 'Square'), t('Bulat', 'Round')));
    if (scope !== 'ini') out += sizeRow();
    return [title, sel.kind === 'word' ? t('Tulisan dan kotak tempatnya berada.', 'The words and the box they sit in.') : t('Huruf dan kotak di balik tulisan.', 'The fonts and the box behind the writing.'), out];
  }
  function pFoto() {
    var slot = sel.id, p = photoOf(slot), real = page && page.NAWALA_EDIT && page.NAWALA_EDIT.isPhoto(slot), one = scope === 'ini';
    var cur = one ? (design.frames[slot] || '') : design.frame, out = '';
    out += rw('foto', t('Foto', 'Photo'), '<div class="row"><button type="button" class="btn btn--glass btn--sm" data-act="pick">' + (real ? t('Ganti foto', 'Replace the photo') : t('Pasang foto', 'Put in a photo')) + '</button>' +
      (real ? '<button type="button" class="btn btn--glass btn--sm" data-act="pcentre">' + t('Tengahkan', 'Centre') + '</button>' : '') + '<input type="file" id="file" accept="image/*" hidden></div>' +
      (real ? '<p class="note note--pink">' + t('Geser foto di undangan untuk memilih bagian yang tampil. Bingkainya tetap di tempat.', 'Drag the photo in the invitation to choose what shows. The frame stays where it is.') + '</p>' + range('pz', Math.round(p.z * 100), 100, 300, 5, '1x', '3x')
        : '<p class="note">' + (SAMPLE ? t('Di contoh ini Nawala menggantikan pengantin. Pasang foto kalian (tetap di perangkat ini) untuk mencoba menggeser dan memperbesarnya.', 'In this sample Nawala stands in for the couple. Put in your own photo (it stays on this device) to try moving and zooming it.') : t('Belum ada foto di sini. Pasang foto, lalu geser dan perbesar langsung di undangan.', 'No photo here yet. Put one in, then move and zoom it right in the invitation.')) + '</p>'));
    out += rw('', t('Bingkai berlaku untuk', 'The frame applies to'), scopeRow(t('Semua foto', 'All photos'), t('Foto ini saja', 'This photo only')));
    out += rw('bingkai', t('Bingkai', 'Frame'), '<div class="scr" data-k="frame"><button type="button" class="tile" data-act="frame" data-v="" aria-pressed="' + !cur + '"><span class="tile__art"><span class="fx" style="opacity:.5"></span></span>' + (one ? t('Ikut semua', 'Same as all') : t('Bawaan tema', 'Theme default')) + '</button>' +
      ND.FRAMES.map(function (f) { return '<button type="button" class="tile" data-act="frame" data-v="' + f[0] + '" aria-pressed="' + (cur === f[0]) + '"><span class="tile__art"><span class="fx fx--' + f[0] + '"></span></span>' + t(f[1], f[2]) + '</button>'; }).join('') + '</div>');
    out += rw('bingkai', t('Alas di balik foto', 'Backing behind the photo'), '<div class="chips">' + chip('back', 'kertas', t('Kertas', 'Paper'), design.back === 'kertas') + chip('back', 'aksen', t('Warna tema', 'Theme colour'), design.back === 'aksen') + chip('back', 'tanpa', t('Tanpa alas', 'None'), design.back === 'tanpa') + '</div>');
    out += rw('bingkai', t('Ukuran bingkai', 'Frame size'), range('ps', Math.round(p.s * 100), 60, 130, 5, t('Kecil', 'Small'), t('Besar', 'Large'))) +
      rw('bingkai', t('Letak bingkai', 'Frame position'), '<div class="chips">' + chip('pal', 'l', t('Kiri', 'Left'), p.al === 'l') + chip('pal', 'c', t('Tengah', 'Centre'), p.al === 'c') + chip('pal', 'r', t('Kanan', 'Right'), p.al === 'r') + '</div>');
    return [t(SLOTS[slot][0], SLOTS[slot][1]), t('Foto diatur di dalam bingkainya, jadi tata letak tema tidak pernah bergeser.', 'The photo is set inside its frame, so the theme\'s layout never shifts.'), out];
  }

  /* ---------- Gaya: whole looks ---------- */
  function pGaya() {
    var p = palette(), cur = ND.lookOf(design), nm = names().split(' & ').map(function (x) { return x.charAt(0); }).join(' & '), out = '';
    if (SAMPLE) out += rw('', t('Tema (contoh saja: isi dan desain kalian ikut pindah)', 'Theme (sample only: your words and design move along)'), '<div class="scr" data-k="tema">' + DEMO_THEMES.map(function (x) {
      return '<button type="button" class="th" data-act="tema" data-v="' + x[0] + '" aria-pressed="' + (tema === x[0]) + '"><img src="../assets/img/cover-' + x[0] + '-s.webp" alt="" loading="lazy"><span>' + esc(x[1]) + '</span></button>'; }).join('') + '</div>');
    out += rw('gaya', t('Gaya', 'Looks'), '<div class="scr" data-k="look">' + ND.LOOKS.map(function (L) {
      var d = L[3], pl = d.pal ? ND.palOf(d.pal) : p, fj = d.font && d.font.judul; if (fj) ND.loadFont(fj);
      return '<button type="button" class="lk" data-act="look" data-v="' + L[0] + '" aria-pressed="' + (cur === L[0]) + '"><span class="lk__pv" style="background:' + pl.paper + ';color:' + pl.main + '"><i class="fx' + (d.frame ? ' fx--' + d.frame : '') + '" style="width:26px;height:32px;background:' + pl.soft + ';box-shadow:0 0 0 2px ' + pl.paper + ',0 0 0 3px ' + pl.accent + '"></i><b style="font-family:' + (fj ? esc(ND.face(fj)) : 'var(--display)') + '">' + esc(nm) + '</b></span><span>' + t(L[1], L[2]) + '</span></button>'; }).join('') + '</div>' +
      '<div class="row"><button type="button" class="btn btn--glass btn--sm" data-act="surprise">' + t('Kejutkan saya', 'Surprise me') + '</button><span class="small muted">' + t('Mengacak hanya pilihan yang diizinkan tema.', 'Shuffles only the choices the theme allows.') + '</span></div>');
    out += rw('warna', t('Warna tema', 'Theme colours'), '<div class="scr" data-k="cw"><button type="button" class="cw cw--own" data-act="cw" data-v="" aria-pressed="' + !design.pal + '">' + t('Asli', 'Own') + '</button>' +
      ND.PALS.map(function (x) { var q = ND.palOf(x[0]); return '<button type="button" class="cw" data-act="cw" data-v="' + x[0] + '" aria-pressed="' + (design.pal === x[0]) + '" aria-label="' + esc(t(x[1], x[2])) + '" title="' + esc(t(x[1], x[2])) + '"><i style="background:' + q.paper + '"></i><i style="background:' + q.accent + '"></i><i style="background:' + q.main + '"></i></button>'; }).join('') + '</div>' +
      '<p class="small muted">' + t('Gambar tema tetap; kertas, tinta, dan aksennya yang berganti.', 'The theme\'s picture stays; its paper, ink and accent change.') + '</p>');
    out += sizeRow();
    out += resetRow();
    return [t(HEAD.gaya[0][0], HEAD.gaya[0][1]), t(HEAD.gaya[1][0], HEAD.gaya[1][1]), out];
  }
  function resetRow() {
    return rw('', t('Kembali ke desain asli tema', 'Back to the theme as designed'), (confirmReset ? '<div class="row"><button type="button" class="btn btn--warn btn--sm" data-act="reset">' + t('Ya, kembalikan semua', 'Yes, undo everything') + '</button><button type="button" class="btn btn--glass btn--sm" data-act="noreset">' + t('Batal', 'Cancel') + '</button></div>'
      : '<div class="row"><button type="button" class="btn btn--glass btn--sm" data-act="askreset">' + t('Kembalikan semua', 'Undo everything') + '</button><span class="small muted">' + t('Nama, tanggal, dan foto tetap.', 'Names, the date and photos stay.') + '</span></div>'));
  }
  function surprise() {
    var D = ND.norm(design);
    D.font.judul = rnd(SARAN.judul); D.font.teks = rnd(SARAN.teks);
    D.box = { a: rnd([70, 85, 100, 100]), r: rnd([4, 12, 22, 28, 36]) }; D.boxes = {};
    D.frame = rnd(ND.FRAMES)[0]; D.frames = {}; D.back = rnd(['kertas', 'kertas', 'aksen']);
    if (can('warna')) D.pal = rnd([''].concat(ND.PALS.map(function (x) { return x[0]; })));
    design = D; commit();
  }

  /* ---------- Stiker: the free layer ---------- */
  function elTile(e) {
    var painted = /\.webp$/.test(e[5] || '');
    return '<button type="button" class="tile" data-act="add" data-v="' + e[0] + '"><span class="tile__art">' +
      (painted ? '<img class="tile__img" src="' + ND.base() + 'el/' + e[0] + '.webp" alt="" loading="lazy">' : '<span class="tile__m" style="--m:url(' + ND.base() + 'el/' + e[0] + '.svg)"></span>') + '</span>' + esc(t(e[2], e[3])) + '</button>';
  }
  function pStiker() {
    var cats = ND.EL_CATS.filter(function (c) { return c[0] !== 'lukis' || ND.PAINTED.length; }), it = sel && sel.kind === 'item' && itemBy(sel.id), out = '';
    if (it) {
      var inner = '';
      if (it.k === 'txt') {
        inner += '<textarea class="field" data-act="txt" rows="2" maxlength="160">' + esc(it.t) + '</textarea>' +
          '<select class="field" data-act="txtf"><option value="">' + t('Huruf bawaan tema', 'Theme default font') + '</option>' + ND.FONT_CATS.map(function (c) { return '<optgroup label="' + esc(t(c[1], c[2])) + '">' + ND.FONTS.filter(function (f) { return f[2] === c[0]; }).map(function (f) { return '<option value="' + f[0] + '"' + (it.f === f[0] ? ' selected' : '') + '>' + esc(f[1]) + '</option>'; }).join('') + '</optgroup>'; }).join('') + '</select>' +
          range('fs', it.fs, 14, 72, 1, t('Kecil', 'Small'), t('Besar', 'Large'));
      }
      inner += swatches('ic', it.c, true) + range('iw', it.w, 4, 120, 1, t('Kecil', 'Small'), t('Besar', 'Large')) + range('irr', it.r, -180, 180, 1, '-180', '180') +
        '<div class="row"><button type="button" class="btn btn--glass btn--sm" data-act="up">' + t('Ke depan', 'Forward') + '</button><button type="button" class="btn btn--glass btn--sm" data-act="down">' + t('Ke belakang', 'Back') + '</button>' +
        '<button type="button" class="btn btn--glass btn--sm" data-act="dup">' + t('Gandakan', 'Duplicate') + '</button><button type="button" class="btn btn--warn btn--sm" data-act="del">' + t('Hapus', 'Delete') + '</button></div>';
      out += rw('stiker', t('Stiker terpilih: warna, ukuran, putar', 'Chosen sticker: colour, size, turn'), inner);
    }
    var tiles = elCat === 'teks' ? ND.TEXTS.map(function (x) { return '<button type="button" class="tile" data-act="addtxt" data-v="' + x[0] + '"><span class="tile__art"><span class="tile__txt" style="font-size:' + Math.min(1.5, x[3] / 18) + 'rem">Aa</span></span>' + t(x[1], x[2]) + '</button>'; }).join('')
      : ND.ELEMENTS.concat(ND.PAINTED).filter(function (e) { return e[1] === elCat; }).map(elTile).join('');
    out += rw('stiker', t('Tambah stiker', 'Add a sticker'), '<div class="scr" data-k="ecat">' + cats.map(function (c) { return chip('ecat', c[0], t(c[1], c[2]), elCat === c[0]); }).join('') + '</div><div class="tiles">' + tiles + '</div>');
    out += '<p class="note">' + t('Stiker muncul di bagian yang sedang tampil. Sentuh untuk memilih, lalu geser; dua jari (atau roda tetikus) untuk mengubah ukuran. Garis merah muda menandai bagian yang dijaga.', 'A sticker lands in the part on screen. Tap to choose it, then drag; two fingers (or the mouse wheel) resize it. Pink outlines mark the guarded parts.') + '</p>';
    return [t(HEAD.stiker[0][0], HEAD.stiker[0][1]), t(HEAD.stiker[1][0], HEAD.stiker[1][1]), out];
  }
  function add(kind, v) {
    var m = page && page.NAWALA_EDIT ? page.NAWALA_EDIT.middle(wide.matches ? .5 : .26) : { b: 'salam', y: 50 };
    var e = kind === 'el' ? ND.elById(v) : null;
    var it = { id: uid(), b: m.b, k: kind, x: 50, y: Math.round(m.y), w: kind === 'txt' ? 80 : e && e[1] === 'pembatas' ? 70 : e && e[1] === 'sudut' ? 32 : 38, r: 0, c: '', z: 1, s: v };
    if (kind === 'txt') { it.t = v === 'judul' ? t('Judul baru', 'A new title') : v === 'kutipan' ? t('Tulis kutipan kalian di sini', 'Write your quote here') : t('Catatan kecil', 'A small note'); it.fs = (ND.TEXTS.filter(function (x) { return x[0] === v; })[0] || [0, 0, 0, 24])[3]; }
    design.items.push(it);
    sel = { kind: 'item', id: it.id };
    design.at = nowIso(); design = ND.norm(design); apply();
    /* a new sticker never lands on a guarded part: it steps down until it is clear */
    var o = itemBy(it.id), n = 0;
    while (o && page.NAWALA_EDIT.blocked(it.id) && n++ < 8) { o.y = Math.min(96, o.y + 9); o.x = n % 2 ? 22 : 78; apply(); }
    commit();
  }

  /* ---------- Pembuka ---------- */
  var OPEN_SAY = { nawala: ['Nawala terbang membawa surat bernama tamu, lalu membukanya.', 'Nawala flies in with the letter bearing the guest\'s name, then opens it.'],
    monogram: ['Segel lilin dengan inisial kalian, terbelah saat tamu membuka.', 'A wax seal with your initials, breaking open as the guest taps.'],
    foto: ['Foto sampul kalian dalam bingkai lengkung, dengan nama tamu.', 'Your cover photo in an arched frame, with the guest\'s name.'],
    tema: ['Bunga tema membingkai inisial kalian, lalu terbuka ke samping.', 'The theme\'s flowers frame your initials, then part to the sides.'] };
  function pPembuka() {
    var ini = names().split(' & ').map(function (x) { return x.charAt(0); }).join('&amp;');
    var out = rw('pembuka', t('Pembuka', 'Opening'), '<div class="scr" data-k="open">' + ND.OPENINGS.map(function (o) {
      var dis = o[0] === 'nawala' && !design.nawala;
      return '<button type="button" class="tile" style="width:112px" data-act="open" data-v="' + o[0] + '" aria-pressed="' + (design.opening === o[0]) + '"' + (dis ? ' disabled' : '') + '><span class="tile__art">' +
        (o[0] === 'nawala' ? '<img class="tile__img" src="../assets/img/nawala-hero-480.webp" alt="">' : o[0] === 'monogram' ? '<span class="tile__txt" style="width:54px;height:54px;border-radius:50%;display:grid;place-items:center;background:var(--ink);color:#fff;font-size:1rem">' + ini + '</span>'
          : o[0] === 'foto' ? '<span class="fx fx--lengkung"></span>' : '<span class="tile__m" style="--m:url(../assets/el/sudut-bunga.svg)"></span>') + '</span>' + t(o[1], o[2]) + '</button>';
    }).join('') + '</div><p class="note">' + t(OPEN_SAY[design.opening][0], OPEN_SAY[design.opening][1]) + '</p>' +
      '<div class="row"><button type="button" class="btn btn--glass btn--sm" data-act="peek">' + t('Lihat pembukanya', 'Watch the opening') + '</button></div>');
    out += rw('pembuka', t('Nawala ikut di sepanjang undangan', 'Nawala travels through the invitation'), '<div class="sw-tog"><span class="small muted">' + t('Bila dimatikan, Nawala kecil tetap ada di akhir undangan.', 'When off, a small Nawala still stays at the end.') + '</span>' +
      '<button type="button" class="tog" data-act="nawala" data-v="' + (design.nawala ? '0' : '1') + '" aria-pressed="' + design.nawala + '">' + (design.nawala ? t('Ikut', 'On') : t('Tidak ikut', 'Off')) + '</button></div>');
    out += '<p class="note note--pink">' + (team() ? t('Perubahan desain tampil untuk tamu setelah undangan diterbitkan di konsol tim.', 'Design changes reach guests once the invitation is published in the team console.')
      : t('Semua perubahan diperiksa tim Nawala lebih dulu. Tamu melihatnya setelah tim menyetujui dan menerbitkannya.', 'Every change is checked by the Nawala team first. Guests see it once the team has approved and published it.')) + '</p>';
    return [t(HEAD.pembuka[0][0], HEAD.pembuka[0][1]), t(HEAD.pembuka[1][0], HEAD.pembuka[1][1]), out];
  }
  function peek() {
    if (!page || !page.NAWALA_PAGE) return;
    var root = page.document.documentElement, gate = page.document.getElementById('gate');
    root.classList.add('is-peek'); page.NAWALA_PAGE.replay();
    var iv = setInterval(function () { if (gate.hidden || !root.classList.contains('is-peek')) { clearInterval(iv); root.classList.remove('is-peek'); } }, 300);
    if (!wide.matches) $('#side').classList.add('is-shut');
    toast(t('Ketuk "Buka undangan" di pratinjau.', 'Tap "Open the invitation" in the preview.'));
  }

  /* ---------- Hak: the team sets what this couple may change ---------- */
  function pHak() {
    var out = '<p class="note">' + t('Tingkat pesanan ini: ', 'This order\'s level: ') + '<b>' + LEVELS[level - 1][K.lang() === 'en' ? 1 : 0] + '</b>. ' + t('Tiap bagian mengikuti tingkat itu, kecuali yang diubah di sini.', 'Each part follows that level, unless it is changed here.') + '</p><div>';
    ND.CAPS.forEach(function (c) {
      var dflt = level >= c[3], set = typeof design.hak[c[0]] === 'boolean', open = set ? design.hak[c[0]] : dflt;
      out += '<div class="hk"><div><b>' + t(c[1], c[2]) + '</b><span>' + t('Terbuka mulai tingkat ', 'Opens from the ') + LEVELS[c[3] - 1][K.lang() === 'en' ? 1 : 0] + t('', ' level') +
        (set ? t('. Diubah untuk pesanan ini.', '. Changed for this order.') : '') + '</span></div>' +
        '<button type="button" class="tog" data-act="hak" data-v="' + c[0] + '" aria-pressed="' + open + '">' + (open ? t('Terbuka', 'Open') : t('Terkunci', 'Locked')) + '</button></div>';
    });
    out += '</div><div class="row"><button type="button" class="btn btn--glass btn--sm" data-act="hakreset"' + (Object.keys(design.hak).length ? '' : ' disabled') + '>' + t('Ikuti tingkat lagi', 'Follow the level again') + '</button></div>' +
      '<p class="small muted">' + t('Tim selalu bisa mengubah semuanya. Kunci ini berlaku untuk pasangan.', 'The team can always change everything. These locks apply to the couple.') + '</p>';
    return [t(HEAD.hak[0][0], HEAD.hak[0][1]), t(HEAD.hak[1][0], HEAD.hak[1][1]), out];
  }

  /* ---------- Drawing the panel (rows keep their sideways scroll when it is drawn again) ---------- */
  function panel() {
    var body = $('#body'), keep = {}, top = body.scrollTop, same = body.getAttribute('data-for') === mode + '|' + (sel ? sel.kind + sel.id : '');
    $$('.scr[data-k]', body).forEach(function (s) { keep[s.getAttribute('data-k')] = s.scrollLeft; });
    var r = ({ sentuh: pSentuh, gaya: pGaya, stiker: pStiker, pembuka: pPembuka, hak: pHak }[mode] || pSentuh)();
    $('#sh').textContent = r[0]; $('#sm').textContent = r[1]; body.innerHTML = r[2];
    body.setAttribute('data-for', mode + '|' + (sel ? sel.kind + sel.id : ''));
    if (same) { body.scrollTop = top; $$('.scr[data-k]', body).forEach(function (s) { var v = keep[s.getAttribute('data-k')]; if (v) s.scrollLeft = v; }); }
    else {
      [body, $('.side__head')].forEach(function (el) { el.classList.remove('is-new'); void el.offsetWidth; el.classList.add('is-new'); });
      body.scrollTop = 0;
      $$('.scr[data-k]', body).forEach(function (s) { var on = s.querySelector('[aria-pressed="true"]'); if (on) s.scrollLeft = Math.max(0, on.offsetLeft - s.offsetLeft - 40); });
    }
  }

  /* ---------- Photos: one upload, kept whole; the crop is only numbers in the design ---------- */
  function dataUrl(file, max) {
    return createImageBitmap(file).then(function (img) {
      var s = Math.min(1, max / Math.max(img.width, img.height)), c = document.createElement('canvas');
      c.width = Math.round(img.width * s); c.height = Math.round(img.height * s);
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      return c.toDataURL('image/jpeg', .82);
    });
  }
  function photoIn(file, slot) {
    if (!file || !/^image\//.test(file.type)) return;
    toast(t('Menyiapkan foto...', 'Preparing the photo...'));
    var done = function () { delete design.photos[slot]; commit(false); reload(); toast(t('Foto terpasang. Sentuh foto itu, lalu geser untuk mengaturnya.', 'Photo in place. Tap it, then drag to adjust it.')); };
    if (SAMPLE) {
      return dataUrl(file, 1000).then(function (u) {
        var set = {}; try { set = JSON.parse(sessionStorage.getItem(IMA) || '{}') || {}; } catch (e) {}
        set.photos = set.photos || {}; set.photos[slot] = u;
        try { sessionStorage.setItem(IMA, JSON.stringify(set)); } catch (e) { return toast(t('Foto terlalu besar untuk disimpan di tab ini. Coba foto lain.', 'This photo is too large to keep in this tab. Try another one.')); }
        done();
      }, function () { toast(t('Foto ini tidak bisa dibaca. Coba JPG atau PNG.', 'This photo could not be read. Try a JPG or PNG.')); });
    }
    B.shrink(file, slot === 'cover' ? 1400 : 1000, .82).then(function (blob) {
      return DB.put(who, 'inv', order.slug, [{ blob: blob }]).then(function (base) {
        order.draft.photos[slot] = base + (blob.type === 'image/jpeg' ? '.jpg' : '.webp');
        saveDraft(true); done();
      });
    }).catch(function () { toast(t('Foto belum terkirim. Periksa sambungan, lalu coba lagi.', 'The photo was not sent. Check the connection and try again.')); });
  }
  /* the sample keeps a changed date beside the Imagination Room's set, which the page reads before it draws */
  function sampleDate(v) {
    var set = {}; try { set = JSON.parse(sessionStorage.getItem(IMA) || '{}') || {}; } catch (e) {}
    set.date = v; try { sessionStorage.setItem(IMA, JSON.stringify(set)); } catch (e) {}
  }

  /* ---------- One listener for the whole panel ---------- */
  function act(el, finished) {
    var a = el.getAttribute('data-act'), v = el.value !== undefined && el.tagName !== 'BUTTON' ? el.value : el.getAttribute('data-v');
    var it = sel && sel.kind === 'item' ? itemBy(sel.id) : null, slot = sel && sel.kind === 'photo' ? sel.id : '', b, i;
    switch (a) {
      case 'jump': if (page && page.NAWALA_EDIT) page.NAWALA_EDIT.scrollTo(v); if (!wide.matches) $('#side').classList.add('is-shut'); return;
      case 'scope': scope = v; return panel();
      case 'fcat': fontCat[el.getAttribute('data-role')] = v; return panel();
      case 'font':
        var role = el.getAttribute('data-role');
        if (scope === 'ini' && boxId()) { b = boxTarget(); if (v) b[role === 'judul' ? 'fj' : 'ft'] = v; else delete b[role === 'judul' ? 'fj' : 'ft']; }
        else design.font[role] = v;
        return commit();
      case 'fz': design.font.z = +v; if (finished) commit(); else apply(); return;
      case 'boxc': b = boxTarget(); if (v) b.c = v; else delete b.c; if (finished || el.tagName === 'BUTTON') commit(); else apply(); return;
      case 'boxa': boxTarget().a = +v; if (finished) commit(); else apply(); return;
      case 'boxr': boxTarget().r = +v; if (finished) commit(); else apply(); return;
      case 'word':
        if (!sel || sel.kind !== 'word') return;
        var k = sel.id.split('.'), D = invite(); v = String(v).replace(/[<>]/g, '');
        if (D[k[0]]) D[k[0]][k[1]] = v || ' ';
        if (page.NAWALA_PAGE.refill) page.NAWALA_PAGE.refill();
        if (SAMPLE) { kata[sel.id] = v; keepSample(); } else { order.draft[k[0]][k[1]] = v; saveDraft(); }
        return;
      case 'wdate':
        if (!finished || !/^\d{4}-\d{2}-\d{2}$/.test(v)) return;
        if (SAMPLE) sampleDate(v); else { order.draft.date = v; saveDraft(true); }
        return reload();
      case 'pick': var f = $('#file'); if (f) f.click(); return;
      case 'pcentre': if (slot) { var q = photoOf(slot); q.x = 50; q.y = 50; q.z = 1; q.r = 0; commit(); } return;
      case 'pz': if (slot) { photoOf(slot).z = v / 100; if (finished) commit(false); else apply(); } return;
      case 'ps': if (slot) { photoOf(slot).s = v / 100; if (finished) commit(false); else apply(); } return;
      case 'pal': if (slot) { photoOf(slot).al = v; commit(); } return;
      case 'frame': if (scope === 'ini' && slot) { if (v) design.frames[slot] = v; else delete design.frames[slot]; } else { design.frame = v; design.frames = {}; } return commit();
      case 'back': design.back = v; return commit();
      case 'look': if (v !== 'asli' && !can('gaya')) return deny('gaya'); design = ND.wear(design, v); return commit();
      case 'cw': design.pal = v; return commit();
      case 'surprise': return surprise();
      case 'tema':
        tema = v; keepSample();
        if (page && page.NAWALA_PAGE) { page.NAWALA_PAGE.setTheme(v); apply(); }
        toast(t('Tema berganti. Nama, foto, huruf, dan stiker kalian ikut pindah.', 'Theme changed. Your names, photos, fonts and stickers moved along.'));
        return panel();
      case 'askreset': confirmReset = true; return panel();
      case 'noreset': confirmReset = false; return panel();
      case 'reset': confirmReset = false; var hk = design.hak; design = ND.norm({}); design.hak = hk; sel = null; commit(); return toast(t('Desain kembali seperti aslinya.', 'The design is back as it was made.'));
      case 'ecat': elCat = v; return panel();
      case 'add': return add('el', v);
      case 'addtxt': return add('txt', v);
      case 'ic': if (it) { it.c = v; if (finished || el.tagName === 'BUTTON') commit(); else apply(); } return;
      case 'iw': case 'irr': case 'fs':
        if (!it) return;
        var key = a === 'iw' ? 'w' : a === 'irr' ? 'r' : 'fs';
        if (slide0 === null) slide0 = it[key];
        it[key] = +v; apply();
        if (finished) {
          if (page.NAWALA_EDIT.blocked(it.id)) { it[key] = slide0; apply(); toast(t('Sebesar itu stiker menutupi bagian yang dijaga. Ukurannya dikembalikan.', 'At that size the sticker covers a guarded part. Its size went back.')); }
          slide0 = null; commit();
        }
        return;
      case 'txt': if (it) { it.t = String(v).replace(/[<>]/g, '').slice(0, 160) || ' '; if (finished) commit(false); else apply(); } return;
      case 'txtf': if (it) { it.f = v; commit(false); } return;
      case 'up': if (it) { it.z = Math.min(9, it.z + 1); commit(false); } return;
      case 'down': if (it) { it.z = Math.max(0, it.z - 1); commit(false); } return;
      case 'dup': if (it) { var c = JSON.parse(JSON.stringify(it)); c.id = uid(); c.x = Math.min(110, it.x + 6); c.y = Math.min(110, it.y + 5); design.items.push(c); sel = { kind: 'item', id: c.id }; commit(); } return;
      case 'del': if (it) { for (i = 0; i < design.items.length; i++) if (design.items[i].id === it.id) { design.items.splice(i, 1); break; } sel = null; commit(); } return;
      case 'open': design.opening = v; return commit();
      case 'nawala': design.nawala = v === '1'; if (!design.nawala && design.opening === 'nawala') design.opening = 'monogram'; return commit();
      case 'peek': return peek();
      case 'hak':
        var cap = ND.CAPS.filter(function (x) { return x[0] === v; })[0], dflt = level >= cap[3], open = typeof design.hak[v] === 'boolean' ? design.hak[v] : dflt;
        if (!open === dflt) delete design.hak[v]; else design.hak[v] = !open;
        return commit();
      case 'hakreset': design.hak = {}; return commit();
    }
  }
  var bodyEl = $('#body');
  bodyEl.addEventListener('click', function (e) {
    var lk = e.target.closest('.rw.is-locked'); if (lk) return deny(lk.getAttribute('data-cap'));
    var dn = e.target.closest('[data-deny]'); if (dn) return deny(dn.getAttribute('data-deny'));
    var b = e.target.closest('button[data-act]'); if (b) act(b, true);
  });
  bodyEl.addEventListener('input', function (e) { var el = e.target; if (el.getAttribute && el.getAttribute('data-act') && el.tagName !== 'BUTTON' && el.tagName !== 'SELECT') act(el, false); });
  bodyEl.addEventListener('change', function (e) {
    var el = e.target;
    if (el.id === 'file') { if (sel && sel.kind === 'photo' && can('foto')) photoIn(el.files && el.files[0], sel.id); return; }
    if (el.getAttribute && el.getAttribute('data-act')) act(el, true);
  });

  /* ---------- The sample's strip: try it as the couple or the team, at each level ---------- */
  function demoBar() {
    function press() {
      $$('#demo-view [data-view]').forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-view') === view)); });
      $$('#demo-level [data-level]').forEach(function (b) { b.setAttribute('aria-pressed', String(+b.getAttribute('data-level') === level)); });
      $('#mode-hak').hidden = !team();
    }
    $('#demo-view').addEventListener('click', function (e) { var b = e.target.closest('[data-view]'); if (!b) return; view = b.getAttribute('data-view'); press(); setMode(view === 'tim' ? 'hak' : mode === 'hak' ? 'sentuh' : mode, true); });
    $('#demo-level').addEventListener('click', function (e) { var b = e.target.closest('[data-level]'); if (!b) return; level = +b.getAttribute('data-level'); keepSample(); press(); panel(); });
    press();
  }

  document.addEventListener('keydown', function (e) {
    /* inside the home page's demo box, Escape closes the box (as the other demos do) */
    if (e.key === 'Escape' && window.parent !== window && !/^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName || '')) { try { window.parent.postMessage('nawala-denah-close', location.origin); } catch (x) {} }
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && !/^(INPUT|TEXTAREA|SELECT)$/.test((e.target.tagName || ''))) { e.preventDefault(); (e.shiftKey ? $('#redo') : $('#undo')).click(); }
  });
  boot();
})();
