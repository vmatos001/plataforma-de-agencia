import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import QRCode from 'qrcode';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const LOCAL_KEY_FILE = path.join(__dirname, '../data/.totp_master.key');

// Base32 Alphabet RFC 4648
const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

function getEncryptionKey() {
  const envKey = process.env.TOTP_ENC_KEY;
  if (envKey) {
    const fromB64 = Buffer.from(envKey, 'base64');
    if (fromB64.length === 32) return fromB64;
    return crypto.createHash('sha256').update(envKey).digest();
  }
  if (process.env.SESSION_SECRET) {
    return crypto.createHash('sha256').update(`totp:${process.env.SESSION_SECRET}`).digest();
  }
  try {
    if (fs.existsSync(LOCAL_KEY_FILE)) {
      const hex = fs.readFileSync(LOCAL_KEY_FILE, 'utf8').trim();
      if (hex.length === 64) return Buffer.from(hex, 'hex');
    }
    const generated = crypto.randomBytes(32);
    const dir = path.dirname(LOCAL_KEY_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(LOCAL_KEY_FILE, generated.toString('hex'), { encoding: 'utf8', mode: 0o600 });
    return generated;
  } catch {
    return crypto.createHash('sha256').update(process.env.DATABASE_URL || 'goglite-fallback-totp-key-seed').digest();
  }
}

const ENC_KEY = getEncryptionKey();

/**
 * Genera un secreto TOTP criptográficamente seguro de 160 bits (32 caracteres Base32).
 * Cumple con C-02 (eliminación de secretos estáticos/públicos).
 */
export function generateSecret(byteLength = 20) {
  const bytes = crypto.randomBytes(byteLength);
  let bits = '';
  let out = '';
  for (const b of bytes) {
    bits += b.toString(2).padStart(8, '0');
  }
  for (let i = 0; i + 5 <= bits.length; i += 5) {
    out += BASE32_ALPHABET[parseInt(bits.slice(i, i + 5), 2)];
  }
  return out;
}

/**
 * Cifra un secreto TOTP en reposo mediante AES-256-GCM autenticado.
 */
export function encryptSecret(plain) {
  if (!plain || typeof plain !== 'string') throw new Error('Secreto TOTP inválido para cifrar');
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', ENC_KEY, iv);
  const enc = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [iv.toString('base64'), tag.toString('base64'), enc.toString('base64')].join('.');
}

/**
 * Descifra un secreto TOTP cifrado con AES-256-GCM.
 */
export function decryptSecret(blob) {
  if (!blob || typeof blob !== 'string') return null;
  const parts = blob.split('.');
  if (parts.length !== 3) return null;
  try {
    const [iv, tag, enc] = parts.map(s => Buffer.from(s, 'base64'));
    const decipher = crypto.createDecipheriv('aes-256-gcm', ENC_KEY, iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(enc), decipher.final()]).toString('utf8');
  } catch {
    return null;
  }
}

export function base32Decode(base32Str) {
  let bits = '';
  const clean = String(base32Str || '').replace(/=+$/, '').toUpperCase();
  for (let i = 0; i < clean.length; i++) {
    const val = BASE32_ALPHABET.indexOf(clean.charAt(i));
    if (val === -1) continue;
    bits += val.toString(2).padStart(5, '0');
  }
  const bytes = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) {
    bytes.push(parseInt(bits.slice(i, i + 8), 2));
  }
  return Buffer.from(bytes);
}

export function generateTOTP(secret, timeStep = 30, windowOffset = 0) {
  if (!secret || typeof secret !== 'string') {
    throw new Error('Se requiere un secreto TOTP válido');
  }
  const key = base32Decode(secret);
  if (key.length === 0) {
    throw new Error('Secreto Base32 vacío o inválido');
  }
  const epoch = Math.floor(Date.now() / 1000);
  const counter = Math.floor(epoch / timeStep) + windowOffset;

  const buf = Buffer.alloc(8);
  buf.writeBigInt64BE(BigInt(counter));

  const hmac = crypto.createHmac('sha1', key).update(buf).digest();
  const offset = hmac[hmac.length - 1] & 0xf;
  const codeNum = (
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff)
  ) % 1000000;

  return codeNum.toString().padStart(6, '0');
}

// Registro anti-replay en memoria por usuario (L-01)
const lastAcceptedCounterByUser = new Map();

/**
 * Verifica que el contador TOTP no haya sido utilizado previamente (protección anti-replay L-01).
 */
export function isReplayCounter(userId, counter, persistedLastCounter = 0) {
  if (!userId || typeof counter !== 'number') return false;
  const memLast = lastAcceptedCounterByUser.get(userId) || 0;
  const effectiveLast = Math.max(memLast, Number(persistedLastCounter) || 0);
  if (counter <= effectiveLast) {
    return true;
  }
  lastAcceptedCounterByUser.set(userId, counter);
  return false;
}

/**
 * Verifica un código TOTP de 6 dígitos en tiempo constante (L-02) sin ningún secreto por defecto ni bypass (C-02, C-04).
 */
export function verifyTOTP(token, secret, tolerance = 1) {
  if (!secret || typeof secret !== 'string') return { valid: false };
  if (typeof token !== 'string') return { valid: false };
  const clean = token.trim();
  if (!/^\d{6}$/.test(clean)) return { valid: false };

  const cleanBuf = Buffer.from(clean, 'utf8');
  const timeStep = 30;
  const epoch = Math.floor(Date.now() / 1000);
  const baseCounter = Math.floor(epoch / timeStep);

  try {
    for (let window = -tolerance; window <= tolerance; window++) {
      const expected = generateTOTP(secret, timeStep, window);
      const expectedBuf = Buffer.from(expected, 'utf8');
      if (expectedBuf.length === cleanBuf.length && crypto.timingSafeEqual(expectedBuf, cleanBuf)) {
        return {
          valid: true,
          mode: 'rfc6238_match',
          counterWindow: window,
          counter: baseCounter + window
        };
      }
    }
  } catch {
    return { valid: false };
  }

  return { valid: false };
}

export async function generateQrCodeDataUrl(otpAuthUri) {
  try {
    return await QRCode.toDataURL(otpAuthUri, {
      margin: 1,
      width: 240,
      color: {
        dark: '#000000',
        light: '#ffffff'
      }
    });
  } catch (err) {
    console.error('Error generando QR Data URL:', err.message);
    return null;
  }
}

export function buildOtpAuthUri({ email, issuer = 'Goglite Agency', secret }) {
  if (!secret || !email) {
    throw new Error('Email y secret son obligatorios para construir otpauth URI');
  }
  const encodedIssuer = encodeURIComponent(issuer);
  const encodedEmail = encodeURIComponent(email);
  return `otpauth://totp/${encodedIssuer}:${encodedEmail}?secret=${secret}&issuer=${encodedIssuer}&algorithm=SHA1&digits=6&period=30`;
}
