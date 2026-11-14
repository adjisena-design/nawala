// Nawala scene: stippled Indonesian wedding landscape. node scene.mjs -> art/day.svg, art/night.svg
import { writeFileSync } from 'node:fs';
const W = 1600, H = 1000;
const rng = s => () => { s |= 0; s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
const f = n => (+n).toFixed(1);
function noise1(seed) { const r = rng(seed), a = Array.from({ length: 256 }, () => r()); return t => { const i = Math.floor(t), fr = t - i, s = fr * fr * (3 - 2 * fr); return a[i & 255] * (1 - s) + a[(i + 1) & 255] * s; }; }

const DAY = {
  sky: ['#BFDDF5', '#E3F0FA', '#FFEFDD', '#FFD9B8'], sun: '#FFC08A', glow: '#FFD3A8', cloud: '#FFFFFF', ray: '#FFFFFF',
  volc: ['#C4D6EA', '#A9C1DE', '#8FADD0', '#7A9BC2'], far: ['#B5D3D6', '#93BEC2', '#76A8AE', '#5F959C'],
  mid: ['#BEDC9A', '#98C77C', '#74B068', '#539A5C', '#3F8552'],
  rice: [['#E4EDA0', '#CFE286', '#B4D36E', '#97C25C'], ['#D2E790', '#B5D878', '#96C666', '#7AB358'], ['#C0DE86', '#A1CE70', '#82BB60', '#68A655']],
  lip: '#5E9A52', water: '#DDF0FA', roof: ['#F6A873', '#EE8E55', '#E07A42', '#C96634'], post: '#FFF6EA', stone: ['#F6EADB', '#E9D8C3', '#D9C4AA'],
  janur: '#F4D56A', light: '#FFE2A8', inner: '#FFE9C8', innerOp: 0,
  path: ['#FBEBD3', '#F3DCBD', '#E8CBA6'], trunk: '#8A6A4C', palm: ['#5FAE6A', '#3F9158', '#2C774A', '#1F5F3C'],
  fg: ['#7CC074', '#57A861', '#3B8E52', '#2A7446', '#1D5C3A'], flower: ['#FFFFFF', '#FFD0B0', '#FFB38A'], mist: '#FFF6EC', grainOp: .4, star: 0, rayOp: 1,
};
const NIGHT = {
  sky: ['#050C1C', '#0B1A30', '#163450', '#2D5568'], sun: '#FFE9CC', glow: '#F0B080', cloud: '#2A4868', ray: '#FFD9B0',
  volc: ['#24405E', '#1C3550', '#162B44', '#112238'], far: ['#1B3F4C', '#163441', '#112B37', '#0D222D'],
  mid: ['#1F4A44', '#183E3A', '#123330', '#0D2927', '#09201F'],
  rice: [['#27574C', '#1F4A42', '#183E38', '#13332F'], ['#235046', '#1B443C', '#153833', '#102E2A'], ['#1F493F', '#183D36', '#12322D', '#0E2925']],
  lip: '#0C2422', water: '#3E7C8C', roof: ['#B4673E', '#9C5532', '#844628', '#6C391F'], post: '#F3D9B8', stone: ['#C9AE8C', '#A88E70', '#8A7359'],
  janur: '#E9C766', light: '#FFD08A', inner: '#FFC98A', innerOp: .95,
  path: ['#3B5A5A', '#30494B', '#263C3F'], trunk: '#0E1A1A', palm: ['#1C4A42', '#143B36', '#0E2E2B', '#092221'],
  fg: ['#1D4E44', '#153F38', '#0F312D', '#0A2523', '#061A19'], flower: ['#FFE6C8', '#FFC08A', '#9FD8D0'], mist: '#2D5568', grainOp: .3, star: 1, rayOp: .4,
};

function build(P, seedBase = 5) {
  let clipN = 0; const defs = [], out = [];
  const R = rng(seedBase);
  // region with dabs: d = closed path, box = [x0,y0,x1,y1], tones light->dark
  function region(d, tones, box, o = {}) {
    const id = 'c' + (clipN++), r = rng(seedBase * 100 + clipN), n = o.n || 800, rmin = o.rmin || 3, rmax = o.rmax || 7, T = tones.length;
    const ds = tones.map(() => '');
    for (let i = 0; i < n; i++) {
      const x = box[0] + r() * (box[2] - box[0]), y = box[1] + r() * (box[3] - box[1]);
      const rad = rmin + r() * (rmax - rmin);
      let t = (y - box[1]) / (box[3] - box[1]) * (o.vy ?? .7) + (x - box[0]) / (box[2] - box[0]) * (o.vx ?? .15) + (r() - .5) * (o.jit ?? .8) + (o.bias || 0);
      const k = Math.max(0, Math.min(T - 1, Math.floor(t * T)));
      ds[k] += `M${f(x - rad)},${f(y)}a${f(rad)},${f(rad * (.75 + r() * .4))} 0 1,0 ${f(2 * rad)},0a${f(rad)},${f(rad * .9)} 0 1,0 ${f(-2 * rad)},0`;
    }
    defs.push(`<clipPath id="${id}"><path d="${d}"/></clipPath>`);
    const base = o.base ?? tones[Math.floor(T / 2)];
    return `<g clip-path="url(#${id})"><path d="${d}" fill="${base}"/>${ds.map((dd, k) => `<path d="${dd}" fill="${tones[k]}" opacity="${o.op ?? .82}"/>`).join('')}</g>`;
  }
  const ridge = (seed, y, amp, fr, env) => { const n1 = noise1(seed), pts = []; for (let i = 0; i <= 80; i++) { const t = i / 80, x = -40 + (W + 80) * t; const h = (n1(t * fr) + .5 * n1(t * fr * 2.3 + 30)) / 1.5; pts.push([x, y - amp * h * (env ? env(t) : 1)]); } return { d: 'M' + pts.map(p => f(p[0]) + ',' + f(p[1])).join(' L') + ` L${W + 40},${H + 20} L-40,${H + 20}Z`, yAt: x => { const u = (x + 40) / (W + 80) * 80, i = Math.max(0, Math.min(79, Math.floor(u))); return pts[i][1] + (pts[i + 1][1] - pts[i][1]) * (u - i); } }; };

  // sky
  defs.push(`<linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${P.sky[0]}"/><stop offset=".35" stop-color="${P.sky[1]}"/><stop offset=".56" stop-color="${P.sky[2]}"/><stop offset=".68" stop-color="${P.sky[3]}"/></linearGradient>`,
    `<radialGradient id="glow"><stop offset="0" stop-color="${P.glow}" stop-opacity=".95"/><stop offset=".45" stop-color="${P.glow}" stop-opacity=".35"/><stop offset="1" stop-color="${P.glow}" stop-opacity="0"/></radialGradient>`,
    `<linearGradient id="mist" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${P.mist}" stop-opacity="0"/><stop offset=".55" stop-color="${P.mist}" stop-opacity=".8"/><stop offset="1" stop-color="${P.mist}" stop-opacity="0"/></linearGradient>`,
    `<radialGradient id="inner"><stop offset="0" stop-color="${P.inner}" stop-opacity="1"/><stop offset="1" stop-color="${P.inner}" stop-opacity="0"/></radialGradient>`,
    `<filter id="grain" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" seed="3"/><feColorMatrix values="0 0 0 0 .5  0 0 0 0 .5  0 0 0 0 .5  0 0 0 1.4 -.35"/></filter>`,
    `<filter id="soft"><feGaussianBlur stdDeviation="1.1"/></filter><filter id="blur8"><feGaussianBlur stdDeviation="8"/></filter>`);
  out.push(`<rect width="${W}" height="${H}" fill="url(#sky)"/>`);
  if (P.star) { let s = ''; for (let i = 0; i < 160; i++) { const x = R() * W, y = R() * 480, r = .6 + R() * 1.4; s += `<circle cx="${f(x)}" cy="${f(y)}" r="${f(r)}" fill="#FFF" opacity="${f(.25 + R() * .6)}"/>`; } out.push(s); }
  const SX = 860, SY = 548;
  out.push(`<circle cx="${SX}" cy="${SY}" r="520" fill="url(#glow)"/>`);
  // rays
  let rays = ''; for (let i = 0; i < 14; i++) { const a = Math.PI * (1.02 + i * .074 + (R() - .5) * .03), w = .012 + R() * .02, L = 1100; rays += `<path d="M${SX},${SY} L${f(SX + Math.cos(a - w) * L)},${f(SY + Math.sin(a - w) * L)} L${f(SX + Math.cos(a + w) * L)},${f(SY + Math.sin(a + w) * L)}Z" fill="${P.ray}" opacity="${f(.05 + R() * .07)}"/>`; }
  out.push(`<g filter="url(#blur8)" opacity="${P.rayOp}">${rays}</g>`, `<circle cx="${SX}" cy="${SY}" r="${P.star ? 40 : 56}" fill="${P.sun}"/>`);
  // streak clouds
  let cl = ''; for (let i = 0; i < 9; i++) { const x = R() * W, y = 150 + R() * 300, w = 160 + R() * 320; cl += `<rect x="${f(x - w / 2)}" y="${f(y)}" width="${f(w)}" height="${f(5 + R() * 7)}" rx="6" fill="${P.cloud}" opacity="${f(.3 + R() * .35)}"/>`; }
  out.push(`<g filter="url(#soft)">${cl}</g>`);
  // volcano
  out.push(region('M620,660 Q900,590 1030,372 Q1044,352 1066,352 Q1090,352 1104,372 Q1230,585 1540,660 Z', P.volc, [620, 352, 1540, 660], { n: 2600, rmin: 3, rmax: 7, vy: .55, vx: .45, jit: .6 }));
  out.push(`<rect x="-40" y="560" width="${W + 80}" height="130" fill="url(#mist)" opacity=".9"/>`);
  // far hills
  const far = ridge(11, 640, 90, 5); out.push(region(far.d, P.far, [-40, 540, W + 40, 720], { n: 5200, rmin: 3, rmax: 7, vy: .9, jit: .7 }));
  out.push(`<rect x="-40" y="610" width="${W + 80}" height="110" fill="url(#mist)" opacity=".55"/>`);
  // mid forested hills, higher at the sides
  const env = t => .25 + .75 * Math.pow(Math.abs(2 * t - 1), 1.2);
  const mid = ridge(23, 694, 260, 4, env); out.push(region(mid.d, P.mid, [-40, 430, W + 40, 780], { n: 12000, rmin: 4, rmax: 9, vy: .8, jit: .75 }));
  // rice terraces
  const yT = (k, x) => 700 + k * 36 + 16 * Math.sin(x / 250 + k * .9) + 8 * Math.sin(x / 90 + k * 2.1) + Math.pow(Math.abs(x - 800) / 800, 2) * -40;
  const curve = k => { let d = ''; for (let x = -40; x <= W + 40; x += 20) d += (d ? ' L' : 'M') + x + ',' + f(yT(k, x)); return d; };
  for (let k = 0; k < 8; k++) {
    const d = curve(k) + ` L${W + 40},${H + 20} L-40,${H + 20}Z`;
    out.push(region(d, P.rice[k % 3], [-40, 660 + k * 36, W + 40, 760 + k * 36], { n: 2600, rmin: 2.5, rmax: 6, vy: .5, jit: .9, clip: 1 }));
    out.push(`<path d="${curve(k)}" fill="none" stroke="${P.lip}" stroke-width="3" opacity=".55"/>`);
    if (k % 2 === 1) out.push(`<path d="${curve(k)}" fill="none" stroke="${P.water}" stroke-width="5" opacity=".7" transform="translate(0,7)" stroke-dasharray="${f(120 + R() * 200)} ${f(60 + R() * 160)}"/>`);
  }
  // path from pendopo to foreground
  const PX = 690, PY = 742;
  out.push(region(`M${PX - 34},${PY} C${PX - 60},820 ${PX + 120},850 ${PX + 60},930 C${PX + 30},970 ${PX - 60},990 ${PX - 110},1020 L${PX + 150},1020 C${PX + 170},980 ${PX + 210},940 ${PX + 190},900 C${PX + 170},850 ${PX + 30},810 ${PX + 34},${PY}Z`, P.path, [PX - 120, PY, PX + 220, 1020], { n: 900, rmin: 2.5, rmax: 5, jit: 1 }));
  // pendopo (joglo)
  const s = 1.7, px = x => f(PX + x * s), py = y => f(PY + y * s);
  out.push(`<circle cx="${PX}" cy="${f(PY - 40 * s)}" r="${150 * s}" fill="url(#inner)" opacity="${P.innerOp * .55}"/>`);
  out.push(`<path d="M${px(-76)},${py(0)} L${px(76)},${py(0)} L${px(84)},${py(10)} L${px(-84)},${py(10)}Z" fill="${P.stone[1]}"/><path d="M${px(-68)},${py(-8)} L${px(68)},${py(-8)} L${px(76)},${py(0)} L${px(-76)},${py(0)}Z" fill="${P.stone[0]}"/>`);
  out.push(`<rect x="${px(-58)}" y="${py(-64)}" width="${f(116 * s)}" height="${f(56 * s)}" fill="${P.inner}" opacity="${P.innerOp}"/>`);
  for (const x of [-60, -36, -12, 12, 36, 60]) out.push(`<rect x="${px(x - 2.6)}" y="${py(-66)}" width="${f(5.2 * s)}" height="${f(58 * s)}" fill="${P.post}"/>`);
  out.push(region(`M${px(-96)},${py(-62)} Q${px(0)},${py(-72)} ${px(96)},${py(-62)} L${px(52)},${py(-98)} L${px(-52)},${py(-98)}Z`, P.roof, [PX - 96 * s, PY - 98 * s, PX + 96 * s, PY - 62 * s], { n: 700, rmin: 2, rmax: 4.5, vy: .9, jit: .7 }));
  out.push(region(`M${px(-56)},${py(-96)} L${px(56)},${py(-96)} L${px(20)},${py(-142)} L${px(-20)},${py(-142)}Z`, P.roof, [PX - 56 * s, PY - 142 * s, PX + 56 * s, PY - 96 * s], { n: 420, rmin: 2, rmax: 4.5, vy: .9, jit: .7 }));
  out.push(`<path d="M${px(-22)},${py(-142)} L${px(22)},${py(-142)} L${px(18)},${py(-148)} L${px(-18)},${py(-148)}Z" fill="${P.roof[3]}"/>`);
  // string lights + janur
  let li = ''; for (let i = 0; i <= 12; i++) { const t = i / 12, x = -58 + 116 * t, y = -60 + Math.sin(t * Math.PI * 3) ** 2 * 6; li += `<circle cx="${px(x)}" cy="${py(y)}" r="${f(1.7 * s)}" fill="${P.light}"/>`; }
  out.push(li);
  for (const sd of [-1, 1]) { const bx = sd * 26; let j = `<path d="M${px(bx)},${py(-6)} Q${px(bx + sd * 2)},${py(-70)} ${px(bx - sd * 16)},${py(-92)}" fill="none" stroke="${P.janur}" stroke-width="${f(2 * s)}" stroke-linecap="round"/>`;
    for (let i = 0; i < 6; i++) { const t = .45 + i * .1, x = bx + sd * 2 * t - sd * 18 * Math.max(0, t - .5) * 2, y = -6 - 86 * t; j += `<path d="M${px(x)},${py(y)} q${f(-sd * 4 * s)},${f(6 * s)} ${f(-sd * 2 * s)},${f(14 * s)}" fill="none" stroke="${P.janur}" stroke-width="${f(1.3 * s)}" stroke-linecap="round"/>`; }
    out.push(j); }
  // palms
  function palm(x, y, h, lean, sc) {
    const tx = x + lean, ty = y - h, r = rng(Math.round(x * 7 + h));
    let o = `<path d="M${f(x)},${f(y)} Q${f(x + lean * .15)},${f(y - h * .55)} ${f(tx)},${f(ty)}" fill="none" stroke="${P.trunk}" stroke-width="${f(11 * sc)}" stroke-linecap="round"/>`;
    const fr = [-170, -140, -105, -70, -40, -10, 20, 200, 225];
    fr.forEach((deg, i) => { const a = deg * Math.PI / 180 + (r() - .5) * .2, L = h * (.34 + r() * .12), ex = tx + Math.cos(a) * L, ey = ty + Math.sin(a) * L * .7 + L * .32, cx = tx + Math.cos(a) * L * .55, cy = ty + Math.sin(a) * L * .7 - L * .22, tone = P.palm[i % P.palm.length];
      o += `<path d="M${f(tx)},${f(ty)} Q${f(cx)},${f(cy)} ${f(ex)},${f(ey)}" fill="none" stroke="${tone}" stroke-width="${f(7 * sc)}" stroke-linecap="round"/>`;
      let lf = ''; for (let k = 1; k <= 11; k++) { const t = k / 12, u = 1 - t, qx = u * u * tx + 2 * u * t * cx + t * t * ex, qy = u * u * ty + 2 * u * t * cy + t * t * ey, ll = L * .3 * Math.sin(Math.PI * Math.min(1, t * 1.15)); lf += `M${f(qx)},${f(qy)}l${f((r() - .5) * 8 * sc)},${f(ll)}`; }
      o += `<path d="${lf}" fill="none" stroke="${tone}" stroke-width="${f(4.2 * sc)}" stroke-linecap="round"/>`; });
    o += `<circle cx="${f(tx - 6 * sc)}" cy="${f(ty + 8 * sc)}" r="${f(7 * sc)}" fill="${P.trunk}"/><circle cx="${f(tx + 7 * sc)}" cy="${f(ty + 10 * sc)}" r="${f(6 * sc)}" fill="${P.trunk}"/>`;
    return o;
  }
  out.push(palm(470, 760, 150, -14, .45), palm(905, 770, 170, 16, .5), palm(960, 778, 120, 8, .4), palm(400, 772, 110, -8, .38));
  // foreground mounds
  const fenv = t => .12 + .88 * Math.pow(Math.abs(2 * t - 1), 1.6);
  const fg = ridge(41, 965, 250, 3, fenv);
  out.push(palm(150, 930, 470, -40, 1.25), palm(300, 950, 340, 26, .95), palm(1470, 930, 500, 44, 1.3), palm(1330, 955, 330, -22, .9));
  out.push(region(fg.d, P.fg, [-40, 690, W + 40, H + 20], { n: 9000, rmin: 5, rmax: 12, vy: .75, jit: .8 }));
  let fl = ''; for (let i = 0; i < 150; i++) { const x = R() * W, yy = fg.yAt(x) + 14 + R() * 120; if (yy > H) continue; fl += `<circle cx="${f(x)}" cy="${f(yy)}" r="${f(2.6 + R() * 3)}" fill="${P.flower[i % 3]}" opacity=".95"/>`; }
  out.push(fl, palm(40, 1010, 300, -30, 1), palm(1570, 1010, 320, 34, 1.05));
  out.push(`<rect width="${W}" height="${H}" filter="url(#grain)" opacity="${P.grainOp}" style="mix-blend-mode:soft-light"/>`);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}"><defs>${defs.join('')}</defs>${out.join('')}</svg>`;
}
writeFileSync(new URL('./art/day.svg', import.meta.url), build(DAY));
writeFileSync(new URL('./art/night.svg', import.meta.url), build(NIGHT));
console.log('scenes written');
