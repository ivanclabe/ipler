import { formatDistanceToNow as fnsFormatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'

export function timeAgo(date: string | Date): string {
  return fnsFormatDistanceToNow(new Date(date), { addSuffix: true, locale: es })
}

export function formatDuration(start: string | null, end: string | null): string | null {
  if (!start || !end) return null
  const ms = new Date(end).getTime() - new Date(start).getTime()
  if (!Number.isFinite(ms) || ms < 0) return null
  const totalSeconds = Math.round(ms / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  if (minutes === 0) return `${seconds}s`
  return `${minutes}m ${seconds}s`
}
