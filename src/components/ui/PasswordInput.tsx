import { useState, type InputHTMLAttributes, type KeyboardEvent } from 'react'
import { Eye, EyeOff, Lock } from 'lucide-react'

interface Props extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  onCapsLockChange?: (on: boolean) => void
}

export function PasswordInput({ onCapsLockChange, className = '', onKeyUp, onKeyDown, ...rest }: Props) {
  const [visible, setVisible] = useState(false)

  function reportCapsLock(e: KeyboardEvent<HTMLInputElement>) {
    onCapsLockChange?.(e.getModifierState('CapsLock'))
  }

  return (
    <div className="relative">
      <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
      <input
        {...rest}
        type={visible ? 'text' : 'password'}
        onKeyUp={(e) => {
          reportCapsLock(e)
          onKeyUp?.(e)
        }}
        onKeyDown={(e) => {
          reportCapsLock(e)
          onKeyDown?.(e)
        }}
        className={`w-full rounded-lg border border-line bg-surface py-2.5 pl-9 pr-10 text-sm text-ink placeholder:text-ink-faint focus:border-blue focus:outline-none focus:ring-2 focus:ring-blue-tint transition-colors ${className}`}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-ink-faint hover:text-ink-muted transition-colors"
        aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
        tabIndex={-1}
      >
        {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  )
}
