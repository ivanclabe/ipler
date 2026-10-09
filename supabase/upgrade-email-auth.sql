-- ============================================================
-- Actualización: de "usuarios propios del panel" a Supabase Auth directo.
-- Solo para proyectos que ya corrieron la versión ANTERIOR de schema.sql
-- (la que tenía ipler_users y el rol master). Proyectos nuevos: usar schema.sql.
-- Es seguro correrlo más de una vez.
-- ============================================================

-- La bitácora la puede leer cualquier cuenta con sesión (antes: solo master).
drop policy if exists ipler_audit_log_select_master on public.ipler_audit_log;
drop policy if exists ipler_audit_log_select_auth on public.ipler_audit_log;
create policy ipler_audit_log_select_auth
  on public.ipler_audit_log for select
  to authenticated
  using (true);

-- Quien hace un cambio queda registrado por su correo de Supabase Auth.
create or replace function public.ipler_current_actor()
returns text
language sql stable security definer set search_path = public as $$
  select coalesce((select email from auth.users where id = auth.uid()), 'desconocido');
$$;

revoke execute on function public.ipler_current_actor() from public, anon;
grant execute on function public.ipler_current_actor() to authenticated;

create or replace function public.ipler_log_action(p_action text, p_details jsonb default '{}'::jsonb)
returns void
language plpgsql security definer set search_path = public as $$
begin
  insert into public.ipler_audit_log (actor_id, actor_username, action, details)
  values (auth.uid(), public.ipler_current_actor(), p_action, p_details);
end;
$$;

create or replace function public.ipler_audit_config_change()
returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_changed jsonb := '{}'::jsonb;
begin
  if new.computrabajo_email is distinct from old.computrabajo_email then
    v_changed := v_changed || jsonb_build_object('computrabajo_email', jsonb_build_object('antes', old.computrabajo_email, 'despues', new.computrabajo_email));
  end if;
  if new.computrabajo_password is distinct from old.computrabajo_password then
    v_changed := v_changed || jsonb_build_object('computrabajo_password', 'cambió (valor no registrado)');
  end if;
  if new.oferta_oi is distinct from old.oferta_oi then
    v_changed := v_changed || jsonb_build_object('oferta_oi', jsonb_build_object('antes', old.oferta_oi, 'despues', new.oferta_oi));
  end if;
  if new.max_candidatos is distinct from old.max_candidatos then
    v_changed := v_changed || jsonb_build_object('max_candidatos', jsonb_build_object('antes', old.max_candidatos, 'despues', new.max_candidatos));
  end if;

  if v_changed <> '{}'::jsonb then
    insert into public.ipler_audit_log (actor_id, actor_username, action, target, details)
    values (auth.uid(), public.ipler_current_actor(), 'update_config', 'ipler_workflow_config', v_changed);
  end if;

  return new;
end;
$$;

-- Opcional: la tabla ipler_users, la función ipler_is_master y la Edge Function
-- ipler-create-user ya no se usan. No se borran aquí para no perder datos; si
-- quieres limpiarlas:
--   drop table if exists public.ipler_users;
--   drop function if exists public.ipler_is_master();
--   supabase functions delete ipler-create-user
