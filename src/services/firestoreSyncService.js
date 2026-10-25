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

import { db, ensureAuth } from './firebase';
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

// ============================================================================
// 1. PORTALES DE CLIENTES (/portales/{token})
// ============================================================================

/**
 * Obtiene el documento completo de un portal desde Firestore
 */
export async function getPortalCloud(token) {
  if (!token) return null;
  try {
    const cleanToken = String(token).trim();
    const portalRef = doc(db, 'portales', cleanToken);
    const snap = await getDoc(portalRef);
    if (snap.exists()) {
      return snap.data();
    }
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
        list.push({ id: docSnap.id, ...docSnap.data() });
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
  try {
    await ensureAuth();
    const docId = String(proyecto.id).trim();
    const projRef = doc(db, 'proyectos', docId);
    const payload = sanitizeForFirestore({
      ...proyecto,
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
 * Elimina un proyecto de Firestore
 */
export async function deleteProyectoCloud(proyectoId) {
  if (!proyectoId) return false;
  try {
    await ensureAuth();
    const docId = String(proyectoId).trim();
    await deleteDoc(doc(db, 'proyectos', docId));
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
          list.push({ id: docSnap.id, ...docSnap.data() });
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
        list.push({ id: docSnap.id, ...docSnap.data() });
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
  try {
    await ensureAuth();
    const docId = String(lead.id).trim();
    const leadRef = doc(db, 'crm_leads', docId);
    const payload = sanitizeForFirestore({
      ...lead,
      id: docId,
      updatedAt: new Date().toISOString()
    });
    await setDoc(leadRef, payload, { merge: true });
    return payload;
  } catch (err) {
    console.warn('[FirestoreSync] Error guardando lead en Firestore:', lead.id, err);
    return null;
  }
}

/**
 * Elimina un lead de Firestore
 */
export async function deleteCrmLeadCloud(leadId) {
  if (!leadId) return false;
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
          list.push({ id: docSnap.id, ...docSnap.data() });
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
        list.push({ id: docSnap.id, ...docSnap.data() });
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
  try {
    await ensureAuth();
    const docId = String(presupuesto.id).trim();
    const presRef = doc(db, 'presupuestos', docId);
    const payload = sanitizeForFirestore({
      ...presupuesto,
      id: docId,
      updatedAt: new Date().toISOString()
    });
    await setDoc(presRef, payload, { merge: true });
    return payload;
  } catch (err) {
    console.warn('[FirestoreSync] Error guardando presupuesto en Firestore:', presupuesto.id, err);
    return null;
  }
}

/**
 * Elimina un presupuesto de Firestore
 */
export async function deletePresupuestoCloud(presupuestoId) {
  if (!presupuestoId) return false;
  try {
    await ensureAuth();
    const docId = String(presupuestoId).trim();
    await deleteDoc(doc(db, 'presupuestos', docId));
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
          list.push({ id: docSnap.id, ...docSnap.data() });
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
