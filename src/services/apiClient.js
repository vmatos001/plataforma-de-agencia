/**
 * Cliente HTTP centralizado y resiliente para Goglite Agency Platform
 * Incluye gestión de sesión autenticada (cookie HttpOnly + cabecera firmada X-GG-Session).
 */

const SESSION_TOKEN_KEY = 'goglite_session_token';

export function getSessionToken() {
  if (typeof window === 'undefined') return '';
  try {
    return sessionStorage.getItem(SESSION_TOKEN_KEY) || '';
  } catch {
    return '';
  }
}

export function setSessionToken(token) {
  if (typeof window === 'undefined') return;
  try {
    if (token) {
      sessionStorage.setItem(SESSION_TOKEN_KEY, String(token));
    } else {
      sessionStorage.removeItem(SESSION_TOKEN_KEY);
    }
  } catch {}
}

export function clearSessionToken() {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.removeItem(SESSION_TOKEN_KEY);
    sessionStorage.removeItem('goglite_auth_session');
  } catch {}
}

const RAW_API_URL = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_URL)
  ? String(import.meta.env.VITE_API_URL).trim()
  : (typeof window !== 'undefined' && (
      window.location.hostname.includes('goglite.com') ||
      window.location.hostname.includes('web.app') ||
      window.location.hostname.includes('firebaseapp.com')
    )
      ? 'https://goglite-agency.vercel.app'
      : '');

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
  const base = API_BASE_URL || (typeof window !== 'undefined' && (
    window.location.hostname.includes('goglite.com') ||
    window.location.hostname.includes('web.app') ||
    window.location.hostname.includes('firebaseapp.com')
  ) ? 'https://goglite-agency.vercel.app' : '');
  return base ? `${base}${cleanEndpoint}` : cleanEndpoint;
}

/**
 * Fetch mejorado con timeout por defecto, credenciales de sesión y manejo estándar de errores JSON
 */
export async function apiFetch(endpoint, options = {}) {
  const url = getApiUrl(endpoint);
  const { timeoutMs = 25000, headers = {}, body, credentials = 'include', ...restOptions } = options;

  const controller = new AbortController();
  let timerId = null;
  if (timeoutMs > 0 && !options.signal) {
    timerId = setTimeout(() => controller.abort(), timeoutMs);
  }

  const effectiveSignal = options.signal || controller.signal;

  try {
    const sessionToken = getSessionToken();
    const finalHeaders = {
      'Accept': 'application/json',
      ...(sessionToken ? { 'X-GG-Session': sessionToken } : {}),
      ...headers
    };

    let serializedBody = body;
    if (body !== undefined && typeof body !== 'string' && !(body instanceof FormData) && !(body instanceof Blob)) {
      finalHeaders['Content-Type'] = 'application/json';
      serializedBody = JSON.stringify(body);
    }

    let response = await fetch(url, {
      ...restOptions,
      credentials,
      signal: effectiveSignal,
      headers: finalHeaders,
      body: serializedBody
    });

    // Si Firebase Hosting o un hosting estático devolvió index.html para un endpoint /api/
    const cType = response.headers.get('content-type') || '';
    if (cType.includes('text/html') && url.includes('/api/') && !url.includes('vercel.app')) {
      const fallbackUrl = `https://goglite-agency.vercel.app${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
      try {
        const fallbackRes = await fetch(fallbackUrl, {
          ...restOptions,
          credentials,
          signal: effectiveSignal,
          headers: finalHeaders,
          body: serializedBody
        });
        const fbCtype = fallbackRes.headers.get('content-type') || '';
        if (fbCtype.includes('application/json') || fallbackRes.ok) {
          response = fallbackRes;
        }
      } catch (fbErr) {
        console.warn('[apiClient] Fallback a Vercel falló:', fbErr);
      }
    }

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
 * Conexión resiliente a Server-Sent Events (SSE) autenticada en tiempo real
 */
export function subscribeToPlatformEvents(onEvent) {
  if (typeof window === 'undefined' || typeof EventSource === 'undefined') return () => {};

  const eventsUrl = getApiUrl('/api/events');
  let es = null;
  let retryTimer = null;

  function connect() {
    try {
      es = new EventSource(eventsUrl, { withCredentials: true });

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
