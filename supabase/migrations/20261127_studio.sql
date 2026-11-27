-- The Studio (27 Nov 2026; undangan/studio.html, assets/js/desain.js).
-- The Studio keeps what the team opened or closed for one couple inside the design itself, as draft.design.hak
-- ({"<cap>": true|false}; see CAPS in desain.js). The page only lets the team change it, but until this migration
-- runs the couple's own save function would store whatever hak it is handed. After it:
--   * room_design_save keeps the stored hak and ignores the one it is handed;
--   * team_design_save is unchanged (the team writes the whole design, hak included).
-- Nothing else changes: same checks, same 30 KB limit, same log line.
-- Run after 20261123_pintu.sql. NOT RUN YET (written 27 Nov 2026, night, while the owner was away).

begin;

create or replace function public.room_design_save(p_code text, p_design jsonb) returns boolean
language plpgsql security definer set search_path = '' as $$
declare s text := private.room_slug(p_code);
begin
  if s is null or p_design is null or jsonb_typeof(p_design) <> 'object' or octet_length(p_design::text) > 30000 then return false; end if;
  update public.invitations v
     set draft = coalesce(v.draft, '{}'::jsonb) || jsonb_build_object('design',
           (p_design - 'hak') || case when jsonb_typeof(v.draft #> '{design,hak}') = 'object'
                                      then jsonb_build_object('hak', v.draft #> '{design,hak}') else '{}'::jsonb end),
         draft_at = now(), updated_at = now()
   where v.slug = s;
  perform private.log_couple(private.norm_code(p_code), 'desain', 'Mengubah desain undangan', 'Changed the invitation design', interval '10 minutes');
  return true;
end $$;

commit;
