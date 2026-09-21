import { useEffect, useMemo, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { toFriendlyError, type FriendlyError } from '../lib/errors'
import type { WorkflowConfig } from '../types'

export type ConfigFieldKey = 'computrabajo_email' | 'computrabajo_password' | 'oferta_oi' | 'max_candidatos'

export type ConfigDraft = Record<ConfigFieldKey, string | number>

const configKey = ['workflow_config'] as const

function toDraft(config: WorkflowConfig): ConfigDraft {
  return {
    computrabajo_email: config.computrabajo_email,
    computrabajo_password: config.computrabajo_password,
    oferta_oi: config.oferta_oi,
    max_candidatos: config.max_candidatos,
  }
}

async function fetchConfig(): Promise<WorkflowConfig | null> {
  const { data, error } = await supabase
    .from('ipler_workflow_config')
    .select('*')
    .eq('id', 'current')
    .maybeSingle()
  if (error) throw error
  return data as WorkflowConfig | null
}

export function useWorkflowConfig() {
  const queryClient = useQueryClient()
  const query = useQuery({ queryKey: configKey, queryFn: fetchConfig })
  const config = query.data ?? null

  const [draft, setDraft] = useState<ConfigDraft | null>(null)
  const [dirtyKeys, setDirtyKeys] = useState<Set<ConfigFieldKey>>(new Set())
  const [conflictKeys, setConflictKeys] = useState<Set<ConfigFieldKey>>(new Set())
  const [justSaved, setJustSaved] = useState(false)
  // Last server snapshot the draft was rebased against — needed to tell "the
  // server actually changed this field since I started editing" apart from
  // "my draft differs from the server", which is simply what dirty means.
  const lastSyncedConfigRef = useRef<WorkflowConfig | null>(null)

  // Rebase the draft whenever the server row changes: fields the admin isn't
  // currently editing pick up the new value; fields with unsaved local edits
  // are left alone but flagged as a conflict instead of silently overwritten.
  useEffect(() => {
    if (!config) return
    const previousServerConfig = lastSyncedConfigRef.current
    lastSyncedConfigRef.current = config
    setDraft((prev) => {
      if (!prev) return toDraft(config)
      const next = { ...prev }
      const newConflicts = new Set<ConfigFieldKey>()
      ;(Object.keys(next) as ConfigFieldKey[]).forEach((key) => {
        if (dirtyKeys.has(key)) {
          const serverChanged = previousServerConfig ? String(config[key]) !== String(previousServerConfig[key]) : false
          if (serverChanged) newConflicts.add(key)
        } else {
          next[key] = config[key] as string | number
        }
      })
      setConflictKeys(newConflicts)
      return next
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config])

  useEffect(() => {
    const channel = supabase
      .channel('ipler_workflow_config_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'ipler_workflow_config', filter: 'id=eq.current' },
        () => {
          queryClient.invalidateQueries({ queryKey: configKey })
        }
      )
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [queryClient])

  const dirtyFields = useMemo(() => Array.from(dirtyKeys), [dirtyKeys])

  function setField(key: ConfigFieldKey, value: string | number) {
    setDraft((d) => (d ? { ...d, [key]: value } : d))
    setDirtyKeys((prev) => new Set(prev).add(key))
    setConflictKeys((prev) => {
      if (!prev.has(key)) return prev
      const next = new Set(prev)
      next.delete(key)
      return next
    })
  }

  function discard() {
    if (config) setDraft(toDraft(config))
    setDirtyKeys(new Set())
    setConflictKeys(new Set())
  }

  const mutation = useMutation({
    mutationFn: async (payload: Partial<Record<ConfigFieldKey, string | number>>) => {
      const body: Record<string, unknown> = { ...payload }
      body.updated_at = new Date().toISOString()
      body.updated_by = 'Panel Ipler'
      const { error } = await supabase.from('ipler_workflow_config').update(body).eq('id', 'current')
      if (error) throw error
    },
    onSuccess: () => {
      setDirtyKeys(new Set())
      setConflictKeys(new Set())
      setJustSaved(true)
      setTimeout(() => setJustSaved(false), 2500)
      queryClient.invalidateQueries({ queryKey: configKey })
    },
  })

  async function save() {
    if (!draft || dirtyFields.length === 0) return
    const payload: Partial<Record<ConfigFieldKey, string | number>> = {}
    dirtyFields.forEach((key) => {
      payload[key] = key === 'max_candidatos' ? Number(draft[key]) : draft[key]
    })
    await mutation.mutateAsync(payload)
  }

  const error: FriendlyError | null = query.error
    ? toFriendlyError(query.error)
    : mutation.error
      ? toFriendlyError(mutation.error)
      : null

  return {
    config,
    draft,
    dirtyKeys,
    dirtyFields,
    conflictKeys,
    setField,
    discard,
    save,
    saving: mutation.isPending,
    justSaved,
    isLoading: query.isLoading,
    error,
    hasNoConfig: !query.isLoading && !query.error && !config,
    dataUpdatedAt: query.dataUpdatedAt,
  }
}
