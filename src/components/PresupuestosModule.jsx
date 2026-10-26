import React, { useState, useEffect } from 'react';
import {
  FileText,
  Plus,
  Copy,
  Printer,
  CheckCircle2,
  XCircle,
  Clock,
  Send,
  ExternalLink,
  ChevronRight,
  ArrowLeft,
  Trash2,
  DollarSign,
  Calendar,
  Building,
  User,
  Phone,
  Mail,
  Shield,
  Layers,
  Sparkles,
  Check,
  Save,
  BookmarkPlus,
  Eye,
  Sliders,
  TrendingDown,
  X,
  MessageSquare,
  Package
} from 'lucide-react';
import {
  getStoredCrmLeads,
  saveStoredCrmLeads
} from '../services/localStore';
import {
  getPresupuestosCloud,
  savePresupuestoCloud,
  deletePresupuestoCloud,
  subscribePresupuestosCloud,
  savePortalCloud
} from '../services/firestoreSyncService';
import { DEFAULT_AGENCY_BRANDING, getAgencyContactForCountry } from '../constants/defaultAgencyBranding';
import { DEFAULT_SERVICES } from './AgencyWhiteLabelSettingsModal';

const DEFAULT_VIP_TEMPLATE = {
  titulo: "PROPUESTA DE DESARROLLO DIGITAL VIP",
  subtitulo: "(SISTEMA INTEGRAL WEB, PLAN GOOGLE ADS, REPUTACIÓN LOCAL & CÓDIGOS QR)",
  vigenciaDias: 15,
  moneda: "USD",
  simboloMoneda: "$",
  pais: "SV",
  emisor: {
    empresa: "Goglite",
    ubicacion: "Santa Ana, El Salvador · Santo Domingo, RD",
    telefono: "(503) 7756-9828",
    email: "info@goglite.com",
    responsable: "Víctor Matos",
    cargo: "Director & Estratega Digital"
  },
  portada: {
    proyecto: "Implementación de un Sistema Digital Integral de Captación Inmediata y Posicionamiento Comercial, transformando su presencia digital en un activo que genera clientes y contactos de alta intención las 24 horas del día.",
    enfoqueEstrategico: "Arquitectura orientada a la conversión directa con botones de llamada instantánea (Click-to-Call), botón flotante de WhatsApp Business y embudo de respuesta inmediata.",
    tecnologiaMobileFirst: "Arquitectura ultra-rápida optimizada al 100% para teléfonos inteligentes (velocidad de carga inferior a 1.2 segundos y Core Web Vitals en verde).",
    geoSeoLocal: "Estructura semántica avanzada (Schema.org LocalBusiness) para asegurar máxima visibilidad en Google Maps, buscadores y motores de IA (ChatGPT / Perplexity)."
  },
  modulos: [
    {
      id: "mod-1",
      numero: "MÓDULO 1",
      titulo: "Plataforma Web Corporativa de Alta Conversión (Mobile-First)",
      descripcion: "Arquitectura responsive optimizada al 100% para dispositivos móviles. Incluye secciones estratégicas StoryBrand, catálogo de servicios, cobertura y llamado a la acción.",
      tipo: "precio_cerrado",
      horas: 10,
      precio: 150
    },
    {
      id: "mod-2",
      numero: "MÓDULO 2",
      titulo: "Canales de Cierre y Contacto Directo (WhatsApp & Click-to-Call)",
      descripcion: "Integración de botón flotante inteligente de WhatsApp Business con mensaje preconfigurado y marcado directo de un solo toque.",
      tipo: "precio_cerrado",
      horas: 3,
      precio: 50
    },
    {
      id: "mod-3",
      numero: "MÓDULO 3",
      titulo: "Optimización del Perfil de Google Negocio & SEO/GEO Local",
      descripcion: "Configuración técnica de Schema.org JSON-LD, categorización en Google Maps y ecosistema de códigos QR para captación de reseñas 5 estrellas.",
      tipo: "precio_cerrado",
      horas: 5,
      precio: 50
    }
  ],
  fases: [
    {
      fase: "Fase 1",
      plazo: "Días 1 a 4",
      detalle: "Configuración de activos digitales, arquitectura de información StoryBrand, ficha de Google Maps y códigos QR vectoriales."
    },
    {
      fase: "Fase 2",
      plazo: "Días 5 a 10",
      detalle: "Desarrollo de la plataforma web Mobile-First, integración de canales de cierre en WhatsApp y optimización SEO/GEO."
    },
    {
      fase: "Fase 3",
      plazo: "Días 11 a 15",
      detalle: "Auditoría de velocidad móvil, revisión conjunta con el cliente, ajustes finales y despliegue en producción."
    }
  ],
  inversion: {
    precioMercadoReferencial: 750,
    precioTotal: 250,
    descuentoEspecial: 500,
    anticipo: 125,
    contraEntrega: 125,
    beneficioExclusivo: "1 mes de soporte técnico, supervisión y acompañamiento gratuito tras el lanzamiento oficial.",
    revisiones: "Dos (2) rondas completas de ajustes de diseño y contenido.",
    requisitosInicio: "Logotipo, fotografías del negocio/servicios, número oficial de WhatsApp y datos de contacto."
  }
};

export default function PresupuestosModule({
  selectedCountry = 'SV',
  leadToConvert,
  onClearLeadConvert,
  onNavigateToContratos,
  onNavigateToRentabilidad
}) {
  const [presupuestos, setPresupuestos] = useState([]);
  const [plantillas, setPlantillas] = useState([]);
  const [loading, setLoading] = useState(true);

  // Mode: 'list' | 'editor' | 'preview_client'
  const [viewMode, setViewMode] = useState('list');
  const [activePresupuesto, setActivePresupuesto] = useState(null);
  const [editorTab, setEditorTab] = useState('portada'); // 'portada' | 'modulos' | 'fases' | 'inversion'

  const [filterStatus, setFilterStatus] = useState('todos');
  const [copiedLink, setCopiedLink] = useState(false);
  const [savedNotification, setSavedNotification] = useState(false);
  const [showSavedModal, setShowSavedModal] = useState(false);
  const [savedPortalUrl, setSavedPortalUrl] = useState('');
  const [savedClientPhone, setSavedClientPhone] = useState('');

  // Servicios Oficiales del Catálogo de la Agencia
  const [catalogServices, setCatalogServices] = useState(DEFAULT_SERVICES || []);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('goglite_agency_settings');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed.serviciosOficiales) && parsed.serviciosOficiales.length > 0) {
          setCatalogServices(parsed.serviciosOficiales);
        }
      }
    } catch {}

    // Sincronizar también con la API de ajustes en la nube para tener el catálogo más reciente
    fetch('/api/agency/settings')
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (Array.isArray(data?.serviciosOficiales) && data.serviciosOficiales.length > 0) {
          setCatalogServices(data.serviciosOficiales);
        }
      })
      .catch(() => {});

    const handleSettingsUpdated = (e) => {
      if (e.detail?.serviciosOficiales) {
        setCatalogServices(e.detail.serviciosOficiales);
      }
    };
    window.addEventListener('goglite_agency_settings_updated', handleSettingsUpdated);
    return () => window.removeEventListener('goglite_agency_settings_updated', handleSettingsUpdated);
  }, []);

  const currentActivePais = (activePresupuesto?.pais || selectedCountry || 'SV').toUpperCase();
  const sedeAgencyContact = getAgencyContactForCountry(currentActivePais, agencySettings);
  const displayEmisor = {
    ...sedeAgencyContact,
    ...(activePresupuesto?.emisor || {})
  };
  if (currentActivePais === 'DO') {
    displayEmisor.telefono = sedeAgencyContact.telefono;
    displayEmisor.telefonoWhatsapp = sedeAgencyContact.telefonoWhatsapp;
    displayEmisor.ubicacion = sedeAgencyContact.ubicacion;
  }

  const handleApplyCatalogService = (serviceId) => {
    if (!serviceId) return;
    const selected = catalogServices.find(s => s.id === serviceId);
    if (!selected || !activePresupuesto) return;

    if (!confirm(`¿Deseas aplicar el servicio "${selected.nombre}"? Esto actualizará el título, entregables y precio ($${selected.precioUSD} USD) de esta propuesta.`)) {
      return;
    }

    const precioTotal = Number(selected.precioUSD) || 0;
    const anticipo = Math.round(precioTotal * (selected.anticipoPorcentaje || 50) / 100);
    const contraEntrega = precioTotal - anticipo;

    const newModulos = (selected.entregables || []).map((ent, idx) => ({
      id: `mod-${idx + 1}`,
      fase: idx + 1,
      titulo: ent,
      descripcion: `Implementación y configuración profesional de ${ent.toLowerCase()} cumpliendo con los estándares de calidad de Goglite.`,
      entregables: [ent],
      activo: true
    }));

    setActivePresupuesto(prev => ({
      ...prev,
      titulo: selected.nombre.toUpperCase(),
      subtitulo: selected.descripcion ? `(${selected.descripcion.toUpperCase()})` : prev.subtitulo,
      inversion: {
        ...prev.inversion,
        precioTotal,
        anticipo,
        contraEntrega,
        precioMercadoReferencial: Math.round(precioTotal * 1.6)
      },
      modulos: newModulos.length > 0 ? newModulos : prev.modulos
    }));
  };

  const CLOUD_API_URL = import.meta.env.VITE_API_URL || 'https://goglite-agency.vercel.app';
  const getBackendEndpoint = (endpoint) => {
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    if (typeof window !== 'undefined') {
      if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        return `http://localhost:3001${cleanEndpoint}`;
      }
    }
    return `${CLOUD_API_URL}${cleanEndpoint}`;
  };

  // Deduplica presupuestos, limpia registros fantasma sin código y conserva el estado más avanzado de la propuesta única
  const STATUS_PRIORITY = { borrador: 1, enviado: 2, sin_abrir: 2, visto: 3, aceptado: 4, rechazado: 4 };

  const deduplicatePresupuestos = (list) => {
    if (!Array.isArray(list)) return [];

    // Detectar si un enlace previo sin ID ('/portal/undefined') registró apertura ('visto') para transferirlo a la propuesta real
    const hadPhantomOpen = list.some(
      p => (!p.id && !p.codigo) && (p.estado === 'visto' || p.estado === 'aceptado')
    );

    const validList = list.filter(
      p => p && (p.id || p.codigo) && !(p.cliente?.empresa === 'Empresa' && !p.codigo)
    );

    const seen = new Map();
    for (const p of validList) {
      const empKey = (p.cliente?.empresa || '').toLowerCase().trim();
      const key = empKey || p.codigo || p.id;
      const rawEstado = (!p.estado || p.estado === 'borrador') ? 'sin_abrir' : p.estado;
      const effectiveEstado = (hadPhantomOpen && validList.length === 1 && rawEstado === 'sin_abrir')
        ? 'visto'
        : rawEstado;

      if (!seen.has(key)) {
        seen.set(key, { ...p, estado: effectiveEstado });
      } else {
        const existing = seen.get(key);
        const existingPrio = STATUS_PRIORITY[existing.estado] || 1;
        const newPrio = STATUS_PRIORITY[effectiveEstado] || 1;
        seen.set(key, {
          ...existing,
          ...p,
          id: existing.id || p.id,
          codigo: existing.codigo || p.codigo,
          estado: newPrio >= existingPrio ? effectiveEstado : existing.estado,
          abiertoEn: p.abiertoEn || existing.abiertoEn
        });
      }
    }
    return Array.from(seen.values());
  };

  // Sincronización dinámica en tiempo real con localStorage y Portal del Cliente
  const syncPresupuestosFromStorage = () => {
    try {
      if (typeof window !== 'undefined') {
        const cached = localStorage.getItem('goglite_presupuestos');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) {
            const clean = deduplicatePresupuestos(parsed);
            if (JSON.stringify(clean) !== JSON.stringify(parsed)) {
              localStorage.setItem('goglite_presupuestos', JSON.stringify(clean));
            }
            setPresupuestos(clean);
            setActivePresupuesto(prev => {
              if (!prev) return prev;
              const matched = clean.find(p =>
                (prev.id && p.id === prev.id) ||
                (prev.codigo && p.codigo === prev.codigo) ||
                (prev.portalToken && p.portalToken === prev.portalToken) ||
                (prev.cliente?.empresa && p.cliente?.empresa && p.cliente.empresa.toLowerCase().trim() === prev.cliente.empresa.toLowerCase().trim())
              );
              if (matched && (matched.estado !== prev.estado || matched.abiertoEn !== prev.abiertoEn)) {
                return { ...prev, estado: matched.estado, abiertoEn: matched.abiertoEn, vecesAbierto: matched.vecesAbierto };
              }
              return prev;
            });
          }
        }
      }
    } catch (e) {}
  };

  useEffect(() => {
    syncPresupuestosFromStorage();
    fetchPresupuestos();
    fetchPlantillas();

    // Suscripción en tiempo real a Firestore Cloud
    const unsubscribeCloud = subscribePresupuestosCloud((cloudProps) => {
      if (Array.isArray(cloudProps) && cloudProps.length > 0) {
        setPresupuestos(prev => {
          const merged = deduplicatePresupuestos([...prev, ...cloudProps]);
          if (typeof window !== 'undefined') {
            localStorage.setItem('goglite_presupuestos', JSON.stringify(merged));
          }
          return merged;
        });
      }
    });

    const handleRealtimeUpdate = () => {
      syncPresupuestosFromStorage();
      fetchPresupuestos();
    };

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        handleRealtimeUpdate();
      }
    };

    window.addEventListener('storage', handleRealtimeUpdate);
    window.addEventListener('focus', handleRealtimeUpdate);
    window.addEventListener('goglite_presupuestos_updated', handleRealtimeUpdate);
    document.addEventListener('visibilitychange', handleVisibility);

    // Polling ligero para detectar aperturas del enlace por parte del cliente en tiempo real
    const pollInterval = setInterval(() => {
      syncPresupuestosFromStorage();
    }, 2500);

    return () => {
      unsubscribeCloud();
      window.removeEventListener('storage', handleRealtimeUpdate);
      window.removeEventListener('focus', handleRealtimeUpdate);
      window.removeEventListener('goglite_presupuestos_updated', handleRealtimeUpdate);
      document.removeEventListener('visibilitychange', handleVisibility);
      clearInterval(pollInterval);
    };
  }, []);

  // Recibir prospecto desde el Módulo 2 (CRM & WhatsApp) o Módulo 1
  useEffect(() => {
    if (leadToConvert) {
      const targetEmpresa = (leadToConvert.nombreEmpresa || leadToConvert.empresa || '').toLowerCase().trim();
      const targetTelefono = (leadToConvert.telefono || '').replace(/\D/g, '');

      // Verificar en la lista actual de presupuestos si este cliente ya tiene propuesta
      let currentList = presupuestos;
      if (typeof window !== 'undefined') {
        try {
          const raw = localStorage.getItem('goglite_presupuestos');
          if (raw) currentList = JSON.parse(raw);
        } catch (e) {}
      }

      const existingProp = currentList.find(p => {
        const pEmpresa = (p.cliente?.empresa || '').toLowerCase().trim();
        const pTelefono = (p.cliente?.telefono || '').replace(/\D/g, '');
        return (targetEmpresa && pEmpresa && (targetEmpresa === pEmpresa || targetEmpresa.includes(pEmpresa) || pEmpresa.includes(targetEmpresa))) ||
               (targetTelefono && pTelefono && (targetTelefono === pTelefono || targetTelefono.endsWith(pTelefono) || pTelefono.endsWith(targetTelefono))) ||
               (leadToConvert.presupuestoId && p.id === leadToConvert.presupuestoId) ||
               (leadToConvert.id && p.leadId === leadToConvert.id);
      });

      if (existingProp) {
        // Cargar propuesta existente para editarla (sin crear duplicados)
        setActivePresupuesto(existingProp);
        setViewMode('editor');
        if (onClearLeadConvert) onClearLeadConvert();
        return;
      }

      // Si no existe, crear la primera propuesta
      const base = plantillas[0]?.datos || DEFAULT_VIP_TEMPLATE;
      const clientPais = ((leadToConvert.pais || selectedCountry || 'SV')).toUpperCase();
      const resolvedEmisor = getAgencyContactForCountry(clientPais, agencySettings);
      const precioAcordado = Number(leadToConvert.valorEstimado) > 0 ? Number(leadToConvert.valorEstimado) : (base.inversion?.precioTotal || 250);
      const anticipoMitad = Math.round(precioAcordado * 0.5);
      const nextNum = currentList.length + 1;
      const convertedProp = {
        ...JSON.parse(JSON.stringify(base)),
        id: 'prop-' + Date.now(),
        leadId: leadToConvert.id || null,
        codigo: `P-2026-${String(nextNum).padStart(3, '0')}`,
        fecha: new Date().toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }),
        estado: 'borrador',
        pais: clientPais,
        emisor: {
          ...(base.emisor || {}),
          ...resolvedEmisor
        },
        cliente: {
          nombre: leadToConvert.responsable || 'Director / Propietario',
          empresa: leadToConvert.nombreEmpresa || leadToConvert.empresa || 'Empresa Cliente',
          telefono: leadToConvert.telefono || (clientPais === 'DO' ? '+1 809 ' : '+503 '),
          email: leadToConvert.email || '',
          actividad: leadToConvert.dominio ? `Presencia Digital (${leadToConvert.dominio})` : 'Servicios Comerciales',
          ubicacion: clientPais === 'DO' ? 'Santo Domingo, República Dominicana' : 'San Salvador, El Salvador'
        },
        inversion: {
          ...(base.inversion || DEFAULT_VIP_TEMPLATE.inversion),
          precioMercadoReferencial: Math.max(750, Math.round(precioAcordado * 2)),
          precioTotal: precioAcordado,
          descuentoEspecial: Math.max(0, Math.round(precioAcordado * 2) - precioAcordado),
          anticipo: anticipoMitad,
          contraEntrega: precioAcordado - anticipoMitad
        }
      };
      setActivePresupuesto(convertedProp);
      setViewMode('editor');
      if (onClearLeadConvert) onClearLeadConvert();
    }
  }, [leadToConvert]);

  const fetchPresupuestos = async () => {
    try {
      // 1. Obtener cotizaciones de Firestore Cloud (Fuente de verdad)
      const cloudProps = await getPresupuestosCloud();

      // 2. Intentar backend API si existe
      let apiData = null;
      try {
        let res;
        try {
          res = await fetch(getBackendEndpoint('/api/presupuestos'));
        } catch {
          res = await fetch('/api/presupuestos');
        }
        if (res && res.ok) {
          apiData = await res.json();
        }
      } catch (errApi) {
        // Backend offline
      }

      // 3. Local storage caché
      const local = [];
      try {
        const cached = localStorage.getItem('goglite_presupuestos');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed)) local.push(...parsed);
        }
      } catch (e) {}

      const combined = [
        ...local,
        ...(Array.isArray(apiData) ? apiData : []),
        ...(Array.isArray(cloudProps) ? cloudProps : [])
      ];

      if (combined.length > 0) {
        const clean = deduplicatePresupuestos(combined);
        setPresupuestos(clean);
        if (typeof window !== 'undefined') {
          localStorage.setItem('goglite_presupuestos', JSON.stringify(clean));
        }
        // Asegurar que las propuestas locales estén respaldadas en Firestore Cloud
        const cloudIds = new Set((cloudProps || []).map(cp => cp?.id));
        clean.forEach(p => {
          if (p?.id && !cloudIds.has(p.id)) {
            savePresupuestoCloud(p).catch(() => {});
          }
        });
      }
    } catch (err) {
      console.warn('Error al sincronizar presupuestos:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPlantillas = async () => {
    try {
      let res;
      try {
        res = await fetch(getBackendEndpoint('/api/presupuestos/plantillas'));
      } catch {
        res = await fetch('/api/presupuestos/plantillas');
      }
      if (res && res.ok) {
        const data = await res.json();
        setPlantillas(data);
      }
    } catch (err) {
      console.warn('API plantillas offline:', err);
    }
  };

  // Create new proposal from template
  const handleCreateNew = (templateData = null) => {
    const base = templateData || plantillas[0]?.datos || DEFAULT_VIP_TEMPLATE;
    const nextNum = presupuestos.length + 1;
    const activePais = ((templateData?.pais || selectedCountry || 'SV')).toUpperCase();
    const resolvedEmisor = getAgencyContactForCountry(activePais, agencySettings);
    const newProp = {
      ...JSON.parse(JSON.stringify(base)),
      id: 'prop-' + Date.now(),
      codigo: `P-2026-${String(nextNum).padStart(3, '0')}`,
      fecha: new Date().toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }),
      estado: 'borrador',
      pais: activePais,
      emisor: {
        ...(base.emisor || {}),
        ...resolvedEmisor
      },
      cliente: {
        nombre: 'Nuevo Cliente',
        empresa: 'Empresa / Negocio',
        telefono: activePais === 'DO' ? '+1 809 ' : '+503 ',
        email: '',
        actividad: 'Servicios Comerciales',
        ubicacion: activePais === 'DO' ? 'Santo Domingo, República Dominicana' : 'San Salvador, El Salvador'
      }
    };
    setActivePresupuesto(newProp);
    setViewMode('editor');
  };

  // Save current proposal
  const handleSavePresupuesto = async () => {
    if (!activePresupuesto) return;
    try {
      const targetEmpresa = (activePresupuesto.cliente?.empresa || '').toLowerCase().trim();
      const targetTelefono = (activePresupuesto.cliente?.telefono || '').replace(/\D/g, '');

      // 1. Identificar si ya existe por ID, por Código o por Cliente
      let existingIdx = presupuestos.findIndex(p => p.id === activePresupuesto.id);
      if (existingIdx === -1) {
        existingIdx = presupuestos.findIndex(p => 
          (p.codigo && activePresupuesto.codigo && p.codigo === activePresupuesto.codigo) ||
          (targetEmpresa && p.cliente?.empresa && p.cliente.empresa.toLowerCase().trim() === targetEmpresa) ||
          (targetTelefono && p.cliente?.telefono && p.cliente.telefono.replace(/\D/g, '') === targetTelefono) ||
          (activePresupuesto.leadId && p.leadId && p.leadId === activePresupuesto.leadId)
        );
      }

      const exists = existingIdx !== -1;
      const targetId = exists ? (presupuestos[existingIdx].id || activePresupuesto.id) : (activePresupuesto.id || ('prop-' + Date.now()));
      const targetCodigo = exists ? (presupuestos[existingIdx].codigo || activePresupuesto.codigo) : (activePresupuesto.codigo || `P-2026-${String(presupuestos.length + 1).padStart(3, '0')}`);

      // Buscar el lead asociado en CRM para asociar portalToken y leadId
      let targetPortalToken = activePresupuesto.portalToken || (exists ? presupuestos[existingIdx].portalToken : null);
      let targetLeadId = activePresupuesto.leadId || (exists ? presupuestos[existingIdx].leadId : null);
      try {
        const crmLeads = getStoredCrmLeads();
        const matched = crmLeads.find(cl =>
          (targetLeadId && cl.id === targetLeadId) ||
          (targetEmpresa && cl.empresa && cl.empresa.toLowerCase().trim() === targetEmpresa) ||
          (targetTelefono && cl.telefono && cl.telefono.replace(/\D/g, '') === targetTelefono)
        );
        if (matched) {
          if (!targetLeadId) targetLeadId = matched.id;
          if (!targetPortalToken && matched.portalToken) targetPortalToken = matched.portalToken;
        }
      } catch (e) {}
      if (!targetPortalToken) targetPortalToken = `portal-${targetId}`;

      // Al presionar Guardar, si el estado era 'borrador', cambia automáticamente a 'sin_abrir'
      // porque ya se generó el enlace público listo para que el cliente lo abra
      const currentStatus = activePresupuesto.estado || (exists ? presupuestos[existingIdx].estado : 'borrador');
      const nextEstado = (!currentStatus || currentStatus === 'borrador') ? 'sin_abrir' : currentStatus;

      const propToSave = {
        ...activePresupuesto,
        id: targetId,
        codigo: targetCodigo,
        leadId: targetLeadId,
        portalToken: targetPortalToken,
        estado: nextEstado,
        guardadoEn: new Date().toISOString()
      };

      setActivePresupuesto(propToSave);

      const url = exists ? getBackendEndpoint(`/api/presupuestos/${targetId}`) : getBackendEndpoint('/api/presupuestos');
      const method = exists ? 'PATCH' : 'POST';

      // 1. Persistir de inmediato en el estado local y en localStorage deduplicando
      setPresupuestos(prev => {
        let updated;
        if (exists) {
          updated = prev.map((p, idx) => idx === existingIdx ? propToSave : p);
        } else {
          updated = [propToSave, ...prev];
        }
        updated = deduplicatePresupuestos(updated);
        if (typeof window !== 'undefined') {
          localStorage.setItem('goglite_presupuestos', JSON.stringify(updated));
        }
        return updated;
      });

      // 2. Persistir en Firestore Cloud (Multiplataforma PC / Móvil)
      savePresupuestoCloud(propToSave).catch(e => console.warn('[Presupuestos] Error guardando en nube:', e));
      if (propToSave.portalToken) {
        savePortalCloud(propToSave.portalToken, {
          token: propToSave.portalToken,
          presupuesto: propToSave,
          lead: propToSave.cliente ? {
            id: propToSave.leadId || propToSave.id,
            empresa: propToSave.cliente.empresa,
            contacto: propToSave.cliente.nombre,
            telefono: propToSave.cliente.telefono,
            email: propToSave.cliente.email,
            pais: propToSave.pais || 'SV',
            portalToken: propToSave.portalToken
          } : null
        }).catch(() => {});
      }

      // 3. Intentar sincronizar con el backend local si está presente
      try {
        await fetch(url, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(propToSave)
        });
      } catch (e) {
        console.warn('Backend sync error (usando local):', e);
      }

      // 3. Sincronizar automáticamente con CRM Leads
      if (typeof window !== 'undefined') {
        try {
          const crmLeads = getStoredCrmLeads();
          const targetName = (propToSave.cliente?.empresa || '').toLowerCase().trim();
          const targetPhone = (propToSave.cliente?.telefono || '').replace(/\D/g, '');
          const nuevoMonto = Number(propToSave.inversion?.precioTotal) || 0;

          let updatedCrmFlag = false;
          const updatedCrm = crmLeads.map(cl => {
            const clName = (cl.empresa || '').toLowerCase().trim();
            const clPhone = (cl.telefono || '').replace(/\D/g, '');
            const isMatch = (targetName && (clName === targetName || clName.includes(targetName) || targetName.includes(clName))) ||
                            (targetPhone && clPhone && (targetPhone === clPhone || clPhone.endsWith(targetPhone) || targetPhone.endsWith(clPhone))) ||
                            (propToSave.leadId && cl.id === propToSave.leadId) ||
                            (propToSave.cliente?.id && cl.id === propToSave.cliente.id);

            if (isMatch) {
              updatedCrmFlag = true;
              return {
                ...cl,
                presupuestoId: propToSave.id,
                presupuestoCodigo: propToSave.codigo || 'P-2026',
                presupuestoMonto: nuevoMonto,
                valorEstimado: nuevoMonto,
                presupuestoEstado: propToSave.estado || 'sin_abrir',
                etapa: (cl.etapa === 'nuevo' || cl.etapa === 'contactado') ? 'propuesta_enviada' : cl.etapa
              };
            }
            return cl;
          });

          if (updatedCrmFlag) {
            saveStoredCrmLeads(updatedCrm);
          }
        } catch (crmSyncErr) {
          console.warn('[Presupuestos] Error sincronizando con CRM:', crmSyncErr);
        }
      }

      // 4. Generar URL pública y abrir modal interactivo para compartir
      const publicUrl = getPublicProposalUrl(propToSave);
      setSavedPortalUrl(publicUrl);
      setSavedClientPhone(propToSave.cliente?.telefono || '');
      setShowSavedModal(true);

      setSavedNotification(true);
      setTimeout(() => setSavedNotification(false), 2500);
    } catch (err) {
      alert('Error al guardar: ' + err.message);
    }
  };

  // Delete proposal
  const handleDeletePresupuesto = async (id, e) => {
    e?.stopPropagation();
    if (!confirm('¿Eliminar esta propuesta?')) return;
    try {
      deletePresupuestoCloud(id).catch(e => console.warn('[Presupuestos] Error eliminando de nube:', e));
      try {
        await fetch(getBackendEndpoint(`/api/presupuestos/${id}`), { method: 'DELETE' });
      } catch (err) {
        console.warn('Delete backend error, removiendo localmente:', err);
      }
      setPresupuestos(prev => {
        const updated = prev.filter(p => p.id !== id);
        if (typeof window !== 'undefined') {
          localStorage.setItem('goglite_presupuestos', JSON.stringify(updated));
        }
        return updated;
      });
      fetchPresupuestos();
      if (activePresupuesto?.id === id) {
        setViewMode('list');
        setActivePresupuesto(null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Update field in active proposal
  const updatePropField = (path, value) => {
    setActivePresupuesto(prev => {
      const copy = JSON.parse(JSON.stringify(prev));
      const keys = path.split('.');
      let current = copy;
      for (let i = 0; i < keys.length - 1; i++) {
        current = current[keys[i]];
      }
      current[keys[keys.length - 1]] = value;
      return copy;
    });
  };

  // Module item helper
  const updateModulo = (index, field, value) => {
    setActivePresupuesto(prev => {
      const copy = { ...prev };
      copy.modulos = [...copy.modulos];
      copy.modulos[index] = { ...copy.modulos[index], [field]: value };
      return copy;
    });
  };

  const handlePropCountryChange = (newCountry) => {
    const activeCountry = (newCountry || 'SV').toUpperCase();
    const resolvedContact = getAgencyContactForCountry(activeCountry, agencySettings);
    setActivePresupuesto(prev => {
      if (!prev) return prev;
      const copy = JSON.parse(JSON.stringify(prev));
      copy.pais = activeCountry;
      copy.emisor = {
        ...(copy.emisor || {}),
        ...resolvedContact
      };
      if (!copy.cliente?.ubicacion || copy.cliente.ubicacion.includes('Salvador') || copy.cliente.ubicacion.includes('Dominicana') || copy.cliente.ubicacion.includes('Santo Domingo')) {
        copy.cliente = {
          ...(copy.cliente || {}),
          ubicacion: activeCountry === 'DO' ? 'Santo Domingo, República Dominicana' : 'San Salvador, El Salvador'
        };
      }
      return copy;
    });
  };

  const addModulo = () => {
    setActivePresupuesto(prev => ({
      ...prev,
      modulos: [
        ...prev.modulos,
        {
          id: 'mod-' + Date.now(),
          numero: `MÓDULO ${prev.modulos.length + 1}`,
          titulo: 'Nuevo Módulo / Entregable',
          descripcion: 'Descripción del alcance y especificaciones del entregable.',
          tipo: 'precio_cerrado',
          horas: 6,
          precio: 50
        }
      ]
    }));
  };

  const removeModulo = (index) => {
    setActivePresupuesto(prev => ({
      ...prev,
      modulos: prev.modulos.filter((_, i) => i !== index)
    }));
  };

  // Phase item helper
  const updateFase = (index, field, value) => {
    setActivePresupuesto(prev => {
      const copy = { ...prev };
      copy.fases = [...copy.fases];
      copy.fases[index] = { ...copy.fases[index], [field]: value };
      return copy;
    });
  };

  // Helper para obtener el enlace público del portal interactivo
  const getPublicProposalUrl = (prop = null) => {
    const isValidProp = prop && typeof prop === 'object' && !prop.nativeEvent && !prop.target && (prop.id || prop.codigo || prop.cliente);
    const target = isValidProp ? prop : activePresupuesto;
    if (!target) return '';

    let portalToken = target.portalToken || target.codigo || target.id;
    let matchedLead = null;
    try {
      const crmLeads = getStoredCrmLeads();
      const targetEmpresa = (target.cliente?.empresa || '').toLowerCase().trim();
      const targetTelefono = (target.cliente?.telefono || '').replace(/\D/g, '');
      matchedLead = crmLeads.find(cl => 
        (target.leadId && cl.id === target.leadId) ||
        (targetEmpresa && cl.empresa && cl.empresa.toLowerCase().trim() === targetEmpresa) ||
        (targetTelefono && cl.telefono && cl.telefono.replace(/\D/g, '') === targetTelefono)
      );
      if (matchedLead && matchedLead.portalToken) {
        portalToken = matchedLead.portalToken;
      }
    } catch (e) {}

    // Payload autosuficiente para garantizar que la vista de cliente siempre coincida
    // al 100% en cualquier dispositivo, móvil o WhatsApp sin depender de bases de datos locales
    let payloadQuery = '';
    try {
      const compactPayload = {
        id: target.id,
        leadId: target.leadId || matchedLead?.id || null,
        portalToken: portalToken,
        codigo: target.codigo,
        fecha: target.fecha,
        pais: target.pais || matchedLead?.pais || 'SV',
        cliente: target.cliente || {
          nombre: matchedLead?.contacto || 'Cliente VIP',
          empresa: matchedLead?.empresa || 'Empresa',
          telefono: matchedLead?.telefono || '',
          email: matchedLead?.email || ''
        },
        emisor: target.emisor,
        titulo: target.titulo,
        subtitulo: target.subtitulo,
        portada: target.portada,
        inversion: target.inversion,
        modulos: target.modulos || [],
        fases: target.fases || [],
        vigenciaDias: target.vigenciaDias || 15,
        estado: (!target.estado || target.estado === 'borrador') ? 'sin_abrir' : target.estado
      };

      // Si existe un proyecto formal asociado, adjuntar su estado sincronizado
      try {
        const rawProjs = localStorage.getItem('goglite_proyectos');
        if (rawProjs) {
          const projs = JSON.parse(rawProjs);
          const matchedProj = projs.find(p => 
            p.presupuestoId === target.id || 
            p.presupuestoCodigo === target.codigo ||
            (target.cliente?.empresa && p.cliente?.empresa && p.cliente.empresa.toLowerCase().trim() === target.cliente.empresa.toLowerCase().trim())
          );
          if (matchedProj) {
            compactPayload.proyecto = {
              id: matchedProj.id,
              faseActual: matchedProj.faseActual || (matchedProj.pagos?.saldoEstado === 'confirmado' ? 5 : (matchedProj.onboarding?.insumosValidados100 ? 4 : 1)),
              portalConfig: matchedProj.portalConfig || {},
              pagos: matchedProj.pagos || {},
              onboarding: matchedProj.onboarding || {},
              contrato: matchedProj.contrato || {},
              estado: matchedProj.estado || 'activo'
            };
          }
        }
      } catch (e) {}

      const jsonStr = JSON.stringify(compactPayload);
      const encoded = btoa(encodeURIComponent(jsonStr).replace(/%([0-9A-F]{2})/g, (m, p) => String.fromCharCode('0x' + p)));
      payloadQuery = `?d=${encodeURIComponent(encoded)}`;
    } catch (encErr) {
      console.warn('Error encoding proposal payload:', encErr);
    }

    return `${window.location.origin}/portal/${portalToken}${payloadQuery}`;
  };

  // Copy link
  const handleCopyLink = (prop = null) => {
    const isValidProp = prop && typeof prop === 'object' && !prop.nativeEvent && !prop.target && (prop.id || prop.codigo || prop.cliente);
    const targetProp = isValidProp ? prop : activePresupuesto;
    const url = getPublicProposalUrl(targetProp);
    if (!url) return;
    navigator.clipboard.writeText(url);
    const targetId = targetProp?.id || true;
    setCopiedLink(targetId);
    setTimeout(() => setCopiedLink(false), 2500);
    return url;
  };

  // Trigger print
  const handlePrint = () => {
    window.print();
  };

  // Filtered proposals
  const filteredList = presupuestos.filter(p => {
    if (filterStatus === 'todos') return true;
    if (filterStatus === 'sin_abrir') return p.estado === 'sin_abrir' || p.estado === 'enviado';
    return p.estado === filterStatus;
  });

  // Calculate metrics
  const totalCotizado = presupuestos.reduce((acc, p) => acc + (p.inversion?.precioTotal || 0), 0);
  const totalAceptadas = presupuestos.filter(p => p.estado === 'aceptado').length;

  return (
    <div className="space-y-6">
      
      {/* VIEW 1: LISTADO DE PRESUPUESTOS */}
      {viewMode === 'list' && (
        <div className="space-y-5">
          {/* Action Button Above the 4th Card */}
          <div className="flex justify-end">
            <button
              onClick={() => handleCreateNew()}
              className="px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-glow-sm transition-all shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Crear Propuesta</span>
            </button>
          </div>

          {/* Top Bar with KPI Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-[#0e131d] border border-slate-800">
              <div className="text-[11px] font-mono uppercase text-slate-400 font-semibold mb-1">Propuestas Creadas</div>
              <div className="text-2xl font-extrabold text-slate-100">{presupuestos.length}</div>
            </div>

            <div className="p-4 rounded-xl bg-[#0e131d] border border-slate-800">
              <div className="text-[11px] font-mono uppercase text-slate-400 font-semibold mb-1">Volumen Total Cotizado</div>
              <div className="text-2xl font-extrabold text-orange-400">
                ${totalCotizado.toLocaleString()} <span className="text-xs text-slate-500 font-mono">USD</span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[#0e131d] border border-slate-800">
              <div className="text-[11px] font-mono uppercase text-slate-400 font-semibold mb-1">Aceptadas / Cerradas</div>
              <div className="text-2xl font-extrabold text-emerald-400">{totalAceptadas}</div>
            </div>

            <div className="p-4 rounded-xl bg-[#0e131d] border border-slate-800 flex flex-col justify-center">
              <div className="text-[11px] font-mono uppercase text-slate-400 font-semibold mb-1">Plantilla Oficial</div>
              <div className="text-sm text-slate-100 font-bold truncate">Portada Goglite VIP</div>
            </div>
          </div>

          {/* Table Header & Filters */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-extrabold text-slate-100">Presupuestos Emitidos</h2>
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-mono">
                {filteredList.length}
              </span>
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
              {[
                { id: 'todos', label: 'Todos' },
                { id: 'borrador', label: 'Borrador' },
                { id: 'sin_abrir', label: 'Sin Abrir' },
                { id: 'visto', label: 'Abierto por Cliente' },
                { id: 'aceptado', label: 'Aceptado' },
                { id: 'rechazado', label: 'Rechazado' },
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => setFilterStatus(f.id)}
                  className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                    filterStatus === f.id
                      ? 'bg-slate-700 text-white'
                      : 'bg-[#101522] text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Proposals Table */}
          <div className="rounded-xl border border-slate-800 overflow-hidden bg-[#0c1017]">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#0f1422] text-slate-400 font-mono text-[11px] uppercase border-b border-slate-800">
                <tr>
                  <th className="px-4 py-3 font-semibold">Código</th>
                  <th className="px-4 py-3 font-semibold">Cliente / Proyecto</th>
                  <th className="px-4 py-3 font-semibold">Fecha & Vigencia</th>
                  <th className="px-4 py-3 font-semibold">Inversión Total</th>
                  <th className="px-4 py-3 font-semibold">Estado</th>
                  <th className="px-4 py-3 font-semibold text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredList.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-4 py-8 text-center text-slate-500">
                      No hay presupuestos registrados en este estado.
                    </td>
                  </tr>
                ) : (
                  filteredList.map(prop => (
                    <tr
                      key={prop.id}
                      onClick={() => {
                        setActivePresupuesto(prop);
                        setViewMode('editor');
                      }}
                      className="hover:bg-slate-800/30 transition-colors cursor-pointer group"
                    >
                      <td className="px-4 py-3.5 font-mono font-bold text-orange-400">
                        {prop.codigo}
                      </td>

                      <td className="px-4 py-3.5">
                        <div className="font-bold text-slate-100 group-hover:text-orange-300 transition-colors">
                          {prop.cliente?.empresa || prop.cliente?.nombre}
                        </div>
                        <div className="text-[11px] text-slate-400 truncate max-w-xs">
                          {prop.titulo}
                        </div>
                      </td>

                      <td className="px-4 py-3.5 text-slate-300">
                        <div>{prop.fecha}</div>
                        <div className="text-[10px] text-slate-500 font-mono">{prop.vigenciaDias || 15} días vigencia</div>
                      </td>

                      <td className="px-4 py-3.5 font-mono font-bold text-slate-100">
                        ${prop.inversion?.precioTotal?.toLocaleString()} {prop.moneda}
                        {prop.inversion?.descuentoEspecial > 0 && (
                          <div className="text-[10px] text-emerald-400 font-medium">
                            -${prop.inversion?.descuentoEspecial} de ahorro
                          </div>
                        )}
                      </td>

                      <td className="px-4 py-3.5">
                        <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full border inline-flex items-center gap-1.5 ${
                          prop.estado === 'aceptado' ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' :
                          prop.estado === 'visto' ? 'bg-amber-500/15 text-amber-300 border-amber-500/30' :
                          prop.estado === 'sin_abrir' || prop.estado === 'enviado' ? 'bg-sky-500/15 text-sky-400 border-sky-500/30' :
                          prop.estado === 'rechazado' ? 'bg-red-500/15 text-red-400 border-red-500/30' :
                          'bg-slate-800 text-slate-400 border-slate-700'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            prop.estado === 'aceptado' ? 'bg-emerald-400' :
                            prop.estado === 'visto' ? 'bg-amber-400 animate-pulse' :
                            prop.estado === 'sin_abrir' || prop.estado === 'enviado' ? 'bg-sky-400' :
                            prop.estado === 'rechazado' ? 'bg-red-400' :
                            'bg-slate-500'
                          }`} />
                          <span>
                            {prop.estado === 'sin_abrir' ? 'Sin abrir (Enlace enviado)' :
                             prop.estado === 'enviado' ? 'Sin abrir (Enviado)' :
                             prop.estado === 'visto' ? 'Abierto por el cliente' :
                             prop.estado === 'aceptado' ? 'Aceptado por el cliente' :
                             prop.estado === 'borrador' ? 'Borrador' : prop.estado}
                          </span>
                        </span>
                      </td>

                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5" onClick={e => e.stopPropagation()}>
                          {onNavigateToRentabilidad && (
                            <button
                              onClick={() => onNavigateToRentabilidad(prop)}
                              className="px-2 py-1 rounded bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold flex items-center gap-1 transition-colors"
                              title="Emitir Factura Proforma y Auditar Rentabilidad en Módulo 4"
                            >
                              <DollarSign className="w-3 h-3" />
                              <span>Facturar M4</span>
                            </button>
                          )}
                          <button
                            onClick={() => handleCopyLink(prop)}
                            className="p-1.5 rounded hover:bg-slate-700 text-sky-400 hover:text-sky-300 transition-colors"
                            title={copiedLink === prop.id ? "¡Enlace copiado al portapapeles!" : "Copiar enlace interactivo para el cliente"}
                          >
                            {copiedLink === prop.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                          <a
                            href={getPublicProposalUrl(prop)}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1.5 rounded hover:bg-slate-700 text-emerald-400 hover:text-emerald-300 transition-colors"
                            title="Abrir vista interactiva del cliente (Portal en vivo)"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                          <button
                            onClick={() => {
                              setActivePresupuesto(prop);
                              setViewMode('editor');
                            }}
                            className="p-1.5 rounded hover:bg-slate-700 text-slate-300 hover:text-white"
                            title="Editar en Constructor"
                          >
                            <Sliders className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={(e) => handleDeletePresupuesto(prop.id, e)}
                            className="p-1.5 rounded hover:bg-slate-700 text-red-400 hover:text-red-300"
                            title="Eliminar"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW 2: CONSTRUCTOR EN PANTALLA DIVIDIDA (EDITOR IZQUIERDA | PORTADA EN VIVO DERECHA) */}
      {viewMode === 'editor' && activePresupuesto && (
        <div className="space-y-4">
          
          {/* Top Bar of the Editor */}
          <div className="no-print flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  setViewMode('list');
                  fetchPresupuestos();
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Volver</span>
              </button>
              
              <div className="flex items-baseline gap-2">
                <span className="font-mono text-base font-extrabold text-orange-400">{activePresupuesto.codigo}</span>
                <span className="text-xs text-slate-400">· {activePresupuesto.cliente?.empresa}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Selector de Servicio del Catálogo Oficial */}
              {catalogServices.length > 0 && (
                <div className="flex items-center gap-1.5 bg-[#0e1424] px-2.5 py-1 rounded-lg border border-orange-500/30">
                  <Package className="w-3.5 h-3.5 text-orange-400 shrink-0" />
                  <span className="text-[11px] font-mono text-slate-300 font-semibold whitespace-nowrap hidden sm:inline">
                    Cargar Servicio:
                  </span>
                  <select
                    defaultValue=""
                    onChange={(e) => {
                      handleApplyCatalogService(e.target.value);
                      e.target.value = '';
                    }}
                    className="bg-[#141b2d] text-orange-300 text-xs font-semibold rounded px-2 py-0.5 border border-slate-700 focus:outline-none focus:border-orange-500 cursor-pointer"
                  >
                    <option value="" disabled>Seleccionar del Catálogo...</option>
                    {catalogServices.map(srv => (
                      <option key={srv.id} value={srv.id}>
                        {srv.nombre} (${srv.precioUSD} USD)
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Indicador dinámico de estado del enlace */}
              <div className={`px-2.5 py-1 rounded-lg border text-[11px] font-mono font-semibold flex items-center gap-1.5 ${
                activePresupuesto.estado === 'aceptado'
                  ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                  : activePresupuesto.estado === 'visto'
                  ? 'bg-amber-500/15 border-amber-500/30 text-amber-300'
                  : activePresupuesto.estado === 'sin_abrir' || activePresupuesto.estado === 'enviado'
                  ? 'bg-sky-500/15 border-sky-500/30 text-sky-300'
                  : 'bg-slate-800/80 border-slate-700 text-slate-400'
              }`}>
                <span className={`w-2 h-2 rounded-full ${
                  activePresupuesto.estado === 'aceptado'
                    ? 'bg-emerald-400'
                    : activePresupuesto.estado === 'visto'
                    ? 'bg-amber-400 animate-ping'
                    : activePresupuesto.estado === 'sin_abrir' || activePresupuesto.estado === 'enviado'
                    ? 'bg-sky-400'
                    : 'bg-slate-500'
                }`} />
                <span>
                  {activePresupuesto.estado === 'aceptado'
                    ? 'Enlace: Aceptado por el cliente'
                    : activePresupuesto.estado === 'visto'
                    ? 'Enlace: Abierto / Visto por el cliente'
                    : activePresupuesto.estado === 'sin_abrir' || activePresupuesto.estado === 'enviado'
                    ? 'Enlace: Sin abrir (Listo / Compartido)'
                    : 'Estado: Borrador (Presiona Guardar)'}
                </span>
              </div>

              <select
                value={activePresupuesto.estado}
                onChange={(e) => updatePropField('estado', e.target.value)}
                className="bg-[#121929] border border-slate-700 text-slate-200 text-xs px-2.5 py-1.5 rounded-lg font-semibold cursor-pointer focus:outline-none"
              >
                <option value="borrador">Borrador</option>
                <option value="sin_abrir">Sin abrir</option>
                <option value="visto">Abierto / Visto por el cliente</option>
                <option value="aceptado">Aceptado</option>
                <option value="rechazado">Rechazado</option>
              </select>

              <button
                onClick={() => handleCopyLink(activePresupuesto)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors"
                title="Copiar enlace interactivo para el cliente"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedLink ? 'Copiado' : 'Copiar enlace'}</span>
              </button>

              <button
                onClick={handlePrint}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold shadow-glow-sm transition-all"
                title="Imprimir o Guardar PDF con Portada Goglite"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Imprimir / PDF</span>
              </button>

              <button
                onClick={handleSavePresupuesto}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-all"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Guardar</span>
              </button>

              {onNavigateToRentabilidad && (
                <button
                  onClick={async () => {
                    await handleSavePresupuesto();
                    onNavigateToRentabilidad(activePresupuesto);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-500/20 hover:bg-orange-500/30 text-orange-300 border border-orange-500/30 text-xs font-bold transition-all shadow-sm"
                  title="Enviar a Módulo 4 (Rentabilidad & Factura Proforma)"
                >
                  <DollarSign className="w-3.5 h-3.5" />
                  <span>Facturar en Módulo 4 →</span>
                </button>
              )}

              {onNavigateToContratos && (
                <button
                  onClick={async () => {
                    await handleSavePresupuesto();
                    try {
                      await fetch(`/api/proyectos/crear-desde-presupuesto/${activePresupuesto.id}`, { method: 'POST' });
                    } catch (e) {}
                    onNavigateToContratos();
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-xs font-bold transition-all shadow-sm"
                  title="Formalizar con Contrato y Onboarding"
                >
                  <span>Contrato SOW →</span>
                </button>
              )}
            </div>
          </div>

          {savedNotification && (
            <div className="no-print bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs px-4 py-2 rounded-xl flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>Propuesta guardada correctamente.</span>
            </div>
          )}

          {/* TWO COLUMNS: LEFT EDITOR (FORM) | RIGHT PREVIEW (GOGLITE COVER & PROPOSAL) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* LEFT PANEL: 5 COLUMNS ON DESKTOP */}
            <div className="no-print lg:col-span-5 space-y-4 max-h-[85vh] overflow-y-auto pr-1">
              
              {/* Editor Tabs */}
              <div className="flex border-b border-slate-800 text-xs bg-[#0c1017] rounded-xl p-1 gap-1">
                {[
                  { id: 'portada', label: '1. Portada & Cliente' },
                  { id: 'modulos', label: `2. Módulos (${activePresupuesto.modulos?.length || 0})` },
                  { id: 'fases', label: '3. Fases' },
                  { id: 'inversion', label: '4. Inversión & Cierre' }
                ].map(t => (
                  <button
                    key={t.id}
                    onClick={() => setEditorTab(t.id)}
                    className={`flex-1 py-1.5 text-center font-semibold rounded-lg transition-colors ${
                      editorTab === t.id
                        ? 'bg-orange-600 text-white'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {/* TAB 1: PORTADA & CLIENTE */}
              {editorTab === 'portada' && (
                <div className="p-4 rounded-xl bg-[#0e131d] border border-slate-800 space-y-3.5 text-xs">
                  <div className="text-[11px] font-mono uppercase tracking-wider text-orange-400 font-bold">
                    Datos del Cliente & Proyecto
                  </div>

                  {/* Selector de País y Sede Emisora */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-2.5 rounded-lg bg-[#080b11] border border-slate-800/80">
                    <div>
                      <label className="text-[10px] text-slate-400 block mb-1 font-mono font-semibold">
                        País del Cliente / Procedencia
                      </label>
                      <select
                        value={activePresupuesto.pais || 'SV'}
                        onChange={(e) => handlePropCountryChange(e.target.value)}
                        className="w-full bg-[#121826] border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-100 font-mono text-xs focus:outline-none focus:border-orange-500"
                      >
                        <option value="DO">🇩🇴 República Dominicana (DO)</option>
                        <option value="SV">🇸🇻 El Salvador (SV)</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] text-slate-400 block mb-1 font-mono font-semibold">
                        Sede Emisora Vinculada
                      </label>
                      <div className="px-2.5 py-1.5 rounded-lg bg-[#141b2a] border border-slate-700/60 text-slate-300 text-[11px] font-mono flex items-center justify-between">
                        <span className="font-semibold text-white">
                          {(activePresupuesto.pais || '').toUpperCase() === 'DO' ? '🇩🇴 Santo Domingo (DO)' : '🇸🇻 San Salvador (SV)'}
                        </span>
                        <span className="text-[10px] text-orange-400">
                          {(activePresupuesto.pais || '').toUpperCase() === 'DO' ? (agencySettings?.telefonoWhatsappDO || '+1 809 408-8070') : (agencySettings?.telefonoWhatsappSV || '+503 7756-9828')}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Empresa / Negocio</label>
                    <input
                      type="text"
                      value={activePresupuesto.cliente?.empresa || ''}
                      onChange={(e) => updatePropField('cliente.empresa', e.target.value)}
                      className="w-full bg-[#080b11] border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-orange-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">Persona de Contacto</label>
                      <input
                        type="text"
                        value={activePresupuesto.cliente?.nombre || ''}
                        onChange={(e) => updatePropField('cliente.nombre', e.target.value)}
                        className="w-full bg-[#080b11] border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-orange-500"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">Teléfono</label>
                      <input
                        type="text"
                        value={activePresupuesto.cliente?.telefono || ''}
                        onChange={(e) => updatePropField('cliente.telefono', e.target.value)}
                        className="w-full bg-[#080b11] border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-orange-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Título de la Propuesta VIP</label>
                    <input
                      type="text"
                      value={activePresupuesto.titulo || ''}
                      onChange={(e) => updatePropField('titulo', e.target.value)}
                      className="w-full bg-[#080b11] border border-slate-800 rounded-lg px-3 py-2 text-slate-200 font-semibold focus:outline-none focus:border-orange-500"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Subtítulo / Módulos Incluidos</label>
                    <input
                      type="text"
                      value={activePresupuesto.subtitulo || ''}
                      onChange={(e) => updatePropField('subtitulo', e.target.value)}
                      className="w-full bg-[#080b11] border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-orange-500"
                    />
                  </div>

                  <div className="pt-2 border-t border-slate-800">
                    <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-bold mb-2">
                      Bloques Fijos de Portada Goglite
                    </div>

                    <div className="space-y-2">
                      <div>
                        <label className="text-[10px] text-slate-500 block mb-0.5">Enfoque de Conversión / Urgencia</label>
                        <textarea
                          rows="2"
                          value={activePresupuesto.portada?.enfoqueEstrategico || ''}
                          onChange={(e) => updatePropField('portada.enfoqueEstrategico', e.target.value)}
                          className="w-full bg-[#080b11] border border-slate-800 rounded-lg px-3 py-1.5 text-slate-300 focus:outline-none focus:border-orange-500 text-[11px]"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] text-slate-500 block mb-0.5">Tecnología & Rendimiento Mobile-First</label>
                        <textarea
                          rows="2"
                          value={activePresupuesto.portada?.tecnologiaMobileFirst || ''}
                          onChange={(e) => updatePropField('portada.tecnologiaMobileFirst', e.target.value)}
                          className="w-full bg-[#080b11] border border-slate-800 rounded-lg px-3 py-1.5 text-slate-300 focus:outline-none focus:border-orange-500 text-[11px]"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] text-slate-500 block mb-0.5">GEO & SEO Local (Schema / IA)</label>
                        <textarea
                          rows="2"
                          value={activePresupuesto.portada?.geoSeoLocal || ''}
                          onChange={(e) => updatePropField('portada.geoSeoLocal', e.target.value)}
                          className="w-full bg-[#080b11] border border-slate-800 rounded-lg px-3 py-1.5 text-slate-300 focus:outline-none focus:border-orange-500 text-[11px]"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: MODULOS Y PARTIDAS */}
              {editorTab === 'modulos' && (
                <div className="space-y-3 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono uppercase text-slate-400 font-bold">
                      Alcance & Entregables por Módulo
                    </span>
                    <button
                      onClick={addModulo}
                      className="px-2.5 py-1 rounded-lg bg-orange-600/20 text-orange-400 hover:bg-orange-600/30 font-semibold flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Añadir Módulo</span>
                    </button>
                  </div>

                  {activePresupuesto.modulos?.map((mod, idx) => (
                    <div key={mod.id || idx} className="p-3.5 rounded-xl bg-[#0e131d] border border-slate-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono font-bold text-orange-400">{mod.numero}</span>
                        <button
                          onClick={() => removeModulo(idx)}
                          className="text-slate-500 hover:text-red-400 p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <input
                        type="text"
                        value={mod.titulo}
                        onChange={(e) => updateModulo(idx, 'titulo', e.target.value)}
                        placeholder="Título del entregable"
                        className="w-full bg-[#080b11] border border-slate-800 rounded-lg px-3 py-1.5 font-bold text-slate-200 focus:outline-none focus:border-orange-500 text-xs"
                      />

                      <textarea
                        rows="2"
                        value={mod.descripcion}
                        onChange={(e) => updateModulo(idx, 'descripcion', e.target.value)}
                        placeholder="Especificaciones técnicas y detalles"
                        className="w-full bg-[#080b11] border border-slate-800 rounded-lg px-3 py-1.5 text-slate-300 focus:outline-none focus:border-orange-500 text-[11px]"
                      />
                    </div>
                  ))}
                </div>
              )}

              {/* TAB 3: FASES Y HOJA DE RUTA */}
              {editorTab === 'fases' && (
                <div className="space-y-3 text-xs">
                  <div className="text-[11px] font-mono uppercase text-slate-400 font-bold">
                    Hoja de Ruta de Implementación
                  </div>

                  {activePresupuesto.fases?.map((fase, idx) => (
                    <div key={idx} className="p-3.5 rounded-xl bg-[#0e131d] border border-slate-800 space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono font-bold text-orange-400">{fase.fase}:</span>
                        <input
                          type="text"
                          value={fase.plazo}
                          onChange={(e) => updateFase(idx, 'plazo', e.target.value)}
                          className="bg-[#080b11] border border-slate-800 rounded px-2 py-0.5 text-xs text-slate-200 font-semibold"
                        />
                      </div>
                      <textarea
                        rows="2"
                        value={fase.detalle}
                        onChange={(e) => updateFase(idx, 'detalle', e.target.value)}
                        className="w-full bg-[#080b11] border border-slate-800 rounded-lg px-3 py-1.5 text-slate-300 focus:outline-none focus:border-orange-500 text-[11px]"
                      />
                    </div>
                  ))}
                </div>
              )}

              {/* TAB 4: INVERSIÓN & CONDICIONES */}
              {editorTab === 'inversion' && (
                <div className="p-4 rounded-xl bg-[#0e131d] border border-slate-800 space-y-3.5 text-xs">
                  <div className="text-[11px] font-mono uppercase tracking-wider text-orange-400 font-bold">
                    Inversión y Condiciones Comerciales
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">Precio Mercado Referencial ($)</label>
                      <input
                        type="number"
                        value={activePresupuesto.inversion?.precioMercadoReferencial || 0}
                        onChange={(e) => updatePropField('inversion.precioMercadoReferencial', Number(e.target.value))}
                        className="w-full bg-[#080b11] border border-slate-800 rounded-lg px-3 py-2 text-slate-200 font-mono focus:outline-none focus:border-orange-500"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">Inversión Final Acordada ($)</label>
                      <input
                        type="number"
                        value={activePresupuesto.inversion?.precioTotal || 0}
                        onChange={(e) => updatePropField('inversion.precioTotal', Number(e.target.value))}
                        className="w-full bg-[#080b11] border border-slate-800 rounded-lg px-3 py-2 text-orange-400 font-mono font-bold focus:outline-none focus:border-orange-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">Anticipo al Inicio ($)</label>
                      <input
                        type="number"
                        value={activePresupuesto.inversion?.anticipo || 0}
                        onChange={(e) => updatePropField('inversion.anticipo', Number(e.target.value))}
                        className="w-full bg-[#080b11] border border-slate-800 rounded-lg px-3 py-2 text-slate-200 font-mono focus:outline-none focus:border-orange-500"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">Contra Entrega Final ($)</label>
                      <input
                        type="number"
                        value={activePresupuesto.inversion?.contraEntrega || 0}
                        onChange={(e) => updatePropField('inversion.contraEntrega', Number(e.target.value))}
                        className="w-full bg-[#080b11] border border-slate-800 rounded-lg px-3 py-2 text-slate-200 font-mono focus:outline-none focus:border-orange-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Beneficio Exclusivo Incluido</label>
                    <textarea
                      rows="2"
                      value={activePresupuesto.inversion?.beneficioExclusivo || ''}
                      onChange={(e) => updatePropField('inversion.beneficioExclusivo', e.target.value)}
                      className="w-full bg-[#080b11] border border-slate-800 rounded-lg px-3 py-1.5 text-slate-300 focus:outline-none focus:border-orange-500 text-[11px]"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Revisiones Incluidas</label>
                    <input
                      type="text"
                      value={activePresupuesto.inversion?.revisiones || ''}
                      onChange={(e) => updatePropField('inversion.revisiones', e.target.value)}
                      className="w-full bg-[#080b11] border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-orange-500"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* RIGHT PANEL: 7 COLUMNS - VISTA PREVIA CORPORATIVA EN VIVO CON PORTADA GOGLITE */}
            <div className="lg:col-span-7 bg-[#0c1017] p-2 rounded-2xl border border-slate-800 overflow-hidden shadow-2xl print:border-none print:p-0 print:shadow-none print:bg-transparent print:m-0 print:overflow-visible">
              
              {/* PRINTABLE PROPOSAL SHEET (ESTILO OFICIAL GOGLITE / 3 HOJAS 8.5 x 11 in) */}
              <div 
                id="printable-proposal"
                className="bg-transparent p-0 text-slate-900 rounded-xl text-xs leading-relaxed max-h-[85vh] overflow-y-auto print:max-h-none print:shadow-none print:p-0 print:text-black font-sans space-y-4 print:space-y-0"
              >
                {/* =========================================================================
                    HOJA 1: PORTADA OFICIAL GOGLITE (TAMAÑO CARTA 8.5 x 11 in / AJUSTE EXACTO)
                    ========================================================================= */}
                <div className="print-letter-page print-cover-sheet relative w-full aspect-auto overflow-hidden bg-[#090808] shadow-xl rounded-lg print:rounded-none print:shadow-none flex items-center justify-center">
                  <img 
                    src="/assets/portada_oficial_fija.png" 
                    alt="Propuesta de Desarrollo Digital VIP" 
                    className="w-full h-auto object-contain block mx-auto print:w-full print:h-full print:object-contain"
                  />
                </div>

                {/* =========================================================================
                    HOJA 2: RESUMEN EJECUTIVO & ALCANCE TÉCNICO (TAMAÑO CARTA 8.5 x 11 in)
                    ========================================================================= */}
                <div className="print-letter-page print-content-sheet p-6 sm:p-10 bg-white shadow-xl rounded-lg print:rounded-none print:shadow-none flex flex-col justify-between aspect-auto sm:min-h-[11in]">
                  <div>
                    {/* Sub-Header with Goglite Brand & Metadata */}
                    <div className="border-b-2 border-slate-900 pb-4 mb-5 avoid-break">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <img 
                            src={(typeof window !== 'undefined' ? localStorage.getItem('goglite_agency_logo_docs') : null) || displayEmisor?.logoDocumentosUrl || displayEmisor?.logoUrl || (typeof window !== 'undefined' ? localStorage.getItem('goglite_agency_logo') : null) || DEFAULT_AGENCY_BRANDING.logoUrl} 
                            alt={displayEmisor?.empresa || 'Agencia'} 
                            className="h-10 w-auto object-contain"
                          />
                          <div className="text-[10px] text-slate-600 font-medium space-y-0.5 border-l border-slate-300 pl-3">
                            <div><strong>Ubicación:</strong> {displayEmisor?.ubicacion}</div>
                            <div><strong>Contacto:</strong> {displayEmisor?.telefono} | {displayEmisor?.email}</div>
                            <div><strong>Director:</strong> {displayEmisor?.responsable}</div>
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="text-[11px] font-mono font-bold text-slate-900 uppercase">
                            Fecha: {activePresupuesto.fecha}
                          </div>
                          <div className="text-[10px] font-mono text-orange-600 font-bold mt-0.5">
                            {activePresupuesto.codigo}
                          </div>
                        </div>
                      </div>

                      {/* DESTINATARIO */}
                      <div className="mt-4 p-3 rounded-lg bg-slate-50 border border-slate-200">
                        <div className="text-[10px] font-mono uppercase text-slate-500 font-bold">Cliente / Destinatario:</div>
                        <div className="text-sm font-extrabold text-slate-900 mt-0.5">
                          {activePresupuesto.cliente?.nombre} | {activePresupuesto.cliente?.empresa}
                        </div>
                        <div className="text-[11px] text-slate-700">
                          Tel: {activePresupuesto.cliente?.telefono} · {activePresupuesto.cliente?.actividad}
                        </div>
                      </div>
                    </div>

                    {/* 2. TÍTULO DE LA PROPUESTA VIP */}
                    <div className="mb-5 avoid-break">
                      <h2 className="text-base font-black text-slate-900 tracking-tight leading-snug uppercase">
                        {activePresupuesto.titulo}
                      </h2>
                      {activePresupuesto.subtitulo && (
                        <div className="text-[11px] font-semibold text-orange-600 mt-0.5">
                          {activePresupuesto.subtitulo}
                        </div>
                      )}
                    </div>

                    {/* 3. BLOQUES ESTRATÉGICOS FIJOS */}
                    <div className="space-y-2.5 mb-6 bg-slate-50 p-4 rounded-xl border border-slate-200/80 avoid-break text-[11px]">
                      {activePresupuesto.portada?.proyecto && (
                        <div>
                          <span className="font-extrabold text-slate-900 block mb-0.5">
                            • Proyecto & Diagnóstico:
                          </span>
                          <p className="text-slate-700 leading-normal">
                            {activePresupuesto.portada?.proyecto}
                          </p>
                        </div>
                      )}

                      {activePresupuesto.portada?.enfoqueEstrategico && (
                        <div>
                          <span className="font-extrabold text-slate-900 block mb-0.5">
                            • Enfoque de Conversión Inmediata:
                          </span>
                          <p className="text-slate-700 leading-normal">
                            {activePresupuesto.portada?.enfoqueEstrategico}
                          </p>
                        </div>
                      )}

                      {activePresupuesto.portada?.tecnologiaMobileFirst && (
                        <div>
                          <span className="font-extrabold text-slate-900 block mb-0.5">
                            • Tecnología y Rendimiento Mobile-First:
                          </span>
                          <p className="text-slate-700 leading-normal">
                            {activePresupuesto.portada?.tecnologiaMobileFirst}
                          </p>
                        </div>
                      )}

                      {activePresupuesto.portada?.geoSeoLocal && (
                        <div>
                          <span className="font-extrabold text-slate-900 block mb-0.5">
                            • GEO & SEO Local de Nueva Generación (Optimizado para IA y Buscadores):
                          </span>
                          <p className="text-slate-700 leading-normal">
                            {activePresupuesto.portada?.geoSeoLocal}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* 4. COMPONENTES DEL SISTEMA INTEGRAL */}
                    <div className="mb-4">
                      <h2 className="text-xs font-black uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1 mb-3">
                        1. Componentes del Sistema Integral (Alcance y Entregables)
                      </h2>

                      <div className="space-y-3">
                        {activePresupuesto.modulos?.map((m, i) => (
                          <div key={i} className="pl-3 border-l-2 border-orange-500 space-y-0.5 avoid-break">
                            <div className="font-extrabold text-slate-900 text-xs">
                              {m.numero}: {m.titulo}
                            </div>
                            <p className="text-slate-700 text-[11px] leading-relaxed">
                              {m.descripcion}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Footer de Hoja 2 */}
                  <div className="pt-3 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-400 font-mono avoid-break">
                    <span>Goglite Digital Hub · Suite Integral</span>
                    <span>Página 2 de 3 · Propuesta Oficial</span>
                  </div>
                </div>

                {/* =========================================================================
                    HOJA 3: CRONOGRAMA, INVERSIÓN Y FIRMA (TAMAÑO CARTA 8.5 x 11 in)
                    ========================================================================= */}
                <div className="print-letter-page print-content-sheet p-6 sm:p-10 bg-white shadow-xl rounded-lg print:rounded-none print:shadow-none flex flex-col justify-between aspect-auto sm:min-h-[11in]">
                  <div>
                    {/* Mini-Header Hoja 3 */}
                    <div className="border-b border-slate-200 pb-2.5 mb-4 flex items-center justify-between avoid-break">
                      <div className="flex items-center gap-2">
                        <img 
                          src={(typeof window !== 'undefined' ? localStorage.getItem('goglite_agency_logo_docs') : null) || displayEmisor?.logoDocumentosUrl || displayEmisor?.logoUrl || (typeof window !== 'undefined' ? localStorage.getItem('goglite_agency_logo') : null) || DEFAULT_AGENCY_BRANDING.logoUrl} 
                          alt={displayEmisor?.empresa || 'Agencia'} 
                          className="h-6 w-auto object-contain"
                        />
                        <span className="font-bold text-slate-900 text-xs">{displayEmisor?.empresa || 'Goglite Digital Hub'}</span>
                      </div>
                      <div className="text-[10px] font-mono text-slate-500">
                        {activePresupuesto.codigo} · {activePresupuesto.cliente?.empresa}
                      </div>
                    </div>

                    {/* 2. HOJA DE RUTA Y FASES */}
                    <div className="mb-4 avoid-break">
                      <h2 className="text-xs font-black uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1 mb-2.5">
                        2. Hoja de Ruta y Fases de Implementación (10 a 15 Días Hábiles)
                      </h2>

                      <div className="space-y-2">
                        {activePresupuesto.fases?.map((f, i) => (
                          <div key={i} className="text-[10.5px] text-slate-800">
                            <span className="font-extrabold text-slate-900">• {f.fase} ({f.plazo}):</span> {f.detalle}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* 3. INVERSIÓN ESTRATÉGICA Y CONDICIONES */}
                    <div className="mb-4 p-4 sm:p-5 rounded-xl bg-slate-900 text-white avoid-break shadow-md">
                      <h2 className="text-xs font-black uppercase tracking-wider text-orange-400 mb-2">
                        3. Inversión Estratégica y Condiciones Comerciales
                      </h2>

                      <p className="text-[10.5px] text-slate-300 leading-relaxed mb-3">
                        La inversión en un sistema digital integral de esta envergadura suele oscilar entre los <strong>${activePresupuesto.inversion?.precioMercadoReferencial} USD</strong> en el mercado profesional. Para <strong>{activePresupuesto.cliente?.empresa}</strong> hemos estructurado un paquete preferencial:
                      </p>

                      <div className="bg-white/10 p-3 sm:p-3.5 rounded-lg border border-white/15 space-y-1 font-mono mb-3">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-300">Inversión Total del Sistema Completo:</span>
                          <span className="text-sm sm:text-base font-extrabold text-orange-400">
                            ${activePresupuesto.inversion?.precioTotal} USD
                          </span>
                        </div>
                        {activePresupuesto.inversion?.beneficioExclusivo && (
                          <div className="text-[10px] text-emerald-300 font-sans pt-1 border-t border-white/10">
                            ★ <strong>Beneficio Exclusivo:</strong> {activePresupuesto.inversion?.beneficioExclusivo}
                          </div>
                        )}
                      </div>

                      <div className="text-[10px] text-slate-300 space-y-1.5 font-sans">
                        <div>• <strong>Forma de Pago:</strong> ${activePresupuesto.inversion?.anticipo} USD de anticipo para iniciar y ${activePresupuesto.inversion?.contraEntrega} USD contra entrega final y publicación.</div>
                        <div>• <strong>Revisiones:</strong> {activePresupuesto.inversion?.revisiones}</div>
                        <div>• <strong>Requisitos de Inicio:</strong> {activePresupuesto.inversion?.requisitosInicio}</div>
                        <div>• <strong>Vigencia de la Oferta:</strong> {activePresupuesto.vigenciaDias || 15} días calendario.</div>
                      </div>
                    </div>

                    {/* 4. FIRMA OFICIAL GOGLITE */}
                    <div className="pt-3 border-t border-slate-300 flex items-center justify-between text-[10.5px] text-slate-600 avoid-break">
                      <div>
                        <div className="font-extrabold text-slate-900 text-xs">{displayEmisor?.responsable}</div>
                        <div className="text-orange-600 font-bold">{displayEmisor?.empresa}</div>
                        <div className="text-[10px] text-slate-500">{displayEmisor?.telefono} | {displayEmisor?.email}</div>
                      </div>

                      <div className="text-right">
                        <div className="font-mono text-[9.5px] text-slate-400">Documento Oficial Certificado</div>
                        <div className="text-xs font-bold text-slate-900">Estado: {activePresupuesto.estado.toUpperCase()}</div>
                      </div>
                    </div>
                  </div>

                  {/* Footer de Hoja 3 */}
                  <div className="pt-3 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-400 font-mono avoid-break">
                    <span>Goglite Digital Hub · Suite Integral</span>
                    <span>Página 3 de 3 · Conclusión & Firmas</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* MODAL: COTIZACIÓN GUARDADA Y ENLACE DE CLIENTE */}
      {showSavedModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0f1422] border border-slate-800 rounded-2xl w-full max-w-lg p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white">¡Cotización Guardada y Lista para Enviar!</h3>
                  <p className="text-[11px] text-slate-400">
                    Se generó el enlace interactivo para que el cliente la revise y apruebe en línea.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowSavedModal(false)}
                className="w-7 h-7 rounded-lg bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3.5 rounded-xl bg-[#080b11] border border-slate-800/80 space-y-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-slate-400">Código de Propuesta:</span>
                <span className="font-bold text-orange-400">{activePresupuesto?.codigo || 'P-2026'}</span>
              </div>
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-slate-400">Cliente / Negocio:</span>
                <span className="font-bold text-slate-200">{activePresupuesto?.cliente?.empresa}</span>
              </div>
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-slate-400">Monto Inversión:</span>
                <span className="font-black text-emerald-400">${Number(activePresupuesto?.inversion?.precioTotal || 0).toLocaleString()} USD</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 block">
                Enlace Público del Portal de Cliente (Fase 1: Propuesta VIP):
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={savedPortalUrl}
                  className="flex-1 bg-[#080b11] border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-sky-400 select-all focus:outline-none focus:border-sky-500"
                />
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(savedPortalUrl);
                    setCopiedLink('modal');
                    setTimeout(() => setCopiedLink(false), 2000);
                  }}
                  className="px-3 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shrink-0"
                >
                  {copiedLink === 'modal' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedLink === 'modal' ? '¡Copiado!' : 'Copiar'}</span>
                </button>
              </div>
              <p className="text-[10px] text-slate-500">
                El cliente puede abrir este enlace desde su computadora o móvil sin necesidad de iniciar sesión para revisar módulos, montos y aprobar con 1 clic.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/80">
              <a
                href={savedPortalUrl}
                target="_blank"
                rel="noreferrer"
                className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
              >
                <ExternalLink className="w-3.5 h-3.5 text-emerald-400" />
                <span>Abrir Vista de Cliente</span>
              </a>

              <a
                href={`https://wa.me/${(savedClientPhone || '').replace(/[^\d]/g, '')}?text=${encodeURIComponent(`Hola ${activePresupuesto?.cliente?.nombre || ''}, te comparto el enlace a tu Propuesta de Desarrollo Digital VIP de Goglite:\n\n${savedPortalUrl}\n\nPuedes revisarla en detalle y aprobarla directamente en línea para iniciar el proyecto.`)}`}
                target="_blank"
                rel="noreferrer"
                className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-md"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Enviar por WhatsApp</span>
              </a>
            </div>

            <div className="pt-1 text-center">
              <button
                onClick={() => setShowSavedModal(false)}
                className="text-xs text-slate-500 hover:text-slate-300 underline"
              >
                Cerrar y continuar en el constructor
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
