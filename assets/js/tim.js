/* The team console (tim/). Every list is read from the Nawala database and every button writes to it.
   The door is a team token: it is sent with each call and checked there (supabase/migrations/20261121_consoles.sql).
   Nothing on this page is a sample, so an empty database shows empty lists. */
(function () {
  'use strict';
  var K = window.K, N = window.NAWALA, DB = window.NAWALA_DB, $ = K.$, t = K.t, esc = K.esc;
  var bySlug = {};
  N.ALL.forEach(function (th) { bySlug[N.slug(th)] = th; });
  /* Premium worlds that have a working sample invitation. Keep in step with BUILT in site.js. */
  var BUILT = ' pendopo-jawa akad-putih ';

  var STAGES = [['baru', 'Baru', 'New'], ['dihubungi', 'Dihubungi', 'Contacted'], ['konsep', 'Konsep', 'Concept'], ['produksi', 'Produksi', 'Production'], ['tayang', 'Tayang', 'Live']];
  var ORDER = STAGES.map(function (s) { return s[0]; });
  var D = { me: { name: '', role: '' }, leads: [], codes: [], invitations: [], wishes: [] };
  var token = '', skew = 0, loadedAt = 0, q = '';

  function now() { return Date.now() + skew; }
  function ms(iso) { return new Date(iso).getTime(); }
  function hit() { if (!q) return true; return Array.prototype.join.call(arguments, ' ').toLowerCase().indexOf(q) > -1; }
  function stageName(k) { var i = ORDER.indexOf(k); return i < 0 ? k : t(STAGES[i][1], STAGES[i][2]); }
  function inStage(k) { return D.leads.filter(function (l) { return l.stage === k; }); }
  function local(num) { return String(num || '').replace(/^62/, '0'); }
  function mask(num) { var n = local(num); return n.slice(0, 4) + ' xxxx ' + n.slice(-4); }
  function intl(num) { return String(num || '').replace(/^0/, '62'); }
  function days(n) { return n + ' ' + t('hari', n === 1 ? 'day' : 'days'); }

  /* ---------- The door ---------- */
  var STORE = 'nawala-tim', gateNote = null;
  function stored() { try { return sessionStorage.getItem(STORE) || localStorage.getItem(STORE) || ''; } catch (e) { return ''; } }
  function remember(tok, always) { try { sessionStorage.setItem(STORE, tok); if (always) localStorage.setItem(STORE, tok); } catch (e) {} }
  function forget() { try { sessionStorage.removeItem(STORE); localStorage.removeItem(STORE); } catch (e) {} }
  function note(pair) { gateNote = pair || null; var m = $('#gate-msg'); m.hidden = !pair; m.textContent = pair ? t(pair[0], pair[1]) : ''; }
  function take(d) { D = d; skew = ms(d.now) - Date.now(); loadedAt = Date.now(); }
  function lock(pair) {
    token = ''; forget();
    document.body.classList.add('is-locked');
    $('#gate-token').value = ''; note(pair);
  }
  function enter(tok, always) {
    $('#gate-go').disabled = true; note(null);
    return DB.rpc('team_data', { t: tok }).then(function (d) {
      token = tok; take(d); remember(tok, always);
      $('#gate-token').value = '';
      document.body.classList.remove('is-locked');
      all(); K.show(location.hash.slice(1));
    }, function (e) {
      if (e.status >= 400 && e.status < 500) { forget(); note(['Token tidak dikenali. Periksa lagi, atau minta token baru kepada pemilik.', 'That token is not recognised. Check it, or ask the owner for a new one.']); }
      else note(['Database Nawala belum bisa dihubungi. Tekan Masuk untuk mencoba lagi.', 'The Nawala database cannot be reached. Press Log in to try again.']);
    }).then(function () { $('#gate-go').disabled = false; });
  }
  $('#gate-form').addEventListener('submit', function (e) {
    e.preventDefault();
    var tok = $('#gate-token').value.trim() || stored();
    if (tok.length < 32) { note(['Tempel token tim Anda di sini.', 'Paste your team token here.']); $('#gate-token').focus(); return; }
    enter(tok, $('#gate-keep').checked);
  });
  $('#logout').addEventListener('click', function () { lock(null); });

  /* every write goes through here: a token that stopped working sends the team back to the door */
  function call(name, body) {
    body = body || {}; body.t = token;
    return DB.rpc(name, body).catch(function (e) {
      if (e.status === 401 || e.status === 403) lock(['Token ini tidak berlaku lagi. Masuk kembali.', 'This token no longer works. Please log in again.']);
      else K.offline();
      throw e;
    });
  }
  function refresh() { return call('team_data').then(function (d) { take(d); all(); }); }
  function write(name, body, done) {
    return call(name, body).then(function (r) { if (done) done(r); return refresh(); }).catch(function () {});
  }
  $('#reload').addEventListener('click', function () { refresh().then(function () { K.toast(t('Data diperbarui.', 'The data is up to date.')); }, function () {}); });
  document.addEventListener('visibilitychange', function () {
    if (!document.hidden && token && Date.now() - loadedAt > 60000) refresh().catch(function () {});
  });

  /* ---------- Overview ---------- */
  function monday(d) { var x = new Date(d); x.setHours(0, 0, 0, 0); x.setDate(x.getDate() - ((x.getDay() + 6) % 7)); return x; }
  function perWeek() {
    var start = monday(now()).getTime(), out = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    D.leads.forEach(function (l) {
      var w = Math.round((start - monday(l.created_at).getTime()) / 6048e5);
      if (w >= 0 && w < 12) out[11 - w]++;
    });
    return out;
  }
  function chosenCount() {
    var n = {};
    D.leads.forEach(function (l) { if (l.theme && bySlug[l.theme]) n[l.theme] = (n[l.theme] || 0) + 1; });
    return n;
  }
  function callText(c) {
    var d = new Date(c.d);
    return K.day(d) + ', ' + K.date(d) + ', ' + c.time + ' WIB, ' + c.via;
  }
  function overview() {
    var W = perWeek(), n = W.length, fresh = inStage('baru'), me = D.me || {};
    $('#hello').textContent = K.greeting() + (me.name ? ', ' + me.name : '') + '.';
    $('#hello-sub').textContent = fresh.length
      ? t(fresh.length + ' permintaan baru menunggu balasan.', fresh.length + (fresh.length === 1 ? ' new request is waiting for a reply.' : ' new requests are waiting for a reply.'))
      : D.leads.length ? t('Semua permintaan sudah dibalas.', 'Every request has a reply.') : t('Belum ada permintaan dari kotak kontak.', 'No requests from the contact box yet.');
    var b = $('#badge-new'); b.textContent = fresh.length; b.hidden = !fresh.length;
    $('#week-range').textContent = K.date(monday(now())) + ' ' + t('sampai', 'to') + ' ' + K.date(new Date(now()));

    /* sparkline of the last eight weeks; the dot is this week */
    var pts = W.slice(-8), max = Math.max.apply(null, pts.concat(1)), d = '', lx = 0, ly = 0;
    pts.forEach(function (v, i) { lx = 6 + i * (108 / 7); ly = 46 - v / max * 36; d += (i ? 'L' : 'M') + lx.toFixed(1) + ' ' + ly.toFixed(1); });
    var diff = W[n - 1] - W[n - 2];
    var active = D.codes.filter(function (c) { return status(c) !== 'habis'; });
    var soon = active.filter(function (c) { return c.expires_at && ms(c.expires_at) - now() < 7 * 864e5; }).length;
    var work = inStage('konsep').length + inStage('produksi').length;
    var oldest = fresh.reduce(function (a, l) { return !a || ms(l.created_at) < ms(a.created_at) ? l : a; }, null);
    $('#stats').innerHTML =
      '<div class="stat"><span class="stat__l">' + t('Permintaan baru', 'New requests') + '</span><b class="stat__n">' + W[n - 1] + '</b>' +
        '<span class="stat__d">' + (diff ? '<b>' + (diff > 0 ? '+' : '') + diff + '</b> ' + t('dari minggu lalu', 'on last week') : t('sama dengan minggu lalu', 'same as last week')) + '</span>' +
        '<svg class="spark" viewBox="0 0 120 54" aria-hidden="true"><path d="' + d + '"/><circle cx="' + lx.toFixed(1) + '" cy="' + ly.toFixed(1) + '" r="4.500"/></svg></div>' +
      '<div class="stat"><span class="stat__l">' + t('Menunggu balasan', 'Waiting for a reply') + '</span><b class="stat__n">' + fresh.length + '</b>' +
        '<span class="stat__d">' + (oldest ? t('terlama masuk ', 'the oldest came in ') + K.ago(oldest.created_at) : t('tidak ada antrean', 'no queue')) + '</span></div>' +
      '<div class="stat"><span class="stat__l">' + t('Undangan dikerjakan', 'Invitations in work') + '</span><b class="stat__n">' + work + '</b>' +
        '<span class="stat__d">' + t('di tahap konsep dan produksi', 'in concept and production') + '</span></div>' +
      '<div class="stat"><span class="stat__l">' + t('Kode aktif', 'Active codes') + '</span><b class="stat__n">' + active.length + '</b>' +
        '<span class="stat__d">' + soon + ' ' + t('habis dalam 7 hari', 'end within 7 days') + '</span></div>';

    var counts = ORDER.map(function (k) { return inStage(k).length; }), top = Math.max.apply(null, counts.concat(1));
    $('#flow').innerHTML = STAGES.map(function (s, i) {
      return '<li><b>' + counts[i] + '</b><i style="--o:' + (counts[i] / top).toFixed(2) + '"></i><span>' + t(s[1], s[2]) + '</span></li>';
    }).join('');

    var calls = D.codes.filter(function (c) { return status(c) !== 'habis' && c.call && c.call.d && ms(c.call.d) > now() - 864e5; })
      .sort(function (a, b) { return ms(a.call.d) - ms(b.call.d); }).slice(0, 4);
    $('#today').innerHTML = calls.length ? calls.map(function (c) {
      return '<div class="row"><span class="round" style="width:44px;height:44px">' + K.ic('video') + '</span><div class="row__t"><b>' + esc(c.label) + '</b><span>' + esc(callText(c.call)) + '</span></div><span class="row__e">' + esc(c.call.time) + '</span></div>';
    }).join('') : '<div class="empty"><b>' + t('Belum ada yang meminta.', 'Nobody has asked yet.') + '</b>' + t('Jadwal muncul di sini setelah pasangan memilihnya di ruang mereka.', 'A time shows here once a couple picks it in their room.') + '</div>';

    /* bars: one series, so no legend; the newest week wears the light */
    var ceil = Math.max(4, Math.ceil(Math.max.apply(null, W) / 4) * 4), bars = '', xs = '';
    W.forEach(function (v, i) {
      var start = monday(now()); start.setDate(start.getDate() - (n - 1 - i) * 7);
      var label = K.date(start, true);
      bars += '<button type="button" class="' + (i === n - 1 ? 'is-now' : '') + '" data-tip-top="' + (v / ceil).toFixed(3) + '" data-tip="' + esc(t('Minggu ', 'Week of ') + label + ': <b>' + v + '</b> ' + t('permintaan', 'requests')) + '"' +
        ' aria-label="' + esc(t('Minggu ', 'Week of ') + label + ', ' + v + ' ' + t('permintaan', 'requests')) + '"><i style="--v:' + (v / ceil).toFixed(3) + '"></i></button>';
      xs += '<span>' + (i % 3 === 2 ? label : '') + '</span>';
    });
    $('#bars').innerHTML = '<div class="bars__grid">' + [0, 1, 2, 3, 4].map(function (g) { return '<i style="bottom:' + (g * 25) + '%"><span>' + (g * ceil / 4) + '</span></i>'; }).join('') + '</div>' +
      '<div class="bars__plot">' + bars + '</div><div class="bars__x">' + xs + '</div>';

    var cnt = chosenCount(), rank = Object.keys(cnt).map(function (s) { return [s, cnt[s]]; }).sort(function (a, b) { return b[1] - a[1]; }).slice(0, 4);
    $('#rank').innerHTML = rank.length ? rank.map(function (r) {
      var th = bySlug[r[0]];
      return '<div class="row"><img class="thumb" src="' + N.cover(th, 's') + '" alt="" loading="lazy"><div class="row__t"><b>' + esc(K.themeName(th)) + '</b><span>' + K.tierName(th[0]) + '</span>' +
        '<div class="meter"><i style="--v:' + (r[1] / rank[0][1]).toFixed(2) + '"></i></div></div><span class="row__e">' + r[1] + '</span></div>';
    }).join('') : '<div class="empty"><b>' + t('Belum ada tema yang dipilih.', 'No theme has been chosen yet.') + '</b>' + t('Angka muncul saat pasangan membawa tema ke kotak kontak.', 'Numbers show once couples carry a theme into the contact box.') + '</div>';

    $('#me-ava').textContent = (me.name || '?').charAt(0).toUpperCase();
    $('#me-name').textContent = me.name || '';
    $('#me-role').textContent = roleName(me.role);
    $('#foot-who').textContent = t('Masuk sebagai ', 'Logged in as ') + (me.name || '') + ', ' + roleName(me.role).toLowerCase() + '.';
  }
  function roleName(r) { return r === 'pemilik' ? t('Pemilik', 'Owner') : r === 'operator' ? t('Operator', 'Operator') : ''; }

  /* ---------- Requests ---------- */
  var leadFilter = 'semua';
  function codeOf(lead) { for (var i = 0; i < D.codes.length; i++) if (D.codes[i].lead_id === lead.id) return D.codes[i]; return null; }
  function leads() {
    var keys = [['semua', t('Semua', 'All')]].concat(STAGES.map(function (s) { return [s[0], t(s[1], s[2])]; }));
    $('#lead-filter').innerHTML = keys.map(function (k) {
      var n = k[0] === 'semua' ? D.leads.length : inStage(k[0]).length;
      return '<button type="button" class="chip" data-f="' + k[0] + '" aria-pressed="' + (leadFilter === k[0]) + '">' + k[1] + ' <b>' + n + '</b></button>';
    }).join('');
    var list = D.leads.filter(function (l) {
      var th = bySlug[l.theme];
      return (leadFilter === 'semua' || l.stage === leadFilter) && hit(l.name, l.theme || '', th ? th[1] + ' ' + th[2] : '', l.whatsapp, local(l.whatsapp));
    });
    $('#leads').innerHTML = list.length ? list.map(function (l) {
      var th = bySlug[l.theme], at = ORDER.indexOf(l.stage), code = codeOf(l), en = l.lang === 'en';
      var hello = en ? 'Hello ' + l.name + ', thank you for reaching out to Nawala.' : 'Halo ' + l.name + ', terima kasih sudah menghubungi Nawala.';
      return '<article class="lead"><i class="ava ' + (l.stage === 'baru' ? '' : 'ava--green') + '">' + esc(String(l.name).charAt(0).toUpperCase()) + '</i>' +
        '<div class="lead__who"><b>' + esc(l.name) + '</b><span>' + esc(mask(l.whatsapp)) + '</span></div>' +
        '<span class="pill pill--' + (l.stage === 'baru' ? 'baru' : l.stage === 'tayang' ? 'tayang' : 'jalan') + '">' + stageName(l.stage) + '</span>' +
        '<div class="lead__more">' +
          (th ? '<span class="lead__theme"><img src="' + N.cover(th, 's') + '" alt="" loading="lazy">' + esc(K.themeName(th)) + '</span>' : '<span>' + t('Belum memilih tema', 'No theme chosen yet') + '</span>') +
          '<span>' + (l.wedding_month ? t('Menikah ', 'Wedding in ') + K.month(l.wedding_month) + ' ' + l.wedding_year : t('Tanggal belum ditentukan', 'Date not set yet')) + '</span><span>' + K.ago(l.created_at) + '</span>' +
          (code ? '<span class="code">' + esc(code.code) + '</span>' : '') +
          '<span class="lead__acts">' +
            '<a class="btn btn--sm ' + (l.stage === 'baru' ? 'btn--main' : 'btn--line') + '" target="_blank" rel="noopener" href="' + esc(DB.wa(hello, intl(l.whatsapp))) + '"' + (l.stage === 'baru' ? ' data-reply="' + l.id + '"' : '') + '>' + (l.stage === 'baru' ? t('Balas', 'Reply') : 'WhatsApp') + '</a>' +
            (at > 0 && at < ORDER.length - 1 ? '<button type="button" class="btn btn--line btn--sm" data-stage="' + ORDER[at + 1] + '" data-lead="' + l.id + '">' + t('Tahap berikut', 'Next stage') + '</button>' : '') +
            (at > 0 ? '<button type="button" class="btn btn--line btn--sm" data-stage="' + ORDER[at - 1] + '" data-lead="' + l.id + '">' + t('Mundur', 'Back a stage') + '</button>' : '') +
            (code ? '' : '<button type="button" class="btn btn--line btn--sm" data-mk="' + l.id + '">' + t('Buat kode', 'Make a code') + '</button>') +
          '</span>' +
        '</div></article>';
    }).join('') : D.leads.length || q
      ? '<div class="empty"><b>' + t('Tidak ada yang cocok.', 'Nothing matches.') + '</b>' + t('Coba kata lain, atau pilih tahap yang berbeda.', 'Try another word, or pick a different stage.') + '</div>'
      : '<div class="empty"><b>' + t('Belum ada permintaan.', 'No requests yet.') + '</b>' + t('Setiap orang yang mengisi kotak kontak di halaman utama muncul di sini.', 'Everyone who fills in the contact box on the home page shows up here.') + '</div>';
  }
  function leadById(id) { for (var i = 0; i < D.leads.length; i++) if (D.leads[i].id === id) return D.leads[i]; return null; }
  $('#lead-filter').addEventListener('click', function (e) { var b = e.target.closest('[data-f]'); if (b) { leadFilter = b.getAttribute('data-f'); leads(); } });
  $('#leads').addEventListener('click', function (e) {
    var r = e.target.closest('[data-reply]'), s = e.target.closest('[data-stage]'), m = e.target.closest('[data-mk]'), l;
    if (r) {   /* the link itself opens WhatsApp; here the request moves on */
      write('team_set_stage', { p_lead: r.getAttribute('data-reply'), p_stage: 'dihubungi' }, function () { K.toast(t('Ditandai sudah dihubungi.', 'Marked as contacted.')); });
    } else if (s) {
      l = leadById(s.getAttribute('data-lead'));
      var to = s.getAttribute('data-stage');
      write('team_set_stage', { p_lead: s.getAttribute('data-lead'), p_stage: to }, function () { K.toast((l ? l.name + ': ' : '') + stageName(to) + '.'); });
    } else if (m) {
      l = leadById(m.getAttribute('data-mk'));
      if (!l) return;
      forLead = l; $('#make-name').value = String(l.name).slice(0, 40);
      K.go('kode'); codes(); $('#make-name').focus();
    }
  });

  /* ---------- Invitations: guests' answers and wishes ---------- */
  function invites() {
    $('#invites').innerHTML = D.invitations.length ? D.invitations.map(function (v) {
      var th = bySlug[v.theme];
      return '<div class="row"><div class="row__t"><b>' + esc(v.couple) + '</b><span>' + esc(v.slug) + (th ? ', ' + esc(K.themeName(th)) : '') + '</span>' +
        '<span>' + v.answers + ' ' + t('jawaban', v.answers === 1 ? 'answer' : 'answers') + ', ' + v.coming + ' ' + t('orang hadir', v.coming === 1 ? 'guest coming' : 'guests coming') + '</span></div>' +
        '<button type="button" class="switch" role="switch" aria-checked="' + !!v.active + '" data-inv="' + esc(v.slug) + '"><span>' + t('Menerima jawaban', 'Taking answers') + '</span><i></i></button></div>';
    }).join('') : '<div class="empty"><b>' + t('Belum ada undangan yang tayang.', 'No invitation is live yet.') + '</b>' + t('Undangan contoh Laras dan Bima tidak dihitung dan tidak menyimpan apa pun.', 'The Laras and Bima samples are not counted and save nothing.') + '</div>';
    $('#wishes').innerHTML = D.wishes.length ? D.wishes.map(function (w) {
      return '<div class="row' + (w.hidden ? ' is-dim' : '') + '"><div class="row__t"><b>' + esc(w.guest) + '</b><span class="wrap">' + esc(w.body) + '</span><span>' + esc(w.invitation) + ', ' + K.ago(w.created_at) + '</span></div>' +
        '<button type="button" class="btn btn--line btn--sm" data-wish="' + w.id + '" data-hide="' + (w.hidden ? '0' : '1') + '">' + (w.hidden ? t('Tampilkan', 'Show') : t('Sembunyikan', 'Hide')) + '</button></div>';
    }).join('') : '<div class="empty">' + t('Belum ada ucapan dari tamu.', 'No wishes from guests yet.') + '</div>';
  }
  function invBySlug(s) { for (var i = 0; i < D.invitations.length; i++) if (D.invitations[i].slug === s) return D.invitations[i]; return null; }
  $('#invites').addEventListener('click', function (e) {
    var b = e.target.closest('[data-inv]'), v = b && invBySlug(b.getAttribute('data-inv'));
    if (!v) return;
    write('team_invitation', { p_slug: v.slug, p_couple: v.couple, p_theme: v.theme, p_active: !v.active }, function () {
      K.toast(v.couple + ': ' + (v.active ? t('tidak lagi menerima jawaban.', 'no longer takes answers.') : t('menerima jawaban lagi.', 'takes answers again.')));
    });
  });
  $('#wishes').addEventListener('click', function (e) {
    var b = e.target.closest('[data-wish]'); if (!b) return;
    var hide = b.getAttribute('data-hide') === '1';
    write('team_wish', { p_id: b.getAttribute('data-wish'), p_hide: hide }, function () { K.toast(hide ? t('Ucapan disembunyikan dari undangan.', 'The wish is hidden from the invitation.') : t('Ucapan tampil lagi.', 'The wish shows again.')); });
  });
  $('#reg').addEventListener('submit', function (e) {
    e.preventDefault();
    var couple = $('#reg-couple').value.trim(), slug = $('#reg-slug').value.trim().toLowerCase();
    if (!couple) { $('#reg-couple').focus(); K.toast(t('Isi dulu nama pasangan.', 'First write the couple\'s names.')); return; }
    if (!/^[a-z0-9-]{3,60}$/.test(slug)) { $('#reg-slug').focus(); K.toast(t('Nama alamat: 3 sampai 60 huruf kecil, angka, atau tanda hubung.', 'Address name: 3 to 60 small letters, digits or dashes.')); return; }
    write('team_invitation', { p_slug: slug, p_couple: couple, p_theme: null, p_active: true }, function () {
      $('#reg-couple').value = ''; $('#reg-slug').value = '';
      K.toast(couple + ': ' + t('undangan terdaftar dan menerima jawaban.', 'the invitation is registered and takes answers.'));
    });
  });

  /* ---------- Themes: what each has today ---------- */
  var tierFilter = 'semua';
  function themes() {
    var keys = [['semua', t('Semua', 'All'), N.ALL.length], ['dasar', K.tierName('dasar'), N.BASIC.length], ['premium', K.tierName('premium'), N.THEMES.length], ['eksklusif', K.tierName('eksklusif'), N.EXCLUSIVE.length]];
    $('#tier-filter').innerHTML = keys.map(function (k) { return '<button type="button" class="chip" data-f="' + k[0] + '" aria-pressed="' + (tierFilter === k[0]) + '">' + k[1] + ' <b>' + k[2] + '</b></button>'; }).join('');
    var cnt = chosenCount();
    var list = N.ALL.filter(function (th) { return (tierFilter === 'semua' || th[0] === tierFilter) && hit(th[1], th[2], th[0]); });
    $('#theme-grid').innerHTML = list.length ? list.map(function (th) {
      var s = N.slug(th), built = th[0] === 'dasar' || BUILT.indexOf(' ' + s + ' ') > -1, own = N.OWNED.indexOf(' ' + s + ' ') > -1, n = cnt[s] || 0;
      return '<article class="tc"><div class="tc__art"><img src="' + N.cover(th, 'm') + '" alt="" loading="lazy">' +
        '<div class="tc__tags">' + (N.hasFilm(th) ? '<span class="pill pill--jalan">Film</span>' : '') + (built ? '<span class="pill pill--tayang">' + t('Undangan contoh', 'Sample invitation') + '</span>' : '') + (own ? '<span class="pill pill--pink">' + t('Sudah dimiliki', 'Owned') + '</span>' : '') + '</div></div>' +
        '<div class="tc__in"><b>' + esc(K.themeName(th)) + '</b><span>' + K.tierName(th[0]) + (N.hasFilm(th) ? '' : ', ' + t('belum ada film', 'no film yet')) + (built ? '' : ', ' + t('belum ada undangan', 'no invitation yet')) + '</span>' +
        '<span>' + (n ? n + ' ' + t('kali dipilih', n === 1 ? 'time chosen' : 'times chosen') : t('Belum pernah dipilih', 'Not chosen yet')) + '</span></div></article>';
    }).join('') : '<div class="empty" style="grid-column:1 / -1"><b>' + t('Tidak ada tema yang cocok.', 'No theme matches.') + '</b></div>';
  }
  $('#tier-filter').addEventListener('click', function (e) { var b = e.target.closest('[data-f]'); if (b) { tierFilter = b.getAttribute('data-f'); themes(); } });

  /* ---------- Access codes ---------- */
  var codeFilter = 'semua', span = 30, forLead = null, openCode = '', fresh = null;
  var CSTAT = { aktif: ['Aktif', 'Active', 'jalan'], pesanan: ['Sudah jadi pesanan', 'Became an order', 'tayang'], habis: ['Habis', 'Ended', 'habis'] };
  /* habis: ended by the team or past its date. pesanan: the couple ordered; the code keeps working. */
  function status(c) {
    if (c.ended_at || (c.expires_at && ms(c.expires_at) <= now())) return 'habis';
    return c.ordered_at ? 'pesanan' : 'aktif';
  }
  function until(c) {
    if (c.ended_at) return t('diakhiri ', 'ended ') + K.date(new Date(c.ended_at));
    if (!c.expires_at) return t('tanpa batas waktu', 'no end date');
    var left = Math.ceil((ms(c.expires_at) - now()) / 864e5);
    return left > 0 ? t('berlaku sampai ', 'valid until ') + K.date(new Date(c.expires_at)) + ', ' + days(left) + t(' lagi', ' left') : t('berakhir ', 'ended ') + K.date(new Date(c.expires_at));
  }
  function codes() {
    $('#code-stats').innerHTML = ['aktif', 'pesanan', 'habis'].map(function (k) { return '<span class="chip">' + t(CSTAT[k][0], CSTAT[k][1]) + ' <b>' + D.codes.filter(function (c) { return status(c) === k; }).length + '</b></span>'; }).join('');
    $('#make-days').innerHTML = [7, 14, 30, 0].map(function (d) { return '<button type="button" class="chip" data-d="' + d + '" aria-pressed="' + (span === d) + '">' + (d ? days(d) : t('Tanpa batas', 'No end date')) + '</button>'; }).join('');
    var ml = $('#make-lead'); ml.hidden = !forLead;
    ml.innerHTML = forLead ? t('Terhubung ke permintaan ', 'Linked to the request from ') + '<b>' + esc(forLead.name) + '</b>. <button type="button" class="link" data-unlink>' + t('Lepas', 'Unlink') + '</button>' : '';
    $('#code-filter').innerHTML = [['semua', t('Semua', 'All')], ['aktif', t('Aktif', 'Active')], ['pesanan', t('Jadi pesanan', 'Orders')], ['habis', t('Habis', 'Ended')]].map(function (k) {
      return '<button type="button" class="chip" data-f="' + k[0] + '" aria-pressed="' + (codeFilter === k[0]) + '">' + k[1] + '</button>';
    }).join('');
    var list = D.codes.filter(function (c) { return (codeFilter === 'semua' || status(c) === codeFilter) && hit(c.code, c.label); });
    $('#codes').innerHTML = list.length ? list.map(function (c) {
      var st = status(c), s = CSTAT[st], fin = bySlug[c.final], open = openCode === c.code;
      var use = c.last_used_at
        ? c.seen + ' ' + t('tema dilihat', 'themes seen') + ', ' + c.saved + ' ' + t('disimpan', 'saved') + (fin ? ', ' + t('pilihan: ', 'chosen: ') + K.themeName(fin) : '') + ', ' + t('terakhir dibuka ', 'last opened ') + K.ago(c.last_used_at)
        : t('belum pernah dibuka', 'never opened');
      return '<div class="row row--code"><div class="row__t"><b class="code">' + esc(c.code) + '</b><span>' + esc(c.label) + ', ' + until(c) + '</span><span>' + esc(use) + '</span>' +
        (c.call && c.call.d ? '<span>' + t('Panggilan video: ', 'Video call: ') + esc(callText(c.call)) + '</span>' : '') + '</div>' +
        '<span class="pill pill--' + s[2] + '">' + t(s[0], s[1]) + '</span>' +
        '<button type="button" class="round" style="width:44px;height:44px" data-copy="' + esc(c.code) + '" aria-label="' + t('Salin kode', 'Copy the code') + ' ' + esc(c.code) + '">' + K.ic('copy') + '</button>' +
        '<button type="button" class="round" style="width:44px;height:44px" data-open="' + esc(c.code) + '" aria-expanded="' + open + '" aria-label="' + t('Atur kode', 'Manage the code') + ' ' + esc(c.code) + '">' + K.ic('tune') + '</button></div>' +
        (open ? '<div class="row__acts" data-code="' + esc(c.code) + '">' +
          '<button type="button" class="btn btn--line btn--sm" data-act="perpanjang">' + t('Tambah 30 hari', 'Add 30 days') + '</button>' +
          (c.expires_at || c.ended_at ? '<button type="button" class="btn btn--line btn--sm" data-act="tanpa-batas">' + t('Tanpa batas waktu', 'No end date') + '</button>' : '') +
          '<button type="button" class="btn btn--line btn--sm" data-act="' + (c.ordered_at ? 'bukan-pesanan' : 'pesanan') + '">' + (c.ordered_at ? t('Bukan pesanan', 'Not an order') : t('Tandai jadi pesanan', 'Mark as an order')) + '</button>' +
          (c.ended_at ? '' : '<button type="button" class="btn btn--line btn--sm" data-act="akhiri">' + t('Akhiri sekarang', 'End it now') + '</button>') +
          '</div>' : '');
    }).join('') : D.codes.length || q
      ? '<div class="empty"><b>' + t('Tidak ada kode yang cocok.', 'No code matches.') + '</b></div>'
      : '<div class="empty"><b>' + t('Belum ada kode.', 'No codes yet.') + '</b>' + t('Buat satu untuk pasangan yang sudah menghubungi kita.', 'Make one for a couple who has reached out.') + '</div>';
    var f = $('#fresh'); f.hidden = !fresh;
    if (fresh) {
      var msg = (fresh.en
        ? 'Hello ' + fresh.label + ', here is your Nawala access code: ' + fresh.code + '. Open ' + DB.site + 'ruang/ and enter it to see every theme and film.' + (fresh.days ? ' It is valid for ' + fresh.days + ' days. If you need more time, just tell us.' : '')
        : 'Halo ' + fresh.label + ', ini kode akses Nawala kalian: ' + fresh.code + '. Buka ' + DB.site + 'ruang/ lalu masukkan kodenya untuk melihat semua tema dan film.' + (fresh.days ? ' Kode berlaku ' + fresh.days + ' hari. Kalau perlu waktu lebih, kabari kami.' : ''));
      f.innerHTML = '<span class="small">' + t('Kode untuk ', 'Code for ') + esc(fresh.label) + '</span><b class="code">' + esc(fresh.code) + '</b>' +
        '<span class="small">' + (fresh.days ? t('Berlaku ', 'Valid for ') + days(fresh.days) + t('. Bisa diperpanjang kapan saja.', '. It can be extended at any time.') : t('Tanpa batas waktu.', 'No end date.')) + '</span>' +
        '<span class="chips"><button type="button" class="btn btn--line btn--sm" data-copy="' + esc(fresh.code) + '">' + t('Salin kode', 'Copy the code') + '</button>' +
        '<a class="btn btn--line btn--sm" target="_blank" rel="noopener" href="' + esc(DB.wa(msg, fresh.wa)) + '">' + (fresh.wa ? t('Kirim lewat WhatsApp', 'Send on WhatsApp') : t('Tulis pesan WhatsApp', 'Write a WhatsApp message')) + '</a></span>';
    }
  }
  function copy(text) {
    function done() { K.toast(t('Kode disalin: ', 'Code copied: ') + text); }
    try { navigator.clipboard.writeText(text).then(done, function () { K.toast(text); }); } catch (e) { K.toast(text); }
  }
  $('#make-days').addEventListener('click', function (e) { var b = e.target.closest('[data-d]'); if (b) { span = +b.getAttribute('data-d'); codes(); } });
  $('#make-lead').addEventListener('click', function (e) { if (e.target.closest('[data-unlink]')) { forLead = null; codes(); } });
  $('#code-filter').addEventListener('click', function (e) { var b = e.target.closest('[data-f]'); if (b) { codeFilter = b.getAttribute('data-f'); codes(); } });
  document.addEventListener('click', function (e) { var b = e.target.closest('[data-copy]'); if (b) copy(b.getAttribute('data-copy')); });
  $('#codes').addEventListener('click', function (e) {
    var o = e.target.closest('[data-open]'), a = e.target.closest('[data-act]');
    if (o) { var c = o.getAttribute('data-open'); openCode = openCode === c ? '' : c; codes(); return; }
    if (!a) return;
    var code = a.closest('[data-code]').getAttribute('data-code'), act = a.getAttribute('data-act');
    var said = { perpanjang: ['ditambah 30 hari.', '30 days added.'], 'tanpa-batas': ['sekarang tanpa batas waktu.', 'now has no end date.'], pesanan: ['ditandai jadi pesanan.', 'marked as an order.'],
      'bukan-pesanan': ['tanda pesanan dilepas.', 'order mark removed.'], akhiri: ['diakhiri. Bisa dibuka lagi dengan memperpanjangnya.', 'ended. Extending it opens it again.'] }[act];
    write('team_code', { p_code: code, p_act: act, p_days: 30 }, function () { K.toast(code + ': ' + t(said[0], said[1])); });
  });
  $('#make').addEventListener('submit', function (e) {
    e.preventDefault();
    var name = $('#make-name').value.trim(), lead = forLead, d = span;
    if (!name) { $('#make-name').focus(); K.toast(t('Isi dulu untuk siapa kode ini.', 'First say who this code is for.')); return; }
    write('team_make_code', { p_label: name, p_days: d || null, p_lead: lead ? lead.id : null }, function (code) {
      fresh = { code: code, label: name, days: d, wa: lead ? intl(lead.whatsapp) : '', en: lead ? lead.lang === 'en' : K.lang() === 'en' };
      $('#make-name').value = ''; forLead = null; codeFilter = 'semua';
    });
  });

  /* ---------- Search: narrows the three lists ---------- */
  $('#search').addEventListener('input', function () {
    q = this.value.trim().toLowerCase();
    leads(); themes(); codes();
    if (q && $('.view.is-on') && $('.view.is-on').getAttribute('data-view') === 'ringkasan') K.go('permintaan');
  });

  function all() {
    overview(); leads(); invites(); themes(); codes();
    if (gateNote) note(gateNote);
    document.title = t('Nawala, konsol tim', 'Nawala, team console');
  }
  K.onLang(all);
  K.start();
  if (stored()) enter(stored(), false); else $('#gate-token').focus();
})();
