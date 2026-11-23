/* Persiapan: the project dashboard for each wedding, shared by the team console (tim/) and the couple's room (ruang/).
   Everything is read and written through the functions in supabase/migrations/20261123_persiapan.sql
   (pm_open, pm_save, pm_set, pm_board, pm_chat, pm_say, pm_ticket, pm_dir_save); nothing here is a sample.
   The team sees every wedding (pm_board) and opens one; the couple sees only their own.
   Tools: Ringkasan, WBS, Kanban, Gantt, RAB, Vendor, Rundown, Rapat, Persetujuan, Berkas, Pengingat, Obrolan.
   Data of each row lives in item.data; the part in data.tim (internal cost, margin, commission, private notes) and rows
   marked team_only never reach the couple: the database strips them, the page only hides the inputs.
   Host API: NAWALA_PM.mount({ root, as: 'tim'|'pasangan', who: fn -> token or code, onDenied: fn }), .open(slug), .board(). */
window.NAWALA_PM = (function () {
  'use strict';
  var K = window.K, DB = window.NAWALA_DB, t = K.t, esc = K.esc;
  var H = null, root = null, pop = null;
  var S = null, items = {}, tab = 'ringkasan', slug = null, B = null;
  var ui = { wbsShut: {}, kanWho: '', ganttZoom: 'bulan', vendTab: 'nikah', fileTab: 'berkas', room: 'bersama', remDone: false };
  var queue = {}, qTimer = 0, pollTimer = 0, chatTimer = 0, chat = { msgs: [], last: 0, room: '' };

  /* ---------------------------------------------------------------- small helpers */
  function team() { return H && H.as === 'tim'; }
  function canEdit() { return !S || S.edit !== false; }
  function uid() {
    if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) { var r = Math.random() * 16 | 0; return (c === 'x' ? r : (r & 3 | 8)).toString(16); });
  }
  function el(html) { var d = document.createElement('div'); d.innerHTML = html.trim(); return d.firstChild; }
  function todayStr() { var d = new Date(); return iso(d); }
  function iso(d) { return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
  function day(s) { if (!s || !/^\d{4}-\d{2}-\d{2}/.test(s)) return null; var p = s.slice(0, 10).split('-'); return new Date(+p[0], +p[1] - 1, +p[2], 12); }
  function addDays(s, n) { var d = day(s); d.setDate(d.getDate() + n); return iso(d); }
  function diff(a, b) { return Math.round((day(b) - day(a)) / 86400000); }
  function fdate(s, short) { var d = day(s); return d ? K.date(d, short) + (short ? '' : ' ' + d.getFullYear()) : '-'; }
  function rp(n) { n = Math.round(+n || 0); return 'Rp ' + n.toLocaleString('id-ID'); }
  /* rupiah only: whole numbers; "30.000.000" (Indonesian thousands dots) reads as thirty million */
  function num(v) { if (typeof v === 'number') return isFinite(v) ? Math.round(v) : 0; var n = parseInt(String(v == null ? '' : v).replace(/[^\d-]/g, ''), 10); return isFinite(n) ? n : 0; }
  function get(o, path) { return path.split('.').reduce(function (a, k) { return a == null ? a : a[k]; }, o); }
  function set(o, path, v) {
    var ks = path.split('.'), last = ks.pop(), c = o;
    ks.forEach(function (k) { if (!c[k] || typeof c[k] !== 'object') c[k] = {}; c = c[k]; });
    if (v === '' || v == null || v === false) delete c[last]; else c[last] = v;
    if (ks.length && !Object.keys(c).length) delete o[ks[0]];
  }
  function memberName(id) { if (!id) return ''; if (id === 'pasangan') return t('Pasangan', 'Couple'); if (id === 'tim') return t('Tim Nawala', 'Nawala team'); var m = (S && S.members || B && B.members || []).filter(function (x) { return x.id === id; })[0]; return m ? m.name : ''; }
  function whoOpts() {
    var o = [['', t('Belum ditentukan', 'Not assigned')], ['pasangan', t('Pasangan', 'Couple')], ['tim', t('Tim Nawala', 'Nawala team')]];
    (S && S.members || []).forEach(function (m) { o.push([m.id, m.name]); });
    return o;
  }
  function svg(p) { return '<svg class="ic" viewBox="0 0 24 24" aria-hidden="true">' + p + '</svg>'; }
  var IC = {
    back: '<path d="M15 5 8 12l7 7"/>', bell: '<path d="M6 16V11a6 6 0 0 1 12 0v5l2 2H4z"/><path d="M10 20a2 2 0 0 0 4 0"/>',
    plus: '<path d="M12 5v14M5 12h14"/>', cal: '<rect x="4" y="5" width="16" height="15" rx="3"/><path d="M4 10h16M9 3v4M15 3v4"/>',
    up: '<path d="m6 15 6-6 6 6"/>', down: '<path d="m6 9 6 6 6-6"/>', left: '<path d="m15 6-6 6 6 6"/>', right: '<path d="m9 6 6 6-6 6"/>',
    clip: '<path d="M8 12.5 14.5 6a3 3 0 0 1 4.2 4.2L10 19a4.5 4.5 0 0 1-6.4-6.4L12 4.3"/>', send: '<path d="M4 12 20 4l-6 16-3-7z"/>',
    file: '<path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4"/>', copy: '<rect x="8" y="8" width="12" height="12" rx="2.5"/><path d="M16 8V6.5A2.5 2.5 0 0 0 13.5 4h-7A2.5 2.5 0 0 0 4 6.5v7A2.5 2.5 0 0 0 6.5 16H8"/>',
    lock: '<rect x="5" y="11" width="14" height="9" rx="2.5"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>', wa: '<path d="M5 19l1.2-3.5A7.5 7.5 0 1 1 9 18.6z"/>',
    indent: '<path d="M4 6h16M10 12h10M10 18h10"/><path d="m4 10 3 2-3 2"/>', outdent: '<path d="M4 6h16M10 12h10M10 18h10"/><path d="m7 10-3 2 3 2"/>'
  };

  /* ---------------------------------------------------------------- vocabulary */
  var STATUS = [['belum', 'Belum', 'To do', 0], ['dikerjakan', 'Dikerjakan', 'Doing', 0.5], ['ditinjau', 'Ditinjau', 'In review', 0.8], ['selesai', 'Selesai', 'Done', 1]];
  function stName(k) { var s = STATUS.filter(function (x) { return x[0] === k; })[0] || STATUS[0]; return t(s[1], s[2]); }
  function stWeight(k) { var s = STATUS.filter(function (x) { return x[0] === k; })[0]; return s ? s[3] : 0; }
  var PAYER = [['bersama', 'Bersama', 'Shared'], ['pasangan', 'Pasangan', 'The couple'], ['pria', 'Pihak pria', 'Groom\'s side'], ['wanita', 'Pihak wanita', 'Bride\'s side']];
  var STAGE = [['dp', 'DP', 'Deposit'], ['termin', 'Termin', 'Instalment'], ['pelunasan', 'Pelunasan', 'Final payment']];
  var VSTAT = [['calon', 'Calon', 'Candidate'], ['dihubungi', 'Dihubungi', 'Contacted'], ['deal', 'Deal', 'Booked'], ['lunas', 'Lunas', 'Paid'], ['batal', 'Batal', 'Dropped']];
  var VCAT = ['Tempat', 'Katering', 'Dekorasi', 'MUA', 'Busana', 'Foto dan video', 'Musik', 'MC', 'Cincin', 'Suvenir', 'Undangan', 'Transportasi', 'Lain-lain'];
  var APPR = [['menunggu', 'Menunggu', 'Waiting'], ['disetujui', 'Disetujui', 'Approved'], ['revisi', 'Minta perubahan', 'Changes asked']];
  function pick(list, k) { var s = list.filter(function (x) { return x[0] === k; })[0]; return s ? t(s[1], s[2]) : (k || ''); }
  function opts(list) { return list.map(function (x) { return [x[0], t(x[1], x[2])]; }); }

  var TABS = [['ringkasan', 'Ringkasan', 'Overview'], ['wbs', 'WBS', 'WBS'], ['kanban', 'Kanban', 'Kanban'], ['gantt', 'Gantt', 'Gantt'],
    ['rab', 'RAB', 'Budget'], ['vendor', 'Vendor', 'Vendors'], ['rundown', 'Rundown', 'Rundown'], ['rapat', 'Rapat', 'Meetings'],
    ['setuju', 'Persetujuan', 'Approvals'], ['berkas', 'Berkas', 'Files'], ['ingat', 'Pengingat', 'Reminders'], ['obrolan', 'Obrolan', 'Chat']];

  /* ---------------------------------------------------------------- the items */
  function all(kind) { return Object.keys(items).map(function (k) { return items[k]; }).filter(function (i) { return !kind || i.kind === kind; }).sort(function (a, b) { return (a.sort - b.sort) || ((a.at || '') < (b.at || '') ? -1 : 1); }); }
  function kids(id, kind) { return all(kind || 'tugas').filter(function (i) { return i.parent === id; }); }
  function roots(kind) { return all(kind).filter(function (i) { return !i.parent || !items[i.parent]; }); }
  function label(it) {
    var d = it.data || {};
    if (it.kind === 'rab') return (K.lang() === 'en' && d.item_en) || d.item || '';
    return (K.lang() === 'en' && d.title_en) || d.title || d.name || d.item || '';
  }
  /* WBS: numbers by position, leaves, progress and dates rolled up */
  var W = {};
  function wbsIndex() {
    W = { code: {}, leaves: {}, depth: {}, order: [] };
    function walk(list, pre, depth) {
      list.forEach(function (it, i) {
        var code = pre ? pre + '.' + (i + 1) : String(i + 1);
        W.code[it.id] = code; W.depth[it.id] = depth; W.order.push(it.id);
        var ks = kids(it.id);
        walk(ks, code, depth + 1);
        W.leaves[it.id] = ks.length ? ks.reduce(function (a, k) { return a.concat(W.leaves[k.id]); }, []) : [it.id];
      });
    }
    walk(roots('tugas'), '', 0);
  }
  function isLeaf(it) { return !kids(it.id).length; }
  function prog(id) { var ls = W.leaves[id] || [id]; if (!ls.length) return 0; return ls.reduce(function (a, l) { return a + stWeight((items[l].data || {}).status); }, 0) / ls.length; }
  function span(id) {
    var ls = W.leaves[id] || [id], s = null, e = null;
    ls.concat([id]).forEach(function (l) { var d = items[l] && items[l].data || {}; if (d.start && (!s || d.start < s)) s = d.start; if (d.due && (!e || d.due > e)) e = d.due; if (d.due && !d.start && (!s || d.due < s)) s = d.due; });
    return [s, e];
  }
  function subtree(id) { var out = [id]; kids(id).forEach(function (k) { out = out.concat(subtree(k.id)); }); return out; }
  function leaves() { return all('tugas').filter(isLeaf); }
  function overdue(d) { return d.due && d.status !== 'selesai' && d.due < todayStr(); }
  /* RAB */
  function pays(rabId) { return all('bayar').filter(function (p) { return p.parent === rabId; }); }
  function actual(r) { var ps = pays(r.id), paid = ps.filter(function (p) { return p.data.paid; }); return ps.length ? paid.reduce(function (a, p) { return a + num(p.data.amount); }, 0) : num(r.data.actual); }
  function wbsBudget(id) { var ids = subtree(id); return all('rab').filter(function (r) { return ids.indexOf(r.data.wbs) > -1; }).reduce(function (a, r) { return [a[0] + num(r.data.plan), a[1] + actual(r)]; }, [0, 0]); }

  /* ---------------------------------------------------------------- saving */
  function wire(it) { return { id: it.id, kind: it.kind, parent: it.parent || null, sort: it.sort || 0, team_only: !!it.team_only, data: it.data }; }
  function put(it) {
    if (!canEdit()) return;
    it.at = new Date().toISOString(); items[it.id] = it; queue[it.id] = wire(it); later();
  }
  function make(kind, data, parent, extra) {
    var sibs = all(kind).filter(function (i) { return (i.parent || null) === (parent || null); });
    var it = { id: uid(), kind: kind, parent: parent || null, sort: (sibs.length ? sibs[sibs.length - 1].sort : 0) + 10, team_only: false, data: data || {}, made: H.as };
    if (extra) Object.keys(extra).forEach(function (k) { it[k] = extra[k]; });
    put(it); return it;
  }
  function drop(id) {
    if (!canEdit() || !items[id]) return;
    var gone = [id];
    (function walk(p) { Object.keys(items).forEach(function (k) { if (items[k].parent === p) { gone.push(k); walk(k); } }); })(id);
    gone.forEach(function (k) { delete items[k]; delete queue[k]; });
    queue[id] = { id: id, del: true }; later();
  }
  function later() { clearTimeout(qTimer); qTimer = setTimeout(flush, 700); status(t('Menyimpan...', 'Saving...')); }
  var flushing = null;
  function flush() {
    var ops = Object.keys(queue).map(function (k) { return queue[k]; });
    if (!ops.length || !slug) return Promise.resolve();
    if (flushing) { later(); return flushing; }
    queue = {};
    flushing = DB.rpc('pm_save', { p_who: H.who(), p_slug: slug, p_ops: ops }).then(function (r) {
      if (r === null) { denied(); return; }
      status(t('Tersimpan', 'Saved'));
    }, function () {
      ops.forEach(function (o) { if (!queue[o.id]) queue[o.id] = o; });
      status(t('Belum tersimpan, dicoba lagi', 'Not saved yet, retrying'));
      K.offline(); clearTimeout(qTimer); qTimer = setTimeout(flush, 5000);
    }).then(function () { flushing = null; });
    return flushing;
  }
  window.addEventListener('pagehide', function () {
    var ops = Object.keys(queue).map(function (k) { return queue[k]; });
    if (ops.length && slug) DB.rpc('pm_save', { p_who: H.who(), p_slug: slug, p_ops: ops }, true).catch(function () {});
  });
  function status(s) { var e = root && root.querySelector('.pm-save'); if (e) e.textContent = s; }
  function denied() {
    stop();
    if (team()) { if (H.onDenied) H.onDenied(); return; }
    root.innerHTML = '<div class="panel g"><div class="empty"><b>' + t('Persiapan sudah ditutup.', 'The plan is closed.') + '</b>' +
      t('Akses persiapan berlaku sampai 30 hari setelah hari H. Hubungi kami lewat WhatsApp bila masih perlu dibuka.', 'Plan access lasts until 30 days after the wedding. Tell us on WhatsApp if you still need it.') +
      '<p style="margin-top:1rem"><a class="btn btn--line btn--sm" target="_blank" rel="noopener" href="' + DB.wa(t('Halo Nawala, kami masih perlu membuka halaman Persiapan.', 'Hello Nawala, we still need the Plan page.')) + '">WhatsApp</a></p></div></div>';
  }

  /* ---------------------------------------------------------------- loading */
  function take(d) {
    S = d; items = {};
    (d.items || []).forEach(function (i) { items[i.id] = i; });
    Object.keys(queue).forEach(function (k) { var q = queue[k]; if (q.del) delete items[k]; else items[k] = Object.assign({}, items[k] || {}, q); });
  }
  function load(quiet) {
    return DB.rpc('pm_open', { p_who: H.who(), p_slug: slug }).then(function (d) {
      if (!d) { denied(); return; }
      if (H.as === 'pasangan') slug = d.slug;
      var typing = pop && pop.open || (document.activeElement && root.contains(document.activeElement) && /INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName));
      if (quiet && (typing || flushing || Object.keys(queue).length)) { if (S) { S.unread = d.unread; S.dir = d.dir; badge(); } return; }
      take(d); draw();
    }, function () { if (!quiet) { K.offline(); if (!S) root.innerHTML = '<div class="panel g"><div class="empty"><b>' + t('Belum terhubung.', 'Not connected yet.') + '</b>' + t('Database Nawala belum bisa dihubungi. Coba lagi sebentar lagi.', 'The Nawala database cannot be reached. Try again in a moment.') + '</div></div>'; } });
  }
  function poll() {
    stop();
    pollTimer = setInterval(function () {
      if (document.hidden || !root || !root.offsetParent) return;
      if (slug || H.as === 'pasangan') load(true); else boardLoad(true);
    }, 30000);
  }
  function stop() { clearInterval(pollTimer); clearInterval(chatTimer); }

  /* ---------------------------------------------------------------- mounting */
  function mount(opts) {
    H = opts; root = opts.root;
    if (!pop) {
      pop = el('<dialog class="pop pop--wide pm-pop" aria-labelledby="pm-pop-h"><div class="pop__box"><h2 id="pm-pop-h"></h2><div class="pop__body pm-form" id="pm-pop-body"></div><div class="pop__acts" id="pm-pop-acts"></div></div></dialog>');
      document.body.appendChild(pop);
      pop.addEventListener('click', function (e) { if (e.target === pop) pop.close(); });
    }
    root.addEventListener('click', onClick);
    root.addEventListener('change', onChange);
    K.onLang(function () { if (!root.offsetParent) return; if (slug || H.as === 'pasangan') { if (S) draw(); } else if (B) drawBoard(); });
  }
  function show() {
    if (!H) return;
    if (H.as === 'pasangan') { if (!S) { root.innerHTML = '<div class="pm-wait">' + t('Memuat persiapan...', 'Loading the plan...') + '</div>'; } load(); }
    else if (slug) load(); else boardLoad();
    poll();
  }
  function open(s) { flush(); slug = s; S = null; tab = 'ringkasan'; root.innerHTML = '<div class="pm-wait">' + t('Memuat persiapan...', 'Loading the plan...') + '</div>'; load(); poll(); }
  function board() { flush(); slug = null; S = null; items = {}; stop(); boardLoad(); poll(); }

  /* ================================================================ the team's view across every wedding */
  function boardLoad(quiet) {
    if (!quiet && !B) root.innerHTML = '<div class="pm-wait">' + t('Memuat semua persiapan...', 'Loading every plan...') + '</div>';
    return DB.rpc('pm_board', { t: H.who() }).then(function (d) {
      if (!d) { if (H.onDenied) H.onDenied(); return; }
      B = d; if (!slug) drawBoard();
    }, function () { if (!quiet) K.offline(); });
  }
  function drawBoard() {
    var d = B, today = todayStr(), ws = d.weddings || [];
    var late = d.due.filter(function (x) { return x.due < today; }), week = d.due.filter(function (x) { return x.due >= today; });
    var waiting = ws.filter(function (w) { return w.waiting || w.unread.bersama || w.unread.tim; });
    var stat = function (n, l, sub) { return '<div class="stat"><span class="stat__l">' + l + '</span><span class="stat__n">' + n + '</span><span class="stat__d">' + sub + '</span></div>'; };
    var h = '<div class="pm-board">' +
      '<div class="panel g pm-head"><div class="panel__h"><div><h1>' + t('Persiapan', 'Plans') + '</h1><p>' + t('Semua pernikahan yang sedang disiapkan: jadwal, tenggat, obrolan yang menunggu, dan beban kerja tim.', 'Every wedding in preparation: timelines, deadlines, chats waiting and the team\'s workload.') + '</p></div></div>' +
      '<div class="stats pm-stats">' + stat(ws.length, t('Pernikahan', 'Weddings'), t('pesanan aktif', 'active orders')) + stat(late.length, t('Lewat tenggat', 'Overdue'), t('tugas dan pembayaran', 'tasks and payments')) +
        stat(week.length, t('7 hari ke depan', 'Next 7 days'), t('jatuh tempo', 'falling due')) + stat(waiting.length, t('Obrolan', 'Chats'), t('menunggu balasan', 'waiting for a reply')) + '</div></div>';

    /* all weddings on one timeline */
    h += '<section class="card g pm-card"><div class="card__h"><div><h2>' + t('Semua pernikahan', 'All weddings') + '</h2><p>' + t('Dari tugas pertama sampai hari H. Ketuk untuk membuka.', 'From the first task to the wedding day. Tap to open.') + '</p></div></div>';
    if (!ws.length) h += '<div class="empty"><b>' + t('Belum ada pesanan.', 'No orders yet.') + '</b>' + t('Persiapan muncul di sini setelah pesanan dibuat di Pesanan.', 'Plans appear here once an order is made under Orders.') + '</div>';
    else {
      var lo = today, hi = addDays(today, 60);
      ws.forEach(function (w) { if (w.first && w.first < lo) lo = w.first; [w.date, w.last].forEach(function (x) { if (x && x > hi) hi = x; }); });
      lo = addDays(lo, -7); hi = addDays(hi, 14);
      var total = Math.max(1, diff(lo, hi)), pc = function (s) { return Math.max(0, Math.min(100, diff(lo, s) / total * 100)); };
      h += '<div class="pm-tl"><div class="pm-tl__axis">' + months(lo, hi).map(function (m) { return '<span style="left:' + pc(m[0]) + '%">' + esc(m[1]) + '</span>'; }).join('') + '<i class="pm-today" style="left:' + pc(today) + '%"></i></div>';
      ws.forEach(function (w) {
        var a = w.first || today, b = w.date || w.last || addDays(a, 30), p = w.tasks ? w.done / w.tasks : 0;
        h += '<button type="button" class="pm-tl__row" data-open="' + esc(w.slug) + '"><span class="pm-tl__name"><b>' + esc(w.couple) + '</b><small>' + (w.date ? fdate(w.date) + ' · ' + hmin(w.date) : t('tanggal belum diisi', 'no date yet')) + (w.full ? ' · ' + t('penuh', 'full') : '') + '</small></span>' +
          '<span class="pm-tl__lane"><i class="pm-tl__bar" style="left:' + pc(a) + '%;width:' + Math.max(1.5, pc(b) - pc(a)) + '%"><i style="transform:scaleX(' + p.toFixed(3) + ')"></i></i>' +
          (w.date ? '<i class="pm-tl__day" style="left:' + pc(w.date) + '%" data-tip="' + esc(t('Hari H', 'Wedding day') + ' ' + fdate(w.date)) + '"></i>' : '') + '<i class="pm-today" style="left:' + pc(today) + '%"></i></span>' +
          '<span class="pm-tl__pct">' + Math.round(p * 100) + '%</span></button>';
      });
      h += '</div>';
    }
    h += '</section>';

    h += '<div class="pm-grid3">';
    /* overdue and this week */
    h += '<section class="card g pm-card"><div class="card__h"><div><h2>' + t('Lewat tenggat dan minggu ini', 'Overdue and this week') + '</h2><p>' + t('Tugas dan pembayaran dari semua pernikahan', 'Tasks and payments from every wedding') + '</p></div></div><div class="rows pm-due">';
    if (!d.due.length) h += '<div class="empty"><b>' + t('Aman.', 'All clear.') + '</b>' + t('Tidak ada yang lewat tenggat atau jatuh tempo minggu ini.', 'Nothing is overdue or due this week.') + '</div>';
    d.due.slice(0, 40).forEach(function (x) {
      var lateX = x.due < today;
      h += '<button type="button" class="row pm-row" data-open="' + esc(x.slug) + '" data-tab="' + (x.type === 'bayar' ? 'rab' : 'kanban') + '"><span class="pm-dot' + (lateX ? ' is-late' : '') + '"></span><span class="row__t"><b>' + esc(x.title) + '</b><small>' + esc(x.couple) + ' · ' + (x.type === 'bayar' ? t('Pembayaran', 'Payment') + (x.amount ? ' ' + rp(x.amount) : '') : esc(memberName(x.who) || t('belum ditentukan', 'unassigned'))) + '</small></span><span class="pill' + (lateX ? ' pill--pink' : '') + '">' + (lateX ? t('lewat ', 'late ') + (-diff(today, x.due)) + t(' hr', 'd') : fdate(x.due, true)) + '</span></button>';
    });
    h += '</div></section>';
    /* chats */
    h += '<section class="card g pm-card"><div class="card__h"><div><h2>' + t('Obrolan', 'Chats') + '</h2><p>' + t('Pasangan yang menunggu balasan dan pesan belum dibaca', 'Couples waiting for a reply and unread messages') + '</p></div></div><div class="rows">';
    if (!waiting.length) h += '<div class="empty"><b>' + t('Tidak ada yang menunggu.', 'Nobody is waiting.') + '</b></div>';
    waiting.forEach(function (w) {
      h += '<button type="button" class="row pm-row" data-open="' + esc(w.slug) + '" data-tab="obrolan"><span class="row__t"><b>' + esc(w.couple) + '</b><small>' + (w.waiting ? t('Pesan terakhir dari pasangan', 'Last message is from the couple') : t('Ada pesan baru', 'New messages')) + '</small></span>' +
        (w.unread.bersama ? '<span class="pill pill--pink">' + w.unread.bersama + ' ' + t('bersama', 'shared') + '</span>' : '') + (w.unread.tim ? '<span class="pill">' + w.unread.tim + ' ' + t('tim', 'team') + '</span>' : '') + '</button>';
    });
    h += '</div></section>';
    /* workload */
    var load = d.load || {}, ppl = (d.members || []).map(function (m) { return [m.id, m.name, load[m.id] || 0]; });
    ppl.push(['tim', t('Tim Nawala (umum)', 'Nawala team (shared)'), load.tim || 0], ['pasangan', t('Pasangan', 'Couples'), load.pasangan || 0], ['', t('Belum ditentukan', 'Unassigned'), load[''] || 0]);
    var mx = Math.max.apply(null, ppl.map(function (p) { return p[2]; }).concat([1]));
    h += '<section class="card g pm-card"><div class="card__h"><div><h2>' + t('Beban kerja', 'Workload') + '</h2><p>' + t('Tugas terbuka per orang, semua pernikahan', 'Open tasks per person, all weddings') + '</p></div></div><div class="pm-load">' +
      ppl.map(function (p) { return '<div class="pm-load__r"><span>' + esc(p[1]) + '</span><span class="meter"><i style="--v:' + (p[2] / mx).toFixed(3) + '"></i></span><b>' + p[2] + '</b></div>'; }).join('') + '</div></section>';
    h += '</div>';

    /* wedding cards */
    if (ws.length) {
      h += '<section class="panel g pm-cards"><div class="panel__h"><div><h2 class="pm-h2">' + t('Buka persiapan', 'Open a plan') + '</h2></div></div><div class="pm-wcards">';
      ws.forEach(function (w) {
        var p = w.tasks ? w.done / w.tasks : 0;
        h += '<button type="button" class="pm-wc" data-open="' + esc(w.slug) + '"><b>' + esc(w.couple) + '</b><small>' + (w.date ? fdate(w.date) + ' · ' + hmin(w.date) : t('tanggal belum diisi', 'no date yet')) + '</small>' +
          '<span class="meter"><i style="--v:' + p.toFixed(3) + '"></i></span><span class="pm-wc__f"><span>' + w.done + '/' + w.tasks + ' ' + t('tugas', 'tasks') + '</span><span class="pill' + (w.full ? ' pill--tayang' : '') + '">' + (w.full ? t('Pernikahan penuh', 'Full wedding') : t('Undangan', 'Invitation')) + '</span></span></button>';
      });
      h += '</div></section>';
    }
    root.innerHTML = h + '</div>';
  }
  function months(lo, hi) {
    var out = [], d = day(lo); d.setDate(1); d.setMonth(d.getMonth() + 1);
    while (iso(d) <= hi) { out.push([iso(d), K.month(d.getMonth() + 1).slice(0, 3) + (d.getMonth() === 0 ? ' ' + d.getFullYear() : '')]); d.setMonth(d.getMonth() + 1); }
    return out;
  }
  function hmin(date) { var n = diff(todayStr(), date); return n > 0 ? 'H-' + n : n === 0 ? t('Hari H', 'The day') : 'H+' + (-n); }

  /* ================================================================ one wedding */
  function draw() {
    if (!S) return;
    wbsIndex();
    var p = leaves().length ? leaves().reduce(function (a, l) { return a + stWeight(l.data.status); }, 0) / leaves().length : 0;
    var rem = reminders(), un = (S.unread.bersama || 0) + (S.unread.tim || 0);
    var h = '<div class="pm-one"><div class="panel g pm-head">' +
      '<div class="pm-head__top">' + (team() ? '<button type="button" class="btn btn--line btn--sm pm-back" data-back>' + svg(IC.back) + t('Semua', 'All') + '</button>' : '') +
        '<div class="pm-head__t"><h1>' + esc(S.couple) + '</h1><p>' + (S.date ? fdate(S.date) + ' · <b>' + hmin(S.date) + '</b>' : t('Tanggal pernikahan belum diisi. Isi di halaman Undangan agar jadwal bisa dihitung.', 'No wedding date yet. Fill it in on the Invitation page so the schedule can be worked out.')) +
          ' · <span class="pm-save">' + t('Tersimpan', 'Saved') + '</span></p></div>' +
        '<button type="button" class="pm-bell" data-tab-go="ingat" aria-label="' + t('Pengingat', 'Reminders') + '">' + svg(IC.bell) + (rem.length ? '<i>' + rem.length + '</i>' : '') + '</button></div>' +
      '<div class="pm-head__m"><span class="meter"><i style="--v:' + p.toFixed(3) + '"></i></span><b>' + Math.round(p * 100) + '%</b><span class="pill' + (S.full ? ' pill--tayang' : '') + '">' + (S.full ? t('Undangan + pernikahan penuh', 'Invitation + full wedding') : t('Undangan', 'Invitation')) + '</span>' +
        (team() && S.money ? '<button type="button" class="switch pm-full" role="switch" aria-checked="' + !!S.full + '" data-full><span>' + t('Perencanaan pernikahan penuh', 'Full wedding planning') + '</span><i></i></button>' : '') + '</div>' +
      '<div class="gbar pm-tabs" role="tablist">' + TABS.map(function (x) {
        var n = x[0] === 'obrolan' && un ? '<i class="pm-n">' + un + '</i>' : x[0] === 'setuju' ? waitN() : '';
        return '<button type="button" role="tab" aria-selected="' + (tab === x[0]) + '" data-tab-go="' + x[0] + '">' + t(x[1], x[2]) + n + '</button>';
      }).join('') + '</div></div><div class="pm-body" id="pm-body"></div></div>';
    root.innerHTML = h;
    var sel = root.querySelector('.pm-tabs [aria-selected="true"]'); if (sel) sel.scrollIntoView({ block: 'nearest', inline: 'center' });
    body();
    badge();
  }
  function waitN() { var n = all('setuju').filter(function (a) { return (a.data.status || 'menunggu') === 'menunggu'; }).length; return n ? '<i class="pm-n">' + n + '</i>' : ''; }
  function badge() { if (H.onBadge) H.onBadge((S && S.unread ? (S.unread.bersama || 0) + (S.unread.tim || 0) : 0) + (S ? reminders().length : 0)); }
  function body() {
    clearInterval(chatTimer);
    var b = root.querySelector('#pm-body'); if (!b) return;
    wbsIndex();
    var fn = { ringkasan: vSummary, wbs: vWbs, kanban: vKanban, gantt: vGantt, rab: vRab, vendor: vVendor, rundown: vRundown, rapat: vRapat, setuju: vSetuju, berkas: vBerkas, ingat: vIngat, obrolan: vChat }[tab] || vSummary;
    fn(b);
  }
  function card(title, sub, inner, tools, cls) {
    return '<section class="card g pm-card ' + (cls || '') + '"><div class="card__h"><div><h2>' + title + '</h2>' + (sub ? '<p>' + sub + '</p>' : '') + '</div>' + (tools || '') + '</div>' + inner + '</section>';
  }
  function addBtn(kind, text, extra) { return canEdit() ? '<button type="button" class="btn btn--line btn--sm" data-add="' + kind + '"' + (extra || '') + '>' + svg(IC.plus) + text + '</button>' : ''; }
  function empty(b, s) { return '<div class="empty"><b>' + b + '</b>' + (s || '') + '</div>'; }
  function lockMark(it) { return it.team_only ? '<span class="pm-lock" data-tip="' + esc(t('Hanya tim', 'Team only')) + '">' + svg(IC.lock) + '</span>' : ''; }

  /* ---------------------------------------------------------------- Ringkasan */
  function vSummary(b) {
    var today = todayStr(), ls = leaves();
    var next = ls.filter(function (l) { return l.data.status !== 'selesai'; }).sort(function (a, c) { return (a.data.due || '9') < (c.data.due || '9') ? -1 : 1; }).slice(0, 6);
    var rabs = all('rab'), plan = rabs.reduce(function (a, r) { return a + num(r.data.plan); }, 0), act = rabs.reduce(function (a, r) { return a + actual(r); }, 0);
    var dueP = all('bayar').filter(function (p) { return !p.data.paid && p.data.due; }).sort(function (a, c) { return a.data.due < c.data.due ? -1 : 1; }).slice(0, 5);
    var branches = roots('tugas');
    var h = '<div class="pm-grid2">';
    h += card(t('Kemajuan per bagian', 'Progress by part'), t('Dari WBS: setiap bagian adalah rata-rata tugasnya', 'From the WBS: each part averages its tasks'),
      '<div class="pm-load">' + (branches.length ? branches.map(function (r) { var pp = prog(r.id); return '<button type="button" class="pm-load__r" data-tab-go="wbs"><span>' + esc(W.code[r.id] + ' ' + label(r)) + '</span><span class="meter"><i style="--v:' + pp.toFixed(3) + '"></i></span><b>' + Math.round(pp * 100) + '%</b></button>'; }).join('') : empty(t('Belum ada tugas.', 'No tasks yet.'))) + '</div>');
    h += card(t('Tugas berikutnya', 'Next tasks'), t('Yang belum selesai, paling dekat tenggatnya', 'Not done yet, nearest deadline first'),
      '<div class="rows">' + (next.length ? next.map(function (l) { var od = overdue(l.data); return '<button type="button" class="row pm-row" data-edit="' + l.id + '"><span class="pm-dot' + (od ? ' is-late' : '') + '"></span><span class="row__t"><b>' + esc(label(l)) + '</b><small>' + esc(memberName(l.data.who) || t('belum ditentukan', 'unassigned')) + ' · ' + stName(l.data.status) + '</small></span><span class="pill' + (od ? ' pill--pink' : '') + '">' + (l.data.due ? fdate(l.data.due, true) : '-') + '</span></button>'; }).join('') : empty(t('Semua tugas selesai.', 'Every task is done.'))) + '</div>', '<a href="#" data-tab-go="kanban">' + t('Kanban', 'Kanban') + '</a>');
    h += card(t('Anggaran', 'Budget'), t('Rencana dan yang sudah dibayar', 'Planned and paid so far'),
      '<div class="pm-money"><div><small>' + t('Rencana', 'Planned') + '</small><b>' + rp(plan) + '</b></div><div><small>' + t('Terbayar', 'Paid') + '</small><b>' + rp(act) + '</b></div></div><span class="meter meter--sun"><i style="--v:' + (plan ? Math.min(1, act / plan) : 0).toFixed(3) + '"></i></span>' +
      '<div class="rows" style="margin-top:.6rem">' + dueP.map(function (p) { var r = items[p.parent] || { data: {} }; var od = p.data.due < today; return '<button type="button" class="row pm-row" data-edit="' + p.parent + '"><span class="pm-dot' + (od ? ' is-late' : '') + '"></span><span class="row__t"><b>' + esc(label(r)) + '</b><small>' + pick(STAGE, p.data.stage) + ' · ' + rp(p.data.amount) + '</small></span><span class="pill' + (od ? ' pill--pink' : '') + '">' + fdate(p.data.due, true) + '</span></button>'; }).join('') + '</div>', '<a href="#" data-tab-go="rab">RAB</a>');
    var appr = all('setuju').filter(function (a) { return (a.data.status || 'menunggu') === 'menunggu'; });
    h += card(t('Perlu perhatian', 'Needs attention'), '',
      '<div class="rows">' +
        '<button type="button" class="row pm-row" data-tab-go="obrolan"><span class="row__t"><b>' + t('Obrolan', 'Chat') + '</b><small>' + ((S.unread.bersama || 0) + (S.unread.tim || 0)) + ' ' + t('pesan belum dibaca', 'unread messages') + '</small></span></button>' +
        '<button type="button" class="row pm-row" data-tab-go="setuju"><span class="row__t"><b>' + t('Persetujuan', 'Approvals') + '</b><small>' + appr.length + ' ' + t('menunggu jawaban', 'waiting for an answer') + '</small></span></button>' +
        '<button type="button" class="row pm-row" data-tab-go="ingat"><span class="row__t"><b>' + t('Pengingat', 'Reminders') + '</b><small>' + reminders().length + ' ' + t('dalam beberapa hari ke depan', 'in the next few days') + '</small></span></button>' +
      '</div>' +
      '<div class="pm-acts">' + (S.date && canEdit() ? '<button type="button" class="btn btn--line btn--sm" data-reschedule>' + svg(IC.cal) + t('Hitung ulang tanggal dari hari H', 'Re-plan dates from the wedding day') + '</button>' : '') +
        '<button type="button" class="btn btn--line btn--sm" data-ics-all>' + svg(IC.cal) + t('Semua tenggat ke kalender', 'All deadlines to a calendar') + '</button></div>');
    h += '</div>';
    if (team() && S.money) {
      h += card(t('Akses pasangan', 'Couple\'s access'), t('Halaman Persiapan pasangan terbuka sampai tanggal ini (bawaan: 30 hari setelah hari H).', 'The couple\'s Plan page stays open until this date (default: 30 days after the wedding).'),
        '<div class="pm-acts"><label class="field pm-f"><input type="date" data-until value="' + esc(S.until_set ? S.until || '' : '') + '"></label><span class="small muted">' + (S.until ? t('Sekarang: ', 'Now: ') + fdate(S.until) : t('Tanpa tanggal hari H, akses tetap terbuka.', 'Without a wedding date, access stays open.')) + '</span></div>', '', 'pm-narrow');
    }
    b.innerHTML = h;
  }

  /* ---------------------------------------------------------------- WBS */
  function vWbs(b) {
    var h = '<div class="pm-wbs__head"><span>' + t('Kode', 'Code') + '</span><span>' + t('Pekerjaan', 'Work') + '</span><span>' + t('Oleh', 'By') + '</span><span>' + t('Jadwal', 'Dates') + '</span><span>' + t('Anggaran', 'Budget') + '</span><span>' + t('Kemajuan', 'Progress') + '</span><span></span></div>';
    function row(it) {
      var d = it.data, ks = kids(it.id), sp = span(it.id), bud = wbsBudget(it.id), pp = prog(it.id), shut = ui.wbsShut[it.id], dep = W.depth[it.id];
      var r = '<div class="pm-wbs__r' + (ks.length ? ' is-sum' : '') + '" style="--dep:' + dep + '">' +
        '<span class="pm-wbs__code">' + (ks.length ? '<button type="button" class="pm-fold" data-fold="' + it.id + '" aria-expanded="' + !shut + '">' + svg(shut ? IC.right : IC.down) + '</button>' : '<i></i>') + esc(W.code[it.id]) + '</span>' +
        '<button type="button" class="pm-wbs__name" data-edit="' + it.id + '">' + esc(label(it)) + lockMark(it) + (overdue(d) && !ks.length ? ' <span class="pill pill--pink">' + t('lewat', 'late') + '</span>' : '') + '</button>' +
        '<span class="pm-wbs__who">' + esc(ks.length ? '' : memberName(d.who)) + '</span>' +
        '<span class="pm-wbs__dt">' + (sp[0] || sp[1] ? fdate(sp[0] || sp[1], true) + ' - ' + fdate(sp[1] || sp[0], true) : '-') + '</span>' +
        '<span class="pm-wbs__bud">' + (bud[0] ? rp(bud[0]) : '') + '</span>' +
        '<span class="pm-wbs__p"><span class="meter"><i style="--v:' + pp.toFixed(3) + '"></i></span><b>' + Math.round(pp * 100) + '%</b></span>' +
        '<span class="pm-wbs__acts">' + (canEdit() ? '<button type="button" data-wbs="child" data-id="' + it.id + '" aria-label="' + t('Tambah turunan', 'Add a sub-item') + '" data-tip="' + t('Tambah turunan', 'Add a sub-item') + '">' + svg(IC.plus) + '</button>' +
          '<button type="button" data-wbs="up" data-id="' + it.id + '" aria-label="' + t('Naik', 'Up') + '">' + svg(IC.up) + '</button><button type="button" data-wbs="down" data-id="' + it.id + '" aria-label="' + t('Turun', 'Down') + '">' + svg(IC.down) + '</button>' +
          '<button type="button" data-wbs="out" data-id="' + it.id + '" aria-label="' + t('Naikkan tingkat', 'Outdent') + '" data-tip="' + t('Naikkan tingkat', 'Outdent') + '">' + svg(IC.outdent) + '</button><button type="button" data-wbs="in" data-id="' + it.id + '" aria-label="' + t('Turunkan tingkat', 'Indent') + '" data-tip="' + t('Turunkan tingkat', 'Indent') + '">' + svg(IC.indent) + '</button>' : '') + '</span></div>';
      if (!shut) ks.forEach(function (k) { r += row(k); });
      return r;
    }
    var rs = roots('tugas');
    h += rs.map(row).join('') || empty(t('Belum ada pekerjaan.', 'No work items yet.'));
    b.innerHTML = card(t('Struktur rincian kerja (WBS)', 'Work breakdown structure (WBS)'),
      t('Pekerjaan dipecah jadi bagian dan tugas. Kemajuan dan anggaran setiap bagian dijumlah dari turunannya. RAB bisa dikaitkan ke bagian mana pun.', 'Work broken into parts and tasks. Progress and budget of each part add up from below. Budget lines can hang under any part.'),
      '<div class="pm-wbs">' + h + '</div>', '<div class="panel__tools">' + addBtn('tugas', t('Bagian baru', 'New part'), ' data-root') + '</div>');
  }
  function wbsMove(id, how) {
    var it = items[id]; if (!it) return;
    var sibs = all('tugas').filter(function (i) { return (i.parent || null) === (it.parent || null); }), i = sibs.indexOf(it);
    function resort(list) { list.forEach(function (x, n) { if (x.sort !== (n + 1) * 10) { x.sort = (n + 1) * 10; put(x); } }); }
    if (how === 'up' && i > 0) { sibs.splice(i, 1); sibs.splice(i - 1, 0, it); resort(sibs); }
    else if (how === 'down' && i < sibs.length - 1) { sibs.splice(i, 1); sibs.splice(i + 1, 0, it); resort(sibs); }
    else if (how === 'in' && i > 0) { var np = sibs[i - 1]; var ks = kids(np.id); it.parent = np.id; it.sort = (ks.length ? ks[ks.length - 1].sort : 0) + 10; put(it); delete ui.wbsShut[np.id]; }
    else if (how === 'out' && it.parent && items[it.parent]) { var p = items[it.parent], gs = all('tugas').filter(function (x) { return (x.parent || null) === (p.parent || null); }); it.parent = p.parent || null; gs.splice(gs.indexOf(p) + 1, 0, it); resort(gs); put(it); }
    else if (how === 'child') { delete ui.wbsShut[id]; var c = make('tugas', { title: t('Tugas baru', 'New task'), status: 'belum' }, id); body(); edit(c.id); return; }
    body();
  }

  /* ---------------------------------------------------------------- Kanban */
  function vKanban(b) {
    var who = ui.kanWho, ls = leaves().filter(function (l) { return !who || (l.data.who || '') === who; }).sort(function (a, c) { return (a.data.due || '9999') < (c.data.due || '9999') ? -1 : (a.data.due || '9999') > (c.data.due || '9999') ? 1 : 0; });
    var chips = [['', t('Semua', 'All')], ['pasangan', t('Pasangan', 'Couple')], ['tim', t('Tim Nawala', 'Nawala team')]];
    if (team() && S.ref) chips.splice(1, 0, [S.ref, t('Saya', 'Me')]);
    var h = '<div class="pm-kan__tools"><div class="gbar">' + chips.map(function (c) { return '<button type="button" data-kanwho="' + c[0] + '" aria-pressed="' + (who === c[0]) + '">' + c[1] + '</button>'; }).join('') + '</div>' + addBtn('tugas', t('Tugas baru', 'New task')) + '</div><div class="pm-kan">';
    STATUS.forEach(function (s, si) {
      var col = ls.filter(function (l) { return (l.data.status || 'belum') === s[0]; });
      h += '<div class="pm-kan__col g" data-col="' + s[0] + '"><div class="pm-kan__h"><b>' + t(s[1], s[2]) + '</b><span>' + col.length + '</span></div><div class="pm-kan__list">';
      col.forEach(function (l) {
        var d = l.data, od = overdue(d), par = l.parent && items[l.parent];
        h += '<article class="pm-kc" draggable="' + canEdit() + '" data-id="' + l.id + '"><button type="button" class="pm-kc__t" data-edit="' + l.id + '"><small>' + esc(W.code[l.id] || '') + (par ? ' · ' + esc(label(par)) : '') + '</small><b>' + esc(label(l)) + lockMark(l) + '</b></button>' +
          '<div class="pm-kc__f"><span class="pm-kc__who">' + esc(memberName(d.who) || '') + '</span>' + (d.due ? '<span class="pill' + (od ? ' pill--pink' : '') + '">' + fdate(d.due, true) + '</span>' : '') + '</div>' +
          (canEdit() ? '<div class="pm-kc__mv">' + (si > 0 ? '<button type="button" data-mv="' + STATUS[si - 1][0] + '" data-id="' + l.id + '" aria-label="' + t('Ke kiri', 'Move left') + '">' + svg(IC.left) + '</button>' : '<i></i>') + (si < 3 ? '<button type="button" data-mv="' + STATUS[si + 1][0] + '" data-id="' + l.id + '" aria-label="' + t('Ke kanan', 'Move right') + '">' + svg(IC.right) + '</button>' : '') + '</div>' : '') + '</article>';
      });
      h += '</div></div>';
    });
    b.innerHTML = h + '</div>';
    /* desktop drag and drop; phones use the arrows */
    var dragId = null;
    b.querySelectorAll('.pm-kc').forEach(function (c) {
      c.addEventListener('dragstart', function (e) { dragId = c.getAttribute('data-id'); c.classList.add('is-drag'); e.dataTransfer.effectAllowed = 'move'; try { e.dataTransfer.setData('text/plain', dragId); } catch (x) {} });
      c.addEventListener('dragend', function () { c.classList.remove('is-drag'); });
    });
    b.querySelectorAll('.pm-kan__col').forEach(function (col) {
      col.addEventListener('dragover', function (e) { if (dragId) { e.preventDefault(); col.classList.add('is-over'); } });
      col.addEventListener('dragleave', function () { col.classList.remove('is-over'); });
      col.addEventListener('drop', function (e) { e.preventDefault(); col.classList.remove('is-over'); if (dragId) setStatus(dragId, col.getAttribute('data-col')); dragId = null; });
    });
  }
  function setStatus(id, st) { var it = items[id]; if (!it || it.data.status === st) return; it.data.status = st; if (st === 'selesai') it.data.done = todayStr(); else delete it.data.done; put(it); body(); }

  /* ---------------------------------------------------------------- Gantt */
  var ZOOM = { minggu: 26, bulan: 9, semua: 0 };
  function vGantt(b) {
    var rows = [], today = todayStr();
    (function walk(list) { list.forEach(function (it) { rows.push(it); if (!ui.wbsShut[it.id]) walk(kids(it.id)); }); })(roots('tugas'));
    var lo = null, hi = null;
    rows.forEach(function (r) { var s = span(r.id); if (s[0] && (!lo || s[0] < lo)) lo = s[0]; if (s[1] && (!hi || s[1] > hi)) hi = s[1]; });
    lo = lo && lo < today ? lo : today; hi = hi && hi > today ? hi : addDays(today, 60);
    if (S.date && S.date > hi) hi = S.date;
    lo = addDays(lo, -7); hi = addDays(hi, 10);
    var days = diff(lo, hi) + 1, wrap = b.clientWidth || 900, labW = window.innerWidth < 700 ? 130 : 260;
    var pxd = ZOOM[ui.ganttZoom] || Math.max(2, (wrap - labW - 40) / days), W2 = Math.round(days * pxd);
    var x = function (s) { return diff(lo, s) * pxd; };
    var axis = '';
    months(lo, hi).forEach(function (m) { axis += '<span class="pm-g__m" style="left:' + x(m[0]) + 'px">' + esc(m[1]) + '</span>'; });
    if (pxd >= 20) { for (var i = 0; i < days; i += 7) { var dd = addDays(lo, i); axis += '<span class="pm-g__w" style="left:' + x(dd) + 'px">' + day(dd).getDate() + '</span>'; } }
    var h = '<div class="pm-kan__tools"><div class="gbar">' + [['minggu', t('Minggu', 'Weeks')], ['bulan', t('Bulan', 'Months')], ['semua', t('Semua', 'Fit')]].map(function (z) { return '<button type="button" data-zoom="' + z[0] + '" aria-pressed="' + (ui.ganttZoom === z[0]) + '">' + z[1] + '</button>'; }).join('') + '</div>' +
      '<span class="small muted">' + (canEdit() ? t('Geser batang untuk memindah tanggal, tarik ujung kanannya untuk mengubah lama.', 'Drag a bar to move it, pull its right end to change its length.') : '') + '</span></div>';
    h += '<div class="pm-g g" style="--lab:' + labW + 'px"><div class="pm-g__in" style="width:' + (labW + W2) + 'px">' +
      '<div class="pm-g__axis"><span class="pm-g__lab"></span><div class="pm-g__scale" style="width:' + W2 + 'px">' + axis + '</div></div>' +
      '<div class="pm-g__rows" style="--w:' + W2 + 'px">' +
        months(lo, hi).map(function (m) { return '<i class="pm-g__ml" style="left:' + (labW + x(m[0])) + 'px"></i>'; }).join('') +
        '<i class="pm-g__today" style="left:' + (labW + x(today)) + 'px"></i>' + (S.date ? '<i class="pm-g__day" style="left:' + (labW + x(S.date)) + 'px"><span>' + t('Hari H', 'Wedding') + '</span></i>' : '');
    rows.forEach(function (r) {
      var leaf = isLeaf(r), sp = span(r.id), d = r.data, s = leaf ? (d.start || d.due) : sp[0], e = leaf ? (d.due || d.start) : sp[1];
      h += '<div class="pm-g__r' + (leaf ? '' : ' is-sum') + '"><button type="button" class="pm-g__lab" data-edit="' + r.id + '" style="--dep:' + W.depth[r.id] + '"><small>' + esc(W.code[r.id]) + '</small>' + esc(label(r)) + '</button><div class="pm-g__lane">';
      if (s && e) {
        var st = d.status || 'belum';
        h += '<span class="pm-g__bar st-' + (leaf ? st : 'sum') + (leaf && overdue(d) ? ' is-late' : '') + '" data-bar="' + (leaf && canEdit() ? r.id : '') + '" style="left:' + x(s) + 'px;width:' + Math.max(pxd, (diff(s, e) + 1) * pxd) + 'px" data-tip="' + esc(label(r) + ': ' + fdate(s, true) + ' - ' + fdate(e, true)) + '">' +
          (leaf ? '' : '<i style="transform:scaleX(' + prog(r.id).toFixed(3) + ')"></i>') + (leaf && canEdit() ? '<b class="pm-g__h" data-end></b>' : '') + '</span>';
      } else if (leaf) h += '<span class="pm-g__none">' + t('tanpa tanggal', 'no dates') + '</span>';
      h += '</div></div>';
    });
    h += '</div></div></div>';
    b.innerHTML = h;
    var sc = b.querySelector('.pm-g'); if (sc && ui.ganttZoom !== 'semua') sc.scrollLeft = Math.max(0, x(today) - 120);
    /* dragging: whole bar moves both dates, the handle moves the end; snapped to days */
    b.querySelectorAll('[data-bar]').forEach(function (bar) {
      var id = bar.getAttribute('data-bar'); if (!id) return;
      bar.addEventListener('pointerdown', function (e) {
        if (e.button) return;
        var end = !!e.target.closest('[data-end]'), it = items[id], x0 = e.clientX, l0 = bar.offsetLeft, w0 = bar.offsetWidth, moved = 0;
        bar.setPointerCapture(e.pointerId); bar.classList.add('is-drag');
        function mv(ev) { var dx = ev.clientX - x0; moved = Math.round(dx / pxd); if (end) bar.style.width = Math.max(pxd, w0 + moved * pxd) + 'px'; else bar.style.left = (l0 + moved * pxd) + 'px'; }
        function up() {
          bar.removeEventListener('pointermove', mv); bar.removeEventListener('pointerup', up); bar.removeEventListener('pointercancel', up); bar.classList.remove('is-drag');
          if (!moved) { edit(id); return; }
          var s = it.data.start || it.data.due, en = it.data.due || it.data.start;
          if (end) { en = addDays(en, moved); if (en < s) en = s; } else { s = addDays(s, moved); en = addDays(en, moved); }
          it.data.start = s; it.data.due = en; put(it); body();
        }
        bar.addEventListener('pointermove', mv); bar.addEventListener('pointerup', up); bar.addEventListener('pointercancel', up);
      });
    });
  }

  /* ---------------------------------------------------------------- RAB */
  function vRab(b) {
    var rs = all('rab'), cats = {}, plan = 0, act = 0, sched = 0, byPayer = {}, cost = 0, marginAmt = 0;
    rs.forEach(function (r) {
      var c = r.data.cat || t('Lain-lain', 'Other'), a = actual(r), p = num(r.data.plan);
      (cats[c] = cats[c] || []).push(r); plan += p; act += a;
      pays(r.id).forEach(function (x) { if (!x.data.paid) sched += num(x.data.amount); });
      var py = r.data.payer || 'bersama'; byPayer[py] = (byPayer[py] || [0, 0]); byPayer[py][0] += p; byPayer[py][1] += a;
      if (r.data.tim) { cost += num(r.data.tim.cost); marginAmt += p - num(r.data.tim.cost); }
    });
    var h = '<div class="pm-grid4">' +
      '<div class="stat"><span class="stat__l">' + t('Rencana (anggaran)', 'Planned (budget)') + '</span><span class="stat__n pm-sm">' + rp(plan) + '</span></div>' +
      '<div class="stat"><span class="stat__l">' + t('Realisasi (terbayar)', 'Actual (paid)') + '</span><span class="stat__n pm-sm">' + rp(act) + '</span><span class="stat__d">' + (plan ? Math.round(act / plan * 100) + '% ' + t('dari rencana', 'of plan') : '') + '</span></div>' +
      '<div class="stat"><span class="stat__l">' + t('Terjadwal, belum dibayar', 'Scheduled, unpaid') + '</span><span class="stat__n pm-sm">' + rp(sched) + '</span></div>' +
      '<div class="stat"><span class="stat__l">' + t('Selisih rencana dan realisasi', 'Plan minus actual') + '</span><span class="stat__n pm-sm">' + rp(plan - act) + '</span></div></div>';
    h += '<div class="pm-payers">' + PAYER.filter(function (p) { return byPayer[p[0]]; }).map(function (p) { var v = byPayer[p[0]]; return '<span class="pill">' + t(p[1], p[2]) + ': ' + rp(v[0]) + ' / ' + rp(v[1]) + '</span>'; }).join('') + '</div>';
    if (team() && (cost || marginAmt)) h += '<p class="pm-tim small">' + svg(IC.lock) + t('Hanya tim: biaya internal ', 'Team only: internal cost ') + rp(cost) + t(', selisih untuk Nawala ', ', margin for Nawala ') + rp(marginAmt) + '</p>';
    var tb = '<div class="pm-rab"><div class="pm-rab__head"><span>' + t('Pos', 'Item') + '</span><span>' + t('Pembayar', 'Paid by') + '</span><span>' + t('Rencana', 'Planned') + '</span><span>' + t('Realisasi', 'Actual') + '</span><span>' + t('Selisih', 'Gap') + '</span><span>' + t('Tahap bayar', 'Payments') + '</span></div>';
    Object.keys(cats).forEach(function (c) {
      var list = cats[c], cp = list.reduce(function (a, r) { return a + num(r.data.plan); }, 0), ca = list.reduce(function (a, r) { return a + actual(r); }, 0);
      tb += '<div class="pm-rab__cat"><b>' + esc(c) + '</b><span>' + rp(cp) + '</span><span>' + rp(ca) + '</span></div>';
      list.forEach(function (r) {
        var a = actual(r), p = num(r.data.plan), g = p - a, ven = r.data.vendor && items[r.data.vendor];
        tb += '<button type="button" class="pm-rab__r" data-edit="' + r.id + '"><span class="pm-rab__i"><b>' + esc(label(r)) + lockMark(r) + '</b>' + (ven ? '<small>' + esc(ven.data.name || '') + '</small>' : '') + '</span>' +
          '<span class="pm-rab__py">' + pick(PAYER, r.data.payer || 'bersama') + '</span><span data-l="' + t('Rencana', 'Planned') + '">' + rp(p) + '</span><span data-l="' + t('Realisasi', 'Actual') + '">' + rp(a) + '</span><span data-l="' + t('Selisih', 'Gap') + '" class="' + (g < 0 ? 'is-over' : '') + '">' + rp(g) + '</span>' +
          '<span class="pm-rab__pays">' + pays(r.id).map(function (x) { var od = !x.data.paid && x.data.due && x.data.due < todayStr(); return '<i class="pm-pay' + (x.data.paid ? ' is-paid' : od ? ' is-late' : '') + '" data-tip="' + esc(pick(STAGE, x.data.stage) + ' ' + rp(x.data.amount) + (x.data.paid ? ' · ' + t('lunas ', 'paid ') + fdate(x.data.paid, true) : x.data.due ? ' · ' + t('jatuh tempo ', 'due ') + fdate(x.data.due, true) : '')) + '">' + esc(pick(STAGE, x.data.stage)) + ((x.data.files || []).length ? ' ' + svg(IC.clip) : '') + '</i>'; }).join('') + '</span></button>';
      });
    });
    tb += '</div>';
    if (!rs.length) tb = empty(t('Belum ada pos anggaran.', 'No budget lines yet.'), t('Tambah pos, lalu tahap pembayarannya (DP, termin, pelunasan) dan bukti transfernya.', 'Add a line, then its payment stages (deposit, instalments, final) and the transfer receipts.'));
    b.innerHTML = h + card(t('Rencana anggaran biaya (RAB)', 'Budget plan (RAB)'), t('Ketuk pos untuk mengubah, menambah tahap bayar, atau mengunggah bukti.', 'Tap a line to edit it, add payment stages or upload receipts.'), tb,
      '<div class="panel__tools">' + addBtn('rab', t('Pos baru', 'New line')) + '<button type="button" class="btn btn--line btn--sm" data-csv>' + svg(IC.file) + 'CSV</button></div>');
  }
  function rabCsv() {
    var rows = [[t('Kategori', 'Category'), t('Pos', 'Item'), t('Pembayar', 'Paid by'), t('Rencana', 'Planned'), t('Realisasi', 'Actual'), t('Selisih', 'Gap')].concat(team() ? [t('Biaya internal', 'Internal cost')] : [])];
    all('rab').forEach(function (r) { var a = actual(r), p = num(r.data.plan); rows.push([r.data.cat || '', label(r), pick(PAYER, r.data.payer || 'bersama'), p, a, p - a].concat(team() ? [num(r.data.tim && r.data.tim.cost)] : [])); });
    var csv = '﻿' + rows.map(function (r) { return r.map(function (c) { c = String(c); return /[",;\n]/.test(c) ? '"' + c.replace(/"/g, '""') + '"' : c; }).join(';'); }).join('\n');
    save(new Blob([csv], { type: 'text/csv' }), 'RAB-' + S.slug + '.csv');
  }

  /* ---------------------------------------------------------------- Vendor */
  function vVendor(b) {
    var h = '<div class="pm-kan__tools"><div class="gbar"><button type="button" data-vtab="nikah" aria-pressed="' + (ui.vendTab === 'nikah') + '">' + t('Vendor pernikahan ini', 'This wedding\'s vendors') + '</button><button type="button" data-vtab="dir" aria-pressed="' + (ui.vendTab === 'dir') + '">' + t('Direktori Nawala', 'Nawala directory') + '</button></div>' +
      (ui.vendTab === 'nikah' ? addBtn('vendor', t('Vendor baru', 'New vendor')) : team() && canEdit() ? '<button type="button" class="btn btn--line btn--sm" data-dir-new>' + svg(IC.plus) + t('Tambah ke direktori', 'Add to the directory') + '</button>' : '') + '</div>';
    if (ui.vendTab === 'nikah') {
      var vs = all('vendor');
      h += vs.length ? '<div class="pm-vgrid">' + vs.map(function (v) {
        var d = v.data, linked = all('rab').filter(function (r) { return r.data.vendor === v.id; }), tot = linked.reduce(function (a, r) { return a + num(r.data.plan); }, 0);
        return '<article class="pm-vc g"><button type="button" class="pm-vc__t" data-edit="' + v.id + '"><small>' + esc(d.cat || '') + '</small><b>' + esc(d.name || t('Tanpa nama', 'No name')) + lockMark(v) + '</b></button>' +
          '<div class="pm-vc__m"><span class="pill' + (d.status === 'deal' || d.status === 'lunas' ? ' pill--tayang' : d.status === 'batal' ? ' pill--habis' : '') + '">' + pick(VSTAT, d.status || 'calon') + '</span>' + (tot ? '<span class="small">' + rp(tot) + '</span>' : '') + '</div>' +
          (d.contact ? '<p class="small">' + esc(d.contact) + '</p>' : '') +
          '<div class="pm-vc__links">' + (d.phone ? '<a class="btn btn--line btn--sm" target="_blank" rel="noopener" href="' + DB.wa('', String(d.phone).replace(/\D/g, '').replace(/^0/, '62')) + '">WhatsApp</a>' : '') + (d.ig ? '<a class="btn btn--line btn--sm" target="_blank" rel="noopener" href="https://instagram.com/' + esc(String(d.ig).replace(/^@/, '')) + '">Instagram</a>' : '') + '</div></article>';
      }).join('') + '</div>' : empty(t('Belum ada vendor.', 'No vendors yet.'), t('Tambah vendor sendiri, atau pilih dari direktori Nawala.', 'Add your own, or pick one from the Nawala directory.'));
    } else {
      var dir = S.dir || [];
      h += dir.length ? '<div class="pm-vgrid">' + dir.map(function (v) {
        var d = v.data, used = all('vendor').some(function (x) { return x.data.dir === v.id; });
        return '<article class="pm-vc g"><div class="pm-vc__t"><small>' + esc(d.cat || '') + (d.city ? ' · ' + esc(d.city) : '') + '</small><b>' + esc(d.name) + '</b></div>' + (d.price ? '<p class="small">' + esc(d.price) + '</p>' : '') + (d.note ? '<p class="small muted">' + esc(d.note) + '</p>' : '') +
          (team() && d.tim && d.tim.commission ? '<p class="pm-tim small">' + svg(IC.lock) + t('Komisi ', 'Commission ') + esc(d.tim.commission) + '</p>' : '') +
          '<div class="pm-vc__links">' + (canEdit() ? '<button type="button" class="btn btn--line btn--sm" data-dir-use="' + v.id + '"' + (used ? ' disabled' : '') + '>' + (used ? t('Sudah ditambahkan', 'Added') : t('Tambahkan ke pernikahan ini', 'Add to this wedding')) + '</button>' : '') +
          (team() && canEdit() ? '<button type="button" class="btn btn--line btn--sm" data-dir-edit="' + v.id + '">' + t('Ubah', 'Edit') + '</button>' : '') + '</div></article>';
      }).join('') + '</div>' : empty(t('Direktori masih kosong.', 'The directory is empty.'), team() ? t('Vendor yang sering dipakai tim disimpan di sini, lalu bisa ditambahkan ke pernikahan mana pun.', 'Vendors the team often uses live here and can be added to any wedding.') : t('Tim Nawala akan menambahkan vendor rekomendasi di sini.', 'The Nawala team will add recommended vendors here.'));
    }
    b.innerHTML = h;
  }

  /* ---------------------------------------------------------------- Rundown */
  function vRundown(b) {
    var rs = all('acara').sort(function (a, c) { return ((a.data.day || '') + (a.data.start || '')) < ((c.data.day || '') + (c.data.start || '')) ? -1 : 1; }), days = {};
    rs.forEach(function (r) { var k = r.data.day || t('Hari H', 'The day'); (days[k] = days[k] || []).push(r); });
    var h = Object.keys(days).map(function (k) {
      return '<div class="pm-run"><h3>' + esc(k) + '</h3>' + days[k].map(function (r) { var d = r.data; return '<button type="button" class="pm-run__r" data-edit="' + r.id + '"><span class="pm-run__tm">' + esc(d.start || '--:--') + (d.end ? '<small>' + esc(d.end) + '</small>' : '') + '</span><span class="pm-run__x"><b>' + esc(d.title || '') + lockMark(r) + '</b><small>' + [d.place, d.pic ? 'PIC ' + d.pic : ''].filter(Boolean).map(esc).join(' · ') + '</small>' + (d.notes ? '<small class="muted">' + esc(d.notes) + '</small>' : '') + '</span></button>'; }).join('') + '</div>';
    }).join('');
    b.innerHTML = card(t('Rundown acara', 'Event rundown'), t('Susunan acara menit demi menit, per hari atau per sesi (akad, resepsi).', 'The programme minute by minute, per day or session (ceremony, reception).'),
      h || empty(t('Rundown masih kosong.', 'The rundown is empty.'), t('Tambah acara pertama, misalnya 08.00 Akad nikah.', 'Add the first item, for example 08:00 Ceremony.')),
      '<div class="panel__tools">' + addBtn('acara', t('Acara baru', 'New item')) + (rs.length ? '<button type="button" class="btn btn--line btn--sm" data-run-copy>' + svg(IC.copy) + t('Salin sebagai teks', 'Copy as text') + '</button>' : '') + '</div>');
  }

  /* ---------------------------------------------------------------- Rapat */
  function vRapat(b) {
    var rs = all('rapat').sort(function (a, c) { return (a.data.date || '') < (c.data.date || '') ? 1 : -1; });
    b.innerHTML = card(t('Catatan rapat', 'Meeting notes'), t('Apa yang dibahas, apa yang diputuskan, dan tindak lanjutnya. Tindak lanjut bisa langsung jadi tugas.', 'What was discussed, what was decided and the follow-ups. A follow-up can become a task in one tap.'),
      rs.length ? '<div class="pm-notes">' + rs.map(function (r) { var d = r.data, acts = d.actions || []; return '<button type="button" class="pm-note g" data-edit="' + r.id + '"><small>' + (d.date ? fdate(d.date) : '') + (d.with ? ' · ' + esc(d.with) : '') + '</small><b>' + esc(d.title || t('Rapat', 'Meeting')) + lockMark(r) + '</b>' + (d.decisions ? '<p>' + esc(d.decisions).slice(0, 220) + '</p>' : '') + (acts.length ? '<span class="pill">' + acts.length + ' ' + t('tindak lanjut', 'follow-ups') + '</span>' : '') + '</button>'; }).join('') + '</div>'
        : empty(t('Belum ada catatan rapat.', 'No meeting notes yet.')), '<div class="panel__tools">' + addBtn('rapat', t('Catatan baru', 'New note')) + '</div>');
  }

  /* ---------------------------------------------------------------- Persetujuan */
  function vSetuju(b) {
    var rs = all('setuju').sort(function (a, c) { var w = function (x) { return (x.data.status || 'menunggu') === 'menunggu' ? 0 : 1; }; return w(a) - w(c) || ((a.at || '') < (c.at || '') ? 1 : -1); });
    var h = rs.map(function (r) {
      var d = r.data, st = d.status || 'menunggu', mine = (r.made || 'tim') === H.as;
      return '<article class="pm-ap g"><div class="pm-ap__h"><button type="button" class="pm-vc__t" data-edit="' + r.id + '"><small>' + (d.asked ? t('Diminta oleh ', 'Asked by ') + esc(d.asked) : '') + '</small><b>' + esc(d.title || '') + lockMark(r) + '</b></button><span class="pill' + (st === 'disetujui' ? ' pill--tayang' : st === 'revisi' ? ' pill--pink' : ' pill--baru') + '">' + pick(APPR, st) + '</span></div>' +
        (d.body ? '<p>' + esc(d.body) + '</p>' : '') + filesStrip(d.files) + (d.reply ? '<p class="pm-ap__re"><b>' + esc(d.by || '') + ':</b> ' + esc(d.reply) + '</p>' : '') +
        (st === 'menunggu' && canEdit() && !mine ? '<div class="pm-ap__a"><label class="field pm-f"><input type="text" maxlength="400" data-ap-reply="' + r.id + '" placeholder="' + esc(t('Catatan (boleh kosong)', 'A note (optional)')) + '"></label><button type="button" class="btn btn--main btn--sm" data-ap="disetujui" data-id="' + r.id + '">' + t('Setujui', 'Approve') + '</button><button type="button" class="btn btn--line btn--sm" data-ap="revisi" data-id="' + r.id + '">' + t('Minta perubahan', 'Ask for changes') + '</button></div>' :
          st === 'menunggu' ? '<p class="small muted">' + t('Menunggu jawaban ', 'Waiting for ') + (H.as === 'tim' ? t('pasangan', 'the couple') : t('tim Nawala', 'the Nawala team')) + '</p>' : '') + '</article>';
    }).join('');
    b.innerHTML = card(t('Persetujuan', 'Approvals'), t('Satu pihak meminta, pihak lain menyetujui atau meminta perubahan. Contoh: desain undangan, konsep dekorasi, penawaran vendor.', 'One side asks, the other approves or asks for changes. For example: the invitation design, the decor concept, a vendor quote.'),
      h ? '<div class="pm-aps">' + h + '</div>' : empty(t('Belum ada yang perlu disetujui.', 'Nothing to approve yet.')), '<div class="panel__tools">' + addBtn('setuju', t('Minta persetujuan', 'Ask for approval')) + '</div>');
  }

  /* ---------------------------------------------------------------- Berkas */
  function fileUrl(path) { return DB.url + '/storage/v1/object/public/pm/' + path; }
  function isImg(f) { return /^image\//.test(f.type || '') || /\.(webp|jpg|png)$/.test(f.path || ''); }
  function filesStrip(fs) {
    if (!fs || !fs.length) return '';
    return '<div class="pm-files">' + fs.map(function (f) { return '<a target="_blank" rel="noopener" href="' + esc(fileUrl(f.path)) + '" class="pm-file">' + (isImg(f) ? '<img src="' + esc(fileUrl(f.path)) + '" alt="" loading="lazy">' : svg(IC.file)) + '<span>' + esc(f.name || 'berkas') + '</span></a>'; }).join('') + '</div>';
  }
  function vBerkas(b) {
    var mood = ui.fileTab === 'mood', fs = all('berkas').filter(function (f) { return (f.data.mood ? 'mood' : 'berkas') === ui.fileTab; });
    var h = '<div class="pm-kan__tools"><div class="gbar"><button type="button" data-ftab="berkas" aria-pressed="' + !mood + '">' + t('Berkas', 'Files') + '</button><button type="button" data-ftab="mood" aria-pressed="' + mood + '">Moodboard</button></div>' +
      (canEdit() ? '<label class="btn btn--line btn--sm pm-up">' + svg(IC.plus) + (mood ? t('Tambah gambar', 'Add pictures') : t('Unggah berkas', 'Upload files')) + '<input type="file" multiple data-upload="' + ui.fileTab + '" accept="' + (mood ? 'image/*' : 'image/*,application/pdf') + '"></label>' : '') +
      '<span class="small muted">' + t('Gambar dikecilkan otomatis. PDF sampai 10 MB.', 'Pictures are shrunk automatically. PDF up to 10 MB.') + '</span></div>';
    if (!fs.length) h += empty(mood ? t('Moodboard masih kosong.', 'The moodboard is empty.') : t('Belum ada berkas.', 'No files yet.'), mood ? t('Kumpulkan gambar inspirasi: dekorasi, busana, warna.', 'Collect inspiration: decor, attire, colours.') : t('Kontrak, penawaran vendor, denah tempat, dokumen lain.', 'Contracts, vendor quotes, venue plans, other documents.'));
    else if (mood) h += '<div class="pm-mood">' + fs.map(function (f) { return '<figure class="pm-mood__i"><a target="_blank" rel="noopener" href="' + esc(fileUrl(f.data.path)) + '"><img src="' + esc(fileUrl(f.data.path)) + '" alt="' + esc(f.data.name || '') + '" loading="lazy"></a><figcaption><span>' + esc(f.data.note || f.data.name || '') + '</span>' + lockMark(f) + (canEdit() ? '<button type="button" data-edit="' + f.id + '">' + t('Ubah', 'Edit') + '</button>' : '') + '</figcaption></figure>'; }).join('') + '</div>';
    else h += '<div class="rows pm-flist">' + fs.map(function (f) { var d = f.data; return '<div class="row"><a class="pm-file" target="_blank" rel="noopener" href="' + esc(fileUrl(d.path)) + '">' + (isImg(d) ? '<img src="' + esc(fileUrl(d.path)) + '" alt="" loading="lazy">' : svg(IC.file)) + '</a><span class="row__t"><b>' + esc(d.name || '') + lockMark(f) + '</b><small>' + (d.size ? Math.round(d.size / 1024) + ' KB · ' : '') + esc(f.by || '') + (d.note ? ' · ' + esc(d.note) : '') + '</small></span>' + (canEdit() ? '<button type="button" class="btn btn--line btn--sm" data-edit="' + f.id + '">' + t('Ubah', 'Edit') + '</button>' : '') + '</div>'; }).join('') + '</div>';
    b.innerHTML = '<section class="card g pm-card">' + h + '</section>';
  }
  /* pictures to WebP (1600 px), PDFs as they are; one ticket per file */
  function shrink(file) {
    if (!/^image\//.test(file.type)) return Promise.resolve(file);
    return new Promise(function (ok) {
      var img = new Image(), u = URL.createObjectURL(file);
      img.onload = function () {
        var s = Math.min(1, 1600 / Math.max(img.width, img.height)), c = document.createElement('canvas');
        c.width = Math.round(img.width * s); c.height = Math.round(img.height * s);
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height); URL.revokeObjectURL(u);
        c.toBlob(function (bl) { ok(bl && bl.type === 'image/webp' ? bl : file); }, 'image/webp', 0.82);
      };
      img.onerror = function () { URL.revokeObjectURL(u); ok(file); };
      img.src = u;
    });
  }
  function upload(file) {
    if (file.size > 25 * 1048576 || !/^image\/|application\/pdf/.test(file.type)) return Promise.reject(new Error('type'));
    return shrink(file).then(function (blob) {
      if (blob.size > 10485760) throw new Error('size');
      var ext = { 'image/webp': 'webp', 'image/jpeg': 'jpg', 'image/png': 'png', 'application/pdf': 'pdf' }[blob.type];
      if (!ext) throw new Error('type');
      return DB.rpc('pm_ticket', { p_who: H.who(), p_slug: slug }).then(function (pre) {
        if (!pre) throw new Error('ticket');
        var path = pre + '.' + ext;
        return fetch(DB.url + '/storage/v1/object/pm/' + path, { method: 'POST', headers: { apikey: DB.key, Authorization: 'Bearer ' + DB.key, 'Content-Type': blob.type, 'x-upsert': 'false', 'cache-control': 'max-age=31536000' }, body: blob })
          .then(function (r) { if (!r.ok) throw new Error('upload ' + r.status); return { path: path, name: file.name.slice(0, 120), type: blob.type, size: blob.size }; });
      });
    });
  }
  function uploadMany(list, done) {
    var files = Array.prototype.slice.call(list || []), out = [];
    if (!files.length) return;
    status(t('Mengunggah...', 'Uploading...'));
    files.reduce(function (ch, f) { return ch.then(function () { return upload(f).then(function (r) { out.push(r); }, function (e) { K.toast(t('Tidak bisa mengunggah ', 'Could not upload ') + f.name + (e.message === 'size' ? t(' (lebih dari 10 MB)', ' (over 10 MB)') : e.message === 'type' ? t(' (hanya gambar atau PDF)', ' (pictures or PDF only)') : '')); }); }); }, Promise.resolve())
      .then(function () { status(t('Tersimpan', 'Saved')); done(out); });
  }

  /* ---------------------------------------------------------------- Pengingat */
  /* what is due soon, for this side: own reminders, tasks due within 3 days or late, payments within 7 days, approvals waiting */
  function reminders() {
    if (!S) return [];
    var today = todayStr(), soon3 = addDays(today, 3), soon7 = addDays(today, 7), out = [];
    all('ingat').forEach(function (r) { var d = r.data; if (d.done) return; if (d.for === 'pasangan' && team() || d.for === 'tim' && !team()) return; if ((d.at || '').slice(0, 10) <= soon3) out.push({ kind: 'ingat', id: r.id, title: d.title, when: (d.at || '').slice(0, 10), late: (d.at || '').slice(0, 10) < today }); });
    leaves().forEach(function (l) { var d = l.data; if (d.status === 'selesai' || !d.due || d.due > soon3) return; var mine = team() ? d.who !== 'pasangan' : d.who === 'pasangan' || !d.who; if (!mine) return; out.push({ kind: 'tugas', id: l.id, title: label(l), when: d.due, late: d.due < today }); });
    all('bayar').forEach(function (p) { var d = p.data; if (d.paid || !d.due || d.due > soon7) return; var r = items[p.parent]; out.push({ kind: 'bayar', id: p.parent, title: (r ? label(r) : '') + ' (' + pick(STAGE, d.stage) + ' ' + rp(d.amount) + ')', when: d.due, late: d.due < today }); });
    all('setuju').forEach(function (a) { if ((a.data.status || 'menunggu') === 'menunggu' && (a.made || 'tim') !== H.as) out.push({ kind: 'setuju', id: a.id, title: a.data.title, when: today, late: false }); });
    return out.sort(function (a, b) { return a.when < b.when ? -1 : 1; });
  }
  function vIngat(b) {
    var rem = reminders(), today = todayStr();
    var KN = { ingat: t('Pengingat', 'Reminder'), tugas: t('Tugas', 'Task'), bayar: t('Pembayaran', 'Payment'), setuju: t('Persetujuan', 'Approval') };
    var h = card(t('Segera', 'Coming up'), t('Pengingat, tugas 3 hari ke depan, pembayaran 7 hari ke depan, dan persetujuan yang menunggu kalian.', 'Reminders, tasks in the next 3 days, payments in the next 7 days and approvals waiting for you.'),
      rem.length ? '<div class="rows">' + rem.map(function (r) { return '<div class="row"><span class="pm-dot' + (r.late ? ' is-late' : '') + '"></span><button type="button" class="row__t pm-lnk" ' + (r.kind === 'setuju' ? 'data-tab-go="setuju"' : 'data-edit="' + r.id + '"') + '><b>' + esc(r.title || '') + '</b><small>' + KN[r.kind] + ' · ' + (r.late ? t('lewat ', 'late ') : '') + fdate(r.when) + '</small></button>' + (r.kind !== 'setuju' ? '<button type="button" class="btn btn--line btn--sm" data-ics="' + r.id + '">' + svg(IC.cal) + t('Kalender', 'Calendar') + '</button>' : '') + '</div>'; }).join('') + '</div>' : empty(t('Tidak ada yang mendesak.', 'Nothing urgent.')));
    var own = all('ingat').filter(function (r) { return ui.remDone || !r.data.done; }).sort(function (a, c) { return (a.data.at || '') < (c.data.at || '') ? -1 : 1; });
    h += card(t('Pengingat', 'Reminders'), t('Pengingat buatan sendiri, untuk semua, tim, atau pasangan. Tambahkan ke kalender ponsel agar berbunyi.', 'Your own reminders, for everyone, the team or the couple. Add them to your phone calendar so they ring.'),
      (own.length ? '<div class="rows">' + own.map(function (r) { var d = r.data, late = !d.done && (d.at || '').slice(0, 10) < today; return '<div class="row"><button type="button" class="pm-tick" role="checkbox" aria-checked="' + !!d.done + '" data-done="' + r.id + '" aria-label="' + t('Selesai', 'Done') + '">' + svg('<path d="m5 12.5 4.5 4.5L19 7.5"/>') + '</button><button type="button" class="row__t pm-lnk" data-edit="' + r.id + '"><b' + (d.done ? ' class="muted"' : '') + '>' + esc(d.title || '') + lockMark(r) + '</b><small>' + (d.at ? fdate(d.at.slice(0, 10)) + (d.at.length > 10 ? ' ' + d.at.slice(11, 16) : '') : '') + ' · ' + ({ semua: t('untuk semua', 'for everyone'), tim: t('untuk tim', 'for the team'), pasangan: t('untuk pasangan', 'for the couple') }[d.for || 'semua']) + (late ? ' · ' + t('lewat', 'late') : '') + '</small></button><button type="button" class="btn btn--line btn--sm" data-ics="' + r.id + '">' + svg(IC.cal) + '</button></div>'; }).join('') + '</div>' : empty(t('Belum ada pengingat.', 'No reminders yet.'))) +
      '<button type="button" class="switch pm-sw" role="switch" aria-checked="' + ui.remDone + '" data-remdone><span>' + t('Tampilkan yang sudah selesai', 'Show finished ones') + '</span><i></i></button>',
      '<div class="panel__tools">' + addBtn('ingat', t('Pengingat baru', 'New reminder')) + '<button type="button" class="btn btn--line btn--sm" data-ics-all>' + svg(IC.cal) + t('Semua ke kalender', 'All to a calendar') + '</button></div>');
    b.innerHTML = '<div class="pm-grid2">' + h + '</div>';
  }
  /* a calendar file the phone or laptop opens: whole-day events with an alarm the day before, or a timed reminder */
  function icsText(evs) {
    var stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+/, '');
    var escI = function (s) { return String(s || '').replace(/\\/g, '\\\\').replace(/([,;])/g, '\\$1').replace(/\n/g, '\\n'); };
    var L = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Nawala//Persiapan//ID', 'CALSCALE:GREGORIAN'];
    evs.forEach(function (e) {
      L.push('BEGIN:VEVENT', 'UID:' + e.uid + '@nawalainvite.com', 'DTSTAMP:' + stamp);
      if (e.time) { var dt = e.date.replace(/-/g, '') + 'T' + e.time.replace(':', '') + '00'; L.push('DTSTART;TZID=Asia/Jakarta:' + dt, 'DURATION:PT30M'); }
      else { L.push('DTSTART;VALUE=DATE:' + e.date.replace(/-/g, ''), 'DTEND;VALUE=DATE:' + addDays(e.date, 1).replace(/-/g, '')); }
      L.push('SUMMARY:' + escI(e.title), 'DESCRIPTION:' + escI(e.desc || ''), 'BEGIN:VALARM', 'ACTION:DISPLAY', 'DESCRIPTION:' + escI(e.title), 'TRIGGER:' + (e.time ? '-PT30M' : '-PT15H'), 'END:VALARM', 'END:VEVENT');
    });
    L.push('END:VCALENDAR');
    return L.join('\r\n');
  }
  function evOf(id) {
    var it = items[id]; if (!it) return [];
    var who = S.couple + ' · Nawala';
    if (it.kind === 'ingat') { var a = it.data.at || ''; return a ? [{ uid: it.id, date: a.slice(0, 10), time: a.length > 10 ? a.slice(11, 16) : '', title: it.data.title, desc: who }] : []; }
    if (it.kind === 'tugas') return it.data.due ? [{ uid: it.id, date: it.data.due, title: label(it), desc: who + ' · ' + (W.code[it.id] || '') }] : [];
    if (it.kind === 'rab') return pays(it.id).filter(function (p) { return p.data.due && !p.data.paid; }).map(function (p) { return { uid: p.id, date: p.data.due, title: t('Bayar ', 'Pay ') + label(it) + ' (' + pick(STAGE, p.data.stage) + ')', desc: who + ' · ' + rp(p.data.amount) }; });
    return [];
  }
  function icsAll() {
    var evs = [];
    leaves().forEach(function (l) { if (l.data.status !== 'selesai') evs = evs.concat(evOf(l.id)); });
    all('rab').forEach(function (r) { evs = evs.concat(evOf(r.id)); });
    all('ingat').forEach(function (r) { if (!r.data.done && !(r.data.for === 'pasangan' && team()) && !(r.data.for === 'tim' && !team())) evs = evs.concat(evOf(r.id)); });
    if (S.date) evs.push({ uid: 'hari-' + S.slug, date: S.date, title: t('Hari H ', 'Wedding day ') + S.couple, desc: 'Nawala' });
    if (!evs.length) { K.toast(t('Belum ada tanggal untuk dimasukkan ke kalender.', 'No dates to put in a calendar yet.')); return; }
    save(new Blob([icsText(evs)], { type: 'text/calendar' }), 'persiapan-' + S.slug + '.ics');
  }
  function save(blob, name) { var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1500); }

  /* ---------------------------------------------------------------- Obrolan */
  function vChat(b) {
    var rooms = team() ? [['bersama', t('Tim dan pasangan', 'Team and couple')], ['tim', t('Khusus tim', 'Team only')]] : [];
    if (!team()) ui.room = 'bersama';
    var h = (rooms.length ? '<div class="pm-kan__tools"><div class="gbar">' + rooms.map(function (r) { var n = S.unread[r[0]] || 0; return '<button type="button" data-room="' + r[0] + '" aria-pressed="' + (ui.room === r[0]) + '">' + r[1] + (n ? '<i class="pm-n">' + n + '</i>' : '') + '</button>'; }).join('') + '</div><span class="small muted">' + (ui.room === 'tim' ? t('Pasangan tidak melihat ruang ini.', 'The couple does not see this room.') : t('Pasangan melihat ruang ini.', 'The couple sees this room.')) + '</span></div>' : '') +
      '<section class="g pm-chat"><div class="pm-chat__list" id="pm-chat-list"><div class="pm-wait">' + t('Memuat obrolan...', 'Loading the chat...') + '</div></div>' +
      (canEdit() ? '<form class="pm-chat__in" id="pm-chat-form"><label class="pm-chat__att" aria-label="' + t('Lampirkan', 'Attach') + '">' + svg(IC.clip) + '<input type="file" accept="image/*,application/pdf" data-chat-file></label><textarea id="pm-chat-text" rows="1" maxlength="4000" placeholder="' + esc(t('Tulis pesan...', 'Write a message...')) + '"></textarea><button type="submit" class="btn btn--main btn--sm" aria-label="' + t('Kirim', 'Send') + '">' + svg(IC.send) + '</button></form>' : '') + '</section>';
    b.innerHTML = h;
    if (chat.room !== ui.room || chat.slug !== slug) chat = { msgs: [], last: 0, room: ui.room, slug: slug };
    chatPull(true);
    chatTimer = setInterval(function () { if (!document.hidden) chatPull(); }, 5000);
    var f = b.querySelector('#pm-chat-form');
    if (f) {
      var ta = f.querySelector('textarea');
      ta.addEventListener('keydown', function (e) { if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); f.requestSubmit(); } });
      ta.addEventListener('input', function () { ta.style.height = 'auto'; ta.style.height = Math.min(160, ta.scrollHeight) + 'px'; });
      f.addEventListener('submit', function (e) { e.preventDefault(); var v = ta.value.trim(); if (!v) return; ta.value = ''; ta.style.height = ''; say(v, null); });
    }
  }
  function chatPull(first) {
    var room = ui.room;
    return DB.rpc('pm_chat', { p_who: H.who(), p_slug: slug, p_room: room, p_after: chat.last }).then(function (r) {
      if (!r) { if (first) denied(); return; }
      if (room !== ui.room || tab !== 'obrolan') return;
      S.unread = r.unread; chat.me = r.me;
      if (r.msgs.length) { chat.msgs = chat.msgs.concat(r.msgs); chat.last = r.msgs[r.msgs.length - 1].id; }
      chatDraw(first || r.msgs.length);
      Array.prototype.forEach.call(root.querySelectorAll('[data-room="' + room + '"] .pm-n'), function (n) { n.remove(); });
      var tn = root.querySelector('[data-tab-go="obrolan"] .pm-n'), un = (S.unread.bersama || 0) + (S.unread.tim || 0);
      if (tn) { if (un) tn.textContent = un; else tn.remove(); }
      badge();
    }, function () {});
  }
  function chatDraw(scroll) {
    var list = root.querySelector('#pm-chat-list'); if (!list) return;
    if (!chat.msgs.length) { list.innerHTML = empty(t('Belum ada pesan.', 'No messages yet.'), ui.room === 'tim' ? t('Catatan internal tim untuk pernikahan ini.', 'Internal team notes for this wedding.') : t('Tanyakan apa saja kepada tim Nawala di sini.', 'Ask the Nawala team anything here.')); return; }
    var lastDay = '', h = '';
    chat.msgs.forEach(function (m) {
      var d = new Date(m.at), dk = iso(d);
      if (dk !== lastDay) { h += '<p class="pm-chat__day">' + K.day(d) + ', ' + K.date(d) + '</p>'; lastDay = dk; }
      var me = m.ref === chat.me;
      h += '<div class="pm-msg' + (me ? ' is-me' : '') + (m.kind === 'pasangan' ? ' is-couple' : '') + '"><small>' + (me ? '' : esc(m.who) + ' · ') + String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0') + '</small>' +
        (m.body ? '<p>' + esc(m.body).replace(/\n/g, '<br>') + '</p>' : '') + (m.file ? filesStrip([m.file]) : '') + '</div>';
    });
    var atEnd = list.scrollHeight - list.scrollTop - list.clientHeight < 80;
    list.innerHTML = h;
    if (scroll || atEnd) list.scrollTop = list.scrollHeight;
  }
  function say(text, file) {
    return DB.rpc('pm_say', { p_who: H.who(), p_slug: slug, p_room: ui.room, p_body: text || '', p_file: file }).then(function (r) {
      if (r === null) { denied(); return; }
      if (r && r.error === 'cepat') K.toast(t('Terlalu cepat. Tunggu sebentar.', 'Too fast. Wait a moment.'));
      chatPull();
    }, function () { K.offline(); });
  }

  /* ================================================================ the editor (one dialog for every kind) */
  var FORMS = {
    tugas: [['title', 'Nama pekerjaan', 'Work item', 'text', { req: 1 }], ['status', 'Status', 'Status', 'select', { opts: function () { return opts(STATUS); }, leaf: 1 }],
      ['who', 'Dikerjakan oleh', 'Done by', 'select', { opts: whoOpts }], ['start', 'Mulai', 'Start', 'date', { leaf: 1 }], ['due', 'Tenggat', 'Due', 'date', { leaf: 1 }],
      ['parent', 'Di bawah bagian', 'Under part', 'parent'], ['notes', 'Catatan', 'Notes', 'area'], ['tim.note', 'Catatan internal', 'Internal note', 'area', { tim: 1 }]],
    rab: [['item', 'Nama pos', 'Line', 'text', { req: 1 }], ['cat', 'Kategori', 'Category', 'text', { list: function () { return VCAT; } }], ['plan', 'Rencana (Rp)', 'Planned (Rp)', 'money'],
      ['actual', 'Realisasi (Rp), bila tanpa tahap bayar', 'Actual (Rp), when there are no payment stages', 'money'], ['payer', 'Dibayar oleh', 'Paid by', 'select', { opts: function () { return opts(PAYER); } }],
      ['vendor', 'Vendor', 'Vendor', 'select', { opts: function () { return [['', '-']].concat(all('vendor').map(function (v) { return [v.id, v.data.name || '?']; })); } }],
      ['wbs', 'Bagian WBS', 'WBS part', 'select', { opts: function () { return [['', '-']].concat(W.order.filter(function (id) { return !isLeaf(items[id]) || !items[id].parent; }).map(function (id) { return [id, W.code[id] + ' ' + label(items[id])]; })); } }],
      ['notes', 'Catatan', 'Notes', 'area'], ['tim.cost', 'Biaya internal (Rp)', 'Internal cost (Rp)', 'money', { tim: 1 }], ['tim.note', 'Catatan internal', 'Internal note', 'area', { tim: 1 }]],
    vendor: [['name', 'Nama vendor', 'Vendor name', 'text', { req: 1 }], ['cat', 'Kategori', 'Category', 'text', { list: function () { return VCAT; } }], ['status', 'Status', 'Status', 'select', { opts: function () { return opts(VSTAT); } }],
      ['contact', 'Narahubung', 'Contact person', 'text'], ['phone', 'Nomor WhatsApp', 'WhatsApp number', 'tel'], ['email', 'Email', 'Email', 'email'], ['ig', 'Instagram', 'Instagram', 'text'],
      ['price', 'Harga / paket', 'Price / package', 'text'], ['address', 'Alamat', 'Address', 'text'], ['notes', 'Catatan', 'Notes', 'area'],
      ['tim.commission', 'Komisi', 'Commission', 'text', { tim: 1 }], ['tim.note', 'Catatan internal', 'Internal note', 'area', { tim: 1 }]],
    acara: [['day', 'Hari / sesi', 'Day / session', 'text', { list: function () { return ['Akad', 'Pemberkatan', 'Resepsi', 'Siraman', 'Pengajian', 'Hari H']; } }], ['start', 'Mulai', 'Start', 'time'], ['end', 'Selesai', 'End', 'time'],
      ['title', 'Acara', 'Item', 'text', { req: 1 }], ['place', 'Tempat', 'Place', 'text'], ['pic', 'Penanggung jawab', 'Person in charge', 'text'], ['notes', 'Catatan', 'Notes', 'area']],
    rapat: [['title', 'Judul', 'Title', 'text', { req: 1 }], ['date', 'Tanggal', 'Date', 'date'], ['with', 'Hadir', 'Attended', 'text'], ['body', 'Pembahasan', 'Discussion', 'area'], ['decisions', 'Keputusan', 'Decisions', 'area'], ['actions', 'Tindak lanjut', 'Follow-ups', 'actions']],
    setuju: [['title', 'Yang perlu disetujui', 'What needs approval', 'text', { req: 1 }], ['body', 'Penjelasan', 'Details', 'area'], ['files', 'Lampiran', 'Attachments', 'files'], ['status', 'Status', 'Status', 'select', { opts: function () { return opts(APPR); } }], ['reply', 'Jawaban', 'Answer', 'area']],
    berkas: [['name', 'Nama', 'Name', 'text', { req: 1 }], ['note', 'Keterangan', 'Description', 'text']],
    ingat: [['title', 'Ingatkan tentang', 'Remind about', 'text', { req: 1 }], ['at', 'Kapan', 'When', 'datetime-local'], ['for', 'Untuk', 'For', 'select', { opts: function () { return team() ? [['semua', t('Semua', 'Everyone')], ['tim', t('Tim saja', 'Team only')], ['pasangan', t('Pasangan', 'The couple')]] : [['semua', t('Semua', 'Everyone')], ['pasangan', t('Kami saja', 'Just us')]]; } }]]
  };
  var TITLES = { tugas: ['Pekerjaan', 'Work item'], rab: ['Pos anggaran', 'Budget line'], vendor: ['Vendor', 'Vendor'], acara: ['Acara', 'Rundown item'], rapat: ['Catatan rapat', 'Meeting note'], setuju: ['Persetujuan', 'Approval'], berkas: ['Berkas', 'File'], ingat: ['Pengingat', 'Reminder'] };
  var draft = null, isNew = false, payDraft = [], payGone = [];

  function field(f, d) {
    var k = f[0], type = f[3], o = f[4] || {}, v = k === 'parent' ? (draft.parent || '') : get(d, k), lab = t(f[1], f[2]);
    if (o.tim && !team()) return '';
    if (o.leaf && draft.kind === 'tugas' && items[draft.id] && !isLeaf(items[draft.id])) return '';
    var idA = 'pmf-' + k.replace('.', '-'), timTag = o.tim ? ' <span class="pm-lock">' + svg(IC.lock) + t('hanya tim', 'team only') + '</span>' : '';
    if (type === 'select' || type === 'parent') {
      var list = type === 'parent' ? [['', t('(paling atas)', '(top level)')]].concat(W.order.filter(function (id) { return draft.id !== id && subtree(draft.id).indexOf(id) < 0; }).map(function (id) { return [id, W.code[id] + ' ' + label(items[id])]; })) : o.opts();
      return '<label class="pm-fl"><span>' + lab + timTag + '</span><select id="' + idA + '" data-k="' + k + '">' + list.map(function (x) { return '<option value="' + esc(x[0]) + '"' + (String(v || '') === String(x[0]) ? ' selected' : '') + '>' + esc(x[1]) + '</option>'; }).join('') + '</select></label>';
    }
    if (type === 'area') return '<label class="pm-fl pm-fl--wide"><span>' + lab + timTag + '</span><textarea id="' + idA + '" data-k="' + k + '" rows="3" maxlength="4000">' + esc(v || '') + '</textarea></label>';
    if (type === 'actions') {
      var acts = d.actions || [];
      return '<div class="pm-fl pm-fl--wide"><span>' + lab + '</span><div class="pm-acts-list" id="pm-acts">' + acts.map(function (a, i) { return actRow(a, i); }).join('') + '</div><button type="button" class="btn btn--line btn--sm" data-act-add>' + svg(IC.plus) + t('Tindak lanjut', 'Follow-up') + '</button></div>';
    }
    if (type === 'files') {
      return '<div class="pm-fl pm-fl--wide"><span>' + lab + '</span><div id="pm-ffiles">' + filesEdit(d.files) + '</div><label class="btn btn--line btn--sm pm-up">' + svg(IC.clip) + t('Lampirkan', 'Attach') + '<input type="file" multiple accept="image/*,application/pdf" data-attach="files"></label></div>';
    }
    var tp = type === 'money' ? 'text' : type, extra = type === 'money' ? ' inputmode="numeric" data-money' : '', val = type === 'money' ? (v ? num(v).toLocaleString('id-ID') : '') : (v || '');
    if (type === 'text' && k === get(draft, '_titleKey')) val = label(draft);
    return '<label class="pm-fl"><span>' + lab + timTag + '</span><input id="' + idA + '" data-k="' + k + '" type="' + tp + '"' + extra + (o.list ? ' list="' + idA + '-l"' : '') + ' value="' + esc(val) + '" maxlength="400"' + (o.req ? ' required' : '') + '>' +
      (o.list ? '<datalist id="' + idA + '-l">' + o.list().map(function (x) { return '<option value="' + esc(x) + '">'; }).join('') + '</datalist>' : '') + '</label>';
  }
  function actRow(a, i) {
    var task = a.task && items[a.task];
    return '<div class="pm-act"><input type="text" data-act="' + i + '" value="' + esc(a.text || '') + '" maxlength="300" placeholder="' + esc(t('Apa yang harus dikerjakan', 'What needs doing')) + '">' +
      (task ? '<span class="pill pill--tayang">' + t('Tugas ', 'Task ') + esc(W.code[task.id] || '') + '</span>' : '<button type="button" class="btn btn--line btn--sm" data-act-task="' + i + '">' + t('Jadikan tugas', 'Make it a task') + '</button>') +
      '<button type="button" class="pm-x" data-act-del="' + i + '" aria-label="' + t('Hapus', 'Remove') + '">' + svg('<path d="m6 6 12 12M18 6 6 18"/>') + '</button></div>';
  }
  function filesEdit(fs, key) {
    return '<div class="pm-files">' + (fs || []).map(function (f, i) { return '<span class="pm-file"><a target="_blank" rel="noopener" href="' + esc(fileUrl(f.path)) + '">' + (isImg(f) ? '<img src="' + esc(fileUrl(f.path)) + '" alt="">' : svg(IC.file)) + '<span>' + esc(f.name || '') + '</span></a><button type="button" class="pm-x" data-file-del="' + i + '"' + (key ? ' data-pay="' + key + '"' : '') + ' aria-label="' + t('Hapus', 'Remove') + '">' + svg('<path d="m6 6 12 12M18 6 6 18"/>') + '</button></span>'; }).join('') + '</div>';
  }
  function payRows() {
    return '<div class="pm-fl pm-fl--wide"><span>' + t('Tahap pembayaran', 'Payment stages') + '</span><div class="pm-pays">' + payDraft.map(function (p, i) {
      var d = p.data;
      return '<div class="pm-payr g" data-pi="' + i + '"><label><span>' + t('Tahap', 'Stage') + '</span><select data-pk="stage">' + STAGE.map(function (s) { return '<option value="' + s[0] + '"' + (d.stage === s[0] ? ' selected' : '') + '>' + t(s[1], s[2]) + '</option>'; }).join('') + '</select></label>' +
        '<label><span>' + t('Jumlah (Rp)', 'Amount (Rp)') + '</span><input type="text" inputmode="numeric" data-money data-pk="amount" value="' + (d.amount ? num(d.amount).toLocaleString('id-ID') : '') + '"></label>' +
        '<label><span>' + t('Jatuh tempo', 'Due') + '</span><input type="date" data-pk="due" value="' + esc(d.due || '') + '"></label>' +
        '<label><span>' + t('Dibayar tanggal', 'Paid on') + '</span><input type="date" data-pk="paid" value="' + esc(d.paid || '') + '"></label>' +
        '<div class="pm-payr__f">' + filesEdit(d.files, String(i)) + '<label class="btn btn--line btn--sm pm-up">' + svg(IC.clip) + t('Bukti / nota', 'Receipt') + '<input type="file" multiple accept="image/*,application/pdf" data-attach="pay" data-pi="' + i + '"></label><button type="button" class="pm-x" data-pay-del="' + i + '" aria-label="' + t('Hapus tahap', 'Remove stage') + '">' + svg('<path d="m6 6 12 12M18 6 6 18"/>') + '</button></div></div>';
    }).join('') + '</div><button type="button" class="btn btn--line btn--sm" data-pay-add>' + svg(IC.plus) + t('Tahap bayar', 'Payment stage') + '</button></div>';
  }
  function edit(id, fresh) {
    var it = items[id]; if (!it) return;
    if (it.kind === 'bayar') { edit(it.parent); return; }
    draft = JSON.parse(JSON.stringify(it)); isNew = !!fresh;
    draft._titleKey = it.kind === 'rab' ? 'item' : 'title';
    payDraft = it.kind === 'rab' ? pays(it.id).map(function (p) { return JSON.parse(JSON.stringify(p)); }) : []; payGone = [];
    paint();
    pop.querySelector('#pm-pop-h').textContent = (isNew ? t('Baru: ', 'New: ') : '') + t(TITLES[it.kind][0], TITLES[it.kind][1]);
    var ro = !canEdit();
    pop.querySelector('#pm-pop-acts').innerHTML = (ro ? '' : '<button type="button" class="btn btn--line" data-pop-del>' + t('Hapus', 'Delete') + '</button>') + (it.kind === 'rab' || it.kind === 'tugas' ? '<button type="button" class="btn btn--line" data-pop-ics>' + svg(IC.cal) + '</button>' : '') +
      '<span style="flex:1"></span><button type="button" class="btn btn--line" data-pop-cancel>' + t('Batal', 'Cancel') + '</button>' + (ro ? '' : '<button type="button" class="btn btn--main" data-pop-save>' + t('Simpan', 'Save') + '</button>');
    if (!pop.open) pop.showModal();
    var first = pop.querySelector('input,select,textarea'); if (first && isNew) first.focus();
  }
  function paint() {
    var d = draft.data, f = FORMS[draft.kind] || [];
    var h = '<div class="pm-fgrid">' + f.map(function (x) { return field(x, d); }).join('') + '</div>';
    if (draft.kind === 'rab') h += payRows();
    if (team() && draft.kind !== 'berkas') h += '<button type="button" class="switch pm-sw" role="switch" aria-checked="' + !!draft.team_only + '" data-teamonly><span>' + svg(IC.lock) + t('Hanya untuk tim (pasangan tidak melihat)', 'Team only (the couple does not see it)') + '</span><i></i></button>';
    else if (team()) h += '<button type="button" class="switch pm-sw" role="switch" aria-checked="' + !!draft.team_only + '" data-teamonly><span>' + svg(IC.lock) + t('Hanya untuk tim', 'Team only') + '</span><i></i></button>';
    if (draft.by && !isNew) h += '<p class="small muted">' + t('Terakhir diubah oleh ', 'Last changed by ') + esc(draft.by) + (draft.at ? ', ' + K.ago(draft.at) : '') + '</p>';
    var bodyEl = pop.querySelector('#pm-pop-body'); bodyEl.innerHTML = h;
    if (!canEdit()) bodyEl.querySelectorAll('input,select,textarea,button').forEach(function (x) { x.disabled = true; });
  }
  /* read the inputs back into the draft (and the payment rows) */
  function readForm() {
    var d = draft.data;
    pop.querySelectorAll('[data-k]').forEach(function (inp) {
      var k = inp.getAttribute('data-k'), v = inp.value.trim();
      if (k === 'parent') { draft.parent = v || null; return; }
      if (inp.hasAttribute('data-money')) v = v ? num(v) : '';
      if (k === draft._titleKey && v !== label(draft)) { delete d[k + '_en']; }
      if (k === draft._titleKey && v === label(draft) && K.lang() === 'en' && d[k + '_en']) return;
      set(d, k, v);
    });
    pop.querySelectorAll('[data-act]').forEach(function (inp) { var i = +inp.getAttribute('data-act'); if (d.actions && d.actions[i]) d.actions[i].text = inp.value.trim(); });
    pop.querySelectorAll('.pm-payr').forEach(function (row) {
      var p = payDraft[+row.getAttribute('data-pi')]; if (!p) return;
      row.querySelectorAll('[data-pk]').forEach(function (inp) { var k = inp.getAttribute('data-pk'), v = inp.value.trim(); if (inp.hasAttribute('data-money')) v = v ? num(v) : ''; set(p.data, k, v); });
    });
  }
  function commit() {
    readForm();
    var key = draft._titleKey, it = draft;
    if (FORMS[it.kind] && FORMS[it.kind][0][4] && FORMS[it.kind][0][4].req && !it.data[FORMS[it.kind][0][0]] && !it.data[FORMS[it.kind][0][0] + '_en']) {
      var inp = pop.querySelector('[data-k="' + FORMS[it.kind][0][0] + '"]'); if (inp) { inp.focus(); inp.reportValidity && inp.reportValidity(); } return;
    }
    if (it.kind === 'setuju' && it.data.status && it.data.status !== 'menunggu' && it.data.reply && !it.data.by) it.data.by = S.me;
    if (it.kind === 'ingat') it.team_only = team() && it.data.for === 'tim' ? true : it.team_only;
    delete it._titleKey;
    var save1 = { id: it.id, kind: it.kind, parent: it.parent || null, sort: it.sort, team_only: !!it.team_only, data: it.data, made: it.made || H.as, by: S.me };
    put(save1);
    payGone.forEach(function (id) { drop(id); });
    payDraft.forEach(function (p, i) { p.parent = it.id; p.sort = (i + 1) * 10; p.team_only = save1.team_only; put(p); });
    if (it.kind === 'ingat' && it.data.at && isNew) {
      setTimeout(function () { K.toast(t('Tersimpan. Tambahkan ke kalender ponsel agar pengingat berbunyi.', 'Saved. Add it to your phone calendar so the reminder rings.')); }, 400);
    }
    void key;
    pop.close(); draw();
  }

  /* ================================================================ events */
  function onClick(e) {
    var x = e.target.closest('button, a, [data-open], [data-edit]'); if (!x || !root.contains(x)) return;
    var a = function (n) { return x.getAttribute(n); };
    if (x.hasAttribute('data-open')) { open(a('data-open')); if (a('data-tab')) tab = a('data-tab'); return; }
    if (x.hasAttribute('data-back')) { board(); return; }
    if (x.hasAttribute('data-tab-go')) { e.preventDefault(); tab = a('data-tab-go'); root.querySelectorAll('.pm-tabs [data-tab-go]').forEach(function (b) { b.setAttribute('aria-selected', String(b.getAttribute('data-tab-go') === tab)); }); body(); return; }
    if (x.hasAttribute('data-edit')) { edit(a('data-edit')); return; }
    if (x.hasAttribute('data-full')) {
      var on = a('aria-checked') !== 'true';
      x.setAttribute('aria-checked', String(on));
      flush().then(function () { return DB.rpc('pm_set', { p_who: H.who(), p_slug: slug, p_patch: { full: on } }); }).then(function (d) { if (d) { take(d); draw(); K.toast(on ? t('Perencanaan pernikahan penuh menyala. Templatnya sudah ditambahkan.', 'Full wedding planning is on. Its template has been added.') : t('Perencanaan penuh dimatikan. Tugas yang sudah ada tetap disimpan.', 'Full planning is off. Existing tasks are kept.')); } }, function () { K.offline(); x.setAttribute('aria-checked', String(!on)); });
      return;
    }
    if (x.hasAttribute('data-add')) {
      var k = a('data-add'), it;
      if (k === 'tugas') it = make('tugas', { title: t('Tugas baru', 'New task'), status: 'belum', who: team() ? '' : 'pasangan' }, x.hasAttribute('data-root') ? null : null);
      else if (k === 'rab') it = make('rab', { item: '', cat: '', plan: 0, payer: 'bersama' });
      else if (k === 'vendor') it = make('vendor', { name: '', status: 'calon' });
      else if (k === 'acara') it = make('acara', { day: (all('acara').slice(-1)[0] || { data: {} }).data.day || t('Resepsi', 'Reception'), title: '' });
      else if (k === 'rapat') it = make('rapat', { title: '', date: todayStr() });
      else if (k === 'setuju') it = make('setuju', { title: '', status: 'menunggu', asked: S.me });
      else if (k === 'ingat') it = make('ingat', { title: '', at: addDays(todayStr(), 1) + 'T09:00', for: 'semua' });
      if (it) { delete queue[it.id]; edit(it.id, true); pop.addEventListener('close', function once() { pop.removeEventListener('close', once); if (isNew && items[it.id] && !queue[it.id]) { delete items[it.id]; } }); }
      return;
    }
    if (x.hasAttribute('data-fold')) { var f = a('data-fold'); ui.wbsShut[f] = !ui.wbsShut[f]; body(); return; }
    if (x.hasAttribute('data-wbs')) { wbsMove(a('data-id'), a('data-wbs')); return; }
    if (x.hasAttribute('data-kanwho')) { ui.kanWho = a('data-kanwho'); body(); return; }
    if (x.hasAttribute('data-mv')) { setStatus(a('data-id'), a('data-mv')); return; }
    if (x.hasAttribute('data-zoom')) { ui.ganttZoom = a('data-zoom'); body(); return; }
    if (x.hasAttribute('data-vtab')) { ui.vendTab = a('data-vtab'); body(); return; }
    if (x.hasAttribute('data-ftab')) { ui.fileTab = a('data-ftab'); body(); return; }
    if (x.hasAttribute('data-room')) { ui.room = a('data-room'); body(); return; }
    if (x.hasAttribute('data-remdone')) { ui.remDone = !ui.remDone; body(); return; }
    if (x.hasAttribute('data-csv')) { rabCsv(); return; }
    if (x.hasAttribute('data-ics-all')) { icsAll(); return; }
    if (x.hasAttribute('data-ics')) { var evs = evOf(a('data-ics')); if (evs.length) save(new Blob([icsText(evs)], { type: 'text/calendar' }), 'pengingat.ics'); else K.toast(t('Belum ada tanggalnya.', 'It has no date yet.')); return; }
    if (x.hasAttribute('data-done')) { var r = items[a('data-done')]; r.data.done = !r.data.done; put(r); body(); return; }
    if (x.hasAttribute('data-reschedule')) { reschedule(); return; }
    if (x.hasAttribute('data-run-copy')) { runCopy(); return; }
    if (x.hasAttribute('data-ap')) {
      var ap = items[a('data-id')], note = root.querySelector('[data-ap-reply="' + ap.id + '"]');
      ap.data.status = a('data-ap'); ap.data.reply = note ? note.value.trim() : ''; ap.data.by = S.me; ap.data.answered = new Date().toISOString(); if (!ap.data.reply) delete ap.data.reply;
      put(ap); draw(); return;
    }
    if (x.hasAttribute('data-dir-use')) {
      var dv = (S.dir || []).filter(function (v) { return v.id === a('data-dir-use'); })[0]; if (!dv) return;
      var vd = { name: dv.data.name, cat: dv.data.cat, contact: dv.data.contact, phone: dv.data.phone, email: dv.data.email, ig: dv.data.ig, price: dv.data.price, address: dv.data.address, status: 'calon', dir: dv.id };
      Object.keys(vd).forEach(function (k2) { if (!vd[k2]) delete vd[k2]; });
      make('vendor', vd); ui.vendTab = 'nikah'; body(); K.toast(t('Ditambahkan ke vendor pernikahan ini.', 'Added to this wedding\'s vendors.')); return;
    }
    if (x.hasAttribute('data-dir-new') || x.hasAttribute('data-dir-edit')) { dirEdit(a('data-dir-edit')); return; }
  }
  function onChange(e) {
    var x = e.target;
    if (x.hasAttribute('data-upload')) {
      var mood = x.getAttribute('data-upload') === 'mood';
      uploadMany(x.files, function (out) { out.forEach(function (f) { make('berkas', { name: f.name, path: f.path, type: f.type, size: f.size, mood: mood || undefined }); }); body(); });
      x.value = ''; return;
    }
    if (x.hasAttribute('data-chat-file')) { uploadMany(x.files, function (out) { out.forEach(function (f) { say('', f); }); }); x.value = ''; return; }
    if (x.hasAttribute('data-until')) {
      DB.rpc('pm_set', { p_who: H.who(), p_slug: slug, p_patch: { until: x.value || null } }).then(function (d) { if (d) { take(d); draw(); K.toast(t('Batas akses diperbarui.', 'Access end updated.')); } }, function () { K.offline(); });
    }
  }
  /* inside the editor dialog */
  document.addEventListener('click', function (e) {
    if (!pop || !pop.contains(e.target)) return;
    var x = e.target.closest('button'); if (!x) return;
    var a = function (n) { return x.getAttribute(n); };
    if (x.hasAttribute('data-pop-cancel')) { pop.close(); return; }
    if (x.hasAttribute('data-pop-save')) { if (dirMode) dirCommit(); else commit(); return; }
    if (x.hasAttribute('data-pop-ics')) { readForm(); var evs = draft.kind === 'rab' ? payDraft.filter(function (p) { return p.data.due && !p.data.paid; }).map(function (p) { return { uid: p.id, date: p.data.due, title: t('Bayar ', 'Pay ') + (draft.data.item || '') + ' (' + pick(STAGE, p.data.stage) + ')', desc: S.couple + ' · ' + rp(p.data.amount) }; }) : draft.data.due ? [{ uid: draft.id, date: draft.data.due, title: draft.data.title, desc: S.couple }] : []; if (evs.length) save(new Blob([icsText(evs)], { type: 'text/calendar' }), 'persiapan.ics'); else K.toast(t('Belum ada tanggalnya.', 'It has no date yet.')); return; }
    if (x.hasAttribute('data-pop-del')) {
      if (!x.classList.contains('is-sure')) { x.classList.add('is-sure'); x.textContent = t('Ketuk lagi untuk menghapus', 'Tap again to delete'); return; }
      if (dirMode) { dirDelete(); return; }
      var id = draft.id; pop.close(); if (items[id]) drop(id); draw(); return;
    }
    if (x.hasAttribute('data-teamonly')) { readForm(); draft.team_only = a('aria-checked') !== 'true'; x.setAttribute('aria-checked', String(draft.team_only)); return; }
    if (x.hasAttribute('data-pay-add')) { readForm(); var last = payDraft[payDraft.length - 1]; payDraft.push({ id: uid(), kind: 'bayar', parent: draft.id, sort: 0, team_only: false, data: { stage: !payDraft.length ? 'dp' : last && last.data.stage === 'dp' ? 'pelunasan' : 'termin' } }); paint(); return; }
    if (x.hasAttribute('data-pay-del')) { readForm(); var p = payDraft.splice(+a('data-pay-del'), 1)[0]; if (p && items[p.id]) payGone.push(p.id); paint(); return; }
    if (x.hasAttribute('data-file-del')) { readForm(); var i = +a('data-file-del'); if (x.hasAttribute('data-pay')) payDraft[+a('data-pay')].data.files.splice(i, 1); else draft.data.files.splice(i, 1); paint(); return; }
    if (x.hasAttribute('data-act-add')) { readForm(); (draft.data.actions = draft.data.actions || []).push({ text: '' }); paint(); var ins = pop.querySelectorAll('[data-act]'); if (ins.length) ins[ins.length - 1].focus(); return; }
    if (x.hasAttribute('data-act-del')) { readForm(); draft.data.actions.splice(+a('data-act-del'), 1); paint(); return; }
    if (x.hasAttribute('data-act-task')) {
      readForm(); var ac = draft.data.actions[+a('data-act-task')]; if (!ac || !ac.text) return;
      var tk = make('tugas', { title: ac.text, status: 'belum', notes: t('Dari rapat: ', 'From the meeting: ') + (draft.data.title || '') });
      ac.task = tk.id; wbsIndex(); paint(); K.toast(t('Tugas dibuat. Atur penanggung jawab dan tenggatnya di Kanban.', 'Task made. Set who does it and its deadline in Kanban.')); return;
    }
  });
  document.addEventListener('change', function (e) {
    if (!pop || !pop.contains(e.target)) return;
    var x = e.target;
    if (x.hasAttribute('data-attach')) {
      readForm();
      var into = x.getAttribute('data-attach') === 'pay' ? payDraft[+x.getAttribute('data-pi')].data : draft.data;
      uploadMany(x.files, function (out) { into.files = (into.files || []).concat(out); paint(); });
      x.value = '';
    }
  });
  document.addEventListener('input', function (e) {
    if (!pop || !pop.contains(e.target) || !e.target.hasAttribute('data-money')) return;
    var x = e.target, n = num(x.value); x.value = n ? n.toLocaleString('id-ID') : '';
  });

  /* the directory's own small editor (team only) */
  var dirMode = null;
  function dirEdit(id) {
    var v = id ? (S.dir || []).filter(function (x) { return x.id === id; })[0] : null;
    dirMode = { id: id || uid(), data: v ? JSON.parse(JSON.stringify(v.data)) : {} };
    draft = { kind: 'vendor', id: dirMode.id, data: dirMode.data, _titleKey: 'name' };
    var f = FORMS.vendor.filter(function (x) { return x[0] !== 'status'; }).concat([['city', 'Kota', 'City', 'text'], ['note', 'Catatan untuk pasangan', 'Note for couples', 'text']]);
    pop.querySelector('#pm-pop-body').innerHTML = '<div class="pm-fgrid">' + f.map(function (x) { return field(x, dirMode.data); }).join('') + '</div><p class="small muted">' + t('Direktori dipakai bersama oleh semua pernikahan. Pasangan melihat semuanya kecuali bagian hanya tim.', 'The directory is shared by every wedding. Couples see everything but the team-only parts.') + '</p>';
    pop.querySelector('#pm-pop-h').textContent = t('Direktori vendor', 'Vendor directory');
    pop.querySelector('#pm-pop-acts').innerHTML = (id ? '<button type="button" class="btn btn--line" data-pop-del>' + t('Hapus', 'Delete') + '</button>' : '') + '<span style="flex:1"></span><button type="button" class="btn btn--line" data-pop-cancel>' + t('Batal', 'Cancel') + '</button><button type="button" class="btn btn--main" data-pop-save>' + t('Simpan', 'Save') + '</button>';
    pop.addEventListener('close', function once() { pop.removeEventListener('close', once); dirMode = null; });
    pop.showModal();
  }
  function dirCommit() {
    readForm();
    if (!dirMode.data.name) { var i = pop.querySelector('[data-k="name"]'); if (i) i.focus(); return; }
    DB.rpc('pm_dir_save', { p_who: H.who(), p_id: dirMode.id, p_data: dirMode.data, p_del: false }).then(function (dir) { if (dir) { S.dir = dir; pop.close(); body(); } else K.toast(t('Tidak bisa menyimpan.', 'Could not save.')); }, function () { K.offline(); });
  }
  function dirDelete() {
    DB.rpc('pm_dir_save', { p_who: H.who(), p_id: dirMode.id, p_data: null, p_del: true }).then(function (dir) { if (dir) { S.dir = dir; pop.close(); body(); } }, function () { K.offline(); });
  }

  /* re-plan every template task from its offset to the wedding day (tasks the team or couple added keep their dates) */
  function reschedule() {
    var n = 0;
    all('tugas').forEach(function (it) {
      var d = it.data; if (d.off == null || d.status === 'selesai') return;
      var due = addDays(S.date, +d.off), st = addDays(due, -((+d.dur || 1) - 1));
      if (d.due !== due || d.start !== st) { d.due = due; d.start = st; put(it); n++; }
    });
    draw(); K.toast(n ? n + t(' tugas dijadwalkan ulang dari hari H.', ' tasks re-planned from the wedding day.') : t('Jadwal sudah sesuai hari H.', 'The schedule already matches the wedding day.'));
  }
  function runCopy() {
    var rs = all('acara').sort(function (a, c) { return ((a.data.day || '') + (a.data.start || '')) < ((c.data.day || '') + (c.data.start || '')) ? -1 : 1; }), last = '', out = [t('Rundown ', 'Rundown ') + S.couple];
    rs.forEach(function (r) { var d = r.data; if ((d.day || '') !== last) { out.push('', '*' + (d.day || '') + '*'); last = d.day || ''; } out.push((d.start || '') + (d.end ? '-' + d.end : '') + '  ' + (d.title || '') + (d.place ? ' (' + d.place + ')' : '') + (d.pic ? ' - PIC ' + d.pic : '')); });
    var txt = out.join('\n');
    (navigator.clipboard ? navigator.clipboard.writeText(txt) : Promise.reject()).then(function () { K.toast(t('Rundown disalin. Tempel di WhatsApp.', 'Rundown copied. Paste it into WhatsApp.')); }, function () { K.toast(t('Tidak bisa menyalin di peramban ini.', 'Copying is not available in this browser.')); });
  }

  function reset() { stop(); clearTimeout(qTimer); queue = {}; S = null; B = null; items = {}; slug = null; tab = 'ringkasan'; chat = { msgs: [], last: 0, room: '' }; if (root) root.innerHTML = ''; if (pop && pop.open) pop.close(); }
  return { mount: mount, show: show, open: open, board: board, flush: flush, stop: stop, reset: reset };
})();
