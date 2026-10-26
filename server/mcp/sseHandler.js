import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import { createGogliteMcpServer } from './gogliteMcpServer.js';

// Mapa de sesiones activas en memoria
const activeSessions = new Map();

/**
 * Configura las rutas MCP SSE y de mensajería para Express
 */
export function setupMcpRoutes(app) {
  // Manejador del canal de eventos SSE (GET /mcp o GET /api/mcp)
  const handleSse = async (req, res) => {
    try {
      console.log('[MCP SSE] Nueva solicitud de conexión SSE desde:', req.ip || req.headers['x-forwarded-for']);

      // Ruta base para que el cliente envíe sus peticiones POST
      const isApiPrefix = req.path.startsWith('/api');
      const messagesEndpoint = isApiPrefix ? '/api/mcp/messages' : '/mcp/messages';

      const transport = new SSEServerTransport(messagesEndpoint, res);
      const server = createGogliteMcpServer();
      const sessionId = transport.sessionId;

      activeSessions.set(sessionId, {
        transport,
        server,
        createdAt: Date.now()
      });

      req.on('close', () => {
        console.log(`[MCP SSE] Sesión cerrada por cliente: ${sessionId}`);
        activeSessions.delete(sessionId);
      });

      await server.connect(transport);
      console.log(`[MCP SSE] Sesión iniciada y conectada exitosamente: ${sessionId}`);
    } catch (err) {
      console.error('[MCP SSE] Error al conectar transporte SSE:', err);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Fallo al iniciar sesión SSE MCP', details: err.message });
      }
    }
  };

  // Manejador de mensajes POST del cliente
  const handlePostMessage = async (req, res) => {
    const sessionId = req.query.sessionId;
    if (!sessionId) {
      return res.status(400).json({ error: "Falta el parámetro 'sessionId' en la query string (?sessionId=...)" });
    }

    const session = activeSessions.get(sessionId);
    if (!session) {
      return res.status(404).json({ error: `Sesión MCP '${sessionId}' no encontrada o expirada.` });
    }

    try {
      await session.transport.handlePostMessage(req, res);
    } catch (err) {
      console.error(`[MCP SSE] Error procesando mensaje para sesión ${sessionId}:`, err);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Error procesando mensaje MCP', details: err.message });
      }
    }
  };

  // Registro de rutas HTTP
  app.get('/mcp', handleSse);
  app.post('/mcp/messages', handlePostMessage);
  app.get('/api/mcp', handleSse);
  app.post('/api/mcp/messages', handlePostMessage);

  // Monitor de salud para validar que el servicio MCP en la nube está en línea
  app.get('/api/mcp/status', (req, res) => {
    res.json({
      status: 'active',
      name: 'goglite-agency-mcp',
      version: '2.0.0',
      activeSessions: activeSessions.size,
      cloudSync: true,
      timestamp: new Date().toISOString()
    });
  });

  console.log('⚡ [MCP SSE] Rutas /mcp y /api/mcp registradas exitosamente.');
}
