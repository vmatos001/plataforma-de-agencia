import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const USERS_PATH = path.join(__dirname, '../data/users.json');

const defaultUsers = [
  {
    id: 'user-admin-victor',
    nombre: 'Víctor Matos',
    email: 'sitesgoglite@gmail.com',
    secondaryEmail: 'victor@goglite.com',
    cargo: 'CEO & Director General',
    rol: 'admin', // 'admin' | 'colaborador' | 'cliente'
    avatar: 'VM',
    authProvider: 'google_authenticator', // 'google' | 'google_authenticator' | 'password'
    mfaActivo: true,
    totpKeySecret: 'JBSWY3DPEHPK3PXP', // Estándar RFC 6238 TOTP
    permisos: ['all'],
    creadoEn: '2026-10-01T00:00:00Z',
    ultimoAcceso: new Date().toISOString()
  }
];

export function getUsers() {
  try {
    if (!fs.existsSync(USERS_PATH)) {
      fs.writeFileSync(USERS_PATH, JSON.stringify(defaultUsers, null, 2), 'utf8');
      return defaultUsers;
    }
    const data = fs.readFileSync(USERS_PATH, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Error leyendo users.json:', err);
    return defaultUsers;
  }
}

export function saveUsers(usersList) {
  try {
    fs.writeFileSync(USERS_PATH, JSON.stringify(usersList, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error('Error guardando users.json:', err);
    return false;
  }
}

export function getUserById(id) {
  const users = getUsers();
  return users.find(u => u.id === id);
}

export function getUserByEmail(email) {
  const users = getUsers();
  return users.find(u => u.email?.toLowerCase() === email?.toLowerCase());
}

export function createCollaborator({ nombre, email, cargo, rol = 'colaborador', permisos }) {
  const users = getUsers();
  const existing = users.find(u => u.email?.toLowerCase() === email?.toLowerCase());
  if (existing) {
    return { error: 'El usuario ya existe con este correo electrónico.' };
  }

  const initials = nombre
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(w => w[0].toUpperCase())
    .join('') || 'CO';

  const newUser = {
    id: `user-colab-${Date.now()}`,
    nombre,
    email,
    cargo: cargo || 'Especialista de Proyecto',
    rol,
    avatar: initials,
    authProvider: 'google',
    mfaActivo: false,
    permisos: permisos || ['desarrollo_prd', 'seo_motor', 'headless_cms'],
    creadoEn: new Date().toISOString(),
    ultimoAcceso: new Date().toISOString()
  };

  users.push(newUser);
  saveUsers(users);
  return { success: true, user: newUser };
}

export function registerOrUpdateClientAuth({ portalToken, email, nombre, authProvider = 'google' }) {
  const users = getUsers();
  let user = users.find(u => u.email?.toLowerCase() === email?.toLowerCase() || u.portalToken === portalToken);

  const initials = nombre
    ? nombre.split(' ').filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join('')
    : 'CL';

  if (user) {
    user.ultimoAcceso = new Date().toISOString();
    user.authProvider = authProvider;
    user.portalToken = portalToken;
  } else {
    user = {
      id: `user-client-${Date.now()}`,
      nombre: nombre || 'Cliente Verificado',
      email,
      cargo: 'Propietario / Cliente Registrado',
      rol: 'cliente',
      avatar: initials,
      authProvider,
      portalToken,
      mfaActivo: false,
      permisos: ['portal_cliente'],
      creadoEn: new Date().toISOString(),
      ultimoAcceso: new Date().toISOString()
    };
    users.push(user);
  }

  saveUsers(users);
  return { success: true, user };
}

export function updateUser(id, updates) {
  const users = getUsers();
  const index = users.findIndex(u => u.id === id);
  if (index === -1) {
    return { error: 'Usuario no encontrado' };
  }
  users[index] = {
    ...users[index],
    ...updates,
    actualizadoEn: new Date().toISOString()
  };
  saveUsers(users);
  return { success: true, user: users[index] };
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
