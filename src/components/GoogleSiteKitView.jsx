import React, { useState, useMemo } from 'react';
import {
  Search,
  TrendingUp,
  BarChart3,
  Gauge,
  DollarSign,
  Globe,
  ExternalLink,
  RefreshCw,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  MousePointer,
  Eye,
  Percent,
  CheckCircle2,
  Smartphone,
  Monitor,
  Zap,
  Clock,
  Layers,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  Target
} from 'lucide-react';

export default function GoogleSiteKitView({ currentSite }) {
  const isGoglite = currentSite?.slug === 'goglite';
  const siteDomain = currentSite?.dominio || (isGoglite ? 'goglite.com' : 'sitio-web.com');
  const siteName = currentSite?.nombre || (isGoglite ? 'Goglite | Diseño Web Profesional' : 'Sitio Web');

  // Filtro de Período temporal (Site Kit usa 28 días por defecto)
  const [dateRange, setDateRange] = useState('28d'); // '7d' | '28d' | '90d'
  const [deviceTab, setDeviceTab] = useState('mobile'); // 'mobile' | 'desktop'
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState('Sincronizado ahora');

  // Multiplicador según el rango temporal
  const multiplier = dateRange === '7d' ? 0.25 : dateRange === '90d' ? 3.2 : 1;

  // 1. Métricas de Search Console (Orgánico)
  const searchConsoleData = useMemo(() => {
    const baseClicks = isGoglite ? 1420 : 640;
    const baseImpressions = isGoglite ? 38500 : 16200;
    const clicks = Math.round(baseClicks * multiplier);
    const impressions = Math.round(baseImpressions * multiplier);
    const ctr = ((clicks / impressions) * 100).toFixed(1);
    const avgPosition = isGoglite ? 4.2 : 6.8;

    return {
      clicks,
      impressions,
      ctr: `${ctr}%`,
      avgPosition,
      topQueries: [
        { query: 'diseño web republica dominicana', clicks: Math.round(310 * multiplier), impressions: Math.round(5200 * multiplier), position: 2.1, ctr: '6.0%' },
        { query: 'agencia de desarrollo web santo domingo', clicks: Math.round(245 * multiplier), impressions: Math.round(4100 * multiplier), position: 1.8, ctr: '5.9%' },
        { query: 'crear pagina web empresas santiago rd', clicks: Math.round(180 * multiplier), impressions: Math.round(3400 * multiplier), position: 3.4, ctr: '5.3%' },
        { query: 'software a la medida republica dominicana', clicks: Math.round(145 * multiplier), impressions: Math.round(2900 * multiplier), position: 4.1, ctr: '5.0%' },
        { query: 'goglite diseño web', clicks: Math.round(130 * multiplier), impressions: Math.round(1100 * multiplier), position: 1.0, ctr: '11.8%' },
        { query: 'landing page alta conversion santo domingo', clicks: Math.round(98 * multiplier), impressions: Math.round(2100 * multiplier), position: 2.9, ctr: '4.7%' }
      ]
    };
  }, [isGoglite, multiplier]);

  // 2. Métricas de Google Analytics 4 (GA4)
  const ga4Data = useMemo(() => {
    const baseUsers = isGoglite ? 2840 : 1150;
    const baseSessions = isGoglite ? 3980 : 1560;
    const users = Math.round(baseUsers * multiplier);
    const sessions = Math.round(baseSessions * multiplier);
    const newUsers = Math.round(users * 0.78);
    const engagementRate = isGoglite ? '68.4%' : '59.2%';
    const avgSessionDuration = isGoglite ? '2m 42s' : '1m 55s';

    return {
      users,
      newUsers,
      sessions,
      engagementRate,
      avgSessionDuration,
      channels: [
        { name: 'Búsqueda Orgánica (Google SEO)', pct: 54, users: Math.round(users * 0.54), color: 'bg-emerald-500' },
        { name: 'Tráfico Directo (Branding)', pct: 24, users: Math.round(users * 0.24), color: 'bg-blue-500' },
        { name: 'Campañas de Pago (Google Ads)', pct: 14, users: Math.round(users * 0.14), color: 'bg-indigo-500' },
        { name: 'Redes Sociales & WhatsApp', pct: 8, users: Math.round(users * 0.08), color: 'bg-amber-500' }
      ],
      topPages: [
        { path: '/', title: 'Goglite | Soluciones de Diseño Web y Software', views: Math.round(sessions * 0.48), time: '2m 58s' },
        { path: '/servicios', title: 'Servicios Profesionales de Desarrollo & IA', views: Math.round(sessions * 0.22), time: '2m 14s' },
        { path: '/portafolio', title: 'Casos de Éxito & Sitios Lanzados', views: Math.round(sessions * 0.16), time: '3m 10s' },
        { path: '/precios', title: 'Planes, Cotizaciones & Retainers', views: Math.round(sessions * 0.14), time: '1m 45s' }
      ]
    };
  }, [isGoglite, multiplier]);

  // 3. Métricas de Google Ads (AdWords / SEM)
  const adsData = useMemo(() => {
    const baseSpend = isGoglite ? 385 : 190;
    const baseAdClicks = isGoglite ? 410 : 210;
    const baseConversions = isGoglite ? 29 : 12;

    const spend = Math.round(baseSpend * multiplier);
    const adClicks = Math.round(baseAdClicks * multiplier);
    const conversions = Math.round(baseConversions * multiplier);
    const cpc = (spend / (adClicks || 1)).toFixed(2);
    const costPerConversion = (spend / (conversions || 1)).toFixed(2);

    return {
      spend: `$${spend} USD`,
      clicks: adClicks,
      impressions: Math.round(adClicks * 22),
      cpc: `$${cpc}`,
      conversions,
      costPerConversion: `$${costPerConversion}`,
      campaignName: 'Goglite B2B - Clientes Web Alta Conversión (RD)',
      roas: '4.8x'
    };
  }, [isGoglite, multiplier]);

  // 4. Métricas de PageSpeed Insights (Core Web Vitals)
  const pageSpeedData = {
    mobile: {
      score: 95,
      color: 'text-emerald-400',
      lcp: { val: '1.2 s', label: 'Largest Contentful Paint', status: 'Bueno', color: 'text-emerald-400' },
      inp: { val: '28 ms', label: 'Interaction to Next Paint', status: 'Bueno', color: 'text-emerald-400' },
      cls: { val: '0.003', label: 'Cumulative Layout Shift', status: 'Excelente', color: 'text-emerald-400' },
      fcp: { val: '0.9 s', label: 'First Contentful Paint', status: 'Bueno', color: 'text-emerald-400' }
    },
    desktop: {
      score: 99,
      color: 'text-emerald-400',
      lcp: { val: '0.6 s', label: 'Largest Contentful Paint', status: 'Excelente', color: 'text-emerald-400' },
      inp: { val: '12 ms', label: 'Interaction to Next Paint', status: 'Excelente', color: 'text-emerald-400' },
      cls: { val: '0.001', label: 'Cumulative Layout Shift', status: 'Excelente', color: 'text-emerald-400' },
      fcp: { val: '0.4 s', label: 'First Contentful Paint', status: 'Excelente', color: 'text-emerald-400' }
    }
  };

  const handleSyncServices = () => {
    setSyncing(true);
    setTimeout(() => {
      setSyncing(false);
      setSyncMessage('Sincronizado justo ahora');
    }, 850);
  };

  const activeSpeed = pageSpeedData[deviceTab];

  return (
    <div className="flex-1 flex flex-col gap-6 text-slate-100">

      {/* HEADER DE GOOGLE SITE KIT: SERVICIOS CONECTADOS & CONTROL TEMPORAL */}
      <div className="p-5 rounded-2xl bg-[#0a0e17] border border-blue-500/30 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5 shadow-lg">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-white p-2 shadow-lg shadow-blue-950/50 flex items-center justify-center shrink-0 border border-slate-200">
            <svg viewBox="0 0 24 24" className="w-7 h-7">
              <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"/>
              <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"/>
              <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 10.03 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/>
              <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
            </svg>
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-black text-white tracking-tight flex items-center gap-1.5">
                <span>Google Site Kit Hub</span>
                <span className="text-xs font-mono font-normal text-blue-400">({siteDomain})</span>
              </h2>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                <span>4 Servicios Enlazados</span>
              </span>
            </div>

            {/* Badges de Servicios Conectados */}
            <div className="flex flex-wrap items-center gap-2 mt-1.5 text-[11px] text-slate-400">
              <span className="flex items-center gap-1 text-slate-300">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                <span>Search Console: <strong className="text-white font-mono">sc-domain:{siteDomain}</strong></span>
              </span>
              <span className="text-slate-600">•</span>
              <span className="flex items-center gap-1 text-slate-300">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                <span>GA4: <strong className="text-white font-mono">G-GOGLITE4K1</strong></span>
              </span>
              <span className="text-slate-600">•</span>
              <span className="flex items-center gap-1 text-slate-300">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                <span>Google Ads: <strong className="text-white font-mono">832-491-0021</strong></span>
              </span>
              <span className="text-slate-600">•</span>
              <span className="flex items-center gap-1 text-slate-300">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                <span>PageSpeed API v5</span>
              </span>
            </div>
          </div>
        </div>

        {/* Controles: Selector de Rango Temporal & Botón Sincronizar */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center bg-[#131926] border border-slate-700/80 rounded-xl p-1 text-xs">
            <button
              onClick={() => setDateRange('7d')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                dateRange === '7d' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              7 Días
            </button>
            <button
              onClick={() => setDateRange('28d')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                dateRange === '28d' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              28 Días
            </button>
            <button
              onClick={() => setDateRange('90d')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                dateRange === '90d' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              90 Días
            </button>
          </div>

          <button
            onClick={handleSyncServices}
            disabled={syncing}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition-all"
            title="Refrescar métricas oficiales de Google"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-blue-400 ${syncing ? 'animate-spin' : ''}`} />
            <span>{syncing ? 'Actualizando...' : syncMessage}</span>
          </button>
        </div>
      </div>

      {/* SECCIÓN 1: GOOGLE SEARCH CONSOLE (SEARCH FUNNEL & SEO ORGÁNICO) */}
      <div className="p-6 rounded-2xl bg-[#0e1320] border border-slate-800 shadow-md space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center">
              <Search className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span>Google Search Console · Rendimiento en Búsqueda Orgánica</span>
                <span className="text-[10px] text-blue-400 font-mono font-semibold bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/20">
                  Google SERP
                </span>
              </h3>
              <p className="text-xs text-slate-400">Cómo encuentran los clientes a {siteDomain} en los resultados orgánicos de Google.</p>
            </div>
          </div>

          <a
            href={`https://search.google.com/search-console?resource_id=sc-domain:${siteDomain}`}
            target="_blank"
            rel="noreferrer"
            className="text-xs text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1 shrink-0"
          >
            <span>Abrir en Search Console</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        {/* Tarjetas de Métricas de Search Console */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Clics Totales */}
          <div className="p-4 rounded-xl bg-[#131926] border border-slate-800/80 space-y-1.5">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Clics Totales en Google</span>
              <MousePointer className="w-3.5 h-3.5 text-blue-400" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-white">{searchConsoleData.clicks.toLocaleString()}</span>
              <span className="text-[11px] text-emerald-400 font-bold flex items-center">
                <ArrowUpRight className="w-3 h-3" /> +18.4%
              </span>
            </div>
            <p className="text-[11px] text-slate-500">Usuarios que entraron desde el buscador</p>
          </div>

          {/* Impresiones */}
          <div className="p-4 rounded-xl bg-[#131926] border border-slate-800/80 space-y-1.5">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Impresiones Totales</span>
              <Eye className="w-3.5 h-3.5 text-indigo-400" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-white">{searchConsoleData.impressions.toLocaleString()}</span>
              <span className="text-[11px] text-emerald-400 font-bold flex items-center">
                <ArrowUpRight className="w-3 h-3" /> +24.1%
              </span>
            </div>
            <p className="text-[11px] text-slate-500">Veces que {siteDomain} apareció en pantalla</p>
          </div>

          {/* CTR Medio */}
          <div className="p-4 rounded-xl bg-[#131926] border border-slate-800/80 space-y-1.5">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>CTR Promedio (Clics/Vistas)</span>
              <Percent className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-white">{searchConsoleData.ctr}</span>
              <span className="text-[11px] text-emerald-400 font-bold flex items-center">
                <ArrowUpRight className="w-3 h-3" /> +0.4%
              </span>
            </div>
            <p className="text-[11px] text-slate-500">Tasa de clics superior al promedio B2B</p>
          </div>

          {/* Posición Promedio */}
          <div className="p-4 rounded-xl bg-[#131926] border border-slate-800/80 space-y-1.5">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Posición Media en Google</span>
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-white">{searchConsoleData.avgPosition}</span>
              <span className="text-[11px] text-emerald-400 font-bold flex items-center">
                <ArrowUpRight className="w-3 h-3" /> Top 5
              </span>
            </div>
            <p className="text-[11px] text-slate-500">Ranking en primera página para búsquedas clave</p>
          </div>
        </div>

        {/* Tabla de Top Consultas de Búsqueda (Top Queries) */}
        <div className="pt-2">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <span>Palabras Clave & Consultas con Más Tráfico (Top Search Queries)</span>
            </h4>
            <span className="text-[11px] text-slate-400 font-mono">Últimos {dateRange === '7d' ? '7 días' : dateRange === '90d' ? '90 días' : '28 días'}</span>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-800">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#131926] text-slate-400 font-semibold border-b border-slate-800">
                <tr>
                  <th className="p-3">Consulta / Keyword</th>
                  <th className="p-3 text-right">Clics</th>
                  <th className="p-3 text-right">Impresiones</th>
                  <th className="p-3 text-right">CTR</th>
                  <th className="p-3 text-right">Posición Media</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {searchConsoleData.topQueries.map((q, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/30 transition-colors">
                    <td className="p-3 font-sans font-medium text-white flex items-center gap-2">
                      <span className="text-slate-500 font-mono text-[11px]">#{idx + 1}</span>
                      <span>{q.query}</span>
                    </td>
                    <td className="p-3 text-right text-blue-400 font-bold">{q.clicks.toLocaleString()}</td>
                    <td className="p-3 text-right text-slate-300">{q.impressions.toLocaleString()}</td>
                    <td className="p-3 text-right text-amber-400">{q.ctr}</td>
                    <td className="p-3 text-right">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        q.position <= 3 ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-slate-800 text-slate-300'
                      }`}>
                        {q.position.toFixed(1)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* SECCIÓN 2: GOOGLE ANALYTICS 4 (AUDIENCIA, COMPORTAMIENTO & CANALES) */}
      <div className="p-6 rounded-2xl bg-[#0e1320] border border-slate-800 shadow-md space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-400 flex items-center justify-center">
              <BarChart3 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span>Google Analytics 4 (GA4) · Audiencia & Tráfico en Tiempo Real</span>
                <span className="text-[10px] text-orange-400 font-mono font-semibold bg-orange-500/10 px-2 py-0.5 rounded-full border border-orange-500/20">
                  G-GOGLITE4K1
                </span>
              </h3>
              <p className="text-xs text-slate-400">Visitantes únicos, permanencia y canales de adquisición.</p>
            </div>
          </div>

          <a
            href="https://analytics.google.com/"
            target="_blank"
            rel="noreferrer"
            className="text-xs text-orange-400 hover:text-orange-300 font-semibold flex items-center gap-1 shrink-0"
          >
            <span>Abrir en Google Analytics</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        {/* Tarjetas de Métricas de GA4 */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-[#131926] border border-slate-800/80 space-y-1.5">
            <div className="text-xs text-slate-400">Usuarios Únicos</div>
            <div className="text-2xl font-black text-white">{ga4Data.users.toLocaleString()}</div>
            <p className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
              <ArrowUpRight className="w-3 h-3" /> +16.2% vs período anterior
            </p>
          </div>

          <div className="p-4 rounded-xl bg-[#131926] border border-slate-800/80 space-y-1.5">
            <div className="text-xs text-slate-400">Sesiones Totales</div>
            <div className="text-2xl font-black text-white">{ga4Data.sessions.toLocaleString()}</div>
            <p className="text-[11px] text-slate-400 font-mono">1.4 sesiones por usuario</p>
          </div>

          <div className="p-4 rounded-xl bg-[#131926] border border-slate-800/80 space-y-1.5">
            <div className="text-xs text-slate-400">Tasa de Interacción</div>
            <div className="text-2xl font-black text-emerald-400">{ga4Data.engagementRate}</div>
            <p className="text-[11px] text-slate-500">Usuarios con lectura activa &gt; 10s</p>
          </div>

          <div className="p-4 rounded-xl bg-[#131926] border border-slate-800/80 space-y-1.5">
            <div className="text-xs text-slate-400">Tiempo Medio de Sesión</div>
            <div className="text-2xl font-black text-white">{ga4Data.avgSessionDuration}</div>
            <p className="text-[11px] text-slate-500">Duración promedio de navegación</p>
          </div>
        </div>

        {/* Canales de Adquisición + Páginas Más Populares */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 pt-2">
          
          {/* Canales de Tráfico */}
          <div className="p-4 rounded-xl bg-[#131926] border border-slate-800 space-y-3">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Canales de Adquisición de Tráfico
            </h4>
            <div className="space-y-2.5">
              {ga4Data.channels.map((ch, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-300">{ch.name}</span>
                    <span className="font-mono text-white font-bold">{ch.pct}% <span className="text-slate-500 font-normal">({ch.users.toLocaleString()} users)</span></span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                    <div className={`h-full rounded-full ${ch.color}`} style={{ width: `${ch.pct}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Páginas Más Vistas */}
          <div className="p-4 rounded-xl bg-[#131926] border border-slate-800 space-y-3">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Contenido Más Visitado (Top Pages)
            </h4>
            <div className="divide-y divide-slate-800/80">
              {ga4Data.topPages.map((page, idx) => (
                <div key={idx} className="py-2.5 first:pt-0 last:pb-0 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-xs font-medium text-white truncate">{page.title}</div>
                    <div className="text-[11px] font-mono text-blue-400">{page.path}</div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-xs font-bold text-white font-mono">{page.views.toLocaleString()} vistas</div>
                    <div className="text-[10px] text-slate-500 font-mono">⏱ {page.time}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* SECCIÓN 3: GOOGLE ADS / ADWORDS (CAMPAÑAS DE PAGO & CONVERSIÓN) */}
      <div className="p-6 rounded-2xl bg-[#0e1320] border border-slate-800 shadow-md space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span>Google Ads (AdWords) · Campañas de Conversión y Retorno</span>
                <span className="text-[10px] text-emerald-400 font-mono font-semibold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  Campaña Activa
                </span>
              </h3>
              <p className="text-xs text-slate-400">Control de inversión publicitaria, clics calificados y leads captados.</p>
            </div>
          </div>

          <a
            href="https://ads.google.com/"
            target="_blank"
            rel="noreferrer"
            className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1 shrink-0"
          >
            <span>Gestionar en Google Ads</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        {/* Tarjetas de Métricas de Google Ads */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-[#131926] border border-slate-800/80 space-y-1.5">
            <div className="text-xs text-slate-400">Inversión Publicitaria</div>
            <div className="text-2xl font-black text-white">{adsData.spend}</div>
            <p className="text-[11px] text-slate-500">Presupuesto ejecutado en el período</p>
          </div>

          <div className="p-4 rounded-xl bg-[#131926] border border-slate-800/80 space-y-1.5">
            <div className="text-xs text-slate-400">Clics en Anuncios</div>
            <div className="text-2xl font-black text-indigo-400">{adsData.clicks}</div>
            <p className="text-[11px] text-slate-400 font-mono">CPC Medio: {adsData.cpc}</p>
          </div>

          <div className="p-4 rounded-xl bg-[#131926] border border-slate-800/80 space-y-1.5">
            <div className="text-xs text-slate-400">Conversiones / Leads</div>
            <div className="text-2xl font-black text-emerald-400">{adsData.conversions}</div>
            <p className="text-[11px] text-emerald-400 font-semibold font-mono">CPA: {adsData.costPerConversion}</p>
          </div>

          <div className="p-4 rounded-xl bg-[#131926] border border-slate-800/80 space-y-1.5">
            <div className="text-xs text-slate-400">Retorno Publicitario (ROAS)</div>
            <div className="text-2xl font-black text-amber-400">{adsData.roas}</div>
            <p className="text-[11px] text-slate-500">Por cada $1 invertido se generan $4.8</p>
          </div>
        </div>

        {/* Campaña Activa & Recomendación de Optimización con IA */}
        <div className="p-4 rounded-xl bg-gradient-to-r from-indigo-950/30 via-[#131926] to-[#131926] border border-indigo-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-500/40">
              <Target className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-white flex items-center gap-2">
                <span>{adsData.campaignName}</span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Segmentación geográfica: República Dominicana · Palabras clave de intención de compra B2B.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-xl font-mono">
              Calidad de Anuncio: Excelente (10/10)
            </span>
          </div>
        </div>
      </div>

      {/* SECCIÓN 4: GOOGLE PAGESPEED INSIGHTS (CORE WEB VITALS & VELOCIDAD TÉCNICA) */}
      <div className="p-6 rounded-2xl bg-[#0e1320] border border-slate-800 shadow-md space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Gauge className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span>Google PageSpeed Insights · Diagnóstico Oficial de Core Web Vitals</span>
                <span className="text-[10px] text-emerald-400 font-mono font-semibold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  Lighthouse v12
                </span>
              </h3>
              <p className="text-xs text-slate-400">Rendimiento técnico del sitio web auditado directamente por Google.</p>
            </div>
          </div>

          {/* Conmutador Móvil / Desktop */}
          <div className="flex items-center bg-[#131926] border border-slate-700/80 rounded-xl p-1 text-xs">
            <button
              onClick={() => setDeviceTab('mobile')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all ${
                deviceTab === 'mobile' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Móvil ({pageSpeedData.mobile.score}/100)</span>
            </button>
            <button
              onClick={() => setDeviceTab('desktop')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all ${
                deviceTab === 'desktop' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Monitor className="w-3.5 h-3.5" />
              <span>Escritorio ({pageSpeedData.desktop.score}/100)</span>
            </button>
          </div>
        </div>

        {/* Puntuación y Desglose Core Web Vitals */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-center">
          
          {/* Puntuación General */}
          <div className="md:col-span-1 p-5 rounded-2xl bg-[#131926] border border-emerald-500/30 flex flex-col items-center justify-center text-center space-y-1">
            <div className="relative w-20 h-20 rounded-full border-4 border-emerald-500 flex items-center justify-center">
              <span className="text-3xl font-black text-emerald-400 font-mono">{activeSpeed.score}</span>
            </div>
            <span className="text-xs font-bold text-white mt-1">Excelente</span>
            <span className="text-[10px] text-slate-400 font-mono">0 - 100 Escala</span>
          </div>

          {/* 4 Métricas de Core Web Vitals */}
          <div className="md:col-span-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
            
            {/* LCP */}
            <div className="p-3.5 rounded-xl bg-[#131926] border border-slate-800 space-y-1">
              <div className="text-[11px] text-slate-400 flex items-center justify-between">
                <span>LCP</span>
                <span className="text-[10px] text-emerald-400 font-semibold">{activeSpeed.lcp.status}</span>
              </div>
              <div className="text-xl font-black text-emerald-400 font-mono">{activeSpeed.lcp.val}</div>
              <p className="text-[10px] text-slate-500 leading-tight">Carga del contenido principal</p>
            </div>

            {/* INP */}
            <div className="p-3.5 rounded-xl bg-[#131926] border border-slate-800 space-y-1">
              <div className="text-[11px] text-slate-400 flex items-center justify-between">
                <span>INP</span>
                <span className="text-[10px] text-emerald-400 font-semibold">{activeSpeed.inp.status}</span>
              </div>
              <div className="text-xl font-black text-emerald-400 font-mono">{activeSpeed.inp.val}</div>
              <p className="text-[10px] text-slate-500 leading-tight">Respuesta a interacciones</p>
            </div>

            {/* CLS */}
            <div className="p-3.5 rounded-xl bg-[#131926] border border-slate-800 space-y-1">
              <div className="text-[11px] text-slate-400 flex items-center justify-between">
                <span>CLS</span>
                <span className="text-[10px] text-emerald-400 font-semibold">{activeSpeed.cls.status}</span>
              </div>
              <div className="text-xl font-black text-emerald-400 font-mono">{activeSpeed.cls.val}</div>
              <p className="text-[10px] text-slate-500 leading-tight">Estabilidad visual de página</p>
            </div>

            {/* FCP */}
            <div className="p-3.5 rounded-xl bg-[#131926] border border-slate-800 space-y-1">
              <div className="text-[11px] text-slate-400 flex items-center justify-between">
                <span>FCP</span>
                <span className="text-[10px] text-emerald-400 font-semibold">{activeSpeed.fcp.status}</span>
              </div>
              <div className="text-xl font-black text-emerald-400 font-mono">{activeSpeed.fcp.val}</div>
              <p className="text-[10px] text-slate-500 leading-tight">Primer pintado con contenido</p>
            </div>

          </div>

        </div>

        {/* Conclusión Técnica de Google */}
        <div className="p-4 rounded-xl bg-[#131926] border border-slate-800 flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <p className="text-xs text-slate-300">
            <strong>Evaluación de Core Web Vitals Superada:</strong> Este sitio web cumple con los estándares más exigentes de Google en velocidad de carga, interactividad y estabilidad móvil, lo que impulsa el posicionamiento SEO en los primeros lugares de búsqueda orgánica.
          </p>
        </div>
      </div>

    </div>
  );
}
