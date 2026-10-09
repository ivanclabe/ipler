import { useEffect, useRef, useState } from 'react'
import { ChevronDown, KeyRound, LogOut } from 'lucide-react'

interface Props {
  email: string
  onChangePassword: () => void
  onSignOut: () => void
}

export function UserMenu({ email, onChangePassword, onSignOut }: Props) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function onPointerDown(e: PointerEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const initial = (email[0] ?? '?').toUpperCase()

  function choose(action: () => void) {
    setOpen(false)
    action()
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Menú de usuario (${email})`}
        className="flex items-center gap-2 rounded-lg py-1 pl-1 pr-2 hover:bg-surface-2 transition-colors"
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-tint text-xs font-bold text-blue-dark">{initial}</span>
        <span className="hidden max-w-[12rem] truncate text-xs font-semibold text-ink sm:inline">{email}</span>
        <ChevronDown className={`h-3.5 w-3.5 text-ink-faint transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div role="menu" className="absolute right-0 top-full z-40 mt-1.5 w-60 overflow-hidden rounded-xl border border-line bg-surface card-shadow">
          <div className="border-b border-line px-4 py-3">
            <div className="text-[11px] text-ink-faint">Sesión iniciada como</div>
            <div className="truncate text-sm font-semibold text-ink" title={email}>{email}</div>
          </div>
          <div className="py-1">
            <button
              type="button"
              role="menuitem"
              onClick={() => choose(onChangePassword)}
              className="flex w-full items-center gap-2.5 px-4 py-2 text-left text-sm text-ink hover:bg-surface-2 transition-colors"
            >
              <KeyRound className="h-4 w-4 text-ink-muted" /> Cambiar contraseña
            </button>
            <button
              type="button"
              role="menuitem"
              onClick={() => choose(onSignOut)}
              className="flex w-full items-center gap-2.5 px-4 py-2 text-left text-sm text-red hover:bg-red-tint transition-colors"
            >
              <LogOut className="h-4 w-4" /> Cerrar sesión
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
