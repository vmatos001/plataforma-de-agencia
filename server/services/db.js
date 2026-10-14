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

    // Tabla Módulo 2: CRM Leads & WhatsApp
    await client.query(`
      CREATE TABLE IF NOT EXISTS crm_leads (
        id VARCHAR(80) PRIMARY KEY,
        lead_id VARCHAR(80),
        empresa VARCHAR(255),
        contacto VARCHAR(255),
        cargo VARCHAR(255),
        email VARCHAR(255),
        telefono VARCHAR(80),
        pais VARCHAR(10),
        dominio VARCHAR(255),
        etapa VARCHAR(50),
        valor_estimado NUMERIC(12, 2),
        probabilidad INT,
        fuente VARCHAR(100),
        portal_token VARCHAR(120) UNIQUE,
        interacciones JSONB DEFAULT '[]'::jsonb,
        whatsapp_data JSONB DEFAULT '{}'::jsonb,
        portal_config JSONB DEFAULT '{}'::jsonb,
        archivos_cliente JSONB DEFAULT '[]'::jsonb,
        creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Tabla Módulo 3: Presupuestos & SOW
    await client.query(`
      CREATE TABLE IF NOT EXISTS presupuestos (
        id VARCHAR(80) PRIMARY KEY,
        lead_id VARCHAR(80),
        numero VARCHAR(50),
        cliente VARCHAR(255),
        empresa VARCHAR(255),
        pais VARCHAR(10),
        moneda VARCHAR(10),
        subtotal NUMERIC(12, 2),
        impuestos NUMERIC(12, 2),
        total NUMERIC(12, 2),
        estado VARCHAR(50),
        items JSONB DEFAULT '[]'::jsonb,
        terminos JSONB DEFAULT '{}'::jsonb,
        creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Tabla Módulo 3/4: Proyectos Onboarding
    await client.query(`
      CREATE TABLE IF NOT EXISTS proyectos (
        id VARCHAR(80) PRIMARY KEY,
        presupuesto_id VARCHAR(80),
        nombre VARCHAR(255),
        cliente VARCHAR(255),
        pais VARCHAR(10),
        estado VARCHAR(50),
        fase_actual INT DEFAULT 1,
        tareas JSONB DEFAULT '[]'::jsonb,
        drive_vault JSONB DEFAULT '{}'::jsonb,
        creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Tabla Módulo 5: Wireframes & StoryBrand
    await client.query(`
      CREATE TABLE IF NOT EXISTS wireframes (
        id VARCHAR(80) PRIMARY KEY,
        proyecto_id VARCHAR(80) UNIQUE,
        nombre VARCHAR(255),
        storybrand JSONB DEFAULT '{}'::jsonb,
        secciones JSONB DEFAULT '[]'::jsonb,
        creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Tabla Módulo 5/6: SEO & Launch QA
    await client.query(`
      CREATE TABLE IF NOT EXISTS seo_audits (
        id VARCHAR(80) PRIMARY KEY,
        proyecto_id VARCHAR(80) UNIQUE,
        dominio VARCHAR(255),
        schema_jsonld JSONB DEFAULT '{}'::jsonb,
        metatags JSONB DEFAULT '{}'::jsonb,
        checklist JSONB DEFAULT '[]'::jsonb,
        creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Tabla Módulo 6: Headless CMS
    await client.query(`
      CREATE TABLE IF NOT EXISTS cms_sites (
        id VARCHAR(80) PRIMARY KEY,
        slug VARCHAR(120) UNIQUE,
        nombre VARCHAR(255),
        dominio VARCHAR(255),
        contenido JSONB DEFAULT '{}'::jsonb,
        creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Tabla Módulo 4: Finanzas & Transacciones
    await client.query(`
      CREATE TABLE IF NOT EXISTS finanzas_records (
        id VARCHAR(80) PRIMARY KEY,
        tipo VARCHAR(50),
        payload JSONB DEFAULT '{}'::jsonb,
        creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    client.release();
    console.log('[DB] Esquema completo de tablas (leads, crm, presupuestos, proyectos, wireframes, seo, cms, finanzas) verificado en Neon.');
    return true;
  } catch (err) {
    console.error('[DB] Error conectando o verificando esquema en Neon:', err.message);
    return false;
  }
}
