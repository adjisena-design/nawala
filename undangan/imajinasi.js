/* Ruang Imajinasi (owner, 23 Nov 2026, point 8, after Invitato's "Imagination Room"): on any sample invitation a couple
   puts in their own photos, names and wedding date and sees this very theme with them, working, before they buy.
   - The photos never leave the device. They are shrunk here (1000 px, JPEG) and kept in this tab's sessionStorage
     ("nawala-imajinasi"), so every other sample opened in the same tab, and the live sample in tema/'s sheet, shows them too.
   - Loaded right after live.js, before the engine: if the tab holds a set and this is a sample, the set is merged into
     the couple file (NAWALA_INVITE) and NAWALA_IMAJINASI tells the engines to accept these local pictures.
   - Then a "Ruang Imajinasi" button joins the top tools. "Terapkan" reloads the page with the set; "Unduh gambar" makes
     a picture of the cover with Nawala's watermark, after the single door (pintu.js) has taken the visitor's details once.
   - ?imajinasi=buka opens the room at once (from tema/'s sheet). */
(function () {
  'use strict';
  var D = window.NAWALA_INVITE, KEY = 'nawala-imajinasi';
  if (!D || !D.sample || window.NAWALA_LIVE || /[?&](u|preview)=/.test(location.search)) return;
  var set = null;
  try { set = JSON.parse(sessionStorage.getItem(KEY) || 'null'); } catch (e) { set = null; }

  /* ---------- merge, before the engine reads the couple file ---------- */
  function okData(u) { return typeof u === 'string' && /^data:image\/(jpeg|webp|png);base64,[A-Za-z0-9+\/=]+$/.test(u); }
  if (set) {
    window.NAWALA_IMAJINASI = true;
    var b = set.bride && String(set.bride).trim(), g = set.groom && String(set.groom).trim();
    if (b) D.bride = Object.assign({}, D.bride, { short: b.slice(0, 24), full: b.slice(0, 60) });
    if (g) D.groom = Object.assign({}, D.groom, { short: g.slice(0, 24), full: g.slice(0, 60) });
    if (/^\d{4}-\d{2}-\d{2}$/.test(set.date || '')) D.date = set.date;
    var P = set.photos || {}, ph = {};
    ['cover', 'bride', 'groom', 'side'].forEach(function (k) { if (okData(P[k])) ph[k] = P[k]; });
    var gal = (P.gallery || []).filter(okData).slice(0, 6);
    if (gal.length) ph.gallery = gal;
    D.photos = Object.assign({}, D.photos || {}, ph);
  }

  /* ---------- the room ---------- */
  var d = document;
  function en() { return d.documentElement.lang === 'en'; }
  function t(id, e) { return en() ? e : id; }
  var DASAR = /dasar\.html$/.test(location.pathname);
  var SLOTS = [
    ['cover', DASAR ? ['Foto sampul', 'Cover photo'] : ['Foto berdua (penutup)', 'Photo of you both (closing)'], 'wide'],
    ['bride', ['Mempelai wanita', 'The bride'], 'tall'],
    ['groom', ['Mempelai pria', 'The groom'], 'tall'],
    ['side', ['Gambar di samping (layar lebar)', 'Beside the invitation (wide screens)'], 'wide']
  ];
  var css = '' +
    '.imj,.imj *{box-sizing:border-box}.imj__two > *{min-width:0}' +
    '.imj{border:0;padding:0;margin:0;background:transparent;max-width:none;max-height:none;width:100%;height:100%;inset:0;display:none;color:#3A3035}' +
    '.imj[open]{display:flex;align-items:flex-end;justify-content:center}' +
    '.imj::backdrop{background:rgba(40,24,32,.42)}' +
    '.imj__box{position:relative;width:100%;max-height:88vh;display:flex;flex-direction:column;border-radius:26px 26px 0 0;background:#FFFDFB;' +
      'font:400 17px/1.5 "Plus Jakarta Sans",system-ui,sans-serif;box-shadow:0 -20px 60px -20px rgba(60,20,40,.45)}' +
    '@media (min-width:900px){.imj[open]{align-items:center;justify-content:flex-end;padding:20px}.imj__box{width:420px;max-height:calc(100vh - 40px);border-radius:26px}}' +
    '.imj__head{display:flex;align-items:center;gap:.6rem;padding:1.1rem 1.1rem .4rem}' +
    '.imj__head h2{flex:1;margin:0;font:600 1.5rem/1.15 Fraunces,Georgia,serif}' +
    '.imj__pill{display:inline-flex;align-items:center;gap:.4rem;padding:.35rem .8rem;border-radius:999px;background:#8E2F52;color:#FFFDFB;font-weight:700}' +
    '.imj__x{width:44px;height:44px;border:0;border-radius:50%;background:#FBEFF3;color:inherit;display:grid;place-items:center;cursor:pointer}' +
    '.imj svg{width:20px;height:20px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}' +
    '.imj__body{overflow:auto;padding:.2rem 1.1rem 1rem;display:grid;gap:1rem;overscroll-behavior:contain}' +
    '.imj__lead{margin:0;color:rgba(58,48,53,.8)}' +
    '.imj label{display:grid;gap:.3rem;font-weight:650}' +
    '.imj input[type=text],.imj input[type=date]{min-height:48px;padding:.5rem .85rem;border:0;border-radius:14px;background:#fff;font:inherit;font-weight:400;color:inherit;box-shadow:inset 0 0 0 1.5px rgba(58,48,53,.16)}' +
    '.imj input:focus-visible{outline:none;box-shadow:inset 0 0 0 2px #D8436B}' +
    '.imj__two{display:grid;grid-template-columns:1fr 1fr;gap:.6rem}' +
    '.imj__slot{display:grid;grid-template-columns:76px 1fr;gap:.8rem;align-items:center;padding:.6rem;border-radius:18px;background:#FBF3F5}' +
    '.imj__pic{position:relative;width:76px;height:96px;border-radius:12px;overflow:hidden;background:#F3E3E9 center/cover no-repeat;display:grid;place-items:center;color:#B96685}' +
    '.imj__slot--wide .imj__pic{height:58px}' +
    '.imj__slot b{display:block;font-weight:700}' +
    '.imj__acts{display:flex;flex-wrap:wrap;gap:.4rem;margin-top:.35rem}' +
    '.imj__btn{display:inline-flex;align-items:center;justify-content:center;gap:.4rem;min-height:44px;padding:.5rem 1rem;border:0;border-radius:999px;background:#fff;color:#3A3035;' +
      'font:inherit;font-weight:700;cursor:pointer;text-decoration:none;box-shadow:inset 0 0 0 1.5px rgba(216,67,107,.22);transition:translate .2s}' +
    '.imj__btn:hover{translate:0 -2px}.imj__btn:active{translate:0 1px}' +
    '.imj__btn--main{box-shadow:0 0 0 2px #fff,0 0 0 3.5px rgba(244,166,192,.9),0 0 20px rgba(244,166,192,.55),0 0 40px rgba(246,196,69,.3)}' +
    '.imj__btn--quiet{box-shadow:none;background:transparent;padding-inline:.6rem;text-decoration:underline;text-underline-offset:3px}' +
    '.imj__gal{display:grid;grid-template-columns:repeat(3,1fr);gap:.4rem;margin-top:.4rem}' +
    '.imj__gal i{aspect-ratio:1;border-radius:10px;background:#F3E3E9 center/cover no-repeat}' +
    '.imj__foot{display:flex;flex-wrap:wrap;gap:.6rem;padding:.9rem 1.1rem calc(1rem + env(safe-area-inset-bottom));border-top:1px solid rgba(216,67,107,.12)}' +
    '.imj__foot .imj__btn{flex:1 1 auto}' +
    '.imj__note{margin:0;font-size:17px;color:rgba(58,48,53,.7)}' +
    '.imj__busy{opacity:.6;pointer-events:none}' +
    '.tool--imj{display:inline-flex;align-items:center;gap:.4rem;background:#8E2F52!important;color:#FFFDFB!important}.tool--imj svg{width:18px;height:18px}' +
    '@media (prefers-reduced-motion:reduce){.imj__btn{transition:none}}';

  var draft = JSON.parse(JSON.stringify(set || { photos: {} }));
  draft.photos = draft.photos || {};
  var dlg;
  var CAM = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7.5h3.5L9 5h6l1.5 2.5H20V19H4V7.5ZM12 16a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"/></svg>';
  var PAL = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3.5a8.5 8.5 0 1 0 0 17c1.2 0 1.8-.8 1.8-1.7 0-1.2-1-1.6-1-2.6 0-1 .8-1.7 1.8-1.7h2.2A3.7 3.7 0 0 0 20.5 11 8 7.5 0 0 0 12 3.5Z"/><circle cx="7.5" cy="11" r="1.2"/><circle cx="10" cy="7.5" r="1.2"/><circle cx="14.5" cy="7.5" r="1.2"/></svg>';

  function shrink(file, max) {
    return new Promise(function (ok, no) {
      var url = URL.createObjectURL(file), im = new Image();
      im.onload = function () {
        var k = Math.min(1, max / Math.max(im.naturalWidth, im.naturalHeight)), c = d.createElement('canvas');
        c.width = Math.round(im.naturalWidth * k); c.height = Math.round(im.naturalHeight * k);
        c.getContext('2d').drawImage(im, 0, 0, c.width, c.height);
        URL.revokeObjectURL(url); ok(c.toDataURL('image/jpeg', .82));
      };
      im.onerror = function () { URL.revokeObjectURL(url); no(new Error('image')); };
      im.src = url;
    });
  }
  function pick(multiple) {
    return new Promise(function (ok) {
      var i = d.createElement('input'); i.type = 'file'; i.accept = 'image/*'; if (multiple) i.multiple = true;
      i.addEventListener('change', function () { ok(Array.prototype.slice.call(i.files || [])); });
      i.click();
    });
  }
  function bg(u) { return u ? 'background-image:url(' + u + ')' : ''; }

  function body() {
    var P = draft.photos, gal = P.gallery || [];
    var slots = SLOTS.map(function (s) {
      var has = !!P[s[0]];
      return '<div class="imj__slot' + (s[2] === 'wide' ? ' imj__slot--wide' : '') + '"><span class="imj__pic" style="' + bg(P[s[0]]) + '">' + (has ? '' : CAM) + '</span>' +
        '<div><b>' + t(s[1][0], s[1][1]) + '</b><div class="imj__acts"><button type="button" class="imj__btn" data-pick="' + s[0] + '">' + (has ? t('Ganti', 'Change') : t('Pilih foto', 'Choose a photo')) + '</button>' +
        (has ? '<button type="button" class="imj__btn imj__btn--quiet" data-drop="' + s[0] + '">' + t('Hapus', 'Remove') + '</button>' : '') + '</div></div></div>';
    }).join('');
    var galHtml = '<div class="imj__slot" style="grid-template-columns:1fr"><div><b>' + t('Galeri, sampai 6 foto', 'Gallery, up to 6 photos') + '</b>' +
      '<div class="imj__gal">' + [0, 1, 2, 3, 4, 5].map(function (k) { return '<i style="' + bg(gal[k]) + '"></i>'; }).join('') + '</div>' +
      '<div class="imj__acts"><button type="button" class="imj__btn" data-pick="gallery">' + (gal.length ? t('Ganti galeri', 'Change the gallery') : t('Pilih foto', 'Choose photos')) + '</button>' +
      (gal.length ? '<button type="button" class="imj__btn imj__btn--quiet" data-drop="gallery">' + t('Kosongkan', 'Clear') + '</button>' : '') + '</div></div></div>';
    return '<p class="imj__lead">' + t('Lihat tema ini dengan foto, nama, dan tanggal kalian sendiri. Foto tetap di perangkat ini dan tidak dikirim ke mana pun; tema lain yang kalian buka di tab ini ikut memakainya.',
        'See this theme with your own photos, names and date. The photos stay on this device and are not sent anywhere; other themes you open in this tab use them too.') + '</p>' +
      '<div class="imj__two"><label>' + t('Nama wanita', "Bride's name") + '<input type="text" maxlength="24" data-imj="bride" value="' + esc(draft.bride || '') + '" placeholder="' + esc(set && set.bride ? '' : 'Laras') + '"></label>' +
      '<label>' + t('Nama pria', "Groom's name") + '<input type="text" maxlength="24" data-imj="groom" value="' + esc(draft.groom || '') + '" placeholder="Bima"></label></div>' +
      '<label>' + t('Tanggal pernikahan', 'Wedding date') + '<input type="date" data-imj="date" value="' + esc(draft.date || '') + '"></label>' +
      slots + galHtml +
      '<p class="imj__note">' + t('Foto dikecilkan otomatis agar tetap ringan. Tutup tab ini untuk menghapus semuanya.', 'Photos are made smaller to stay light. Close this tab to remove them all.') + '</p>';
  }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  function build() {
    var st = d.createElement('style'); st.textContent = css; d.head.appendChild(st);
    dlg = d.createElement('dialog'); dlg.className = 'imj'; dlg.setAttribute('aria-labelledby', 'imj-h');
    dlg.innerHTML = '<div class="imj__box"><div class="imj__head"><h2 id="imj-h"></h2><button type="button" class="imj__x" data-x></button></div>' +
      '<div class="imj__body"></div><div class="imj__foot"></div></div>';
    d.body.appendChild(dlg);
    dlg.addEventListener('click', function (e) {
      if (e.target === dlg || e.target.closest('[data-x]')) return dlg.close();
      var p = e.target.closest('[data-pick]'), dr = e.target.closest('[data-drop]');
      if (p) {
        var k = p.getAttribute('data-pick');
        pick(k === 'gallery').then(function (files) {
          if (!files.length) return;
          dlg.querySelector('.imj__box').classList.add('imj__busy');
          var max = k === 'cover' || k === 'side' ? 1400 : 1000;
          return Promise.all(files.slice(0, k === 'gallery' ? 6 : 1).map(function (f) { return shrink(f, max); })).then(function (urls) {
            if (k === 'gallery') draft.photos.gallery = urls; else draft.photos[k] = urls[0];
          });
        }).then(paint, paint);
      } else if (dr) {
        var k2 = dr.getAttribute('data-drop'); delete draft.photos[k2]; paint();
      } else if (e.target.closest('[data-apply]')) apply();
      else if (e.target.closest('[data-reset]')) { try { sessionStorage.removeItem(KEY); } catch (x) {} location.reload(); }
      else if (e.target.closest('[data-dl]')) download();
    });
    dlg.addEventListener('input', function (e) { var f = e.target.getAttribute('data-imj'); if (f) draft[f] = e.target.value; });
  }
  function paint() {
    dlg.querySelector('.imj__box').classList.remove('imj__busy');
    var sc = dlg.querySelector('.imj__body').scrollTop;
    dlg.querySelector('#imj-h').innerHTML = '<span class="imj__pill">' + PAL + t('Ruang Imajinasi', 'Imagination Room') + '</span>';
    dlg.querySelector('[data-x]').innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m7 7 10 10M17 7 7 17"/></svg>';
    dlg.querySelector('[data-x]').setAttribute('aria-label', t('Tutup', 'Close'));
    dlg.querySelector('.imj__body').innerHTML = body();
    dlg.querySelector('.imj__body').scrollTop = sc;
    dlg.querySelector('.imj__foot').innerHTML =
      '<button type="button" class="imj__btn imj__btn--main" data-apply>' + t('Terapkan ke undangan', 'Apply to the invitation') + '</button>' +
      (set ? '<button type="button" class="imj__btn" data-dl>' + t('Unduh gambar', 'Download a picture') + '</button>' +
             '<button type="button" class="imj__btn imj__btn--quiet" data-reset>' + t('Kembalikan contoh', 'Back to the sample') + '</button>' : '');
  }
  function apply() {
    try { sessionStorage.setItem(KEY, JSON.stringify(draft)); }
    catch (e) { alertBox(t('Fotonya terlalu banyak untuk disimpan di tab ini. Kurangi galeri, lalu coba lagi.', 'Too many photos for this tab to keep. Use fewer in the gallery and try again.')); return; }
    var q = location.search.replace(/([?&])imajinasi=[^&]*&?/, '$1').replace(/[?&]$/, '');
    location.replace(location.pathname + q + location.hash);
  }
  function alertBox(msg) { var n = dlg.querySelector('.imj__note'); if (n) { n.textContent = msg; n.style.color = '#B3264F'; } }
  function open() { if (!dlg) build(); draft = JSON.parse(JSON.stringify(set || { photos: {} })); draft.photos = draft.photos || {}; paint(); if (dlg.showModal) dlg.showModal(); else dlg.setAttribute('open', ''); }

  /* ---------- the picture: the cover with the couple's names, date and Nawala's watermark ---------- */
  function load(src) { return new Promise(function (ok) { if (!src) return ok(null); var im = new Image(); im.onload = function () { ok(im); }; im.onerror = function () { ok(null); }; im.src = src; }); }
  function plateUrl() {
    var el = d.querySelector('.backdrop') || d.querySelector('.gate__plate') || d.querySelector('.world');
    var m = el && getComputedStyle(el).backgroundImage.match(/url\("?([^")]+)"?\)/);
    return m ? m[1] : '';
  }
  function cover(c, im, x, y, w, h) {
    var k = Math.max(w / im.naturalWidth, h / im.naturalHeight), iw = im.naturalWidth * k, ih = im.naturalHeight * k;
    c.drawImage(im, x + (w - iw) / 2, y + (h - ih) / 2, iw, ih);
  }
  function download() {
    var go = function () { make(); };
    if (window.NAWALA_PINTU) { dlg.close(); window.NAWALA_PINTU.open({ need: 'imajinasi', source: 'imajinasi', theme: (d.documentElement.getAttribute('data-kit') || ''), then: go, goLabel: ['Unduh gambar', 'Download the picture'] }); }
    else go();
  }
  function make() {
    var P = (set && set.photos) || {}, W = 1080, H = 1920, cv = d.createElement('canvas'); cv.width = W; cv.height = H;
    var c = cv.getContext('2d');
    Promise.all([load(plateUrl()), load(P.cover || P.side || (P.gallery || [])[0] || ''), load(P.bride), load(P.groom)]).then(function (im) {
      c.fillStyle = '#FBF6F1'; c.fillRect(0, 0, W, H);
      if (im[0]) cover(c, im[0], 0, 0, W, H);
      c.fillStyle = 'rgba(255,253,251,.35)'; c.fillRect(0, 0, W, H);
      /* the photo in an arch */
      var px = 150, py = 470, pw = 780, ph = 900;
      c.save(); c.beginPath(); c.moveTo(px, py + pw / 2); c.arc(px + pw / 2, py + pw / 2, pw / 2, Math.PI, 0); c.lineTo(px + pw, py + ph); c.lineTo(px, py + ph); c.closePath();
      c.fillStyle = '#fff'; c.shadowColor = 'rgba(60,20,40,.35)'; c.shadowBlur = 40; c.fill(); c.shadowBlur = 0; c.clip();
      if (im[1]) cover(c, im[1], px, py, pw, ph);
      else if (im[2] && im[3]) { cover(c, im[2], px, py, pw / 2, ph); cover(c, im[3], px + pw / 2, py, pw / 2, ph); }
      else if (im[0]) cover(c, im[0], px, py, pw, ph);
      c.restore();
      c.lineWidth = 6; c.strokeStyle = 'rgba(255,255,255,.95)'; c.beginPath(); c.moveTo(px, py + pw / 2); c.arc(px + pw / 2, py + pw / 2, pw / 2, Math.PI, 0); c.lineTo(px + pw, py + ph); c.lineTo(px, py + ph); c.closePath(); c.stroke();
      /* names and date */
      var g = c.createLinearGradient(0, 0, 0, 470); g.addColorStop(0, 'rgba(255,253,251,.92)'); g.addColorStop(1, 'rgba(255,253,251,0)'); c.fillStyle = g; c.fillRect(0, 0, W, 470);
      var g2 = c.createLinearGradient(0, 1380, 0, H); g2.addColorStop(0, 'rgba(255,253,251,0)'); g2.addColorStop(.35, 'rgba(255,253,251,.9)'); c.fillStyle = g2; c.fillRect(0, 1380, W, H - 1380);
      c.textAlign = 'center'; c.fillStyle = '#3A3035';
      c.font = '600 44px "Plus Jakarta Sans", system-ui, sans-serif'; c.fillText(t('Undangan pernikahan', 'The wedding of'), W / 2, 150);
      c.font = '600 112px Fraunces, Georgia, serif'; c.fillText(D.bride.short + ' & ' + D.groom.short, W / 2, 300, W - 120);
      var dt = new Date(D.date + 'T00:00:00');
      var ds = isNaN(dt) ? '' : dt.toLocaleDateString(en() ? 'en-GB' : 'id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
      c.font = '500 46px "Plus Jakarta Sans", system-ui, sans-serif'; c.fillText(ds, W / 2, 390);
      c.font = '700 40px "Plus Jakarta Sans", system-ui, sans-serif'; c.fillStyle = '#8E2F52'; c.fillText(t('Dibuat di Ruang Imajinasi Nawala', 'Made in the Nawala Imagination Room'), W / 2, 1560);
      c.font = '600 54px Fraunces, Georgia, serif'; c.fillText('nawalainvite.com', W / 2, 1650);
      c.font = '500 34px "Plus Jakarta Sans", system-ui, sans-serif'; c.fillStyle = 'rgba(58,48,53,.75)'; c.fillText(t('Contoh, bukan undangan resmi', 'A preview, not an official invitation'), W / 2, 1720);
      /* the watermark across the picture */
      c.save(); c.translate(W / 2, H / 2); c.rotate(-Math.PI / 7); c.font = '700 64px "Plus Jakarta Sans", system-ui, sans-serif'; c.fillStyle = 'rgba(255,255,255,.34)';
      for (var y = -1300; y < 1300; y += 260) for (var x = -1300; x < 1300; x += 700) c.fillText('nawalainvite.com', x, y);
      c.restore();
      cv.toBlob(function (blob) {
        var a = d.createElement('a'); a.href = URL.createObjectURL(blob);
        a.download = ('nawala-' + D.bride.short + '-' + D.groom.short).toLowerCase().replace(/[^a-z0-9-]+/g, '-') + '.jpg';
        d.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1500);
      }, 'image/jpeg', .9);
    });
  }

  function start() {
    var tools = d.querySelector('#tools .tools__group');
    if (tools) {
      var btn = d.createElement('button'); btn.type = 'button'; btn.className = 'tool tool--imj'; btn.id = 'imj-open';
      btn.innerHTML = PAL + '<span>' + t('Ruang Imajinasi', 'Imagination Room') + '</span>';
      btn.addEventListener('click', open);
      tools.appendChild(btn);
      var relabel = function () { var s = btn.querySelector('span'); if (s) s.textContent = t('Ruang Imajinasi', 'Imagination Room'); };
      new MutationObserver(relabel).observe(d.documentElement, { attributes: true, attributeFilter: ['lang'] });
    }
    if (/[?&]imajinasi=buka(&|$)/.test(location.search)) setTimeout(open, 600);
  }
  if (d.readyState === 'loading') d.addEventListener('DOMContentLoaded', start); else start();
})();
