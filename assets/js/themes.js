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
    elemen: ['Elemen', 'Elements', 'Air, api, bumi, emas, mutiara.', 'Water, fire, earth, gold, pearl.'],
    bunga: ['Bunga dan warna', 'Flowers and colour', 'Lukisan bunga dan palet warna, dengan bunga di sudut kartu.', 'Painted flowers and colour palettes, with flowers on the card corners.'],
    tempat: ['Tempat di Indonesia', 'Places in Indonesia', 'Danau, gunung, pantai, dan kota di Indonesia, dilukis.', 'Lakes, mountains, beaches and towns of Indonesia, painted.'],
    budaya: ['Iman dan budaya', 'Faith and culture', 'Lengkung, batik, songket, dan rumah adat, dilukis.', 'Arches, batik, songket and traditional houses, painted.'],
    waktu: ['Musim dan waktu', 'Seasons and times of day', 'Fajar, senja, malam, hujan, dan musim, dilukis.', 'Dawn, dusk, night, rain and seasons, painted.'],
    hidup: ['Lukisan hidup', 'Living pictures', 'Potongan gambar yang terus bergerak: kelopak jatuh, daun bergoyang, dan lapisan yang bergeser saat digulir.', 'Cut-out pictures that keep moving: petals fall, leaves sway and layers slide as you scroll.']
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
    dasar: ['Dasar', 'Basic', 'Undangan gulir yang akrab: satu gambar, kartu yang mudah dibaca, dan bingkai foto. 12 foto, 72 lukisan, dan 30 lukisan hidup yang bergerak.', 'The familiar scroll invitation: one picture, readable cards and photo frames. 12 photographs, 72 paintings and 30 living pictures that move.'],
    premium: ['Premium', 'Premium', 'Kamera membawa tamu masuk ke dalam adegan pembuka. Tujuh keluarga, 32 tema.', 'The camera carries your guest into the opening scene. Seven families, 32 themes.'],
    eksklusif: ['Eksklusif', 'Exclusive', 'Enam dunia. Masing-masing hanya untuk satu pasangan: setelah dipilih, tema itu tidak kami pakai lagi.', 'Six worlds. Each belongs to one couple only: once chosen, we never use it again.'],
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
    /* the living themes (27 Nov 2026), written by tools/hidup.py */
    /* gen:hidup */
,["Lili Merona", "Blushing Lilies", "Lili merah muda yang bergoyang, daun eukaliptus di atas, dan kelopak yang jatuh perlahan.", "Swaying pink lilies, eucalyptus above and petals falling slowly.", "hidup", "lili-merona"],
    ["Lili Gading", "Ivory Lilies", "Lili putih gading di antara sulur hijau, dengan kilau emas yang melayang.", "Ivory lilies among green vines, with drifting specks of gold.", "hidup", "lili-gading"],
    ["Sakura Berguguran", "Falling Cherry Blossom", "Ranting sakura di sudut atas, pohon merah muda di kejauhan, dan kelopak yang terus berguguran.", "Cherry branches overhead, a pink tree far off and petals that never stop falling.", "hidup", "sakura-gugur"],
    ["Fuji Musim Semi", "Fuji in Spring", "Gunung Fuji di balik ranting sakura; gunung dan bunga bergeser saat digulir.", "Mount Fuji behind cherry branches; mountain and blossom slide apart as you scroll.", "hidup", "fuji-semi"],
    ["Ladang Poppy", "Poppy Field", "Poppy merah dan cornflower di padang rumput, dengan benih yang terbang ke langit.", "Red poppies and cornflowers in the grass, with seeds floating up to the sky.", "hidup", "ladang-poppy"],
    ["Padang Aster", "Daisy Meadow", "Padang aster putih dan bunga biru, sulur muda di atas, dan aster kecil yang berjatuhan.", "A meadow of white daisies and blue flowers, young vines above and little daisies falling.", "hidup", "padang-aster"],
    ["Kebun Rahasia", "Secret Garden", "Tirai sulur hijau, lengkung daun, hortensia putih, dan kunang-kunang yang naik perlahan.", "A curtain of green vines, an arch of leaves, white hydrangea and fireflies drifting up.", "hidup", "kebun-rahasia"],
    ["Wisteria Ungu", "Purple Wisteria", "Wisteria ungu menjuntai dari atas dan kelopak ungu yang melayang turun.", "Purple wisteria hanging from above and violet petals drifting down.", "hidup", "wisteria-ungu"],
    ["Gapura Mawar", "Rose Arch", "Gapura kayu berhias mawar tempat Nawala terbang, dengan rangkaian mawar di setiap sudut.", "A wooden arch dressed in roses where Nawala flies, with sprays of roses at every corner.", "hidup", "gapura-mawar"],
    ["Rimba Tropis", "Tropical Jungle", "Monstera dan palem berlapis yang bergeser saat digulir, kembang sepatu, dan daun yang jatuh.", "Layered monstera and palm that slide as you scroll, hibiscus and falling leaves.", "hidup", "rimba-tropis"],
    ["Kembang Sepatu", "Hibiscus", "Kembang sepatu jingga dan merah muda, pakis di atas, dan kelopak hangat yang jatuh.", "Coral and pink hibiscus, ferns above and warm petals falling.", "hidup", "kembang-sepatu"],
    ["Emas Malam", "Gold at Night", "Matahari emas yang berputar pelan di langit malam, tirai emas, dan serpihan emas yang jatuh.", "A gold sun turning slowly in a night sky, a gold curtain and falling flecks of gold.", "hidup", "emas-malam"],
    ["Kolibri Emas", "Golden Hummingbirds", "Kolibri emas yang terbang melintas, mawar emas, dan sudut berukir di atas kertas gading.", "Gold hummingbirds flying across, a gold rose and carved corners on ivory paper.", "hidup", "kolibri-emas"],
    ["Merak Zamrud", "Emerald Peacock", "Bulu merak di atas hijau zamrud, bros mutiara, dan kupu-kupu emas yang melintas.", "A peacock feather on emerald green, a pearl brooch and a gold butterfly passing by.", "hidup", "merak-zamrud"],
    ["Herbarium", "Herbarium", "Bunga kering yang ditempel selotip di atas kertas tua, dengan tangkai yang bergoyang pelan.", "Dried flowers taped to old paper, their stems swaying gently.", "hidup", "herbarium"],
    ["Bunga Tekan", "Pressed Flowers", "Bunga tekan aneka warna yang berputar pelan di sekeliling undangan.", "Pressed flowers of every colour turning slowly around the invitation.", "hidup", "bunga-tekan"],
    ["Puncak Pagi", "Morning Peaks", "Tiga lapis gunung dan hutan pinus yang bergeser saat digulir, dengan matahari yang naik.", "Three layers of mountain and pine forest that slide as you scroll, under a rising sun.", "hidup", "puncak-pagi"],
    ["Desa Alpen", "Alpine Village", "Desa kayu di kaki puncak bersalju, dengan salju yang turun perlahan.", "A wooden village under snowy peaks, with snow coming down softly.", "hidup", "desa-alpen"],
    ["Jelajah Berdua", "Adventure for Two", "Kompas, gunung, dan mobil kemping kecil yang melaju melintasi layar.", "A compass, mountains and a little camper van driving across the screen.", "hidup", "jelajah-berdua"],
    ["Pastel Musim Semi", "Spring Pastels", "Buket cat air pastel, bunga kecil bertebaran, dan kelopak lembut yang jatuh.", "A pastel watercolour bouquet, tiny scattered flowers and soft petals falling.", "hidup", "pastel-semi"],
    ["Peoni Merona", "Blushing Peonies", "Peony merah muda yang mekar saat digulir, eukaliptus di atas, dan kelopak yang jatuh.", "Blush peonies that open as you scroll, eucalyptus above and falling petals.", "hidup", "peoni-merona"],
    ["Hortensia Salju", "Snow Hydrangea", "Hortensia dan peony putih di antara daun hijau, dengan buket putih yang menjuntai.", "White hydrangea and peony among green leaves, with a trailing white bouquet.", "hidup", "hortensia-salju"],
    ["Jingga Senja", "Orange Dusk", "Lili jingga dan anggrek di bawah matahari senja yang besar, dengan kelopak kuning yang jatuh.", "Orange lilies and orchids under a large evening sun, with yellow petals falling.", "hidup", "jingga-senja"],
    ["Krokus Ungu", "Violet Crocus", "Krokus dan pansy ungu, sulur hijau di atas, dan kelopak ungu yang melayang.", "Violet crocus and pansies, green vines above and drifting purple petals.", "hidup", "krokus-ungu"],
    ["Boho Pampas", "Boho Pampas", "Pampas dan bunga kering dalam warna tanah, dengan tirai keemasan di atas.", "Pampas and dried flowers in earth tones, under a golden curtain.", "hidup", "boho-pampas"],
    ["Ladang Matahari", "Sunflower Field", "Bunga matahari di bawah matahari cat air yang berputar, dengan kelopak kuning yang terbang.", "Sunflowers under a turning watercolour sun, with yellow petals on the wind.", "hidup", "ladang-matahari"],
    ["Lili Marun", "Maroon Lily", "Lili merah gelap dan mawar tekan di atas marun pekat, dengan tirai dan serpihan emas.", "Dark red lilies and pressed roses on deep maroon, with a curtain and flecks of gold.", "hidup", "lili-marun"],
    ["Gerbera Ceria", "Cheerful Gerbera", "Gerbera besar yang berputar pelan di sudut layar, dahlia, kosmos, dan kelopak merah muda.", "Large gerberas turning slowly at the edges, dahlia, cosmos and pink petals.", "hidup", "gerbera-ceria"],
    ["Pesta Topeng", "Masquerade", "Topeng emas, permata, dan kolibri hitam emas di malam ungu tua bertabur emas.", "A gold mask, a jewel and a black and gold hummingbird in a deep violet night of gold dust.", "hidup", "pesta-topeng"],
    ["Sakura Malam", "Cherry Blossom Night", "Sakura di langit malam biru tua, lampion yang bergoyang, dan kelopak yang berguguran.", "Cherry blossom against a deep blue night, a swaying lantern and falling petals.", "hidup", "sakura-malam"]
/* /gen:hidup */
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
  var WORLDS = { 'Istana Awan': 'royal', 'Teater Tua': 'era', 'Kapal Bulan': 'alam', 'Seribu Lentera': 'nusa' };
  var ALL = BASIC.map(function (b) { return ['dasar'].concat(b); })
    .concat(THEMES.map(function (th) { var f = FAMILIES[th[0]]; return ['premium', th[1], th[2], f[2], f[3], th[0]]; }))
    /* the built immersive worlds are Premium (owner, 22 Nov 2026); Exclusive keeps the covers still to be built */
    .concat(EXCLUSIVE.filter(function (e) { return WORLDS[e[0]]; }).map(function (e) { return ['premium'].concat(e, [WORLDS[e[0]]]); }))
    .concat(EXCLUSIVE.filter(function (e) { return !WORLDS[e[0]]; }).map(function (e) { return ['eksklusif'].concat(e); }));
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
