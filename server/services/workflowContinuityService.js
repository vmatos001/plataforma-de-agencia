/**
 * server/services/workflowContinuityService.js
 * Orquestador de Continuidad Automática del Workflow (Fase 1 a Fase 7) y Alimentación en Tiempo Real del Portal del Cliente.
 *
 * Conecta automáticamente:
 * - Fase 1 (Prospección & Auditoría: storage.js)
 * - Fase 2 (CRM & WhatsApp: crmStorage.js)
 * - Fase 3 (Presupuestos, Contratos SOW & Onboarding: presupuestosStorage.js, proyectosStorage.js)
 * - Fase 4 (Wireframes StoryBrand, PRD & Sprint Kanban: wireframesStorage.js)
 * - Fase 5 (Motor SEO, Schema JSON-LD & Launch QA 15 puntos: seoStorage.js)
 * - Fase 6 (Headless CMS Hub & Plan Care: headlessCmsStorage.js)
 * - Fase 7 (Gestión, Rentabilidad, Facturación & Pagos: finanzasStorage.js)
 */

import { getLeads } from './storage.js';
import { getCrmLeads, saveCrmLeads } from './crmStorage.js';
import { getPresupuestos, savePresupuestos } from './presupuestosStorage.js';
import { getProyectos, saveProyectos, crearProyectoDesdePresupuesto } from './proyectosStorage.js';
import { getWireframeByProyectoId, generarStoryBrandAuto } from './wireframesStorage.js';
import { getSeoAuditByProyectoId, generarSeoAuto } from './seoStorage.js';
import { getCmsSites, createCmsSite } from './headlessCmsStorage.js';
import { getFinanzas, crearFactura, actualizarFactura } from './finanzasStorage.js';

function normalizeStr(val) {
  return (val || '').toString().toLowerCase().trim();
}

function normalizePhone(val) {
  return (val || '').toString().replace(/\D/g, '');
}

/**
 * Fase 1 -> Fase 2: Sincroniza automáticamente un prospecto de Fase 1 (Scraper/Auditoría) hacia Fase 2 (CRM)
 */
export function syncScrapperLeadToCrm(scrapperLead) {
  if (!scrapperLead) return null;
  const crmLeads = getCrmLeads();

  const targetDomain = normalizeStr(scrapperLead.dominio);
  const targetName = normalizeStr(scrapperLead.nombreEmpresa || scrapperLead.dominio);
  const targetPhone = normalizePhone(scrapperLead.telefono);

  const existingIdx = crmLeads.findIndex(cl =>
    (scrapperLead.id && (cl.leadId === scrapperLead.id || cl.id === `crm-${scrapperLead.id}`)) ||
    (targetDomain && normalizeStr(cl.dominio) === targetDomain) ||
    (targetName && normalizeStr(cl.empresa) === targetName) ||
    (targetPhone && targetPhone.length >= 7 && normalizePhone(cl.telefono) === targetPhone)
  );

  const today = new Date().toISOString().split('T')[0];

  if (existingIdx !== -1) {
    const existing = crmLeads[existingIdx];
    crmLeads[existingIdx] = {
      ...existing,
      leadId: existing.leadId || scrapperLead.id || null,
      empresa: existing.empresa || scrapperLead.nombreEmpresa || scrapperLead.dominio,
      contacto: existing.contacto || scrapperLead.responsable || 'Dirección Comercial',
      cargo: existing.cargo || scrapperLead.cargo || 'Propietario / Gerente',
      email: existing.email || (scrapperLead.email && !scrapperLead.email.endsWith('.negocio') ? scrapperLead.email : ''),
      telefono: existing.telefono || scrapperLead.telefono || '',
      pais: scrapperLead.pais || existing.pais || 'SV',
      dominio: existing.dominio || scrapperLead.dominio || '',
      auditoriaResumen: scrapperLead.auditoria || existing.auditoriaResumen || null,
      actualizadoEn: today
    };
    saveCrmLeads(crmLeads);
    return crmLeads[existingIdx];
  }

  const portalToken = `portal-${scrapperLead.id || Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  const newCrmLead = {
    id: `crm-${scrapperLead.id || Date.now()}`,
    leadId: scrapperLead.id || null,
    empresa: scrapperLead.nombreEmpresa || scrapperLead.dominio || 'Empresa Prospectada',
    contacto: scrapperLead.responsable || 'Dirección General',
    cargo: scrapperLead.cargo || 'Propietario / Gerente',
    email: scrapperLead.email && !scrapperLead.email.endsWith('.negocio') ? scrapperLead.email : '',
    telefono: scrapperLead.telefono || '',
    pais: scrapperLead.pais || 'SV',
    dominio: scrapperLead.sinWeb ? '' : (scrapperLead.dominio || ''),
    sinWeb: Boolean(scrapperLead.sinWeb),
    resenas: scrapperLead.resenas || 0,
    calificacion: scrapperLead.calificacion || 4.8,
    etapa: scrapperLead.estado === 'cliente' ? 'ganado' : 'nuevo',
    valorEstimado: 1500,
    probabilidad: 25,
    fuente: `Fase 1 Prospector (${scrapperLead.sinWeb ? 'Google Maps' : 'SERP Web'})`,
    portalToken,
    auditoriaResumen: scrapperLead.auditoria || null,
    interacciones: [
      {
        id: 'int-auto-' + Date.now(),
        tipo: 'nota',
        fecha: today,
        titulo: 'Sincronización Automática Fase 1 → Fase 2',
        detalle: `Prospecto captado y auditado en Fase 1 (${scrapperLead.auditoria?.puntos?.length || 0} hallazgos detectados).`,
        proximoPaso: 'Contacto consultivo por WhatsApp / Envío de Propuesta',
        fechaProximoPaso: ''
      }
    ],
    portalConfig: {
      portalActivo: true,
      faseActual: 1,
      progresoPorcentaje: 15,
      archivosSubidos: [],
      presupuestoId: null,
      proyectoId: null
    },
    whatsappData: {
      telefono: scrapperLead.telefono || '',
      temperatura: 'caliente',
      estadoSeguimiento: 'primer_contacto',
      ultimoMensajeFecha: today,
      mensajes: []
    },
    creadoEn: today,
    actualizadoEn: today
  };

  crmLeads.unshift(newCrmLead);
  saveCrmLeads(crmLeads);
  return newCrmLead;
}

/**
 * Fase 3 (Presupuesto) -> Fase 2 (CRM) -> Fase 3..7 (Si está aceptado)
 */
export function syncPresupuestoToWorkflow(presupuesto) {
  if (!presupuesto) return null;

  const crmLeads = getCrmLeads();
  const targetEmpresa = normalizeStr(presupuesto.cliente?.empresa || presupuesto.empresa);
  const targetPhone = normalizePhone(presupuesto.cliente?.telefono || presupuesto.telefono);
  const monto = Number(presupuesto.inversion?.precioTotal) ||
    (presupuesto.modulos?.reduce((acc, m) => acc + (Number(m.precio) || 0), 0)) || 0;

  let crmLead = crmLeads.find(cl =>
    (presupuesto.leadId && (cl.id === presupuesto.leadId || cl.leadId === presupuesto.leadId)) ||
    (presupuesto.portalToken && cl.portalToken === presupuesto.portalToken) ||
    (cl.presupuestoId && cl.presupuestoId === presupuesto.id) ||
    (targetEmpresa && normalizeStr(cl.empresa) === targetEmpresa) ||
    (targetPhone && targetPhone.length >= 7 && normalizePhone(cl.telefono) === targetPhone)
  );

  const today = new Date().toISOString().split('T')[0];

  if (!crmLead) {
    const portalToken = presupuesto.portalToken || `portal-${presupuesto.id || Date.now()}`;
    crmLead = {
      id: presupuesto.leadId || `crm-${Date.now()}`,
      leadId: presupuesto.leadId || null,
      empresa: presupuesto.cliente?.empresa || 'Cliente Corporativo',
      contacto: presupuesto.cliente?.nombre || 'Representante Legal',
      cargo: 'Dirección',
      email: presupuesto.cliente?.email || '',
      telefono: presupuesto.cliente?.telefono || '',
      pais: presupuesto.pais || 'SV',
      dominio: '',
      etapa: presupuesto.estado === 'aceptado' ? 'ganado' : 'propuesta_enviada',
      valorEstimado: monto,
      probabilidad: presupuesto.estado === 'aceptado' ? 100 : 65,
      fuente: 'Propuesta Comercial Fase 3',
      portalToken,
      presupuestoId: presupuesto.id,
      presupuestoCodigo: presupuesto.codigo,
      presupuestoMonto: monto,
      presupuestoEstado: presupuesto.estado || 'enviado',
      interacciones: [
        {
          id: 'int-prop-' + Date.now(),
          tipo: 'nota',
          fecha: today,
          titulo: `Propuesta ${presupuesto.codigo || ''} Vinculada`,
          detalle: `Propuesta comercial por $${monto} USD sincronizada con el Portal del Cliente.`,
          proximoPaso: 'Aprobación en Portal de Cliente y Firma SOW',
          fechaProximoPaso: ''
        }
      ],
      portalConfig: {
        portalActivo: true,
        faseActual: presupuesto.estado === 'aceptado' ? 2 : 1,
        progresoPorcentaje: presupuesto.estado === 'aceptado' ? 40 : 25,
        fase1Aprobada: presupuesto.estado === 'aceptado',
        archivosSubidos: [],
        presupuestoId: presupuesto.id,
        proyectoId: null
      },
      whatsappData: {
        telefono: presupuesto.cliente?.telefono || '',
        temperatura: 'caliente',
        estadoSeguimiento: 'propuesta_enviada',
        ultimoMensajeFecha: today,
        mensajes: []
      },
      creadoEn: today,
      actualizadoEn: today
    };
    crmLeads.unshift(crmLead);
  } else {
    crmLead.presupuestoId = presupuesto.id;
    crmLead.presupuestoCodigo = presupuesto.codigo;
    crmLead.presupuestoMonto = monto;
    crmLead.valorEstimado = monto || crmLead.valorEstimado;
    crmLead.presupuestoEstado = presupuesto.estado || crmLead.presupuestoEstado;
    if (!crmLead.portalToken) {
      crmLead.portalToken = presupuesto.portalToken || `portal-${crmLead.id}`;
    }
    if (presupuesto.estado === 'aceptado') {
      crmLead.etapa = 'ganado';
      crmLead.probabilidad = 100;
    } else if (crmLead.etapa === 'nuevo' || crmLead.etapa === 'contactado') {
      crmLead.etapa = 'propuesta_enviada';
      crmLead.probabilidad = 65;
    }
    crmLead.portalConfig = {
      ...(crmLead.portalConfig || {}),
      portalActivo: true,
      presupuestoId: presupuesto.id,
      fase1Aprobada: presupuesto.estado === 'aceptado' || Boolean(crmLead.portalConfig?.fase1Aprobada)
    };
    crmLead.actualizadoEn = today;
  }

  saveCrmLeads(crmLeads);

  // Asegurar que el presupuesto tenga el portalToken y leadId enlazados
  const presupuestos = getPresupuestos();
  const pIdx = presupuestos.findIndex(p => p.id === presupuesto.id);
  if (pIdx !== -1) {
    presupuestos[pIdx].leadId = presupuestos[pIdx].leadId || crmLead.id;
    presupuestos[pIdx].portalToken = presupuestos[pIdx].portalToken || crmLead.portalToken;
    savePresupuestos(presupuestos);
  }

  // Si el presupuesto ya fue aceptado, encadenar automáticamente Fases 3 (Contrato) -> 4 -> 5 -> 6 -> 7
  let downstream = null;
  if (presupuesto.estado === 'aceptado') {
    downstream = ensureDownstreamProjectPipeline({ presupuesto, crmLead });
  }

  return { crmLead, downstream };
}

/**
 * Orquesta automáticamente las Fases 3 (Contrato/Proyecto) -> Fase 4 (Wireframes StoryBrand) ->
 * Fase 5 (SEO & Launch QA) -> Fase 6 (Headless CMS) -> Fase 7 (Facturación & Finanzas)
 */
export function ensureDownstreamProjectPipeline({ presupuesto = null, proyecto = null, crmLead = null } = {}) {
  const proyectos = getProyectos();
  const presupuestos = getPresupuestos();
  const crmLeads = getCrmLeads();

  let activeProj = proyecto;
  let activeProp = presupuesto;

  if (!activeProp && activeProj?.presupuestoId) {
    activeProp = presupuestos.find(p => p.id === activeProj.presupuestoId) || null;
  }

  const targetEmp = normalizeStr(
    activeProj?.cliente?.empresa ||
    activeProp?.cliente?.empresa ||
    crmLead?.empresa
  );

  if (!activeProj) {
    activeProj = proyectos.find(p =>
      (activeProp && p.presupuestoId === activeProp.id) ||
      (crmLead?.portalConfig?.proyectoId && p.id === crmLead.portalConfig.proyectoId) ||
      (targetEmp && normalizeStr(p.cliente?.empresa) === targetEmp)
    ) || null;
  }

  // 1. Fase 3: Si no existe el Proyecto/Contrato y hay Presupuesto (o Lead), crearlo automáticamente
  if (!activeProj && activeProp) {
    activeProj = crearProyectoDesdePresupuesto(activeProp);
  } else if (!activeProj && crmLead) {
    const syntheticProp = {
      id: crmLead.presupuestoId || `prop-auto-${crmLead.id}`,
      codigo: crmLead.presupuestoCodigo || 'P-2026-AUTO',
      pais: crmLead.pais || 'SV',
      moneda: 'USD',
      cliente: {
        nombre: crmLead.contacto || 'Representante Legal',
        empresa: crmLead.empresa || 'Empresa Cliente',
        telefono: crmLead.telefono || '',
        email: crmLead.email || '',
        actividad: crmLead.servicio || 'Servicios Digitales',
        ubicacion: crmLead.pais === 'DO' ? 'República Dominicana' : 'El Salvador'
      },
      inversion: {
        precioTotal: Number(crmLead.presupuestoMonto || crmLead.valorEstimado) || 1500
      },
      modulos: [
        {
          nombre: 'Desarrollo Plataforma Web Antigravity + SEO Local',
          precio: Number(crmLead.presupuestoMonto || crmLead.valorEstimado) || 1500
        }
      ]
    };
    activeProj = crearProyectoDesdePresupuesto(syntheticProp);
  }

  if (!activeProj) return null;

  // 2. Fase 4: Asegurar Wireframe StoryBrand & Arquitectura UX para el proyecto
  let wireframe = getWireframeByProyectoId(activeProj.id);
  if (!wireframe) {
    wireframe = generarStoryBrandAuto(activeProj);
  }

  // 3. Fase 5: Asegurar Auditoría SEO, Schema JSON-LD & Checklist 15 puntos Launch QA
  let seoAudit = getSeoAuditByProyectoId(activeProj.id);
  if (!seoAudit) {
    seoAudit = generarSeoAuto(activeProj);
  }

  // 4. Fase 6: Asegurar Sitio en Headless CMS Hub si el proyecto está firmado, en desarrollo o entregado
  const sites = getCmsSites();
  const projEmpresa = normalizeStr(activeProj.cliente?.empresa);
  let cmsSite = sites.find(s =>
    s.proyectoId === activeProj.id ||
    (projEmpresa && normalizeStr(s.nombre).includes(projEmpresa))
  ) || null;

  if (!cmsSite && ['firmado', 'en_desarrollo', 'entregado'].includes(activeProj.estado)) {
    cmsSite = createCmsSite({
      nombre: activeProj.onboarding?.datos?.nombreComercial || activeProj.cliente?.empresa || 'Sitio Oficial',
      pais: activeProj.pais || 'SV',
      telefono: activeProj.cliente?.telefono || '',
      dominio: activeProj.onboarding?.datos?.dominioDeseado || ''
    });
  }

  // 5. Fase 7: Asegurar Factura Oficial en Finanzas vinculada al Proyecto
  const finanzas = getFinanzas();
  let factura = finanzas.facturas.find(f =>
    f.proyectoId === activeProj.id ||
    (activeProj.codigo && f.codigoProyecto === activeProj.codigo) ||
    (projEmpresa && normalizeStr(f.cliente?.empresa) === projEmpresa)
  ) || null;

  const totalContrato = Number(activeProj.contrato?.totalInversion) || Number(activeProp?.inversion?.precioTotal) || 1500;
  const anticipoConfirmado = activeProj.pagos?.anticipoEstado === 'confirmado';
  const saldoConfirmado = activeProj.pagos?.saldoEstado === 'confirmado';
  const montoCobradoCalculado = saldoConfirmado
    ? totalContrato
    : anticipoConfirmado
      ? Number(activeProj.contrato?.anticipo || Math.round(totalContrato * 0.5))
      : 0;

  if (!factura) {
    factura = crearFactura({
      proyectoId: activeProj.id,
      codigoProyecto: activeProj.codigo,
      cliente: {
        empresa: activeProj.cliente?.empresa || 'Cliente',
        contacto: activeProj.cliente?.nombre || 'Representante',
        email: activeProj.cliente?.email || '',
        telefono: activeProj.cliente?.telefono || '',
        identificacion: activeProj.cliente?.identificacion || '',
        pais: activeProj.pais || 'SV'
      },
      concepto: activeProj.contrato?.alcanceResumen || `Desarrollo Web & Ecosistema Digital (${activeProj.codigo})`,
      subtotal: totalContrato,
      total: totalContrato,
      montoCobrado: montoCobradoCalculado,
      metodoPago: activeProj.pagos?.anticipoMetodo || 'Transferencia Bancaria',
      items: [
        {
          descripcion: activeProj.contrato?.alcanceResumen || 'Implementación Ecosistema Digital Antigravity',
          cantidad: 1,
          precioUnitario: totalContrato,
          total: totalContrato
        }
      ]
    });
  } else if (montoCobradoCalculado > (Number(factura.montoCobrado) || 0)) {
    factura = actualizarFactura(factura.id, {
      montoCobrado: montoCobradoCalculado
    });
  }

  // 6. Fase 2: Vincular proyectoId y presupuestoId de vuelta en el Lead del CRM
  const matchedLeadIdx = crmLeads.findIndex(cl =>
    (crmLead && cl.id === crmLead.id) ||
    (activeProp && (cl.presupuestoId === activeProp.id || cl.id === activeProp.leadId)) ||
    (projEmpresa && normalizeStr(cl.empresa) === projEmpresa)
  );

  if (matchedLeadIdx !== -1) {
    const cl = crmLeads[matchedLeadIdx];
    cl.proyectoId = activeProj.id;
    if (activeProp) cl.presupuestoId = activeProp.id;
    cl.portalConfig = {
      ...(cl.portalConfig || {}),
      portalActivo: true,
      presupuestoId: activeProp?.id || cl.portalConfig?.presupuestoId || null,
      proyectoId: activeProj.id,
      progresoPorcentaje: activeProj.seguimiento?.porcentajeAvance || cl.portalConfig?.progresoPorcentaje || 35
    };
    saveCrmLeads(crmLeads);
  }

  return {
    proyecto: activeProj,
    wireframe,
    seoAudit,
    cmsSite,
    factura
  };
}

/**
 * Resuelve cualquier identificador de portal (portalToken, leadId, presupuestoId, codigo, proyectoId)
 * y construye el estado unificado en tiempo real desde la base de datos de las 7 Fases.
 */
export function getUnifiedPortalPayload(rawToken) {
  const token = (rawToken || '').trim();
  const crmLeads = getCrmLeads();
  const presupuestos = getPresupuestos();
  const proyectos = getProyectos();
  const scrapperLeads = getLeads();
  const { facturas, timeEntries } = getFinanzas();

  // 1. Buscar en CRM Leads
  let lead = crmLeads.find(l =>
    l.portalToken === token ||
    l.id === token ||
    l.leadId === token ||
    l.presupuestoId === token ||
    l.proyectoId === token
  ) || null;

  // 2. Buscar en Presupuestos
  let presupuesto = presupuestos.find(p =>
    p.portalToken === token ||
    p.id === token ||
    p.codigo === token ||
    (lead && (p.id === lead.presupuestoId || p. id === lead.portalConfig?.presupuestoId || p.leadId === lead.id))
  ) || null;

  if (!presupuesto && lead) {
    const lEmp = normalizeStr(lead.empresa);
    presupuesto = presupuestos.find(p => lEmp && normalizeStr(p.cliente?.empresa) === lEmp) || null;
  }

  // Si encontramos presupuesto pero no lead, buscar o sincronizar lead en CRM
  if (presupuesto && !lead) {
    const pEmp = normalizeStr(presupuesto.cliente?.empresa);
    lead = crmLeads.find(l =>
      l.id === presupuesto.leadId ||
      (pEmp && normalizeStr(l.empresa) === pEmp)
    ) || null;

    if (!lead) {
      const synced = syncPresupuestoToWorkflow(presupuesto);
      lead = synced?.crmLead || null;
    }
  }

  // 3. Buscar en Proyectos / Contratos SOW
  let proyecto = proyectos.find(p =>
    p.id === token ||
    p.codigo === token ||
    (presupuesto && p.presupuestoId === presupuesto.id) ||
    (lead && (p.id === lead.proyectoId || p.id === lead.portalConfig?.proyectoId))
  ) || null;

  if (!proyecto && (lead || presupuesto)) {
    const targetEmp = normalizeStr(lead?.empresa || presupuesto?.cliente?.empresa);
    proyecto = proyectos.find(p => targetEmp && normalizeStr(p.cliente?.empresa) === targetEmp) || null;
  }

  // Si encontramos proyecto pero no lead, vincular o crear lead
  if (proyecto && !lead) {
    const projEmp = normalizeStr(proyecto.cliente?.empresa);
    lead = crmLeads.find(l => projEmp && normalizeStr(l.empresa) === projEmp) || null;
  }

  // Fallback para 'portal-demo' si existen registros en la base de datos
  if (!lead && !presupuesto && !proyecto && token === 'portal-demo' && crmLeads.length > 0) {
    lead = crmLeads[0];
    const lEmp = normalizeStr(lead.empresa);
    presupuesto = presupuestos.find(p => p.id === lead.presupuestoId || normalizeStr(p.cliente?.empresa) === lEmp) || presupuestos[0] || null;
    proyecto = proyectos.find(p => p.id === lead.proyectoId || normalizeStr(p.cliente?.empresa) === lEmp) || proyectos[0] || null;
  }

  if (!lead && !presupuesto && !proyecto) {
    return null;
  }

  // Si el presupuesto está aceptado o el portal ya pasó de fase 1 y aún no hay proyecto, generarlo en caliente
  if (!proyecto && (presupuesto?.estado === 'aceptado' || lead?.portalConfig?.fase1Aprobada || lead?.portalConfig?.fase2Firmada)) {
    const pipeline = ensureDownstreamProjectPipeline({ presupuesto, crmLead: lead });
    proyecto = pipeline?.proyecto || null;
  }

  // 4. Enriquecer con Fase 1 (Auditoría inicial si existe en leads.json)
  const targetDomain = normalizeStr(lead?.dominio);
  const targetEmp = normalizeStr(lead?.empresa || presupuesto?.cliente?.empresa || proyecto?.cliente?.empresa);
  const scrapperMatch = scrapperLeads.find(sl =>
    (lead?.leadId && sl.id === lead.leadId) ||
    (targetDomain && normalizeStr(sl.dominio) === targetDomain) ||
    (targetEmp && normalizeStr(sl.nombreEmpresa) === targetEmp)
  ) || null;

  // 5. Enriquecer con Fase 4 (Wireframes StoryBrand), Fase 5 (SEO & Launch QA), Fase 6 (Headless CMS) y Fase 7 (Finanzas)
  const wireframe = proyecto ? (getWireframeByProyectoId(proyecto.id) || generarStoryBrandAuto(proyecto)) : null;
  const seoAudit = proyecto ? (getSeoAuditByProyectoId(proyecto.id) || generarSeoAuto(proyecto)) : null;

  const cmsSites = getCmsSites();
  const cmsSite = cmsSites.find(s =>
    (proyecto && s.proyectoId === proyecto.id) ||
    (targetDomain && normalizeStr(s.dominio) === targetDomain) ||
    (targetEmp && normalizeStr(s.nombre).includes(targetEmp))
  ) || null;

  const clientFacturas = facturas.filter(f =>
    (proyecto && (f.proyectoId === proyecto.id || f.codigoProyecto === proyecto.codigo)) ||
    (targetEmp && normalizeStr(f.cliente?.empresa) === targetEmp)
  );

  const clientTimeEntries = proyecto
    ? timeEntries.filter(t => t.proyectoId === proyecto.id)
    : [];

  // 6. Reconciliar portalConfig en tiempo real con el estado verdadero de la base de datos (Fases 1 a 7)
  const rawConfig = lead?.portalConfig || {};
  const firmaRegistrada = Boolean(proyecto?.contrato?.firmaCliente?.firmado || rawConfig.fase2Firmada);
  const anticipoConfirmado = Boolean(
    proyecto?.pagos?.anticipoEstado === 'confirmado' ||
    proyecto?.pagos?.anticipoComprobante ||
    rawConfig.anticipoPagado
  );
  const onboardingCompleto = Boolean(
    proyecto?.onboarding?.completado ||
    rawConfig.fase3InsumosCompletos ||
    (rawConfig.archivosSubidos && rawConfig.archivosSubidos.length > 0)
  );
  const saldoConfirmado = Boolean(
    proyecto?.pagos?.saldoEstado === 'confirmado' ||
    rawConfig.fase4Liquidada ||
    rawConfig.liquidacionPagada ||
    proyecto?.estado === 'entregado'
  );
  const propAceptada = Boolean(
    presupuesto?.estado === 'aceptado' ||
    firmaRegistrada ||
    rawConfig.fase1Aprobada
  );

  let faseCalculada = Number(rawConfig.faseActual) || 1;
  if (saldoConfirmado) faseCalculada = Math.max(faseCalculada, 5);
  else if (onboardingCompleto) faseCalculada = Math.max(faseCalculada, 4);
  else if (firmaRegistrada) faseCalculada = Math.max(faseCalculada, 3);
  else if (propAceptada) faseCalculada = Math.max(faseCalculada, 2);

  const progresoReal = proyecto?.seguimiento?.porcentajeAvance ||
    rawConfig.progresoPorcentaje ||
    (saldoConfirmado ? 100 : onboardingCompleto ? 65 : firmaRegistrada ? 45 : propAceptada ? 30 : 15);

  const portalConfig = {
    ...rawConfig,
    portalActivo: true,
    presupuestoId: presupuesto?.id || rawConfig.presupuestoId || null,
    proyectoId: proyecto?.id || rawConfig.proyectoId || null,
    faseActual: faseCalculada,
    progresoPorcentaje: progresoReal,
    fase1Aprobada: propAceptada,
    fase2Firmada: firmaRegistrada,
    anticipoPagado: anticipoConfirmado,
    fase3InsumosCompletos: onboardingCompleto,
    fase4Liquidada: saldoConfirmado,
    firmaDigital: proyecto?.contrato?.firmaCliente?.firmaBase64 || rawConfig.firmaDigital || null,
    firmanteNombre: proyecto?.contrato?.firmaCliente?.nombreFirmante || rawConfig.firmanteNombre || null,
    firmanteDocumento: proyecto?.contrato?.firmaCliente?.identificacion || rawConfig.firmanteDocumento || null,
    fechaFirmaContrato: proyecto?.contrato?.firmaCliente?.timestampUtc || rawConfig.fechaFirmaContrato || null,
    seoScoreSalud: seoAudit?.scoreSalud || null,
    cmsSlug: cmsSite?.slug || null,
    cmsDominio: cmsSite?.dominio || null
  };

  return {
    lead: lead || {
      id: presupuesto?.leadId || proyecto?.id || token,
      empresa: presupuesto?.cliente?.empresa || proyecto?.cliente?.empresa || 'Cliente Corporativo',
      contacto: presupuesto?.cliente?.nombre || proyecto?.cliente?.nombre || 'Representante Legal',
      telefono: presupuesto?.cliente?.telefono || proyecto?.cliente?.telefono || '',
      email: presupuesto?.cliente?.email || proyecto?.cliente?.email || '',
      pais: presupuesto?.pais || proyecto?.pais || 'SV',
      presupuestoMonto: Number(presupuesto?.inversion?.precioTotal || proyecto?.contrato?.totalInversion) || 0,
      presupuestoCodigo: presupuesto?.codigo || proyecto?.codigo || 'P-2026',
      portalToken: token,
      auditoriaResumen: scrapperMatch?.auditoria || null
    },
    presupuesto,
    proyecto,
    portalConfig,
    workflowData: {
      auditoriaFase1: scrapperMatch?.auditoria || lead?.auditoriaResumen || null,
      wireframeFase4: wireframe,
      seoFase5: seoAudit,
      cmsFase6: cmsSite,
      finanzasFase7: {
        facturas: clientFacturas,
        timeEntries: clientTimeEntries
      }
    }
  };
}

/**
 * Propaga cualquier actualización realizada por el cliente en el Portal hacia todas las bases de datos (Fases 2 a 7)
 */
export function applyPortalUpdateToWorkflow(token, updates = {}) {
  const current = getUnifiedPortalPayload(token);
  if (!current) return null;

  const presupuestos = getPresupuestos();
  const proyectos = getProyectos();
  const crmLeads = getCrmLeads();

  let { lead, presupuesto, proyecto } = current;
  const todayFormatted = new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
  const todayIso = new Date().toISOString().split('T')[0];

  // 1. Si el cliente aprueba la propuesta en Fase 1 del Portal -> Marcar presupuesto 'aceptado'
  if (updates.fase1Aprobada && presupuesto) {
    const pIdx = presupuestos.findIndex(p => p.id === presupuesto.id);
    if (pIdx !== -1) {
      presupuestos[pIdx].estado = 'aceptado';
      savePresupuestos(presupuestos);
      presupuesto = presupuestos[pIdx];
    }
  }

  // 2. Asegurar que exista el Proyecto/Contrato si ya aprobó Fase 1 o firmó Fase 2
  if (!proyecto && (updates.fase1Aprobada || updates.fase2Firmada)) {
    const pipeline = ensureDownstreamProjectPipeline({ presupuesto, crmLead: lead });
    proyecto = pipeline?.proyecto || null;
  }

  // 3. Actualizar el Proyecto en proyectos.json según las acciones del cliente en el Portal
  if (proyecto) {
    const allProjs = getProyectos();
    const projIdx = allProjs.findIndex(p => p.id === proyecto.id);
    if (projIdx !== -1) {
      const targetProj = allProjs[projIdx];

      // Firma del Contrato SOW
      if (updates.fase2Firmada) {
        targetProj.estado = targetProj.estado === 'contrato_pendiente' ? 'firmado' : targetProj.estado;
        targetProj.contrato = {
          ...(targetProj.contrato || {}),
          firmaCliente: {
            firmado: true,
            nombreFirmante: updates.firmanteNombre || targetProj.cliente?.nombre || 'Cliente Autorizado',
            identificacion: updates.firmanteDocumento || targetProj.cliente?.identificacion || 'Firma Digital Portal',
            timestampUtc: new Date().toISOString(),
            ipAddress: 'Portal Cliente Verificado',
            firmaBase64: updates.firmaDigital || targetProj.contrato?.firmaCliente?.firmaBase64 || null
          }
        };
        const h1 = targetProj.seguimiento?.hitos?.find(h => h.id === 'h-1');
        if (h1) {
          h1.completado = true;
          h1.fecha = todayFormatted;
        }
      }

      // Comprobante / Pago de Anticipo 50%
      if (updates.anticipoPagado || updates.comprobanteAnticipo) {
        targetProj.pagos = {
          ...(targetProj.pagos || {}),
          anticipoEstado: 'confirmado',
          anticipoFecha: todayIso,
          anticipoComprobante: updates.comprobanteAnticipo || targetProj.pagos?.anticipoComprobante || 'Confirmado en Portal'
        };
        const h2 = targetProj.seguimiento?.hitos?.find(h => h.id === 'h-2');
        if (h2) {
          h2.completado = true;
          h2.fecha = todayFormatted;
        }
      }

      // Entrega de Insumos / Onboarding
      if (updates.fase3InsumosCompletos || updates.onboardingRespuestas) {
        targetProj.onboarding = {
          ...(targetProj.onboarding || {}),
          completado: true,
          fecha: todayIso,
          datos: {
            ...(targetProj.onboarding?.datos || {}),
            ...(updates.onboardingRespuestas || {})
          }
        };
        if (targetProj.estado === 'firmado') {
          targetProj.estado = 'en_desarrollo';
        }
        const h3 = targetProj.seguimiento?.hitos?.find(h => h.id === 'h-3');
        if (h3) {
          h3.completado = true;
          h3.fecha = todayFormatted;
        }
      }

      // Liquidación Final 50%
      if (updates.fase4Liquidada || updates.liquidacionPagada) {
        targetProj.pagos = {
          ...(targetProj.pagos || {}),
          saldoEstado: 'confirmado',
          saldoFecha: todayIso,
          saldoComprobante: updates.comprobanteLiquidacion || 'Confirmado en Portal'
        };
        targetProj.estado = 'entregado';
        const h7 = targetProj.seguimiento?.hitos?.find(h => h.id === 'h-7');
        if (h7) {
          h7.completado = true;
          h7.fecha = todayFormatted;
        }
      }

      // Recalcular porcentaje de avance del proyecto según hitos completados
      if (targetProj.seguimiento?.hitos?.length) {
        const doneCount = targetProj.seguimiento.hitos.filter(h => h.completado).length;
        const calcPct = Math.round((doneCount / targetProj.seguimiento.hitos.length) * 100);
        targetProj.seguimiento.porcentajeAvance = Math.max(
          calcPct,
          Number(updates.progresoPorcentaje) || targetProj.seguimiento.porcentajeAvance || 0
        );
      }

      allProjs[projIdx] = targetProj;
      saveProyectos(allProjs);
      proyecto = targetProj;

      // Encadenar actualización hacia Fases 4, 5, 6 y 7 (Finanzas)
      ensureDownstreamProjectPipeline({ presupuesto, proyecto, crmLead: lead });
    }
  }

  // 4. Actualizar CRM Lead y su portalConfig
  const updatedLeads = getCrmLeads();
  const lIdx = updatedLeads.findIndex(l =>
    l.portalToken === token ||
    l.id === token ||
    (lead && l.id === lead.id)
  );

  if (lIdx !== -1) {
    updatedLeads[lIdx].portalConfig = {
      ...(updatedLeads[lIdx].portalConfig || {}),
      ...updates,
      presupuestoId: presupuesto?.id || updatedLeads[lIdx].portalConfig?.presupuestoId || null,
      proyectoId: proyecto?.id || updatedLeads[lIdx].portalConfig?.proyectoId || null,
      ultimaActualizacion: new Date().toISOString()
    };
    if (updates.fase1Aprobada || updates.fase2Firmada || updates.anticipoPagado) {
      updatedLeads[lIdx].etapa = 'ganado';
      updatedLeads[lIdx].probabilidad = 100;
    }
    updatedLeads[lIdx].actualizadoEn = todayIso;
    saveCrmLeads(updatedLeads);
  }

  return getUnifiedPortalPayload(token);
}
