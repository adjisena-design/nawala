# Nawala: the living letter

Home page for Nawala, a digital wedding invitation business in Indonesia. Static site, no build step: `index.html`, `assets/css/site.css`, `assets/js/site.js`. Served by GitHub Pages from `main` at https://adjisena-design.github.io/nawala/ (all asset paths are relative for that reason).

## Standing rules from the owner
- Every design update is committed and pushed to `main` without asking. This repository is public.
- Speed is as important as looks. Most guests open Nawala on low and middle-spec Android phones; lag means they leave. Animate only transform and opacity. Glass blur, the canvas dust and the hero video are extras that switch off on small screens, slow connections and reduced motion.
- No emojis anywhere. No real or generated human faces: Nawala (the winged letter) stands in for the couple.
- Site copy is Indonesian first with an English toggle. Every visible string carries `data-en`; the script swaps it.
- Nothing thin and nothing tiny: body text 17px or larger, touch targets 44px or larger.
- Do not invent evidence. There are no customers, testimonials, prices or finished themes yet. The theme cards are colour fields on purpose, and the page says the themes are still being painted.

## Look
Realism + Utopia. The photographs carry the colour; the interface stays quiet.
- Green belongs to the world, yellow to the light, pink only to Nawala and what it touches (glow borders, the contact box, the seal).
- Tokens are at the top of `site.css`. Display type is Fraunces, body is Plus Jakarta Sans, both self-hosted in `assets/fonts`. `?font=2` previews Bricolage Grotesque as the display face; `?h=2` and `?h=3` preview alternative hero headlines. These are review switches for the owner, remove them once he has chosen.
- No all-caps labels, no eyebrow labels above headings, no middle-dot taglines, no arrows inside buttons.

## Page, top to bottom
1. `.rail`: the menu. A glass rail on the left that widens on hover (desktop); a slide-in panel behind `.menu-btn` (phones).
2. `.hero`: forest plate + rays + canvas dust + the Nawala cut-out, each moving at its own speed. On wide screens with a good connection the 5 second loop video replaces plate and cut-out (`html.has-video`).
3. `.about`: the moss arch. A tall section with a pinned stage; three statements swap as you scroll and Nawala flies through the arch. `.horizon` is the glowing curve between hero and arch.
4. `.services`: five services. On desktop the small screens move into one sticky phone and swap; on phones each sits inside its service.
5. `.themes`: seven theme families. Pinned and moved sideways by scroll on desktop, a native swipe row on phones.
6. `.contact`: the flower hill. One box, three questions (name, wedding month and year, WhatsApp number), then an animated tick.

Scroll effects read two CSS variables that `site.js` sets on every `[data-scroll]` section: `--e` (0 to 1 while the section enters) and `--p` (0 to 1 while it passes).

## Contact box and data
- `CONFIG` at the top of `site.js` holds the WhatsApp number and the Supabase URL and publishable key.
- While the Supabase values are empty, the box hands the three answers to WhatsApp as a pre-filled message. Once they are filled, it inserts a row into `public.leads` and falls back to WhatsApp only if that fails.
- `supabase/migrations/20261120_leads.sql` creates the table: visitors may insert, nobody outside the team may read. It must go into a Nawala-owned Supabase organization, never the IEEF one.

## Assets
- `assets/img/plate-<scene>-<format>[-sm].webp`: the three scenes without Nawala (forest, arch, hill; desktop 2400 and 1440 wide, mobile 1080 and 720 wide).
- `assets/img/nawala-*.webp`: transparent cut-outs of the mascot (flying, open, bride, groom).
- Originals (4K PNG, cut-outs, video) live outside the repo in the owner's `Downloads/Nawala/generated` folder. The brand brief, asset register, competitor map and reference notes live in the owner's "Nawala" project on claude.ai.

## Check before pushing
Open `index.html` through any static server and look at 1440x900 and 390x844: hero, each about step, the services swap, the theme row, the full contact flow in both languages, and reduced motion.
