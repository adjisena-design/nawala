-- Theme numbers (owner, 21 Nov 2026): every theme has a number within its tier, shown on the themes page as
-- D-001 (Dasar), P-001 (Premium), E-001 (Eksklusif), so couples can name a theme in a WhatsApp chat.
-- A number never changes and is never given again: deleted themes keep theirs, a new theme gets the next one,
-- and a theme moved to another tier gets the next number there. Safe to run twice.

begin;

alter table public.themes add column if not exists no int;

-- first numbering: the order the site already shows (tier, then sort, then name), deleted themes included
update public.themes t set no = r.n
from (select slug, row_number() over (partition by tier order by sort, name_id) n from public.themes) r
where t.slug = r.slug and t.no is null;

create unique index if not exists themes_tier_no on public.themes (tier, no);

create or replace function private.theme_number() returns trigger
language plpgsql set search_path = '' as $$
begin
  if new.no is null or (tg_op = 'UPDATE' and new.tier is distinct from old.tier) then
    perform pg_advisory_xact_lock(hashtext('nawala-theme-no-' || new.tier));
    select coalesce(max(t.no), 0) + 1 into new.no from public.themes t where t.tier = new.tier;
  end if;
  return new;
end $$;

drop trigger if exists theme_number on public.themes;
create trigger theme_number before insert or update of tier on public.themes
  for each row execute function private.theme_number();

-- nawalainvite.com/tema/ is the themes page, so no couple may take "tema" (or "koleksi") as their address
create or replace function private.slug_free(p_slug text) returns boolean
language sql stable security definer set search_path = '' as $$
  select coalesce(p_slug, '') ~ '^[a-z0-9][a-z0-9-]{1,58}[a-z0-9]$'
     and p_slug not in ('tim', 'ruang', 'undangan', 'assets', 'supabase', 'cloudflare', 'admin', 'api', 'www', 'index',
                        'favicon', 'robots', 'sitemap', 'cname', 'readme', 'claude', 'u', 'contoh', 'nawala', 'login', 'masuk',
                        'tema', 'koleksi')
     and not exists (select 1 from public.invitations v where v.slug = p_slug);
$$;
revoke all on function private.slug_free(text) from public, anon, authenticated;

-- the site's list, now with the number
create or replace function public.site_themes() returns jsonb
language sql stable security definer set search_path = '' as $$
  select coalesce(jsonb_agg(jsonb_build_object('slug', t.slug, 'tier', t.tier, 'family', t.family,
           'name', jsonb_build_array(t.name_id, t.name_en), 'desc', jsonb_build_array(t.desc_id, t.desc_en),
           'cover', t.cover, 'film', t.film, 'kit', t.kit, 'owned', t.owned, 'no', t.no) order by
           case t.tier when 'dasar' then 1 when 'premium' then 2 else 3 end, t.no, t.sort, t.name_id), '[]'::jsonb)
  from public.themes t where t.deleted_at is null and not t.hidden;
$$;

commit;

-- check: three lines, each tier numbered from 1 with no gaps yet
select tier, count(*), min(no), max(no) from public.themes group by tier order by tier;
