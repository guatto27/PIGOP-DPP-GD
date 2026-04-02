import { useState, useCallback, useEffect, useRef } from 'react'

const STORAGE_KEY = 'pigop-col-widths'

interface ColumnConfig {
  key: string
  minWidth?: number
  defaultWidth: number
}

export function useColumnResize(tableId: string, columns: ColumnConfig[]) {
  const [widths, setWidths] = useState<Record<string, number>>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}-${tableId}`)
      if (saved) return JSON.parse(saved)
    } catch {}
    const defaults: Record<string, number> = {}
    columns.forEach(c => { defaults[c.key] = c.defaultWidth })
    return defaults
  })

  const dragging = useRef<{ key: string; startX: number; startW: number } | null>(null)

  const onMouseDown = useCallback((key: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    dragging.current = { key, startX: e.clientX, startW: widths[key] || 100 }

    const onMouseMove = (ev: MouseEvent) => {
      if (!dragging.current) return
      const delta = ev.clientX - dragging.current.startX
      const col = columns.find(c => c.key === dragging.current!.key)
      const min = col?.minWidth ?? 50
      const newW = Math.max(min, dragging.current.startW + delta)
      setWidths(prev => ({ ...prev, [dragging.current!.key]: newW }))
    }

    const onMouseUp = () => {
      dragging.current = null
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseup', onMouseUp)
    }

    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', onMouseUp)
  }, [widths, columns])

  // Persist
  useEffect(() => {
    try { localStorage.setItem(`${STORAGE_KEY}-${tableId}`, JSON.stringify(widths)) } catch {}
  }, [widths, tableId])

  return { widths, onMouseDown }
}
