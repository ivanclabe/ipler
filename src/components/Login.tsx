import { useState, type FormEvent } from 'react'
import { LogIn, Settings2, Mail, AlertTriangle, Clock, SlidersHorizontal, Activity, ShieldCheck, ArrowLeft, Send, MailCheck } from 'lucide-react'
import { Button } from './ui/Button'
import { PasswordInput } from './ui/PasswordInput'
import type { AuthState } from '../hooks/useAuth'
import type { FriendlyError } from '../lib/errors'

interface Props {
  auth: AuthState
}

const FEATURES = [
  { icon: SlidersHorizontal, title: 'Configura el flujo sin tocar n8n', text: 'Credenciales, oferta activa y tope de candidatos en un solo lugar.' },
  { icon: Activity, title: 'Indicadores en tiempo real', text: 'Cada corrida aparece en el panel en cuanto termina.' },
  { icon: ShieldCheck, title: 'Cada cambio queda registrado', text: 'Bitácora de quién cambió qué y cuándo.' },
]

const inputClass =
  'w-full rounded-lg border border-line bg-surface py-2.5 pl-9 pr-3 text-sm text-ink placeholder:text-ink-faint focus:border-blue focus:outline-none focus:ring-2 focus:ring-blue-tint transition-colors'

function Brand({ inverted = false }: { inverted?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${inverted ? 'bg-white/15 text-white' : 'bg-blue text-white'}`}>
        <Settings2 className="h-5 w-5" />
      </div>
      <div>
        <div className={`text-sm font-bold leading-tight ${inverted ? 'text-white' : 'text-ink'}`}>Panel Ipler</div>
        <div className={`text-[11px] leading-tight ${inverted ? 'text-white/70' : 'text-ink-faint'}`}>Automatización de reclutamiento</div>
      </div>
    </div>
  )
}

function ErrorBox({ error }: { error: FriendlyError }) {
  return (
    <div role="alert" className="rounded-lg bg-red-tint px-3.5 py-3 text-xs text-red">
      <div className="flex items-start gap-2">
        <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        <span>{error.message}</span>
      </div>
      {error.raw && error.raw !== error.message && (
        <details className="mt-1.5 pl-5.5">
          <summary className="cursor-pointer text-[11px] text-red/70 hover:text-red">Ver detalle técnico</summary>
          <code className="mt-1 block break-words text-[11px] text-red/80">{error.raw}</code>
        </details>
      )}
    </div>
  )
}

function EmailField({ value, onChange, autoFocus }: { value: string; onChange: (v: string) => void; autoFocus?: boolean }) {
  return (
    <div>
      <label htmlFor="login-email" className="mb-1.5 block text-xs font-semibold text-ink">Correo</label>
      <div className="relative">
        <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
        <input
          id="login-email"
          type="text"
          inputMode="email"
          autoFocus={autoFocus}
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="nombre@empresa.com"
          className={inputClass}
        />
      </div>
    </div>
  )
}

function SignInForm({ auth, email, setEmail, onForgot }: { auth: AuthState; email: string; setEmail: (v: string) => void; onForgot: () => void }) {
  const [password, setPassword] = useState('')
  const [capsLock, setCapsLock] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const ok = await auth.signIn(email, password)
    if (!ok) setPassword('')
  }

  return (
    <>
      <h1 className="text-2xl font-bold text-ink">Iniciar sesión</h1>
      <p className="mt-1 text-sm text-ink-muted">Ingresa con tu correo y contraseña.</p>

      {auth.sessionExpired && (
        <div className="mt-6 flex items-start gap-2.5 rounded-lg bg-amber-tint px-3.5 py-3 text-xs text-amber">
          <Clock className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          Tu sesión expiró. Vuelve a ingresar para continuar.
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-8 space-y-5" noValidate>
        <EmailField value={email} onChange={setEmail} autoFocus />

        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label htmlFor="login-password" className="text-xs font-semibold text-ink">Contraseña</label>
            <button type="button" onClick={onForgot} className="text-[11px] font-semibold text-blue hover:text-blue-dark transition-colors">
              ¿Olvidaste tu contraseña?
            </button>
          </div>
          <PasswordInput
            id="login-password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onCapsLockChange={setCapsLock}
          />
          {capsLock && (
            <p className="mt-1.5 flex items-center gap-1.5 text-[11px] text-amber">
              <AlertTriangle className="h-3 w-3" /> Bloq Mayús está activado.
            </p>
          )}
        </div>

        {auth.error && <ErrorBox error={auth.error} />}

        <Button
          type="submit"
          loading={auth.signingIn}
          icon={<LogIn className="h-4 w-4" />}
          className="w-full !py-2.5"
          disabled={!email.trim() || !password}
        >
          {auth.signingIn ? 'Ingresando…' : 'Ingresar'}
        </Button>
      </form>

      <p className="mt-8 text-xs text-ink-faint">¿No tienes cuenta? Pídele acceso al administrador del panel.</p>
    </>
  )
}

function ForgotPasswordForm({ auth, email, setEmail, onBack }: { auth: AuthState; email: string; setEmail: (v: string) => void; onBack: () => void }) {
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<FriendlyError | null>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSending(true)
    const err = await auth.requestPasswordReset(email)
    setSending(false)
    if (err) setError(err)
    else setSent(true)
  }

  return (
    <>
      <button type="button" onClick={onBack} className="mb-8 inline-flex items-center gap-1.5 text-xs font-semibold text-ink-muted hover:text-ink transition-colors">
        <ArrowLeft className="h-3.5 w-3.5" /> Volver a iniciar sesión
      </button>

      {sent ? (
        <div>
          <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-blue-tint text-blue-dark">
            <MailCheck className="h-5 w-5" />
          </div>
          <h1 className="text-2xl font-bold text-ink">Revisa tu correo</h1>
          <p className="mt-2 text-sm text-ink-muted">
            Si existe una cuenta con <span className="font-semibold text-ink">{email.trim()}</span>, te llegará un enlace para crear una contraseña nueva.
            Puede tardar unos minutos; revisa también la carpeta de spam.
          </p>
        </div>
      ) : (
        <>
          <h1 className="text-2xl font-bold text-ink">Restablecer contraseña</h1>
          <p className="mt-1 text-sm text-ink-muted">Te enviaremos un enlace para crear una contraseña nueva.</p>
          <form onSubmit={handleSubmit} className="mt-8 space-y-5" noValidate>
            <EmailField value={email} onChange={setEmail} autoFocus />
            {error && <ErrorBox error={error} />}
            <Button type="submit" loading={sending} icon={<Send className="h-4 w-4" />} className="w-full !py-2.5" disabled={!email.trim()}>
              Enviar enlace
            </Button>
          </form>
        </>
      )}
    </>
  )
}

export function Login({ auth }: Props) {
  const [view, setView] = useState<'signin' | 'forgot'>('signin')
  const [email, setEmail] = useState('')

  return (
    <div className="min-h-screen bg-canvas lg:grid lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
      <aside className="hidden lg:flex flex-col justify-between bg-blue-dark px-12 py-10 text-white">
        <Brand inverted />
        <div className="max-w-md">
          <h2 className="text-3xl font-bold leading-tight">Captación de candidatos, en automático.</h2>
          <p className="mt-3 text-sm text-white/75">
            El sistema revisa Computrabajo de forma periódica, guarda los candidatos nuevos y te muestra aquí lo que está pasando.
          </p>
          <ul className="mt-10 space-y-5">
            {FEATURES.map(({ icon: Icon, title, text }) => (
              <li key={title} className="flex gap-3.5">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/10">
                  <Icon className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-sm font-semibold">{title}</div>
                  <div className="mt-0.5 text-xs text-white/65">{text}</div>
                </div>
              </li>
            ))}
          </ul>
        </div>
        <div className="text-[11px] text-white/50">Ipler · Uso interno</div>
      </aside>

      <main className="flex min-h-screen items-center justify-center px-6 py-12 lg:min-h-0">
        <div className="w-full max-w-sm">
          <div className="mb-10 lg:hidden">
            <Brand />
          </div>
          {view === 'signin' ? (
            <SignInForm auth={auth} email={email} setEmail={setEmail} onForgot={() => setView('forgot')} />
          ) : (
            <ForgotPasswordForm auth={auth} email={email} setEmail={setEmail} onBack={() => setView('signin')} />
          )}
        </div>
      </main>
    </div>
  )
}
