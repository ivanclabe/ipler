-- ============================================================
-- Panel Ipler — 04 (OPCIONAL): limpieza de la versión anterior
--
-- Solo si en este proyecto se corrió alguna vez el esquema viejo (el de
-- usuarios propios del panel: tabla ipler_users y rol "master").
-- En un proyecto nuevo no hace nada. Correr DESPUÉS de 01_esquema.sql.
--
-- Las cuentas de Supabase Auth (master@ipler.local, etc.) NO se borran:
-- siguen pudiendo entrar al panel escribiendo solo el nombre (p. ej. "master").
-- ============================================================

drop table if exists public.ipler_users;
drop function if exists public.ipler_is_master();

-- Si además se desplegó la Edge Function vieja, borrarla desde una terminal
-- con la CLI de Supabase (ya no se usa):
--   supabase functions delete ipler-create-user --project-ref <ref-del-proyecto>
