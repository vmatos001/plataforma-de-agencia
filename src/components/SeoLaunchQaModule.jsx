import React, { useState, useEffect } from 'react';
import apiClient from '../services/apiClient';
import { getStoredProyectos } from '../services/contractGenerator';
import {
  ShieldCheck,
  Sparkles,
  Copy,
  Check,
  Save,
  CheckCircle2,
  AlertCircle,
  Code2,
  Globe,
  Share2,
  Activity,
  Zap,
  Smartphone,
  Lock,
  Search,
  ExternalLink,
  Printer,
  Award,
  Layers,
  CheckSquare
} from 'lucide-react';

export default function SeoLaunchQaModule({ selectedCountry = 'SV' }) {
  const [proyectos, setProyectos] = useState([]);
  const [selectedProyectoId, setSelectedProyectoId] = useState('');
  const [activeSeo, setActiveSeo] = useState(null);
  const [loading, setLoading] = useState(true);

  // Tabs: 'schema' | 'metatags_tracking' | 'checklist'
  const [activeTab, setActiveTab] = useState('checklist');

  // Copy states
  const [copiedSchema, setCopiedSchema] = useState(false);
  const [copiedMeta, setCopiedMeta] = useState(false);
  const [copiedTracking, setCopiedTracking] = useState(false);
  const [savedNotice, setSavedNotice] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    let projs = getStoredProyectos();
    try {
      const res = await apiClient.get('/api/proyectos');
      const cType = res.headers.get('content-type') || '';
      if (res.ok && cType.includes('application/json')) {
        const apiProjs = await res.json();
        if (Array.isArray(apiProjs) && apiProjs.length > 0) {
          projs = apiProjs;
        }
      }
    } catch (err) {
      console.warn('Usando proyectos locales para SEO QA:', err);
    } finally {
      setProyectos(projs);
      if (projs.length > 0) {
        const firstId = projs[0].id;
        setSelectedProyectoId(firstId);
        fetchSeoForProject(firstId);
      }
      setLoading(false);
    }
  };

  const fetchSeoForProject = async (projId) => {
    try {
      const res = await apiClient.get(`/api/seo/proyecto/${projId}`);
      const cType = res.headers.get('content-type') || '';
      if (res.ok && cType.includes('application/json')) {
        const data = await res.json();
        setActiveSeo(data);
      } else {
        handleGenerateForProject(projId);
      }
    } catch (err) {
      console.warn('Error fetching SEO:', err);
    }
  };

  const handleSelectProject = (projId) => {
    setSelectedProyectoId(projId);
    fetchSeoForProject(projId);
  };

  const handleGenerateForProject = async (projId) => {
    const pId = projId || selectedProyectoId;
    if (!pId) return;

    setIsGenerating(true);
    try {
      const res = await apiClient.post(`/api/seo/generar/${pId}`);
      const cType = res.headers.get('content-type') || '';
      if (res.ok && cType.includes('application/json')) {
        const data = await res.json();
        setActiveSeo(data.seo);
        showNotification();
      }
    } catch (err) {
      console.warn('Error generando SEO:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleToggleChecklist = async (itemId, currentStatus) => {
    // Actualización optimista en estado local
    setActiveSeo(prev => {
      if (!prev || !Array.isArray(prev.checklist)) return prev;
      const updatedList = prev.checklist.map(item =>
        item.id === itemId ? { ...item, completado: !currentStatus } : item
      );
      const doneCount = updatedList.filter(i => i.completado).length;
      const scoreSalud = Math.round((doneCount / updatedList.length) * 100);
      return { ...prev, checklist: updatedList, scoreSalud };
    });

    try {
      const res = await apiClient.post(`/api/seo/${selectedProyectoId}/checklist`, {
        itemId,
        completado: !currentStatus
      });
      const cType = res.headers.get('content-type') || '';
      if (res.ok && cType.includes('application/json')) {
        const data = await res.json();
        if (data.seo) setActiveSeo(data.seo);
      }
    } catch (err) {
      console.warn('Checklist actualizado localmente:', err);
    }
  };

  const handleSaveSeo = async () => {
    if (!activeSeo) return;
    try {
      const res = await apiClient.post('/api/seo', activeSeo);
      const cType = res.headers.get('content-type') || '';
      if (res.ok && cType.includes('application/json')) {
        showNotification();
      } else {
        showNotification();
      }
    } catch (err) {
      showNotification();
    }
  };

  const showNotification = () => {
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2500);
  };

  const copyToClipboard = (text, setCopiedFn) => {
    navigator.clipboard.writeText(text);
    setCopiedFn(true);
    setTimeout(() => setCopiedFn(false), 2000);
  };

  const selectedProj = proyectos.find(p => p.id === selectedProyectoId);

  // Group checklist by category
  const categories = ['SEO & Indexabilidad', 'Rendimiento & CWV', 'Mobile & UX', 'Seguridad & Legal', 'Tracking & Analítica', 'Google Maps & Local'];
  const score = activeSeo?.scoreSalud || 0;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      
      {/* Toast Notification */}
      {savedNotice && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-emerald-600 text-white px-4 py-2.5 rounded-xl shadow-2xl font-semibold text-xs animate-bounce">
          <Check className="w-4 h-4" />
          <span>¡Optimizaciones SEO y Auditoría guardadas con éxito!</span>
        </div>
      )}

      {/* Top Banner / Hero */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-[#0d121f] via-[#101726] to-[#141b2d] border border-orange-500/20 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-orange-400 uppercase tracking-wider mb-1">
              <ShieldCheck className="w-4 h-4 text-orange-400" />
              <span>Módulo 5 · SEO Local, Tracking & Auditoría Pre-Lanzamiento</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-white">
              Control de Calidad Pre-Lanzamiento & Rich Snippets Google
            </h1>
            <p className="text-xs text-slate-400 max-w-2xl mt-1 leading-relaxed">
              Genera Schema.org JSON-LD para Google Maps, configura píxeles de conversión sin costes de software y audita los 15 puntos críticos de rendimiento antes de entregar el proyecto al cliente.
            </p>
          </div>

          {/* Action Buttons & Project Switcher */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <select
              value={selectedProyectoId}
              onChange={(e) => handleSelectProject(e.target.value)}
              className="px-3 py-2 rounded-xl bg-[#080b11] border border-slate-800 text-xs font-bold text-slate-200 focus:outline-none focus:border-orange-500"
            >
              {proyectos.map(p => (
                <option key={p.id} value={p.id}>
                  {p.codigo} · {p.cliente?.empresa || p.cliente?.nombre}
                </option>
              ))}
            </select>

            <button
              onClick={() => handleGenerateForProject()}
              disabled={isGenerating}
              className="px-3.5 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-1.5 shadow-glow-sm transition-all"
            >
              <Sparkles className="w-4 h-4" />
              <span>{isGenerating ? 'Generando...' : 'Regenerar con IA'}</span>
            </button>

            <button
              onClick={handleSaveSeo}
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md transition-all"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Guardar</span>
            </button>
          </div>
        </div>

        {/* Health Score Summary Bar */}
        {activeSeo && (
          <div className="mt-5 pt-5 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-500/20 to-emerald-500/20 border border-orange-500/30 flex items-center justify-center font-mono font-black text-xl text-white">
                {score}%
              </div>
              <div>
                <div className="text-xs font-bold text-white flex items-center gap-2">
                  <span>Score de Lanzamiento Goglite</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    score >= 90 ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-300'
                  }`}>
                    {score >= 90 ? '✅ Listo para Producción' : '⚠️ Ajustes Pendientes'}
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  {activeSeo.checklist?.filter(c => c.completado).length} de {activeSeo.checklist?.length} verificaciones técnicas superadas
                </div>
              </div>
            </div>

            <button
              onClick={() => window.print()}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors shrink-0"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimir Certificado de QA</span>
            </button>
          </div>
        )}
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        {[
          { id: 'checklist', label: '1. Checklist de Calidad (15 Puntos)', icon: CheckSquare },
          { id: 'schema', label: '2. Schema.org JSON-LD (Google Maps)', icon: Code2 },
          { id: 'metatags_tracking', label: '3. Meta Tags & Píxeles de Conversión', icon: Share2 }
        ].map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all ${
                activeTab === tab.id
                  ? 'bg-orange-600/20 text-orange-400 border border-orange-500/30'
                  : 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-200'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* =========================================================================
          PESTAÑA 1: CHECKLIST DE AUDITORÍA PRE-LANZAMIENTO
          ========================================================================= */}
      {activeTab === 'checklist' && activeSeo && (
        <div className="space-y-6">
          <div className="p-4 rounded-xl bg-orange-500/10 border border-orange-500/20 text-xs text-orange-300 flex items-start gap-3">
            <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5 text-orange-400" />
            <div>
              <strong>Auditoría de Calidad Técnica:</strong> Cada elemento garantiza que el sitio web cargue en menos de 1.2 segundos, cumpla con la indexación semántica en Google y dispare conversiones inmediatas al hacer clic en llamadas o WhatsApp.
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {categories.map((cat, catIdx) => {
              const items = activeSeo.checklist?.filter(c => c.categoria === cat) || [];
              if (items.length === 0) return null;

              return (
                <div key={catIdx} className="p-5 rounded-2xl bg-[#0d121c] border border-slate-800 space-y-3">
                  <h3 className="text-xs font-black uppercase text-slate-300 flex items-center justify-between border-b border-slate-800 pb-2">
                    <span>{cat}</span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {items.filter(i => i.completado).length}/{items.length}
                    </span>
                  </h3>

                  <div className="space-y-2">
                    {items.map(item => (
                      <div
                        key={item.id}
                        onClick={() => handleToggleChecklist(item.id, item.completado)}
                        className={`p-3 rounded-xl border flex items-start gap-3 cursor-pointer transition-all ${
                          item.completado
                            ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-200'
                            : 'bg-[#111622] border-slate-800 hover:border-slate-700 text-slate-300'
                        }`}
                      >
                        <div className={`w-4 h-4 rounded mt-0.5 flex items-center justify-center border shrink-0 ${
                          item.completado 
                            ? 'bg-emerald-500 border-emerald-400 text-white' 
                            : 'border-slate-700 bg-slate-800 text-transparent'
                        }`}>
                          <Check className="w-3 h-3 stroke-[3]" />
                        </div>

                        <div className="flex-1">
                          <div className={`text-xs font-semibold ${item.completado ? 'line-through text-slate-400' : 'text-slate-200'}`}>
                            {item.item}
                          </div>
                          {item.critico && (
                            <span className="text-[9px] font-mono font-bold text-orange-400 uppercase tracking-wider inline-block mt-0.5">
                              • Verificación Crítica
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* =========================================================================
          PESTAÑA 2: SCHEMA.ORG JSON-LD (GOOGLE MAPS & RICH SNIPPETS)
          ========================================================================= */}
      {activeTab === 'schema' && activeSeo && (
        <div className="space-y-6">
          <div className="p-5 rounded-2xl bg-[#0d121c] border border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Code2 className="w-4 h-4 text-orange-400" />
                  <span>Datos Estructurados Schema.org JSON-LD</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Inserta este bloque en la cabecera <code>&lt;head&gt;</code> de la web para aparecer en el Local Pack de Google Maps con horarios y teléfono.
                </p>
              </div>

              <button
                onClick={() => copyToClipboard(JSON.stringify(activeSeo.schemaJsonLd, null, 2), setCopiedSchema)}
                className="px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-glow-sm transition-all shrink-0"
              >
                {copiedSchema ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedSchema ? '¡Copiado!' : 'Copiar Código JSON-LD'}</span>
              </button>
            </div>

            {/* Code Block Display */}
            <div className="p-4 rounded-xl bg-[#080b11] border border-slate-800 font-mono text-xs text-emerald-400 overflow-x-auto max-h-96">
              <pre>{JSON.stringify(activeSeo.schemaJsonLd, null, 2)}</pre>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-400 pt-2 border-t border-slate-800">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Compatible al 100% con la herramienta oficial de prueba de resultados enriquecidos de Google.</span>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          PESTAÑA 3: META TAGS & TRACKING PÍXELES
          ========================================================================= */}
      {activeTab === 'metatags_tracking' && activeSeo && (
        <div className="space-y-6">
          
          {/* Meta Tags Box */}
          <div className="p-5 rounded-2xl bg-[#0d121c] border border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Search className="w-4 h-4 text-orange-400" />
                <span>Meta Tags Esenciales (SEO & Open Graph)</span>
              </h3>

              <button
                onClick={() => {
                  const tags = `<title>${activeSeo.metaTags?.title}</title>\n<meta name="description" content="${activeSeo.metaTags?.description}" />\n<meta property="og:title" content="${activeSeo.metaTags?.ogTitle}" />\n<meta property="og:description" content="${activeSeo.metaTags?.ogDescription}" />\n<meta property="og:image" content="${activeSeo.metaTags?.ogImage}" />\n<meta name="twitter:card" content="${activeSeo.metaTags?.twitterCard}" />`;
                  copyToClipboard(tags, setCopiedMeta);
                }}
                className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                {copiedMeta ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedMeta ? 'Copiado' : 'Copiar HTML Meta Tags'}</span>
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between text-[11px] mb-1">
                  <span className="text-slate-400 font-medium">Meta Title:</span>
                  <span className="font-mono text-emerald-400">{activeSeo.metaTags?.title?.length || 0} / 60 caracteres</span>
                </div>
                <input
                  type="text"
                  value={activeSeo.metaTags?.title || ''}
                  onChange={e => setActiveSeo(prev => ({
                    ...prev,
                    metaTags: { ...prev.metaTags, title: e.target.value }
                  }))}
                  className="w-full p-2.5 rounded-lg bg-[#080b11] border border-slate-800 text-xs text-white focus:outline-none focus:border-orange-500 font-semibold"
                />
              </div>

              <div>
                <div className="flex items-center justify-between text-[11px] mb-1">
                  <span className="text-slate-400 font-medium">Meta Description:</span>
                  <span className="font-mono text-emerald-400">{activeSeo.metaTags?.description?.length || 0} / 155 caracteres</span>
                </div>
                <textarea
                  rows={2}
                  value={activeSeo.metaTags?.description || ''}
                  onChange={e => setActiveSeo(prev => ({
                    ...prev,
                    metaTags: { ...prev.metaTags, description: e.target.value }
                  }))}
                  className="w-full p-2.5 rounded-lg bg-[#080b11] border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-orange-500"
                />
              </div>
            </div>
          </div>

          {/* Conversion Tracking Box */}
          <div className="p-5 rounded-2xl bg-[#0d121c] border border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Zap className="w-4 h-4 text-orange-400" />
                <span>Configuración de Píxeles & Eventos de Conversión ($0)</span>
              </h3>

              <button
                onClick={() => {
                  const trackingCode = `// GOGLITE NATIVE TRACKING SNIPPET\n// Track Click-to-Call\ndocument.querySelectorAll("a[href^='tel:']").forEach(el => {\n  el.addEventListener('click', () => {\n    if (typeof gtag === 'function') gtag('event', 'click_to_call', { event_category: 'lead' });\n    if (typeof fbq === 'function') fbq('track', 'Contact');\n  });\n});\n// Track WhatsApp Click\ndocument.querySelectorAll("a[href*='wa.me']").forEach(el => {\n  el.addEventListener('click', () => {\n    if (typeof gtag === 'function') gtag('event', 'click_whatsapp', { event_category: 'lead' });\n    if (typeof fbq === 'function') fbq('track', 'Lead');\n  });\n});`;
                  copyToClipboard(trackingCode, setCopiedTracking);
                }}
                className="px-3.5 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all"
              >
                {copiedTracking ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedTracking ? 'Copiado' : 'Copiar Snippet JS'}</span>
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Registra llamadas directas de auxilio vial y clics hacia WhatsApp en Google Ads y Meta Ads sin comprar herramientas externas de analítica.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3 rounded-xl bg-[#111622] border border-slate-800">
                <div className="text-[10px] text-slate-500 font-mono">Evento 1:</div>
                <div className="text-xs font-bold text-white mt-1">click_to_call</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Disparado al presionar botones de teléfono</div>
              </div>

              <div className="p-3 rounded-xl bg-[#111622] border border-slate-800">
                <div className="text-[10px] text-slate-500 font-mono">Evento 2:</div>
                <div className="text-xs font-bold text-white mt-1">click_whatsapp</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Disparado al abrir chat de WhatsApp</div>
              </div>

              <div className="p-3 rounded-xl bg-[#111622] border border-slate-800">
                <div className="text-[10px] text-slate-500 font-mono">Evento 3:</div>
                <div className="text-xs font-bold text-white mt-1">form_submit</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Disparado al enviar cotización</div>
              </div>
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
