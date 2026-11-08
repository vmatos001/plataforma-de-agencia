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
  Share2,
  Bell,
  Hourglass
} from 'lucide-react';
import WireframesStoryBrandModule from './WireframesStoryBrandModule';
import apiClient from '../services/apiClient';
import { syncAllProyectosWithEvents } from '../services/projectMilestoneSync';
import { buildProyectoFromPresupuesto } from '../services/contractGenerator';
import {
  requestNotificationPermission,
  sendTimerNotification,
  playTimerChime,
  formatSecondsCountdown
} from '../services/timerNotificationService';
import {
  getAppStateCloud,
  saveAppStateCloud,
  getProyectosCloud,
  saveProyectoCloud,
  getPresupuestosCloud,
  getPortalCloud,
  savePortalCloud,
  isExcludedProyecto
} from '../services/firestoreSyncService';

// Generador dinámico de PRD Técnico adaptado al proyecto específico (Playbook Maestro 2026)
export function generatePrdForProyecto(proyecto, defaultCountry = 'DO') {
  const empresa = proyecto?.cliente?.empresa || (defaultCountry === 'DO' ? 'L&M Tours Punta Cana' : 'Grúas Andrea San Salvador');
  const nombreContacto = proyecto?.cliente?.nombre || 'Víctor Matos';
  const actividad = proyecto?.cliente?.actividad || (defaultCountry === 'DO' ? 'Transporte Turístico & Excursiones Punta Cana' : 'Grúas Plataforma y Auxilio Vial 24 Horas');
  const telefono = proyecto?.cliente?.telefono || (defaultCountry === 'DO' ? '+1 (829) 528-4713' : '+503 7756-9828');
  const ubicacion = proyecto?.cliente?.ubicacion || (defaultCountry === 'DO' ? 'Punta Cana, República Dominicana' : 'San Salvador, El Salvador');
  const codigo = proyecto?.codigo || 'PRD-2026-001';
  const totalInversion = proyecto?.contrato?.totalInversion || 300;
  const modulos = proyecto?.contrato?.modulos || [];

  // Construcción dinámica de páginas a partir de los módulos acordados en el contrato del proyecto
  const paginas = [];

  if (modulos.length > 0) {
    modulos.forEach((m, idx) => {
      const tit = (m.titulo || '')
        .replace(/\s*\(\$\s*[\d,]+(?:\.\d+)?\s*USD\)/gi, '')
        .replace(/\s*\(\$\s*[\d,]+(?:\.\d+)?\)/gi, '')
        .trim();
      const num = m.numero || `MÓDULO ${idx + 1}`;
      paginas.push({
        nombre: `${num}: ${tit}`,
        descripcion: `Especificación y maquetación de ${tit.toLowerCase()} con arquitectura limpia sin WordPress para ${empresa}.`,
        completado: idx === 0
      });
    });
  } else {
    paginas.push(
      { nombre: 'Inicio (Hero + Cotizador en 4 Pasos)', descripcion: `Hero de alta conversión con cotizador directo a WhatsApp para ${empresa}.`, completado: true },
      { nombre: 'Servicios Especializados & Catálogo', descripcion: `Páginas dedicadas para ${actividad} con cotizadores individuales.`, completado: false }
    );
  }

  // Páginas estándar de infraestructura y confianza requeridas para auditorías
  paginas.push(
    { nombre: 'Silos Locales & Landings de Cobertura (/zonas/...)', descripcion: `Landings satélite por municipio/barrio con cobertura geográfica, tiempos y tarifas locales en ${ubicacion}.`, completado: false },
    { nombre: 'Páginas Ancla de Confianza IA (/about, /contact, /privacy)', descripcion: `Las 3 anclas obligatorias auditables por agentes de IA (> 500 caracteres) con datos oficiales de ${empresa}.`, completado: true },
    { nombre: 'Google Maps Local, Iframe Embebido & Testimonios 5.0★', descripcion: `Integración de ficha local en ${ubicacion}, mapa embebido oficial y captación de reseñas semánticas.`, completado: false },
    { nombre: 'Rutas Legales & 404 Personalizado', descripcion: '/terminos-de-servicio, /aviso-de-privacidad y 404.astro con retorno seguro.', completado: true }
  );

  return {
    proyectoId: proyecto?.id || 'demo-proj-1',
    clienteEmpresa: empresa,
    clienteContacto: nombreContacto,
    clienteTelefono: telefono,
    clienteUbicacion: ubicacion,
    actividad,
    codigo,
    totalInversion,
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
        { ruta: '/about', descripcion: `Historia corporativa de ${empresa}, actividad en ${ubicacion} (> 500 chars).` },
        { ruta: '/contact', descripcion: `Horarios de atención, teléfono oficial (${telefono}), correo y dirección.` },
        { ruta: '/privacy', descripcion: 'Términos de protección de datos personales conforme a ley.' }
      ],
      schema: `LocalBusiness con contactPoint, hasMap de Google Maps en ${ubicacion}`
    },
    seguridadHoneypot: {
      tipo: 'Honeypot Universal Silencioso (Cero reCAPTCHA pesado para preservar PageSpeed)',
      campos: ['_hp_security_check', '_website_protection_trap', '_honey'],
      intercepcion: 'Aborto silencioso en cliente y servidor ante bots'
    },
    paginasRequeridas: paginas,
    integraciones: [
      { nombre: `Cotizador a WhatsApp (${telefono})`, detalle: `Flujo interactivo directo al número oficial de ${empresa} en < 2 min.`, activo: true },
      { nombre: 'Botón Flotante WhatsApp Business & Click-to-Call', detalle: 'Llamada telefónica en 1 toque para emergencias y chat comercial.', activo: true },
      { nombre: `Google Maps Ficha, Iframe Embebido & Schema (${ubicacion})`, detalle: 'Vínculo bidireccional entre la ficha de Google, iframe en la web y schema local.', activo: true },
      { nombre: 'Citaciones Tier 1 & Consistencia NAP', detalle: 'Presencia canónica en Apple Maps, Bing Places, Waze y directorios de máxima autoridad.', activo: true },
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
}

const DEFAULT_PRD_CONFIG = generatePrdForProyecto(null);

// Las 12 Fases Oficiales del Playbook Maestro Goglite 2026 (Inicializan todas en Backlog con 0h registradas)
const PLAYBOOK_12_FASES_TASKS = [
  {
    id: 'fase-1',
    titulo: 'Fase 1: Infraestructura Base, GitHub Privado & Firebase Spark ($0)',
    descripcion: 'Inicializar Git, configurar Astro 5 / Vite con Tailwind v4 y cache inmutable en firebase.json.',
    columna: 'backlog',
    horasEstimadas: 1.5,
    horasRegistradas: 0.0,
    prioridad: 'alta'
  },
  {
    id: 'fase-2',
    titulo: 'Fase 2: Identidad Corporativa, Correo Oficial & DNS (SPF/DKIM/DMARC)',
    descripcion: 'Configurar buzón institucional info@empresa.com, validar registros DNS y vincular en /contacto y footer.',
    columna: 'backlog',
    horasEstimadas: 1.0,
    horasRegistradas: 0.0,
    prioridad: 'alta'
  },
  {
    id: 'fase-3',
    titulo: 'Fase 3: Sistema de Diseño Dark Mode Luxury & Golden Badge',
    descripcion: 'Paleta profunda #060E21, acento dorado #D4AF37, Plus Jakarta Sans auto-hospedada y cápsula de distinción visual.',
    columna: 'backlog',
    horasEstimadas: 2.0,
    horasRegistradas: 0.0,
    prioridad: 'alta'
  },
  {
    id: 'fase-4',
    titulo: 'Fase 4: Landing Page de Alta Conversión con Cotizador en 4 Pasos',
    descripcion: 'Hero interactivo con cotizador directo a WhatsApp en < 2 min, Bento Grid de servicios y pilares de confianza.',
    columna: 'backlog',
    horasEstimadas: 2.5,
    horasRegistradas: 0.0,
    prioridad: 'alta'
  },
  {
    id: 'fase-5',
    titulo: 'Fase 5: Arquitectura Multilingüe Nativa en Espejo (i18n)',
    descripcion: 'Rutas raíz en español y /en/ para clientes internacionales con etiquetas canonical y hreflang obligatorias.',
    columna: 'backlog',
    horasEstimadas: 1.5,
    horasRegistradas: 0.0,
    prioridad: 'media'
  },
  {
    id: 'fase-6',
    titulo: 'Fase 6: Páginas Interiores Especializadas, Silos Locales por Municipio (/zonas/...), B2B Fiscal & Rutas Legales',
    descripcion: 'Servicios individuales, landings transaccionales de cobertura geográfica por municipio (/zonas/[ciudad]/[barrio]/), sección B2B fiscal con RNC/NIT, /terminos y /privacidad.',
    columna: 'backlog',
    horasEstimadas: 2.5,
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
    titulo: 'Fase 8: Testimonios Nativos Google Maps 5.0★, Mapa Embebido & Protocolo de Reseñas Semánticas',
    descripcion: 'Iframe oficial de GBP en la web, testimonios nativos ligeros sin widgets bloqueantes, plantilla de reseñas semánticas ([Servicio]+[Técnico]+[Barrio]) y política de respuestas < 48h.',
    columna: 'backlog',
    horasEstimadas: 1.5,
    horasRegistradas: 0.0,
    prioridad: 'media'
  },
  {
    id: 'fase-9',
    titulo: 'Fase 9: WPO Móvil Extrema (90+ en PageSpeed Mobile Garantizado)',
    descripcion: 'Hero WebP < 40 KB, doble preload condicional LCP, TBT = 0 ms y dimensiones explícitas para CLS = 0.',
    columna: 'backlog',
    horasEstimadas: 2.0,
    horasRegistradas: 0.0,
    prioridad: 'alta'
  },
  {
    id: 'fase-10',
    titulo: 'Fase 10: Optimización y Certificación Agéntica de IA (is-agentic.com)',
    descripcion: 'Auditar 3 Trust Anchors (/about, /contact, /privacy con > 500 chars), Schema contactPoint y meta 80+/100.',
    columna: 'backlog',
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
    titulo: 'Fase 12: Vinculación Google Maps, Citaciones Tier 1 (Apple Maps, Bing, Waze), Dominio Oficial & Entrega',
    descripcion: 'Verificación en vivo de Google Maps, registro idéntico NAP en directorios Tier 1 (Apple Maps, Bing Places, Waze, Páginas Amarillas), SSL definitivo y entrega ejecutiva.',
    columna: 'backlog',
    horasEstimadas: 1.5,
    horasRegistradas: 0.0,
    prioridad: 'alta'
  }
];

const DEFAULT_SPRINT_TASKS = PLAYBOOK_12_FASES_TASKS;

const SPRINT_TIMER_STORAGE_KEY = 'goglite_active_sprint_timer_state';

const DEFAULT_SPRINT_TIMER = {
  isRunning: false,
  taskId: null,
  proyectoId: null,
  startTime: null,
  accumulatedSeconds: 0,
  targetDurationSeconds: 45 * 60,
  targetMinutes: 45,
  warned5Min: false
};

function getSprintTimerFromStorage() {
  if (typeof window === 'undefined') return DEFAULT_SPRINT_TIMER;
  try {
    const raw = localStorage.getItem(SPRINT_TIMER_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') return { ...DEFAULT_SPRINT_TIMER, ...parsed };
    }
  } catch {}
  return DEFAULT_SPRINT_TIMER;
}

// Calcula los segundos transcurridos reales para facturación y seguimiento en vivo (sin topes destructivos)
function calculateElapsedSprintSeconds(timer) {
  if (!timer || !timer.isRunning) return Number(timer?.accumulatedSeconds) || 0;
  let secs = Number(timer.accumulatedSeconds) || 0;
  if (timer.startTime) {
    const delta = Math.floor((Date.now() - timer.startTime) / 1000);
    secs += Math.max(0, delta);
  }
  return Math.max(0, secs);
}

// Calcula los segundos restantes si hay una meta opcional configurada
function calculateRemainingSprintSeconds(timer) {
  if (!timer || !timer.isRunning || !timer.targetDurationSeconds) return 0;
  const elapsed = calculateElapsedSprintSeconds(timer);
  return Math.max(0, timer.targetDurationSeconds - elapsed);
}

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
  const [prdByProjMap, setPrdByProjMap] = useState({});
  const [sprintTasksByProjMap, setSprintTasksByProjMap] = useState({});
  const [repoVaultByProjMap, setRepoVaultByProjMap] = useState({});
  const [isCloudLoaded, setIsCloudLoaded] = useState(false);
  const activeLoadedProjRef = useRef(null);

  const updatePrdConfig = (updater) => {
    setPrdConfig(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      if (selectedProyectoId) {
        setPrdByProjMap(m => {
          const updated = { ...m, [selectedProyectoId]: next };
          saveAppStateCloud('prd_by_project', 'prd', updated).catch(() => {});
          return updated;
        });
      }
      return next;
    });
  };

  // Estado del Sprint Kanban (Todas las tareas inician en Backlog ordenadas 1..12 con 0h)
  const [sprintTasks, setSprintTasks] = useState(DEFAULT_SPRINT_TASKS);
  const sprintTasksRef = useRef(DEFAULT_SPRINT_TASKS);
  const [draggingSprintTaskId, setDraggingSprintTaskId] = useState(null);
  const [dragOverSprintCol, setDragOverSprintCol] = useState(null);

  useEffect(() => {
    sprintTasksRef.current = sprintTasks;
  }, [sprintTasks]);

  // Actualizador atómico de tareas con persistencia en Firestore Cloud (sin efectos secundarios en el updater de React)
  const updateProjectSprintTasks = (updater) => {
    const prev = sprintTasksRef.current;
    const updated = typeof updater === 'function' ? updater(prev) : updater;
    sprintTasksRef.current = updated;
    setSprintTasks(updated);
    if (selectedProyectoId) {
      setSprintTasksByProjMap(m => {
        const nextMap = { ...m, [selectedProyectoId]: updated };
        saveAppStateCloud('sprint_tasks_by_project', 'sprint_tasks', nextMap).catch(() => {});
        return nextMap;
      });
      syncAllProyectosWithEvents(updated, selectedProyectoId).catch(() => {});
    }
  };

  // Tarea en temporizador activo progresivo (Seguimiento real de desarrollo)
  const [sprintTimer, setSprintTimer] = useState(() => getSprintTimerFromStorage());
  const [timerSeconds, setTimerSeconds] = useState(() => calculateElapsedSprintSeconds(getSprintTimerFromStorage()));
  const activeTimerTaskId = sprintTimer.isRunning ? sprintTimer.taskId : null;

  // Modales de control de tiempo
  const [showTimeboxSelectModal, setShowTimeboxSelectModal] = useState(false);
  const [timeboxTargetTaskId, setTimeboxTargetTaskId] = useState(null);
  const [timeboxDurationMinutes, setTimeboxDurationMinutes] = useState(45);
  const [showExpiredModal, setShowExpiredModal] = useState(false);

  // Modal para agregar nueva tarea
  const [showNewTaskModal, setShowNewTaskModal] = useState(false);
  const [newTaskForm, setNewTaskForm] = useState({
    titulo: '',
    descripcion: '',
    columna: 'backlog',
    horasEstimadas: 1.0,
    prioridad: 'media'
  });

  // Estado de Bóveda de Repositorios & URLs (Configuración limpia y Google Stitch)
  const [repoVault, setRepoVault] = useState({
    googleStitchUrl: '',
    driveAssets: '',
    stagingUrl: '',
    githubRepo: '',
    productionUrl: ''
  });
  const [copiedField, setCopiedField] = useState(null);
  const [savedVaultNotice, setSavedVaultNotice] = useState(false);
  const [creatingDriveVault, setCreatingDriveVault] = useState(false);

  const handleSaveVault = () => {
    try {
      if (selectedProyectoId) {
        setRepoVaultByProjMap(prev => {
          const updated = { ...prev, [selectedProyectoId]: repoVault };
          saveAppStateCloud('repo_vault_by_project', 'repo_vault', updated).catch(() => {});
          return updated;
        });

        const bovedaData = {
          googleStitchUrl: repoVault.googleStitchUrl || '',
          driveAssets: repoVault.driveAssets || '',
          stagingUrl: repoVault.stagingUrl || '',
          githubRepo: repoVault.githubRepo || '',
          urlProduccion: repoVault.productionUrl || '',
          productionUrl: repoVault.productionUrl || ''
        };

        const updatedProjs = proyectos.map(p => {
          if (p.id === selectedProyectoId) {
            return {
              ...p,
              bovedaRepos: { ...(p.bovedaRepos || {}), ...bovedaData },
              repoVault: { ...repoVault }
            };
          }
          return p;
        });
        setProyectos(updatedProjs);

        const currentP = updatedProjs.find(p => p.id === selectedProyectoId);
        if (currentP) {
          saveProyectoCloud(currentP).catch(() => {});
          apiClient.patch(`/api/proyectos/${selectedProyectoId}`, {
            bovedaRepos: bovedaData,
            repoVault: { ...repoVault }
          }).catch(() => {});

          const token = currentP.portalToken || currentP.presupuestoId || currentP.id;
          if (token) {
            getPortalCloud(token).then(portalData => {
              if (portalData) {
                savePortalCloud(token, {
                  ...portalData,
                  proyecto: {
                    ...(portalData.proyecto || {}),
                    bovedaRepos: bovedaData,
                    repoVault: { ...repoVault }
                  },
                  portalConfig: {
                    ...(portalData.portalConfig || {}),
                    driveVaultUrl: bovedaData.driveAssets,
                    enlaceDriveArchivos: bovedaData.driveAssets
                  }
                }).catch(() => {});
              }
            }).catch(() => {});

            apiClient.post(`/api/portal/${token}/update`, {
              bovedaRepos: bovedaData,
              productionUrl: repoVault.productionUrl,
              urlProduccion: repoVault.productionUrl,
              githubRepo: repoVault.githubRepo,
              stagingUrl: repoVault.stagingUrl,
              googleStitchUrl: repoVault.googleStitchUrl,
              enlaceDriveArchivos: repoVault.driveAssets,
              driveVaultUrl: repoVault.driveAssets
            }).catch(() => {});
          }
        }
        window.dispatchEvent(new CustomEvent('goglite_proyectos_synced'));
        window.dispatchEvent(new CustomEvent('goglite_portal_updated'));
      }
      setSavedVaultNotice(true);
      setTimeout(() => setSavedVaultNotice(false), 3000);
    } catch (e) {
      console.warn('Error guardando bóveda:', e);
    }
  };

  const handleCreateDriveVault = async () => {
    try {
      setCreatingDriveVault(true);
      const clientName = proyectoActivo?.cliente?.empresa || prdConfig?.clienteNombre || 'Cliente Goglite';
      const res = await apiClient.post('/api/drive/create-vault', {
        clientName,
        clientEmail: proyectoActivo?.cliente?.email || '',
        leadId: proyectoActivo?.leadId || null
      });
      const cType = res.headers.get('content-type') || '';
      if (res.ok && cType.includes('application/json')) {
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

  // Cargar proyectos y estado de desarrollo desde Firestore Cloud al iniciar
  useEffect(() => {
    fetchProyectos();

    (async () => {
      try {
        const [cloudPrd, cloudTasks, cloudVault] = await Promise.all([
          getAppStateCloud('prd_by_project'),
          getAppStateCloud('sprint_tasks_by_project'),
          getAppStateCloud('repo_vault_by_project')
        ]);
        if (cloudPrd && typeof cloudPrd === 'object') {
          setPrdByProjMap(prev => ({ ...prev, ...cloudPrd }));
        }
        if (cloudTasks && typeof cloudTasks === 'object') {
          setSprintTasksByProjMap(prev => ({ ...prev, ...cloudTasks }));
        }
        if (cloudVault && typeof cloudVault === 'object') {
          setRepoVaultByProjMap(prev => ({ ...prev, ...cloudVault }));
        }
      } catch (e) {
        console.warn('Error cargando estado inicial cloud:', e);
      } finally {
        setIsCloudLoaded(true);
      }
    })();

    const handleStorageChange = () => {
      fetchProyectos();
    };
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('goglite_presupuestos_updated', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('goglite_presupuestos_updated', handleStorageChange);
    };
  }, []);

  // Cargar tareas y bóveda específicas cuando cambia el proyecto seleccionado o se carga la nube
  useEffect(() => {
    if (!selectedProyectoId || !isCloudLoaded || loading) return;
    if (activeLoadedProjRef.current === selectedProyectoId) {
      // Ya está hidratado este proyecto en memoria; no pisar las tareas locales ante re-renders
      return;
    }
    activeLoadedProjRef.current = selectedProyectoId;

    try {
      const tasks = sprintTasksByProjMap[selectedProyectoId];
      const proj = proyectos.find(p => p.id === selectedProyectoId);
      const registroHoras = Array.isArray(proj?.seguimiento?.registroHoras) ? proj.seguimiento.registroHoras : [];

      let rawTasks = Array.isArray(tasks) && tasks.length > 0 ? tasks : DEFAULT_SPRINT_TASKS;
      const playbookMap = new Map(PLAYBOOK_12_FASES_TASKS.map(p => [p.id, p]));
      let synced = rawTasks.map(t => {
        const official = playbookMap.get(t.id);
        if (official) {
          return {
            ...t,
            titulo: official.titulo,
            descripcion: official.descripcion,
            horasEstimadas: t.horasEstimadas || official.horasEstimadas,
            prioridad: t.prioridad || official.prioridad
          };
        }
        return t;
      });

      // Auto-reconciliar con las horas del proyecto (seguimiento.registroHoras) para proteger contra reseteos
      if (registroHoras.length > 0) {
        synced = synced.map(t => {
          if (t.horasRegistradas > 0 && t.columna !== 'backlog') return t;
          const matched = registroHoras.filter(r => {
            const f = (r.fase || '').toLowerCase();
            const phaseNum = (t.id || '').replace('fase-', '');
            return f.includes(t.id) ||
                   f.includes(`fase ${phaseNum}`) ||
                   f.includes(`fase-${phaseNum}`) ||
                   (t.id === 'fase-1' && (f.includes('fase 1') || f.includes('infraestructura'))) ||
                   (t.id === 'fase-2' && (f.includes('fase 2') || f.includes('identidad') || f.includes('arquitectura'))) ||
                   (t.id === 'fase-3' && (f.includes('fase 3') || f.includes('diseño') || f.includes('optimización'))) ||
                   (t.id === 'fase-4' && (f.includes('fase 4') || f.includes('landing') || f.includes('cotizador')));
          });
          if (matched.length > 0) {
            const sum = matched.reduce((a, b) => a + (Number(b.horas) || 0), 0);
            return {
              ...t,
              horasRegistradas: Math.max(t.horasRegistradas || 0, Number(sum.toFixed(2))),
              columna: t.columna === 'backlog' ? 'completado' : t.columna
            };
          }
          return t;
        });
      }

      setSprintTasks(synced);

      const boveda = proj?.bovedaRepos || proj?.repoVault || {};
      const baseVault = {
        googleStitchUrl: boveda.googleStitchUrl || '',
        driveAssets: boveda.driveAssets || proj?.portalConfig?.driveVaultUrl || proj?.portalConfig?.enlaceDriveArchivos || proj?.onboarding?.driveFolderUrl || '',
        stagingUrl: boveda.stagingUrl || '',
        githubRepo: boveda.githubRepo || '',
        productionUrl: boveda.urlProduccion || boveda.productionUrl || ''
      };

      const mapVault = repoVaultByProjMap[selectedProyectoId] || {};
      const pVault = {
        googleStitchUrl: (mapVault.googleStitchUrl || baseVault.googleStitchUrl || '').trim(),
        driveAssets: (mapVault.driveAssets || baseVault.driveAssets || '').trim(),
        stagingUrl: (mapVault.stagingUrl || baseVault.stagingUrl || '').trim(),
        githubRepo: (mapVault.githubRepo || baseVault.githubRepo || '').trim(),
        productionUrl: (mapVault.productionUrl || baseVault.productionUrl || '').trim()
      };
      if (pVault.figmaBoard && !pVault.googleStitchUrl) {
        delete pVault.figmaBoard;
      }
      if (pVault.githubRepo === 'https://github.com/goglite-agency/cliente-web-platform') pVault.githubRepo = '';
      if (pVault.stagingUrl === 'https://goglite-client-staging.web.app') pVault.stagingUrl = '';
      if (pVault.productionUrl === 'https://www.gruasandreasv.com') pVault.productionUrl = '';
      if (pVault.driveAssets === 'https://drive.google.com/drive/folders/goglite-client-assets') pVault.driveAssets = '';
      setRepoVault(pVault);

      // Cargar o generar PRD específico del proyecto seleccionado
      if (prdByProjMap[selectedProyectoId]) {
        const savedPrd = prdByProjMap[selectedProyectoId];
        setPrdConfig({
          ...savedPrd,
          clienteEmpresa: proj?.cliente?.empresa || savedPrd.clienteEmpresa,
          codigo: proj?.codigo || savedPrd.codigo,
          clienteContacto: proj?.cliente?.nombre || savedPrd.clienteContacto,
          clienteTelefono: proj?.cliente?.telefono || savedPrd.clienteTelefono,
          clienteUbicacion: proj?.cliente?.ubicacion || savedPrd.clienteUbicacion,
          actividad: proj?.cliente?.actividad || savedPrd.actividad,
          totalInversion: proj?.contrato?.totalInversion || savedPrd.totalInversion || 300
        });
      } else if (proj) {
        const fresh = generatePrdForProyecto(proj, selectedCountry);
        setPrdConfig(fresh);
        setPrdByProjMap(prev => {
          const updated = { ...prev, [selectedProyectoId]: fresh };
          saveAppStateCloud('prd_by_project', 'prd', updated).catch(() => {});
          return updated;
        });
      } else {
        const fresh = generatePrdForProyecto(null, selectedCountry);
        setPrdConfig(fresh);
      }
    } catch (e) {
      console.warn('Error en sincronización de proyecto:', e);
    }
  }, [selectedProyectoId, isCloudLoaded, loading]);


  // Manejo del temporizador blindado al montar
  useEffect(() => {
    (async () => {
      try {
        const cloudTimer = await getAppStateCloud('sprint_timer_active');
        const localTimer = getSprintTimerFromStorage();
        const chosen = (cloudTimer && cloudTimer.isRunning && (!localTimer.isRunning || (cloudTimer.startTime > (localTimer.startTime || 0))))
          ? cloudTimer
          : localTimer;

        if (chosen && chosen.isRunning && chosen.startTime) {
          // El temporizador sigue vivo y calculamos el tiempo real transcurrido sin pérdida
          const elapsed = calculateElapsedSprintSeconds(chosen);
          setSprintTimer(chosen);
          setTimerSeconds(elapsed);
          localStorage.setItem(SPRINT_TIMER_STORAGE_KEY, JSON.stringify(chosen));
          window.dispatchEvent(new CustomEvent('goglite_timer_heartbeat', { detail: chosen }));
        }
      } catch (err) {
        console.warn('Error sincronizando temporizador en montaje:', err);
      }
    })();
  }, []);

  // Ticking continuo progresivo hacia adelante (1s)
  useEffect(() => {
    if (!sprintTimer.isRunning) {
      setTimerSeconds(0);
      return;
    }

    // Inicializar de inmediato al segundo transcurrido real
    setTimerSeconds(calculateElapsedSprintSeconds(sprintTimer));

    const interval = setInterval(() => {
      const elapsed = calculateElapsedSprintSeconds(sprintTimer);
      setTimerSeconds(elapsed);

      const tareaActual = sprintTasks.find(t => t.id === sprintTimer.taskId);
      const taskTitle = tareaActual ? tareaActual.titulo : 'Tarea de Desarrollo';

      // Aviso suave al alcanzar la meta de tiempo sugerida (ej. 45 min = 2700s)
      const targetSecs = sprintTimer.targetDurationSeconds || (sprintTimer.targetMinutes ? sprintTimer.targetMinutes * 60 : 45 * 60);
      if (elapsed >= targetSecs && !sprintTimer.warned5Min) {
        setSprintTimer(prev => {
          const updated = { ...prev, warned5Min: true };
          localStorage.setItem(SPRINT_TIMER_STORAGE_KEY, JSON.stringify(updated));
          return updated;
        });
        playTimerChime('warning');
        sendTimerNotification(
          '⏰ Goglite · Meta de Tiempo Cumplida',
          `Has alcanzado los ${sprintTimer.targetMinutes || 45} min sugeridos en "${taskTitle}". El cronómetro continúa registrando tu tiempo exacto.`,
          'timer-goal-met'
        );
      }
    }, 1000);

    // Heartbeat cada 15 segundos: persiste el tiempo transcurrido en local y nube
    const heartbeat = setInterval(() => {
      try {
        const updated = {
          ...sprintTimer,
          accumulatedSeconds: calculateElapsedSprintSeconds(sprintTimer),
          lastHeartbeat: Date.now()
        };
        localStorage.setItem(SPRINT_TIMER_STORAGE_KEY, JSON.stringify(updated));
        saveAppStateCloud('sprint_timer_active', 'timer', updated).catch(() => {});
        window.dispatchEvent(new CustomEvent('goglite_timer_heartbeat', { detail: updated }));
      } catch {}
    }, 15000);

    return () => {
      clearInterval(interval);
      clearInterval(heartbeat);
    };
  }, [sprintTimer, sprintTasks]);

  const fetchProyectos = async () => {
    try {
      const [cloudProjs, cloudProps] = await Promise.all([
        getProyectosCloud().catch(() => []),
        getPresupuestosCloud().catch(() => [])
      ]);

      let list = Array.isArray(cloudProjs) ? [...cloudProjs] : [];

      // 1. Reconciliar proyectos existentes que carezcan de cliente completo con presupuestos
      list = list.map(p => {
        if (!p.cliente || !p.cliente.empresa) {
          const matchedProp = (cloudProps || []).find(pr =>
            pr.id === p.presupuestoId ||
            pr.codigo === p.presupuestoCodigo ||
            pr.leadId === p.leadId ||
            pr.leadId === p.id ||
            pr.id === p.id ||
            (p.nombre && pr.cliente?.empresa && p.nombre.toLowerCase().includes(pr.cliente.empresa.toLowerCase()))
          );
          if (matchedProp && matchedProp.cliente) {
            return {
              ...p,
              codigo: p.codigo || matchedProp.codigo || 'P-2026',
              presupuestoId: p.presupuestoId || matchedProp.id,
              presupuestoCodigo: p.presupuestoCodigo || matchedProp.codigo,
              portalToken: p.portalToken || matchedProp.portalToken,
              pais: p.pais || matchedProp.pais || 'DO',
              cliente: {
                empresa: matchedProp.cliente.empresa,
                nombre: matchedProp.cliente.nombre,
                telefono: matchedProp.cliente.telefono,
                email: matchedProp.cliente.email,
                ubicacion: matchedProp.cliente.ubicacion,
                actividad: matchedProp.cliente.actividad
              },
              contrato: {
                ...(p.contrato || {}),
                totalInversion: p.contrato?.totalInversion || Number(matchedProp.inversion?.precioTotal) || 300
              }
            };
          }
        }
        return p;
      });

      // 2. Incorporar propuestas/presupuestos aprobados que aún no estén en la lista
      if (Array.isArray(cloudProps) && cloudProps.length > 0) {
        cloudProps.forEach(prop => {
          if (!prop || !prop.id) return;
          const targetEmp = (prop.cliente?.empresa || '').toLowerCase().trim();
          const exists = list.some(p =>
            p.id === prop.id ||
            p.presupuestoId === prop.id ||
            p.codigo === prop.codigo ||
            p.presupuestoCodigo === prop.codigo ||
            (targetEmp && p.cliente?.empresa && p.cliente.empresa.toLowerCase().trim() === targetEmp)
          );
          if (!exists) {
            const built = buildProyectoFromPresupuesto(prop, list);
            if (built && !isExcludedProyecto(built.cliente?.empresa, built.id, built.codigo, built.presupuestoId, built.presupuestoCodigo)) {
              list.push(built);
            }
          }
        });
      }

      // 3. Consultar API local si responde
      try {
        const res = await fetch('/api/proyectos');
        const cType = res.headers.get('content-type') || '';
        if (res.ok && cType.includes('application/json')) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            const map = new Map();
            [...list, ...data].forEach(p => {
              if (p?.id && !map.has(p.id)) map.set(p.id, p);
            });
            list = Array.from(map.values());
          }
        }
      } catch (err) {
        console.warn('Usando proyectos cloud:', err);
      }

      // Filtrar proyectos excluidos
      list = list.filter(p =>
        p && !isExcludedProyecto(p.cliente?.empresa || p.cliente?.nombre, p.id, p.codigo, p.presupuestoId, p.presupuestoCodigo, p._firestoreDocId)
      );

      setProyectos(list);
      if (list.length > 0) {
        setSelectedProyectoId(prev => {
          if (prev && list.some(p => p.id === prev)) return prev;
          // Si hay proyectos para el país seleccionado, preferirlos
          const matchCountry = list.find(p => p.pais === selectedCountry);
          return matchCountry ? matchCountry.id : list[0].id;
        });
      }
    } catch (err) {
      console.warn('Error fetching proyectos in PRD:', err);
    } finally {
      setLoading(false);
    }
  };

  const rawProyectoActivo = proyectos.find(p => p.id === selectedProyectoId) || proyectos[0] || null;
  const proyectoActivo = rawProyectoActivo ? {
    ...rawProyectoActivo,
    codigo: rawProyectoActivo.codigo || rawProyectoActivo.presupuestoCodigo || 'PRD-ACTIVO',
    cliente: {
      empresa: rawProyectoActivo.cliente?.empresa || rawProyectoActivo.nombre?.split(' - ')?.[0] || (selectedCountry === 'DO' ? 'L&M Tours Punta Cana' : 'Grúas Andrea San Salvador'),
      nombre: rawProyectoActivo.cliente?.nombre || 'Representante Autorizado',
      actividad: rawProyectoActivo.cliente?.actividad || (selectedCountry === 'DO' ? 'Transporte Turístico & Excursiones' : 'Grúas Plataforma y Auxilio Vial 24 Horas'),
      telefono: rawProyectoActivo.cliente?.telefono || (selectedCountry === 'DO' ? '+1 (829) 528-4713' : '+503 7756-9828'),
      ubicacion: rawProyectoActivo.cliente?.ubicacion || (selectedCountry === 'DO' ? 'Punta Cana, República Dominicana' : 'San Salvador, El Salvador')
    }
  } : {
    id: 'demo-proj-1',
    codigo: 'PRD-2026-001',
    cliente: {
      empresa: selectedCountry === 'DO' ? 'L&M Tours Punta Cana' : 'Grúas Andrea San Salvador',
      nombre: 'Víctor Matos',
      actividad: selectedCountry === 'DO' ? 'Transporte Turístico & Excursiones' : 'Grúas Plataforma y Auxilio Vial 24 Horas',
      telefono: selectedCountry === 'DO' ? '+1 (829) 528-4713' : '+503 7756-9828',
      ubicacion: selectedCountry === 'DO' ? 'Punta Cana, República Dominicana' : 'San Salvador, El Salvador'
    }
  };

  // Iniciar cronómetro progresivo en una tarea (Seguimiento en vivo sin topes destructivos)
  const handleStartTimeboxTimer = async (taskId, minutes = 45) => {
    requestNotificationPermission().catch(() => {});

    // Si ya había otro timer corriendo en otra tarea, acumular sus horas antes de cambiar
    if (sprintTimer.isRunning && sprintTimer.taskId && sprintTimer.taskId !== taskId) {
      await handleCommitTimer(sprintTimer.taskId);
    }

    const durationSecs = minutes * 60;
    const now = Date.now();
    const newTimer = {
      isRunning: true,
      taskId,
      proyectoId: selectedProyectoId || proyectoActivo?.id || null,
      startTime: now,
      accumulatedSeconds: 0,
      targetDurationSeconds: durationSecs,
      targetMinutes: minutes,
      warned5Min: false,
      lastHeartbeat: now
    };

    setSprintTimer(newTimer);
    setTimerSeconds(0);
    setShowTimeboxSelectModal(false);
    setShowExpiredModal(false);

    try {
      localStorage.setItem(SPRINT_TIMER_STORAGE_KEY, JSON.stringify(newTimer));
      saveAppStateCloud('sprint_timer_active', 'timer', newTimer).catch(() => {});
      window.dispatchEvent(new CustomEvent('goglite_timer_heartbeat', { detail: newTimer }));
    } catch {}
  };

  // Extender meta de tiempo de la tarea actual (+15, +30, +60 min)
  const handleExtendTimer = (extraMinutes = 15) => {
    const extraSecs = extraMinutes * 60;
    const now = Date.now();
    const updated = {
      ...sprintTimer,
      targetDurationSeconds: (sprintTimer.targetDurationSeconds || 0) + extraSecs,
      targetMinutes: (sprintTimer.targetMinutes || 0) + extraMinutes,
      warned5Min: false,
      lastHeartbeat: now
    };

    setSprintTimer(updated);
    try {
      localStorage.setItem(SPRINT_TIMER_STORAGE_KEY, JSON.stringify(updated));
      saveAppStateCloud('sprint_timer_active', 'timer', updated).catch(() => {});
      window.dispatchEvent(new CustomEvent('goglite_timer_heartbeat', { detail: updated }));
    } catch {}
  };

  // Asentar y registrar las horas al P&L / Finanzas y a la tarea con persistencia blindada
  const handleCommitTimer = async (taskId) => {
    const targetTaskId = taskId || sprintTimer.taskId;
    if (!targetTaskId) return;

    let totalSecs = calculateElapsedSprintSeconds(sprintTimer);
    if (totalSecs < 60) totalSecs = 60; // Mínimo de 1 minuto para evitar horas en blanco

    const horasIncremento = Math.max(0.1, Number((totalSecs / 3600).toFixed(2)));

    // 1. Actualizar horas en tarea local y guardar de inmediato en Firestore Cloud
    let updatedTasks = [];
    setSprintTasks(prev => {
      updatedTasks = prev.map(t => {
        if (t.id === targetTaskId) {
          return {
            ...t,
            horasRegistradas: Number(((t.horasRegistradas || 0) + horasIncremento).toFixed(2)),
            columna: t.columna === 'backlog' ? 'desarrollo' : t.columna
          };
        }
        return t;
      });
      return updatedTasks;
    });

    if (selectedProyectoId && updatedTasks.length > 0) {
      setSprintTasksByProjMap(prev => {
        const nextMap = { ...prev, [selectedProyectoId]: updatedTasks };
        saveAppStateCloud('sprint_tasks_by_project', 'sprint_tasks', nextMap).catch(() => {});
        return nextMap;
      });
    }

    // 2. Limpiar timer persistente
    const stoppedTimer = { ...DEFAULT_SPRINT_TIMER };
    setSprintTimer(stoppedTimer);
    setTimerSeconds(0);
    setShowExpiredModal(false);

    try {
      localStorage.removeItem(SPRINT_TIMER_STORAGE_KEY);
      saveAppStateCloud('sprint_timer_active', 'timer', stoppedTimer).catch(() => {});
      window.dispatchEvent(new CustomEvent('goglite_timer_heartbeat', { detail: stoppedTimer }));
    } catch {}

    // 3. Registrar en Finanzas Cloud (finanzas_v1)
    const tareaObj = sprintTasks.find(t => t.id === targetTaskId);
    const clienteEmpresa = proyectoActivo.cliente?.empresa || 'Cliente de Agencia';
    const conceptoTarea = tareaObj ? tareaObj.titulo : 'Desarrollo en Sprint';
    const costoHoraEst = 30;
    const fechaHoy = new Date().toISOString().split('T')[0];

    try {
      const parsedFin = (await getAppStateCloud('finanzas_v1')) || {};
      const localTimeEntry = {
        id: 'time-' + Date.now(),
        proyectoId: proyectoActivo.id,
        cliente: clienteEmpresa,
        concepto: conceptoTarea,
        categoria: 'frontend_astro',
        horas: horasIncremento,
        costoHora: costoHoraEst,
        costoTotal: Number((horasIncremento * costoHoraEst).toFixed(2)),
        fecha: fechaHoy,
        responsable: 'Víctor Matos'
      };
      parsedFin.timeEntries = [localTimeEntry, ...(parsedFin.timeEntries || [])];
      saveAppStateCloud('finanzas_v1', 'finanzas', parsedFin).catch(() => {});
    } catch (e) {}

    try {
      await apiClient.post('/api/finanzas/horas', {
        proyectoId: proyectoActivo.id,
        cliente: clienteEmpresa,
        proyectoNombre: clienteEmpresa,
        concepto: conceptoTarea,
        tarea: conceptoTarea,
        categoria: 'frontend_astro',
        descripcion: `Tiempo registrado desde Cronómetro (${totalSecs}s / ${horasIncremento}h)`,
        horas: horasIncremento,
        costoHora: costoHoraEst,
        costoPorHora: costoHoraEst,
        moneda: 'USD',
        fecha: fechaHoy,
        responsable: 'Víctor Matos'
      });
    } catch (err) {
      console.warn('Horas guardadas en local/cloud');
    }

    // 4. Actualizar seguimiento.registroHoras en el proyecto
    try {
      const updatedProjs = proyectos.map(p => {
        if (p.id === selectedProyectoId) {
          const prevReg = Array.isArray(p.seguimiento?.registroHoras) ? p.seguimiento.registroHoras : [];
          const newReg = [
            ...prevReg,
            {
              fecha: fechaHoy,
              fase: conceptoTarea,
              detalle: `Sesión de desarrollo registrada en vivo (${horasIncremento} hrs).`,
              horas: horasIncremento,
              responsable: 'Víctor Matos'
            }
          ];
          const newTotal = Number((newReg.reduce((acc, curr) => acc + (Number(curr.horas) || 0), 0)).toFixed(2));
          return {
            ...p,
            seguimiento: {
              ...(p.seguimiento || {}),
              registroHoras: newReg,
              totalHorasRegistradas: newTotal
            }
          };
        }
        return p;
      });
      setProyectos(updatedProjs);
      const currP = updatedProjs.find(p => p.id === selectedProyectoId);
      if (currP) {
        saveProyectoCloud(currP).catch(() => {});
      }
    } catch (e) {}

    window.dispatchEvent(new CustomEvent('goglite_tasks_updated'));
    window.dispatchEvent(new CustomEvent('goglite_proyectos_synced'));
  };

  // Clic en el botón de cronómetro de la tarjeta
  const handleTaskPlayClick = (taskId) => {
    if (activeTimerTaskId === taskId) {
      // Si ya está corriendo en ESTA tarea, detener y registrar tiempo transcurrido
      handleCommitTimer(taskId);
    } else {
      // Iniciar de inmediato el cronómetro en esta tarea
      handleStartTimeboxTimer(taskId, 45);
    }
  };

  // Mover tarea entre columnas de Sprint
  const handleMoveTaskColumn = (taskId, nuevaColumna) => {
    updateProjectSprintTasks(prev => prev.map(t => t.id === taskId ? { ...t, columna: nuevaColumna } : t));
  };

  // Eliminar tarea
  const handleDeleteTask = (taskId) => {
    if (activeTimerTaskId === taskId) {
      const stoppedTimer = { ...DEFAULT_SPRINT_TIMER };
      setSprintTimer(stoppedTimer);
      setTimerSeconds(0);
      try {
        localStorage.removeItem(SPRINT_TIMER_STORAGE_KEY);
        saveAppStateCloud('sprint_timer_active', 'timer', stoppedTimer).catch(() => {});
        window.dispatchEvent(new CustomEvent('goglite_timer_heartbeat', { detail: stoppedTimer }));
      } catch {}
    }
    updateProjectSprintTasks(prev => prev.filter(t => t.id !== taskId));
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

    updateProjectSprintTasks(prev => [newTask, ...prev]);
    setNewTaskForm({
      titulo: '',
      descripcion: '',
      columna: 'backlog',
      horasEstimadas: 1.0,
      prioridad: 'media'
    });
    setShowNewTaskModal(false);
  };

  // Cargar las 12 Fases Oficiales del Playbook Maestro Goglite 2026 (Todas en Backlog con 0h)
  const handleResetToPlaybook12Fases = () => {
    if (!window.confirm('¿Seguro que deseas reiniciar las 12 fases oficiales? Esto reemplazará las tareas y horas registradas por la plantilla inicial.')) {
      return;
    }
    updateProjectSprintTasks(PLAYBOOK_12_FASES_TASKS);
    alert('✓ Las 12 Fases Oficiales han sido cargadas en orden cronológico en Por Iniciar (Backlog) con 0 horas registradas.');
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
**Contacto:** ${proyectoActivo.cliente?.nombre}
**Teléfono / WhatsApp:** ${proyectoActivo.cliente?.telefono}
**Ubicación:** ${proyectoActivo.cliente?.ubicacion || (selectedCountry === 'DO' ? 'República Dominicana' : 'El Salvador')}
**Actividad:** ${proyectoActivo.cliente?.actividad || 'Servicios Profesionales'}
**Inversión Acordada:** $${proyectoActivo.contrato?.totalInversion || 300} USD
**Garantía de Plazos:** 10 a 15 días hábiles llave en mano
**Meta de Carga:** < 0.8s en 4G Móvil (PageSpeed > 95) · Mobile-First

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

## 3. Páginas y Módulos a Construir
${prdConfig.paginasRequeridas.map(p => `- [${p.completado ? 'x' : ' '}] **${p.nombre}:** ${p.descripcion}`).join('\n')}

## 4. Integraciones de Conversión
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
    setTimeout(() => setCopiedPrdMarkdown(false), 2000);
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
                  {p.codigo || p.presupuestoCodigo || 'PROY'} · {p.cliente?.empresa || p.nombre || 'Cliente'}
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
            <span>3. Brand Story (StoryBrand 7 Partes)</span>
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
          <div className="flex items-center gap-3 px-3.5 py-1.5 rounded-xl bg-slate-900/95 border border-emerald-500/50 text-emerald-300 text-xs font-mono shadow-2xl backdrop-blur-md">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
              <Clock className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-[11px] text-slate-400 font-sans hidden sm:inline">Tiempo en Vivo:</span>
              <span className="text-xs font-extrabold text-white bg-black/60 px-2.5 py-0.5 rounded border border-emerald-500/40">
                {formatSecondsCountdown(timerSeconds)}
              </span>
              <span className="text-[10px] text-slate-400 font-sans hidden md:inline">
                ({sprintTasks.find(t => t.id === activeTimerTaskId)?.titulo?.split(':')?.[0] || 'En progreso'})
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => handleExtendTimer(15)}
                className="px-2 py-0.5 rounded bg-emerald-500/20 hover:bg-emerald-500/35 text-emerald-300 text-[10px] font-sans font-bold transition-colors border border-emerald-500/30"
                title="Añadir 15 minutos a la meta sugerida"
              >
                +15m
              </button>
              <button
                onClick={() => handleCommitTimer(activeTimerTaskId)}
                className="px-3 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-[11px] font-sans font-bold transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
                title="Detener cronómetro y asentar las horas trabajadas en el P&L y en la tarea"
              >
                <Square className="w-2.5 h-2.5 fill-current" />
                <span>Detener & Guardar Horas</span>
              </button>
            </div>
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5 select-none">
            {[
              { id: 'backlog', titulo: 'Por Iniciar (Backlog)', color: 'border-slate-800 bg-slate-900/40 text-slate-400' },
              { id: 'desarrollo', titulo: 'En Desarrollo', color: 'border-amber-500/30 bg-amber-500/5 text-amber-300' },
              { id: 'staging', titulo: 'En Staging / Pruebas', color: 'border-cyan-500/30 bg-cyan-500/5 text-cyan-300' },
              { id: 'completado', titulo: 'Aprobado & Listo', color: 'border-emerald-500/30 bg-emerald-500/5 text-emerald-300' }
            ].map(col => {
              const tasksInCol = sprintTasks.filter(t => t.columna === col.id);
              const isDropTarget = dragOverSprintCol === col.id;
              return (
                <div
                  key={col.id}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.dataTransfer.dropEffect = 'move';
                    if (dragOverSprintCol !== col.id) setDragOverSprintCol(col.id);
                  }}
                  onDragLeave={(e) => {
                    if (e.currentTarget.contains(e.relatedTarget)) return;
                    setDragOverSprintCol(null);
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragOverSprintCol(null);
                    setDraggingSprintTaskId(null);
                    const droppedTaskId = e.dataTransfer.getData('text/plain');
                    if (droppedTaskId) {
                      handleMoveTaskColumn(droppedTaskId, col.id);
                    }
                  }}
                  className={`rounded-xl border p-3 flex flex-col justify-between min-h-[480px] transition-colors ${col.color} ${
                    isDropTarget ? 'ring-2 ring-orange-500/60 border-orange-500 bg-orange-500/10' : ''
                  }`}
                >
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
                        const isDraggingTask = draggingSprintTaskId === task.id;
                        return (
                          <div
                            key={task.id}
                            draggable={true}
                            onDragStart={(e) => {
                              e.dataTransfer.setData('text/plain', task.id);
                              e.dataTransfer.effectAllowed = 'move';
                              setTimeout(() => setDraggingSprintTaskId(task.id), 0);
                            }}
                            onDragEnd={() => {
                              setDraggingSprintTaskId(null);
                              setDragOverSprintCol(null);
                            }}
                            className={`p-3 rounded-lg border text-xs space-y-2.5 transition-colors cursor-grab active:cursor-grabbing ${
                              isDraggingTask
                                ? 'opacity-40 border-dashed border-orange-500'
                                : isTimerRunning
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

                            {/* Acceso Directo de Auditoría QA en Kanban */}
                            {task.id === 'fase-9' && (
                              <div className="pt-1">
                                <a
                                  href={`https://pagespeed.web.dev/analysis?url=${encodeURIComponent(repoVault.stagingUrl || repoVault.productionUrl || 'https://goglite-agency.web.app')}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="w-full inline-flex items-center justify-center gap-1.5 px-2.5 py-1 rounded bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold font-mono transition-all shadow-sm"
                                >
                                  <Zap className="w-3 h-3 text-emerald-400" />
                                  <span>⚡ Auditar en PageSpeed ↗</span>
                                </a>
                              </div>
                            )}

                            {task.id === 'fase-10' && (
                              <div className="pt-1">
                                <a
                                  href="https://is-agentic.com"
                                  target="_blank"
                                  rel="noreferrer"
                                  className="w-full inline-flex items-center justify-center gap-1.5 px-2.5 py-1 rounded bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/30 text-purple-300 text-[10px] font-bold font-mono transition-all shadow-sm"
                                >
                                  <Sparkles className="w-3 h-3 text-purple-400" />
                                  <span>🤖 Certificar en is-agentic ↗</span>
                                </a>
                              </div>
                            )}

                            {/* Badge de Horas y Cronómetro */}
                            <div className="pt-1.5 border-t border-slate-800/60 flex items-center justify-between text-[10px] font-mono">
                              <div className="text-slate-400">
                                <span>Est: {task.horasEstimadas}h</span>
                                <span className="mx-1 text-slate-600">·</span>
                                <span className="text-emerald-400 font-bold">Reg: {task.horasRegistradas || 0}h</span>
                              </div>

                              {/* Botón de Iniciar / Pausar Cronómetro */}
                              <button
                                onClick={() => handleTaskPlayClick(task.id)}
                                className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-[10px] font-bold transition-all cursor-pointer ${
                                  isTimerRunning
                                    ? 'bg-rose-600 hover:bg-rose-500 text-white animate-pulse shadow-md'
                                    : 'bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30'
                                }`}
                                title={isTimerRunning ? 'Detener cronómetro y asentar las horas trabajadas' : 'Iniciar cronómetro de desarrollo en vivo'}
                              >
                                {isTimerRunning ? (
                                  <>
                                    <Square className="w-2.5 h-2.5 fill-current" />
                                    <span>{formatSecondsCountdown(timerSeconds)} · Detener</span>
                                  </>
                                ) : (
                                  <>
                                    <Play className="w-2.5 h-2.5 fill-current" />
                                    <span>Iniciar Cronómetro</span>
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

          {/* Banner de Especificación de Proyecto Activo */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-[#101726] via-[#121c33] to-[#0c1017] border border-orange-500/30 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-lg">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-orange-400 shrink-0 mt-0.5">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[10px] font-mono bg-orange-500/20 text-orange-400 px-2 py-0.5 rounded-full font-bold">
                    {proyectoActivo.codigo || 'PRD-ACTIVO'}
                  </span>
                  <span className="text-xs text-slate-400 font-medium">
                    {proyectoActivo.cliente?.ubicacion || (selectedCountry === 'DO' ? 'Rep. Dominicana' : 'El Salvador')}
                  </span>
                  <span className="text-[10px] bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 px-2 py-0.5 rounded font-mono font-bold">
                    Inversión: ${proyectoActivo.contrato?.totalInversion || 300} USD
                  </span>
                </div>
                <h3 className="text-base font-bold text-white mt-1">
                  {proyectoActivo.cliente?.empresa}
                </h3>
                <p className="text-xs text-slate-300 mt-0.5">
                  Contacto: <strong className="text-white">{proyectoActivo.cliente?.nombre}</strong> · Tel/WhatsApp: <strong className="text-orange-300">{proyectoActivo.cliente?.telefono}</strong> · {proyectoActivo.cliente?.actividad || 'Servicios Profesionales'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => {
                  const fresh = generatePrdForProyecto(proyectoActivo, selectedCountry);
                  updatePrdConfig(fresh);
                  setSavedPrdNotice(true);
                  setTimeout(() => setSavedPrdNotice(false), 2500);
                }}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition-colors"
                title="Regenerar y sincronizar PRD con los módulos de este proyecto"
              >
                <RefreshCw className="w-3.5 h-3.5 text-orange-400" />
                <span>{savedPrdNotice ? '✓ Sincronizado' : 'Sincronizar Módulos'}</span>
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
                      updatePrdConfig(prev => {
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
                        updatePrdConfig(prev => {
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
          <WireframesStoryBrandModule selectedCountry={selectedCountry} externalSelectedProyectoId={selectedProyectoId} />
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: BÓVEDA DE REPOSITORIOS, GOOGLE STITCH, DRIVE & STAGING             */}
      {/* ========================================================================= */}
      {activeTab === 'repositorios' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#0d121c] p-3 rounded-xl border border-slate-800">
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <FolderGit2 className="w-4 h-4 text-orange-400" />
                <span>Bóveda de Repositorios, URLs & Entornos</span>
              </h2>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Centraliza los accesos de desarrollo del cliente: Google Stitch (UI), Drive de activos, Staging en Firebase, GitHub privado y Dominio de producción.
              </p>
            </div>
            <div className="flex items-center gap-2.5">
              {savedVaultNotice && (
                <span className="text-xs font-mono text-emerald-400 font-bold flex items-center gap-1 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-1.5 rounded-lg animate-pulse">
                  <Check className="w-3.5 h-3.5" /> ¡Bóveda Guardada!
                </span>
              )}
              <button
                onClick={handleSaveVault}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-sm"
                title="Guardar URLs y accesos en el proyecto"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Guardar Bóveda</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* 1. Google Stitch (Prototipo UI & Diseño) */}
            <div className="p-4 rounded-xl bg-[#0c1017] border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-2">
                  <Layout className="w-3.5 h-3.5 text-blue-400" />
                  <span>Google Stitch (UI & Diseño)</span>
                </label>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleCopyText(repoVault.googleStitchUrl || '', 'stitch')}
                    className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] flex items-center gap-1 font-mono"
                  >
                    {copiedField === 'stitch' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>Copiar</span>
                  </button>
                  {repoVault.googleStitchUrl && (
                    <a
                      href={repoVault.googleStitchUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
                      title="Abrir Google Stitch"
                    >
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
              <input
                type="text"
                placeholder="https://stitch.google.com/..."
                value={repoVault.googleStitchUrl || ''}
                onChange={(e) => setRepoVault({ ...repoVault, googleStitchUrl: e.target.value })}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-blue-500"
              />
              <p className="text-[10px] text-slate-500">Prototipo interactivo y wireframes visuales diseñados en Google Stitch para el cliente.</p>
            </div>

            {/* 2. Google Drive / Bóveda de Assets */}
            <div className="p-4 rounded-xl bg-[#0c1017] border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-2">
                  <FolderGit2 className="w-3.5 h-3.5 text-amber-400" />
                  <span>Google Drive (Logos & Assets)</span>
                </label>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={handleCreateDriveVault}
                    disabled={creatingDriveVault}
                    title="Crear o enlazar bóveda centralizada"
                    className="p-1 px-2 rounded bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-[10px] flex items-center gap-1 font-mono font-bold transition-colors"
                  >
                    <RefreshCw className={`w-3 h-3 ${creatingDriveVault ? 'animate-spin' : ''}`} />
                    <span>{creatingDriveVault ? 'Creando...' : '⚡ Sincronizar'}</span>
                  </button>
                  <button
                    onClick={() => handleCopyText(repoVault.driveAssets || '', 'drive')}
                    className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] flex items-center gap-1 font-mono"
                  >
                    {copiedField === 'drive' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>Copiar</span>
                  </button>
                  {repoVault.driveAssets && (
                    <a
                      href={repoVault.driveAssets}
                      target="_blank"
                      rel="noreferrer"
                      className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
                      title="Abrir Google Drive"
                    >
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
              <input
                type="text"
                placeholder="https://drive.google.com/drive/folders/..."
                value={repoVault.driveAssets || ''}
                onChange={(e) => setRepoVault({ ...repoVault, driveAssets: e.target.value })}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-amber-500"
              />
              <p className="text-[10px] text-slate-500">Carpeta oficial compartida con el cliente para fotos en alta resolución, branding y recursos.</p>
            </div>

            {/* 3. Staging URL (Firebase) */}
            <div className="p-4 rounded-xl bg-[#0c1017] border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-2">
                  <Globe className="w-3.5 h-3.5 text-cyan-400" />
                  <span>URL de Staging (Firebase)</span>
                </label>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleCopyText(repoVault.stagingUrl || '', 'staging')}
                    className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] flex items-center gap-1 font-mono"
                  >
                    {copiedField === 'staging' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>Copiar</span>
                  </button>
                  {repoVault.stagingUrl && (
                    <a
                      href={repoVault.stagingUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
                      title="Abrir Staging"
                    >
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
              <input
                type="text"
                placeholder="https://proyecto-staging.web.app"
                value={repoVault.stagingUrl || ''}
                onChange={(e) => setRepoVault({ ...repoVault, stagingUrl: e.target.value })}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-500"
              />
              <p className="text-[10px] text-slate-500">Entorno de pruebas y previsualización para el cliente con despliegues automáticos.</p>
            </div>

            {/* 4. GitHub Repo */}
            <div className="p-4 rounded-xl bg-[#0c1017] border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-2">
                  <GitBranch className="w-3.5 h-3.5 text-orange-400" />
                  <span>Repositorio GitHub (Privado)</span>
                </label>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleCopyText(repoVault.githubRepo || '', 'github')}
                    className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] flex items-center gap-1 font-mono"
                  >
                    {copiedField === 'github' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>Copiar</span>
                  </button>
                  {repoVault.githubRepo && (
                    <a
                      href={repoVault.githubRepo}
                      target="_blank"
                      rel="noreferrer"
                      className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
                      title="Abrir Repositorio GitHub"
                    >
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
              <input
                type="text"
                placeholder="https://github.com/organizacion/repositorio-privado"
                value={repoVault.githubRepo || ''}
                onChange={(e) => setRepoVault({ ...repoVault, githubRepo: e.target.value })}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-orange-500"
              />
              <p className="text-[10px] text-slate-500">Control de versiones privado donde se compila el código fuente con Astro / Vite.</p>
            </div>

            {/* 5. Dominio Oficial en Producción */}
            <div className="p-4 rounded-xl bg-[#0c1017] border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-2">
                  <Globe className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Dominio Oficial (Producción)</span>
                </label>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleCopyText(repoVault.productionUrl || '', 'production')}
                    className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] flex items-center gap-1 font-mono"
                  >
                    {copiedField === 'production' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>Copiar</span>
                  </button>
                  {repoVault.productionUrl && (
                    <a
                      href={repoVault.productionUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
                      title="Abrir Dominio Oficial"
                    >
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
              <input
                type="text"
                placeholder="https://www.dominiodelcliente.com"
                value={repoVault.productionUrl || ''}
                onChange={(e) => setRepoVault({ ...repoVault, productionUrl: e.target.value })}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-emerald-500"
              />
              <p className="text-[10px] text-slate-500">Dominio definitivo del cliente enlazado con certificado SSL de Firebase Hosting.</p>
            </div>

            {/* 6. Herramientas de Auditoría QA en Vivo */}
            <div className="p-4 rounded-xl bg-[#0c1017] border border-slate-800 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-300 font-mono">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Auditoría QA & Certificación en Vivo</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <a
                  href={`https://pagespeed.web.dev/analysis?url=${encodeURIComponent(repoVault.stagingUrl || repoVault.productionUrl || 'https://goglite-agency.web.app')}`}
                  target="_blank"
                  rel="noreferrer"
                  className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-emerald-500/40 flex items-center justify-between text-slate-300 hover:text-white transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-[11px] font-bold">PageSpeed</span>
                  </div>
                  <ExternalLink className="w-3 h-3 text-slate-500" />
                </a>

                <a
                  href="https://is-agentic.com"
                  target="_blank"
                  rel="noreferrer"
                  className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-purple-500/40 flex items-center justify-between text-slate-300 hover:text-white transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                    <span className="text-[11px] font-bold">is-agentic</span>
                  </div>
                  <ExternalLink className="w-3 h-3 text-slate-500" />
                </a>
              </div>
              <p className="text-[10px] text-slate-500">Auditorías automáticas también disponibles directamente en las tarjetas de Fase 9 y 10 del Sprint Kanban.</p>
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

      {/* ========================================================================= */}
      {/* MODAL: SELECCIÓN DE BLOQUE TIMEBOXING                                      */}
      {/* ========================================================================= */}
      {showTimeboxSelectModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#0f1422] border border-slate-800 rounded-2xl p-5 space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-400" />
                <span>Iniciar Temporizador Blindado (Timeboxing)</span>
              </h3>
              <button
                onClick={() => setShowTimeboxSelectModal(false)}
                className="text-slate-500 hover:text-slate-300"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800/80">
                <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 block mb-0.5">Tarea a Desarrollar:</span>
                <p className="text-xs font-semibold text-slate-200">
                  {sprintTasks.find(t => t.id === timeboxTargetTaskId)?.titulo || 'Tarea de Sprint'}
                </p>
              </div>

              <div>
                <label className="text-[11px] font-mono text-slate-300 block mb-2">
                  Selecciona la duración estimada del bloque:
                </label>
                <div className="grid grid-cols-4 gap-2 mb-3">
                  {[15, 30, 45, 60].map(mins => (
                    <button
                      key={mins}
                      type="button"
                      onClick={() => setTimeboxDurationMinutes(mins)}
                      className={`py-2 rounded-xl text-xs font-bold transition-all border ${
                        timeboxDurationMinutes === mins
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-md scale-[1.02]'
                          : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-slate-200'
                      }`}
                    >
                      {mins} min
                      {mins === 45 && <span className="block text-[8px] font-normal text-emerald-400">Recomendado</span>}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-slate-400 font-mono">O personalizar:</span>
                  <input
                    type="number"
                    min="5"
                    max="180"
                    step="5"
                    value={timeboxDurationMinutes}
                    onChange={(e) => setTimeboxDurationMinutes(Math.max(5, Number(e.target.value) || 5))}
                    className="w-20 bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-xs text-white text-center font-mono focus:outline-none focus:border-emerald-500"
                  />
                  <span className="text-[11px] text-slate-400 font-mono">minutos</span>
                </div>
              </div>

              {/* Caja informativa de seguridad */}
              <div className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-500/20 flex items-start gap-2 text-[11px] text-emerald-300/90 leading-relaxed">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <p>
                  <strong>Cronómetro Progresivo en Vivo:</strong> El tiempo se registra segundo a segundo y se sincroniza en segundo plano. Te notificará al cumplir tu meta pactada sin interrumpir tu flujo de trabajo, y nunca se perderá si refrescas la página.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowTimeboxSelectModal(false)}
                  className="px-3 py-2 rounded-lg bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => handleStartTimeboxTimer(timeboxTargetTaskId, timeboxDurationMinutes)}
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md flex items-center gap-1.5"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Iniciar Cronómetro ({timeboxDurationMinutes} min meta)</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: META DE TIEMPO CUMPLIDA (RECORDATORIO NO DESTRUCTIVO)              */}
      {/* ========================================================================= */}
      {showExpiredModal && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#0f1422] border-2 border-emerald-500/40 rounded-2xl p-5 space-y-4 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                  <Clock className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">¡Meta de Tiempo Alcanzada!</h3>
                  <p className="text-[11px] text-emerald-400/90 font-mono">
                    Tiempo en vivo: {formatSecondsCountdown(timerSeconds)}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowExpiredModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
                title="Cerrar aviso y continuar trabajando"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 block mb-0.5">Tarea:</span>
                <p className="text-xs font-semibold text-slate-200">
                  {sprintTasks.find(t => t.id === sprintTimer.taskId)?.titulo || 'Tarea en Sprint'}
                </p>
              </div>

              <p className="text-xs text-slate-300">
                Has alcanzado tu bloque sugerido. El cronómetro continúa activo registrando tu tiempo exacto. ¿Deseas detener y guardar ahora o seguir trabajando?
              </p>

              <div>
                <span className="text-[10px] uppercase font-mono text-slate-400 block mb-1.5">Extender meta sugerida:</span>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => handleExtendTimer(15)}
                    className="py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-emerald-400 font-bold text-xs border border-emerald-500/30 hover:border-emerald-500/60 transition-all flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <span>+15 min</span>
                  </button>
                  <button
                    onClick={() => handleExtendTimer(30)}
                    className="py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-emerald-400 font-bold text-xs border border-emerald-500/30 hover:border-emerald-500/60 transition-all flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <span>+30 min</span>
                  </button>
                  <button
                    onClick={() => handleExtendTimer(60)}
                    className="py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-emerald-400 font-bold text-xs border border-emerald-500/30 hover:border-emerald-500/60 transition-all flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <span>+60 min</span>
                  </button>
                </div>
              </div>

              {/* Botón de Finalización */}
              <button
                type="button"
                onClick={() => handleCommitTimer(sprintTimer.taskId)}
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Detener & Asentar Tiempo ({Number((calculateElapsedSprintSeconds(sprintTimer) / 3600).toFixed(2))} hrs)</span>
              </button>

              <button
                type="button"
                onClick={() => setShowExpiredModal(false)}
                className="w-full py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 font-semibold text-xs transition-colors border border-slate-800 cursor-pointer"
              >
                Continuar Trabajando en Código
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
