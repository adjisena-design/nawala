-- Nawala access codes: the log-in box on the home page asks whether a code exists.
-- A code is the access_token the team writes on a lead. Visitors can only ask yes or no;
-- they can never list or read codes. Codes are stored in capitals, as the page sends them.

alter table public.leads
  add constraint leads_access_token_shape
  check (access_token is null or access_token ~ '^[A-Z0-9-]{4,24}$');

create or replace function public.check_access_code(code text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.leads l
    where l.access_token = upper(regexp_replace(coalesce(code, ''), '[^A-Za-z0-9-]', '', 'g'))
  );
$$;

revoke all on function public.check_access_code(text) from public, anon, authenticated;
grant execute on function public.check_access_code(text) to anon, authenticated;
