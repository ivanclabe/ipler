import { useMemo } from 'react'
import { BarChart, Bar, ResponsiveContainer, XAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell } from 'recharts'
import { Card } from './ui/Card'
import { Skeleton } from './ui/Skeleton'
import type { ExecutionLogRow } from '../types'

const STATUS_COLORS = {
  SUCCESS: 'var(--color-blue)',
  SUCCESS_SIN_CANDIDATOS: 'var(--color-tan)',
  FAILED: 'var(--color-coral)',
} as const

interface Props {
  rows: ExecutionLogRow[]
  isLoading: boolean
}

export function TrendsPanel({ rows, isLoading }: Props) {
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

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_260px] gap-4">
        <Card>
          <Skeleton className="h-44 w-full" />
        </Card>
        <Card>
          <Skeleton className="h-44 w-full" />
        </Card>
      </div>
    )
  }

  if (rows.length === 0) return null

  return (
    <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_260px] gap-4">
      <Card>
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
      </Card>

      <Card className="flex flex-col">
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
      </Card>
    </div>
  )
}
