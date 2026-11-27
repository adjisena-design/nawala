/* The design layer of a Dasar invitation (owner, 21 Nov 2026): what a couple may change in the editor, and how it is put
   on the page. Shared by the invitation (undangan/dasar.html) and the editor (undangan/sunting.html).
   A design is a small object kept in the order's draft as draft.design; an empty design is the theme as Nawala made it.
     font   {judul, teks}            the faces for names and headings, and for running text ('' = the theme's own)
     box    {c, a, r}                every text box: colour ('' = the theme's paper), solidity 0..100, roundness 0..40 px
     boxes  {<box id>: {c, a, r, fj, ft}}   one box set apart from the rest (also its own faces)
     opening 'nawala' | 'monogram' | 'foto' | 'tema'   never a blank envelope: Nawala, or no envelope at all
     nawala  true | false            Nawala travels with the couple; false keeps only the small Nawala at the very end
     frame  ''|<frame id>, frames {bride, groom, cover}, back 'kertas'|'aksen'|'tanpa'
     photos {bride|groom|cover: {x, y, z, r, s, al}}   pan (0..100), zoom (1..3), turn (deg), size (.6..1.3), align l|c|r
     items  [{id, b, k, s, x, y, w, r, c, t, f, fs, z}]   added elements, pinned to a block (b), in % of that block
     at     ISO time of the last change (the console compares it with the publish time)
   Everything that comes in is shaped again here, so a design can never carry a foreign picture or a script. */
window.NAWALA_DESIGN = (function () {
  'use strict';

  /* ---------- Faces: free licences (SIL Open Font License or Apache), chosen to sit well on an invitation ---------- */
  var FONTS = [
    ['', 'Bawaan tema', 'Theme default', ''],
    ['great-vibes', 'Great Vibes', 'script'], ['parisienne', 'Parisienne', 'script'], ['alex-brush', 'Alex Brush', 'script'], ['allura', 'Allura', 'script'],
    ['pinyon-script', 'Pinyon Script', 'script'], ['italianno', 'Italianno', 'script'], ['tangerine', 'Tangerine', 'script'], ['sacramento', 'Sacramento', 'script'],
    ['monsieur-la-doulaise', 'Monsieur La Doulaise', 'script'], ['petit-formal-script', 'Petit Formal Script', 'script'], ['rouge-script', 'Rouge Script', 'script'],
    ['imperial-script', 'Imperial Script', 'script'], ['corinthia', 'Corinthia', 'script'], ['dancing-script', 'Dancing Script', 'script'], ['birthstone', 'Birthstone', 'script'],
    ['mrs-saint-delafield', 'Mrs Saint Delafield', 'script'],
    ['playfair-display', 'Playfair Display', 'serif'], ['cormorant-garamond', 'Cormorant Garamond', 'serif'], ['cinzel', 'Cinzel', 'serif'], ['bodoni-moda', 'Bodoni Moda', 'serif'],
    ['prata', 'Prata', 'serif'], ['gilda-display', 'Gilda Display', 'serif'], ['italiana', 'Italiana', 'serif'], ['marcellus', 'Marcellus', 'serif'], ['forum', 'Forum', 'serif'],
    ['dm-serif-display', 'DM Serif Display', 'serif'], ['yeseva-one', 'Yeseva One', 'serif'], ['cormorant-upright', 'Cormorant Upright', 'serif'],
    ['libre-baskerville', 'Libre Baskerville', 'teks'], ['lora', 'Lora', 'teks'], ['eb-garamond', 'EB Garamond', 'teks'], ['crimson-pro', 'Crimson Pro', 'teks'],
    ['spectral', 'Spectral', 'teks'], ['cardo', 'Cardo', 'teks'],
    ['montserrat', 'Montserrat', 'sans'], ['raleway', 'Raleway', 'sans'], ['josefin-sans', 'Josefin Sans', 'sans'], ['jost', 'Jost', 'sans'], ['quicksand', 'Quicksand', 'sans'],
    ['nunito-sans', 'Nunito Sans', 'sans'], ['lato', 'Lato', 'sans'], ['tenor-sans', 'Tenor Sans', 'sans'], ['outfit', 'Outfit', 'sans']
  ];
  var FONT_CATS = [['script', 'Tulisan tangan', 'Script'], ['serif', 'Klasik', 'Classic serif'], ['teks', 'Untuk bacaan', 'For reading'], ['sans', 'Modern', 'Modern sans']];
  /* script faces are for names and headings only: running text in them is hard to read */
  function fontOk(id, role) { var f = fontById(id); return !!f && (role !== 'teks' || f[2] !== 'script'); }
  function fontById(id) { for (var i = 0; i < FONTS.length; i++) if (FONTS[i][0] === id) return FONTS[i]; return null; }

  /* ---------- Elements: drawn line art (one colour, taken from the theme) and painted pieces ---------- */
  var EL_CATS = [['pembatas', 'Pembatas', 'Dividers'], ['sudut', 'Sudut', 'Corners'], ['bunga', 'Bunga dan daun', 'Flowers and leaves'], ['bingkai', 'Bingkai dan lengkung', 'Frames and arches'],
    ['bentuk', 'Bentuk', 'Shapes'], ['nikah', 'Pernikahan', 'Wedding'], ['nusantara', 'Nusantara', 'Nusantara'], ['lukis', 'Lukisan', 'Painted'], ['teks', 'Teks', 'Text']];
  /* id, category, name id, name en, width/height */
  var ELEMENTS = [
    ['pembatas-berlian', 'pembatas', 'Garis berlian', 'Diamond line', 7.5], ['pembatas-sulur', 'pembatas', 'Sulur', 'Vine', 5], ['pembatas-hati', 'pembatas', 'Garis hati', 'Heart line', 7.5],
    ['pembatas-gelombang', 'pembatas', 'Gelombang', 'Wave', 7.5], ['pembatas-bintang', 'pembatas', 'Bintang', 'Stars', 7.5], ['pembatas-ukel', 'pembatas', 'Ukel', 'Flourish', 5],
    ['sudut-sulur', 'sudut', 'Sudut sulur', 'Vine corner', 1], ['sudut-garis', 'sudut', 'Sudut garis', 'Line corner', 1], ['sudut-bunga', 'sudut', 'Sudut bunga', 'Flower corner', 1], ['sudut-deko', 'sudut', 'Sudut deko', 'Deco corner', 1],
    ['mawar', 'bunga', 'Mawar', 'Rose', .833], ['eukaliptus', 'bunga', 'Eukaliptus', 'Eucalyptus', .615], ['ranting-zaitun', 'bunga', 'Ranting zaitun', 'Olive branch', 2.333], ['lili', 'bunga', 'Lili', 'Lily', .769],
    ['melati', 'bunga', 'Melati', 'Jasmine', 1.1], ['tulip', 'bunga', 'Tulip', 'Tulip', .615], ['bunga-liar', 'bunga', 'Bunga liar', 'Wildflowers', .923], ['anggrek', 'bunga', 'Anggrek', 'Orchid', 1],
    ['karangan-bulat', 'bingkai', 'Karangan bulat', 'Round wreath', 1], ['lengkung-daun', 'bingkai', 'Lengkung daun', 'Leaf arch', .857], ['bingkai-oval', 'bingkai', 'Bingkai oval', 'Oval frame', .786], ['bingkai-deko', 'bingkai', 'Bingkai deko', 'Deco frame', .786],
    ['lingkaran', 'bentuk', 'Lingkaran', 'Circle', 1], ['hati', 'bentuk', 'Hati', 'Heart', 1.053], ['berlian', 'bentuk', 'Berlian', 'Diamond', 1], ['bintang-delapan', 'bentuk', 'Bintang delapan', 'Eight-point star', 1],
    ['lengkung', 'bentuk', 'Lengkung', 'Arch', .833], ['awan', 'bentuk', 'Awan', 'Cloud', 1.857],
    ['cincin', 'nikah', 'Cincin', 'Rings', 1.333], ['merpati', 'nikah', 'Merpati', 'Dove', 1.333], ['lonceng', 'nikah', 'Lonceng', 'Bells', 1], ['lilin', 'nikah', 'Lilin', 'Candle', .538],
    ['gelas', 'nikah', 'Bersulang', 'A toast', 1], ['pita', 'nikah', 'Pita', 'Ribbon', 2.333],
    ['gunungan', 'nusantara', 'Gunungan', 'Gunungan', .714], ['kawung', 'nusantara', 'Kawung', 'Kawung', 1], ['parang', 'nusantara', 'Parang', 'Parang', 2.333], ['mega-mendung', 'nusantara', 'Mega mendung', 'Mega mendung', 2.154]
  ];
  /* painted pieces (pictures with a transparent background): filled in as they are made; same fields, src is a .webp */
  var PAINTED = window.NAWALA_PAINTED || [];
  var TEXTS = [['judul', 'Judul', 'Title', 30], ['kutipan', 'Kutipan', 'Quote', 19], ['catatan', 'Catatan kecil', 'Small note', 17]];

  /* ---------- Photo frames ---------- */
  var FRAMES = [['oval', 'Oval', 'Oval'], ['lengkung', 'Lengkung', 'Arch'], ['bulat', 'Bulat', 'Circle'], ['kotak', 'Kotak lembut', 'Soft square'], ['polaroid', 'Polaroid', 'Polaroid'],
    ['ganda', 'Cincin ganda', 'Double ring'], ['gerigi', 'Gerigi', 'Scalloped'], ['segi8', 'Segi delapan', 'Octagon'], ['wajik', 'Wajik', 'Diamond'], ['karangan', 'Karangan daun', 'Leaf wreath'],
    ['emas', 'Lengkung emas', 'Gilded arch'], ['perangko', 'Perangko', 'Stamp']];
  /* each family starts with its own frame, so themes do not all look alike */
  var FAMILY_FRAME = { foto: 'oval', bunga: 'karangan', tempat: 'lengkung', budaya: 'emas', waktu: 'ganda', hidup: 'karangan' };
  var OPENINGS = [['nawala', 'Nawala membawa surat', 'Nawala brings the letter'], ['monogram', 'Segel monogram', 'Monogram seal'], ['foto', 'Foto berdua', 'Your photo'], ['tema', 'Bunga tema', 'The theme\'s flowers']];
  var BLOCKS = ['sampul', 'salam', 'mempelai', 'cerita', 'acara', 'galeri', 'rsvp', 'ucapan', 'hadiah', 'penutup'];

  /* ---------- Shaping what comes in ---------- */
  var MEDIA = 'https://erwddnobnagpglkpvdfm.supabase.co/storage/v1/object/public/media/inv/';
  function num(v, lo, hi, dflt) { v = Number(v); return isFinite(v) ? Math.min(hi, Math.max(lo, v)) : dflt; }
  function hex(v) { return typeof v === 'string' && /^#[0-9a-fA-F]{6}$/.test(v) ? v : ''; }
  function str(v, n) { return typeof v === 'string' ? v.replace(/[<>]/g, '').slice(0, n) : ''; }
  function one(list, v, dflt) { for (var i = 0; i < list.length; i++) if (list[i][0] === v) return v; return dflt; }
  function elById(id) { var all = ELEMENTS.concat(PAINTED); for (var i = 0; i < all.length; i++) if (all[i][0] === id) return all[i]; return null; }
  function box(b) {
    b = b && typeof b === 'object' ? b : {};
    var o = {};
    if (hex(b.c)) o.c = hex(b.c);
    if (b.a !== undefined && b.a !== null && b.a !== '') o.a = num(b.a, 0, 100, 100);
    if (b.r !== undefined && b.r !== null && b.r !== '') o.r = num(b.r, 0, 40, 28);
    if (fontOk(b.fj, 'judul') && b.fj) o.fj = b.fj;
    if (fontOk(b.ft, 'teks') && b.ft) o.ft = b.ft;
    return o;
  }
  function norm(d) {
    d = d && typeof d === 'object' ? d : {};
    var o = { v: 1 };
    var f = d.font || {};
    o.font = { judul: fontOk(f.judul, 'judul') ? f.judul : '', teks: fontOk(f.teks, 'teks') ? f.teks : '' };
    o.box = box(d.box);
    o.boxes = {};
    if (d.boxes && typeof d.boxes === 'object') Object.keys(d.boxes).slice(0, 60).forEach(function (k) {
      if (/^[a-z]{3,10}-\d{1,2}$/.test(k)) { var b = box(d.boxes[k]); if (Object.keys(b).length) o.boxes[k] = b; }
    });
    o.nawala = d.nawala !== false;
    o.opening = one(OPENINGS, d.opening, 'nawala');
    if (!o.nawala && o.opening === 'nawala') o.opening = 'monogram';
    o.frame = one(FRAMES, d.frame, '');
    o.frames = {};
    ['bride', 'groom', 'cover'].forEach(function (k) { var v = one(FRAMES, d.frames && d.frames[k], ''); if (v) o.frames[k] = v; });
    o.back = one([['kertas'], ['aksen'], ['tanpa']], d.back, 'kertas');
    o.photos = {};
    ['bride', 'groom', 'cover'].forEach(function (k) {
      var p = d.photos && d.photos[k]; if (!p || typeof p !== 'object') return;
      o.photos[k] = { x: num(p.x, 0, 100, 50), y: num(p.y, 0, 100, 50), z: num(p.z, 1, 3, 1), r: num(p.r, -45, 45, 0), s: num(p.s, .6, 1.3, 1), al: one([['l'], ['c'], ['r']], p.al, 'c') };
    });
    o.items = (Array.isArray(d.items) ? d.items : []).slice(0, 40).map(function (it, i) {
      if (!it || typeof it !== 'object' || BLOCKS.indexOf(it.b) < 0) return null;
      var k = it.k === 'txt' ? 'txt' : it.k === 'img' ? 'img' : 'el';
      var x = { id: str(it.id, 12) || ('i' + i), b: it.b, k: k, x: num(it.x, -20, 120, 50), y: num(it.y, -20, 120, 50), w: num(it.w, 4, 120, 40), r: num(it.r, -180, 180, 0), c: hex(it.c), z: num(it.z, 0, 9, 1) };
      if (k === 'el') { if (!elById(it.s)) return null; x.s = it.s; }
      if (k === 'img') { if (typeof it.s !== 'string' || it.s.indexOf(MEDIA) !== 0 || !/^[^"'<>\s()]+\.(webp|jpg)$/.test(it.s)) return null; x.s = it.s; }
      if (k === 'txt') { x.t = str(it.t, 160); if (!x.t) return null; x.f = fontOk(it.f, 'judul') ? it.f : ''; x.fs = num(it.fs, 14, 72, 24); x.s = one(TEXTS, it.s, 'judul'); }
      return x;
    }).filter(Boolean);
    o.at = typeof d.at === 'string' ? d.at.slice(0, 40) : '';
    return o;
  }
  function empty(d) { var n = norm(d); return JSON.stringify(n.font) === '{"judul":"","teks":""}' && !Object.keys(n.box).length && !Object.keys(n.boxes).length && n.nawala && n.opening === 'nawala' && !n.frame && !Object.keys(n.frames).length && n.back === 'kertas' && !Object.keys(n.photos).length && !n.items.length; }

  /* ---------- Putting a design on the page (only inside the invitation) ---------- */
  var base = (function () { var s = document.currentScript && document.currentScript.getAttribute('src'); return s ? s.replace(/js\/desain\.js.*$/, '') : '../assets/'; })();
  var loaded = {};
  function loadFont(id) {
    var f = fontById(id); if (!f || !id || loaded[id]) return;
    loaded[id] = 1;
    var st = document.getElementById('nw-fonts');
    if (!st) { st = document.createElement('style'); st.id = 'nw-fonts'; document.head.appendChild(st); }
    st.appendChild(document.createTextNode('@font-face{font-family:"nw-' + id + '";src:url("' + base + 'fonts/ed/' + id + '.woff2") format("woff2");font-display:swap}'));
  }
  function face(id, fallback) { var f = fontById(id); return f && id ? '"nw-' + id + '",' + (f[2] === 'sans' ? 'system-ui,sans-serif' : 'Georgia,serif') : fallback; }
  function setVars(el, b) {
    ['--bx-c', '--bx-a', '--bx-r', '--display', '--body'].forEach(function (k) { el.style.removeProperty(k); });
    if (!b) return;
    if (b.c) el.style.setProperty('--bx-c', b.c);
    if (b.a !== undefined) el.style.setProperty('--bx-a', (b.a / 100).toFixed(2));
    if (b.r !== undefined) el.style.setProperty('--bx-r', b.r + 'px');
    if (b.fj) { loadFont(b.fj); el.style.setProperty('--display', face(b.fj)); }
    if (b.ft) { loadFont(b.ft); el.style.setProperty('--body', face(b.ft)); }
  }
  /* every text box gets a name: the block it is in and its place there (salam-0, mempelai-1, ...) */
  function boxes() {
    var out = [];
    BLOCKS.forEach(function (bl) {
      var blk = document.getElementById(bl); if (!blk) return;
      var list = bl === 'sampul' ? blk.querySelectorAll('.cover, .cover__to') : blk.querySelectorAll('.card, .on-plate');
      Array.prototype.forEach.call(list, function (el, i) { el.setAttribute('data-box', bl + '-' + i); out.push(el); });
    });
    return out;
  }
  function frameOf(D, k) { return D.frames[k] || D.frame || FAMILY_FRAME[document.documentElement.getAttribute('data-family') || 'foto'] || 'oval'; }
  function frames(D) {
    var slots = [['bride', document.querySelector('#mempelai .person:nth-of-type(1) > img, #mempelai .person:nth-of-type(1) > .fr')],
      ['groom', document.querySelector('#mempelai .person:nth-of-type(2) > img, #mempelai .person:nth-of-type(2) > .fr')],
      ['cover', document.querySelector('.cover__photo, .cover > .fr')]];
    slots.forEach(function (s) {
      var el = s[1]; if (!el) return;
      var fr = el.classList.contains('fr') ? el : null;
      if (!fr) { fr = document.createElement('span'); fr.className = 'fr'; el.parentNode.insertBefore(fr, el); fr.appendChild(el); }
      fr.setAttribute('data-slot', s[0]);
      fr.setAttribute('data-frame', frameOf(D, s[0]));
      fr.setAttribute('data-back', D.back);
      var ini = initials(); fr.setAttribute('data-ini', s[0] === 'bride' ? ini[0] : s[0] === 'groom' ? ini[1] : ini[0] + ' & ' + ini[1]);
      var img = fr.querySelector('img'), p = D.photos[s[0]] || {}, photo = img && !/nawala-|nw-/.test(img.getAttribute('src') || '');
      fr.classList.toggle('is-photo', !!photo);
      fr.style.setProperty('--fs', p.s || 1);
      fr.setAttribute('data-al', p.al || 'c');
      if (img && photo) { img.style.objectPosition = (p.x != null ? p.x : 50) + '% ' + (p.y != null ? p.y : 50) + '%'; img.style.transform = 'scale(' + (p.z || 1) + ') rotate(' + (p.r || 0) + 'deg)'; }
    });
  }
  function initials() {
    var D = window.NAWALA_INVITE || {}; var a = (D.bride && D.bride.short || 'A').charAt(0), b = (D.groom && D.groom.short || 'B').charAt(0);
    return [a.toUpperCase(), b.toUpperCase()];
  }
  /* the openings that stand in for Nawala: a monogram seal, the couple's photo, or the theme's flowers */
  function opening(D) {
    var root = document.documentElement, gate = document.getElementById('gate'); if (!gate) return;
    root.setAttribute('data-open', D.opening);
    var alt = gate.querySelector('.gate__alt');
    if (D.opening === 'nawala') { if (alt) alt.hidden = true; return; }
    if (!alt) { alt = document.createElement('div'); alt.className = 'gate__alt'; alt.setAttribute('aria-hidden', 'true'); gate.querySelector('.gate__nw').appendChild(alt); }
    alt.hidden = false;
    var ini = initials(), cover = (window.NAWALA_INVITE && window.NAWALA_INVITE.photos || {}).cover;
    if (D.opening === 'monogram') {
      alt.innerHTML = '<div class="mono"><i class="mono__half mono__half--l"></i><i class="mono__half mono__half--r"></i><b>' + ini[0] + '<em>&amp;</em>' + ini[1] + '</b></div>';
    } else if (D.opening === 'foto' && cover && cover.indexOf(MEDIA) === 0) {
      alt.innerHTML = '<div class="gphoto"><img src="' + cover.replace(/"/g, '') + '" alt=""></div>';
    } else if (D.opening === 'foto') {
      alt.innerHTML = '<div class="gphoto gphoto--empty"><b>' + ini[0] + '<em>&amp;</em>' + ini[1] + '</b></div>';
    } else {
      alt.innerHTML = '<div class="gflow"><i class="gflow__a"></i><i class="gflow__b"></i><b>' + ini[0] + '<em>&amp;</em>' + ini[1] + '</b></div>';
    }
  }
  function itemEl(it) {
    var el = document.createElement('div');
    el.className = 'it it--' + it.k; el.setAttribute('data-item', it.id);
    if (it.k === 'el') {
      var e = elById(it.s), painted = e && /\.webp$/.test(e[5] || '');
      if (painted) { var im = new Image(); im.src = base + 'el/' + it.s + '.webp'; im.alt = ''; im.decoding = 'async'; el.appendChild(im); }
      else { var m = document.createElement('i'); m.style.setProperty('--m', 'url("' + base + 'el/' + it.s + '.svg")'); m.style.aspectRatio = String(e ? e[4] : 1); el.appendChild(m); }
    } else if (it.k === 'img') {
      var ph = new Image(); ph.src = it.s; ph.alt = ''; ph.decoding = 'async'; el.appendChild(ph);
    } else {
      var p = document.createElement('p'); p.textContent = it.t; el.appendChild(p);
    }
    return el;
  }
  function placeItem(el, it) {
    el.style.left = it.x + '%'; el.style.top = it.y + '%'; el.style.width = it.w + '%'; el.style.zIndex = 3 + it.z;
    el.style.transform = 'translate(-50%,-50%) rotate(' + it.r + 'deg)';
    el.style.color = it.c || '';
    if (it.k === 'txt') {
      el.setAttribute('data-txt', it.s);
      if (it.f) loadFont(it.f);
      el.firstChild.style.fontFamily = it.f ? face(it.f) : '';
      el.firstChild.style.fontSize = it.fs + 'px';
      el.firstChild.textContent = it.t;
    }
  }
  function items(D) {
    var keep = {};
    D.items.forEach(function (it) {
      var blk = document.getElementById(it.b); if (!blk) return;
      var el = blk.querySelector('[data-item="' + it.id + '"]');
      if (el && el.getAttribute('data-k') !== it.k + (it.s || '')) { el.remove(); el = null; }
      if (!el) { el = itemEl(it); el.setAttribute('data-k', it.k + (it.s || '')); blk.appendChild(el); }
      placeItem(el, it); keep[it.id] = 1;
    });
    Array.prototype.forEach.call(document.querySelectorAll('.it'), function (el) { if (!keep[el.getAttribute('data-item')]) el.remove(); });
  }
  var current = norm({});
  function apply(design) {
    var D = current = norm(design), root = document.documentElement;
    setVars(root, D.box);
    loadFont(D.font.judul); loadFont(D.font.teks);
    if (D.font.judul) root.style.setProperty('--display', face(D.font.judul)); else root.style.removeProperty('--display');
    if (D.font.teks) root.style.setProperty('--body', face(D.font.teks)); else root.style.removeProperty('--body');
    root.classList.toggle('no-nawala', !D.nawala);
    boxes().forEach(function (el) {
      var id = el.getAttribute('data-box'), own = D.boxes[id];
      setVars(el, own);
      el.toggleAttribute('data-bx', !!own);
      /* a see-through box needs the writing to stand out on the picture behind it */
      var a = own && own.a !== undefined ? own.a : D.box.a !== undefined ? D.box.a : 100;
      el.classList.toggle('is-thin', a < 55 && el.classList.contains('card'));
    });
    frames(D); opening(D); items(D);
    return D;
  }
  return { FONTS: FONTS, FONT_CATS: FONT_CATS, ELEMENTS: ELEMENTS, PAINTED: PAINTED, EL_CATS: EL_CATS, TEXTS: TEXTS, FRAMES: FRAMES, FAMILY_FRAME: FAMILY_FRAME, OPENINGS: OPENINGS, BLOCKS: BLOCKS,
    norm: norm, empty: empty, apply: apply, fontById: fontById, fontOk: fontOk, elById: elById, loadFont: loadFont, face: face, base: function () { return base; }, current: function () { return current; } };
})();
