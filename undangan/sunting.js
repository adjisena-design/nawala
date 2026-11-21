/* The design editor (sunting.html). Loads one order, shows its invitation in a frame (dasar.html?preview=1&edit=1),
   and changes the order's design (draft.design, see assets/js/desain.js) with these tools: faces, text boxes, photo
   frames, added elements, the opening and Nawala. Each change is applied at once in the frame, kept in an undo list,
   and saved about a second later (room_design_save for the couple, team_design_save for the team; the sample saves
   nothing). Guests see a design only after the team publishes it in the console. */
(function () {
  'use strict';
  var K = window.K, DB = window.NAWALA_DB, B = window.NAWALA_BUILDER, ND = window.NAWALA_DESIGN, t = K.t, esc = K.esc, $ = K.$, $$ = K.$$;
  var P = {}; try { new URLSearchParams(location.search).forEach(function (v, k) { P[k] = v; }); } catch (e) {}
  var AS = P.as === 'tim' ? 'tim' : P.as === 'contoh' ? 'contoh' : 'ruang', SLUG = P.u || '';
  var who = '', order = null, rows = [], design = ND.norm({}), hist = [], pos = -1, sel = null, tab = '', scope = 'semua', fontRole = 'judul', elCat = 'pembatas', confirmReset = false;
  var page = null, pv = $('#pv'), wide = window.matchMedia('(min-width:900px)');

  /* ---------- Small helpers ---------- */
  function relabel() {
    $$('[data-en]').forEach(function (el) { if (!el.hasAttribute('data-id')) el.setAttribute('data-id', el.textContent); el.textContent = K.lang() === 'en' ? el.getAttribute('data-en') : el.getAttribute('data-id'); });
    $('#undo').setAttribute('aria-label', t('Urungkan', 'Undo')); $('#redo').setAttribute('aria-label', t('Ulangi', 'Redo'));
  }
  var toastTimer = 0;
  function toast(m, top) { var el = $('#toast'); el.textContent = m; el.classList.toggle('is-top', !!top); el.classList.add('is-on'); clearTimeout(toastTimer); toastTimer = setTimeout(function () { el.classList.remove('is-on'); }, 2800); }
  function stop(h, p, href, label) {
    $('#gate-h').textContent = h; $('#gate-p').textContent = p; $('#gate-a').href = href; $('#gate-a').textContent = label;
    $('#gate').hidden = false; document.body.classList.remove('is-loading');
  }
  function stored(k) { try { return sessionStorage.getItem(k) || localStorage.getItem(k) || ''; } catch (e) { return ''; } }
  function nowIso() { return new Date().toISOString(); }
  function uid() { return 'i' + Date.now().toString(36).slice(-6) + Math.floor(Math.random() * 36).toString(36); }
  /* the theme's own colours, read from the invitation itself */
  function palette() {
    var out = { paper: '#FFFDF8', main: '#16301F', accent: '#B8893C', soft: '#D9C7A0', wash: '#F1E7D2' };
    try {
      var cs = page.getComputedStyle(page.document.documentElement);
      ['paper', 'main', 'accent'].forEach(function (k) { var v = cs.getPropertyValue('--' + k).trim(); if (/^#[0-9a-f]{6}$/i.test(v)) out[k] = v; });
      var s = cs.getPropertyValue('--accent-soft').trim(), w = cs.getPropertyValue('--accent-wash').trim();
      if (/^#[0-9a-f]{6}$/i.test(s)) out.soft = s; if (/^#[0-9a-f]{6}$/i.test(w)) out.wash = w;
    } catch (e) {}
    return out;
  }

  /* ---------- Loading the order ---------- */
  function boot() {
    relabel();
    var back = $('#back');
    if (AS === 'contoh') {
      back.href = 'dasar.html?tema=' + encodeURIComponent(P.tema || 'putih-klasik');
      $('#who').textContent = t('Contoh, tidak disimpan', 'Sample, nothing is saved');
      try { design = ND.norm(JSON.parse(sessionStorage.getItem('nawala-desain-contoh') || 'null')); } catch (e) {}
      return show('dasar.html?edit=1&tema=' + encodeURIComponent(P.tema || 'putih-klasik'));
    }
    if (AS === 'tim') {
      back.href = '../tim/#undangan';
      who = stored('nawala-tim');
      if (!who) return stop(t('Masuk dulu ke konsol tim', 'Log in to the team console first'), t('Editor dibuka dari pesanan di konsol tim.', 'The editor opens from an order in the team console.'), '../tim/', t('Buka konsol tim', 'Open the team console'));
      return DB.rpc('team_data', { t: who }).then(function (d) {
        if (!d || d.denied) return stop(t('Token tidak berlaku', 'This token no longer works'), t('Masuk lagi di konsol tim, lalu buka editor dari pesanan.', 'Log in again in the team console, then open the editor from the order.'), '../tim/', t('Buka konsol tim', 'Open the team console'));
        rows = d.themes || [];
        order = (d.invitations || []).filter(function (o) { return o.slug === SLUG; })[0];
        go();
      }, offline);
    }
    back.href = '../ruang/#undangan';
    who = stored('nawala-code');
    if (!who) return stop(t('Masuk dulu ke ruang pasangan', 'Open your room first'), t('Editor dibuka dari halaman undangan di ruang kalian.', 'The editor opens from the invitation page in your room.'), '../ruang/', t('Buka ruang pasangan', 'Open your room'));
    Promise.all([DB.rpc('room_open', { p_code: who }), DB.rpc('site_themes', {})]).then(function (r) {
      if (!r[0]) return stop(t('Kode tidak berlaku', 'This code no longer works'), t('Masa berlaku kode habis. Hubungi kami lewat WhatsApp dan kami perpanjang.', 'The code has reached its end date. Tell us on WhatsApp and we will extend it.'), '../ruang/', t('Buka ruang pasangan', 'Open your room'));
      order = r[0].order; rows = (r[1] || []).map(function (x) { return { slug: x.slug, tier: x.tier, kit: x.kit }; });
      go();
    }, offline);
  }
  function offline() { stop(t('Database Nawala belum terhubung', 'The Nawala database is out of reach'), t('Periksa sambungan, lalu muat ulang halaman ini.', 'Check the connection, then reload this page.'), location.href, t('Muat ulang', 'Reload')); }
  function go() {
    if (!order) return stop(t('Pesanan tidak ditemukan', 'Order not found'), t('Buka editor dari pesanan yang masih berjalan.', 'Open the editor from an order that is still running.'), $('#back').href, t('Kembali', 'Back'));
    var r = B.route(order.theme, rows);
    if (r.route !== 'dasar') return stop(t('Editor menyusul untuk tema ini', 'The editor comes later for this theme'), t('Editor desain tersedia untuk tema Dasar lebih dulu. Untuk tema ini, tim Nawala yang menata desainnya bersama kalian.', 'The design editor is ready for Dasar themes first. For this theme, the Nawala team arranges the design with you.'), $('#back').href, t('Kembali', 'Back'));
    $('#who').textContent = order.couple + (AS === 'tim' ? ' (' + order.slug + ')' : '');
    design = ND.norm((order.draft || {}).design);
    var c = B.compile(order.draft, order, rows, true);
    c.data.design = design;
    try { localStorage.setItem('nawala-preview', JSON.stringify(c.data)); } catch (e) {}
    show('dasar.html?preview=1&edit=1&to=' + encodeURIComponent(t('Tamu undangan', 'Our guest')));
  }
  function show(src) {
    pv.addEventListener('load', function first() {
      pv.removeEventListener('load', first);
      page = pv.contentWindow;
      apply(); remember(true);
      document.body.classList.remove('is-loading');
      setState(AS === 'contoh' ? t('Contoh', 'Sample') : t('Tersimpan', 'Saved'));
      if (wide.matches) open('huruf');
    });
    pv.src = src;
  }

  /* ---------- Applying, remembering, saving ---------- */
  function apply() {
    if (!page || !page.NAWALA_DESIGN) return;
    page.NAWALA_DESIGN.apply(design);
    if (page.NAWALA_EDIT) page.NAWALA_EDIT.reselect(sel);
  }
  function remember(first) {
    var s = JSON.stringify(design);
    if (!first && hist[pos] === s) return;
    hist = hist.slice(0, pos + 1); hist.push(s); if (hist.length > 80) hist.shift(); pos = hist.length - 1;
    buttons();
  }
  function buttons() { $('#undo').disabled = pos <= 0; $('#redo').disabled = pos >= hist.length - 1; }
  /* a finished change: shown, remembered, saved */
  function commit(redraw) {
    design.at = nowIso();
    design = ND.norm(design);
    apply(); remember(); save();
    if (redraw !== false) panel();
  }
  var saveTimer = 0;
  function setState(s) { $('#state').textContent = s; }
  function save() {
    if (AS === 'contoh') { try { sessionStorage.setItem('nawala-desain-contoh', JSON.stringify(design)); } catch (e) {} return; }
    setState(t('Menyimpan...', 'Saving...'));
    clearTimeout(saveTimer);
    saveTimer = setTimeout(function () {
      var call = AS === 'tim' ? DB.rpc('team_design_save', { t: who, p_slug: SLUG, p_design: design }) : DB.rpc('room_design_save', { p_code: who, p_design: design });
      call.then(function (ok) {
        if (ok === false || ok === null) { setState(t('Belum tersimpan', 'Not saved')); toast(AS === 'tim' ? t('Belum tersimpan. Periksa token Anda di konsol tim.', 'Not saved. Check your token in the team console.') : t('Belum tersimpan. Kode kalian mungkin sudah habis masa berlakunya.', 'Not saved. Your code may have reached its end date.')); return; }
        setState(t('Tersimpan, menunggu tim', 'Saved, waiting for the team'));
      }, function () { setState(t('Belum tersimpan', 'Not saved')); toast(t('Belum tersimpan ke Nawala. Kami coba lagi pada perubahan berikutnya.', 'Not saved to Nawala yet. We try again with the next change.')); });
    }, 900);
  }
  $('#undo').addEventListener('click', function () { if (pos > 0) { pos--; design = ND.norm(JSON.parse(hist[pos])); design.at = nowIso(); apply(); save(); buttons(); panel(); } });
  $('#redo').addEventListener('click', function () { if (pos < hist.length - 1) { pos++; design = ND.norm(JSON.parse(hist[pos])); design.at = nowIso(); apply(); save(); buttons(); panel(); } });

  /* ---------- What the preview tells us (undangan/sunting-dalam.js) ---------- */
  function itemBy(id) { for (var i = 0; i < design.items.length; i++) if (design.items[i].id === id) return design.items[i]; return null; }
  function photoOf(slot) { return design.photos[slot] || (design.photos[slot] = { x: 50, y: 50, z: 1, r: 0, s: 1, al: 'c' }); }
  window.NAWALA_EDITOR = {
    select: function (s) {
      sel = s; document.body.classList.toggle('is-chosen', !!s);
      if (!s) { if (tab === 'item') open(wide.matches ? 'huruf' : ''); else panel(); return; }
      if (s.kind === 'item') open('item');
      else if (s.kind === 'photo') { scope = 'semua'; open('foto'); }
      else { scope = 'semua'; open(tab === 'huruf' ? 'huruf' : 'kotak'); }
    },
    value: function (s) { if (s.kind === 'item') { var it = itemBy(s.id); return it ? { x: it.x, y: it.y, w: it.w, r: it.r } : { x: 50, y: 50, w: 40, r: 0 }; } var p = photoOf(s.id); return { x: p.x, y: p.y, z: p.z }; },
    live: function (s, out) {
      var o = s.kind === 'item' ? itemBy(s.id) : photoOf(s.id); if (!o) return;
      Object.keys(out).forEach(function (k) { o[k] = out[k]; });
      apply();
    },
    done: function () { commit(); },
    blocks: function () { return ND.BLOCKS; }
  };

  /* ---------- The sheet ---------- */
  var TITLES = { huruf: ['Huruf', 'Fonts'], kotak: ['Kotak teks', 'Text boxes'], foto: ['Foto dan bingkai', 'Photos and frames'], elemen: ['Elemen', 'Elements'],
    item: ['Elemen terpilih', 'Chosen element'], pembuka: ['Pembuka', 'Opening'], lain: ['Lainnya', 'More'] };
  function open(name) {
    if (!wide.matches && name && name === tab && name !== 'item') name = '';
    tab = name; confirmReset = false;
    $$('#tabs [data-tab]').forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-tab') === tab)); });
    $('#sheet').classList.toggle('is-open', !!tab);
    if (tab) panel();
  }
  $('#tabs').addEventListener('click', function (e) { var b = e.target.closest('[data-tab]'); if (b) open(b.getAttribute('data-tab')); });
  $('#sheet-x').addEventListener('click', function () { open(''); });
  wide.addEventListener && wide.addEventListener('change', function () { if (wide.matches && !tab) open('huruf'); });

  function chip(act, v, label, on, dis) { return '<button type="button" class="chip" data-act="' + act + '" data-v="' + esc(v) + '" aria-pressed="' + !!on + '"' + (dis ? ' disabled' : '') + '>' + label + '</button>'; }
  function range(act, v, lo, hi, step, l1, l2) { return '<div class="range"><span>' + l1 + '</span><input type="range" data-act="' + act + '" min="' + lo + '" max="' + hi + '" step="' + (step || 1) + '" value="' + v + '"><span>' + l2 + '</span></div>'; }
  function scopeChips(kindLabel) {
    var can = sel && ((tab === 'foto' && sel.kind === 'photo') || ((tab === 'kotak' || tab === 'huruf') && sel.kind === 'box'));
    if (!can) scope = 'semua';
    return '<div><span class="lbl">' + t('Berlaku untuk', 'Applies to') + '</span><div class="scope">' + chip('scope', 'semua', kindLabel[0], scope === 'semua') + chip('scope', 'ini', kindLabel[1], scope === 'ini', !can) + '</div>' +
      (can ? '' : '<p class="small muted" style="margin-top:.4rem">' + t('Sentuh satu ' + kindLabel[2] + ' di undangan untuk mengaturnya sendiri.', 'Tap one ' + kindLabel[3] + ' in the invitation to set it on its own.') + '</p>') + '</div>';
  }
  function swatches(act, cur, withDefault) {
    var p = palette(), list = [[p.paper, t('Kertas tema', 'Theme paper')], ['#FFFFFF', t('Putih', 'White')], [p.wash, t('Warna tema muda', 'Light theme colour')], [p.soft, t('Warna tema', 'Theme colour')],
      [p.accent, t('Aksen tema', 'Theme accent')], [p.main, t('Warna utama', 'Main colour')], ['#1D241F', t('Hitam lembut', 'Soft black')]];
    return '<div class="sw">' + (withDefault ? '<button type="button" data-act="' + act + '" data-v="" aria-pressed="' + !cur + '" aria-label="' + t('Bawaan tema', 'Theme default') + '" style="background:linear-gradient(135deg,' + p.paper + ' 50%,' + p.accent + ' 50%)"></button>' : '') +
      list.map(function (c) { return '<button type="button" data-act="' + act + '" data-v="' + c[0] + '" aria-pressed="' + (cur === c[0]) + '" aria-label="' + esc(c[1]) + '" style="background:' + c[0] + '"></button>'; }).join('') +
      '<label aria-label="' + t('Warna lain', 'Another colour') + '"><input type="color" data-act="' + act + '" value="' + (cur || p.paper) + '"></label></div>';
  }
  function panel() {
    if (!tab) return;
    var body = $('#body'), T = TITLES[tab]; $('#sheet-h').textContent = t(T[0], T[1]);
    body.innerHTML = ({ huruf: pHuruf, kotak: pKotak, foto: pFoto, elemen: pElemen, item: pItem, pembuka: pPembuka, lain: pLain }[tab])();
  }
  function boxTarget() { if (scope === 'ini' && sel && sel.kind === 'box') return design.boxes[sel.id] || (design.boxes[sel.id] = {}); return design.box; }

  /* ---------- Fonts ---------- */
  function names() { var D = order && order.draft || {}; var a = D.bride && D.bride.short, b = D.groom && D.groom.short; return (a || 'Laras') + ' & ' + (b || 'Bima'); }
  function pHuruf() {
    var b = boxTarget(), cur = scope === 'ini' ? (fontRole === 'judul' ? b.fj : b.ft) : design.font[fontRole];
    var out = scopeChips([t('Semua tulisan', 'All writing'), t('Kotak ini saja', 'This box only'), 'kotak', 'box']) +
      '<div><span class="lbl">' + t('Yang diubah', 'What changes') + '</span><div class="chips">' + chip('role', 'judul', t('Nama dan judul', 'Names and headings'), fontRole === 'judul') + chip('role', 'teks', t('Teks bacaan', 'Running text'), fontRole === 'teks') + '</div></div>';
    var sample = fontRole === 'judul' ? names() : t('Dengan penuh syukur', 'With grateful hearts');
    out += '<div class="fonts"><button type="button" data-act="font" data-v="" aria-pressed="' + !cur + '"><b style="font-family:var(--display)">' + esc(sample) + '</b><span>' + t('Bawaan tema', 'Theme default') + '</span></button>';
    ND.FONT_CATS.forEach(function (c) {
      if (fontRole === 'teks' && c[0] === 'script') return;
      out += '<h3>' + t(c[1], c[2]) + '</h3>';
      ND.FONTS.forEach(function (f) {
        if (f[2] !== c[0]) return;
        ND.loadFont(f[0]);
        out += '<button type="button" data-act="font" data-v="' + f[0] + '" aria-pressed="' + (cur === f[0]) + '"><b style="font-family:' + esc(ND.face(f[0])) + '">' + esc(sample) + '</b><span>' + esc(f[1]) + '</span></button>';
      });
    });
    return out + '</div><p class="small muted">' + t('Huruf tulisan tangan hanya untuk nama dan judul, supaya teks bacaan tetap mudah dibaca.', 'Script faces are for names and headings only, so running text stays easy to read.') + '</p>';
  }

  /* ---------- Text boxes ---------- */
  function pKotak() {
    var b = boxTarget(), a = b.a !== undefined ? b.a : (scope === 'ini' && design.box.a !== undefined ? design.box.a : 100), r = b.r !== undefined ? b.r : (scope === 'ini' && design.box.r !== undefined ? design.box.r : 28);
    return scopeChips([t('Semua kotak', 'All boxes'), t('Kotak ini saja', 'This box only'), 'kotak', 'box']) +
      '<div><span class="lbl">' + t('Warna kotak', 'Box colour') + '</span>' + swatches('boxc', b.c || '', true) + '</div>' +
      '<div><span class="lbl">' + t('Kepadatan', 'Solidity') + ' <span class="muted" id="a-say">' + a + '%</span></span>' + range('boxa', a, 0, 100, 5, t('Bening', 'Clear'), t('Padat', 'Solid')) + '</div>' +
      '<div><span class="lbl">' + t('Sudut', 'Corners') + '</span>' + range('boxr', r, 0, 40, 2, t('Tegas', 'Square'), t('Bulat', 'Round')) + '</div>' +
      '<p class="note">' + t('Kotak yang bening membuat tulisan diberi bayangan halus agar tetap terbaca di atas gambar.', 'A clear box gives the writing a soft shadow so it still reads over the picture.') + '</p>' +
      '<div class="row">' + (scope === 'ini' ? '<button type="button" class="btn btn--line btn--sm" data-act="boxsame">' + t('Samakan dengan kotak lain', 'Match the other boxes') + '</button>' : '<button type="button" class="btn btn--line btn--sm" data-act="boxreset">' + t('Kembali ke bawaan tema', 'Back to the theme default') + '</button>') + '</div>';
  }

  /* ---------- Photos and frames ---------- */
  var SLOTS = { bride: ['Foto mempelai wanita', 'The bride\'s photo'], groom: ['Foto mempelai pria', 'The groom\'s photo'], cover: ['Foto sampul', 'The cover photo'] };
  function pFoto() {
    var one = scope === 'ini' && sel && sel.kind === 'photo', slot = sel && sel.kind === 'photo' ? sel.id : '';
    var cur = one ? (design.frames[slot] || '') : design.frame;
    var out = scopeChips([t('Semua foto', 'All photos'), t('Foto ini saja', 'This photo only'), 'foto', 'photo']) +
      '<div><span class="lbl">' + t('Bingkai', 'Frame') + '</span><div class="tiles">' +
      '<button type="button" class="tile" data-act="frame" data-v="" aria-pressed="' + !cur + '"><span class="tile__art"><span class="fx" style="opacity:.55"></span></span>' + (one ? t('Ikut semua', 'Same as all') : t('Bawaan tema', 'Theme default')) + '</button>' +
      ND.FRAMES.map(function (f) { return '<button type="button" class="tile" data-act="frame" data-v="' + f[0] + '" aria-pressed="' + (cur === f[0]) + '"><span class="tile__art"><span class="fx fx--' + f[0] + '"></span></span>' + t(f[1], f[2]) + '</button>'; }).join('') + '</div></div>' +
      '<div><span class="lbl">' + t('Alas di balik foto', 'Backing behind the photo') + '</span><div class="chips">' + chip('back', 'kertas', t('Kertas', 'Paper'), design.back === 'kertas') + chip('back', 'aksen', t('Warna tema', 'Theme colour'), design.back === 'aksen') + chip('back', 'tanpa', t('Tanpa alas', 'None'), design.back === 'tanpa') + '</div>' +
      '<p class="small muted" style="margin-top:.4rem">' + t('Alas menjaga foto, apalagi foto berlatar transparan, tetap jelas di atas gambar tema.', 'The backing keeps the photo, especially one with a transparent background, clear over the theme\'s picture.') + '</p></div>';
    if (slot) {
      var p = photoOf(slot);
      out += '<h3 style="font-size:1.1rem;margin-top:1.2rem">' + t(SLOTS[slot][0], SLOTS[slot][1]) + '</h3>' +
        '<p class="note note--sun">' + t('Geser foto di undangan untuk mengatur bagian yang tampil. Dua jari untuk memperbesar.', 'Drag the photo in the invitation to choose what shows. Two fingers to zoom.') + '</p>' +
        '<div><span class="lbl">' + t('Ukuran bingkai', 'Frame size') + '</span>' + range('ps', Math.round(p.s * 100), 60, 130, 5, t('Kecil', 'Small'), t('Besar', 'Large')) + '</div>' +
        '<div><span class="lbl">' + t('Letak', 'Position') + '</span><div class="chips">' + chip('pal', 'l', t('Kiri', 'Left'), p.al === 'l') + chip('pal', 'c', t('Tengah', 'Centre'), p.al === 'c') + chip('pal', 'r', t('Kanan', 'Right'), p.al === 'r') + '</div></div>' +
        '<div><span class="lbl">' + t('Perbesar foto', 'Zoom the photo') + '</span>' + range('pz', Math.round(p.z * 100), 100, 300, 5, '1x', '3x') + '</div>' +
        '<div><span class="lbl">' + t('Putar foto', 'Turn the photo') + '</span>' + range('pr', p.r, -45, 45, 1, '-45', '45') + '</div>' +
        '<button type="button" class="btn btn--line btn--sm" data-act="preset">' + t('Atur ulang foto ini', 'Reset this photo') + '</button>';
    } else {
      out += '<p class="note">' + t('Sentuh sebuah foto di undangan untuk memotong, memperbesar, memutar, atau memindahkannya.', 'Tap a photo in the invitation to crop, zoom, turn or move it.') + '</p>';
    }
    return out + '<p class="small muted">' + t('Foto diunggah di Data undangan. Punya foto berlatar transparan (PNG)? Unggah saja; bingkai memberinya alas. Penghapus latar otomatis hanya untuk paket Eksklusif dan Kustom.', 'Photos are uploaded under Invitation details. Have a photo with a transparent background (PNG)? Upload it; the frame gives it a backing. Automatic background removal is only for the Exclusive and Custom packages.') + '</p>';
  }

  /* ---------- Elements ---------- */
  function elTile(e) {
    var painted = /\.webp$/.test(e[5] || '');
    return '<button type="button" class="tile" data-act="add" data-v="' + e[0] + '"><span class="tile__art">' +
      (painted ? '<img class="tile__img" src="' + ND.base() + 'el/' + e[0] + '.webp" alt="" loading="lazy">' : '<span class="tile__m" style="--m:url(' + ND.base() + 'el/' + e[0] + '.svg)"></span>') + '</span>' + esc(t(e[2], e[3])) + '</button>';
  }
  function pElemen() {
    var cats = ND.EL_CATS.filter(function (c) { return c[0] !== 'lukis' || ND.PAINTED.length; });
    var out = '<div class="chips">' + cats.map(function (c) { return chip('cat', c[0], t(c[1], c[2]), elCat === c[0]); }).join('') + '</div>';
    if (elCat === 'teks') {
      out += '<div class="tiles">' + ND.TEXTS.map(function (x) { return '<button type="button" class="tile" data-act="addtxt" data-v="' + x[0] + '"><span class="tile__art"><span class="tile__txt" style="font-size:' + Math.min(1.5, x[3] / 18) + 'rem">Aa</span></span>' + t(x[1], x[2]) + '</button>'; }).join('') + '</div>';
    } else {
      out += '<div class="tiles">' + ND.ELEMENTS.concat(ND.PAINTED).filter(function (e) { return e[1] === elCat; }).map(elTile).join('') + '</div>';
    }
    return out + '<p class="small muted">' + t('Elemen muncul di bagian yang sedang tampil. Sentuh untuk memilih, lalu geser; dua jari untuk mengubah ukuran dan memutar.', 'An element lands in the part on screen. Tap to choose it, then drag; two fingers to resize and turn.') + '</p>';
  }
  function add(kind, v) {
    var m = page && page.NAWALA_EDIT ? page.NAWALA_EDIT.middle(wide.matches ? .5 : .28) : { b: 'salam', y: 50 };   /* on a phone, above the sheet */
    var e = kind === 'el' ? ND.elById(v) : null;
    var it = { id: uid(), b: m.b, k: kind, x: 50, y: Math.round(m.y), w: kind === 'txt' ? 80 : e && e[1] === 'pembatas' ? 70 : e && e[1] === 'sudut' ? 32 : 38, r: 0, c: '', z: 1 };
    if (kind === 'el') it.s = v;
    else { it.s = v; it.t = v === 'judul' ? t('Judul baru', 'A new title') : v === 'kutipan' ? t('Tulis kutipan kalian di sini', 'Write your quote here') : t('Catatan kecil', 'A small note'); it.fs = (ND.TEXTS.filter(function (x) { return x[0] === v; })[0] || [0, 0, 0, 24])[3]; }
    design.items.push(it);
    sel = { kind: 'item', id: it.id };
    commit(false);
    if (page && page.NAWALA_EDIT) { page.NAWALA_EDIT.reselect(sel); }
    document.body.classList.add('is-chosen');
    open('item');
  }
  function pItem() {
    var it = sel && sel.kind === 'item' && itemBy(sel.id);
    if (!it) return '<p class="note">' + t('Elemen ini sudah tidak ada.', 'This element is gone.') + '</p>';
    var out = '';
    if (it.k === 'txt') {
      out += '<label><span class="lbl">' + t('Tulisan', 'Writing') + '</span><textarea data-act="txt" rows="2" maxlength="160" style="width:100%;min-height:60px;padding:.6rem .8rem;border-radius:14px;border:1.5px solid var(--line);background:#fff">' + esc(it.t) + '</textarea></label>' +
        '<label><span class="lbl">' + t('Huruf', 'Font') + '</span><select data-act="txtf" style="width:100%;min-height:48px;padding:0 .8rem;border-radius:14px;border:1.5px solid var(--line);background:#fff">' +
        '<option value="">' + t('Bawaan tema', 'Theme default') + '</option>' + ND.FONT_CATS.map(function (c) { return '<optgroup label="' + esc(t(c[1], c[2])) + '">' + ND.FONTS.filter(function (f) { return f[2] === c[0]; }).map(function (f) { return '<option value="' + f[0] + '"' + (it.f === f[0] ? ' selected' : '') + '>' + esc(f[1]) + '</option>'; }).join('') + '</optgroup>'; }).join('') + '</select></label>' +
        '<div><span class="lbl">' + t('Besar huruf', 'Text size') + '</span>' + range('fs', it.fs, 14, 72, 1, t('Kecil', 'Small'), t('Besar', 'Large')) + '</div>';
    }
    out += '<div><span class="lbl">' + t('Warna', 'Colour') + '</span>' + swatches('ic', it.c, true) + '</div>' +
      '<div><span class="lbl">' + t('Ukuran', 'Size') + '</span>' + range('iw', it.w, 4, 120, 1, t('Kecil', 'Small'), t('Besar', 'Large')) + '</div>' +
      '<div><span class="lbl">' + t('Putar', 'Turn') + '</span>' + range('irr', it.r, -180, 180, 1, '-180', '180') + '</div>' +
      '<div class="row"><button type="button" class="btn btn--line btn--sm" data-act="up">' + t('Ke depan', 'Bring forward') + '</button><button type="button" class="btn btn--line btn--sm" data-act="down">' + t('Ke belakang', 'Send back') + '</button>' +
      '<button type="button" class="btn btn--line btn--sm" data-act="dup">' + t('Gandakan', 'Duplicate') + '</button><button type="button" class="btn btn--warn btn--sm" data-act="del">' + t('Hapus', 'Delete') + '</button></div>';
    return out;
  }

  /* ---------- Opening ---------- */
  var OPEN_SAY = { nawala: ['Nawala terbang membawa surat bernama tamu, lalu membukanya.', 'Nawala flies in with the letter bearing the guest\'s name, then opens it.'],
    monogram: ['Segel lilin dengan inisial kalian, terbelah saat tamu membuka.', 'A wax seal with your initials, breaking open as the guest taps.'],
    foto: ['Foto sampul kalian dalam bingkai lengkung, dengan nama tamu.', 'Your cover photo in an arched frame, with the guest\'s name.'],
    tema: ['Bunga tema membingkai inisial kalian, lalu terbuka ke samping.', 'The theme\'s flowers frame your initials, then part to the sides.'] };
  function pPembuka() {
    return '<div class="tiles">' + ND.OPENINGS.map(function (o) {
      var dis = o[0] === 'nawala' && !design.nawala;
      return '<button type="button" class="tile" data-act="open" data-v="' + o[0] + '" aria-pressed="' + (design.opening === o[0]) + '"' + (dis ? ' disabled' : '') + '><span class="tile__art">' +
        (o[0] === 'nawala' ? '<img class="tile__img" src="../assets/img/nawala-hero-480.webp" alt="">' : o[0] === 'monogram' ? '<span class="tile__txt" style="width:56px;height:56px;border-radius:50%;display:grid;place-items:center;background:var(--forest);color:var(--ivory);font-size:1.1rem">A&amp;B</span>'
          : o[0] === 'foto' ? '<span class="fx fx--lengkung"></span>' : '<span class="tile__m" style="--m:url(../assets/el/sudut-bunga.svg)"></span>') + '</span>' + t(o[1], o[2]) + '</button>';
    }).join('') + '</div><p class="note">' + t(OPEN_SAY[design.opening][0], OPEN_SAY[design.opening][1]) + '</p>' +
      (design.nawala ? '' : '<p class="small muted">' + t('Nawala sedang tidak ikut, jadi pembuka Nawala tidak tersedia. Nyalakan lagi di Lainnya.', 'Nawala is not coming along, so the Nawala opening is not available. Switch it back on under More.') + '</p>') +
      '<button type="button" class="btn btn--main btn--sm" data-act="peek">' + t('Lihat pembukanya', 'Watch the opening') + '</button>';
  }
  function peek() {
    if (!page || !page.NAWALA_PAGE) return;
    var root = page.document.documentElement, gate = page.document.getElementById('gate');
    root.classList.add('is-peek'); page.NAWALA_PAGE.replay();
    var iv = setInterval(function () { if (gate.hidden || !root.classList.contains('is-peek')) { clearInterval(iv); root.classList.remove('is-peek'); } }, 300);
    if (!wide.matches) open('');
    toast(t('Ketuk "Buka undangan" di pratinjau.', 'Tap "Open the invitation" in the preview.'), true);
  }

  /* ---------- More: Nawala, back to the original, the team's check ---------- */
  function pLain() {
    var out = '<div class="row" style="justify-content:space-between"><span><b>' + t('Nawala ikut dalam undangan', 'Nawala comes along') + '</b><br><span class="small muted">' + t('Bila dimatikan, Nawala kecil tetap ada di akhir undangan.', 'When off, a small Nawala still stays at the end of the invitation.') + '</span></span>' +
      chip('nawala', design.nawala ? '0' : '1', design.nawala ? t('Ikut', 'On') : t('Tidak ikut', 'Off'), design.nawala) + '</div>' +
      '<div><span class="lbl">' + t('Kembalikan ke desain asli tema', 'Back to the theme\'s original design') + '</span>' +
      (confirmReset ? '<div class="row"><button type="button" class="btn btn--warn btn--sm" data-act="reset">' + t('Ya, kembalikan semua', 'Yes, undo everything') + '</button><button type="button" class="btn btn--line btn--sm" data-act="noreset">' + t('Batal', 'Cancel') + '</button></div>'
        : '<button type="button" class="btn btn--line btn--sm" data-act="askreset">' + t('Kembalikan semua', 'Undo everything') + '</button>') +
      '<p class="small muted" style="margin-top:.4rem">' + t('Ini juga bisa diurungkan dengan tombol panah di atas.', 'This can be undone too, with the arrow at the top.') + '</p></div>';
    out += '<p class="note note--sun">' + (AS === 'tim' ? t('Perubahan desain tampil untuk tamu setelah undangan diterbitkan di konsol tim.', 'Design changes reach guests once the invitation is published in the team console.')
      : t('Semua perubahan desain diperiksa tim Nawala lebih dulu. Tamu melihatnya setelah tim menyetujui dan menerbitkannya.', 'Every design change is checked by the Nawala team first. Guests see it once the team has approved and published it.')) + '</p>';
    if (AS === 'ruang') out += '<button type="button" class="btn btn--main" data-act="submit">' + t('Kirim ke tim untuk diperiksa', 'Send to the team for a check') + '</button>';
    if (AS === 'tim') out += '<a class="btn btn--main" href="../tim/#undangan">' + t('Kembali ke pesanan untuk menerbitkan', 'Back to the order to publish') + '</a>';
    return out;
  }

  /* ---------- One listener for the whole sheet ---------- */
  function act(el, finished) {
    var a = el.getAttribute('data-act'), v = el.value !== undefined && el.tagName !== 'BUTTON' ? el.value : el.getAttribute('data-v');
    var it = sel && sel.kind === 'item' ? itemBy(sel.id) : null, b, p;
    switch (a) {
      case 'scope': scope = v; panel(); return;
      case 'role': fontRole = v; panel(); return;
      case 'cat': elCat = v; panel(); return;
      case 'font':
        if (scope === 'ini' && sel && sel.kind === 'box') { b = boxTarget(); if (fontRole === 'judul') b.fj = v; else b.ft = v; } else design.font[fontRole] = v;
        return commit();
      case 'boxc': boxTarget().c = v; return finished ? commit() : apply();
      case 'boxa': boxTarget().a = +v; var s = $('#a-say'); if (s) s.textContent = v + '%'; return finished ? commit(false) : apply();
      case 'boxr': boxTarget().r = +v; return finished ? commit(false) : apply();
      case 'boxsame': if (sel && design.boxes[sel.id]) { b = design.boxes[sel.id]; delete b.c; delete b.a; delete b.r; } return commit();
      case 'boxreset': design.box = {}; return commit();
      case 'frame': if (scope === 'ini' && sel && sel.kind === 'photo') { if (v) design.frames[sel.id] = v; else delete design.frames[sel.id]; } else design.frame = v; return commit();
      case 'back': design.back = v; return commit();
      case 'ps': p = photoOf(sel.id); p.s = +v / 100; return finished ? commit(false) : apply();
      case 'pal': p = photoOf(sel.id); p.al = v; return commit();
      case 'pz': p = photoOf(sel.id); p.z = +v / 100; return finished ? commit(false) : apply();
      case 'pr': p = photoOf(sel.id); p.r = +v; return finished ? commit(false) : apply();
      case 'preset': delete design.photos[sel.id]; return commit();
      case 'add': return add('el', v);
      case 'addtxt': return add('txt', v);
      case 'txt': if (it) { it.t = v.slice(0, 160) || ' '; return finished ? commit(false) : apply(); } return;
      case 'txtf': if (it) { it.f = v; return commit(false); } return;
      case 'fs': if (it) { it.fs = +v; return finished ? commit(false) : apply(); } return;
      case 'ic': if (it) { it.c = v; return finished ? commit() : apply(); } return;
      case 'iw': if (it) { it.w = +v; return finished ? commit(false) : apply(); } return;
      case 'irr': if (it) { it.r = +v; return finished ? commit(false) : apply(); } return;
      case 'up': if (it) { it.z = Math.min(9, it.z + 1); return commit(); } return;
      case 'down': if (it) { it.z = Math.max(0, it.z - 1); return commit(); } return;
      case 'dup': if (it) { var c = JSON.parse(JSON.stringify(it)); c.id = uid(); c.y = Math.min(110, c.y + 6); c.x = Math.min(110, c.x + 4); design.items.push(c); sel = { kind: 'item', id: c.id }; return commit(); } return;
      case 'del': if (it) { design.items = design.items.filter(function (x) { return x !== it; }); sel = null; document.body.classList.remove('is-chosen'); commit(false); open(wide.matches ? 'elemen' : ''); } return;
      case 'open': design.opening = v; return commit();
      case 'peek': return peek();
      case 'nawala': design.nawala = v === '1'; if (!design.nawala && design.opening === 'nawala') design.opening = 'monogram'; return commit();
      case 'askreset': confirmReset = true; panel(); return;
      case 'noreset': confirmReset = false; panel(); return;
      case 'reset': design = ND.norm({}); sel = null; confirmReset = false; return commit();
      case 'submit':
        DB.rpc('room_order_submit', { p_code: who }).then(function () { toast(t('Terkirim ke tim Nawala. Kami kabari lewat WhatsApp.', 'Sent to the Nawala team. We will reply on WhatsApp.')); }, function () { toast(t('Belum terkirim. Coba lagi sebentar lagi.', 'Not sent yet. Try again in a moment.')); });
        return;
    }
  }
  var body = $('#body');
  body.addEventListener('click', function (e) { var el = e.target.closest('button[data-act]'); if (el && !el.disabled) act(el, true); });
  body.addEventListener('input', function (e) { var el = e.target.closest('[data-act]'); if (el && el.tagName !== 'SELECT') act(el, false); });
  body.addEventListener('change', function (e) { var el = e.target.closest('[data-act]'); if (el) act(el, true); });

  K.onLang && K.onLang(function () { relabel(); panel(); });
  boot();
})();
