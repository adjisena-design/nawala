/* Sample couples (owner, 28 Nov 2026): two made-up couples with generated pre-wedding photographs, so a visitor
   sees a theme with people in it and can picture themselves there. Loaded on both invitation pages right after
   live.js; imajinasi.js puts one into the sample couple file before the engine runs.
   - Aisyah & Raka (the bride wears a hijab): suit and gown, Sunda, Palembang, Minang.
   - Laras & Bima: Jawa, casual, Bali, white akad.
   - Each theme opens with the attire that suits it (match()); the visitor's own pick in the Ruang Imajinasi
     (sessionStorage "nawala-pasangan") wins and follows them to every sample in the tab.
   - Pictures: assets/img/pasangan/<set>-<nn>-<shot>.webp, 640 px wide (30 to 150 KB), every one lazy-loaded by the
     engines. "-l" (the generated size) only for the cover from 900 px and the wide one beside the invitation;
     "-t" (200 px) is the tile in the picker; "10-wide.webp" (720 px) is the Premium walk's closing picture. Never point a phone at a "-l" file.
   - Faces and job numbers: project note brand/sample-couples-prewedding-2026-11-28.md. */
(function () {
  'use strict';
  var BASE = '../assets/img/pasangan/';
  var COUPLES = {
    a: {
      names: 'Aisyah & Raka',
      bride: { short: 'Aisyah', full: 'Aisyah Rahmania',
        parents: ['Putri kedua Bapak Yusuf Rahman dan Ibu Nur Hasanah', 'Second daughter of Mr Yusuf Rahman and Mrs Nur Hasanah'] },
      groom: { short: 'Raka', full: 'Raka Mahendra',
        parents: ['Putra pertama Bapak Dedi Mahendra dan Ibu Lilis Suryani', 'First son of Mr Dedi Mahendra and Mrs Lilis Suryani'] }
    },
    b: { names: 'Laras & Bima' }   /* the couple file's own names */
  };
  /* key: [couple, file prefix, Indonesian, English, gallery shots, cover shot] */
  var FULL = ['04-walking', '05-closeup', '06-seated', '07-standing', '09-laughing', '08-hands'];
  var EIGHT = ['04-walking', '05-closeup', '06-seated', '07-standing'];
  var SETS = {
    'a1': ['a', 'A1-suit-gown', 'Jas dan gaun', 'Suit and gown', FULL, '01-cover'],
    'a2': ['a', 'A2-sunda', 'Adat Sunda', 'Sundanese', FULL, '01-cover'],
    'a3': ['a', 'A3-palembang', 'Adat Palembang', 'Palembang', EIGHT, '01-cover'],
    'a4': ['a', 'A4-minang', 'Adat Minang', 'Minang', EIGHT, '01-cover'],
    'b1': ['b', 'B1-jawa', 'Adat Jawa', 'Javanese', FULL, '01-cover'],
    'b2': ['b', 'B2-kasual', 'Kasual', 'Casual', FULL, '01-cover'],
    /* Bali: the first cover, portrait and close-up came out in another dress than the rest, so they are not used */
    'b3': ['b', 'B3-bali', 'Adat Bali', 'Balinese', ['04-walking', '06-seated', '07-standing'], '04-walking'],
    'b4': ['b', 'B4-akad', 'Akad putih', 'White akad', EIGHT, '01-cover']
  };
  var ORDER = ['a1', 'a2', 'a3', 'a4', 'b1', 'b2', 'b3', 'b4'];

  /* which attire a theme opens with: by the words in its slug, else by turns so both couples are seen */
  var RULES = [
    [/(^|-)(akad)(-|$)/, 'b4'],
    [/(^|-)(jawa|pendopo|batik|keraton|kraton|wayang|gunungan|joglo|solo|jogja|yogya|borobudur|prambanan|parang|kawung|mataram|gamelan|sogan|lurik)(-|$)/, 'b1'],
    [/(^|-)(sunda|priangan|pasundan|parahyangan|angklung|siger|kebun-teh|teh)(-|$)/, 'a2'],
    [/(^|-)(minang|gadang|bukittinggi|suntiang)(-|$)/, 'a4'],
    [/(^|-)(palembang|songket|limar|musi|ampera|sriwijaya)(-|$)/, 'a3'],
    [/(^|-)(bali|ubud|pura|kamboja|barong|uluwatu|penjor|dewata)(-|$)/, 'b3'],
    /* the General Nawala theme is Laras & Bima everywhere on the site (demos, the home page) */
    [/^umum$/, 'b2'],
    /* themes of communities where a hijab would be out of place open with Laras & Bima */
    [/(^|-)(toraja|peranakan|lampion|imlek|kapel|gereja|natal|dayak|papua|batak|toba|kelimutu|sumba|manado|kyoto)(-|$)/, 'b2'],
    [/(^|-)(masjid|mihrab|kubah|kaligrafi|islami|hijrah|sakinah|ramadan|syawal|arabesque|maroko)(-|$)/, 'a1'],
    [/(^|-)(pantai|laut|ombak|pesisir|pulau|tropis|rimba|gunung|puncak|alpen|danau|jelajah|ladang|padang|kebun|hutan|pinus|sawah|bukit|piknik|senja|kawan|sahabat|desa|kartu-pos|boho)(-|$)/, 'b2']
  ];
  function hash(s) { var h = 0; for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0; return h; }
  function match(slug) {
    slug = String(slug || '').toLowerCase();
    for (var i = 0; i < RULES.length; i++) if (RULES[i][0].test(slug)) return RULES[i][1];
    return hash(slug) % 3 === 0 ? 'b2' : 'a1';
  }

  /* the Premium walk shows the cover photo as a lying picture on its closing step; Dasar as a standing one on the cover */
  var WALK = !/dasar\.html$/.test(location.pathname);
  /* living themes whose cover is itself a drawn bride and groom: no photograph on the cover there (it would sit on them) */
  var DRAWN = /^(joglo-jawa|pengantin-jawa|pengantin-putih|pengantin-andalas|akad-melati|pasangan-ceria|nusantara-berpasangan|pengantin-klasik)$/;
  function drawn(slug) { return DRAWN.test(String(slug || '')); }
  function photos(key, wide) {
    var s = SETS[key]; if (!s) return null;
    var p = BASE + s[1] + '-';
    return {
      cover: WALK ? p + '10-wide.webp' : p + s[5] + (wide ? '-l' : '') + '.webp',
      bride: p + '02-bride.webp',
      groom: p + '03-groom.webp',
      gallery: s[4].map(function (x) { return p + x + '.webp'; }),
      side: p + '10-wide-l.webp'
    };
  }
  /* puts a couple into the sample couple file (names, parents, the gift names, photos) */
  function fill(D, key, slug) {
    var s = SETS[key]; if (!s || !D || D.sample !== true) return false;
    var c = COUPLES[s[0]];
    if (c.bride) {
      var was = [D.bride.full, D.groom.full];
      D.bride = Object.assign({}, D.bride, c.bride); D.groom = Object.assign({}, D.groom, c.groom);
      D.gifts = (D.gifts || []).map(function (g) {
        return Object.assign({}, g, { name: g.name === was[0] ? c.bride.full : g.name === was[1] ? c.groom.full : g.name });
      });
      /* the sample wishes have a friend called Raka */
      D.wishes = (D.wishes || []).map(function (w) { return w.name === 'Raka dan Tia' ? Object.assign({}, w, { name: 'Bayu dan Tia' }) : w; });
    }
    var wide = false; try { wide = window.matchMedia('(min-width:900px)').matches; } catch (e) {}
    D.photos = Object.assign({}, D.photos || {}, photos(key, wide));
    if (!WALK && drawn(slug)) delete D.photos.cover;
    /* the wide picture has the couple at one third; keep them in view beside the invitation (samping.js) */
    document.documentElement.style.setProperty('--side-pos', /^(a1|a3|b1|b3)$/.test(key) ? '86% 40%' : '14% 40%');
    return true;
  }
  function ok(u) { return typeof u === 'string' && /^\.\.\/assets\/img\/pasangan\/[A-Za-z0-9-]+\.webp$/.test(u); }

  window.NAWALA_PASANGAN = {
    KEY: 'nawala-pasangan', sets: SETS, order: ORDER, couples: COUPLES,
    match: match, fill: fill, ok: ok, drawn: drawn,
    tile: function (key) { var s = SETS[key]; return BASE + s[1] + '-' + s[5] + '-t.webp'; }
  };
})();
