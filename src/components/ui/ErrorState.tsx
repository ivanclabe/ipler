import { AlertTriangle } from 'lucide-react'
import { Button } from './Button'

interface Props {
  message: string
  raw?: string
  onRetry?: () => void
  compact?: boolean
}

export function ErrorState({ message, raw, onRetry, compact }: Props) {
  return (
    <div className={`rounded-2xl bg-red-tint ${compact ? 'px-4 py-3' : 'p-6'} text-sm text-red`}>
      <div className="flex items-start gap-2">
        <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <div>{message}</div>
          {raw && (
            <details className="mt-1.5">
              <summary className="text-[11px] cursor-pointer text-red/70 hover:text-red">Ver detalles técnicos</summary>
              <pre className="mt-1 whitespace-pre-wrap break-words text-[11px] font-mono text-red/80">{raw}</pre>
            </details>
          )}
          {onRetry && (
            <div className="mt-2">
              <Button variant="secondary" onClick={onRetry} className="!text-red !border-red/30 !bg-transparent">
                Reintentar
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
