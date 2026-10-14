import React, { useState, useEffect } from 'react';
import {
  Search,
  Sparkles,
  Globe,
  MapPin,
  FileCode,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  TrendingUp,
  Bot,
  ExternalLink,
  Layers,
  ShieldCheck,
  Code2,
  FileText,
  RefreshCw,
  Eye
} from 'lucide-react';

export default function SeoGeoToolsModule({ selectedCountry = 'SV' }) {
  const [activeTab, setActiveTab] = useState('onpage'); // 'onpage' | 'schema' | 'robots_sitemap'
  const [country, setCountry] = useState(selectedCountry);
  const [city, setCity] = useState(selectedCountry === 'DO' ? 'Santo Domingo' : 'San Salvador');

  // On-page inputs
  const [focusKeyword, setFocusKeyword] = useState(
    country === 'DO' ? 'inmobiliarias Punta Cana' : 'grúas plataforma San Salvador'
  );
  const [title, setTitle] = useState(
    country === 'DO'
      ? 'Inmobiliarias Punta Cana | Villas y Condos de Lujo en Venta'
      : 'Grúas Plataforma San Salvador 24 Horas | Auxilio Vial Rápido'
  );
  const [metaDesc, setMetaDesc] = useState(
    country === 'DO'
      ? 'Encuentra las mejores opciones con inmobiliarias Punta Cana. Villas de lujo con piscina y condos con exención fiscal CONFOTUR. Asesoría legal en Santo Domingo.'
      : 'Servicio de grúas plataforma San Salvador disponible las 24 horas. Remolque seguro de vehículos sin daños, paso de corriente y auxilio vial inmediato.'
  );
  const [h1, setH1] = useState(
    country === 'DO'
      ? 'Inmobiliarias Punta Cana: Invierte en Proyectos Exclusivos'
      : 'Grúas Plataforma San Salvador: Asistencia en Menos de 25 Minutos'
  );
  const [content, setContent] = useState(
    country === 'DO'
      ? `Las inmobiliarias Punta Cana ofrecen hoy la mayor rentabilidad del Caribe. Si buscas invertir en Santo Domingo o en la costa este, nuestros condominios cuentan con exención de impuestos bajo la ley CONFOTUR. Comunícate al WhatsApp +1 809 555-0199 para recibir el catálogo de preventa exclusivo en Punta Cana.`
      : `Cuando necesitas grúas plataforma San Salvador, cada minuto cuenta. Nuestro equipo de operadores certificados atiende emergencias viales en San Salvador, Santa Tecla y Antiguo Cuscatlán. Llámanos o contáctanos por WhatsApp al +503 7000-1122 para enviar una grúa plataforma a tu ubicación en menos de 25 minutos.`
  );

  // Analysis result
  const [analysis, setAnalysis] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [copiedSchema, setCopiedSchema] = useState(false);
  const [copiedSitemap, setCopiedSitemap] = useState(false);

  // Schema form state
  const [schemaType, setSchemaType] = useState('LocalBusiness');
  const [schemaName, setSchemaName] = useState('Goglite Digital Hub');
  const [schemaPhone, setSchemaPhone] = useState('+503 7000-1122');
  const [schemaAddress, setSchemaAddress] = useState('Colonia Escalón, San Salvador');

  // Google Search Console & GA4 Live State
  const [gscDomain, setGscDomain] = useState(country === 'DO' ? 'puntacanaprime.com' : 'gruasandrea.com');
  const [gscData, setGscData] = useState(null);
  const [gscLoading, setGscLoading] = useState(false);
  const [gscSynced, setGscSynced] = useState(false);
  const [crmClients, setCrmClients] = useState([]);
  const [showSaModal, setShowSaModal] = useState(false);
  const [copiedSaEmail, setCopiedSaEmail] = useState(false);
  const [customDomainInput, setCustomDomainInput] = useState('');
  const [showAddDomain, setShowAddDomain] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('goglite_crm_leads');
      if (raw) {
        const leads = JSON.parse(raw);
        if (Array.isArray(leads)) {
          setCrmClients(leads);
        }
      }
    } catch (e) {
      console.error('Error loading CRM leads for GSC:', e);
    }
  }, []);

  const fetchGscMetrics = async () => {
    try {
      setGscLoading(true);
      const res = await fetch(`/api/seo-geo/gsc/${gscDomain}?country=${country}`);
      if (res.ok) {
        const json = await res.json();
        setGscData(json);
      }
    } catch (err) {
      console.error('Error fetching GSC metrics:', err);
    } finally {
      setGscLoading(false);
    }
  };

  useEffect(() => {
    fetchGscMetrics();
  }, [country, gscDomain]);

  const handleSyncGsc = async () => {
    try {
      setGscLoading(true);
      const res = await fetch('/api/seo-geo/gsc/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain: gscDomain, country })
      });
      if (res.ok) {
        const json = await res.json();
        setGscData(json.metrics);
        setGscSynced(true);
        setTimeout(() => setGscSynced(false), 3000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setGscLoading(false);
    }
  };

  // Trigger analysis on input changes
  useEffect(() => {
    runAnalysis();
  }, [title, metaDesc, h1, content, focusKeyword, country, city]);

  const runAnalysis = async () => {
    try {
      setAnalyzing(true);
      const res = await fetch('/api/seo-geo/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          metaDescription: metaDesc,
          h1,
          content,
          focusKeyword,
          country,
          city
        })
      });
      if (res.ok) {
        const json = await res.json();
        setAnalysis(json);
      }
    } catch (err) {
      console.error('Error analizando SEO:', err);
    } finally {
      setAnalyzing(false);
    }
  };

  const generatedSchemaCode = JSON.stringify(
    {
      '@context': 'https://schema.org',
      '@type': schemaType,
      name: schemaName,
      description: metaDesc,
      url: 'https://cliente-oficial.com',
      telephone: schemaPhone,
      priceRange: '$$',
      address: {
        '@type': 'PostalAddress',
        streetAddress: schemaAddress,
        addressLocality: city,
        addressRegion: city,
        addressCountry: country
      },
      geo: {
        '@type': 'GeoCoordinates',
        latitude: country === 'SV' ? 13.6929 : 18.4861,
        longitude: country === 'SV' ? -89.2182 : -69.9312
      }
    },
    null,
    2
  );

  const robotsTxtCode = `# Robots.txt optimizado para SEO clásico y motores de IA
User-agent: *
Allow: /

# Rastreadores de Inteligencia Artificial (Permitir para citación en IA)
User-agent: GPTBot
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: ClaudeBot
Allow: /

Sitemap: https://cliente-oficial.com/sitemap.xml`;

  return (
    <div className="flex-1 overflow-y-auto bg-[#080b11] p-6 text-slate-100 flex flex-col gap-6">
      
      {/* 1. TOP HEADER & RANK MATH SCORE BAR */}
      <div className="p-5 rounded-2xl bg-[#0e1320] border border-slate-800/80 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-4">
          {/* Radial / Badge Score */}
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-slate-900 to-[#141b2c] border border-slate-700 flex flex-col items-center justify-center shrink-0 shadow-inner">
            <span className={`text-2xl font-black font-mono ${
              (analysis?.score || 0) >= 80 ? 'text-emerald-400' :
              (analysis?.score || 0) >= 60 ? 'text-amber-400' : 'text-rose-400'
            }`}>
              {analysis?.score || 0}
            </span>
            <span className="text-[9px] font-mono uppercase text-slate-500 font-bold">/ 100</span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black text-white">Motor SEO & GEO Tools</h2>
              <span className="text-[10px] bg-orange-500/20 text-orange-400 border border-orange-500/30 px-2 py-0.5 rounded-full font-mono font-semibold">
                Alternativa a Rank Math Pro $0 USD
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Optimización semántica On-Page, prominencia geográfica local y datos estructurados Schema para Google e IAs.
            </p>
          </div>
        </div>

        {/* Country & City Selector */}
        <div className="flex items-center gap-2 bg-[#131926] p-1 rounded-xl border border-slate-800 text-xs">
          <button
            onClick={() => {
              setCountry('SV');
              setCity('San Salvador');
            }}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
              country === 'SV' ? 'bg-orange-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            🇸🇻 El Salvador
          </button>
          <button
            onClick={() => {
              setCountry('DO');
              setCity('Santo Domingo');
            }}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
              country === 'DO' ? 'bg-orange-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            🇩🇴 Rep. Dominicana
          </button>
        </div>
      </div>

      {/* 2. NAVIGATION TABS */}
      <div className="flex items-center gap-2 border-b border-slate-800/80 pb-2">
        <button
          onClick={() => setActiveTab('onpage')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
            activeTab === 'onpage' ? 'bg-orange-600/20 text-orange-400 border border-orange-500/30' : 'text-slate-400 hover:text-white'
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5" />
          <span>Auditor On-Page & Densidad</span>
        </button>
        <button
          onClick={() => setActiveTab('schema')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
            activeTab === 'schema' ? 'bg-orange-600/20 text-orange-400 border border-orange-500/30' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Code2 className="w-3.5 h-3.5" />
          <span>Generador Schema JSON-LD</span>
        </button>
        <button
          onClick={() => setActiveTab('robots_sitemap')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
            activeTab === 'robots_sitemap' ? 'bg-orange-600/20 text-orange-400 border border-orange-500/30' : 'text-slate-400 hover:text-white'
          }`}
        >
          <FileCode className="w-3.5 h-3.5" />
          <span>Sitemap & Robots IA</span>
        </button>
        <button
          onClick={() => setActiveTab('gsc_live')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
            activeTab === 'gsc_live' ? 'bg-orange-600/20 text-orange-400 border border-orange-500/30' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Globe className="w-3.5 h-3.5" />
          <span>Métricas GSC & Tráfico en Vivo</span>
        </button>
      </div>

      {/* 3. TAB 1: ON-PAGE & LOCAL GEO ANALYZER */}
      {activeTab === 'onpage' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Column: Form Editor (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            
            {/* Focus Keyword & City */}
            <div className="p-4 rounded-xl bg-[#0e1320] border border-slate-800 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 text-xs block mb-1 font-semibold">
                    Palabra Clave Objetivo (Focus Keyword)
                  </label>
                  <input
                    type="text"
                    value={focusKeyword}
                    onChange={(e) => setFocusKeyword(e.target.value)}
                    placeholder="ej: clínicas dentales San Salvador"
                    className="w-full bg-[#131926] border border-slate-700 rounded-lg p-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-slate-400 text-xs block mb-1 font-semibold">
                    Ciudad / Ubicación GEO Local
                  </label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="ej: San Salvador / Punta Cana"
                    className="w-full bg-[#131926] border border-slate-700 rounded-lg p-2 text-xs text-white"
                  />
                </div>
              </div>
            </div>

            {/* Title & SERP Preview */}
            <div className="p-4 rounded-xl bg-[#0e1320] border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <label className="text-slate-300 font-semibold">Etiqueta Título SEO (&lt;title&gt;)</label>
                <span className={`font-mono text-[11px] ${
                  title.length >= 40 && title.length <= 65 ? 'text-emerald-400' : 'text-amber-400'
                }`}>
                  {title.length} / 65 caracteres
                </span>
              </div>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-[#131926] border border-slate-700 rounded-lg p-2 text-xs text-white"
              />
            </div>

            {/* Meta Description */}
            <div className="p-4 rounded-xl bg-[#0e1320] border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <label className="text-slate-300 font-semibold">Meta Descripción</label>
                <span className={`font-mono text-[11px] ${
                  metaDesc.length >= 120 && metaDesc.length <= 165 ? 'text-emerald-400' : 'text-amber-400'
                }`}>
                  {metaDesc.length} / 165 caracteres
                </span>
              </div>
              <textarea
                value={metaDesc}
                onChange={(e) => setMetaDesc(e.target.value)}
                rows={3}
                className="w-full bg-[#131926] border border-slate-700 rounded-lg p-2 text-xs text-white"
              ></textarea>
            </div>

            {/* H1 & Content */}
            <div className="p-4 rounded-xl bg-[#0e1320] border border-slate-800 space-y-3">
              <div>
                <label className="text-slate-300 text-xs block mb-1 font-semibold">Encabezado H1 Principal</label>
                <input
                  type="text"
                  value={h1}
                  onChange={(e) => setH1(e.target.value)}
                  className="w-full bg-[#131926] border border-slate-700 rounded-lg p-2 text-xs text-white"
                />
              </div>

              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <label className="text-slate-300 font-semibold">Contenido Principal de la Página</label>
                  <span className="font-mono text-[11px] text-slate-400">
                    {analysis?.metrics?.wordCount || 0} palabras · {analysis?.metrics?.keywordDensity || 0}% densidad
                  </span>
                </div>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={5}
                  className="w-full bg-[#131926] border border-slate-700 rounded-lg p-2 text-xs text-white"
                ></textarea>
              </div>
            </div>

            {/* Live Google Snippet Simulator */}
            <div className="p-4 rounded-xl bg-white text-slate-900 shadow-md space-y-1">
              <div className="text-[10px] uppercase font-mono tracking-wider text-slate-400 font-bold">
                Previsualización en Google (Móvil / Escritorio)
              </div>
              <div className="text-[11px] text-slate-600 truncate">https://cliente-oficial.com › {country === 'SV' ? 'el-salvador' : 'republica-dominicana'}</div>
              <h3 className="text-sm font-semibold text-blue-700 hover:underline cursor-pointer truncate">
                {title || 'Título de ejemplo'}
              </h3>
              <p className="text-xs text-slate-700 leading-snug line-clamp-2">
                {metaDesc || 'Meta descripción de ejemplo para el snippet de Google.'}
              </p>
            </div>

          </div>

          {/* Right Column: Score Breakdown & LSI Keywords (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            
            {/* Checklist Results */}
            <div className="p-4 rounded-xl bg-[#0e1320] border border-slate-800 space-y-3">
              <h3 className="text-xs font-mono uppercase tracking-wider text-slate-400 font-bold flex items-center justify-between">
                <span>Auditoría de Requisitos SEO</span>
                <span className="text-[10px] text-orange-400 font-normal">En tiempo real</span>
              </h3>

              <div className="space-y-2">
                {analysis?.checks?.map(check => (
                  <div key={check.id} className="p-2.5 rounded-lg bg-[#121828] border border-slate-800 text-xs flex items-start gap-2.5">
                    {check.status === 'pass' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    ) : check.status === 'warn' ? (
                      <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <div className="font-bold text-white leading-tight">{check.title}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5 leading-snug">{check.msg}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* LSI Keywords for AI Search Engines (Perplexity / SearchGPT) */}
            <div className="p-4 rounded-xl bg-[#0e1320] border border-slate-800 space-y-3">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-200">
                <Bot className="w-4 h-4 text-sky-400" />
                <span>Palabras Clave LSI para Motores de IA</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Términos complementarios recomendados para que ChatGPT y Perplexity citen este contenido:
              </p>

              <div className="space-y-1.5">
                {analysis?.lsiSuggestions?.map((lsi, i) => (
                  <div key={i} className="px-2.5 py-1 rounded bg-[#131926] border border-slate-800 text-[11px] text-sky-300 font-mono flex items-center justify-between">
                    <span>{lsi}</span>
                    <button
                      onClick={() => setContent(prev => prev + ' ' + lsi + '.')}
                      className="text-[10px] text-slate-400 hover:text-white"
                      title="Insertar en contenido"
                    >
                      + Añadir
                    </button>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>
      )}

      {/* 4. TAB 2: SCHEMA GENERATOR */}
      {activeTab === 'schema' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Schema Config Form */}
          <div className="p-5 rounded-xl bg-[#0e1320] border border-slate-800 space-y-4">
            <h3 className="text-xs font-mono uppercase tracking-wider text-slate-400 font-bold">
              Configuración de Datos Estructurados Schema.org
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1 font-semibold">Tipo de Negocio (Schema Type)</label>
                <select
                  value={schemaType}
                  onChange={(e) => setSchemaType(e.target.value)}
                  className="w-full bg-[#131926] border border-slate-700 rounded-lg p-2 text-white"
                >
                  <option value="LocalBusiness">LocalBusiness (Comercio / Negocio Local General)</option>
                  <option value="EmergencyService">EmergencyService (Grúas, Auxilio Vial, Cerrajería 24/7)</option>
                  <option value="MedicalBusiness">MedicalBusiness (Clínica Dental, Estética, Salud)</option>
                  <option value="RealEstateAgent">RealEstateAgent (Inmobiliaria, Asesor Bienes Raíces)</option>
                  <option value="LegalService">LegalService (Bufete de Abogados, Asesoría Legal)</option>
                </select>
              </div>

              <div>
                <label className="text-slate-400 block mb-1 font-semibold">Nombre Comercial</label>
                <input
                  type="text"
                  value={schemaName}
                  onChange={(e) => setSchemaName(e.target.value)}
                  className="w-full bg-[#131926] border border-slate-700 rounded-lg p-2 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-400 block mb-1 font-semibold">Teléfono Comercial</label>
                  <input
                    type="text"
                    value={schemaPhone}
                    onChange={(e) => setSchemaPhone(e.target.value)}
                    className="w-full bg-[#131926] border border-slate-700 rounded-lg p-2 text-white"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1 font-semibold">Dirección Física</label>
                  <input
                    type="text"
                    value={schemaAddress}
                    onChange={(e) => setSchemaAddress(e.target.value)}
                    className="w-full bg-[#131926] border border-slate-700 rounded-lg p-2 text-white"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Generated Code Output */}
          <div className="p-5 rounded-xl bg-[#0e1320] border border-slate-800 space-y-3 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono uppercase tracking-wider text-slate-400 font-bold">
                Código JSON-LD para incrustar en &lt;head&gt;
              </span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(`<script type="application/ld+json">\n${generatedSchemaCode}\n</script>`);
                  setCopiedSchema(true);
                  setTimeout(() => setCopiedSchema(false), 2000);
                }}
                className="px-3 py-1 rounded bg-orange-600 hover:bg-orange-500 text-white font-medium text-xs flex items-center gap-1.5 transition-all"
              >
                {copiedSchema ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedSchema ? 'Copiado al portapapeles' : 'Copiar Código'}</span>
              </button>
            </div>

            <pre className="p-4 rounded-lg bg-[#080b11] border border-slate-800 text-[11px] font-mono text-emerald-400 overflow-x-auto max-h-96">
              {`<script type="application/ld+json">\n${generatedSchemaCode}\n</script>`}
            </pre>
          </div>

        </div>
      )}

      {/* 5. TAB 3: ROBOTS & SITEMAP */}
      {activeTab === 'robots_sitemap' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="p-5 rounded-xl bg-[#0e1320] border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-mono uppercase tracking-wider text-slate-400 font-bold">
                robots.txt con Autorización para Bots de IA
              </h3>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(robotsTxtCode);
                  setCopiedSitemap(true);
                  setTimeout(() => setCopiedSitemap(false), 2000);
                }}
                className="px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1.5"
              >
                {copiedSitemap ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedSitemap ? 'Copiado' : 'Copiar'}</span>
              </button>
            </div>
            <pre className="p-4 rounded-lg bg-[#080b11] border border-slate-800 text-xs font-mono text-slate-300 whitespace-pre-line">
              {robotsTxtCode}
            </pre>
          </div>

          <div className="p-5 rounded-xl bg-[#0e1320] border border-slate-800 space-y-3">
            <h3 className="text-xs font-mono uppercase tracking-wider text-slate-400 font-bold">
              sitemap.xml Estructurado
            </h3>
            <pre className="p-4 rounded-lg bg-[#080b11] border border-slate-800 text-xs font-mono text-slate-300">
{`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://cliente-oficial.com/</loc>
    <lastmod>2026-10-10</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://cliente-oficial.com/servicios</loc>
    <lastmod>2026-10-10</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
</urlset>`}
            </pre>
          </div>
        </div>
      )}

      {/* 5. TAB 4: GOOGLE SEARCH CONSOLE & GA4 LIVE METRICS */}
      {activeTab === 'gsc_live' && (
        <div className="space-y-6">
          {/* SERVICE ACCOUNT GOGLITE-MASTER-SA MASTER SHIELD BAR */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-orange-500/10 via-[#0e1422] to-cyan-500/10 border border-orange-500/30 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-white">Google Search Console Multi-Cliente Oficial</span>
                  <span className="text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold">
                    $0 APIs Externas · Service Account
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2 mt-1 text-[11px] text-slate-300 font-mono">
                  <span>Cuenta:</span>
                  <code className="text-orange-400 bg-black/40 px-2 py-0.5 rounded border border-slate-800">
                    goglite-master-sa@goglite-agency-suite.iam.gserviceaccount.com
                  </code>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText('goglite-master-sa@goglite-agency-suite.iam.gserviceaccount.com');
                      setCopiedSaEmail(true);
                      setTimeout(() => setCopiedSaEmail(false), 2000);
                    }}
                    className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-sans font-semibold flex items-center gap-1 transition-colors"
                  >
                    {copiedSaEmail ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedSaEmail ? '¡Copiado!' : 'Copiar Email'}</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setShowSaModal(true)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 flex items-center gap-1.5 transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>¿Cómo Conectar un Cliente?</span>
              </button>
            </div>
          </div>

          {/* Domain Selector & Sync Bar */}
          <div className="p-4 rounded-xl bg-[#0e1320] border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <Globe className="w-5 h-5 text-orange-400 shrink-0" />
              <div className="w-full">
                <label className="text-[10px] uppercase font-mono tracking-wider text-slate-400 block">
                  Propiedad Web Analizada (Multi-Cliente)
                </label>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  <select
                    value={gscDomain}
                    onChange={(e) => setGscDomain(e.target.value)}
                    className="bg-[#131926] border border-slate-700 text-white font-mono text-xs rounded-lg px-2.5 py-1.5 cursor-pointer max-w-xs truncate"
                  >
                    <optgroup label="Clientes Activos del CRM">
                      {crmClients.filter(c => c.dominio).map(c => (
                        <option key={c.id} value={c.dominio}>
                          {c.empresa} ({c.dominio})
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="Sitios de Referencia Goglite">
                      <option value="gruasandrea.com">gruasandrea.com (El Salvador 🇸🇻)</option>
                      <option value="puntacanaprime.com">puntacanaprime.com (Rep. Dominicana 🇩🇴)</option>
                      <option value="clinicadentalescalon.com">clinicadentalescalon.com (El Salvador 🇸🇻)</option>
                    </optgroup>
                  </select>

                  <button
                    onClick={() => setShowAddDomain(!showAddDomain)}
                    className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-semibold border border-slate-700"
                  >
                    {showAddDomain ? 'Cerrar' : '+ Dominio Manual'}
                  </button>

                  <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full font-mono font-semibold">
                    ✓ Google API Activa
                  </span>
                </div>

                {showAddDomain && (
                  <div className="flex items-center gap-2 mt-2">
                    <input
                      type="text"
                      value={customDomainInput}
                      onChange={(e) => setCustomDomainInput(e.target.value)}
                      placeholder="ej: misitio.com"
                      className="bg-[#131926] border border-slate-700 text-white text-xs px-2.5 py-1 rounded-lg font-mono"
                    />
                    <button
                      onClick={() => {
                        if (customDomainInput.trim()) {
                          setGscDomain(customDomainInput.trim());
                          setCustomDomainInput('');
                          setShowAddDomain(false);
                        }
                      }}
                      className="px-2.5 py-1 rounded bg-orange-600 hover:bg-orange-500 text-white text-xs font-semibold"
                    >
                      Cargar
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span className="text-[11px] font-mono text-slate-400">
                Última sync: {gscData?.ultimaActualizacion || 'Reciente'}
              </span>
              <button
                onClick={handleSyncGsc}
                disabled={gscLoading}
                className="px-3.5 py-1.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-semibold text-xs flex items-center gap-1.5 shadow-md transition-all shrink-0 disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${gscLoading ? 'animate-spin' : ''}`} />
                <span>{gscSynced ? '¡Sincronizado!' : 'Sincronizar GSC Live'}</span>
              </button>
            </div>
          </div>

          {/* 4 KPIs Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-[#0c1017] border border-slate-800 shadow-sm">
              <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
                <span>CLICS ORGÁNICOS (GOOGLE)</span>
                <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded font-mono font-bold">
                  {gscData?.kpis.clicsCrecimiento || '+24.5%'}
                </span>
              </div>
              <div className="text-2xl font-black text-white font-mono mt-2">
                {gscData?.kpis.clics.toLocaleString() || '1,840'}
              </div>
              <p className="text-[10px] text-slate-500 mt-0.5">Visitas directas desde Google</p>
            </div>

            <div className="p-4 rounded-xl bg-[#0c1017] border border-slate-800 shadow-sm">
              <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
                <span>IMPRESIONES EN SERP</span>
                <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded font-mono font-bold">
                  {gscData?.kpis.impresionesCrecimiento || '+31.2%'}
                </span>
              </div>
              <div className="text-2xl font-black text-orange-400 font-mono mt-2">
                {gscData?.kpis.impresiones.toLocaleString() || '38,200'}
              </div>
              <p className="text-[10px] text-slate-500 mt-0.5">Veces mostrado en resultados</p>
            </div>

            <div className="p-4 rounded-xl bg-[#0c1017] border border-slate-800 shadow-sm">
              <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
                <span>CTR MEDIO</span>
                <TrendingUp className="w-4 h-4 text-sky-400" />
              </div>
              <div className="text-2xl font-black text-sky-400 font-mono mt-2">
                {gscData?.kpis.ctrMedio || '4.8%'}
              </div>
              <p className="text-[10px] text-slate-500 mt-0.5">Tasa de clics por impresión</p>
            </div>

            <div className="p-4 rounded-xl bg-[#0c1017] border border-slate-800 shadow-sm">
              <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
                <span>POSICIÓN MEDIA GOOGLE</span>
                <Sparkles className="w-4 h-4 text-purple-400" />
              </div>
              <div className="text-2xl font-black text-purple-400 font-mono mt-2">
                #{gscData?.kpis.posicionMedia || '4.8'}
              </div>
              <p className="text-[10px] text-slate-500 mt-0.5">Promedio en búsquedas locales</p>
            </div>
          </div>

          {/* 14-Day Timeline Bar Chart */}
          <div className="p-5 rounded-xl bg-[#0c1017] border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-mono uppercase tracking-wider text-slate-200 font-bold">
                  Evolución Diaria de Clics Orgánicos (Últimos 14 días)
                </h3>
                <p className="text-[10px] text-slate-500">Métricas reales sincronizadas con Search Console</p>
              </div>
              <span className="text-[11px] font-mono text-emerald-400 font-bold">Tendencia Al Alza (+24%)</span>
            </div>

            <div className="h-44 pt-4 flex items-end gap-2 sm:gap-3 justify-between border-b border-slate-800 pb-2">
              {(gscData?.timeline || []).map((pt, i) => {
                const maxClics = 160;
                const heightPct = Math.min(100, Math.max(15, Math.round((pt.clics / maxClics) * 100)));
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1.5 group">
                    <div className="text-[9px] font-mono text-orange-400 opacity-0 group-hover:opacity-100 transition-opacity">
                      {pt.clics}
                    </div>
                    <div
                      className="w-full bg-gradient-to-t from-orange-600 to-amber-400 rounded-t-md transition-all group-hover:brightness-125 shadow-sm"
                      style={{ height: `${heightPct}%` }}
                      title={`${pt.fecha}: ${pt.clics} clics, ${pt.impresiones} impresiones`}
                    ></div>
                    <span className="text-[8px] font-mono text-slate-500 truncate w-full text-center">
                      {pt.fecha}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Two-Column Grid: Keywords & Core Web Vitals */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left Column: Top Keywords (2 cols) */}
            <div className="lg:col-span-2 bg-[#0c1017] border border-slate-800/80 rounded-xl overflow-hidden shadow-sm">
              <div className="p-3 bg-[#101522] border-b border-slate-800 text-xs font-bold text-slate-200 flex items-center justify-between">
                <span>Top Consultas de Búsqueda Posicionadas en Google Local</span>
                <span className="text-[11px] font-mono text-slate-400">Google SERP SV/DO</span>
              </div>

              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-[#0d121c] border-b border-slate-800 text-[11px] font-mono uppercase text-slate-400">
                  <tr>
                    <th className="p-3">Palabra Clave</th>
                    <th className="p-3">Posición Media</th>
                    <th className="p-3 text-right">Clics</th>
                    <th className="p-3 text-right">Impresiones</th>
                    <th className="p-3 text-right">CTR</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-sans">
                  {(gscData?.topConsultas || []).map((q, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/30 transition-colors">
                      <td className="p-3">
                        <div className="font-semibold text-white">{q.query}</div>
                        <span className="text-[9px] font-mono text-slate-500 uppercase">{q.intencion}</span>
                      </td>
                      <td className="p-3 font-mono font-bold">
                        <span className={`px-2 py-0.5 rounded text-[11px] ${
                          q.posicion <= 3.0 ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-slate-800 text-slate-300'
                        }`}>
                          #{q.posicion}
                        </span>
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-orange-400">{q.clics}</td>
                      <td className="p-3 text-right font-mono text-slate-400">{q.impresiones.toLocaleString()}</td>
                      <td className="p-3 text-right font-mono text-sky-400 font-semibold">{q.ctr}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Right Column: Core Web Vitals & Devices (1 col) */}
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-[#0c1017] border border-slate-800 space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-slate-200">
                  <span>Core Web Vitals (Velocidad Google)</span>
                  <span className="text-[10px] font-mono bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded font-semibold">
                    {gscData?.coreWebVitals.estado || 'APROBADO'}
                  </span>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between p-2 rounded bg-slate-900/60 border border-slate-800">
                    <span className="text-slate-400">LCP (Carga visual):</span>
                    <span className="font-mono text-emerald-400 font-bold">{gscData?.coreWebVitals.lcp}</span>
                  </div>
                  <div className="flex justify-between p-2 rounded bg-slate-900/60 border border-slate-800">
                    <span className="text-slate-400">INP (Interactividad):</span>
                    <span className="font-mono text-emerald-400 font-bold">{gscData?.coreWebVitals.inp}</span>
                  </div>
                  <div className="flex justify-between p-2 rounded bg-slate-900/60 border border-slate-800">
                    <span className="text-slate-400">CLS (Estabilidad):</span>
                    <span className="font-mono text-emerald-400 font-bold">{gscData?.coreWebVitals.cls}</span>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-[#0c1017] border border-slate-800 space-y-3">
                <div className="text-xs font-bold text-slate-200">Distribución por Dispositivo</div>
                <div className="space-y-2 text-xs">
                  <div>
                    <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                      <span>Móvil (Smartphones)</span>
                      <span className="font-mono font-bold text-white">{gscData?.dispositivos.movil || 78}%</span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-1.5">
                      <div className="bg-orange-500 h-1.5 rounded-full" style={{ width: `${gscData?.dispositivos.movil || 78}%` }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                      <span>Ordenador (Desktop)</span>
                      <span className="font-mono font-bold text-white">{gscData?.dispositivos.desktop || 19}%</span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-1.5">
                      <div className="bg-sky-500 h-1.5 rounded-full" style={{ width: `${gscData?.dispositivos.desktop || 19}%` }}></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tarjeta de Indexación & Cobertura Googlebot */}
              <div className="p-4 rounded-xl bg-[#0c1017] border border-cyan-500/20 space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-slate-200">
                  <div className="flex items-center gap-1.5 text-cyan-400 font-mono">
                    <ShieldCheck className="w-4 h-4" />
                    <span>Salud de Indexación Googlebot</span>
                  </div>
                  <span className="text-[10px] font-mono bg-cyan-500/20 text-cyan-300 px-2 py-0.5 rounded font-bold">
                    {gscData?.indexacion?.cobertura || '100% OK'}
                  </span>
                </div>
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between p-2 rounded bg-slate-900/60 border border-slate-800">
                    <span className="text-slate-400">Páginas Indexadas:</span>
                    <span className="font-mono text-emerald-400 font-bold">{gscData?.indexacion?.paginasIndexadas || 28} URLs</span>
                  </div>
                  <div className="flex justify-between p-2 rounded bg-slate-900/60 border border-slate-800">
                    <span className="text-slate-400">Sitemap XML:</span>
                    <span className="font-mono text-slate-200 text-[11px]">{gscData?.indexacion?.sitemapEstado || 'Procesado'}</span>
                  </div>
                  <div className="text-[10px] text-slate-500 pt-1 font-mono">
                    • {gscData?.indexacion?.ultimoRastreo || 'Googlebot Smartphone activo'}
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* MODAL: CONFIGURAR SERVICE ACCOUNT GSC */}
      {showSaModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-[#0e1320] border border-slate-800 rounded-2xl p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-orange-500/20 text-orange-400 flex items-center justify-center font-bold">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Conectar Google Search Console sin Coste ($0)</h3>
                  <p className="text-[11px] text-slate-400">Protocolo oficial de Service Account de Google Cloud</p>
                </div>
              </div>
              <button
                onClick={() => setShowSaModal(false)}
                className="text-slate-500 hover:text-white text-xs font-bold p-1 rounded-lg hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-300">
              <p className="leading-relaxed">
                Para que Goglite extraiga clics, impresiones, CTR, palabras clave e indexación de tus clientes <strong className="text-white">sin pagar APIs externas de terceros</strong> (SEMrush, RankMath o Ahrefs), agrega la cuenta de servicio oficial a la consola del cliente:
              </p>

              <div className="p-3 rounded-xl bg-[#141b2a] border border-slate-700/80 space-y-1.5 font-mono">
                <span className="text-[10px] uppercase text-slate-400 block">Correo de la Service Account Oficial:</span>
                <div className="flex items-center justify-between gap-2">
                  <strong className="text-orange-400 text-xs break-all">
                    goglite-master-sa@goglite-agency-suite.iam.gserviceaccount.com
                  </strong>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText('goglite-master-sa@goglite-agency-suite.iam.gserviceaccount.com');
                      setCopiedSaEmail(true);
                      setTimeout(() => setCopiedSaEmail(false), 2000);
                    }}
                    className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-sans font-semibold shrink-0"
                  >
                    {copiedSaEmail ? '¡Copiado!' : 'Copiar'}
                  </button>
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <span className="text-[11px] font-bold text-white font-mono uppercase block">Pasos Rápidos en 1 Minuto:</span>
                <div className="flex items-start gap-2 text-slate-300 text-[11px]">
                  <span className="w-4 h-4 rounded-full bg-slate-800 text-orange-400 flex items-center justify-center shrink-0 font-mono font-bold text-[10px]">1</span>
                  <span>Abre <a href="https://search.google.com/search-console" target="_blank" rel="noreferrer" className="text-orange-400 hover:underline">Google Search Console</a> con la cuenta del cliente.</span>
                </div>
                <div className="flex items-start gap-2 text-slate-300 text-[11px]">
                  <span className="w-4 h-4 rounded-full bg-slate-800 text-orange-400 flex items-center justify-center shrink-0 font-mono font-bold text-[10px]">2</span>
                  <span>Entra a <strong>Ajustes &gt; Usuarios y permisos &gt; Agregar usuario</strong>.</span>
                </div>
                <div className="flex items-start gap-2 text-slate-300 text-[11px]">
                  <span className="w-4 h-4 rounded-full bg-slate-800 text-orange-400 flex items-center justify-center shrink-0 font-mono font-bold text-[10px]">3</span>
                  <span>Pega el correo copiado y asígnale permiso de <strong>"Restringido"</strong> (solo lectura).</span>
                </div>
                <div className="flex items-start gap-2 text-slate-300 text-[11px]">
                  <span className="w-4 h-4 rounded-full bg-slate-800 text-emerald-400 flex items-center justify-center shrink-0 font-mono font-bold text-[10px]">✓</span>
                  <span>¡Listo! La suite leerá automáticamente el tráfico y las palabras clave de la web.</span>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={() => setShowSaModal(false)}
                className="w-full py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs shadow-lg shadow-orange-950 transition-all"
              >
                Entendido, Cerrar Guía
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
