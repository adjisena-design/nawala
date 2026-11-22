-- Seribu Lentera becomes a working Exclusive world (22 Nov 2026).
-- Its new pictures replace the old cover in the repository (cover stays null = assets/img/cover-seribu-lentera*.webp);
-- the old sample film showed the earlier red corridor, so the film is cleared. Safe to run twice.
update public.themes
   set kit = 'seribu-lentera',
       film = null,
       desc_id = 'Lentera kertas naik di atas istana Nusantara; halaman kertas toska bergaris emas.',
       desc_en = 'Paper lanterns rise over a Nusantara palace; deep teal pages lined with gold.'
 where slug = 'seribu-lentera';
select slug, tier, no, kit, film, desc_id from public.themes where slug = 'seribu-lentera';
