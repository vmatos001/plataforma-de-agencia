/**
 * Middleware de Rate Limiting en memoria con limpieza automática y soporte opcional para Upstash Redis REST.
 * Mitiga H-04 (abuso de APIs de pago) y H-05 (fuerza bruta en login y 2FA).
 */

const buckets = new Map();

// Purga periódica de ventanas expiradas para evitar fugas de memoria
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of buckets.entries()) {
    if (entry.resetAt <= now) {
      buckets.delete(key);
    }
  }
}, 60_000).unref?.();

export function createRateLimiter({
  windowMs = 60_000,
  limit = 20,
  prefix = 'rl',
  keyGenerator = null,
  message = 'Demasiadas solicitudes. Por favor, espera unos minutos antes de intentar nuevamente.'
} = {}) {
  return async function rateLimiterMiddleware(req, res, next) {
    try {
      const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket?.remoteAddress || req.ip || 'unknown';
      const rawKey = keyGenerator ? keyGenerator(req, ip) : ip;
      const bucketKey = `${prefix}:${rawKey}`;
      const now = Date.now();

      // Si hay Upstash Redis configurado para despliegues serverless multi-instancia
      if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
        try {
          const ttlSec = Math.ceil(windowMs / 1000);
          const resp = await fetch(`${process.env.UPSTASH_REDIS_REST_URL}/pipeline`, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${process.env.UPSTASH_REDIS_REST_TOKEN}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify([
              ['INCR', bucketKey],
              ['EXPIRE', bucketKey, ttlSec, 'NX']
            ])
          });
          if (resp.ok) {
            const data = await resp.json();
            const count = Number(data?.[0]?.result || 1);
            res.setHeader('X-RateLimit-Limit', String(limit));
            res.setHeader('X-RateLimit-Remaining', String(Math.max(0, limit - count)));
            if (count > limit) {
              return res.status(429).json({ error: message });
            }
            return next();
          }
        } catch {
          // Fallback transparente a memoria local
        }
      }

      let entry = buckets.get(bucketKey);
      if (!entry || entry.resetAt <= now) {
        entry = { count: 0, resetAt: now + windowMs };
        buckets.set(bucketKey, entry);
      }

      entry.count += 1;
      const remaining = Math.max(0, limit - entry.count);
      res.setHeader('X-RateLimit-Limit', String(limit));
      res.setHeader('X-RateLimit-Remaining', String(remaining));
      res.setHeader('X-RateLimit-Reset', String(Math.ceil(entry.resetAt / 1000)));

      if (entry.count > limit) {
        return res.status(429).json({ error: message });
      }

      return next();
    } catch {
      return next();
    }
  };
}

// Control de bloqueo temporal por cuenta (Account Lockout tras 5 fallos consecutivos de MFA/Auth)
const failedAttempts = new Map();
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60_000;

export function isAccountLocked(identifier) {
  if (!identifier) return false;
  const key = String(identifier).toLowerCase().trim();
  const record = failedAttempts.get(key);
  if (!record) return false;
  if (record.lockedUntil && record.lockedUntil > Date.now()) {
    return true;
  }
  if (record.lockedUntil && record.lockedUntil <= Date.now()) {
    failedAttempts.delete(key);
  }
  return false;
}

export function recordFailedAuthAttempt(identifier) {
  if (!identifier) return { locked: false, attempts: 0 };
  const key = String(identifier).toLowerCase().trim();
  const now = Date.now();
  const record = failedAttempts.get(key) || { count: 0, firstAttemptAt: now, lockedUntil: null };

  if (now - record.firstAttemptAt > LOCKOUT_DURATION_MS) {
    record.count = 0;
    record.firstAttemptAt = now;
    record.lockedUntil = null;
  }

  record.count += 1;
  if (record.count >= MAX_FAILED_ATTEMPTS) {
    record.lockedUntil = now + LOCKOUT_DURATION_MS;
  }
  failedAttempts.set(key, record);
  return { locked: Boolean(record.lockedUntil), attempts: record.count };
}

export function clearFailedAuthAttempts(identifier) {
  if (!identifier) return;
  failedAttempts.delete(String(identifier).toLowerCase().trim());
}

export const authLimiter = createRateLimiter({
  windowMs: 15 * 60_000,
  limit: 10,
  prefix: 'auth',
  keyGenerator: (req, ip) => `${ip}:${String(req.body?.email || req.googleIdentity?.email || '').toLowerCase()}`,
  message: 'Demasiados intentos de autenticación. Cuenta protegida temporalmente por 15 minutos.'
});

export const costlyLimiter = createRateLimiter({
  windowMs: 60_000,
  limit: 10,
  prefix: 'costly',
  message: 'Límite de peticiones por minuto alcanzado para este servicio.'
});

export const portalLimiter = createRateLimiter({
  windowMs: 60_000,
  limit: 25,
  prefix: 'portal',
  message: 'Demasiadas solicitudes al portal. Intenta de nuevo en un minuto.'
});

export const mcpLimiter = createRateLimiter({
  windowMs: 60_000,
  limit: 30,
  prefix: 'mcp',
  message: 'Rate limit excedido en el servidor MCP.'
});
