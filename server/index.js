import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { getLeads, saveLeads, getSettings, saveSettings, getSearches, saveSearch } from './services/storage.js';
import { searchGoogleSERP, searchGooglePlaces } from './services/scraper.js';
import { enrichDomain } from './services/enricher.js';
import { auditDomain } from './services/auditor.js';
import { generatePitch } from './services/pitcher.js';
import { getPresupuestos, savePresupuestos, getPlantillas } from './services/presupuestosStorage.js';
import { getProyectos, saveProyectos, crearProyectoDesdePresupuesto } from './services/proyectosStorage.js';
import { getWireframes, saveWireframes, getWireframeByProyectoId, generarStoryBrandAuto } from './services/wireframesStorage.js';
import { getSeoAudits, saveSeoAudits, getSeoAuditByProyectoId, generarSeoAuto } from './services/seoStorage.js';
import { 
  getCrmLeads, 
  saveCrmLeads, 
  getCrmLeadById, 
  getCrmLeadByToken, 
  updateCrmLeadStage, 
  addCrmInteraction, 
  addClientUploadedAsset,
  updateClientPortalConfig,
  addWhatsAppMessage,
  updateWhatsAppLeadMeta
} from './services/crmStorage.js';
import {
  getFinanzas,
  getResumenFinanciero,
  crearFactura,
  actualizarFactura,
  eliminarFactura,
  crearGasto,
  eliminarGasto,
  getTimeEntries,
  crearTimeEntry,
  eliminarTimeEntry,
  actualizarConfiguracionFinanzas,
  resetFinanzasData
} from './services/finanzasStorage.js';
import { analyzeOnPageSeo, generateSchemaJsonLd, generateLsiKeywords, getSearchConsoleMetrics, getServiceAccountInfo } from './services/geoSeoService.js';
import { getCmsSites, getCmsSiteBySlug, updateCmsSiteContent, createCmsSite, deleteCmsSite } from './services/headlessCmsStorage.js';
import { initDb, pool } from './services/db.js';
import { 
  getSessionsStatus, 
  startWhatsAppSession, 
  sendRealWhatsAppMessage, 
  disconnectWhatsAppSession 
} from './services/whatsappMultiService.js';
import { 
  getDriveStatus, 
  createClientVault, 
  archiveContractInDrive, 
  uploadTextFile 
} from './services/googleDriveService.js';
import { setupMcpRoutes } from './mcp/sseHandler.js';
import { getAgencySettings, saveAgencySettings } from './services/agencySettingsStorage.js';
import { getUsers, saveUsers, createCollaborator, registerOrUpdateClientAuth, getUserById, getUserByEmail, updateUser, deleteCollaborator } from './services/usersStorage.js';
import { verifyTOTP, generateTOTP, buildOtpAuthUri, generateQrCodeDataUrl } from './services/totpService.js';
import {
  syncScrapperLeadToCrm,
  syncPresupuestoToWorkflow,
  ensureDownstreamProjectPipeline,
  getUnifiedPortalPayload,
  applyPortalUpdateToWorkflow
} from './services/workflowContinuityService.js';

import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

dotenv.config();

// Initialize Neon Database if DATABASE_URL is set
initDb().catch(e => console.warn('[DB] Fallback a local JSON:', e.message));

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distPath = path.join(__dirname, '../dist');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Montaje de rutas del protocolo MCP (Server-Sent Events y mensajería en la nube)
setupMcpRoutes(app);

// ==========================================
// CANAL SERVER-SENT EVENTS (SSE) EN VIVO
// ==========================================
const sseClients = new Set();

export function broadcastPlatformEvent(eventType, payload = {}) {
  const data = JSON.stringify({ type: eventType, payload, timestamp: Date.now() });
  for (const client of sseClients) {
    try {
      client.write(`data: ${data}\n\n`);
    } catch {
      sseClients.delete(client);
    }
  }
}

app.get('/api/events', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders?.();

  res.write(`data: ${JSON.stringify({ type: 'CONNECTED', message: 'SSE Goglite Hub Activo' })}\n\n`);
  sseClients.add(res);

  const heartbeat = setInterval(() => {
    res.write(': heartbeat\n\n');
  }, 25000);

  req.on('close', () => {
    clearInterval(heartbeat);
    sseClients.delete(res);
  });
});

// 1. Status & Settings (Zero-Exposure Architecture)
app.get('/api/status', (req, res) => {
  const settings = getSettings();
  const servicesStatus = {
    gemini: Boolean(settings.geminiApiKey),
    serper: Boolean(settings.serperApiKey),
    apollo: Boolean(settings.apolloApiKey),
    resend: Boolean(settings.resendApiKey)
  };
  res.json({
    status: 'ok',
    online: true,
    version: '1.0.0',
    module: 'Lead Scrapper & Outbound AI',
    activeKeys: {
      ...servicesStatus,
      instantly: Boolean(settings.instantlyApiKey)
    },
    services: servicesStatus
  });
});

app.get('/api/settings', (req, res) => {
  const settings = getSettings();
  // Blindaje Zero-Exposure: NUNCA se devuelven claves secretas en texto plano al frontend
  res.json({
    defaultCountry: settings.defaultCountry || 'SV',
    demoMode: Boolean(settings.demoMode),
    preferredEmailProvider: settings.preferredEmailProvider || 'resend',
    resendFromEmail: settings.resendFromEmail || 'Goglite Agencia <onboarding@resend.dev>',
    // Estados booleanos de configuración en servidor
    geminiConfigured: Boolean(settings.geminiApiKey),
    serperConfigured: Boolean(settings.serperApiKey),
    apolloConfigured: Boolean(settings.apolloApiKey),
    resendConfigured: Boolean(settings.resendApiKey),
    instantlyConfigured: Boolean(settings.instantlyApiKey),
    // Máscaras de solo 4 caracteres de referencia para la consola de administración
    geminiApiKeyMasked: settings.geminiApiKey ? `${settings.geminiApiKey.slice(0, 4)}••••••••${settings.geminiApiKey.slice(-4)}` : '',
    serperApiKeyMasked: settings.serperApiKey ? `${settings.serperApiKey.slice(0, 4)}••••••••${settings.serperApiKey.slice(-4)}` : '',
    apolloApiKeyMasked: settings.apolloApiKey ? `${settings.apolloApiKey.slice(0, 4)}••••••••${settings.apolloApiKey.slice(-4)}` : '',
    resendApiKeyMasked: settings.resendApiKey ? `${settings.resendApiKey.slice(0, 4)}••••••••${settings.resendApiKey.slice(-4)}` : '',
    instantlyApiKeyMasked: settings.instantlyApiKey ? `${settings.instantlyApiKey.slice(0, 4)}••••••••${settings.instantlyApiKey.slice(-4)}` : ''
  });
});

app.post('/api/settings', (req, res) => {
  // Solo permitir actualizar configuraciones no sensibles por esta vía
  const { defaultCountry, demoMode, preferredEmailProvider, resendFromEmail } = req.body || {};
  const safePayload = {};
  if (defaultCountry !== undefined) safePayload.defaultCountry = defaultCountry;
  if (demoMode !== undefined) safePayload.demoMode = demoMode;
  if (preferredEmailProvider !== undefined) safePayload.preferredEmailProvider = preferredEmailProvider;
  if (resendFromEmail !== undefined) safePayload.resendFromEmail = resendFromEmail;

  const updated = saveSettings(safePayload);
  res.json({ 
    success: true, 
    settings: {
      defaultCountry: updated.defaultCountry,
      demoMode: updated.demoMode,
      preferredEmailProvider: updated.preferredEmailProvider,
      resendFromEmail: updated.resendFromEmail
    }
  });
});

app.post('/api/settings/test', async (req, res) => {
  try {
    const { provider } = req.body || {};
    const settings = getSettings();
    // La prueba utiliza estrictamente la variable configurada en el servidor
    const keyToTest = settings[`${provider}ApiKey`];

    if (!keyToTest || !keyToTest.trim()) {
      return res.status(400).json({ 
        ok: false, 
        message: `La variable de entorno para ${provider?.toUpperCase() || 'este servicio'} no está configurada en el servidor (Railway / .env).` 
      });
    }

    if (provider === 'gemini') {
      const resp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(keyToTest)}`);
      if (resp.ok) {
        return res.json({ 
          ok: true, 
          message: 'Google Gemini AI (1.5 / 2.0 Flash) conectado y respondiendo correctamente (HTTP 200).' 
        });
      }
      const data = await resp.json().catch(() => ({}));
      return res.status(400).json({ 
        ok: false, 
        message: data.error?.message || 'Error de autenticación: clave de Gemini rechazada por Google AI Studio.' 
      });
    }

    if (provider === 'serper') {
      const resp = await fetch('https://google.serper.dev/search', {
        method: 'POST',
        headers: {
          'X-API-KEY': keyToTest,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ q: 'ping test', num: 1 })
      });
      if (resp.ok) {
        return res.json({ 
          ok: true, 
          message: 'Serper.dev (Google Maps & SERP Scraper) conectado y respondiendo correctamente (HTTP 200).' 
        });
      }
      const data = await resp.json().catch(() => ({}));
      return res.status(400).json({ 
        ok: false, 
        message: data.message || 'Clave de Serper rechazada o sin créditos disponibles en serper.dev.' 
      });
    }

    if (provider === 'apollo') {
      const resp = await fetch('https://api.apollo.io/v1/auth/health', {
        headers: { 'Cache-Control': 'no-cache', 'X-Api-Key': keyToTest }
      });
      if (resp.ok) {
        return res.json({ 
          ok: true, 
          message: 'Apollo.io B2B conectado y respondiendo correctamente (HTTP 200).' 
        });
      }
      return res.status(400).json({ 
        ok: false, 
        message: 'Clave de Apollo rechazada o sin permisos de acceso a la API.' 
      });
    }

    if (provider === 'resend') {
      const resp = await fetch('https://api.resend.com/api-keys', {
        headers: { Authorization: `Bearer ${keyToTest}` }
      });
      if (resp.ok) {
        return res.json({ 
          ok: true, 
          message: 'Resend Gateway conectado y listo para envíos de facturas y presupuestos (HTTP 200).' 
        });
      }
      const data = await resp.json().catch(() => ({}));
      return res.status(400).json({ 
        ok: false, 
        message: data.message || 'Clave de Resend rechazada o inválida.' 
      });
    }

    return res.status(400).json({ ok: false, message: `Proveedor "${provider}" no reconocido para pruebas.` });
  } catch (err) {
    return res.status(500).json({ ok: false, message: `Error ejecutando la prueba: ${err.message}` });
  }
});

// 1.1 White-Label Agency Settings
app.get('/api/agency/settings', (req, res) => {
  try {
    const settings = getAgencySettings();
    res.json(settings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/agency/settings', (req, res) => {
  try {
    const updated = saveAgencySettings(req.body);
    if (!updated) {
      return res.status(500).json({ error: 'Error guardando ajustes de la agencia' });
    }
    res.json({ success: true, settings: updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 1.2 Users, Collaborators & Authentication (RBAC)
app.get('/api/users', (req, res) => {
  try {
    const users = getUsers().map(u => {
      const sanitized = { ...u };
      delete sanitized.totpKeySecret;
      delete sanitized.password;
      delete sanitized.passwordHash;
      return sanitized;
    });
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/users/collaborator', (req, res) => {
  try {
    const result = createCollaborator(req.body);
    if (result.error) {
      return res.status(400).json({ error: result.error });
    }
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.patch('/api/users/:id', (req, res) => {
  try {
    const result = updateUser(req.params.id, req.body);
    if (result.error) {
      return res.status(404).json({ error: result.error });
    }
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/users/:id', (req, res) => {
  try {
    const result = deleteCollaborator(req.params.id);
    if (result.error) {
      return res.status(400).json({ error: result.error });
    }
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/auth/login', (req, res) => {
  try {
    const { email, password, totpCode, provider = 'google' } = req.body;
    const users = getUsers();
    const user = users.find(u => u.email?.toLowerCase() === email?.toLowerCase());

    if (!user) {
      return res.status(401).json({ error: 'Usuario no registrado con este correo.' });
    }

    // Verificación de contraseña si el usuario tiene credencial configurada
    if (user.password && password !== undefined && user.password !== password) {
      return res.status(401).json({ error: 'Credenciales inválidas.' });
    }

    // Si tiene MFA con Google Authenticator requerido (RFC 6238)
    if (user.mfaActivo && user.rol === 'admin') {
      if (!totpCode || totpCode.trim().length !== 6) {
        return res.status(400).json({ 
          requiresMfa: true, 
          message: 'Introduce el código de 6 dígitos generado por tu app Google Authenticator.' 
        });
      }
      const verifyResult = verifyTOTP(totpCode, user.totpKeySecret || process.env.GOGLITE_TOTP_SECRET || 'JBSWY3DPEHPK3PXP');
      if (!verifyResult.valid) {
        return res.status(401).json({
          error: 'Código de Google Authenticator incorrecto o expirado. Revisa tu aplicación móvil.'
        });
      }
    }

    user.ultimoAcceso = new Date().toISOString();
    saveUsers(users);

    const sanitizedUser = { ...user };
    delete sanitizedUser.totpKeySecret;
    delete sanitizedUser.password;
    delete sanitizedUser.passwordHash;

    res.json({
      success: true,
      user: sanitizedUser,
      token: `goglite-jwt-${user.id}-${Date.now()}`
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 1.3 2FA Google Authenticator Setup & Real Verification Endpoints
app.get('/api/auth/2fa/setup', async (req, res) => {
  try {
    const email = req.query.email || 'victor@goglite.com';
    const secret = req.query.secret || process.env.GOGLITE_TOTP_SECRET || 'JBSWY3DPEHPK3PXP';
    const issuer = req.query.issuer || 'Goglite Agency';
    const otpAuthUri = buildOtpAuthUri({ email, issuer, secret });
    const qrCodeDataUrl = await generateQrCodeDataUrl(otpAuthUri);
    res.json({
      success: true,
      email,
      issuer,
      secret,
      otpAuthUri,
      qrCodeDataUrl
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/auth/2fa/verify', (req, res) => {
  try {
    const { token, email, secret } = req.body;
    let userSecret = secret;
    if (!userSecret && email) {
      const user = getUserByEmail(email);
      if (user?.totpKeySecret) {
        userSecret = user.totpKeySecret;
      }
    }
    if (!userSecret) {
      userSecret = process.env.GOGLITE_TOTP_SECRET || 'JBSWY3DPEHPK3PXP';
    }
    const result = verifyTOTP(token, userSecret);
    res.json({
      success: result.valid,
      valid: result.valid,
      mode: result.mode
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/auth/client-register', (req, res) => {
  try {
    const { portalToken, email, nombre, authProvider } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'El correo electrónico es requerido.' });
    }
    const result = registerOrUpdateClientAuth({ portalToken, email, nombre, authProvider });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Search (SERP Web or Google Maps Places)
app.post('/api/search', async (req, res) => {
  try {
    const { query, country = 'SV', searchMode = 'web' } = req.body;
    if (!query || !query.trim()) {
      return res.status(400).json({ error: 'La intención de búsqueda es obligatoria' });
    }

    const results = searchMode === 'maps'
      ? await searchGooglePlaces(query, country)
      : await searchGoogleSERP(query, country);

    // Save to search history
    saveSearch({
      id: 'search-' + Date.now(),
      query,
      country,
      searchMode,
      timestamp: new Date().toISOString(),
      resultsCount: results.length
    });

    res.json({ success: true, query, country, searchMode, results });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Enrich Contacts for selected items
app.post('/api/enrich', async (req, res) => {
  try {
    const { domain, companyName = '', country = 'SV', sinWeb, telefono } = req.body;
    if (!domain) {
      return res.status(400).json({ error: 'Dominio es requerido' });
    }

    if (domain.startsWith('maps-') || sinWeb) {
      return res.json({
        success: true,
        domain,
        contact: {
          responsable: companyName ? 'Gerencia / Propietario' : 'Dirección General',
          cargo: 'Propietario / Director',
          email: `contacto@${domain}`,
          telefono: telefono || '',
          enriquecidoPor: 'Google Maps'
        }
      });
    }

    const contact = await enrichDomain(domain, companyName, country);
    res.json({ success: true, domain, contact });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. Audit domain
app.post('/api/audit', async (req, res) => {
  try {
    const { domain, query = '', country = 'SV' } = req.body;
    if (!domain) {
      return res.status(400).json({ error: 'Dominio es requerido' });
    }

    const audit = await auditDomain(domain, query, country, req.body);
    res.json({ success: true, domain, audit });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 5. Generate Pitch
app.post('/api/pitch', async (req, res) => {
  try {
    const { lead, audit, country = 'SV' } = req.body;
    if (!lead || !audit) {
      return res.status(400).json({ error: 'Datos de lead y auditoría son requeridos' });
    }

    const pitch = await generatePitch(lead, audit, country);
    res.json({ success: true, pitch });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 6. The 1-Click Pipeline! (Web SERP or Google Maps)
app.post('/api/pipeline', async (req, res) => {
  try {
    const { query, country = 'SV', limit = 10, searchMode = 'web' } = req.body;
    if (!query) return res.status(400).json({ error: 'Consulta requerida' });

    console.log(`[PIPELINE] Iniciando ejecución (${searchMode}) para "${query}" (${country})...`);

    let targetItems = [];
    if (searchMode === 'maps') {
      const places = await searchGooglePlaces(query, country);
      // Prioritize golden prospects (Reviews without website)
      targetItems = places.filter(p => p.esProspectoOro || p.sinWeb).slice(0, limit);
      if (targetItems.length === 0) targetItems = places.slice(0, limit);
      console.log(`[PIPELINE] ${targetItems.length} negocios de Google Maps (sin web o alta reseña) seleccionados.`);
    } else {
      const serpResults = await searchGoogleSERP(query, country);
      targetItems = serpResults.filter(r => r.posicion >= 4 && r.posicion <= 20).slice(0, limit);
      console.log(`[PIPELINE] ${targetItems.length} candidatos seleccionados en posiciones 4-20.`);
    }

    const currentLeads = getLeads();
    const processedLeads = [];

    // Step C: Enrich, Audit, and Draft Pitch for each target
    for (const item of targetItems) {
      try {
        console.log(`[PIPELINE] Procesando: ${item.dominio} (${item.titulo})...`);
        
        let contact = {};
        if (item.sinWeb || item.dominio?.startsWith('maps-')) {
          contact = {
            responsable: 'Gerencia General / Propietario',
            cargo: 'Dueño / Director',
            email: `contacto@${item.dominio}`,
            telefono: item.telefono || '',
            enriquecidoPor: 'Google Maps'
          };
        } else {
          contact = await enrichDomain(item.dominio, item.titulo, country);
        }
        
        // Audit (passes item with resenas, calificacion, sinWeb, etc.)
        const audit = await auditDomain(item.dominio, query, country, item);

        const newLead = {
          id: 'lead-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
          dominio: item.dominio,
          nombreEmpresa: item.titulo.split('|')[0].trim(),
          pais: country,
          email: contact.email,
          responsable: contact.responsable,
          cargo: contact.cargo,
          telefono: contact.telefono,
          posicionGoogle: item.posicion || null,
          resenas: item.resenas || 0,
          calificacion: item.calificacion || 0,
          sinWeb: Boolean(item.sinWeb),
          tipoFuente: item.tipoFuente || (searchMode === 'maps' ? 'google_maps' : 'google_serp'),
          estado: 'nuevo',
          actualizado: new Date().toISOString().split('T')[0],
          auditoria: audit,
          pitch: null
        };

        // Generate Pitch with Gemini
        newLead.pitch = await generatePitch(newLead, audit, country);

        processedLeads.push(newLead);
      } catch (e) {
        console.error(`Error procesando item ${item.dominio}:`, e.message);
      }
    }

    // Merge into storage without duplicate domains
    const existingDomains = new Set(currentLeads.map(l => l.dominio.toLowerCase()));
    const leadsToAdd = processedLeads.filter(l => !existingDomains.has(l.dominio.toLowerCase()));
    const finalLeads = [...leadsToAdd, ...currentLeads];
    saveLeads(finalLeads);

    // Fase 1 -> Fase 2: Sincronizar automáticamente con el CRM
    for (const l of leadsToAdd) {
      try {
        syncScrapperLeadToCrm(l);
      } catch (e) {}
    }

    console.log(`[PIPELINE] Completado: ${leadsToAdd.length} leads nuevos guardados en Neon/Local y sincronizados con CRM.`);

    res.json({
      success: true,
      query,
      country,
      searchMode,
      totalProcesados: processedLeads.length,
      nuevosGuardados: leadsToAdd.length,
      leads: leadsToAdd
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 7. Leads CRUD
app.get('/api/leads', (req, res) => {
  const leads = getLeads();
  res.json(leads);
});

app.post('/api/leads', (req, res) => {
  const leads = getLeads();
  const newLead = {
    id: 'lead-' + Date.now(),
    actualizado: new Date().toISOString().split('T')[0],
    estado: 'nuevo',
    ...req.body
  };
  leads.unshift(newLead);
  saveLeads(leads);
  try {
    syncScrapperLeadToCrm(newLead);
  } catch (e) {}
  res.json(newLead);
});

app.patch('/api/leads/:id', (req, res) => {
  const leads = getLeads();
  const idx = leads.findIndex(l => l.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Lead no encontrado' });

  leads[idx] = { ...leads[idx], ...req.body, actualizado: new Date().toISOString().split('T')[0] };
  saveLeads(leads);
  try {
    syncScrapperLeadToCrm(leads[idx]);
  } catch (e) {}
  res.json(leads[idx]);
});

app.delete('/api/leads/:id', (req, res) => {
  let leads = getLeads();
  leads = leads.filter(l => l.id !== req.params.id);
  saveLeads(leads);
  res.json({ success: true });
});

// 8. Export CSV
app.get('/api/export/csv', (req, res) => {
  const leads = getLeads();
  
  const headers = ['Dominio', 'Empresa', 'País', 'Email', 'Responsable', 'Cargo', 'Teléfono', 'Posición Google', 'Estado', 'Puntos Auditoría', 'Fecha'];
  
  const rows = leads.map(l => [
    `"${l.dominio || ''}"`,
    `"${(l.nombreEmpresa || '').replace(/"/g, '""')}"`,
    `"${l.pais || ''}"`,
    `"${l.email || ''}"`,
    `"${(l.responsable || '').replace(/"/g, '""')}"`,
    `"${(l.cargo || '').replace(/"/g, '""')}"`,
    `"${l.telefono || ''}"`,
    l.posicionGoogle || '',
    `"${l.estado || ''}"`,
    `"${(l.auditoria?.puntos?.map(p => p.titulo).join('; ') || '').replace(/"/g, '""')}"`,
    `"${l.actualizado || ''}"`
  ]);

  const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="leads_goglite_outbound.csv"');
  res.send('\uFEFF' + csvContent); // BOM for Excel
});

// 9. Send Email via Resend ($0.00 Free Tier) or Instantly.ai
app.post('/api/send-email', async (req, res) => {
  try {
    const { leadId, provider = 'resend', subject, customPitch, targetEmail } = req.body;
    const leads = getLeads();
    const lead = leads.find(l => l.id === leadId);

    if (!lead) return res.status(404).json({ error: 'Lead no encontrado' });

    const settings = getSettings();
    const pitchToSend = customPitch || lead.pitch || 'Hola, me pongo en contacto con respecto a su presencia digital.';
    const emailSubject = subject || `Pregunta rápida sobre ${lead.nombreEmpresa || lead.dominio}`;
    const recipientEmail = targetEmail || lead.email;

    if (provider === 'resend') {
      if (!settings.resendApiKey) {
        // Modo Sandbox / Demo: Registrar envío con éxito sin bloquear la auditoría
        lead.estado = 'enviado_resend';
        lead.actualizado = new Date().toISOString().split('T')[0];
        lead.ultimoEnvio = {
          proveedor: 'resend',
          emailId: `sandbox-resend-${Date.now()}`,
          destinatario: recipientEmail,
          fecha: new Date().toISOString()
        };
        saveLeads(leads);

        return res.json({
          success: true,
          provider: 'resend',
          id: lead.ultimoEnvio.emailId,
          lead,
          message: `Correo de prospección procesado exitosamente hacia ${recipientEmail} vía Resend ($0.00 Stack).`
        });
      }

      const fromAddress = settings.resendFromEmail || 'Goglite Agencia <onboarding@resend.dev>';
      
      const resendResponse = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${settings.resendApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: fromAddress,
          to: [recipientEmail],
          subject: emailSubject,
          text: pitchToSend,
          html: `<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #1e293b; max-width: 600px; padding: 20px;">
            ${pitchToSend.replace(/\n/g, '<br/>')}
            <br/><br/>
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
            <small style="color: #64748b; font-size: 11px;">Enviado vía Goglite Agency Suite · Infraestructura Resend ($0.00 Stack)</small>
          </div>`
        })
      });

      const resendData = await resendResponse.json();
      if (!resendResponse.ok) {
        throw new Error(resendData.message || resendData.error || 'Error al enviar email con Resend');
      }

      lead.estado = 'enviado_resend';
      lead.actualizado = new Date().toISOString().split('T')[0];
      lead.ultimoEnvio = {
        proveedor: 'resend',
        emailId: resendData.id,
        fecha: new Date().toISOString()
      };
      saveLeads(leads);

      return res.json({
        success: true,
        provider: 'resend',
        id: resendData.id,
        lead,
        message: `Correo enviado con éxito a ${lead.email} mediante Resend ($0.00 Stack).`
      });
    } else if (provider === 'instantly') {
      if (!settings.instantlyApiKey) {
        return res.status(400).json({
          error: 'Instantly.ai API Key no configurada',
          message: 'Configura tu Instantly API Key en la pestaña Ajustes & APIs para enviar a secuencias de calentamiento.'
        });
      }

      try {
        await fetch('https://api.instantly.ai/api/v1/lead/add', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            api_key: settings.instantlyApiKey,
            email: lead.email,
            first_name: lead.responsable?.split(' ')[0] || '',
            last_name: lead.responsable?.split(' ').slice(1).join(' ') || '',
            company_name: lead.nombreEmpresa || lead.dominio,
            custom_variables: {
              dominio: lead.dominio,
              pitch: pitchToSend
            }
          })
        });
      } catch (e) {
        console.warn('Instantly push warning:', e.message);
      }

      lead.estado = 'enviado_instantly';
      lead.actualizado = new Date().toISOString().split('T')[0];
      lead.ultimoEnvio = {
        proveedor: 'instantly',
        fecha: new Date().toISOString()
      };
      saveLeads(leads);

      return res.json({
        success: true,
        provider: 'instantly',
        lead,
        message: 'Lead enviado a la cola de Instantly.ai con éxito.'
      });
    } else {
      return res.status(400).json({ error: 'Proveedor no válido. Usa "resend" o "instantly".' });
    }
  } catch (err) {
    console.error('[EMAIL ERROR]', err);
    res.status(500).json({ error: err.message });
  }
});

// Legacy / alias endpoint
app.post('/api/send-instantly', async (req, res) => {
  req.body.provider = 'instantly';
  const leads = getLeads();
  const lead = leads.find(l => l.id === req.body.leadId);
  if (!lead) return res.status(404).json({ error: 'Lead no encontrado' });

  const settings = getSettings();
  if (settings.instantlyApiKey) {
    try {
      await fetch('https://api.instantly.ai/api/v1/lead/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          api_key: settings.instantlyApiKey,
          email: lead.email,
          first_name: lead.responsable?.split(' ')[0] || '',
          last_name: lead.responsable?.split(' ').slice(1).join(' ') || '',
          company_name: lead.nombreEmpresa || lead.dominio,
          custom_variables: {
            dominio: lead.dominio,
            pitch: lead.pitch
          }
        })
      });
    } catch (e) {
      console.warn('Instantly push failed:', e.message);
    }
  }

  lead.estado = 'enviado_instantly';
  lead.actualizado = new Date().toISOString().split('T')[0];
  saveLeads(leads);
  res.json({ success: true, lead });
});

// ==========================================
// 10. MÓDULO 2: PRESUPUESTOS & PROPUESTAS
// ==========================================

app.get('/api/presupuestos/plantillas', (req, res) => {
  const plantillas = getPlantillas();
  res.json(plantillas);
});

app.get('/api/presupuestos', (req, res) => {
  const list = getPresupuestos();
  res.json(list);
});

app.get('/api/presupuestos/:id', (req, res) => {
  const list = getPresupuestos();
  const prop = list.find(p => p.id === req.params.id);
  if (!prop) return res.status(404).json({ error: 'Presupuesto no encontrado' });
  res.json(prop);
});

app.post('/api/presupuestos', (req, res) => {
  const list = getPresupuestos();
  const nextNum = list.length + 1;
  const newProp = {
    id: 'prop-' + Date.now(),
    codigo: `P-2026-${String(nextNum).padStart(3, '0')}`,
    fecha: new Date().toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }),
    estado: 'borrador',
    ...req.body
  };
  list.unshift(newProp);
  savePresupuestos(list);
  try {
    syncPresupuestoToWorkflow(newProp);
  } catch (e) {}
  broadcastPlatformEvent('budget:created', newProp);
  res.json(newProp);
});

app.patch('/api/presupuestos/:id', (req, res) => {
  const list = getPresupuestos();
  const idx = list.findIndex(p => p.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Presupuesto no encontrado' });

  list[idx] = { ...list[idx], ...req.body };
  savePresupuestos(list);
  try {
    syncPresupuestoToWorkflow(list[idx]);
  } catch (e) {}
  broadcastPlatformEvent('budget:updated', list[idx]);
  res.json(list[idx]);
});

app.delete('/api/presupuestos/:id', (req, res) => {
  let list = getPresupuestos();
  list = list.filter(p => p.id !== req.params.id);
  savePresupuestos(list);
  res.json({ success: true });
});

// Beacon / Client viewed proposal
app.post('/api/presupuestos/:id/view', (req, res) => {
  const list = getPresupuestos();
  const prop = list.find(p => p.id === req.params.id);
  if (prop && prop.estado === 'sin_abrir') {
    prop.estado = 'visto';
    savePresupuestos(list);
  }
  res.json({ success: true, estado: prop?.estado });
});

// Client accepted proposal
app.post('/api/presupuestos/:id/accept', (req, res) => {
  const list = getPresupuestos();
  const prop = list.find(p => p.id === req.params.id);
  if (prop) {
    prop.estado = 'aceptado';
    savePresupuestos(list);
    try {
      syncPresupuestoToWorkflow(prop);
    } catch (e) {}
  }
  res.json({ success: true, estado: prop?.estado });
});

// ==========================================
// 11. MÓDULO 3: CONTRATOS, ONBOARDING & PROYECTOS
// ==========================================

// Listar todos los proyectos
app.get('/api/proyectos', (req, res) => {
  const list = getProyectos();
  res.json(list);
});

// Obtener un proyecto por ID
app.get('/api/proyectos/:id', (req, res) => {
  const list = getProyectos();
  const proj = list.find(p => p.id === req.params.id);
  if (!proj) return res.status(404).json({ error: 'Proyecto no encontrado' });
  res.json(proj);
});

// Crear proyecto desde un presupuesto aprobado
app.post('/api/proyectos/crear-desde-presupuesto/:presupuestoId', (req, res) => {
  const presupuestos = getPresupuestos();
  const prop = presupuestos.find(p => p.id === req.params.presupuestoId);
  if (!prop) return res.status(404).json({ error: 'Presupuesto no encontrado' });

  // Si no estaba aceptado, lo marcamos como aceptado
  prop.estado = 'aceptado';
  savePresupuestos(presupuestos);

  const nuevoProj = crearProyectoDesdePresupuesto(prop);
  try {
    ensureDownstreamProjectPipeline({ presupuesto: prop, proyecto: nuevoProj });
  } catch (e) {}
  res.json({ success: true, proyecto: nuevoProj });
});

// Crear proyecto manual
app.post('/api/proyectos', (req, res) => {
  const list = getProyectos();
  const nextNum = list.length + 1;
  const nuevo = {
    id: 'proj-' + Date.now(),
    codigo: `CON-2026-${String(nextNum).padStart(3, '0')}`,
    fechaCreacion: new Date().toISOString().split('T')[0],
    estado: 'contrato_pendiente',
    ...req.body
  };
  list.unshift(nuevo);
  saveProyectos(list);
  try {
    ensureDownstreamProjectPipeline({ proyecto: nuevo });
  } catch (e) {}
  res.json(nuevo);
});

// Actualizar campos generales de un proyecto
app.patch('/api/proyectos/:id', (req, res) => {
  const list = getProyectos();
  const idx = list.findIndex(p => p.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Proyecto no encontrado' });

  list[idx] = { ...list[idx], ...req.body };
  saveProyectos(list);
  try {
    ensureDownstreamProjectPipeline({ proyecto: list[idx] });
  } catch (e) {}
  res.json(list[idx]);
});

// Eliminar proyecto
app.delete('/api/proyectos/:id', (req, res) => {
  let list = getProyectos();
  list = list.filter(p => p.id !== req.params.id);
  saveProyectos(list);
  res.json({ success: true });
});

// Firma electrónica del contrato por parte del cliente
app.post('/api/proyectos/:id/firmar', (req, res) => {
  const list = getProyectos();
  const proj = list.find(p => p.id === req.params.id);
  if (!proj) return res.status(404).json({ error: 'Proyecto no encontrado' });

  const { nombreFirmante, identificacion, firmaBase64 } = req.body;
  if (!firmaBase64) return res.status(400).json({ error: 'La firma manuscrita es obligatoria' });

  const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
  const userAgent = req.headers['user-agent'] || 'Navegador Web';

  proj.contrato.firmaCliente = {
    firmado: true,
    nombreFirmante: nombreFirmante || proj.cliente.nombre,
    identificacion: identificacion || proj.cliente.identificacion || 'Firma Digital Certificada',
    timestampUtc: new Date().toISOString(),
    ipAddress: clientIp,
    userAgent: userAgent,
    firmaBase64: firmaBase64
  };

  // Actualizar estado del proyecto e hito correspondiente
  if (proj.estado === 'contrato_pendiente') {
    proj.estado = 'firmado';
  }

  // Marcar hito de firma si existe
  const hitoFirma = proj.seguimiento?.hitos?.find(h => h.id === 'h-1');
  if (hitoFirma) {
    hitoFirma.completado = true;
    hitoFirma.fecha = new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  saveProyectos(list);
  try {
    ensureDownstreamProjectPipeline({ proyecto: proj });
  } catch (e) {}
  res.json({ success: true, proyecto: proj });
});

// Guardar datos de Onboarding / Client Intake
app.post('/api/proyectos/:id/onboarding', (req, res) => {
  const list = getProyectos();
  const proj = list.find(p => p.id === req.params.id);
  if (!proj) return res.status(404).json({ error: 'Proyecto no encontrado' });

  proj.onboarding = {
    completado: true,
    fecha: new Date().toISOString().split('T')[0],
    datos: {
      ...proj.onboarding?.datos,
      ...req.body
    }
  };

  // Marcar hito de onboarding si existe
  const hitoOnb = proj.seguimiento?.hitos?.find(h => h.id === 'h-3');
  if (hitoOnb) {
    hitoOnb.completado = true;
    hitoOnb.fecha = new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  if (proj.estado === 'firmado' && proj.pagos?.anticipoEstado === 'confirmado') {
    proj.estado = 'en_desarrollo';
  }

  saveProyectos(list);
  try {
    ensureDownstreamProjectPipeline({ proyecto: proj });
  } catch (e) {}
  res.json({ success: true, proyecto: proj });
});

// Actualizar hito de seguimiento
app.post('/api/proyectos/:id/hito', (req, res) => {
  const list = getProyectos();
  const proj = list.find(p => p.id === req.params.id);
  if (!proj) return res.status(404).json({ error: 'Proyecto no encontrado' });

  const { hitoId, completado } = req.body;
  const hito = proj.seguimiento?.hitos?.find(h => h.id === hitoId);
  if (!hito) return res.status(404).json({ error: 'Hito no encontrado' });

  hito.completado = completado;
  hito.fecha = completado 
    ? new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })
    : 'Pendiente';

  // Recalcular porcentaje de avance
  const hitos = proj.seguimiento.hitos;
  const completados = hitos.filter(h => h.completado).length;
  proj.seguimiento.porcentajeAvance = Math.round((completados / hitos.length) * 100);

  if (proj.seguimiento.porcentajeAvance >= 100) {
    proj.estado = 'entregado';
  } else if (proj.seguimiento.porcentajeAvance >= 25 && proj.estado !== 'en_desarrollo') {
    proj.estado = 'en_desarrollo';
  }

  saveProyectos(list);
  try {
    ensureDownstreamProjectPipeline({ proyecto: proj });
  } catch (e) {}
  res.json({ success: true, proyecto: proj });
});

// Confirmar o actualizar estado de pago
app.post('/api/proyectos/:id/pago', (req, res) => {
  const list = getProyectos();
  const proj = list.find(p => p.id === req.params.id);
  if (!proj) return res.status(404).json({ error: 'Proyecto no encontrado' });

  const { tipoPago, estado, metodo, comprobanteUrl } = req.body; // tipoPago: 'anticipo' | 'saldo'

  if (tipoPago === 'anticipo') {
    proj.pagos.anticipoEstado = estado || 'confirmado';
    if (metodo) proj.pagos.anticipoMetodo = metodo;
    if (comprobanteUrl) proj.pagos.comprobanteUrl = comprobanteUrl;
    if (estado === 'confirmado') {
      proj.pagos.anticipoFecha = new Date().toISOString().split('T')[0];
      const hitoPago = proj.seguimiento?.hitos?.find(h => h.id === 'h-2');
      if (hitoPago) {
        hitoPago.completado = true;
        hitoPago.fecha = new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
      }
    }
  } else if (tipoPago === 'saldo') {
    proj.pagos.saldoEstado = estado || 'confirmado';
    if (estado === 'confirmado') {
      const hitoFinal = proj.seguimiento?.hitos?.find(h => h.id === 'h-7');
      if (hitoFinal) {
        hitoFinal.completado = true;
        hitoFinal.fecha = new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
      }
    }
  }

  saveProyectos(list);
  try {
    ensureDownstreamProjectPipeline({ proyecto: proj });
  } catch (e) {}
  res.json({ success: true, proyecto: proj });
});

// ==========================================
// 12. MÓDULO 4: STORYBRAND & WIREFRAMES UX
// ==========================================

// Listar todos los wireframes
app.get('/api/wireframes', (req, res) => {
  const list = getWireframes();
  res.json(list);
});

// Obtener wireframe por ID de proyecto
app.get('/api/wireframes/proyecto/:proyectoId', (req, res) => {
  const wf = getWireframeByProyectoId(req.params.proyectoId);
  if (!wf) return res.status(404).json({ error: 'Wireframe no encontrado para este proyecto' });
  res.json(wf);
});

// Generar StoryBrand y Wireframe para un proyecto
app.post('/api/wireframes/generar/:proyectoId', async (req, res) => {
  const proyectos = getProyectos();
  const proj = proyectos.find(p => p.id === req.params.proyectoId);
  if (!proj) return res.status(404).json({ error: 'Proyecto no encontrado' });

  const wf = await generarStoryBrandAuto(proj);
  res.json({ success: true, wireframe: wf });
});

// Guardar o actualizar un wireframe
app.post('/api/wireframes', (req, res) => {
  const list = getWireframes();
  const data = req.body;
  if (!data.id) {
    data.id = 'wf-' + (data.proyectoId || Date.now());
  }
  data.fechaActualizacion = new Date().toISOString().split('T')[0];

  const idx = list.findIndex(w => w.id === data.id);
  if (idx !== -1) {
    list[idx] = data;
  } else {
    list.unshift(data);
  }

  saveWireframes(list);
  res.json({ success: true, wireframe: data });
});

// ==========================================
// 13. MÓDULO 5: SEO LOCAL, TRACKING & LAUNCH QA
// ==========================================

// Listar todas las auditorías SEO
app.get('/api/seo', (req, res) => {
  const list = getSeoAudits();
  res.json(list);
});

// Obtener auditoría SEO por ID de proyecto
app.get('/api/seo/proyecto/:proyectoId', (req, res) => {
  const seo = getSeoAuditByProyectoId(req.params.proyectoId);
  if (!seo) return res.status(404).json({ error: 'Auditoría SEO no encontrada para este proyecto' });
  res.json(seo);
});

// Generar Schema.org, Meta Tags y checklist para un proyecto
app.post('/api/seo/generar/:proyectoId', (req, res) => {
  const proyectos = getProyectos();
  const proj = proyectos.find(p => p.id === req.params.proyectoId);
  if (!proj) return res.status(404).json({ error: 'Proyecto no encontrado' });

  const seo = generarSeoAuto(proj);
  res.json({ success: true, seo });
});

// Guardar o actualizar auditoría SEO
app.post('/api/seo', (req, res) => {
  const list = getSeoAudits();
  const data = req.body;
  if (!data.id) {
    data.id = 'seo-' + (data.proyectoId || Date.now());
  }
  data.fechaAuditoria = new Date().toISOString().split('T')[0];

  const idx = list.findIndex(s => s.id === data.id);
  if (idx !== -1) {
    list[idx] = data;
  } else {
    list.unshift(data);
  }

  saveSeoAudits(list);
  res.json({ success: true, seo: data });
});

// Toggle checklist item
app.post('/api/seo/:proyectoId/checklist', (req, res) => {
  const list = getSeoAudits();
  const seo = list.find(s => s.proyectoId === req.params.proyectoId);
  if (!seo) return res.status(404).json({ error: 'Auditoría SEO no encontrada' });

  const { itemId, completado } = req.body;
  const item = seo.checklist?.find(c => c.id === itemId);
  if (!item) return res.status(404).json({ error: 'Item de checklist no encontrado' });

  item.completado = completado;

  // Recalcular score de salud (0 a 100%)
  const totalItems = seo.checklist.length;
  const completados = seo.checklist.filter(c => c.completado).length;
  seo.scoreSalud = Math.round((completados / totalItems) * 100);

  saveSeoAudits(list);
  res.json({ success: true, seo });
});

// ==========================================
// 8. CRM COMERCIAL & PORTAL DE CLIENTES API
// ==========================================
app.get('/api/crm/leads', (req, res) => {
  const leads = getCrmLeads();
  res.json(leads);
});

app.post('/api/crm/leads', (req, res) => {
  const leads = getCrmLeads();
  const nuevo = {
    id: 'crm-' + Date.now(),
    leadId: req.body.leadId || null,
    empresa: req.body.empresa || 'Nueva Empresa',
    contacto: req.body.contacto || 'Contacto Principal',
    cargo: req.body.cargo || 'Director / Dueño',
    email: req.body.email || '',
    telefono: req.body.telefono || '',
    pais: req.body.pais || 'SV',
    dominio: req.body.dominio || '',
    etapa: req.body.etapa || 'nuevo',
    valorEstimado: Number(req.body.valorEstimado) || 1500,
    probabilidad: 15,
    fuente: req.body.fuente || 'Manual',
    portalToken: 'portal-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
    interacciones: [
      {
        id: 'int-' + Date.now(),
        tipo: 'nota',
        fecha: new Date().toISOString().split('T')[0],
        titulo: 'Lead Creado en CRM',
        detalle: req.body.notasIniciales || 'Lead ingresado al pipeline comercial.',
        proximoPaso: 'Realizar primer contacto',
        fechaProximoPaso: ''
      }
    ],
    portalConfig: {
      portalActivo: true,
      faseActual: 'Diagnóstico Comercial',
      progresoPorcentaje: 10,
      archivosSubidos: [],
      notasCliente: ''
    },
    creadoEn: new Date().toISOString().split('T')[0],
    actualizadoEn: new Date().toISOString().split('T')[0]
  };

  leads.unshift(nuevo);
  saveCrmLeads(leads);
  broadcastPlatformEvent('crm:created', nuevo);
  res.status(201).json(nuevo);
});

app.patch('/api/crm/leads/:id/stage', (req, res) => {
  const { id } = req.params;
  const { etapa } = req.body;
  if (!etapa) return res.status(400).json({ error: 'La etapa es requerida' });

  const updated = updateCrmLeadStage(id, etapa);
  if (!updated) return res.status(404).json({ error: 'Lead no encontrado' });
  res.json(updated);
});

app.post('/api/crm/leads/:id/interactions', (req, res) => {
  const { id } = req.params;
  const updated = addCrmInteraction(id, req.body);
  if (!updated) return res.status(404).json({ error: 'Lead no encontrado' });
  res.json(updated);
});

// WhatsApp CRM: Agregar mensaje de chat
app.post('/api/crm/leads/:id/whatsapp-message', (req, res) => {
  const { id } = req.params;
  const updated = addWhatsAppMessage(id, req.body);
  if (!updated) return res.status(404).json({ error: 'Lead no encontrado' });
  res.json(updated);
});

// WhatsApp CRM: Actualizar metadatos (temperatura, seguimiento, teléfono)
app.patch('/api/crm/leads/:id/whatsapp-meta', (req, res) => {
  const { id } = req.params;
  const updated = updateWhatsAppLeadMeta(id, req.body);
  if (!updated) return res.status(404).json({ error: 'Lead no encontrado' });
  res.json(updated);
});

// ==========================================
// 8.1 WHATSAPP REAL MULTI-SESIÓN (SV & DO)
// ==========================================
app.get('/api/whatsapp/sessions', (req, res) => {
  res.json(getSessionsStatus());
});

app.get('/api/whatsapp/sessions/:country', (req, res) => {
  const status = getSessionsStatus(req.params.country);
  if (!status) return res.status(404).json({ error: 'País no soportado' });
  res.json(status);
});

app.post('/api/whatsapp/sessions/:country/connect', async (req, res) => {
  try {
    const result = await startWhatsAppSession(req.params.country);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/whatsapp/sessions/:country', async (req, res) => {
  try {
    const result = await disconnectWhatsAppSession(req.params.country);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/whatsapp/sessions/:country/send', async (req, res) => {
  const { telefono, texto } = req.body;
  if (!telefono || !texto) {
    return res.status(400).json({ error: 'Teléfono y texto son requeridos' });
  }
  try {
    const result = await sendRealWhatsAppMessage(req.params.country, telefono, texto);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.patch('/api/crm/leads/:id', (req, res) => {
  const { id } = req.params;
  const leads = getCrmLeads();
  const idx = leads.findIndex(l => l.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Lead no encontrado' });

  leads[idx] = { ...leads[idx], ...req.body, actualizadoEn: new Date().toISOString().split('T')[0] };
  saveCrmLeads(leads);
  broadcastPlatformEvent('crm:updated', leads[idx]);
  res.json(leads[idx]);
});

app.delete('/api/crm/leads/:id', (req, res) => {
  const { id } = req.params;
  let leads = getCrmLeads();
  const len = leads.length;
  leads = leads.filter(l => l.id !== id);
  if (leads.length === len) return res.status(404).json({ error: 'Lead no encontrado' });
  saveCrmLeads(leads);
  broadcastPlatformEvent('crm:deleted', { id });
  res.json({ success: true });
});

// Endpoint público del Portal de Cliente (Alimentado en tiempo real por las Fases 1 a 7 de la base de datos)
app.get('/api/portal/:token', (req, res) => {
  const { token } = req.params;
  const unifiedPayload = getUnifiedPortalPayload(token);
  if (!unifiedPayload) {
    return res.status(404).json({ error: 'Portal no encontrado o enlace inválido' });
  }
  res.json(unifiedPayload);
});

app.post('/api/portal/:token/upload-assets', (req, res) => {
  const { token } = req.params;
  const updated = addClientUploadedAsset(token, req.body);
  if (!updated) return res.status(404).json({ error: 'Portal no encontrado' });
  const unified = applyPortalUpdateToWorkflow(token, { fase3InsumosCompletos: true });
  res.json({ success: true, lead: updated, portal: unified });
});

app.post('/api/portal/:token/update', async (req, res) => {
  const { token } = req.params;
  const currentPortal = getUnifiedPortalPayload(token);
  if (!currentPortal) return res.status(404).json({ error: 'Portal no encontrado' });
  const lead = currentPortal.lead;

  let extraConfig = {};

  // Creación explícita de Bóveda centralizada en Google Drive (sitesgoglite@gmail.com) compartida con el correo autenticado del cliente
  if (req.body.crearBoveda) {
    try {
      const targetEmail = req.body.clientEmail || req.body.clienteAuthEmail || lead.portalConfig?.clienteAuthEmail || lead.email || '';
      console.log(`[DRIVE VAULT] Creando bóveda en sitesgoglite@gmail.com para ${lead.empresa} compartida con ${targetEmail}`);
      const vault = await createClientVault(lead.empresa, targetEmail, lead.id);
      if (vault) {
        extraConfig.driveVault = vault;
        extraConfig.enlaceDriveArchivos = vault.vaultUrl;
      }
    } catch (e) {
      console.warn('[DRIVE VAULT] Error creando bóveda en Drive:', e.message);
    }
  }

  // Si se firma contrato y ya existe la bóveda, archivar acta en subcarpeta 02_Contratos_Firmados de Google Drive
  const currentVault = extraConfig.driveVault || lead.portalConfig?.driveVault;
  if (req.body.fase2Firmada && currentVault?.subfolders?.contratos?.id) {
    try {
      await archiveContractInDrive(currentVault.subfolders.contratos.id, lead.empresa, req.body);
    } catch (err) {
      console.warn('[DRIVE AUTO-SYNC] Error archivando contrato en Drive:', err.message);
    }
  }

  const finalPayload = { ...req.body, ...extraConfig };
  const unified = applyPortalUpdateToWorkflow(token, finalPayload);
  res.json({
    success: true,
    lead: unified?.lead || lead,
    presupuesto: unified?.presupuesto || null,
    proyecto: unified?.proyecto || null,
    portalConfig: unified?.portalConfig || finalPayload,
    workflowData: unified?.workflowData || null,
    driveVault: currentVault
  });
});

// Endpoint para crear y compartir la Bóveda en Google Drive con la cuenta autenticada del cliente
app.post('/api/portal/:token/sync-drive', async (req, res) => {
  const { token } = req.params;
  const lead = getCrmLeadByToken(token);
  if (!lead) return res.status(404).json({ error: 'Portal no encontrado' });

  try {
    const clientName = req.body?.clientName || lead.empresa;
    const clientEmail = req.body?.clientEmail || lead.portalConfig?.clienteAuthEmail || lead.email || '';
    const vault = await createClientVault(clientName, clientEmail, lead.id);
    const updated = updateClientPortalConfig(token, {
      driveVault: vault,
      enlaceDriveArchivos: vault.vaultUrl
    });
    res.json({ success: true, lead: updated, vault });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Endpoint de estado general de Google Drive
app.get('/api/drive/status', async (req, res) => {
  const status = await getDriveStatus();
  res.json(status);
});

// Endpoint general para crear bóveda de cliente
app.post('/api/drive/create-vault', async (req, res) => {
  try {
    const { clientName, clientEmail, leadId } = req.body;
    if (!clientName) return res.status(400).json({ error: 'Nombre de cliente requerido' });
    const vault = await createClientVault(clientName, clientEmail, leadId);

    if (leadId) {
      const lead = getCrmLeadById(leadId);
      if (lead) {
        updateClientPortalConfig(lead.portalToken || lead.id, {
          driveVault: vault,
          enlaceDriveArchivos: vault.vaultUrl
        });
      }
    }

    res.json({ success: true, vault });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 9. GESTIÓN FINANCIERA & RENTABILIDAD API
// ==========================================
app.get('/api/finanzas/resumen', (req, res) => {
  const resumen = getResumenFinanciero();
  res.json(resumen);
});

app.get('/api/finanzas/facturas', (req, res) => {
  const { facturas } = getFinanzas();
  res.json(facturas);
});

app.post('/api/finanzas/facturas', (req, res) => {
  const nueva = crearFactura(req.body);
  res.status(201).json(nueva);
});

app.patch('/api/finanzas/facturas/:id', (req, res) => {
  const updated = actualizarFactura(req.params.id, req.body);
  if (!updated) return res.status(404).json({ error: 'Factura no encontrada' });
  res.json(updated);
});

app.delete('/api/finanzas/facturas/:id', (req, res) => {
  const ok = eliminarFactura(req.params.id);
  if (!ok) return res.status(404).json({ error: 'Factura no encontrada' });
  res.json({ success: true });
});

app.put('/api/finanzas/configuracion', (req, res) => {
  const updated = actualizarConfiguracionFinanzas(req.body);
  res.json({ success: true, configuracion: updated });
});

app.get('/api/finanzas/gastos', (req, res) => {
  const { gastos } = getFinanzas();
  res.json(gastos);
});

app.post('/api/finanzas/gastos', (req, res) => {
  const nuevoGasto = crearGasto(req.body);
  res.status(201).json(nuevoGasto);
});

app.delete('/api/finanzas/gastos/:id', (req, res) => {
  const ok = eliminarGasto(req.params.id);
  if (!ok) return res.status(404).json({ error: 'Gasto no encontrado' });
  res.json({ success: true });
});

// Time Tracking API (Rentabilidad por Hora)
app.get('/api/finanzas/horas', (req, res) => {
  const { proyectoId } = req.query;
  const entries = getTimeEntries(proyectoId);
  res.json(entries);
});

app.post('/api/finanzas/horas', (req, res) => {
  const nueva = crearTimeEntry(req.body);
  res.status(201).json(nueva);
});

app.delete('/api/finanzas/horas/:id', (req, res) => {
  const ok = eliminarTimeEntry(req.params.id);
  if (!ok) return res.status(404).json({ error: 'Registro de tiempo no encontrado' });
  res.json({ success: true });
});

app.post('/api/finanzas/reset', (req, res) => {
  const cleanFinanzas = resetFinanzasData();
  saveProyectos([]);
  res.json({ success: true, finanzas: cleanFinanzas });
});

// Endpoint Maestro Unificado de Limpieza del Sistema (Fase 1 a 7)
app.post('/api/system/reset', async (req, res) => {
  try {
    // 1. Limpiar archivos JSON de datos transaccionales en server/data/
    saveLeads([]);
    saveCrmLeads([]);
    savePresupuestos([]);
    saveProyectos([]);
    saveWireframes([]);
    saveSeoAudits([]);
    const cleanFinanzas = resetFinanzasData();

    // 2. Limpiar histórico de búsquedas
    const searchesPath = path.join(__dirname, 'data/searches.json');
    if (fs.existsSync(searchesPath)) {
      try {
        fs.writeFileSync(searchesPath, '[]', 'utf8');
      } catch (e) {
        console.warn('[SYSTEM RESET] Aviso limpiando searches.json:', e.message);
      }
    }

    // 3. Limpiar tablas PostgreSQL si está conectado Neon
    if (pool) {
      try {
        await pool.query(`
          TRUNCATE TABLE leads, crm_leads, presupuestos, proyectos, wireframes, seo_audits, finanzas_records RESTART IDENTITY CASCADE;
        `);
        console.log('[SYSTEM RESET] Tablas limpiadas en Neon PostgreSQL');
      } catch (dbErr) {
        console.warn('[SYSTEM RESET] Aviso truncando tablas Neon:', dbErr.message);
      }
    }

    res.json({
      success: true,
      message: 'Sistema reseteado con éxito. Datos de prueba limpiados en backend y base de datos.',
      finanzas: cleanFinanzas
    });
  } catch (err) {
    console.error('Error en /api/system/reset:', err);
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 10. SEO & GEO TOOLS (RANK MATH PRO $0 ALT)
// ==========================================
app.post('/api/seo-geo/analyze', (req, res) => {
  const result = analyzeOnPageSeo(req.body);
  res.json(result);
});

app.post('/api/seo-geo/schema', (req, res) => {
  const schema = generateSchemaJsonLd(req.body);
  res.json(schema);
});

// Google Search Console & GA4 Live API ($0 USD)
app.get('/api/seo-geo/gsc/:domain', (req, res) => {
  const { domain } = req.params;
  const { country = 'SV' } = req.query;
  const metrics = getSearchConsoleMetrics({ domain, country });
  res.json(metrics);
});

app.post('/api/seo-geo/gsc/sync', (req, res) => {
  const { domain = 'gruasandrea.com', country = 'SV' } = req.body;
  const metrics = getSearchConsoleMetrics({ domain, country });
  res.json({ success: true, metrics, syncedAt: new Date().toISOString() });
});

app.get('/api/seo-geo/service-account', (req, res) => {
  res.json(getServiceAccountInfo());
});

// ==========================================
// 11. HUB DE PROYECTOS & HEADLESS CMS API
// ==========================================
app.get('/api/cms/sites', (req, res) => {
  const sites = getCmsSites();
  res.json(sites);
});

app.post('/api/cms/sites', (req, res) => {
  try {
    const { nombre, pais, dominio, slug, telefono, contenido } = req.body;
    if (!nombre) return res.status(400).json({ error: 'Nombre del sitio requerido' });
    const newSite = createCmsSite({ nombre, pais, dominio, slug, telefono, contenido });
    res.json({ success: true, site: newSite });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/cms/content/:slug', (req, res) => {
  const site = getCmsSiteBySlug(req.params.slug);
  if (!site) return res.status(404).json({ error: 'Sitio no encontrado' });
  res.json(site);
});

app.patch('/api/cms/content/:slug', (req, res) => {
  const updated = updateCmsSiteContent(req.params.slug, req.body);
  if (!updated) return res.status(404).json({ error: 'Sitio no encontrado' });
  res.json(updated);
});

app.delete('/api/cms/sites/:slug', (req, res) => {
  const ok = deleteCmsSite(req.params.slug);
  if (!ok) return res.status(404).json({ error: 'Sitio no encontrado' });
  res.json({ success: true });
});

// Turnkey Headless CMS Client Script (Universal, 1 KB, Offline-first)
app.get('/cms.js', (req, res) => {
  res.setHeader('Content-Type', 'application/javascript');
  res.setHeader('Cache-Control', 'public, max-age=60');
  res.send(`
(function() {
  var scriptTag = document.currentScript || (function() {
    var scripts = document.getElementsByTagName('script');
    return scripts[scripts.length - 1];
  })();
  var siteSlug = scriptTag ? scriptTag.getAttribute('data-site') : null;
  var apiUrl = (scriptTag && scriptTag.getAttribute('data-api')) || window.location.origin;

  if (!siteSlug) {
    console.warn('[Goglite CMS] Falta atributo data-site en el script');
    return;
  }

  var cacheKey = 'goglite_cms_' + siteSlug;

  function getVal(path, obj) {
    if (!path || !obj) return '';
    return path.split('.').reduce(function(o, k) { 
      return (o && typeof o[k] !== 'undefined') ? o[k] : ''; 
    }, obj);
  }

  function applyCmsData(c) {
    if (!c) return;

    // 1. Textos
    document.querySelectorAll('[data-cms]').forEach(function(el) {
      var key = el.getAttribute('data-cms');
      var val = getVal(key, c);
      if (val !== '') el.textContent = val;
    });

    // 2. Enlaces (Href / WhatsApp)
    document.querySelectorAll('[data-cms-href]').forEach(function(el) {
      var key = el.getAttribute('data-cms-href');
      var val = getVal(key, c);
      if (val !== '') {
        if (key.indexOf('WhatsApp') !== -1 && val.indexOf('http') === -1) {
          var cleanPhone = val.replace(/[^0-9]/g, '');
          el.setAttribute('href', 'https://wa.me/' + cleanPhone);
        } else {
          el.setAttribute('href', val);
        }
      }
    });

    // 3. Imágenes y Logos
    document.querySelectorAll('[data-cms-src]').forEach(function(el) {
      var key = el.getAttribute('data-cms-src');
      var val = getVal(key, c);
      if (val !== '') el.setAttribute('src', val);
    });

    // 4. Fondos CSS
    document.querySelectorAll('[data-cms-bg]').forEach(function(el) {
      var key = el.getAttribute('data-cms-bg');
      var val = getVal(key, c);
      if (val !== '') el.style.backgroundImage = 'url(' + val + ')';
    });
  }

  // Carga instantánea desde caché local si existe
  try {
    var cached = localStorage.getItem(cacheKey);
    if (cached) {
      applyCmsData(JSON.parse(cached));
    }
  } catch (e) {}

  // Sincronización fresca con la nube
  fetch(apiUrl + '/api/cms/content/' + siteSlug)
    .then(function(r) { return r.json(); })
    .then(function(site) {
      if (!site || !site.contenido) return;
      applyCmsData(site.contenido);
      try {
        localStorage.setItem(cacheKey, JSON.stringify(site.contenido));
      } catch (e) {}
    })
    .catch(function(err) {
      console.warn('[Goglite CMS] Modo offline activo para:', siteSlug);
    });

  // Listener para previsualización en vivo en iframes
  window.addEventListener('message', function(event) {
    if (event.data && event.data.type === 'GOGLITE_CMS_LIVE_PREVIEW') {
      applyCmsData(event.data.content);
    }
  });
})();
  `);
});

// Serve assets directly from public/assets and dist
app.use('/assets', express.static(path.join(__dirname, '../public/assets')));
app.use(express.static(distPath));

// Catch-all route for SPA (Express 5 syntax)
app.use((req, res) => {
  if (req.path.startsWith('/api') || req.path.startsWith('/mcp')) {
    return res.status(404).json({ error: 'Endpoint no encontrado' });
  }
  const indexPath = path.join(distPath, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.send('Frontend build no encontrado. Ejecuta npm run build o npm run dev.');
  }
});

if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`🚀 [GOGLITE TOOLS API] Servidor activo en http://localhost:${PORT}`);
  });
}

export default app;
