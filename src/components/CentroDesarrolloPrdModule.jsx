import React, { useState, useEffect, useRef } from 'react';
import {
  Layout,
  FileCode,
  Kanban,
  GitBranch,
  Play,
  Square,
  Clock,
  Plus,
  Trash2,
  ExternalLink,
  Copy,
  Check,
  Save,
  Sparkles,
  ShieldCheck,
  Smartphone,
  Monitor,
  Zap,
  Globe,
  Database,
  FolderGit2,
  CheckCircle2,
  AlertCircle,
  Terminal,
  Code2,
  Building2,
  User,
  DollarSign,
  Layers,
  ArrowRight,
  Flame,
  RefreshCw,
  Sliders,
  Share2
} from 'lucide-react';
import WireframesStoryBrandModule from './WireframesStoryBrandModule';

// Plantilla predeterminada de PRD Técnico para proyectos Goglite de alta velocidad (Playbook Maestro 2026)
const DEFAULT_PRD_CONFIG = {
  stack: {
    frontend: 'Astro 5 SSG / HTML5 Semántico + Tailwind CSS v4 + GSAP (Sin WordPress)',
    bundler: 'Vite v8 / Rollup ultra-ligero con compresión Brotli',
    hosting: 'Firebase Hosting Plan Spark ($0 Servidores con CDN Google Edge)',
    cms: 'Headless CMS Goglite API JSON + Cloud Firestore Realtime'
  },
  metasRendimiento: {
    lcp: '< 0.8s en 4G Móvil (Hero WebP < 40 KB con doble preload condicional)',
    fid: '< 50ms (First Input Delay / TBT = 0 ms)',
    cls: '0.00 (Dimensiones explícitas width/height)',
    pageSpeedMobile: '90+ a 98 / 100 en Móvil Garantizado',
    pesoTotal: '< 350 KB inicial'
  },
  preparacionAgentica: {
    auditScore: '80+ / 100 en is-agentic.com y 3/3 en Agentic Browsing',
    trustAnchors: [
      { ruta: '/about', descripcion: 'Historia corporativa, RNC ante DGII, base y flota (> 500 chars).' },
      { ruta: '/contact', descripcion: 'Horarios 24/7, teléfono oficial, correo y dirección verificada.' },
      { ruta: '/privacy', descripcion: 'Términos de protección de datos personales conforme a ley.' }
    ],
    schema: 'LocalBusiness con contactPoint, hasMap de Google Maps y sameAs oficiales'
  },
  seguridadHoneypot: {
    tipo: 'Honeypot Universal Silencioso (Cero reCAPTCHA pesado para preservar PageSpeed)',
    campos: ['_hp_security_check', '_website_protection_trap', '_honey'],
    intercepcion: 'Aborto silencioso en cliente y servidor ante bots'
  },
  paginasRequeridas: [
    { nombre: 'Inicio (Hero + Cotizador en 4 Pasos)', descripcion: 'Hero con prueba de 5s, Bento Grid de servicios y cotizador interactivo directo a WhatsApp en < 2 min.', completado: true },
    { nombre: 'Servicios Especializados', descripcion: 'Páginas dedicadas con cotizadores individuales por servicio.', completado: false },
    { nombre: 'Página B2B / Fiscal (DGII)', descripcion: 'Acreditación formal, RNC, cotizaciones corporativas y comprobantes fiscales (NCF B01/B15).', completado: false },
    { nombre: 'Páginas Ancla de Confianza IA (/about, /contact, /privacy)', descripcion: 'Las 3 anclas obligatorias auditables por agentes de IA con contenido sustancial > 500 caracteres.', completado: true },
    { nombre: 'Testimonios Nativos Google Maps 5.0★', descripcion: 'Reseñas reales sin widgets pesados de terceros y enlace directo para captar nuevas valoraciones.', completado: false },
    { nombre: 'Rutas Legales & 404 Personalizado', descripcion: '/terminos-de-servicio, /aviso-de-privacidad y 404.astro con retorno seguro.', completado: true }
  ],
  integraciones: [
    { nombre: 'Cotizador en 4 Pasos a WhatsApp 24/7', detalle: 'Flujo interactivo sin registro que envía mensaje estructurado directo al chat.', activo: true },
    { nombre: 'Botón Flotante WhatsApp Business & Click-to-Call', detalle: 'Llamada telefónica en 1 toque para emergencias y chat comercial.', activo: true },
    { nombre: 'Google Maps Ficha & Schema Sincronizado', detalle: 'Vínculo bidireccional entre la ficha de Google y los datos del sitio.', activo: true },
    { nombre: 'Google Tag Manager & GA4', detalle: 'Eventos de clic, cotizaciones y conversiones sin bloquear el hilo principal.', activo: true },
    { nombre: 'Schema.org LocalBusiness JSON-LD con contactPoint', detalle: 'Indexación estructurada para Google y motores agénticos de IA.', activo: true }
  ],
  seguridad: [
    'Blindaje Anti-Spam Honeypot Universal (trampa invisible en 100% de formularios)',
    'Cabeceras inmutables en firebase.json (Cache-Control: public, max-age=31536000)',
    'Cero costo por servidor ($0 Hosting Spark garantizado contra Billing Attacks)',
    'Certificado SSL automático de Firebase Let\'s Encrypt y redirección HTTPS forzada',
    'Exclusión estricta de credenciales y variables confidenciales'
  ]
};

// Las 12 Fases Oficiales del Playbook Maestro Goglite 2026
const PLAYBOOK_12_FASES_TASKS = [
  {
    id: 'fase-1',
    titulo: 'Fase 1: Infraestructura Base, GitHub Privado & Firebase Spark ($0)',
    descripcion: 'Inicializar Git, configurar Astro 5 / Vite con Tailwind v4 y cache inmutable en firebase.json.',
    columna: 'completado',
    horasEstimadas: 1.5,
    horasRegistradas: 1.5,
    prioridad: 'alta'
  },
  {
    id: 'fase-2',
    titulo: 'Fase 2: Identidad Corporativa, Correo Oficial & DNS (SPF/DKIM/DMARC)',
    descripcion: 'Configurar buzón institucional info@empresa.com, validar registros DNS y vincular en /contacto y footer.',
    columna: 'completado',
    horasEstimadas: 1.0,
    horasRegistradas: 1.0,
    prioridad: 'alta'
  },
  {
    id: 'fase-3',
    titulo: 'Fase 3: Sistema de Diseño Dark Mode Luxury & Golden Badge',
    descripcion: 'Paleta profunda #060E21, acento dorado #D4AF37, Plus Jakarta Sans auto-hospedada y cápsula de distinción visual.',
    columna: 'completado',
    horasEstimadas: 2.0,
    horasRegistradas: 2.0,
    prioridad: 'alta'
  },
  {
    id: 'fase-4',
    titulo: 'Fase 4: Landing Page de Alta Conversión con Cotizador en 4 Pasos',
    descripcion: 'Hero interactivo con cotizador directo a WhatsApp en < 2 min, Bento Grid de servicios y pilares de confianza.',
    columna: 'desarrollo',
    horasEstimadas: 2.5,
    horasRegistradas: 1.5,
    prioridad: 'alta'
  },
  {
    id: 'fase-5',
    titulo: 'Fase 5: Arquitectura Multilingüe Nativa en Espejo (i18n)',
    descripcion: 'Rutas raíz en español y /en/ para clientes internacionales con etiquetas canonical y hreflang obligatorias.',
    columna: 'desarrollo',
    horasEstimadas: 1.5,
    horasRegistradas: 0.5,
    prioridad: 'media'
  },
  {
    id: 'fase-6',
    titulo: 'Fase 6: Páginas Interiores Especializadas, B2B Fiscal & Rutas Legales',
    descripcion: 'Servicios individuales, sección B2B con RNC/DGII, /terminos-de-servicio, /aviso-de-privacidad y 404.',
    columna: 'desarrollo',
    horasEstimadas: 2.0,
    horasRegistradas: 0.0,
    prioridad: 'alta'
  },
  {
    id: 'fase-7',
    titulo: 'Fase 7: Micro-interacciones Cinemáticas con GSAP & ScrollTrigger',
    descripcion: 'Animaciones suaves a 60 fps aceleradas por GPU, contadores numéricos diferidos al viewport sin bloquear FCP.',
    columna: 'backlog',
    horasEstimadas: 1.5,
    horasRegistradas: 0.0,
    prioridad: 'media'
  },
  {
    id: 'fase-8',
    titulo: 'Fase 8: Testimonios Nativos Google Maps 5.0★ (Cero Widgets Externos)',
    descripcion: 'Componente ligero que presenta valoraciones de clientes reales y enlace directo para captar nuevas reseñas.',
    columna: 'backlog',
    horasEstimadas: 1.0,
    horasRegistradas: 0.0,
    prioridad: 'media'
  },
  {
    id: 'fase-9',
    titulo: 'Fase 9: WPO Móvil Extrema (90+ en PageSpeed Mobile Garantizado)',
    descripcion: 'Hero WebP < 40 KB, doble preload condicional LCP, TBT = 0 ms y dimensiones explícitas para CLS = 0.',
    columna: 'staging',
    horasEstimadas: 2.0,
    horasRegistradas: 0.0,
    prioridad: 'alta'
  },
  {
    id: 'fase-10',
    titulo: 'Fase 10: Optimización y Certificación Agéntica de IA (is-agentic.com)',
    descripcion: 'Auditar 3 Trust Anchors (/about, /contact, /privacy con > 500 chars), Schema contactPoint y meta 80+/100.',
    columna: 'staging',
    horasEstimadas: 1.5,
    horasRegistradas: 0.0,
    prioridad: 'alta'
  },
  {
    id: 'fase-11',
    titulo: 'Fase 11: Blindaje Perimetral Anti-Spam Honeypot Universal',
    descripcion: 'Incrustar trampas invisibles (_hp_security_check) en el 100% de formularios con aborto silencioso ante bots.',
    columna: 'backlog',
    horasEstimadas: 1.0,
    horasRegistradas: 0.0,
    prioridad: 'alta'
  },
  {
    id: 'fase-12',
    titulo: 'Fase 12: Vinculación con Google Maps, Dominio Oficial & Entrega Ejecutiva',
    descripcion: 'Comprobar en vivo ficha de Google Maps, dominio definitivo con SSL, código GitHub y entrega al cliente.',
    columna: 'backlog',
    horasEstimadas: 1.5,
    horasRegistradas: 0.0,
    prioridad: 'alta'
  }
];

const DEFAULT_SPRINT_TASKS = PLAYBOOK_12_FASES_TASKS;


export default function CentroDesarrolloPrdModule({ selectedCountry = 'SV' }) {
  // Pestañas principales de Fase 4: 'storybrand' | 'prd_tecnico' | 'sprint_kanban' | 'repositorios'
  const [activeTab, setActiveTab] = useState('sprint_kanban');

  // Proyectos cargados desde la API
  const [proyectos, setProyectos] = useState([]);
  const [selectedProyectoId, setSelectedProyectoId] = useState('');
  const [loading, setLoading] = useState(true);

  // Estado del PRD Técnico
  const [prdConfig, setPrdConfig] = useState(DEFAULT_PRD_CONFIG);
  const [copiedPrdMarkdown, setCopiedPrdMarkdown] = useState(false);
  const [savedPrdNotice, setSavedPrdNotice] = useState(false);

  // Estado del Sprint Kanban
  const [sprintTasks, setSprintTasks] = useState(() => {
    try {
      const cached = localStorage.getItem('goglite_sprint_tasks');
      if (cached) return JSON.parse(cached);
    } catch (e) {}
    return DEFAULT_SPRINT_TASKS;
  });

  // Tarea en cronómetro activo
  const [activeTimerTaskId, setActiveTimerTaskId] = useState(null);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const timerRef = useRef(null);

  // Modal para agregar nueva tarea
  const [showNewTaskModal, setShowNewTaskModal] = useState(false);
  const [newTaskForm, setNewTaskForm] = useState({
    titulo: '',
    descripcion: '',
    columna: 'backlog',
    horasEstimadas: 1.0,
    prioridad: 'media'
  });

  // Estado de Bóveda de Repositorios & URLs
  const [repoVault, setRepoVault] = useState(() => {
    try {
      const cached = localStorage.getItem('goglite_repo_vault');
      if (cached) return JSON.parse(cached);
    } catch (e) {}
    return {
      githubRepo: 'https://github.com/goglite-agency/cliente-web-platform',
      figmaBoard: 'https://www.figma.com/design/goglite-templates-2026',
      stagingUrl: 'https://goglite-client-staging.web.app',
      productionUrl: 'https://www.gruasandreasv.com',
      driveAssets: 'https://drive.google.com/drive/folders/goglite-client-assets',
      deployCommand: 'npm run build && firebase deploy --only hosting'
    };
  });
  const [copiedField, setCopiedField] = useState(null);
  const [savedVaultNotice, setSavedVaultNotice] = useState(false);
  const [creatingDriveVault, setCreatingDriveVault] = useState(false);

  const handleCreateDriveVault = async () => {
    try {
      setCreatingDriveVault(true);
      const clientName = activeProyecto?.cliente?.empresa || prdData.empresa || 'Cliente Goglite';
      const res = await fetch('/api/drive/create-vault', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientName,
          clientEmail: activeProyecto?.cliente?.email || '',
          leadId: activeProyecto?.leadId || null
        })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.vault?.vaultUrl) {
          setRepoVault(prev => ({
            ...prev,
            driveAssets: data.vault.vaultUrl
          }));
          setSavedVaultNotice(true);
          setTimeout(() => setSavedVaultNotice(false), 3000);
        }
      }
    } catch (e) {
      console.warn('Error creando bóveda de Drive:', e);
    } finally {
      setCreatingDriveVault(false);
    }
  };

  // Cargar proyectos al iniciar
  useEffect(() => {
    fetchProyectos();
  }, []);

  // Persistir tareas y bóveda en localStorage
  useEffect(() => {
    try {
      localStorage.setItem('goglite_sprint_tasks', JSON.stringify(sprintTasks));
    } catch (e) {}
  }, [sprintTasks]);

  useEffect(() => {
    try {
      localStorage.setItem('goglite_repo_vault', JSON.stringify(repoVault));
    } catch (e) {}
  }, [repoVault]);

  // Manejo del cronómetro en vivo
  useEffect(() => {
    if (activeTimerTaskId) {
      timerRef.current = setInterval(() => {
        setTimerSeconds(prev => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [activeTimerTaskId]);

  const fetchProyectos = async () => {
    try {
      const res = await fetch('/api/proyectos');
      if (res.ok) {
        const data = await res.json();
        setProyectos(data);
        if (data.length > 0) {
          setSelectedProyectoId(data[0].id);
        }
      }
    } catch (err) {
      console.warn('Usando proyectos locales en demo');
    } finally {
      setLoading(false);
    }
  };

  const proyectoActivo = proyectos.find(p => p.id === selectedProyectoId) || {
    id: 'demo-proj-1',
    codigo: 'PRD-2026-001',
    cliente: {
      empresa: selectedCountry === 'DO' ? 'L&M Tours Punta Cana' : 'Grúas Andrea San Salvador',
      nombre: 'Víctor Matos',
      actividad: selectedCountry === 'DO' ? 'Transporte Turístico & Excursiones' : 'Grúas Plataforma y Auxilio Vial 24 Horas',
      telefono: selectedCountry === 'DO' ? '+1 (829) 528-4713' : '+503 7756-9828'
    }
  };

  // Cronómetro: Iniciar / Detener
  const handleToggleTimer = async (taskId) => {
    if (activeTimerTaskId === taskId) {
      // Detener y guardar horas acumuladas
      const horasIncremento = Math.max(0.1, Number((timerSeconds / 3600).toFixed(2)));
      
      // 1. Actualizar tarea local
      setSprintTasks(prev => prev.map(t => {
        if (t.id === taskId) {
          return {
            ...t,
            horasRegistradas: Number(((t.horasRegistradas || 0) + horasIncremento).toFixed(2))
          };
        }
        return t;
      }));

      // 2. Enviar automáticamente al Time Tracker de Finanzas (Módulo 7)
      try {
        const tareaObj = sprintTasks.find(t => t.id === taskId);
        await fetch('/api/finanzas/horas', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            proyectoId: proyectoActivo.id,
            proyectoNombre: proyectoActivo.cliente?.empresa,
            tarea: tareaObj ? tareaObj.titulo : 'Desarrollo en Sprint',
            descripcion: `Tiempo registrado en vivo desde Sprint Kanban (${timerSeconds}s)`,
            horas: horasIncremento,
            costoPorHora: 30, // $30/hora estándar Goglite
            moneda: 'USD',
            fecha: new Date().toISOString().split('T')[0]
          })
        });
      } catch (err) {
        console.warn('Horas guardadas en local');
      }

      setActiveTimerTaskId(null);
      setTimerSeconds(0);
    } else {
      // Iniciar en la nueva tarea
      setActiveTimerTaskId(taskId);
      setTimerSeconds(0);
    }
  };

  // Mover tarea entre columnas de Sprint
  const handleMoveTaskColumn = (taskId, nuevaColumna) => {
    setSprintTasks(prev => prev.map(t => t.id === taskId ? { ...t, columna: nuevaColumna } : t));
  };

  // Eliminar tarea
  const handleDeleteTask = (taskId) => {
    if (activeTimerTaskId === taskId) {
      setActiveTimerTaskId(null);
      setTimerSeconds(0);
    }
    setSprintTasks(prev => prev.filter(t => t.id !== taskId));
  };

  // Crear nueva tarea en Kanban
  const handleCreateTask = (e) => {
    e.preventDefault();
    if (!newTaskForm.titulo.trim()) return;

    const newTask = {
      id: 'task-' + Date.now(),
      titulo: newTaskForm.titulo,
      descripcion: newTaskForm.descripcion,
      columna: newTaskForm.columna,
      horasEstimadas: Number(newTaskForm.horasEstimadas) || 1.0,
      horasRegistradas: 0,
      prioridad: newTaskForm.prioridad
    };

    setSprintTasks(prev => [newTask, ...prev]);
    setNewTaskForm({
      titulo: '',
      descripcion: '',
      columna: 'backlog',
      horasEstimadas: 1.0,
      prioridad: 'media'
    });
    setShowNewTaskModal(false);
  };

  // Cargar las 12 Fases Oficiales del Playbook Maestro Goglite 2026
  const handleResetToPlaybook12Fases = () => {
    setSprintTasks(PLAYBOOK_12_FASES_TASKS);
    try {
      localStorage.setItem('goglite_sprint_tasks', JSON.stringify(PLAYBOOK_12_FASES_TASKS));
    } catch (e) {}
    alert('✓ Se han cargado las 12 Fases Oficiales del Playbook Maestro Goglite 2026 en el Sprint Kanban.');
  };

  // Formato de tiempo para el cronómetro (HH:MM:SS)
  const formatSeconds = (sec) => {
    const hrs = Math.floor(sec / 3600);
    const mins = Math.floor((sec % 3600) / 60);
    const secs = sec % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Copiar PRD Técnico completo en Markdown
  const handleCopyPrdMarkdown = () => {
    const md = `# PRD TÉCNICO · ESPECIFICACIÓN DE DESARROLLO GOGLITE
**Proyecto:** ${proyectoActivo.cliente?.empresa}
**Código:** ${proyectoActivo.codigo}
**Actividad:** ${proyectoActivo.cliente?.actividad}
**Meta de Carga:** < 1.2s (PageSpeed > 95) · Mobile-First

---

## 1. Stack Tecnológico de Alto Rendimiento
- **Frontend:** ${prdConfig.stack.frontend}
- **Compilador / Bundler:** ${prdConfig.stack.bundler}
- **Hosting & CDN:** ${prdConfig.stack.hosting}
- **Gestión de Contenido:** ${prdConfig.stack.cms}

## 2. Metas de Core Web Vitals (Estándar Google 2026)
- **LCP:** ${prdConfig.metasRendimiento.lcp}
- **FID / INP:** ${prdConfig.metasRendimiento.fid}
- **CLS:** ${prdConfig.metasRendimiento.cls}
- **PageSpeed Score:** ${prdConfig.metasRendimiento.pageSpeedMobile}
- **Límite de Peso:** ${prdConfig.metasRendimiento.pesoTotal}

## 3. Páginas y Secciones a Construir
${prdConfig.paginasRequeridas.map(p => `- [${p.completado ? 'x' : ' '}] **${p.nombre}:** ${p.descripcion}`).join('\n')}

## 4. Integraciones Obligatorias
${prdConfig.integraciones.map(i => `- [${i.activo ? 'x' : ' '}] **${i.nombre}:** ${i.detalle}`).join('\n')}

## 5. Directrices de Blindaje y Seguridad
${prdConfig.seguridad.map(s => `- ${s}`).join('\n')}

## 6. Preparación Agéntica para IA (is-agentic.com 80+)
- **Meta de Auditoría:** ${prdConfig.preparacionAgentica?.auditScore || '80+ / 100'}
- **Páginas Ancla (Trust Anchors):**
${(prdConfig.preparacionAgentica?.trustAnchors || []).map(t => `  - **${t.ruta}:** ${t.descripcion}`).join('\n')}
- **Schema:** ${prdConfig.preparacionAgentica?.schema || 'LocalBusiness con contactPoint'}

## 7. Blindaje Anti-Spam Honeypot Universal
- **Estrategia:** ${prdConfig.seguridadHoneypot?.tipo || 'Honeypot sin reCAPTCHA'}
- **Campos Trampa:** ${(prdConfig.seguridadHoneypot?.campos || []).join(', ')}
- **Protocolo:** ${prdConfig.seguridadHoneypot?.intercepcion || 'Aborto silencioso ante bots'}

---
*Generado automáticamente por Goglite Agency Suite · Fase 4: Centro de Control de Desarrollo (Playbook Maestro 2026)*
`;

    navigator.clipboard.writeText(md);
    setCopiedPrdMarkdown(true);
    setTimeout(() => setCopiedPrdMarkdown(false), 2500);
  };

  const handleCopyText = (text, fieldKey) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldKey);
    setTimeout(() => setCopiedField(null), 2000);
  };

  return (
    <div className="space-y-5">
      {/* HEADER DE FASE 4 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/10 border border-amber-500/30 text-amber-400">
              <Layout className="w-5 h-5" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-black text-white tracking-tight">Fase 4 · Centro de Desarrollo & PRD</h1>
                <span className="text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full">
                  Fábrica Web
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Arquitectura StoryBrand, especificaciones técnicas de rendimiento, sprints con cronómetro al P&L y bóveda de repositorios.
              </p>
            </div>
          </div>
        </div>

        {/* Selector de Proyecto Activo */}
        <div className="flex items-center gap-2 bg-[#0c1017] p-1.5 rounded-xl border border-slate-800">
          <Building2 className="w-3.5 h-3.5 text-slate-500 ml-1.5" />
          <select
            value={selectedProyectoId}
            onChange={(e) => setSelectedProyectoId(e.target.value)}
            className="bg-transparent text-xs text-slate-200 font-medium focus:outline-none pr-3 py-1 cursor-pointer"
          >
            {proyectos.length > 0 ? (
              proyectos.map(p => (
                <option key={p.id} value={p.id} className="bg-slate-900 text-slate-200">
                  {p.codigo} · {p.cliente?.empresa || 'Cliente'}
                </option>
              ))
            ) : (
              <option value="demo-proj-1" className="bg-slate-900 text-slate-200">
                {proyectoActivo.codigo} · {proyectoActivo.cliente?.empresa}
              </option>
            )}
          </select>
        </div>
      </div>

      {/* SELECTOR DE SUB-PESTAÑAS (4 PILARES DE FASE 4) */}
      <div className="no-print flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-1.5 bg-[#0c1017] p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveTab('sprint_kanban')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'sprint_kanban'
                ? 'bg-orange-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Kanban className="w-3.5 h-3.5" />
            <span>1. Sprint Kanban (Cronómetro P&L)</span>
            {activeTimerTaskId && (
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('prd_tecnico')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'prd_tecnico'
                ? 'bg-orange-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileCode className="w-3.5 h-3.5" />
            <span>2. PRD Técnico Interactivo</span>
          </button>

          <button
            onClick={() => setActiveTab('storybrand')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'storybrand'
                ? 'bg-orange-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layout className="w-3.5 h-3.5" />
            <span>3. Wireframes & StoryBrand UX</span>
          </button>

          <button
            onClick={() => setActiveTab('repositorios')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'repositorios'
                ? 'bg-orange-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FolderGit2 className="w-3.5 h-3.5" />
            <span>4. Bóveda de Repositorios & URLs</span>
          </button>
        </div>

        {/* Timer Bar Flotante si hay una tarea en ejecución */}
        {activeTimerTaskId && (
          <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-mono font-bold animate-pulse">
            <Clock className="w-3.5 h-3.5" />
            <span>Cronómetro Activo: {formatSeconds(timerSeconds)}</span>
            <button
              onClick={() => handleToggleTimer(activeTimerTaskId)}
              className="px-2 py-0.5 rounded bg-rose-600 hover:bg-rose-500 text-white text-[10px] font-sans font-semibold transition-colors"
            >
              Guardar y Pausar
            </button>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: SPRINT KANBAN DE CONSTRUCCIÓN CON CRONÓMETRO AL P&L                */}
      {/* ========================================================================= */}
      {activeTab === 'sprint_kanban' && (
        <div className="space-y-4">
          {/* Header de Kanban */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#0d121c] p-3 rounded-xl border border-slate-800">
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <Kanban className="w-4 h-4 text-orange-400" />
                <span>Tablero de Sprint Técnico · {proyectoActivo.cliente?.empresa}</span>
              </h2>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Registra el tiempo exacto con el cronómetro de 1-clic. Las horas se transfieren automáticamente al balance contable del Módulo 7.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleResetToPlaybook12Fases}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/15 border border-amber-500/30 hover:bg-amber-500/25 text-amber-300 text-xs font-bold transition-all shadow-sm shrink-0"
                title="Cargar las 12 Fases Oficiales del Playbook Maestro de Goglite"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Cargar 12 Fases Playbook Maestro</span>
              </button>
              <button
                onClick={() => setShowNewTaskModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold transition-all shadow-sm shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Nueva Tarea de Sprint</span>
              </button>
            </div>
          </div>

          {/* Columnas Kanban */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {[
              { id: 'backlog', titulo: 'Por Iniciar (Backlog)', color: 'border-slate-800 bg-slate-900/40 text-slate-400' },
              { id: 'desarrollo', titulo: 'En Desarrollo', color: 'border-amber-500/30 bg-amber-500/5 text-amber-300' },
              { id: 'staging', titulo: 'En Staging / Pruebas', color: 'border-cyan-500/30 bg-cyan-500/5 text-cyan-300' },
              { id: 'completado', titulo: 'Aprobado & Listo', color: 'border-emerald-500/30 bg-emerald-500/5 text-emerald-300' }
            ].map(col => {
              const tasksInCol = sprintTasks.filter(t => t.columna === col.id);
              return (
                <div key={col.id} className={`rounded-xl border ${col.color} p-3 flex flex-col justify-between min-h-[480px]`}>
                  <div>
                    <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-800/80">
                      <span className="text-xs font-mono font-bold">{col.titulo}</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800/80 text-slate-300 font-bold">
                        {tasksInCol.length}
                      </span>
                    </div>

                    {/* Lista de Tareas */}
                    <div className="space-y-2.5">
                      {tasksInCol.map(task => {
                        const isTimerRunning = activeTimerTaskId === task.id;
                        return (
                          <div
                            key={task.id}
                            className={`p-3 rounded-lg border text-xs space-y-2.5 transition-all ${
                              isTimerRunning
                                ? 'bg-emerald-950/20 border-emerald-500/60 shadow-lg'
                                : 'bg-[#0f1422] border-slate-800/80 hover:border-slate-700'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <h3 className="font-semibold text-slate-200 leading-snug">{task.titulo}</h3>
                              <button
                                onClick={() => handleDeleteTask(task.id)}
                                className="text-slate-600 hover:text-rose-400 p-0.5 rounded transition-colors"
                                title="Eliminar tarea"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>

                            <p className="text-[11px] text-slate-400 leading-relaxed">{task.descripcion}</p>

                            {/* Badge de Horas y Cronómetro */}
                            <div className="pt-1.5 border-t border-slate-800/60 flex items-center justify-between text-[10px] font-mono">
                              <div className="text-slate-400">
                                <span>Est: {task.horasEstimadas}h</span>
                                <span className="mx-1 text-slate-600">·</span>
                                <span className="text-emerald-400 font-bold">Reg: {task.horasRegistradas || 0}h</span>
                              </div>

                              {/* Botón de Iniciar / Pausar Cronómetro */}
                              <button
                                onClick={() => handleToggleTimer(task.id)}
                                className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] font-bold transition-all ${
                                  isTimerRunning
                                    ? 'bg-rose-600 text-white animate-pulse'
                                    : 'bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30'
                                }`}
                                title={isTimerRunning ? 'Pausar y Registrar Horas al P&L' : 'Iniciar Cronómetro en Vivo'}
                              >
                                {isTimerRunning ? (
                                  <>
                                    <Square className="w-2.5 h-2.5 fill-current" />
                                    <span>{formatSeconds(timerSeconds)}</span>
                                  </>
                                ) : (
                                  <>
                                    <Play className="w-2.5 h-2.5 fill-current" />
                                    <span>Cronómetro</span>
                                  </>
                                )}
                              </button>
                            </div>

                            {/* Selector de Movimiento entre Columnas */}
                            <div className="flex items-center justify-between pt-1 text-[9px] text-slate-500 font-mono">
                              <span>Mover a:</span>
                              <div className="flex items-center gap-1">
                                {['backlog', 'desarrollo', 'staging', 'completado']
                                  .filter(c => c !== task.columna)
                                  .map(c => (
                                    <button
                                      key={c}
                                      onClick={() => handleMoveTaskColumn(task.id, c)}
                                      className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 uppercase"
                                    >
                                      {c === 'completado' ? 'Listo' : c.slice(0, 4)}
                                    </button>
                                  ))}
                              </div>
                            </div>
                          </div>
                        );
                      })}

                      {tasksInCol.length === 0 && (
                        <div className="p-4 rounded-lg border border-dashed border-slate-800/60 text-center text-[11px] text-slate-600 font-mono">
                          Sin tareas en esta etapa
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pt-2 text-[10px] text-slate-500 font-mono text-center">
                    Total: {tasksInCol.reduce((acc, t) => acc + (t.horasRegistradas || 0), 0).toFixed(1)} hrs registradas
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: PRD TÉCNICO INTERACTIVO (ESPECIFICACIÓN DE ARQUITECTURA)             */}
      {/* ========================================================================= */}
      {activeTab === 'prd_tecnico' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#0d121c] p-3 rounded-xl border border-slate-800">
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <FileCode className="w-4 h-4 text-orange-400" />
                <span>PRD Técnico (Product Requirements Document)</span>
              </h2>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Especificación técnica estandarizada para desarrollo en Antigravity con métricas Core Web Vitals y stack nativo.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyPrdMarkdown}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold transition-all shadow-sm"
              >
                {copiedPrdMarkdown ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedPrdMarkdown ? '¡PRD Copiado en MD!' : 'Copiar PRD en Markdown'}</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Columna 1: Stack Tecnológico & Metas de Velocidad */}
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-[#0c1017] border border-slate-800 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-orange-400 font-mono">
                  <Terminal className="w-3.5 h-3.5" />
                  <span>Stack Técnico Nativo</span>
                </div>
                <div className="space-y-2 text-xs">
                  <div>
                    <label className="text-[10px] uppercase font-mono text-slate-500">Frontend</label>
                    <p className="p-2 rounded bg-slate-900 border border-slate-800 font-mono text-[11px] text-slate-200">
                      {prdConfig.stack.frontend}
                    </p>
                  </div>
                  <div>
                    <label className="text-[10px] uppercase font-mono text-slate-500">Compilador & Bundler</label>
                    <p className="p-2 rounded bg-slate-900 border border-slate-800 font-mono text-[11px] text-slate-200">
                      {prdConfig.stack.bundler}
                    </p>
                  </div>
                  <div>
                    <label className="text-[10px] uppercase font-mono text-slate-500">Hosting & Red CDN</label>
                    <p className="p-2 rounded bg-slate-900 border border-slate-800 font-mono text-[11px] text-slate-200">
                      {prdConfig.stack.hosting}
                    </p>
                  </div>
                  <div>
                    <label className="text-[10px] uppercase font-mono text-slate-500">CMS & Contenido</label>
                    <p className="p-2 rounded bg-slate-900 border border-slate-800 font-mono text-[11px] text-slate-200">
                      {prdConfig.stack.cms}
                    </p>
                  </div>
                </div>
              </div>

              {/* Metas de Rendimiento */}
              <div className="p-4 rounded-xl bg-[#0c1017] border border-emerald-500/20 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-400 font-mono">
                  <Zap className="w-3.5 h-3.5" />
                  <span>Metas Core Web Vitals (2026)</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                  <div className="p-2 rounded bg-slate-900 border border-slate-800">
                    <span className="text-[10px] text-slate-500">LCP (Carga)</span>
                    <p className="font-bold text-emerald-400">{prdConfig.metasRendimiento.lcp}</p>
                  </div>
                  <div className="p-2 rounded bg-slate-900 border border-slate-800">
                    <span className="text-[10px] text-slate-500">INP (Interactividad)</span>
                    <p className="font-bold text-emerald-400">{prdConfig.metasRendimiento.fid}</p>
                  </div>
                  <div className="p-2 rounded bg-slate-900 border border-slate-800">
                    <span className="text-[10px] text-slate-500">CLS (Estabilidad)</span>
                    <p className="font-bold text-emerald-400">{prdConfig.metasRendimiento.cls}</p>
                  </div>
                  <div className="p-2 rounded bg-slate-900 border border-slate-800">
                    <span className="text-[10px] text-slate-500">PageSpeed Mobile</span>
                    <p className="font-bold text-emerald-400">{prdConfig.metasRendimiento.pageSpeedMobile}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Columna 2: Páginas Requeridas */}
            <div className="p-4 rounded-xl bg-[#0c1017] border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-orange-400 font-mono">
                  <Layers className="w-3.5 h-3.5" />
                  <span>Páginas & Estructura del Sitio</span>
                </div>
                <span className="text-[10px] font-mono text-slate-500">
                  {prdConfig.paginasRequeridas.filter(p => p.completado).length}/{prdConfig.paginasRequeridas.length} listas
                </span>
              </div>
              <div className="space-y-2">
                {prdConfig.paginasRequeridas.map((pag, idx) => (
                  <div
                    key={idx}
                    onClick={() => {
                      setPrdConfig(prev => {
                        const updated = [...prev.paginasRequeridas];
                        updated[idx].completado = !updated[idx].completado;
                        return { ...prev, paginasRequeridas: updated };
                      });
                    }}
                    className={`p-3 rounded-lg border text-xs cursor-pointer transition-all ${
                      pag.completado
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-slate-200'
                        : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-slate-200 flex items-center gap-2">
                        <span className={`w-3.5 h-3.5 rounded flex items-center justify-center text-[10px] ${pag.completado ? 'bg-emerald-500 text-black' : 'border border-slate-600'}`}>
                          {pag.completado && '✓'}
                        </span>
                        {pag.nombre}
                      </span>
                      <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded ${pag.completado ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-500'}`}>
                        {pag.completado ? 'Lista' : 'Pendiente'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 pl-5.5">{pag.descripcion}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Columna 3: Integraciones Comerciales & Seguridad */}
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-[#0c1017] border border-slate-800 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-orange-400 font-mono">
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Integraciones de Conversión</span>
                </div>
                <div className="space-y-2">
                  {prdConfig.integraciones.map((integ, idx) => (
                    <div
                      key={idx}
                      onClick={() => {
                        setPrdConfig(prev => {
                          const updated = [...prev.integraciones];
                          updated[idx].activo = !updated[idx].activo;
                          return { ...prev, integraciones: updated };
                        });
                      }}
                      className={`p-2.5 rounded-lg border text-xs cursor-pointer transition-all ${
                        integ.activo
                          ? 'bg-amber-500/10 border-amber-500/30 text-slate-200'
                          : 'bg-slate-900/60 border-slate-800 text-slate-400'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-200 text-[11px]">{integ.nombre}</span>
                        <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded ${integ.activo ? 'bg-amber-500/20 text-amber-300' : 'bg-slate-800 text-slate-500'}`}>
                          {integ.activo ? 'Activo' : 'Opcional'}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-0.5">{integ.detalle}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Blindaje de Seguridad */}
              <div className="p-4 rounded-xl bg-[#0c1017] border border-slate-800 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">
                  <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Seguridad de Despliegue</span>
                </div>
                <div className="space-y-1.5 text-[11px] text-slate-400">
                  {prdConfig.seguridad.map((sec, idx) => (
                    <div key={idx} className="flex items-start gap-1.5">
                      <span className="text-cyan-400">•</span>
                      <span>{sec}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Preparación Agéntica para IA (is-agentic.com) */}
              <div className="p-4 rounded-xl bg-[#0c1017] border border-purple-500/30 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-purple-400 font-mono">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Preparación Agéntica IA</span>
                  </div>
                  <span className="text-[9px] font-mono bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded font-bold">
                    80+ is-agentic
                  </span>
                </div>
                <div className="space-y-1.5 text-[11px] text-slate-300">
                  <div className="text-[10px] text-slate-500 font-mono uppercase">3 Páginas Ancla Obligatorias (&gt; 500 chars):</div>
                  <div className="grid grid-cols-3 gap-1.5 font-mono text-[10px] text-center">
                    <span className="p-1 rounded bg-slate-900 border border-slate-800 text-purple-300">/about (RNC)</span>
                    <span className="p-1 rounded bg-slate-900 border border-slate-800 text-purple-300">/contact (24/7)</span>
                    <span className="p-1 rounded bg-slate-900 border border-slate-800 text-purple-300">/privacy</span>
                  </div>
                  <div className="text-[10px] text-slate-400 pt-1">
                    • Schema.org LocalBusiness con <strong className="text-white">contactPoint</strong>, <strong className="text-white">hasMap</strong> y <strong className="text-white">sameAs</strong>.
                  </div>
                </div>
              </div>

              {/* Blindaje Anti-Spam Honeypot Universal */}
              <div className="p-4 rounded-xl bg-[#0c1017] border border-amber-500/30 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-400 font-mono">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Honeypot Anti-Spam</span>
                  </div>
                  <span className="text-[9px] font-mono bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded font-bold">
                    Cero Captchas
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 space-y-1">
                  <p>Trampa invisible <code className="text-amber-300 bg-black/40 px-1 py-0.5 rounded font-mono">_hp_security_check</code> en 100% de formularios.</p>
                  <p className="text-[10px] text-slate-500">Bloquea bots de manera silenciosa sin degradar el tiempo de carga móvil ni molestar al usuario con reCAPTCHA.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: WIREFRAMES & STORYBRAND UX (LÓGICA EXISTENTE DE DONALD MILLER)      */}
      {/* ========================================================================= */}
      {activeTab === 'storybrand' && (
        <div className="space-y-4">
          <WireframesStoryBrandModule selectedCountry={selectedCountry} />
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: BÓVEDA DE REPOSITORIOS, FIGMA, STAGING & COMANDOS DE DESPLIEGUE     */}
      {/* ========================================================================= */}
      {activeTab === 'repositorios' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#0d121c] p-3 rounded-xl border border-slate-800">
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <FolderGit2 className="w-4 h-4 text-orange-400" />
                <span>Bóveda de Repositorios, Staging & Assets</span>
              </h2>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Centraliza los accesos de desarrollo del cliente: GitHub privado, URLs de Staging, Figma y comando de publicación a Firebase.
              </p>
            </div>
            {savedVaultNotice && (
              <span className="text-xs font-mono text-emerald-400 font-bold flex items-center gap-1">
                <Check className="w-3.5 h-3.5" /> ¡Bóveda Guardada!
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 1. GitHub Repo */}
            <div className="p-4 rounded-xl bg-[#0c1017] border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-2">
                  <GitBranch className="w-3.5 h-3.5 text-orange-400" />
                  <span>Repositorio GitHub (Privado)</span>
                </label>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleCopyText(repoVault.githubRepo, 'github')}
                    className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] flex items-center gap-1 font-mono"
                  >
                    {copiedField === 'github' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>Copiar</span>
                  </button>
                  <a
                    href={repoVault.githubRepo}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
                  >
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
              <input
                type="text"
                value={repoVault.githubRepo}
                onChange={(e) => setRepoVault({ ...repoVault, githubRepo: e.target.value })}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-orange-500"
              />
            </div>

            {/* 2. Staging URL */}
            <div className="p-4 rounded-xl bg-[#0c1017] border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-2">
                  <Globe className="w-3.5 h-3.5 text-cyan-400" />
                  <span>URL de Staging Temporal (Firebase)</span>
                </label>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleCopyText(repoVault.stagingUrl, 'staging')}
                    className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] flex items-center gap-1 font-mono"
                  >
                    {copiedField === 'staging' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>Copiar</span>
                  </button>
                  <a
                    href={repoVault.stagingUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
                  >
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
              <input
                type="text"
                value={repoVault.stagingUrl}
                onChange={(e) => setRepoVault({ ...repoVault, stagingUrl: e.target.value })}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-500"
              />
            </div>

            {/* 3. Figma / Diseño UI */}
            <div className="p-4 rounded-xl bg-[#0c1017] border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-2">
                  <Layout className="w-3.5 h-3.5 text-purple-400" />
                  <span>Tablero Figma / Wireframes UX</span>
                </label>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleCopyText(repoVault.figmaBoard, 'figma')}
                    className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] flex items-center gap-1 font-mono"
                  >
                    {copiedField === 'figma' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>Copiar</span>
                  </button>
                  <a
                    href={repoVault.figmaBoard}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
                  >
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
              <input
                type="text"
                value={repoVault.figmaBoard}
                onChange={(e) => setRepoVault({ ...repoVault, figmaBoard: e.target.value })}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-purple-500"
              />
            </div>

            {/* 4. Google Drive / Bóveda de Assets */}
            <div className="p-4 rounded-xl bg-[#0c1017] border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-2">
                  <FolderGit2 className="w-3.5 h-3.5 text-amber-400" />
                  <span>Carpeta Google Drive (Logos & Fotos)</span>
                </label>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={handleCreateDriveVault}
                    disabled={creatingDriveVault}
                    title="Crear o enlazar bóveda centralizada en sitesgoglite@gmail.com"
                    className="p-1 px-2 rounded bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-[10px] flex items-center gap-1 font-mono font-bold transition-colors"
                  >
                    <RefreshCw className={`w-3 h-3 ${creatingDriveVault ? 'animate-spin' : ''}`} />
                    <span>{creatingDriveVault ? 'Creando...' : '⚡ Bóveda Drive'}</span>
                  </button>
                  <button
                    onClick={() => handleCopyText(repoVault.driveAssets, 'drive')}
                    className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] flex items-center gap-1 font-mono"
                  >
                    {copiedField === 'drive' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>Copiar</span>
                  </button>
                  <a
                    href={repoVault.driveAssets}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
                  >
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
              <input
                type="text"
                value={repoVault.driveAssets}
                onChange={(e) => setRepoVault({ ...repoVault, driveAssets: e.target.value })}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Caja de Comando de Despliegue 1-Click */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-orange-500/10 via-amber-500/5 to-transparent border border-orange-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-orange-300 font-mono">
                <Terminal className="w-4 h-4 text-orange-400" />
                <span>Comando de Compilación y Publicación a Staging</span>
              </div>
              <code className="text-[11px] font-mono text-slate-300 block mt-1 bg-black/40 px-3 py-1.5 rounded-lg border border-slate-800">
                {repoVault.deployCommand}
              </code>
            </div>
            <button
              onClick={() => handleCopyText(repoVault.deployCommand, 'deploy')}
              className="px-3.5 py-2 rounded-lg bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold font-mono flex items-center gap-1.5 shrink-0 shadow-sm transition-all"
            >
              {copiedField === 'deploy' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedField === 'deploy' ? '¡Copiado!' : 'Copiar Comando'}</span>
            </button>
          </div>

          {/* Enlaces de Auditoría y Comandos Diarios del Playbook Maestro */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-[#0c1017] border border-slate-800 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-300 font-mono">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Herramientas de Auditoría QA en Vivo</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <a
                  href="https://pagespeed.web.dev"
                  target="_blank"
                  rel="noreferrer"
                  className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-emerald-500/40 flex items-center justify-between text-slate-300 hover:text-white transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Zap className="w-3.5 h-3.5 text-emerald-400" />
                    <span>PageSpeed (90+)</span>
                  </div>
                  <ExternalLink className="w-3 h-3 text-slate-500" />
                </a>

                <a
                  href="https://is-agentic.com"
                  target="_blank"
                  rel="noreferrer"
                  className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-purple-500/40 flex items-center justify-between text-slate-300 hover:text-white transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                    <span>is-agentic.com (80+)</span>
                  </div>
                  <ExternalLink className="w-3 h-3 text-slate-500" />
                </a>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[#0c1017] border border-slate-800 space-y-2">
              <div className="text-xs font-bold text-slate-300 font-mono flex items-center gap-2">
                <Terminal className="w-4 h-4 text-cyan-400" />
                <span>Pipeline de Comandos Diarios (Playbook Maestro)</span>
              </div>
              <div className="text-[11px] font-mono text-slate-400 bg-slate-900/80 p-2.5 rounded-lg border border-slate-800 space-y-1">
                <div># 1. Compilación limpia: <span className="text-emerald-400">npm run build</span></div>
                <div># 2. Control de cambios: <span className="text-cyan-400">git commit -m "feat: avance"</span></div>
                <div># 3. Despliegue perimetral $0: <span className="text-orange-400">npx -y firebase-tools deploy --only hosting</span></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: NUEVA TAREA DE SPRINT                                              */}
      {/* ========================================================================= */}
      {showNewTaskModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#0f1422] border border-slate-800 rounded-2xl p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-orange-400" />
                <span>Nueva Tarea de Desarrollo</span>
              </h3>
              <button
                onClick={() => setShowNewTaskModal(false)}
                className="text-slate-500 hover:text-slate-300"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-3 text-xs">
              <div>
                <label className="text-[11px] font-mono text-slate-400 block mb-1">Título de la Tarea</label>
                <input
                  type="text"
                  required
                  placeholder="ej. Crear sección de testimonios con carrusel CSS"
                  value={newTaskForm.titulo}
                  onChange={(e) => setNewTaskForm({ ...newTaskForm, titulo: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-mono text-slate-400 block mb-1">Descripción / Criterio de Aceptación</label>
                <textarea
                  rows={3}
                  placeholder="Detalles técnicos, componentes o micro-interacciones a incluir..."
                  value={newTaskForm.descripcion}
                  onChange={(e) => setNewTaskForm({ ...newTaskForm, descripcion: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-mono text-slate-400 block mb-1">Columna Inicial</label>
                  <select
                    value={newTaskForm.columna}
                    onChange={(e) => setNewTaskForm({ ...newTaskForm, columna: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-slate-200 focus:outline-none focus:border-orange-500"
                  >
                    <option value="backlog">Por Iniciar (Backlog)</option>
                    <option value="desarrollo">En Desarrollo</option>
                    <option value="staging">En Staging</option>
                    <option value="completado">Aprobado / Listo</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-mono text-slate-400 block mb-1">Horas Estimadas</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0.5"
                    value={newTaskForm.horasEstimadas}
                    onChange={(e) => setNewTaskForm({ ...newTaskForm, horasEstimadas: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-slate-200 focus:outline-none focus:border-orange-500 font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowNewTaskModal(false)}
                  className="px-3 py-2 rounded-lg bg-slate-800 text-slate-300 font-semibold hover:bg-slate-700 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-orange-600 text-white font-bold hover:bg-orange-500 transition-all shadow-sm"
                >
                  Agregar a Sprint
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
