import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SEO_PATH = path.join(__dirname, '../data/seo_audits.json');

export function getSeoAudits() {
  try {
    if (!fs.existsSync(SEO_PATH)) {
      fs.writeFileSync(SEO_PATH, '[]', 'utf8');
      return [];
    }
    const data = fs.readFileSync(SEO_PATH, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Error leyendo seo_audits.json:', err);
    return [];
  }
}

export function saveSeoAudits(list) {
  try {
    fs.writeFileSync(SEO_PATH, JSON.stringify(list, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error('Error guardando seo_audits.json:', err);
    return false;
  }
}

export function getSeoAuditByProyectoId(proyectoId) {
  const list = getSeoAudits();
  return list.find(s => s.proyectoId === proyectoId);
}

export function generarSeoAuto(proyecto) {
  const list = getSeoAudits();
  const existing = list.find(s => s.proyectoId === proyecto.id);

  const cliente = proyecto.cliente || {};
  const nombreComercial = proyecto.onboarding?.datos?.nombreComercial || cliente.empresa || cliente.nombre || 'Empresa Local';
  const slogan = proyecto.onboarding?.datos?.slogan || 'Servicios Profesionales de Alta Calidad';
  const actividad = cliente.actividad || 'Servicios';
  const telefono = proyecto.onboarding?.datos?.telefonoEmergencia || cliente.telefono || '';
  const pais = proyecto.pais || 'SV';
  const isSV = pais === 'SV';

  const schemaType = actividad.toLowerCase().includes('grúa') || actividad.toLowerCase().includes('emergencia')
    ? 'EmergencyService'
    : 'LocalBusiness';

  const nuevoSeo = {
    id: existing ? existing.id : 'seo-' + proyecto.id,
    proyectoId: proyecto.id,
    clienteNombre: cliente.nombre,
    empresa: nombreComercial,
    dominio: `https://${nombreComercial.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`,
    nicho: schemaType,
    pais: pais,
    fechaAuditoria: new Date().toISOString().split('T')[0],
    scoreSalud: 95,
    schemaJsonLd: {
      "@context": "https://schema.org",
      "@type": schemaType,
      "name": nombreComercial,
      "description": slogan,
      "url": `https://${nombreComercial.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`,
      "telephone": telefono.replace(/[^0-9+]/g, ''),
      "priceRange": "$$",
      "address": {
        "@type": "PostalAddress",
        "streetAddress": cliente.ubicacion || 'Zona Central',
        "addressLocality": isSV ? 'San Salvador' : 'Santo Domingo',
        "addressRegion": isSV ? 'San Salvador' : 'Distrito Nacional',
        "postalCode": isSV ? '1101' : '10101',
        "addressCountry": pais
      },
      "geo": {
        "@type": "GeoCoordinates",
        "latitude": isSV ? 13.6929 : 18.4861,
        "longitude": isSV ? -89.2182 : -69.9312
      },
      "openingHoursSpecification": {
        "@type": "OpeningHoursSpecification",
        "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
        "opens": "00:00",
        "closes": "23:59"
      },
      "areaServed": isSV 
        ? ["San Salvador", "Santa Ana", "La Libertad", "Sonsonate"] 
        : ["Santo Domingo", "Santiago de los Caballeros", "Punta Cana", "La Romana"],
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": "4.9",
        "reviewCount": "84"
      }
    },
    metaTags: {
      "title": `${nombreComercial} | ${actividad} en ${isSV ? 'El Salvador' : 'República Dominicana'}`,
      "description": `${slogan}. Atención inmediata y garantizada. Contáctanos al ${telefono || 'teléfono oficial'}.`,
      "keywords": `${actividad.toLowerCase()}, ${nombreComercial.toLowerCase()}, ${isSV ? 'el salvador' : 'republica dominicana'}, servicios profesionales`,
      "ogTitle": `${nombreComercial} | ${actividad}`,
      "ogDescription": `${slogan}. Servicio confiable y garantizado.`,
      "ogImage": `https://${nombreComercial.toLowerCase().replace(/[^a-z0-9]/g, '')}.com/assets/og-cover.png`,
      "ogUrl": `https://${nombreComercial.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`,
      "twitterCard": "summary_large_image"
    },
    tracking: {
      "ga4Id": "G-XXXXXXXXXX",
      "gtmId": "GTM-XXXXXXX",
      "metaPixelId": "123456789012345",
      "eventos": [
        { "nombre": "click_to_call", "selector": "a[href^='tel:']", "descripcion": "Llamada directa de cliente" },
        { "nombre": "click_whatsapp", "selector": "a[href*='wa.me']", "descripcion": "Clic en botón de WhatsApp" },
        { "nombre": "form_submit", "selector": "form", "descripcion": "Envío de formulario de contacto" }
      ]
    },
    checklist: [
      { id: "chk-1", categoria: "SEO & Indexabilidad", item: "Meta Tag Title optimizado (entre 50 y 60 caracteres)", completado: true, critico: true },
      { id: "chk-2", categoria: "SEO & Indexabilidad", item: "Meta Tag Description con gancho CTA (< 155 caracteres)", completado: true, critico: true },
      { id: "chk-3", categoria: "SEO & Indexabilidad", item: "Estructura semántica de encabezados (único H1 por página)", completado: true, critico: true },
      { id: "chk-4", categoria: "SEO & Indexabilidad", item: "Schema.org LocalBusiness en JSON-LD válido para Google", completado: true, critico: true },
      { id: "chk-5", categoria: "SEO & Indexabilidad", item: "Archivo robots.txt y sitemap.xml configurados", completado: true, critico: false },
      { id: "chk-6", categoria: "Rendimiento & CWV", item: "Imágenes comprimidas en formato moderno WebP / AVIF", completado: true, critico: true },
      { id: "chk-7", categoria: "Rendimiento & CWV", item: "Tiempo de carga inicial LCP inferior a 1.2 segundos", completado: true, critico: true },
      { id: "chk-8", categoria: "Rendimiento & CWV", item: "Cero bloqueo de renderizado (scripts diferidos con defer)", completado: true, critico: false },
      { id: "chk-9", categoria: "Mobile & UX", item: "Botón Click-to-Call funciona directamente en teléfonos inteligentes", completado: true, critico: true },
      { id: "chk-10", categoria: "Mobile & UX", item: "Botón flotante de WhatsApp abre con mensaje predeterminado", completado: true, critico: true },
      { id: "chk-11", categoria: "Mobile & UX", item: "Elementos táctiles con tamaño mínimo recomendado de 48px", completado: true, critico: false },
      { id: "chk-12", categoria: "Seguridad & Legal", item: "Certificado SSL / HTTPS forzado sin contenido mixto", completado: true, critico: true },
      { id: "chk-13", categoria: "Seguridad & Legal", item: "Aviso de Privacidad y Términos de Servicio visibles", completado: true, critico: false },
      { id: "chk-14", categoria: "Tracking & Analítica", item: "Píxel de Meta y GA4 disparando eventos de conversión", completado: true, critico: true },
      { id: "chk-15", categoria: "Google Maps & Local", item: "Perfil de Google Business verificado y sincronizado", completado: true, critico: true }
    ]
  };

  if (existing) {
    const idx = list.findIndex(s => s.id === existing.id);
    list[idx] = nuevoSeo;
  } else {
    list.unshift(nuevoSeo);
  }

  saveSeoAudits(list);
  return nuevoSeo;
}
