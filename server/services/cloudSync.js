import { db, ensureAuth } from '../../src/services/firebase.js';
import { doc, setDoc, deleteDoc } from 'firebase/firestore';
import { pool } from './db.js';

/**
 * Sanitiza recursivamente objetos para Firestore (elimina undefined y funciones)
 */
function sanitize(obj) {
  if (obj === null || obj === undefined) return null;
  if (typeof obj !== 'object') return obj;
  if (obj instanceof Date) return obj.toISOString();
  if (Array.isArray(obj)) return obj.map(sanitize).filter(x => x !== undefined);
  const clean = {};
  for (const [key, val] of Object.entries(obj)) {
    if (val !== undefined && typeof val !== 'function') {
      clean[key] = sanitize(val);
    }
  }
  return clean;
}

/**
 * Sincroniza un lead comercial a Cloud Firestore y Neon PostgreSQL
 */
export async function syncLeadToCloud(lead) {
  if (!lead || !lead.id) return false;

  const cleanLead = sanitize({
    ...lead,
    id: String(lead.id).trim(),
    leadId: String(lead.leadId || lead.id).trim(),
    updatedAt: new Date().toISOString()
  });

  // 1. Sincronización con Cloud Firestore
  try {
    await ensureAuth();
    const leadRef = doc(db, 'crm_leads', cleanLead.id);
    await setDoc(leadRef, cleanLead, { merge: true });

    if (cleanLead.portalToken) {
      const portalRef = doc(db, 'portales', cleanLead.portalToken);
      await setDoc(portalRef, {
        token: cleanLead.portalToken,
        lead: cleanLead,
        portalConfig: cleanLead.portalConfig || {},
        updatedAt: new Date().toISOString()
      }, { merge: true });
    }
    console.log(`[CloudSync] Lead '${cleanLead.empresa || cleanLead.id}' sincronizado con Cloud Firestore.`);
  } catch (err) {
    console.warn(`[CloudSync] Advertencia Firestore lead '${cleanLead.id}':`, err.message);
  }

  // 2. Sincronización con Neon PostgreSQL
  if (pool) {
    try {
      const client = await pool.connect();
      try {
        await client.query(`
          INSERT INTO crm_leads (
            id, lead_id, empresa, contacto, cargo, email, telefono, pais, dominio,
            etapa, valor_estimado, probabilidad, fuente, portal_token, interacciones,
            whatsapp_data, portal_config, creado_en, actualizado_en
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, NOW(), NOW())
          ON CONFLICT (id) DO UPDATE SET
            empresa = EXCLUDED.empresa,
            contacto = EXCLUDED.contacto,
            cargo = EXCLUDED.cargo,
            email = EXCLUDED.email,
            telefono = EXCLUDED.telefono,
            pais = EXCLUDED.pais,
            dominio = EXCLUDED.dominio,
            etapa = EXCLUDED.etapa,
            valor_estimado = EXCLUDED.valor_estimado,
            probabilidad = EXCLUDED.probabilidad,
            fuente = EXCLUDED.fuente,
            portal_token = EXCLUDED.portal_token,
            interacciones = EXCLUDED.interacciones,
            whatsapp_data = EXCLUDED.whatsapp_data,
            portal_config = EXCLUDED.portal_config,
            actualizado_en = NOW();
        `, [
          cleanLead.id,
          cleanLead.leadId,
          cleanLead.empresa || '',
          cleanLead.contacto || '',
          cleanLead.cargo || '',
          cleanLead.email || '',
          cleanLead.telefono || '',
          cleanLead.pais || 'SV',
          cleanLead.dominio || '',
          cleanLead.etapa || 'nuevo',
          Number(cleanLead.valorEstimado) || 0,
          Number(cleanLead.probabilidad) || 0,
          cleanLead.fuente || 'WhatsApp Inbound',
          cleanLead.portalToken || null,
          JSON.stringify(cleanLead.interacciones || []),
          JSON.stringify(cleanLead.whatsappData || {}),
          JSON.stringify(cleanLead.portalConfig || {})
        ]);
        console.log(`[CloudSync] Lead '${cleanLead.empresa || cleanLead.id}' sincronizado con Neon PostgreSQL.`);
      } finally {
        client.release();
      }
    } catch (err) {
      console.warn(`[CloudSync] Advertencia PostgreSQL lead '${cleanLead.id}':`, err.message);
    }
  }

  return true;
}

/**
 * Elimina un lead de Cloud Firestore y Neon PostgreSQL
 */
export async function deleteLeadFromCloud(leadId) {
  if (!leadId) return false;
  const idStr = String(leadId).trim();

  try {
    await ensureAuth();
    await deleteDoc(doc(db, 'crm_leads', idStr));
    console.log(`[CloudSync] Lead '${idStr}' eliminado de Cloud Firestore.`);
  } catch (err) {
    console.warn(`[CloudSync] Advertencia eliminando Firestore lead '${idStr}':`, err.message);
  }

  if (pool) {
    try {
      const client = await pool.connect();
      try {
        await client.query('DELETE FROM crm_leads WHERE id = $1', [idStr]);
        console.log(`[CloudSync] Lead '${idStr}' eliminado de Neon PostgreSQL.`);
      } finally {
        client.release();
      }
    } catch (err) {
      console.warn(`[CloudSync] Advertencia eliminando PostgreSQL lead '${idStr}':`, err.message);
    }
  }

  return true;
}

/**
 * Sincroniza un presupuesto a Cloud Firestore y Neon PostgreSQL
 */
export async function syncPresupuestoToCloud(presupuesto) {
  if (!presupuesto || !presupuesto.id) return false;

  const clean = sanitize({
    ...presupuesto,
    id: String(presupuesto.id).trim(),
    updatedAt: new Date().toISOString()
  });

  try {
    await ensureAuth();
    await setDoc(doc(db, 'presupuestos', clean.id), clean, { merge: true });

    if (clean.portalToken) {
      await setDoc(doc(db, 'portales', clean.portalToken), {
        token: clean.portalToken,
        presupuesto: clean,
        updatedAt: new Date().toISOString()
      }, { merge: true });
    }
    console.log(`[CloudSync] Presupuesto '${clean.codigo || clean.id}' sincronizado con Cloud Firestore.`);
  } catch (err) {
    console.warn(`[CloudSync] Advertencia Firestore presupuesto '${clean.id}':`, err.message);
  }

  return true;
}

/**
 * Sincroniza un proyecto a Cloud Firestore y Neon PostgreSQL
 */
export async function syncProyectoToCloud(proyecto) {
  if (!proyecto || !proyecto.id) return false;

  const clean = sanitize({
    ...proyecto,
    id: String(proyecto.id).trim(),
    updatedAt: new Date().toISOString()
  });

  try {
    await ensureAuth();
    await setDoc(doc(db, 'proyectos', clean.id), clean, { merge: true });

    if (clean.portalToken) {
      await setDoc(doc(db, 'portales', clean.portalToken), {
        token: clean.portalToken,
        proyecto: clean,
        updatedAt: new Date().toISOString()
      }, { merge: true });
    }
    console.log(`[CloudSync] Proyecto '${clean.codigo || clean.id}' sincronizado con Cloud Firestore.`);
  } catch (err) {
    console.warn(`[CloudSync] Advertencia Firestore proyecto '${clean.id}':`, err.message);
  }

  return true;
}
