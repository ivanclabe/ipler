import type { ReactNode } from 'react'

interface Props {
  label: string
  help?: string
  dirty?: boolean
  children: ReactNode
}

export function Field({ label, help, dirty, children }: Props) {
  return (
    <div>
      <div className="text-xs font-semibold text-ink flex items-center gap-1.5 mb-1.5">
        {label}
        {dirty && <span className="h-1.5 w-1.5 rounded-full bg-amber shrink-0" />}
      </div>
      {children}
      {help && <div className="text-[11px] text-ink-faint mt-1">{help}</div>}
    </div>
  )
}
