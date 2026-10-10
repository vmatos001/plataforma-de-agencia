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
      cuentasBancarias: {
        SV: {
          banco: 'Banco Agrícola El Salvador',
          tipo: 'Cuenta Corriente Empresarial',
          numero: '0031-0029-4821',
          titular: 'Goglite Agency SV'
        },
        DO: {
          banco: 'Banco Popular Dominicano',
          tipo: 'Cuenta Corriente',
          numero: '7829-1928-3011',
          titular: 'Goglite Digital DO'
        }
      }
    }
  };

  try {
    fs.writeFileSync(FINANZAS_PATH, JSON.stringify(initialData, null, 2), 'utf8');
  } catch (err) {
    console.error('Error escribiendo finanzas.json inicial:', err);
  }

  return initialData;
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

  // Estimación de coste de horas de desarrollo
  const horasTotales = facturas.reduce((acc, f) => acc + (Number(f.horasInvertidasEstimadas) || 15), 0);
  const costeManoObraTotal = horasTotales * costoHora;

  // Márgenes y beneficio
  const totalCostosReales = totalGastosOperativos + costeManoObraTotal;
  const beneficioBruto = totalFacturado - totalGastosOperativos;
  const beneficioNetoReal = totalFacturado - totalCostosReales;
  const margenNetoPorcentaje = totalFacturado > 0 ? Math.round((beneficioNetoReal / totalFacturado) * 100) : 0;

  // Rentabilidad por proyecto unitaria
  const proyectosRentabilidad = facturas.map(f => {
    const gastosProyecto = gastos.filter(g => g.proyectoId === f.proyectoId).reduce((a, b) => a + Number(b.monto), 0);
    const horas = Number(f.horasInvertidasEstimadas) || 15;
    const costeHoras = horas * costoHora;
    const costeTotalProyecto = gastosProyecto + costeHoras;
    const gananciaNeta = (Number(f.total) || 0) - costeTotalProyecto;
    const margenUnitario = Number(f.total) > 0 ? Math.round((gananciaNeta / Number(f.total)) * 100) : 0;

    return {
      facturaId: f.id,
      numeroFactura: f.numeroFactura,
      proyectoId: f.proyectoId,
      cliente: f.cliente?.empresa,
      pais: f.cliente?.pais,
      precioVendido: Number(f.total) || 0,
      cobrado: Number(f.montoCobrado) || 0,
      gastosDirectos: gastosProyecto,
      horasInvertidas: horas,
      costeHoras,
      costeTotal: costeTotalProyecto,
      gananciaNeta,
      margenUnitario,
      esSaludable: margenUnitario >= 60
    };
  });

  return {
    kpis: {
      totalFacturado,
      totalCobrado,
      saldoPorCobrar,
      totalGastosOperativos,
      horasTotales,
      costeManoObraTotal,
      beneficioBruto,
      beneficioNetoReal,
      margenNetoPorcentaje
    },
    facturas,
    gastos,
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
