-- The built immersive worlds move from Eksklusif to Premium (owner, 22 Nov 2026: "move all video based
-- invitations to Premium"). Eksklusif keeps the six covers that have no world yet. The number trigger gives
-- each moved theme the next Premium number (P-029 to P-032); the old E- numbers are not reused.
update public.themes set tier = 'premium', family = 'royal' where slug = 'istana-awan';
update public.themes set tier = 'premium', family = 'era'   where slug = 'teater-tua';
update public.themes set tier = 'premium', family = 'alam'  where slug = 'kapal-bulan';
update public.themes set tier = 'premium', family = 'nusa'  where slug = 'seribu-lentera';
select slug, tier, family, no, kit from public.themes where slug in ('istana-awan','teater-tua','kapal-bulan','seribu-lentera') order by no;
