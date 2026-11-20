# Nawala: the living letter

Home page for Nawala, a digital wedding invitation business in Indonesia. Static site, no build step: `index.html`, `assets/css/site.css`, `assets/js/site.js`. Served by GitHub Pages from `main` at https://adjisena-design.github.io/nawala/ (all asset paths are relative for that reason).

## Standing rules from the owner
- Every design update is committed and pushed to `main` without asking. This repository is public.
- Speed is as important as looks. Most guests open Nawala on low and middle-spec Android phones; lag means they leave. Animate only transform and opacity. Glass blur switches off on small screens; everything that moves stops under reduced motion.
  - One agreed exception: the desktop menu morph (top bar into left rail) moves `clip-path` on two small glass shapes. It only exists at 900px and wider. Phones do the same job with opacity and scale.
- No emojis anywhere. No real or generated human faces: Nawala (the winged letter) stands in for the couple.
- Site copy is Indonesian first with an English toggle. Every visible string carries `data-en`; the script swaps it. Strings built in `site.js` go through `t(id, en)`.
- Nothing thin and nothing tiny: body text 17px or larger, touch targets 44px or larger.
- Do not invent evidence. There are no customers, testimonials, prices or finished themes yet. The 28 theme covers are real pictures, but the invitation pages behind them are not built, and the page says so. The log-in box says plainly that codes cannot be checked yet.
- Higgsfield credits (owner, 21 Nov 2026): spend down to 500 remaining, then stop and ask; after his yes, down to 200 remaining, then stop.

## Look
Realism + Utopia. The photographs carry the colour; the interface stays quiet.
- Green belongs to the world, yellow to the light, pink only to Nawala and what it touches (glow borders, the contact box, the seal, blushing).
- Tokens are at the top of `site.css`. Display type is Fraunces, body is Plus Jakarta Sans, both self-hosted in `assets/fonts`. `?font=2` previews Bricolage Grotesque as the display face; `?h=2` and `?h=3` preview alternative hero headlines. These are review switches for the owner, remove them once he has chosen.
- No all-caps labels, no eyebrow labels above headings, no middle-dot taglines, no arrows inside buttons.

## The page is one descent
Sky, arch, trees, deep forest, flower hill. Each section sits on scenery; text sits on glass or on a shade over the picture.

| Altitude | Section | Scenery | Creatures (all drawn from cut-outs, moved with transforms) |
| --- | --- | --- | --- |
| 1 | `.hero` | open sky above the clouds, sun rays | two flocks of white doves, a small plane with a contrail, an ivory blimp |
| 2 | `.about` | moss arch | three doves |
| 3 | `.services` | treetops, warm golden green | two doves |
| 4 | `.themes` | mossy branches, dim + the river of covers | three butterflies, and the branch Nawala bumps into |
| 5 | `.contact` | boulder with small flowers | nine butterflies, bride and groom |

Parts:
- `.nav`: one set of links, laid out in rail position. On the hero they are moved into a top bar with transforms worked out in `layoutNav()`; `navMorph()` scrubs between the two with scroll. `.nav__top` and `.nav__side` are the two glass shapes. Phones: `.menu-btn` + slide-in `.nav__items`.
- `.nw`: the one travelling Nawala (fixed). `plan()` builds a list of waypoints from the section positions; `nwMove()` blends position, size and turn between them and sets the pose (`data-pose`: fly, tilt, back34, open, tumble, hop1 to hop3, rest, front). Flying is `nw-flap.webp`: one wing beat, 12 frames side by side, stepped with a transform. Cues: `flip` (3D turn showing its back), `bump` (flies into the tip of `#branch`, then tumbles). On the contact box it hops (crouch, air, land) and then rests. Tapping it makes it face you, blush and spin.
- `.sweep`: the light that carries one section into the next. Not one arch: four swells (`i` = glow, `s` = fill drawn on top, in step) wobble on their own clocks like a lava lamp made of light, with a faint spectrum on the edge and two faint arcs (`b`) lifting off. Coloured per section with `--veil`, `--rim`, `--g1`, `--g2`. `.fade-top` blends the fill into the scenery below it.
- `.about`: pinned stage. Three messages sit on the right over a white fade and glide upward with the scroll (`--y`, `--o` set per message in `measure()`); Nawala keeps to the left of the arch. On phones the fade and the messages are at the top.
- `.services`: on desktop the small screens move into one sticky phone and swap; on phones each sits inside its service card.
- `.themes`: `.river` is built by script from `THEMES` (covers drift diagonally, cannot be touched). "Lihat tema" opens `dialog#pop-themes`: grid of 28 starter themes with their cover pictures (`assets/img/cover-<slug>.webp`, `-s` for the river), a detail view with the sample couple, "Gunakan tema ini" carries the choice into the contact box, and the end of the list asks for a WhatsApp registration.
- `dialog#pop-login`: access code only. Not connected until the Nawala database exists.
- `.contact`: one box, three questions (name, wedding month and year, WhatsApp number), then an animated tick. `.pair` is bride and groom Nawala: they hop toward each other, then keep playing on an 8 second loop (blush, jump, turn white, circle each other, blush again).
- Sections get `.is-live` while on or near the screen (creatures and light only move then) and `.is-near` once close (background pictures, masks and the river load then).

Scroll effects read two CSS variables that `site.js` sets on every `[data-scroll]` section: `--e` (0 to 1 while the section enters) and `--p` (0 to 1 while it passes).

## Contact box and data
- `CONFIG` at the top of `site.js` holds the WhatsApp number and the Supabase URL and publishable key.
- While the Supabase values are empty, the box hands the three answers (and the chosen theme) to WhatsApp as a pre-filled message. Once they are filled, it inserts a row into `public.leads` and falls back to WhatsApp only if that fails. The chosen theme travels in `source` (40 characters at most).
- `supabase/migrations/20261120_leads.sql` creates the table: visitors may insert, nobody outside the team may read. It must go into a Nawala-owned Supabase organization, never the IEEF one. The owner will create it under a new dedicated Nawala email, as a separate batch of work.
- Log-in will need an RPC `check_access_code(code text) returns boolean`; `site.js` already calls it when the config is filled.

## Assets
- `assets/img/plate-<scene>-<format>[-sm].webp`: scenery without Nawala (sky, arch, treetops, branches, boulder; desktop 2400 and 1440 wide, mobile 1080 and 720 wide).
- `assets/img/nw-*.webp`: the travelling poses and the wing-beat strip. `nawala-*.webp`: open, bride, groom, and the small brand mark.
- `assets/img/fx-*.webp`: doves (4 cells), butterflies (8 cells), plane, blimp, branch.
- `assets/img/cover-<slug>.webp` (640 wide) and `cover-<slug>-s.webp` (220 wide): the 28 theme covers; the slug is the Indonesian theme name in lower case with dashes.
- Originals live outside the repo in the owner's `Downloads/Nawala/generated` folder (`nawala-pass2/` holds the pass 2 set). The brand brief, asset register, pass 2 job list, competitor map and reference notes live in the owner's "Nawala" project on claude.ai.

## Check before pushing
Open `index.html` through any static server and look at 1440x900 and 390x844: hero and the menu morph, each sweep, each about step, the services swap, the theme river and both pop-ups, the full contact flow in both languages, and reduced motion.
