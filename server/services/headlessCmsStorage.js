import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getProyectos } from './proyectosStorage.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CMS_PATH = path.join(__dirname, '../data/cms_sites.json');

function initializeCmsData() {
  if (fs.existsSync(CMS_PATH)) {
    try {
      const data = fs.readFileSync(CMS_PATH, 'utf8');
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    } catch (e) {
      console.warn('Error leyendo cms_sites.json:', e);
    }
  }

  // Seed default site based on existing projects
  const initialSites = [
    {
      id: 'cms-001',
      slug: 'gruas-andrea',
      nombre: 'Grúas Andrea / Auxilio Vial 24/7',
      pais: 'SV',
      dominio: 'gruasandrea.com',
      estado: 'publicado',
      ultimaActualizacion: '2026-10-10',
      contenido: {
        branding: {
          nombreMarca: 'Grúas Andrea',
          slogan: 'Auxilio Vial & Grúas Plataforma 24 Horas',
          colorPrimario: '#FF6B00',
          telefonoWhatsApp: '+1 (323) 901-3886',
          ciudadPrincipal: 'San Salvador / Cobertura Regional'
        },
        hero: {
          badge: '⚡ Llegamos en menos de 25 minutos',
          titulo: '¿Te Quedaste Varado? Servicio de Grúas Rápido y Seguro 24/7',
          subtitulo: 'Asistencia inmediata para vehículos ligeros, camionetas y transporte pesado. Precios justos sin sorpresas y remolque profesional garantizado.',
          botonTexto: 'Solicitar Grúa por WhatsApp',
          botonSubtexto: 'Respuesta inmediata garantizada'
        },
        servicios: [
          {
            id: 's-1',
            titulo: 'Remolque en Grúa de Plataforma',
            descripcion: 'Transporte seguro para sedanes, SUVs y deportivos sin rozar defensas ni desgastar llantas.',
            precio: 'Desde $45 USD'
          },
          {
            id: 's-2',
            titulo: 'Paso de Corriente & Batería',
            descripcion: 'Unidad de auxilio rápido para reactivar tu batería en carretera o estacionamiento.',
            precio: 'Desde $20 USD'
          },
          {
            id: 's-3',
            titulo: 'Cambio de Neumático & Cerrajería Vial',
            descripcion: 'Apertura de autos cerrados y cambio de llanta pinchada en el lugar del incidente.',
            precio: 'Desde $25 USD'
          }
        ],
        testimonios: [
          {
            id: 't-1',
            cliente: 'Carlos Méndez',
            comentario: 'Excelente servicio. Llegaron en 20 minutos a la autopista y el trato del conductor fue de primera.',
            estrellas: 5
          },
          {
            id: 't-2',
            cliente: 'Dra. Patricia Rivas',
            comentario: 'Se me descargó la batería de noche y me auxiliaron al instante. Súper confiables.',
            estrellas: 5
          }
        ],
        faqs: [
          {
            pregunta: '¿Cuál es el tiempo promedio de llegada?',
            respuesta: 'Entre 20 y 30 minutos dentro de la zona metropolitana.'
          },
          {
            pregunta: '¿Qué formas de pago aceptan?',
            respuesta: 'Transferencia bancaria Banco Agrícola, Wompi, tarjeta de crédito y efectivo.'
          }
        ]
      }
    },
    {
      id: 'cms-002',
      slug: 'inmobiliaria-punta-cana',
      nombre: 'Villas & Condos Punta Cana',
      pais: 'DO',
      dominio: 'villaspuntacana.do',
      estado: 'borrador',
      ultimaActualizacion: '2026-10-10',
      contenido: {
        branding: {
          nombreMarca: 'Villas Punta Cana Luxury',
          slogan: 'Inversiones Inmobiliarias de Alto Rendimiento',
          colorPrimario: '#0284C7',
          telefonoWhatsApp: '+1 (809) 555-0199',
          ciudadPrincipal: 'Punta Cana, Bávaro & Cap Cana'
        },
        hero: {
          badge: '🌴 Exención fiscal Ley CONFOTUR',
          titulo: 'Invierte en el Paraíso con Rentabilidades Superiores al 10% Anual',
          subtitulo: 'Condominios y villas exclusivas a minutos de la playa. Asesoría legal completa y gestión de renta vacacional para inversionistas extranjeros.',
          botonTexto: 'Descargar Catálogo de Proyectos',
          botonSubtexto: 'Unidades disponibles desde $135,000 USD'
        },
        servicios: [
          {
            id: 's-1',
            titulo: 'Condos en Preventa con Ley CONFOTUR',
            descripcion: '0% de impuesto de transferencia inmobiliaria y 0% de IPI durante 15 años.',
            precio: 'Desde $135,000 USD'
          },
          {
            id: 's-2',
            titulo: 'Villas con Piscina Privada',
            descripcion: 'Residencias de 3 y 4 habitaciones con acabados europeos en comunidades cerradas.',
            precio: 'Desde $260,000 USD'
          }
        ],
        testimonios: [
          {
            id: 't-1',
            cliente: 'Michael Johnson (Miami, FL)',
            comentario: 'El proceso de compra fue transparente de principio a fin. Gran retorno en Airbnb.',
            estrellas: 5
          }
        ],
        faqs: [
          {
            pregunta: '¿Un extranjero puede comprar propiedades en República Dominicana?',
            respuesta: 'Sí, los extranjeros cuentan con los mismos derechos legales de propiedad que los ciudadanos dominicanos.'
          }
        ]
      }
    }
  ];

  try {
    fs.writeFileSync(CMS_PATH, JSON.stringify(initialSites, null, 2), 'utf8');
  } catch (err) {
    console.error('Error escribiendo cms_sites.json:', err);
  }

  return initialSites;
}

export function getCmsSites() {
  try {
    if (!fs.existsSync(CMS_PATH)) return initializeCmsData();
    const data = fs.readFileSync(CMS_PATH, 'utf8');
    const parsed = JSON.parse(data);
    if (!Array.isArray(parsed) || parsed.length === 0) return initializeCmsData();
    return parsed;
  } catch (err) {
    console.error('Error leyendo cms_sites.json:', err);
    return initializeCmsData();
  }
}

export function saveCmsSites(list) {
  try {
    fs.writeFileSync(CMS_PATH, JSON.stringify(list, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error('Error guardando cms_sites.json:', err);
    return false;
  }
}

export function getCmsSiteBySlug(slug) {
  const sites = getCmsSites();
  return sites.find(s => s.slug === slug) || null;
}

export function updateCmsSiteContent(slug, newContent) {
  const sites = getCmsSites();
  const idx = sites.findIndex(s => s.slug === slug);
  if (idx === -1) return null;

  sites[idx].contenido = { ...sites[idx].contenido, ...newContent };
  sites[idx].ultimaActualizacion = new Date().toISOString().split('T')[0];
  saveCmsSites(sites);
  return sites[idx];
}

export function createCmsSite(siteData) {
  const sites = getCmsSites();
  const baseSlug = (siteData.slug || siteData.nombre || 'sitio-cliente')
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  
  let finalSlug = baseSlug || 'sitio-' + Date.now();
  let counter = 1;
  while (sites.some(s => s.slug === finalSlug)) {
    finalSlug = `${baseSlug}-${counter}`;
    counter++;
  }

  const newSite = {
    id: 'cms-' + Date.now(),
    slug: finalSlug,
    nombre: siteData.nombre || 'Nuevo Sitio Cliente',
    pais: siteData.pais || 'SV',
    dominio: siteData.dominio || `${finalSlug}.com`,
    estado: 'publicado',
    ultimaActualizacion: new Date().toISOString().split('T')[0],
    contenido: siteData.contenido || {
      branding: {
        nombreMarca: siteData.nombre || 'Marca del Cliente',
        slogan: 'Soluciones Profesionales Garantizadas',
        colorPrimario: '#FF6B00',
        telefonoWhatsApp: siteData.telefono || '+1 (829) 986-2000',
        ciudadPrincipal: siteData.pais === 'DO' ? 'Santo Domingo / Santiago' : 'San Salvador / Santa Tecla'
      },
      hero: {
        badge: '⚡ Servicio Garantizado 24/7',
        titulo: `La Solución Integral y Confiable para ${siteData.nombre || 'tu Negocio'}`,
        subtitulo: 'Atención personalizada, cotizaciones sin compromiso y respuesta inmediata por WhatsApp.',
        botonTexto: 'Contactar por WhatsApp',
        botonSubtexto: 'Respuesta en menos de 15 minutos'
      },
      servicios: [
        {
          id: 's-1',
          titulo: 'Servicio Principal',
          descripcion: 'Solución directa diseñada a la medida con entrega garantizada.',
          precio: 'Desde $50 USD'
        },
        {
          id: 's-2',
          titulo: 'Asesoría Especializada',
          descripcion: 'Diagnóstico express y acompañamiento profesional para tu caso.',
          precio: 'Sin costo inicial'
        }
      ],
      testimonios: [
        {
          id: 't-1',
          cliente: 'Cliente Satisfecho',
          comentario: 'Excelente servicio, muy recomendado por su rapidez y profesionalismo.',
          estrellas: 5
        }
      ],
      faqs: [
        {
          pregunta: '¿Cómo puedo agendar un servicio?',
          respuesta: 'Puedes escribirnos directamente a nuestro botón de WhatsApp oficial en cualquier momento.'
        }
      ]
    }
  };

  sites.push(newSite);
  saveCmsSites(sites);
  return newSite;
}

export function deleteCmsSite(slug) {
  let sites = getCmsSites();
  const initialLen = sites.length;
  sites = sites.filter(s => s.slug !== slug);
  if (sites.length < initialLen) {
    saveCmsSites(sites);
    return true;
  }
  return false;
}
