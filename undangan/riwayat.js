/* Riwayat: words on undo and redo, a list of recent steps to undo several at once, and a way back to the
   published plan (owner, 23 Nov 2026: the two arrows were easy to miss and he needed batch undo).
   Loaded after the planner's own script in denah-demo.html and denah.html. It wraps that script's commit(),
   undo() and redo() and keeps one label per step beside its past/future stacks; the stacks stay the planner's own. */
(function () {
  'use strict';
  var P = window.NAWALA_PLAN; if (!P) return;
  var L = [], F = [];
  var $ = function (s) { return document.querySelector(s); };
  function tt(id, en) { return P.t(id, en); }
  function itemName(i) {
    if (!i) return '';
    if (i.name) return i.name;
    var T = P.TYPES && P.TYPES[i.type];
    return T && T.l ? tt(T.l[0], T.l[1]) : tt('benda', 'item');
  }
  function guestName(id) { try { var g = P.G(id); return g ? g.name : tt('tamu', 'a guest'); } catch (e) { return tt('tamu', 'a guest'); } }
  /* what one step changed, in a few words */
  function describe(a, b) {
    try {
      var A = JSON.parse(a), B = JSON.parse(b);
      if ((A.l || []).length !== (B.l || []).length) return (B.l || []).length > (A.l || []).length ? tt('Tambah denah baru', 'Add a new plan') : tt('Hapus denah', 'Delete a plan');
      var ia = [], ib = [];
      (A.l || []).forEach(function (l) { ia = ia.concat(l.items || []); });
      (B.l || []).forEach(function (l) { ib = ib.concat(l.items || []); });
      var ma = {}, mb = {}; ia.forEach(function (i) { ma[i.id] = i; }); ib.forEach(function (i) { mb[i.id] = i; });
      var add = ib.filter(function (i) { return !ma[i.id]; }), del = ia.filter(function (i) { return !mb[i.id]; });
      if (add.length) return tt('Tambah ', 'Add ') + itemName(add[0]) + (add.length > 1 ? ' (+' + (add.length - 1) + ')' : '');
      if (del.length) return tt('Hapus ', 'Delete ') + itemName(del[0]) + (del.length > 1 ? ' (+' + (del.length - 1) + ')' : '');
      var seated = [], freed = [], moved = null, sized = null, named = null, other = null;
      ib.forEach(function (i) {
        var p = ma[i.id]; if (!p) return;
        var sa = JSON.stringify(p.seat || []), sb = JSON.stringify(i.seat || []);
        if (sa !== sb) {
          (i.seat || []).forEach(function (g, k) { if (g && (p.seat || [])[k] !== g && seated.indexOf(g) < 0) seated.push(g); });
          (p.seat || []).forEach(function (g, k) { if (g && (i.seat || [])[k] !== g && freed.indexOf(g) < 0 && (i.seat || []).indexOf(g) < 0) freed.push(g); });
          if (!seated.length && !freed.length && !other) other = i;
        }
        if (p.x !== i.x || p.y !== i.y) moved = moved || i;
        if (p.w !== i.w || p.h !== i.h || p.r !== i.r || p.seats !== i.seats) sized = sized || i;
        if (p.name !== i.name) named = named || i;
        if (!other && JSON.stringify(p) !== JSON.stringify(i)) other = i;
      });
      if (seated.length) return tt('Dudukkan ', 'Seat ') + guestName(seated[0]) + (seated.length > 1 ? ' (+' + (seated.length - 1) + ')' : '');
      if (freed.length) return tt('Lepas ', 'Unseat ') + guestName(freed[0]) + tt(' dari kursi', '');
      if (named) return tt('Ganti nama ', 'Rename ') + itemName(named);
      if (sized) return tt('Ubah ', 'Change ') + itemName(sized);
      if (moved) return tt('Geser ', 'Move ') + itemName(moved);
      if (JSON.stringify(A.g) !== JSON.stringify(B.g)) return tt('Ubah grup tamu', 'Change guest groups');
      if (A.p !== B.p) return tt('Ubah tampilan untuk tamu', 'Change what guests see');
      if (other) return tt('Ubah ', 'Change ') + itemName(other);
    } catch (e) {}
    return tt('Perubahan', 'A change');
  }
  function sync() {
    var past = P.past, future = P.future;
    while (L.length > past.length) L.shift();
    while (L.length < past.length) L.unshift(tt('Perubahan', 'A change'));
    while (F.length > future.length) F.shift();
    while (F.length < future.length) F.unshift(tt('Perubahan', 'A change'));
  }
  /* the planner calls this from commit, undo, redo and its status line */
  var queued = false;
  window.NAWALA_HIST = function (k, a, b) {
    if (k === 'commit') { L.push(describe(a, b)); F.length = 0; }
    else if (k === 'undo') F.push(L.pop() || '');
    else if (k === 'redo') L.push(F.pop() || '');
    else if (k === 'jump') { L.push(a); F.length = 0; }
    if (!queued) { queued = true; setTimeout(function () { queued = false; paint(); }, 0); }
  };
  /* the buttons: an arrow and a word, the step itself in the tooltip */
  var u = $('#undo'), r = $('#redo');
  if (!u || !r) return;
  u.classList.add('ico--txt'); r.classList.add('ico--txt');
  u.insertAdjacentHTML('beforeend', '<span></span>'); r.insertAdjacentHTML('beforeend', '<span></span>');
  var h = document.createElement('button'); h.id = 'hist'; h.type = 'button'; h.className = 'ico ico--txt';
  h.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 3-6.7"/><path d="M3 4v5h5"/><path d="M12 7v5l3 2"/></svg><span></span>';
  r.insertAdjacentElement('afterend', h);
  var pop = document.createElement('div'); pop.className = 'pop hist'; pop.id = 'histPop'; document.body.appendChild(pop);
    function readOnly() { try { return !!P.ro(); } catch (e) { return false; } }
  function canBack() { return typeof P.pub === 'string' && P.pub && back() !== P.cur; }
  function back() { try { var o = JSON.parse(P.pub), c = JSON.parse(P.cur); if (!o.g || !o.g.length) o.g = c.g; if (!('p' in o) && 'p' in c) o.p = c.p; return JSON.stringify(o); } catch (e) { return P.cur; } }
  function paint() {
    sync();
    var ro = readOnly(), past = P.past, future = P.future;
    u.querySelector('span').textContent = tt('Urungkan', 'Undo'); r.querySelector('span').textContent = tt('Ulangi', 'Redo'); h.querySelector('span').textContent = tt('Riwayat', 'History');
    u.disabled = !past.length || ro; r.disabled = !future.length || ro; h.disabled = ro || (!past.length && !canBack());
    u.title = past.length ? tt('Urungkan: ', 'Undo: ') + L[L.length - 1] + ' (Ctrl+Z)' : tt('Belum ada yang bisa diurungkan', 'Nothing to undo yet');
    r.title = future.length ? tt('Ulangi: ', 'Redo: ') + F[F.length - 1] : tt('Tidak ada yang bisa diulangi', 'Nothing to redo');
    u.setAttribute('aria-label', u.title); r.setAttribute('aria-label', r.title);
    if (pop.classList.contains('on')) list();
  }
  function list() {
    var rows = '';
    for (var k = L.length - 1; k >= Math.max(0, L.length - 30); k--) rows += '<button type="button" data-k="' + k + '"><b>' + esc2(L[k]) + '</b><small>' + (k === L.length - 1 ? tt('langkah terakhir', 'the last step') : (L.length - k) + tt(' langkah, sampai sini', ' steps, back to here')) + '</small></button>';
    pop.innerHTML = '<p class="hist__h">' + tt('Ketuk satu langkah untuk mengurungkannya bersama semua langkah sesudahnya.', 'Tap a step to undo it together with every step after it.') + '</p>' +
      (rows || '<p class="hist__e">' + tt('Belum ada langkah di sesi ini.', 'No steps in this session yet.') + '</p>') +
      (canBack() ? '<button type="button" class="hist__back" data-back>' + tt('Kembali ke versi terbit', 'Back to the published version') + '<small>' + tt('Buang semua perubahan sejak terakhir diterbitkan. Bisa diurungkan.', 'Drop every change since it was last published. You can undo this.') + '</small></button>' : '');
  }
  function esc2(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  h.onclick = function (e) {
    e.stopPropagation();
    if (pop.classList.contains('on')) { pop.classList.remove('on'); return; }
    list(); pop.classList.add('on');
    var b = h.getBoundingClientRect();
    pop.style.left = Math.max(8, Math.min(innerWidth - pop.offsetWidth - 8, b.left)) + 'px';
    pop.style.top = (b.bottom + 6) + 'px';
  };
  pop.addEventListener('click', function (e) {
    e.stopPropagation();
    var b = e.target.closest('[data-k]');
    if (b) { var k = +b.getAttribute('data-k'); while (P.past.length > k) { var n = P.past.length; P.undo(); if (P.past.length === n) break; } pop.classList.remove('on'); return; }
    if (e.target.closest('[data-back]')) {
      var j = back(); if (j === P.cur) return;
      P.jump(j, tt('Kembali ke versi terbit', 'Back to the published version')); pop.classList.remove('on');
    }
  });
  document.addEventListener('click', function (e) { if (!e.target.closest('#histPop,#hist')) pop.classList.remove('on'); });
  addEventListener('keydown', function (e) { if (e.key === 'Escape' && pop.classList.contains('on')) { pop.classList.remove('on'); e.stopPropagation(); } }, true);
  paint();
})();
