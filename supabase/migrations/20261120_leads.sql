-- Nawala leads: the three answers from the contact box on the home page.
-- Visitors may add a row. Nobody outside the Nawala team may read, change or remove one.

create table public.leads (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  name text not null check (char_length(name) between 2 and 80),
  wedding_month smallint check (wedding_month between 1 and 12),
  wedding_year smallint check (wedding_year between 2024 and 2100),
  whatsapp text not null check (whatsapp ~ '^[0-9]{10,15}$'),
  lang text not null default 'id' check (lang in ('id', 'en')),
  source text not null default 'home' check (char_length(source) <= 40),
  -- filled in by the team later
  access_token text unique,
  contacted_at timestamptz
);

alter table public.leads enable row level security;

revoke all on public.leads from anon, authenticated;
grant insert (name, wedding_month, wedding_year, whatsapp, lang, source) on public.leads to anon;

create policy "Visitors can leave their details"
  on public.leads for insert to anon
  with check (access_token is null and contacted_at is null);
