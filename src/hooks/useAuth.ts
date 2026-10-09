import { useEffect, useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import { isPlausibleEmail, toLoginEmail } from '../lib/auth'
import type { FriendlyError } from '../lib/errors'

interface AuthErrorLike {
  message?: string
  code?: string
  status?: number
}

/** Traduce errores de Supabase Auth a algo accionable — no todo es "contraseña incorrecta". */
export function authErrorMessage(err: AuthErrorLike): string {
  const message = (err.message ?? '').toLowerCase()
  if (err.code === 'invalid_credentials' || message.includes('invalid login credentials')) {
    return 'Correo o contraseña incorrectos.'
  }
  if (message.includes('invalid api key') || message.includes('no api key')) {
    return 'La aplicación no está bien configurada: Supabase rechazó la llave del proyecto. Revisa VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY.'
  }
  if (err.status === 429 || err.code === 'over_request_rate_limit' || err.code === 'over_email_send_rate_limit') {
    return 'Demasiados intentos seguidos. Espera unos minutos antes de volver a intentar.'
  }
  if (err.code === 'email_not_confirmed') {
    return 'Esta cuenta todavía no confirmó su correo. Revisa la bandeja de entrada (o pide que la confirmen desde Supabase).'
  }
  if (err.code === 'user_banned') {
    return 'Esta cuenta está deshabilitada.'
  }
  if (err.status === 0 || message.includes('failed to fetch') || message.includes('network')) {
    return 'No se pudo conectar con el servidor. Revisa tu conexión a internet.'
  }
  return 'No se pudo completar la acción. Intenta de nuevo en unos segundos.'
}

export function useAuth() {
  const queryClient = useQueryClient()
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<FriendlyError | null>(null)
  const [signingIn, setSigningIn] = useState(false)
  const [sessionExpired, setSessionExpired] = useState(false)
  const [recoveryMode, setRecoveryMode] = useState(false)
  const signingOutRef = useRef(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    })
    // Solo se actualiza estado aquí: Supabase recomienda no llamar a otras APIs
    // dentro de este callback (puede bloquear el refresco de la sesión).
    const { data: listener } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (event === 'PASSWORD_RECOVERY') setRecoveryMode(true)
      if (event === 'SIGNED_OUT') {
        if (!signingOutRef.current) setSessionExpired(true)
        signingOutRef.current = false
        setRecoveryMode(false)
        queryClient.clear()
      }
      setSession(nextSession)
      setLoading(false)
    })
    return () => listener.subscription.unsubscribe()
  }, [queryClient])

  async function signIn(identifier: string, password: string) {
    setError(null)
    setSessionExpired(false)
    const email = toLoginEmail(identifier)
    if (!isPlausibleEmail(email)) {
      setError({ message: 'Escribe un correo válido (ej. nombre@empresa.com).', raw: '' })
      return false
    }
    setSigningIn(true)
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
    setSigningIn(false)
    if (signInError) {
      setError({ message: authErrorMessage(signInError), raw: signInError.message })
      return false
    }
    return true
  }

  /** Envía el correo de "restablecer contraseña". El enlace vuelve a esta misma app. */
  async function requestPasswordReset(identifier: string): Promise<FriendlyError | null> {
    const email = toLoginEmail(identifier)
    if (!isPlausibleEmail(email)) {
      return { message: 'Escribe un correo válido (ej. nombre@empresa.com).', raw: '' }
    }
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin,
    })
    if (resetError) return { message: authErrorMessage(resetError), raw: resetError.message }
    return null
  }

  async function signOut() {
    signingOutRef.current = true
    await supabase.auth.signOut()
  }

  return {
    session,
    email: session?.user.email ?? '',
    isAuthenticated: !!session,
    loading,
    signingIn,
    sessionExpired,
    recoveryMode,
    finishRecovery: () => setRecoveryMode(false),
    error,
    signIn,
    signOut,
    requestPasswordReset,
  }
}

export type AuthState = ReturnType<typeof useAuth>
