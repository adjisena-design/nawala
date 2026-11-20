# Nawala: the living letter

Home page for Nawala, a digital wedding invitation business in Indonesia. Static site, no build step: `index.html`, `assets/css/site.css`, `assets/js/site.js`. Served by GitHub Pages from `main` at https://adjisena-design.github.io/nawala/ (all asset paths are relative for that reason).

## Standing rules from the owner
- Every design update is committed and pushed to `main` without asking. This repository is public.
- Speed is as important as looks. Most guests open Nawala on low and middle-spec Android phones; lag means they leave. Animate only transform and opacity. Glass blur switches off on small screens; everything that moves stops under reduced motion.
  - One agreed exception: the desktop menu morph (top bar into left rail) moves `clip-path` on two small glass shapes. It only exists at 900px and wider. Phones do the same job with opacity and scale.
- No emojis anywhere. No real or generated human faces: Nawala (the winged letter) stands in for the couple.
- Site copy is Indonesian first with an English toggle. Every visible string carries `data-en`; the script swaps it. Strings built in `site.js` go through `t(id, en)`.
- Nothing thin and nothing tiny: body text 17px or larger, touch targets 44px or larger.
- Do not invent evidence. There are no customers, testimonials, prices or finished themes yet. Theme covers are colour fields on purpose, and the page says the themes are still being painted. The log-in box says plainly that codes cannot be checked yet.
- Higgsfield credits (owner, 21 Nov 2026): spend down to 500 remaining, then stop and ask; after his yes, down to 200 remaining, then stop.

## Look
Realism + Utopia. The photographs carry the colour; the interface stays quiet.
- Green belongs to the world, yellow to the light, pink only to Nawala and what it touches (glow borders, the contact box, the seal, blushing).
- Tokens are at the top of `site.css`. Display type is Fraunces, body is Plus Jakarta Sans, both self-hosted in `assets/fonts`. `?font=2` previews Bricolage Grotesque as the display face; `?h=2` and `?h=3` preview alternative hero headlines. These are review switches for the owner, remove them once he has chosen.
- No all-caps labels, no eyebrow labels above headings, no middle-dot taglines, no arrows inside buttons.

## The page is one descent
Sky, arch, trees, deep forest, flower hill. Each section sits on scenery; text sits on glass or on a shade over the picture.

| Altitude | Section | Scenery now (pass 1) | Scenery planned (pass 2, new Higgsfield images) |
| --- | --- | --- | --- |
| 1 | `.hero` | sky above the clouds, cropped from the arch original | open sky, sun, white doves, a distant plane and an ivory blimp |
| 2 | `.about` | moss arch | same |
| 3 | `.services` | forest plate under a dark shade | treetops, warmer |
| 4 | `.themes` | blurred dark forest + the river of covers | branches |
| 5 | `.contact` | flower hill | boulder with small flowers and butterflies |

Parts:
- `.nav`: one set of links, laid out in rail position. On the hero they are moved into a top bar with transforms worked out in `layoutNav()`; `navMorph()` scrubs between the two with scroll. `.nav__top` and `.nav__side` are the two glass shapes. Phones: `.menu-btn` + slide-in `.nav__items`.
- `.nw`: the one travelling Nawala (fixed). `plan()` builds a list of waypoints from the section positions; `nwMove()` blends position, size and turn between them and sets the pose (`data-pose`: fly, tilt, back34, open, tumble, perch, front). Cues: `flip` (3D turn showing its back), `bump` (hits the theme panel, then tumbles). Tapping it makes it face you, blush and spin. Poses are in `assets/img/nw-*.webp`, cut from the owner's turnaround and pose sheets.
- `.sweep`: the soft band of light at the top of sections 2 to 5, coloured per section with `--veil`, `--rim`, `--g1`, `--g2`. `.fade-top` blends the veil into the scenery below it.
- `.about`: pinned stage, three statements.
- `.services`: on desktop the small screens move into one sticky phone and swap; on phones each sits inside its service card.
- `.themes`: `.river` is built by script from `THEMES` (covers drift diagonally, cannot be touched). "Lihat tema" opens `dialog#pop-themes`: grid of 28 starter themes, a detail view with the sample couple, "Gunakan tema ini" carries the choice into the contact box, and the end of the list asks for a WhatsApp registration.
- `dialog#pop-login`: access code only. Not connected until the Nawala database exists.
- `.contact`: one box, three questions (name, wedding month and year, WhatsApp number), then an animated tick. `.pair` is bride and groom Nawala hopping toward each other and blushing when they meet.

Scroll effects read two CSS variables that `site.js` sets on every `[data-scroll]` section: `--e` (0 to 1 while the section enters) and `--p` (0 to 1 while it passes).

## Contact box and data
- `CONFIG` at the top of `site.js` holds the WhatsApp number and the Supabase URL and publishable key.
- While the Supabase values are empty, the box hands the three answers (and the chosen theme) to WhatsApp as a pre-filled message. Once they are filled, it inserts a row into `public.leads` and falls back to WhatsApp only if that fails. The chosen theme travels in `source` (40 characters at most).
- `supabase/migrations/20261120_leads.sql` creates the table: visitors may insert, nobody outside the team may read. It must go into a Nawala-owned Supabase organization, never the IEEF one. The owner will create it under a new dedicated Nawala email, as a separate batch of work.
- Log-in will need an RPC `check_access_code(code text) returns boolean`; `site.js` already calls it when the config is filled.

## Assets
- `assets/img/plate-<scene>-<format>[-sm].webp`: scenery without Nawala (sky, arch, forest, hill; desktop 2400 and 1440 wide, mobile 1080 and 720 wide). `plate-deep-soft.webp` is the forest blurred once, offline.
- `assets/img/nw-*.webp`: the travelling poses. `nawala-*.webp`: open, bride, groom, and the small brand mark.
- Originals (4K PNG, cut-outs, the retired hero video) live outside the repo in the owner's `Downloads/Nawala/generated` folder. The brand brief, asset register, competitor map and reference notes live in the owner's "Nawala" project on claude.ai.

## Check before pushing
Open `index.html` through any static server and look at 1440x900 and 390x844: hero and the menu morph, each sweep, each about step, the services swap, the theme river and both pop-ups, the full contact flow in both languages, and reduced motion.
