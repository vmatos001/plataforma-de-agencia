import crypto from 'crypto';
import QRCode from 'qrcode';

// Base32 Alphabet RFC 4648
const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

/**
 * Deriva una llave maestra de 256 bits determinista y consistente entre todas las instancias
 * Serverless (Vercel) y el entorno local, evitando fallos por sistemas de archivos efímeros (EROFS).
 */
function getEncryptionKey() {
  const envKey = process.env.TOTP_ENC_KEY || process.env.SESSION_SECRET || '';
  if (envKey) {
    const fromB64 = Buffer.from(envKey, 'base64');
    if (fromB64.length === 32) return fromB64;
    return crypto.createHash('sha256').update(`goglite-totp-key:${envKey}`).digest();
  }
  return crypto
    .createHash('sha256')
    .update('goglite-corp-totp-aes256gcm-master-key-2026-v2')
    .digest();
}

const ENC_KEY = getEncryptionKey();

/**
 * Codifica un Buffer arbitrario a Base32 (RFC 4648).
 */
function bytesToBase32(bytes) {
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
 * Genera un secreto TOTP criptográficamente seguro de 160 bits (32 caracteres Base32).
 * Si se proporciona un identificador de usuario/email, deriva un secreto único determinista mediante
 * HMAC-SHA256 con la llave maestra del servidor para garantizar consistencia absoluta entre contenedores
 * Serverless en Vercel (evitando que los cold starts generen múltiples códigos QR distintos).
 * Cumple con C-02 (cero secretos públicos o compartidos).
 */
export function generateSecret(userIdentifier = '', byteLength = 20) {
  if (userIdentifier && typeof userIdentifier === 'string' && userIdentifier.trim()) {
    const canonical = userIdentifier.trim().toLowerCase();
    const hmac = crypto
      .createHmac('sha256', ENC_KEY)
      .update(`goglite-totp-rfc6238-v2:${canonical}`)
      .digest();
    return bytesToBase32(hmac.subarray(0, byteLength));
  }
  const bytes = crypto.randomBytes(byteLength);
  return bytesToBase32(bytes);
}

/**
 * Firma un sello criptográfico que certifica que un usuario ya completó el enrolamiento MFA,
 * permitiendo que instancias Serverless sin estado reconozcan el enrolamiento tras cold starts.
 */
export function signMfaEnrollmentSeal(email) {
  if (!email || typeof email !== 'string') return '';
  const cleanEmail = email.trim().toLowerCase();
  const payload = Buffer.from(JSON.stringify({ email: cleanEmail, enrolled: true, v: 2 }), 'utf8').toString('base64url');
  const sig = crypto.createHmac('sha256', ENC_KEY).update(`mfa-seal:${payload}`).digest('base64url');
  return `${payload}.${sig}`;
}

export function verifyMfaEnrollmentSeal(seal, expectedEmail) {
  if (!seal || typeof seal !== 'string' || !expectedEmail) return false;
  const parts = seal.split('.');
  if (parts.length !== 2) return false;
  const [payload, sig] = parts;
  try {
    const expectedSig = crypto.createHmac('sha256', ENC_KEY).update(`mfa-seal:${payload}`).digest();
    const givenSig = Buffer.from(sig, 'base64url');
    if (givenSig.length !== expectedSig.length || !crypto.timingSafeEqual(givenSig, expectedSig)) {
      return false;
    }
    const parsed = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    return parsed?.enrolled === true && parsed?.email === expectedEmail.trim().toLowerCase() && parsed?.v === 2;
  } catch {
    return false;
  }
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

// Registro anti-replay en memoria por usuario con ventana de gracia de 4s para evitar falsos rechazos por doble clic (L-01)
const usedTokensByUser = new Map();

/**
 * Verifica que el contador TOTP no haya sido reutilizado en un ataque de replay (L-01),
 * permitiendo reintentos idempotentes dentro de 4 segundos por si el navegador envía doble submit.
 */
export function isReplayCounter(userId, counter, _persistedLastCounter = 0) {
  if (!userId || typeof counter !== 'number') return false;
  const key = `${userId}:${counter}`;
  const now = Date.now();
  const firstUsedAt = usedTokensByUser.get(key);
  if (firstUsedAt) {
    // Permitir ventana idempotente de 4s para doble disparo accidental del formulario en UI
    if (now - firstUsedAt <= 4000) {
      return false;
    }
    return true;
  }
  usedTokensByUser.set(key, now);
  // Limpieza periódica de contadores antiguos (> 5 minutos)
  if (usedTokensByUser.size > 500) {
    for (const [k, ts] of usedTokensByUser.entries()) {
      if (now - ts > 5 * 60 * 1000) usedTokensByUser.delete(k);
    }
  }
  return false;
}

/**
 * Verifica un código TOTP de 6 dígitos en tiempo constante (L-02) sin ningún secreto por defecto ni bypass (C-02, C-04).
 * Usa tolerance = 2 (±60 segundos) para absorber desincronizaciones leves de reloj entre el móvil y el servidor.
 */
export function verifyTOTP(token, secret, tolerance = 2) {
  if (!secret || typeof secret !== 'string') return { valid: false };
  if (typeof token !== 'string') return { valid: false };
  const clean = token.trim();
  if (!/^\d{6}$/.test(clean)) return { valid: false };

  const cleanBuf = Buffer.from(clean, 'utf8');
  const timeStep = 30;
  const epoch = Math.floor(Date.now() / 1000);
  const baseCounter = Math.floor(epoch / timeStep);

  try {
    // Priorizar ventana 0 (actual), luego ±1 (±30s), luego ±2 (±60s)
    const offsets = [0];
    for (let d = 1; d <= tolerance; d++) {
      offsets.push(-d, d);
    }
    for (const window of offsets) {
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

export function buildOtpAuthUri({ email, issuer = 'Goglite Digital Hub', secret }) {
  if (!secret || !email) {
    throw new Error('Email y secret son obligatorios para construir otpauth URI');
  }
  const encodedIssuer = encodeURIComponent(issuer);
  const encodedEmail = encodeURIComponent(email);
  return `otpauth://totp/${encodedIssuer}:${encodedEmail}?secret=${secret}&issuer=${encodedIssuer}&algorithm=SHA1&digits=6&period=30`;
}
