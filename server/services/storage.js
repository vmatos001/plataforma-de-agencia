import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataDir = path.join(__dirname, '../data');

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const leadsFile = path.join(dataDir, 'leads.json');
const settingsFile = path.join(dataDir, 'settings.json');
const searchesFile = path.join(dataDir, 'searches.json');

// Initial sample data tailored to Goglite markets (SV & DO)
const initialLeads = [];

import { pool } from './db.js';

export const getLeads = () => {
  if (!fs.existsSync(leadsFile)) {
    fs.writeFileSync(leadsFile, JSON.stringify(initialLeads, null, 2));
    return initialLeads;
  }
  try {
    return JSON.parse(fs.readFileSync(leadsFile, 'utf8'));
  } catch {
    return initialLeads;
  }
};

export const saveLeads = (leads) => {
  fs.writeFileSync(leadsFile, JSON.stringify(leads, null, 2));

  // Async background sync with Neon PostgreSQL
  if (pool) {
    (async () => {
      try {
        for (const l of leads) {
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
        }
      } catch (err) {
        console.warn('[DB] Error de sincronización a Neon:', err.message);
      }
    })();
  }

  return leads;
};

export const getSettings = () => {
  const defaultSettings = {
    geminiApiKey: process.env.GEMINI_API_KEY || "",
    serperApiKey: process.env.SERPER_API_KEY || "",
    apolloApiKey: process.env.APOLLO_API_KEY || "",
    instantlyApiKey: process.env.INSTANTLY_API_KEY || "",
    resendApiKey: process.env.RESEND_API_KEY || "",
    resendFromEmail: process.env.RESEND_FROM_EMAIL || "Goglite Agencia <onboarding@resend.dev>",
    preferredEmailProvider: process.env.PREFERRED_EMAIL_PROVIDER || "resend", // "resend" | "instantly"
    defaultCountry: "SV",
    demoMode: true, // Enables rich heuristic simulator if external paid keys aren't set
  };

  if (!fs.existsSync(settingsFile)) {
    fs.writeFileSync(settingsFile, JSON.stringify(defaultSettings, null, 2));
    return defaultSettings;
  }
  try {
    const fileSettings = JSON.parse(fs.readFileSync(settingsFile, 'utf8'));
    return {
      ...defaultSettings,
      ...fileSettings,
      geminiApiKey: (fileSettings.geminiApiKey && fileSettings.geminiApiKey.trim()) || process.env.GEMINI_API_KEY || "",
      serperApiKey: (fileSettings.serperApiKey && fileSettings.serperApiKey.trim()) || process.env.SERPER_API_KEY || "",
      apolloApiKey: (fileSettings.apolloApiKey && fileSettings.apolloApiKey.trim()) || process.env.APOLLO_API_KEY || "",
      instantlyApiKey: (fileSettings.instantlyApiKey && fileSettings.instantlyApiKey.trim()) || process.env.INSTANTLY_API_KEY || "",
      resendApiKey: (fileSettings.resendApiKey && fileSettings.resendApiKey.trim()) || process.env.RESEND_API_KEY || "",
      resendFromEmail: (fileSettings.resendFromEmail && fileSettings.resendFromEmail.trim()) || process.env.RESEND_FROM_EMAIL || "Goglite Agencia <onboarding@resend.dev>",
      preferredEmailProvider: fileSettings.preferredEmailProvider || process.env.PREFERRED_EMAIL_PROVIDER || "resend",
    };
  } catch {
    return defaultSettings;
  }
};

export const saveSettings = (newSettings) => {
  const current = getSettings();
  const merged = { ...current, ...newSettings };
  fs.writeFileSync(settingsFile, JSON.stringify(merged, null, 2));
  return merged;
};

export const getSearches = () => {
  if (!fs.existsSync(searchesFile)) return [];
  try {
    return JSON.parse(fs.readFileSync(searchesFile, 'utf8'));
  } catch {
    return [];
  }
};

export const saveSearch = (searchRecord) => {
  const list = getSearches();
  list.unshift(searchRecord);
  fs.writeFileSync(searchesFile, JSON.stringify(list.slice(0, 50), null, 2));
  return list;
};
