import { Settings2 } from 'lucide-react'
import { LiveIndicator } from './ui/LiveIndicator'
import type { ConnectionState } from '../types'

interface Props {
  connectionStatus: ConnectionState
  lastUpdatedAt: Date | null
  isFetching: boolean
}

export function Header({ connectionStatus, lastUpdatedAt, isFetching }: Props) {
  return (
    <header className="bg-surface border-b border-line">
      <div className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue text-white">
            <Settings2 className="h-5 w-5" />
          </div>
          <div>
            <div className="text-sm font-bold text-ink leading-tight">Panel Ipler</div>
            <div className="text-[11px] text-ink-faint leading-tight">Automatización de reclutamiento</div>
          </div>
        </div>
        <LiveIndicator status={connectionStatus} lastUpdatedAt={lastUpdatedAt} isFetching={isFetching} />
      </div>
    </header>
  )
}
