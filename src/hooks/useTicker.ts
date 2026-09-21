import { useEffect, useState } from 'react'

/** Re-renders the calling component every `intervalMs`, for text that ticks like "hace 12s". */
export function useTicker(intervalMs = 1000) {
  const [, setTick] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), intervalMs)
    return () => clearInterval(id)
  }, [intervalMs])
}
