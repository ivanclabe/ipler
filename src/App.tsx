import { Settings2 } from 'lucide-react'
import { ConfigForm } from './components/ConfigForm'
import { IndicatorsSection } from './components/IndicatorsSection'

function App() {
  return (
    <div className="min-h-screen bg-canvas">
      <header className="bg-surface border-b border-line">
        <div className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue text-white">
              <Settings2 className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-ink leading-tight">Panel Ipler</div>
              <div className="text-[11px] text-ink-faint leading-tight">Automatización de reclutamiento</div>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8">
        <h1 className="text-2xl text-ink mb-6">
          <span className="font-normal">Configuración</span>{' '}
          <span className="font-bold">&amp; Indicadores</span>
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-[340px_minmax(0,1fr)] gap-6 items-start">
          <ConfigForm />
          <IndicatorsSection />
        </div>
      </main>
    </div>
  )
}

export default App
