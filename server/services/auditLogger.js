import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const AUDIT_LOG_PATH = path.join(__dirname, '../data/security_audit.log');

/**
 * Registra eventos de seguridad y acciones críticas de forma inmutable (append-only).
 * Cumple con OWASP ASVS V7 / Hallazgo M-06.
 */
export function logSecurityEvent(action, details = {}, req = null) {
  const entry = {
    timestamp: new Date().toISOString(),
    action,
    actor: req?.user?.email || details.actor || req?.googleIdentity?.email || 'anonymous',
    role: req?.user?.rol || details.role || null,
    ip: req
      ? (req.headers?.['x-forwarded-for']?.split(',')[0]?.trim() || req.socket?.remoteAddress || req.ip || 'unknown')
      : (details.ip || 'system'),
    userAgent: req?.headers?.['user-agent']?.slice(0, 160) || undefined,
    details: sanitizeAuditDetails(details)
  };

  const line = JSON.stringify(entry) + '\n';
  console.error(`[SECURITY AUDIT] ${action} by ${entry.actor} (${entry.ip})`);

  try {
    const dir = path.dirname(AUDIT_LOG_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.appendFileSync(AUDIT_LOG_PATH, line, { encoding: 'utf8', mode: 0o600 });
  } catch (err) {
    // En entornos serverless read-only (Vercel), el stdout ya queda registrado en Cloud Logs
  }

  return entry;
}

function sanitizeAuditDetails(details = {}) {
  const clone = { ...details };
  const redactKeys = ['secret', 'totpKeySecret', 'totpEnc', 'totpPendingEnc', 'password', 'passwordHash', 'token', 'agentKey', 'mcpAgentKey'];
  for (const k of redactKeys) {
    if (k in clone) {
      clone[k] = '[REDACTED]';
    }
  }
  return clone;
}
