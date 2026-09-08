interface Props {
  tone: 'ok' | 'warn' | 'danger' | 'neutral'
  children: React.ReactNode
}

const toneClasses: Record<Props['tone'], string> = {
  ok: 'bg-blue-tint text-blue-dark',
  warn: 'bg-amber-tint text-amber',
  danger: 'bg-red-tint text-red',
  neutral: 'bg-surface-2 text-ink-muted border border-line',
}

export function StatusBadge({ tone, children }: Props) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold whitespace-nowrap ${toneClasses[tone]}`}
    >
      {children}
    </span>
  )
}
