import { pool, initDb } from './db.js';
import { getLeads } from './storage.js';

export async function migrateLeadsToNeon() {
  await initDb();
  if (!pool) return { success: false, error: 'No DB pool' };

  const currentLeads = getLeads();
  console.log(`[MIGRATE] Sincronizando ${currentLeads.length} leads locales hacia Neon PostgreSQL...`);

  let insertedCount = 0;
  for (const l of currentLeads) {
    try {
      await pool.query(`
        INSERT INTO leads (
          id, dominio, nombre_empresa, pais, email, responsable, cargo, telefono, posicion_google, estado, actualizado, auditoria, pitch
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13
        )
        ON CONFLICT (dominio) DO UPDATE SET
          nombre_empresa = EXCLUDED.nombre_empresa,
          email = EXCLUDED.email,
          responsable = EXCLUDED.responsable,
          cargo = EXCLUDED.cargo,
          telefono = EXCLUDED.telefono,
          estado = EXCLUDED.estado,
          actualizado = EXCLUDED.actualizado,
          auditoria = EXCLUDED.auditoria,
          pitch = EXCLUDED.pitch;
      `, [
        l.id,
        l.dominio,
        l.nombreEmpresa || l.dominio,
        l.pais || 'SV',
        l.email || '',
        l.responsable || '',
        l.cargo || '',
        l.telefono || '',
        l.posicionGoogle || null,
        l.estado || 'nuevo',
        l.actualizado || new Date().toISOString().split('T')[0],
        JSON.stringify(l.auditoria || null),
        l.pitch || null
      ]);
      insertedCount++;
    } catch (e) {
      console.warn(`[MIGRATE] Aviso en lead ${l.dominio}:`, e.message);
    }
  }

  console.log(`[MIGRATE] ¡Completado! ${insertedCount} leads migrados a Neon.`);
  return { success: true, count: insertedCount };
}

// Ejecución directa por CLI
if (process.argv[1] && process.argv[1].replace(/\\/g, '/').includes('migrateModule1')) {
  migrateLeadsToNeon()
    .then((res) => {
      console.log('[MIGRATE CLI] Finalizado con éxito:', res);
      process.exit(0);
    })
    .catch((err) => {
      console.error('[MIGRATE CLI] Error fatal:', err);
      process.exit(1);
    });
}
