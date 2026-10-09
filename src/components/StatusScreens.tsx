import type { ReactNode } from 'react'
import { Loader2, Settings2, Wrench } from 'lucide-react'
import type { ConfigProblem } from '../lib/supabase'

function Shell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas px-6 py-12">
      <div className="w-full max-w-md">{children}</div>
    </div>
  )
}

export function SplashScreen() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-canvas">
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue text-white">
        <Settings2 className="h-5 w-5" />
      </div>
      <Loader2 className="h-4 w-4 animate-spin text-ink-faint" aria-label="Cargando" />
    </div>
  )
}

/** Se muestra cuando el .env del panel falta o está mal — en vez de una pantalla en blanco. */
export function ConfigErrorScreen({ problem }: { problem: ConfigProblem }) {
  return (
    <Shell>
      <div className="mb-6 flex h-11 w-11 items-center justify-center rounded-xl bg-amber-tint text-amber">
        <Wrench className="h-5 w-5" />
      </div>
      <p className="text-[11px] font-bold uppercase tracking-wide text-amber">Configuración del panel</p>
      <h1 className="mt-1 text-xl font-bold text-ink">{problem.title}</h1>
      <p className="mt-3 text-sm text-ink-muted">{problem.detail}</p>
      <div className="mt-6 rounded-xl border border-line bg-surface p-4">
        <div className="text-xs font-semibold text-ink">Cómo corregirlo</div>
        <p className="mt-1 text-xs text-ink-muted">{problem.fix}</p>
        <p className="mt-3 text-[11px] text-ink-faint">
          Después de editar el archivo <code className="font-mono">.env</code>, reinicia el servidor (o vuelve a generar el build): las variables
          <code className="font-mono"> VITE_*</code> solo se leen al arrancar.
        </p>
      </div>
    </Shell>
  )
}
