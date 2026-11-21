-- Nawala builder (21 Nov 2026, afternoon): themes, orders and the invitations couples fill in.
-- The owner's decisions: both at once; couples fill in their invitation in their room and the team checks it;
-- invitations live in the database and go live from the console; "add a theme" makes a listing (its scenes are built
-- by hand later); photos: cover, bride, groom and up to 8 in the gallery; address nawalainvite.com/<name>;
-- an order tracks payment, package, deadlines with a checklist, and notes; couples keep a guest list with a link each.
--
-- Pictures go to the public storage bucket "media". Nobody may upload without a ticket: media_ticket() checks a
-- team token or the couple's access code and hands out a one-off folder name (valid 15 minutes); the storage policy
-- lets an upload in only under such a name. Files are never overwritten.

begin;

-- ---------------------------------------------------------------- themes
create table public.themes (
  slug text primary key check (slug ~ '^[a-z0-9-]{2,40}$'),
  tier text not null check (tier in ('dasar', 'premium', 'eksklusif')),
  family text check (family is null or family in ('alam', 'royal', 'religi', 'nusa', 'dunia', 'era', 'elemen')),
  name_id text not null check (char_length(name_id) between 1 and 40),
  name_en text not null check (char_length(name_en) between 1 and 40),
  desc_id text not null default '' check (char_length(desc_id) <= 300),
  desc_en text not null default '' check (char_length(desc_en) <= 300),
  cover text,          -- null: assets/img/cover-<slug>.webp in the repository; otherwise a storage address without ".webp"
  film text,           -- null: no film; 'repo': assets/video/<slug>.mp4; otherwise a storage address of an mp4
  kit text,            -- the working invitation behind it (a Dasar theme or a Premium world); null: none yet
  owned boolean not null default false,
  hidden boolean not null default false,
  sort int not null default 1000,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
alter table public.themes enable row level security;
revoke all on public.themes from public, anon, authenticated;

insert into public.themes (slug, tier, family, name_id, name_en, desc_id, desc_en, film, kit, sort) values
('putih-klasik', 'dasar', null, 'Putih Klasik', 'Classic White', 'Mawar putih dan sutra gading dalam cahaya pagi.', 'White roses and ivory silk in morning light.', 'repo', 'putih-klasik', 10),
('sage', 'dasar', null, 'Sage', 'Sage', 'Daun eukaliptus, bunga putih, dan linen hijau sage.', 'Eucalyptus, white flowers and sage green linen.', null, 'sage', 20),
('dusty-rose', 'dasar', null, 'Dusty Rose', 'Dusty Rose', 'Peony merah muda dan pita sutra.', 'Blush peonies and silk ribbon.', 'repo', 'dusty-rose', 30),
('emas-lembut', 'dasar', null, 'Emas Lembut', 'Soft Gold', 'Satin sampanye, lilin, dan cahaya keemasan.', 'Champagne satin, candles and golden light.', null, 'emas-lembut', 40),
('biru-langit', 'dasar', null, 'Biru Langit', 'Sky Blue', 'Hortensia biru muda dan linen putih.', 'Pale blue hydrangea and white linen.', null, 'biru-langit', 50),
('lavender', 'dasar', null, 'Lavender', 'Lavender', 'Lavender dan mawar ungu muda di senja hari.', 'Lavender and lilac roses at dusk.', null, 'lavender', 60),
('terakota', 'dasar', null, 'Terakota', 'Terracotta', 'Rumput pampas, daun palem kering, dan tembikar.', 'Pampas grass, dried palm and terracotta.', null, 'terakota', 70),
('daun-tropis', 'dasar', null, 'Daun Tropis', 'Tropical Leaves', 'Daun monstera dan anggrek putih.', 'Monstera leaves and white orchids.', null, 'daun-tropis', 80),
('marun', 'dasar', null, 'Marun', 'Maroon', 'Mawar merah tua dan cahaya lilin.', 'Deep red roses and candlelight.', null, 'marun', 90),
('melati', 'dasar', null, 'Melati', 'Jasmine', 'Roncean melati putih dan daun segar.', 'Garlands of white jasmine and fresh leaves.', null, 'melati', 100),
('senja', 'dasar', null, 'Senja', 'Sunset', 'Pantai tenang saat matahari terbenam.', 'A quiet beach at sunset.', null, 'senja', 110),
('malam-bintang', 'dasar', null, 'Malam Bintang', 'Starry Night', 'Langit berbintang, lampu kecil, dan bunga putih.', 'A starry sky, fairy lights and white flowers.', 'repo', 'malam-bintang', 120),
('hutan-pagi', 'premium', 'alam', 'Hutan Pagi', 'Morning Forest', 'Hutan, pantai, gunung, taman, dan langit.', 'Forest, coast, mountain, garden and sky.', 'repo', null, 130),
('balairung-merah', 'premium', 'royal', 'Balairung Merah', 'Crimson Hall', 'Balairung istana dalam sepuluh warna, selalu berpadu emas.', 'Palace halls in ten colours, always with gold.', 'repo', null, 140),
('akad-putih', 'premium', 'religi', 'Akad Putih', 'White Akad', 'Untuk akad, pemberkatan, dan setiap upacara keagamaan.', 'For akad, blessing and every ceremony of faith.', 'repo', 'akad-putih', 150),
('pendopo-jawa', 'premium', 'nusa', 'Pendopo Jawa', 'Javanese Pendopo', 'Betawi, Jawa, Sunda, Bali, Palembang, dan banyak lagi.', 'Betawi, Javanese, Sundanese, Balinese, Palembang and more.', null, 'pendopo-jawa', 160),
('toskana', 'premium', 'dunia', 'Toskana', 'Tuscany', 'Toskana, Paris, Santorini, Kyoto.', 'Tuscany, Paris, Santorini, Kyoto.', null, null, 170),
('tempo-doeloe', 'premium', 'era', 'Tempo Doeloe', 'Old Days', 'Tempo doeloe, noir, koboi, zaman samurai.', 'Old days, noir, the Old West, the age of samurai.', 'repo', null, 180),
('air', 'premium', 'elemen', 'Air', 'Water', 'Air, api, bumi, emas, mutiara.', 'Water, fire, earth, gold, pearl.', 'repo', null, 190),
('padang-bunga', 'premium', 'alam', 'Padang Bunga', 'Flower Meadow', 'Hutan, pantai, gunung, taman, dan langit.', 'Forest, coast, mountain, garden and sky.', null, null, 200),
('istana-zamrud', 'premium', 'royal', 'Istana Zamrud', 'Emerald Palace', 'Balairung istana dalam sepuluh warna, selalu berpadu emas.', 'Palace halls in ten colours, always with gold.', null, null, 210),
('pemberkatan', 'premium', 'religi', 'Pemberkatan', 'The Blessing', 'Untuk akad, pemberkatan, dan setiap upacara keagamaan.', 'For akad, blessing and every ceremony of faith.', null, null, 220),
('saung-sunda', 'premium', 'nusa', 'Saung Sunda', 'Sundanese Saung', 'Betawi, Jawa, Sunda, Bali, Palembang, dan banyak lagi.', 'Betawi, Javanese, Sundanese, Balinese, Palembang and more.', null, null, 230),
('paris', 'premium', 'dunia', 'Paris', 'Paris', 'Toskana, Paris, Santorini, Kyoto.', 'Tuscany, Paris, Santorini, Kyoto.', null, null, 240),
('noir', 'premium', 'era', 'Noir', 'Noir', 'Tempo doeloe, noir, koboi, zaman samurai.', 'Old days, noir, the Old West, the age of samurai.', null, null, 250),
('api', 'premium', 'elemen', 'Api', 'Fire', 'Air, api, bumi, emas, mutiara.', 'Water, fire, earth, gold, pearl.', null, null, 260),
('lembah-kabut', 'premium', 'alam', 'Lembah Kabut', 'Misty Valley', 'Hutan, pantai, gunung, taman, dan langit.', 'Forest, coast, mountain, garden and sky.', null, null, 270),
('takhta-biru', 'premium', 'royal', 'Takhta Biru', 'Sapphire Throne', 'Balairung istana dalam sepuluh warna, selalu berpadu emas.', 'Palace halls in ten colours, always with gold.', null, null, 280),
('pawiwahan', 'premium', 'religi', 'Pawiwahan', 'Pawiwahan', 'Untuk akad, pemberkatan, dan setiap upacara keagamaan.', 'For akad, blessing and every ceremony of faith.', null, null, 290),
('taman-bali', 'premium', 'nusa', 'Taman Bali', 'Balinese Garden', 'Betawi, Jawa, Sunda, Bali, Palembang, dan banyak lagi.', 'Betawi, Javanese, Sundanese, Balinese, Palembang and more.', null, null, 300),
('santorini', 'premium', 'dunia', 'Santorini', 'Santorini', 'Toskana, Paris, Santorini, Kyoto.', 'Tuscany, Paris, Santorini, Kyoto.', 'repo', null, 310),
('koboi', 'premium', 'era', 'Koboi', 'Old West', 'Tempo doeloe, noir, koboi, zaman samurai.', 'Old days, noir, the Old West, the age of samurai.', null, null, 320),
('emas', 'premium', 'elemen', 'Emas', 'Gold', 'Air, api, bumi, emas, mutiara.', 'Water, fire, earth, gold, pearl.', null, null, 330),
('tepi-danau', 'premium', 'alam', 'Tepi Danau', 'Lakeside', 'Hutan, pantai, gunung, taman, dan langit.', 'Forest, coast, mountain, garden and sky.', null, null, 340),
('mahkota-emas', 'premium', 'royal', 'Mahkota Emas', 'Golden Crown', 'Balairung istana dalam sepuluh warna, selalu berpadu emas.', 'Palace halls in ten colours, always with gold.', null, null, 350),
('doa-senja', 'premium', 'religi', 'Doa Senja', 'Evening Prayer', 'Untuk akad, pemberkatan, dan setiap upacara keagamaan.', 'For akad, blessing and every ceremony of faith.', null, null, 360),
('songket-palembang', 'premium', 'nusa', 'Songket Palembang', 'Palembang Songket', 'Betawi, Jawa, Sunda, Bali, Palembang, dan banyak lagi.', 'Betawi, Javanese, Sundanese, Balinese, Palembang and more.', 'repo', null, 370),
('kyoto', 'premium', 'dunia', 'Kyoto', 'Kyoto', 'Toskana, Paris, Santorini, Kyoto.', 'Tuscany, Paris, Santorini, Kyoto.', null, 'kyoto', 380),
('samurai', 'premium', 'era', 'Samurai', 'Samurai', 'Tempo doeloe, noir, koboi, zaman samurai.', 'Old days, noir, the Old West, the age of samurai.', null, null, 390),
('mutiara', 'premium', 'elemen', 'Mutiara', 'Pearl', 'Air, api, bumi, emas, mutiara.', 'Water, fire, earth, gold, pearl.', null, null, 400),
('istana-awan', 'eksklusif', null, 'Istana Awan', 'Cloud Palace', 'Tangga marmer menuju istana di atas awan.', 'A marble staircase to a palace above the clouds.', 'repo', 'istana-awan', 410),
('taman-kaca', 'eksklusif', null, 'Taman Kaca', 'Glass Garden', 'Rumah kaca penuh anggrek saat fajar.', 'A glasshouse full of orchids at dawn.', 'repo', null, 420),
('perpustakaan-emas', 'eksklusif', null, 'Perpustakaan Emas', 'Golden Library', 'Perpustakaan keemasan; bukunya terbuka dan bercahaya saat tamu tiba.', 'A golden library; its book opens and glows as your guest arrives.', 'repo', null, 430),
('kapal-bulan', 'eksklusif', null, 'Kapal Bulan', 'Moon Boat', 'Perahu kecil di lautan bintang menuju bulan sabit.', 'A small boat on a sea of stars, heading for the crescent moon.', 'repo', 'kapal-bulan', 440),
('seribu-lentera', 'eksklusif', null, 'Seribu Lentera', 'A Thousand Lanterns', 'Lorong seribu lentera; gerbangnya terbuka di ujung.', 'A corridor of a thousand lanterns; the gate opens at its end.', 'repo', null, 450),
('bawah-laut', 'eksklusif', null, 'Bawah Laut', 'Under the Sea', 'Paviliun karang dan mutiara di dasar laut yang jernih.', 'A pavilion of coral and pearl on a clear sea floor.', 'repo', null, 460),
('teater-tua', 'eksklusif', null, 'Teater Tua', 'Old Opera House', 'Gedung opera tua; tirainya terbuka saat tamu mendekat.', 'An old opera house; the curtain parts as your guest approaches.', 'repo', 'teater-tua', 470),
('keraton-malam', 'eksklusif', null, 'Keraton Malam', 'Palace by Lamplight', 'Pelataran keraton yang diterangi ratusan pelita.', 'A palace courtyard lit by hundreds of oil lamps.', 'repo', null, 480),
('aurora', 'eksklusif', null, 'Aurora', 'Aurora', 'Paviliun kaca di atas salju, di bawah cahaya utara.', 'A glass pavilion on snow under the northern lights.', 'repo', null, 490),
('kebun-mawar', 'eksklusif', null, 'Kebun Mawar', 'Secret Rose Garden', 'Taman mawar rahasia; pintunya terbuka untuk tamu.', 'A secret rose garden; its door opens for your guest.', 'repo', null, 500);

-- ---------------------------------------------------------------- orders: an invitation is the order
alter table public.invitations
  add column code text references public.access_codes (code) on delete set null,
  add column lead_id uuid references public.leads (id) on delete set null,
  add column status text not null default 'isi' check (status in ('isi', 'periksa', 'tayang', 'arsip')),
  add column level smallint not null default 2 check (level between 1 and 3),
  add column wording text not null default 'umum' check (wording in ('umum', 'islam')),
  add column draft jsonb not null default '{}'::jsonb,
  add column live jsonb,
  add column pay_status text not null default 'belum' check (pay_status in ('belum', 'dp', 'lunas')),
  add column pay_amount bigint check (pay_amount is null or pay_amount between 0 and 1000000000),
  add column pay_date date,
  add column live_by date,
  add column checklist jsonb not null default '{}'::jsonb,
  add column notes text not null default '' check (char_length(notes) <= 4000),
  add column updated_at timestamptz not null default now(),
  add column submitted_at timestamptz,
  add column published_at timestamptz,
  add column draft_at timestamptz;
create unique index invitations_code on public.invitations (code) where code is not null and status <> 'arsip';

create table public.guests (
  id uuid primary key default gen_random_uuid(),
  invitation text not null references public.invitations (slug) on delete cascade,
  name text not null check (char_length(name) between 1 and 80),
  phone text check (phone is null or phone ~ '^[0-9]{8,15}$'),
  created_at timestamptz not null default now(),
  sent_at timestamptz
);
create index guests_invitation on public.guests (invitation, created_at);
alter table public.guests enable row level security;
revoke all on public.guests from public, anon, authenticated;

-- ---------------------------------------------------------------- uploads
create table private.upload_tickets (
  prefix text primary key,
  target text not null,
  expires_at timestamptz not null default now() + interval '15 minutes'
);
alter table private.upload_tickets enable row level security;
revoke all on private.upload_tickets from public, anon, authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('media', 'media', true, 10485760, array['image/webp', 'image/jpeg', 'video/mp4'])
on conflict (id) do update set public = true, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

-- Asked by the storage policy for every upload. Says yes only for a name inside a live ticket's folder.
create or replace function public.media_upload_ok(p_name text) returns boolean
language sql stable security definer set search_path = '' as $$
  select coalesce(p_name, '') ~ '^(theme|inv)/[a-z0-9-]{2,60}/[a-z0-9]{16}(-[a-z0-9]{1,8})?\.(webp|jpg|mp4)$'
     and exists (select 1 from private.upload_tickets k
                 where k.prefix = substring(p_name from '^((?:theme|inv)/[a-z0-9-]{2,60}/[a-z0-9]{16})')
                   and k.expires_at > now());
$$;
revoke all on function public.media_upload_ok(text) from public;
grant execute on function public.media_upload_ok(text) to anon, authenticated;

drop policy if exists "Nawala uploads with a ticket" on storage.objects;
create policy "Nawala uploads with a ticket" on storage.objects for insert to anon, authenticated
  with check (bucket_id = 'media' and public.media_upload_ok(name));

-- p_who: a team token (any target) or the couple's access code (only their own invitation).
-- p_kind: 'theme' (team only; p_target is the theme slug) or 'inv' (p_target is the invitation slug).
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
    if team is null then return null; end if;
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

-- ---------------------------------------------------------------- the home page reads its themes here
create or replace function public.site_themes() returns jsonb
language sql stable security definer set search_path = '' as $$
  select coalesce(jsonb_agg(jsonb_build_object('slug', t.slug, 'tier', t.tier, 'family', t.family,
           'name', jsonb_build_array(t.name_id, t.name_en), 'desc', jsonb_build_array(t.desc_id, t.desc_en),
           'cover', t.cover, 'film', t.film, 'kit', t.kit, 'owned', t.owned) order by
           case t.tier when 'dasar' then 1 when 'premium' then 2 else 3 end, t.sort, t.name_id), '[]'::jsonb)
  from public.themes t where t.deleted_at is null and not t.hidden;
$$;

-- ---------------------------------------------------------------- guests open a live invitation (the edge worker asks)
create or replace function public.guest_invitation(p_slug text) returns jsonb
language sql stable security definer set search_path = '' as $$
  select case when v.live is null then null
    else jsonb_build_object('slug', v.slug, 'couple', v.couple, 'data', v.live || jsonb_build_object('slug', v.slug, 'sample', false)) end
  from public.invitations v where v.slug = p_slug and v.status = 'tayang';
$$;

-- ---------------------------------------------------------------- the couple's room
create or replace function private.room_invitation(p_code text) returns jsonb
language sql stable security definer set search_path = '' as $$
  select jsonb_build_object('slug', v.slug, 'couple', v.couple, 'status', v.status, 'theme', v.theme, 'level', v.level,
           'wording', v.wording, 'draft', v.draft, 'live', v.live is not null, 'submitted_at', v.submitted_at,
           'published_at', v.published_at, 'draft_at', v.draft_at,
           'guests', coalesce((select jsonb_agg(jsonb_build_object('id', g.id, 'name', g.name, 'phone', g.phone, 'sent_at', g.sent_at,
                       'answer', (select r.attending from public.rsvps r where r.invitation = v.slug and lower(r.guest) = lower(g.name) order by r.created_at desc limit 1))
                       order by g.created_at) from public.guests g where g.invitation = v.slug), '[]'::jsonb))
  from public.invitations v where v.code = p_code and v.status <> 'arsip' limit 1;
$$;
revoke all on function private.room_invitation(text) from public, anon, authenticated;

create or replace function public.room_open(p_code text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare c text := private.norm_code(p_code); r record;
begin
  update public.access_codes a set last_used_at = now()
   where a.code = c and a.ended_at is null and (a.expires_at is null or a.expires_at > now())
   returning a.code, a.label, a.created_at, a.expires_at, a.state into r;
  if not found then return null; end if;
  return jsonb_build_object('code', r.code, 'label', r.label, 'created_at', r.created_at,
    'expires_at', r.expires_at, 'now', now(), 'state', r.state, 'order', private.room_invitation(r.code));
end $$;

create or replace function private.room_slug(p_code text) returns text
language sql stable security definer set search_path = '' as $$
  select v.slug from public.invitations v join public.access_codes a on a.code = v.code
  where a.code = private.norm_code(p_code) and v.status <> 'arsip'
    and a.ended_at is null and (a.expires_at is null or a.expires_at > now()) limit 1;
$$;
revoke all on function private.room_slug(text) from public, anon, authenticated;

-- the couple's form, saved as they type
create or replace function public.room_order_save(p_code text, p_draft jsonb) returns boolean
language plpgsql security definer set search_path = '' as $$
declare s text := private.room_slug(p_code);
begin
  if s is null or p_draft is null or jsonb_typeof(p_draft) <> 'object' or octet_length(p_draft::text) > 60000 then return false; end if;
  update public.invitations v set draft = p_draft, draft_at = now(), updated_at = now() where v.slug = s;
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
  return true;
end $$;

-- the guest list: the whole list each time, at most 1500 names; a name already on the list keeps its sent mark
create or replace function public.room_guests_save(p_code text, p_guests jsonb) returns boolean
language plpgsql security definer set search_path = '' as $$
declare s text := private.room_slug(p_code);
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
  delete from public.guests g where g.invitation = s and lower(g.name) not in (select lower(n.name) from pg_temp.new_guests n);
  update public.guests g set phone = n.phone, sent_at = case when n.sent then coalesce(g.sent_at, now()) else null end
    from pg_temp.new_guests n where g.invitation = s and lower(g.name) = lower(n.name);
  insert into public.guests (invitation, name, phone, sent_at)
  select s, n.name, n.phone, case when n.sent then now() end from pg_temp.new_guests n
  where not exists (select 1 from public.guests g where g.invitation = s and lower(g.name) = lower(n.name));
  return true;
end $$;

-- ---------------------------------------------------------------- the team console
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
        select v.slug, v.couple, v.theme, v.active, v.created_at, v.code, v.lead_id, v.status, v.level, v.wording,
               v.draft, v.live is not null as has_live, v.pay_status, v.pay_amount, v.pay_date, v.live_by, v.checklist,
               v.notes, v.updated_at, v.submitted_at, v.published_at, v.draft_at,
               (v.live is not null and v.draft_at is not null and v.draft_at > coalesce(v.published_at, v.draft_at)) as pending,
               (select count(*) from public.guests g where g.invitation = v.slug) as guests,
               (select count(*) from public.rsvps r where r.invitation = v.slug) as answers,
               (select coalesce(sum(r.headcount), 0) from public.rsvps r where r.invitation = v.slug and r.attending = 'hadir') as coming
        from public.invitations v order by v.created_at desc limit 500) i), '[]'::jsonb),
    'wishes', coalesce((select jsonb_agg(to_jsonb(w)) from (
        select ws.id, ws.invitation, ws.guest, ws.body, ws.hidden, ws.created_at
        from public.wishes ws order by ws.created_at desc limit 300) w), '[]'::jsonb),
    'themes', coalesce((select jsonb_agg(to_jsonb(th) order by case th.tier when 'dasar' then 1 when 'premium' then 2 else 3 end, th.sort, th.name_id) from (
        select x.slug, x.tier, x.family, x.name_id, x.name_en, x.desc_id, x.desc_en, x.cover, x.film, x.kit, x.owned, x.hidden,
               x.sort, x.deleted_at from public.themes x) th), '[]'::jsonb));
end $$;

create or replace function private.slug_free(p_slug text) returns boolean
language sql stable security definer set search_path = '' as $$
  select coalesce(p_slug, '') ~ '^[a-z0-9][a-z0-9-]{1,58}[a-z0-9]$'
     and p_slug not in ('tim', 'ruang', 'undangan', 'assets', 'supabase', 'cloudflare', 'admin', 'api', 'www', 'index',
                        'favicon', 'robots', 'sitemap', 'cname', 'readme', 'claude', 'u', 'contoh', 'nawala', 'login', 'masuk')
     and not exists (select 1 from public.invitations v where v.slug = p_slug);
$$;
revoke all on function private.slug_free(text) from public, anon, authenticated;

-- A new order. p_code: an existing access code (from the couple's room), or null to make one now.
-- The code is given no end date and marked as an order; the request it came from moves to Konsep.
create or replace function public.team_order_create(t text, p_slug text, p_couple text, p_code text default null, p_theme text default null) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare m uuid := private.team_id(t); c text := nullif(private.norm_code(p_code), ''); lead uuid; th text := p_theme; st jsonb;
begin
  if m is null then return null; end if;
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
  return jsonb_build_object('slug', p_slug, 'code', c);
end $$;

-- Package, payment, deadline, checklist, notes and the draft. Only the keys present in p_patch change.
create or replace function public.team_order_save(t text, p_slug text, p_patch jsonb) returns boolean
language plpgsql security definer set search_path = '' as $$
declare m uuid := private.team_id(t); p jsonb := coalesce(p_patch, '{}'::jsonb);
begin
  if m is null then return null; end if;
  if jsonb_typeof(p) <> 'object' or octet_length(p::text) > 70000 then return false; end if;
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
    draft_at = case when p ?| array['draft', 'theme', 'level', 'wording'] then now() else v.draft_at end,   /* what guests would see changed */
    status = case when p ? 'status' and p ->> 'status' in ('isi', 'periksa', 'arsip') and v.status <> 'tayang' then p ->> 'status'
                  when p ? 'status' and p ->> 'status' = 'arsip' then 'arsip' else v.status end,
    active = case when p ? 'status' and p ->> 'status' = 'arsip' then false else v.active end,
    updated_at = now()
  where v.slug = p_slug;
  return found;
end $$;

-- Publish: p_live is the finished invitation the console compiled from the draft. Null takes it offline.
create or replace function public.team_order_publish(t text, p_slug text, p_live jsonb) returns boolean
language plpgsql security definer set search_path = '' as $$
declare m uuid := private.team_id(t);
begin
  if m is null then return null; end if;
  if p_live is null then
    update public.invitations v set status = 'periksa', active = false, updated_at = now() where v.slug = p_slug and v.status = 'tayang';
    return found;
  end if;
  if jsonb_typeof(p_live) <> 'object' or octet_length(p_live::text) > 70000 then return false; end if;
  update public.invitations v set live = p_live, status = 'tayang', active = true, published_at = now(), updated_at = now()
   where v.slug = p_slug and v.status <> 'arsip';
  return found;
end $$;

-- One order in full: its guests with their answers, the answers, the wishes.
create or replace function public.team_order(t text, p_slug text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare m uuid := private.team_id(t);
begin
  if m is null then return null; end if;
  return jsonb_build_object(
    'guests', coalesce((select jsonb_agg(jsonb_build_object('id', g.id, 'name', g.name, 'phone', g.phone, 'sent_at', g.sent_at,
                 'answer', (select r.attending from public.rsvps r where r.invitation = p_slug and lower(r.guest) = lower(g.name) order by r.created_at desc limit 1))
                 order by g.created_at) from public.guests g where g.invitation = p_slug), '[]'::jsonb),
    'rsvps', coalesce((select jsonb_agg(jsonb_build_object('guest', r.guest, 'attending', r.attending, 'headcount', r.headcount, 'at', r.created_at)
                 order by r.created_at desc) from public.rsvps r where r.invitation = p_slug), '[]'::jsonb),
    'wishes', coalesce((select jsonb_agg(jsonb_build_object('id', w.id, 'guest', w.guest, 'body', w.body, 'hidden', w.hidden, 'at', w.created_at)
                 order by w.created_at desc) from public.wishes w where w.invitation = p_slug), '[]'::jsonb));
end $$;

-- Themes. p_patch keys: tier, family, name_id, name_en, desc_id, desc_en, cover, film, owned, hidden, sort.
-- p_new true makes a new theme (p_slug must be free); false edits one.
create or replace function public.team_theme_save(t text, p_slug text, p_patch jsonb, p_new boolean default false) returns boolean
language plpgsql security definer set search_path = '' as $$
declare m uuid := private.team_id(t); p jsonb := coalesce(p_patch, '{}'::jsonb);
begin
  if m is null then return null; end if;
  if jsonb_typeof(p) <> 'object' then return false; end if;
  if p ? 'cover' and coalesce(p ->> 'cover', '') <> '' and p ->> 'cover' !~ '^https://erwddnobnagpglkpvdfm\.supabase\.co/storage/v1/object/public/media/theme/' then return false; end if;
  if p ? 'film' and coalesce(p ->> 'film', '') not in ('', 'repo') and p ->> 'film' !~ '^https://erwddnobnagpglkpvdfm\.supabase\.co/storage/v1/object/public/media/theme/' then return false; end if;
  if p_new then
    if exists (select 1 from public.themes x where x.slug = p_slug) then return false; end if;
    insert into public.themes (slug, tier, family, name_id, name_en, desc_id, desc_en, cover, film, sort)
    values (p_slug, p ->> 'tier', nullif(p ->> 'family', ''), btrim(p ->> 'name_id'), btrim(coalesce(nullif(p ->> 'name_en', ''), p ->> 'name_id')),
            coalesce(p ->> 'desc_id', ''), coalesce(nullif(p ->> 'desc_en', ''), p ->> 'desc_id', ''),
            nullif(p ->> 'cover', ''), nullif(p ->> 'film', ''), coalesce((p ->> 'sort')::int, 1000));
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
  where x.slug = p_slug;
  return found;
end $$;

-- Delete keeps the row (deleted_at) so it can be brought back; p_restore true brings it back.
create or replace function public.team_theme_delete(t text, p_slug text, p_restore boolean default false) returns boolean
language plpgsql security definer set search_path = '' as $$
declare m uuid := private.team_id(t);
begin
  if m is null then return null; end if;
  update public.themes x set deleted_at = case when p_restore then null else now() end, updated_at = now() where x.slug = p_slug;
  return found;
end $$;

-- ---------------------------------------------------------------- who may call what
revoke all on function public.site_themes(), public.guest_invitation(text), public.media_ticket(text, text, text),
  public.room_order_save(text, jsonb), public.room_order_submit(text), public.room_guests_save(text, jsonb),
  public.team_order_create(text, text, text, text, text), public.team_order_save(text, text, jsonb),
  public.team_order_publish(text, text, jsonb), public.team_order(text, text),
  public.team_theme_save(text, text, jsonb, boolean), public.team_theme_delete(text, text, boolean)
  from public, anon, authenticated;
grant execute on function public.site_themes(), public.guest_invitation(text), public.media_ticket(text, text, text),
  public.room_order_save(text, jsonb), public.room_order_submit(text), public.room_guests_save(text, jsonb),
  public.team_order_create(text, text, text, text, text), public.team_order_save(text, text, jsonb),
  public.team_order_publish(text, text, jsonb), public.team_order(text, text),
  public.team_theme_save(text, text, jsonb, boolean), public.team_theme_delete(text, text, boolean)
  to anon, authenticated;

commit;
