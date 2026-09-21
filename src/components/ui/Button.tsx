import type { ButtonHTMLAttributes } from 'react'
import { Loader2 } from 'lucide-react'
import { buttonClasses, type ButtonVariant } from './buttonClasses'

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  loading?: boolean
  icon?: React.ReactNode
}

export function Button({ variant = 'primary', loading, icon, className, children, disabled, ...rest }: Props) {
  return (
    <button className={buttonClasses(variant, className)} disabled={disabled || loading} {...rest}>
      {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : icon}
      {children}
    </button>
  )
}
