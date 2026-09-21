import { CheckCircle2, XCircle, MinusCircle } from 'lucide-react'
import { Card } from './ui/Card'
import { Skeleton } from './ui/Skeleton'
import { EmptyState } from './ui/EmptyState'
import { ErrorState } from './ui/ErrorState'
import { StatusBadge } from './ui/StatusBadge'
import { timeAgo, formatDuration } from '../lib/time'
import type { ExecutionLogRow } from '../types'
import type { FriendlyError } from '../lib/errors'

function statusMeta(status: ExecutionLogRow['status']) {
  if (status === 'SUCCESS') return { tone: 'ok' as const, label: 'Éxito', icon: CheckCircle2 }
  if (status === 'SUCCESS_SIN_CANDIDATOS') return { tone: 'neutral' as const, label: 'Sin novedades', icon: MinusCircle }
  return { tone: 'danger' as const, label: 'Falló', icon: XCircle }
}

interface Props {
  rows: ExecutionLogRow[]
  isLoading: boolean
  error: FriendlyError | null
}

export function ActivityFeed({ rows, isLoading, error }: Props) {
  return (
    <Card padding="none" className="overflow-hidden">
      <div className="border-b border-line px-5 py-3 text-xs font-bold text-ink">Actividad reciente</div>

      {isLoading ? (
        <div className="p-5 space-y-4">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton variant="circle" className="h-4 w-4" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-3 w-2/3" />
                <Skeleton className="h-2.5 w-1/3" />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="p-5">
          <ErrorState compact message={`No se pudo cargar la actividad: ${error.message}`} raw={error.raw} />
        </div>
      ) : rows.length === 0 ? (
        <div className="p-5">
          <EmptyState
            title="Todavía no hay actividad"
            description="En cuanto el flujo se ejecute por primera vez, las corridas aparecerán aquí."
          />
        </div>
      ) : (
        <div className="divide-y divide-line max-h-80 overflow-y-auto">
          {rows.map((r) => {
            const meta = statusMeta(r.status)
            const Icon = meta.icon
            const duration = formatDuration(r.timestamp_inicio, r.timestamp_fin)
            return (
              <div key={r.id} className="flex items-center justify-between gap-3 px-5 py-3" title={`ID de ejecución: ${r.execution_id}`}>
                <div className="flex items-center gap-3 min-w-0">
                  <Icon className={`h-4 w-4 shrink-0 ${meta.tone === 'ok' ? 'text-blue' : meta.tone === 'danger' ? 'text-red' : 'text-ink-faint'}`} />
                  <div className="min-w-0">
                    <div className="text-sm text-ink truncate">
                      {r.status === 'FAILED'
                        ? (r.mensaje ?? 'Se produjo un problema durante el procesamiento.')
                        : `${r.candidatos_procesados} candidato(s) procesado(s)${r.candidatos_omitidos > 0 ? ` · ${r.candidatos_omitidos} omitido(s)` : ''}`}
                    </div>
                    <div className="text-[11px] font-mono text-ink-faint">
                      {timeAgo(r.created_at)}
                      {duration && <> · {duration}</>}
                    </div>
                  </div>
                </div>
                <StatusBadge tone={meta.tone}>{meta.label}</StatusBadge>
              </div>
            )
          })}
        </div>
      )}
    </Card>
  )
}
