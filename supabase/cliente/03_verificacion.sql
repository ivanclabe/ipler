-- ============================================================
-- Panel Ipler — 03: verificación (solo lectura, no cambia nada)
-- Cada fila debe salir con ok = true.
-- ============================================================

select 'tabla ipler_workflow_config' as chequeo, to_regclass('public.ipler_workflow_config') is not null as ok
union all
select 'tabla ipler_execution_log', to_regclass('public.ipler_execution_log') is not null
union all
select 'tabla ipler_audit_log', to_regclass('public.ipler_audit_log') is not null
union all
select 'RLS activo en las 3 tablas', count(*) = 3
  from pg_class
  where oid in ('public.ipler_workflow_config'::regclass, 'public.ipler_execution_log'::regclass, 'public.ipler_audit_log'::regclass)
    and relrowsecurity
union all
select 'políticas (5)', count(*) = 5
  from pg_policies where schemaname = 'public' and tablename like 'ipler%'
union all
select 'funciones (4)', count(*) = 4
  from pg_proc p join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public'
    and p.proname in ('ipler_dashboard_stats', 'ipler_current_actor', 'ipler_log_action', 'ipler_audit_config_change')
union all
select 'trigger de auditoría', exists (
  select 1 from pg_trigger where tgname = 'ipler_workflow_config_audit' and not tgisinternal)
union all
select 'tiempo real (3 tablas)', count(*) = 3
  from pg_publication_tables where pubname = 'supabase_realtime' and tablename like 'ipler%'
union all
select 'fila de configuración id=current', exists (
  select 1 from public.ipler_workflow_config where id = 'current')
union all
select 'al menos un usuario en Authentication', exists (select 1 from auth.users);
