-- Denah & Kursi, the seating planner (22 Nov 2026). Owner's decisions: the couple (in their room) and the team (on
-- the order) lay out the venue and seat the guests; one editor at a time; changes reach guests only after "Terbitkan";
-- open to every order while Nawala is in developer mode (locking it to Eksklusif and Kustom later is one check in
-- private.seat_who); the couple's guest list gains a party size and a group; guests see their table in the live
-- invitation once they have answered "hadir"; ushers get a read-only search behind a key.
--   * guests.party (1 to 20 people per invitation) and guests.grp (the group's name, 40 characters).
--   * invitations.seating (the draft: plans, groups, settings), seating_live (what guests and ushers see),
--     seating_at, seating_pub_at, seating_lock ({key, who, kind, at}; fresh for 90 seconds), seating_key (the usher key).
--   * seating_open, seating_hold, seating_save, seating_publish, seating_release: p_who is a team token that may edit
--     orders, or the couple's access code (their own order only); p_key is the editor's own random key for the lock.
--   * guest_seat(slug, guest name): the guest's table(s) and, unless the couple turned it off, the plan without names.
--   * usher_data(slug, key): the published plan with every guest's name, for the ushers' page.
--   * room_guests_save keeps party and group; the room and the team console get them back.
-- Run after 20261122_worlds_premium.sql.

begin;

alter table public.guests
  add column if not exists party smallint not null default 1 check (party between 1 and 20),
  add column if not exists grp text check (grp is null or char_length(grp) between 1 and 40);

alter table public.invitations
  add column if not exists seating jsonb,
  add column if not exists seating_live jsonb,
  add column if not exists seating_at timestamptz,
  add column if not exists seating_pub_at timestamptz,
  add column if not exists seating_lock jsonb,
  add column if not exists seating_key text;

-- ---------------------------------------------------------------- who is asking
create or replace function private.seat_who(p_who text, p_slug text, out slug text, out name text, out kind text, out ref text)
language plpgsql security definer set search_path = '' as $$
declare m uuid;
begin
  if upper(coalesce(p_who, '')) like 'NAWALA-TIM-%' then
    m := private.team_id(p_who);
    if not private.team_may(m, 'order-edit') then return; end if;
    select v.slug into slug from public.invitations v where v.slug = p_slug and v.status <> 'arsip';
    if slug is null then return; end if;
    name := private.team_name(m); kind := 'tim'; ref := m::text;
  else
    slug := private.room_slug(p_who);
    if slug is null or (coalesce(p_slug, '') <> '' and p_slug <> slug) then slug := null; return; end if;
    ref := private.norm_code(p_who);
    select a.label into name from public.access_codes a where a.code = ref;
    name := coalesce(name, 'Pasangan'); kind := 'pasangan';
  end if;
end $$;

create or replace function private.seat_log(p_kind text, p_ref text, p_slug text, p_key text, p_id text, p_en text) returns void
language plpgsql security definer set search_path = '' as $$
declare nm text;
begin
  if p_kind = 'tim' then
    select v.couple into nm from public.invitations v where v.slug = p_slug;
    perform private.log_team(p_ref::uuid, p_key || ':' || p_slug, p_id || ' ' || coalesce(nm, p_slug), p_en || ' ' || coalesce(nm, p_slug), interval '10 minutes');
  else
    perform private.log_couple(p_ref, p_key, p_id, p_en, interval '10 minutes');
  end if;
end $$;

-- takes the lock when it is free, stale (90 s) or already this editor's; answers who holds it
create or replace function private.seat_lock(p_slug text, p_key text, p_who text, p_kind text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare l jsonb;
begin
  if coalesce(p_key, '') !~ '^[A-Za-z0-9-]{8,64}$' then return jsonb_build_object('mine', false); end if;
  update public.invitations v set seating_lock = jsonb_build_object('key', p_key, 'who', p_who, 'kind', p_kind, 'at', now())
   where v.slug = p_slug
     and (v.seating_lock is null or v.seating_lock ->> 'key' = p_key or (v.seating_lock ->> 'at')::timestamptz < now() - interval '90 seconds')
   returning v.seating_lock into l;
  if l is not null then return jsonb_build_object('mine', true); end if;
  select v.seating_lock into l from public.invitations v where v.slug = p_slug;
  return jsonb_build_object('mine', false, 'who', l ->> 'who', 'kind', l ->> 'kind', 'at', l ->> 'at');
end $$;

create or replace function private.seat_guests(p_slug text) returns jsonb
language sql stable security definer set search_path = '' as $$
  select coalesce(jsonb_agg(jsonb_build_object('id', g.id, 'name', g.name, 'party', g.party, 'grp', g.grp,
           'answer', (select r.attending from public.rsvps r where r.invitation = p_slug and lower(r.guest) = lower(g.name) order by r.created_at desc limit 1))
           order by g.created_at), '[]'::jsonb)
  from public.guests g where g.invitation = p_slug;
$$;

-- a published plan for people outside the editor: no venue picture, chairs only marked taken or free
create or replace function private.seat_public(p_live jsonb) returns jsonb
language sql immutable set search_path = '' as $$
  select coalesce(jsonb_agg(
    (l - 'bg') || jsonb_build_object('items', coalesce((select jsonb_agg(
        case when jsonb_typeof(i -> 'seat') = 'array'
          then jsonb_set(i, '{seat}', coalesce((select jsonb_agg(case when s = 'null'::jsonb then 'null'::jsonb else '1'::jsonb end order by n)
                                              from jsonb_array_elements(i -> 'seat') with ordinality as e(s, n)), '[]'::jsonb))
          else i end order by k)
      from jsonb_array_elements(l -> 'items') with ordinality as q(i, k)), '[]'::jsonb)) order by p), '[]'::jsonb)
  from jsonb_array_elements(coalesce(p_live -> 'layouts', '[]'::jsonb)) with ordinality as w(l, p);
$$;

-- ---------------------------------------------------------------- the editor
create or replace function public.seating_open(p_who text, p_slug text, p_key text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare w record; v record;
begin
  select * into w from private.seat_who(p_who, p_slug);
  if w.slug is null then return null; end if;
  select x.slug, x.couple, x.status, x.seating, x.seating_live, x.seating_at, x.seating_pub_at, x.seating_key into v
    from public.invitations x where x.slug = w.slug;
  return jsonb_build_object('slug', v.slug, 'couple', v.couple, 'status', v.status, 'as', w.kind, 'me', w.name,
    'seating', v.seating, 'live', v.seating_live, 'at', v.seating_at, 'pub_at', v.seating_pub_at,
    'usher', v.seating_key, 'guests', private.seat_guests(v.slug), 'lock', private.seat_lock(v.slug, p_key, w.name, w.kind), 'now', now());
end $$;

create or replace function public.seating_hold(p_who text, p_slug text, p_key text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare w record;
begin
  select * into w from private.seat_who(p_who, p_slug);
  if w.slug is null then return null; end if;
  return private.seat_lock(w.slug, p_key, w.name, w.kind);
end $$;

-- p_guests: optional [{id, party, grp}] for guests whose party size or group was changed in the planner
create or replace function public.seating_save(p_who text, p_slug text, p_key text, p_seating jsonb, p_guests jsonb default null) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare w record; l jsonb;
begin
  select * into w from private.seat_who(p_who, p_slug);
  if w.slug is null then return null; end if;
  if p_seating is null or jsonb_typeof(p_seating) <> 'object' or jsonb_typeof(p_seating -> 'layouts') <> 'array'
     or jsonb_array_length(p_seating -> 'layouts') > 12 or octet_length(p_seating::text) > 900000 then
    return jsonb_build_object('ok', false, 'error', 'bentuk');
  end if;
  l := private.seat_lock(w.slug, p_key, w.name, w.kind);
  if not (l ->> 'mine')::boolean then return jsonb_build_object('ok', false, 'lock', l); end if;
  update public.invitations v set seating = p_seating, seating_at = now() where v.slug = w.slug;
  if jsonb_typeof(p_guests) = 'array' and jsonb_array_length(p_guests) <= 1500 then
    update public.guests g
       set party = greatest(1, least(20, coalesce((e ->> 'party')::int, g.party))),
           grp = case when e ? 'grp' then nullif(left(btrim(coalesce(e ->> 'grp', '')), 40), '') else g.grp end
      from jsonb_array_elements(p_guests) e
     where g.invitation = w.slug and (e ->> 'id') ~ '^[0-9a-f-]{36}$' and g.id = (e ->> 'id')::uuid;
  end if;
  perform private.seat_log(w.kind, w.ref, w.slug, 'denah', 'Menyusun denah dan kursi', 'Worked on the floor plan and seats');
  return jsonb_build_object('ok', true, 'at', now());
end $$;

create or replace function public.seating_publish(p_who text, p_slug text, p_key text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare w record; l jsonb; k text;
begin
  select * into w from private.seat_who(p_who, p_slug);
  if w.slug is null then return null; end if;
  l := private.seat_lock(w.slug, p_key, w.name, w.kind);
  if not (l ->> 'mine')::boolean then return jsonb_build_object('ok', false, 'lock', l); end if;
  update public.invitations v set seating_live = v.seating, seating_pub_at = now(),
         seating_key = coalesce(v.seating_key, substr(replace(gen_random_uuid()::text, '-', ''), 1, 16))
   where v.slug = w.slug and v.seating is not null returning v.seating_key into k;
  if k is null then return jsonb_build_object('ok', false, 'error', 'kosong'); end if;
  if w.kind = 'tim' then
    perform private.log_team(w.ref::uuid, 'denah-terbit:' || w.slug, 'Menerbitkan denah ' || w.slug, 'Published the floor plan of ' || w.slug);
  else
    perform private.log_couple(w.ref, 'denah-terbit', 'Menerbitkan denah dan kursi', 'Published the floor plan and seats');
  end if;
  return jsonb_build_object('ok', true, 'usher', k, 'pub_at', now());
end $$;

create or replace function public.seating_release(p_who text, p_slug text, p_key text) returns boolean
language plpgsql security definer set search_path = '' as $$
declare w record;
begin
  select * into w from private.seat_who(p_who, p_slug);
  if w.slug is null then return null; end if;
  update public.invitations v set seating_lock = null where v.slug = w.slug and v.seating_lock ->> 'key' = p_key;
  return true;
end $$;

-- a new usher key closes the old ushers' link
create or replace function public.seating_usher_renew(p_who text, p_slug text) returns text
language plpgsql security definer set search_path = '' as $$
declare w record; k text;
begin
  select * into w from private.seat_who(p_who, p_slug);
  if w.slug is null then return null; end if;
  update public.invitations v set seating_key = substr(replace(gen_random_uuid()::text, '-', ''), 1, 16)
   where v.slug = w.slug and v.seating_live is not null returning v.seating_key into k;
  return k;
end $$;

-- ---------------------------------------------------------------- guests and ushers
create or replace function public.guest_seat(p_slug text, p_guest text) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare v record; gid uuid; ans text; hits jsonb;
begin
  select x.slug, x.seating_live into v from public.invitations x
   where x.slug = p_slug and x.status = 'tayang' and x.seating_live is not null;
  if v.slug is null or char_length(btrim(coalesce(p_guest, ''))) = 0 then return null; end if;
  select g.id into gid from public.guests g where g.invitation = v.slug and lower(g.name) = lower(btrim(p_guest)) limit 1;
  if gid is null then return null; end if;
  select r.attending into ans from public.rsvps r where r.invitation = v.slug and lower(r.guest) = lower(btrim(p_guest)) order by r.created_at desc limit 1;
  if ans is distinct from 'hadir' then return jsonb_build_object('answer', ans); end if;
  select coalesce(jsonb_agg(jsonb_build_object('plan', p - 1, 'plan_name', l ->> 'name', 'id', i ->> 'id', 'table', i ->> 'name',
           'chairs', (select count(*) from jsonb_array_elements(i -> 'seat') s where s #>> '{}' = gid::text),
           'x', i -> 'x', 'y', i -> 'y', 'w', l -> 'room' -> 'w', 'h', l -> 'room' -> 'h') order by p), '[]'::jsonb) into hits
    from jsonb_array_elements(coalesce(v.seating_live -> 'layouts', '[]'::jsonb)) with ordinality as a(l, p),
         jsonb_array_elements(coalesce(l -> 'items', '[]'::jsonb)) i
   where jsonb_typeof(i -> 'seat') = 'array' and exists (select 1 from jsonb_array_elements(i -> 'seat') s where s #>> '{}' = gid::text);
  return jsonb_build_object('answer', ans, 'seats', hits,
    'plans', case when coalesce(v.seating_live ->> 'showPlan', 'true') = 'false' then null else private.seat_public(v.seating_live) end);
end $$;

create or replace function public.usher_data(p_slug text, p_key text) returns jsonb
language sql stable security definer set search_path = '' as $$
  select jsonb_build_object('couple', v.couple, 'pub_at', v.seating_pub_at,
           'plans', (select coalesce(jsonb_agg((l - 'bg') order by p), '[]'::jsonb) from jsonb_array_elements(coalesce(v.seating_live -> 'layouts', '[]'::jsonb)) with ordinality as a(l, p)),
           'groups', coalesce(v.seating_live -> 'groups', '[]'::jsonb),
           'guests', coalesce((select jsonb_agg(jsonb_build_object('id', g.id, 'name', g.name, 'party', g.party, 'grp', g.grp) order by g.name)
                                 from public.guests g where g.invitation = v.slug), '[]'::jsonb))
  from public.invitations v
  where v.slug = p_slug and v.seating_live is not null and v.seating_key is not null and v.seating_key = coalesce(p_key, '') and v.status <> 'arsip';
$$;

-- ---------------------------------------------------------------- the guest list keeps party and group
create or replace function public.room_guests_save(p_code text, p_guests jsonb) returns boolean
language plpgsql security definer set search_path = '' as $$
declare s text := private.room_slug(p_code); cnt int;
begin
  if s is null or p_guests is null or jsonb_typeof(p_guests) <> 'array' or jsonb_array_length(p_guests) > 1500 then return false; end if;
  create temporary table if not exists pg_temp.new_guests (name text, phone text, sent boolean, party int, grp text) on commit drop;
  delete from pg_temp.new_guests;
  insert into pg_temp.new_guests (name, phone, sent, party, grp)
  select distinct on (lower(n)) n, p, sent, party, grp from (
    select left(btrim(regexp_replace(coalesce(e ->> 'name', ''), '\s+', ' ', 'g')), 80) as n,
           nullif(regexp_replace(coalesce(e ->> 'phone', ''), '[^0-9]', '', 'g'), '') as p,
           coalesce((e ->> 'sent')::boolean, false) as sent,
           case when (e ->> 'party') ~ '^[0-9]{1,2}$' then greatest(1, least(20, (e ->> 'party')::int)) end as party,
           case when e ? 'grp' then coalesce(nullif(left(btrim(coalesce(e ->> 'grp', '')), 40), ''), '') end as grp
    from jsonb_array_elements(p_guests) e) x
  where char_length(n) > 0 order by lower(n);
  update pg_temp.new_guests set phone = null where phone !~ '^[0-9]{8,15}$';
  delete from public.guests g where g.invitation = s and lower(g.name) not in (select lower(ng.name) from pg_temp.new_guests ng);
  update public.guests g set phone = ng.phone, sent_at = case when ng.sent then coalesce(g.sent_at, now()) else null end,
         party = coalesce(ng.party, g.party), grp = case when ng.grp is null then g.grp else nullif(ng.grp, '') end
    from pg_temp.new_guests ng where g.invitation = s and lower(g.name) = lower(ng.name);
  insert into public.guests (invitation, name, phone, sent_at, party, grp)
  select s, ng.name, ng.phone, case when ng.sent then now() end, coalesce(ng.party, 1), nullif(ng.grp, '') from pg_temp.new_guests ng
  where not exists (select 1 from public.guests g where g.invitation = s and lower(g.name) = lower(ng.name));
  select count(*) into cnt from public.guests g where g.invitation = s;
  perform private.log_couple(private.norm_code(p_code), 'tamu', 'Memperbarui daftar tamu (' || cnt || ' tamu)', 'Updated their guest list (' || cnt || ' guests)', interval '10 minutes');
  return true;
end $$;

create or replace function private.room_invitation(p_code text) returns jsonb
language sql stable security definer set search_path = '' as $$
  select jsonb_build_object('slug', v.slug, 'couple', v.couple, 'status', v.status, 'theme', v.theme, 'level', v.level,
           'wording', v.wording, 'draft', v.draft, 'live', v.live is not null, 'submitted_at', v.submitted_at,
           'published_at', v.published_at, 'draft_at', v.draft_at, 'seating_pub_at', v.seating_pub_at,
           'guests', coalesce((select jsonb_agg(jsonb_build_object('id', g.id, 'name', g.name, 'phone', g.phone, 'sent_at', g.sent_at,
                       'party', g.party, 'grp', g.grp,
                       'answer', (select r.attending from public.rsvps r where r.invitation = v.slug and lower(r.guest) = lower(g.name) order by r.created_at desc limit 1))
                       order by g.created_at) from public.guests g where g.invitation = v.slug), '[]'::jsonb))
  from public.invitations v where v.code = p_code and v.status <> 'arsip' limit 1;
$$;

create or replace function public.team_order(t text, p_slug text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare m uuid := private.team_id(t);
begin
  if not private.team_may(m, 'order-view') then return null; end if;
  return jsonb_build_object(
    'guests', coalesce((select jsonb_agg(jsonb_build_object('id', g.id, 'name', g.name, 'phone', g.phone, 'sent_at', g.sent_at,
                 'party', g.party, 'grp', g.grp,
                 'answer', (select r.attending from public.rsvps r where r.invitation = p_slug and lower(r.guest) = lower(g.name) order by r.created_at desc limit 1))
                 order by g.created_at) from public.guests g where g.invitation = p_slug), '[]'::jsonb),
    'rsvps', coalesce((select jsonb_agg(jsonb_build_object('guest', r.guest, 'attending', r.attending, 'headcount', r.headcount, 'at', r.created_at)
                 order by r.created_at desc) from public.rsvps r where r.invitation = p_slug), '[]'::jsonb),
    'wishes', coalesce((select jsonb_agg(jsonb_build_object('id', w.id, 'guest', w.guest, 'body', w.body, 'hidden', w.hidden, 'at', w.created_at)
                 order by w.created_at desc) from public.wishes w where w.invitation = p_slug), '[]'::jsonb),
    'seating_pub_at', (select v.seating_pub_at from public.invitations v where v.slug = p_slug));
end $$;

-- ---------------------------------------------------------------- who may call what
revoke all on function private.seat_who(text, text), private.seat_log(text, text, text, text, text, text),
  private.seat_lock(text, text, text, text), private.seat_guests(text), private.seat_public(jsonb), private.room_invitation(text)
  from public, anon, authenticated;
revoke all on function public.seating_open(text, text, text), public.seating_hold(text, text, text),
  public.seating_save(text, text, text, jsonb, jsonb), public.seating_publish(text, text, text), public.seating_release(text, text, text),
  public.seating_usher_renew(text, text), public.guest_seat(text, text), public.usher_data(text, text),
  public.room_guests_save(text, jsonb), public.team_order(text, text)
  from public;
grant execute on function public.seating_open(text, text, text), public.seating_hold(text, text, text),
  public.seating_save(text, text, text, jsonb, jsonb), public.seating_publish(text, text, text), public.seating_release(text, text, text),
  public.seating_usher_renew(text, text), public.guest_seat(text, text), public.usher_data(text, text),
  public.room_guests_save(text, jsonb), public.team_order(text, text)
  to anon, authenticated;

commit;
