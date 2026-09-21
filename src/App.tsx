import { useMemo } from 'react'
import { Header } from './components/Header'
import { ConfigForm } from './components/ConfigForm'
import { Dashboard } from './components/Dashboard'
import { useWorkflowConfig } from './hooks/useWorkflowConfig'
import { useExecutionRuns } from './hooks/useExecutionRuns'
import { useDashboardStats } from './hooks/useDashboardStats'
import { useConnectionStatus } from './hooks/useConnectionStatus'

function App() {
  const configState = useWorkflowConfig()
  const runs = useExecutionRuns()
  const dashboardStats = useDashboardStats()
  const connection = useConnectionStatus()

  const lastUpdatedAt = useMemo(() => {
    const timestamps = [configState.dataUpdatedAt, runs.dataUpdatedAt, dashboardStats.dataUpdatedAt].filter(
      (t): t is number => Boolean(t)
    )
    if (timestamps.length === 0) return null
    return new Date(Math.max(...timestamps))
  }, [configState.dataUpdatedAt, runs.dataUpdatedAt, dashboardStats.dataUpdatedAt])

  return (
    <div className="min-h-screen bg-canvas">
      <Header
        connectionStatus={connection.status}
        lastUpdatedAt={lastUpdatedAt}
        isFetching={runs.isFetching && !runs.isLoading}
      />

      <main className="mx-auto max-w-7xl px-6 py-8">
        <h1 className="text-2xl text-ink mb-6">
          <span className="font-normal">Configuración</span>{' '}
          <span className="font-bold">&amp; Indicadores</span>
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-[340px_minmax(0,1fr)] gap-6 items-start">
          <ConfigForm state={configState} />
          <Dashboard runs={runs} dashboardStats={dashboardStats} />
        </div>
      </main>
    </div>
  )
}

export default App
