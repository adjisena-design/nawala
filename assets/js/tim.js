/* The team console (tim/). Every list is read from the Nawala database and every button writes to it.
   The door is a team token: it is sent with each call and checked there (supabase/migrations/: consoles, team_door, builder).
   Orders (an invitation each) are filled in by the couple in their room and checked and published here.
   Nothing on this page is a sample, so an empty database shows empty lists. */
(function () {
  'use strict';
  var K = window.K, N = window.NAWALA, DB = window.NAWALA_DB, $ = K.$, t = K.t, esc = K.esc;
  var bySlug = {};
  function index() { bySlug = {}; N.ALL.forEach(function (th) { bySlug[N.slug(th)] = th; }); }
  index();

  var STAGES = [['baru', 'Baru', 'New'], ['dihubungi', 'Dihubungi', 'Contacted'], ['konsep', 'Konsep', 'Concept'], ['produksi', 'Produksi', 'Production'], ['tayang', 'Tayang', 'Live']];
  var ORDER = STAGES.map(function (s) { return s[0]; });
  var D = { me: { name: '', role: '' }, leads: [], codes: [], invitations: [], wishes: [], themes: [] };
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
  function take(d) { D = d; skew = ms(d.now) - Date.now(); loadedAt = Date.now(); if (d.themes && d.themes.length) { N.use(d.themes); index(); } }
  var LOCKED = ['Terlalu banyak percobaan yang salah. Pintu terkunci 15 menit, lalu coba lagi.', 'Too many wrong tries. The door is locked for 15 minutes; try again after that.'];
  var ENDED = ['Token ini tidak berlaku lagi. Masuk kembali.', 'This token no longer works. Please log in again.'];
  /* keep: the token may still be good (the door is only locked for a while), so it is not forgotten */
  function lock(pair, keep) {
    token = ''; if (!keep) forget();
    document.body.classList.add('is-locked');
    $('#gate-token').value = ''; note(pair);
  }
  function enter(tok, always) {
    $('#gate-go').disabled = true; note(null);
    return DB.rpc('team_data', { t: tok }).then(function (d) {
      if (d && d.denied === 'terkunci') { note(LOCKED); return; }
      if (!d || d.denied) {
        forget();
        note(['Token tidak dikenali. Sisa ' + d.sisa + ' percobaan sebelum pintu terkunci 15 menit.', 'That token is not recognised. ' + d.sisa + (d.sisa === 1 ? ' try' : ' tries') + ' left before the door locks for 15 minutes.']);
        return;
      }
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
    if (tok.length < 12) { note(['Tulis token tim Anda di sini, misalnya NAWALA-TIM-XXXXXX.', 'Write your team token here, for example NAWALA-TIM-XXXXXX.']); $('#gate-token').focus(); return; }
    enter(tok, $('#gate-keep').checked);
  });
  $('#logout').addEventListener('click', function () { lock(null); });

  /* every call goes through here. A token that stopped working, or a locked door, sends the team back to the door:
     team_data says so with { denied }, the writing functions answer null and the refresh that follows explains why. */
  function call(name, body) {
    body = body || {}; body.t = token;
    return DB.rpc(name, body).catch(function (e) {
      if (e.status === 401 || e.status === 403) lock(ENDED);
      else K.offline();
      throw e;
    });
  }
  function refresh() {
    return call('team_data').then(function (d) {
      if (!d || d.denied) { var shut = d && d.denied === 'terkunci'; lock(shut ? LOCKED : ENDED, shut); throw new Error('denied'); }
      take(d); all();
    });
  }
  function write(name, body, done) {
    return call(name, body).then(function (r) { if (r !== null && done) done(r); return refresh(); }).catch(function () {});
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

  /* ---------- Orders: one per couple; the couple fills it in, the team checks and publishes ---------- */
  var B = window.NAWALA_BUILDER, openSlug = '', otab = 'ringkasan', orderForm = null, orderView = null, saveTimers = {};
  var OSTAT = { isi: ['Pasangan mengisi', 'Couple filling in', 'jalan'], periksa: ['Perlu diperiksa', 'Needs a check', 'baru'], tayang: ['Tayang', 'Live', 'tayang'], arsip: ['Diarsipkan', 'Archived', 'habis'] };
  var PAY = { belum: ['Belum bayar', 'Not paid'], dp: ['DP', 'Deposit'], lunas: ['Lunas', 'Paid in full'] };
  function orderBy(s) { for (var i = 0; i < D.invitations.length; i++) if (D.invitations[i].slug === s) return D.invitations[i]; return null; }
  function addr(o) { return 'nawalainvite.com/' + o.slug; }
  function themeRows() { return D.themes || []; }
  function rupiah(n) { return n == null || n === '' ? '' : 'Rp ' + Number(n).toLocaleString('id-ID'); }
  function checks(o) {
    var d = B.norm(o.draft), c = o.checklist || {};
    return [
      ['data', t('Data lengkap', 'Details in'), !B.missing(d).length, true],
      ['foto', t('Foto masuk', 'Photos in'), B.photosIn(d), true],
      ['tamu', t('Daftar tamu', 'Guest list'), o.guests > 0, true],
      ['periksa', t('Diperiksa tim', 'Checked by the team'), !!c.periksa, false],
      ['tayang', t('Tayang', 'Live'), o.status === 'tayang' && !o.pending, true]
    ];
  }
  function slugFrom(s) { return String(s || '').toLowerCase().replace(/&/g, ' ').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60); }
  function themeLabel(s) {
    if (!s) return t('Belum dipilih', 'Not chosen yet');
    if (s === 'umum') return t('Tema Umum Nawala', 'General Nawala theme');
    var th = bySlug[s]; return th ? K.themeName(th) + ', ' + K.tierName(th[0]) : s;
  }

  function orders() {
    var list = D.invitations.filter(function (o) { return hit(o.couple, o.slug, o.code || ''); });
    var open = D.invitations.filter(function (o) { return o.status !== 'arsip'; });
    $('#order-count').innerHTML = ['isi', 'periksa', 'tayang'].map(function (k) { return '<span class="chip">' + t(OSTAT[k][0], OSTAT[k][1]) + ' <b>' + open.filter(function (o) { return o.status === k; }).length + '</b></span>'; }).join('');
    $('#orders').innerHTML = list.length ? list.map(function (o) {
      var s = OSTAT[o.status], ck = checks(o), done = ck.filter(function (c) { return c[2]; }).length;
      var wd = B.norm(o.draft).date;
      return '<button type="button" class="ocard" data-order="' + esc(o.slug) + '"><span class="ocard__top"><b>' + esc(o.couple) + '</b><span class="pill pill--' + s[2] + '">' + t(s[0], s[1]) + '</span></span>' +
        '<span class="small muted">' + esc(addr(o)) + ' &middot; ' + esc(themeLabel(o.theme)) + '</span>' +
        '<span class="ocard__row"><span class="pill ' + (o.pay_status === 'lunas' ? 'pill--tayang' : o.pay_status === 'dp' ? 'pill--jalan' : 'pill--habis') + '">' + t(PAY[o.pay_status][0], PAY[o.pay_status][1]) + '</span>' +
        (wd ? '<span class="small">' + t('Menikah ', 'Wedding ') + K.date(new Date(wd + 'T12:00:00')) + '</span>' : '') +
        (o.pending ? '<span class="pill pill--pink">' + t('Ada perubahan', 'Changes waiting') + '</span>' : '') + '</span>' +
        '<span class="steps" aria-label="' + done + '/5">' + ck.map(function (c) { return '<i class="' + (c[2] ? 'is-done' : '') + '"></i>'; }).join('') + '</span></button>';
    }).join('') : '<div class="empty"><b>' + t('Belum ada pesanan.', 'No orders yet.') + '</b>' + t('Buat pesanan saat pasangan sudah sepakat, dari kode mereka atau dari nol.', 'Make an order once a couple has agreed, from their code or from scratch.') + '</div>';
    var free = D.codes.filter(function (c) { return status(c) !== 'habis' && !D.invitations.some(function (o) { return o.code === c.code && o.status !== 'arsip'; }); });
    var sel = $('#on-code'), was = sel.value;
    sel.innerHTML = '<option value="">' + t('Buat kode baru untuk pasangan ini', 'Make a new code for this couple') + '</option>' +
      free.map(function (c) { return '<option value="' + esc(c.code) + '">' + esc(c.code + ', ' + c.label) + '</option>'; }).join('');
    sel.value = was;
    if (openSlug) detail(false);
  }
  $('#order-add').addEventListener('click', function () { var f = $('#order-new'); f.hidden = !f.hidden; if (!f.hidden) $('#on-couple').focus(); });
  $('#on-couple').addEventListener('input', function () { if (!$('#on-slug').dataset.touched) $('#on-slug').value = slugFrom(this.value); });
  $('#on-slug').addEventListener('input', function () { this.dataset.touched = '1'; });
  $('#on-code').addEventListener('change', function () {
    var c = D.codes.filter(function (x) { return x.code === this.value; }, this)[0];
    if (c && !$('#on-couple').value) { $('#on-couple').value = c.label; if (!$('#on-slug').dataset.touched) $('#on-slug').value = slugFrom(c.label); }
  });
  $('#order-new').addEventListener('submit', function (e) {
    e.preventDefault();
    var couple = $('#on-couple').value.trim(), slug = slugFrom($('#on-slug').value), code = $('#on-code').value || null;
    if (!couple) { $('#on-couple').focus(); return K.toast(t('Isi dulu nama pasangan.', 'First write the couple\'s names.')); }
    if (slug.length < 3) { $('#on-slug').focus(); return K.toast(t('Alamat minimal 3 huruf.', 'The address needs at least 3 letters.')); }
    call('team_order_create', { p_slug: slug, p_couple: couple, p_code: code, p_theme: null }).then(function (r) {
      if (!r) return;
      if (r.error) return K.toast({ alamat: t('Alamat itu sudah dipakai atau tidak boleh. Pilih yang lain.', 'That address is taken or not allowed. Pick another.'), nama: t('Isi nama pasangan.', 'Write the couple\'s names.'), kode: t('Kode tidak ditemukan.', 'Code not found.'), 'kode-dipakai': t('Kode itu sudah punya pesanan.', 'That code already has an order.') }[r.error] || r.error);
      $('#order-new').hidden = true; $('#on-couple').value = ''; $('#on-slug').value = ''; delete $('#on-slug').dataset.touched;
      openSlug = r.slug; otab = 'ringkasan';
      return refresh().then(function () { K.toast(couple + ': ' + t('pesanan dibuat. Kode pasangan: ', 'order made. Couple\'s code: ') + r.code); });
    }).catch(function () {});
  });
  $('#orders').addEventListener('click', function (e) { var b = e.target.closest('[data-order]'); if (b) { openSlug = b.getAttribute('data-order'); otab = 'ringkasan'; orderForm = null; detail(true); } });

  /* save one order's fields a moment after the last change, without redrawing the page */
  function patch(o, p, quiet) {
    Object.keys(p).forEach(function (k) { o[k] = p[k]; if (o.status === 'tayang' && /^(theme|level|wording)$/.test(k)) o.pending = true; });
    clearTimeout(saveTimers[o.slug + Object.keys(p).join()]);
    saveTimers[o.slug + Object.keys(p).join()] = setTimeout(function () {
      call('team_order_save', { p_slug: o.slug, p_patch: p }).then(function (ok) { if (ok && !quiet) K.toast(t('Tersimpan.', 'Saved.')); }).catch(function () {});
    }, 600);
  }

  function detail(fresh) {
    var o = orderBy(openSlug), box = $('#order');
    $('#orders-panel').hidden = !!o; box.hidden = !o;
    if (!o) { openSlug = ''; return; }
    if (!fresh && otab === 'data' && orderForm) { head(o); return; }   /* never redraw a form someone is typing in */
    var tabs = [['ringkasan', t('Ringkasan', 'Summary')], ['data', t('Data undangan', 'Invitation details')], ['tamu', t('Tamu dan jawaban', 'Guests and answers')], ['pratinjau', t('Pratinjau', 'Preview')]];
    box.innerHTML = '<div class="panel__h"><div><button type="button" class="link" data-back>' + t('Semua pesanan', 'All orders') + '</button><h1 id="o-title"></h1><p id="o-sub"></p></div>' +
      '<div class="panel__tools" id="o-acts"></div></div>' +
      '<div class="chips" role="tablist" style="margin-bottom:1rem">' + tabs.map(function (x) { return '<button type="button" class="chip" data-otab="' + x[0] + '" aria-pressed="' + (otab === x[0]) + '">' + x[1] + '</button>'; }).join('') + '</div>' +
      '<div id="o-body"></div>';
    head(o);
    var body = $('#o-body');
    if (otab === 'ringkasan') summary(o, body);
    else if (otab === 'data') {
      orderForm = B.form(body, o.draft, { slug: o.slug, who: function () { return token; }, onChange: function (d) { o.draft = d; o.draft_at = new Date().toISOString(); if (o.status === 'tayang') o.pending = true; call('team_order_save', { p_slug: o.slug, p_patch: { draft: d } }).catch(function () {}); head(o); } });
    } else if (otab === 'tamu') guestsView(o, body);
    else previewView(o, body);
    if (otab !== 'data') orderForm = null;
  }
  function head(o) {
    var s = OSTAT[o.status], live = o.status === 'tayang';
    $('#o-title').textContent = o.couple;
    $('#o-sub').innerHTML = '<span class="pill pill--' + s[2] + '">' + t(s[0], s[1]) + '</span> <span class="code">' + esc(o.code || '') + '</span> ' +
      (live ? '<a class="link" target="_blank" rel="noopener" href="https://' + esc(addr(o)) + '">' + esc(addr(o)) + '</a>' : '<span class="muted">' + esc(addr(o)) + ' ' + t('(belum tayang)', '(not live yet)') + '</span>');
    var miss = B.missing(B.norm(o.draft)), r = B.route(o.theme, themeRows());
    $('#o-acts').innerHTML = (o.status === 'arsip' ? '' :
      (live && !o.pending ? '' : '<button type="button" class="btn btn--main btn--sm" data-publish' + (miss.length || !r.built || !o.theme ? ' disabled' : '') + '>' + (live ? t('Terbitkan perubahan', 'Publish the changes') : t('Terbitkan', 'Publish')) + '</button>') +
      (live ? '<button type="button" class="btn btn--line btn--sm" data-copy="https://' + esc(addr(o)) + '">' + t('Salin tautan', 'Copy the link') + '</button><button type="button" class="btn btn--line btn--sm" data-unpublish>' + t('Turunkan', 'Take offline') + '</button>' : '')) +
      (!o.theme ? '<p class="small muted" style="width:100%">' + t('Pilih tema dulu di Ringkasan.', 'Choose a theme in Summary first.') + '</p>'
        : !r.built ? '<p class="small muted" style="width:100%">' + t('Tema ini belum punya undangan yang bekerja. Pilih tema lain, atau tunggu dunianya selesai dibuat.', 'This theme has no working invitation yet. Pick another, or wait until its world is built.') + '</p>'
        : miss.length ? '<p class="small muted" style="width:100%">' + t('Belum bisa terbit: ', 'Cannot publish yet: ') + esc(miss.join(', ')) + '</p>' : '');
  }
  function chipsOf(name, items, val) { return '<div class="chips" data-set="' + name + '">' + items.map(function (x) { return '<button type="button" class="chip" data-v="' + x[0] + '" aria-pressed="' + (String(val) === String(x[0])) + '">' + x[1] + '</button>'; }).join('') + '</div>'; }
  function summary(o, body) {
    var built = themeRows().filter(function (x) { return x.kit && !x.deleted_at; });
    var opts = [['umum', t('Tema Umum Nawala (Premium)', 'General Nawala theme (Premium)')]].concat(built.map(function (x) { return [x.slug, (K.lang() === 'en' ? x.name_en : x.name_id) + ' (' + K.tierName(x.tier) + ')']; }));
    var chosen = o.theme && !opts.some(function (x) { return x[0] === o.theme; }) ? [[o.theme, themeLabel(o.theme) + ' ' + t('(belum ada undangan)', '(no invitation yet)')]] : [];
    var ck = checks(o), d = B.norm(o.draft);
    var msg = 'Halo ' + o.couple + ', isi data undangan kalian di ' + DB.site + 'ruang/ dengan kode ' + o.code + '. Di sana kalian juga bisa mengunggah foto dan menyusun daftar tamu.';
    body.innerHTML = '<div class="osum">' +
      '<section class="card card--tile"><h2>' + t('Paket', 'Package') + '</h2>' +
        '<label class="bf__f"><span>' + t('Tema', 'Theme') + '</span><span class="field field--sel"><select id="o-theme"><option value="">' + t('Pilih tema', 'Choose a theme') + '</option>' +
        chosen.concat(opts).map(function (x) { return '<option value="' + esc(x[0]) + '"' + (x[0] === o.theme ? ' selected' : '') + '>' + esc(x[1]) + '</option>'; }).join('') + '</select></span></label>' +
        '<span class="small" style="font-weight:600">' + t('Tingkat isi', 'Level') + '</span>' + chipsOf('level', [[1, '1 Dasar'], [2, '2 Menengah'], [3, '3 Maksimal']], o.level) +
        '<span class="small" style="font-weight:600">' + t('Susunan kata', 'Wording') + '</span>' + chipsOf('wording', [['umum', t('Umum', 'Neutral')], ['islam', 'Islami']], o.wording) + '</section>' +
      '<section class="card card--tile"><h2>' + t('Pembayaran', 'Payment') + '</h2>' + chipsOf('pay_status', [['belum', t(PAY.belum[0], PAY.belum[1])], ['dp', 'DP'], ['lunas', t('Lunas', 'Paid')]], o.pay_status) +
        '<label class="bf__f"><span>' + t('Jumlah dibayar (Rp)', 'Amount paid (Rp)') + '</span><span class="field"><input id="o-amount" inputmode="numeric" value="' + (o.pay_amount == null ? '' : o.pay_amount) + '"></span><small id="o-amount-say">' + rupiah(o.pay_amount) + '</small></label>' +
        '<label class="bf__f"><span>' + t('Tanggal bayar', 'Payment date') + '</span><span class="field"><input id="o-paydate" type="date" value="' + (o.pay_date || '') + '"></span></label></section>' +
      '<section class="card card--tile"><h2>' + t('Tenggat', 'Deadlines') + '</h2>' +
        '<p class="small">' + t('Hari pernikahan: ', 'Wedding day: ') + '<b>' + (d.date ? K.day(new Date(d.date + 'T12:00:00')) + ', ' + K.date(new Date(d.date + 'T12:00:00')) + ' ' + d.date.slice(0, 4) : t('belum diisi', 'not filled in yet')) + '</b></p>' +
        '<label class="bf__f"><span>' + t('Target tayang', 'Go live by') + '</span><span class="field"><input id="o-liveby" type="date" value="' + (o.live_by || '') + '"></span></label>' +
        '<ul class="checks">' + ck.map(function (c) { return '<li class="' + (c[2] ? 'is-done' : '') + '">' + (c[3] ? '<i>' + (c[2] ? K.ic('check') : '') + '</i>' : '<button type="button" class="tick" data-tick="' + c[0] + '" aria-pressed="' + c[2] + '">' + (c[2] ? K.ic('check') : '') + '</button>') + '<span>' + c[1] + (c[3] ? '' : ' <small class="muted">' + t('(ketuk)', '(tap)') + '</small>') + '</span></li>'; }).join('') + '</ul></section>' +
      '<section class="card card--tile"><h2>' + t('Catatan', 'Notes') + '</h2><span class="field field--area"><textarea id="o-notes" rows="5" maxlength="4000" placeholder="' + t('Yang disepakati di panggilan video', 'What was agreed on the video call') + '"></textarea></span></section>' +
      '<section class="card card--tile"><h2>' + t('Pasangan', 'The couple') + '</h2><p class="small">' + t('Kode ruang pasangan: ', 'Room code: ') + '<b class="code">' + esc(o.code || '') + '</b></p>' +
        '<p class="small muted">' + (o.submitted_at ? t('Dikirim untuk diperiksa ', 'Sent for a check ') + K.ago(o.submitted_at) : t('Pasangan belum menekan "Kirim untuk diperiksa".', 'The couple has not pressed "Send for a check" yet.')) + '</p>' +
        '<span class="chips"><button type="button" class="btn btn--line btn--sm" data-copy="' + esc(o.code || '') + '">' + t('Salin kode', 'Copy the code') + '</button>' +
        '<a class="btn btn--line btn--sm" target="_blank" rel="noopener" href="' + esc(DB.wa(msg, waOf(o))) + '">' + t('Kirim petunjuk lewat WhatsApp', 'Send instructions on WhatsApp') + '</a></span>' +
        (o.status !== 'tayang' && o.status !== 'arsip' ? '<button type="button" class="link" data-archive style="margin-top:.6rem">' + t('Arsipkan pesanan ini', 'Archive this order') + '</button>' : '') + '</section>' +
      '</div>';
    $('#o-notes', body).value = o.notes || '';
  }
  function waOf(o) { var l = o.lead_id && D.leads.filter(function (x) { return x.id === o.lead_id; })[0]; return l ? intl(l.whatsapp) : ''; }
  function guestsView(o, body) {
    body.innerHTML = '<p class="muted">' + t('Memuat...', 'Loading...') + '</p>';
    call('team_order', { p_slug: o.slug }).then(function (r) {
      if (!r || openSlug !== o.slug || otab !== 'tamu') return;
      var ans = { hadir: [t('Hadir', 'Coming'), 'tayang'], tidak: [t('Tidak hadir', 'Not coming'), 'habis'], ragu: [t('Belum pasti', 'Not sure'), 'jalan'] };
      var coming = r.rsvps.filter(function (x) { return x.attending === 'hadir'; }).reduce(function (a, x) { return a + x.headcount; }, 0);
      body.innerHTML = '<div class="codes"><div><h2 class="sub" style="margin-top:0">' + t('Daftar tamu', 'Guest list') + ' <span class="muted">(' + r.guests.length + ')</span></h2>' +
        '<p class="small muted">' + t('Disusun pasangan di ruang mereka. Tautan pribadi tiap tamu aktif setelah undangan tayang.', 'Made by the couple in their room. Each guest\'s link works once the invitation is live.') + '</p><div class="rows">' +
        (r.guests.length ? r.guests.map(function (g) {
          var a = g.answer && ans[g.answer];
          return '<div class="row"><div class="row__t"><b>' + esc(g.name) + '</b><span>' + (g.phone ? esc(local(g.phone)) + ', ' : '') + (g.sent_at ? t('sudah dikirim', 'sent') : t('belum dikirim', 'not sent yet')) + '</span></div>' +
            (a ? '<span class="pill pill--' + a[1] + '">' + a[0] + '</span>' : '<span class="small muted">' + t('belum menjawab', 'no answer yet') + '</span>') +
            '<button type="button" class="round" style="width:44px;height:44px" data-copy="https://' + esc(addr(o)) + '?to=' + esc(encodeURIComponent(g.name)) + '" aria-label="' + t('Salin tautan', 'Copy the link') + '">' + K.ic('copy') + '</button></div>';
        }).join('') : '<div class="empty">' + t('Belum ada tamu di daftar.', 'No guests on the list yet.') + '</div>') + '</div></div>' +
        '<div><h2 class="sub" style="margin-top:0">' + t('Jawaban', 'Answers') + ' <span class="muted">(' + r.rsvps.length + ', ' + coming + ' ' + t('orang hadir', 'coming') + ')</span></h2><div class="rows">' +
        (r.rsvps.length ? r.rsvps.map(function (x) { var a = ans[x.attending]; return '<div class="row"><div class="row__t"><b>' + esc(x.guest) + '</b><span>' + K.ago(x.at) + '</span></div><span class="pill pill--' + a[1] + '">' + a[0] + (x.attending === 'hadir' ? ', ' + x.headcount : '') + '</span></div>'; }).join('') : '<div class="empty">' + t('Belum ada jawaban.', 'No answers yet.') + '</div>') + '</div>' +
        '<h2 class="sub">' + t('Ucapan', 'Wishes') + '</h2><div class="rows">' +
        (r.wishes.length ? r.wishes.map(function (w) { return '<div class="row' + (w.hidden ? ' is-dim' : '') + '"><div class="row__t"><b>' + esc(w.guest) + '</b><span class="wrap">' + esc(w.body) + '</span><span>' + K.ago(w.at) + '</span></div>' +
          '<button type="button" class="btn btn--line btn--sm" data-wish="' + w.id + '" data-hide="' + (w.hidden ? '0' : '1') + '">' + (w.hidden ? t('Tampilkan', 'Show') : t('Sembunyikan', 'Hide')) + '</button></div>'; }).join('') : '<div class="empty">' + t('Belum ada ucapan.', 'No wishes yet.') + '</div>') + '</div></div></div>';
    }).catch(function () {});
  }
  function previewView(o, body) {
    var r = B.route(o.theme, themeRows());
    body.innerHTML = '<div class="pv"><div class="pv__phone"><iframe id="pv-frame" title="' + t('Pratinjau undangan', 'Invitation preview') + '"></iframe></div>' +
      '<div class="pv__side"><p>' + t('Ini undangan seperti yang akan dilihat tamu, dengan data terbaru. Jawaban di pratinjau tidak disimpan.', 'This is the invitation as guests will see it, with the latest details. Answers in the preview are not saved.') + '</p>' +
      (!r.built ? '<p class="small"><b>' + t('Tema ini belum punya undangan; pratinjau memakai Tema Umum Nawala.', 'This theme has no invitation yet; the preview uses the General Nawala theme.') + '</b></p>' : '') +
      '<label class="bf__f"><span>' + t('Nama tamu di amplop', 'Guest name on the envelope') + '</span><span class="field"><input id="pv-guest" value="Bapak dan Ibu Santoso"></span></label>' +
      '<button type="button" class="btn btn--line btn--sm" id="pv-reload">' + t('Muat ulang pratinjau', 'Reload the preview') + '</button>' +
      '<a class="btn btn--line btn--sm" id="pv-open" target="_blank" rel="noopener">' + t('Buka di tab baru', 'Open in a new tab') + '</a></div></div>';
    function go() { B.preview($('#pv-frame'), o.draft, o, themeRows(), $('#pv-guest').value); $('#pv-open').href = $('#pv-frame').src; }
    $('#pv-reload').addEventListener('click', go); go();
  }
  $('#order').addEventListener('click', function (e) {
    var o = orderBy(openSlug); if (!o) return;
    var el;
    if (e.target.closest('[data-back]')) { openSlug = ''; orderForm = null; detail(true); orders(); return; }
    if ((el = e.target.closest('[data-otab]'))) { if (orderForm) orderForm.flush(); otab = el.getAttribute('data-otab'); detail(true); return; }
    if ((el = e.target.closest('[data-set] [data-v]'))) {
      var k = el.parentNode.getAttribute('data-set'), v = el.getAttribute('data-v'), p = {}; p[k] = k === 'level' ? +v : v;
      patch(o, p); K.$$('[data-v]', el.parentNode).forEach(function (b) { b.setAttribute('aria-pressed', String(b === el)); }); head(o); return;
    }
    if ((el = e.target.closest('[data-tick]'))) { var c = Object.assign({}, o.checklist || {}); c[el.getAttribute('data-tick')] = !c[el.getAttribute('data-tick')]; patch(o, { checklist: c }); detail(true); return; }
    if (e.target.closest('[data-archive]')) { write('team_order_save', { p_slug: o.slug, p_patch: { status: 'arsip' } }, function () { K.toast(o.couple + ': ' + t('diarsipkan.', 'archived.')); openSlug = ''; }); return; }
    if (e.target.closest('[data-publish]')) {
      if (orderForm) orderForm.flush();
      var c2 = B.compile(o.draft, o, themeRows(), false);
      if (!c2.built) return K.toast(t('Tema ini belum punya undangan.', 'This theme has no invitation yet.'));
      write('team_order_publish', { p_slug: o.slug, p_live: c2.data }, function (ok) { if (ok) K.toast(o.couple + ': ' + t('tayang di ', 'live at ') + addr(o)); });
      return;
    }
    if (e.target.closest('[data-unpublish]')) { write('team_order_publish', { p_slug: o.slug, p_live: null }, function () { K.toast(o.couple + ': ' + t('diturunkan. Tamu tidak bisa membukanya sampai diterbitkan lagi.', 'taken offline. Guests cannot open it until it is published again.')); }); return; }
    if ((el = e.target.closest('[data-wish]'))) {
      var hide = el.getAttribute('data-hide') === '1';
      call('team_wish', { p_id: el.getAttribute('data-wish'), p_hide: hide }).then(function () { detail(true); }).catch(function () {});
    }
  });
  $('#order').addEventListener('input', function (e) {
    var o = orderBy(openSlug); if (!o) return;
    var id = e.target.id;
    if (id === 'o-amount') { var n = e.target.value.replace(/\D/g, ''); $('#o-amount-say').textContent = rupiah(n); patch(o, { pay_amount: n }); }
    else if (id === 'o-paydate') patch(o, { pay_date: e.target.value });
    else if (id === 'o-liveby') patch(o, { live_by: e.target.value });
    else if (id === 'o-notes') patch(o, { notes: e.target.value }, true);
  });
  $('#order').addEventListener('change', function (e) {
    var o = orderBy(openSlug); if (!o || e.target.id !== 'o-theme') return;
    patch(o, { theme: e.target.value }); head(o);
  });

  /* ---------- Themes: add, edit, hide, mark as owned, delete (and bring back) ---------- */
  var tierFilter = 'semua', confirmDel = '', editing = null;
  var FAMS = [['alam', 'Alam', 'Nature'], ['royal', 'Kerajaan', 'Royal'], ['religi', 'Religi', 'Faith'], ['nusa', 'Nusantara', 'Nusantara'], ['dunia', 'Mancanegara', 'The world'], ['era', 'Lintas masa', 'Eras'], ['elemen', 'Elemen', 'Elements'], ['bunga', 'Bunga dan warna', 'Flowers and colour'], ['tempat', 'Tempat di Indonesia', 'Places in Indonesia'], ['budaya', 'Iman dan budaya', 'Faith and culture'], ['waktu', 'Musim dan waktu', 'Seasons and times of day']];
  function rowCover(r, size) {
    if (r.cover) return r.cover + (size ? '-' + size : '') + '.webp';
    return '../assets/img/cover-' + r.slug + (size ? '-' + size : '') + '.webp';
  }
  function themes() {
    var rows = themeRows(), live = rows.filter(function (r) { return !r.deleted_at; });
    var keys = [['semua', t('Semua', 'All'), live.length], ['dasar', K.tierName('dasar'), live.filter(function (r) { return r.tier === 'dasar'; }).length],
      ['premium', K.tierName('premium'), live.filter(function (r) { return r.tier === 'premium'; }).length], ['eksklusif', K.tierName('eksklusif'), live.filter(function (r) { return r.tier === 'eksklusif'; }).length],
      ['sembunyi', t('Tersembunyi', 'Hidden'), live.filter(function (r) { return r.hidden; }).length], ['hapus', t('Terhapus', 'Deleted'), rows.length - live.length]];
    $('#tier-filter').innerHTML = keys.map(function (k) { return '<button type="button" class="chip" data-f="' + k[0] + '" aria-pressed="' + (tierFilter === k[0]) + '">' + k[1] + ' <b>' + k[2] + '</b></button>'; }).join('');
    var cnt = chosenCount();
    var list = rows.filter(function (r) {
      var f = tierFilter === 'hapus' ? !!r.deleted_at : !r.deleted_at && (tierFilter === 'semua' || (tierFilter === 'sembunyi' ? r.hidden : r.tier === tierFilter));
      return f && hit(r.name_id, r.name_en, r.tier, r.slug);
    });
    $('#theme-grid').innerHTML = list.length ? list.map(function (r) {
      var n = cnt[r.slug] || 0, gone = !!r.deleted_at;
      return '<article class="tc' + (r.hidden || gone ? ' is-off' : '') + '"><div class="tc__art"><img src="' + esc(rowCover(r, 'm')) + '" alt="" loading="lazy">' +
        '<div class="tc__tags">' + (r.film ? '<span class="pill pill--jalan">Film</span>' : '') + (r.kit ? '<span class="pill pill--tayang">' + t('Undangan contoh', 'Sample invitation') + '</span>' : '') +
        (r.owned ? '<span class="pill pill--pink">' + t('Sudah dimiliki', 'Owned') + '</span>' : '') + (r.hidden && !gone ? '<span class="pill pill--habis">' + t('Tersembunyi', 'Hidden') + '</span>' : '') + '</div></div>' +
        '<div class="tc__in"><b>' + esc(K.lang() === 'en' ? r.name_en : r.name_id) + '</b><span>' + K.tierName(r.tier) + (r.film ? '' : ', ' + t('belum ada film', 'no film yet')) + (r.kit ? '' : ', ' + t('belum ada undangan', 'no invitation yet')) + '</span>' +
        '<span>' + (n ? n + ' ' + t('kali dipilih', n === 1 ? 'time chosen' : 'times chosen') : t('Belum pernah dipilih', 'Not chosen yet')) + '</span>' +
        (gone ? '<button type="button" class="btn btn--line btn--sm" data-restore="' + esc(r.slug) + '">' + t('Pulihkan', 'Bring back') + '</button>' :
          '<button type="button" class="switch" role="switch" aria-checked="' + !r.hidden + '" data-show="' + esc(r.slug) + '"><span>' + t('Tampil di situs', 'Shown on the site') + '</span><i></i></button>' +
          (r.tier === 'eksklusif' ? '<button type="button" class="switch" role="switch" aria-checked="' + !!r.owned + '" data-own="' + esc(r.slug) + '"><span>' + t('Sudah dimiliki', 'Owned') + '</span><i></i></button>' : '') +
          '<span class="tc__acts"><button type="button" class="btn btn--line btn--sm" data-edit="' + esc(r.slug) + '">' + t('Ubah', 'Edit') + '</button>' +
          (confirmDel === r.slug ? '<button type="button" class="btn btn--pink btn--sm" data-del="' + esc(r.slug) + '">' + t('Ya, hapus', 'Yes, delete') + '</button><button type="button" class="btn btn--line btn--sm" data-nodel>' + t('Batal', 'Cancel') + '</button>'
            : '<button type="button" class="btn btn--line btn--sm" data-askdel="' + esc(r.slug) + '">' + t('Hapus', 'Delete') + '</button>') + '</span>') +
        '</div></article>';
    }).join('') : '<div class="empty" style="grid-column:1 / -1"><b>' + t('Tidak ada tema di sini.', 'No theme here.') + '</b></div>';
  }
  function rowBy(s) { return themeRows().filter(function (r) { return r.slug === s; })[0]; }
  $('#tier-filter').addEventListener('click', function (e) { var b = e.target.closest('[data-f]'); if (b) { tierFilter = b.getAttribute('data-f'); themes(); } });
  $('#theme-grid').addEventListener('click', function (e) {
    var el;
    if ((el = e.target.closest('[data-show]'))) { var r = rowBy(el.getAttribute('data-show')); write('team_theme_save', { p_slug: r.slug, p_patch: { hidden: !r.hidden }, p_new: false }, function () { K.toast(r.name_id + ': ' + (r.hidden ? t('tampil lagi di situs.', 'shown on the site again.') : t('disembunyikan dari situs.', 'hidden from the site.'))); }); }
    else if ((el = e.target.closest('[data-own]'))) { var r2 = rowBy(el.getAttribute('data-own')); write('team_theme_save', { p_slug: r2.slug, p_patch: { owned: !r2.owned }, p_new: false }, function () { K.toast(r2.name_id + ': ' + (r2.owned ? t('tanda dimiliki dilepas.', 'no longer marked as owned.') : t('ditandai sudah dimiliki. Di situs tema ini tidak bisa dipilih lagi.', 'marked as owned. On the site it can no longer be chosen.'))); }); }
    else if ((el = e.target.closest('[data-askdel]'))) { confirmDel = el.getAttribute('data-askdel'); themes(); }
    else if (e.target.closest('[data-nodel]')) { confirmDel = ''; themes(); }
    else if ((el = e.target.closest('[data-del]'))) { var s = el.getAttribute('data-del'); confirmDel = ''; write('team_theme_delete', { p_slug: s, p_restore: false }, function () { K.toast(t('Tema dihapus dari situs. Bisa dipulihkan di Terhapus.', 'Theme removed from the site. It can be brought back under Deleted.')); }); }
    else if ((el = e.target.closest('[data-restore]'))) { write('team_theme_delete', { p_slug: el.getAttribute('data-restore'), p_restore: true }, function () { K.toast(t('Tema dipulihkan.', 'Theme brought back.')); }); }
    else if ((el = e.target.closest('[data-edit]'))) themeSheet(rowBy(el.getAttribute('data-edit')));
  });
  $('#theme-add').addEventListener('click', function () { themeSheet(null); });

  /* the sheet for one theme; a new theme needs a name and a cover */
  function themeSheet(r) {
    editing = r ? Object.assign({}, r) : { slug: '', tier: 'premium', family: 'alam', name_id: '', name_en: '', desc_id: '', desc_en: '', cover: '', film: '', isNew: true };
    var e = editing, pop = $('#theme-pop');
    $('#tp-title').textContent = e.isNew ? t('Tema baru', 'New theme') : t('Ubah tema', 'Edit theme');
    $('#tp-body').innerHTML =
      '<div class="bf__grid">' +
      '<label class="bf__f"><span>' + t('Nama', 'Name') + ' (ID) <i class="req">*</i></span><span class="field"><input id="tp-name-id" maxlength="40"></span></label>' +
      '<label class="bf__f"><span>' + t('Nama', 'Name') + ' (EN)</span><span class="field"><input id="tp-name-en" maxlength="40"></span></label>' +
      '<label class="bf__f bf__f--wide"><span>' + t('Deskripsi', 'Description') + ' (ID)</span><span class="field field--area"><textarea id="tp-desc-id" rows="2" maxlength="300"></textarea></span></label>' +
      '<label class="bf__f bf__f--wide"><span>' + t('Deskripsi', 'Description') + ' (EN)</span><span class="field field--area"><textarea id="tp-desc-en" rows="2" maxlength="300"></textarea></span></label></div>' +
      '<span class="small" style="font-weight:600">' + t('Tingkat', 'Tier') + '</span>' + chipsOf('tier', [['dasar', 'Dasar'], ['premium', 'Premium'], ['eksklusif', t('Eksklusif', 'Exclusive')]], e.tier) +
      (e.tier === 'premium' ? '<span class="small" style="font-weight:600">' + t('Keluarga', 'Family') + '</span>' + chipsOf('family', FAMS.map(function (f) { return [f[0], t(f[1], f[2])]; }), e.family) : '') +
      '<div class="tp-media"><div class="ph"><div class="ph__img">' + (e.cover || e.slug ? '<img src="' + esc(e.cover ? e.cover + '-m.webp' : '../assets/img/cover-' + e.slug + '-m.webp') + '" alt="">' : '<span>' + t('Belum ada sampul', 'No cover yet') + '</span>') + '</div>' +
        '<b>' + t('Sampul', 'Cover') + (e.isNew ? ' <i class="req">*</i>' : '') + '</b><span class="ph__acts"><label class="btn btn--line btn--sm">' + t('Unggah gambar', 'Upload a picture') + '<input type="file" accept="image/*" id="tp-cover" hidden></label></span>' +
        '<small class="muted">' + (e.tier === 'premium' ? '4:5' : '9:16') + t(', dipotong otomatis dari tengah.', ', cropped from the centre.') + '</small></div>' +
      '<div class="ph"><div class="ph__img">' + (e.film ? '<span>' + t('Ada film', 'Has a film') + '</span>' : '<span>' + t('Belum ada film', 'No film yet') + '</span>') + '</div><b>Film</b>' +
        '<span class="ph__acts"><label class="btn btn--line btn--sm">' + t('Unggah MP4', 'Upload an MP4') + '<input type="file" accept="video/mp4" id="tp-film" hidden></label>' + (e.film ? '<button type="button" class="btn btn--line btn--sm" id="tp-nofilm">' + t('Lepas', 'Remove') + '</button>' : '') + '</span>' +
        '<small class="muted">' + t('Bisu, 720 px lebar, paling besar 10 MB.', 'Silent, 720 px wide, 10 MB at most.') + '</small></div></div>' +
      (e.isNew ? '<p class="small muted">' + t('Tema baru langsung tampil di situs dengan tanda "Segera". Dunia undangannya dibuat terpisah.', 'A new theme shows on the site at once, marked "Soon". Its invitation world is built separately.') + '</p>' : '');
    $('#tp-name-id').value = e.name_id; $('#tp-name-en').value = e.name_en; $('#tp-desc-id').value = e.desc_id; $('#tp-desc-en').value = e.desc_en;
    if (!pop.open) pop.showModal();
  }
  function cropTo(file, ratio) {
    return createImageBitmap(file).then(function (img) {
      var w = img.width, h = img.height, cw = w, ch = Math.round(w / ratio);
      if (ch > h) { ch = h; cw = Math.round(h * ratio); }
      return { img: img, sx: Math.round((w - cw) / 2), sy: Math.round((h - ch) / 2), cw: cw, ch: ch };
    });
  }
  function variant(c, width, toned) {
    var cv = document.createElement('canvas'); cv.width = width; cv.height = Math.round(width * c.ch / c.cw);
    var x = cv.getContext('2d'); if (toned && 'filter' in x) x.filter = 'saturate(.58) contrast(.93)';
    x.drawImage(c.img, c.sx, c.sy, c.cw, c.ch, 0, 0, cv.width, cv.height);
    return B.toBlob(cv, 0.8);
  }
  $('#theme-pop').addEventListener('change', function (ev) {
    var e = editing; if (!e) return;
    if (ev.target.id === 'tp-cover' && ev.target.files[0]) {
      var name = $('#tp-name-id').value.trim(), slug = e.slug || slugFrom(name);
      if (!slug) return K.toast(t('Isi nama tema dulu.', 'Write the theme\'s name first.'));
      if (e.isNew && rowBy(slug)) return K.toast(t('Nama itu sudah dipakai tema lain.', 'Another theme already has that name.'));
      K.toast(t('Menyiapkan sampul...', 'Preparing the cover...'));
      cropTo(ev.target.files[0], e.tier === 'premium' ? 0.8 : 0.5625).then(function (c) {
        return Promise.all([variant(c, 640, false), variant(c, 640, true), variant(c, 400, true), variant(c, 220, true)]);
      }).then(function (b) {
        if (b.some(function (x) { return x.type !== 'image/webp'; })) throw new Error('webp');
        return DB.put(token, 'theme', slug, [{ blob: b[0] }, { suffix: '-t', blob: b[1] }, { suffix: '-m', blob: b[2] }, { suffix: '-s', blob: b[3] }]);
      }).then(function (base) {
        e.cover = base; e.slug = slug;
        e.name_id = $('#tp-name-id').value; e.name_en = $('#tp-name-en').value; e.desc_id = $('#tp-desc-id').value; e.desc_en = $('#tp-desc-en').value;
        themeSheet(e.isNew ? e : Object.assign(e, { isNew: false })); editing = e; K.toast(t('Sampul siap. Tekan Simpan.', 'Cover ready. Press Save.'));
      }).catch(function (er) { K.toast(er && er.message === 'webp' ? t('Browser ini tidak bisa membuat WebP. Pakai Chrome.', 'This browser cannot make WebP. Use Chrome.') : t('Sampul belum bisa diunggah. Coba lagi.', 'The cover could not be uploaded. Try again.')); });
    }
    if (ev.target.id === 'tp-film' && ev.target.files[0]) {
      var fl = ev.target.files[0], s2 = e.slug || slugFrom($('#tp-name-id').value);
      if (fl.size > 10485760) return K.toast(t('Film lebih dari 10 MB. Perkecil dulu.', 'The film is over 10 MB. Make it smaller first.'));
      if (!s2) return K.toast(t('Isi nama tema dulu.', 'Write the theme\'s name first.'));
      K.toast(t('Mengunggah film...', 'Uploading the film...'));
      DB.put(token, 'theme', s2, [{ blob: fl.type === 'video/mp4' ? fl : new Blob([fl], { type: 'video/mp4' }) }]).then(function (base) {
        e.film = base + '.mp4'; e.slug = e.slug || s2; e.name_id = $('#tp-name-id').value; e.name_en = $('#tp-name-en').value; e.desc_id = $('#tp-desc-id').value; e.desc_en = $('#tp-desc-en').value;
        themeSheet(e); editing = e; K.toast(t('Film siap. Tekan Simpan.', 'Film ready. Press Save.'));
      }).catch(function () { K.toast(t('Film belum bisa diunggah. Coba lagi.', 'The film could not be uploaded. Try again.')); });
    }
  });
  $('#theme-pop').addEventListener('click', function (ev) {
    var e = editing, el; if (!e) return;
    if ((el = ev.target.closest('[data-set] [data-v]'))) {
      e[el.parentNode.getAttribute('data-set')] = el.getAttribute('data-v');
      e.name_id = $('#tp-name-id').value; e.name_en = $('#tp-name-en').value; e.desc_id = $('#tp-desc-id').value; e.desc_en = $('#tp-desc-en').value;
      themeSheet(e); editing = e;
    }
    if (ev.target.id === 'tp-nofilm') { e.film = ''; themeSheet(e); editing = e; }
    if (ev.target.closest('[data-tpclose]') || ev.target === $('#theme-pop')) $('#theme-pop').close();
  });
  $('#tp-save').addEventListener('click', function () {
    var e = editing; if (!e) return;
    var name = $('#tp-name-id').value.trim();
    if (!name) { $('#tp-name-id').focus(); return K.toast(t('Isi nama tema.', 'Write the theme\'s name.')); }
    var slug = e.slug || slugFrom(name);
    if (e.isNew && !e.cover) return K.toast(t('Tema baru perlu sampul.', 'A new theme needs a cover.'));
    if (e.isNew && rowBy(slug)) return K.toast(t('Nama itu sudah dipakai tema lain.', 'Another theme already has that name.'));
    var p = { tier: e.tier, family: e.tier === 'premium' ? e.family : '', name_id: name, name_en: $('#tp-name-en').value.trim(), desc_id: $('#tp-desc-id').value.trim(), desc_en: $('#tp-desc-en').value.trim(), film: e.film || '' };
    if (e.cover) p.cover = e.cover;
    write('team_theme_save', { p_slug: slug, p_patch: p, p_new: !!e.isNew }, function (ok) {
      if (ok === false) return K.toast(t('Belum tersimpan. Periksa isiannya.', 'Not saved. Check the fields.'));
      $('#theme-pop').close(); K.toast(name + ': ' + t('tersimpan. Situs memakainya saat halaman dibuka lagi.', 'saved. The site uses it next time the page opens.'));
    });
  });

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
    overview(); leads(); orders(); themes(); codes();
    if (gateNote) note(gateNote);
    document.title = t('Nawala, konsol tim', 'Nawala, team console');
  }
  K.onLang(all);
  K.start();
  if (stored()) enter(stored(), false); else $('#gate-token').focus();
})();
