import React, { useState, useEffect, useMemo } from 'react';
import apiClient from '../services/apiClient';
import { getStoredProyectos, saveStoredProyectos } from '../services/contractGenerator';
import {
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Printer,
  Check,
  RotateCcw,
  Globe,
  Zap,
  Lock,
  Smartphone,
  Search,
  Share2,
  FileText,
  MapPin,
  Sparkles,
  Award,
  Filter,
  BarChart3,
  HardDrive,
  Activity,
  Server,
  Layers,
  CheckSquare,
  Square
} from 'lucide-react';

/**
 * PROTOCOLO MAESTRO DE 30 CHEQUEOS DE PRE-ENTREGA
 * Auditoría rigurosa y obligatoria de la agencia antes de liberar cualquier sitio web a un cliente.
 */
export const DEFAULT_CHECKLIST_ITEMS = [
  // 1. Analítica, Métricas & Tracking
  {
    id: 'chk-01-ga4-gtm',
    numero: 1,
    categoria: '1. Analítica, Métricas & Tracking',
    item: 'Google Analytics + GTM',
    descripcion: 'Etiqueta de Google Analytics 4 (GA4) y contenedor de Google Tag Manager instalados en <head> y <body> con medición de eventos mejorada activa.',
    critico: true,
    toolType: 'analytics'
  },
  {
    id: 'chk-02-search-console',
    numero: 2,
    categoria: '1. Analítica, Métricas & Tracking',
    item: 'Search Console',
    descripcion: 'Propiedad de Google Search Console vinculada y verificada para monitorear rastreo, impresiones, clics orgánicos y consultas de búsqueda.',
    critico: true,
    toolType: 'search_console'
  },
  {
    id: 'chk-06-meta-pixel',
    numero: 6,
    categoria: '1. Analítica, Métricas & Tracking',
    item: 'Meta Pixel + eventos',
    descripcion: 'Pixel de Meta (Facebook/Instagram) instalado disparando eventos estándar (Lead, Contact, ViewContent) al pulsar en WhatsApp o llamada.',
    critico: true,
    toolType: 'meta_pixel'
  },
  {
    id: 'chk-08-hotjar-clarity',
    numero: 8,
    categoria: '1. Analítica, Métricas & Tracking',
    item: 'Hotjar / Clarity',
    descripcion: 'Herramienta de mapas de calor y grabaciones anónimas de sesión (Microsoft Clarity o Hotjar) activa para auditar fricción y comportamiento real.',
    critico: false,
    toolType: 'clarity'
  },

  // 2. SEO On-Page, Indexación & Contenido
  {
    id: 'chk-03-sitemap',
    numero: 3,
    categoria: '2. SEO On-Page, Indexación & Contenido',
    item: 'Sitemap.xml enviado',
    descripcion: 'Archivo /sitemap.xml generado con URLs canónicas, codificación UTF-8 y enviado formalmente a Search Console para indexación rápida.',
    critico: true,
    toolType: 'sitemap'
  },
  {
    id: 'chk-04-robots',
    numero: 4,
    categoria: '2. SEO On-Page, Indexación & Contenido',
    item: 'Robots.txt revisado',
    descripcion: 'Archivo /robots.txt configurado en la raíz sin bloqueos involuntarios a Googlebot, permitiendo el rastreo de bots de IA y enlazando al sitemap.',
    critico: true,
    toolType: 'robots'
  },
  {
    id: 'chk-05-seo-metas',
    numero: 5,
    categoria: '2. SEO On-Page, Indexación & Contenido',
    item: 'SEO: H1, títulos, metas',
    descripcion: 'Estructura semántica con un único H1 descriptivo por página, Meta Titles (< 60 caracteres) y Meta Descriptions persuasivas con keywords locales.',
    critico: true,
    toolType: 'serp_preview'
  },
  {
    id: 'chk-07-open-graph',
    numero: 7,
    categoria: '2. SEO On-Page, Indexación & Contenido',
    item: 'Imagen Open Graph',
    descripcion: 'Etiquetas Open Graph (og:title, og:description, og:image 1200x630px) y Twitter Cards configuradas para vista previa atractiva en WhatsApp y redes.',
    critico: false,
    toolType: 'open_graph'
  },
  {
    id: 'chk-14-alt-imagenes',
    numero: 14,
    categoria: '2. SEO On-Page, Indexación & Contenido',
    item: 'Texto alt en imágenes',
    descripcion: 'Atributos "alt" descriptivos y semánticos en el 100% de las imágenes para accesibilidad (lectores de pantalla) y posicionamiento en Google Imágenes.',
    critico: true,
    toolType: null
  },

  // 3. Legal, Privacidad & Cumplimiento
  {
    id: 'chk-09-cookies-banner',
    numero: 9,
    categoria: '3. Legal, Privacidad & Cumplimiento',
    item: 'Banner de cookies',
    descripcion: 'Aviso de consentimiento de cookies conforme a normativas de privacidad que permite al usuario aceptar o configurar cookies analíticas.',
    critico: false,
    toolType: null
  },
  {
    id: 'chk-12-terminos-condiciones',
    numero: 12,
    categoria: '3. Legal, Privacidad & Cumplimiento',
    item: 'Términos y condiciones',
    descripcion: 'Páginas legales públicas enlazadas en el footer: Términos & Condiciones de Uso y Política de Privacidad y Protección de Datos Personales.',
    critico: true,
    toolType: null
  },
  {
    id: 'chk-22-correos-smtp',
    numero: 22,
    categoria: '3. Legal, Privacidad & Cumplimiento',
    item: 'Correos + SMTP',
    descripcion: 'Servicio de correo transaccional (SMTP/Resend/SendGrid) con registros SPF, DKIM y DMARC validados para que las alertas del formulario no caigan en spam.',
    critico: true,
    toolType: null
  },

  // 4. Seguridad, Infraestructura & Código
  {
    id: 'chk-10-ssl-https',
    numero: 10,
    categoria: '4. Seguridad, Infraestructura & Código',
    item: 'SSL + HTTPS forzado',
    descripcion: 'Certificado SSL TLS 1.3 activo con candado verde, redirección forzada de HTTP a HTTPS y sin advertencias de contenido mixto (Mixed Content).',
    critico: true,
    toolType: 'ssl'
  },
  {
    id: 'chk-11-datos-sesiones',
    numero: 11,
    categoria: '4. Seguridad, Infraestructura & Código',
    item: 'Datos ocultos en sesiones',
    descripcion: 'Verificación de que no se almacenen datos confidenciales, contraseñas ni números de tarjeta en texto plano en localStorage, sessionStorage o cookies.',
    critico: true,
    toolType: null
  },
  {
    id: 'chk-25-sin-tokens-js',
    numero: 25,
    categoria: '4. Seguridad, Infraestructura & Código',
    item: 'Sin tokens en JS',
    descripcion: 'Inspección de bundles JavaScript para asegurar que no contengan API Keys maestras, tokens de GitHub, credenciales de base de datos ni secretos de pago.',
    critico: true,
    toolType: null
  },
  {
    id: 'chk-26-vulnerabilidades',
    numero: 26,
    categoria: '4. Seguridad, Infraestructura & Código',
    item: 'Vulnerabilidades',
    descripcion: 'Auditoría de cabeceras de seguridad HTTP (X-Content-Type-Options, X-Frame-Options, Referrer-Policy, HSTS) y dependencias frontend sin exploits conocidos.',
    critico: true,
    toolType: 'security_headers'
  },

  // 5. Rendimiento, UX & Conversión Mobile
  {
    id: 'chk-13-favicon',
    numero: 13,
    categoria: '5. Rendimiento, UX & Conversión Mobile',
    item: 'Favicon',
    descripcion: 'Icono de pestaña /favicon.ico, PNG en alta resolución (192x192 y 512x512) y apple-touch-icon para accesos directos en iOS y Android.',
    critico: false,
    toolType: null
  },
  {
    id: 'chk-15-pagina-404',
    numero: 15,
    categoria: '5. Rendimiento, UX & Conversión Mobile',
    item: 'Página 404 propia',
    descripcion: 'Página de error 404 personalizada con diseño corporativo, mensaje empático y botón visible para volver al inicio sin perder al usuario.',
    critico: false,
    toolType: 'page_404'
  },
  {
    id: 'chk-16-pagespeed',
    numero: 16,
    categoria: '5. Rendimiento, UX & Conversión Mobile',
    item: 'PageSpeed Insights',
    descripcion: 'Prueba en Google PageSpeed Insights con calificación móvil ≥ 85-90 puntos, garantizando fluidez y aprobación del algoritmo de Google.',
    critico: true,
    toolType: 'pagespeed'
  },
  {
    id: 'chk-17-core-web-vitals',
    numero: 17,
    categoria: '5. Rendimiento, UX & Conversión Mobile',
    item: 'Core Web Vitals',
    descripcion: 'Métricas de experiencia en rango verde: LCP (renderizado principal) < 2.5s, CLS (estabilidad visual) < 0.1 e INP/FID (interactividad) < 100ms.',
    critico: true,
    toolType: 'pagespeed'
  },
  {
    id: 'chk-18-optimizar-recursos',
    numero: 18,
    categoria: '5. Rendimiento, UX & Conversión Mobile',
    item: 'Optimizar imágenes y JS',
    descripcion: 'Imágenes comprimidas en formatos WebP/AVIF con dimensiones fijas; JavaScript minificado y scripts no esenciales diferidos con defer o async.',
    critico: true,
    toolType: null
  },
  {
    id: 'chk-19-test-celulares',
    numero: 19,
    categoria: '5. Rendimiento, UX & Conversión Mobile',
    item: 'Test en celulares reales',
    descripcion: 'Prueba física en dispositivos móviles reales (iPhone y Android) verificando que no existan barras de scroll horizontal ni tipografías ilegibles.',
    critico: true,
    toolType: null
  },
  {
    id: 'chk-20-accesibilidad',
    numero: 20,
    categoria: '5. Rendimiento, UX & Conversión Mobile',
    item: 'Accesibilidad y contraste',
    descripcion: 'Contraste cromático de textos superior a 4.5:1 (norma WCAG AA), navegación clara por teclado y áreas táctiles de botones superiores a 44x44px.',
    critico: false,
    toolType: 'contrast_checker'
  },
  {
    id: 'chk-21-test-formularios',
    numero: 21,
    categoria: '5. Rendimiento, UX & Conversión Mobile',
    item: 'Test de formularios',
    descripcion: 'Prueba de envío completa de todos los formularios de contacto, cotización o suscripción, validando campos requeridos y mensaje de éxito visual.',
    critico: true,
    toolType: null
  },
  {
    id: 'chk-23-botones-whatsapp',
    numero: 23,
    categoria: '5. Rendimiento, UX & Conversión Mobile',
    item: 'Botones, links, WhatsApp',
    descripcion: 'Verificación de que ningún botón o enlace esté roto (cero 404). Botón de WhatsApp abre la app con mensaje comercial predefinido y enlace tel: funcional.',
    critico: true,
    toolType: null
  },

  // 6. DevOps, Infraestructura & Respaldo
  {
    id: 'chk-24-dns-configurados',
    numero: 24,
    categoria: '6. DevOps, Infraestructura & Respaldo',
    item: 'DNS configurados',
    descripcion: 'Registros DNS A, CNAME, www y verificación de propagación global completada; dominio principal y www apuntan al mismo servidor sin bucles.',
    critico: true,
    toolType: 'dns_checker'
  },
  {
    id: 'chk-27-backups-automaticos',
    numero: 27,
    categoria: '6. DevOps, Infraestructura & Respaldo',
    item: 'Backups automáticos',
    descripcion: 'Sistema de respaldo periódico automatizado del repositorio de código, archivos multimedia y base de datos con retención mínima de 30 días.',
    critico: true,
    toolType: null
  },
  {
    id: 'chk-28-test-restauracion',
    numero: 28,
    categoria: '6. DevOps, Infraestructura & Respaldo',
    item: 'Test de restauración',
    descripcion: 'Procedimiento de restauración de respaldo probado y documentado para garantizar que la web puede recuperarse en menos de 1 hora ante un fallo.',
    critico: false,
    toolType: null
  },
  {
    id: 'chk-29-alertas-caida',
    numero: 29,
    categoria: '6. DevOps, Infraestructura & Respaldo',
    item: 'Alertas de caída',
    descripcion: 'Servicio de monitoreo de disponibilidad 24/7 (Uptime Robot o Pingdom) configurado con chequeos cada 5 minutos y alertas por correo o WhatsApp.',
    critico: false,
    toolType: 'uptime_monitor'
  },
  {
    id: 'chk-30-monitoreo-errores',
    numero: 30,
    categoria: '6. DevOps, Infraestructura & Respaldo',
    item: 'Monitoreo de errores',
    descripcion: 'Rastreador de excepciones en producción activo o consola de desarrollador limpia de errores JS que puedan interrumpir la experiencia del visitante.',
    critico: true,
    toolType: null
  }
];

export const QA_CATEGORIES = [
  '1. Analítica, Métricas & Tracking',
  '2. SEO On-Page, Indexación & Contenido',
  '3. Legal, Privacidad & Cumplimiento',
  '4. Seguridad, Infraestructura & Código',
  '5. Rendimiento, UX & Conversión Mobile',
  '6. DevOps, DNS & Respaldo'
];

export default function SeoLaunchQaModule({ selectedCountry = 'SV' }) {
  const [proyectos, setProyectos] = useState([]);
  const [selectedProyectoId, setSelectedProyectoId] = useState('');
  const [siteUrl, setSiteUrl] = useState('');
  const [checklist, setChecklist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savedNotice, setSavedNotice] = useState(false);
  const [filterMode, setFilterMode] = useState('ALL'); // 'ALL' | 'PENDING' | 'DONE' | 'CRITICAL'
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadProyectosAndChecklist();
  }, [selectedCountry]);

  const loadProyectosAndChecklist = async () => {
    try {
      setLoading(true);
      let list = getStoredProyectos();

      try {
        const res = await apiClient.get('/api/proyectos');
        const cType = res.headers.get('content-type') || '';
        if (res.ok && cType.includes('application/json')) {
          const apiList = await res.json();
          if (Array.isArray(apiList) && apiList.length > 0) {
            list = apiList;
          }
        }
      } catch (err) {
        console.warn('Cargando proyectos desde almacenamiento local:', err);
      }

      // Si no hay proyectos creados aún, generar proyecto de muestra
      if (!list || list.length === 0) {
        list = [
          {
            id: 'proj-demo-1',
            codigo: 'P-2026-001',
            cliente: {
              empresa: selectedCountry === 'DO' ? 'Inmobiliaria Punta Cana Prime' : 'Clínicas Dentales San Salvador Don Pedro',
              nombre: selectedCountry === 'DO' ? 'Lic. Carlos Morales' : 'Dr. Pedro Ramírez',
              pais: selectedCountry
            },
            bovedaRepos: {
              stagingUrl: selectedCountry === 'DO' ? 'https://puntacanaprime.web.app' : 'https://donpedrodental.web.app',
              urlProduccion: selectedCountry === 'DO' ? 'https://puntacanaprime.com' : 'https://donpedrodental.com'
            }
          }
        ];
      }

      setProyectos(list);
      const initialProjId = list[0]?.id || '';
      setSelectedProyectoId(initialProjId);
      loadChecklistForProject(initialProjId, list);
    } finally {
      setLoading(false);
    }
  };

  const loadChecklistForProject = (projId, projsList = proyectos) => {
    const proj = projsList.find(p => p.id === projId) || projsList[0];
    if (!proj) return;

    // Detectar URL inicial del proyecto
    const initialUrl =
      proj.bovedaRepos?.urlProduccion ||
      proj.bovedaRepos?.stagingUrl ||
      proj.stagingUrl ||
      (proj.cliente?.empresa ? `https://${proj.cliente.empresa.toLowerCase().replace(/[^a-z0-9]/g, '')}.com` : 'https://cliente-oficial.com');
    setSiteUrl(initialUrl);

    // Cargar checklist guardado localmente para este proyecto
    const storageKey = `goglite_launch_qa_${proj.id}`;
    let savedData = null;
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) savedData = JSON.parse(raw);
    } catch (e) {}

    const savedMap = new Map();
    if (savedData && Array.isArray(savedData.items)) {
      savedData.items.forEach(i => {
        if (i.id) savedMap.set(i.id, Boolean(i.completado));
        if (i.numero) savedMap.set(Number(i.numero), Boolean(i.completado));
        if (i.item) savedMap.set(i.item.toLowerCase().trim(), Boolean(i.completado));
      });
    } else if (proj.launchQa && Array.isArray(proj.launchQa.items)) {
      proj.launchQa.items.forEach(i => {
        if (i.id) savedMap.set(i.id, Boolean(i.completado));
        if (i.numero) savedMap.set(Number(i.numero), Boolean(i.completado));
        if (i.item) savedMap.set(i.item.toLowerCase().trim(), Boolean(i.completado));
      });
    }

    // Inicializar o fusionar con los 30 ítems oficiales sin perder progreso previo
    const mergedList = DEFAULT_CHECKLIST_ITEMS.map(item => {
      let isDone = false;
      if (savedMap.has(item.id)) {
        isDone = savedMap.get(item.id);
      } else if (savedMap.has(item.numero)) {
        isDone = savedMap.get(item.numero);
      } else {
        const itemLower = item.item.toLowerCase().trim();
        for (const [key, val] of savedMap.entries()) {
          if (typeof key === 'string' && (key.includes(itemLower) || itemLower.includes(key))) {
            isDone = val;
            break;
          }
        }
      }
      return { ...item, completado: isDone };
    });

    setChecklist(mergedList);
  };

  const handleSelectProject = (projId) => {
    setSelectedProyectoId(projId);
    loadChecklistForProject(projId, proyectos);
  };

  const handleToggleItem = (itemId) => {
    setChecklist(prev => {
      const updated = prev.map(item =>
        item.id === itemId ? { ...item, completado: !item.completado } : item
      );
      saveChecklistState(updated, siteUrl);
      return updated;
    });
  };

  const handleResetChecklist = () => {
    if (!window.confirm('¿Deseas reiniciar todas las 30 casillas de verificación de este proyecto?')) return;
    const resetList = DEFAULT_CHECKLIST_ITEMS.map(item => ({ ...item, completado: false }));
    setChecklist(resetList);
    saveChecklistState(resetList, siteUrl);
  };

  const handleMarkAll = () => {
    const allDone = checklist.map(item => ({ ...item, completado: true }));
    setChecklist(allDone);
    saveChecklistState(allDone, siteUrl);
  };

  const saveChecklistState = (itemsToSave, currentUrl) => {
    if (!selectedProyectoId) return;
    const dataToSave = {
      proyectoId: selectedProyectoId,
      url: currentUrl,
      items: itemsToSave,
      ultimaActualizacion: new Date().toISOString()
    };

    try {
      localStorage.setItem(`goglite_launch_qa_${selectedProyectoId}`, JSON.stringify(dataToSave));

      // Sincronizar dentro del proyecto
      const projs = getStoredProyectos();
      const updatedProjs = projs.map(p => {
        if (p.id === selectedProyectoId) {
          return {
            ...p,
            launchQa: dataToSave
          };
        }
        return p;
      });
      saveStoredProyectos(updatedProjs);
    } catch (e) {
      console.warn('Error guardando checklist en localStorage:', e);
    }

    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2000);
  };

  // Métricas de Certificación
  const totalItems = checklist.length;
  const completadosCount = checklist.filter(i => i.completado).length;
  const criticosTotal = checklist.filter(i => i.critico).length;
  const criticosCompletados = checklist.filter(i => i.critico && i.completado).length;
  const criticosPendientes = criticosTotal - criticosCompletados;

  const scoreSalud = totalItems > 0 ? Math.round((completadosCount / totalItems) * 100) : 0;
  const isAprobado = completadosCount === totalItems || (scoreSalud >= 90 && criticosPendientes === 0);

  // Extraer dominio limpio para validadores
  const cleanDomain = siteUrl.replace(/^https?:\/\//i, '').replace(/\/.*$/, '').trim();

  // Generadores de Enlaces Oficiales de Prueba
  const getToolUrl = (toolType) => {
    const encodedUrl = encodeURIComponent(siteUrl.startsWith('http') ? siteUrl : `https://${siteUrl}`);
    const host = encodeURIComponent(cleanDomain || 'google.com');

    switch (toolType) {
      case 'pagespeed':
        return `https://pagespeed.web.dev/analysis?url=${encodedUrl}`;
      case 'rich_results':
        return `https://search.google.com/test/rich-results?url=${encodedUrl}`;
      case 'ssl':
        return `https://www.sslshopper.com/ssl-checker.html#hostname=${host}`;
      case 'robots':
        return siteUrl.startsWith('http') ? `${siteUrl.replace(/\/+$/, '')}/robots.txt` : `https://${cleanDomain}/robots.txt`;
      case 'sitemap':
        return siteUrl.startsWith('http') ? `${siteUrl.replace(/\/+$/, '')}/sitemap.xml` : `https://${cleanDomain}/sitemap.xml`;
      case 'analytics':
        return 'https://tagassistant.google.com/';
      case 'search_console':
        return 'https://search.google.com/search-console';
      case 'meta_pixel':
        return 'https://business.facebook.com/events_manager2';
      case 'clarity':
        return 'https://clarity.microsoft.com/';
      case 'open_graph':
        return `https://www.opengraph.xyz/url/${encodedUrl}`;
      case 'dns_checker':
        return `https://dnschecker.org/#A/${host}`;
      case 'security_headers':
        return `https://securityheaders.com/?q=${encodedUrl}&followRedirects=on`;
      case 'contrast_checker':
        return 'https://webaim.org/resources/contrastchecker/';
      case 'uptime_monitor':
        return 'https://uptimerobot.com/';
      case 'page_404':
        return siteUrl.startsWith('http') ? `${siteUrl.replace(/\/+$/, '')}/pagina-de-prueba-inexistente-404` : `https://${cleanDomain}/404-test`;
      default:
        return null;
    }
  };

  const currentProject = proyectos.find(p => p.id === selectedProyectoId) || proyectos[0];

  // Filtrado de ítems para el operador
  const filteredChecklist = useMemo(() => {
    return checklist.filter(item => {
      // Filtro de estado
      if (filterMode === 'PENDING' && item.completado) return false;
      if (filterMode === 'DONE' && !item.completado) return false;
      if (filterMode === 'CRITICAL' && !item.critico) return false;

      // Filtro de búsqueda
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchTitle = item.item.toLowerCase().includes(q);
        const matchDesc = item.descripcion.toLowerCase().includes(q);
        const matchCat = item.categoria.toLowerCase().includes(q);
        const matchNum = String(item.numero) === q;
        if (!matchTitle && !matchDesc && !matchCat && !matchNum) return false;
      }
      return true;
    });
  }, [checklist, filterMode, searchQuery]);

  return (
    <div className="space-y-6 max-w-6xl mx-auto text-slate-100">
      
      {/* Toast Notification */}
      {savedNotice && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-emerald-600 text-white px-4 py-2.5 rounded-xl shadow-2xl font-bold text-xs animate-bounce">
          <Check className="w-4 h-4" />
          <span>Protocolo QA Guardado (0ms)</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* HEADER PRINCIPAL DE CONTROL DE CALIDAD PRE-ENTREGA */}
      {/* ========================================================================= */}
      <div className="no-print p-6 rounded-2xl bg-gradient-to-r from-[#0d121f] via-[#101726] to-[#141b2d] border border-orange-500/20 shadow-xl space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-orange-400 uppercase tracking-wider mb-1">
              <ShieldCheck className="w-4 h-4 text-orange-400" />
              <span>Fase 5 · Control de Calidad Pre-Lanzamiento (Pre-Launch QA)</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2.5">
              <span>Protocolo de 30 Chequeos de Pre-Entrega al Cliente</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30 font-mono font-bold">
                Cero Error Humano
              </span>
            </h1>
            <p className="text-xs text-slate-400 max-w-3xl mt-1 leading-relaxed">
              Verificación técnica y operativa obligatoria de la agencia antes de entregar el producto y las credenciales al cliente. Audita tracking, SEO, velocidad, seguridad, DNS, backups y conversión móvil sin omisiones.
            </p>
          </div>

          {/* Selector de Proyecto & Botón de Impresión */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shrink-0">
            <select
              value={selectedProyectoId}
              onChange={(e) => handleSelectProject(e.target.value)}
              className="px-3.5 py-2.5 rounded-xl bg-[#080b11] border border-slate-700 text-xs font-bold text-white focus:outline-none focus:border-orange-500 shadow-inner"
            >
              {proyectos.map(p => (
                <option key={p.id} value={p.id}>
                  {p.codigo || 'PROJ'} · {p.cliente?.empresa || p.cliente?.nombre || 'Cliente'}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={() => window.print()}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-orange-950/40 transition-all transform hover:scale-[1.02]"
              title="Generar Certificado Oficial de Calidad 30/30 en PDF"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir Acta de Entrega (PDF)</span>
            </button>
          </div>
        </div>

        {/* Barra de URL del Proyecto & Acciones Rápidas */}
        <div className="pt-4 border-t border-slate-800/80 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="flex items-center gap-2 bg-[#080b11] border border-slate-700 rounded-xl px-3.5 py-2 flex-1 shadow-inner">
            <Globe className="w-4 h-4 text-orange-400 shrink-0" />
            <span className="text-[11px] text-slate-400 font-mono shrink-0">URL del Cliente:</span>
            <input
              type="text"
              value={siteUrl}
              onChange={(e) => {
                setSiteUrl(e.target.value);
                saveChecklistState(checklist, e.target.value);
              }}
              placeholder="https://cliente-oficial.com o https://staging.web.app"
              className="bg-transparent text-xs text-white font-mono w-full focus:outline-none placeholder-slate-600"
            />
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleMarkAll}
              className="px-3.5 py-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 text-xs font-bold border border-emerald-500/30 transition-colors flex items-center gap-1.5"
            >
              <CheckSquare className="w-3.5 h-3.5" />
              <span>Marcar Todos (30)</span>
            </button>
            <button
              type="button"
              onClick={handleResetChecklist}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition-colors flex items-center gap-1"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reiniciar</span>
            </button>
          </div>
        </div>

        {/* Resumen de Certificación de Calidad */}
        <div className="pt-4 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className={`w-16 h-16 rounded-2xl border flex flex-col items-center justify-center font-mono font-black shadow-inner shrink-0 ${
              isAprobado
                ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300 shadow-emerald-950/40'
                : scoreSalud >= 60
                ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                : 'bg-rose-500/20 border-rose-500/40 text-rose-300'
            }`}>
              <span className="text-2xl leading-none">{scoreSalud}%</span>
              <span className="text-[9px] uppercase tracking-wider text-slate-400 mt-1">Calidad</span>
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-bold text-white">Estado de Aprobación Web:</span>
                <span className={`text-xs font-bold px-3 py-0.5 rounded-full border ${
                  isAprobado
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                }`}>
                  {isAprobado ? '✅ APROBADO PARA ENTREGA OFICIAL (100%)' : '⚠️ AUDITORÍA EN CURSO (AJUSTES PENDIENTES)'}
                </span>
              </div>
              <div className="text-xs text-slate-400 mt-1">
                <strong>{completadosCount} de {totalItems} chequeos completados</strong> · 
                {criticosPendientes === 0 ? (
                  <span className="text-emerald-400 font-semibold ml-1">Todos los requisitos críticos superados</span>
                ) : (
                  <span className="text-amber-400 font-semibold ml-1">{criticosPendientes} requisito(s) crítico(s) pendientes</span>
                )}
              </div>
            </div>
          </div>

          <div className="text-right hidden sm:block">
            <div className="text-[11px] text-slate-400 font-mono">Proyecto / Cliente:</div>
            <div className="text-xs font-bold text-white truncate max-w-xs">
              {currentProject?.cliente?.empresa || 'Cliente Oficial'}
            </div>
            <div className="text-[10px] text-slate-500 font-mono mt-0.5">
              Protocolo Goglite Standard 30
            </div>
          </div>
        </div>

        {/* Validadores Externos Oficiales en 1-Clic */}
        <div className="pt-4 border-t border-slate-800/80">
          <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-orange-400" />
            <span>Accesos Directos a Validadores Oficiales de Google y la Industria:</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <a
              href={getToolUrl('pagespeed')}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-orange-500/10 hover:bg-orange-500/20 text-orange-300 border border-orange-500/30 text-[11px] font-semibold transition-colors"
            >
              <Zap className="w-3 h-3 text-orange-400" />
              <span>PageSpeed / Lighthouse</span>
              <ExternalLink className="w-2.5 h-2.5 opacity-70" />
            </a>

            <a
              href={getToolUrl('search_console')}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 border border-blue-500/30 text-[11px] font-semibold transition-colors"
            >
              <Search className="w-3 h-3 text-blue-400" />
              <span>Search Console</span>
              <ExternalLink className="w-2.5 h-2.5 opacity-70" />
            </a>

            <a
              href={getToolUrl('ssl')}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[11px] font-semibold transition-colors"
            >
              <Lock className="w-3 h-3 text-emerald-400" />
              <span>SSL Checker</span>
              <ExternalLink className="w-2.5 h-2.5 opacity-70" />
            </a>

            <a
              href={getToolUrl('dns_checker')}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[11px] font-semibold transition-colors"
            >
              <Server className="w-3 h-3 text-purple-400" />
              <span>DNS Checker</span>
              <ExternalLink className="w-2.5 h-2.5 opacity-70" />
            </a>

            <a
              href={getToolUrl('security_headers')}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[11px] font-semibold transition-colors"
            >
              <ShieldCheck className="w-3 h-3 text-rose-400" />
              <span>Security Headers</span>
              <ExternalLink className="w-2.5 h-2.5 opacity-70" />
            </a>

            <a
              href={getToolUrl('open_graph')}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[11px] font-semibold transition-colors"
            >
              <Share2 className="w-3 h-3 text-indigo-400" />
              <span>Open Graph Preview</span>
              <ExternalLink className="w-2.5 h-2.5 opacity-70" />
            </a>

            <a
              href={getToolUrl('uptime_monitor')}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[11px] font-semibold transition-colors"
            >
              <Activity className="w-3 h-3 text-amber-400" />
              <span>Uptime Robot</span>
              <ExternalLink className="w-2.5 h-2.5 opacity-70" />
            </a>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* BARRA DE FILTROS Y BÚSQUEDA */}
      {/* ========================================================================= */}
      <div className="no-print flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl bg-[#0b0e17] border border-slate-800">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setFilterMode('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              filterMode === 'ALL'
                ? 'bg-orange-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            Todos ({totalItems})
          </button>

          <button
            type="button"
            onClick={() => setFilterMode('PENDING')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              filterMode === 'PENDING'
                ? 'bg-amber-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            Pendientes ({totalItems - completadosCount})
          </button>

          <button
            type="button"
            onClick={() => setFilterMode('DONE')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              filterMode === 'DONE'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            Completados ({completadosCount})
          </button>

          <button
            type="button"
            onClick={() => setFilterMode('CRITICAL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              filterMode === 'CRITICAL'
                ? 'bg-rose-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            Críticos ({criticosTotal})
          </button>
        </div>

        <div className="relative w-full sm:w-64">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por número o palabra clave..."
            className="w-full bg-[#131926] border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-orange-500"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs font-mono"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* LISTADO DE 30 CHEQUEOS ORGANIZADOS POR LOS 6 PILARES */}
      {/* ========================================================================= */}
      <div className="no-print space-y-6">
        {QA_CATEGORIES.map((categoriaName) => {
          const catItems = filteredChecklist.filter(item => item.categoria === categoriaName);
          if (catItems.length === 0) return null;

          const catAllItems = checklist.filter(item => item.categoria === categoriaName);
          const catDoneCount = catAllItems.filter(item => item.completado).length;
          const isCategoryComplete = catDoneCount === catAllItems.length && catAllItems.length > 0;

          return (
            <div
              key={categoriaName}
              className="rounded-2xl bg-[#0b0e17] border border-slate-800/90 overflow-hidden shadow-lg"
            >
              {/* Encabezado de Categoría / Pilar */}
              <div className="p-4 bg-[#0e1422] border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className={`w-2.5 h-2.5 rounded-full ${isCategoryComplete ? 'bg-emerald-400 shadow-glow-emerald' : 'bg-orange-400'}`} />
                  <h2 className="text-sm font-bold text-white tracking-wide">
                    {categoriaName}
                  </h2>
                </div>
                
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold ${
                    isCategoryComplete
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-slate-800 text-slate-300 border border-slate-700'
                  }`}>
                    {catDoneCount} de {catAllItems.length} completados
                  </span>
                </div>
              </div>

              {/* Items de la Categoría */}
              <div className="divide-y divide-slate-800/60 p-2 sm:p-3">
                {catItems.map((item) => {
                  const directToolUrl = item.toolType ? getToolUrl(item.toolType) : null;

                  return (
                    <div
                      key={item.id}
                      className={`p-3.5 rounded-xl transition-all flex items-start gap-3.5 my-1 ${
                        item.completado
                          ? 'bg-emerald-950/10 border border-emerald-500/20 text-slate-300'
                          : 'bg-[#101625]/60 hover:bg-[#12192b] border border-slate-800/80 text-white'
                      }`}
                    >
                      {/* Checkbox Interactivo */}
                      <button
                        type="button"
                        onClick={() => handleToggleItem(item.id)}
                        className={`mt-0.5 w-6 h-6 rounded-lg flex items-center justify-center shrink-0 border transition-all ${
                          item.completado
                            ? 'bg-emerald-600 border-emerald-500 text-white shadow-md shadow-emerald-950/50 scale-105'
                            : 'bg-slate-900 border-slate-700 text-transparent hover:border-orange-500 hover:text-slate-600'
                        }`}
                        title={item.completado ? 'Marcar como pendiente' : 'Marcar como verificado'}
                      >
                        <Check className="w-4 h-4 stroke-[3]" />
                      </button>

                      {/* Contenido del Chequeo */}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[10px] font-mono font-black text-orange-400 bg-orange-500/10 px-1.5 py-0.5 rounded border border-orange-500/20">
                            #{String(item.numero).padStart(2, '0')}
                          </span>

                          <span
                            onClick={() => handleToggleItem(item.id)}
                            className={`text-xs font-bold cursor-pointer select-none ${
                              item.completado ? 'line-through text-slate-400' : 'text-white'
                            }`}
                          >
                            {item.item}
                          </span>

                          {item.critico && (
                            <span className="text-[9px] font-mono uppercase font-bold text-rose-400 bg-rose-500/10 px-1.5 py-0.5 rounded border border-rose-500/20">
                              Crítico
                            </span>
                          )}

                          {item.completado && (
                            <span className="text-[9px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded flex items-center gap-1 font-bold">
                              <Check className="w-3 h-3" /> Verificado
                            </span>
                          )}
                        </div>

                        <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                          {item.descripcion}
                        </p>

                        {/* Enlace directo a herramienta oficial de prueba */}
                        {directToolUrl && (
                          <div className="mt-2">
                            <a
                              href={directToolUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-[10px] text-sky-400 hover:text-sky-300 font-semibold underline underline-offset-2"
                            >
                              <span>Abrir Validador Oficial</span>
                              <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* ACTA DE CERTIFICACIÓN Y CONTROL DE CALIDAD IMPRIMIBLE (SOLO IMPRESIÓN / PDF) */}
      {/* ========================================================================= */}
      <div className="hidden print:block bg-white text-slate-900 p-8 max-w-4xl mx-auto rounded-none font-sans text-xs leading-relaxed">
        {/* Cabecera Membretada Goglite */}
        <div className="border-b-2 border-slate-900 pb-5 mb-6 flex items-start justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-orange-600 text-white font-black text-2xl flex items-center justify-center">
              G
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight text-slate-900">
                GOGLITE DIGITAL STUDIO
              </h1>
              <p className="text-[10px] text-slate-600 font-mono">
                Agencia Web, Automatización & Posicionamiento IA (GEO) · SV & DO
              </p>
            </div>
          </div>

          <div className="text-right font-mono">
            <div className="text-sm font-black text-orange-600">
              ACTA OFICIAL DE CONTROL DE CALIDAD
            </div>
            <div className="text-[10px] text-slate-600 mt-0.5">
              Protocolo Estándar de 30 Puntos
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">
              Fecha de Emisión: {new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}
            </div>
          </div>
        </div>

        {/* Metadatos del Proyecto Auditado */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-6 grid grid-cols-2 sm:grid-cols-4 gap-3 text-[11px]">
          <div>
            <span className="text-slate-500 font-mono block text-[9px] uppercase">Cliente / Empresa:</span>
            <strong className="text-slate-900 text-xs">{currentProject?.cliente?.empresa || 'Cliente'}</strong>
          </div>
          <div>
            <span className="text-slate-500 font-mono block text-[9px] uppercase">Código de Proyecto:</span>
            <strong className="text-slate-900 text-xs font-mono">{currentProject?.codigo || 'P-2026-001'}</strong>
          </div>
          <div>
            <span className="text-slate-500 font-mono block text-[9px] uppercase">URL Oficial Auditada:</span>
            <strong className="text-slate-900 font-mono text-[10px] truncate block">{siteUrl}</strong>
          </div>
          <div>
            <span className="text-slate-500 font-mono block text-[9px] uppercase">Resultado Global:</span>
            <strong className="text-emerald-700 font-bold text-xs">{completadosCount} / 30 Chequeos ({scoreSalud}%)</strong>
          </div>
        </div>

        {/* Declaración de Garantía y Certificación Técnica */}
        <div className="mb-6 p-4 rounded-xl bg-orange-50 border border-orange-200 text-slate-800 text-[11px] leading-relaxed">
          <strong>Certificación de Calidad Técnica:</strong> Por medio de la presente acta, el equipo técnico de <strong>Goglite Digital</strong> certifica que el sitio web y los activos digitales del proyecto han sido sometidos a la auditoría exhaustiva de <strong>30 puntos de control de calidad</strong> previo a su entrega oficial, garantizando el cumplimiento de los estándares de indexabilidad, rastreo en motores de búsqueda, velocidad Core Web Vitals, seguridad TLS/HTTPS, analítica de conversiones y adaptabilidad en dispositivos móviles.
        </div>

        {/* Tabla de los 30 Chequeos Verificados */}
        <div className="mb-6">
          <table className="w-full text-left border-collapse text-[10px]">
            <thead>
              <tr className="border-b-2 border-slate-900 bg-slate-100 text-slate-800 font-mono">
                <th className="py-2 px-2 w-10">#</th>
                <th className="py-2 px-2">REQUISITO DE CONTROL DE CALIDAD</th>
                <th className="py-2 px-2">CATEGORÍA / PILAR</th>
                <th className="py-2 px-2 w-28 text-center">ESTADO</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {DEFAULT_CHECKLIST_ITEMS.map((item) => {
                const currentStatus = checklist.find(c => c.id === item.id)?.completado;

                return (
                  <tr key={item.id} className="hover:bg-slate-50">
                    <td className="py-1.5 px-2 font-mono font-bold text-slate-500">
                      {String(item.numero).padStart(2, '0')}
                    </td>
                    <td className="py-1.5 px-2 font-semibold text-slate-900">
                      {item.item}
                      {item.critico && <span className="text-[8px] text-rose-600 font-bold ml-1.5 font-mono">[Crítico]</span>}
                    </td>
                    <td className="py-1.5 px-2 text-slate-600 text-[9px]">
                      {item.categoria.replace(/^\d+\.\s*/, '')}
                    </td>
                    <td className="py-1.5 px-2 text-center font-mono font-bold">
                      {currentStatus ? (
                        <span className="text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded text-[9px]">
                          ✓ VERIFICADO
                        </span>
                      ) : (
                        <span className="text-amber-700 bg-amber-100 px-2 py-0.5 rounded text-[9px]">
                          PENDIENTE
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Firmas de Autorización y Sello Oficial */}
        <div className="pt-8 border-t-2 border-slate-300 grid grid-cols-2 gap-8 text-center avoid-break">
          <div>
            <div className="h-14 border-b border-slate-400 mx-auto w-48 mb-2 flex items-end justify-center">
              <span className="font-serif italic text-base text-slate-800">Víctor Matos</span>
            </div>
            <div className="font-bold text-slate-900 text-xs">Víctor Matos</div>
            <div className="text-[10px] text-slate-500">Director General & CEO · Goglite</div>
          </div>

          <div>
            <div className="h-14 border-b border-slate-400 mx-auto w-48 mb-2 flex items-end justify-center">
              <span className="font-serif italic text-base text-slate-800">{currentProject?.cliente?.nombre || 'Cliente'}</span>
            </div>
            <div className="font-bold text-slate-900 text-xs">{currentProject?.cliente?.nombre || 'Recibido por el Cliente'}</div>
            <div className="text-[10px] text-slate-500">Aceptación y Recepción Conforme del Sitio</div>
          </div>
        </div>
      </div>

    </div>
  );
}
