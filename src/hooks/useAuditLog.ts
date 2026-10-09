import { useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { toFriendlyError } from '../lib/errors'
import type { AuditLogRow } from '../types'

const LOG_LIMIT = 50
const auditLogKey = ['audit_log'] as const

async function fetchAuditLog(): Promise<AuditLogRow[]> {
  const { data, error } = await supabase
    .from('ipler_audit_log')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(LOG_LIMIT)
  if (error) throw error
  return (data ?? []) as AuditLogRow[]
}

export function useAuditLog(enabled: boolean) {
  const queryClient = useQueryClient()
  const query = useQuery({ queryKey: auditLogKey, queryFn: fetchAuditLog, enabled })

  useEffect(() => {
    if (!enabled) return
    const channel = supabase
      .channel('ipler_audit_log_changes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'ipler_audit_log' }, () => {
        queryClient.invalidateQueries({ queryKey: auditLogKey })
      })
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [enabled, queryClient])

  return {
    rows: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error ? toFriendlyError(query.error) : null,
  }
}
