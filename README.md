# Panel Ipler

Panel de administración para el flujo de automatización de reclutamiento de Ipler (n8n + Computrabajo). Permite editar las variables de ejecución y ver cuántos candidatos se han capturado en cada corrida.

## Stack

- Vite + React + TypeScript
- Tailwind CSS v4
- Supabase (`@supabase/supabase-js`) — lectura/escritura directa vía anon key + Row Level Security
- Recharts, lucide-react, date-fns

## Cómo funciona la sincronización con n8n

Este panel **no habla directamente con n8n**. En su lugar, ambos leen/escriben la misma tabla en Supabase:

- `ipler_workflow_config` — la fila única (`id='current'`) con las variables de ejecución. El panel la edita; el workflow de n8n la lee al inicio de cada corrida (nodo "Leer Configuración desde Supabase").
- `ipler_execution_log` — un registro por corrida (candidatos procesados, omitidos, estado, mensaje). El workflow de n8n escribe ahí al terminar (nodo "Registrar Corrida en Supabase"); el panel solo lee.

Ambas tablas tienen RLS habilitado, con políticas acotadas solo a sí mismas — no dan acceso a ninguna otra tabla del proyecto de Supabase (que es compartido con otro cliente).

**La contraseña de Computrabajo también sincroniza por esta vía**: se guarda en texto plano en `ipler_workflow_config` (columna `computrabajo_password`), protegida solo por las políticas RLS de esa tabla — igual que el resto de las variables. El nodo "Configuración de Ejecución" en n8n ya no la trae como literal, la lee desde Supabase como las demás.

## Setup

```bash
npm install
cp .env.example .env   # completa VITE_SUPABASE_ANON_KEY si hace falta
npm run dev
```

## Variables de entorno

| Variable | Para qué |
|---|---|
| `VITE_SUPABASE_URL` | URL del proyecto de Supabase |
| `VITE_SUPABASE_ANON_KEY` | Anon key (segura de exponer en el cliente — la seguridad real la da RLS, no el secreto de la key) |
| `VITE_LEADS_SHEET_URL` | Link a la hoja de Google Sheets con los candidatos, para el botón "Ver hoja de candidatos" |

## Deploy

Es una SPA estática — build con `npm run build` y sirve `dist/` desde cualquier hosting estático (Vercel, Netlify, Nginx). Recuerda configurar las variables de entorno `VITE_*` en la plataforma de hosting también.
