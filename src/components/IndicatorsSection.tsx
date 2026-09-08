import { useEffect, useMemo, useState } from 'react'
import { BarChart, Bar, ResponsiveContainer, XAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell } from 'recharts'
import { ExternalLink, Loader2, CheckCircle2, XCircle, MinusCircle, RefreshCw } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import { supabase } from '../lib/supabase'
import type { ExecutionLogRow } from '../types'
import { StatusBadge } from './StatusBadge'

const SHEET_URL = import.meta.env.VITE_LEADS_SHEET_URL as string | undefined
const RUNS_LIMIT = 30

const STATUS_COLORS = {
  SUCCESS: 'var(--color-blue)',
  SUCCESS_SIN_CANDIDATOS: 'var(--color-tan)',
  FAILED: 'var(--color-coral)',
} as const

function statusMeta(status: ExecutionLogRow['status']) {
  if (status === 'SUCCESS') return { tone: 'ok' as const, label: 'Éxito', icon: CheckCircle2 }
  if (status === 'SUCCESS_SIN_CANDIDATOS') return { tone: 'neutral' as const, label: 'Sin novedades', icon: MinusCircle }
  return { tone: 'danger' as const, label: 'Falló', icon: XCircle }
}

export function IndicatorsSection() {
  const [rows, setRows] = useState<ExecutionLogRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  async function load() {
    const { data, error } = await supabase
      .from('ipler_execution_log')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(RUNS_LIMIT)
    if (error) setError(error.message)
    else setRows((data ?? []) as ExecutionLogRow[])
    setLoading(false)
  }

  useEffect(() => {
    load()
    const channel = supabase
      .channel('ipler_execution_log_changes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'ipler_execution_log' }, () => {
        load()
      })
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const stats = useMemo(() => {
    const now = Date.now()
    const dayMs = 24 * 60 * 60 * 1000
    const today = rows.filter((r) => now - new Date(r.created_at).getTime() < dayMs)
    const week = rows.filter((r) => now - new Date(r.created_at).getTime() < 7 * dayMs)
    const totalHoy = today.reduce((sum, r) => sum + r.candidatos_procesados, 0)
    const totalSemana = week.reduce((sum, r) => sum + r.candidatos_procesados, 0)
    const fallos = rows.filter((r) => r.status === 'FAILED').length
    const tasaExito = rows.length > 0 ? Math.round(((rows.length - fallos) / rows.length) * 100) : 100
    return { totalHoy, totalSemana, fallos, tasaExito, ultima: rows[0] }
  }, [rows])

  const chartData = useMemo(
    () =>
      [...rows]
        .slice(0, 14)
        .reverse()
        .map((r) => ({
          name: new Date(r.created_at).toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit' }),
          candidatos: r.candidatos_procesados,
        })),
    [rows]
  )

  const statusBreakdown = useMemo(() => {
    const counts = { SUCCESS: 0, SUCCESS_SIN_CANDIDATOS: 0, FAILED: 0 } as Record<ExecutionLogRow['status'], number>
    rows.forEach((r) => {
      counts[r.status] = (counts[r.status] ?? 0) + 1
    })
    return [
      { key: 'SUCCESS' as const, label: 'Éxito', value: counts.SUCCESS },
      { key: 'SUCCESS_SIN_CANDIDATOS' as const, label: 'Sin novedades', value: counts.SUCCESS_SIN_CANDIDATOS },
      { key: 'FAILED' as const, label: 'Falló', value: counts.FAILED },
    ].filter((d) => d.value > 0)
  }, [rows])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-base font-bold text-ink">Indicadores</h2>
          <p className="text-[11px] text-ink-faint mt-0.5">Basado en las últimas {RUNS_LIMIT} corridas registradas.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setLoading(true)
              load()
            }}
            className="inline-flex items-center gap-1.5 rounded-lg bg-surface card-shadow px-3 py-2 text-xs font-semibold text-ink-muted hover:text-ink transition-colors"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Actualizar
          </button>
          {SHEET_URL && (
            <a
              href={SHEET_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue px-3 py-2 text-xs font-semibold text-white hover:bg-blue-dark transition-colors"
            >
              Ver hoja de candidatos <ExternalLink className="h-3.5 w-3.5" />
            </a>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-ink-muted text-sm py-8 justify-center">
          <Loader2 className="h-4 w-4 animate-spin" /> Cargando indicadores…
        </div>
      ) : error ? (
        <div className="rounded-2xl bg-red-tint card-shadow p-6 text-sm text-red">
          No se pudieron cargar los indicadores: {error}
        </div>
      ) : rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line bg-surface-2 p-8 text-center text-sm text-ink-faint">
          Todavía no hay corridas registradas. En cuanto el flujo se ejecute, los resultados aparecerán aquí.
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Candidatos hoy', value: stats.totalHoy },
              { label: 'Candidatos esta semana', value: stats.totalSemana },
              { label: 'Tasa de éxito', value: `${stats.tasaExito}%` },
              { label: 'Fallos recientes', value: stats.fallos },
            ].map((s) => (
              <div key={s.label} className="rounded-2xl bg-surface card-shadow p-5 flex flex-col gap-1.5">
                <span className="text-[11px] font-semibold text-ink-muted uppercase tracking-wide leading-tight">{s.label}</span>
                <span className="font-mono tabular-nums text-3xl font-bold text-blue-dark">{s.value}</span>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_260px] gap-4">
            <div className="rounded-2xl bg-surface card-shadow p-5">
              <div className="text-xs font-bold text-ink mb-3">Candidatos capturados por corrida (últimas 14)</div>
              <div className="h-44">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-line)" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'var(--color-ink-faint)' }} axisLine={false} tickLine={false} />
                    <Tooltip
                      cursor={{ fill: 'var(--color-blue-tint)' }}
                      contentStyle={{ background: 'var(--color-surface)', border: '1px solid var(--color-line)', borderRadius: 8, fontSize: 12 }}
                    />
                    <Bar dataKey="candidatos" fill="var(--color-blue)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="rounded-2xl bg-surface card-shadow p-5 flex flex-col">
              <div className="text-xs font-bold text-ink mb-3">Estado de corridas</div>
              <div className="h-32 relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusBreakdown}
                      dataKey="value"
                      nameKey="label"
                      innerRadius={38}
                      outerRadius={56}
                      paddingAngle={statusBreakdown.length > 1 ? 3 : 0}
                      stroke="none"
                    >
                      {statusBreakdown.map((d) => (
                        <Cell key={d.key} fill={STATUS_COLORS[d.key]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ background: 'var(--color-surface)', border: '1px solid var(--color-line)', borderRadius: 8, fontSize: 12 }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="font-mono tabular-nums text-xl font-bold text-ink">{rows.length}</span>
                  <span className="text-[10px] text-ink-faint">corridas</span>
                </div>
              </div>
              <div className="space-y-1.5 mt-3">
                {statusBreakdown.map((d) => (
                  <div key={d.key} className="flex items-center justify-between text-[11px]">
                    <span className="flex items-center gap-1.5 text-ink-muted">
                      <span className="h-2 w-2 rounded-full shrink-0" style={{ background: STATUS_COLORS[d.key] }} />
                      {d.label}
                    </span>
                    <span className="font-mono font-semibold text-ink">{d.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-surface card-shadow overflow-hidden">
            <div className="border-b border-line px-5 py-3 text-xs font-bold text-ink">Corridas recientes</div>
            <div className="divide-y divide-line max-h-80 overflow-y-auto">
              {rows.map((r) => {
                const meta = statusMeta(r.status)
                const Icon = meta.icon
                return (
                  <div key={r.id} className="flex items-center justify-between gap-3 px-5 py-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <Icon className={`h-4 w-4 shrink-0 ${meta.tone === 'ok' ? 'text-blue' : meta.tone === 'danger' ? 'text-red' : 'text-ink-faint'}`} />
                      <div className="min-w-0">
                        <div className="text-sm text-ink truncate">
                          {r.status === 'FAILED' ? (r.mensaje ?? 'Error sin detalle') : `${r.candidatos_procesados} candidato(s) procesado(s)`}
                        </div>
                        <div className="text-[11px] font-mono text-ink-faint">
                          {formatDistanceToNow(new Date(r.created_at), { addSuffix: true, locale: es })}
                        </div>
                      </div>
                    </div>
                    <StatusBadge tone={meta.tone}>{meta.label}</StatusBadge>
                  </div>
                )
              })}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
