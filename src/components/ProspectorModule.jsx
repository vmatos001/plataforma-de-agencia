import React, { useState, useEffect } from 'react';
import {
  MapPin,
  Globe,
  Zap,
  Play,
  RefreshCw,
  Search,
  Star,
  Phone,
  Sparkles,
  Download,
  ExternalLink,
  CheckCircle2,
  Mail,
  UserPlus,
  FileText,
  Send,
  Trash2,
  Copy,
  Check,
  X
} from 'lucide-react';
import { apiClient } from '../services/apiClient';
import {
  STORAGE_KEYS,
  getLocalItem,
  setLocalItem,
  getStoredCrmLeads,
  saveStoredCrmLeads
} from '../services/localStore';
import { clientSearch, generateClientLead, generateClientAudit, generateClientPitch } from '../services/clientLeadEngine';

export default function ProspectorModule({
  selectedCountry = 'SV',
  onConvertToPresupuesto,
  onNavigateToCrm,
  onNavigateToPresupuestos,
  activeSubTab = 'buscar',
  onSubTabChange
}) {
  const [activeTab, setActiveTab] = useState(activeSubTab || 'buscar');
  const [searchMode, setSearchMode] = useState('maps'); // 'maps' | 'web'
  const [pipelineInput, setPipelineInput] = useState('');
  const [manualSearchInput, setManualSearchInput] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isPipelineRunning, setIsPipelineRunning] = useState(false);
  const [pipelineProgress, setPipelineProgress] = useState('');

  // Leads y resultados
  const [searchResults, setSearchResults] = useState([]);
  const [selectedResults, setSelectedResults] = useState(new Set());
  const [leads, setLeads] = useState(() => getLocalItem(STORAGE_KEYS.OUTBOUND_LEADS, []));

  // Filtros y búsquedas de leads
  const [leadFilter, setLeadFilter] = useState('todos');
  const [leadSearchTerm, setLeadSearchTerm] = useState('');

  // Modal de auditoría y pitch
  const [selectedLeadModal, setSelectedLeadModal] = useState(null);
  const [modalTab, setModalTab] = useState('auditoria'); // 'auditoria' | 'pitch'
  const [copiedPitch, setCopiedPitch] = useState(false);
  const [customRecipient, setCustomRecipient] = useState('');

  // Normalizador defensivo de auditoría y pitch (asegura datos tanto para leads nuevos como en localStorage)
  const getLeadAudit = (lead) => {
    if (!lead) return null;
    if (lead.auditoria && Array.isArray(lead.auditoria.puntos) && lead.auditoria.puntos.length > 0) {
      return lead.auditoria;
    }
    return generateClientAudit(lead, lead.nombreEmpresa || lead.dominio, lead.pais || selectedCountry);
  };

  const getLeadPitch = (lead, audit) => {
    if (!lead) return '';
    if (typeof lead.pitch === 'string' && lead.pitch.trim()) {
      return lead.pitch;
    }
    if (lead.pitch && typeof lead.pitch === 'object' && lead.pitch.cuerpo) {
      return `${lead.pitch.asunto ? 'Asunto: ' + lead.pitch.asunto + '\n\n' : ''}${lead.pitch.cuerpo}`;
    }
    return generateClientPitch(lead, audit, lead.pais || selectedCountry);
  };

  // Ajustes de API
  const [settings, setSettings] = useState({
    geminiApiKey: '',
    serperApiKey: '',
    apolloApiKey: ''
  });
  const [settingsSaved, setSettingsSaved] = useState(false);

  // Sincronizar activeSubTab si cambia externamente
  useEffect(() => {
    if (activeSubTab && activeSubTab !== activeTab) {
      setActiveTab(activeSubTab);
    }
  }, [activeSubTab]);

  const handleTabSwitch = (tab) => {
    setActiveTab(tab);
    if (onSubTabChange) onSubTabChange(tab);
  };

  useEffect(() => {
    fetchLeads();
    fetchSettings();
  }, []);

  const fetchLeads = async () => {
    try {
      const res = await apiClient.get('/api/leads');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setLeads(data);
          setLocalItem(STORAGE_KEYS.OUTBOUND_LEADS, data);
          autoSyncLeadsToCrmLocal(data);
        }
      }
    } catch (err) {
      console.warn('[Prospector] API offline o en hosting estático, operando en modo Local-First:', err.message);
    }
  };

  // Continuidad Automática Fase 1 -> Fase 2 (CRM) en el almacén local
  const autoSyncLeadsToCrmLocal = (outboundList = []) => {
    if (!Array.isArray(outboundList) || outboundList.length === 0) return;
    try {
      const currentCrm = getStoredCrmLeads();
      let changed = false;
      const today = new Date().toISOString().split('T')[0];

      for (const sl of outboundList) {
        const slDom = (sl.dominio || '').toLowerCase().trim();
        const slEmp = (sl.nombreEmpresa || sl.dominio || '').toLowerCase().trim();
        const exists = currentCrm.some(cl =>
          (sl.id && (cl.leadId === sl.id || cl.id === `crm-${sl.id}` || cl.id === `crm-scrapper-${sl.id}`)) ||
          (slDom && (cl.dominio || '').toLowerCase().trim() === slDom) ||
          (slEmp && (cl.empresa || '').toLowerCase().trim() === slEmp)
        );

        if (!exists) {
          changed = true;
          currentCrm.unshift({
            id: `crm-${sl.id || Date.now() + '-' + Math.random().toString(36).substring(2, 6)}`,
            leadId: sl.id || null,
            empresa: sl.nombreEmpresa || sl.dominio || 'Negocio Prospectado',
            contacto: sl.responsable || 'Dirección Comercial',
            cargo: sl.cargo || 'Propietario / Gerente',
            email: sl.email && !sl.email.endsWith('.negocio') ? sl.email : '',
            telefono: sl.telefono || '',
            pais: sl.pais || (selectedCountry === 'ALL' ? 'SV' : selectedCountry),
            dominio: sl.sinWeb ? '' : (sl.dominio || ''),
            sinWeb: Boolean(sl.sinWeb),
            resenas: sl.resenas || 0,
            calificacion: sl.calificacion || 4.8,
            etapa: sl.estado === 'cliente' ? 'ganado' : 'nuevo',
            valorEstimado: 1500,
            probabilidad: 25,
            fuente: `Fase 1 Prospector (${sl.sinWeb ? 'Google Maps' : 'SERP Web'})`,
            portalToken: `portal-${sl.id || Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            auditoriaResumen: sl.auditoria || null,
            interacciones: [
              {
                id: 'int-auto-' + Date.now() + Math.random(),
                tipo: 'nota',
                titulo: 'Sincronización Automática Fase 1 → Fase 2',
                detalle: `Prospecto captado en Fase 1 con ${sl.auditoria?.puntos?.length || 0} oportunidades detectadas.`,
                fecha: today,
                proximoPaso: 'Primer contacto por WhatsApp / Envío de Propuesta',
                fechaProximoPaso: ''
              }
            ],
            whatsappData: {
              telefono: sl.telefono || '',
              temperatura: 'caliente',
              estadoSeguimiento: 'primer_contacto',
              ultimoMensajeFecha: 'Hoy',
              mensajes: []
            },
            creadoEn: today
          });
        }
      }

      if (changed) {
        saveStoredCrmLeads(currentCrm);
      }
    } catch (e) {
      console.warn('[Prospector] Error sincronizando con CRM local:', e);
    }
  };

  const fetchSettings = async () => {
    try {
      const res = await apiClient.get('/api/settings');
      if (res.ok) {
        const data = await res.json();
        setSettings(prev => ({ ...prev, ...data }));
      }
    } catch (err) {
      console.warn('[Prospector] Error leyendo configuración:', err.message);
    }
  };

  // Búsqueda Manual
  const handleManualSearch = async (queryText) => {
    const q = queryText || manualSearchInput;
    if (!q || !q.trim()) return;

    setIsSearching(true);
    setSearchResults([]);
    setSelectedResults(new Set());

    try {
      let results = [];
      try {
        const res = await apiClient.post('/api/search', {
          query: q,
          country: selectedCountry,
          searchMode
        }, { timeoutMs: 5000 });

        if (res.ok) {
          const contentType = res.headers.get('content-type') || '';
          if (contentType.includes('application/json')) {
            const data = await res.json();
            if (data.success && Array.isArray(data.results) && data.results.length > 0) {
              results = data.results;
            }
          }
        }
      } catch (backendErr) {
        console.warn('[Prospector] Backend search offline, usando motor de búsqueda cliente:', backendErr.message);
      }

      // Si el backend no respondió con JSON válido o no devolvió resultados, ejecutar clientSearch en vivo
      if (!results || results.length === 0) {
        results = await clientSearch(q, selectedCountry, searchMode, settings.serperApiKey);
      }

      setSearchResults(results || []);
      const recommended = new Set(
        (results || [])
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

  // Pipeline 1-Click
  const handleRunPipeline = async (queryText) => {
    const q = queryText || pipelineInput;
    if (!q || !q.trim()) return;

    setIsPipelineRunning(true);
    setPipelineProgress(searchMode === 'maps'
      ? 'Consultando Google Maps para negocios con reseñas pero SIN página web...'
      : 'Buscando empresas en Google (posiciones 4-20)...');

    try {
      setPipelineProgress('Auditando presencia, analizando reseñas y estructurando pitches con IA...');
      let completed = false;

      try {
        const res = await apiClient.post('/api/pipeline', {
          query: q,
          country: selectedCountry,
          limit: 10,
          searchMode
        }, { timeoutMs: 8000 });

        if (res.ok) {
          const contentType = res.headers.get('content-type') || '';
          if (contentType.includes('application/json')) {
            const data = await res.json();
            if (data.success) {
              setPipelineProgress(`¡Completado! Se generaron ${data.nuevosGuardados || 0} leads nuevos.`);
              await fetchLeads();
              completed = true;
            }
          }
        }
      } catch (backendErr) {
        console.warn('[Prospector] Backend pipeline offline, procesando en cliente:', backendErr.message);
      }

      // Fallback autónomo en cliente si el backend no está disponible
      if (!completed) {
        setPipelineProgress('Conectando a motor de prospección en vivo...');
        const rawResults = await clientSearch(q, selectedCountry, searchMode, settings.serperApiKey);
        if (rawResults && rawResults.length > 0) {
          const leadsToCreate = rawResults.slice(0, 10).map(item => generateClientLead(item, q, selectedCountry));
          setLeads(prev => {
            const existingDomains = new Set(prev.map(l => l.dominio));
            const fresh = leadsToCreate.filter(l => !existingDomains.has(l.dominio));
            const updated = [...fresh, ...prev];
            setLocalItem(STORAGE_KEYS.OUTBOUND_LEADS, updated);
            autoSyncLeadsToCrmLocal(fresh);
            return updated;
          });
          setPipelineProgress(`¡Completado en vivo! Se generaron ${leadsToCreate.length} leads calificados.`);
          completed = true;
        }
      }

      if (!completed) {
        setPipelineProgress('No se encontraron resultados para la consulta ingresada.');
      }

      setTimeout(() => {
        setIsPipelineRunning(false);
        handleTabSwitch('leads');
      }, 1200);
    } catch (err) {
      alert('Error en pipeline: ' + err.message);
      setIsPipelineRunning(false);
    }
  };

  const toggleSelectResult = (domain) => {
    const next = new Set(selectedResults);
    if (next.has(domain)) next.delete(domain);
    else next.add(domain);
    setSelectedResults(next);
  };

  const selectAllResults = () => {
    setSelectedResults(new Set(searchResults.map(r => r.dominio)));
  };

  const selectRecommendedResults = () => {
    setSelectedResults(new Set(searchResults.filter(r => r.recomendadoOutbound || r.esProspectoOro).map(r => r.dominio)));
  };

  // Extraer seleccionados y auditar
  const handleExtractSelected = async () => {
    if (selectedResults.size === 0) return;
    setIsSearching(true);

    const itemsToProcess = searchResults.filter(r => selectedResults.has(r.dominio));

    for (const item of itemsToProcess) {
      try {
        let newLeadPayload;
        try {
          const enrichRes = await apiClient.post('/api/enrich', {
            domain: item.dominio,
            companyName: item.titulo,
            country: selectedCountry,
            sinWeb: item.sinWeb,
            telefono: item.telefono
          });
          const enrichData = await enrichRes.json();
          const contact = enrichData.contact || {};

          const auditRes = await apiClient.post('/api/audit', {
            domain: item.dominio,
            query: manualSearchInput,
            country: selectedCountry,
            resenas: item.resenas,
            calificacion: item.calificacion,
            sinWeb: item.sinWeb,
            tipoFuente: item.tipoFuente,
            titulo: item.titulo
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

          const pitchRes = await apiClient.post('/api/pitch', {
            lead: newLeadPayload,
            audit,
            country: selectedCountry
          });
          const pitchData = await pitchRes.json();
          newLeadPayload.pitch = pitchData.pitch;

          await apiClient.post('/api/leads', newLeadPayload);
        } catch {
          newLeadPayload = generateClientLead(item, manualSearchInput, selectedCountry);
        }

        if (newLeadPayload) {
          setLeads(prev => {
            const updated = [newLeadPayload, ...prev];
            setLocalItem(STORAGE_KEYS.OUTBOUND_LEADS, updated);
            autoSyncLeadsToCrmLocal([newLeadPayload]);
            return updated;
          });
        }
      } catch (err) {
        console.error('Error procesando lead individual:', err);
      }
    }

    await fetchLeads();
    setIsSearching(false);
    handleTabSwitch('leads');
  };

  // Actualizar estado del lead
  const handleUpdateLeadStatus = async (leadId, newStatus) => {
    setLeads(prev => {
      const updated = prev.map(l => l.id === leadId ? { ...l, estado: newStatus, actualizado: new Date().toISOString().split('T')[0] } : l);
      setLocalItem(STORAGE_KEYS.OUTBOUND_LEADS, updated);
      return updated;
    });

    if (selectedLeadModal && selectedLeadModal.id === leadId) {
      setSelectedLeadModal(prev => ({ ...prev, estado: newStatus }));
    }

    try {
      await apiClient.patch(`/api/leads/${leadId}`, { estado: newStatus });
      fetchLeads();
    } catch (err) {
      console.warn('Cambio guardado localmente (API offline):', err);
    }
  };

  // Eliminar lead
  const handleDeleteLead = async (leadId) => {
    if (!confirm('¿Eliminar este lead de la lista?')) return;
    try {
      setLeads(prev => {
        const next = prev.filter(l => l.id !== leadId);
        setLocalItem(STORAGE_KEYS.OUTBOUND_LEADS, next);
        return next;
      });
      await apiClient.delete(`/api/leads/${leadId}`);
      if (selectedLeadModal?.id === leadId) setSelectedLeadModal(null);
    } catch (err) {
      console.error(err);
    }
  };

  // Transferir lead al CRM
  const handleTransferLeadToCrm = async (lead) => {
    try {
      const crmLeads = getStoredCrmLeads();

      const exists = crmLeads.some(cl =>
        (cl.id && cl.id === lead.id) ||
        (cl.telefono && lead.telefono && cl.telefono.replace(/\D/g, '') === lead.telefono.replace(/\D/g, '')) ||
        (cl.empresa && lead.nombreEmpresa && cl.empresa.toLowerCase().trim() === lead.nombreEmpresa.toLowerCase().trim())
      );

      if (exists) {
        if (confirm(`El prospecto "${lead.nombreEmpresa || lead.dominio}" ya está registrado en el CRM.\n\n¿Deseas ir a la Fase 2 (CRM) para ver su Ficha de Cliente?`)) {
          if (onNavigateToCrm) onNavigateToCrm();
        }
        return;
      }

      const nuevoCrmLead = {
        id: lead.id || 'crm-lead-' + Date.now(),
        leadId: lead.id || null,
        empresa: lead.nombreEmpresa || lead.dominio || 'Negocio Scrapeado',
        contacto: lead.responsable || 'Dirección Comercial',
        cargo: lead.cargo || 'Propietario / Gerente',
        email: lead.email && !lead.email.endsWith('.negocio') ? lead.email : '',
        telefono: lead.telefono || '',
        pais: lead.pais || selectedCountry || 'SV',
        dominio: lead.sinWeb ? '' : (lead.dominio || ''),
        sinWeb: Boolean(lead.sinWeb),
        resenas: lead.resenas || 0,
        calificacion: lead.calificacion || 4.8,
        etapa: lead.estado === 'cliente' ? 'ganado' : 'nuevo',
        valorEstimado: lead.estado === 'cliente' ? 2400 : 1500,
        probabilidad: lead.estado === 'cliente' ? 100 : 35,
        fuente: `Lead Scrapper Fase 1 (${lead.sinWeb || lead.dominio?.startsWith('maps-') ? 'Google Maps Sin Web' : 'SERP Web'})`,
        portalToken: 'portal-' + (lead.id || Date.now()) + '-' + Math.random().toString(36).substring(2, 6),
        interacciones: [
          {
            id: 'int-scrape-' + Date.now(),
            tipo: 'nota',
            titulo: 'Importado desde Lead Scrapper Fase 1',
            detalle: `Prospecto localizado en ${lead.pais === 'DO' ? 'República Dominicana' : 'El Salvador'}. ${lead.auditoria ? `Auditoría inicial con ${lead.auditoria.puntos?.length || 0} oportunidades detectadas.` : 'Localizado en prospección activa.'}`,
            fecha: new Date().toISOString().split('T')[0],
            proximoPaso: 'Realizar contacto inicial o enviar WhatsApp',
            fechaProximoPaso: ''
          }
        ],
        whatsappData: {
          telefono: lead.telefono || '',
          temperatura: 'caliente',
          estadoSeguimiento: 'primer_contacto',
          ultimoMensajeFecha: 'Hoy',
          mensajes: []
        },
        creadoEn: new Date().toISOString().split('T')[0]
      };

      const updatedCrm = [nuevoCrmLead, ...crmLeads];
      saveStoredCrmLeads(updatedCrm);

      try {
        await apiClient.post('/api/crm/leads', nuevoCrmLead);
      } catch (e) {
        console.warn('[Prospector] Guardado en CRM localmente:', e);
      }

      handleUpdateLeadStatus(lead.id, 'cliente');

      if (confirm(`🎉 ¡"${nuevoCrmLead.empresa}" registrado con éxito en el CRM!\n\n¿Deseas ir ahora a la Fase 2 (CRM) para ver su Ficha 360°?`)) {
        if (onNavigateToCrm) onNavigateToCrm();
      }
    } catch (err) {
      console.error('Error transfiriendo lead a CRM:', err);
      alert('Error al transferir prospecto al CRM');
    }
  };

  // Guardar configuración
  const handleSaveSettings = async (e) => {
    e.preventDefault();
    try {
      await apiClient.post('/api/settings', settings);
      setSettingsSaved(true);
      setTimeout(() => setSettingsSaved(false), 3000);
    } catch (err) {
      alert('Error guardando ajustes: ' + err.message);
    }
  };

  const handleCopyPitch = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedPitch(true);
    setTimeout(() => setCopiedPitch(false), 2000);
  };

  // Filtrado de leads
  const filteredLeads = leads.filter(l => {
    const matchesFilter =
      leadFilter === 'todos' ? true :
      leadFilter === 'sin_email' ? (!l.email || l.email.includes('contacto@')) :
      leadFilter === 'contactado' ? (l.estado === 'contactado' || l.estado === 'enviado_resend' || l.estado === 'enviado_instantly') :
      l.estado === leadFilter;

    const term = leadSearchTerm.toLowerCase();
    const matchesSearch = !term ||
      l.dominio?.toLowerCase().includes(term) ||
      l.responsable?.toLowerCase().includes(term) ||
      l.email?.toLowerCase().includes(term) ||
      l.nombreEmpresa?.toLowerCase().includes(term);

    return matchesFilter && matchesSearch;
  });

  const nicheSuggestions = [
    {
      title: "Clínicas Dentales & Estéticas",
      country: "SV",
      flag: "🇸🇻",
      query: "clínicas dentales San Salvador",
      desc: "Negocios con alto valor por paciente ($1,500+ en implantes/ortodoncia) con webs lentas y sin presencia en IA.",
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
      desc: "Firmas tradicionales con webs antiguas, nula optimización SEO y nula citación en modelos de IA.",
      roi: "Alto"
    },
    {
      title: "Logística y Carga Internacional",
      country: "SV",
      flag: "🇸🇻",
      query: "empresas de logística El Salvador transporte de carga",
      desc: "Servicios B2B con contratos de retención mensual ($2,000+). Buscan proveedores con alta autoridad digital.",
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

  return (
    <div className="space-y-6">
      {/* Selector de Pestaña Superior de Prospección */}
      <div className="flex items-center gap-2 border-b border-slate-800/80 pb-3">
        <button
          onClick={() => handleTabSwitch('buscar')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            activeTab === 'buscar'
              ? 'bg-orange-600/20 text-orange-400 border border-orange-500/30 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          <Search className="w-3.5 h-3.5" />
          <span>Buscar & Pipeline</span>
        </button>

        <button
          onClick={() => handleTabSwitch('sugerencias')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            activeTab === 'sugerencias'
              ? 'bg-orange-600/20 text-orange-400 border border-orange-500/30 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>Nichos Validados</span>
        </button>

        <button
          onClick={() => handleTabSwitch('leads')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            activeTab === 'leads'
              ? 'bg-orange-600/20 text-orange-400 border border-orange-500/30 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          <Mail className="w-3.5 h-3.5" />
          <span>Leads Guardados</span>
          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-300">
            {leads.length}
          </span>
        </button>

        <button
          onClick={() => handleTabSwitch('ajustes')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            activeTab === 'ajustes'
              ? 'bg-orange-600/20 text-orange-400 border border-orange-500/30 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          <Zap className="w-3.5 h-3.5" />
          <span>Ajustes & APIs</span>
        </button>
      </div>

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
                onClick={() => handleManualSearch(manualSearchInput)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-100 font-semibold text-xs transition-all shrink-0"
              >
                {isSearching ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                <span>Buscar</span>
              </button>
            </div>
          </div>

          {/* Resultados de búsqueda */}
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

              {/* Tarjetas de resultados */}
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
                          onChange={() => {}}
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
                      setManualSearchInput(n.query);
                      handleTabSwitch('buscar');
                      handleManualSearch(n.query);
                    }}
                    className="flex-1 py-1.5 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors"
                  >
                    Ver en Google
                  </button>
                  <button
                    onClick={() => {
                      setPipelineInput(n.query);
                      handleTabSwitch('buscar');
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
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <h1 className="text-lg font-extrabold text-slate-100">Leads</h1>
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-mono font-medium">
                {leads.length} guardados
              </span>
            </div>

            <div className="flex items-center gap-2">
              <a
                href={apiClient ? '/api/export/csv' : '#'}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-lime-500 hover:bg-lime-400 text-black font-bold text-xs shadow-sm transition-all"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Exportar CSV</span>
              </a>
            </div>
          </div>

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

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
              {[
                { id: 'todos', label: 'Todos' },
                { id: 'nuevo', label: 'Nuevo' },
                { id: 'contactado', label: 'Contactado' },
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

          {/* Tabla de Leads */}
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
                          value={(lead.estado === 'enviado_resend' || lead.estado === 'enviado_instantly') ? 'contactado' : lead.estado}
                          onChange={(e) => handleUpdateLeadStatus(lead.id, e.target.value)}
                          className={`text-[10px] font-semibold px-2 py-1 rounded-md border bg-[#0b0f19] focus:outline-none cursor-pointer ${
                            lead.estado === 'cliente' ? 'border-emerald-500 text-emerald-400' :
                            lead.estado === 'contactado' || lead.estado === 'enviado_resend' || lead.estado === 'enviado_instantly' ? 'border-amber-500 text-amber-400 bg-amber-950/20' :
                            lead.estado === 'respondio' ? 'border-purple-500 text-purple-400' :
                            'border-slate-700 text-slate-300'
                          }`}
                        >
                          <option value="nuevo">Nuevo</option>
                          <option value="contactado">Contactado</option>
                          <option value="respondio">Respondió</option>
                          <option value="cliente">Cliente</option>
                          <option value="descartado">Descartado</option>
                        </select>
                      </td>

                      <td className="px-4 py-3">
                        <button
                          onClick={() => {
                            setSelectedLeadModal(lead);
                            setModalTab('auditoria');
                          }}
                          className="text-[11px] font-medium text-emerald-400 hover:text-emerald-300 flex items-center gap-1 bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20"
                        >
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Ver Auditoría ({getLeadAudit(lead)?.puntos?.length || 3})</span>
                        </button>
                      </td>

                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
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
                          <button
                            onClick={() => handleTransferLeadToCrm(lead)}
                            className="p-1.5 rounded hover:bg-slate-700 text-sky-400 border border-sky-500/20 hover:border-sky-500/50"
                            title="Transferir a Base de Datos CRM / Crear Ficha de Cliente"
                          >
                            <UserPlus className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              if (onConvertToPresupuesto) onConvertToPresupuesto(lead);
                            }}
                            className="p-1.5 rounded hover:bg-slate-700 text-amber-400"
                            title="Crear Presupuesto con Portada Goglite"
                          >
                            <FileText className="w-3.5 h-3.5" />
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
                Tu plataforma corre con servicios de nivel corporativo en su tier gratuito: <strong>Firebase Hosting</strong> ($0.00), <strong>Neon PostgreSQL</strong> ($0.00), <strong>Google Gemini AI</strong> ($0.00), <strong>Serper Google SERP</strong> ($0.00) y envíos directos vía <strong>Gmail Web / Workspace</strong>.
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
              <div>
                <h3 className="text-xs font-bold text-slate-200">Envíos de Correo y Prospección Directa</h3>
                <p className="text-[11px] text-slate-400">
                  Los correos de prospección se redactan y envían con 1 clic mediante <strong>Gmail Web</strong> o tu cliente de correo corporativo, garantizando 100% de entrega desde tu propia cuenta sin requerir claves externas.
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

      {/* MODAL: AUDITORÍA DETALLADA & EMAIL PITCH */}
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
              {modalTab === 'auditoria' && (() => {
                const audit = getLeadAudit(selectedLeadModal);
                return (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span>Fecha de auditoría: {audit?.fecha || "Reciente"}</span>
                      <span className="font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                        {audit?.tipoAuditoria === 'google_maps_no_web' ? '📍 Google Maps (Sin Web)' : '🌐 Auditoría Orgánica Google'}
                      </span>
                    </div>

                    {audit?.puntos?.map((punto, idx) => (
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

                        <div className="text-xs font-bold text-slate-200">{punto.titulo}</div>
                        <p className="text-xs text-slate-300 leading-relaxed">{punto.problema}</p>

                        <div className="pt-2 border-t border-slate-800/80 space-y-1.5 text-xs">
                          <div className="text-amber-400/90">
                            <span className="font-semibold text-amber-300">Por qué importa: </span>
                            {punto.porQueImporta}
                          </div>
                          <div className="text-slate-400">
                            <span className="font-semibold text-slate-300">Competencia: </span>
                            {punto.competidores}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}

              {/* TAB PITCH */}
              {modalTab === 'pitch' && (() => {
                const audit = getLeadAudit(selectedLeadModal);
                const pitchText = getLeadPitch(selectedLeadModal, audit);
                return (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-400">Plantilla personalizada con Gemini IA:</span>
                      <button
                        onClick={() => handleCopyPitch(pitchText)}
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
                      {pitchText}
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-800 gap-2 flex-wrap">
                      <div className="flex items-center gap-2">
                        <a
                          href={`https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(customRecipient !== '' ? customRecipient : (selectedLeadModal.email || ''))}&su=${encodeURIComponent(`Oportunidad digital para ${selectedLeadModal.nombreEmpresa || selectedLeadModal.dominio}`)}&body=${encodeURIComponent(pitchText || '')}`}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 py-2 rounded-xl bg-red-600/20 hover:bg-red-600/30 text-red-300 border border-red-500/30 font-semibold text-xs flex items-center gap-1.5 transition-all"
                          title="Abrir redactor web de Gmail en nueva pestaña"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>Abrir en Gmail Web</span>
                        </a>

                        <a
                          href={`mailto:${customRecipient !== '' ? customRecipient : (selectedLeadModal.email || '')}?subject=Pregunta rápida sobre ${selectedLeadModal.nombreEmpresa || selectedLeadModal.dominio}&body=${encodeURIComponent(pitchText || '')}`}
                          className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs flex items-center gap-1.5 transition-all"
                          title="Abrir en cliente de correo predeterminado"
                        >
                          <Mail className="w-3.5 h-3.5" />
                          <span>App de Correo</span>
                        </a>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            handleUpdateLeadStatus(selectedLeadModal.id, 'contactado');
                            alert(`El prospecto "${selectedLeadModal.nombreEmpresa || selectedLeadModal.dominio}" fue marcado como Contactado.`);
                          }}
                          className="px-4 py-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 font-semibold text-xs flex items-center gap-1.5 transition-all"
                          title="Marcar estado del prospecto como Contactado"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Marcar como Contactado</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
