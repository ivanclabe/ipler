import { Save, Undo2, CheckCircle2, SlidersHorizontal, KeyRound, Eye, EyeOff, Lock, AlertTriangle } from 'lucide-react'
import { useState } from 'react'
import { Card } from './ui/Card'
import { Skeleton } from './ui/Skeleton'
import { EmptyState } from './ui/EmptyState'
import { ErrorState } from './ui/ErrorState'
import { StatusBadge } from './ui/StatusBadge'
import { Field } from './ui/Field'
import { Button } from './ui/Button'
import { timeAgo } from '../lib/time'
import type { useWorkflowConfig, ConfigFieldKey } from '../hooks/useWorkflowConfig'

interface Props {
  state: ReturnType<typeof useWorkflowConfig>
}

export function ConfigForm({ state }: Props) {
  const [showPassword, setShowPassword] = useState(false)
  const {
    config,
    draft,
    dirtyKeys,
    conflictKeys,
    setField,
    discard,
    save,
    saving,
    justSaved,
    isLoading,
    error,
    hasNoConfig,
  } = state

  if (isLoading) {
    return (
      <Card className="space-y-4 lg:sticky lg:top-6">
        <div className="flex items-center gap-2.5">
          <Skeleton variant="circle" className="h-8 w-8" />
          <Skeleton className="h-4 w-32" />
        </div>
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-32 w-full" />
      </Card>
    )
  }

  if (error && !config) {
    return (
      <Card className="lg:sticky lg:top-6">
        <ErrorState message={`No se pudo cargar la configuración: ${error.message}`} raw={error.raw} />
      </Card>
    )
  }

  if (hasNoConfig || !config || !draft) {
    return (
      <Card className="lg:sticky lg:top-6">
        <EmptyState
          title="Sin configuración todavía"
          description="Esta pantalla se completará automáticamente cuando se registre la configuración inicial del flujo."
        />
      </Card>
    )
  }

  function fieldProps(key: ConfigFieldKey) {
    return { dirty: dirtyKeys.has(key) }
  }

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
              {new Date(config.updated_at).toLocaleString('es-CO', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        </div>
      </div>

      <div className="px-5 pb-2">
        {dirtyKeys.size > 0 ? (
          <StatusBadge tone="warn">
            <span className="h-1.5 w-1.5 rounded-full bg-amber animate-[pulse-dot_1.8s_ease-in-out_infinite]" />
            {dirtyKeys.size} sin guardar
          </StatusBadge>
        ) : justSaved ? (
          <StatusBadge tone="ok">
            <CheckCircle2 className="h-3.5 w-3.5" /> Guardado
          </StatusBadge>
        ) : (
          <StatusBadge tone="ok">Sincronizado</StatusBadge>
        )}
      </div>

      {/* Grupo 1: Conexión a Computrabajo */}
      <div className="px-5 pb-1 pt-2">
        <div className="rounded-xl border border-line bg-surface-2 p-3.5">
          <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-ink-muted mb-3" title="Credenciales que el sistema usa para iniciar sesión en Computrabajo automáticamente.">
            <KeyRound className="h-3 w-3" /> Conexión a Computrabajo
          </div>
          <div className="space-y-3">
            <Field label="Correo de acceso" help="Correo con el que el sistema inicia sesión." {...fieldProps('computrabajo_email')}>
              <input
                type="text"
                value={String(draft.computrabajo_email)}
                onChange={(e) => setField('computrabajo_email', e.target.value)}
                className={`w-full rounded-lg border px-3 py-2 text-sm text-ink bg-surface focus:outline-none focus:border-blue transition-colors ${
                  dirtyKeys.has('computrabajo_email') ? 'border-amber bg-amber-tint' : 'border-line'
                }`}
              />
            </Field>
            <div>
              <div className="text-xs font-semibold text-ink flex items-center gap-1.5 mb-1.5">
                Contraseña
                {dirtyKeys.has('computrabajo_password') && <span className="h-1.5 w-1.5 rounded-full bg-amber shrink-0" />}
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={String(draft.computrabajo_password)}
                  onChange={(e) => setField('computrabajo_password', e.target.value)}
                  className={`w-full rounded-lg border px-3 py-2 pr-9 text-sm text-ink bg-surface focus:outline-none focus:border-blue transition-colors ${
                    dirtyKeys.has('computrabajo_password') ? 'border-amber bg-amber-tint' : 'border-line'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-ink-faint hover:text-ink-muted transition-colors"
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </button>
              </div>
              <div className="text-[11px] text-ink-faint mt-1">Contraseña de la cuenta de Computrabajo.</div>
            </div>
            {conflictKeys.size > 0 && (
              <div className="flex items-start gap-1.5 rounded-lg bg-amber-tint px-3 py-2 text-[11px] text-amber">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                Uno de estos campos cambió del lado del servidor mientras lo editabas. Tu cambio sin guardar se conserva; guarda para sobrescribirlo o descarta para tomar el valor nuevo.
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="divide-y divide-line px-5">
        {/* Grupo 2: Automatización */}
        <div className="py-3.5">
          <div className="text-[11px] font-bold uppercase tracking-wide text-ink-muted mb-2.5">Automatización</div>
          <div className="space-y-3.5">
            <Field label="ID de la oferta" help="Identifica qué oferta de empleo revisa el sistema." {...fieldProps('oferta_oi')}>
              <input
                type="text"
                value={String(draft.oferta_oi)}
                onChange={(e) => setField('oferta_oi', e.target.value)}
                className={`w-full rounded-lg border px-3 py-2 text-sm text-ink bg-surface-2 focus:outline-none focus:border-blue focus:bg-surface transition-colors ${
                  dirtyKeys.has('oferta_oi') ? 'border-amber bg-amber-tint' : 'border-line'
                }`}
              />
              {String(draft.oferta_oi).trim() === '' && (
                <div className="text-[11px] text-red mt-1">El ID de la oferta no puede quedar vacío.</div>
              )}
            </Field>
            <Field label="Máx. candidatos por corrida" help="Tope de candidatos nuevos por corrida (máx. 50, para evitar timeouts)." {...fieldProps('max_candidatos')}>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min={1}
                  max={50}
                  value={Number(draft.max_candidatos)}
                  onChange={(e) => setField('max_candidatos', Number(e.target.value))}
                  className="flex-1 accent-blue"
                />
                <span className="font-mono tabular-nums text-blue-dark font-bold text-sm min-w-[3ch] text-right">
                  {draft.max_candidatos}
                </span>
              </div>
            </Field>
          </div>
        </div>

        {/* Grupo 3: Sistema */}
        <div className="py-3.5">
          <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-ink-muted mb-2">
            <Lock className="h-3 w-3" /> Sistema
          </div>
          <div className="space-y-2.5">
            <div className="flex items-center justify-between gap-3 rounded-lg bg-surface-2 px-3 py-2">
              <span className="text-xs text-ink-muted shrink-0">ID de la empresa</span>
              <span className="text-xs font-mono text-ink truncate text-right" title={config.empresa_cf}>
                {config.empresa_cf}
              </span>
            </div>
            <div className="flex items-center justify-between gap-3 rounded-lg bg-surface-2 px-3 py-2">
              <span className="text-xs text-ink-muted shrink-0">URL del portal</span>
              <span className="text-xs font-mono text-ink truncate text-right" title={config.portal_base_url}>
                {config.portal_base_url}
              </span>
            </div>
            <div className="flex items-center justify-between gap-3 rounded-lg bg-surface-2 px-3 py-2">
              <span className="text-xs text-ink-muted shrink-0">Última modificación</span>
              <span className="text-xs text-ink truncate text-right">
                {config.updated_by ?? 'Desconocido'}, {timeAgo(config.updated_at)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="mx-5 mb-4">
          <ErrorState compact message={error.message} raw={error.raw} />
        </div>
      )}

      {dirtyKeys.size > 0 && (
        <div className="flex items-center gap-2 border-t border-line bg-surface-2 px-5 py-4">
          <Button onClick={save} loading={saving} icon={<Save className="h-3.5 w-3.5" />} className="flex-1">
            Guardar
          </Button>
          <Button variant="secondary" onClick={discard} disabled={saving} aria-label="Descartar cambios">
            <Undo2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}
    </div>
  )
}
