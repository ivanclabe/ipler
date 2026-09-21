import { StatCard } from './ui/StatCard'
import type { DashboardStats } from '../types'

interface Props {
  stats: DashboardStats | null
  isLoading: boolean
}

export function KpiGrid({ stats, isLoading }: Props) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <StatCard label="Candidatos hoy" value={stats?.leads_hoy ?? null} loading={isLoading} />
      <StatCard label="Candidatos esta semana" value={stats?.leads_semana ?? null} loading={isLoading} />
      <StatCard
        label="Tasa de éxito (últimas 30)"
        value={stats?.tasa_exito_recientes != null ? `${stats.tasa_exito_recientes}%` : null}
        hint={stats?.tasa_exito_recientes == null && !isLoading ? 'Aún no hay corridas registradas' : undefined}
        loading={isLoading}
      />
      <StatCard
        label="Corridas fallidas (últimas 30)"
        value={stats?.fallos_recientes ?? null}
        tone={stats && stats.fallos_recientes > 0 ? 'danger' : 'default'}
        loading={isLoading}
      />
    </div>
  )
}
