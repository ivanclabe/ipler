import { useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { toFriendlyError } from '../lib/errors'
import type { ExecutionLogRow } from '../types'

export const RUNS_LIMIT = 30
export const executionRunsKey = ['execution_runs'] as const

async function fetchExecutionRuns(): Promise<ExecutionLogRow[]> {
  const { data, error } = await supabase
    .from('ipler_execution_log')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(RUNS_LIMIT)
  if (error) throw error
  return (data ?? []) as ExecutionLogRow[]
}

export function useExecutionRuns() {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: executionRunsKey,
    queryFn: fetchExecutionRuns,
  })

  useEffect(() => {
    const channel = supabase
      .channel('ipler_execution_log_changes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'ipler_execution_log' }, () => {
        queryClient.invalidateQueries({ queryKey: executionRunsKey })
        queryClient.invalidateQueries({ queryKey: ['dashboard_stats'] })
      })
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [queryClient])

  return {
    rows: query.data ?? [],
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error ? toFriendlyError(query.error) : null,
    dataUpdatedAt: query.dataUpdatedAt,
    refetch: query.refetch,
  }
}
