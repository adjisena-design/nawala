/* Nawala themes for the two consoles (tim.js, ruang.js). The home page keeps the same lists at the top of site.js:
   when a theme, a film or an owner changes, change it in both files.
   A page in a sub-folder sets window.NAWALA_BASE = '../' before loading this file. */
window.NAWALA = (function () {
  'use strict';
  var BASE = window.NAWALA_BASE || '';

  /* The first themes: seven families, four directions each. Covers are colour fields until they are painted. */
  var FAMILIES = {
    alam: ['Alam', 'Nature', 'Hutan, pantai, gunung, taman, dan langit.', 'Forest, coast, mountain, garden and sky.'],
    royal: ['Kerajaan', 'Royal', 'Balairung istana dalam sepuluh warna, selalu berpadu emas.', 'Palace halls in ten colours, always with gold.'],
    religi: ['Religi', 'Faith', 'Untuk akad, pemberkatan, dan setiap upacara keagamaan.', 'For akad, blessing and every ceremony of faith.'],
    nusa: ['Nusantara', 'Nusantara', 'Betawi, Jawa, Sunda, Bali, Palembang, dan banyak lagi.', 'Betawi, Javanese, Sundanese, Balinese, Palembang and more.'],
    dunia: ['Mancanegara', 'The world', 'Toskana, Paris, Santorini, Kyoto.', 'Tuscany, Paris, Santorini, Kyoto.'],
    era: ['Lintas masa', 'Eras', 'Tempo doeloe, noir, koboi, zaman samurai.', 'Old days, noir, the Old West, the age of samurai.'],
    elemen: ['Elemen', 'Elements', 'Air, api, bumi, emas, mutiara.', 'Water, fire, earth, gold, pearl.']
  };
  /* pictures and films are named after the Indonesian theme name: assets/img/cover-<slug>.webp (-s for the small one),
     assets/video/<slug>.mp4 */
  var META = null;   /* filled by use(): the rows from the database, by slug */
  function slug(th) { return th[6] || th[1].toLowerCase().replace(/ /g, '-'); }
  /* -s (220 wide) and -m (400 wide) are toned down on purpose so many covers can sit together quietly;
     the full-colour picture is only shown once a theme is opened */
  function cover(th, size) {
    var m = META && META[slug(th)];
    if (m && m.cover) return m.cover + (size ? '-' + size : '') + '.webp';   /* a cover uploaded in the team console */
    return BASE + 'assets/img/cover-' + slug(th) + (size ? '-' + size : '') + '.webp';
  }
  /* Four tiers. Dasar: one scene, a gentle camera move. Premium: the camera travels into the scene.
     Eksklusif: sold to one couple only, then marked as owned. Kustom: built from the couple's own inspiration. */
  var TIERS = {
    dasar: ['Dasar', 'Basic', 'Aman, disukai semua orang, dan tetap bermakna. Satu adegan nyata dengan gerak kamera yang lembut.', 'Safe, liked by everyone, and still meaningful. One real scene with a gentle camera move.'],
    premium: ['Premium', 'Premium', 'Kamera membawa tamu masuk ke dalam adegan pembuka. Tujuh keluarga, 28 tema.', 'The camera carries your guest into the opening scene. Seven families, 28 themes.'],
    eksklusif: ['Eksklusif', 'Exclusive', 'Sepuluh dunia. Masing-masing hanya untuk satu pasangan: setelah dipilih, tema itu tidak kami pakai lagi.', 'Ten worlds. Each belongs to one couple only: once chosen, we never use it again.'],
    kustom: ['Kustom', 'Custom', 'Dibuat dari nol dari inspirasi kalian sendiri.', 'Built from scratch from your own inspiration.']
  };
  var BASIC = [
    ['Putih Klasik', 'Classic White', 'Mawar putih dan sutra gading dalam cahaya pagi.', 'White roses and ivory silk in morning light.'],
    ['Sage', 'Sage', 'Daun eukaliptus, bunga putih, dan linen hijau sage.', 'Eucalyptus, white flowers and sage green linen.'],
    ['Dusty Rose', 'Dusty Rose', 'Peony merah muda dan pita sutra.', 'Blush peonies and silk ribbon.'],
    ['Emas Lembut', 'Soft Gold', 'Satin sampanye, lilin, dan cahaya keemasan.', 'Champagne satin, candles and golden light.'],
    ['Biru Langit', 'Sky Blue', 'Hortensia biru muda dan linen putih.', 'Pale blue hydrangea and white linen.'],
    ['Lavender', 'Lavender', 'Lavender dan mawar ungu muda di senja hari.', 'Lavender and lilac roses at dusk.'],
    ['Terakota', 'Terracotta', 'Rumput pampas, daun palem kering, dan tembikar.', 'Pampas grass, dried palm and terracotta.'],
    ['Daun Tropis', 'Tropical Leaves', 'Daun monstera dan anggrek putih.', 'Monstera leaves and white orchids.'],
    ['Marun', 'Maroon', 'Mawar merah tua dan cahaya lilin.', 'Deep red roses and candlelight.'],
    ['Melati', 'Jasmine', 'Roncean melati putih dan daun segar.', 'Garlands of white jasmine and fresh leaves.'],
    ['Senja', 'Sunset', 'Pantai tenang saat matahari terbenam.', 'A quiet beach at sunset.'],
    ['Malam Bintang', 'Starry Night', 'Langit berbintang, lampu kecil, dan bunga putih.', 'A starry sky, fairy lights and white flowers.']
  ];
  var EXCLUSIVE = [
    ['Istana Awan', 'Cloud Palace', 'Tangga marmer menuju istana di atas awan.', 'A marble staircase to a palace above the clouds.'],
    ['Taman Kaca', 'Glass Garden', 'Rumah kaca penuh anggrek saat fajar.', 'A glasshouse full of orchids at dawn.'],
    ['Perpustakaan Emas', 'Golden Library', 'Perpustakaan keemasan; bukunya terbuka dan bercahaya saat tamu tiba.', 'A golden library; its book opens and glows as your guest arrives.'],
    ['Kapal Bulan', 'Moon Boat', 'Perahu kecil di lautan bintang menuju bulan sabit.', 'A small boat on a sea of stars, heading for the crescent moon.'],
    ['Seribu Lentera', 'A Thousand Lanterns', 'Lorong seribu lentera; gerbangnya terbuka di ujung.', 'A corridor of a thousand lanterns; the gate opens at its end.'],
    ['Bawah Laut', 'Under the Sea', 'Paviliun karang dan mutiara di dasar laut yang jernih.', 'A pavilion of coral and pearl on a clear sea floor.'],
    ['Teater Tua', 'Old Opera House', 'Gedung opera tua; tirainya terbuka saat tamu mendekat.', 'An old opera house; the curtain parts as your guest approaches.'],
    ['Keraton Malam', 'Palace by Lamplight', 'Pelataran keraton yang diterangi ratusan pelita.', 'A palace courtyard lit by hundreds of oil lamps.'],
    ['Aurora', 'Aurora', 'Paviliun kaca di atas salju, di bawah cahaya utara.', 'A glass pavilion on snow under the northern lights.'],
    ['Kebun Mawar', 'Secret Rose Garden', 'Taman mawar rahasia; pintunya terbuka untuk tamu.', 'A secret rose garden; its door opens for your guest.']
  ];
  var FILMS = ' hutan-pagi balairung-merah akad-putih songket-palembang santorini tempo-doeloe air putih-klasik dusty-rose malam-bintang istana-awan taman-kaca perpustakaan-emas kapal-bulan seribu-lentera bawah-laut teater-tua keraton-malam aurora kebun-mawar ';
  var OWNED = '';   // slugs of Exclusive themes a couple has bought, e.g. ' istana-awan '. Empty until there is a real sale.
  var THEMES = [
    ['alam', 'Hutan Pagi', 'Morning Forest'], ['royal', 'Balairung Merah', 'Crimson Hall'], ['religi', 'Akad Putih', 'White Akad'], ['nusa', 'Pendopo Jawa', 'Javanese Pendopo'],
    ['dunia', 'Toskana', 'Tuscany'], ['era', 'Tempo Doeloe', 'Old Days'], ['elemen', 'Air', 'Water'],
    ['alam', 'Padang Bunga', 'Flower Meadow'], ['royal', 'Istana Zamrud', 'Emerald Palace'], ['religi', 'Pemberkatan', 'The Blessing'], ['nusa', 'Saung Sunda', 'Sundanese Saung'],
    ['dunia', 'Paris', 'Paris'], ['era', 'Noir', 'Noir'], ['elemen', 'Api', 'Fire'],
    ['alam', 'Lembah Kabut', 'Misty Valley'], ['royal', 'Takhta Biru', 'Sapphire Throne'], ['religi', 'Pawiwahan', 'Pawiwahan'], ['nusa', 'Taman Bali', 'Balinese Garden'],
    ['dunia', 'Santorini', 'Santorini'], ['era', 'Koboi', 'Old West'], ['elemen', 'Emas', 'Gold'],
    ['alam', 'Tepi Danau', 'Lakeside'], ['royal', 'Mahkota Emas', 'Golden Crown'], ['religi', 'Doa Senja', 'Evening Prayer'], ['nusa', 'Songket Palembang', 'Palembang Songket'],
    ['dunia', 'Kyoto', 'Kyoto'], ['era', 'Samurai', 'Samurai'], ['elemen', 'Mutiara', 'Pearl']
  ];

  /* every theme as one list: [tier, name, English name, description, English description, family] */
  var ALL = BASIC.map(function (b) { return ['dasar'].concat(b); })
    .concat(THEMES.map(function (th) { var f = FAMILIES[th[0]]; return ['premium', th[1], th[2], f[2], f[3], th[0]]; }))
    .concat(EXCLUSIVE.map(function (e) { return ['eksklusif'].concat(e); }));
  function hasFilm(th) { var m = META && META[slug(th)]; return m ? !!m.film : FILMS.indexOf(' ' + slug(th) + ' ') > -1; }
  function film(th) { var m = META && META[slug(th)]; return m && m.film && m.film !== 'repo' ? m.film : BASE + 'assets/video/' + slug(th) + '.mp4'; }

  /* The lists above are the starting point; the database (themes table, edited in the team console) is the truth.
     use(rows) replaces every list in place with the rows: [tier, name, English name, description, English description,
     family, slug]. load() asks the database for the themes the site shows; on failure the built-in lists stay. */
  function use(rows) {
    META = {}; ALL.length = 0; BASIC.length = 0; THEMES.length = 0; EXCLUSIVE.length = 0;
    rows.forEach(function (r) {
      var name = r.name || [r.name_id, r.name_en], desc = r.desc || [r.desc_id, r.desc_en], fam = FAMILIES[r.family];
      var e = [r.tier, name[0], name[1], desc[0] || (fam ? fam[2] : ''), desc[1] || (fam ? fam[3] : ''), r.family || undefined, r.slug];
      META[r.slug] = r; ALL.push(e);
      (r.tier === 'dasar' ? BASIC : r.tier === 'premium' ? THEMES : EXCLUSIVE).push(e);
    });
  }
  function load() {
    var DB = window.NAWALA_DB;
    if (!DB) return Promise.resolve(ALL);
    return DB.rpc('site_themes').then(function (rows) { if (Array.isArray(rows) && rows.length) use(rows); return ALL; }, function () { return ALL; });
  }
  function meta(s) { return (META && META[s]) || null; }

  return { BASE: BASE, FAMILIES: FAMILIES, TIERS: TIERS, BASIC: BASIC, EXCLUSIVE: EXCLUSIVE, FILMS: FILMS, OWNED: OWNED,
    THEMES: THEMES, ALL: ALL, slug: slug, cover: cover, hasFilm: hasFilm, film: film, use: use, load: load, meta: meta };
})();
