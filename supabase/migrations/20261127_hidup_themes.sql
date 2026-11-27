-- 30 living Dasar themes (27 Nov 2026), built from the cut-outs in the owner's art directory: family "hidup".
-- Scenery in layers that shift with the scroll, falling or rising particles, swaying corners. Every one has a working
-- sample (kit = its own slug in undangan/dasar.html). Written by tools/hidup.py. Safe to run twice.

begin;

alter table public.themes drop constraint if exists themes_family_check;
alter table public.themes add constraint themes_family_check check (family is null or family in
  ('alam', 'royal', 'religi', 'nusa', 'dunia', 'era', 'elemen', 'bunga', 'tempat', 'budaya', 'waktu', 'hidup'));

insert into public.themes (slug, tier, family, name_id, name_en, desc_id, desc_en, kit, sort) values
('lili-merona', 'dasar', 'hidup', 'Lili Merona', 'Blushing Lilies', 'Lili merah muda yang bergoyang, daun eukaliptus di atas, dan kelopak yang jatuh perlahan.', 'Swaying pink lilies, eucalyptus above and petals falling slowly.', 'lili-merona', 3000),
('lili-gading', 'dasar', 'hidup', 'Lili Gading', 'Ivory Lilies', 'Lili putih gading di antara sulur hijau, dengan kilau emas yang melayang.', 'Ivory lilies among green vines, with drifting specks of gold.', 'lili-gading', 3010),
('sakura-gugur', 'dasar', 'hidup', 'Sakura Berguguran', 'Falling Cherry Blossom', 'Ranting sakura di sudut atas, pohon merah muda di kejauhan, dan kelopak yang terus berguguran.', 'Cherry branches overhead, a pink tree far off and petals that never stop falling.', 'sakura-gugur', 3020),
('fuji-semi', 'dasar', 'hidup', 'Fuji Musim Semi', 'Fuji in Spring', 'Gunung Fuji di balik ranting sakura; gunung dan bunga bergeser saat digulir.', 'Mount Fuji behind cherry branches; mountain and blossom slide apart as you scroll.', 'fuji-semi', 3030),
('ladang-poppy', 'dasar', 'hidup', 'Ladang Poppy', 'Poppy Field', 'Poppy merah dan cornflower di padang rumput, dengan benih yang terbang ke langit.', 'Red poppies and cornflowers in the grass, with seeds floating up to the sky.', 'ladang-poppy', 3040),
('padang-aster', 'dasar', 'hidup', 'Padang Aster', 'Daisy Meadow', 'Padang aster putih dan bunga biru, sulur muda di atas, dan aster kecil yang berjatuhan.', 'A meadow of white daisies and blue flowers, young vines above and little daisies falling.', 'padang-aster', 3050),
('kebun-rahasia', 'dasar', 'hidup', 'Kebun Rahasia', 'Secret Garden', 'Tirai sulur hijau, lengkung daun, hortensia putih, dan kunang-kunang yang naik perlahan.', 'A curtain of green vines, an arch of leaves, white hydrangea and fireflies drifting up.', 'kebun-rahasia', 3060),
('wisteria-ungu', 'dasar', 'hidup', 'Wisteria Ungu', 'Purple Wisteria', 'Wisteria ungu menjuntai dari atas dan kelopak ungu yang melayang turun.', 'Purple wisteria hanging from above and violet petals drifting down.', 'wisteria-ungu', 3070),
('gapura-mawar', 'dasar', 'hidup', 'Gapura Mawar', 'Rose Arch', 'Gapura kayu berhias mawar tempat Nawala terbang, dengan rangkaian mawar di setiap sudut.', 'A wooden arch dressed in roses where Nawala flies, with sprays of roses at every corner.', 'gapura-mawar', 3080),
('rimba-tropis', 'dasar', 'hidup', 'Rimba Tropis', 'Tropical Jungle', 'Monstera dan palem berlapis yang bergeser saat digulir, kembang sepatu, dan daun yang jatuh.', 'Layered monstera and palm that slide as you scroll, hibiscus and falling leaves.', 'rimba-tropis', 3090),
('kembang-sepatu', 'dasar', 'hidup', 'Kembang Sepatu', 'Hibiscus', 'Kembang sepatu jingga dan merah muda, pakis di atas, dan kelopak hangat yang jatuh.', 'Coral and pink hibiscus, ferns above and warm petals falling.', 'kembang-sepatu', 3100),
('emas-malam', 'dasar', 'hidup', 'Emas Malam', 'Gold at Night', 'Matahari emas yang berputar pelan di langit malam, tirai emas, dan serpihan emas yang jatuh.', 'A gold sun turning slowly in a night sky, a gold curtain and falling flecks of gold.', 'emas-malam', 3110),
('kolibri-emas', 'dasar', 'hidup', 'Kolibri Emas', 'Golden Hummingbirds', 'Kolibri emas yang terbang melintas, mawar emas, dan sudut berukir di atas kertas gading.', 'Gold hummingbirds flying across, a gold rose and carved corners on ivory paper.', 'kolibri-emas', 3120),
('merak-zamrud', 'dasar', 'hidup', 'Merak Zamrud', 'Emerald Peacock', 'Bulu merak di atas hijau zamrud, bros mutiara, dan kupu-kupu emas yang melintas.', 'A peacock feather on emerald green, a pearl brooch and a gold butterfly passing by.', 'merak-zamrud', 3130),
('herbarium', 'dasar', 'hidup', 'Herbarium', 'Herbarium', 'Bunga kering yang ditempel selotip di atas kertas tua, dengan tangkai yang bergoyang pelan.', 'Dried flowers taped to old paper, their stems swaying gently.', 'herbarium', 3140),
('bunga-tekan', 'dasar', 'hidup', 'Bunga Tekan', 'Pressed Flowers', 'Bunga tekan aneka warna yang berputar pelan di sekeliling undangan.', 'Pressed flowers of every colour turning slowly around the invitation.', 'bunga-tekan', 3150),
('puncak-pagi', 'dasar', 'hidup', 'Puncak Pagi', 'Morning Peaks', 'Tiga lapis gunung dan hutan pinus yang bergeser saat digulir, dengan matahari yang naik.', 'Three layers of mountain and pine forest that slide as you scroll, under a rising sun.', 'puncak-pagi', 3160),
('desa-alpen', 'dasar', 'hidup', 'Desa Alpen', 'Alpine Village', 'Desa kayu di kaki puncak bersalju, dengan salju yang turun perlahan.', 'A wooden village under snowy peaks, with snow coming down softly.', 'desa-alpen', 3170),
('jelajah-berdua', 'dasar', 'hidup', 'Jelajah Berdua', 'Adventure for Two', 'Kompas, gunung, dan mobil kemping kecil yang melaju melintasi layar.', 'A compass, mountains and a little camper van driving across the screen.', 'jelajah-berdua', 3180),
('pastel-semi', 'dasar', 'hidup', 'Pastel Musim Semi', 'Spring Pastels', 'Buket cat air pastel, bunga kecil bertebaran, dan kelopak lembut yang jatuh.', 'A pastel watercolour bouquet, tiny scattered flowers and soft petals falling.', 'pastel-semi', 3190),
('peoni-merona', 'dasar', 'hidup', 'Peoni Merona', 'Blushing Peonies', 'Peony merah muda yang mekar saat digulir, eukaliptus di atas, dan kelopak yang jatuh.', 'Blush peonies that open as you scroll, eucalyptus above and falling petals.', 'peoni-merona', 3200),
('hortensia-salju', 'dasar', 'hidup', 'Hortensia Salju', 'Snow Hydrangea', 'Hortensia dan peony putih di antara daun hijau, dengan buket putih yang menjuntai.', 'White hydrangea and peony among green leaves, with a trailing white bouquet.', 'hortensia-salju', 3210),
('jingga-senja', 'dasar', 'hidup', 'Jingga Senja', 'Orange Dusk', 'Lili jingga dan anggrek di bawah matahari senja yang besar, dengan kelopak kuning yang jatuh.', 'Orange lilies and orchids under a large evening sun, with yellow petals falling.', 'jingga-senja', 3220),
('krokus-ungu', 'dasar', 'hidup', 'Krokus Ungu', 'Violet Crocus', 'Krokus dan pansy ungu, sulur hijau di atas, dan kelopak ungu yang melayang.', 'Violet crocus and pansies, green vines above and drifting purple petals.', 'krokus-ungu', 3230),
('boho-pampas', 'dasar', 'hidup', 'Boho Pampas', 'Boho Pampas', 'Pampas dan bunga kering dalam warna tanah, dengan tirai keemasan di atas.', 'Pampas and dried flowers in earth tones, under a golden curtain.', 'boho-pampas', 3240),
('ladang-matahari', 'dasar', 'hidup', 'Ladang Matahari', 'Sunflower Field', 'Bunga matahari di bawah matahari cat air yang berputar, dengan kelopak kuning yang terbang.', 'Sunflowers under a turning watercolour sun, with yellow petals on the wind.', 'ladang-matahari', 3250),
('lili-marun', 'dasar', 'hidup', 'Lili Marun', 'Maroon Lily', 'Lili merah gelap dan mawar tekan di atas marun pekat, dengan tirai dan serpihan emas.', 'Dark red lilies and pressed roses on deep maroon, with a curtain and flecks of gold.', 'lili-marun', 3260),
('gerbera-ceria', 'dasar', 'hidup', 'Gerbera Ceria', 'Cheerful Gerbera', 'Gerbera besar yang berputar pelan di sudut layar, dahlia, kosmos, dan kelopak merah muda.', 'Large gerberas turning slowly at the edges, dahlia, cosmos and pink petals.', 'gerbera-ceria', 3270),
('pesta-topeng', 'dasar', 'hidup', 'Pesta Topeng', 'Masquerade', 'Topeng emas, permata, dan kolibri hitam emas di malam ungu tua bertabur emas.', 'A gold mask, a jewel and a black and gold hummingbird in a deep violet night of gold dust.', 'pesta-topeng', 3280),
('sakura-malam', 'dasar', 'hidup', 'Sakura Malam', 'Cherry Blossom Night', 'Sakura di langit malam biru tua, lampion yang bergoyang, dan kelopak yang berguguran.', 'Cherry blossom against a deep blue night, a swaying lantern and falling petals.', 'sakura-malam', 3290)
on conflict (slug) do update set tier = excluded.tier, family = excluded.family, name_id = excluded.name_id, name_en = excluded.name_en,
  desc_id = excluded.desc_id, desc_en = excluded.desc_en, kit = excluded.kit, sort = excluded.sort;

commit;
