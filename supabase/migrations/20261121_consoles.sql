-- Nawala consoles, access codes, RSVP and wishes (21 Nov 2026).
--
-- How access works: nobody outside the database may read or write any table here.
-- Every page talks to the database through the functions at the end of this file, with the publishable key.
--   * The team console (tim/) sends a team token with every call. Only its sha256 is stored.
--   * The couple's room (ruang/) sends an access code.
--   * A live invitation sends its own slug; guests may add an RSVP or a wish and read the visible wishes.
-- The first team tokens are made by hand in the dashboard's SQL editor, where the token is shown once:
--   select private.new_team_token('Adjisena', 'pemilik');
--   select private.new_team_token('Alvin', 'operator');

begin;

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

-- ---------------------------------------------------------------- leads: stage and chosen theme
drop policy "Visitors can leave their details" on public.leads;
alter table public.leads drop constraint leads_access_token_shape;
alter table public.leads drop column access_token;   -- codes now live in public.access_codes
alter table public.leads
  add column theme text check (theme is null or theme ~ '^[a-z0-9-]{1,40}$'),
  add column stage text not null default 'baru' check (stage in ('baru', 'dihubungi', 'konsep', 'produksi', 'tayang')),
  add column stage_at timestamptz;
grant insert (theme) on public.leads to anon;
create policy "Visitors can leave their details"
  on public.leads for insert to anon
  with check (stage = 'baru' and stage_at is null and contacted_at is null);

-- ---------------------------------------------------------------- tables
create table public.team_members (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 40),
  role text not null check (role in ('pemilik', 'operator')),
  token_hash text not null unique,
  created_at timestamptz not null default now(),
  ended_at timestamptz,
  last_seen_at timestamptz
);

create table public.access_codes (
  code text primary key check (code ~ '^[A-Z0-9-]{4,16}$'),
  label text not null check (char_length(label) between 1 and 40),
  lead_id uuid references public.leads (id) on delete set null,
  created_at timestamptz not null default now(),
  created_by uuid references public.team_members (id) on delete set null,
  expires_at timestamptz,      -- null: no end date (the team extended it without limit)
  ended_at timestamptz,        -- set when the team ends a code early
  ordered_at timestamptz,      -- set when the couple became an order; the code keeps working
  last_used_at timestamptz,
  state jsonb not null default '{}'::jsonb   -- the couple's room: saved, no, answers, final, call
);

create table public.invitations (
  slug text primary key check (slug ~ '^[a-z0-9-]{3,60}$'),
  couple text not null check (char_length(couple) between 1 and 80),
  theme text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.rsvps (
  id uuid primary key default gen_random_uuid(),
  invitation text not null references public.invitations (slug) on delete cascade,
  guest text not null check (char_length(guest) between 1 and 80),
  attending text not null check (attending in ('hadir', 'tidak', 'ragu')),
  headcount smallint not null default 0 check (headcount between 0 and 10),
  created_at timestamptz not null default now()
);
create index rsvps_invitation on public.rsvps (invitation, created_at desc);

create table public.wishes (
  id uuid primary key default gen_random_uuid(),
  invitation text not null references public.invitations (slug) on delete cascade,
  guest text not null check (char_length(guest) between 1 and 80),
  body text not null check (char_length(body) between 1 and 500),
  hidden boolean not null default false,
  created_at timestamptz not null default now()
);
create index wishes_invitation on public.wishes (invitation, created_at desc);

alter table public.team_members enable row level security;
alter table public.access_codes enable row level security;
alter table public.invitations enable row level security;
alter table public.rsvps enable row level security;
alter table public.wishes enable row level security;
revoke all on public.team_members, public.access_codes, public.invitations, public.rsvps, public.wishes from public, anon, authenticated;

-- ---------------------------------------------------------------- private helpers (not reachable from the API)
create or replace function private.norm_code(raw text) returns text
language sql immutable set search_path = '' as $$
  select upper(regexp_replace(coalesce(raw, ''), '[^A-Za-z0-9-]', '', 'g'));
$$;

-- NAWALA- and eight characters from an alphabet without 0, 1, I and O.
create or replace function private.new_code() returns text
language plpgsql set search_path = '' as $$
declare
  abc constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  pos constant int[] := array[0, 1, 2, 3, 4, 5, 9, 10];   -- bytes of a v4 uuid that are fully random
  raw bytea := decode(replace(gen_random_uuid()::text, '-', ''), 'hex');
  made text := 'NAWALA-';
  i int;
begin
  for i in 1..8 loop
    made := made || substr(abc, 1 + (get_byte(raw, pos[i]) % 32), 1);
  end loop;
  return made;
end $$;

-- Who is calling. Raises (the API answers 403) when the token is unknown or ended.
create or replace function private.team_id(t text) returns uuid
language plpgsql security definer set search_path = '' as $$
declare m uuid;
begin
  if t is null or char_length(t) < 32 then
    raise exception 'unknown team token' using errcode = '28000';
  end if;
  update public.team_members tm set last_seen_at = now()
   where tm.token_hash = encode(sha256(convert_to(t, 'UTF8')), 'hex') and tm.ended_at is null
   returning tm.id into m;
  if m is null then
    raise exception 'unknown team token' using errcode = '28000';
  end if;
  return m;
end $$;

-- Run by hand in the SQL editor. Shows the token once; only its hash is kept.
create or replace function private.new_team_token(member_name text, member_role text default 'operator') returns text
language plpgsql security definer set search_path = '' as $$
declare tok text := replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', '');
begin
  insert into public.team_members (name, role, token_hash)
  values (btrim(member_name), member_role, encode(sha256(convert_to(tok, 'UTF8')), 'hex'));
  return tok;
end $$;

revoke all on function private.norm_code(text), private.new_code(), private.team_id(text), private.new_team_token(text, text)
  from public, anon, authenticated;

-- ---------------------------------------------------------------- the home page: is this code good?
create or replace function public.check_access_code(code text) returns boolean
language plpgsql stable security definer set search_path = '' as $$
declare c text := private.norm_code(code);
begin
  return exists (
    select 1 from public.access_codes a
    where a.code = c and a.ended_at is null and (a.expires_at is null or a.expires_at > now()));
end $$;

-- ---------------------------------------------------------------- the couple's room
create or replace function public.room_open(p_code text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare c text := private.norm_code(p_code); r record;
begin
  update public.access_codes a set last_used_at = now()
   where a.code = c and a.ended_at is null and (a.expires_at is null or a.expires_at > now())
   returning a.code, a.label, a.created_at, a.expires_at, a.state into r;
  if not found then return null; end if;
  return jsonb_build_object('code', r.code, 'label', r.label, 'created_at', r.created_at,
    'expires_at', r.expires_at, 'now', now(), 'state', r.state);
end $$;

create or replace function public.room_save(p_code text, p_state jsonb) returns boolean
language plpgsql security definer set search_path = '' as $$
declare c text := private.norm_code(p_code); s jsonb;
begin
  if p_state is null or jsonb_typeof(p_state) <> 'object' or octet_length(p_state::text) > 8000 then
    return false;
  end if;
  s := jsonb_build_object(
    'saved', case when jsonb_typeof(p_state -> 'saved') = 'array' then p_state -> 'saved' else '[]'::jsonb end,
    'no', case when jsonb_typeof(p_state -> 'no') = 'array' then p_state -> 'no' else '[]'::jsonb end,
    'answers', case when jsonb_typeof(p_state -> 'answers') = 'array' then p_state -> 'answers' else '[]'::jsonb end,
    'final', case when jsonb_typeof(p_state -> 'final') = 'string' then p_state -> 'final' else '""'::jsonb end,
    'call', case when jsonb_typeof(p_state -> 'call') = 'object' then p_state -> 'call' else 'null'::jsonb end);
  update public.access_codes a set state = s, last_used_at = now()
   where a.code = c and a.ended_at is null and (a.expires_at is null or a.expires_at > now());
  return found;
end $$;

-- ---------------------------------------------------------------- a live invitation and its guests
-- Both return the row's id (null when nothing was kept). The page keeps that id on the guest's phone and sends it
-- back as p_replace when the guest changes an answer, so one guest stays one row.
create or replace function public.guest_rsvp(p_invitation text, p_guest text, p_attending text, p_headcount int, p_replace uuid default null) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  g text := left(btrim(regexp_replace(coalesce(p_guest, ''), '\s+', ' ', 'g')), 80);
  n smallint := case when p_attending = 'hadir' then least(greatest(coalesce(p_headcount, 1), 1), 10) else 0 end;
  made uuid;
begin
  if char_length(g) < 1 or p_attending is null or p_attending not in ('hadir', 'tidak', 'ragu') then return null; end if;
  if not exists (select 1 from public.invitations v where v.slug = p_invitation and v.active) then return null; end if;
  if p_replace is not null then
    update public.rsvps r set guest = g, attending = p_attending, headcount = n, created_at = now()
     where r.id = p_replace and r.invitation = p_invitation returning r.id into made;
    if made is not null then return made; end if;
  end if;
  if (select count(*) from public.rsvps r where r.invitation = p_invitation) >= 5000 then return null; end if;
  insert into public.rsvps (invitation, guest, attending, headcount) values (p_invitation, g, p_attending, n) returning id into made;
  return made;
end $$;

create or replace function public.guest_wish(p_invitation text, p_guest text, p_body text, p_replace uuid default null) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  g text := left(btrim(regexp_replace(coalesce(p_guest, ''), '\s+', ' ', 'g')), 80);
  b text := left(btrim(coalesce(p_body, '')), 500);
  made uuid;
begin
  if char_length(g) < 1 or char_length(b) < 1 then return null; end if;
  if not exists (select 1 from public.invitations v where v.slug = p_invitation and v.active) then return null; end if;
  if p_replace is not null then
    update public.wishes w set guest = g, body = b
     where w.id = p_replace and w.invitation = p_invitation returning w.id into made;
    if made is not null then return made; end if;
  end if;
  if (select count(*) from public.wishes w where w.invitation = p_invitation) >= 5000 then return null; end if;
  insert into public.wishes (invitation, guest, body) values (p_invitation, g, b) returning id into made;
  return made;
end $$;

create or replace function public.guest_wishes(p_invitation text) returns jsonb
language sql stable security definer set search_path = '' as $$
  select coalesce(jsonb_agg(jsonb_build_object('name', x.guest, 'text', x.body, 'at', x.created_at)), '[]'::jsonb)
  from (select w.guest, w.body, w.created_at from public.wishes w
        where w.invitation = p_invitation and not w.hidden
        order by w.created_at desc limit 100) x;
$$;

-- ---------------------------------------------------------------- the team console
create or replace function public.team_data(t text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare m uuid := private.team_id(t);
begin
  return jsonb_build_object(
    'me', (select jsonb_build_object('name', tm.name, 'role', tm.role) from public.team_members tm where tm.id = m),
    'now', now(),
    'leads', coalesce((select jsonb_agg(to_jsonb(l)) from (
        select ld.id, ld.created_at, ld.name, ld.wedding_month, ld.wedding_year, ld.whatsapp, ld.lang, ld.source,
               ld.theme, ld.stage, ld.stage_at, ld.contacted_at
        from public.leads ld order by ld.created_at desc limit 3000) l), '[]'::jsonb),
    'codes', coalesce((select jsonb_agg(to_jsonb(c)) from (
        select a.code, a.label, a.lead_id, a.created_at, a.expires_at, a.ended_at, a.ordered_at, a.last_used_at,
               case when jsonb_typeof(a.state -> 'saved') = 'array' then jsonb_array_length(a.state -> 'saved') else 0 end
             + case when jsonb_typeof(a.state -> 'no') = 'array' then jsonb_array_length(a.state -> 'no') else 0 end as seen,
               case when jsonb_typeof(a.state -> 'saved') = 'array' then jsonb_array_length(a.state -> 'saved') else 0 end as saved,
               a.state ->> 'final' as final, a.state -> 'call' as call
        from public.access_codes a order by a.created_at desc limit 3000) c), '[]'::jsonb),
    'invitations', coalesce((select jsonb_agg(to_jsonb(i)) from (
        select v.slug, v.couple, v.theme, v.active, v.created_at,
               (select count(*) from public.rsvps r where r.invitation = v.slug) as answers,
               (select coalesce(sum(r.headcount), 0) from public.rsvps r where r.invitation = v.slug and r.attending = 'hadir') as coming
        from public.invitations v order by v.created_at desc limit 500) i), '[]'::jsonb),
    'wishes', coalesce((select jsonb_agg(to_jsonb(w)) from (
        select ws.id, ws.invitation, ws.guest, ws.body, ws.hidden, ws.created_at
        from public.wishes ws order by ws.created_at desc limit 300) w), '[]'::jsonb));
end $$;

create or replace function public.team_set_stage(t text, p_lead uuid, p_stage text) returns boolean
language plpgsql security definer set search_path = '' as $$
declare m uuid := private.team_id(t);
begin
  if p_stage is null or p_stage not in ('baru', 'dihubungi', 'konsep', 'produksi', 'tayang') then
    raise exception 'unknown stage' using errcode = '22023';
  end if;
  update public.leads ld
     set stage = p_stage, stage_at = now(),
         contacted_at = case when p_stage <> 'baru' then coalesce(ld.contacted_at, now()) else ld.contacted_at end
   where ld.id = p_lead;
  return found;
end $$;

-- p_days null: a code with no end date.
create or replace function public.team_make_code(t text, p_label text, p_days int, p_lead uuid default null) returns text
language plpgsql security definer set search_path = '' as $$
declare m uuid := private.team_id(t); c text; tries int := 0; lbl text := left(btrim(coalesce(p_label, '')), 40);
begin
  if char_length(lbl) < 1 then raise exception 'say who the code is for' using errcode = '22023'; end if;
  if p_days is not null and (p_days < 1 or p_days > 3650) then raise exception 'days out of range' using errcode = '22023'; end if;
  loop
    c := private.new_code(); tries := tries + 1;
    begin
      insert into public.access_codes (code, label, lead_id, created_by, expires_at)
      values (c, lbl, p_lead, m, case when p_days is null then null else now() + make_interval(days => p_days) end);
      return c;
    exception when unique_violation then
      if tries > 5 then raise; end if;
    end;
  end loop;
end $$;

-- p_act: 'perpanjang' (add p_days from today or from its end, whichever is later), 'tanpa-batas' (no end date),
--        'akhiri' (end it now), 'pesanan' (mark as an order), 'bukan-pesanan' (remove that mark).
create or replace function public.team_code(t text, p_code text, p_act text, p_days int default 30) returns boolean
language plpgsql security definer set search_path = '' as $$
declare m uuid := private.team_id(t); c text := private.norm_code(p_code);
begin
  if p_act = 'perpanjang' then
    if p_days is null or p_days < 1 or p_days > 3650 then raise exception 'days out of range' using errcode = '22023'; end if;
    update public.access_codes a
       set expires_at = greatest(coalesce(a.expires_at, now()), now()) + make_interval(days => p_days), ended_at = null
     where a.code = c;
  elsif p_act = 'tanpa-batas' then
    update public.access_codes a set expires_at = null, ended_at = null where a.code = c;
  elsif p_act = 'akhiri' then
    update public.access_codes a set ended_at = now() where a.code = c;
  elsif p_act = 'pesanan' then
    update public.access_codes a set ordered_at = coalesce(a.ordered_at, now()) where a.code = c;
  elsif p_act = 'bukan-pesanan' then
    update public.access_codes a set ordered_at = null where a.code = c;
  else
    raise exception 'unknown action' using errcode = '22023';
  end if;
  return found;
end $$;

create or replace function public.team_wish(t text, p_id uuid, p_hide boolean) returns boolean
language plpgsql security definer set search_path = '' as $$
declare m uuid := private.team_id(t);
begin
  update public.wishes w set hidden = coalesce(p_hide, true) where w.id = p_id;
  return found;
end $$;

-- A live invitation needs a row here before its guests can answer. p_active false switches answers off.
create or replace function public.team_invitation(t text, p_slug text, p_couple text, p_theme text default null, p_active boolean default true) returns boolean
language plpgsql security definer set search_path = '' as $$
declare m uuid := private.team_id(t);
begin
  insert into public.invitations (slug, couple, theme, active)
  values (p_slug, left(btrim(coalesce(p_couple, '')), 80), p_theme, coalesce(p_active, true))
  on conflict (slug) do update set couple = excluded.couple, theme = excluded.theme, active = excluded.active;
  return true;
end $$;

-- ---------------------------------------------------------------- who may call what
revoke all on function
  public.check_access_code(text), public.room_open(text), public.room_save(text, jsonb),
  public.guest_rsvp(text, text, text, int, uuid), public.guest_wish(text, text, text, uuid), public.guest_wishes(text),
  public.team_data(text), public.team_set_stage(text, uuid, text), public.team_make_code(text, text, int, uuid),
  public.team_code(text, text, text, int), public.team_wish(text, uuid, boolean),
  public.team_invitation(text, text, text, text, boolean)
  from public, anon, authenticated;
grant execute on function
  public.check_access_code(text), public.room_open(text), public.room_save(text, jsonb),
  public.guest_rsvp(text, text, text, int, uuid), public.guest_wish(text, text, text, uuid), public.guest_wishes(text),
  public.team_data(text), public.team_set_stage(text, uuid, text), public.team_make_code(text, text, int, uuid),
  public.team_code(text, text, text, int), public.team_wish(text, uuid, boolean),
  public.team_invitation(text, text, text, text, boolean)
  to anon, authenticated;

commit;
