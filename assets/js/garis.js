/* Garis: Hairline's isometric line figures on the landing page (owner, 22 Nov 2026, 22:17).
   Each <span class="garis" data-garis="name"> gets its figure when its section comes near; ivory lines with
   Nawala's pink as the highlight on dark ground, deep green on light ground (CSS in rasa.css).
   The contact box's plug comes one step nearer the socket with each answer (event "nawala-ask").
   Library: assets/js/vendor/hairline.js (@lucasmarkes/hairline, MIT). */
import * as H from './vendor/hairline.js?v=1';
const LABEL = {
  relay: ['Satu pusat yang menghubungkan semuanya', 'One hub linking everything'],
  phosphor: ['Titik-titik yang bisa dilukis seperti kode QR', 'A dot matrix you paint like a QR code'],
  loupe: ['Kaca pembesar di atas denah', 'A lens over the plan'],
  settle: ['Kepingan yang menata diri di sekitar pusat', 'Pieces settling around a centre'],
  basket: ['Keranjang souvenir', 'A souvenir basket'],
  stack: ['Tumpukan bingkai yang terangkat', 'Frames lifting from a stack'],
  riffle: ['Baki kartu yang berdiri satu per satu', 'A tray of cards standing up one by one'],
  exploded: ['Jendela yang terangkat menjadi lapisan', 'A window lifting into layers'],
  padlock: ['Gembok yang terbuka', 'A padlock opening'],
  terrain: ['Pilar yang naik di tempat Anda menunjuk', 'Pillars rising where you point'],
  plug: ['Steker yang mendekat ke stopkontak', 'A plug drawing near its socket'],
  phone: ['Ponsel dalam lapisan', 'A phone in layers'],
  amplop: ['Amplop dengan nama tamu', 'An envelope with a guest name']
};
const en = () => document.documentElement.lang === 'en';
const figs = new Map();
function mount(el) {
  if (figs.has(el)) return;
  const name = el.getAttribute('data-garis'), fn = H[name] || (window.NAWALA_GARIS || {})[name];
  if (!fn) return;
  const l = LABEL[name], dark = !el.closest('[data-garis-light]');
  const f = fn(el, { theme: dark ? 'dark' : 'light', intensity: Number(el.getAttribute('data-intensity') || .5), label: l ? l[en() ? 1 : 0] : undefined });
  figs.set(el, f);
}
const els = [...document.querySelectorAll('.garis[data-garis]')];
if ('IntersectionObserver' in window) {
  const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { mount(e.target); io.unobserve(e.target); } }), { rootMargin: '400px 0px' });
  els.forEach((el) => io.observe(el));
} else els.forEach(mount);
/* the contact box: each answer brings the plug a step nearer */
document.addEventListener('nawala-ask', (e) => {
  const el = document.querySelector('.garis[data-garis="plug"]'); if (!el) return;
  mount(el); const f = figs.get(el); if (!f) return;
  f.update({ intensity: [.15, .45, .75, 1][Math.max(0, Math.min(3, e.detail | 0))] });
});
window.NAWALA_GARIS_MOUNT = mount;
