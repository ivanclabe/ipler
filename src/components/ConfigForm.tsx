import { useEffect, useMemo, useState } from 'react'
import { Save, Undo2, Loader2, CheckCircle2, SlidersHorizontal, KeyRound, Eye, EyeOff, Lock } from 'lucide-react'
import { supabase } from '../lib/supabase'
import type { WorkflowConfig } from '../types'
import { StatusBadge } from './StatusBadge'

type FieldKey = 'computrabajo_email' | 'computrabajo_password' | 'oferta_oi' | 'max_candidatos'

const FIELDS: { key: FieldKey; label: string; help: string; type: 'text' | 'password' | 'range' }[] = [
  { key: 'computrabajo_email', label: 'Correo de acceso', help: 'Correo con el que el sistema inicia sesión.', type: 'text' },
  { key: 'computrabajo_password', label: 'Contraseña', help: 'Contraseña de la cuenta de Computrabajo.', type: 'password' },
  { key: 'oferta_oi', label: 'ID de la oferta', help: 'Identifica qué oferta de empleo revisa el sistema.', type: 'text' },
  { key: 'max_candidatos', label: 'Máx. candidatos por corrida', help: 'Tope de candidatos nuevos por corrida (máx. 50, para evitar timeouts).', type: 'range' },
]

const READONLY_FIELDS: { key: 'empresa_cf' | 'portal_base_url'; label: string }[] = [
  { key: 'empresa_cf', label: 'ID de la empresa' },
  { key: 'portal_base_url', label: 'URL del portal' },
]

type Draft = Record<FieldKey, string | number>

export function ConfigForm() {
  const [current, setCurrent] = useState<WorkflowConfig | null>(null)
  const [draft, setDraft] = useState<Draft | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [justSaved, setJustSaved] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  async function load() {
    const { data, error } = await supabase
      .from('ipler_workflow_config')
      .select('*')
      .eq('id', 'current')
      .maybeSingle()
    if (error) {
      setError(error.message)
    } else if (data) {
      setCurrent(data as WorkflowConfig)
      setDraft((prev) => prev ?? (data as WorkflowConfig))
      setError(null)
    }
    setLoading(false)
  }

  useEffect(() => {
    load()
    const channel = supabase
      .channel('ipler_workflow_config_changes')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'ipler_workflow_config', filter: 'id=eq.current' },
        (payload) => {
          setCurrent(payload.new as WorkflowConfig)
        }
      )
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const dirtyFields = useMemo(() => {
    if (!current || !draft) return []
    return FIELDS.filter((f) => String(current[f.key]) !== String(draft[f.key]))
  }, [current, draft])

  function setField(key: FieldKey, value: string | number) {
    setDraft((d) => (d ? { ...d, [key]: value } : d))
  }

  function discard() {
    if (current) setDraft(current)
    setShowPassword(false)
  }

  async function save() {
    if (!draft || dirtyFields.length === 0) return
    setSaving(true)
    setError(null)
    const payload: Record<string, unknown> = {}
    dirtyFields.forEach((f) => {
      payload[f.key] = f.type === 'range' ? Number(draft[f.key]) : draft[f.key]
    })
    payload.updated_at = new Date().toISOString()
    payload.updated_by = 'Panel Ipler'

    const { error } = await supabase.from('ipler_workflow_config').update(payload).eq('id', 'current')
    setSaving(false)
    if (error) {
      setError(error.message)
      return
    }
    setJustSaved(true)
    setShowPassword(false)
    setTimeout(() => setJustSaved(false), 2500)
    await load()
  }

  if (loading) {
    return (
      <div className="rounded-2xl bg-surface card-shadow p-6">
        <div className="flex items-center gap-2 text-ink-muted text-sm">
          <Loader2 className="h-4 w-4 animate-spin" />
          Cargando configuración…
        </div>
      </div>
    )
  }

  if (error && !current) {
    return (
      <div className="rounded-2xl bg-red-tint card-shadow p-6 text-sm text-red">
        No se pudo cargar la configuración: {error}
      </div>
    )
  }

  if (!current || !draft) return null

  const accessFields = FIELDS.filter((f) => f.key === 'computrabajo_email' || f.key === 'computrabajo_password')
  const otherFields = FIELDS.filter((f) => f.key !== 'computrabajo_email' && f.key !== 'computrabajo_password')

  return (
    <div className="rounded-2xl bg-surface card-shadow overflow-hidden lg:sticky lg:top-6">
      <div className="flex items-start justify-between gap-3 px-5 pt-5 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-tint text-blue-dark shrink-0">
            <SlidersHorizontal className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-base font-bold text-ink leading-tight">Configuración</h2>
            <p className="text-[11px] text-ink-faint mt-0.5">
              {new Date(current.updated_at).toLocaleString('es-CO', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        </div>
      </div>

      <div className="px-5 pb-2">
        {dirtyFields.length > 0 ? (
          <StatusBadge tone="warn">
            <span className="h-1.5 w-1.5 rounded-full bg-amber animate-[pulse-dot_1.8s_ease-in-out_infinite]" />
            {dirtyFields.length} sin guardar
          </StatusBadge>
        ) : justSaved ? (
          <StatusBadge tone="ok">
            <CheckCircle2 className="h-3.5 w-3.5" /> Guardado
          </StatusBadge>
        ) : (
          <StatusBadge tone="ok">Sincronizado</StatusBadge>
        )}
      </div>

      <div className="px-5 pb-1 pt-2">
        <div className="rounded-xl border border-line bg-surface-2 p-3.5">
          <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-ink-muted mb-3">
            <KeyRound className="h-3 w-3" /> Acceso a Computrabajo
          </div>
          <div className="space-y-3">
            {accessFields.map((f) => {
              const isDirty = String(current[f.key]) !== String(draft[f.key])
              return (
                <div key={f.key}>
                  <div className="text-xs font-semibold text-ink flex items-center gap-1.5 mb-1.5">
                    {f.label}
                    {isDirty && <span className="h-1.5 w-1.5 rounded-full bg-amber shrink-0" />}
                  </div>
                  <div className="relative">
                    <input
                      type={f.type === 'password' && !showPassword ? 'password' : 'text'}
                      value={String(draft[f.key])}
                      onChange={(e) => setField(f.key, e.target.value)}
                      className={`w-full rounded-lg border px-3 py-2 text-sm text-ink bg-surface focus:outline-none focus:border-blue transition-colors ${
                        f.type === 'password' ? 'pr-9' : ''
                      } ${isDirty ? 'border-amber bg-amber-tint' : 'border-line'}`}
                    />
                    {f.type === 'password' && (
                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-ink-faint hover:text-ink-muted transition-colors"
                        aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                      >
                        {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                      </button>
                    )}
                  </div>
                  <div className="text-[11px] text-ink-faint mt-1">{f.help}</div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <div className="divide-y divide-line px-5">
        {otherFields.map((f) => {
          const isDirty = String(current[f.key]) !== String(draft[f.key])
          return (
            <div key={f.key} className="py-3.5">
              <div className="text-xs font-semibold text-ink flex items-center gap-1.5 mb-1.5">
                {f.label}
                {isDirty && <span className="h-1.5 w-1.5 rounded-full bg-amber shrink-0" />}
              </div>
              {f.type === 'range' ? (
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min={1}
                    max={50}
                    value={Number(draft[f.key])}
                    onChange={(e) => setField(f.key, Number(e.target.value))}
                    className="flex-1 accent-blue"
                  />
                  <span className="font-mono tabular-nums text-blue-dark font-bold text-sm min-w-[3ch] text-right">
                    {draft[f.key]}
                  </span>
                </div>
              ) : (
                <input
                  type="text"
                  value={String(draft[f.key])}
                  onChange={(e) => setField(f.key, e.target.value)}
                  className={`w-full rounded-lg border px-3 py-2 text-sm text-ink bg-surface-2 focus:outline-none focus:border-blue focus:bg-surface transition-colors ${
                    isDirty ? 'border-amber bg-amber-tint' : 'border-line'
                  }`}
                />
              )}
              <div className="text-[11px] text-ink-faint mt-1">{f.help}</div>
            </div>
          )
        })}

        <div className="py-3.5">
          <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-ink-muted mb-2">
            <Lock className="h-3 w-3" /> Solo lectura
          </div>
          <div className="space-y-2.5">
            {READONLY_FIELDS.map((f) => (
              <div key={f.key} className="flex items-center justify-between gap-3 rounded-lg bg-surface-2 px-3 py-2">
                <span className="text-xs text-ink-muted shrink-0">{f.label}</span>
                <span className="text-xs font-mono text-ink truncate text-right" title={String(current[f.key])}>
                  {String(current[f.key])}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {error && (
        <div className="mx-5 mb-4 rounded-lg bg-red-tint px-4 py-2.5 text-xs text-red">{error}</div>
      )}

      {dirtyFields.length > 0 && (
        <div className="flex items-center gap-2 border-t border-line bg-surface-2 px-5 py-4">
          <button
            onClick={save}
            disabled={saving}
            className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg bg-blue px-4 py-2 text-sm font-semibold text-white hover:bg-blue-dark transition-colors disabled:opacity-60"
          >
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            Guardar
          </button>
          <button
            onClick={discard}
            disabled={saving}
            className="inline-flex items-center gap-1.5 rounded-lg border border-line px-3 py-2 text-sm font-semibold text-ink-muted hover:bg-surface hover:text-ink transition-colors disabled:opacity-50"
          >
            <Undo2 className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </div>
  )
}
