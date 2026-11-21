# Nawala: the living letter

Home page for Nawala, a digital wedding invitation business in Indonesia. Static site, no build step: `index.html`, `assets/css/site.css`, `assets/js/site.js`. Served by GitHub Pages from `main` at https://adjisena-design.github.io/nawala/ (all asset paths are relative for that reason).

## Standing rules from the owner
- Every design update is committed and pushed to `main` without asking. This repository is public.
- Speed is as important as looks. Most guests open Nawala on low and middle-spec Android phones; lag means they leave. Animate only transform and opacity. Glass blur switches off on small screens; everything that moves stops under reduced motion.
  - One agreed exception: the desktop menu morph (top bar into left rail) moves `clip-path` on two small glass shapes. It only exists at 900px and wider. Phones do the same job with opacity and scale.
- No emojis anywhere. No real or generated human faces: Nawala (the winged letter) stands in for the couple.
- Site copy is Indonesian first with an English toggle. Every visible string carries `data-en`; the script swaps it. Strings built in `site.js` go through `t(id, en)`.
- Nothing thin and nothing tiny: body text 17px or larger, touch targets 44px or larger.
- Do not invent evidence. There are no customers, testimonials or prices yet. The 50 theme covers and 20 sample films are real. Working invitations exist for the General Nawala theme (Premium) and the 12 Dasar themes; the 28 Premium and 10 Eksklusif covers still have no invitation behind them, and the page says so. No theme is marked as owned until a couple has really bought it. The log-in box says plainly that codes cannot be checked yet.
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
  - The five small screens are pages of one sample invitation (Laras & Bima, guest Dinda) in the **General Nawala theme** ("Tema Umum Nawala", the owner's name for Nawala's own look applied to an invitation: our scenery plates, Nawala, Fraunces, ivory cards, the pink seal). Opening on the arch, guestbook on the sky, floor plan on the treetops, souvenir on the boulder, gallery on the branches. In the desktop phone they share one tab bar (`#phone-tabs`), hidden on the opening. The floor plan is a drawn reception room (`floorPlan()` in `site.js`: stage, aisle, ten round tables of eight, buffet, gifts, entrance), standing up in the desktop phone and lying down in the phone-size service card.
- `.themes`: `.river` is built by script from every theme (covers drift diagonally, cannot be touched). The panel has four tier doors; each opens `dialog#pop-themes` on that tab.
  - Tiers (data at the top of `site.js`): `BASIC` (Dasar, 12), `THEMES` (Premium, 28 in seven families), `EXCLUSIVE` (Eksklusif, 10), and Kustom, which is a four-step process with its own WhatsApp message. `ALL` is the combined list.
  - Detail view: cover, "Putar film" when the slug is in `FILMS` (`assets/video/<slug>.mp4`, 720 px wide, silent, about 0.1 to 1 MB), the sample couple, "Gunakan tema ini".
  - Films only ever start from a tap, and are not offered on Save-Data or 2G/3G. Exclusive films need an access code; `?film=1` unlocks them for the owner's review (remove when log-in is connected).
  - Exclusive themes are sold to one couple. Add the slug to `OWNED` after a real sale: the card is marked "Sudah dimiliki" and can no longer be chosen. It is empty on purpose.
  - "Gunakan tema ini" carries the choice into the contact box; the end of each list asks for a WhatsApp registration.
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
- `assets/img/cover-<slug>.webp` (640 wide, full colour, shown only when a theme is opened), `-m.webp` (400 wide, for the grid) and `-s.webp` (220 wide, for the river): the 50 theme covers. The `-m` and `-s` files are toned down on purpose (saturation 0.58, contrast 0.93, baked in, no CSS filter) so many covers can sit on screen without fighting the scenery (Basic and Exclusive are 9:16, Premium 4:5); the slug is the Indonesian theme name in lower case with dashes. `assets/video/<slug>.mp4`: the 20 sample films.
- Originals live outside the repo in the owner's `Downloads/Nawala/generated` folder (`nawala-pass2/` and `nawala-pass3/` hold the generated sets). The brand brief, asset register, pass 2 job list, competitor map and reference notes live in the owner's "Nawala" project on claude.ai.

## Check before pushing
Open `index.html` through any static server and look at 1440x900 and 390x844: hero and the menu morph, each sweep, each about step, the services swap, the theme river and both pop-ups, the full contact flow in both languages, and reduced motion.

## Tiers (owner's decision, 21 Nov 2026, replaces the earlier "Dasar is also video-style" rule)
| Tier | What it is | Where |
| --- | --- | --- |
| Dasar | The familiar scroll invitation, the kind that already works in Indonesia (he pointed at a Viding invitation): one picture, readable cards, frames for the couple's photos, free scrolling. Two families wanted: photographic (built, 12 themes) and illustrated like Viding (not started, needs new art). | `undangan/dasar.html?tema=<slug>` |
| Premium | An immersive world: opening film, glass panels standing in the scenery, one swipe one step, travelling Nawala, light between scenes. The General Nawala theme is the first; Pendopo Jawa and Akad Putih have their pictures generated but are not assembled. | `undangan/` |
| Eksklusif | Sold to one couple only, then marked as owned. None built. | |
| Kustom | Built from the couple's own inspiration after a video call. None built. | |
Levels (1 Dasar, 2 Menengah, 3 Maksimal inside an invitation) are a different thing: they say which sections are on. The level called "Dasar" and the tier called "Dasar" share a word only; rename one of them when the owner decides.

## The Dasar scroll invitation (`undangan/dasar.html`), since 21 Nov 2026
- Three files beside the Premium ones: `dasar.html`, `dasar.css`, `dasar.js`. Same couple file (`couple-laras-bima.js`). They started as this morning's first scrolling version (commit `e41ad76`).
- One fixed picture (`.backdrop`) behind everything; solid paper cards scroll over it; a soft oval of mist (`--halo`) sits behind the names so they read on any picture; the couple appear in oval frames (Nawala stands in on samples); the gallery crops the theme's own picture.
- A theme is one `[data-theme="<slug>"]` block at the end of `dasar.css`: the picture (`--plate`, the existing `assets/img/cover-<slug>.webp`, 640 wide), a palette (`--main`, `--accent`, `--paper` and their `-rgb` twins) and, in `THEMES` in `dasar.js`, its name and whether writing on the picture is dark or light. The 12: putih-klasik, sage, dusty-rose, emas-lembut, biru-langit, lavender, terakota, daun-tropis, marun, melati, senja, malam-bintang.
- The sample's review sheet ("Contoh") has a theme picker, so one address shows all 12. The home page's theme pop-up links each Dasar theme to its sample ("Buka undangan contoh").
- Opening, wording sets, levels, RSVP by WhatsApp, wishes, digital envelope, music and languages behave as in the Premium engine, without film, guided steps, glass or travelling Nawala.

## The Premium invitation (`undangan/`), since 21 Nov 2026
The first working invitation: Laras & Bima in the General Nawala theme, at `undangan/` (live path `/nawala/undangan/?to=Nama+Tamu`). The home page links to it from the first service card. The 50 theme covers still have no invitation pages of their own. The owner's instruction: get this one right, then replicate it to the others.

It was rebuilt the same day after the owner's review (ivory cards, free scrolling and no light between scenes read as less premium than his reference reels). What his 11 reference reels share, and what this build follows: a camera journey; the writing stands inside the world on a clear sheet with flowers over its base; one composed beat at a time; the practical parts after the film.

Four parts, so that a new theme or a new couple is one new file each:
- `skeleton.css`: the structure shared by every theme.
- `theme-umum.css`: one theme kit. Per scene (`[data-scene]`): `--plate` (720 x 1290), `--fg` (front layer), `--fg-line`, `--tone`, `--shade`, and the light that brings the scene in (`--veil`, `--rim`, `--g1`, `--g2`, the home page's own values). Plus ornaments (doves, fireflies, butterflies, gallery frames). A new theme is a new `theme-<name>.css` and its pictures.
- `couple-laras-bima.js`: one invitation. Names, date, events, story, gifts, sample wishes, `theme`, `level`, `wording`, `whatsapp`, `music`, `film`. Guest-facing text is `[Indonesian, English]`.
- `invite.js`: the engine.

How it works:
- **Guided walk, not a scrolling page.** `.stage` is fixed; each `.step` fills it; `go()` moves exactly one step for any swipe (short or hard), wheel notch, arrow key, the round next button or a bottom-bar jump, and ignores input until the move has finished. There is no native page scroll. A panel taller than a very short screen scrolls inside itself, and a swipe only changes step once that panel is at its end. One step per event is built from the couple file (`#event-step` template).
- **Panels are clear acrylic sheets** (`.pane`): a light gradient, bright edge and sheen, no blur on phones (blur only at 900px and wider). A panel has no bottom edge: a still mask fades the glass, its border and sheen out before the front layer begins, because the owner noticed the hard line where a panel's base met the flowers (RSVP, digital envelope, closing). Watch for any box or motion that ends in a sharp cut; he notices them. `data-tone="dark"` on a step gives light writing on dim scenery, `light` gives dark writing.
- **Scenery and its front layer.** `.world` (plate) and `.front` (the plate's own moss, ferns, flowers or peaks, cut out as `assets/img/fg-<scene>-mobile-sm.webp`) share one box (`.fit`: covers the stage, stands on the bottom edge), so they line up. Order: world, steps, fronts, light, Nawala. `sinks()` gives every panel bottom padding (`--sink`) so writing stays above the front layer; it is never under 46px because the next button sits there. The camera pushes in a little at every step inside a scene (`--cam`, `--camf`).
- **Light between scenes** (`.sweep`): the home page's lava-lamp swells and spectrum rim, run on a clock instead of scroll. It rises (or comes down when going back), the scenery is swapped while the screen is covered, and the next panel arrives as it leaves. Only on a change of scene.
- **Nawala travels** (`.nw`): `data-nw` on a step says where it goes: `fly:x,y,size`, `perch:x` (sits on the panel's top edge, folded wings), `hover:x`, `hide`. It always finishes its flight because steps cannot be half-way. After an RSVP is written out it opens and lets hearts out.
- **Opening**: Nawala shows the address side with the guest's name (`?to=`), turns to the seal, opens; then the film (`assets/video/umum-opening.mp4`: through the arch into the sky, first frame = arch plate, last frame = sky plate) plays at 1.2x if it is already buffered at the tap, otherwise the still arch zooms. A skip button shows during the film. Music starts on that same tap, never on Save-Data or 2G.
- The stage height is pinned in pixels (`--sh`) so the on-screen keyboard cannot squeeze the scenery; `lift()` raises the steps so the field being typed in stays above the keyboard. Not yet tried on a real phone.

Rules specific to the invitation:
- Levels (the owner's three-level skeleton; names and contents are drafts): 1 Dasar = cover, greeting, bride, groom, countdown, events, RSVP, closing (9 steps). 2 Menengah adds music, calendar button, gallery, wishes, digital envelope. 3 Maksimal adds story, dress colours, live stream (14 steps). Steps and blocks carry `data-level`. "Maksimal" means every section is on; it does not mean the most premium production. Production value is the theme tier (Dasar, Premium, Eksklusif, Kustom).
- Wording sets live in `WORDING` in `invite.js`: `umum` (neutral) and `islam` (salam, Ar-Rum 21, akad nikah). Chosen per couple. The religious wording still needs the owner's review.
- RSVP has no database yet: the send button is a plain WhatsApp link whose message is rewritten as the guest types. The page never says an answer was sent, only that it is written out in WhatsApp. A guest's own wish is kept on their phone and shown as "dari Anda". Sample wishes are tagged "contoh".
- No human faces: bride and groom Nawala stand in for the couple; the gallery is one large frame and six thumbnails, each the cut-outs set into the scenery with CSS. Real couples' photos replace them later.
- Sample invitations (`sample: true`) show a "Contoh" button that opens a review sheet (level, wording, guest name, replay the opening) and a note in the closing. Real invitations show neither.
- Review links: `?to=`, `?lang=en`, `?level=1|2|3`, `?salam=umum|islam`, `?step=<id>` (start at a step), `?film=1`.
- **Two files are not in the repository yet** (the workspace cannot download from Higgsfield): the film (job `0e8abc71-5e02-4b65-ab66-900a5c3eda24`, Kling 3.0 pro, 5 s, 1072 x 1928, 10.8 MB original; it must be cut down to 720 px wide and about 1 MB as `assets/video/umum-opening.mp4`) and the instrumental (job `baeb642f-d452-4ef1-a05e-34c308d5f950`, ElevenLabs Music v2.5, 60 s, wanted as `assets/audio/nawala-umum.mp3`). Until then guests get the still zoom; `?film=1` plays the original from Higgsfield for the owner's review only; music plays from Higgsfield's address. Remove both fallbacks once the files are in.
- Weight (measured 21 Nov 2026 at 390x844, before server compression, without film or music): about 680 KB when the opening is ready, about 1.1 MB for the whole walk, 26 files.
- Checked in a test browser only (360x640, 390x844, 1440x900; both languages, both wordings, levels 1 and 3, reduced motion, no script). Not yet tried on a real low-end Android phone.
- **Next Premium worlds (pictures generated 21 Nov 2026, not downloaded, not assembled; both need the owner's cultural review):**
  - Pendopo Jawa: gate `df5da743-b922-4467-ba5c-6035e08158ec`, courtyard `d1b94299-11e0-477c-8b3b-7797baf6a0bc`, inside the pendopo `1980ed01-e944-4721-bd2e-bf162369d3ca`, carved wall (second try) `0f1f6cc5-c2e1-4231-a72b-3e31a5b8215c`, garden (second try) `c5eab2cf-e611-4656-a037-a4e2cc219abb`, opening film `d136bda4-fd52-4c27-9454-b76077a0e2e7`. Rejected: `584ff4f5` (black smudges), `75d7b01a` (a temple spire in the background).
  - Akad Putih: gate `791907da-5398-4acb-9378-bc9bd91744f2`, courtyard `7be4c224-8699-4754-b818-68dc78bb2dc4`, hall `3e419d31-f638-4b5f-9975-8baf8c3fc085`, ceremony setting `58ef8c87-fa44-4698-b9fc-60d253761b2f`, garden `8c9376c7-d77d-4cc7-b289-a2a70c2b93b2`, opening film `900b652f-3d7f-41e6-a30f-d18907819ab4`.
  - To assemble a world: bring the five pictures in at 720 x 1290 as `plate-<world>-<scene>.webp`, cut front layers, write `theme-<world>.css`, and let the page choose its kit from the couple file.
- Not built: saving RSVP and wishes to the database, a per-couple address (`/undangan/<nama>`), the wedding-day tabs (guestbook QR, seating, souvenir, photos), couples' own photos, desktop-size scenery (desktop shows the phone column).
