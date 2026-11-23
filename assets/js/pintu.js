/* Pintu: the single door (owner, 23 Nov 2026, point 6). One short form for every reason a visitor leaves their
   details: an access code to every theme, a free consultation, the full price list, or keeping the Imagination Room's
   picture. It calls lead_door() (supabase/migrations/20261123_pintu.sql), which writes one lead and answers a fresh
   access code at once; the code is kept in this browser under "nawala-code", the key the room, tema/ and the saves read.
   If the database cannot be reached the same answers open in WhatsApp instead.
   Any element with data-pintu="kode|konsultasi|harga|imajinasi" opens it (data-paket, data-theme add context).
   Script: NAWALA_PINTU.open({ need, theme, paket, source, then(code) }), NAWALA_PINTU.code().
   Every page that loads it: the home page, tema/, the reading pages, both invitations. Styles are its own, so it looks
   the same on every page; the box grows out of the button through origin.js where that is loaded. */
(function () {
  'use strict';
  if (window.NAWALA_PINTU) return;
  var d = document, WA = '6281379211628', KEY = 'nawala-code';
  var src = (d.currentScript && d.currentScript.src) || '';
  var BASE = src.replace(/assets\/js\/pintu\.js.*$/, '') || '/';
  function en() { return d.documentElement.lang === 'en'; }
  function t(id, e) { return en() ? e : id; }
  function code() { try { return sessionStorage.getItem(KEY) || localStorage.getItem(KEY) || ''; } catch (e) { return ''; } }
  function keep(c) { try { sessionStorage.setItem(KEY, c); localStorage.setItem(KEY, c); } catch (e) {} }

  var css = '' +
    '.pintu,.pintu *{box-sizing:border-box}.pintu__row > *{min-width:0}' +
    '.pintu{border:0;padding:16px;background:transparent;max-width:none;max-height:none;width:100%;height:100%;margin:0;inset:0;display:none;place-items:center;overflow:auto}' +
    '.pintu[open]{display:grid}' +
    '.pintu::backdrop{background:rgba(70,48,58,.34)}' +
    '.pintu__box{position:relative;width:min(100%,30rem);height:fit-content;margin:auto;padding:1.5rem 1.3rem 1.4rem;border-radius:28px;background:#FFFDFB;color:#3A3035;' +
      'font:400 17px/1.55 "Plus Jakarta Sans",system-ui,sans-serif;box-shadow:0 0 0 1px rgba(216,67,107,.14),0 40px 90px -30px rgba(90,40,60,.45)}' +
    '.pintu__x{position:absolute;top:10px;right:10px;width:44px;height:44px;border:0;border-radius:50%;background:#FBEFF3;color:#3A3035;cursor:pointer;display:grid;place-items:center}' +
    '.pintu__x svg,.pintu__ok svg{width:20px;height:20px;fill:none;stroke:currentColor;stroke-width:2.2;stroke-linecap:round}' +
    '.pintu h2{margin:0 2.6rem .4rem 0;font:600 clamp(1.6rem,6vw,1.95rem)/1.12 Fraunces,Georgia,serif;letter-spacing:-.01em}' +
    '.pintu p{margin:0}.pintu__lead{color:rgba(58,48,53,.82)}' +
    '.pintu form{display:grid;gap:.85rem;margin-top:1.1rem}' +
    '.pintu label{display:grid;gap:.3rem;font-weight:650}' +
    '.pintu input[type=text],.pintu input[type=tel],.pintu select{width:100%;min-height:50px;padding:.6rem .9rem;border:0;border-radius:16px;background:#fff;color:inherit;font:inherit;font-weight:400;' +
      'box-shadow:inset 0 0 0 1.5px rgba(58,48,53,.16)}' +
    '.pintu input:focus-visible,.pintu select:focus-visible{outline:none;box-shadow:inset 0 0 0 2px #D8436B}' +
    '.pintu__row{display:grid;grid-template-columns:1.3fr 1fr;gap:.5rem}' +
    '.pintu__row.is-off{opacity:.45;pointer-events:none}' +
    '.pintu__check{display:flex!important;grid-template-columns:none;align-items:center;gap:.6rem;font-weight:500!important;min-height:44px;cursor:pointer}' +
    '.pintu__check input{width:22px;height:22px;accent-color:#D8436B;flex:none}' +
    '.pintu fieldset{border:0;margin:0;padding:0;display:grid;gap:.1rem}' +
    '.pintu legend{font-weight:650;margin-bottom:.2rem}' +
    '.pintu__err{color:#B3264F;font-weight:600}' +
    '.pintu__btn{display:inline-flex;align-items:center;justify-content:center;gap:.5rem;min-height:50px;padding:.7rem 1.35rem;border:0;border-radius:999px;font-weight:700;font-size:17px;line-height:1.2;' +
      'font-family:inherit;text-decoration:none;cursor:pointer;color:#3A3035;background:#fff;box-shadow:inset 0 0 0 1.5px rgba(216,67,107,.22);transition:translate .2s,box-shadow .2s}' +
    '.pintu__btn:hover{translate:0 -2px}.pintu__btn:active{translate:0 1px}' +
    '.pintu__btn--main{box-shadow:0 0 0 2px #fff,0 0 0 3.5px rgba(244,166,192,.9),0 0 22px rgba(244,166,192,.6),0 0 44px rgba(246,196,69,.35)}' +
    '.pintu__btn[disabled]{opacity:.6;cursor:default;translate:none}' +
    '.pintu__small{font-size:17px;color:rgba(58,48,53,.7)}' +
    '.pintu__code{display:flex;flex-wrap:wrap;align-items:center;gap:.6rem;margin:1rem 0 .4rem;padding:.9rem 1rem;border-radius:20px;background:#FBEFF3}' +
    '.pintu__code b{font:700 clamp(1.25rem,5.4vw,1.6rem)/1.2 ui-monospace,Menlo,monospace;letter-spacing:.04em;color:#8E2F52;word-break:break-all}' +
    '.pintu__code .pintu__btn{min-height:44px;padding:.5rem 1rem;margin-left:auto}' +
    '.pintu ul{margin:.6rem 0 1rem;padding:0;list-style:none;display:grid;gap:.4rem}' +
    '.pintu li{position:relative;padding-left:1.5rem}.pintu li::before{content:"";position:absolute;left:.2rem;top:.6em;width:9px;height:9px;border-radius:50%;background:#D8436B}' +
    '.pintu__acts{display:flex;flex-wrap:wrap;gap:.6rem}' +
    '@media (prefers-reduced-motion:reduce){.pintu__btn{transition:none}}';

  var dlg = null, ctx = {}, MONTHS = {
    id: ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'],
    en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'] };
  var X = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m7 7 10 10M17 7 7 17"/></svg>';
  var TITLE = {
    kode: ['Buka semua tema', 'Open every theme'],
    konsultasi: ['Konsultasi gratis', 'Free consultation'],
    harga: ['Daftar harga lengkap', 'The full price list'],
    imajinasi: ['Simpan gambar undangan kalian', 'Keep your invitation picture']
  };
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  function build() {
    var st = d.createElement('style'); st.textContent = css; d.head.appendChild(st);
    dlg = d.createElement('dialog'); dlg.className = 'pintu'; dlg.setAttribute('aria-labelledby', 'pintu-h');
    dlg.innerHTML = '<div class="pintu__box"></div>';
    d.body.appendChild(dlg);
    dlg.addEventListener('click', function (e) { if (e.target === dlg) dlg.close(); });
  }

  function formView() {
    var y = new Date().getFullYear(), L = en() ? 'en' : 'id', need = ctx.need || 'kode';
    var months = MONTHS[L].map(function (m, i) { return '<option value="' + (i + 1) + '">' + m + '</option>'; }).join('');
    var years = [0, 1, 2, 3, 4].map(function (k) { return '<option' + (k === 1 ? ' selected' : '') + '>' + (y + k) + '</option>'; }).join('');
    var tt = TITLE[need] || TITLE.kode;
    return '<button type="button" class="pintu__x" data-x aria-label="' + t('Tutup', 'Close') + '">' + X + '</button>' +
      '<h2 id="pintu-h">' + t(tt[0], tt[1]) + '</h2>' +
      '<p class="pintu__lead">' + t('Isi sekali saja. Kalian langsung mendapat kode akses ke semua tema dan ruang pasangan, dan tim kami menghubungi lewat WhatsApp.',
        'Fill this in once. You get an access code to every theme and the couple\'s room straight away, and our team contacts you on WhatsApp.') + '</p>' +
      '<form novalidate>' +
      '<label>' + t('Nama', 'Name') + '<input type="text" name="n" autocomplete="name" maxlength="80" placeholder="' + t('Nama kalian', 'Your name') + '"></label>' +
      '<label>' + t('Nomor WhatsApp', 'WhatsApp number') + '<input type="tel" name="w" autocomplete="tel" inputmode="tel" maxlength="20" placeholder="0812 3456 7890"></label>' +
      '<fieldset><legend>' + t('Bulan pernikahan', 'Wedding month') + '</legend><div class="pintu__row"><select name="m" aria-label="' + t('Bulan', 'Month') + '">' + months + '</select>' +
        '<select name="y" aria-label="' + t('Tahun', 'Year') + '">' + years + '</select></div>' +
        '<label class="pintu__check"><input type="checkbox" name="tbd">' + t('Belum ditentukan', 'Not decided yet') + '</label></fieldset>' +
      '<fieldset><legend>' + t('Yang kalian butuhkan', 'What you need') + '</legend>' +
        '<label class="pintu__check"><input type="checkbox" checked disabled>' + t('Kode akses semua tema', 'An access code to every theme') + '</label>' +
        '<label class="pintu__check"><input type="checkbox" name="konsultasi"' + (need === 'konsultasi' ? ' checked' : '') + '>' + t('Konsultasi gratis', 'A free consultation') + '</label>' +
        '<label class="pintu__check"><input type="checkbox" name="harga"' + (need === 'harga' ? ' checked' : '') + '>' + t('Daftar harga lengkap', 'The full price list') + '</label></fieldset>' +
      '<p class="pintu__err" role="alert" hidden></p>' +
      '<button class="pintu__btn pintu__btn--main" type="submit">' + t('Kirim dan dapatkan kode', 'Send and get my code') + '</button>' +
      '<p class="pintu__small">' + t('Data kalian hanya dipakai tim Nawala untuk menghubungi kalian.', 'Your details are only used by the Nawala team to contact you.') + '</p>' +
      '</form>';
  }

  function waText(a, c) {
    var when = a.m ? MONTHS[en() ? 'en' : 'id'][a.m - 1] + ' ' + a.y : t('belum ditentukan', 'not decided yet');
    var want = [];
    if (a.needs.indexOf('konsultasi') >= 0) want.push(t('konsultasi gratis', 'a free consultation'));
    if (a.needs.indexOf('harga') >= 0) want.push(t('daftar harga lengkap', 'the full price list'));
    if (ctx.paket) want.push(t('paket: ' + ctx.paket, 'package: ' + ctx.paket));
    return t('Halo Nawala, saya ' + a.n + '. Rencana pernikahan: ' + when + '.', 'Hello Nawala, I am ' + a.n + '. Wedding date: ' + when + '.') +
      (want.length ? t(' Saya ingin ', ' I would like ') + want.join(', ') + '.' : '') +
      (ctx.theme ? t(' Tema: ' + ctx.theme + '.', ' Theme: ' + ctx.theme + '.') : '') +
      (c ? t(' Kode akses saya: ' + c + '.', ' My access code: ' + c + '.') : t(' Nomor WhatsApp saya: +' + a.w + '.', ' My WhatsApp number: +' + a.w + '.'));
  }
  function waHref(text) { return 'https://wa.me/' + WA + '?text=' + encodeURIComponent(text); }

  function doneView(a, c) {
    var li = ['<li>' + t('Semua tema di koleksi Nawala terbuka di browser ini', 'Every theme in the Nawala collection is open in this browser') + '</li>',
              '<li>' + t('Ruang pasangan: simpan, saring, dan bandingkan tema', "The couple's room: save, filter and compare themes") + '</li>'];
    if (a.needs.indexOf('harga') >= 0) li.push('<li>' + t('Daftar harga lengkap kami kirim lewat WhatsApp', 'We send the full price list on WhatsApp') + '</li>');
    if (a.needs.indexOf('konsultasi') >= 0) li.push('<li>' + t('Tim kami menghubungi kalian untuk konsultasi', 'Our team contacts you for the consultation') + '</li>');
    var main = ctx.then ? '<button type="button" class="pintu__btn pintu__btn--main" data-go>' + esc(ctx.goLabel ? t(ctx.goLabel[0], ctx.goLabel[1]) : t('Lanjutkan', 'Continue')) + '</button>'
                        : '<a class="pintu__btn pintu__btn--main" href="' + BASE + 'ruang/">' + t('Buka ruang pasangan', "Open the couple's room") + '</a>';
    return '<button type="button" class="pintu__x" data-x aria-label="' + t('Tutup', 'Close') + '">' + X + '</button>' +
      '<h2 id="pintu-h" tabindex="-1">' + t('Terima kasih, ' + esc(a.n.split(' ')[0]) + '.', 'Thank you, ' + esc(a.n.split(' ')[0]) + '.') + '</h2>' +
      '<p class="pintu__lead">' + t('Ini kode akses kalian, berlaku 30 hari dan bisa kami perpanjang.', 'Here is your access code, valid for 30 days and extendable.') + '</p>' +
      '<div class="pintu__code"><b>' + esc(c) + '</b><button type="button" class="pintu__btn" data-copy>' + t('Salin', 'Copy') + '</button></div>' +
      '<ul>' + li.join('') + '</ul>' +
      '<div class="pintu__acts">' + main + '<a class="pintu__btn" href="' + waHref(waText(a, c)) + '" target="_blank" rel="noopener">' + t('Lanjut di WhatsApp', 'Continue on WhatsApp') + '</a></div>';
  }

  function handView(a) {
    return '<button type="button" class="pintu__x" data-x aria-label="' + t('Tutup', 'Close') + '">' + X + '</button>' +
      '<h2 id="pintu-h" tabindex="-1">' + t('Kirim lewat WhatsApp', 'Send it on WhatsApp') + '</h2>' +
      '<p class="pintu__lead">' + t('Data kalian belum bisa kami simpan sekarang. Kirim pesan yang sudah kami siapkan, dan kami balas dengan kode akses kalian.',
        'We cannot save your details right now. Send the message we prepared, and we reply with your access code.') + '</p>' +
      '<div class="pintu__acts" style="margin-top:1rem"><a class="pintu__btn pintu__btn--main" href="' + waHref(waText(a, '')) + '" target="_blank" rel="noopener">' + t('Buka WhatsApp', 'Open WhatsApp') + '</a></div>';
  }

  function box() { return dlg.firstElementChild; }
  function render(html) { box().innerHTML = html; wire(); }
  function wire() {
    var b = box(), f = b.querySelector('form');
    Array.prototype.forEach.call(b.querySelectorAll('[data-x]'), function (x) { x.addEventListener('click', function () { dlg.close(); }); });
    var cp = b.querySelector('[data-copy]');
    if (cp) cp.addEventListener('click', function () {
      var c = b.querySelector('.pintu__code b').textContent;
      (navigator.clipboard ? navigator.clipboard.writeText(c) : Promise.reject()).then(function () { cp.textContent = t('Tersalin', 'Copied'); }, function () {});
    });
    var go = b.querySelector('[data-go]');
    if (go) go.addEventListener('click', function () { var fn = ctx.then; dlg.close(); if (fn) fn(code()); });
    if (!f) return;
    var tbd = f.elements.tbd, row = f.querySelector('.pintu__row');
    tbd.addEventListener('change', function () { row.classList.toggle('is-off', tbd.checked); });
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var err = f.querySelector('.pintu__err'), btn = f.querySelector('[type=submit]');
      function fail(id, eng) { err.textContent = t(id, eng); err.hidden = false; }
      var n = f.elements.n.value.trim(), w = f.elements.w.value.replace(/\D/g, '');
      if (w.indexOf('0') === 0) w = '62' + w.slice(1); else if (w.indexOf('8') === 0) w = '62' + w;
      if (n.length < 2) return fail('Tulis nama kalian dulu.', 'Please write your name first.');
      if (w.length < 10 || w.length > 15) return fail('Nomor WhatsApp belum lengkap.', 'That WhatsApp number looks incomplete.');
      var a = { n: n.slice(0, 80), w: w, m: tbd.checked ? null : Number(f.elements.m.value), y: tbd.checked ? null : Number(f.elements.y.value), needs: ['kode'] };
      if (f.elements.konsultasi.checked) a.needs.push('konsultasi');
      if (f.elements.harga.checked) a.needs.push('harga');
      if (ctx.need === 'imajinasi') a.needs.push('imajinasi');
      err.hidden = true;
      var DB = window.NAWALA_DB;
      if (!DB) { render(handView(a)); return; }
      btn.disabled = true; btn.textContent = t('Mengirim', 'Sending');
      DB.rpc('lead_door', { p_name: a.n, p_whatsapp: a.w, p_month: a.m, p_year: a.y, p_needs: a.needs, p_theme: ctx.theme || null,
                             p_source: (ctx.source || 'pintu') + (ctx.paket ? ', ' + ctx.paket : ''), p_lang: en() ? 'en' : 'id' })
        .then(function (r) {
          if (r && r.code) {
            keep(r.code); render(doneView(a, r.code));
            try { d.dispatchEvent(new CustomEvent('nawala-pintu', { detail: { code: r.code, needs: a.needs } })); } catch (x) {}
            var h = box().querySelector('h2'); if (h) try { h.focus(); } catch (x) {}
            return;
          }
          if (r && r.denied === 'batas') { btn.disabled = false; btn.textContent = t('Kirim dan dapatkan kode', 'Send and get my code');
            return fail('Terlalu banyak percobaan dari jaringan ini. Coba lagi nanti, atau lanjut lewat WhatsApp.', 'Too many tries from this network. Try again later, or continue on WhatsApp.'); }
          render(handView(a));
        }, function () { render(handView(a)); });
    });
  }

  function open(o) {
    ctx = o || {};
    if (!dlg) build();
    if ((ctx.need === 'kode' || ctx.need === 'imajinasi') && code() && ctx.then) { ctx.then(code()); return; }
    render(formView());
    if (!dlg.open) { if (dlg.showModal) dlg.showModal(); else dlg.setAttribute('open', ''); }
    setTimeout(function () { var i = box().querySelector('input[name=n]'); if (i) try { i.focus({ preventScroll: true }); } catch (e) {} }, 80);
  }

  d.addEventListener('click', function (e) {
    var el = e.target.closest && e.target.closest('[data-pintu]');
    if (!el) return;
    e.preventDefault();
    open({ need: el.getAttribute('data-pintu'), paket: el.getAttribute('data-paket') || '', theme: el.getAttribute('data-theme') || '',
           source: el.getAttribute('data-source') || (location.pathname.replace(/^\/|\/$/g, '') || 'home').slice(0, 24) });
  });

  window.NAWALA_PINTU = { open: open, code: code };
})();
