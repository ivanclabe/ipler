export interface WorkflowConfig {
  id: string
  computrabajo_email: string
  computrabajo_password: string
  oferta_oi: string
  empresa_cf: string
  portal_base_url: string
  max_candidatos: number
  updated_at: string
  updated_by: string | null
}

export type RunStatus = 'SUCCESS' | 'SUCCESS_SIN_CANDIDATOS' | 'FAILED'

export interface ExecutionLogRow {
  id: number
  execution_id: string
  status: RunStatus
  candidatos_procesados: number
  candidatos_omitidos: number
  mensaje: string | null
  spreadsheet_id: string | null
  timestamp_inicio: string | null
  timestamp_fin: string | null
  created_at: string
}

export interface DashboardStats {
  leads_hoy: number
  leads_semana: number
  runs_hoy: number
  runs_recientes: number
  fallos_recientes: number
  tasa_exito_recientes: number | null
  ultima_corrida_at: string | null
  ultima_corrida_status: RunStatus | null
  total_runs: number
}

export type ConnectionState = 'connected' | 'reconnecting' | 'disconnected'
