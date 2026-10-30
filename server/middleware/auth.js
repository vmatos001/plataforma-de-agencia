import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getUserByEmail, getUserById, publicUser } from '../services/usersStorage.js';
import { logSecurityEvent } from '../services/auditLogger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const LOCAL_SESSION_KEY_FILE = path.join(__dirname, '../data/.session_master.key');

const FIREBASE_PROJECT_ID = process.env.FIREBASE_PROJECT_ID || 'goglite-agency';
const GOOGLE_CERTS_URL = 'https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com';

function getSessionSecret() {
  if (process.env.SESSION_SECRET && process.env.SESSION_SECRET.length >= 32) {
    return process.env.SESSION_SECRET;
  }
  try {
    if (fs.existsSync(LOCAL_SESSION_KEY_FILE)) {
      const saved = fs.readFileSync(LOCAL_SESSION_KEY_FILE, 'utf8').trim();
      if (saved.length >= 32) return saved;
    }
    const generated = crypto.randomBytes(32).toString('base64url');
    const dir = path.dirname(LOCAL_SESSION_KEY_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(LOCAL_SESSION_KEY_FILE, generated, { encoding: 'utf8', mode: 0o600 });
    return generated;
  } catch {
    return crypto
      .createHash('sha256')
      .update(process.env.DATABASE_URL || 'goglite-session-secret-seed-v2')
      .digest('base64url');
  }
}

const SESSION_SECRET = getSessionSecret();

// Seguimiento de actividad e invalidación de sesiones en servidor
const sessionLastSeen = new Map();
const revokedSessionJtis = new Set();

const ABSOLUTE_TTL_SEC = 8 * 3600; // 8 horas máximo
const IDLE_ADMIN_MS = 15 * 60 * 1000; // 15 min inactividad admin
const IDLE_COLAB_MS = 30 * 60 * 1000; // 30 min inactividad colaborador

export function parseCookies(cookieHeader = '') {
  const out = {};
  if (!cookieHeader || typeof cookieHeader !== 'string') return out;
  for (const pair of cookieHeader.split(';')) {
    const idx = pair.indexOf('=');
    if (idx === -1) continue;
    const k = pair.slice(0, idx).trim();
    const v = pair.slice(idx + 1).trim();
    try {
      out[k] = decodeURIComponent(v);
    } catch {
      out[k] = v;
    }
  }
  return out;
}

export function cookieParserMiddleware(req, _res, next) {
  req.cookies = parseCookies(req.headers.cookie);
  next();
}

export function signSession(payload, ttlSec = ABSOLUTE_TTL_SEC) {
  const nowSec = Math.floor(Date.now() / 1000);
  const jti = crypto.randomBytes(12).toString('base64url');
  const fullPayload = {
    ...payload,
    jti,
    iat: nowSec,
    exp: nowSec + ttlSec
  };
  const body = Buffer.from(JSON.stringify(fullPayload)).toString('base64url');
  const sig = crypto.createHmac('sha256', SESSION_SECRET).update(body).digest('base64url');
  sessionLastSeen.set(jti, Date.now());
  return `${body}.${sig}`;
}

export function verifySession(token) {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [body, sig] = parts;
  if (!body || !sig) return null;

  try {
    const expected = crypto.createHmac('sha256', SESSION_SECRET).update(body).digest();
    const given = Buffer.from(sig, 'base64url');
    if (given.length !== expected.length || !crypto.timingSafeEqual(given, expected)) {
      return null;
    }
    const data = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
    const nowSec = Math.floor(Date.now() / 1000);
    if (!data.exp || data.exp <= nowSec) {
      return null;
    }
    if (data.jti && revokedSessionJtis.has(data.jti)) {
      return null;
    }

    // Verificar inactividad en el servidor si la sesión está registrada en esta instancia
    if (data.jti && sessionLastSeen.has(data.jti)) {
      const last = sessionLastSeen.get(data.jti);
      const idleLimit = data.rol === 'admin' ? IDLE_ADMIN_MS : IDLE_COLAB_MS;
      if (Date.now() - last > idleLimit) {
        revokedSessionJtis.add(data.jti);
        sessionLastSeen.delete(data.jti);
        return null;
      }
      sessionLastSeen.set(data.jti, Date.now());
    } else if (data.jti) {
      sessionLastSeen.set(data.jti, Date.now());
    }

    return data;
  } catch {
    return null;
  }
}

export function revokeSessionToken(token) {
  const data = verifySession(token);
  if (data?.jti) {
    revokedSessionJtis.add(data.jti);
    sessionLastSeen.delete(data.jti);
  }
}

export function issueSessionCookie(res, user) {
  const token = signSession({
    uid: user.id,
    email: user.email,
    rol: user.rol,
    mfa: true
  });
  const isProd = process.env.NODE_ENV === 'production' || Boolean(process.env.VERCEL);
  res.cookie('gg_session', token, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
    maxAge: ABSOLUTE_TTL_SEC * 1000,
    path: '/'
  });
  return token;
}

export function clearSessionCookie(req, res) {
  const rawToken = extractSessionToken(req);
  if (rawToken) revokeSessionToken(rawToken);
  const isProd = process.env.NODE_ENV === 'production' || Boolean(process.env.VERCEL);
  res.clearCookie('gg_session', {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
    path: '/'
  });
}

function extractSessionToken(req) {
  const fromCookie = req.cookies?.gg_session;
  if (fromCookie) return fromCookie;
  const fromHeader = req.headers['x-gg-session'];
  if (fromHeader && typeof fromHeader === 'string') return fromHeader.trim();
  const authHeader = req.headers.authorization || '';
  if (authHeader.startsWith('Bearer ')) {
    const candidate = authHeader.slice(7).trim();
    // Los tokens de sesión firmados tienen exactamente 2 segmentos (body.sig), mientras que los JWT de Google tienen 3
    if (candidate.split('.').length === 2) {
      return candidate;
    }
  }
  return null;
}

// Caché de certificados públicos de Google para verificar Firebase ID Tokens (RS256)
let cachedGoogleCerts = null;
let cachedGoogleCertsExp = 0;

async function getGooglePublicCerts() {
  const now = Date.now();
  if (cachedGoogleCerts && now < cachedGoogleCertsExp) {
    return cachedGoogleCerts;
  }
  const resp = await fetch(GOOGLE_CERTS_URL);
  if (!resp.ok) {
    throw new Error('No se pudieron obtener los certificados públicos de Google Auth');
  }
  const cacheControl = resp.headers.get('cache-control') || '';
  const maxAgeMatch = cacheControl.match(/max-age=(\d+)/);
  const maxAgeMs = maxAgeMatch ? Number(maxAgeMatch[1]) * 1000 : 3600_000;
  cachedGoogleCerts = await resp.json();
  cachedGoogleCertsExp = now + maxAgeMs;
  return cachedGoogleCerts;
}

/**
 * Verifica criptográficamente un Firebase ID Token (RS256) contra los certificados X.509 de Google.
 */
export async function verifyFirebaseIdToken(idToken) {
  if (!idToken || typeof idToken !== 'string') {
    throw new Error('ID Token ausente');
  }
  const parts = idToken.trim().split('.');
  if (parts.length !== 3) {
    throw new Error('Formato JWT inválido');
  }
  const [headerB64, payloadB64, signatureB64] = parts;
  const header = JSON.parse(Buffer.from(headerB64, 'base64url').toString('utf8'));
  const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8'));

  if (header.alg !== 'RS256' || !header.kid) {
    throw new Error('Algoritmo o kid de token no soportado');
  }

  const nowSec = Math.floor(Date.now() / 1000);
  if (!payload.exp || payload.exp <= nowSec) {
    throw new Error('El token de identidad de Google ha expirado');
  }
  if (payload.aud !== FIREBASE_PROJECT_ID) {
    throw new Error('Audiencia (aud) del token no coincide con el proyecto');
  }
  if (payload.iss !== `https://securetoken.google.com/${FIREBASE_PROJECT_ID}`) {
    throw new Error('Emisor (iss) del token inválido');
  }

  const certs = await getGooglePublicCerts();
  const certPem = certs[header.kid];
  if (!certPem) {
    throw new Error('Certificado público de firma no encontrado');
  }

  const verifier = crypto.createVerify('RSA-SHA256');
  verifier.update(`${headerB64}.${payloadB64}`);
  verifier.end();

  const signature = Buffer.from(signatureB64, 'base64url');
  const isValidSig = verifier.verify(certPem, signature);
  if (!isValidSig) {
    throw new Error('Firma criptográfica del token de Google inválida');
  }

  return payload;
}

/**
 * Paso 1 de autenticación: Verifica identidad de Google (Firebase ID Token) para endpoints /api/auth/*
 */
export async function requireGoogleIdentity(req, res, next) {
  try {
    // También permitir si ya tiene una sesión MFA activa y válida (ej. verificación desde Mi Perfil)
    const activeSessionToken = extractSessionToken(req);
    if (activeSessionToken) {
      const session = verifySession(activeSessionToken);
      if (session?.mfa && session?.email) {
        req.googleIdentity = {
          email: session.email,
          email_verified: true,
          uid: session.uid
        };
        return next();
      }
    }

    const authHeader = req.headers.authorization || '';
    const idToken = authHeader.startsWith('Bearer ')
      ? authHeader.slice(7).trim()
      : (req.body?.idToken || '');

    if (!idToken) {
      return res.status(401).json({ error: 'Token de identidad de Google requerido.' });
    }

    const decoded = await verifyFirebaseIdToken(idToken);
    if (!decoded.email || !decoded.email_verified) {
      return res.status(401).json({ error: 'El correo electrónico de la cuenta de Google no está verificado.' });
    }

    req.googleIdentity = decoded;
    return next();
  } catch (err) {
    logSecurityEvent('AUTH_GOOGLE_TOKEN_REJECTED', { reason: err.message }, req);
    return res.status(401).json({ error: 'Identidad de Google no autenticada o expirada.' });
  }
}

/**
 * Paso 2 de autenticación: Exige sesión completa (Google OAuth + TOTP MFA verificados en el servidor).
 */
export function requireAuth(req, res, next) {
  const token = extractSessionToken(req);
  const session = verifySession(token);
  if (!session || !session.mfa) {
    return res.status(401).json({ error: 'Sesión no autenticada o expirada. Inicia sesión con Google + 2FA.' });
  }

  const user = getUserById(session.uid) || getUserByEmail(session.email);
  if (!user || user.activo === false) {
    return res.status(401).json({ error: 'Usuario no autorizado o revocado.' });
  }

  req.user = publicUser(user);
  req.session = session;
  return next();
}

/**
 * Control de Acceso Basado en Roles (RBAC) verificado en el servidor.
 */
export const requireRole = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.rol)) {
    logSecurityEvent('RBAC_ACCESS_DENIED', { requiredRoles: roles, path: req.originalUrl }, req);
    return res.status(403).json({ error: 'Permiso denegado: privilegios insuficientes.' });
  }
  return next();
};
