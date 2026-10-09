-- ============================================================
-- Panel Ipler — 01: esquema completo
--
-- Correr COMPLETO en Supabase → SQL Editor del proyecto del cliente.
-- Es seguro correrlo más de una vez (no borra datos) y sirve tanto para un
-- proyecto vacío como para uno que ya tenía una versión anterior del esquema.
-- ============================================================

-- ------------------------------------------------------------
-- ipler_workflow_config: fila única (id='current') con la configuración.
-- El panel la edita; n8n la lee al inicio de cada corrida.
-- ------------------------------------------------------------
create table if not exists public.ipler_workflow_config (
  id                     text primary key default 'current',
  computrabajo_email     text not null,
  computrabajo_password  text,
  oferta_oi              text not null,
  empresa_cf             text not null,
  portal_base_url        text not null,
  max_candidatos         integer not null default 30,
  updated_at             timestamptz not null default now(),
  updated_by             text
);

alter table public.ipler_workflow_config enable row level security;

-- Solo usuarios con sesión en el panel. n8n usa la service_role (ignora RLS).
drop policy if exists ipler_config_select_auth on public.ipler_workflow_config;
create policy ipler_config_select_auth
  on public.ipler_workflow_config for select
  to authenticated
  using (true);

drop policy if exists ipler_config_update_auth on public.ipler_workflow_config;
create policy ipler_config_update_auth
  on public.ipler_workflow_config for update
  to authenticated
  using (true)
  with check (true);

-- ------------------------------------------------------------
-- ipler_execution_log: un registro por corrida (lo escribe n8n)
-- ------------------------------------------------------------
create table if not exists public.ipler_execution_log (
  id                      bigint generated always as identity primary key,
  execution_id            text not null,
  status                  text not null,
  candidatos_procesados   integer not null default 0,
  candidatos_omitidos     integer not null default 0,
  mensaje                 text,
  spreadsheet_id          text,
  timestamp_inicio        timestamptz,
  timestamp_fin           timestamptz,
  created_at              timestamptz not null default now()
);

create index if not exists ipler_execution_log_created_at_idx
  on public.ipler_execution_log (created_at desc);

alter table public.ipler_execution_log enable row level security;

drop policy if exists ipler_log_select_auth on public.ipler_execution_log;
create policy ipler_log_select_auth
  on public.ipler_execution_log for select
  to authenticated
  using (true);

drop policy if exists ipler_log_insert_auth on public.ipler_execution_log;
create policy ipler_log_insert_auth
  on public.ipler_execution_log for insert
  to authenticated
  with check (true);

-- ------------------------------------------------------------
-- ipler_audit_log: bitácora de cambios (pestaña "Actividad").
-- La lee cualquier cuenta de Supabase Auth del proyecto; nadie inserta
-- directo: solo las funciones security definer de abajo.
-- ------------------------------------------------------------
create table if not exists public.ipler_audit_log (
  id               bigint generated always as identity primary key,
  actor_id         uuid,
  actor_username   text not null,  -- correo de quien hizo el cambio
  action           text not null,
  target           text,
  details          jsonb not null default '{}'::jsonb,
  created_at       timestamptz not null default now()
);

alter table public.ipler_audit_log enable row level security;

drop policy if exists ipler_audit_log_select_master on public.ipler_audit_log;  -- versión anterior
drop policy if exists ipler_audit_log_select_auth on public.ipler_audit_log;
create policy ipler_audit_log_select_auth
  on public.ipler_audit_log for select
  to authenticated
  using (true);

-- ------------------------------------------------------------
-- Permisos de la API. Los proyectos nuevos de Supabase pueden venir sin
-- permisos automáticos sobre tablas nuevas; aquí quedan explícitos.
-- anon (sin sesión) no tiene acceso a nada.
-- ------------------------------------------------------------
revoke all on public.ipler_workflow_config, public.ipler_execution_log, public.ipler_audit_log from anon;
grant select, update on public.ipler_workflow_config to authenticated;
grant select, insert on public.ipler_execution_log to authenticated;
grant select on public.ipler_audit_log to authenticated;
grant all on public.ipler_workflow_config, public.ipler_execution_log, public.ipler_audit_log to service_role;

-- ------------------------------------------------------------
-- Indicadores del panel (límites de día/semana en hora de Bogotá)
-- ------------------------------------------------------------
create or replace function public.ipler_dashboard_stats(p_tz text default 'America/Bogota')
returns table (
  leads_hoy integer, leads_semana integer, runs_hoy integer,
  runs_recientes integer, fallos_recientes integer,
  tasa_exito_recientes integer, ultima_corrida_at timestamptz,
  ultima_corrida_status text, total_runs integer
)
language sql stable security invoker set search_path = public as $$
  with hoy as (
    select * from ipler_execution_log
    where created_at >= (date_trunc('day', now() at time zone p_tz) at time zone p_tz)
  ), semana as (
    select * from ipler_execution_log
    where created_at >= (date_trunc('week', now() at time zone p_tz) at time zone p_tz)
  ), recientes as (
    select * from ipler_execution_log order by created_at desc limit 30
  )
  select
    coalesce((select sum(candidatos_procesados) from hoy), 0)::int,
    coalesce((select sum(candidatos_procesados) from semana), 0)::int,
    (select count(*) from hoy)::int,
    (select count(*) from recientes)::int,
    (select count(*) filter (where status = 'FAILED') from recientes)::int,
    case when (select count(*) from recientes) = 0 then null
      else round(100.0 * (select count(*) filter (where status != 'FAILED') from recientes)
        / (select count(*) from recientes))::int end,
    (select created_at from ipler_execution_log order by created_at desc limit 1),
    (select status::text from ipler_execution_log order by created_at desc limit 1),
    (select count(*) from ipler_execution_log)::int;
$$;

revoke execute on function public.ipler_dashboard_stats(text) from public, anon;
grant execute on function public.ipler_dashboard_stats(text) to authenticated, service_role;

-- ------------------------------------------------------------
-- Auditoría
-- ------------------------------------------------------------
-- Quien hace un cambio queda registrado por su correo de Supabase Auth.
create or replace function public.ipler_current_actor()
returns text
language sql stable security definer set search_path = public as $$
  select coalesce((select email from auth.users where id = auth.uid()), 'desconocido');
$$;

revoke execute on function public.ipler_current_actor() from public, anon;
grant execute on function public.ipler_current_actor() to authenticated;

-- Acciones explícitas del panel (p. ej. cambio de contraseña).
create or replace function public.ipler_log_action(p_action text, p_details jsonb default '{}'::jsonb)
returns void
language plpgsql security definer set search_path = public as $$
begin
  insert into public.ipler_audit_log (actor_id, actor_username, action, details)
  values (auth.uid(), public.ipler_current_actor(), p_action, p_details);
end;
$$;

revoke execute on function public.ipler_log_action(text, jsonb) from public, anon;
grant execute on function public.ipler_log_action(text, jsonb) to authenticated;

-- Cambios de configuración: automático, nunca registra la contraseña.
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

drop trigger if exists ipler_workflow_config_audit on public.ipler_workflow_config;
create trigger ipler_workflow_config_audit
  after update on public.ipler_workflow_config
  for each row
  execute function public.ipler_audit_config_change();

-- ------------------------------------------------------------
-- Tiempo real: el panel se actualiza solo
-- ------------------------------------------------------------
do $$
declare
  t text;
begin
  if not exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    create publication supabase_realtime;
  end if;
  foreach t in array array['ipler_execution_log', 'ipler_workflow_config', 'ipler_audit_log'] loop
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t
    ) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end;
$$;
