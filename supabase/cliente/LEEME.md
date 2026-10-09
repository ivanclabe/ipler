# Supabase del cliente — Panel Ipler

SQL listo para montar el Panel Ipler en el proyecto de Supabase propio del cliente. Todo se corre en **Supabase → SQL Editor**, en este orden:

| Archivo | Qué hace | ¿Obligatorio? |
|---|---|---|
| `01_esquema.sql` | Tablas, permisos (RLS), indicadores, auditoría y tiempo real. Se puede correr más de una vez sin perder datos. | Sí |
| `02_config_inicial.sql` | Crea la fila de configuración del flujo. **Antes de correrlo, reemplazar los valores entre `< >`.** | Sí |
| `03_verificacion.sql` | Solo lectura: todas las filas deben salir con `ok = true`. | Recomendado |
| `04_opcional_limpieza_version_anterior.sql` | Borra `ipler_users` e `ipler_is_master()`, que eran del esquema viejo. | Solo si ese proyecto tuvo la versión anterior |

`03_verificacion.sql` revisa también que haya al menos un usuario en Authentication. Por eso conviene correrlo después del paso 1 de la siguiente sección.

## Edge Functions

**No se necesita ninguna.** Antes existía `ipler-create-user`, que servía para que un usuario "master" creara usuarios desde el panel. Con el modelo actual los usuarios se administran directamente en Supabase, así que esa función ya no se usa y no hay que desplegarla.

## Después del SQL

1. **Usuarios.** Ir a Authentication → Users → Add user (correo y contraseña) o Invite user.
   - Cualquier cuenta de ese proyecto puede entrar al panel.
2. **Recuperar contraseña.**
   - En Authentication → URL Configuration, agregar la URL del panel a *Redirect URLs*.
   - En Authentication → Emails → SMTP, configurar un SMTP propio. El correo integrado de Supabase solo envía a miembros del equipo del proyecto y con un límite bajo por hora.
3. **Panel.** Crear el `.env` con estas dos variables y volver a generar el build:
   - `VITE_SUPABASE_URL`: Project Settings → API → Project URL.
   - `VITE_SUPABASE_ANON_KEY`: la llave `anon` / `publishable`. **Nunca** la `service_role`.
4. **n8n.** Ajustar los nodos "Leer Configuración desde Supabase" y "Registrar Corrida en Supabase":
   - Cambiar la URL al proyecto del cliente: `https://<ref>.supabase.co/rest/v1/...`.
   - En la credencial Header Auth (header `apikey`), poner la llave **`service_role`** del proyecto del cliente. Esa llave ignora RLS, que es lo que necesita n8n, y solo debe vivir en las credenciales de n8n.
   - Quitar cualquier header `apikey` escrito a mano dentro de los nodos.
   - Ejecutar el flujo una vez y confirmar que aparece una fila nueva en `ipler_execution_log`.

## Qué queda protegido

- Sin sesión no se puede leer ni escribir nada, ni siquiera con la llave pública.
- Con sesión se puede ver la configuración, los indicadores y la actividad, y editar la configuración.
- Cada cambio queda en `ipler_audit_log` con el correo de quien lo hizo. La contraseña de Computrabajo nunca se registra; solo se anota que cambió.
- n8n entra con la `service_role`.
