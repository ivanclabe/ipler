-- ============================================================
-- Panel Ipler — 02: configuración inicial del flujo
--
-- Reemplazar los valores entre < > y correr en el SQL Editor.
-- Si la fila ya existe no la toca (para cambiarla después, usar el panel).
-- ============================================================

insert into public.ipler_workflow_config
  (id, computrabajo_email, computrabajo_password, oferta_oi, empresa_cf, portal_base_url, max_candidatos)
values (
  'current',
  '<correo de la cuenta de Computrabajo>',
  '<contraseña de Computrabajo>',
  '<id de la oferta (oi)>',
  '<id de la empresa (cf)>',
  '<url base del portal de Computrabajo>',
  30
)
on conflict (id) do nothing;
