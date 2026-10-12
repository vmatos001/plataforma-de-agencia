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
  RefreshCw
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

// Semilla inicial enriquecida para que la plataforma nunca esté vacía
const SEED_CRM_LEADS = [
  {
    id: "crm-lead-1",
    empresa: "Inmobiliarias Punta Cana Moderno Santo Domingo",
    contacto: "Lic. Marcos Almonte",
    cargo: "Director General & Socio",
    email: "marcos@inmobiliariaspuntacanamodernosantodomingo.do",
    telefono: "+1 809 6845-5645",
    pais: "DO",
    dominio: "inmobiliariaspuntacanamodernosantodomingo.do",
    etapa: "nuevo",
    valorEstimado: 950,
    probabilidad: 10,
    fuente: "Scraper Google SERP",
    portalToken: "portal-lead-1",
    interacciones: [
      { id: "int-1", tipo: "nota", fecha: "2026-10-09", titulo: "Diagnóstico Inicial Detectado", detalle: "Prospecto captado vía Scraper. Puntos críticos: falta de Schema JSON-LD y tiempo de respuesta." }
    ],
    whatsappData: {
      telefono: "+1 809 6845-5645",
      temperatura: "tibio",
      estadoSeguimiento: "dia_1_valor",
      mensajes: [
        { id: "wa-1-1", emisor: "agencia", texto: "¡Hola Lic.! 👋 Qué gusto saludarte. Vi el sitio de Inmobiliarias Punta Cana Moderno Santo Domingo y noté que tarda más de 4.5s en abrir en celulares en conexiones locales. ¿Me permites hacerte un par de preguntas rápidas sobre cómo están captando clientes hoy?", fechaHora: "09 Oct 10:30", leido: true },
        { id: "wa-1-2", emisor: "cliente", texto: "Hola, buenos días. Sí, cuéntame qué detectaron. La web la hicieron hace tiempo y casi no nos genera contactos directos.", fechaHora: "09 Oct 11:05", leido: true }
      ]
    }
  },
  {
    id: "crm-lead-2",
    empresa: "Grupo Inmobiliarias Punta Cana Caribe",
    contacto: "Lic. Marcos Almonte",
    cargo: "Director General & Socio",
    email: "gerencia@grupoinmobiliariaspuntacanacaribe.com",
    telefono: "+1 809 555-8900",
    pais: "DO",
    dominio: "grupoinmobiliariaspuntacanacaribe.com",
    etapa: "reunion",
    valorEstimado: 1500,
    probabilidad: 45,
    fuente: "Google Maps",
    portalToken: "portal-lead-2",
    interacciones: [],
    whatsappData: {
      telefono: "+1 809 555-8900",
      temperatura: "tibio",
      estadoSeguimiento: "dia_1_valor",
      mensajes: [
        { id: "wa-2-1", emisor: "agencia", texto: "Hola Lic. Marcos, gracias por la llamada de ayer. Quedamos en revisar la demo de alta conversión el jueves a las 10:00 AM.", fechaHora: "10 Oct 14:00", leido: true }
      ]
    }
  },
  {
    id: "crm-lead-3",
    empresa: "Clínica Dental San Salvador",
    contacto: "Dr. Carlos Rodríguez",
    cargo: "Director Médico & Propietario",
    email: "dr.rodriguez@clinicadentalsv.com",
    telefono: "+503 2260-4490",
    pais: "SV",
    dominio: "clinicadentalsv.com",
    etapa: "propuesta_enviada",
    presupuestoMonto: 2200,
    valorEstimado: 2200,
    probabilidad: 65,
    fuente: "Google Maps",
    portalToken: "portal-lead-3",
    interacciones: [],
    whatsappData: {
      telefono: "+503 2260-4490",
      temperatura: "caliente",
      estadoSeguimiento: "dia_3_seguimiento",
      mensajes: [
        { id: "wa-3-1", emisor: "agencia", texto: "Estimado Dr. Rodríguez, ya le compartimos el presupuesto formal en su portal. Quedamos atentos a cualquier duda.", fechaHora: "11 Oct 11:30", leido: true }
      ]
    }
  },
  {
    id: "crm-lead-4",
    empresa: "Punta Cana Prime Realty",
    contacto: "Lic. Alejandro Mendoza",
    cargo: "Managing Director",
    email: "alejandro@puntacanaprime.do",
    telefono: "+1 809 552-0199",
    pais: "DO",
    dominio: "puntacanaprime.do",
    etapa: "propuesta_enviada",
    presupuestoMonto: 1800,
    valorEstimado: 1800,
    probabilidad: 60,
    fuente: "Scraper Google",
    portalToken: "portal-lead-4",
    interacciones: [],
    whatsappData: {
      telefono: "+1 809 552-0199",
      temperatura: "caliente",
      estadoSeguimiento: "dia_3_seguimiento",
      mensajes: [
        { id: "wa-4-1", emisor: "agencia", texto: "Hola Alejandro, propuesta enviada por correo. ¿Pudiste revisarla?", fechaHora: "11 Oct 15:20", leido: true }
      ]
    }
  },
  {
    id: "crm-lead-5",
    empresa: "Lex Consultores Legales",
    contacto: "Dra. Sofía Valiente",
    cargo: "Socia Directora",
    email: "contacto@lexcorporativo.sv",
    telefono: "+503 2505-1200",
    pais: "SV",
    dominio: "lexcorporativo.sv",
    etapa: "perdido",
    valorEstimado: 3200,
    probabilidad: 0,
    fuente: "Google SERP",
    portalToken: "portal-lead-5",
    interacciones: [],
    whatsappData: {
      telefono: "+503 2505-1200",
      temperatura: "frio",
      estadoSeguimiento: "dia_7_cierre",
      mensajes: [
        { id: "wa-5-1", emisor: "agencia", texto: "Estimada Dra. Sofía, dejamos la propuesta en pausa. Éxitos en sus proyectos.", fechaHora: "09 Oct 18:00", leido: true }
      ]
    }
  }
];

export default function CrmPortalModule({ onConvertToPresupuesto, onOpenContrato }) {
  // Persistencia local resiliente: Si recargas (F5), se lee de localStorage
  const [leads, setLeads] = useState(() => {
    try {
      if (typeof window !== 'undefined') {
        const cached = localStorage.getItem('goglite_crm_leads');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      }
    } catch (e) {
      console.warn('Error leyendo goglite_crm_leads de localStorage:', e);
    }
    return SEED_CRM_LEADS;
  });

  const [loading, setLoading] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState(() => {
    return (typeof window !== 'undefined' && localStorage.getItem('goglite_crm_country')) || 'ALL';
  });
  const [searchTerm, setSearchTerm] = useState('');
  
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

  const [dragOverStage, setDragOverStage] = useState(null);
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);
  const [draggingLeadId, setDraggingLeadId] = useState(null);
  
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
  const [waRole, setWaRole] = useState('agencia'); // 'agencia' | 'cliente'
  const [waMessageInput, setWaMessageInput] = useState('');
  const [waScriptCategory, setWaScriptCategory] = useState('todos'); // 'todos' | 'diagnostico' | 'solucion' | 'objeciones' | 'followup' | 'cierre'
  const [waNotice, setWaNotice] = useState(null);

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

  // Helper para resolver URL del backend (local o producción)
  const getBackendEndpoint = (endpoint) => {
    if (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
      return `http://localhost:3001${endpoint}`;
    }
    return endpoint;
  };

  // Polling de sesiones de WhatsApp (cada 5s normal, cada 2s con modal abierto)
  useEffect(() => {
    let isMounted = true;
    const fetchSessions = async () => {
      try {
        let res;
        try {
          res = await fetch('/api/whatsapp/sessions');
          if (!res.ok && res.status === 404) throw new Error('404');
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

  // Helper para persistir leads siempre en localStorage
  const updateAndPersistLeads = (updater) => {
    setLeads(prev => {
      const nextLeads = typeof updater === 'function' ? updater(prev) : updater;
      if (typeof window !== 'undefined') {
        localStorage.setItem('goglite_crm_leads', JSON.stringify(nextLeads));
      }
      return nextLeads;
    });
  };

  // Fetch leads de API y sincronizar con localStorage
  useEffect(() => {
    fetchCrmLeads();
  }, []);

  const fetchCrmLeads = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/crm/leads');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          updateAndPersistLeads(data);
          if (!selectedPortalLeadId) setSelectedPortalLeadId(data[0].id);
          if (!selectedWaLeadId) setSelectedWaLeadId(data[0].id);
        }
      }
    } catch (err) {
      console.warn('API de CRM offline o estática, operando con almacenamiento local:', err);
      // Aseguramos persistencia de la semilla si estaba vacía
      if (leads.length === 0) {
        updateAndPersistLeads(SEED_CRM_LEADS);
      }
    } finally {
      setLoading(false);
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

  // Limpiar prospectos simulados iniciales
  const handleClearMockLeads = () => {
    if (!confirm('¿Deseas eliminar las conversaciones de demostración iniciales para dejar únicamente tus contactos reales?')) return;
    const mockIds = ['crm-lead-1', 'crm-lead-2', 'crm-lead-3', 'crm-lead-4', 'crm-lead-5'];
    updateAndPersistLeads(prev => {
      const filtered = prev.filter(l => !mockIds.includes(l.id));
      if (filtered.length > 0) setSelectedWaLeadId(filtered[0].id);
      return filtered;
    });
    setWaNotice('Conversaciones de ejemplo eliminadas');
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
      interacciones: [],
      whatsappData: {
        telefono: newLeadForm.telefono,
        mensajes: [],
        ultimoMensajeFecha: 'Ahora',
        etapaConversacion: 'primer_contacto'
      },
      createdAt: new Date().toISOString()
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
      pais: 'SV',
      dominio: '',
      valorEstimado: 1500,
      etapa: 'nuevo',
      notasIniciales: ''
    });

    // 2. Sincronizar en segundo plano
    try {
      const res = await fetch('/api/crm/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newLeadForm)
      });
      if (res.ok) {
        const created = await res.json();
        updateAndPersistLeads(prev => prev.map(l => l.id === tempLead.id ? created : l));
      }
    } catch (err) {
      console.warn('Lead guardado localmente (backend offline):', err);
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

  // Lógica de Presupuesto real: solo existe cotización a partir de propuesta enviada o con ID vinculado
  const STAGES_CON_PRESUPUESTO = ['propuesta_enviada', 'propuesta', 'negociacion', 'ganado'];
  const tienePresupuesto = (lead) => {
    return STAGES_CON_PRESUPUESTO.includes(lead.etapa) || Boolean(lead.portalConfig?.presupuestoId) || Boolean(lead.presupuestoId);
  };

  // Calculate metrics: Pipeline Activo solo suma cotizaciones emitidas en negociación/propuesta
  const leadsCotizadosActivos = filteredLeads.filter(l => ['propuesta_enviada', 'propuesta', 'negociacion'].includes(l.etapa));
  const totalPipeline = leadsCotizadosActivos.reduce((acc, l) => acc + (Number(l.presupuestoMonto || l.valorEstimado) || 0), 0);
  const totalGanado = filteredLeads.filter(l => l.etapa === 'ganado').reduce((acc, l) => acc + (Number(l.presupuestoMonto || l.valorEstimado) || 0), 0);
  const leadsGanadosCount = filteredLeads.filter(l => l.etapa === 'ganado').length;
  const tasaConversion = filteredLeads.length > 0 ? Math.round((leadsGanadosCount / filteredLeads.length) * 100) : 0;
  const leadsEnProspeccion = filteredLeads.filter(l => ['nuevo', 'contactado', 'reunion', 'reunion_demo'].includes(l.etapa)).length;

  // Selected lead for portal preview
  const currentPortalLead = leads.find(l => l.id === selectedPortalLeadId) || leads[0];

  return (
    <div className="flex-1 overflow-y-auto bg-[#080b11] p-6 text-slate-100 flex flex-col gap-6">
      
      {/* 1. TOP STATS BAR */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-[#0e131f] border border-slate-800/80 flex items-center justify-between shadow-sm">
          <div>
            <div className="text-xs font-mono uppercase text-slate-400 font-semibold">Pipeline Cotizado</div>
            <div className="text-2xl font-black text-white mt-1">
              ${totalPipeline.toLocaleString()} <span className="text-xs font-normal text-slate-400">USD</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">{leadsCotizadosActivos.length} propuestas en curso · {leadsEnProspeccion} en prospección</div>
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
              onClick={() => setActiveTab('whatsapp_crm')}
              className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-colors ${activeTab === 'whatsapp_crm' ? 'bg-emerald-600/25 text-emerald-400 border border-emerald-500/40 font-semibold' : 'text-slate-400 hover:text-slate-200'}`}
            >
              <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
              <span>WhatsApp CRM</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
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

      {/* 3. MAIN CONTENT: KANBAN VERTICAL CON DRAG & DROP */}
      {activeTab === 'kanban' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-8 select-none">
          <div className="md:col-span-2 flex items-center justify-between text-xs text-slate-400 px-1">
            <span className="flex items-center gap-1.5 font-medium">
              <span>💡</span>
              <span>Puedes arrastrar las tarjetas con el ratón de una fase a otra para mover el estado del cliente.</span>
            </span>
            <span className="font-mono text-[11px] text-slate-500">
              7 Fases en Embudo Vertical
            </span>
          </div>

          {PIPELINE_STAGES.map((stage, sIdx) => {
            const stageLeads = filteredLeads.filter(l => {
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
                              <div className="shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#090d16] border border-slate-800 text-xs font-medium text-slate-300">
                                <span>{lead.pais === 'SV' ? '🇸🇻' : '🇩🇴'}</span>
                                <span className="text-[11px]">{lead.pais === 'SV' ? 'El Salvador' : 'Rep. Dom.'}</span>
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
                    
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* WHATSAPP CRM & CONVERSATIONAL SELLING SUITE */}
      {/* WHATSAPP CRM & CONVERSATIONAL SELLING SUITE (ESTILO WHATSAPP WEB) */}
      {activeTab === 'whatsapp_crm' && (
        <div className="bg-[#0e1320] border border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col h-[740px]">
          
          {/* Top Banner / Strategy & Multi-Session bar */}
          <div className="px-5 py-2.5 bg-[#131926] border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-bold text-white flex items-center gap-1.5 mr-2">
                <MessageSquare className="w-4 h-4 text-emerald-400" />
                <span>WhatsApp Multi-Línea</span>
              </span>

              {/* Pill Línea El Salvador */}
              <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] font-mono ${
                waSessions.SV?.status === 'connected'
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                  : 'bg-slate-800/80 border-slate-700/80 text-slate-400'
              }`}>
                <span className={`w-2 h-2 rounded-full ${waSessions.SV?.status === 'connected' ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`}></span>
                <span className="font-bold">🇸🇻 SV:</span>
                <span>{waSessions.SV?.status === 'connected' ? `+${waSessions.SV.phoneNumber || '503'}` : 'Desconectada'}</span>
              </div>

              {/* Pill Línea República Dominicana */}
              <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] font-mono ${
                waSessions.DO?.status === 'connected'
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                  : 'bg-slate-800/80 border-slate-700/80 text-slate-400'
              }`}>
                <span className={`w-2 h-2 rounded-full ${waSessions.DO?.status === 'connected' ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`}></span>
                <span className="font-bold">🇩🇴 DO:</span>
                <span>{waSessions.DO?.status === 'connected' ? `+${waSessions.DO.phoneNumber || '1'}` : 'Desconectada'}</span>
              </div>

              {/* Botón Abrir Modal de QR */}
              <button
                type="button"
                onClick={() => setIsQrModalOpen(true)}
                className="ml-1 px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center gap-1.5 shadow-sm transition-all"
              >
                <QrCode className="w-3.5 h-3.5" />
                <span>Vincular por Código QR</span>
              </button>
            </div>

            <div className="flex items-center gap-3">
              {waNotice && (
                <div className="px-2.5 py-1 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-medium text-[11px] animate-fadeIn">
                  {waNotice}
                </div>
              )}
              <div className="text-[11px] text-slate-400 font-mono hidden sm:block">
                {filteredLeads.length} prospectos activos
              </div>
            </div>
          </div>

          {/* 2-Column Workspace (Estilo WhatsApp Web: 30% Contactos · 70% Conversación) */}
          <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
            
            {/* APARTADO 1: BANDEJA DE CONVERSACIONES RECIENTES (30% DEL ANCHO) */}
            <div className="w-full md:w-[30%] lg:w-[30%] shrink-0 border-r border-slate-800 flex flex-col bg-[#0b0f19]">
              {/* Inbox Header & Search */}
              <div className="p-3 border-b border-slate-800 space-y-2.5">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Buscar conversación..."
                    value={waSearchTerm}
                    onChange={(e) => setWaSearchTerm(e.target.value)}
                    className="w-full bg-[#131926] border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500/50"
                  />
                </div>

                {/* Filter chips for temperature */}
                <div className="flex items-center gap-1 overflow-x-auto pb-1 text-[11px]">
                  <button
                    onClick={() => setWaTemperatureFilter('ALL')}
                    className={`px-2 py-0.5 rounded-md transition-colors shrink-0 ${waTemperatureFilter === 'ALL' ? 'bg-slate-700 text-white font-semibold' : 'text-slate-400 hover:text-slate-200'}`}
                  >
                    Todos ({filteredLeads.length})
                  </button>
                  <button
                    onClick={() => setWaTemperatureFilter('caliente')}
                    className={`px-2 py-0.5 rounded-md transition-colors shrink-0 ${waTemperatureFilter === 'caliente' ? 'bg-amber-500/30 text-amber-300 font-semibold border border-amber-500/40' : 'text-slate-400 hover:text-slate-200'}`}
                  >
                    🔥 Calientes
                  </button>
                  <button
                    onClick={() => setWaTemperatureFilter('tibio')}
                    className={`px-2 py-0.5 rounded-md transition-colors shrink-0 ${waTemperatureFilter === 'tibio' ? 'bg-yellow-500/30 text-yellow-300 font-semibold border border-yellow-500/40' : 'text-slate-400 hover:text-slate-200'}`}
                  >
                    🟡 Tibios
                  </button>
                  <button
                    onClick={() => setWaTemperatureFilter('frio')}
                    className={`px-2 py-0.5 rounded-md transition-colors shrink-0 ${waTemperatureFilter === 'frio' ? 'bg-sky-500/30 text-sky-300 font-semibold border border-sky-500/40' : 'text-slate-400 hover:text-slate-200'}`}
                  >
                    ❄️ Fríos
                  </button>
                </div>

                {/* Acciones de Bandeja: Iniciar Chat Real y Limpiar Mockups */}
                <div className="pt-2 flex items-center justify-between gap-1.5 border-t border-slate-800/80">
                  <button
                    type="button"
                    onClick={() => setIsNewChatModalOpen(true)}
                    className="flex-1 py-1.5 px-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Iniciar Chat Real</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleClearMockLeads}
                    className="py-1.5 px-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 text-[10px] font-medium transition-colors"
                    title="Eliminar las conversaciones iniciales de prueba para dejar la bandeja limpia"
                  >
                    Limpiar Ejemplos
                  </button>
                </div>
              </div>

              {/* Chat list */}
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
                    const lastMsg = leadItem.whatsappData?.mensajes?.[leadItem.whatsappData.mensajes.length - 1];
                    const temp = leadItem.whatsappData?.temperatura || 'tibio';
                    const tempConfig = TEMPERATURE_CONFIG[temp] || TEMPERATURE_CONFIG.tibio;
                    const stageTag = FOLLOWUP_STAGES.find(s => s.id === (leadItem.whatsappData?.estadoSeguimiento || 'esperando_respuesta')) || FOLLOWUP_STAGES[0];

                    return (
                      <div
                        key={leadItem.id}
                        onClick={() => setSelectedWaLeadId(leadItem.id)}
                        className={`p-3 cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-[#141c2c] border-l-4 border-emerald-500 shadow-inner'
                            : 'hover:bg-slate-900/60'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-xs text-emerald-400 shrink-0">
                              {leadItem.contacto?.charAt(0) || 'C'}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1">
                                <span className="font-bold text-xs text-white truncate max-w-[110px]">
                                  {leadItem.contacto}
                                </span>
                                <span className="text-[10px] shrink-0">{leadItem.pais === 'SV' ? '🇸🇻' : '🇩🇴'}</span>
                              </div>
                              <div className="text-[11px] text-slate-400 truncate max-w-[120px]">
                                {leadItem.empresa}
                              </div>
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <span className="text-[10px] text-slate-500 font-mono">
                              {lastMsg?.fechaHora?.split(' ')?.[1] || 'Reciente'}
                            </span>
                          </div>
                        </div>

                        {/* Last message preview */}
                        <div className="mt-1.5 text-[11px] text-slate-400 truncate line-clamp-1">
                          {lastMsg ? (
                            <span>
                              <span className="text-slate-500 font-semibold">{lastMsg.emisor === 'agencia' ? 'Tú: ' : ''}</span>
                              {lastMsg.texto}
                            </span>
                          ) : (
                            <span className="italic text-slate-600">Sin mensajes aún</span>
                          )}
                        </div>

                        {/* Pills */}
                        <div className="mt-2 flex items-center justify-between gap-1">
                          <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${tempConfig.badge}`}>
                            {tempConfig.icon} {tempConfig.label}
                          </span>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${stageTag.color} truncate max-w-[120px]`}>
                            {stageTag.label}
                          </span>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* APARTADO 2: CONVERSACIÓN ACTUAL (70% DEL ANCHO · AMPLIA Y ORGÁNICA) */}
            {(() => {
              const currentLead = leads.find(l => l.id === selectedWaLeadId) || filteredLeads[0];
              if (!currentLead) {
                return (
                  <div className="flex-1 md:w-[70%] flex items-center justify-center text-slate-500 text-sm">
                    Selecciona una conversación para comenzar
                  </div>
                );
              }

              const cleanPhone = (currentLead.whatsappData?.telefono || currentLead.telefono || '').replace(/[^\d]/g, '');
              const messages = currentLead.whatsappData?.mensajes || [];

              return (
                <div className="flex-1 min-w-0 md:w-[70%] flex flex-col bg-[#0a0e17] overflow-hidden relative">
                  
                  {/* Chat Header: Espacioso con separación orgánica de acciones y metadatos */}
                  <div className="p-3.5 bg-[#0f1422] border-b border-slate-800 flex flex-col gap-3 shadow-md z-10">
                    {/* Fila 1: Contacto + Acciones Principales */}
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center font-bold text-white text-sm shadow-md shrink-0">
                          {currentLead.contacto?.charAt(0) || 'C'}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-sm text-white truncate">{currentLead.contacto}</h4>
                            <span className="text-xs shrink-0">{currentLead.pais === 'SV' ? '🇸🇻 El Salvador' : '🇩🇴 Rep. Dominicana'}</span>
                          </div>
                          <div className="text-xs text-slate-400 flex items-center gap-2 truncate">
                            <span className="font-medium text-slate-300 truncate">{currentLead.empresa}</span>
                            <span>·</span>
                            <span className="font-mono text-emerald-400 shrink-0">{currentLead.whatsappData?.telefono || currentLead.telefono}</span>
                          </div>
                        </div>
                      </div>

                      {/* Botones Principales (Grandes, cómodos, sin apiñarse) */}
                      <div className="flex items-center gap-2.5 shrink-0">
                        <a
                          href={`https://wa.me/${cleanPhone}`}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-950/50 transition-all"
                        >
                          <Smartphone className="w-3.5 h-3.5" />
                          <span>Abrir wa.me</span>
                        </a>

                        <button
                          type="button"
                          onClick={() => setIsCopilotOpen(!isCopilotOpen)}
                          className={`px-3.5 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-md transition-all ${
                            isCopilotOpen
                              ? 'bg-orange-600 text-white border border-orange-400 ring-2 ring-orange-500/30'
                              : 'bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 border border-orange-500/30'
                          }`}
                          title="Abrir panel con guiones de alta conversión"
                        >
                          <Zap className="w-3.5 h-3.5" />
                          <span>{isCopilotOpen ? 'Cerrar Copiloto' : '⚡ Copiloto de Ventas'}</span>
                        </button>
                      </div>
                    </div>

                    {/* Fila 2: Barra de Estado Comercial & Seguimiento (Píldoras bien ordenadas) */}
                    <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800/80 text-xs">
                      <div className="flex items-center gap-1.5 bg-[#141b2a] px-2.5 py-1 rounded-lg border border-slate-800 shrink-0">
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

                      <div className="flex items-center gap-1.5 bg-[#141b2a] px-2.5 py-1 rounded-lg border border-slate-800 shrink-0">
                        <span className="text-[10px] font-mono text-slate-400 font-semibold uppercase">Temperatura:</span>
                        <select
                          value={currentLead.whatsappData?.temperatura || 'tibio'}
                          onChange={(e) => handleUpdateWaMeta(currentLead.id, { temperatura: e.target.value })}
                          className="bg-transparent text-xs text-amber-300 font-bold focus:outline-none cursor-pointer"
                        >
                          <option value="caliente" className="bg-[#141b2a] text-amber-300">🔥 Caliente</option>
                          <option value="tibio" className="bg-[#141b2a] text-yellow-300">🟡 Tibio</option>
                          <option value="frio" className="bg-[#141b2a] text-sky-300">❄️ Frío</option>
                        </select>
                      </div>

                      <div className="flex items-center gap-1.5 bg-[#141b2a] px-2.5 py-1 rounded-lg border border-slate-800 shrink-0">
                        <span className="text-[10px] font-mono text-slate-400 font-semibold uppercase">Protocolo:</span>
                        <select
                          value={currentLead.whatsappData?.estadoSeguimiento || 'esperando_respuesta'}
                          onChange={(e) => handleUpdateWaMeta(currentLead.id, { estadoSeguimiento: e.target.value })}
                          className="bg-transparent text-xs text-sky-300 font-medium focus:outline-none cursor-pointer max-w-[170px]"
                        >
                          {FOLLOWUP_STAGES.map(st => (
                            <option key={st.id} value={st.id} className="bg-[#141b2a] text-slate-200">{st.label}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Chat Bubbles Stream (Amplio) */}
                  <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-3.5 bg-gradient-to-b from-[#0a0e17] to-[#070a10]">
                    <div className="text-center my-1">
                      <span className="px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-[10px] text-slate-400 font-mono">
                        Conversación activa · Lead captado para propuesta
                      </span>
                    </div>

                    {messages.length === 0 ? (
                      <div className="text-center py-12 text-slate-500 text-xs italic space-y-2">
                        <MessageSquare className="w-8 h-8 text-slate-700 mx-auto" />
                        <p>No hay mensajes registrados aún en este chat.</p>
                        <p className="text-[11px] text-slate-600">Usa el compositor abajo o haz clic en <strong>⚡ Copiloto de Ventas</strong> para insertar un guion probado.</p>
                      </div>
                    ) : (
                      messages.map((msg, idx) => {
                        const isAgency = msg.emisor === 'agencia';

                        return (
                          <div
                            key={msg.id || idx}
                            className={`flex flex-col ${isAgency ? 'items-end' : 'items-start'}`}
                          >
                            <div className="flex items-center gap-1.5 mb-1 px-1">
                              <span className="text-[10px] text-slate-500 font-mono">{msg.fechaHora}</span>
                              <span className={`text-[10px] font-semibold ${isAgency ? 'text-emerald-400' : 'text-sky-400'}`}>
                                {isAgency ? 'Tú (Goglite)' : currentLead.contacto}
                              </span>
                            </div>

                            <div
                              className={`max-w-[85%] md:max-w-[70%] p-3.5 rounded-2xl text-xs leading-relaxed whitespace-pre-wrap shadow-md ${
                                isAgency
                                  ? 'bg-emerald-600/20 border border-emerald-500/30 text-emerald-100 rounded-tr-none'
                                  : 'bg-[#151d2e] border border-slate-700/70 text-slate-200 rounded-tl-none'
                              }`}
                            >
                              {msg.texto}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Composer Bottom Area: Espacioso, orgánico y cómodo */}
                  <div className="p-4 bg-[#0f1422] border-t border-slate-800 space-y-2.5 z-10">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-1 bg-[#131926] p-1 rounded-xl border border-slate-800">
                        <button
                          type="button"
                          onClick={() => setWaRole('agencia')}
                          className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                            waRole === 'agencia' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          💬 Mensaje Enviado
                        </button>
                        <button
                          type="button"
                          onClick={() => setWaRole('cliente')}
                          className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                            waRole === 'cliente' ? 'bg-sky-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          📥 Respuesta del Cliente
                        </button>
                      </div>

                      {/* Quick variable inserts, Sending Line Selector & Copilot activator */}
                      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                        {/* Selector de Línea Emisora */}
                        <div className="flex items-center gap-1.5 bg-[#131926] px-2.5 py-1 rounded-lg border border-slate-800 text-[11px]">
                          <span className="text-slate-400 font-semibold">Línea Emisora:</span>
                          <select
                            value={selectedSendingLine}
                            onChange={(e) => setSelectedSendingLine(e.target.value)}
                            className="bg-transparent text-emerald-400 font-bold focus:outline-none cursor-pointer"
                          >
                            <option value="SV" className="bg-[#131926] text-slate-200">
                              🇸🇻 El Salvador {waSessions.SV?.status === 'connected' ? '🟢 Conectada' : '🔴 Desconectada'}
                            </option>
                            <option value="DO" className="bg-[#131926] text-slate-200">
                              🇩🇴 Rep. Dominicana {waSessions.DO?.status === 'connected' ? '🟢 Conectada' : '🔴 Desconectada'}
                            </option>
                          </select>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setWaMessageInput(prev => prev + ` ¡Hola ${currentLead.contacto.split(' ')[0]}!`)}
                            className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-medium transition-colors"
                          >
                            + {currentLead.contacto.split(' ')[0]}
                          </button>
                          <button
                            type="button"
                            onClick={() => setIsCopilotOpen(true)}
                            className="px-2.5 py-1 rounded-lg bg-orange-500/15 hover:bg-orange-500/25 text-orange-400 border border-orange-500/30 text-[11px] font-bold flex items-center gap-1 transition-colors"
                          >
                            <Zap className="w-3 h-3" />
                            <span>Ver Guiones</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Composer Input & Buttons */}
                    <form onSubmit={handleSendWaMessage} className="flex gap-2.5 items-end">
                      <textarea
                        rows={2}
                        value={waMessageInput}
                        onChange={(e) => setWaMessageInput(e.target.value)}
                        placeholder={waRole === 'agencia' ? "Escribe un mensaje de WhatsApp o selecciona un guion del copiloto..." : "Registra la respuesta recibida del cliente..."}
                        className="flex-1 bg-[#141a29] border border-slate-700/80 rounded-xl p-3 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500/60 resize-none leading-relaxed"
                      />

                      <div className="flex flex-col gap-1.5 shrink-0">
                        {/* Botón Principal: Enviar por WhatsApp Web Real */}
                        <button
                          type="button"
                          onClick={() => handleSendRealWhatsAppViaLine(currentLead, waMessageInput, selectedSendingLine)}
                          disabled={!waMessageInput.trim() || isSendingRealMsg}
                          className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-emerald-950 transition-all"
                          title="Enviar directamente a través de la sesión de WhatsApp Web vinculada"
                        >
                          {isSendingRealMsg ? (
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Send className="w-3.5 h-3.5" />
                          )}
                          <span>Enviar WhatsApp</span>
                        </button>

                        <div className="flex items-center gap-1">
                          <button
                            type="submit"
                            disabled={!waMessageInput.trim()}
                            className="flex-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 font-semibold text-[11px] flex items-center justify-center gap-1 transition-all"
                            title="Guardar en bitácora sin enviar"
                          >
                            <span>Guardar</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleOpenRealWhatsApp(currentLead, waMessageInput)}
                            disabled={!waMessageInput.trim()}
                            className="flex-1 px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-emerald-400 font-semibold text-[11px] flex items-center justify-center gap-1 transition-all"
                            title="Abrir enlace wa.me"
                          >
                            <Smartphone className="w-3 h-3" />
                            <span>wa.me</span>
                          </button>
                        </div>
                      </div>
                    </form>
                  </div>

                  {/* DRAWER LATERAL ON-DEMAND DEL COPILOTO DE VENTAS */}
                  {isCopilotOpen && (
                    <div className="absolute inset-y-0 right-0 w-full sm:w-[380px] bg-[#0e1320] border-l border-slate-800 shadow-2xl z-20 flex flex-col animate-in slide-in-from-right duration-200">
                      
                      {/* Drawer Header */}
                      <div className="p-3.5 border-b border-slate-800 bg-[#131926] flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-md bg-orange-500/20 text-orange-400 flex items-center justify-center font-bold text-xs">
                            <Zap className="w-3.5 h-3.5" />
                          </div>
                          <div>
                            <h4 className="font-bold text-xs text-white">Copiloto de Venta WhatsApp</h4>
                            <p className="text-[10px] text-slate-400">Guiones persuasivos de alta conversión</p>
                          </div>
                        </div>

                        <button
                          onClick={() => setIsCopilotOpen(false)}
                          className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                          title="Cerrar panel"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Script Category Tabs */}
                      <div className="p-2.5 border-b border-slate-800/80 bg-[#0f1422]">
                        <div className="flex items-center gap-1 overflow-x-auto pb-1 text-[11px]">
                          {[
                            { id: 'todos', label: 'Todos' },
                            { id: 'diagnostico', label: 'Saludo' },
                            { id: 'solucion', label: 'Solución' },
                            { id: 'objeciones', label: 'Objeciones' },
                            { id: 'followup', label: '1-3-7' },
                            { id: 'cierre', label: 'Cierre' }
                          ].map(cat => (
                            <button
                              key={cat.id}
                              onClick={() => setWaScriptCategory(cat.id)}
                              className={`px-2.5 py-1 rounded-md transition-colors shrink-0 ${
                                waScriptCategory === cat.id
                                  ? 'bg-orange-600 text-white font-semibold'
                                  : 'text-slate-400 hover:text-slate-200 bg-slate-800/60'
                              }`}
                            >
                              {cat.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Scripts List */}
                      <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-[#0a0e17]">
                        {WHATSAPP_SCRIPTS
                          .filter(s => waScriptCategory === 'todos' || s.categoria === waScriptCategory)
                          .map(script => {
                            const scriptText = currentLead ? script.generarTexto(currentLead) : 'Selecciona un prospecto';

                            return (
                              <div
                                key={script.id}
                                className="p-3 rounded-xl bg-[#121827] border border-slate-800 hover:border-slate-700 transition-all space-y-2"
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-slate-800 text-orange-400 border border-slate-700">
                                    {script.fase}
                                  </span>
                                  <span className="text-[10px] text-slate-500 font-semibold uppercase">
                                    {script.categoriaLabel}
                                  </span>
                                </div>

                                <div className="font-bold text-xs text-slate-200">
                                  {script.titulo}
                                </div>

                                <div className="p-2.5 rounded-lg bg-[#090d15] border border-slate-800/80 text-[11px] text-slate-300 leading-relaxed font-sans max-h-28 overflow-y-auto">
                                  {scriptText}
                                </div>

                                <div className="flex items-center justify-end gap-2 pt-1">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      handleInsertScript(scriptText);
                                    }}
                                    className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-medium flex items-center gap-1 transition-colors"
                                  >
                                    <Edit className="w-3 h-3 text-sky-400" />
                                    <span>Insertar en chat</span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => {
                                      handleDirectLaunchScript(currentLead, scriptText);
                                    }}
                                    className="px-2.5 py-1 rounded bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 text-[11px] font-semibold flex items-center gap-1 transition-colors"
                                  >
                                    <Smartphone className="w-3 h-3 text-emerald-400" />
                                    <span>Lanzar wa.me</span>
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                      </div>

                    </div>
                  )}

                </div>
              );
            })()}

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
