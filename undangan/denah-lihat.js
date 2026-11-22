/* Draws a published seating plan, read-only: the ushers' page (penerima.html) and the guest's "Meja Anda" (meja.js).
   window.NAWALA_DENAH.svg(plan, {hl: tableId, mine: guestId, colors: {group: colour}, guests: {id: guest}})
   returns an <svg> string in metres, the same shapes as the editor (undangan/denah.html). */
window.NAWALA_DENAH = (function () {
  'use strict';
  var ONE = { couple: 1, head: 1 };
  var TABLE = { round: 1, rect: 1, couple: 1, head: 1, rows: 1 };
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function r2(v) { return Math.round(v * 100) / 100; }
  function chairs(it) {
    var n = it.seats || (it.seat ? it.seat.length : 0), o = [], i, r, c;
    if (it.type === 'round') { var R = it.w / 2 + 0.32; for (i = 0; i < n; i++) { var a = -Math.PI / 2 + i * 2 * Math.PI / n; o.push([Math.cos(a) * R, Math.sin(a) * R]); } }
    else if (it.type === 'rows') { for (r = 0; r < it.rows; r++) for (c = 0; c < it.cols; c++) o.push([-it.w / 2 + 0.3 + c * 0.6, -it.h / 2 + 0.325 + r * 0.65]); }
    else if (ONE[it.type]) { for (i = 0; i < n; i++) o.push([-it.w / 2 + it.w * (i + 0.5) / n, -(it.h / 2 + 0.3)]); }
    else { var top = Math.ceil(n / 2), bot = n - top; for (i = 0; i < top; i++) o.push([-it.w / 2 + it.w * (i + 0.5) / top, -(it.h / 2 + 0.3)]); for (i = 0; i < bot; i++) o.push([-it.w / 2 + it.w * (i + 0.5) / bot, it.h / 2 + 0.3]); }
    return o;
  }
  function item(it, o) {
    var hl = o.hl === it.id, tbl = !!TABLE[it.type], s = '', fill = hl ? '#D8436B' : tbl ? '#fff' : (it.color || '#e7e2d8'), ink = hl ? '#fff' : '#1c2024';
    var line = hl ? '#D8436B' : tbl ? '#1c2024' : '#9aa3ad', sw = hl ? 0.07 : 0.035;
    if (it.type === 'round') s += '<circle r="' + it.w / 2 + '" fill="' + fill + '" stroke="' + line + '" stroke-width="' + sw + '"/>';
    else if (it.type === 'label') s += '';
    else if (it.type === 'rows') s += hl ? '<rect x="' + (-it.w / 2 - 0.12) + '" y="' + (-it.h / 2 - 0.12) + '" width="' + (it.w + 0.24) + '" height="' + (it.h + 0.24) + '" rx=".14" fill="none" stroke="#D8436B" stroke-width=".08"/>' : '';
    else if (it.type === 'gazebo') { var a = it.w / 2, b = it.h / 2, k = 0.29; s += '<polygon points="' + [-a * k, -b, a * k, -b, a, -b * k, a, b * k, a * k, b, -a * k, b, -a, b * k, -a, -b * k].join(' ') + '" fill="' + fill + '" stroke="' + line + '" stroke-width="' + sw + '"/>'; }
    else s += '<rect x="' + (-it.w / 2) + '" y="' + (-it.h / 2) + '" width="' + it.w + '" height="' + it.h + '" rx="' + (tbl ? 0.08 : 0.18) + '" fill="' + fill + '" stroke="' + line + '" stroke-width="' + sw + '"' + (it.type === 'standing' ? ' stroke-dasharray=".25 .15"' : '') + '/>';
    if (tbl && Array.isArray(it.seat)) chairs(it).forEach(function (p, i) {
      var v = it.seat[i], off = (it.off || []).indexOf(i) > -1, me = o.mine && v === o.mine, g = o.guests && v && o.guests[v];
      var f = me ? '#d8436b' : g && o.colors && o.colors[g.grp] ? o.colors[g.grp] : v ? '#c7ccd2' : '#fff';
      if (it.type === 'couple' && i < 2) f = i === 0 ? '#d6517a' : '#3f7fd1';
      s += '<circle cx="' + r2(p[0]) + '" cy="' + r2(p[1]) + '" r="' + (me ? 0.27 : 0.22) + '" fill="' + (off ? 'none' : f) + '" stroke="' + (me ? '#fff' : '#9aa3ad') + '" stroke-width="' + (me ? 0.06 : 0.03) + '"' + (off ? ' stroke-dasharray=".06 .05" opacity=".5"' : '') + '/>';
    });
    var rot = ' transform="rotate(' + (-(it.r || 0)) + ')"', fs;
    if (it.type === 'label') s += '<text font-size="' + r2(it.h * 0.62) + '" font-weight="600" fill="#1c2024"' + rot + '>' + esc(it.text) + '</text>';
    else if (it.type === 'rows') s += '<text font-size=".3" font-weight="600" y="' + (-it.h / 2 - 0.38) + '" fill="' + (hl ? '#D8436B' : '#1c2024') + '"' + rot + '>' + esc(it.name) + '</text>';
    else {
      /* labels fit inside their piece; rooms-within-rooms carry theirs at the top; tall narrow pieces run it along their length */
      var L = Math.max(1, String(it.name || '').length), vert = !tbl && it.h > it.w * 1.8 && L * 0.56 * 0.3 > it.w * 0.88;
      var avail = tbl ? (it.type === 'round' ? it.w * 0.8 : it.w * 0.9) : (vert ? it.h : it.w) * 0.88;
      fs = tbl ? (Math.min(it.w, it.h) < 0.95 ? 0.24 : 0.3) : Math.max(0.24, Math.min(0.4, Math.min(it.w, it.h) * 0.22));
      fs = Math.max(tbl ? 0.12 : 0.14, Math.min(fs, avail / (L * 0.56)));
      var top = !tbl && !vert && ['pelaminan', 'stage', 'dance', 'standing', 'gazebo', 'shape'].indexOf(it.type) > -1 && it.h > 1.4, y = top ? r2(-it.h / 2 + fs * 0.85 + 0.14) : 0;
      s += '<text font-size="' + r2(fs) + '" font-weight="600" fill="' + ink + '" transform="' + (vert ? 'rotate(-90)' : 'translate(0 ' + y + ') rotate(' + (-(it.r || 0)) + ')') + '">' + esc(it.name) + '</text>';
    }
    return '<g transform="translate(' + r2(it.x) + ' ' + r2(it.y) + ') rotate(' + (it.r || 0) + ')">' + s + '</g>';
  }
  function svg(plan, o) {
    o = o || {}; var R = plan.room || { w: 20, h: 20 }, order = function (it) { return ['shape', 'standing', 'dance', 'pelaminan', 'stage'].indexOf(it.type) > -1 ? 0 : 1; };
    var items = (plan.items || []).slice().sort(function (a, b) { return order(a) - order(b); });
    return '<svg viewBox="-0.6 -0.6 ' + (R.w + 1.2) + ' ' + (R.h + 1.2) + '" role="img" aria-label="' + esc(plan.name) + '" style="font-family:inherit">' +
      '<style>text{text-anchor:middle;dominant-baseline:central}</style>' +
      '<rect x="0" y="0" width="' + R.w + '" height="' + R.h + '" fill="#fff" stroke="#16301F" stroke-width=".06"/>' +
      items.map(function (it) { return item(it, o); }).join('') + '</svg>';
  }
  /* where a table is, in words */
  function where(plan, it, en) {
    var R = plan.room || { w: 20, h: 20 }, h = it.x < R.w * 0.4 ? 0 : it.x > R.w * 0.6 ? 2 : 1, v = it.y < R.h * 0.35 ? 0 : it.y > R.h * 0.7 ? 2 : 1;
    var H = en ? ['Left side', 'Middle', 'Right side'] : ['Sisi kiri', 'Tengah', 'Sisi kanan'], V = en ? ['near the stage', 'middle of the room', 'near the entrance'] : ['dekat pelaminan', 'bagian tengah ruangan', 'dekat pintu masuk'];
    return H[h] + ', ' + V[v];
  }
  return { svg: svg, where: where, esc: esc };
})();
