import { useTicker } from '../../hooks/useTicker'
import type { ConnectionState } from '../../types'

interface Props {
  status: ConnectionState
  lastUpdatedAt: Date | null
  isFetching?: boolean
}

const DOT_CLASSES: Record<ConnectionState, string> = {
  connected: 'bg-blue',
  reconnecting: 'bg-amber animate-[pulse-dot_1.8s_ease-in-out_infinite]',
  disconnected: 'bg-red',
}

function secondsAgoLabel(seconds: number): string {
  if (seconds < 5) return 'justo ahora'
  if (seconds < 60) return `hace ${seconds}s`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `hace ${minutes} min`
  const hours = Math.floor(minutes / 60)
  return `hace ${hours} h`
}

export function LiveIndicator({ status, lastUpdatedAt, isFetching }: Props) {
  useTicker(1000)

  const statusLabel =
    status === 'connected' ? 'Conectado' : status === 'reconnecting' ? 'Reconectando…' : 'Sin conexión'

  const updatedLabel = isFetching
    ? 'Actualizando…'
    : lastUpdatedAt
      ? `Actualizado ${secondsAgoLabel(Math.max(0, Math.round((Date.now() - lastUpdatedAt.getTime()) / 1000)))}`
      : null

  return (
    <div className="flex items-center gap-2 text-[11px] text-ink-faint" title={statusLabel}>
      <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${DOT_CLASSES[status]}`} />
      <span className={status === 'disconnected' ? 'text-red' : undefined}>
        {status === 'disconnected' ? 'Problemas de conexión. Intentando reconectar…' : updatedLabel ?? statusLabel}
      </span>
    </div>
  )
}
