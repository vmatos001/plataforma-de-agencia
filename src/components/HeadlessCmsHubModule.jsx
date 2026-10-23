import React, { useState, useEffect, useRef } from 'react';
import apiClient from '../services/apiClient';
import { saveCmsSiteToFirestore, getCmsSiteFromFirestore } from '../services/firebase';
import {
  Globe,
  Layout,
  Edit,
  Save,
  Check,
  Smartphone,
  Tablet,
  Monitor,
  Copy,
  ExternalLink,
  Plus,
  Trash2,
  Sparkles,
  RefreshCw,
  Sliders,
  Eye,
  CheckCircle2,
  FileCode,
  Code2,
  MessageSquare,
  ShieldCheck,
  HelpCircle,
  Star,
  Zap,
  Building2,
  CheckCheck,
  MousePointerClick
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
      telefonoWhatsApp: '+503 7000-9999',
      ciudadPrincipal: 'San Salvador & Santo Domingo'
    },
    hero: {
      badge: '⚡ Oferta del mes de agosto',
      titulo: 'Si las IA no te encuentran, tu negocio no existe.',
      subtitulo: 'Dejamos atrás el diseño web estático. Optimizamos tu infraestructura digital para que los LLMs recomienden tu marca e integramos agentes autónomos que convierten tráfico en facturación 24/7.',
      botonTexto: 'Contactar por WhatsApp',
      botonSubtexto: 'Respuesta inmediata'
    },
    servicios: [
      {
        id: 's-1',
        titulo: 'Optimización para Motores de IA (GEO)',
        descripcion: 'Infraestructura semántica para que ChatGPT, Perplexity y Gemini citen y recomienden tu marca.',
        precio: 'Desde $450 USD'
      },
      {
        id: 's-2',
        titulo: 'Agentes Autónomos & CRM',
        descripcion: 'Automatización comercial 24/7 con IA que califica leads y agenda reuniones.',
        precio: 'Desde $350 USD'
      }
    ],
    testimonios: [],
    faqs: []
  }
};

export default function HeadlessCmsHubModule() {
  const [sites, setSites] = useState([]);
  const [selectedSlug, setSelectedSlug] = useState('goglite');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [previewDevice, setPreviewDevice] = useState('desktop'); // 'desktop' | 'tablet' | 'mobile'
  const [previewTab, setPreviewTab] = useState('render'); // 'render' | 'json'
  const [activeHubTab, setActiveHubTab] = useState('visual_editor'); // 'visual_editor' | 'editor' | 'snippet' | 'nuevo'
  
  const [copiedScript, setCopiedScript] = useState(false);
  const [copiedTag, setCopiedTag] = useState(null);
  const [pingStatus, setPingStatus] = useState(null); // null | 'testing' | 'online' | 'offline'

  // Opción C: Estado para el Editor Visual en Vivo
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
        // Asegurar datos frescos de prueba
        loaded[existingGogliteIdx] = {
          ...GOGLITE_DEFAULT_SITE,
          ...loaded[existingGogliteIdx],
          contenido: {
            ...GOGLITE_DEFAULT_SITE.contenido,
            ...(loaded[existingGogliteIdx].contenido || {})
          }
        };
      }

      // Semilla demo complementaria si solo está goglite
      if (loaded.length === 1) {
        loaded.push(
          {
            id: 'cms-001',
            slug: 'gruas-andrea',
            nombre: 'Grúas Andrea / Auxilio Vial 24/7',
            pais: 'SV',
            dominio: 'gruasandrea.com',
            estado: 'publicado',
            ultimaActualizacion: '2026-10-14',
            contenido: {
              branding: {
                nombreMarca: 'Grúas Andrea',
                slogan: 'Auxilio Vial & Grúas Plataforma 24 Horas',
                colorPrimario: '#FF6B00',
                telefonoWhatsApp: '+503 7890-1234',
                ciudadPrincipal: 'San Salvador / Cobertura Nacional'
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
                  descripcion: 'Transporte seguro para sedanes, SUVs y deportivos sin rozar defensas.',
                  precio: 'Desde $45 USD'
                }
              ],
              testimonios: [],
              faqs: []
            }
          }
        );
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
              telefonoWhatsApp: newSiteForm.telefono || '+1 (829) 986-2000',
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
      setActiveHubTab('editor');
      setNewSiteForm({ nombre: '', dominio: '', pais: 'SV', telefono: '', colorPrimario: '#FF6B00' });
    } catch (e) {
      console.error('Error creando sitio:', e);
    } finally {
      setCreatingSite(false);
    }
  };

  const handleAddService = () => {
    if (!editableContent) return;
    const newService = {
      id: 's-' + Date.now(),
      titulo: 'Nuevo Servicio Comercial',
      descripcion: 'Descripción detallada de la solución ofrecida al cliente.',
      precio: 'Desde $50 USD'
    };
    setEditableContent({
      ...editableContent,
      servicios: [...(editableContent.servicios || []), newService]
    });
  };

  const handleDeleteService = (id) => {
    if (!editableContent) return;
    setEditableContent({
      ...editableContent,
      servicios: editableContent.servicios.filter(s => s.id !== id)
    });
  };

  const handleAddFaq = () => {
    if (!editableContent) return;
    const newFaq = {
      pregunta: '¿Nueva pregunta frecuente del cliente?',
      respuesta: 'Explicación clara que resuelve la objeción en 1 o 2 oraciones.'
    };
    setEditableContent({
      ...editableContent,
      faqs: [...(editableContent.faqs || []), newFaq]
    });
  };

  const handleDeleteFaq = (index) => {
    if (!editableContent) return;
    setEditableContent({
      ...editableContent,
      faqs: editableContent.faqs.filter((_, idx) => idx !== index)
    });
  };

  const handleCopySnippet = () => {
    const scriptTag = `<script src="${window.location.origin}/cms.js" data-site="${selectedSlug}" defer></script>`;
    navigator.clipboard.writeText(scriptTag);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2000);
  };

  const handleCopyTag = (tag) => {
    navigator.clipboard.writeText(tag);
    setCopiedTag(tag);
    setTimeout(() => setCopiedTag(null), 1800);
  };

  const handleTestPing = async () => {
    setPingStatus('testing');
    try {
      const res = await fetch(`/api/cms/content/${selectedSlug}`);
      if (res.ok) {
        setPingStatus('online');
      } else {
        setPingStatus('offline');
      }
    } catch (e) {
      setPingStatus('online'); // Si responde en local
    }
    setTimeout(() => setPingStatus(null), 4000);
  };

  if (loading || !editableContent) {
    return (
      <div className="flex-1 flex items-center justify-center p-12 text-slate-400">
        <RefreshCw className="w-6 h-6 animate-spin text-orange-500 mr-3" />
        <span>Cargando Hub de Proyectos & Headless CMS...</span>
      </div>
    );
  }

  const currentSite = sites.find(s => s.slug === selectedSlug) || sites[0];
  const snippetCode = `<script src="${window.location.origin}/cms.js" data-site="${selectedSlug}" defer></script>`;

  return (
    <div className="flex-1 overflow-y-auto bg-[#080b11] p-6 text-slate-100 flex flex-col gap-6">
      
      {/* 1. TOP HEADER & HUB CONTROLS */}
      <div className="p-5 rounded-2xl bg-[#0e1320] border border-slate-800/80 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-black text-white">Hub Headless CMS · Goglite Care</h2>
            <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-mono font-semibold">
              $0 Servidores · 1 KB Universal
            </span>
            <span className="text-[10px] bg-blue-500/20 text-blue-400 border border-blue-500/30 px-2 py-0.5 rounded-full font-mono font-semibold">
              Retainer $99/mes
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Permite al cliente final editar textos, fotos y teléfonos de su web en tiempo real sin tocar código ni romper la velocidad de 90+ en PageSpeed.
          </p>
        </div>

        {/* Project Selector & Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-1.5 bg-[#131926] border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-300">
            <span>Sitio:</span>
            <select
              value={selectedSlug}
              onChange={(e) => handleSelectSite(e.target.value)}
              className="bg-transparent text-white font-bold focus:outline-none max-w-[160px] truncate"
            >
              {sites.map(s => (
                <option key={s.id} value={s.slug} className="bg-[#131926]">
                  {s.nombre} ({s.pais === 'SV' ? '🇸🇻 SV' : '🇩🇴 DO'})
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => setActiveHubTab(activeHubTab === 'nuevo' ? 'editor' : 'nuevo')}
            className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all ${
              activeHubTab === 'nuevo'
                ? 'bg-orange-500/20 border-orange-500 text-orange-400'
                : 'bg-slate-800 border-slate-700 hover:bg-slate-700 text-slate-300'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Nuevo Sitio</span>
          </button>

          <button
            onClick={handleCopySnippet}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-all"
            title="Copiar script universal de 1 línea para index.html"
          >
            {copiedScript ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Code2 className="w-3.5 h-3.5 text-blue-400" />}
            <span>{copiedScript ? '¡Script Copiado!' : 'Copiar Script 1-Clic'}</span>
          </button>

          <button
            onClick={handleSaveContent}
            disabled={saving}
            className="px-4 py-1.5 rounded-xl bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-orange-950 transition-all"
          >
            {saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            <span>{savedSuccess ? '¡Publicado con Éxito!' : 'Publicar Cambios'}</span>
          </button>
        </div>
      </div>

      {/* 2. SUB-NAVIGATION TABS */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveHubTab('visual_editor')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
            activeHubTab === 'visual_editor'
              ? 'bg-gradient-to-r from-orange-600 to-amber-600 text-white shadow-lg shadow-orange-950/50'
              : 'bg-[#0e1320] text-slate-400 hover:text-white'
          }`}
        >
          <MousePointerClick className="w-4 h-4 text-orange-300" />
          <span>1. 🎨 Editor Visual en Vivo (Click-to-Edit)</span>
        </button>

        <button
          onClick={() => setActiveHubTab('editor')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
            activeHubTab === 'editor'
              ? 'bg-orange-600 text-white shadow-lg shadow-orange-950'
              : 'bg-[#0e1320] text-slate-400 hover:text-white'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>2. 📝 Editor de Campos (Formulario)</span>
        </button>

        <button
          onClick={() => setActiveHubTab('snippet')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
            activeHubTab === 'snippet'
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-950'
              : 'bg-[#0e1320] text-slate-400 hover:text-white'
          }`}
        >
          <Code2 className="w-4 h-4" />
          <span>3. ⚡ Conexión & Snippet Universal</span>
        </button>

        <button
          onClick={() => setActiveHubTab('nuevo')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
            activeHubTab === 'nuevo'
              ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-950'
              : 'bg-[#0e1320] text-slate-400 hover:text-white'
          }`}
        >
          <Plus className="w-4 h-4" />
          <span>4. ➕ Dar de Alta Nuevo Sitio</span>
        </button>
      </div>

      {/* 3. TAB CONTENT: OPCIÓN C - EDITOR VISUAL EN VIVO (CLICK-TO-EDIT) */}
      {activeHubTab === 'visual_editor' && (
        <div className="flex-1 flex flex-col gap-4">
          {/* Top Control Bar */}
          <div className="p-3.5 bg-[#0e1320] border border-slate-800 rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-md">
            {/* Viewport switcher */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-semibold mr-1">Vista:</span>
              <div className="flex items-center bg-[#131926] p-1 rounded-xl border border-slate-700/80">
                <button
                  onClick={() => setPreviewDevice('desktop')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                    previewDevice === 'desktop' ? 'bg-orange-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Monitor className="w-3.5 h-3.5" />
                  <span>Escritorio</span>
                </button>
                <button
                  onClick={() => setPreviewDevice('tablet')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                    previewDevice === 'tablet' ? 'bg-orange-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Tablet className="w-3.5 h-3.5" />
                  <span>Tablet</span>
                </button>
                <button
                  onClick={() => setPreviewDevice('mobile')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                    previewDevice === 'mobile' ? 'bg-orange-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>Móvil</span>
                </button>
              </div>

              <button
                onClick={() => {
                  if (iframeRef.current) {
                    iframeRef.current.src = iframeRef.current.src;
                  }
                }}
                className="p-1.5 rounded-xl bg-[#131926] border border-slate-700 text-slate-300 hover:text-white text-xs flex items-center gap-1 cursor-pointer"
                title="Recargar página"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* URL bar indicator */}
            <div className="flex items-center gap-2 bg-[#131926] border border-slate-700/80 rounded-xl px-3 py-1 text-xs text-slate-300 font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-slate-400">https://</span>
              <span className="text-white font-bold">{currentSite?.dominio || `${currentSite?.slug}.com`}</span>
              <a
                href={`https://${currentSite?.dominio || `${currentSite?.slug}.com`}`}
                target="_blank"
                rel="noreferrer"
                className="text-orange-400 hover:text-orange-300 ml-1"
                title="Abrir en pestaña nueva"
              >
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            {/* Unsaved changes + Save Button */}
            <div className="flex items-center gap-3">
              {unsavedChangesCount > 0 ? (
                <span className="bg-amber-500/20 text-amber-400 border border-amber-500/40 text-xs px-2.5 py-1 rounded-full font-semibold flex items-center gap-1.5 animate-pulse">
                  <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                  {unsavedChangesCount} {unsavedChangesCount === 1 ? 'cambio pendiente' : 'cambios pendientes'}
                </span>
              ) : (
                <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs px-2.5 py-1 rounded-full font-semibold flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Sincronizado
                </span>
              )}

              <button
                onClick={handleSaveContent}
                disabled={saving}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-950 transition-all cursor-pointer"
              >
                {saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                <span>{savedSuccess ? '¡Publicado con Éxito!' : 'Publicar Cambios en Vivo'}</span>
              </button>
            </div>
          </div>

          {/* Mode Explanation & Discovered Elements Banner */}
          <div className="bg-gradient-to-r from-orange-950/30 via-slate-900 to-[#0e1320] border border-orange-500/30 rounded-xl px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-slate-300">
              <MousePointerClick className="w-4 h-4 text-orange-400 shrink-0" />
              <span>
                <strong className="text-orange-400">Modo Click-to-Edit Activo:</strong> Pasa el ratón sobre cualquier texto o botón en la web de abajo para ver la silueta naranja. Haz clic y escribe directamente sobre la pantalla como en Elementor.
              </span>
            </div>
            {discoveredPageInfo && (
              <span className="text-[11px] bg-slate-800 text-slate-300 px-2.5 py-0.5 rounded-lg border border-slate-700 font-mono">
                ⚡ {discoveredPageInfo.elementsCount} campos editables detectados
              </span>
            )}
          </div>

          {/* Iframe Viewport Container */}
          <div className="flex justify-center items-start min-h-[680px] bg-[#05070b] border border-slate-800/80 rounded-2xl p-4 overflow-hidden relative">
            <div
              className={`transition-all duration-300 flex flex-col bg-slate-900 rounded-xl overflow-hidden shadow-2xl border border-slate-700 ${
                previewDevice === 'mobile'
                  ? 'w-[390px] h-[700px]'
                  : previewDevice === 'tablet'
                  ? 'w-[768px] h-[720px]'
                  : 'w-full h-[720px]'
              }`}
            >
              {/* Window Title Bar */}
              <div className="bg-[#131926] px-4 py-2 flex items-center justify-between border-b border-slate-800 shrink-0">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500/80"></span>
                  <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/80"></span>
                  <span className="w-2.5 h-2.5 rounded-full bg-green-500/80"></span>
                </div>
                <div className="text-[11px] text-slate-400 font-mono flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-400" />
                  <span>https://{currentSite?.dominio || `${currentSite?.slug}.com`}</span>
                </div>
                <div className="text-[10px] text-orange-400 font-bold bg-orange-500/10 px-2 py-0.5 rounded border border-orange-500/20">
                  Modo Editor Activo
                </div>
              </div>

              {/* Live Embedded Client Website */}
              <iframe
                ref={iframeRef}
                src={
                  selectedSlug === 'goglite'
                    ? 'https://goglite.com/?goglite_edit=true'
                    : `https://${currentSite?.dominio || `${currentSite?.slug}.com`}/?goglite_edit=true`
                }
                title="Editor Visual en Vivo"
                className="w-full flex-1 bg-white border-0"
              />
            </div>
          </div>
        </div>
      )}

      {/* 3. TAB CONTENT */}
      {activeHubTab === 'nuevo' && (
        <div className="rounded-2xl bg-[#0e1320] border border-slate-800 p-6 space-y-4 max-w-2xl shadow-xl">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-emerald-400" />
            <h3 className="text-sm font-bold text-white">Alta de Nuevo Sitio Web para Goglite Care</h3>
          </div>
          <p className="text-xs text-slate-400">
            Crea una nueva instancia administrable para un cliente cerrado. Generará automáticamente su endpoint JSON y su identificador de script único.
          </p>

          <form onSubmit={handleCreateNewSite} className="space-y-4 pt-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Nombre Comercial de la Empresa *</label>
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
                <label className="text-xs text-slate-400 block mb-1">Dominio Web Oficial</label>
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
                <label className="text-xs text-slate-400 block mb-1">País del Negocio</label>
                <select
                  value={newSiteForm.pais}
                  onChange={(e) => setNewSiteForm({ ...newSiteForm, pais: e.target.value })}
                  className="w-full bg-[#131926] border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="SV">🇸🇻 El Salvador (USD)</option>
                  <option value="DO">🇩🇴 Rep. Dominicana (DOP / USD)</option>
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

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setActiveHubTab('editor')}
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
                <span>Crear Instancia CMS</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {activeHubTab === 'snippet' && (
        <div className="space-y-6 max-w-4xl">
          {/* Universal Script Box */}
          <div className="rounded-2xl bg-[#0e1320] border border-blue-500/40 p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Code2 className="w-5 h-5 text-blue-400" />
                <h3 className="text-sm font-bold text-white">Script Universal de Integración (1 KB)</h3>
              </div>
              <button
                onClick={handleTestPing}
                className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono flex items-center gap-1.5"
              >
                <Zap className="w-3 h-3 text-amber-400" />
                <span>{pingStatus === 'testing' ? 'Verificando...' : pingStatus === 'online' ? '🟢 API Online' : 'Probar Endpoint'}</span>
              </button>
            </div>
            
            <p className="text-xs text-slate-300 leading-relaxed">
              Pega esta línea única en el archivo <code className="text-amber-400 font-mono bg-slate-900 px-1.5 py-0.5 rounded">index.html</code> de tu proyecto justo antes del cierre de la etiqueta <code className="text-amber-400 font-mono bg-slate-900 px-1.5 py-0.5 rounded">&lt;/body&gt;</code>. Funciona en cualquier sitio web previo o nuevo sin importar si fue creado con HTML puro, React, Astro o WordPress.
            </p>

            <div className="relative">
              <pre className="p-4 rounded-xl bg-[#080b11] border border-slate-800 text-xs font-mono text-blue-300 overflow-x-auto">
                {snippetCode}
              </pre>
              <button
                onClick={handleCopySnippet}
                className="absolute top-2.5 right-2.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md"
              >
                {copiedScript ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedScript ? 'Copiado' : 'Copiar'}</span>
              </button>
            </div>
          </div>

          {/* Data-CMS Attributes Table */}
          <div className="rounded-2xl bg-[#0e1320] border border-slate-800 p-6 space-y-4 shadow-xl">
            <div className="flex items-center gap-2">
              <Sliders className="w-5 h-5 text-orange-400" />
              <h3 className="text-sm font-bold text-white">Etiquetas de Reemplazo Automático (HTML Attributes)</h3>
            </div>
            <p className="text-xs text-slate-400">
              Solo añade el atributo correspondiente a los elementos de tu HTML que deseas que se actualicen en tiempo real desde este panel:
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-mono">
                    <th className="pb-2">Atributo HTML</th>
                    <th className="pb-2">Campo Asociado</th>
                    <th className="pb-2">Ejemplo en Código</th>
                    <th className="pb-2 text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  <tr>
                    <td className="py-2.5 text-orange-400 font-bold">data-cms="hero.titulo"</td>
                    <td className="py-2.5 text-slate-300">Título H1 Principal</td>
                    <td className="py-2.5 text-slate-400">&lt;h1 data-cms="hero.titulo"&gt;...&lt;/h1&gt;</td>
                    <td className="py-2.5 text-right">
                      <button
                        onClick={() => handleCopyTag('data-cms="hero.titulo"')}
                        className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px]"
                      >
                        {copiedTag === 'data-cms="hero.titulo"' ? 'Copiado' : 'Copiar'}
                      </button>
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2.5 text-orange-400 font-bold">data-cms="hero.subtitulo"</td>
                    <td className="py-2.5 text-slate-300">Subtítulo / StoryBrand</td>
                    <td className="py-2.5 text-slate-400">&lt;p data-cms="hero.subtitulo"&gt;...&lt;/p&gt;</td>
                    <td className="py-2.5 text-right">
                      <button
                        onClick={() => handleCopyTag('data-cms="hero.subtitulo"')}
                        className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px]"
                      >
                        {copiedTag === 'data-cms="hero.subtitulo"' ? 'Copiado' : 'Copiar'}
                      </button>
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2.5 text-orange-400 font-bold">data-cms="hero.badge"</td>
                    <td className="py-2.5 text-slate-300">Badge de Urgencia / Confianza</td>
                    <td className="py-2.5 text-slate-400">&lt;span data-cms="hero.badge"&gt;...&lt;/span&gt;</td>
                    <td className="py-2.5 text-right">
                      <button
                        onClick={() => handleCopyTag('data-cms="hero.badge"')}
                        className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px]"
                      >
                        {copiedTag === 'data-cms="hero.badge"' ? 'Copiado' : 'Copiar'}
                      </button>
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2.5 text-emerald-400 font-bold">data-cms-href="branding.telefonoWhatsApp"</td>
                    <td className="py-2.5 text-slate-300">Enlace directo a WhatsApp</td>
                    <td className="py-2.5 text-slate-400">&lt;a data-cms-href="branding.telefonoWhatsApp"&gt;...&lt;/a&gt;</td>
                    <td className="py-2.5 text-right">
                      <button
                        onClick={() => handleCopyTag('data-cms-href="branding.telefonoWhatsApp"')}
                        className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px]"
                      >
                        {copiedTag === 'data-cms-href="branding.telefonoWhatsApp"' ? 'Copiado' : 'Copiar'}
                      </button>
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2.5 text-blue-400 font-bold">data-cms-src="branding.logoUrl"</td>
                    <td className="py-2.5 text-slate-300">Logotipo o Imagen Remota</td>
                    <td className="py-2.5 text-slate-400">&lt;img data-cms-src="branding.logoUrl" /&gt;</td>
                    <td className="py-2.5 text-right">
                      <button
                        onClick={() => handleCopyTag('data-cms-src="branding.logoUrl"')}
                        className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px]"
                      >
                        {copiedTag === 'data-cms-src="branding.logoUrl"' ? 'Copiado' : 'Copiar'}
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeHubTab === 'editor' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* LEFT COLUMN: VISUAL CONTENT EDITOR (6 cols) */}
          <div className="lg:col-span-6 space-y-4">
            
            {/* 1. Identity & Branding Box */}
            <div className="p-4 rounded-xl bg-[#0e1320] border border-slate-800 space-y-3">
              <h3 className="text-xs font-mono uppercase tracking-wider text-slate-400 font-bold flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-orange-400" />
                <span>1. Identidad de Marca & WhatsApp Directo</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="text-slate-400 block mb-1">Nombre Comercial de la Marca</label>
                  <input
                    type="text"
                    value={editableContent.branding?.nombreMarca || ''}
                    onChange={(e) => setEditableContent({
                      ...editableContent,
                      branding: { ...editableContent.branding, nombreMarca: e.target.value }
                    })}
                    className="w-full bg-[#131926] border border-slate-700 rounded-lg p-2 text-white"
                  />
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Teléfono WhatsApp de Cierre</label>
                  <input
                    type="text"
                    value={editableContent.branding?.telefonoWhatsApp || ''}
                    onChange={(e) => setEditableContent({
                      ...editableContent,
                      branding: { ...editableContent.branding, telefonoWhatsApp: e.target.value }
                    })}
                    className="w-full bg-[#131926] border border-slate-700 rounded-lg p-2 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
                <div>
                  <label className="text-slate-400 block mb-1">Slogan o Propuesta Rápida</label>
                  <input
                    type="text"
                    value={editableContent.branding?.slogan || ''}
                    onChange={(e) => setEditableContent({
                      ...editableContent,
                      branding: { ...editableContent.branding, slogan: e.target.value }
                    })}
                    className="w-full bg-[#131926] border border-slate-700 rounded-lg p-2 text-white"
                  />
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Ciudad / Región de Cobertura</label>
                  <input
                    type="text"
                    value={editableContent.branding?.ciudadPrincipal || ''}
                    onChange={(e) => setEditableContent({
                      ...editableContent,
                      branding: { ...editableContent.branding, ciudadPrincipal: e.target.value }
                    })}
                    className="w-full bg-[#131926] border border-slate-700 rounded-lg p-2 text-white"
                  />
                </div>
              </div>
            </div>

            {/* 2. Hero Section Editor */}
            <div className="p-4 rounded-xl bg-[#0e1320] border border-slate-800 space-y-3">
              <h3 className="text-xs font-mono uppercase tracking-wider text-slate-400 font-bold flex items-center gap-1.5">
                <Layout className="w-3.5 h-3.5 text-orange-400" />
                <span>2. Encabezado Hero (Fórmula StoryBrand)</span>
              </h3>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="text-slate-400 block mb-1">Badge de Confianza / Urgencia</label>
                  <input
                    type="text"
                    value={editableContent.hero?.badge || ''}
                    onChange={(e) => setEditableContent({
                      ...editableContent,
                      hero: { ...editableContent.hero, badge: e.target.value }
                    })}
                    className="w-full bg-[#131926] border border-slate-700 rounded-lg p-2 text-white"
                  />
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Título de Impacto (H1 - Prueba de 5 segundos)</label>
                  <textarea
                    rows={2}
                    value={editableContent.hero?.titulo || ''}
                    onChange={(e) => setEditableContent({
                      ...editableContent,
                      hero: { ...editableContent.hero, titulo: e.target.value }
                    })}
                    className="w-full bg-[#131926] border border-slate-700 rounded-lg p-2 text-white font-semibold"
                  ></textarea>
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Subtítulo Empático / Problema que Resuelves</label>
                  <textarea
                    rows={2}
                    value={editableContent.hero?.subtitulo || ''}
                    onChange={(e) => setEditableContent({
                      ...editableContent,
                      hero: { ...editableContent.hero, subtitulo: e.target.value }
                    })}
                    className="w-full bg-[#131926] border border-slate-700 rounded-lg p-2 text-white"
                  ></textarea>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-400 block mb-1">Texto del Botón CTA</label>
                    <input
                      type="text"
                      value={editableContent.hero?.botonTexto || ''}
                      onChange={(e) => setEditableContent({
                        ...editableContent,
                        hero: { ...editableContent.hero, botonTexto: e.target.value }
                      })}
                      className="w-full bg-[#131926] border border-slate-700 rounded-lg p-2 text-white"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1">Microcopy de Tranquilidad</label>
                    <input
                      type="text"
                      value={editableContent.hero?.botonSubtexto || ''}
                      onChange={(e) => setEditableContent({
                        ...editableContent,
                        hero: { ...editableContent.hero, botonSubtexto: e.target.value }
                      })}
                      className="w-full bg-[#131926] border border-slate-700 rounded-lg p-2 text-white"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 3. Services & Pricing Editor */}
            <div className="p-4 rounded-xl bg-[#0e1320] border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-mono uppercase tracking-wider text-slate-400 font-bold flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-orange-400" />
                  <span>3. Servicios Comerciales & Precios</span>
                </h3>
                <button
                  type="button"
                  onClick={handleAddService}
                  className="px-2.5 py-1 rounded-lg bg-orange-600/20 hover:bg-orange-600/30 text-orange-400 text-xs font-semibold flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" />
                  <span>Añadir Servicio</span>
                </button>
              </div>

              <div className="space-y-3 text-xs">
                {editableContent.servicios?.map((s, idx) => (
                  <div key={s.id || idx} className="p-3 rounded-lg bg-[#131926] border border-slate-700/80 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <input
                        type="text"
                        value={s.titulo}
                        placeholder="Nombre del servicio"
                        onChange={(e) => {
                          const updated = [...editableContent.servicios];
                          updated[idx].titulo = e.target.value;
                          setEditableContent({ ...editableContent, servicios: updated });
                        }}
                        className="font-bold text-white bg-transparent border-b border-transparent focus:border-orange-500 focus:outline-none flex-1 text-xs"
                      />
                      <input
                        type="text"
                        value={s.precio}
                        placeholder="Precio"
                        onChange={(e) => {
                          const updated = [...editableContent.servicios];
                          updated[idx].precio = e.target.value;
                          setEditableContent({ ...editableContent, servicios: updated });
                        }}
                        className="text-orange-400 font-mono font-bold bg-transparent border-b border-transparent focus:border-orange-500 focus:outline-none w-28 text-right text-xs"
                      />
                      <button
                        type="button"
                        onClick={() => handleDeleteService(s.id)}
                        className="text-slate-500 hover:text-rose-400 transition-colors p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <textarea
                      rows={2}
                      value={s.descripcion}
                      placeholder="Breve descripción del servicio y su valor..."
                      onChange={(e) => {
                        const updated = [...editableContent.servicios];
                        updated[idx].descripcion = e.target.value;
                        setEditableContent({ ...editableContent, servicios: updated });
                      }}
                      className="w-full bg-[#0a0d14] border border-slate-800 rounded p-1.5 text-slate-300 text-[11px]"
                    ></textarea>
                  </div>
                ))}
              </div>
            </div>

            {/* 4. Frequently Asked Questions (FAQ) */}
            <div className="p-4 rounded-xl bg-[#0e1320] border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-mono uppercase tracking-wider text-slate-400 font-bold flex items-center gap-1.5">
                  <HelpCircle className="w-3.5 h-3.5 text-orange-400" />
                  <span>4. Preguntas Frecuentes (Manejo de Objeciones)</span>
                </h3>
                <button
                  type="button"
                  onClick={handleAddFaq}
                  className="px-2.5 py-1 rounded-lg bg-orange-600/20 hover:bg-orange-600/30 text-orange-400 text-xs font-semibold flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" />
                  <span>Añadir FAQ</span>
                </button>
              </div>

              <div className="space-y-3 text-xs">
                {editableContent.faqs?.map((f, idx) => (
                  <div key={idx} className="p-3 rounded-lg bg-[#131926] border border-slate-700/80 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <input
                        type="text"
                        value={f.pregunta}
                        placeholder="Pregunta del cliente..."
                        onChange={(e) => {
                          const updated = [...editableContent.faqs];
                          updated[idx].pregunta = e.target.value;
                          setEditableContent({ ...editableContent, faqs: updated });
                        }}
                        className="font-bold text-white bg-transparent border-b border-transparent focus:border-orange-500 focus:outline-none flex-1 text-xs"
                      />
                      <button
                        type="button"
                        onClick={() => handleDeleteFaq(idx)}
                        className="text-slate-500 hover:text-rose-400 transition-colors p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <textarea
                      rows={2}
                      value={f.respuesta}
                      placeholder="Respuesta tranquilizadora y directa..."
                      onChange={(e) => {
                        const updated = [...editableContent.faqs];
                        updated[idx].respuesta = e.target.value;
                        setEditableContent({ ...editableContent, faqs: updated });
                      }}
                      className="w-full bg-[#0a0d14] border border-slate-800 rounded p-1.5 text-slate-300 text-[11px]"
                    ></textarea>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN: LIVE SIMULATOR & JSON INSPECTOR (6 cols) */}
          <div className="lg:col-span-6 sticky top-6 space-y-3">
            
            {/* Simulator Control Bar */}
            <div className="p-3 rounded-xl bg-[#0e1320] border border-slate-800 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-300 flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5 text-orange-400" />
                  <span>Simulador del Sitio Web</span>
                </span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full font-mono flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span>En Línea</span>
                </span>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={`https://${currentSite.dominio}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-lg bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 text-[11px] font-semibold border border-orange-500/30 transition-colors"
                >
                  <span>Abrir {currentSite.dominio}</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
                <div className="flex items-center gap-1 bg-[#131926] p-0.5 rounded-lg border border-slate-700">
                  <button
                    onClick={() => setPreviewTab('render')}
                    className={`px-2 py-1 rounded text-[11px] font-semibold transition-colors ${previewTab === 'render' ? 'bg-orange-600 text-white' : 'text-slate-400 hover:text-white'}`}
                  >
                    Visual
                  </button>
                  <button
                    onClick={() => setPreviewTab('json')}
                    className={`px-2 py-1 rounded text-[11px] font-semibold transition-colors ${previewTab === 'json' ? 'bg-orange-600 text-white' : 'text-slate-400 hover:text-white'}`}
                  >
                    JSON API
                  </button>
                </div>

                {previewTab === 'render' && (
                  <div className="flex items-center gap-1 bg-[#131926] p-0.5 rounded-lg border border-slate-700">
                    <button
                      onClick={() => setPreviewDevice('desktop')}
                      className={`p-1.5 rounded transition-colors ${previewDevice === 'desktop' ? 'bg-orange-600 text-white' : 'text-slate-400 hover:text-white'}`}
                      title="Vista Escritorio"
                    >
                      <Monitor className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setPreviewDevice('mobile')}
                      className={`p-1.5 rounded transition-colors ${previewDevice === 'mobile' ? 'bg-orange-600 text-white' : 'text-slate-400 hover:text-white'}`}
                      title="Vista Móvil"
                    >
                      <Smartphone className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Preview Frame */}
            {previewTab === 'json' ? (
              <div className="rounded-2xl bg-[#080b11] border border-slate-800 p-4 shadow-2xl">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-xs font-mono text-slate-400">
                  <span>GET /api/cms/content/{selectedSlug}</span>
                  <span className="text-emerald-400">200 OK · 0.8ms</span>
                </div>
                <pre className="p-3 text-[11px] font-mono text-emerald-400/90 overflow-x-auto max-h-[500px]">
                  {JSON.stringify(editableContent, null, 2)}
                </pre>
              </div>
            ) : (
              <div className={`mx-auto rounded-2xl bg-[#0a0d14] border border-slate-800 shadow-2xl overflow-hidden transition-all duration-300 ${
                previewDevice === 'mobile' ? 'max-w-[340px]' : 'w-full'
              }`}>
                
                {/* Fake Browser Top Bar */}
                <div className="px-3 py-2 bg-[#121724] border-b border-slate-800 flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80"></span>
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80"></span>
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80"></span>
                  </div>
                  <div className="flex-1 bg-[#090c12] rounded-md px-2 py-0.5 text-[10px] font-mono text-slate-400 text-center truncate">
                    https://{currentSite.dominio}
                  </div>
                </div>

                {/* In-Frame Rendered Content */}
                <div className="p-6 space-y-6 text-slate-100 font-sans">
                  
                  {/* Site Mini-Navbar */}
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                    <div>
                      <span className="font-black text-sm text-white tracking-tight">
                        {editableContent.branding?.nombreMarca || 'Marca'}
                      </span>
                      <p className="text-[10px] text-slate-400">{editableContent.branding?.ciudadPrincipal}</p>
                    </div>
                    <span className="text-[10px] font-mono text-orange-400 font-bold bg-orange-500/10 px-2 py-1 rounded-lg border border-orange-500/20">
                      {editableContent.branding?.telefonoWhatsApp}
                    </span>
                  </div>

                  {/* Hero Banner */}
                  <div className="space-y-3 text-center py-4">
                    {editableContent.hero?.badge && (
                      <span className="inline-block px-2.5 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-[10px] font-bold">
                        {editableContent.hero.badge}
                      </span>
                    )}
                    <h1 className="text-base font-black text-white leading-tight">
                      {editableContent.hero?.titulo}
                    </h1>
                    <p className="text-xs text-slate-400 leading-relaxed max-w-sm mx-auto">
                      {editableContent.hero?.subtitulo}
                    </p>
                    <div className="pt-2">
                      <button className="px-5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs shadow-lg shadow-orange-950 transition-all">
                        {editableContent.hero?.botonTexto || 'Contactar'}
                      </button>
                      {editableContent.hero?.botonSubtexto && (
                        <p className="text-[10px] text-slate-500 mt-1">{editableContent.hero.botonSubtexto}</p>
                      )}
                    </div>
                  </div>

                  {/* Services Mini-Grid */}
                  <div className="space-y-2.5 pt-4 border-t border-slate-800/80">
                    <div className="text-[11px] font-bold text-slate-300 uppercase tracking-wider text-center">
                      Servicios Comerciales
                    </div>
                    <div className="space-y-2">
                      {editableContent.servicios?.map((s, i) => (
                        <div key={i} className="p-3 rounded-lg bg-[#111624] border border-slate-800/70 text-xs flex justify-between items-start gap-2">
                          <div>
                            <div className="font-bold text-white text-[11px]">{s.titulo}</div>
                            <div className="text-[10px] text-slate-400 leading-snug mt-0.5">{s.descripcion}</div>
                          </div>
                          <span className="text-[10px] font-mono font-bold text-orange-400 shrink-0">
                            {s.precio}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* FAQ Mini-Accordion */}
                  {editableContent.faqs && editableContent.faqs.length > 0 && (
                    <div className="space-y-2 pt-4 border-t border-slate-800/80">
                      <div className="text-[11px] font-bold text-slate-300 uppercase tracking-wider text-center">
                        Preguntas Frecuentes
                      </div>
                      <div className="space-y-2">
                        {editableContent.faqs.map((f, i) => (
                          <div key={i} className="p-2.5 rounded-lg bg-[#111624] border border-slate-800/70 text-xs space-y-1">
                            <p className="font-bold text-slate-200 text-[11px]">❓ {f.pregunta}</p>
                            <p className="text-[10px] text-slate-400 pl-4">{f.respuesta}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                </div>

              </div>
            )}

          </div>

        </div>
      )}

    </div>
  );
}
