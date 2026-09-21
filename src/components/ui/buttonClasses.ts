export type ButtonVariant = 'primary' | 'secondary' | 'ghost'

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary: 'bg-blue text-white hover:bg-blue-dark',
  secondary: 'border border-line text-ink-muted hover:bg-surface hover:text-ink bg-surface',
  ghost: 'bg-surface card-shadow text-ink-muted hover:text-ink',
}

export function buttonClasses(variant: ButtonVariant = 'primary', className = '') {
  return `inline-flex items-center justify-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-semibold transition-colors disabled:opacity-60 disabled:pointer-events-none ${VARIANT_CLASSES[variant]} ${className}`
}
