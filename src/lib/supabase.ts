import { createClient } from '@supabase/supabase-js'

export interface ConfigProblem {
  title: string
  detail: string
  fix: string
}

const rawUrl = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.trim()
const rawKey = (
  (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined) ??
  (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined)
)?.trim()

function projectRefFromUrl(url: string): string | null {
  try {
    const host = new URL(url).hostname
    const match = host.match(/^([a-z0-9]+)\.supabase\.co$/)
    return match ? match[1] : null
  } catch {
    return null
  }
}

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  const parts = token.split('.')
  if (parts.length !== 3) return null
  try {
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/')
    return JSON.parse(atob(base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=')))
  } catch {
    return null
  }
}

function validateConfig(url: string | undefined, key: string | undefined): ConfigProblem | null {
  if (!url) {
    return {
      title: 'Falta la URL de Supabase',
      detail: 'La variable VITE_SUPABASE_URL no está definida.',
      fix: 'Copia .env.example a .env y pon la Project URL de tu proyecto (Supabase → Project Settings → API).',
    }
  }
  try {
    const parsed = new URL(url)
    if (!/^https?:$/.test(parsed.protocol)) throw new Error('protocolo')
  } catch {
    return {
      title: 'La URL de Supabase no es válida',
      detail: `VITE_SUPABASE_URL tiene el valor "${url}", que no es una URL.`,
      fix: 'Debe tener la forma https://<ref-del-proyecto>.supabase.co',
    }
  }

  if (!key || key === 'your-anon-key-here') {
    return {
      title: 'Falta la llave pública de Supabase',
      detail: 'VITE_SUPABASE_ANON_KEY no está definida o todavía tiene el valor de ejemplo.',
      fix: 'Pon la llave "anon" (o "publishable") de tu proyecto: Supabase → Project Settings → API.',
    }
  }

  if (key.startsWith('sb_secret_')) {
    return {
      title: 'Se configuró una llave secreta en el panel',
      detail: 'La llave en VITE_SUPABASE_ANON_KEY empieza por "sb_secret_". Esa llave da acceso total a la base de datos y nunca debe estar en una aplicación web.',
      fix: 'Reemplázala por la llave "publishable" (sb_publishable_...) o la "anon". La llave secreta solo va en n8n.',
    }
  }

  if (key.startsWith('sb_publishable_')) return null

  const payload = decodeJwtPayload(key)
  if (!payload) {
    return {
      title: 'La llave de Supabase no tiene un formato válido',
      detail: 'VITE_SUPABASE_ANON_KEY no parece una llave de Supabase (debería empezar por "eyJ" o por "sb_publishable_"). Puede haber quedado cortada al copiarla.',
      fix: 'Vuelve a copiarla con el botón de copiar en Supabase → Project Settings → API.',
    }
  }

  if (payload.role === 'service_role') {
    return {
      title: 'Se configuró la llave service_role en el panel',
      detail: 'La llave en VITE_SUPABASE_ANON_KEY es la "service_role". Esa llave ignora toda la seguridad de la base de datos y quedaría visible para cualquiera que abra el panel.',
      fix: 'Reemplázala por la llave "anon" del mismo proyecto. La service_role solo va en la credencial de n8n.',
    }
  }

  const urlRef = projectRefFromUrl(url)
  const keyRef = typeof payload.ref === 'string' ? payload.ref : null
  if (urlRef && keyRef && urlRef !== keyRef) {
    return {
      title: 'La URL y la llave son de proyectos distintos',
      detail: `La URL apunta al proyecto "${urlRef}", pero la llave pertenece al proyecto "${keyRef}". Supabase va a rechazar todas las peticiones ("Invalid API key").`,
      fix: 'Copia la URL y la llave anon desde el mismo proyecto (Supabase → Project Settings → API).',
    }
  }

  return null
}

export const configProblem = validateConfig(rawUrl, rawKey)

// Con una configuración inválida se crea un cliente inerte para que los imports
// no rompan la app: App muestra la pantalla de configuración antes de usarlo.
export const supabase = createClient(
  configProblem ? 'http://localhost' : rawUrl!,
  configProblem ? 'invalid' : rawKey!,
)
