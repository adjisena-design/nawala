-- The reading pages (23 Nov 2026): nawalainvite.com/layanan/, /faq/, /mitra/, /kabar/ and the home page's #paket.
-- No couple may take these words as their invitation address. Same list as RESERVED in cloudflare/worker.js.
-- Safe to run twice. Run it together with the merge of branch putih-pass-a into main.
create or replace function private.slug_free(p_slug text) returns boolean
language sql stable security definer set search_path = '' as $$
  select coalesce(p_slug, '') ~ '^[a-z0-9][a-z0-9-]{1,58}[a-z0-9]$'
     and p_slug not in ('tim', 'ruang', 'undangan', 'assets', 'supabase', 'cloudflare', 'admin', 'api', 'www', 'index',
                        'favicon', 'robots', 'sitemap', 'cname', 'readme', 'claude', 'u', 'contoh', 'nawala', 'login', 'masuk',
                        'tema', 'koleksi', 'layanan', 'faq', 'mitra', 'kabar', 'paket', 'demo', 'tools')
     and not exists (select 1 from public.invitations v where v.slug = p_slug);
$$;
revoke all on function private.slug_free(text) from public, anon, authenticated;
