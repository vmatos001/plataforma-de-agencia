/**
 * Módulo unificado de persistencia y configuración de sesión/UI
 * Arquitectura 100% Cloud-Only (Firebase Firestore como única fuente de verdad)
 * Los datos de negocio transaccionales ya NO residen en localStorage.
 */

import { isExcludedCrmLead, isExcludedPresupuesto, isExcludedProyecto } from './firestoreSyncService';

// ============================================================================
// PURGA AUTOMÁTICA DE DATOS DE NEGOCIO LEGACY EN LOCALSTORAGE
// ============================================================================
if (typeof window !== 'undefined') {
  try {
    const legacyBusinessKeys = [
      'goglite_outbound_leads',
      'goglite_crm_leads',
      'goglite_crm_leads_v3',
      'goglite_crm_leads_v4_prod',
      'goglite_presupuestos',
      'goglite_contratos',
      'goglite_proyectos',
      'goglite_finanzas_v1',
      'goglite_live_timer_v1',
      'goglite_sprint_tasks',
      'goglite_sprint_tasks_by_project',
      'goglite_repo_vault',
      'goglite_repo_vault_by_project',
      'goglite_prd_by_project',
      'goglite_storybrand_by_project',
      'goglite_wireframes_v1',
      'goglite_facturas',
      'goglite_cms_sites',
      'goglite_cms_hub_v1',
      'goglite_seo_launch_qa_v1',
      'goglite_seo_geo_v1',
      'goglite_deleted_records_v1',
      'goglite_deleted_crm_leads_v2',
      'goglite_deleted_presupuestos_v2',
      'goglite_deleted_proyectos_v2'
    ];
    legacyBusinessKeys.forEach(k => {
      try { localStorage.removeItem(k); } catch {}
    });

    const prefixList = [
      'goglite_portal_',
      'goglite_launch_qa_',
      'goglite_gbp_',
      'goglite_sitekit_',
      'goglite_pagespeed_',
      'goglite_ga4_',
      'goglite_invoice_',
      'goglite_comprobante_',
      'goglite_lead_'
    ];
    const dynamicKeysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && prefixList.some(p => k.startsWith(p))) {
        dynamicKeysToRemove.push(k);
      }
    }
    dynamicKeysToRemove.forEach(k => {
      try { localStorage.removeItem(k); } catch {}
    });
  } catch (e) {
    console.warn('[LocalStore] Error purgando llaves legacy de negocio:', e);
  }
}

export const STORAGE_KEYS = {
  // Navegación y preferencias de UI exclusivamente
  ACTIVE_MODULE: 'goglite_active_module',
  SIDEBAR_COLLAPSED: 'goglite_sidebar_collapsed',
  CRM_ACTIVE_TAB: 'goglite_crm_active_tab',
  CRM_COUNTRY: 'goglite_crm_country',
  CRM_ARCHIVE_FILTER: 'goglite_crm_archive_filter',

  // Configuración institucional / branding
  AGENCY_SETTINGS: 'goglite_agency_settings',
  CURRENT_USER: 'goglite_current_user'
};

/**
 * Lee un valor de preferencia de UI desde localStorage con fallback seguro
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
 * Escribe un valor de preferencia de UI en localStorage
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
 * Sincroniza en memoria los leads del CRM con la lista de presupuestos activos en Firestore.
 * NO lee localStorage y NO modifica lead.archivado.
 */
export function syncCrmLeadsWithPresupuestos(crmLeads, presupuestosList = []) {
  if (!Array.isArray(crmLeads)) return crmLeads;
  try {
    const filteredLeads = crmLeads.filter(
      l => l && !isExcludedCrmLead(l.empresa || l.nombreEmpresa || l.contacto, l.id, l.leadId, l._firestoreDocId)
    );
    const normalizedLeads = filteredLeads.map(l => ({
      ...l,
      etapa: (!l.etapa || l.etapa === 'nuevo') ? 'contactado' : l.etapa
    }));

    const presupuestos = Array.isArray(presupuestosList)
      ? presupuestosList.filter(p => p && !isExcludedPresupuesto(p.cliente?.empresa || p.cliente?.nombre, p.id, p.codigo, p._firestoreDocId))
      : [];

    return normalizedLeads.map(lead => {
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

      // Si el lead tenía propuesta y la lista de propuestas en la nube ya no la contiene,
      // limpiar los campos vinculados de propuesta sin tocar el lead ni modificar lead.archivado
      if (presupuestos.length > 0 && Boolean(lead.presupuestoId || lead.presupuestoCodigo)) {
        const stillExists = presupuestos.some(p => p.id === lead.presupuestoId || p.codigo === lead.presupuestoCodigo);
        if (!stillExists) {
          const cleanedLead = { ...lead };
          cleanedLead.presupuestoId = null;
          cleanedLead.presupuestoCodigo = null;
          cleanedLead.presupuestoMonto = null;
          cleanedLead.presupuestoEstado = null;
          if (cleanedLead.portalConfig) {
            cleanedLead.portalConfig = {
              ...cleanedLead.portalConfig,
              presupuestoId: null,
              estadoPropuesta: null,
              fase1Aprobada: false
            };
          }
          return cleanedLead;
        }
      }

      return lead;
    });
  } catch (e) {
    console.warn('[LocalStore] Error sincronizando CRM con presupuestos:', e);
    return crmLeads;
  }
}

/**
 * 100% Cloud-Only: getStoredCrmLeads devuelve []
 */
export function getStoredCrmLeads() {
  return [];
}

/**
 * 100% Cloud-Only: saveStoredCrmLeads es un no-op
 */
export function saveStoredCrmLeads() {
  // No-op en arquitectura Cloud-First
}

/**
 * Limpieza de entorno y purga de claves legacy
 */
export function clearAllPlatformData() {
  if (typeof window === 'undefined') return;

  const keysToDelete = [
    'goglite_outbound_leads',
    'goglite_crm_leads',
    'goglite_crm_leads_v3',
    'goglite_crm_leads_v4_prod',
    'goglite_presupuestos',
    'goglite_contratos',
    'goglite_proyectos',
    'goglite_finanzas_v1',
    'goglite_live_timer_v1',
    'goglite_wireframes_v1',
    'goglite_storybrand',
    'goglite_seo_launch_qa_v1',
    'goglite_seo_geo_v1',
    'goglite_cms_sites',
    'goglite_cms_hub_v1',
    'goglite_sprint_tasks',
    'goglite_repo_vault'
  ];

  for (const k of keysToDelete) {
    try {
      localStorage.removeItem(k);
    } catch {}
  }

  try {
    const dynamicKeys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (
        key.startsWith('goglite_portal_') || 
        key.startsWith('goglite_invoice_') || 
        key.startsWith('goglite_comprobante_') || 
        key.startsWith('goglite_lead_') ||
        key.startsWith('goglite_gbp_') ||
        key.startsWith('goglite_sitekit_') ||
        key.startsWith('goglite_pagespeed_') ||
        key.startsWith('goglite_ga4_')
      )) {
        dynamicKeys.push(key);
      }
    }
    dynamicKeys.forEach(k => localStorage.removeItem(k));
  } catch {}

  try {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_MODULE, 'prospector');
  } catch {}
}
