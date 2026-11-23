# Sayembara Nawala: the art contest, build specification

Written 23 Nov 2026 from the owner's decisions (his answers at 18:04). The landing page section (`#udara`) and the
information page `sayembara/` exist and are live. Everything below is **not built yet**: it is the brief for the
session that builds the machinery. Read CLAUDE.md first; every rule there (no faces, 17px text, transform and opacity
only, Indonesian first with `data-en`, origin.js for boxes) applies.

## The owner's decisions

| Topic | Decision |
| --- | --- |
| Tracks | Hand-made (no AI image anywhere in it) and AI-made, judged separately |
| Share | Hand-made 20%, AI-made 5%, of **what Nawala keeps** on each invitation that uses the theme (price after partner commission and tax) |
| Prize up front | None for now; the owner may add one later |
| Who may enter | Anyone, anywhere in Indonesia, students highlighted but not required |
| Under 18 | Allowed, with a parent's or guardian's consent |
| Licence | Copyright stays with the artist. Nawala gets a licence to use the work as a theme while the term runs. Exclusive for Eksklusif themes (sold to one couple), non-exclusive for Dasar and Premium |
| Term | 2 years from going live; near the end Nawala asks whether to renew, otherwise the theme is retired |
| Faces | No human faces, real or generated; Nawala stands in for the couple |
| Judging | Internal only: the team answers accepted or not yet, always with notes. No public vote, no public jury |
| Open period | Always open until Nawala announces it is closed |
| Payout | Monthly, bank transfer, no minimum, with a statement of every invitation that used the work |
| Proof | Hand-made entries must include proof of process (sketches, layered files, process photos or a screen recording). AI entries name tools and prompts |

Worked example shown on the page (not a price): invitation Rp500,000; sold directly, hand-made Rp100,000, AI Rp25,000;
through a 25% partner, Nawala keeps Rp375,000, so hand-made Rp75,000, AI Rp18,750.

## What an entry contains (the skeleton)

The contest brief is the invitation framework, so an accepted entry works with every feature (Imagination Room,
design editor, guestbook) without rework:
- Five portrait scenes, 720 x 1290 px or larger: cover (sky slot), greeting (treetops), events (branches), gallery, closing (boulder). Calm in the middle for text.
- A front layer for each scene: flowers, leaves or forms along the bottom, transparent background.
- One separate flower spray for card corners, transparent.
- A suggested palette (main, accent, paper).
- Hand-made: proof of process. AI-made: tools and prompts, and the artist's statement that they may use the result.

A Dasar theme needs only one painting plus the spray (see "The 72 painted themes" in CLAUDE.md); a Premium world needs the five scenes. The artist may enter either.

## To build (later batches)

1. **Artist sign-up.** Reuse the single door (`assets/js/pintu.js`, `lead_door()`) with a new need `sayembara`, or a
   sibling function `artist_door(name, whatsapp, city, track, guardian)` that creates `public.artists` and an artist
   code (`SENI-` and 8 characters, same alphabet as `private.new_code()`), rate-limited like `lead_door`.
2. **Tables** (all behind security-definer functions, nothing readable from outside):
   - `artists` (id, name, whatsapp, city, is_minor, guardian_name, bank details stored only as the last four digits plus a reference the team keeps elsewhere, created_at, ended_at).
   - `submissions` (id, artist_id, track 'tangan' | 'ai', title, files jsonb (addresses in a new private bucket `seni`), proof jsonb, prompts text, status 'baru' | 'diterima' | 'belum', notes, decided_by, decided_at).
   - `art_licences` (theme slug, artist_id, track, share numeric 0.20 or 0.05, exclusive bool, starts_at, ends_at = starts_at + 2 years, renewed_at, retired_at).
   - `royalties` (id, invitation slug, theme slug, artist_id, base amount kept by Nawala, share, amount, month, paid_at, transfer_ref).
3. **Artist room** `seni/` (same shape as `ruang/`, ivory glass): upload a set (tickets like `media_ticket`, bucket `seni`, not public), see each entry's status and notes, see licences with their end dates and a renew/retire choice in the last 60 days, monthly statements.
4. **Team console**: a "Sayembara" view (rank 2): entries per track, preview of the five scenes, accept or not yet with notes (one line in the activity log), turn an accepted entry into a theme row (`themes` with `artist_id`, `track`), set exclusive.
5. **Royalty run**: when an order is marked paid in full (`invitations.payment` lunas), write one `royalties` row per licence on its theme, using the amount Nawala keeps (price minus partner commission minus tax); the owner pays monthly and marks `paid_at`.
6. **Credit**: the artist's name on the theme card (tema/), in the detail sheet and in the invitation's closing.
7. **Legal**: a contest agreement (licence, term, exclusivity, guardian consent, AI declaration, tax). No legal entity is named on the site yet; this waits for the owner's entity decision. Not legal advice.

## Open questions for the owner before building

- Bank details: keep them out of the database entirely (team keeps them offline) or store encrypted?
- Tax withholding on royalties: which entity pays, and at what rate (depends on the PT decision).
- Can one artist hold several accepted themes? (Assumed yes.)
- What happens to a theme a couple already bought when its licence is retired? (Assumed: their invitation stays live; the theme leaves the catalogue.)
