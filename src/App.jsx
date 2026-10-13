import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Sparkles, 
  Users, 
  Settings as SettingsIcon, 
  Zap, 
  Play, 
  Download, 
  ChevronRight, 
  ExternalLink, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Mail, 
  Phone, 
  Building2, 
  Globe, 
  Send, 
  Copy, 
  Check, 
  X, 
  Filter, 
  Layers, 
  ShieldCheck, 
  TrendingUp, 
  Bot, 
  ArrowUpRight,
  RefreshCw,
  Trash2,
  FileText,
  Briefcase,
  Layout,
  Kanban,
  DollarSign,
  MapPin,
  Star
} from 'lucide-react';
import PresupuestosModule from './components/PresupuestosModule';
import CrmPortalModule from './components/CrmPortalModule';
import GestionRentabilidadModule from './components/GestionRentabilidadModule';
import SeoGeoToolsModule from './components/SeoGeoToolsModule';
import HeadlessCmsHubModule from './components/HeadlessCmsHubModule';
import ContratosOnboardingModule from './components/ContratosOnboardingModule';
import WireframesStoryBrandModule from './components/WireframesStoryBrandModule';
import SeoLaunchQaModule from './components/SeoLaunchQaModule';
import PublicClientPortal from './components/PublicClientPortal';
import { clientSearch, generateClientLead } from './services/clientLeadEngine';

export default function App() {
  const [clientPortalToken, setClientPortalToken] = useState(() => {
    if (typeof window !== 'undefined') {
      const match = window.location.pathname.match(/^\/portal\/([a-zA-Z0-9_-]+)/);
      return match ? match[1] : null;
    }
    return null;
  });

  const [activeModule, setActiveModule] = useState(() => {
    return (typeof window !== 'undefined' && localStorage.getItem('goglite_active_module')) || 'crm_portal';
  }); // 'lead_scrapper' | 'crm_portal' | 'presupuestos'
  
  const getBackendEndpoint = (endpoint) => {
    if (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
      return `http://localhost:3001${endpoint}`;
    }
    return endpoint;
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('goglite_active_module', activeModule);
    }
  }, [activeModule]);

  const [activeTab, setActiveTab] = useState('buscar'); // 'buscar' | 'sugerencias' | 'leads' | 'ajustes'
  const [selectedCountry, setSelectedCountry] = useState('SV'); // 'SV' | 'DO'
  const [searchMode, setSearchMode] = useState('maps'); // 'maps' | 'web'
  const [pipelineInput, setPipelineInput] = useState('');
  const [manualSearchInput, setManualSearchInput] = useState('');
  const [leadForPresupuesto, setLeadForPresupuesto] = useState(null);
  const [presupuestoForFactura, setPresupuestoForFactura] = useState(null);
  
  // State for SERP Results
  const [searchResults, setSearchResults] = useState([]);
  const [selectedResults, setSelectedResults] = useState(new Set());
  const [isSearching, setIsSearching] = useState(false);
  const [isPipelineRunning, setIsPipelineRunning] = useState(false);
  const [pipelineProgress, setPipelineProgress] = useState('');

  // State for Leads con persistencia local
  const [leads, setLeads] = useState(() => {
    try {
      if (typeof window !== 'undefined') {
        const cached = localStorage.getItem('goglite_outbound_leads');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      }
    } catch (e) {
      console.warn('Error leyendo caché local de leads:', e);
    }
    return [];
  });
  const [leadFilter, setLeadFilter] = useState('todos');
  const [leadSearchTerm, setLeadSearchTerm] = useState('');
  
  // State for Modal
  const [selectedLeadModal, setSelectedLeadModal] = useState(null);
  const [modalTab, setModalTab] = useState('auditoria'); // 'auditoria' | 'pitch'
  const [copiedPitch, setCopiedPitch] = useState(false);

  // State for Settings
  const [settings, setSettings] = useState({
    geminiApiKey: '',
    serperApiKey: '',
    apolloApiKey: '',
    instantlyApiKey: '',
    resendApiKey: '',
    resendFromEmail: 'Goglite Agencia <onboarding@resend.dev>',
    preferredEmailProvider: 'resend',
    defaultCountry: 'SV'
  });
  const [settingsSaved, setSettingsSaved] = useState(false);
  const [toolsDropdownOpen, setToolsDropdownOpen] = useState(false);

  // Fetch initial data
  useEffect(() => {
    fetchLeads();
    fetchSettings();
  }, []);

  const fetchLeads = async () => {
    try {
      const res = await fetch(getBackendEndpoint('/api/leads'));
      if (res.ok) {
        const data = await res.json();
        setLeads(data);
        if (typeof window !== 'undefined') {
          localStorage.setItem('goglite_outbound_leads', JSON.stringify(data));
        }
      }
    } catch (err) {
      console.warn('Backend API offline o en hosting estático, operando con almacenamiento local persistente:', err);
    }
  };

  const fetchSettings = async () => {
    try {
      const res = await fetch(getBackendEndpoint('/api/settings'));
      if (res.ok) {
        const data = await res.json();
        setSettings(data);
        if (data.defaultCountry) setSelectedCountry(data.defaultCountry);
      }
    } catch (err) {
      console.error('Error fetching settings:', err);
    }
  };

  // Run Manual Search (Híbrido: Backend con fallback autónomo en cliente)
  const handleManualSearch = async (queryText) => {
    const q = queryText || manualSearchInput;
    if (!q.trim()) return;

    setIsSearching(true);
    setSearchResults([]);
    setSelectedResults(new Set());

    try {
      let results = [];
      let success = false;

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2500);
        const res = await fetch(getBackendEndpoint('/api/search'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: q, country: selectedCountry, searchMode }),
          signal: controller.signal
        });
        clearTimeout(timeoutId);
        if (res.ok) {
          const data = await res.json();
          if (data.success && Array.isArray(data.results)) {
            results = data.results;
            success = true;
          }
        }
      } catch (backendErr) {
        console.warn('Backend search offline o bloqueado por navegador, activando motor autónomo de cliente:', backendErr);
      }

      // Si el backend no respondió o está en hosting estático sin proxy
      if (!success || results.length === 0) {
        results = await clientSearch(q, selectedCountry, searchMode, settings.serperApiKey);
      }

      setSearchResults(results);
      const recommended = new Set(
        results
          .filter(r => r.recomendadoOutbound || r.esProspectoOro)
          .map(r => r.dominio)
      );
      setSelectedResults(recommended);
    } catch (err) {
      alert('Error al realizar búsqueda: ' + err.message);
    } finally {
      setIsSearching(false);
    }
  };

  // Run 1-Click Pipeline (Híbrido: Backend con fallback autónomo en cliente)
  const handleRunPipeline = async (queryText) => {
    const q = queryText || pipelineInput;
    if (!q.trim()) return;

    setIsPipelineRunning(true);
    setPipelineProgress(searchMode === 'maps'
      ? 'Consultando Google Maps para negocios con reseñas pero SIN página web...'
      : 'Buscando empresas en Google (posiciones 4-20)...');

    try {
      setPipelineProgress('Auditando presencia, analizando reseñas y estructurando pitches comerciales...');
      let completed = false;

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2500);
        const res = await fetch(getBackendEndpoint('/api/pipeline'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: q, country: selectedCountry, limit: 10, searchMode }),
          signal: controller.signal
        });
        clearTimeout(timeoutId);
        if (res.ok) {
          const data = await res.json();
          if (data.success) {
            setPipelineProgress(`¡Completado! Se generaron ${data.nuevosGuardados} leads nuevos.`);
            await fetchLeads();
            completed = true;
          }
        }
      } catch (backendErr) {
        console.warn('Backend pipeline offline o bloqueado por navegador, ejecutando motor autónomo de cliente:', backendErr);
      }

      // Fallback autónomo en el navegador (producción sin backend)
      if (!completed) {
        const rawResults = await clientSearch(q, selectedCountry, searchMode, settings.serperApiKey);
        const targets = rawResults.slice(0, 8);
        const newLeads = targets.map(t => generateClientLead(t, q, selectedCountry));

        setLeads(prev => {
          const combined = [...newLeads, ...prev];
          if (typeof window !== 'undefined') {
            localStorage.setItem('goglite_outbound_leads', JSON.stringify(combined));
          }
          return combined;
        });

        setPipelineProgress(`¡Completado! Se generaron ${newLeads.length} prospectos listos para prospección.`);
        completed = true;
      }

      setTimeout(() => {
        setIsPipelineRunning(false);
        setActiveTab('leads');
      }, 1200);
    } catch (err) {
      alert('Error en pipeline: ' + err.message);
      setIsPipelineRunning(false);
    }
  };

  // Toggle Single Result Selection
  const toggleSelectResult = (domain) => {
    const next = new Set(selectedResults);
    if (next.has(domain)) next.delete(domain);
    else next.add(domain);
    setSelectedResults(next);
  };

  // Select all / recommended
  const selectAllResults = () => {
    setSelectedResults(new Set(searchResults.map(r => r.dominio)));
  };

  const selectRecommendedResults = () => {
    setSelectedResults(new Set(searchResults.filter(r => r.recomendadoOutbound || r.esProspectoOro).map(r => r.dominio)));
  };

  // Extract contacts and audit for selected
  const handleExtractSelected = async () => {
    if (selectedResults.size === 0) return;
    setIsSearching(true);

    const itemsToProcess = searchResults.filter(r => selectedResults.has(r.dominio));
    let addedCount = 0;

    for (const item of itemsToProcess) {
      try {
        let newLeadPayload;
        try {
          const enrichRes = await fetch(getBackendEndpoint('/api/enrich'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              domain: item.dominio, 
              companyName: item.titulo, 
              country: selectedCountry,
              sinWeb: item.sinWeb,
              telefono: item.telefono
            })
          });
          const enrichData = await enrichRes.json();
          const contact = enrichData.contact || {};

          const auditRes = await fetch(getBackendEndpoint('/api/audit'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              domain: item.dominio, 
              query: manualSearchInput, 
              country: selectedCountry,
              resenas: item.resenas,
              calificacion: item.calificacion,
              sinWeb: item.sinWeb,
              tipoFuente: item.tipoFuente,
              titulo: item.titulo
            })
          });
          const auditData = await auditRes.json();
          const audit = auditData.audit;

          newLeadPayload = {
            dominio: item.dominio,
            nombreEmpresa: item.titulo.split('|')[0].trim(),
            pais: selectedCountry,
            email: contact.email,
            responsable: contact.responsable,
            cargo: contact.cargo,
            telefono: contact.telefono || item.telefono || '',
            posicionGoogle: item.posicion,
            resenas: item.resenas || 0,
            calificacion: item.calificacion || 0,
            sinWeb: Boolean(item.sinWeb),
            tipoFuente: item.tipoFuente || (searchMode === 'maps' ? 'google_maps' : 'google_serp'),
            auditoria: audit,
            pitch: null
          };

          const pitchRes = await fetch(getBackendEndpoint('/api/pitch'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ lead: newLeadPayload, audit, country: selectedCountry })
          });
          const pitchData = await pitchRes.json();
          newLeadPayload.pitch = pitchData.pitch;

          await fetch(getBackendEndpoint('/api/leads'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newLeadPayload)
          });
        } catch {
          // Fallback cliente 100% autónomo
          newLeadPayload = generateClientLead(item, manualSearchInput, selectedCountry);
        }

        if (newLeadPayload) {
          setLeads(prev => {
            const updated = [newLeadPayload, ...prev];
            if (typeof window !== 'undefined') {
              localStorage.setItem('goglite_outbound_leads', JSON.stringify(updated));
            }
            return updated;
          });
          addedCount++;
        }
      } catch (err) {
        console.error('Error procesando lead individual:', err);
      }
    }

    await fetchLeads();
    setIsSearching(false);
    setActiveTab('leads');
  };

  // Change lead status con persistencia inmediata
  const handleUpdateLeadStatus = async (leadId, newStatus) => {
    // 1. Guardar de inmediato en memoria y localStorage
    setLeads(prev => {
      const updated = prev.map(l => l.id === leadId ? { ...l, estado: newStatus, actualizado: new Date().toISOString().split('T')[0] } : l);
      if (typeof window !== 'undefined') {
        localStorage.setItem('goglite_outbound_leads', JSON.stringify(updated));
      }
      return updated;
    });

    if (selectedLeadModal && selectedLeadModal.id === leadId) {
      setSelectedLeadModal(prev => ({ ...prev, estado: newStatus }));
    }

    // 2. Sincronizar con API backend
    try {
      await fetch(getBackendEndpoint(`/api/leads/${leadId}`), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: newStatus })
      });
      fetchLeads();
    } catch (err) {
      console.warn('Cambio guardado localmente (API offline):', err);
    }
  };

  // Send email via Resend ($0.00 stack) or Instantly
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [customRecipient, setCustomRecipient] = useState('');

  const handleSendEmail = async (leadId, provider = 'resend', overrideEmail = null) => {
    setIsSendingEmail(true);
    const targetStatus = provider === 'resend' ? 'enviado_resend' : 'enviado_instantly';
    
    // 1. Persistencia local inmediata
    setLeads(prev => {
      const updated = prev.map(l => l.id === leadId ? { ...l, estado: targetStatus, actualizado: new Date().toISOString().split('T')[0] } : l);
      if (typeof window !== 'undefined') {
        localStorage.setItem('goglite_outbound_leads', JSON.stringify(updated));
      }
      return updated;
    });

    if (selectedLeadModal && selectedLeadModal.id === leadId) {
      setSelectedLeadModal(prev => ({
        ...prev,
        estado: targetStatus
      }));
    }

    try {
      const res = await fetch(getBackendEndpoint('/api/send-email'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          leadId, 
          provider,
          targetEmail: overrideEmail || customRecipient || selectedLeadModal?.email
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error);
      fetchLeads();
      alert(data.message || `Correo procesado con éxito vía ${provider === 'resend' ? 'Resend ($0.00)' : 'Instantly.ai'}.`);
    } catch (err) {
      alert('Aviso de Envío: ' + err.message);
    } finally {
      setIsSendingEmail(false);
    }
  };

  const handleSendInstantly = (leadId) => handleSendEmail(leadId, 'instantly');

  // Delete lead
  const handleDeleteLead = async (leadId) => {
    if (!confirm('¿Eliminar este lead?')) return;
    try {
      await fetch(getBackendEndpoint(`/api/leads/${leadId}`), { method: 'DELETE' });
      fetchLeads();
      if (selectedLeadModal?.id === leadId) setSelectedLeadModal(null);
    } catch (err) {
      console.error(err);
    }
  };

  // Save Settings
  const handleSaveSettings = async (e) => {
    e.preventDefault();
    try {
      await fetch(getBackendEndpoint('/api/settings'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });
      setSettingsSaved(true);
      setTimeout(() => setSettingsSaved(false), 3000);
    } catch (err) {
      alert('Error guardando ajustes: ' + err.message);
    }
  };

  // Filter leads
  const filteredLeads = leads.filter(l => {
    const matchesFilter = 
      leadFilter === 'todos' ? true :
      leadFilter === 'sin_email' ? (!l.email || l.email.includes('contacto@')) :
      l.estado === leadFilter;

    const term = leadSearchTerm.toLowerCase();
    const matchesSearch = !term || 
      l.dominio?.toLowerCase().includes(term) ||
      l.responsable?.toLowerCase().includes(term) ||
      l.email?.toLowerCase().includes(term) ||
      l.nombreEmpresa?.toLowerCase().includes(term);

    return matchesFilter && matchesSearch;
  });

  // Copy Pitch
  const handleCopyPitch = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedPitch(true);
    setTimeout(() => setCopiedPitch(false), 2000);
  };

  // Niche Suggestions Data
  const nicheSuggestions = [
    {
      title: "Clínicas Dentales & Estéticas",
      country: "SV",
      flag: "🇸🇻",
      query: "clínicas dentales San Salvador",
      desc: "Negocios con alto valor por paciente (\$1,500+ en implantes/ortodoncia) con webs lentas y sin presencia en IA.",
      roi: "Alto"
    },
    {
      title: "Inmobiliarias & Villas de Lujo",
      country: "DO",
      flag: "🇩🇴",
      query: "inmobiliarias Punta Cana villas de lujo",
      desc: "Inversionistas extranjeros buscan con ChatGPT. Las inmobiliarias locales pierden clientes por falta de GEO.",
      roi: "Muy Alto"
    },
    {
      title: "Cirugía Plástica & Medicina Estética",
      country: "DO",
      flag: "🇩🇴",
      query: "cirugía plástica Santo Domingo",
      desc: "Turismo médico con alta facturación. Requieren máxima velocidad móvil y reserva directa por WhatsApp.",
      roi: "Extremo"
    },
    {
      title: "Bufetes de Abogados Corporativos",
      country: "SV",
      flag: "🇸🇻",
      query: "abogados corporativos San Salvador",
      desc: "Firmas tradicionales con webs de hace 10 años, nula optimización SEO y nula citación en modelos de IA.",
      roi: "Alto"
    },
    {
      title: "Logística y Carga Internacional",
      country: "SV",
      flag: "🇸🇻",
      query: "empresas de logística El Salvador transporte de carga",
      desc: "Servicios B2B con contratos de retención mensual (\$2,000+). Buscan proveedores con alta autoridad digital.",
      roi: "Muy Alto"
    },
    {
      title: "Hoteles Boutique & Ecoturismo",
      country: "DO",
      flag: "🇩🇴",
      query: "hoteles boutique Las Terrenas Samaná",
      desc: "Dependen de comisiones del 20% en Booking/Expedia. Necesitan web propia de alta conversión y SEO local.",
      roi: "Alto"
    }
  ];

  // Limpieza integral de datos de prueba para ejecución manual de Fase 1 a Fase 4
  const handleResetAllPlatformData = async () => {
    if (!window.confirm('¿Deseas LIMPIAR TODOS LOS DATOS de prueba de las Fases 1 a 4?\n\n• Fase 1: Limpiará leads y búsquedas del Scrapper.\n• Fase 2: Limpiará leads y chats del CRM.\n• Fase 3: Limpiará presupuestos y propuestas.\n• Fase 4: Limpiará facturas, gastos y registros de horas.\n\n(Tus cuentas bancarias oficiales y claves API se mantendrán a salvo).')) {
      return;
    }

    try {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('goglite_outbound_leads');
        localStorage.removeItem('goglite_crm_leads');
        localStorage.removeItem('goglite_crm_leads_v3');
        localStorage.removeItem('goglite_presupuestos');
        localStorage.removeItem('goglite_finanzas_v1');
        localStorage.removeItem('goglite_live_timer_v1');
        localStorage.removeItem('goglite_proyectos');
        localStorage.setItem('goglite_active_module', 'lead_scrapper');
      }

      setLeads([]);
      setSearchResults([]);
      setSelectedResults(new Set());
      setLeadForPresupuesto(null);
      setPresupuestoForFactura(null);

      try {
        await fetch(getBackendEndpoint('/api/finanzas/reset'), { method: 'POST' });
      } catch {}

      alert('✓ Plataforma limpia con éxito. Se reiniciará en la Fase 1 (Lead Scrapper) para tu prueba manual.');
      window.location.reload();
    } catch (e) {
      console.error('Error al resetear plataforma:', e);
    }
  };

  if (clientPortalToken) {
    return (
      <PublicClientPortal
        token={clientPortalToken}
        onBackToAdmin={() => {
          window.history.pushState({}, '', '/');
          setClientPortalToken(null);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#080b11] text-slate-100 flex flex-col selection:bg-orange-600 selection:text-white">
      
      {/* 1. TOP NAVIGATION BAR */}
      <header className="no-print h-16 border-b border-slate-800/80 bg-[#0c1017]/90 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-4">
          {/* Logo Badge */}
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center font-black text-white text-base shadow-glow-sm">
              G
            </span>
            <div className="flex items-baseline gap-2">
              <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
                Goglite
              </span>
              <span className="text-xs font-mono text-orange-400/90 font-semibold px-2 py-0.5 rounded-full bg-orange-500/10 border border-orange-500/20">
                {activeModule === 'lead_scrapper' ? 'Módulo 1 · Lead Scrapper' :
                 activeModule === 'crm_portal' ? 'Módulo 2 · CRM & WhatsApp' :
                 activeModule === 'presupuestos' ? 'Módulo 3 · Presupuestos' :
                 activeModule === 'gestion_rentabilidad' ? 'Módulo 4 · Rentabilidad' :
                 activeModule === 'seo_geo' ? 'Módulo 5 · SEO & GEO Tools' :
                 activeModule === 'headless_cms' ? 'Módulo 6 · Headless CMS' :
                 activeModule === 'contratos_onboarding' ? 'Contratos & SOW' :
                 activeModule === 'wireframes_storybrand' ? 'StoryBrand & UX' : 'SEO & Launch QA'}
              </span>
            </div>
          </div>

          <span className="text-slate-700">|</span>

          {/* Tools Menu Dropdown */}
          <div className="relative">
            <button 
              onClick={() => setToolsDropdownOpen(!toolsDropdownOpen)}
              className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1.5 px-2.5 py-1 rounded-md hover:bg-slate-800/60 transition-colors"
            >
              <Layers className="w-3.5 h-3.5 text-slate-500" />
              <span>Módulos de Agencia</span>
              <ChevronRight className={`w-3 h-3 text-slate-500 transition-transform ${toolsDropdownOpen ? 'rotate-90' : ''}`} />
            </button>

            {toolsDropdownOpen && (
              <div className="absolute left-0 mt-2 w-72 rounded-xl bg-[#0f1422] border border-slate-800 shadow-2xl p-2 z-50">
                <div className="text-[10px] uppercase font-mono tracking-wider text-slate-500 px-2 py-1">Plataforma Goglite</div>
                
                {/* Módulo 1 */}
                <button
                  onClick={() => { setActiveModule('lead_scrapper'); setToolsDropdownOpen(false); }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg font-medium text-xs border transition-colors mb-1 ${
                    activeModule === 'lead_scrapper' 
                      ? 'bg-orange-500/15 text-orange-300 border-orange-500/30' 
                      : 'text-slate-300 border-transparent hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Zap className="w-3.5 h-3.5 text-orange-400" />
                    <span>1. Lead Scrapper (Outbound)</span>
                  </div>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded font-mono">Listo</span>
                </button>

                {/* Módulo 2: CRM & WhatsApp */}
                <button
                  onClick={() => { setActiveModule('crm_portal'); setToolsDropdownOpen(false); }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg font-medium text-xs border transition-colors mb-1 ${
                    activeModule === 'crm_portal' 
                      ? 'bg-orange-500/15 text-orange-300 border-orange-500/30' 
                      : 'text-slate-300 border-transparent hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Kanban className="w-3.5 h-3.5 text-orange-400" />
                    <span>2. CRM & WhatsApp</span>
                  </div>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded font-mono">Listo</span>
                </button>

                {/* Módulo 3: Presupuestos */}
                <button
                  onClick={() => { setActiveModule('presupuestos'); setToolsDropdownOpen(false); }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg font-medium text-xs border transition-colors mb-1 ${
                    activeModule === 'presupuestos' 
                      ? 'bg-orange-500/15 text-orange-300 border-orange-500/30' 
                      : 'text-slate-300 border-transparent hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <FileText className="w-3.5 h-3.5 text-orange-400" />
                    <span>3. Presupuestos & Propuestas</span>
                  </div>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded font-mono">Listo</span>
                </button>

                {/* Módulo 4 */}
                <button
                  onClick={() => { setActiveModule('gestion_rentabilidad'); setToolsDropdownOpen(false); }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg font-medium text-xs border transition-colors mb-1 ${
                    activeModule === 'gestion_rentabilidad' 
                      ? 'bg-orange-500/15 text-orange-300 border-orange-500/30' 
                      : 'text-slate-300 border-transparent hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-3.5 h-3.5 text-orange-400" />
                    <span>4. Gestión & Rentabilidad (Holded)</span>
                  </div>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded font-mono">Listo</span>
                </button>

                {/* Módulo 5 */}
                <button
                  onClick={() => { setActiveModule('seo_geo'); setToolsDropdownOpen(false); }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg font-medium text-xs border transition-colors mb-1 ${
                    activeModule === 'seo_geo' 
                      ? 'bg-orange-500/15 text-orange-300 border-orange-500/30' 
                      : 'text-slate-300 border-transparent hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Search className="w-3.5 h-3.5 text-orange-400" />
                    <span>5. SEO & GEO Tools (Rank Math)</span>
                  </div>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded font-mono">Listo</span>
                </button>

                {/* Módulo 6 */}
                <button
                  onClick={() => { setActiveModule('headless_cms'); setToolsDropdownOpen(false); }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg font-medium text-xs border transition-colors mb-1 ${
                    activeModule === 'headless_cms' 
                      ? 'bg-orange-500/15 text-orange-300 border-orange-500/30' 
                      : 'text-slate-300 border-transparent hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Globe className="w-3.5 h-3.5 text-orange-400" />
                    <span>6. Hub de Proyectos (Headless CMS)</span>
                  </div>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded font-mono">Listo</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Header Options */}
        <div className="flex items-center gap-3">
          {/* Botón Reset / Limpieza para Prueba Manual */}
          <button
            onClick={handleResetAllPlatformData}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-semibold transition-all shadow-sm"
            title="Limpiar datos de prueba y dejar la plataforma lista para prueba manual de Fase 1 a Fase 4"
          >
            <Trash2 className="w-3.5 h-3.5 text-rose-400" />
            <span className="hidden sm:inline">Limpiar Demo (Fases 1-4)</span>
            <span className="sm:hidden">Limpiar</span>
          </button>

          {/* Country Selector */}
          <div className="flex items-center bg-[#131926] border border-slate-800 rounded-lg p-0.5 text-xs">
            <button
              onClick={() => setSelectedCountry('SV')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md font-medium transition-all ${
                selectedCountry === 'SV' ? 'bg-orange-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>🇸🇻</span>
              <span>El Salvador</span>
            </button>
            <button
              onClick={() => setSelectedCountry('DO')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md font-medium transition-all ${
                selectedCountry === 'DO' ? 'bg-orange-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>🇩🇴</span>
              <span>Rep. Dominicana</span>
            </button>
          </div>

          {/* User Profile */}
          <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
            <div className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-orange-400">
              VM
            </div>
            <div className="text-left hidden sm:block">
              <div className="text-xs font-semibold leading-tight text-slate-200">Víctor Matos</div>
              <div className="text-[10px] text-slate-500 leading-tight">Admin · Goglite</div>
            </div>
          </div>
        </div>
      </header>

      {/* 2. BODY LAYOUT: SIDEBAR + MAIN CONTENT */}
      <div className="flex flex-1 overflow-hidden">
        
        {/* SIDEBAR */}
        <aside className="no-print w-56 border-r border-slate-800/80 bg-[#0b0e16] p-3 flex flex-col justify-between shrink-0">
          <div className="space-y-3">
            {/* Module Selector */}
            <div className="space-y-1 pb-3 border-b border-slate-800/80">
              <div className="text-[10px] uppercase font-mono tracking-wider text-slate-500 px-1 mb-1">Módulos</div>
              <button
                onClick={() => setActiveModule('lead_scrapper')}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeModule === 'lead_scrapper'
                    ? 'bg-orange-600/20 text-orange-400 border border-orange-500/30'
                    : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Zap className="w-3.5 h-3.5" />
                  <span>Lead Scrapper</span>
                </div>
                <span className="text-[9px] bg-slate-800 px-1.5 py-0.5 rounded font-mono">1</span>
              </button>

              <button
                onClick={() => setActiveModule('crm_portal')}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeModule === 'crm_portal'
                    ? 'bg-orange-600/20 text-orange-400 border border-orange-500/30'
                    : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Kanban className="w-3.5 h-3.5" />
                  <span>CRM & WhatsApp</span>
                </div>
                <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded font-mono">2</span>
              </button>

              <button
                onClick={() => setActiveModule('presupuestos')}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeModule === 'presupuestos'
                    ? 'bg-orange-600/20 text-orange-400 border border-orange-500/30'
                    : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-2">
                  <FileText className="w-3.5 h-3.5" />
                  <span>Presupuestos</span>
                </div>
                <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded font-mono">3</span>
              </button>

              <button
                onClick={() => setActiveModule('gestion_rentabilidad')}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeModule === 'gestion_rentabilidad'
                    ? 'bg-orange-600/20 text-orange-400 border border-orange-500/30'
                    : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-2">
                  <DollarSign className="w-3.5 h-3.5" />
                  <span>Rentabilidad</span>
                </div>
                <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded font-mono">4</span>
              </button>

              <button
                onClick={() => setActiveModule('seo_geo')}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeModule === 'seo_geo'
                    ? 'bg-orange-600/20 text-orange-400 border border-orange-500/30'
                    : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Search className="w-3.5 h-3.5" />
                  <span>SEO & GEO Tools</span>
                </div>
                <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded font-mono">5</span>
              </button>

              <button
                onClick={() => setActiveModule('headless_cms')}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeModule === 'headless_cms'
                    ? 'bg-orange-600/20 text-orange-400 border border-orange-500/30'
                    : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Globe className="w-3.5 h-3.5" />
                  <span>Headless CMS</span>
                </div>
                <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded font-mono">6</span>
              </button>

              <div className="pt-2 pb-1 text-[9px] uppercase font-mono tracking-wider text-slate-500 px-1">
                Herramientas de Entrega
              </div>

              <button
                onClick={() => setActiveModule('contratos_onboarding')}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeModule === 'contratos_onboarding'
                    ? 'bg-orange-600/20 text-orange-400 border border-orange-500/30'
                    : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Briefcase className="w-3.5 h-3.5" />
                  <span>Contratos & SOW</span>
                </div>
                <span className="text-[9px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded font-mono">SOW</span>
              </button>

              <button
                onClick={() => setActiveModule('wireframes_storybrand')}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeModule === 'wireframes_storybrand'
                    ? 'bg-orange-600/20 text-orange-400 border border-orange-500/30'
                    : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Layout className="w-3.5 h-3.5" />
                  <span>StoryBrand & UX</span>
                </div>
                <span className="text-[9px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded font-mono">UX</span>
              </button>

              <button
                onClick={() => setActiveModule('seo_qa')}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeModule === 'seo_qa'
                    ? 'bg-orange-600/20 text-orange-400 border border-orange-500/30'
                    : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>SEO & Launch QA</span>
                </div>
                <span className="text-[9px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded font-mono">QA</span>
              </button>
            </div>

            {/* Sub-nav for Lead Scrapper */}
            {activeModule === 'lead_scrapper' && (
              <nav className="space-y-1">
                <div className="text-[10px] uppercase font-mono tracking-wider text-slate-500 px-1 mb-1">Scrapper Nav</div>
                <button
                  onClick={() => setActiveTab('buscar')}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                    activeTab === 'buscar' 
                      ? 'bg-orange-600/15 text-orange-400 border border-orange-500/30' 
                      : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                  }`}
                >
                  <Search className="w-4 h-4" />
                  <span>Buscar</span>
                </button>

            <button
              onClick={() => setActiveTab('sugerencias')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'sugerencias' 
                  ? 'bg-orange-600/15 text-orange-400 border border-orange-500/30' 
                  : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span>Sugerencias Nichos</span>
            </button>

            <button
              onClick={() => setActiveTab('leads')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'leads' 
                  ? 'bg-orange-600/15 text-orange-400 border border-orange-500/30' 
                  : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Users className="w-4 h-4" />
                <span>Leads</span>
              </div>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                activeTab === 'leads' ? 'bg-orange-500 text-white' : 'bg-slate-800 text-slate-400'
              }`}>
                {leads.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('ajustes')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                activeTab === 'ajustes' 
                  ? 'bg-orange-600/15 text-orange-400 border border-orange-500/30' 
                  : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
              }`}
            >
              <SettingsIcon className="w-4 h-4" />
              <span>Ajustes & APIs</span>
            </button>
          </nav>
          )}

          {activeModule === 'presupuestos' && (
            <div className="p-3 rounded-lg bg-orange-500/10 border border-orange-500/20 text-xs text-orange-300">
              <div className="font-bold flex items-center gap-1.5 mb-1">
                <FileText className="w-3.5 h-3.5" />
                <span>Propuestas VIP</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-snug">
                Plantilla oficial con portada corporativa Goglite, 6 módulos técnicos y exportación PDF $0.
              </p>
            </div>
          )}

          {activeModule === 'crm_portal' && (
            <div className="p-3 rounded-lg bg-orange-500/10 border border-orange-500/20 text-xs text-orange-300">
              <div className="font-bold flex items-center gap-1.5 mb-1">
                <Kanban className="w-3.5 h-3.5" />
                <span>CRM & Portal</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-snug">
                Pipeline Kanban de 6 etapas, bitácora de interacciones y portal privado para clientes $0.
              </p>
            </div>
          )}

          {activeModule === 'gestion_rentabilidad' && (
            <div className="p-3 rounded-lg bg-orange-500/10 border border-orange-500/20 text-xs text-orange-300">
              <div className="font-bold flex items-center gap-1.5 mb-1">
                <DollarSign className="w-3.5 h-3.5" />
                <span>Gestión & Rentabilidad</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-snug">
                Panel P&L en tiempo real, facturas proforma imprimibles y rentabilidad unitaria por cliente $0.
              </p>
            </div>
          )}

          {activeModule === 'contratos_onboarding' && (
            <div className="p-3 rounded-lg bg-orange-500/10 border border-orange-500/20 text-xs text-orange-300">
              <div className="font-bold flex items-center gap-1.5 mb-1">
                <Briefcase className="w-3.5 h-3.5" />
                <span>Contratos & Legal</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-snug">
                Firma electrónica digital $0, intake de activos y seguimiento de hitos de entrega.
              </p>
            </div>
          )}

          {activeModule === 'wireframes_storybrand' && (
            <div className="p-3 rounded-lg bg-orange-500/10 border border-orange-500/20 text-xs text-orange-300">
              <div className="font-bold flex items-center gap-1.5 mb-1">
                <Layout className="w-3.5 h-3.5" />
                <span>StoryBrand & UX</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-snug">
                BrandScript de 7 partes, prueba de 5 segundos y maquetación de alambre responsiva $0.
              </p>
            </div>
          )}

          {activeModule === 'seo_qa' && (
            <div className="p-3 rounded-lg bg-orange-500/10 border border-orange-500/20 text-xs text-orange-300">
              <div className="font-bold flex items-center gap-1.5 mb-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>SEO & Lanzamiento</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-snug">
                Schema.org JSON-LD, eventos de tracking y auditoría técnica de 15 puntos.
              </p>
            </div>
          )}
          </div>

          {/* Bottom Sidebar Box */}
          <div className="p-2.5 rounded-lg bg-[#111622] border border-slate-800/80 text-[11px] space-y-1.5">
            <div className="flex items-center gap-1.5 font-semibold text-slate-300">
              <Bot className="w-3.5 h-3.5 text-orange-400" />
              <span>Motor Goglite AI</span>
            </div>
            <p className="text-slate-400 text-[10px] leading-tight">
              Región activa: {selectedCountry === 'DO' ? 'República Dominicana 🇩🇴' : 'El Salvador 🇸🇻'}.
            </p>
          </div>
        </aside>

        {/* MAIN CONTENT AREA */}
        <main className="flex-1 overflow-y-auto p-6 bg-[#080b11]">
          {activeModule === 'presupuestos' ? (
            <PresupuestosModule 
              selectedCountry={selectedCountry}
              leadToConvert={leadForPresupuesto}
              onClearLeadConvert={() => setLeadForPresupuesto(null)}
              onNavigateToContratos={() => setActiveModule('contratos_onboarding')}
              onNavigateToRentabilidad={(presupuesto) => {
                setPresupuestoForFactura(presupuesto);
                setActiveModule('gestion_rentabilidad');
              }}
            />
          ) : activeModule === 'crm_portal' ? (
            <CrmPortalModule
              onConvertToPresupuesto={(lead) => {
                setLeadForPresupuesto({
                  nombreEmpresa: lead.empresa,
                  responsable: lead.contacto,
                  cargo: lead.cargo,
                  email: lead.email,
                  telefono: lead.telefono,
                  dominio: lead.dominio,
                  pais: lead.pais,
                  valorEstimado: lead.valorEstimado
                });
                setActiveModule('presupuestos');
              }}
              onOpenContrato={() => setActiveModule('contratos_onboarding')}
            />
          ) : activeModule === 'gestion_rentabilidad' ? (
            <GestionRentabilidadModule
              selectedCountry={selectedCountry}
              presupuestoToBill={presupuestoForFactura}
              onClearPresupuestoToBill={() => setPresupuestoForFactura(null)}
              onNavigateToPresupuestos={() => setActiveModule('presupuestos')}
            />
          ) : activeModule === 'seo_geo' ? (
            <SeoGeoToolsModule
              selectedCountry={selectedCountry}
            />
          ) : activeModule === 'headless_cms' ? (
            <HeadlessCmsHubModule />
          ) : activeModule === 'contratos_onboarding' ? (
            <ContratosOnboardingModule
              selectedCountry={selectedCountry}
              onNavigateToPresupuestos={() => setActiveModule('presupuestos')}
            />
          ) : activeModule === 'wireframes_storybrand' ? (
            <WireframesStoryBrandModule
              selectedCountry={selectedCountry}
            />
          ) : activeModule === 'seo_qa' ? (
            <SeoLaunchQaModule
              selectedCountry={selectedCountry}
            />
          ) : (
            <>
          
          {/* TAB 1: BUSCAR */}
          {activeTab === 'buscar' && (
            <div className="max-w-5xl mx-auto space-y-6">
              
              {/* Selector de Modo: Google Maps (Sin Web) vs Google Web */}
              <div className="flex items-center gap-2 bg-[#0e131d] border border-slate-800 p-1.5 rounded-xl w-fit">
                <button
                  onClick={() => setSearchMode('maps')}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    searchMode === 'maps'
                      ? 'bg-orange-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <MapPin className="w-3.5 h-3.5" />
                  <span>📍 Google Maps (Negocios con Reseñas · SIN WEB)</span>
                  <span className="text-[10px] bg-amber-400/20 text-amber-300 px-1.5 py-0.5 rounded font-mono font-bold">Top Cierre</span>
                </button>
                <button
                  onClick={() => setSearchMode('web')}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    searchMode === 'web'
                      ? 'bg-orange-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Globe className="w-3.5 h-3.5" />
                  <span>🌐 Google Web (SERP Posiciones #4-#20)</span>
                </button>
              </div>

              {/* 1-Click Pipeline Card */}
              <div className="p-5 rounded-2xl bg-gradient-to-br from-[#121826] to-[#0d121c] border border-orange-500/30 shadow-glow-sm relative overflow-hidden">
                <div className="flex items-center gap-2 text-xs font-semibold text-orange-400 mb-1">
                  <Zap className="w-4 h-4 fill-orange-400" />
                  <span>
                    {searchMode === 'maps' 
                      ? 'Pipeline Automático Google Maps (Oportunidades de Oro Sin Web)' 
                      : 'Pipeline Automático 1-Click Google SERP'}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mb-3.5">
                  {searchMode === 'maps'
                    ? 'Extrae negocios de Google Maps con alta reputación (estrellas y reseñas) que NO tienen página web · Detecta teléfonos · Audita pérdida de ventas · Redacta pitch con Gemini IA.'
                    : 'Busca en Google · Extrae posiciones #4-#20 · Enriquece contactos · Audita fallos GEO/SEO con IA · Redacta email pitch.'}
                </p>

                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={pipelineInput}
                      onChange={(e) => setPipelineInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleRunPipeline()}
                      placeholder={
                        searchMode === 'maps'
                          ? (selectedCountry === 'DO' ? 'ej: restaurantes en Punta Cana o talleres en Santo Domingo' : 'ej: dentistas en San Salvador o restaurantes en Santa Tecla')
                          : (selectedCountry === 'DO' ? 'ej: inmobiliarias en Punta Cana' : 'ej: clínicas dentales en San Salvador')
                      }
                      className="w-full bg-[#090c13] border border-slate-700/80 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-orange-500"
                    />
                  </div>
                  <button
                    disabled={isPipelineRunning || !pipelineInput.trim()}
                    onClick={() => handleRunPipeline()}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white font-semibold text-xs transition-all shadow-md shrink-0"
                  >
                    {isPipelineRunning ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Procesando...</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5 fill-white" />
                        <span>Lanzar pipeline</span>
                      </>
                    )}
                  </button>
                </div>

                {isPipelineRunning && (
                  <div className="mt-3 text-xs text-orange-300/90 font-mono flex items-center gap-2 bg-orange-500/10 px-3 py-2 rounded-lg border border-orange-500/20">
                    <RefreshCw className="w-3 h-3 animate-spin text-orange-400" />
                    <span>{pipelineProgress}</span>
                  </div>
                )}
              </div>

              {/* Manual Search Box */}
              <div className="p-5 rounded-2xl bg-[#0e131d] border border-slate-800">
                <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                  {searchMode === 'maps' ? 'Búsqueda Manual en Google Maps (Places)' : 'Intención de Búsqueda Manual Google Web'}
                </div>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={manualSearchInput}
                      onChange={(e) => setManualSearchInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleManualSearch()}
                      placeholder={
                        searchMode === 'maps'
                          ? (selectedCountry === 'DO' ? 'ej: clínicas estéticas Santo Domingo' : 'ej: bufetes de abogados San Salvador')
                          : (selectedCountry === 'DO' ? 'ej: cirujanos plásticos Santo Domingo' : 'ej: bufetes de abogados San Salvador')
                      }
                      className="w-full bg-[#080b11] border border-slate-700/80 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-orange-500"
                    />
                  </div>
                  <button
                    disabled={isSearching || !manualSearchInput.trim()}
                    onClick={() => handleManualSearch()}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-100 font-semibold text-xs transition-all shrink-0"
                  >
                    {isSearching ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                    <span>Buscar</span>
                  </button>
                </div>
              </div>

              {/* SERP Search Results View */}
              {searchResults.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-bold text-slate-200 flex items-center gap-2">
                      {searchMode === 'maps' ? (
                        <>
                          <MapPin className="w-4 h-4 text-orange-400" />
                          <span>Negocios de Google Maps ({searchResults.length})</span>
                        </>
                      ) : (
                        <>
                          <Globe className="w-4 h-4 text-orange-400" />
                          <span>Resultados Orgánicos de Google ({searchResults.length})</span>
                        </>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs">
                      <button 
                        onClick={selectRecommendedResults}
                        className="text-orange-400 hover:text-orange-300 font-medium"
                      >
                        {searchMode === 'maps' ? 'Seleccionar prospectos sin web' : 'Seleccionar recomendados (#4 a #20)'}
                      </button>
                      <span className="text-slate-700">•</span>
                      <button 
                        onClick={selectAllResults}
                        className="text-slate-400 hover:text-slate-200"
                      >
                        Seleccionar todos
                      </button>
                    </div>
                  </div>

                  {/* List of SERP Cards */}
                  <div className="space-y-2 pb-20">
                    {searchResults.map((item) => {
                      const isSelected = selectedResults.has(item.dominio);
                      const isMapsItem = item.tipoFuente === 'google_maps' || item.sinWeb;
                      return (
                        <div
                          key={item.dominio}
                          onClick={() => toggleSelectResult(item.dominio)}
                          className={`p-4 rounded-xl cursor-pointer transition-all border ${
                            isSelected 
                              ? 'bg-orange-500/[0.04] border-orange-500/60 shadow-sm' 
                              : item.esProspectoOro
                              ? 'bg-[#15120c] border-amber-500/40 hover:border-amber-500/70 shadow-sm'
                              : 'bg-[#0e131d]/70 hover:bg-[#121824] border-slate-800/80'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => {}} // handled by parent div click
                              className="mt-1 w-4 h-4 rounded text-orange-600 focus:ring-0 bg-slate-900 border-slate-700"
                            />
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1 flex-wrap">
                                {isMapsItem ? (
                                  <>
                                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30 flex items-center gap-1">
                                      <MapPin className="w-2.5 h-2.5" />
                                      Maps #{item.posicion}
                                    </span>
                                    {item.sinWeb && (
                                      <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1">
                                        ⚠️ SIN WEB PROPIA
                                      </span>
                                    )}
                                    {item.resenas > 0 && (
                                      <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-yellow-500/10 text-yellow-300 border border-yellow-500/20 flex items-center gap-1">
                                        <Star className="w-2.5 h-2.5 fill-yellow-400 text-yellow-400" />
                                        {item.calificacion}★ ({item.resenas} reseñas)
                                      </span>
                                    )}
                                    {item.esProspectoOro && (
                                      <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                                        🏆 CLIENTE DE ORO
                                      </span>
                                    )}
                                  </>
                                ) : (
                                  <>
                                    <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                                      item.posicion <= 3 
                                        ? 'bg-slate-800 text-slate-400' 
                                        : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                                    }`}>
                                      #{item.posicion}
                                    </span>
                                    <span className="font-mono text-xs text-orange-400/90 font-medium">{item.dominio}</span>
                                    {item.recomendadoOutbound && (
                                      <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-800/40">
                                        ★ Ideal para Outbound
                                      </span>
                                    )}
                                  </>
                                )}
                              </div>
                              <div className="text-sm font-semibold text-slate-100 flex items-center justify-between">
                                <span>{item.titulo}</span>
                                {item.telefono && (
                                  <span className="text-xs font-mono text-slate-400 flex items-center gap-1 shrink-0 ml-2">
                                    <Phone className="w-3 h-3 text-emerald-400" />
                                    {item.telefono}
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-slate-400 mt-0.5 line-clamp-2">{item.snippet}</div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Floating Action Bar */}
                  {selectedResults.size > 0 && (
                    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-[#121824] border border-orange-500/50 shadow-glow rounded-2xl px-6 py-3 flex items-center gap-4 z-30">
                      <div className="text-xs font-semibold text-slate-200">
                        <span className="text-orange-400 font-mono font-bold">{selectedResults.size}</span> prospectos seleccionados
                      </div>
                      <button
                        disabled={isSearching}
                        onClick={handleExtractSelected}
                        className="px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-semibold text-xs flex items-center gap-2 shadow-md transition-all"
                      >
                        {isSearching ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                        <span>Extraer contactos y auditar ({selectedResults.size})</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: SUGERENCIAS NICHOS */}
          {activeTab === 'sugerencias' && (
            <div className="max-w-5xl mx-auto space-y-4">
              <div>
                <h2 className="text-base font-bold text-slate-100">Nichos de Alta Rentabilidad para Goglite</h2>
                <p className="text-xs text-slate-400">
                  Sectores con alto ticket y presupuestos validados en El Salvador y República Dominicana.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {nicheSuggestions.map((n, i) => (
                  <div key={i} className="p-4 rounded-xl bg-[#0e131d] border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                          <span>{n.flag}</span>
                          <span>{n.title}</span>
                        </span>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-orange-500/10 text-orange-400 border border-orange-500/20 font-semibold">
                          ROI: {n.roi}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mb-3">{n.desc}</p>
                    </div>

                    <div className="flex items-center gap-2 pt-2 border-t border-slate-800/80">
                      <button
                        onClick={() => {
                          setSelectedCountry(n.country);
                          setManualSearchInput(n.query);
                          setActiveTab('buscar');
                          handleManualSearch(n.query);
                        }}
                        className="flex-1 py-1.5 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors"
                      >
                        Ver en Google
                      </button>
                      <button
                        onClick={() => {
                          setSelectedCountry(n.country);
                          setPipelineInput(n.query);
                          setActiveTab('buscar');
                          handleRunPipeline(n.query);
                        }}
                        className="py-1.5 px-3 rounded-lg bg-orange-600/90 hover:bg-orange-500 text-white text-xs font-semibold flex items-center gap-1 transition-colors"
                      >
                        <Zap className="w-3 h-3 fill-white" />
                        <span>Lanzar 1-Click</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: LEADS GUARDADOS */}
          {activeTab === 'leads' && (
            <div className="space-y-4">
              
              {/* Header and Controls */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <h1 className="text-lg font-extrabold text-slate-100">Leads</h1>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-mono font-medium">
                    {leads.length} guardados
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href="/api/export/csv"
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-lime-500 hover:bg-lime-400 text-black font-bold text-xs shadow-sm transition-all"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Exportar CSV</span>
                  </a>
                </div>
              </div>

              {/* Filters and Search Bar */}
              <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
                <div className="relative flex-1 max-w-md">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-500" />
                  <input
                    type="text"
                    value={leadSearchTerm}
                    onChange={(e) => setLeadSearchTerm(e.target.value)}
                    placeholder="Buscar por dominio, email, responsable..."
                    className="w-full bg-[#0e131d] border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-orange-500"
                  />
                </div>

                {/* Filter Pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
                  {[
                    { id: 'todos', label: 'Todos' },
                    { id: 'nuevo', label: 'Nuevo' },
                    { id: 'contactado', label: 'Contactado' },
                    { id: 'enviado_resend', label: '⚡ Enviado Resend ($0.00)' },
                    { id: 'enviado_instantly', label: '🔥 Enviado Instantly' },
                    { id: 'respondio', label: 'Respondió' },
                    { id: 'cliente', label: 'Cliente' },
                    { id: 'descartado', label: 'Descartado' },
                  ].map((filter) => (
                    <button
                      key={filter.id}
                      onClick={() => setLeadFilter(filter.id)}
                      className={`px-2.5 py-1 rounded-lg font-medium whitespace-nowrap transition-colors ${
                        leadFilter === filter.id
                          ? 'bg-slate-700 text-white'
                          : 'bg-[#101522] text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                      }`}
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Leads Table */}
              <div className="rounded-xl border border-slate-800 overflow-hidden bg-[#0c1017]">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#0f1422] text-slate-400 font-mono text-[11px] uppercase border-b border-slate-800">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Dominio / Empresa</th>
                      <th className="px-4 py-3 font-semibold">Email</th>
                      <th className="px-4 py-3 font-semibold">Responsable / Cargo</th>
                      <th className="px-4 py-3 font-semibold">Estado</th>
                      <th className="px-4 py-3 font-semibold">Auditoría / Pitch</th>
                      <th className="px-4 py-3 font-semibold text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {filteredLeads.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="px-4 py-8 text-center text-slate-500">
                          No se encontraron leads con los filtros actuales.
                        </td>
                      </tr>
                    ) : (
                      filteredLeads.map((lead) => (
                        <tr key={lead.id} className="hover:bg-slate-800/30 transition-colors">
                          <td className="px-4 py-3">
                            <div className="font-semibold text-slate-200">{lead.nombreEmpresa || lead.dominio}</div>
                            <div className="font-mono text-[11px] text-orange-400 flex items-center gap-1 flex-wrap">
                              <span>{lead.pais === 'DO' ? '🇩🇴' : '🇸🇻'}</span>
                              {lead.sinWeb || lead.dominio?.startsWith('maps-') ? (
                                <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded border border-amber-500/30 flex items-center gap-1 font-sans font-medium">
                                  <MapPin className="w-2.5 h-2.5" />
                                  Google Maps {lead.resenas > 0 ? `· ${lead.resenas} reseñas (${lead.calificacion || 4.8}★)` : '· Sin Web'}
                                </span>
                              ) : (
                                <a href={`https://${lead.dominio}`} target="_blank" rel="noreferrer" className="hover:underline flex items-center gap-0.5">
                                  {lead.dominio}
                                  <ExternalLink className="w-2.5 h-2.5" />
                                </a>
                              )}
                            </div>
                          </td>

                          <td className="px-4 py-3 font-mono text-slate-300">
                            {lead.email && !lead.email.endsWith('.negocio') ? (
                              <a href={`mailto:${lead.email}`} className="text-slate-300 hover:text-orange-400 block">
                                {lead.email}
                              </a>
                            ) : (
                              <span className="text-slate-500 italic block">Sin email oficial</span>
                            )}
                            {lead.telefono && (
                              <div className="text-[11px] font-mono text-emerald-400 flex items-center gap-1 mt-0.5">
                                <Phone className="w-2.5 h-2.5" />
                                <a 
                                  href={`https://wa.me/${lead.telefono.replace(/[^0-9]/g, '')}`} 
                                  target="_blank" 
                                  rel="noreferrer"
                                  className="hover:underline"
                                  title="Enviar mensaje por WhatsApp"
                                >
                                  {lead.telefono}
                                </a>
                              </div>
                            )}
                          </td>

                          <td className="px-4 py-3">
                            <div className="text-slate-200 font-medium">{lead.responsable || "Por asignar"}</div>
                            <div className="text-[11px] text-slate-400">{lead.cargo || "Dirección"}</div>
                          </td>

                          <td className="px-4 py-3">
                            <select
                              value={lead.estado}
                              onChange={(e) => handleUpdateLeadStatus(lead.id, e.target.value)}
                              className={`text-[10px] font-semibold px-2 py-1 rounded-md border bg-[#0b0f19] focus:outline-none cursor-pointer ${
                                lead.estado === 'enviado_resend' ? 'border-emerald-500 text-emerald-400 bg-emerald-950/20' :
                                lead.estado === 'enviado_instantly' ? 'border-sky-500 text-sky-400 bg-sky-950/20' :
                                lead.estado === 'cliente' ? 'border-emerald-500 text-emerald-400' :
                                lead.estado === 'contactado' ? 'border-amber-500 text-amber-400' :
                                lead.estado === 'respondio' ? 'border-purple-500 text-purple-400' :
                                'border-slate-700 text-slate-300'
                              }`}
                            >
                              <option value="nuevo">Nuevo</option>
                              <option value="contactado">Contactado</option>
                              <option value="enviado_resend">⚡ Enviado Resend ($0.00)</option>
                              <option value="enviado_instantly">🔥 Enviado Instantly</option>
                              <option value="respondio">Respondió</option>
                              <option value="cliente">Cliente</option>
                              <option value="descartado">Descartado</option>
                            </select>
                          </td>

                          <td className="px-4 py-3">
                            {lead.auditoria ? (
                              <button
                                onClick={() => {
                                  setSelectedLeadModal(lead);
                                  setModalTab('auditoria');
                                }}
                                className="text-[11px] font-medium text-emerald-400 hover:text-emerald-300 flex items-center gap-1 bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20"
                              >
                                <CheckCircle2 className="w-3 h-3" />
                                <span>Ver Auditoría ({lead.auditoria.puntos?.length || 3})</span>
                              </button>
                            ) : (
                              <span className="text-[10px] text-slate-500 italic">Sin auditar</span>
                            )}
                          </td>

                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {lead.pitch && (
                                <button
                                  onClick={() => {
                                    setSelectedLeadModal(lead);
                                    setModalTab('pitch');
                                  }}
                                  className="p-1.5 rounded hover:bg-slate-700 text-orange-400"
                                  title="Ver Email Pitch"
                                >
                                  <Mail className="w-3.5 h-3.5" />
                                </button>
                              )}
                              <button
                                onClick={() => {
                                  setLeadForPresupuesto(lead);
                                  setActiveModule('presupuestos');
                                }}
                                className="p-1.5 rounded hover:bg-slate-700 text-amber-400"
                                title="Crear Presupuesto con Portada Goglite"
                              >
                                <FileText className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleSendEmail(lead.id, 'resend')}
                                className="p-1.5 rounded hover:bg-slate-700 text-emerald-400"
                                title="Enviar Email con Resend ($0.00 Free Tier)"
                              >
                                <Send className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleSendEmail(lead.id, 'instantly')}
                                className="p-1.5 rounded hover:bg-slate-700 text-sky-400"
                                title="Enviar a Campaña de Instantly.ai"
                              >
                                <Zap className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteLead(lead.id)}
                                className="p-1.5 rounded hover:bg-slate-700 text-red-400"
                                title="Eliminar lead"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: AJUSTES & APIS */}
          {activeTab === 'ajustes' && (
            <div className="max-w-2xl mx-auto space-y-6">
              <div>
                <h1 className="text-base font-bold text-slate-100">Ajustes & Conectores de APIs</h1>
                <p className="text-xs text-slate-400">
                  Configura tus credenciales para enriquecimiento automático, prospección y envíos de correo.
                </p>
              </div>

              {/* STACK $0.00 SHOWCASE */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-[#0e131d] to-slate-900 border border-emerald-500/30 flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      STACK GRATUITO ($0.00 / MES)
                    </span>
                    <span className="text-xs text-slate-300 font-semibold">Infraestructura Outbound & Web</span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Tu plataforma corre con servicios de nivel corporativo en su tier gratuito: <strong>Firebase Hosting</strong> ($0.00), <strong>Neon PostgreSQL</strong> ($0.00), <strong>Google Gemini AI</strong> ($0.00), <strong>Serper Google SERP</strong> ($0.00) y <strong>Resend</strong> (3,000 correos/mes a $0.00).
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <span className="text-2xl font-black text-emerald-400 font-mono">$0.00</span>
                  <p className="text-[10px] text-slate-500">Costo mensual</p>
                </div>
              </div>

              <form onSubmit={handleSaveSettings} className="p-5 rounded-2xl bg-[#0e131d] border border-slate-800 space-y-5">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Google Gemini API Key (IA de Auditorías y Pitches)
                  </label>
                  <input
                    type="password"
                    value={settings.geminiApiKey || ''}
                    onChange={(e) => setSettings({ ...settings, geminiApiKey: e.target.value })}
                    placeholder="AIzaSy..."
                    className="w-full bg-[#080b11] border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-orange-500"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">Capa gratuita disponible con hasta 15 consultas por minuto.</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Serper.dev API Key (Scraping de Google SERP y Maps)
                  </label>
                  <input
                    type="password"
                    value={settings.serperApiKey || ''}
                    onChange={(e) => setSettings({ ...settings, serperApiKey: e.target.value })}
                    placeholder="serper_..."
                    className="w-full bg-[#080b11] border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-orange-500"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">2,500 búsquedas gratuitas de bienvenida.</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Apollo.io API Key (Extracción de Decisores y Emails)
                  </label>
                  <input
                    type="password"
                    value={settings.apolloApiKey || ''}
                    onChange={(e) => setSettings({ ...settings, apolloApiKey: e.target.value })}
                    placeholder="apollo_api_..."
                    className="w-full bg-[#080b11] border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-orange-500"
                  />
                </div>

                {/* EMAIL PROVIDERS SECTION */}
                <div className="pt-2 border-t border-slate-800/80 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xs font-bold text-slate-200">Motor de Email para Envíos de Prospección</h3>
                      <p className="text-[11px] text-slate-400">Elige la alternativa gratuita del stack (Resend) o campañas frías (Instantly.ai).</p>
                    </div>

                    <div className="flex items-center gap-1 bg-[#080b11] p-1 rounded-xl border border-slate-800">
                      <button
                        type="button"
                        onClick={() => setSettings({ ...settings, preferredEmailProvider: 'resend' })}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                          settings.preferredEmailProvider === 'resend'
                            ? 'bg-emerald-600 text-white shadow-sm'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        ⚡ Resend ($0.00)
                      </button>
                      <button
                        type="button"
                        onClick={() => setSettings({ ...settings, preferredEmailProvider: 'instantly' })}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                          settings.preferredEmailProvider === 'instantly'
                            ? 'bg-sky-600 text-white shadow-sm'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        🔥 Instantly.ai
                      </button>
                    </div>
                  </div>

                  {/* RESEND CONFIG */}
                  <div className="p-3.5 rounded-xl bg-emerald-950/20 border border-emerald-500/20 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                        <label className="text-xs font-bold text-emerald-300">
                          Resend API Key (Alternativa Gratuita · 3,000 emails/mes gratis)
                        </label>
                      </div>
                      <a
                        href="https://resend.com"
                        target="_blank"
                        rel="noreferrer"
                        className="text-[10px] text-emerald-400 hover:text-emerald-300 flex items-center gap-0.5 underline font-medium"
                      >
                        Obtener clave gratis en resend.com <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    </div>
                    <input
                      type="password"
                      value={settings.resendApiKey || ''}
                      onChange={(e) => setSettings({ ...settings, resendApiKey: e.target.value })}
                      placeholder="re_123456789..."
                      className="w-full bg-[#080b11] border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-emerald-500"
                    />

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                        Remitente (From Email):
                      </label>
                      <input
                        type="text"
                        value={settings.resendFromEmail || ''}
                        onChange={(e) => setSettings({ ...settings, resendFromEmail: e.target.value })}
                        placeholder="Goglite Agencia <onboarding@resend.dev>"
                        className="w-full bg-[#080b11] border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-emerald-500"
                      />
                      <p className="text-[10px] text-slate-500 mt-1">
                        Puedes usar <code>onboarding@resend.dev</code> para pruebas de inmediato, o tu dominio verificado.
                      </p>
                    </div>
                  </div>

                  {/* INSTANTLY CONFIG */}
                  <div className="p-3.5 rounded-xl bg-sky-950/20 border border-sky-500/20 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-sky-300">
                        Instantly.ai API Key (Envío Frío, Campañas & Calentamiento)
                      </label>
                      <a
                        href="https://instantly.ai"
                        target="_blank"
                        rel="noreferrer"
                        className="text-[10px] text-sky-400 hover:text-sky-300 flex items-center gap-0.5 underline font-medium"
                      >
                        instantly.ai <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    </div>
                    <input
                      type="password"
                      value={settings.instantlyApiKey || ''}
                      onChange={(e) => setSettings({ ...settings, instantlyApiKey: e.target.value })}
                      placeholder="instantly_..."
                      className="w-full bg-[#080b11] border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-sky-500"
                    />
                    <p className="text-[10px] text-slate-500">
                      Sincroniza y empuja automáticamente los prospectos a tus secuencias de correo frío en Instantly.
                    </p>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between">
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-semibold text-xs shadow-md transition-all"
                  >
                    Guardar Configuración
                  </button>

                  {settingsSaved && (
                    <span className="text-xs text-emerald-400 font-medium flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Guardado con éxito
                    </span>
                  )}
                </div>
              </form>
            </div>
          )}
          </>
          )}
        </main>
      </div>

      {/* 3. MODAL: AUDITORÍA DETALLADA & EMAIL PITCH */}
      {selectedLeadModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0f1422] border border-slate-800 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-[#121929]">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-base text-slate-100">
                    {selectedLeadModal.nombreEmpresa || selectedLeadModal.dominio}
                  </span>
                  <span className="text-xs font-mono text-orange-400">
                    ({selectedLeadModal.dominio})
                  </span>
                </div>
                <div className="text-xs text-slate-400 mt-0.5">
                  Decisor: <span className="text-slate-200 font-medium">{selectedLeadModal.responsable}</span> · {selectedLeadModal.cargo}
                </div>
              </div>

              <button
                onClick={() => setSelectedLeadModal(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Tabs */}
            <div className="flex border-b border-slate-800 px-6 bg-[#0c101a] text-xs">
              <button
                onClick={() => setModalTab('auditoria')}
                className={`py-3 px-4 font-semibold border-b-2 transition-colors ${
                  modalTab === 'auditoria'
                    ? 'border-orange-500 text-orange-400'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                Auditoría SEO/GEO/CRO
              </button>
              <button
                onClick={() => setModalTab('pitch')}
                className={`py-3 px-4 font-semibold border-b-2 transition-colors ${
                  modalTab === 'pitch'
                    ? 'border-orange-500 text-orange-400'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                Email Pitch Personalizado
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto space-y-4">
              
              {/* TAB AUDITORIA */}
              {modalTab === 'auditoria' && (
                <div className="space-y-4">
                  <div className="text-xs text-slate-400">
                    Fecha de auditoría: {selectedLeadModal.auditoria?.fecha || "Reciente"}
                  </div>

                  {selectedLeadModal.auditoria?.puntos?.map((punto, idx) => (
                    <div key={idx} className="p-4 rounded-xl bg-[#090d16] border border-slate-800/90 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded bg-blue-500/15 text-blue-400 border border-blue-500/30">
                            #{idx + 1} {punto.categoria}
                          </span>
                          <span className="text-[10px] font-bold font-mono px-1.5 py-0.5 rounded bg-rose-500/15 text-rose-400 border border-rose-500/30">
                            {punto.prioridad}
                          </span>
                        </div>
                      </div>

                      <div className="text-sm font-bold text-slate-100">{punto.titulo}</div>

                      <div className="space-y-1.5 text-xs">
                        <div>
                          <span className="text-[10px] font-mono uppercase text-slate-500 font-bold block">Problema</span>
                          <p className="text-slate-300 leading-relaxed">{punto.problema}</p>
                        </div>

                        <div>
                          <span className="text-[10px] font-mono uppercase text-slate-500 font-bold block">Por qué importa</span>
                          <p className="text-slate-400 leading-relaxed">{punto.porQueImporta}</p>
                        </div>

                        <div className="pt-1 text-slate-400">
                          <span className="text-[10px] font-mono uppercase text-emerald-500 font-bold block">Competidores líderes</span>
                          <p className="text-slate-400 italic leading-relaxed">{punto.competidores}</p>
                        </div>
                      </div>
                    </div>
                  ))}

                  <div className="pt-2 flex justify-end">
                    <button
                      onClick={() => setModalTab('pitch')}
                      className="px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-semibold text-xs flex items-center gap-1.5 shadow-md"
                    >
                      <span>Ver Email Pitch</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}

              {/* TAB PITCH */}
              {modalTab === 'pitch' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400">
                      Borrador de correo listo para enviar:
                    </span>
                    <button
                      onClick={() => handleCopyPitch(selectedLeadModal.pitch)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 transition-colors"
                    >
                      {copiedPitch ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedPitch ? 'Copiado' : 'Copiar Email'}</span>
                    </button>
                  </div>

                  {/* Campo de Destinatario Editable */}
                  <div className="flex items-center gap-2 bg-[#090d16] px-3 py-2 rounded-xl border border-slate-800">
                    <span className="text-[11px] font-semibold text-slate-400 whitespace-nowrap">Enviar a (Email):</span>
                    <input
                      type="email"
                      value={customRecipient !== '' ? customRecipient : (selectedLeadModal.email || '')}
                      onChange={(e) => setCustomRecipient(e.target.value)}
                      className="flex-1 bg-transparent text-xs text-emerald-400 font-mono focus:outline-none placeholder-slate-600"
                      placeholder="v.matos.sv@gmail.com"
                    />
                  </div>

                  <div className="p-4 rounded-xl bg-[#080b11] border border-slate-800 font-sans text-xs text-slate-200 whitespace-pre-line leading-relaxed">
                    {selectedLeadModal.pitch}
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-800 gap-2 flex-wrap">
                    <a
                      href={`mailto:${customRecipient || selectedLeadModal.email}?subject=Pregunta rápida sobre ${selectedLeadModal.nombreEmpresa || selectedLeadModal.dominio}&body=${encodeURIComponent(selectedLeadModal.pitch || '')}`}
                      className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs flex items-center gap-1.5 transition-all"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Abrir en Gmail / Mail</span>
                    </a>

                    <div className="flex items-center gap-2">
                      <button
                        disabled={isSendingEmail}
                        onClick={async () => {
                          await handleSendEmail(selectedLeadModal.id, 'resend', customRecipient || selectedLeadModal.email);
                          setSelectedLeadModal(null);
                        }}
                        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center gap-1.5 shadow-md transition-all disabled:opacity-50"
                        title="Enviar correo real directo mediante Resend ($0.00 Tier)"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>{isSendingEmail ? 'Enviando...' : '⚡ Enviar con Resend ($0.00)'}</span>
                      </button>

                      <button
                        disabled={isSendingEmail}
                        onClick={async () => {
                          await handleSendEmail(selectedLeadModal.id, 'instantly', customRecipient || selectedLeadModal.email);
                          setSelectedLeadModal(null);
                        }}
                        className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs flex items-center gap-1.5 shadow-md transition-all disabled:opacity-50"
                        title="Subir lead a secuencia de calentamiento de Instantly"
                      >
                        <Zap className="w-3.5 h-3.5" />
                        <span>Enviar a Instantly</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
