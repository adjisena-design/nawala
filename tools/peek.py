# Run from the repository root with a static server on :8765 (python3 -m http.server 8765). Optional argument: one slug.
# One long picture per working sample invitation, for the hover peek on tema/ (owner, 23 Nov 2026, point 7).
# Dasar: the cover, then the page inside, scrolled. Premium: the cover, then each step, one under another.
import asyncio, json, sys, io
from PIL import Image
from playwright.async_api import async_playwright
W, H, OUT_W, MAXH = 390, 844, 240, 4300
import re, os
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
def lists():
    """the kits from undangan/index.html and the Dasar themes from undangan/dasar.js"""
    s = open(os.path.join(ROOT, 'undangan/index.html')).read(); i = s.index('var KITS = {')
    d = open(os.path.join(ROOT, 'undangan/dasar.js')).read(); j = d.index('var THEMES = {'); k = d.index('\n  };', j)
    return {'premium': re.findall(r"^\s{4}'([a-z0-9-]+)': \{", s[i:i + 15000], re.M),
            'dasar': re.findall(r"['\"]?([a-z0-9-]+)['\"]?\s*:\s*\[", d[j:k])}
L = lists()
only = sys.argv[1] if len(sys.argv) > 1 else None
async def shot(pg): return Image.open(io.BytesIO(await pg.screenshot()))
def save(frames, slug):
    sc = OUT_W / W
    fr = [f.resize((OUT_W, round(f.height * sc)), Image.LANCZOS).convert('RGB') for f in frames]
    h = min(MAXH, sum(f.height for f in fr))
    c = Image.new('RGB', (OUT_W, h), 'white'); y = 0
    for f in fr:
        if y >= h: break
        c.paste(f, (0, y)); y += f.height
    c.save(os.path.join(ROOT, 'assets/img/peek', slug + '.webp'), 'WEBP', quality=62, method=6)
async def dasar(ctx, slug):
    pg = await ctx.new_page()
    await pg.goto(f'http://localhost:8765/undangan/dasar.html?tema={slug}&to=Bapak+dan+Ibu+Santoso', wait_until='networkidle')
    await pg.wait_for_timeout(500)
    frames = [await shot(pg)]
    await pg.evaluate("document.getElementById('open').click()"); await pg.wait_for_timeout(500)
    await pg.evaluate("document.querySelectorAll('.contoh,#contoh,[data-contoh]').forEach(e=>e.style.visibility='hidden')")
    total = await pg.evaluate("document.documentElement.scrollHeight")
    y = 0
    while y < total and len(frames) < 9:
        await pg.evaluate(f"window.scrollTo(0,{y})"); await pg.wait_for_timeout(350)
        frames.append(await shot(pg)); y += H
    save(frames, slug); await pg.close()
async def premium(ctx, kit):
    pg = await ctx.new_page()
    await pg.goto(f'http://localhost:8765/undangan/?tema={kit}&to=Bapak+dan+Ibu+Santoso', wait_until='networkidle')
    await pg.wait_for_timeout(700)
    frames = [await shot(pg)]
    await pg.evaluate("document.getElementById('open').click()"); await pg.wait_for_timeout(2500)
    for i in range(8):
        frames.append(await shot(pg))
        await pg.keyboard.press('ArrowDown'); await pg.wait_for_timeout(1400)
    save(frames, kit); await pg.close()
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        ctx = await b.new_context(viewport={'width': W, 'height': H}, device_scale_factor=1, reduced_motion='reduce', is_mobile=True, has_touch=True)
        await ctx.route('**/*.mp3', lambda r: r.abort()); await ctx.route('**/*.mp4', lambda r: r.abort())
        for k in L['premium']:
            if only and only != k: continue
            await premium(ctx, k); print('p', k, flush=True)
        for s in L['dasar']:
            if only and only != s: continue
            await dasar(ctx, s); print('d', s, flush=True)
        await b.close()
asyncio.run(main())
