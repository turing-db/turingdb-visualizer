import { useEffect, useRef, useState } from 'react'

export type Timeout = ReturnType<typeof setTimeout>

export function useDebounce<T>(value: T, delay: number): [T, boolean] {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)
  const [loading, setLoading] = useState(false)
  const timer = useRef<Timeout>()

  useEffect(() => {
    setLoading(true)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => {
      setDebouncedValue(value)
      setLoading(false)
    }, delay)

    return () => {
      clearTimeout(timer.current)
    }
  }, [value, delay])

  return [debouncedValue, loading]
}
