/* Demo mode for the couple's room (ruang/?demo=persiapan or ruang/?demo=tema). Owner, 23 Nov 2026: visitors and
   investors try the real room with the sample couple Laras & Bima, with no code and nothing saved.
   Loaded right after db.js. Outside demo mode it does nothing. In demo mode every database call is answered here,
   in memory (only the public list of themes still comes from the database), the door opens by itself, a guide bar
   with steps stands above the room, and the browser's own "nawala-code" is never read or written. */
(function () {
  'use strict';
  var m = /[?&]demo=(persiapan|tema)\b/.exec(location.search); if (!m) return;
  var MODE = m[1], DB = window.NAWALA_DB, real = DB.rpc, CODE = 'NAWALA-CONTOH01';
  document.documentElement.classList.add('is-demo', 'is-demo-' + MODE);

  /* the room keeps its code under "nawala-code"; a demo must not touch the visitor's real one */
  var get = Storage.prototype.getItem, put = Storage.prototype.setItem, del = Storage.prototype.removeItem;
  Storage.prototype.getItem = function (k) { return k === 'nawala-code' ? CODE : get.call(this, k); };
  Storage.prototype.setItem = function (k, v) { if (k !== 'nawala-code') put.call(this, k, v); };
  Storage.prototype.removeItem = function (k) { if (k !== 'nawala-code') del.call(this, k); };

  function pad(n) { return String(n).padStart(2, '0'); }
  function iso(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function plus(s, n) { var p = s.split('-'), d = new Date(+p[0], +p[1] - 1, +p[2], 12); d.setDate(d.getDate() + n); return iso(d); }
  var TODAY = iso(new Date()), WED = plus(TODAY, 201), n = 0;
  function id() { n++; return '00000000-0000-4000-8000-' + String(n).padStart(12, '0'); }

  /* ---------------- the sample wedding plan: the real templates (20261123_persiapan.sql), partly done ---------------- */
  var T = [
    ['1', '', 'Undangan digital Nawala', 'Nawala digital invitation'],
    ['1.1', '1', 'Pilih tema undangan', 'Choose the invitation theme', -120, 7, 'pasangan'],
    ['1.2', '1', 'Isi data mempelai dan acara', 'Fill in the couple and event details', -100, 10, 'pasangan'],
    ['1.3', '1', 'Unggah foto pasangan dan galeri', 'Upload the couple and gallery photos', -95, 10, 'pasangan'],
    ['1.4', '1', 'Sunting desain undangan', 'Edit the invitation design', -85, 10, 'pasangan'],
    ['1.5', '1', 'Pemeriksaan oleh tim Nawala', 'Check by the Nawala team', -75, 5, 'tim'],
    ['1.6', '1', 'Terbitkan undangan', 'Publish the invitation', -70, 1, 'tim'],
    ['1.7', '1', 'Susun daftar tamu dan kirim undangan', 'Build the guest list and send the invitation', -45, 21, 'pasangan'],
    ['2', '', 'Layanan hari H', 'Wedding-day services'],
    ['2.1', '2', 'Susun denah dan kursi', 'Lay out the floor plan and seats', -21, 10, 'pasangan'],
    ['2.2', '2', 'Siapkan QR buku tamu', 'Prepare the guestbook QR', -10, 5, 'tim'],
    ['2.3', '2', 'Atur suvenir per tamu', 'Set the souvenir per guest', -10, 5, 'tim'],
    ['2.4', '2', 'Rekap RSVP final', 'Final RSVP count', -5, 3, 'tim'],
    ['3', '', 'Perencanaan awal', 'Early planning'],
    ['3.1', '3', 'Tetapkan total anggaran', 'Set the total budget', -330, 14, 'pasangan'],
    ['3.2', '3', 'Tetapkan tanggal dan konsep acara', 'Fix the date and the concept', -320, 14, 'pasangan'],
    ['3.3', '3', 'Daftar tamu awal', 'First guest list', -300, 21, 'pasangan'],
    ['4', '', 'Tempat dan katering', 'Venue and catering'],
    ['4.1', '4', 'Survei tempat acara', 'Visit venues', -290, 21, 'tim'],
    ['4.2', '4', 'Pesan tempat dan bayar DP', 'Book the venue and pay the deposit', -270, 7, 'pasangan'],
    ['4.3', '4', 'Tes rasa katering', 'Catering tasting', -240, 14, 'pasangan'],
    ['4.4', '4', 'Pesan katering', 'Book the caterer', -225, 7, 'pasangan'],
    ['5', '', 'Busana dan rias', 'Attire and make-up'],
    ['5.1', '5', 'Pilih MUA', 'Choose the make-up artist', -210, 14, 'pasangan'],
    ['5.2', '5', 'Busana akad', 'Ceremony attire', -180, 30, 'pasangan'],
    ['5.3', '5', 'Busana resepsi', 'Reception attire', -180, 30, 'pasangan'],
    ['5.4', '5', 'Fitting busana', 'Attire fitting', -40, 7, 'pasangan'],
    ['6', '', 'Dekorasi dan hiburan', 'Decor and entertainment'],
    ['6.1', '6', 'Pilih dekorasi', 'Choose the decor', -200, 21, 'tim'],
    ['6.2', '6', 'Musik dan hiburan', 'Music and entertainment', -150, 21, 'tim'],
    ['6.3', '6', 'Pilih MC', 'Choose the MC', -120, 14, 'tim'],
    ['7', '', 'Dokumentasi', 'Photo and video'],
    ['7.1', '7', 'Pesan foto dan video', 'Book photo and video', -200, 14, 'pasangan'],
    ['7.2', '7', 'Sesi prewedding', 'Pre-wedding session', -120, 14, 'pasangan'],
    ['8', '', 'Administrasi dan seserahan', 'Paperwork and gifts'],
    ['8.1', '8', 'Urus dokumen pernikahan (KUA / catatan sipil)', 'Marriage paperwork (KUA / civil registry)', -90, 30, 'pasangan'],
    ['8.2', '8', 'Cincin pernikahan', 'Wedding rings', -90, 21, 'pasangan'],
    ['8.3', '8', 'Siapkan seserahan', 'Prepare the seserahan gifts', -45, 21, 'pasangan'],
    ['9', '', 'Minggu terakhir', 'The final weeks'],
    ['9.1', '9', 'Technical meeting dengan vendor', 'Technical meeting with vendors', -14, 1, 'tim'],
    ['9.2', '9', 'Rundown final', 'Final rundown', -10, 3, 'tim'],
    ['9.3', '9', 'Pelunasan semua vendor', 'Settle every vendor', -7, 5, 'pasangan'],
    ['9.4', '9', 'Gladi resik', 'Rehearsal', -1, 1, 'tim']
  ];
  var items = [], byCode = {}, at = new Date().toISOString();
  function row(kind, data, parent, sort) { var r = { id: id(), kind: kind, parent: parent || null, sort: sort || items.length * 10, team_only: false, data: data, by: 'Tim Nawala', at: at, made: 'nawala' }; items.push(r); return r; }
  T.forEach(function (t, i) {
    var d = { title: t[2], title_en: t[3], status: 'belum', tpl: i < 13 ? 'undangan' : 'penuh' };
    if (t[4] != null) {
      d.off = t[4]; d.dur = t[5]; d.who = t[6]; d.due = plus(WED, t[4]); d.start = plus(d.due, -t[5] + 1);
      d.status = d.due < TODAY ? 'selesai' : d.start <= TODAY ? 'dikerjakan' : 'belum';
    }
    byCode[t[0]] = row('tugas', d, t[1] ? byCode[t[1]] : null, (i + 1) * 10).id;
  });
  /* two that are waiting for the couple, so the board has all four columns */
  items.forEach(function (r) { if (r.data.title === 'Pilih MUA') r.data.status = 'ditinjau'; if (r.data.title === 'Pesan foto dan video') r.data.status = 'dikerjakan'; });

  var V = {};
  [['Balai Sekar Arum', 'Tempat', 'deal', 'Ibu Ratna', 'Gedung 400 tamu, paket Sabtu malam'], ['Dapur Kenanga', 'Katering', 'deal', 'Pak Yusuf', '400 porsi prasmanan, 6 gubukan'],
   ['Sanggar Rias Melati', 'MUA', 'dihubungi', 'Mbak Sari', 'Rias akad dan resepsi, 2 kali ganti'], ['Lensa Dua Hati', 'Foto dan video', 'calon', 'Mas Dimas', 'Foto, video dan prewedding'],
   ['Taman Dekor Nusantara', 'Dekorasi', 'calon', 'Ibu Wening', 'Pelaminan dan lorong bunga']].forEach(function (v) {
    V[v[1]] = row('vendor', { name: v[0] + ' (contoh)', cat: v[1], status: v[2], contact: v[3], price: v[4] }).id;
  });
  function rab(cat, item, en, plan, wbs, vendor, pays) {
    var r = row('rab', { cat: cat, item: item, item_en: en, plan: plan, payer: 'bersama', wbs: byCode[wbs], vendor: vendor || undefined, tpl: 'penuh' });
    (pays || []).forEach(function (p) { row('bayar', { stage: p[0], amount: p[1], due: plus(TODAY, p[2]), paid: p[2] < 0 ? plus(TODAY, p[2]) : undefined }, r.id); });
  }
  rab('Undangan', 'Undangan digital Nawala', 'Nawala digital invitation', 2500000, '1', null, [['dp', 1000000, -60], ['pelunasan', 1500000, 30]]);
  rab('Tempat', 'Sewa tempat acara', 'Venue hire', 45000000, '4', V.Tempat, [['dp', 15000000, -40], ['termin', 15000000, 5], ['pelunasan', 15000000, 180]]);
  rab('Katering', 'Katering', 'Catering', 60000000, '4', V.Katering, [['dp', 20000000, -12], ['pelunasan', 40000000, 185]]);
  rab('Busana dan rias', 'MUA', 'Make-up artist', 12000000, '5', V.MUA);
  rab('Busana dan rias', 'Busana', 'Attire', 18000000, '5');
  rab('Dekorasi dan hiburan', 'Dekorasi', 'Decor', 35000000, '6', V.Dekorasi);
  rab('Dekorasi dan hiburan', 'Musik dan MC', 'Music and MC', 10000000, '6');
  rab('Dokumentasi', 'Foto dan video', 'Photo and video', 20000000, '7', V['Foto dan video']);
  rab('Administrasi dan seserahan', 'Cincin', 'Rings', 12000000, '8');
  rab('Administrasi dan seserahan', 'Seserahan', 'Seserahan gifts', 8000000, '8');
  rab('Lain-lain', 'Cadangan tak terduga', 'Contingency', 10000000, '9');
  [['Akad', '08:00', '09:30', 'Akad nikah', 'Ruang Melati', 'Keluarga inti'], ['Akad', '09:30', '10:30', 'Foto keluarga', 'Ruang Melati', 'Lensa Dua Hati'],
   ['Resepsi', '18:00', '18:30', 'Tamu datang, pindai QR di pintu', 'Lobi', 'Tim Nawala'], ['Resepsi', '18:30', '19:00', 'Kirab pengantin', 'Aula utama', 'MC'],
   ['Resepsi', '19:00', '20:30', 'Ramah tamah dan makan malam', 'Aula utama', 'Dapur Kenanga'], ['Resepsi', '20:30', '21:00', 'Foto bersama dan penutup', 'Pelaminan', 'MC']].forEach(function (a) {
    row('acara', { day: a[0], start: a[1], end: a[2], title: a[3], place: a[4], pic: a[5] });
  });
  row('rapat', { title: 'Rapat awal dengan tim Nawala', date: plus(TODAY, -21), 'with': 'Laras, Bima, tim Nawala', body: 'Membahas konsep adat Jawa modern, jumlah tamu sekitar 400, dan urutan acara.', decisions: 'Tema undangan Pendopo Jawa. Resepsi Sabtu malam.', actions: [] });
  row('setuju', { title: 'Susunan pelaminan dan lorong bunga', body: 'Dua pilihan dari dekorator. Mohon pilih salah satu sebelum akhir bulan.', status: 'menunggu' });
  row('setuju', { title: 'Teks undangan dan urutan nama orang tua', body: 'Sudah sesuai permintaan keluarga.', status: 'disetujui', reply: 'Sudah benar, terima kasih.', by: 'Laras & Bima' });
  row('ingat', { title: 'Tes rasa katering di Dapur Kenanga', at: plus(TODAY, 4) + 'T10:00', 'for': 'semua' });

  var msgs = [], mid = 0;
  function msg(kind, who, body, minsAgo) { mid++; msgs.push({ id: mid, kind: kind, ref: kind === 'tim' ? 'tim-contoh' : CODE, who: who, body: body, file: null, at: new Date(Date.now() - minsAgo * 60000).toISOString() }); }
  msg('tim', 'Dewi, tim Nawala', 'Halo Laras dan Bima. Dua pilihan pelaminan sudah kami taruh di Persetujuan, silakan dilihat.', 1500);
  msg('pasangan', 'Laras & Bima', 'Terima kasih. Kami diskusikan dulu dengan orang tua, ya.', 1440);
  msg('tim', 'Dewi, tim Nawala', 'Siap. Termin kedua gedung jatuh tempo minggu ini, pengingatnya sudah ada di Ringkasan.', 180);
  var REPLY = [['Terima kasih, pesannya sudah kami terima. Ini demo, jadi balasan ini contoh saja dan tidak ada yang tersimpan.', 'Thank you, we have your message. This is a demo, so this reply is only a sample and nothing is saved.'],
    ['Di ruang yang asli, tim Nawala membalas di sini dan kalian mendapat tanda pesan baru.', 'In the real room the Nawala team answers here and you get a new-message mark.']], rN = 0;
  function en() { return document.documentElement.lang === 'en'; }

  function pmOpen() {
    return { slug: 'laras-bima', couple: 'Laras & Bima', status: 'tayang', theme: 'pendopo-jawa', date: WED, full: true, until: plus(WED, 30), until_set: false,
      events: [{ kind: 'akad', start: '08:00', place: 'Balai Sekar Arum' }, { kind: 'resepsi', start: '18:00', place: 'Balai Sekar Arum' }],
      as: 'pasangan', me: 'Laras & Bima', ref: null, edit: true, money: false, now: new Date().toISOString(),
      items: items.filter(function (i) { return !i.gone; }), dir: [], unread: { bersama: 0, tim: 0 }, members: [{ id: 'tim-contoh', name: 'Dewi, tim Nawala' }] };
  }
  var state = MODE === 'tema' ? { saved: ['pendopo-jawa', 'akad-putih', 'kyoto', 'istana-awan', 'sage', 'dusty-rose'], no: [], answers: [[], [], [], [], []], final: '', call: null }
    : { saved: ['pendopo-jawa', 'akad-putih', 'kyoto'], no: [], answers: [[0], [0], [1], [0], [0]], final: 'pendopo-jawa', call: null };
  function roomOpen() {
    var order = MODE === 'persiapan' ? { slug: 'laras-bima', couple: 'Laras & Bima', status: 'tayang', theme: 'pendopo-jawa', level: 3, wording: 'umum', live: true,
      draft: { bride: { short: 'Laras', full: 'Larasati Wulandari' }, groom: { short: 'Bima', full: 'Bima Aryasatya' }, date: WED, zone: 'WIB',
        events: [{ kind: 'akad', start: '08:00', end: '09:30', place: 'Balai Sekar Arum' }, { kind: 'resepsi', start: '18:00', end: '21:00', place: 'Balai Sekar Arum' }] },
      submitted_at: at, published_at: at, draft_at: at, seating_pub_at: null, guests: [] } : null;
    return { code: CODE, label: 'Laras & Bima (contoh)', created_at: at, expires_at: null, now: new Date().toISOString(), state: state, order: order };
  }
  var H = {
    room_open: roomOpen,
    room_save: function (b) { if (b && b.p_state) state = b.p_state; return true; },
    room_order_save: function () { return true; }, room_order_submit: function () { return true; }, room_guests_save: function () { return true; },
    pm_open: pmOpen,
    pm_save: function (b) {
      (b.p_ops || []).forEach(function (op) {
        var i = items.filter(function (x) { return x.id === op.id; })[0];
        if (op.del) { if (i) i.gone = true; return; }
        if (i) { ['kind', 'parent', 'sort', 'data'].forEach(function (k) { if (k in op) i[k] = op[k]; }); i.gone = false; }
        else items.push({ id: op.id, kind: op.kind, parent: op.parent || null, sort: op.sort || 0, team_only: false, data: op.data || {}, by: 'Laras & Bima', at: new Date().toISOString(), made: 'pasangan' });
      });
      return { ok: true, n: (b.p_ops || []).length, at: new Date().toISOString() };
    },
    pm_chat: function (b) { return { msgs: msgs.filter(function (x) { return x.id > (b.p_after || 0); }), me: CODE, unread: { bersama: 0, tim: 0 } }; },
    pm_say: function (b) {
      if (!b.p_body) return { ok: false };
      msg('pasangan', 'Laras & Bima', String(b.p_body).slice(0, 2000), 0);
      setTimeout(function () { var r = REPLY[rN++ % REPLY.length]; msg('tim', 'Dewi, tim Nawala', r[en() ? 1 : 0], 0); }, 2200);
      return { ok: true };
    },
    pm_ticket: function () { tell(['Di demo, berkas tidak diunggah. Di ruang yang asli, bukti transfer dan foto tersimpan di sini.', 'In the demo no file is uploaded. In the real room receipts and pictures are kept here.']); return null; },
    media_ticket: function () { return null; }
  };
  function tell(p) { try { window.K.toast(p[en() ? 1 : 0]); } catch (e) {} }
  DB.rpc = function (name, body, keep) {
    if (name === 'site_themes') return real(name, body, keep);
    var h = H[name];
    return new Promise(function (res) { setTimeout(function () { res(h ? h(body || {}) : null); }, 140); });
  };

  /* ---------------- the guide bar ---------------- */
  var STEPS = MODE === 'persiapan' ? [
    ['ringkasan', 'Ringkasan', 'Overview', 'Satu halaman untuk seluruh persiapan: hitung mundur, kemajuan, pembayaran terdekat, dan yang menunggu jawaban kalian.', 'One page for the whole plan: the countdown, progress, the next payments and what waits for your answer.'],
    ['kanban', 'Papan tugas', 'Task board', 'Setiap pekerjaan punya pemilik dan tenggat. Pindahkan kartu dari Belum ke Selesai.', 'Every job has an owner and a due date. Move a card from To do to Done.'],
    ['gantt', 'Garis waktu', 'Timeline', 'Semua pekerjaan di satu garis waktu sampai hari H. Seret batang untuk menggeser tanggalnya.', 'Every job on one timeline up to the day. Drag a bar to move its dates.'],
    ['rab', 'Anggaran', 'Budget', 'Rencana dan realisasi per pos, dengan tahap bayar DP, termin dan pelunasan. Ketuk satu pos untuk melihatnya.', 'Planned and actual per line, with deposit, instalment and final payment. Tap a line to see it.'],
    ['obrolan', 'Obrolan', 'Chat', 'Bicara langsung dengan tim Nawala. Coba kirim satu pesan.', 'Talk to the Nawala team directly. Try sending a message.']
  ] : [
    ['cocok', 'Kecocokan', 'Match', 'Jawab lima pertanyaan di sini. Setiap jawaban langsung mengurutkan tema di bawahnya, tanpa jendela tambahan.', 'Answer five questions here. Every answer re-orders the themes below at once, with no extra window.'],
    ['jelajah', 'Jelajah', 'Browse', 'Semua tema dalam satu halaman. Ketuk hati untuk menyimpan, atau pilih Geser untuk melihatnya satu per satu.', 'Every theme on one page. Tap the heart to save one, or choose Swipe to see them one at a time.'],
    ['pilihan', 'Persempit', 'Narrow', 'Enam tema sudah kami simpankan sebagai contoh. Bandingkan berdampingan, lepas yang kurang terasa seperti kalian, lalu pilih satu.', 'We saved six themes as a sample. Compare them side by side, let go of the ones that feel less like you, then choose one.'],
    ['jadwal', 'Panggilan', 'Call', 'Pilih waktu panggilan video dengan tim Nawala untuk membahas tema pilihan kalian.', 'Pick a time for a video call with the Nawala team about your chosen theme.']
  ];
  var cur = 0, bar = null;
  function go(k) {
    cur = Math.max(0, Math.min(STEPS.length - 1, k)); var s = STEPS[cur];
    if (MODE === 'persiapan') {
      if (location.hash !== '#persiapan') location.hash = '#persiapan';
      var tries = 0, t = setInterval(function () { var b = document.querySelector('#pm-root [data-tab-go="' + s[0] + '"]'); if (b || ++tries > 40) { clearInterval(t); if (b && b.getAttribute('aria-selected') !== 'true') b.click(); } }, 120);
    } else location.hash = '#' + s[0];
    draw();
  }
  function draw() {
    if (!bar) return; var e = en(), s = STEPS[cur];
    bar.querySelector('.demo-bar__steps').innerHTML = STEPS.map(function (x, i) { return '<button type="button" data-step="' + i + '"' + (i === cur ? ' aria-current="step"' : '') + '><i>' + (i + 1) + '</i>' + (e ? x[2] : x[1]) + '</button>'; }).join('');
    bar.querySelector('.demo-bar__say').textContent = e ? s[4] : s[3];
    bar.querySelector('[data-next]').textContent = cur === STEPS.length - 1 ? (e ? 'Start again' : 'Mulai ulang') : (e ? 'Next' : 'Lanjut');
    bar.querySelector('.demo-bar__tag').textContent = e ? 'Demo with a sample couple. Nothing is saved.' : 'Demo dengan pasangan contoh. Tidak ada yang tersimpan.';
    document.documentElement.style.setProperty('--demo-h', bar.offsetHeight + 'px');
  }
  function build() {
    bar = document.createElement('div'); bar.className = 'demo-bar g';
    bar.innerHTML = '<div class="demo-bar__steps"></div><p class="demo-bar__say" aria-live="polite"></p><div class="demo-bar__acts"><span class="demo-bar__tag"></span><button type="button" class="btn btn--main" data-next></button></div>';
    document.body.insertBefore(bar, document.body.firstChild);
    bar.addEventListener('click', function (e) {
      var b = e.target.closest('[data-step]'); if (b) return go(+b.getAttribute('data-step'));
      if (e.target.closest('[data-next]')) { if (cur === STEPS.length - 1) location.reload(); else go(cur + 1); }
    });
    new MutationObserver(draw).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
    addEventListener('resize', draw);
    /* following the visitor: a view or tab they open themselves moves the guide too */
    addEventListener('hashchange', function () { if (MODE !== 'tema') return; var k = STEPS.map(function (x) { return x[0]; }).indexOf(location.hash.slice(1)); if (k > -1 && k !== cur) { cur = k; draw(); } });
    document.addEventListener('click', function (e) { if (MODE !== 'persiapan') return; var b = e.target.closest('#pm-root [data-tab-go]'); if (!b) return; var k = STEPS.map(function (x) { return x[0]; }).indexOf(b.getAttribute('data-tab-go')); if (k > -1) { cur = k; draw(); } });
    addEventListener('keydown', function (e) { if (e.key === 'Escape' && !document.querySelector('dialog[open]') && parent !== window) parent.postMessage('nawala-denah-close', location.origin); });
    var tries = 0, t = setInterval(function () { if (!document.body.classList.contains('is-locked') || ++tries > 80) { clearInterval(t); go(0); } }, 100);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', build); else build();
})();
