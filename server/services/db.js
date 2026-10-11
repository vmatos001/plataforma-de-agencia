import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../../.env') });

const { Pool } = pg;

const connectionString = process.env.DATABASE_URL;

export const pool = connectionString
  ? new Pool({
      connectionString,
      ssl: {
        rejectUnauthorized: false
      }
    })
  : null;

/**
 * Initializes database tables in Neon PostgreSQL
 */
export async function initDb() {
  if (!pool) {
    console.log('[DB] Modo local activo (sin DATABASE_URL).');
    return false;
  }

  try {
    const client = await pool.connect();
    console.log('[DB] Conexión establecida con Neon PostgreSQL (AWS US-East).');

    // Tabla Módulo 1: Leads
    await client.query(`
      CREATE TABLE IF NOT EXISTS leads (
        id VARCHAR(80) PRIMARY KEY,
        dominio VARCHAR(255) UNIQUE,
        nombre_empresa VARCHAR(255),
        pais VARCHAR(10),
        email VARCHAR(255),
        responsable VARCHAR(255),
        cargo VARCHAR(255),
        telefono VARCHAR(80),
        posicion_google INT,
        estado VARCHAR(80),
        actualizado VARCHAR(50),
        auditoria JSONB,
        pitch TEXT,
        creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    client.release();
    console.log('[DB] Tabla "leads" verificada en Neon.');
    return true;
  } catch (err) {
    console.error('[DB] Error conectando a Neon:', err.message);
    return false;
  }
}
