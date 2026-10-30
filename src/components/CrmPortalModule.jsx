import React, { useState, useEffect } from 'react';
import {
  Kanban,
  Users,
  User,
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
  X,
  Flame,
  CheckCheck,
  Smartphone,
  Share2,
  Zap,
  QrCode,
  Wifi,
  WifiOff,
  RefreshCw,
  UserPlus,
  Download,
  Layers,
  MapPin,
  Star,
  Crown,
  Archive,
  ArchiveRestore
} from 'lucide-react';
import { apiClient } from '../services/apiClient';
import {
  getStoredCrmLeads,
  saveStoredCrmLeads,
  syncCrmLeadsWithPresupuestos
} from '../services/localStore';
import {
  getCrmLeadsCloud,
  saveCrmLeadCloud,
  deleteCrmLeadCloud,
  subscribeCrmLeadsCloud,
  savePortalCloud
} from '../services/firestoreSyncService';

const PIPELINE_STAGES = [
  { id: 'contactado', label: 'Contactado', color: 'border-sky-500/40', badge: 'bg-sky-500/10 text-sky-400', dot: 'bg-sky-400' },
  { id: 'reunion', label: 'Reunión / Demo', color: 'border-indigo-500/40', badge: 'bg-indigo-500/10 text-indigo-400', dot: 'bg-indigo-400' },
  { id: 'propuesta_enviada', label: 'Propuesta Enviada', color: 'border-amber-500/40', badge: 'bg-amber-500/10 text-amber-400', dot: 'bg-amber-400' },
  { id: 'negociacion', label: 'Negociación', color: 'border-orange-500/40', badge: 'bg-orange-500/10 text-orange-400', dot: 'bg-orange-400' },
  { id: 'ganado', label: 'Cerrado Ganado', color: 'border-emerald-500/50', badge: 'bg-emerald-500/15 text-emerald-400', dot: 'bg-emerald-400' },
  { id: 'perdido', label: 'Perdido', color: 'border-rose-900/40', badge: 'bg-rose-900/30 text-rose-400', dot: 'bg-rose-500' }
];

const TEMPERATURE_CONFIG = {
  caliente: { label: 'Caliente', icon: '🔥', badge: 'bg-amber-500/15 text-amber-400 border border-amber-500/30' },
  tibio: { label: 'Tibio', icon: '🟡', badge: 'bg-yellow-500/15 text-yellow-400 border border-yellow-500/30' },
  frio: { label: 'Frío', icon: '❄️', badge: 'bg-sky-500/15 text-sky-400 border border-sky-500/30' }
};

const FOLLOWUP_STAGES = [
  { id: 'esperando_respuesta', label: 'Esperando respuesta', color: 'bg-slate-700/50 text-slate-300' },
  { id: 'dia_1_valor', label: 'Día 1: Aporte de Valor', color: 'bg-sky-500/15 text-sky-400' },
  { id: 'dia_3_seguimiento', label: 'Día 3: Seguimiento Suave', color: 'bg-indigo-500/15 text-indigo-400' },
  { id: 'dia_7_cierre', label: 'Día 7: Cierre / Cortesía', color: 'bg-purple-500/15 text-purple-400' },
  { id: 'en_dialogo', label: 'En Diálogo Activo', color: 'bg-emerald-500/15 text-emerald-400' },
  { id: 'cerrado_ganado', label: 'Cerrado Ganado 🎉', color: 'bg-emerald-600/30 text-emerald-300 font-bold' },
  { id: 'objecion_precio', label: 'Objeción de Precio', color: 'bg-amber-500/15 text-amber-400' },
  { id: 'descartado', label: 'Descartado / Pausado', color: 'bg-rose-900/30 text-rose-400' }
];

const WHATSAPP_SCRIPTS = [
  {
    id: 's-diag-1',
    categoria: 'diagnostico',
    categoriaLabel: 'Diagnóstico & Saludo',
    titulo: 'Rompehielos & Auditoría Gratis',
    fase: 'Fase 1: Saludo Consultivo',
    generarTexto: (lead) => {
      const nombre = (lead?.contacto || 'Estimado').split(' ')[0];
      const empresa = lead?.empresa || 'su empresa';
      const dominio = lead?.dominio || '';
      return `¡Hola ${nombre}! 👋 Qué gusto saludarte. Estuve analizando el sitio de ${empresa} (${dominio}) y noté un par de detalles clave en velocidad móvil y visibilidad en Google Maps. ¿Te gustaría que te comparta una auditoría breve de 2 minutos sin costo?`;
    }
  },
  {
    id: 's-diag-2',
    categoria: 'diagnostico',
    categoriaLabel: 'Diagnóstico & Saludo',
    titulo: 'Pregunta de Situación (Cualificación)',
    fase: 'Fase 2: Cualificación',
    generarTexto: (lead) => {
      const nombre = (lead?.contacto || 'Estimado').split(' ')[0];
      return `¿Actualmente ya tienen un sitio web funcionando que les traiga prospectos constantes, o están buscando relanzar el proyecto desde cero, ${nombre}?`;
    }
  },
  {
    id: 's-diag-3',
    categoria: 'diagnostico',
    categoriaLabel: 'Diagnóstico & Saludo',
    titulo: 'Pregunta de Dolor (Conversión)',
    fase: 'Fase 2: Cualificación',
    generarTexto: (lead) => {
      return `¿Cuál es el mayor obstáculo que tienen hoy para convertir las visitas en clientes que les escriban directamente a WhatsApp?`;
    }
  },
  {
    id: 's-sol-1',
    categoria: 'solucion',
    categoriaLabel: 'Solución & Oferta',
    titulo: 'Pitch Antigravity (10 Días Llave en Mano)',
    fase: 'Fase 3: Oferta Específica',
    generarTexto: (lead) => {
      const nombre = (lead?.contacto || 'Estimado').split(' ')[0];
      return `Perfecto, ${nombre}. Entiendo exactamente la situación. Justo para resolver eso, implementamos plataformas web nativas en código puro (sin WordPress pesado ni plugins lentos) que cargan en menos de 1s y triplican la conversión directa a WhatsApp en 10 días llave en mano.`;
    }
  },
  {
    id: 's-sol-2',
    categoria: 'solucion',
    categoriaLabel: 'Solución & Oferta',
    titulo: 'Compartir Portal de Cliente Privado',
    fase: 'Fase 3: Oferta Específica',
    generarTexto: (lead) => {
      const nombre = (lead?.contacto || 'Estimado').split(' ')[0];
      const portalUrl = `${window.location.origin}/portal/${lead?.portalToken || 'portal-demo'}`;
      return `Hola ${nombre}, te preparé un Portal de Cliente exclusivo e interactivo con el diagnóstico de tu empresa y el alcance del proyecto. Puedes explorarlo aquí: ${portalUrl}`;
    }
  },
  {
    id: 's-obj-1',
    categoria: 'objeciones',
    categoriaLabel: 'Objeciones',
    titulo: 'Objeción: "Es muy caro / Sin presupuesto"',
    fase: 'Fase 4: Manejo de Objeciones',
    generarTexto: (lead) => {
      const nombre = (lead?.contacto || 'Estimado').split(' ')[0];
      return `Te entiendo perfectamente, ${nombre}. Cuando comparas la inversión, ¿lo estás midiendo contra no tener el sitio o contra una plantilla genérica? Recuerda que este sitio está pensado como un activo comercial que genera retorno y contactos desde el primer mes, no como un gasto estático. Además, manejamos facilidades de 50% de anticipo y 50% al entregar.`;
    }
  },
  {
    id: 's-obj-2',
    categoria: 'objeciones',
    categoriaLabel: 'Objeciones',
    titulo: 'Objeción: "Déjame pensarlo y te aviso"',
    fase: 'Fase 4: Manejo de Objeciones',
    generarTexto: (lead) => {
      const nombre = (lead?.contacto || 'Estimado').split(' ')[0];
      return `Totalmente comprensible, ${nombre}. Normalmente cuando alguien necesita pensarlo es porque le queda alguna duda sobre el proceso o sobre los tiempos de entrega. ¿Hay algún punto en particular que no te haya quedado 100% claro para aclararlo ahora?`;
    }
  },
  {
    id: 's-obj-3',
    categoria: 'objeciones',
    categoriaLabel: 'Objeciones',
    titulo: 'Objeción: "Ya tenemos diseñador / agencia"',
    fase: 'Fase 4: Manejo de Objeciones',
    generarTexto: (lead) => {
      const nombre = (lead?.contacto || 'Estimado').split(' ')[0];
      return `Me parece genial ${nombre}. La diferencia con nosotros es que no hacemos diseño decorativo: construimos arquitectura StoryBrand enfocada en captación y SEO local para que te encuentren primero a ti y no a tu competencia en Google. ¿Te gustaría que auditemos el resultado actual juntos en 10 min?`;
    }
  },
  {
    id: 's-follow-1',
    categoria: 'followup',
    categoriaLabel: 'Follow-Up 1-3-7',
    titulo: 'Protocolo Día 1: Aporte de Valor',
    fase: 'Fase 6: Follow-Up Sistemático',
    generarTexto: (lead) => {
      const nombre = (lead?.contacto || 'Estimado').split(' ')[0];
      return `¡Hola ${nombre}! Encontré este ejemplo de diseño de alta conversión en tu misma industria y pensé de inmediato en el proyecto de ${lead?.empresa}. Échale un vistazo cuando tengas un momento, la velocidad es impresionante: [Ejemplo de Proyecto]`;
    }
  },
  {
    id: 's-follow-2',
    categoria: 'followup',
    categoriaLabel: 'Follow-Up 1-3-7',
    titulo: 'Protocolo Día 3: Seguimiento Suave',
    fase: 'Fase 6: Follow-Up Sistemático',
    generarTexto: (lead) => {
      const nombre = (lead?.contacto || 'Estimado').split(' ')[0];
      return `¡Hola ${nombre}! 👋 ¿Pudiste revisar lo que conversamos y las opciones que te compartí en el portal? Quedo atento si tienes alguna pregunta.`;
    }
  },
  {
    id: 's-follow-3',
    categoria: 'followup',
    categoriaLabel: 'Follow-Up 1-3-7',
    titulo: 'Protocolo Día 7: Cierre de Cortesía / Pausa',
    fase: 'Fase 6: Follow-Up Sistemático',
    generarTexto: (lead) => {
      const nombre = (lead?.contacto || 'Estimado').split(' ')[0];
      return `Hola ${nombre}, asumo que las prioridades cambiaron por ahora y es totalmente entendible. Dejo tu propuesta en pausa para no incomodarte, y cuando sea el momento adecuado para ustedes retomamos con gusto. ¡Un fuerte abrazo y mucho éxito!`;
    }
  },
  {
    id: 's-cierre-1',
    categoria: 'cierre',
    categoriaLabel: 'Cierre & Demo',
    titulo: 'Micro-conversión: Videollamada 15 min',
    fase: 'Fase 5: Cierre & Agendamiento',
    generarTexto: (lead) => {
      const nombre = (lead?.contacto || 'Estimado').split(' ')[0];
      return `Para que veas exactamente cómo se estructuraría la web de ${lead?.empresa} y revisar los números finales, ¿te parece si hacemos una videollamada rápida de 15 minutos mañana? Tengo espacio a las 10:00 AM o a las 3:30 PM, ¿cuál te viene mejor, ${nombre}?`;
    }
  },
  {
    id: 's-cierre-2',
    categoria: 'cierre',
    categoriaLabel: 'Cierre & Demo',
    titulo: 'Activación de Contrato & Inicio Inmediato',
    fase: 'Fase 5: Cierre & Agendamiento',
    generarTexto: (lead) => {
      const nombre = (lead?.contacto || 'Estimado').split(' ')[0];
      return `¡Excelente decisión ${nombre}! 🚀 Para apartar la fecha de entrega en el sprint de 10 días, el primer paso es formalizar el contrato SOW en tu portal y coordinar el anticipo del 50%. ¿Prefieres realizarlo vía transferencia bancaria o tarjeta?`;
    }
  }
];

// Semilla con los contactos y conversaciones reales de WhatsApp Web del usuario
const SEED_CRM_LEADS = [];

export default function CrmPortalModule({ onConvertToPresupuesto, onOpenContrato, onOpenPrd }) {
  // Persistencia local resiliente: Si recargas (F5), se lee de localStorage
  const [leads, setLeads] = useState(() => {
    try {
      const cached = getStoredCrmLeads();
      if (Array.isArray(cached) && cached.length > 0) return cached;
    } catch (e) {
      console.warn('Error leyendo leads de CRM:', e);
    }
    return SEED_CRM_LEADS;
  });

  const [loading, setLoading] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState(() => {
    return (typeof window !== 'undefined' && localStorage.getItem('goglite_crm_country')) || 'ALL';
  });
  const [searchTerm, setSearchTerm] = useState('');
  
  // Filtro de Estado Operativo: 'activos' (por defecto) | 'archivados' | 'todos'
  const [archiveFilter, setArchiveFilter] = useState(() => {
    return (typeof window !== 'undefined' && localStorage.getItem('goglite_crm_archive_filter')) || 'activos';
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('goglite_crm_archive_filter', archiveFilter);
    }
  }, [archiveFilter]);
  
  const [activeTab, setActiveTab] = useState(() => {
    return (typeof window !== 'undefined' && localStorage.getItem('goglite_crm_active_tab')) || 'kanban';
  });
  
  // Guardar pestaña en localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('goglite_crm_active_tab', activeTab);
    }
  }, [activeTab]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('goglite_crm_country', selectedCountry);
    }
  }, [selectedCountry]);

  // Sincronizar automáticamente CRM con presupuestos de Fase 3
  useEffect(() => {
    setLeads(prev => {
      const synced = syncCrmLeadsWithPresupuestos(prev);
      saveStoredCrmLeads(synced);
      return synced;
    });
  }, []);

  // Estados para Base de Datos & Fichas de Clientes 360°
  const [fichasFilter, setFichasFilter] = useState('todos'); // 'todos' | 'ganado' | 'negociacion' | 'scrapper' | 'manual'
  const [isImportScrapperModalOpen, setIsImportScrapperModalOpen] = useState(false);
  const [scrapperLeadsList, setScrapperLeadsList] = useState([]);
  const [selectedScrapperIds, setSelectedScrapperIds] = useState(new Set());
  const [scrapperAvailableCount, setScrapperAvailableCount] = useState(0);

  const refreshScrapperAvailableCount = () => {
    try {
      if (typeof window !== 'undefined') {
        const raw = localStorage.getItem('goglite_outbound_leads');
        const parsed = raw ? JSON.parse(raw) : [];
        setScrapperAvailableCount(parsed.length);
      }
    } catch (e) {}
  };

  useEffect(() => {
    refreshScrapperAvailableCount();
  }, []);

  const handleOpenImportScrapperModal = () => {
    try {
      const raw = localStorage.getItem('goglite_outbound_leads');
      const parsed = raw ? JSON.parse(raw) : [];
      setScrapperLeadsList(parsed);
      
      const existingPhones = new Set(leads.map(l => (l.telefono || '').replace(/\D/g, '')).filter(Boolean));
      const existingNames = new Set(leads.map(l => (l.empresa || '').toLowerCase().trim()).filter(Boolean));
      const toSelect = new Set();
      parsed.forEach(sl => {
        const cleanP = (sl.telefono || '').replace(/\D/g, '');
        const cleanN = (sl.nombreEmpresa || sl.dominio || '').toLowerCase().trim();
        if (!existingPhones.has(cleanP) && !existingNames.has(cleanN)) {
          toSelect.add(sl.id);
        }
      });
      setSelectedScrapperIds(toSelect);
    } catch (e) {
      setScrapperLeadsList([]);
    }
    setIsImportScrapperModalOpen(true);
  };

  const handleToggleSelectScrapper = (id) => {
    setSelectedScrapperIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSelectAllScrapper = (selectAll = true) => {
    if (!selectAll) {
      setSelectedScrapperIds(new Set());
      return;
    }
    const existingPhones = new Set(leads.map(l => (l.telefono || '').replace(/\D/g, '')).filter(Boolean));
    const existingNames = new Set(leads.map(l => (l.empresa || '').toLowerCase().trim()).filter(Boolean));
    const toSelect = new Set();
    scrapperLeadsList.forEach(sl => {
      const cleanP = (sl.telefono || '').replace(/\D/g, '');
      const cleanN = (sl.nombreEmpresa || sl.dominio || '').toLowerCase().trim();
      if (!existingPhones.has(cleanP) && !existingNames.has(cleanN)) {
        toSelect.add(sl.id);
      }
    });
    setSelectedScrapperIds(toSelect);
  };

  const handleExecuteImportFromScrapper = async () => {
    const toImport = scrapperLeadsList.filter(sl => selectedScrapperIds.has(sl.id));
    if (toImport.length === 0) {
      alert('Selecciona al menos un prospecto para importar.');
      return;
    }

    const newConverted = toImport.map(sl => ({
      id: 'crm-scrapper-' + (sl.id || Date.now() + '-' + Math.random().toString(36).substring(2, 6)),
      leadId: sl.id || null,
      empresa: sl.nombreEmpresa || sl.dominio || 'Negocio Scrapper',
      contacto: sl.responsable || 'Dirección Comercial',
      cargo: sl.cargo || 'Propietario / Gerente',
      email: sl.email && !sl.email.endsWith('.negocio') ? sl.email : '',
      telefono: sl.telefono || '',
      pais: sl.pais || (selectedCountry === 'ALL' ? 'SV' : selectedCountry),
      dominio: sl.sinWeb ? '' : (sl.dominio || ''),
      sinWeb: Boolean(sl.sinWeb),
      resenas: sl.resenas || 0,
      calificacion: sl.calificacion || 4.8,
      etapa: sl.estado === 'cliente' ? 'ganado' : sl.estado === 'respondio' ? 'reunion' : 'contactado',
      valorEstimado: sl.estado === 'cliente' ? 2400 : 1500,
      probabilidad: sl.estado === 'cliente' ? 100 : 35,
      fuente: `Lead Scrapper (${sl.sinWeb || sl.dominio?.startsWith('maps-') ? 'Google Maps Sin Web' : 'SERP Web'})`,
      portalToken: 'portal-' + (sl.id || Date.now()) + '-' + Math.random().toString(36).substring(2, 6),
      interacciones: [
        {
          id: 'int-scr-' + Date.now() + Math.random(),
          tipo: 'nota',
          titulo: 'Importado de Lead Scrapper Fase 1',
          detalle: `Prospecto importado desde Fase 1. ${sl.auditoria ? `Auditoría inicial con ${sl.auditoria.puntos?.length || 0} oportunidades.` : 'Prospección activa.'}`,
          fecha: new Date().toISOString().split('T')[0],
          proximoPaso: 'Primer contacto / WhatsApp consultivo',
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
      creadoEn: new Date().toISOString().split('T')[0]
    }));

    updateAndPersistLeads(prev => [...newConverted, ...prev]);

    // Guardar en backend
    for (const nl of newConverted) {
      try {
        await fetch(getBackendEndpoint('/api/crm/leads'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(nl)
        });
      } catch (e) {}
    }

    setIsImportScrapperModalOpen(false);
    setActiveTab('fichas_clientes');
    alert(`🎉 ¡${newConverted.length} prospectos importados con éxito a la Base de Datos de Clientes del CRM!`);
  };

  const [dragOverStage, setDragOverStage] = useState(null);
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);
  const [draggingLeadId, setDraggingLeadId] = useState(null);
  
  // Modal for lead details & interactions
  const [activeLeadModal, setActiveLeadModal] = useState(null);
  const [isEditingLeadModal, setIsEditingLeadModal] = useState(false);
  const [isSavingLeadEdit, setIsSavingLeadEdit] = useState(false);
  const [leadEditForm, setLeadEditForm] = useState({
    empresa: '',
    contacto: '',
    cargo: '',
    email: '',
    telefono: '',
    pais: 'SV',
    dominio: '',
    sinWeb: false,
    valorEstimado: 650,
    probabilidad: 35
  });

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
    etapa: 'contactado',
    notasIniciales: ''
  });

  // Portal preview state
  const [selectedPortalLeadId, setSelectedPortalLeadId] = useState(null);
  const [portalData, setPortalData] = useState(null);
  const [portalCopied, setPortalCopied] = useState(false);

  // WhatsApp CRM State
  const [selectedWaLeadId, setSelectedWaLeadId] = useState(() => {
    return (typeof window !== 'undefined' && localStorage.getItem('goglite_crm_selected_wa_id')) || null;
  });
  
  useEffect(() => {
    if (typeof window !== 'undefined' && selectedWaLeadId) {
      localStorage.setItem('goglite_crm_selected_wa_id', selectedWaLeadId);
    }
  }, [selectedWaLeadId]);

  const [waSearchTerm, setWaSearchTerm] = useState('');
  const [waTemperatureFilter, setWaTemperatureFilter] = useState('ALL'); // 'ALL' | 'caliente' | 'tibio' | 'frio'
  const [waNotice, setWaNotice] = useState(null);

  // Estados de Síntesis Ejecutiva & Radar Comercial
  const [executiveSummaryInput, setExecutiveSummaryInput] = useState('');
  const [proximoPasoInput, setProximoPasoInput] = useState('');
  const [fechaProximoPasoInput, setFechaProximoPasoInput] = useState('');
  const [requerimientosInput, setRequerimientosInput] = useState('');
  const [objecionesInput, setObjecionesInput] = useState('');
  const [nuevaNotaInput, setNuevaNotaInput] = useState('');

  // Sincronizar inputs de síntesis ejecutiva cuando cambia el lead seleccionado
  useEffect(() => {
    const cur = leads.find(l => l.id === selectedWaLeadId) || leads[0];
    if (cur) {
      setExecutiveSummaryInput(cur.whatsappData?.resumenEjecutivo || '');
      setProximoPasoInput(cur.whatsappData?.proximoPaso || '');
      setFechaProximoPasoInput(cur.whatsappData?.fechaProximoPaso || '');
      setRequerimientosInput(cur.whatsappData?.requerimientos || '');
      setObjecionesInput(cur.whatsappData?.objeciones || '');
    }
  }, [selectedWaLeadId, leads]);

  const handleSaveExecutiveBrief = async (leadId, updates) => {
    const now = new Date();
    const timeStr = `${now.getDate()} ${['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'][now.getMonth()]} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    
    updateAndPersistLeads(prev => prev.map(l => {
      if (l.id !== leadId) return l;
      const currentWa = l.whatsappData || {};
      return {
        ...l,
        whatsappData: {
          ...currentWa,
          ...updates,
          fechaResumen: timeStr
        }
      };
    }));
    setWaNotice('✓ Ficha ejecutiva guardada correctamente');
    setTimeout(() => setWaNotice(null), 3000);

    try {
      await fetch(getBackendEndpoint(`/api/crm/leads/${leadId}/whatsapp-meta`), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...updates, fechaResumen: timeStr })
      });
    } catch (e) {}
  };

  const handleAddQuickNote = async (leadId) => {
    if (!nuevaNotaInput.trim()) return;
    const noteText = nuevaNotaInput.trim();
    const now = new Date();
    const timeStr = `${now.getDate()} ${['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'][now.getMonth()]} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    
    const newNote = {
      id: 'nota-' + Date.now(),
      tipo: 'whatsapp',
      titulo: 'Nota de Estatus WhatsApp',
      detalle: noteText,
      fecha: timeStr
    };

    updateAndPersistLeads(prev => prev.map(l => {
      if (l.id !== leadId) return l;
      const interacciones = Array.isArray(l.interacciones) ? l.interacciones : [];
      return {
        ...l,
        interacciones: [newNote, ...interacciones]
      };
    }));

    setNuevaNotaInput('');
    setWaNotice('✓ Hito registrado en la bitácora');
    setTimeout(() => setWaNotice(null), 2500);
  };

  // Estados de WhatsApp Multi-Sesión Real (SV & DO)
  const [waSessions, setWaSessions] = useState({
    SV: { country: 'SV', label: 'El Salvador (🇸🇻)', prefix: '+503', status: 'disconnected', qrCode: null, phoneNumber: null },
    DO: { country: 'DO', label: 'Rep. Dominicana (🇩🇴)', prefix: '+1', status: 'disconnected', qrCode: null, phoneNumber: null }
  });
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [selectedQrCountry, setSelectedQrCountry] = useState('SV');
  const [isConnectingSession, setIsConnectingSession] = useState(false);
  const [selectedSendingLine, setSelectedSendingLine] = useState('SV');
  const [isSendingRealMsg, setIsSendingRealMsg] = useState(false);
  const [isNewChatModalOpen, setIsNewChatModalOpen] = useState(false);
  const [newChatForm, setNewChatForm] = useState({
    telefono: '',
    contacto: '',
    empresa: '',
    pais: 'DO'
  });

  const [backendOfflineNotice, setBackendOfflineNotice] = useState(null);

  const CLOUD_API_URL = import.meta.env.VITE_API_URL || 'https://goglite-agency.vercel.app';

  // Helper para resolver URL del backend (local o producción en la nube)
  const getBackendEndpoint = (endpoint) => {
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    if (typeof window !== 'undefined') {
      if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        return `http://localhost:3001${cleanEndpoint}`;
      }
    }
    return `${CLOUD_API_URL}${cleanEndpoint}`;
  };

  // Polling de sesiones de WhatsApp (cada 5s normal, cada 2s con modal abierto)
  useEffect(() => {
    let isMounted = true;
    const fetchSessions = async () => {
      try {
        let res;
        try {
          res = await fetch(getBackendEndpoint('/api/whatsapp/sessions'));
        } catch (localErr) {
          res = await fetch('http://localhost:3001/api/whatsapp/sessions');
        }

        if (res && res.ok) {
          const data = await res.json();
          if (isMounted) {
            setWaSessions(data);
            setBackendOfflineNotice(null);
          }
        }
      } catch (e) {
        if (isMounted && isQrModalOpen) {
          setBackendOfflineNotice('El servidor Node.js de WhatsApp no responde en puerto 3001. Para conectar WhatsApp Web real debes tener "npm run dev" activo en tu máquina.');
        }
      }
    };

    fetchSessions();
    const interval = setInterval(fetchSessions, isQrModalOpen ? 2000 : 5000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [isQrModalOpen]);

  // Helper para persistir leads tanto en localStorage como en Firestore Cloud
  const updateAndPersistLeads = (updater) => {
    setLeads(prev => {
      const nextLeads = typeof updater === 'function' ? updater(prev) : updater;
      saveStoredCrmLeads(nextLeads);
      if (Array.isArray(nextLeads)) {
        nextLeads.forEach(lead => {
          if (lead && lead.id) {
            saveCrmLeadCloud(lead).catch(() => {});
          }
        });
      }
      return nextLeads;
    });
  };

  // Fetch leads de API y Firestore en tiempo real (Cloud-First + SSE + Listeners)
  useEffect(() => {
    fetchCrmLeads();

    // Listener en tiempo real desde Firestore Cloud
    const unsubscribeCloud = subscribeCrmLeadsCloud((cloudLeads) => {
      if (Array.isArray(cloudLeads) && cloudLeads.length > 0) {
        setLeads(prev => {
          const map = new Map(prev.map(l => [l.id, l]));
          cloudLeads.forEach(cl => {
            if (cl?.id) {
              map.set(cl.id, { ...(map.get(cl.id) || {}), ...cl });
            }
          });
          const merged = syncCrmLeadsWithPresupuestos(Array.from(map.values()));
          saveStoredCrmLeads(merged);
          return merged;
        });
      }
    });

    const handleRealtimeCrmUpdate = (e) => {
      if (e.detail && typeof e.detail === 'object') {
        const item = e.detail;
        setLeads(prev => {
          const idx = prev.findIndex(l => l.id === item.id);
          let updated;
          if (idx !== -1) {
            updated = [...prev];
            updated[idx] = { ...updated[idx], ...item };
          } else {
            updated = [item, ...prev];
          }
          saveStoredCrmLeads(updated);
          if (item?.id) saveCrmLeadCloud(item).catch(() => {});
          return updated;
        });
      } else {
        fetchCrmLeads();
      }
    };

    window.addEventListener('goglite_crm_updated', handleRealtimeCrmUpdate);
    return () => {
      unsubscribeCloud();
      window.removeEventListener('goglite_crm_updated', handleRealtimeCrmUpdate);
    };
  }, []);

  const fetchCrmLeads = async () => {
    try {
      setLoading(true);
      let apiData = null;
      try {
        const res = await apiClient.get('/api/crm/leads');
        if (res.ok) {
          apiData = await res.json();
        }
      } catch (errApi) {
        // Ignorar si API local está offline
      }

      const cloudLeads = await getCrmLeadsCloud();
      const mergedMap = new Map();

      // 1. Memoria local previa
      const local = getStoredCrmLeads();
      if (Array.isArray(local)) {
        local.forEach(l => { if (l?.id) mergedMap.set(l.id, l); });
      }
      // 2. API Backend
      if (Array.isArray(apiData)) {
        apiData.forEach(l => { if (l?.id) mergedMap.set(l.id, { ...(mergedMap.get(l.id) || {}), ...l }); });
      }
      // 3. Firestore Nube (Máxima autoridad en producción)
      if (Array.isArray(cloudLeads)) {
        cloudLeads.forEach(l => { if (l?.id) mergedMap.set(l.id, { ...(mergedMap.get(l.id) || {}), ...l }); });
      }

      const finalLeads = syncCrmLeadsWithPresupuestos(Array.from(mergedMap.values()));
      if (finalLeads.length > 0) {
        setLeads(finalLeads);
        saveStoredCrmLeads(finalLeads);
        // Asegurar que los leads locales estén respaldados en Firestore Cloud
        const cloudIds = new Set((cloudLeads || []).map(cl => cl?.id));
        finalLeads.forEach(fl => {
          if (fl?.id && !cloudIds.has(fl.id)) {
            saveCrmLeadCloud(fl).catch(() => {});
          }
        });
        if (!selectedPortalLeadId) setSelectedPortalLeadId(finalLeads[0].id);
        if (!selectedWaLeadId) setSelectedWaLeadId(finalLeads[0].id);
      } else if (SEED_CRM_LEADS.length > 0) {
        updateAndPersistLeads(SEED_CRM_LEADS);
      }
    } catch (err) {
      console.warn('Error sincronizando CRM leads:', err);
    } finally {
      setLoading(false);
    }
  };

  // Archivar / Desarchivar Lead con persistencia inmediata en Local, Firestore Cloud y Backend
  const handleToggleArchiveLead = async (leadId, nuevoEstadoArchivado, motivo = 'manual', e) => {
    if (e) e.stopPropagation();

    const nowIso = new Date().toISOString();
    const nowFormatted = new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });

    updateAndPersistLeads(prev => prev.map(l => {
      if (l.id === leadId) {
        return {
          ...l,
          archivado: nuevoEstadoArchivado,
          fechaArchivado: nuevoEstadoArchivado ? nowIso : null,
          fechaArchivadoFormateada: nuevoEstadoArchivado ? nowFormatted : null,
          motivoArchivado: nuevoEstadoArchivado ? motivo : null,
          actualizadoEn: nowIso.split('T')[0]
        };
      }
      return l;
    }));

    if (activeLeadModal && activeLeadModal.id === leadId) {
      setActiveLeadModal(prev => ({
        ...prev,
        archivado: nuevoEstadoArchivado,
        fechaArchivado: nuevoEstadoArchivado ? nowIso : null,
        fechaArchivadoFormateada: nuevoEstadoArchivado ? nowFormatted : null,
        motivoArchivado: nuevoEstadoArchivado ? motivo : null
      }));
    }

    try {
      await fetch(getBackendEndpoint(`/api/crm/leads/${leadId}`), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          archivado: nuevoEstadoArchivado,
          fechaArchivado: nuevoEstadoArchivado ? nowIso : null,
          fechaArchivadoFormateada: nuevoEstadoArchivado ? nowFormatted : null,
          motivoArchivado: nuevoEstadoArchivado ? motivo : null
        })
      });
    } catch (err) {
      console.warn('Archivado guardado localmente (API offline):', err);
    }
  };

  // Delete Lead con confirmación y persistencia inmediata en la nube y local
  const handleDeleteLead = async (leadId, empresaNombre, e) => {
    if (e) e.stopPropagation();
    if (!window.confirm(`¿Estás seguro de que deseas eliminar al lead "${empresaNombre || leadId}" del CRM?`)) {
      return;
    }

    // 1. Eliminar de inmediato en estado local y localStorage
    updateAndPersistLeads(prev => prev.filter(l => l.id !== leadId));
    deleteCrmLeadCloud(leadId).catch(() => {});

    // Si estaba seleccionado en portal o whatsapp, cambiar la selección
    if (selectedPortalLeadId === leadId) setSelectedPortalLeadId(null);
    if (selectedWaLeadId === leadId) setSelectedWaLeadId(null);
    if (activeLeadModal?.id === leadId) setActiveLeadModal(null);

    // 2. Sincronizar eliminación con backend si está disponible
    try {
      await fetch(getBackendEndpoint(`/api/crm/leads/${leadId}`), {
        method: 'DELETE'
      });
    } catch (err) {
      console.warn('Eliminación guardada localmente (API offline):', err);
    }
  };

  // WhatsApp CRM Handlers con persistencia inmediata
  const handleSendWaMessage = async (e) => {
    if (e) e.preventDefault();
    if (!selectedWaLeadId || !waMessageInput.trim()) return;

    const texto = waMessageInput.trim();
    const emisor = waRole;
    const now = new Date();
    const timeStr = `${now.getDate()} ${['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'][now.getMonth()]} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const nuevoMsg = {
      id: 'wa-msg-' + Date.now(),
      emisor,
      texto,
      fechaHora: timeStr,
      leido: true
    };

    // 1. Guardar de inmediato en memoria y localStorage
    updateAndPersistLeads(prev => prev.map(l => {
      if (l.id === selectedWaLeadId) {
        const wa = l.whatsappData || { mensajes: [] };
        return {
          ...l,
          whatsappData: {
            ...wa,
            ultimoMensajeFecha: 'Hoy',
            mensajes: [...(wa.mensajes || []), nuevoMsg]
          }
        };
      }
      return l;
    }));

    setWaMessageInput('');
    setWaNotice('Mensaje guardado en CRM');
    setTimeout(() => setWaNotice(null), 3000);

    // 2. Sincronizar en segundo plano con el backend
    try {
      await fetch(`/api/crm/leads/${selectedWaLeadId}/whatsapp-message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emisor, texto })
      });
    } catch (err) {
      console.warn('Mensaje guardado localmente (Backend offline):', err);
    }
  };

  const handleOpenRealWhatsApp = (lead, textOverride = null) => {
    if (!lead) return;
    const cleanPhone = (lead.whatsappData?.telefono || lead.telefono || '').replace(/[^\d]/g, '');
    const textToSend = textOverride !== null ? textOverride : (waMessageInput || '');
    const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(textToSend)}`;
    window.open(url, '_blank');
  };

  const handleUpdateWaMeta = async (leadId, metaUpdate) => {
    // 1. Guardar de inmediato en memoria y localStorage
    updateAndPersistLeads(prev => prev.map(l => {
      if (l.id === leadId) {
        return {
          ...l,
          etapa: metaUpdate.etapa !== undefined ? metaUpdate.etapa : l.etapa,
          whatsappData: {
            ...(l.whatsappData || {}),
            ...metaUpdate
          }
        };
      }
      return l;
    }));

    // 2. Sincronizar en segundo plano
    try {
      await fetch(`/api/crm/leads/${leadId}/whatsapp-meta`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(metaUpdate)
      });
    } catch (err) {
      console.warn('Metadatos guardados localmente (Backend offline):', err);
    }
  };

  const handleInsertScript = (scriptText) => {
    setWaMessageInput(scriptText);
    setWaNotice('Script insertado en el compositor');
    setTimeout(() => setWaNotice(null), 2500);
  };

  const handleDirectLaunchScript = async (lead, scriptText) => {
    if (!lead) return;
    handleOpenRealWhatsApp(lead, scriptText);

    const now = new Date();
    const timeStr = `${now.getDate()} ${['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'][now.getMonth()]} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const nuevoMsg = {
      id: 'wa-msg-' + Date.now(),
      emisor: 'agencia',
      texto: scriptText,
      fechaHora: timeStr,
      leido: true
    };

    updateAndPersistLeads(prev => prev.map(l => {
      if (l.id === lead.id) {
        const wa = l.whatsappData || { mensajes: [] };
        return {
          ...l,
          whatsappData: {
            ...wa,
            ultimoMensajeFecha: 'Hoy',
            mensajes: [...(wa.mensajes || []), nuevoMsg]
          }
        };
      }
      return l;
    }));

    setWaNotice('Mensaje lanzado a wa.me y guardado en CRM');
    setTimeout(() => setWaNotice(null), 3000);

    try {
      await fetch(`/api/crm/leads/${lead.id}/whatsapp-message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emisor: 'agencia', texto: scriptText })
      });
    } catch (err) {
      console.warn('Lanzamiento guardado localmente:', err);
    }
  };

  // WhatsApp Multi-Sesión Real: Conectar, Desconectar y Enviar
  const handleStartSession = async (country) => {
    setIsConnectingSession(true);
    setWaSessions(prev => ({
      ...prev,
      [country]: { ...prev[country], status: 'connecting', qrCode: null }
    }));
    try {
      let res;
      try {
        res = await fetch(getBackendEndpoint(`/api/whatsapp/sessions/${country}/connect`), { method: 'POST' });
      } catch (netErr) {
        res = await fetch(`http://localhost:3001/api/whatsapp/sessions/${country}/connect`, { method: 'POST' });
      }

      if (res && res.ok) {
        const data = await res.json();
        setWaSessions(prev => ({
          ...prev,
          [country]: { ...prev[country], ...data }
        }));
        setBackendOfflineNotice(null);
      } else {
        throw new Error('Servidor no disponible');
      }
    } catch (e) {
      console.warn('Error iniciando sesión WhatsApp:', e);
      setBackendOfflineNotice('El servidor de WhatsApp no está accesible en puerto 3001. Para vincular WhatsApp Web real debes tener "npm run dev" ejecutándose en tu computadora.');
    } finally {
      setIsConnectingSession(false);
    }
  };

  const handleDisconnectSession = async (country) => {
    if (!confirm(`¿Deseas desvincular la línea de WhatsApp para ${country === 'SV' ? 'El Salvador' : 'Rep. Dominicana'}?`)) return;
    try {
      let res;
      try {
        res = await fetch(getBackendEndpoint(`/api/whatsapp/sessions/${country}`), { method: 'DELETE' });
      } catch (netErr) {
        res = await fetch(`http://localhost:3001/api/whatsapp/sessions/${country}`, { method: 'DELETE' });
      }
      setWaSessions(prev => ({
        ...prev,
        [country]: { ...prev[country], status: 'disconnected', qrCode: null, phoneNumber: null }
      }));
    } catch (e) {
      console.warn('Error desconectando sesión:', e);
    }
  };

  const handleSendRealWhatsAppViaLine = async (lead, texto, lineCountry) => {
    if (!lead || !texto.trim()) return;
    const cleanPhone = (lead.whatsappData?.telefono || lead.telefono || '').replace(/[^\d]/g, '');
    if (!cleanPhone) {
      alert('Este prospecto no tiene número de teléfono registrado');
      return;
    }

    const session = waSessions[lineCountry];
    if (!session || session.status !== 'connected') {
      alert(`La línea de ${lineCountry === 'SV' ? 'El Salvador 🇸🇻' : 'Rep. Dominicana 🇩🇴'} no está vinculada. Vamos a abrir el modal de vinculación para escanear el código QR.`);
      setSelectedQrCountry(lineCountry);
      setIsQrModalOpen(true);
      return;
    }

    setIsSendingRealMsg(true);
    try {
      let res;
      try {
        res = await fetch(getBackendEndpoint(`/api/whatsapp/sessions/${lineCountry}/send`), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ telefono: cleanPhone, texto })
        });
      } catch (netErr) {
        res = await fetch(`http://localhost:3001/api/whatsapp/sessions/${lineCountry}/send`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ telefono: cleanPhone, texto })
        });
      }

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Fallo al enviar mensaje');
      }

      // Guardar en bitácora local inmediata
      const now = new Date();
      const timeStr = `${now.getDate()} ${['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'][now.getMonth()]} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      const nuevoMsg = {
        id: 'wa-msg-real-' + Date.now(),
        emisor: 'agencia',
        texto,
        fechaHora: timeStr,
        leido: true,
        origen: `whatsapp_real_${lineCountry}`
      };

      updateAndPersistLeads(prev => prev.map(l => {
        if (l.id === lead.id) {
          const wa = l.whatsappData || { mensajes: [] };
          return {
            ...l,
            whatsappData: {
              ...wa,
              ultimoMensajeFecha: 'Hoy',
              mensajes: [...(wa.mensajes || []), nuevoMsg]
            }
          };
        }
        return l;
      }));

      setWaMessageInput('');
      setWaNotice(`✅ Mensaje enviado exitosamente vía WhatsApp Real (${lineCountry})`);
      setTimeout(() => setWaNotice(null), 4000);

      // Sincronizar en backend
      fetch(`/api/crm/leads/${lead.id}/whatsapp-message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emisor: 'agencia', texto, origen: `whatsapp_real_${lineCountry}` })
      }).catch(() => {});

    } catch (err) {
      alert('Error enviando mensaje por WhatsApp Real: ' + err.message);
    } finally {
      setIsSendingRealMsg(false);
    }
  };

  // Iniciar nuevo chat real con cualquier número
  const handleStartNewRealChat = (e) => {
    e.preventDefault();
    if (!newChatForm.telefono.trim()) return;

    let cleanPhone = newChatForm.telefono.trim().replace(/[^\d+]/g, '');
    const defaultCountry = waSessions.DO?.status === 'connected' ? 'DO' : 'SV';
    const pais = newChatForm.pais || defaultCountry;

    const newLead = {
      id: 'lead-real-' + Date.now(),
      contacto: newChatForm.contacto.trim() || `Contacto ${cleanPhone}`,
      empresa: newChatForm.empresa.trim() || `WhatsApp (${cleanPhone})`,
      telefono: cleanPhone,
      pais,
      etapa: 'nuevo',
      valorEstimado: 0,
      createdAt: new Date().toISOString(),
      whatsappData: {
        telefono: cleanPhone,
        temperatura: 'caliente',
        estadoSeguimiento: 'primer_contacto',
        ultimoMensajeFecha: 'Ahora',
        mensajes: []
      }
    };

    updateAndPersistLeads(prev => [newLead, ...prev]);
    setSelectedWaLeadId(newLead.id);
    setSelectedSendingLine(pais);
    setIsNewChatModalOpen(false);
    setNewChatForm({ telefono: '', contacto: '', empresa: '', pais: 'DO' });
    setWaNotice(`Chat iniciado con ${newLead.contacto}`);
    setTimeout(() => setWaNotice(null), 3000);
  };

  // Limpiar prospectos simulados iniciales y sincronizar con contactos reales
  const handleClearMockLeads = async () => {
    if (!confirm('¿Deseas restablecer y dejar únicamente tus contactos reales de WhatsApp?')) return;
    
    // IDs de mockups legacy a filtrar
    const legacyMockPatterns = ['crm-lead-1', 'crm-lead-2', 'crm-lead-3', 'crm-lead-4', 'crm-lead-5', '1791605700142', '1791605700359', 'lead-sv-001', 'lead-do-002', 'lead-sv-003'];
    
    try {
      // 1. Intentar consultar leads frescos del backend
      let freshData = null;
      try {
        const res = await fetch(getBackendEndpoint('/api/crm/leads'));
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) freshData = data;
        }
      } catch (err) {}

      if (freshData && freshData.length > 0) {
        updateAndPersistLeads(freshData);
        setSelectedWaLeadId(freshData[0].id);
      } else {
        updateAndPersistLeads(prev => {
          const filtered = prev.filter(l => !legacyMockPatterns.some(pattern => (l.id || '').includes(pattern) || (l.leadId || '').includes(pattern)));
          const finalLeads = filtered.length > 0 ? filtered : SEED_CRM_LEADS;
          setSelectedWaLeadId(finalLeads[0].id);
          return finalLeads;
        });
      }
    } catch (e) {
      updateAndPersistLeads(SEED_CRM_LEADS);
      setSelectedWaLeadId(SEED_CRM_LEADS[0].id);
    }
    
    setWaNotice('✅ Bandeja sincronizada con tus contactos reales');
    setTimeout(() => setWaNotice(null), 3000);
  };

  // Change lead stage con persistencia inmediata
  const handleStageChange = async (leadId, newStage) => {
    // 1. Persistencia inmediata local
    updateAndPersistLeads(prev => prev.map(l => {
      if (l.id === leadId) {
        return { ...l, etapa: newStage };
      }
      return l;
    }));
    if (activeLeadModal && activeLeadModal.id === leadId) {
      setActiveLeadModal(prev => ({ ...prev, etapa: newStage }));
    }

    // 2. Sincronizar en segundo plano con el backend
    try {
      const res = await fetch(`/api/crm/leads/${leadId}/stage`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ etapa: newStage })
      });
      if (res.ok) {
        const updated = await res.json();
        updateAndPersistLeads(prev => prev.map(l => l.id === leadId ? updated : l));
        if (activeLeadModal && activeLeadModal.id === leadId) {
          setActiveLeadModal(updated);
        }
      }
    } catch (err) {
      console.warn('Etapa guardada localmente (backend offline):', err);
    }
  };

  // Iniciar modo edición en la Ficha 360°
  const startEditingLead = (lead) => {
    if (!lead) return;
    setLeadEditForm({
      empresa: lead.empresa || '',
      contacto: lead.contacto || '',
      cargo: lead.cargo || 'Representante / Propietario',
      email: lead.email || '',
      telefono: lead.telefono || lead.whatsappData?.telefono || '',
      pais: lead.pais || 'SV',
      dominio: (lead.sinWeb || lead.origenMaps || lead.dominio?.startsWith('maps-')) ? '' : (lead.dominio || ''),
      sinWeb: Boolean(lead.sinWeb || lead.origenMaps || lead.dominio?.startsWith('maps-')),
      valorEstimado: lead.valorEstimado || 650,
      probabilidad: lead.probabilidad || 35
    });
    setIsEditingLeadModal(true);
  };

  // Guardar cambios editados en la Ficha 360° y sincronizar con Firestore y Neon
  const handleSaveLeadEdit = async () => {
    if (!activeLeadModal) return;
    setIsSavingLeadEdit(true);
    try {
      const cleanDominio = leadEditForm.sinWeb ? '' : leadEditForm.dominio.trim().replace(/^https?:\/\//i, '').replace(/\/$/, '');
      const updatedFields = {
        empresa: leadEditForm.empresa.trim() || activeLeadModal.empresa,
        contacto: leadEditForm.contacto.trim(),
        cargo: leadEditForm.cargo.trim(),
        email: leadEditForm.email.trim(),
        telefono: leadEditForm.telefono.trim(),
        pais: leadEditForm.pais,
        dominio: cleanDominio,
        sinWeb: leadEditForm.sinWeb,
        valorEstimado: Number(leadEditForm.valorEstimado) || 0,
        probabilidad: Number(leadEditForm.probabilidad) || 35,
        actualizadoEn: new Date().toISOString()
      };

      const updatedLead = {
        ...activeLeadModal,
        ...updatedFields
      };

      // 1. Actualizar estado local
      setActiveLeadModal(updatedLead);
      updateAndPersistLeads(prev => prev.map(l => l.id === activeLeadModal.id ? updatedLead : l));

      // 2. Persistir en Firestore (Nube)
      await saveCrmLeadCloud(updatedLead).catch(err => {
        console.warn('[CRM] Error guardando en Firestore:', err.message);
      });

      // 3. Persistir en backend API (Neon / Vercel)
      try {
        await fetch(getBackendEndpoint(`/api/crm/leads/${activeLeadModal.id}`), {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedFields)
        });
      } catch (apiErr) {
        console.warn('[CRM] Error actualizando lead en API:', apiErr.message);
      }

      setWaNotice('✓ Ficha 360° actualizada exitosamente en la nube');
      setTimeout(() => setWaNotice(null), 4000);
      setIsEditingLeadModal(false);
    } catch (err) {
      console.error('Error guardando edición de lead:', err);
      alert('Error guardando los cambios del lead: ' + err.message);
    } finally {
      setIsSavingLeadEdit(false);
    }
  };

  // Add interaction con persistencia inmediata
  const handleAddInteraction = async (e) => {
    e.preventDefault();
    if (!activeLeadModal || !interactionForm.titulo) return;

    const nuevaInteraccion = {
      id: 'inter-' + Date.now(),
      fecha: new Date().toISOString(),
      ...interactionForm
    };

    // 1. Persistencia inmediata local
    updateAndPersistLeads(prev => prev.map(l => {
      if (l.id === activeLeadModal.id) {
        const interacciones = l.interacciones || [];
        return {
          ...l,
          interacciones: [nuevaInteraccion, ...interacciones]
        };
      }
      return l;
    }));
    setActiveLeadModal(prev => ({
      ...prev,
      interacciones: [nuevaInteraccion, ...(prev.interacciones || [])]
    }));

    setInteractionForm({
      tipo: 'whatsapp',
      titulo: '',
      detalle: '',
      proximoPaso: '',
      fechaProximoPaso: ''
    });

    // 2. Sincronizar en segundo plano
    try {
      const res = await fetch(`/api/crm/leads/${activeLeadModal.id}/interactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(interactionForm)
      });
      if (res.ok) {
        const updated = await res.json();
        updateAndPersistLeads(prev => prev.map(l => l.id === activeLeadModal.id ? updated : l));
        setActiveLeadModal(updated);
      }
    } catch (err) {
      console.warn('Interacción guardada localmente (backend offline):', err);
    }
  };

  // Create new lead con persistencia inmediata
  const handleCreateLead = async (e) => {
    e.preventDefault();
    const tempLead = {
      id: 'lead-local-' + Date.now(),
      ...newLeadForm,
      fuente: 'Registro Manual',
      portalToken: 'portal-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      probabilidad: newLeadForm.etapa === 'ganado' ? 100 : newLeadForm.etapa === 'negociacion' ? 70 : 35,
      interacciones: [
        {
          id: 'int-' + Date.now(),
          tipo: 'nota',
          titulo: 'Ficha Creada Manualmente en CRM',
          detalle: newLeadForm.notasIniciales || 'Registro manual de cliente en el sistema.',
          fecha: new Date().toISOString().split('T')[0],
          proximoPaso: newLeadForm.etapa === 'ganado' ? 'Iniciar Onboarding y Contrato SOW' : 'Seguimiento comercial',
          fechaProximoPaso: ''
        }
      ],
      whatsappData: {
        telefono: newLeadForm.telefono,
        mensajes: [],
        ultimoMensajeFecha: 'Ahora',
        temperatura: newLeadForm.etapa === 'ganado' ? 'caliente' : 'tibio',
        estadoSeguimiento: newLeadForm.etapa === 'ganado' ? 'cerrado_ganado' : 'primer_contacto'
      },
      createdAt: new Date().toISOString(),
      creadoEn: new Date().toISOString().split('T')[0]
    };

    // 1. Persistencia local inmediata
    updateAndPersistLeads(prev => [tempLead, ...prev]);
    setCreateLeadModalOpen(false);
    setNewLeadForm({
      empresa: '',
      contacto: '',
      cargo: '',
      email: '',
      telefono: '',
      pais: selectedCountry === 'ALL' ? 'SV' : selectedCountry,
      dominio: '',
      valorEstimado: 1500,
      etapa: 'contactado',
      notasIniciales: ''
    });

    // 2. Sincronizar en segundo plano
    try {
      const res = await fetch('/api/crm/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tempLead)
      });
      if (res.ok) {
        const created = await res.json();
        updateAndPersistLeads(prev => prev.map(l => l.id === tempLead.id ? created : l));
      }
    } catch (err) {
      console.warn('Lead guardado localmente (backend offline):', err);
    }
  };

  // Copy clean portal link and sync to Firestore
  const handleCopyPortalLink = (token, leadObj = null) => {
    const cleanToken = token || leadObj?.portalToken || (leadObj ? `portal-${leadObj.id}` : 'portal-vip');
    const targetLead = leadObj || activeLeadModal;
    if (targetLead) {
      try {
        savePortalCloud(cleanToken, {
          token: cleanToken,
          lead: targetLead,
          portalConfig: targetLead.portalConfig || {}
        }).catch(() => {});
      } catch (e) {}
    }
    const url = `${window.location.origin}/portal/${cleanToken}`;
    navigator.clipboard.writeText(url);
    setPortalCopied(true);
    setTimeout(() => setPortalCopied(false), 2000);
  };

  // Conteo global de estado de archivado
  const totalLeadsCount = leads.length;
  const archivedLeadsCount = leads.filter(l => Boolean(l.archivado)).length;
  const activeLeadsCount = totalLeadsCount - archivedLeadsCount;

  // Filter leads según país, búsqueda y estado operativo (activos vs archivados)
  const filteredLeads = leads.filter(l => {
    const isArchived = Boolean(l.archivado);
    if (archiveFilter === 'activos' && isArchived) return false;
    if (archiveFilter === 'archivados' && !isArchived) return false;

    const matchesCountry = selectedCountry === 'ALL' || l.pais === selectedCountry;
    const term = searchTerm.toLowerCase();
    const matchesSearch = !term ||
      l.empresa?.toLowerCase().includes(term) ||
      l.contacto?.toLowerCase().includes(term) ||
      l.dominio?.toLowerCase().includes(term) ||
      l.email?.toLowerCase().includes(term);
    return matchesCountry && matchesSearch;
  });

  // Lógica de Presupuesto real: solo existe cotización a partir de propuesta enviada o con ID vinculado
  const STAGES_CON_PRESUPUESTO = ['propuesta_enviada', 'propuesta', 'negociacion', 'ganado'];
  const tienePresupuesto = (lead) => {
    return STAGES_CON_PRESUPUESTO.includes(lead.etapa) || Boolean(lead.portalConfig?.presupuestoId) || Boolean(lead.presupuestoId);
  };

  // Calculate metrics: Pipeline Activo solo suma cotizaciones emitidas en negociación/propuesta
  const activePipelineLeads = leads.filter(l => !l.archivado);
  const leadsCotizadosActivos = activePipelineLeads.filter(l => ['propuesta_enviada', 'propuesta', 'negociacion'].includes(l.etapa));
  const totalPipeline = leadsCotizadosActivos.reduce((acc, l) => acc + (Number(l.presupuestoMonto || l.valorEstimado) || 0), 0);
  const totalGanado = leads.filter(l => l.etapa === 'ganado').reduce((acc, l) => acc + (Number(l.presupuestoMonto || l.valorEstimado) || 0), 0);
  const leadsGanadosCount = leads.filter(l => l.etapa === 'ganado').length;
  const tasaConversion = totalLeadsCount > 0 ? Math.round((leadsGanadosCount / totalLeadsCount) * 100) : 0;
  const leadsEnProspeccion = activePipelineLeads.filter(l => ['nuevo', 'contactado', 'reunion', 'reunion_demo'].includes(l.etapa)).length;
  const leadsEnNegociacionCount = activePipelineLeads.filter(l => ['negociacion', 'propuesta_enviada', 'propuesta'].includes(l.etapa)).length;
  const leadsDeScrapperCount = filteredLeads.filter(l => (l.fuente && l.fuente.toLowerCase().includes('scrapper')) || l.leadId || l.sinWeb).length;
  const leadsManualesCount = Math.max(0, filteredLeads.length - leadsDeScrapperCount);

  // Filtrado de Fichas de Clientes 360° (soporta píldoras y estado archivado)
  const fichasLeads = leads.filter(l => {
    if (fichasFilter === 'archivados') {
      if (!l.archivado) return false;
    } else {
      const isArchived = Boolean(l.archivado);
      if (archiveFilter === 'activos' && isArchived) return false;
      if (archiveFilter === 'archivados' && !isArchived) return false;
    }

    const matchesCountry = selectedCountry === 'ALL' || l.pais === selectedCountry;
    const term = searchTerm.toLowerCase();
    const matchesSearch = !term ||
      l.empresa?.toLowerCase().includes(term) ||
      l.contacto?.toLowerCase().includes(term) ||
      l.dominio?.toLowerCase().includes(term) ||
      l.email?.toLowerCase().includes(term);
    if (!matchesCountry || !matchesSearch) return false;

    if (fichasFilter === 'ganado') return l.etapa === 'ganado';
    if (fichasFilter === 'negociacion') return ['negociacion', 'propuesta_enviada', 'propuesta'].includes(l.etapa);
    if (fichasFilter === 'scrapper') return (l.fuente && l.fuente.toLowerCase().includes('scrapper')) || l.leadId || l.sinWeb;
    if (fichasFilter === 'manual') return !(l.fuente && l.fuente.toLowerCase().includes('scrapper')) && !l.leadId && !l.sinWeb;
    if (fichasFilter === 'archivados') return Boolean(l.archivado);
    return true; // 'todos'
  });

  // Selected lead for portal preview
  const currentPortalLead = leads.find(l => l.id === selectedPortalLeadId) || leads[0];

  return (
    <div className="flex-1 overflow-y-auto bg-[#080b11] p-6 text-slate-100 flex flex-col gap-6">
      
      {/* 1. TOP STATS BAR: 4 TARJETAS CLAVE DE PROSPECCIÓN & CRM */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Prospectos Totales */}
        <div className="p-4 rounded-xl bg-[#0e131f] border border-slate-800/80 flex items-center justify-between shadow-sm">
          <div>
            <div className="text-xs font-mono uppercase text-slate-400 font-semibold">Prospectos Totales</div>
            <div className="text-2xl font-black text-white mt-1">
              {filteredLeads.length} <span className="text-xs font-normal text-slate-400">en base</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">{leadsDeScrapperCount} de Scrapper · {leadsManualesCount} manuales</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold">
            <Users className="w-5 h-5" />
          </div>
        </div>

        {/* 2. En Negociación */}
        <div className="p-4 rounded-xl bg-[#0e131f] border border-slate-800/80 flex items-center justify-between shadow-sm">
          <div>
            <div className="text-xs font-mono uppercase text-slate-400 font-semibold">En Negociación</div>
            <div className="text-2xl font-black text-amber-400 mt-1">
              {leadsEnNegociacionCount} <span className="text-xs font-normal text-slate-400">leads</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">{leadsCotizadosActivos.length} propuestas y reuniones activas</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
            <Flame className="w-5 h-5" />
          </div>
        </div>

        {/* 3. En Prospección / Contactados */}
        <div className="p-4 rounded-xl bg-[#0e131f] border border-slate-800/80 flex items-center justify-between shadow-sm">
          <div>
            <div className="text-xs font-mono uppercase text-slate-400 font-semibold">En Prospección</div>
            <div className="text-2xl font-black text-emerald-400 mt-1">
              {leadsEnProspeccion} <span className="text-xs font-normal text-slate-400">activos</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">Seguimiento comercial y canales</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
            <MessageSquare className="w-5 h-5" />
          </div>
        </div>

        {/* 4. Tasa de Conversión */}
        <div className="p-4 rounded-xl bg-[#0e131f] border border-slate-800/80 flex items-center justify-between shadow-sm">
          <div>
            <div className="text-xs font-mono uppercase text-slate-400 font-semibold">Tasa de Conversión</div>
            <div className="text-2xl font-black text-sky-400 mt-1">
              {tasaConversion}%
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">De lead prospectado a cliente</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center font-bold">
            <TrendingUp className="w-5 h-5" />
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

          {/* Selector de Estado Operativo: Activos vs Archivados */}
          <div className="flex items-center bg-[#131926] border border-slate-800 rounded-lg p-0.5 text-xs">
            <button
              onClick={() => setArchiveFilter('activos')}
              className={`px-3 py-1 rounded-md transition-all flex items-center gap-1.5 ${
                archiveFilter === 'activos'
                  ? 'bg-orange-600 text-white font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Clientes y prospectos en seguimiento activo"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Activos</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full font-mono bg-white/20 text-white font-bold">
                {activeLeadsCount}
              </span>
            </button>
            <button
              onClick={() => setArchiveFilter('archivados')}
              className={`px-3 py-1 rounded-md transition-all flex items-center gap-1.5 ${
                archiveFilter === 'archivados'
                  ? 'bg-amber-600 text-white font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Clientes finalizados/entregados o prospectos descartados"
            >
              <Archive className="w-3.5 h-3.5" />
              <span>Archivados</span>
              {archivedLeadsCount > 0 && (
                <span className="text-[10px] px-1.5 py-0.2 rounded-full font-mono bg-amber-500/30 text-amber-200 font-bold">
                  {archivedLeadsCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setArchiveFilter('todos')}
              className={`px-2.5 py-1 rounded-md transition-all text-xs ${
                archiveFilter === 'todos'
                  ? 'bg-slate-700 text-white font-semibold'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
              title="Ver todo el universo de contactos (activos + archivados)"
            >
              Todos ({totalLeadsCount})
            </button>
          </div>
        </div>

        {/* View Switch & Action */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center bg-[#131926] border border-slate-800 rounded-lg p-0.5 text-xs">
            <button
              onClick={() => setActiveTab('kanban')}
              className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-colors ${activeTab === 'kanban' ? 'bg-slate-800 text-orange-400 font-semibold' : 'text-slate-400 hover:text-slate-200'}`}
            >
              <Kanban className="w-3.5 h-3.5" />
              <span>Kanban</span>
            </button>
            <button
              onClick={() => setActiveTab('fichas_clientes')}
              className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-colors ${activeTab === 'fichas_clientes' ? 'bg-orange-600/25 text-orange-400 border border-orange-500/40 font-semibold' : 'text-slate-400 hover:text-slate-200'}`}
            >
              <Users className="w-3.5 h-3.5 text-orange-400" />
              <span>Base de Datos & Fichas</span>
            </button>
            <button
              onClick={() => setActiveTab('tabla')}
              className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-colors ${activeTab === 'tabla' ? 'bg-slate-800 text-orange-400 font-semibold' : 'text-slate-400 hover:text-slate-200'}`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Lista</span>
            </button>
            <button
              onClick={() => setActiveTab('whatsapp_crm')}
              className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-colors ${activeTab === 'whatsapp_crm' ? 'bg-emerald-600/25 text-emerald-400 border border-emerald-500/40 font-semibold' : 'text-slate-400 hover:text-slate-200'}`}
            >
              <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
              <span>WhatsApp CRM</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleOpenImportScrapperModal}
              className="px-3 py-1.5 rounded-lg bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border border-sky-500/30 font-semibold text-xs flex items-center gap-1.5 transition-all shrink-0"
              title="Importar prospectos capturados en Fase 1 (Google Maps / SERP)"
            >
              <Download className="w-3.5 h-3.5 text-sky-400" />
              <span>📥 Importar de Scrapper</span>
              {scrapperAvailableCount > 0 && (
                <span className="text-[10px] bg-sky-500/30 text-sky-200 px-1 rounded-full font-mono font-bold">
                  {scrapperAvailableCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setCreateLeadModalOpen(true)}
              className="px-3.5 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-500 text-white font-semibold text-xs flex items-center gap-1.5 shadow-md shadow-orange-950 transition-all shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Registrar Ficha Manual</span>
            </button>
          </div>
        </div>
      </div>

      {/* Banner Informativo cuando se visualizan Clientes Archivados */}
      {archiveFilter === 'archivados' && (
        <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-200 shadow-lg">
          <div className="flex items-center gap-2.5">
            <Archive className="w-5 h-5 text-amber-400 shrink-0" />
            <div>
              <span className="font-bold text-white block sm:inline">Modo Histórico de Clientes: </span>
              <span className="text-amber-200/90">
                Visualizando registros archivados (proyectos finalizados/entregados o prospectos descartados). Están ocultos del pipeline activo diario pero conservan el 100% de contratos, facturas e historial.
              </span>
            </div>
          </div>
          <button
            onClick={() => setArchiveFilter('activos')}
            className="px-3.5 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 font-semibold text-xs border border-amber-500/40 transition-colors shrink-0 flex items-center gap-1.5 self-start sm:self-auto"
          >
            <span>← Ver Clientes Activos</span>
          </button>
        </div>
      )}

      {/* 3. MAIN CONTENT: KANBAN VERTICAL CON DRAG & DROP */}
      {activeTab === 'kanban' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-8 select-none">
          <div className="md:col-span-2 flex items-center justify-between text-xs text-slate-400 px-1">
            <span className="flex items-center gap-1.5 font-medium">
              <span>💡</span>
              <span>Puedes arrastrar las tarjetas con el ratón de una fase a otra para mover el estado del cliente.</span>
            </span>
            <span className="font-mono text-[11px] text-slate-500">
              6 Fases en Embudo Vertical
            </span>
          </div>

          {PIPELINE_STAGES.map((stage, sIdx) => {
            const stageLeads = filteredLeads.filter(l => {
              if (stage.id === 'contactado') return l.etapa === 'contactado' || l.etapa === 'nuevo' || !l.etapa;
              if (stage.id === 'reunion') return l.etapa === 'reunion' || l.etapa === 'reunion_demo';
              if (stage.id === 'propuesta_enviada') return l.etapa === 'propuesta_enviada' || l.etapa === 'propuesta';
              return l.etapa === stage.id;
            });
            const esProspeccion = ['nuevo', 'contactado', 'reunion', 'reunion_demo'].includes(stage.id);
            const stageValue = stageLeads.reduce((acc, l) => acc + (Number(l.presupuestoMonto || l.valorEstimado) || 0), 0);
            const isDropTarget = dragOverStage === stage.id;

            return (
              <div
                key={stage.id}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.dataTransfer.dropEffect = 'move';
                  if (dragOverStage !== stage.id) setDragOverStage(stage.id);
                }}
                onDragLeave={(e) => {
                  if (e.currentTarget.contains(e.relatedTarget)) return;
                  setDragOverStage(null);
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOverStage(null);
                  setDraggingLeadId(null);
                  const droppedId = e.dataTransfer.getData('text/plain');
                  if (droppedId) {
                    handleStageChange(droppedId, stage.id);
                  }
                }}
                className={`rounded-2xl border transition-all duration-200 overflow-hidden ${stage.id === 'perdido' ? 'md:col-span-2' : ''} ${
                  isDropTarget
                    ? 'bg-orange-500/10 border-orange-500 ring-2 ring-orange-500/40 shadow-xl'
                    : 'bg-[#0b0f18] border-slate-800/80 hover:border-slate-700/80'
                }`}
              >
                {/* Stage Header */}
                <div className="p-4 bg-[#0f1422] border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <span className="text-[11px] font-mono text-slate-500 font-bold">
                      {sIdx + 1}.
                    </span>
                    <span className={`w-3 h-3 rounded-full ${stage.dot} shadow-sm`}></span>
                    <h3 className="font-bold text-sm text-white tracking-tight">
                      {stage.label}
                    </h3>
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono font-semibold border border-slate-700/60">
                      {stageLeads.length} {stageLeads.length === 1 ? 'prospecto' : 'prospectos'}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      {esProspeccion ? (
                        <>
                          <span className="text-[10px] uppercase font-mono text-slate-500 font-semibold block">Fase Comercial</span>
                          <span className="text-xs font-mono font-medium text-slate-400">
                            Prospección & Contacto
                          </span>
                        </>
                      ) : stage.id === 'perdido' ? (
                        <>
                          <span className="text-[10px] uppercase font-mono text-slate-500 font-semibold block">Fase Comercial</span>
                          <span className="text-xs font-mono font-medium text-rose-400/80">
                            Sin Cierre / Pausado
                          </span>
                        </>
                      ) : (
                        <>
                          <span className="text-[10px] uppercase font-mono text-slate-500 font-semibold block">Valor Cotizado</span>
                          <span className="text-xs font-mono font-bold text-emerald-400">
                            ${stageValue.toLocaleString()} USD
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Cards Container: Tarjetas ordenadas verticalmente con ancho completo y sin cortes */}
                <div className="p-4">
                  {stageLeads.length === 0 ? (
                    <div className={`py-8 border-2 border-dashed rounded-xl text-center text-xs flex items-center justify-center gap-2 transition-colors ${
                      isDropTarget
                        ? 'border-orange-500/60 text-orange-300 bg-orange-500/5'
                        : 'border-slate-800/60 text-slate-500'
                    }`}>
                      <span>Sin prospectos en <strong>{stage.label}</strong>. Arrastra una tarjeta aquí para cambiar de fase.</span>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-3.5">
                      {stageLeads.map(lead => {
                        const isDragging = draggingLeadId === lead.id;
                        const conPresupuesto = tienePresupuesto(lead);

                        return (
                          <div
                            key={lead.id}
                            draggable={true}
                            onDragStart={(e) => {
                              e.dataTransfer.setData('text/plain', lead.id);
                              e.dataTransfer.effectAllowed = 'move';
                              setDraggingLeadId(lead.id);
                            }}
                            onDragEnd={() => {
                              setDraggingLeadId(null);
                              setDragOverStage(null);
                            }}
                            className={`p-4 rounded-xl bg-[#101524] border transition-all duration-150 shadow-md flex flex-col gap-3 cursor-grab active:cursor-grabbing hover:border-orange-500/50 hover:shadow-xl ${
                              isDragging
                                ? 'opacity-30 border-dashed border-orange-500 scale-98'
                                : 'border-slate-800'
                            }`}
                          >
                            {/* 1. Header: Empresa y País */}
                            <div className="flex items-start justify-between gap-2.5">
                              <div className="flex-1 min-w-0">
                                <h4 className="font-bold text-sm text-white leading-tight break-words">
                                  {lead.empresa}
                                </h4>
                                <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-1">
                                  <User className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                                  <span className="font-medium text-slate-300">{lead.contacto}</span>
                                  {lead.cargo && <span className="text-slate-500">· {lead.cargo}</span>}
                                </div>
                                {lead.dominio && (
                                  <div className="text-[11px] font-mono text-slate-500 mt-0.5 truncate">
                                    🌐 {lead.dominio}
                                  </div>
                                )}
                              </div>
                              <div className="shrink-0 flex items-center gap-1.5">
                                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#090d16] border border-slate-800 text-xs font-medium text-slate-300">
                                  <span>{lead.pais === 'SV' ? '🇸🇻' : '🇩🇴'}</span>
                                  <span className="text-[11px]">{lead.pais === 'SV' ? 'El Salvador' : 'Rep. Dom.'}</span>
                                </div>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    handleToggleArchiveLead(lead.id, !lead.archivado, lead.etapa === 'ganado' ? 'entregado' : lead.etapa === 'perdido' ? 'perdido' : 'manual', e);
                                  }}
                                  title={lead.archivado ? "Desarchivar cliente (reactivar en pipeline activo)" : "Archivar cliente (ocultar del pipeline activo)"}
                                  className={`p-1 rounded-lg border transition-colors ${
                                    lead.archivado
                                      ? 'bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border-amber-500/40'
                                      : 'bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border-indigo-500/20 hover:border-indigo-500/40'
                                  }`}
                                >
                                  {lead.archivado ? <ArchiveRestore className="w-3.5 h-3.5" /> : <Archive className="w-3.5 h-3.5" />}
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => handleDeleteLead(lead.id, lead.empresa, e)}
                                  title="Eliminar Lead"
                                  className="p-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 border border-rose-500/20 hover:border-rose-500/40 transition-colors"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>

                            {/* 2. Estado del Presupuesto (¡Sin precios ficticios en prospección!) */}
                            {conPresupuesto ? (
                              <div className="flex items-center justify-between p-2.5 rounded-lg bg-emerald-950/30 border border-emerald-500/30 text-xs">
                                <div className="flex items-center gap-1.5 text-emerald-300 font-semibold">
                                  <DollarSign className="w-4 h-4 text-emerald-400 shrink-0" />
                                  <span>Presupuesto Cotizado:</span>
                                  <span className="font-mono font-bold text-white text-sm">
                                    ${Number(lead.presupuestoMonto || lead.valorEstimado || 1500).toLocaleString()} USD
                                  </span>
                                </div>
                                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30">
                                  {lead.etapa === 'ganado' ? 'Firmado' : 'Propuesta'}
                                </span>
                              </div>
                            ) : (
                              <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#0a0e18] border border-slate-800/80 text-xs text-slate-400">
                                <div className="flex items-center gap-1.5">
                                  <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                                  <span>Sin presupuesto generado aún</span>
                                </div>
                                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700/60">
                                  Prospección
                                </span>
                              </div>
                            )}

                            {/* 3. Botones de Contacto Directo & Bitácora (Bien espaciados y con textos claros) */}
                            <div className="flex items-center gap-2 pt-0.5">
                              {lead.telefono ? (
                                <a
                                  href={`https://wa.me/${lead.telefono.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Hola ${lead.contacto}, un saludo desde Goglite.`)}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  title="Abrir WhatsApp"
                                  className="flex-1 py-1.5 px-2.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 flex items-center justify-center gap-1.5 text-xs font-semibold transition-colors"
                                >
                                  <MessageSquare className="w-3.5 h-3.5" />
                                  <span>WhatsApp</span>
                                </a>
                              ) : null}

                              {lead.email ? (
                                <a
                                  href={`mailto:${lead.email}?subject=Contacto desde Goglite Agencia`}
                                  title="Enviar Correo"
                                  className="flex-1 py-1.5 px-2.5 rounded-lg bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border border-sky-500/20 flex items-center justify-center gap-1.5 text-xs font-semibold transition-colors"
                                >
                                  <Mail className="w-3.5 h-3.5" />
                                  <span>Correo</span>
                                </a>
                              ) : null}

                              <button
                                onClick={() => setActiveLeadModal(lead)}
                                title="Bitácora e Interacciones"
                                className="py-1.5 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700/60 flex items-center justify-center gap-1.5 text-xs font-medium transition-colors"
                              >
                                <MessageSquare className="w-3.5 h-3.5 text-orange-400" />
                                <span>💬 {lead.interacciones?.length || 0}</span>
                              </button>
                            </div>

                            {/* 4. Selector de Etapa integrado (Ancho 100% sin desbordes de ningún botón) */}
                            <div className="flex items-center gap-2 pt-1 border-t border-slate-800/80">
                              <span className="text-[11px] font-mono text-slate-400 shrink-0">Mover etapa:</span>
                              <select
                                value={lead.etapa}
                                onChange={(e) => handleStageChange(lead.id, e.target.value)}
                                className="flex-1 text-xs bg-[#090d16] border border-slate-700/80 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-orange-500 cursor-pointer"
                              >
                                {PIPELINE_STAGES.map(s => (
                                  <option key={s.id} value={s.id}>{s.label}</option>
                                ))}
                              </select>
                            </div>

                            {/* 5. Acción Principal: Generar Presupuesto */}
                            <div className="pt-1">
                              <button
                                onClick={() => onConvertToPresupuesto && onConvertToPresupuesto(lead)}
                                className={`w-full py-2 px-3 rounded-lg font-semibold text-xs flex items-center justify-center gap-2 transition-all shadow-md ${
                                  conPresupuesto
                                    ? 'bg-slate-800 hover:bg-slate-700 text-orange-400 border border-orange-500/30'
                                    : 'bg-orange-600 hover:bg-orange-500 text-white shadow-orange-950/40'
                                }`}
                              >
                                <FileText className="w-4 h-4" />
                                <span>{conPresupuesto ? 'Ver / Modificar Presupuesto →' : 'Generar Presupuesto →'}</span>
                              </button>
                            </div>

                            {/* 6. Acceso Rápido de Archivado (Clientes Finalizados o Perdidos) */}
                            {lead.archivado ? (
                              <div className="flex items-center justify-between p-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200">
                                <div className="flex items-center gap-1.5 font-mono text-[11px] truncate">
                                  <Archive className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                                  <span className="truncate">Archivado ({lead.motivoArchivado === 'entregado' ? 'Entregado' : lead.motivoArchivado === 'perdido' ? 'Perdido' : 'Histórico'})</span>
                                </div>
                                <button
                                  type="button"
                                  onClick={(e) => handleToggleArchiveLead(lead.id, false, null, e)}
                                  className="px-2 py-0.5 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 font-semibold text-[10px] border border-amber-500/40 transition-colors shrink-0"
                                >
                                  Desarchivar
                                </button>
                              </div>
                            ) : (lead.etapa === 'ganado' || lead.etapa === 'perdido') ? (
                              <button
                                type="button"
                                onClick={(e) => handleToggleArchiveLead(lead.id, true, lead.etapa === 'ganado' ? 'entregado' : 'perdido', e)}
                                className={`w-full py-1.5 px-2.5 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                                  lead.etapa === 'ganado'
                                    ? 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                                    : 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border-rose-500/30'
                                }`}
                                title="Archivar para retirar del tablero activo y mantener el CRM limpio"
                              >
                                <Archive className="w-3.5 h-3.5" />
                                <span>{lead.etapa === 'ganado' ? '📦 Archivar Cliente Entregado' : '📦 Archivar Lead Perdido'}</span>
                              </button>
                            ) : null}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 3.1 BASE DE DATOS DE CLIENTES & FICHAS TÉCNICAS 360° */}
      {activeTab === 'fichas_clientes' && (
        <div className="space-y-5">
          {/* Header de la Base de Datos */}
          <div className="p-5 rounded-2xl bg-[#0c1017] border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-400 flex items-center justify-center font-bold shrink-0">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-white flex items-center gap-2">
                  <span>Base de Datos Centralizada de Clientes & Fichas 360°</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Expedientes detallados con histórico de interacción, diagnóstico, propuesta comercial y acceso a servicios.
                </p>
              </div>
            </div>
            <div className="text-xs font-mono text-slate-400 bg-[#121826] px-3 py-1.5 rounded-xl border border-slate-800/80 shrink-0">
              Total Fichas: <span className="text-white font-bold">{filteredLeads.length}</span>
            </div>
          </div>

          {/* Filtros por Píldoras */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-[#0c1017] border border-slate-800">
            <div className="flex flex-wrap items-center gap-1.5 text-xs">
              <span className="text-slate-500 font-mono text-[11px] mr-1">Filtrar:</span>
              <button
                onClick={() => setFichasFilter('todos')}
                className={`px-3 py-1 rounded-lg transition-all font-medium ${
                  fichasFilter === 'todos'
                    ? 'bg-orange-600 text-white font-semibold shadow-sm'
                    : 'bg-slate-800/80 text-slate-400 hover:text-slate-200'
                }`}
              >
                Todos ({filteredLeads.length})
              </button>
              <button
                onClick={() => setFichasFilter('ganado')}
                className={`px-3 py-1 rounded-lg transition-all font-medium flex items-center gap-1.5 ${
                  fichasFilter === 'ganado'
                    ? 'bg-emerald-600 text-white font-semibold shadow-sm'
                    : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                }`}
              >
                <Crown className="w-3 h-3" />
                <span>👑 Clientes Cerrados ({leadsGanadosCount})</span>
              </button>
              <button
                onClick={() => setFichasFilter('negociacion')}
                className={`px-3 py-1 rounded-lg transition-all font-medium flex items-center gap-1.5 ${
                  fichasFilter === 'negociacion'
                    ? 'bg-amber-600 text-white font-semibold shadow-sm'
                    : 'bg-amber-500/10 text-amber-400 hover:bg-amber-500/20'
                }`}
              >
                <Flame className="w-3 h-3" />
                <span>En Propuesta / Cierre ({leadsEnNegociacionCount})</span>
              </button>
              <button
                onClick={() => setFichasFilter('scrapper')}
                className={`px-3 py-1 rounded-lg transition-all font-medium flex items-center gap-1.5 ${
                  fichasFilter === 'scrapper'
                    ? 'bg-sky-600 text-white font-semibold shadow-sm'
                    : 'bg-sky-500/10 text-sky-400 hover:bg-sky-500/20'
                }`}
              >
                <Download className="w-3 h-3" />
                <span>Desde Scrapper ({leadsDeScrapperCount})</span>
              </button>
              <button
                onClick={() => setFichasFilter('manual')}
                className={`px-3 py-1 rounded-lg transition-all font-medium flex items-center gap-1.5 ${
                  fichasFilter === 'manual'
                    ? 'bg-purple-600 text-white font-semibold shadow-sm'
                    : 'bg-purple-500/10 text-purple-400 hover:bg-purple-500/20'
                }`}
              >
                <UserPlus className="w-3 h-3" />
                <span>Manuales ({leadsManualesCount})</span>
              </button>
              <button
                onClick={() => setFichasFilter('archivados')}
                className={`px-3 py-1 rounded-lg transition-all font-medium flex items-center gap-1.5 ${
                  fichasFilter === 'archivados'
                    ? 'bg-amber-600 text-white font-semibold shadow-sm'
                    : 'bg-amber-500/10 text-amber-400 hover:bg-amber-500/20'
                }`}
              >
                <Archive className="w-3 h-3" />
                <span>📦 Archivados ({archivedLeadsCount})</span>
              </button>
            </div>

            <div className="text-[11px] font-mono text-slate-400">
              Mostrando <span className="text-white font-bold">{fichasLeads.length}</span> expedientes
            </div>
          </div>

          {/* Grid de Fichas de Cliente 360° */}
          {fichasLeads.length === 0 ? (
            <div className="p-12 text-center rounded-2xl bg-[#0c1017] border border-slate-800/80 space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-slate-800/80 text-slate-500 flex items-center justify-center mx-auto">
                <Users className="w-7 h-7" />
              </div>
              <h4 className="text-base font-bold text-white">No hay expedientes con este filtro</h4>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                No se encontraron fichas de cliente que coincidan. Puedes importar prospectos del Lead Scrapper de Fase 1 o registrar un nuevo cliente manualmente.
              </p>
              <div className="flex items-center justify-center gap-2 pt-2">
                <button
                  onClick={handleOpenImportScrapperModal}
                  className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Importar desde Scrapper</span>
                </button>
                <button
                  onClick={() => setCreateLeadModalOpen(true)}
                  className="px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-semibold flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Crear Ficha Manual</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {fichasLeads.map(lead => {
                const stageObj = PIPELINE_STAGES.find(s => s.id === lead.etapa) || PIPELINE_STAGES[0];
                const isGanado = lead.etapa === 'ganado';
                const cleanPhone = (lead.whatsappData?.telefono || lead.telefono || '').replace(/[^\d]/g, '');
                const isScrapper = (lead.fuente && lead.fuente.toLowerCase().includes('scrapper')) || lead.leadId || lead.sinWeb;

                return (
                  <div
                    key={lead.id}
                    className={`rounded-2xl p-5 border transition-all duration-200 flex flex-col justify-between gap-4 ${
                      isGanado
                        ? 'bg-[#0a1612] border-emerald-500/40 shadow-lg shadow-emerald-950/20'
                        : 'bg-[#0c1017] border-slate-800 hover:border-slate-700 shadow-md'
                    }`}
                  >
                    {/* Header Card */}
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1 ${
                            isGanado 
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' 
                              : stageObj.badge
                          }`}>
                            {isGanado ? '👑 Cliente Ganado' : stageObj.label}
                          </span>

                          <span className="text-xs font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                            {lead.pais === 'SV' ? '🇸🇻 SV' : '🇩🇴 DO'}
                          </span>

                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800/80 text-slate-400 font-mono">
                            {isScrapper ? '📥 Scrapper' : '✍️ Manual'}
                          </span>
                        </div>

                        <div className="text-right">
                          <div className={`text-base font-black font-mono ${isGanado ? 'text-emerald-400' : 'text-orange-400'}`}>
                            ${Number(lead.presupuestoMonto || lead.valorEstimado || 0).toLocaleString()} <span className="text-[10px] font-normal text-slate-400">USD</span>
                          </div>
                        </div>
                      </div>

                      {/* Info Empresa */}
                      <div>
                        <h4 className="font-bold text-white text-base leading-snug truncate" title={lead.empresa}>
                          {lead.empresa}
                        </h4>

                        <div className="text-xs text-slate-400 mt-0.5 flex items-center gap-1.5 flex-wrap">
                          {lead.sinWeb || lead.origenMaps || lead.dominio?.startsWith('maps-') ? (
                            <span className="text-[11px] bg-amber-500/10 text-amber-300 px-1.5 py-0.5 rounded border border-amber-500/30 flex items-center gap-1 font-medium">
                              <MapPin className="w-3 h-3 text-amber-400" />
                              <span>Google Maps {lead.resenas ? `· ${lead.resenas} reseñas (${lead.calificacion || 4.8}★)` : '· Sin Web'}</span>
                            </span>
                          ) : lead.dominio ? (
                            <a
                              href={`https://${lead.dominio}`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-slate-400 hover:text-orange-400 flex items-center gap-1 truncate font-mono text-[11px]"
                            >
                              <Globe className="w-3 h-3 shrink-0" />
                              <span className="truncate">{lead.dominio}</span>
                              <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                            </a>
                          ) : (
                            <span className="text-slate-600 text-[11px] italic">Sin dominio registrado</span>
                          )}
                        </div>
                      </div>

                      {/* Contacto & Decisor */}
                      <div className="p-3 rounded-xl bg-[#121826]/70 border border-slate-800/80 space-y-1.5 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-slate-200 flex items-center gap-1.5 truncate">
                            <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="truncate">{lead.contacto || 'Contacto Principal'}</span>
                          </span>
                          <span className="text-[11px] text-slate-500 shrink-0">{lead.cargo || 'Dirección'}</span>
                        </div>

                        <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-800/60 font-mono text-[11px]">
                          {cleanPhone ? (
                            <a
                              href={`https://wa.me/${cleanPhone}`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-emerald-400 hover:text-emerald-300 flex items-center gap-1 hover:underline truncate"
                              title="Chatear en WhatsApp"
                            >
                              <Phone className="w-3 h-3 shrink-0" />
                              <span>{lead.telefono}</span>
                            </a>
                          ) : (
                            <span className="text-slate-600 italic">Sin teléfono</span>
                          )}

                          {lead.email ? (
                            <a
                              href={`mailto:${lead.email}`}
                              className="text-slate-400 hover:text-sky-400 flex items-center gap-1 hover:underline truncate"
                              title={lead.email}
                            >
                              <Mail className="w-3 h-3 shrink-0" />
                              <span className="truncate max-w-[120px]">{lead.email}</span>
                            </a>
                          ) : (
                            <span className="text-slate-600 italic">Sin email</span>
                          )}
                        </div>
                      </div>

                      {/* Selector Rápido de Etapa */}
                      <div className="flex items-center justify-between gap-2 text-xs pt-1">
                        <span className="text-slate-500 font-mono text-[10px]">Etapa Comercial:</span>
                        <select
                          value={lead.etapa}
                          onChange={(e) => handleStageChange(lead.id, e.target.value)}
                          className={`text-xs rounded-lg px-2 py-1 font-semibold border cursor-pointer ${
                            lead.etapa === 'ganado'
                              ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/50'
                              : 'bg-[#131926] text-slate-200 border-slate-700'
                          }`}
                        >
                          {PIPELINE_STAGES.map(s => (
                            <option key={s.id} value={s.id}>{s.label}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Footer Actions: Integración 360° con el flujo de la agencia */}
                    <div className="space-y-2 pt-3 border-t border-slate-800/80">
                      <button
                        onClick={() => setActiveLeadModal(syncCrmLeadsWithPresupuestos([lead])[0])}
                        className="w-full py-2 px-3 rounded-xl bg-orange-600/15 hover:bg-orange-600/25 text-orange-400 border border-orange-500/30 hover:border-orange-500/60 font-semibold text-xs flex items-center justify-center gap-2 transition-all shadow-sm"
                      >
                        <Users className="w-3.5 h-3.5" />
                        <span>📇 Ver Ficha Completa 360°</span>
                      </button>

                      <div className="grid grid-cols-5 gap-1.5">
                        <button
                          onClick={() => onConvertToPresupuesto && onConvertToPresupuesto(lead)}
                          className="p-1.5 rounded-lg bg-[#131926] hover:bg-orange-600/20 text-slate-300 hover:text-orange-400 border border-slate-800 hover:border-orange-500/40 text-[11px] font-medium flex flex-col items-center justify-center gap-0.5 transition-colors"
                          title="Fase 3: Crear Presupuesto VIP"
                        >
                          <FileText className="w-3.5 h-3.5 text-amber-400" />
                          <span className="text-[9px] uppercase font-mono">Cotizar</span>
                        </button>

                        <button
                          onClick={() => onOpenContrato && onOpenContrato(lead)}
                          className="p-1.5 rounded-lg bg-[#131926] hover:bg-emerald-600/20 text-slate-300 hover:text-emerald-400 border border-slate-800 hover:border-emerald-500/40 text-[11px] font-medium flex flex-col items-center justify-center gap-0.5 transition-colors"
                          title="Fase 3: Contrato SOW & Firma"
                        >
                          <Briefcase className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-[9px] uppercase font-mono">SOW</span>
                        </button>

                        <button
                          onClick={() => {
                            if (onOpenPrd) onOpenPrd(lead);
                          }}
                          className="p-1.5 rounded-lg bg-[#131926] hover:bg-indigo-600/20 text-slate-300 hover:text-indigo-400 border border-slate-800 hover:border-indigo-500/40 text-[11px] font-medium flex flex-col items-center justify-center gap-0.5 transition-colors"
                          title="Fase 4: Centro de Desarrollo & PRD Técnico"
                        >
                          <Zap className="w-3.5 h-3.5 text-indigo-400" />
                          <span className="text-[9px] uppercase font-mono">PRD</span>
                        </button>

                        <button
                          onClick={() => {
                            setSelectedWaLeadId(lead.id);
                            setActiveTab('whatsapp_crm');
                          }}
                          className="p-1.5 rounded-lg bg-[#131926] hover:bg-emerald-600/20 text-slate-300 hover:text-emerald-400 border border-slate-800 hover:border-emerald-500/40 text-[11px] font-medium flex flex-col items-center justify-center gap-0.5 transition-colors"
                          title="Fase 2: Abrir en WhatsApp CRM"
                        >
                          <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-[9px] uppercase font-mono">Chat</span>
                        </button>

                        <button
                          onClick={(e) => {
                            handleToggleArchiveLead(lead.id, !lead.archivado, lead.etapa === 'ganado' ? 'entregado' : lead.etapa === 'perdido' ? 'perdido' : 'manual', e);
                          }}
                          className={`p-1.5 rounded-lg border text-[11px] font-medium flex flex-col items-center justify-center gap-0.5 transition-colors ${
                            lead.archivado
                              ? 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border-amber-500/40'
                              : 'bg-[#131926] hover:bg-amber-500/20 text-slate-400 hover:text-amber-300 border-slate-800 hover:border-amber-500/40'
                          }`}
                          title={lead.archivado ? "Desarchivar y reactivar en pipeline" : "Archivar cliente (retirar del pipeline activo)"}
                        >
                          {lead.archivado ? (
                            <ArchiveRestore className="w-3.5 h-3.5 text-amber-400" />
                          ) : (
                            <Archive className="w-3.5 h-3.5" />
                          )}
                          <span className="text-[9px] uppercase font-mono">{lead.archivado ? 'Reactivar' : 'Archivar'}</span>
                        </button>

                        <button
                          onClick={(e) => handleDeleteLead(lead.id, lead.empresa, e)}
                          className="p-1.5 rounded-lg bg-[#131926] hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border border-slate-800 hover:border-rose-500/40 text-[11px] font-medium flex flex-col items-center justify-center gap-0.5 transition-colors"
                          title="Eliminar Lead"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                          <span className="text-[9px] uppercase font-mono">Borrar</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
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
                      className="px-2.5 py-1.5 rounded-lg bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 font-medium text-xs transition-colors"
                      title="Generar Presupuesto VIP"
                    >
                      Presupuesto
                    </button>
                    
                    <button
                      type="button"
                      onClick={(e) => {
                        handleToggleArchiveLead(lead.id, !lead.archivado, lead.etapa === 'ganado' ? 'entregado' : lead.etapa === 'perdido' ? 'perdido' : 'manual', e);
                      }}
                      className={`px-2 py-1.5 rounded-lg text-xs font-medium border transition-colors inline-flex items-center gap-1 align-middle ${
                        lead.archivado
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30'
                          : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700 hover:text-white'
                      }`}
                      title={lead.archivado ? "Desarchivar y reactivar en pipeline activo" : "Archivar cliente"}
                    >
                      {lead.archivado ? <ArchiveRestore className="w-3.5 h-3.5 text-amber-400" /> : <Archive className="w-3.5 h-3.5" />}
                      <span>{lead.archivado ? 'Reactivar' : 'Archivar'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={(e) => handleDeleteLead(lead.id, lead.empresa, e)}
                      title="Eliminar Lead"
                      className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 border border-rose-500/20 hover:border-rose-500/40 transition-all inline-flex items-center justify-center align-middle"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* WHATSAPP CRM: HUB DE ESTADO & SÍNTESIS DE CONVERSACIONES */}
      {activeTab === 'whatsapp_crm' && (
        <div className="bg-[#0e1320] border border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col min-h-[720px]">
          
          {/* Top Header del Hub */}
          <div className="px-6 py-4 bg-[#121826] border-b border-slate-800 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center font-bold shrink-0">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-white flex items-center gap-2">
                  <span>CRM WhatsApp: Hub de Estado & Síntesis</span>
                  <span className="text-[11px] font-mono bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-semibold">
                    Radar de Conversaciones
                  </span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Seguimiento de temperatura, acuerdos y resúmenes ejecutivos sin leer historiales largos. Usa WhatsApp Web o tu asistente remoto para la mensajería.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {waNotice && (
                <div className="px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-semibold animate-pulse">
                  {waNotice}
                </div>
              )}
              <div className="text-xs font-mono text-slate-400 bg-[#090d15] px-3 py-1.5 rounded-xl border border-slate-800">
                Total Registros: <span className="text-white font-bold">{filteredLeads.length}</span>
              </div>
            </div>
          </div>

          {/* 2-Column Workspace: 32% Radar de Contactos · 68% Ficha Ejecutiva */}
          <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
            
            {/* COLUMNA 1: RADAR DE CONTACTOS (32%) */}
            <div className="w-full md:w-[32%] shrink-0 border-r border-slate-800 flex flex-col bg-[#0b0f19]">
              
              {/* Buscador & Filtros por Temperatura */}
              <div className="p-3.5 border-b border-slate-800 space-y-2.5">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Buscar por contacto, empresa o teléfono..."
                    value={waSearchTerm}
                    onChange={(e) => setWaSearchTerm(e.target.value)}
                    className="w-full bg-[#131926] border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500/60"
                  />
                </div>

                <div className="flex items-center gap-1 overflow-x-auto pb-1 text-xs">
                  <button
                    onClick={() => setWaTemperatureFilter('ALL')}
                    className={`px-2.5 py-1 rounded-lg transition-all text-xs font-medium shrink-0 ${waTemperatureFilter === 'ALL' ? 'bg-slate-700 text-white font-bold shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
                  >
                    Todos ({filteredLeads.length})
                  </button>
                  <button
                    onClick={() => setWaTemperatureFilter('caliente')}
                    className={`px-2.5 py-1 rounded-lg transition-all text-xs font-medium shrink-0 ${waTemperatureFilter === 'caliente' ? 'bg-amber-500/30 text-amber-300 font-bold border border-amber-500/40 shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
                  >
                    🔥 Calientes
                  </button>
                  <button
                    onClick={() => setWaTemperatureFilter('tibio')}
                    className={`px-2.5 py-1 rounded-lg transition-all text-xs font-medium shrink-0 ${waTemperatureFilter === 'tibio' ? 'bg-yellow-500/30 text-yellow-300 font-bold border border-yellow-500/40 shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
                  >
                    🟡 Tibios
                  </button>
                  <button
                    onClick={() => setWaTemperatureFilter('frio')}
                    className={`px-2.5 py-1 rounded-lg transition-all text-xs font-medium shrink-0 ${waTemperatureFilter === 'frio' ? 'bg-sky-500/30 text-sky-300 font-bold border border-sky-500/40 shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
                  >
                    ❄️ Fríos
                  </button>
                </div>
              </div>

              {/* Lista de Contactos en el Radar */}
              <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60">
                {filteredLeads
                  .filter(l => {
                    const matchesSearch = !waSearchTerm ||
                      (l.empresa || '').toLowerCase().includes(waSearchTerm.toLowerCase()) ||
                      (l.contacto || '').toLowerCase().includes(waSearchTerm.toLowerCase()) ||
                      (l.telefono || '').includes(waSearchTerm);
                    const matchesTemp = waTemperatureFilter === 'ALL' || (l.whatsappData?.temperatura === waTemperatureFilter);
                    return matchesSearch && matchesTemp;
                  })
                  .map(leadItem => {
                    const isSelected = (selectedWaLeadId === leadItem.id) || (!selectedWaLeadId && leadItem.id === filteredLeads[0]?.id);
                    const temp = leadItem.whatsappData?.temperatura || 'tibio';
                    const tempConfig = TEMPERATURE_CONFIG[temp] || TEMPERATURE_CONFIG.tibio;
                    const stageTag = PIPELINE_STAGES.find(s => s.id === leadItem.etapa) || PIPELINE_STAGES[0];
                    const resumenSnippet = leadItem.whatsappData?.resumenEjecutivo || leadItem.whatsappData?.proximoPaso || (leadItem.whatsappData?.mensajes?.[leadItem.whatsappData.mensajes.length - 1]?.texto) || 'Sin resumen registrado aún';

                    return (
                      <div
                        key={leadItem.id}
                        onClick={() => setSelectedWaLeadId(leadItem.id)}
                        className={`p-3.5 cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-[#151e30] border-l-4 border-emerald-500 shadow-inner'
                            : 'hover:bg-slate-900/60'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700/80 flex items-center justify-center font-bold text-xs text-emerald-400 shrink-0">
                              {leadItem.contacto?.charAt(0) || leadItem.empresa?.charAt(0) || 'C'}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-xs text-white truncate max-w-[130px]">
                                  {leadItem.contacto}
                                </span>
                                <span className="text-xs shrink-0">{leadItem.pais === 'SV' ? '🇸🇻' : '🇩🇴'}</span>
                              </div>
                              <div className="text-[11px] text-slate-400 truncate max-w-[140px]">
                                {leadItem.empresa}
                              </div>
                            </div>
                          </div>

                          <span className={`text-[10px] px-2 py-0.5 rounded font-bold shrink-0 ${tempConfig.badge}`}>
                            {tempConfig.icon} {tempConfig.label}
                          </span>
                        </div>

                        {/* Snippet del resumen */}
                        <p className="mt-2 text-[11px] text-slate-300/80 line-clamp-2 leading-relaxed bg-[#0c1018]/60 p-1.5 rounded-lg border border-slate-800/60 font-sans">
                          {resumenSnippet}
                        </p>

                        {/* Footer tags */}
                        <div className="mt-2 flex items-center justify-between text-[10px] text-slate-500 font-mono">
                          <span className={`px-1.5 py-0.5 rounded font-medium ${stageTag.badge} truncate max-w-[130px]`}>
                            {stageTag.label}
                          </span>
                          <span>{leadItem.whatsappData?.fechaResumen ? `Act: ${leadItem.whatsappData.fechaResumen.split(',')[0]}` : 'Reciente'}</span>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* COLUMNA 2: FICHA EJECUTIVA DE SÍNTESIS & PRÓXIMO PASO (68%) */}
            {(() => {
              const currentLead = leads.find(l => l.id === selectedWaLeadId) || filteredLeads[0];
              if (!currentLead) {
                return (
                  <div className="flex-1 flex flex-col items-center justify-center text-slate-500 p-8 space-y-3">
                    <MessageSquare className="w-12 h-12 text-slate-700" />
                    <p className="text-sm">Selecciona una conversación del radar para ver su resumen ejecutivo.</p>
                  </div>
                );
              }

              const cleanPhone = (currentLead.whatsappData?.telefono || currentLead.telefono || '').replace(/[^\d]/g, '');
              const waData = currentLead.whatsappData || {};

              return (
                <div className="flex-1 min-w-0 flex flex-col bg-[#0a0e17] overflow-y-auto">
                  
                  {/* Header Ejecutivo del Contacto */}
                  <div className="p-4 bg-[#101625] border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 shadow-md">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center font-black text-white text-base shadow-md shrink-0">
                        {currentLead.contacto?.charAt(0) || 'C'}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-base text-white truncate">{currentLead.contacto}</h4>
                          <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                            {currentLead.pais === 'SV' ? '🇸🇻 El Salvador' : '🇩🇴 Rep. Dominicana'}
                          </span>
                        </div>
                        <div className="text-xs text-slate-400 flex items-center gap-2 truncate mt-0.5">
                          <span className="font-semibold text-slate-300 truncate">{currentLead.empresa}</span>
                          <span>·</span>
                          <span className="font-mono text-emerald-400 font-bold shrink-0">{currentLead.whatsappData?.telefono || currentLead.telefono || 'Sin teléfono'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Controles Directos: Etapa, Temperatura y Abrir WhatsApp Web */}
                    <div className="flex flex-wrap items-center gap-2.5">
                      <div className="flex items-center gap-1.5 bg-[#141b2a] px-3 py-1.5 rounded-xl border border-slate-700/80">
                        <span className="text-[10px] font-mono text-slate-400 font-semibold uppercase">Etapa:</span>
                        <select
                          value={currentLead.etapa}
                          onChange={(e) => handleStageChange(currentLead.id, e.target.value)}
                          className="bg-transparent text-xs text-orange-400 font-bold focus:outline-none cursor-pointer"
                        >
                          {PIPELINE_STAGES.map(st => (
                            <option key={st.id} value={st.id} className="bg-[#141b2a] text-slate-200">{st.label}</option>
                          ))}
                        </select>
                      </div>

                      <div className="flex items-center gap-1.5 bg-[#141b2a] px-3 py-1.5 rounded-xl border border-slate-700/80">
                        <span className="text-[10px] font-mono text-slate-400 font-semibold uppercase">Temperatura:</span>
                        <select
                          value={waData.temperatura || 'tibio'}
                          onChange={(e) => handleUpdateWaMeta(currentLead.id, { temperatura: e.target.value })}
                          className="bg-transparent text-xs text-amber-300 font-bold focus:outline-none cursor-pointer"
                        >
                          <option value="caliente" className="bg-[#141b2a] text-amber-300">🔥 Caliente</option>
                          <option value="tibio" className="bg-[#141b2a] text-yellow-300">🟡 Tibio</option>
                          <option value="frio" className="bg-[#141b2a] text-sky-300">❄️ Frío</option>
                        </select>
                      </div>

                      {/* Botón Único Oficial: Abrir en WhatsApp Web */}
                      <a
                        href={cleanPhone ? `https://web.whatsapp.com/send?phone=${cleanPhone}` : 'https://web.whatsapp.com/'}
                        target="_blank"
                        rel="noreferrer"
                        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-950/60 transition-all hover:scale-[1.02]"
                        title="Abrir chat en la aplicación oficial de WhatsApp Web"
                      >
                        <Smartphone className="w-4 h-4" />
                        <span>Abrir en WhatsApp Web</span>
                        <ExternalLink className="w-3.5 h-3.5 opacity-80" />
                      </a>
                    </div>
                  </div>

                  {/* Cuerpo de la Ficha: Tarjetas de Síntesis */}
                  <div className="p-5 md:p-6 space-y-5 flex-1">
                    
                    {/* TARJETA 1: RESUMEN EJECUTIVO DE LA CONVERSACIÓN */}
                    <div className="p-5 rounded-2xl bg-[#0f1523] border border-slate-800 shadow-xl space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-400 flex items-center justify-center font-bold">
                            <FileText className="w-4 h-4" />
                          </div>
                          <div>
                            <h4 className="font-bold text-sm text-white flex items-center gap-2">
                              <span>Resumen Ejecutivo de la Conversación</span>
                              <span className="text-[10px] font-mono text-slate-400">
                                {waData.fechaResumen ? `(Actualizado: ${waData.fechaResumen})` : '(Sin fecha)'}
                              </span>
                            </h4>
                            <p className="text-[11px] text-slate-400">
                              Síntesis ejecutiva de los acuerdos, tono del cliente y estado de la negociación (generado por ti o tu asistente remoto).
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleSaveExecutiveBrief(currentLead.id, {
                            resumenEjecutivo: executiveSummaryInput,
                            requerimientos: requerimientosInput,
                            objeciones: objecionesInput,
                            proximoPaso: proximoPasoInput,
                            fechaProximoPaso: fechaProximoPasoInput
                          })}
                          className="px-4 py-1.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-orange-950 transition-all"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Guardar Ficha</span>
                        </button>
                      </div>

                      <textarea
                        rows={3}
                        value={executiveSummaryInput}
                        onChange={(e) => setExecutiveSummaryInput(e.target.value)}
                        placeholder="Ejemplo: Cliente interesado en rediseño web StoryBrand para su clínica dental. Le pareció excelente la entrega en 10 días llave en mano. Preguntó por facilidades de pago del anticipo 50/50 y solicita ver el portal de cliente con la propuesta formal..."
                        className="w-full bg-[#090d16] border border-slate-800 rounded-xl p-3.5 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-orange-500/60 leading-relaxed font-sans resize-none"
                      />
                    </div>

                    {/* TARJETA 2 EN 2 COLUMNAS: REQUERIMIENTOS Y OBJECIONES */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      
                      {/* Columna A: Requerimientos & Servicios de Interés */}
                      <div className="p-4 rounded-xl bg-[#0f1523] border border-slate-800 space-y-2.5">
                        <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-wide">
                          <Sparkles className="w-4 h-4" />
                          <span>Requerimientos & Servicios Clave</span>
                        </div>
                        <textarea
                          rows={2}
                          value={requerimientosInput}
                          onChange={(e) => setRequerimientosInput(e.target.value)}
                          placeholder="Ej: Sitio web Mobile-First, presencia en Google Maps, botón directo a WhatsApp..."
                          className="w-full bg-[#090d16] border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500/50 resize-none leading-relaxed"
                        />
                      </div>

                      {/* Columna B: Objeciones o Puntos a Resolver */}
                      <div className="p-4 rounded-xl bg-[#0f1523] border border-slate-800 space-y-2.5">
                        <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-wide">
                          <AlertCircle className="w-4 h-4" />
                          <span>Objeciones o Dudas Expresadas</span>
                        </div>
                        <textarea
                          rows={2}
                          value={objecionesInput}
                          onChange={(e) => setObjecionesInput(e.target.value)}
                          placeholder="Ej: Dudas sobre métodos de transferencia local o tiempo exacto de entrega..."
                          className="w-full bg-[#090d16] border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-amber-500/50 resize-none leading-relaxed"
                        />
                      </div>
                    </div>

                    {/* TARJETA 3: PRÓXIMO PASO Y COMPROMISO */}
                    <div className="p-4 rounded-xl bg-[#111827] border border-slate-800 space-y-3">
                      <div className="flex items-center gap-2 text-xs font-bold text-sky-400 uppercase tracking-wide">
                        <Clock className="w-4 h-4" />
                        <span>Próximo Paso Acordado & Compromiso Comercial</span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div className="md:col-span-2">
                          <input
                            type="text"
                            value={proximoPasoInput}
                            onChange={(e) => setProximoPasoInput(e.target.value)}
                            placeholder="Ej: Enviar enlace del portal con contrato SOW antes de las 3:00 PM..."
                            className="w-full bg-[#090d16] border border-slate-800 rounded-lg p-2.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-sky-500/50"
                          />
                        </div>
                        <div>
                          <input
                            type="date"
                            value={fechaProximoPasoInput}
                            onChange={(e) => setFechaProximoPasoInput(e.target.value)}
                            className="w-full bg-[#090d16] border border-slate-800 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-sky-500/50"
                          />
                        </div>
                      </div>
                    </div>

                    {/* TARJETA 4: BITÁCORA RÁPIDA DE HITOS DE LA CONVERSACIÓN */}
                    <div className="p-4 rounded-xl bg-[#0f1523] border border-slate-800 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-300 uppercase tracking-wide flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>Bitácora de Hitos & Acuerdos Registrados ({currentLead.interacciones?.length || 0})</span>
                        </span>
                      </div>

                      {/* Mini Form para registrar hito rápido */}
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={nuevaNotaInput}
                          onChange={(e) => setNuevaNotaInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddQuickNote(currentLead.id);
                            }
                          }}
                          placeholder="Añadir nota de estatus rápida (ej: Cliente confirmó recepción del presupuesto)..."
                          className="flex-1 bg-[#090d16] border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500/50"
                        />
                        <button
                          type="button"
                          onClick={() => handleAddQuickNote(currentLead.id)}
                          disabled={!nuevaNotaInput.trim()}
                          className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-emerald-400 font-bold text-xs flex items-center gap-1 transition-all"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Añadir Hito</span>
                        </button>
                      </div>

                      {/* Lista de notas/hitos cronológicos */}
                      <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                        {(!currentLead.interacciones || currentLead.interacciones.length === 0) ? (
                          <div className="p-3 rounded-lg bg-[#090d16] border border-slate-800/60 text-center text-xs text-slate-500">
                            No hay notas de estatus en la bitácora aún. Escribe arriba para registrar un hito.
                          </div>
                        ) : (
                          currentLead.interacciones.map((item, idx) => (
                            <div key={item.id || idx} className="p-2.5 rounded-lg bg-[#090d16] border border-slate-800/80 text-xs flex items-start justify-between gap-3">
                              <div className="space-y-0.5">
                                <span className="font-bold text-slate-200 block text-[11px]">{item.titulo || 'Nota de Estatus'}</span>
                                <p className="text-slate-400 text-[11px] leading-relaxed">{item.detalle}</p>
                              </div>
                              <span className="text-[10px] font-mono text-slate-500 shrink-0">{item.fecha}</span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                  </div>
                </div>
              );
            })()}

          </div>
        </div>
      )}

      {/* MODAL: FICHA COMPLETA DE CLIENTE 360° & ACCIONES DEL FLUJO */}
      {activeLeadModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0e1320] border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
            
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-800 bg-[#121826] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg ${
                  activeLeadModal.etapa === 'ganado'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                    : 'bg-orange-500/10 text-orange-400 border border-orange-500/20'
                }`}>
                  {activeLeadModal.etapa === 'ganado' ? '👑' : <Building2 className="w-5 h-5" />}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold text-lg text-white leading-tight">{activeLeadModal.empresa}</h3>
                    {activeLeadModal.archivado && (
                      <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-semibold flex items-center gap-1">
                        <Archive className="w-3 h-3 text-amber-400" />
                        <span>Archivado ({activeLeadModal.motivoArchivado === 'entregado' ? 'Entregado' : activeLeadModal.motivoArchivado === 'perdido' ? 'Perdido' : 'Histórico'})</span>
                      </span>
                    )}
                    <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                      {activeLeadModal.pais === 'SV' ? '🇸🇻 El Salvador' : '🇩🇴 República Dominicana'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Decisor: <span className="text-slate-200 font-semibold">{activeLeadModal.contacto || 'Contacto Principal'}</span> ({activeLeadModal.cargo || 'Dirección'}) · Fuente: <span className="text-sky-400">{activeLeadModal.fuente || 'Manual'}</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (isEditingLeadModal) {
                      setIsEditingLeadModal(false);
                    } else {
                      startEditingLead(activeLeadModal);
                    }
                  }}
                  className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm ${
                    isEditingLeadModal
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border-slate-700'
                  }`}
                  title={isEditingLeadModal ? 'Cancelar edición' : 'Editar datos del cliente'}
                >
                  <Edit className="w-3.5 h-3.5 text-orange-400" />
                  <span>{isEditingLeadModal ? 'Cancelar Edición' : 'Editar Ficha'}</span>
                </button>

                <div className="flex items-center gap-1.5 bg-[#090d15] px-3 py-1.5 rounded-xl border border-slate-700/80">
                  <span className="text-[10px] font-mono text-slate-400 uppercase">Etapa:</span>
                  <select
                    value={activeLeadModal.etapa}
                    onChange={(e) => handleStageChange(activeLeadModal.id, e.target.value)}
                    className={`text-xs font-bold rounded-lg px-2 py-1 border cursor-pointer ${
                      activeLeadModal.etapa === 'ganado'
                        ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/60'
                        : 'bg-[#131926] text-orange-400 border-slate-700'
                    }`}
                  >
                    {PIPELINE_STAGES.map(s => (
                      <option key={s.id} value={s.id}>{s.label}</option>
                    ))}
                  </select>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    handleToggleArchiveLead(
                      activeLeadModal.id,
                      !activeLeadModal.archivado,
                      activeLeadModal.etapa === 'ganado' ? 'entregado' : activeLeadModal.etapa === 'perdido' ? 'perdido' : 'manual',
                      e
                    );
                  }}
                  className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm ${
                    activeLeadModal.archivado
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border-slate-700'
                  }`}
                  title={activeLeadModal.archivado ? "Reactivar este cliente en el pipeline activo" : "Archivar cliente (retirar del pipeline activo sin borrar)"}
                >
                  {activeLeadModal.archivado ? (
                    <>
                      <ArchiveRestore className="w-3.5 h-3.5 text-amber-400" />
                      <span>Reactivar en CRM</span>
                    </>
                  ) : (
                    <>
                      <Archive className="w-3.5 h-3.5 text-slate-400" />
                      <span>Archivar Ficha</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => {
                    setActiveLeadModal(null);
                    setIsEditingLeadModal(false);
                  }}
                  className="w-8 h-8 rounded-lg bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Quick KPI Strip */}
            <div className="grid grid-cols-4 border-b border-slate-800/80 bg-[#0a0e17] text-xs px-5 py-2.5">
              <div>
                <span className="text-slate-500 font-mono text-[10px] block uppercase">
                  {activeLeadModal.presupuestoMonto ? 'Presupuesto Emitido' : 'Monto Estimado Inicial'}
                </span>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="font-mono font-black text-sm text-emerald-400">
                    ${Number(activeLeadModal.presupuestoMonto || activeLeadModal.valorEstimado || 0).toLocaleString()} USD
                  </span>
                  {activeLeadModal.presupuestoCodigo && (
                    <span className="text-[9px] font-mono font-bold bg-orange-500/20 text-orange-400 border border-orange-500/30 px-1 py-0.2 rounded">
                      {activeLeadModal.presupuestoCodigo}
                    </span>
                  )}
                </div>
              </div>
              <div>
                <span className="text-slate-500 font-mono text-[10px] block uppercase">Probabilidad de Cierre</span>
                <span className="font-mono font-bold text-sm text-sky-400">{activeLeadModal.etapa === 'ganado' ? '100%' : `${activeLeadModal.probabilidad || 35}%`}</span>
              </div>
              <div>
                <span className="text-slate-500 font-mono text-[10px] block uppercase">Fecha de Registro</span>
                <span className="font-mono text-slate-300 text-xs">{activeLeadModal.creadoEn || 'Reciente'}</span>
              </div>
              <div>
                <span className="text-slate-500 font-mono text-[10px] block uppercase">Bitácora Activa</span>
                <span className="font-mono text-orange-400 text-xs font-bold">{activeLeadModal.interacciones?.length || 0} registros</span>
              </div>
            </div>

            {/* Modal Content: 2 Columnas 360° */}
            <div className="p-5 overflow-y-auto space-y-6 flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6 bg-[#0c1017]">
              
              {/* COLUMNA 1: EXPEDIENTE, ACCIONES DEL FLUJO Y PORTAL */}
              <div className="space-y-4">
                
                {/* 1. Datos de Contacto Directo / Modo Edición */}
                <div className="p-4 rounded-xl bg-[#121826] border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-mono uppercase tracking-wider text-slate-400 font-bold flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-orange-400" />
                      <span>{isEditingLeadModal ? 'Editar Datos de Contacto & Negocio' : 'Datos de Contacto & Canales'}</span>
                    </div>
                    {isEditingLeadModal && (
                      <span className="text-[10px] font-mono bg-orange-500/20 text-orange-400 px-2 py-0.5 rounded font-bold border border-orange-500/30">
                        Modo Edición Activo
                      </span>
                    )}
                  </div>

                  {isEditingLeadModal ? (
                    <div className="space-y-3 pt-1">
                      <div>
                        <label className="text-[11px] font-medium text-slate-400 block mb-1">Nombre de Empresa / Negocio:</label>
                        <input
                          type="text"
                          value={leadEditForm.empresa}
                          onChange={(e) => setLeadEditForm(prev => ({ ...prev, empresa: e.target.value }))}
                          className="w-full bg-[#0a0e17] border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-orange-500"
                          placeholder="Nombre comercial de la empresa"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[11px] font-medium text-slate-400 block mb-1">Contacto / Decisor:</label>
                          <input
                            type="text"
                            value={leadEditForm.contacto}
                            onChange={(e) => setLeadEditForm(prev => ({ ...prev, contacto: e.target.value }))}
                            className="w-full bg-[#0a0e17] border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-orange-500"
                            placeholder="Nombre del decisor"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-medium text-slate-400 block mb-1">Cargo:</label>
                          <input
                            type="text"
                            value={leadEditForm.cargo}
                            onChange={(e) => setLeadEditForm(prev => ({ ...prev, cargo: e.target.value }))}
                            className="w-full bg-[#0a0e17] border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-orange-500"
                            placeholder="Cargo o rol"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[11px] font-medium text-slate-400 block mb-1">WhatsApp / Teléfono:</label>
                          <input
                            type="text"
                            value={leadEditForm.telefono}
                            onChange={(e) => setLeadEditForm(prev => ({ ...prev, telefono: e.target.value }))}
                            className="w-full bg-[#0a0e17] border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-orange-500 font-mono"
                            placeholder="+1 (809)... o +503..."
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-medium text-slate-400 block mb-1">País:</label>
                          <select
                            value={leadEditForm.pais}
                            onChange={(e) => setLeadEditForm(prev => ({ ...prev, pais: e.target.value }))}
                            className="w-full bg-[#0a0e17] border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-orange-500"
                          >
                            <option value="SV">🇸🇻 El Salvador</option>
                            <option value="DO">🇩🇴 República Dominicana</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="text-[11px] font-medium text-slate-400 block mb-1">Correo Electrónico:</label>
                        <input
                          type="email"
                          value={leadEditForm.email}
                          onChange={(e) => setLeadEditForm(prev => ({ ...prev, email: e.target.value }))}
                          className="w-full bg-[#0a0e17] border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-orange-500 font-mono"
                          placeholder="contacto@empresa.com"
                        />
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-[11px] font-medium text-slate-400">Sitio Web / Dominio:</label>
                          <label className="flex items-center gap-1.5 text-[11px] text-amber-400 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={leadEditForm.sinWeb}
                              onChange={(e) => setLeadEditForm(prev => ({ ...prev, sinWeb: e.target.checked }))}
                              className="rounded border-slate-700 text-orange-500 focus:ring-0"
                            />
                            <span>Sin sitio web (Oportunidad Web)</span>
                          </label>
                        </div>
                        <input
                          type="text"
                          value={leadEditForm.dominio}
                          disabled={leadEditForm.sinWeb}
                          onChange={(e) => setLeadEditForm(prev => ({ ...prev, dominio: e.target.value }))}
                          className={`w-full bg-[#0a0e17] border rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none font-mono ${
                            leadEditForm.sinWeb
                              ? 'border-slate-800 opacity-50 cursor-not-allowed text-slate-500'
                              : 'border-slate-700 focus:border-orange-500'
                          }`}
                          placeholder="empresa.com"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[11px] font-medium text-slate-400 block mb-1">Monto Estimado ($ USD):</label>
                          <input
                            type="number"
                            value={leadEditForm.valorEstimado}
                            onChange={(e) => setLeadEditForm(prev => ({ ...prev, valorEstimado: e.target.value }))}
                            className="w-full bg-[#0a0e17] border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-emerald-400 font-mono font-bold focus:outline-none focus:border-orange-500"
                            placeholder="650"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-medium text-slate-400 block mb-1">Probabilidad de Cierre (%):</label>
                          <input
                            type="number"
                            value={leadEditForm.probabilidad}
                            onChange={(e) => setLeadEditForm(prev => ({ ...prev, probabilidad: e.target.value }))}
                            className="w-full bg-[#0a0e17] border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-sky-400 font-mono font-bold focus:outline-none focus:border-orange-500"
                            placeholder="40"
                          />
                        </div>
                      </div>

                      <div className="pt-2 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={handleSaveLeadEdit}
                          disabled={isSavingLeadEdit}
                          className="flex-1 py-2 px-4 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-orange-950/40 transition-all disabled:opacity-50"
                        >
                          {isSavingLeadEdit ? (
                            <>
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              <span>Guardando en la Nube...</span>
                            </>
                          ) : (
                            <>
                              <Check className="w-3.5 h-3.5" />
                              <span>Guardar Cambios</span>
                            </>
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsEditingLeadModal(false)}
                          disabled={isSavingLeadEdit}
                          className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs transition-colors"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2 text-xs">
                      <div className="flex items-center justify-between p-2 rounded-lg bg-[#0c1017] border border-slate-800/60">
                        <span className="text-slate-400 font-medium">WhatsApp / Teléfono:</span>
                        {activeLeadModal.telefono ? (
                          <a
                            href={`https://wa.me/${(activeLeadModal.whatsappData?.telefono || activeLeadModal.telefono || '').replace(/[^\d]/g, '')}`}
                            target="_blank"
                            rel="noreferrer"
                            className="font-mono font-bold text-emerald-400 hover:underline flex items-center gap-1"
                          >
                            <Phone className="w-3 h-3" />
                            <span>{activeLeadModal.telefono}</span>
                          </a>
                        ) : (
                          <span className="text-slate-500 italic">No registrado</span>
                        )}
                      </div>

                      <div className="flex items-center justify-between p-2 rounded-lg bg-[#0c1017] border border-slate-800/60">
                        <span className="text-slate-400 font-medium">Correo Electrónico:</span>
                        {activeLeadModal.email ? (
                          <a
                            href={`mailto:${activeLeadModal.email}`}
                            className="font-mono text-sky-400 hover:underline flex items-center gap-1 truncate max-w-[200px]"
                          >
                            <Mail className="w-3 h-3 shrink-0" />
                            <span className="truncate">{activeLeadModal.email}</span>
                          </a>
                        ) : (
                          <span className="text-slate-500 italic">No registrado</span>
                        )}
                      </div>

                      <div className="flex items-center justify-between p-2 rounded-lg bg-[#0c1017] border border-slate-800/60">
                        <span className="text-slate-400 font-medium">Sitio Web / Presencia:</span>
                        {activeLeadModal.sinWeb || activeLeadModal.origenMaps || activeLeadModal.dominio?.startsWith('maps-') ? (
                          <span className="text-amber-400 font-mono text-[11px] flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            <span>Google Maps (Sin Web)</span>
                          </span>
                        ) : activeLeadModal.dominio ? (
                          <a
                            href={`https://${activeLeadModal.dominio}`}
                            target="_blank"
                            rel="noreferrer"
                            className="font-mono text-slate-300 hover:text-orange-400 flex items-center gap-1 hover:underline"
                          >
                            <Globe className="w-3 h-3" />
                            <span>{activeLeadModal.dominio}</span>
                          </a>
                        ) : (
                          <span className="text-slate-500 italic">Sin sitio web</span>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* 2. Conexiones Directas del Flujo Goglite Suite */}
                <div className="p-4 rounded-xl bg-[#121826] border border-slate-800 space-y-2.5">
                  <div className="text-xs font-mono uppercase tracking-wider text-slate-400 font-bold flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-orange-400" />
                    <span>Conexiones del Flujo Goglite Suite</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => {
                        if (onConvertToPresupuesto) onConvertToPresupuesto(activeLeadModal);
                        setActiveLeadModal(null);
                      }}
                      className="p-2.5 rounded-xl bg-[#0c1017] hover:bg-orange-500/20 border border-slate-800 hover:border-orange-500/40 text-left transition-all group"
                    >
                      <div className="text-amber-400 font-bold text-xs flex items-center gap-1.5 group-hover:translate-x-0.5 transition-transform">
                        <FileText className="w-3.5 h-3.5" />
                        <span>{activeLeadModal.presupuestoMonto ? `Propuesta ${activeLeadModal.presupuestoCodigo || ''} ($${Number(activeLeadModal.presupuestoMonto).toLocaleString()} USD)` : 'Presupuesto VIP'}</span>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1">
                        {activeLeadModal.presupuestoMonto ? 'Propuesta emitida en Fase 3 (Clic para ver/editar)' : 'Generar propuesta StoryBrand en Fase 3'}
                      </p>
                    </button>

                    <button
                      onClick={() => {
                        if (onOpenContrato) onOpenContrato(activeLeadModal);
                        setActiveLeadModal(null);
                      }}
                      className="p-2.5 rounded-xl bg-[#0c1017] hover:bg-emerald-500/20 border border-slate-800 hover:border-emerald-500/40 text-left transition-all group"
                    >
                      <div className="text-emerald-400 font-bold text-xs flex items-center gap-1.5 group-hover:translate-x-0.5 transition-transform">
                        <Briefcase className="w-3.5 h-3.5" />
                        <span>Contrato SOW</span>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1">Formalizar acuerdo legal y onboarding</p>
                    </button>

                    <button
                      onClick={() => {
                        if (onOpenPrd) onOpenPrd(activeLeadModal);
                        setActiveLeadModal(null);
                      }}
                      className="p-2.5 rounded-xl bg-[#0c1017] hover:bg-indigo-500/20 border border-slate-800 hover:border-indigo-500/40 text-left transition-all group"
                    >
                      <div className="text-indigo-400 font-bold text-xs flex items-center gap-1.5 group-hover:translate-x-0.5 transition-transform">
                        <Zap className="w-3.5 h-3.5" />
                        <span>Centro de Desarrollo</span>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1">PRD técnico, kanban y horas en Fase 4</p>
                    </button>

                    <button
                      onClick={() => {
                        setSelectedWaLeadId(activeLeadModal.id);
                        setActiveTab('whatsapp_crm');
                        setActiveLeadModal(null);
                      }}
                      className="p-2.5 rounded-xl bg-[#0c1017] hover:bg-emerald-500/20 border border-slate-800 hover:border-emerald-500/40 text-left transition-all group"
                    >
                      <div className="text-emerald-400 font-bold text-xs flex items-center gap-1.5 group-hover:translate-x-0.5 transition-transform">
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>WhatsApp CRM</span>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1">Abrir chat en vivo con guiones persuasivos</p>
                    </button>
                  </div>
                </div>

                {/* 3. Portal de Cliente Exclusivo */}
                <div className="p-4 rounded-xl bg-[#121826] border border-slate-800 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono uppercase tracking-wider text-slate-400 font-bold flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Portal Privado de Cliente</span>
                    </span>
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded font-mono">
                      Token Activo
                    </span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-[#0c1017] border border-slate-800 flex items-center justify-between gap-2 text-xs">
                    <span className="font-mono text-slate-300 truncate text-[11px]">
                      {`${window.location.origin}/portal/${activeLeadModal.portalToken || 'portal-' + activeLeadModal.id}`}
                    </span>
                    <button
                      onClick={() => handleCopyPortalLink(activeLeadModal.portalToken || 'portal-' + activeLeadModal.id, activeLeadModal)}
                      className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1 shrink-0 transition-colors"
                    >
                      {portalCopied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{portalCopied ? '¡Copiado!' : 'Copiar'}</span>
                    </button>
                  </div>

                  <a
                    href={`/portal/${activeLeadModal.portalToken || 'portal-' + activeLeadModal.id}`}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Abrir Vista Previa del Portal de Cliente</span>
                  </a>
                </div>

              </div>

              {/* COLUMNA 2: BITÁCORA DE INTERACCIONES & REGISTRO */}
              <div className="space-y-4">
                
                {/* Form to Add New Interaction */}
                <form onSubmit={handleAddInteraction} className="p-4 rounded-xl bg-[#121826] border border-slate-800 space-y-3">
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
                    placeholder="Detalles de la conversación, acuerdos alcanzados o preguntas del cliente..."
                    value={interactionForm.detalle}
                    onChange={(e) => setInteractionForm({ ...interactionForm, detalle: e.target.value })}
                    rows={2}
                    className="w-full bg-[#0c1017] border border-slate-700 rounded-lg p-2 text-xs text-slate-200"
                  ></textarea>

                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Próximo paso (ej: Enviar contrato)"
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
                  <div className="text-xs font-mono uppercase tracking-wider text-slate-400 font-bold flex items-center justify-between">
                    <span>Historial Cronológico ({activeLeadModal.interacciones?.length || 0})</span>
                  </div>

                  <div className="space-y-2.5 max-h-[260px] overflow-y-auto pr-1">
                    {(!activeLeadModal.interacciones || activeLeadModal.interacciones.length === 0) ? (
                      <div className="p-4 rounded-xl bg-[#0c1017] border border-slate-800 text-center text-xs text-slate-500">
                        No hay interacciones registradas aún.
                      </div>
                    ) : (
                      activeLeadModal.interacciones.map((item, idx) => (
                        <div key={item.id || idx} className="p-3 rounded-xl bg-[#121826] border border-slate-800 text-xs space-y-1.5">
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
                      ))
                    )}
                  </div>
                </div>

              </div>

            </div>
          </div>
        </div>
      )}

      {/* MODAL: REGISTRAR CLIENTE / FICHA MANUAL */}
      {createLeadModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0e1320] border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-slate-800 bg-[#121826] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-orange-500/20 text-orange-400 flex items-center justify-center font-bold">
                  <UserPlus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white">Registrar Ficha de Cliente Manual</h3>
                  <p className="text-[11px] text-slate-400">Añade prospectos o clientes cerrados a la Base de Datos</p>
                </div>
              </div>
              <button onClick={() => setCreateLeadModalOpen(false)} className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateLead} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="text-slate-400 block mb-1 font-medium">Nombre de la Empresa / Razón Social *</label>
                <input
                  type="text"
                  required
                  value={newLeadForm.empresa}
                  onChange={(e) => setNewLeadForm({ ...newLeadForm, empresa: e.target.value })}
                  placeholder="ej: Clínica Dental San Salvador"
                  className="w-full bg-[#131926] border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-slate-400 block mb-1 font-medium">Contacto / Decisor</label>
                  <input
                    type="text"
                    value={newLeadForm.contacto}
                    onChange={(e) => setNewLeadForm({ ...newLeadForm, contacto: e.target.value })}
                    placeholder="ej: Dr. Roberto Gómez"
                    className="w-full bg-[#131926] border border-slate-700 rounded-lg p-2 text-white"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1 font-medium">Cargo</label>
                  <input
                    type="text"
                    value={newLeadForm.cargo}
                    onChange={(e) => setNewLeadForm({ ...newLeadForm, cargo: e.target.value })}
                    placeholder="ej: Propietario / Director"
                    className="w-full bg-[#131926] border border-slate-700 rounded-lg p-2 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-slate-400 block mb-1 font-medium">País</label>
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
                  <label className="text-slate-400 block mb-1 font-medium">Etapa Inicial</label>
                  <select
                    value={newLeadForm.etapa}
                    onChange={(e) => setNewLeadForm({ ...newLeadForm, etapa: e.target.value })}
                    className="w-full bg-[#131926] border border-slate-700 rounded-lg p-2 text-orange-400 font-semibold"
                  >
                    <option value="contactado">Contactado</option>
                    <option value="reunion">Reunión / Demo</option>
                    <option value="propuesta_enviada">Propuesta Enviada</option>
                    <option value="negociacion">En Negociación</option>
                    <option value="ganado">👑 Cerrado Ganado (Cliente Oficial)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-slate-400 block mb-1 font-medium">Teléfono / WhatsApp</label>
                  <input
                    type="text"
                    value={newLeadForm.telefono}
                    onChange={(e) => setNewLeadForm({ ...newLeadForm, telefono: e.target.value })}
                    placeholder="+503 7000 0000 o +1 809..."
                    className="w-full bg-[#131926] border border-slate-700 rounded-lg p-2 text-white"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1 font-medium">Correo Electrónico</label>
                  <input
                    type="email"
                    value={newLeadForm.email}
                    onChange={(e) => setNewLeadForm({ ...newLeadForm, email: e.target.value })}
                    placeholder="contacto@empresa.com"
                    className="w-full bg-[#131926] border border-slate-700 rounded-lg p-2 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-slate-400 block mb-1 font-medium">Sitio Web / Dominio</label>
                  <input
                    type="text"
                    value={newLeadForm.dominio}
                    onChange={(e) => setNewLeadForm({ ...newLeadForm, dominio: e.target.value })}
                    placeholder="ej: clinicadental.com"
                    className="w-full bg-[#131926] border border-slate-700 rounded-lg p-2 text-white"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1 font-medium">Valor Estimado ($ USD)</label>
                  <input
                    type="number"
                    value={newLeadForm.valorEstimado}
                    onChange={(e) => setNewLeadForm({ ...newLeadForm, valorEstimado: Number(e.target.value) })}
                    className="w-full bg-[#131926] border border-slate-700 rounded-lg p-2 text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-400 block mb-1 font-medium">Notas Iniciales / Diagnóstico</label>
                <textarea
                  rows={2}
                  value={newLeadForm.notasIniciales}
                  onChange={(e) => setNewLeadForm({ ...newLeadForm, notasIniciales: e.target.value })}
                  placeholder="Dolores detectados, requerimientos, alcance o notas de la reunión..."
                  className="w-full bg-[#131926] border border-slate-700 rounded-lg p-2 text-white"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs mt-2 shadow-lg shadow-orange-950 transition-all flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>Guardar Ficha en Base de Datos</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: IMPORTAR LEADS DESDE SCRAPPER (FASE 1) */}
      {isImportScrapperModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0e1320] border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-slate-800 bg-[#121826] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center font-bold">
                  <Download className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white flex items-center gap-2">
                    <span>Importar Prospectos desde el Lead Scrapper (Fase 1)</span>
                    <span className="text-[11px] bg-sky-500/20 text-sky-300 px-2 py-0.5 rounded-full font-mono border border-sky-500/30">
                      {scrapperLeadsList.length} disponibles
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Transforma los prospectos scrapeados en fichas completas de clientes en el CRM
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsImportScrapperModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4 flex-1">
              {scrapperLeadsList.length === 0 ? (
                <div className="p-8 text-center bg-[#0c1017] rounded-xl border border-slate-800 space-y-2">
                  <p className="text-xs text-slate-400">
                    No hay prospectos almacenados en el Lead Scrapper todavía.
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Ve a la <strong>Fase 1: Motor Outbound & Scrapper</strong> para prospectar negocios en Google Maps o SERP y capturar leads.
                  </p>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between text-xs pb-1 border-b border-slate-800">
                    <span className="text-slate-400 font-mono">
                      Seleccionados: <strong className="text-sky-400">{selectedScrapperIds.size}</strong> de {scrapperLeadsList.length}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleSelectAllScrapper(true)}
                        className="text-[11px] text-sky-400 hover:underline font-medium"
                      >
                        Seleccionar Nuevos
                      </button>
                      <span className="text-slate-600">|</span>
                      <button
                        onClick={() => handleSelectAllScrapper(false)}
                        className="text-[11px] text-slate-400 hover:underline font-medium"
                      >
                        Deseleccionar
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                    {scrapperLeadsList.map(sl => {
                      const cleanP = (sl.telefono || '').replace(/\D/g, '');
                      const cleanN = (sl.nombreEmpresa || sl.dominio || '').toLowerCase().trim();
                      const alreadyInCrm = leads.some(l => 
                        (l.telefono && cleanP && (l.telefono || '').replace(/\D/g, '') === cleanP) ||
                        (l.empresa && cleanN && (l.empresa || '').toLowerCase().trim() === cleanN)
                      );
                      const isChecked = selectedScrapperIds.has(sl.id);

                      return (
                        <div
                          key={sl.id}
                          onClick={() => {
                            if (!alreadyInCrm) handleToggleSelectScrapper(sl.id);
                          }}
                          className={`p-3 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                            alreadyInCrm
                              ? 'bg-[#090d15] border-slate-800/50 opacity-60 cursor-not-allowed'
                              : isChecked
                              ? 'bg-sky-950/20 border-sky-500/50 cursor-pointer shadow-sm'
                              : 'bg-[#0c1017] border-slate-800 hover:border-slate-700 cursor-pointer'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              disabled={alreadyInCrm}
                              onChange={() => handleToggleSelectScrapper(sl.id)}
                              className="rounded border-slate-700 text-sky-600 focus:ring-0 cursor-pointer"
                            />
                            <div className="min-w-0">
                              <div className="font-bold text-xs text-white truncate flex items-center gap-1.5">
                                <span>{sl.nombreEmpresa || sl.dominio}</span>
                                <span className="text-[10px] font-mono px-1 rounded bg-slate-800 text-slate-400">
                                  {sl.pais === 'DO' ? '🇩🇴' : '🇸🇻'}
                                </span>
                                {alreadyInCrm && (
                                  <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.2 rounded font-sans font-medium border border-emerald-500/30">
                                    Ya en CRM
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-slate-400 truncate mt-0.5 flex items-center gap-2">
                                <span>{sl.responsable || 'Dirección'}</span>
                                {sl.telefono && <span className="text-emerald-400 font-mono">{sl.telefono}</span>}
                                {sl.sinWeb && (
                                  <span className="text-amber-400 text-[10px] flex items-center gap-0.5">
                                    <MapPin className="w-2.5 h-2.5" />
                                    <span>Google Maps</span>
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <span className="text-[11px] font-mono font-bold text-orange-400">
                              {sl.estado === 'cliente' ? 'Cliente' : 'Prospecto'}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>

            <div className="p-4 bg-[#121826] border-t border-slate-800 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setIsImportScrapperModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={handleExecuteImportFromScrapper}
                disabled={selectedScrapperIds.size === 0}
                className="px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 disabled:opacity-40 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-sky-950 transition-all"
              >
                <Download className="w-4 h-4" />
                <span>Importar {selectedScrapperIds.size} Prospectos al CRM</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. MODAL DE VINCULACIÓN MULTI-LÍNEA WHATSAPP REAL (CÓDIGO QR A $0 COSTO) */}
      {isQrModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0f1422] border border-slate-700/80 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-4 bg-[#131926] border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-sm">
                  <QrCode className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white flex items-center gap-2">
                    <span>Vincular WhatsApp Web Real</span>
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded font-mono border border-emerald-500/30">
                      $0 Costo
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Soporte multicuenta para El Salvador y República Dominicana
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsQrModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Country Tabs */}
            <div className="p-3 bg-[#0c101a] border-b border-slate-800 flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSelectedQrCountry('SV')}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                  selectedQrCountry === 'SV'
                    ? 'bg-slate-800 text-emerald-400 border border-emerald-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
              >
                <span>🇸🇻 El Salvador (+503)</span>
                <span className={`w-2 h-2 rounded-full ${waSessions.SV?.status === 'connected' ? 'bg-emerald-400' : 'bg-slate-600'}`}></span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedQrCountry('DO')}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                  selectedQrCountry === 'DO'
                    ? 'bg-slate-800 text-emerald-400 border border-emerald-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
              >
                <span>🇩🇴 Rep. Dominicana (+1)</span>
                <span className={`w-2 h-2 rounded-full ${waSessions.DO?.status === 'connected' ? 'bg-emerald-400' : 'bg-slate-600'}`}></span>
              </button>
            </div>

            {/* Modal Body */}
            {(() => {
              const activeSession = waSessions[selectedQrCountry] || {};
              const isConnected = activeSession.status === 'connected';
              const isQrReady = activeSession.status === 'qr_ready' && activeSession.qrCode;
              const isConnecting = isConnectingSession || activeSession.status === 'connecting';

              return (
                <div className="p-6 flex flex-col items-center text-center space-y-4">
                  {backendOfflineNotice && (
                    <div className="w-full bg-amber-500/10 border border-amber-500/30 rounded-xl p-3.5 text-xs text-amber-300 text-left space-y-1.5 animate-fadeIn">
                      <div className="font-bold flex items-center gap-1.5 text-amber-400">
                        <span>⚠️</span>
                        <span>Motor de WhatsApp Web Local Requerido</span>
                      </div>
                      <p className="text-slate-300 text-[11px] leading-relaxed">
                        Para operar sin costos de API ($0), la conexión de WhatsApp Web corre a través de Node.js en tu equipo.
                      </p>
                      <div className="bg-[#090d16] p-2 rounded-lg border border-slate-800 text-[11px] font-mono text-slate-300 space-y-1">
                        <div>1. Verifica que la terminal tenga: <strong className="text-emerald-400">npm run dev</strong></div>
                        <div>2. Abre la app en tu navegador en: <a href="http://localhost:5173" target="_blank" rel="noreferrer" className="text-emerald-400 underline font-bold">http://localhost:5173</a></div>
                      </div>
                    </div>
                  )}

                  {isConnected ? (
                    <div className="w-full bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-5 space-y-3">
                      <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto text-xl">
                        <CheckCircle2 className="w-7 h-7" />
                      </div>
                      <div>
                        <h4 className="font-bold text-white text-sm">
                          ¡Línea de {selectedQrCountry === 'SV' ? 'El Salvador' : 'República Dominicana'} Conectada!
                        </h4>
                        <p className="text-xs text-emerald-300 font-mono mt-1">
                          Número activo: +{activeSession.phoneNumber || 'Vinculado'}
                        </p>
                        <p className="text-[11px] text-slate-400 mt-2">
                          Esta sesión se encuentra activa en el servidor y guardada en disco de forma permanente.
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleDisconnectSession(selectedQrCountry)}
                        className="px-3.5 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 text-xs font-semibold flex items-center justify-center gap-1.5 mx-auto transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Desvincular esta línea</span>
                      </button>
                    </div>
                  ) : isQrReady ? (
                    <div className="space-y-4 w-full">
                      <div className="bg-white p-3 rounded-2xl shadow-xl inline-block border-2 border-emerald-500">
                        <img
                          src={activeSession.qrCode}
                          alt="Código QR de WhatsApp"
                          className="w-56 h-56 mx-auto object-contain"
                        />
                      </div>

                      <div className="bg-[#141b2a] border border-slate-800 rounded-xl p-3.5 text-left text-xs space-y-1.5">
                        <div className="font-bold text-slate-200 mb-1 flex items-center gap-1.5">
                          <span>📱</span>
                          <span>Instrucciones para escanear en tu teléfono:</span>
                        </div>
                        <p className="text-slate-400">1. Abre WhatsApp en el teléfono correspondiente a <strong>{selectedQrCountry === 'SV' ? 'El Salvador' : 'República Dominicana'}</strong>.</p>
                        <p className="text-slate-400">2. Toca <strong>Menú (⋮)</strong> o <strong>Ajustes</strong> y selecciona <strong>Dispositivos vinculados</strong>.</p>
                        <p className="text-slate-400">3. Toca <strong>Vincular un dispositivo</strong> y apunta tu cámara a este código QR.</p>
                      </div>

                      <div className="flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleStartSession(selectedQrCountry)}
                          disabled={isConnecting}
                          className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                        >
                          <RefreshCw className={`w-3.5 h-3.5 ${isConnecting ? 'animate-spin' : ''}`} />
                          <span>Regenerar QR</span>
                        </button>
                      </div>
                    </div>
                  ) : isConnecting ? (
                    <div className="py-12 space-y-3">
                      <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin mx-auto" />
                      <p className="text-xs text-slate-300 font-medium">
                        Iniciando socket seguro con WhatsApp Web...
                      </p>
                      <p className="text-[11px] text-slate-500">
                        Generando código QR para {selectedQrCountry === 'SV' ? 'El Salvador' : 'Rep. Dominicana'}
                      </p>
                    </div>
                  ) : (
                    <div className="py-8 space-y-4 w-full">
                      <div className="w-14 h-14 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center mx-auto text-slate-400">
                        <QrCode className="w-7 h-7" />
                      </div>
                      <div>
                        <h4 className="font-bold text-white text-sm">
                          Línea de {selectedQrCountry === 'SV' ? 'El Salvador 🇸🇻' : 'Rep. Dominicana 🇩🇴'} no vinculada
                        </h4>
                        <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
                          Al vincularla, podrás enviar y recibir mensajes directamente desde esta pantalla sin salir de la plataforma.
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleStartSession(selectedQrCountry)}
                        className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 mx-auto shadow-lg shadow-emerald-950 transition-all"
                      >
                        <QrCode className="w-4 h-4" />
                        <span>Generar Código QR para Vincular</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Modal Footer */}
            <div className="p-3 bg-[#131926] border-t border-slate-800 text-center">
              <span className="text-[11px] text-slate-500 font-mono">
                Tecnología Baileys WebSocket · Datos encriptados localmente · Cero intermediarios
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 7. MODAL INICIAR NUEVO CHAT REAL DE WHATSAPP */}
      {isNewChatModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0f1422] border border-slate-700/80 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="p-4 bg-[#131926] border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-sm">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white">Iniciar Nuevo Chat Real</h3>
                  <p className="text-[11px] text-slate-400">
                    Desde tu línea {waSessions.DO?.status === 'connected' ? '🇩🇴 Rep. Dominicana (+1829...)' : 'vinculada'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsNewChatModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleStartNewRealChat} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="text-slate-300 font-semibold block mb-1">
                  Número de WhatsApp <span className="text-emerald-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newChatForm.telefono}
                  onChange={(e) => setNewChatForm({ ...newChatForm, telefono: e.target.value })}
                  placeholder="ej: 829 555 1234 o +1 829..."
                  className="w-full bg-[#131926] border border-slate-700 rounded-xl p-2.5 text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 text-sm font-mono"
                />
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Puedes escribirlo con o sin código de país.
                </span>
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">
                  Nombre del Contacto / Prospecto (Opcional)
                </label>
                <input
                  type="text"
                  value={newChatForm.contacto}
                  onChange={(e) => setNewChatForm({ ...newChatForm, contacto: e.target.value })}
                  placeholder="ej: Lic. Carlos Pérez"
                  className="w-full bg-[#131926] border border-slate-700 rounded-xl p-2.5 text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">
                  Empresa o Proyecto (Opcional)
                </label>
                <input
                  type="text"
                  value={newChatForm.empresa}
                  onChange={(e) => setNewChatForm({ ...newChatForm, empresa: e.target.value })}
                  placeholder="ej: Inmobiliaria Santo Domingo"
                  className="w-full bg-[#131926] border border-slate-700 rounded-xl p-2.5 text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">
                  Línea Emisora a Utilizar
                </label>
                <select
                  value={newChatForm.pais}
                  onChange={(e) => setNewChatForm({ ...newChatForm, pais: e.target.value })}
                  className="w-full bg-[#131926] border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
                >
                  <option value="DO">🇩🇴 Rep. Dominicana (+1) {waSessions.DO?.status === 'connected' ? '🟢 Conectada' : '🔴'}</option>
                  <option value="SV">🇸🇻 El Salvador (+503) {waSessions.SV?.status === 'connected' ? '🟢 Conectada' : '🔴'}</option>
                </select>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-950 transition-all"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Comenzar Conversación</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
