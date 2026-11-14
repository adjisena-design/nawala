# Nawala (working name) — wedding invitation concept site

- `build.mjs` generates `index.html`. Artwork: `scene.mjs` writes the stippled scene SVGs, `render_art.py` rasterises them to `art/day.webp` and `art/night.webp` (the page uses these as one fixed background).
- Layout: one locked scene; on tall desktop screens each scroll step swaps the glass panel (deck mode), elsewhere panels scroll normally over the fixed scene. Nav is fixed. Template frames are intentionally empty. Logo: three flat options shown on the page, not yet chosen.
- Standing rule from the owner: every design update is committed and pushed to `main` automatically, without asking. This repo is a private progress viewer for the owner.
- Product truth lives in `PRODUCT.md`. Copy is Bahasa Indonesia. Fonts: Instrument Serif headlines with one italic phrase, Plus Jakarta Sans for body and logo. No purple/violet anywhere; dark mode is deep navy. No emojis, no eyebrow labels, no middle-dot taglines.
- View: enable GitHub Pages (Settings > Pages > Deploy from branch `main`, folder `/`), then open https://adjisena-design.github.io/nawala/
