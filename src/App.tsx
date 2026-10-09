import { useEffect, useMemo, useRef, useState } from 'react'
import { CheckCircle2 } from 'lucide-react'
import { Header, type Tab } from './components/Header'
import { ConfigForm } from './components/ConfigForm'
import { Dashboard } from './components/Dashboard'
import { Login } from './components/Login'
import { ChangePasswordModal, RecoveryPasswordScreen } from './components/ChangePassword'
import { AuditLog } from './components/AuditLog'
import { ConfigErrorScreen, SplashScreen } from './components/StatusScreens'
import { configProblem } from './lib/supabase'
import { useAuth, type AuthState } from './hooks/useAuth'
import { useWorkflowConfig } from './hooks/useWorkflowConfig'
import { useExecutionRuns } from './hooks/useExecutionRuns'
import { useDashboardStats } from './hooks/useDashboardStats'
import { useConnectionStatus } from './hooks/useConnectionStatus'

const PAGE_TITLES: Record<Tab, { title: string; subtitle: string }> = {
  panel: { title: 'Configuración e indicadores', subtitle: 'Ajusta el flujo de captación y revisa cómo va.' },
  actividad: { title: 'Actividad', subtitle: 'Registro de cada cambio hecho desde el panel.' },
}

function Toast({ message, onDone }: { message: string; onDone: () => void }) {
  const onDoneRef = useRef(onDone)
  useEffect(() => {
    onDoneRef.current = onDone
  }, [onDone])
  useEffect(() => {
    const id = setTimeout(() => onDoneRef.current(), 3500)
    return () => clearTimeout(id)
  }, [message])
  return (
    <div role="status" className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 sm:left-auto sm:right-6 sm:translate-x-0">
      <div className="flex items-center gap-2 rounded-xl bg-ink px-4 py-3 text-sm text-white card-shadow">
        <CheckCircle2 className="h-4 w-4 text-blue-tint" />
        {message}
      </div>
    </div>
  )
}

function AuthenticatedApp({ auth }: { auth: AuthState }) {
  const [tab, setTab] = useState<Tab>('panel')
  const [passwordModalOpen, setPasswordModalOpen] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

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

  const page = PAGE_TITLES[tab]

  return (
    <div className="min-h-screen bg-canvas">
      <Header
        connectionStatus={connection.status}
        lastUpdatedAt={lastUpdatedAt}
        isFetching={runs.isFetching && !runs.isLoading}
        email={auth.email}
        activeTab={tab}
        onChangeTab={setTab}
        onChangePassword={() => setPasswordModalOpen(true)}
        onSignOut={() => auth.signOut()}
      />

      <main className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-ink">{page.title}</h1>
          <p className="mt-1 text-sm text-ink-muted">{page.subtitle}</p>
        </div>

        {tab === 'panel' && (
          <div className="grid grid-cols-1 lg:grid-cols-[340px_minmax(0,1fr)] gap-6 items-start">
            <ConfigForm state={configState} />
            <Dashboard runs={runs} dashboardStats={dashboardStats} />
          </div>
        )}
        {tab === 'actividad' && <AuditLog />}
      </main>

      <ChangePasswordModal
        auth={auth}
        open={passwordModalOpen}
        onClose={() => setPasswordModalOpen(false)}
        onChanged={() => setToast('Contraseña actualizada.')}
      />
      {toast && <Toast message={toast} onDone={() => setToast(null)} />}
    </div>
  )
}

function AuthGate() {
  const auth = useAuth()

  if (auth.loading) return <SplashScreen />
  if (auth.recoveryMode && auth.isAuthenticated) return <RecoveryPasswordScreen auth={auth} />
  if (!auth.isAuthenticated) return <Login auth={auth} />
  return <AuthenticatedApp auth={auth} />
}

function App() {
  if (configProblem) return <ConfigErrorScreen problem={configProblem} />
  return <AuthGate />
}

export default App
