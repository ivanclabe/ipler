import { ClipboardList } from 'lucide-react'
import { useAuditLog } from '../hooks/useAuditLog'
import { Card } from './ui/Card'
import { Skeleton } from './ui/Skeleton'
import { EmptyState } from './ui/EmptyState'
import { ErrorState } from './ui/ErrorState'
import { timeAgo } from '../lib/time'

const ACTION_LABELS: Record<string, string> = {
  update_config: 'Cambió la configuración',
  change_password: 'Cambió su contraseña',
  create_user: 'Creó un usuario',
}

function describe(action: string, target: string | null, details: Record<string, unknown>): string {
  const label = ACTION_LABELS[action] ?? action
  if (action === 'create_user' && target) return `${label}: ${target}`
  if (action === 'update_config') {
    const fields = Object.keys(details)
    if (fields.length > 0) return `${label} (${fields.join(', ')})`
  }
  return label
}

export function AuditLog() {
  const { rows, isLoading, error } = useAuditLog(true)

  return (
    <Card padding="none" className="overflow-hidden">
      <div className="border-b border-line px-5 py-3 text-xs font-bold text-ink">Actividad reciente (últimas {rows.length || 50})</div>

      {isLoading ? (
        <div className="p-5 space-y-4">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-8 w-full" />
          ))}
        </div>
      ) : error ? (
        <div className="p-5">
          <ErrorState compact message={`No se pudo cargar la actividad: ${error.message}`} raw={error.raw} />
        </div>
      ) : rows.length === 0 ? (
        <div className="p-5">
          <EmptyState icon={ClipboardList} title="Sin actividad todavía" description="Cada cambio de configuración o de contraseña quedará registrado aquí." />
        </div>
      ) : (
        <div className="divide-y divide-line max-h-[28rem] overflow-y-auto">
          {rows.map((r) => (
            <div key={r.id} className="flex items-center justify-between gap-3 px-5 py-3">
              <div className="min-w-0">
                <div className="text-sm text-ink truncate">{describe(r.action, r.target, r.details)}</div>
                <div className="text-[11px] font-mono text-ink-faint">{r.actor_username} · {timeAgo(r.created_at)}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}
