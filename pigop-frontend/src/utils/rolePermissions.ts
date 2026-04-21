/**
 * rolePermissions — Permisos por rol con soporte de overrides en localStorage
 * Los valores guardados en AdminPermisos sobreescriben los predeterminados.
 */

export const PERMISSION_STORAGE_KEY = 'pigop_permisos_v1'

// Permisos predeterminados: actionId → rolKey → boolean
export const PERMISSION_DEFAULTS: Record<string, Partial<Record<string, boolean>>> = {
  crear_oficio:        { superadmin: true, admin_cliente: true, secretaria: true, asesor: true, subdirector: true, jefe_depto: true, analista: true },
  eliminar:            { superadmin: true, secretaria: true },
  subir_archivo:       { superadmin: true, admin_cliente: true, secretaria: true, asesor: true, subdirector: true, jefe_depto: true, analista: true },
  ver_pdf:             { superadmin: true, admin_cliente: true, secretaria: true, asesor: true, subdirector: true, jefe_depto: true, auditor: true, analista: true },
  descargar_docx:      { superadmin: true, admin_cliente: true },
  generar_resp:        { superadmin: true, admin_cliente: true, asesor: true, subdirector: true, jefe_depto: true, analista: true },
  cargar_ref_ia:       { superadmin: true, admin_cliente: true, asesor: true, subdirector: true, jefe_depto: true, analista: true },
  editar_borrador:     { superadmin: true, admin_cliente: true, asesor: true, subdirector: true, jefe_depto: true, analista: true },
  subir_tabla:         { superadmin: true, admin_cliente: true, asesor: true, subdirector: true, jefe_depto: true, analista: true },
  turnar:              { superadmin: true, admin_cliente: true, secretaria: true, subdirector: true, jefe_depto: true },
  reasignar:           { superadmin: true, admin_cliente: true, secretaria: true, subdirector: true, jefe_depto: true },
  instrucciones_turno: { admin_cliente: true },
  cambiar_tipo:        { superadmin: true, admin_cliente: true, secretaria: true },
  enviar_firma:        { superadmin: true, secretaria: true, asesor: true, subdirector: true, jefe_depto: true, analista: true },
  devolver:            { superadmin: true, admin_cliente: true, subdirector: true },
  devolver_firma:      { superadmin: true, admin_cliente: true },
  visto_bueno:         { subdirector: true, admin_cliente: true, superadmin: true },
  subir_acuse:         { superadmin: true, secretaria: true },
  eliminar_acuse:      { superadmin: true, secretaria: true },
  registrar_cert:      { superadmin: true, admin_cliente: true },
  renovar_cert:        { superadmin: true, admin_cliente: true },
  revocar_cert:        { superadmin: true, admin_cliente: true },
  firmar:              { admin_cliente: true },
  firmar_lote:         { admin_cliente: true },
  validar_cert:        { superadmin: true, admin_cliente: true },
  // ── Nuevos permisos v2 ─────────────────────────────────────────────────────
  // Visor flotante (92vw): abrir el panel de detalle desde la tabla
  ver_visor_flotante:  { superadmin: true, admin_cliente: true, secretaria: true, asesor: true, subdirector: true, jefe_depto: true, auditor: true, analista: true },
  // Cambiar estado del trámite (En atención / Respondido / Conocimiento)
  cambiar_estado:      { superadmin: true, admin_cliente: true, secretaria: true, asesor: true, subdirector: true, jefe_depto: true, analista: true },
  // Registrar nuevo memorándum (flujo especializado)
  registrar_memo:      { superadmin: true, admin_cliente: true, secretaria: true },
}

export type PermissionOverrides = Record<string, boolean>

export function loadPermissionOverrides(): PermissionOverrides {
  try {
    const stored = localStorage.getItem(PERMISSION_STORAGE_KEY)
    return stored ? JSON.parse(stored) : {}
  } catch {
    return {}
  }
}

export const PERMISOS_UPDATED_EVENT = 'pigop:permisos-updated'

export function savePermissionOverrides(overrides: PermissionOverrides): void {
  localStorage.setItem(PERMISSION_STORAGE_KEY, JSON.stringify(overrides))
  window.dispatchEvent(new CustomEvent(PERMISOS_UPDATED_EVENT))
}

export function getPermission(
  actionId: string,
  rol: string,
  overrides?: PermissionOverrides,
): boolean {
  const resolved = overrides ?? loadPermissionOverrides()
  const key = `${actionId}.${rol}`
  if (key in resolved) return resolved[key]
  return PERMISSION_DEFAULTS[actionId]?.[rol] ?? false
}

/** Carga overrides una sola vez y devuelve una función checker para un rol fijo */
export function makePermissionChecker(rol: string): (actionId: string) => boolean {
  const overrides = loadPermissionOverrides()
  return (actionId: string) => getPermission(actionId, rol, overrides)
}
