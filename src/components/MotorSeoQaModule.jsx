import React, { useState, useEffect } from 'react';
import { Search, ShieldCheck } from 'lucide-react';
import SeoGeoToolsModule from './SeoGeoToolsModule';
import SeoLaunchQaModule from './SeoLaunchQaModule';

export default function MotorSeoQaModule({
  selectedCountry = 'SV',
  initialTab = 'seo_geo'
}) {
  const [activeSubTab, setActiveSubTab] = useState(initialTab);

  useEffect(() => {
    if (initialTab) {
      setActiveSubTab(initialTab);
    }
  }, [initialTab]);

  return (
    <div className="space-y-4">
      {/* Selector de Pestañas Superiores de Fase 5 */}
      <div className="no-print flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2 bg-[#0c1017] p-1 rounded-xl border border-slate-800 w-fit">
          <button
            onClick={() => setActiveSubTab('seo_geo')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeSubTab === 'seo_geo'
                ? 'bg-orange-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            <span>1. SEO & GEO Tools (Google Search Console)</span>
          </button>
          <button
            onClick={() => setActiveSubTab('qa')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeSubTab === 'qa'
                ? 'bg-orange-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>2. Launch QA & Checklist (15 Puntos)</span>
          </button>
        </div>
        <div className="hidden sm:flex items-center gap-2 text-[11px] font-mono text-slate-400">
          <span className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse"></span>
          <span>Fase 5: Motor SEO & Auditoría Pre-Lanzamiento</span>
        </div>
      </div>

      {/* Contenido de la Sub-pestaña Activa */}
      {activeSubTab === 'seo_geo' ? (
        <SeoGeoToolsModule selectedCountry={selectedCountry} />
      ) : (
        <SeoLaunchQaModule selectedCountry={selectedCountry} />
      )}
    </div>
  );
}
