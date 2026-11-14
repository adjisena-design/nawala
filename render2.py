import asyncio, sys
from playwright.async_api import async_playwright
from PIL import Image
LAYERS = [("sky",1000,625,80,False),("land",2400,1500,84,True),("cloudfar",2000,1250,82,True),("cloudnear",2000,1250,82,True)]
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path="/usr/bin/google-chrome")
        for n in ("day","night"):
            for name,w,h,q,alpha in LAYERS:
                pg = await b.new_page(viewport={"width":w,"height":h})
                open(f"/tmp/r_{name}_{n}.html","w").write(f'<html><body style="margin:0;background:transparent"><img src="file:///home/claude/nawala/v2/art/{name}-{n}.svg" style="width:{w}px;height:{h}px;display:block"></body></html>')
                await pg.goto(f"file:///tmp/r_{name}_{n}.html"); await pg.wait_for_timeout(1200)
                await pg.screenshot(path=f"/tmp/{name}-{n}.png", omit_background=alpha)
                im = Image.open(f"/tmp/{name}-{n}.png"); im = im.convert("RGBA" if alpha else "RGB")
                im.save(f"/home/claude/nawala/v2/art/{name}-{n}.webp","WEBP",quality=q,method=6)
                await pg.close()
        await b.close()
asyncio.run(main())
