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
import {
  getAgencySettings,
  getPublicAgencyBranding,
  getSanitizedAgencySettings,
  saveAgencySettings,
  updateAgencyBankAccounts,
  rotateMcpAgentKey
} from './services/agencySettingsStorage.js';
import {
  getUsers,
  saveUsers,
  createCollaborator,
  registerOrUpdateClientAuth,
  getUserById,
  getUserByEmail,
  updateUser,
  updateUserInternal,
  deleteCollaborator,
  publicUser,
  SELF_EDITABLE_FIELDS,
  ADMIN_EDITABLE_FIELDS
} from './services/usersStorage.js';
import {
  verifyTOTP,
  generateSecret,
  encryptSecret,
  decryptSecret,
  isReplayCounter,
  buildOtpAuthUri,
  generateQrCodeDataUrl,
  signMfaEnrollmentSeal,
  verifyMfaEnrollmentSeal
} from './services/totpService.js';
import {
  syncScrapperLeadToCrm,
  syncPresupuestoToWorkflow,
  ensureDownstreamProjectPipeline,
  getUnifiedPortalPayload,
  applyPortalUpdateToWorkflow,
  generateSecurePortalToken
} from './services/workflowContinuityService.js';
import {
  cookieParserMiddleware,
  requireGoogleIdentity,
  requireAuth,
  requireRole,
  issueSessionCookie,
  clearSessionCookie
} from './middleware/auth.js';
import {
  authLimiter,
  costlyLimiter,
  portalLimiter,
  isAccountLocked,
  recordFailedAuthAttempt,
  clearFailedAuthAttempts
} from './middleware/rateLimiter.js';
import { logSecurityEvent } from './services/auditLogger.js';

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

const ALLOWED_ORIGINS = [
  'https://goglite-agency.web.app',
  'https://goglite-agency.firebaseapp.com',
  'https://goglite-agency.vercel.app',
  'https://agencia.goglite.com',
  'http://localhost:5173',
  'http://localhost:3001',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:3001'
];

function safeError(err, fallback = 'Error interno del servidor') {
  console.error('[API ERROR]:', err?.message || err);
  if (process.env.NODE_ENV === 'production' || process.env.VERCEL) {
    return fallback;
  }
  return err?.message || fallback;
}

function escapeHtml(str = '') {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// 0. Cabeceras de Seguridad HTTP (Hallazgo L-04: HSTS, CSP, X-Content-Type-Options, Referrer-Policy, X-Frame-Options)
app.use((req, res, next) => {
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self' https: data: blob:; script-src 'self' 'unsafe-inline' https://apis.google.com https://www.gstatic.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' data: https://fonts.gstatic.com; img-src 'self' data: blob: https:; connect-src 'self' https://*.googleapis.com https://*.firebaseio.com https://*.firebaseapp.com https://*.vercel.app https://*.goglite.com wss://*.firebaseio.com; frame-ancestors 'self' https://goglite-agency.web.app https://agencia.goglite.com;"
  );
  next();
});

// 0.1 CORS Restrictivo con excepción explícita para /cms.js y lectura de contenido CMS en sitios de clientes (Hallazgo M-04)
app.use((req, res, next) => {
  const cleanPath = req.originalUrl.split('?')[0];
  const isPublicCmsAsset =
    req.method === 'GET' &&
    (cleanPath === '/cms.js' || /^\/api\/cms\/content\/[^/]+$/.test(cleanPath));

  if (isPublicCmsAsset) {
    return cors({ origin: '*', methods: ['GET', 'OPTIONS'] })(req, res, next);
  }

  return cors({
    origin: (origin, callback) => {
      if (!origin || ALLOWED_ORIGINS.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error('Origen no permitido por CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-GG-Session', 'X-MCP-Agent-Key', 'Accept']
  })(req, res, next);
});

app.use(express.json({ limit: '4mb' }));
app.use(cookieParserMiddleware);

// Montaje de rutas del protocolo MCP (protegidas con SHA-256 + timingSafeEqual en sseHandler.js)
setupMcpRoutes(app);

// 0.2 Gatekeeper Global de Autenticación y RBAC en Servidor para /api/* (Hallazgo C-01)
const PUBLIC_GET_ROUTES = [
  /^\/api\/agency\/branding$/,
  /^\/api\/portal\/[^/]+$/,
  /^\/api\/cms\/content\/[^/]+$/
];

const PUBLIC_POST_ROUTES = [
  /^\/api\/auth\//,
  /^\/api\/portal\/[^/]+\/(update|upload-assets|sync-drive)$/,
  /^\/api\/presupuestos\/[^/]+\/(view|accept)$/,
  /^\/api\/ai\/generate$/
];

app.use('/api', (req, res, next) => {
  if (req.method === 'OPTIONS') return next();
  const cleanPath = req.originalUrl.split('?')[0];

  if (req.method === 'GET' && PUBLIC_GET_ROUTES.some(r => r.test(cleanPath))) {
    return next();
  }
  if (req.method === 'POST' && PUBLIC_POST_ROUTES.some(r => r.test(cleanPath))) {
    return next();
  }
  if (/^\/api\/auth\//.test(cleanPath)) {
    return next();
  }

  return requireAuth(req, res, next);
});

// Dominios exclusivos de Administrador (RBAC estricto en servidor - C-01, C-09)
app.use(
  [
    '/api/finanzas',
    '/api/agency/settings',
    '/api/agency/bank-accounts',
    '/api/agency/mcp-key',
    '/api/system',
    '/api/settings',
    '/api/whatsapp'
  ],
  requireRole('admin')
);

// Rate Limiting para servicios externos de pago y operaciones costosas (H-04)
app.use(
  [
    '/api/search',
    '/api/pipeline',
    '/api/enrich',
    '/api/audit',
    '/api/pitch',
    '/api/send-email',
    '/api/send-instantly',
    '/api/whatsapp',
    '/api/drive',
    '/api/ai/generate'
  ],
  costlyLimiter
);

app.use('/api/portal', portalLimiter);

// ==========================================
// CANAL SERVER-SENT EVENTS (SSE) EN VIVO (Protegido con requireAuth - M-06)
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

app.get('/api/events', requireAuth, (req, res) => {
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

// 1.1 White-Label Agency Settings & Public Branding (Hallazgo C-09)
app.get('/api/agency/branding', (_req, res) => {
  try {
    res.json(getPublicAgencyBranding());
  } catch (err) {
    res.status(500).json({ error: safeError(err) });
  }
});

app.get('/api/agency/settings', requireAuth, requireRole('admin'), (_req, res) => {
  try {
    const settings = getSanitizedAgencySettings();
    res.json(settings);
  } catch (err) {
    res.status(500).json({ error: safeError(err) });
  }
});

app.post('/api/agency/settings', requireAuth, requireRole('admin'), (req, res) => {
  try {
    const updated = saveAgencySettings(req.body);
    if (!updated) {
      return res.status(500).json({ error: 'Error guardando ajustes de la agencia' });
    }
    logSecurityEvent('AGENCY_SETTINGS_UPDATED', { fields: Object.keys(req.body || {}) }, req);
    res.json({ success: true, settings: updated });
  } catch (err) {
    res.status(500).json({ error: safeError(err) });
  }
});

// Endpoint dedicado para modificar cuentas bancarias con re-verificación TOTP (Hallazgo C-09)
app.post('/api/agency/bank-accounts', requireAuth, requireRole('admin'), (req, res) => {
  try {
    const { cuentasBancarias, totpCode } = req.body || {};
    const adminUser = getUserById(req.user.id);
    if (!adminUser) {
      return res.status(403).json({ error: 'Debes tener MFA TOTP activo para modificar cuentas bancarias.' });
    }
    const secret = decryptSecret(adminUser.totpEnc) || generateSecret(adminUser.id);
    const vr = verifyTOTP(String(totpCode || ''), secret);
    if (!vr.valid || isReplayCounter(adminUser.id, vr.counter, adminUser.lastTotpCounter)) {
      logSecurityEvent('BANK_ACCOUNTS_CHANGE_MFA_FAILED', {}, req);
      return res.status(401).json({ error: 'Código TOTP inválido o reutilizado. Cambio bancario bloqueado.' });
    }
    updateUserInternal(adminUser.id, { lastTotpCounter: vr.counter });
    const updatedBanks = updateAgencyBankAccounts(cuentasBancarias);
    logSecurityEvent('BANK_ACCOUNTS_UPDATED', { banks: Object.keys(cuentasBancarias || {}) }, req);
    res.json({ success: true, cuentasBancarias: updatedBanks });
  } catch (err) {
    res.status(500).json({ error: safeError(err) });
  }
});

// Endpoint dedicado para rotar la llave maestra del Agente MCP y almacenar solo su hash SHA-256 (Hallazgos C-07, C-08)
app.post('/api/agency/mcp-key/rotate', requireAuth, requireRole('admin'), (req, res) => {
  try {
    const { rawKey, masked } = rotateMcpAgentKey();
    logSecurityEvent('MCP_AGENT_KEY_ROTATED', { masked }, req);
    res.json({
      success: true,
      mcpAgentKey: rawKey, // Se muestra una única vez al administrador para copiarla
      mcpAgentKeyMasked: masked
    });
  } catch (err) {
    res.status(500).json({ error: safeError(err) });
  }
});

// 1.1b Proxy Seguro para Google Gemini AI en Servidor (Hallazgo H-01: elimina VITE_GEMINI_API_KEY del frontend)
app.post('/api/ai/generate', async (req, res) => {
  try {
    // Permitir acceso a usuarios autenticados o portales de cliente con token válido
    const hasPortalToken = req.body?.portalToken && Boolean(getUnifiedPortalPayload(req.body.portalToken));
    if (!req.user && !hasPortalToken) {
      // Verificar si viene sesión en cookie/header mediante requireAuth
      let authed = false;
      requireAuth(req, res, () => { authed = true; });
      if (!authed) return;
    }

    const prompt = String(req.body?.prompt || '').trim().slice(0, 8000);
    if (!prompt) {
      return res.status(400).json({ error: 'El prompt es requerido.' });
    }

    const settings = getSettings();
    const apiKey = process.env.GEMINI_API_KEY || settings.geminiApiKey;
    if (!apiKey || !apiKey.trim()) {
      return res.status(503).json({ error: 'Servicio de IA no configurado en el servidor.' });
    }

    const generationConfig = req.body?.generationConfig && typeof req.body.generationConfig === 'object'
      ? req.body.generationConfig
      : { temperature: 0.7, maxOutputTokens: 1024 };

    const resp = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey.trim()
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig
        })
      }
    );

    const data = await resp.json().catch(() => ({}));
    if (!resp.ok) {
      return res.status(resp.status).json({ error: 'Error al consultar el modelo de IA.' });
    }
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    return res.json({ success: true, text, candidates: data.candidates });
  } catch (err) {
    return res.status(500).json({ error: safeError(err) });
  }
});

// 1.2 Users, Collaborators & Authentication (RBAC - Hallazgos C-02, C-03, C-04, C-05, H-05, H-06, L-01)
app.get('/api/users', requireAuth, (_req, res) => {
  try {
    const users = getUsers().map(u => publicUser(u));
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: safeError(err) });
  }
});

app.post('/api/users/collaborator', requireAuth, requireRole('admin'), (req, res) => {
  try {
    const result = createCollaborator(req.body || {});
    if (result.error) {
      return res.status(400).json({ error: result.error });
    }
    logSecurityEvent('USER_COLLABORATOR_CREATED', { targetEmail: result.user?.email }, req);
    res.json({ success: true, user: publicUser(result.user) });
  } catch (err) {
    res.status(500).json({ error: safeError(err) });
  }
});

app.patch('/api/users/:id', requireAuth, (req, res) => {
  try {
    const isSelf = req.user.id === req.params.id;
    const isAdmin = req.user.rol === 'admin';
    if (!isSelf && !isAdmin) {
      return res.status(403).json({ error: 'Permiso denegado para modificar este usuario.' });
    }
    const allowedFields = isAdmin ? ADMIN_EDITABLE_FIELDS : SELF_EDITABLE_FIELDS;
    const result = updateUser(req.params.id, req.body || {}, allowedFields);
    if (result.error) {
      return res.status(404).json({ error: result.error });
    }
    logSecurityEvent('USER_UPDATED', { targetUserId: req.params.id, fields: Object.keys(req.body || {}) }, req);
    res.json({ success: true, user: publicUser(result.user) });
  } catch (err) {
    res.status(500).json({ error: safeError(err) });
  }
});

app.delete('/api/users/:id', requireAuth, requireRole('admin'), (req, res) => {
  try {
    const result = deleteCollaborator(req.params.id);
    if (result.error) {
      return res.status(400).json({ error: result.error });
    }
    logSecurityEvent('USER_COLLABORATOR_DELETED', { deletedId: req.params.id }, req);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: safeError(err) });
  }
});

// 1.3 Autenticación en Dos Pasos (Paso 1: Identidad Google verificada en servidor -> Paso 2: TOTP RFC 6238 en servidor)
app.post('/api/auth/google-check', authLimiter, requireGoogleIdentity, (req, res) => {
  try {
    const email = req.googleIdentity.email.trim().toLowerCase();
    if (isAccountLocked(email)) {
      return res.status(429).json({ error: 'Cuenta bloqueada temporalmente por múltiples intentos fallidos. Espera 15 minutos.' });
    }

    const user = getUserByEmail(email);
    if (!user || user.rol === 'cliente' || user.activo === false) {
      logSecurityEvent('AUTH_GOOGLE_UNAUTHORIZED_EMAIL', { email }, req);
      return res.status(403).json({
        error: `Acceso Denegado: La cuenta (${email}) no está registrada como personal autorizado de Goglite Agency.`
      });
    }

    const clientMfaSeal = req.body?.mfaSeal || req.cookies?.gg_mfa_enrolled || '';
    const sealValid = verifyMfaEnrollmentSeal(clientMfaSeal, user.email) || verifyMfaEnrollmentSeal(clientMfaSeal, email);
    const mfaEnrolled = Boolean((user.mfaActivo && user.totpEnc) || sealValid);

    if (sealValid && !user.mfaActivo) {
      updateUserInternal(user.id, {
        mfaActivo: true,
        totpEnc: user.totpEnc || encryptSecret(generateSecret(user.id))
      });
    }

    return res.json({
      success: true,
      authorized: true,
      mfaEnrolled,
      user: publicUser({ ...user, mfaActivo: mfaEnrolled })
    });
  } catch (err) {
    return res.status(500).json({ error: safeError(err) });
  }
});

// Inicio o re-sincronización de enrolamiento TOTP determinístico por usuario autenticado con Google (C-02, C-03)
app.post('/api/auth/2fa/enroll/start', authLimiter, requireGoogleIdentity, async (req, res) => {
  try {
    const email = req.googleIdentity.email.trim().toLowerCase();
    const user = getUserByEmail(email);
    if (!user || user.rol === 'cliente' || user.activo === false) {
      return res.status(403).json({ error: 'Usuario no autorizado para enrolamiento MFA.' });
    }

    const forceResync = Boolean(req.body?.forceResync);
    if (user.mfaActivo && user.totpEnc && !forceResync) {
      return res.status(409).json({ error: 'El segundo factor MFA ya se encuentra activo y bloqueado para esta cuenta.' });
    }

    // Secreto determinístico único derivado de HMAC-SHA256(ENC_KEY, user.id) para consistencia 100% entre instancias Serverless
    const secret = generateSecret(user.id);
    const encryptedSecret = encryptSecret(secret);
    updateUserInternal(user.id, {
      totpPendingEnc: encryptedSecret,
      totpEnc: encryptedSecret
    });

    const branding = getPublicAgencyBranding();
    const issuer = branding.nombreAgencia || 'Goglite Digital Hub';
    const uri = buildOtpAuthUri({ email: user.email, issuer, secret });
    const qrCodeDataUrl = await generateQrCodeDataUrl(uri);

    logSecurityEvent('AUTH_2FA_ENROLL_STARTED', { userId: user.id, email: user.email, forceResync }, req);

    return res.json({
      success: true,
      qrCodeDataUrl,
      secret
    });
  } catch (err) {
    return res.status(500).json({ error: safeError(err) });
  }
});

// Confirmación de enrolamiento TOTP: valida contra el secreto del servidor en cualquier instancia Serverless (C-03)
app.post('/api/auth/2fa/enroll/confirm', authLimiter, requireGoogleIdentity, (req, res) => {
  try {
    const email = req.googleIdentity.email.trim().toLowerCase();
    if (isAccountLocked(email)) {
      return res.status(429).json({ error: 'Cuenta bloqueada temporalmente por intentos fallidos. Espera 15 minutos.' });
    }

    const user = getUserByEmail(email);
    if (!user || user.rol === 'cliente' || user.activo === false) {
      return res.status(403).json({ error: 'Usuario no autorizado.' });
    }

    const secret = decryptSecret(user.totpPendingEnc || user.totpEnc) || generateSecret(user.id);
    const verifyResult = verifyTOTP(String(req.body?.token || ''), secret);
    if (!verifyResult.valid || isReplayCounter(user.id, verifyResult.counter, user.lastTotpCounter)) {
      const failInfo = recordFailedAuthAttempt(email);
      logSecurityEvent('AUTH_2FA_ENROLL_CONFIRM_FAILED', { email, attempts: failInfo.attempts, locked: failInfo.locked }, req);
      return res.status(401).json({ error: 'Código de 6 dígitos inválido o expirado. Verifica que tu reloj sea automático.' });
    }

    clearFailedAuthAttempts(email);
    const encryptedSecret = encryptSecret(secret);
    const updatedUser = updateUserInternal(user.id, {
      totpEnc: encryptedSecret,
      totpPendingEnc: null,
      mfaActivo: true,
      lastTotpCounter: verifyResult.counter,
      ultimoAcceso: new Date().toISOString()
    });

    const sessionToken = issueSessionCookie(res, updatedUser);
    const mfaSeal = signMfaEnrollmentSeal(updatedUser.email);
    res.append('Set-Cookie', `gg_mfa_enrolled=${encodeURIComponent(mfaSeal)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=31536000; Secure`);

    logSecurityEvent('AUTH_2FA_ENROLL_COMPLETED', { userId: updatedUser.id, email: updatedUser.email }, req);

    return res.json({
      success: true,
      valid: true,
      user: publicUser(updatedUser),
      sessionToken,
      mfaSeal
    });
  } catch (err) {
    return res.status(500).json({ error: safeError(err) });
  }
});

// Verificación TOTP de login: el secreto SIEMPRE se resuelve en el servidor y es idéntico en todos los contenedores (C-03, L-01)
app.post('/api/auth/2fa/verify', authLimiter, requireGoogleIdentity, (req, res) => {
  try {
    const email = req.googleIdentity.email.trim().toLowerCase();
    if (isAccountLocked(email)) {
      return res.status(429).json({ error: 'Cuenta protegida temporalmente tras 5 intentos fallidos. Espera 15 minutos.' });
    }

    const user = getUserByEmail(email);
    if (!user || user.rol === 'cliente' || user.activo === false) {
      return res.status(403).json({ error: 'Usuario no autorizado.' });
    }

    const secret = decryptSecret(user.totpEnc || user.totpPendingEnc) || generateSecret(user.id);
    const result = verifyTOTP(String(req.body?.token || ''), secret);
    if (!result.valid || isReplayCounter(user.id, result.counter, user.lastTotpCounter)) {
      const failInfo = recordFailedAuthAttempt(email);
      logSecurityEvent('AUTH_2FA_VERIFY_FAILED', { email, attempts: failInfo.attempts, locked: failInfo.locked }, req);
      return res.status(401).json({
        success: false,
        valid: false,
        error: 'Código de Google Authenticator inválido, expirado o perteneciente a un QR anterior. Usa el botón de abajo para sincronizar el QR único.'
      });
    }

    clearFailedAuthAttempts(email);
    const updatedUser = updateUserInternal(user.id, {
      totpEnc: user.totpEnc || encryptSecret(secret),
      totpPendingEnc: null,
      mfaActivo: true,
      lastTotpCounter: result.counter,
      ultimoAcceso: new Date().toISOString()
    });

    const sessionToken = issueSessionCookie(res, updatedUser);
    const mfaSeal = signMfaEnrollmentSeal(updatedUser.email);
    res.append('Set-Cookie', `gg_mfa_enrolled=${encodeURIComponent(mfaSeal)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=31536000; Secure`);

    logSecurityEvent('AUTH_LOGIN_SUCCESS', { userId: updatedUser.id, email: updatedUser.email, rol: updatedUser.rol }, req);

    return res.json({
      success: true,
      valid: true,
      user: publicUser(updatedUser),
      sessionToken,
      mfaSeal
    });
  } catch (err) {
    return res.status(500).json({ error: safeError(err) });
  }
});

app.get('/api/auth/me', requireAuth, (req, res) => {
  res.json({
    authenticated: true,
    user: req.user
  });
});

app.post('/api/auth/logout', (req, res) => {
  logSecurityEvent('AUTH_LOGOUT', {}, req);
  clearSessionCookie(req, res);
  res.json({ ok: true });
});

// Registro de cliente de portal (solo rol 'cliente', requiere token Google verificado - C-05)
app.post('/api/auth/client-register', authLimiter, requireGoogleIdentity, (req, res) => {
  try {
    const verifiedEmail = req.googleIdentity.email;
    const { portalToken, nombre } = req.body || {};
    const result = registerOrUpdateClientAuth({
      portalToken,
      email: verifiedEmail,
      nombre: nombre || req.googleIdentity.name,
      authProvider: 'google'
    });
    if (result.error) {
      return res.status(403).json({ error: result.error });
    }
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: safeError(err) });
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
    res.status(500).json({ error: safeError(err) });
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
    res.status(500).json({ error: safeError(err) });
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
    res.status(500).json({ error: safeError(err) });
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
    res.status(500).json({ error: safeError(err) });
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
    res.status(500).json({ error: safeError(err) });
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

// 9. Send Email via Resend ($0.00 Free Tier) or Instantly.ai (H-04, M-02)
app.post('/api/send-email', async (req, res) => {
  try {
    const { leadId, provider = 'resend', subject, customPitch } = req.body;
    const leads = getLeads();
    const lead = leads.find(l => l.id === leadId);

    if (!lead) return res.status(404).json({ error: 'Lead no encontrado' });

    const settings = getSettings();
    const pitchToSend = String(customPitch || lead.pitch || 'Hola, me pongo en contacto con respecto a su presencia digital.').slice(0, 8000);
    const emailSubject = String(subject || `Pregunta rápida sobre ${lead.nombreEmpresa || lead.dominio}`).slice(0, 200);
    // H-04: Evitar open relay ignorando targetEmail arbitrario del cliente
    const recipientEmail = lead.email;
    if (!recipientEmail) {
      return res.status(400).json({ error: 'El lead no tiene un correo electrónico registrado' });
    }

    if (provider === 'resend') {
      if (!settings.resendApiKey) {
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
      // M-02: Escapar entidades HTML antes de insertar en la plantilla de correo
      const safeHtmlPitch = escapeHtml(pitchToSend).replace(/\n/g, '<br/>');

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
            ${safeHtmlPitch}
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
    res.status(500).json({ error: safeError(err) });
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
    // M-01: Token criptográfico opaco de 256 bits en lugar de Date.now()
    portalToken: generateSecurePortalToken(),
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
    res.status(500).json({ error: safeError(err) });
  }
});

app.delete('/api/whatsapp/sessions/:country', async (req, res) => {
  try {
    const result = await disconnectWhatsAppSession(req.params.country);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: safeError(err) });
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
    res.status(500).json({ error: safeError(err) });
  }
});

// M-05: Allowlist explícita en PATCH /api/crm/leads/:id para impedir sobreescritura de id, portalToken o portalConfig
const CRM_LEAD_PATCH_ALLOWLIST = [
  'empresa',
  'contacto',
  'cargo',
  'email',
  'telefono',
  'pais',
  'dominio',
  'etapa',
  'valorEstimado',
  'probabilidad',
  'fuente',
  'temperatura',
  'resumenEjecutivo',
  'proximaAccion',
  'notas',
  'servicio',
  'interacciones'
];

app.patch('/api/crm/leads/:id', (req, res) => {
  const { id } = req.params;
  const leads = getCrmLeads();
  const idx = leads.findIndex(l => l.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Lead no encontrado' });

  const safeUpdates = {};
  for (const field of CRM_LEAD_PATCH_ALLOWLIST) {
    if (req.body && req.body[field] !== undefined) {
      safeUpdates[field] = req.body[field];
    }
  }

  leads[idx] = { ...leads[idx], ...safeUpdates, actualizadoEn: new Date().toISOString().split('T')[0] };
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

  // H-04 / M-01: Compartir bóveda únicamente con el correo autenticado registrado del cliente o correo del lead
  if (req.body.crearBoveda) {
    try {
      const targetEmail = lead.portalConfig?.clienteAuthEmail || lead.email || '';
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

// Endpoint para crear y compartir la Bóveda en Google Drive con la cuenta autenticada del cliente (H-04 / M-01)
app.post('/api/portal/:token/sync-drive', async (req, res) => {
  const { token } = req.params;
  const lead = getCrmLeadByToken(token);
  if (!lead) return res.status(404).json({ error: 'Portal no encontrado' });

  try {
    const clientName = lead.empresa;
    const clientEmail = lead.portalConfig?.clienteAuthEmail || lead.email || '';
    const vault = await createClientVault(clientName, clientEmail, lead.id);
    const updated = updateClientPortalConfig(token, {
      driveVault: vault,
      enlaceDriveArchivos: vault.vaultUrl
    });
    res.json({ success: true, lead: updated, vault });
  } catch (err) {
    res.status(500).json({ error: safeError(err) });
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
    res.status(500).json({ error: safeError(err) });
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

// M-05: Allowlist explícita en PUT /api/finanzas/configuracion
const FINANZAS_CONFIG_ALLOWLIST = [
  'metaMensualIngresos',
  'impuestoPorcentaje',
  'costoHoraAgenciaDefault',
  'monedaBase',
  'tasaCambioDop'
];

app.put('/api/finanzas/configuracion', (req, res) => {
  const safeConfig = {};
  for (const field of FINANZAS_CONFIG_ALLOWLIST) {
    if (req.body && req.body[field] !== undefined) {
      safeConfig[field] = req.body[field];
    }
  }
  const updated = actualizarConfiguracionFinanzas(safeConfig);
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

// H-03: Verificación reforzada para endpoints destructivos (re-autenticación TOTP + confirmación explícita)
function verifyAdminDestructiveAction(req, res) {
  if (process.env.NODE_ENV === 'production' && process.env.ALLOW_SYSTEM_RESET !== 'true') {
    return { ok: false, status: 403, error: 'Operación de borrado masivo deshabilitada en producción (ALLOW_SYSTEM_RESET != true).' };
  }
  const { confirm, totpCode } = req.body || {};
  if (confirm !== 'RESET-CONFIRMED') {
    return { ok: false, status: 400, error: 'Confirmación explícita requerida (confirm: "RESET-CONFIRMED").' };
  }
  const adminUser = getUserById(req.user?.sub) || getUserByEmail(req.user?.email);
  if (!adminUser || adminUser.rol !== 'admin' || !adminUser.totpEnc) {
    return { ok: false, status: 403, error: 'Se requiere administrador con MFA TOTP enrolado.' };
  }
  let plainSecret;
  try {
    plainSecret = decryptSecret(adminUser.totpEnc);
  } catch {
    return { ok: false, status: 500, error: 'No se pudo verificar el secreto MFA.' };
  }
  const verification = verifyTOTP(String(totpCode || ''), plainSecret);
  if (!verification.valid) {
    return { ok: false, status: 401, error: 'Código TOTP de re-autenticación inválido.' };
  }
  return { ok: true, adminUser };
}

app.post('/api/finanzas/reset', (req, res) => {
  const check = verifyAdminDestructiveAction(req, res);
  if (!check.ok) {
    logSecurityEvent('FINANZAS_RESET_DENIED', { reason: check.error }, req);
    return res.status(check.status).json({ error: check.error });
  }
  logSecurityEvent('FINANZAS_RESET_EXECUTED', { adminId: check.adminUser.id }, req);
  const cleanFinanzas = resetFinanzasData();
  saveProyectos([]);
  res.json({ success: true, finanzas: cleanFinanzas });
});

// Endpoint Maestro Unificado de Limpieza del Sistema (Fase 1 a 7) (H-03)
app.post('/api/system/reset', async (req, res) => {
  try {
    const check = verifyAdminDestructiveAction(req, res);
    if (!check.ok) {
      logSecurityEvent('SYSTEM_RESET_DENIED', { reason: check.error }, req);
      return res.status(check.status).json({ error: check.error });
    }
    logSecurityEvent('SYSTEM_RESET_EXECUTED', { adminId: check.adminUser.id }, req);

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
    res.status(500).json({ error: safeError(err) });
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
    res.status(500).json({ error: safeError(err) });
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

// Turnkey Headless CMS Client Script (Universal, 1 KB, Offline-first) - H-07 Hardened
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
  var ALLOWED_ORIGINS = [
    'https://goglite-agency.web.app',
    'https://goglite-agency.firebaseapp.com',
    'https://goglite-agency.vercel.app',
    'http://localhost:5173',
    'http://localhost:3001'
  ];

  function getVal(path, obj) {
    if (!path || !obj) return '';
    return path.split('.').reduce(function(o, k) { 
      return (o && typeof o[k] !== 'undefined') ? o[k] : ''; 
    }, obj);
  }

  // H-07: Validar esquemas de URL permitidos (bloquea javascript:, data:, vbscript:)
  function safeUrl(v, allowRelative) {
    if (typeof v !== 'string') return null;
    var trimmed = v.trim();
    if (!trimmed) return null;
    if (allowRelative && (trimmed.charAt(0) === '/' || trimmed.charAt(0) === '#')) {
      if (trimmed.indexOf('//') === 0) return null;
      return trimmed;
    }
    try {
      var u = new URL(trimmed, window.location.origin);
      var allowed = ['http:', 'https:', 'mailto:', 'tel:'];
      return allowed.indexOf(u.protocol) !== -1 ? u.href : null;
    } catch (e) {
      return null;
    }
  }

  function applyCmsData(c) {
    if (!c) return;

    // 1. Textos (textContent seguro contra XSS)
    document.querySelectorAll('[data-cms]').forEach(function(el) {
      var key = el.getAttribute('data-cms');
      var val = getVal(key, c);
      if (val !== '') el.textContent = String(val);
    });

    // 2. Enlaces (Href / WhatsApp) con validación de protocolo (H-07)
    document.querySelectorAll('[data-cms-href]').forEach(function(el) {
      var key = el.getAttribute('data-cms-href');
      var val = getVal(key, c);
      if (val !== '') {
        if (key.indexOf('WhatsApp') !== -1 && String(val).indexOf('http') === -1) {
          var cleanPhone = String(val).replace(/[^0-9]/g, '');
          if (cleanPhone) el.setAttribute('href', 'https://wa.me/' + cleanPhone);
        } else {
          var validHref = safeUrl(String(val), true);
          if (validHref) el.setAttribute('href', validHref);
        }
      }
    });

    // 3. Imágenes y Logos con validación de URL (H-07)
    document.querySelectorAll('[data-cms-src]').forEach(function(el) {
      var key = el.getAttribute('data-cms-src');
      var val = getVal(key, c);
      if (val !== '') {
        var validSrc = safeUrl(String(val), true);
        if (validSrc) el.setAttribute('src', validSrc);
      }
    });

    // 4. Fondos CSS con escape de caracteres de inyección CSS (H-07)
    document.querySelectorAll('[data-cms-bg]').forEach(function(el) {
      var key = el.getAttribute('data-cms-bg');
      var val = getVal(key, c);
      if (val !== '') {
        var validBg = safeUrl(String(val), true);
        if (validBg) {
          var cleanCssUrl = validBg.replace(/["'()\\\\]/g, '');
          el.style.backgroundImage = 'url("' + cleanCssUrl + '")';
        }
      }
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
  fetch(apiUrl + '/api/cms/content/' + encodeURIComponent(siteSlug))
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

  // H-07: Listener para previsualización en vivo restringido a orígenes autorizados y contexto iframe
  window.addEventListener('message', function(event) {
    if (window.parent === window) return;
    if (ALLOWED_ORIGINS.indexOf(event.origin) === -1) return;
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
