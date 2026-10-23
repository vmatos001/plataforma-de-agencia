import React, { useState, useEffect } from 'react';
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
  Award
} from 'lucide-react';

const DEFAULT_CHECKLIST_ITEMS = [
  // 1. SEO Semántico & Indexabilidad
  {
    id: 'chk-title',
    categoria: 'SEO & Indexabilidad',
    item: 'Meta Title optimizado (50-60 caracteres) con palabra clave principal y ciudad',
    descripcion: 'Aparece en la pestaña del navegador y en el enlace azul de Google.',
    critico: true,
    toolLink: null
  },
  {
    id: 'chk-desc',
    categoria: 'SEO & Indexabilidad',
    item: 'Meta Description con gancho comercial y llamada a la acción (< 155 caracteres)',
    descripcion: 'Texto que resume el servicio bajo el título en Google.',
    critico: true,
    toolLink: null
  },
  {
    id: 'chk-h1',
    categoria: 'SEO & Indexabilidad',
    item: 'Jerarquía semántica de encabezados (único H1 descriptivo por página)',
    descripcion: 'Google y los lectores de pantalla leen la estructura H1 > H2 > H3.',
    critico: true,
    toolLink: null
  },
  {
    id: 'chk-schema',
    categoria: 'SEO & Indexabilidad',
    item: 'Schema.org JSON-LD específico implementado a medida en código y validado',
    descripcion: 'Datos estructurados para LocalBusiness, MedicalBusiness, etc. sin errores.',
    critico: true,
    toolType: 'rich_results'
  },
  {
    id: 'chk-robots',
    categoria: 'SEO & Indexabilidad',
    item: 'Archivo robots.txt y sitemap.xml accesibles en la raíz del dominio',
    descripcion: 'Permite el rastreo de Google y autoriza a bots de IA (GPTBot, PerplexityBot).',
    critico: false,
    toolType: 'robots'
  },
  {
    id: 'chk-og',
    categoria: 'SEO & Indexabilidad',
    item: 'Etiquetas Open Graph (og:title, og:image, og:description) configuradas',
    descripcion: 'Genera la tarjeta visual con imagen al compartir el enlace por WhatsApp o redes.',
    critico: false,
    toolLink: null
  },

  // 2. Rendimiento & Core Web Vitals (Lighthouse)
  {
    id: 'chk-pagespeed',
    categoria: 'Rendimiento & Lighthouse',
    item: 'Puntuación móvil en Google Lighthouse / PageSpeed superior a 90 puntos',
    descripcion: 'Velocidad de carga inmediata en redes móviles 4G/5G de El Salvador y Rep. Dominicana.',
    critico: true,
    toolType: 'pagespeed'
  },
  {
    id: 'chk-webp',
    categoria: 'Rendimiento & Lighthouse',
    item: 'Imágenes comprimidas en formato moderno WebP/AVIF con dimensiones explícitas',
    descripcion: 'Reduce el peso de la página a menos de 1.5 MB y previene saltos de diseño (CLS).',
    critico: true,
    toolLink: null
  },
  {
    id: 'chk-defer',
    categoria: 'Rendimiento & Lighthouse',
    item: 'Cero bloqueo de renderizado inicial (scripts diferidos con defer o async)',
    descripcion: 'El navegador pinta el contenido visible (LCP) en menos de 1.2 segundos.',
    critico: false,
    toolLink: null
  },

  // 3. Canales de Conversión & Mobile UX
  {
    id: 'chk-whatsapp',
    categoria: 'Conversión & Mobile UX',
    item: 'Botón flotante de WhatsApp verificado con mensaje comercial predeterminado',
    descripcion: 'Al presionar abre la app oficial con el texto: "Hola, vi su sitio web y deseo información..."',
    critico: true,
    toolLink: null
  },
  {
    id: 'chk-call',
    categoria: 'Conversión & Mobile UX',
    item: 'Enlace telefónico directo Click-to-Call (tel:) probado en teléfono inteligente',
    descripcion: 'Permite marcar en 1 solo toque desde el móvil sin tener que memorizar el número.',
    critico: true,
    toolLink: null
  },
  {
    id: 'chk-form',
    categoria: 'Conversión & Mobile UX',
    item: 'Formulario de contacto probado de punta a punta con confirmación visual',
    descripcion: 'Valida correo/teléfono y muestra mensaje de éxito al prospecto.',
    critico: true,
    toolLink: null
  },
  {
    id: 'chk-responsive',
    categoria: 'Conversión & Mobile UX',
    item: 'Diseño 100% responsive probado en pantallas móviles sin desbordamiento horizontal',
    descripcion: 'Sin barras de desplazamiento horizontal molestas; botones con tamaño táctil adecuado (>44px).',
    critico: true,
    toolLink: null
  },

  // 4. Seguridad, Dominio & Analítica
  {
    id: 'chk-ssl',
    categoria: 'Seguridad & Analítica',
    item: 'Certificado SSL / HTTPS forzado sin contenido mixto ni advertencias',
    descripcion: 'El candado de seguridad verde protege los datos del cliente e impulsa el SEO.',
    critico: true,
    toolType: 'ssl'
  },
  {
    id: 'chk-analytics',
    categoria: 'Seguridad & Analítica',
    item: 'Google Analytics 4 / Píxel de Meta disparando eventos de conversión',
    descripcion: 'Registra clics en WhatsApp (click_whatsapp) y llamadas telefónicas (click_to_call).',
    critico: true,
    toolType: 'analytics'
  },
  {
    id: 'chk-maps',
    categoria: 'Seguridad & Analítica',
    item: 'Ficha de Google Maps / Google Business vinculada con la URL y dirección oficial',
    descripcion: 'Sincroniza la ficha local en Google Maps con la web para dominar el Local Pack.',
    critico: false,
    toolType: 'maps'
  }
];

export default function SeoLaunchQaModule({ selectedCountry = 'SV' }) {
  const [proyectos, setProyectos] = useState([]);
  const [selectedProyectoId, setSelectedProyectoId] = useState('');
  const [siteUrl, setSiteUrl] = useState('');
  const [checklist, setChecklist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savedNotice, setSavedNotice] = useState(false);

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

      // Si no hay proyectos creados aún, generar proyecto de muestra para El Salvador o Rep. Dominicana
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

    if (savedData && Array.isArray(savedData.items)) {
      setChecklist(savedData.items);
      if (savedData.url) setSiteUrl(savedData.url);
    } else if (proj.launchQa && Array.isArray(proj.launchQa.items)) {
      setChecklist(proj.launchQa.items);
      if (proj.launchQa.url) setSiteUrl(proj.launchQa.url);
    } else {
      // Inicializar con la lista estándar de 15 puntos
      setChecklist(DEFAULT_CHECKLIST_ITEMS.map(item => ({ ...item, completado: false })));
    }
  };

  const handleSelectProject = (projId) => {
    setSelectedProyectoId(projId);
    loadChecklistForProject(projId);
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
    if (!window.confirm('¿Deseas reiniciar todas las casillas de verificación de este proyecto?')) return;
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

    // Guardar en localStorage
    try {
      localStorage.setItem(`goglite_launch_qa_${selectedProyectoId}`, JSON.stringify(dataToSave));

      // Sincronizar dentro del objeto proyecto si existe
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

  // Cálculo de Métricas de Calidad
  const totalItems = checklist.length;
  const completadosCount = checklist.filter(i => i.completado).length;
  const criticosTotal = checklist.filter(i => i.critico).length;
  const criticosCompletados = checklist.filter(i => i.critico && i.completado).length;
  const criticosPendientes = criticosTotal - criticosCompletados;

  const scoreSalud = totalItems > 0 ? Math.round((completadosCount / totalItems) * 100) : 0;
  const isAprobado = scoreSalud >= 90 && criticosPendientes === 0;

  // Extraer dominio limpio para enlaces externos
  const cleanDomain = siteUrl.replace(/^https?:\/\//i, '').replace(/\/.*$/, '').trim();

  // Generadores de Enlaces Oficiales de Google
  const getToolUrl = (toolType) => {
    const encodedUrl = encodeURIComponent(siteUrl.startsWith('http') ? siteUrl : `https://${siteUrl}`);
    switch (toolType) {
      case 'pagespeed':
        return `https://pagespeed.web.dev/analysis?url=${encodedUrl}`;
      case 'rich_results':
        return `https://search.google.com/test/rich-results?url=${encodedUrl}`;
      case 'ssl':
        return `https://www.sslshopper.com/ssl-checker.html#hostname=${encodeURIComponent(cleanDomain || 'google.com')}`;
      case 'robots':
        return siteUrl.startsWith('http') ? `${siteUrl.replace(/\/+$/, '')}/robots.txt` : `https://${cleanDomain}/robots.txt`;
      case 'analytics':
        return 'https://tagassistant.google.com/';
      case 'maps': {
        const currentProj = proyectos.find(p => p.id === selectedProyectoId);
        const term = encodeURIComponent(currentProj?.cliente?.empresa || cleanDomain);
        return `https://www.google.com/maps/search/${term}`;
      }
      default:
        return null;
    }
  };

  const currentProject = proyectos.find(p => p.id === selectedProyectoId) || proyectos[0];
  const categories = ['SEO & Indexabilidad', 'Rendimiento & Lighthouse', 'Conversión & Mobile UX', 'Seguridad & Analítica'];

  return (
    <div className="space-y-6 max-w-6xl mx-auto text-slate-100">
      
      {/* Toast Notification */}
      {savedNotice && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-emerald-600 text-white px-4 py-2.5 rounded-xl shadow-2xl font-bold text-xs animate-bounce">
          <Check className="w-4 h-4" />
          <span>Verificación guardada</span>
        </div>
      )}

      {/* Header Ejecutivo */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-[#0d121f] via-[#101726] to-[#141b2d] border border-orange-500/20 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-orange-400 uppercase tracking-wider mb-1">
              <ShieldCheck className="w-4 h-4 text-orange-400" />
              <span>Fase 5 · Control de Calidad Pre-Lanzamiento (Launch QA)</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-white">
              Checklist de Verificación & Control de Calidad Técnica
            </h1>
            <p className="text-xs text-slate-400 max-w-3xl mt-1 leading-relaxed">
              Protocolo riguroso antes de liberar cualquier proyecto al cliente. Verifica la programación a medida del agente (Schema, robots, meta tags) y audita velocidad, formularios, WhatsApp y certificados con herramientas oficiales.
            </p>
          </div>

          {/* Selector de Proyecto */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 shrink-0">
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
              onClick={() => window.print()}
              className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center justify-center gap-1.5 border border-slate-700 transition-colors shadow-sm"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimir Certificado</span>
            </button>
          </div>
        </div>

        {/* Barra de URL del Proyecto & Accesos Directos Oficiales */}
        <div className="mt-5 pt-5 border-t border-slate-800/80 space-y-3">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="flex items-center gap-2 bg-[#080b11] border border-slate-700 rounded-xl px-3 py-1.5 flex-1 shadow-inner">
              <Globe className="w-4 h-4 text-orange-400 shrink-0" />
              <span className="text-[11px] text-slate-400 font-mono shrink-0">URL del Sitio:</span>
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

            <div className="flex items-center gap-2">
              <button
                onClick={handleMarkAll}
                className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700"
              >
                Marcar Todo
              </button>
              <button
                onClick={handleResetChecklist}
                className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reiniciar</span>
              </button>
            </div>
          </div>

          {/* Enlaces de 1-Clic a Herramientas Oficiales */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider mr-1">
              Validadores Oficiales:
            </span>

            <a
              href={getToolUrl('pagespeed')}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-orange-500/10 hover:bg-orange-500/20 text-orange-300 border border-orange-500/30 text-[11px] font-semibold transition-colors"
            >
              <Zap className="w-3 h-3 text-orange-400" />
              <span>Google PageSpeed</span>
              <ExternalLink className="w-2.5 h-2.5 opacity-70" />
            </a>

            <a
              href={getToolUrl('rich_results')}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 border border-blue-500/30 text-[11px] font-semibold transition-colors"
            >
              <Search className="w-3 h-3 text-blue-400" />
              <span>Google Rich Results (Schema)</span>
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
              href={getToolUrl('robots')}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[11px] font-semibold transition-colors"
            >
              <FileText className="w-3 h-3 text-purple-400" />
              <span>Ver /robots.txt</span>
              <ExternalLink className="w-2.5 h-2.5 opacity-70" />
            </a>

            <a
              href="https://search.google.com/search-console"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-[11px] font-semibold transition-colors"
            >
              <Globe className="w-3 h-3 text-slate-400" />
              <span>Search Console</span>
              <ExternalLink className="w-2.5 h-2.5 opacity-70" />
            </a>
          </div>
        </div>

        {/* Resumen de Certificación de Calidad */}
        <div className="mt-5 pt-5 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className={`w-16 h-16 rounded-2xl border flex flex-col items-center justify-center font-mono font-black shadow-inner ${
              isAprobado
                ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                : scoreSalud >= 60
                ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                : 'bg-rose-500/20 border-rose-500/40 text-rose-300'
            }`}>
              <span className="text-2xl leading-none">{scoreSalud}%</span>
              <span className="text-[9px] uppercase tracking-wider text-slate-400 mt-1">Calidad</span>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-white">Estado de Aprobación:</span>
                <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${
                  isAprobado
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                }`}>
                  {isAprobado ? '✅ APROBADO PARA ENTREGA' : '⚠️ AJUSTES PENDIENTES'}
                </span>
              </div>
              <div className="text-xs text-slate-400 mt-1">
                <strong>{completadosCount} de {totalItems}</strong> requisitos superados · 
                {criticosPendientes === 0 ? (
                  <span className="text-emerald-400 font-semibold ml-1">Todos los puntos críticos cubiertos</span>
                ) : (
                  <span className="text-amber-400 font-semibold ml-1">{criticosPendientes} requisito(s) crítico(s) pendientes</span>
                )}
              </div>
            </div>
          </div>

          <div className="text-right hidden sm:block">
            <div className="text-[11px] text-slate-400 font-mono">Proyecto Auditado:</div>
            <div className="text-xs font-bold text-white truncate max-w-xs">
              {currentProject?.cliente?.empresa || 'Cliente Oficial'}
            </div>
          </div>
        </div>
      </div>

      {/* Checklist Maestro de Verificación (Dividido por Categorías Claras) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {categories.map((cat, catIdx) => {
          const items = checklist.filter(c => c.categoria === cat);
          const catCompletados = items.filter(i => i.completado).length;
          const isCatComplete = items.length > 0 && catCompletados === items.length;

          return (
            <div key={catIdx} className="p-5 rounded-2xl bg-[#0d121c] border border-slate-800 space-y-3.5 shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-black uppercase text-white tracking-wider">
                    {cat}
                  </h3>
                  {isCatComplete && (
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.2 rounded-full font-bold">
                      ✓ Completo
                    </span>
                  )}
                </div>
                <span className="text-[11px] text-slate-400 font-mono font-bold">
                  {catCompletados} / {items.length}
                </span>
              </div>

              <div className="space-y-2.5">
                {items.map(item => {
                  const directToolUrl = item.toolType ? getToolUrl(item.toolType) : null;

                  return (
                    <div
                      key={item.id}
                      className={`p-3.5 rounded-xl border transition-all ${
                        item.completado
                          ? 'bg-emerald-950/20 border-emerald-500/30'
                          : 'bg-[#111622] border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {/* Checkbox grande interactivo */}
                        <button
                          type="button"
                          onClick={() => handleToggleItem(item.id)}
                          className={`w-5 h-5 rounded-lg mt-0.5 flex items-center justify-center border shrink-0 transition-all cursor-pointer ${
                            item.completado
                              ? 'bg-emerald-500 border-emerald-400 text-white shadow-sm'
                              : 'border-slate-700 bg-slate-900 text-transparent hover:border-orange-500'
                          }`}
                        >
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </button>

                        <div className="flex-1 min-w-0">
                          <div 
                            onClick={() => handleToggleItem(item.id)}
                            className={`text-xs font-bold cursor-pointer select-none leading-snug ${
                              item.completado ? 'line-through text-slate-400' : 'text-slate-100'
                            }`}
                          >
                            {item.item}
                          </div>

                          <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                            {item.descripcion}
                          </p>

                          <div className="flex flex-wrap items-center gap-2 mt-2">
                            {item.critico && (
                              <span className="text-[9px] font-mono font-bold text-orange-400 uppercase tracking-wider bg-orange-500/10 px-1.5 py-0.5 rounded border border-orange-500/20">
                                Requisito Crítico
                              </span>
                            )}

                            {directToolUrl && (
                              <a
                                href={directToolUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-[10px] text-sky-400 hover:text-sky-300 font-semibold underline underline-offset-2 ml-auto"
                              >
                                <span>Abrir Validador Oficial</span>
                                <ExternalLink className="w-2.5 h-2.5" />
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
}
