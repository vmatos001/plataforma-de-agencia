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

    </div>
  );
}
