/* Nawala home page behaviour. No libraries. Everything here is optional polish:
   the page reads and works with this file missing. */
(function () {
  'use strict';

  var CONFIG = {
    whatsapp: '6281379211628',
    // The Nawala Supabase project (organization under adjisena@nawalainvite.com, Singapore), connected 21 Nov 2026.
    // The key is the publishable one: it is meant to be public, and row level security decides what it may do
    // (add a lead, ask whether an access code exists; nothing can be read). See supabase/migrations.
    // If either value is emptied, or a request fails, the contact box and the log-in box fall back to WhatsApp.
    supabaseUrl: 'https://erwddnobnagpglkpvdfm.supabase.co',
    supabaseKey: 'sb_publishable_S1QUgptDBKUYn_yn0lPc0A_9hVsKwQe'
  };

  /* The first themes: seven families, four directions each. Covers are colour fields until they are painted. */
  var FAMILIES = {
    alam: ['Alam', 'Nature', 'Hutan, pantai, gunung, taman, dan langit.', 'Forest, coast, mountain, garden and sky.'],
    royal: ['Kerajaan', 'Royal', 'Balairung istana dalam sepuluh warna, selalu berpadu emas.', 'Palace halls in ten colours, always with gold.'],
    religi: ['Religi', 'Faith', 'Untuk akad, pemberkatan, dan setiap upacara keagamaan.', 'For akad, blessing and every ceremony of faith.'],
    nusa: ['Nusantara', 'Nusantara', 'Betawi, Jawa, Sunda, Bali, Palembang, dan banyak lagi.', 'Betawi, Javanese, Sundanese, Balinese, Palembang and more.'],
    dunia: ['Mancanegara', 'The world', 'Toskana, Paris, Santorini, Kyoto.', 'Tuscany, Paris, Santorini, Kyoto.'],
    era: ['Lintas masa', 'Eras', 'Tempo doeloe, noir, koboi, zaman samurai.', 'Old days, noir, the Old West, the age of samurai.'],
    elemen: ['Elemen', 'Elements', 'Air, api, bumi, emas, mutiara.', 'Water, fire, earth, gold, pearl.'],
    bunga: ['Bunga dan warna', 'Flowers and colour', 'Lukisan bunga dan palet warna, dengan bunga di sudut kartu.', 'Painted flowers and colour palettes, with flowers on the card corners.'],
    tempat: ['Tempat di Indonesia', 'Places in Indonesia', 'Danau, gunung, pantai, dan kota di Indonesia, dilukis.', 'Lakes, mountains, beaches and towns of Indonesia, painted.'],
    budaya: ['Iman dan budaya', 'Faith and culture', 'Lengkung, batik, songket, dan rumah adat, dilukis.', 'Arches, batik, songket and traditional houses, painted.'],
    waktu: ['Musim dan waktu', 'Seasons and times of day', 'Fajar, senja, malam, hujan, dan musim, dilukis.', 'Dawn, dusk, night, rain and seasons, painted.']
  };
  /* pictures and films are named after the Indonesian theme name: assets/img/cover-<slug>.webp (-s for the small one),
     assets/video/<slug>.mp4 */
  var META = null;   /* the themes table, by slug, once the database has answered (see loadThemes) */
  function slug(th) { return th[6] || th[1].toLowerCase().replace(/ /g, '-'); }
  /* -s (220 wide) and -m (400 wide) are toned down on purpose so many covers can sit together quietly;
     the full-colour picture is only shown once a theme is opened */
  function cover(th, size) {
    var m = META && META[slug(th)];
    if (m && m.cover) return m.cover + (size ? '-' + size : '') + '.webp';   /* uploaded in the team console */
    return 'assets/img/cover-' + slug(th) + (size ? '-' + size : '') + '.webp';
  }
  /* Four tiers (owner, 21 Nov 2026). Dasar: the familiar scroll invitation: one real picture, readable cards, frames
     for the couple's photos. Premium: an immersive world: opening film, glass panels standing in the scenery, one swipe
     one step. Eksklusif: sold to one couple only, then marked as owned. Kustom: built from the couple's own inspiration. */
  /* Premium worlds that already have a working sample invitation (undangan/?tema=<slug>). Add a slug when its kit is built. */
  var BUILT = ' pendopo-jawa akad-putih istana-awan teater-tua kapal-bulan kyoto seribu-lentera ';
  var TIERS = {
    dasar: ['Dasar', 'Basic', 'Undangan gulir yang akrab: satu gambar, kartu yang mudah dibaca, dan bingkai untuk foto kalian. 12 foto dan 72 lukisan dengan bunga di sudut kartu; semuanya sudah bisa dibuka.', 'The familiar scroll invitation: one picture, cards that read easily, and frames for your photos. 12 photographs and 72 paintings with flowers on the card corners; every one can be opened.'],
    premium: ['Premium', 'Premium', 'Dunia yang bisa dimasuki: film pembuka, panel kaca di tengah pemandangan, satu geser satu langkah. Tema Umum Nawala, Pendopo Jawa, Akad Putih, Kyoto, Istana Awan, Teater Tua, Kapal Bulan, dan Seribu Lentera sudah bisa dibuka; dunia lainnya kami kerjakan satu per satu.', 'A world to walk into: an opening film, glass panels standing in the scenery, one swipe one step. The General Nawala theme, Pendopo Jawa, Akad Putih, Kyoto, Istana Awan, Teater Tua, Kapal Bulan and Seribu Lentera can be opened now; the other worlds are being built one by one.'],
    eksklusif: ['Eksklusif', 'Exclusive', 'Enam dunia. Masing-masing hanya untuk satu pasangan: setelah dipilih, tema itu tidak kami pakai lagi. Semuanya masih dalam pengerjaan.', 'Six worlds. Each belongs to one couple only: once chosen, we never use it again. All of them are still being built.'],
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
    ['Malam Bintang', 'Starry Night', 'Langit berbintang, lampu kecil, dan bunga putih.', 'A starry sky, fairy lights and white flowers.'],
    /* painted, like the illustrated scroll invitations people already know (21 Nov 2026): [name, English, description, English, family, slug] */
    ['Sage Pagi', 'Sage Morning', 'Padang hijau sage berkabut, eukaliptus, dan mawar putih kecil.', 'A misty sage meadow, eucalyptus and small white roses.', 'bunga', 'sage-pagi'],
    ['Mawar Debu', 'Dusty Rose Garden', 'Taman mawar tua dalam kabut merah muda pudar.', 'An old rose garden in a dusty pink haze.', 'bunga', 'mawar-debu'],
    ['Lila', 'Lilac', 'Semak lila di bawah langit ungu pucat.', 'Lilac bushes under a pale violet sky.', 'bunga', 'lila'],
    ['Terakota Kering', 'Dried Terracotta', 'Lembah hangat, rumput pampas, dan mawar terakota.', 'A warm valley, pampas grass and terracotta roses.', 'bunga', 'terakota-kering'],
    ['Navy Emas', 'Navy and Gold', 'Taman malam biru tua dengan bintang emas.', 'A navy night garden with gold stars.', 'bunga', 'navy-emas'],
    ['Gading', 'Ivory', 'Teras taman gading dengan pagar batu dan mawar putih.', 'An ivory garden terrace, stone balustrade and white roses.', 'bunga', 'gading'],
    ['Peoni', 'Peony', 'Taman peony merah muda yang larut dalam kabut krem.', 'A blush peony garden fading into cream mist.', 'bunga', 'peoni'],
    ['Zaitun', 'Olive Grove', 'Kebun zaitun keperakan di bukit yang landai.', 'A silvery olive grove on gentle hills.', 'bunga', 'zaitun'],
    ['Kuning Mentega', 'Butter Yellow', 'Padang bunga kuning mentega dan aster putih.', 'A butter yellow meadow and white daisies.', 'bunga', 'mentega'],
    ['Persik', 'Peach', 'Kebun persik sedang berbunga di bawah langit lembut.', 'A peach orchard in bloom under a soft sky.', 'bunga', 'persik'],
    ['Hortensia', 'Hydrangea', 'Jalan taman berbatas hortensia biru dan lavender.', 'A garden path lined with blue and lavender hydrangea.', 'bunga', 'hortensia'],
    ['Anggrek', 'Orchid', 'Rumah kaca tropis dengan anggrek putih dan ungu.', 'A tropical glasshouse of white and purple orchids.', 'bunga', 'anggrek'],
    ['Bunga Liar', 'Wildflowers', 'Padang bunga liar: poppy, cornflower, dan rumput tinggi.', 'A wildflower meadow: poppies, cornflowers and tall grass.', 'bunga', 'bunga-liar'],
    ['Lili Putih', 'White Lily', 'Lili putih yang tinggi di tepi kolam yang tenang.', 'Tall white lilies beside a still pond.', 'bunga', 'lili-putih'],
    ['Anggur Merah', 'Burgundy', 'Taman dahlia merah anggur saat senja.', 'A garden of burgundy dahlias at dusk.', 'bunga', 'anggur-merah'],
    ['Kamomil', 'Chamomile', 'Hamparan bunga kamomil di bawah langit pucat.', 'A field of chamomile under a pale sky.', 'bunga', 'kamomil'],
    ['Tulip', 'Tulip Fields', 'Ladang tulip pastel dan kincir angin di kejauhan.', 'Pastel tulip fields and a windmill far away.', 'bunga', 'tulip'],
    ['Bunga Matahari', 'Sunflower', 'Ladang bunga matahari di bukit saat sore keemasan.', 'Sunflower fields on the hills at golden hour.', 'bunga', 'matahari'],
    ['Sawah Terasering', 'Rice Terraces', 'Sawah terasering hijau di pagi berkabut.', 'Green rice terraces on a misty morning.', 'tempat', 'sawah'],
    ['Danau Toba', 'Lake Toba', 'Danau Toba yang tenang, bukit hijau, dan kamboja putih.', 'Calm Lake Toba, green hills and white frangipani.', 'tempat', 'toba'],
    ['Bromo Subuh', 'Bromo at Dawn', 'Bromo dan lautan pasir saat fajar merah muda.', 'Bromo and its sea of sand at a pink dawn.', 'tempat', 'bromo'],
    ['Raja Ampat', 'Raja Ampat', 'Pulau karst Raja Ampat di air biru toska.', 'The karst islands of Raja Ampat in turquoise water.', 'tempat', 'raja-ampat'],
    ['Dieng Berkabut', 'Misty Dieng', 'Dataran Dieng yang berkabut, telaga, dan pinus.', 'The misty Dieng plateau, its lake and pines.', 'tempat', 'dieng'],
    ['Kebun Teh', 'Tea Plantation', 'Barisan kebun teh di perbukitan berkabut.', 'Rows of tea on misty hills.', 'tempat', 'kebun-teh'],
    ['Belitung', 'Belitung Shore', 'Batu granit di pantai pasir putih Belitung.', 'Granite boulders on a white Belitung beach.', 'tempat', 'belitung'],
    ['Rinjani', 'Rinjani', 'Gunung Rinjani dan danau kawahnya di pagi hari.', 'Mount Rinjani and its crater lake in the morning.', 'tempat', 'rinjani'],
    ['Labuan Bajo', 'Labuan Bajo', 'Teluk Labuan Bajo saat senja dan kapal pinisi jauh di laut.', 'The bays of Labuan Bajo at sunset, a phinisi far out.', 'tempat', 'labuan-bajo'],
    ['Kelimutu', 'Kelimutu', 'Tiga danau warna Kelimutu dalam kabut pagi.', 'The three coloured lakes of Kelimutu in morning haze.', 'tempat', 'kelimutu'],
    ['Ngarai Sianok', 'Sianok Canyon', 'Ngarai Sianok yang hijau dengan tebing dan sungai.', 'The green Sianok canyon, its cliffs and river.', 'tempat', 'ngarai'],
    ['Savana Sumba', 'Sumba Savanna', 'Bukit savana keemasan Sumba di bawah langit luas.', 'Golden savanna hills of Sumba under a wide sky.', 'tempat', 'sumba'],
    ['Kawah Ijen', 'Ijen Night', 'Kawah Ijen di malam hari dengan cahaya biru dan bintang.', 'The Ijen crater at night, blue glow and stars.', 'tempat', 'ijen'],
    ['Braga', 'Braga Street', 'Deretan toko art deco di Jalan Braga, Bandung, selepas hujan.', 'The Art Deco shopfronts of Braga, Bandung, after rain.', 'tempat', 'braga'],
    ['Kota Tua', 'Old Batavia', 'Alun-alun Kota Tua Jakarta, gedung putih dan sepeda.', 'The old square of Kota Tua, white buildings and bicycles.', 'tempat', 'kota-tua'],
    ['Hutan Ubud', 'Ubud Forest', 'Lembah hutan Ubud, sungai kecil, dan monstera.', 'An Ubud jungle valley, a small river and monstera.', 'tempat', 'ubud'],
    ['Pinisi', 'Phinisi Sail', 'Kapal pinisi di laut biru yang tenang saat sore.', 'A phinisi on a calm blue sea in the late afternoon.', 'tempat', 'pinisi'],
    ['Danau Sentani', 'Lake Sentani', 'Danau Sentani, bukit hijau, dan rumah panggung saat fajar.', 'Lake Sentani, green hills and stilt houses at dawn.', 'tempat', 'danau-sentani'],
    ['Lengkung Islami', 'Islamic Arch', 'Lengkung krem berkisi geometri dan taman di baliknya.', 'A cream arch with a geometric lattice and a garden beyond.', 'budaya', 'lengkung-islami'],
    ['Lentera Mihrab', 'Lantern Niche', 'Ceruk berlengkung dengan lentera kuningan dan ubin hijau tua.', 'An arched niche with brass lanterns and deep green tiles.', 'budaya', 'mihrab-lentera'],
    ['Geometri Islami', 'Islamic Geometry', 'Pola bintang emas yang halus dan kubah di kejauhan.', 'Fine gold star patterns and a dome far away.', 'budaya', 'geometri'],
    ['Batik Parang', 'Batik Parang', 'Pita batik parang cokelat keemasan dan melati.', 'Bands of brown and gold batik parang with jasmine.', 'budaya', 'parang'],
    ['Batik Kawung', 'Batik Kawung', 'Batik kawung nila dan krem dengan melati.', 'Indigo and cream batik kawung with jasmine.', 'budaya', 'kawung'],
    ['Mega Mendung', 'Mega Mendung', 'Awan mega mendung Cirebon dalam gradasi biru.', 'Cirebon mega mendung clouds in shades of blue.', 'budaya', 'mega-mendung'],
    ['Songket Minang', 'Minang Songket', 'Songket merah berbenang emas dan atap rumah gadang.', 'Red songket with gold thread and a rumah gadang roof.', 'budaya', 'songket-minang'],
    ['Rumah Gadang', 'Rumah Gadang', 'Rumah gadang beratap gonjong di tengah sawah.', 'A rumah gadang with horned roofs among rice fields.', 'budaya', 'rumah-gadang'],
    ['Ubin Peranakan', 'Peranakan Tiles', 'Ubin peranakan hijau mint dan merah muda dengan peony.', 'Mint and pink peranakan tiles with peonies.', 'budaya', 'peranakan'],
    ['Lampion Merah', 'Red Lanterns', 'Lampion merah di pelataran berkabut dan bunga plum.', 'Red lanterns over a misty courtyard and plum blossom.', 'budaya', 'lampion'],
    ['Penjor Bali', 'Bali Penjor', 'Penjor janur di jalan desa Bali yang tenang.', 'Penjor of woven palm along a quiet Balinese village road.', 'budaya', 'penjor'],
    ['Ukiran Toraja', 'Toraja Carving', 'Tongkonan Toraja dan ukiran merah hitamnya di tengah sawah.', 'A Toraja tongkonan and its red and black carving in rice fields.', 'budaya', 'toraja'],
    ['Motif Dayak', 'Dayak Motif', 'Garis ornamen Dayak dan bulu enggang.', 'Dayak ornament lines and hornbill feathers.', 'budaya', 'dayak'],
    ['Angklung', 'Angklung', 'Angklung di rumpun bambu Sunda yang hijau.', 'Angklung in a green Sundanese bamboo grove.', 'budaya', 'angklung'],
    ['Gunungan', 'Gunungan', 'Gunungan wayang keemasan di atas krem.', 'A golden wayang gunungan on cream.', 'budaya', 'gunungan'],
    ['Songket Limar', 'Limar Songket', 'Songket limar merah keemasan dalam bingkai ukiran emas.', 'Red and gold songket limar in a carved gold frame.', 'budaya', 'songket-limar'],
    ['Kapel Kaca', 'Glass Chapel', 'Kapel taman putih dengan jendela kaca patri.', 'A white garden chapel with a stained glass window.', 'budaya', 'kapel-kaca'],
    ['Candi Bentar', 'Bali Split Gate', 'Candi bentar dari batu di antara pohon kamboja.', 'A stone candi bentar among frangipani trees.', 'budaya', 'gerbang-bali'],
    ['Fajar', 'First Light', 'Danau tenang pada cahaya pertama, merah muda dan emas.', 'A calm lake at first light, pink and gold.', 'waktu', 'fajar'],
    ['Golden Hour', 'Golden Hour', 'Padang keemasan dalam cahaya sore yang panjang.', 'A golden field in long afternoon light.', 'waktu', 'golden-hour'],
    ['Senja Jingga', 'Orange Dusk', 'Langit senja jingga di atas laut yang tenang.', 'An orange dusk sky over a calm sea.', 'waktu', 'jingga'],
    ['Biru Malam', 'Blue Night', 'Langit malam biru tua dan bulan purnama di atas bukit.', 'A deep blue night and a full moon over the hills.', 'waktu', 'biru-malam'],
    ['Hujan Taman', 'Garden Rain', 'Taman yang basah oleh hujan lembut.', 'A garden in gentle rain.', 'waktu', 'hujan'],
    ['Pantai Siang', 'Midday Beach', 'Pantai tropis yang cerah di siang hari.', 'A bright tropical beach at midday.', 'waktu', 'pantai-siang'],
    ['Musim Semi', 'Spring', 'Ranting sakura, langit musim semi, dan jembatan kecil.', 'Cherry blossom, a spring sky and a small bridge.', 'waktu', 'sakura'],
    ['Musim Gugur', 'Autumn', 'Jalan hutan musim gugur dengan maple jingga dan merah.', 'An autumn path of orange and red maples.', 'waktu', 'gugur'],
    ['Musim Salju', 'Winter', 'Hutan pinus bersalju yang sunyi.', 'A quiet snowy pine forest.', 'waktu', 'salju'],
    ['Kabut Pinus', 'Pine Mist', 'Lapisan hutan pinus berkabut di pagi kelabu.', 'Layers of misty pine forest on a grey morning.', 'waktu', 'kabut-pinus'],
    ['Bulan Purnama', 'Full Moon', 'Bulan purnama terbit di atas laut gelap berkilau perak.', 'A full moon rising over a dark silver sea.', 'waktu', 'purnama'],
    ['Pelangi', 'Rainbow', 'Pelangi pastel di atas bukit hijau selepas hujan.', 'A pastel rainbow over green hills after rain.', 'waktu', 'pelangi'],
    ['Embun Pagi', 'Morning Dew', 'Rumput dan daun berembun dalam cahaya pagi.', 'Dewy grass and leaves in morning light.', 'waktu', 'embun'],
    ['Kunang-Kunang', 'Fireflies', 'Padang rumput di malam musim panas penuh kunang-kunang.', 'A summer meadow at night full of fireflies.', 'waktu', 'kunang'],
    ['Langit Ungu', 'Violet Sky', 'Langit senja ungu dan merah muda di atas ladang lavender.', 'A violet and pink evening over lavender fields.', 'waktu', 'langit-ungu'],
    ['Padang Rumput', 'Grassland', 'Padang rumput hijau dan sebatang pohon di bawah awan putih.', 'A green grassland and a lone tree under white clouds.', 'waktu', 'padang'],
    ['Laut Subuh', 'Sea at Dawn', 'Laut tenang saat subuh dan mercusuar di kejauhan.', 'A calm sea at dawn and a far lighthouse.', 'waktu', 'laut-subuh'],
    ['Bintang Jatuh', 'Shooting Stars', 'Bintang jatuh di langit nila di atas gurun yang sunyi.', 'Shooting stars in an indigo sky over a quiet desert.', 'waktu', 'bintang-jatuh']
  ];
  var EXCLUSIVE = [
    ['Istana Awan', 'Cloud Palace', 'Tangga marmer menuju istana di atas awan.', 'A marble staircase to a palace above the clouds.'],
    ['Taman Kaca', 'Glass Garden', 'Rumah kaca penuh anggrek saat fajar.', 'A glasshouse full of orchids at dawn.'],
    ['Perpustakaan Emas', 'Golden Library', 'Perpustakaan keemasan; bukunya terbuka dan bercahaya saat tamu tiba.', 'A golden library; its book opens and glows as your guest arrives.'],
    ['Kapal Bulan', 'Moon Boat', 'Perahu kecil di lautan bintang menuju bulan sabit.', 'A small boat on a sea of stars, heading for the crescent moon.'],
    ['Seribu Lentera', 'A Thousand Lanterns', 'Lentera kertas naik di atas istana Nusantara; halaman kertas toska bergaris emas.', 'Paper lanterns rise over a Nusantara palace; deep teal pages lined with gold.'],
    ['Bawah Laut', 'Under the Sea', 'Paviliun karang dan mutiara di dasar laut yang jernih.', 'A pavilion of coral and pearl on a clear sea floor.'],
    ['Teater Tua', 'Old Opera House', 'Gedung opera tua; tirainya terbuka saat tamu mendekat.', 'An old opera house; the curtain parts as your guest approaches.'],
    ['Keraton Malam', 'Palace by Lamplight', 'Pelataran keraton yang diterangi ratusan pelita.', 'A palace courtyard lit by hundreds of oil lamps.'],
    ['Aurora', 'Aurora', 'Paviliun kaca di atas salju, di bawah cahaya utara.', 'A glass pavilion on snow under the northern lights.'],
    ['Kebun Mawar', 'Secret Rose Garden', 'Taman mawar rahasia; pintunya terbuka untuk tamu.', 'A secret rose garden; its door opens for your guest.']
  ];
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

  var doc = document, root = doc.documentElement;
  var $ = function (s, c) { return (c || doc).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || doc).querySelectorAll(s)); };
  var query = new URLSearchParams(location.search);
  var calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var desktop = matchMedia('(min-width: 900px)');
  var clamp = function (v) { return v < 0 ? 0 : v > 1 ? 1 : v; };
  var ease = function (v) { return v * v * (3 - 2 * v); };
  var lerp = function (a, b, k) { return a + (b - a) * k; };

  /* ---------- Language ---------- */
  var lang = root.lang === 'en' ? 'en' : 'id';
  var HEADLINES = {
    '2': ['Kabar bahagia, diantar dengan sayap.', 'Good news, delivered on wings.'],
    '3': ['Setiap tamu disambut, bukan sekadar dikirimi tautan.', 'Every guest is welcomed, not just sent a link.']
  };
  var h1 = $('[data-h1]');
  if (h1 && HEADLINES[query.get('h')]) {
    h1.textContent = HEADLINES[query.get('h')][0];
    h1.setAttribute('data-en', HEADLINES[query.get('h')][1]);
  }
  $$('[data-en]').forEach(function (el) { el.setAttribute('data-id', el.textContent); });
  $$('[data-en-placeholder]').forEach(function (el) { el.setAttribute('data-id-placeholder', el.placeholder); });
  function t(id, en) { return lang === 'en' ? en : id; }
  var afterLang = [];

  function applyLang() {
    root.lang = lang;
    $$('[data-en]').forEach(function (el) { el.textContent = el.getAttribute('data-' + lang); });
    $$('[data-en-placeholder]').forEach(function (el) { el.placeholder = el.getAttribute('data-' + lang + '-placeholder'); });
    $$('[data-lang]').forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-lang') === lang)); });
    $$('[data-wa]').forEach(function (a) {
      var msg = a.getAttribute(lang === 'en' ? 'data-wa-en' : 'data-wa');
      a.href = 'https://wa.me/' + CONFIG.whatsapp + '?text=' + encodeURIComponent(msg);
      a.target = '_blank'; a.rel = 'noopener';
    });
    doc.title = t('Nawala, surat yang hidup', 'Nawala, the living letter');
    afterLang.forEach(function (fn) { fn(); });
  }
  $$('[data-lang]').forEach(function (b) {
    b.addEventListener('click', function () {
      lang = b.getAttribute('data-lang');
      try { localStorage.setItem('nawala-lang', lang); } catch (e) {}
      applyLang();
    });
  });

  /* ---------- Menu panel (phones) ---------- */
  var nav = $('.nav'), menuBtn = $('.menu-btn'), sheet = $('.nav__items'), veil = $('.menu-veil');
  function setMenu(open) {
    root.classList.toggle('menu-open', open);
    menuBtn.setAttribute('aria-expanded', String(open));
    if (open) { veil.hidden = false; veil.offsetWidth; }
    else setTimeout(function () { if (!root.classList.contains('menu-open')) veil.hidden = true; }, 420);
  }
  menuBtn.addEventListener('click', function () { setMenu(!root.classList.contains('menu-open')); });
  veil.addEventListener('click', function () { setMenu(false); });
  sheet.addEventListener('click', function (e) { if (e.target.closest('a, [data-open]')) setMenu(false); });
  doc.addEventListener('keydown', function (e) { if (e.key === 'Escape' && root.classList.contains('menu-open')) { setMenu(false); menuBtn.focus(); } });

  /* which section are we in */
  var navLinks = $$('[data-nav]');
  if ('IntersectionObserver' in window) {
    var navIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        navLinks.forEach(function (a) {
          var on = a.getAttribute('data-nav') === en.target.id;
          a.classList.toggle('is-here', on);
          if (on) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current');
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    ['beranda', 'tentang', 'layanan', 'tema', 'kontak'].forEach(function (id) { var s = doc.getElementById(id); if (s) navIO.observe(s); });
  }

  /* ---------- Menu morph: top bar on the hero, rail on the left after it ----------
     Every link is laid out in its rail position. For the bar we work out where each one
     sits in the top row and move it there with a transform. */
  var flips = $$('[data-flip]').map(function (el) { return { el: el, dx: 0, dy: 0 }; });
  var lastM = -1;
  function layoutNav() {
    lastM = -1;
    if (!desktop.matches) { flips.forEach(function (f) { f.el.style.cssText = ''; }); return; }
    flips.forEach(function (f) { f.el.style.setProperty('--fx', 0); f.el.style.setProperty('--fy', 0); });
    var right = window.innerWidth - 30;
    for (var i = flips.length - 1; i >= 0; i--) {
      var f = flips[i], r = f.el.getBoundingClientRect(), label = $('span', f.el);
      var w = 48 + (label ? label.offsetWidth + 2 : 0);
      var isLang = f.el.hasAttribute('data-lang');
      var x = right - w;
      right = x - (isLang ? (f.el.getAttribute('data-lang') === 'id' ? 22 : 6) : (f.el.classList.contains('nav__login') ? 18 : 8));
      f.dx = x - r.left; f.dy = (isLang ? 28 : 24) - r.top; f.bx = x; f.w = w;
    }
  }
  /* The morph no longer follows the finger. Scrolling past a small threshold decides bar or rail
     (with a little room either side so it cannot flicker); the change then plays on its own clock,
     so it can never stop half-way. A round glass orb swells over the corner at the hand-over. */
  var menuBtnEl = $('.menu-btn'), orbSide = null, navGoal = -1, navM = 0, navFrom = 0, navT0 = 0, navDur = 0, navRun = false, orb = $('.nav__orb');
  function navMorph(y, vh) {
    var D = desktop.matches;
    if (calm) { navGoal = 1; navM = 1; drawNav(1, D); return; }
    var goal = navGoal === 1 ? (y > vh * .02 ? 1 : 0) : (y > vh * (D ? .08 : .05) ? 1 : 0);
    if (navGoal === -1) { navGoal = goal; navM = goal; drawNav(goal, D); return; }
    if (goal !== navGoal) {
      navGoal = goal; navFrom = navM; navT0 = performance.now();
      navDur = (D ? 820 : 560) * Math.max(.35, Math.abs(goal - navM));
      if (!navRun) { navRun = true; requestAnimationFrame(navStep); }
    }
    if (!navRun) drawNav(navM, D);   // after a resize the links are laid out again
  }
  function navStep(now) {
    var q = clamp((now - navT0) / navDur), e = q < .5 ? 4 * q * q * q : 1 - Math.pow(-2 * q + 2, 3) / 2;
    navM = navFrom + (navGoal - navFrom) * e;
    drawNav(navM, desktop.matches);
    if (q < 1) requestAnimationFrame(navStep); else navRun = false;
  }
  function drawNav(m, D) {
    if (orb && !calm) {   // the orb swells once, on its own short clock, as the morph passes the hand-over
      var side = m >= (D ? .42 : .78);
      if (orbSide !== null && side !== orbSide) { orb.classList.remove('is-on'); void orb.offsetWidth; orb.classList.add('is-on'); }
      orbSide = side;
    }
    lastM = m;
    var a = clamp(m / .55), b = clamp((m - .4) / .6);
    /* set on the menu and its button only: a variable on <html> would make the browser restyle the whole page every frame */
    var na = D ? a.toFixed(4) : m.toFixed(3);
    nav.style.setProperty('--na', na); nav.style.setProperty('--nb', b.toFixed(4));
    if (menuBtnEl) menuBtnEl.style.setProperty('--na', na);
    nav.classList.toggle('is-bar', a < 1);
    nav.classList.toggle('is-top', m === 0);
    nav.classList.toggle('is-rail', m === 1);
    root.classList.toggle('bar-gone', m > .42);
    if (!D) return;
    /* the bar's right edge pulls back like a curtain; each link fades as the edge reaches it,
       then reappears in the rail and slides down into its place */
    var edge = 88 + (window.innerWidth - 104) * (1 - a);
    nav.style.setProperty('--lab', a < 1 ? 1 : 0);
    nav.style.setProperty('--wm', clamp((edge - 180) / 60).toFixed(3));
    flips.forEach(function (f, i) {
      var fx, fy, o;
      /* a link is gone before the edge reaches its label, so no letter is ever left outside the glass */
      if (a < 1) { fx = f.dx; fy = f.dy; o = clamp((edge - (f.bx + f.w) - 10) / 46); }
      else { var k = clamp((b - .25) / .75); fx = 0; fy = f.dy * (1 - k); o = clamp((b - .25 - i * .035) / .3); }
      f.el.style.setProperty('--fx', fx.toFixed(1)); f.el.style.setProperty('--fy', fy.toFixed(1)); f.el.style.setProperty('--fo', o.toFixed(3));
    });
  }

  /* ---------- Scroll progress: two numbers per section ----------
     --e: 0 when the section's top reaches the bottom of the screen, 1 when it reaches the top.
     --p: 0 when the section's top reaches the top of the screen, 1 when the section has passed. */
  var scrollEls = $$('[data-scroll]').map(function (el) { return { el: el, e: -1, p: -1 }; });
  var about = $('.about'), says = $$('.say');
  var lastAboutP = -1, aboutStep = -1;
  function measure(vh) {
    scrollEls.forEach(function (s) {
      var r = s.el.getBoundingClientRect();
      if (r.bottom < -vh || r.top > vh * 2) return;
      var e = Math.round(clamp(1 - r.top / vh) * 1000) / 1000;
      var span = r.height > vh * 1.4 ? r.height - vh : r.height;
      var p = Math.round(clamp(-r.top / Math.max(1, span)) * 1000) / 1000;
      if (e !== s.e) { s.e = e; s.el.style.setProperty('--e', e); }
      /* the light between sections rises once the section is a little way in, and sinks again only when it has left */
      var rise = s.el.classList.contains('is-rise') ? e > .02 : e > .14;
      if (rise !== s.el.classList.contains('is-rise')) s.el.classList.toggle('is-rise', rise);
      if (p !== s.p) { s.p = p; s.el.style.setProperty('--p', p); }
      if (s.el === about && p !== lastAboutP) {
        /* the scroll only picks the message; each one glides in and out on its own clock */
        lastAboutP = p;
        var step = Math.max(0, Math.min(says.length - 1, Math.floor(p * says.length)));
        if (step !== aboutStep) {
          aboutStep = step;
          says.forEach(function (el, i) { el.classList.toggle('is-on', i === step); el.classList.toggle('is-past', i < step); });
        }
      }
    });
  }

  /* ---------- Guided stretch: one swipe, one step ----------
     From the sky down to the last services item the page does not scroll under the finger. A swipe (or one
     turn of the wheel, or an arrow key) moves exactly one step, gliding on its own clock: the sky, the arch's
     three messages, then each item of the services (the day in one link, then the five services; on phones a
     tall card gets a stop at its top and one at its bottom). From the last step a swipe down glides to the
     themes, where free scrolling begins; from the first, a swipe up goes back to the sky. A fling that comes
     in from outside is caught at the first (or last) step, so nothing can be skipped by one hard swipe.
     Owner, 22 Nov 2026: the dark services stretch had no such stop and one hard gesture skipped three items. */
  (function () {
    if (calm || !about) return;
    var gliding = false, wheelAt = 0, wheelSum = 0, tY = 0, tOn = false, lastY = window.scrollY, jumpUntil = 0;
    var svcItems = $$('.services__list > .svc'), themesSec = $('.themes');
    function absTop(el) { return el.getBoundingClientRect().top + window.scrollY; }
    function stops() {
      var vh = window.innerHeight, top = absTop(about), span = about.offsetHeight - vh, list = [];
      [.5 / 3, .5, 2.5 / 3].forEach(function (f) { list.push(Math.round(top + span * f)); });
      var head = desktop.matches ? 0 : 76;          // phones: room under the menu button
      var foot = Math.round(vh * (desktop.matches ? .1 : .1));   // the band of leaves held at the bottom of the screen
      svcItems.forEach(function (li) {
        var t = absTop(li), h = li.offsetHeight, room = vh - head - foot - 16;
        if (h <= room) list.push(Math.round(t + h / 2 - (vh + head - foot) / 2));
        else { list.push(Math.round(t - head - 12)); list.push(Math.round(t + h - vh + foot + 16)); }
      });
      /* keep them in order and apart, so no two stops land on the same place */
      var out = [];
      list.forEach(function (y) { if (!out.length || y > out[out.length - 1] + 40) out.push(y); });
      var exit = themesSec ? Math.round(absTop(themesSec)) : out[out.length - 1] + vh;
      if (exit <= out[out.length - 1] + 40) exit = out[out.length - 1] + Math.round(vh * .9);
      return { list: out, last: out[out.length - 1], exit: exit };
    }
    /* the hero counts too: from the sky, one swipe glides down to the first message with the light rising in step */
    function inside(y, S) { return y <= S.last + 6; }
    function nearest(y, S) { var n = 0; for (var i = 1; i < S.list.length; i++) if (Math.abs(S.list[i] - y) < Math.abs(S.list[n] - y)) n = i; return n; }
    /* our own glide, eased and of a fixed length (a browser's smooth scroll is too quick on iOS and looks like a jump) */
    function glide(to) {
      var from = window.scrollY, d = to - from, ms = Math.min(1300, Math.max(700, 600 + Math.abs(d) * .45)), t0 = 0;
      gliding = true;
      requestAnimationFrame(function f(now) {
        if (!t0) t0 = now;
        var q = Math.min(1, (now - t0) / ms), e = q < .5 ? 4 * q * q * q : 1 - Math.pow(-2 * q + 2, 3) / 2;
        window.scrollTo({ top: Math.round(from + d * e), behavior: 'instant' });
        if (q < 1) requestAnimationFrame(f); else setTimeout(function () { gliding = false; lastY = window.scrollY; }, 60);
      });
    }
    function step(dir) {
      var S = stops(), y = window.scrollY, to;
      if (y < S.list[0] - 6) { if (dir > 0) glide(S.list[0]); return; }   // in the sky: down goes to the first message, up does nothing
      var i = nearest(y, S);
      if (dir > 0) to = i < S.list.length - 1 ? S.list[i + 1] : S.exit;
      else to = i > 0 ? S.list[i - 1] : 0;
      glide(Math.max(0, to));
    }
    /* a native fling that runs into the stretch is caught at the first or last step */
    function halt(to) {
      var html = document.documentElement, was = html.style.overflow;
      html.style.overflow = 'hidden';                 // stops the momentum on iOS
      requestAnimationFrame(function () { html.style.overflow = was; glide(to); });
    }
    /* a tap on a menu link travels where it was sent, without being caught on the way */
    document.addEventListener('click', function (e) { if (e.target.closest && e.target.closest('a[href^="#"]')) jumpUntil = Date.now() + 1800; }, true);
    addEventListener('scroll', function () {
      var y = window.scrollY;
      if (!gliding && !tOn && Date.now() > jumpUntil) {
        var S = stops();
        if (lastY < S.list[0] - 6 && y >= S.list[0] - 6 && y < S.last) halt(S.list[0]);
        else if (lastY > S.last + 6 && y <= S.last + 6 && y > S.list[0]) halt(S.last);
      }
      lastY = y;
    }, { passive: true });
    addEventListener('touchstart', function (e) {
      tOn = inside(window.scrollY, stops()) && !(e.target.closest && e.target.closest('dialog,.nav__items'));
      tY = e.touches[0].clientY;
    }, { passive: true });
    addEventListener('touchmove', function (e) { if (tOn) e.preventDefault(); }, { passive: false });
    addEventListener('touchend', function (e) {
      if (!tOn) return; tOn = false;
      var dy = tY - (e.changedTouches[0] ? e.changedTouches[0].clientY : tY);
      if (Math.abs(dy) > 28 && !gliding) step(dy > 0 ? 1 : -1);
    }, { passive: true });
    addEventListener('wheel', function (e) {
      if (e.target.closest && e.target.closest('dialog')) return;
      if (!inside(window.scrollY, stops()) && !gliding) return;
      e.preventDefault();
      var now = Date.now();
      if (gliding || now - wheelAt < 650) { wheelAt = gliding ? now : wheelAt; return; }
      wheelSum += e.deltaY;
      if (Math.abs(wheelSum) > 18) { wheelAt = now; step(wheelSum > 0 ? 1 : -1); wheelSum = 0; }
    }, { passive: false });
    var next = $('.hero__next');
    if (next) next.addEventListener('click', function (e) { e.preventDefault(); if (!gliding) glide(stops().list[0]); });
    addEventListener('keydown', function (e) {
      if (!inside(window.scrollY, stops()) || /input|textarea|select/i.test(e.target.tagName) || (e.target.closest && e.target.closest('dialog'))) return;
      var k = e.key, d = (k === 'ArrowDown' || k === 'PageDown' || (k === ' ' && !e.shiftKey)) ? 1 : (k === 'ArrowUp' || k === 'PageUp' || (k === ' ' && e.shiftKey)) ? -1 : 0;
      if (!d) return; e.preventDefault(); if (!gliding) step(d);
    });
  })();

  /* ---------- Nawala: one letter, with a will of its own ----------
     Scrolling only decides which section Nawala belongs to (the one under the middle of the screen).
     Inside a section it plays that section's routine on its own clock: flying, the flip, the bump
     into the branch and the tumble, the hops. When the section changes it flies to the new routine
     at its own pace. A fast flick never makes it faster; it only changes where it is heading.
     A point is either on the screen (x, y in pixels) or pinned to the page (dy: a document y), so a
     letter sitting on a box moves with that box while the page scrolls, as anything on the page does. */
  var nw = $('#nw'), ask = $('#ask'), services = $('.services'), themes = $('.themes'), contact = $('.contact'), pair = $('#pair');
  var nwBase = 190, poseNow = 'fly', poseHold = '', mx = 0, my = 0, pairTop = 0, pairSpan = 1;
  var travel = !calm && !!nw;
  var SECS = [['hero', $('.hero')], ['about', about], ['services', services], ['themes', themes], ['contact', contact]];
  var R = {}, secNow = '', routine = null, rStart = 0, rLastT = -1, fromS = null, flyFrom = 0, flyDur = 0, cur = null;
  function docTop(el) { return el.getBoundingClientRect().top + window.scrollY; }
  function plan() {
    var vw = window.innerWidth, vh = window.innerHeight, D = desktop.matches;
    var maxY = Math.max(1, root.scrollHeight - vh);
    if (pair) { pairTop = docTop(pair); pairSpan = Math.max(80, Math.min(vh * .5, vh - (pairTop - maxY) - 30)); }
    if (!travel) return;
    nwBase = D ? 300 : 190;
    var br = ask.getBoundingClientRect(), bT = br.top + window.scrollY;
    var ph = D ? $('.services__phone').getBoundingClientRect() : null;
    var perchS = D ? .5 : .78, perchY = bT - nwBase * .26 * perchS + (D ? 20 : 6);
    var side = D ? ph.left - 84 : vw - 58, sideS = D ? .5 : .42;
    var cx = D ? .4 : .5;
    var pan = $('#themes-panel'), panR = pan ? pan.getBoundingClientRect().right : 0;
    var bn = $('#branch').getBoundingClientRect(), tipX = bn.left + bn.width * .1, tipY = bn.top + window.scrollY + bn.height * .3;
    var hx = (D ? .73 : .5) * vw, hy = (D ? .47 : .6) * vh, hs = D ? 1.3 : 1.2;
    /* each routine: [seconds, point, pose, cue]; loop routines go back to their first point */
    R = {
      hero: { loop: true, k: [
        { t: 0, x: hx, y: hy, s: hs, r: -4, pose: 'fly' },
        { t: 2.8, x: hx - vw * .018, y: hy - vh * .035, s: hs, r: 2, pose: 'fly' },
        { t: 5.6, x: hx + vw * .016, y: hy + vh * .02, s: hs * .97, r: -7, pose: 'fly' },
        { t: 8.4 } ] },
      about: { loop: true, k: [
        { t: 0, x: (cx + .04) * vw, y: (D ? .6 : .74) * vh, s: .85, r: -6, pose: 'fly' },
        { t: 1.8, x: cx * vw, y: (D ? .56 : .7) * vh, s: .7, r: 0, pose: 'fly', cue: 'flip' },
        { t: 2.6, x: (cx - .015) * vw, y: (D ? .52 : .66) * vh, s: .55, r: -3, pose: 'back34' },
        { t: 5.4, x: (cx - .04) * vw, y: (D ? .47 : .6) * vh, s: .3, r: 0, pose: 'back34' },
        { t: 6.8, x: cx * vw, y: (D ? .52 : .68) * vh, s: .82, r: 0, pose: 'open' },
        { t: 9.6, x: (cx + .02) * vw, y: (D ? .5 : .66) * vh, s: .95, r: 0, pose: 'open' },
        { t: 11.4, x: (cx + .05) * vw, y: (D ? .56 : .72) * vh, s: .9, r: -8, pose: 'tilt' },
        { t: 12.6 } ] },
      services: { loop: true, k: [
        { t: 0, x: side, y: D ? .3 * vh : 60, s: sideS, r: -5, pose: 'fly' },
        { t: 3.2, x: side - (D ? 10 : 4), y: D ? .48 * vh : 66, s: sideS, r: 4, pose: 'fly', cue: 'flip' },
        { t: 6.4, x: side + (D ? 6 : 0), y: D ? .62 * vh : 58, s: sideS, r: 0, pose: 'fly' },
        { t: 9.6 } ] },
      /* comes in from the right, flies straight into the tip of the branch, tumbles, gathers itself;
         on desktop it never crosses the panel's writing, on phones it keeps to the top edge */
      themes: { loop: true, k: [
        { t: 0, x: D ? Math.min(vw - 90, tipX + vw * .24) : .8 * vw, y: D ? .2 * vh : .1 * vh, s: D ? .56 : .5, r: -8, pose: 'fly' },
        { t: 2, x: tipX + nwBase * .12, dy: tipY, s: D ? .56 : .5, r: 6, pose: 'fly', cue: 'bump' },
        { t: 2.15, x: tipX + nwBase * .16, dy: tipY + 8, s: D ? .56 : .5, r: 0, pose: 'tumble' },
        { t: 3.9, x: D ? Math.min(vw - 120, Math.max(panR + 90, tipX + vw * .12)) : .84 * vw, y: D ? .7 * vh : .2 * vh, s: D ? .56 : .46, r: 400, pose: 'tumble' },
        { t: 5.1, x: D ? Math.max(panR + 110, .76 * vw) : .8 * vw, y: D ? .54 * vh : .14 * vh, s: D ? .54 : .46, r: 720, pose: 'fly' },
        { t: 8.6, x: D ? Math.max(panR + 100, .82 * vw) : .74 * vw, y: D ? .32 * vh : .09 * vh, s: D ? .56 : .48, r: 726, pose: 'tilt' },
        { t: 10.6 } ] },
      contact: { loop: false, k: [
        { t: 0, x: br.left + (D ? 56 : 48), dy: perchY, s: perchS, r: 0, pose: 'hop', hop: 4 },
        { t: 3.2, x: br.right - (D ? 96 : 70), dy: perchY + (D ? 6 : 4), s: perchS * 1.15, r: 0, pose: 'rest' } ] }
    };
    Object.keys(R).forEach(function (n) {
      var k = R[n].k, last = k[k.length - 1];
      if (last.x == null) { R[n].len = last.t; k.pop(); } else R[n].len = last.t;
    });
    if (routine) routine = R[secNow] || null;
  }
  function setPose(p) {
    if (p === poseNow) return;
    poseNow = p; nw.setAttribute('data-pose', p);
  }
  var cueTimer = {};
  function cue(name, ms) {
    nw.classList.remove('is-' + name); nw.offsetWidth; nw.classList.add('is-' + name);
    clearTimeout(cueTimer[name]);
    cueTimer[name] = setTimeout(function () { nw.classList.remove('is-' + name); }, ms);
  }
  function vy(p, y, vh) {   // a point's height on the screen, kept on the screen
    var v = p.dy != null ? p.dy - y : p.y;
    return Math.max(vh * .08, Math.min(vh * .9, v));
  }
  function sectionAt(vh) {
    var mid = vh * .5, name = 'hero';
    for (var i = 0; i < SECS.length; i++) {
      var el = SECS[i][1]; if (!el) continue;
      if (el.getBoundingClientRect().top <= mid) name = SECS[i][0];
    }
    return name;
  }
  /* where the routine is at time t (seconds), on the screen */
  function at(rt, t, y, vh) {
    var k = rt.k, n = k.length, i = 0;
    if (rt.loop) t = t % rt.len; else t = Math.min(t, rt.len);
    while (i < n - 1 && t >= k[i + 1].t) i++;
    var a = k[i], b, span;
    if (i < n - 1) { b = k[i + 1]; span = b.t - a.t; }
    else if (rt.loop) { b = k[0]; span = rt.len - a.t; }
    else { b = a; span = 1; }
    var q = b === a ? 0 : clamp((t - a.t) / span), qe = ease(q);
    var br = b.r;
    if (rt.loop && b === k[0]) br = b.r + 360 * Math.round((a.r - b.r) / 360);   // round the loop without spinning back
    var o = { x: lerp(a.x, b.x, qe), y: lerp(vy(a, y, vh), vy(b, y, vh), qe), s: lerp(a.s, b.s, qe), r: lerp(a.r, br, qe), pose: a.pose, i: i };
    if (a.hop) {
      /* small hops, one at a time: crouch, in the air, land */
      o.x = lerp(a.x, b.x, q);
      var ph = (q * a.hop) % 1;
      o.y -= Math.sin(ph * Math.PI) * 40 * o.s;
      o.pose = q >= 1 ? b.pose : ph < .14 ? 'hop1' : ph < .7 ? 'hop2' : 'hop3';
    }
    return o;
  }
  function enter(name, now) {
    secNow = name; routine = R[name] || null;
    if (!routine) return;
    if (cur) {   // fly over from wherever it is now, at its own pace
      fromS = { x: cur.x, y: cur.y, s: cur.s, r: ((cur.r % 360) + 540) % 360 - 180 };
      var to = at(routine, 0, window.scrollY, window.innerHeight);
      var d = Math.hypot(to.x - fromS.x, to.y - fromS.y) / Math.max(window.innerWidth, window.innerHeight);
      flyFrom = now; flyDur = Math.max(.9, Math.min(1.9, .8 + d * 1.6));
      rStart = now + flyDur * 1000;
    } else { fromS = null; rStart = now; }
    rLastT = -1;
  }
  /* the phone's status bar takes the colour of the section under it, so the top of the screen is seamless */
  var barMeta = doc.querySelector('meta[name="theme-color"]'), BAR = { hero: '#F2F1E9', about: '#F1F1EE', services: '#14261A', themes: '#121A10', contact: '#F3F0EA' };
  function barTone(name) { if (barMeta && BAR[name] && barMeta.content !== BAR[name]) barMeta.content = BAR[name]; }
  var running = false;
  function frame(now) {
    if (!travel || document.hidden) { running = false; return; }
    var y = window.scrollY, vh = window.innerHeight;
    var name = sectionAt(vh);
    if (name !== secNow) { enter(name, now); root.setAttribute('data-sec', name); barTone(name); }
    if (!routine) { requestAnimationFrame(frame); return; }
    var o, done = false;
    if (fromS && now < rStart) {
      var q = clamp((now - flyFrom) / (flyDur * 1000)), qe = q < .5 ? 4 * q * q * q : 1 - Math.pow(-2 * q + 2, 3) / 2;
      var to = at(routine, 0, y, vh);
      var dx = to.x - fromS.x, dyy = to.y - fromS.y;
      var tr = to.r + 360 * Math.round((fromS.r - to.r) / 360);
      o = { x: fromS.x + dx * qe, y: fromS.y + dyy * qe - Math.sin(q * Math.PI) * Math.min(80, Math.abs(dx) * .12), s: lerp(fromS.s, to.s, qe),
        r: lerp(fromS.r, tr, qe) + Math.sin(q * Math.PI) * (dx > 0 ? 7 : -7),
        pose: Math.abs(dx) > Math.abs(dyy) * 1.4 ? 'tilt' : 'fly' };
    } else {
      fromS = null;
      var t = (now - rStart) / 1000;
      o = at(routine, t, y, vh);
      /* cues fire when the routine passes their point, the loop included */
      var tl = routine.loop ? t % routine.len : t;
      if (rLastT >= 0) routine.k.forEach(function (p) {
        if (!p.cue) return;
        var hit = tl >= rLastT ? (p.t > rLastT && p.t <= tl) : (p.t > rLastT || p.t <= tl);
        if (hit) cue(p.cue, p.cue === 'flip' ? 1100 : 600);
      });
      rLastT = tl;
      done = secNow === 'contact' && ask.classList.contains('is-done');
    }
    if (secNow === 'hero') { o.x += mx; o.y += my; }
    setPose(poseHold || (done ? 'open' : o.pose));
    var yy = o.y - (done ? 26 : 0);
    cur = o;
    nw.style.transform = 'translate3d(' + (o.x - nwBase / 2).toFixed(1) + 'px,' + (yy - nwBase * .367).toFixed(1) + 'px,0) rotate(' + o.r.toFixed(1) + 'deg) scale(' + o.s.toFixed(3) + ')';
    requestAnimationFrame(frame);
  }
  function wake() { if (travel && !running && !document.hidden) { running = true; requestAnimationFrame(frame); } }
  document.addEventListener('visibilitychange', wake);
  /* touch it and it turns to face you, blushes, and spins once */
  if (nw) {
    var tap = $('.nw__tap', nw), holdTimer = 0;
    var face = function (ms) {
      poseHold = 'front'; nw.classList.add('is-blush'); requestTick();
      clearTimeout(holdTimer);
      holdTimer = setTimeout(function () { nw.classList.remove('is-blush'); poseHold = ''; requestTick(); }, ms);
    };
    if (travel) {
      tap.addEventListener('pointerenter', function (e) { if (e.pointerType === 'mouse') face(60000); });
      tap.addEventListener('pointerleave', function (e) { if (e.pointerType === 'mouse') face(500); });
      tap.addEventListener('click', function () { face(1900); cue('flip', 1100); });
    }
    addEventListener('load', function () {
      $$('img[data-src]', nw).forEach(function (im) { im.src = im.getAttribute('data-src'); });
      nw.classList.add('can-blush');
    });
  }
  if (travel && matchMedia('(hover: hover) and (pointer: fine)').matches) {
    $('.hero').addEventListener('pointermove', function (e) {
      mx = (e.clientX / innerWidth - .5) * 26; my = (e.clientY / innerHeight - .5) * 18; requestTick();
    });
  }

  /* bride and groom hop toward each other, taking turns */
  var metNow = false;
  function pairHop(y, vh) {
    if (!pair) return;
    var q = clamp((vh - (pairTop - y)) / pairSpan);
    var w = Math.sin(q * Math.PI * 6);
    pair.style.setProperty('--hx', ease(q).toFixed(3));
    pair.style.setProperty('--hop', (q < 1 ? Math.max(0, w) * 24 : 0).toFixed(1));
    pair.style.setProperty('--hop2', (q < 1 ? Math.max(0, -w) * 24 : 0).toFixed(1));
    pair.style.setProperty('--lean', (q < 1 ? w * 5 : 0).toFixed(1));
    var met = q >= .97;
    if (met !== metNow) { metNow = met; pair.classList.toggle('is-met', met); }
  }

  var ticking = false;
  function tick() {
    ticking = false;
    var y = window.scrollY, vh = window.innerHeight;
    navMorph(y, vh);
    if (calm) return;
    measure(vh);
    pairHop(y, vh);
  }
  function requestTick() { if (!ticking) { ticking = true; requestAnimationFrame(tick); } }
  function replan() { layoutNav(); plan(); requestTick(); wake(); }
  afterLang.push(replan);
  addEventListener('scroll', requestTick, { passive: true });
  addEventListener('resize', replan);
  addEventListener('load', replan);
  if (doc.fonts && doc.fonts.ready) doc.fonts.ready.then(replan);
  if (travel) { nw.classList.add('is-live'); root.classList.add('nw-live'); }
  if (calm && pair) pair.classList.add('is-met');
  /* a section is "live" while it is on or near the screen (its creatures and light move only then),
     and "near" once it has come close (pictures used as backgrounds and masks load only then) */
  var nearJobs = [];
  if ('IntersectionObserver' in window) {
    var liveIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { en.target.classList.toggle('is-live', en.isIntersecting); });
    }, { rootMargin: '45% 0px' });
    var nearIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        en.target.classList.add('is-near'); nearIO.unobserve(en.target);
        nearJobs.forEach(function (j) { if (j[0] === en.target) j[1](); });
      });
    }, { rootMargin: '120% 0px' });
    $$('[data-scroll]').forEach(function (el) { liveIO.observe(el); });
    [services, themes, pair].forEach(function (el) { if (el) nearIO.observe(el); });
  } else {
    $$('[data-scroll]').forEach(function (el) { el.classList.add('is-live'); });
    [services, themes, pair].forEach(function (el) { if (el) el.classList.add('is-near'); });
    setTimeout(function () { nearJobs.forEach(function (j) { j[1](); }); }, 0);
  }

  /* ---------- Services: the phone stays, the screen changes ---------- */
  (function () {
    var phone = $('#phone-screen'), items = $$('.svc');
    if (!phone || !items.length) return;
    var screens = items.map(function (li) { return $('.svc__screen', li); });
    var qr = $('.qr'), frame = $('#phone'), tabs = $$('#phone-tabs i');
    if (qr) qr.innerHTML = fakeQr();
    function plans() {
      var p = $('.seat__plan--p'), l = $('.seat__plan--l');
      if (p) p.innerHTML = floorPlan(false);
      if (l) l.innerHTML = floorPlan(true);
    }
    plans(); afterLang.push(plans);
    var current = 0;
    /* Seven screens: the day in one link (the lead), then the opening, guestbook, floor plan, the couple's seating planner, souvenir, gallery.
       The tab bar belongs to the five wedding pages, so it hides on the first two. A screen plays its little
       hands-on loop (.play) only while it is the one in the desktop phone, or while its card is on a phone screen. */
    function setActive(i) {
      current = i;
      items.forEach(function (li, k) { li.classList.toggle('is-on', k === i); });
      screens.forEach(function (s, k) { s.classList.toggle('is-on', k === i); });
      replay(i);
      /* the tab bar belongs to the guest's pages (data-tab); the lead, the opening and the couple's planner hide it */
      var tab = items[i].getAttribute('data-tab');
      tabs.forEach(function (el, k) { el.classList.toggle('is-on', String(k) === tab); });
      if (frame) frame.classList.toggle('is-cover', i <= 1 || tab === null);
    }
    /* a screen's loop always starts from its beginning when it arrives: the class comes off, one frame passes,
       and it goes back on (owner, 22 Nov 2026: the day's light sometimes started at the third icon or already full) */
    function replay(i) {
      if (!desktop.matches || calm) return;
      screens.forEach(function (s) { s.classList.remove('play'); });
      void phone.offsetWidth;
      requestAnimationFrame(function () { if (current === i) screens[i].classList.add('play'); });
    }
    var svcSec = $('.services');
    if (svcSec && 'IntersectionObserver' in window) new IntersectionObserver(function (en) { if (en[0].isIntersecting) replay(current); }, { threshold: .35 }).observe(svcSec);
    function place() {
      screens.forEach(function (s, i) {
        s.classList.remove('play');
        if (desktop.matches) phone.appendChild(s);
        else if (items[i].classList.contains('svc--lead')) items[i].appendChild(s);
        else items[i].insertBefore(s, items[i].firstChild);
      });
      setActive(current);
    }
    place();
    if (desktop.addEventListener) desktop.addEventListener('change', function () { place(); replan(); });
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) { if (en.isIntersecting && desktop.matches) setActive(items.indexOf(en.target)); });
      }, { rootMargin: '-48% 0px -48% 0px' });
      items.forEach(function (li) { io.observe(li); });
      if (!calm) {
        var seen = new IntersectionObserver(function (entries) {
          entries.forEach(function (en) { if (!desktop.matches) screens[items.indexOf(en.target)].classList.toggle('play', en.isIntersecting); });
        }, { threshold: .45 });
        items.forEach(function (li) { seen.observe(li); });
      }
    }
  })();

  /* A sample reception room: stage with the couple, parents' tables, the aisle, ten round tables of eight,
     buffet, gifts and the entrance. Table 3 is the guest's. Drawn standing up (200 x 240), or lying down for
     the wide service card on phones, where every x and y simply trade places. */
  function floorPlan(lying) {
    var W = 200, H = 240, o = '';
    function pt(x, y) { return lying ? [y, x] : [x, y]; }
    function box(x, y, w, h, r, style) {
      var a = pt(x, y);
      return '<rect x="' + a[0] + '" y="' + a[1] + '" width="' + (lying ? h : w) + '" height="' + (lying ? w : h) + '" rx="' + r + '" ' + style + '/>';
    }
    function dot(x, y, r, style) { var a = pt(x, y); return '<circle cx="' + a[0].toFixed(1) + '" cy="' + a[1].toFixed(1) + '" r="' + r + '" ' + style + '/>'; }
    function label(x, y, str, size, fill, turned) {
      var a = pt(x, y);
      return '<text x="' + a[0] + '" y="' + a[1] + '" font-size="' + size + '" fill="' + fill + '"' + (turned && lying ? ' transform="rotate(-90 ' + a[0] + ' ' + a[1] + ')"' : '') + '>' + str + '</text>';
    }
    var ivory = '251,246,234';
    o += box(3, 3, W - 6, H - 6, 16, 'fill="rgba(12,29,19,.34)" stroke="rgba(' + ivory + ',.3)" stroke-width="1.5"');
    [[15, 15], [185, 15], [11, 112], [189, 112], [189, 205]].forEach(function (c) { o += dot(c[0], c[1], 5, 'fill="#4F7A3A"') + dot(c[0] + 3, c[1] - 3, 3, 'fill="#A9C98A"'); });
    o += box(92, 46, 16, 178, 7, 'fill="rgba(216,67,107,.5)"');                                   /* the aisle */
    o += box(60, 9, 80, 36, 9, 'fill="#FFE9A8"');                                                  /* the stage */
    o += label(100, 21, t('Pelaminan', 'Stage'), 8.5, '#16301F', true);
    o += dot(lying ? 100 - 8 : 92, lying ? 35 : 36, 3.6, 'fill="#D8436B"') + dot(lying ? 100 + 8 : 108, lying ? 35 : 36, 3.6, 'fill="#F4A6C0"');
    o += box(28, 15, 24, 13, 5, 'fill="rgba(' + ivory + ',.2)" stroke="rgba(' + ivory + ',.42)"') + box(148, 15, 24, 13, 5, 'fill="rgba(' + ivory + ',.2)" stroke="rgba(' + ivory + ',.42)"');
    var seats = [[140, 72], [168, 98], [140, 124], [168, 150], [140, 176], [60, 72], [32, 98], [60, 124], [32, 150], [60, 176]];
    seats.forEach(function (c, i) {
      var you = i === 2, k, a;
      if (you) o += dot(c[0], c[1], 19, 'fill="rgba(244,166,192,.3)"');
      for (k = 0; k < 8; k++) {
        a = k * Math.PI / 4 + Math.PI / 8;
        o += dot(c[0] + Math.cos(a) * 14.5, c[1] + Math.sin(a) * 14.5, 2.4, 'fill="' + (you && k === 5 ? '#F6C445' : 'rgba(' + ivory + ',.55)') + '"');
      }
      if (you) o += dot(c[0], c[1], 19, 'class="seat__ring" fill="none" stroke="#F4A6C0" stroke-width="2.5"');
      o += dot(c[0], c[1], 10.5, you ? 'fill="#F4A6C0"' : 'fill="rgba(' + ivory + ',.18)" stroke="rgba(' + ivory + ',.5)" stroke-width="1.2"');
      o += label(c[0], c[1], i + 1, 9.5, you ? '#16301F' : 'rgba(' + ivory + ',.92)');
    });
    o += box(12, 204, 66, 15, 7.5, 'fill="rgba(' + ivory + ',.2)" stroke="rgba(' + ivory + ',.42)"') + label(45, 211.5, t('Prasmanan', 'Buffet'), 8, 'rgba(' + ivory + ',.92)', true);
    o += box(146, 204, 38, 15, 6, 'fill="rgba(' + ivory + ',.2)" stroke="rgba(' + ivory + ',.42)"') + label(165, 211.5, t('Kado', 'Gifts'), 8, 'rgba(' + ivory + ',.92)', true);
    o += box(84, 231, 32, 6, 3, 'fill="#FFE9A8"');                                                 /* the entrance */
    return '<svg viewBox="0 0 ' + (lying ? H + ' ' + W : W + ' ' + H) + '" role="img" aria-label="' + t('Denah ruangan resepsi', 'Plan of the reception room') + '">' + o + '</svg>';
  }

  /* a drawing that reads as a QR code; it does not encode anything */
  function fakeQr() {
    var n = 21, seed = 7, cells = '';
    function rnd() { seed = (seed * 16807) % 2147483647; return seed / 2147483647; }
    function finder(x, y) { return '<rect x="' + x + '" y="' + y + '" width="7" height="7" rx="1.4"/><rect x="' + (x + 1) + '" y="' + (y + 1) + '" width="5" height="5" rx="1" fill="#FBF6EA"/><rect x="' + (x + 2) + '" y="' + (y + 2) + '" width="3" height="3" rx=".6"/>'; }
    for (var y = 0; y < n; y++) for (var x = 0; x < n; x++) {
      var inFinder = (x < 8 && y < 8) || (x > n - 9 && y < 8) || (x < 8 && y > n - 9);
      if (!inFinder && rnd() > .52) cells += '<rect x="' + x + '" y="' + y + '" width="1" height="1"/>';
    }
    return '<svg viewBox="-1 -1 23 23" fill="#16301F" aria-hidden="true">' + cells + finder(0, 0) + finder(14, 0) + finder(0, 14) + '</svg>';
  }

  /* ---------- Themes: the river behind, the collection in a pop-up ---------- */
  var chosen = null, showChosen = function () {};
  function turn(i) { return Math.floor(i / 7); }
  /* every theme as one list: [tier, name, English name, description, English description, family] */
  var WORLDS = { 'Istana Awan': 'royal', 'Teater Tua': 'era', 'Kapal Bulan': 'alam', 'Seribu Lentera': 'nusa' };
  var ALL = BASIC.map(function (b) { return ['dasar'].concat(b); })
    .concat(THEMES.map(function (th) { var f = FAMILIES[th[0]]; return ['premium', th[1], th[2], f[2], f[3], th[0]]; }))
    /* the built immersive worlds are Premium (owner, 22 Nov 2026); Exclusive keeps the covers still to be built */
    .concat(EXCLUSIVE.filter(function (e) { return WORLDS[e[0]]; }).map(function (e) { return ['premium'].concat(e, [WORLDS[e[0]]]); }))
    .concat(EXCLUSIVE.filter(function (e) { return !WORLDS[e[0]]; }).map(function (e) { return ['eksklusif'].concat(e); }));
  /* a theme whose sample invitation can really be opened: every Dasar theme, and the worlds in BUILT.
     Once the database has answered, the themes table decides (kit: the world behind it; owned: sold to a couple). */
  function kitOf(th) { var sl = slug(th), m = META && META[sl]; return m ? m.kit : (th[0] === 'dasar' || BUILT.indexOf(' ' + sl + ' ') > -1 ? sl : null); }
  function ready(th) { return !!kitOf(th); }
  function isOwned(sl) { var m = META && META[sl]; return m ? !!m.owned : OWNED.indexOf(' ' + sl + ' ') > -1; }
  /* The team adds, edits, hides and deletes themes in the team console; the home page asks for them once, early.
     Until (or unless) the answer comes, the lists in this file are shown. */
  var themeWatchers = [];
  (function loadThemes() {
    if (!CONFIG.supabaseUrl || !CONFIG.supabaseKey || !window.fetch) return;
    fetch(CONFIG.supabaseUrl + '/rest/v1/rpc/site_themes', { method: 'POST', headers: { apikey: CONFIG.supabaseKey, Authorization: 'Bearer ' + CONFIG.supabaseKey, 'Content-Type': 'application/json' }, body: '{}' })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (rows) {
        if (!Array.isArray(rows) || !rows.length) return;
        META = {}; ALL.length = 0;
        rows.forEach(function (r) {
          var f = FAMILIES[r.family], d = r.desc || ['', ''];
          META[r.slug] = r;
          ALL.push([r.tier, r.name[0], r.name[1], d[0] || (f ? f[2] : ''), d[1] || (f ? f[3] : ''), r.family || undefined, r.slug]);
        });
        themeWatchers.forEach(function (fn) { fn(); });
      }).catch(function () {});
  })();
  /* the theme counts on the tier doors follow the list (the database's, once it answers) */
  function counts() {
    $$('[data-count]').forEach(function (el) {
      var tier = el.getAttribute('data-count'), n = ALL.filter(function (th) { return th[0] === tier; }).length;
      el.setAttribute('data-id', n + ' tema'); el.setAttribute('data-en', n + ' themes'); el.textContent = t(n + ' tema', n + ' themes');
    });
  }
  counts(); themeWatchers.push(counts);
  var SAVE = window.NAWALA_SAVE;
  (function () {
    var river = $('#river');
    var riverJob = function () {
      var rows = desktop.matches ? 3 : 2, per = desktop.matches ? 14 : 8, html = '';
      for (var r = 0; r < rows; r++) {
        var cards = '';
        for (var c = 0; c < per; c++) { var i = (r * 17 + c * 7) % ALL.length; cards += '<i class="rc" style="background-image:url(' + cover(ALL[i], 's') + ')"></i>'; }
        html += '<div class="river__row">' + cards + cards + '</div>';
      }
      river.innerHTML = html;
    };
    if (river) nearJobs.push([themes, riverJob]);
    /* when the database's themes arrive: redraw what is already on screen */
    themeWatchers.push(function () {
      if (river && river.innerHTML) riverJob();
      if (pops.themes && pops.themes.open && viewing < 0) build();
    });

    var pops = { themes: $('#pop-themes'), login: $('#pop-login'), denah: $('#pop-denah') };
    var grid = $('#theme-grid'), list = $('#pop-list'), detail = $('#pop-detail'), viewing = -1, tier = 'premium', builtFor = '';
    var tabs = $$('.tabs [data-tier]'), note = $('#tier-note'), custom = $('#tier-custom'), more = $('.pop__more');
    var coverEl = $('#detail-cover'), one = $('#detail-one'), saveBtn = $('#detail-save'), msg2 = $('#detail-msg');
    function savedNote() {
      var n = SAVE ? SAVE.list().length : 0;
      if (SAVE && SAVE.inRoom()) return t(n + ' dari 30 tema tersimpan di ruang kalian di Nawala.', n + ' of 30 themes saved in your room with Nawala.');
      return t(n + ' dari 10 tema tersimpan di browser ini saja. Jika data browser dihapus atau ponsel direset, simpanan ini hilang. Masuk dengan kode akses agar tersimpan di Nawala.',
        n + ' of 10 themes saved, in this browser only. If the browser data is cleared or the phone is reset, they are gone. Enter an access code to keep them with Nawala.');
    }
    function build() {
      builtFor = tier + lang;
      tabs.forEach(function (b) { var on = b.getAttribute('data-tier') === tier; b.setAttribute('aria-selected', String(on)); b.tabIndex = on ? 0 : -1; });
      var isSaved = tier === 'tersimpan', isCustom = tier === 'kustom';
      note.textContent = isSaved ? savedNote() : t(TIERS[tier][2], TIERS[tier][3]);
      custom.hidden = !isCustom; grid.hidden = isCustom; more.hidden = isCustom;
      if (isCustom) return;
      var mine = SAVE ? SAVE.list() : [];
      var html = ALL.map(function (th, i) {
        var sl = slug(th), kept = mine.indexOf(sl) > -1;
        if (isSaved ? !kept : th[0] !== tier) return '';
        var tag = isOwned(sl) ? t('Sudah dimiliki', 'Owned') : ready(th) ? '' : t('Segera', 'Soon');
        var sub = isSaved ? t(TIERS[th[0]][0], TIERS[th[0]][1]) : FAMILIES[th[5]] ? t(FAMILIES[th[5]][0], FAMILIES[th[5]][1]) : t(TIERS[th[0]][0], TIERS[th[0]][1]);
        return '<button class="tc' + (kept ? ' is-kept' : '') + '" type="button" data-i="' + i + '"><span class="tc__art' + (th[5] ? ' cf cf--' + th[5] : '') + '"><img src="' + cover(th, 'm') + '" alt="" loading="lazy" width="400" height="500">' +
          (tag ? '<em>' + tag + '</em>' : '') + '</span><b>' + t(th[1], th[2]) + '</b><small>' + sub + '</small></button>';
      }).join('');
      grid.innerHTML = html || '<p class="grid__empty">' + t('Belum ada tema yang disimpan. Buka sebuah tema, lalu geser ke kanan untuk menyimpannya.', 'No themes saved yet. Open a theme, then swipe right to save it.') + '</p>';
      list.scrollTop = 0;
    }
    function showList(focusCard) {
      detail.hidden = true; list.hidden = false;
      if (focusCard && viewing > -1) { var c = $('[data-i="' + viewing + '"]', grid); if (c) c.focus({ preventScroll: true }); }
      viewing = -1;
    }
    /* the themes still to see after this one, for the swipe run: same tier, can be opened, not yet saved or passed */
    function queueAfter(i) {
      var th = ALL[i], out = [];
      for (var k = 1; k < ALL.length; k++) {
        var o = ALL[(i + k) % ALL.length], sl = slug(o);
        if (o[0] === th[0] && ready(o) && !(SAVE && (SAVE.isSaved(sl) || SAVE.isPassed(sl))) && !isOwned(sl)) out.push(sl);
      }
      return out;
    }
    function saveLabel() {
      var th = ALL[viewing]; if (!th) return;
      var kept = !!SAVE && SAVE.isSaved(slug(th));
      saveBtn.setAttribute('aria-pressed', String(kept));
      saveBtn.textContent = kept ? t('Tersimpan, lepas', 'Saved, let go') : t('Simpan', 'Save');
    }
    function tell(text) { msg2.hidden = !text; msg2.textContent = text || ''; }
    function showDetail(i) {
      viewing = i; var th = ALL[i], sl = slug(th), isX = th[0] === 'eksklusif', owned = isOwned(sl);
      coverEl.className = 'detail__cover' + (th[5] ? '' : ' is-tall');
      coverEl.style.backgroundImage = 'url(' + cover(th, 't') + ')';   /* toned down like the rest of the page; the invitation itself shows the full colour */
      $('#detail-fam').textContent = t(TIERS[th[0]][0], TIERS[th[0]][1]) + (FAMILIES[th[5]] ? ', ' + t(FAMILIES[th[5]][0], FAMILIES[th[5]][1]) : '');
      $('#detail-name').textContent = t(th[1], th[2]);
      var can = ready(th) && !owned, openEl = $('#detail-open');
      $('#detail-desc').textContent = t(th[3], th[4]) + ' ' + (ready(th) ? t('Buka undangannya dan jalani seperti seorang tamu: geser naik turun untuk melihat isinya, geser ke kanan untuk menyimpan, ke kiri untuk melewati.', 'Open the invitation and walk it as a guest would: swipe up and down to see inside, right to save it, left to pass.')
        : t('Undangannya segera hadir. Kalian sudah bisa menyimpannya.', 'Its invitation is coming soon. You can already save it.'));
      openEl.hidden = !can;
      openEl.href = can ? (th[0] === 'dasar' ? 'undangan/dasar.html' : 'undangan/') + '?tema=' + kitOf(th) + '&to=Bapak+dan+Ibu+Santoso&jelajah=' + th[0] + '&antre=' + queueAfter(i).join(',') : '#tema';
      one.hidden = !isX;
      one.textContent = owned ? t('Tema ini sudah dimiliki satu pasangan dan tidak dijual lagi.', 'This theme already belongs to a couple and is no longer for sale.')
        : t('Untuk satu pasangan saja. Setelah kalian pilih, tema ini menjadi milik kalian dan tidak kami pakai lagi.', 'For one couple only. Once you choose it, it is yours and we never use it again.');
      $('#detail-use').hidden = owned;
      saveBtn.hidden = owned || !SAVE; saveLabel(); tell('');
      list.hidden = true; detail.hidden = false; detail.scrollTop = 0;
      try { detail.focus({ preventScroll: true }); } catch (e) {}
    }
    saveBtn.addEventListener('click', function () {
      var th = ALL[viewing]; if (!th || !SAVE) return;
      var sl = slug(th);
      if (SAVE.isSaved(sl)) { SAVE.remove(sl); tell(''); }
      else {
        var r = SAVE.save(sl);
        if (r.full) tell(SAVE.inRoom() ? t('Sudah 30 tema tersimpan. Lepas satu dulu di ruang kalian.', '30 themes are already saved. Let one go in your room first.')
          : t('Browser ini sudah menyimpan 10 tema. Masuk dengan kode akses untuk menyimpan sampai 30, atau lepas satu di Tersimpan.', 'This browser already keeps 10 themes. Enter an access code to keep up to 30, or let one go under Saved.'));
        else if (r.first) { SAVE.told(); tell(t('Tersimpan di browser ini saja, paling banyak 10 tema. Jika data browser dihapus atau ponsel direset, simpanan ini hilang. Masuk dengan kode akses agar tersimpan di Nawala.', 'Saved in this browser only, 10 themes at most. If the browser data is cleared or the phone is reset, these saves are gone. Enter an access code to keep them with Nawala.')); }
        else tell('');
      }
      saveLabel(); builtFor = '';
    });
    /* Esc inside the seating demo's frame stays in the frame; the demo passes it up */
    addEventListener('message', function (e) { if (e.origin === location.origin && e.data === 'nawala-denah-close') closeAll(); });
    function closeAll() { Object.keys(pops).forEach(function (k) { if (pops[k] && pops[k].open) pops[k].close(); }); }
    function open(name, wantTier) {
      var d = pops[name]; if (!d || !d.showModal) { location.hash = name === 'themes' ? 'tema' : 'kontak'; return; }
      closeAll();
      if (name === 'themes') { if (wantTier) tier = wantTier; build(); showList(false); }
      if (name === 'login') { var m = $('#login-msg'); m.hidden = true; }
      /* the seating planner demo loads only when asked for, in the page's language */
      if (name === 'denah') { var f = $('.denah__frame', d), src = 'undangan/denah-demo.html' + (lang === 'en' ? '?lang=en' : ''); if (f.getAttribute('src') !== src) f.setAttribute('src', src); }
      d.showModal();
      /* the keyboard waits until the box has finished growing; on touch screens the visitor taps the field */
      if (name === 'login' && matchMedia('(pointer: fine)').matches) setTimeout(function () { try { $('#login-code').focus({ preventScroll: true }); } catch (e) {} }, 540);
    }
    tabs.forEach(function (b, k) {
      b.addEventListener('click', function () { tier = b.getAttribute('data-tier'); build(); showList(false); });
      b.addEventListener('keydown', function (e) {
        if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
        var n = tabs[(k + (e.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length]; n.focus(); n.click();
      });
    });
    function goTo(id) {
      closeAll();
      var el = doc.getElementById(id); if (!el) return;
      el.scrollIntoView({ behavior: calm ? 'auto' : 'smooth', block: 'start' });
      if (id === 'kontak') setTimeout(function () { var f = $('#q-name'); if (f && !f.closest('[hidden]')) try { f.focus({ preventScroll: true }); } catch (e) {} }, 900);
    }
    doc.addEventListener('click', function (e) {
      var o = e.target.closest('[data-open]'); if (o) { e.preventDefault(); return open(o.getAttribute('data-open'), o.getAttribute('data-tier')); }
      var g = e.target.closest('[data-goto]'); if (g) return goTo(g.getAttribute('data-goto'));
      if (e.target.closest('[data-close]')) return closeAll();
      if (e.target.classList && e.target.classList.contains('pop')) return closeAll();   // a tap on the dark area around the box
      var card = e.target.closest('.tc'); if (card) return showDetail(Number(card.getAttribute('data-i')));
    });
    $('#detail-back').addEventListener('click', function () { if (!builtFor) build(); showList(true); });
    $('#detail-use').addEventListener('click', function () {
      chosen = ALL[viewing]; showChosen(); goTo('kontak');
    });
    afterLang.push(function () { if (builtFor && builtFor !== tier + lang) { var v = viewing; build(); if (v > -1) showDetail(v); } });
    /* coming back from an invitation (?tema=<tab>) or sent here to log in (?masuk=1): open the right box, then tidy the address */
    var wantTab = query.get('tema'), wantLogin = query.get('masuk') === '1', wantPick = query.get('pilih');
    /* the theme list has its own page now (tema/); old links to a tab here go there */
    if (wantTab) { location.replace('tema/?tier=' + (/^(dasar|premium|eksklusif|kustom|tersimpan)$/.test(wantTab) ? wantTab : 'semua')); return; }
    /* "Gunakan tema ini" on the themes page: carry the choice into the contact box */
    if (wantPick) {
      var pickIt = function () {
        var th = ALL.filter(function (x) { return slug(x) === wantPick; })[0];
        if (th) { chosen = th; showChosen(); }
        setTimeout(function () { goTo('kontak'); }, 300);
      };
      setTimeout(pickIt, 0); themeWatchers.push(function () { if (!chosen) pickIt(); });
      try { history.replaceState(null, '', location.pathname + '#kontak'); } catch (e) {}
    }
    if (wantTab || wantLogin) {
      var start = function () { if (wantLogin) open('login'); else open('themes', /^(dasar|premium|eksklusif|kustom|tersimpan)$/.test(wantTab) ? wantTab : 'premium'); };
      if (SAVE && !wantLogin) SAVE.ready().then(start); else start();
      try { history.replaceState(null, '', location.pathname + '#tema'); } catch (e) {}
    }
    if (SAVE) SAVE.onChange(function () { if (pops.themes.open && !detail.hidden) saveLabel(); builtFor = ''; });

    /* log in with an access code. Codes live in the Nawala database (access_codes); this page may only ask yes or no.
       A good code also opens the couple's room (ruang/), which reads the same key from this browser. */
    var form = $('#login-form'), code = $('#login-code'), msg = $('#login-msg');
    function say(html) { msg.innerHTML = html; msg.hidden = false; }
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var c = code.value.trim().toUpperCase().replace(/[^A-Z0-9-]/g, '');
      if (c.length < 4) return say(t('Tulis kode akses Anda dulu.', 'Please type your access code first.'));
      var wa = 'https://wa.me/' + CONFIG.whatsapp + '?text=' + encodeURIComponent(t('Halo Nawala, kode akses saya: ' + c, 'Hello Nawala, my access code is: ' + c));
      var later = t('Kode belum bisa diperiksa di halaman ini. Kirim kode Anda lewat WhatsApp, dan kami bukakan temanya untuk Anda. ', 'Codes cannot be checked on this page yet. Send us your code on WhatsApp and we will open the themes for you. ') +
        '<a href="' + wa + '" target="_blank" rel="noopener">' + t('Buka WhatsApp', 'Open WhatsApp') + '</a>';
      if (!CONFIG.supabaseUrl || !CONFIG.supabaseKey) return say(later);
      fetch(CONFIG.supabaseUrl + '/rest/v1/rpc/check_access_code', {
        method: 'POST',
        headers: { apikey: CONFIG.supabaseKey, Authorization: 'Bearer ' + CONFIG.supabaseKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: c })
      }).then(function (r) { if (!r.ok) throw new Error(String(r.status)); return r.json(); })
        .then(function (ok) {
          if (ok !== true) return say(t('Kode itu tidak kami kenali. Periksa lagi, atau hubungi kami lewat WhatsApp.', 'We do not recognise that code. Check it again, or reach us on WhatsApp.'));
          try { sessionStorage.setItem('nawala-code', c); } catch (err) {}
          if (SAVE) SAVE.reopen();   /* what this browser had saved moves into the room */
          say(t('Kode diterima. Ruang kalian siap, dan tema yang tersimpan di browser ini sudah kami pindahkan ke sana. ', 'Code accepted. Your room is ready, and the themes saved in this browser have moved into it. ') +
            '<a href="ruang/">' + t('Buka ruang kalian', 'Open your room') + '</a>');
        })
        .catch(function () { say(later); });
    });
  })();

  /* ---------- Contact: three questions, one at a time ---------- */
  (function () {
    var box = ask; if (!box) return;
    var form = $('.ask__form', box), steps = $$('.ask__step', box), err = $('.ask__error', box);
    var back = $('.ask__back', box), next = $('.ask__next', box), count = $('#ask-n');
    var sendView = $('.ask__send', box), doneView = $('.ask__done', box), doneP = $('#ask-done-p'), waLink = $('#ask-wa');
    var nameI = $('#q-name'), monthS = $('#q-month'), yearS = $('#q-year'), tbd = $('#q-tbd'), waI = $('#q-wa'), row = $('.ask__row', box);
    var chip = $('.ask__theme', box);
    var MONTHS = {
      id: ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'],
      en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
    };
    var i = 0, y0 = new Date().getFullYear();
    for (var y = y0; y <= y0 + 4; y++) yearS.add(new Option(String(y), String(y)));
    yearS.add(new Option('', ''), 0); yearS.value = '';

    showChosen = function () {
      chip.hidden = !chosen;
      if (chosen) $('b', chip).textContent = t(chosen[1], chosen[2]);
      replan();
    };
    $('.ask__theme-x', box).addEventListener('click', function () { chosen = null; showChosen(); });

    function refresh() {
      var keepM = monthS.value;
      monthS.length = 0;
      monthS.add(new Option(t('Bulan', 'Month'), ''));
      MONTHS[lang].forEach(function (m, k) { monthS.add(new Option(m, String(k + 1))); });
      monthS.value = keepM;
      yearS.options[0].text = t('Tahun', 'Year');
      monthS.setAttribute('aria-label', t('Bulan', 'Month')); yearS.setAttribute('aria-label', t('Tahun', 'Year'));
      next.textContent = i === steps.length - 1 ? t('Kirim', 'Send') : t('Lanjut', 'Continue');
      err.hidden = true;
      if (chosen) $('b', chip).textContent = t(chosen[1], chosen[2]);
    }
    afterLang.unshift(refresh);

    function show(k, goingBack) {
      i = k;
      steps.forEach(function (s, n) { s.hidden = n !== k; s.classList.toggle('is-on', n === k); s.classList.toggle('is-back', n === k && !!goingBack); });
      count.textContent = String(k + 1);
      back.hidden = k === 0;
      refresh();
      var f = $('input:not([type=checkbox]), select', steps[k]);
      if (f) try { f.focus({ preventScroll: true }); } catch (e) {}
    }
    function fail(id, en) { err.textContent = t(id, en); err.hidden = false; return false; }
    function phone() {
      var d = waI.value.replace(/\D/g, '');
      if (d.indexOf('0') === 0) d = '62' + d.slice(1); else if (d.indexOf('8') === 0) d = '62' + d;
      return d;
    }
    function valid() {
      err.hidden = true;
      if (i === 0) return nameI.value.trim().length >= 2 || fail('Tulis nama Anda dulu.', 'Please write your name first.');
      if (i === 1) return tbd.checked || (monthS.value && yearS.value) ? true : fail('Pilih bulan dan tahun, atau centang "Belum ditentukan".', 'Choose a month and year, or tick "Not decided yet".');
      var d = phone();
      return (d.length >= 10 && d.length <= 15) || fail('Nomor WhatsApp belum lengkap.', 'That WhatsApp number looks incomplete.');
    }
    tbd.addEventListener('change', function () { row.classList.toggle('is-off', tbd.checked); err.hidden = true; });
    back.addEventListener('click', function () { if (i > 0) show(i - 1, true); });

    function answers() {
      return {
        name: nameI.value.trim().slice(0, 80),
        wedding_month: tbd.checked ? null : Number(monthS.value),
        wedding_year: tbd.checked ? null : Number(yearS.value),
        whatsapp: phone(),
        lang: lang,
        source: chosen ? 'home, tema: ' + chosen[1] : 'home',
        theme: chosen ? slug(chosen) : null   /* the slug, for the team console's counts */
      };
    }
    function finish(viaWhatsApp) {
      form.hidden = true; sendView.hidden = true; doneView.hidden = false; chip.hidden = true;
      if (viaWhatsApp) {
        doneP.setAttribute('data-id', 'Pesan Anda terbuka di WhatsApp. Setelah Anda mengirimnya, kami membalas di sana.');
        doneP.setAttribute('data-en', 'Your message is open in WhatsApp. Once you send it, we will reply there.');
        doneP.textContent = doneP.getAttribute('data-' + lang);
      }
      box.classList.add('is-done');
      try { doneView.focus({ preventScroll: true }); } catch (e) {}
      replan();
    }
    function handOver(a) {
      var when = a.wedding_month ? MONTHS[lang][a.wedding_month - 1] + ' ' + a.wedding_year : t('belum ditentukan', 'not decided yet');
      var theme = chosen ? t(' Tema pilihan: ' + chosen[1] + '.', ' Chosen theme: ' + chosen[2] + '.') : '';
      var msg = t(
        'Halo Nawala, saya ' + a.name + '. Rencana pernikahan: ' + when + '. Nomor WhatsApp saya: +' + a.whatsapp + '.',
        'Hello Nawala, I am ' + a.name + '. Wedding date: ' + when + '. My WhatsApp number: +' + a.whatsapp + '.') + theme;
      waLink.href = 'https://wa.me/' + CONFIG.whatsapp + '?text=' + encodeURIComponent(msg);
      form.hidden = true; sendView.hidden = false;
      try { waLink.focus({ preventScroll: true }); } catch (e) {}
      replan();
    }
    waLink.addEventListener('click', function () { setTimeout(function () { finish(true); }, 600); });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!valid()) return;
      if (i < steps.length - 1) return show(i + 1);
      var a = answers();
      if (!CONFIG.supabaseUrl || !CONFIG.supabaseKey) return handOver(a);
      next.disabled = true; next.textContent = t('Mengirim', 'Sending');
      fetch(CONFIG.supabaseUrl + '/rest/v1/leads', {
        method: 'POST',
        headers: { apikey: CONFIG.supabaseKey, Authorization: 'Bearer ' + CONFIG.supabaseKey, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
        body: JSON.stringify(a)
      }).then(function (r) { if (!r.ok) throw new Error(String(r.status)); finish(false); })
        .catch(function () { next.disabled = false; handOver(a); });
    });
  })();

  applyLang();
})();
