import { Settings2, LayoutDashboard, ClipboardList } from 'lucide-react'
import { LiveIndicator } from './ui/LiveIndicator'
import { UserMenu } from './UserMenu'
import type { ConnectionState } from '../types'

export type Tab = 'panel' | 'actividad'

interface Props {
  connectionStatus: ConnectionState
  lastUpdatedAt: Date | null
  isFetching: boolean
  email: string
  activeTab: Tab
  onChangeTab: (tab: Tab) => void
  onChangePassword: () => void
  onSignOut: () => void
}

const TABS: { key: Tab; label: string; icon: typeof LayoutDashboard }[] = [
  { key: 'panel', label: 'Configuración e indicadores', icon: LayoutDashboard },
  { key: 'actividad', label: 'Actividad', icon: ClipboardList },
]

export function Header({ connectionStatus, lastUpdatedAt, isFetching, email, activeTab, onChangeTab, onChangePassword, onSignOut }: Props) {
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-surface/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-6 py-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue text-white">
            <Settings2 className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <div className="truncate text-sm font-bold leading-tight text-ink">Panel Ipler</div>
            <div className="hidden truncate text-[11px] leading-tight text-ink-faint sm:block">Automatización de reclutamiento</div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden md:block">
            <LiveIndicator status={connectionStatus} lastUpdatedAt={lastUpdatedAt} isFetching={isFetching} />
          </div>
          <UserMenu email={email} onChangePassword={onChangePassword} onSignOut={onSignOut} />
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 pb-2.5 md:hidden">
        <LiveIndicator status={connectionStatus} lastUpdatedAt={lastUpdatedAt} isFetching={isFetching} />
      </div>

      <nav className="mx-auto flex max-w-7xl items-center gap-1 overflow-x-auto px-6" aria-label="Secciones">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            type="button"
            onClick={() => onChangeTab(key)}
            aria-current={activeTab === key ? 'page' : undefined}
            className={`inline-flex shrink-0 items-center gap-1.5 border-b-2 px-3 py-2.5 text-xs font-semibold transition-colors ${
              activeTab === key ? 'border-blue text-blue-dark' : 'border-transparent text-ink-muted hover:text-ink'
            }`}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
          </button>
        ))}
      </nav>
    </header>
  )
}
