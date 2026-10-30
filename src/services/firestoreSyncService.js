/**
 * Servicio Maestro de Persistencia en la Nube con Firebase Firestore
 * Centraliza la lectura, escritura y suscripción en tiempo real para:
 * - Portales de Cliente (/portales/{token})
 * - Proyectos y Contratos SOW (/proyectos/{id})
 * - Presupuestos y Cotizaciones (/presupuestos/{id})
 * - CRM Leads (/crm_leads/{id})
 * - Sprint Tasks (/sprint_tasks/{id})
 * 
 * Multiplataforma: Sincroniza PC, iPhone, Android y tabletas instantáneamente.
 */

import { db, storage, ensureAuth } from './firebase';
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  deleteDoc, 
  onSnapshot, 
  query, 
  where 
} from 'firebase/firestore';
import { ref, uploadString, getDownloadURL } from 'firebase/storage';

/**
 * Sanitizador recursivo para Firestore: elimina propiedades 'undefined' y convierte a tipos válidos
 */
function sanitizeForFirestore(obj) {
  if (obj === null || obj === undefined) return null;
  if (typeof obj !== 'object') return obj;
  if (obj instanceof Date) return obj.toISOString();
  if (Array.isArray(obj)) {
    return obj.map(sanitizeForFirestore).filter(x => x !== undefined);
  }
  const clean = {};
  for (const [key, val] of Object.entries(obj)) {
    if (val !== undefined && typeof val !== 'function') {
      clean[key] = sanitizeForFirestore(val);
    }
  }
  return clean;
}

// Purgar clave legacy compartida (v1) que acoplaba erróneamente leads, propuestas y contratos
if (typeof window !== 'undefined') {
  try {
    localStorage.removeItem('goglite_deleted_records_v1');
  } catch {}
}

// Sets en memoria para exclusión defensiva de registros eliminados (sin usar localStorage)
const deletedCrmLeadsMemory = new Set();
const deletedPresupuestosMemory = new Set(PERMANENTLY_EXCLUDED_PRESUPUESTO_IDS);
const deletedProyectosMemory = new Set(PERMANENTLY_EXCLUDED_PROYECTO_IDS);

export function getDeletedCrmLeadsSet() {
  return new Set(deletedCrmLeadsMemory);
}

export function markCrmLeadDeleted(...leadIds) {
  for (const k of leadIds) {
    if (k && typeof k === 'string') {
      const clean = k.toLowerCase().trim();
      if (clean) deletedCrmLeadsMemory.add(clean);
    }
  }
  return new Set(deletedCrmLeadsMemory);
}

export function getDeletedPresupuestosSet() {
  return new Set(deletedPresupuestosMemory);
}

export function markPresupuestoDeleted(...presupuestoIds) {
  for (const k of presupuestoIds) {
    if (k && typeof k === 'string') {
      const clean = k.toLowerCase().trim();
      if (clean) deletedPresupuestosMemory.add(clean);
    }
  }
  return new Set(deletedPresupuestosMemory);
}

export function getDeletedProyectosSet() {
  return new Set(deletedProyectosMemory);
}

export function markProyectoDeleted(...proyectoIds) {
  for (const k of proyectoIds) {
    if (k && typeof k === 'string') {
      const clean = k.toLowerCase().trim();
      if (clean) deletedProyectosMemory.add(clean);
    }
  }
  return new Set(deletedProyectosMemory);
}

function isBannedDemoCompany(empresaOrName) {
  if (!empresaOrName) return false;
  const norm = String(empresaOrName).toLowerCase().trim();
  if (!norm) return false;
  return PERMANENTLY_EXCLUDED_COMPANIES.some(banned => norm.includes(banned));
}

/**
 * Evalúa exclusivamente si un Lead del CRM fue eliminado (independiente de Propuestas y Contratos)
 */
export function isExcludedCrmLead(empresaOrName, ...leadIds) {
  if (isBannedDemoCompany(empresaOrName)) return true;
  const deletedSet = getDeletedCrmLeadsSet();
  for (const rawKey of leadIds) {
    if (!rawKey) continue;
    const normKey = String(rawKey).toLowerCase().trim();
    if (normKey && deletedSet.has(normKey)) return true;
  }
  return false;
}

/**
 * Evalúa exclusivamente si una Propuesta/Presupuesto fue eliminada (nunca elimina ni afecta al Lead)
 */
export function isExcludedPresupuesto(empresaOrName, ...presupuestoIds) {
  if (isBannedDemoCompany(empresaOrName)) return true;
  const deletedSet = getDeletedPresupuestosSet();
  for (const rawKey of presupuestoIds) {
    if (!rawKey) continue;
    const normKey = String(rawKey).toLowerCase().trim();
    if (normKey && deletedSet.has(normKey)) return true;
  }
  return false;
}

/**
 * Evalúa exclusivamente si un Proyecto/Contrato SOW fue eliminado (nunca elimina al Lead ni a la Propuesta)
 */
export function isExcludedProyecto(empresaOrName, ...proyectoIds) {
  if (isBannedDemoCompany(empresaOrName)) return true;
  const deletedSet = getDeletedProyectosSet();
  for (const rawKey of proyectoIds) {
    if (!rawKey) continue;
    const normKey = String(rawKey).toLowerCase().trim();
    if (normKey && deletedSet.has(normKey)) return true;
  }
  return false;
}

// Alias de compatibilidad para código existente (sin mezclar nombres de empresas ni colecciones)
export const getDeletedRecordsSet = getDeletedProyectosSet;
export const markRecordDeleted = markProyectoDeleted;
export const isExcludedTestRecord = isExcludedProyecto;

// ============================================================================
// 1. PORTALES DE CLIENTES (/portales/{token})
// ============================================================================

/**
 * Obtiene el documento completo de un portal desde Firestore,
 * reconciliando automáticamente con proyectos, presupuestos y crm_leads en la nube.
 */
export async function getPortalCloud(token) {
  if (!token) return null;
  try {
    await ensureAuth();
    const cleanToken = String(token).trim();
    const portalRef = doc(db, 'portales', cleanToken);
    const snap = await getDoc(portalRef);
    let portalData = snap.exists() ? snap.data() : null;

    // Si falta proyecto, presupuesto o lead, buscar en las colecciones maestras de Firestore
    if (!portalData || !portalData.proyecto || !portalData.presupuesto || !portalData.lead) {
      const [cloudProjs, cloudProps, cloudLeads] = await Promise.all([
        getProyectosCloud().catch(() => []),
        getPresupuestosCloud().catch(() => []),
        getCrmLeadsCloud().catch(() => [])
      ]);

      const matchToken = (item) => {
        if (!item) return false;
        return (
          item.portalToken === cleanToken ||
          item.id === cleanToken ||
          item.leadId === cleanToken ||
          item.codigo === cleanToken ||
          (item.id && cleanToken.includes(item.id)) ||
          (item.leadId && cleanToken.includes(item.leadId))
        );
      };

      const matchedLead = portalData?.lead || cloudLeads.find(matchToken) || null;
      const targetEmp = (matchedLead?.empresa || portalData?.proyecto?.cliente?.empresa || portalData?.presupuesto?.cliente?.empresa || '').toLowerCase().trim();

      const matchedProp = portalData?.presupuesto || cloudProps.find(p =>
        matchToken(p) || (targetEmp && p.cliente?.empresa && p.cliente.empresa.toLowerCase().trim() === targetEmp)
      ) || null;

      const matchedProj = portalData?.proyecto || cloudProjs.find(p =>
        matchToken(p) ||
        (matchedProp?.id && p.presupuestoId === matchedProp.id) ||
        (targetEmp && p.cliente?.empresa && p.cliente.empresa.toLowerCase().trim() === targetEmp)
      ) || null;

      if (matchedLead || matchedProp || matchedProj) {
        const mergedConfig = {
          ...(matchedLead?.portalConfig || {}),
          ...(matchedProj?.portalConfig || {}),
          ...(portalData?.portalConfig || {})
        };
        portalData = {
          ...(portalData || {}),
          token: cleanToken,
          lead: matchedLead || (matchedProj?.cliente ? {
            id: matchedProj.leadId || matchedProj.id,
            empresa: matchedProj.cliente.empresa,
            contacto: matchedProj.cliente.nombre,
            telefono: matchedProj.cliente.telefono,
            email: matchedProj.cliente.email,
            pais: matchedProj.pais || 'SV',
            portalToken: cleanToken
          } : (matchedProp?.cliente ? {
            id: matchedProp.leadId || matchedProp.id,
            empresa: matchedProp.cliente.empresa,
            contacto: matchedProp.cliente.nombre,
            telefono: matchedProp.cliente.telefono,
            email: matchedProp.cliente.email,
            pais: matchedProp.pais || 'SV',
            presupuestoMonto: Number(matchedProp.inversion?.precioTotal) || 0,
            presupuestoCodigo: matchedProp.codigo,
            portalToken: cleanToken
          } : null)),
          presupuesto: matchedProp,
          proyecto: matchedProj,
          portalConfig: mergedConfig
        };
      }
    }

    return portalData;
  } catch (err) {
    console.warn('[FirestoreSync] Error leyendo portal:', token, err);
  }
  return null;
}

/**
 * Guarda o actualiza el portal de un cliente en Firestore
 */
export async function savePortalCloud(token, portalData) {
  if (!token || !portalData) return null;
  try {
    await ensureAuth();
    const cleanToken = String(token).trim();
    const portalRef = doc(db, 'portales', cleanToken);
    const payload = sanitizeForFirestore({
      token: cleanToken,
      lead: portalData.lead || null,
      presupuesto: portalData.presupuesto || null,
      proyecto: portalData.proyecto || null,
      portalConfig: portalData.portalConfig || {},
      workflowData: portalData.workflowData || null,
      updatedAt: new Date().toISOString()
    });
    await setDoc(portalRef, payload, { merge: true });
    return payload;
  } catch (err) {
    console.warn('[FirestoreSync] Error guardando portal en Firestore:', token, err);
    return null;
  }
}

/**
 * Suscripción en tiempo real a cambios en el portal del cliente
 */
export function subscribePortalCloud(token, onUpdate) {
  if (!token || typeof onUpdate !== 'function') return () => {};
  try {
    const cleanToken = String(token).trim();
    const portalRef = doc(db, 'portales', cleanToken);
    return onSnapshot(portalRef, (snap) => {
      if (snap.exists()) {
        onUpdate(snap.data());
      }
    }, (err) => {
      console.warn('[FirestoreSync] Error en listener de portal:', err);
    });
  } catch (e) {
    console.warn('[FirestoreSync] No se pudo inicializar listener de portal:', e);
    return () => {};
  }
}

// ============================================================================
// 2. PROYECTOS Y CONTRATOS (/proyectos/{id})
// ============================================================================

/**
 * Obtiene todos los proyectos activos desde Firestore
 */
export async function getProyectosCloud() {
  try {
    await ensureAuth();
    const snap = await getDocs(collection(db, 'proyectos'));
    const list = [];
    snap.forEach(docSnap => {
      if (docSnap.exists()) {
        const data = docSnap.data() || {};
        const item = { ...data, id: data.id || docSnap.id, _firestoreDocId: docSnap.id };
        if (isExcludedProyecto(item.cliente?.empresa || item.cliente?.nombre, item.id, item.codigo, item.presupuestoId, item.presupuestoCodigo, docSnap.id)) {
          deleteDoc(docSnap.ref).catch(() => {});
          return;
        }
        list.push(item);
      }
    });
    return list;
  } catch (err) {
    console.warn('[FirestoreSync] Error obteniendo proyectos:', err);
    return [];
  }
}

/**
 * Guarda o actualiza un proyecto en Firestore
 */
export async function saveProyectoCloud(proyecto) {
  if (!proyecto || !proyecto.id) return null;
  if (isExcludedProyecto(proyecto.cliente?.empresa || proyecto.cliente?.nombre, proyecto.id, proyecto.codigo, proyecto.presupuestoId, proyecto.presupuestoCodigo)) return null;
  try {
    await ensureAuth();
    const docId = String(proyecto.id).trim();
    const projRef = doc(db, 'proyectos', docId);
    const { _firestoreDocId, ...restProyecto } = proyecto;
    const payload = sanitizeForFirestore({
      ...restProyecto,
      id: docId,
      updatedAt: new Date().toISOString()
    });
    await setDoc(projRef, payload, { merge: true });

    // Sincronizar también el portal asociado si existe token
    const portalToken = proyecto.portalToken || proyecto.leadId || (proyecto.cliente?.empresa ? `portal-${docId}` : null);
    if (portalToken) {
      savePortalCloud(portalToken, {
        token: portalToken,
        lead: proyecto.cliente ? {
          id: proyecto.leadId || docId,
          empresa: proyecto.cliente.empresa,
          contacto: proyecto.cliente.nombre,
          telefono: proyecto.cliente.telefono,
          email: proyecto.cliente.email,
          pais: proyecto.cliente.pais || 'SV',
          portalToken
        } : null,
        proyecto: payload,
        portalConfig: proyecto.portalConfig || {}
      }).catch(() => {});
    }

    return payload;
  } catch (err) {
    console.warn('[FirestoreSync] Error guardando proyecto:', proyecto.id, err);
    return null;
  }
}

/**
 * Elimina un proyecto de Firestore y lo registra en la lista de exclusión de proyectos (sin afectar Leads ni Propuestas)
 */
export async function deleteProyectoCloud(proyectoId, extraKeys = []) {
  if (!proyectoId && (!extraKeys || extraKeys.length === 0)) return false;
  markProyectoDeleted(proyectoId, ...(Array.isArray(extraKeys) ? extraKeys : [extraKeys]));
  try {
    await ensureAuth();
    const candidates = new Set([proyectoId, ...(Array.isArray(extraKeys) ? extraKeys : [])].filter(Boolean).map(x => String(x).trim()));
    for (const cId of candidates) {
      await deleteDoc(doc(db, 'proyectos', cId)).catch(() => {});
    }
    const snap = await getDocs(collection(db, 'proyectos')).catch(() => null);
    if (snap) {
      const deletions = [];
      snap.forEach(docSnap => {
        const d = docSnap.data() || {};
        if (
          candidates.has(docSnap.id) ||
          (d.id && candidates.has(String(d.id).trim())) ||
          (d.codigo && candidates.has(String(d.codigo).trim())) ||
          isExcludedProyecto(d.cliente?.empresa || d.cliente?.nombre, d.id, d.codigo, docSnap.id)
        ) {
          deletions.push(deleteDoc(docSnap.ref).catch(() => {}));
        }
      });
      await Promise.all(deletions);
    }

    // Desacoplamiento estricto: Desvincular proyectoId en crm_leads en Firestore sin eliminar el Lead ni la Propuesta
    const leadsSnap = await getDocs(collection(db, 'crm_leads')).catch(() => null);
    if (leadsSnap) {
      const leadUpdates = [];
      leadsSnap.forEach(lSnap => {
        if (lSnap.exists()) {
          const lData = lSnap.data() || {};
          const hasMatchingProj = (lData.proyectoId && candidates.has(String(lData.proyectoId).trim())) ||
                                  (lData.portalConfig?.proyectoId && candidates.has(String(lData.portalConfig.proyectoId).trim()));
          if (hasMatchingProj) {
            const nextEtapa = lData.etapa === 'cerrado_ganado' ? 'ganado' : lData.etapa;
            leadUpdates.push(
              setDoc(lSnap.ref, {
                proyectoId: null,
                etapa: nextEtapa,
                portalConfig: {
                  ...(lData.portalConfig || {}),
                  proyectoId: null
                },
                updatedAt: new Date().toISOString()
              }, { merge: true }).catch(() => {})
            );
          }
        }
      });
      await Promise.all(leadUpdates);
    }

    return true;
  } catch (err) {
    console.warn('[FirestoreSync] Error eliminando proyecto de Firestore:', proyectoId, err);
    return false;
  }
}

/**
 * Suscripción en tiempo real a la colección de proyectos
 */
export function subscribeProyectosCloud(onUpdate) {
  if (typeof onUpdate !== 'function') return () => {};
  try {
    return onSnapshot(collection(db, 'proyectos'), (snap) => {
      const list = [];
      snap.forEach(docSnap => {
        if (docSnap.exists()) {
          const data = docSnap.data() || {};
          const item = { ...data, id: data.id || docSnap.id, _firestoreDocId: docSnap.id };
          if (isExcludedProyecto(item.cliente?.empresa || item.cliente?.nombre, item.id, item.codigo, item.presupuestoId, item.presupuestoCodigo, docSnap.id)) {
            deleteDoc(docSnap.ref).catch(() => {});
            return;
          }
          list.push(item);
        }
      });
      onUpdate(list);
    }, (err) => {
      console.warn('[FirestoreSync] Error en listener de proyectos:', err);
    });
  } catch (e) {
    console.warn('[FirestoreSync] No se pudo conectar listener de proyectos:', e);
    return () => {};
  }
}

// ============================================================================
// 3. CRM LEADS (/crm_leads/{id})
// ============================================================================

/**
 * Obtiene los leads comerciales desde Firestore
 */
export async function getCrmLeadsCloud() {
  try {
    await ensureAuth();
    const snap = await getDocs(collection(db, 'crm_leads'));
    const list = [];
    snap.forEach(docSnap => {
      if (docSnap.exists()) {
        const data = docSnap.data() || {};
        const item = { ...data, id: data.id || docSnap.id, _firestoreDocId: docSnap.id };
        if (isExcludedCrmLead(item.empresa || item.nombreEmpresa || item.contacto, item.id, item.leadId, docSnap.id)) {
          deleteDoc(docSnap.ref).catch(() => {});
          return;
        }
        list.push(item);
      }
    });
    return list;
  } catch (err) {
    console.warn('[FirestoreSync] Error obteniendo crm_leads:', err);
    return [];
  }
}

/**
 * Guarda o actualiza un lead en Firestore
 */
export async function saveCrmLeadCloud(lead) {
  if (!lead || !lead.id) return null;
  if (isExcludedCrmLead(lead.empresa || lead.nombreEmpresa || lead.contacto, lead.id, lead.leadId)) return null;
  try {
    await ensureAuth();
    const docId = String(lead.id).trim();
    const leadRef = doc(db, 'crm_leads', docId);
    const { _firestoreDocId, ...restLead } = lead;
    const payload = sanitizeForFirestore({
      ...restLead,
      id: docId,
      updatedAt: new Date().toISOString()
    });
    await setDoc(leadRef, payload, { merge: true });
    if (lead.portalToken) {
      savePortalCloud(lead.portalToken, {
        token: lead.portalToken,
        lead: payload,
        portalConfig: lead.portalConfig || {}
      }).catch(() => {});
    }
    return payload;
  } catch (err) {
    console.warn('[FirestoreSync] Error guardando lead en Firestore:', lead.id, err);
    return null;
  }
}

/**
 * Elimina un lead de Firestore (sin afectar Propuestas ni Contratos)
 */
export async function deleteCrmLeadCloud(leadId, extraKeys = []) {
  if (!leadId) return false;
  markCrmLeadDeleted(leadId, ...(Array.isArray(extraKeys) ? extraKeys : [extraKeys]));
  try {
    await ensureAuth();
    const docId = String(leadId).trim();
    await deleteDoc(doc(db, 'crm_leads', docId));
    return true;
  } catch (err) {
    console.warn('[FirestoreSync] Error eliminando lead de Firestore:', leadId, err);
    return false;
  }
}

/**
 * Suscripción en tiempo real a los leads del CRM
 */
export function subscribeCrmLeadsCloud(onUpdate) {
  if (typeof onUpdate !== 'function') return () => {};
  try {
    return onSnapshot(collection(db, 'crm_leads'), (snap) => {
      const list = [];
      snap.forEach(docSnap => {
        if (docSnap.exists()) {
          const data = docSnap.data() || {};
          const item = { ...data, id: data.id || docSnap.id, _firestoreDocId: docSnap.id };
          if (isExcludedCrmLead(item.empresa || item.nombreEmpresa || item.contacto, item.id, item.leadId, docSnap.id)) {
            deleteDoc(docSnap.ref).catch(() => {});
            return;
          }
          list.push(item);
        }
      });
      onUpdate(list);
    }, (err) => {
      console.warn('[FirestoreSync] Error en listener de crm_leads:', err);
    });
  } catch (e) {
    console.warn('[FirestoreSync] No se pudo inicializar listener de crm_leads:', e);
    return () => {};
  }
}

// ============================================================================
// 4. PRESUPUESTOS Y COTIZACIONES (/presupuestos/{id})
// ============================================================================

/**
 * Obtiene las cotizaciones desde Firestore
 */
export async function getPresupuestosCloud() {
  try {
    await ensureAuth();
    const snap = await getDocs(collection(db, 'presupuestos'));
    const list = [];
    snap.forEach(docSnap => {
      if (docSnap.exists()) {
        const data = docSnap.data() || {};
        const item = { ...data, id: data.id || docSnap.id, _firestoreDocId: docSnap.id };
        if (isExcludedPresupuesto(item.cliente?.empresa || item.cliente?.nombre, item.id, item.codigo, docSnap.id)) {
          deleteDoc(docSnap.ref).catch(() => {});
          return;
        }
        list.push(item);
      }
    });
    return list;
  } catch (err) {
    console.warn('[FirestoreSync] Error obteniendo presupuestos:', err);
    return [];
  }
}

/**
 * Guarda o actualiza un presupuesto en Firestore
 */
export async function savePresupuestoCloud(presupuesto) {
  if (!presupuesto || !presupuesto.id) return null;
  if (isExcludedPresupuesto(presupuesto.cliente?.empresa || presupuesto.cliente?.nombre, presupuesto.id, presupuesto.codigo)) return null;
  try {
    await ensureAuth();
    const docId = String(presupuesto.id).trim();
    const presRef = doc(db, 'presupuestos', docId);
    const { _firestoreDocId, ...restPresupuesto } = presupuesto;
    const payload = sanitizeForFirestore({
      ...restPresupuesto,
      id: docId,
      updatedAt: new Date().toISOString()
    });
    await setDoc(presRef, payload, { merge: true });
    if (presupuesto.portalToken) {
      savePortalCloud(presupuesto.portalToken, {
        token: presupuesto.portalToken,
        presupuesto: payload
      }).catch(() => {});
    }
    return payload;
  } catch (err) {
    console.warn('[FirestoreSync] Error guardando presupuesto en Firestore:', presupuesto.id, err);
    return null;
  }
}

/**
 * Elimina un presupuesto de Firestore y lo registra en la lista de exclusión de presupuestos (nunca elimina al Lead)
 */
export async function deletePresupuestoCloud(presupuestoId, extraKeys = []) {
  if (!presupuestoId && (!extraKeys || extraKeys.length === 0)) return false;
  markPresupuestoDeleted(presupuestoId, ...(Array.isArray(extraKeys) ? extraKeys : [extraKeys]));
  try {
    await ensureAuth();
    const candidates = new Set([presupuestoId, ...(Array.isArray(extraKeys) ? extraKeys : [])].filter(Boolean).map(x => String(x).trim()));
    for (const cId of candidates) {
      await deleteDoc(doc(db, 'presupuestos', cId)).catch(() => {});
    }
    const snap = await getDocs(collection(db, 'presupuestos')).catch(() => null);
    if (snap) {
      const deletions = [];
      snap.forEach(docSnap => {
        const d = docSnap.data() || {};
        if (
          candidates.has(docSnap.id) ||
          (d.id && candidates.has(String(d.id).trim())) ||
          (d.codigo && candidates.has(String(d.codigo).trim())) ||
          isExcludedPresupuesto(d.cliente?.empresa || d.cliente?.nombre, d.id, d.codigo, docSnap.id)
        ) {
          deletions.push(deleteDoc(docSnap.ref).catch(() => {}));
        }
      });
      await Promise.all(deletions);
    }

    // Desacoplamiento estricto: Desvincular propuesta en crm_leads en Firestore sin eliminar el Lead
    const leadsSnap = await getDocs(collection(db, 'crm_leads')).catch(() => null);
    if (leadsSnap) {
      const leadUpdates = [];
      leadsSnap.forEach(lSnap => {
        if (lSnap.exists()) {
          const lData = lSnap.data() || {};
          const hasMatchingProp = (lData.presupuestoId && candidates.has(String(lData.presupuestoId).trim())) ||
                                  (lData.presupuestoCodigo && candidates.has(String(lData.presupuestoCodigo).trim()));
          if (hasMatchingProp) {
            leadUpdates.push(
              setDoc(lSnap.ref, {
                presupuestoId: null,
                presupuestoCodigo: null,
                presupuestoMonto: null,
                presupuestoEstado: null,
                portalConfig: {
                  ...(lData.portalConfig || {}),
                  presupuestoId: null,
                  estadoPropuesta: null,
                  fase1Aprobada: false
                },
                updatedAt: new Date().toISOString()
              }, { merge: true }).catch(() => {})
            );
          }
        }
      });
      await Promise.all(leadUpdates);
    }

    return true;
  } catch (err) {
    console.warn('[FirestoreSync] Error eliminando presupuesto de Firestore:', presupuestoId, err);
    return false;
  }
}

/**
 * Suscripción en tiempo real a presupuestos
 */
export function subscribePresupuestosCloud(onUpdate) {
  if (typeof onUpdate !== 'function') return () => {};
  try {
    return onSnapshot(collection(db, 'presupuestos'), (snap) => {
      const list = [];
      snap.forEach(docSnap => {
        if (docSnap.exists()) {
          const data = docSnap.data() || {};
          const item = { ...data, id: data.id || docSnap.id, _firestoreDocId: docSnap.id };
          if (isExcludedPresupuesto(item.cliente?.empresa || item.cliente?.nombre, item.id, item.codigo, docSnap.id)) {
            deleteDoc(docSnap.ref).catch(() => {});
            return;
          }
          list.push(item);
        }
      });
      onUpdate(list);
    }, (err) => {
      console.warn('[FirestoreSync] Error en listener de presupuestos:', err);
    });
  } catch (e) {
    console.warn('[FirestoreSync] No se pudo inicializar listener de presupuestos:', e);
    return () => {};
  }
}

// ============================================================================
// 5. TAREAS DE SPRINT KANBAN (/sprint_tasks/{id})
// ============================================================================

/**
 * Obtiene las tareas de desarrollo desde Firestore
 */
export async function getSprintTasksCloud(proyectoId = null) {
  try {
    await ensureAuth();
    let q = collection(db, 'sprint_tasks');
    if (proyectoId) {
      q = query(q, where('proyectoId', '==', String(proyectoId)));
    }
    const snap = await getDocs(q);
    const list = [];
    snap.forEach(docSnap => {
      if (docSnap.exists()) {
        list.push({ id: docSnap.id, ...docSnap.data() });
      }
    });
    return list;
  } catch (err) {
    console.warn('[FirestoreSync] Error obteniendo sprint_tasks:', err);
    return [];
  }
}

/**
 * Guarda o actualiza una tarea de desarrollo en Firestore
 */
export async function saveSprintTaskCloud(task) {
  if (!task || !task.id) return null;
  try {
    await ensureAuth();
    const docId = String(task.id).trim();
    const taskRef = doc(db, 'sprint_tasks', docId);
    const payload = sanitizeForFirestore({
      ...task,
      id: docId,
      updatedAt: new Date().toISOString()
    });
    await setDoc(taskRef, payload, { merge: true });
    return payload;
  } catch (err) {
    console.warn('[FirestoreSync] Error guardando sprint_task:', task.id, err);
    return null;
  }
}

// ============================================================================
// 6. ESTADO DE MÓDULOS INTERNOS (/app_state/{docId})
//    Finanzas, PRD Técnico, StoryBrand, Launch QA, Repo Vault
// ============================================================================

/**
 * Obtiene el estado de un módulo interno desde Firestore
 */
export async function getAppStateCloud(docId) {
  if (!docId) return null;
  try {
    await ensureAuth();
    const cleanId = String(docId).trim();
    const snap = await getDoc(doc(db, 'app_state', cleanId));
    if (snap.exists()) {
      return snap.data()?.payload ?? null;
    }
  } catch (err) {
    console.warn('[FirestoreSync] Error leyendo app_state:', docId, err);
  }
  return null;
}

/**
 * Guarda o actualiza el estado de un módulo interno en Firestore
 */
export async function saveAppStateCloud(docId, moduleName, payloadData) {
  if (!docId || payloadData === undefined) return null;
  try {
    await ensureAuth();
    const cleanId = String(docId).trim();
    const docRef = doc(db, 'app_state', cleanId);
    const record = sanitizeForFirestore({
      id: cleanId,
      module: String(moduleName || cleanId),
      payload: payloadData,
      updatedAt: new Date().toISOString()
    });
    await setDoc(docRef, record, { merge: true });
    return record;
  } catch (err) {
    console.warn('[FirestoreSync] Error guardando app_state:', docId, err);
    return null;
  }
}

/**
 * Suscripción en tiempo real a un documento de estado de módulo interno
 */
export function subscribeAppStateCloud(docId, onUpdate) {
  if (!docId || typeof onUpdate !== 'function') return () => {};
  try {
    const cleanId = String(docId).trim();
    return onSnapshot(doc(db, 'app_state', cleanId), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        if (data && data.payload !== undefined) {
          onUpdate(data.payload);
        }
      }
    }, (err) => {
      console.warn('[FirestoreSync] Error en listener de app_state:', docId, err);
    });
  } catch (e) {
    return () => {};
  }
}

// ============================================================================
// 7. FIREBASE CLOUD STORAGE PARA COMPROBANTES BANCARIOS
// ============================================================================

/**
 * Sube la captura de un comprobante bancario a Firebase Cloud Storage
 * y retorna la URL pública de descarga. Si Storage falla o está offline,
 * retorna el DataURL optimizado para que nunca se pierda el comprobante.
 */
export async function uploadReceiptToCloudStorage(dataUrl, fileName = 'comprobante.jpg', token = 'general', type = 'advance') {
  if (!dataUrl || typeof dataUrl !== 'string') return '';
  if (!dataUrl.startsWith('data:')) return dataUrl;
  try {
    await ensureAuth();
    const safeToken = String(token || 'general').replace(/[^a-zA-Z0-9_-]/g, '_');
    const safeName = String(fileName || 'comprobante.jpg').replace(/[^a-zA-Z0-9._-]/g, '_');
    const storagePath = `comprobantes/${safeToken}/${type}_${Date.now()}_${safeName}`;
    const fileRef = ref(storage, storagePath);
    await uploadString(fileRef, dataUrl, 'data_url');
    const publicDownloadUrl = await getDownloadURL(fileRef);
    return publicDownloadUrl || dataUrl;
  } catch (err) {
    console.warn('[CloudStorage] Fallback a imagen optimizada inline:', err?.message || err);
    return dataUrl;
  }
}

// ============================================================================
// 8. SITIOS CMS MULTI-TENANT (/cms_sites/{siteSlug})
// ============================================================================

/**
 * Obtiene la configuración y contenido vivo de un sitio CMS por su slug
 */
export async function getCmsSiteCloud(siteSlug) {
  if (!siteSlug) return null;
  try {
    await ensureAuth();
    const cleanSlug = String(siteSlug).toLowerCase().trim().replace(/[^a-z0-9-]/g, '-');
    const snap = await getDoc(doc(db, 'cms_sites', cleanSlug));
    if (snap.exists()) {
      return { id: snap.id, ...snap.data() };
    }
  } catch (err) {
    console.warn('[FirestoreSync] Error leyendo cms_site:', siteSlug, err);
  }
  return null;
}

/**
 * Guarda o actualiza el contenido de un sitio CMS en tiempo real
 */
export async function saveCmsSiteCloud(siteSlug, sitePayload) {
  if (!siteSlug || !sitePayload) return null;
  try {
    await ensureAuth();
    const cleanSlug = String(siteSlug).toLowerCase().trim().replace(/[^a-z0-9-]/g, '-');
    const docRef = doc(db, 'cms_sites', cleanSlug);
    const payload = sanitizeForFirestore({
      ...sitePayload,
      slug: cleanSlug,
      nombre: sitePayload.nombre || cleanSlug,
      contenido: sitePayload.contenido || {},
      updatedAt: new Date().toISOString()
    });
    await setDoc(docRef, payload, { merge: true });
    return payload;
  } catch (err) {
    console.warn('[FirestoreSync] Error guardando cms_site:', siteSlug, err);
    return null;
  }
}

/**
 * Suscripción en tiempo real al sitio CMS de un cliente
 */
export function subscribeCmsSiteCloud(siteSlug, onUpdate) {
  if (!siteSlug || typeof onUpdate !== 'function') return () => {};
  try {
    const cleanSlug = String(siteSlug).toLowerCase().trim().replace(/[^a-z0-9-]/g, '-');
    return onSnapshot(doc(db, 'cms_sites', cleanSlug), (snap) => {
      if (snap.exists()) {
        onUpdate({ id: snap.id, ...snap.data() });
      }
    }, (err) => {
      console.warn('[FirestoreSync] Error en listener cms_site:', err);
    });
  } catch (e) {
    return () => {};
  }
}
