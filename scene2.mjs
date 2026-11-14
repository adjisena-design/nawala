// Nawala scene v2: layered stippled wedding venue. node scene2.mjs -> art/{sky,land,clouds}-{day,night}.svg
import { writeFileSync, mkdirSync } from 'node:fs';
const W = 1600, H = 1000;
const rng = s => () => { s |= 0; s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
const f = n => (+n).toFixed(1);
function noise1(seed) { const r = rng(seed), a = Array.from({ length: 256 }, () => r()); return t => { const i = Math.floor(t), fr = t - i, s = fr * fr * (3 - 2 * fr); return a[i & 255] * (1 - s) + a[(i + 1) & 255] * s; }; }
export const SUN = [860, 548], PENDOPO = [740, 742], CRATER = [1066, 356];
export const PATH = [[812, 1010], [842, 958], [812, 905], [760, 862], [748, 818], [752, 780], [748, 760]];

const DAY = {
  sky: ['#B8D8F3', '#DDEDFA', '#FFEEDC', '#FFD7B4'], sun: '#FFC08A', glow: '#FFD3A8', star: 0,
  cloud: ['#FFFFFF', '#F6F8FC', '#E9EEF6', '#DCE3EE'], cloudShade: '#CFD9E8',
  range: ['#D3E0EF', '#C2D3E8', '#B2C7E1'], volc: ['#C9D9EC', '#AFC5E0', '#94B0D3', '#7F9DC5'], volc2: ['#BCD0E6', '#A3BCDA', '#8AA7CC'],
  far: ['#B5D3D6', '#93BEC2', '#76A8AE', '#5F959C'], mid: ['#BEDC9A', '#98C77C', '#74B068', '#539A5C', '#3F8552'],
  rice: [['#E4EDA0', '#CFE286', '#B4D36E', '#97C25C'], ['#D2E790', '#B5D878', '#96C666', '#7AB358'], ['#C0DE86', '#A1CE70', '#82BB60', '#68A655']],
  lip: '#5E9A52', water: '#DDF0FA', roof: ['#F6A873', '#EE8E55', '#E07A42', '#C96634'], roof2: ['#E98C6A', '#D9735A', '#C25E4C'], wall: '#FFF6EA', wall2: '#F3E6D6',
  city: ['#C9D6E4', '#B6C6D8', '#A2B5CB'], win: '#FFFFFF', dome: '#7FB9A8',
  post: '#FFF6EA', stone: ['#F6EADB', '#E9D8C3', '#D9C4AA'], janur: '#F2CF5E', light: '#FFE2A8', inner: '#FFE9C8', innerOp: 0,
  path: ['#FBEBD3', '#F3DCBD', '#E8CBA6'], trunk: '#8A6A4C', palm: ['#5FAE6A', '#3F9158', '#2C774A', '#1F5F3C'],
  leaf: ['#7CC074', '#57A861', '#3B8E52', '#2A7446'], banana: ['#8FCB6E', '#6DB55E', '#4F9B50'],
  fg: ['#7CC074', '#57A861', '#3B8E52', '#2A7446', '#1D5C3A'], flower: ['#FFFFFF', '#FFC9A8', '#FF9F80', '#FFD86B', '#F6A3B8'],
  kamboja: '#FFFDF4', kambojaC: '#FFD46A', groom: '#2E3F66', groomH: '#1E2A44', bride: '#FFFFFF', brideS: '#F3DCC6', skin: '#C98E6A', hair: '#2A1C14',
  guests: ['#F29E7A', '#7FA9D6', '#E9C46A', '#9CCB9A', '#D98CA6', '#FFFFFF', '#B39DDB'.replace('B39DDB', 'A3C4BC')], chair: '#FFFFFF',
  mist: '#FFF6EC', grainOp: .38,
};
const NIGHT = {
  sky: ['#050C1C', '#0B1A30', '#163450', '#2D5568'], sun: '#FFE9CC', glow: '#F0B080', star: 1,
  cloud: ['#2E4A6A', '#284262', '#223A58', '#1C324E'], cloudShade: '#182B44',
  range: ['#20395A', '#1A3150', '#152A46'], volc: ['#28456A', '#203B5C', '#1A3250', '#142944'], volc2: ['#223D60', '#1B3454', '#152C48'],
  far: ['#1B3F4C', '#163441', '#112B37', '#0D222D'], mid: ['#1F4A44', '#183E3A', '#123330', '#0D2927', '#09201F'],
  rice: [['#27574C', '#1F4A42', '#183E38', '#13332F'], ['#235046', '#1B443C', '#153833', '#102E2A'], ['#1F493F', '#183D36', '#12322D', '#0E2925']],
  lip: '#0C2422', water: '#3E7C8C', roof: ['#B4673E', '#9C5532', '#844628', '#6C391F'], roof2: ['#9C5A48', '#844B3C', '#6C3D31'], wall: '#F3D9B8', wall2: '#C9AE8C',
  city: ['#1E3550', '#1A2F48', '#152840'], win: '#FFD08A', dome: '#2E5A55',
  post: '#F3D9B8', stone: ['#C9AE8C', '#A88E70', '#8A7359'], janur: '#E9C766', light: '#FFD08A', inner: '#FFC98A', innerOp: .95,
  path: ['#3B5A5A', '#30494B', '#263C3F'], trunk: '#0E1A1A', palm: ['#1C4A42', '#143B36', '#0E2E2B', '#092221'],
  leaf: ['#1D4E44', '#153F38', '#0F312D', '#0A2523'], banana: ['#1F5246', '#18443B', '#123830'],
  fg: ['#1D4E44', '#153F38', '#0F312D', '#0A2523', '#061A19'], flower: ['#FFE6C8', '#FFC08A', '#9FD8D0', '#FFE08A', '#F2A7BC'],
  kamboja: '#F6EEDC', kambojaC: '#E9C766', groom: '#1B2740', groomH: '#121A2C', bride: '#F6EEE2', brideS: '#D9C2AA', skin: '#9C6A4E', hair: '#140D09',
  guests: ['#B8735A', '#4F7096', '#B09346', '#5E8A68', '#9C6078', '#D9CFC2', '#6F8C86'], chair: '#D9CFC2',
  mist: '#2D5568', grainOp: .3,
};

function painter(seedBase) {
  let clipN = 0; const defs = [];
  function region(d, tones, box, o = {}) {
    const id = 'c' + seedBase + '_' + (clipN++), r = rng(seedBase * 100 + clipN), area = (box[2] - box[0]) * (box[3] - box[1]);
    const rmin = o.rmin || 3, rmax = o.rmax || 7, n = o.n || Math.min(14000, Math.round(area / ((rmin + rmax) * (rmin + rmax) * .55))), T = tones.length, ds = tones.map(() => '');
    for (let i = 0; i < n; i++) {
      const x = box[0] + r() * (box[2] - box[0]), y = box[1] + r() * (box[3] - box[1]), rad = rmin + r() * (rmax - rmin);
      const t = (y - box[1]) / (box[3] - box[1]) * (o.vy ?? .7) + (x - box[0]) / (box[2] - box[0]) * (o.vx ?? .15) + (r() - .5) * (o.jit ?? .8) + (o.bias || 0);
      const k = Math.max(0, Math.min(T - 1, Math.floor(t * T)));
      ds[k] += `M${f(x - rad)},${f(y)}a${f(rad)},${f(rad * (.75 + r() * .4))} 0 1,0 ${f(2 * rad)},0a${f(rad)},${f(rad * .9)} 0 1,0 ${f(-2 * rad)},0`;
    }
    defs.push(`<clipPath id="${id}"><path d="${d}"/></clipPath>`);
    return `<g clip-path="url(#${id})"><path d="${d}" fill="${o.base ?? tones[Math.floor(T / 2)]}"/>${ds.map((dd, k) => `<path d="${dd}" fill="${tones[k]}" opacity="${o.op ?? .82}"/>`).join('')}</g>`;
  }
  return { region, defs };
}
const ridge = (seed, y, amp, fr, env, rough = 0) => { const n1 = noise1(seed), pts = []; for (let i = 0; i <= 120; i++) { const t = i / 120, x = -40 + (W + 80) * t; const h = (n1(t * fr) + .5 * n1(t * fr * 2.3 + 30) + rough * n1(t * fr * 7 + 70)) / (1.5 + rough); pts.push([x, y - amp * h * (env ? env(t) : 1)]); } return { d: 'M' + pts.map(p => f(p[0]) + ',' + f(p[1])).join(' L') + ` L${W + 40},${H + 20} L-40,${H + 20}Z`, yAt: x => { const u = (x + 40) / (W + 80) * 120, i = Math.max(0, Math.min(119, Math.floor(u))); return pts[i][1] + (pts[i + 1][1] - pts[i][1]) * (u - i); } }; };
const svgDoc = (defs, body) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}"><defs>${defs.join('')}</defs>${body}</svg>`;
const grain = op => `<filter id="grain" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" seed="3"/><feColorMatrix values="0 0 0 0 .5  0 0 0 0 .5  0 0 0 0 .5  0 0 0 1.4 -.35"/><feComposite in2="SourceGraphic" operator="in"/></filter>`;

/* ---------- SKY ---------- */
function sky(P) {
  const R = rng(9), defs = [`<linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${P.sky[0]}"/><stop offset=".35" stop-color="${P.sky[1]}"/><stop offset=".56" stop-color="${P.sky[2]}"/><stop offset=".7" stop-color="${P.sky[3]}"/></linearGradient>`,
    `<radialGradient id="glow"><stop offset="0" stop-color="${P.glow}" stop-opacity=".9"/><stop offset=".45" stop-color="${P.glow}" stop-opacity=".3"/><stop offset="1" stop-color="${P.glow}" stop-opacity="0"/></radialGradient>`];
  let b = `<rect width="${W}" height="${H}" fill="url(#sky)"/>`;
  if (P.star) for (let i = 0; i < 220; i++) b += `<circle cx="${f(R() * W)}" cy="${f(R() * 520)}" r="${f(.6 + R() * 1.5)}" fill="#FFF" opacity="${f(.2 + R() * .7)}"/>`;
  b += `<circle cx="${SUN[0]}" cy="${SUN[1]}" r="460" fill="url(#glow)"/><circle cx="${SUN[0]}" cy="${SUN[1]}" r="${P.star ? 42 : 58}" fill="${P.sun}"/>`;
  if (P.star) b += `<circle cx="${SUN[0] - 12}" cy="${SUN[1] - 8}" r="9" fill="#E9D3B6" opacity=".6"/><circle cx="${SUN[0] + 14}" cy="${SUN[1] + 12}" r="6" fill="#E9D3B6" opacity=".55"/>`;
  return svgDoc(defs, b);
}

/* ---------- CLOUDS (seamless horizontal tile, transparent) ---------- */
function clouds(P, seed, band) {
  const { region, defs } = painter(seed); const R = rng(seed); let b = '';
  const puff = (cx, cy, w) => {
    const h = w * .42, r2 = rng(Math.round(cx + cy)); let d = '';
    const n = 7, bumps = [];
    for (let i = 0; i < n; i++) { const t = i / (n - 1), x = cx - w / 2 + w * t, rr = h * (.35 + Math.sin(Math.PI * t) * .55) * (.8 + r2() * .35); bumps.push([x, cy - rr * .35, rr]); }
    bumps.forEach(([x, y, rr]) => { d += `M${f(x - rr)},${f(y)}a${f(rr)},${f(rr)} 0 1,0 ${f(2 * rr)},0a${f(rr)},${f(rr)} 0 1,0 ${f(-2 * rr)},0`; });
    d += `M${f(cx - w / 2)},${f(cy - h * .1)}h${f(w)}v${f(h * .28)}h${f(-w)}z`;
    return region(d, P.cloud, [cx - w / 2 - h, cy - h * 1.3, cx + w / 2 + h, cy + h * .3], { rmin: 3, rmax: 7, vy: 1, vx: .1, jit: .5 });
  };
  const list = band === 'far' ? [[200, 500, 250], [700, 470, 180], [1080, 520, 220], [1420, 460, 280]] : [[330, 230, 210], [1120, 170, 170], [1520, 290, 140]];
  for (const [x, y, w] of list) { b += puff(x, y, w); if (x + w / 2 + 120 > W) b += puff(x - W, y, w); if (x - w / 2 - 120 < 0) b += puff(x + W, y, w); }
  return svgDoc(defs, b);
}

/* ---------- LAND (transparent above the mountains) ---------- */
function land(P) {
  const { region, defs } = painter(P.star ? 71 : 31); const R = rng(P.star ? 72 : 32); const out = [];
  defs.push(`<linearGradient id="mist" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${P.mist}" stop-opacity="0"/><stop offset=".55" stop-color="${P.mist}" stop-opacity=".75"/><stop offset="1" stop-color="${P.mist}" stop-opacity="0"/></linearGradient>`,
    `<radialGradient id="inner"><stop offset="0" stop-color="${P.inner}" stop-opacity="1"/><stop offset="1" stop-color="${P.inner}" stop-opacity="0"/></radialGradient>`, grain());
  // far jagged range
  const rg = ridge(5, 620, 120, 9, null, .9); out.push(region(rg.d, P.range, [-40, 480, W + 40, 680], { rmin: 2.5, rmax: 5.5, vy: .9, jit: .6 }));
  // left volcano, main volcano
  out.push(region('M80,650 Q260,600 350,478 Q362,462 378,462 Q396,462 408,478 Q500,600 690,650 Z', P.volc2, [80, 462, 690, 650], { rmin: 3, rmax: 6, vy: .6, vx: .4, jit: .6 }));
  out.push(region(`M620,660 Q900,590 1030,376 Q1044,${CRATER[1]} ${CRATER[0]},${CRATER[1]} Q1090,${CRATER[1]} 1104,376 Q1230,585 1540,660 Z`, P.volc, [620, 352, 1540, 660], { rmin: 3, rmax: 7, vy: .55, vx: .45, jit: .6 }));
  // gullies on main volcano
  let gl = ''; for (let k = -4; k <= 4; k++) { if (!k) continue; gl += `M${f(CRATER[0] + k * 6)},${CRATER[1] + 30} Q${f(CRATER[0] + k * 26)},500 ${f(CRATER[0] + k * 62)},640`; }
  out.push(`<path d="${gl}" fill="none" stroke="${P.volc[3]}" stroke-width="3" opacity=".35" stroke-linecap="round"/>`);
  out.push(`<rect x="-40" y="560" width="${W + 80}" height="130" fill="url(#mist)"/>`);
  const far = ridge(11, 646, 80, 5); out.push(region(far.d, P.far, [-40, 556, W + 40, 720], { rmin: 3, rmax: 6.5, vy: .9 }));
  out.push(`<rect x="-40" y="616" width="${W + 80}" height="110" fill="url(#mist)" opacity=".5"/>`);
  // mid hills, higher at the sides
  const env = t => .2 + .8 * Math.pow(Math.abs(2 * t - 1), 1.3);
  const mid = ridge(23, 700, 210, 4, env); out.push(region(mid.d, P.mid, [-40, 480, W + 40, 790], { rmin: 4, rmax: 8.5, vy: .8, jit: .75 }));
  // village on the left crest: houses + mosque
  const house = (x, y, s, roof) => `<path d="M${f(x - 13 * s)},${f(y)}v${f(-15 * s)}h${f(26 * s)}v${f(15 * s)}z" fill="${P.wall}"/><path d="M${f(x - 17 * s)},${f(y - 13 * s)}L${f(x)},${f(y - 27 * s)}L${f(x + 17 * s)},${f(y - 13 * s)}z" fill="${roof}"/><rect x="${f(x - 3 * s)}" y="${f(y - 9 * s)}" width="${f(6 * s)}" height="${f(9 * s)}" fill="${roof}" opacity=".55"/>`;
  let vil = ''; [[70, 1], [118, 1.15], [168, .95], [214, 1.2], [262, 1], [306, 1.1]].forEach(([x, s], i) => { vil += house(x, mid.yAt(x) + 12, s, P.roof2[i % 3]); });
  const mx = 360, my = mid.yAt(360) + 14;
  vil += `<rect x="${mx - 24}" y="${f(my - 24)}" width="48" height="24" fill="${P.wall}"/><path d="M${mx - 20},${f(my - 24)} a20,18 0 0 1 40,0z" fill="${P.dome}"/><rect x="${mx + 30}" y="${f(my - 58)}" width="7" height="58" fill="${P.wall2}"/><path d="M${mx + 28},${f(my - 58)} l5.5,-10 l5.5,10z" fill="${P.dome}"/>`;
  out.push(vil);
  // hilltop town on the right crest
  let town = '', tw = ''; const tr = rng(4);
  for (let x = 1250; x < 1590;) { const bw = 18 + tr() * 22, bh = 26 + tr() * 62, base = mid.yAt(x + bw / 2) + 16, top = base - bh, tone = P.city[Math.floor(tr() * 3)];
    town += `<rect x="${f(x)}" y="${f(top)}" width="${f(bw)}" height="${f(bh + 6)}" fill="${tone}"/>`;
    for (let wy = top + 6; wy < base - 6; wy += 9) for (let wx = x + 4; wx < x + bw - 5; wx += 7) if (tr() > .55) tw += `M${f(wx)},${f(wy)}h3v4h-3z`;
    x += bw + 3; }
  town += `<rect x="1420" y="${f(mid.yAt(1420) - 110)}" width="6" height="110" fill="${P.city[2]}"/><circle cx="1423" cy="${f(mid.yAt(1420) - 112)}" r="7" fill="${P.city[1]}"/>`;
  out.push(town, `<path d="${tw}" fill="${P.win}" opacity="${P.star ? .9 : .55}"/>`);
  // round shade trees along the crests
  const blob = (x, y, r, tones) => region(`M${f(x - r)},${f(y)}a${f(r)},${f(r * .9)} 0 1,1 ${f(2 * r)},0a${f(r)},${f(r * .9)} 0 1,1 ${f(-2 * r)},0`, tones, [x - r, y - r, x + r, y + r], { rmin: 2.5, rmax: 5, vy: .9, jit: .6 });
  for (const x of [40, 140, 240, 330, 1230, 1330, 1470, 1560]) { const y = mid.yAt(x) + 22; out.push(`<rect x="${x - 2}" y="${f(y)}" width="4" height="14" fill="${P.trunk}"/>`, blob(x, y - 4, 16 + R() * 8, P.leaf)); }
  // rice terraces
  const yT = (k, x) => 708 + k * 36 + 16 * Math.sin(x / 250 + k * .9) + 8 * Math.sin(x / 90 + k * 2.1) - Math.pow(Math.abs(x - 800) / 800, 2) * 40;
  const curve = k => { let d = ''; for (let x = -40; x <= W + 40; x += 20) d += (d ? ' L' : 'M') + x + ',' + f(yT(k, x)); return d; };
  for (let k = 0; k < 8; k++) {
    out.push(region(curve(k) + ` L${W + 40},${H + 20} L-40,${H + 20}Z`, P.rice[k % 3], [-40, 668 + k * 36, W + 40, 768 + k * 36], { rmin: 2.5, rmax: 5.5, vy: .5, jit: .9 }));
    out.push(`<path d="${curve(k)}" fill="none" stroke="${P.lip}" stroke-width="3" opacity=".55"/>`);
    if (k % 2) out.push(`<path d="${curve(k)}" fill="none" stroke="${P.water}" stroke-width="5" opacity=".7" transform="translate(0,7)" stroke-dasharray="${f(120 + R() * 200)} ${f(60 + R() * 160)}"/>`);
  }
  // palms in the middle distance
  function palm(x, y, h, lean, sc) {
    const tx = x + lean, ty = y - h, r = rng(Math.round(x * 7 + h)); let o = `<path d="M${f(x)},${f(y)} Q${f(x + lean * .15)},${f(y - h * .55)} ${f(tx)},${f(ty)}" fill="none" stroke="${P.trunk}" stroke-width="${f(11 * sc)}" stroke-linecap="round"/>`;
    [-170, -140, -105, -70, -40, -10, 20, 200, 225].forEach((deg, i) => { const a = deg * Math.PI / 180 + (r() - .5) * .2, L = h * (.34 + r() * .12), ex = tx + Math.cos(a) * L, ey = ty + Math.sin(a) * L * .7 + L * .32, cx = tx + Math.cos(a) * L * .55, cy = ty + Math.sin(a) * L * .7 - L * .22, tone = P.palm[i % 4];
      o += `<path d="M${f(tx)},${f(ty)} Q${f(cx)},${f(cy)} ${f(ex)},${f(ey)}" fill="none" stroke="${tone}" stroke-width="${f(7 * sc)}" stroke-linecap="round"/>`;
      let lf = ''; for (let k = 1; k <= 11; k++) { const t = k / 12, u = 1 - t, qx = u * u * tx + 2 * u * t * cx + t * t * ex, qy = u * u * ty + 2 * u * t * cy + t * t * ey, ll = L * .3 * Math.sin(Math.PI * Math.min(1, t * 1.15)); lf += `M${f(qx)},${f(qy)}l${f((r() - .5) * 8 * sc)},${f(ll)}`; }
      o += `<path d="${lf}" fill="none" stroke="${tone}" stroke-width="${f(4.2 * sc)}" stroke-linecap="round"/>`; });
    return o;
  }
  out.push(palm(470, 770, 150, -14, .45), palm(1010, 772, 160, 16, .5), palm(1060, 780, 115, 8, .4), palm(400, 780, 110, -8, .38), palm(1180, 790, 130, 12, .42));
  // kamboja (frangipani) trees
  function kamboja(x, y, s) {
    let o = `<path d="M${x},${y} q${f(-4 * s)},${f(-30 * s)} ${f(-22 * s)},${f(-52 * s)} M${f(x - 3 * s)},${f(y - 24 * s)} q${f(10 * s)},${f(-16 * s)} ${f(28 * s)},${f(-30 * s)} M${f(x - 10 * s)},${f(y - 40 * s)} q${f(8 * s)},${f(-14 * s)} ${f(6 * s)},${f(-30 * s)}" fill="none" stroke="${P.trunk}" stroke-width="${f(5 * s)}" stroke-linecap="round"/>`;
    for (const [dx, dy, r] of [[-22, -56, 16], [26, -56, 15], [-4, -74, 17], [8, -60, 13]]) o += blob(x + dx * s, y + dy * s, r * s, P.leaf);
    const fr = rng(Math.round(x + y)); for (let i = 0; i < 26; i++) { const a = fr() * Math.PI * 2, rr = fr() * 24 * s, fx = x + Math.cos(a) * rr * 1.4, fy = y - 62 * s + Math.sin(a) * rr * .8; o += `<circle cx="${f(fx)}" cy="${f(fy)}" r="${f(2.6 * s)}" fill="${P.kamboja}"/><circle cx="${f(fx)}" cy="${f(fy)}" r="${f(1 * s)}" fill="${P.kambojaC}"/>`; }
    return o;
  }
  // banana plants
  function banana(x, y, s) {
    let o = `<path d="M${x},${y} v${f(-46 * s)}" stroke="${P.banana[2]}" stroke-width="${f(6 * s)}" stroke-linecap="round"/>`;
    for (const [a, L] of [[-150, 44], [-115, 50], [-70, 52], [-30, 46], [-95, 40]]) { const rad = a * Math.PI / 180, ex = x + Math.cos(rad) * L * s, ey = y - 46 * s + Math.sin(rad) * L * s * .8 + 10 * s;
      o += `<path d="M${x},${f(y - 46 * s)} Q${f((x + ex) / 2 + Math.sin(rad) * 6 * s)},${f((y - 46 * s + ey) / 2 - 14 * s)} ${f(ex)},${f(ey)} Q${f((x + ex) / 2)},${f((y - 46 * s + ey) / 2 + 4 * s)} ${x},${f(y - 40 * s)}Z" fill="${P.banana[a % 2 ? 0 : 1]}"/>`; }
    return o;
  }
  out.push(kamboja(560, 836, 1.1), kamboja(985, 840, 1.15), kamboja(1150, 870, 1.3), banana(430, 860, 1.2), banana(1240, 880, 1.25), banana(360, 900, 1.4));
  // guest path (centre line PATH) widening toward the viewer
  const Lp = [], Rp = []; PATH.forEach(([x, y], i) => { const w = 10 + (1010 - y) * -0 + (y - 740) * .3; Lp.push([x - w, y]); Rp.push([x + w, y]); });
  const pd = 'M' + Lp.map(p => p.map(f).join(',')).join(' L') + ' L' + Rp.reverse().map(p => p.map(f).join(',')).join(' L') + 'Z';
  out.push(region(pd, P.path, [700, 740, 960, 1020], { rmin: 2.5, rmax: 5, jit: 1 }));
  // seated guests on both sides of the path
  const guest = (x, y, s, c) => `<rect x="${f(x - 5 * s)}" y="${f(y - 2 * s)}" width="${f(10 * s)}" height="${f(7 * s)}" rx="${f(1.5 * s)}" fill="${P.chair}"/><path d="M${f(x - 4 * s)},${f(y)} q0,${f(-10 * s)} ${f(4 * s)},${f(-10 * s)} q${f(4 * s)},0 ${f(4 * s)},${f(10 * s)}z" fill="${c}"/><circle cx="${x}" cy="${f(y - 13 * s)}" r="${f(3.2 * s)}" fill="${P.skin}"/><path d="M${f(x - 3.4 * s)},${f(y - 14 * s)} a${f(3.4 * s)},${f(3.4 * s)} 0 0 1 ${f(6.8 * s)},0z" fill="${P.hair}"/>`;
  let gs = ''; let gi = 0;
  for (let row = 0; row < 3; row++) { const y = 806 + row * 24, s = 1 + row * .14;
    for (let c = 0; c < 6; c++) { gs += guest(560 + row * -14 + c * 24 * s, y, s, P.guests[gi++ % P.guests.length]); gs += guest(800 + row * 18 + c * 24 * s, y + 4, s, P.guests[gi++ % P.guests.length]); } }
  out.push(gs);
  // pendopo (joglo) with bride and groom
  const [PX, PY] = PENDOPO, s = 1.9, px = x => f(PX + x * s), py = y => f(PY + y * s);
  out.push(`<circle cx="${PX}" cy="${f(PY - 40 * s)}" r="${150 * s}" fill="url(#inner)" opacity="${P.innerOp * .55}"/>`);
  out.push(`<path d="M${px(-76)},${py(0)} L${px(76)},${py(0)} L${px(84)},${py(10)} L${px(-84)},${py(10)}Z" fill="${P.stone[1]}"/><path d="M${px(-68)},${py(-8)} L${px(68)},${py(-8)} L${px(76)},${py(0)} L${px(-76)},${py(0)}Z" fill="${P.stone[0]}"/>`);
  out.push(`<rect x="${px(-58)}" y="${py(-64)}" width="${f(116 * s)}" height="${f(56 * s)}" fill="${P.inner}" opacity="${P.innerOp}"/>`);
  // backdrop drape
  out.push(`<path d="M${px(-30)},${py(-62)} h${f(60 * s)} v${f(52 * s)} h${f(-60 * s)}z" fill="${P.wall}" opacity=".9"/><path d="M${px(-30)},${py(-62)} q${f(30 * s)},${f(14 * s)} ${f(60 * s)},0" fill="none" stroke="${P.flower[1]}" stroke-width="${f(3 * s)}"/>`);
  for (const x of [-60, -36, 36, 60]) out.push(`<rect x="${px(x - 2.6)}" y="${py(-66)}" width="${f(5.2 * s)}" height="${f(58 * s)}" fill="${P.post}"/>`);
  // groom (left) and bride (right)
  const g = (x, y) => `<path d="M${px(x - 5)},${py(y)} v${f(-16 * s)} q0,${f(-5 * s)} ${f(5 * s)},${f(-5 * s)} q${f(5 * s)},0 ${f(5 * s)},${f(5 * s)} v${f(16 * s)}z" fill="${P.groom}"/><circle cx="${px(x)}" cy="${py(y - 25)}" r="${f(3.6 * s)}" fill="${P.skin}"/><path d="M${px(x - 3.8)},${py(y - 26)} a${f(3.8 * s)},${f(3.4 * s)} 0 0 1 ${f(7.6 * s)},0z" fill="${P.groomH}"/>`;
  const bdr = (x, y) => `<path d="M${px(x - 7)},${py(y)} q${f(2 * s)},${f(-14 * s)} ${f(3 * s)},${f(-17 * s)} q${f(4 * s)},${f(-5 * s)} ${f(8 * s)},0 q${f(1 * s)},${f(3 * s)} ${f(3 * s)},${f(17 * s)}z" fill="${P.bride}"/><path d="M${px(x - 4)},${py(y - 17)} q${f(4 * s)},${f(4 * s)} ${f(8 * s)},0" fill="none" stroke="${P.brideS}" stroke-width="${f(1.4 * s)}"/><circle cx="${px(x)}" cy="${py(y - 24)}" r="${f(3.4 * s)}" fill="${P.skin}"/><circle cx="${px(x)}" cy="${py(y - 28)}" r="${f(3 * s)}" fill="${P.hair}"/><path d="M${px(x + 2)},${py(y - 28)} q${f(5 * s)},${f(8 * s)} ${f(3 * s)},${f(26 * s)}" fill="none" stroke="${P.bride}" stroke-width="${f(2.4 * s)}" opacity=".85"/>`;
  out.push(g(-8, -8), bdr(9, -8));
  for (const x of [-12, 12]) out.push(`<rect x="${px(x - 2.6)}" y="${py(-66)}" width="${f(5.2 * s)}" height="${f(58 * s)}" fill="${P.post}" opacity=".0"/>`);
  out.push(region(`M${px(-96)},${py(-62)} Q${px(0)},${py(-72)} ${px(96)},${py(-62)} L${px(52)},${py(-98)} L${px(-52)},${py(-98)}Z`, P.roof, [PX - 96 * s, PY - 98 * s, PX + 96 * s, PY - 62 * s], { rmin: 2, rmax: 4.5, vy: .9, jit: .7 }));
  out.push(region(`M${px(-56)},${py(-96)} L${px(56)},${py(-96)} L${px(20)},${py(-142)} L${px(-20)},${py(-142)}Z`, P.roof, [PX - 56 * s, PY - 142 * s, PX + 56 * s, PY - 96 * s], { rmin: 2, rmax: 4.5, vy: .9, jit: .7 }));
  out.push(`<path d="M${px(-22)},${py(-142)} L${px(22)},${py(-142)} L${px(18)},${py(-148)} L${px(-18)},${py(-148)}Z" fill="${P.roof[3]}"/>`);
  // garland and lights along the eave
  let li = ''; for (let i = 0; i <= 18; i++) { const t = i / 18, x = -92 + 184 * t, y = -60 + Math.sin(t * Math.PI * 4) ** 2 * 7; li += `<circle cx="${px(x)}" cy="${py(y)}" r="${f((i % 2 ? 1.6 : 2.4) * s)}" fill="${i % 2 ? P.light : P.flower[(i / 2 | 0) % 5]}"/>`; }
  out.push(li);
  // janur on the front posts
  for (const sd of [-1, 1]) { const bx = sd * 48; let j = `<path d="M${px(bx)},${py(-6)} Q${px(bx + sd * 2)},${py(-70)} ${px(bx - sd * 16)},${py(-92)}" fill="none" stroke="${P.janur}" stroke-width="${f(2 * s)}" stroke-linecap="round"/>`;
    for (let i = 0; i < 6; i++) { const t = .45 + i * .1, x = bx + sd * 2 * t - sd * 18 * Math.max(0, t - .5) * 2, y = -6 - 86 * t; j += `<path d="M${px(x)},${py(y)} q${f(-sd * 4 * s)},${f(6 * s)} ${f(-sd * 2 * s)},${f(14 * s)}" fill="none" stroke="${P.janur}" stroke-width="${f(1.3 * s)}" stroke-linecap="round"/>`; }
    out.push(j); }
  // penjor poles along the path
  const penjor = (x, y, h, dir) => { let o = `<path d="M${x},${y} q${f(dir * 6)},${f(-h * .7)} ${f(dir * h * .35)},${f(-h)}" fill="none" stroke="${P.janur}" stroke-width="3.2" stroke-linecap="round"/>`;
    const tx = x + dir * h * .35, ty = y - h; o += `<path d="M${f(tx)},${f(ty)} q${f(dir * 10)},${f(6)} ${f(dir * 8)},${f(22)} M${f(tx)},${f(ty)} q${f(dir * 2)},8 ${f(dir * 2)},26" fill="none" stroke="${P.janur}" stroke-width="2.4" stroke-linecap="round"/><circle cx="${f(tx + dir * 8)}" cy="${f(ty + 24)}" r="3.4" fill="${P.flower[2]}"/>`;
    for (let i = 1; i < 6; i++) { const t = i / 6, qx = x + dir * h * .35 * t * t, qy = y - h * t; o += `<path d="M${f(qx)},${f(qy)} l${f(-dir * 7)},6" stroke="${P.janur}" stroke-width="2" stroke-linecap="round"/>`; }
    return o; };
  out.push(penjor(700, 860, 120, 1), penjor(870, 870, 120, -1), penjor(668, 930, 170, 1), penjor(905, 945, 175, -1));
  // flower gate at the path entrance
  const gx = 828, gy = 962, gw = 72, gh = 120; let gate = `<path d="M${gx - gw},${gy} v${-gh * .7} a${gw},${gh * .45} 0 0 1 ${gw * 2},0 v${gh * .7}" fill="none" stroke="${P.wall}" stroke-width="9"/>`;
  const gr = rng(77); for (let i = 0; i < 90; i++) { const t = gr(); let x, y; if (t < .3) { x = gx - gw; y = gy - gr() * gh * .7; } else if (t < .6) { x = gx + gw; y = gy - gr() * gh * .7; } else { const a = Math.PI + gr() * Math.PI; x = gx + Math.cos(a) * gw; y = gy - gh * .7 + Math.sin(a) * gh * .45; }
    gate += `<circle cx="${f(x + (gr() - .5) * 12)}" cy="${f(y + (gr() - .5) * 10)}" r="${f(3 + gr() * 4)}" fill="${i % 4 === 0 ? P.leaf[1] : P.flower[i % 5]}"/>`; }
  out.push(gate);
  // foreground mounds, bushes, flowers
  const fenv = t => .14 + .86 * Math.pow(Math.abs(2 * t - 1), 1.5);
  const fg = ridge(41, 975, 240, 3, fenv);
  out.push(region(fg.d, P.fg, [-40, 700, W + 40, H + 20], { rmin: 5, rmax: 11, vy: .75 }));
  let bush = ''; for (const [x, r] of [[560, 34], [640, 26], [1000, 30], [1080, 38], [470, 30], [1170, 28]]) { const y = Math.max(fg.yAt(x) + 10, 960); bush += blob(x, y, r, P.leaf); }
  out.push(bush);
  let fl = ''; for (let i = 0; i < 460; i++) { const x = R() * W, yy = fg.yAt(x) + 8 + R() * 140; if (yy > H + 4) continue; const c = P.flower[i % 5], rr = 2.4 + R() * 3.4; fl += i % 7 === 0 ? `<g fill="${c}">${[0, 1, 2, 3, 4].map(k => `<circle cx="${f(x + Math.cos(k * 1.256) * rr)}" cy="${f(yy + Math.sin(k * 1.256) * rr)}" r="${f(rr * .7)}"/>`).join('')}<circle cx="${f(x)}" cy="${f(yy)}" r="${f(rr * .5)}" fill="${P.kambojaC}"/></g>` : `<circle cx="${f(x)}" cy="${f(yy)}" r="${f(rr)}" fill="${c}" opacity=".95"/>`; }
  out.push(fl);
  return svgDoc(defs, out.join(''));
}
mkdirSync(new URL('./art', import.meta.url), { recursive: true });
for (const [n, P] of [['day', DAY], ['night', NIGHT]]) {
  writeFileSync(new URL(`./art/sky-${n}.svg`, import.meta.url), sky(P));
  writeFileSync(new URL(`./art/land-${n}.svg`, import.meta.url), land(P));
  writeFileSync(new URL(`./art/cloudfar-${n}.svg`, import.meta.url), clouds(P, n === 'day' ? 5 : 15, 'far'));
  writeFileSync(new URL(`./art/cloudnear-${n}.svg`, import.meta.url), clouds(P, n === 'day' ? 6 : 16, 'near'));
}
console.log('layers written');
