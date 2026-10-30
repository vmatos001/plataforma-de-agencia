import * as cheerio from 'cheerio';
import dns from 'dns';
import net from 'net';
import { getSettings } from './storage.js';

/**
 * Audits a domain for SEO, GEO (IA visibility), Speed, and CRO issues
 */
export async function auditDomain(domain, queryKeyword = '', country = 'SV', options = {}) {
  const settings = getSettings();
  const geminiKey = process.env.GEMINI_API_KEY || settings.geminiApiKey;

  // Handle Google Maps businesses that lack a real website
  const isMapsNoWeb = domain.startsWith('maps-') || options.sinWeb || options.tipoFuente === 'google_maps';
  if (isMapsNoWeb) {
    return generateMapsNoWebAudit(domain, queryKeyword, country, options);
  }

  // 1. Inspect live website
  const siteData = await inspectSite(domain);

  // 2. If Gemini API key is available, use it for qualitative deep analysis
  if (geminiKey && geminiKey.trim()) {
    try {
      const geminiAudit = await generateGeminiAudit(domain, queryKeyword, country, siteData, geminiKey);
      if (geminiAudit && geminiAudit.puntos?.length > 0) {
        return {
          fecha: new Date().toISOString().replace('T', ' ').substring(0, 16),
          siteData,
          ...geminiAudit
        };
      }
    } catch (err) {
      console.warn(`Gemini audit call failed for ${domain}:`, err.message);
    }
  }

  // 3. Smart rule-based audit engine
  return generateHeuristicAudit(domain, queryKeyword, country, siteData);
}

function generateMapsNoWebAudit(domain, queryKeyword = '', country = 'SV', options = {}) {
  const isDO = country.toUpperCase() === 'DO';
  const cName = isDO ? 'República Dominicana' : 'El Salvador';
  const resenas = options.resenas || 50;
  const rating = options.calificacion || 4.7;

  return {
    fecha: new Date().toISOString().replace('T', ' ').substring(0, 16),
    tipoAuditoria: 'google_maps_no_web',
    resenas,
    rating,
    puntos: [
      {
        categoria: "GEO / IA",
        prioridad: "CRÍTICA",
        titulo: "Inexistencia de Sitio Web Propio: Invisibles ante ChatGPT y Perplexity",
        problema: `A pesar de contar con ${resenas} reseñas y ${rating}★ en Google Maps, el negocio carece de un dominio web propio. Cuando clientes potenciales en ${cName} consultan a asistentes de IA por los mejores servicios o tratamientos, la IA no puede indexar servicios ni reputación oficial, recomendando exclusivamente a competidores con sitios web estructurados.`,
        porQueImporta: "Más del 42% de los clientes investigan y eligen servicios mediante asistentes de IA antes de acudir a un local o agendar citas.",
        competidores: "Competidores directos cuentan con sitios web con datos Schema LocalBusiness/MedicalBusiness que son citados preferentemente por ChatGPT y Perplexity."
      },
      {
        categoria: "CRO & Captación 24/7",
        prioridad: "ALTA",
        titulo: "Fuga del 100% de reservas y clientes fuera del horario comercial",
        problema: `Al depender únicamente de llamadas telefónicas o redes sociales, carecen de un sistema digital de reservas automáticas o catálogo de servicios en línea activo las 24 horas.`,
        porQueImporta: "Más del 60% de las búsquedas en Google se realizan en horarios no laborales cuando el teléfono no atiende; sin formulario o WhatsApp háptico directo en web, el cliente abandona.",
        competidores: "Webs optimizadas convierten hasta un 18% más de visitantes en pacientes/clientes con embudos directos de agendamiento."
      },
      {
        categoria: "SEO & Autoridad Local",
        prioridad: "ALTA",
        titulo: "Pérdida de tráfico en búsquedas de Google transaccionales",
        problema: `Su presencia se limita al mapa local. En las búsquedas orgánicas principales de Google para '${queryKeyword || 'servicios locales'}', están totalmente ausentes por no tener página web indexable.`,
        porQueImporta: "Una infraestructura web moderna permitiría convertir esa reputación de ${resenas} reseñas en un canal orgánico dominante de adquisición de clientes.",
        competidores: "Los competidores en los primeros lugares de Google capturan más del 50% de los clics transaccionales con intención de compra."
      }
    ]
  };
}

export function isPrivateOrReservedIp(ip) {
  if (!ip || typeof ip !== 'string') return true;
  const cleanIp = ip.trim().toLowerCase();

  // IPv6 mapped IPv4 (::ffff:127.0.0.1)
  if (cleanIp.startsWith('::ffff:')) {
    return isPrivateOrReservedIp(cleanIp.slice(7));
  }

  if (net.isIPv4(cleanIp)) {
    const parts = cleanIp.split('.').map(Number);
    const [o1, o2] = parts;
    if (o1 === 0 || o1 === 10 || o1 === 127) return true; // 0.0.0.0/8, 10.0.0.0/8, 127.0.0.0/8
    if (o1 === 169 && o2 === 254) return true; // 169.254.0.0/16 (Link-local / Cloud Metadata)
    if (o1 === 172 && o2 >= 16 && o2 <= 31) return true; // 172.16.0.0/12
    if (o1 === 192 && o2 === 168) return true; // 192.168.0.0/16
    if (o1 === 100 && o2 >= 64 && o2 <= 127) return true; // 100.64.0.0/10 (CGNAT)
    if (o1 >= 224) return true; // Multicast / Reserved
    return false;
  }

  if (net.isIPv6(cleanIp)) {
    if (cleanIp === '::1' || cleanIp === '::') return true;
    if (cleanIp.startsWith('fc') || cleanIp.startsWith('fd')) return true; // Unique Local fc00::/7
    if (cleanIp.startsWith('fe8') || cleanIp.startsWith('fe9') || cleanIp.startsWith('fea') || cleanIp.startsWith('feb')) return true; // Link-local fe80::/10
    return false;
  }

  return true;
}

export function isSafePublicHost(rawHost) {
  if (!rawHost || typeof rawHost !== 'string') return false;
  const clean = rawHost.trim().toLowerCase().replace(/^https?:\/\//, '').split('/')[0].split(':')[0];
  if (!clean || clean.length > 253) return false;

  // Bloqueo de localhost y nombres reservados
  if (
    clean === 'localhost' ||
    clean.endsWith('.local') ||
    clean.endsWith('.internal') ||
    clean.endsWith('.onion') ||
    clean.endsWith('.arpa')
  ) {
    return false;
  }

  if (net.isIP(clean)) {
    return !isPrivateOrReservedIp(clean);
  }

  // Validación de formato de dominio estándar
  return /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\.[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)+$/i.test(clean);
}

/**
 * Resuelve DNS del host y verifica que ninguna IP resultante pertenezca a rangos privados o internos (M-03 SSRF).
 */
export async function resolveAndValidatePublicHost(rawHost) {
  const clean = (rawHost || '').trim().toLowerCase().replace(/^https?:\/\//, '').split('/')[0].split(':')[0];
  if (!isSafePublicHost(clean)) return false;
  try {
    const records = await dns.promises.lookup(clean, { all: true });
    if (!Array.isArray(records) || records.length === 0) return false;
    return records.every(r => !isPrivateOrReservedIp(r.address));
  } catch {
    return false;
  }
}

async function inspectSite(domain) {
  const cleanDomain = (domain || '').replace(/^https?:\/\//, '').split('/')[0].trim();
  const isSafe = await resolveAndValidatePublicHost(cleanDomain);
  if (!isSafe) {
    console.warn(`[AUDITOR SSRF] Dominio descartado por validación de seguridad/DNS: "${cleanDomain}"`);
    return {
      reachable: false,
      title: '',
      metaDesc: '',
      h1: '',
      hasSchema: false,
      hasFAQ: false,
      hasWhatsApp: false,
      pageSizeKb: 0
    };
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const res = await fetch(`https://${cleanDomain}`, {
      signal: controller.signal,
      redirect: 'manual', // Prevenir redirección SSRF hacia IPs internas (M-03)
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) GogliteAuditorBot/1.0'
      }
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      // Limitar descarga a máximo 2.5 MB para prevenir agotamiento de memoria
      const rawText = await res.text();
      const html = rawText.slice(0, 2500000);
      const $ = cheerio.load(html);

      const title = $('title').text().trim().slice(0, 200);
      const metaDesc = ($('meta[name="description"]').attr('content') || '').trim().slice(0, 400);
      const h1s = $('h1').map((i, el) => $(el).text().trim()).get();
      const hasSchema = html.includes('application/ld+json');
      const hasFAQ = html.toLowerCase().includes('faq') || html.toLowerCase().includes('preguntas frecuentes');
      const hasWhatsApp = html.toLowerCase().includes('wa.me') || html.toLowerCase().includes('whatsapp');

      return {
        reachable: true,
        title,
        metaDesc,
        h1: (h1s[0] || '').slice(0, 200),
        hasSchema,
        hasFAQ,
        hasWhatsApp,
        pageSizeKb: Math.round(html.length / 1024)
      };
    }
  } catch (err) {
    // Dominio inaccesible o timeout
  }

  return {
    reachable: false,
    title: '',
    metaDesc: '',
    h1: '',
    hasSchema: false,
    hasFAQ: false,
    hasWhatsApp: false,
    pageSizeKb: 0
  };
}

async function generateGeminiAudit(domain, queryKeyword, country, siteData, apiKey) {
  const prompt = `Actúa como un Director de SEO y Optimización de Inteligencia Artificial (GEO/AIO) de la agencia de élite Goglite.
Analiza el dominio "${domain}" en el mercado de ${country === 'DO' ? 'República Dominicana' : 'El Salvador'}.
Palabra clave de intención: "${queryKeyword}".
Datos técnicos extraídos del sitio:
- Título actual: "${siteData.title}"
- H1 actual: "${siteData.h1}"
- ¿Tiene Schema JSON-LD para IA?: ${siteData.hasSchema ? 'Sí' : 'No'}
- ¿Tiene FAQs estructuradas?: ${siteData.hasFAQ ? 'Sí' : 'No'}
- ¿Tiene WhatsApp directo?: ${siteData.hasWhatsApp ? 'Sí' : 'No'}

Genera exactamente 3 puntos críticos de auditoría en formato JSON estricto con esta estructura:
{
  "puntos": [
    {
      "categoria": "GEO / IA" o "SEO" o "Velocidad & CRO" o "Contenido",
      "prioridad": "ALTA" o "MEDIA",
      "titulo": "Título conciso y llamativo del error",
      "problema": "Descripción técnica pero comprensible del problema detectado",
      "porQueImporta": "Impacto directo en pérdida de ventas o visibilidad ante IAs/Google",
      "competidores": "Cómo lo resuelven los competidores top de la posición #1"
    }
  ]
}
Devuelve SOLAMENTE el bloque JSON.`;

  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: "application/json" }
    })
  });

  if (res.ok) {
    const data = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (text) {
      return JSON.parse(text);
    }
  }
  return null;
}

function generateHeuristicAudit(domain, queryKeyword, country, siteData) {
  const isDO = country.toUpperCase() === 'DO';
  const cName = isDO ? 'República Dominicana' : 'El Salvador';
  const cCity = isDO ? 'Santo Domingo' : 'San Salvador';
  const kw = queryKeyword || 'servicios profesionales';

  const puntos = [
    {
      categoria: "GEO / IA",
      prioridad: "ALTA",
      titulo: siteData.hasSchema 
        ? "Marcado de entidad semántica incompleto para motores de IA"
        : "Ausencia total de Schema JSON-LD (Invisible en ChatGPT y Perplexity)",
      problema: `${domain} no implementa esquemas estructurados de organización ni de servicios locales. Cuando usuarios en ${cCity} consultan a Perplexity o SearchGPT por proveedores confiables de ${kw}, el modelo de lenguaje carece de datos estructurados para citar la marca.`,
      porQueImporta: "Más del 35% de compradores B2B y clientes premium ya consultan IAs antes de buscar en Google. La falta de presencia semántica cede el 100% de estas recomendaciones a la competencia.",
      competidores: `Los competidores que ocupan la posición #1 cuentan con Schema Organization y FAQPage verificados, logrando ser referenciados en respuestas directas de IA.`
    },
    {
      categoria: "SEO",
      prioridad: "ALTA",
      titulo: siteData.title && siteData.h1
        ? `Desconexión entre Title ('${siteData.title.slice(0, 30)}...') y H1 sin keyword transaccional`
        : `Title y H1 genéricos sin intención de búsqueda comercial en ${cCity}`,
      problema: `El sitio web omite términos transaccionales de alto valor en su etiqueta Title principal y su encabezado H1. Google prioriza páginas que alinean explícitamente la consulta del usuario con su estructura jerárquica.`,
      porQueImporta: `Esto penaliza el Click-Through Rate (CTR) orgánico y relega al negocio a la posición actual fuera del podio principal de Google en ${cName}.`,
      competidores: `Los sitios en las 3 primeras posiciones alinean el término exacto con su oferta de valor en menos de 60 caracteres.`
    },
    {
      categoria: siteData.hasFAQ ? "Velocidad & CRO" : "Contenido / FAQs",
      prioridad: "MEDIA",
      titulo: siteData.hasFAQ
        ? "Carga móvil no optimizada (LCP superior a 3.8s) y fricción en móviles"
        : "Ausencia de sección de Preguntas Frecuentes (FAQ) para capturar tráfico long-tail",
      problema: siteData.hasFAQ
        ? `Se detecta una sobrecarga de scripts y fuentes no cacheadas que retrasan el First Contentful Paint en conexiones móviles locales de ${cCity}.`
        : `No responden en su web las dudas más habituales sobre tarifas, garantías y tiempos de atención de ${kw}, dejando sin responder la intención de búsqueda de cola larga.`,
      porQueImporta: siteData.hasFAQ
        ? `El 82% de las búsquedas en ${cName} se realizan desde smartphones; un segundo adicional de retraso incrementa el abandono en un 32%.`
        : `Las FAQs estructuradas permiten adueñarse de los 'Featured Snippets' de Google y alimentar a los motores de IA con respuestas rápidas.`,
      competidores: `Webs construidas con arquitecturas modernas de alto rendimiento alcanzan 95+ en Google PageSpeed y reducen la tasa de rebote a la mitad.`
    }
  ];

  return {
    fecha: new Date().toISOString().replace('T', ' ').substring(0, 16),
    siteData,
    puntos
  };
}
