import { useState, type FormEvent } from 'react'
import { Check, KeyRound, ShieldCheck, X } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { DEFAULT_PASSWORD, MIN_PASSWORD_LENGTH, passwordStrength, type PasswordStrength } from '../lib/auth'
import { Button } from './ui/Button'
import { PasswordInput } from './ui/PasswordInput'
import { Modal } from './ui/Modal'
import type { AuthState } from '../hooks/useAuth'

const STRENGTH_META: Record<Exclude<PasswordStrength, 'empty'>, { label: string; bars: number; color: string }> = {
  weak: { label: 'Débil', bars: 1, color: 'bg-red' },
  fair: { label: 'Aceptable', bars: 2, color: 'bg-amber' },
  strong: { label: 'Fuerte', bars: 3, color: 'bg-blue' },
}

function updateErrorMessage(err: { message?: string; code?: string }): string {
  if (err.code === 'same_password') return 'La nueva contraseña debe ser distinta a la actual.'
  if (err.code === 'weak_password') return `La contraseña es demasiado débil (mínimo ${MIN_PASSWORD_LENGTH} caracteres).`
  if (err.code === 'reauthentication_needed') return 'Por seguridad, cierra sesión y vuelve a ingresar antes de cambiar la contraseña.'
  return 'No se pudo cambiar la contraseña. Intenta de nuevo.'
}

interface FormProps {
  auth: AuthState
  requireCurrent: boolean
  submitLabel: string
  onSuccess: () => void
  onCancel?: () => void
}

function ChangePasswordForm({ auth, requireCurrent, submitLabel, onSuccess, onCancel }: FormProps) {
  const [current, setCurrent] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const strength = passwordStrength(password)
  const rules = [
    { ok: password.length >= MIN_PASSWORD_LENGTH, label: `Al menos ${MIN_PASSWORD_LENGTH} caracteres` },
    { ok: password.length > 0 && password !== DEFAULT_PASSWORD, label: 'Distinta a la contraseña por defecto' },
    { ok: password.length > 0 && password === confirm, label: 'Ambas contraseñas coinciden' },
  ]
  const canSubmit = rules.every((r) => r.ok) && (!requireCurrent || current.length > 0)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!canSubmit || !auth.email) return
    setError(null)
    setSaving(true)

    if (requireCurrent) {
      const { error: reauthError } = await supabase.auth.signInWithPassword({ email: auth.email, password: current })
      if (reauthError) {
        setSaving(false)
        setError('La contraseña actual no es correcta.')
        return
      }
    }

    const { error: updateError } = await supabase.auth.updateUser({ password })
    if (updateError) {
      setSaving(false)
      setError(updateErrorMessage(updateError))
      return
    }

    await supabase.rpc('ipler_log_action', { p_action: 'change_password', p_details: {} })
    setSaving(false)
    onSuccess()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      {requireCurrent && (
        <div>
          <label htmlFor="cp-current" className="mb-1.5 block text-xs font-semibold text-ink">Contraseña actual</label>
          <PasswordInput id="cp-current" autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} />
        </div>
      )}

      <div>
        <label htmlFor="cp-new" className="mb-1.5 block text-xs font-semibold text-ink">Nueva contraseña</label>
        <PasswordInput id="cp-new" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} />
        {strength !== 'empty' && (
          <div className="mt-2 flex items-center gap-2">
            <div className="flex flex-1 gap-1">
              {[1, 2, 3].map((i) => (
                <div key={i} className={`h-1 flex-1 rounded-full ${i <= STRENGTH_META[strength].bars ? STRENGTH_META[strength].color : 'bg-line'}`} />
              ))}
            </div>
            <span className="w-16 text-right text-[11px] text-ink-muted">{STRENGTH_META[strength].label}</span>
          </div>
        )}
      </div>

      <div>
        <label htmlFor="cp-confirm" className="mb-1.5 block text-xs font-semibold text-ink">Confirmar nueva contraseña</label>
        <PasswordInput id="cp-confirm" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
      </div>

      <ul className="space-y-1">
        {rules.map((r) => (
          <li key={r.label} className={`flex items-center gap-1.5 text-[11px] ${r.ok ? 'text-blue-dark' : 'text-ink-faint'}`}>
            {r.ok ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
            {r.label}
          </li>
        ))}
      </ul>

      {error && <div role="alert" className="rounded-lg bg-red-tint px-3.5 py-2.5 text-xs text-red">{error}</div>}

      <div className="flex items-center gap-2 pt-1">
        <Button type="submit" loading={saving} disabled={!canSubmit} icon={<ShieldCheck className="h-4 w-4" />} className="flex-1 !py-2.5">
          {submitLabel}
        </Button>
        {onCancel && (
          <Button type="button" variant="secondary" onClick={onCancel} disabled={saving} className="!py-2.5">
            Cancelar
          </Button>
        )}
      </div>
    </form>
  )
}

/** Se muestra al volver desde el enlace de "restablecer contraseña" del correo. */
export function RecoveryPasswordScreen({ auth }: { auth: AuthState }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas px-6 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex h-11 w-11 items-center justify-center rounded-xl bg-blue-tint text-blue-dark">
          <KeyRound className="h-5 w-5" />
        </div>
        <h1 className="text-2xl font-bold text-ink">Crea una contraseña nueva</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Para la cuenta <span className="font-semibold text-ink">{auth.email}</span>.
        </p>
        <div className="mt-8 rounded-2xl bg-surface p-6 card-shadow">
          <ChangePasswordForm auth={auth} requireCurrent={false} submitLabel="Guardar y entrar" onSuccess={auth.finishRecovery} />
        </div>
      </div>
    </div>
  )
}

/** Cambio voluntario desde el menú de usuario: pide la contraseña actual. */
export function ChangePasswordModal({ auth, open, onClose, onChanged }: { auth: AuthState; open: boolean; onClose: () => void; onChanged: () => void }) {
  return (
    <Modal open={open} onClose={onClose} title="Cambiar contraseña" description="Por seguridad, confirma tu contraseña actual.">
      <ChangePasswordForm
        auth={auth}
        requireCurrent
        submitLabel="Guardar contraseña"
        onCancel={onClose}
        onSuccess={() => {
          onChanged()
          onClose()
        }}
      />
    </Modal>
  )
}
