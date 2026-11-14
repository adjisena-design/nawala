import asyncio
from playwright.async_api import async_playwright
from PIL import Image
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path="/usr/bin/google-chrome")
        for n in ("day","night"):
            pg = await b.new_page(viewport={"width":2000,"height":1250})
            open(f"/tmp/r_{n}.html","w").write(f'<body style="margin:0"><img src="file:///home/claude/nawala/v2/art/{n}.svg" style="width:2000px;height:1250px;display:block"></body>')
            await pg.goto(f"file:///tmp/r_{n}.html")
            await pg.set_viewport_size({"width":2000,"height":1250})
            await pg.wait_for_timeout(1500)
            await pg.screenshot(path=f"/tmp/{n}.png")
            im=Image.open(f"/tmp/{n}.png").convert("RGB")
            im.save(f"/home/claude/nawala/v2/art/{n}.webp","WEBP",quality=82,method=6)
            im.resize((1000,625)).save(f"/tmp/{n}_s.png")
            await pg.close()
        await b.close()
asyncio.run(main())
