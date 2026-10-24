/**
 * Cliente HTTP centralizado y resiliente para Goglite Agency Platform
 * Lee import.meta.env.VITE_API_URL para entornos distribuidos (Cloud Run, Railway, Render)
 * o recurre a enrutamiento relativo (/api/...) compatible con el proxy de desarrollo de Vite.
 */

const RAW_API_URL = typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_URL
  ? String(import.meta.env.VITE_API_URL).trim()
  : '';

export const API_BASE_URL = RAW_API_URL.replace(/\/+$/, '');

/**
 * Resuelve una ruta de API relativa o absoluta a su URL final de destino
 * @param {string} endpoint - Ej: '/api/leads' o 'https://...'
 * @returns {string} URL completa o ruta relativa limpia
 */
export function getApiUrl(endpoint = '') {
  if (!endpoint) return API_BASE_URL || '';
  if (/^https?:\/\//i.test(endpoint)) {
    return endpoint;
  }
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return API_BASE_URL ? `${API_BASE_URL}${cleanEndpoint}` : cleanEndpoint;
}

/**
 * Fetch mejorado con timeout por defecto y manejo estándar de errores JSON
 */
export async function apiFetch(endpoint, options = {}) {
  const url = getApiUrl(endpoint);
  const { timeoutMs = 25000, headers = {}, body, ...restOptions } = options;

  const controller = new AbortController();
  let timerId = null;
  if (timeoutMs > 0 && !options.signal) {
    timerId = setTimeout(() => controller.abort(), timeoutMs);
  }

  const effectiveSignal = options.signal || controller.signal;

  try {
    const finalHeaders = {
      'Accept': 'application/json',
      ...headers
    };

    let serializedBody = body;
    if (body !== undefined && typeof body !== 'string' && !(body instanceof FormData) && !(body instanceof Blob)) {
      finalHeaders['Content-Type'] = 'application/json';
      serializedBody = JSON.stringify(body);
    }

    const response = await fetch(url, {
      ...restOptions,
      signal: effectiveSignal,
      headers: finalHeaders,
      body: serializedBody
    });

    if (timerId) clearTimeout(timerId);

    return response;
  } catch (err) {
    if (timerId) clearTimeout(timerId);
    throw err;
  }
}

export const apiClient = {
  get: (endpoint, options) => apiFetch(endpoint, { method: 'GET', ...options }),
  post: (endpoint, body, options) => apiFetch(endpoint, { method: 'POST', body, ...options }),
  patch: (endpoint, body, options) => apiFetch(endpoint, { method: 'PATCH', body, ...options }),
  put: (endpoint, body, options) => apiFetch(endpoint, { method: 'PUT', body, ...options }),
  delete: (endpoint, options) => apiFetch(endpoint, { method: 'DELETE', ...options })
};

/**
 * Conexión resiliente a Server-Sent Events (SSE) en tiempo real
 */
export function subscribeToPlatformEvents(onEvent) {
  if (typeof window === 'undefined' || typeof EventSource === 'undefined') return () => {};

  const eventsUrl = getApiUrl('/api/events');
  let es = null;
  let retryTimer = null;

  function connect() {
    try {
      es = new EventSource(eventsUrl);

      es.onmessage = (event) => {
        try {
          if (!event.data || event.data.startsWith(':')) return;
          const parsed = JSON.parse(event.data);
          if (onEvent) onEvent(parsed);
        } catch {}
      };

      es.onerror = () => {
        if (es) {
          es.close();
          es = null;
        }
        if (!retryTimer) {
          retryTimer = setTimeout(() => {
            retryTimer = null;
            connect();
          }, 5000);
        }
      };
    } catch {}
  }

  connect();

  return () => {
    if (retryTimer) clearTimeout(retryTimer);
    if (es) es.close();
  };
}

export default apiClient;
