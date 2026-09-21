import { Card } from './Card'
import { Skeleton } from './Skeleton'

interface Props {
  label: string
  value: string | number | null
  hint?: string
  tone?: 'default' | 'warn' | 'danger'
  loading?: boolean
}

const TONE_CLASSES: Record<NonNullable<Props['tone']>, string> = {
  default: 'text-blue-dark',
  warn: 'text-amber',
  danger: 'text-red',
}

export function StatCard({ label, value, hint, tone = 'default', loading }: Props) {
  return (
    <Card className="flex flex-col gap-1.5">
      <span className="text-[11px] font-semibold text-ink-muted uppercase tracking-wide leading-tight">{label}</span>
      {loading ? (
        <Skeleton className="h-8 w-16" />
      ) : (
        <span className={`font-mono tabular-nums text-3xl font-bold ${TONE_CLASSES[tone]}`}>
          {value === null ? '—' : value}
        </span>
      )}
      {hint && <span className="text-[11px] text-ink-faint">{hint}</span>}
    </Card>
  )
}
