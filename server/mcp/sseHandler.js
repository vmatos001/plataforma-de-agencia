import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import { createGogliteMcpServer } from './gogliteMcpServer.js';
import { verifyMcpAgentKey } from '../services/agencySettingsStorage.js';
import { mcpLimiter } from '../middleware/rateLimiter.js';
import { logSecurityEvent } from '../services/auditLogger.js';

// Mapa de sesiones activas en memoria con límites estrictos anti-DoS (C-08)
const activeSessions = new Map();
const MAX_SESSIONS = 20;
const SESSION_TTL_MS = 30 * 60 * 1000; // 30 minutos

function purgeExpiredSessions() {
  const now = Date.now();
  for (const [id, session] of activeSessions.entries()) {
    if (now - session.createdAt > SESSION_TTL_MS) {
      try {
        session.transport?.close?.();
      } catch {}
      activeSessions.delete(id);
    }
  }
}

setInterval(purgeExpiredSessions, 60_000).unref?.();

/**
 * Middleware de autenticación a nivel de transporte HTTP para SSE MCP (C-08, L-02).
 * Valida la llave en cabecera Authorization: Bearer <key> o X-MCP-Agent-Key contra su hash SHA-256.
 */
function mcpAuth(req, res, next) {
  const bearer = (req.headers.authorization || '').replace(/^Bearer\s+/i, '').trim();
  const headerKey = (req.headers['x-mcp-agent-key'] || '').toString().trim();
  const providedKey = bearer || headerKey;

  if (!verifyMcpAgentKey(providedKey)) {
    logSecurityEvent('MCP_SSE_UNAUTHORIZED', { path: req.originalUrl }, req);
    return res.status(401).json({
      error: 'No autorizado. Suministra una llave MCP válida en la cabecera Authorization: Bearer <key>.'
    });
  }

  return next();
}

/**
 * Configura las rutas MCP SSE y de mensajería para Express
 */
export function setupMcpRoutes(app) {
  const handleSse = async (req, res) => {
    try {
      purgeExpiredSessions();
      if (activeSessions.size >= MAX_SESSIONS) {
        return res.status(503).json({
          error: 'Límite máximo de sesiones MCP concurrentes alcanzado.'
        });
      }

      const isApiPrefix = req.path.startsWith('/api');
      const messagesEndpoint = isApiPrefix ? '/api/mcp/messages' : '/mcp/messages';

      const transport = new SSEServerTransport(messagesEndpoint, res);
      const server = createGogliteMcpServer({ transportMode: 'sse', authenticatedAtTransport: true });
      const sessionId = transport.sessionId;

      activeSessions.set(sessionId, {
        transport,
        server,
        createdAt: Date.now()
      });

      req.on('close', () => {
        activeSessions.delete(sessionId);
      });

      logSecurityEvent('MCP_SSE_SESSION_START', { sessionId }, req);
      await server.connect(transport);
    } catch (err) {
      console.error('[MCP SSE] Error al conectar transporte SSE:', err.message);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Fallo interno al iniciar sesión SSE MCP' });
      }
    }
  };

  const handlePostMessage = async (req, res) => {
    purgeExpiredSessions();
    const sessionId = String(req.query.sessionId || '');
    if (!sessionId) {
      return res.status(400).json({ error: "Falta el parámetro 'sessionId' en la query string (?sessionId=...)" });
    }

    const session = activeSessions.get(sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Sesión MCP no encontrada o expirada.' });
    }

    try {
      await session.transport.handlePostMessage(req, res, req.body);
    } catch (err) {
      console.error(`[MCP SSE] Error procesando mensaje para sesión ${sessionId}:`, err.message);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Error procesando mensaje MCP' });
      }
    }
  };

  // Registro de rutas HTTP protegidas con autenticación por cabecera y rate limiting
  app.get('/mcp', mcpLimiter, mcpAuth, handleSse);
  app.post('/mcp/messages', mcpLimiter, mcpAuth, handlePostMessage);
  app.get('/api/mcp', mcpLimiter, mcpAuth, handleSse);
  app.post('/api/mcp/messages', mcpLimiter, mcpAuth, handlePostMessage);

  // Monitor de salud protegido
  app.get('/api/mcp/status', mcpLimiter, mcpAuth, (_req, res) => {
    purgeExpiredSessions();
    res.json({
      status: 'active',
      name: 'goglite-agency-mcp',
      version: '2.1.0',
      activeSessions: activeSessions.size,
      maxSessions: MAX_SESSIONS,
      cloudSync: true,
      timestamp: new Date().toISOString()
    });
  });

  console.log('⚡ [MCP SSE] Rutas /mcp y /api/mcp registradas con autenticación SHA-256.');
}
