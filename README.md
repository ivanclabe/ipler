# Panel Ipler

Panel de administración para el flujo de automatización de reclutamiento de Ipler (n8n + Computrabajo). Permite editar las variables de ejecución, ver cuántos candidatos se han capturado en cada corrida y revisar la bitácora de cambios.

## Stack

- Vite + React + TypeScript
- Tailwind CSS v4
- Supabase (`@supabase/supabase-js`) — Supabase Auth para la sesión, Row Level Security para los permisos, Realtime para actualizar el panel en vivo
- TanStack Query, Recharts, lucide-react, date-fns

## Acceso (Supabase Auth)

- Login con **correo y contraseña** de Supabase Auth. **Cualquier cuenta de Supabase Auth del proyecto puede entrar** — los usuarios se administran en Supabase → Authentication (Add user / Invite user), no en el panel.
  - ⚠️ Si el proyecto de Supabase es compartido con otras apps, sus cuentas también podrán entrar al panel (y leer la configuración, incluida la contraseña de Computrabajo). Usar un proyecto dedicado para Ipler.
- "¿Olvidaste tu contraseña?" envía el correo de restablecimiento de Supabase; el enlace vuelve al panel para crear la contraseña nueva. Requisitos en Supabase:
  - Authentication → URL Configuration: agregar la URL del panel a **Redirect URLs** (y en desarrollo, `http://localhost:5173`).
  - Authentication → Emails → SMTP: el correo integrado de Supabase solo envía a miembros del equipo del proyecto y con un límite bajo por hora. Para usuarios reales, configurar un SMTP propio.
- Cada usuario puede cambiar su contraseña desde el menú de usuario (pide la actual).
- Cuentas creadas con el esquema anterior (`master@ipler.local`, etc.) pueden entrar escribiendo solo el nombre (`master`).
- Cada cambio de configuración y de contraseña queda en `ipler_audit_log` (pestaña "Actividad") con el correo de quien lo hizo. La contraseña de Computrabajo nunca se registra, solo que cambió.

## Cómo se conecta con n8n

El panel **no habla con n8n**. Ambos usan las mismas tablas de Supabase:

- `ipler_workflow_config` — la fila `id='current'` con las variables de ejecución. El panel la edita; n8n la lee al inicio de cada corrida.
- `ipler_execution_log` — un registro por corrida. n8n lo escribe; el panel lo lee.

Las políticas RLS exigen sesión iniciada (`authenticated`). Por eso **n8n usa la llave `service_role`** en sus nodos HTTP de Supabase (esa llave ignora RLS y solo debe vivir en las credenciales de n8n), mientras el panel usa la llave pública (`anon` / `publishable`).

## Desarrollo local

```bash
npm install
cp .env.example .env   # completa URL y llave pública de TU proyecto
npm run dev
```

Si el `.env` falta o está mal (llave de otro proyecto, placeholder sin reemplazar, o la `service_role` pegada por error), el panel muestra una pantalla explicando qué corregir en lugar de fallar.

## Variables de entorno

| Variable | Para qué |
|---|---|
| `VITE_SUPABASE_URL` | URL del proyecto de Supabase |
| `VITE_SUPABASE_ANON_KEY` | Llave pública: `anon` (`eyJ...`) o `publishable` (`sb_publishable_...`). También se acepta como `VITE_SUPABASE_PUBLISHABLE_KEY`. **Nunca** la `service_role` |
| `VITE_LEADS_SHEET_URL` | Opcional. Respaldo del botón "Ver hoja de candidatos" cuando aún no hay corridas registradas |

## Levantar un ambiente nuevo (proyecto de Supabase propio)

Todo el SQL está en [`supabase/cliente/`](supabase/cliente/LEEME.md): correr los archivos en orden en el SQL Editor (el `LEEME.md` de esa carpeta lo detalla). No se necesitan Edge Functions.

1. **Esquema**: `01_esquema.sql` (sirve para proyecto nuevo o con la versión anterior; se puede repetir).
2. **Configuración inicial**: `02_config_inicial.sql`, reemplazando los valores entre `< >`.
3. **Usuarios**: Supabase → Authentication → Add user (con contraseña) o Invite user (por correo).
4. **Auth URLs y SMTP**: ver "Acceso" arriba.
5. **Panel**: `.env` con la URL y la llave pública de ese proyecto.
6. **n8n**: en los nodos "Leer Configuración desde Supabase" y "Registrar Corrida en Supabase", cambiar la URL al proyecto nuevo y poner su `service_role` en la credencial (header `apikey`). Quitar cualquier header `apikey` escrito a mano dentro del nodo.

## Deploy

SPA estática: `npm run build` y servir `dist/` desde cualquier hosting estático (Vercel, Netlify, Nginx). Las variables `VITE_*` se leen al momento del build: configúralas en la plataforma de hosting **antes** de construir.
