import React, { useState, useEffect, useRef } from 'react';
import apiClient from '../services/apiClient';
import { saveCmsSiteToFirestore, getCmsSiteFromFirestore } from '../services/firebase';
import GoogleBusinessProfileView from './GoogleBusinessProfileView';
import GoogleSiteKitView from './GoogleSiteKitView';
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
  Activity
} from 'lucide-react';

const GOGLITE_DEFAULT_SITE = {
  id: 'cms-goglite',
  slug: 'goglite',
  nombre: 'Goglite Digital Hub',
  pais: 'SV',
  dominio: 'goglite.com',
  estado: 'publicado',
  ultimaActualizacion: new Date().toISOString().split('T')[0],
  contenido: {
    branding: {
      nombreMarca: 'Goglite Agency',
      slogan: 'Arquitectura Digital & Agentes de IA',
      colorPrimario: '#FF6B00',
      telefonoWhatsApp: '+829 528-4713',
      ciudadPrincipal: 'San Salvador & Santo Domingo'
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

export default function HeadlessCmsHubModule() {
  const [sites, setSites] = useState([GOGLITE_DEFAULT_SITE]);
  const [selectedSlug, setSelectedSlug] = useState('goglite');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [previewDevice, setPreviewDevice] = useState('desktop'); // 'desktop' | 'tablet' | 'mobile'

  // Pantallas Principales: 'editor_visual' (Web) | 'google_profile' (Ficha Google Maps & Reseñas)
  const [activeView, setActiveView] = useState('editor_visual');

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

  // Form state for creating a new site
  const [newSiteForm, setNewSiteForm] = useState({
    nombre: '',
    dominio: '',
    pais: 'SV',
    telefono: '',
    colorPrimario: '#FF6B00'
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
      }
    };

    window.addEventListener('message', handleWindowMessage);
    return () => window.removeEventListener('message', handleWindowMessage);
  }, []);

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

      // Fallback a localStorage
      if (!loaded || !Array.isArray(loaded) || loaded.length === 0) {
        const local = localStorage.getItem('goglite_cms_sites');
        if (local) {
          try {
            loaded = JSON.parse(local);
          } catch (e) {}
        }
      }

      if (!Array.isArray(loaded)) loaded = [];

      // Garantizar que el sitio oficial Goglite Digital Hub esté siempre disponible al inicio
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
      try {
        localStorage.setItem('goglite_cms_sites', JSON.stringify(loaded));
      } catch (e) {}

      const target = loaded.find(s => s.slug === selectedSlug) || loaded[0];
      setSelectedSlug(target.slug);
      setEditableContent(JSON.parse(JSON.stringify(target.contenido)));
    } catch (err) {
      console.error('Error fetching CMS sites:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectSite = (slug) => {
    setSelectedSlug(slug);
    const target = sites.find(s => s.slug === slug);
    if (target) {
      setEditableContent(JSON.parse(JSON.stringify(target.contenido)));
    }
    setUnsavedChangesCount(0);
    setDiscoveredPageInfo(null);
  };

  const handleSaveContent = async () => {
    try {
      setSaving(true);
      let updatedSite = null;

      // 1. Guardar en Firestore (Nube en tiempo real)
      try {
        const currentSite = sites.find(s => s.slug === selectedSlug) || {};
        await saveCmsSiteToFirestore(selectedSlug, currentSite, editableContent);
        console.log('[Firestore CMS] Guardado en Firestore con éxito');
      } catch (fErr) {
        console.warn('[Firestore CMS] Fallo guardado en Firestore:', fErr);
      }

      // 2. Guardar en API servidor si está disponible
      try {
        const res = await apiClient.patch(`/api/cms/content/${selectedSlug}`, editableContent);
        const cType = res.headers.get('content-type') || '';
        if (res.ok && cType.includes('application/json')) {
          updatedSite = await res.json();
        }
      } catch (e) {
        console.warn('API error, saving locally:', e);
      }

      // 3. Sincronizar en memoria y localStorage
      setSites(prev => {
        const next = prev.map(s => {
          if (s.slug === selectedSlug) {
            return {
              ...s,
              contenido: editableContent,
              ultimaActualizacion: new Date().toISOString().split('T')[0]
            };
          }
          return s;
        });
        try {
          localStorage.setItem('goglite_cms_sites', JSON.stringify(next));
        } catch (err) {}
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
      let created = null;

      try {
        const res = await apiClient.post('/api/cms/sites', newSiteForm);
        const cType = res.headers.get('content-type') || '';
        if (res.ok && cType.includes('application/json')) {
          const data = await res.json();
          created = data.site;
        }
      } catch (err) {
        console.warn('API offline, creating locally:', err);
      }

      // Fallback local creation
      if (!created) {
        const slug = newSiteForm.nombre.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
        created = {
          id: 'cms-' + Date.now(),
          slug,
          nombre: newSiteForm.nombre,
          pais: newSiteForm.pais,
          dominio: newSiteForm.dominio || `${slug}.com`,
          estado: 'publicado',
          ultimaActualizacion: new Date().toISOString().split('T')[0],
          contenido: {
            branding: {
              nombreMarca: newSiteForm.nombre,
              slogan: 'Soluciones Profesionales',
              colorPrimario: newSiteForm.colorPrimario || '#FF6B00',
              telefonoWhatsApp: newSiteForm.telefono || '+503 7000-9999',
              ciudadPrincipal: newSiteForm.pais === 'DO' ? 'Santo Domingo' : 'San Salvador'
            },
            hero: {
              badge: '⚡ Servicio Garantizado 24/7',
              titulo: `Servicios Profesionales de ${newSiteForm.nombre}`,
              subtitulo: 'Atención personalizada y cotización express por WhatsApp.',
              botonTexto: 'Contactar por WhatsApp',
              botonSubtexto: 'Respuesta inmediata'
            },
            servicios: [
              { id: 's-1', titulo: 'Servicio Principal', descripcion: 'Atención especializada para tus requerimientos.', precio: 'Consultar' }
            ],
            testimonios: [
              { id: 't-1', cliente: 'Cliente Satisfecho', comentario: 'Puntuales y profesionales.', estrellas: 5 }
            ],
            faqs: [
              { pregunta: '¿Cómo agendo un servicio?', respuesta: 'Escríbenos por WhatsApp para atención inmediata.' }
            ]
          }
        };
      }

      setSites(prev => {
        const next = [...prev, created];
        try {
          localStorage.setItem('goglite_cms_sites', JSON.stringify(next));
        } catch (e) {}
        return next;
      });

      setSelectedSlug(created.slug);
      setEditableContent(created.contenido);
      setNewSiteForm({ nombre: '', dominio: '', pais: 'SV', telefono: '', colorPrimario: '#FF6B00' });
      setShowNewSiteModal(false);
      setShowAgentPromptModal(true);
    } catch (e) {
      console.error('Error creando sitio:', e);
    } finally {
      setCreatingSite(false);
    }
  };

  // Generador del Prompt Agéntico para Fase 4 · Paso 1
  const currentSite = sites.find(s => s.slug === selectedSlug) || sites[0];
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
  const iframeUrl = isGogliteDefault 
    ? 'https://goglite.com/?goglite_edit=true' 
    : (currentSite.dominio?.startsWith('http') ? `${currentSite.dominio}?goglite_edit=true` : `https://${currentSite.dominio}?goglite_edit=true`);

  return (
    <div className="flex-1 overflow-y-auto bg-[#080b11] p-6 text-slate-100 flex flex-col gap-5">
      
      {/* 1. TOP HEADER & HUB CONTROLS */}
      <div className="p-5 rounded-2xl bg-[#0e1320] border border-slate-800/80 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-black text-white">Hub Headless CMS · Goglite Care</h2>
            <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-mono font-semibold">
              $0 Servidores · Google API
            </span>
            <span className="text-[10px] bg-blue-500/20 text-blue-400 border border-blue-500/30 px-2 py-0.5 rounded-full font-mono font-semibold">
              Retainer $99 - $199/mes
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Centro de Mando de Presencia Digital: Edición visual del sitio web y administración oficial de la Ficha de Google Business con respuestas IA.
          </p>
        </div>

        {/* Project Selector & Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-1.5 bg-[#131926] border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-300">
            <span>Sitio:</span>
            <select
              value={selectedSlug}
              onChange={(e) => handleSelectSite(e.target.value)}
              className="bg-transparent text-white font-bold focus:outline-none max-w-[160px] truncate cursor-pointer"
            >
              {sites.map(s => (
                <option key={s.slug} value={s.slug} className="bg-[#0e1320] text-white">
                  {s.nombre} ({s.dominio})
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => setShowAgentPromptModal(true)}
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-blue-600/30 to-indigo-600/30 hover:from-blue-600/50 hover:to-indigo-600/50 border border-blue-500/40 text-blue-300 text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm"
            title="Copiar prompt para que el agente de IA conecte este sitio web (Fase 4 · Paso 1)"
          >
            <Bot className="w-3.5 h-3.5 text-blue-400" />
            <span>Prompt para Agente</span>
          </button>

          <button
            onClick={() => setShowNewSiteModal(true)}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-all border border-slate-700"
          >
            <Plus className="w-3.5 h-3.5 text-emerald-400" />
            <span>Nuevo Sitio</span>
          </button>

          {activeView === 'editor_visual' && (
            <a
              href={iframeUrl}
              target="_blank"
              rel="noreferrer"
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-all border border-slate-700"
              title="Abrir web en pestaña completa"
            >
              <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
              <span>Ver Web</span>
            </a>
          )}
        </div>
      </div>

      {/* 2. SUB-NAVIGATION TABS (EDITOR VISUAL VS FICHA GOOGLE) */}
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
          <span>🎨 Editor Visual Web (Click-to-Edit)</span>
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
          <span>📍 Ficha de Google Business & Reseñas IA</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 font-mono font-bold flex items-center gap-1">
            <Star className="w-2.5 h-2.5 fill-amber-400" />
            <span>{currentSite?.slug === 'goglite' ? '5.0 (3)' : '5.0'}</span>
          </span>
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
          <span>⚡ Google Site Kit (Search Console, GA4 & Ads)</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono font-bold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>En Vivo</span>
          </span>
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

      {/* 3. VISTA B: PANTALLA DE EDITOR VISUAL EN VIVO (CLICK-TO-EDIT CANVAS) */}
      {activeView === 'editor_visual' && (
        <div className="flex-1 flex flex-col gap-3">
          {/* Top Control Bar */}
          <div className="p-3.5 bg-[#0e1320] border border-slate-800 rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-md">
            {/* Viewport switcher */}
            <div className="flex items-center gap-1.5 bg-[#131926] p-1 rounded-xl border border-slate-700/80">
              <button
                onClick={() => setPreviewDevice('desktop')}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  previewDevice === 'desktop' ? 'bg-orange-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Monitor className="w-3.5 h-3.5" />
                <span>Desktop 100%</span>
              </button>
              <button
                onClick={() => setPreviewDevice('tablet')}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  previewDevice === 'tablet' ? 'bg-orange-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Tablet className="w-3.5 h-3.5" />
                <span>Tablet 768px</span>
              </button>
              <button
                onClick={() => setPreviewDevice('mobile')}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  previewDevice === 'mobile' ? 'bg-orange-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Mobile 390px</span>
              </button>
            </div>

            {/* Indicator & Actions */}
            <div className="flex items-center gap-3">
              {discoveredPageInfo && (
                <span className="text-[11px] bg-slate-800/90 text-amber-300 px-3 py-1 rounded-xl border border-slate-700 font-mono font-bold flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  <span>{discoveredPageInfo.elementsCount} campos editables</span>
                </span>
              )}

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
                    ? 'bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white shadow-orange-950 animate-bounce'
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

          {/* Instructions helper strip */}
          <div className="px-4 py-2 rounded-xl bg-orange-500/10 border border-orange-500/20 text-xs text-orange-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MousePointerClick className="w-4 h-4 text-orange-400 shrink-0" />
              <span>
                <strong className="text-orange-400">Modo Click-to-Edit Activo:</strong> Pasa el ratón sobre cualquier texto o botón en la web de abajo para ver la silueta naranja. Haz clic y escribe directamente sobre la pantalla. Al terminar, pulsa Enter o haz clic fuera y publica.
              </span>
            </div>
            <span className="text-[11px] font-mono text-slate-400 hidden lg:inline">
              contenteditable="plaintext-only" (Protegido contra ruptura)
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
                <div className="flex-1 max-w-md mx-4 bg-[#0a0d14] rounded-lg px-3 py-1 text-[11px] font-mono text-slate-300 border border-slate-700/60 text-center truncate flex items-center justify-center gap-1.5">
                  <span className="text-emerald-400">🔒</span>
                  <span className="text-slate-400">https://</span>
                  <span className="text-white font-bold">{currentSite.dominio}</span>
                  <span className="text-orange-400">?goglite_edit=true</span>
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
                title={`Editor Visual - ${currentSite.nombre}`}
                className="w-full flex-1 border-0 bg-white"
                allow="clipboard-write"
                sandbox="allow-scripts allow-same-origin allow-forms allow-modals allow-popups"
              />
            </div>
          </div>
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
                    Sitio: <span className="text-white font-semibold">{currentSite.nombre}</span> (ID: <code className="text-amber-400">{selectedSlug}</code>)
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

      {/* MODAL 2: ALTA DE NUEVO SITIO WEB */}
      {showNewSiteModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0e1320] border border-slate-800 rounded-2xl p-6 max-w-xl w-full shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-emerald-400" />
                <h3 className="text-sm font-bold text-white">Alta de Nuevo Sitio Web para Cliente</h3>
              </div>
              <button
                onClick={() => setShowNewSiteModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Registra la empresa del cliente. Al crearlo, obtendrás de inmediato el prompt agéntico para conectarlo en el Paso 1 de desarrollo.
            </p>

            <form onSubmit={handleCreateNewSite} className="space-y-4 pt-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Nombre Comercial *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Clínica Dental Escalón"
                    value={newSiteForm.nombre}
                    onChange={(e) => setNewSiteForm({ ...newSiteForm, nombre: e.target.value })}
                    className="w-full bg-[#131926] border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-400 block mb-1">Dominio Oficial</label>
                  <input
                    type="text"
                    placeholder="Ej. dentalescalon.com"
                    value={newSiteForm.dominio}
                    onChange={(e) => setNewSiteForm({ ...newSiteForm, dominio: e.target.value })}
                    className="w-full bg-[#131926] border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">País</label>
                  <select
                    value={newSiteForm.pais}
                    onChange={(e) => setNewSiteForm({ ...newSiteForm, pais: e.target.value })}
                    className="w-full bg-[#131926] border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="SV">🇸🇻 El Salvador</option>
                    <option value="DO">🇩🇴 Rep. Dominicana</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs text-slate-400 block mb-1">WhatsApp de Cierre</label>
                  <input
                    type="text"
                    placeholder="+503 7890-1234"
                    value={newSiteForm.telefono}
                    onChange={(e) => setNewSiteForm({ ...newSiteForm, telefono: e.target.value })}
                    className="w-full bg-[#131926] border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-400 block mb-1">Color de Marca</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={newSiteForm.colorPrimario}
                      onChange={(e) => setNewSiteForm({ ...newSiteForm, colorPrimario: e.target.value })}
                      className="w-9 h-9 rounded-lg bg-transparent cursor-pointer border border-slate-700"
                    />
                    <input
                      type="text"
                      value={newSiteForm.colorPrimario}
                      onChange={(e) => setNewSiteForm({ ...newSiteForm, colorPrimario: e.target.value })}
                      className="flex-1 bg-[#131926] border border-slate-700 rounded-xl p-2 text-xs font-mono text-white"
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
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-950"
                >
                  {creatingSite ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                  <span>Crear Sitio & Ver Prompt</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
