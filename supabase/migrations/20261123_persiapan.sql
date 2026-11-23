-- Persiapan, the project dashboard for each wedding (23 Nov 2026). Owner's decisions:
--   * Two layers on every order: the invitation work is always there; full wedding planning (venue, catering, MUA,
--     decor and the rest) is an add-on the team turns on (pm_full). Each layer starts from a ready template.
--   * Tools: WBS (tasks as a tree), kanban (Belum, Dikerjakan, Ditinjau, Selesai), gantt, RAB (planned vs actual,
--     payment stages, receipt uploads, who pays), vendors (a shared team directory plus each wedding's own list),
--     reminders (in the console, plus a calendar file made in the page), rundown, files and moodboard, meeting notes,
--     approvals, and two chat rooms per wedding: team and couple together, and a team-only room.
--   * Every couple with an order gets it, whatever the tier. The couple may edit everything they can see; every change
--     goes to Aktivitas; some things stay with the team: rows marked team_only, and the "tim" part of any row's data
--     (internal cost, Nawala's margin, vendor commission, private notes) is never sent to the couple and never taken from them.
--   * Every rank in the team sees every wedding. Admins edit plans ('order-edit'); turning the full layer on or off and
--     changing the end date need rank 2 ('order-money').
--   * The couple's access lasts until 30 days after the wedding date (pm_until overrides it), whatever the code's own
--     end date; a code the team ended closes it at once.
--   * Files go to the public bucket "pm" under a one-off folder of 16 random characters (32^16 names). Its addresses are
--     only handed out by these functions, and the bucket cannot be listed. Nothing outside these functions reads a table.
-- Run after 20261122_seating.sql.

begin;

alter table public.invitations
  add column if not exists pm_full boolean not null default false,
  add column if not exists pm_until date,
  add column if not exists pm_seeded text[] not null default '{}';

-- ---------------------------------------------------------------- tables
-- One table for every kind of plan item; data holds the fields of that kind (see assets/js/persiapan.js, KINDS).
create table if not exists public.pm_items (
  id uuid primary key default gen_random_uuid(),
  invitation text not null references public.invitations (slug) on delete cascade on update cascade,
  kind text not null check (kind in ('tugas', 'rab', 'bayar', 'vendor', 'acara', 'rapat', 'setuju', 'berkas', 'ingat')),
  parent uuid references public.pm_items (id) on delete cascade,
  sort int not null default 0,
  team_only boolean not null default false,
  data jsonb not null default '{}'::jsonb check (jsonb_typeof(data) = 'object' and octet_length(data::text) <= 20000),
  created_kind text not null default 'nawala' check (created_kind in ('tim', 'pasangan', 'nawala')),
  created_by text,
  created_at timestamptz not null default now(),
  updated_by text,
  updated_at timestamptz not null default now()
);
create index if not exists pm_items_inv on public.pm_items (invitation, kind, sort);
create index if not exists pm_items_parent on public.pm_items (parent);
alter table public.pm_items enable row level security;
revoke all on public.pm_items from public, anon, authenticated;

create table if not exists public.pm_messages (
  id bigint generated always as identity primary key,
  invitation text not null references public.invitations (slug) on delete cascade on update cascade,
  room text not null check (room in ('bersama', 'tim')),
  kind text not null check (kind in ('tim', 'pasangan')),
  ref text not null,
  who text not null,
  body text not null default '' check (char_length(body) <= 4000),
  file jsonb check (file is null or (jsonb_typeof(file) = 'object' and octet_length(file::text) <= 600)),
  at timestamptz not null default now()
);
create index if not exists pm_messages_room on public.pm_messages (invitation, room, id);
alter table public.pm_messages enable row level security;
revoke all on public.pm_messages from public, anon, authenticated;

create table if not exists public.pm_reads (
  invitation text not null references public.invitations (slug) on delete cascade on update cascade,
  room text not null,
  ref text not null,
  last_id bigint not null default 0,
  primary key (invitation, room, ref)
);
alter table public.pm_reads enable row level security;
revoke all on public.pm_reads from public, anon, authenticated;

-- the team's vendor directory, shared by every wedding
create table if not exists public.vendor_dir (
  id uuid primary key default gen_random_uuid(),
  data jsonb not null default '{}'::jsonb check (jsonb_typeof(data) = 'object' and octet_length(data::text) <= 8000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
alter table public.vendor_dir enable row level security;
revoke all on public.vendor_dir from public, anon, authenticated;

-- ---------------------------------------------------------------- who is asking
create or replace function private.pm_date(p_draft jsonb) returns date
language sql immutable set search_path = '' as $$
  select case when coalesce(p_draft ->> 'date', '') ~ '^\d{4}-\d{2}-\d{2}$' then (p_draft ->> 'date')::date end;
$$;

-- kind 'tim': a team token that may see orders (every rank); edit and money say what it may change.
-- kind 'pasangan': the couple's code for their own order, until 30 days after the wedding (or pm_until).
create or replace function private.pm_who(p_who text, p_slug text,
  out slug text, out name text, out kind text, out ref text, out edit boolean, out money boolean)
language plpgsql security definer set search_path = '' as $$
declare m uuid; v record;
begin
  if upper(coalesce(p_who, '')) like 'NAWALA-TIM-%' then
    m := private.team_id(p_who);
    if not private.team_may(m, 'order-view') then return; end if;
    select x.slug into slug from public.invitations x where x.slug = p_slug;
    if slug is null then return; end if;
    name := private.team_name(m); kind := 'tim'; ref := m::text;
    edit := private.team_may(m, 'order-edit'); money := private.team_may(m, 'order-money');
  else
    select x.slug, x.pm_until, x.draft, a.code, a.label into v
      from public.invitations x join public.access_codes a on a.code = x.code
     where a.code = private.norm_code(p_who) and x.status <> 'arsip' and a.ended_at is null limit 1;
    if v.slug is null or (coalesce(p_slug, '') <> '' and p_slug <> v.slug) then return; end if;
    if coalesce(v.pm_until, private.pm_date(v.draft) + 30) < current_date then return; end if;
    slug := v.slug; name := coalesce(v.label, 'Pasangan'); kind := 'pasangan'; ref := v.code; edit := true; money := false;
  end if;
end $$;

create or replace function private.pm_log(p_kind text, p_ref text, p_slug text, p_key text, p_id text, p_en text) returns void
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

-- ---------------------------------------------------------------- templates
-- WBS rows: code, parent code, title (id, en), days before the wedding the task is due (negative), length in days,
-- who does it ('pasangan', 'tim' or null). Budget rows hang under a WBS branch.
create or replace function private.pm_seed(p_slug text, p_layer text) returns void
language plpgsql security definer set search_path = '' as $$
declare
  d date; r record; ids jsonb := '{}'::jsonb; nid uuid; due date; n int := 0;
begin
  if exists (select 1 from public.invitations v where v.slug = p_slug and p_layer = any (v.pm_seeded)) then return; end if;
  select private.pm_date(v.draft) into d from public.invitations v where v.slug = p_slug;
  for r in
    select * from (values
      -- the invitation layer (always)
      ('undangan', '1',   null,  'Undangan digital Nawala', 'Nawala digital invitation', null::int, null::int, null::text),
      ('undangan', '1.1', '1',   'Pilih tema undangan', 'Choose the invitation theme', -120, 7, 'pasangan'),
      ('undangan', '1.2', '1',   'Isi data mempelai dan acara', 'Fill in the couple and event details', -100, 10, 'pasangan'),
      ('undangan', '1.3', '1',   'Unggah foto pasangan dan galeri', 'Upload the couple and gallery photos', -95, 10, 'pasangan'),
      ('undangan', '1.4', '1',   'Sunting desain undangan', 'Edit the invitation design', -85, 10, 'pasangan'),
      ('undangan', '1.5', '1',   'Pemeriksaan oleh tim Nawala', 'Check by the Nawala team', -75, 5, 'tim'),
      ('undangan', '1.6', '1',   'Terbitkan undangan', 'Publish the invitation', -70, 1, 'tim'),
      ('undangan', '1.7', '1',   'Susun daftar tamu dan kirim undangan', 'Build the guest list and send the invitation', -45, 21, 'pasangan'),
      ('undangan', '2',   null,  'Layanan hari H', 'Wedding-day services', null, null, null),
      ('undangan', '2.1', '2',   'Susun denah dan kursi', 'Lay out the floor plan and seats', -21, 10, 'pasangan'),
      ('undangan', '2.2', '2',   'Siapkan QR buku tamu', 'Prepare the guestbook QR', -10, 5, 'tim'),
      ('undangan', '2.3', '2',   'Atur suvenir per tamu', 'Set the souvenir per guest', -10, 5, 'tim'),
      ('undangan', '2.4', '2',   'Rekap RSVP final', 'Final RSVP count', -5, 3, 'tim'),
      -- full wedding planning (add-on)
      ('penuh', '3',   null, 'Perencanaan awal', 'Early planning', null, null, null),
      ('penuh', '3.1', '3',  'Tetapkan total anggaran', 'Set the total budget', -330, 14, 'pasangan'),
      ('penuh', '3.2', '3',  'Tetapkan tanggal dan konsep acara', 'Fix the date and the concept', -320, 14, 'pasangan'),
      ('penuh', '3.3', '3',  'Daftar tamu awal', 'First guest list', -300, 21, 'pasangan'),
      ('penuh', '4',   null, 'Tempat dan katering', 'Venue and catering', null, null, null),
      ('penuh', '4.1', '4',  'Survei tempat acara', 'Visit venues', -290, 21, 'tim'),
      ('penuh', '4.2', '4',  'Pesan tempat dan bayar DP', 'Book the venue and pay the deposit', -270, 7, 'pasangan'),
      ('penuh', '4.3', '4',  'Tes rasa katering', 'Catering tasting', -240, 14, 'pasangan'),
      ('penuh', '4.4', '4',  'Pesan katering', 'Book the caterer', -225, 7, 'pasangan'),
      ('penuh', '5',   null, 'Busana dan rias', 'Attire and make-up', null, null, null),
      ('penuh', '5.1', '5',  'Pilih MUA', 'Choose the make-up artist', -210, 14, 'pasangan'),
      ('penuh', '5.2', '5',  'Busana akad', 'Ceremony attire', -180, 30, 'pasangan'),
      ('penuh', '5.3', '5',  'Busana resepsi', 'Reception attire', -180, 30, 'pasangan'),
      ('penuh', '5.4', '5',  'Fitting busana', 'Attire fitting', -40, 7, 'pasangan'),
      ('penuh', '6',   null, 'Dekorasi dan hiburan', 'Decor and entertainment', null, null, null),
      ('penuh', '6.1', '6',  'Pilih dekorasi', 'Choose the decor', -200, 21, 'tim'),
      ('penuh', '6.2', '6',  'Musik dan hiburan', 'Music and entertainment', -150, 21, 'tim'),
      ('penuh', '6.3', '6',  'Pilih MC', 'Choose the MC', -120, 14, 'tim'),
      ('penuh', '7',   null, 'Dokumentasi', 'Photo and video', null, null, null),
      ('penuh', '7.1', '7',  'Pesan foto dan video', 'Book photo and video', -200, 14, 'pasangan'),
      ('penuh', '7.2', '7',  'Sesi prewedding', 'Pre-wedding session', -120, 14, 'pasangan'),
      ('penuh', '8',   null, 'Administrasi dan seserahan', 'Paperwork and gifts', null, null, null),
      ('penuh', '8.1', '8',  'Urus dokumen pernikahan (KUA / catatan sipil)', 'Marriage paperwork (KUA / civil registry)', -90, 30, 'pasangan'),
      ('penuh', '8.2', '8',  'Cincin pernikahan', 'Wedding rings', -90, 21, 'pasangan'),
      ('penuh', '8.3', '8',  'Siapkan seserahan', 'Prepare the seserahan gifts', -45, 21, 'pasangan'),
      ('penuh', '9',   null, 'Minggu terakhir', 'The final weeks', null, null, null),
      ('penuh', '9.1', '9',  'Technical meeting dengan vendor', 'Technical meeting with vendors', -14, 1, 'tim'),
      ('penuh', '9.2', '9',  'Rundown final', 'Final rundown', -10, 3, 'tim'),
      ('penuh', '9.3', '9',  'Pelunasan semua vendor', 'Settle every vendor', -7, 5, 'pasangan'),
      ('penuh', '9.4', '9',  'Gladi resik', 'Rehearsal', -1, 1, 'tim')
    ) as t(layer, code, up, title, title_en, off, dur, who)
    where t.layer = p_layer
  loop
    n := n + 1; nid := gen_random_uuid();
    ids := ids || jsonb_build_object(r.code, nid);
    due := case when d is not null and r.off is not null then d + r.off end;
    insert into public.pm_items (id, invitation, kind, parent, sort, data, created_kind)
    values (nid, p_slug, 'tugas', case when r.up is not null then (ids ->> r.up)::uuid end, case when p_layer = 'penuh' then 1000 else 0 end + n * 10,
      jsonb_strip_nulls(jsonb_build_object('title', r.title, 'title_en', r.title_en, 'status', 'belum', 'who', r.who,
        'off', r.off, 'dur', r.dur, 'tpl', p_layer,
        'start', case when due is not null then to_char(due - coalesce(r.dur, 1) + 1, 'YYYY-MM-DD') end,
        'due', case when due is not null then to_char(due, 'YYYY-MM-DD') end)), 'nawala');
  end loop;

  n := 0;
  for r in
    select * from (values
      ('undangan', '1', 'Undangan', 'Undangan digital Nawala', 'Nawala digital invitation'),
      ('penuh', '4', 'Tempat', 'Sewa tempat acara', 'Venue hire'),
      ('penuh', '4', 'Katering', 'Katering', 'Catering'),
      ('penuh', '5', 'Busana dan rias', 'MUA', 'Make-up artist'),
      ('penuh', '5', 'Busana dan rias', 'Busana', 'Attire'),
      ('penuh', '6', 'Dekorasi dan hiburan', 'Dekorasi', 'Decor'),
      ('penuh', '6', 'Dekorasi dan hiburan', 'Musik dan MC', 'Music and MC'),
      ('penuh', '7', 'Dokumentasi', 'Foto dan video', 'Photo and video'),
      ('penuh', '8', 'Administrasi dan seserahan', 'Cincin', 'Rings'),
      ('penuh', '8', 'Administrasi dan seserahan', 'Seserahan', 'Seserahan gifts'),
      ('penuh', '8', 'Administrasi dan seserahan', 'Dokumen pernikahan', 'Marriage paperwork'),
      ('penuh', '9', 'Lain-lain', 'Cadangan tak terduga', 'Contingency')
    ) as t(layer, wbs, cat, item, item_en)
    where t.layer = p_layer
  loop
    n := n + 1;
    insert into public.pm_items (invitation, kind, sort, data, created_kind)
    values (p_slug, 'rab', case when p_layer = 'penuh' then 1000 else 0 end + n * 10, jsonb_strip_nulls(jsonb_build_object('cat', r.cat, 'item', r.item, 'item_en', r.item_en,
      'plan', 0, 'payer', 'bersama', 'wbs', ids ->> r.wbs, 'tpl', p_layer)), 'nawala');
  end loop;

  update public.invitations v set pm_seeded = array_append(v.pm_seeded, p_layer) where v.slug = p_slug;
end $$;

-- ---------------------------------------------------------------- reading one wedding
create or replace function private.pm_rows(p_slug text, p_team boolean) returns jsonb
language sql stable security definer set search_path = '' as $$
  select coalesce(jsonb_agg(jsonb_build_object('id', i.id, 'kind', i.kind, 'parent', i.parent, 'sort', i.sort,
           'team_only', i.team_only, 'data', case when p_team then i.data else i.data - 'tim' end,
           'by', i.updated_by, 'at', i.updated_at, 'made', i.created_kind) order by i.kind, i.sort, i.created_at), '[]'::jsonb)
  from public.pm_items i where i.invitation = p_slug and (p_team or not i.team_only);
$$;

create or replace function private.pm_unread(p_slug text, p_ref text, p_team boolean) returns jsonb
language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'bersama', (select count(*) from public.pm_messages g where g.invitation = p_slug and g.room = 'bersama' and g.ref <> p_ref
                  and g.id > coalesce((select r.last_id from public.pm_reads r where r.invitation = p_slug and r.room = 'bersama' and r.ref = p_ref), 0)),
    'tim', case when p_team then (select count(*) from public.pm_messages g where g.invitation = p_slug and g.room = 'tim' and g.ref <> p_ref
                  and g.id > coalesce((select r.last_id from public.pm_reads r where r.invitation = p_slug and r.room = 'tim' and r.ref = p_ref), 0)) else 0 end);
$$;

create or replace function private.pm_dir(p_team boolean) returns jsonb
language sql stable security definer set search_path = '' as $$
  select coalesce(jsonb_agg(jsonb_build_object('id', d.id, 'data', case when p_team then d.data else d.data - 'tim' end)
           order by lower(coalesce(d.data ->> 'name', ''))), '[]'::jsonb)
  from public.vendor_dir d where d.deleted_at is null;
$$;

create or replace function public.pm_open(p_who text, p_slug text default null) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare w record; v record; team boolean;
begin
  select * into w from private.pm_who(p_who, p_slug);
  if w.slug is null then return null; end if;
  team := w.kind = 'tim';
  perform private.pm_seed(w.slug, 'undangan');
  select x.slug, x.couple, x.status, x.theme, x.pm_full, x.pm_until, private.pm_date(x.draft) as wed, x.draft -> 'events' as events into v
    from public.invitations x where x.slug = w.slug;
  if v.pm_full then perform private.pm_seed(w.slug, 'penuh'); end if;
  return jsonb_build_object('slug', v.slug, 'couple', v.couple, 'status', v.status, 'theme', v.theme,
    'date', v.wed, 'full', v.pm_full, 'until', coalesce(v.pm_until, v.wed + 30), 'until_set', v.pm_until is not null,
    'events', case when jsonb_typeof(v.events) = 'array' then v.events else '[]'::jsonb end,
    'as', w.kind, 'me', w.name, 'ref', case when team then w.ref end, 'edit', w.edit, 'money', w.money, 'now', now(),
    'items', private.pm_rows(v.slug, team), 'dir', private.pm_dir(team), 'unread', private.pm_unread(v.slug, w.ref, team),
    'members', coalesce((select jsonb_agg(jsonb_build_object('id', tm.id, 'name', tm.name) order by tm.name)
                         from public.team_members tm where tm.ended_at is null), '[]'::jsonb));
end $$;

-- ---------------------------------------------------------------- writing
-- p_ops: up to 200 of {id, kind, parent, sort, team_only, data} (insert or update) or {id, del: true}.
-- The page makes the ids, so it can draw a new row before the answer comes back.
create or replace function public.pm_save(p_who text, p_slug text, p_ops jsonb) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  w record; o jsonb; rid uuid; prev record; par uuid; dat jsonb; team boolean; n int := 0; kinds text[] := '{}';
begin
  select * into w from private.pm_who(p_who, p_slug);
  if w.slug is null or not w.edit then return null; end if;
  if jsonb_typeof(p_ops) <> 'array' or jsonb_array_length(p_ops) > 200 then return jsonb_build_object('ok', false, 'error', 'bentuk'); end if;
  team := w.kind = 'tim';
  for o in select * from jsonb_array_elements(p_ops) loop
    if coalesce(o ->> 'id', '') !~ '^[0-9a-f-]{36}$' then continue; end if;
    rid := (o ->> 'id')::uuid;
    select i.kind, i.team_only, i.data, i.invitation into prev from public.pm_items i where i.id = rid;
    if prev.invitation is not null and prev.invitation <> w.slug then continue; end if;
    if prev.invitation is not null and prev.team_only and not team then continue; end if;
    if (o ->> 'del')::boolean is true then
      if prev.invitation is not null then
        delete from public.pm_items i where i.id = rid;
        n := n + 1; kinds := kinds || prev.kind;
      end if;
      continue;
    end if;
    dat := o -> 'data';
    if dat is null or jsonb_typeof(dat) <> 'object' or octet_length(dat::text) > 20000 then continue; end if;
    if not team then dat := (dat - 'tim') || coalesce(jsonb_build_object('tim', prev.data -> 'tim'), '{}'::jsonb); end if;
    dat := jsonb_strip_nulls(dat);
    -- files and receipts must sit in this wedding's own folder of the pm bucket
    if dat ? 'path' and coalesce(dat ->> 'path', '') !~ ('^pm/' || w.slug || '/[a-z0-9]{16}\.[a-z0-9]{2,5}$') then dat := dat - 'path'; end if;
    if jsonb_typeof(dat -> 'files') = 'array' then
      dat := jsonb_set(dat, '{files}', coalesce((select jsonb_agg(f) from jsonb_array_elements(dat -> 'files') f
        where coalesce(f ->> 'path', '') ~ ('^pm/' || w.slug || '/[a-z0-9]{16}\.[a-z0-9]{2,5}$')), '[]'::jsonb));
    end if;
    par := null;
    if coalesce(o ->> 'parent', '') ~ '^[0-9a-f-]{36}$' and (o ->> 'parent')::uuid <> rid then
      select i.id into par from public.pm_items i where i.id = (o ->> 'parent')::uuid and i.invitation = w.slug and (team or not i.team_only);
    end if;
    if prev.invitation is null then
      if coalesce(o ->> 'kind', '') not in ('tugas', 'rab', 'bayar', 'vendor', 'acara', 'rapat', 'setuju', 'berkas', 'ingat') then continue; end if;
      insert into public.pm_items (id, invitation, kind, parent, sort, team_only, data, created_kind, created_by, updated_by)
      values (rid, w.slug, o ->> 'kind', par, coalesce((o ->> 'sort')::int, 0), team and coalesce((o ->> 'team_only')::boolean, false),
              dat, w.kind, w.name, w.name);
      kinds := kinds || (o ->> 'kind');
    else
      update public.pm_items i set data = dat, parent = case when o ? 'parent' then par else i.parent end,
        sort = coalesce((o ->> 'sort')::int, i.sort),
        team_only = case when team and o ? 'team_only' then coalesce((o ->> 'team_only')::boolean, false) else i.team_only end,
        updated_by = w.name, updated_at = now()
       where i.id = rid;
      kinds := kinds || prev.kind;
    end if;
    n := n + 1;
  end loop;
  if n > 0 then
    perform private.pm_log(w.kind, w.ref, w.slug, 'persiapan', 'Mengubah persiapan', 'Changed the plan of');
  end if;
  return jsonb_build_object('ok', true, 'n', n, 'at', now());
end $$;

-- the team turns the full-wedding layer on or off and sets the couple's end date (rank 2)
create or replace function public.pm_set(p_who text, p_slug text, p_patch jsonb) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare w record; p jsonb := coalesce(p_patch, '{}'::jsonb);
begin
  select * into w from private.pm_who(p_who, p_slug);
  if w.slug is null or w.kind <> 'tim' or not w.money then return null; end if;
  update public.invitations v set
    pm_full = case when p ? 'full' then coalesce((p ->> 'full')::boolean, false) else v.pm_full end,
    pm_until = case when p ? 'until' then case when coalesce(p ->> 'until', '') ~ '^\d{4}-\d{2}-\d{2}$' then (p ->> 'until')::date end else v.pm_until end
   where v.slug = w.slug;
  if (p ->> 'full')::boolean is true then perform private.pm_seed(w.slug, 'penuh'); end if;
  perform private.pm_log('tim', w.ref, w.slug, 'persiapan-paket',
    case when p ? 'full' then case when (p ->> 'full')::boolean then 'Menyalakan perencanaan pernikahan penuh untuk' else 'Mematikan perencanaan pernikahan penuh untuk' end else 'Mengubah batas akses persiapan' end,
    case when p ? 'full' then case when (p ->> 'full')::boolean then 'Turned on full wedding planning for' else 'Turned off full wedding planning for' end else 'Changed the plan access end for' end);
  return public.pm_open(p_who, w.slug);
end $$;

-- the shared vendor directory: everyone reads (couples without the "tim" part), the team writes
create or replace function public.pm_dir_save(p_who text, p_id uuid, p_data jsonb, p_del boolean default false) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare m uuid := private.team_id(p_who); nid uuid;
begin
  if not private.team_may(m, 'order-edit') then return null; end if;
  if p_del then
    update public.vendor_dir d set deleted_at = now() where d.id = p_id;
    return private.pm_dir(true);
  end if;
  if p_data is null or jsonb_typeof(p_data) <> 'object' or octet_length(p_data::text) > 8000 or char_length(coalesce(p_data ->> 'name', '')) not between 1 and 80 then
    return null;
  end if;
  update public.vendor_dir d set data = jsonb_strip_nulls(p_data), updated_at = now() where d.id = p_id returning d.id into nid;
  if nid is null then insert into public.vendor_dir (id, data) values (coalesce(p_id, gen_random_uuid()), jsonb_strip_nulls(p_data)); end if;
  perform private.log_team(m, 'vendor-dir', 'Mengubah direktori vendor', 'Changed the vendor directory', interval '10 minutes');
  return private.pm_dir(true);
end $$;

-- ---------------------------------------------------------------- chat
create or replace function private.pm_msgs(p_slug text, p_room text, p_after bigint) returns jsonb
language sql stable security definer set search_path = '' as $$
  select coalesce(jsonb_agg(jsonb_build_object('id', x.id, 'kind', x.kind, 'ref', x.ref, 'who', x.who, 'body', x.body, 'file', x.file, 'at', x.at) order by x.id), '[]'::jsonb)
  from (select g.* from public.pm_messages g where g.invitation = p_slug and g.room = p_room and g.id > coalesce(p_after, 0)
        order by g.id desc limit 200) x;
$$;

create or replace function public.pm_chat(p_who text, p_slug text, p_room text, p_after bigint default 0) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare w record; last bigint; msgs jsonb;
begin
  select * into w from private.pm_who(p_who, p_slug);
  if w.slug is null or p_room not in ('bersama', 'tim') or (p_room = 'tim' and w.kind <> 'tim') then return null; end if;
  msgs := private.pm_msgs(w.slug, p_room, p_after);
  select max(g.id) into last from public.pm_messages g where g.invitation = w.slug and g.room = p_room;
  if last is not null then
    insert into public.pm_reads (invitation, room, ref, last_id) values (w.slug, p_room, w.ref, last)
    on conflict (invitation, room, ref) do update set last_id = greatest(public.pm_reads.last_id, excluded.last_id);
  end if;
  return jsonb_build_object('msgs', msgs, 'me', w.ref, 'unread', private.pm_unread(w.slug, w.ref, w.kind = 'tim'));
end $$;

create or replace function public.pm_say(p_who text, p_slug text, p_room text, p_body text, p_file jsonb default null) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare w record; f jsonb; b text := btrim(coalesce(p_body, ''));
begin
  select * into w from private.pm_who(p_who, p_slug);
  if w.slug is null or not w.edit or p_room not in ('bersama', 'tim') or (p_room = 'tim' and w.kind <> 'tim') then return null; end if;
  if jsonb_typeof(p_file) = 'object' and coalesce(p_file ->> 'path', '') ~ ('^pm/' || w.slug || '/[a-z0-9]{16}\.[a-z0-9]{2,5}$') then
    f := jsonb_build_object('path', p_file ->> 'path', 'name', left(coalesce(p_file ->> 'name', 'berkas'), 120), 'type', left(coalesce(p_file ->> 'type', ''), 60));
  end if;
  if b = '' and f is null then return jsonb_build_object('ok', false); end if;
  if (select count(*) from public.pm_messages g where g.ref = w.ref and g.at > now() - interval '1 minute') >= 30 then
    return jsonb_build_object('ok', false, 'error', 'cepat');
  end if;
  insert into public.pm_messages (invitation, room, kind, ref, who, body, file) values (w.slug, p_room, w.kind, w.ref, left(w.name, 80), left(b, 4000), f);
  perform private.pm_log(w.kind, w.ref, w.slug, 'obrolan-' || p_room, 'Menulis di obrolan', 'Wrote in the chat of');
  return jsonb_build_object('ok', true);
end $$;

-- ---------------------------------------------------------------- the team's view across every wedding
create or replace function public.pm_board(t text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare m uuid := private.team_id(t); me text;
begin
  if not private.team_may(m, 'order-view') then return null; end if;
  me := m::text;
  return jsonb_build_object('now', now(), 'me', me,
    'weddings', coalesce((select jsonb_agg(jsonb_build_object(
        'slug', v.slug, 'couple', v.couple, 'status', v.status, 'date', private.pm_date(v.draft), 'full', v.pm_full,
        'tasks', (select count(*) from public.pm_items i where i.invitation = v.slug and i.kind = 'tugas' and not exists (select 1 from public.pm_items c where c.parent = i.id and c.kind = 'tugas')),
        'done', (select count(*) from public.pm_items i where i.invitation = v.slug and i.kind = 'tugas' and i.data ->> 'status' = 'selesai' and not exists (select 1 from public.pm_items c where c.parent = i.id and c.kind = 'tugas')),
        'first', (select min(i.data ->> 'start') from public.pm_items i where i.invitation = v.slug and i.kind = 'tugas'),
        'last', (select max(i.data ->> 'due') from public.pm_items i where i.invitation = v.slug and i.kind = 'tugas'),
        'waiting', coalesce((select g.kind = 'pasangan' from public.pm_messages g where g.invitation = v.slug and g.room = 'bersama' order by g.id desc limit 1), false),
        'unread', private.pm_unread(v.slug, me, true)
      ) order by private.pm_date(v.draft) nulls last, v.created_at) from public.invitations v where v.status <> 'arsip'), '[]'::jsonb),
    -- open leaf tasks with a date, and unpaid payment stages with a due date, over every live order
    'due', coalesce((select jsonb_agg(x order by x ->> 'due') from (
        select jsonb_build_object('slug', i.invitation, 'couple', v.couple, 'type', 'tugas', 'id', i.id, 'title', coalesce(i.data ->> 'title', ''),
                 'due', i.data ->> 'due', 'who', i.data ->> 'who', 'status', i.data ->> 'status') as x
          from public.pm_items i join public.invitations v on v.slug = i.invitation
         where v.status <> 'arsip' and i.kind = 'tugas' and coalesce(i.data ->> 'status', 'belum') <> 'selesai'
           and coalesce(i.data ->> 'due', '') ~ '^\d{4}-\d{2}-\d{2}$' and (i.data ->> 'due')::date <= current_date + 7
           and not exists (select 1 from public.pm_items c where c.parent = i.id and c.kind = 'tugas')
        union all
        select jsonb_build_object('slug', i.invitation, 'couple', v.couple, 'type', 'bayar', 'id', i.id,
                 'title', coalesce(p.data ->> 'item', '') || ' (' || coalesce(i.data ->> 'stage', 'dp') || ')', 'due', i.data ->> 'due', 'amount', i.data -> 'amount')
          from public.pm_items i join public.pm_items p on p.id = i.parent join public.invitations v on v.slug = i.invitation
         where v.status <> 'arsip' and i.kind = 'bayar' and coalesce(i.data ->> 'paid', '') = ''
           and coalesce(i.data ->> 'due', '') ~ '^\d{4}-\d{2}-\d{2}$' and (i.data ->> 'due')::date <= current_date + 7
        limit 400) q(x)), '[]'::jsonb),
    'load', coalesce((select jsonb_object_agg(k, n) from (
        select coalesce(i.data ->> 'who', '') as k, count(*) as n
          from public.pm_items i join public.invitations v on v.slug = i.invitation
         where v.status <> 'arsip' and i.kind = 'tugas' and coalesce(i.data ->> 'status', 'belum') <> 'selesai'
           and not exists (select 1 from public.pm_items c where c.parent = i.id and c.kind = 'tugas')
         group by 1) l), '{}'::jsonb),
    'members', coalesce((select jsonb_agg(jsonb_build_object('id', tm.id, 'name', tm.name) order by tm.name)
                         from public.team_members tm where tm.ended_at is null), '[]'::jsonb));
end $$;

-- ---------------------------------------------------------------- files
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('pm', 'pm', true, 10485760, array['image/webp', 'image/jpeg', 'image/png', 'application/pdf'])
on conflict (id) do update set public = true, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

create or replace function public.pm_upload_ok(p_name text) returns boolean
language sql stable security definer set search_path = '' as $$
  select coalesce(p_name, '') ~ '^pm/[a-z0-9-]{3,60}/[a-z0-9]{16}\.(webp|jpg|png|pdf)$'
     and exists (select 1 from private.upload_tickets k
                 where k.prefix = substring(p_name from '^(pm/[a-z0-9-]{3,60}/[a-z0-9]{16})') and k.expires_at > now());
$$;
revoke all on function public.pm_upload_ok(text) from public;
grant execute on function public.pm_upload_ok(text) to anon, authenticated;

drop policy if exists "Nawala plan files with a ticket" on storage.objects;
create policy "Nawala plan files with a ticket" on storage.objects for insert to anon, authenticated
  with check (bucket_id = 'pm' and public.pm_upload_ok(name));

-- one ticket = one file name (pm/<slug>/<16 characters>), valid 15 minutes; 120 an hour per wedding
create or replace function public.pm_ticket(p_who text, p_slug text) returns text
language plpgsql security definer set search_path = '' as $$
declare
  w record; nonce text := ''; pre text; i int;
  abc constant text := 'abcdefghijkmnpqrstuvwxyz23456789';
  raw bytea := decode(replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', ''), 'hex');
begin
  select * into w from private.pm_who(p_who, p_slug);
  if w.slug is null or not w.edit then return null; end if;
  if (select count(*) from private.upload_tickets k where k.target = 'pm:' || w.slug and k.expires_at > now() - interval '45 minutes') >= 120 then return null; end if;
  for i in 0..15 loop nonce := nonce || substr(abc, 1 + (get_byte(raw, i) % 32), 1); end loop;
  pre := 'pm/' || w.slug || '/' || nonce;
  delete from private.upload_tickets k where k.expires_at < now() - interval '1 day';
  insert into private.upload_tickets (prefix, target) values (pre, 'pm:' || w.slug);
  return pre;
end $$;

-- ---------------------------------------------------------------- grants
revoke all on function private.pm_date(jsonb), private.pm_who(text, text), private.pm_log(text, text, text, text, text, text),
  private.pm_seed(text, text), private.pm_rows(text, boolean), private.pm_unread(text, text, boolean), private.pm_dir(boolean),
  private.pm_msgs(text, text, bigint) from public, anon, authenticated;
revoke all on function public.pm_open(text, text), public.pm_save(text, text, jsonb), public.pm_set(text, text, jsonb),
  public.pm_dir_save(text, uuid, jsonb, boolean), public.pm_chat(text, text, text, bigint), public.pm_say(text, text, text, text, jsonb),
  public.pm_board(text), public.pm_ticket(text, text) from public;
grant execute on function public.pm_open(text, text), public.pm_save(text, text, jsonb), public.pm_set(text, text, jsonb),
  public.pm_dir_save(text, uuid, jsonb, boolean), public.pm_chat(text, text, text, bigint), public.pm_say(text, text, text, text, jsonb),
  public.pm_board(text), public.pm_ticket(text, text) to anon, authenticated;

commit;
