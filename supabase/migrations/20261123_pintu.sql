-- The single door (owner, 23 Nov 2026, point 6): one form for every reason a visitor leaves their details
-- (an access code to every theme, a free consultation, the full price list, keeping the Imagination Room's picture).
-- It writes one lead and hands back a fresh access code at once, valid 30 days, linked to that lead.
-- The code opens a new, empty couple's room only: typing someone else's number never reaches their room.
-- Guessing is held back per address (6 forms an hour) and overall (300 an hour), like the team door.
-- Also reserves the address "sayembara" (the art contest page). Safe to run twice.

alter table public.leads add column if not exists needs text[] not null default '{}';

create table if not exists private.lead_tries (
  ip text not null,
  at timestamptz not null default now()
);
create index if not exists lead_tries_at on private.lead_tries (at);
alter table private.lead_tries enable row level security;
revoke all on private.lead_tries from public, anon, authenticated;

create or replace function public.lead_door(p_name text, p_whatsapp text, p_month int, p_year int,
                                            p_needs text[], p_theme text, p_source text, p_lang text)
returns json language plpgsql security definer set search_path = '' as $$
declare
  v_ip text := private.caller_ip();
  v_name text := btrim(coalesce(p_name, ''));
  v_wa text := regexp_replace(coalesce(p_whatsapp, ''), '\D', '', 'g');
  v_y int := extract(year from now())::int;
  v_m int := p_month;
  v_yr int := p_year;
  v_lead uuid;
  v_code text;
  v_until timestamptz := now() + interval '30 days';
begin
  delete from private.lead_tries where at < now() - interval '1 day';
  if (select count(*) from private.lead_tries t where t.at > now() - interval '1 hour') >= 300 then
    return json_build_object('denied', 'sibuk');
  end if;
  if (select count(*) from private.lead_tries t where t.ip = v_ip and t.at > now() - interval '1 hour') >= 6 then
    return json_build_object('denied', 'batas');
  end if;
  insert into private.lead_tries (ip) values (v_ip);

  if char_length(v_name) < 2 or char_length(v_name) > 80 then return json_build_object('denied', 'nama'); end if;
  if v_wa like '0%' then v_wa := '62' || substr(v_wa, 2); elsif v_wa like '8%' then v_wa := '62' || v_wa; end if;
  if v_wa !~ '^[0-9]{10,15}$' then return json_build_object('denied', 'nomor'); end if;
  if v_m is null or v_yr is null or v_m < 1 or v_m > 12 or v_yr < v_y or v_yr > v_y + 4 then v_m := null; v_yr := null; end if;

  insert into public.leads (name, wedding_month, wedding_year, whatsapp, lang, source, theme, needs)
  values (v_name, v_m, v_yr, v_wa,
          case when p_lang = 'en' then 'en' else 'id' end,
          -- what they asked for rides in source too, so the team console shows it without a new console function
          left(coalesce(nullif(btrim(p_source), ''), 'pintu')
               || case when 'konsultasi' = any(coalesce(p_needs, '{}'::text[])) then ' +konsultasi' else '' end
               || case when 'harga' = any(coalesce(p_needs, '{}'::text[])) then ' +harga' else '' end, 40),
          case when p_theme ~ '^[a-z0-9-]{1,40}$' then p_theme end,
          coalesce((select array_agg(distinct x) from unnest(coalesce(p_needs, '{}'::text[])) x
                    where x in ('kode', 'konsultasi', 'harga', 'imajinasi')), '{}'))
  returning id into v_lead;

  loop
    v_code := private.new_code();
    exit when not exists (select 1 from public.access_codes a where a.code = v_code);
  end loop;
  insert into public.access_codes (code, label, lead_id, expires_at)
  values (v_code, left(v_name, 40), v_lead, v_until);

  return json_build_object('code', v_code, 'until', v_until);
end $$;
revoke all on function public.lead_door(text, text, int, int, text[], text, text, text) from public;
grant execute on function public.lead_door(text, text, int, int, text[], text, text, text) to anon, authenticated;

create or replace function private.slug_free(p_slug text) returns boolean
language sql stable security definer set search_path = '' as $$
  select coalesce(p_slug, '') ~ '^[a-z0-9][a-z0-9-]{1,58}[a-z0-9]$'
     and p_slug not in ('tim', 'ruang', 'undangan', 'assets', 'supabase', 'cloudflare', 'admin', 'api', 'www', 'index',
                        'favicon', 'robots', 'sitemap', 'cname', 'readme', 'claude', 'u', 'contoh', 'nawala', 'login', 'masuk',
                        'tema', 'koleksi', 'layanan', 'faq', 'mitra', 'kabar', 'paket', 'demo', 'tools', 'sayembara', 'docs')
     and not exists (select 1 from public.invitations v where v.slug = p_slug);
$$;
revoke all on function private.slug_free(text) from public, anon, authenticated;
