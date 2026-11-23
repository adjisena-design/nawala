/* nawalainvite.com/<name>: a couple's invitation at its own short address.
   Runs on Cloudflare in front of GitHub Pages (Worker "nawala-alamat", route nawalainvite.com/*; the folders
   assets/, undangan/, tim/ and ruang/ have routes without a worker, so files never pass through here).
   For /<name> it asks the database for that published invitation; when there is one, it serves the right invitation
   page (undangan/index.html, or undangan/dasar.html for a Dasar theme) with the couple's data already inside, a <base>
   so the page's own files still load, and the couple's names in the title and link preview. Anything else, or a name
   with no published invitation, goes to GitHub Pages untouched. The answer is kept 60 seconds, so a publish shows
   within a minute. Copy of what is deployed; edit here, then paste into the Cloudflare dashboard. */
const SUPA = 'https://erwddnobnagpglkpvdfm.supabase.co';
const KEY = 'sb_publishable_S1QUgptDBKUYn_yn0lPc0A_9hVsKwQe';
const RESERVED = new Set(['tim', 'ruang', 'undangan', 'assets', 'supabase', 'cloudflare', 'admin', 'api', 'www', 'index', 'favicon',
  'robots', 'sitemap', 'cname', 'readme', 'claude', 'u', 'contoh', 'nawala', 'login', 'masuk', 'tema', 'koleksi', 'layanan', 'faq', 'mitra', 'kabar', 'paket', 'demo', 'tools', 'sayembara', 'docs']);
const DAYS = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const MONTHS = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

async function lookup(slug, ctx) {
  const cache = caches.default, key = new Request('https://cache.nawalainvite.com/inv/' + slug);
  const hit = await cache.match(key);
  if (hit) return hit.json();
  const r = await fetch(SUPA + '/rest/v1/rpc/guest_invitation', {
    method: 'POST', headers: { apikey: KEY, Authorization: 'Bearer ' + KEY, 'Content-Type': 'application/json' }, body: JSON.stringify({ p_slug: slug })
  });
  const body = r.ok ? await r.text() : 'null';
  ctx.waitUntil(cache.put(key, new Response(body, { headers: { 'Content-Type': 'application/json', 'Cache-Control': 'max-age=60' } })));
  return JSON.parse(body || 'null');
}

function when(d) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(d || ''); if (!m) return '';
  const dt = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3], 12));
  return DAYS[dt.getUTCDay()] + ', ' + (+m[3]) + ' ' + MONTHS[+m[2] - 1] + ' ' + m[1];
}

export default {
  async fetch(req, env, ctx) {
    const url = new URL(req.url);
    const m = url.pathname.match(/^\/([a-z0-9][a-z0-9-]{1,58}[a-z0-9])\/?$/);
    if ((req.method !== 'GET' && req.method !== 'HEAD') || !m || RESERVED.has(m[1])) return fetch(req);
    let inv = null;
    try { inv = await lookup(m[1], ctx); } catch (e) { inv = null; }
    if (!inv || !inv.data) return fetch(req);
    const D = inv.data, page = D.route === 'dasar' ? '/undangan/dasar.html' : '/undangan/index.html';
    const origin = await fetch(url.origin + page, { headers: { 'Accept': 'text/html' } });
    if (!origin.ok) return fetch(req);
    const names = (D.bride && D.bride.short || '') + ' & ' + (D.groom && D.groom.short || '');
    const title = 'Undangan pernikahan ' + names, desc = (when(D.date) ? when(D.date) + '. ' : '') + 'Ketuk untuk membuka undangan.';
    const json = JSON.stringify(D).replace(/</g, '\\u003c').replace(/[\u2028\u2029]/g, function (c) { return '\\u' + c.charCodeAt(0).toString(16); });
    const out = new HTMLRewriter()
      .on('head', { element(e) { e.prepend('<base href="/undangan/">', { html: true }); } })
      .on('script[src="couple-laras-bima.js"]', { element(e) { e.replace('<script>window.NAWALA_LIVE=true;window.NAWALA_INVITE=' + json + ';</script>', { html: true }); } })
      .on('title', { element(e) { e.setInnerContent(title); } })
      .on('meta[name="description"]', { element(e) { e.setAttribute('content', desc); } })
      .on('meta[property="og:title"]', { element(e) { e.setAttribute('content', title); } })
      .on('meta[property="og:description"]', { element(e) { e.setAttribute('content', desc); } })
      .transform(origin);
    const h = new Headers(out.headers);
    h.set('Content-Type', 'text/html; charset=utf-8'); h.set('Cache-Control', 'public, max-age=60'); h.delete('Content-Length');
    return new Response(out.body, { status: 200, headers: h });
  }
};
