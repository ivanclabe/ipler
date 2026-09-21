import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'

interface Props {
  icon?: LucideIcon
  title: string
  description?: string
  action?: ReactNode
}

export function EmptyState({ icon: Icon, title, description, action }: Props) {
  return (
    <div className="rounded-2xl border border-dashed border-line bg-surface-2 p-8 text-center flex flex-col items-center gap-2">
      {Icon && (
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-surface text-ink-faint mb-1">
          <Icon className="h-4 w-4" />
        </div>
      )}
      <div className="text-sm font-semibold text-ink">{title}</div>
      {description && <div className="text-xs text-ink-faint max-w-sm">{description}</div>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  )
}
