/* The invitation builder, shared by the couple's room (ruang/) and the team console (tim/).
   One form for the details of a wedding, the photos, a live preview, and compile(): it turns what the form holds (the
   draft) into the data the two invitation engines read (undangan/invite.js and undangan/dasar.js), the same shape as
   undangan/couple-laras-bima.js. The draft is saved as typed; compile() runs at publish time and for the preview.
   Needs window.K (console.js) and window.NAWALA_DB (db.js). */
window.NAWALA_BUILDER = (function () {
  'use strict';
  var K = window.K, DB = window.NAWALA_DB, t = K.t, esc = K.esc;
  var GALLERY = 8;
  var ORDERS = [['pertama', 'first'], ['kedua', 'second'], ['ketiga', 'third'], ['keempat', 'fourth'], ['kelima', 'fifth'], ['bungsu', 'youngest'], ['tunggal', 'only']];
  var KINDS = [['akad', 'Akad nikah', 'Akad nikah'], ['pemberkatan', 'Pemberkatan', 'Holy matrimony'], ['resepsi', 'Resepsi', 'Reception'], ['lain', 'Acara lain', 'Another event']];
  var ZONES = { WIB: 7, WITA: 8, WIT: 9 };
  var NAWALA_WA = '6281379211628';

  /* ---------- The draft ---------- */
  function blank() {
    return { bride: {}, groom: {}, date: '', zone: 'WIB', events: [{ kind: 'akad' }, { kind: 'resepsi' }], story: [],
      dress: { note: '', colours: [] }, stream: '', gifts: [], giftAddress: '', whatsapp: '', photos: { gallery: [] } };
  }
  function obj(v) { return v && typeof v === 'object' && !Array.isArray(v) ? v : {}; }
  function arr(v) { return Array.isArray(v) ? v : []; }
  function str(v, n) { return typeof v === 'string' ? v.slice(0, n || 200) : ''; }
  /* whatever comes back from the database is shaped again here */
  function norm(d) {
    d = obj(d); var b = blank();
    ['bride', 'groom'].forEach(function (k) { var p = obj(d[k]); b[k] = { short: str(p.short, 30), full: str(p.full, 80), order: str(p.order, 12) || 'pertama', father: str(p.father, 80), mother: str(p.mother, 80) }; });
    b.date = /^\d{4}-\d{2}-\d{2}$/.test(d.date) ? d.date : '';
    b.zone = ZONES[d.zone] ? d.zone : 'WIB';
    if (Array.isArray(d.events)) b.events = d.events.slice(0, 4).map(function (e) { e = obj(e); return { kind: str(e.kind, 12) || 'resepsi', title: str(e.title, 40), start: str(e.start, 5), end: str(e.end, 5), place: str(e.place, 80), address: str(e.address, 160), map: str(e.map, 400) }; });
    b.story = arr(d.story).slice(0, 4).map(function (s) { s = obj(s); return { when: str(s.when, 20), title: str(s.title, 40), text: str(s.text, 300) }; });
    var dr = obj(d.dress);
    b.dress = { note: str(dr.note, 200), colours: arr(dr.colours).slice(0, 4).map(function (c) { c = obj(c); return { hex: /^#[0-9a-fA-F]{6}$/.test(c.hex) ? c.hex : '#EFE6D2', name: str(c.name, 24) }; }) };
    b.stream = str(d.stream, 400);
    b.gifts = arr(d.gifts).slice(0, 3).map(function (g) { g = obj(g); return { bank: str(g.bank, 40), number: str(g.number, 40), name: str(g.name, 60) }; });
    b.giftAddress = str(d.giftAddress, 200);
    b.whatsapp = str(d.whatsapp, 20);
    var ph = obj(d.photos);
    b.photos = { cover: DB.isMedia(ph.cover) ? ph.cover : '', bride: DB.isMedia(ph.bride) ? ph.bride : '', groom: DB.isMedia(ph.groom) ? ph.groom : '',
      gallery: arr(ph.gallery).filter(DB.isMedia).slice(0, GALLERY) };
    /* the design (undangan/sunting.html) travels with the draft; the invitation shapes it again (assets/js/desain.js) */
    if (d.design && typeof d.design === 'object' && !Array.isArray(d.design)) b.design = d.design;
    return b;
  }

  /* ---------- What is still missing before the invitation can go live ---------- */
  function missing(d) {
    var out = [];
    if (!d.bride.short || !d.bride.full) out.push(t('Nama mempelai wanita', 'The bride\'s name'));
    if (!d.groom.short || !d.groom.full) out.push(t('Nama mempelai pria', 'The groom\'s name'));
    if (!d.date) out.push(t('Tanggal pernikahan', 'The wedding date'));
    if (!d.events.length || d.events.some(function (e) { return !e.start || !e.end || !e.place; })) out.push(t('Jam dan tempat tiap acara', 'Time and place of each event'));
    if (d.events.some(function (e) { return e.map && !/^https:\/\/\S+$/.test(e.map); })) out.push(t('Tautan peta harus diawali https://', 'Map links must start with https://'));
    return out;
  }
  function photosIn(d) { return !!(d.photos.cover && d.photos.bride && d.photos.groom); }

  /* ---------- compile: the draft as the engines read it ---------- */
  function parents(p, girl) {
    var o = ORDERS.filter(function (x) { return x[0] === p.order; })[0] || ORDERS[0];
    var who = [p.father && 'Bapak ' + p.father, p.mother && 'Ibu ' + p.mother].filter(Boolean).join(' dan ');
    var whoEn = [p.father && 'Mr ' + p.father, p.mother && 'Mrs ' + p.mother].filter(Boolean).join(' and ');
    var id = (girl ? 'Putri ' : 'Putra ') + o[0] + (who ? ' ' + who : '');
    var en = o[1].charAt(0).toUpperCase() + o[1].slice(1) + (girl ? ' daughter' : ' son') + (whoEn ? ' of ' + whoEn : '');
    return [id, en];
  }
  function wa(n) { n = String(n || '').replace(/\D/g, ''); if (/^0/.test(n)) n = '62' + n.slice(1); return /^62\d{8,13}$/.test(n) ? n : NAWALA_WA; }
  function pair(s) { return [s, s]; }
  function hm(s, dflt) { return /^\d{2}:\d{2}$/.test(s || '') ? s : dflt; }
  function link(u) { return /^https:\/\/[^\s"'<>]+$/.test(u || '') ? u : ''; }
  /* which engine and world a theme opens in. themes: the rows from the database (slug, tier, kit). */
  function route(themeSlug, themes) {
    if (!themeSlug || themeSlug === 'umum') return { route: 'premium', kit: 'umum', built: true };
    var th = (themes || []).filter(function (x) { return x.slug === themeSlug; })[0];
    if (th && th.tier === 'dasar') return { route: 'dasar', kit: th.kit || th.slug, built: !!(th.kit || th.slug) };
    if (th && th.kit) return { route: 'premium', kit: th.kit, built: true };
    return { route: 'premium', kit: 'umum', built: false };
  }
  /* preview: true fills the gaps so an unfinished draft still opens */
  function compile(draft, order, themes, preview) {
    var d = norm(draft), r = route(order.theme, themes), soon = new Date(Date.now() + 120 * 864e5).toISOString().slice(0, 10);
    var name = function (v, dflt) { return v || (preview ? dflt : ''); };
    var out = {
      sample: false, route: r.route, theme: r.route === 'premium' ? r.kit : 'umum', dasarTheme: r.route === 'dasar' ? r.kit : undefined,
      level: order.level || 2, wording: order.wording || 'umum', whatsapp: wa(d.whatsapp),
      bride: { short: name(d.bride.short, 'Mempelai'), full: name(d.bride.full, 'Nama lengkap mempelai wanita'), parents: parents(d.bride, true) },
      groom: { short: name(d.groom.short, 'Pasangan'), full: name(d.groom.full, 'Nama lengkap mempelai pria'), parents: parents(d.groom, false) },
      date: d.date || (preview ? soon : ''), utcOffset: ZONES[d.zone], zone: d.zone,
      events: d.events.map(function (e) {
        var k = e.kind === 'akad' ? { kind: 'ceremony' } : e.kind === 'resepsi' ? { kind: 'reception' }
          : { kind: 'other', title: e.kind === 'pemberkatan' ? ['Pemberkatan', 'Holy matrimony'] : pair(e.title || 'Acara') };
        k.start = hm(e.start, '10:00'); k.end = hm(e.end, '12:00'); k.place = e.place || (preview ? '(tempat acara)' : '');
        k.address = e.address; k.map = link(e.map) || (e.address ? 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(e.address) : '');
        return k;
      }),
      story: d.story.filter(function (s) { return s.title || s.text; }).map(function (s) { return { when: pair(s.when), title: pair(s.title), text: pair(s.text) }; }),
      gifts: d.gifts.filter(function (g) { return g.number; }),
      wishes: [],
      photos: { cover: d.photos.cover, bride: d.photos.bride, groom: d.photos.groom, gallery: d.photos.gallery.slice() },
      design: d.design || undefined
    };
    if (!out.events.length && preview) out.events = [{ kind: 'reception', start: '10:00', end: '12:00', place: '(tempat acara)', address: '', map: '' }];
    if (d.dress.note || d.dress.colours.length) out.dress = { note: pair(d.dress.note), colours: d.dress.colours.map(function (c) { return [c.hex, c.name || c.hex, c.name || c.hex]; }) };
    if (link(d.stream)) out.stream = { url: link(d.stream), note: ['Tautan siaran aktif pada hari acara.', 'The stream link goes live on the day.'] };
    if (d.giftAddress) out.giftAddress = pair(d.giftAddress);
    if (r.route === 'premium' && r.kit === 'umum') out.music = { src: '../assets/audio/nawala-umum.mp3' };
    return { data: out, built: r.built, route: r.route };
  }

  /* ---------- Photos: made small in the browser before they leave ---------- */
  function shrink(file, max, quality) {
    return (window.createImageBitmap ? createImageBitmap(file) : Promise.reject(new Error('old browser'))).then(function (img) {
      var s = Math.min(1, max / Math.max(img.width, img.height)), w = Math.round(img.width * s), h = Math.round(img.height * s);
      var c = document.createElement('canvas'); c.width = w; c.height = h;
      c.getContext('2d').drawImage(img, 0, 0, w, h);
      return toBlob(c, quality);
    });
  }
  function toBlob(c, q) {
    return new Promise(function (ok) { c.toBlob(function (b) { ok(b); }, 'image/webp', q || 0.82); }).then(function (b) {
      if (b && b.type === 'image/webp') return b;   /* Safari makes PNG when asked for WebP: then JPEG */
      return new Promise(function (ok) { c.toBlob(function (j) { ok(j); }, 'image/jpeg', q || 0.82); });
    });
  }

  /* ---------- The form ---------- */
  function f(path, label, opt) {
    opt = opt || {};
    var tag = opt.area ? '<textarea data-k="' + path + '" rows="' + (opt.rows || 3) + '" maxlength="' + (opt.max || 200) + '"></textarea>'
      : '<input data-k="' + path + '" type="' + (opt.type || 'text') + '"' + (opt.max ? ' maxlength="' + opt.max + '"' : '') + (opt.ph ? ' placeholder="' + esc(opt.ph) + '"' : '') + (opt.mode ? ' inputmode="' + opt.mode + '"' : '') + ' autocomplete="off">';
    return '<label class="bf__f' + (opt.wide ? ' bf__f--wide' : '') + '"><span>' + label + (opt.req ? ' <i class="req">*</i>' : '') + '</span><span class="field' + (opt.area ? ' field--area' : '') + '">' + tag + '</span>' + (opt.hint ? '<small>' + opt.hint + '</small>' : '') + '</label>';
  }
  function sel(path, label, options) {
    return '<label class="bf__f"><span>' + label + '</span><span class="field field--sel"><select data-k="' + path + '">' +
      options.map(function (o) { return '<option value="' + esc(o[0]) + '">' + esc(o[1]) + '</option>'; }).join('') + '</select></span></label>';
  }
  function person(k, girl) {
    return '<section class="bf__sec"><h3>' + (girl ? t('Mempelai wanita', 'The bride') : t('Mempelai pria', 'The groom')) + '</h3><div class="bf__grid">' +
      f(k + '.short', t('Nama panggilan', 'Short name'), { max: 30, req: true, ph: girl ? 'Laras' : 'Bima' }) +
      f(k + '.full', t('Nama lengkap', 'Full name'), { max: 80, req: true }) +
      sel(k + '.order', t('Anak ke-', 'Child'), ORDERS.map(function (o) { return [o[0], (girl ? t('Putri ', '') : t('Putra ', '')) + t(o[0], o[1] + (girl ? ' daughter' : ' son'))]; })) +
      f(k + '.father', t('Nama ayah', 'Father\'s name'), { max: 80, hint: t('Tanpa "Bapak". Tulis (alm.) bila perlu.', 'Without "Mr". Add (alm.) if needed.') }) +
      f(k + '.mother', t('Nama ibu', 'Mother\'s name'), { max: 80, hint: t('Tanpa "Ibu".', 'Without "Mrs".') }) +
      '<p class="bf__say" data-say="' + k + '"></p></div></section>';
  }
  function list(key, items, render, addLabel, max) {
    return items.map(function (it, i) {
      return '<div class="bf__item"><div class="bf__grid">' + render(i) + '</div><button type="button" class="btn btn--line btn--sm bf__x" data-del="' + key + '.' + i + '">' + t('Hapus', 'Remove') + '</button></div>';
    }).join('') + (items.length < max ? '<button type="button" class="btn btn--line btn--sm" data-add="' + key + '">' + addLabel + '</button>' : '');
  }
  function slot(key, url, label, wide) {
    return '<div class="ph' + (wide ? ' ph--wide' : '') + '"><div class="ph__img">' + (url ? '<img src="' + esc(url) + '" alt="" loading="lazy">' : '<span>' + t('Belum ada foto', 'No photo yet') + '</span>') + '</div>' +
      '<b>' + label + '</b><span class="ph__acts"><label class="btn btn--line btn--sm">' + (url ? t('Ganti', 'Replace') : t('Pilih foto', 'Choose a photo')) +
      '<input type="file" accept="image/*" data-photo="' + key + '" hidden></label>' + (url ? '<button type="button" class="btn btn--line btn--sm" data-unphoto="' + key + '">' + t('Hapus', 'Remove') + '</button>' : '') + '</span></div>';
  }

  function form(box, draft, opts) {
    var d = norm(draft), saveTimer = 0;
    function changed() { clearTimeout(saveTimer); saveTimer = setTimeout(function () { opts.onChange(d); }, 800); say(); }
    function get(path) { return path.split('.').reduce(function (o, k) { return o == null ? undefined : o[k]; }, d); }
    function set(path, v) { var ks = path.split('.'), o = d; for (var i = 0; i < ks.length - 1; i++) o = o[ks[i]]; o[ks[ks.length - 1]] = v; }
    function say() {
      K.$$('[data-say]', box).forEach(function (p) {
        var k = p.getAttribute('data-say'), pr = parents(d[k], k === 'bride');
        p.textContent = t('Akan tertulis: ', 'Will read: ') + (K.lang() === 'en' ? pr[1] : pr[0]);
      });
      var m = missing(d), el = K.$('.bf__missing', box);
      if (el) el.innerHTML = m.length ? '<b>' + t('Belum lengkap:', 'Still missing:') + '</b> ' + m.map(esc).join(', ') : '<b>' + t('Data utama sudah lengkap.', 'The main details are complete.') + '</b>';
    }
    function draw() {
      box.innerHTML = '<div class="bf">' +
        '<p class="bf__missing small"></p>' +
        person('bride', true) + person('groom', false) +
        '<section class="bf__sec"><h3>' + t('Tanggal', 'The date') + '</h3><div class="bf__grid">' +
          f('date', t('Tanggal pernikahan', 'Wedding date'), { type: 'date', req: true }) +
          sel('zone', t('Zona waktu', 'Time zone'), [['WIB', 'WIB'], ['WITA', 'WITA'], ['WIT', 'WIT']]) + '</div></section>' +
        '<section class="bf__sec"><h3>' + t('Acara', 'Events') + '</h3><p class="small muted">' + t('Satu sampai empat acara, berurutan.', 'One to four events, in order.') + '</p>' +
          list('events', d.events, function (i) {
            var p = 'events.' + i;
            return sel(p + '.kind', t('Jenis acara', 'Event'), KINDS.map(function (k) { return [k[0], t(k[1], k[2])]; })) +
              (d.events[i].kind === 'lain' ? f(p + '.title', t('Nama acara', 'Event name'), { max: 40 }) : '') +
              f(p + '.start', t('Mulai', 'Starts'), { type: 'time', req: true }) + f(p + '.end', t('Selesai', 'Ends'), { type: 'time', req: true }) +
              f(p + '.place', t('Tempat', 'Venue'), { max: 80, req: true, ph: 'Gedung Sate' }) +
              f(p + '.address', t('Alamat', 'Address'), { max: 160, wide: true }) +
              f(p + '.map', t('Tautan Google Maps', 'Google Maps link'), { max: 400, wide: true, ph: 'https://maps.app.goo.gl/...', hint: t('Boleh dikosongkan: peta dicari dari alamat.', 'May stay empty: the map is found from the address.') });
          }, t('Tambah acara', 'Add an event'), 4) + '</section>' +
        '<section class="bf__sec"><h3>' + t('Foto', 'Photos') + '</h3><p class="small muted">' + t('Foto diperkecil otomatis sebelum dikirim. Ruang yang kosong diisi Nawala.', 'Photos are made smaller before they are sent. Empty spaces show Nawala.') + '</p>' +
          '<div class="ph-grid">' + slot('cover', d.photos.cover, t('Sampul, berdua', 'Cover, the two of you'), true) +
          slot('bride', d.photos.bride, t('Mempelai wanita', 'The bride')) + slot('groom', d.photos.groom, t('Mempelai pria', 'The groom')) + '</div>' +
          '<h4>' + t('Galeri', 'Gallery') + ' <span class="muted">(' + d.photos.gallery.length + '/' + GALLERY + ')</span></h4><div class="ph-grid">' +
          d.photos.gallery.map(function (u, i) { return slot('gallery.' + i, u, t('Foto ', 'Photo ') + (i + 1)); }).join('') +
          (d.photos.gallery.length < GALLERY ? '<div class="ph ph--add"><label class="btn btn--line btn--sm">' + t('Tambah foto', 'Add photos') + '<input type="file" accept="image/*" multiple data-photo="gallery.new" hidden></label></div>' : '') +
          '</div></section>' +
        '<section class="bf__sec"><h3>' + t('Kisah kami', 'Our story') + ' <span class="muted small">' + t('(boleh dilewati)', '(optional)') + '</span></h3>' +
          list('story', d.story, function (i) { var p = 'story.' + i; return f(p + '.when', t('Kapan', 'When'), { max: 20, ph: '2019' }) + f(p + '.title', t('Judul', 'Title'), { max: 40 }) + f(p + '.text', t('Cerita singkat', 'A few lines'), { area: true, max: 300, wide: true }); }, t('Tambah cerita', 'Add a moment'), 4) + '</section>' +
        '<section class="bf__sec"><h3>' + t('Busana dan siaran', 'Dress code and stream') + ' <span class="muted small">' + t('(boleh dilewati)', '(optional)') + '</span></h3><div class="bf__grid">' +
          f('dress.note', t('Catatan busana', 'Dress note'), { max: 200, wide: true, ph: t('Kami senang bila tamu mengenakan warna lembut.', 'We would love soft colours.') }) + '</div>' +
          list('dress.colours', d.dress.colours, function (i) { var p = 'dress.colours.' + i; return f(p + '.hex', t('Warna', 'Colour'), { type: 'color' }) + f(p + '.name', t('Nama warna', 'Colour name'), { max: 24 }); }, t('Tambah warna', 'Add a colour'), 4) +
          '<div class="bf__grid">' + f('stream', t('Tautan siaran langsung', 'Live stream link'), { max: 400, wide: true, ph: 'https://youtube.com/...' }) + '</div></section>' +
        '<section class="bf__sec"><h3>' + t('Amplop digital', 'Digital envelope') + ' <span class="muted small">' + t('(boleh dilewati)', '(optional)') + '</span></h3>' +
          list('gifts', d.gifts, function (i) { var p = 'gifts.' + i; return f(p + '.bank', t('Bank atau dompet digital', 'Bank or e-wallet'), { max: 40, ph: 'BCA' }) + f(p + '.number', t('Nomor rekening', 'Account number'), { max: 40, mode: 'numeric' }) + f(p + '.name', t('Atas nama', 'Account name'), { max: 60 }); }, t('Tambah rekening', 'Add an account'), 3) +
          '<div class="bf__grid">' + f('giftAddress', t('Alamat kirim hadiah', 'Address for gifts'), { area: true, max: 200, wide: true, rows: 2 }) + '</div></section>' +
        '<section class="bf__sec"><h3>RSVP</h3><div class="bf__grid">' +
          f('whatsapp', t('Nomor WhatsApp untuk jawaban tamu', 'WhatsApp number for guests\' answers'), { type: 'tel', max: 20, mode: 'tel', ph: '0812...', hint: t('Jawaban tamu tersimpan di Nawala; nomor ini dipakai bila penyimpanan gagal.', 'Answers are saved with Nawala; this number is the fallback.') }) +
          '</div></section>' +
        '</div>';
      K.$$('[data-k]', box).forEach(function (el) { var v = get(el.getAttribute('data-k')); el.value = v == null ? '' : v; });
      say();
    }
    box.addEventListener('input', function (e) {
      var k = e.target.getAttribute && e.target.getAttribute('data-k'); if (!k) return;
      set(k, e.target.value);
      if (/\.kind$/.test(k)) draw();
      changed();
    });
    box.addEventListener('change', function (e) { if (e.target.matches && e.target.matches('select[data-k]')) { set(e.target.getAttribute('data-k'), e.target.value); draw(); changed(); } });
    box.addEventListener('click', function (e) {
      var a = e.target.closest('[data-add]'), x = e.target.closest('[data-del]'), u = e.target.closest('[data-unphoto]');
      if (a) {
        var k = a.getAttribute('data-add'), l = get(k);
        l.push(k === 'events' ? { kind: 'resepsi' } : k === 'dress.colours' ? { hex: '#EFE6D2', name: '' } : {});
        d = norm(d); draw(); changed();
      } else if (x) {
        var p = x.getAttribute('data-del').split('.'), i = +p.pop(); get(p.join('.')).splice(i, 1); draw(); changed();
      } else if (u) {
        var q = u.getAttribute('data-unphoto');
        if (q.indexOf('gallery.') === 0) d.photos.gallery.splice(+q.split('.')[1], 1); else d.photos[q] = '';
        draw(); changed();
      }
    });
    box.addEventListener('change', function (e) {
      var inp = e.target; if (!inp.matches || !inp.matches('input[type=file][data-photo]')) return;
      var key = inp.getAttribute('data-photo'), files = Array.prototype.slice.call(inp.files || []);
      if (key === 'gallery.new') files = files.slice(0, GALLERY - d.photos.gallery.length);
      if (!files.length) return;
      K.toast(t('Mengirim foto...', 'Sending the photo...'));
      files.reduce(function (chain, file) {
        return chain.then(function () {
          return shrink(file, key === 'bride' || key === 'groom' ? 1000 : 1400, 0.82).then(function (blob) {
            return DB.put(opts.who(), 'inv', opts.slug, [{ blob: blob }]).then(function (base) {
              var url = base + (blob.type === 'image/jpeg' ? '.jpg' : '.webp');
              if (key === 'gallery.new') d.photos.gallery.push(url);
              else if (key.indexOf('gallery.') === 0) d.photos.gallery[+key.split('.')[1]] = url;
              else d.photos[key] = url;
            });
          });
        });
      }, Promise.resolve()).then(function () {
        draw(); clearTimeout(saveTimer); opts.onChange(d); K.toast(t('Foto tersimpan.', 'Photo saved.'));
      }, function () {
        draw(); K.toast(t('Foto belum bisa dikirim. Periksa sambungan, lalu coba lagi.', 'The photo could not be sent. Check the connection and try again.'));
      });
    });
    draw();
    return { get: function () { return d; }, redraw: draw, flush: function () { clearTimeout(saveTimer); opts.onChange(d); } };
  }

  /* ---------- Preview: the real engine in a frame, fed through this browser's storage ---------- */
  function preview(frame, draft, order, themes, guest) {
    var c = compile(draft, order, themes, true);
    try { localStorage.setItem('nawala-preview', JSON.stringify(c.data)); } catch (e) { return c; }
    frame.src = (window.NAWALA_BASE || '') + 'undangan/' + (c.route === 'dasar' ? 'dasar.html' : '') + '?preview=1&to=' + encodeURIComponent(guest || 'Tamu undangan') + '&n=' + Date.now();
    return c;
  }

  return { blank: blank, norm: norm, missing: missing, photosIn: photosIn, compile: compile, route: route, form: form, preview: preview, shrink: shrink, toBlob: toBlob, GALLERY: GALLERY };
})();
