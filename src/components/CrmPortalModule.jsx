import React, { useState, useEffect } from 'react';
import {
  Kanban,
  Users,
  DollarSign,
  TrendingUp,
  Search,
  Filter,
  Plus,
  ArrowRight,
  ArrowLeft,
  Phone,
  Mail,
  MessageSquare,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  Briefcase,
  ExternalLink,
  ChevronRight,
  Upload,
  Link as LinkIcon,
  Copy,
  Check,
  Building2,
  Globe,
  Trash2,
  Edit,
  Sparkles,
  ShieldCheck,
  Eye,
  Send,
  X
} from 'lucide-react';

const PIPELINE_STAGES = [
  { id: 'nuevo', label: 'Nuevo Lead', color: 'border-slate-600', badge: 'bg-slate-700/50 text-slate-300', dot: 'bg-slate-400' },
  { id: 'contactado', label: 'Contactado', color: 'border-sky-500/40', badge: 'bg-sky-500/10 text-sky-400', dot: 'bg-sky-400' },
  { id: 'reunion', label: 'Reunión / Demo', color: 'border-indigo-500/40', badge: 'bg-indigo-500/10 text-indigo-400', dot: 'bg-indigo-400' },
  { id: 'propuesta_enviada', label: 'Propuesta Enviada', color: 'border-amber-500/40', badge: 'bg-amber-500/10 text-amber-400', dot: 'bg-amber-400' },
  { id: 'negociacion', label: 'Negociación', color: 'border-orange-500/40', badge: 'bg-orange-500/10 text-orange-400', dot: 'bg-orange-400' },
  { id: 'ganado', label: 'Cerrado Ganado', color: 'border-emerald-500/50', badge: 'bg-emerald-500/15 text-emerald-400', dot: 'bg-emerald-400' },
  { id: 'perdido', label: 'Perdido', color: 'border-rose-900/40', badge: 'bg-rose-900/30 text-rose-400', dot: 'bg-rose-500' }
];

export default function CrmPortalModule({ onConvertToPresupuesto, onOpenContrato }) {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCountry, setSelectedCountry] = useState('ALL'); // 'ALL' | 'SV' | 'DO'
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('kanban'); // 'kanban' | 'tabla' | 'portal_preview'
  
  // Modal for lead details & interactions
  const [activeLeadModal, setActiveLeadModal] = useState(null);
  const [interactionForm, setInteractionForm] = useState({
    tipo: 'whatsapp',
    titulo: '',
    detalle: '',
    proximoPaso: '',
    fechaProximoPaso: ''
  });

  // Modal for creating new lead
  const [createLeadModalOpen, setCreateLeadModalOpen] = useState(false);
  const [newLeadForm, setNewLeadForm] = useState({
    empresa: '',
    contacto: '',
    cargo: '',
    email: '',
    telefono: '',
    pais: 'SV',
    dominio: '',
    valorEstimado: 1500,
    etapa: 'nuevo',
    notasIniciales: ''
  });

  // Portal preview state
  const [selectedPortalLeadId, setSelectedPortalLeadId] = useState(null);
  const [portalData, setPortalData] = useState(null);
  const [portalCopied, setPortalCopied] = useState(false);

  // Fetch leads
  useEffect(() => {
    fetchCrmLeads();
  }, []);

  const fetchCrmLeads = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/crm/leads');
      if (res.ok) {
        const data = await res.json();
        setLeads(data);
        if (data.length > 0 && !selectedPortalLeadId) {
          setSelectedPortalLeadId(data[0].id);
        }
      }
    } catch (err) {
      console.error('Error fetching CRM leads:', err);
    } finally {
      setLoading(false);
    }
  };

  // Change lead stage
  const handleStageChange = async (leadId, newStage) => {
    try {
      const res = await fetch(`/api/crm/leads/${leadId}/stage`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ etapa: newStage })
      });
      if (res.ok) {
        const updated = await res.json();
        setLeads(prev => prev.map(l => l.id === leadId ? updated : l));
        if (activeLeadModal && activeLeadModal.id === leadId) {
          setActiveLeadModal(updated);
        }
      }
    } catch (err) {
      console.error('Error actualizando etapa:', err);
    }
  };

  // Add interaction
  const handleAddInteraction = async (e) => {
    e.preventDefault();
    if (!activeLeadModal || !interactionForm.titulo) return;

    try {
      const res = await fetch(`/api/crm/leads/${activeLeadModal.id}/interactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(interactionForm)
      });
      if (res.ok) {
        const updated = await res.json();
        setLeads(prev => prev.map(l => l.id === activeLeadModal.id ? updated : l));
        setActiveLeadModal(updated);
        setInteractionForm({
          tipo: 'whatsapp',
          titulo: '',
          detalle: '',
          proximoPaso: '',
          fechaProximoPaso: ''
        });
      }
    } catch (err) {
      console.error('Error agregando interacción:', err);
    }
  };

  // Create new lead
  const handleCreateLead = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/crm/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newLeadForm)
      });
      if (res.ok) {
        const created = await res.json();
        setLeads(prev => [created, ...prev]);
        setCreateLeadModalOpen(false);
        setNewLeadForm({
          empresa: '',
          contacto: '',
          cargo: '',
          email: '',
          telefono: '',
          pais: 'SV',
          dominio: '',
          valorEstimado: 1500,
          etapa: 'nuevo',
          notasIniciales: ''
        });
      }
    } catch (err) {
      console.error('Error creando lead:', err);
    }
  };

  // Copy portal link
  const handleCopyPortalLink = (token) => {
    const url = `${window.location.origin}/portal/${token}`;
    navigator.clipboard.writeText(url);
    setPortalCopied(true);
    setTimeout(() => setPortalCopied(false), 2000);
  };

  // Filter leads
  const filteredLeads = leads.filter(l => {
    const matchesCountry = selectedCountry === 'ALL' || l.pais === selectedCountry;
    const term = searchTerm.toLowerCase();
    const matchesSearch = !term ||
      l.empresa?.toLowerCase().includes(term) ||
      l.contacto?.toLowerCase().includes(term) ||
      l.dominio?.toLowerCase().includes(term) ||
      l.email?.toLowerCase().includes(term);
    return matchesCountry && matchesSearch;
  });

  // Calculate metrics
  const totalPipeline = filteredLeads.filter(l => l.etapa !== 'perdido').reduce((acc, l) => acc + (Number(l.valorEstimado) || 0), 0);
  const totalGanado = filteredLeads.filter(l => l.etapa === 'ganado').reduce((acc, l) => acc + (Number(l.valorEstimado) || 0), 0);
  const leadsGanadosCount = filteredLeads.filter(l => l.etapa === 'ganado').length;
  const tasaConversion = filteredLeads.length > 0 ? Math.round((leadsGanadosCount / filteredLeads.length) * 100) : 0;

  // Selected lead for portal preview
  const currentPortalLead = leads.find(l => l.id === selectedPortalLeadId) || leads[0];

  return (
    <div className="flex-1 overflow-y-auto bg-[#080b11] p-6 text-slate-100 flex flex-col gap-6">
      
      {/* 1. TOP STATS BAR */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-[#0e131f] border border-slate-800/80 flex items-center justify-between shadow-sm">
          <div>
            <div className="text-xs font-mono uppercase text-slate-400 font-semibold">Pipeline Activo</div>
            <div className="text-2xl font-black text-white mt-1">
              ${totalPipeline.toLocaleString()} <span className="text-xs font-normal text-slate-400">USD</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">En negociación & propuestas</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-400 flex items-center justify-center font-bold">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#0e131f] border border-slate-800/80 flex items-center justify-between shadow-sm">
          <div>
            <div className="text-xs font-mono uppercase text-slate-400 font-semibold">Cerrado Ganado</div>
            <div className="text-2xl font-black text-emerald-400 mt-1">
              ${totalGanado.toLocaleString()} <span className="text-xs font-normal text-slate-400">USD</span>
            </div>
            <div className="text-[11px] text-emerald-500/80 mt-0.5">{leadsGanadosCount} contratos firmados</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#0e131f] border border-slate-800/80 flex items-center justify-between shadow-sm">
          <div>
            <div className="text-xs font-mono uppercase text-slate-400 font-semibold">Tasa de Conversión</div>
            <div className="text-2xl font-black text-sky-400 mt-1">
              {tasaConversion}%
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">De lead prospectado a cliente</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#0e131f] border border-slate-800/80 flex items-center justify-between shadow-sm">
          <div>
            <div className="text-xs font-mono uppercase text-slate-400 font-semibold">Prospectos Totales</div>
            <div className="text-2xl font-black text-white mt-1">
              {filteredLeads.length} <span className="text-xs font-normal text-slate-400">en embudo</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">Costo por software: $0 USD</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold">
            <Users className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* 2. FILTER & CONTROLS HEADER */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 p-4 rounded-xl bg-[#0e131f] border border-slate-800/80">
        
        {/* Search & Country Filter */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative min-w-[240px]">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por empresa, contacto o dominio..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#131926] border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-orange-500/50"
            />
          </div>

          <div className="flex items-center bg-[#131926] border border-slate-800 rounded-lg p-0.5 text-xs">
            <button
              onClick={() => setSelectedCountry('ALL')}
              className={`px-2.5 py-1 rounded-md transition-colors ${selectedCountry === 'ALL' ? 'bg-orange-600 text-white font-semibold' : 'text-slate-400 hover:text-slate-200'}`}
            >
              Todos
            </button>
            <button
              onClick={() => setSelectedCountry('SV')}
              className={`px-2.5 py-1 rounded-md transition-colors ${selectedCountry === 'SV' ? 'bg-orange-600 text-white font-semibold' : 'text-slate-400 hover:text-slate-200'}`}
            >
              🇸🇻 El Salvador
            </button>
            <button
              onClick={() => setSelectedCountry('DO')}
              className={`px-2.5 py-1 rounded-md transition-colors ${selectedCountry === 'DO' ? 'bg-orange-600 text-white font-semibold' : 'text-slate-400 hover:text-slate-200'}`}
            >
              🇩🇴 Rep. Dominicana
            </button>
          </div>
        </div>

        {/* View Switch & Action */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center bg-[#131926] border border-slate-800 rounded-lg p-0.5 text-xs">
            <button
              onClick={() => setActiveTab('kanban')}
              className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-colors ${activeTab === 'kanban' ? 'bg-slate-800 text-orange-400 font-semibold' : 'text-slate-400 hover:text-slate-200'}`}
            >
              <Kanban className="w-3.5 h-3.5" />
              <span>Kanban</span>
            </button>
            <button
              onClick={() => setActiveTab('tabla')}
              className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-colors ${activeTab === 'tabla' ? 'bg-slate-800 text-orange-400 font-semibold' : 'text-slate-400 hover:text-slate-200'}`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Lista</span>
            </button>
            <button
              onClick={() => setActiveTab('portal_preview')}
              className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-colors ${activeTab === 'portal_preview' ? 'bg-orange-600/20 text-orange-400 border border-orange-500/30 font-semibold' : 'text-slate-400 hover:text-slate-200'}`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Portal de Cliente</span>
            </button>
          </div>

          <button
            onClick={() => setCreateLeadModalOpen(true)}
            className="px-3.5 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-500 text-white font-semibold text-xs flex items-center gap-1.5 shadow-md shadow-orange-950 transition-all shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Nuevo Lead</span>
          </button>
        </div>
      </div>

      {/* 3. MAIN CONTENT: KANBAN OR TABLE OR PORTAL PREVIEW */}
      {activeTab === 'kanban' && (
        <div className="flex gap-4 overflow-x-auto pb-4 items-start select-none">
          {PIPELINE_STAGES.map(stage => {
            const stageLeads = filteredLeads.filter(l => l.etapa === stage.id);
            const stageValue = stageLeads.reduce((acc, l) => acc + (Number(l.valorEstimado) || 0), 0);

            return (
              <div 
                key={stage.id} 
                className="w-72 shrink-0 bg-[#0c1017] border border-slate-800/80 rounded-xl flex flex-col max-h-[calc(100vh-280px)]"
              >
                {/* Column Header */}
                <div className="p-3 border-b border-slate-800/80 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${stage.dot}`}></span>
                    <span className="font-bold text-xs text-slate-200">{stage.label}</span>
                    <span className="text-[10px] bg-slate-800/90 text-slate-400 px-1.5 py-0.2 rounded-full font-mono">
                      {stageLeads.length}
                    </span>
                  </div>
                  <span className="text-[11px] font-mono font-semibold text-slate-400">
                    ${stageValue.toLocaleString()}
                  </span>
                </div>

                {/* Cards List */}
                <div className="p-2 space-y-2.5 overflow-y-auto flex-1">
                  {stageLeads.length === 0 ? (
                    <div className="text-center py-8 text-slate-600 text-xs italic">
                      Sin prospectos
                    </div>
                  ) : (
                    stageLeads.map(lead => (
                      <div
                        key={lead.id}
                        className="p-3 rounded-lg bg-[#111624] border border-slate-800/70 hover:border-slate-700 transition-all shadow-sm flex flex-col gap-2 group"
                      >
                        {/* Header: Company & Country */}
                        <div className="flex items-start justify-between gap-1.5">
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-xs text-white truncate" title={lead.empresa}>
                              {lead.empresa}
                            </h4>
                            <p className="text-[11px] text-slate-400 truncate">
                              {lead.contacto} · <span className="text-slate-500">{lead.cargo}</span>
                            </p>
                          </div>
                          <span className="text-xs shrink-0" title={lead.pais === 'SV' ? 'El Salvador' : 'República Dominicana'}>
                            {lead.pais === 'SV' ? '🇸🇻' : '🇩🇴'}
                          </span>
                        </div>

                        {/* Deal Value & Probability */}
                        <div className="flex items-center justify-between py-1 border-y border-slate-800/50 text-[11px]">
                          <span className="font-mono font-bold text-orange-400">
                            ${Number(lead.valorEstimado).toLocaleString()} USD
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {lead.probabilidad}% prob.
                          </span>
                        </div>

                        {/* Quick Actions Bar */}
                        <div className="flex items-center justify-between pt-1">
                          <div className="flex items-center gap-1">
                            {lead.telefono && (
                              <a
                                href={`https://wa.me/${lead.telefono.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Hola ${lead.contacto}, un saludo desde Goglite. Estuvimos analizando ${lead.empresa} y tenemos una propuesta de alto impacto para su captación web.`)}`}
                                target="_blank"
                                rel="noreferrer"
                                title="Enviar WhatsApp"
                                className="w-6 h-6 rounded bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 flex items-center justify-center transition-colors"
                              >
                                <MessageSquare className="w-3 h-3" />
                              </a>
                            )}
                            {lead.email && (
                              <a
                                href={`mailto:${lead.email}?subject=Propuesta Estratégica para ${lead.empresa}`}
                                title="Enviar Correo"
                                className="w-6 h-6 rounded bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 flex items-center justify-center transition-colors"
                              >
                                <Mail className="w-3 h-3" />
                              </a>
                            )}
                            <button
                              onClick={() => setActiveLeadModal(lead)}
                              title="Bitácora e Interacciones"
                              className="w-6 h-6 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-colors text-[10px] font-mono"
                            >
                              💬 {lead.interacciones?.length || 0}
                            </button>
                          </div>

                          {/* Stage Mover Selector */}
                          <div className="flex items-center gap-1">
                            <select
                              value={lead.etapa}
                              onChange={(e) => handleStageChange(lead.id, e.target.value)}
                              className="text-[10px] bg-[#171e2e] border border-slate-700 rounded px-1.5 py-0.5 text-slate-300 focus:outline-none focus:border-orange-500"
                            >
                              {PIPELINE_STAGES.map(s => (
                                <option key={s.id} value={s.id}>{s.label}</option>
                              ))}
                            </select>
                          </div>
                        </div>

                        {/* Bottom Link to Proposal or Contract */}
                        <div className="flex items-center justify-between pt-1 border-t border-slate-800/40 text-[10px]">
                          <button
                            onClick={() => onConvertToPresupuesto && onConvertToPresupuesto(lead)}
                            className="text-orange-400 hover:text-orange-300 font-medium flex items-center gap-1 transition-colors"
                          >
                            <FileText className="w-3 h-3" />
                            <span>Crear Presupuesto</span>
                          </button>

                          <button
                            onClick={() => {
                              setSelectedPortalLeadId(lead.id);
                              setActiveTab('portal_preview');
                            }}
                            className="text-slate-400 hover:text-slate-200 flex items-center gap-1 transition-colors"
                          >
                            <Eye className="w-3 h-3" />
                            <span>Portal</span>
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TABLA VIEW */}
      {activeTab === 'tabla' && (
        <div className="bg-[#0c1017] border border-slate-800/80 rounded-xl overflow-hidden shadow-sm">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-[#101522] border-b border-slate-800 text-[11px] font-mono uppercase text-slate-400">
              <tr>
                <th className="p-3">Empresa & Dominio</th>
                <th className="p-3">Contacto</th>
                <th className="p-3">País</th>
                <th className="p-3">Etapa Pipeline</th>
                <th className="p-3">Valor USD</th>
                <th className="p-3">Bitácora</th>
                <th className="p-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {filteredLeads.map(lead => (
                <tr key={lead.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="p-3">
                    <div className="font-semibold text-white">{lead.empresa}</div>
                    <div className="text-[11px] text-slate-500 font-mono">{lead.dominio || 'Sin dominio'}</div>
                  </td>
                  <td className="p-3">
                    <div>{lead.contacto}</div>
                    <div className="text-[11px] text-slate-500">{lead.cargo}</div>
                  </td>
                  <td className="p-3">
                    <span className="font-mono text-xs">{lead.pais === 'SV' ? '🇸🇻 SV' : '🇩🇴 DO'}</span>
                  </td>
                  <td className="p-3">
                    <select
                      value={lead.etapa}
                      onChange={(e) => handleStageChange(lead.id, e.target.value)}
                      className="text-xs bg-[#131926] border border-slate-700 rounded px-2 py-1 text-slate-200"
                    >
                      {PIPELINE_STAGES.map(s => (
                        <option key={s.id} value={s.id}>{s.label}</option>
                      ))}
                    </select>
                  </td>
                  <td className="p-3 font-mono font-bold text-orange-400">
                    ${Number(lead.valorEstimado).toLocaleString()}
                  </td>
                  <td className="p-3">
                    <button
                      onClick={() => setActiveLeadModal(lead)}
                      className="text-xs text-sky-400 hover:underline flex items-center gap-1"
                    >
                      <span>{lead.interacciones?.length || 0} registros</span>
                    </button>
                  </td>
                  <td className="p-3 text-right space-x-2">
                    <button
                      onClick={() => onConvertToPresupuesto && onConvertToPresupuesto(lead)}
                      className="px-2.5 py-1 rounded bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 font-medium text-xs transition-colors"
                    >
                      Presupuesto
                    </button>
                    <button
                      onClick={() => {
                        setSelectedPortalLeadId(lead.id);
                        setActiveTab('portal_preview');
                      }}
                      className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs transition-colors"
                    >
                      Ver Portal
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* PORTAL DE CLIENTE VIEW (SIMULATOR) */}
      {activeTab === 'portal_preview' && currentPortalLead && (
        <div className="flex flex-col gap-6 max-w-5xl mx-auto w-full">
          
          {/* Simulator Bar */}
          <div className="p-4 rounded-xl bg-orange-500/10 border border-orange-500/20 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-orange-400 animate-pulse"></span>
              <span className="font-semibold text-orange-300">
                Simulador del Portal Privado que ve tu Cliente en vivo
              </span>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1 text-slate-300">
                <span>Cliente:</span>
                <select
                  value={selectedPortalLeadId}
                  onChange={(e) => setSelectedPortalLeadId(e.target.value)}
                  className="bg-[#131926] border border-slate-700 rounded px-2 py-1 text-xs text-white"
                >
                  {leads.map(l => (
                    <option key={l.id} value={l.id}>{l.empresa} ({l.contacto})</option>
                  ))}
                </select>
              </div>

              <button
                onClick={() => handleCopyPortalLink(currentPortalLead.portalToken)}
                className="px-3 py-1 rounded-lg bg-orange-600 hover:bg-orange-500 text-white font-medium flex items-center gap-1.5 transition-all shadow-sm"
              >
                {portalCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{portalCopied ? 'Enlace Copiado' : 'Copiar Enlace del Portal'}</span>
              </button>
            </div>
          </div>

          {/* Actual Client Portal Card (Branded) */}
          <div className="rounded-2xl bg-[#0b0f19] border border-slate-800 shadow-2xl p-6 sm:p-8 space-y-8">
            
            {/* Brand Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-6 border-b border-slate-800 gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center font-black text-white text-lg">
                  G
                </div>
                <div>
                  <h2 className="text-xl font-black text-white tracking-tight">Portal de Cliente · Goglite</h2>
                  <p className="text-xs text-slate-400">Área privada de gestión y entregables del proyecto</p>
                </div>
              </div>

              <div className="text-right">
                <div className="text-xs font-mono text-slate-400 uppercase">Proyecto Asignado a:</div>
                <div className="text-sm font-bold text-orange-400">{currentPortalLead.empresa}</div>
                <div className="text-xs text-slate-500">{currentPortalLead.contacto} · {currentPortalLead.pais === 'SV' ? '🇸🇻 El Salvador' : '🇩🇴 República Dominicana'}</div>
              </div>
            </div>

            {/* Project Progress Stepper */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-200">Estado de Ejecución del Proyecto</h3>
                <span className="text-xs font-mono bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full font-semibold">
                  {currentPortalLead.portalConfig?.faseActual || 'Diagnóstico Comercial'}
                </span>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-slate-800/80 rounded-full h-2.5 overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-orange-500 to-emerald-400 h-2.5 rounded-full transition-all duration-500"
                  style={{ width: `${currentPortalLead.portalConfig?.progresoPorcentaje || 25}%` }}
                ></div>
              </div>

              {/* Steps Milestones */}
              <div className="grid grid-cols-2 md:grid-cols-6 gap-2 text-center pt-2">
                {[
                  { step: '1. Diagnóstico', done: true },
                  { step: '2. Presupuesto', done: ['propuesta_enviada', 'negociacion', 'ganado'].includes(currentPortalLead.etapa) },
                  { step: '3. Contrato SOW', done: ['negociacion', 'ganado'].includes(currentPortalLead.etapa) },
                  { step: '4. Activos & Logo', done: currentPortalLead.etapa === 'ganado' },
                  { step: '5. Desarrollo Web', done: false },
                  { step: '6. Lanzamiento', done: false }
                ].map((m, i) => (
                  <div key={i} className={`p-2 rounded-lg border text-xs ${m.done ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300 font-semibold' : 'bg-slate-900/50 border-slate-800 text-slate-500'}`}>
                    <div className="text-[10px] mb-0.5">{m.done ? '✓ Completado' : 'Pendiente'}</div>
                    <div>{m.step}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Deliverables & Client Assets Area */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-800">
              
              {/* Left Column: Official Documents */}
              <div className="space-y-4">
                <h4 className="text-xs font-mono uppercase tracking-wider text-slate-400 font-bold">
                  Documentos & Propuestas Oficiales
                </h4>

                <div className="p-4 rounded-xl bg-[#101625] border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <FileText className="w-5 h-5 text-orange-400" />
                      <div>
                        <div className="text-xs font-bold text-white">Presupuesto VIP Personalizado</div>
                        <div className="text-[10px] text-slate-400">PDF de 3 páginas con arquitectura y tiers</div>
                      </div>
                    </div>
                    <button
                      onClick={() => onConvertToPresupuesto && onConvertToPresupuesto(currentPortalLead)}
                      className="px-2.5 py-1 rounded bg-orange-600/20 hover:bg-orange-600/30 text-orange-400 border border-orange-500/30 text-xs font-semibold flex items-center gap-1"
                    >
                      <Eye className="w-3 h-3" />
                      <span>Ver Documento</span>
                    </button>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-[#101625] border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <Briefcase className="w-5 h-5 text-indigo-400" />
                      <div>
                        <div className="text-xs font-bold text-white">Contrato SOW & Firma Digital</div>
                        <div className="text-[10px] text-slate-400">Términos legales y cuentas bancarias locales</div>
                      </div>
                    </div>
                    <button
                      onClick={() => onOpenContrato && onOpenContrato()}
                      className="px-2.5 py-1 rounded bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-xs font-semibold flex items-center gap-1"
                    >
                      <ShieldCheck className="w-3 h-3" />
                      <span>Firma Legal</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Right Column: Upload Client Assets */}
              <div className="space-y-4">
                <h4 className="text-xs font-mono uppercase tracking-wider text-slate-400 font-bold">
                  Carga de Materiales de tu Marca
                </h4>

                <div className="p-4 rounded-xl bg-[#101625] border border-slate-800 space-y-3">
                  <div className="text-xs text-slate-300">
                    Sube tu logotipo en alta resolución (.png o .svg), manual de colores o accesos de hosting.
                  </div>

                  <div className="border-2 border-dashed border-slate-700 rounded-xl p-4 text-center hover:border-orange-500/50 transition-colors cursor-pointer">
                    <Upload className="w-6 h-6 text-slate-500 mx-auto mb-1.5" />
                    <div className="text-xs font-semibold text-slate-300">Haz clic o arrastra tus archivos aquí</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">PNG, JPG, PDF, ZIP hasta 25MB</div>
                  </div>

                  {/* List of uploaded files */}
                  <div className="space-y-1.5 pt-2">
                    {currentPortalLead.portalConfig?.archivosSubidos?.map(f => (
                      <div key={f.id} className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-slate-900/60 border border-slate-800 text-xs">
                        <span className="text-slate-300 truncate">{f.nombre}</span>
                        <span className="text-[10px] text-emerald-400 font-mono">Recibido</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Direct WhatsApp Contact with Project Manager */}
            <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-950/30 to-[#0e1320] border border-emerald-500/30 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold">
                  VM
                </div>
                <div>
                  <div className="text-xs font-bold text-white">Director de Proyecto Asignado: Víctor Matos</div>
                  <div className="text-[11px] text-slate-400">Atención personalizada y soporte directo para {currentPortalLead.empresa}</div>
                </div>
              </div>

              <a
                href={`https://wa.me/50370001122?text=${encodeURIComponent(`Hola Víctor, te escribo desde el Portal de Cliente de ${currentPortalLead.empresa}.`)}`}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center gap-2 shadow-lg shadow-emerald-950 transition-all shrink-0"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Contactar por WhatsApp</span>
              </a>
            </div>

          </div>
        </div>
      )}

      {/* MODAL: LEAD DETAILS & INTERACTION TIMELINE */}
      {activeLeadModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0e1320] border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base text-white">{activeLeadModal.empresa}</h3>
                <p className="text-xs text-slate-400">
                  {activeLeadModal.contacto} ({activeLeadModal.cargo}) · {activeLeadModal.pais === 'SV' ? '🇸🇻 El Salvador' : '🇩🇴 República Dominicana'}
                </p>
              </div>
              <button
                onClick={() => setActiveLeadModal(null)}
                className="w-8 h-8 rounded-lg bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-5 overflow-y-auto space-y-6 flex-1">
              
              {/* Quick Status Bar */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-[#131926] border border-slate-800 text-xs">
                <div>
                  <span className="text-slate-400">Etapa Actual: </span>
                  <select
                    value={activeLeadModal.etapa}
                    onChange={(e) => handleStageChange(activeLeadModal.id, e.target.value)}
                    className="bg-[#1b2336] text-orange-400 font-semibold rounded px-2 py-0.5 border border-slate-700 ml-1"
                  >
                    {PIPELINE_STAGES.map(s => (
                      <option key={s.id} value={s.id}>{s.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <span className="text-slate-400">Valor Estimado: </span>
                  <span className="font-mono font-bold text-white">${Number(activeLeadModal.valorEstimado).toLocaleString()} USD</span>
                </div>
              </div>

              {/* Form to Add New Interaction */}
              <form onSubmit={handleAddInteraction} className="p-4 rounded-xl bg-[#131926] border border-slate-800 space-y-3">
                <div className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <Plus className="w-3.5 h-3.5 text-orange-400" />
                  <span>Registrar Nueva Actividad / Interacción</span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={interactionForm.tipo}
                    onChange={(e) => setInteractionForm({ ...interactionForm, tipo: e.target.value })}
                    className="bg-[#0c1017] border border-slate-700 rounded-lg p-2 text-xs text-slate-200"
                  >
                    <option value="whatsapp">💬 Mensaje WhatsApp</option>
                    <option value="llamada">📞 Llamada Telefónica</option>
                    <option value="reunion">🤝 Videollamada / Reunión</option>
                    <option value="email">✉️ Correo Electrónico</option>
                    <option value="nota">📝 Nota Interna</option>
                  </select>

                  <input
                    type="text"
                    placeholder="Título breve (ej: Feedback propuesta)"
                    value={interactionForm.titulo}
                    onChange={(e) => setInteractionForm({ ...interactionForm, titulo: e.target.value })}
                    className="bg-[#0c1017] border border-slate-700 rounded-lg p-2 text-xs text-slate-200"
                    required
                  />
                </div>

                <textarea
                  placeholder="Detalles de la conversación, acuerdos alcanzados o preguntas del prospecto..."
                  value={interactionForm.detalle}
                  onChange={(e) => setInteractionForm({ ...interactionForm, detalle: e.target.value })}
                  rows={2}
                  className="w-full bg-[#0c1017] border border-slate-700 rounded-lg p-2 text-xs text-slate-200"
                ></textarea>

                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Próximo paso (ej: Llamar para confirmar firma)"
                    value={interactionForm.proximoPaso}
                    onChange={(e) => setInteractionForm({ ...interactionForm, proximoPaso: e.target.value })}
                    className="bg-[#0c1017] border border-slate-700 rounded-lg p-2 text-xs text-slate-200"
                  />
                  <input
                    type="date"
                    value={interactionForm.fechaProximoPaso}
                    onChange={(e) => setInteractionForm({ ...interactionForm, fechaProximoPaso: e.target.value })}
                    className="bg-[#0c1017] border border-slate-700 rounded-lg p-2 text-xs text-slate-200"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2 rounded-lg bg-orange-600 hover:bg-orange-500 text-white font-semibold text-xs transition-colors shadow-sm"
                >
                  Guardar en Bitácora
                </button>
              </form>

              {/* Interactions Timeline */}
              <div className="space-y-3">
                <div className="text-xs font-mono uppercase tracking-wider text-slate-400 font-bold">
                  Historial Cronológico de Interacciones ({activeLeadModal.interacciones?.length || 0})
                </div>

                <div className="space-y-2.5">
                  {activeLeadModal.interacciones?.map((item, idx) => (
                    <div key={item.id || idx} className="p-3 rounded-xl bg-[#131926] border border-slate-800 text-xs space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-200 flex items-center gap-1.5">
                          {item.tipo === 'whatsapp' ? '💬 WhatsApp' :
                           item.tipo === 'llamada' ? '📞 Llamada' :
                           item.tipo === 'reunion' ? '🤝 Reunión' :
                           item.tipo === 'email' ? '✉️ Email' : '📝 Nota'}: {item.titulo}
                        </span>
                        <span className="text-[10px] font-mono text-slate-500">{item.fecha}</span>
                      </div>
                      <p className="text-slate-300 leading-relaxed text-[11px]">{item.detalle}</p>
                      {item.proximoPaso && (
                        <div className="pt-1 border-t border-slate-800/80 text-[10px] text-orange-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>Próximo paso: {item.proximoPaso} {item.fechaProximoPaso ? `(${item.fechaProximoPaso})` : ''}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* MODAL: CREATE NEW LEAD */}
      {createLeadModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0e1320] border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-orange-400" />
                <span>Crear Nuevo Lead en Pipeline</span>
              </h3>
              <button onClick={() => setCreateLeadModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateLead} className="p-5 space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Nombre de la Empresa</label>
                <input
                  type="text"
                  required
                  value={newLeadForm.empresa}
                  onChange={(e) => setNewLeadForm({ ...newLeadForm, empresa: e.target.value })}
                  placeholder="ej: Clínica Dental San Salvador"
                  className="w-full bg-[#131926] border border-slate-700 rounded-lg p-2 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-400 block mb-1">Nombre del Contacto</label>
                  <input
                    type="text"
                    value={newLeadForm.contacto}
                    onChange={(e) => setNewLeadForm({ ...newLeadForm, contacto: e.target.value })}
                    placeholder="ej: Dr. Roberto Gómez"
                    className="w-full bg-[#131926] border border-slate-700 rounded-lg p-2 text-white"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Cargo</label>
                  <input
                    type="text"
                    value={newLeadForm.cargo}
                    onChange={(e) => setNewLeadForm({ ...newLeadForm, cargo: e.target.value })}
                    placeholder="ej: Director Médico"
                    className="w-full bg-[#131926] border border-slate-700 rounded-lg p-2 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-400 block mb-1">País</label>
                  <select
                    value={newLeadForm.pais}
                    onChange={(e) => setNewLeadForm({ ...newLeadForm, pais: e.target.value })}
                    className="w-full bg-[#131926] border border-slate-700 rounded-lg p-2 text-white"
                  >
                    <option value="SV">🇸🇻 El Salvador</option>
                    <option value="DO">🇩🇴 Rep. Dominicana</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Valor Estimado ($ USD)</label>
                  <input
                    type="number"
                    value={newLeadForm.valorEstimado}
                    onChange={(e) => setNewLeadForm({ ...newLeadForm, valorEstimado: Number(e.target.value) })}
                    className="w-full bg-[#131926] border border-slate-700 rounded-lg p-2 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-400 block mb-1">Teléfono / WhatsApp</label>
                  <input
                    type="text"
                    value={newLeadForm.telefono}
                    onChange={(e) => setNewLeadForm({ ...newLeadForm, telefono: e.target.value })}
                    placeholder="+503 7000 0000"
                    className="w-full bg-[#131926] border border-slate-700 rounded-lg p-2 text-white"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Correo Electrónico</label>
                  <input
                    type="email"
                    value={newLeadForm.email}
                    onChange={(e) => setNewLeadForm({ ...newLeadForm, email: e.target.value })}
                    placeholder="contacto@empresa.com"
                    className="w-full bg-[#131926] border border-slate-700 rounded-lg p-2 text-white"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs mt-3 shadow-md"
              >
                Crear Lead en CRM
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
