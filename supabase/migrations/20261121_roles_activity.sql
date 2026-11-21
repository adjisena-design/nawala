-- Team roles, team management from the console, and the activity log (21 Nov 2026, evening).
-- The owner's decisions:
--   * Three ranks. Pemilik (the owner, total control), Superadmin (Alvin: sees everything, makes and ends codes,
--     manages admins), Admin (the rest: the basics only). Admins never add or remove anyone.
--   * People are added, given a new token, moved between ranks and cut off from the console (inside Kode).
--     The token is shown once on screen; only its sha256 is kept. Cutting someone off works at once,
--     including on a console they still have open.
--   * An activity log in its own menu, seen by the owner and superadmins only: who, when, and a one-line note of
--     what they did. Team and couples both. No address, device or before/after values. Kept 30 days.
--
-- What an admin may do: work requests (reply, move stages), open orders and edit their details, checklist,
-- deadline and notes, see guests and answers, hide or show wishes, preview. Everything else needs a superadmin:
-- access codes (they do not even see them), new orders (an order makes a code), payment, archiving,
-- publishing and taking offline, adding, editing, hiding, owning and deleting themes, the team, the log.
-- That list lives in one place below (private.admin_may) so it can be changed with one edit.
--
-- Run after the five earlier migrations, in the dashboard's SQL editor.

begin;

-- ---------------------------------------------------------------- ranks
alter table public.team_members drop constraint if exists team_members_role_check;
update public.team_members set role = 'admin' where role = 'operator';
alter table public.team_members add constraint team_members_role_check check (role in ('pemilik', 'superadmin', 'admin'));
alter table public.team_members alter column role set default 'admin';
create unique index if not exists team_members_name on public.team_members (lower(name));

create or replace function private.rank_of(p_role text) returns int
language sql immutable set search_path = '' as $$
  select case p_role when 'pemilik' then 3 when 'superadmin' then 2 when 'admin' then 1 else 0 end;
$$;

create or replace function private.team_rank(m uuid) returns int
language sql stable security definer set search_path = '' as $$
  select coalesce((select private.rank_of(tm.role) from public.team_members tm where tm.id = m and tm.ended_at is null), 0);
$$;

-- The one list of what an admin may do. Anything not named here needs rank 2 (superadmin) or more.
create or replace function private.admin_may(p_what text) returns boolean
language sql immutable set search_path = '' as $$
  select p_what in ('stage', 'order-edit', 'order-view', 'wish');
$$;

create or replace function private.team_may(m uuid, p_what text) returns boolean
language sql stable security definer set search_path = '' as $$
  select m is not null and (private.team_rank(m) >= 2 or (private.team_rank(m) = 1 and private.admin_may(p_what)));
$$;

create or replace function private.team_name(m uuid) returns text
language sql stable security definer set search_path = '' as $$
  select tm.name from public.team_members tm where tm.id = m;
$$;

-- ---------------------------------------------------------------- tokens
-- NAWALA-TIM- and six characters from an alphabet without 0, 1, I and O. Sets a member's token and returns it once.
create or replace function private.set_team_token(p_id uuid) returns text
language plpgsql security definer set search_path = '' as $$
declare
  abc constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  pos constant int[] := array[0, 1, 2, 3, 4, 5];
  raw bytea; tok text; i int; tries int := 0;
begin
  loop
    raw := decode(replace(gen_random_uuid()::text, '-', ''), 'hex'); tok := 'NAWALA-TIM-'; tries := tries + 1;
    for i in 1..6 loop tok := tok || substr(abc, 1 + (get_byte(raw, pos[i]) % 32), 1); end loop;
    begin
      update public.team_members tm set token_hash = encode(sha256(convert_to(tok, 'UTF8')), 'hex'), ended_at = null where tm.id = p_id;
      return tok;
    exception when unique_violation then
      if tries > 5 then raise; end if;
    end;
  end loop;
end $$;

-- Still works by hand in the SQL editor (the first owner token, or a lost one).
drop function if exists private.new_team_token(text, text);
create or replace function private.new_team_token(member_name text, member_role text default null) returns text
language plpgsql security definer set search_path = '' as $$
declare who text := btrim(member_name); mid uuid;
begin
  select tm.id into mid from public.team_members tm where lower(tm.name) = lower(who);
  if mid is null then
    insert into public.team_members (name, role, token_hash)
    values (who, coalesce(member_role, 'admin'), 'x' || replace(gen_random_uuid()::text, '-', ''))
    returning team_members.id into mid;
  elsif member_role is not null then
    update public.team_members tm set role = member_role where tm.id = mid;
  end if;
  return private.set_team_token(mid);
end $$;

-- ---------------------------------------------------------------- the activity log
create table if not exists private.activity (
  id bigint generated always as identity primary key,
  at timestamptz not null default now(),
  kind text not null check (kind in ('tim', 'pasangan')),
  ref text not null,          -- the member's id or the couple's code (to group their entries)
  who text not null,          -- the member's name or the code's label, as it was then
  key text not null,          -- what kind of entry, for grouping repeated saves
  say_id text not null,
  say_en text not null
);
create index if not exists activity_at on private.activity (at desc);
create index if not exists activity_ref on private.activity (ref, key, at desc);
alter table private.activity enable row level security;
revoke all on private.activity from public, anon, authenticated;

-- p_within: if this person wrote an entry with the same key within that time, either skip (p_skip) or refresh it,
-- so a couple typing for ten minutes is one line, not six hundred.
create or replace function private.log(p_kind text, p_ref text, p_who text, p_key text, p_id text, p_en text,
                                       p_within interval default null, p_skip boolean default false) returns void
language plpgsql security definer set search_path = '' as $$
declare last bigint;
begin
  if p_ref is null or p_who is null then return; end if;
  if p_within is not null then
    select a.id into last from private.activity a
     where a.ref = p_ref and a.key = p_key and a.at > now() - p_within order by a.at desc limit 1;
    if last is not null then
      if not p_skip then update private.activity a set at = now(), say_id = p_id, say_en = p_en where a.id = last; end if;
      return;
    end if;
  end if;
  insert into private.activity (kind, ref, who, key, say_id, say_en) values (p_kind, p_ref, left(p_who, 80), p_key, left(p_id, 300), left(p_en, 300));
  delete from private.activity a where a.at < now() - interval '30 days';
end $$;

create or replace function private.log_team(m uuid, p_key text, p_id text, p_en text, p_within interval default null, p_skip boolean default false) returns void
language sql security definer set search_path = '' as $$
  select private.log('tim', m::text, private.team_name(m), p_key, p_id, p_en, p_within, p_skip);
$$;

create or replace function private.log_couple(p_code text, p_key text, p_id text, p_en text, p_within interval default null, p_skip boolean default false) returns void
language sql security definer set search_path = '' as $$
  select private.log('pasangan', a.code, a.label, p_key, p_id, p_en, p_within, p_skip) from public.access_codes a where a.code = p_code;
$$;

create or replace function private.stage_name(p_stage text, p_en boolean) returns text
language sql immutable set search_path = '' as $$
  select case when p_en then case p_stage when 'baru' then 'New' when 'dihubungi' then 'Contacted' when 'konsep' then 'Concept' when 'produksi' then 'Production' when 'tayang' then 'Live' else p_stage end
              else case p_stage when 'baru' then 'Baru' when 'dihubungi' then 'Dihubungi' when 'konsep' then 'Konsep' when 'produksi' then 'Produksi' when 'tayang' then 'Tayang' else p_stage end end;
$$;

create or replace function private.role_name(p_role text, p_en boolean) returns text
language sql immutable set search_path = '' as $$
  select case p_role when 'pemilik' then case when p_en then 'Owner' else 'Pemilik' end when 'superadmin' then 'Superadmin' else 'Admin' end;
$$;

revoke all on function private.rank_of(text), private.team_rank(uuid), private.admin_may(text), private.team_may(uuid, text),
  private.team_name(uuid), private.set_team_token(uuid), private.new_team_token(text, text),
  private.log(text, text, text, text, text, text, interval, boolean), private.log_team(uuid, text, text, text, interval, boolean),
  private.log_couple(text, text, text, text, interval, boolean), private.stage_name(text, boolean), private.role_name(text, boolean)
  from public, anon, authenticated;

-- ---------------------------------------------------------------- logging in, and the check that keeps a console honest
-- p_login true: the console was just opened or the door was just passed (one entry per 30 minutes at most).
-- p_login false: the console asking every minute whether this person may still be here. Null means no: cut off.
create or replace function public.team_hello(t text, p_login boolean default false) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare m uuid := private.team_id(t);
begin
  if m is null then return null; end if;
  if p_login then perform private.log_team(m, 'masuk', 'Masuk ke konsol tim', 'Logged in to the team console', interval '30 minutes', true); end if;
  return (select jsonb_build_object('name', tm.name, 'role', tm.role) from public.team_members tm where tm.id = m);
end $$;

-- ---------------------------------------------------------------- the team: list, add, new token, rank, cut off
create or replace function private.team_list(m uuid) returns jsonb
language sql stable security definer set search_path = '' as $$
  select coalesce(jsonb_agg(jsonb_build_object('id', tm.id, 'name', tm.name, 'role', tm.role, 'created_at', tm.created_at,
           'ended_at', tm.ended_at, 'last_seen_at', tm.last_seen_at, 'me', tm.id = m)
         order by tm.ended_at is not null, private.rank_of(tm.role) desc, tm.created_at), '[]'::jsonb)
  from public.team_members tm;
$$;
revoke all on function private.team_list(uuid) from public, anon, authenticated;

-- Answers {token} (shown once) or {error: 'nama' | 'peran' | 'ada' | 'lebih-tinggi'}.
create or replace function public.team_member_add(t text, p_name text, p_role text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare m uuid := private.team_id(t); r int; who text := left(btrim(regexp_replace(coalesce(p_name, ''), '\s+', ' ', 'g')), 40); old record; mid uuid; tok text;
begin
  if m is null then return null; end if;
  r := private.team_rank(m);
  if r < 2 then return null; end if;
  if char_length(who) < 1 then return jsonb_build_object('error', 'nama'); end if;
  if p_role is null or p_role not in ('superadmin', 'admin') or private.rank_of(p_role) >= r then return jsonb_build_object('error', 'peran'); end if;
  select tm.id, tm.role, tm.ended_at into old from public.team_members tm where lower(tm.name) = lower(who);
  if found then
    if old.ended_at is null then return jsonb_build_object('error', 'ada'); end if;
    if private.rank_of(old.role) >= r then return jsonb_build_object('error', 'lebih-tinggi'); end if;
    mid := old.id;
    update public.team_members tm set role = p_role, name = who, created_at = now(), last_seen_at = null where tm.id = mid;
  else
    insert into public.team_members (name, role, token_hash) values (who, p_role, 'x' || replace(gen_random_uuid()::text, '-', ''))
    returning team_members.id into mid;
  end if;
  tok := private.set_team_token(mid);
  perform private.log_team(m, 'tim', 'Menambah ' || who || ' sebagai ' || private.role_name(p_role, false), 'Added ' || who || ' as ' || private.role_name(p_role, true));
  return jsonb_build_object('token', tok, 'name', who, 'role', p_role);
end $$;

-- p_act: 'token' (a new token; the old one stops working at once), 'akhiri' (cut off at once), 'peran' (move to p_role).
-- Anyone may take a new token for themselves. Otherwise the target must rank below the caller,
-- and a new rank must also be below the caller's. Answers {ok, token?} or {error}.
create or replace function public.team_member_act(t text, p_id uuid, p_act text, p_role text default null) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare m uuid := private.team_id(t); r int; tg record; tok text;
begin
  if m is null then return null; end if;
  r := private.team_rank(m);
  select tm.id, tm.name, tm.role, tm.ended_at into tg from public.team_members tm where tm.id = p_id;
  if not found then return jsonb_build_object('error', 'tidak-ada'); end if;
  if p_act = 'token' and tg.id = m then
    tok := private.set_team_token(m);
    perform private.log_team(m, 'tim', 'Mengganti token sendiri', 'Replaced their own token');
    return jsonb_build_object('ok', true, 'token', tok, 'self', true);
  end if;
  if r < 2 then return null; end if;
  if tg.id = m or private.rank_of(tg.role) >= r then return jsonb_build_object('error', 'lebih-tinggi'); end if;
  if p_act = 'token' then
    tok := private.set_team_token(tg.id);
    perform private.log_team(m, 'tim', 'Memberi token baru kepada ' || tg.name, 'Gave ' || tg.name || ' a new token');
    return jsonb_build_object('ok', true, 'token', tok, 'name', tg.name);
  elsif p_act = 'akhiri' then
    if tg.ended_at is not null then return jsonb_build_object('ok', true); end if;
    update public.team_members tm set ended_at = now() where tm.id = tg.id;
    perform private.log_team(m, 'tim', 'Mencabut akses ' || tg.name, 'Revoked ' || tg.name || '''s access');
    return jsonb_build_object('ok', true);
  elsif p_act = 'peran' then
    if p_role is null or p_role not in ('superadmin', 'admin') or private.rank_of(p_role) >= r then return jsonb_build_object('error', 'peran'); end if;
    if tg.role = p_role then return jsonb_build_object('ok', true); end if;
    update public.team_members tm set role = p_role where tm.id = tg.id;
    perform private.log_team(m, 'tim', 'Mengubah peran ' || tg.name || ' menjadi ' || private.role_name(p_role, false), 'Changed ' || tg.name || '''s role to ' || private.role_name(p_role, true));
    return jsonb_build_object('ok', true);
  end if;
  return jsonb_build_object('error', 'aksi');
end $$;

-- The log, newest first, 200 at a time. p_before: the time of the last entry already shown.
create or replace function public.team_activity(t text, p_before timestamptz default null, p_kind text default null) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare m uuid := private.team_id(t);
begin
  if m is null or private.team_rank(m) < 2 then return null; end if;
  return coalesce((select jsonb_agg(jsonb_build_object('at', x.at, 'kind', x.kind, 'who', x.who, 'key', x.key, 'id', x.say_id, 'en', x.say_en) order by x.at desc)
    from (select a.* from private.activity a
          where (p_before is null or a.at < p_before) and (p_kind is null or a.kind = p_kind) and a.at > now() - interval '30 days'
          order by a.at desc limit 200) x), '[]'::jsonb);
end $$;

-- ---------------------------------------------------------------- team_data: now with ranks
create or replace function public.team_data(t text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare m uuid := private.team_id(t); tries_left int; r int; wide boolean;
begin
  if m is null then
    tries_left := private.door_left(private.caller_ip());
    return jsonb_build_object('denied', case when tries_left = 0 then 'terkunci' else 'salah' end, 'sisa', tries_left);
  end if;
  r := private.team_rank(m); wide := r >= 2;
  return jsonb_build_object(
    'me', (select jsonb_build_object('id', tm.id, 'name', tm.name, 'role', tm.role, 'rank', r) from public.team_members tm where tm.id = m),
    'now', now(),
    'leads', coalesce((select jsonb_agg(to_jsonb(l)) from (
        select ld.id, ld.created_at, ld.name, ld.wedding_month, ld.wedding_year, ld.whatsapp, ld.lang, ld.source,
               ld.theme, ld.stage, ld.stage_at, ld.contacted_at
        from public.leads ld order by ld.created_at desc limit 3000) l), '[]'::jsonb),
    'codes', case when not wide then '[]'::jsonb else coalesce((select jsonb_agg(to_jsonb(c)) from (
        select a.code, a.label, a.lead_id, a.created_at, a.expires_at, a.ended_at, a.ordered_at, a.last_used_at,
               case when jsonb_typeof(a.state -> 'saved') = 'array' then jsonb_array_length(a.state -> 'saved') else 0 end
             + case when jsonb_typeof(a.state -> 'no') = 'array' then jsonb_array_length(a.state -> 'no') else 0 end as seen,
               case when jsonb_typeof(a.state -> 'saved') = 'array' then jsonb_array_length(a.state -> 'saved') else 0 end as saved,
               a.state ->> 'final' as final, a.state -> 'call' as call
        from public.access_codes a order by a.created_at desc limit 3000) c), '[]'::jsonb) end,
    'invitations', coalesce((select jsonb_agg(to_jsonb(i)) from (
        select v.slug, v.couple, v.theme, v.active, v.created_at, case when wide then v.code end as code, v.lead_id, v.status, v.level, v.wording,
               v.draft, v.live is not null as has_live, v.pay_status, v.pay_amount, v.pay_date, v.live_by, v.checklist,
               v.notes, v.updated_at, v.submitted_at, v.published_at, v.draft_at,
               (v.live is not null and v.draft_at is not null and v.draft_at > coalesce(v.published_at, v.draft_at)) as pending,
               (select count(*) from public.guests g where g.invitation = v.slug) as guests,
               (select count(*) from public.rsvps r2 where r2.invitation = v.slug) as answers,
               (select coalesce(sum(r2.headcount), 0) from public.rsvps r2 where r2.invitation = v.slug and r2.attending = 'hadir') as coming
        from public.invitations v order by v.created_at desc limit 500) i), '[]'::jsonb),
    'wishes', coalesce((select jsonb_agg(to_jsonb(w)) from (
        select ws.id, ws.invitation, ws.guest, ws.body, ws.hidden, ws.created_at
        from public.wishes ws order by ws.created_at desc limit 300) w), '[]'::jsonb),
    'themes', coalesce((select jsonb_agg(to_jsonb(th) order by case th.tier when 'dasar' then 1 when 'premium' then 2 else 3 end, th.sort, th.name_id) from (
        select x.slug, x.tier, x.family, x.name_id, x.name_en, x.desc_id, x.desc_en, x.cover, x.film, x.kit, x.owned, x.hidden,
               x.sort, x.deleted_at from public.themes x) th), '[]'::jsonb),
    'team', case when wide then private.team_list(m) else '[]'::jsonb end);
end $$;

-- ---------------------------------------------------------------- requests
create or replace function public.team_set_stage(t text, p_lead uuid, p_stage text) returns boolean
language plpgsql security definer set search_path = '' as $$
declare m uuid := private.team_id(t); nm text;
begin
  if not private.team_may(m, 'stage') then return null; end if;
  if p_stage is null or p_stage not in ('baru', 'dihubungi', 'konsep', 'produksi', 'tayang') then
    raise exception 'unknown stage' using errcode = '22023';
  end if;
  update public.leads ld
     set stage = p_stage, stage_at = now(),
         contacted_at = case when p_stage <> 'baru' then coalesce(ld.contacted_at, now()) else ld.contacted_at end
   where ld.id = p_lead returning ld.name into nm;
  if nm is null then return false; end if;
  perform private.log_team(m, 'tahap', 'Memindahkan permintaan ' || nm || ' ke ' || private.stage_name(p_stage, false),
                                       'Moved ' || nm || '''s request to ' || private.stage_name(p_stage, true));
  return true;
end $$;

-- ---------------------------------------------------------------- access codes (superadmin and owner)
create or replace function public.team_make_code(t text, p_label text, p_days int, p_lead uuid default null) returns text
language plpgsql security definer set search_path = '' as $$
declare m uuid := private.team_id(t); c text; tries int := 0; lbl text := left(btrim(coalesce(p_label, '')), 40);
begin
  if not private.team_may(m, 'code') then return null; end if;
  if char_length(lbl) < 1 then raise exception 'say who the code is for' using errcode = '22023'; end if;
  if p_days is not null and (p_days < 1 or p_days > 3650) then raise exception 'days out of range' using errcode = '22023'; end if;
  loop
    c := private.new_code(); tries := tries + 1;
    begin
      insert into public.access_codes (code, label, lead_id, created_by, expires_at)
      values (c, lbl, p_lead, m, case when p_days is null then null else now() + make_interval(days => p_days) end);
      perform private.log_team(m, 'kode', 'Membuat kode untuk ' || lbl || case when p_days is null then ', tanpa batas waktu' else ', ' || p_days || ' hari' end,
                                          'Made a code for ' || lbl || case when p_days is null then ', no end date' else ', ' || p_days || ' days' end);
      return c;
    exception when unique_violation then
      if tries > 5 then raise; end if;
    end;
  end loop;
end $$;

create or replace function public.team_code(t text, p_code text, p_act text, p_days int default 30) returns boolean
language plpgsql security definer set search_path = '' as $$
declare m uuid := private.team_id(t); c text := private.norm_code(p_code); lbl text;
begin
  if not private.team_may(m, 'code') then return null; end if;
  select a.label into lbl from public.access_codes a where a.code = c;
  if lbl is null then return false; end if;
  if p_act = 'perpanjang' then
    if p_days is null or p_days < 1 or p_days > 3650 then raise exception 'days out of range' using errcode = '22023'; end if;
    update public.access_codes a
       set expires_at = greatest(coalesce(a.expires_at, now()), now()) + make_interval(days => p_days), ended_at = null
     where a.code = c;
    perform private.log_team(m, 'kode', 'Memperpanjang kode ' || lbl || ' ' || p_days || ' hari', 'Extended ' || lbl || '''s code by ' || p_days || ' days');
  elsif p_act = 'tanpa-batas' then
    update public.access_codes a set expires_at = null, ended_at = null where a.code = c;
    perform private.log_team(m, 'kode', 'Membuat kode ' || lbl || ' tanpa batas waktu', 'Gave ' || lbl || '''s code no end date');
  elsif p_act = 'akhiri' then
    update public.access_codes a set ended_at = now() where a.code = c;
    perform private.log_team(m, 'kode', 'Mengakhiri kode ' || lbl, 'Ended ' || lbl || '''s code');
  elsif p_act = 'pesanan' then
    update public.access_codes a set ordered_at = coalesce(a.ordered_at, now()) where a.code = c;
    perform private.log_team(m, 'kode', 'Menandai kode ' || lbl || ' jadi pesanan', 'Marked ' || lbl || '''s code as an order');
  elsif p_act = 'bukan-pesanan' then
    update public.access_codes a set ordered_at = null where a.code = c;
    perform private.log_team(m, 'kode', 'Melepas tanda pesanan kode ' || lbl, 'Removed the order mark from ' || lbl || '''s code');
  else
    raise exception 'unknown action' using errcode = '22023';
  end if;
  return true;
end $$;

-- ---------------------------------------------------------------- wishes and the old invitation switch
create or replace function public.team_wish(t text, p_id uuid, p_hide boolean) returns boolean
language plpgsql security definer set search_path = '' as $$
declare m uuid := private.team_id(t); g text; inv text;
begin
  if not private.team_may(m, 'wish') then return null; end if;
  update public.wishes w set hidden = coalesce(p_hide, true) where w.id = p_id returning w.guest, w.invitation into g, inv;
  if g is null then return false; end if;
  perform private.log_team(m, 'ucapan', case when coalesce(p_hide, true) then 'Menyembunyikan' else 'Menampilkan' end || ' ucapan dari ' || g || ' (' || inv || ')',
                                        case when coalesce(p_hide, true) then 'Hid' else 'Showed' end || ' a wish from ' || g || ' (' || inv || ')');
  return true;
end $$;

create or replace function public.team_invitation(t text, p_slug text, p_couple text, p_theme text default null, p_active boolean default true) returns boolean
language plpgsql security definer set search_path = '' as $$
declare m uuid := private.team_id(t);
begin
  if not private.team_may(m, 'invitation') then return null; end if;
  insert into public.invitations (slug, couple, theme, active)
  values (p_slug, left(btrim(coalesce(p_couple, '')), 80), p_theme, coalesce(p_active, true))
  on conflict (slug) do update set couple = excluded.couple, theme = excluded.theme, active = excluded.active;
  return true;
end $$;

-- ---------------------------------------------------------------- orders
create or replace function public.team_order_create(t text, p_slug text, p_couple text, p_code text default null, p_theme text default null) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare m uuid := private.team_id(t); c text := nullif(private.norm_code(p_code), ''); lead uuid; th text := p_theme; st jsonb;
begin
  if not private.team_may(m, 'order-create') then return null; end if;
  if not private.slug_free(p_slug) then return jsonb_build_object('error', 'alamat'); end if;
  if char_length(btrim(coalesce(p_couple, ''))) < 1 then return jsonb_build_object('error', 'nama'); end if;
  if c is not null then
    select a.lead_id, a.state into lead, st from public.access_codes a where a.code = c;
    if not found then return jsonb_build_object('error', 'kode'); end if;
    if exists (select 1 from public.invitations v where v.code = c and v.status <> 'arsip') then return jsonb_build_object('error', 'kode-dipakai'); end if;
    th := coalesce(th, nullif(st ->> 'final', ''));
  else
    c := public.team_make_code(t, left(btrim(p_couple), 40), null, null);
  end if;
  update public.access_codes a set expires_at = null, ended_at = null, ordered_at = coalesce(a.ordered_at, now()) where a.code = c;
  if lead is not null then
    update public.leads ld set stage = 'konsep', stage_at = now(), contacted_at = coalesce(ld.contacted_at, now())
     where ld.id = lead and ld.stage in ('baru', 'dihubungi');
  end if;
  insert into public.invitations (slug, couple, theme, active, code, lead_id, status)
  values (p_slug, left(btrim(p_couple), 80), th, false, c, lead, 'isi');
  perform private.log_team(m, 'pesanan', 'Membuat pesanan ' || btrim(p_couple) || ' (nawalainvite.com/' || p_slug || ')',
                                         'Made an order for ' || btrim(p_couple) || ' (nawalainvite.com/' || p_slug || ')');
  return jsonb_build_object('slug', p_slug, 'code', c);
end $$;

-- Only the keys present in p_patch change. An admin's patch loses payment and status (archiving) before it is applied.
create or replace function public.team_order_save(t text, p_slug text, p_patch jsonb) returns boolean
language plpgsql security definer set search_path = '' as $$
declare m uuid := private.team_id(t); p jsonb := coalesce(p_patch, '{}'::jsonb); nm text; parts_id text[] := '{}'; parts_en text[] := '{}'; k text;
begin
  if not private.team_may(m, 'order-edit') then return null; end if;
  if jsonb_typeof(p) <> 'object' or octet_length(p::text) > 70000 then return false; end if;
  if not private.team_may(m, 'order-money') then p := p - array['pay_status', 'pay_amount', 'pay_date', 'status']; end if;
  if p = '{}'::jsonb then return false; end if;
  update public.invitations v set
    couple = case when p ? 'couple' then left(btrim(p ->> 'couple'), 80) else v.couple end,
    theme = case when p ? 'theme' then nullif(p ->> 'theme', '') else v.theme end,
    level = case when p ? 'level' then (p ->> 'level')::smallint else v.level end,
    wording = case when p ? 'wording' then p ->> 'wording' else v.wording end,
    pay_status = case when p ? 'pay_status' then p ->> 'pay_status' else v.pay_status end,
    pay_amount = case when p ? 'pay_amount' then nullif(p ->> 'pay_amount', '')::bigint else v.pay_amount end,
    pay_date = case when p ? 'pay_date' then nullif(p ->> 'pay_date', '')::date else v.pay_date end,
    live_by = case when p ? 'live_by' then nullif(p ->> 'live_by', '')::date else v.live_by end,
    checklist = case when p ? 'checklist' and jsonb_typeof(p -> 'checklist') = 'object' then p -> 'checklist' else v.checklist end,
    notes = case when p ? 'notes' then left(coalesce(p ->> 'notes', ''), 4000) else v.notes end,
    draft = case when p ? 'draft' and jsonb_typeof(p -> 'draft') = 'object' then p -> 'draft' else v.draft end,
    draft_at = case when p ?| array['draft', 'theme', 'level', 'wording'] then now() else v.draft_at end,
    status = case when p ? 'status' and p ->> 'status' in ('isi', 'periksa', 'arsip') and v.status <> 'tayang' then p ->> 'status'
                  when p ? 'status' and p ->> 'status' = 'arsip' then 'arsip' else v.status end,
    active = case when p ? 'status' and p ->> 'status' = 'arsip' then false else v.active end,
    updated_at = now()
  where v.slug = p_slug returning v.couple into nm;
  if nm is null then return false; end if;
  foreach k in array array['draft', 'theme', 'level', 'wording', 'pay_status', 'pay_amount', 'pay_date', 'live_by', 'checklist', 'notes', 'couple', 'status'] loop
    if p ? k then
      parts_id := parts_id || case k when 'draft' then 'data undangan' when 'theme' then 'tema' when 'level' then 'tingkat isi' when 'wording' then 'susunan kata'
        when 'pay_status' then 'status bayar (' || (p ->> k) || ')' when 'pay_amount' then 'jumlah bayar' when 'pay_date' then 'tanggal bayar'
        when 'live_by' then 'target tayang' when 'checklist' then 'daftar periksa' when 'notes' then 'catatan' when 'couple' then 'nama pasangan'
        else case when p ->> k = 'arsip' then 'arsip' else 'status' end end;
      parts_en := parts_en || case k when 'draft' then 'invitation details' when 'theme' then 'theme' when 'level' then 'level' when 'wording' then 'wording'
        when 'pay_status' then 'payment status (' || (p ->> k) || ')' when 'pay_amount' then 'amount paid' when 'pay_date' then 'payment date'
        when 'live_by' then 'go-live date' when 'checklist' then 'checklist' when 'notes' then 'notes' when 'couple' then 'couple''s names'
        else case when p ->> k = 'arsip' then 'archive' else 'status' end end;
    end if;
  end loop;
  -- typing in one field for a while is one line; the key carries which fields, so different edits stay apart
  perform private.log_team(m, 'pesanan:' || p_slug || ':' || array_to_string(parts_en, ','),
    case when p ->> 'status' = 'arsip' then 'Mengarsipkan pesanan ' || nm else 'Mengubah ' || array_to_string(parts_id, ', ') || ' pesanan ' || nm end,
    case when p ->> 'status' = 'arsip' then 'Archived the order for ' || nm else 'Changed the ' || array_to_string(parts_en, ', ') || ' of ' || nm || '''s order' end,
    interval '10 minutes');
  return true;
end $$;

create or replace function public.team_order_publish(t text, p_slug text, p_live jsonb) returns boolean
language plpgsql security definer set search_path = '' as $$
declare m uuid := private.team_id(t); nm text;
begin
  if not private.team_may(m, 'publish') then return null; end if;
  if p_live is null then
    update public.invitations v set status = 'periksa', active = false, updated_at = now() where v.slug = p_slug and v.status = 'tayang' returning v.couple into nm;
    if nm is null then return false; end if;
    perform private.log_team(m, 'terbit', 'Menurunkan undangan ' || nm, 'Took ' || nm || '''s invitation offline');
    return true;
  end if;
  if jsonb_typeof(p_live) <> 'object' or octet_length(p_live::text) > 70000 then return false; end if;
  update public.invitations v set live = p_live, status = 'tayang', active = true, published_at = now(), updated_at = now()
   where v.slug = p_slug and v.status <> 'arsip' returning v.couple into nm;
  if nm is null then return false; end if;
  perform private.log_team(m, 'terbit', 'Menerbitkan undangan ' || nm || ' di nawalainvite.com/' || p_slug, 'Published ' || nm || '''s invitation at nawalainvite.com/' || p_slug);
  return true;
end $$;

create or replace function public.team_order(t text, p_slug text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare m uuid := private.team_id(t);
begin
  if not private.team_may(m, 'order-view') then return null; end if;
  return jsonb_build_object(
    'guests', coalesce((select jsonb_agg(jsonb_build_object('id', g.id, 'name', g.name, 'phone', g.phone, 'sent_at', g.sent_at,
                 'answer', (select r.attending from public.rsvps r where r.invitation = p_slug and lower(r.guest) = lower(g.name) order by r.created_at desc limit 1))
                 order by g.created_at) from public.guests g where g.invitation = p_slug), '[]'::jsonb),
    'rsvps', coalesce((select jsonb_agg(jsonb_build_object('guest', r.guest, 'attending', r.attending, 'headcount', r.headcount, 'at', r.created_at)
                 order by r.created_at desc) from public.rsvps r where r.invitation = p_slug), '[]'::jsonb),
    'wishes', coalesce((select jsonb_agg(jsonb_build_object('id', w.id, 'guest', w.guest, 'body', w.body, 'hidden', w.hidden, 'at', w.created_at)
                 order by w.created_at desc) from public.wishes w where w.invitation = p_slug), '[]'::jsonb));
end $$;

-- ---------------------------------------------------------------- themes (superadmin and owner)
create or replace function public.team_theme_save(t text, p_slug text, p_patch jsonb, p_new boolean default false) returns boolean
language plpgsql security definer set search_path = '' as $$
declare m uuid := private.team_id(t); p jsonb := coalesce(p_patch, '{}'::jsonb); nm text;
begin
  if not private.team_may(m, 'theme') then return null; end if;
  if jsonb_typeof(p) <> 'object' then return false; end if;
  if p ? 'cover' and coalesce(p ->> 'cover', '') <> '' and p ->> 'cover' !~ '^https://erwddnobnagpglkpvdfm\.supabase\.co/storage/v1/object/public/media/theme/' then return false; end if;
  if p ? 'film' and coalesce(p ->> 'film', '') not in ('', 'repo') and p ->> 'film' !~ '^https://erwddnobnagpglkpvdfm\.supabase\.co/storage/v1/object/public/media/theme/' then return false; end if;
  if p_new then
    if exists (select 1 from public.themes x where x.slug = p_slug) then return false; end if;
    insert into public.themes (slug, tier, family, name_id, name_en, desc_id, desc_en, cover, film, sort)
    values (p_slug, p ->> 'tier', nullif(p ->> 'family', ''), btrim(p ->> 'name_id'), btrim(coalesce(nullif(p ->> 'name_en', ''), p ->> 'name_id')),
            coalesce(p ->> 'desc_id', ''), coalesce(nullif(p ->> 'desc_en', ''), p ->> 'desc_id', ''),
            nullif(p ->> 'cover', ''), nullif(p ->> 'film', ''), coalesce((p ->> 'sort')::int, 1000));
    perform private.log_team(m, 'tema', 'Menambah tema ' || btrim(p ->> 'name_id'), 'Added the theme ' || btrim(p ->> 'name_id'));
    return true;
  end if;
  update public.themes x set
    tier = coalesce(p ->> 'tier', x.tier),
    family = case when p ? 'family' then nullif(p ->> 'family', '') else x.family end,
    name_id = coalesce(nullif(btrim(p ->> 'name_id'), ''), x.name_id),
    name_en = coalesce(nullif(btrim(p ->> 'name_en'), ''), x.name_en),
    desc_id = case when p ? 'desc_id' then coalesce(p ->> 'desc_id', '') else x.desc_id end,
    desc_en = case when p ? 'desc_en' then coalesce(p ->> 'desc_en', '') else x.desc_en end,
    cover = case when p ? 'cover' then nullif(p ->> 'cover', '') else x.cover end,
    film = case when p ? 'film' then nullif(p ->> 'film', '') else x.film end,
    owned = coalesce((p ->> 'owned')::boolean, x.owned),
    hidden = coalesce((p ->> 'hidden')::boolean, x.hidden),
    sort = coalesce((p ->> 'sort')::int, x.sort),
    updated_at = now()
  where x.slug = p_slug returning x.name_id into nm;
  if nm is null then return false; end if;
  if p ? 'hidden' and (select count(*) from jsonb_object_keys(p)) = 1 then
    perform private.log_team(m, 'tema', case when (p ->> 'hidden')::boolean then 'Menyembunyikan tema ' else 'Menampilkan lagi tema ' end || nm,
                                        case when (p ->> 'hidden')::boolean then 'Hid the theme ' else 'Showed the theme ' end || nm || case when (p ->> 'hidden')::boolean then '' else ' again' end);
  elsif p ? 'owned' and (select count(*) from jsonb_object_keys(p)) = 1 then
    perform private.log_team(m, 'tema', case when (p ->> 'owned')::boolean then 'Menandai tema ' || nm || ' sudah dimiliki' else 'Melepas tanda dimiliki tema ' || nm end,
                                        case when (p ->> 'owned')::boolean then 'Marked the theme ' || nm || ' as owned' else 'Removed the owned mark from ' || nm end);
  else
    perform private.log_team(m, 'tema', 'Mengubah tema ' || nm || case when p ? 'cover' then ' (sampul baru)' else '' end,
                                        'Edited the theme ' || nm || case when p ? 'cover' then ' (new cover)' else '' end);
  end if;
  return true;
end $$;

create or replace function public.team_theme_delete(t text, p_slug text, p_restore boolean default false) returns boolean
language plpgsql security definer set search_path = '' as $$
declare m uuid := private.team_id(t); nm text;
begin
  if not private.team_may(m, 'theme') then return null; end if;
  update public.themes x set deleted_at = case when p_restore then null else now() end, updated_at = now() where x.slug = p_slug returning x.name_id into nm;
  if nm is null then return false; end if;
  perform private.log_team(m, 'tema', case when p_restore then 'Memulihkan tema ' else 'Menghapus tema ' end || nm, case when p_restore then 'Brought back the theme ' else 'Deleted the theme ' end || nm);
  return true;
end $$;

-- ---------------------------------------------------------------- uploads: theme pictures need a superadmin
create or replace function public.media_ticket(p_who text, p_kind text, p_target text) returns text
language plpgsql security definer set search_path = '' as $$
declare
  team uuid; ok boolean := false; nonce text; pre text;
  abc constant text := 'abcdefghijkmnpqrstuvwxyz23456789';
  raw bytea := decode(replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', ''), 'hex');
  i int;
begin
  if p_kind not in ('theme', 'inv') or coalesce(p_target, '') !~ '^[a-z0-9-]{2,60}$' then return null; end if;
  if upper(coalesce(p_who, '')) like 'NAWALA-TIM-%' or char_length(coalesce(p_who, '')) > 24 then
    team := private.team_id(p_who);
    if not private.team_may(team, case when p_kind = 'theme' then 'theme' else 'order-edit' end) then return null; end if;
    ok := true;
  elsif p_kind = 'inv' then
    ok := exists (select 1 from public.invitations v join public.access_codes a on a.code = v.code
                  where v.slug = p_target and v.status <> 'arsip' and a.code = private.norm_code(p_who)
                    and a.ended_at is null and (a.expires_at is null or a.expires_at > now()));
  end if;
  if not ok then return null; end if;
  if (select count(*) from private.upload_tickets k where k.target = p_target and k.expires_at > now() - interval '45 minutes') >= 120 then
    return null;
  end if;
  nonce := '';
  for i in 0..15 loop nonce := nonce || substr(abc, 1 + (get_byte(raw, i) % 32), 1); end loop;
  pre := p_kind || '/' || p_target || '/' || nonce;
  delete from private.upload_tickets k where k.expires_at < now() - interval '1 day';
  insert into private.upload_tickets (prefix, target) values (pre, p_target);
  return pre;
end $$;

-- ---------------------------------------------------------------- the couple's room, now leaving a trace
create or replace function public.room_open(p_code text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare c text := private.norm_code(p_code); r record;
begin
  update public.access_codes a set last_used_at = now()
   where a.code = c and a.ended_at is null and (a.expires_at is null or a.expires_at > now())
   returning a.code, a.label, a.created_at, a.expires_at, a.state into r;
  if not found then return null; end if;
  perform private.log_couple(r.code, 'masuk', 'Masuk ke ruang pasangan', 'Opened the couple''s room', interval '30 minutes', true);
  return jsonb_build_object('code', r.code, 'label', r.label, 'created_at', r.created_at,
    'expires_at', r.expires_at, 'now', now(), 'state', r.state, 'order', private.room_invitation(r.code));
end $$;

create or replace function public.room_save(p_code text, p_state jsonb) returns boolean
language plpgsql security definer set search_path = '' as $$
declare c text := private.norm_code(p_code); s jsonb; n int;
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
  if not found then return false; end if;
  n := jsonb_array_length(s -> 'saved');
  perform private.log_couple(c, 'pilihan', 'Memperbarui pilihan tema (' || n || ' disimpan' || case when s ->> 'final' <> '' then ', pilihan akhir ' || (s ->> 'final') else '' end || ')',
                                           'Updated their theme choices (' || n || ' saved' || case when s ->> 'final' <> '' then ', final choice ' || (s ->> 'final') else '' end || ')',
                                           interval '10 minutes');
  return true;
end $$;

create or replace function public.room_order_save(p_code text, p_draft jsonb) returns boolean
language plpgsql security definer set search_path = '' as $$
declare s text := private.room_slug(p_code);
begin
  if s is null or p_draft is null or jsonb_typeof(p_draft) <> 'object' or octet_length(p_draft::text) > 60000 then return false; end if;
  update public.invitations v set draft = p_draft, draft_at = now(), updated_at = now() where v.slug = s;
  perform private.log_couple(private.norm_code(p_code), 'data', 'Mengisi data undangan', 'Filled in their invitation details', interval '10 minutes');
  return true;
end $$;

create or replace function public.room_order_submit(p_code text) returns boolean
language plpgsql security definer set search_path = '' as $$
declare s text := private.room_slug(p_code);
begin
  if s is null then return false; end if;
  update public.invitations v set submitted_at = now(), updated_at = now(),
         status = case when v.status = 'isi' then 'periksa' else v.status end
   where v.slug = s;
  perform private.log_couple(private.norm_code(p_code), 'kirim', 'Mengirim undangan untuk diperiksa', 'Sent their invitation for a check');
  return true;
end $$;

create or replace function public.room_guests_save(p_code text, p_guests jsonb) returns boolean
language plpgsql security definer set search_path = '' as $$
declare s text := private.room_slug(p_code); cnt int;
begin
  if s is null or p_guests is null or jsonb_typeof(p_guests) <> 'array' or jsonb_array_length(p_guests) > 1500 then return false; end if;
  create temporary table if not exists pg_temp.new_guests (name text, phone text, sent boolean) on commit drop;
  delete from pg_temp.new_guests;
  insert into pg_temp.new_guests (name, phone, sent)
  select distinct on (lower(n)) n, p, sent from (
    select left(btrim(regexp_replace(coalesce(e ->> 'name', ''), '\s+', ' ', 'g')), 80) as n,
           nullif(regexp_replace(coalesce(e ->> 'phone', ''), '[^0-9]', '', 'g'), '') as p,
           coalesce((e ->> 'sent')::boolean, false) as sent
    from jsonb_array_elements(p_guests) e) x
  where char_length(n) > 0 order by lower(n);
  update pg_temp.new_guests set phone = null where phone !~ '^[0-9]{8,15}$';
  delete from public.guests g where g.invitation = s and lower(g.name) not in (select lower(ng.name) from pg_temp.new_guests ng);
  update public.guests g set phone = ng.phone, sent_at = case when ng.sent then coalesce(g.sent_at, now()) else null end
    from pg_temp.new_guests ng where g.invitation = s and lower(g.name) = lower(ng.name);
  insert into public.guests (invitation, name, phone, sent_at)
  select s, ng.name, ng.phone, case when ng.sent then now() end from pg_temp.new_guests ng
  where not exists (select 1 from public.guests g where g.invitation = s and lower(g.name) = lower(ng.name));
  select count(*) into cnt from public.guests g where g.invitation = s;
  perform private.log_couple(private.norm_code(p_code), 'tamu', 'Memperbarui daftar tamu (' || cnt || ' tamu)', 'Updated their guest list (' || cnt || ' guests)', interval '10 minutes');
  return true;
end $$;

-- ---------------------------------------------------------------- who may call the new functions
revoke all on function public.team_hello(text, boolean), public.team_member_add(text, text, text),
  public.team_member_act(text, uuid, text, text), public.team_activity(text, timestamptz, text)
  from public, anon, authenticated;
grant execute on function public.team_hello(text, boolean), public.team_member_add(text, text, text),
  public.team_member_act(text, uuid, text, text), public.team_activity(text, timestamptz, text)
  to anon, authenticated;

commit;

-- After running this file, give Alvin his rank (or do it in the console under Kode, Tim):
--   update public.team_members set role = 'superadmin' where lower(name) = 'alvin';
