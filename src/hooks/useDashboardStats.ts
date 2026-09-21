import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { toFriendlyError } from '../lib/errors'
import type { DashboardStats } from '../types'

export const dashboardStatsKey = ['dashboard_stats'] as const

async function fetchDashboardStats(): Promise<DashboardStats> {
  const { data, error } = await supabase.rpc('ipler_dashboard_stats').single()
  if (error) throw error
  return data as DashboardStats
}

/**
 * No own realtime channel: useExecutionRuns already invalidates this query key
 * on every INSERT into ipler_execution_log, so a second channel here would just
 * duplicate the subscription for the same table/event.
 */
export function useDashboardStats() {
  const query = useQuery({
    queryKey: dashboardStatsKey,
    queryFn: fetchDashboardStats,
  })

  return {
    stats: query.data ?? null,
    isLoading: query.isLoading,
    error: query.error ? toFriendlyError(query.error) : null,
    dataUpdatedAt: query.dataUpdatedAt,
  }
}
