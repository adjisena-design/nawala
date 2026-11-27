/* The couple's room (ruang/): what an access code opens.
   The idea from the brand brief: answer five tag questions, swipe (left to pass, right to save, with undo),
   save up to 30, then narrow 30, 15, 10, 5, 1.
   The door is the access code: the database checks it and its end date (room_open), hands back the couple's
   saved choices, and takes every change (room_save), so the team console sees them and a second phone finds them.
   Two phones on one code: the last change wins. */
(function () {
  'use strict';
  var K = window.K, N = window.NAWALA, DB = window.NAWALA_DB, $ = K.$, $$ = K.$$, t = K.t, esc = K.esc;
  var CAP = 30, RUNGS = [30, 15, 10, 5, 1];
  var bySlug = {};
  function index() { bySlug = {}; N.ALL.forEach(function (th) { bySlug[N.slug(th)] = th; }); }
  index();

  /* ---------- State ---------- */
  function blank() { return { saved: [], no: [], answers: [[], [], [], [], []], final: '', call: null }; }
  /* what the database hands back is checked again here: only themes that exist, only shapes this page draws */
  function clean(s) {
    var o = blank(); s = s || {};
    if (Array.isArray(s.saved)) s.saved.forEach(function (x) { if (bySlug[x] && o.saved.indexOf(x) < 0 && o.saved.length < CAP) o.saved.push(x); });
    if (Array.isArray(s.no)) s.no.forEach(function (x) { if (bySlug[x] && o.saved.indexOf(x) < 0 && o.no.indexOf(x) < 0) o.no.push(x); });
    if (Array.isArray(s.answers) && s.answers.length === 5) o.answers = s.answers.map(function (a) { return Array.isArray(a) ? a.filter(function (n) { return typeof n === 'number'; }) : []; });
    if (typeof s.final === 'string' && o.saved.indexOf(s.final) > -1) o.final = s.final;
    if (s.call && s.call.d && s.call.time && s.call.via) o.call = { d: String(s.call.d), time: String(s.call.time), via: String(s.call.via) };
    return o;
  }
  var state = blank(), room = null, skew = 0, saveTimer = 0, dirty = false, failed = false;
  function now() { return Date.now() + skew; }
  function push(keep) {
    if (!room) return;
    dirty = false;
    DB.rpc('room_save', { p_code: room.code, p_state: state }, keep).then(function (ok) {
      failed = false;
      if (ok === false) lock(['Masa berlaku kode ini sudah habis. Hubungi kami lewat WhatsApp dan kami perpanjang.', 'This code has reached its end date. Tell us on WhatsApp and we will extend it.']);
    }, function () {
      dirty = true;
      if (!failed) { failed = true; K.toast(t('Belum tersimpan ke Nawala. Kami coba lagi saat kalian melanjutkan.', 'Not saved to Nawala yet. We try again as you carry on.')); }
    });
  }
  /* every change is sent a moment after the last tap, and once more if the page is being closed */
  function persist() { if (!room) return; dirty = true; clearTimeout(saveTimer); saveTimer = setTimeout(push, 900); }
  window.addEventListener('pagehide', function () { if (dirty && room) { clearTimeout(saveTimer); push(true); } });
  var hist = [], mode = matchMedia('(min-width:900px)').matches ? 'all' : 'deck', cmpSel = [], tier = 'semua', q = '', warned = false;
  function isSaved(s) { return state.saved.indexOf(s) > -1; }
  function drop(list, s) { var i = list.indexOf(s); if (i > -1) list.splice(i, 1); }

  /* ---------- The five questions. Each tag is tested against a theme's tier, family, names and description. ---------- */
  var QS = [
    ['Suasana apa yang kalian bayangkan?', 'What mood do you picture?', [
      ['Hangat', 'Warm', /hangat|lilin|keemasan|senja|terakota|sampanye|lentera/], ['Megah', 'Grand', /fam-royal|istana|balairung|keraton|marmer|opera|perpustakaan/],
      ['Tenang', 'Calm', /tenang|pagi|putih|sage|kaca|awan|salju|linen/], ['Ceria', 'Bright', /bunga|tropis|taman|biru|padang|mawar/], ['Khidmat', 'Solemn', /fam-religi|akad|pemberkatan|pelita|melati/]]],
    ['Warna mana yang terasa seperti kalian?', 'Which colours feel like you?', [
      ['Putih dan gading', 'White and ivory', /putih|gading|melati|mutiara|salju/], ['Hijau', 'Green', /hijau|daun|hutan|sage|zamrud|taman/], ['Emas', 'Gold', /emas|keemasan|sampanye/],
      ['Merah muda', 'Pink', /merah muda|rose|peony|mawar/], ['Biru', 'Blue', /biru|laut|fam-elemen|langit|santorini/], ['Gelap dan dalam', 'Dark and deep', /malam|noir|marun|lentera|bintang|merah tua/]]],
    ['Di mana kalian ingin tamu merasa berada?', 'Where should your guests feel they are?', [
      ['Alam terbuka', 'Out in nature', /fam-alam|pantai|taman|hutan|padang|kebun/], ['Istana', 'A palace', /fam-royal|istana|keraton|balairung/], ['Rumah ibadah', 'A place of worship', /fam-religi/],
      ['Kota dan gedung tua', 'Old towns and halls', /fam-dunia|fam-era|opera|perpustakaan/], ['Laut', 'The sea', /laut|pantai|kapal|santorini/]]],
    ['Gaya apa yang paling dekat?', 'Which style is closest?', [
      ['Nusantara', 'Nusantara', /fam-nusa|keraton|melati|songket/], ['Mancanegara', 'From abroad', /fam-dunia/], ['Klasik', 'Classic', /klasik|fam-era|fam-royal|opera/], ['Sederhana', 'Simple', /tier-dasar/]]],
    ['Kapan cahayanya paling indah?', 'When is the light most beautiful?', [
      ['Pagi', 'Morning', /pagi|fajar|awan|putih/], ['Senja', 'Sunset', /senja|keemasan|terbenam|lilin/], ['Malam', 'Night', /malam|bintang|lentera|bulan|pelita|aurora|utara/]]]
  ];
  function hay(th) { return ('tier-' + th[0] + ' fam-' + (th[5] || '') + ' ' + th[1] + ' ' + th[3]).toLowerCase(); }
  function answered() { return state.answers.some(function (a) { return a.length; }); }
  function score(th) {
    var h = hay(th), n = 0;
    state.answers.forEach(function (picks, qi) { picks.forEach(function (oi) { if (QS[qi][2][oi] && QS[qi][2][oi][2].test(h)) n++; }); });
    return n;
  }
  function pool() { return N.ALL.filter(function (th) { return tier === 'semua' || th[0] === tier; }); }
  /* what is left to decide, closest match first (the original order breaks ties) */
  function queue() {
    var list = pool().filter(function (th) { var s = N.slug(th); return !isSaved(s) && state.no.indexOf(s) < 0; });
    if (answered()) list = list.map(function (th, i) { return [score(th), i, th]; }).sort(function (a, b) { return b[0] - a[0] || a[1] - b[1]; }).map(function (r) { return r[2]; });
    return list;
  }

  /* ---------- Small pieces ---------- */
  function tags(th) {
    return '<span class="pill pill--jalan">' + K.tierName(th[0]) + '</span>' +
      (th[0] === 'eksklusif' ? '<span class="pill pill--pink">' + t('Untuk satu pasangan', 'One couple only') + '</span>' : '') +
      (answered() && score(th) ? '<span class="pill pill--tayang">' + t('Cocok', 'A match') + '</span>' : '');
  }
  function desc(th) { return K.lang() === 'en' ? th[4] : th[3]; }
  function bigCard(th, extra) {
    return '<div class="deck__card ' + (extra || '') + '" data-slug="' + N.slug(th) + '"><img src="' + N.cover(th) + '" alt="" draggable="false">' +
      '<div class="deck__tags">' + tags(th) + '</div>' +
      (N.hasFilm(th) ? '<button type="button" class="deck__play" data-film="' + N.slug(th) + '"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.500v13l11-6.500z"/></svg>' + t('Putar film', 'Play the film') + '</button>' : '') +
      '<span class="deck__stamp deck__stamp--yes">' + t('Simpan', 'Save') + '</span><span class="deck__stamp deck__stamp--no">' + t('Lewati', 'Pass') + '</span>' +
      '<div class="deck__cap"><b>' + esc(K.themeName(th)) + '</b><span>' + esc(desc(th)) + '</span></div></div>';
  }
  /* films only ever start from a tap, and are not offered on Save-Data or slow connections (same rule as the home page) */
  function playFilm(btn) {
    var th = bySlug[btn.getAttribute('data-film')], card = btn.closest('.deck__card'), c = navigator.connection;
    if (c && (c.saveData || /2g|3g/.test(c.effectiveType || ''))) { K.toast(t('Film dilewati untuk menghemat kuota.', 'The film is skipped to save your data.')); return; }
    var v = document.createElement('video');
    v.muted = true; v.loop = true; v.playsInline = true; v.setAttribute('playsinline', ''); v.src = N.film(th);
    card.insertBefore(v, card.children[1]);
    var p = v.play(); if (p && p.catch) p.catch(function () {});
    btn.remove();
  }
  document.addEventListener('click', function (e) { var b = e.target.closest('[data-film]'); if (b) playFilm(b); });
  function ladder(el) {
    var n = state.saved.length, on = 0;
    RUNGS.forEach(function (r) { if (n && n <= r) on = r; });
    el.innerHTML = RUNGS.map(function (r) { return '<span class="' + (r === on ? 'is-on' : '') + '">' + r + '</span>'; }).join('<i></i>');
  }
  function save(s) {
    if (isSaved(s)) return true;
    if (state.saved.length >= CAP) { K.toast(t('Sudah 30 tersimpan. Lepas satu dulu di Pilihan.', 'You have 30 saved. Let one go in Saved first.')); return false; }
    state.saved.push(s); drop(state.no, s); return true;
  }
  function unsave(s) { drop(state.saved, s); if (state.final === s) state.final = ''; }

  /* ---------- Home ---------- */
  function home() {
    var n = state.saved.length, done2 = !!state.final, done3 = !!state.call;
    var steps = [
      [t('Masuk dengan kode', 'Log in with your code'), t('Kode diterima lewat WhatsApp', 'The code arrived on WhatsApp'), 'done'],
      [t('Pilih tema', 'Choose a theme'), done2 ? K.themeName(bySlug[state.final]) : n + ' ' + t('tersimpan, saring sampai satu', 'saved, narrow them to one'), done2 ? 'done' : 'now'],
      [t('Panggilan video', 'Video call'), done3 ? callText() : t('Tiga puluh menit bersama tim', 'Thirty minutes with the team'), done3 ? 'done' : done2 ? 'now' : ''],
      [t('Isi data undangan', 'Fill in your details'), ORD() ? t('Buka menu Undangan dan Tamu', 'Open Invitation and Guests in the menu') : t('Nama, tanggal, foto, dan daftar tamu', 'Names, dates, photos and the guest list'), ORD() ? 'now' : done2 && done3 ? 'now' : ''],
      [t('Tinjau, lalu tayang', 'Review, then go live'), t('Tautan pribadi untuk tiap tamu', 'A personal link for every guest'), '']
    ];
    $('#todo').innerHTML = steps.map(function (s, i) {
      return '<li class="' + (s[2] ? 'is-' + s[2] : '') + '"><i>' + (s[2] === 'done' ? K.ic('check') : i + 1) + '</i><div><b>' + s[0] + '</b><span>' + esc(s[1]) + '</span></div></li>';
    }).join('');
    var R = room || {}, exp = R.expires_at ? new Date(R.expires_at).getTime() : 0, made = R.created_at ? new Date(R.created_at).getTime() : 0;
    var left = exp ? Math.max(1, Math.ceil((exp - now()) / 864e5)) : 0;
    $('#hello').textContent = t('Selamat datang', 'Welcome') + (R.label ? ', ' + R.label : '') + '.';
    $('#me-name').textContent = R.label || ''; $('#me-code').textContent = R.code || ''; $('#key-code').textContent = R.code || '';
    $('#me-ava').textContent = (R.label || '').split(/[^A-Za-z0-9]+/).filter(Boolean).map(function (w) { return w.charAt(0); }).slice(0, 2).join('').toUpperCase();
    $('#key-until').textContent = !room ? '' : exp ? t('Berlaku sampai ', 'Valid until ') + K.date(new Date(exp)) + ', ' + left + t(' hari lagi', left === 1 ? ' day left' : ' days left') : t('Berlaku tanpa batas waktu.', 'Valid with no end date.');
    $('#key-meter').style.setProperty('--v', exp && exp > made ? Math.max(.03, Math.min(1, (exp - now()) / (exp - made))).toFixed(2) : 1);
    $('#key-wa').href = DB.wa(t('Halo Nawala, kami ' + (R.label || '') + ' (kode ' + (R.code || '') + '). Kami ingin memperpanjang masa berlaku kode kami.', 'Hello Nawala, we are ' + (R.label || '') + ' (code ' + (R.code || '') + '). We would like to extend our code.'));
    $('#gate-wa').href = DB.wa(t('Halo Nawala, saya ingin meminta kode akses atau memperpanjangnya.', 'Hello Nawala, I would like an access code, or to extend mine.'));
    $('#picks-note').textContent = n ? n + ' ' + t('dari 30 tersimpan', 'of 30 saved') : t('Belum ada yang tersimpan', 'Nothing saved yet');
    var first = state.saved.slice(0, 4);
    $('#picks').innerHTML = n ? first.map(function (s) { return '<img src="' + N.cover(bySlug[s], 'm') + '" alt="' + esc(K.themeName(bySlug[s])) + '" loading="lazy">'; }).join('') +
      (n > 4 ? '<i>+' + (n - 4) + '</i>' : '') : '<div class="empty" style="flex:1;padding:1.2rem"><b>' + t('Belum ada pilihan.', 'No saved themes yet.') + '</b>' + t('Mulai dari Jelajah.', 'Start in Browse.') + '</div>';
    $('#call-btn').textContent = done3 ? t('Ubah jadwal', 'Change the time') : t('Atur panggilan video', 'Book a video call');
    var b = $('#badge-saved'); b.textContent = n; b.hidden = !n;
  }

  /* ---------- The four stages: one stepper on top of each stage's view ---------- */
  var STAGES = [['cocok', 'Kecocokan', 'Match'], ['jelajah', 'Jelajah', 'Browse'], ['pilihan', 'Persempit', 'Narrow'], ['jadwal', 'Panggilan', 'Call']];
  function stageDone(k) { return k === 'cocok' ? answered() : k === 'jelajah' ? state.saved.length > 0 : k === 'pilihan' ? !!state.final : !!state.call; }
  function stepper(on) {
    var html = STAGES.map(function (g, i) {
      var cur = g[0] === on, done = stageDone(g[0]);
      return '<li><a href="#' + g[0] + '" class="' + (cur ? 'is-on ' : '') + (done ? 'is-done' : '') + '"' + (cur ? ' aria-current="step"' : '') + '><i>' + (done && !cur ? K.ic('check') : i + 1) + '</i><span>' + t(g[1], g[2]) + '</span></a></li>';
    }).join('');
    $$('.stepper').forEach(function (el) { el.innerHTML = html; });
    var r = $('#rail-pilih'); if (r) { if (STAGES.some(function (g) { return g[0] === on; })) r.setAttribute('aria-current', 'page'); else r.removeAttribute('aria-current'); }
  }
  /* the five questions, drawn inline; any tap re-orders the themes at once */
  function qsHTML() {
    return QS.map(function (Q, qi) {
      return '<div class="q"><h3><i>' + (qi + 1) + '</i>' + t(Q[0], Q[1]) + '</h3><div class="chips" role="group">' + Q[2].map(function (o, oi) {
        return '<button type="button" class="chip" data-q="' + qi + '" data-o="' + oi + '" aria-pressed="' + (state.answers[qi].indexOf(oi) > -1) + '">' + t(o[0], o[1]) + '</button>';
      }).join('') + '</div></div>';
    }).join('');
  }
  function curView() { var v = $('.view.is-on'); return v ? v.getAttribute('data-view') : ''; }
  function fitCount() { return N.ALL.filter(function (th) { return score(th); }).length; }
  function cocok() {
    stepper('cocok');
    $('#qs').innerHTML = qsHTML();
    var on = answered(), list = queue().slice(0, 10);
    $('#best-h').textContent = on ? fitCount() + ' ' + t('tema cocok, terdekat lebih dulu', 'matching themes, closest first') : t('Tema untuk dimulai', 'Themes to start with');
    $('#best-p').textContent = on ? t('Sepuluh teratas. Semuanya ada di Jelajah, dengan urutan yang sama.', 'The top ten. All of them are in Browse, in the same order.') : t('Jawab satu pertanyaan saja dan urutannya langsung berubah.', 'Answer just one question and the order changes at once.');
    $('#unmatch').hidden = !on;
    $('#best').innerHTML = list.map(function (th) { return tcard(th); }).join('');
  }
  function answerTap(b) {
    var qi = +b.getAttribute('data-q'), oi = +b.getAttribute('data-o'), a = state.answers[qi], at = a.indexOf(oi);
    if (at > -1) a.splice(at, 1); else a.push(oi);
    warned = false; persist();
    var v = $('.view.is-on'); v = v && v.getAttribute('data-view');
    if (v === 'cocok') cocok(); else { var open = $('#ans').open; browse(); $('#ans').open = open; }
    home();
  }

  /* ---------- Browse ---------- */
  function browse() {
    stepper('jelajah');
    $('#mode').innerHTML = [['deck', 'cards', t('Geser', 'Swipe')], ['all', 'grid', t('Semua tema', 'All themes')]].map(function (m) {
      return '<button type="button" class="chip" data-mode="' + m[0] + '" aria-pressed="' + (mode === m[0]) + '">' + K.ic(m[1]) + m[2] + '</button>';
    }).join('');
    $('#browse-note').textContent = mode === 'deck'
      ? t('Geser ke kanan untuk menyimpan, ke kiri untuk melewati. Tombol panah di papan ketik juga bisa.', 'Swipe right to save, left to pass. The arrow keys work too.')
      : t('Semua tema dalam satu halaman. Ketuk gambarnya untuk melihat warna penuh dan filmnya.', 'Every theme on one page. Tap a picture to see it in full colour, with its film.');
    $('#tier-filter').innerHTML = [['semua', t('Semua', 'All'), N.ALL.length], ['dasar', K.tierName('dasar'), N.BASIC.length], ['premium', K.tierName('premium'), N.THEMES.length], ['eksklusif', K.tierName('eksklusif'), N.EXCLUSIVE.length]].map(function (k) {
      return '<button type="button" class="chip" data-tier="' + k[0] + '" aria-pressed="' + (tier === k[0]) + '">' + k[1] + ' <b>' + k[2] + '</b></button>';
    }).join('');
    $('#deck').hidden = mode !== 'deck'; $('#all').hidden = mode !== 'all';
    if (mode === 'deck') deck(); else grid();
    answersBar();
    var n = state.saved.length;
    $('#browse-next').textContent = n ? n + ' ' + t('tersimpan. Saat terasa cukup, bandingkan dan pilih satu.', 'saved. When it feels like enough, compare them and choose one.') : t('Simpan tema yang terasa seperti kalian dengan tanda hati.', 'Save the themes that feel like you with the heart.');
  }
  function answersBar() {
    var chips = '';
    state.answers.forEach(function (picks, qi) { picks.forEach(function (oi) { var o = QS[qi][2][oi]; chips += '<span class="pill">' + t(o[0], o[1]) + '</span>'; }); });
    $('#ans-sum').innerHTML = (answered() ? '<span class="ans__l">' + t('Urutan menurut jawaban kalian', 'Ordered by your answers') + ', <b>' + fitCount() + '</b> ' + t('cocok', 'match') + '</span>' + chips
      : '<span class="ans__l">' + t('Belum ada jawaban. Jawab lima pertanyaan untuk menaruh tema terdekat di depan.', 'No answers yet. Answer five questions to put the closest themes first.') + '</span>') +
      '<span class="ans__btn">' + t('Ubah jawaban', 'Change answers') + '</span>';
    $('#qs2').innerHTML = qsHTML();
  }
  function deck() {
    var list = queue(), total = pool().length, el = $('#deck');
    if (!list.length) {
      el.innerHTML = '<div class="deck__done"><img src="' + N.BASE + 'assets/img/nawala-open-720.webp" width="200" alt=""><h2>' + t('Semua sudah kalian lihat.', 'You have seen them all.') + '</h2>' +
        '<p class="muted">' + state.saved.length + ' ' + t('tema tersimpan. Saatnya menyaring.', 'themes saved. Time to narrow them down.') + '</p>' +
        '<div class="chips" style="justify-content:center"><button type="button" class="btn btn--main" data-go="pilihan">' + t('Buka pilihan', 'Open saved') + '</button>' +
        (hist.length ? '<button type="button" class="btn btn--line" data-act="undo">' + t('Urungkan yang terakhir', 'Undo the last one') + '</button>' : '') + '</div></div>';
      return;
    }
    if (answered() && !warned && !score(list[0]) && N.ALL.some(function (th) { return score(th); })) {
      warned = true;
      K.toast(t('Tema yang cocok sudah habis. Berikutnya di luar kecocokan kalian.', 'The matching themes have run out. The next ones are outside your match.'));
    }
    el.innerHTML = '<div class="deck__stage" id="stage">' + (list[1] ? bigCard(list[1], 'is-back') : '') + bigCard(list[0]) + '</div>' +
      '<div class="deck__acts"><button type="button" class="round" data-act="no" aria-label="' + t('Lewati', 'Pass') + '">' + K.ic('x') + '</button>' +
      '<button type="button" class="round round--undo" data-act="undo" aria-label="' + t('Urungkan', 'Undo') + '"' + (hist.length ? '' : ' disabled style="opacity:.4"') + '>' + K.ic('undo') + '</button>' +
      '<button type="button" class="round round--yes" data-act="yes" aria-label="' + t('Simpan', 'Save') + '">' + K.ic('heart') + '</button></div>' +
      '<p class="deck__count">' + (total - list.length + 1) + ' ' + t('dari', 'of') + ' ' + total + ', ' + state.saved.length + ' ' + t('tersimpan', 'saved') + '</p>';
    drag($('#stage').lastElementChild);
  }
  function fling(card, dx) {
    card.classList.add('is-moving');
    card.style.transform = 'translate3d(' + (dx > 0 ? 150 : -150) + '%,0,0) rotate(' + (dx > 0 ? 18 : -18) + 'deg)';
    card.style.opacity = '0';
  }
  var busy = false;
  function decide(kind) {
    var list = queue(), th = list[0], card = $('#stage') && $('#stage').lastElementChild;
    if (!th || busy) return;
    var s = N.slug(th);
    if (kind === 'yes') { if (!save(s)) { if (card) { card.classList.add('is-moving'); card.style.transform = ''; } return; } }
    else state.no.push(s);
    hist.push(s); persist();
    busy = true;
    if (card) fling(card, kind === 'yes' ? 1 : -1);
    setTimeout(function () { busy = false; browse(); home(); }, 260);
  }
  function undo() {
    var s = hist.pop(); if (!s) return;
    drop(state.saved, s); drop(state.no, s); persist(); browse(); home();
  }
  function drag(card) {
    if (!card) return;
    var x0 = 0, dx = 0, on = false, yes = $('.deck__stamp--yes', card), no = $('.deck__stamp--no', card);
    card.addEventListener('pointerdown', function (e) {
      if (e.target.closest('button') || busy) return;
      on = true; x0 = e.clientX; dx = 0; card.classList.remove('is-moving');
      try { card.setPointerCapture(e.pointerId); } catch (err) {}
    });
    card.addEventListener('pointermove', function (e) {
      if (!on) return;
      dx = e.clientX - x0;
      card.style.transform = 'translate3d(' + dx + 'px,0,0) rotate(' + (dx / 22) + 'deg)';
      yes.style.setProperty('--s', Math.max(0, Math.min(1, dx / 90)));
      no.style.setProperty('--s', Math.max(0, Math.min(1, -dx / 90)));
    });
    function end() {
      if (!on) return; on = false;
      if (Math.abs(dx) > 90) decide(dx > 0 ? 'yes' : 'no');
      else { card.classList.add('is-moving'); card.style.transform = ''; yes.style.setProperty('--s', 0); no.style.setProperty('--s', 0); }
    }
    card.addEventListener('pointerup', end); card.addEventListener('pointercancel', end);
  }
  function tcard(th, acts) {
    var s = N.slug(th);
    return '<article class="tc"><button type="button" class="tc__open" data-peek="' + s + '" aria-label="' + esc(K.themeName(th)) + '"><span class="tc__art"><img src="' + N.cover(th, 'm') + '" alt="" loading="lazy">' +
      '<span class="tc__tags">' + (N.hasFilm(th) ? '<span class="pill pill--jalan">Film</span>' : '') + (th[0] === 'eksklusif' ? '<span class="pill pill--pink">' + t('Satu pasangan', 'One couple') + '</span>' : '') + '</span></span></button>' +
      (acts ? '' : '<button type="button" class="heart" data-heart="' + s + '" aria-pressed="' + isSaved(s) + '" aria-label="' + t('Simpan ', 'Save ') + esc(K.themeName(th)) + '">' + K.ic('heart') + '</button>') +
      '<div class="tc__in"><b>' + esc(K.themeName(th)) + '</b><span>' + K.tierName(th[0]) + (answered() && score(th) ? ', ' + t('cocok', 'a match') : '') + '</span>' + (acts || '') + '</div></article>';
  }
  function grid() {
    var list = pool().filter(function (th) { return !q || (th[1] + ' ' + th[2]).toLowerCase().indexOf(q) > -1; });
    if (answered()) list = list.map(function (th, i) { return [score(th), i, th]; }).sort(function (a, b) { return b[0] - a[0] || a[1] - b[1]; }).map(function (r) { return r[2]; });
    $('#theme-grid').innerHTML = list.length ? list.map(function (th) { return tcard(th); }).join('')
      : '<div class="empty" style="grid-column:1 / -1"><b>' + t('Tidak ada tema dengan nama itu.', 'No theme has that name.') + '</b>' + t('Coba kata lain.', 'Try another word.') + '</div>';
  }

  /* ---------- Narrow: two to four saved themes side by side, then one final choice ---------- */
  function cmpClean() {
    cmpSel = cmpSel.filter(function (x) { return isSaved(x); });
    if (!cmpSel.length) cmpSel = (state.final ? [state.final] : []).concat(state.saved.filter(function (x) { return x !== state.final; })).slice(0, Math.min(3, state.saved.length));
  }
  function saved() {
    stepper('pilihan'); cmpClean();
    ladder($('#ladder'));
    var f = $('#final'), n = state.saved.length;
    $('#prog-t').textContent = n + ' ' + t('tersimpan', 'saved');
    f.hidden = !state.final;
    if (state.final) {
      f.innerHTML = '<img src="' + N.BASE + 'assets/img/nawala-open-720.webp" width="720" height="619" alt=""><div><b>' + t('Tema pilihan kalian: ', 'Your chosen theme: ') + esc(K.themeName(bySlug[state.final])) + '</b>' +
        '<span class="small">' + t('Tim Nawala bisa melihat pilihan ini. Kalian masih boleh menggantinya.', 'The Nawala team can see this choice. You may still change it.') + '</span></div>' +
        '<div class="chips" style="margin-left:auto"><button type="button" class="btn btn--line btn--sm" data-unfinal>' + t('Ganti', 'Change') + '</button><button type="button" class="btn btn--main btn--sm" data-go="jadwal">' + t('Atur panggilan', 'Book the call') + '</button></div>';
    }
    var c = $('#cmp');
    if (!n) c.innerHTML = '<div class="empty"><b>' + t('Belum ada yang tersimpan.', 'Nothing saved yet.') + '</b>' + t('Simpan tema di Jelajah dengan tanda hati, lalu bandingkan di sini.', 'Save themes in Browse with the heart, then compare them here.') +
      '<div style="margin-top:1rem"><button type="button" class="btn btn--main" data-go="jelajah">' + t('Mulai menjelajah', 'Start browsing') + '</button></div></div>';
    else {
      c.style.setProperty('--n', cmpSel.length);
      c.innerHTML = cmpSel.map(function (s) {
        var th = bySlug[s], fin = state.final === s;
        return '<article class="cmp__col' + (fin ? ' is-final' : '') + '"><div class="cmp__art" data-slug="' + s + '"><img src="' + N.cover(th) + '" alt="" loading="lazy">' +
          (N.hasFilm(th) ? '<button type="button" class="deck__play" data-film="' + s + '"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13l11-6.5z"/></svg>' + t('Putar film', 'Play the film') + '</button>' : '') +
          '<button type="button" class="cmp__x round" data-cmp="' + s + '" aria-label="' + t('Keluarkan dari perbandingan', 'Take out of the comparison') + '">' + K.ic('x') + '</button></div>' +
          '<div class="cmp__in"><span class="pill pill--jalan">' + K.tierName(th[0]) + '</span>' + (answered() && score(th) ? ' <span class="pill pill--tayang">' + t('Cocok', 'A match') + '</span>' : '') +
          '<b>' + esc(K.themeName(th)) + '</b><p>' + esc(desc(th)) + '</p>' +
          '<div class="cmp__acts"><button type="button" class="btn btn--line" data-unsave="' + s + '">' + t('Lepas', 'Let go') + '</button>' +
          '<button type="button" class="btn btn--line' + (fin ? ' is-chosen' : '') + '" data-final="' + s + '"' + (fin ? ' disabled' : '') + '>' + (fin ? t('Terpilih', 'Chosen') : t('Pilih ini', 'Choose this')) + '</button></div></div></article>';
      }).join('') + (cmpSel.length < 4 && n > cmpSel.length ? '<div class="cmp__add">' + t('Tambah dari daftar di bawah dengan Bandingkan.', 'Add one from the list below with Compare.') + '</div>' : '');
    }
    $('#saved-grid').innerHTML = n ? state.saved.map(function (s) {
      var on = cmpSel.indexOf(s) > -1;
      return tcard(bySlug[s], '<div class="tc__acts"><button type="button" class="btn btn--line btn--sm" data-cmp="' + s + '" aria-pressed="' + on + '">' + (on ? t('Dibandingkan', 'Comparing') : t('Bandingkan', 'Compare')) + '</button>' +
        '<button type="button" class="btn btn--line btn--sm" data-unsave="' + s + '">' + t('Lepas', 'Let go') + '</button></div>');
    }).join('') : '';
  }

  /* ---------- Video call ---------- */
  var pick = { d: 0, time: '16.00', via: 'Google Meet' };
  function slotDays() { var out = [], i = 1; while (out.length < 6) { var d = K.plusDays(i++); if (d.getDay()) out.push(d); } return out; }
  function callText() {
    var d = new Date(state.call.d);
    return K.day(d) + ', ' + K.date(d) + ', ' + state.call.time + ' WIB, ' + state.call.via;
  }
  function schedule() {
    stepper('jadwal');
    $('#days').innerHTML = slotDays().map(function (d, i) { return '<button type="button" class="chip" data-d="' + i + '" aria-pressed="' + (pick.d === i) + '">' + K.day(d).slice(0, 3) + ' <b>' + K.date(d, true) + '</b></button>'; }).join('');
    $('#times').innerHTML = ['10.00', '13.00', '16.00', '19.30'].map(function (h) { return '<button type="button" class="chip" data-h="' + h + '" aria-pressed="' + (pick.time === h) + '">' + h + '</button>'; }).join('');
    $('#via').innerHTML = ['Google Meet', 'WhatsApp'].map(function (v) { return '<button type="button" class="chip" data-v="' + v + '" aria-pressed="' + (pick.via === v) + '">' + K.ic('video') + v + '</button>'; }).join('');
    var b = $('#booked'); b.hidden = !state.call;
    $('#book').textContent = state.call ? t('Ubah ke jadwal ini', 'Change to this time') : t('Pesan jadwal ini', 'Book this time');
    if (state.call) b.innerHTML = '<img src="' + N.BASE + 'assets/img/nawala-open-720.webp" width="720" height="619" alt=""><div><b>' + esc(callText()) + '</b>' +
      '<span class="small">' + t('Permintaan jadwal ini tercatat di tim. Kabari kami lewat WhatsApp supaya cepat dikonfirmasi.', 'The team has this requested time. Tell us on WhatsApp so we confirm it quickly.') + '</span></div>' +
      '<a class="btn btn--main btn--sm" target="_blank" rel="noopener" href="' + esc(DB.wa(t('Halo Nawala, kami ' + ((room || {}).label || '') + '. Kami meminta panggilan video pada ' + callText() + '.', 'Hello Nawala, we are ' + ((room || {}).label || '') + '. We would like a video call on ' + callText() + '.'))) + '">' + t('Kabari lewat WhatsApp', 'Tell us on WhatsApp') + '</a>';
  }

  /* ---------- Pop-ups ---------- */
  function openPop(d) { if (d.showModal) { if (!d.open) d.showModal(); } else d.setAttribute('open', ''); }
  function closePop(d) { if (d.close) d.close(); else d.removeAttribute('open'); }
  $$('dialog').forEach(function (d) { d.addEventListener('click', function (e) { if (e.target === d || e.target.closest('[data-close]')) closePop(d); }); });
  var peeked = '';
  function peek(s) {
    var th = bySlug[s]; peeked = s;
    $('#peek-stage').innerHTML = bigCard(th);
    $('#peek-tier').textContent = K.tierName(th[0]) + (th[0] === 'eksklusif' ? ', ' + t('untuk satu pasangan saja', 'for one couple only') : '');
    $('#peek-name').textContent = K.themeName(th);
    $('#peek-desc').textContent = desc(th);
    $('#peek-save').textContent = isSaved(s) ? t('Lepas dari pilihan', 'Remove from saved') : t('Simpan ke pilihan', 'Save this theme');
    openPop($('#pop-theme'));
  }
  $('#peek-save').addEventListener('click', function () {
    if (isSaved(peeked)) unsave(peeked); else if (!save(peeked)) return;
    persist(); closePop($('#pop-theme')); all();
  });

  /* ---------- Clicks and keys ---------- */
  document.addEventListener('click', function (e) {
    var el;
    if ((el = e.target.closest('[data-q]'))) answerTap(el);
    else if (e.target.closest('[data-match]')) K.go('cocok');
    else if (e.target.closest('[data-unmatch]')) { state.answers = [[], [], [], [], []]; persist(); cocok(); home(); }
    else if ((el = e.target.closest('[data-cmp]'))) {
      var cs = el.getAttribute('data-cmp'), ci = cmpSel.indexOf(cs);
      if (ci > -1) { if (cmpSel.length > 1) cmpSel.splice(ci, 1); }
      else { if (cmpSel.length >= 4) { K.toast(t('Paling banyak empat berdampingan. Keluarkan satu dulu.', 'Four side by side at most. Take one out first.')); return; } cmpSel.push(cs); }
      saved(); if (ci < 0) { var top = $('#cmp'); if (top && top.getBoundingClientRect().top < 0) top.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
    }
    else if ((el = e.target.closest('[data-mode]'))) { mode = el.getAttribute('data-mode'); browse(); }
    else if ((el = e.target.closest('[data-tier]'))) { tier = el.getAttribute('data-tier'); browse(); }
    else if ((el = e.target.closest('[data-act]'))) { var a = el.getAttribute('data-act'); if (a === 'undo') undo(); else decide(a); }
    else if ((el = e.target.closest('[data-heart]'))) { var s = el.getAttribute('data-heart'); if (isSaved(s)) unsave(s); else if (!save(s)) return; persist(); el.setAttribute('aria-pressed', isSaved(s)); home(); stepper(curView()); }
    else if ((el = e.target.closest('[data-peek]'))) peek(el.getAttribute('data-peek'));
    else if ((el = e.target.closest('[data-unsave]'))) { unsave(el.getAttribute('data-unsave')); persist(); all(); }
    else if ((el = e.target.closest('[data-final]'))) { state.final = el.getAttribute('data-final'); if (cmpSel.indexOf(state.final) < 0) cmpSel.unshift(state.final); persist(); all(); window.scrollTo(0, 0); }
    else if (e.target.closest('[data-unfinal]')) { state.final = ''; persist(); all(); }
    else if ((el = e.target.closest('[data-d]'))) { pick.d = +el.getAttribute('data-d'); schedule(); }
    else if ((el = e.target.closest('[data-h]'))) { pick.time = el.getAttribute('data-h'); schedule(); }
    else if ((el = e.target.closest('[data-v]'))) { pick.via = el.getAttribute('data-v'); schedule(); }
  });
  $('#book').addEventListener('click', function () {
    state.call = { d: slotDays()[pick.d].toISOString(), time: pick.time, via: pick.via };
    persist(); schedule(); home();
  });
  $('#search').addEventListener('input', function () { q = this.value.trim().toLowerCase(); grid(); });
  document.addEventListener('keydown', function (e) {
    if (mode !== 'deck' || !$('.view.is-on') || $('.view.is-on').getAttribute('data-view') !== 'jelajah') return;
    if ($('dialog[open]') || /input|textarea/i.test(e.target.tagName)) return;
    if (e.key === 'ArrowRight') decide('yes'); else if (e.key === 'ArrowLeft') decide('no'); else if (e.key === 'Backspace') undo();
  });

  /* ---------- The door ---------- */
  var STORE = 'nawala-code', gateNote = null;   /* the same key the home page's log-in box writes */
  function stored() { try { return sessionStorage.getItem(STORE) || localStorage.getItem(STORE) || ''; } catch (e) { return ''; } }
  function forget() { try { sessionStorage.removeItem(STORE); localStorage.removeItem(STORE); } catch (e) {} }
  function note(pair) { gateNote = pair || null; var m = $('#gate-msg'); m.hidden = !pair; m.textContent = pair ? t(pair[0], pair[1]) : ''; }
  function lock(pair) {
    room = null; dirty = false; clearTimeout(saveTimer); forget(); window.NAWALA_PM.reset();
    $$('dialog[open]').forEach(closePop);
    document.body.classList.add('is-locked');
    $('#gate-code').value = ''; note(pair);
  }
  function enter(code) {
    $('#gate-go').disabled = true; note(null);
    return DB.rpc('room_open', { p_code: code }).then(function (r) {
      if (!r) {
        forget();
        note(['Kode ini tidak dikenali, atau masa berlakunya sudah habis. Hubungi kami lewat WhatsApp dan kami perpanjang.', 'This code is not recognised, or it has reached its end date. Tell us on WhatsApp and we will extend it.']);
        return;
      }
      room = r; skew = new Date(r.now).getTime() - Date.now(); hist = []; warned = false;
      try { sessionStorage.setItem(STORE, r.code); localStorage.setItem(STORE, r.code); } catch (e) {}
      $('#gate-code').value = '';
      /* the themes the site shows today (the team edits them), then the couple's own choices */
      return N.load().then(function () {
        index(); state = clean(r.state); ordForm = null;
        document.body.classList.remove('is-locked');
        all(); K.show(location.hash.slice(1));
      });
    }, function () {
      note(['Kode belum bisa diperiksa karena database Nawala tidak terhubung. Coba lagi sebentar lagi, atau hubungi kami lewat WhatsApp.', 'The code cannot be checked because the Nawala database is out of reach. Try again in a moment, or ask us on WhatsApp.']);
    }).then(function () { $('#gate-go').disabled = false; });
  }
  $('#gate-form').addEventListener('submit', function (e) {
    e.preventDefault();
    var code = $('#gate-code').value.replace(/[^A-Za-z0-9-]/g, '').toUpperCase() || stored();
    if (code.length < 4) { note(['Tulis kode akses kalian di sini.', 'Write your access code here.']); $('#gate-code').focus(); return; }
    enter(code);
  });
  $('#logout').addEventListener('click', function () { if (dirty) { clearTimeout(saveTimer); push(true); } lock(null); });

  /* ---------- Our invitation: the couple fills it in once they have ordered; the team checks it and publishes ---------- */
  var B = window.NAWALA_BUILDER, ordForm = null;
  function ORD() { return room && room.order; }
  function liveLink(name) { var o = ORD(); return DB.site + o.slug + (name ? '?to=' + encodeURIComponent(name) : ''); }
  function order() {
    var o = ORD();
    $('#rail-ord').hidden = !o; $('#rail-guests').hidden = !o; $('#rail-seat').hidden = !o; $('#rail-pm').hidden = !o;
    if (!o) { $('#ord-form').innerHTML = '<div class="empty"><b>' + t('Belum ada pesanan.', 'No order yet.') + '</b>' + t('Halaman ini terbuka setelah kalian memesan lewat tim Nawala.', 'This page opens once you have ordered through the Nawala team.') + '</div>'; $('#ord-tools').hidden = true; return; }
    $('#ord-tools').hidden = false;
    var st = { isi: t('Silakan isi. Semua tersimpan otomatis.', 'Fill it in. Everything saves as you type.'),
      periksa: t('Terkirim. Tim Nawala sedang memeriksa; kalian masih boleh mengubah.', 'Sent. The Nawala team is checking it; you may still make changes.'),
      tayang: t('Undangan kalian sudah tayang di ', 'Your invitation is live at ') + 'nawalainvite.com/' + o.slug + t('. Perubahan baru tampil setelah diperiksa tim.', '. New changes show once the team has checked them.') }[o.status] || '';
    $('#ord-note').textContent = st;
    $('#ord-submit').hidden = o.status === 'tayang';
    /* the design editor: Dasar themes first */
    var rows = N.ALL.map(function (e) { var sl = N.slug(e), m = N.meta(sl) || {}; return { slug: sl, tier: e[0], kit: m.kit || (e[0] === 'dasar' ? sl : null) }; });
    var ed = $('#ord-design'); ed.hidden = !(o.theme && B.route(o.theme, rows).route === 'dasar');
    ed.href = '../undangan/sunting.html?as=ruang&u=' + encodeURIComponent(o.slug);
    var stu = $('#ord-studio'); if (stu) { stu.hidden = ed.hidden; stu.href = '../undangan/studio.html?as=ruang&u=' + encodeURIComponent(o.slug); }
    $('#ord-submit').textContent = o.status === 'periksa' ? t('Kirim ulang untuk diperiksa', 'Send for a check again') : t('Kirim untuk diperiksa', 'Send for a check');
    if (!ordForm) ordForm = B.form($('#ord-form'), o.draft, { slug: o.slug, who: function () { return room.code; }, onChange: function (d) {
      o.draft = d;
      DB.rpc('room_order_save', { p_code: room.code, p_draft: d }).then(function (ok) {
        if (ok === false) lock(['Masa berlaku kode ini sudah habis. Hubungi kami lewat WhatsApp dan kami perpanjang.', 'This code has reached its end date. Tell us on WhatsApp and we will extend it.']);
      }, function () { K.toast(t('Belum tersimpan ke Nawala. Kami coba lagi saat kalian melanjutkan.', 'Not saved to Nawala yet. We try again as you carry on.')); });
    } });
  }
  $('#ord-submit').addEventListener('click', function () {
    var o = ORD(); if (!o) return;
    if (ordForm) ordForm.flush();
    var miss = B.missing(B.norm(o.draft));
    if (miss.length) return K.toast(t('Lengkapi dulu: ', 'First complete: ') + miss.join(', '));
    DB.rpc('room_order_submit', { p_code: room.code }).then(function () {
      if (o.status === 'isi') o.status = 'periksa'; order();
      K.toast(t('Terkirim ke tim Nawala. Kami kabari lewat WhatsApp.', 'Sent to the Nawala team. We will reply on WhatsApp.'));
    }, function () { K.offline ? K.offline() : null; });
  });
  $('#ord-preview').addEventListener('click', function () {
    var o = ORD(); if (!o) return; if (ordForm) ordForm.flush();
    $('#room-pv').hidden = false;
    var rows = N.ALL.map(function (e) { var sl = N.slug(e), m = N.meta(sl) || {}; return { slug: sl, tier: e[0], kit: m.kit || (e[0] === 'dasar' ? sl : null) }; });
    B.preview($('#room-frame'), o.draft, o, rows, t('Tamu undangan', 'Our guest'));
  });
  $('#room-pv-x').addEventListener('click', function () { $('#room-pv').hidden = true; $('#room-frame').src = 'about:blank'; });

  /* ---------- Guests: one link each, sent on WhatsApp ---------- */
  function message(g) {
    var o = ORD(), en = K.lang() === 'en';
    return en ? 'Dear ' + g.name + ',\n\nWith joy we invite you to our wedding.\n\nOpen the invitation: ' + liveLink(g.name) + '\n\nIt would mean a great deal to us if you could come and give us your blessing.\n\nWith love,\n' + o.couple
      : 'Kepada Yth. ' + g.name + ',\n\nTanpa mengurangi rasa hormat, kami mengundang Bapak/Ibu/Saudara/i untuk hadir di hari pernikahan kami.\n\nBuka undangan: ' + liveLink(g.name) + '\n\nMerupakan kehormatan bagi kami bila Bapak/Ibu/Saudara/i berkenan hadir dan memberikan doa restu.\n\nKami yang berbahagia,\n' + o.couple;
  }
  function guests() {
    var o = ORD(); if (!o) return;
    var list = o.guests || [], ans = { hadir: [t('Hadir', 'Coming'), 'tayang'], tidak: [t('Tidak hadir', 'Not coming'), 'habis'], ragu: [t('Belum pasti', 'Not sure'), 'jalan'] };
    $('#g-note').textContent = (o.live ? t('Tiap tamu punya tautan sendiri: namanya tertulis di amplop.', 'Each guest has their own link: their name is on the envelope.')
      : t('Tautan sudah bisa disalin, tetapi baru terbuka setelah undangan tayang.', 'Links can be copied now, but they open only once the invitation is live.')) + ' ' + list.length + ' ' + t('tamu', list.length === 1 ? 'guest' : 'guests') + '.';
    $('#g-list').innerHTML = list.length ? list.map(function (g, i) {
      var a = g.answer && ans[g.answer];
      return '<div class="row"><div class="row__t"><b>' + esc(g.name) + '</b><span>' + (g.party || 1) + ' ' + t('orang', 'people') + (g.grp ? ', ' + esc(g.grp) : '') + ', ' + (g.phone ? esc(g.phone.replace(/^62/, '0')) + ', ' : '') + (g.sent_at ? t('sudah dikirim', 'sent') : t('belum dikirim', 'not sent yet')) + (a ? '' : ', ' + t('belum menjawab', 'no answer yet')) + '</span></div>' +
        (a ? '<span class="pill pill--' + a[1] + '">' + a[0] + '</span>' : '') +
        '<a class="btn btn--line btn--sm" target="_blank" rel="noopener" data-sent="' + i + '" href="' + esc((g.phone ? 'https://wa.me/' + g.phone.replace(/^0/, '62') : 'https://wa.me/') + '?text=' + encodeURIComponent(message(g))) + '">WhatsApp</a>' +
        '<button type="button" class="round" style="width:44px;height:44px" data-glink="' + i + '" aria-label="' + t('Salin tautan', 'Copy the link') + '">' + K.ic('copy') + '</button>' +
        '<button type="button" class="round" style="width:44px;height:44px" data-gdel="' + i + '" aria-label="' + t('Hapus dari daftar', 'Remove from the list') + '">' + K.ic('x') + '</button></div>';
    }).join('') : '<div class="empty"><b>' + t('Daftar masih kosong.', 'The list is empty.') + '</b>' + t('Tempel nama tamu di kotak, satu nama per baris.', 'Paste guest names in the box, one per line.') + '</div>';
  }
  function saveGuests(list, done) {
    DB.rpc('room_guests_save', { p_code: room.code, p_guests: list.map(function (g) { return { name: g.name, phone: g.phone || '', sent: !!g.sent_at, party: g.party || 1, grp: g.grp || '' }; }) }).then(function (ok) {
      if (!ok) throw new Error('no');
      return DB.rpc('room_open', { p_code: room.code }).then(function (r) { if (r && r.order) { room.order.guests = r.order.guests; } guests(); if (done) done(); });
    }).catch(function () { K.toast(t('Daftar tamu belum tersimpan. Coba lagi.', 'The guest list was not saved. Try again.')); });
  }
  $('#g-add').addEventListener('submit', function (e) {
    e.preventDefault();
    var o = ORD(); if (!o) return;
    var lines = $('#g-paste').value.split(/\n+/).map(function (l) { return l.trim(); }).filter(Boolean);
    if (!lines.length) return K.toast(t('Tulis minimal satu nama.', 'Write at least one name.'));
    var list = (o.guests || []).slice();
    lines.forEach(function (l) {
      /* name, then in any order after commas: a WhatsApp number, the number of people (1 to 20), a group */
      var parts = l.split(/[,;\t]/).map(function (x) { return x.trim(); }), name = parts.shift().slice(0, 80), phone = '', party = 1, grp = '';
      parts.forEach(function (x) {
        if (/^[+0-9][0-9 .\-]{7,}$/.test(x)) phone = x.replace(/\D/g, '').replace(/^0/, '62');
        else if (/^\d{1,2}$/.test(x)) party = Math.max(1, Math.min(20, +x));
        else if (x) grp = x.slice(0, 40);
      });
      if (name && !list.some(function (g) { return g.name.toLowerCase() === name.toLowerCase(); })) list.push({ name: name, phone: phone, party: party, grp: grp });
    });
    saveGuests(list, function () { $('#g-paste').value = ''; K.toast(t('Daftar tamu tersimpan.', 'Guest list saved.')); });
  });
  $('#g-list').addEventListener('click', function (e) {
    var o = ORD(); if (!o) return;
    var el, list = (o.guests || []).slice();
    if ((el = e.target.closest('[data-glink]'))) {
      var u = liveLink(list[+el.getAttribute('data-glink')].name);
      try { navigator.clipboard.writeText(u).then(function () { K.toast(t('Tautan disalin.', 'Link copied.')); }, function () { K.toast(u); }); } catch (er) { K.toast(u); }
    } else if ((el = e.target.closest('[data-gdel]'))) {
      list.splice(+el.getAttribute('data-gdel'), 1); saveGuests(list);
    } else if ((el = e.target.closest('[data-sent]'))) {
      var g = list[+el.getAttribute('data-sent')]; if (!g.sent_at) { g.sent_at = new Date().toISOString(); saveGuests(list); }
    }
  });

  function all() {
    home(); cocok(); browse(); saved(); schedule(); order(); guests();
    stepper(curView());
    if (gateNote) note(gateNote);
    document.title = t('Nawala, ruang pasangan', 'Nawala, the couple\'s room');
  }
  /* a view is drawn again each time it is opened, so it never shows what was true a few taps ago */
  /* ---------- Persiapan: our wedding's plan with the team (assets/js/persiapan.js) ---------- */
  window.NAWALA_PM.mount({ root: $('#pm-root'), as: 'pasangan', who: function () { return room && room.code; },
    onBadge: function (n) { var b = $('#badge-pm'); b.hidden = !n; b.textContent = n || ''; } });
  K.onShow.persiapan = function () { if (ORD()) window.NAWALA_PM.show(); };
  K.onShow.beranda = home; K.onShow.cocok = cocok; K.onShow.jelajah = browse; K.onShow.pilihan = saved; K.onShow.jadwal = schedule; K.onShow.tamu = guests;
  K.onLang(all);
  K.start();
  if (stored()) enter(stored()); else $('#gate-code').focus();
})();
