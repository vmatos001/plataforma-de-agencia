import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getProyectos } from './proyectosStorage.js';
import { getPresupuestos } from './presupuestosStorage.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const FINANZAS_PATH = path.join(__dirname, '../data/finanzas.json');

// Initialize with sample invoices and operating expenses if empty
function initializeFinanzasData() {
  if (fs.existsSync(FINANZAS_PATH)) {
    try {
      const content = fs.readFileSync(FINANZAS_PATH, 'utf8');
      const parsed = JSON.parse(content);
      if (parsed && Array.isArray(parsed.facturas)) {
        return parsed;
      }
    } catch (e) {
      console.warn('Error parseando finanzas.json, inicializando:', e);
    }
  }

  // Preload invoices based on existing projects
  const proyectos = getProyectos();
  const initialFacturas = [];

  proyectos.forEach((proj, idx) => {
    const num = String(idx + 1).padStart(3, '0');
    const total = proj.contrato?.totalInversion || 1500;
    const anticipo = proj.contrato?.anticipo || Math.round(total * 0.5);

    initialFacturas.push({
      id: `fac-${proj.id || Date.now()}-1`,
      numeroFactura: `FAC-2026-${num}`,
      proyectoId: proj.id,
      codigoProyecto: proj.codigo,
      cliente: {
        empresa: proj.cliente?.empresa || 'Cliente de Agencia',
        contacto: proj.cliente?.nombre || 'Director',
        email: proj.cliente?.email || 'contacto@cliente.com',
        telefono: proj.cliente?.telefono || '+503 7000 0000',
        identificacion: 'NIT / RNC: 0614-290390-102-1',
        pais: proj.pais || 'SV'
      },
      concepto: `Desarrollo de Solución Digital Web & Posicionamiento IA - ${proj.cliente?.empresa}`,
      fechaEmision: proj.fechaCreacion || '2026-10-10',
      fechaVencimiento: '2026-10-25',
      subtotal: total,
      impuestoPorcentaje: 0, // Servicios digitales para exportación o base
      impuestoTotal: 0,
      total: total,
      moneda: 'USD',
      montoCobrado: anticipo,
      saldoPendiente: total - anticipo,
      estado: 'parcial', // 'cobrada' | 'parcial' | 'pendiente' | 'vencida'
      metodoPago: proj.pais === 'SV' ? 'Banco Agrícola El Salvador' : 'Banco Popular Dominicano',
      horasInvertidasEstimadas: 18,
      items: [
        {
          descripcion: `Implementación Web Nativa de Alto Rendimiento (${proj.cliente?.empresa})`,
          cantidad: 1,
          precioUnitario: Math.round(total * 0.7),
          total: Math.round(total * 0.7)
        },
        {
          descripcion: 'Arquitectura Semántica Schema JSON-LD & Optimización GEO IA',
          cantidad: 1,
          precioUnitario: Math.round(total * 0.3),
          total: Math.round(total * 0.3)
        }
      ]
    });
  });

  // Default operational expenses ($0 subscriptions, only basic hosting/domains)
  const initialGastos = [
    {
      id: 'gas-001',
      concepto: 'Servidor VPS Cloud NVMe (Hospedaje de Sitios de Clientes)',
      categoria: 'infraestructura',
      proveedor: 'Hetzner Cloud / VPS Autohosteado',
      monto: 14.50,
      fecha: '2026-10-01',
      proyectoId: null,
      frecuencia: 'mensual',
      pagado: true
    },
    {
      id: 'gas-002',
      concepto: 'Dominio y Certificados SSL para Cliente Grúas Andrea',
      categoria: 'infraestructura',
      proveedor: 'Porkbun Registrar',
      monto: 12.00,
      fecha: '2026-10-05',
      proyectoId: proyectos[0]?.id || null,
      frecuencia: 'unico',
      pagado: true
    },
    {
      id: 'gas-003',
      concepto: 'Consumo API Modelos de Inteligencia Artificial (Auditorías GEO)',
      categoria: 'software',
      proveedor: 'Gemini Flash API',
      monto: 3.20,
      fecha: '2026-10-08',
      proyectoId: null,
      frecuencia: 'mensual',
      pagado: true
    },
    {
      id: 'gas-004',
      concepto: 'Plantillas de Diseño y Recursos Vectoriales',
      categoria: 'marketing',
      proveedor: 'Recursos Libres / Freepik Open',
      monto: 0.00,
      fecha: '2026-10-02',
      proyectoId: null,
      frecuencia: 'mensual',
      pagado: true
    }
  ];

  const initialData = {
    facturas: initialFacturas,
    gastos: initialGastos,
    configuracion: {
      costoHoraInterno: 20, // $20 USD/hora de coste interno de producción
      monedaPrincipal: 'USD',
      tasaIvaSV: 13,
      tasaItbisDO: 18,
      cuentasBancarias: [
        {
          id: 'cta-sv-agricola',
          pais: 'SV',
          banco: 'Banco Agrícola El Salvador',
          tipo: 'Cuenta Corriente Empresarial (Transferencia365)',
          numero: '0031-0029-4821',
          titular: 'Goglite Agency SV · Víctor Matos',
          moneda: 'USD',
          instrucciones: 'Transferencia directa Transferencia365 o ACH',
          activa: true,
          predeterminada: true
        },
        {
          id: 'cta-do-popular',
          pais: 'DO',
          banco: 'Banco Popular Dominicano',
          tipo: 'Cuenta Corriente Comercial (LBTR / ACH)',
          numero: '7829-1928-3011',
          titular: 'Goglite Digital DO · Víctor Matos',
          moneda: 'USD',
          instrucciones: 'Transferencia LBTR en USD o ACH interbancario',
          activa: true,
          predeterminada: true
        },
        {
          id: 'cta-do-banreservas',
          pais: 'DO',
          banco: 'Banreservas (Banco de Reservas)',
          tipo: 'Cuenta de Ahorros / Corriente',
          numero: '960-0012948-1',
          titular: 'Víctor Matos',
          moneda: 'DOP',
          instrucciones: 'Transferencia local en pesos dominicanos (DOP) vía red ACH',
          activa: true,
          predeterminada: false
        },
        {
          id: 'cta-us-uglycash',
          pais: 'US',
          banco: 'uglyCash (Remesas Instantáneas EE.UU.)',
          tipo: 'uglyCash Tag / Billetera Digital',
          numero: '$victormatos',
          titular: 'Víctor Matos',
          moneda: 'USD',
          instrucciones: 'Envío instantáneo de remesas sin comisiones desde EE.UU. vía app uglyCash con tag $victormatos',
          activa: true,
          predeterminada: true
        }
      ]
    }
  };

  try {
    fs.writeFileSync(FINANZAS_PATH, JSON.stringify(initialData, null, 2), 'utf8');
  } catch (err) {
    console.error('Error escribiendo finanzas.json inicial:', err);
  }

  return initialData;
}

export function normalizeCuentasBancarias(raw) {
  if (Array.isArray(raw) && raw.length > 0) {
    const list = raw.map(c => ({
      id: c.id || `cta-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      pais: c.pais || 'DO',
      banco: c.banco || 'Banco Comercial',
      tipo: c.tipo || 'Cuenta Bancaria',
      numero: c.numero || '',
      titular: c.titular || 'Víctor Matos',
      moneda: c.moneda || 'USD',
      instrucciones: c.instrucciones || '',
      activa: c.activa !== undefined ? c.activa : true,
      predeterminada: !!c.predeterminada
    }));
    const hasUglyCash = list.some(c => c.pais === 'US' || (c.banco && c.banco.toLowerCase().includes('uglycash')));
    if (!hasUglyCash) {
      list.push({
        id: 'cta-us-uglycash',
        pais: 'US',
        banco: 'uglyCash (Remesas Instantáneas EE.UU.)',
        tipo: 'uglyCash Tag / Billetera Digital',
        numero: '$victormatos',
        titular: 'Víctor Matos',
        moneda: 'USD',
        instrucciones: 'Envío instantáneo de remesas sin comisiones desde EE.UU. vía app uglyCash con tag $victormatos',
        activa: true,
        predeterminada: true
      });
    }
    return list;
  }

  return [
    {
      id: 'cta-sv-agricola',
      pais: 'SV',
      banco: raw?.SV?.banco || 'Banco Agrícola El Salvador',
      tipo: raw?.SV?.tipo || 'Cuenta Corriente Empresarial (Transferencia365)',
      numero: raw?.SV?.numero || '0031-0029-4821',
      titular: raw?.SV?.titular || 'Goglite Agency SV · Víctor Matos',
      moneda: 'USD',
      instrucciones: 'Transferencia directa Transferencia365 o ACH',
      activa: true,
      predeterminada: true
    },
    {
      id: 'cta-do-popular',
      pais: 'DO',
      banco: raw?.DO?.banco || 'Banco Popular Dominicano',
      tipo: raw?.DO?.tipo || 'Cuenta Corriente Comercial (LBTR / ACH)',
      numero: raw?.DO?.numero || '7829-1928-3011',
      titular: raw?.DO?.titular || 'Goglite Digital DO · Víctor Matos',
      moneda: 'USD',
      instrucciones: 'Transferencia LBTR en USD o ACH',
      activa: true,
      predeterminada: true
    },
    {
      id: 'cta-do-banreservas',
      pais: 'DO',
      banco: 'Banreservas (Banco de Reservas)',
      tipo: 'Cuenta de Ahorros / Corriente',
      numero: '960-0012948-1',
      titular: 'Víctor Matos',
      moneda: 'DOP',
      instrucciones: 'Transferencia local en pesos dominicanos (DOP) vía red ACH',
      activa: true,
      predeterminada: false
    },
    {
      id: 'cta-us-uglycash',
      pais: 'US',
      banco: 'uglyCash (Remesas Instantáneas EE.UU.)',
      tipo: 'uglyCash Tag / Billetera Digital',
      numero: '$victormatos',
      titular: 'Víctor Matos',
      moneda: 'USD',
      instrucciones: 'Envío instantáneo de remesas sin comisiones desde EE.UU. vía app uglyCash con tag $victormatos',
      activa: true,
      predeterminada: true
    }
  ];
}

export function getFinanzas() {
  try {
    if (!fs.existsSync(FINANZAS_PATH)) {
      return initializeFinanzasData();
    }
    const data = fs.readFileSync(FINANZAS_PATH, 'utf8');
    const parsed = JSON.parse(data);
    if (!parsed || !Array.isArray(parsed.facturas)) {
      return initializeFinanzasData();
    }
    if (parsed.configuracion) {
      parsed.configuracion.cuentasBancarias = normalizeCuentasBancarias(parsed.configuracion.cuentasBancarias);
    }
    return parsed;
  } catch (err) {
    console.error('Error leyendo finanzas.json:', err);
    return initializeFinanzasData();
  }
}

export function saveFinanzas(data) {
  try {
    fs.writeFileSync(FINANZAS_PATH, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error('Error guardando finanzas.json:', err);
    return false;
  }
}

export function getResumenFinanciero() {
  const finanzas = getFinanzas();
  const facturas = finanzas.facturas || [];
  const gastos = finanzas.gastos || [];
  const costoHora = finanzas.configuracion?.costoHoraInterno || 20;

  // Totales de facturación
  const totalFacturado = facturas.reduce((acc, f) => acc + (Number(f.total) || 0), 0);
  const totalCobrado = facturas.reduce((acc, f) => acc + (Number(f.montoCobrado) || 0), 0);
  const saldoPorCobrar = facturas.reduce((acc, f) => acc + (Number(f.saldoPendiente) || 0), 0);

  // Totales de gastos operativos
  const totalGastosOperativos = gastos.reduce((acc, g) => acc + (Number(g.monto) || 0), 0);

  // Estimación y registro real de horas de desarrollo (Time Tracking)
  const timeEntries = finanzas.timeEntries && finanzas.timeEntries.length > 0 ? finanzas.timeEntries : [
    {
      id: 'time-001',
      proyectoId: facturas[0]?.proyectoId || 'proj-001',
      cliente: facturas[0]?.cliente?.empresa || 'Grúas Andrea',
      concepto: 'Diseño UX, Wireframes & BrandScript StoryBrand',
      categoria: 'diseño',
      horas: 6.5,
      costoHora: costoHora,
      fecha: '2026-10-06',
      responsable: 'Director UX'
    },
    {
      id: 'time-002',
      proyectoId: facturas[0]?.proyectoId || 'proj-001',
      cliente: facturas[0]?.cliente?.empresa || 'Grúas Andrea',
      concepto: 'Maquetación Web Nativa React & Tailwind (Alto Rendimiento)',
      categoria: 'desarrollo',
      horas: 11.0,
      costoHora: costoHora,
      fecha: '2026-10-08',
      responsable: 'Senior Dev'
    },
    {
      id: 'time-003',
      proyectoId: facturas[0]?.proyectoId || 'proj-001',
      cliente: facturas[0]?.cliente?.empresa || 'Grúas Andrea',
      concepto: 'Arquitectura Schema.org JSON-LD & Optimización GEO Local',
      categoria: 'seo',
      horas: 3.5,
      costoHora: costoHora,
      fecha: '2026-10-09',
      responsable: 'SEO Lead'
    }
  ];

  // Si no estaban guardados en JSON, guardarlos
  if (!finanzas.timeEntries) {
    finanzas.timeEntries = timeEntries;
    saveFinanzas(finanzas);
  }

  const horasRealesTotales = timeEntries.reduce((acc, t) => acc + (Number(t.horas) || 0), 0);
  const horasTotales = horasRealesTotales > 0 ? horasRealesTotales : facturas.reduce((acc, f) => acc + (Number(f.horasInvertidasEstimadas) || 15), 0);
  const costeManoObraTotal = horasTotales * costoHora;

  // Márgenes y beneficio
  const totalCostosReales = totalGastosOperativos + costeManoObraTotal;
  const beneficioBruto = totalFacturado - totalGastosOperativos;
  const beneficioNetoReal = totalFacturado - totalCostosReales;
  const margenNetoPorcentaje = totalFacturado > 0 ? Math.round((beneficioNetoReal / totalFacturado) * 100) : 0;
  const tarifaMediaEfectivaHora = horasTotales > 0 ? Math.round(totalFacturado / horasTotales) : 0;

  // Rentabilidad por proyecto unitaria con Time Tracking
  const proyectosRentabilidad = facturas.map(f => {
    const gastosProyecto = gastos.filter(g => g.proyectoId === f.proyectoId).reduce((a, b) => a + Number(b.monto), 0);
    const entriesProj = timeEntries.filter(t => t.proyectoId === f.proyectoId || t.cliente?.toLowerCase() === f.cliente?.empresa?.toLowerCase());
    const horasRegistradas = entriesProj.reduce((a, b) => a + (Number(b.horas) || 0), 0);
    const horas = horasRegistradas > 0 ? horasRegistradas : (Number(f.horasInvertidasEstimadas) || 15);
    const costeHoras = horas * costoHora;
    const costeTotalProyecto = gastosProyecto + costeHoras;
    const gananciaNeta = (Number(f.total) || 0) - costeTotalProyecto;
    const margenUnitario = Number(f.total) > 0 ? Math.round((gananciaNeta / Number(f.total)) * 100) : 0;
    
    // Rentabilidad horaria efectiva ($/h cobrada)
    const precioVenta = Number(f.total) || 0;
    const tarifaEfectivaHora = horas > 0 ? Math.round(precioVenta / horas) : 0;
    const tarifaObjetivo = finanzas.configuracion?.tarifaObjetivoHora || 50;
    const rentabilidadHorariaNeta = horas > 0 ? Math.round((precioVenta - gastosProyecto) / horas) : 0;
    const alertaDilucion = tarifaEfectivaHora < (tarifaObjetivo * 0.7); // Alerta si cobramos < $35/h

    return {
      facturaId: f.id,
      numeroFactura: f.numeroFactura,
      proyectoId: f.proyectoId,
      cliente: f.cliente?.empresa,
      pais: f.cliente?.pais,
      precioVendido: precioVenta,
      cobrado: Number(f.montoCobrado) || 0,
      gastosDirectos: gastosProyecto,
      horasInvertidas: horas,
      horasRegistradas,
      tarifaEfectivaHora,
      tarifaObjetivo,
      rentabilidadHorariaNeta,
      alertaDilucion,
      costeHoras,
      costeTotal: costeTotalProyecto,
      gananciaNeta,
      margenUnitario,
      esSaludable: margenUnitario >= 60 && !alertaDilucion
    };
  });

  return {
    kpis: {
      totalFacturado,
      totalCobrado,
      saldoPorCobrar,
      totalGastosOperativos,
      horasTotales,
      horasRealesTotales,
      tarifaMediaEfectivaHora,
      costeManoObraTotal,
      beneficioBruto,
      beneficioNetoReal,
      margenNetoPorcentaje
    },
    facturas,
    gastos,
    timeEntries,
    proyectosRentabilidad,
    configuracion: finanzas.configuracion
  };
}

export function crearFactura(data) {
  const finanzas = getFinanzas();
  const nextNum = String(finanzas.facturas.length + 1).padStart(3, '0');
  const total = Number(data.total) || Number(data.subtotal) || 1500;
  const montoCobrado = Number(data.montoCobrado) || 0;

  const nueva = {
    id: 'fac-' + Date.now(),
    numeroFactura: data.numeroFactura || `FAC-2026-${nextNum}`,
    proyectoId: data.proyectoId || null,
    codigoProyecto: data.codigoProyecto || '',
    cliente: data.cliente || {
      empresa: 'Cliente Nuevo',
      contacto: 'Director',
      email: '',
      telefono: '',
      identificacion: '',
      pais: 'SV'
    },
    concepto: data.concepto || 'Desarrollo Web & Servicios Digitales',
    fechaEmision: data.fechaEmision || new Date().toISOString().split('T')[0],
    fechaVencimiento: data.fechaVencimiento || new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0],
    subtotal: Number(data.subtotal) || total,
    impuestoPorcentaje: Number(data.impuestoPorcentaje) || 0,
    impuestoTotal: Number(data.impuestoTotal) || 0,
    total: total,
    moneda: data.moneda || 'USD',
    montoCobrado: montoCobrado,
    saldoPendiente: total - montoCobrado,
    estado: montoCobrado >= total ? 'cobrada' : montoCobrado > 0 ? 'parcial' : 'pendiente',
    metodoPago: data.metodoPago || 'Transferencia Bancaria',
    horasInvertidasEstimadas: Number(data.horasInvertidasEstimadas) || 15,
    items: data.items || [
      { descripcion: 'Servicios de Implementación Digital', cantidad: 1, precioUnitario: total, total }
    ]
  };

  finanzas.facturas.unshift(nueva);
  saveFinanzas(finanzas);
  return nueva;
}

export function actualizarFactura(id, updateData) {
  const finanzas = getFinanzas();
  const idx = finanzas.facturas.findIndex(f => f.id === id);
  if (idx === -1) return null;

  const target = finanzas.facturas[idx];
  const updated = { ...target, ...updateData };

  // Recalcular saldo y estado si se modificó el monto cobrado o total
  if (updateData.montoCobrado !== undefined || updateData.total !== undefined) {
    const t = Number(updated.total) || 0;
    const c = Number(updated.montoCobrado) || 0;
    updated.saldoPendiente = Math.max(0, t - c);
    updated.estado = c >= t ? 'cobrada' : c > 0 ? 'parcial' : 'pendiente';
  }

  finanzas.facturas[idx] = updated;
  saveFinanzas(finanzas);
  return updated;
}

export function crearGasto(data) {
  const finanzas = getFinanzas();
  const nuevoGasto = {
    id: 'gas-' + Date.now(),
    concepto: data.concepto || 'Gasto Operativo',
    categoria: data.categoria || 'operativo',
    proveedor: data.proveedor || 'Proveedor General',
    monto: Number(data.monto) || 0,
    fecha: data.fecha || new Date().toISOString().split('T')[0],
    proyectoId: data.proyectoId || null,
    frecuencia: data.frecuencia || 'unico',
    pagado: data.pagado !== undefined ? data.pagado : true
  };

  finanzas.gastos.unshift(nuevoGasto);
  saveFinanzas(finanzas);
  return nuevoGasto;
}

export function eliminarGasto(id) {
  const finanzas = getFinanzas();
  const len = finanzas.gastos.length;
  finanzas.gastos = finanzas.gastos.filter(g => g.id !== id);
  if (finanzas.gastos.length === len) return false;
  saveFinanzas(finanzas);
  return true;
}

// Time Tracking Functions
export function getTimeEntries(proyectoId = null) {
  const finanzas = getFinanzas();
  const entries = finanzas.timeEntries || [];
  if (!proyectoId) return entries;
  return entries.filter(e => e.proyectoId === proyectoId);
}

export function crearTimeEntry(data) {
  const finanzas = getFinanzas();
  if (!finanzas.timeEntries) finanzas.timeEntries = [];
  
  const nuevo = {
    id: 'time-' + Date.now(),
    proyectoId: data.proyectoId || null,
    cliente: data.cliente || 'Cliente de Agencia',
    concepto: data.concepto || 'Desarrollo / Tarea',
    categoria: data.categoria || 'desarrollo',
    horas: Number(data.horas) || 1,
    costoHora: Number(data.costoHora) || (finanzas.configuracion?.costoHoraInterno || 20),
    fecha: data.fecha || new Date().toISOString().split('T')[0],
    responsable: data.responsable || 'Equipo Agencia'
  };

  finanzas.timeEntries.unshift(nuevo);
  saveFinanzas(finanzas);
  return nuevo;
}

export function eliminarTimeEntry(id) {
  const finanzas = getFinanzas();
  if (!finanzas.timeEntries) return false;
  const len = finanzas.timeEntries.length;
  finanzas.timeEntries = finanzas.timeEntries.filter(t => t.id !== id);
  if (finanzas.timeEntries.length === len) return false;
  saveFinanzas(finanzas);
  return true;
}

export function eliminarFactura(id) {
  const finanzas = getFinanzas();
  const len = (finanzas.facturas || []).length;
  finanzas.facturas = (finanzas.facturas || []).filter(f => f.id !== id);
  if (finanzas.facturas.length === len) return false;
  saveFinanzas(finanzas);
  return true;
}

export function actualizarConfiguracionFinanzas(newConfig) {
  const finanzas = getFinanzas();
  finanzas.configuracion = {
    ...(finanzas.configuracion || {}),
    ...newConfig
  };
  saveFinanzas(finanzas);
  return finanzas.configuracion;
}
