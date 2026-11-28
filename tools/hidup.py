#!/usr/bin/env python3
# The living Dasar themes (family "hidup", 27 Nov 2026): one source for the themes built from the hand-made and
# AI-made cut-outs in the owner's "NAWALA ART DIRECTORY" (304 numbered 4000 x 4000 PNG files, transparent) and, since
# 28 Nov 2026, art directories 2, 3 and 4 (keys b, c, d; set NAWALA_ART_PACK to the folder with their shrunk copies).
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
PACK = os.environ.get('NAWALA_ART_PACK', '')   # folder with b/, c/, d/: shrunk copies of art directories 2, 3 and 4
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
def P(k, count): return ['%sp%d' % (k, i) for i in range(count)]   # the same, for a key with a directory letter

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
# ---- third batch (27 Nov 2026, late): the last unused pictures ----
'kawan-gunung': dict(
    name=('Kawan Gunung', 'Mountain Friends'),
    desc=('Domba gunung, kambing, beruang hitam, dan keledai pembawa bekal di lereng berbatu; untuk undangan yang ceria.', 'A ram, a goat, a black bear and a pack donkey on a rocky slope; for a playful invitation.'),
    tone='light', tags=['ilustrasi', 'biru', 'hewan', 'gunung'],
    sky='linear-gradient(180deg,#C6E0F2 0,#E4F0F4 50%,#F4F1DC 100%)', main='#2C4250', accent='#A9652F',
    far=[far('109', 26, 10, 8, d=-.12, move='turn', t=150), far('116', 140, 44, 60, d=.08), far('135', 110, 66, 76, d=.18)],
    foot=[foot('232', 112, -8, down=30, d=.45, a=.4)],
    hero=[pc('133', 38, 50, 74)],
    corner=None,
    gaps=[gap(pc('132', 44, 50, 50), h=50), gap(pc('123', 44, 50, 50), h=54), gap(pc('118', 30, 30, 50), pc('125', 30, 70, 56), h=40), gap(pc('133', 40, 50, 50), h=56)],
    fx=fx('float', n=10, s=(5, 10), d=(8, 14), o=(.6, 1), dot='#FFFFFF'),
    fly=[fly('117', 64, 72, 30, dy=0)]),
'rimba-raya': dict(
    name=('Rimba Raya', 'Deep Jungle'),
    desc=('Gorila, ular hijau, dan kalkun di antara daun besar dan sulur; untuk undangan yang ceria.', 'A gorilla, a green snake and a turkey among big leaves and lianas; for a playful invitation.'),
    tone='light', tags=['ilustrasi', 'hijau', 'hewan', 'rimba'],
    sky='linear-gradient(180deg,#D9EDD6 0,#EAF4DF 52%,#F6F2CF 100%)', main='#22402A', accent='#C2702C',
    far=[far('239', 60, 94, 46, d=.2, move='sway', a=2.2, o=.9), far('215', 56, 6, 66, d=.14, move='sway', a=2, o=.9)],
    top=[top('214', 60, 20, up=6, a=2.4), top('207', 50, -4, up=6, a=1.6, t=8)],
    foot=[foot('225', 74, -12, down=12), foot('231', 60, -10, down=10, right=True)],
    hero=[pc('130', 46, 50, 74)],
    corner=None,
    gaps=[gap(pc('131', 40, 50, 50), h=50), gap(pc('127', 34, 50, 50), h=30), gap(pc('218', 34, 28, 50), pc('239', 40, 72, 50)), gap(pc('130', 44, 50, 50), h=52)],
    fx=fx('fall', DAUN, n=8, s=(20, 34), d=(10, 17))),
'daun-hijau': dict(
    name=('Daun Hijau', 'Greenery'),
    desc=('Hanya hijau: daun besar, ivy di sudut kartu, sulur kecil, dan bukit lumut di bawah.', 'Green only: large leaves, ivy on the card corners, small vines and a mossy hill below.'),
    tone='light', tags=['hijau', 'daun', 'minimalis', 'segar'],
    sky='linear-gradient(180deg,#F4F8EE 0,#EDF4E3 52%,#E2EDD3 100%)', main='#2A4425', accent='#5F8F3E',
    top=[top('214', 56, 22, up=4, a=2.4), top('212', 40, 2, up=0, a=3, t=6)],
    foot=[foot('232', 112, -8, down=34, a=.4)],
    hero=[pc('239', 56, 50, 70)],
    corner=('211', '218'),
    gaps=[gap(pc('215', 50, 50, 50)), gap(pc('201', 22, 30, 50), pc('218', 34, 68, 50)), gap(pc('207', 60, 50, 50), h=40), gap(pc('239', 44, 50, 50))],
    fx=fx('fall', DAUN, n=8, s=(18, 30), d=(11, 18))),
'bingkai-persik': dict(
    name=('Bingkai Persik', 'Peach Frame'),
    desc=('Bingkai emas tipis yang tetap di tempat, bunga persik dan ranunculus, dan kelopak yang jatuh.', 'A fine gold frame that stays in place, peach blossom and ranunculus, and falling petals.'),
    tone='light', tags=['emas', 'jingga', 'bingkai', 'lembut'],
    sky='linear-gradient(180deg,#FFF9F3 0,#FDEEE2 55%,#F8DCC9 100%)', main='#5A3423', accent='#D07F52',
    far=[far('299', 94, 50, 50, d=0)],
    hero=[pc('42', 54, 50, 68)],
    corner=('24', '206'),
    gaps=[gap(pc('206', 36, 50, 50), h=62), gap(pc('24', 46, 50, 50)), gap(pc('2', 44, 50, 50)), gap(pc('42', 44, 50, 50))],
    fx=fx('fall', PETAL, n=9, s=(14, 26))),
'bingkai-malam': dict(
    name=('Bingkai Malam', 'Night Frame'),
    desc=('Bingkai emas tipis di atas biru malam, mawar emas, dan kilau emas yang melayang.', 'A fine gold frame on night blue, a gold rose and drifting gold light.'),
    tone='dark', tags=['emas', 'malam', 'bingkai', 'formal'],
    sky='linear-gradient(180deg,#0B1226 0,#111B36 55%,#1A2646 100%)', main='#18233F', accent='#C9A24B',
    far=[far('300', 94, 50, 50, d=0)],
    hero=[pc('150', 40, 50, 70)],
    corner=('295', '298'),
    gaps=[gap(pc('296', 80, 50, 50), h=20), gap(pc('303', 36, 50, 50)), gap(pc('149', 22, 50, 50), h=44), gap(pc('154', 30, 50, 50))],
    fx=fx('float', n=14, s=(5, 10), d=(7, 13), o=(.5, .95), dot='#E3C46E')),
'kartu-pos-fuji': dict(
    name=('Kartu Pos Fuji', 'Postcard from Fuji'),
    desc=('Lukisan Gunung Fuji seperti kartu pos, dengan ranting sakura yang keluar dari bingkainya.', 'A painting of Mount Fuji like a postcard, with a cherry branch reaching out of its frame.'),
    tone='light', tags=['catair', 'biru', 'gunung', 'kartupos'],
    sky='linear-gradient(180deg,#F2F7FB 0,#FBF3F5 52%,#F8E4EA 100%)', main='#2F4660', accent='#D2608A',
    top=[top('282', 104, -4, up=4, right=True)],
    foot=[foot('74', 104, -4, down=6)],
    hero=[pc('100', 70, 50, 70)],
    corner=('77', '79'),
    gaps=[gap(pc('93', 40, 50, 50), h=36), gap(pc('100', 62, 50, 50), h=56), gap(pc('80', 78, 50, 50), h=44), gap(pc('93', 34, 50, 50), h=32)],
    fx=fx('fall', SAKURA, n=13, s=(10, 20), d=(9, 16))),
'aster-ceria': dict(
    name=('Aster Ceria', 'Sunny Daisy'),
    desc=('Aster kuning bergaya kartun, pohon bulat, kolam kecil, dan mobil kemping yang melintas; untuk undangan yang ceria.', 'A cartoon yellow daisy, a round tree, a small pond and a camper van passing by; for a playful invitation.'),
    tone='light', tags=['ilustrasi', 'kuning', 'kartun', 'ceria'],
    sky='linear-gradient(180deg,#CFEBF7 0,#EAF6EE 50%,#FFF6CF 100%)', main='#2F4A2E', accent='#E0A21A',
    far=[far('109', 30, 90, 8, d=-.12, move='turn', t=120)],
    foot=[foot('233', 112, -6, down=34, d=.4, a=.4)],
    hero=[pc('54', 34, 50, 72)],
    corner=None,
    gaps=[gap(pc('114', 36, 50, 50), h=46), gap(pc('111', 50, 50, 50), h=30), gap(pc('54', 26, 30, 50), pc('114', 30, 70, 50), h=50), gap(pc('119', 40, 50, 50), h=36)],
    fx=fx('float', n=10, s=(5, 10), d=(8, 14), o=(.6, 1), dot='#FFFFFF'),
    fly=[fly('119', 88, 76, 26, dy=0)]),
# ---- fourth batch (28 Nov 2026): art directories 2, 3 and 4 (keys that start with b, c, d) ----
'langit-musim-panas': dict(
    name=('Langit Musim Panas', 'Summer Sky'),
    desc=('Langit biru yang dilukis, awan yang bergeser pelan, matahari yang berputar, dan pesawat kertas yang melintas.', 'A painted blue sky, clouds that drift slowly, a turning sun and a paper plane passing by.'),
    tone='light', tags=['lukisan', 'biru', 'awan', 'cerah'],
    sky='linear-gradient(180deg,#8FD0F2 0,#CFEAF8 55%,#EAF6F1 100%)', bg='b9', bgpos='50% 100%', main='#1F4763', accent='#E39A1C',
    far=[far('d31', 30, 86, 9, d=-.1, move='turn', t=140), far('b19', 70, 16, 30, d=.06, move='drift', t=46), far('b22', 56, 84, 44, d=.1, move='drift', t=38)],
    hero=[pc('b119', 44, 50, 74)],
    corner=('b119', 'b144'),
    gaps=[gap(pc('d28', 46, 50, 50), h=40), gap(pc('b182', 60, 50, 50), h=40), gap(pc('b17', 70, 50, 50), h=34), gap(pc('b63', 46, 50, 50), h=26)],
    fx=fx('float', n=10, s=(5, 10), d=(8, 14), o=(.6, 1), dot='#FFFFFF'),
    fly=[fly('b63', 64, 58, 20)]),
'senja-berawan': dict(
    name=('Senja Berawan', 'Clouded Sunset'),
    desc=('Langit senja merah muda dan jingga, gumpalan awan keemasan, dan matahari yang turun di kaki halaman.', 'A pink and orange dusk, banks of golden cloud and the sun going down at the foot of the page.'),
    tone='light', tags=['lukisan', 'jingga', 'senja', 'awan'],
    sky='linear-gradient(180deg,#F6C4D8 0,#FBD9C2 55%,#FFE9B8 100%)', bg='b2', main='#5A2B3E', accent='#E0762B',
    far=[far('b18', 76, 20, 26, d=.06, move='drift', t=50), far('b21', 64, 82, 42, d=.1, move='drift', t=40), far('d35', 96, 50, 96, d=.3, move='breathe')],
    hero=[pc('d26', 46, 50, 72)],
    corner=('b154', 'b145'),
    gaps=[gap(pc('b17', 72, 50, 50), h=36), gap(pc('b148', 34, 30, 50), pc('b163', 36, 70, 52), h=40), gap(pc('b20', 60, 50, 50), h=32), gap(pc('b143', 40, 50, 50), h=42)],
    fx=fx('rise', n=12, s=(5, 10), d=(9, 15), o=(.5, .95), dot='#FFE3A1')),
'awan-merah-muda': dict(
    name=('Awan Merah Muda', 'Pink Clouds'),
    desc=('Awan merah muda yang lembut, mawar persik, dan kelopak yang turun perlahan.', 'Soft pink clouds, a peach rose and petals coming down slowly.'),
    tone='light', tags=['lukisan', 'merahmuda', 'awan', 'mawar'],
    sky='linear-gradient(180deg,#E9D6F3 0,#F8E3EE 55%,#FFF3F3 100%)', bg='b1', main='#56304A', accent='#D8688E',
    far=[far('b21', 70, 82, 30, d=.06, move='drift', t=48), far('b19', 60, 14, 46, d=.1, move='drift', t=40)],
    hero=[pc('b112', 46, 50, 70)],
    corner=('b109', 'b120'),
    gaps=[gap(pc('b106', 50, 50, 50), h=56), gap(pc('b140', 30, 28, 50), pc('b132', 34, 70, 52), h=38), gap(pc('b110', 44, 50, 50), h=60), gap(pc('b18', 70, 50, 50), h=34)],
    fx=fx('fall', P('d311', 8), n=12, s=(12, 22), d=(9, 16))),
'malam-purnama': dict(
    name=('Malam Purnama', 'Full Moon Night'),
    desc=('Bulan purnama keemasan di atas awan malam, dengan bintang yang berkelip.', 'A golden full moon over night clouds, with stars that twinkle.'),
    tone='dark', tags=['lukisan', 'malam', 'bulan', 'bintang'],
    sky='linear-gradient(180deg,#0D1A45 0,#1E3272 55%,#3558A8 100%)', bg='b25', main='#14224F', accent='#E0B84C',
    far=[far('c482', 38, 86, 8, d=-.08, move='breathe', t=10), far('d8', 80, 30, 26, d=.04, move='twinkle', t=3.2), far('d18', 30, 16, 50, d=.08, move='twinkle', t=2.6)],
    hero=[pc('c489', 52, 50, 72)],
    corner=('d17', 'd5'),
    gaps=[gap(pc('c494', 56, 50, 50), h=50), gap(pc('d13', 40, 50, 50), h=40), gap(pc('c497', 50, 50, 50), h=52), gap(pc('d14', 44, 50, 50), h=50)],
    fx=fx('float', n=16, s=(4, 9), d=(7, 13), o=(.5, 1), dot='#FFE9A8')),
'bulan-sabit': dict(
    name=('Bulan Sabit', 'Crescent Moon'),
    desc=('Bulan sabit besar di langit ungu tua, taburan bintang emas, dan awan biru di bawahnya.', 'A large crescent in a deep violet sky, a scatter of gold stars and blue cloud beneath.'),
    tone='dark', tags=['catair', 'ungu', 'bulan', 'bintang'],
    sky='linear-gradient(180deg,#1B1440 0,#2C2163 52%,#4A3486 100%)', main='#231A4E', accent='#E3BE5A',
    far=[far('c483', 44, 86, 9, d=-.06, move='breathe', t=11), far('d3', 90, 40, 50, d=.05, move='twinkle', t=3, o=.7)],
    top=[top('d6', 60, -4, up=0, right=True, a=.6)],
    hero=[pc('c487', 50, 50, 72)],
    corner=('d17', 'd12'),
    gaps=[gap(pc('c492', 50, 50, 50), h=42), gap(pc('c491', 46, 50, 50), h=46), gap(pc('d11', 30, 50, 50), h=44), gap(pc('c486', 44, 50, 50), h=46)],
    fx=fx('float', P('d3', 8), n=12, s=(8, 16), d=(8, 14), o=(.5, 1))),
'pelangi-cat-air': dict(
    name=('Pelangi Cat Air', 'Watercolour Rainbow'),
    desc=('Pelangi cat air di atas awan, bunga warna-warni, dan kupu-kupu pelangi yang melintas; untuk undangan yang ceria.', 'A watercolour rainbow over clouds, colourful flowers and a rainbow butterfly passing by; for a playful invitation.'),
    tone='light', tags=['catair', 'warnawarni', 'pelangi', 'ceria'],
    sky='linear-gradient(180deg,#CDE8FB 0,#EAF5FD 55%,#FFF7EE 100%)', bg='b15', main='#3A4A78', accent='#E86A8E',
    far=[far('d40', 84, 70, 7, d=.05), far('b22', 60, 14, 44, d=.1, move='drift', t=40), far('b19', 54, 88, 56, d=.14, move='drift', t=46)],
    hero=[pc('d39', 60, 50, 72)],
    corner=('b144', 'b135'),
    gaps=[gap(pc('d46', 60, 50, 50), h=50), gap(pc('d38', 60, 50, 50), h=40), gap(pc('d48', 44, 50, 50), h=40), gap(pc('d28', 46, 50, 50), h=40)],
    fx=fx('float', n=10, s=(5, 10), d=(8, 14), o=(.6, 1), dot='#FFFFFF'),
    fly=[fly('d48', 60, 58, 24)]),
'lampion-terbang': dict(
    name=('Lampion Terbang', 'Sky Lanterns'),
    desc=('Ratusan lampion kertas naik ke langit senja, dari jingga di kaki halaman sampai biru malam di atas.', 'Paper lanterns rising into the dusk, from orange at the foot of the page to night blue above.'),
    tone='dark', tags=['malam', 'jingga', 'lampion', 'hangat'],
    sky='linear-gradient(180deg,#101A3C 0,#2A2A5E 48%,#8A4A52 86%,#D9824A 100%)', main='#1A2147', accent='#F0A441',
    far=[far('c151', 34, 80, 16, d=-.14, move='sway', a=3, t=9), far('c145', 26, 14, 34, d=-.08, move='sway', a=4, t=11), far('c149', 16, 70, 52, d=-.04, move='sway', a=3, t=8)],
    hero=[pc('c139', 56, 50, 72)],
    corner=None,
    gaps=[gap(pc('c130', 60, 50, 50), h=56), gap(pc('c147', 56, 50, 50), h=56), gap(pc('c131', 64, 50, 50), h=44), gap(pc('c158', 54, 50, 50), h=52)],
    fx=fx('rise', P('c146', 5) + P('c130', 3), n=14, s=(18, 40), d=(11, 20), o=(.7, 1))),
'lentera-malam': dict(
    name=('Lentera Malam', 'Night Lanterns'),
    desc=('Lentera emas berukir yang tergantung dan bergoyang, pola bintang emas, dan cahaya yang melayang.', 'Carved gold lanterns hanging and swaying, a gold star pattern and drifting light.'),
    tone='dark', tags=['emas', 'malam', 'lentera', 'religi'],
    sky='linear-gradient(180deg,#0A2230 0,#0F3242 55%,#17475A 100%)', main='#0F2E3D', accent='#D6A84A',
    far=[far('d166', 120, 50, 40, d=.04, o=.14)],
    top=[top('c153', 62, 0, up=0, a=2.2, t=6), top('c136', 44, 2, up=0, right=True, a=2.6, t=7)],
    hero=[pc('c155m', 44, 50, 72)],
    corner=None,
    gaps=[gap(pc('c148m', 70, 50, 50), h=70), gap(pc('d174', 30, 50, 50), h=34), gap(pc('c143', 54, 50, 50), h=62), gap(pc('d165', 30, 50, 50), h=34)],
    fx=fx('float', n=14, s=(5, 10), d=(7, 13), o=(.5, .95), dot='#F2CE7A')),
'pesta-kebun': dict(
    name=('Pesta Kebun', 'Garden Party'),
    desc=('Lampu hias yang menyala di atas, langit senja, bukit hijau, dan kue pengantin di tengah taman.', 'Strings of lights overhead, a dusk sky, green hills and the wedding cake in the middle of the garden.'),
    tone='light', tags=['lukisan', 'senja', 'lampu', 'pesta'],
    sky='linear-gradient(180deg,#5F8FD6 0,#A7B7E3 52%,#E7CFE6 100%)', bg='b11', main='#2A3F6E', accent='#E6A93B',
    top=[top('c352', 110, -5, up=0, a=.8, t=9), top('c343', 80, 10, up=0, a=1, t=8)],
    foot=[foot('b14', 124, -12, down=30, d=.4, a=.3)],
    hero=[pc('c162', 40, 50, 72)],
    corner=('c261', 'c287'),
    gaps=[gap(pc('c261', 52, 50, 50), h=50), gap(pc('c172', 50, 50, 50), h=30), gap(pc('c225', 50, 50, 50), h=46), gap(pc('c235', 46, 50, 50), h=58)],
    fx=fx('float', n=12, s=(5, 10), d=(7, 13), o=(.5, .95), dot='#FFE7A6')),
'melati-putih': dict(
    name=('Melati Putih', 'White Jasmine'),
    desc=('Rangkaian melati di sudut kartu, daun hijau segar, dan kuntum putih yang melayang.', 'Jasmine on the corner of every card, fresh green leaves and white buds drifting.'),
    tone='light', tags=['putih', 'hijau', 'melati', 'nusantara'],
    sky='linear-gradient(180deg,#E6F1DF 0,#F0F6E7 52%,#F8F6E4 100%)', main='#27452C', accent='#5E9146',
    top=[top('d267', 70, 15, up=0, a=1.2)],
    foot=[foot('232', 112, -8, down=36, a=.4)],
    hero=[pc('c2', 62, 50, 70)],
    corner=('c5', 'c13'),
    gaps=[gap(pc('c5', 52, 50, 50), h=52), gap(pc('c1', 30, 28, 50), pc('c11', 34, 70, 52), h=40), gap(pc('d268', 56, 50, 50), h=46), gap(pc('c7', 60, 50, 50), h=40)],
    fx=fx('fall', ['c6', 'c6h'], n=8, s=(14, 24), d=(11, 18), o=(.8, 1))),
'janur-kuning': dict(
    name=('Janur Kuning', 'Janur Kuning'),
    desc=('Penjor dan janur melengkung di kedua sisi, melati di sudut kartu, dan daun yang jatuh.', 'Penjor and janur arching on both sides, jasmine on the card corners and falling leaves.'),
    tone='light', tags=['kuning', 'hijau', 'janur', 'nusantara'],
    sky='linear-gradient(180deg,#FFF9E4 0,#FBF3D2 55%,#F2E7B4 100%)', main='#4A4418', accent='#A9941E',
    far=[far('c62', 46, 0, 46, d=.08, move='sway', a=1.2, t=8), far('c40', 40, 100, 52, d=.12, move='sway', a=1.4, t=9, flip=True)],
    hero=[pc('c46', 44, 50, 72)],
    corner=('c5', 'c3'),
    gaps=[gap(pc('c43', 50, 50, 50), h=70), gap(pc('c47', 40, 30, 50), pc('c55', 40, 72, 50, flip=True), h=66), gap(pc('c50', 50, 50, 50), h=62), gap(pc('c56', 46, 50, 50), h=62)],
    fx=fx('fall', P('d51', 8), n=8, s=(14, 26), d=(10, 17))),
'joglo-jawa': dict(
    name=('Joglo Jawa', 'Javanese Joglo'),
    desc=('Rumah joglo di kejauhan, sawah di kaki halaman, gunungan emas, dan sepasang pengantin Jawa tanpa wajah.', 'A joglo house far off, rice terraces at the foot of the page, a gold gunungan and a faceless Javanese couple.'),
    tone='light', tags=['nusantara', 'jawa', 'joglo', 'pengantin'],
    sky='linear-gradient(180deg,#BFDDE2 0,#E3EEE6 55%,#F5EFD6 100%)', bg='b5', main='#3B2A1C', accent='#B2732B',
    far=[far('c75', 84, 50, 60, d=.1), far('b17', 60, 16, 22, d=.05, move='drift', t=48)],
    foot=[foot('c102', 120, -10, down=30, d=.4, a=.2)],
    hero=[pc('b381', 50, 50, 77)],
    corner=('c36', 'c38'),
    gaps=[gap(pc('c81', 56, 50, 50), h=60), gap(pc('c42', 40, 50, 50), h=62), gap(pc('c68', 78, 50, 50), h=44), gap(pc('b379', 52, 50, 50), h=70)],
    fx=fx('float', n=10, s=(5, 10), d=(8, 14), o=(.5, .9), dot='#F3DFA0')),
'pengantin-jawa': dict(
    name=('Pengantin Jawa', 'Javanese Bride and Groom'),
    desc=('Sepasang pengantin Jawa berbusana hitam dan emas, tanpa wajah, dengan ronce melati dan pola emas di belakangnya.', 'A Javanese couple in black and gold, faceless, with jasmine garlands and a gold pattern behind them.'),
    tone='light', tags=['nusantara', 'jawa', 'pengantin', 'emas'],
    sky='linear-gradient(180deg,#FBF6EA 0,#F6EDD8 55%,#EFE0BE 100%)', main='#2E2416', accent='#B38A2E',
    far=[far('d172', 110, 50, 34, d=.04, o=.16), far('b238', 120, 50, 70, d=.1, o=.7)],
    top=[top('c9', 80, 10, up=0, a=1)],
    hero=[pc('b385', 54, 50, 77)],
    corner=('c5', 'c13'),
    gaps=[gap(pc('b393', 60, 50, 50), h=50), gap(pc('c32', 34, 50, 50), h=50), gap(pc('b376', 56, 50, 50), h=70), gap(pc('b391', 70, 50, 50), h=44)],
    fx=fx('float', n=12, s=(5, 10), d=(7, 13), o=(.5, .95), dot='#D9B95A')),
'pengantin-putih': dict(
    name=('Pengantin Putih', 'Bride and Groom in White'),
    desc=('Sepasang pengantin berkebaya dan beskap putih, tanpa wajah, di antara melati dan awan lembut.', 'A couple in white kebaya and beskap, faceless, among jasmine and soft clouds.'),
    tone='light', tags=['nusantara', 'putih', 'pengantin', 'melati'],
    sky='linear-gradient(180deg,#F3ECE2 0,#F7EFE6 55%,#F3E3D6 100%)', bg='b190', main='#4A3526', accent='#B98A5C',
    far=[far('b263', 120, 50, 30, d=.06, o=.8)],
    top=[top('d269', 70, -6, up=0, a=1.2), top('d270', 60, -4, up=0, right=True, a=1.2)],
    hero=[pc('b375', 52, 50, 77)],
    corner=('c2', 'c5'),
    gaps=[gap(pc('b372', 56, 50, 50), h=70), gap(pc('c173', 44, 50, 50), h=36), gap(pc('b386', 60, 50, 50), h=50), gap(pc('b388', 62, 50, 50), h=62)],
    fx=fx('fall', ['c6', 'c6h'], n=8, s=(14, 24), d=(11, 18), o=(.8, 1))),
'pengantin-andalas': dict(
    name=('Pengantin Andalas', 'Sumatran Bride and Groom'),
    desc=('Pengantin bersongket marun dengan hiasan kepala emas, rumah gadang di kejauhan, dan motif songket merah emas.', 'A couple in maroon songket with a gold headdress, a rumah gadang far off and a red and gold songket motif.'),
    tone='light', tags=['nusantara', 'sumatra', 'pengantin', 'songket'],
    sky='linear-gradient(180deg,#F9EEDD 0,#F6E2CC 55%,#EFCFB2 100%)', main='#4B1F1F', accent='#B8872D',
    far=[far('c18', 110, 50, 58, d=.1, o=.95)],
    hero=[pc('b377', 54, 50, 77)],
    corner=('c36', 'c37'),
    gaps=[gap(pc('c30', 46, 50, 50), h=46), gap(pc('b399', 56, 50, 50), h=70), gap(pc('c24', 50, 50, 50), h=26), gap(pc('b409', 56, 50, 50), h=70)],
    fx=fx('float', n=12, s=(5, 10), d=(7, 13), o=(.5, .95), dot='#E0BE64')),
'akad-melati': dict(
    name=('Akad Melati', 'Jasmine Akad'),
    desc=('Pengantin berbusana putih dengan hijab dan mahkota, lentera emas yang tergantung, dan pola bintang yang halus.', 'A couple in white, the bride in hijab and crown, hanging gold lanterns and a fine star pattern.'),
    tone='light', tags=['religi', 'putih', 'pengantin', 'lentera'],
    sky='linear-gradient(180deg,#F4F7F2 0,#EEF3EC 55%,#E2ECE2 100%)', main='#23463F', accent='#B6923C',
    far=[far('d166', 120, 50, 36, d=.04, o=.18)],
    top=[top('c135', 76, 12, up=0, a=1.8, t=7)],
    hero=[pc('b406', 52, 50, 77)],
    corner=('c5', 'c13'),
    gaps=[gap(pc('b384', 60, 50, 50), h=44), gap(pc('c156', 40, 50, 50), h=40), gap(pc('b402', 56, 50, 50), h=64), gap(pc('c180', 34, 50, 50), h=38)],
    fx=fx('float', n=12, s=(5, 10), d=(7, 13), o=(.5, .95), dot='#D9B95A')),
'pasangan-ceria': dict(
    name=('Pasangan Ceria', 'Cheerful Couple'),
    desc=('Sepasang pengantin Jawa bergaya kartun yang tersenyum, bintang krayon, dan konfeti emas; untuk undangan yang ceria.', 'A smiling cartoon Javanese couple, crayon stars and gold confetti; for a playful invitation.'),
    tone='light', tags=['ilustrasi', 'kartun', 'pengantin', 'ceria'],
    sky='linear-gradient(180deg,#FFF3DC 0,#FFEBD2 55%,#FFDDC4 100%)', main='#4A2B1C', accent='#D9772F',
    far=[far('d24', 28, 88, 9, d=-.1, move='turn', t=120), far('b20', 56, 14, 24, d=.06, move='drift', t=44)],
    hero=[pc('b344', 56, 50, 77)],
    corner=None,
    gaps=[gap(pc('b364', 60, 50, 50), h=60), gap(pc('b371', 40, 50, 50), h=44), gap(pc('b363', 40, 50, 50), h=44), gap(pc('b360', 44, 50, 50), h=46)],
    fx=fx('fall', P('d110', 10), n=12, s=(8, 16), d=(8, 15))),
'nusantara-berpasangan': dict(
    name=('Nusantara Berpasangan', 'Couples of the Archipelago'),
    desc=('Di tiap jeda ada sepasang pengantin dari daerah yang berbeda, dengan rumah adat di kejauhan.', 'Every pause shows a bride and groom from a different region, with a traditional house far off.'),
    tone='light', tags=['ilustrasi', 'nusantara', 'pengantin', 'adat'],
    sky='linear-gradient(180deg,#F9F1E2 0,#F6E7D2 55%,#EED6B8 100%)', main='#472A1F', accent='#C2642F',
    far=[far('c22', 90, 50, 58, d=.1, o=.95)],
    hero=[pc('b366', 54, 50, 77)],
    corner=('c36', 'c38'),
    gaps=[gap(pc('b368', 58, 50, 50), h=64), gap(pc('b401', 58, 50, 50), h=66), gap(pc('b396', 56, 50, 50), h=68), gap(pc('b400', 56, 50, 50), h=66), gap(pc('b395', 58, 50, 50), h=64)],
    fx=fx('float', n=10, s=(5, 10), d=(8, 14), o=(.5, .9), dot='#F0D48A')),
'pengantin-klasik': dict(
    name=('Pengantin Klasik', 'Classic Bride and Groom'),
    desc=('Pengantin Jawa dengan buket bunga dan gaun berekor, dalam warna cokelat, merah, atau hijau di tiap jeda.', 'A Javanese couple with a bouquet and a trailing gown, in brown, red or green at each pause.'),
    tone='light', tags=['ilustrasi', 'jawa', 'pengantin', 'buket'],
    sky='linear-gradient(180deg,#FBF4EC 0,#F6E9DC 55%,#EDD8C4 100%)', main='#3F2618', accent='#A8763A',
    far=[far('b243', 120, 50, 40, d=.06, o=.8)],
    top=[top('c9', 80, 10, up=0, a=1)],
    hero=[pc('b387', 56, 50, 77)],
    corner=('c5', 'c2'),
    gaps=[gap(pc('b392', 60, 50, 50), h=62), gap(pc('b405', 56, 50, 50), h=66), gap(pc('b394', 60, 50, 50), h=62), gap(pc('b410', 54, 50, 50), h=70)],
    fx=fx('fall', ['c6', 'c6h'], n=8, s=(14, 24), d=(11, 18), o=(.8, 1))),
'sawah-pagi': dict(
    name=('Sawah Pagi', 'Morning in the Rice Fields'),
    desc=('Sawah berundak di kaki halaman, gunung di kejauhan, petani yang bekerja, dan burung yang melintas.', 'Rice terraces at the foot of the page, a mountain far off, farmers at work and a bird crossing.'),
    tone='light', tags=['nusantara', 'hijau', 'sawah', 'desa'],
    sky='linear-gradient(180deg,#BFE0F0 0,#E4F1EA 52%,#F5F1CF 100%)', bg='b7', bgpos='50% 0', main='#2E4720', accent='#B7862B',
    far=[far('c126', 110, 56, 56, d=.08), far('b19', 56, 16, 20, d=.05, move='drift', t=46)],
    foot=[foot('c91', 124, -12, down=22, d=.45, a=.2)],
    hero=[pc('c98', 60, 50, 74)],
    corner=None,
    gaps=[gap(pc('c103', 60, 50, 50), h=40), gap(pc('c94', 40, 50, 50), h=36), gap(pc('c95', 60, 50, 50), h=50), gap(pc('c100', 40, 30, 50), pc('c108', 36, 72, 50), h=50)],
    fx=fx('float', n=8, s=(5, 10), d=(8, 14), o=(.6, 1), dot='#FFFFFF'),
    fly=[fly('b83', 60, 58, 22)]),
'rumpun-bambu': dict(
    name=('Rumpun Bambu', 'Bamboo Grove'),
    desc=('Rumpun bambu di kedua sisi, panda yang mengintip, rebung, dan daun yang jatuh pelan.', 'Bamboo on both sides, a panda peeking out, a bamboo shoot and leaves falling slowly.'),
    tone='light', tags=['hijau', 'bambu', 'alam', 'tenang'],
    sky='linear-gradient(180deg,#EEF6E4 0,#E6F1D9 55%,#D9E9C6 100%)', main='#2C4A1E', accent='#6E9A2E',
    far=[far('d421', 46, 0, 52, d=.08, move='sway', a=.8, t=9), far('d433', 34, 100, 48, d=.14, move='sway', a=1, t=8)],
    hero=[pc('d430', 50, 50, 72)],
    corner=('d423', 'd428'),
    gaps=[gap(pc('d425', 44, 50, 50), h=70), gap(pc('d427', 40, 50, 50), h=50), gap(pc('d422', 46, 50, 50), h=62), gap(pc('d429', 40, 50, 50), h=42)],
    fx=fx('fall', P('d51', 8), n=10, s=(14, 26), d=(10, 17))),
'puspa-nusantara': dict(
    name=('Puspa Nusantara', 'Flowers of the Archipelago'),
    desc=('Rafflesia, bunga bangkai dengan anggrek, cendrawasih, dan rangkong yang terbang melintas di antara daun tropis.', 'Rafflesia, a titan arum with orchids, a bird of paradise and a hornbill flying across among tropical leaves.'),
    tone='light', tags=['nusantara', 'tropis', 'rafflesia', 'burung'],
    sky='linear-gradient(180deg,#DCEEDC 0,#EDF5E4 52%,#F8F3D8 100%)', main='#1F4029', accent='#C94A32',
    top=[top('226', 70, -8, up=10, a=2), top('236', 60, -8, up=10, right=True, a=2)],
    foot=[foot('225', 74, -12, down=12), foot('231', 60, -10, down=10, right=True)],
    hero=[pc('c16', 64, 50, 72)],
    corner=('c5', 'c33'),
    gaps=[gap(pc('c34', 54, 50, 50), h=62), gap(pc('c23', 44, 50, 50), h=56), gap(pc('c15', 54, 50, 50), h=48), gap(pc('c33', 60, 50, 50), h=36)],
    fx=fx('fall', DAUN, n=7, s=(18, 30), d=(11, 18)),
    fly=[fly('c20', 96, 58, 20)]),
'rimba-borneo': dict(
    name=('Rimba Borneo', 'Borneo Rainforest'),
    desc=('Rumah panjang di kejauhan, orangutan di dahan, dan rangkong yang terbang di atas rimba.', 'A longhouse far off, an orangutan on a branch and a hornbill flying over the forest.'),
    tone='light', tags=['nusantara', 'kalimantan', 'rimba', 'burung'],
    sky='linear-gradient(180deg,#D6ECDC 0,#E8F3E0 52%,#F4EFD2 100%)', main='#1F3D2A', accent='#B5622A',
    far=[far('c26', 100, 50, 60, d=.1)],
    top=[top('214', 60, 20, up=6, a=2.4), top('207', 50, -4, up=6, a=1.6, t=8)],
    foot=[foot('225', 74, -12, down=14), foot('231', 60, -10, down=12, right=True)],
    hero=[pc('c19', 56, 50, 72)],
    corner=None,
    gaps=[gap(pc('c372', 50, 50, 50), h=58), gap(pc('c35', 36, 50, 50), h=50), gap(pc('c382', 46, 50, 50), h=54), gap(pc('c22', 70, 50, 50), h=50)],
    fx=fx('fall', DAUN, n=7, s=(18, 30), d=(11, 18)),
    fly=[fly('c20', 96, 58, 20)]),
'dahlia-merona': dict(
    name=('Dahlia Merona', 'Blushing Dahlia'),
    desc=('Dahlia merah muda dan jingga yang berputar pelan di kejauhan, satu tangkai di sampul, dan kelopak yang jatuh.', 'Pink and orange dahlias turning slowly far off, one stem on the cover and falling petals.'),
    tone='light', tags=['catair', 'merahmuda', 'dahlia', 'kelopak'],
    sky='linear-gradient(180deg,#FFF5EF 0,#FFE9E2 55%,#FBD5CF 100%)', main='#5B2A2F', accent='#D85B63',
    far=[far('b248', 120, 50, 26, d=.04, o=.7), far('d207', 46, 94, 47, d=.1, move='turn', t=160), far('d203', 36, 4, 58, d=.16, move='turn', t=190)],
    hero=[pc('d204', 50, 50, 72)],
    corner=('d202', 'd203'),
    gaps=[gap(pc('d199', 46, 50, 50), h=48), gap(pc('d212', 34, 28, 50), pc('d215', 38, 70, 52), h=42), gap(pc('d206', 46, 50, 50), h=48), gap(pc('d201', 40, 50, 50), h=44)],
    fx=fx('fall', P('d311', 8), n=11, s=(12, 22), d=(9, 16))),
'dahlia-malam': dict(
    name=('Dahlia Malam', 'Midnight Dahlia'),
    desc=('Dahlia merah anggur dan ungu di atas malam yang pekat, dengan serpihan emas yang jatuh.', 'Wine red and purple dahlias on a deep night, with flecks of gold falling.'),
    tone='dark', tags=['malam', 'marun', 'dahlia', 'emas'],
    sky='linear-gradient(180deg,#1C0C16 0,#2A1220 55%,#3D1A2C 100%)', main='#2C1320', accent='#D2A24F',
    far=[far('d211', 44, 95, 48, d=.1, move='turn', t=170), far('d200', 36, 4, 60, d=.16, move='turn', t=200)],
    hero=[pc('d214', 48, 50, 72)],
    corner=('d214', 'd211'),
    gaps=[gap(pc('d200', 46, 50, 50), h=48), gap(pc('d213', 44, 50, 50), h=48), gap(pc('d124', 60, 50, 50), h=14), gap(pc('d212', 44, 50, 50), h=46)],
    fx=fx('fall', P('d110', 10), n=12, s=(7, 14), d=(9, 16), o=(.6, 1))),
'anggrek-bulan': dict(
    name=('Anggrek Bulan', 'Moon Orchid'),
    desc=('Tangkai anggrek bulan yang melengkung dari atas, kuntum merah muda di sudut kartu, dan cahaya yang melayang.', 'Moon orchid sprays arching from above, pink blooms on the card corners and drifting light.'),
    tone='light', tags=['catair', 'merahmuda', 'anggrek', 'nusantara'],
    sky='linear-gradient(180deg,#FBF1F8 0,#F8E8F2 52%,#F3DCEB 100%)', main='#4E2748', accent='#C2569A',
    far=[far('b271', 110, 50, 34, d=.05, o=.55)],
    top=[top('d216', 60, -6, up=0, right=True, a=1.6), top('d232', 56, -4, up=0, a=1.8)],
    hero=[pc('d218', 54, 50, 72)],
    corner=('d219', 'd225'),
    gaps=[gap(pc('d224', 46, 50, 50), h=60), gap(pc('d222', 36, 50, 50), h=62), gap(pc('d230', 50, 50, 50), h=54), gap(pc('d221', 56, 50, 50), h=44)],
    fx=fx('float', n=12, s=(5, 10), d=(8, 14), o=(.5, .95), dot='#FFFFFF')),
'teratai-kolam': dict(
    name=('Teratai Kolam', 'Lotus Pond'),
    desc=('Teratai merah muda di kaki halaman, daun yang mengapung, ikan koi yang berenang melintas, dan capung.', 'Pink lotus at the foot of the page, floating leaves, a koi swimming across and a dragonfly.'),
    tone='light', tags=['catair', 'tosca', 'teratai', 'koi'],
    sky='linear-gradient(180deg,#E3F3EF 0,#D3ECE8 52%,#BFE0DC 100%)', main='#1F4A48', accent='#D4628A',
    far=[far('d251', 40, 90, 38, d=.1, move='sway', a=3, t=10), far('d251', 28, 6, 58, d=.16, move='sway', a=4, t=12, o=.9)],
    foot=[foot('d234', 100, 0, down=14, a=.6)],
    hero=[pc('d235', 50, 50, 70)],
    corner=('d244', 'd246'),
    gaps=[gap(pc('d239', 50, 50, 50), h=62), gap(pc('c429', 54, 50, 50), h=56), gap(pc('d245', 50, 50, 50), h=44), gap(pc('c409', 56, 50, 50), h=56)],
    fx=fx('float', n=10, s=(5, 10), d=(8, 14), o=(.5, .9), dot='#FFFFFF'),
    fly=[fly('c416', 86, 58, 26, dy=0), fly('c442', 56, 62, 18, flip=True)]),
'kolam-koi': dict(
    name=('Kolam Koi', 'Koi Pond'),
    desc=('Kolam dilihat dari atas: koi yang berputar pelan, daun teratai, dan gelembung yang naik.', 'A pond seen from above: koi circling slowly, lotus leaves and bubbles rising.'),
    tone='light', tags=['catair', 'biru', 'koi', 'air'],
    sky='linear-gradient(180deg,#DDF2F4 0,#C9E9EE 52%,#B3DDE6 100%)', main='#1C4857', accent='#E0623A',
    far=[far('b278', 120, 50, 30, d=.04, o=.6), far('c405', 34, 92, 50, d=.12, move='sway', a=5, t=9), far('c410', 34, 8, 60, d=.18, move='sway', a=5, t=11), far('d251', 30, 90, 80, d=.24, move='sway', a=3, t=12)],
    hero=[pc('c407', 50, 50, 72)],
    corner=('d244', 'd246'),
    gaps=[gap(pc('c421', 60, 50, 50), h=48), gap(pc('c432', 60, 50, 50), h=46), gap(pc('c427', 50, 50, 50), h=52), gap(pc('c418', 50, 50, 50), h=54)],
    fx=fx('rise', n=12, s=(5, 12), d=(8, 14), o=(.5, .9), dot='#FFFFFF'),
    fly=[fly('c416', 86, 58, 26, dy=0)]),
'capung-senja': dict(
    name=('Capung Senja', 'Dragonflies at Dusk'),
    desc=('Capung yang melintas di atas padang bunga liar saat senja, dengan teratai di jeda halaman.', 'Dragonflies crossing a meadow of wildflowers at dusk, with water lilies between the sections.'),
    tone='light', tags=['catair', 'jingga', 'capung', 'padang'],
    sky='linear-gradient(180deg,#FFEFD6 0,#FFE3CC 50%,#FBD0C4 100%)', main='#4C3140', accent='#3E8FA0',
    far=[far('d35', 90, 50, 90, d=.3, move='breathe', o=.9)],
    foot=[foot('233', 112, -6, down=34, d=.4, a=.4)],
    hero=[pc('c439', 56, 50, 72)],
    corner=('b144', 'b141'),
    gaps=[gap(pc('c440', 56, 50, 50), h=54), gap(pc('c443', 44, 50, 50), h=48), gap(pc('d250', 50, 50, 50), h=38), gap(pc('c444', 44, 50, 50), h=42)],
    fx=fx('rise', n=10, s=(5, 10), d=(9, 15), o=(.5, .9), dot='#FFF1B8'),
    fly=[fly('c442', 64, 58, 16), fly('c441', 60, 64, 21, flip=True)]),
'tulip-musim-semi': dict(
    name=('Tulip Musim Semi', 'Spring Tulips'),
    desc=('Barisan tulip merah muda di kaki halaman, seikat tulip di sampul, dan langit biru pucat.', 'A row of pink tulips at the foot of the page, a bunch of tulips on the cover and a pale blue sky.'),
    tone='light', tags=['catair', 'merahmuda', 'tulip', 'musimsemi'],
    sky='linear-gradient(180deg,#DCEEFB 0,#EEF6FB 52%,#FDF1F3 100%)', bg='b15', main='#3B4A66', accent='#DD6A8C',
    far=[far('b19', 56, 14, 26, d=.05, move='drift', t=46)],
    foot=[foot('d253', 120, -10, down=8, a=.5)],
    hero=[pc('d254', 40, 50, 70)],
    corner=('d259', 'd258'),
    gaps=[gap(pc('d256', 46, 50, 50), h=58), gap(pc('d260', 54, 50, 50), h=48), gap(pc('d261', 46, 50, 50), h=56), gap(pc('d252', 50, 50, 50), h=50)],
    fx=fx('fall', P('d311', 8), n=10, s=(12, 22), d=(9, 16))),
'magnolia-gading': dict(
    name=('Magnolia Gading', 'Ivory Magnolia'),
    desc=('Magnolia putih gading di atas kain linen, dahan berbunga dari atas, dan kilau emas yang melayang.', 'Ivory magnolia over linen, flowering branches from above and drifting specks of gold.'),
    tone='light', tags=['catair', 'putih', 'magnolia', 'linen'],
    sky='linear-gradient(180deg,#F7F2E8 0,#F4EEE2 55%,#EEE4D2 100%)', bg='b189', main='#3E3A2A', accent='#A38B4A',
    top=[top('d269', 70, -6, up=0, a=1.2), top('d270', 60, -4, up=0, right=True, a=1.2)],
    hero=[pc('d271', 50, 50, 70)],
    corner=('d265', 'd273'),
    gaps=[gap(pc('d264', 50, 50, 50), h=50), gap(pc('d266', 50, 50, 50), h=48), gap(pc('d277', 44, 50, 50), h=56), gap(pc('d274', 50, 50, 50), h=46)],
    fx=fx('float', n=14, s=(5, 11), d=(7, 13), o=(.5, .95), dot='#D9B95A')),
'peoni-sutra': dict(
    name=('Peoni Sutra', 'Silk Peony'),
    desc=('Peoni merah muda yang berputar pelan di atas kain linen merona, dengan sutra krem di jeda halaman.', 'Pink peonies turning slowly over blush linen, with cream silk between the sections.'),
    tone='light', tags=['catair', 'merahmuda', 'peoni', 'kain'],
    sky='linear-gradient(180deg,#F8ECE6 0,#F5E4DD 55%,#EFD4CE 100%)', bg='b190', main='#55303A', accent='#CF5F7E',
    far=[far('d279', 44, 92, 38, d=.1, move='turn', t=180), far('d282', 34, 4, 58, d=.16, move='turn', t=210)],
    hero=[pc('d280', 48, 50, 72)],
    corner=('d278', 'd283'),
    gaps=[gap(pc('b185', 60, 50, 50), h=40), gap(pc('d279', 44, 50, 50), h=46), gap(pc('b112', 44, 50, 50), h=56), gap(pc('d282', 44, 50, 50), h=46)],
    fx=fx('fall', P('d311', 8), n=11, s=(12, 22), d=(9, 16))),
'sakura-fajar': dict(
    name=('Sakura Fajar', 'Cherry Blossom at Dawn'),
    desc=('Pohon sakura di depan fajar yang dilukis, ranting berbunga dari atas, dan kelopak yang berguguran.', 'A cherry tree before a painted dawn, flowering branches from above and petals coming down.'),
    tone='light', tags=['lukisan', 'merahmuda', 'sakura', 'fajar'],
    sky='linear-gradient(180deg,#9AD4F5 0,#CFEAF6 50%,#F7F3C6 100%)', bg='b23', main='#3A4470', accent='#DE6A92',
    far=[far('d305', 60, 80, 62, d=.1, move='sway', a=.8, t=9)],
    top=[top('d295', 70, -6, up=0, a=1.6), top('d308', 64, -6, up=0, right=True, a=1.6)],
    hero=[pc('d307', 56, 46, 72)],
    corner=('d284', 'd291'),
    gaps=[gap(pc('d304', 50, 50, 50), h=44), gap(pc('d288', 56, 50, 50), h=56), gap(pc('d298', 70, 50, 50), h=40), gap(pc('d301', 46, 50, 50), h=44)],
    fx=fx('fall', P('d311', 8), n=16, s=(11, 22), d=(8, 15))),
'ladang-lavender': dict(
    name=('Ladang Lavender', 'Lavender Field'),
    desc=('Bukit lavender dengan rumah batu di kejauhan, seikat lavender di sampul, dan kelopak ungu yang terbang.', 'A lavender hill with a stone house far off, a bunch of lavender on the cover and violet petals in the air.'),
    tone='light', tags=['catair', 'ungu', 'lavender', 'ladang'],
    sky='linear-gradient(180deg,#EDE7FA 0,#F4EFFB 52%,#FBF2EA 100%)', main='#3D2F63', accent='#8A63C4',
    far=[far('d339', 96, 50, 60, d=.1)],
    foot=[foot('d315', 120, -10, down=10, a=.5)],
    hero=[pc('d313', 46, 50, 70)],
    corner=('d317', 'd326'),
    gaps=[gap(pc('d337', 46, 50, 50), h=58), gap(pc('d323', 46, 50, 50), h=52), gap(pc('d333', 54, 50, 50), h=44), gap(pc('d344', 50, 50, 50), h=52)],
    fx=fx('fall', P('d321', 10), n=14, s=(9, 18), d=(8, 15))),
'pita-lavender': dict(
    name=('Pita Lavender', 'Lavender Ribbon'),
    desc=('Bingkai bunga ungu yang tetap di tempat, pita satin, dan hati dari ranting lavender.', 'A frame of violet flowers that stays in place, a satin bow and a heart made of lavender sprigs.'),
    tone='light', tags=['ungu', 'bingkai', 'pita', 'lembut'],
    sky='linear-gradient(180deg,#FAF7FE 0,#F5F0FB 55%,#EEE6F7 100%)', main='#43326A', accent='#9A78CC',
    far=[far('d341', 96, 50, 50, d=0)],
    hero=[pc('d330', 34, 50, 70)],
    corner=('d324', 'd342'),
    gaps=[gap(pc('d345', 50, 50, 50), h=46), gap(pc('d346', 60, 50, 50), h=24), gap(pc('d336', 46, 50, 50), h=46), gap(pc('d314', 34, 50, 50), h=38)],
    fx=fx('fall', P('d321', 10), n=10, s=(9, 18), d=(9, 16))),
'pantai-biru': dict(
    name=('Pantai Biru', 'Blue Shore'),
    desc=('Langit cerah yang dilukis, ombak di kaki halaman, pohon kelapa, kerang, dan pelikan yang terbang melintas.', 'A bright painted sky, waves at the foot of the page, a coconut palm, shells and a pelican flying across.'),
    tone='light', tags=['lukisan', 'biru', 'pantai', 'laut'],
    sky='linear-gradient(180deg,#8FD8EE 0,#C9ECF4 55%,#F6EFD2 100%)', bg='b6', main='#17506A', accent='#E0803A',
    far=[far('d352', 60, 4, 54, d=.1, move='sway', a=1.4, t=8), far('b22', 56, 84, 34, d=.05, move='drift', t=44)],
    foot=[foot('d360', 124, -12, down=10, d=.4, a=.3)],
    hero=[pc('d358', 40, 50, 72)],
    corner=('d363', 'd375'),
    gaps=[gap(pc('d351', 64, 50, 50), h=46), gap(pc('d362', 46, 50, 50), h=44), gap(pc('d364', 46, 50, 50), h=50), gap(pc('d367', 44, 50, 50), h=38)],
    fx=fx('float', n=8, s=(5, 10), d=(8, 14), o=(.6, 1), dot='#FFFFFF'),
    fly=[fly('c395', 80, 58, 22)]),
'taman-laut': dict(
    name=('Taman Laut', 'Sea Garden'),
    desc=('Anemon dan karang warna-warni di dasar laut, ikan badut di sampul, dan gelembung yang naik.', 'Colourful anemones and coral on the sea floor, a clownfish on the cover and bubbles rising.'),
    tone='dark', tags=['ilustrasi', 'biru', 'laut', 'ceria'],
    sky='linear-gradient(180deg,#0F5E86 0,#0B4A70 52%,#083757 100%)', main='#0B4567', accent='#F28A4B',
    far=[far('d197', 34, 92, 46, d=.1, move='sway', a=2, t=7), far('d198', 34, 6, 64, d=.16, move='sway', a=2, t=8)],
    foot=[foot('d195', 60, -6, down=4, a=1), foot('d194', 50, -4, down=4, right=True, a=1.4)],
    hero=[pc('d196', 50, 50, 70)],
    corner=None,
    gaps=[gap(pc('d185', 46, 50, 50), h=40), gap(pc('d190', 34, 28, 50), pc('d191', 36, 72, 50), h=46), gap(pc('d187', 54, 50, 50), h=38), gap(pc('d192', 42, 50, 50), h=44)],
    fx=fx('rise', n=14, s=(5, 12), d=(8, 14), o=(.4, .85), dot='#DDF6FF'),
    fly=[fly('c401', 70, 58, 24)]),
'hutan-pinus': dict(
    name=('Hutan Pinus', 'Pine Forest'),
    desc=('Hutan pinus berkabut yang dilukis, pondok kayu di sampul, dan burung yang melintas di antara pohon.', 'A painted misty pine forest, a wooden cabin on the cover and a bird crossing between the trees.'),
    tone='light', tags=['lukisan', 'hijau', 'pinus', 'hutan'],
    sky='linear-gradient(180deg,#CFEDEF 0,#E9EEF2 50%,#F5E3EC 100%)', bg='d391', bgpos='50% 100%', main='#22382F', accent='#5B8C6A',
    far=[far('d383', 50, 6, 58, d=.14), far('d387', 50, 94, 62, d=.2)],
    hero=[pc('d389', 54, 50, 72)],
    corner=None,
    gaps=[gap(pc('d388', 50, 50, 50), h=66), gap(pc('d402', 56, 50, 50), h=50), gap(pc('d393', 46, 50, 50), h=52), gap(pc('d384', 60, 50, 50), h=42)],
    fx=fx('float', n=8, s=(5, 10), d=(9, 15), o=(.5, .9), dot='#FFFFFF'),
    fly=[fly('b83', 60, 58, 22)]),
'danau-tenang': dict(
    name=('Danau Tenang', 'Still Lake'),
    desc=('Danau di kaki gunung, dermaga kayu, pondok di tepi air, dan langit berkabut yang dilukis.', 'A lake under the mountains, a wooden jetty, a cabin at the water and a painted misty sky.'),
    tone='light', tags=['lukisan', 'tosca', 'danau', 'gunung'],
    sky='linear-gradient(180deg,#BDE3E6 0,#DDEFEA 55%,#F1F3DE 100%)', bg='b7', bgpos='50% 0', main='#1F4648', accent='#3F8E8A',
    far=[far('b4', 70, 80, 38, d=.05, o=.7)],
    foot=[foot('d401', 110, -5, down=10, a=.3)],
    hero=[pc('d402', 58, 50, 72)],
    corner=None,
    gaps=[gap(pc('d403', 56, 50, 50), h=42), gap(pc('d400', 60, 50, 50), h=50), gap(pc('d397', 56, 50, 50), h=40), gap(pc('d393', 44, 50, 50), h=50)],
    fx=fx('float', n=8, s=(5, 10), d=(9, 15), o=(.5, .9), dot='#FFFFFF'),
    fly=[fly('c395', 80, 58, 24)]),
'kota-malam': dict(
    name=('Kota Malam', 'City at Night'),
    desc=('Siluet kota dengan jendela yang menyala, bulan di atasnya, bintang, dan mobil klasik yang melintas.', 'A city skyline with lit windows, the moon above it, stars and a vintage car driving past.'),
    tone='dark', tags=['malam', 'biru', 'kota', 'modern'],
    sky='linear-gradient(180deg,#0A1030 0,#141C4A 55%,#27306B 100%)', main='#121A44', accent='#E7C65A',
    far=[far('c475', 34, 82, 12, d=-.08, move='breathe', t=11), far('d8', 80, 30, 46, d=.04, move='twinkle', t=3)],
    foot=[foot('d406', 120, -10, down=4, d=.4, a=.1)],
    hero=[pc('d408', 60, 50, 72)],
    corner=None,
    gaps=[gap(pc('d407', 80, 50, 50), h=56), gap(pc('c311', 60, 50, 50), h=32), gap(pc('d404', 80, 50, 50), h=40), gap(pc('c172', 46, 50, 50), h=30)],
    fx=fx('float', n=14, s=(4, 9), d=(7, 13), o=(.5, 1), dot='#FFE9A8'),
    fly=[fly('c329', 96, 86, 16, dy=0)]),
'kebun-anggur': dict(
    name=('Kebun Anggur', 'Vineyard'),
    desc=('Barisan anggur menuju rumah di atas bukit, setandan anggur merah, dan daun musim gugur yang jatuh.', 'Rows of vines leading to a house on the hill, a bunch of red grapes and autumn leaves falling.'),
    tone='light', tags=['lukisan', 'hijau', 'anggur', 'pedesaan'],
    sky='linear-gradient(180deg,#BFDDE2 0,#E8EFE0 55%,#F7EBC8 100%)', bg='b5', main='#3F3A1E', accent='#8A2F4A',
    far=[far('d417', 90, 50, 56, d=.08)],
    foot=[foot('d412', 116, -8, down=12, a=.3)],
    hero=[pc('d409', 56, 50, 72)],
    corner=None,
    gaps=[gap(pc('d414', 46, 50, 50), h=50), gap(pc('d415', 56, 50, 50), h=42), gap(pc('d418', 56, 50, 50), h=50), gap(pc('d416', 46, 50, 50), h=56)],
    fx=fx('fall', P('d53', 8), n=9, s=(12, 22), d=(10, 17))),
'salju-pertama': dict(
    name=('Salju Pertama', 'First Snow'),
    desc=('Cemara bersalju, dahan berselimut salju dari atas, boneka salju, dan kepingan salju yang turun.', 'Snowy firs, a snow-covered branch overhead, a snowman and snowflakes coming down.'),
    tone='light', tags=['catair', 'biru', 'salju', 'musimdingin'],
    sky='linear-gradient(180deg,#C9DDEE 0,#DCE9F3 52%,#EEF4F8 100%)', main='#27405A', accent='#5E8FB8',
    top=[top('d80', 80, -6, up=0, right=True, a=1)],
    foot=[foot('d84', 110, -5, down=8, a=.3)],
    hero=[pc('d83', 44, 50, 70)],
    corner=None,
    gaps=[gap(pc('d85', 44, 50, 50), h=56), gap(pc('d82', 56, 50, 50), h=50), gap(pc('d385', 54, 50, 50), h=52), gap(pc('d92', 40, 50, 50), h=50)],
    fx=fx('fall', P('d77', 6), n=16, s=(10, 22), d=(9, 16), o=(.7, 1))),
'daun-gugur': dict(
    name=('Daun Gugur', 'Autumn Leaves'),
    desc=('Karangan daun musim gugur, bunga matahari dalam kendi, dan daun jingga yang berjatuhan.', 'A wreath of autumn leaves, sunflowers in a jug and orange leaves coming down.'),
    tone='light', tags=['catair', 'jingga', 'musimgugur', 'daun'],
    sky='linear-gradient(180deg,#FFF4E2 0,#FCE8CE 55%,#F5D3AC 100%)', main='#4E2A14', accent='#C8641E',
    far=[far('b291', 120, 50, 30, d=.05, o=.5)],
    hero=[pc('d136', 54, 50, 72)],
    corner=('b163', 'b156'),
    gaps=[gap(pc('c277', 50, 50, 50), h=62), gap(pc('c284', 56, 50, 50), h=46), gap(pc('c275', 54, 50, 50), h=46), gap(pc('c286', 54, 50, 50), h=58)],
    fx=fx('fall', P('d53', 8), n=14, s=(12, 24), d=(9, 16))),
'bulu-angsa': dict(
    name=('Bulu Angsa', 'Swan Feathers'),
    desc=('Bulu putih yang melayang turun di depan biru senja, dengan bunga putih di jeda halaman.', 'White feathers drifting down against a dusk blue, with white flowers between the sections.'),
    tone='dark', tags=['putih', 'biru', 'bulu', 'tenang'],
    sky='linear-gradient(180deg,#3B5574 0,#55718F 52%,#7C93AB 100%)', main='#2E4662', accent='#E8D9B0',
    far=[far('d72', 40, 90, 44, d=.1, move='sway', a=4, t=8)],
    hero=[pc('d64', 46, 50, 70)],
    corner=None,
    gaps=[gap(pc('d65', 50, 50, 50), h=32), gap(pc('d139', 60, 50, 50), h=38), gap(pc('d63', 54, 50, 50), h=32), gap(pc('d62', 60, 50, 50), h=56)],
    fx=fx('fall', P('d62', 8), n=13, s=(16, 34), d=(11, 19), o=(.75, 1))),
'konfeti-emas': dict(
    name=('Konfeti Emas', 'Gold Confetti'),
    desc=('Pita dan konfeti emas yang berjatuhan di atas biru malam, cincin emas, dan balon emas.', 'Gold ribbons and confetti coming down over night blue, gold rings and gold balloons.'),
    tone='dark', tags=['emas', 'malam', 'konfeti', 'pesta'],
    sky='linear-gradient(180deg,#0B1226 0,#111B36 55%,#1A2646 100%)', main='#18233F', accent='#D4A84A',
    top=[top('d104', 70, -4, up=0, a=1), top('d96', 60, -4, up=0, right=True, a=1)],
    hero=[pc('d117', 46, 50, 70)],
    corner=None,
    gaps=[gap(pc('c170', 50, 50, 50), h=34), gap(pc('c290', 46, 50, 50), h=60), gap(pc('d171', 46, 50, 50), h=46), gap(pc('c175', 50, 50, 50), h=30)],
    fx=fx('fall', P('d110', 10) + P('d118', 4), n=16, s=(8, 20), d=(8, 15), o=(.7, 1))),
'geometri-emas': dict(
    name=('Geometri Emas', 'Gold Geometry'),
    desc=('Marmer putih, garis belah ketupat emas, lingkaran emas berdaun, dan cahaya emas yang melayang.', 'White marble, gold diamond lines, a gold ring with leaves and drifting gold light.'),
    tone='light', tags=['emas', 'marmer', 'geometris', 'modern'],
    sky='linear-gradient(180deg,#FBFBFA 0,#F6F5F2 55%,#EFEDE8 100%)', bg='b211', main='#33301F', accent='#B6923C',
    far=[far('d159', 50, 92, 44, d=.08, o=.9), far('d163', 40, 6, 62, d=.14, o=.9)],
    hero=[pc('d141', 50, 50, 72)],
    corner=None,
    gaps=[gap(pc('d158', 40, 50, 50), h=54), gap(pc('c173', 46, 50, 50), h=36), gap(pc('d171', 46, 50, 50), h=46), gap(pc('d139', 60, 50, 50), h=36)],
    fx=fx('float', n=12, s=(5, 10), d=(7, 13), o=(.5, .95), dot='#D9B95A')),
'marmer-emas': dict(
    name=('Marmer Emas', 'Marble and Gold'),
    desc=('Marmer berurat abu dan emas, urat emas yang bergeser saat digulir, cincin, dan peoni putih.', 'Marble veined in grey and gold, gold veins that slide as you scroll, rings and white peonies.'),
    tone='light', tags=['emas', 'marmer', 'formal', 'cincin'],
    sky='linear-gradient(180deg,#F7F5F0 0,#F1EEE6 55%,#E8E3D6 100%)', bg='b214', main='#38331F', accent='#B08A32',
    far=[far('b209', 120, 50, 74, d=.1, o=.8)],
    hero=[pc('c172', 54, 50, 72)],
    corner=('c287', 'd139'),
    gaps=[gap(pc('c164', 46, 50, 50), h=44), gap(pc('c287', 56, 50, 50), h=50), gap(pc('d162', 34, 50, 50), h=44), gap(pc('c180', 36, 50, 50), h=40)],
    fx=fx('float', n=12, s=(5, 10), d=(7, 13), o=(.5, .95), dot='#D9B95A')),

'surat-cinta': dict(
    name=('Surat Cinta', 'Love Letter'),
    desc=('Kertas tua, amplop bersegel lilin merah, sobekan tulisan tangan di sudut, dan pesawat kertas yang melintas.', 'Old paper, an envelope with a red wax seal, torn handwriting in the corner and a paper plane passing by.'),
    tone='light', tags=['kertas', 'vintage', 'surat', 'segel'],
    sky='linear-gradient(180deg,#F8EFDA 0,#F5E9D0 55%,#EEDDBA 100%)', bg='b34', main='#4A3320', accent='#A8322E',
    top=[top('b60', 46, -2, up=0, a=.3), top('b71', 46, -2, up=0, right=True, a=.3)],
    hero=[pc('c199', 46, 50, 72)],
    corner=('b109', 'b120'),
    gaps=[gap(pc('c183', 54, 50, 50), h=46), gap(pc('c207', 30, 30, 50), pc('b53', 24, 70, 50), h=34), gap(pc('c193', 56, 50, 50), h=42), gap(pc('b81', 50, 50, 50), h=42)],
    fx=fx('float', n=8, s=(5, 10), d=(9, 15), o=(.4, .8), dot='#FFFFFF'),
    fly=[fly('b63', 64, 58, 20)]),
'kliping-kenangan': dict(
    name=('Kliping Kenangan', 'Scrapbook'),
    desc=('Halaman kliping: sobekan koran, bunga stiker, bintang dan matahari krayon merah, dan pita di sampul.', 'A scrapbook page: torn newsprint, sticker flowers, red crayon stars and sun and a bow on the cover.'),
    tone='light', tags=['kertas', 'kolase', 'krayon', 'ceria'],
    sky='linear-gradient(180deg,#FAF3E3 0,#F6ECD8 55%,#EFE0C4 100%)', bg='b32', main='#4A2F22', accent='#9C2B2B',
    far=[far('b69', 28, 88, 10, d=-.08, move='turn', t=90), far('b70', 22, 8, 46, d=.1, move='sway', a=6, t=5), far('b68', 20, 92, 62, d=.16, move='sway', a=6, t=6)],
    top=[top('b67', 40, -2, up=0, a=.3)],
    hero=[pc('b125', 40, 50, 72)],
    corner=('b119', 'b135'),
    gaps=[gap(pc('b74', 46, 50, 50), h=58), gap(pc('b124', 44, 30, 50), pc('b118', 34, 72, 50), h=46), gap(pc('b106', 46, 50, 50), h=56), gap(pc('b100', 50, 50, 50), h=30)],
    fx=fx('fall', ['b115p0', 'b115p1', 'b77'], n=8, s=(14, 24), d=(10, 17))),
'perahu-kertas': dict(
    name=('Perahu Kertas', 'Paper Boats'),
    desc=('Perahu kertas yang berlayar melintas, awan coretan, matahari krayon, dan pesawat kertas di langit biru.', 'Paper boats sailing past, a scribbled cloud, a crayon sun and a paper plane in a blue sky.'),
    tone='light', tags=['kertas', 'biru', 'perahu', 'ceria'],
    sky='linear-gradient(180deg,#7CC8F2 0,#C9E9F8 55%,#EAF6FB 100%)', bg='b13', main='#1F4A66', accent='#C4402E',
    far=[far('b69', 26, 88, 10, d=-.08, move='turn', t=90), far('b129', 36, 12, 40, d=.06, move='drift', t=40)],
    foot=[foot('d359', 130, -15, down=30, d=.4, a=.1)],
    hero=[pc('b62', 50, 50, 74)],
    corner=None,
    gaps=[gap(pc('b61', 50, 50, 50), h=36), gap(pc('b63', 50, 50, 50), h=28), gap(pc('b70', 30, 30, 50), pc('b68', 26, 70, 50), h=36), gap(pc('b62', 46, 50, 50), h=32)],
    fx=fx('float', n=10, s=(5, 10), d=(8, 14), o=(.6, 1), dot='#FFFFFF'),
    fly=[fly('b61', 70, 84, 26, dy=0), fly('b63', 56, 58, 18)]),
'jendela-tua': dict(
    name=('Jendela Tua', 'Old Windows'),
    desc=('Jendela kayu yang terbuka, lengkung batu berukir, jendela kaca patri berbalut ivy, dan daun yang jatuh.', 'An open wooden window, a carved stone arch, a stained-glass window wrapped in ivy and falling leaves.'),
    tone='light', tags=['vintage', 'krem', 'jendela', 'lengkung'],
    sky='linear-gradient(180deg,#F6F1E6 0,#F1EADB 55%,#E8DEC8 100%)', bg='b203', main='#3D3222', accent='#7C6A3E',
    top=[top('199', 104, -2, up=14)],
    hero=[pc('d151', 54, 50, 72)],
    corner=('211', '218'),
    gaps=[gap(pc('d157', 60, 50, 50), h=62), gap(pc('d148', 40, 50, 50), h=80), gap(pc('d142', 40, 28, 50), pc('d154', 38, 72, 50), h=66), gap(pc('d150', 40, 50, 50), h=78)],
    fx=fx('fall', P('d51', 8), n=8, s=(14, 26), d=(10, 17))),
'karangan-daun': dict(
    name=('Karangan Daun', 'Leaf Wreaths'),
    desc=('Karangan daun zaitun dan eukaliptus, lingkaran emas berdaun, dan daun hijau yang melayang turun.', 'Wreaths of olive and eucalyptus, a gold ring with leaves and green leaves drifting down.'),
    tone='light', tags=['hijau', 'karangan', 'minimalis', 'segar'],
    sky='linear-gradient(180deg,#F7FAF3 0,#F1F6EB 55%,#E7EFDD 100%)', main='#2F4630', accent='#6E9A64',
    hero=[pc('d130', 54, 50, 72)],
    corner=('d139', 'd324'),
    gaps=[gap(pc('d134', 50, 50, 50), h=54), gap(pc('d141', 50, 50, 50), h=50), gap(pc('d138', 50, 50, 50), h=54), gap(pc('d135', 50, 50, 50), h=54)],
    fx=fx('fall', P('d51', 8), n=10, s=(14, 26), d=(10, 17))),
'mobil-klasik': dict(
    name=('Mobil Klasik', 'Vintage Cars'),
    desc=('Langit cerah di atas padang rumput, mobil klasik yang melintas di kaki halaman, dan matahari yang berputar.', 'A bright sky over a meadow, vintage cars driving past at the foot of the page and a turning sun.'),
    tone='light', tags=['ilustrasi', 'biru', 'mobil', 'vintage'],
    sky='linear-gradient(180deg,#8FCDF5 0,#CFE9F8 55%,#DDF0C8 100%)', bg='b12', bgpos='50% 100%', main='#22486A', accent='#C44A32',
    far=[far('d25', 26, 88, 9, d=-.1, move='turn', t=120), far('b22', 56, 14, 28, d=.05, move='drift', t=44)],
    hero=[pc('c319', 64, 50, 74)],
    corner=None,
    gaps=[gap(pc('c303', 56, 50, 50), h=44), gap(pc('c307', 60, 50, 50), h=36), gap(pc('c305', 58, 50, 50), h=40), gap(pc('c306', 46, 50, 50), h=44)],
    fx=fx('float', n=8, s=(5, 10), d=(8, 14), o=(.6, 1), dot='#FFFFFF'),
    fly=[fly('c299', 110, 88, 14, dy=0), fly('c304', 90, 90, 19, dy=0, flip=True)]),
'safari-ceria': dict(
    name=('Safari Ceria', 'Happy Safari'),
    desc=('Jerapah, zebra, singa, dan flamingo yang dilukis cat air, di bawah matahari besar; untuk undangan yang ceria.', 'A giraffe, a zebra, a lion and flamingos in watercolour, under a big sun; for a playful invitation.'),
    tone='light', tags=['catair', 'kuning', 'hewan', 'ceria'],
    sky='linear-gradient(180deg,#FFF0C9 0,#FFE9C0 50%,#F6DDA8 100%)', main='#4A3418', accent='#C97F24',
    far=[far('d30', 34, 86, 10, d=-.1, move='turn', t=130)],
    foot=[foot('b14', 124, -12, down=34, d=.4, a=.3)],
    hero=[pc('c370', 44, 50, 72)],
    corner=None,
    gaps=[gap(pc('c374', 54, 50, 50), h=46), gap(pc('c383', 46, 50, 50), h=56), gap(pc('c379', 54, 50, 50), h=52), gap(pc('c385', 54, 50, 50), h=40)],
    fx=fx('float', n=8, s=(5, 10), d=(8, 14), o=(.5, .9), dot='#FFFFFF'),
    fly=[fly('c395', 80, 58, 22)]),
'kawan-hutan': dict(
    name=('Kawan Hutan', 'Woodland Friends'),
    desc=('Anak rusa, tupai, rubah kecil, dan burung robin di hutan pinus, dengan daun yang jatuh pelan.', 'A fawn, a squirrel, a small fox and a robin in a pine wood, with leaves falling slowly.'),
    tone='light', tags=['catair', 'hijau', 'hewan', 'hutan'],
    sky='linear-gradient(180deg,#E4F1E4 0,#EEF5E6 52%,#F8F4DC 100%)', main='#2B4630', accent='#B4672E',
    far=[far('d383', 46, 6, 56, d=.12), far('d393', 50, 94, 60, d=.18)],
    foot=[foot('d384', 110, -5, down=20, a=.3)],
    hero=[pc('c361', 44, 50, 72)],
    corner=None,
    gaps=[gap(pc('c362', 46, 50, 50), h=50), gap(pc('c365', 50, 50, 50), h=40), gap(pc('c384', 44, 50, 50), h=36), gap(pc('c394', 44, 50, 50), h=36)],
    fx=fx('fall', P('d53', 8), n=8, s=(12, 22), d=(10, 17)),
    fly=[fly('c368', 56, 58, 20)]),
'buket-pengantin': dict(
    name=('Buket Pengantin', 'Bridal Bouquet'),
    desc=('Buket peoni merah anggur dan putih di sampul, buket yang berbeda di tiap jeda, dan sapuan cat air merah muda.', 'A bouquet of wine red and white peonies on the cover, a different bouquet at each pause and a pink watercolour wash.'),
    tone='light', tags=['catair', 'merahmuda', 'buket', 'peoni'],
    sky='linear-gradient(180deg,#FFF6F6 0,#FCEBEE 55%,#F6D9E0 100%)', main='#57283A', accent='#B9456B',
    far=[far('b255', 110, 50, 36, d=.05, o=.5)],
    hero=[pc('c261', 56, 50, 72)],
    corner=('c287', 'd278'),
    gaps=[gap(pc('c297', 52, 50, 50), h=58), gap(pc('c272', 50, 50, 50), h=64), gap(pc('c266', 50, 50, 50), h=62), gap(pc('c265', 48, 50, 50), h=62)],
    fx=fx('fall', P('d311', 8), n=11, s=(12, 22), d=(9, 16))),
'mawar-merah': dict(
    name=('Mawar Merah', 'Red Roses'),
    desc=('Buket mawar merah, amplop merah marun dengan segel lilin, dan kelopak yang jatuh di atas krem hangat.', 'A bouquet of red roses, a maroon envelope with a wax seal and petals falling over warm cream.'),
    tone='light', tags=['merah', 'mawar', 'romantis', 'segel'],
    sky='linear-gradient(180deg,#FBF4EC 0,#F8EAE0 55%,#F1D7CC 100%)', main='#4D1616', accent='#B3202A',
    far=[far('b264', 110, 50, 34, d=.05, o=.35)],
    hero=[pc('c264', 50, 50, 72)],
    corner=('b127', 'b158'),
    gaps=[gap(pc('c270', 50, 50, 50), h=56), gap(pc('c209', 44, 50, 50), h=58), gap(pc('c207', 34, 50, 50), h=38), gap(pc('c269', 48, 50, 50), h=56)],
    fx=fx('fall', ['b77', 'b115p0'], n=10, s=(12, 22), d=(9, 16))),
'bunga-matahari': dict(
    name=('Bunga Matahari', 'Sunflowers'),
    desc=('Bunga matahari yang kelopaknya lepas, buket dalam kendi hijau, dan sapuan kuning hangat.', 'A sunflower shedding petals, a bouquet in a green jug and a warm yellow wash.'),
    tone='light', tags=['catair', 'kuning', 'matahari', 'ceria'],
    sky='linear-gradient(180deg,#FFFBEA 0,#FFF3CF 55%,#FBE3A6 100%)', main='#4A3A12', accent='#D49A12',
    far=[far('b241', 110, 50, 30, d=.05, o=.6)],
    hero=[pc('c284', 60, 50, 72)],
    corner=('b156', 'b150'),
    gaps=[gap(pc('b182', 60, 50, 50), h=40), gap(pc('c277', 50, 50, 50), h=64), gap(pc('c286', 54, 50, 50), h=58), gap(pc('c271', 46, 50, 50), h=58)],
    fx=fx('fall', ['b182p1', 'b182p2', 'b182p3'], n=9, s=(10, 18), d=(10, 17))),
'pesta-merah-muda': dict(
    name=('Pesta Merah Muda', 'Pink Party'),
    desc=('Balon merah muda yang naik, kue bertingkat, kado berpita, dan mahkota; untuk lamaran, ulang tahun, atau syukuran.', 'Pink balloons rising, a tiered cake, gifts with bows and a crown; for an engagement, a birthday or a thanksgiving.'),
    tone='light', tags=['catair', 'merahmuda', 'balon', 'pesta'],
    sky='linear-gradient(180deg,#FFF5F8 0,#FFE9F0 55%,#FBD7E3 100%)', main='#5C2A44', accent='#E0668F',
    far=[far('c229', 30, 8, 44, d=-.1, move='sway', a=3, t=7), far('c232', 36, 92, 56, d=-.06, move='sway', a=3, t=8)],
    hero=[pc('c241', 44, 50, 70)],
    corner=None,
    gaps=[gap(pc('c231', 46, 50, 50), h=48), gap(pc('c237', 46, 50, 50), h=32), gap(pc('c248', 46, 50, 50), h=62), gap(pc('c250', 44, 50, 50), h=50)],
    fx=fx('rise', ['c247', 'c236p0'], n=8, s=(22, 40), d=(11, 19), o=(.8, 1))),
'kebaya-beskap': dict(
    name=('Kebaya dan Beskap', 'Kebaya and Beskap'),
    desc=('Kebaya renda merah muda di sampul, beskap biru tua dan kebaya encim di tiap jeda, dengan hiasan bunga Betawi.', 'A pink lace kebaya on the cover, a navy beskap and embroidered kebaya at each pause, with a Betawi floral ornament.'),
    tone='light', tags=['ilustrasi', 'nusantara', 'kebaya', 'busana'],
    sky='linear-gradient(180deg,#FFF7EC 0,#FCEEDD 55%,#F6DEC6 100%)', main='#4A2A20', accent='#C2603A',
    top=[top('b299', 56, 22, up=0, a=1)],
    hero=[pc('b333', 44, 50, 72)],
    corner=('c36', 'c38'),
    gaps=[gap(pc('b303', 46, 50, 50), h=50), gap(pc('b293', 44, 28, 50), pc('b294', 44, 72, 50), h=52), gap(pc('b342', 44, 50, 50), h=50), gap(pc('b336', 36, 30, 50), pc('b341', 36, 70, 50), h=62)],
    fx=fx('float', n=10, s=(5, 10), d=(8, 14), o=(.5, .9), dot='#F0D48A')),
'linen-putih': dict(
    name=('Linen Putih', 'White Linen'),
    desc=('Kain linen putih, gulungan linen berikat gandum, sutra krem, dan goni di jeda halaman.', 'White linen, a roll of linen tied with wheat, cream silk and burlap between the sections.'),
    tone='light', tags=['kain', 'putih', 'boho', 'minimalis'],
    sky='linear-gradient(180deg,#FAF8F3 0,#F5F1E9 55%,#ECE5D8 100%)', bg='b183', main='#3F382A', accent='#A08A5E',
    hero=[pc('b187', 46, 50, 72)],
    corner=None,
    gaps=[gap(pc('b185', 60, 50, 50), h=40), gap(pc('b192', 44, 50, 50), h=42), gap(pc('b196', 50, 50, 50), h=48), gap(pc('b195', 50, 50, 50), h=44)],
    fx=fx('float', n=10, s=(5, 10), d=(8, 14), o=(.4, .8), dot='#FFFFFF')),
'sapuan-warna': dict(
    name=('Sapuan Warna', 'Colour Wash'),
    desc=('Sapuan cat air ungu, biru, dan jingga yang bergeser saat digulir; tanpa bunga, tanpa hiasan lain.', 'Washes of violet, blue and orange watercolour that slide as you scroll; no flowers and nothing else.'),
    tone='light', tags=['catair', 'warnawarni', 'abstrak', 'modern'],
    sky='linear-gradient(180deg,#FFFFFF 0,#FBFAFD 55%,#F4F1F8 100%)', main='#3A2F5C', accent='#8F58C8',
    far=[far('b277', 90, 84, 20, d=.06, o=.8), far('b292', 80, 10, 52, d=.14, o=.85), far('b288', 70, 86, 84, d=.24, o=.85)],
    hero=[pc('b271', 60, 50, 72)],
    corner=None,
    gaps=[gap(pc('b276', 60, 50, 50), h=30), gap(pc('b290', 54, 50, 50), h=42), gap(pc('b284', 60, 50, 50), h=34), gap(pc('b275', 50, 50, 50), h=46)],
    fx=fx('float', n=10, s=(5, 10), d=(8, 14), o=(.5, .9), dot='#C9B2EE')),
'tinta-biru': dict(
    name=('Tinta Biru', 'Blue Ink'),
    desc=('Tinta biru yang mekar di atas putih, sapuan biru yang bergeser saat digulir, dan urat emas yang tipis.', 'Blue ink blooming on white, blue washes that slide as you scroll and fine veins of gold.'),
    tone='light', tags=['catair', 'biru', 'abstrak', 'modern'],
    sky='linear-gradient(180deg,#FFFFFF 0,#F7FAFD 55%,#EAF1F8 100%)', main='#173A5E', accent='#2F6FA8',
    far=[far('b235', 60, 98, 6, d=.06, o=.9), far('b260', 80, 10, 54, d=.14, o=.8), far('b209', 110, 50, 80, d=.2, o=.7)],
    hero=[pc('b245', 50, 50, 72)],
    corner=None,
    gaps=[gap(pc('b279', 50, 50, 50), h=44), gap(pc('b259', 60, 50, 50), h=24), gap(pc('b236', 60, 50, 50), h=40), gap(pc('b278', 54, 50, 50), h=46)],
    fx=fx('float', n=10, s=(5, 10), d=(8, 14), o=(.5, .9), dot='#9CC3E8')),
'matahari-pagi': dict(
    name=('Matahari Pagi', 'Morning Sun'),
    desc=('Matahari besar yang berputar pelan di langit pucat, awan yang bergeser, dan bunga aster putih.', 'A large sun turning slowly in a pale sky, drifting clouds and white daisies.'),
    tone='light', tags=['catair', 'kuning', 'matahari', 'cerah'],
    sky='linear-gradient(180deg,#D9EEFB 0,#F1F8F4 50%,#FFF6CF 100%)', bg='b15', main='#3A4A5E', accent='#E0A21A',
    far=[far('d32', 44, 92, 5, d=-.1, move='turn', t=160), far('b19', 60, 14, 40, d=.06, move='drift', t=44), far('b20', 50, 88, 58, d=.12, move='drift', t=38)],
    foot=[foot('233', 112, -6, down=34, d=.4, a=.4)],
    hero=[pc('b119', 44, 50, 74)],
    corner=('b119', 'b167'),
    gaps=[gap(pc('d24', 40, 50, 50), h=44), gap(pc('d28', 46, 50, 50), h=40), gap(pc('d30', 40, 50, 50), h=44), gap(pc('d36', 40, 50, 50), h=44)],
    fx=fx('float', n=10, s=(5, 10), d=(8, 14), o=(.6, 1), dot='#FFFFFF')),
'taburan-bintang': dict(
    name=('Taburan Bintang', 'Scattered Stars'),
    desc=('Bintang krayon dan bintang cat air di langit biru tua, bulan sabit ungu, dan bintang yang jatuh pelan.', 'Crayon and watercolour stars in a deep blue sky, a violet crescent and stars falling slowly.'),
    tone='dark', tags=['catair', 'biru', 'bintang', 'ceria'],
    sky='linear-gradient(180deg,#101C4A 0,#1B2C68 52%,#2D4590 100%)', main='#16245A', accent='#F2C445',
    far=[far('d14', 30, 92, 6, d=-.08, move='breathe', t=10), far('d10', 70, 30, 48, d=.06, move='twinkle', t=3), far('d16', 30, 86, 60, d=.12, move='twinkle', t=2.4)],
    hero=[pc('d1', 40, 50, 72)],
    corner=('d17', 'd20'),
    gaps=[gap(pc('d20', 46, 50, 50), h=46), gap(pc('d2', 36, 50, 50), h=40), gap(pc('d13', 40, 50, 50), h=44), gap(pc('d7', 40, 50, 50), h=40)],
    fx=fx('fall', P('d3', 8) + ['d17p0'], n=12, s=(8, 18), d=(9, 16), o=(.6, 1))),
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
    """Open piece `key`: trimmed to what is drawn, turned as its letters say.
    A key may start with b, c or d: the picture comes from art directory 2, 3 or 4 (shrunk copies in PACK/<letter>/n.webp).
    Directory 3 has white backgrounds: the white around the drawing is cut away; the letter m after the number
    instead turns white into transparency everywhere (for glows and lights)."""
    from PIL import Image, ImageFilter
    import numpy as np
    from scipy import ndimage
    Image.MAX_IMAGE_PIXELS = None
    m = re.match(r'^([bcd]?)(\d+)(?:p(\d+))?([vhrm]*)(?:c([ubyw]))?$', key)
    pre, n, part, ops, col = m.group(1), int(m.group(2)), m.group(3), m.group(4), m.group(5)
    if pre: im = Image.open(os.path.join(PACK, pre, '%d.webp' % n))
    else: im = Image.open(os.path.join(src, '%d.png' % n))
    if im.mode != 'RGBA' and 'm' not in ops and pre == 'c':
        rgb_ = np.array(im.convert('RGB')).astype(np.int32)
        white = rgb_.min(-1) > 236
        lab, cnt = ndimage.label(white)
        edge = set(lab[0].tolist()) | set(lab[-1].tolist()) | set(lab[:, 0].tolist()) | set(lab[:, -1].tolist()); edge.discard(0)
        bg = np.isin(lab, list(edge))
        bg = ndimage.binary_dilation(bg, iterations=2)
        al = Image.fromarray(np.where(bg, 0, 255).astype('uint8')).filter(ImageFilter.GaussianBlur(1.1))
        im = im.convert('RGB'); im.putalpha(al)
    elif 'm' in ops:
        c = np.array(im.convert('RGB')).astype(np.float32) / 255
        al = 1 - c.min(-1)
        al = np.clip(al * 1.35, 0, 1)
        safe = np.maximum(al, 1e-3)[..., None]
        col_ = np.clip((c - (1 - al[..., None])) / safe, 0, 1)
        im = Image.fromarray(np.concatenate([col_ * 255, al[..., None] * 255], -1).astype('uint8'), 'RGBA')
    im = im.convert('RGBA')
    a = np.array(im)[..., 3]
    if part is not None:
        f = max(1, max(im.size) // 1000)
        small = np.array(im.resize((im.width // f, im.height // f)))[..., 3] > 40
        small = ndimage.binary_dilation(small, iterations=3)
        lab, cnt = ndimage.label(small)
        boxes = ndimage.find_objects(lab)
        sizes = sorted(((int((lab[b] == i + 1).sum()), i) for i, b in enumerate(boxes)), reverse=True)
        idx = sizes[int(part) % len(sizes)][1]
        ys, xs = boxes[idx]
        box = (max(0, xs.start * f - 8), max(0, ys.start * f - 8), min(im.width, xs.stop * f + 8), min(im.height, ys.stop * f + 8))
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
        if re.match(r'^(h[bcd]?\d|sky-)', f): os.remove(os.path.join(OUT, f))
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
    for key in sorted(set(T['bg'] for T in THEMES.values() if T.get('bg'))):
        im = cut(src, key).convert('RGB')
        w = 720; h = round(im.height * w / im.width)
        if h > 1400: h = 1400; w = round(im.width * h / im.height)
        im = im.resize((w, h), Image.LANCZOS)
        path = os.path.join(OUT, 'sky-%s.webp' % key)
        im.save(path, 'WEBP', quality=72, method=6); total += os.path.getsize(path)
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
    used = set(re.findall(r'"(h[bcd]?\d+[a-z0-9]*)"', json.dumps(data)))
    out = ('/* Written by tools/hidup.py: the living Dasar themes and their pieces. Do not edit by hand. */\n'
           'window.NAWALA_HIDUP = ' + json.dumps({'r': {k: v for k, v in ratios.items() if k in used}, 'themes': data}, separators=(',', ':')) + ';\n')
    open(os.path.join(ROOT, 'undangan', 'hidup-data.js'), 'w').write(out)

    css = []
    for slug, T in THEMES.items():
        p = palette(T)
        c = T.get('corner')
        bunga = ('--bunga:url("../assets/img/hidup/h%s.webp");--bunga2:url("../assets/img/hidup/h%s.webp");' % c) if c else ''
        sky = T['sky']
        if T.get('bg'): sky = 'url("../assets/img/hidup/sky-%s.webp") %s/cover no-repeat,%s' % (T['bg'], T.get('bgpos', '50% 50%'), sky)
        css.append('[data-theme="%s"]{--plate:url("../assets/img/hidup/plate-%s.webp");--hd-sky:%s;%s--tone:%s;--main:%s;--main-rgb:%s;--accent:%s;--accent-rgb:%s;--accent-soft:%s;--accent-wash:%s;--paper:%s;--paper-2:%s;--mist:%s;--deep:%s}'
                   % (slug, slug, sky, bunga, p['tone'], p['main'], p['main_rgb'], p['accent'], p['accent_rgb'], p['soft'], p['wash'], p['paper'], p['paper2'], p['paper2'], p['deep']))
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
