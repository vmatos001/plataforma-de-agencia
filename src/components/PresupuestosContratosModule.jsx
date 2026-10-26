import React, { useState, useEffect } from 'react';
import { FileText, Briefcase } from 'lucide-react';
import PresupuestosModule from './PresupuestosModule';
import ContratosOnboardingModule from './ContratosOnboardingModule';

export default function PresupuestosContratosModule({
  selectedCountry = 'SV',
  leadToConvert,
  onClearLeadConvert,
  onNavigateToRentabilidad,
  onConvertToFactura,
  initialTab = 'presupuestos',
  agencySettings
}) {
  const [activeSubTab, setActiveSubTab] = useState(initialTab);
  const handleNavigateToRentabilidad = onNavigateToRentabilidad || onConvertToFactura;

  // Al convertir un lead, activar automáticamente la pestaña de presupuestos
  useEffect(() => {
    if (leadToConvert) {
      setActiveSubTab('presupuestos');
    }
  }, [leadToConvert]);

  // Si cambia initialTab desde el padre
  useEffect(() => {
    if (initialTab) {
      setActiveSubTab(initialTab);
    }
  }, [initialTab]);

  return (
    <div className="space-y-4">
      {/* Selector de Pestañas Superiores de Fase 3 */}
      <div className="no-print flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2 bg-[#0c1017] p-1 rounded-xl border border-slate-800 w-fit">
          <button
            onClick={() => setActiveSubTab('presupuestos')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeSubTab === 'presupuestos'
                ? 'bg-orange-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>1. Presupuestos & Propuestas VIP</span>
          </button>
          <button
            onClick={() => setActiveSubTab('contratos')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeSubTab === 'contratos'
                ? 'bg-orange-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Briefcase className="w-3.5 h-3.5" />
            <span>2. Contratos SOW & Onboarding</span>
          </button>
        </div>
        <div className="hidden sm:flex items-center gap-2 text-[11px] font-mono text-slate-400">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>Fase 3: Cierre Comercial & Firma Legal</span>
        </div>
      </div>

      {/* Contenido de la Sub-pestaña Activa */}
      {activeSubTab === 'presupuestos' ? (
        <PresupuestosModule
          selectedCountry={selectedCountry}
          leadToConvert={leadToConvert}
          onClearLeadConvert={onClearLeadConvert}
          onNavigateToContratos={() => setActiveSubTab('contratos')}
          onNavigateToRentabilidad={handleNavigateToRentabilidad}
          agencySettings={agencySettings}
        />
      ) : (
        <ContratosOnboardingModule
          selectedCountry={selectedCountry}
          onNavigateToPresupuestos={() => setActiveSubTab('presupuestos')}
        />
      )}
    </div>
  );
}
