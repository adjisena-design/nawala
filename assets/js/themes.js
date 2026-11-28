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
    dasar: ['Dasar', 'Basic', 'Undangan gulir yang akrab: satu gambar, kartu yang mudah dibaca, dan bingkai foto. 12 foto, 72 lukisan, dan 123 lukisan hidup yang bergerak.', 'The familiar scroll invitation: one picture, readable cards and photo frames. 12 photographs, 72 paintings and 123 living pictures that move.'],
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
    ["Sakura Malam", "Cherry Blossom Night", "Sakura di langit malam biru tua, lampion yang bergoyang, dan kelopak yang berguguran.", "Cherry blossom against a deep blue night, a swaying lantern and falling petals.", "hidup", "sakura-malam"],
    ["Lili Stargazer", "Stargazer Lilies", "Lili stargazer berbintik dalam merah muda tua, dengan kelopak yang jatuh perlahan.", "Speckled stargazer lilies in deep pink, with petals falling slowly.", "hidup", "lili-stargazer"],
    ["Lili Cat Air", "Watercolour Lilies", "Lili merah muda bersapuan cat air di atas padang bunga pastel.", "Pink lilies in soft watercolour over a pastel flower meadow.", "hidup", "lili-cat-air"],
    ["Bingkai Emas", "Gold Frame", "Bingkai emas tipis yang tetap di tempat saat digulir, lili putih, dan kilau emas yang melayang.", "A fine gold frame that stays in place as you scroll, a white lily and drifting gold light.", "hidup", "bingkai-emas"],
    ["Segel Pita", "Ribbon Seal", "Segel lilin merah muda berpita di sampul, mawar kecil di sudut kartu, dan peony yang mekar.", "A pink wax seal with a bow on the cover, small roses on the card corners and peonies in bloom.", "hidup", "segel-pita"],
    ["Sahabat Rimba", "Forest Friends", "Rusa, beruang, serigala, dan berang-berang di hutan pinus; untuk undangan yang ceria.", "A moose, a bear, a wolf and a beaver in a pine forest; for a playful invitation.", "hidup", "sahabat-rimba"],
    ["Amarilis", "Amaryllis", "Amarilis merah bergaris putih dan alstroemeria, di atas padang bunga kecil.", "Red and white striped amaryllis and alstroemeria over a meadow of small flowers.", "hidup", "amarilis"],
    ["Kala Lili", "Calla Lily", "Kala lili putih yang ramping, daun hijau di atas, dan bunga putih yang tenang.", "Slender white calla lilies, green leaves above and calm white flowers.", "hidup", "kala-lili"],
    ["Kupu-Kupu Bunga Apel", "Butterfly on Apple Blossom", "Kupu-kupu jingga di atas karangan bunga apel, dengan kelopak merah muda yang jatuh.", "An orange butterfly on a wreath of apple blossom, with pink petals falling.", "hidup", "kupu-apel"],
    ["Semak Biru", "Blue Blossom", "Semak bunga biru, hortensia dan pansy biru, di bawah tirai daun.", "A bush of blue blossom, blue hydrangea and pansies under a curtain of leaves.", "hidup", "semak-biru"],
    ["Taman Sakura", "Cherry Garden", "Pohon merah muda seperti kapas, awan kelopak, dan gunung di kejauhan dalam lingkaran cat air.", "A pink cotton-candy tree, a cloud of petals and a far mountain in a watercolour circle.", "hidup", "taman-sakura"],
    ["Macan Emas", "Golden Leopard", "Macan tutul emas di atas hitam pekat, tirai emas, dan serpihan emas yang jatuh.", "A gold leopard on deep black, a gold curtain and falling flecks of gold.", "hidup", "macan-emas"],
    ["Lili Emas", "Lilies and Gold", "Lili putih dengan ukiran emas di atas dan bawah, di atas kertas gading.", "White lilies with carved gold above and below, on ivory paper.", "hidup", "lili-emas"],
    ["Tropis Emas", "Tropical Gold", "Monstera dan palem di malam hijau tua, dengan kolibri emas yang terbang melintas.", "Monstera and palm in a deep green night, with gold hummingbirds flying across.", "hidup", "tropis-emas"],
    ["Gapura Wisteria", "Wisteria Arch", "Gapura mawar di bawah wisteria ungu yang menjuntai, dengan kelopak ungu yang melayang.", "The rose arch under hanging purple wisteria, with violet petals drifting.", "hidup", "wisteria-gapura"],
    ["Herbarium Malam", "Herbarium by Night", "Bunga kering di atas biru arang, dengan titik cahaya hangat yang melayang.", "Dried flowers on charcoal blue, with warm specks of light drifting.", "hidup", "herbarium-malam"],
    ["Padang Malam", "Meadow at Night", "Padang bunga liar di bawah langit malam biru, dengan kunang-kunang yang naik perlahan.", "A wildflower meadow under a blue night sky, with fireflies rising slowly.", "hidup", "padang-malam"],
    ["Kebun Malam", "Garden at Night", "Tirai sulur dan hortensia putih di malam hijau tua, diterangi kunang-kunang.", "A curtain of vines and white hydrangea in a deep green night, lit by fireflies.", "hidup", "kebun-malam"],
    ["Lili Lembayung", "Violet Lilies", "Lili Merona dalam warna lembayung: lili ungu, daun eukaliptus, dan kelopak ungu yang jatuh.", "Blushing Lilies in violet: purple lilies, eucalyptus and violet petals falling.", "hidup", "lili-lembayung"],
    ["Lili Biru", "Blue Lilies", "Lili Merona dalam biru lembut: lili biru, daun eukaliptus, dan kelopak biru yang jatuh.", "Blushing Lilies in soft blue: blue lilies, eucalyptus and blue petals falling.", "hidup", "lili-biru"],
    ["Lili Kuning", "Yellow Lilies", "Lili Merona dalam kuning hangat: lili kuning, daun eukaliptus, dan kelopak kuning yang jatuh.", "Blushing Lilies in warm yellow: yellow lilies, eucalyptus and yellow petals falling.", "hidup", "lili-kuning"],
    ["Peoni Putih", "White Peonies", "Peoni Merona dalam putih: peony putih, eukaliptus di atas, dan kelopak putih yang jatuh.", "Blushing Peonies in white: white peonies, eucalyptus above and white petals falling.", "hidup", "peoni-putih"],
    ["Kawan Gunung", "Mountain Friends", "Domba gunung, kambing, beruang hitam, dan keledai pembawa bekal di lereng berbatu; untuk undangan yang ceria.", "A ram, a goat, a black bear and a pack donkey on a rocky slope; for a playful invitation.", "hidup", "kawan-gunung"],
    ["Rimba Raya", "Deep Jungle", "Gorila, ular hijau, dan kalkun di antara daun besar dan sulur; untuk undangan yang ceria.", "A gorilla, a green snake and a turkey among big leaves and lianas; for a playful invitation.", "hidup", "rimba-raya"],
    ["Daun Hijau", "Greenery", "Hanya hijau: daun besar, ivy di sudut kartu, sulur kecil, dan bukit lumut di bawah.", "Green only: large leaves, ivy on the card corners, small vines and a mossy hill below.", "hidup", "daun-hijau"],
    ["Bingkai Persik", "Peach Frame", "Bingkai emas tipis yang tetap di tempat, bunga persik dan ranunculus, dan kelopak yang jatuh.", "A fine gold frame that stays in place, peach blossom and ranunculus, and falling petals.", "hidup", "bingkai-persik"],
    ["Bingkai Malam", "Night Frame", "Bingkai emas tipis di atas biru malam, mawar emas, dan kilau emas yang melayang.", "A fine gold frame on night blue, a gold rose and drifting gold light.", "hidup", "bingkai-malam"],
    ["Kartu Pos Fuji", "Postcard from Fuji", "Lukisan Gunung Fuji seperti kartu pos, dengan ranting sakura yang keluar dari bingkainya.", "A painting of Mount Fuji like a postcard, with a cherry branch reaching out of its frame.", "hidup", "kartu-pos-fuji"],
    ["Aster Ceria", "Sunny Daisy", "Aster kuning bergaya kartun, pohon bulat, kolam kecil, dan mobil kemping yang melintas; untuk undangan yang ceria.", "A cartoon yellow daisy, a round tree, a small pond and a camper van passing by; for a playful invitation.", "hidup", "aster-ceria"],
    ["Langit Musim Panas", "Summer Sky", "Langit biru yang dilukis, awan yang bergeser pelan, matahari yang berputar, dan pesawat kertas yang melintas.", "A painted blue sky, clouds that drift slowly, a turning sun and a paper plane passing by.", "hidup", "langit-musim-panas"],
    ["Senja Berawan", "Clouded Sunset", "Langit senja merah muda dan jingga, gumpalan awan keemasan, dan matahari yang turun di kaki halaman.", "A pink and orange dusk, banks of golden cloud and the sun going down at the foot of the page.", "hidup", "senja-berawan"],
    ["Awan Merah Muda", "Pink Clouds", "Awan merah muda yang lembut, mawar persik, dan kelopak yang turun perlahan.", "Soft pink clouds, a peach rose and petals coming down slowly.", "hidup", "awan-merah-muda"],
    ["Malam Purnama", "Full Moon Night", "Bulan purnama keemasan di atas awan malam, dengan bintang yang berkelip.", "A golden full moon over night clouds, with stars that twinkle.", "hidup", "malam-purnama"],
    ["Bulan Sabit", "Crescent Moon", "Bulan sabit besar di langit ungu tua, taburan bintang emas, dan awan biru di bawahnya.", "A large crescent in a deep violet sky, a scatter of gold stars and blue cloud beneath.", "hidup", "bulan-sabit"],
    ["Pelangi Cat Air", "Watercolour Rainbow", "Pelangi cat air di atas awan, bunga warna-warni, dan kupu-kupu pelangi yang melintas; untuk undangan yang ceria.", "A watercolour rainbow over clouds, colourful flowers and a rainbow butterfly passing by; for a playful invitation.", "hidup", "pelangi-cat-air"],
    ["Lampion Terbang", "Sky Lanterns", "Ratusan lampion kertas naik ke langit senja, dari jingga di kaki halaman sampai biru malam di atas.", "Paper lanterns rising into the dusk, from orange at the foot of the page to night blue above.", "hidup", "lampion-terbang"],
    ["Lentera Malam", "Night Lanterns", "Lentera emas berukir yang tergantung dan bergoyang, pola bintang emas, dan cahaya yang melayang.", "Carved gold lanterns hanging and swaying, a gold star pattern and drifting light.", "hidup", "lentera-malam"],
    ["Pesta Kebun", "Garden Party", "Lampu hias yang menyala di atas, langit senja, bukit hijau, dan kue pengantin di tengah taman.", "Strings of lights overhead, a dusk sky, green hills and the wedding cake in the middle of the garden.", "hidup", "pesta-kebun"],
    ["Melati Putih", "White Jasmine", "Rangkaian melati di sudut kartu, daun hijau segar, dan kuntum putih yang melayang.", "Jasmine on the corner of every card, fresh green leaves and white buds drifting.", "hidup", "melati-putih"],
    ["Janur Kuning", "Janur Kuning", "Penjor dan janur melengkung di kedua sisi, melati di sudut kartu, dan daun yang jatuh.", "Penjor and janur arching on both sides, jasmine on the card corners and falling leaves.", "hidup", "janur-kuning"],
    ["Joglo Jawa", "Javanese Joglo", "Rumah joglo di kejauhan, sawah di kaki halaman, gunungan emas, dan sepasang pengantin Jawa tanpa wajah.", "A joglo house far off, rice terraces at the foot of the page, a gold gunungan and a faceless Javanese couple.", "hidup", "joglo-jawa"],
    ["Pengantin Jawa", "Javanese Bride and Groom", "Sepasang pengantin Jawa berbusana hitam dan emas, tanpa wajah, dengan ronce melati dan pola emas di belakangnya.", "A Javanese couple in black and gold, faceless, with jasmine garlands and a gold pattern behind them.", "hidup", "pengantin-jawa"],
    ["Pengantin Putih", "Bride and Groom in White", "Sepasang pengantin berkebaya dan beskap putih, tanpa wajah, di antara melati dan awan lembut.", "A couple in white kebaya and beskap, faceless, among jasmine and soft clouds.", "hidup", "pengantin-putih"],
    ["Pengantin Andalas", "Sumatran Bride and Groom", "Pengantin bersongket marun dengan hiasan kepala emas, rumah gadang di kejauhan, dan motif songket merah emas.", "A couple in maroon songket with a gold headdress, a rumah gadang far off and a red and gold songket motif.", "hidup", "pengantin-andalas"],
    ["Akad Melati", "Jasmine Akad", "Pengantin berbusana putih dengan hijab dan mahkota, lentera emas yang tergantung, dan pola bintang yang halus.", "A couple in white, the bride in hijab and crown, hanging gold lanterns and a fine star pattern.", "hidup", "akad-melati"],
    ["Pasangan Ceria", "Cheerful Couple", "Sepasang pengantin Jawa bergaya kartun yang tersenyum, bintang krayon, dan konfeti emas; untuk undangan yang ceria.", "A smiling cartoon Javanese couple, crayon stars and gold confetti; for a playful invitation.", "hidup", "pasangan-ceria"],
    ["Nusantara Berpasangan", "Couples of the Archipelago", "Di tiap jeda ada sepasang pengantin dari daerah yang berbeda, dengan rumah adat di kejauhan.", "Every pause shows a bride and groom from a different region, with a traditional house far off.", "hidup", "nusantara-berpasangan"],
    ["Pengantin Klasik", "Classic Bride and Groom", "Pengantin Jawa dengan buket bunga dan gaun berekor, dalam warna cokelat, merah, atau hijau di tiap jeda.", "A Javanese couple with a bouquet and a trailing gown, in brown, red or green at each pause.", "hidup", "pengantin-klasik"],
    ["Sawah Pagi", "Morning in the Rice Fields", "Sawah berundak di kaki halaman, gunung di kejauhan, petani yang bekerja, dan burung yang melintas.", "Rice terraces at the foot of the page, a mountain far off, farmers at work and a bird crossing.", "hidup", "sawah-pagi"],
    ["Rumpun Bambu", "Bamboo Grove", "Rumpun bambu di kedua sisi, panda yang mengintip, rebung, dan daun yang jatuh pelan.", "Bamboo on both sides, a panda peeking out, a bamboo shoot and leaves falling slowly.", "hidup", "rumpun-bambu"],
    ["Puspa Nusantara", "Flowers of the Archipelago", "Rafflesia, bunga bangkai dengan anggrek, cendrawasih, dan rangkong yang terbang melintas di antara daun tropis.", "Rafflesia, a titan arum with orchids, a bird of paradise and a hornbill flying across among tropical leaves.", "hidup", "puspa-nusantara"],
    ["Rimba Borneo", "Borneo Rainforest", "Rumah panjang di kejauhan, orangutan di dahan, dan rangkong yang terbang di atas rimba.", "A longhouse far off, an orangutan on a branch and a hornbill flying over the forest.", "hidup", "rimba-borneo"],
    ["Dahlia Merona", "Blushing Dahlia", "Dahlia merah muda dan jingga yang berputar pelan di kejauhan, satu tangkai di sampul, dan kelopak yang jatuh.", "Pink and orange dahlias turning slowly far off, one stem on the cover and falling petals.", "hidup", "dahlia-merona"],
    ["Dahlia Malam", "Midnight Dahlia", "Dahlia merah anggur dan ungu di atas malam yang pekat, dengan serpihan emas yang jatuh.", "Wine red and purple dahlias on a deep night, with flecks of gold falling.", "hidup", "dahlia-malam"],
    ["Anggrek Bulan", "Moon Orchid", "Tangkai anggrek bulan yang melengkung dari atas, kuntum merah muda di sudut kartu, dan cahaya yang melayang.", "Moon orchid sprays arching from above, pink blooms on the card corners and drifting light.", "hidup", "anggrek-bulan"],
    ["Teratai Kolam", "Lotus Pond", "Teratai merah muda di kaki halaman, daun yang mengapung, ikan koi yang berenang melintas, dan capung.", "Pink lotus at the foot of the page, floating leaves, a koi swimming across and a dragonfly.", "hidup", "teratai-kolam"],
    ["Kolam Koi", "Koi Pond", "Kolam dilihat dari atas: koi yang berputar pelan, daun teratai, dan gelembung yang naik.", "A pond seen from above: koi circling slowly, lotus leaves and bubbles rising.", "hidup", "kolam-koi"],
    ["Capung Senja", "Dragonflies at Dusk", "Capung yang melintas di atas padang bunga liar saat senja, dengan teratai di jeda halaman.", "Dragonflies crossing a meadow of wildflowers at dusk, with water lilies between the sections.", "hidup", "capung-senja"],
    ["Tulip Musim Semi", "Spring Tulips", "Barisan tulip merah muda di kaki halaman, seikat tulip di sampul, dan langit biru pucat.", "A row of pink tulips at the foot of the page, a bunch of tulips on the cover and a pale blue sky.", "hidup", "tulip-musim-semi"],
    ["Magnolia Gading", "Ivory Magnolia", "Magnolia putih gading di atas kain linen, dahan berbunga dari atas, dan kilau emas yang melayang.", "Ivory magnolia over linen, flowering branches from above and drifting specks of gold.", "hidup", "magnolia-gading"],
    ["Peoni Sutra", "Silk Peony", "Peoni merah muda yang berputar pelan di atas kain linen merona, dengan sutra krem di jeda halaman.", "Pink peonies turning slowly over blush linen, with cream silk between the sections.", "hidup", "peoni-sutra"],
    ["Sakura Fajar", "Cherry Blossom at Dawn", "Pohon sakura di depan fajar yang dilukis, ranting berbunga dari atas, dan kelopak yang berguguran.", "A cherry tree before a painted dawn, flowering branches from above and petals coming down.", "hidup", "sakura-fajar"],
    ["Ladang Lavender", "Lavender Field", "Bukit lavender dengan rumah batu di kejauhan, seikat lavender di sampul, dan kelopak ungu yang terbang.", "A lavender hill with a stone house far off, a bunch of lavender on the cover and violet petals in the air.", "hidup", "ladang-lavender"],
    ["Pita Lavender", "Lavender Ribbon", "Bingkai bunga ungu yang tetap di tempat, pita satin, dan hati dari ranting lavender.", "A frame of violet flowers that stays in place, a satin bow and a heart made of lavender sprigs.", "hidup", "pita-lavender"],
    ["Pantai Biru", "Blue Shore", "Langit cerah yang dilukis, ombak di kaki halaman, pohon kelapa, kerang, dan pelikan yang terbang melintas.", "A bright painted sky, waves at the foot of the page, a coconut palm, shells and a pelican flying across.", "hidup", "pantai-biru"],
    ["Taman Laut", "Sea Garden", "Anemon dan karang warna-warni di dasar laut, ikan badut di sampul, dan gelembung yang naik.", "Colourful anemones and coral on the sea floor, a clownfish on the cover and bubbles rising.", "hidup", "taman-laut"],
    ["Hutan Pinus", "Pine Forest", "Hutan pinus berkabut yang dilukis, pondok kayu di sampul, dan burung yang melintas di antara pohon.", "A painted misty pine forest, a wooden cabin on the cover and a bird crossing between the trees.", "hidup", "hutan-pinus"],
    ["Danau Tenang", "Still Lake", "Danau di kaki gunung, dermaga kayu, pondok di tepi air, dan langit berkabut yang dilukis.", "A lake under the mountains, a wooden jetty, a cabin at the water and a painted misty sky.", "hidup", "danau-tenang"],
    ["Kota Malam", "City at Night", "Siluet kota dengan jendela yang menyala, bulan di atasnya, bintang, dan mobil klasik yang melintas.", "A city skyline with lit windows, the moon above it, stars and a vintage car driving past.", "hidup", "kota-malam"],
    ["Kebun Anggur", "Vineyard", "Barisan anggur menuju rumah di atas bukit, setandan anggur merah, dan daun musim gugur yang jatuh.", "Rows of vines leading to a house on the hill, a bunch of red grapes and autumn leaves falling.", "hidup", "kebun-anggur"],
    ["Salju Pertama", "First Snow", "Cemara bersalju, dahan berselimut salju dari atas, boneka salju, dan kepingan salju yang turun.", "Snowy firs, a snow-covered branch overhead, a snowman and snowflakes coming down.", "hidup", "salju-pertama"],
    ["Daun Gugur", "Autumn Leaves", "Karangan daun musim gugur, bunga matahari dalam kendi, dan daun jingga yang berjatuhan.", "A wreath of autumn leaves, sunflowers in a jug and orange leaves coming down.", "hidup", "daun-gugur"],
    ["Bulu Angsa", "Swan Feathers", "Bulu putih yang melayang turun di depan biru senja, dengan bunga putih di jeda halaman.", "White feathers drifting down against a dusk blue, with white flowers between the sections.", "hidup", "bulu-angsa"],
    ["Konfeti Emas", "Gold Confetti", "Pita dan konfeti emas yang berjatuhan di atas biru malam, cincin emas, dan balon emas.", "Gold ribbons and confetti coming down over night blue, gold rings and gold balloons.", "hidup", "konfeti-emas"],
    ["Geometri Emas", "Gold Geometry", "Marmer putih, garis belah ketupat emas, lingkaran emas berdaun, dan cahaya emas yang melayang.", "White marble, gold diamond lines, a gold ring with leaves and drifting gold light.", "hidup", "geometri-emas"],
    ["Marmer Emas", "Marble and Gold", "Marmer berurat abu dan emas, urat emas yang bergeser saat digulir, cincin, dan peoni putih.", "Marble veined in grey and gold, gold veins that slide as you scroll, rings and white peonies.", "hidup", "marmer-emas"],
    ["Surat Cinta", "Love Letter", "Kertas tua, amplop bersegel lilin merah, sobekan tulisan tangan di sudut, dan pesawat kertas yang melintas.", "Old paper, an envelope with a red wax seal, torn handwriting in the corner and a paper plane passing by.", "hidup", "surat-cinta"],
    ["Kliping Kenangan", "Scrapbook", "Halaman kliping: sobekan koran, bunga stiker, bintang dan matahari krayon merah, dan pita di sampul.", "A scrapbook page: torn newsprint, sticker flowers, red crayon stars and sun and a bow on the cover.", "hidup", "kliping-kenangan"],
    ["Perahu Kertas", "Paper Boats", "Perahu kertas yang berlayar melintas, awan coretan, matahari krayon, dan pesawat kertas di langit biru.", "Paper boats sailing past, a scribbled cloud, a crayon sun and a paper plane in a blue sky.", "hidup", "perahu-kertas"],
    ["Jendela Tua", "Old Windows", "Jendela kayu yang terbuka, lengkung batu berukir, jendela kaca patri berbalut ivy, dan daun yang jatuh.", "An open wooden window, a carved stone arch, a stained-glass window wrapped in ivy and falling leaves.", "hidup", "jendela-tua"],
    ["Karangan Daun", "Leaf Wreaths", "Karangan daun zaitun dan eukaliptus, lingkaran emas berdaun, dan daun hijau yang melayang turun.", "Wreaths of olive and eucalyptus, a gold ring with leaves and green leaves drifting down.", "hidup", "karangan-daun"],
    ["Mobil Klasik", "Vintage Cars", "Langit cerah di atas padang rumput, mobil klasik yang melintas di kaki halaman, dan matahari yang berputar.", "A bright sky over a meadow, vintage cars driving past at the foot of the page and a turning sun.", "hidup", "mobil-klasik"],
    ["Safari Ceria", "Happy Safari", "Jerapah, zebra, singa, dan flamingo yang dilukis cat air, di bawah matahari besar; untuk undangan yang ceria.", "A giraffe, a zebra, a lion and flamingos in watercolour, under a big sun; for a playful invitation.", "hidup", "safari-ceria"],
    ["Kawan Hutan", "Woodland Friends", "Anak rusa, tupai, rubah kecil, dan burung robin di hutan pinus, dengan daun yang jatuh pelan.", "A fawn, a squirrel, a small fox and a robin in a pine wood, with leaves falling slowly.", "hidup", "kawan-hutan"],
    ["Buket Pengantin", "Bridal Bouquet", "Buket peoni merah anggur dan putih di sampul, buket yang berbeda di tiap jeda, dan sapuan cat air merah muda.", "A bouquet of wine red and white peonies on the cover, a different bouquet at each pause and a pink watercolour wash.", "hidup", "buket-pengantin"],
    ["Mawar Merah", "Red Roses", "Buket mawar merah, amplop merah marun dengan segel lilin, dan kelopak yang jatuh di atas krem hangat.", "A bouquet of red roses, a maroon envelope with a wax seal and petals falling over warm cream.", "hidup", "mawar-merah"],
    ["Bunga Matahari", "Sunflowers", "Bunga matahari yang kelopaknya lepas, buket dalam kendi hijau, dan sapuan kuning hangat.", "A sunflower shedding petals, a bouquet in a green jug and a warm yellow wash.", "hidup", "bunga-matahari"],
    ["Pesta Merah Muda", "Pink Party", "Balon merah muda yang naik, kue bertingkat, kado berpita, dan mahkota; untuk lamaran, ulang tahun, atau syukuran.", "Pink balloons rising, a tiered cake, gifts with bows and a crown; for an engagement, a birthday or a thanksgiving.", "hidup", "pesta-merah-muda"],
    ["Kebaya dan Beskap", "Kebaya and Beskap", "Kebaya renda merah muda di sampul, beskap biru tua dan kebaya encim di tiap jeda, dengan hiasan bunga Betawi.", "A pink lace kebaya on the cover, a navy beskap and embroidered kebaya at each pause, with a Betawi floral ornament.", "hidup", "kebaya-beskap"],
    ["Linen Putih", "White Linen", "Kain linen putih, gulungan linen berikat gandum, sutra krem, dan goni di jeda halaman.", "White linen, a roll of linen tied with wheat, cream silk and burlap between the sections.", "hidup", "linen-putih"],
    ["Sapuan Warna", "Colour Wash", "Sapuan cat air ungu, biru, dan jingga yang bergeser saat digulir; tanpa bunga, tanpa hiasan lain.", "Washes of violet, blue and orange watercolour that slide as you scroll; no flowers and nothing else.", "hidup", "sapuan-warna"],
    ["Tinta Biru", "Blue Ink", "Tinta biru yang mekar di atas putih, sapuan biru yang bergeser saat digulir, dan urat emas yang tipis.", "Blue ink blooming on white, blue washes that slide as you scroll and fine veins of gold.", "hidup", "tinta-biru"],
    ["Matahari Pagi", "Morning Sun", "Matahari besar yang berputar pelan di langit pucat, awan yang bergeser, dan bunga aster putih.", "A large sun turning slowly in a pale sky, drifting clouds and white daisies.", "hidup", "matahari-pagi"],
    ["Taburan Bintang", "Scattered Stars", "Bintang krayon dan bintang cat air di langit biru tua, bulan sabit ungu, dan bintang yang jatuh pelan.", "Crayon and watercolour stars in a deep blue sky, a violet crescent and stars falling slowly.", "hidup", "taburan-bintang"]
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
