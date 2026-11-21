-- The team console's door (21 Nov 2026, later the same day).
-- The owner asked for a token he can remember. A short token is only safe if guessing is limited, so:
--   * new team tokens look like NAWALA-TIM-XXXXXX (six characters from an alphabet without 0, 1, I and O; capitals or not);
--   * five wrong tries from one address close the door to that address for 15 minutes;
--   * fifty wrong tries from everywhere in 15 minutes close it to everyone for that time (many addresses, one attacker).
-- A wrong token no longer raises an error, because an error would undo the note that counts the try:
-- team_data answers {"denied": "salah" | "terkunci"} and the other team functions answer null.
-- Make or replace a token by hand in the SQL editor, where it is shown once:
--   select private.new_team_token('Adjisena');             -- an existing name gets a new token, the old one stops working
--   select private.new_team_token('Nama Baru', 'operator'); -- a new member

begin;

create table private.door_tries (
  id bigint generated always as identity primary key,
  ip text not null,
  at timestamptz not null default now()
);
create index door_tries_at on private.door_tries (at);
alter table private.door_tries enable row level security;
revoke all on private.door_tries from public, anon, authenticated;

-- The caller's address as the API gateway reports it.
create or replace function private.caller_ip() returns text
language plpgsql stable set search_path = '' as $$
declare h json; ip text;
begin
  begin
    h := nullif(current_setting('request.headers', true), '')::json;
  exception when others then h := null;
  end;
  ip := coalesce(nullif(btrim(h ->> 'cf-connecting-ip'), ''), nullif(btrim(split_part(coalesce(h ->> 'x-forwarded-for', ''), ',', 1)), ''), 'unknown');
  return left(ip, 60);
end $$;

create or replace function private.door_left(p_ip text) returns int
language sql stable security definer set search_path = '' as $$
  select case
    when (select count(*) from private.door_tries d where d.at > now() - interval '15 minutes') >= 50 then 0
    else greatest(0, 5 - (select count(*) from private.door_tries d where d.ip = p_ip and d.at > now() - interval '15 minutes'))::int
  end;
$$;

-- Who is calling: a member's id, or null (wrong token, or the door is closed). Never raises.
create or replace function private.team_id(t text) returns uuid
language plpgsql security definer set search_path = '' as $$
declare m uuid; caller text := private.caller_ip(); raw text := coalesce(t, ''); tidy text;
begin
  if private.door_left(caller) = 0 then return null; end if;
  if char_length(raw) between 12 and 128 then
    tidy := upper(regexp_replace(raw, '\s', '', 'g'));
    update public.team_members tm set last_seen_at = now()
     where tm.ended_at is null
       and tm.token_hash in (encode(sha256(convert_to(raw, 'UTF8')), 'hex'), encode(sha256(convert_to(tidy, 'UTF8')), 'hex'))
     returning tm.id into m;
  end if;
  if m is null then
    insert into private.door_tries (ip) values (caller);
    delete from private.door_tries d where d.at < now() - interval '1 day';
  else
    delete from private.door_tries d where d.ip = caller;
  end if;
  return m;
end $$;

drop function private.new_team_token(text, text);
create or replace function private.new_team_token(member_name text, member_role text default null) returns text
language plpgsql security definer set search_path = '' as $$
declare
  abc constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  pos constant int[] := array[0, 1, 2, 3, 4, 5];   -- bytes of a v4 uuid that are fully random
  raw bytea; tok text; i int; tries int := 0; who text := btrim(member_name); hash text;
begin
  loop
    raw := decode(replace(gen_random_uuid()::text, '-', ''), 'hex'); tok := 'NAWALA-TIM-'; tries := tries + 1;
    for i in 1..6 loop tok := tok || substr(abc, 1 + (get_byte(raw, pos[i]) % 32), 1); end loop;
    hash := encode(sha256(convert_to(tok, 'UTF8')), 'hex');
    begin
      update public.team_members tm
         set token_hash = hash, ended_at = null, role = coalesce(member_role, tm.role)
       where lower(tm.name) = lower(who);
      if not found then
        insert into public.team_members (name, role, token_hash) values (who, coalesce(member_role, 'operator'), hash);
      end if;
      return tok;
    exception when unique_violation then
      if tries > 5 then raise; end if;
    end;
  end loop;
end $$;

revoke all on function private.caller_ip(), private.door_left(text), private.team_id(text), private.new_team_token(text, text)
  from public, anon, authenticated;

-- ---------------------------------------------------------------- the team functions, now answering instead of raising
create or replace function public.team_data(t text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare m uuid := private.team_id(t); tries_left int;
begin
  if m is null then
    tries_left := private.door_left(private.caller_ip());
    return jsonb_build_object('denied', case when tries_left = 0 then 'terkunci' else 'salah' end, 'sisa', tries_left);
  end if;
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
  if m is null then return null; end if;
  if p_stage is null or p_stage not in ('baru', 'dihubungi', 'konsep', 'produksi', 'tayang') then
    raise exception 'unknown stage' using errcode = '22023';
  end if;
  update public.leads ld
     set stage = p_stage, stage_at = now(),
         contacted_at = case when p_stage <> 'baru' then coalesce(ld.contacted_at, now()) else ld.contacted_at end
   where ld.id = p_lead;
  return found;
end $$;

create or replace function public.team_make_code(t text, p_label text, p_days int, p_lead uuid default null) returns text
language plpgsql security definer set search_path = '' as $$
declare m uuid := private.team_id(t); c text; tries int := 0; lbl text := left(btrim(coalesce(p_label, '')), 40);
begin
  if m is null then return null; end if;
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

create or replace function public.team_code(t text, p_code text, p_act text, p_days int default 30) returns boolean
language plpgsql security definer set search_path = '' as $$
declare m uuid := private.team_id(t); c text := private.norm_code(p_code);
begin
  if m is null then return null; end if;
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
  if m is null then return null; end if;
  update public.wishes w set hidden = coalesce(p_hide, true) where w.id = p_id;
  return found;
end $$;

create or replace function public.team_invitation(t text, p_slug text, p_couple text, p_theme text default null, p_active boolean default true) returns boolean
language plpgsql security definer set search_path = '' as $$
declare m uuid := private.team_id(t);
begin
  if m is null then return null; end if;
  insert into public.invitations (slug, couple, theme, active)
  values (p_slug, left(btrim(coalesce(p_couple, '')), 80), p_theme, coalesce(p_active, true))
  on conflict (slug) do update set couple = excluded.couple, theme = excluded.theme, active = excluded.active;
  return true;
end $$;

commit;
