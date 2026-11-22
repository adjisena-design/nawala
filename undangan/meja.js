/* "Meja Anda": a guest's table in a live invitation (both engines; loaded after them). Only on a real invitation
   (sample === false) opened with ?to=<guest name>. Asks guest_seat(); it answers only once the published seating plan
   has this guest and their last RSVP says "hadir", so it asks again a moment after an RSVP is sent. A pill at the top
   opens a box with the table, where it is, and the plan (unless the couple turned the plan off). */
(function () {
  'use strict';
  var D = window.NAWALA_INVITE, DB = window.NAWALA_DB, V = window.NAWALA_DENAH;
  var DEMO = /[?&]denah=demo(&|$)/.test(location.search);
  if (!D || !V || (!DEMO && (D.sample !== false || !D.slug || !DB))) return;
  var m = location.search.match(/[?&]to=([^&]+)/), name = '';
  try { name = m ? decodeURIComponent(m[1].replace(/\+/g, ' ')).trim() : ''; } catch (e) { name = ''; }
  if (!name) return;
  var en = function () { return (document.documentElement.lang || '').slice(0, 2) === 'en'; }, t = function (a, b) { return en() ? b : a; };
  var data = null, pill = null, dlg = null, esc = V.esc;

  var css = document.createElement('style');
  css.textContent = '.meja-pill{position:fixed;z-index:60;left:calc(env(safe-area-inset-left,0px) + 12px);top:calc(env(safe-area-inset-top,0px) + 12px);max-width:calc(100vw - 150px);white-space:nowrap;display:inline-flex;align-items:center;gap:8px;' +
    'min-height:44px;padding:8px 16px 8px 12px;border:0;border-radius:999px;background:rgba(255,253,248,.94);color:#1c2024;font:600 15px/1.2 inherit;font-family:inherit;' +
    'box-shadow:0 10px 26px -10px rgba(0,0,0,.45),inset 0 0 0 1px rgba(0,0,0,.08);cursor:pointer;opacity:0;transition:opacity .5s}' +
    '.meja-pill.is-on{opacity:1}.meja-pill svg{width:20px;height:20px;flex:none}.meja-pill span{overflow:hidden;text-overflow:ellipsis}' +
    '.meja-pop{border:0;padding:0;background:none;max-width:none;max-height:none;width:min(460px,calc(100vw - 20px));margin:auto}' +
    '.meja-pop::backdrop{background:rgba(10,14,12,.5)}' +
    '.meja-box{background:#fffdf8;color:#1c2024;border-radius:22px;padding:18px;display:grid;gap:10px;max-height:calc(100svh - 24px);overflow:auto;box-shadow:0 30px 70px -20px rgba(0,0,0,.6);font-family:inherit}' +
    '.meja-box h2{margin:0;font-size:15px;font-weight:600;color:#5f666e}.meja-box b.big{font-size:30px;line-height:1.1}' +
    '.meja-box p{margin:0;color:#5f666e;font-size:15px}.meja-box svg{width:100%;height:auto;border-radius:12px;background:#fff}' +
    '.meja-x{justify-self:end;min-height:44px;padding:0 18px;border:0;border-radius:999px;background:#1c2024;color:#fff;font:600 15px/1 inherit;font-family:inherit;cursor:pointer}' +
    '@media (prefers-reduced-motion:reduce){.meja-pill{transition:none}}';
  document.head.appendChild(css);

  function icon() { return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="4"/><circle cx="12" cy="3.5" r="1.4"/><circle cx="12" cy="20.5" r="1.4"/><circle cx="3.5" cy="12" r="1.4"/><circle cx="20.5" cy="12" r="1.4"/></svg>'; }
  function names() { return data.seats.map(function (s) { return s.table; }).join(', '); }
  function show() {
    if (!pill) {
      pill = document.createElement('button'); pill.type = 'button'; pill.className = 'meja-pill';
      pill.addEventListener('click', open); document.body.appendChild(pill);
      requestAnimationFrame(function () { pill.classList.add('is-on'); });
    }
    pill.innerHTML = icon() + '<span>' + esc(t('Meja Anda: ', 'Your table: ') + names()) + '</span>';
  }
  function open() {
    if (!dlg) {
      dlg = document.createElement('dialog'); dlg.className = 'meja-pop'; document.body.appendChild(dlg);
      dlg.addEventListener('click', function (e) { if (e.target === dlg || e.target.closest('.meja-x')) dlg.close(); });
    }
    var plans = data.plans || [];
    dlg.innerHTML = '<div class="meja-box"><h2>' + esc(t('Meja Anda', 'Your table')) + '</h2>' +
      data.seats.map(function (s) {
        var pl = plans[s.plan] || { room: { w: s.w, h: s.h } }, it = { x: s.x, y: s.y };
        return '<b class="big">' + esc(s.table) + '</b><p>' + esc((plans.length > 1 || data.seats.length > 1 ? s.plan_name + '. ' : '') +
          s.chairs + ' ' + t('kursi disiapkan untuk Anda. ', s.chairs === 1 ? 'chair set for you. ' : 'chairs set for you. ') + V.where(pl, it, en())) + '</p>' +
          (plans[s.plan] ? V.svg(plans[s.plan], { hl: s.id }) : '');
      }).join('') +
      '<button type="button" class="meja-x">' + esc(t('Tutup', 'Close')) + '</button></div>';
    if (dlg.showModal) dlg.showModal(); else dlg.setAttribute('open', '');
  }
  /* the seating demo (denah-demo.html) leaves its published plan in this browser: answer from it, no database */
  function demo() {
    var o = null; try { o = JSON.parse(localStorage.getItem('nawala-denah-demo') || 'null'); } catch (e) {}
    if (!o || !o.plans) return null;
    var g = (o.guests || []).filter(function (x) { return x.name.toLowerCase() === name.toLowerCase(); })[0]; if (!g) return null;
    var seats = [];
    o.plans.forEach(function (l, p) { (l.items || []).forEach(function (it) {
      var n = (it.seat || []).filter(function (v) { return v === g.id; }).length;
      if (n) seats.push({ plan: p, plan_name: l.name, id: it.id, table: it.name, chairs: n, x: it.x, y: it.y, w: l.room.w, h: l.room.h });
    }); });
    var plans = o.showPlan === false ? null : o.plans.map(function (l) { return { name: l.name, room: l.room, items: (l.items || []).map(function (it) { var c = {}; for (var k in it) c[k] = it[k]; if (c.seat) c.seat = c.seat.map(function (v) { return v ? 1 : null; }); return c; }) }; });
    return { answer: 'hadir', seats: seats, plans: plans };
  }
  function check() {
    if (DEMO) { var r0 = demo(); if (r0 && r0.seats.length) { data = r0; show(); } return; }
    DB.rpc('guest_seat', { p_slug: D.slug, p_guest: name }).then(function (r) {
      if (r && r.seats && r.seats.length) { data = r; show(); }
    }, function () {});
  }
  check();
  /* after an RSVP is sent, the answer may now be "hadir" */
  document.addEventListener('click', function (e) { if (e.target.closest && e.target.closest('#rsvp a, #rsvp button')) { setTimeout(check, 2500); setTimeout(check, 7000); } }, true);
})();
