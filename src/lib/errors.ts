import type { PostgrestError } from '@supabase/supabase-js'

export interface FriendlyError {
  message: string
  raw: string
}

const GENERIC_MESSAGE = 'No se pudo completar la acción. Intenta de nuevo en unos segundos.'

const CODE_MESSAGES: Record<string, string> = {
  PGRST116: 'No se encontró la información solicitada.',
  '23505': 'Ya existe un registro con ese valor.',
  '42501': 'No tienes permiso para realizar esta acción.',
}

function isPostgrestError(error: unknown): error is PostgrestError {
  return typeof error === 'object' && error !== null && 'message' in error && 'code' in error
}

export function toFriendlyError(error: unknown): FriendlyError {
  if (isPostgrestError(error)) {
    const raw = `${error.code ? `[${error.code}] ` : ''}${error.message}`
    if (error.code && CODE_MESSAGES[error.code]) {
      return { message: CODE_MESSAGES[error.code], raw }
    }
    return { message: GENERIC_MESSAGE, raw }
  }
  if (error instanceof TypeError && /fetch/i.test(error.message)) {
    return { message: 'Problemas de conexión. Verifica tu internet e intenta de nuevo.', raw: error.message }
  }
  if (error instanceof Error) {
    return { message: GENERIC_MESSAGE, raw: error.message }
  }
  return { message: GENERIC_MESSAGE, raw: JSON.stringify(error) }
}
