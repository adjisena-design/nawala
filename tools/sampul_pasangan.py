# Puts the matched sample couple on the cover of every theme that has a working sample (owner, 28 Nov 2026).
# Run from the repository root: python3 tools/sampul_pasangan.py [slug ...]
# - Which couple and attire: the same match() as the samples (undangan/pasangan.js, asked through node).
# - The clean cover is read from git (commit BASE, the last one before couples were added), so running this twice
#   never stacks a couple on a couple. A cover that is not in BASE (a theme added later) is taken from the working
#   file the first time and kept as assets/img/sampul-asli/<file>; bake a new theme's covers BEFORE running this.
# - Writes cover-<slug>.webp, -t, -m and -s. The grey -g file (the drifting gallery) stays without a couple.
# - The twelve photographic Dasar themes use assets/img/latar-<slug>.webp as their backdrop, not the cover.
import os, re, sys, io, json, subprocess
from PIL import Image, ImageDraw, ImageFilter, ImageEnhance
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
IMG = os.path.join(ROOT, 'assets/img'); BASE = 'f5206c0'; KEEP = os.path.join(IMG, 'sampul-asli')
def slugs():
    s = open(os.path.join(ROOT, 'undangan/index.html')).read(); i = s.index('var KITS = {')
    d = open(os.path.join(ROOT, 'undangan/dasar.js')).read(); j = d.index('var THEMES = {'); k = d.index('\n  };', j)
    return re.findall(r"^\s{4}'([a-z0-9-]+)': \{", s[i:i + 15000], re.M) + re.findall(r"['\"]?([a-z0-9-]+)['\"]?\s*:\s*\[", d[j:k])
def matches(names):
    js = ("global.window={};global.location={pathname:'/undangan/dasar.html'};global.document={documentElement:{style:{setProperty(){}}}};"
          "require(%s);const P=window.NAWALA_PASANGAN;const o={};for(const s of %s){const k=P.match(s);o[s]=[P.sets[k][1],P.sets[k][5]]}console.log(JSON.stringify(o))"
          % (json.dumps(os.path.join(ROOT, 'undangan/pasangan.js')), json.dumps(names)))
    return json.loads(subprocess.check_output(['node', '-e', js]))
def clean(name):
    r = subprocess.run(['git', '-C', ROOT, 'show', f'{BASE}:assets/img/{name}'], capture_output=True)
    if r.returncode == 0: return Image.open(io.BytesIO(r.stdout)).convert('RGB')
    kept = os.path.join(KEEP, name)
    if not os.path.exists(kept):
        os.makedirs(KEEP, exist_ok=True); open(kept, 'wb').write(open(os.path.join(IMG, name), 'rb').read())
    return Image.open(kept).convert('RGB')
def arch(photo, w, h):
    """the couple's picture cut to an arch of w x h, with a white edge"""
    k = max(w / photo.width, h / photo.height); p = photo.resize((round(photo.width * k) + 1, round(photo.height * k) + 1), Image.LANCZOS)
    x = (p.width - w) // 2; y = round((p.height - h) * .28); p = p.crop((x, y, x + w, y + h))
    S = 4; m = Image.new('L', (w * S, h * S), 0); d = ImageDraw.Draw(m)
    d.ellipse((0, 0, w * S - 1, w * S - 1), fill=255); d.rectangle((0, w * S // 2, w * S, h * S), fill=255)
    r = round(w * .07) * S; d.rectangle((0, h * S - r, w * S, h * S), fill=0); d.rounded_rectangle((0, h * S - 3 * r, w * S - 1, h * S - 1), r, fill=255)
    return p, m.resize((w, h), Image.LANCZOS)
def put(cover, photo, tone):
    W, H = cover.size; tall = H / W > 1.5
    w = round(W * (.50 if tall else .40)); h = round(w * 1.56); cx = W // 2; cy = round(H * (.60 if tall else .56))
    p, m = arch(photo, w, h)
    if tone: p = ImageEnhance.Contrast(ImageEnhance.Color(p).enhance(.58)).enhance(.93)
    e = max(2, round(W * .011)); bw, bh = w + 2 * e, h + 2 * e
    edge = m.resize((bw, bh), Image.LANCZOS)
    x, y = cx - bw // 2, cy - bh // 2
    out = cover.copy()
    sh = Image.new('L', cover.size, 0); sh.paste(edge, (x, y + round(W * .02))); sh = sh.filter(ImageFilter.GaussianBlur(W * .03))
    out = Image.composite(Image.new('RGB', cover.size, (30, 18, 22)), out, sh.point(lambda v: v * .42))
    out.paste(Image.new('RGB', (bw, bh), (255, 253, 251)), (x, y), edge)
    out.paste(p, (x + e, y + e), m)
    return out
def main():
    want = sys.argv[1:]; names = [s for s in slugs() if (not want or s in want) and os.path.exists(os.path.join(IMG, f'cover-{s}.webp'))]
    M = matches(names); n = 0
    for s in names:
        setp, shot = M[s]
        src = os.path.join(IMG, 'pasangan', f'{setp}-{shot}-l.webp')
        photo = Image.open(src).convert('RGB')
        for suf, q, tone in (('', 82, False), ('-t', 80, True), ('-m', 78, True), ('-s', 74, True)):
            name = f'cover-{s}{suf}.webp'
            if not os.path.exists(os.path.join(IMG, name)): continue
            put(clean(name), photo, tone).save(os.path.join(IMG, name), 'WEBP', quality=q, method=6)
        n += 1
    print(n, 'themes')
main()
