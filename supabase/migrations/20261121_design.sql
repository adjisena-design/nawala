-- The design editor (21 Nov 2026, evening; undangan/sunting.html, assets/js/desain.js).
-- A couple (and the team) change the look of a Dasar invitation: faces, text boxes, photo frames, the opening, Nawala,
-- added elements. The design lives in the order's draft as draft.design and reaches guests only when the team publishes,
-- which is the owner's rule: every design change is checked and allowed in the console first.
--   * room_design_save / team_design_save write only draft.design, and log one line per 10 minutes of editing.
--   * room_order_save and team_order_save (the details form) now leave draft.design alone, so a form open in another
--     tab can never put back an older design.
-- Run after 20261121_roles_activity.sql.

begin;

create or replace function public.room_design_save(p_code text, p_design jsonb) returns boolean
language plpgsql security definer set search_path = '' as $$
declare s text := private.room_slug(p_code);
begin
  if s is null or p_design is null or jsonb_typeof(p_design) <> 'object' or octet_length(p_design::text) > 30000 then return false; end if;
  update public.invitations v set draft = coalesce(v.draft, '{}'::jsonb) || jsonb_build_object('design', p_design), draft_at = now(), updated_at = now() where v.slug = s;
  perform private.log_couple(private.norm_code(p_code), 'desain', 'Mengubah desain undangan', 'Changed the invitation design', interval '10 minutes');
  return true;
end $$;

create or replace function public.team_design_save(t text, p_slug text, p_design jsonb) returns boolean
language plpgsql security definer set search_path = '' as $$
declare m uuid := private.team_id(t); nm text;
begin
  if not private.team_may(m, 'order-edit') then return null; end if;
  if p_design is null or jsonb_typeof(p_design) <> 'object' or octet_length(p_design::text) > 30000 then return false; end if;
  update public.invitations v set draft = coalesce(v.draft, '{}'::jsonb) || jsonb_build_object('design', p_design), draft_at = now(), updated_at = now()
   where v.slug = p_slug and v.status <> 'arsip' returning v.couple into nm;
  if nm is null then return false; end if;
  perform private.log_team(m, 'desain:' || p_slug, 'Mengubah desain undangan ' || nm, 'Changed the design of ' || nm || '''s invitation', interval '10 minutes');
  return true;
end $$;

create or replace function public.room_order_save(p_code text, p_draft jsonb) returns boolean
language plpgsql security definer set search_path = '' as $$
declare s text := private.room_slug(p_code);
begin
  if s is null or p_draft is null or jsonb_typeof(p_draft) <> 'object' or octet_length(p_draft::text) > 60000 then return false; end if;
  update public.invitations v
     set draft = p_draft - 'design' || case when v.draft ? 'design' then jsonb_build_object('design', v.draft -> 'design') else '{}'::jsonb end,
         draft_at = now(), updated_at = now()
   where v.slug = s;
  perform private.log_couple(private.norm_code(p_code), 'data', 'Mengisi data undangan', 'Filled in their invitation details', interval '10 minutes');
  return true;
end $$;

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
    draft = case when p ? 'draft' and jsonb_typeof(p -> 'draft') = 'object'
                 then (p -> 'draft') - 'design' || case when v.draft ? 'design' then jsonb_build_object('design', v.draft -> 'design') else '{}'::jsonb end
                 else v.draft end,   /* the design is only written by the editor */
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

revoke all on function public.room_design_save(text, jsonb), public.team_design_save(text, text, jsonb) from public, anon, authenticated;
grant execute on function public.room_design_save(text, jsonb), public.team_design_save(text, text, jsonb) to anon, authenticated;

commit;
