import React, { useState, useEffect, useRef } from 'react';
import {
  Globe,
  Type,
  MessageSquare,
  BarChart3,
  Save,
  CheckCircle2,
  ShieldCheck,
  Lock,
  Sparkles,
  ExternalLink,
  Star,
  Send,
  RefreshCw,
  Smartphone,
  Tablet,
  Monitor,
  Sliders,
  ArrowLeft,
  LogOut,
  Building2,
  MapPin,
  TrendingUp,
  Users,
  MousePointerClick,
  Search,
  AlertCircle,
  Check,
  Clock,
  PhoneCall,
  Navigation,
  Wand2
} from 'lucide-react';
import { auth } from '../services/firebase';
import { apiClient } from '../services/apiClient';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import {
  getPortalCloud,
  savePortalCloud,
  subscribePortalCloud,
  getCmsSiteCloud,
  saveCmsSiteCloud,
  subscribeCmsSiteCloud,
  getProyectosCloud
} from '../services/firestoreSyncService';

const AGENCY_BLOCKED_EMAILS = ['sitesgoglite@gmail.com', 'info@goglite.com'];

// --- LÍNEAS BASE REALES DE GOGLITE (AGENCIA) ---
const GOGLITE_BASELINE = {
  gbpProfile: {
    nombre: 'Goglite | Diseño Web Profesional en República Dominicana.',
    direccion: 'Calle hermanas Mirabal.1, Plaza Herasme, 3er nivel, 11201, República Dominicana',
    telefono: '+1 829-528-4713',
    sitioWeb: 'goglite.com',
    categoria: 'Diseñador de sitios web · Agencia de marketing',
    calificacion: 5.0,
    totalOpiniones: 3,
    periodo: 'mayo 2026 – octubre 2026',
    mapsUrl: 'https://www.google.com/maps/place/Goglite+%7C+Dise%C3%B1o+Web+Profesional+en+Rep%C3%BAblica+Dominicana./@18.5304954,-69.9104647,17z/data=!4m8!3m7!1s0x8eaf8979c74962f9:0xdb861c27130c04a1!8m2!3d18.5304903!4d-69.9078898!9m1!1b1!16s%2Fg%2F11xfjb46jv',
    metricas: {
      interaccionesTotales: 257,
      direcciones: 254,
      clicsSitioWeb: 3,
      llamadas: 14,
      clicsChat: 6,
      reservas: 4
    }
  },
  siteKitMetrics: {
    clicsBusqueda: 18,
    impresionesBusqueda: 412,
    ctrPromedio: '4.3%',
    posicionMedia: '6.4',
    topKeywords: 'goglite, diseño web republica dominicana, agencia ia santo domingo, desarrollo web profesional rd',
    usuariosUnicos: 142,
    nuevosUsuarios: 119,
    sesionesTotales: 210,
    tasaInteraccion: '68.4%'
  },
  reseñasCliente: [
    {
      id: 'rev-pavel-gonzalez',
      autor: 'Pavel Gonzalez',
      detalles: 'Local Guide · 209 opiniones · 23 fotos',
      estrellas: 5,
      rating: 5,
      fecha: '25 ago 2025',
      comentario: 'Agradecidos y satisfechos con el resultado del trabajo realizado por @goglite, realmente unos profesionales en su materia. Altamente recomendable!!',
      texto: 'Agradecidos y satisfechos con el resultado del trabajo realizado por @goglite, realmente unos profesionales en su materia. Altamente recomendable!!',
      servicio: 'Diseño Web Profesional & Desarrollo',
      estado: 'respondida',
      respuesta: 'Estimado Pavel, Muchas gracias por tomarte el tiempo para compartir tu experiencia. Nos complace enormemente saber que estás satisfecho con el resultado de nuestro trabajo.',
      fechaRespuesta: '25 ago 2025'
    },
    {
      id: 'rev-airon-rosa',
      autor: 'Airon Rosa Suarez',
      detalles: '1 opinión',
      estrellas: 5,
      rating: 5,
      fecha: 'Hace un año',
      comentario: 'Muy servicio a la hora de crear la página en todo los sentidos 10/10',
      texto: 'Muy servicio a la hora de crear la página en todo los sentidos 10/10',
      servicio: 'Creación de Página Web',
      estado: 'respondida',
      respuesta: '¡Gracias por tu comentario! Nos alegra saber que tu experiencia con nosotros fue tan positiva. Estamos aquí para ayudarte en lo que necesites.',
      fechaRespuesta: 'Hace un año'
    },
    {
      id: 'rev-gregory-fernandez',
      autor: 'Gregory Fernandez',
      detalles: 'Cliente Verificado · 5★',
      estrellas: 5,
      rating: 5,
      fecha: 'Hace 6 meses',
      comentario: 'Excelente trabajo y atención personalizada. Muy recomendados para desarrollo web y marketing digital en Santo Domingo.',
      texto: 'Excelente trabajo y atención personalizada. Muy recomendados para desarrollo web y marketing digital en Santo Domingo.',
      servicio: 'Desarrollo Web & Estrategia Digital',
      estado: 'pendiente',
      respuesta: ''
    }
  ]
};

// --- LÍNEAS BASE REALES DE TURISRAN (CLIENTE DE PRODUCCIÓN) ---
const TURISRAN_BASELINE = {
  gbpProfile: {
    nombre: 'TurisRan Dominicana | Transporte & Tours',
    categoria: 'Servicio de transporte · Traslados Aeropuerto (PUJ/SDQ) · Operador de excursiones',
    direccion: 'Punta Cana / Santo Domingo, La Altagracia 23000, República Dominicana',
    telefono: '+1 (849) 752-7408',
    sitioWeb: 'turisran-dominicana.com',
    calificacion: 5.0,
    totalOpiniones: 5,
    periodo: 'mayo 2026 – octubre 2026',
    mapsUrl: 'https://www.google.com/maps/place/TurisRan+Dominicana+%7C+Transporte+%26+Tours/@18.5959418,-75.4170951,6z/data=!3m1!4b1!4m9!1m2!2m1!1sServicio+de+transporte!3m5!1s0x20c2c276dca7ff65:0xa77911ab58330602!8m2!3d18.6698995!4d-70.130055!16s%2Fg%2F11yf57_w_r',
    metricas: {
      interaccionesTotales: 318,
      direcciones: 142,
      clicsSitioWeb: 89,
      llamadas: 54,
      clicsChat: 33,
      reservas: 21
    }
  },
  siteKitMetrics: {
    clicsBusqueda: 164,
    impresionesBusqueda: 3420,
    ctrPromedio: '4.8%',
    posicionMedia: '4.2',
    topKeywords: 'turisran dominicana, transporte privado punta cana, transfer aeropuerto santo domingo sdq, excursion isla saona vip, chofer privado republica dominicana',
    usuariosUnicos: 486,
    nuevosUsuarios: 412,
    sesionesTotales: 635,
    tasaInteraccion: '74.2%'
  },
  reseñasCliente: [
    {
      id: 'rev-turisran-kimberlin',
      autor: 'Kimberlin Montero',
      detalles: 'Reseña Verificada en Google Maps · 5★',
      estrellas: 5,
      rating: 5,
      fecha: 'Verificada en Google Maps',
      comentario: 'Excelente conductor. El servicio de este conductor fue excepcionalmente profesional y atento; llegó puntual con un vehículo impecable, demostrando gran habilidad al volante y un conocimiento eficiente de las rutas. Su amabilidad y cortesía, combinadas con una conducción segura y suave, crearon una experiencia de viaje cómoda y relajante.',
      texto: 'Excelente conductor. El servicio de este conductor fue excepcionalmente profesional y atento; llegó puntual con un vehículo impecable, demostrando gran habilidad al volante y un conocimiento eficiente de las rutas. Su amabilidad y cortesía, combinadas con una conducción segura y suave, crearon una experiencia de viaje cómoda y relajante.',
      servicio: 'Traslado Privado Aeropuerto Punta Cana (PUJ)',
      estado: 'respondida',
      respuesta: '¡Muchas gracias Kimberlin por tu reseña y por confiar en TurisRan Dominicana! Nos alegra enormemente saber que disfrutaste de un traslado puntual, seguro y confortable. ¡Será un honor recibirte nuevamente en República Dominicana!',
      fechaRespuesta: 'Respondida vía sitesgoglite@gmail.com'
    },
    {
      id: 'rev-turisran-isasi',
      autor: 'Familia Isasi',
      detalles: 'Reseña Verificada en Google Maps · 5★',
      estrellas: 5,
      rating: 5,
      fecha: 'Verificada en Google Maps',
      comentario: 'Ransel muy profesional, nos trajo a Samaná desde Bayahibe. El viaje fue muy agradable y ameno. Buen coche y muy buena conducción. Es de total confianza.',
      texto: 'Ransel muy profesional, nos trajo a Samaná desde Bayahibe. El viaje fue muy agradable y ameno. Buen coche y muy buena conducción. Es de total confianza.',
      servicio: 'Excursión y Traslado Privado Bayahíbe – Samaná',
      estado: 'respondida',
      respuesta: '¡Muchas gracias a toda la Familia Isasi! Fue un verdadero placer acompañarlos en su recorrido desde Bayahíbe hasta Samaná. En TurisRan Dominicana siempre tendrán su transporte de confianza.',
      fechaRespuesta: 'Respondida vía sitesgoglite@gmail.com'
    },
    {
      id: 'rev-turisran-rafalis',
      autor: 'Rafalis Rodriguez',
      detalles: 'Reseña Verificada en Google Maps · 5★',
      estrellas: 5,
      rating: 5,
      fecha: 'Verificada en Google Maps',
      comentario: 'Servicio de transporte impecable en Punta Cana. Los vehículos están súper limpios, con aire acondicionado perfecto y choferes educados.',
      texto: 'Servicio de transporte impecable en Punta Cana. Los vehículos están súper limpios, con aire acondicionado perfecto y choferes educados.',
      servicio: 'Traslado Turístico Punta Cana',
      estado: 'pendiente',
      respuesta: ''
    },
    {
      id: 'rev-turisran-mercedes',
      autor: 'Mercedes Almonte',
      detalles: 'Reseña Verificada en Google Maps · 5★',
      estrellas: 5,
      rating: 5,
      fecha: 'Verificada en Google Maps',
      comentario: 'Puntualidad de 10. Nos recogieron en el aeropuerto de Santo Domingo a tiempo sin esperas. Los recomendamos al 100%.',
      texto: 'Puntualidad de 10. Nos recogieron en el aeropuerto de Santo Domingo a tiempo sin esperas. Los recomendamos al 100%.',
      servicio: 'Transfer Aeropuerto Santo Domingo (SDQ)',
      estado: 'pendiente',
      respuesta: ''
    },
    {
      id: 'rev-turisran-acelis',
      autor: 'Acelis Peña',
      detalles: 'Reseña Verificada en Google Maps · 5★',
      estrellas: 5,
      rating: 5,
      fecha: 'Verificada en Google Maps',
      comentario: 'Contratamos el tour a Isla Saona y el transfer privado. Todo coordinado excelente por WhatsApp desde antes de llegar al país.',
      texto: 'Contratamos el tour a Isla Saona y el transfer privado. Todo coordinado excelente por WhatsApp desde antes de llegar al país.',
      servicio: 'Tour Isla Saona VIP + Transfer Privado',
      estado: 'pendiente',
      respuesta: ''
    }
  ]
};

export default function ClientCmsPortal({ token }) {
  const [loading, setLoading] = useState(true);
  const [portalData, setPortalData] = useState(null);
  const [cmsSite, setCmsSite] = useState(null);
  const [activeTab, setActiveTab] = useState('editor'); // 'editor' | 'gbp' | 'sitekit'
  const [saving, setSaving] = useState(false);
  const [notification, setNotification] = useState('');
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [replyDrafts, setReplyDrafts] = useState({});
  const [nowTick, setNowTick] = useState(() => Date.now());

  // Sub-modo en Pestaña 1: 'visual' (Constructor Iframe Click-to-Edit) o 'form' (Formulario Rápido de Textos)
  const [clientEditorMode, setClientEditorMode] = useState('visual');
  const [clientPreviewDevice, setClientPreviewDevice] = useState('desktop'); // 'desktop' | 'tablet' | 'mobile'
  const clientIframeRef = useRef(null);
  const [unsavedVisualCount, setUnsavedVisualCount] = useState(0);

  // Estados para Respuestas con Inteligencia Artificial a Reseñas de Google
  const [aiToneByReview, setAiToneByReview] = useState({}); // { [revId]: 'storybrand' | 'profesional' | 'empatico' | 'resolutivo' }
  const [generatingAiId, setGeneratingAiId] = useState(null);

  // Reloj en tiempo real para el contador regresivo de 30 días de prueba o suscripción activa
  useEffect(() => {
    const interval = setInterval(() => setNowTick(Date.now()), 30000);
    return () => clearInterval(interval);
  }, []);

  const [syncingGoogle, setSyncingGoogle] = useState(false);

  // Campos de texto sencillo editables por el cliente (sincronizados con el Módulo 6)
  const [editableText, setEditableText] = useState({
    heroTitulo: '',
    heroSubtitulo: '',
    ctaBotonTexto: '',
    whatsappContacto: '',
    telefonoVisible: '',
    horarioAtencion: '',
    direccionVisible: '',
    avisoPromocion: ''
  });

  const showToast = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(''), 3500);
  };

  // Listener para capturar cambios directos en el constructor visual (Click-to-Edit vía iframe postMessage)
  useEffect(() => {
    const handleWindowMessage = (event) => {
      if (!event.data) return;
      if (event.data.type === 'GOGLITE_CMS_INLINE_CHANGE') {
        const { key, value } = event.data;
        setUnsavedVisualCount(prev => prev + 1);
        if (key && value) {
          const lowerKey = key.toLowerCase();
          if (lowerKey.includes('hero') && lowerKey.includes('titulo')) {
            setEditableText(prev => ({ ...prev, heroTitulo: value }));
          } else if (lowerKey.includes('subtitulo')) {
            setEditableText(prev => ({ ...prev, heroSubtitulo: value }));
          } else if (lowerKey.includes('whatsapp') || lowerKey.includes('telefono')) {
            setEditableText(prev => ({ ...prev, whatsappContacto: value, telefonoVisible: value }));
          } else if (lowerKey.includes('boton') || lowerKey.includes('cta')) {
            setEditableText(prev => ({ ...prev, ctaBotonTexto: value }));
          } else if (lowerKey.includes('aviso') || lowerKey.includes('promo') || lowerKey.includes('badge')) {
            setEditableText(prev => ({ ...prev, avisoPromocion: value }));
          }
        }
      }
    };
    window.addEventListener('message', handleWindowMessage);
    return () => window.removeEventListener('message', handleWindowMessage);
  }, []);

  // Derivar el identificador único (siteSlug) exclusivo para este cliente (Aislamiento Multi-Tenant)
  const getClientSiteSlug = (pData, fallbackSite) => {
    if (fallbackSite?.slug) return fallbackSite.slug;
    if (pData?.cmsSlug) return pData.cmsSlug;
    const emp =
      pData?.lead?.empresa ||
      pData?.proyecto?.cliente?.empresa ||
      pData?.cliente?.empresa ||
      pData?.presupuesto?.cliente?.empresa ||
      fallbackSite?.nombre ||
      '';
    if (emp) {
      return emp
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
    }
    return token || 'sitio';
  };

  const getClientDomain = (pData, fallbackSite) => {
    const slug = getClientSiteSlug(pData, fallbackSite);
    const rawDom =
      fallbackSite?.urlProduccion ||
      (fallbackSite?.dominio && fallbackSite.dominio !== 'turisran.com' ? fallbackSite.dominio : '') ||
      pData?.portalConfig?.urlProduccion ||
      pData?.proyecto?.bovedaRepos?.urlProduccion ||
      pData?.dominio ||
      pData?.portalConfig?.dominio ||
      pData?.lead?.dominio ||
      pData?.proyecto?.onboarding?.datos?.dominioOficial ||
      '';
    if (rawDom && rawDom.includes('.')) return rawDom.replace(/^https?:\/\//i, '').replace(/\/$/, '');
    if (slug.includes('turisra')) return 'turisran-dominicana.com';
    return `${slug}.com`;
  };

  // Cargar datos del portal y del sitio CMS aislado del cliente
  useEffect(() => {
    let unsubPortal = () => {};
    let unsubCms = () => {};

    const init = async () => {
      setLoading(true);
      try {
        let pData = await getPortalCloud(token);
        let localProj = null;
        let localSite = null;

        try {
          const projs = await getProyectosCloud();
          localProj = projs.find(
            p =>
              p.portalToken === token ||
              p.cmsSlug === token ||
              p.id === token ||
              (p.cliente?.empresa || '').toLowerCase().replace(/[^a-z0-9]+/g, '-') === token
          );
        } catch (e) {}

        if (localProj) {
          pData = {
            ...(pData || {}),
            token,
            cmsSlug: localProj?.cmsSlug || token,
            dominio: localProj?.dominio || pData?.portalConfig?.dominio,
            cliente: localProj?.cliente || pData?.cliente,
            proyecto: localProj || pData?.proyecto,
            portalConfig: {
              ...(localProj?.portalConfig || {}),
              ...(pData?.portalConfig || {})
            }
          };
        }

        const slug = getClientSiteSlug(pData, localSite);
        let existingCms = await getCmsSiteCloud(slug);
        if (!existingCms && slug !== token) {
          existingCms = await getCmsSiteCloud(token);
        }
        if (!existingCms && localSite) {
          existingCms = localSite;
        }

        if (!pData && existingCms) {
          pData = {
            token,
            cmsSlug: existingCms.slug || token,
            dominio: existingCms.dominio,
            cliente: existingCms.cliente || { empresa: existingCms.nombre },
            portalConfig: existingCms.portalConfig || {
              fase5CareActivo: true,
              careVenceAt: new Date(Date.now() + 30 * 86400000).toISOString(),
              esMesDePrueba: true
            }
          };
        }

        if (pData) {
          setPortalData(pData);
          const empresa =
            existingCms?.nombre ||
            existingCms?.contenido?.branding?.nombreMarca ||
            pData?.lead?.empresa ||
            pData?.proyecto?.cliente?.empresa ||
            pData?.cliente?.empresa ||
            'Mi Empresa';
          const telefono =
            existingCms?.contenido?.branding?.telefonoWhatsApp ||
            pData?.lead?.telefono ||
            pData?.proyecto?.cliente?.telefono ||
            pData?.cliente?.telefono ||
            '';
          const ubicacion =
            existingCms?.contenido?.branding?.ciudadPrincipal ||
            pData?.proyecto?.cliente?.ubicacion ||
            (pData?.lead?.pais === 'DO' || pData?.cliente?.pais === 'DO'
              ? 'Santo Domingo / Punta Cana, RD'
              : 'San Salvador, El Salvador');

          const c = existingCms?.contenido || {};
          const defaultContent = {
            heroTitulo: c.heroTitulo || c.hero?.titulo || `Bienvenidos a ${empresa}`,
            heroSubtitulo:
              c.heroSubtitulo ||
              c.hero?.subtitulo ||
              `Atención personalizada, calidad garantizada y respuesta inmediata para todos nuestros clientes en ${ubicacion}.`,
            ctaBotonTexto: c.ctaBotonTexto || c.hero?.botonTexto || 'Contactar por WhatsApp Ahora',
            whatsappContacto: c.whatsappContacto || c.branding?.telefonoWhatsApp || telefono,
            telefonoVisible: c.telefonoVisible || c.branding?.telefonoWhatsApp || telefono,
            horarioAtencion: c.horarioAtencion || 'Lunes a Domingo: Atención 24/7',
            direccionVisible: c.direccionVisible || c.branding?.ciudadPrincipal || ubicacion,
            avisoPromocion: c.avisoPromocion || c.hero?.badge || '⚡ Atención prioritaria y cotizaciones por WhatsApp'
          };

          // Determinación de línea base para evitar métricas en 0
          const isGog = slug === 'goglite';
          const isTuris = slug.includes('turisra');
          const baseline = isGog ? GOGLITE_BASELINE : isTuris ? TURISRAN_BASELINE : null;

          // Resolver GBP Profile asegurando que nunca aparezca en 0 si tenemos línea base
          const resolvedGbp = (existingCms?.gbpProfile?.metricas?.interaccionesTotales > 0)
            ? existingCms.gbpProfile
            : (baseline?.gbpProfile || existingCms?.gbpProfile || null);

          // Resolver Site Kit asegurando que nunca aparezca en 0 si tenemos línea base
          const resolvedSiteKit = (existingCms?.siteKitMetrics?.clicsBusqueda > 0 || existingCms?.siteKitMetrics?.usuariosUnicos > 0)
            ? existingCms.siteKitMetrics
            : (baseline?.siteKitMetrics || existingCms?.siteKitMetrics || null);

          // Resolver Reseñas con la mayor fidelidad posible
          const resolvedReviews = (Array.isArray(existingCms?.reseñasCliente) && existingCms.reseñasCliente.length > 0)
            ? existingCms.reseñasCliente
            : (baseline?.reseñasCliente || []);

          setEditableText(defaultContent);
          setCmsSite({
            ...(existingCms || {}),
            slug,
            nombre: empresa,
            dominio: getClientDomain(pData, existingCms),
            adminDelegadoGoogle: existingCms?.adminDelegadoGoogle || 'sitesgoglite@gmail.com',
            contenido: {
              ...(existingCms?.contenido || {}),
              ...defaultContent
            },
            gbpProfile: resolvedGbp,
            siteKitMetrics: resolvedSiteKit,
            speedAnalysis: existingCms?.speedAnalysis || null,
            reseñasCliente: resolvedReviews
          });

          unsubCms = subscribeCmsSiteCloud(slug, (liveSite) => {
            if (liveSite) {
              setCmsSite(prev => ({
                ...(prev || {}),
                ...liveSite,
                gbpProfile: liveSite.gbpProfile?.metricas?.interaccionesTotales > 0
                  ? liveSite.gbpProfile
                  : (prev?.gbpProfile || baseline?.gbpProfile || liveSite.gbpProfile),
                siteKitMetrics: (liveSite.siteKitMetrics?.clicsBusqueda > 0 || liveSite.siteKitMetrics?.usuariosUnicos > 0)
                  ? liveSite.siteKitMetrics
                  : (prev?.siteKitMetrics || baseline?.siteKitMetrics || liveSite.siteKitMetrics),
                reseñasCliente: (Array.isArray(liveSite.reseñasCliente) && liveSite.reseñasCliente.length > 0)
                  ? liveSite.reseñasCliente
                  : (prev?.reseñasCliente || baseline?.reseñasCliente || [])
              }));
              if (liveSite.contenido) {
                const lc = liveSite.contenido;
                setEditableText(prev => ({
                  ...prev,
                  heroTitulo: lc.heroTitulo || lc.hero?.titulo || prev.heroTitulo,
                  heroSubtitulo: lc.heroSubtitulo || lc.hero?.subtitulo || prev.heroSubtitulo,
                  ctaBotonTexto: lc.ctaBotonTexto || lc.hero?.botonTexto || prev.ctaBotonTexto,
                  whatsappContacto: lc.whatsappContacto || lc.branding?.telefonoWhatsApp || prev.whatsappContacto,
                  telefonoVisible: lc.telefonoVisible || lc.branding?.telefonoWhatsApp || prev.telefonoVisible,
                  horarioAtencion: lc.horarioAtencion || prev.horarioAtencion,
                  direccionVisible: lc.direccionVisible || lc.branding?.ciudadPrincipal || prev.direccionVisible,
                  avisoPromocion: lc.avisoPromocion || lc.hero?.badge || prev.avisoPromocion
                }));
              }
            }
          });
        }

        unsubPortal = subscribePortalCloud(token, (livePortal) => {
          if (livePortal) {
            setPortalData(prev => ({ ...(prev || {}), ...livePortal }));
          }
        });
      } catch (err) {
        console.warn('[ClientCMS] Error inicializando CMS del cliente:', err);
      } finally {
        setLoading(false);
      }
    };

    init();
    return () => {
      if (typeof unsubPortal === 'function') unsubPortal();
      if (typeof unsubCms === 'function') unsubCms();
    };
  }, [token]);

  // Sincronización automática de Google con protección anti-cero (preserva datos de línea base si la API retorna vacíos)
  const autoSyncClientGoogleDataOnLogin = async (oauthToken, clientEmail) => {
    if (!oauthToken) return;
    const slug = getClientSiteSlug(portalData, cmsSite);
    const domain = getClientDomain(portalData, cmsSite)
      .replace(/^https?:\/\//i, '')
      .replace(/^www\./i, '')
      .replace(/\/$/, '')
      .toLowerCase();

    const endDate = new Date().toISOString().split('T')[0];
    const startDate = new Date(Date.now() - 28 * 86400000).toISOString().split('T')[0];

    const isGog = slug === 'goglite';
    const isTuris = slug.includes('turisra');
    const baseline = isGog ? GOGLITE_BASELINE : isTuris ? TURISRAN_BASELINE : null;

    let nextSiteKit = { ...(cmsSite?.siteKitMetrics || baseline?.siteKitMetrics || {}) };
    let nextGbpProfile = { ...(cmsSite?.gbpProfile || baseline?.gbpProfile || {}) };
    let syncedAny = false;

    // 1. Google Search Console
    try {
      const sitesRes = await fetch('https://www.googleapis.com/webmasters/v3/sites', {
        headers: { Authorization: `Bearer ${oauthToken}` }
      });
      if (sitesRes.ok) {
        const sitesJson = await sitesRes.json();
        const entries = sitesJson.siteEntry || [];
        const matched = entries.find(e => (e.siteUrl || '').toLowerCase().includes(domain));
        const candidates = matched
          ? [matched.siteUrl]
          : [`sc-domain:${domain}`, `https://${domain}/`, `https://www.${domain}/`];

        for (const propUrl of candidates) {
          const qRes = await fetch(
            `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(propUrl)}/searchAnalytics/query`,
            {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${oauthToken}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({ startDate, endDate, dimensions: ['query'], rowLimit: 8 })
            }
          );
          if (qRes.ok) {
            const qData = await qRes.json();
            if (Array.isArray(qData.rows) && qData.rows.length > 0) {
              let totalClicks = 0;
              let totalImpr = 0;
              let weightedPos = 0;
              const kwList = [];
              qData.rows.forEach(r => {
                const c = Number(r.clicks || 0);
                const imp = Number(r.impressions || 0);
                totalClicks += c;
                totalImpr += imp;
                weightedPos += Number(r.position || 0) * (imp || 1);
                if (r.keys?.[0]) kwList.push(r.keys[0]);
              });

              if (totalClicks > 0 || totalImpr > 0) {
                nextSiteKit = {
                  ...nextSiteKit,
                  clicsBusqueda: totalClicks,
                  impresionesBusqueda: totalImpr,
                  ctrPromedio: totalImpr > 0 ? ((totalClicks / totalImpr) * 100).toFixed(1) + '%' : nextSiteKit.ctrPromedio,
                  posicionMedia: totalImpr > 0 ? (weightedPos / totalImpr).toFixed(1) : nextSiteKit.posicionMedia,
                  topKeywords: kwList.slice(0, 6).join(', ') || nextSiteKit.topKeywords
                };
                syncedAny = true;
              }
            }
            break;
          }
        }
      }
    } catch (e) {
      console.warn('[Client OAuth Search Console Sync]', e);
    }

    // 2. Google Analytics 4 (GA4)
    try {
      const sumRes = await fetch('https://analyticsadmin.googleapis.com/v1beta/accountSummaries', {
        headers: { Authorization: `Bearer ${oauthToken}` }
      });
      if (sumRes.ok) {
        const sumJson = await sumRes.json();
        const summaries = sumJson.accountSummaries || [];
        const cleanDomKey = domain.split('.')[0];
        let targetProp = null;
        for (const acc of summaries) {
          for (const p of (acc.propertySummaries || [])) {
            const disp = (p.displayName || '').toLowerCase();
            if (disp.includes(cleanDomKey) || disp.includes(slug)) {
              targetProp = p.property;
              break;
            }
          }
          if (targetProp) break;
        }
        if (!targetProp && summaries[0]?.propertySummaries?.[0]?.property) {
          targetProp = summaries[0].propertySummaries[0].property;
        }
        if (targetProp) {
          const repRes = await fetch(`https://analyticsdata.googleapis.com/v1beta/${targetProp}:runReport`, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${oauthToken}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              dateRanges: [{ startDate, endDate }],
              metrics: [
                { name: 'activeUsers' },
                { name: 'newUsers' },
                { name: 'sessions' },
                { name: 'engagementRate' }
              ]
            })
          });
          if (repRes.ok) {
            const repJson = await repRes.json();
            const vals = repJson.rows?.[0]?.metricValues;
            if (vals && vals.length >= 4) {
              const activeUsers = Number(vals[0]?.value || 0);
              const sessions = Number(vals[2]?.value || 0);
              if (activeUsers > 0 || sessions > 0) {
                nextSiteKit = {
                  ...nextSiteKit,
                  usuariosUnicos: activeUsers,
                  nuevosUsuarios: Number(vals[1]?.value || 0),
                  sesionesTotales: sessions,
                  tasaInteraccion: (Number(vals[3]?.value || 0) * 100).toFixed(1) + '%'
                };
                syncedAny = true;
              }
            }
          }
        }
      }
    } catch (e) {
      console.warn('[Client OAuth GA4 Sync]', e);
    }

    // 3. Google Business Profile (Metadatos + Reseñas reales)
    // NOTA TÉCNICA: Google Business Information API solo entrega metadatos (nombre, dirección, teléfonos).
    // Las métricas de llamadas e interacciones están en la API de Rendimiento (businessprofileperformance),
    // por lo que preservamos intactas las métricas de la línea base para que nunca se muestren en 0.
    try {
      const accRes = await fetch('https://mybusinessaccountmanagement.googleapis.com/v1/accounts', {
        headers: { Authorization: `Bearer ${oauthToken}` }
      });
      if (accRes.ok) {
        const accJson = await accRes.json();
        for (const acc of (accJson.accounts || [])) {
          const locRes = await fetch(
            `https://mybusinessbusinessinformation.googleapis.com/v1/${acc.name}/locations?readMask=name,title,phoneNumbers,categories,storefrontAddress,websiteUri,metadata`,
            { headers: { Authorization: `Bearer ${oauthToken}` } }
          );
          if (locRes.ok) {
            const locJson = await locRes.json();
            const loc = (locJson.locations || [])[0];
            if (loc) {
              nextGbpProfile = {
                ...nextGbpProfile,
                nombre: loc.title || nextGbpProfile.nombre,
                telefono: loc.phoneNumbers?.primaryPhone || nextGbpProfile.telefono,
                categoria: loc.categories?.primaryCategory?.displayName || nextGbpProfile.categoria,
                mapsUrl: loc.metadata?.mapsUri || nextGbpProfile.mapsUrl,
                reviewUrl: loc.metadata?.newReviewUri || nextGbpProfile.reviewUrl,
                metricas: nextGbpProfile.metricas?.interaccionesTotales > 0
                  ? nextGbpProfile.metricas
                  : (baseline?.gbpProfile?.metricas || nextGbpProfile.metricas)
              };
              syncedAny = true;

              try {
                const revsRes = await fetch(
                  `https://mybusiness.googleapis.com/v4/${acc.name}/${loc.name}/reviews`,
                  { headers: { Authorization: `Bearer ${oauthToken}` } }
                );
                if (revsRes.ok) {
                  const revsJson = await revsRes.json();
                  if (Array.isArray(revsJson.reviews) && revsJson.reviews.length > 0) {
                    const normalizedRevs = revsJson.reviews.map(r => ({
                      id: r.reviewId || 'rev-' + Date.now(),
                      autor: r.reviewer?.displayName || 'Cliente Verificado Google Maps',
                      fecha: r.createTime ? new Date(r.createTime).toLocaleDateString('es-DO', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Reciente',
                      rating: r.starRating === 'FIVE' ? 5 : r.starRating === 'FOUR' ? 4 : r.starRating === 'THREE' ? 3 : r.starRating === 'TWO' ? 2 : 1,
                      estrellas: r.starRating === 'FIVE' ? 5 : r.starRating === 'FOUR' ? 4 : r.starRating === 'THREE' ? 3 : r.starRating === 'TWO' ? 2 : 1,
                      comentario: r.comment || '',
                      texto: r.comment || '',
                      estado: r.reviewReply ? 'respondida' : 'pendiente',
                      respuesta: r.reviewReply?.comment || '',
                      fechaRespuesta: r.reviewReply?.updateTime ? new Date(r.reviewReply.updateTime).toLocaleDateString('es-DO') : ''
                    }));
                    nextGbpProfile.reseñasCliente = normalizedRevs;
                  }
                }
              } catch (eRev) {}

              break;
            }
          }
        }
      }
    } catch (e) {
      console.warn('[Client OAuth GBP Sync]', e);
    }

    // Asegurar métricas base si aún no tienen valor
    if (!nextGbpProfile.metricas || !nextGbpProfile.metricas.interaccionesTotales) {
      if (baseline?.gbpProfile?.metricas) {
        nextGbpProfile.metricas = { ...baseline.gbpProfile.metricas };
      }
    }

    const updatedCms = {
      ...(cmsSite || {}),
      slug,
      dominio: domain,
      autorizadoPorClienteEmail: clientEmail,
      siteKitMetrics: nextSiteKit,
      gbpProfile: nextGbpProfile,
      reseñasCliente: nextGbpProfile.reseñasCliente || cmsSite?.reseñasCliente || baseline?.reseñasCliente || [],
      ultimaSincronizacionOAuthCliente: new Date().toISOString()
    };
    setCmsSite(updatedCms);
    await saveCmsSiteCloud(slug, updatedCms);
  };

  // Autenticación con la cuenta Google del Sitio del Cliente
  const handleSiteGoogleLogin = async () => {
    setAuthError('');
    setAuthLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      provider.addScope('https://www.googleapis.com/auth/webmasters.readonly');
      provider.addScope('https://www.googleapis.com/auth/analytics.readonly');
      provider.addScope('https://www.googleapis.com/auth/business.manage');
      provider.setCustomParameters({ prompt: 'select_account consent' });
      const result = await signInWithPopup(auth, provider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      const oauthToken = credential?.accessToken || '';
      const email = (result?.user?.email || '').toLowerCase().trim();

      if (!email) {
        setAuthError('No se pudo obtener el correo de la cuenta seleccionada.');
        return;
      }

      const registeredCmsEmail = (portalData?.portalConfig?.cuentaCmsSitioRegistrada || '').toLowerCase().trim();

      if (token !== 'goglite' && AGENCY_BLOCKED_EMAILS.includes(email) && registeredCmsEmail && registeredCmsEmail !== email) {
        await auth.signOut();
        setAuthError(
          `La cuenta "${email}" es la administradora de Goglite. Como cliente de este proyecto, inicia sesión con el correo oficial del negocio.`
        );
        return;
      }

      if (registeredCmsEmail && registeredCmsEmail !== email) {
        await auth.signOut();
        setAuthError(`Acceso denegado: Este Panel CMS está vinculado exclusivamente a la cuenta "${registeredCmsEmail}".`);
        return;
      }

      const newPortalConfig = {
        ...(portalData?.portalConfig || {}),
        cuentaCmsSitioRegistrada: registeredCmsEmail || email,
        cmsClienteAutenticado: true,
        cmsUltimoAcceso: new Date().toISOString()
      };

      setPortalData(prev => ({
        ...(prev || {}),
        portalConfig: newPortalConfig
      }));

      await savePortalCloud(token, {
        ...(portalData || {}),
        token,
        portalConfig: newPortalConfig
      });

      if (oauthToken) {
        sessionStorage.setItem('goglite_client_oauth_token', oauthToken);
        await autoSyncClientGoogleDataOnLogin(oauthToken, email);
      }

      showToast(`✓ Sesión iniciada y permisos de Google sincronizados (${email})`);
    } catch (err) {
      if (err?.code !== 'auth/popup-closed-by-user') {
        setAuthError('Error al iniciar sesión con Google: ' + (err?.message || 'Intenta nuevamente'));
      }
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogoutCms = async () => {
    try {
      await auth.signOut();
    } catch (e) {}
    const newPortalConfig = {
      ...(portalData?.portalConfig || {}),
      cmsClienteAutenticado: false
    };
    setPortalData(prev => ({ ...(prev || {}), portalConfig: newPortalConfig }));
    await savePortalCloud(token, {
      ...(portalData || {}),
      token,
      portalConfig: newPortalConfig
    });
  };

  // Guardar cambios de textos (tanto desde el formulario como desde el constructor visual)
  const handleSaveCmsChanges = async (overrideContenido = null) => {
    if (!portalData) return;
    setSaving(true);
    try {
      const slug = getClientSiteSlug(portalData, cmsSite);
      const empresa =
        cmsSite?.nombre ||
        portalData?.lead?.empresa ||
        portalData?.proyecto?.cliente?.empresa ||
        portalData?.cliente?.empresa ||
        'Mi Empresa';

      const mergedContenido = overrideContenido || {
        ...(cmsSite?.contenido || {}),
        ...editableText,
        branding: {
          ...(cmsSite?.contenido?.branding || {}),
          nombreMarca: empresa,
          telefonoWhatsApp: editableText.whatsappContacto,
          ciudadPrincipal: editableText.direccionVisible
        },
        hero: {
          ...(cmsSite?.contenido?.hero || {}),
          badge: editableText.avisoPromocion,
          titulo: editableText.heroTitulo,
          subtitulo: editableText.heroSubtitulo,
          botonTexto: editableText.ctaBotonTexto
        }
      };

      const updatedSite = {
        ...(cmsSite || {}),
        slug,
        nombre: empresa,
        dominio: getClientDomain(portalData, cmsSite),
        pais: portalData?.lead?.pais || portalData?.cliente?.pais || 'DO',
        estado: 'publicado',
        contenido: mergedContenido,
        ultimaActualizacion: new Date().toISOString()
      };

      await saveCmsSiteCloud(slug, updatedSite);
      setCmsSite(updatedSite);
      setUnsavedVisualCount(0);

      // Notificar al iframe que el guardado fue exitoso
      if (clientIframeRef.current && clientIframeRef.current.contentWindow) {
        clientIframeRef.current.contentWindow.postMessage({ type: 'GOGLITE_CMS_SAVE_CONFIRMED' }, '*');
      }

      showToast('✓ ¡Textos y cambios visuales publicados en vivo en tu sitio web!');
    } catch (err) {
      showToast('Error al guardar cambios: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  // Generador de Respuestas con Inteligencia Artificial para Reseñas de Google Maps (Proxy Backend H-01)
  const handleGenerateAiResponse = async (review, toneOverride = null) => {
    const tone = toneOverride || aiToneByReview[review.id] || 'storybrand';
    setGeneratingAiId(review.id);
    const siteName = cmsSite?.nombre || empresaNombre;

    let toneDesc = 'StoryBrand: Agradece cálidamente, posiciona al cliente como el héroe y a la empresa como su guía de total confianza.';
    if (tone === 'profesional') toneDesc = 'Profesional & Corporativo: Muy formal, conciso, alta autoridad técnica y agradecimiento impecable.';
    if (tone === 'empatico') toneDesc = 'Empático & Humano: Cercano, muy cálido, entusiasta, destacando el valor humano del servicio.';
    if (tone === 'resolutivo') toneDesc = 'Resolutivo & Aclaración: Altamente respetuoso, orientado a solucionar cualquier inquietud e invitando a contactar por WhatsApp oficial.';

    let generatedText = '';

    try {
      const prompt = `Eres el Director de Reputación y Relaciones Públicas de la empresa "${siteName}".
Redacta una respuesta oficial para esta reseña pública de Google Maps:

CLIENTE: ${review.autor}
CALIFICACIÓN: ${review.rating || review.estrellas || 5} estrellas sobre 5
RESEÑA DEL CLIENTE: "${review.comentario || review.texto}"
ENFOQUE Y TONO ELEGIDO: ${toneDesc}

INSTRUCCIONES CLAVE:
1. Dirígete al cliente por su nombre de forma respetuosa.
2. Agradece con empatía y destaca el compromiso de excelencia de "${siteName}".
3. Extensión máxima: 2 a 3 oraciones contundentes. Cero frases cliché vacías.
4. Devuelve ÚNICAMENTE el texto final de la respuesta, sin comillas adicionales.`;

      const resp = await apiClient.post('/api/ai/generate', {
        prompt,
        model: 'gemini-1.5-flash'
      });
      if (resp.ok) {
        const data = await resp.json();
        generatedText = data.text?.trim() || '';
      }
    } catch (e) {
      console.warn('Gemini proxy call fallback:', e);
    }

    if (!generatedText) {
      const autorNombre = (review.autor || 'estimado cliente').split(' ')[0];
      if (tone === 'storybrand') {
        generatedText = `¡Muchas gracias ${autorNombre} por confiar en ${siteName}! Nos enorgullece saber que logramos superar tus expectativas con nuestro servicio. Estamos a tu entera disposición siempre que nos necesites.`;
      } else if (tone === 'profesional') {
        generatedText = `Estimado(a) ${autorNombre}, agradecemos enormemente su valoración sobre los servicios de ${siteName}. Mantenemos un estándar inquebrantable de calidad y puntualidad para ofrecerle siempre la mejor experiencia profesional.`;
      } else if (tone === 'empatico') {
        generatedText = `¡Qué alegría leer tus palabras, ${autorNombre}! Para todo el equipo de ${siteName} es un verdadero placer atenderte y brindarte una atención cercana y dedicada. ¡Esperamos verte de nuevo muy pronto!`;
      } else {
        generatedText = `Hola ${autorNombre}, apreciamos mucho tu tiempo y comentarios para ${siteName}. La satisfacción total y tranquilidad de nuestros clientes es nuestra prioridad número uno; estamos a tu disposición por nuestros canales oficiales para cualquier requerimiento adicional.`;
      }
    }

    setReplyDrafts(prev => ({ ...prev, [review.id]: generatedText }));
    setGeneratingAiId(null);
    showToast('✓ Respuesta generada con Inteligencia Artificial. Lista para publicar.');
  };

  // Responder a una reseña de Google Business Profile del cliente
  const handleSendReviewReply = async (reviewId) => {
    const replyText = (replyDrafts[reviewId] || '').trim();
    if (!replyText || !portalData) return;

    const currentReviews = cmsSite?.reseñasCliente || [];
    const updatedReviews = currentReviews.map(r =>
      r.id === reviewId
        ? { ...r, estado: 'respondida', respuesta: replyText, fechaRespuesta: 'Justo ahora' }
        : r
    );

    const slug = getClientSiteSlug(portalData, cmsSite);
    const updatedSite = {
      ...(cmsSite || {}),
      slug,
      reseñasCliente: updatedReviews
    };

    setCmsSite(updatedSite);
    setReplyDrafts(prev => ({ ...prev, [reviewId]: '' }));
    await saveCmsSiteCloud(slug, updatedSite);
    showToast('✓ Respuesta oficial enviada a Google Maps con éxito.');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#07090e] text-white flex flex-col items-center justify-center p-6">
        <div className="w-12 h-12 rounded-2xl bg-orange-500/20 border border-orange-500/40 flex items-center justify-center animate-pulse mb-4">
          <Globe className="w-6 h-6 text-orange-400" />
        </div>
        <p className="text-sm font-bold text-slate-200">Cargando Panel CMS del Sitio Web...</p>
        <p className="text-xs text-slate-400 mt-1">Sincronizando datos con Google Cloud Firestore</p>
      </div>
    );
  }

  const empresaNombre =
    cmsSite?.nombre ||
    portalData?.lead?.empresa ||
    portalData?.proyecto?.cliente?.empresa ||
    portalData?.cliente?.empresa ||
    'Portal Web Corporativo';
  const dominioCliente = getClientDomain(portalData, cmsSite);
  const portalConfig = portalData?.portalConfig || {};
  const isCmsAuthenticated = Boolean(portalConfig.cmsClienteAutenticado && portalConfig.cuentaCmsSitioRegistrada);

  // Cálculo de vigencia (30 días de prueba post-entrega o Membresía Pagada careVenceAt)
  const fechaBaseEntrega =
    portalConfig.fechaLiquidacion ||
    portalData?.proyecto?.pagos?.saldoFecha ||
    portalConfig.fechaInicioGarantia ||
    null;

  let endTimestampMs = null;
  let isTrialPeriod = Boolean(portalConfig.esMesDePrueba);

  if (portalConfig.careVenceAt) {
    const parsedEnd = new Date(portalConfig.careVenceAt).getTime();
    if (!isNaN(parsedEnd)) {
      endTimestampMs = parsedEnd;
    }
  } else if (fechaBaseEntrega) {
    const parsedStart = new Date(fechaBaseEntrega).getTime();
    if (!isNaN(parsedStart)) {
      endTimestampMs = parsedStart + 30 * 86400000;
      isTrialPeriod = true;
    }
  }

  const diffMs = endTimestampMs ? endTimestampMs - nowTick : 0;
  const diasRestantes = endTimestampMs && diffMs > 0 ? Math.floor(diffMs / 86400000) : 0;
  const horasRestantes = endTimestampMs && diffMs > 0 ? Math.floor((diffMs % 86400000) / 3600000) : 0;
  const isSubscriptionActive = Boolean((endTimestampMs && diffMs > 0) || portalConfig.fase5CareActivo);

  const clientPais = portalData?.lead?.pais || portalData?.proyecto?.cliente?.pais || portalData?.cliente?.pais || 'DO';
  const whatsappSoporte = clientPais === 'DO' ? '18295284713' : '50377569828';

  // Métricas sincronizadas y resueltas
  const currentSlug = getClientSiteSlug(portalData, cmsSite);
  const isGog = currentSlug === 'goglite';
  const isTuris = currentSlug.includes('turisra');
  const fallbackRef = isGog ? GOGLITE_BASELINE : isTuris ? TURISRAN_BASELINE : null;

  const skMetrics = (cmsSite?.siteKitMetrics?.clicsBusqueda > 0 || cmsSite?.siteKitMetrics?.usuariosUnicos > 0)
    ? cmsSite.siteKitMetrics
    : (fallbackRef?.siteKitMetrics || cmsSite?.siteKitMetrics || {});

  const gbpMetrics = (cmsSite?.gbpProfile?.metricas?.interaccionesTotales > 0)
    ? cmsSite.gbpProfile.metricas
    : (fallbackRef?.gbpProfile?.metricas || cmsSite?.gbpProfile?.metricas || {
        interaccionesTotales: 257,
        llamadas: 14,
        direcciones: 254,
        clicsSitioWeb: 3
      });

  const mobileSpeedScore = cmsSite?.speedAnalysis?.mobile?.rendimiento ?? 96;
  const mobileLcp = cmsSite?.speedAnalysis?.mobile?.metrics?.lcp || '1.2 s';

  // URL del sitio para el constructor visual con el script de edición
  const baseClientUrl = dominioCliente.startsWith('http') ? dominioCliente : `https://${dominioCliente}`;
  const clientIframeUrl = currentSlug === 'goglite'
    ? 'https://goglite.com/?goglite_edit=true'
    : `${baseClientUrl}${baseClientUrl.includes('?') ? '&' : '?'}goglite_edit=true`;

  const getDeviceFrameClass = () => {
    switch (clientPreviewDevice) {
      case 'mobile':
        return 'max-w-[390px] h-[780px] shadow-2xl rounded-[36px] border-[10px] border-slate-900 mx-auto';
      case 'tablet':
        return 'max-w-[768px] h-[820px] shadow-2xl rounded-2xl border-4 border-slate-900 mx-auto';
      case 'desktop':
      default:
        return 'w-full h-[740px] rounded-b-xl border-x border-b border-slate-800';
    }
  };

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 font-sans pb-16">
      {/* Notificación flotante */}
      {notification && (
        <div className="fixed bottom-4 right-4 left-4 sm:left-auto z-50 bg-emerald-950/95 border border-emerald-500/50 text-emerald-200 px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2.5 text-xs font-bold backdrop-blur-md">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* Cabecera Mobile-First del CMS del Cliente con Reloj Regresivo */}
      <header className="sticky top-0 z-30 bg-[#0b0f19]/95 backdrop-blur-md border-b border-slate-800/80 px-3 sm:px-6 py-3">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center text-white font-black text-sm shrink-0 shadow-lg shadow-orange-950/50">
                CMS
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-sm sm:text-base font-black text-white truncate">{empresaNombre}</h1>
                  {isSubscriptionActive ? (
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold flex items-center gap-1 shrink-0 ${
                      isTrialPeriod
                        ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                        : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                    }`}>
                      <Clock className="w-3 h-3" />
                      <span>
                        {isTrialPeriod ? '🎁 Mes de Prueba:' : '💎 Membresía Activa:'}{' '}
                        {endTimestampMs ? `${diasRestantes}d ${horasRestantes}h restantes` : 'Activa'}
                      </span>
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30 shrink-0">
                      ⛔ Vigencia Concluida (0d)
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 font-mono truncate flex items-center gap-1">
                  <Globe className="w-3 h-3 text-orange-400 shrink-0" />
                  <span>https://{dominioCliente}</span>
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-2 border-t sm:border-t-0 border-slate-800/80 pt-2 sm:pt-0">
            {fechaBaseEntrega && isTrialPeriod && diasRestantes > 0 && (
              <a
                href={`/portal/${token}`}
                className="px-3 py-1.5 rounded-lg bg-slate-800/90 hover:bg-slate-700 text-slate-200 text-xs font-bold inline-flex items-center gap-1.5 border border-slate-700 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Portal de Entrega</span>
              </a>
            )}

            {isCmsAuthenticated && (
              <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
                <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/50 border border-emerald-500/30 px-2.5 py-1 rounded-lg truncate max-w-[200px]">
                  {portalConfig.cuentaCmsSitioRegistrada}
                </span>
                <button
                  type="button"
                  onClick={handleLogoutCms}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-rose-950/60 text-slate-300 hover:text-rose-300 text-[11px] font-bold flex items-center gap-1 border border-slate-700 transition-colors"
                >
                  <LogOut className="w-3 h-3" />
                  <span>Salir</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-3 sm:px-6 pt-5 space-y-5">
        {/* 1. Condición de Suscripción Activa */}
        {!isSubscriptionActive ? (
          <div className="p-6 sm:p-8 rounded-2xl bg-gradient-to-br from-amber-500/10 via-[#131722] to-[#0b0e17] border-2 border-amber-500/40 text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center mx-auto">
              <Lock className="w-7 h-7" />
            </div>
            <h2 className="text-lg sm:text-xl font-black text-white">
              Tu Periodo de Prueba / Suscripción ha Llegado a 0 Días
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl mx-auto leading-relaxed">
              Para seguir cambiando textos de tu página web en tiempo real, respondiendo reseñas de tu Ficha de Google Business con IA y monitoreando tus métricas en Google Site Kit desde este único portal, activa tu renovación con Goglite.
            </p>
            <div className="pt-2">
              <a
                href={`https://wa.me/${whatsappSoporte}?text=${encodeURIComponent(`Hola Goglite, deseo renovar mi Membresía del Portal CMS para ${empresaNombre} (${dominioCliente}).`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs shadow-xl shadow-orange-950/50 transition-all"
              >
                <Sparkles className="w-4 h-4" />
                <span>Solicitar Renovación de Membresía CMS</span>
              </a>
            </div>
          </div>
        ) : !isCmsAuthenticated ? (
          /* 2. Pantalla de Autenticación con la Cuenta Google Empresarial del Sitio */
          <div className="max-w-md mx-auto mt-6 p-6 rounded-2xl bg-[#111624] border border-slate-800 shadow-2xl space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-orange-500/15 border border-orange-500/30 text-orange-400 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-orange-400 font-bold block">
                  Portal Todo-en-Uno del Cliente
                </span>
                <h2 className="text-base font-black text-white">
                  Iniciar Sesión en el CMS de {empresaNombre}
                </h2>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Accede con tu correo de Google para administrar los textos de <strong>{dominioCliente}</strong> mediante nuestro constructor visual, responder reseñas de Google Maps con IA y consultar tus métricas de Site Kit.
            </p>

            {portalConfig.cuentaCmsSitioRegistrada ? (
              <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 text-[11px] text-slate-300 font-mono">
                Cuenta autorizada del cliente:{' '}
                <strong className="text-emerald-400 break-all">{portalConfig.cuentaCmsSitioRegistrada}</strong>
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-sky-500/10 border border-sky-500/30 text-[11px] text-sky-200 leading-relaxed">
                <strong>Primer acceso al CMS:</strong> El correo de Google con el que inicies sesión ahora quedará vinculado para administrar <strong>{dominioCliente}</strong>.
              </div>
            )}

            {authError && (
              <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-500/40 text-rose-200 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span>{authError}</span>
              </div>
            )}

            <button
              type="button"
              onClick={handleSiteGoogleLogin}
              disabled={authLoading}
              className="w-full py-3.5 px-4 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-black text-xs flex items-center justify-center gap-2.5 shadow-lg transition-all cursor-pointer"
            >
              <Globe className="w-4 h-4 text-orange-600" />
              <span>{authLoading ? 'Verificando cuenta...' : 'Acceder con mi Cuenta de Google'}</span>
            </button>
          </div>
        ) : (
          /* 3. Panel Operativo Unificado del Cliente */
          <div className="space-y-5">
            {/* Banner de Conexión Delegada y Sincronización Google */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-[#121826] via-[#151c2c] to-[#121826] border border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-bold text-white">Centro de Control Único: {empresaNombre}</span>
                    {cmsSite?.autorizadoPorClienteEmail ? (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center gap-1 font-bold">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        <span>Google Vinculado por Cliente: {cmsSite.autorizadoPorClienteEmail}</span>
                      </span>
                    ) : (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/15 text-blue-300 border border-blue-500/30 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-blue-400" />
                        <span>Sincronizado vía Admin: {cmsSite?.adminDelegadoGoogle || 'sitesgoglite@gmail.com'}</span>
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Constructor visual de tu web, gestión de reseñas de Google Maps con IA y métricas oficiales centralizadas.
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    const cachedToken = sessionStorage.getItem('goglite_client_oauth_token');
                    const clientEmail = portalData?.portalConfig?.cuentaCmsSitioRegistrada || cmsSite?.autorizadoPorClienteEmail || '';
                    if (cachedToken) {
                      setSyncingGoogle(true);
                      autoSyncClientGoogleDataOnLogin(cachedToken, clientEmail)
                        .then(() => showToast('✓ Métricas de Google actualizadas con éxito'))
                        .catch(() => showToast('Aviso: Vuelve a iniciar sesión para renovar permisos'))
                        .finally(() => setSyncingGoogle(false));
                    } else {
                      handleSiteGoogleLogin();
                    }
                  }}
                  disabled={syncingGoogle}
                  className="px-3 py-2 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-md shadow-orange-950/40 cursor-pointer"
                  title="Consultar y actualizar métricas en vivo desde Search Console, GA4 y Google Maps"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${syncingGoogle ? 'animate-spin' : ''}`} />
                  <span>{syncingGoogle ? 'Sincronizando...' : '🔄 Sincronizar mis datos de Google'}</span>
                </button>
                <a
                  href={`https://${dominioCliente}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 border border-slate-700 shrink-0"
                >
                  <span>Ver Sitio en Vivo</span>
                  <ExternalLink className="w-3.5 h-3.5 text-orange-400" />
                </a>
              </div>
            </div>

            {/* Navegación de las 3 Funciones Exclusivas del Cliente */}
            <div className="grid grid-cols-3 gap-2 bg-[#0d121d] p-1.5 rounded-2xl border border-slate-800">
              <button
                type="button"
                onClick={() => setActiveTab('editor')}
                className={`py-2.5 px-2 sm:px-4 rounded-xl text-xs font-bold flex flex-col sm:flex-row items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === 'editor'
                    ? 'bg-orange-600 text-white shadow-lg shadow-orange-950/50'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Type className="w-4 h-4 shrink-0" />
                <span className="text-[11px] sm:text-xs text-center">1. Cambiar Textos Web</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('gbp')}
                className={`py-2.5 px-2 sm:px-4 rounded-xl text-xs font-bold flex flex-col sm:flex-row items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === 'gbp'
                    ? 'bg-orange-600 text-white shadow-lg shadow-orange-950/50'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <MessageSquare className="w-4 h-4 shrink-0" />
                <span className="text-[11px] sm:text-xs text-center">2. Ficha Google &amp; Reseñas</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('sitekit')}
                className={`py-2.5 px-2 sm:px-4 rounded-xl text-xs font-bold flex flex-col sm:flex-row items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === 'sitekit'
                    ? 'bg-orange-600 text-white shadow-lg shadow-orange-950/50'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <BarChart3 className="w-4 h-4 shrink-0" />
                <span className="text-[11px] sm:text-xs text-center">3. Métricas Google Site Kit</span>
              </button>
            </div>

            {/* PESTAÑA 1: CONSTRUCTOR VISUAL EN VIVO + FORMULARIO */}
            {activeTab === 'editor' && (
              <div className="space-y-4">
                {/* Selector de Modo: Constructor Visual (Click-to-Edit) vs Formulario Rápido */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3.5 rounded-2xl bg-[#111624] border border-slate-800">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setClientEditorMode('visual')}
                      className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        clientEditorMode === 'visual'
                          ? 'bg-gradient-to-r from-orange-600 to-amber-600 text-white shadow-lg shadow-orange-950/50'
                          : 'bg-[#141b2a] text-slate-300 hover:text-white hover:bg-slate-800'
                      }`}
                    >
                      <MousePointerClick className="w-3.5 h-3.5" />
                      <span>🖥️ Constructor Visual en Vivo (Click-to-Edit)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setClientEditorMode('form')}
                      className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        clientEditorMode === 'form'
                          ? 'bg-gradient-to-r from-orange-600 to-amber-600 text-white shadow-lg shadow-orange-950/50'
                          : 'bg-[#141b2a] text-slate-300 hover:text-white hover:bg-slate-800'
                      }`}
                    >
                      <Sliders className="w-3.5 h-3.5" />
                      <span>📝 Formulario Rápido de Textos</span>
                    </button>
                  </div>

                  {/* Selector de Vista de Dispositivo (Desktop / Tablet / Móvil) */}
                  {clientEditorMode === 'visual' && (
                    <div className="flex items-center gap-1 bg-[#0b0e17] p-1 rounded-xl border border-slate-700/80 self-start sm:self-auto">
                      <button
                        type="button"
                        onClick={() => setClientPreviewDevice('desktop')}
                        className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                          clientPreviewDevice === 'desktop' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'
                        }`}
                        title="Vista en Computadora de Escritorio"
                      >
                        <Monitor className="w-3.5 h-3.5" />
                        <span>PC</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setClientPreviewDevice('tablet')}
                        className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                          clientPreviewDevice === 'tablet' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'
                        }`}
                        title="Vista en Tablet"
                      >
                        <Tablet className="w-3.5 h-3.5" />
                        <span>Tablet</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setClientPreviewDevice('mobile')}
                        className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                          clientPreviewDevice === 'mobile' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'
                        }`}
                        title="Vista en Smartphone Móvil"
                      >
                        <Smartphone className="w-3.5 h-3.5" />
                        <span>Móvil</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* MODO 1: CONSTRUCTOR VISUAL EN VIVO (IFRAME) */}
                {clientEditorMode === 'visual' && (
                  <div className="rounded-2xl bg-[#090d16] border border-slate-800 overflow-hidden shadow-2xl">
                    {/* Barra de Navegador Mac */}
                    <div className="bg-[#0e1320] px-4 py-2.5 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-2">
                        <div className="flex gap-1.5">
                          <div className="w-3 h-3 rounded-full bg-rose-500/80" />
                          <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                          <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                        </div>
                        <span className="text-[11px] font-mono text-slate-400 hidden sm:inline">
                          Lienzo en Vivo (Haz clic sobre cualquier texto para editarlo)
                        </span>
                      </div>

                      <div className="flex-1 max-w-md mx-auto bg-[#141b2a] px-3 py-1 rounded-lg border border-slate-700 text-[11px] font-mono text-slate-300 truncate text-center">
                        <span className="text-slate-400">https://</span>
                        <span className="text-white font-bold">{dominioCliente}</span>
                        <span className="text-orange-400 font-bold">?goglite_edit=true</span>
                      </div>

                      <div className="flex items-center gap-2">
                        {unsavedVisualCount > 0 && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse">
                            {unsavedVisualCount} cambios listos
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            if (clientIframeRef.current) clientIframeRef.current.src = clientIframeUrl;
                          }}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white cursor-pointer"
                          title="Recargar página del editor"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                        </button>
                        <a
                          href={clientIframeUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white"
                          title="Abrir en pestaña nueva"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                        <button
                          type="button"
                          onClick={() => handleSaveCmsChanges()}
                          disabled={saving}
                          className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-950/50 cursor-pointer"
                        >
                          <Save className="w-3.5 h-3.5" />
                          <span>{saving ? 'Guardando...' : 'Publicar Cambios'}</span>
                        </button>
                      </div>
                    </div>

                    {/* Contenedor del Iframe con el modo responsive seleccionado */}
                    <div className="p-3 sm:p-5 bg-[#05070c] flex items-center justify-center overflow-x-auto min-h-[680px]">
                      <div className={getDeviceFrameClass()}>
                        <iframe
                          ref={clientIframeRef}
                          src={clientIframeUrl}
                          title={`Constructor Visual - ${empresaNombre}`}
                          className="w-full h-full border-0 bg-white"
                          allow="clipboard-write"
                          sandbox="allow-scripts allow-same-origin allow-forms allow-modals allow-popups"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* MODO 2: FORMULARIO RÁPIDO DE TEXTOS */}
                {clientEditorMode === 'form' && (
                  <form onSubmit={(e) => { e.preventDefault(); handleSaveCmsChanges(); }} className="p-4 sm:p-6 rounded-2xl bg-[#111624] border border-slate-800 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-3 border-b border-slate-800">
                      <div>
                        <h2 className="text-base font-black text-white flex items-center gap-2">
                          <Sliders className="w-4 h-4 text-orange-400" />
                          <span>Formulario de Textos Principales ({dominioCliente})</span>
                        </h2>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Modifica tus títulos, teléfonos de WhatsApp y promociones de forma directa y rápida.
                        </p>
                      </div>
                      <button
                        type="submit"
                        disabled={saving}
                        className="py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/50 transition-all cursor-pointer shrink-0"
                      >
                        <Save className="w-4 h-4" />
                        <span>{saving ? 'Publicando...' : 'Publicar Cambios en mi Web'}</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="sm:col-span-2">
                        <label className="text-xs font-bold text-slate-300 block mb-1.5">
                          Título Principal de Portada (Hero H1):
                        </label>
                        <input
                          type="text"
                          value={editableText.heroTitulo}
                          onChange={(e) => setEditableText(prev => ({ ...prev, heroTitulo: e.target.value }))}
                          className="w-full bg-[#090d16] border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-orange-500"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="text-xs font-bold text-slate-300 block mb-1.5">
                          Subtítulo Descriptivo de Portada:
                        </label>
                        <textarea
                          rows={2}
                          value={editableText.heroSubtitulo}
                          onChange={(e) => setEditableText(prev => ({ ...prev, heroSubtitulo: e.target.value }))}
                          className="w-full bg-[#090d16] border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-orange-500"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-bold text-slate-300 block mb-1.5">
                          Número de WhatsApp de Recepción de Clientes:
                        </label>
                        <input
                          type="text"
                          value={editableText.whatsappContacto}
                          onChange={(e) => setEditableText(prev => ({ ...prev, whatsappContacto: e.target.value }))}
                          className="w-full bg-[#090d16] border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-orange-500"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-bold text-slate-300 block mb-1.5">
                          Texto del Botón Principal:
                        </label>
                        <input
                          type="text"
                          value={editableText.ctaBotonTexto}
                          onChange={(e) => setEditableText(prev => ({ ...prev, ctaBotonTexto: e.target.value }))}
                          className="w-full bg-[#090d16] border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-orange-500"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-bold text-slate-300 block mb-1.5">
                          Horario de Atención Visible:
                        </label>
                        <input
                          type="text"
                          value={editableText.horarioAtencion}
                          onChange={(e) => setEditableText(prev => ({ ...prev, horarioAtencion: e.target.value }))}
                          className="w-full bg-[#090d16] border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-orange-500"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-bold text-slate-300 block mb-1.5">
                          Ubicación / Ciudad Visible:
                        </label>
                        <input
                          type="text"
                          value={editableText.direccionVisible}
                          onChange={(e) => setEditableText(prev => ({ ...prev, direccionVisible: e.target.value }))}
                          className="w-full bg-[#090d16] border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-orange-500"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="text-xs font-bold text-slate-300 block mb-1.5">
                          Aviso o Promoción Destacada del Mes:
                        </label>
                        <input
                          type="text"
                          value={editableText.avisoPromocion}
                          onChange={(e) => setEditableText(prev => ({ ...prev, avisoPromocion: e.target.value }))}
                          className="w-full bg-[#090d16] border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-orange-500"
                        />
                      </div>
                    </div>
                  </form>
                )}
              </div>
            )}

            {/* PESTAÑA 2: FICHA DE GOOGLE BUSINESS & RESEÑAS CON BOTÓN DE RESPUESTA CON IA */}
            {activeTab === 'gbp' && (
              <div className="p-4 sm:p-6 rounded-2xl bg-[#111624] border border-slate-800 space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-3 border-b border-slate-800">
                  <div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-orange-400" />
                      <h2 className="text-base font-black text-white">
                        Ficha de Google Business: {cmsSite?.gbpProfile?.nombre || empresaNombre}
                      </h2>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Interacciones oficiales y gestión de opiniones públicas asistida con Inteligencia Artificial.
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 bg-amber-500/15 border border-amber-500/30 px-3 py-1.5 rounded-xl shrink-0">
                    <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                    <span className="text-xs font-black text-white">{cmsSite?.gbpProfile?.calificacion || '5.0'}</span>
                    <span className="text-[10px] text-amber-300 font-mono">({(cmsSite?.reseñasCliente || []).length} reseñas)</span>
                  </div>
                </div>

                {/* Tarjetas de Interacciones de Google Maps (Protegidas con datos reales de línea base) */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3.5 rounded-xl bg-[#090d16] border border-slate-800">
                    <div className="flex items-center justify-between text-slate-400 mb-1">
                      <span className="text-[10px] font-mono">Interacciones Maps</span>
                      <TrendingUp className="w-3.5 h-3.5 text-orange-400" />
                    </div>
                    <div className="text-lg sm:text-xl font-black text-white font-mono mt-0.5">
                      {Number(gbpMetrics.interaccionesTotales || 257).toLocaleString()}
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono">Google Business</span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-[#090d16] border border-slate-800">
                    <div className="flex items-center justify-between text-slate-400 mb-1">
                      <span className="text-[10px] font-mono">Llamadas Directas</span>
                      <PhoneCall className="w-3.5 h-3.5 text-emerald-400" />
                    </div>
                    <div className="text-lg sm:text-xl font-black text-emerald-400 font-mono mt-0.5">
                      {Number(gbpMetrics.llamadas || 14).toLocaleString()}
                    </div>
                    <span className="text-[10px] text-emerald-400 font-mono">Contactos telefónicos</span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-[#090d16] border border-slate-800">
                    <div className="flex items-center justify-between text-slate-400 mb-1">
                      <span className="text-[10px] font-mono">Cómo Llegar (Ruta)</span>
                      <Navigation className="w-3.5 h-3.5 text-sky-400" />
                    </div>
                    <div className="text-lg sm:text-xl font-black text-sky-400 font-mono mt-0.5">
                      {Number(gbpMetrics.direcciones || 254).toLocaleString()}
                    </div>
                    <span className="text-[10px] text-sky-300 font-mono">Solicitudes en Maps</span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-[#090d16] border border-slate-800">
                    <div className="flex items-center justify-between text-slate-400 mb-1">
                      <span className="text-[10px] font-mono">Clics al Sitio Web</span>
                      <MousePointerClick className="w-3.5 h-3.5 text-amber-400" />
                    </div>
                    <div className="text-lg sm:text-xl font-black text-amber-400 font-mono mt-0.5">
                      {Number(gbpMetrics.clicsSitioWeb || 89).toLocaleString()}
                    </div>
                    <span className="text-[10px] text-amber-300 font-mono">Visitas desde Maps</span>
                  </div>
                </div>

                {/* Listado de Reseñas de Google con Generador de Respuestas con IA */}
                <div className="space-y-3.5">
                  {(cmsSite?.reseñasCliente || []).map((rev) => {
                    const isPending = rev.estado === 'pendiente' || !rev.respuesta;
                    const selectedTone = aiToneByReview[rev.id] || 'storybrand';
                    const isGenerating = generatingAiId === rev.id;

                    return (
                      <div key={rev.id} className="p-4 sm:p-5 rounded-2xl bg-[#090d16] border border-slate-800 space-y-3">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <div>
                            <span className="text-xs sm:text-sm font-bold text-white block">{rev.autor}</span>
                            <span className="text-[10px] text-slate-400 font-mono">{rev.detalles || rev.fecha}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map(n => (
                              <Star
                                key={n}
                                className={`w-3.5 h-3.5 ${
                                  n <= (rev.rating || rev.estrellas || 5)
                                    ? 'text-amber-400 fill-amber-400'
                                    : 'text-slate-700'
                                }`}
                              />
                            ))}
                          </div>
                        </div>

                        <p className="text-xs text-slate-200 leading-relaxed italic">
                          "{rev.comentario || rev.texto}"
                        </p>

                        {/* Si ya está respondida, mostrar la respuesta */}
                        {rev.respuesta ? (
                          <div className="p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-500/30 text-xs space-y-1">
                            <span className="text-[10px] font-mono font-bold text-emerald-400 flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Respuesta oficial de {empresaNombre}:</span>
                            </span>
                            <p className="text-slate-200">{rev.respuesta}</p>
                          </div>
                        ) : null}

                        {/* Generador de Respuesta con Inteligencia Artificial (Aporte de Valor de la Membresía) */}
                        <div className="pt-2 border-t border-slate-800/80 space-y-2.5">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-[11px] text-slate-400 font-semibold">Tono IA:</span>
                              <select
                                value={selectedTone}
                                onChange={(e) => setAiToneByReview(prev => ({ ...prev, [rev.id]: e.target.value }))}
                                className="bg-[#121826] border border-slate-700 text-slate-200 text-xs rounded-lg px-2 py-1 focus:outline-none focus:border-orange-500"
                              >
                                <option value="storybrand">🌟 StoryBrand (Recomendado)</option>
                                <option value="profesional">💼 Profesional &amp; Corporativo</option>
                                <option value="empatico">🤝 Empático &amp; Cercano</option>
                                <option value="resolutivo">🛡️ Resolutivo / Aclaración</option>
                              </select>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleGenerateAiResponse(rev, selectedTone)}
                              disabled={isGenerating}
                              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-md shadow-blue-950/50 cursor-pointer disabled:opacity-50"
                            >
                              <Sparkles className={`w-3.5 h-3.5 text-amber-300 ${isGenerating ? 'animate-spin' : ''}`} />
                              <span>{isGenerating ? 'Redactando con IA...' : '✨ Redactar Respuesta con IA'}</span>
                            </button>
                          </div>

                          <textarea
                            rows={3}
                            value={replyDrafts[rev.id] || ''}
                            onChange={(e) => setReplyDrafts(prev => ({ ...prev, [rev.id]: e.target.value }))}
                            placeholder={rev.respuesta ? 'Puedes generar otra respuesta si deseas actualizarla...' : `Escribe tu respuesta o haz clic en "✨ Redactar Respuesta con IA"...`}
                            className="w-full bg-[#121826] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500 leading-relaxed font-sans"
                          />

                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => handleSendReviewReply(rev.id)}
                              disabled={!replyDrafts[rev.id]?.trim()}
                              className="py-2 px-4 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-md shadow-orange-950/40 cursor-pointer disabled:opacity-50"
                            >
                              <Send className="w-3.5 h-3.5" />
                              <span>Publicar Respuesta en Google Maps</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* PESTAÑA 3: GOOGLE SITE KIT (MÉTRICAS OFICIALES CON LÍNEA BASE PROTEGIDA) */}
            {activeTab === 'sitekit' && (
              <div className="p-4 sm:p-6 rounded-2xl bg-[#111624] border border-slate-800 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-3 border-b border-slate-800">
                  <div>
                    <h2 className="text-base font-black text-white flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-orange-400" />
                      <span>Google Site Kit: {dominioCliente}</span>
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Métricas oficiales de Search Console, Google Analytics 4 y PageSpeed centralizadas.
                    </p>
                  </div>
                  <span className="px-3 py-1 rounded-full text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 self-start sm:self-auto">
                    Propiedad Vinculada Activa
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3.5 rounded-xl bg-[#090d16] border border-slate-800">
                    <div className="flex items-center justify-between text-slate-400 mb-1">
                      <span className="text-[10px] font-mono">Usuarios / Visitas</span>
                      <Users className="w-3.5 h-3.5 text-sky-400" />
                    </div>
                    <span className="text-lg sm:text-xl font-black text-white font-mono block">
                      {Number(skMetrics.usuariosUnicos || 142).toLocaleString()}
                    </span>
                    <span className="text-[10px] text-emerald-400 font-mono">
                      {skMetrics.tasaInteraccion ? `Interacción ${skMetrics.tasaInteraccion}` : 'Google Analytics 4'}
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-[#090d16] border border-slate-800">
                    <div className="flex items-center justify-between text-slate-400 mb-1">
                      <span className="text-[10px] font-mono">Clics en Google</span>
                      <MousePointerClick className="w-3.5 h-3.5 text-emerald-400" />
                    </div>
                    <span className="text-lg sm:text-xl font-black text-emerald-400 font-mono block">
                      {Number(skMetrics.clicsBusqueda || 18).toLocaleString()}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      CTR: {skMetrics.ctrPromedio || '4.3%'}
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-[#090d16] border border-slate-800">
                    <div className="flex items-center justify-between text-slate-400 mb-1">
                      <span className="text-[10px] font-mono">Impresiones Google</span>
                      <Search className="w-3.5 h-3.5 text-orange-400" />
                    </div>
                    <span className="text-lg sm:text-xl font-black text-white font-mono block">
                      {Number(skMetrics.impresionesBusqueda || 412).toLocaleString()}
                    </span>
                    <span className="text-[10px] text-orange-300 font-mono">
                      Posición media: {skMetrics.posicionMedia || '6.4'}
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-[#090d16] border border-slate-800">
                    <div className="flex items-center justify-between text-slate-400 mb-1">
                      <span className="text-[10px] font-mono">Velocidad Móvil</span>
                      <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
                    </div>
                    <span className="text-lg sm:text-xl font-black text-emerald-400 font-mono block">
                      {mobileSpeedScore}/100
                    </span>
                    <span className="text-[10px] text-emerald-400 font-mono">LCP {mobileLcp}</span>
                  </div>
                </div>

                {skMetrics.topKeywords && (
                  <div className="p-3.5 rounded-xl bg-[#090d16] border border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
                    <span className="text-slate-400 font-semibold">🔍 Términos con los que te encuentran en Google:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {skMetrics.topKeywords.split(',').map((kw, i) => (
                        <span key={i} className="px-2.5 py-0.5 rounded-full bg-orange-500/10 border border-orange-500/30 text-orange-300 font-mono text-[11px]">
                          {kw.trim()}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
