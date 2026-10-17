/**
 * Módulo unificado de persistencia Local-First y gestión de claves de localStorage
 * Centraliza la definición de claves, reconcilia versiones (goglite_crm_leads_v3 vs v1)
 * y garantiza una limpieza exhaustiva y segura del entorno de demostración.
 */

export const STORAGE_KEYS = {
  // Navegación y estado global
  ACTIVE_MODULE: 'goglite_active_module',
  SIDEBAR_COLLAPSED: 'goglite_sidebar_collapsed',

  // Módulo 1: Prospección & Outbound
  OUTBOUND_LEADS: 'goglite_outbound_leads',

  // Módulo 2: CRM & WhatsApp
  CRM_LEADS: 'goglite_crm_leads_v3',
  CRM_LEADS_LEGACY: 'goglite_crm_leads',
  CRM_COUNTRY: 'goglite_crm_country',
  CRM_ACTIVE_TAB: 'goglite_crm_active_tab',
  CRM_SELECTED_WA_ID: 'goglite_crm_selected_wa_id',

  // Módulo 3: Presupuestos & Contratos
  PRESUPUESTOS: 'goglite_presupuestos',
  CONTRATOS: 'goglite_contratos',
  PROYECTOS: 'goglite_proyectos',

  // Módulo 4: Rentabilidad & Finanzas
  FINANZAS: 'goglite_finanzas_v1',
  LIVE_TIMER: 'goglite_live_timer_v1',

  // Módulo 5: Wireframes & StoryBrand
  WIREFRAMES: 'goglite_wireframes_v1',
  STORYBRAND: 'goglite_storybrand',

  // Módulo 6: SEO & Launch QA
  SEO_LAUNCH_QA: 'goglite_seo_launch_qa_v1',
  SEO_GEO: 'goglite_seo_geo_v1',

  // Módulo 7: Headless CMS
  CMS_SITES: 'goglite_cms_sites',
  CMS_HUB: 'goglite_cms_hub_v1',

  // Desarrollo & Tareas de Playbook
  SPRINT_TASKS: 'goglite_sprint_tasks',
  REPO_VAULT: 'goglite_repo_vault',

  // Configuración institucional (Preservada en resets)
  AGENCY_SETTINGS: 'goglite_agency_settings',
  CURRENT_USER: 'goglite_current_user'
};

/**
 * Lee un valor serializado de localStorage con fallback seguro
 */
export function getLocalItem(key, defaultValue = null) {
  if (typeof window === 'undefined') return defaultValue;
  try {
    const raw = localStorage.getItem(key);
    if (raw === null || raw === undefined) return defaultValue;
    return JSON.parse(raw);
  } catch {
    const raw = localStorage.getItem(key);
    return raw !== null ? raw : defaultValue;
  }
}

/**
 * Escribe un valor en localStorage serializado automáticamente
 */
export function setLocalItem(key, value) {
  if (typeof window === 'undefined') return false;
  try {
    const serialized = typeof value === 'string' ? value : JSON.stringify(value);
    localStorage.setItem(key, serialized);
    return true;
  } catch (e) {
    console.warn(`[LocalStore] Error guardando ${key}:`, e);
    return false;
  }
}

/**
 * Elimina una clave de localStorage
 */
export function removeLocalItem(key) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(key);
  } catch (e) {
    console.warn(`[LocalStore] Error eliminando ${key}:`, e);
  }
}

/**
 * Sincroniza dinámicamente los leads del CRM con los presupuestos emitidos en Fase 3
 */
export function syncCrmLeadsWithPresupuestos(crmLeads) {
  if (typeof window === 'undefined' || !Array.isArray(crmLeads)) return crmLeads;
  try {
    const rawP = localStorage.getItem(STORAGE_KEYS.PRESUPUESTOS);
    if (!rawP) return crmLeads;
    const presupuestos = JSON.parse(rawP);
    if (!Array.isArray(presupuestos) || presupuestos.length === 0) return crmLeads;

    return crmLeads.map(lead => {
      const lName = (lead.empresa || '').toLowerCase().trim();
      const lPhone = (lead.telefono || '').replace(/\D/g, '');

      const matchingP = presupuestos.find(p => {
        const pName = (p.cliente?.empresa || '').toLowerCase().trim();
        const pPhone = (p.cliente?.telefono || '').replace(/\D/g, '');
        return (lName && pName && (lName.includes(pName) || pName.includes(lName))) ||
               (lPhone && pPhone && (lPhone === pPhone || lPhone.endsWith(pPhone) || pPhone.endsWith(lPhone))) ||
               (p.leadId && p.leadId === lead.id) ||
               (p.cliente?.id && p.cliente.id === lead.id);
      });

      if (matchingP) {
        const monto = Number(matchingP.inversion?.precioTotal) || 0;
        return {
          ...lead,
          presupuestoId: matchingP.id,
          presupuestoCodigo: matchingP.codigo || 'P-2026',
          presupuestoMonto: monto,
          valorEstimado: monto,
          presupuestoEstado: matchingP.estado || 'borrador',
          etapa: (lead.etapa === 'nuevo' || lead.etapa === 'contactado') ? 'propuesta_enviada' : lead.etapa
        };
      }
      return lead;
    });
  } catch (e) {
    console.warn('[LocalStore] Error sincronizando CRM con presupuestos:', e);
    return crmLeads;
  }
}

/**
 * Obtiene los leads de CRM con migración transparente de goglite_crm_leads a goglite_crm_leads_v3
 * y reconciliación automática con propuestas emitidas
 */
export function getStoredCrmLeads() {
  if (typeof window === 'undefined') return [];
  try {
    let leads = [];
    const v3 = localStorage.getItem(STORAGE_KEYS.CRM_LEADS);
    if (v3) {
      const parsed = JSON.parse(v3);
      if (Array.isArray(parsed) && parsed.length > 0) leads = parsed;
    }

    if (leads.length === 0) {
      // Fallback a clave anterior y auto-migración
      const legacy = localStorage.getItem(STORAGE_KEYS.CRM_LEADS_LEGACY);
      if (legacy) {
        const parsed = JSON.parse(legacy);
        if (Array.isArray(parsed) && parsed.length > 0) {
          leads = parsed;
          setLocalItem(STORAGE_KEYS.CRM_LEADS, parsed);
        }
      }
    }

    if (leads.length > 0) {
      return syncCrmLeadsWithPresupuestos(leads);
    }
  } catch (e) {
    console.warn('[LocalStore] Error leyendo leads de CRM:', e);
  }
  return [];
}

/**
 * Guarda los leads de CRM en la clave estandarizada v3
 */
export function saveStoredCrmLeads(leads) {
  setLocalItem(STORAGE_KEYS.CRM_LEADS, leads);
  // Mantener legacy sincronizado temporalmente para componentes en transición
  setLocalItem(STORAGE_KEYS.CRM_LEADS_LEGACY, leads);
}

/**
 * Limpieza exhaustiva de todas las claves de datos transaccionales y de prueba de las Fases 1 a 7.
 * Preserva estrictamente la configuración institucional (goglite_agency_settings) y el perfil activo.
 */
export function clearAllPlatformData() {
  if (typeof window === 'undefined') return;

  const keysToDelete = [
    STORAGE_KEYS.OUTBOUND_LEADS,
    STORAGE_KEYS.CRM_LEADS,
    STORAGE_KEYS.CRM_LEADS_LEGACY,
    STORAGE_KEYS.CRM_COUNTRY,
    STORAGE_KEYS.CRM_ACTIVE_TAB,
    STORAGE_KEYS.CRM_SELECTED_WA_ID,
    STORAGE_KEYS.PRESUPUESTOS,
    STORAGE_KEYS.CONTRATOS,
    STORAGE_KEYS.PROYECTOS,
    STORAGE_KEYS.FINANZAS,
    STORAGE_KEYS.LIVE_TIMER,
    STORAGE_KEYS.WIREFRAMES,
    STORAGE_KEYS.STORYBRAND,
    STORAGE_KEYS.SEO_LAUNCH_QA,
    STORAGE_KEYS.SEO_GEO,
    STORAGE_KEYS.CMS_SITES,
    STORAGE_KEYS.CMS_HUB,
    STORAGE_KEYS.SPRINT_TASKS,
    STORAGE_KEYS.REPO_VAULT
  ];

  for (const k of keysToDelete) {
    try {
      localStorage.removeItem(k);
    } catch {}
  }

  // Devolver el módulo activo a la Fase 1
  try {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_MODULE, 'lead_scrapper');
  } catch {}
}
