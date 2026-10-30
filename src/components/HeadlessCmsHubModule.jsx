import React, { useState, useEffect, useRef } from 'react';
import apiClient from '../services/apiClient';
import { saveCmsSiteToFirestore, getCmsSiteFromFirestore } from '../services/firebase';
import { saveProyectoCloud, savePortalCloud, getProyectosCloud, getAppStateCloud, saveAppStateCloud } from '../services/firestoreSyncService';
import GoogleBusinessProfileView from './GoogleBusinessProfileView';
import GoogleSiteKitView from './GoogleSiteKitView';
import AdminCmsSubscriptionsHubView from './admin/AdminCmsSubscriptionsHubView';
import {
  Globe,
  Layout,
  Save,
  Check,
  Smartphone,
  Tablet,
  Monitor,
  Copy,
  ExternalLink,
  Plus,
  RefreshCw,
  Eye,
  CheckCircle2,
  Code2,
  Zap,
  Building2,
  MousePointerClick,
  Bot,
  X,
  Sparkles,
  Sliders,
  MapPin,
  Star,
  Activity,
  ShieldCheck,
  CreditCard,
  Trash2,
  FileText
} from 'lucide-react';

const GOGLITE_DEFAULT_SITE = {
  id: 'cms-goglite',
  slug: 'goglite',
  nombre: 'Goglite Digital Hub',
  pais: 'SV',
  dominio: 'goglite.com',
  estado: 'publicado',
  planMensual: 99,
  ultimaActualizacion: new Date().toISOString().split('T')[0],
  cliente: {
    contacto: 'Dirección General',
    email: 'contacto@goglite.com',
    telefono: '+829 528-4713',
    identificacion: ''
  },
  contenido: {
    branding: {
      nombreMarca: 'Goglite Agency',
      slogan: 'Arquitectura Digital & Agentes de IA',
      colorPrimario: '#FF6B00',
      telefonoWhatsApp: '+829 528-4713',
      ciudadPrincipal: 'San Salvador & Santo Domingo',
      categoriaNegocio: 'Agencia de Marketing Digital, SEO Local & Desarrollo Web'
    },
    hero: {
      badge: '⚡ Oferta del mes 20% de descuento',
      titulo: 'Tu negocio merece ser encontrado',
      subtitulo: 'Dejamos atrás el diseño web estático. Optimizamos tu infraestructura digital para que los LLMs recomienden tu marca e integramos agentes autónomos que convierten tráfico en facturación 24/7.',
      botonTexto: 'Contactar por WhatsApp',
      botonSubtexto: 'Respuesta en menos de 15 minutos'
    },
    servicios: [
      { id: 's-1', titulo: 'Optimización para Motores de IA (GEO)', descripcion: 'Estructuración semántica y Schema JSON-LD para posicionar tu marca en ChatGPT, Claude y Perplexity.', precio: '$499 USD' },
      { id: 's-2', titulo: 'Agentes Autónomos & CRM', descripcion: 'Automatización de prospección, calificación de leads y cierre vía WhatsApp sin intervención humana.', precio: '$850 USD' },
      { id: 's-3', titulo: 'Landing Pages de Ultra-Conversión', descripcion: 'Desarrollo en Astro 5 y Tailwind con arquitectura limpia, velocidad 95+ y $0 en hosting.', precio: '$600 USD' }
    ],
    testimonios: [
      { id: 't-1', cliente: 'Carlos Mendoza · Inversiones Altamira', comentario: 'El sistema de agentes duplicó nuestros prospectos calificados en las primeras 3 semanas.', estrellas: 5 },
      { id: 't-2', cliente: 'Dra. Patricia Silva · Dental Care', comentario: 'Nuestra web ahora carga instantáneamente y los pacientes agendan directamente por WhatsApp.', estrellas: 5 }
    ],
    faqs: [
      { pregunta: '¿Qué es la Optimización para Motores de IA (GEO)?', respuesta: 'Es la evolución del SEO tradicional para garantizar que cuando un usuario consulte a un LLM (ChatGPT, Copilot), tu empresa sea citada como proveedor recomendado.' },
      { pregunta: '¿Requiere servidores dedicados o costos mensuales elevados?', respuesta: 'No. Todo corre sobre infraestructura serverless estática en Firebase Spark ($0/mes), garantizando costos operativos mínimos.' }
    ]
  }
};

const TURISRAN_REAL_CONTENT = {
  branding: {
    nombreMarca: 'TurisRan Dominicana',
    slogan: 'Viaja cómodo. Llega seguro.',
    colorPrimario: '#D4AF37',
    telefonoWhatsApp: '+1 (849) 752-7408',
    ciudadPrincipal: 'Punta Cana, Santo Domingo & Toda República Dominicana',
    categoriaNegocio: 'Transporte Turístico, Ejecutivo, Transfers Aeropuerto (PUJ/SDQ/STI/LRM) & Tours VIP'
  },
  hero: {
    badge: 'CHOFERES VIP DISPONIBLES EN TIEMPO REAL · 24/7',
    titulo: 'TurisRan Dominicana | Transfers & Experiencias VIP',
    subtitulo: 'Servicio de transporte privado VIP en la República Dominicana. Traslados puntuales desde aeropuertos de Punta Cana (PUJ), Santo Domingo (SDQ), Santiago (STI), La Romana (LRM) y excursiones privadas.',
    botonTexto: 'Cotizar por WhatsApp Oficial',
    botonSubtexto: 'Monitoreo de vuelos 24/7 · Tarifa fija garantizada'
  },
  servicios: [
    { id: 'tr-1', titulo: 'Traslado Privado Aeropuerto Punta Cana (PUJ)', descripcion: 'Servicio de transfer privado VIP desde el Aeropuerto de Punta Cana (PUJ) a hoteles de Bávaro, Uvero Alto y Cap Cana con monitoreo 24/7 y cartel de bienvenida.', precio: 'Cotizar Ruta VIP' },
    { id: 'tr-2', titulo: 'Traslado Aeropuerto Las Américas Santo Domingo (SDQ)', descripcion: 'Transporte privado ejecutivo desde el Aeropuerto Las Américas (SDQ) hacia Santo Domingo, Zona Colonial, Boca Chica, Juan Dolio y La Romana con facturación NCF.', precio: 'Tarifa Fija' },
    { id: 'tr-3', titulo: 'Excursión Privada Isla Saona VIP', descripcion: 'Excursión exclusiva puerta a puerta con transporte climatizado hacia Bayahíbe, lancha rápida, piscina natural y almuerzo en Isla Saona.', precio: 'Tour Privado' },
    { id: 'tr-4', titulo: 'Chofer Privado y Transporte VIP Corporativo', descripcion: 'Servicio de chofer bilingüe por horas o días en SUVs de lujo y Vans ejecutivas para empresas, diplomáticos, bodas y congresos con Facturación Fiscal (NCF).', precio: 'Ejecutivo VIP' },
    { id: 'tr-5', titulo: 'Traslado Directo Santo Domingo ↔ Punta Cana', descripcion: 'Viaje privado directo entre Santo Domingo y Punta Cana/Bávaro por Autopista del Coral en unidades confortables con Wi-Fi a bordo.', precio: 'Interurbano' },
    { id: 'tr-6', titulo: 'Excursión Privada Samaná, Cayo Levantado & Montaña Redonda', descripcion: 'Tours privados personalizados hacia Samaná, Salto del Limón, Montaña Redonda y City Tour Histórico Zona Colonial.', precio: 'Experiencia VIP' }
  ],
  testimonios: [
    { id: 'rev-1', cliente: 'Kimberlin Montero · Google Maps 5★', comentario: 'Excelente conductor. El servicio fue excepcionalmente profesional y atento; llegó puntual con un vehículo impecable, demostrando gran habilidad al volante y conocimiento de las rutas.', estrellas: 5 },
    { id: 'rev-2', cliente: 'Familia Isasi · Google Maps 5★', comentario: 'Ransel muy profesional, nos trajo a Samaná desde Bayahibe. El viaje fue muy agradable y ameno. Buen coche y muy buena conducción. Es de total confianza.', estrellas: 5 },
    { id: 'rev-3', cliente: 'Rafalis Montero Medina · Google Maps 5★', comentario: 'Excelente servicio la verdad, buen confort en el vehículo, altamente responsable y todo servido exactamente a tiempo.', estrellas: 5 },
    { id: 'rev-4', cliente: 'Mercedes Dolores Méndez Matos · Local Guide 5★', comentario: 'Trato agradable y persona de absoluta confianza, lo recomiendo 100%. Vehículo cómodo, limpio y muy confortable.', estrellas: 5 },
    { id: 'rev-5', cliente: 'Acelis Grisel Montero Medina · Google Maps 5★', comentario: 'Excelente servicio, máximo respeto y muy amable el conductor. Servicio 100% recomendable para viajar en República Dominicana.', estrellas: 5 }
  ],
  faqs: [
    { pregunta: '¿Qué pasa si mi vuelo se retrasa al llegar a Punta Cana (PUJ) o Santo Domingo (SDQ)?', respuesta: 'Monitoreamos tu número de vuelo en tiempo real sin costo adicional. Nuestro chofer te esperará en la salida de la terminal con un cartel con tu nombre a la hora exacta en que aterrice tu avión.' },
    { pregunta: '¿Los precios son por persona o por vehículo privado completo?', respuesta: 'Todas nuestras tarifas son por vehículo privado completo (SUV o Van Ejecutiva) exclusivo para ti y tu grupo, sin compartir con desconocidos ni hacer paradas innecesarias.' },
    { pregunta: '¿Emiten Factura con Comprobante Fiscal (NCF) para empresas?', respuesta: 'Sí, emitimos facturación corporativa con Comprobante Fiscal (NCF) válido en República Dominicana para empresas, embajadas y eventos ejecutivos.' }
  ]
};

function buildDefaultContentForClient({ nombre, telefono, colorPrimario, ciudad, categoria, pais, slug }) {
  const norm = (slug || nombre || '').toLowerCase();
  if (norm.includes('turisra')) {
    return JSON.parse(JSON.stringify(TURISRAN_REAL_CONTENT));
  }
  const defaultCity = ciudad || (pais === 'DO' ? 'Santo Domingo' : 'San Salvador');
  return {
    branding: {
      nombreMarca: nombre,
      slogan: categoria || 'Soluciones Profesionales & Atención 24/7',
      colorPrimario: colorPrimario || '#FF6B00',
      telefonoWhatsApp: telefono || '+1 809 000-0000',
      ciudadPrincipal: defaultCity,
      categoriaNegocio: categoria || 'Servicios Profesionales Locales'
    },
    hero: {
      badge: '⚡ Atención Inmediata Garantizada',
      titulo: `${nombre} en ${defaultCity}`,
      subtitulo: 'Servicio confiable, puntual y con cotización directa por WhatsApp en menos de 5 minutos.',
      botonTexto: 'Cotizar por WhatsApp Ahora',
      botonSubtexto: 'Atención personalizada 24/7'
    },
    servicios: [
      { id: 's-1', titulo: 'Servicio Principal Especializado', descripcion: `Atención inmediata en ${defaultCity} con personal calificado.`, precio: 'Consultar' },
      { id: 's-2', titulo: 'Reserva Prioritaria VIP', descripcion: 'Programación anticipada con garantía de puntualidad.', precio: 'Tarifa Preferencial' }
    ],
    testimonios: [
      { id: 't-1', cliente: 'Cliente Verificado', comentario: `Excelente servicio por parte del equipo de ${nombre}, 100% recomendados.`, estrellas: 5 }
    ],
    faqs: [
      { pregunta: '¿Cómo puedo reservar o solicitar una cotización?', respuesta: 'Haz clic en el botón de WhatsApp para recibir atención directa en tiempo real.' }
    ]
  };
}

export default function HeadlessCmsHubModule({ onOpenInvoiceModal }) {
  const [sites, setSites] = useState([GOGLITE_DEFAULT_SITE]);
  const [selectedSlug, setSelectedSlug] = useState('goglite');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [previewDevice, setPreviewDevice] = useState('desktop'); // 'desktop' | 'tablet' | 'mobile'

  // Pantallas Principales: 'editor_visual' | 'google_profile' | 'site_kit' | 'suscripciones'
  const [activeView, setActiveView] = useState('editor_visual');

  // Modo dentro de 'editor_visual': 'iframe' (Click-to-Edit) | 'form' (Inyección Estructurada de Datos Web)
  const [editorMode, setEditorMode] = useState('iframe');

  // Cliente preseleccionado para abrir el modal de factura en la pestaña de suscripciones
  const [initialInvoiceClientSlug, setInitialInvoiceClientSlug] = useState(null);

  // Modales
  const [showAgentPromptModal, setShowAgentPromptModal] = useState(false);
  const [showNewSiteModal, setShowNewSiteModal] = useState(false);
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [copiedScriptOnly, setCopiedScriptOnly] = useState(false);

  // Estado para el Editor Visual en Vivo
  const iframeRef = useRef(null);
  const [unsavedChangesCount, setUnsavedChangesCount] = useState(0);
  const [discoveredPageInfo, setDiscoveredPageInfo] = useState(null);

  // Form state for editing current site
  const [editableContent, setEditableContent] = useState(null);

  // Form state for creating/onboarding a new client in Module 6
  const [newSiteForm, setNewSiteForm] = useState({
    nombre: '',
    dominio: '',
    contacto: '',
    email: '',
    identificacion: '',
    pais: 'DO',
    ciudad: 'Santo Domingo',
    categoria: '',
    telefono: '',
    colorPrimario: '#FF6B00',
    planMensual: 99,
    diasCortesiaInicial: 30
  });
  const [creatingSite, setCreatingSite] = useState(false);

  useEffect(() => {
    fetchSites();

    // Listener para recibir cambios en caliente desde el iframe visual
    const handleWindowMessage = (event) => {
      if (!event.data) return;
      if (event.data.type === 'GOGLITE_CMS_INLINE_CHANGE') {
        const { key, value } = event.data;
        setEditableContent((prev) => {
          if (!prev) return prev;
          const next = JSON.parse(JSON.stringify(prev));
          const parts = key.split('.');
          let target = next;
          for (let i = 0; i < parts.length - 1; i++) {
            if (!target[parts[i]]) target[parts[i]] = {};
            target = target[parts[i]];
          }
          target[parts[parts.length - 1]] = value;
          return next;
        });
        setUnsavedChangesCount((c) => c + 1);
      } else if (event.data.type === 'GOGLITE_CMS_PAGE_DISCOVERED') {
        setDiscoveredPageInfo(event.data);
        if (Array.isArray(event.data.elements) && event.data.elements.length > 0) {
          setEditableContent((prev) => {
            if (!prev) return prev;
            const next = JSON.parse(JSON.stringify(prev));
            if (!next.textos) next.textos = {};
            event.data.elements.forEach((el) => {
              if (el.key && el.text) {
                const parts = el.key.split('.');
                let target = next;
                for (let i = 0; i < parts.length - 1; i++) {
                  if (!target[parts[i]]) target[parts[i]] = {};
                  target = target[parts[i]];
                }
                if (!target[parts[parts.length - 1]]) {
                  target[parts[parts.length - 1]] = el.text;
                }
              }
            });
            return next;
          });
        }
      }
    };

    const handleProjectsSync = () => {
      syncProjectsIntoSites();
    };

    window.addEventListener('message', handleWindowMessage);
    window.addEventListener('goglite_proyectos_synced', handleProjectsSync);
    return () => {
      window.removeEventListener('message', handleWindowMessage);
      window.removeEventListener('goglite_proyectos_synced', handleProjectsSync);
    };
  }, []);

  // Unificar proyectos de goglite_proyectos con la lista de sitios del CMS
  const mergeProjectsWithSites = (baseSites) => {
    const result = baseSites.map((s) => {
      if (s.slug && s.slug.includes('turisra')) {
        const isGenericHero = !s.contenido?.hero?.titulo || s.contenido.hero.titulo.includes('TurisRan en ');
        return {
          ...s,
          dominio: (!s.dominio || s.dominio === 'turisran.com') ? 'turisran-dominicana.com' : s.dominio,
          urlProduccion: (!s.urlProduccion || s.urlProduccion.includes('turisran.com')) ? 'https://turisran-dominicana.com' : s.urlProduccion,
          contenido: isGenericHero ? JSON.parse(JSON.stringify(TURISRAN_REAL_CONTENT)) : s.contenido
        };
      }
      return s;
    });
    const normalizeSlug = (str) =>
      (str || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
    const seenSlugs = new Set(result.map(s => s.slug));

    try {
      const storedProjs = projsList;
      if (Array.isArray(storedProjs)) {
        storedProjs.forEach(proj => {
          const empresa = proj.cliente?.empresa || proj.lead?.empresa || 'Cliente VIP';
          const slug = proj.cmsSlug || normalizeSlug(empresa) || proj.id;
          const bovedaUrl = proj.bovedaRepos?.urlProduccion || proj.bovedaRepos?.stagingUrl || '';
          const defaultDom = slug.includes('turisra') ? 'turisran-dominicana.com' : `${empresa.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`;
          const rawDom = proj.portalConfig?.urlProduccion || bovedaUrl || proj.dominio || proj.portalConfig?.dominio || defaultDom;
          const dominio = rawDom.replace(/^https?:\/\//i, '').replace(/\/$/, '');
          const urlProduccion = proj.portalConfig?.urlProduccion || bovedaUrl || `https://${dominio}`;

          if (seenSlugs.has(slug)) {
            const existingIdx = result.findIndex(s => s.slug === slug);
            if (existingIdx !== -1 && bovedaUrl && (result[existingIdx].dominio === 'turisran.com' || !result[existingIdx].urlProduccion)) {
              result[existingIdx] = {
                ...result[existingIdx],
                dominio,
                urlProduccion
              };
            }
            return;
          }
          seenSlugs.add(slug);

          const pais = proj.cliente?.pais || proj.lead?.pais || proj.pais || 'DO';
          const telefono = proj.cliente?.telefono || proj.lead?.telefono || (slug.includes('turisra') ? '+1 (849) 752-7408' : '');

          result.push({
            id: proj.id,
            slug,
            nombre: empresa,
            pais,
            dominio,
            urlProduccion,
            estado: 'publicado',
            planMensual: Number(proj.portalConfig?.planMensual) || 99,
            portalConfig: proj.portalConfig || {},
            cliente: {
              contacto: proj.cliente?.contacto || proj.cliente?.nombre || proj.lead?.contacto || 'Administrador',
              email: proj.portalConfig?.cuentaCmsSitioRegistrada || proj.cliente?.email || proj.lead?.email || '',
              telefono,
              identificacion: proj.cliente?.identificacion || ''
            },
            ultimaActualizacion: new Date().toISOString().split('T')[0],
            contenido: buildDefaultContentForClient({
              nombre: empresa,
              slug,
              telefono,
              colorPrimario: '#FF6B00',
              ciudad: pais === 'DO' ? 'Santo Domingo' : 'San Salvador',
              categoria: proj.lead?.nicho || 'Servicios Profesionales',
              pais
            })
          });
        });
      }
    } catch (e) {
      console.warn('Error unificando proyectos con sitios CMS:', e);
    }

    return result;
  };

  const syncProjectsIntoSites = async () => {
    try {
      const projs = await getProyectosCloud();
      setSites(prev => {
        const merged = mergeProjectsWithSites(prev, projs);
        saveAppStateCloud('cms_sites_master', 'cms_sites', { sites: merged }).catch(() => {});
        return merged;
      });
    } catch (e) {}
  };

  const fetchSites = async () => {
    try {
      setLoading(true);
      let loaded = null;

      try {
        const res = await apiClient.get('/api/cms/sites');
        const cType = res.headers.get('content-type') || '';
        if (res.ok && cType.includes('application/json')) {
          loaded = await res.json();
        }
      } catch (err) {
        console.warn('API CMS offline, fallback local:', err);
      }

      if (!loaded || !Array.isArray(loaded) || loaded.length === 0) {
        try {
          const cloudState = await getAppStateCloud('cms_sites_master');
          if (cloudState && Array.isArray(cloudState.sites)) {
            loaded = cloudState.sites;
          }
        } catch (e) {}
      }

      if (!Array.isArray(loaded)) loaded = [];
      loaded = loaded.filter(s => s.slug !== 'gruas-andrea');

      const existingGogliteIdx = loaded.findIndex(s => s.slug === 'goglite');
      if (existingGogliteIdx === -1) {
        loaded.unshift(GOGLITE_DEFAULT_SITE);
      } else {
        loaded[existingGogliteIdx] = {
          ...GOGLITE_DEFAULT_SITE,
          ...loaded[existingGogliteIdx],
          contenido: {
            ...GOGLITE_DEFAULT_SITE.contenido,
            ...(loaded[existingGogliteIdx].contenido || {})
          }
        };
      }

      // Unificar todos los clientes/proyectos registrados en Firestore
      try {
        const cloudProjs = await getProyectosCloud();
        loaded = mergeProjectsWithSites(loaded, cloudProjs);
      } catch (e) {
        loaded = mergeProjectsWithSites(loaded, []);
      }

      // Intentar sincronizar datos en vivo desde Firestore
      try {
        const cloudDoc = await getCmsSiteFromFirestore(selectedSlug || 'goglite');
        if (cloudDoc && cloudDoc.contenido) {
          const idx = loaded.findIndex(s => s.slug === (selectedSlug || 'goglite'));
          if (idx !== -1) {
            loaded[idx] = { ...loaded[idx], ...cloudDoc, contenido: cloudDoc.contenido };
          }
        }
      } catch (cErr) {
        console.warn('[Firestore CMS] Error leyendo nube:', cErr);
      }

      setSites(loaded);
      saveAppStateCloud('cms_sites_master', 'cms_sites', { sites: loaded }).catch(() => {});

      const target = loaded.find(s => s.slug === selectedSlug) || loaded[0];
      setSelectedSlug(target.slug);
      setEditableContent(JSON.parse(JSON.stringify(target.contenido)));
    } catch (err) {
      console.error('Error fetching CMS sites:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectSite = async (slug) => {
    setSelectedSlug(slug);
    const target = sites.find(s => s.slug === slug);
    if (target) {
      setEditableContent(JSON.parse(JSON.stringify(target.contenido)));
    }
    setUnsavedChangesCount(0);
    setDiscoveredPageInfo(null);

    // Sincronizar desde Firestore si hay versión en la nube para ese cliente
    try {
      const cloudDoc = await getCmsSiteFromFirestore(slug);
      if (cloudDoc && cloudDoc.contenido) {
        setEditableContent(cloudDoc.contenido);
      }
    } catch (e) {}
  };

  // Seleccionar un cliente desde el directorio de Suscripciones y saltar directo a la herramienta deseada
  const handleSelectSubscriberTool = (sub, targetView = 'editor_visual') => {
    const targetSlug = sub.slug || sub.portalToken;
    const exists = sites.find(s => s.slug === targetSlug);
    if (!exists) {
      const newSiteEntry = {
        id: sub.id || ('cms-' + Date.now()),
        slug: targetSlug,
        nombre: sub.empresa,
        pais: sub.pais || 'DO',
        dominio: sub.dominio || `${targetSlug}.com`,
        estado: 'publicado',
        planMensual: sub.planMensual || 99,
        portalConfig: sub.proyectoRef?.portalConfig || {},
        cliente: {
          contacto: sub.contacto || 'Administrador',
          email: sub.email || '',
          telefono: sub.telefono || '',
          identificacion: sub.identificacion || ''
        },
        ultimaActualizacion: new Date().toISOString().split('T')[0],
        contenido: buildDefaultContentForClient({
          nombre: sub.empresa,
          telefono: sub.telefono,
          colorPrimario: '#FF6B00',
          ciudad: sub.pais === 'DO' ? 'Santo Domingo' : 'San Salvador',
          categoria: 'Servicios Profesionales',
          pais: sub.pais || 'DO'
        })
      };
      setSites(prev => {
        const next = [...prev, newSiteEntry];
        saveAppStateCloud('cms_sites_master', 'cms_sites', { sites: next }).catch(() => {});
        return next;
      });
      setSelectedSlug(targetSlug);
      setEditableContent(newSiteEntry.contenido);
    } else {
      handleSelectSite(targetSlug);
    }
    setActiveView(targetView);
  };

  // Actualizar dominio / URL de producción de un sitio desde el modal de configuración
  const handleUpdateSiteConfig = (slug, newConfig) => {
    setSites(prev => {
      const next = prev.map(s => {
        if (s.slug === slug) {
          return {
            ...s,
            dominio: newConfig.dominio || s.dominio,
            urlProduccion: newConfig.urlProduccion || s.urlProduccion,
            planMensual: newConfig.planMensual || s.planMensual,
            cliente: {
              ...(s.cliente || {}),
              email: newConfig.emailClienteCms || s.cliente?.email,
              telefono: newConfig.telefono || s.cliente?.telefono
            }
          };
        }
        return s;
      });
      saveAppStateCloud('cms_sites_master', 'cms_sites', { sites: next }).catch(() => {});
      return next;
    });
  };

  const handleSaveContent = async () => {
    try {
      setSaving(true);

      // 1. Guardar en Firestore (Nube en tiempo real)
      try {
        const currentSite = sites.find(s => s.slug === selectedSlug) || {};
        await saveCmsSiteToFirestore(selectedSlug, currentSite, editableContent);
      } catch (fErr) {
        console.warn('[Firestore CMS] Fallo guardado en Firestore:', fErr);
      }

      // 2. Guardar en API servidor si está disponible
      try {
        await apiClient.patch(`/api/cms/content/${selectedSlug}`, editableContent);
      } catch (e) {}

      // 3. Sincronizar en memoria y Firestore app_state
      setSites(prev => {
        const next = prev.map(s => {
          if (s.slug === selectedSlug) {
            return {
              ...s,
              nombre: editableContent?.branding?.nombreMarca || s.nombre,
              contenido: editableContent,
              ultimaActualizacion: new Date().toISOString().split('T')[0]
            };
          }
          return s;
        });
        saveAppStateCloud('cms_sites_master', 'cms_sites', { sites: next }).catch(() => {});
        return next;
      });

      setSavedSuccess(true);
      setUnsavedChangesCount(0);
      if (iframeRef.current && iframeRef.current.contentWindow) {
        iframeRef.current.contentWindow.postMessage({ type: 'GOGLITE_CMS_SAVE_CONFIRMED' }, '*');
      }
      setTimeout(() => setSavedSuccess(false), 2500);
    } catch (err) {
      console.error('Error guardando CMS:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleCreateNewSite = async (e) => {
    e.preventDefault();
    if (!newSiteForm.nombre.trim()) return;

    try {
      setCreatingSite(true);
      const slug = newSiteForm.nombre.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
      const cleanDomain = (newSiteForm.dominio || `${slug}.com`).replace(/^https?:\/\//, '').replace(/\/$/, '');
      const diasIniciales = Number(newSiteForm.diasCortesiaInicial) || 0;
      const venceIso = diasIniciales > 0 ? new Date(Date.now() + diasIniciales * 86400000).toISOString() : null;
      const nowStr = new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });

      const portalConfig = {
        dominio: cleanDomain,
        fase5CareActivo: diasIniciales > 0,
        careVenceAt: venceIso,
        fechaActivacionCare: diasIniciales > 0 ? nowStr : null,
        ultimaRecargaPeriodo: diasIniciales > 0 ? `${diasIniciales} Días (Alta Inicial)` : null,
        fechaUltimaRecarga: diasIniciales > 0 ? nowStr : null,
        planMensual: Number(newSiteForm.planMensual) || 99,
        faseActual: 5,
        progresoPorcentaje: 100,
        historialRecargas: diasIniciales > 0 ? [
          {
            fecha: nowStr,
            periodo: `${diasIniciales} Días (Alta Inicial)`,
            dias: diasIniciales,
            venceHasta: venceIso,
            timestamp: Date.now()
          }
        ] : []
      };

      const created = {
        id: 'cms-' + Date.now(),
        slug,
        nombre: newSiteForm.nombre,
        pais: newSiteForm.pais,
        dominio: cleanDomain,
        estado: 'publicado',
        planMensual: Number(newSiteForm.planMensual) || 99,
        portalConfig,
        cliente: {
          empresa: newSiteForm.nombre,
          contacto: newSiteForm.contacto || 'Administrador',
          email: newSiteForm.email || '',
          telefono: newSiteForm.telefono || '',
          identificacion: newSiteForm.identificacion || '',
          pais: newSiteForm.pais
        },
        ultimaActualizacion: new Date().toISOString().split('T')[0],
        contenido: buildDefaultContentForClient({
          nombre: newSiteForm.nombre,
          telefono: newSiteForm.telefono,
          colorPrimario: newSiteForm.colorPrimario,
          ciudad: newSiteForm.ciudad,
          categoria: newSiteForm.categoria,
          pais: newSiteForm.pais
        })
      };

      // 1. Guardar en Firestore CMS y app_state
      setSites(prev => {
        const next = [...prev.filter(s => s.slug !== slug), created];
        saveAppStateCloud('cms_sites_master', 'cms_sites', { sites: next }).catch(() => {});
        return next;
      });

      try {
        await saveCmsSiteToFirestore(slug, created, created.contenido);
      } catch (fErr) {}

      // 2. Registrar también en proyectos de Firestore para que quede unificado en Suscripciones y Portal del Cliente
      try {
        const newProj = {
          id: created.id,
          cmsSlug: slug,
          portalToken: slug,
          dominio: cleanDomain,
          pais: newSiteForm.pais,
          estado: 'activo',
          fechaCreacion: new Date().toISOString(),
          cliente: {
            empresa: newSiteForm.nombre,
            contacto: newSiteForm.contacto || 'Administrador',
            email: newSiteForm.email || '',
            telefono: newSiteForm.telefono || '',
            identificacion: newSiteForm.identificacion || '',
            pais: newSiteForm.pais
          },
          portalConfig
        };
        await saveProyectoCloud(newProj);
        await savePortalCloud(slug, { token: slug, portalConfig });
        window.dispatchEvent(new CustomEvent('goglite_proyectos_synced'));
      } catch (pErr) {
        console.warn('Error registrando cliente CMS en proyectos:', pErr);
      }

      setSelectedSlug(created.slug);
      setEditableContent(created.contenido);
      setNewSiteForm({
        nombre: '',
        dominio: '',
        contacto: '',
        email: '',
        identificacion: '',
        pais: 'DO',
        ciudad: 'Santo Domingo',
        categoria: '',
        telefono: '',
        colorPrimario: '#FF6B00',
        planMensual: 99,
        diasCortesiaInicial: 30
      });
      setShowNewSiteModal(false);
      setShowAgentPromptModal(true);
    } catch (e) {
      console.error('Error creando sitio:', e);
    } finally {
      setCreatingSite(false);
    }
  };

  // Helpers para edición estructurada del formulario de inyección de datos web
  const updateBrandingField = (field, value) => {
    setEditableContent(prev => ({
      ...prev,
      branding: { ...(prev?.branding || {}), [field]: value }
    }));
    setUnsavedChangesCount(c => c + 1);
  };

  const updateHeroField = (field, value) => {
    setEditableContent(prev => ({
      ...prev,
      hero: { ...(prev?.hero || {}), [field]: value }
    }));
    setUnsavedChangesCount(c => c + 1);
  };

  const handleAddServicio = () => {
    setEditableContent(prev => ({
      ...prev,
      servicios: [
        ...(prev?.servicios || []),
        { id: 's-' + Date.now(), titulo: 'Nuevo Servicio', descripcion: 'Descripción detallada del servicio.', precio: '$150 USD' }
      ]
    }));
    setUnsavedChangesCount(c => c + 1);
  };

  const handleUpdateServicio = (idx, field, value) => {
    setEditableContent(prev => {
      const next = [...(prev?.servicios || [])];
      next[idx] = { ...next[idx], [field]: value };
      return { ...prev, servicios: next };
    });
    setUnsavedChangesCount(c => c + 1);
  };

  const handleRemoveServicio = (idx) => {
    setEditableContent(prev => ({
      ...prev,
      servicios: (prev?.servicios || []).filter((_, i) => i !== idx)
    }));
    setUnsavedChangesCount(c => c + 1);
  };

  const handleAddFaq = () => {
    setEditableContent(prev => ({
      ...prev,
      faqs: [
        ...(prev?.faqs || []),
        { pregunta: '¿Nueva pregunta frecuente?', respuesta: 'Respuesta clara para el cliente.' }
      ]
    }));
    setUnsavedChangesCount(c => c + 1);
  };

  const handleUpdateFaq = (idx, field, value) => {
    setEditableContent(prev => {
      const next = [...(prev?.faqs || [])];
      next[idx] = { ...next[idx], [field]: value };
      return { ...prev, faqs: next };
    });
    setUnsavedChangesCount(c => c + 1);
  };

  const handleRemoveFaq = (idx) => {
    setEditableContent(prev => ({
      ...prev,
      faqs: (prev?.faqs || []).filter((_, i) => i !== idx)
    }));
    setUnsavedChangesCount(c => c + 1);
  };

  // Generador del Prompt Agéntico para Fase 4 · Paso 1
  const currentSite = sites.find(s => s.slug === selectedSlug) || sites[0] || GOGLITE_DEFAULT_SITE;
  const targetScriptTag = `<script src="https://goglite-agency.web.app/cms.js" data-site="${selectedSlug}" defer></script>`;

  const agentConnectionPrompt = `Actúa como Tech Lead de la agencia. Conecta este sitio web al Headless CMS de Goglite (Fase 4 · Paso 1: Infraestructura Base).

Inserta la siguiente etiqueta antes del cierre de </body> en el archivo index.html:

${targetScriptTag}

Reglas técnicas de cumplimiento obligatorio:
1. Preserva el 100% de la estructura HTML, diseño y estilos CSS existentes (no alterar layout ni tipografía).
2. Mantén la velocidad de carga > 90 en Google PageSpeed ($0 servidores en Firebase Spark).
3. Asegura que el script cargue con atributo 'defer' para garantizar renderizado asíncrono sin bloqueo.
4. Al recargar la página, los textos se sincronizarán en vivo desde Google Cloud Firestore.`;

  const handleCopyAgentPrompt = () => {
    navigator.clipboard.writeText(agentConnectionPrompt);
    setCopiedPrompt(true);
    setTimeout(() => setCopiedPrompt(false), 2200);
  };

  const handleCopyScriptOnly = () => {
    navigator.clipboard.writeText(targetScriptTag);
    setCopiedScriptOnly(true);
    setTimeout(() => setCopiedScriptOnly(false), 2000);
  };

  if (loading || !editableContent) {
    return (
      <div className="flex-1 flex items-center justify-center p-12 text-slate-400">
        <RefreshCw className="w-6 h-6 animate-spin text-orange-500 mr-3" />
        <span>Cargando Hub Headless CMS...</span>
      </div>
    );
  }

  // URL del sitio actual para el iframe
  const isGogliteDefault = selectedSlug === 'goglite';
  const rawProdUrl = currentSite?.urlProduccion || currentSite?.dominio || 'sitio.com';
  const baseProdUrl = rawProdUrl.startsWith('http') ? rawProdUrl : `https://${rawProdUrl}`;
  const iframeUrl = isGogliteDefault
    ? 'https://goglite.com/?goglite_edit=true'
    : `${baseProdUrl}${baseProdUrl.includes('?') ? '&' : '?'}goglite_edit=true`;

  return (
    <div className="flex-1 overflow-y-auto bg-[#080b11] p-6 text-slate-100 flex flex-col gap-5">
      
      {/* 1. TOP HEADER & HUB CONTROLS */}
      <div className="p-5 rounded-2xl bg-[#0e1320] border border-slate-800/80 flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4 shadow-sm">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h2 className="text-lg font-black text-white">Hub Headless CMS · Goglite Care</h2>
            <span className="text-[10px] font-mono font-bold uppercase px-2.5 py-0.5 rounded-full bg-purple-500/15 text-purple-300 border border-purple-500/30">
              Sistema SaaS Post-Venta Autónomo
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Administra clientes activos, inyecta datos en sus 3 herramientas (Web, Google Business IA y Site Kit) y factura sus membresías de principio a fin.
          </p>
        </div>

        {/* Client Selector & Global Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 bg-[#131926] border border-purple-500/40 rounded-xl px-3 py-1.5 text-xs text-slate-300">
            <span className="text-purple-300 font-bold">Cliente Activo:</span>
            <select
              value={selectedSlug}
              onChange={(e) => handleSelectSite(e.target.value)}
              className="bg-transparent text-white font-bold focus:outline-none max-w-[200px] truncate cursor-pointer"
            >
              {sites.map(s => (
                <option key={s.slug} value={s.slug} className="bg-[#0e1320] text-white">
                  {s.nombre} ({s.dominio})
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => setShowNewSiteModal(true)}
            className="px-3.5 py-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 text-xs font-bold flex items-center gap-1.5 transition-all border border-emerald-500/40"
          >
            <Plus className="w-3.5 h-3.5 text-emerald-400" />
            <span>Ingresar Cliente</span>
          </button>

          <button
            onClick={() => {
              setInitialInvoiceClientSlug(selectedSlug);
              setActiveView('suscripciones');
            }}
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shadow-orange-950/50"
            title="Emitir factura de membresía para el cliente actual y activar su suscripción"
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>💳 Facturar &amp; Activar Membresía</span>
          </button>

          <button
            onClick={() => setShowAgentPromptModal(true)}
            className="px-3 py-2 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/40 text-blue-300 text-xs font-bold flex items-center gap-1.5 transition-all"
            title="Copiar prompt para que el agente de IA conecte este sitio web"
          >
            <Bot className="w-3.5 h-3.5 text-blue-400" />
            <span>Prompt Agente</span>
          </button>

          <a
            href={`/cms-cliente/${selectedSlug}`}
            target="_blank"
            rel="noreferrer"
            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-all border border-slate-700"
            title="Abrir el Portal Autoadministrable que ve este cliente"
          >
            <ExternalLink className="w-3.5 h-3.5 text-purple-400" />
            <span>Portal Cliente</span>
          </a>
        </div>
      </div>

      {/* 2. SUB-NAVIGATION TABS (EDITOR VISUAL VS FICHA GOOGLE VS SITE KIT VS SUSCRIPCIONES) */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveView('editor_visual')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
            activeView === 'editor_visual'
              ? 'bg-gradient-to-r from-orange-600 to-amber-600 text-white shadow-lg shadow-orange-950/50'
              : 'bg-[#0e1320] text-slate-400 hover:text-white'
          }`}
        >
          <MousePointerClick className="w-4 h-4 text-orange-300" />
          <span>🎨 Editor Visual &amp; Datos Web</span>
        </button>

        <button
          onClick={() => setActiveView('google_profile')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
            activeView === 'google_profile'
              ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-950/50'
              : 'bg-[#0e1320] text-slate-400 hover:text-white'
          }`}
        >
          <MapPin className="w-4 h-4 text-blue-300" />
          <span>📍 Ficha de Google Business &amp; Reseñas IA</span>
        </button>

        <button
          onClick={() => setActiveView('site_kit')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
            activeView === 'site_kit'
              ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-950/50'
              : 'bg-[#0e1320] text-slate-400 hover:text-white'
          }`}
        >
          <Activity className="w-4 h-4 text-emerald-300" />
          <span>⚡ Google Site Kit</span>
        </button>

        <button
          onClick={() => setActiveView('suscripciones')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
            activeView === 'suscripciones'
              ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-950/50'
              : 'bg-[#0e1320] text-slate-400 hover:text-white'
          }`}
        >
          <ShieldCheck className="w-4 h-4 text-purple-300" />
          <span>💎 Suscripciones, Clientes &amp; Facturación</span>
        </button>
      </div>

      {/* 3. VISTA A: PANTALLA OFICIAL DE GOOGLE BUSINESS & RESEÑAS CON IA */}
      {activeView === 'google_profile' && (
        <GoogleBusinessProfileView currentSite={currentSite} />
      )}

      {/* 3. VISTA B: PANTALLA GOOGLE SITE KIT (SEARCH CONSOLE, GA4, ADS & PAGESPEED) */}
      {activeView === 'site_kit' && (
        <GoogleSiteKitView currentSite={currentSite} />
      )}

      {/* 3. VISTA C: GESTIÓN DE SUSCRIPCIONES, CLIENTES ACTIVOS Y FACTURACIÓN NATIVA DEL CMS */}
      {activeView === 'suscripciones' && (
        <AdminCmsSubscriptionsHubView
          sites={sites}
          selectedSlug={selectedSlug}
          onSelectSiteInHub={handleSelectSubscriberTool}
          onOpenNewSiteModal={() => setShowNewSiteModal(true)}
          onUpdateSiteConfig={handleUpdateSiteConfig}
          initialInvoiceClientSlug={initialInvoiceClientSlug}
          onClearInitialInvoiceClient={() => setInitialInvoiceClientSlug(null)}
        />
      )}

      {/* 3. VISTA D: PANTALLA DE EDITOR VISUAL EN VIVO + FORMULARIO DE INYECCIÓN DE DATOS WEB */}
      {activeView === 'editor_visual' && (
        <div className="flex-1 flex flex-col gap-3">
          {/* Top Control Bar */}
          <div className="p-3.5 bg-[#0e1320] border border-slate-800 rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-md">
            <div className="flex flex-wrap items-center gap-2">
              {/* Toggle entre Vista Interactiva Iframe y Formulario de Inyección de Datos */}
              <div className="flex items-center gap-1 bg-[#131926] p-1 rounded-xl border border-slate-700/80">
                <button
                  type="button"
                  onClick={() => setEditorMode('iframe')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    editorMode === 'iframe' ? 'bg-orange-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <MousePointerClick className="w-3.5 h-3.5" />
                  <span>🖥️ Lienzo Visual (Iframe)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setEditorMode('form')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    editorMode === 'form' ? 'bg-orange-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Sliders className="w-3.5 h-3.5" />
                  <span>📝 Inyectar Datos Web (Formulario)</span>
                </button>
              </div>

              {/* Viewport switcher (solo en modo iframe) */}
              {editorMode === 'iframe' && (
                <div className="flex items-center gap-1 bg-[#131926] p-1 rounded-xl border border-slate-700/80">
                  <button
                    onClick={() => setPreviewDevice('desktop')}
                    className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      previewDevice === 'desktop' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Monitor className="w-3.5 h-3.5" />
                    <span>Desktop</span>
                  </button>
                  <button
                    onClick={() => setPreviewDevice('tablet')}
                    className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      previewDevice === 'tablet' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Tablet className="w-3.5 h-3.5" />
                    <span>Tablet</span>
                  </button>
                  <button
                    onClick={() => setPreviewDevice('mobile')}
                    className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      previewDevice === 'mobile' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                    <span>Móvil</span>
                  </button>
                </div>
              )}
            </div>

            {/* Indicator & Save Button */}
            <div className="flex items-center gap-3">
              {unsavedChangesCount > 0 ? (
                <span className="text-xs font-mono font-bold text-amber-400 bg-amber-500/10 border border-amber-500/30 px-3 py-1 rounded-xl animate-pulse">
                  ● {unsavedChangesCount} {unsavedChangesCount === 1 ? 'cambio pendiente' : 'cambios pendientes'}
                </span>
              ) : (
                <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-xl flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5" />
                  <span>Sincronizado con Firestore</span>
                </span>
              )}

              <button
                onClick={handleSaveContent}
                disabled={saving}
                className={`px-5 py-2 rounded-xl font-bold text-xs flex items-center gap-2 shadow-lg transition-all ${
                  savedSuccess
                    ? 'bg-emerald-600 text-white shadow-emerald-950'
                    : unsavedChangesCount > 0
                    ? 'bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white shadow-orange-950'
                    : 'bg-orange-600 hover:bg-orange-500 text-white shadow-orange-950'
                }`}
              >
                {saving ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : savedSuccess ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                <span>{savedSuccess ? '¡Publicado con Éxito!' : 'Publicar Cambios en Vivo'}</span>
              </button>
            </div>
          </div>

          {/* MODO 1: FORMULARIO ESTRUCTURADO DE INYECCIÓN DE DATOS WEB */}
          {editorMode === 'form' ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* Columna Izquierda: Identidad de Marca & Hero Principal */}
              <div className="space-y-5">
                <div className="p-5 rounded-2xl bg-[#0e1320] border border-slate-800 space-y-4">
                  <h3 className="text-sm font-bold text-orange-400 uppercase font-mono flex items-center gap-2 border-b border-slate-800 pb-2.5">
                    <Building2 className="w-4 h-4" />
                    <span>1. Identidad de Marca &amp; Contacto NAP ({currentSite?.dominio})</span>
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">Nombre de Marca</label>
                      <input
                        type="text"
                        value={editableContent.branding?.nombreMarca || ''}
                        onChange={(e) => updateBrandingField('nombreMarca', e.target.value)}
                        className="w-full bg-[#131926] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">WhatsApp Oficial de Cierre</label>
                      <input
                        type="text"
                        value={editableContent.branding?.telefonoWhatsApp || ''}
                        onChange={(e) => updateBrandingField('telefonoWhatsApp', e.target.value)}
                        className="w-full bg-[#131926] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">Ciudad / Zona Principal</label>
                      <input
                        type="text"
                        value={editableContent.branding?.ciudadPrincipal || ''}
                        onChange={(e) => updateBrandingField('ciudadPrincipal', e.target.value)}
                        className="w-full bg-[#131926] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">Slogan / Giro del Negocio</label>
                      <input
                        type="text"
                        value={editableContent.branding?.slogan || ''}
                        onChange={(e) => updateBrandingField('slogan', e.target.value)}
                        className="w-full bg-[#131926] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                      />
                    </div>
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-[#0e1320] border border-slate-800 space-y-4">
                  <h3 className="text-sm font-bold text-amber-400 uppercase font-mono flex items-center gap-2 border-b border-slate-800 pb-2.5">
                    <Sparkles className="w-4 h-4" />
                    <span>2. Portada Hero, Oferta &amp; Llamado a la Acción (CTA)</span>
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1"> Cintillo / Oferta Destacada (Badge)</label>
                      <input
                        type="text"
                        value={editableContent.hero?.badge || ''}
                        onChange={(e) => updateHeroField('badge', e.target.value)}
                        className="w-full bg-[#131926] border border-slate-700 rounded-xl px-3 py-2 text-xs text-amber-300 font-semibold"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">Título Principal (H1 SEO Local)</label>
                      <input
                        type="text"
                        value={editableContent.hero?.titulo || ''}
                        onChange={(e) => updateHeroField('titulo', e.target.value)}
                        className="w-full bg-[#131926] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">Subtítulo Persuasivo</label>
                      <textarea
                        rows={3}
                        value={editableContent.hero?.subtitulo || ''}
                        onChange={(e) => updateHeroField('subtitulo', e.target.value)}
                        className="w-full bg-[#131926] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] text-slate-400 mb-1">Texto del Botón CTA</label>
                        <input
                          type="text"
                          value={editableContent.hero?.botonTexto || ''}
                          onChange={(e) => updateHeroField('botonTexto', e.target.value)}
                          className="w-full bg-[#131926] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-slate-400 mb-1">Subtexto Bajo el Botón</label>
                        <input
                          type="text"
                          value={editableContent.hero?.botonSubtexto || ''}
                          onChange={(e) => updateHeroField('botonSubtexto', e.target.value)}
                          className="w-full bg-[#131926] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Columna Derecha: Catálogo de Servicios & Preguntas Frecuentes */}
              <div className="space-y-5">
                <div className="p-5 rounded-2xl bg-[#0e1320] border border-slate-800 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                    <h3 className="text-sm font-bold text-emerald-400 uppercase font-mono flex items-center gap-2">
                      <Layout className="w-4 h-4" />
                      <span>3. Catálogo de Servicios &amp; Tarifas ({editableContent.servicios?.length || 0})</span>
                    </h3>
                    <button
                      type="button"
                      onClick={handleAddServicio}
                      className="px-2.5 py-1 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-xs font-bold flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Añadir Servicio</span>
                    </button>
                  </div>

                  <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                    {(editableContent.servicios || []).map((srv, idx) => (
                      <div key={srv.id || idx} className="p-3.5 rounded-xl bg-[#131926] border border-slate-800 space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <input
                            type="text"
                            value={srv.titulo || ''}
                            onChange={(e) => handleUpdateServicio(idx, 'titulo', e.target.value)}
                            placeholder="Nombre del servicio"
                            className="flex-1 bg-[#0a0d14] border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-bold"
                          />
                          <input
                            type="text"
                            value={srv.precio || ''}
                            onChange={(e) => handleUpdateServicio(idx, 'precio', e.target.value)}
                            placeholder="Precio (ej. $80 USD)"
                            className="w-28 bg-[#0a0d14] border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-emerald-400 font-mono font-bold"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveServicio(idx)}
                            className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <textarea
                          rows={2}
                          value={srv.descripcion || ''}
                          onChange={(e) => handleUpdateServicio(idx, 'descripcion', e.target.value)}
                          placeholder="Descripción del servicio..."
                          className="w-full bg-[#0a0d14] border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-300"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-[#0e1320] border border-slate-800 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                    <h3 className="text-sm font-bold text-blue-400 uppercase font-mono flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      <span>4. Preguntas Frecuentes (FAQ Schema / GEO)</span>
                    </h3>
                    <button
                      type="button"
                      onClick={handleAddFaq}
                      className="px-2.5 py-1 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 text-xs font-bold flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Añadir FAQ</span>
                    </button>
                  </div>

                  <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                    {(editableContent.faqs || []).map((fq, idx) => (
                      <div key={idx} className="p-3 rounded-xl bg-[#131926] border border-slate-800 space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <input
                            type="text"
                            value={fq.pregunta || ''}
                            onChange={(e) => handleUpdateFaq(idx, 'pregunta', e.target.value)}
                            placeholder="Pregunta frecuente"
                            className="flex-1 bg-[#0a0d14] border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-semibold"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveFaq(idx)}
                            className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <textarea
                          rows={2}
                          value={fq.respuesta || ''}
                          onChange={(e) => handleUpdateFaq(idx, 'respuesta', e.target.value)}
                          placeholder="Respuesta directa..."
                          className="w-full bg-[#0a0d14] border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-300"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Instructions helper strip */}
              <div className="px-4 py-2 rounded-xl bg-orange-500/10 border border-orange-500/20 text-xs text-orange-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MousePointerClick className="w-4 h-4 text-orange-400 shrink-0" />
                  <span>
                    <strong className="text-orange-400">Modo Click-to-Edit Activo:</strong> Haz clic sobre cualquier texto en la web o cambia al botón <strong>"📝 Inyectar Datos Web (Formulario)"</strong> arriba para editar todos los campos estructurados del cliente.
                  </span>
                </div>
                <span className="text-[11px] font-mono text-slate-400 hidden lg:inline">
                  contenteditable="plaintext-only"
                </span>
              </div>

              {/* Iframe Viewport Container (Mac Browser Bezel) */}
              <div className="flex-1 flex justify-center items-start min-h-[680px] bg-[#05070a] rounded-2xl p-4 border border-slate-800 shadow-inner overflow-x-auto">
                <div
                  className="transition-all duration-300 rounded-2xl overflow-hidden border border-slate-700/80 shadow-2xl flex flex-col bg-white"
                  style={{
                    width: previewDevice === 'mobile' ? '390px' : previewDevice === 'tablet' ? '768px' : '100%',
                    minHeight: '660px',
                    height: '75vh'
                  }}
                >
                  {/* Fake Mac Window Bar */}
                  <div className="px-4 py-2.5 bg-[#171d2b] border-b border-slate-700/70 flex items-center justify-between shrink-0 select-none">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-rose-500/90 inline-block shadow-sm"></span>
                      <span className="w-3 h-3 rounded-full bg-amber-500/90 inline-block shadow-sm"></span>
                      <span className="w-3 h-3 rounded-full bg-emerald-500/90 inline-block shadow-sm"></span>
                    </div>
                    <div className="flex-1 max-w-lg mx-4 bg-[#0a0d14] rounded-lg px-3 py-1 text-[11px] font-mono text-slate-300 border border-slate-700/60 flex items-center gap-1.5">
                      <span className="text-emerald-400">🔒</span>
                      <span className="text-slate-400">https://</span>
                      <input
                        type="text"
                        value={(currentSite?.urlProduccion || currentSite?.dominio || '').replace(/^https?:\/\//i, '')}
                        onChange={(e) => {
                          const raw = e.target.value.replace(/^https?:\/\//i, '');
                          handleUpdateSiteConfig(selectedSlug, {
                            dominio: raw.split('/')[0] || raw,
                            urlProduccion: raw ? `https://${raw}` : ''
                          });
                        }}
                        placeholder="tudominio.com"
                        title="Haz clic para cambiar la URL de producción conectada al Editor Visual"
                        className="bg-transparent text-white font-bold focus:outline-none focus:text-amber-300 flex-1 min-w-[120px]"
                      />
                      <span className="text-orange-400 shrink-0">?goglite_edit=true</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          if (iframeRef.current) iframeRef.current.src = iframeUrl;
                        }}
                        className="p-1 rounded text-slate-400 hover:text-white"
                        title="Recargar frame"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Embedded Webpage Iframe */}
                  <iframe
                    ref={iframeRef}
                    src={iframeUrl}
                    title={`Editor Visual - ${currentSite?.nombre || 'Sitio'}`}
                    className="w-full flex-1 border-0 bg-white"
                    allow="clipboard-write"
                    sandbox="allow-scripts allow-same-origin allow-forms allow-modals allow-popups"
                  />
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* MODAL 1: PROMPT PARA EL AGENTE DE IA (FASE 4 · PASO 1) */}
      {showAgentPromptModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0e1320] border border-blue-500/40 rounded-2xl p-6 max-w-2xl w-full shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <span>Prompt de Conexión para Agente de IA</span>
                    <span className="text-[10px] bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded font-mono">Fase 4 · Paso 1</span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Sitio: <span className="text-white font-semibold">{currentSite?.nombre || 'Goglite'}</span> (ID: <code className="text-amber-400">{selectedSlug}</code>)
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAgentPromptModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Copia y entrega este prompt a tu agente (Antigravity, Cursor, Claude o Gemini). El agente insertará automáticamente el script universal de 1 línea en el <code className="text-amber-400 font-mono">index.html</code> del cliente sin alterar estilos ni rendimiento:
            </p>

            <div className="relative">
              <pre className="p-4 rounded-xl bg-[#080b11] border border-slate-800 text-xs font-mono text-blue-200 whitespace-pre-wrap leading-relaxed max-h-56 overflow-y-auto">
                {agentConnectionPrompt}
              </pre>
              <button
                onClick={handleCopyAgentPrompt}
                className="absolute top-3 right-3 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md transition-all"
              >
                {copiedPrompt ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedPrompt ? '¡Prompt Copiado!' : 'Copiar Prompt Completo'}</span>
              </button>
            </div>

            {/* Quick snippet alternative */}
            <div className="p-3.5 rounded-xl bg-[#131926] border border-slate-800 flex items-center justify-between gap-3">
              <div className="truncate">
                <span className="text-[11px] text-slate-400 block mb-0.5 font-semibold">Etiqueta de script directa:</span>
                <code className="text-xs text-emerald-400 font-mono">{targetScriptTag}</code>
              </div>
              <button
                onClick={handleCopyScriptOnly}
                className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono flex items-center gap-1 shrink-0"
              >
                {copiedScriptOnly ? <Check className="w-3 h-3 text-emerald-400" /> : <Code2 className="w-3 h-3 text-slate-400" />}
                <span>{copiedScriptOnly ? 'Copiado' : 'Copiar Tag'}</span>
              </button>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setShowAgentPromptModal(false)}
                className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: INGRESO COMPLETO DE CLIENTE Y ALTA DE SITIO EN EL HEADLESS CMS */}
      {showNewSiteModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#0e1320] border border-emerald-500/40 rounded-2xl p-6 max-w-2xl w-full shadow-2xl space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Ingresar Nuevo Cliente al Headless CMS</h3>
                  <p className="text-xs text-slate-400">
                    Crea el expediente del cliente en el Módulo 6, habilita sus 3 herramientas y activa su portal autoadministrable.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowNewSiteModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateNewSite} className="space-y-4 pt-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="text-xs text-slate-400 block mb-1 font-semibold">Nombre Comercial / Empresa *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Coco Bongo Shuttle Punta Cana"
                    value={newSiteForm.nombre}
                    onChange={(e) => setNewSiteForm({ ...newSiteForm, nombre: e.target.value })}
                    className="w-full bg-[#131926] border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-400 block mb-1 font-semibold">Dominio Web Oficial</label>
                  <input
                    type="text"
                    placeholder="Ej. cocobongoshuttle.com"
                    value={newSiteForm.dominio}
                    onChange={(e) => setNewSiteForm({ ...newSiteForm, dominio: e.target.value })}
                    className="w-full bg-[#131926] border border-slate-700 rounded-xl p-2.5 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Nombre del Contacto / Dueño</label>
                  <input
                    type="text"
                    placeholder="Ej. Roberto Méndez"
                    value={newSiteForm.contacto}
                    onChange={(e) => setNewSiteForm({ ...newSiteForm, contacto: e.target.value })}
                    className="w-full bg-[#131926] border border-slate-700 rounded-xl p-2.5 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-400 block mb-1">WhatsApp Oficial</label>
                  <input
                    type="text"
                    placeholder="+1 809 555-1234"
                    value={newSiteForm.telefono}
                    onChange={(e) => setNewSiteForm({ ...newSiteForm, telefono: e.target.value })}
                    className="w-full bg-[#131926] border border-slate-700 rounded-xl p-2.5 text-xs text-white font-mono"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-400 block mb-1">RNC / NIT / ID Fiscal</label>
                  <input
                    type="text"
                    placeholder="Ej. 131-99999-1"
                    value={newSiteForm.identificacion}
                    onChange={(e) => setNewSiteForm({ ...newSiteForm, identificacion: e.target.value })}
                    className="w-full bg-[#131926] border border-slate-700 rounded-xl p-2.5 text-xs text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">País</label>
                  <select
                    value={newSiteForm.pais}
                    onChange={(e) =>
                      setNewSiteForm({
                        ...newSiteForm,
                        pais: e.target.value,
                        ciudad: e.target.value === 'DO' ? 'Santo Domingo / Punta Cana' : 'San Salvador'
                      })
                    }
                    className="w-full bg-[#131926] border border-slate-700 rounded-xl p-2.5 text-xs text-white"
                  >
                    <option value="DO">🇩🇴 Rep. Dominicana</option>
                    <option value="SV">🇸🇻 El Salvador</option>
                    <option value="US">🇺🇸 Estados Unidos</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs text-slate-400 block mb-1">Ciudad / Zona Principal</label>
                  <input
                    type="text"
                    placeholder="Ej. Punta Cana, Bávaro"
                    value={newSiteForm.ciudad}
                    onChange={(e) => setNewSiteForm({ ...newSiteForm, ciudad: e.target.value })}
                    className="w-full bg-[#131926] border border-slate-700 rounded-xl p-2.5 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-400 block mb-1">Categoría / Giro (Maps)</label>
                  <input
                    type="text"
                    placeholder="Ej. Transporte Ejecutivo"
                    value={newSiteForm.categoria}
                    onChange={(e) => setNewSiteForm({ ...newSiteForm, categoria: e.target.value })}
                    className="w-full bg-[#131926] border border-slate-700 rounded-xl p-2.5 text-xs text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 p-3.5 rounded-xl bg-[#131926] border border-slate-800">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Plan Retainer Mensual ($ USD)</label>
                  <input
                    type="number"
                    value={newSiteForm.planMensual}
                    onChange={(e) => setNewSiteForm({ ...newSiteForm, planMensual: e.target.value })}
                    className="w-full bg-[#0a0d14] border border-slate-700 rounded-xl p-2 text-xs text-emerald-400 font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-400 block mb-1">Días Activos Iniciales</label>
                  <select
                    value={newSiteForm.diasCortesiaInicial}
                    onChange={(e) => setNewSiteForm({ ...newSiteForm, diasCortesiaInicial: Number(e.target.value) })}
                    className="w-full bg-[#0a0d14] border border-slate-700 rounded-xl p-2 text-xs text-white font-semibold"
                  >
                    <option value={30}>Activar +30 Días (1 Mes)</option>
                    <option value={90}>Activar +90 Días (3 Meses)</option>
                    <option value={365}>Activar +365 Días (1 Año)</option>
                    <option value={0}>Sin activar aún (0 días)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs text-slate-400 block mb-1">Color de Marca</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={newSiteForm.colorPrimario}
                      onChange={(e) => setNewSiteForm({ ...newSiteForm, colorPrimario: e.target.value })}
                      className="w-8 h-8 rounded-lg bg-transparent cursor-pointer border border-slate-700"
                    />
                    <input
                      type="text"
                      value={newSiteForm.colorPrimario}
                      onChange={(e) => setNewSiteForm({ ...newSiteForm, colorPrimario: e.target.value })}
                      className="flex-1 bg-[#0a0d14] border border-slate-700 rounded-xl p-2 text-xs font-mono text-white"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowNewSiteModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={creatingSite || !newSiteForm.nombre.trim()}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-950"
                >
                  {creatingSite ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                  <span>Registrar Cliente en CMS &amp; Ver Prompt</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
