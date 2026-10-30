/**
 * Generador y sincronizador de Contratos SOW y Proyectos para Goglite Agency Suite
 * Garantiza persistencia Local-First (localStorage) y compatibilidad con Firebase Hosting y Backend API.
 */

import { isExcludedTestRecord } from './firestoreSyncService';

export const STORAGE_KEY_PROYECTOS = 'goglite_proyectos';
export const STORAGE_KEY_PRESUPUESTOS = 'goglite_presupuestos';

export function getStoredProyectos() {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PROYECTOS);
    if (!raw) return [];
    let list = JSON.parse(raw);
    if (!Array.isArray(list)) return [];

    let modified = false;
    const beforeCount = list.length;
    list = list.filter(proj => !isExcludedTestRecord(
      proj?.cliente?.empresa || proj?.cliente?.nombre,
      proj?.id,
      proj?.codigo,
      proj?.presupuestoId,
      proj?.presupuestoCodigo,
      proj?._firestoreDocId
    ));
    if (list.length !== beforeCount) {
      modified = true;
    }
    list = list.map(proj => {
      if (!proj?.contrato) return proj;
      let projChanged = false;

      // Limpiar precios entre paréntesis en las cláusulas existentes
      const cleanClausulas = (proj.contrato.clausulas || []).map(c => {
        if (!c.texto) return c;
        const cleaned = c.texto
          .replace(/\s*\(\$\s*[\d,]+(?:\.\d+)?\s*USD\)/gi, '')
          .replace(/\s*\(\$\s*[\d,]+(?:\.\d+)?\)/gi, '');
        if (cleaned !== c.texto) {
          projChanged = true;
          return { ...c, texto: cleaned };
        }
        return c;
      });

      // Limpiar precios entre paréntesis en los títulos de módulos
      const cleanModulos = (proj.contrato.modulos || []).map(m => {
        if (!m.titulo) return m;
        const cleaned = m.titulo
          .replace(/\s*\(\$\s*[\d,]+(?:\.\d+)?\s*USD\)/gi, '')
          .replace(/\s*\(\$\s*[\d,]+(?:\.\d+)?\)/gi, '')
          .trim();
        if (cleaned !== m.titulo) {
          projChanged = true;
          return { ...m, titulo: cleaned };
        }
        return m;
      });

      if (projChanged) {
        modified = true;
        return {
          ...proj,
          contrato: {
            ...proj.contrato,
            clausulas: cleanClausulas,
            modulos: cleanModulos
          }
        };
      }
      return proj;
    });

    if (modified) {
      saveStoredProyectos(list);
    }

    return list;
  } catch (e) {
    console.warn('[ContractGenerator] Error leyendo proyectos locales:', e);
    return [];
  }
}

export function saveStoredProyectos(list) {
  if (typeof window === 'undefined') return false;
  try {
    localStorage.setItem(STORAGE_KEY_PROYECTOS, JSON.stringify(list));
    return true;
  } catch (e) {
    console.warn('[ContractGenerator] Error guardando proyectos locales:', e);
    return false;
  }
}

/**
 * Construye un objeto Proyecto & Contrato formal completo a partir de un presupuesto
 */
export function buildProyectoFromPresupuesto(presupuesto, existingList = []) {
  if (!presupuesto) return null;

  const nextNum = (existingList && existingList.length) ? existingList.length + 1 : 1;
  const codigo = `CON-2026-${String(nextNum).padStart(3, '0')}`;

  const total = Number(presupuesto.inversion?.precioTotal) || 
                presupuesto.modulos?.reduce((acc, m) => acc + (Number(m.precio) || 0), 0) || 300;
  const anticipo = Number(presupuesto.inversion?.anticipo) || Math.round(total * 0.5);
  const saldo = Number(presupuesto.inversion?.contraEntrega) || (total - anticipo);

  const clientName = presupuesto.cliente?.nombre || 'Representante Legal';
  const clientEmpresa = presupuesto.cliente?.empresa || 'Empresa Cliente';
  const clientTelefono = presupuesto.cliente?.telefono || '';
  const clientEmail = presupuesto.cliente?.email || '';
  const clientPais = presupuesto.pais || 'SV';
  const clientUbicacion = presupuesto.cliente?.ubicacion || (clientPais === 'DO' ? 'Santo Domingo, República Dominicana' : 'San Salvador, El Salvador');

  const cleanModuleTitle = (t) => (t || '')
    .replace(/\s*\(\$\s*[\d,]+(?:\.\d+)?\s*USD\)/gi, '')
    .replace(/\s*\(\$\s*[\d,]+(?:\.\d+)?\)/gi, '')
    .trim();

  const modulosList = (presupuesto.modulos && presupuesto.modulos.length > 0)
    ? presupuesto.modulos.map(m => ({ ...m, titulo: cleanModuleTitle(m.titulo) }))
    : [
        { id: 'm-1', numero: 'MÓDULO 1', titulo: 'Plataforma Web de Alta Conversión Mobile-First' },
        { id: 'm-2', numero: 'MÓDULO 2', titulo: 'Optimización de Motores de Búsqueda & Google Maps' },
        { id: 'm-3', numero: 'MÓDULO 3', titulo: 'Ecosistema de Captación WhatsApp & Códigos QR' }
      ];

  const modulosResumenTexto = modulosList.map(m => `• ${m.numero || 'Módulo'}: ${cleanModuleTitle(m.titulo)}`).join('\n');

  return {
    id: 'proj-' + (presupuesto.id || Date.now()),
    codigo,
    presupuestoId: presupuesto.id || null,
    presupuestoCodigo: presupuesto.codigo || 'P-2026',
    portalToken: presupuesto.portalToken || `portal-${presupuesto.id || Date.now()}`,
    leadId: presupuesto.leadId || null,
    fechaCreacion: new Date().toISOString().split('T')[0],
    estado: 'contrato_pendiente',
    pais: clientPais,
    cliente: {
      nombre: clientName,
      empresa: clientEmpresa,
      telefono: clientTelefono,
      email: clientEmail,
      identificacion: '',
      actividad: presupuesto.cliente?.actividad || 'Servicios Comerciales',
      ubicacion: clientUbicacion
    },
    contrato: {
      titulo: 'CONTRATO OFICIAL DE PRESTACIÓN DE SERVICIOS DIGITALES Y DESARROLLO WEB',
      fechaEmision: new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' }),
      plazoEjecucionDias: 15,
      totalInversion: total,
      anticipo,
      saldo,
      moneda: presupuesto.moneda || 'USD',
      alcanceResumen: presupuesto.portada?.proyecto || presupuesto.titulo || 'Desarrollo de plataforma digital de alta conversión con arquitectura limpia sin WordPress.',
      modulos: modulosList,
      clausulas: [
        {
          numero: 'PRIMERA',
          titulo: 'OBJETO Y ALCANCE DEL SERVICIO',
          texto: `GOGLITE DIGITAL se compromete formalmente al diseño, desarrollo, configuración y despliegue del sistema web corporativo para EL CLIENTE (${clientEmpresa}), ejecutando los módulos acordados en la propuesta ${presupuesto.codigo || 'P-2026'}:\n${modulosResumenTexto}`
        },
        {
          numero: 'SEGUNDA',
          titulo: 'INFRAESTRUCTURA TÉCNICA Y RENDIMIENTO',
          texto: 'El desarrollo se ejecutará bajo arquitectura limpia nativa (HTML5 semántico, Tailwind CSS y JavaScript modular), excluyendo el uso de plantillas lentas de WordPress. Se garantiza una velocidad de carga móvil optimizada (Core Web Vitals en verde y tiempos inferiores a 1.2 segundos).'
        },
        {
          numero: 'TERCERA',
          titulo: 'PLAZOS DE IMPLEMENTACIÓN (10 A 15 DÍAS HÁBILES)',
          texto: 'El plazo oficial de ejecución técnica es de diez a quince (10 a 15) días hábiles. Dicho plazo comenzará a computarse formalmente a partir de la firma del presente contrato, la acreditación del 50% de anticipo y la entrega de los insumos esenciales del cliente (logotipos, fotografías y accesos de marca).'
        },
        {
          numero: 'CUARTA',
          titulo: 'HONORARIOS Y CONDICIONES DE PAGO',
          texto: `El valor total del acuerdo comercial es de $${total.toLocaleString()} USD. La forma de pago se estructura en dos fases: un cincuenta por ciento (50% = $${anticipo.toLocaleString()} USD) en concepto de anticipo inicial para dar inicio a los trabajos, y el cincuenta por ciento restante ($${saldo.toLocaleString()} USD) contra entrega final y despliegue en staging, previo a la liberación de credenciales maestras y dominio oficial.`
        },
        {
          numero: 'QUINTA',
          titulo: 'PROPIEDAD INTELECTUAL Y LIBERACIÓN TOTAL',
          texto: 'Una vez completada la liquidación final del 100%, EL CLIENTE será propietario exclusivo e irrestricto del código fuente, diseños, bases de datos y activos generados, sin contratos de permanencia forzosa ni comisiones mensuales obligatorias.'
        },
        {
          numero: 'SEXTA',
          titulo: 'CONFIDENCIALIDAD Y SEGURIDAD',
          texto: 'Ambas partes se obligan a mantener bajo estricta confidencialidad toda la información técnica, comercial, accesos a servidores y datos de clientes compartidos durante la ejecución de este contrato.'
        },
        {
          numero: 'SÉPTIMA',
          titulo: 'GARANTÍA Y ACOMPAÑAMIENTO POST-LANZAMIENTO',
          texto: `GOGLITE DIGITAL otorga treinta (30) días calendario de garantía post-lanzamiento para corregir fallos técnicos o incidencias sin costo adicional. Beneficio exclusivo: ${presupuesto.inversion?.beneficioExclusivo || '1 mes de soporte técnico y supervisión técnica gratuita tras el lanzamiento oficial.'}`
        }
      ],
      firmaCliente: {
        firmado: false,
        nombreFirmante: '',
        identificacion: '',
        timestampUtc: null,
        ipAddress: null,
        userAgent: null,
        firmaBase64: null
      },
      firmaAgencia: {
        firmado: true,
        nombreFirmante: 'Víctor Matos',
        cargo: 'Director General · Goglite Digital',
        timestampUtc: new Date().toISOString()
      }
    },
    onboarding: {
      completado: false,
      fecha: null,
      datos: {
        nombreComercial: clientEmpresa,
        slogan: '',
        colorPrimario: '#FF6B00',
        colorSecundario: '#0B0E16',
        colorAcento: '#22C55E',
        tipografia: 'Inter / Montserrat',
        telefonoEmergencia: clientTelefono,
        whatsappVentas: clientTelefono,
        enlaceDriveArchivos: '',
        proveedorDominio: '',
        observaciones: ''
      }
    },
    pagos: {
      anticipoMonto: anticipo,
      anticipoEstado: 'pendiente',
      anticipoFecha: null,
      anticipoMetodo: '',
      comprobanteUrl: '',
      saldoMonto: saldo,
      saldoEstado: 'pendiente'
    },
    seguimiento: {
      faseActual: 1,
      porcentajeAvance: 20,
      hitos: [
        { id: 'h-1', titulo: 'Firma del Contrato Legal & Aprobación de Términos', fase: 1, completado: false, fecha: 'Pendiente' },
        { id: 'h-2', titulo: 'Confirmación de Anticipo del 50%', fase: 1, completado: false, fecha: 'Pendiente' },
        { id: 'h-3', titulo: 'Recepción de Activos & Cuestionario de Onboarding', fase: 1, completado: false, fecha: 'Pendiente' },
        { id: 'h-4', titulo: 'Wireframes UX & Estructura de Mensajes StoryBrand', fase: 2, completado: false, fecha: 'Pendiente' },
        { id: 'h-5', titulo: 'Desarrollo Frontend Mobile-First & Integraciones', fase: 2, completado: false, fecha: 'Pendiente' },
        { id: 'h-6', titulo: 'Auditoría Launch QA & Core Web Vitals en Verde', fase: 3, completado: false, fecha: 'Pendiente' },
        { id: 'h-7', titulo: 'Liquidación Final & Entrega de Credenciales Oficiales', fase: 3, completado: false, fecha: 'Pendiente' }
      ]
    }
  };
}

/**
 * Reconcilia un proyecto existente con los valores vigentes de una propuesta.
 * Garantiza sincronización total de importes, cláusulas y módulos sin romper firmas previas.
 */
export function reconcileProyectoWithPresupuesto(proyecto, presupuesto) {
  if (!proyecto) return buildProyectoFromPresupuesto(presupuesto);
  if (!presupuesto) return proyecto;

  const total = Number(presupuesto.inversion?.precioTotal) || 
                presupuesto.modulos?.reduce((acc, m) => acc + (Number(m.precio) || 0), 0) || 
                Number(proyecto.contrato?.totalInversion) || 300;
  const anticipo = Number(presupuesto.inversion?.anticipo) || Math.round(total * 0.5);
  const saldo = Number(presupuesto.inversion?.contraEntrega) || (total - anticipo);

  const cleanModuleTitle = (t) => (t || '')
    .replace(/\s*\(\$\s*[\d,]+(?:\.\d+)?\s*USD\)/gi, '')
    .replace(/\s*\(\$\s*[\d,]+(?:\.\d+)?\)/gi, '')
    .trim();

  const modulosList = (presupuesto.modulos && presupuesto.modulos.length > 0)
    ? presupuesto.modulos.map(m => ({ ...m, titulo: cleanModuleTitle(m.titulo) }))
    : (proyecto.contrato?.modulos || []).map(m => ({ ...m, titulo: cleanModuleTitle(m.titulo) }));

  const modulosResumenTexto = modulosList.map(m => `• ${m.numero || 'Módulo'}: ${cleanModuleTitle(m.titulo)}`).join('\n');
  const clientEmpresa = presupuesto.cliente?.empresa || proyecto.cliente?.empresa || 'Empresa Cliente';
  const presCodigo = presupuesto.codigo || proyecto.presupuestoCodigo || 'P-2026';

  const updatedClausulas = [
    {
      numero: 'PRIMERA',
      titulo: 'OBJETO Y ALCANCE DEL SERVICIO',
      texto: `GOGLITE DIGITAL se compromete formalmente al diseño, desarrollo, configuración y despliegue del sistema web corporativo para EL CLIENTE (${clientEmpresa}), ejecutando los módulos acordados en la propuesta ${presCodigo}:\n${modulosResumenTexto}`
    },
    {
      numero: 'SEGUNDA',
      titulo: 'INFRAESTRUCTURA TÉCNICA Y RENDIMIENTO',
      texto: 'El desarrollo se ejecutará bajo arquitectura limpia nativa (HTML5 semántico, Tailwind CSS y JavaScript modular), excluyendo el uso de plantillas lentas de WordPress. Se garantiza una velocidad de carga móvil optimizada (Core Web Vitals en verde y tiempos inferiores a 1.2 segundos).'
    },
    {
      numero: 'TERCERA',
      titulo: 'PLAZOS DE IMPLEMENTACIÓN (10 A 15 DÍAS HÁBILES)',
      texto: 'El plazo oficial de ejecución técnica es de diez a quince (10 a 15) días hábiles. Dicho plazo comenzará a computarse formalmente a partir de la firma del presente contrato, la acreditación del 50% de anticipo y la entrega de los insumos esenciales del cliente (logotipos, fotografías y accesos de marca).'
    },
    {
      numero: 'CUARTA',
      titulo: 'HONORARIOS Y CONDICIONES DE PAGO',
      texto: `El valor total del acuerdo comercial es de $${total.toLocaleString()} USD. La forma de pago se estructura en dos fases: un cincuenta por ciento (50% = $${anticipo.toLocaleString()} USD) en concepto de anticipo inicial para dar inicio a los trabajos, y el cincuenta por ciento restante ($${saldo.toLocaleString()} USD) contra entrega final y despliegue en staging, previo a la liberación de credenciales maestras y dominio oficial.`
    },
    {
      numero: 'QUINTA',
      titulo: 'PROPIEDAD INTELECTUAL Y LIBERACIÓN TOTAL',
      texto: 'Una vez completada la liquidación final del 100%, EL CLIENTE será propietario exclusivo e irrestricto del código fuente, diseños, bases de datos y activos generados, sin contratos de permanencia forzosa ni comisiones mensuales obligatorias.'
    },
    {
      numero: 'SEXTA',
      titulo: 'CONFIDENCIALIDAD Y SEGURIDAD',
      texto: 'Ambas partes se obligan a mantener bajo estricta confidencialidad toda la información técnica, comercial, accesos a servidores y datos de clientes compartidos durante la ejecución de este contrato.'
    },
    {
      numero: 'SÉPTIMA',
      titulo: 'GARANTÍA Y ACOMPAÑAMIENTO POST-LANZAMIENTO',
      texto: `GOGLITE DIGITAL otorga treinta (30) días calendario de garantía post-lanzamiento para corregir fallos técnicos o incidencias sin costo adicional. Beneficio exclusivo: ${presupuesto.inversion?.beneficioExclusivo || '1 mes de soporte técnico y supervisión técnica gratuita tras el lanzamiento oficial.'}`
    }
  ];

  return {
    ...proyecto,
    presupuestoId: presupuesto.id || proyecto.presupuestoId,
    presupuestoCodigo: presCodigo,
    contrato: {
      ...proyecto.contrato,
      totalInversion: total,
      anticipo,
      saldo,
      moneda: presupuesto.moneda || proyecto.contrato?.moneda || 'USD',
      alcanceResumen: presupuesto.portada?.proyecto || presupuesto.titulo || proyecto.contrato?.alcanceResumen,
      modulos: modulosList,
      clausulas: updatedClausulas
    },
    pagos: {
      ...proyecto.pagos,
      anticipoMonto: anticipo,
      saldoMonto: saldo
    }
  };
}

/**
 * Asegura que exista un proyecto formal para un presupuesto dado.
 * Si ya existe, lo reconcilia con los valores vigentes y actualiza el almacén.
 */
export function ensureProyectoForPresupuesto(presupuesto) {
  if (!presupuesto) return null;

  const existingProyectos = getStoredProyectos();
  const targetEmpresa = (presupuesto.cliente?.empresa || '').toLowerCase().trim();
  const targetCodigo = (presupuesto.codigo || '').toLowerCase().trim();

  let projIndex = existingProyectos.findIndex(p => 
    (p.presupuestoId && p.presupuestoId === presupuesto.id) ||
    (targetCodigo && p.presupuestoCodigo && p.presupuestoCodigo.toLowerCase().trim() === targetCodigo) ||
    (targetEmpresa && p.cliente?.empresa && p.cliente.empresa.toLowerCase().trim() === targetEmpresa)
  );

  let proj = null;
  if (projIndex >= 0) {
    proj = reconcileProyectoWithPresupuesto(existingProyectos[projIndex], presupuesto);
    existingProyectos[projIndex] = proj;
    saveStoredProyectos(existingProyectos);
  } else {
    proj = buildProyectoFromPresupuesto(presupuesto, existingProyectos);
    const updated = [proj, ...existingProyectos];
    saveStoredProyectos(updated);
  }

  // Intentar sincronizar con backend API si está en línea
  try {
    fetch('/api/proyectos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(proj)
    }).catch(() => {});
  } catch (e) {}

  return proj;
}
