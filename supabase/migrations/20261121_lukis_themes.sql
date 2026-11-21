-- 72 painted Dasar themes (21 Nov 2026), like the illustrated scroll invitations couples already know.
-- Four new families for them: bunga (flowers and colour), tempat (places in Indonesia), budaya (faith and culture),
-- waktu (seasons and times of day). Every one has a working sample (kit = its own slug in undangan/dasar.html).
-- Pictures are in the repository: assets/img/lukis-<slug>.webp (the painting), bunga-<slug>.webp (its flower corner),
-- cover-<slug>.webp with -t, -m and -s. Safe to run twice.

begin;

alter table public.themes drop constraint if exists themes_family_check;
alter table public.themes add constraint themes_family_check check (family is null or family in
  ('alam', 'royal', 'religi', 'nusa', 'dunia', 'era', 'elemen', 'bunga', 'tempat', 'budaya', 'waktu'));

insert into public.themes (slug, tier, family, name_id, name_en, desc_id, desc_en, kit, sort) values
('sage-pagi', 'dasar', 'bunga', 'Sage Pagi', 'Sage Morning', 'Padang hijau sage berkabut, eukaliptus, dan mawar putih kecil.', 'A misty sage meadow, eucalyptus and small white roses.', 'sage-pagi', 2000),
('mawar-debu', 'dasar', 'bunga', 'Mawar Debu', 'Dusty Rose Garden', 'Taman mawar tua dalam kabut merah muda pudar.', 'An old rose garden in a dusty pink haze.', 'mawar-debu', 2010),
('lila', 'dasar', 'bunga', 'Lila', 'Lilac', 'Semak lila di bawah langit ungu pucat.', 'Lilac bushes under a pale violet sky.', 'lila', 2020),
('terakota-kering', 'dasar', 'bunga', 'Terakota Kering', 'Dried Terracotta', 'Lembah hangat, rumput pampas, dan mawar terakota.', 'A warm valley, pampas grass and terracotta roses.', 'terakota-kering', 2030),
('navy-emas', 'dasar', 'bunga', 'Navy Emas', 'Navy and Gold', 'Taman malam biru tua dengan bintang emas.', 'A navy night garden with gold stars.', 'navy-emas', 2040),
('gading', 'dasar', 'bunga', 'Gading', 'Ivory', 'Teras taman gading dengan pagar batu dan mawar putih.', 'An ivory garden terrace, stone balustrade and white roses.', 'gading', 2050),
('peoni', 'dasar', 'bunga', 'Peoni', 'Peony', 'Taman peony merah muda yang larut dalam kabut krem.', 'A blush peony garden fading into cream mist.', 'peoni', 2060),
('zaitun', 'dasar', 'bunga', 'Zaitun', 'Olive Grove', 'Kebun zaitun keperakan di bukit yang landai.', 'A silvery olive grove on gentle hills.', 'zaitun', 2070),
('mentega', 'dasar', 'bunga', 'Kuning Mentega', 'Butter Yellow', 'Padang bunga kuning mentega dan aster putih.', 'A butter yellow meadow and white daisies.', 'mentega', 2080),
('persik', 'dasar', 'bunga', 'Persik', 'Peach', 'Kebun persik sedang berbunga di bawah langit lembut.', 'A peach orchard in bloom under a soft sky.', 'persik', 2090),
('hortensia', 'dasar', 'bunga', 'Hortensia', 'Hydrangea', 'Jalan taman berbatas hortensia biru dan lavender.', 'A garden path lined with blue and lavender hydrangea.', 'hortensia', 2100),
('anggrek', 'dasar', 'bunga', 'Anggrek', 'Orchid', 'Rumah kaca tropis dengan anggrek putih dan ungu.', 'A tropical glasshouse of white and purple orchids.', 'anggrek', 2110),
('bunga-liar', 'dasar', 'bunga', 'Bunga Liar', 'Wildflowers', 'Padang bunga liar: poppy, cornflower, dan rumput tinggi.', 'A wildflower meadow: poppies, cornflowers and tall grass.', 'bunga-liar', 2120),
('lili-putih', 'dasar', 'bunga', 'Lili Putih', 'White Lily', 'Lili putih yang tinggi di tepi kolam yang tenang.', 'Tall white lilies beside a still pond.', 'lili-putih', 2130),
('anggur-merah', 'dasar', 'bunga', 'Anggur Merah', 'Burgundy', 'Taman dahlia merah anggur saat senja.', 'A garden of burgundy dahlias at dusk.', 'anggur-merah', 2140),
('kamomil', 'dasar', 'bunga', 'Kamomil', 'Chamomile', 'Hamparan bunga kamomil di bawah langit pucat.', 'A field of chamomile under a pale sky.', 'kamomil', 2150),
('tulip', 'dasar', 'bunga', 'Tulip', 'Tulip Fields', 'Ladang tulip pastel dan kincir angin di kejauhan.', 'Pastel tulip fields and a windmill far away.', 'tulip', 2160),
('matahari', 'dasar', 'bunga', 'Bunga Matahari', 'Sunflower', 'Ladang bunga matahari di bukit saat sore keemasan.', 'Sunflower fields on the hills at golden hour.', 'matahari', 2170),
('sawah', 'dasar', 'tempat', 'Sawah Terasering', 'Rice Terraces', 'Sawah terasering hijau di pagi berkabut.', 'Green rice terraces on a misty morning.', 'sawah', 2180),
('toba', 'dasar', 'tempat', 'Danau Toba', 'Lake Toba', 'Danau Toba yang tenang, bukit hijau, dan kamboja putih.', 'Calm Lake Toba, green hills and white frangipani.', 'toba', 2190),
('bromo', 'dasar', 'tempat', 'Bromo Subuh', 'Bromo at Dawn', 'Bromo dan lautan pasir saat fajar merah muda.', 'Bromo and its sea of sand at a pink dawn.', 'bromo', 2200),
('raja-ampat', 'dasar', 'tempat', 'Raja Ampat', 'Raja Ampat', 'Pulau karst Raja Ampat di air biru toska.', 'The karst islands of Raja Ampat in turquoise water.', 'raja-ampat', 2210),
('dieng', 'dasar', 'tempat', 'Dieng Berkabut', 'Misty Dieng', 'Dataran Dieng yang berkabut, telaga, dan pinus.', 'The misty Dieng plateau, its lake and pines.', 'dieng', 2220),
('kebun-teh', 'dasar', 'tempat', 'Kebun Teh', 'Tea Plantation', 'Barisan kebun teh di perbukitan berkabut.', 'Rows of tea on misty hills.', 'kebun-teh', 2230),
('belitung', 'dasar', 'tempat', 'Belitung', 'Belitung Shore', 'Batu granit di pantai pasir putih Belitung.', 'Granite boulders on a white Belitung beach.', 'belitung', 2240),
('rinjani', 'dasar', 'tempat', 'Rinjani', 'Rinjani', 'Gunung Rinjani dan danau kawahnya di pagi hari.', 'Mount Rinjani and its crater lake in the morning.', 'rinjani', 2250),
('labuan-bajo', 'dasar', 'tempat', 'Labuan Bajo', 'Labuan Bajo', 'Teluk Labuan Bajo saat senja dan kapal pinisi jauh di laut.', 'The bays of Labuan Bajo at sunset, a phinisi far out.', 'labuan-bajo', 2260),
('kelimutu', 'dasar', 'tempat', 'Kelimutu', 'Kelimutu', 'Tiga danau warna Kelimutu dalam kabut pagi.', 'The three coloured lakes of Kelimutu in morning haze.', 'kelimutu', 2270),
('ngarai', 'dasar', 'tempat', 'Ngarai Sianok', 'Sianok Canyon', 'Ngarai Sianok yang hijau dengan tebing dan sungai.', 'The green Sianok canyon, its cliffs and river.', 'ngarai', 2280),
('sumba', 'dasar', 'tempat', 'Savana Sumba', 'Sumba Savanna', 'Bukit savana keemasan Sumba di bawah langit luas.', 'Golden savanna hills of Sumba under a wide sky.', 'sumba', 2290),
('ijen', 'dasar', 'tempat', 'Kawah Ijen', 'Ijen Night', 'Kawah Ijen di malam hari dengan cahaya biru dan bintang.', 'The Ijen crater at night, blue glow and stars.', 'ijen', 2300),
('braga', 'dasar', 'tempat', 'Braga', 'Braga Street', 'Deretan toko art deco di Jalan Braga, Bandung, selepas hujan.', 'The Art Deco shopfronts of Braga, Bandung, after rain.', 'braga', 2310),
('kota-tua', 'dasar', 'tempat', 'Kota Tua', 'Old Batavia', 'Alun-alun Kota Tua Jakarta, gedung putih dan sepeda.', 'The old square of Kota Tua, white buildings and bicycles.', 'kota-tua', 2320),
('ubud', 'dasar', 'tempat', 'Hutan Ubud', 'Ubud Forest', 'Lembah hutan Ubud, sungai kecil, dan monstera.', 'An Ubud jungle valley, a small river and monstera.', 'ubud', 2330),
('pinisi', 'dasar', 'tempat', 'Pinisi', 'Phinisi Sail', 'Kapal pinisi di laut biru yang tenang saat sore.', 'A phinisi on a calm blue sea in the late afternoon.', 'pinisi', 2340),
('danau-sentani', 'dasar', 'tempat', 'Danau Sentani', 'Lake Sentani', 'Danau Sentani, bukit hijau, dan rumah panggung saat fajar.', 'Lake Sentani, green hills and stilt houses at dawn.', 'danau-sentani', 2350),
('lengkung-islami', 'dasar', 'budaya', 'Lengkung Islami', 'Islamic Arch', 'Lengkung krem berkisi geometri dan taman di baliknya.', 'A cream arch with a geometric lattice and a garden beyond.', 'lengkung-islami', 2360),
('mihrab-lentera', 'dasar', 'budaya', 'Lentera Mihrab', 'Lantern Niche', 'Ceruk berlengkung dengan lentera kuningan dan ubin hijau tua.', 'An arched niche with brass lanterns and deep green tiles.', 'mihrab-lentera', 2370),
('geometri', 'dasar', 'budaya', 'Geometri Islami', 'Islamic Geometry', 'Pola bintang emas yang halus dan kubah di kejauhan.', 'Fine gold star patterns and a dome far away.', 'geometri', 2380),
('parang', 'dasar', 'budaya', 'Batik Parang', 'Batik Parang', 'Pita batik parang cokelat keemasan dan melati.', 'Bands of brown and gold batik parang with jasmine.', 'parang', 2390),
('kawung', 'dasar', 'budaya', 'Batik Kawung', 'Batik Kawung', 'Batik kawung nila dan krem dengan melati.', 'Indigo and cream batik kawung with jasmine.', 'kawung', 2400),
('mega-mendung', 'dasar', 'budaya', 'Mega Mendung', 'Mega Mendung', 'Awan mega mendung Cirebon dalam gradasi biru.', 'Cirebon mega mendung clouds in shades of blue.', 'mega-mendung', 2410),
('songket-minang', 'dasar', 'budaya', 'Songket Minang', 'Minang Songket', 'Songket merah berbenang emas dan atap rumah gadang.', 'Red songket with gold thread and a rumah gadang roof.', 'songket-minang', 2420),
('rumah-gadang', 'dasar', 'budaya', 'Rumah Gadang', 'Rumah Gadang', 'Rumah gadang beratap gonjong di tengah sawah.', 'A rumah gadang with horned roofs among rice fields.', 'rumah-gadang', 2430),
('peranakan', 'dasar', 'budaya', 'Ubin Peranakan', 'Peranakan Tiles', 'Ubin peranakan hijau mint dan merah muda dengan peony.', 'Mint and pink peranakan tiles with peonies.', 'peranakan', 2440),
('lampion', 'dasar', 'budaya', 'Lampion Merah', 'Red Lanterns', 'Lampion merah di pelataran berkabut dan bunga plum.', 'Red lanterns over a misty courtyard and plum blossom.', 'lampion', 2450),
('penjor', 'dasar', 'budaya', 'Penjor Bali', 'Bali Penjor', 'Penjor janur di jalan desa Bali yang tenang.', 'Penjor of woven palm along a quiet Balinese village road.', 'penjor', 2460),
('toraja', 'dasar', 'budaya', 'Ukiran Toraja', 'Toraja Carving', 'Tongkonan Toraja dan ukiran merah hitamnya di tengah sawah.', 'A Toraja tongkonan and its red and black carving in rice fields.', 'toraja', 2470),
('dayak', 'dasar', 'budaya', 'Motif Dayak', 'Dayak Motif', 'Garis ornamen Dayak dan bulu enggang.', 'Dayak ornament lines and hornbill feathers.', 'dayak', 2480),
('angklung', 'dasar', 'budaya', 'Angklung', 'Angklung', 'Angklung di rumpun bambu Sunda yang hijau.', 'Angklung in a green Sundanese bamboo grove.', 'angklung', 2490),
('gunungan', 'dasar', 'budaya', 'Gunungan', 'Gunungan', 'Gunungan wayang keemasan di atas krem.', 'A golden wayang gunungan on cream.', 'gunungan', 2500),
('songket-limar', 'dasar', 'budaya', 'Songket Limar', 'Limar Songket', 'Songket limar merah keemasan dalam bingkai ukiran emas.', 'Red and gold songket limar in a carved gold frame.', 'songket-limar', 2510),
('kapel-kaca', 'dasar', 'budaya', 'Kapel Kaca', 'Glass Chapel', 'Kapel taman putih dengan jendela kaca patri.', 'A white garden chapel with a stained glass window.', 'kapel-kaca', 2520),
('gerbang-bali', 'dasar', 'budaya', 'Candi Bentar', 'Bali Split Gate', 'Candi bentar dari batu di antara pohon kamboja.', 'A stone candi bentar among frangipani trees.', 'gerbang-bali', 2530),
('fajar', 'dasar', 'waktu', 'Fajar', 'First Light', 'Danau tenang pada cahaya pertama, merah muda dan emas.', 'A calm lake at first light, pink and gold.', 'fajar', 2540),
('golden-hour', 'dasar', 'waktu', 'Golden Hour', 'Golden Hour', 'Padang keemasan dalam cahaya sore yang panjang.', 'A golden field in long afternoon light.', 'golden-hour', 2550),
('jingga', 'dasar', 'waktu', 'Senja Jingga', 'Orange Dusk', 'Langit senja jingga di atas laut yang tenang.', 'An orange dusk sky over a calm sea.', 'jingga', 2560),
('biru-malam', 'dasar', 'waktu', 'Biru Malam', 'Blue Night', 'Langit malam biru tua dan bulan purnama di atas bukit.', 'A deep blue night and a full moon over the hills.', 'biru-malam', 2570),
('hujan', 'dasar', 'waktu', 'Hujan Taman', 'Garden Rain', 'Taman yang basah oleh hujan lembut.', 'A garden in gentle rain.', 'hujan', 2580),
('pantai-siang', 'dasar', 'waktu', 'Pantai Siang', 'Midday Beach', 'Pantai tropis yang cerah di siang hari.', 'A bright tropical beach at midday.', 'pantai-siang', 2590),
('sakura', 'dasar', 'waktu', 'Musim Semi', 'Spring', 'Ranting sakura, langit musim semi, dan jembatan kecil.', 'Cherry blossom, a spring sky and a small bridge.', 'sakura', 2600),
('gugur', 'dasar', 'waktu', 'Musim Gugur', 'Autumn', 'Jalan hutan musim gugur dengan maple jingga dan merah.', 'An autumn path of orange and red maples.', 'gugur', 2610),
('salju', 'dasar', 'waktu', 'Musim Salju', 'Winter', 'Hutan pinus bersalju yang sunyi.', 'A quiet snowy pine forest.', 'salju', 2620),
('kabut-pinus', 'dasar', 'waktu', 'Kabut Pinus', 'Pine Mist', 'Lapisan hutan pinus berkabut di pagi kelabu.', 'Layers of misty pine forest on a grey morning.', 'kabut-pinus', 2630),
('purnama', 'dasar', 'waktu', 'Bulan Purnama', 'Full Moon', 'Bulan purnama terbit di atas laut gelap berkilau perak.', 'A full moon rising over a dark silver sea.', 'purnama', 2640),
('pelangi', 'dasar', 'waktu', 'Pelangi', 'Rainbow', 'Pelangi pastel di atas bukit hijau selepas hujan.', 'A pastel rainbow over green hills after rain.', 'pelangi', 2650),
('embun', 'dasar', 'waktu', 'Embun Pagi', 'Morning Dew', 'Rumput dan daun berembun dalam cahaya pagi.', 'Dewy grass and leaves in morning light.', 'embun', 2660),
('kunang', 'dasar', 'waktu', 'Kunang-Kunang', 'Fireflies', 'Padang rumput di malam musim panas penuh kunang-kunang.', 'A summer meadow at night full of fireflies.', 'kunang', 2670),
('langit-ungu', 'dasar', 'waktu', 'Langit Ungu', 'Violet Sky', 'Langit senja ungu dan merah muda di atas ladang lavender.', 'A violet and pink evening over lavender fields.', 'langit-ungu', 2680),
('padang', 'dasar', 'waktu', 'Padang Rumput', 'Grassland', 'Padang rumput hijau dan sebatang pohon di bawah awan putih.', 'A green grassland and a lone tree under white clouds.', 'padang', 2690),
('laut-subuh', 'dasar', 'waktu', 'Laut Subuh', 'Sea at Dawn', 'Laut tenang saat subuh dan mercusuar di kejauhan.', 'A calm sea at dawn and a far lighthouse.', 'laut-subuh', 2700),
('bintang-jatuh', 'dasar', 'waktu', 'Bintang Jatuh', 'Shooting Stars', 'Bintang jatuh di langit nila di atas gurun yang sunyi.', 'Shooting stars in an indigo sky over a quiet desert.', 'bintang-jatuh', 2710)
on conflict (slug) do nothing;

commit;

-- check: should say 84
select count(*) from public.themes where tier = 'dasar' and deleted_at is null;
