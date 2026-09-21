import { CheckCircle2, XCircle, HelpCircle, Clock } from 'lucide-react'
import { Card } from './ui/Card'
import { Skeleton } from './ui/Skeleton'
import { ErrorState } from './ui/ErrorState'
import { timeAgo } from '../lib/time'
import type { DashboardStats, ExecutionLogRow } from '../types'
import type { FriendlyError } from '../lib/errors'

interface Props {
  stats: DashboardStats | null
  latestRun: ExecutionLogRow | null
  isLoading: boolean
  error: FriendlyError | null
}

const STALE_AFTER_MS = 48 * 60 * 60 * 1000 // 48h sin corridas nuevas -> "sin actividad reciente"

type Level = 'ok' | 'problem' | 'stale' | 'empty'

function levelMeta(level: Level) {
  switch (level) {
    case 'ok':
      return { icon: CheckCircle2, iconWrap: 'bg-blue-tint', text: 'text-blue-dark', label: 'Operativo' }
    case 'problem':
      return { icon: XCircle, iconWrap: 'bg-red-tint', text: 'text-red', label: 'Con problemas' }
    case 'stale':
      return { icon: Clock, iconWrap: 'bg-amber-tint', text: 'text-amber', label: 'Sin actividad reciente' }
    case 'empty':
      return { icon: HelpCircle, iconWrap: 'bg-surface-2', text: 'text-ink-muted', label: 'Sin datos todavía' }
  }
}

function outcomeText(run: ExecutionLogRow | null): string {
  if (!run) return ''
  if (run.status === 'FAILED') return 'Se produjo un problema durante el procesamiento.'
  if (run.status === 'SUCCESS_SIN_CANDIDATOS') return 'No se encontraron candidatos nuevos.'
  return `Se ${run.candidatos_procesados === 1 ? 'procesó' : 'procesaron'} ${run.candidatos_procesados} candidato(s).`
}

export function SystemStatus({ stats, latestRun, isLoading, error }: Props) {
  if (isLoading) {
    return (
      <Card className="flex items-center gap-4">
        <Skeleton variant="circle" className="h-10 w-10" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-3 w-64" />
        </div>
      </Card>
    )
  }

  if (error) {
    return <ErrorState message={`No se pudo cargar el estado del sistema: ${error.message}`} raw={error.raw} />
  }

  if (!stats || stats.total_runs === 0) {
    const meta = levelMeta('empty')
    const Icon = meta.icon
    return (
      <Card className="flex items-center gap-4">
        <div className={`flex h-10 w-10 items-center justify-center rounded-full ${meta.iconWrap} shrink-0`}>
          <Icon className={`h-5 w-5 ${meta.text}`} />
        </div>
        <div>
          <div className={`text-base font-bold ${meta.text}`}>{meta.label}</div>
          <div className="text-xs text-ink-faint mt-0.5">
            Todavía no se ha registrado ninguna ejecución. En cuanto el flujo corra por primera vez, este panel se actualizará solo.
          </div>
        </div>
      </Card>
    )
  }

  const isStale = stats.ultima_corrida_at
    ? Date.now() - new Date(stats.ultima_corrida_at).getTime() > STALE_AFTER_MS
    : true

  const level: Level = isStale ? 'stale' : stats.ultima_corrida_status === 'FAILED' ? 'problem' : 'ok'
  const meta = levelMeta(level)
  const Icon = meta.icon

  return (
    <Card className="flex items-start gap-4">
      <div className={`flex h-10 w-10 items-center justify-center rounded-full ${meta.iconWrap} shrink-0`}>
        <Icon className={`h-5 w-5 ${meta.text}`} />
      </div>
      <div className="min-w-0 flex-1">
        <div className={`text-base font-bold ${meta.text}`}>{meta.label}</div>
        <div className="text-xs text-ink-muted mt-0.5">
          {stats.ultima_corrida_at ? (
            <>Última ejecución: {timeAgo(stats.ultima_corrida_at)}. {outcomeText(latestRun)}</>
          ) : (
            'Sin ejecuciones registradas todavía.'
          )}
        </div>
        {level === 'problem' && latestRun?.mensaje && (
          <div className="text-xs text-red mt-1.5 bg-red-tint rounded-lg px-3 py-2">{latestRun.mensaje}</div>
        )}
      </div>
    </Card>
  )
}
