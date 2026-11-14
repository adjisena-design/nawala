// Nawala v2 — static page generator. Run: node build.mjs  -> index.html
import { writeFileSync } from 'node:fs';

/* ---------- utils ---------- */
const rng = s => () => { s |= 0; s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
const f = n => (+n).toFixed(1);
const v = n => `var(--${n})`;
const fill = c => `style="fill:${c}"`;
const stroke = (c, w = 2, op = 1) => `style="fill:none;stroke:${c};stroke-width:${w};stroke-linecap:round;stroke-linejoin:round;opacity:${op}"`;
let gid = 0;
// vertical gradient: returns {def, ref}
function grad(a, b) { const id = 'g' + (gid++); return { def: `<linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:${a}"/><stop offset="1" style="stop-color:${b}"/></linearGradient>`, ref: `url(#${id})` }; }
function paint(c) { // c: string colour or [top,bottom]
  if (Array.isArray(c)) { const g = grad(c[0], c[1]); return { def: g.def, f: `style="fill:${g.ref}"` }; }
  return { def: '', f: fill(c) };
}

/* ---------- primitives ---------- */
function ridge(o) {
  const { w, h } = o, r = rng(Math.round(o.seed * 977)), n = o.n || 16, x0 = o.x0 ?? -80, x1 = o.x1 ?? w + 80, F = o.f || 2, pts = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n, x = x0 + (x1 - x0) * t;
    let y = o.y + o.amp * (Math.sin(t * Math.PI * F + o.seed) * .6 + Math.sin(t * Math.PI * F * 2.7 + o.seed * 2.1) * .28 + (r() - .5) * .3);
    if (o.mound) { const e = Math.pow(Math.sin(Math.PI * t), .5); y = h + 40 - (h + 40 - y) * e; }
    pts.push([x, y]);
  }
  const line = dy => { let d = `M${f(pts[0][0])},${f(pts[0][1] + dy)}`; for (let i = 1; i < pts.length - 1; i++) { const mx = (pts[i][0] + pts[i + 1][0]) / 2, my = (pts[i][1] + pts[i + 1][1]) / 2; d += ` Q${f(pts[i][0])},${f(pts[i][1] + dy)} ${f(mx)},${f(my + dy)}`; } const L = pts[pts.length - 1]; return d + ` L${f(L[0])},${f(L[1] + dy)}`; };
  const p = paint(o.fill);
  let lines = ''; for (let k = 1; k <= (o.lines || 0); k++) lines += `<path d="${line(k * (o.gap || 16))}" ${stroke(o.line, 1.6, (.55 - k * .1).toFixed(2))}/>`;
  const yAt = x => { for (let i = 0; i < pts.length - 1; i++) if (x >= pts[i][0] && x <= pts[i + 1][0]) { const t = (x - pts[i][0]) / (pts[i + 1][0] - pts[i][0]); return pts[i][1] + (pts[i + 1][1] - pts[i][1]) * t; } return o.y; };
  return { svg: `<g><defs>${p.def}</defs><path filter="url(#${o.sh || 'paint'})" d="${line(0)} L${x1},${h + 80} L${x0},${h + 80} Z" ${p.f}/>${o.line ? `<path d="${line(1.5)}" ${stroke(o.line, 2.2, .7)}/>` : ''}${lines}</g>`, yAt };
}
function sun(cx, cy, r, c, glow, ring, craters = false) {
  let rings = ''; if (ring) for (const j of [.78, .56]) rings += `<circle cx="${cx}" cy="${cy}" r="${f(r * j)}" ${stroke(ring, 1.6, .55)}/>`;
  const cr = craters ? `<circle cx="${f(cx - r * .3)}" cy="${f(cy - r * .2)}" r="${f(r * .15)}" ${fill(glow)} opacity=".55"/><circle cx="${f(cx + r * .3)}" cy="${f(cy + r * .25)}" r="${f(r * .1)}" ${fill(glow)} opacity=".5"/><circle cx="${f(cx + r * .1)}" cy="${f(cy - r * .45)}" r="${f(r * .07)}" ${fill(glow)} opacity=".5"/>` : '';
  return `<circle cx="${cx}" cy="${cy}" r="${f(r * 1.7)}" ${fill(glow)} opacity=".55" filter="url(#bloom)"/><circle filter="url(#paint)" cx="${cx}" cy="${cy}" r="${r}" ${fill(c)}/>${rings}${cr}`;
}
// IEEF-like wispy cloud: stacked capsules
function cloud(x, y, s, c, line) {
  const rows = [[0, 0, 1], [.18, -1, .7], [-.12, 1, .82]];
  let out = '';
  for (const [dx, dy, k] of rows) { const w = 240 * s * k, h = 22 * s; out += `<rect x="${f(x + dx * 240 * s - w / 2)}" y="${f(y + dy * h * .9 - h / 2)}" width="${f(w)}" height="${f(h)}" rx="${f(h / 2)}" ${fill(c)}/>`; }
  out += `<path d="M${f(x - 100 * s)},${f(y + 3 * s)} L${f(x + 90 * s)},${f(y + 3 * s)}" ${stroke(line, 1.4, .6)}/>`;
  return `<g filter="url(#paint-s)">${out}</g>`;
}
function bez(A, B, C, t) { return [(1 - t) ** 2 * A[0] + 2 * (1 - t) * t * B[0] + t * t * C[0], (1 - t) ** 2 * A[1] + 2 * (1 - t) * t * B[1] + t * t * C[1]]; }
function fuji(o) {
  const { cx, b, py, W } = o, H = b - py, r = rng(11);
  const P0 = [cx - W / 2, b], P1 = [cx - W * .12, b - H * .4], P2 = [cx - W * .055, py + 6], Q0 = [cx + W * .055, py + 6], Q1 = [cx + W * .12, b - H * .4], Q2 = [cx + W / 2, b];
  const p = paint(o.fill);
  const d = `M${P0} Q${P1} ${P2} Q${cx},${py - 6} ${Q0} Q${Q1} ${Q2} Z`;
  const ys = py + H * .24;
  const findT = (A, B, C, y) => { let bt = 0, bd = 1e9; for (let t = 0; t <= 1; t += .005) { const dd = Math.abs(bez(A, B, C, t)[1] - y); if (dd < bd) { bd = dd; bt = t; } } return bt; };
  const tl = findT(P0, P1, P2, ys), tr = findT(Q0, Q1, Q2, ys);
  const s = []; for (let i = 0; i <= 6; i++) s.push(bez(P0, P1, P2, tl + (1 - tl) * i / 6)); s.push([cx, py - 2]); for (let i = 0; i <= 6; i++) s.push(bez(Q0, Q1, Q2, tr * i / 6));
  const Rp = bez(Q0, Q1, Q2, tr), Lp = bez(P0, P1, P2, tl);
  for (let i = 1; i < 9; i++) { const x = Rp[0] + (Lp[0] - Rp[0]) * i / 9; s.push([x, ys + (i % 2 ? 18 + r() * 12 : -4 - r() * 6)]); }
  let lines = ''; for (let k = -4; k <= 4; k++) { if (!k) continue; lines += `<path d="M${f(cx + k * 2)},${f(py + 16)} Q${f(cx + k * W * .028)},${f(py + H * .45)} ${f(cx + k * W * .09)},${f(b - 6)}" ${stroke(o.line, 1.6, .55)}/>`; }
  return `<g><defs>${p.def}</defs><path filter="url(#paint-l)" d="${d}" ${p.f}/>${lines}<path filter="url(#paint-s)" d="M${s.map(q => f(q[0]) + ',' + f(q[1])).join(' L')} Z" ${fill(o.snow)}/></g>`;
}
function river(o) {
  const N = 30, L = [], R = [], C = [];
  for (let i = 0; i <= N; i++) { const t = i / N, y = o.y0 + (o.h + 40 - o.y0) * Math.pow(t, 1.1); const cx = o.x0 + (o.x1 - o.x0) * t + Math.sin(t * Math.PI * 2.3 + .5) * o.sw * (.25 + t); const wd = 3 + o.wmax * (.15 * t + .85 * t * t); L.push([cx - wd, y]); R.push([cx + wd, y]); C.push([cx, y, wd]); }
  const p = paint(o.fill);
  const d = 'M' + L.map(q => f(q[0]) + ',' + f(q[1])).join(' L') + ' L' + R.reverse().map(q => f(q[0]) + ',' + f(q[1])).join(' L') + ' Z';
  let flows = ''; for (const k of [-.45, 0, .45]) flows += `<path class="flow" d="M${C.map(c => f(c[0] + k * c[2]) + ',' + f(c[1])).join(' L')}" ${stroke(o.line, 2, .7)}/>`;
  return `<g><defs>${p.def}</defs><path filter="url(#paint-s)" d="${d}" ${p.f}/>${flows}</g>`;
}
function tree(x, y, s, c, line) {
  const fo = [[0, -62, 27], [-20, -48, 20], [20, -46, 21], [-6, -84, 18], [10, -74, 16]];
  let o = `<path d="M${f(x - 4 * s)},${y} L${f(x - 2 * s)},${f(y - 50 * s)} L${f(x + 2 * s)},${f(y - 50 * s)} L${f(x + 4 * s)},${y} Z" ${fill(c)}/>`;
  for (const [dx, dy, r] of fo) o += `<circle cx="${f(x + dx * s)}" cy="${f(y + dy * s)}" r="${f(r * s)}" ${fill(c)}/>`;
  o += `<path d="M${f(x - 18 * s)},${f(y - 70 * s)} q${f(10 * s)},${f(-14 * s)} ${f(24 * s)},${f(-10 * s)}" ${stroke(line, 1.6, .7)}/>`;
  return `<g filter="url(#paint-s)">${o}</g>`;
}
function pine(x, y, s, c) {
  let o = `<rect x="${f(x - 3 * s)}" y="${f(y - 12 * s)}" width="${f(6 * s)}" height="${f(12 * s)}" ${fill(c)}/>`;
  for (let k = 0; k < 3; k++) { const by = y - 10 * s - k * 20 * s, hw = (22 - k * 5) * s; o += `<path d="M${f(x - hw)},${f(by)} L${x},${f(by - 34 * s)} L${f(x + hw)},${f(by)} Z" ${fill(c)}/>`; }
  return `<g filter="url(#paint-s)">${o}</g>`;
}
function house(x, y, s, wall, roof) {
  return `<g filter="url(#paint-s)"><rect x="${f(x - 16 * s)}" y="${f(y - 26 * s)}" width="${f(32 * s)}" height="${f(28 * s)}" ${fill(wall)}/><path d="M${f(x - 21 * s)},${f(y - 24 * s)} L${x},${f(y - 44 * s)} L${f(x + 21 * s)},${f(y - 24 * s)} Z" ${fill(roof)}/><rect x="${f(x - 5 * s)}" y="${f(y - 17 * s)}" width="${f(10 * s)}" height="${f(9 * s)}" rx="${f(2 * s)}" ${fill(roof)} opacity=".7"/></g>`;
}
function pendopo(x, y, s, wall, roof) {
  let posts = ''; for (const dx of [-48, -17, 17, 48]) posts += `<rect x="${f(x + dx * s - 3 * s)}" y="${f(y - 70 * s)}" width="${f(6 * s)}" height="${f(58 * s)}" ${fill(wall)}/>`;
  return `<g filter="url(#paint)"><rect x="${f(x - 64 * s)}" y="${f(y - 14 * s)}" width="${f(128 * s)}" height="${f(16 * s)}" rx="${f(3 * s)}" ${fill(wall)}/>${posts}<path d="M${f(x - 82 * s)},${f(y - 64 * s)} Q${x},${f(y - 84 * s)} ${f(x + 82 * s)},${f(y - 64 * s)} L${f(x + 48 * s)},${f(y - 96 * s)} L${f(x - 48 * s)},${f(y - 96 * s)} Z" ${fill(roof)}/><path d="M${f(x - 54 * s)},${f(y - 94 * s)} Q${x},${f(y - 110 * s)} ${f(x + 54 * s)},${f(y - 94 * s)} L${f(x + 15 * s)},${f(y - 130 * s)} L${f(x - 15 * s)},${f(y - 130 * s)} Z" ${fill(roof)}/><circle cx="${x}" cy="${f(y - 135 * s)}" r="${f(5 * s)}" ${fill(roof)}/></g>`;
}
function pond(cx, cy, rx, ry, c, line) {
  const p = paint(c);
  return `<g><defs>${p.def}</defs><ellipse filter="url(#paint-s)" cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" ${p.f}/><ellipse cx="${cx}" cy="${cy}" rx="${f(rx * .66)}" ry="${f(ry * .5)}" ${stroke(line, 1.6, .7)}/><ellipse cx="${cx}" cy="${cy}" rx="${f(rx * .34)}" ry="${f(ry * .25)}" ${stroke(line, 1.4, .6)}/></g>`;
}
function waves(o) {
  const len = o.len || 60; let d = `M-80,${o.y}`; for (let x = -80; x < o.w + 80; x += len) d += ` q${len / 2},${-o.amp} ${len},0`;
  const p = paint(o.fill);
  let lines = ''; for (let k = 1; k <= 3; k++) { let dl = `M-80,${o.y + k * 14}`; for (let x = -80; x < o.w + 80; x += len) dl += ` q${len / 2},${-o.amp * .8} ${len},0`; lines += `<path d="${dl}" ${stroke(o.line, 1.6, (.75 - k * .18).toFixed(2))}/>`; }
  return `<g><defs>${p.def}</defs><path filter="url(#paint)" d="${d} L${o.w + 80},${o.h + 60} L-80,${o.h + 60} Z" ${p.f}/>${lines}</g>`;
}
function alps(o) {
  const q = o.pts, p = paint(o.fill);
  const d = 'M' + q.map(a => a.join(',')).join(' L') + ` L${q[q.length - 1][0]},${o.h + 60} L${q[0][0]},${o.h + 60} Z`;
  let caps = '', lines = '';
  for (let i = 1; i < q.length - 1; i++) {
    if (!(q[i][1] < q[i - 1][1] && q[i][1] < q[i + 1][1])) continue;
    const a = q[i], L = q[i - 1], R = q[i + 1], k = .3, l = [a[0] + (L[0] - a[0]) * k, a[1] + (L[1] - a[1]) * k], rr = [a[0] + (R[0] - a[0]) * k, a[1] + (R[1] - a[1]) * k];
    const m1 = [l[0] + (rr[0] - l[0]) * .33, l[1] - 6], m2 = [l[0] + (rr[0] - l[0]) * .66, rr[1] + 8];
    caps += `<path d="M${l} L${a} L${rr} L${m2} L${m1} Z" ${fill(o.snow)}/>`;
    lines += `<path d="M${a} L${f(a[0] + 10)},${o.base}" ${stroke(o.line, 1.5, .5)}/>`;
  }
  return `<g><defs>${p.def}</defs><path filter="url(#paint-l)" d="${d}" ${p.f}/>${lines}<g filter="url(#paint-s)">${caps}</g></g>`;
}
function eiffel(x, y, H, c, line) {
  const E = [[-.21, 0], [-.15, -.12], [-.12, -.21], [-.14, -.21], [-.14, -.235], [-.092, -.235], [-.068, -.4], [-.082, -.4], [-.082, -.42], [-.05, -.42], [-.028, -.66], [-.04, -.66], [-.04, -.68], [-.02, -.68], [-.008, -.93], [-.003, -1]];
  const full = [...E, ...E.slice().reverse().map(p => [-p[0], p[1]])];
  const d = 'M' + full.map(p => f(x + p[0] * H) + ',' + f(y + p[1] * H)).join(' L') + ` Z M${f(x - .15 * H)},${y} Q${x},${f(y - .24 * H)} ${f(x + .15 * H)},${y} Z`;
  return `<g filter="url(#paint)"><path d="${d}" ${fill(c)} fill-rule="evenodd"/><path d="M${f(x - .09 * H)},${f(y - .235 * H)} L${f(x + .068 * H)},${f(y - .4 * H)} M${f(x + .09 * H)},${f(y - .235 * H)} L${f(x - .068 * H)},${f(y - .4 * H)}" ${stroke(line, 1.4, .6)}/></g>`;
}
function city(o) {
  const r = rng(o.seed || 5); let x = o.x0 ?? -20, c = '', win = '';
  while (x < (o.x1 ?? o.w + 20)) { const bw = 30 + r() * 40, bh = 60 + r() * (o.hmax || 120), top = o.y - bh;
    c += `<path d="M${f(x)},${o.y + 120} L${f(x)},${f(top + 12)} L${f(x + 7)},${f(top)} L${f(x + bw - 7)},${f(top)} L${f(x + bw)},${f(top + 12)} L${f(x + bw)},${o.y + 120} Z" ${fill(o.fill)}/>`;
    for (let wy = top + 20; wy < o.y - 8; wy += 16) for (let wx = x + 7; wx < x + bw - 9; wx += 12) if (r() > .55) win += `M${f(wx)} ${f(wy)}h5v7h-5z`;
    x += bw + 2; }
  return `<g filter="url(#paint)">${c}<path d="${win}" ${fill(o.win)} opacity=".85"/></g>`;
}
function palm(x, y, s, c) {
  const tx = x + 26 * s, ty = y - 118 * s; let fr = '';
  for (const [dx, dy] of [[-62, 14], [-48, 36], [60, 10], [46, 36], [-24, -28], [26, -26], [2, -34]]) fr += `<path d="M${f(tx)},${f(ty)} Q${f(tx + dx * .5 * s)},${f(ty + dy * .5 * s - 16 * s)} ${f(tx + dx * s)},${f(ty + dy * s)}" ${stroke(c, 7 * s)}/>`;
  return `<g filter="url(#paint-s)"><path d="M${x},${y} Q${f(x + 6 * s)},${f(y - 64 * s)} ${f(tx)},${f(ty)}" ${stroke(c, 8 * s)}/>${fr}</g>`;
}
function birds(x, y, s, c) { return `<path d="M${x},${y} q${6 * s},${-6 * s} ${12 * s},0 q${6 * s},${-6 * s} ${12 * s},0 M${x + 34 * s},${y - 16 * s} q${4 * s},${-4 * s} ${8 * s},0 q${4 * s},${-4 * s} ${8 * s},0" ${stroke(c, 2, .8)}/>`; }

/* ---------- scenes (1200 x 1000; key subject inside x 380-820, y 330-1000) ---------- */
const W = 1200, H = 1000;
const T = k => v(`${k}`);
function skyDefs(id, a, b) { return `<defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:${a}"/><stop offset="1" style="stop-color:${b}"/></linearGradient></defs><rect width="${W}" height="${H}" style="fill:url(#${id})"/>`; }

const SCENES = {
  senja(p) {
    const h1 = ridge({ w: W, h: H, y: 640, amp: 26, seed: 2, f: 2.2, fill: [T('t1-h1'), T('t1-h1d')], line: T('t1-line'), lines: 2 });
    const h2 = ridge({ w: W, h: H, y: 720, amp: 28, seed: 5, f: 1.7, fill: [T('t1-h2'), T('t1-h2d')], line: T('t1-line'), lines: 3, sh: 'paint-l' });
    const m1 = ridge({ w: W, h: H, y: 880, amp: 20, seed: 3, x0: -120, x1: 560, mound: true, fill: [T('t1-h3'), T('t1-h3d')], line: T('t1-line'), lines: 2, sh: 'paint-l' });
    const m2 = ridge({ w: W, h: H, y: 890, amp: 20, seed: 8, x0: 640, x1: 1320, mound: true, fill: [T('t1-h3'), T('t1-h3d')], line: T('t1-line'), lines: 2, sh: 'paint-l' });
    return skyDefs(p + 'sky', T('t1-sky1'), T('t1-sky2')) + sun(810, 500, 100, T('t1-sun'), T('t1-glow'), T('t1-ring'))
      + `<g class="drift">${cloud(330, 390, 1, T('t1-cloud'), T('t1-cline'))}${cloud(900, 330, 1.2, T('t1-cloud'), T('t1-cline'))}${birds(700, 380, 1.4, T('t1-cline'))}</g>`
      + h1.svg + h2.svg + pendopo(600, h2.yAt(600) + 6, 1.15, T('t1-wall'), T('t1-roof'))
      + pond(600, 840, 190, 34, [T('t1-pond'), T('t1-pondd')], T('t1-line')) + m1.svg + m2.svg
      + tree(420, 960, 1.3, T('t1-tree'), T('t1-treel')) + tree(320, 950, 1.6, T('t1-tree'), T('t1-treel')) + tree(800, 965, 1.4, T('t1-tree'), T('t1-treel')) + tree(900, 950, 1.7, T('t1-tree'), T('t1-treel'));
  },
  fuji(p) {
    const h1 = ridge({ w: W, h: H, y: 740, amp: 20, seed: 1, f: 2.2, fill: [T('t2-h1'), T('t2-h1d')], line: T('t2-line'), lines: 3, sh: 'paint-l' });
    const h2 = ridge({ w: W, h: H, y: 820, amp: 22, seed: 6, f: 1.6, fill: [T('t2-h2'), T('t2-h2d')], line: T('t2-line'), lines: 3, sh: 'paint-l' });
    const m1 = ridge({ w: W, h: H, y: 930, amp: 16, seed: 4, x0: -120, x1: 540, mound: true, fill: [T('t2-h3'), T('t2-h3d')], line: T('t2-line'), lines: 2, sh: 'paint-l' });
    const m2 = ridge({ w: W, h: H, y: 935, amp: 16, seed: 9, x0: 690, x1: 1320, mound: true, fill: [T('t2-h3'), T('t2-h3d')], line: T('t2-line'), lines: 2, sh: 'paint-l' });
    return skyDefs(p + 'sky', T('t2-sky1'), T('t2-sky2')) + sun(680, 470, 130, T('t2-sun'), T('t2-glow'), T('t2-ring'))
      + `<g class="drift">${cloud(300, 380, 1.1, T('t2-cloud'), T('t2-cline'))}${cloud(940, 420, 1, T('t2-cloud'), T('t2-cline'))}</g>`
      + fuji({ cx: 600, b: 760, py: 420, W: 900, fill: [T('t2-fuji'), T('t2-fujid')], snow: T('t2-snow'), line: T('t2-fujil') })
      + cloud(820, 720, 1.2, T('t2-cloud'), T('t2-cline')) + cloud(380, 735, 1, T('t2-cloud'), T('t2-cline'))
      + h1.svg + h2.svg + river({ x0: 610, y0: h2.yAt(610) + 3, x1: 560, h: H, sw: 40, wmax: 90, fill: [T('t2-river'), T('t2-riverd')], line: T('t2-line') })
      + m1.svg + m2.svg + tree(420, 985, 1.3, T('t2-tree'), T('t2-treel')) + tree(340, 975, 1.6, T('t2-tree'), T('t2-treel')) + tree(800, 990, 1.5, T('t2-tree'), T('t2-treel'));
  },
  paris(p) {
    const b1 = ridge({ w: W, h: H, y: 930, amp: 12, seed: 3, x0: -120, x1: 500, mound: true, fill: [T('t3-bank'), T('t3-bankd')], line: T('t3-line'), lines: 2, sh: 'paint-l' });
    const b2 = ridge({ w: W, h: H, y: 940, amp: 12, seed: 7, x0: 720, x1: 1320, mound: true, fill: [T('t3-bank'), T('t3-bankd')], line: T('t3-line'), lines: 2, sh: 'paint-l' });
    const quay = ridge({ w: W, h: H, y: 840, amp: 6, seed: 2, fill: [T('t3-city'), T('t3-cityd')], line: T('t3-line'), lines: 1 });
    return skyDefs(p + 'sky', T('t3-sky1'), T('t3-sky2')) + sun(740, 440, 86, T('t3-moon'), T('t3-glow'), T('t3-ring'), true)
      + `<g class="drift">${cloud(330, 470, 1, T('t3-cloud'), T('t3-cline'))}${cloud(930, 560, .9, T('t3-cloud'), T('t3-cline'))}</g>`
      + city({ y: 790, w: W, fill: T('t3-city'), win: T('t3-win'), seed: 8, hmax: 100 })
      + eiffel(600, 850, 520, T('t3-eiffel'), T('t3-eiffl')) + quay.svg
      + river({ x0: 600, y0: 845, x1: 620, h: H, sw: 20, wmax: 150, fill: [T('t3-river'), T('t3-riverd')], line: T('t3-rline') }) + b1.svg + b2.svg;
  },
  alpen(p) {
    const lake = ridge({ w: W, h: H, y: 790, amp: 4, seed: 1, fill: [T('t4-lake'), T('t4-laked')], line: T('t4-line'), lines: 3, gap: 11, sh: 'paint-s' });
    const meadow = ridge({ w: W, h: H, y: 850, amp: 20, seed: 5, fill: [T('t4-meadow'), T('t4-meadowd')], line: T('t4-line'), lines: 3 });
    const fg = ridge({ w: W, h: H, y: 950, amp: 16, seed: 2, fill: [T('t4-fg'), T('t4-fgd')], line: T('t4-line'), lines: 2, sh: 'paint-l' });
    return skyDefs(p + 'sky', T('t4-sky1'), T('t4-sky2')) + sun(760, 420, 70, T('t4-sun'), T('t4-glow'), T('t4-ring'))
      + `<g class="drift">${cloud(320, 380, .9, T('t4-cloud'), T('t4-cline'))}</g>`
      + alps({ h: H, base: 720, fill: [T('t4-alp1'), T('t4-alp1d')], snow: T('t4-snow'), line: T('t4-line'), pts: [[-80, 720], [140, 560], [300, 640], [470, 470], [620, 610], [760, 500], [930, 640], [1080, 540], [1280, 720]] })
      + alps({ h: H, base: 780, fill: [T('t4-alp2'), T('t4-alp2d')], snow: T('t4-snow'), line: T('t4-line'), pts: [[-80, 780], [200, 640], [400, 730], [560, 610], [720, 740], [880, 650], [1060, 760], [1280, 780]] })
      + lake.svg + meadow.svg + [480, 540, 600, 660, 720].map((x, i) => house(x, meadow.yAt(x) + 12, 1.2 + (i % 2) * .2, T('t4-wall'), T('t4-roof'))).join('')
      + pine(420, meadow.yAt(420) + 14, 1.1, T('t4-pine')) + pine(790, meadow.yAt(790) + 14, 1.2, T('t4-pine'))
      + fg.svg + pine(400, 1000, 1.6, T('t4-pine')) + pine(820, 1005, 1.7, T('t4-pine'));
  },
  pantai(p) {
    const sand = ridge({ w: W, h: H, y: 920, amp: 18, seed: 4, fill: [T('t5-sand'), T('t5-sandd')], line: T('t5-sline'), lines: 3, sh: 'paint-l' });
    let refl = ''; for (let i = 0; i < 6; i++) refl += `<rect x="${f(600 - (80 - i * 10))}" y="${700 + i * 30}" width="${f(2 * (80 - i * 10))}" height="5" rx="2.5" ${fill(T('t5-moon'))} opacity="${(.6 - i * .08).toFixed(2)}"/>`;
    return skyDefs(p + 'sky', T('t5-sky1'), T('t5-sky2')) + sun(600, 640, 150, T('t5-moon'), T('t5-glow'), T('t5-ring'), true)
      + `<g class="drift">${cloud(320, 420, 1, T('t5-cloud'), T('t5-cline'))}${cloud(900, 380, 1.1, T('t5-cloud'), T('t5-cline'))}</g>`
      + waves({ y: 680, w: W, h: H, amp: 12, len: 60, fill: [T('t5-w1'), T('t5-w1d')], line: T('t5-wline') }) + refl
      + waves({ y: 760, w: W, h: H, amp: 14, len: 80, fill: [T('t5-w2'), T('t5-w2d')], line: T('t5-wline') })
      + waves({ y: 840, w: W, h: H, amp: 14, len: 100, fill: [T('t5-w3'), T('t5-w3d')], line: T('t5-wline') })
      + sand.svg + palm(380, 985, 1.5, T('t5-palm')) + palm(780, 975, 1.7, T('t5-palm')) + palm(850, 1000, 1.1, T('t5-palm'));
  }
};
const svg = (inner, cls = '', par = 'xMidYMax slice', vb = `0 0 ${W} ${H}`) => `<svg class="${cls}" viewBox="${vb}" preserveAspectRatio="${par}" aria-hidden="true" focusable="false">${inner}</svg>`;

/* ---------- template data ---------- */
const TPL = [
  { key: 'senja', n: 1, name: 'Taman Senja', line: 'Pendopo, kolam, matahari sore.', couple: 'Laras & Bima', date: 'Sabtu, 12 Juli 2027' },
  { key: 'fuji', n: 2, name: 'Fuji Hanami', line: 'Fuji, sakura, sungai biru.', couple: 'Sekar & Daniel', date: 'Minggu, 3 Oktober 2027' },
  { key: 'paris', n: 3, name: 'Paris Lumière', line: 'Eiffel dan Seine di bawah bulan.', couple: 'Nadia & Rendra', date: 'Jumat, 14 Februari 2028' },
  { key: 'alpen', n: 4, name: 'Alpen Kecil', line: 'Puncak salju, danau, desa.', couple: 'Ayu & Kenzo', date: 'Sabtu, 21 Agustus 2027' },
  { key: 'pantai', n: 5, name: 'Pantai Bulan', line: 'Bulan terbit di atas ombak.', couple: 'Putri & Arya', date: 'Rabu, 9 Desember 2027' },
];

/* ---------- services band (night) & closing scenes ---------- */
function bandScene() {
  const BW = 1600, BH = 900;
  const a = ridge({ w: BW, h: BH, y: 560, amp: 34, seed: 2.4, f: 2.2, fill: [v('b-h1'), v('b-h1d')], line: v('b-line'), lines: 3 });
  const b = ridge({ w: BW, h: BH, y: 650, amp: 30, seed: 5.2, f: 1.7, fill: [v('b-h2'), v('b-h2d')], line: v('b-line'), lines: 3, sh: 'paint-l' });
  const c = ridge({ w: BW, h: BH, y: 760, amp: 24, seed: 8.1, f: 2, fill: [v('b-h3'), v('b-h3d')], line: v('b-line'), lines: 2, sh: 'paint-l' });
  let refl = ''; for (let i = 0; i < 7; i++) refl += `<rect x="${1180 - (70 - i * 8)}" y="${f(c.yAt(1180) + 30 + i * 18)}" width="${2 * (70 - i * 8)}" height="4" rx="2" ${fill(v('b-moon'))} opacity="${(.55 - i * .07).toFixed(2)}"/>`;
  return svg(`<defs><linearGradient id="bsky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:var(--b-sky1)"/><stop offset="1" style="stop-color:var(--b-sky2)"/></linearGradient></defs><rect width="${BW}" height="${BH}" style="fill:url(#bsky)"/>`
    + sun(1180, 300, 90, v('b-moon'), v('b-glow'), v('b-ring'), true) + cloud(300, 220, 1.2, v('b-cloud'), v('b-cline')) + cloud(1400, 380, 1, v('b-cloud'), v('b-cline'))
    + a.svg + [300, 350, 400, 455].map((x, i) => house(x, a.yAt(x) + 10, 1 + (i % 2) * .2, v('b-wall'), v('b-roof'))).join('')
    + b.svg + pendopo(820, b.yAt(820) + 6, .9, v('b-wall'), v('b-roof')) + c.svg + refl
    + tree(90, 900, 1.8, v('b-tree'), v('b-treel')) + tree(1530, 900, 1.7, v('b-tree'), v('b-treel')) + pine(1420, 890, 1.3, v('b-tree')),
    'band-art', 'xMidYMid slice', `0 0 ${BW} ${BH}`);
}
function closingScene() {
  const BW = 1600, BH = 700;
  const a = ridge({ w: BW, h: BH, y: 430, amp: 30, seed: 3.3, f: 2.2, fill: [v('s-h1'), v('s-h1d')], line: v('s-line'), lines: 3 });
  const b = ridge({ w: BW, h: BH, y: 520, amp: 30, seed: 6.2, f: 1.7, fill: [v('s-h2'), v('s-h2d')], line: v('s-line'), lines: 3, sh: 'paint-l' });
  const c = ridge({ w: BW, h: BH, y: 610, amp: 20, seed: 8.8, f: 2, fill: [v('s-h3'), v('s-h3d')], line: v('s-line'), lines: 2, sh: 'paint-l' });
  return svg(`<defs><linearGradient id="csky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:var(--s-sky1)"/><stop offset="1" style="stop-color:var(--s-sky2)"/></linearGradient></defs><rect width="${BW}" height="${BH}" style="fill:url(#csky)"/>`
    + sun(800, 330, 110, v('s-sun'), v('s-glow'), v('s-ring')) + cloud(380, 230, 1.2, v('s-cloud'), v('s-cline')) + cloud(1250, 270, 1.1, v('s-cloud'), v('s-cline'))
    + a.svg + b.svg + [560, 610, 1010, 1060].map((x, i) => house(x, b.yAt(x) + 10, 1.1 + (i % 2) * .15, v('s-wall'), v('s-roof'))).join('')
    + pendopo(800, b.yAt(800) + 6, 1, v('s-wall'), v('s-roof')) + c.svg
    + river({ x0: 800, y0: c.yAt(800) + 3, x1: 760, h: BH, sw: 30, wmax: 110, fill: [v('s-river'), v('s-riverd')], line: v('s-rline') })
    + tree(160, 700, 1.7, v('s-tree'), v('s-treel')) + tree(280, 700, 1.2, v('s-tree'), v('s-treel')) + tree(1440, 700, 1.6, v('s-tree'), v('s-treel')),
    'closing-art', 'xMidYMax slice', `0 0 ${BW} ${BH}`);
}

function heroBack() {
  const BW = 1600, BH = 1000;
  const r1 = ridge({ w: BW, h: BH, y: 640, amp: 50, seed: 1.7, f: 2.4, fill: [v('hb-r1'), v('hb-r1d')], line: v('hb-line'), lines: 3, sh: 'paint-s' });
  const r2 = ridge({ w: BW, h: BH, y: 760, amp: 42, seed: 4.4, f: 1.8, fill: [v('hb-r2'), v('hb-r2d')], line: v('hb-line'), lines: 3 });
  const r3 = ridge({ w: BW, h: BH, y: 900, amp: 26, seed: 7.3, f: 2, fill: v('hb-r3'), sh: 'paint-l' });
  return svg(`<defs><linearGradient id="hbsky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:var(--hb-sky1)"/><stop offset=".7" style="stop-color:var(--hb-sky2)"/></linearGradient></defs><rect width="${BW}" height="${BH}" style="fill:url(#hbsky)"/>`
    + `<g class="drift">${cloud(90, 590, .9, v('hb-cloud'), v('hb-cline'))}${cloud(1520, 560, .9, v('hb-cloud'), v('hb-cline'))}</g>`
    + r1.svg + pine(80, r1.yAt(80) + 14, 1.4, v('hb-r1d')) + pine(130, r1.yAt(130) + 14, 1, v('hb-r1d')) + pine(1500, r1.yAt(1500) + 14, 1.3, v('hb-r1d'))
    + r2.svg + tree(60, r2.yAt(60) + 10, 1.6, v('hb-r2d'), v('hb-line')) + tree(1540, r2.yAt(1540) + 10, 1.7, v('hb-r2d'), v('hb-line')) + r3.svg,
    'hero-back', 'xMidYMax slice', `0 0 ${BW} ${BH}`);
}


function backdropOld(kind, seed) {
  const BW = 1600, BH = 1000, rr = rng(Math.round(seed * 100));
  const sky = `<defs><linearGradient id="bk${kind}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:var(--hb-sky1)"/><stop offset=".75" style="stop-color:var(--hb-sky2)"/></linearGradient></defs><rect width="${BW}" height="${BH}" style="fill:url(#bk${kind})"/>`;
  const r1 = ridge({ w: BW, h: BH, y: 740, amp: 46, seed, f: 2.3, fill: [v('hb-r1'), v('hb-r1d')], line: v('hb-line'), lines: 3, sh: 'paint-s' });
  const r2 = ridge({ w: BW, h: BH, y: 840, amp: 36, seed: seed + 2.9, f: 1.7, fill: [v('hb-r2'), v('hb-r2d')], line: v('hb-line'), lines: 3 });
  const r3 = ridge({ w: BW, h: BH, y: 940, amp: 22, seed: seed + 5.3, f: 2, fill: [v('hb-r3'), v('hb-r3')], line: v('hb-line'), lines: 1, sh: 'paint-l' });
  let mid = '', far = '';
  if (kind === 'meadow') { far = sun(1520, 560, 60, v('hb-r1d'), v('hb-r1'), v('hb-line')); mid = tree(1480, r2.yAt(1480) + 10, 1.4, v('hb-r2d'), v('hb-line')) + tree(140, r2.yAt(140) + 10, 1.7, v('hb-r2d'), v('hb-line')) + tree(260, r2.yAt(260) + 10, 1.2, v('hb-r2d'), v('hb-line')); }
  if (kind === 'lake') { far = alps({ h: BH, base: 760, fill: [v('hb-r2'), v('hb-r2d')], snow: v('hb-r3'), line: v('hb-line'), pts: [[-80, 760], [180, 560], [380, 680], [560, 520], [760, 690], [980, 560], [1180, 700], [1400, 540], [1680, 760]] }); mid = pine(120, r1.yAt(120) + 12, 1.5, v('hb-r1d')) + pine(1480, r1.yAt(1480) + 12, 1.6, v('hb-r1d')) + pine(1540, r1.yAt(1540) + 12, 1.1, v('hb-r1d')); }
  if (kind === 'dusk') { far = sun(1500, 560, 64, v('hb-r1d'), v('hb-r1'), v('hb-line')); mid = [1180, 1240, 1300].map((x, i) => house(x, r1.yAt(x) + 10, 1.1 + (i % 2) * .2, v('hb-r3'), v('hb-r1d'))).join(''); }
  if (kind === 'fields') { far = sun(1500, 580, 56, v('hb-r1d'), v('hb-r1'), v('hb-line')); mid = [120, 175, 230].map((x, i) => house(x, r1.yAt(x) + 10, 1 + (i % 2) * .2, v('hb-r3'), v('hb-r1d'))).join('') + tree(1500, r2.yAt(1500) + 10, 1.6, v('hb-r2d'), v('hb-line')); }
  const clouds = `<g class="drift">${cloud(60 + rr() * 40, 620 + rr() * 30, .8, v('hb-cloud'), v('hb-cline'))}${cloud(1540 + rr() * 40, 640 + rr() * 30, .8, v('hb-cloud'), v('hb-cline'))}</g>`;
  return svg(sky + far + clouds + r1.svg + mid + r2.svg + r3.svg, 'art-back', 'xMidYMax slice', `0 0 ${BW} ${BH}`);
}


/* ---------- vista: rich layered valley scene (no filters) ---------- */
const VW = 1600, VH = 1000;
function noise1(seed) { const r = rng(Math.round(seed)), a = Array.from({ length: 256 }, () => r()); return t => { const i = Math.floor(t), fr = t - i, sm = fr * fr * (3 - 2 * fr); return a[i & 255] * (1 - sm) + a[(i + 1) & 255] * sm; }; }
function ridgeLine(o) {
  const n1 = noise1(o.seed * 13 + 1), n = o.n || 110, pts = [], ro = o.rough || 0;
  for (let i = 0; i <= n; i++) { const t = i / n, x = -60 + (VW + 120) * t;
    let h = n1(t * o.f) + .5 * n1(t * o.f * 2.3 + 40) + .25 * n1(t * o.f * 5.1 + 90) + ro * n1(t * o.f * 13 + 140);
    h /= (1.75 + ro); pts.push([x, o.y - o.amp * h * (o.env ? o.env(t) : 1)]); }
  const yAt = x => { const u = (x + 60) / (VW + 120) * n, i = Math.max(0, Math.min(n - 1, Math.floor(u))), fr = u - i; return pts[i][1] * (1 - fr) + pts[i + 1][1] * fr; };
  return { d: 'M' + pts.map(q => f(q[0]) + ',' + f(q[1])).join(' L') + ` L${VW + 60},${VH + 20} L-60,${VH + 20}Z`, yAt };
}
const cub = (P, t) => { const u = 1 - t; return [u * u * u * P[0][0] + 3 * u * u * t * P[1][0] + 3 * u * t * t * P[2][0] + t * t * t * P[3][0], u * u * u * P[0][1] + 3 * u * u * t * P[1][1] + 3 * u * t * t * P[2][1] + t * t * t * P[3][1]]; };
function pineD(x, y, h, r) {
  const m = Math.max(5, Math.round(h / 40)), w0 = h * .25; let base = '', light = '';
  for (let k = 0; k < m; k++) { const u = (k + 1) / m, top = y - h + (k / m) * h * .86, th = h * .86 / m * 1.95, w = w0 * Math.pow(u, .85) * (.88 + r() * .24), by = top + th, z = 6;
    let d = `M${f(x)},${f(top)} L${f(x + w)},${f(by)}`;
    for (let j = 1; j <= z; j++) { const px = x + w - 2 * w * j / z, py = by - (j % 2 ? th * .3 : 0) + (r() - .5) * th * .1; d += ` L${f(px)},${f(j === z ? by : py)}`; }
    base += d + 'Z';
    light += `M${f(x)},${f(top + th * .12)} L${f(x - w * .84)},${f(by - th * .08)} L${f(x - w * .5)},${f(by - th * .36)} L${f(x - w * .22)},${f(by - th * .12)} L${f(x)},${f(by - th * .32)}Z`; }
  return { base, light, trunk: `M${f(x - h * .013)},${f(y - h * .1)}h${f(h * .026)}v${f(h * .1)}h${f(-h * .026)}z` };
}
function vistaSym(o) {
  const id = o.id, r = rng(o.seed * 31 + 7), V = k => `var(--v-${k})`, sx = o.sunX || 800;
  const lg = (k, y1, y2, c1, c2) => `<linearGradient id="${id}${k}" gradientUnits="userSpaceOnUse" x1="0" y1="${y1}" x2="0" y2="${y2}"><stop offset="0" style="stop-color:${c1}"/><stop offset="1" style="stop-color:${c2}"/></linearGradient>`;
  const u = k => `style="fill:url(#${id}${k})"`;
  const env = t => .22 + .78 * Math.pow(Math.abs(2 * t - 1), 1.25);
  const m1 = ridgeLine({ seed: o.seed + 1, y: 605, amp: 310, f: 6, rough: .5 }), m2 = ridgeLine({ seed: o.seed + 2, y: 618, amp: 235, f: 8, rough: .6 }), m3 = ridgeLine({ seed: o.seed + 3, y: 632, amp: 175, f: 10, rough: .5 });
  const v1 = ridgeLine({ seed: o.seed + 4, y: 644, amp: 165, f: 5, env });
  let defs = `<linearGradient id="${id}sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:${V('sky1')}"/><stop offset=".42" style="stop-color:${V('sky2')}"/><stop offset=".62" style="stop-color:${V('sky3')}"/></linearGradient>`
    + `<radialGradient id="${id}glow"><stop offset="0" style="stop-color:${V('glow')};stop-opacity:.95"/><stop offset="1" style="stop-color:${V('glow')};stop-opacity:0"/></radialGradient>`
    + `<radialGradient id="${id}ag"><stop offset="0" style="stop-color:${V('archglow')};stop-opacity:.9"/><stop offset="1" style="stop-color:${V('archglow')};stop-opacity:0"/></radialGradient>`
    + `<linearGradient id="${id}mist" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:${V('haze')};stop-opacity:0"/><stop offset=".55" style="stop-color:${V('haze')};stop-opacity:.85"/><stop offset="1" style="stop-color:${V('haze')};stop-opacity:0"/></linearGradient>`
    + lg('m1', 300, 630, V('m1'), V('haze')) + lg('m2', 390, 650, V('m2'), V('haze')) + lg('m3', 460, 670, V('m3'), V('haze'))
    + lg('v1', 500, 700, V('b1'), V('b1b')) + lg('w', 626, 1000, V('w1'), V('w2'))
    + lg('b1', 610, 730, V('b1'), V('b1b')) + lg('b2', 690, 910, V('b2'), V('b2b')) + lg('fg', 830, 1010, V('g1'), V('g2'));
  let far = '';
  for (let i = 0; i < 130; i++) { const x = r() * VW; if (Math.abs(x - 800) < 150) continue; const y = v1.yAt(x) + 2 + r() * 26, h = 24 + r() * 30, w = h * .2; far += `M${f(x)},${f(y - h)}l${f(w)},${f(h)}h${f(-2 * w)}z`; }
  const banks = [
    { P: [[-40, 640], [200, 610], [480, 620], [640, 652]], back: 'C560,694 300,702 -40,722Z', g: 'b1', n: 15, hs: [64, 60], tone: 'p2' },
    { P: [[1640, 640], [1400, 614], [1150, 620], [980, 656]], back: 'C1080,700 1350,706 1640,726Z', g: 'b1', n: 15, hs: [64, 60], tone: 'p2' },
    { P: [[-40, 722], [250, 690], [560, 730], [720, 802]], back: 'C600,862 300,884 -40,902Z', g: 'b2', n: 11, hs: [120, 100], tone: 'p3' },
    { P: [[1640, 742], [1380, 700], [1180, 740], [1060, 822]], back: 'C1180,882 1400,902 1640,912Z', g: 'b2', n: 11, hs: [120, 100], tone: 'p3' },
  ];
  let bankSvg = '';
  banks.forEach((b, bi) => { const P = b.P; let ba = '', li = '', tr = '';
    const ts = Array.from({ length: b.n }, () => .04 + r() * .8).sort((a, c) => a - c);
    for (const t of ts) { const q = cub(P, t), t3 = pineD(q[0], q[1] + 6 + r() * 10, b.hs[0] + r() * b.hs[1], r); ba += t3.base; li += t3.light; tr += t3.trunk; }
    const shape = `<path d="M${P[0]} C${P[1]} ${P[2]} ${P[3]} ${b.back}" ${u(b.g)}/>`;
    bankSvg += shape + `<path d="${tr}" style="fill:${V('tr')}"/><path d="${ba}" style="fill:${V(b.tone)}"/><path d="${li}" style="fill:${V('pl')};opacity:${bi < 2 ? .35 : .5}"/>`;
    if (bi === 1) bankSvg += `<rect x="-60" y="650" width="${VW + 120}" height="120" style="fill:url(#${id}mist);opacity:.45"/>`; });
  const FL = [[-40, 850], [300, 830], [520, 920], [640, 1010]], FR = [[1640, 860], [1350, 840], [1150, 930], [1000, 1010]];
  let gb = '', gl = '', gt = '';
  for (const [x, y, h] of [[70, 965, 580], [200, 935, 440], [320, 915, 330], [1535, 965, 560], [1410, 940, 450], [1295, 918, 320]]) { const t3 = pineD(x + (r() - .5) * 30, y, h * (.92 + r() * .16), r); gb += t3.base; gl += t3.light; gt += t3.trunk; }
  const blades = ['', '', '']; let flowers = '', flowers2 = '';
  [FL, FR].forEach(P => { for (let i = 0; i < 330; i++) { const t = r(), q = cub(P, t), inside = i >= 170, x = q[0] + (r() - .5) * 8, y = inside ? q[1] + r() * (VH - q[1]) : q[1] + 5, h = 14 + r() * 24, dx = (r() - .5) * 16;
      blades[i % 3] += `M${f(x)},${f(y)}q${f(dx * .3)},${f(-h * .6)} ${f(dx)},${f(-h)}`;
      if (inside && i % 6 === 0) { const c = `M${f(x)},${f(y - h)}m-3.2,0a3.2,3.2 0 1,0 6.4,0a3.2,3.2 0 1,0 -6.4,0`; if (i % 12 === 0) flowers += c; else flowers2 += c; } } });
  let streaks = ''; for (let i = 0; i < 16; i++) { const y = 640 + r() * 330, x = 620 + r() * 420, w = 30 + r() * 90; streaks += `M${f(x)},${f(y)}h${f(w)}`; }
  const island = !o.island ? '' : `<circle cx="800" cy="668" r="120" style="fill:url(#${id}ag)"/>`
    + `<g opacity=".28" transform="translate(0,1436) scale(1,-1)"><path d="M768,716V664a32,32 0 0 1 64,0V716Z M781,716V666a19,19 0 0 1 38,0V716Z" fill-rule="evenodd" style="fill:${V('arch')}"/></g>`
    + `<path d="M690,722 C720,702 880,702 910,722 C880,734 720,734 690,722Z" style="fill:${V('isle')}"/>`
    + `<path d="M758,718h84v6h-84z" style="fill:${V('archsh')}"/><path d="M768,718V664a32,32 0 0 1 64,0V718Z M781,718V666a19,19 0 0 1 38,0V718Z" fill-rule="evenodd" style="fill:${V('arch')}"/>`
    + `<path d="M705,720q4,-14 8,0 M722,716q5,-18 9,0 M868,716q5,-18 9,0 M886,720q4,-13 8,0" style="fill:none;stroke:${V('p2')};stroke-width:3;stroke-linecap:round"/>`;
  const body = `<rect width="${VW}" height="${VH}" style="fill:url(#${id}sky)"/>`
    + `<circle cx="${sx}" cy="590" r="430" style="fill:url(#${id}glow)"/><circle cx="${sx}" cy="560" r="44" style="fill:${V('sun')}"/>`
    + `<path d="${m1.d}" ${u('m1')}/><path d="${m2.d}" ${u('m2')}/><rect x="-60" y="500" width="${VW + 120}" height="150" style="fill:url(#${id}mist);opacity:.7"/><path d="${m3.d}" ${u('m3')}/>`
    + `<rect x="-60" y="560" width="${VW + 120}" height="130" style="fill:url(#${id}mist)"/>`
    + `<path d="${v1.d}" ${u('v1')}/><path d="${far}" style="fill:${V('p1')}"/>`
    + `<rect x="-60" y="626" width="${VW + 120}" height="400" ${u('w')}/><ellipse cx="${sx}" cy="650" rx="300" ry="70" style="fill:url(#${id}glow);opacity:.6"/>`
    + `<path d="${streaks}" style="fill:none;stroke:${V('whi')};stroke-width:2;stroke-linecap:round;opacity:.55"/>`
    + island + bankSvg
    + `<path d="M${FL[0]} C${FL[1]} ${FL[2]} ${FL[3]} L-40,1010Z" ${u('fg')}/><path d="M${FR[0]} C${FR[1]} ${FR[2]} ${FR[3]} L1640,1010Z" ${u('fg')}/>`
    + `<path d="${gt}" style="fill:${V('tr')}"/><path d="${gb}" style="fill:${V('p3')}"/><path d="${gl}" style="fill:${V('pl')};opacity:.38"/>`
    + blades.map((d, i) => `<path d="${d}" style="fill:none;stroke:${V('gr' + (i + 1))};stroke-width:2.4;stroke-linecap:round"/>`).join('')
    + `<path d="${flowers}" style="fill:${V('fl1')}"/><path d="${flowers2}" style="fill:${V('fl2')}"/>`;
  return `<symbol id="${id}" viewBox="0 0 ${VW} ${VH}"><defs>${defs}</defs>${body}</symbol>`;
}
const VSYM = vistaSym({ id: 'vsA', seed: 3, island: true }) + vistaSym({ id: 'vsB', seed: 11, sunX: 520 });
function vista(o) { return svg(`<use href="#${o.sym || 'vsB'}" width="${VW}" height="${VH}"${o.flip ? ` transform="translate(${VW},0) scale(-1,1)"` : ''}/>`, o.cls || '', o.par || 'xMidYMax slice', `0 0 ${VW} ${VH}`); }
function backdrop(kind, seed) { return vista({ sym: 'vsB', cls: 'art-back quiet', flip: Math.round(seed) % 2 === 0, par: ({ meadow: 'xMinYMax slice', lake: 'xMaxYMax slice' })[kind] }); }

/* ---------- logo pack (flattened marble) ---------- */
let lg = 0;
function marble(id, W2, H2, seed) {
  const r = rng(seed); let bands = '';
  const pal = ['logo-2', 'logo-3', 'logo-4', 'logo-5', 'logo-6'];
  for (let i = 0; i < 20; i++) bands += `<ellipse cx="${f(r() * W2)}" cy="${f(r() * H2)}" rx="${f(W2 * (.12 + r() * .26))}" ry="${f(H2 * (.1 + r() * .24))}" ${fill(v(pal[Math.floor(r() * pal.length)]))} opacity="${(.75 + r() * .25).toFixed(2)}" transform="rotate(${f(-30 + r() * 60)} ${f(W2 / 2)} ${f(H2 / 2)})"/>`;
  return `<g filter="url(#mb${id})"><rect x="-40" y="-40" width="${W2 + 80}" height="${H2 + 80}" ${fill(v('logo-1'))}/>${bands}</g>`;
}
function logoDefs(id, fs, W2, H2, seed) {
  return `<filter id="mb${id}" x="-30%" y="-30%" width="160%" height="160%"><feTurbulence type="fractalNoise" baseFrequency=".007 .02" numOctaves="3" seed="${seed}" result="t"/><feDisplacementMap in="SourceGraphic" in2="t" scale="${f(fs * .9)}" xChannelSelector="R" yChannelSelector="B"/></filter>
  <filter id="gl${id}" x="-10%" y="-20%" width="120%" height="150%" color-interpolation-filters="sRGB">
    <feGaussianBlur in="SourceAlpha" stdDeviation="${f(fs * .025)}" result="b"/>
    <feSpecularLighting in="b" surfaceScale="${f(fs * .018)}" specularConstant=".55" specularExponent="18" result="s" style="lighting-color:var(--logo-light)"><feDistantLight azimuth="235" elevation="52"/></feSpecularLighting>
    <feComposite in="s" in2="SourceAlpha" operator="in" result="s2"/>
    <feComposite in="SourceGraphic" in2="s2" operator="arithmetic" k1="0" k2="1" k3=".55" k4="0" result="lit"/>
    <feOffset in="SourceAlpha" dy="${f(fs * .022)}" result="ex"/><feFlood style="flood-color:var(--logo-edge)" flood-opacity=".5"/><feComposite in2="ex" operator="in" result="ext"/>
    <feMerge><feMergeNode in="ext"/><feMergeNode in="lit"/></feMerge>
  </filter>`;
}
// kind: 'word' | 'mark' | 'lockup'
function logo(kind, h = 40, seed = 7, label = 'Nawala') {
  const id = 'lg' + (lg++); const fs = 100;
  const markW = 92, markH = 112, wordW = 360, gap = 26;
  const Wt = kind === 'mark' ? markW : kind === 'word' ? wordW : markW + gap + wordW, Ht = 132;
  const archPath = (x, y, w, hh) => `M${x},${y + hh} L${x},${y + w / 2} A${w / 2},${w / 2} 0 0 1 ${x + w},${y + w / 2} L${x + w},${y + hh} Z`;
  let mask = '';
  if (kind !== 'word') mask += `<path d="${archPath(0, 10, markW, markH)}" style="fill:var(--logo-mask)"/><circle cx="${markW / 2}" cy="${10 + markH * .58}" r="${markW * .2}" style="fill:var(--logo-cut)"/><rect x="${markW * .14}" y="${10 + markH * .78}" width="${markW * .72}" height="${markH * .07}" rx="3" style="fill:var(--logo-cut)"/>`;
  if (kind !== 'mark') mask += `<text x="${kind === 'lockup' ? markW + gap : 0}" y="${10 + markH - 4}" style="fill:var(--logo-mask);font-family:var(--font-outlier);font-weight:800;font-size:${fs * 1.18}px" textLength="${wordW - 8}" lengthAdjust="spacingAndGlyphs">nawala</text>`;
  return `<svg class="logo logo-${kind}" viewBox="0 0 ${Wt} ${Ht}" style="height:${h}px" role="img" aria-label="${label}"><defs>${logoDefs(id, fs, Wt, Ht, seed)}<mask id="mk${id}" maskUnits="userSpaceOnUse" x="0" y="0" width="${Wt}" height="${Ht}">${mask}</mask></defs><g filter="url(#gl${id})"><g mask="url(#mk${id})">${marble(id, Wt, Ht, seed)}</g></g></svg>`;
}

/* ---------- icons (authored, one stroke weight) ---------- */
const ico = d => `<svg class="ico" viewBox="0 0 24 24" aria-hidden="true">${d}</svg>`;
const I = {
  sun: ico('<circle cx="12" cy="12" r="4.2"/><path d="M12 2.5v2M12 19.5v2M4.6 4.6 6 6M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4 6 18M18 6l1.4-1.4"/>'),
  moon: ico('<path d="M19.5 14.2A7.8 7.8 0 0 1 9.8 4.5a7.8 7.8 0 1 0 9.7 9.7Z"/>'),
  check: ico('<path d="m5 12.5 4.2 4.2L19 7"/>'),
  dash: ico('<path d="M7 12h10"/>'),
  plus: ico('<path d="M12 5v14M5 12h14"/>'),
};
const QR = (() => { const r = rng(42); let c = ''; for (let y = 0; y < 13; y++) for (let x = 0; x < 13; x++) { const corner = (x < 4 && y < 4) || (x > 8 && y < 4) || (x < 4 && y > 8); if (corner) continue; if (r() > .5) c += `M${x * 4} ${y * 4}h4v4h-4z`; } const eye = (x, y) => `<rect x="${x}" y="${y}" width="14" height="14" rx="2" class="qr-o"/><rect x="${x + 4}" y="${y + 4}" width="6" height="6" rx="1"/>`; return `<svg class="qr" viewBox="-2 -2 56 56" aria-hidden="true"><path d="${c}"/>${eye(0, 0)}${eye(36, 0)}${eye(0, 36)}</svg>`; })();

/* ---------- page ---------- */
const heroScenes = TPL.map((t, i) => `<div class="scene${i === 0 ? ' on' : ''}" data-scene="${t.key}">${svg(SCENES[t.key]('h' + t.key), '', 'xMidYMid slice', '0 200 1200 800')}</div>`).join('');
const heroTabs = TPL.map((t, i) => `<button class="tab" type="button" role="tab" aria-selected="${i === 0}" data-tab="${t.key}" data-couple="${t.couple}" data-date="${t.date}"><span class="tab-thumb" aria-hidden="true"><svg viewBox="0 0 36 36"><rect width="36" height="36" style="fill:var(--t${t.n}-sky1)"/><rect y="18" width="36" height="18" style="fill:var(--t${t.n}-sky2)"/><circle cx="18" cy="18" r="7" style="fill:var(--t${t.n}-${t.n === 3 || t.n === 5 ? 'moon' : 'sun'})"/><path d="M0 26 Q12 20 22 25 T36 24 V36 H0Z" style="fill:var(--t${t.n}-${['', 'h2', 'h2', 'city', 'alp2', 'w2'][t.n]})"/></svg></span>${t.name}</button>`).join('');
const gallery = TPL.map(t => `
  <li class="card panel t${t.n}">
    <div class="screen">${svg(SCENES[t.key]('g' + t.key), '', 'xMidYMax slice')}
      <div class="inv"><p class="inv-n">${t.couple.replace('&', '<span>&amp;</span>')}</p><p class="inv-d">${t.date}</p></div>
      <div class="inv-guest"><span>Buka undangan</span></div>
    </div>
    <h3>${t.name}</h3><p class="card-line">${t.line}</p>
  </li>`).join('');

const css = `/* Hallmark · shape: arch-window gallery · genre: editorial · theme: custom · job: browse templates (try) · idea: "every invitation is a painted landscape seen through an arched pendopo window" · vibe: "light, deep painted vector, glass over art"
 * paper: oklch(98.6% 0.006 250) · accent: oklch(74% 0.13 55) · display: Plus Jakarta Sans 800 with an Instrument Serif italic accent · body: Plus Jakarta Sans · wordmark: Plus Jakarta Sans 800 · hero: one wide arch holding the live template scene, five scene tabs on a glass rail inside it · nav: glass bar, lockup left, four links, theme switch, one action · footer: lockup, links, legal line on a pale band · imagery: authored vector scenes (the product's templates) · signature: the arch window that repaints as you pick a template
 * axes: light/grotesk-heavy/warm · posture: restrained, accent lives in the paintings · contrast: pass · fold: pass · v2.0.0 */
/* Hallmark · pre-emit critique: P4 H4 E4 S4 R4 V5 · weakest: S, a garden scene could suit any venue, so every template carries a named place and a real couple-name layout */
/* Hallmark · dismissed 3 · five template screens are the products themselves, equal by design, not icon tiles */
/* Hallmark · waive 80 · the five template scenes are the product being sold, authored vector paintings · Nawala sells these painted invitations */
/* Hallmark · dismissed F4 · the selected scene tab is a glass toggle with an outline, not a filled button */
/* Hallmark · waive 79 · the arch painting fills the fold under the head, the scene is the hero visual · the template switcher sits inside it */
/* Hallmark · project design wins · typeface pinned by the user: same as ieef.or.id (Plus Jakarta Sans), overriding the fonts.md ban */
/* Hallmark · waive 38iii · two-tone heads, the continuation in a softer ink, on every h1 and h2 · this is the house heading pattern of the user's own RTD site, asked for by name */
/* Hallmark · project design wins · serif heads with one italic phrase, pinned by the user from their references (overrides 38i) */
/* Hallmark · waive 29 · sun bloom sits inside the painted arch scenes only · the bloom is part of the authored landscape artwork, not a wash behind text */
:root {
  --space-3xs: 2px; --space-2xs: 4px; --space-xs: 8px; --space-sm: 12px; --space-md: 16px; --space-lg: 24px; --space-xl: 40px; --space-2xl: 64px; --space-3xl: 96px; --space-4xl: 144px;
  --text-xs: 0.8125rem; --text-sm: 0.9375rem; --text-md: 1.0625rem; --text-lg: 1.25rem; --text-xl: 1.5rem;
  --text-display: clamp(2.5rem, 3.3vw + 1rem, 4.4rem); --text-section: clamp(2rem, 2.2vw + 1rem, 3.1rem); --text-title: clamp(1.2rem, .6vw + .95rem, 1.45rem); --text-lead: clamp(1.0625rem, .3vw + 1rem, 1.25rem);
  --ease-out: cubic-bezier(0.16, 1, 0.3, 1); --dur-micro: 120ms; --dur-short: 220ms; --dur-long: 620ms;
  --container: 1240px; --gutter: 48px; --gap-columns: 24px; --section-gap: 136px;
  --z-raised: 10; --z-sticky-nav: 300;
  --radius-card: 22px; --radius-arch: 999px; --radius-pill: 999px;
  --font-display: "Instrument Serif", ui-serif, serif; --font-body: "Plus Jakarta Sans", ui-sans-serif, sans-serif; --font-outlier: "Plus Jakarta Sans", ui-sans-serif, sans-serif;
  --tracking-display: -0.035em;
  --grain: url(data:image/png;base64,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); --scene-shadow: oklch(28% 0.06 35 / .42); --scene-shadow-l: oklch(26% 0.06 35 / .5);
  --logo-1: #FFC39C; --logo-2: #FF8A4C; --logo-3: #FFB07A; --logo-4: #9CC2EE; --logo-5: #FFE9DA; --logo-6: #F59C8E;
  --logo-light: #FFFFFF; --logo-edge: #B8653C; --logo-mask: #FFFFFF; --logo-cut: #000000;
  /* templates: fixed palettes, shared by both themes */
  --t1-sky1:#FFF6EE; --t1-sky2:#FFD9C4; --t1-sun:#FF9F6B; --t1-ring:#FFD2B6; --t1-glow:#FFC4A0; --t1-cloud:#FFFFFF; --t1-cline:#EFD3C2;
  --t1-h1:#E3EED9; --t1-h1d:#C8DCBC; --t1-h2:#C6DCBD; --t1-h2d:#A1C397; --t1-h3:#A2C79B; --t1-h3d:#759E70; --t1-line:#F5FAF1;
  --t1-pond:#D6EBF8; --t1-pondd:#AFD3EE; --t1-wall:#FFF6EE; --t1-roof:#F58F5C; --t1-tree:#6F9C6D; --t1-treel:#A9CDA5; --t1-tc:#4E2C20; --t1-tb:#F58F5C; --t1-tbt:#2B160E; --t1-card:#FFF8F2C7;
  --t2-sky1:#D4E7FA; --t2-sky2:#FFF0E6; --t2-sun:#FF8E72; --t2-ring:#FFC9BA; --t2-glow:#FFB4A0; --t2-cloud:#FFFFFF; --t2-cline:#E6D4D0;
  --t2-fuji:#B3CEEC; --t2-fujid:#7FA8D8; --t2-fujil:#D6E5F5; --t2-snow:#FFFFFF; --t2-h1:#F9D6CA; --t2-h1d:#EAB3A2; --t2-h2:#EFB2A1; --t2-h2d:#D58A77; --t2-h3:#DE9686; --t2-h3d:#B96E5E; --t2-line:#FFF3EE;
  --t2-river:#D3E8FB; --t2-riverd:#9CC8F0; --t2-tree:#EE97AB; --t2-treel:#F9C9D4; --t2-tc:#2A3D60; --t2-tb:#FF8E72; --t2-tbt:#2B140D; --t2-card:#FFF6F2C7;
  --t3-sky1:#0E1D3D; --t3-sky2:#4F78AE; --t3-moon:#FFE3BC; --t3-ring:#FFF1DE; --t3-glow:#FFC79A; --t3-cloud:#2E4C7E; --t3-cline:#4F70A5;
  --t3-city:#23406E; --t3-cityd:#182E54; --t3-win:#FFC88E; --t3-eiffel:#0E1A36; --t3-eiffl:#35558A; --t3-bank:#0D1934; --t3-bankd:#071024; --t3-line:#4A6BA0;
  --t3-river:#FFBD80; --t3-riverd:#E98C4E; --t3-rline:#FFE6C9; --t3-tc:#FFF4E6; --t3-tb:#FFC48A; --t3-tbt:#14254A; --t3-card:#0E1A38A0;
  --t4-sky1:#C6E1FB; --t4-sky2:#F8FBFF; --t4-sun:#FFB074; --t4-ring:#FFE0C6; --t4-glow:#FFCFA6; --t4-cloud:#FFFFFF; --t4-cline:#D6E5F4;
  --t4-alp1:#CBDFF4; --t4-alp1d:#9EBFE6; --t4-alp2:#A6C6EA; --t4-alp2d:#7099D2; --t4-snow:#FFFFFF; --t4-lake:#E6F3FF; --t4-laked:#C3DEF9;
  --t4-meadow:#D8ECE1; --t4-meadowd:#AFD3BF; --t4-fg:#BED8EF; --t4-fgd:#8DB5DF; --t4-line:#F2F8FD; --t4-wall:#FFFFFF; --t4-roof:#FF9A5C; --t4-pine:#5F8DC2; --t4-tc:#25395A; --t4-tb:#FF9A5C; --t4-tbt:#2B160C; --t4-card:#F8FBFFC7;
  --t5-sky1:#0E1A3E; --t5-sky2:#3E6098; --t5-moon:#FFD5AE; --t5-ring:#FFE9D6; --t5-glow:#FFC29A; --t5-cloud:#26406F; --t5-cline:#46669C;
  --t5-w1:#2A4A82; --t5-w1d:#1F3A68; --t5-w2:#213E70; --t5-w2d:#172F58; --t5-w3:#193260; --t5-w3d:#102345; --t5-wline:#5577B0;
  --t5-sand:#F4CBA9; --t5-sandd:#DAA47E; --t5-sline:#FCE3D0; --t5-palm:#0A1530; --t5-tc:#FFF0E3; --t5-tb:#FFD5AE; --t5-tbt:#13224A; --t5-card:#0E1A3EA6;
  /* services band: always night */
  --b-sky1:#0E1B38; --b-sky2:#2A4A7C; --b-moon:#FFC08E; --b-ring:#FFE2C8; --b-glow:#FFA870; --b-cloud:#2A4573; --b-cline:#4A6A9C;
  --b-h1:#2C4B7B; --b-h1d:#1F3862; --b-h2:#234574; --b-h2d:#183258; --b-h3:#172C52; --b-h3d:#0E1D3A; --b-line:#5878AC;
  --b-wall:#3D5E92; --b-roof:#FFA868; --b-tree:#0E1D3A; --b-treel:#2A4673;
  --b-glass: oklch(28% 0.05 252 / .42); --b-glass-strong: oklch(28% 0.05 252 / .62); --b-glass-edge: oklch(88% 0.03 245 / .2); --b-glass-hi: oklch(100% 0 0 / .14); --b-glass-ink: oklch(96% 0.01 250); --b-shadow: oklch(6% 0.03 255 / .6); --b-demo: oklch(18% 0.04 255 / .45);
}
html[data-theme="light"] {
  --nav-on: oklch(100% 0 0); --nav-on-ink: oklch(23% 0.02 40); --ray: oklch(100% 0 0 / .5); --bloom: oklch(90% 0.07 62 / .55); --text-veil: oklch(98.6% 0.006 250 / .72);
  --v-sky1:#CDE5F7; --v-sky2:#E9F4FB; --v-sky3:#FFF0E2; --v-sun:#FFE6CF; --v-glow:#FFD2AE; --v-haze:#F4F8FA; --v-m1:#C6DCF0; --v-m2:#A5C6E3; --v-m3:#84AED0; --v-b1:#8DBBAA; --v-b1b:#B4D6BE; --v-b2:#6FAE90; --v-b2b:#A5D39F; --v-g1:#CFE9A6; --v-g2:#8CC47E; --v-p1:#7FAFA4; --v-p2:#4C8F7C; --v-p3:#2C6C5C; --v-pl:#8FD0A4; --v-tr:#5B4636; --v-w1:#CDE9F7; --v-w2:#7CBFE8; --v-whi:#FFFFFF; --v-gr1:#6DB06C; --v-gr2:#B4DB8E; --v-gr3:#4E9566; --v-fl1:#FFB085; --v-fl2:#FFFFFF; --v-arch:#FFFDF8; --v-archsh:#F1D8C4; --v-archglow:#FFFFFF; --v-isle:#86BC84;
  --foot-ink: #1C3526; --hb-sky1:#D9E9F9; --hb-sky2:#FFF1E6; --hb-r1:#F8DDCB; --hb-r1d:#F1C9B0; --hb-r2:#D3E4F5; --hb-r2d:#B7D1EC; --hb-r3:#F7FAFD; --hb-line:#FFFFFF; --hb-cloud:#FFFFFF; --hb-cline:#F0D9CB; --color-head-soft: oklch(56% 0.03 45);
  --color-paper: oklch(98.6% 0.006 250); --color-paper-2: oklch(96.2% 0.013 245); --color-paper-3: oklch(95% 0.025 60);
  --color-ink: oklch(23% 0.02 40); --color-ink-2: oklch(36% 0.02 40); --color-muted: oklch(50% 0.02 40);
  --color-rule: oklch(90.5% 0.01 250); --color-accent: oklch(74% 0.13 55); --color-accent-ink: oklch(22% 0.03 45); --color-accent-deep: oklch(48% 0.12 50); --color-focus: oklch(52% 0.15 250);
  --color-blue: oklch(84% 0.055 240);
  --glass: oklch(100% 0 0 / .55); --glass-strong: oklch(100% 0 0 / .78); --glass-edge: oklch(100% 0 0 / .85); --glass-hi: oklch(100% 0 0 / .95); --glass-ink: oklch(23% 0.02 40);
  --shadow-soft: oklch(40% 0.05 40 / .16); --shadow-deep: oklch(35% 0.06 40 / .28);
  --btn: oklch(23% 0.02 40); --btn-ink: oklch(98.6% 0.006 250);
  --s-sky1:#D8E9FA; --s-sky2:#FFE9DA; --s-sun:#FFA466; --s-ring:#FFD6BE; --s-glow:#FFC3A0; --s-cloud:#FFFFFF; --s-cline:#F0D5C4;
  --s-h1:#FCE4D3; --s-h1d:#F2C8AE; --s-h2:#C9DEF3; --s-h2d:#9CBFE6; --s-h3:#F4B593; --s-h3d:#DC8D69; --s-line:#FFF4EC;
  --s-wall:#FFF6EE; --s-roof:#FF9A5C; --s-river:#D6EAFB; --s-riverd:#A6CDF2; --s-rline:#FFFFFF; --s-tree:#C9745A; --s-treel:#EFAA8C;
}
html[data-theme="dark"], .night {
  --v-sky1:#040A18; --v-sky2:#0A1B30; --v-sky3:#234A5A; --v-sun:#FFE4C4; --v-glow:#F2A877; --v-haze:#1D4253; --v-m1:#1B3852; --v-m2:#142C45; --v-m3:#0F2337; --v-b1:#0F2E33; --v-b1b:#123A3B; --v-b2:#0B2529; --v-b2b:#0F3331; --v-g1:#123D37; --v-g2:#071C1C; --v-p1:#12363B; --v-p2:#0C2A2E; --v-p3:#06181C; --v-pl:#1F5A52; --v-tr:#081212; --v-w1:#17465A; --v-w2:#081B2B; --v-whi:#8FD6CC; --v-gr1:#1F5E50; --v-gr2:#174A41; --v-gr3:#0E322D; --v-fl1:#FFB98A; --v-fl2:#A8DDD4; --v-arch:#FFE9D2; --v-archsh:#E9B890; --v-archglow:#FFB87E; --v-isle:#134038;
}
html[data-theme="dark"] {
  --nav-on: oklch(96% 0.01 250); --nav-on-ink: oklch(17% 0.035 255); --ray: oklch(82% 0.09 60 / .13); --bloom: oklch(62% 0.1 55 / .16); --text-veil: oklch(10% 0.03 255 / .5);
  --foot-ink: oklch(92% 0.02 250); --hb-sky1:#0A1430; --hb-sky2:#1A3158; --hb-r1:#1F3A63; --hb-r1d:#172E52; --hb-r2:#162C50; --hb-r2d:#10223F; --hb-r3:#0D1628; --hb-line:#4C6C9E; --hb-cloud:#24406C; --hb-cline:#3F5F92; --color-head-soft: oklch(72% 0.04 245);
  --color-paper: oklch(17% 0.035 255); --color-paper-2: oklch(21% 0.04 252); --color-paper-3: oklch(25% 0.045 250);
  --color-ink: oklch(96% 0.01 250); --color-ink-2: oklch(86% 0.02 250); --color-muted: oklch(72% 0.03 250);
  --color-rule: oklch(32% 0.04 252); --color-accent: oklch(79% 0.12 58); --color-accent-ink: oklch(17% 0.035 255); --color-accent-deep: oklch(82% 0.11 58); --color-focus: oklch(80% 0.1 250);
  --color-blue: oklch(72% 0.08 245);
  --glass: oklch(30% 0.05 252 / .42); --glass-strong: oklch(30% 0.05 252 / .7); --glass-edge: oklch(88% 0.03 245 / .22); --glass-hi: oklch(100% 0 0 / .14); --glass-ink: oklch(96% 0.01 250);
  --shadow-soft: oklch(8% 0.03 255 / .5); --shadow-deep: oklch(6% 0.03 255 / .65);
  --btn: oklch(96% 0.01 250); --btn-ink: oklch(17% 0.035 255);
  --scene-shadow: oklch(8% 0.03 255 / .55); --scene-shadow-l: oklch(6% 0.03 255 / .65);
  --logo-edge: #1E2E55;
  --s-sky1:#0B1630; --s-sky2:#22406E; --s-sun:#FFB57E; --s-ring:#FFE2C8; --s-glow:#FF9E66; --s-cloud:#2C4774; --s-cline:#4A6A9C;
  --s-h1:#2B4A7A; --s-h1d:#1E3760; --s-h2:#1F3E6E; --s-h2d:#152C52; --s-h3:#182E55; --s-h3d:#0F1F3D; --s-line:#5C7DB0;
  --s-wall:#3E5F92; --s-roof:#FFA868; --s-river:#FFA066; --s-riverd:#E07A42; --s-rline:#FFD9B5; --s-tree:#10213F; --s-treel:#2A4673;
}

*, *::before, *::after { box-sizing: border-box; }
html, body { overflow-x: clip; }
html { scrollbar-color: var(--color-muted) var(--color-paper); scroll-padding-top: 96px; scroll-behavior: smooth; }
body { margin: 0; background: var(--color-paper); color: var(--color-ink); font-family: var(--font-body); font-size: var(--text-md); line-height: 1.6; -webkit-font-smoothing: antialiased; caret-color: var(--color-accent); transition: background-color var(--dur-long) var(--ease-out), color var(--dur-long) var(--ease-out); }
::selection { background: color-mix(in oklab, var(--color-accent) 30%, transparent); color: var(--color-ink); }
:focus-visible { outline: 2px solid var(--color-focus); outline-offset: 3px; }
a { color: inherit; text-underline-offset: .2em; text-decoration-thickness: 1px; }
h1, h2, h3 { margin: 0; font-family: var(--font-body); font-weight: 800; font-synthesis: none; overflow-wrap: break-word; min-width: 0; text-wrap: balance; letter-spacing: var(--tracking-display); }
p { margin: 0; text-wrap: pretty; }
ul, ol { margin: 0; padding: 0; list-style: none; }
svg { display: block; }
button { font: inherit; color: inherit; background: none; border: 0; cursor: pointer; }
.visually-hidden { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
.container { width: 100%; max-width: var(--container); margin-inline: auto; padding-inline: var(--gutter); }
.ico { width: 20px; height: 20px; fill: none; stroke: currentColor; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; }

/* glass: only where something sits on a painting */
.glass { background: var(--glass); -webkit-backdrop-filter: blur(18px) saturate(160%); backdrop-filter: blur(18px) saturate(160%); border: 1px solid var(--glass-edge); box-shadow: 0 1px 0 var(--glass-hi) inset, 0 18px 40px -22px var(--shadow-deep); color: var(--glass-ink); }

/* buttons */
.btn { white-space: nowrap; display: inline-flex; align-items: center; gap: 10px; min-height: 48px; padding: 0 24px; border-radius: var(--radius-pill); font-weight: 500; font-size: var(--text-sm); text-decoration: none; background: var(--btn); color: var(--btn-ink); transition: transform var(--dur-short) var(--ease-out), box-shadow var(--dur-short) var(--ease-out), opacity var(--dur-short); box-shadow: 0 10px 24px -14px var(--shadow-deep); }
.btn:hover { transform: translateY(-1px); box-shadow: 0 16px 30px -14px var(--shadow-deep); }
.btn:active { transform: translateY(0); opacity: .9; }
.btn:focus-visible { outline: 2px solid var(--color-focus); outline-offset: 3px; transition: none; }
.btn[aria-disabled="true"] { opacity: .45; pointer-events: none; }
.link { font-size: var(--text-sm); font-weight: 500; color: var(--color-ink); text-decoration: underline; text-decoration-color: var(--color-rule); text-underline-offset: .3em; transition: text-decoration-color var(--dur-short); }
.link:hover { text-decoration-color: var(--color-accent); }

/* nav */
.nav { position: absolute; top: 22px; left: 50%; transform: translateX(-50%); z-index: var(--z-sticky-nav); width: min(var(--container), calc(100% - 40px)); display: grid; grid-template-columns: 1fr auto 1fr; align-items: center; gap: 16px; }
.nav > a { justify-self: start; }
.nav-right { justify-self: end; }
.round { background: var(--glass); -webkit-backdrop-filter: blur(16px) saturate(160%); backdrop-filter: blur(16px) saturate(160%); box-shadow: inset 0 0 0 1px var(--glass-edge), 0 10px 24px -16px var(--shadow-deep); }
.nav ul { display: flex; gap: 8px; }
.nav ul a { display: inline-flex; align-items: center; min-height: 44px; padding: 0 18px; font-size: var(--text-sm); text-decoration: none; color: var(--glass-ink); border-radius: var(--radius-pill); transition: background-color var(--dur-short); }
.nav ul a:hover { background: var(--glass-strong); }
.nav ul a[aria-current] { background: var(--nav-on); color: var(--nav-on-ink); font-weight: 500; box-shadow: 0 10px 24px -14px var(--shadow-deep); }
.nav-right { display: flex; align-items: center; gap: 8px; }
.theme { width: 44px; height: 44px; display: grid; place-items: center; border-radius: 50%; color: var(--color-ink); transition: background-color var(--dur-short); }
.theme:hover { background: var(--glass-strong); }
.theme .i-moon { display: none; }
html[data-theme="dark"] .theme .i-sun { display: none; }
html[data-theme="dark"] .theme .i-moon { display: block; }
.nav .btn { min-height: 44px; padding: 0 20px; }
@media (max-width: 880px) { .nav { grid-template-columns: 1fr auto; } .nav ul { display: none; } }
@media (max-width: 480px) { .nav .btn { padding: 0 14px; } .nav-right { gap: 6px; } }

/* hero */
.hero-wrap { position: relative; isolation: isolate; margin-top: 0; min-height: max(100svh, 760px); overflow: hidden; }
.hero-back { position: absolute; inset: 0; z-index: -1; width: 100%; height: 100%; }
.hero { padding-top: clamp(140px, 17vh, 190px); text-align: center; display: grid; justify-items: center; gap: 22px; }
.hero h1 { max-width: 20ch; }
.hero .lead { max-width: 36ch; color: var(--color-ink); font-weight: 500; }
.hero > * { position: relative; }
.hero::before { content: ""; position: absolute; left: 50%; top: 90px; width: min(980px, 96%); height: 420px; transform: translateX(-50%); background: radial-gradient(closest-side, var(--text-veil), transparent); pointer-events: none; }
.hero { position: relative; }
.rays { position: absolute; left: 50%; bottom: max(27.5vw, 44%); width: 2200px; height: 2200px; translate: -50% 50%; z-index: -1; pointer-events: none; background: repeating-conic-gradient(from 4deg, transparent 0deg 7deg, var(--ray) 10deg, transparent 14deg 23deg); -webkit-mask-image: radial-gradient(circle, #000 4%, transparent 58%); mask-image: radial-gradient(circle, #000 4%, transparent 58%); animation: rays 9s ease-in-out infinite alternate; }
@keyframes rays { from { opacity: .35; transform: rotate(-3deg); } to { opacity: 1; transform: rotate(3deg); } }
.hero-actions { display: flex; gap: 12px; flex-wrap: wrap; justify-content: center; }
.btn-glass { background: var(--glass-strong); color: var(--glass-ink); -webkit-backdrop-filter: blur(14px); backdrop-filter: blur(14px); box-shadow: inset 0 0 0 1px var(--glass-edge), 0 10px 24px -14px var(--shadow-deep); }
.art-back.quiet { opacity: .6; -webkit-mask-image: linear-gradient(180deg, transparent 0%, rgba(0,0,0,.18) 45%, #000 88%); mask-image: linear-gradient(180deg, transparent 0%, rgba(0,0,0,.18) 45%, #000 88%); }
.art-sec { background: radial-gradient(55% 38% at 86% 16%, var(--bloom), transparent 70%), radial-gradient(40% 30% at 8% 40%, var(--bloom), transparent 70%), linear-gradient(180deg, var(--v-g2), var(--color-paper) 150px) var(--color-paper); }
.soft { font-family: var(--font-display); font-style: italic; font-weight: 400; font-size: 1.14em; letter-spacing: -0.01em; }
.hero-head { display: grid; grid-template-columns: minmax(0, 1.2fr) minmax(0, .8fr); gap: var(--gap-columns); align-items: end; }
h1 { font-size: var(--text-display); line-height: 1; }
.hero-sub { display: grid; gap: 20px; justify-items: start; padding-bottom: 8px; }
.lead { font-size: var(--text-lead); color: var(--color-ink-2); max-width: 34ch; }
.arch { position: relative; margin-top: 32px; height: clamp(420px, calc(100svh - 390px), 640px); border-radius: 50% 50% 28px 28px / 46% 46% 28px 28px; overflow: hidden; box-shadow: 0 40px 80px -40px var(--shadow-deep), 0 0 0 1px var(--color-rule); isolation: isolate; }
.scene { position: absolute; inset: 0; }
html:not(.js) .scene + .scene { display: none; }
.js .scene { display: none; opacity: 0; visibility: hidden; transform: scale(1.04); transition: opacity var(--dur-long) var(--ease-out), transform 1.2s var(--ease-out), visibility 0s linear var(--dur-long); }
.js .scene.on { display: block; animation: sceneIn var(--dur-long) var(--ease-out); opacity: 1; visibility: visible; transform: none; transition: opacity var(--dur-long) var(--ease-out), transform 1.2s var(--ease-out); }
.scene svg { width: 100%; height: 100%; }
.drift { animation: drift 40s ease-in-out infinite alternate; transform-box: view-box; }
@keyframes sceneIn { from { opacity: 0; transform: scale(1.03); } }
@keyframes drift { from { transform: translateX(-30px); } to { transform: translateX(30px); } }
.flow { stroke-dasharray: 26 38; animation: flow 7s linear infinite; }
@keyframes flow { to { stroke-dashoffset: -256; } }
.hero-card { position: absolute; z-index: 2; left: 6%; top: 34%; width: min(280px, 40%); padding: 20px 22px; border-radius: var(--radius-card); }
.hero-card .k { font-size: var(--text-xs); color: var(--color-ink-2); }
.hero-card .n { font-family: var(--font-display); font-weight: 800; letter-spacing: -0.03em; font-size: 1.6rem; line-height: 1.1; margin: 6px 0 2px; }
.hero-card .d { font-size: var(--text-sm); color: var(--color-ink-2); }
.hero-card .to { margin-top: 14px; padding-top: 12px; border-top: 1px solid var(--glass-edge); font-size: var(--text-sm); }
.tabs { position: absolute; z-index: 2; left: 50%; bottom: 18px; transform: translateX(-50%); display: flex; gap: 6px; padding: 6px; border-radius: 20px; max-width: calc(100% - 24px); overflow-x: auto; scrollbar-width: none; }
.tab { display: inline-flex; align-items: center; gap: 8px; min-height: 44px; padding: 4px 14px 4px 4px; border-radius: 14px; font-size: var(--text-sm); white-space: nowrap; color: var(--glass-ink); transition: background-color var(--dur-short); }
.tab:hover { background: var(--glass-strong); }
.tab[aria-selected="true"] { background: var(--glass-strong); box-shadow: inset 0 0 0 1.5px var(--color-ink); font-weight: 500; }
.tab:focus-visible { outline: 2px solid var(--color-focus); outline-offset: 2px; transition: none; }
.tab-thumb { width: 36px; height: 36px; border-radius: 10px; overflow: hidden; flex: none; box-shadow: 0 0 0 1px var(--glass-edge); }
.tab-thumb svg { width: 100%; height: 100%; }
@media (max-width: 760px) { .hero-head { grid-template-columns: minmax(0, 1fr); } .arch { border-radius: 50% 50% 24px 24px / 34% 34% 24px 24px; height: 560px; } .hero-card { left: 50%; right: auto; transform: translateX(-50%); top: 30%; width: min(280px, 80%); } .tab { padding-right: 4px; } .tab-label { display: none; } }

/* sections */
section { padding-top: 0; }
.sec-head { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: var(--gap-columns); align-items: end; margin-bottom: 48px; }
h2 { font-size: var(--text-section); line-height: 1.05; max-width: 16ch; }
.sec-head p { color: var(--color-ink-2); max-width: 44ch; }
@media (max-width: 760px) { .sec-head { grid-template-columns: minmax(0, 1fr); } }

/* gallery */
.gallery { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 20px; }
.card { padding: 10px 10px 18px; border-radius: 30px; }
.card h3 { font-size: var(--text-title); margin: 16px 8px 0; }
.card-line { font-size: var(--text-sm); color: var(--color-ink-2); margin: 4px 8px 0; }
.screen { position: relative; aspect-ratio: 9 / 17; border-radius: 999px 999px 26px 26px / 36% 36% 26px 26px; overflow: hidden; box-shadow: 0 30px 50px -30px var(--shadow-deep), 0 0 0 1px var(--color-rule); transition: transform var(--dur-long) var(--ease-out), box-shadow var(--dur-long) var(--ease-out); }
.card:hover .screen { transform: translateY(-8px); box-shadow: 0 44px 60px -32px var(--shadow-deep), 0 0 0 1px var(--color-rule); }
.screen svg { position: absolute; inset: 0; width: 100%; height: 100%; }
.inv { position: absolute; inset: 15% 8% auto; text-align: center; color: var(--tc); }
.inv-k { font-size: .72rem; opacity: .85; }
.inv-n { font-family: var(--font-display); font-weight: 400; font-size: clamp(1.15rem, 1.4vw, 1.5rem); line-height: 1.1; margin: 6px 0 4px; }
.inv-n span { display: block; font-size: .8em; opacity: .8; }
.inv-d { font-size: .72rem; opacity: .9; }
.inv-guest { position: absolute; left: 10%; right: 10%; bottom: 6%; padding: 8px; border-radius: 16px; text-align: center; font-size: .72rem; background: var(--tcard); -webkit-backdrop-filter: blur(12px) saturate(150%); backdrop-filter: blur(12px) saturate(150%); border: 1px solid color-mix(in oklab, var(--tc) 22%, transparent); color: var(--tc); }
.inv-guest span { display: inline-block; padding: 5px 12px; border-radius: var(--radius-pill); background: var(--tb); color: var(--tbt); font-weight: 500; }
.t1 { --tc: var(--t1-tc); --tb: var(--t1-tb); --tbt: var(--t1-tbt); --tcard: var(--t1-card); } .t2 { --tc: var(--t2-tc); --tb: var(--t2-tb); --tbt: var(--t2-tbt); --tcard: var(--t2-card); } .t3 { --tc: var(--t3-tc); --tb: var(--t3-tb); --tbt: var(--t3-tbt); --tcard: var(--t3-card); } .t4 { --tc: var(--t4-tc); --tb: var(--t4-tb); --tbt: var(--t4-tbt); --tcard: var(--t4-card); } .t5 { --tc: var(--t5-tc); --tb: var(--t5-tb); --tbt: var(--t5-tbt); --tcard: var(--t5-card); }
@media (max-width: 1080px) { .gallery { grid-template-columns: repeat(3, minmax(0, 1fr)); } }
@media (max-width: 640px) { .gallery { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; } }

/* services over the night painting */
.band { position: relative; padding: 120px 0 140px; overflow: hidden; isolation: isolate; }
.band-art { position: absolute; inset: 0; width: 100%; height: 100%; z-index: -1; }
.band-head { max-width: 560px; padding: 32px 34px; border-radius: 28px; }
.band-head h2 { color: var(--glass-ink); }

.band-head p { margin-top: 14px; color: var(--glass-ink); opacity: .85; }
.band .glass { background: var(--glass-strong); }
.svc { margin-top: 28px; display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 16px; }
.svc li { padding: 22px; border-radius: var(--radius-card); display: flex; flex-direction: column; gap: 14px; min-height: 280px; }
.svc h3 { font-family: var(--font-body); font-weight: 800; font-size: var(--text-md); letter-spacing: -0.01em; }
.svc .what { font-size: var(--text-sm); opacity: .85; }
.svc .demo { margin-top: auto; border-radius: 14px; padding: 12px; background: var(--glass); font-size: var(--text-xs); display: grid; gap: 8px; }
.row { display: flex; justify-content: space-between; gap: 8px; }
.row b { font-weight: 500; }
.ok { color: var(--color-accent-deep); font-weight: 500; }
.no-open { color: var(--color-muted); }
.qr { width: 64px; height: 64px; fill: var(--color-ink); }
.qr .qr-o { fill: none; stroke: var(--color-ink); stroke-width: 3; }
.mini { position: relative; height: 70px; border-radius: 10px; overflow: hidden; }
.mini svg { width: 100%; height: 100%; }
.live { position: absolute; left: 8px; top: 8px; padding: 2px 8px; border-radius: var(--radius-pill); background: var(--b-roof); color: var(--b-sky1); font-weight: 500; font-size: .7rem; }
.demo-note, .later { display: inline-block; margin-top: 18px; padding: 6px 14px; border-radius: var(--radius-pill); background: var(--glass-strong); font-size: var(--text-xs); color: var(--color-ink-2); }
@media (max-width: 1000px) { .svc { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
@media (max-width: 560px) { .svc { grid-template-columns: minmax(0, 1fr); } .band-head { padding: 24px; } }

/* pricing */
.price-wrap { border-radius: 28px; overflow: hidden; padding: 8px; }
table { width: 100%; border-collapse: collapse; font-size: var(--text-sm); }
th, td { padding: 16px 22px; text-align: left; border-bottom: 1px solid var(--color-rule); vertical-align: middle; }
th { font-weight: 500; } b { font-weight: 500; }
thead th { vertical-align: bottom; padding-top: 28px; padding-bottom: 24px; font-weight: 400; }
thead th:first-child { width: 34%; }
.pk { font-family: var(--font-body); font-weight: 800; letter-spacing: -0.02em; font-size: var(--text-xl); display: block; }
.pp { display: block; font-size: 2rem; font-family: var(--font-body); font-weight: 800; letter-spacing: -0.03em; margin-top: 6px; font-variant-numeric: tabular-nums; }
.pd { display: block; color: var(--color-muted); font-size: var(--text-xs); margin-top: 4px; }
.pop { background: color-mix(in oklab, var(--color-paper-3) 70%, transparent); }
td .ico { color: var(--color-accent-deep); }
td .no { color: var(--color-muted); }
table th, table td { border-bottom-color: color-mix(in oklab, var(--color-rule) 80%, transparent); }
tbody tr:last-child td { border-bottom: 0; }
tfoot td { padding: 20px 22px; border-top: 1px solid var(--color-rule); border-bottom: 0; }
tfoot .btn { min-height: 44px; }
.btn-quiet { background: transparent; color: var(--color-ink); box-shadow: inset 0 0 0 1px var(--color-rule); }
.btn-quiet:hover { box-shadow: inset 0 0 0 1px var(--color-ink-2); }
.day { margin-top: 20px; display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); border-radius: 22px; overflow: hidden; }
.day li { padding: 22px; display: grid; gap: 6px; align-content: start; }
.day li + li { border-left: 1px solid var(--color-rule); }
.day h3 { font-family: var(--font-body); font-weight: 800; font-size: var(--text-md); letter-spacing: 0; }
.day p { font-size: var(--text-sm); color: var(--color-muted); }
.day .pp { font-size: 1.6rem; }
.day .full { background: color-mix(in oklab, var(--color-paper-2) 70%, transparent); }

@media (max-width: 900px) { .price-scroll { overflow-x: auto; } tbody th, thead th:first-child, tfoot td:first-child { position: sticky; left: 0; z-index: 1; background: var(--color-paper); } table { min-width: 720px; } .day { grid-template-columns: repeat(2, minmax(0, 1fr)); } .day li:nth-child(3) { border-left: 0; } .day li:nth-child(n+3) { border-top: 1px solid var(--color-rule); } }

/* logo pack */
.pack { display: grid; grid-template-columns: 1.4fr 1fr 1fr; grid-template-rows: auto auto; gap: 16px; }
.tile { border-radius: var(--radius-card); display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 20px; padding: 48px 24px 20px; min-height: 220px; border: 1px solid var(--color-rule); }
.tile .logo { flex: none; max-width: 100%; margin-block: auto; }
.tile.big { grid-row: span 2; background: var(--glass-strong); -webkit-backdrop-filter: blur(20px); backdrop-filter: blur(20px); border-color: var(--glass-edge); }
.tile.night { background: var(--b-sky1); border-color: transparent; }
.tile.peach { background: var(--t1-sky2); border-color: transparent; }
.tile.plain { background: var(--glass-strong); -webkit-backdrop-filter: blur(20px); backdrop-filter: blur(20px); border-color: var(--glass-edge); }
.tile .cap { align-self: flex-start; font-size: var(--text-xs); color: var(--color-muted); }
.tile.night .cap { color: var(--b-cline); }
.tile.peach .cap { color: var(--t1-tc); }
@media (max-width: 860px) { .pack { grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); } .tile.big { grid-column: span 2; grid-row: auto; } }

/* faq */
.faq { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1.4fr); gap: var(--gap-columns); }
.faq-list { border-radius: 24px; padding: 4px 28px; }
details + details { border-top: 1px solid var(--color-rule); }
summary { list-style: none; cursor: pointer; padding: 22px 0; display: flex; justify-content: space-between; align-items: center; gap: 16px; font-size: var(--text-lg); }
summary::-webkit-details-marker { display: none; }
summary .ico { flex: none; transition: transform var(--dur-short) var(--ease-out); }
details[open] summary .ico { transform: rotate(45deg); }
summary:focus-visible { outline: 2px solid var(--color-focus); outline-offset: 4px; transition: none; }
details p { padding: 0 0 22px; color: var(--color-ink-2); max-width: 60ch; }
@media (max-width: 760px) { .faq { grid-template-columns: minmax(0, 1fr); } }

/* closing */
.closing { position: relative; height: 740px; overflow: hidden; isolation: isolate; }
.closing-art { position: absolute; inset: 0; width: 100%; height: 100%; z-index: -1; }
.closing-box { position: relative; top: 70px; max-width: 520px; margin-inline: auto; text-align: center; padding: 34px; border-radius: 28px; display: grid; gap: 18px; justify-items: center; }
.closing-box h2 { margin-inline: auto; }


/* every section sits on artwork */
.art-sec { position: relative; isolation: isolate; overflow: hidden; padding: var(--section-gap) 0 calc(var(--section-gap) + 120px); }
.art-back { position: absolute; inset: 0; z-index: -1; width: 100%; height: 100%; }
.panel { background: var(--glass-strong); -webkit-backdrop-filter: blur(20px) saturate(160%); backdrop-filter: blur(20px) saturate(160%); border: 1px solid var(--glass-edge); box-shadow: 0 1px 0 var(--glass-hi) inset, 0 24px 50px -28px var(--shadow-deep); }


/* one shared grain texture instead of per-shape filters */
.hero-wrap::after, .art-sec::after, .band::after, .closing::after, .arch::after, .screen::after { content: ""; position: absolute; inset: 0; pointer-events: none; background-image: var(--grain); background-size: 180px 180px; mix-blend-mode: overlay; opacity: .55; }
.hero-wrap::after, .art-sec::after, .band::after, .closing::after { z-index: -1; }
.arch::after, .screen::after { z-index: 1; }
.inv, .inv-guest, .hero-card, .tabs { z-index: 2; }
@media (max-width: 900px), (pointer: coarse) { .drift, .flow, .rays { animation: none; } .glass, .panel { -webkit-backdrop-filter: blur(10px); backdrop-filter: blur(10px); } }

/* footer */
footer { background: var(--v-g2); padding: 40px 0 44px; font-size: var(--text-sm); color: var(--foot-ink); }
.foot { display: flex; justify-content: space-between; align-items: center; gap: 24px; flex-wrap: wrap; }
.foot ul { display: flex; gap: 22px; flex-wrap: wrap; }
.foot a { text-decoration: none; color: var(--foot-ink); }
.foot a:hover { text-decoration: underline; }

@media (max-width: 760px) { :root { --gutter: 20px; --section-gap: 88px; } }
@media (prefers-reduced-motion: reduce) { *, *::before, *::after { animation-duration: .01ms !important; animation-iteration-count: 1 !important; transition-duration: .01ms !important; scroll-behavior: auto !important; } }
`;


function tokenize(css) {
  const map = { 2: '3xs', 4: '2xs', 5: '2xs', 6: 'xs', 8: 'xs', 10: 'sm', 12: 'sm', 14: 'md', 16: 'md', 18: 'md', 20: 'lg', 22: 'lg', 24: 'lg', 28: 'lg', 32: 'xl', 34: 'xl', 36: 'xl', 40: 'xl', 44: 'xl', 48: '2xl', 64: '2xl', 96: '3xl' };
  const i = css.indexOf('\n*, *::before');
  const head = css.slice(0, i), body = css.slice(i);
  return head + body.replace(/((?:padding|margin|gap)(?:-[a-z]+)?\s*:\s*)([^;}]+)/g, (m, prop, val) => prop + val.replace(/(?<![\w.-])(\d+)px/g, (mm, n) => map[n] ? `var(--space-${map[n]})` : mm));
}

const sharedDefs = `<svg width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false"><defs>
  ${['paint-s', 'paint', 'paint-l'].map((id, i) => { const dy = [4, 10, 16][i], sd = [4, 11, 16][i], sh = i === 2 ? 'var(--scene-shadow-l)' : 'var(--scene-shadow)';
    return `<filter id="${id}" x="-15%" y="-25%" width="130%" height="170%" color-interpolation-filters="sRGB"><feDropShadow dx="0" dy="${dy}" stdDeviation="${sd}" style="flood-color:${sh}"/></filter>`; }).join('')}
  ${VSYM}
  <filter id="bloom" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="30"/></filter>
</defs></svg>`;

const miniStream = `<svg viewBox="0 0 200 70" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><rect width="200" height="70" style="fill:var(--t1-sky2)"/><circle cx="130" cy="34" r="16" style="fill:var(--t1-sun)"/><path d="M0 50 Q60 38 120 48 T200 46 V70 H0Z" style="fill:var(--t1-h2)"/></svg>`;

const html = `<!DOCTYPE html>
<html lang="id" data-theme="light">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Nawala, undangan pernikahan yang dilukis berlapis</title>
<meta name="description" content="Undangan pernikahan digital berupa lukisan berlapis, dengan RSVP, buku tamu QR, dan live streaming dalam satu pesanan.">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Plus+Jakarta+Sans:wght@400;500;800&display=swap" rel="stylesheet">
<script>document.documentElement.classList.add('js');try{var t=localStorage.getItem('nawala-theme');document.documentElement.dataset.theme=t||(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light')}catch(e){}</script>
<style>
${tokenize(css)}
</style>
</head>
<body>
${sharedDefs}
<nav class="nav" aria-label="Utama">
  <a href="#top" aria-label="Nawala, ke atas">${logo('lockup', 34, 7)}</a>
  <ul>
    <li><a class="round" href="#top" aria-current="page">Beranda</a></li>
    <li><a class="round" href="#template">Template</a></li>
    <li><a class="round" href="#layanan">Layanan</a></li>
    <li><a class="round" href="#harga">Harga</a></li>
    <li><a class="round" href="#tanya">Tanya</a></li>
  </ul>
  <div class="nav-right">
    <button class="theme round" type="button" id="theme" aria-label="Ganti ke mode gelap"><span class="i-sun">${I.sun}</span><span class="i-moon">${I.moon}</span></button>
    <a class="btn" href="#template">Lihat template</a>
  </div>
</nav>

<main id="top">
<div class="hero-wrap">${vista({ sym: 'vsA', cls: 'hero-back' })}<div class="rays" aria-hidden="true"></div>
<header class="hero container">
  <h1>Undangan pernikahan yang <span class="soft">dilukis</span> lapis demi lapis.</h1>
  <p class="lead">Lima lukisan siap pakai, dengan nama tiap tamu di undangannya.</p>
  <div class="hero-actions"><a class="btn" href="#template">Lihat template</a><a class="btn btn-glass" href="#harga">Lihat harga</a></div>
</header>
</div>

<section id="template" class="art-sec">
  ${backdrop('meadow', 1.4)}
<div class="container">
  <div class="sec-head">
    <h2>Lima lukisan siap pakai, masing-masing punya <span class="soft">ceritanya.</span></h2>
    <p>Taman, gunung, kota, pegunungan, dan pantai. Warnanya bisa diubah mengikuti dekorasi acaramu.</p>
  </div>
  <ul class="gallery">${gallery}</ul>
</div>
</section>

<section id="layanan" class="band" aria-labelledby="layanan-h">
  ${vista({ sym: 'vsB', cls: 'band-art', flip: true })}
  <div class="container">
    <div class="band-head glass">
      <h2 id="layanan-h">Dari undangan pertama terkirim sampai tamu <span class="soft">terakhir pulang.</span></h2>
      <p>Satu tim mengurus undangan, RSVP, buku tamu di pintu, dan siaran untuk keluarga yang jauh. Kamu cukup menghubungi satu kontak.</p>
    </div>
    <ul class="svc">
      <li class="glass"><h3>Tahu siapa yang membuka</h3><p class="what">Ingatkan yang belum, sekali ketuk.</p>
        <div class="demo"><div class="row"><b>Om Hendra</b><span class="ok">Dibuka</span></div><div class="row"><b>Tante Rina</b><span class="ok">Dibuka</span></div><div class="row"><b>Mas Yoga</b><span class="no-open">Belum</span></div></div></li>
      <li class="glass"><h3>Asisten RSVP</h3><p class="what">Tim kami menghubungi tamu dan menyusun meja.</p>
        <div class="demo"><div class="row"><b>Keluarga Wibowo</b><span class="ok">4 orang, meja 7</span></div></div></li>
      <li class="glass"><h3>Buku tamu QR</h3><p class="what">Pindai di pintu, langsung tahu meja.</p>
        <div class="demo"><div class="row">${QR}<div><b>Tante Rina</b><br>Meja 7</div></div></div></li>
      <li class="glass"><h3>Live streaming</h3><p class="what">Akad tayang di dalam undangan.</p>
        <div class="demo"><div class="mini">${miniStream}<span class="live">Tayang</span></div></div></li>
    </ul>
    <p class="demo-note">Nama di atas adalah contoh.</p>
  </div>
</section>

<section id="harga" class="art-sec" aria-labelledby="harga-h">
  ${backdrop('lake', 3.1)}
<div class="container">
  <div class="sec-head">
    <h2 id="harga-h">Harga lengkap, tanpa <span class="soft">harga coret.</span></h2>
    <p>Angka di bawah adalah yang kamu bayar, sudah termasuk revisi tanpa batas. Layanan hari H dipesan terpisah, sesuai kebutuhan.</p>
  </div>
  <div class="price-wrap panel"><div class="price-scroll">
    <table>
      <caption class="visually-hidden">Paket undangan</caption>
      <thead><tr><th scope="col">Undangan</th>
        <th scope="col"><span class="pk">Sketsa</span><span class="pp">Rp199rb</span></th>
        <th scope="col" class="pop"><span class="pk">Lukisan</span><span class="pp">Rp449rb</span></th>
        <th scope="col"><span class="pk">Mahakarya</span><span class="pp">Rp799rb</span></th></tr></thead>
      <tbody>
        ${[['Nama tamu dan RSVP', 1, 1, 1], ['Kirim lewat WhatsApp', '50 tamu', '200 tamu', '500 tamu'], ['Sesi akad dan resepsi', 0, 1, 1], ['Tahu siapa yang membuka', 0, 1, 1], ['Amplop digital', 0, 1, 1], ['Lukisan custom', 0, 0, 1], ['Masa aktif', '6 bulan', 'Selamanya', 'Selamanya']]
          .map(([l, a, b, c]) => `<tr><th scope="row">${l}</th>${[a, b, c].map((x, i) => `<td${i === 1 ? ' class="pop"' : ''}>${x === 1 ? I.check.replace('class="ico"', 'class="ico" role="img" aria-label="Termasuk"') : x === 0 ? `<span class="no">${I.dash.replace('class="ico"', 'class="ico" role="img" aria-label="Tidak termasuk"')}</span>` : x}</td>`).join('')}</tr>`).join('')}
      </tbody>
      <tfoot><tr><td></td><td><a class="btn btn-quiet" href="#template">Pilih Sketsa</a></td><td class="pop"><a class="btn" href="#template">Pilih Lukisan</a></td><td><a class="btn btn-quiet" href="#template">Pilih Mahakarya</a></td></tr></tfoot>
    </table>
  </div></div>
  <ul class="day panel">
    <li><h3>Asisten RSVP</h3><p>Tamu dihubungi tim kami.</p><span class="pp">Rp990rb</span></li>
    <li><h3>Buku tamu QR</h3><p>Dua tablet dan kru, 4 jam.</p><span class="pp">Rp1,79jt</span></li>
    <li><h3>Live streaming</h3><p>Dua jam, dua kamera.</p><span class="pp">Rp3,49jt</span></li>
    <li class="full"><h3>Paket utuh</h3><p>Mahakarya dan semua di atas.</p><span class="pp">Rp5,9jt</span></li>
  </ul>
  <p class="later">Koordinator hari H dan wedding organizer sedang kami siapkan.</p>
</div>
</section>

<section id="logo" class="art-sec" aria-labelledby="logo-h">
  ${backdrop('dusk', 5.5)}
<div class="container">
  <div class="sec-head">
    <h2 id="logo-h">Satu logo, dipakai dengan <span class="soft">cara yang sama.</span></h2>
    <p>Marmer lembut yang dipipihkan, satu pola di setiap ukuran.</p>
  </div>
  <div class="pack">
    <div class="tile big">${logo('lockup', 96, 7)}<p class="cap">Lockup utama</p></div>
    <div class="tile night">${logo('mark', 92, 7, 'Tanda Nawala')}<p class="cap">Tanda</p></div>
    <div class="tile peach">${logo('word', 56, 7, 'Wordmark Nawala')}<p class="cap">Wordmark</p></div>
    <div class="tile plain">${logo('mark', 56, 7, 'Tanda Nawala kecil')}<p class="cap">Ikon</p></div>
    <div class="tile night">${logo('word', 46, 7, 'Wordmark Nawala')}<p class="cap">Ukuran kecil</p></div>
  </div>
</div>
</section>

<section id="tanya" class="art-sec" aria-labelledby="tanya-h">
  ${backdrop('fields', 8.2)}
<div class="container">
  <div class="faq">
    <h2 id="tanya-h">Yang sering <span class="soft">ditanyakan.</span></h2>
    <div class="faq-list panel">
      ${[['Apakah harga di sini sudah final?', 'Ya. Tanpa harga coret, tanpa biaya tersembunyi.'], ['Bisa diisi sendiri atau dibuatkan?', 'Keduanya. Isi lewat editor, atau tim kami yang menyusun. Revisi tanpa batas.'], ['Bagaimana undangan dikirim?', 'Lewat WhatsApp dari dasbor, satu tautan per tamu.'], ['Layanan hari H tersedia di kota mana?', 'Bandung dan Jakarta dulu. Undangannya bisa dipakai di mana saja.']]
        .map(([q, a]) => `<details><summary>${q}${I.plus}</summary><p>${a}</p></details>`).join('')}
    </div>
  </div>
</div>
</section>

<section class="closing" aria-labelledby="close-h">
  ${vista({ sym: 'vsA', cls: 'closing-art', flip: true })}<div class="rays" aria-hidden="true"></div>
  <div class="container"><div class="closing-box glass">
    <h2 id="close-h">Pilih lukisanmu, tamu yang <span class="soft">menunggu.</span></h2>
    <a class="btn" href="#template">Lihat semua template</a>
  </div></div>
</section>
</main>

<footer>
  <div class="container foot">
    ${logo('lockup', 30, 7)}
    <ul><li><a href="#template">Template</a></li><li><a href="#layanan">Layanan</a></li><li><a href="#harga">Harga</a></li><li><a href="#tanya">Tanya</a></li></ul>
    <p>Nawala adalah nama kerja. Bandung dan Jakarta.</p>
  </div>
</footer>

<script>
(function () {
  var root = document.documentElement, btn = document.getElementById('theme');
  function label() { btn.setAttribute('aria-label', root.dataset.theme === 'dark' ? 'Ganti ke mode terang' : 'Ganti ke mode gelap'); }
  label();
  var picked = false;
  btn.addEventListener('click', function () {
    root.dataset.theme = root.dataset.theme === 'dark' ? 'light' : 'dark';
    try { localStorage.setItem('nawala-theme', root.dataset.theme); } catch (e) {}
    label();
    if (!picked) show(root.dataset.theme === 'dark' ? 'paris' : 'senja');
  });
  var tabs = [].slice.call(document.querySelectorAll('.tab'));
  function show(key) {
    document.querySelectorAll('.scene').forEach(function (s) { s.classList.toggle('on', s.dataset.scene === key); });
    tabs.forEach(function (t) { var on = t.dataset.tab === key; t.setAttribute('aria-selected', on); if (on) { document.getElementById('hc-n').textContent = t.dataset.couple; document.getElementById('hc-d').textContent = t.dataset.date; } });
  }
  tabs.forEach(function (t, i) {
    t.addEventListener('click', function () { picked = true; show(t.dataset.tab); });
    t.addEventListener('keydown', function (e) { var d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0; if (!d) return; var n = tabs[(i + d + tabs.length) % tabs.length]; n.focus(); n.click(); });
  });
  if (root.dataset.theme === 'dark') show('paris');
})();
</script>
</body>
</html>
`;
writeFileSync(new URL('./index.html', import.meta.url), html);
console.log('ok', (html.length / 1024).toFixed(0) + 'KB');
