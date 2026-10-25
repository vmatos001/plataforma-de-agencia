/**
 * Servicio Inteligente de Sincronización de Hitos de Proyecto por Eventos
 * Conecta los eventos del cliente (Firma, Anticipo, Onboarding) y de la agencia (12 Fases del Playbook Maestro en Kanban)
 * para calcular automáticamente el porcentaje de avance y actualizar la Hoja de Ruta del SOW.
 */

import { STORAGE_KEYS } from './localStore';
import { getStoredProyectos, saveStoredProyectos } from './contractGenerator';

export const PLAYBOOK_12_FASES_KEYS = [
  { id: 'fase-1', titulo: 'Infraestructura Base, GitHub Privado & Firebase Spark', hitoTarget: 'h-4', faseNum: 1 },
  { id: 'fase-2', titulo: 'Identidad Corporativa, Correo Oficial & DNS', hitoTarget: 'h-4', faseNum: 2 },
  { id: 'fase-3', titulo: 'Sistema de Diseño Dark Mode Luxury & Golden Badge', hitoTarget: 'h-4', faseNum: 3 },
  { id: 'fase-4', titulo: 'Landing Page de Alta Conversión con Cotizador en 4 Pasos', hitoTarget: 'h-4', faseNum: 4 },
  { id: 'fase-5', titulo: 'Arquitectura Multilingüe Nativa en Espejo (i18n)', hitoTarget: 'h-5', faseNum: 5 },
  { id: 'fase-6', titulo: 'Páginas Interiores Especializadas, B2B Fiscal & Rutas Legales', hitoTarget: 'h-5', faseNum: 6 },
  { id: 'fase-7', titulo: 'Micro-interacciones Cinemáticas con GSAP & ScrollTrigger', hitoTarget: 'h-5', faseNum: 7 },
  { id: 'fase-8', titulo: 'Testimonios Nativos Google Maps 5.0★', hitoTarget: 'h-5', faseNum: 8 },
  { id: 'fase-9', titulo: 'WPO Móvil Extrema (90+ en PageSpeed Mobile)', hitoTarget: 'h-6', faseNum: 9 },
  { id: 'fase-10', titulo: 'Optimización y Certificación Agéntica de IA', hitoTarget: 'h-6', faseNum: 10 },
  { id: 'fase-11', titulo: 'Blindaje Perimetral Anti-Spam Honeypot Universal', hitoTarget: 'h-6', faseNum: 11 },
  { id: 'fase-12', titulo: 'Vinculación con Google Maps, Dominio Oficial & Entrega Ejecutiva', hitoTarget: 'h-7', faseNum: 12 },
];

/**
 * Obtiene las tareas del Sprint de Desarrollo (Kanban Fase 4) desde localStorage
 */
export function getStoredSprintTasks(proyectoId = null) {
  if (typeof window === 'undefined') return [];
  try {
    if (proyectoId) {
      const byProjRaw = localStorage.getItem('goglite_sprint_tasks_by_project');
      if (byProjRaw) {
        const byProj = JSON.parse(byProjRaw);
        if (byProj && Array.isArray(byProj[proyectoId])) {
          return byProj[proyectoId];
        }
      }
    }
    const raw = localStorage.getItem('goglite_sprint_tasks');
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.warn('[MilestoneSync] Error leyendo tareas de sprint:', e);
    return [];
  }
}

/**
 * Evalúa los eventos del proyecto y el estado de las 12 fases del Playbook Maestro,
 * retornando el proyecto enriquecido con hitos actualizados y porcentaje recalculado.
 */
export function evaluateProjectMilestones(proyecto, customSprintTasks = null) {
  if (!proyecto) return proyecto;

  const sprintTasks = customSprintTasks || getStoredSprintTasks(proyecto.id);
  const tasksCompletadas = sprintTasks.filter(t => t.columna === 'completado');
  const countCompletadas12 = tasksCompletadas.length;

  // Detección de fases específicas completadas
  const isFaseCompletada = (faseId) => tasksCompletadas.some(t => t.id === faseId || (t.titulo && t.titulo.toLowerCase().includes(faseId)));
  const fase4Completada = isFaseCompletada('fase-4');
  const fase8Completada = isFaseCompletada('fase-8') || isFaseCompletada('fase-7');
  const fase11Completada = isFaseCompletada('fase-9') || isFaseCompletada('fase-10') || isFaseCompletada('fase-11');
  const fase12Completada = isFaseCompletada('fase-12');

  // --- Detección de Eventos del Cliente ---
  const eventoFirma = Boolean(
    proyecto.contrato?.firmaCliente?.firmado ||
    proyecto.contrato?.firmaCliente?.firmaBase64 ||
    proyecto.portalConfig?.fase2Firmada ||
    ['firmado', 'en_desarrollo', 'entregado'].includes(proyecto.estado)
  );

  const eventoAnticipo = Boolean(
    proyecto.pagos?.anticipoEstado === 'confirmado' ||
    proyecto.pagos?.anticipoComprobante ||
    proyecto.pagos?.comprobanteUrl ||
    proyecto.portalConfig?.anticipoPagado ||
    proyecto.portalConfig?.comprobanteAnticipo
  );

  const eventoOnboarding = Boolean(
    proyecto.onboarding?.insumosValidados100 ||
    proyecto.onboarding?.completado ||
    proyecto.portalConfig?.fase3InsumosCompletos
  );

  // --- Detección de Eventos de la Agencia (12 Fases) ---
  const eventoWireframes = Boolean(
    fase4Completada ||
    countCompletadas12 >= 3 ||
    proyecto.wireframesAprobados
  );

  const eventoFrontend = Boolean(
    fase8Completada ||
    countCompletadas12 >= 6 ||
    proyecto.frontendCompletado
  );

  const eventoQA = Boolean(
    fase11Completada ||
    countCompletadas12 >= 9 ||
    proyecto.qaAprobado
  );

  const eventoLiquidacionEntrega = Boolean(
    proyecto.pagos?.saldoEstado === 'confirmado' ||
    proyecto.portalConfig?.fase4Liquidada ||
    proyecto.portalConfig?.liquidacionPagada ||
    fase12Completada ||
    proyecto.estado === 'entregado'
  );

  const nowFormatted = new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });

  // Lista base de hitos (asegurando los 7 oficiales)
  const currentHitos = (proyecto.seguimiento?.hitos && proyecto.seguimiento.hitos.length > 0)
    ? proyecto.seguimiento.hitos
    : [
        { id: 'h-1', titulo: 'Firma del Contrato Legal & Aprobación de Términos', fase: 1, completado: false, fecha: 'Pendiente' },
        { id: 'h-2', titulo: 'Confirmación de Anticipo del 50%', fase: 1, completado: false, fecha: 'Pendiente' },
        { id: 'h-3', titulo: 'Recepción de Activos & Cuestionario de Onboarding', fase: 1, completado: false, fecha: 'Pendiente' },
        { id: 'h-4', titulo: 'Wireframes UX & Estructura de Mensajes StoryBrand', fase: 2, completado: false, fecha: 'Pendiente' },
        { id: 'h-5', titulo: 'Desarrollo Frontend Mobile-First & Integraciones', fase: 2, completado: false, fecha: 'Pendiente' },
        { id: 'h-6', titulo: 'Auditoría Launch QA & Core Web Vitals en Verde', fase: 3, completado: false, fecha: 'Pendiente' },
        { id: 'h-7', titulo: 'Liquidación Final & Entrega de Credenciales Oficiales', fase: 3, completado: false, fecha: 'Pendiente' }
      ];

  // Actualizar cada hito considerando Evento vs Manual
  const updatedHitos = currentHitos.map(h => {
    let autoCompleted = false;
    let eventReason = '';

    switch (h.id) {
      case 'h-1':
        autoCompleted = eventoFirma;
        eventReason = 'Firma digital registrada';
        break;
      case 'h-2':
        autoCompleted = eventoAnticipo;
        eventReason = 'Anticipo 50% confirmado';
        break;
      case 'h-3':
        autoCompleted = eventoOnboarding;
        eventReason = 'Onboarding & activos recibidos';
        break;
      case 'h-4':
        autoCompleted = eventoWireframes;
        eventReason = 'Wireframes & UX StoryBrand completados';
        break;
      case 'h-5':
        autoCompleted = eventoFrontend;
        eventReason = 'Frontend Mobile-First completado';
        break;
      case 'h-6':
        autoCompleted = eventoQA;
        eventReason = 'Auditoría Launch QA & Core Web Vitals';
        break;
      case 'h-7':
        autoCompleted = eventoLiquidacionEntrega;
        eventReason = 'Fase 12 & Liquidación final completada';
        break;
      default:
        break;
    }

    const isCompletado = h.completado || autoCompleted;
    const origen = autoCompleted ? 'auto' : (h.completado ? 'manual' : null);
    const fecha = isCompletado
      ? (h.fecha && h.fecha !== 'Pendiente' ? h.fecha : nowFormatted)
      : 'Pendiente';

    return {
      ...h,
      completado: isCompletado,
      fecha,
      origen,
      eventReason: autoCompleted ? eventReason : (h.eventReason || null)
    };
  });

  // --- Cálculo Ponderado de Porcentaje (Total 100%) ---
  // 1. Cliente: Firma (15%) + Anticipo 50% (15%) + Onboarding (10%) = 40%
  const pctCliente = (eventoFirma ? 15 : 0) + (eventoAnticipo ? 15 : 0) + (eventoOnboarding ? 10 : 0);

  // 2. Agencia: 12 Fases de Desarrollo del Playbook Maestro = 45% (3.75% por fase)
  const pctSprintFases = Math.round((Math.min(countCompletadas12, 12) / 12) * 45);

  // 3. Cierre: Liquidación Final & Entrega Ejecutiva (Fase 12) = 15%
  const pctCierre = eventoLiquidacionEntrega ? 15 : 0;

  // Porcentaje basado en eventos y tareas del sprint
  const pctPorEventos = Math.min(100, pctCliente + pctSprintFases + pctCierre);

  // Porcentaje fallback basado en checkboxes completados
  const hitosCompletadosCount = updatedHitos.filter(h => h.completado).length;
  const pctPorHitos = Math.round((hitosCompletadosCount / updatedHitos.length) * 100);

  // Tomamos el mayor de ambos para garantizar coherencia
  const porcentajeAvance = Math.min(100, Math.max(pctPorEventos, pctPorHitos));

  // Determinación de la fase actual (1, 2 o 3)
  let faseActual = 1;
  if (porcentajeAvance >= 85) faseActual = 3;
  else if (porcentajeAvance >= 40) faseActual = 2;

  // Actualizar estado general del proyecto si procede
  let nuevoEstado = proyecto.estado;
  if (porcentajeAvance >= 100) nuevoEstado = 'entregado';
  else if (porcentajeAvance >= 30 && nuevoEstado !== 'en_desarrollo' && nuevoEstado !== 'entregado') {
    nuevoEstado = 'en_desarrollo';
  }

  return {
    ...proyecto,
    estado: nuevoEstado,
    seguimiento: {
      ...(proyecto.seguimiento || {}),
      porcentajeAvance,
      faseActual,
      hitos: updatedHitos,
      sprintMeta: {
        totalFasesPlaybook: 12,
        fasesCompletadasCount: countCompletadas12,
        pctSprintFases,
        ultimaSincronizacion: new Date().toISOString()
      }
    }
  };
}

/**
 * Sincroniza todos los proyectos guardados en localStorage con los eventos vigentes
 */
export function syncAllProyectosWithEvents(customSprintTasks = null, targetProyectoId = null) {
  if (typeof window === 'undefined') return [];
  try {
    const list = getStoredProyectos();
    if (!Array.isArray(list) || list.length === 0) return [];

    const updated = list.map(p => {
      if (targetProyectoId && p.id === targetProyectoId && customSprintTasks) {
        return evaluateProjectMilestones(p, customSprintTasks);
      }
      const projTasks = getStoredSprintTasks(p.id);
      return evaluateProjectMilestones(p, projTasks.length > 0 ? projTasks : (!targetProyectoId ? customSprintTasks : null));
    });

    saveStoredProyectos(updated);

    // Notificar al bus de eventos de la aplicación
    window.dispatchEvent(new CustomEvent('goglite_proyectos_synced', {
      detail: { proyectos: updated, timestamp: Date.now() }
    }));

    return updated;
  } catch (e) {
    console.warn('[MilestoneSync] Error sincronizando todos los proyectos:', e);
    return [];
  }
}
