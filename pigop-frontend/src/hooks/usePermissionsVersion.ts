import { useState, useEffect } from 'react'
import { PERMISOS_UPDATED_EVENT } from '../utils/rolePermissions'

/** Incrementa cada vez que se guardan cambios de permisos en AdminPermisos */
export function usePermissionsVersion(): number {
  const [version, setVersion] = useState(0)
  useEffect(() => {
    const handler = () => setVersion(v => v + 1)
    window.addEventListener(PERMISOS_UPDATED_EVENT, handler)
    return () => window.removeEventListener(PERMISOS_UPDATED_EVENT, handler)
  }, [])
  return version
}
