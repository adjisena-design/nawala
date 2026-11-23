/* Garis: Hairline's isometric line figures on the landing page (owner, 22 Nov 2026, 22:17).
   Each <span class="garis" data-garis="name"> gets its figure when its section comes near; ivory lines with
   Nawala's pink as the highlight on dark ground, deep green on light ground (CSS in rasa.css).
   The contact box's plug comes one step nearer the socket with each answer (event "nawala-ask").
   Library: assets/js/vendor/hairline.js (@lucasmarkes/hairline, MIT). */
import * as H from './vendor/hairline.js?v=4';
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
  amplop: ['Amplop dengan nama tamu', 'An envelope with a guest name'],
  keranjang: ['Keranjang berisi album, surat Nawala, dan ponsel', 'A basket holding an album, a Nawala letter and a phone'],
  denah: ['Denah resepsi: pelaminan, lorong, dan enam meja bundar', 'A reception floor: stage, aisle and six round tables'],
  album: ['Ponsel tamu mengirim foto ke album pengantin', "A guest's phone sending photos into the couple's album"],
  hari: ['Satu surat melewati enam langkah hari pernikahan', 'One letter passing the six steps of the wedding day'],
  pintu: ['Ponsel tamu dipindai di gerbang masuk', "A guest's phone read at the entrance gate"],
  susun: ['Meja diletakkan di denah, lalu tamu didudukkan', 'A table set on the plan, then a guest seated']
};
const en = () => document.documentElement.lang === 'en';
/* Captions under the big figures: what a figure reads out, in both languages. A figure says a short key
   ("meja 4", "foto 03", "rest"); the words live here, outside the drawing. */
const STEPS = [['Surat atas namanya', 'A letter in their name'], ['Dibuka, lalu dijawab', 'Opened, then answered'], ['Dipindai di pintu', 'Scanned at the door'],
  ['Menemukan meja', 'Finds the table'], ['Souvenir diambil', 'Souvenir collected'], ['Membagikan foto', 'Shares a photo']];
const CAP = {
  hari: (k) => { const m = /langkah (\d)/.exec(k); return m ? STEPS[m[1] - 1] : ['Satu tautan, dari awal sampai pulang', 'One link, start to finish']; },
  amplop: (k) => (k === 'rest' ? ['Laras & Bima, 12 Juni 2027', 'Laras & Bima, 12 June 2027'] : ['Kepada Dinda', 'To Dinda']),
  pintu: (k) => (k === 'tercatat' ? ['Kehadiran tercatat', 'Attendance recorded'] : k === 'memindai' ? ['Memindai kode Dinda', "Scanning Dinda's code"] : ['Selamat datang, Dinda', 'Welcome, Dinda']),
  denah: (k) => { const m = /meja (\d)/.exec(k); return m ? ['Meja ' + m[1], 'Table ' + m[1]] : ['Meja 4, kursi Dinda', "Table 4, Dinda's chair"]; },
  susun: (k) => (k === 'meja 3' ? ['Meja 3 ditambahkan', 'Table 3 added'] : k === 'dinda' ? ['Dinda duduk di meja 3', 'Dinda seated at table 3'] : ['Susun ruangan kalian', 'Arrange your own room']),
  keranjang: (k) => (k === 'album' ? ['Keluarga: album foto', 'Family: a photo album'] : k === 'amplop' ? ['Sahabat: surat Nawala', 'Friends: a Nawala letter'] : k === 'ponsel' ? ['Rekan: bingkisan digital', 'Colleagues: a digital gift'] : ['Souvenir sesuai kelompok tamu', 'A souvenir for each guest group']),
  album: (k) => { const m = /foto (\d+)/.exec(k), n = 21 + (m ? Number(m[1]) : 2); return ['Album: ' + n + ' foto', 'Album: ' + n + ' photos']; }
};
const figs = new Map(), said = new Map();
function caption(el, name, key) {
  const cap = el.parentNode && el.parentNode.querySelector('.svc__cap'), fn = CAP[name];
  if (!cap || !fn) return;
  if (key != null) said.set(el, key);
  const words = fn(said.get(el) || 'rest')[en() ? 1 : 0];
  if (cap.textContent !== words) cap.textContent = words;
}
function mount(el) {
  if (figs.has(el)) return;
  const name = el.getAttribute('data-garis'), fn = H[name] || (window.NAWALA_GARIS || {})[name];
  if (!fn) return;
  const l = LABEL[name];
  /* The big figures (garis--panggung) play their own lap in a loop while on screen, on every device, and give way
     to a pointer or a finger; nothing plays under reduced motion. */
  const big = el.classList.contains('garis--panggung');
  const play = big && !matchMedia('(prefers-reduced-motion: reduce)').matches;
  const f = fn(el, { theme: 'light', intensity: Number(el.getAttribute('data-intensity') || .5), label: l ? l[en() ? 1 : 0] : undefined, play: play,
    onRead: big ? (k) => caption(el, name, k) : undefined });
  figs.set(el, f);
  if (big) caption(el, name, null);
}
new MutationObserver(() => figs.forEach((f, el) => caption(el, el.getAttribute('data-garis'), null))).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
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
