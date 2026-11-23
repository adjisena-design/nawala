"""Seni: the drawn illustrations for the home page's platform cards and the journal (owner, 23 Nov 2026: "add an
illustration made in SVG for each card", "an artwork made by your SVG generation, not Higgs ones").
One flat, quiet style: a blush-to-ivory sky, a pale gold sun, soft white hills, the object drawn in charcoal lines
over white, pink and gold accents. No faces. Every id is prefixed with the key so several can sit on one page."""

INK = '#3A3035'
ROSE = '#D8436B'
BLUSH = '#FBDCE6'
PINK = '#F4A6C0'
GOLD = '#F6C445'
GOLDS = '#FFE9A8'
IVORY = '#FFFDFB'
DEEP = '#8E2F52'

def frame(k, inner, sky=('#FFF7EF', '#FBDCE6'), sun=(318, 58)):
    return (f'<svg class="art" viewBox="0 0 400 240" role="img" aria-hidden="true" focusable="false" preserveAspectRatio="xMidYMid slice">'
            f'<defs><linearGradient id="{k}-s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="{sky[0]}"/><stop offset="1" stop-color="{sky[1]}"/></linearGradient>'
            f'<radialGradient id="{k}-g" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="{GOLDS}"/><stop offset="1" stop-color="{GOLDS}" stop-opacity="0"/></radialGradient></defs>'
            f'<rect width="400" height="240" fill="url(#{k}-s)"/>'
            f'<circle cx="{sun[0]}" cy="{sun[1]}" r="70" fill="url(#{k}-g)"/><circle cx="{sun[0]}" cy="{sun[1]}" r="26" fill="{GOLDS}"/>'
            f'<path d="M0 196c60-26 120-30 190-14s140 18 210-8v66H0Z" fill="#fff" opacity=".7"/>'
            f'<path d="M0 214c80-18 150-16 220-4s120 10 180-6v36H0Z" fill="#fff" opacity=".9"/>'
            f'<g fill="none" stroke="{INK}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">{inner}</g></svg>')

def wing(x, y, s=1, flip=False):
    """a small winged letter, Nawala's sign, drawn in lines"""
    f = -1 if flip else 1
    return (f'<g transform="translate({x} {y}) scale({s * f} {s})">'
            f'<rect x="-14" y="-9" width="28" height="19" rx="3" fill="#fff"/><path d="m-14-8 14 10 14-10"/>'
            f'<path d="M-14-2c-10-8-20-8-24-2 7 0 12 3 16 8M14-2c10-8 20-8 24-2-7 0-12 3-16 8" fill="{BLUSH}"/>'
            f'<circle cx="0" cy="4" r="3.2" fill="{ROSE}" stroke="none"/></g>')

def phone(x, y, w=86, h=150, screen=''):
    return (f'<g transform="translate({x} {y})"><rect width="{w}" height="{h}" rx="14" fill="#fff"/>'
            f'<rect x="7" y="12" width="{w - 14}" height="{h - 24}" rx="7" fill="{IVORY}" stroke="none"/>'
            f'<path d="M{w / 2 - 9} 6.5h18"/>{screen}</g>')

ART = {}

# ---- the platform cards -------------------------------------------------------------------------------
ART['undangan-digital'] = lambda k: frame(k, ''.join([
    phone(70, 52, screen=(f'<rect x="16" y="22" width="54" height="66" rx="6" fill="{BLUSH}" stroke="none"/>'
                          f'<path d="M22 34h42M28 44h30" stroke="{DEEP}"/><circle cx="43" cy="66" r="10" fill="{ROSE}" stroke="none"/>'
                          f'<path d="M38 66h10" stroke="#fff"/><path d="M18 104h50M18 116h34"/>')),
    # an open envelope with the card rising
    f'<path d="M196 118h116v76H196Z" fill="#fff"/><path d="m196 118 58 40 58-40" fill="{BLUSH}"/>',
    f'<rect x="214" y="80" width="80" height="58" rx="5" fill="#fff"/><path d="M226 96h56M232 108h44M238 120h32" stroke="{ROSE}"/>',
    f'<path d="m196 194 46-34M312 194l-46-34"/>',
    # a WhatsApp-style bubble with ticks
    f'<path d="M168 40h70a10 10 0 0 1 10 10v16a10 10 0 0 1-10 10h-52l-12 10v-10h-6a10 10 0 0 1-10-10V50a10 10 0 0 1 10-10Z" fill="#fff"/>',
    f'<path d="M172 56h40M172 66h26"/><path d="m218 66 4 4 7-8m-1 8 7-8" stroke="{ROSE}"/>',
    wing(346, 120, .9),
]))

ART['buku-tamu-digital'] = lambda k: frame(k, ''.join([
    # the welcome screen on a stand
    f'<rect x="196" y="46" width="160" height="92" rx="8" fill="#fff"/><rect x="204" y="54" width="144" height="76" rx="4" fill="{BLUSH}" stroke="none"/>',
    f'<path d="M230 80h92" stroke="{DEEP}"/><path d="M244 96h64M254 110h44" stroke="{ROSE}"/><path d="M276 138v38M256 176h40"/>',
    # a tablet scanning a phone
    f'<rect x="58" y="84" width="84" height="110" rx="10" fill="#fff" transform="rotate(-8 100 139)"/>',
    f'<g transform="rotate(-8 100 139)"><rect x="72" y="104" width="40" height="40" fill="{IVORY}"/>'
    f'<path d="M78 110h10v10H78zM96 110h10v10H96zM78 128h10v10H78zM98 130h6v6h-6z" fill="{INK}" stroke="none"/>'
    f'<path d="M64 160h72" stroke="{ROSE}" stroke-dasharray="4 5"/></g>',
    f'<path d="M150 120c10-8 20-8 30 0M154 132c7-5 15-5 22 0" stroke="{ROSE}"/>',
    f'<path d="m156 168 10 10 20-20" stroke="{ROSE}" stroke-width="3"/>',
]))

ART['live-streaming'] = lambda k: frame(k, ''.join([
    # screen with the arch and a live pill
    f'<rect x="168" y="40" width="190" height="118" rx="10" fill="#fff"/><rect x="178" y="50" width="170" height="98" rx="5" fill="{BLUSH}" stroke="none"/>',
    f'<path d="M224 148v-40a39 39 0 0 1 78 0v40" fill="{IVORY}" stroke="{DEEP}"/>',
    f'<rect x="186" y="58" width="44" height="16" rx="8" fill="{ROSE}" stroke="none"/><circle cx="196" cy="66" r="3" fill="#fff" stroke="none"/>',
    f'<path d="M203 66h18" stroke="#fff" stroke-width="2"/><path d="M262 158v22M238 182h48"/>',
    # camera on a tripod
    f'<rect x="54" y="92" width="74" height="46" rx="8" fill="#fff"/><path d="m128 104 22-12v46l-22-12" fill="{BLUSH}"/>',
    f'<circle cx="80" cy="115" r="12" fill="{IVORY}"/><circle cx="80" cy="115" r="5" fill="{INK}" stroke="none"/>',
    f'<path d="M90 138 72 200M92 138l2 62M94 138l22 62"/><circle cx="116" cy="102" r="3" fill="{ROSE}" stroke="none"/>',
    f'<path d="M150 74c6-6 12-6 18 0M146 64c9-9 19-9 28 0" stroke="{GOLD}"/>',
]))

ART['persiapan'] = lambda k: frame(k, ''.join([
    f'<rect x="54" y="38" width="292" height="150" rx="12" fill="#fff"/>',
    ''.join(f'<path d="M{70 + i * 92} 54h74" stroke="{c}"/>' for i, c in enumerate([INK, GOLD, ROSE])),
    ''.join(f'<rect x="{70 + i * 92}" y="{66 + j * 30}" width="74" height="22" rx="5" fill="{f}" stroke="none"/>'
            for i, rows in enumerate([[BLUSH, BLUSH, '#F3EEEA'], [GOLDS, BLUSH], [PINK]]) for j, f in enumerate(rows)),
    f'<path d="m236 150 6 6 12-12" stroke="{ROSE}"/>',
    # gantt bars below the board
    f'<path d="M70 196h90M110 208h120M150 220h96" stroke="{ROSE}" stroke-width="6"/>',
    f'<path d="M246 190v36" stroke="{GOLD}" stroke-dasharray="3 4"/>',
    wing(352, 70, .8, True),
]))

ART['rsvp-asisten'] = lambda k: frame(k, ''.join([
    phone(64, 46, screen=(f'<path d="M14 24h44a6 6 0 0 1 6 6v8a6 6 0 0 1-6 6H22l-8 6Z" fill="{BLUSH}" stroke="none"/>'
                          f'<path d="M72 60H30a6 6 0 0 0-6 6v8a6 6 0 0 0 6 6h34l8 6Z" fill="#fff"/>'
                          f'<path d="M20 32h30M30 70h28"/><path d="m50 76 3 3 6-6" stroke="{ROSE}"/>'
                          f'<path d="M14 94h44a6 6 0 0 1 6 6v8a6 6 0 0 1-6 6H22l-8 6Z" fill="{BLUSH}" stroke="none"/><path d="M20 102h34"/>')),
    # the guest list with ticks and party sizes
    f'<rect x="184" y="48" width="160" height="140" rx="10" fill="#fff"/>',
    ''.join(f'<path d="M200 {74 + i * 28}h70"/><rect x="292" y="{64 + i * 28}" width="38" height="20" rx="10" fill="{c}" stroke="none"/>'
            f'<path d="M302 {74 + i * 28}h18" stroke="{INK}" stroke-width="2"/>' for i, c in enumerate([BLUSH, GOLDS, BLUSH, '#F3EEEA'])),
    f'<path d="m272 70 4 4 8-8m-12 32 4 4 8-8m-12 32 4 4 8-8" stroke="{ROSE}"/>',
    # a handset
    f'<path d="M168 168c-6 6-14 4-20-2s-8-14-2-20l6 6-3 4c2 4 5 7 9 9l4-3Z" fill="{GOLDS}"/>',
]))

# ---- the journal ----------------------------------------------------------------------------------------
ART['cara-mengirim-undangan-digital'] = lambda k: frame(k, ''.join([
    phone(150, 40, 100, 168, screen=(''.join(f'<path d="M{14 if i % 2 == 0 else 34} {24 + i * 30}h{52 if i % 2 == 0 else 52}a6 6 0 0 1 6 6v6a6 6 0 0 1-6 6H{14 if i % 2 == 0 else 34}Z" fill="{BLUSH if i % 2 == 0 else "#fff"}"/>' for i in range(4)))),
    wing(92, 92, 1.1), wing(312, 128, .8, True),
    f'<path d="M110 112c12 10 24 14 38 14M290 120c-12 4-22 4-34 0" stroke="{ROSE}" stroke-dasharray="3 6"/>',
]), sky=('#FFF8F0', '#FDE6EE'))

ART['menyusun-denah-meja-resepsi'] = lambda k: frame(k, ''.join([
    f'<rect x="66" y="40" width="268" height="160" rx="8" fill="#fff"/><rect x="150" y="50" width="100" height="22" rx="4" fill="{BLUSH}" stroke="none"/>',
    f'<path d="M184 61h32" stroke="{DEEP}"/><path d="M200 78v114" stroke="{GOLD}" stroke-dasharray="4 5"/>',
    ''.join(f'<circle cx="{x}" cy="{y}" r="17" fill="{ROSE if (x, y) == (130, 160) else IVORY}"/>'
            + ''.join(f'<circle cx="{x + 25 * c}" cy="{y + 25 * s}" r="4" fill="{PINK}" stroke="none"/>' for c, s in [(1, 0), (-1, 0), (0, 1), (0, -1), (.7, .7), (-.7, .7), (.7, -.7), (-.7, -.7)])
            for x, y in [(110, 108), (130, 160), (290, 108), (270, 160)]),
]))

ART['menyusun-anggaran-pernikahan'] = lambda k: frame(k, ''.join([
    f'<rect x="60" y="44" width="170" height="150" rx="10" fill="#fff"/>',
    ''.join(f'<path d="M78 {72 + i * 24}h82"/><path d="M180 {72 + i * 24}h32" stroke="{ROSE if i == 2 else INK}"/>' for i in range(5)),
    f'<circle cx="300" cy="112" r="50" fill="{BLUSH}"/><path d="M300 112V62a50 50 0 0 1 47 66Z" fill="{GOLDS}"/><path d="M300 112l47 16a50 50 0 0 1-30 31Z" fill="{ROSE}" stroke="{INK}"/>',
    ''.join(f'<ellipse cx="{x}" cy="{y}" rx="16" ry="6" fill="{GOLDS}"/>' for x, y in [(282, 196), (282, 188), (282, 180), (316, 196), (316, 188)]),
]))

ART['persiapan-live-streaming-pernikahan'] = lambda k: frame(k, ''.join([
    f'<rect x="200" y="58" width="140" height="92" rx="8" fill="#fff"/><path d="M240 150v-34a30 30 0 0 1 60 0v34" fill="{BLUSH}" stroke="{DEEP}"/>',
    f'<rect x="210" y="66" width="38" height="14" rx="7" fill="{ROSE}" stroke="none"/>',
    f'<rect x="70" y="90" width="80" height="50" rx="8" fill="#fff"/><path d="m150 102 24-12v50l-24-12" fill="{BLUSH}"/>',
    f'<circle cx="98" cy="115" r="13" fill="{IVORY}"/><circle cx="98" cy="115" r="5" fill="{INK}" stroke="none"/>',
    f'<path d="M110 140 90 200M112 140v60M114 140l20 60"/>',
    f'<path d="M178 80c5-5 11-5 16 0M174 70c8-8 16-8 24 0" stroke="{GOLD}"/>',
]), sky=('#FFF6EC', '#FBE0E8'))

ART['etika-mengirim-undangan-whatsapp'] = lambda k: frame(k, ''.join([
    f'<path d="M80 54h140a14 14 0 0 1 14 14v30a14 14 0 0 1-14 14H120l-22 18v-18H80a14 14 0 0 1-14-14V68a14 14 0 0 1 14-14Z" fill="#fff"/>',
    f'<path d="M86 76h112M86 92h80"/>',
    f'<path d="M320 120H200a14 14 0 0 0-14 14v24a14 14 0 0 0 14 14h96l20 16v-16h4a14 14 0 0 0 14-14v-24a14 14 0 0 0-14-14Z" fill="{BLUSH}"/>',
    f'<path d="M204 142h92M204 156h60"/><path d="m282 156 4 4 8-8m-2 8 8-8" stroke="{ROSE}"/>',
    f'<circle cx="320" cy="64" r="26" fill="#fff"/><path d="M320 48v16l11 7" stroke="{ROSE}"/>',
]), sky=('#FFF8F1', '#FCE3EC'))

ART['menghitung-jumlah-tamu-dan-kursi'] = lambda k: frame(k, ''.join([
    ''.join(f'<g transform="translate({76 + c * 36} {70 + r * 42})"><path d="M-10 26v-16a10 10 0 0 1 20 0v16" fill="{BLUSH if (r + c) % 3 else GOLDS}"/><path d="M-12 26h24M-9 26v10M9 26v10"/></g>'
            for r in range(3) for c in range(5)),
    f'<rect x="276" y="70" width="82" height="96" rx="12" fill="#fff"/><path d="M292 96h50" stroke="{ROSE}"/>',
    f'<text x="317" y="140" text-anchor="middle" font-family="Georgia,serif" font-size="30" fill="{DEEP}" stroke="none">120</text>',
]))

ART['memilih-tema-undangan-sesuai-adat'] = lambda k: frame(k, ''.join([
    f'<g transform="rotate(-12 150 140)"><rect x="104" y="58" width="86" height="130" rx="8" fill="{GOLDS}"/>'
    + ''.join(f'<path d="M{114 + i * 16} 70l8 10-8 10-8-10Z" fill="none" stroke="{DEEP}"/>' for i in range(4))
    + ''.join(f'<path d="M{114 + i * 16} 166l8 10-8 10-8-10Z" fill="none" stroke="{DEEP}"/>' for i in range(4)) + '</g>',
    f'<rect x="166" y="46" width="86" height="136" rx="8" fill="#fff"/><path d="M186 160v-40a23 23 0 0 1 46 0v40" fill="{BLUSH}"/>',
    f'<path d="M184 70h50M194 82h30" stroke="{ROSE}"/>',
    f'<g transform="rotate(12 290 140)"><rect x="242" y="58" width="86" height="130" rx="8" fill="{BLUSH}"/>'
    f'<circle cx="285" cy="110" r="22" fill="#fff"/><circle cx="285" cy="110" r="10" fill="{PINK}" stroke="none"/><path d="M262 160h46"/></g>',
]), sky=('#FFF6EA', '#FBDCE6'))
