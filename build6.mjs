// Nawala v6 — animated layered scene, stepped deck. node build6.mjs [--inline] -> index.html
import { writeFileSync, readFileSync } from 'node:fs';
const INLINE = process.argv.includes('--inline');
const asset = n => INLINE ? `data:image/${n.endsWith('png') ? 'png' : 'webp'};base64,${readFileSync(new URL('./art/' + n, import.meta.url)).toString('base64')}` : `art/${n}`;
const f = n => (+n).toFixed(2);
const rng = s => () => { s |= 0; s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
const SW = 1600, SH = 1000, px = x => f(x / SW * 100) + 'cqw', py = y => f(y / SH * 100) + 'cqh';
const SUN = [860, 548], CRATER = [1066, 356];
const PATH = [[812, 1010], [842, 958], [812, 905], [760, 862], [748, 818], [752, 780], [748, 762]];

const ico = d => `<svg class="ico" viewBox="0 0 24 24" aria-hidden="true">${d}</svg>`;
const I = { sun: ico('<circle cx="12" cy="12" r="4.2"/><path d="M12 2.5v2M12 19.5v2M4.6 4.6 6 6M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4 6 18M18 6l1.4-1.4"/>'), moon: ico('<path d="M19.5 14.2A7.8 7.8 0 0 1 9.8 4.5a7.8 7.8 0 1 0 9.7 9.7Z"/>'), check: ico('<path d="m5 12.5 4.2 4.2L19 7"/>'), dash: ico('<path d="M7 12h10"/>'), plus: ico('<path d="M12 5v14M5 12h14"/>') };
const QR = (() => { const r = rng(42); let c = ''; for (let y = 0; y < 13; y++) for (let x = 0; x < 13; x++) { if ((x < 4 && y < 4) || (x > 8 && y < 4) || (x < 4 && y > 8)) continue; if (r() > .5) c += `M${x * 4} ${y * 4}h4v4h-4z`; } const eye = (x, y) => `<rect x="${x}" y="${y}" width="14" height="14" rx="2" class="qr-o"/><rect x="${x + 4}" y="${y + 4}" width="6" height="6" rx="1"/>`; return `<svg class="qr" viewBox="-2 -2 56 56" aria-hidden="true"><path d="${c}"/>${eye(0, 0)}${eye(36, 0)}${eye(0, 36)}</svg>`; })();

/* ---------- logo B: gate with a rising sun, knocked out so it sits on any ground ---------- */
let lgN = 0;
const MARK = 'M0 46V20A20 20 0 0 1 40 20V46Z';
const markSvg = (cls = '') => { const id = 'mk' + (lgN++); return `<svg class="mark ${cls}" viewBox="0 0 40 46" aria-hidden="true"><defs><mask id="${id}"><path d="${MARK}" fill="#fff"/><path d="M11 32a9 9 0 0 1 18 0Z" fill="#000"/><rect x="7" y="36" width="26" height="4.6" rx="2.3" fill="#000"/></mask></defs><path d="${MARK}" mask="url(#${id})" class="mark-fill"/></svg>`; };
const lockup = (cls = '') => `<span class="lockup ${cls}">${markSvg()}<span class="word">nawala</span></span>`;
const favicon = `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="-6 -4 52 54"><defs><mask id="m"><path d="${MARK}" fill="#fff"/><path d="M11 32a9 9 0 0 1 18 0Z" fill="#000"/><rect x="7" y="36" width="26" height="4.6" rx="2.3" fill="#000"/></mask></defs><path d="${MARK}" mask="url(#m)" fill="#F0874A"/></svg>`)}`;

/* ---------- animated overlay pieces ---------- */
// foreground palms: static trunks in one svg, swaying crowns as their own composited layers
const PALMS = [[150, 1010, 470, -40, 1.25, 6.2], [300, 1020, 340, 26, .95, 5.4], [1470, 1010, 500, 44, 1.3, 6.8], [1330, 1020, 330, -22, .9, 5.8], [40, 1050, 300, -30, 1, 7.1], [1570, 1050, 320, 34, 1.05, 6.5]];
let trunks = '', crowns = '';
PALMS.forEach(([x, y, h, lean, sc, dur], n) => {
  const tx = x + lean, ty = y - h, r = rng(Math.round(x * 7 + h)), R = h * .62;
  trunks += `<path d="M${x},${y} Q${f(x + lean * .15)},${f(y - h * .55)} ${f(tx)},${f(ty)}" class="p-trunk" stroke-width="${f(11 * sc)}"/>`;
  let fr = '';
  [-170, -140, -105, -70, -40, -10, 20, 200, 225].forEach((deg, i) => { const a = deg * Math.PI / 180 + (r() - .5) * .2, L = h * (.34 + r() * .12), ex = Math.cos(a) * L, ey = Math.sin(a) * L * .7 + L * .32, cx = Math.cos(a) * L * .55, cy = Math.sin(a) * L * .7 - L * .22;
    let lf = ''; for (let k = 1; k <= 11; k++) { const t = k / 12, u = 1 - t, qx = 2 * u * t * cx + t * t * ex, qy = 2 * u * t * cy + t * t * ey, ll = L * .3 * Math.sin(Math.PI * Math.min(1, t * 1.15)); lf += `M${f(qx)},${f(qy)}l${f((r() - .5) * 8 * sc)},${f(ll)}`; }
    fr += `<path d="M0,0 Q${f(cx)},${f(cy)} ${f(ex)},${f(ey)}${lf}" class="p${i % 4}" stroke-width="${f(5.6 * sc)}"/>`; });
  fr += `<circle cx="${f(-6 * sc)}" cy="${f(8 * sc)}" r="${f(7 * sc)}" class="p-nut"/><circle cx="${f(7 * sc)}" cy="${f(10 * sc)}" r="${f(6 * sc)}" class="p-nut"/>`;
  crowns += `<div class="crown" style="left:${f(tx / SW * 100)}%;top:${f(ty / SH * 100)}%;width:${f(2 * R / SW * 100)}%;--d:${dur}s;--dl:${-n * 1.3}s"><svg viewBox="${f(-R)} ${f(-R)} ${f(2 * R)} ${f(2 * R)}" aria-hidden="true">${fr}</svg></div>`;
});
const birdSvg = `<svg viewBox="0 0 24 10" aria-hidden="true"><path d="M1 7Q6 0 12 7Q18 0 23 7" class="b-w"/></svg>`;
const birds = [[150, 1.5, 38, 0], [190, 1.2, 38, -.8], [172, 1, 38, -1.6], [230, 1.3, 52, -14], [262, 1, 52, -14.9], [120, 1.1, 64, -30], [300, .9, 46, -22]]
  .map(([y, s, d, dl], i) => `<div class="bird" style="--y:${py(y)};--s:${s};--d:${d}s;--dl:${dl}s;--fl:${(.5 + (i % 3) * .08).toFixed(2)}s">${birdSvg}</div>`).join('');
const smoke = [0, 1, 2, 3, 4].map(i => `<i class="puff" style="--dl:${-i * 2.4}s"></i>`).join('');
// guests walking up the path, smaller as they near the pendopo
const kf = PATH.map(([x, y], i) => [x, y, 1 - i / (PATH.length - 1) * .58]);
const walkKF = `@keyframes walk {` + kf.map(([x, y, s], i) => { const p = Math.round(i / (kf.length - 1) * 100); return `${p}% { transform: translate(${px(x)}, ${py(y)}) scale(${s.toFixed(2)}); opacity: ${i === 0 || i === kf.length - 1 ? 0 : 1}; }`; }).join(' ') + `}`;
const couple = (a, b) => `<svg viewBox="0 0 30 40" aria-hidden="true"><path d="M3 40 q1-17 6-20 q5 3 6 20z" style="fill:${a}"/><circle cx="9" cy="14" r="4" class="w-skin"/><path d="M5 13a4 4 0 0 1 8 0z" class="w-hair"/><path d="M16 40 v-17 q0-4 5-4 q5 0 5 4 v17z" style="fill:${b}"/><circle cx="21" cy="14" r="4" class="w-skin"/><path d="M17 13a4 4 0 0 1 8 0z" class="w-hair"/></svg>`;
const walkers = [['var(--g1)', 'var(--g2)', 0], ['var(--g3)', 'var(--g4)', -9.5], ['var(--g5)', 'var(--g2)', -19]].map(([a, b, dl]) => `<div class="walker" style="--dl:${dl}s"><div>${couple(a, b)}</div></div>`).join('');
const pr = rng(11);
const petals = Array.from({ length: 10 }, (_, i) => `<i class="petal" style="--x:${f(pr() * 90)}cqw;--dx:${f(18 + pr() * 22)}cqw;--d:${f(16 + pr() * 12)}s;--dl:${f(-pr() * 26)}s;--c:var(--pt${i % 3})"></i>`).join('');
const flies = Array.from({ length: 26 }, () => `<i class="fly" style="left:${f(pr() * 100)}%;top:${f(66 + pr() * 32)}%;--d:${f(2.4 + pr() * 3)}s;--dl:${f(-pr() * 4)}s"></i>`).join('');

const scene = `<div class="scene" aria-hidden="true"><div class="stage">
  <div class="ly sky day"></div><div class="ly sky night"></div>
  <div class="sunpulse"></div>
  <div class="cl far day"><i></i></div><div class="cl far night"><i></i></div>
  <div class="smoke">${smoke}</div>
  <div class="ly land day"></div><div class="ly land night"></div>
  <div class="rays"></div>
  ${birds}
  ${walkers}
  <svg class="trunks" viewBox="0 0 ${SW} ${SH}" preserveAspectRatio="none">${trunks}</svg>
  ${crowns}
  <div class="cl near day"><i></i></div><div class="cl near night"><i></i></div>
  ${petals}${flies}
  <div class="grain"></div>
</div></div><div class="tint" aria-hidden="true"></div>`;

const css = `/* Hallmark · shape: locked scene, content steps · genre: editorial · theme: custom · job: see the offer and its price · idea: "one painted Indonesian wedding morning, alive, that stays put while the offer unfolds over it" · vibe: "stippled landscape, glass over art, calm"
 * paper: oklch(98.6% 0.006 250) · accent: oklch(72% 0.14 52) · display: Plus Jakarta Sans 800 with a Playfair Display 600 italic accent · body: Plus Jakarta Sans · hero: centred head over the sky of the fixed scene · nav: fixed, lockup B, pill links, theme switch, one action · footer: one line inside the closing step · imagery: layered stippled scene (sky, clouds, land) plus composited motion · signature: the living pendopo scene that never moves while each step swaps the glass over it
 * axes: light/grotesk-heavy/warm · posture: restrained · contrast: pass · fold: pass · v2.0.0 */
/* Hallmark · pre-emit critique: P4 H4 E5 S4 R3 V5 · weakest: R, the locked deck needs a desktop pointer; touch screens scroll the glass normally over the fixed scene */
/* Hallmark · project design wins · typefaces, serif italic accent, glass over artwork, locked-scene steps, ambient scene motion and the FAQ row animation are pinned by the user */
/* Hallmark · waive 80 · the stippled landscape is the brand's own artwork, made in the style of the user's IEEF site */
@property --t { syntax: "<number>"; inherits: true; initial-value: 0; }
:root {
  --space-2xs: 4px; --space-xs: 8px; --space-sm: 12px; --space-md: 16px; --space-lg: 24px; --space-xl: 40px;
  --text-xs: 0.8125rem; --text-sm: 0.9375rem; --text-md: 1.0625rem; --text-lg: 1.25rem;
  --text-display: clamp(2.4rem, 3vw + 1rem, 4.1rem); --text-section: clamp(1.7rem, 1.6vw + 1rem, 2.6rem); --text-lead: clamp(1.0625rem, .3vw + 1rem, 1.25rem);
  --ease: cubic-bezier(0.22, 1, 0.36, 1); --ease-io: cubic-bezier(0.65, 0, 0.35, 1); --dur-short: 320ms; --dur-mid: 560ms; --dur-long: 900ms;
  --container: 1200px; --gutter: 40px; --gap: 16px; --nav-h: 92px;
  --radius-card: 22px; --radius-sheet: 28px; --radius-pill: 999px;
  --font-accent: "Playfair Display", ui-serif, serif; --font-body: "Plus Jakarta Sans", ui-sans-serif, sans-serif;
  --mask-solid: #000; --mask-clear: transparent;
  --sky-day: url(${asset('sky-day.webp')}); --sky-night: url(${asset('sky-night.webp')}); --land-day: url(${asset('land-day.webp')}); --land-night: url(${asset('land-night.webp')});
  --cf-day: url(${asset('cloudfar-day.webp')}); --cf-night: url(${asset('cloudfar-night.webp')}); --cn-day: url(${asset('cloudnear-day.webp')}); --cn-night: url(${asset('cloudnear-night.webp')}); --grain: url(${asset('grain.png')});
  --mark: oklch(72% 0.15 50); --night-on: 0;
}
html[data-theme="light"] {
  --color-paper: oklch(98.6% 0.006 250); --color-ink: oklch(23% 0.02 40); --color-ink-2: oklch(36% 0.02 40); --color-muted: oklch(48% 0.02 40);
  --color-rule: oklch(23% 0.02 40 / .12); --color-accent-deep: oklch(50% 0.13 48); --color-focus: oklch(50% 0.15 250);
  --glass: oklch(100% 0 0 / .5); --glass-strong: oklch(100% 0 0 / .72); --glass-edge: oklch(100% 0 0 / .8); --glass-hi: oklch(100% 0 0 / .9);
  --shadow-deep: oklch(35% 0.06 40 / .3); --btn: oklch(23% 0.02 40); --btn-ink: oklch(98.6% 0.006 250); --nav-on: oklch(100% 0 0); --nav-on-ink: oklch(23% 0.02 40);
  --veil: oklch(98.6% 0.006 250 / .62); --tint-a: oklch(80% 0.11 55); --tint-b: oklch(62% 0.08 250); --tint-max: .42; --ray: oklch(100% 0 0 / .55); --sunglow: oklch(93% 0.08 62 / .9); --pop: oklch(92% 0.05 60 / .6);
  --p0: #5FAE6A; --p1: #3F9158; --p2: #2C774A; --p3: #1F5F3C; --trunk: #8A6A4C; --bird: oklch(38% 0.03 250); --puff: oklch(100% 0 0 / .8);
  --g1: #F29E7A; --g2: #2E3F66; --g3: #E9C46A; --g4: #5A7FA8; --g5: #F6A3B8; --skin: #C98E6A; --hair: #2A1C14; --pt0: #FFFFFF; --pt1: #FFC9D4; --pt2: #FFD8B0;
}
html[data-theme="dark"] {
  --night-on: 1;
  --color-paper: oklch(17% 0.035 255); --color-ink: oklch(96% 0.01 250); --color-ink-2: oklch(87% 0.02 250); --color-muted: oklch(74% 0.03 250);
  --color-rule: oklch(96% 0.01 250 / .16); --color-accent-deep: oklch(82% 0.11 58); --color-focus: oklch(80% 0.1 250);
  --glass: oklch(24% 0.045 250 / .46); --glass-strong: oklch(22% 0.045 250 / .7); --glass-edge: oklch(90% 0.03 245 / .2); --glass-hi: oklch(100% 0 0 / .12);
  --shadow-deep: oklch(5% 0.03 255 / .7); --btn: oklch(96% 0.01 250); --btn-ink: oklch(17% 0.035 255); --nav-on: oklch(96% 0.01 250); --nav-on-ink: oklch(17% 0.035 255);
  --veil: oklch(10% 0.03 255 / .45); --tint-a: oklch(30% 0.05 250); --tint-b: oklch(12% 0.04 255); --tint-max: .4; --ray: oklch(88% 0.08 62 / .22); --sunglow: oklch(80% 0.1 60 / .5); --pop: oklch(60% 0.09 58 / .25);
  --p0: #1C4A42; --p1: #143B36; --p2: #0E2E2B; --p3: #092221; --trunk: #0E1A1A; --bird: oklch(80% 0.03 250); --puff: oklch(70% 0.03 250 / .5);
  --g1: #B8735A; --g2: #1B2740; --g3: #B09346; --g4: #3E5A78; --g5: #9C6078; --skin: #9C6A4E; --hair: #140D09; --pt0: #FFE6C8; --pt1: #F2A7BC; --pt2: #FFD8B0;
  --mark: oklch(77% 0.13 58);
}
*, *::before, *::after { box-sizing: border-box; }
html, body { overflow-x: clip; }
html { scroll-behavior: smooth; scroll-padding-top: var(--nav-h); scrollbar-color: var(--color-muted) var(--color-paper); }
html.deck, html.deck body { overflow: hidden; height: 100%; }
body { margin: 0; background: var(--color-paper); color: var(--color-ink); font-family: var(--font-body); font-size: var(--text-md); line-height: 1.55; -webkit-font-smoothing: antialiased; transition: color var(--dur-long) var(--ease); }
::selection { background: color-mix(in oklab, var(--mark) 35%, transparent); }
:focus-visible { outline: 2px solid var(--color-focus); outline-offset: 3px; }
h1, h2, h3 { margin: 0; font-family: var(--font-body); font-weight: 800; letter-spacing: -0.035em; line-height: 1.05; font-synthesis: none; overflow-wrap: break-word; min-width: 0; text-wrap: balance; }
h1 { font-size: var(--text-display); } h2 { font-size: var(--text-section); } h3 { font-size: var(--text-md); letter-spacing: -0.01em; }
.acc { font-family: var(--font-accent); font-style: italic; font-weight: 600; font-size: 1.04em; letter-spacing: -0.015em; }
p { margin: 0; text-wrap: pretty; } ul { margin: 0; padding: 0; list-style: none; } a { color: inherit; } svg { display: block; }
button { font: inherit; color: inherit; background: none; border: 0; cursor: pointer; }
.ico { width: 20px; height: 20px; fill: none; stroke: currentColor; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; }
.visually-hidden { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
.container { width: 100%; max-width: var(--container); margin-inline: auto; padding-inline: var(--gutter); }

/* ---------- the living scene ---------- */
.scene { position: fixed; inset: 0; z-index: -3; overflow: hidden; pointer-events: none; background: var(--color-paper); }
.stage { position: absolute; left: 50%; bottom: 0; width: max(100vw, 160svh); aspect-ratio: 16 / 10; container-type: size; translate: -50% 0; transform: scale(calc(1 + var(--t) * .05)); transform-origin: 48% 78%; transition: --t 1.4s var(--ease-io); }
.ly { position: absolute; inset: 0; background: center / 100% 100% no-repeat; }
.sky.day { background-image: var(--sky-day); } .sky.night { background-image: var(--sky-night); }
.land.day { background-image: var(--land-day); } .land.night { background-image: var(--land-night); }
.night { opacity: var(--night-on); transition: opacity 1.1s var(--ease); } .cl.night { opacity: calc(var(--night-on) * .75); }
.cl { position: absolute; inset: 0; overflow: hidden; }
.cl i { position: absolute; inset: 0 auto 0 0; width: 200%; background-repeat: repeat-x; background-size: 50% 100%; will-change: transform; animation: drift var(--cd) linear infinite; }
.cl.far { --cd: 170s; } .cl.near { --cd: 95s; }
.cl.far.day i { background-image: var(--cf-day); } .cl.far.night i { background-image: var(--cf-night); }
.cl.near.day i { background-image: var(--cn-day); } .cl.near.night i { background-image: var(--cn-night); }
@keyframes drift { to { transform: translateX(-50%); } }
.sunpulse, .rays { position: absolute; left: ${f(SUN[0] / SW * 100)}%; top: ${f(SUN[1] / SH * 100)}%; translate: -50% -50%; border-radius: 50%; }
.sunpulse { width: 34cqw; aspect-ratio: 1; background: radial-gradient(closest-side, var(--sunglow), transparent); animation: pulse 5.5s ease-in-out infinite alternate; }
@keyframes pulse { from { transform: scale(.82); opacity: .55; } to { transform: scale(1.12); opacity: 1; } }
.rays { width: 150cqw; aspect-ratio: 1; background: repeating-conic-gradient(from 0deg, transparent 0deg 7deg, var(--ray) 10deg, transparent 13deg 22deg); -webkit-mask-image: radial-gradient(circle, var(--mask-solid) 3%, var(--mask-clear) 46%); mask-image: radial-gradient(circle, var(--mask-solid) 3%, var(--mask-clear) 46%); animation: spin 160s linear infinite, breathe 7s ease-in-out infinite alternate; }
@keyframes spin { to { rotate: 360deg; } } @keyframes breathe { from { opacity: .3; } to { opacity: .95; } }
.smoke { position: absolute; left: ${f(CRATER[0] / SW * 100)}%; top: ${f(CRATER[1] / SH * 100)}%; }
.puff { position: absolute; left: -1.6cqw; top: -1.6cqw; width: 3.2cqw; aspect-ratio: 1; border-radius: 50%; background: radial-gradient(closest-side, var(--puff), transparent); animation: rise 12s ease-out infinite; animation-delay: var(--dl); }
@keyframes rise { 0% { transform: translate(0, 0) scale(.5); opacity: 0; } 15% { opacity: 1; } 100% { transform: translate(4cqw, -16cqh) scale(3.4); opacity: 0; } }
.bird { position: absolute; left: 0; top: var(--y); width: calc(2.4cqw * var(--s)); animation: fly var(--d) linear infinite; animation-delay: var(--dl); }
.bird svg { overflow: visible; animation: flap var(--fl) ease-in-out infinite alternate; transform-origin: 50% 70%; }
.b-w { fill: none; stroke: var(--bird); stroke-width: 2.2; stroke-linecap: round; stroke-linejoin: round; }
@keyframes fly { from { transform: translate(-6cqw, 0); } 50% { transform: translate(52cqw, -2cqh); } to { transform: translate(108cqw, 1cqh); } }
@keyframes flap { from { transform: scaleY(1.1); } to { transform: scaleY(.25); } }
.walker { position: absolute; left: 0; top: 0; width: 2.3cqw; animation: walk 26s linear infinite; animation-delay: var(--dl); transform-origin: 0 0; }
.walker > div { translate: -50% -100%; animation: bob .7s ease-in-out infinite alternate; }
@keyframes bob { to { transform: translateY(-4%); } }
${walkKF}
.w-skin { fill: var(--skin); } .w-hair { fill: var(--hair); }
.trunks { position: absolute; inset: 0; width: 100%; height: 100%; overflow: visible; }
.p-trunk { fill: none; stroke: var(--trunk); stroke-linecap: round; }
.crown { position: absolute; aspect-ratio: 1; translate: -50% -50%; animation: sway var(--d) ease-in-out infinite alternate; animation-delay: var(--dl); }
.crown svg { width: 100%; height: 100%; overflow: visible; }
.crown path { fill: none; stroke-linecap: round; } .p0 { stroke: var(--p0); } .p1 { stroke: var(--p1); } .p2 { stroke: var(--p2); } .p3 { stroke: var(--p3); } .p-nut { fill: var(--trunk); }
@keyframes sway { from { rotate: -2.6deg; } to { rotate: 2.8deg; } }
.petal { position: absolute; left: var(--x); top: -4cqh; width: .7cqw; aspect-ratio: 1.6; border-radius: 60% 0 60% 0; background: var(--c); opacity: .9; animation: fall var(--d) linear infinite; animation-delay: var(--dl); }
@keyframes fall { from { transform: translate(0, 0) rotate(0deg); } to { transform: translate(var(--dx), 108cqh) rotate(620deg); } }
.fly { position: absolute; width: .32cqw; aspect-ratio: 1; border-radius: 50%; background: oklch(92% 0.12 85); box-shadow: 0 0 .9cqw .25cqw oklch(85% 0.14 80 / .7); opacity: 0; animation: blink var(--d) ease-in-out infinite alternate; animation-delay: var(--dl); }
html[data-theme="light"] .fly { display: none; }
@keyframes blink { 0% { opacity: 0; transform: translate(0, 0); } 60% { opacity: .95; } 100% { opacity: .2; transform: translate(.6cqw, -.8cqh); } }
.grain { position: absolute; inset: 0; background: var(--grain); background-size: 220px; opacity: .55; }
.tint { position: fixed; inset: 0; z-index: -2; pointer-events: none; background: linear-gradient(180deg, var(--tint-b), var(--tint-a)); opacity: calc(var(--t) * var(--tint-max)); transition: --t 1.4s var(--ease-io); }

/* ---------- glass and controls ---------- */
.glass { background: var(--glass); -webkit-backdrop-filter: blur(18px) saturate(160%); backdrop-filter: blur(18px) saturate(160%); border: 1px solid var(--glass-edge); box-shadow: inset 0 1px 0 var(--glass-hi), 0 24px 50px -28px var(--shadow-deep); transition: background-color var(--dur-long) var(--ease), border-color var(--dur-long) var(--ease); }
.btn { display: inline-flex; align-items: center; min-height: 48px; padding: 0 var(--space-lg); border-radius: var(--radius-pill); white-space: nowrap; font-weight: 500; font-size: var(--text-sm); text-decoration: none; background: var(--btn); color: var(--btn-ink); box-shadow: 0 10px 24px -14px var(--shadow-deep); transition: transform var(--dur-short) var(--ease), opacity var(--dur-short) var(--ease), background-color var(--dur-long) var(--ease), color var(--dur-long) var(--ease); }
.btn:hover { transform: translateY(-2px); } .btn:active { transform: translateY(0) scale(.98); } .btn:focus-visible { outline: 2px solid var(--color-focus); outline-offset: 3px; transition: none; } .btn[aria-disabled="true"] { opacity: .45; pointer-events: none; }
.btn-quiet { background: var(--glass-strong); color: var(--color-ink); box-shadow: inset 0 0 0 1px var(--glass-edge); }

/* nav */
.nav { position: fixed; top: 0; left: 0; right: 0; z-index: 50; height: var(--nav-h); display: grid; grid-template-columns: 1fr auto 1fr; align-items: center; gap: var(--space-md); padding-inline: max(var(--gutter), calc((100% - var(--container)) / 2 + var(--gutter))); }
.nav > a { justify-self: start; text-decoration: none; } .nav-right { justify-self: end; display: flex; gap: var(--space-xs); align-items: center; }
.nav ul { display: flex; gap: var(--space-xs); }
.pill { display: inline-flex; align-items: center; min-height: 44px; padding: 0 18px; border-radius: var(--radius-pill); font-size: var(--text-sm); text-decoration: none; color: var(--color-ink); background: var(--glass); -webkit-backdrop-filter: blur(16px) saturate(160%); backdrop-filter: blur(16px) saturate(160%); box-shadow: inset 0 0 0 1px var(--glass-edge), 0 10px 24px -16px var(--shadow-deep); transition: background-color var(--dur-mid) var(--ease), color var(--dur-mid) var(--ease), transform var(--dur-short) var(--ease); }
.pill:hover { background: var(--glass-strong); transform: translateY(-1px); } .pill[aria-current] { background: var(--nav-on); color: var(--nav-on-ink); font-weight: 500; }
.theme { width: 44px; padding: 0; justify-content: center; } .theme .ico { transition: transform var(--dur-long) var(--ease); } .theme:active .ico { transform: rotate(40deg); } .theme .i-moon { display: none; }
html[data-theme="dark"] .theme .i-sun { display: none; } html[data-theme="dark"] .theme .i-moon { display: block; }
.nav .btn { min-height: 44px; padding: 0 20px; }
.lockup { display: inline-flex; align-items: flex-end; gap: .26em; font-size: 1.7rem; line-height: 1; color: var(--color-ink); }
.lockup .mark { height: .96em; width: auto; margin-bottom: .02em; } .mark-fill { fill: var(--mark); transition: fill var(--dur-long) var(--ease); }
.lockup .word { font-weight: 800; letter-spacing: -0.05em; line-height: .78; }
@media (max-width: 980px) { :root { --nav-h: 68px; } .nav { grid-template-columns: 1fr auto; background: var(--glass-strong); -webkit-backdrop-filter: blur(16px); backdrop-filter: blur(16px); } .nav ul { display: none; } }
@media (max-width: 380px) { .nav .btn { display: none; } }

/* ---------- steps ---------- */
.step { position: relative; min-height: 100svh; padding: calc(var(--nav-h) + 20px) 0 56px; display: grid; align-items: start; }
.step.mid { align-items: center; }
.deck .step { position: fixed; inset: 0; min-height: 0; overflow-y: auto; overscroll-behavior: contain; scrollbar-width: none; visibility: hidden; transition: visibility 0s linear var(--dur-long); }
.deck .step.active { visibility: visible; transition: none; }
.deck .step [data-in] { opacity: 0; transform: translateY(22px) scale(.985); transition: opacity var(--dur-mid) var(--ease), transform var(--dur-long) var(--ease); transition-delay: 0ms; }
.deck .step.active [data-in] { opacity: 1; transform: none; transition-delay: calc(var(--i, 0) * 70ms + 80ms); }
.head { max-width: 640px; padding: 26px 30px; border-radius: var(--radius-sheet); margin-bottom: var(--gap); }
.head p { margin-top: var(--space-sm); color: var(--color-ink-2); font-size: var(--text-sm); }
.hero { text-align: center; display: grid; justify-items: center; gap: 20px; position: relative; padding-top: 2vh; }
.hero::before { content: ""; position: absolute; inset: -50px -6% -40px; background: radial-gradient(closest-side, var(--veil), transparent); z-index: -1; }
.hero h1 { max-width: 19ch; } .hero p { max-width: 36ch; font-size: var(--text-lead); font-weight: 500; }
.actions { display: flex; gap: var(--space-sm); flex-wrap: wrap; justify-content: center; }
.frames { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: var(--gap); }
.frame { aspect-ratio: 9 / 15; border-radius: 999px 999px 24px 24px / 30% 30% 24px 24px; display: grid; place-items: end center; padding-bottom: 22px; font-size: var(--text-xs); color: var(--color-ink-2); border-style: dashed; }
@media (max-width: 900px) { .frames { grid-template-columns: repeat(3, minmax(0, 1fr)); } } @media (max-width: 560px) { .frames { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
.svc { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: var(--gap); }
.svc li { padding: 20px; border-radius: var(--radius-card); display: flex; flex-direction: column; gap: 10px; min-height: 250px; background: var(--glass-strong); }
.svc .what { font-size: var(--text-sm); color: var(--color-ink-2); }
.svc .price { font-weight: 800; font-size: var(--text-lg); letter-spacing: -0.03em; font-variant-numeric: tabular-nums; }
.demo { margin-top: auto; border-radius: 14px; padding: 12px; background: var(--glass); font-size: var(--text-xs); display: grid; gap: 8px; }
.row { display: flex; justify-content: space-between; gap: 8px; align-items: center; } .ok { color: var(--color-accent-deep); font-weight: 500; } .wait { color: var(--color-muted); }
.qr { width: 56px; height: 56px; fill: var(--color-ink); } .qr .qr-o { fill: none; stroke: var(--color-ink); stroke-width: 3; }
.note { display: inline-block; margin-top: var(--space-sm); padding: 6px 14px; border-radius: var(--radius-pill); background: var(--glass-strong); font-size: var(--text-xs); color: var(--color-ink-2); }
@media (max-width: 1000px) { .svc { grid-template-columns: repeat(2, minmax(0, 1fr)); } } @media (max-width: 560px) { .svc { grid-template-columns: minmax(0, 1fr); } }
.sheet { border-radius: var(--radius-sheet); padding: 22px 26px 18px; background: var(--glass-strong); }
.sheet-top { display: flex; justify-content: space-between; align-items: end; gap: var(--space-lg); flex-wrap: wrap; margin-bottom: var(--space-sm); }
.sheet-top p { max-width: 44ch; font-size: var(--text-sm); color: var(--color-ink-2); }
.tscroll { overflow-x: auto; }
table { width: 100%; border-collapse: collapse; font-size: var(--text-sm); min-width: 640px; }
th, td { padding: 9px 14px; text-align: left; border-bottom: 1px solid var(--color-rule); font-weight: 400; vertical-align: middle; }
thead th { vertical-align: bottom; padding-bottom: 12px; } thead th:first-child { width: 34%; }
.pk { display: block; font-weight: 800; letter-spacing: -0.02em; } .pp { display: block; font-weight: 800; font-size: 1.6rem; letter-spacing: -0.035em; font-variant-numeric: tabular-nums; }
.pop { background: var(--pop); } td .ico { color: var(--color-accent-deep); } td .no { color: var(--color-muted); }
tfoot td { border-bottom: 0; padding-top: 14px; } tfoot .btn { min-height: 42px; padding: 0 18px; }
.pack { display: grid; grid-template-columns: 1.5fr 1fr 1fr; gap: var(--gap); }
.tile { border-radius: var(--radius-card); display: grid; place-items: center; min-height: 190px; padding: 24px; }
.tile .lockup { font-size: 3rem; }
.tile.paper { background: oklch(98.6% 0.006 250); --color-ink: oklch(23% 0.02 40); --mark: oklch(72% 0.15 50); }
.tile.navy { background: oklch(19% 0.04 255); --color-ink: oklch(96% 0.01 250); --mark: oklch(77% 0.13 58); }
.tile.navy .lockup { font-size: 2.2rem; }
.tile.icon { background: oklch(72% 0.15 50); --mark: oklch(99% 0.005 60); }
.tile.icon .mark { height: 84px; width: auto; }
.cap { font-size: var(--text-xs); color: var(--color-ink-2); margin-top: var(--space-sm); }
@media (max-width: 820px) { .pack { grid-template-columns: minmax(0, 1fr); } }
.faq { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1.5fr); gap: var(--gap); align-items: start; }
.faq .head { margin: 0; } .faq-list { border-radius: var(--radius-sheet); padding: 4px 26px; }
.qa + .qa { border-top: 1px solid var(--color-rule); }
.q { width: 100%; text-align: left; padding: 18px 0; display: flex; justify-content: space-between; align-items: center; gap: 16px; font-size: var(--text-lg); font-weight: 500; }
.q .ico { flex: none; transition: transform var(--dur-mid) var(--ease); } .q[aria-expanded="true"] .ico { transform: rotate(135deg); }
.q:focus-visible { outline: 2px solid var(--color-focus); outline-offset: 4px; }
.a { display: grid; grid-template-rows: 0fr; transition: grid-template-rows var(--dur-mid) var(--ease); }
.a > div { overflow: hidden; } .a p { padding: 0 0 18px; color: var(--color-ink-2); max-width: 58ch; opacity: 0; transform: translateY(-6px); transition: opacity var(--dur-mid) var(--ease), transform var(--dur-mid) var(--ease); }
.qa.open .a { grid-template-rows: 1fr; } .qa.open .a p { opacity: 1; transform: none; transition-delay: 80ms; }
@media (max-width: 820px) { .faq { grid-template-columns: minmax(0, 1fr); } }
.close-box { max-width: 560px; margin-inline: auto; text-align: center; padding: 34px; border-radius: var(--radius-sheet); display: grid; gap: 18px; justify-items: center; }
.foot { margin-top: var(--space-lg); text-align: center; font-size: var(--text-xs); color: var(--color-ink-2); }
.foot span { display: inline-block; padding: 6px 14px; border-radius: var(--radius-pill); background: var(--glass-strong); }
@media (max-width: 760px) { :root { --gutter: 20px; } .head { padding: 22px; } .sheet { padding: 18px 16px; } }
@media (max-width: 900px), (pointer: coarse) { .glass, .pill { -webkit-backdrop-filter: blur(12px); backdrop-filter: blur(12px); } .petal:nth-child(2n), .bird:nth-of-type(n+5) { display: none; } }
@media (prefers-reduced-motion: reduce) { *, *::before, *::after { animation-duration: .01ms !important; animation-iteration-count: 1 !important; transition-duration: .01ms !important; scroll-behavior: auto !important; } .walker, .petal, .bird, .puff { display: none; } }
`;

const rows = [['Nama tamu dan RSVP', 1, 1, 1], ['Kirim lewat WhatsApp', '50 tamu', '200 tamu', '500 tamu'], ['Sesi akad dan resepsi', 0, 1, 1], ['Tahu siapa yang membuka', 0, 1, 1], ['Amplop digital', 0, 1, 1], ['Lukisan custom', 0, 0, 1], ['Masa aktif', '6 bulan', 'Selamanya', 'Selamanya']];
const cell = (x, i) => `<td${i === 1 ? ' class="pop"' : ''}>${x === 1 ? I.check.replace('class="ico"', 'class="ico" role="img" aria-label="Termasuk"') : x === 0 ? `<span class="no">${I.dash.replace('class="ico"', 'class="ico" role="img" aria-label="Tidak termasuk"')}</span>` : x}</td>`;
const faqs = [['Apakah harga di sini sudah final?', 'Ya. Tanpa harga coret, tanpa biaya tersembunyi.'], ['Bisa diisi sendiri atau dibuatkan?', 'Keduanya. Isi lewat editor, atau tim kami yang menyusun. Revisi tanpa batas.'], ['Bagaimana undangan dikirim?', 'Lewat WhatsApp dari dasbor, satu tautan per tamu.'], ['Layanan hari H tersedia di kota mana?', 'Bandung dan Jakarta dulu. Undangannya bisa dipakai di mana saja.']];
const NAV = [['top', 'Beranda'], ['template', 'Template'], ['layanan', 'Layanan'], ['harga', 'Harga'], ['tanya', 'Tanya']];
const IN = i => `data-in style="--i:${i}"`;

const html = `<!DOCTYPE html>
<html lang="id" data-theme="light">
<head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Nawala, undangan pernikahan yang dilukis</title>
<meta name="description" content="Undangan pernikahan digital dengan RSVP, buku tamu QR, dan live streaming dalam satu pesanan.">
<link rel="icon" href="${favicon}">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@1,600&family=Plus+Jakarta+Sans:wght@400;500;800&display=swap" rel="stylesheet">
<script>try{var t=localStorage.getItem('nawala-theme');document.documentElement.dataset.theme=t||(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light')}catch(e){}</script>
<style>
${css}</style>
</head>
<body>
${scene}
<nav class="nav" aria-label="Utama">
  <a href="#top" aria-label="Nawala, ke awal">${lockup()}</a>
  <ul>${NAV.map(([id, l], i) => `<li><a class="pill" href="#${id}"${i === 0 ? ' aria-current="true"' : ''}>${l}</a></li>`).join('')}</ul>
  <div class="nav-right"><button class="pill theme" type="button" id="theme" aria-label="Ganti ke mode gelap"><span class="i-sun">${I.sun}</span><span class="i-moon">${I.moon}</span></button><a class="btn" href="#harga">Lihat harga</a></div>
</nav>
<main>
<section class="step" id="top"><div class="container"><div class="hero">
  <h1 ${IN(0)}>Undangan pernikahan yang <span class="acc">dilukis</span> lapis demi lapis.</h1>
  <p ${IN(1)}>Undangan, RSVP, buku tamu, dan siaran langsung dalam satu pesanan.</p>
  <div class="actions" ${IN(2)}><a class="btn" href="#layanan">Lihat layanan</a><a class="btn btn-quiet" href="#harga">Lihat harga</a></div>
</div></div></section>

<section class="step" id="template" aria-labelledby="tpl-h"><div class="container">
  <div class="head glass" ${IN(0)}><h2 id="tpl-h">Template undangan sedang kami <span class="acc">lukis ulang.</span></h2><p>Lima bingkai ini akan terisi satu per satu.</p></div>
  <ul class="frames">${[1, 2, 3, 4, 5].map(i => `<li class="frame glass" ${IN(i)}>Segera hadir</li>`).join('')}</ul>
</div></section>

<section class="step" id="layanan" aria-labelledby="svc-h"><div class="container">
  <div class="head glass" ${IN(0)}><h2 id="svc-h">Dari undangan pertama terkirim sampai tamu <span class="acc">terakhir pulang.</span></h2><p>Satu tim mengurus semuanya. Kamu cukup menghubungi satu kontak.</p></div>
  <ul class="svc">
    <li class="glass" ${IN(1)}><h3>Tahu siapa yang membuka</h3><p class="what">Ingatkan yang belum, sekali ketuk.</p><p class="price">Termasuk di Lukisan</p><div class="demo"><div class="row"><span>Om Hendra</span><span class="ok">Dibuka</span></div><div class="row"><span>Mas Yoga</span><span class="wait">Belum</span></div></div></li>
    <li class="glass" ${IN(2)}><h3>Asisten RSVP</h3><p class="what">Tim kami menghubungi tamu dan menyusun meja.</p><p class="price">Rp990rb</p><div class="demo"><div class="row"><span>Keluarga Wibowo</span><span class="ok">4 orang, meja 7</span></div></div></li>
    <li class="glass" ${IN(3)}><h3>Buku tamu QR</h3><p class="what">Dua tablet dan kru di pintu, 4 jam.</p><p class="price">Rp1,79jt</p><div class="demo"><div class="row">${QR}<span>Tante Rina<br>Meja 7</span></div></div></li>
    <li class="glass" ${IN(4)}><h3>Live streaming</h3><p class="what">Dua jam, dua kamera, tayang di undangan.</p><p class="price">Rp3,49jt</p><div class="demo"><div class="row"><span>Akad</span><span class="ok">Tayang</span></div></div></li>
  </ul>
  <p class="note" ${IN(5)}>Nama di atas adalah contoh. Koordinator hari H dan wedding organizer sedang kami siapkan.</p>
</div></section>

<section class="step" id="harga" aria-labelledby="harga-h"><div class="container"><div class="sheet glass" ${IN(0)}>
  <div class="sheet-top"><h2 id="harga-h">Harga lengkap, tanpa <span class="acc">harga coret.</span></h2><p>Sudah termasuk revisi tanpa batas. Paket utuh dengan semua layanan hari H: Rp5,9jt.</p></div>
  <div class="tscroll"><table>
    <caption class="visually-hidden">Paket undangan</caption>
    <thead><tr><th scope="col">Undangan</th><th scope="col"><span class="pk">Sketsa</span><span class="pp">Rp199rb</span></th><th scope="col" class="pop"><span class="pk">Lukisan</span><span class="pp">Rp449rb</span></th><th scope="col"><span class="pk">Mahakarya</span><span class="pp">Rp799rb</span></th></tr></thead>
    <tbody>${rows.map(([l, ...v]) => `<tr><th scope="row">${l}</th>${v.map(cell).join('')}</tr>`).join('')}</tbody>
    <tfoot><tr><td></td><td><a class="btn btn-quiet" href="#tanya">Pilih Sketsa</a></td><td class="pop"><a class="btn" href="#tanya">Pilih Lukisan</a></td><td><a class="btn btn-quiet" href="#tanya">Pilih Mahakarya</a></td></tr></tfoot>
  </table></div>
</div></div></section>

<section class="step" id="logo" aria-labelledby="logo-h"><div class="container">
  <div class="head glass" ${IN(0)}><h2 id="logo-h">Logo Nawala: gerbang dan <span class="acc">matahari terbit.</span></h2><p>Satu jingga, satu bentuk, dipakai sama di setiap latar.</p></div>
  <div class="pack">
    <div ${IN(1)}><div class="tile paper">${lockup()}</div><p class="cap">Utama, di atas terang</p></div>
    <div ${IN(2)}><div class="tile navy">${lockup()}</div><p class="cap">Di atas malam</p></div>
    <div ${IN(3)}><div class="tile icon">${markSvg()}</div><p class="cap">Ikon aplikasi dan favicon</p></div>
  </div>
</div></section>

<section class="step" id="tanya" aria-labelledby="tanya-h"><div class="container"><div class="faq">
  <div class="head glass" ${IN(0)}><h2 id="tanya-h">Yang sering <span class="acc">ditanyakan.</span></h2></div>
  <div class="faq-list glass" ${IN(1)}>${faqs.map(([q, a], i) => `<div class="qa"><h3 class="visually-hidden">${q}</h3><button class="q" type="button" aria-expanded="false" aria-controls="a${i}">${q}${I.plus}</button><div class="a" id="a${i}" role="region"><div><p>${a}</p></div></div></div>`).join('')}</div>
</div></div></section>

<section class="step mid" id="mulai" aria-labelledby="close-h"><div class="container">
  <div class="close-box glass" ${IN(0)}><h2 id="close-h">Mulai dari harga, lalu <span class="acc">kabari kami.</span></h2><a class="btn" href="#harga">Lihat harga</a></div>
  <p class="foot" ${IN(1)}><span>Nawala adalah nama kerja. Bandung dan Jakarta.</span></p>
</div></section>
</main>
<script>
(function () {
  var root = document.documentElement, btn = document.getElementById('theme');
  function label() { btn.setAttribute('aria-label', root.dataset.theme === 'dark' ? 'Ganti ke mode terang' : 'Ganti ke mode gelap'); } label();
  btn.addEventListener('click', function () { root.dataset.theme = root.dataset.theme === 'dark' ? 'light' : 'dark'; try { localStorage.setItem('nawala-theme', root.dataset.theme); } catch (e) {} label(); });
  // FAQ rows open and close smoothly
  document.querySelectorAll('.q').forEach(function (q) { q.addEventListener('click', function () { var open = q.getAttribute('aria-expanded') !== 'true'; q.setAttribute('aria-expanded', open); q.parentNode.classList.toggle('open', open); }); });

  var steps = [].slice.call(document.querySelectorAll('.step')), pills = [].slice.call(document.querySelectorAll('.nav .pill[href]'));
  var navFor = { top: 'top', template: 'template', layanan: 'layanan', harga: 'harga', logo: '', tanya: 'tanya', mulai: '' };
  var mq = matchMedia('(min-width: 981px) and (min-height: 640px) and (pointer: fine)'), deck = false, cur = 0, lockUntil = 0, lastWheel = 0, acc = 0, used = false;
  function mark(i) {
    var id = steps[i].id; root.style.setProperty('--t', (i / (steps.length - 1)).toFixed(3));
    pills.forEach(function (p) { if (p.getAttribute('href').slice(1) === navFor[id]) p.setAttribute('aria-current', 'true'); else p.removeAttribute('aria-current'); });
  }
  function go(i) {
    i = Math.max(0, Math.min(steps.length - 1, i)); if (i === cur && deck && steps[i].classList.contains('active')) return;
    cur = i; steps.forEach(function (s, k) { s.classList.toggle('active', k === i); s.inert = k !== i; });
    steps[i].scrollTop = 0; mark(i);
    try { history.replaceState(null, '', '#' + steps[i].id); } catch (e) {}
  }
  function setDeck(on) {
    deck = on; root.classList.toggle('deck', on);
    if (on) { var h = location.hash.slice(1), k = steps.findIndex(function (s) { return s.id === h; }); cur = -1; go(k < 0 ? 0 : k); }
    else { steps.forEach(function (s) { s.classList.remove('active'); s.inert = false; }); }
  }
  // one gesture moves exactly one step; trackpad momentum is ignored until it settles
  addEventListener('wheel', function (e) {
    if (!deck) return;
    var s = steps[cur], dy = e.deltaY;
    if ((dy > 0 && s.scrollTop + s.clientHeight < s.scrollHeight - 2) || (dy < 0 && s.scrollTop > 2)) return;
    e.preventDefault();
    var now = performance.now(), gap = now - lastWheel; lastWheel = now;
    if (gap > 240) { used = false; acc = 0; }
    if (used || now < lockUntil) return;
    acc += dy;
    if (Math.abs(acc) > 24) { go(cur + (acc > 0 ? 1 : -1)); used = true; acc = 0; lockUntil = now + 650; }
  }, { passive: false });
  addEventListener('keydown', function (e) {
    if (!deck || e.target.closest('input, textarea')) return;
    var k = e.key, d = (k === 'ArrowDown' || k === 'PageDown' || (k === ' ' && !e.shiftKey)) ? 1 : (k === 'ArrowUp' || k === 'PageUp' || (k === ' ' && e.shiftKey)) ? -1 : 0;
    if (k === 'Home') { e.preventDefault(); go(0); } else if (k === 'End') { e.preventDefault(); go(steps.length - 1); }
    else if (d && performance.now() > lockUntil) { if (e.target.closest('.q') && k === ' ') return; e.preventDefault(); go(cur + d); lockUntil = performance.now() + 700; }
  });
  document.addEventListener('click', function (e) {
    var a = e.target.closest('a[href^="#"]'); if (!a) return; var k = steps.findIndex(function (s) { return s.id === a.getAttribute('href').slice(1); }); if (k < 0) return;
    if (deck) { e.preventDefault(); go(k); lockUntil = performance.now() + 700; }
  });
  // normal scrolling (phones, small screens): keep the nav and the light in step
  var ticking = false;
  addEventListener('scroll', function () { if (deck || ticking) return; ticking = true; requestAnimationFrame(function () { ticking = false; var best = 0; steps.forEach(function (s, k) { if (s.getBoundingClientRect().top <= innerHeight * .45) best = k; }); if (best !== cur) { cur = best; mark(best); } }); }, { passive: true });
  mq.addEventListener('change', function (e) { setDeck(e.matches); }); setDeck(mq.matches); if (!deck) mark(0);
})();
</script>
</body>
</html>
`;
writeFileSync(new URL(INLINE ? '/home/claude/nawala/nawala-v6.html' : './index.html', import.meta.url), html);
console.log('ok', (html.length / 1024).toFixed(0) + 'KB');
