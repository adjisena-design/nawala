# Nawala

Home page for Nawala, the living letter: digital wedding invitations from Bandung, Indonesia.

Live: https://nawalainvite.com/

Static HTML, CSS and JavaScript with no build step. See `CLAUDE.md` for how the page is put together.

The first working invitation (Laras & Bima, General Nawala theme) is at `undangan/`: https://nawalainvite.com/undangan/?to=Nama+Tamu

Two more doors: the couple's room at `ruang/` (opened by an access code) and the team console at `tim/` (opened by a team token). Both read and write the Nawala database through the functions in `supabase/migrations/`.
