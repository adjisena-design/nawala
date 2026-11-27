#!/usr/bin/env python3
# The living Dasar themes (family "hidup", 27 Nov 2026): one source for the themes built from the hand-made and
# AI-made cut-outs in the owner's "NAWALA ART DIRECTORY" (304 numbered 4000 x 4000 PNG files, transparent).
#
#   python3 tools/hidup.py assets <folder with 1.png ... 304.png>   cut, shrink and save every piece a theme uses
#   python3 tools/hidup.py write                                    hidup-data.js, the CSS block, the lists, the SQL
#   python3 tools/hidup.py bake                                     still picture and covers per theme (needs a static
#                                                                   server on :8765 and Playwright with Chrome)
# Run from the repository root. Add a theme: one entry in THEMES below, then the three commands.
#
# A piece is written 'n' (file n.png), with letters after it: v = flipped top to bottom, h = mirrored,
# r = turned upside down, cu / cb / cy / cw = pink petals recoloured violet, blue, yellow, white, pK = part K of a sheet of loose pieces (petals, confetti), cut apart by its gaps.
import sys, os, re, json, colorsys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'assets', 'img', 'hidup')

# ---- helpers for the theme list ----
def far(k, w, x, y, d=.12, move=None, o=None, a=None, t=None, flip=False):
    return dict(k=k, w=w, x=x, y=y, d=d, move=move, o=o, a=a, t=t, flip=flip)
def top(k, w=100, x=0, up=0, right=False, flip=False, a=1.6, t=7, d=.2):
    return dict(k=k, w=w, x=x, up=up, right=right, flip=flip, a=a, t=t, d=d)
def foot(k, w=100, x=0, down=0, right=False, flip=False, a=1.2, t=8, d=.3):
    return dict(k=k, w=w, x=x, down=down, right=right, flip=flip, a=a, t=t, d=d)
def pc(k, w, x=50, y=50, sp=None, flip=False):
    return dict(k=k, w=w, x=x, y=y, sp=sp, flip=flip)
def gap(*p, h=None): return dict(p=list(p), h=h)
def fx(kind, src=(), n=12, s=(14, 28), d=(9, 16), o=(.65, 1), dot=None):
    return dict(kind=kind, src=list(src), n=n, s0=s[0], s1=s[1], d0=d[0], d1=d[1], o0=o[0], o1=o[1], dot=dot)
def fly(k, px=84, y=30, dur=22, flip=False, dy=-6): return dict(k=k, px=px, y=y, dur=dur, flip=flip, dy=dy)
def parts(n, count): return ['%dp%d' % (n, i) for i in range(count)]

PETAL = ['47', '47h']
SAKURA = parts(75, 8) + parts(78, 4)
UNGU = parts(50, 8)
EMAS = parts(143, 7)
DAUN = ['228', '229', '230']

# slug: name (id, en), description (id, en), tone, tags, sky, main, accent, then the scenery
THEMES = {
'lili-merona': dict(
    name=('Lili Merona', 'Blushing Lilies'),
    desc=('Lili merah muda yang bergoyang, daun eukaliptus di atas, dan kelopak yang jatuh perlahan.', 'Swaying pink lilies, eucalyptus above and petals falling slowly.'),
    tone='light', tags=['catair', 'merahmuda', 'lili', 'kelopak'],
    sky='linear-gradient(180deg,#FFF6F7 0,#FDE9EE 52%,#F9D6DF 100%)', main='#5A2C3B', accent='#D0577E',
    top=[top('235', 64, -6, up=8), top('234', 64, -6, up=8, right=True)],
    foot=[foot('39', 112, -6, down=34)],
    hero=[pc('4', 78, 50, 66)],
    corner=('5', '7'),
    gaps=[gap(pc('31', 56, 50, 50)), gap(pc('37', 46, 24, 52), pc('38', 62, 70, 50)), gap(pc('17', 54, 50, 50)), gap(pc('11', 44, 26, 50), pc('12', 46, 74, 52))],
    fx=fx('fall', PETAL, n=11, s=(16, 30))),
'lili-gading': dict(
    name=('Lili Gading', 'Ivory Lilies'),
    desc=('Lili putih gading di antara sulur hijau, dengan kilau emas yang melayang.', 'Ivory lilies among green vines, with drifting specks of gold.'),
    tone='light', tags=['catair', 'putih', 'lili', 'sulur'],
    sky='linear-gradient(180deg,#F5F8EE 0,#FAF7EA 55%,#F3EAD2 100%)', main='#3D4530', accent='#A8903F',
    top=[top('199', 104, -2, up=14)],
    foot=[foot('56', 70, -8, down=10), foot('49', 56, -6, down=8, right=True, flip=True)],
    hero=[pc('52', 62, 50, 66)],
    corner=('52', '25'),
    gaps=[gap(pc('56', 58, 50, 50)), gap(pc('53', 30, 22, 50), pc('25', 50, 66, 50)), gap(pc('49', 52, 50, 50)), gap(pc('296', 78, 50, 50), h=22)],
    fx=fx('float', n=14, s=(5, 11), d=(7, 13), o=(.5, .95), dot='#D9B95A')),
'sakura-gugur': dict(
    name=('Sakura Berguguran', 'Falling Cherry Blossom'),
    desc=('Ranting sakura di sudut atas, pohon merah muda di kejauhan, dan kelopak yang terus berguguran.', 'Cherry branches overhead, a pink tree far off and petals that never stop falling.'),
    tone='light', tags=['catair', 'merahmuda', 'sakura', 'kelopak'],
    sky='linear-gradient(180deg,#FFF8FA 0,#FDEBF0 50%,#F9DCE5 100%)', main='#5B2B3F', accent='#D75E86',
    far=[far('107', 58, 74, 66, d=.1, move='sway', a=1.2)],
    top=[top('83', 74, -6, up=6, right=True)],
    foot=[foot('74', 104, -4, down=6)],
    hero=[pc('72', 78, 46, 68)],
    corner=('77', '79'),
    gaps=[gap(pc('70', 60, 50, 50), h=60), gap(pc('80', 78, 50, 50), h=44), gap(pc('105', 80, 50, 50), h=40), gap(pc('71', 58, 50, 50), h=62)],
    fx=fx('fall', SAKURA, n=18, s=(10, 22), d=(8, 15))),
'fuji-semi': dict(
    name=('Fuji Musim Semi', 'Fuji in Spring'),
    desc=('Gunung Fuji di balik ranting sakura; gunung dan bunga bergeser saat digulir.', 'Mount Fuji behind cherry branches; mountain and blossom slide apart as you scroll.'),
    tone='light', tags=['catair', 'biru', 'gunung', 'sakura'],
    sky='linear-gradient(180deg,#CFE6F8 0,#EAF4FC 46%,#FDF1F4 100%)', main='#2C4560', accent='#D8628A',
    far=[far('82', 128, 50, 60, d=.16, move='breathe')],
    top=[top('282', 104, -4, up=4, right=True)],
    foot=[foot('105', 112, -6, down=14)],
    hero=[pc('79', 76, 50, 84)],
    corner=('77', '88'),
    gaps=[gap(pc('85', 66, 50, 50), h=62), gap(pc('79', 78, 50, 50), h=44), gap(pc('104', 44, 50, 50)), gap(pc('72', 70, 50, 50), h=58)],
    fx=fx('fall', SAKURA, n=14, s=(10, 20), d=(9, 16))),
'ladang-poppy': dict(
    name=('Ladang Poppy', 'Poppy Field'),
    desc=('Poppy merah dan cornflower di padang rumput, dengan benih yang terbang ke langit.', 'Red poppies and cornflowers in the grass, with seeds floating up to the sky.'),
    tone='light', tags=['catair', 'merah', 'poppy', 'padang'],
    sky='linear-gradient(180deg,#DDEEF9 0,#F3F8F4 50%,#FCF6E2 100%)', main='#34432C', accent='#C8442F',
    far=[far('109', 30, 90, 8, d=-.1, move='turn', t=160, o=.9)],
    foot=[foot('243', 112, -6, down=30)],
    hero=[pc('261', 58, 50, 66)],
    corner=('240', '251'),
    gaps=[gap(pc('245', 96, 50, 50), h=56), gap(pc('247', 84, 50, 50), h=62), gap(pc('263', 96, 50, 50), h=46), gap(pc('252', 96, 50, 50), h=48)],
    fx=fx('rise', n=12, s=(5, 10), d=(12, 20), o=(.6, 1), dot='#FFFFFF')),
'padang-aster': dict(
    name=('Padang Aster', 'Daisy Meadow'),
    desc=('Padang aster putih dan bunga biru, sulur muda di atas, dan aster kecil yang berjatuhan.', 'A meadow of white daisies and blue flowers, young vines above and little daisies falling.'),
    tone='light', tags=['catair', 'kuning', 'aster', 'padang'],
    sky='linear-gradient(180deg,#EEF6E2 0,#FAFAE9 55%,#FFF3CC 100%)', main='#3B4628', accent='#C79A1F',
    top=[top('238', 104, -2, up=16)],
    foot=[foot('244', 110, -5, down=22)],
    hero=[pc('251', 56, 50, 66)],
    corner=('163', '176'),
    gaps=[gap(pc('247', 84, 50, 50), h=62), gap(pc('246', 86, 50, 50), h=60), gap(pc('265', 78, 50, 50), h=58), gap(pc('256', 34, 28, 50), pc('163', 36, 70, 50))],
    fx=fx('fall', parts(176, 5), n=9, s=(18, 30), d=(11, 18))),
'kebun-rahasia': dict(
    name=('Kebun Rahasia', 'Secret Garden'),
    desc=('Tirai sulur hijau, lengkung daun, hortensia putih, dan kunang-kunang yang naik perlahan.', 'A curtain of green vines, an arch of leaves, white hydrangea and fireflies drifting up.'),
    tone='light', tags=['catair', 'hijau', 'sulur', 'taman'],
    sky='linear-gradient(180deg,#E3EEDC 0,#F1F5E6 55%,#F8F4DF 100%)', main='#27402B', accent='#5E8A46',
    far=[far('200', 112, 50, 50, d=.1, move='breathe', o=.55)],
    top=[top('198', 108, -4, up=20)],
    foot=[foot('233', 110, -5, down=28)],
    hero=[pc('203', 46, 50, 72)],
    corner=('204', '213'),
    gaps=[gap(pc('279', 92, 50, 50), h=52), gap(pc('202', 60, 50, 50), h=64), gap(pc('277', 92, 50, 50), h=58), gap(pc('203', 40, 50, 50))],
    fx=fx('rise', n=13, s=(5, 10), d=(10, 18), o=(.5, 1), dot='#F2D36B')),
'wisteria-ungu': dict(
    name=('Wisteria Ungu', 'Purple Wisteria'),
    desc=('Wisteria ungu menjuntai dari atas dan kelopak ungu yang melayang turun.', 'Purple wisteria hanging from above and violet petals drifting down.'),
    tone='light', tags=['catair', 'ungu', 'wisteria', 'kelopak'],
    sky='linear-gradient(180deg,#F1EAFB 0,#F8F3FE 52%,#FBEFF6 100%)', main='#3F2D5E', accent='#8B5FC2',
    top=[top('281', 110, -5, up=8), top('280', 40, -5, up=6, right=True, a=2.4, t=6)],
    foot=[foot('252', 108, -4, down=10)],
    hero=[pc('270', 74, 50, 70)],
    corner=('69', '62'),
    gaps=[gap(pc('287', 50, 50, 50), h=62), gap(pc('62', 44, 28, 50), pc('69', 44, 72, 52)), gap(pc('280', 40, 50, 50), h=58), gap(pc('193', 40, 30, 50), pc('195', 40, 70, 50))],
    fx=fx('fall', UNGU, n=14, s=(10, 20), d=(9, 16))),
'gapura-mawar': dict(
    name=('Gapura Mawar', 'Rose Arch'),
    desc=('Gapura kayu berhias mawar tempat Nawala terbang, dengan rangkaian mawar di setiap sudut.', 'A wooden arch dressed in roses where Nawala flies, with sprays of roses at every corner.'),
    tone='light', tags=['catair', 'krem', 'mawar', 'gapura'],
    sky='linear-gradient(180deg,#FBF4EA 0,#FCEFE6 55%,#F7DFD6 100%)', main='#553228', accent='#C96F6A',
    top=[top('278', 66, -10, up=18, right=True, a=2), top('274v', 60, -6, up=4)],
    foot=[foot('262', 110, -5, down=12)],
    hero=[pc('273', 86, 50, 68, sp=-.25)],
    corner=('274v', '278'),
    gaps=[gap(pc('269', 46, 50, 50), h=64), gap(pc('278', 70, 50, 50)), gap(pc('268', 44, 50, 50), h=66), gap(pc('22', 46, 50, 50), h=60)],
    fx=fx('fall', PETAL, n=9, s=(14, 26))),
'rimba-tropis': dict(
    name=('Rimba Tropis', 'Tropical Jungle'),
    desc=('Monstera dan palem berlapis yang bergeser saat digulir, kembang sepatu, dan daun yang jatuh.', 'Layered monstera and palm that slide as you scroll, hibiscus and falling leaves.'),
    tone='light', tags=['catair', 'hijau', 'monstera', 'tropis'],
    sky='linear-gradient(180deg,#DDEEDD 0,#EEF6E6 52%,#F8F5DC 100%)', main='#1E3F2B', accent='#D6593E',
    far=[far('216', 70, 94, 52, d=.22, move='sway', a=2.4, o=.9), far('223', 66, 8, 62, d=.14, move='sway', a=1.8, o=.85)],
    top=[top('227', 84, -16, up=18, a=2.6), top('208', 56, -4, up=4, right=True, a=3, t=5)],
    foot=[foot('225', 74, -12, down=12), foot('231', 60, -10, down=10, right=True)],
    hero=[pc('219', 70, 40, 74)],
    corner=('226', '236'),
    gaps=[gap(pc('220', 84, 50, 50), h=50), gap(pc('217', 48, 26, 50), pc('222', 46, 74, 50)), gap(pc('221', 58, 50, 50), h=62), gap(pc('224', 54, 30, 50), pc('226', 42, 72, 50))],
    fx=fx('fall', DAUN, n=8, s=(22, 38), d=(10, 17))),
'kembang-sepatu': dict(
    name=('Kembang Sepatu', 'Hibiscus'),
    desc=('Kembang sepatu jingga dan merah muda, pakis di atas, dan kelopak hangat yang jatuh.', 'Coral and pink hibiscus, ferns above and warm petals falling.'),
    tone='light', tags=['catair', 'jingga', 'kembangsepatu', 'tropis'],
    sky='linear-gradient(180deg,#FFF4EA 0,#FFE8DA 52%,#FFD4C2 100%)', main='#5C2E22', accent='#E0603F',
    top=[top('221v', 70, -12, up=16, a=2.4), top('224v', 60, -10, up=14, right=True, a=2.8, t=6)],
    foot=[foot('219', 74, -6, down=4), foot('219', 62, -8, down=8, right=True, flip=True)],
    hero=[pc('226', 64, 50, 68)],
    corner=('23', '65'),
    gaps=[gap(pc('68', 50, 50, 50)), gap(pc('66', 44, 28, 50), pc('63', 46, 72, 50)), gap(pc('226', 52, 50, 50)), gap(pc('23', 42, 30, 50), pc('65', 42, 70, 52))],
    fx=fx('fall', PETAL, n=10, s=(16, 30))),
'emas-malam': dict(
    name=('Emas Malam', 'Gold at Night'),
    desc=('Matahari emas yang berputar pelan di langit malam, tirai emas, dan serpihan emas yang jatuh.', 'A gold sun turning slowly in a night sky, a gold curtain and falling flecks of gold.'),
    tone='dark', tags=['emas', 'malam', 'ornamen', 'mewah'],
    sky='linear-gradient(180deg,#0C1322 0,#141D33 55%,#1E2742 100%)', main='#1A2540', accent='#C9A24B',
    far=[far('148', 86, 50, 56, d=.14, move='turn', t=140, o=.5)],
    top=[top('283', 108, -4, up=46, a=1.2, t=9)],
    foot=[foot('288', 64, 18, down=12, a=.6)],
    hero=[pc('150', 46, 50, 70)],
    corner=('289', '292v'),
    gaps=[gap(pc('296', 82, 50, 50), h=20), gap(pc('151', 54, 50, 50)), gap(pc('303', 40, 50, 50)), gap(pc('149', 24, 50, 50), h=44)],
    fx=fx('fall', EMAS, n=14, s=(8, 18), d=(8, 15), o=(.6, 1)),
    fly=[fly('144', 88, 34, 24)]),
'kolibri-emas': dict(
    name=('Kolibri Emas', 'Golden Hummingbirds'),
    desc=('Kolibri emas yang terbang melintas, mawar emas, dan sudut berukir di atas kertas gading.', 'Gold hummingbirds flying across, a gold rose and carved corners on ivory paper.'),
    tone='light', tags=['emas', 'gading', 'kolibri', 'ornamen'],
    sky='linear-gradient(180deg,#FCF8EE 0,#F8F0DC 55%,#F1E3C2 100%)', main='#4A3A1C', accent='#B8902F',
    far=[far('148', 80, 50, 58, d=.12, move='turn', t=160, o=.28)],
    top=[top('142r', 46, -2, up=0, a=1), top('142r', 46, -2, up=0, right=True, flip=True, a=1)],
    foot=[foot('293', 60, 20, down=8, a=.6)],
    hero=[pc('152', 60, 46, 70)],
    corner=('290v', '294v'),
    gaps=[gap(pc('158', 44, 50, 50)), gap(pc('151', 52, 50, 50)), gap(pc('157', 30, 30, 44), pc('156', 30, 68, 56)), gap(pc('150', 34, 50, 50), h=64)],
    fx=fx('float', n=13, s=(5, 10), d=(7, 13), o=(.5, .95), dot='#C9A24B'),
    fly=[fly('156', 70, 40, 20), fly('157', 56, 62, 26, flip=True)]),
'merak-zamrud': dict(
    name=('Merak Zamrud', 'Emerald Peacock'),
    desc=('Bulu merak di atas hijau zamrud, bros mutiara, dan kupu-kupu emas yang melintas.', 'A peacock feather on emerald green, a pearl brooch and a gold butterfly passing by.'),
    tone='dark', tags=['emas', 'hijau', 'merak', 'mewah'],
    sky='linear-gradient(180deg,#0B2622 0,#0F3530 55%,#15443C 100%)', main='#123A33', accent='#C9A24B',
    far=[far('155', 92, 62, 58, d=.16, move='sway', a=2.2, o=.7)],
    top=[top('288', 72, 14, up=18, a=.6)],
    foot=[foot('293', 62, 19, down=10, a=.6)],
    hero=[pc('303', 40, 50, 72)],
    corner=('291v', '302h'),
    gaps=[gap(pc('155', 62, 50, 50)), gap(pc('303', 38, 50, 50)), gap(pc('296', 82, 50, 50), h=20), gap(pc('153', 44, 50, 50))],
    fx=fx('fall', parts(140, 6), n=12, s=(8, 18), d=(8, 15)),
    fly=[fly('153', 76, 36, 26, dy=-12)]),
'herbarium': dict(
    name=('Herbarium', 'Herbarium'),
    desc=('Bunga kering yang ditempel selotip di atas kertas tua, dengan tangkai yang bergoyang pelan.', 'Dried flowers taped to old paper, their stems swaying gently.'),
    tone='light', tags=['bungakering', 'krem', 'kertas', 'vintage'],
    sky='linear-gradient(180deg,#F6F0E1 0,#F1E8D4 55%,#EADDC2 100%)', main='#4B3C28', accent='#9C7A46',
    far=[far('159', 36, 18, 60, d=.2, move='sway', a=2), far('181', 38, 84, 54, d=.1, move='sway', a=1.6)],
    foot=[foot('164', 26, 2, down=4, a=2.4), foot('167', 22, 26, down=4, a=3, t=6), foot('161', 26, 2, down=4, right=True, a=2.6), foot('160', 40, 22, down=6, right=True, a=2, t=9)],
    hero=[pc('166', 56, 50, 68)],
    corner=('163', '176'),
    gaps=[gap(pc('166', 50, 50, 50)), gap(pc('159', 36, 28, 50), pc('181', 40, 72, 50)), gap(pc('183', 32, 30, 50), pc('182', 26, 70, 50)), gap(pc('190', 56, 50, 50), h=62)],
    fx=fx('fall', ['170', '170h'], n=6, s=(22, 34), d=(13, 20), o=(.7, 1))),
'bunga-tekan': dict(
    name=('Bunga Tekan', 'Pressed Flowers'),
    desc=('Bunga tekan aneka warna yang berputar pelan di sekeliling undangan.', 'Pressed flowers of every colour turning slowly around the invitation.'),
    tone='light', tags=['bungakering', 'warnawarni', 'ceria', 'kertas'],
    sky='linear-gradient(180deg,#FCF9F1 0,#F8F1E3 55%,#F3E7D2 100%)', main='#4A3B33', accent='#C5566B',
    far=[far('172', 34, 98, 9, d=.26, move='turn', t=90), far('174', 44, 6, 44, d=.12, move='turn', t=130), far('186', 42, 92, 70, d=.18, move='turn', t=110), far('171', 32, 14, 84, d=.3, move='turn', t=80)],
    hero=[pc('191', 60, 50, 68)],
    corner=('178', '179'),
    gaps=[gap(pc('173', 34, 20, 50), pc('177', 38, 52, 46), pc('187', 34, 82, 54)), gap(pc('184', 38, 26, 50), pc('180', 38, 72, 50)), gap(pc('192', 36, 22, 52), pc('195', 36, 52, 46), pc('185', 36, 82, 52)), gap(pc('168', 40, 30, 50), pc('175', 40, 70, 50))],
    fx=fx('fall', parts(176, 5), n=8, s=(18, 28), d=(12, 19))),
'puncak-pagi': dict(
    name=('Puncak Pagi', 'Morning Peaks'),
    desc=('Tiga lapis gunung dan hutan pinus yang bergeser saat digulir, dengan matahari yang naik.', 'Three layers of mountain and pine forest that slide as you scroll, under a rising sun.'),
    tone='light', tags=['catair', 'biru', 'gunung', 'pinus'],
    sky='linear-gradient(180deg,#BFDDF4 0,#E2F0FA 45%,#FFF4DC 100%)', main='#27405A', accent='#C98A2B',
    far=[far('109', 28, 90, 8, d=-.14, move='turn', t=150), far('116', 150, 40, 58, d=.07), far('110', 128, 62, 76, d=.2)],
    foot=[foot('112', 118, -9, down=22, d=.5)],
    corner=None,
    gaps=[gap(pc('113', 86, 50, 50), h=46), gap(pc('134', 50, 50, 50), h=58), gap(pc('135', 80, 50, 50), h=54), gap(pc('111', 60, 50, 50), h=40)],
    fx=fx('float', n=12, s=(5, 10), d=(8, 14), o=(.6, 1), dot='#FFFFFF')),
'desa-alpen': dict(
    name=('Desa Alpen', 'Alpine Village'),
    desc=('Desa kayu di kaki puncak bersalju, dengan salju yang turun perlahan.', 'A wooden village under snowy peaks, with snow coming down softly.'),
    tone='light', tags=['ilustrasi', 'biru', 'gunung', 'salju'],
    sky='linear-gradient(180deg,#A9C9E6 0,#CFE1F1 50%,#EEF4F9 100%)', main='#263F57', accent='#B5563C',
    far=[far('139', 140, 44, 52, d=.08), far('116', 120, 70, 66, d=.16)],
    foot=[foot('137', 112, -6, down=10, d=.45, a=.3)],
    corner=None,
    gaps=[gap(pc('138', 70, 50, 50), h=62), gap(pc('104', 46, 50, 50)), gap(pc('135', 80, 50, 50), h=54), gap(pc('136', 84, 50, 50), h=50)],
    fx=fx('fall', n=20, s=(5, 11), d=(8, 15), o=(.7, 1), dot='#FFFFFF')),
'jelajah-berdua': dict(
    name=('Jelajah Berdua', 'Adventure for Two'),
    desc=('Kompas, gunung, dan mobil kemping kecil yang melaju melintasi layar.', 'A compass, mountains and a little camper van driving across the screen.'),
    tone='light', tags=['ilustrasi', 'biru', 'petualangan', 'gunung'],
    sky='linear-gradient(180deg,#CDE7F2 0,#EEF6F1 50%,#FBF1D8 100%)', main='#28424B', accent='#D8732E',
    far=[far('109', 26, 10, 8, d=-.12, move='turn', t=150), far('108', 132, 56, 66, d=.14)],
    foot=[foot('233', 112, -6, down=34, d=.4, a=.4)],
    hero=[pc('115', 44, 50, 70)],
    corner=None,
    gaps=[gap(pc('113', 86, 50, 50), h=46), gap(pc('119', 40, 50, 50), h=36), gap(pc('110', 80, 50, 50), h=54), gap(pc('114', 34, 50, 50), h=46)],
    fx=fx('float', n=10, s=(5, 10), d=(8, 14), o=(.6, 1), dot='#FFFFFF'),
    fly=[fly('119', 92, 74, 26, dy=0)]),
'pastel-semi': dict(
    name=('Pastel Musim Semi', 'Spring Pastels'),
    desc=('Buket cat air pastel, bunga kecil bertebaran, dan kelopak lembut yang jatuh.', 'A pastel watercolour bouquet, tiny scattered flowers and soft petals falling.'),
    tone='light', tags=['catair', 'pastel', 'buket', 'musimsemi'],
    sky='linear-gradient(180deg,#FDF7F4 0,#F8F2F8 50%,#EEF3FB 100%)', main='#4A3F5C', accent='#D2749A',
    top=[top('255', 86, -18, up=10, a=2.2), top('43', 46, -8, up=10, right=True, a=1.4)],
    foot=[foot('241', 112, -6, down=6)],
    hero=[pc('22', 60, 50, 68)],
    corner=('43', '249'),
    gaps=[gap(pc('240', 44, 50, 50), h=64), gap(pc('251', 50, 50, 50), h=64), gap(pc('257', 42, 50, 50), h=66), gap(pc('249', 36, 50, 50), h=62)],
    fx=fx('fall', parts(250, 8), n=12, s=(12, 22), d=(10, 17))),
'peoni-merona': dict(
    name=('Peoni Merona', 'Blushing Peonies'),
    desc=('Peony merah muda yang mekar saat digulir, eukaliptus di atas, dan kelopak yang jatuh.', 'Blush peonies that open as you scroll, eucalyptus above and falling petals.'),
    tone='light', tags=['catair', 'merahmuda', 'peony', 'kelopak'],
    sky='linear-gradient(180deg,#FEF5F2 0,#FCE7E2 52%,#F7D2CC 100%)', main='#5B2E33', accent='#D26676',
    top=[top('234', 66, -6, up=8, right=True), top('235', 60, -8, up=10)],
    foot=[foot('21', 96, 2, down=24), foot('34', 44, -10, down=22, right=True)],
    hero=[pc('40', 60, 50, 68)],
    corner=('34', '30'),
    gaps=[gap(pc('33', 52, 50, 50)), gap(pc('45', 54, 50, 50)), gap(pc('19', 42, 28, 50), pc('41', 42, 72, 52)), gap(pc('20', 50, 50, 50))],
    fx=fx('fall', PETAL, n=11, s=(16, 30))),
'hortensia-salju': dict(
    name=('Hortensia Salju', 'Snow Hydrangea'),
    desc=('Hortensia dan peony putih di antara daun hijau, dengan buket putih yang menjuntai.', 'White hydrangea and peony among green leaves, with a trailing white bouquet.'),
    tone='light', tags=['putih', 'hijau', 'hortensia', 'klasik'],
    sky='linear-gradient(180deg,#EAF2E6 0,#F5F8F0 52%,#FBF8EC 100%)', main='#2F4433', accent='#6E9457',
    top=[top('272', 108, -4, up=16)],
    foot=[foot('246', 110, -5, down=20)],
    hero=[pc('268', 52, 50, 66)],
    corner=('276', '213'),
    gaps=[gap(pc('205', 46, 50, 50)), gap(pc('276', 26, 28, 50), pc('258', 40, 70, 50)), gap(pc('56', 58, 50, 50)), gap(pc('203', 42, 50, 50))],
    fx=fx('rise', n=12, s=(5, 10), d=(11, 18), o=(.5, 1), dot='#FFFFFF')),
'jingga-senja': dict(
    name=('Jingga Senja', 'Orange Dusk'),
    desc=('Lili jingga dan anggrek di bawah matahari senja yang besar, dengan kelopak kuning yang jatuh.', 'Orange lilies and orchids under a large evening sun, with yellow petals falling.'),
    tone='light', tags=['jingga', 'senja', 'lili', 'matahari'],
    sky='linear-gradient(180deg,#FFEED8 0,#FFD9B6 52%,#F8B99C 100%)', main='#5A2D17', accent='#D9661F',
    far=[far('109', 84, 50, 66, d=.1, move='turn', t=200, o=.75)],
    top=[top('208', 70, -6, up=6, a=3, t=5.5), top('208', 56, -8, up=10, right=True, flip=True, a=3.4, t=6.5)],
    foot=[foot('260', 110, -5, down=20)],
    hero=[pc('58', 66, 50, 70)],
    corner=('63', '206'),
    gaps=[gap(pc('186', 40, 28, 50), pc('197', 40, 72, 50)), gap(pc('66', 52, 50, 50)), gap(pc('59', 50, 50, 50)), gap(pc('63', 50, 50, 50))],
    fx=fx('fall', parts(55, 4), n=10, s=(14, 26), d=(9, 16))),
'krokus-ungu': dict(
    name=('Krokus Ungu', 'Violet Crocus'),
    desc=('Krokus dan pansy ungu, sulur hijau di atas, dan kelopak ungu yang melayang.', 'Violet crocus and pansies, green vines above and drifting purple petals.'),
    tone='light', tags=['ungu', 'krokus', 'kelopak', 'lembut'],
    sky='linear-gradient(180deg,#EEE8FA 0,#F7F3FD 52%,#FBF3EE 100%)', main='#3A2C5A', accent='#7C55C0',
    top=[top('202', 44, -8, up=10, a=2.4, t=6), top('202', 40, -8, up=16, right=True, flip=True, a=2.8, t=7)],
    foot=[foot('62', 62, -8, down=10), foot('69', 58, -8, down=14, right=True)],
    hero=[pc('195', 50, 50, 68)],
    corner=('69', '193'),
    gaps=[gap(pc('64', 46, 50, 50)), gap(pc('62', 52, 50, 50)), gap(pc('193', 40, 28, 50), pc('171', 38, 72, 50)), gap(pc('195', 44, 50, 50))],
    fx=fx('fall', parts(51, 8), n=14, s=(10, 20), d=(9, 16))),
'boho-pampas': dict(
    name=('Boho Pampas', 'Boho Pampas'),
    desc=('Pampas dan bunga kering dalam warna tanah, dengan tirai keemasan di atas.', 'Pampas and dried flowers in earth tones, under a golden curtain.'),
    tone='light', tags=['bungakering', 'cokelat', 'pampas', 'boho'],
    sky='linear-gradient(180deg,#F8EEE0 0,#F2E0CB 55%,#E8CDB2 100%)', main='#553727', accent='#B8693F',
    top=[top('283', 108, -4, up=50, a=1.4, t=9)],
    foot=[foot('165', 46, -4, down=6, a=2.4), foot('167', 22, 34, down=4, a=3, t=6), foot('164', 28, 0, down=4, right=True, a=2.6)],
    hero=[pc('190', 70, 50, 68)],
    corner=('161', '159'),
    gaps=[gap(pc('190', 56, 50, 50), h=62), gap(pc('160', 46, 30, 50), pc('165', 40, 72, 50)), gap(pc('206', 34, 50, 50), h=64), gap(pc('185', 40, 30, 50), pc('179', 38, 70, 50))],
    fx=fx('float', n=12, s=(5, 10), d=(8, 14), o=(.5, .9), dot='#E7C58F')),
'ladang-matahari': dict(
    name=('Ladang Matahari', 'Sunflower Field'),
    desc=('Bunga matahari di bawah matahari cat air yang berputar, dengan kelopak kuning yang terbang.', 'Sunflowers under a turning watercolour sun, with yellow petals on the wind.'),
    tone='light', tags=['kuning', 'bungamatahari', 'matahari', 'ceria'],
    sky='linear-gradient(180deg,#FFF9E0 0,#FFF2C6 52%,#FFE49A 100%)', main='#4E3A12', accent='#D99A12',
    far=[far('109', 36, 92, 7, d=-.12, move='turn', t=120)],
    foot=[foot('253', 110, -5, down=14)],
    hero=[pc('55', 70, 52, 68)],
    corner=('187', '192'),
    gaps=[gap(pc('265', 76, 50, 50), h=58), gap(pc('256', 32, 26, 50), pc('186', 40, 70, 50)), gap(pc('266', 62, 50, 50), h=62), gap(pc('187', 38, 28, 50), pc('192', 40, 72, 50))],
    fx=fx('fall', parts(55, 4), n=11, s=(14, 26), d=(9, 16))),
'lili-marun': dict(
    name=('Lili Marun', 'Maroon Lily'),
    desc=('Lili merah gelap dan mawar tekan di atas marun pekat, dengan tirai dan serpihan emas.', 'Dark red lilies and pressed roses on deep maroon, with a curtain and flecks of gold.'),
    tone='dark', tags=['merah', 'marun', 'lili', 'emas'],
    sky='linear-gradient(180deg,#22090F 0,#34111A 55%,#441823 100%)', main='#4A1620', accent='#C9A24B',
    far=[far('35', 70, 86, 52, d=.2, move='sway', a=2, o=.55)],
    top=[top('283', 108, -4, up=48, a=1.2, t=9)],
    foot=[foot('184', 46, -12, down=30, a=1), foot('177', 44, -12, down=30, right=True, a=1)],
    hero=[pc('26', 62, 50, 70)],
    corner=('184', '177'),
    gaps=[gap(pc('26', 52, 50, 50)), gap(pc('169', 40, 28, 50), pc('185', 40, 72, 50)), gap(pc('35', 46, 50, 50)), gap(pc('296', 82, 50, 50), h=20)],
    fx=fx('fall', EMAS, n=12, s=(8, 18), d=(8, 15))),
'gerbera-ceria': dict(
    name=('Gerbera Ceria', 'Cheerful Gerbera'),
    desc=('Gerbera besar yang berputar pelan di sudut layar, dahlia, kosmos, dan kelopak merah muda.', 'Large gerberas turning slowly at the edges, dahlia, cosmos and pink petals.'),
    tone='light', tags=['merahmuda', 'gerbera', 'ceria', 'kelopak'],
    sky='linear-gradient(180deg,#FFF5F6 0,#FFE9EA 52%,#FFDCCF 100%)', main='#5A2A36', accent='#E0527A',
    far=[far('1', 70, 100, 3, d=.24, move='turn', t=110), far('2', 78, 4, 88, d=.12, move='turn', t=150)],
    hero=[pc('81', 56, 50, 68)],
    corner=('61', '64'),
    gaps=[gap(pc('1', 46, 50, 50)), gap(pc('64', 42, 28, 50), pc('61', 42, 72, 50)), gap(pc('2', 46, 50, 50)), gap(pc('33', 46, 50, 50))],
    fx=fx('fall', PETAL, n=11, s=(14, 28))),
'pesta-topeng': dict(
    name=('Pesta Topeng', 'Masquerade'),
    desc=('Topeng emas, permata, dan kolibri hitam emas di malam ungu tua bertabur emas.', 'A gold mask, a jewel and a black and gold hummingbird in a deep violet night of gold dust.'),
    tone='dark', tags=['emas', 'ungu', 'topeng', 'mewah'],
    sky='linear-gradient(180deg,#110D1B 0,#1B1430 55%,#271B42 100%)', main='#231A3D', accent='#C9A24B',
    far=[far('154', 54, 50, 60, d=.14, move='turn', t=90, o=.35)],
    top=[top('288', 74, 13, up=18, a=.6)],
    foot=[foot('293', 62, 19, down=10, a=.6)],
    hero=[pc('145', 66, 50, 70)],
    corner=('142r', '301v'),
    gaps=[gap(pc('145', 56, 50, 50), h=44), gap(pc('153', 44, 50, 50)), gap(pc('303', 38, 50, 50)), gap(pc('296', 82, 50, 50), h=20)],
    fx=fx('fall', EMAS, n=15, s=(8, 18), d=(8, 15)),
    fly=[fly('146', 86, 36, 22, flip=True)]),
'sakura-malam': dict(
    name=('Sakura Malam', 'Cherry Blossom Night'),
    desc=('Sakura di langit malam biru tua, lampion yang bergoyang, dan kelopak yang berguguran.', 'Cherry blossom against a deep blue night, a swaying lantern and falling petals.'),
    tone='dark', tags=['malam', 'biru', 'sakura', 'lampion'],
    sky='linear-gradient(180deg,#10162C 0,#1B2042 52%,#2E2750 100%)', main='#1E2346', accent='#E27FA2',
    top=[top('83', 74, -6, up=6, right=True)],
    foot=[foot('74', 104, -4, down=6)],
    hero=[pc('98', 54, 50, 70)],
    corner=('77', '79'),
    gaps=[gap(pc('71', 58, 50, 50), h=62), gap(pc('105', 80, 50, 50), h=40), gap(pc('72', 70, 50, 50), h=58), gap(pc('98', 44, 50, 50), h=64)],
    fx=fx('fall', SAKURA, n=16, s=(10, 22), d=(8, 15))),
# ---- second batch (27 Nov 2026, night): unused pictures, new pairings, night versions, colour versions ----
'lili-stargazer': dict(
    name=('Lili Stargazer', 'Stargazer Lilies'),
    desc=('Lili stargazer berbintik dalam merah muda tua, dengan kelopak yang jatuh perlahan.', 'Speckled stargazer lilies in deep pink, with petals falling slowly.'),
    tone='light', tags=['merahmuda', 'lili', 'stargazer', 'kelopak'],
    sky='linear-gradient(180deg,#FFF3F6 0,#FBDFE8 52%,#F3C3D4 100%)', main='#5A1F3A', accent='#C8386E',
    top=[top('286', 46, -6, up=10, right=True, a=2)],
    foot=[foot('46', 60, -10, down=20), foot('3', 64, -10, down=24, right=True)],
    hero=[pc('3', 74, 50, 68)],
    corner=('9', '48'),
    gaps=[gap(pc('57', 52, 50, 50)), gap(pc('46', 54, 50, 50)), gap(pc('9', 42, 28, 50), pc('13', 44, 72, 52)), gap(pc('48', 44, 50, 50), h=62)],
    fx=fx('fall', PETAL, n=11, s=(16, 30))),
'lili-cat-air': dict(
    name=('Lili Cat Air', 'Watercolour Lilies'),
    desc=('Lili merah muda bersapuan cat air di atas padang bunga pastel.', 'Pink lilies in soft watercolour over a pastel flower meadow.'),
    tone='light', tags=['catair', 'merahmuda', 'lili', 'lembut'],
    sky='linear-gradient(180deg,#FFFAF7 0,#FDEFEF 52%,#F8E1E6 100%)', main='#5B3340', accent='#D46A8C',
    top=[top('209', 96, 2, up=4, a=2.2)],
    foot=[foot('242', 110, -5, down=20)],
    hero=[pc('44', 62, 50, 68)],
    corner=('6', '18'),
    gaps=[gap(pc('15', 56, 50, 50)), gap(pc('14', 44, 28, 50), pc('27', 44, 72, 52)), gap(pc('8', 54, 50, 50)), gap(pc('29', 42, 28, 50), pc('36', 46, 72, 50))],
    fx=fx('fall', PETAL, n=10, s=(14, 28))),
'bingkai-emas': dict(
    name=('Bingkai Emas', 'Gold Frame'),
    desc=('Bingkai emas tipis yang tetap di tempat saat digulir, lili putih, dan kilau emas yang melayang.', 'A fine gold frame that stays in place as you scroll, a white lily and drifting gold light.'),
    tone='light', tags=['emas', 'gading', 'bingkai', 'formal'],
    sky='linear-gradient(180deg,#FFFDF7 0,#FBF5E6 55%,#F5EAD0 100%)', main='#46381E', accent='#B08A2E',
    far=[far('297', 94, 50, 50, d=0)],
    hero=[pc('16', 52, 50, 68)],
    corner=('295', '298'),
    gaps=[gap(pc('296', 80, 50, 50), h=20), gap(pc('205', 44, 50, 50)), gap(pc('141', 50, 50, 50)), gap(pc('303', 36, 50, 50))],
    fx=fx('float', n=12, s=(5, 10), d=(7, 13), o=(.5, .95), dot='#C9A24B')),
'segel-pita': dict(
    name=('Segel Pita', 'Ribbon Seal'),
    desc=('Segel lilin merah muda berpita di sampul, mawar kecil di sudut kartu, dan peony yang mekar.', 'A pink wax seal with a bow on the cover, small roses on the card corners and peonies in bloom.'),
    tone='light', tags=['merahmuda', 'segel', 'mawar', 'manis'],
    sky='linear-gradient(180deg,#FFF7F5 0,#FBE9E6 52%,#F3D3D0 100%)', main='#5A3338', accent='#C97886',
    top=[top('235', 60, -8, up=10), top('234', 60, -8, up=10, right=True)],
    foot=[foot('21', 92, 4, down=24)],
    hero=[pc('32', 44, 50, 70)],
    corner=('194', '196h'),
    gaps=[gap(pc('41', 46, 50, 50)), gap(pc('33', 50, 50, 50)), gap(pc('32', 34, 50, 50)), gap(pc('45', 52, 50, 50))],
    fx=fx('fall', PETAL, n=9, s=(14, 26))),
'sahabat-rimba': dict(
    name=('Sahabat Rimba', 'Forest Friends'),
    desc=('Rusa, beruang, serigala, dan berang-berang di hutan pinus; untuk undangan yang ceria.', 'A moose, a bear, a wolf and a beaver in a pine forest; for a playful invitation.'),
    tone='light', tags=['ilustrasi', 'hijau', 'hewan', 'ceria'],
    sky='linear-gradient(180deg,#CFE8F3 0,#E9F4EA 50%,#F6F3D6 100%)', main='#2B4630', accent='#B4672E',
    far=[far('109', 26, 90, 8, d=-.12, move='turn', t=150), far('136', 130, 46, 62, d=.12)],
    foot=[foot('112', 118, -9, down=24, d=.5)],
    hero=[pc('121', 40, 50, 74)],
    corner=None,
    gaps=[gap(pc('120', 50, 50, 50), h=46), gap(pc('124', 36, 30, 52), pc('128', 26, 72, 54), h=40), gap(pc('129', 44, 50, 50), h=58), gap(pc('122', 52, 50, 50), h=58)],
    fx=fx('fall', DAUN, n=7, s=(18, 30), d=(11, 18)),
    fly=[fly('128', 60, 70, 24, dy=0)]),
'amarilis': dict(
    name=('Amarilis', 'Amaryllis'),
    desc=('Amarilis merah bergaris putih dan alstroemeria, di atas padang bunga kecil.', 'Red and white striped amaryllis and alstroemeria over a meadow of small flowers.'),
    tone='light', tags=['merah', 'amarilis', 'berani', 'kelopak'],
    sky='linear-gradient(180deg,#FFF8F4 0,#FDEDE8 52%,#F7D9D2 100%)', main='#5A2222', accent='#C43A3A',
    top=[top('213', 30, 2, up=10, a=2.6, t=6), top('213', 26, 2, up=16, right=True, flip=True, a=3, t=7)],
    foot=[foot('263', 110, -5, down=14)],
    hero=[pc('67', 64, 50, 70)],
    corner=('67', '189'),
    gaps=[gap(pc('60', 34, 50, 50), h=70), gap(pc('28', 48, 50, 50)), gap(pc('67', 54, 50, 50), h=44), gap(pc('57', 50, 50, 50))],
    fx=fx('fall', PETAL, n=9, s=(14, 26))),
'kala-lili': dict(
    name=('Kala Lili', 'Calla Lily'),
    desc=('Kala lili putih yang ramping, daun hijau di atas, dan bunga putih yang tenang.', 'Slender white calla lilies, green leaves above and calm white flowers.'),
    tone='light', tags=['putih', 'hijau', 'kalalili', 'minimalis'],
    sky='linear-gradient(180deg,#F1F6EE 0,#F8FAF3 52%,#FBF9EE 100%)', main='#30422F', accent='#7A9A5E',
    top=[top('271', 108, -4, up=30)],
    foot=[foot('254', 110, -5, down=22)],
    hero=[pc('76', 40, 50, 70)],
    corner=('188', '162'),
    gaps=[gap(pc('258', 42, 50, 50)), gap(pc('248', 44, 50, 50)), gap(pc('76', 34, 50, 50), h=72), gap(pc('205', 44, 50, 50))],
    fx=fx('rise', n=11, s=(5, 10), d=(11, 18), o=(.5, 1), dot='#FFFFFF')),
'kupu-apel': dict(
    name=('Kupu-Kupu Bunga Apel', 'Butterfly on Apple Blossom'),
    desc=('Kupu-kupu jingga di atas karangan bunga apel, dengan kelopak merah muda yang jatuh.', 'An orange butterfly on a wreath of apple blossom, with pink petals falling.'),
    tone='light', tags=['merahmuda', 'kupukupu', 'bungaapel', 'musimsemi'],
    sky='linear-gradient(180deg,#F6FAEF 0,#FDF3F1 52%,#FBE3E6 100%)', main='#4E3A2E', accent='#D9763A',
    top=[top('274v', 58, -6, up=4), top('274v', 54, -6, up=8, right=True, flip=True)],
    foot=[foot('267', 110, -5, down=14)],
    hero=[pc('264', 58, 50, 70)],
    corner=('248', '20'),
    gaps=[gap(pc('264', 48, 50, 50)), gap(pc('19', 42, 28, 50), pc('248', 42, 72, 52)), gap(pc('21', 60, 50, 50), h=44), gap(pc('20', 46, 50, 50))],
    fx=fx('fall', PETAL, n=9, s=(14, 26))),
'semak-biru': dict(
    name=('Semak Biru', 'Blue Blossom'),
    desc=('Semak bunga biru, hortensia dan pansy biru, di bawah tirai daun.', 'A bush of blue blossom, blue hydrangea and pansies under a curtain of leaves.'),
    tone='light', tags=['biru', 'hortensia', 'sejuk', 'taman'],
    sky='linear-gradient(180deg,#E6F0FA 0,#F1F6FB 52%,#F6F4EC 100%)', main='#24405C', accent='#3F82C0',
    top=[top('237', 108, -4, up=40)],
    foot=[foot('247', 110, -5, down=20)],
    hero=[pc('275', 62, 50, 70)],
    corner=('174', '195'),
    gaps=[gap(pc('180', 42, 50, 50)), gap(pc('174', 38, 28, 50), pc('193', 40, 72, 50)), gap(pc('275', 54, 50, 50), h=44), gap(pc('195', 42, 50, 50))],
    fx=fx('float', n=11, s=(5, 10), d=(8, 14), o=(.6, 1), dot='#FFFFFF')),
'taman-sakura': dict(
    name=('Taman Sakura', 'Cherry Garden'),
    desc=('Pohon merah muda seperti kapas, awan kelopak, dan gunung di kejauhan dalam lingkaran cat air.', 'A pink cotton-candy tree, a cloud of petals and a far mountain in a watercolour circle.'),
    tone='light', tags=['catair', 'merahmuda', 'sakura', 'pohon'],
    sky='linear-gradient(180deg,#FDF6FA 0,#FBE8F0 52%,#F5D5E3 100%)', main='#5A2C45', accent='#D95B8E',
    far=[far('102', 56, 80, 62, d=.12, move='sway', a=1.2)],
    top=[top('83', 74, -6, up=6, right=True)],
    foot=[foot('73', 110, -5, down=10)],
    hero=[pc('95', 56, 46, 70)],
    corner=('77', '88'),
    gaps=[gap(pc('89', 60, 50, 50)), gap(pc('101', 40, 50, 50), h=44), gap(pc('102', 40, 50, 50), h=62), gap(pc('90', 36, 50, 50))],
    fx=fx('fall', SAKURA, n=15, s=(10, 20), d=(8, 15))),
'macan-emas': dict(
    name=('Macan Emas', 'Golden Leopard'),
    desc=('Macan tutul emas di atas hitam pekat, tirai emas, dan serpihan emas yang jatuh.', 'A gold leopard on deep black, a gold curtain and falling flecks of gold.'),
    tone='dark', tags=['emas', 'hitam', 'macan', 'berani'],
    sky='linear-gradient(180deg,#0D0B08 0,#17130C 55%,#221B10 100%)', main='#231C10', accent='#C9A24B',
    far=[far('148', 84, 50, 56, d=.14, move='turn', t=150, o=.3)],
    top=[top('283', 108, -4, up=48, a=1.2, t=9)],
    foot=[foot('288', 64, 18, down=12, a=.6)],
    hero=[pc('147', 60, 50, 70)],
    corner=('295', '298'),
    gaps=[gap(pc('147', 50, 50, 50)), gap(pc('154', 34, 50, 50)), gap(pc('141', 52, 50, 50)), gap(pc('296', 82, 50, 50), h=20)],
    fx=fx('fall', EMAS, n=13, s=(8, 18), d=(8, 15)),
    fly=[fly('158', 80, 36, 24)]),
'lili-emas': dict(
    name=('Lili Emas', 'Lilies and Gold'),
    desc=('Lili putih dengan ukiran emas di atas dan bawah, di atas kertas gading.', 'White lilies with carved gold above and below, on ivory paper.'),
    tone='light', tags=['emas', 'putih', 'lili', 'klasik'],
    sky='linear-gradient(180deg,#FFFCF4 0,#FAF3E2 55%,#F2E6C8 100%)', main='#4A3C20', accent='#B8902F',
    top=[top('288', 72, 14, up=18, a=.6)],
    foot=[foot('293', 60, 20, down=8, a=.6)],
    hero=[pc('52', 60, 50, 68)],
    corner=('301v', '302h'),
    gaps=[gap(pc('56', 58, 50, 50)), gap(pc('296', 80, 50, 50), h=20), gap(pc('25', 50, 50, 50)), gap(pc('49', 50, 50, 50))],
    fx=fx('float', n=12, s=(5, 10), d=(7, 13), o=(.5, .95), dot='#C9A24B')),
'tropis-emas': dict(
    name=('Tropis Emas', 'Tropical Gold'),
    desc=('Monstera dan palem di malam hijau tua, dengan kolibri emas yang terbang melintas.', 'Monstera and palm in a deep green night, with gold hummingbirds flying across.'),
    tone='dark', tags=['emas', 'hijau', 'tropis', 'malam'],
    sky='linear-gradient(180deg,#081A14 0,#0C261C 55%,#123325 100%)', main='#10301F', accent='#C9A24B',
    far=[far('216', 70, 94, 52, d=.22, move='sway', a=2.4, o=.8), far('223', 66, 8, 64, d=.14, move='sway', a=1.8, o=.7)],
    top=[top('227', 84, -16, up=18, a=2.6)],
    foot=[foot('225', 74, -12, down=12), foot('231', 60, -10, down=10, right=True)],
    hero=[pc('151', 56, 50, 72)],
    corner=('236', '217'),
    gaps=[gap(pc('222', 46, 50, 50)), gap(pc('158', 40, 50, 50)), gap(pc('221', 56, 50, 50), h=62), gap(pc('150', 30, 50, 50), h=62)],
    fx=fx('fall', EMAS, n=12, s=(8, 18), d=(8, 15)),
    fly=[fly('156', 70, 38, 20), fly('157', 56, 60, 26, flip=True)]),
'wisteria-gapura': dict(
    name=('Gapura Wisteria', 'Wisteria Arch'),
    desc=('Gapura mawar di bawah wisteria ungu yang menjuntai, dengan kelopak ungu yang melayang.', 'The rose arch under hanging purple wisteria, with violet petals drifting.'),
    tone='light', tags=['ungu', 'wisteria', 'gapura', 'romantis'],
    sky='linear-gradient(180deg,#F3ECFB 0,#FAF3F8 52%,#FBEBE6 100%)', main='#43305C', accent='#9366C4',
    top=[top('281', 110, -5, up=8)],
    foot=[foot('265', 110, -5, down=20)],
    hero=[pc('273', 84, 50, 68, sp=-.25)],
    corner=('270', '62'),
    gaps=[gap(pc('287', 48, 50, 50), h=62), gap(pc('269', 44, 50, 50), h=64), gap(pc('280', 38, 50, 50), h=58), gap(pc('278', 66, 50, 50))],
    fx=fx('fall', UNGU, n=12, s=(10, 20), d=(9, 16))),
'herbarium-malam': dict(
    name=('Herbarium Malam', 'Herbarium by Night'),
    desc=('Bunga kering di atas biru arang, dengan titik cahaya hangat yang melayang.', 'Dried flowers on charcoal blue, with warm specks of light drifting.'),
    tone='dark', tags=['bungakering', 'malam', 'arang', 'hangat'],
    sky='linear-gradient(180deg,#14171D 0,#1B2029 55%,#242A35 100%)', main='#222835', accent='#D2A566',
    far=[far('159', 36, 18, 60, d=.2, move='sway', a=2), far('181', 38, 84, 54, d=.1, move='sway', a=1.6)],
    foot=[foot('164', 26, 2, down=4, a=2.4), foot('167', 22, 26, down=4, a=3, t=6), foot('161', 26, 2, down=4, right=True, a=2.6), foot('160', 40, 22, down=6, right=True, a=2, t=9)],
    hero=[pc('190', 64, 50, 68)],
    corner=('163', '176'),
    gaps=[gap(pc('166', 50, 50, 50)), gap(pc('173', 36, 28, 50), pc('179', 38, 72, 50)), gap(pc('183', 32, 30, 50), pc('182', 26, 70, 50)), gap(pc('165', 46, 50, 50), h=62)],
    fx=fx('float', n=13, s=(5, 10), d=(8, 14), o=(.5, .95), dot='#F0C98A')),
'padang-malam': dict(
    name=('Padang Malam', 'Meadow at Night'),
    desc=('Padang bunga liar di bawah langit malam biru, dengan kunang-kunang yang naik perlahan.', 'A wildflower meadow under a blue night sky, with fireflies rising slowly.'),
    tone='dark', tags=['malam', 'biru', 'padang', 'kunangkunang'],
    sky='linear-gradient(180deg,#0C1530 0,#152247 55%,#22305A 100%)', main='#18254A', accent='#E3B94F',
    top=[top('199', 104, -2, up=14)],
    foot=[foot('244', 110, -5, down=22)],
    hero=[pc('251', 56, 50, 68)],
    corner=('240', '249'),
    gaps=[gap(pc('247', 84, 50, 50), h=62), gap(pc('266', 62, 50, 50), h=62), gap(pc('260', 80, 50, 50), h=58), gap(pc('246', 86, 50, 50), h=60)],
    fx=fx('rise', n=16, s=(5, 11), d=(10, 18), o=(.6, 1), dot='#F6DC6E')),
'kebun-malam': dict(
    name=('Kebun Malam', 'Garden at Night'),
    desc=('Tirai sulur dan hortensia putih di malam hijau tua, diterangi kunang-kunang.', 'A curtain of vines and white hydrangea in a deep green night, lit by fireflies.'),
    tone='dark', tags=['malam', 'hijau', 'sulur', 'kunangkunang'],
    sky='linear-gradient(180deg,#07140F 0,#0D2018 55%,#142C21 100%)', main='#112A1D', accent='#C8D46A',
    far=[far('200', 112, 50, 50, d=.1, move='breathe', o=.5)],
    top=[top('198', 108, -4, up=20)],
    foot=[foot('233', 110, -5, down=28)],
    hero=[pc('203', 46, 50, 72)],
    corner=('204', '213'),
    gaps=[gap(pc('279', 92, 50, 50), h=52), gap(pc('205', 44, 50, 50)), gap(pc('202', 60, 50, 50), h=64), gap(pc('203', 40, 50, 50))],
    fx=fx('rise', n=16, s=(5, 11), d=(10, 18), o=(.6, 1), dot='#F2E27A')),
'lili-lembayung': dict(
    name=('Lili Lembayung', 'Violet Lilies'),
    desc=('Lili Merona dalam warna lembayung: lili ungu, daun eukaliptus, dan kelopak ungu yang jatuh.', 'Blushing Lilies in violet: purple lilies, eucalyptus and violet petals falling.'),
    tone='light', tags=['catair', 'ungu', 'lili', 'kelopak'],
    sky='linear-gradient(180deg,#F8F4FE 0,#EFE8FB 52%,#E2D7F6 100%)', main='#3D2E5E', accent='#8A62C8',
    top=[top('235', 64, -6, up=8), top('234', 64, -6, up=8, right=True)],
    foot=[foot('39cu', 112, -6, down=34)],
    hero=[pc('4cu', 78, 50, 66)],
    corner=('5cu', '7cu'),
    gaps=[gap(pc('31cu', 56, 50, 50)), gap(pc('37cu', 46, 24, 52), pc('38', 62, 70, 50)), gap(pc('17cu', 54, 50, 50)), gap(pc('11cu', 44, 26, 50), pc('12cu', 46, 74, 52))],
    fx=fx('fall', ['47cu', '47hcu'], n=11, s=(16, 30))),
'lili-biru': dict(
    name=('Lili Biru', 'Blue Lilies'),
    desc=('Lili Merona dalam biru lembut: lili biru, daun eukaliptus, dan kelopak biru yang jatuh.', 'Blushing Lilies in soft blue: blue lilies, eucalyptus and blue petals falling.'),
    tone='light', tags=['catair', 'biru', 'lili', 'kelopak'],
    sky='linear-gradient(180deg,#F3F8FE 0,#E6F0FB 52%,#D3E3F6 100%)', main='#27405E', accent='#4E86C8',
    top=[top('235', 64, -6, up=8), top('234', 64, -6, up=8, right=True)],
    foot=[foot('39cb', 112, -6, down=34)],
    hero=[pc('4cb', 78, 50, 66)],
    corner=('5cb', '7cb'),
    gaps=[gap(pc('31cb', 56, 50, 50)), gap(pc('37cb', 46, 24, 52), pc('38', 62, 70, 50)), gap(pc('17cb', 54, 50, 50)), gap(pc('11cb', 44, 26, 50), pc('12cb', 46, 74, 52))],
    fx=fx('fall', ['47cb', '47hcb'], n=11, s=(16, 30))),
'lili-kuning': dict(
    name=('Lili Kuning', 'Yellow Lilies'),
    desc=('Lili Merona dalam kuning hangat: lili kuning, daun eukaliptus, dan kelopak kuning yang jatuh.', 'Blushing Lilies in warm yellow: yellow lilies, eucalyptus and yellow petals falling.'),
    tone='light', tags=['catair', 'kuning', 'lili', 'kelopak'],
    sky='linear-gradient(180deg,#FFFDF2 0,#FDF6DA 52%,#F8E9B4 100%)', main='#4E3C14', accent='#C9981E',
    top=[top('235', 64, -6, up=8), top('234', 64, -6, up=8, right=True)],
    foot=[foot('39cy', 112, -6, down=34)],
    hero=[pc('4cy', 78, 50, 66)],
    corner=('5cy', '7cy'),
    gaps=[gap(pc('31cy', 56, 50, 50)), gap(pc('37cy', 46, 24, 52), pc('49', 50, 70, 50)), gap(pc('17cy', 54, 50, 50)), gap(pc('11cy', 44, 26, 50), pc('12cy', 46, 74, 52))],
    fx=fx('fall', ['47cy', '47hcy'], n=11, s=(16, 30))),
'peoni-putih': dict(
    name=('Peoni Putih', 'White Peonies'),
    desc=('Peoni Merona dalam putih: peony putih, eukaliptus di atas, dan kelopak putih yang jatuh.', 'Blushing Peonies in white: white peonies, eucalyptus above and white petals falling.'),
    tone='light', tags=['catair', 'putih', 'peony', 'klasik'],
    sky='linear-gradient(180deg,#E2EADB 0,#D5E0CC 52%,#C4D3BA 100%)', main='#3C4634', accent='#869A66',
    top=[top('234', 66, -6, up=8, right=True), top('235', 60, -8, up=10)],
    foot=[foot('21cw', 96, 2, down=24), foot('34cw', 44, -10, down=22, right=True)],
    hero=[pc('40cw', 60, 50, 68)],
    corner=('34cw', '30'),
    gaps=[gap(pc('33cw', 52, 50, 50)), gap(pc('45', 54, 50, 50)), gap(pc('19cw', 42, 28, 50), pc('41cw', 42, 72, 52)), gap(pc('20cw', 50, 50, 50))],
    fx=fx('fall', ['47cw', '47hcw'], n=11, s=(16, 30))),
}

FAMILY = ('hidup', 'Lukisan hidup', 'Living pictures',
          'Potongan gambar yang terus bergerak: kelopak jatuh, daun bergoyang, dan lapisan yang bergeser saat digulir.',
          'Cut-out pictures that keep moving: petals fall, leaves sway and layers slide as you scroll.')

# ---------- pieces ----------
def keys_of(T):
    """Every piece a theme uses, with the widest size (px) it is shown at."""
    need = {}
    def add(k, px): need[k] = max(need.get(k, 0), px)
    for p in T.get('far') or []: add(p['k'], min(640, int(480 * p['w'] / 100 * 1.3)))
    for p in T.get('top') or []: add(p['k'], min(640, int(480 * p['w'] / 100 * 1.3)))
    for p in T.get('foot') or []: add(p['k'], min(640, int(480 * p['w'] / 100 * 1.3)))
    for p in T.get('hero') or []: add(p['k'], min(600, int(480 * p['w'] / 100 * 1.4)))
    for g in T.get('gaps') or []:
        for p in g['p']: add(p['k'], min(520, int(480 * p['w'] / 100 * 1.25)))
    for k in (T.get('corner') or ()): add(k, 260)
    for k in (T.get('fx') or {}).get('src') or []: add(k, 64)
    for p in T.get('fly') or []: add(p['k'], int(p['px'] * 2.2))
    return need

def all_keys():
    need = {}
    for T in THEMES.values():
        for k, px in keys_of(T).items(): need[k] = max(need.get(k, 0), px)
    return need

def cut(src, key):
    """Open piece `key` from the folder of originals: trimmed to what is drawn, turned as its letters say."""
    from PIL import Image
    import numpy as np
    Image.MAX_IMAGE_PIXELS = None
    m = re.match(r'^(\d+)(?:p(\d+))?([vhr]*)(?:c([ubyw]))?$', key)
    n, part, ops, col = int(m.group(1)), m.group(2), m.group(3), m.group(4)
    im = Image.open(os.path.join(src, '%d.png' % n)).convert('RGBA')
    a = np.array(im)[..., 3]
    if part is not None:
        from scipy import ndimage
        small = np.array(im.resize((1000, 1000)))[..., 3] > 40
        small = ndimage.binary_dilation(small, iterations=3)
        lab, cnt = ndimage.label(small)
        boxes = ndimage.find_objects(lab)
        sizes = sorted(((int((lab[b] == i + 1).sum()), i) for i, b in enumerate(boxes)), reverse=True)
        idx = sizes[int(part) % len(sizes)][1]
        ys, xs = boxes[idx]
        box = (max(0, xs.start * 4 - 8), max(0, ys.start * 4 - 8), min(4000, xs.stop * 4 + 8), min(4000, ys.stop * 4 + 8))
        im = im.crop(box)
        a = np.array(im)[..., 3]
    ys, xs = np.where(a > 12)
    im = im.crop((int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1))
    if 'v' in ops: im = im.transpose(Image.FLIP_TOP_BOTTOM)
    if 'h' in ops: im = im.transpose(Image.FLIP_LEFT_RIGHT)
    if 'r' in ops: im = im.transpose(Image.ROTATE_180)
    if col:
        # recolour only what is pink or red (petals); greens, yellows and browns keep their own colour
        al = im.getchannel('A')
        hsv = np.array(im.convert('RGB').convert('HSV')).astype(np.int32)
        h, sa, v = hsv[..., 0], hsv[..., 1], hsv[..., 2]
        pink = ((h >= 200) | (h <= 18)) & (sa > 18)
        if col == 'w':
            sa = np.where(pink, sa * .1, sa); v = np.where(pink, v + (255 - v) * .4, v)
        else:
            T = {'u': 191, 'b': 152, 'y': 33}[col]
            h = np.where(pink, (h - 240 + T) % 256, h)
            if col == 'y': v = np.where(pink, v + (255 - v) * .25, v)
            if col == 'b': sa = np.where(pink, sa * .85, sa)
        out = Image.fromarray(np.stack([h, sa, v], -1).clip(0, 255).astype('uint8'), 'HSV').convert('RGB')
        im = Image.merge('RGBA', (*out.split(), al))
    return im

def assets(src):
    from PIL import Image
    os.makedirs(OUT, exist_ok=True)
    need, ratios, total = all_keys(), {}, 0
    for f in os.listdir(OUT):
        if re.match(r'^h\d', f): os.remove(os.path.join(OUT, f))
    for key in sorted(need):
        im = cut(src, key)
        px = need[key]
        w = min(px, im.width)
        h = max(1, round(im.height * w / im.width))
        if h > 1100: w = max(1, round(w * 1100 / h)); h = 1100
        im = im.resize((max(1, w), h), Image.LANCZOS)
        path = os.path.join(OUT, 'h%s.webp' % key)
        im.save(path, 'WEBP', quality=64, method=6, alpha_quality=72)
        ratios['h' + key] = round(im.width / im.height, 4)
        total += os.path.getsize(path)
    json.dump(ratios, open(os.path.join(OUT, 'ratios.json'), 'w'), sort_keys=True)
    print('%d pieces, %.1f MB' % (len(need), total / 1e6))

# ---------- colours ----------
def rgb(h): h = h.lstrip('#'); return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))
def hexc(c): return '#%02X%02X%02X' % tuple(max(0, min(255, round(v))) for v in c)
def mix(a, b, t): a, b = rgb(a), rgb(b); return hexc(tuple(a[i] + (b[i] - a[i]) * t for i in range(3)))
def palette(T):
    main, acc = T['main'], T['accent']
    r, g, b = rgb(main)
    stops = re.findall(r'#[0-9A-Fa-f]{6}', T['sky'])
    return dict(tone=stops[len(stops) // 2], main=main, main_rgb='%d,%d,%d' % (r, g, b), accent=acc, accent_rgb='%d,%d,%d' % rgb(acc),
                soft=mix(acc, '#FFFFFF', .55), wash=mix(acc, '#FFFFFF', .84), paper=mix(acc, '#FFFFFF', .965), paper2=mix(acc, '#FFFFFF', .9),
                deep=mix(main, '#000000', .45))

# ---------- writing the lists ----------
def between(path, name, body, open_='/* gen:%s */', close='/* /gen:%s */'):
    s = open(path, encoding='utf-8').read()
    a, b = open_ % name, close % name
    if a not in s: raise SystemExit('marker %s missing in %s' % (a, path))
    i, j = s.index(a) + len(a), s.index(b)
    open(path, 'w', encoding='utf-8').write(s[:i] + '\n' + body + '\n' + s[j:])

def js(s): return json.dumps(s, ensure_ascii=False)
def sq(s): return "'" + s.replace("'", "''") + "'"

def clean(o):
    if isinstance(o, dict): return {k: clean(v) for k, v in o.items() if v is not None and v is not False and not (k in ('flip', 'right') and not v)}
    if isinstance(o, (list, tuple)): return [clean(v) for v in o]
    return o

def write():
    ratios = json.load(open(os.path.join(OUT, 'ratios.json')))
    data = {}
    for slug, T in THEMES.items():
        t = {}
        for p in T.get('top') or []:
            vis = p['w'] / ratios['h' + p['k']]
            if vis * (1 - p['up'] / 100) > 35: p['up'] = round(100 * (1 - 35 / vis))
        for part in ('far', 'top', 'foot', 'hero', 'fly'):
            if T.get(part): t[part] = [dict(clean(p), k='h' + p['k']) for p in T[part]]
        if T.get('gaps'): t['gaps'] = [dict(p=[dict(clean(p), k='h' + p['k']) for p in g['p']], **({'h': g['h']} if g.get('h') else {})) for g in T['gaps']]
        if T.get('fx'):
            f = clean(T['fx']); f['src'] = ['h' + k for k in T['fx']['src']]; t['fx'] = f
        t['corner'] = 1 if T.get('corner') else 0
        data[slug] = t
    used = set(re.findall(r'"(h\d+[a-z0-9]*)"', json.dumps(data)))
    out = ('/* Written by tools/hidup.py: the living Dasar themes and their pieces. Do not edit by hand. */\n'
           'window.NAWALA_HIDUP = ' + json.dumps({'r': {k: v for k, v in ratios.items() if k in used}, 'themes': data}, separators=(',', ':')) + ';\n')
    open(os.path.join(ROOT, 'undangan', 'hidup-data.js'), 'w').write(out)

    css = []
    for slug, T in THEMES.items():
        p = palette(T)
        c = T.get('corner')
        bunga = ('--bunga:url("../assets/img/hidup/h%s.webp");--bunga2:url("../assets/img/hidup/h%s.webp");' % c) if c else ''
        css.append('[data-theme="%s"]{--plate:url("../assets/img/hidup/plate-%s.webp");--hd-sky:%s;%s--tone:%s;--main:%s;--main-rgb:%s;--accent:%s;--accent-rgb:%s;--accent-soft:%s;--accent-wash:%s;--paper:%s;--paper-2:%s;--mist:%s;--deep:%s}'
                   % (slug, slug, T['sky'], bunga, p['tone'], p['main'], p['main_rgb'], p['accent'], p['accent_rgb'], p['soft'], p['wash'], p['paper'], p['paper2'], p['paper2'], p['deep']))
    between(os.path.join(ROOT, 'undangan', 'hidup.css'), 'tema', '\n'.join(css))

    # dasar.js: THEMES entries
    rows = ['    %s: [%s, %s, %s, %s],' % (js(s), js(T['name'][0]), js(T['name'][1]), js(T['tone']), js('hidup')) for s, T in THEMES.items()]
    between(os.path.join(ROOT, 'undangan', 'dasar.js'), 'hidup', '\n'.join(rows))
    # themes.js and site.js: BASIC rows
    rows = ['    [%s, %s, %s, %s, %s, %s],' % (js(T['name'][0]), js(T['name'][1]), js(T['desc'][0]), js(T['desc'][1]), js('hidup'), js(s)) for s, T in THEMES.items()]
    body = '\n'.join(rows).rstrip(',')
    between(os.path.join(ROOT, 'assets', 'js', 'themes.js'), 'hidup', ',' + body.lstrip())
    between(os.path.join(ROOT, 'assets', 'js', 'site.js'), 'hidup', ',' + body.lstrip())
    # tags
    path = os.path.join(ROOT, 'assets', 'js', 'tema-tags.js')
    s = open(path, encoding='utf-8').read()
    i, j = s.index('{', s.index('window.NAWALA_TAGS')), s.rindex('}')
    tags = json.loads(s[i:j + 1])
    for slug, T in THEMES.items(): tags[slug] = ['bergerak'] + T['tags']
    open(path, 'w', encoding='utf-8').write(s[:i] + json.dumps(tags, ensure_ascii=False, separators=(',', ':')) + s[j + 1:])
    # the database
    sql = ['-- %d living Dasar themes (27 Nov 2026), built from the cut-outs in the owner\'s art directory: family "hidup".' % len(THEMES),
           '-- Scenery in layers that shift with the scroll, falling or rising particles, swaying corners. Every one has a working',
           '-- sample (kit = its own slug in undangan/dasar.html). Written by tools/hidup.py. Safe to run twice.', '', 'begin;', '',
           'alter table public.themes drop constraint if exists themes_family_check;',
           'alter table public.themes add constraint themes_family_check check (family is null or family in',
           "  ('alam', 'royal', 'religi', 'nusa', 'dunia', 'era', 'elemen', 'bunga', 'tempat', 'budaya', 'waktu', 'hidup'));", '',
           'insert into public.themes (slug, tier, family, name_id, name_en, desc_id, desc_en, kit, sort) values']
    vals = ['(%s, \'dasar\', \'hidup\', %s, %s, %s, %s, %s, %d)' % (sq(s), sq(T['name'][0]), sq(T['name'][1]), sq(T['desc'][0]), sq(T['desc'][1]), sq(s), 3000 + 10 * n)
            for n, (s, T) in enumerate(THEMES.items())]
    sql.append(',\n'.join(vals))
    sql += ['on conflict (slug) do update set tier = excluded.tier, family = excluded.family, name_id = excluded.name_id, name_en = excluded.name_en,',
            '  desc_id = excluded.desc_id, desc_en = excluded.desc_en, kit = excluded.kit, sort = excluded.sort;', '', 'commit;', '']
    open(os.path.join(ROOT, 'supabase', 'migrations', '20261127_hidup_themes.sql'), 'w').write('\n'.join(sql))
    print('%d themes written' % len(THEMES))

# ---------- still pictures and covers ----------
def bake(only=None):
    import asyncio, io
    from PIL import Image, ImageEnhance
    from playwright.async_api import async_playwright
    IMG = os.path.join(ROOT, 'assets', 'img')
    hide = '.gate,.tools,.bar,.side,.jl-hint,dialog{display:none!important}.page *{visibility:hidden!important}.hd-hero,.hd-hero *{visibility:visible!important}html,body{background:#000!important}'
    async def run():
        async with async_playwright() as p:
            br = await p.chromium.launch(channel='chrome')
            ctx = await br.new_context(viewport={'width': 360, 'height': 645}, device_scale_factor=2)
            pg = await ctx.new_page()
            for slug in THEMES:
                if only and slug not in only: continue
                await pg.goto('http://localhost:8765/undangan/dasar.html?tema=%s&still=1&edit=1' % slug, wait_until='networkidle')
                await pg.add_style_tag(content=hide)
                await pg.wait_for_timeout(350)
                im = Image.open(io.BytesIO(await pg.screenshot())).convert('RGB')
                im.save(os.path.join(OUT, 'plate-%s.webp' % slug), 'WEBP', quality=80, method=6)
                c = im.resize((640, 1147), Image.LANCZOS).crop((0, 4, 640, 1142))
                c.save(os.path.join(IMG, 'cover-%s.webp' % slug), 'WEBP', quality=80, method=6)
                t = ImageEnhance.Contrast(ImageEnhance.Color(c).enhance(.58)).enhance(.93)
                t.save(os.path.join(IMG, 'cover-%s-t.webp' % slug), 'WEBP', quality=78, method=6)
                t.resize((400, 711), Image.LANCZOS).save(os.path.join(IMG, 'cover-%s-m.webp' % slug), 'WEBP', quality=76, method=6)
                t.resize((220, 391), Image.LANCZOS).save(os.path.join(IMG, 'cover-%s-s.webp' % slug), 'WEBP', quality=74, method=6)
                g = ImageEnhance.Color(c).enhance(0).resize((220, 391), Image.LANCZOS)
                g = Image.blend(g, Image.new('RGB', g.size, (255, 255, 255)), .5)
                g.save(os.path.join(IMG, 'cover-%s-g.webp' % slug), 'WEBP', quality=60, method=6)
                print('baked', slug)
            await br.close()
    asyncio.run(run())

if __name__ == '__main__':
    cmd = sys.argv[1] if len(sys.argv) > 1 else ''
    if cmd == 'assets': assets(sys.argv[2])
    elif cmd == 'write': write()
    elif cmd == 'bake': bake(set(sys.argv[2:]) or None)
    else: print(__doc__ or 'assets <folder> | write | bake [slug ...]')
