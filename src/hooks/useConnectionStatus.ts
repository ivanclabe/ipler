import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { ConnectionState } from '../types'

/**
 * Tracks the health of the realtime channels the app already opens
 * (config + execution log, via useWorkflowConfig/useExecutionRuns) by
 * polling Supabase's own channel state — no extra channel is created here,
 * this just observes the shared client's already-open channels.
 */
export function useConnectionStatus(): { status: ConnectionState; lastUpdatedAt: Date | null } {
  const [status, setStatus] = useState<ConnectionState>('connected')
  const [lastUpdatedAt, setLastUpdatedAt] = useState<Date | null>(null)

  useEffect(() => {
    function check() {
      const channels = supabase.getChannels()
      if (channels.length === 0) {
        setStatus('connected')
        return
      }
      const states = channels.map((c) => c.state)
      let next: ConnectionState = 'connected'
      if (states.some((s) => s === 'errored' || s === 'closed')) {
        next = 'disconnected'
      } else if (states.some((s) => s === 'joining' || s === 'leaving')) {
        next = 'reconnecting'
      }
      setStatus(next)
      if (next === 'connected') setLastUpdatedAt(new Date())
    }

    check()
    const interval = setInterval(check, 2000)
    return () => clearInterval(interval)
  }, [])

  return { status, lastUpdatedAt }
}
