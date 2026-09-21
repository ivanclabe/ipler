import { useMemo } from 'react'
import { ExternalLink, RefreshCw } from 'lucide-react'
import { SystemStatus } from './SystemStatus'
import { KpiGrid } from './KpiGrid'
import { TrendsPanel } from './TrendsPanel'
import { ActivityFeed } from './ActivityFeed'
import { Button } from './ui/Button'
import { RUNS_LIMIT, type useExecutionRuns } from '../hooks/useExecutionRuns'
import type { useDashboardStats } from '../hooks/useDashboardStats'

const FALLBACK_SHEET_URL = import.meta.env.VITE_LEADS_SHEET_URL as string | undefined

interface Props {
  runs: ReturnType<typeof useExecutionRuns>
  dashboardStats: ReturnType<typeof useDashboardStats>
}

export function Dashboard({ runs, dashboardStats }: Props) {
  // Copied from the previous IndicatorsSection implementation as-is: the
  // "Ver hoja de candidatos" link must always resolve to the spreadsheet of
  // the most recent run that has one, since that's what the flow is actually
  // writing to right now — never a static/stale URL.
  const sheetUrl = useMemo(() => {
    const currentSheetId = runs.rows.find((r) => r.spreadsheet_id)?.spreadsheet_id
    return currentSheetId
      ? `https://docs.google.com/spreadsheets/d/${currentSheetId}/edit`
      : FALLBACK_SHEET_URL
  }, [runs.rows])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-base font-bold text-ink">Indicadores</h2>
          <p className="text-[11px] text-ink-faint mt-0.5">Basado en las últimas {RUNS_LIMIT} corridas registradas.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" onClick={() => runs.refetch()} loading={runs.isFetching && !runs.isLoading} icon={<RefreshCw className="h-3.5 w-3.5" />}>
            Actualizar
          </Button>
          {sheetUrl && (
            <a
              href={sheetUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue px-3.5 py-2 text-sm font-semibold text-white hover:bg-blue-dark transition-colors"
            >
              Ver hoja de candidatos <ExternalLink className="h-3.5 w-3.5" />
            </a>
          )}
        </div>
      </div>

      <SystemStatus
        stats={dashboardStats.stats}
        latestRun={runs.rows[0] ?? null}
        isLoading={dashboardStats.isLoading}
        error={dashboardStats.error}
      />

      <KpiGrid stats={dashboardStats.stats} isLoading={dashboardStats.isLoading} />

      <TrendsPanel rows={runs.rows} isLoading={runs.isLoading} />

      <ActivityFeed rows={runs.rows} isLoading={runs.isLoading} error={runs.error} />
    </div>
  )
}
