import fs from 'fs';
import os from 'os';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { generateSecret, encryptSecret } from './totpService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const USERS_PATH = path.join(__dirname, '../data/users.json');
const TMP_USERS_PATH = path.join(os.tmpdir(), 'goglite_users.json');

export const ALLOWED_PERMS = [
  'lead_scrapper',
  'crm_portal',
  'crm',
  'presupuestos',
  'desarrollo_prd',
  'seo_motor',
  'headless_cms'
];

export const SELF_EDITABLE_FIELDS = ['nombre', 'cargo', 'avatar'];
export const ADMIN_EDITABLE_FIELDS = ['nombre', 'cargo', 'avatar', 'permisos', 'activo', 'costoPorHora'];

// Lista de secretos públicos comprometidos que deben ser revocados automáticamente si aparecen en disco
const COMPROMISED_TOTP_SECRETS = new Set([
  'JBSWY3DPEHPK3PXP'
]);

const defaultAdminTotpEnc = encryptSecret(generateSecret('user-admin-victor'));

const defaultUsers = [
  {
    id: 'user-admin-victor',
    nombre: 'Víctor Matos',
    email: 'sitesgoglite@gmail.com',
    secondaryEmail: 'victor@goglite.com',
    cargo: 'CEO & Director General',
    rol: 'admin',
    avatar: 'VM',
    authProvider: 'google_authenticator',
    mfaActivo: false, // Se sella tras el enrolamiento inicial o con el sello criptográfico de enrolamiento
    totpEnc: defaultAdminTotpEnc,
    totpPendingEnc: null,
    permisos: ['all'],
    creadoEn: '2026-10-01T00:00:00Z',
    ultimoAcceso: new Date().toISOString()
  }
];

let memoryUsersCache = null;

/**
 * Elimina todos los campos sensibles antes de enviar un usuario por red o guardarlo en estado de cliente.
 * Cumple con C-02 y C-05.
 */
export function publicUser(user) {
  if (!user || typeof user !== 'object') return null;
  const {
    totpEnc,
    totpPendingEnc,
    totpKeySecret,
    password,
    passwordHash,
    lastTotpCounter,
    ...safe
  } = user;
  return {
    ...safe,
    mfaConfigured: Boolean(user.mfaActivo && user.totpEnc)
  };
}

function sanitizeLoadedUsers(users) {
  if (!Array.isArray(users)) return defaultUsers.map(u => ({ ...u }));
  let modified = false;
  const cleaned = users.map(u => {
    const copy = { ...u };
    // Si la cuenta tenía el secreto de ejemplo público comprometido, revocarlo para forzar enrolamiento seguro
    if (copy.totpKeySecret && COMPROMISED_TOTP_SECRETS.has(copy.totpKeySecret)) {
      delete copy.totpKeySecret;
      modified = true;
    }
    if (!copy.totpEnc && copy.id) {
      copy.totpEnc = encryptSecret(generateSecret(copy.id));
      modified = true;
    }
    return copy;
  });

  if (modified) {
    saveUsers(cleaned);
  }
  return cleaned;
}

export function getUsers() {
  try {
    const candidatePaths = [USERS_PATH, TMP_USERS_PATH];
    for (const filePath of candidatePaths) {
      if (fs.existsSync(filePath)) {
        const data = fs.readFileSync(filePath, 'utf8');
        const parsed = JSON.parse(data);
        const sanitized = sanitizeLoadedUsers(parsed);
        memoryUsersCache = sanitized;
        return sanitized;
      }
    }

    if (memoryUsersCache && Array.isArray(memoryUsersCache)) {
      return memoryUsersCache;
    }

    const initial = defaultUsers.map(u => ({ ...u }));
    memoryUsersCache = initial;
    saveUsers(initial);
    return initial;
  } catch (err) {
    if (memoryUsersCache && Array.isArray(memoryUsersCache)) {
      return memoryUsersCache;
    }
    return defaultUsers.map(u => ({ ...u }));
  }
}

export function saveUsers(usersList) {
  memoryUsersCache = Array.isArray(usersList) ? usersList.map(u => ({ ...u })) : defaultUsers.map(u => ({ ...u }));
  const payload = JSON.stringify(memoryUsersCache, null, 2);
  try {
    const dir = path.dirname(USERS_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(USERS_PATH, payload, { encoding: 'utf8', mode: 0o600 });
    return true;
  } catch {
    try {
      fs.writeFileSync(TMP_USERS_PATH, payload, { encoding: 'utf8', mode: 0o600 });
      return true;
    } catch {
      return false;
    }
  }
}

export function getUserById(id) {
  if (!id) return null;
  const users = getUsers();
  return users.find(u => u.id === id) || null;
}

export function getUserByEmail(email) {
  if (!email || typeof email !== 'string') return null;
  const target = email.trim().toLowerCase();
  const users = getUsers();
  return users.find(u =>
    u.email?.trim().toLowerCase() === target ||
    u.secondaryEmail?.trim().toLowerCase() === target
  ) || null;
}

export function createCollaborator({ nombre, email, cargo, permisos = [], costoPorHora = 25 }) {
  if (!nombre || typeof nombre !== 'string' || !nombre.trim()) {
    return { error: 'El nombre del colaborador es obligatorio.' };
  }
  if (!email || typeof email !== 'string' || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())) {
    return { error: 'Formato de correo electrónico inválido.' };
  }

  const cleanEmail = email.trim().toLowerCase();
  const users = getUsers();
  const existing = users.find(u =>
    u.email?.toLowerCase() === cleanEmail ||
    u.secondaryEmail?.toLowerCase() === cleanEmail
  );
  if (existing) {
    return { error: 'El usuario ya existe con este correo electrónico.' };
  }

  const cleanNombre = nombre.trim().slice(0, 120);
  const initials = cleanNombre
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(w => w[0].toUpperCase())
    .join('') || 'CO';

  const safePermisos = Array.isArray(permisos)
    ? permisos.filter(p => ALLOWED_PERMS.includes(p))
    : ['desarrollo_prd', 'seo_motor', 'headless_cms'];

  const newUserId = `user-colab-${crypto.randomBytes(8).toString('hex')}`;
  const newUser = {
    id: newUserId,
    nombre: cleanNombre,
    email: cleanEmail,
    cargo: String(cargo || 'Especialista de Proyecto').trim().slice(0, 120),
    rol: 'colaborador', // Nunca se permite crear 'admin' por API (C-05)
    costoPorHora: Math.max(0, Number(costoPorHora) || 25),
    avatar: initials,
    authProvider: 'google',
    mfaActivo: false,
    totpEnc: encryptSecret(generateSecret(newUserId)),
    totpPendingEnc: null,
    permisos: safePermisos.length > 0 ? safePermisos : ['desarrollo_prd', 'seo_motor', 'headless_cms'],
    activo: true,
    creadoEn: new Date().toISOString(),
    ultimoAcceso: new Date().toISOString()
  };

  users.push(newUser);
  saveUsers(users);
  return { success: true, user: publicUser(newUser) };
}

/**
 * Registra o actualiza únicamente cuentas con rol 'cliente' verificadas con Google Identity (C-05).
 */
export function registerOrUpdateClientAuth({ portalToken, email, nombre, authProvider = 'google' }) {
  if (!email || typeof email !== 'string') {
    return { error: 'Correo electrónico requerido' };
  }
  const cleanEmail = email.trim().toLowerCase();
  const users = getUsers();
  let user = users.find(u => u.email?.toLowerCase() === cleanEmail);

  // Prohibir terminantemente modificar cuentas de admin o colaboradores desde el flujo de portal de clientes
  if (user && user.rol !== 'cliente') {
    return { error: 'Esta cuenta pertenece al personal interno de la agencia y no puede registrarse como cliente.' };
  }

  const cleanNombre = String(nombre || 'Cliente Verificado').trim().slice(0, 120);
  const initials = cleanNombre
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(w => w[0].toUpperCase())
    .join('') || 'CL';

  if (user) {
    user.ultimoAcceso = new Date().toISOString();
    user.authProvider = 'google';
    if (portalToken && typeof portalToken === 'string') {
      user.portalToken = portalToken.slice(0, 128);
    }
  } else {
    user = {
      id: `user-client-${crypto.randomBytes(8).toString('hex')}`,
      nombre: cleanNombre,
      email: cleanEmail,
      cargo: 'Propietario / Cliente Registrado',
      rol: 'cliente',
      avatar: initials,
      authProvider: 'google',
      portalToken: portalToken ? String(portalToken).slice(0, 128) : null,
      mfaActivo: false,
      permisos: ['portal_cliente'],
      creadoEn: new Date().toISOString(),
      ultimoAcceso: new Date().toISOString()
    };
    users.push(user);
  }

  saveUsers(users);
  return { success: true, user: publicUser(user) };
}

/**
 * Actualización de usuario con allowlist estricta de campos según el rol del solicitante (C-05).
 */
export function updateUser(id, rawUpdates = {}, allowedFields = SELF_EDITABLE_FIELDS) {
  const users = getUsers();
  const index = users.findIndex(u => u.id === id);
  if (index === -1) {
    return { error: 'Usuario no encontrado' };
  }

  const safeUpdates = {};
  for (const [k, v] of Object.entries(rawUpdates || {})) {
    if (!allowedFields.includes(k)) continue;
    if (k === 'nombre' && typeof v === 'string') safeUpdates.nombre = v.trim().slice(0, 120);
    if (k === 'cargo' && typeof v === 'string') safeUpdates.cargo = v.trim().slice(0, 120);
    if (k === 'avatar' && typeof v === 'string') safeUpdates.avatar = v.trim().slice(0, 10);
    if (k === 'activo' && typeof v === 'boolean') safeUpdates.activo = v;
    if (k === 'costoPorHora' && !Number.isNaN(Number(v))) safeUpdates.costoPorHora = Math.max(0, Number(v));
    if (k === 'permisos' && Array.isArray(v)) {
      safeUpdates.permisos = v.filter(p => ALLOWED_PERMS.includes(p));
    }
  }

  users[index] = {
    ...users[index],
    ...safeUpdates,
    actualizadoEn: new Date().toISOString()
  };
  saveUsers(users);
  return { success: true, user: publicUser(users[index]) };
}

/**
 * Uso exclusivo interno del servidor para enrolamiento TOTP, contadores anti-replay y marcas de acceso.
 */
export function updateUserInternal(id, internalUpdates = {}) {
  const users = getUsers();
  const index = users.findIndex(u => u.id === id);
  if (index === -1) return null;

  users[index] = {
    ...users[index],
    ...internalUpdates,
    actualizadoEn: new Date().toISOString()
  };
  delete users[index].totpKeySecret;
  saveUsers(users);
  return users[index];
}

export function deleteCollaborator(id) {
  const users = getUsers();
  const target = users.find(u => u.id === id);
  if (!target) {
    return { error: 'Usuario no encontrado' };
  }
  if (target.rol === 'admin') {
    return { error: 'No se puede eliminar la cuenta de Administrador principal.' };
  }
  const filtered = users.filter(u => u.id !== id);
  saveUsers(filtered);
  return { success: true, deletedId: id };
}
