import React, { useState, useEffect, useMemo } from 'react';
import {
  DollarSign,
  TrendingUp,
  CreditCard,
  PieChart,
  FileText,
  Plus,
  Printer,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Download,
  ExternalLink,
  Building2,
  Users,
  Search,
  Filter,
  Check,
  X,
  Trash2,
  Eye,
  RefreshCw,
  Sliders,
  Wallet,
  Settings,
  Sparkles,
  Link2,
  Copy,
  Star,
  Globe,
  ShieldCheck,
  Play,
  Pause,
  Square,
  RotateCcw,
  Timer,
  Calendar
} from 'lucide-react';

import { 
  getAppStateCloud, 
  saveAppStateCloud, 
  saveProyectoCloud, 
  savePortalCloud, 
  getProyectosCloud, 
  getPresupuestosCloud, 
  getCrmLeadsCloud 
} from '../services/firestoreSyncService';
import { DEFAULT_AGENCY_BRANDING } from '../constants/defaultAgencyBranding';

const STORAGE_KEY_FINANZAS = 'goglite_finanzas_v1';
const STORAGE_KEY_TIMER = 'goglite_live_timer_v1';

const DEFAULT_TIMER_STATE = {
  isRunning: false,
  isPaused: false,
  startTime: null,
  accumulatedSeconds: 0,
  proyectoId: '',
  cliente: '',
  concepto: '',
  categoria: 'desarrollo',
  responsable: 'Senior Dev'
};

function getElapsedSeconds(timer) {
  if (!timer) return 0;
  let secs = Number(timer.accumulatedSeconds) || 0;
  if (timer.isRunning && !timer.isPaused && timer.startTime) {
    const delta = Math.floor((Date.now() - timer.startTime) / 1000);
    if (delta > 0) secs += delta;
  }
  return secs;
}

function formatTime(totalSeconds) {
  const s = Math.max(0, Math.floor(totalSeconds));
  const hrs = Math.floor(s / 3600);
  const mins = Math.floor((s % 3600) / 60);
  const secs = s % 60;
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
}

export const DEFAULT_CUENTAS_BANCARIAS = [
  {
    id: 'cta-sv-agricola',
    pais: 'SV',
    banco: 'Banco Agrícola El Salvador',
    tipo: 'Cuenta Corriente Empresarial (Transferencia365)',
    numero: '0031-0029-4821',
    titular: 'Goglite Agency SV · Víctor Matos',
    moneda: 'USD',
    instrucciones: 'Transferencia directa Transferencia365 o ACH interbancario en El Salvador',
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
    instrucciones: 'Transferencia local en pesos dominicanos (DOP) vía red ACH / Banreservas',
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
    instrucciones: 'Envío instantáneo de remesas sin comisiones desde EE.UU. a través de la app uglyCash con tag $victormatos',
    activa: true,
    predeterminada: true
  }
];

export function normalizeCuentasBancarias(raw) {
  let list = [];
  if (Array.isArray(raw) && raw.length > 0) {
    list = raw.map(c => ({
      id: c.id || `cta-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      pais: c.pais || 'DO',
      banco: c.banco || 'Banco Comercial',
      tipo: c.tipo || 'Cuenta Bancaria',
      numero: c.numero || '',
      titular: c.titular || 'Víctor Matos',
      moneda: c.moneda || (c.pais === 'DO' && c.banco?.toLowerCase().includes('reservas') ? 'DOP' : 'USD'),
      instrucciones: c.instrucciones || '',
      activa: c.activa !== undefined ? c.activa : true,
      predeterminada: !!c.predeterminada
    }));

    // Asegurar que uglyCash siempre esté incluido si aún no existe
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
        instrucciones: 'Envío instantáneo de remesas sin comisiones desde EE.UU. a través de la app uglyCash con tag $victormatos',
        activa: true,
        predeterminada: true
      });
    }
  } else if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
    list = [
      {
        id: 'cta-sv-agricola',
        pais: 'SV',
        banco: raw.SV?.banco || 'Banco Agrícola El Salvador',
        tipo: raw.SV?.tipo || 'Cuenta Corriente Empresarial (Transferencia365)',
        numero: raw.SV?.numero || '0031-0029-4821',
        titular: raw.SV?.titular || 'Goglite Agency SV · Víctor Matos',
        moneda: 'USD',
        instrucciones: 'Transferencia directa Transferencia365 o ACH',
        activa: true,
        predeterminada: true
      },
      {
        id: 'cta-do-popular',
        pais: 'DO',
        banco: raw.DO?.banco || 'Banco Popular Dominicano',
        tipo: raw.DO?.tipo || 'Cuenta Corriente Comercial (LBTR / ACH)',
        numero: raw.DO?.numero || '7829-1928-3011',
        titular: raw.DO?.titular || 'Goglite Digital DO · Víctor Matos',
        moneda: 'USD',
        instrucciones: 'Transferencia LBTR en USD o ACH',
        activa: true,
        predeterminada: true
      },
      {
        id: 'cta-do-banreservas',
        pais: 'DO',
        banco: raw.DO?.banco || 'Banreservas (Banco de Reservas)',
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
        instrucciones: 'Envío instantáneo de remesas sin comisiones desde EE.UU. a través de la app uglyCash con tag $victormatos',
        activa: true,
        predeterminada: true
      }
    ];
  } else {
    list = [...DEFAULT_CUENTAS_BANCARIAS];
  }

  // Compatibilidad hacia atrás: permitir también acceso directo .SV y .DO
  const svDefault = list.find(c => c.pais === 'SV' && c.activa) || list[0] || {};
  const doDefault = list.find(c => c.pais === 'DO' && c.activa) || list[1] || {};
  const usDefault = list.find(c => c.pais === 'US' && c.activa) || list[3] || {};
  list.SV = svDefault;
  list.DO = doDefault;
  list.US = usDefault;
  return list;
}

export const DEFAULT_CONFIGURACION = {
  costoHoraInterno: 20,
  tarifaObjetivoHora: 50,
  monedaPrincipal: 'USD',
  tasaIvaSV: 13,
  tasaItbisDO: 18,
  emisor: {
    empresa: 'GOGLITE AGENCY SUITE',
    subtitulo: 'Agencia Web, Automatización & Posicionamiento IA (GEO)',
    identificacion: 'NIT / RNC: 0614-290390-102-1',
    email: 'info@goglite.com',
    telefono: '+503 7756-9828 · +1 (829) 528-4713',
    ubicacion: 'San Salvador, SV · Santo Domingo, DO'
  },
  cuentasBancarias: normalizeCuentasBancarias(DEFAULT_CUENTAS_BANCARIAS)
};

const INITIAL_SEED_STATE = {
  facturas: [],
  gastos: [],
  timeEntries: [],
  configuracion: DEFAULT_CONFIGURACION
};

/**
 * Normaliza y calibra matemáticamente los ítems de una factura para garantizar 100% de coherencia.
 * Elimina cualquier desglose individual de costo por módulo para respetar la política de precio total cerrado.
 */
export function normalizeFacturaItems(fac) {
  if (!fac) return fac;
  const total = Number(fac.total) || Number(fac.subtotal) || 300;
  let items = Array.isArray(fac.items) && fac.items.length > 0 ? fac.items : [];

  // Si los ítems contienen desglose de costo por módulo ("MÓDULO 1...", etc.), consolidar en un solo servicio integral
  const hasModuleBreakdown = items.some(it => 
    (it.descripcion || '').toLowerCase().includes('módulo') ||
    (it.descripcion || '').toLowerCase().includes('modulo')
  );

  if (hasModuleBreakdown || items.length === 0) {
    const modulosText = items
      .map(it => (it.descripcion || '').replace(/\s*\(\$\s*[\d,]+(?:\.\d+)?\s*USD\)/gi, '').trim())
      .filter(Boolean)
      .join(' · ');
    const desc = fac.concepto || (modulosText ? `Servicio Integral Web & Posicionamiento (${modulosText})` : 'Servicio Profesional de Desarrollo Digital & GEO IA');
    items = [{
      id: 'item-1',
      descripcion: desc,
      cantidad: 1,
      precioUnitario: total,
      total: total
    }];
  } else {
    // Si hay un solo ítem o ítems no modulares, recalibrar proporcionalmente para que sume exactamente el total
    const currentSum = items.reduce((acc, it) => acc + (Number(it.total) || (Number(it.precioUnitario) * (Number(it.cantidad) || 1)) || 0), 0);
    if (Math.abs(currentSum - total) > 0.01 && currentSum > 0) {
      let acc = 0;
      items = items.map((it, idx) => {
        const isLast = idx === items.length - 1;
        const currentItemTotal = Number(it.total) || (Number(it.precioUnitario) * (Number(it.cantidad) || 1)) || 1;
        let newPrice = Math.round((currentItemTotal / currentSum) * total);
        if (isLast) {
          newPrice = total - acc;
        } else {
          acc += newPrice;
        }
        return {
          ...it,
          cantidad: Number(it.cantidad) || 1,
          precioUnitario: newPrice,
          total: newPrice
        };
      });
    }
  }

  const montoCobrado = Number(fac.montoCobrado) || 0;
  const saldoPendiente = Math.max(0, total - montoCobrado);
  const estado = montoCobrado >= total ? 'cobrada' : montoCobrado > 0 ? 'parcial' : 'pendiente';

  return {
    ...fac,
    subtotal: total,
    total,
    items,
    montoCobrado,
    saldoPendiente,
    estado
  };
}

/**
 * Validador de pertenencia de una fecha a un período contable
 */
export function isDateInPeriod(dateStr, period) {
  if (!period || period === 'historico') return true;
  if (!dateStr) return true;
  
  const normalizedStr = typeof dateStr === 'string' && dateStr.length === 10 
    ? `${dateStr}T12:00:00` 
    : dateStr;
  const d = new Date(normalizedStr);
  if (isNaN(d.getTime())) return true;

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth(); // 0-indexed (0=Enero, 9=Octubre)

  const dYear = d.getFullYear();
  const dMonth = d.getMonth();

  if (period === 'este_mes') {
    return dYear === year && dMonth === month;
  }
  if (period === 'mes_anterior') {
    const prevMonth = month === 0 ? 11 : month - 1;
    const prevYear = month === 0 ? year - 1 : year;
    return dYear === prevYear && dMonth === prevMonth;
  }
  if (period === 'trimestre') {
    const currentQ = Math.floor(month / 3);
    const dQ = Math.floor(dMonth / 3);
    return dYear === year && currentQ === dQ;
  }
  if (period === 'anio') {
    return dYear === year;
  }
  return true;
}

/**
 * Etiqueta legible para el período activo
 */
export function getPeriodLabel(period) {
  const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  const now = new Date();
  const currentMonthName = months[now.getMonth()];
  const currentYear = now.getFullYear();
  
  if (period === 'este_mes') {
    return `${currentMonthName} ${currentYear}`;
  }
  if (period === 'mes_anterior') {
    const prevMonthIdx = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
    const prevYear = now.getMonth() === 0 ? currentYear - 1 : currentYear;
    return `${months[prevMonthIdx]} ${prevYear}`;
  }
  if (period === 'trimestre') {
    const q = Math.floor(now.getMonth() / 3) + 1;
    return `T${q} (${currentYear})`;
  }
  if (period === 'anio') {
    return `Año ${currentYear}`;
  }
  return 'Histórico Completo';
}

/**
 * Cálculo dinámico de KPIs de P&L filtrados por período y mercado
 */
export function computeKpiMetrics(rawState, period = 'este_mes', market = 'ALL') {
  const allFacturas = (Array.isArray(rawState?.facturas) ? rawState.facturas : []).map(normalizeFacturaItems);
  const allGastos = Array.isArray(rawState?.gastos) ? rawState.gastos : [];
  const allTimeEntries = Array.isArray(rawState?.timeEntries) ? rawState.timeEntries : [];
  const configuracion = {
    ...DEFAULT_CONFIGURACION,
    ...(rawState?.configuracion || {})
  };
  const costoHora = Number(configuracion.costoHoraInterno) || 20;

  // Filtrar facturas por fecha y mercado
  const facturasPeriodo = allFacturas.filter(f => {
    const inPeriod = isDateInPeriod(f.fechaEmision, period);
    const inMarket = market === 'ALL' || f.cliente?.pais === market || f.pais === market;
    return inPeriod && inMarket;
  });

  // Filtrar gastos por fecha y mercado
  const gastosPeriodo = allGastos.filter(g => {
    const inPeriod = isDateInPeriod(g.fecha, period);
    const inMarket = market === 'ALL' || g.pais === market || (g.clienteAsociado && g.clienteAsociado.includes(market));
    return inPeriod && inMarket;
  });

  // Filtrar horas por fecha
  const timeEntriesPeriodo = allTimeEntries.filter(t => {
    return isDateInPeriod(t.fecha, period);
  });

  const totalFacturado = facturasPeriodo.reduce((acc, f) => acc + (Number(f.total) || 0), 0);
  const totalCobrado = facturasPeriodo.reduce((acc, f) => acc + (Number(f.montoCobrado) || 0), 0);
  const saldoPorCobrar = facturasPeriodo.reduce((acc, f) => {
    const total = Number(f.total) || 0;
    const cobrado = Number(f.montoCobrado) || 0;
    return acc + Math.max(0, total - cobrado);
  }, 0);

  const totalGastosOperativos = gastosPeriodo.reduce((acc, g) => acc + (Number(g.monto) || 0), 0);

  const horasRealesTotales = timeEntriesPeriodo.reduce((acc, t) => acc + (Number(t.horas) || 0), 0);
  const horasTotalesFacturas = facturasPeriodo.reduce((acc, f) => acc + (Number(f.horasInvertidasEstimadas) || 10), 0);
  const horasTotales = horasRealesTotales > 0 ? horasRealesTotales : (facturasPeriodo.length > 0 ? horasTotalesFacturas : 0);
  const costeManoObraTotal = horasTotales * costoHora;

  const totalCostosReales = totalGastosOperativos + costeManoObraTotal;
  const beneficioNetoReal = totalFacturado - totalCostosReales;
  const margenNetoPorcentaje = totalFacturado > 0 
    ? Math.round((beneficioNetoReal / totalFacturado) * 100) 
    : (totalCostosReales > 0 ? -100 : 0);

  return {
    totalFacturado,
    totalCobrado,
    saldoPorCobrar,
    totalGastosOperativos,
    costeManoObraTotal,
    totalCostosReales,
    beneficioNetoReal,
    margenNetoPorcentaje,
    proyectosCount: facturasPeriodo.length
  };
}

/**
 * Motor Contable Reactivo Isomórfico ($0 Cost Client + Server)
 * Calcula KPIs P&L, Unit Economics por proyecto y Alertas de Dilución Horaria en 0ms.
 */
function computeFinanzasSummary(rawState) {
  const facturas = (Array.isArray(rawState?.facturas) ? rawState.facturas : []).map(normalizeFacturaItems);
  const gastos = Array.isArray(rawState?.gastos) ? rawState.gastos : [];
  const timeEntries = Array.isArray(rawState?.timeEntries) ? rawState.timeEntries : [];
  const configuracion = {
    ...DEFAULT_CONFIGURACION,
    ...(rawState?.configuracion || {}),
    emisor: {
      ...DEFAULT_CONFIGURACION.emisor,
      ...(rawState?.configuracion?.emisor || {})
    },
    cuentasBancarias: normalizeCuentasBancarias(rawState?.configuracion?.cuentasBancarias)
  };

  const costoHora = Number(configuracion.costoHoraInterno) || 20;
  const tarifaObjetivo = Number(configuracion.tarifaObjetivoHora) || 50;

  const totalFacturado = facturas.reduce((acc, f) => acc + (Number(f.total) || 0), 0);
  const totalCobrado = facturas.reduce((acc, f) => acc + (Number(f.montoCobrado) || 0), 0);
  const saldoPorCobrar = facturas.reduce((acc, f) => {
    const total = Number(f.total) || 0;
    const cobrado = Number(f.montoCobrado) || 0;
    return acc + Math.max(0, total - cobrado);
  }, 0);

  const totalGastosOperativos = gastos.reduce((acc, g) => acc + (Number(g.monto) || 0), 0);

  // Rentabilidad Unitaria consolidada por Proyecto / Cliente
  // Agrupamos facturas por proyecto para evitar filas duplicadas cuando existen hitos de Anticipo y Saldo Final
  const projectGroups = new Map();
  facturas.forEach(f => {
    const empNormalized = (f.cliente?.empresa || '').toLowerCase().trim();
    const groupKey = f.proyectoId || f.presupuestoId || (empNormalized ? `client_${empNormalized}` : f.id);
    if (!projectGroups.has(groupKey)) {
      projectGroups.set(groupKey, []);
    }
    projectGroups.get(groupKey).push(f);
  });

  const proyectosRentabilidad = Array.from(projectGroups.values()).map(groupFacturas => {
    const primaryFac = groupFacturas[0];
    const empLower = (primaryFac.cliente?.empresa || '').toLowerCase().trim();
    const facturaIds = groupFacturas.map(f => f.id);
    const numerosList = groupFacturas.map(f => f.numeroFactura).filter(Boolean);
    const numerosFactura = numerosList.join(' · ');

    // Gastos directos vinculados a este proyecto o cliente (no duplicar)
    const gastosProyecto = gastos
      .filter(g => {
        if (g.proyectoId && primaryFac.proyectoId && g.proyectoId === primaryFac.proyectoId) return true;
        if (g.facturaId && facturaIds.includes(g.facturaId)) return true;
        if (g.clienteAsociado && empLower && g.clienteAsociado.toLowerCase().trim() === empLower) return true;
        return false;
      })
      .reduce((acc, g) => acc + (Number(g.monto) || 0), 0);

    // Horas registradas en Time Tracking para este proyecto o cliente
    const entriesProj = timeEntries.filter(t => {
      if (t.proyectoId && primaryFac.proyectoId && t.proyectoId === primaryFac.proyectoId) return true;
      if (t.facturaId && facturaIds.includes(t.facturaId)) return true;
      if (t.cliente && empLower && t.cliente.toLowerCase().trim() === empLower) return true;
      return false;
    });

    const horasRegistradas = entriesProj.reduce((acc, t) => acc + (Number(t.horas) || 0), 0);
    const horasEstimadas = Number(primaryFac.horasInvertidasEstimadas) || 10;
    const horasInvertidas = horasRegistradas > 0 ? horasRegistradas : horasEstimadas;

    const costeHoras = horasInvertidas * costoHora;
    const costeTotalProyecto = gastosProyecto + costeHoras;
    const precioVenta = groupFacturas.reduce((acc, f) => acc + (Number(f.total) || 0), 0);
    const cobrado = groupFacturas.reduce((acc, f) => acc + (Number(f.montoCobrado) || 0), 0);
    const saldoPendiente = Math.max(0, precioVenta - cobrado);
    const gananciaNeta = precioVenta - costeTotalProyecto;
    const margenUnitario = precioVenta > 0 ? Math.round((gananciaNeta / precioVenta) * 100) : 0;

    const tarifaEfectivaHora = horasInvertidas > 0 ? Math.round(precioVenta / horasInvertidas) : 0;
    const rentabilidadHorariaNeta = horasInvertidas > 0 ? Math.round((precioVenta - gastosProyecto) / horasInvertidas) : 0;
    const alertaDilucion = tarifaEfectivaHora < Math.round(tarifaObjetivo * 0.7);

    return {
      facturaId: primaryFac.id,
      facturaIds,
      totalFacturasCount: groupFacturas.length,
      numeroFactura: primaryFac.numeroFactura,
      numerosFactura,
      proyectoId: primaryFac.proyectoId || primaryFac.id,
      presupuestoId: primaryFac.presupuestoId || null,
      origenModulo: primaryFac.origenModulo || 'Facturación Directa',
      cliente: primaryFac.cliente?.empresa || 'Cliente',
      contacto: primaryFac.cliente?.contacto || '',
      pais: primaryFac.cliente?.pais || 'SV',
      precioVendido: precioVenta,
      cobrado,
      saldoPendiente,
      gastosDirectos: gastosProyecto,
      horasEstimadas,
      horasInvertidas,
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

  const horasRealesTotales = timeEntries.reduce((acc, t) => acc + (Number(t.horas) || 0), 0);
  const horasTotalesProyectos = proyectosRentabilidad.reduce((acc, p) => acc + p.horasInvertidas, 0);
  const horasTotales = Math.max(horasRealesTotales, horasTotalesProyectos);
  const costeManoObraTotal = horasTotales * costoHora;

  const totalCostosReales = totalGastosOperativos + costeManoObraTotal;
  const beneficioBruto = totalFacturado - totalGastosOperativos;
  const beneficioNetoReal = totalFacturado - totalCostosReales;
  const margenNetoPorcentaje = totalFacturado > 0 ? Math.round((beneficioNetoReal / totalFacturado) * 100) : 0;
  const tarifaMediaEfectivaHora = horasTotales > 0 ? Math.round(totalFacturado / horasTotales) : tarifaObjetivo;

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
    configuracion
  };
}

/**
 * Convierte un Presupuesto del Módulo 3 en un objeto Factura Proforma compatible con Módulo 4.
 * En Goglite el acuerdo comercial es a precio total cerrado; la factura no desglosa precios por módulo.
 */
export function buildInvoiceFromPresupuesto(prop, existingCount = 0, configuracion = DEFAULT_CONFIGURACION) {
  const nextNum = String(existingCount + 1).padStart(3, '0');
  const subtotal = Number(prop.inversion?.precioTotal) || 300;
  const anticipo = Number(prop.inversion?.anticipo) ?? Math.round(subtotal * 0.5);
  const pais = prop.pais || (prop.cliente?.ubicacion?.toLowerCase().includes('dominicana') ? 'DO' : 'SV');

  // Calcular horas estimadas sumando las horas de los módulos de la propuesta
  const modulosHoras = Array.isArray(prop.modulos)
    ? prop.modulos.reduce((acc, m) => acc + (Number(m.horas) || 0), 0)
    : 0;
  const horasInvertidasEstimadas = modulosHoras > 0 ? modulosHoras : Math.max(5, Math.round(subtotal / 50));

  const cleanModuleTitle = (t) => (t || '')
    .replace(/\s*\(\$\s*[\d,]+(?:\.\d+)?\s*USD\)/gi, '')
    .replace(/\s*\(\$\s*[\d,]+(?:\.\d+)?\)/gi, '')
    .trim();

  const modulosNombres = Array.isArray(prop.modulos) && prop.modulos.length > 0
    ? prop.modulos.map(m => `${m.numero ? m.numero + ': ' : ''}${cleanModuleTitle(m.titulo)}`).join(' · ')
    : '';

  const itemDescripcion = prop.portada?.proyecto
    ? `${prop.titulo || 'Solución Web Corporativa VIP'}: ${prop.portada.proyecto}`
    : (modulosNombres
        ? `${prop.titulo || 'Desarrollo Digital VIP'} (Entregables: ${modulosNombres})`
        : (prop.titulo || 'Desarrollo de Sistema Digital Web & Posicionamiento IA'));

  const items = [
    {
      id: 'item-1',
      descripcion: itemDescripcion,
      cantidad: 1,
      precioUnitario: subtotal,
      total: subtotal
    }
  ];

  const today = new Date().toISOString().split('T')[0];
  const due = new Date(Date.now() + (Number(prop.vigenciaDias) || 15) * 86400000).toISOString().split('T')[0];

  return {
    id: `fac-${prop.id || Date.now()}`,
    numeroFactura: `FAC-2026-${nextNum}`,
    presupuestoId: prop.id,
    codigoPresupuesto: prop.codigo || `P-2026-${nextNum}`,
    proyectoId: `proj-${prop.id || Date.now()}`,
    codigoProyecto: prop.codigo || `CON-2026-${nextNum}`,
    origenModulo: `Módulo 3 · ${prop.codigo || 'Presupuesto VIP'}`,
    cliente: {
      empresa: prop.cliente?.empresa || 'Cliente de Agencia',
      contacto: prop.cliente?.nombre || 'Director',
      email: prop.cliente?.email || '',
      telefono: prop.cliente?.telefono || '',
      identificacion: prop.cliente?.identificacion || 'ID Fiscal Comercial',
      pais
    },
    concepto: `${prop.titulo || 'Propuesta Digital VIP'} ${prop.subtitulo || ''}`.trim(),
    fechaEmision: today,
    fechaVencimiento: due,
    subtotal,
    impuestoPorcentaje: 0,
    impuestoTotal: 0,
    total: subtotal,
    moneda: prop.moneda || 'USD',
    montoCobrado: anticipo,
    saldoPendiente: Math.max(0, subtotal - anticipo),
    estado: anticipo >= subtotal ? 'cobrada' : anticipo > 0 ? 'parcial' : 'pendiente',
    metodoPago: (() => {
      const c = normalizeCuentasBancarias(configuracion?.cuentasBancarias);
      const m = c.find(item => item.pais === pais && item.activa && item.predeterminada) || c.find(item => item.pais === pais && item.activa) || c[0];
      return m?.banco || 'Transferencia Bancaria';
    })(),
    cuentaBancariaId: (() => {
      const c = normalizeCuentasBancarias(configuracion?.cuentasBancarias);
      const m = c.find(item => item.pais === pais && item.activa && item.predeterminada) || c.find(item => item.pais === pais && item.activa) || c[0];
      return m?.id || null;
    })(),
    horasInvertidasEstimadas,
    items
  };
}

/**
 * Reconcilia una factura existente con el presupuesto actual y estado de pagos por hito.
 * Respeta rigurosamente facturas por hito (Anticipo 50% y Saldo Final 50%) evitando
 * sobreescribir facturas de liquidación con montos monolíticos o saldos pendientes erróneos.
 */
export function reconcileInvoiceWithPresupuesto(fac, prop, extraContext = {}) {
  if (!fac) return buildInvoiceFromPresupuesto(prop);
  if (!prop) return fac;

  const precioTotal = Number(prop.inversion?.precioTotal) || Number(prop.contrato?.totalInversion) || Number(fac.total) || 300;
  const anticipoMonto = Number(prop.inversion?.anticipo) || Number(prop.pagos?.anticipoMonto) || Math.round(precioTotal * 0.5);
  const saldoMonto = Number(prop.inversion?.contraEntrega) || Number(prop.pagos?.saldoMonto) || (precioTotal - anticipoMonto);
  const pais = prop.pais || fac.cliente?.pais || (prop.cliente?.ubicacion?.toLowerCase().includes('dominicana') ? 'DO' : 'SV');

  const cleanModuleTitle = (t) => (t || '')
    .replace(/\s*\(\$\s*[\d,]+(?:\.\d+)?\s*USD\)/gi, '')
    .replace(/\s*\(\$\s*[\d,]+(?:\.\d+)?\)/gi, '')
    .trim();

  const modulosNombres = Array.isArray(prop.modulos) && prop.modulos.length > 0
    ? prop.modulos.map(m => `${m.numero ? m.numero + ': ' : ''}${cleanModuleTitle(m.titulo)}`).join(' · ')
    : '';

  const cleanTitle = cleanModuleTitle(prop.titulo || prop.portada?.proyecto || fac.concepto || 'Desarrollo Web VIP');

  const isSaldo = fac.tipoHito === 'saldo' ||
    fac.id?.endsWith('-saldo') ||
    fac.concepto?.toLowerCase().includes('saldo') ||
    fac.concepto?.toLowerCase().includes('liquidaci');

  const isAnticipo = fac.tipoHito === 'anticipo' ||
    fac.id?.endsWith('-anticipo') ||
    fac.concepto?.toLowerCase().includes('anticipo') ||
    (!isSaldo && fac.tipoHito !== 'total');

  // Determinar estado de pagos cruzando extraContext, prop y localStorage
  let isAnticipoPaid = Boolean(
    (fac.estado === 'cobrada' && isAnticipo) ||
    extraContext?.isAnticipoPaid ||
    prop.pagos?.anticipoEstado === 'confirmado' ||
    prop.pagos?.anticipoEstado === 'verificacion' ||
    prop.portalConfig?.anticipoConfirmadoAgencia ||
    prop.portalConfig?.facturaAnticipoHabilitada ||
    extraContext?.portalConfig?.anticipoConfirmadoAgencia ||
    extraContext?.proyecto?.pagos?.anticipoEstado === 'confirmado'
  );

  let isSaldoPaid = Boolean(
    (fac.estado === 'cobrada' && isSaldo) ||
    extraContext?.isSaldoPaid ||
    prop.pagos?.saldoEstado === 'confirmado' ||
    prop.pagos?.saldoEstado === 'verificacion' ||
    prop.portalConfig?.fase4Liquidada ||
    prop.portalConfig?.liquidacionPagada ||
    prop.portalConfig?.liquidacionReportada ||
    prop.portalConfig?.saldoConfirmadoAgencia ||
    Boolean(prop.portalConfig?.comprobanteLiquidacion) ||
    extraContext?.portalConfig?.fase4Liquidada ||
    extraContext?.portalConfig?.liquidacionPagada ||
    extraContext?.portalConfig?.liquidacionReportada ||
    extraContext?.portalConfig?.saldoConfirmadoAgencia ||
    extraContext?.proyecto?.pagos?.saldoEstado === 'confirmado' ||
    extraContext?.proyecto?.pagos?.saldoEstado === 'verificacion'
  );

  if (Array.isArray(extraContext?.proyectos) && (!isAnticipoPaid || !isSaldoPaid)) {
    try {
      const targetProj = extraContext.proyectos.find(p => 
        (fac.proyectoId && (p.id === fac.proyectoId || p.id === `proj-${fac.proyectoId}`)) ||
        (prop.id && (p.presupuestoId === prop.id || p.id === prop.id)) ||
        (prop.codigo && (p.codigo === prop.codigo || p.presupuestoCodigo === prop.codigo)) ||
        (fac.codigoPresupuesto && (p.codigo === fac.codigoPresupuesto || p.presupuestoCodigo === fac.codigoPresupuesto)) ||
        (fac.cliente?.empresa && p.cliente?.empresa && p.cliente.empresa.toLowerCase().trim() === fac.cliente.empresa.toLowerCase().trim())
      );
      if (targetProj) {
        if (targetProj.pagos?.anticipoEstado === 'confirmado' || targetProj.portalConfig?.anticipoConfirmadoAgencia) {
          isAnticipoPaid = true;
        }
        if (
          targetProj.pagos?.saldoEstado === 'confirmado' ||
          targetProj.pagos?.saldoEstado === 'verificacion' ||
          targetProj.portalConfig?.fase4Liquidada ||
          targetProj.portalConfig?.liquidacionPagada ||
          targetProj.portalConfig?.liquidacionReportada ||
          targetProj.portalConfig?.saldoConfirmadoAgencia ||
          targetProj.portalConfig?.comprobanteLiquidacion
        ) {
          isSaldoPaid = true;
        }
      }
    } catch {}
  }

  let finalSubtotal = precioTotal;
  let finalTotal = precioTotal;
  let montoCobrado = 0;
  let saldoPendiente = precioTotal;
  let estado = 'pendiente';
  let items = [];
  let concepto = '';

  if (isSaldo) {
    finalSubtotal = saldoMonto;
    finalTotal = saldoMonto;
    const paid = isSaldoPaid || fac.estado === 'cobrada' || (Number(fac.montoCobrado) >= finalTotal);
    montoCobrado = paid ? finalTotal : Math.min(finalTotal, Number(fac.montoCobrado) || 0);
    saldoPendiente = paid ? 0 : Math.max(0, finalTotal - montoCobrado);
    estado = paid ? 'cobrada' : (montoCobrado > 0 ? 'parcial' : 'pendiente');
    concepto = `Saldo Final & Liquidación de Cierre (50%) · ${cleanTitle}`;
    items = [
      {
        id: 'item-saldo',
        descripcion: `Saldo Final & Liquidación de Cierre (50%) - Entrega Oficial, Despliegue en Producción & Cesión de Accesos (${cleanTitle})`,
        cantidad: 1,
        precioUnitario: finalTotal,
        total: finalTotal
      }
    ];
  } else if (isAnticipo) {
    finalSubtotal = anticipoMonto;
    finalTotal = anticipoMonto;
    const paid = isAnticipoPaid || fac.estado === 'cobrada' || (Number(fac.montoCobrado) >= finalTotal);
    montoCobrado = paid ? finalTotal : Math.min(finalTotal, Number(fac.montoCobrado) || 0);
    saldoPendiente = paid ? 0 : Math.max(0, finalTotal - montoCobrado);
    estado = paid ? 'cobrada' : (montoCobrado > 0 ? 'parcial' : 'pendiente');
    concepto = `Anticipo Inicial (50%) · ${cleanTitle}`;
    items = [
      {
        id: 'item-anticipo',
        descripcion: `Anticipo Inicial (50%) - Inicio de Desarrollo Web VIP, Estructura & Setup Técnico (${cleanTitle})`,
        cantidad: 1,
        precioUnitario: finalTotal,
        total: finalTotal
      }
    ];
  } else {
    // Factura Monolítica (Proyecto Completo)
    finalSubtotal = precioTotal;
    finalTotal = precioTotal;
    const isPaidFull = isSaldoPaid || (Number(fac.montoCobrado) >= finalTotal);
    const isPaidHalf = isAnticipoPaid || (Number(fac.montoCobrado) >= anticipoMonto);
    if (isPaidFull) {
      montoCobrado = finalTotal;
      saldoPendiente = 0;
      estado = 'cobrada';
    } else if (isPaidHalf) {
      montoCobrado = anticipoMonto;
      saldoPendiente = Math.max(0, finalTotal - anticipoMonto);
      estado = 'parcial';
    } else {
      montoCobrado = Number(fac.montoCobrado) || 0;
      saldoPendiente = Math.max(0, finalTotal - montoCobrado);
      estado = montoCobrado >= finalTotal ? 'cobrada' : (montoCobrado > 0 ? 'parcial' : 'pendiente');
    }
    concepto = `${prop.titulo || 'Propuesta Digital VIP'} ${prop.subtitulo || ''}`.trim();
    items = [
      {
        id: 'item-1',
        descripcion: prop.portada?.proyecto
          ? `${prop.titulo || 'Solución Web Corporativa VIP'}: ${prop.portada.proyecto}`
          : (modulosNombres
              ? `${prop.titulo || 'Desarrollo Digital VIP'} (Entregables: ${modulosNombres})`
              : (prop.titulo || fac.concepto || 'Desarrollo de Sistema Digital Web & Posicionamiento IA')),
        cantidad: 1,
        precioUnitario: finalTotal,
        total: finalTotal
      }
    ];
  }

  return {
    ...fac,
    tipoHito: isSaldo ? 'saldo' : (isAnticipo ? 'anticipo' : (fac.tipoHito || 'total')),
    presupuestoId: prop.id || fac.presupuestoId,
    codigoPresupuesto: prop.codigo || fac.codigoPresupuesto,
    cliente: {
      ...fac.cliente,
      empresa: prop.cliente?.empresa || fac.cliente?.empresa || 'Cliente de Agencia',
      contacto: prop.cliente?.nombre || fac.cliente?.contacto || 'Director',
      email: prop.cliente?.email || fac.cliente?.email || '',
      telefono: prop.cliente?.telefono || fac.cliente?.telefono || '',
      identificacion: prop.cliente?.identificacion || fac.cliente?.identificacion || 'ID Fiscal Comercial',
      pais
    },
    concepto,
    subtotal: finalSubtotal,
    total: finalTotal,
    montoCobrado,
    saldoPendiente,
    estado,
    habilitadaCliente: estado === 'cobrada' || fac.habilitadaCliente === true,
    items
  };
}

/**
 * Genera el par de facturas comerciales por hito (Anticipo 50% y Saldo Final 50%)
 * para un proyecto o presupuesto bajo el estándar B2B de Goglite Agency Suite.
 */
export function buildMilestoneInvoices(propOrProj, existingFacturasCount = 0, configuracion = DEFAULT_CONFIGURACION) {
  if (!propOrProj) return [];

  const subtotalTotal = Number(propOrProj.contrato?.totalInversion) || Number(propOrProj.inversion?.precioTotal) || 300;
  const anticipoMonto = Number(propOrProj.pagos?.anticipoMonto) || Number(propOrProj.inversion?.anticipo) || Math.round(subtotalTotal * 0.5);
  const saldoMonto = Number(propOrProj.pagos?.saldoMonto) || (subtotalTotal - anticipoMonto);

  const pais = propOrProj.pais || (propOrProj.cliente?.ubicacion?.toLowerCase().includes('dominicana') ? 'DO' : 'SV');
  const projId = propOrProj.id || propOrProj.proyectoId || Date.now();
  const presId = propOrProj.presupuestoId || (propOrProj.inversion ? propOrProj.id : null);
  const projCode = propOrProj.codigo || propOrProj.presupuestoCodigo || `CON-2026-${String(existingFacturasCount + 1).padStart(3, '0')}`;
  const presCode = propOrProj.presupuestoCodigo || propOrProj.codigo || `P-2026-${String(existingFacturasCount + 1).padStart(3, '0')}`;

  const cleanModuleTitle = (t) => (t || '')
    .replace(/\s*\(\$\s*[\d,]+(?:\.\d+)?\s*USD\)/gi, '')
    .replace(/\s*\(\$\s*[\d,]+(?:\.\d+)?\)/gi, '')
    .trim();

  const modulosNombres = Array.isArray(propOrProj.modulos || propOrProj.contrato?.modulos) && (propOrProj.modulos || propOrProj.contrato?.modulos).length > 0
    ? (propOrProj.modulos || propOrProj.contrato?.modulos).map(m => `${m.numero ? m.numero + ': ' : ''}${cleanModuleTitle(m.titulo)}`).join(' · ')
    : '';

  const itemDescripcion = propOrProj.portada?.proyecto
    ? `${propOrProj.titulo || 'Solución Web Corporativa VIP'}: ${propOrProj.portada.proyecto}`
    : (modulosNombres
        ? `${propOrProj.titulo || 'Desarrollo Digital VIP'} (${modulosNombres})`
        : (propOrProj.titulo || propOrProj.contrato?.alcanceResumen || 'Desarrollo de Sistema Digital Web & Posicionamiento IA'));

  const horasEstimadas = Math.max(5, Math.round(subtotalTotal / 50));
  const today = new Date().toISOString().split('T')[0];
  const due = new Date(Date.now() + (Number(propOrProj.vigenciaDias) || 15) * 86400000).toISOString().split('T')[0];

  const metodoPago = (() => {
    const c = normalizeCuentasBancarias(configuracion?.cuentasBancarias);
    const m = c.find(item => item.pais === pais && item.activa && item.predeterminada) || c.find(item => item.pais === pais && item.activa) || c[0];
    return m?.banco || 'Transferencia Bancaria';
  })();

  const cuentaBancariaId = (() => {
    const c = normalizeCuentasBancarias(configuracion?.cuentasBancarias);
    const m = c.find(item => item.pais === pais && item.activa && item.predeterminada) || c.find(item => item.pais === pais && item.activa) || c[0];
    return m?.id || null;
  })();

  const isAnticipoPaid = propOrProj.pagos?.anticipoEstado === 'confirmado' || propOrProj.anticipoPagado === true;
  const isSaldoPaid = propOrProj.pagos?.saldoEstado === 'confirmado' || propOrProj.portalConfig?.fase4Liquidada === true || propOrProj.portalConfig?.liquidacionPagada === true;

  const num1 = String(existingFacturasCount + 1).padStart(3, '0');
  const num2 = String(existingFacturasCount + 2).padStart(3, '0');

  const facAnticipo = {
    id: `fac-${projId}-anticipo`,
    numeroFactura: `FAC-2026-${num1}`,
    tipoHito: 'anticipo',
    presupuestoId: presId,
    codigoPresupuesto: presCode,
    proyectoId: `proj-${projId}`,
    codigoProyecto: projCode,
    origenModulo: `Módulo 4 · Contrato ${projCode} (Anticipo 50%)`,
    cliente: {
      empresa: propOrProj.cliente?.empresa || 'Cliente de Agencia',
      contacto: propOrProj.cliente?.nombre || propOrProj.cliente?.contacto || 'Director',
      email: propOrProj.cliente?.email || '',
      telefono: propOrProj.cliente?.telefono || '',
      identificacion: propOrProj.cliente?.identificacion || 'ID Fiscal Comercial',
      pais
    },
    concepto: `Anticipo Inicial (50%) · ${cleanModuleTitle(propOrProj.titulo || propOrProj.contrato?.alcanceResumen || 'Desarrollo Web VIP')}`,
    fechaEmision: propOrProj.pagos?.anticipoFecha || today,
    fechaVencimiento: due,
    subtotal: anticipoMonto,
    impuestoPorcentaje: 0,
    impuestoTotal: 0,
    total: anticipoMonto,
    moneda: propOrProj.moneda || 'USD',
    montoCobrado: isAnticipoPaid ? anticipoMonto : 0,
    saldoPendiente: isAnticipoPaid ? 0 : anticipoMonto,
    estado: isAnticipoPaid ? 'cobrada' : 'pendiente',
    habilitadaCliente: isAnticipoPaid,
    metodoPago,
    cuentaBancariaId,
    horasInvertidasEstimadas: Math.round(horasEstimadas / 2),
    items: [
      {
        id: 'item-anticipo',
        descripcion: `Anticipo Inicial (50%) - Inicio de Desarrollo Web VIP, Estructura & Setup Técnico (${itemDescripcion})`,
        cantidad: 1,
        precioUnitario: anticipoMonto,
        total: anticipoMonto
      }
    ]
  };

  const facSaldo = {
    id: `fac-${projId}-saldo`,
    numeroFactura: `FAC-2026-${num2}`,
    tipoHito: 'saldo',
    presupuestoId: presId,
    codigoPresupuesto: presCode,
    proyectoId: `proj-${projId}`,
    codigoProyecto: projCode,
    origenModulo: `Módulo 4 · Contrato ${projCode} (Saldo 50%)`,
    cliente: { ...facAnticipo.cliente },
    concepto: `Saldo Final & Liquidación de Cierre (50%) · ${cleanModuleTitle(propOrProj.titulo || propOrProj.contrato?.alcanceResumen || 'Desarrollo Web VIP')}`,
    fechaEmision: propOrProj.pagos?.saldoFecha || today,
    fechaVencimiento: due,
    subtotal: saldoMonto,
    impuestoPorcentaje: 0,
    impuestoTotal: 0,
    total: saldoMonto,
    moneda: propOrProj.moneda || 'USD',
    montoCobrado: isSaldoPaid ? saldoMonto : 0,
    saldoPendiente: isSaldoPaid ? 0 : saldoMonto,
    estado: isSaldoPaid ? 'cobrada' : 'pendiente',
    habilitadaCliente: isSaldoPaid,
    metodoPago,
    cuentaBancariaId,
    horasInvertidasEstimadas: Math.round(horasEstimadas / 2),
    items: [
      {
        id: 'item-saldo',
        descripcion: `Saldo Final & Liquidación de Cierre (50%) - Entrega Oficial, Despliegue en Producción & Cesión de Accesos (${itemDescripcion})`,
        cantidad: 1,
        precioUnitario: saldoMonto,
        total: saldoMonto
      }
    ]
  };

  return [facAnticipo, facSaldo];
}

/**
 * Reconcilia la lista de facturas en memoria y localStorage para asegurar que
 * cualquier proyecto con esquema de pagos (Anticipo 50% + Cierre 50%) tenga sus
 * dos facturas individuales e independientes en el historial del cliente.
 */
export function reconcileMilestoneInvoices(currentFacturas = [], configuracion = DEFAULT_CONFIGURACION, proyectos = [], presupuestos = []) {
  if (!Array.isArray(currentFacturas)) return [];

  let facturas = [...currentFacturas];
  let modified = false;

  const getNextInvoiceNum = (existingList) => {
    let maxNum = 0;
    existingList.forEach(f => {
      const m = (f.numeroFactura || '').match(/FAC-\d{4}-(\d+)/);
      if (m && m[1]) {
        const n = parseInt(m[1], 10);
        if (n > maxNum) maxNum = n;
      }
    });
    return String(Math.max(maxNum + 1, existingList.length + 1)).padStart(3, '0');
  };

  // 1. Reconciliar contra proyectos en goglite_proyectos
  if (Array.isArray(proyectos)) {
    proyectos.forEach(proj => {
      if (!proj) return;
      const projEmp = (proj.cliente?.empresa || '').toLowerCase().trim();
      const projId = proj.id;
      const projCode = proj.codigo || proj.presupuestoCodigo;
      const presId = proj.presupuestoId;

      const totalInversion = Number(proj.contrato?.totalInversion) || 300;
      const anticipoMonto = Number(proj.pagos?.anticipoMonto) || Math.round(totalInversion * 0.5);
      const saldoMonto = Number(proj.pagos?.saldoMonto) || (totalInversion - anticipoMonto);
      const isAnticipoPaid = proj.pagos?.anticipoEstado === 'confirmado' || proj.pagos?.anticipoEstado === 'verificacion' || proj.portalConfig?.anticipoConfirmadoAgencia || proj.portalConfig?.facturaAnticipoHabilitada;
      const isSaldoPaid = proj.pagos?.saldoEstado === 'confirmado' || proj.pagos?.saldoEstado === 'verificacion' || proj.portalConfig?.liquidacionReportada || proj.portalConfig?.fase4Liquidada || proj.portalConfig?.liquidacionPagada || proj.portalConfig?.saldoConfirmadoAgencia || Boolean(proj.portalConfig?.comprobanteLiquidacion);

      const cleanTitle = (proj.contrato?.alcanceResumen || proj.titulo || 'Desarrollo Digital VIP')
        .replace(/\s*\(\$\s*[\d,]+(?:\.\d+)?\s*USD\)/gi, '')
        .replace(/\s*\(\$\s*[\d,]+(?:\.\d+)?\)/gi, '')
        .trim();

      const matched = facturas.filter(f => {
        if (projId && (f.proyectoId === projId || f.id === `fac-${projId}` || f.id.startsWith(`fac-${projId}`))) return true;
        if (presId && f.presupuestoId === presId) return true;
        if (projCode && (f.codigoProyecto === projCode || f.codigoPresupuesto === projCode)) return true;
        if (projEmp && f.cliente?.empresa && f.cliente.empresa.toLowerCase().trim() === projEmp) return true;
        return false;
      });

      if (matched.length === 1) {
        // Había 1 sola factura monolítica (el caso exacto del usuario): la dividimos en Anticipo y Saldo
        const f1 = matched[0];
        const f1Idx = facturas.findIndex(f => f.id === f1.id);

        const updatedF1 = {
          ...f1,
          tipoHito: 'anticipo',
          subtotal: anticipoMonto,
          total: anticipoMonto,
          montoCobrado: isAnticipoPaid ? anticipoMonto : Math.min(anticipoMonto, Number(f1.montoCobrado) || 0),
          saldoPendiente: isAnticipoPaid ? 0 : Math.max(0, anticipoMonto - (Number(f1.montoCobrado) || 0)),
          estado: (isAnticipoPaid || Number(f1.montoCobrado) >= anticipoMonto) ? 'cobrada' : 'pendiente',
          habilitadaCliente: Boolean(isAnticipoPaid || Number(f1.montoCobrado) >= anticipoMonto),
          concepto: f1.concepto?.includes('Anticipo') ? f1.concepto : `Anticipo Inicial (50%) · ${cleanTitle || f1.concepto || 'Desarrollo Web VIP'}`,
          origenModulo: `Módulo 4 · Contrato ${projCode || ''} (Anticipo 50%)`,
          items: [
            {
              id: 'item-anticipo',
              descripcion: `Anticipo Inicial (50%) - Inicio de Desarrollo Web VIP (${cleanTitle})`,
              cantidad: 1,
              precioUnitario: anticipoMonto,
              total: anticipoMonto
            }
          ]
        };
        if (f1Idx >= 0) facturas[f1Idx] = updatedF1;

        const num2 = getNextInvoiceNum(facturas);
        const facSaldo = {
          id: `${f1.id}-saldo`,
          numeroFactura: `FAC-2026-${num2}`,
          tipoHito: 'saldo',
          proyectoId: f1.proyectoId || projId,
          codigoProyecto: f1.codigoProyecto || projCode,
          presupuestoId: f1.presupuestoId || presId,
          codigoPresupuesto: f1.codigoPresupuesto || proj.presupuestoCodigo || projCode,
          origenModulo: `Módulo 4 · Contrato ${projCode || ''} (Saldo 50%)`,
          cliente: { ...f1.cliente },
          concepto: `Saldo Final & Liquidación de Cierre (50%) · ${cleanTitle}`,
          fechaEmision: proj.pagos?.saldoFecha || f1.fechaEmision || new Date().toISOString().split('T')[0],
          fechaVencimiento: f1.fechaVencimiento || new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0],
          subtotal: saldoMonto,
          impuestoPorcentaje: 0,
          impuestoTotal: 0,
          total: saldoMonto,
          moneda: f1.moneda || 'USD',
          montoCobrado: (isSaldoPaid || Number(f1.montoCobrado) >= totalInversion) ? saldoMonto : 0,
          saldoPendiente: (isSaldoPaid || Number(f1.montoCobrado) >= totalInversion) ? 0 : saldoMonto,
          estado: (isSaldoPaid || Number(f1.montoCobrado) >= totalInversion) ? 'cobrada' : 'pendiente',
          habilitadaCliente: Boolean(isSaldoPaid || Number(f1.montoCobrado) >= totalInversion),
          metodoPago: f1.metodoPago || 'Transferencia Bancaria',
          cuentaBancariaId: f1.cuentaBancariaId,
          horasInvertidasEstimadas: f1.horasInvertidasEstimadas || 10,
          items: [
            {
              id: 'item-saldo',
              descripcion: `Saldo Final & Liquidación de Cierre (50%) - Entrega Oficial & Despliegue en Producción (${cleanTitle})`,
              cantidad: 1,
              precioUnitario: saldoMonto,
              total: saldoMonto
            }
          ]
        };
        facturas.push(facSaldo);
        modified = true;
      } else if (matched.length >= 2) {
        // Ya existen 2 o más facturas: sincronizar estados de cobro con pagos del proyecto
        matched.forEach(fac => {
          const idx = facturas.findIndex(f => f.id === fac.id);
          if (idx < 0) return;
          const isSaldo = fac.tipoHito === 'saldo' || fac.id.endsWith('-saldo') || fac.concepto?.toLowerCase().includes('saldo') || fac.concepto?.toLowerCase().includes('liquidaci');
          const isAnticipo = fac.tipoHito === 'anticipo' || fac.id.endsWith('-anticipo') || fac.concepto?.toLowerCase().includes('anticipo') || !isSaldo;

          if (isSaldo) {
            const shouldBePaid = isSaldoPaid || fac.estado === 'cobrada' || (Number(fac.montoCobrado) >= saldoMonto);
            if (fac.subtotal !== saldoMonto || fac.total !== saldoMonto || (shouldBePaid && (fac.estado !== 'cobrada' || fac.saldoPendiente !== 0))) {
              facturas[idx] = {
                ...fac,
                tipoHito: 'saldo',
                subtotal: saldoMonto,
                total: saldoMonto,
                montoCobrado: shouldBePaid ? saldoMonto : Math.min(saldoMonto, Number(fac.montoCobrado) || 0),
                saldoPendiente: shouldBePaid ? 0 : Math.max(0, saldoMonto - (Number(fac.montoCobrado) || 0)),
                estado: shouldBePaid ? 'cobrada' : ((Number(fac.montoCobrado) || 0) > 0 ? 'parcial' : 'pendiente'),
                habilitadaCliente: shouldBePaid || fac.habilitadaCliente === true
              };
              modified = true;
            }
          } else if (isAnticipo) {
            const shouldBePaid = isAnticipoPaid || fac.estado === 'cobrada' || (Number(fac.montoCobrado) >= anticipoMonto);
            if (fac.subtotal !== anticipoMonto || fac.total !== anticipoMonto || (shouldBePaid && (fac.estado !== 'cobrada' || fac.saldoPendiente !== 0))) {
              facturas[idx] = {
                ...fac,
                tipoHito: 'anticipo',
                subtotal: anticipoMonto,
                total: anticipoMonto,
                montoCobrado: shouldBePaid ? anticipoMonto : Math.min(anticipoMonto, Number(fac.montoCobrado) || 0),
                saldoPendiente: shouldBePaid ? 0 : Math.max(0, anticipoMonto - (Number(fac.montoCobrado) || 0)),
                estado: shouldBePaid ? 'cobrada' : ((Number(fac.montoCobrado) || 0) > 0 ? 'parcial' : 'pendiente'),
                habilitadaCliente: shouldBePaid || fac.habilitadaCliente === true
              };
              modified = true;
            }
          }
        });
      }
    });
  }

  // 2. Reconciliar también presupuestos aceptados si no están en proyectos
  if (Array.isArray(presupuestos)) {
    presupuestos.forEach(prop => {
      if (prop.estado !== 'aceptado') return;
      const propEmp = (prop.cliente?.empresa || '').toLowerCase().trim();
      const matched = facturas.filter(f => 
        (prop.id && f.presupuestoId === prop.id) ||
        (prop.codigo && f.codigoPresupuesto === prop.codigo) ||
        (propEmp && f.cliente?.empresa && f.cliente.empresa.toLowerCase().trim() === propEmp)
      );

      if (matched.length === 1 && (Number(matched[0].total) > (Number(prop.inversion?.anticipo) || 150))) {
        // Monolítica: dividirla
        const f1 = matched[0];
        const f1Idx = facturas.findIndex(f => f.id === f1.id);
        const subtotalTotal = Number(prop.inversion?.precioTotal) || Number(f1.total) || 300;
        const anticipoMonto = Number(prop.inversion?.anticipo) || Math.round(subtotalTotal * 0.5);
        const saldoMonto = subtotalTotal - anticipoMonto;

        const updatedF1 = {
          ...f1,
          tipoHito: 'anticipo',
          subtotal: anticipoMonto,
          total: anticipoMonto,
          concepto: `Anticipo Inicial (50%) · ${f1.concepto.replace(/^Anticipo Inicial \(50%\) · /i, '')}`,
          items: [{ id: 'item-anticipo', descripcion: `Anticipo Inicial (50%) - ${f1.items?.[0]?.descripcion || 'Desarrollo Web VIP'}`, cantidad: 1, precioUnitario: anticipoMonto, total: anticipoMonto }]
        };
        if (f1Idx >= 0) facturas[f1Idx] = updatedF1;

        const num2 = getNextInvoiceNum(facturas);
        const facSaldo = {
          ...f1,
          id: `${f1.id}-saldo`,
          numeroFactura: `FAC-2026-${num2}`,
          tipoHito: 'saldo',
          concepto: `Saldo Final & Liquidación de Cierre (50%) · ${f1.concepto.replace(/^Anticipo Inicial \(50%\) · /i, '')}`,
          subtotal: saldoMonto,
          total: saldoMonto,
          montoCobrado: (Number(f1.montoCobrado) >= subtotalTotal) ? saldoMonto : 0,
          saldoPendiente: (Number(f1.montoCobrado) >= subtotalTotal) ? 0 : saldoMonto,
          estado: (Number(f1.montoCobrado) >= subtotalTotal) ? 'cobrada' : 'pendiente',
          items: [{ id: 'item-saldo', descripcion: `Saldo Final & Liquidación de Cierre (50%) - Entrega Oficial & Despliegue`, cantidad: 1, precioUnitario: saldoMonto, total: saldoMonto }]
        };
        facturas.push(facSaldo);
        modified = true;
      }
    });
  }

  if (modified) {
    try {
      saveAppStateCloud('finanzas_v1', 'finanzas', { facturas }).catch(() => {});
    } catch (e) {}
  }

  return facturas;
}

/**
 * Imprime un documento HTML corporativo a través de un iframe invisible in-place.
 * Elimina la necesidad de abrir pestañas emergentes en blanco en el navegador y
 * suprime de forma automática los encabezados y pies de página molestos (URL, fecha, título).
 */
export function printHtmlViaHiddenIframe(htmlContent) {
  if (typeof window === 'undefined') return;

  // 1. Limpiar iframe previo si aún existiera
  const prevFrame = document.getElementById('goglite-silent-print-frame');
  if (prevFrame) {
    try { prevFrame.remove(); } catch (e) {}
  }

  // 2. Crear iframe aislado oculto
  const iframe = document.createElement('iframe');
  iframe.id = 'goglite-silent-print-frame';
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  iframe.style.opacity = '0';
  iframe.style.pointerEvents = 'none';
  iframe.style.zIndex = '-9999';

  document.body.appendChild(iframe);

  const doc = iframe.contentDocument || iframe.contentWindow?.document;

  if (!doc) {
    // Fallback de contingencia si el navegador bloquea manipulación de iframe dinámico
    const fallbackWin = window.open('', '_blank');
    if (fallbackWin) {
      fallbackWin.document.write(htmlContent);
      fallbackWin.document.close();
      fallbackWin.focus();
      setTimeout(() => fallbackWin.print(), 350);
    }
    return;
  }

  doc.open();
  doc.write(htmlContent);
  doc.close();

  // 3. Disparar impresión nativa tan pronto los estilos e imágenes se rendericen
  setTimeout(() => {
    try {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    } catch (err) {
      console.warn('[Print] Error disparando impresión silenciosa en iframe:', err);
      window.print();
    } finally {
      // 4. Limpieza del DOM posterior a la interacción del usuario
      setTimeout(() => {
        try {
          const toRemove = document.getElementById('goglite-silent-print-frame');
          if (toRemove) toRemove.remove();
        } catch (e) {}
      }, 4000);
    }
  }, 400);
}

/**
 * Generador de Factura Comercial HTML/PDF Autosuficiente (Skill: automated-html-invoice)
 * Sigue estrictamente la paleta corporativa (#FF6B00, #1A1A1A, #FAFAFA)
 */
export function buildCorporateInvoiceHtml(invoice, configuracion = DEFAULT_CONFIGURACION) {
  const emisorRaw = configuracion?.emisor || DEFAULT_CONFIGURACION.emisor;
  const storedLogoDocs = typeof window !== 'undefined' ? localStorage.getItem('goglite_agency_logo_docs') : null;
  const storedLogo = typeof window !== 'undefined' ? localStorage.getItem('goglite_agency_logo') : null;
  const docLogo = configuracion?.emisor?.logoDocumentosUrl 
    || configuracion?.logoDocumentosUrl 
    || storedLogoDocs 
    || emisorRaw?.logoUrl 
    || configuracion?.logoUrl 
    || storedLogo 
    || DEFAULT_AGENCY_BRANDING.logoUrl;

  const emisor = {
    ...DEFAULT_CONFIGURACION.emisor,
    ...emisorRaw,
    empresa: emisorRaw?.empresa || configuracion?.nombreAgencia || DEFAULT_CONFIGURACION.emisor.empresa,
    subtitulo: emisorRaw?.subtitulo || configuracion?.eslogan || DEFAULT_CONFIGURACION.emisor.subtitulo,
    logoUrl: docLogo,
    logoDocumentosUrl: docLogo,
    identificacion: emisorRaw?.identificacion || 'NIT / RNC: 0614-290390-102-1',
    email: emisorRaw?.email || configuracion?.emailContacto || DEFAULT_CONFIGURACION.emisor.email,
    telefono: emisorRaw?.telefono || configuracion?.telefonoWhatsapp || DEFAULT_CONFIGURACION.emisor.telefono,
    ubicacion: emisorRaw?.ubicacion || configuracion?.ubicacionPrincipal || DEFAULT_CONFIGURACION.emisor.ubicacion
  };
  const pais = invoice.cliente?.pais || 'SV';

  const isSaldo = invoice.tipoHito === 'saldo' || invoice.id?.endsWith('-saldo') || invoice.concepto?.toLowerCase().includes('saldo') || invoice.concepto?.toLowerCase().includes('liquidaci');
  const isAnticipo = invoice.tipoHito === 'anticipo' || invoice.id?.endsWith('-anticipo') || invoice.concepto?.toLowerCase().includes('anticipo');

  const estadoLabel = invoice.estado === 'cobrada'
    ? (isSaldo ? 'PAGADA 100% · LIQUIDACIÓN' : (isAnticipo ? 'PAGADA 100% · ANTICIPO' : 'PAGADA 100%'))
    : invoice.estado === 'parcial'
    ? (Number(invoice.montoCobrado) === Math.round(Number(invoice.total) * 0.5)
        ? 'ANTICIPO COBRADO (50%)'
        : `ABONO PARCIAL ($${Number(invoice.montoCobrado || 0).toLocaleString()} USD)`)
    : (isSaldo ? 'PENDIENTE DE LIQUIDACIÓN' : 'PENDIENTE DE PAGO');

  const badgeBg = invoice.estado === 'cobrada' ? '#DCFCE7' : '#FFF0E6';
  const badgeColor = invoice.estado === 'cobrada' ? '#15803D' : '#FF6B00';
  const cobradoLabel = isSaldo ? 'Monto Liquidado / Cobrado:' : (isAnticipo ? 'Monto Anticipo Cobrado:' : 'Monto Cobrado / Anticipo:');

  const rowsHtml = (invoice.items || []).map((item, idx) => `
    <tr style="background: ${idx % 2 === 1 ? '#FAFAFA' : '#FFFFFF'};">
      <td style="padding: 12px 14px; font-size: 13px; border-bottom: 1px solid #EEEEEE; color: #1A1A1A; font-weight: 500;">
        ${item.descripcion || 'Servicio Digital'}
      </td>
      <td style="padding: 12px 14px; font-size: 13px; border-bottom: 1px solid #EEEEEE; text-align: center; font-family: monospace;">
        ${item.cantidad || 1}
      </td>
      <td style="padding: 12px 14px; font-size: 13px; border-bottom: 1px solid #EEEEEE; text-align: right; font-family: monospace;">
        $${Number(item.precioUnitario || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })} USD
      </td>
      <td style="padding: 12px 14px; font-size: 13px; border-bottom: 1px solid #EEEEEE; text-align: right; font-family: monospace; font-weight: 700; color: #1A1A1A;">
        $${Number(item.total || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })} USD
      </td>
    </tr>
  `).join('');

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Factura ${invoice.numeroFactura} - ${invoice.cliente?.empresa || 'Goglite'}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Inter, Roboto, sans-serif; }
    body { background-color: #FAFAFA; color: #1A1A1A; padding: 24px 20px; display: flex; justify-content: center; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .invoice-card { background: #FFFFFF; width: 100%; max-width: 820px; padding: 40px; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.06); border: 1px solid #EBEBEB; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; padding-bottom: 20px; border-bottom: 2px solid #1A1A1A; }
    .brand-box { display: flex; align-items: center; gap: 14px; }
    .brand-badge { width: 44px; height: 44px; border-radius: 10px; background: #FF6B00; color: #FFFFFF; display: flex; align-items: center; justify-content: center; font-size: 22px; font-weight: 900; }
    .logo { font-size: 22px; font-weight: 900; color: #1A1A1A; text-transform: uppercase; letter-spacing: -0.5px; }
    .logo span { color: #FF6B00; }
    .brand-sub { font-size: 12px; color: #555555; margin-top: 2px; }
    .invoice-meta { text-align: right; }
    .invoice-label { font-size: 11px; text-transform: uppercase; letter-spacing: 1.2px; color: #888888; font-weight: 700; }
    .invoice-title { font-size: 24px; font-weight: 900; color: #FF6B00; font-family: monospace; margin-top: 2px; }
    .status-badge { display: inline-block; padding: 5px 12px; background: ${badgeBg}; color: ${badgeColor}; font-size: 11px; font-weight: 800; border-radius: 20px; margin-top: 6px; letter-spacing: 0.5px; }
    .parties { display: flex; justify-content: space-between; gap: 24px; margin-bottom: 24px; }
    .party-col { flex: 1; background: #FAFAFA; padding: 16px 18px; border-radius: 10px; border: 1px solid #EEEEEE; }
    .party-title { font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: #FF6B00; font-weight: 800; margin-bottom: 6px; }
    .party-name { font-size: 14.5px; font-weight: 800; color: #1A1A1A; margin-bottom: 3px; }
    .party-detail { font-size: 12px; color: #555555; line-height: 1.5; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 24px; page-break-inside: avoid; }
    th { background: #1A1A1A; color: #FFFFFF; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.6px; padding: 11px 14px; text-align: left; }
    .totals-wrapper { display: flex; justify-content: flex-end; margin-bottom: 20px; page-break-inside: avoid; }
    .totals-box { width: 320px; background: #FAFAFA; padding: 16px 18px; border-radius: 10px; border: 1px solid #EEEEEE; }
    .totals-row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 13px; color: #555555; }
    .totals-row.final { border-top: 2px solid #1A1A1A; color: #1A1A1A; font-size: 16px; font-weight: 900; padding-top: 10px; margin-top: 4px; }
    .totals-row.final span.highlight { color: #FF6B00; font-family: monospace; }
    @media print {
      @page {
        size: letter portrait;
        margin: 0 !important;
      }
      html, body {
        background: #FFFFFF !important;
        padding: 0 !important;
        margin: 0 !important;
        width: 100% !important;
        height: 100% !important;
        overflow: hidden !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      .invoice-card {
        box-shadow: none !important;
        border: none !important;
        padding: 0.45in 0.55in !important;
        width: 8.5in !important;
        max-width: 8.5in !important;
        box-sizing: border-box !important;
        margin: 0 auto !important;
        page-break-inside: avoid !important;
        break-inside: avoid !important;
      }
      table, .totals-wrapper {
        page-break-inside: avoid !important;
        break-inside: avoid !important;
      }
    }
  </style>
</head>
<body>
  <div class="invoice-card">
    <div class="header">
      <div class="brand-box" style="display: flex; align-items: center; gap: 14px;">
        ${emisor.logoUrl ? `
          <img src="${emisor.logoUrl}" alt="${emisor.empresa}" style="max-height: 48px; max-width: 175px; object-fit: contain;" />
        ` : `
          <div class="brand-badge">${(emisor.empresa || 'G').charAt(0)}</div>
        `}
        <div>
          <div class="logo" style="font-size: 19px; font-weight: 900; color: #1A1A1A; text-transform: uppercase; letter-spacing: -0.5px;">${emisor.empresa}</div>
          <div class="brand-sub">${emisor.subtitulo}</div>
          <div class="brand-sub">${emisor.ubicacion}</div>
        </div>
      </div>
      <div class="invoice-meta">
        <div class="invoice-label">FACTURA COMERCIAL / PROFORMA</div>
        <div class="invoice-title">${invoice.numeroFactura}</div>
        <div class="brand-sub" style="margin-top:4px;">Emisión: <strong>${invoice.fechaEmision}</strong> · Vence: <strong>${invoice.fechaVencimiento}</strong></div>
        <div class="status-badge">${estadoLabel}</div>
      </div>
    </div>

    <div class="parties">
      <div class="party-col">
        <div class="party-title">DE (EMISOR):</div>
        <div class="party-name">${emisor.empresa}</div>
        <div class="party-detail">
          ${emisor.identificacion}<br/>
          ${emisor.email}<br/>
          Tel: ${emisor.telefono}<br/>
          ${emisor.ubicacion}
        </div>
      </div>
      <div class="party-col">
        <div class="party-title">PARA (CLIENTE):</div>
        <div class="party-name">${invoice.cliente?.empresa || 'Cliente'}</div>
        <div class="party-detail">
          Atención: ${invoice.cliente?.contacto || 'Dirección General'}<br/>
          ${invoice.cliente?.identificacion || 'ID Comercial'}<br/>
          ${invoice.cliente?.email ? invoice.cliente.email + ' · ' : ''}${invoice.cliente?.telefono || ''}<br/>
          Región: ${pais === 'DO' ? 'República Dominicana' : 'El Salvador'}
        </div>
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th>Descripción del Servicio / Entregable</th>
          <th style="text-align: center;">Cant.</th>
          <th style="text-align: right;">Precio Unitario</th>
          <th style="text-align: right;">Subtotal</th>
        </tr>
      </thead>
      <tbody>
        ${rowsHtml}
      </tbody>
    </table>

    <div class="totals-wrapper">
      <div class="totals-box">
        <div class="totals-row">
          <span>Subtotal Neto:</span>
          <span style="font-family: monospace; font-weight: 700;">$${Number(invoice.subtotal || invoice.total || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })} USD</span>
        </div>
        <div class="totals-row">
          <span>Impuestos (${invoice.impuestoPorcentaje || 0}%):</span>
          <span style="font-family: monospace;">$${Number(invoice.impuestoTotal || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })} USD</span>
        </div>
        <div class="totals-row final">
          <span>Total Factura:</span>
          <span class="highlight">$${Number(invoice.total || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })} USD</span>
        </div>
        <div class="totals-row" style="color: #15803D; font-weight: 700; padding-top: 8px;">
          <span>${cobradoLabel}</span>
          <span style="font-family: monospace;">$${Number(invoice.montoCobrado || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })} USD</span>
        </div>
        <div class="totals-row" style="color: #D97706; font-weight: 800; border-top: 1px solid #E5E7EB; padding-top: 6px;">
          <span>Saldo Pendiente:</span>
          <span style="font-family: monospace;">$${Number(invoice.saldoPendiente ?? Math.max(0, (invoice.total || 0) - (invoice.montoCobrado || 0))).toLocaleString('en-US', { minimumFractionDigits: 2 })} USD</span>
        </div>
      </div>
    </div>

    <div style="margin-top: 24px; padding-top: 14px; border-top: 1px solid #E5E7EB; display: flex; justify-content: space-between; align-items: center; font-size: 11px; color: #888888;">
      <span>Documento comercial generado electrónicamente · Goglite Agency Suite</span>
      <span style="font-family: monospace; font-weight: 700; color: #555555;">Página 1 de 1 · ${invoice.numeroFactura || ''}</span>
    </div>
  </div>
</body>
</html>`;
}

/**
 * Componente A4 de Factura Corporativa Oficial (Goglite Studio)
 * Reutilizable en Split-View, Modal y Portal del Cliente con 0 discrepancias visuales.
 */
export function CorporateInvoiceDocument({ invoice, configuracion = DEFAULT_CONFIGURACION }) {
  if (!invoice) return null;
  const emisorRaw = configuracion?.emisor || DEFAULT_CONFIGURACION.emisor;
  const storedLogoDocs = typeof window !== 'undefined' ? localStorage.getItem('goglite_agency_logo_docs') : null;
  const storedLogo = typeof window !== 'undefined' ? localStorage.getItem('goglite_agency_logo') : null;
  const docLogo = configuracion?.emisor?.logoDocumentosUrl 
    || configuracion?.logoDocumentosUrl 
    || storedLogoDocs 
    || emisorRaw?.logoUrl 
    || configuracion?.logoUrl 
    || storedLogo 
    || DEFAULT_AGENCY_BRANDING.logoUrl;

  const emisor = {
    ...DEFAULT_CONFIGURACION.emisor,
    ...emisorRaw,
    empresa: emisorRaw?.empresa || configuracion?.nombreAgencia || DEFAULT_CONFIGURACION.emisor.empresa,
    subtitulo: emisorRaw?.subtitulo || configuracion?.eslogan || DEFAULT_CONFIGURACION.emisor.subtitulo,
    logoUrl: docLogo,
    logoDocumentosUrl: docLogo,
    identificacion: emisorRaw?.identificacion || 'NIT / RNC: 0614-290390-102-1',
    email: emisorRaw?.email || configuracion?.emailContacto || DEFAULT_CONFIGURACION.emisor.email,
    telefono: emisorRaw?.telefono || configuracion?.telefonoWhatsapp || DEFAULT_CONFIGURACION.emisor.telefono,
    ubicacion: emisorRaw?.ubicacion || configuracion?.ubicacionPrincipal || DEFAULT_CONFIGURACION.emisor.ubicacion
  };

  const isSaldo = invoice.tipoHito === 'saldo' || invoice.id?.endsWith('-saldo') || invoice.concepto?.toLowerCase().includes('saldo') || invoice.concepto?.toLowerCase().includes('liquidaci');
  const isAnticipo = invoice.tipoHito === 'anticipo' || invoice.id?.endsWith('-anticipo') || invoice.concepto?.toLowerCase().includes('anticipo');

  const cobradoLabel = isSaldo ? 'Monto Liquidado / Cobrado:' : (isAnticipo ? 'Monto Anticipo Cobrado:' : 'Monto Cobrado / Anticipo:');

  return (
    <div className="printable-invoice-document bg-white p-6 sm:p-8 rounded-xl border border-[#EBEBEB] shadow-sm space-y-6 text-[#1A1A1A] font-sans print:border-none print:shadow-none print:p-0 print:m-0 print:w-full">
      {/* 1. Header de Factura */}
      <div className="flex flex-col sm:flex-row items-start justify-between gap-4 pb-5 border-b-2 border-[#1A1A1A]">
        <div className="flex items-center gap-3.5">
          {emisor?.logoUrl ? (
            <img src={emisor.logoUrl} alt={emisor.empresa} className="max-h-11 max-w-[170px] object-contain" />
          ) : (
            <div className="w-11 h-11 rounded-xl bg-[#FF6B00] flex items-center justify-center font-black text-white text-xl shadow-sm">
              {(emisor?.empresa || 'G').charAt(0)}
            </div>
          )}
          <div>
            <h1 className="text-xl font-black text-[#1A1A1A] tracking-tight uppercase">
              {emisor?.empresa || 'GOGLITE'}
            </h1>
            <p className="text-[11px] text-[#555555] font-medium">{emisor?.subtitulo || 'Estudio de Ingeniería Web & Software'}</p>
            <p className="text-[10px] text-[#555555]">{emisor?.ubicacion || 'San Salvador (SV) · Santo Domingo (DO)'}</p>
          </div>
        </div>

        <div className="sm:text-right">
          <div className="text-[10px] font-mono uppercase tracking-wider text-[#888888] font-bold">
            FACTURA COMERCIAL / PROFORMA
          </div>
          <div className="text-xl font-mono font-black text-[#FF6B00]">{invoice.numeroFactura}</div>
          <div className="text-[11px] text-[#555555] mt-0.5">
            Emisión: <strong>{invoice.fechaEmision}</strong> · Vence: <strong>{invoice.fechaVencimiento}</strong>
          </div>
          <span className={`inline-block mt-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
            invoice.estado === 'cobrada'
              ? 'bg-emerald-100 text-emerald-800'
              : invoice.estado === 'parcial'
              ? 'bg-sky-100 text-sky-800'
              : 'bg-[#FFF0E6] text-[#FF6B00]'
          }`}>
            {invoice.estado === 'cobrada'
              ? (isSaldo ? 'PAGADA 100% · LIQUIDACIÓN' : (isAnticipo ? 'PAGADA 100% · ANTICIPO' : 'PAGADA 100%'))
              : invoice.estado === 'parcial'
              ? (Number(invoice.montoCobrado) === Math.round(Number(invoice.total) * 0.5)
                  ? 'ANTICIPO COBRADO (50%)'
                  : `ABONO PARCIAL ($${Number(invoice.montoCobrado || 0).toLocaleString()} USD)`)
              : (isSaldo ? 'PENDIENTE DE LIQUIDACIÓN' : 'PENDIENTE DE PAGO')}
          </span>
        </div>
      </div>

      {/* 2. Bloque Bilateral (De / Para) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
        <div className="p-3.5 rounded-xl bg-[#FAFAFA] border border-[#EEEEEE]">
          <span className="font-extrabold text-[#FF6B00] uppercase tracking-wider text-[10px] block mb-1">
            DE (EMISOR):
          </span>
          <div className="font-extrabold text-xs text-[#1A1A1A]">{emisor?.empresa || 'Goglite Studio'}</div>
          <div className="text-[#555555] text-[11px] mt-0.5">{emisor?.identificacion}</div>
          <div className="text-[#555555] text-[11px]">{emisor?.email}</div>
          <div className="text-[#555555] text-[11px]">{emisor?.telefono}</div>
        </div>

        <div className="p-3.5 rounded-xl bg-[#FAFAFA] border border-[#EEEEEE]">
          <span className="font-extrabold text-[#FF6B00] uppercase tracking-wider text-[10px] block mb-1">
            PARA (CLIENTE):
          </span>
          <div className="font-extrabold text-xs text-[#1A1A1A]">{invoice.cliente?.empresa}</div>
          <div className="text-[#555555] text-[11px] mt-0.5">Atención: {invoice.cliente?.contacto}</div>
          <div className="text-[#555555] text-[11px]">{invoice.cliente?.email} · {invoice.cliente?.telefono}</div>
          <div className="font-semibold text-[#1A1A1A] text-[11px] mt-0.5">
            {invoice.cliente?.pais === 'DO' ? '🇩🇴 República Dominicana' : '🇸🇻 El Salvador'}
          </div>
        </div>
      </div>

      {/* 3. Tabla de Servicios con cabecera #1A1A1A */}
      <div className="border border-[#EEEEEE] rounded-xl overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#1A1A1A] text-white font-bold uppercase text-[10px]">
            <tr>
              <th className="py-2.5 px-3.5">Descripción del Servicio / Entregable</th>
              <th className="py-2.5 px-3.5 text-center">Cant.</th>
              <th className="py-2.5 px-3.5 text-right">Precio Unitario</th>
              <th className="py-2.5 px-3.5 text-right">Subtotal</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#EEEEEE] text-[#1A1A1A]">
            {invoice.items?.map((item, idx) => (
              <tr key={item.id || idx} className={idx % 2 === 1 ? 'bg-[#FAFAFA]' : 'bg-white'}>
                <td className="py-2.5 px-3.5 font-medium text-xs leading-relaxed">{item.descripcion}</td>
                <td className="py-2.5 px-3.5 text-center font-mono text-xs">{item.cantidad}</td>
                <td className="py-2.5 px-3.5 text-right font-mono text-xs">${Number(item.precioUnitario).toLocaleString()} USD</td>
                <td className="py-2.5 px-3.5 text-right font-mono font-bold text-xs">${Number(item.total).toLocaleString()} USD</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 4. Caja de Totales */}
      <div className="flex justify-end">
        <div className="w-72 bg-[#FAFAFA] p-3.5 rounded-xl border border-[#EEEEEE] space-y-1.5 text-xs">
          <div className="flex justify-between text-[#555555]">
            <span>Subtotal Neto:</span>
            <span className="font-mono font-bold text-[#1A1A1A]">${Number(invoice.subtotal || invoice.total).toLocaleString()} USD</span>
          </div>
          {Number(invoice.impuestoPorcentaje) > 0 && (
            <div className="flex justify-between text-[#555555]">
              <span>Impuestos ({invoice.impuestoPorcentaje}%):</span>
              <span className="font-mono">${Number(invoice.impuestoTotal || 0).toLocaleString()} USD</span>
            </div>
          )}
          <div className="flex justify-between text-[#1A1A1A] font-black text-sm pt-2 border-t-2 border-[#1A1A1A]">
            <span>Total Facturado:</span>
            <span className="font-mono text-[#FF6B00]">${Number(invoice.total).toLocaleString()} USD</span>
          </div>
          <div className="flex justify-between text-emerald-700 font-bold pt-1">
            <span>{cobradoLabel}</span>
            <span className="font-mono">${Number(invoice.montoCobrado || 0).toLocaleString()} USD</span>
          </div>
          <div className="flex justify-between text-amber-700 font-bold pt-1 border-t border-[#E5E7EB]">
            <span>Saldo Pendiente:</span>
            <span className="font-mono">${Math.max(0, Number(invoice.total) - Number(invoice.montoCobrado || 0)).toLocaleString()} USD</span>
          </div>
        </div>
      </div>

      {/* 5. Pie de Factura Oficial de 1 Sola Página */}
      <div className="pt-3 border-t border-[#E5E7EB] flex items-center justify-between text-[11px] text-[#888888] font-mono">
        <span>Documento comercial generado electrónicamente · Goglite Agency Suite</span>
        <span className="font-bold text-[#555555]">Página 1 de 1 · {invoice.numeroFactura}</span>
      </div>
    </div>
  );
}

export default function GestionRentabilidadModule({
  selectedCountry = 'SV',
  presupuestoToBill,
  onClearPresupuestoToBill,
  onNavigateToPresupuestos
}) {
  // 1. Estado en memoria sincronizado 100% con Cloud Firestore
  const [finanzasState, setFinanzasState] = useState(INITIAL_SEED_STATE);

  const [activeTab, setActiveTab] = useState('resumen'); // 'resumen' | 'facturas' | 'gastos' | 'horas' | 'config'

  // 1. Filtros Ejecutivos de KPIs Superiores (Período & Mercado)
  const [kpiPeriod, setKpiPeriod] = useState('este_mes'); // 'este_mes' | 'mes_anterior' | 'trimestre' | 'anio' | 'historico'
  const [kpiMarket, setKpiMarket] = useState('ALL'); // 'ALL' | 'SV' | 'DO'

  // 2. Filtros Contextuales por Pestaña
  // Pestaña 'resumen' (Rentabilidad Unitaria)
  const [resumenSearch, setResumenSearch] = useState('');
  const [resumenMarginFilter, setResumenMarginFilter] = useState('ALL'); // 'ALL' | 'healthy' | 'warning'
  const [resumenCountry, setResumenCountry] = useState('ALL'); // 'ALL' | 'SV' | 'DO'

  // Pestaña 'facturas' (Facturas & Proformas)
  const [facturaSearch, setFacturaSearch] = useState('');
  const [facturaStatus, setFacturaStatus] = useState('ALL'); // 'ALL' | 'cobrada' | 'parcial' | 'pendiente'
  const [facturaCountry, setFacturaCountry] = useState('ALL'); // 'ALL' | 'SV' | 'DO' | 'US'
  const [facturaClientFilter, setFacturaClientFilter] = useState(null); // { nombre: string, facturaId?: string, proyectoId?: string, presupuestoId?: string } | null

  // Pestaña 'gastos' (Gastos Operativos)
  const [gastoSearch, setGastoSearch] = useState('');
  const [gastoCategory, setGastoCategory] = useState('ALL'); // 'ALL' | 'infraestructura' | 'software' | 'subcontratista' | 'operativo'

  // Pestaña 'horas' (Time Tracking)
  const [horasSearch, setHorasSearch] = useState('');

  // Retrocompatibilidad segura
  const countryFilter = kpiMarket;
  const setCountryFilter = setKpiMarket;
  const searchTerm = resumenSearch;
  const setSearchTerm = setResumenSearch;

  const [toastMsg, setToastMsg] = useState('');

  // Sources from Modules 1, 2, and 3 for retrospective compatibility
  const [m3Presupuestos, setM3Presupuestos] = useState([]);
  const [m2CrmLeads, setM2CrmLeads] = useState([]);
  const [m1ScrapperLeads, setM1ScrapperLeads] = useState([]);

  // Invoice view / print modal
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [customPaymentAmount, setCustomPaymentAmount] = useState('');
  const [isInvoiceFullscreenModalOpen, setIsInvoiceFullscreenModalOpen] = useState(false);

  // New Invoice Modal & Free/CMS Invoicing State
  const [newInvoiceModalOpen, setNewInvoiceModalOpen] = useState(false);
  const [invoiceMode, setInvoiceMode] = useState('cms_retainer'); // 'cms_retainer' | 'libre' | 'embudo'
  const [autoExtendCms, setAutoExtendCms] = useState(true);
  const [selectedCmsPeriod, setSelectedCmsPeriod] = useState(30);
  const [selectedSourceKey, setSelectedSourceKey] = useState('');
  const [newInvoiceForm, setNewInvoiceForm] = useState({
    numeroFactura: '',
    presupuestoId: null,
    origenModulo: 'Membresía Headless CMS',
    empresa: '',
    contacto: '',
    email: '',
    telefono: '',
    identificacion: '',
    pais: selectedCountry || 'SV',
    cuentaBancariaId: '',
    concepto: 'Goglite Care · Suscripción Headless CMS & Mantenimiento Web (1 Mes)',
    subtotal: 99,
    impuestoPorcentaje: 0,
    total: 99,
    montoCobrado: 99,
    horasInvertidasEstimadas: 2,
    metodoPago: 'Transferencia Bancaria',
    itemDescripcion: 'Goglite Care · Suscripción Headless CMS & Mantenimiento Web (1 Mes)',
    itemCantidad: 1,
    itemPrecio: 99,
    diasVigencia: 30,
    itemsCustom: null
  });

  // Clientes consolidados para selección ágil en Facturas Libres y CMS
  const cmsClientsList = useMemo(() => {
    const map = new Map();
    (m3Presupuestos || []).forEach(p => {
      const emp = p.cliente?.empresa;
      if (emp && !map.has(emp.toLowerCase())) {
        map.set(emp.toLowerCase(), {
          id: p.id,
          empresa: emp,
          contacto: p.cliente?.nombre || 'Administrador',
          email: p.cliente?.email || '',
          telefono: p.cliente?.telefono || '',
          pais: p.pais || 'SV',
          dominio: ''
        });
      }
    });

    (m2CrmLeads || []).forEach(l => {
      if (l.empresa && !map.has(l.empresa.toLowerCase())) {
        map.set(l.empresa.toLowerCase(), {
          id: l.id,
          empresa: l.empresa,
          contacto: l.contacto || 'Director',
          email: l.email || '',
          telefono: l.telefono || '',
          pais: l.pais || 'SV',
          dominio: l.dominio || ''
        });
      }
    });

    return Array.from(map.values());
  }, [m2CrmLeads]);

  // New Expense Modal
  const [newExpenseModalOpen, setNewExpenseModalOpen] = useState(false);
  const [newExpenseForm, setNewExpenseForm] = useState({
    concepto: '',
    categoria: 'infraestructura',
    proveedor: '',
    monto: '',
    frecuencia: 'unico',
    clienteAsociado: 'General Agencia',
    proyectoId: ''
  });

  // Time Tracking State
  const [newTimeModalOpen, setNewTimeModalOpen] = useState(false);
  const [newTimeForm, setNewTimeForm] = useState({
    proyectoId: '',
    cliente: '',
    concepto: '',
    categoria: 'desarrollo',
    horas: 2.5,
    responsable: 'Senior Dev'
  });

  // Config Form State & Multi-Account State
  const [configForm, setConfigForm] = useState(() => ({
    ...DEFAULT_CONFIGURACION,
    ...(finanzasState?.configuracion || {}),
    cuentasBancarias: normalizeCuentasBancarias(finanzasState?.configuracion?.cuentasBancarias)
  }));

  // Account Modal & Filters
  const [accountModalOpen, setAccountModalOpen] = useState(false);
  const [editingAccountId, setEditingAccountId] = useState(null);
  const [accountFilterCountry, setAccountFilterCountry] = useState('ALL'); // 'ALL' | 'DO' | 'US' | 'SV' | 'INT'
  const [accountForm, setAccountForm] = useState({
    id: '',
    pais: 'DO',
    banco: '',
    tipo: 'Cuenta Corriente',
    numero: '',
    titular: 'Víctor Matos',
    moneda: 'USD',
    instrucciones: '',
    activa: true,
    predeterminada: false
  });

  // Live 1-Click Interactive Stopwatch State (Option 2)
  const [activeTimer, setActiveTimer] = useState(DEFAULT_TIMER_STATE);

  const [displaySeconds, setDisplaySeconds] = useState(() => getElapsedSeconds(activeTimer));
  const [stopTimerModalOpen, setStopTimerModalOpen] = useState(false);
  const [stopTimerForm, setStopTimerForm] = useState({
    horas: 1,
    cliente: '',
    proyectoId: '',
    concepto: '',
    categoria: 'desarrollo',
    responsable: 'Senior Dev'
  });

  // Live Stopwatch 1s Tick Interval
  useEffect(() => {
    setDisplaySeconds(getElapsedSeconds(activeTimer));
    if (!activeTimer.isRunning || activeTimer.isPaused) return;

    const interval = setInterval(() => {
      setDisplaySeconds(getElapsedSeconds(activeTimer));
    }, 1000);

    return () => clearInterval(interval);
  }, [activeTimer]);

  const CLOUD_API_URL = import.meta.env.VITE_API_URL || 'https://goglite-agency.vercel.app';
  const getBackendEndpoint = (endpoint) => {
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    if (typeof window !== 'undefined') {
      if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        return `http://localhost:3001${cleanEndpoint}`;
      }
    }
    return `${CLOUD_API_URL}${cleanEndpoint}`;
  };

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3200);
  };

  // Persistir automáticamente en Firestore Cloud cada vez que cambie finanzasState
  useEffect(() => {
    try {
      if (finanzasState) {
        saveAppStateCloud('finanzas_v1', 'finanzas', finanzasState).catch(() => {});
      }
    } catch (e) {
      console.warn('Error guardando finanzas en cloud:', e);
    }
  }, [finanzasState]);

  // Cargar datos retrospectivos de Módulos 1, 2 y 3 + sincronizar con Firestore Cloud y backend
  useEffect(() => {
    loadRetrospectiveModules();
    fetchFinanzasFromBackend();
    (async () => {
      try {
        const cloudFin = await getAppStateCloud('finanzas_v1');
        if (cloudFin && typeof cloudFin === 'object') {
          setFinanzasState(prev => ({
            ...prev,
            facturas: Array.isArray(cloudFin.facturas) && cloudFin.facturas.length > 0 ? cloudFin.facturas.map(normalizeFacturaItems) : prev.facturas,
            gastos: Array.isArray(cloudFin.gastos) && cloudFin.gastos.length > 0 ? cloudFin.gastos : prev.gastos,
            suscripciones: Array.isArray(cloudFin.suscripciones) && cloudFin.suscripciones.length > 0 ? cloudFin.suscripciones : prev.suscripciones,
            registroHoras: Array.isArray(cloudFin.registroHoras) && cloudFin.registroHoras.length > 0 ? cloudFin.registroHoras : prev.registroHoras
          }));
        }
      } catch (e) {}
    })();
  }, []);

  const loadRetrospectiveModules = async () => {
    try {
      const [cloudPres, cloudLeads] = await Promise.all([
        getPresupuestosCloud(),
        getCrmLeadsCloud()
      ]);
      const parsedM3 = Array.isArray(cloudPres) ? cloudPres : [];
      setM3Presupuestos(parsedM3);

      const parsedM2 = Array.isArray(cloudLeads) ? cloudLeads : [];
      setM2CrmLeads(parsedM2);

      // Auto-importar presupuestos aceptados del Módulo 3 y asegurar dos facturas por hito (Anticipo 50% + Saldo 50%)
      if (Array.isArray(parsedM3) && parsedM3.length > 0) {
        setFinanzasState(prev => {
          let currentFacturas = [...(prev.facturas || [])];

          parsedM3.forEach(prop => {
            if (prop.estado === 'aceptado') {
              const alreadyExists = currentFacturas.some(
                f => f.presupuestoId === prop.id ||
                     f.codigoPresupuesto === prop.codigo ||
                     (f.cliente?.empresa && prop.cliente?.empresa &&
                      f.cliente.empresa.toLowerCase().trim() === prop.cliente.empresa.toLowerCase().trim())
              );
              if (!alreadyExists) {
                const milestoneInvoices = buildMilestoneInvoices(prop, currentFacturas.length, prev.configuracion);
                currentFacturas.unshift(...milestoneInvoices);
              }
            }
          });

          const reconciled = reconcileMilestoneInvoices(currentFacturas, prev.configuracion);
          return { ...prev, facturas: reconciled };
        });
      } else {
        setFinanzasState(prev => ({
          ...prev,
          facturas: reconcileMilestoneInvoices(prev.facturas || [], prev.configuracion)
        }));
      }
    } catch (e) {
      console.warn('Error cargando módulos retrospectivos 1-3:', e);
    }
  };

  // Escuchar eventos en vivo desde Módulo 4 (Contratos & Pagos) para sincronizar facturas por hito en 0ms
  useEffect(() => {
    const handleSyncFromEvents = async () => {
      try {
        const cloudFin = await getAppStateCloud('finanzas_v1');
        if (cloudFin && Array.isArray(cloudFin.facturas)) {
          setFinanzasState(prev => ({
            ...prev,
            facturas: reconcileMilestoneInvoices(cloudFin.facturas.map(normalizeFacturaItems), prev.configuracion)
          }));
        }
      } catch (e) {}
    };

    window.addEventListener('goglite_facturas_updated', handleSyncFromEvents);
    window.addEventListener('goglite_proyectos_synced', handleSyncFromEvents);
    window.addEventListener('storage', handleSyncFromEvents);
    return () => {
      window.removeEventListener('goglite_facturas_updated', handleSyncFromEvents);
      window.removeEventListener('goglite_proyectos_synced', handleSyncFromEvents);
      window.removeEventListener('storage', handleSyncFromEvents);
    };
  }, []);

  // Si el usuario pulsó "Facturar M4" desde un presupuesto en el Módulo 3
  useEffect(() => {
    if (presupuestoToBill) {
      setFinanzasState(prev => {
        const currentFacturas = [...(prev.facturas || [])];
        const existing = currentFacturas.find(
          f => f.presupuestoId === presupuestoToBill.id ||
               f.codigoPresupuesto === presupuestoToBill.codigo ||
               (f.cliente?.empresa && presupuestoToBill.cliente?.empresa &&
                f.cliente.empresa.toLowerCase().trim() === presupuestoToBill.cliente.empresa.toLowerCase().trim())
        );

        if (existing) {
          setSelectedInvoice(existing);
          setCustomPaymentAmount(String(existing.montoCobrado || 0));
          setActiveTab('facturas');
          showToast(`Factura ${existing.numeroFactura} vinculada a ${presupuestoToBill.codigo}`);
          return prev;
        }

        const nuevaFactura = buildInvoiceFromPresupuesto(
          presupuestoToBill,
          currentFacturas.length,
          prev.configuracion
        );
        const updatedFacturas = [nuevaFactura, ...currentFacturas];

        // Sincronizar en segundo plano con el backend
        fetch(getBackendEndpoint('/api/finanzas/facturas'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(nuevaFactura)
        }).catch(() => {});

        setSelectedInvoice(nuevaFactura);
        setCustomPaymentAmount(String(nuevaFactura.montoCobrado || 0));
        setActiveTab('facturas');
        showToast(`¡Factura ${nuevaFactura.numeroFactura} generada desde ${presupuestoToBill.codigo}!`);

        return { ...prev, facturas: updatedFacturas };
      });

      if (onClearPresupuestoToBill) onClearPresupuestoToBill();
    }
  }, [presupuestoToBill]);

  const fetchFinanzasFromBackend = async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2200);
      const res = await fetch(getBackendEndpoint('/api/finanzas/resumen'), {
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const json = await res.json();
        setFinanzasState(prev => {
          // Combinar facturas locales y del backend sin perder registros creados en local
          const backendFacturas = Array.isArray(json.facturas) ? json.facturas : [];
          const localFacturas = Array.isArray(prev.facturas) ? prev.facturas : [];
          const mergedIds = new Set(localFacturas.map(f => f.id));
          const mergedFacturas = [
            ...localFacturas,
            ...backendFacturas.filter(bf => !mergedIds.has(bf.id))
          ];

          const backendGastos = Array.isArray(json.gastos) ? json.gastos : [];
          const localGastos = Array.isArray(prev.gastos) ? prev.gastos : [];
          const gastoIds = new Set(localGastos.map(g => g.id));
          const mergedGastos = [
            ...localGastos,
            ...backendGastos.filter(bg => !gastoIds.has(bg.id))
          ];

          const backendTimes = Array.isArray(json.timeEntries) ? json.timeEntries : [];
          const localTimes = Array.isArray(prev.timeEntries) ? prev.timeEntries : [];
          const timeIds = new Set(localTimes.map(t => t.id));
          const mergedTimes = [
            ...localTimes,
            ...backendTimes.filter(bt => !timeIds.has(bt.id))
          ];

          return {
            facturas: mergedFacturas,
            gastos: mergedGastos,
            timeEntries: mergedTimes,
            configuracion: {
              ...DEFAULT_CONFIGURACION,
              ...(json.configuracion || {}),
              ...(prev.configuracion || {})
            }
          };
        });
      }
    } catch {
      // Modo autónomo Local-First ($0 Cost)
    }
  };

  // Sincronización manual de 1 clic con Módulos 1, 2 y 3
  const handleSyncRetrospectiveModules = () => {
    loadRetrospectiveModules();
    let importedCount = 0;

    setFinanzasState(prev => {
      const currentFacturas = [...(prev.facturas || [])];

      // 1. Revisar presupuestos de Firestore
      const listM3 = m3Presupuestos || [];

      if (Array.isArray(listM3)) {
        listM3.forEach(prop => {
          const exists = currentFacturas.some(
            f => f.presupuestoId === prop.id ||
                 f.codigoPresupuesto === prop.codigo ||
                 (f.cliente?.empresa && prop.cliente?.empresa &&
                  f.cliente.empresa.toLowerCase().trim() === prop.cliente.empresa.toLowerCase().trim())
          );
          if (!exists) {
            const newFac = buildInvoiceFromPresupuesto(prop, currentFacturas.length, prev.configuracion);
            currentFacturas.unshift(newFac);
            importedCount++;
          }
        });
      }

      // 2. Revisar prospectos en etapa 'ganado' o 'propuesta_enviada' en Módulo 2 (CRM)
      let listM2 = m2CrmLeads;
      try {
        const stored = getStoredCrmLeads();
        if (stored && stored.length > 0) listM2 = stored;
      } catch {}

      if (Array.isArray(listM2)) {
        listM2.forEach(lead => {
          if (lead.etapa === 'ganado' || lead.etapa === 'propuesta_enviada') {
            const exists = currentFacturas.some(
              f => f.cliente?.empresa && lead.empresa &&
                   f.cliente.empresa.toLowerCase().trim() === lead.empresa.toLowerCase().trim()
            );
            if (!exists && Number(lead.valorEstimado) > 0) {
              const nextNum = String(currentFacturas.length + 1).padStart(3, '0');
              const total = Number(lead.valorEstimado) || 650;
              const anticipo = lead.etapa === 'ganado' ? Math.round(total * 0.5) : 0;
              const pais = lead.pais || 'SV';
              currentFacturas.unshift({
                id: `fac-crm-${lead.id || Date.now()}`,
                numeroFactura: `FAC-2026-${nextNum}`,
                presupuestoId: null,
                proyectoId: `proj-${lead.id || Date.now()}`,
                codigoProyecto: `CON-2026-${nextNum}`,
                origenModulo: `Módulo 2 · CRM (${lead.etapa === 'ganado' ? 'Cerrado Ganado' : 'Propuesta'})`,
                cliente: {
                  empresa: lead.empresa,
                  contacto: lead.contacto || 'Director',
                  email: lead.email || '',
                  telefono: lead.telefono || '',
                  identificacion: 'ID Fiscal Comercial',
                  pais
                },
                concepto: `Implementación Digital Web & Embudo de Conversión - ${lead.empresa}`,
                fechaEmision: new Date().toISOString().split('T')[0],
                fechaVencimiento: new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0],
                subtotal: total,
                impuestoPorcentaje: 0,
                impuestoTotal: 0,
                total,
                moneda: 'USD',
                montoCobrado: anticipo,
                saldoPendiente: total - anticipo,
                estado: anticipo >= total ? 'cobrada' : anticipo > 0 ? 'parcial' : 'pendiente',
                metodoPago: pais === 'DO' ? 'Banco Popular Dominicano' : 'Banco Agrícola El Salvador',
                horasInvertidasEstimadas: Math.max(6, Math.round(total / 50)),
                items: [
                  {
                    descripcion: `Desarrollo Web Mobile-First & Optimización GEO IA (${lead.empresa})`,
                    cantidad: 1,
                    precioUnitario: total,
                    total
                  }
                ]
              });
              importedCount++;
            }
          }
        });
      }

      return { ...prev, facturas: currentFacturas };
    });

    if (importedCount > 0) {
      showToast(`¡Sincronizados ${importedCount} proyectos desde los Módulos 1, 2 y 3!`);
    } else {
      showToast('Módulos 1, 2 y 3 sincronizados al día.');
    }
  };

  // Calcular resumen reactivo en 0ms
  const data = useMemo(() => computeFinanzasSummary(finanzasState), [finanzasState]);
  const { kpis, facturas, gastos, timeEntries, proyectosRentabilidad, configuracion } = data;

  // KPIs reactivos ejecutivos filtrados por período temporal y mercado
  const kpiDerived = useMemo(() => {
    return computeKpiMetrics(finanzasState, kpiPeriod, kpiMarket);
  }, [finanzasState, kpiPeriod, kpiMarket]);

  // Autocompletar formulario de Nueva Factura al elegir un origen de M1, M2 o M3
  const handleSelectImportSource = (value) => {
    setSelectedSourceKey(value);
    if (!value) return;

    const [sourceType, sourceId] = value.split('::');
    if (sourceType === 'M3') {
      const prop = m3Presupuestos.find(p => p.id === sourceId);
      if (prop) {
        const built = buildInvoiceFromPresupuesto(prop, facturas.length, configuracion);
        setNewInvoiceForm({
          numeroFactura: built.numeroFactura,
          presupuestoId: prop.id,
          origenModulo: `Módulo 3 · ${prop.codigo}`,
          empresa: built.cliente.empresa,
          contacto: built.cliente.contacto,
          email: built.cliente.email,
          telefono: built.cliente.telefono,
          identificacion: built.cliente.identificacion,
          pais: built.cliente.pais,
          concepto: built.concepto,
          subtotal: built.subtotal,
          impuestoPorcentaje: 0,
          total: built.total,
          montoCobrado: built.montoCobrado,
          horasInvertidasEstimadas: built.horasInvertidasEstimadas,
          metodoPago: built.metodoPago,
          itemDescripcion: built.items[0]?.descripcion || built.concepto,
          itemCantidad: 1,
          itemPrecio: built.subtotal,
          itemsCustom: built.items
        });
      }
    } else if (sourceType === 'M2') {
      const lead = m2CrmLeads.find(l => l.id === sourceId);
      if (lead) {
        const precio = Number(lead.valorEstimado) > 0 ? Number(lead.valorEstimado) : 650;
        const pais = lead.pais || 'SV';
        setNewInvoiceForm({
          numeroFactura: `FAC-2026-${String(facturas.length + 1).padStart(3, '0')}`,
          presupuestoId: null,
          origenModulo: 'Módulo 2 · CRM & WhatsApp',
          empresa: lead.empresa || '',
          contacto: lead.contacto || '',
          email: lead.email || '',
          telefono: lead.telefono || '',
          identificacion: 'ID Fiscal Comercial',
          pais,
          concepto: `Sistema Digital Web & Conversión WhatsApp - ${lead.empresa}`,
          subtotal: precio,
          impuestoPorcentaje: 0,
          total: precio,
          montoCobrado: Math.round(precio * 0.5),
          horasInvertidasEstimadas: Math.max(6, Math.round(precio / 50)),
          metodoPago: pais === 'DO' ? 'Banco Popular Dominicano' : 'Banco Agrícola El Salvador',
          itemDescripcion: `Implementación Plataforma Web & Embudo Comercial (${lead.empresa})`,
          itemCantidad: 1,
          itemPrecio: precio,
          itemsCustom: null
        });
      }
    } else if (sourceType === 'M1') {
      const lead = m1ScrapperLeads.find(l => l.id === sourceId);
      if (lead) {
        const pais = lead.pais || 'SV';
        setNewInvoiceForm({
          numeroFactura: `FAC-2026-${String(facturas.length + 1).padStart(3, '0')}`,
          presupuestoId: null,
          origenModulo: 'Módulo 1 · Lead Scrapper',
          empresa: lead.nombreEmpresa || lead.dominio || '',
          contacto: lead.responsable || 'Gerencia General',
          email: lead.email || '',
          telefono: lead.telefono || '',
          identificacion: 'ID Fiscal Comercial',
          pais,
          concepto: `Renovación Web Mobile-First & Optimización GEO IA - ${lead.nombreEmpresa}`,
          subtotal: 450,
          impuestoPorcentaje: 0,
          total: 450,
          montoCobrado: 225,
          horasInvertidasEstimadas: 9,
          metodoPago: pais === 'DO' ? 'Banco Popular Dominicano' : 'Banco Agrícola El Salvador',
          itemDescripcion: `Desarrollo Web Mobile-First & Posicionamiento Local (${lead.dominio})`,
          itemCantidad: 1,
          itemPrecio: 450,
          itemsCustom: null
        });
      }
    }
  };

  // Update Invoice Payment / Status (Local-First + Backend Sync)
  const handleUpdatePayment = async (facturaId, montoNuevo) => {
    const cobradoNum = Math.max(0, Number(montoNuevo) || 0);

    setFinanzasState(prev => {
      const updatedFacturas = (prev.facturas || []).map(f => {
        if (f.id !== facturaId) return f;
        const total = Number(f.total) || 0;
        const saldoPendiente = Math.max(0, total - cobradoNum);
        const estado = cobradoNum >= total ? 'cobrada' : cobradoNum > 0 ? 'parcial' : 'pendiente';
        const updated = { ...f, montoCobrado: cobradoNum, saldoPendiente, estado };
        if (selectedInvoice && selectedInvoice.id === facturaId) {
          setSelectedInvoice(updated);
          setCustomPaymentAmount(String(cobradoNum));
        }
        return updated;
      });
      return { ...prev, facturas: updatedFacturas };
    });

    showToast('Cobro actualizado y rentabilidad recalculada.');

    try {
      await fetch(getBackendEndpoint(`/api/finanzas/facturas/${facturaId}`), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ montoCobrado: cobradoNum })
      });
    } catch {}
  };

  // Delete Invoice
  const handleDeleteInvoice = async (facturaId) => {
    if (!confirm('¿Eliminar esta factura proforma del registro contable?')) return;

    setFinanzasState(prev => ({
      ...prev,
      facturas: (prev.facturas || []).filter(f => f.id !== facturaId)
    }));

    if (selectedInvoice?.id === facturaId) setSelectedInvoice(null);
    showToast('Factura eliminada.');

    try {
      await fetch(getBackendEndpoint(`/api/finanzas/facturas/${facturaId}`), { method: 'DELETE' });
    } catch {}
  };

  // Sincronizar factura con el proyecto del cliente en Cloud Firestore (Habilita el acceso en el portal del cliente)
  const syncInvoiceWithClientProject = async (invoice) => {
    if (!invoice) return;
    try {
      const projs = await getProyectosCloud();
      if (Array.isArray(projs) && projs.length > 0) {
        let modified = false;
        const isAnticipoApproved = Number(invoice.montoCobrado) >= (Number(invoice.total) * 0.45);
        const isLiquidated = Number(invoice.montoCobrado) >= Number(invoice.total);
        const nowStr = new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });

        const updatedProjs = projs.map(p => {
          const match = 
            (invoice.presupuestoId && (p.presupuestoId === invoice.presupuestoId || p.id === invoice.presupuestoId)) ||
            (invoice.codigoPresupuesto && (p.presupuestoCodigo === invoice.codigoPresupuesto || p.codigo === invoice.codigoPresupuesto)) ||
            (invoice.cliente?.empresa && p.cliente?.empresa && invoice.cliente.empresa.toLowerCase().trim() === p.cliente.empresa.toLowerCase().trim());

          if (match) {
            modified = true;
            const curPagos = p.pagos || {};
            const updatedP = {
              ...p,
              anticipoPagado: isAnticipoApproved || p.anticipoPagado,
              saldoPagado: isLiquidated || p.saldoPagado,
              facturaNumero: invoice.numeroFactura,
              facturaId: invoice.id,
              pagos: {
                ...curPagos,
                anticipoMonto: Math.round(Number(invoice.total) * 0.5),
                anticipoEstado: isAnticipoApproved ? 'confirmado' : (curPagos.anticipoEstado || 'pendiente'),
                anticipoFecha: isAnticipoApproved ? (curPagos.anticipoFecha || nowStr) : curPagos.anticipoFecha,
                saldoMonto: Math.max(0, Number(invoice.total) - Math.round(Number(invoice.total) * 0.5)),
                saldoEstado: isLiquidated ? 'confirmado' : (curPagos.saldoEstado || 'pendiente'),
                saldoFecha: isLiquidated ? (curPagos.saldoFecha || nowStr) : curPagos.saldoFecha,
                facturaEmitida: true,
                facturaNumero: invoice.numeroFactura,
                facturaUrlHabilitada: true
              }
            };
            saveProyectoCloud(updatedP).catch(() => {});
            return updatedP;
          }
          return p;
        });

        if (modified) {
          window.dispatchEvent(new CustomEvent('goglite_proyectos_synced', { detail: { proyectos: updatedProjs } }));
        }
      }

      window.dispatchEvent(new CustomEvent('goglite_facturas_updated', { detail: { factura: invoice } }));
    } catch (e) {
      console.warn('[Sync] Error syncing invoice with project:', e);
    }
  };

  // Seleccionar factura para vista previa y editor en vivo
  const handleSelectInvoice = (fac) => {
    if (!fac) return;
    const normalized = normalizeFacturaItems(fac);
    setSelectedInvoice(normalized);
    setCustomPaymentAmount(String(normalized.montoCobrado || 0));
  };

  // Modificar campo de cabecera de la factura activa
  const handleUpdateActiveInvoiceField = (field, value) => {
    setSelectedInvoice(prev => {
      if (!prev) return prev;
      return { ...prev, [field]: value };
    });
  };

  // Modificar ítem/entregable específico de la factura activa y recalcular totales en 0ms
  const handleUpdateActiveInvoiceItem = (idx, key, val) => {
    setSelectedInvoice(prev => {
      if (!prev) return prev;
      const nextItems = [...(prev.items || [])];
      const target = { ...nextItems[idx] };
      if (key === 'cantidad' || key === 'precioUnitario') {
        const num = Math.max(0, Number(val) || 0);
        target[key] = num;
        target.total = Math.round((Number(target.cantidad) || 1) * (Number(target.precioUnitario) || 0));
      } else {
        target[key] = val;
      }
      nextItems[idx] = target;

      const subtotal = nextItems.reduce((acc, it) => acc + (Number(it.total) || 0), 0);
      const taxPct = Number(prev.impuestoPorcentaje) || 0;
      const impuestoTotal = Math.round(subtotal * (taxPct / 100) * 100) / 100;
      const total = Math.round((subtotal + impuestoTotal) * 100) / 100;
      const cobrado = Number(prev.montoCobrado) || 0;
      const saldo = Math.max(0, total - cobrado);
      const estado = cobrado >= total ? 'cobrada' : cobrado > 0 ? 'parcial' : 'pendiente';

      return {
        ...prev,
        items: nextItems,
        subtotal,
        impuestoTotal,
        total,
        saldoPendiente: saldo,
        estado
      };
    });
  };

  // Agregar nuevo entregable a la factura activa
  const handleAddNewItemToActiveInvoice = () => {
    setSelectedInvoice(prev => {
      if (!prev) return prev;
      const nextItems = [
        ...(prev.items || []),
        {
          id: `item-${Date.now()}`,
          descripcion: 'Nuevo entregable o requerimiento acordado',
          cantidad: 1,
          precioUnitario: 250,
          total: 250
        }
      ];
      const subtotal = nextItems.reduce((acc, it) => acc + (Number(it.total) || 0), 0);
      const taxPct = Number(prev.impuestoPorcentaje) || 0;
      const impuestoTotal = Math.round(subtotal * (taxPct / 100) * 100) / 100;
      const total = Math.round((subtotal + impuestoTotal) * 100) / 100;
      const cobrado = Number(prev.montoCobrado) || 0;
      const saldo = Math.max(0, total - cobrado);
      const estado = cobrado >= total ? 'cobrada' : cobrado > 0 ? 'parcial' : 'pendiente';

      return {
        ...prev,
        items: nextItems,
        subtotal,
        impuestoTotal,
        total,
        saldoPendiente: saldo,
        estado
      };
    });
  };

  // Eliminar ítem de la factura activa
  const handleDeleteItemFromActiveInvoice = (idx) => {
    setSelectedInvoice(prev => {
      if (!prev) return prev;
      if ((prev.items || []).length <= 1) {
        showToast('La factura debe tener al menos un entregable.');
        return prev;
      }
      const nextItems = prev.items.filter((_, i) => i !== idx);
      const subtotal = nextItems.reduce((acc, it) => acc + (Number(it.total) || 0), 0);
      const taxPct = Number(prev.impuestoPorcentaje) || 0;
      const impuestoTotal = Math.round(subtotal * (taxPct / 100) * 100) / 100;
      const total = Math.round((subtotal + impuestoTotal) * 100) / 100;
      const cobrado = Number(prev.montoCobrado) || 0;
      const saldo = Math.max(0, total - cobrado);
      const estado = cobrado >= total ? 'cobrada' : cobrado > 0 ? 'parcial' : 'pendiente';

      return {
        ...prev,
        items: nextItems,
        subtotal,
        impuestoTotal,
        total,
        saldoPendiente: saldo,
        estado
      };
    });
  };

  // Modificar monto cobrado manualmente (para abonos o pagos parciales en vivo)
  const handleUpdateMontoCobrado = (rawVal) => {
    setSelectedInvoice(prev => {
      if (!prev) return prev;
      const total = Number(prev.total) || 0;
      let numVal = rawVal;
      if (rawVal !== '') {
        const parsed = Number(rawVal);
        numVal = isNaN(parsed) ? 0 : parsed;
      }
      const effectiveNum = typeof numVal === 'number' ? numVal : 0;
      const saldo = Math.max(0, total - effectiveNum);
      const estado = effectiveNum >= total && total > 0 ? 'cobrada' : effectiveNum > 0 ? 'parcial' : 'pendiente';

      const updated = {
        ...prev,
        montoCobrado: numVal,
        saldoPendiente: saldo,
        estado
      };

      setFinanzasState(fPrev => {
        const nextFacturas = (fPrev.facturas || []).map(f => f.id === updated.id ? { ...updated, montoCobrado: effectiveNum } : f);
        return { ...fPrev, facturas: nextFacturas };
      });

      return updated;
    });
  };

  // Guardar factura activa y sincronizar con proyecto y portal
  const handleSaveActiveInvoice = async () => {
    if (!selectedInvoice) return;
    const effectiveMonto = Math.max(0, Number(selectedInvoice.montoCobrado) || 0);
    const total = Number(selectedInvoice.total) || 0;
    const saldo = Math.max(0, total - effectiveMonto);
    const estado = effectiveMonto >= total && total > 0 ? 'cobrada' : effectiveMonto > 0 ? 'parcial' : 'pendiente';

    const toSave = {
      ...selectedInvoice,
      montoCobrado: effectiveMonto,
      saldoPendiente: saldo,
      estado
    };

    setSelectedInvoice(toSave);

    setFinanzasState(prev => {
      const nextFacturas = (prev.facturas || []).map(f => f.id === toSave.id ? toSave : f);
      return { ...prev, facturas: nextFacturas };
    });

    syncInvoiceWithClientProject(toSave);
    showToast(`✓ Factura ${toSave.numeroFactura} guardada con cobrado de $${effectiveMonto.toLocaleString()} USD.`);

    try {
      await fetch(getBackendEndpoint(`/api/finanzas/facturas/${toSave.id}`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(toSave)
      });
    } catch {}
  };

  // Aprobación rápida de depósito (50% anticipo o 100% liquidación)
  const handleQuickApprovePayment = (tipo = 'anticipo') => {
    if (!selectedInvoice) return;
    const total = Number(selectedInvoice.total) || 0;
    const newMonto = tipo === '100' || tipo === 'liquidacion' ? total : Math.round(total * 0.5);
    const newSaldo = Math.max(0, total - newMonto);
    const newEstado = newMonto >= total ? 'cobrada' : newMonto > 0 ? 'parcial' : 'pendiente';

    const updated = {
      ...selectedInvoice,
      montoCobrado: newMonto,
      saldoPendiente: newSaldo,
      estado: newEstado
    };

    setSelectedInvoice(updated);
    setCustomPaymentAmount(String(newMonto));

    setFinanzasState(prev => {
      const list = (prev.facturas || []).map(f => f.id === updated.id ? updated : f);
      return { ...prev, facturas: list };
    });

    syncInvoiceWithClientProject(updated);

    const msg = (tipo === '100' || tipo === 'liquidacion')
      ? `✓ Factura ${updated.numeroFactura} liquidada al 100% ($${newMonto} USD). Cliente habilitado completamente.`
      : `✓ Anticipo del 50% ($${newMonto} USD) aprobado con éxito. Factura oficial habilitada en el portal del cliente.`;
    showToast(msg);

    try {
      fetch(getBackendEndpoint(`/api/finanzas/facturas/${updated.id}`), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ montoCobrado: newMonto, estado: newEstado })
      }).catch(() => {});
    } catch {}
  };

  // Create Invoice (Local-First + Backend Sync)
  const handleCreateInvoice = async (e) => {
    e.preventDefault();
    const nextNum = String(facturas.length + 1).padStart(3, '0');
    const subtotal = Number(newInvoiceForm.subtotal) || Number(newInvoiceForm.total) || 99;
    const taxPct = Number(newInvoiceForm.impuestoPorcentaje) || 0;
    const impuestoTotal = Math.round(subtotal * (taxPct / 100) * 100) / 100;
    const total = Math.round((subtotal + impuestoTotal) * 100) / 100;
    const montoCobrado = Number(newInvoiceForm.montoCobrado) || 0;

    const origenModuloFinal =
      invoiceMode === 'cms_retainer'
        ? 'Membresía Headless CMS'
        : invoiceMode === 'libre'
        ? 'Facturación Libre'
        : (newInvoiceForm.origenModulo || 'Facturación Directa');

    const nuevaFactura = {
      id: 'fac-' + Date.now(),
      numeroFactura: newInvoiceForm.numeroFactura || `FAC-2026-${nextNum}`,
      presupuestoId: newInvoiceForm.presupuestoId || null,
      proyectoId: 'proj-' + Date.now(),
      codigoProyecto: `CON-2026-${nextNum}`,
      origenModulo: origenModuloFinal,
      tipoHito: invoiceMode === 'cms_retainer' ? 'recurrente_cms' : 'libre',
      cliente: {
        empresa: newInvoiceForm.empresa,
        contacto: newInvoiceForm.contacto || 'Director',
        email: newInvoiceForm.email || '',
        telefono: newInvoiceForm.telefono || '',
        identificacion: newInvoiceForm.identificacion || 'ID Fiscal Comercial',
        pais: newInvoiceForm.pais || 'SV'
      },
      concepto: newInvoiceForm.concepto || newInvoiceForm.itemDescripcion,
      fechaEmision: new Date().toISOString().split('T')[0],
      fechaVencimiento: new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0],
      subtotal,
      impuestoPorcentaje: taxPct,
      impuestoTotal,
      total,
      moneda: 'USD',
      montoCobrado,
      saldoPendiente: Math.max(0, total - montoCobrado),
      metodoPago: newInvoiceForm.metodoPago || 'Transferencia Bancaria',
      cuentaBancariaId: newInvoiceForm.cuentaBancariaId || null,
      horasInvertidasEstimadas: Number(newInvoiceForm.horasInvertidasEstimadas) || (invoiceMode === 'cms_retainer' ? 2 : 10),
      items: Array.isArray(newInvoiceForm.itemsCustom) && newInvoiceForm.itemsCustom.length > 0
        ? newInvoiceForm.itemsCustom
        : [
            {
              descripcion: newInvoiceForm.itemDescripcion || 'Servicio de Crecimiento Digital & Desarrollo Web',
              cantidad: Number(newInvoiceForm.itemCantidad) || 1,
              precioUnitario: subtotal,
              total: subtotal
            }
          ]
    };

    setFinanzasState(prev => ({
      ...prev,
      facturas: [nuevaFactura, ...(prev.facturas || [])]
    }));

    // Auto-activación o extensión en Headless CMS si es suscripción
    if (invoiceMode === 'cms_retainer' && autoExtendCms && newInvoiceForm.empresa) {
      try {
        const diasASumar = Number(newInvoiceForm.diasVigencia) || (subtotal >= 1000 ? 365 : subtotal >= 500 ? 180 : subtotal >= 250 ? 90 : 30);
        const labelPeriodo = diasASumar >= 365 ? '1 Año' : diasASumar >= 180 ? '6 Meses' : diasASumar >= 90 ? '3 Meses' : '1 Mes';
        const now = Date.now();
        const nowStr = new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });

        const projs = await getProyectosCloud();
        const targetProj = projs.find(p =>
          (p.cliente?.empresa && p.cliente.empresa.toLowerCase().trim() === newInvoiceForm.empresa.toLowerCase().trim()) ||
          (p.lead?.empresa && p.lead.empresa.toLowerCase().trim() === newInvoiceForm.empresa.toLowerCase().trim())
        );

        if (targetProj) {
          const curConfig = targetProj.portalConfig || {};
          let baseMs = now;
          if (curConfig.careVenceAt) {
            const curEnd = new Date(curConfig.careVenceAt).getTime();
            if (!isNaN(curEnd) && curEnd > now) baseMs = curEnd;
          }
          const newEndMs = baseMs + (diasASumar * 86400000);
          const newVenceIso = new Date(newEndMs).toISOString();

          const updatedConfig = {
            ...curConfig,
            fase5CareActivo: true,
            careVenceAt: newVenceIso,
            ultimaRecargaPeriodo: labelPeriodo,
            fechaUltimaRecarga: nowStr,
            historialRecargas: [
              {
                fecha: nowStr,
                periodo: labelPeriodo,
                dias: diasASumar,
                facturaId: nuevaFactura.id,
                numeroFactura: nuevaFactura.numeroFactura,
                timestamp: now
              },
              ...(curConfig.historialRecargas || [])
            ]
          };

          const updatedProj = { ...targetProj, portalConfig: updatedConfig };
          if (targetProj.id) saveProyectoCloud(updatedProj).catch(() => {});
          const token = targetProj.portalToken || targetProj.presupuestoId || targetProj.id;
          if (token) savePortalCloud(token, { token, portalConfig: updatedConfig }).catch(() => {});
          window.dispatchEvent(new CustomEvent('goglite_proyectos_synced'));
        }
      } catch (err) {
        console.warn('Error extendiendo suscripción CMS desde factura:', err);
      }
    }

    setNewInvoiceModalOpen(false);
    setSelectedSourceKey('');
    showToast(`Factura ${nuevaFactura.numeroFactura} emitida correctamente.`);

    try {
      await fetch(getBackendEndpoint('/api/finanzas/facturas'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nuevaFactura)
      });
    } catch {}
  };

  // Create Expense (Local-First + Backend Sync)
  const handleCreateExpense = async (e) => {
    e.preventDefault();
    const matchedFactura = facturas.find(f => f.cliente?.empresa === newExpenseForm.clienteAsociado);

    const nuevoGasto = {
      id: 'gas-' + Date.now(),
      concepto: newExpenseForm.concepto,
      categoria: newExpenseForm.categoria,
      proveedor: newExpenseForm.proveedor || 'Proveedor',
      monto: Number(newExpenseForm.monto) || 0,
      fecha: new Date().toISOString().split('T')[0],
      proyectoId: matchedFactura?.proyectoId || null,
      facturaId: matchedFactura?.id || null,
      clienteAsociado: newExpenseForm.clienteAsociado || 'General Agencia',
      frecuencia: newExpenseForm.frecuencia,
      pagado: true
    };

    setFinanzasState(prev => ({
      ...prev,
      gastos: [nuevoGasto, ...(prev.gastos || [])]
    }));

    setNewExpenseModalOpen(false);
    setNewExpenseForm({
      concepto: '',
      categoria: 'infraestructura',
      proveedor: '',
      monto: '',
      frecuencia: 'unico',
      clienteAsociado: 'General Agencia',
      proyectoId: ''
    });
    showToast('Gasto operativo registrado.');

    try {
      await fetch(getBackendEndpoint('/api/finanzas/gastos'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nuevoGasto)
      });
    } catch {}
  };

  // Delete Expense
  const handleDeleteExpense = async (id) => {
    if (!confirm('¿Eliminar este gasto operativo?')) return;
    setFinanzasState(prev => ({
      ...prev,
      gastos: (prev.gastos || []).filter(g => g.id !== id)
    }));
    showToast('Gasto eliminado.');

    try {
      await fetch(getBackendEndpoint(`/api/finanzas/gastos/${id}`), { method: 'DELETE' });
    } catch {}
  };

  // Create Time Entry (Local-First + Backend Sync)
  const handleCreateTimeEntry = async (e) => {
    e.preventDefault();
    const selFac = facturas.find(f => f.cliente?.empresa === newTimeForm.cliente);
    const nuevaHora = {
      id: 'time-' + Date.now(),
      proyectoId: selFac?.proyectoId || newTimeForm.proyectoId || null,
      cliente: newTimeForm.cliente || 'General Agencia',
      concepto: newTimeForm.concepto,
      categoria: newTimeForm.categoria,
      horas: Number(newTimeForm.horas) || 1,
      costoHora: Number(configuracion?.costoHoraInterno) || 20,
      fecha: new Date().toISOString().split('T')[0],
      responsable: newTimeForm.responsable
    };

    setFinanzasState(prev => ({
      ...prev,
      timeEntries: [nuevaHora, ...(prev.timeEntries || [])]
    }));

    setNewTimeModalOpen(false);
    setNewTimeForm({
      proyectoId: '',
      cliente: '',
      concepto: '',
      categoria: 'desarrollo',
      horas: 2.5,
      responsable: 'Senior Dev'
    });
    showToast('Horas registradas en bitácora.');

    try {
      await fetch(getBackendEndpoint('/api/finanzas/horas'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nuevaHora)
      });
    } catch {}
  };

  // Delete Time Entry
  const handleDeleteTimeEntry = async (id) => {
    if (!confirm('¿Eliminar este registro de horas?')) return;
    setFinanzasState(prev => ({
      ...prev,
      timeEntries: (prev.timeEntries || []).filter(t => t.id !== id)
    }));
    showToast('Registro de horas eliminado.');

    try {
      await fetch(getBackendEndpoint(`/api/finanzas/horas/${id}`), { method: 'DELETE' });
    } catch {}
  };

  // Save Financial Configuration
  const handleSaveConfig = async (e) => {
    e.preventDefault();
    setFinanzasState(prev => ({
      ...prev,
      configuracion: configForm
    }));
    showToast('Configuración financiera y bancaria guardada.');

    try {
      await fetch(getBackendEndpoint('/api/finanzas/configuracion'), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(configForm)
      });
    } catch {}
  };

  // Handlers para Administración Multi-Cuenta Bancaria (DO, US uglyCash, SV)
  const handleOpenAddAccount = (presetKey = null) => {
    let initial = {
      id: `cta-${Date.now()}`,
      pais: 'DO',
      banco: '',
      tipo: 'Cuenta Corriente Comercial',
      numero: '',
      titular: configForm.emisor?.empresa || 'Víctor Matos',
      moneda: 'USD',
      instrucciones: '',
      activa: true,
      predeterminada: false
    };

    if (presetKey === 'uglycash') {
      initial = {
        id: `cta-us-uglycash-${Date.now()}`,
        pais: 'US',
        banco: 'uglyCash (Remesas Instantáneas EE.UU.)',
        tipo: 'uglyCash Tag / Billetera Digital',
        numero: '$victormatos',
        titular: 'Víctor Matos',
        moneda: 'USD',
        instrucciones: 'Envío instantáneo de remesas sin comisiones desde EE.UU. a través de la app uglyCash con tag $victormatos',
        activa: true,
        predeterminada: true
      };
    } else if (presetKey === 'banreservas') {
      initial = {
        id: `cta-do-banreservas-${Date.now()}`,
        pais: 'DO',
        banco: 'Banreservas (Banco de Reservas)',
        tipo: 'Cuenta de Ahorros / Corriente',
        numero: '960-0012948-1',
        titular: 'Víctor Matos',
        moneda: 'DOP',
        instrucciones: 'Transferencia local en pesos dominicanos (DOP) vía red ACH / Banreservas',
        activa: true,
        predeterminada: false
      };
    } else if (presetKey === 'popular') {
      initial = {
        id: `cta-do-popular-${Date.now()}`,
        pais: 'DO',
        banco: 'Banco Popular Dominicano',
        tipo: 'Cuenta Corriente Comercial (LBTR / ACH)',
        numero: '7829-1928-3011',
        titular: 'Goglite Digital DO · Víctor Matos',
        moneda: 'USD',
        instrucciones: 'Transferencia LBTR en USD o ACH interbancario',
        activa: true,
        predeterminada: true
      };
    } else if (presetKey === 'agricola') {
      initial = {
        id: `cta-sv-agricola-${Date.now()}`,
        pais: 'SV',
        banco: 'Banco Agrícola El Salvador',
        tipo: 'Cuenta Corriente Empresarial (Transferencia365)',
        numero: '0031-0029-4821',
        titular: 'Goglite Agency SV · Víctor Matos',
        moneda: 'USD',
        instrucciones: 'Transferencia directa Transferencia365 o ACH en El Salvador',
        activa: true,
        predeterminada: true
      };
    }

    setEditingAccountId(null);
    setAccountForm(initial);
    setAccountModalOpen(true);
  };

  const handleOpenEditAccount = (acc) => {
    setEditingAccountId(acc.id);
    setAccountForm({ ...acc });
    setAccountModalOpen(true);
  };

  const handleSaveAccountModal = (e) => {
    e.preventDefault();
    const currentList = normalizeCuentasBancarias(configForm.cuentasBancarias);
    let updatedList;
    if (editingAccountId) {
      updatedList = currentList.map(item => item.id === editingAccountId ? { ...accountForm } : item);
    } else {
      updatedList = [...currentList, { ...accountForm, id: accountForm.id || `cta-${Date.now()}` }];
    }

    if (accountForm.predeterminada) {
      const targetId = editingAccountId || accountForm.id;
      updatedList = updatedList.map(item => {
        if (item.pais === accountForm.pais && item.id !== targetId) {
          return { ...item, predeterminada: false };
        }
        return item;
      });
    }

    const normalized = normalizeCuentasBancarias(updatedList);
    const newConfig = {
      ...configForm,
      cuentasBancarias: normalized
    };

    setConfigForm(newConfig);
    setFinanzasState(prev => ({
      ...prev,
      configuracion: newConfig
    }));
    setAccountModalOpen(false);
    showToast(`Cuenta "${accountForm.banco}" guardada correctamente.`);

    try {
      fetch(getBackendEndpoint('/api/finanzas/configuracion'), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newConfig)
      });
    } catch {}
  };

  const handleToggleAccountActive = (accId) => {
    const currentList = normalizeCuentasBancarias(configForm.cuentasBancarias);
    const updatedList = currentList.map(item => {
      if (item.id === accId) {
        return { ...item, activa: !item.activa };
      }
      return item;
    });

    const normalized = normalizeCuentasBancarias(updatedList);
    const newConfig = {
      ...configForm,
      cuentasBancarias: normalized
    };

    setConfigForm(newConfig);
    setFinanzasState(prev => ({ ...prev, configuracion: newConfig }));
    showToast('Estado de cuenta actualizado.');

    try {
      fetch(getBackendEndpoint('/api/finanzas/configuracion'), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newConfig)
      });
    } catch {}
  };

  const handleToggleAccountDefault = (accId) => {
    const currentList = normalizeCuentasBancarias(configForm.cuentasBancarias);
    const target = currentList.find(a => a.id === accId);
    if (!target) return;

    const updatedList = currentList.map(item => {
      if (item.pais === target.pais) {
        return { ...item, predeterminada: item.id === accId };
      }
      return item;
    });

    const normalized = normalizeCuentasBancarias(updatedList);
    const newConfig = {
      ...configForm,
      cuentasBancarias: normalized
    };

    setConfigForm(newConfig);
    setFinanzasState(prev => ({ ...prev, configuracion: newConfig }));
    showToast(`Cuenta "${target.banco}" establecida como predeterminada.`);

    try {
      fetch(getBackendEndpoint('/api/finanzas/configuracion'), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newConfig)
      });
    } catch {}
  };

  const handleDeleteAccount = (accId) => {
    const currentList = normalizeCuentasBancarias(configForm.cuentasBancarias);
    if (currentList.length <= 1) {
      alert('Debes mantener al menos una cuenta bancaria registrada.');
      return;
    }
    const acc = currentList.find(a => a.id === accId);
    if (!window.confirm(`¿Estás seguro de eliminar la cuenta "${acc?.banco}"?`)) return;

    const updatedList = currentList.filter(item => item.id !== accId);
    const normalized = normalizeCuentasBancarias(updatedList);
    const newConfig = {
      ...configForm,
      cuentasBancarias: normalized
    };

    setConfigForm(newConfig);
    setFinanzasState(prev => ({ ...prev, configuracion: newConfig }));
    showToast('Cuenta eliminada.');

    try {
      fetch(getBackendEndpoint('/api/finanzas/configuracion'), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newConfig)
      });
    } catch {}
  };

  // Handlers del Cronómetro de 1-Clic (Opción 2 · Time Tracking en Tiempo Real)
  const handleStartTimer = (targetProject = null) => {
    setActiveTimer(prev => {
      const now = Date.now();
      let updated = { ...prev };

      if (targetProject) {
        updated.proyectoId = targetProject.proyectoId || targetProject.facturaId || '';
        updated.cliente = targetProject.cliente || targetProject.cliente?.empresa || '';
        if (!updated.concepto) updated.concepto = 'Desarrollo & Configuración';
      } else if (!updated.cliente && facturas.length > 0) {
        updated.cliente = facturas[0].cliente?.empresa || 'General Agencia';
        updated.proyectoId = facturas[0].proyectoId || null;
      }

      return {
        ...updated,
        isRunning: true,
        isPaused: false,
        startTime: now
      };
    });

    const name = targetProject?.cliente || activeTimer.cliente || 'Sesión de trabajo';
    showToast(`⏱️ Cronómetro en marcha para: ${name}`);
  };

  const handlePauseTimer = () => {
    const total = getElapsedSeconds(activeTimer);
    setActiveTimer(prev => ({
      ...prev,
      isRunning: true,
      isPaused: true,
      startTime: null,
      accumulatedSeconds: total
    }));
    showToast(`⏸️ Cronómetro pausado (${formatTime(total)})`);
  };

  const handleOpenStopModal = () => {
    const totalSecs = getElapsedSeconds(activeTimer);
    const horasDecimal = Math.max(0.1, Math.round((totalSecs / 3600) * 100) / 100);

    setStopTimerForm({
      horas: horasDecimal,
      cliente: activeTimer.cliente || (facturas[0]?.cliente?.empresa || 'General Agencia'),
      proyectoId: activeTimer.proyectoId || null,
      concepto: activeTimer.concepto || 'Implementación & Desarrollo Web',
      categoria: activeTimer.categoria || 'desarrollo',
      responsable: activeTimer.responsable || 'Senior Dev'
    });
    setStopTimerModalOpen(true);
  };

  const handleConfirmSaveTimer = async (e) => {
    e.preventDefault();
    const nuevo = {
      id: 'time-' + Date.now(),
      proyectoId: stopTimerForm.proyectoId || null,
      cliente: stopTimerForm.cliente || 'General Agencia',
      concepto: stopTimerForm.concepto || 'Sesión de trabajo cronometrada',
      categoria: stopTimerForm.categoria || 'desarrollo',
      horas: Number(stopTimerForm.horas) || 1,
      costoHora: configuracion.costoHoraInterno || 20,
      fecha: new Date().toISOString().split('T')[0],
      responsable: stopTimerForm.responsable || 'Senior Dev'
    };

    setFinanzasState(prev => ({
      ...prev,
      timeEntries: [nuevo, ...(prev.timeEntries || [])]
    }));

    setActiveTimer(DEFAULT_TIMER_STATE);
    setStopTimerModalOpen(false);
    showToast(`✓ Registradas ${nuevo.horas}h para ${nuevo.cliente} en la bitácora contable.`);

    try {
      await fetch(getBackendEndpoint('/api/finanzas/horas'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nuevo)
      });
    } catch {}
  };

  const handleResetTimer = () => {
    const total = getElapsedSeconds(activeTimer);
    if (total > 60 && !confirm('¿Deseas reiniciar el cronómetro a cero? El tiempo actual se descartará.')) {
      return;
    }
    setActiveTimer(DEFAULT_TIMER_STATE);
    showToast('Cronómetro restablecido a 00:00:00');
  };

  // Limpiar todas las facturas, gastos y registros de horas para prueba limpia manual
  const handleClearFinanzasData = () => {
    if (!window.confirm('¿Deseas vaciar todas las facturas, gastos y registros de horas para comenzar una prueba limpia? Tus cuentas bancarias configuradas se mantendrán intactas.')) return;
    const cleanState = {
      facturas: [],
      gastos: [],
      timeEntries: [],
      configuracion: finanzasState.configuracion || DEFAULT_CONFIGURACION
    };
    setFinanzasState(cleanState);
    try {
      saveAppStateCloud('finanzas_v1', 'finanzas', cleanState).catch(() => {});
    } catch {}
    setActiveTimer(DEFAULT_TIMER_STATE);
    showToast('✓ Módulo 7 (Rentabilidad & P&L) limpio para tu prueba manual.');
    try {
      fetch(getBackendEndpoint('/api/finanzas/reset'), { method: 'POST' });
    } catch {}
  };

  // Print or Save PDF using Corporate Automated HTML Invoice Template ($0 Cost)
  const handlePrintInvoicePdf = (invoice) => {
    const html = buildCorporateInvoiceHtml(invoice, configuracion);
    printHtmlViaHiddenIframe(html);
  };

  // Download Standalone HTML Invoice ($0 Cost)
  const handleDownloadInvoiceHtml = (invoice) => {
    const html = buildCorporateInvoiceHtml(invoice, configuracion);
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${invoice.numeroFactura}_${(invoice.cliente?.empresa || 'Cliente').replace(/[^a-zA-Z0-9]/g, '_')}.html`;
    a.click();
    URL.revokeObjectURL(url);
    showToast(`Factura ${invoice.numeroFactura}.html descargada.`);
  };

  // Export CSV Contable ($0 Cost)
  const handleExportCsv = () => {
    const headers = [
      'Nº Factura',
      'Origen',
      'Cliente',
      'País',
      'Fecha Emisión',
      'Precio Venta USD',
      'Cobrado USD',
      'Saldo Pendiente USD',
      'Gastos Directos USD',
      'Horas Invertidas',
      'Coste Horas USD',
      'Beneficio Neto USD',
      'Margen %',
      'Tarifa Efectiva USD/h'
    ];

    const rows = proyectosRentabilidad.map(p => {
      const fac = facturas.find(f => f.id === p.facturaId);
      return [
        `"${p.numeroFactura}"`,
        `"${(p.origenModulo || '').replace(/"/g, '""')}"`,
        `"${(p.cliente || '').replace(/"/g, '""')}"`,
        `"${p.pais}"`,
        `"${fac?.fechaEmision || ''}"`,
        p.precioVendido.toFixed(2),
        p.cobrado.toFixed(2),
        p.saldoPendiente.toFixed(2),
        p.gastosDirectos.toFixed(2),
        p.horasInvertidas,
        p.costeHoras.toFixed(2),
        p.gananciaNeta.toFixed(2),
        `${p.margenUnitario}%`,
        p.tarifaEfectivaHora
      ];
    });

    const csv = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Goglite_Rentabilidad_PL_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Reporte contable CSV exportado.');
  };

  // Listas filtradas contextualmente por cada pestaña especializada
  const filteredFacturas = facturas.filter(f => {
    const matchCountry = facturaCountry === 'ALL' || f.cliente?.pais === facturaCountry || (facturaCountry === 'US' && (f.cuentaBancariaId?.includes('uglycash') || f.metodoPago?.toLowerCase().includes('uglycash') || f.cliente?.pais === 'US'));
    const matchStatus = facturaStatus === 'ALL' || f.estado === facturaStatus;

    // Filtro contextual por cliente (cuando se pulsa 'Ver Factura' en Rentabilidad Unitaria)
    const matchClient = !facturaClientFilter || (() => {
      if (typeof facturaClientFilter === 'object' && facturaClientFilter !== null) {
        if (Array.isArray(facturaClientFilter.facturaIds) && facturaClientFilter.facturaIds.includes(f.id)) return true;
        if (facturaClientFilter.facturaId && f.id === facturaClientFilter.facturaId) return true;
        if (facturaClientFilter.proyectoId && f.proyectoId && f.proyectoId === facturaClientFilter.proyectoId) return true;
        if (facturaClientFilter.presupuestoId && f.presupuestoId && f.presupuestoId === facturaClientFilter.presupuestoId) return true;
      }
      const targetName = (typeof facturaClientFilter === 'string' ? facturaClientFilter : facturaClientFilter?.nombre || '').toLowerCase().trim();
      if (!targetName) return true;
      const fEmp = (f.cliente?.empresa || '').toLowerCase().trim();
      const fCont = (f.cliente?.contacto || '').toLowerCase().trim();
      return fEmp === targetName || fEmp.includes(targetName) || targetName.includes(fEmp) || fCont === targetName;
    })();

    const term = facturaSearch.toLowerCase().trim();
    const matchSearch = !term ||
      f.cliente?.empresa?.toLowerCase().includes(term) ||
      f.numeroFactura?.toLowerCase().includes(term) ||
      f.concepto?.toLowerCase().includes(term) ||
      f.origenModulo?.toLowerCase().includes(term);
    return matchCountry && matchStatus && matchClient && matchSearch;
  });

  // Auto-seleccionar la primera factura al entrar a la pestaña Facturas si ninguna está seleccionada
  useEffect(() => {
    if (activeTab === 'facturas' && !selectedInvoice && filteredFacturas.length > 0) {
      handleSelectInvoice(filteredFacturas[0]);
    }
  }, [activeTab, selectedInvoice, filteredFacturas]);

  const filteredRentabilidad = proyectosRentabilidad.filter(p => {
    const matchCountry = resumenCountry === 'ALL' || p.pais === resumenCountry;
    const matchHealth = resumenMarginFilter === 'ALL' || 
      (resumenMarginFilter === 'healthy' && p.esSaludable) || 
      (resumenMarginFilter === 'warning' && !p.esSaludable);
    const term = resumenSearch.toLowerCase().trim();
    const matchSearch = !term ||
      p.cliente?.toLowerCase().includes(term) ||
      p.numeroFactura?.toLowerCase().includes(term) ||
      p.origenModulo?.toLowerCase().includes(term);
    return matchCountry && matchHealth && matchSearch;
  });

  const filteredGastos = gastos.filter(g => {
    const matchCategory = gastoCategory === 'ALL' || g.categoria === gastoCategory;
    const term = gastoSearch.toLowerCase().trim();
    const matchSearch = !term ||
      g.concepto?.toLowerCase().includes(term) ||
      g.proveedor?.toLowerCase().includes(term) ||
      g.clienteAsociado?.toLowerCase().includes(term);
    return matchCategory && matchSearch;
  });

  const filteredTimeEntries = timeEntries.filter(t => {
    const term = horasSearch.toLowerCase().trim();
    return !term ||
      t.cliente?.toLowerCase().includes(term) ||
      t.concepto?.toLowerCase().includes(term) ||
      t.responsable?.toLowerCase().includes(term);
  });

  return (
    <div className="flex-1 bg-[#080b11] text-slate-100 flex flex-col gap-5">
      
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-emerald-600 text-white px-4 py-2.5 rounded-xl shadow-2xl font-semibold text-xs">
          <CheckCircle2 className="w-4 h-4" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* 1. EXECUTIVE P&L HEADER & TIME / MARKET PERIOD CONTROLS */}
      <div className="p-4 rounded-xl bg-[#0e131f] border border-slate-800/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-white flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-orange-500" />
              <span>Flujo Financiero & Margen Operativo</span>
            </span>
            <span className="text-[11px] font-mono text-orange-400 bg-orange-500/10 border border-orange-500/20 px-2.5 py-0.5 rounded-full font-semibold flex items-center gap-1">
              <Calendar className="w-3 h-3 text-orange-400" />
              <span>{getPeriodLabel(kpiPeriod)}</span>
            </span>
            {kpiMarket !== 'ALL' && (
              <span className="text-[11px] font-mono text-sky-400 bg-sky-500/10 border border-sky-500/20 px-2 py-0.5 rounded-full font-semibold">
                {kpiMarket === 'SV' ? '🇸🇻 El Salvador' : '🇩🇴 Rep. Dominicana'}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Consolidado ejecutivo en tiempo real: Facturación emitida, recaudación en caja bancaria y costes de producción.
          </p>
        </div>

        {/* Period & Market Filter Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Market Segment */}
          <div className="flex items-center bg-[#131926] border border-slate-800 rounded-lg p-0.5 text-xs">
            <button
              onClick={() => setKpiMarket('ALL')}
              className={`px-2.5 py-1 rounded-md transition-colors ${kpiMarket === 'ALL' ? 'bg-orange-600 text-white font-semibold' : 'text-slate-400 hover:text-slate-200'}`}
              title="Consolidado Global"
            >
              Global
            </button>
            <button
              onClick={() => setKpiMarket('SV')}
              className={`px-2.5 py-1 rounded-md transition-colors ${kpiMarket === 'SV' ? 'bg-orange-600 text-white font-semibold' : 'text-slate-400 hover:text-slate-200'}`}
              title="Filtrar por El Salvador"
            >
              🇸🇻 SV
            </button>
            <button
              onClick={() => setKpiMarket('DO')}
              className={`px-2.5 py-1 rounded-md transition-colors ${kpiMarket === 'DO' ? 'bg-orange-600 text-white font-semibold' : 'text-slate-400 hover:text-slate-200'}`}
              title="Filtrar por República Dominicana"
            >
              🇩🇴 DO
            </button>
          </div>

          {/* Period Segment */}
          <div className="flex items-center bg-[#131926] border border-slate-800 rounded-lg p-0.5 text-xs">
            <button
              onClick={() => setKpiPeriod('este_mes')}
              className={`px-2.5 py-1 rounded-md transition-colors ${kpiPeriod === 'este_mes' ? 'bg-slate-800 text-orange-400 font-semibold' : 'text-slate-400 hover:text-slate-200'}`}
            >
              Este Mes
            </button>
            <button
              onClick={() => setKpiPeriod('mes_anterior')}
              className={`px-2.5 py-1 rounded-md transition-colors ${kpiPeriod === 'mes_anterior' ? 'bg-slate-800 text-orange-400 font-semibold' : 'text-slate-400 hover:text-slate-200'}`}
            >
              Mes Anterior
            </button>
            <button
              onClick={() => setKpiPeriod('trimestre')}
              className={`px-2.5 py-1 rounded-md transition-colors ${kpiPeriod === 'trimestre' ? 'bg-slate-800 text-orange-400 font-semibold' : 'text-slate-400 hover:text-slate-200'}`}
            >
              Trimestre
            </button>
            <button
              onClick={() => setKpiPeriod('anio')}
              className={`px-2.5 py-1 rounded-md transition-colors ${kpiPeriod === 'anio' ? 'bg-slate-800 text-orange-400 font-semibold' : 'text-slate-400 hover:text-slate-200'}`}
            >
              Año
            </button>
            <button
              onClick={() => setKpiPeriod('historico')}
              className={`px-2.5 py-1 rounded-md transition-colors ${kpiPeriod === 'historico' ? 'bg-slate-800 text-orange-400 font-semibold' : 'text-slate-400 hover:text-slate-200'}`}
            >
              Histórico
            </button>
          </div>
        </div>
      </div>

      {/* 2. TOP METRICS P&L DASHBOARD (DRIVEN BY KPI PERIOD & MARKET) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        
        {/* Facturación Total */}
        <div className="p-4 rounded-xl bg-[#0e131f] border border-slate-800/80 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase text-slate-400 font-semibold">Facturación Bruta</span>
            <span className="p-1.5 rounded-lg bg-orange-500/10 text-orange-400"><DollarSign className="w-4 h-4" /></span>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-black text-white font-mono">
              ${kpiDerived.totalFacturado.toLocaleString()} <span className="text-xs font-normal text-slate-400">USD</span>
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">{kpiDerived.proyectosCount} proyectos en período</div>
          </div>
        </div>

        {/* Total Cobrado en Caja */}
        <div className="p-4 rounded-xl bg-[#0e131f] border border-slate-800/80 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase text-emerald-400 font-semibold">Cobrado Real (Caja)</span>
            <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400"><Wallet className="w-4 h-4" /></span>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-black text-emerald-400 font-mono">
              ${kpiDerived.totalCobrado.toLocaleString()} <span className="text-xs font-normal text-slate-400">USD</span>
            </div>
            <div className="text-[10px] text-emerald-500/80 mt-0.5">Liquidez efectiva en banco</div>
          </div>
        </div>

        {/* Saldo Pendiente por Cobrar */}
        <div className="p-4 rounded-xl bg-[#0e131f] border border-slate-800/80 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase text-amber-400 font-semibold">Cuentas por Cobrar</span>
            <span className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400"><Clock className="w-4 h-4" /></span>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-black text-amber-400 font-mono">
              ${kpiDerived.saldoPorCobrar.toLocaleString()} <span className="text-xs font-normal text-slate-400">USD</span>
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">Saldos contra entrega final</div>
          </div>
        </div>

        {/* Gastos y Costes Operativos */}
        <div className="p-4 rounded-xl bg-[#0e131f] border border-slate-800/80 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase text-rose-400 font-semibold">Costes Totales</span>
            <span className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400"><ArrowDownRight className="w-4 h-4" /></span>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-black text-rose-400 font-mono">
              ${kpiDerived.totalCostosReales.toLocaleString()} <span className="text-xs font-normal text-slate-400">USD</span>
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">
              Directos (${kpiDerived.totalGastosOperativos.toFixed(0)}) + Horas (${kpiDerived.costeManoObraTotal.toFixed(0)})
            </div>
          </div>
        </div>

        {/* Margen Neto Real (%) */}
        <div className="p-4 rounded-xl bg-[#0e131f] border border-slate-800/80 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase text-sky-400 font-semibold">Margen Neto Real</span>
            <span className="p-1.5 rounded-lg bg-sky-500/10 text-sky-400"><TrendingUp className="w-4 h-4" /></span>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-black text-sky-400 font-mono">
              {kpiDerived.margenNetoPorcentaje}%
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">
              Beneficio Neto: <span className="font-bold text-white">${kpiDerived.beneficioNetoReal.toLocaleString()} USD</span>
            </div>
          </div>
        </div>

      </div>

      {/* 3. NAVIGATION BAR (SUB-PESTAÑAS LIMPIAS) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-2 overflow-x-auto">
        <div className="flex flex-wrap items-center bg-[#131926] border border-slate-800 rounded-lg p-0.5 text-xs gap-0.5">
          <button
            onClick={() => setActiveTab('resumen')}
            className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-colors ${activeTab === 'resumen' ? 'bg-slate-800 text-orange-400 font-semibold' : 'text-slate-400 hover:text-slate-200'}`}
          >
            <PieChart className="w-3.5 h-3.5" />
            <span>Rentabilidad Unitaria</span>
          </button>
          <button
            onClick={() => setActiveTab('facturas')}
            className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-colors ${activeTab === 'facturas' ? 'bg-slate-800 text-orange-400 font-semibold' : 'text-slate-400 hover:text-slate-200'}`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Facturas & Proformas ({facturas.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('gastos')}
            className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-colors ${activeTab === 'gastos' ? 'bg-slate-800 text-orange-400 font-semibold' : 'text-slate-400 hover:text-slate-200'}`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>Gastos ({gastos.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('horas')}
            className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-colors relative ${activeTab === 'horas' ? 'bg-slate-800 text-orange-400 font-semibold' : 'text-slate-400 hover:text-slate-200'}`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Time Tracking ({timeEntries.length})</span>
            {activeTimer.isRunning && (
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping absolute -top-0.5 -right-0.5" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('config')}
            className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-colors ${activeTab === 'config' ? 'bg-slate-800 text-orange-400 font-semibold' : 'text-slate-400 hover:text-slate-200'}`}
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Bancos & Tarifas</span>
          </button>
        </div>

        {/* Mini Stopwatch Live Pill if timer is running or has elapsed time */}
        {(activeTimer.isRunning || displaySeconds > 0) && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs font-mono self-start sm:self-auto">
            <span className={`w-2 h-2 rounded-full ${activeTimer.isRunning && !activeTimer.isPaused ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
            <button
              onClick={() => setActiveTab('horas')}
              className="flex items-center gap-1 font-bold hover:text-white transition-colors"
              title="Ir a pestaña Time Tracking"
            >
              <Timer className="w-3.5 h-3.5 text-emerald-400" />
              <span>{formatTime(displaySeconds)}</span>
            </button>
            {activeTimer.isRunning && !activeTimer.isPaused ? (
              <button
                onClick={handlePauseTimer}
                title="Pausar cronómetro"
                className="p-0.5 hover:text-white"
              >
                <Pause className="w-3 h-3 text-amber-300" />
              </button>
            ) : activeTimer.isPaused ? (
              <button
                onClick={() => handleStartTimer()}
                title="Reanudar cronómetro"
                className="p-0.5 hover:text-white"
              >
                <Play className="w-3 h-3 text-emerald-400" />
              </button>
            ) : null}
            <button
              onClick={handleOpenStopModal}
              title="Detener y registrar en bitácora"
              className="p-0.5 hover:text-white"
            >
              <Square className="w-3 h-3 text-rose-400" />
            </button>
          </div>
        )}
      </div>

      {/* 3. TAB 1: RENTABILIDAD POR PROYECTO (UNIT ECONOMICS) */}
      {activeTab === 'resumen' && (
        <div className="space-y-5">
          
          {/* Health & Retrospective Banner */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-950/30 via-[#0e1422] to-[#0e1422] border border-emerald-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shrink-0"></span>
              <div>
                <span className="font-bold text-emerald-300">Margen Saludable Objetivo: &ge; 60% · Tarifa Meta: ${configuracion.tarifaObjetivoHora} USD/h</span>
                <p className="text-[11px] text-slate-400">
                  Descuenta automáticamente gastos directos por cliente y coste hora interno (${configuracion.costoHoraInterno} USD/h). Conectado con Módulos 1, 2 y 3.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {onNavigateToPresupuestos && (
                <button
                  onClick={onNavigateToPresupuestos}
                  className="text-[11px] font-semibold bg-slate-800/80 hover:bg-slate-700 text-slate-200 px-3 py-1 rounded-lg border border-slate-700 transition-colors"
                >
                  Ir a Presupuestos (M3)
                </button>
              )}
              <span className="text-[11px] font-mono bg-emerald-500/20 text-emerald-400 px-2.5 py-1 rounded-full font-semibold">
                Autohosteado: $0 USD/mes
              </span>
            </div>
          </div>

          {/* Tab 1 Dedicated Controls Toolbar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-[#0e131f] border border-slate-800 rounded-xl">
            <div className="flex flex-wrap items-center gap-2">
              {/* Search */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={resumenSearch}
                  onChange={(e) => setResumenSearch(e.target.value)}
                  placeholder="Buscar proyecto o cliente..."
                  className="bg-[#131926] border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-orange-500 w-48"
                />
              </div>

              {/* Margin Health Filter */}
              <div className="flex items-center bg-[#131926] border border-slate-800 rounded-lg p-0.5 text-xs">
                <button
                  onClick={() => setResumenMarginFilter('ALL')}
                  className={`px-2.5 py-1 rounded-md transition-colors ${resumenMarginFilter === 'ALL' ? 'bg-orange-600 text-white font-semibold' : 'text-slate-400 hover:text-slate-200'}`}
                >
                  Todos
                </button>
                <button
                  onClick={() => setResumenMarginFilter('healthy')}
                  className={`px-2.5 py-1 rounded-md transition-colors ${resumenMarginFilter === 'healthy' ? 'bg-emerald-600 text-white font-semibold' : 'text-slate-400 hover:text-slate-200'}`}
                >
                  Saludables ≥60%
                </button>
                <button
                  onClick={() => setResumenMarginFilter('warning')}
                  className={`px-2.5 py-1 rounded-md transition-colors ${resumenMarginFilter === 'warning' ? 'bg-rose-600 text-white font-semibold' : 'text-slate-400 hover:text-slate-200'}`}
                >
                  En Riesgo &lt;60%
                </button>
              </div>

              {/* Country Filter */}
              <div className="flex items-center bg-[#131926] border border-slate-800 rounded-lg p-0.5 text-xs">
                <button
                  onClick={() => setResumenCountry('ALL')}
                  className={`px-2 py-1 rounded-md transition-colors ${resumenCountry === 'ALL' ? 'bg-slate-700 text-white font-semibold' : 'text-slate-400 hover:text-slate-200'}`}
                >
                  Todos
                </button>
                <button
                  onClick={() => setResumenCountry('SV')}
                  className={`px-2 py-1 rounded-md transition-colors ${resumenCountry === 'SV' ? 'bg-slate-700 text-white font-semibold' : 'text-slate-400 hover:text-slate-200'}`}
                >
                  🇸🇻 SV
                </button>
                <button
                  onClick={() => setResumenCountry('DO')}
                  className={`px-2 py-1 rounded-md transition-colors ${resumenCountry === 'DO' ? 'bg-slate-700 text-white font-semibold' : 'text-slate-400 hover:text-slate-200'}`}
                >
                  🇩🇴 DO
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleExportCsv}
                className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1.5 transition-colors border border-slate-700"
                title="Exportar reporte contable a Excel CSV ($0)"
              >
                <Download className="w-3.5 h-3.5 text-emerald-400" />
                <span>CSV</span>
              </button>
              <button
                onClick={() => {
                  loadRetrospectiveModules();
                  setNewInvoiceModalOpen(true);
                }}
                className="px-3 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Nueva Factura</span>
              </button>
            </div>
          </div>

          {/* Unit Profitability Table */}
          <div className="bg-[#0c1017] border border-slate-800/80 rounded-xl overflow-hidden shadow-sm">
            <div className="p-3 bg-[#101522] border-b border-slate-800 text-xs font-bold text-slate-200 flex items-center justify-between">
              <span>Desglose de Rentabilidad Unitaria por Cliente (Unit Economics)</span>
              <span className="text-[11px] font-mono text-slate-400">{filteredRentabilidad.length} proyectos auditados</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-[#0d121c] border-b border-slate-800 text-[11px] font-mono uppercase text-slate-400">
                  <tr>
                    <th className="p-3">Cliente & Origen</th>
                    <th className="p-3">País</th>
                    <th className="p-3 text-right">Precio Venta</th>
                    <th className="p-3 text-right">Cobrado / Saldo</th>
                    <th className="p-3 text-right">Gastos Directos</th>
                    <th className="p-3 text-right">Horas & Coste</th>
                    <th className="p-3 text-right">Beneficio Neto</th>
                    <th className="p-3 text-center">Margen %</th>
                    <th className="p-3 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-sans">
                  {filteredRentabilidad.map(p => (
                    <tr key={p.facturaId} className="hover:bg-slate-800/30 transition-colors">
                      <td className="p-3">
                        <div className="font-bold text-white">{p.cliente}</div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[10px] text-orange-400 font-mono font-semibold">{p.numerosFactura || p.numeroFactura}</span>
                          <span className="text-[10px] text-slate-500">· {p.origenModulo}</span>
                        </div>
                      </td>
                      <td className="p-3 font-mono text-xs">
                        {p.pais === 'SV' ? '🇸🇻 SV' : '🇩🇴 DO'}
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-white">
                        ${p.precioVendido.toLocaleString()}
                      </td>
                      <td className="p-3 text-right font-mono">
                        <div className="text-emerald-400 font-semibold">${p.cobrado.toLocaleString()}</div>
                        {p.saldoPendiente > 0 ? (
                          <div className="text-[10px] text-amber-400">Falta: ${p.saldoPendiente.toLocaleString()}</div>
                        ) : (
                          <div className="text-[10px] text-emerald-500">Pagado 100%</div>
                        )}
                      </td>
                      <td className="p-3 text-right font-mono text-rose-400">
                        ${p.gastosDirectos.toFixed(2)}
                      </td>
                      <td className="p-3 text-right font-mono text-slate-300">
                        <div>{p.horasInvertidas}h <span className="text-[10px] text-slate-500">(${p.tarifaEfectivaHora}/h)</span></div>
                        <div className="text-[10px] text-slate-500">Coste: ${p.costeHoras}</div>
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-emerald-400">
                        {p.gananciaNeta >= 0 ? `+$${p.gananciaNeta.toFixed(2)}` : `-$${Math.abs(p.gananciaNeta).toFixed(2)}`}
                      </td>
                      <td className="p-3 text-center font-mono">
                        <span className={`px-2 py-0.5 rounded-full font-bold text-xs ${
                          p.margenUnitario >= 60 ? 'bg-emerald-500/20 text-emerald-400' :
                          p.margenUnitario >= 40 ? 'bg-amber-500/20 text-amber-400' :
                          'bg-rose-500/20 text-rose-400'
                        }`}>
                          {p.margenUnitario}%
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => {
                            const found = facturas.find(f => (p.facturaIds && p.facturaIds.includes(f.id)) || f.id === p.facturaId);
                            setFacturaClientFilter({
                              nombre: p.cliente,
                              facturaId: p.facturaId,
                              facturaIds: p.facturaIds,
                              proyectoId: p.proyectoId,
                              presupuestoId: p.presupuestoId
                            });
                            setFacturaSearch('');
                            setFacturaStatus('ALL');
                            setFacturaCountry('ALL');
                            if (found) {
                              handleSelectInvoice(found);
                            }
                            setActiveTab('facturas');
                          }}
                          className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors"
                          title={`Ver historial de facturas (${p.totalFacturasCount || 1}) de ${p.cliente}`}
                        >
                          {p.totalFacturasCount > 1 ? `Ver Facturas (${p.totalFacturasCount})` : 'Ver Factura'}
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredRentabilidad.length === 0 && (
                    <tr>
                      <td colSpan="9" className="p-8 text-center text-slate-500">
                        <FileText className="w-8 h-8 mx-auto mb-2 opacity-30 text-slate-400" />
                        <p className="font-semibold text-slate-300">Sin proyectos ni facturas registradas</p>
                        <p className="text-[11px] text-slate-500 mt-1">
                          Crea una nueva factura o acepta una propuesta en el Módulo 3 para comenzar la auditoría de rentabilidad.
                        </p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* 4. TAB 2: GESTOR DE FACTURAS & PROFORMAS */}
      {activeTab === 'facturas' && (
        <div className="space-y-4">
          {/* Tab 2 Dedicated Controls Toolbar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-[#0e131f] border border-slate-800 rounded-xl">
            <div className="flex flex-wrap items-center gap-2">
              {/* Pill de Filtro Activo por Cliente con opción para ver todo el mes */}
              {facturaClientFilter && (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-orange-500/15 border border-orange-500/40 text-xs text-orange-300 font-medium shadow-sm">
                  <span>Cliente: <strong className="text-white">{typeof facturaClientFilter === 'string' ? facturaClientFilter : facturaClientFilter?.nombre}</strong></span>
                  <button
                    onClick={() => setFacturaClientFilter(null)}
                    className="ml-1 px-1.5 py-0.5 rounded bg-orange-500/20 hover:bg-orange-500/40 text-orange-200 text-[10px] font-bold flex items-center gap-1 transition-colors"
                    title="Mostrar todas las facturas del mes de todos los clientes"
                  >
                    <X className="w-3 h-3" />
                    <span>Ver todas del mes</span>
                  </button>
                </div>
              )}

              {/* Search */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={facturaSearch}
                  onChange={(e) => setFacturaSearch(e.target.value)}
                  placeholder="Buscar factura, cliente o concepto..."
                  className="bg-[#131926] border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-orange-500 w-52"
                />
              </div>

              {/* Status Filter */}
              <div className="flex items-center bg-[#131926] border border-slate-800 rounded-lg p-0.5 text-xs">
                <button
                  onClick={() => setFacturaStatus('ALL')}
                  className={`px-2.5 py-1 rounded-md transition-colors ${facturaStatus === 'ALL' ? 'bg-orange-600 text-white font-semibold' : 'text-slate-400 hover:text-slate-200'}`}
                >
                  Todas
                </button>
                <button
                  onClick={() => setFacturaStatus('cobrada')}
                  className={`px-2.5 py-1 rounded-md transition-colors ${facturaStatus === 'cobrada' ? 'bg-emerald-600 text-white font-semibold' : 'text-slate-400 hover:text-slate-200'}`}
                >
                  Cobradas 100%
                </button>
                <button
                  onClick={() => setFacturaStatus('parcial')}
                  className={`px-2.5 py-1 rounded-md transition-colors ${facturaStatus === 'parcial' ? 'bg-sky-600 text-white font-semibold' : 'text-slate-400 hover:text-slate-200'}`}
                >
                  Parciales
                </button>
                <button
                  onClick={() => setFacturaStatus('pendiente')}
                  className={`px-2.5 py-1 rounded-md transition-colors ${facturaStatus === 'pendiente' ? 'bg-amber-600 text-white font-semibold' : 'text-slate-400 hover:text-slate-200'}`}
                >
                  Pendientes
                </button>
              </div>

              {/* Country / Gateway Filter */}
              <div className="flex items-center bg-[#131926] border border-slate-800 rounded-lg p-0.5 text-xs">
                <button
                  onClick={() => setFacturaCountry('ALL')}
                  className={`px-2 py-1 rounded-md transition-colors ${facturaCountry === 'ALL' ? 'bg-slate-700 text-white font-semibold' : 'text-slate-400 hover:text-slate-200'}`}
                >
                  Todos
                </button>
                <button
                  onClick={() => setFacturaCountry('SV')}
                  className={`px-2 py-1 rounded-md transition-colors ${facturaCountry === 'SV' ? 'bg-slate-700 text-white font-semibold' : 'text-slate-400 hover:text-slate-200'}`}
                >
                  🇸🇻 SV
                </button>
                <button
                  onClick={() => setFacturaCountry('DO')}
                  className={`px-2 py-1 rounded-md transition-colors ${facturaCountry === 'DO' ? 'bg-slate-700 text-white font-semibold' : 'text-slate-400 hover:text-slate-200'}`}
                >
                  🇩🇴 DO
                </button>
                <button
                  onClick={() => setFacturaCountry('US')}
                  className={`px-2 py-1 rounded-md transition-colors ${facturaCountry === 'US' ? 'bg-slate-700 text-white font-semibold' : 'text-slate-400 hover:text-slate-200'}`}
                  title="uglyCash (EE.UU.)"
                >
                  🇺🇸 uglyCash
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleSyncRetrospectiveModules}
                className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1.5 transition-colors border border-slate-700"
                title="Sincronizar presupuestos aceptados (M3) y cierres CRM (M2)"
              >
                <RefreshCw className="w-3.5 h-3.5 text-orange-400" />
                <span>Sync M1-M3</span>
              </button>
              <button
                onClick={() => {
                  loadRetrospectiveModules();
                  setNewInvoiceModalOpen(true);
                }}
                className="px-3 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Nueva Factura</span>
              </button>
            </div>
          </div>

          {/* Split-View: Historial y Editor a la Izquierda + Live Preview A4 a la Derecha */}
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
            
            {/* COLUMNA IZQUIERDA (5 cols): Historial por Cuenta y Editor Interactivo */}
            <div className="xl:col-span-5 space-y-4">
              
              {/* 1. Historial de Facturas por Cuenta */}
              <div className="bg-[#0c1017] border border-slate-800/80 rounded-xl overflow-hidden shadow-sm">
                <div className="p-3 bg-[#101522] border-b border-slate-800 flex items-center justify-between text-xs font-bold text-slate-200">
                  <div className="flex items-center gap-2 min-w-0">
                    <FileText className="w-3.5 h-3.5 text-orange-400 shrink-0" />
                    <span className="truncate">
                      {facturaClientFilter 
                        ? `Historial: ${typeof facturaClientFilter === 'string' ? facturaClientFilter : facturaClientFilter?.nombre}`
                        : 'Historial de Facturas del Mes'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[11px] font-mono text-slate-400">
                      {filteredFacturas.length} {filteredFacturas.length === 1 ? 'registrada' : 'registradas'}
                    </span>
                    {facturaClientFilter && (
                      <button
                        onClick={() => setFacturaClientFilter(null)}
                        className="text-[10px] text-orange-400 hover:text-orange-300 underline font-normal transition-colors"
                        title="Ver el historial de todas las facturas del mes"
                      >
                        (Ver todas)
                      </button>
                    )}
                  </div>
                </div>

                <div className="max-h-72 overflow-y-auto divide-y divide-slate-800/60 font-sans p-2 space-y-1.5">
                  {filteredFacturas.map(fac => {
                    const isSelected = (selectedInvoice?.id === fac.id);
                    return (
                      <div
                        key={fac.id}
                        onClick={() => handleSelectInvoice(fac)}
                        className={`p-3 rounded-lg cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-orange-500/10 border border-orange-500/50 shadow-sm ring-1 ring-orange-500/30'
                            : 'bg-[#0f1422] border border-slate-800/80 hover:border-slate-700 hover:bg-slate-800/40'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-xs text-orange-400">{fac.numeroFactura}</span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
                              {fac.origenModulo || 'Directa'}
                            </span>
                          </div>
                          <span className={`px-2 py-0.5 rounded-full font-mono text-[9px] font-bold uppercase ${
                            fac.estado === 'cobrada' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                            fac.estado === 'parcial' ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30' :
                            'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          }`}>
                            {fac.estado === 'cobrada' ? 'Cobrada 100%' : fac.estado === 'parcial' ? 'Anticipo 50%' : 'Pendiente'}
                          </span>
                        </div>

                        <div className="mt-1.5 flex items-baseline justify-between gap-2">
                          <div className="min-w-0">
                            <div className="font-semibold text-xs text-white truncate">{fac.cliente?.empresa || 'Cliente Comercial'}</div>
                            <div className="text-[11px] text-slate-400 truncate max-w-xs">{fac.concepto}</div>
                          </div>
                          <div className="text-right shrink-0">
                            <div className="font-mono font-bold text-xs text-white">${Number(fac.total).toLocaleString()} USD</div>
                            <div className="text-[10px] font-mono text-emerald-400">Cobrado: ${Number(fac.montoCobrado || 0).toLocaleString()}</div>
                          </div>
                        </div>

                        <div className="mt-2 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[10px] text-slate-500 font-mono">
                          <span>Emisión: {fac.fechaEmision}</span>
                          <span className="text-amber-400/90 font-semibold">
                            Saldo: ${Math.max(0, Number(fac.total) - Number(fac.montoCobrado || 0)).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    );
                  })}

                  {filteredFacturas.length === 0 && (
                    <div className="p-6 text-center text-slate-500 space-y-2">
                      <FileText className="w-6 h-6 mx-auto mb-1.5 opacity-30 text-slate-400" />
                      <p className="font-semibold text-xs text-slate-300">
                        {facturaClientFilter
                          ? `No hay facturas registradas para "${typeof facturaClientFilter === 'string' ? facturaClientFilter : facturaClientFilter?.nombre}"`
                          : 'No hay facturas registradas'}
                      </p>
                      {facturaClientFilter && (
                        <button
                          onClick={() => setFacturaClientFilter(null)}
                          className="text-xs text-orange-400 hover:text-orange-300 underline font-medium block mx-auto"
                        >
                          Ver historial de todas las facturas del mes
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* 2. Editor Interactivo en Tiempo Real */}
              {selectedInvoice && (
                <div className="bg-[#0c1017] border border-slate-800/80 rounded-xl overflow-hidden shadow-sm space-y-4 p-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                    <div className="flex items-center gap-2">
                      <Sliders className="w-4 h-4 text-orange-400" />
                      <div>
                        <h3 className="text-xs font-bold text-white">Editor de Factura en Vivo</h3>
                        <p className="text-[10px] text-slate-400">{selectedInvoice.numeroFactura} · Reflejo inmediato en preview</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteInvoice(selectedInvoice.id)}
                      className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition-colors"
                      title="Eliminar factura"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Aprobación rápida de depósito (Habilita factura en el portal del cliente) */}
                  <div className="p-3 rounded-lg bg-[#111728] border border-slate-800 space-y-2.5">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-300 font-semibold">Aprobación de Depósito / Cobro:</span>
                      <span className={`font-mono text-[10px] px-2 py-0.5 rounded-full font-bold ${
                        selectedInvoice.estado === 'cobrada' ? 'bg-emerald-500/20 text-emerald-400' :
                        selectedInvoice.estado === 'parcial' ? 'bg-sky-500/20 text-sky-400' :
                        'bg-amber-500/20 text-amber-400'
                      }`}>
                        {selectedInvoice.estado === 'cobrada' ? 'Cobrada 100%' : selectedInvoice.estado === 'parcial' ? 'Abono Parcial' : 'Pendiente'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => handleQuickApprovePayment('anticipo')}
                        className={`py-1.5 px-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                          selectedInvoice.estado === 'parcial' && Number(selectedInvoice.montoCobrado) === Math.round(Number(selectedInvoice.total) * 0.5)
                            ? 'bg-sky-600 text-white shadow'
                            : 'bg-sky-500/15 hover:bg-sky-500/25 text-sky-300 border border-sky-500/30'
                        }`}
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Aprobar 50%</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleQuickApprovePayment('100')}
                        className={`py-1.5 px-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                          selectedInvoice.estado === 'cobrada'
                            ? 'bg-emerald-600 text-white shadow'
                            : 'bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/30'
                        }`}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Aprobar 100%</span>
                      </button>
                    </div>

                    {/* Campo Editable: Monto Cobrado / Abono Parcial */}
                    <div className="pt-2 border-t border-slate-800/80 space-y-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <label className="text-slate-300 font-semibold flex items-center gap-1">
                          <span>Monto Cobrado (USD):</span>
                          <span className="text-[10px] text-slate-500 font-normal">(Editable para abonos parciales)</span>
                        </label>
                        <span className="font-mono text-[10px] text-amber-400 font-semibold">
                          Saldo: ${Math.max(0, Number(selectedInvoice.total || 0) - (Number(selectedInvoice.montoCobrado) || 0)).toLocaleString()} USD
                        </span>
                      </div>
                      <div className="relative">
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-xs font-bold">$</span>
                        <input
                          type="number"
                          step="any"
                          min="0"
                          max={Number(selectedInvoice.total) || 999999}
                          value={selectedInvoice.montoCobrado ?? ''}
                          onChange={(e) => handleUpdateMontoCobrado(e.target.value)}
                          placeholder="Ingresa monto cobrado..."
                          className="w-full bg-[#161e31] border border-slate-700 hover:border-slate-600 focus:border-emerald-500 rounded-lg pl-7 pr-3 py-1.5 text-xs text-emerald-400 font-mono font-bold focus:outline-none transition-colors"
                        />
                      </div>
                      <p className="text-[10px] text-slate-500">
                        Si el cliente realizó un pago parcial, modifica aquí el importe exacto. El saldo y el documento se recalculan en tiempo real.
                      </p>
                    </div>
                  </div>

                  {/* Datos del Cliente y Fechas */}
                  <div className="space-y-2.5 text-xs">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] font-mono text-slate-400 block mb-1">Nº Factura:</label>
                        <input
                          type="text"
                          value={selectedInvoice.numeroFactura || ''}
                          onChange={(e) => handleUpdateActiveInvoiceField('numeroFactura', e.target.value)}
                          className="w-full bg-[#131926] border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-orange-500"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-mono text-slate-400 block mb-1">Empresa Cliente:</label>
                        <input
                          type="text"
                          value={selectedInvoice.cliente?.empresa || ''}
                          onChange={(e) => {
                            const cl = { ...(selectedInvoice.cliente || {}), empresa: e.target.value };
                            handleUpdateActiveInvoiceField('cliente', cl);
                          }}
                          className="w-full bg-[#131926] border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-orange-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] font-mono text-slate-400 block mb-1">Fecha Emisión:</label>
                        <input
                          type="date"
                          value={selectedInvoice.fechaEmision || ''}
                          onChange={(e) => handleUpdateActiveInvoiceField('fechaEmision', e.target.value)}
                          className="w-full bg-[#131926] border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-slate-300 font-mono focus:outline-none focus:border-orange-500"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-mono text-slate-400 block mb-1">Fecha Vencimiento:</label>
                        <input
                          type="date"
                          value={selectedInvoice.fechaVencimiento || ''}
                          onChange={(e) => handleUpdateActiveInvoiceField('fechaVencimiento', e.target.value)}
                          className="w-full bg-[#131926] border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-slate-300 font-mono focus:outline-none focus:border-orange-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] font-mono text-slate-400 block mb-1">Cuenta Bancaria de Destino:</label>
                      <select
                        value={selectedInvoice.cuentaBancariaId || ''}
                        onChange={(e) => {
                          const accId = e.target.value;
                          const accList = normalizeCuentasBancarias(configuracion.cuentasBancarias);
                          const chosen = accList.find(c => c.id === accId);
                          setSelectedInvoice(prev => ({
                            ...prev,
                            cuentaBancariaId: accId,
                            metodoPago: chosen?.banco || prev.metodoPago
                          }));
                        }}
                        className="w-full bg-[#131926] border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-orange-500"
                      >
                        {normalizeCuentasBancarias(configuracion.cuentasBancarias).map(acc => (
                          <option key={acc.id} value={acc.id}>
                            {acc.pais === 'DO' ? '🇩🇴' : acc.pais === 'US' ? '🇺🇸' : '🇸🇻'} {acc.banco} — {acc.numero} ({acc.moneda})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Entregables e Ítems (Coherentes con el presupuesto) */}
                  <div className="space-y-2 pt-2 border-t border-slate-800">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-200 uppercase tracking-wider">
                        Ítems & Entregables Facturados
                      </span>
                      <button
                        type="button"
                        onClick={handleAddNewItemToActiveInvoice}
                        className="px-2 py-1 rounded bg-orange-600/20 hover:bg-orange-600/30 text-orange-400 border border-orange-500/30 text-[10px] font-bold flex items-center gap-1 transition-colors"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Agregar Ítem</span>
                      </button>
                    </div>

                    <div className="space-y-2">
                      {(selectedInvoice.items || []).map((item, idx) => (
                        <div key={item.id || idx} className="p-2.5 rounded-lg bg-[#111728] border border-slate-800/80 space-y-1.5">
                          <div className="flex items-start justify-between gap-2">
                            <input
                              type="text"
                              value={item.descripcion || ''}
                              onChange={(e) => handleUpdateActiveInvoiceItem(idx, 'descripcion', e.target.value)}
                              placeholder="Descripción del entregable..."
                              className="flex-1 bg-[#161e31] border border-slate-700/80 rounded px-2 py-1 text-xs text-slate-200 focus:outline-none focus:border-orange-500 font-medium"
                            />
                            <button
                              type="button"
                              onClick={() => handleDeleteItemFromActiveInvoice(idx)}
                              disabled={(selectedInvoice.items || []).length <= 1}
                              className="p-1 rounded text-slate-500 hover:text-rose-400 disabled:opacity-30 transition-colors"
                              title="Eliminar este ítem"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <div className="flex items-center gap-2 text-xs">
                            <div className="flex items-center gap-1">
                              <span className="text-[10px] font-mono text-slate-400">Cant:</span>
                              <input
                                type="number"
                                min="1"
                                value={item.cantidad || 1}
                                onChange={(e) => handleUpdateActiveInvoiceItem(idx, 'cantidad', e.target.value)}
                                className="w-12 bg-[#161e31] border border-slate-700/80 rounded px-1.5 py-0.5 text-center text-xs font-mono text-white focus:outline-none focus:border-orange-500"
                              />
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="text-[10px] font-mono text-slate-400">Precio $:</span>
                              <input
                                type="number"
                                min="0"
                                value={item.precioUnitario || 0}
                                onChange={(e) => handleUpdateActiveInvoiceItem(idx, 'precioUnitario', e.target.value)}
                                className="w-20 bg-[#161e31] border border-slate-700/80 rounded px-1.5 py-0.5 text-right text-xs font-mono text-emerald-400 focus:outline-none focus:border-orange-500"
                              />
                            </div>
                            <div className="flex-1 text-right font-mono text-xs text-white font-bold">
                              Subtotal: ${Number(item.total || 0).toLocaleString()} USD
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Resumen de Totales y Saldo */}
                  <div className="p-3 rounded-lg bg-[#101522] border border-slate-800 space-y-1.5 text-xs">
                    <div className="flex justify-between text-slate-400">
                      <span>Subtotal Calculado:</span>
                      <span className="font-mono text-white">${Number(selectedInvoice.subtotal || selectedInvoice.total || 0).toLocaleString()} USD</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Total Facturado:</span>
                      <span className="font-mono font-bold text-orange-400 text-sm">${Number(selectedInvoice.total || 0).toLocaleString()} USD</span>
                    </div>
                    <div className="flex items-center justify-between text-emerald-400">
                      <span>Monto Cobrado (USD):</span>
                      <div className="flex items-center gap-1">
                        <span className="font-mono text-xs text-emerald-400 font-bold">$</span>
                        <input
                          type="number"
                          step="any"
                          min="0"
                          value={selectedInvoice.montoCobrado ?? ''}
                          onChange={(e) => handleUpdateMontoCobrado(e.target.value)}
                          className="w-24 bg-[#161e31] border border-slate-700 focus:border-emerald-500 rounded px-2 py-0.5 text-right font-mono font-bold text-xs text-emerald-400 focus:outline-none"
                        />
                      </div>
                    </div>
                    <div className="flex justify-between text-amber-400 border-t border-slate-800 pt-1">
                      <span>Saldo Pendiente:</span>
                      <span className="font-mono font-bold">${Math.max(0, Number(selectedInvoice.total || 0) - Number(selectedInvoice.montoCobrado || 0)).toLocaleString()} USD</span>
                    </div>
                  </div>

                  {/* Botón Guardar Cambios */}
                  <button
                    type="button"
                    onClick={handleSaveActiveInvoice}
                    className="w-full py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Guardar y Sincronizar Factura</span>
                  </button>
                </div>
              )}
            </div>

            {/* COLUMNA DERECHA (7 cols): Sticky Live Paper Sheet Preview */}
            <div className="xl:col-span-7 sticky top-6 space-y-3">
              {selectedInvoice ? (
                <>
                  {/* Top Preview Controls Bar */}
                  <div className="p-3 bg-[#0e1320] border border-slate-800 rounded-xl flex flex-wrap items-center justify-between gap-2 shadow-sm">
                    <div className="flex items-center gap-2">
                      <Eye className="w-4 h-4 text-orange-400" />
                      <span className="text-xs font-bold text-white">Vista Previa Oficial en Tiempo Real</span>
                      <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                        selectedInvoice.montoCobrado > 0
                          ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                          : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                      }`}>
                        {selectedInvoice.montoCobrado > 0 ? '✓ Habilitada en Portal Cliente' : '🔒 Pendiente de Pago'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleDownloadInvoiceHtml(selectedInvoice)}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1.5 border border-slate-700 transition-colors"
                        title="Descargar archivo HTML autosuficiente ($0)"
                      >
                        <Download className="w-3.5 h-3.5 text-orange-400" />
                        <span>HTML</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handlePrintInvoicePdf(selectedInvoice)}
                        className="px-3 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all"
                        title="Imprimir o guardar PDF"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>Imprimir / PDF</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setIsInvoiceFullscreenModalOpen(true)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
                        title="Ampliar en pantalla completa"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Hoja Corporativa Oficial A4 */}
                  <div className="overflow-hidden rounded-xl border border-slate-700/80 shadow-2xl">
                    <CorporateInvoiceDocument invoice={selectedInvoice} configuracion={configuracion} />
                  </div>
                </>
              ) : (
                <div className="p-12 text-center rounded-xl bg-[#0e1320] border border-slate-800 text-slate-500 space-y-2">
                  <FileText className="w-10 h-10 mx-auto opacity-30 text-slate-400" />
                  <p className="font-semibold text-white text-sm">Selecciona una factura</p>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    Elige una factura del historial a la izquierda para ver su vista previa oficial en tiempo real y editar sus conceptos.
                  </p>
                </div>
              )}
            </div>

          </div>
      </div>
      )}

      {/* 5. TAB 3: CONTROL DE GASTOS OPERATIVOS */}
      {activeTab === 'gastos' && (
        <div className="space-y-4">
          {/* Tab 3 Dedicated Controls Toolbar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-[#0e131f] border border-slate-800 rounded-xl">
            <div className="flex flex-wrap items-center gap-2">
              {/* Search */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={gastoSearch}
                  onChange={(e) => setGastoSearch(e.target.value)}
                  placeholder="Buscar gasto o proveedor..."
                  className="bg-[#131926] border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-orange-500 w-48"
                />
              </div>

              {/* Category Filter */}
              <div className="flex items-center bg-[#131926] border border-slate-800 rounded-lg p-0.5 text-xs">
                <button
                  onClick={() => setGastoCategory('ALL')}
                  className={`px-2.5 py-1 rounded-md transition-colors ${gastoCategory === 'ALL' ? 'bg-orange-600 text-white font-semibold' : 'text-slate-400 hover:text-slate-200'}`}
                >
                  Todas
                </button>
                <button
                  onClick={() => setGastoCategory('infraestructura')}
                  className={`px-2.5 py-1 rounded-md transition-colors ${gastoCategory === 'infraestructura' ? 'bg-rose-600 text-white font-semibold' : 'text-slate-400 hover:text-slate-200'}`}
                >
                  Infraestructura
                </button>
                <button
                  onClick={() => setGastoCategory('software')}
                  className={`px-2.5 py-1 rounded-md transition-colors ${gastoCategory === 'software' ? 'bg-rose-600 text-white font-semibold' : 'text-slate-400 hover:text-slate-200'}`}
                >
                  Software & APIs
                </button>
                <button
                  onClick={() => setGastoCategory('subcontratista')}
                  className={`px-2.5 py-1 rounded-md transition-colors ${gastoCategory === 'subcontratista' ? 'bg-rose-600 text-white font-semibold' : 'text-slate-400 hover:text-slate-200'}`}
                >
                  Subcontratistas
                </button>
                <button
                  onClick={() => setGastoCategory('operativo')}
                  className={`px-2.5 py-1 rounded-md transition-colors ${gastoCategory === 'operativo' ? 'bg-rose-600 text-white font-semibold' : 'text-slate-400 hover:text-slate-200'}`}
                >
                  Operativo
                </button>
              </div>
            </div>

            <button
              onClick={() => setNewExpenseModalOpen(true)}
              className="px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Registrar Gasto</span>
            </button>
          </div>

          <div className="bg-[#0c1017] border border-slate-800/80 rounded-xl overflow-hidden shadow-sm">
            <div className="p-3 bg-[#101522] border-b border-slate-800 text-xs font-bold text-slate-200 flex items-center justify-between">
              <span>Registro de Gastos Operativos Directos por Cliente & Agencia ($0 Suscripciones)</span>
              <span className="text-[11px] font-mono text-slate-400">Total: ${kpis.totalGastosOperativos.toFixed(2)} USD ({filteredGastos.length} registrados)</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-[#0d121c] border-b border-slate-800 text-[11px] font-mono uppercase text-slate-400">
                  <tr>
                    <th className="p-3">Concepto</th>
                    <th className="p-3">Proyecto / Cliente Asociado</th>
                    <th className="p-3">Categoría</th>
                    <th className="p-3">Proveedor</th>
                    <th className="p-3">Fecha</th>
                    <th className="p-3">Frecuencia</th>
                    <th className="p-3 text-right">Monto USD</th>
                    <th className="p-3 text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-sans">
                  {filteredGastos.map(g => (
                  <tr key={g.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="p-3 font-semibold text-white">
                      {g.concepto}
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded-md text-[11px] font-medium ${
                        g.clienteAsociado && g.clienteAsociado !== 'General Agencia'
                          ? 'bg-orange-500/15 text-orange-300 border border-orange-500/30'
                          : 'bg-slate-800 text-slate-400'
                      }`}>
                        {g.clienteAsociado || 'General Agencia'}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono text-[10px] uppercase">
                        {g.categoria}
                      </span>
                    </td>
                    <td className="p-3 text-slate-400">
                      {g.proveedor}
                    </td>
                    <td className="p-3 font-mono text-[11px] text-slate-500">
                      {g.fecha}
                    </td>
                    <td className="p-3 font-mono text-[11px] text-slate-400">
                      {g.frecuencia === 'mensual' ? 'Mensual Recurrente' : 'Pago Único'}
                    </td>
                    <td className="p-3 text-right font-mono font-bold text-rose-400">
                      ${Number(g.monto).toFixed(2)}
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => handleDeleteExpense(g.id)}
                        className="p-1 rounded text-slate-500 hover:text-rose-400 transition-colors"
                        title="Eliminar gasto"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredGastos.length === 0 && (
                  <tr>
                    <td colSpan="8" className="p-8 text-center text-slate-500">
                      <CreditCard className="w-8 h-8 mx-auto mb-2 opacity-30 text-slate-400" />
                      <p className="font-semibold text-slate-300">Sin gastos operativos registrados</p>
                      <p className="text-[11px] text-slate-500 mt-1">
                        Registra dominios, servidores o costos directos por cliente con el botón "Registrar Gasto".
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      )}

      {/* 6. TAB 4: CONTROL DE HORAS & TIME TRACKING */}
      {activeTab === 'horas' && (
        <div className="space-y-6">
          {/* CRONÓMETRO DE 1-CLIC INTEGRADO EN LA PLATAFORMA (Opción 2 · Live In-App Stopwatch) */}
          <div className="relative overflow-hidden p-5 rounded-2xl bg-gradient-to-br from-[#0e1626] via-[#0c121d] to-[#0a0e17] border border-emerald-500/30 shadow-xl">
            {/* Resplandor ambiental */}
            <div className="absolute top-0 right-0 w-80 h-40 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

            <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
              {/* Columna Izquierda: Reloj Digital y Estado en Vivo */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="p-3.5 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-400 shrink-0 flex items-center justify-center">
                  <Timer className={`w-8 h-8 ${activeTimer.isRunning && !activeTimer.isPaused ? 'animate-pulse text-emerald-300' : 'text-slate-400'}`} />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-bold">
                      Cronómetro de 1-Clic · Goglite Live Tracker
                    </span>
                    {activeTimer.isRunning && !activeTimer.isPaused ? (
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/40 animate-pulse">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                        EN VIVO
                      </span>
                    ) : activeTimer.isPaused ? (
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-bold border border-amber-500/40">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                        PAUSADO
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 text-[10px] font-bold border border-slate-700">
                        LISTO PARA INICIAR
                      </span>
                    )}
                  </div>
                  {/* Dígitos Grandes */}
                  <div className="flex items-baseline gap-3">
                    <span className={`text-4xl sm:text-5xl font-black font-mono tracking-tight ${activeTimer.isRunning && !activeTimer.isPaused ? 'text-emerald-300' : activeTimer.isPaused ? 'text-amber-300' : 'text-white'}`}>
                      {formatTime(displaySeconds)}
                    </span>
                    <span className="text-xs font-mono text-slate-400">
                      ≈ {(displaySeconds / 3600).toFixed(2)} hrs contables
                    </span>
                  </div>
                </div>
              </div>

              {/* Columna Derecha: Configuración Rápida y Controles de Acción */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                {/* Selectores Rápidos */}
                <div className="flex flex-col gap-1.5 text-xs">
                  <div className="flex items-center gap-2">
                    <select
                      value={activeTimer.cliente}
                      onChange={(e) => {
                        const cl = e.target.value;
                        const match = facturas.find(f => f.cliente?.empresa === cl);
                        setActiveTimer(prev => ({
                          ...prev,
                          cliente: cl,
                          proyectoId: match?.proyectoId || prev.proyectoId
                        }));
                      }}
                      className="bg-[#131926] border border-slate-700/80 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500 max-w-[190px]"
                    >
                      <option value="">Seleccionar Proyecto...</option>
                      {facturas.map(f => (
                        <option key={f.id} value={f.cliente?.empresa}>
                          {f.cliente?.empresa || 'Cliente'} ({f.numeroFactura})
                        </option>
                      ))}
                      <option value="General Agencia">General Agencia / I+D</option>
                    </select>

                    <select
                      value={activeTimer.categoria}
                      onChange={(e) => setActiveTimer(prev => ({ ...prev, categoria: e.target.value }))}
                      className="bg-[#131926] border border-slate-700/80 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                    >
                      <option value="desarrollo">Desarrollo Web / App</option>
                      <option value="diseño">Diseño UI/UX</option>
                      <option value="geo_ia">GEO & Posicionamiento</option>
                      <option value="reunion">Reunión de Cierre</option>
                      <option value="soporte">Soporte Técnico</option>
                    </select>
                  </div>

                  <input
                    type="text"
                    value={activeTimer.concepto}
                    onChange={(e) => setActiveTimer(prev => ({ ...prev, concepto: e.target.value }))}
                    placeholder="Actividad actual (ej: Maquetación Hero...)"
                    className="bg-[#131926] border border-slate-700/80 rounded-lg px-2.5 py-1 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                {/* Botones Principales del Cronómetro */}
                <div className="flex items-center gap-2 shrink-0">
                  {!activeTimer.isRunning || activeTimer.isPaused ? (
                    <button
                      onClick={() => handleStartTimer()}
                      className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-950/40 transition-all"
                    >
                      <Play className="w-4 h-4 fill-white" />
                      <span>{activeTimer.isPaused ? 'Reanudar' : 'Iniciar'}</span>
                    </button>
                  ) : (
                    <button
                      onClick={handlePauseTimer}
                      className="px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-amber-950/40 transition-all"
                    >
                      <Pause className="w-4 h-4" />
                      <span>Pausar</span>
                    </button>
                  )}

                  <button
                    onClick={handleOpenStopModal}
                    disabled={displaySeconds < 1}
                    className="px-3.5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-xs flex items-center gap-1.5 shadow-md transition-all"
                    title="Detener y asentar en la bitácora contable"
                  >
                    <Square className="w-4 h-4 fill-white" />
                    <span>Guardar</span>
                  </button>

                  <button
                    onClick={handleResetTimer}
                    disabled={displaySeconds === 0}
                    className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed text-slate-300 transition-all"
                    title="Reiniciar cronómetro a cero"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Barra de Impacto Contable y Persistencia */}
            <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-[11px] font-mono text-slate-400">
              <div className="flex items-center gap-4">
                <span>
                  Coste interno acumulado:{' '}
                  <strong className="text-purple-300 font-bold">
                    ${((displaySeconds / 3600) * (Number(configuracion.costoHoraInterno) || 20)).toFixed(2)} USD
                  </strong>
                </span>
                <span>
                  Valor comercial objetivo:{' '}
                  <strong className="text-emerald-300 font-bold">
                    ${((displaySeconds / 3600) * (Number(configuracion.tarifaObjetivoHora) || 50)).toFixed(2)} USD
                  </strong>
                </span>
              </div>
              <span className="text-[10px] text-slate-500 font-sans">
                ⚡ Persistencia local garantizada: si recargas o cierras la pestaña, el tiempo continúa intacto.
              </span>
            </div>
          </div>

          {/* Top Metrics Cards for Time Tracking */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-[#0c1017] border border-slate-800 shadow-sm">
              <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
                <span>TOTAL HORAS AUDITADAS</span>
                <Clock className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-2xl font-black text-white font-mono mt-2">
                {kpis.horasTotales} hrs
              </div>
              <p className="text-[10px] text-slate-500 mt-0.5">{kpis.horasRealesTotales}h en bitácora activa</p>
            </div>

            <div className="p-4 rounded-xl bg-[#0c1017] border border-slate-800 shadow-sm">
              <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
                <span>TARIFA MEDIA EFECTIVA</span>
                <DollarSign className="w-4 h-4 text-orange-400" />
              </div>
              <div className="text-2xl font-black text-orange-400 font-mono mt-2">
                ${kpis.tarifaMediaEfectivaHora} <span className="text-xs font-normal text-slate-400">USD/h</span>
              </div>
              <p className="text-[10px] text-slate-500 mt-0.5">Promedio ponderado cobrado</p>
            </div>

            <div className="p-4 rounded-xl bg-[#0c1017] border border-slate-800 shadow-sm">
              <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
                <span>TARIFA OBJETIVO AGENCIA</span>
                <TrendingUp className="w-4 h-4 text-sky-400" />
              </div>
              <div className="text-2xl font-black text-sky-400 font-mono mt-2">
                ${configuracion.tarifaObjetivoHora} <span className="text-xs font-normal text-slate-400">USD/h</span>
              </div>
              <p className="text-[10px] text-slate-500 mt-0.5">Meta para alta rentabilidad</p>
            </div>

            <div className="p-4 rounded-xl bg-[#0c1017] border border-slate-800 shadow-sm">
              <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
                <span>COSTE INTERNO HORA</span>
                <Wallet className="w-4 h-4 text-purple-400" />
              </div>
              <div className="text-2xl font-black text-purple-400 font-mono mt-2">
                ${configuracion.costoHoraInterno} <span className="text-xs font-normal text-slate-400">USD/h</span>
              </div>
              <p className="text-[10px] text-slate-500 mt-0.5">Coste base de producción</p>
            </div>
          </div>

          {/* Table: Rentabilidad Horaria por Proyecto */}
          <div className="bg-[#0c1017] border border-slate-800/80 rounded-xl overflow-hidden shadow-sm">
            <div className="p-3 bg-[#101522] border-b border-slate-800 text-xs font-bold text-slate-200 flex items-center justify-between">
              <span>Rentabilidad Horaria & Alerta de Dilución por Proyecto</span>
              <span className="text-[11px] font-mono text-slate-400">Tarifa Objetivo: ${configuracion.tarifaObjetivoHora} USD/hora</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-[#0d121c] border-b border-slate-800 text-[11px] font-mono uppercase text-slate-400">
                  <tr>
                    <th className="p-3">Cliente / Proyecto</th>
                    <th className="p-3">País</th>
                    <th className="p-3">Facturado USD</th>
                    <th className="p-3">Horas Dedicadas</th>
                    <th className="p-3">Tarifa Efectiva ($/h)</th>
                    <th className="p-3">Estado de Rentabilidad</th>
                    <th className="p-3 text-right">Track 1-Clic</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-sans">
                  {proyectosRentabilidad.map(p => (
                    <tr key={p.facturaId} className="hover:bg-slate-800/30 transition-colors">
                      <td className="p-3">
                        <div className="font-semibold text-white">{p.cliente}</div>
                        <div className="text-[10px] font-mono text-slate-500">{p.numerosFactura || p.numeroFactura}</div>
                      </td>
                      <td className="p-3">
                        <span className="text-xs">{p.pais === 'SV' ? '🇸🇻 SV' : '🇩🇴 DO'}</span>
                      </td>
                      <td className="p-3 font-mono font-bold text-white">
                        ${p.precioVendido.toLocaleString()} USD
                      </td>
                      <td className="p-3 font-mono">
                        <span className="font-bold text-slate-200">{p.horasInvertidas} hrs</span>
                        {p.horasRegistradas > 0 ? (
                          <span className="text-[10px] text-emerald-400 block font-mono">({p.horasRegistradas}h registradas de {p.horasEstimadas}h est.)</span>
                        ) : (
                          <span className="text-[10px] text-slate-500 block font-mono">(Estimadas en presupuesto)</span>
                        )}
                      </td>
                      <td className="p-3 font-mono font-bold text-sm">
                        <span className={p.tarifaEfectivaHora >= configuracion.tarifaObjetivoHora ? 'text-emerald-400' : !p.alertaDilucion ? 'text-amber-400' : 'text-rose-400'}>
                          ${p.tarifaEfectivaHora} USD/h
                        </span>
                      </td>
                      <td className="p-3">
                        {p.alertaDilucion ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[10px] font-bold">
                            <AlertCircle className="w-3 h-3 text-rose-400" />
                            <span>DILUCIÓN DE TARIFA (Exceso de Horas)</span>
                          </span>
                        ) : p.tarifaEfectivaHora >= configuracion.tarifaObjetivoHora ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold">
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                            <span>ALTA RENTABILIDAD</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold">
                            <span>RENTABILIDAD ACEPTABLE</span>
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-right">
                        {activeTimer.isRunning && activeTimer.cliente === p.cliente ? (
                          <button
                            onClick={handleOpenStopModal}
                            className="px-2.5 py-1 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-bold flex items-center gap-1 ml-auto animate-pulse"
                            title="Cronómetro activo en este proyecto. Clic para detener y guardar."
                          >
                            <Square className="w-3 h-3 fill-amber-300" />
                            <span>Detener</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              handleStartTimer({
                                proyectoId: p.proyectoId,
                                facturaId: p.facturaId,
                                cliente: p.cliente
                              });
                            }}
                            className="px-2.5 py-1 rounded-md bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/30 text-[10px] font-bold flex items-center gap-1 ml-auto transition-all"
                            title={`Iniciar cronómetro para ${p.cliente}`}
                          >
                            <Play className="w-3 h-3 fill-current" />
                            <span>Track 1-Clic</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {proyectosRentabilidad.length === 0 && (
                    <tr>
                      <td colSpan="7" className="p-8 text-center text-slate-500">
                        <Clock className="w-8 h-8 mx-auto mb-2 opacity-30 text-slate-400" />
                        <p className="font-semibold text-slate-300">Sin proyectos activos para auditar</p>
                        <p className="text-[11px] text-slate-500 mt-1">
                          Al facturar un cliente o aceptar un presupuesto se habilitará el cálculo de tarifa horaria y dilución.
                        </p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Table: Time Entries Log */}
          <div className="bg-[#0c1017] border border-slate-800/80 rounded-xl overflow-hidden shadow-sm">
            <div className="p-3 bg-[#101522] border-b border-slate-800 text-xs font-bold text-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-3">
                <span>Bitácora de Tiempos Registrados ({filteredTimeEntries.length})</span>
                <div className="relative">
                  <Search className="w-3 h-3 text-slate-500 absolute left-2 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={horasSearch}
                    onChange={(e) => setHorasSearch(e.target.value)}
                    placeholder="Filtrar por cliente, tarea o dev..."
                    className="bg-[#131926] border border-slate-700 rounded-lg pl-7 pr-2.5 py-1 text-[11px] text-slate-200 focus:outline-none focus:border-emerald-500 w-52 font-normal"
                  />
                </div>
              </div>
              <button
                onClick={() => setNewTimeModalOpen(true)}
                className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-[11px] flex items-center gap-1 transition-all shadow-sm self-start sm:self-auto"
              >
                <Plus className="w-3 h-3" />
                <span>Agregar Registro</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-[#0d121c] border-b border-slate-800 text-[11px] font-mono uppercase text-slate-400">
                  <tr>
                    <th className="p-3">Fecha</th>
                    <th className="p-3">Cliente / Proyecto</th>
                    <th className="p-3">Tarea / Concepto</th>
                    <th className="p-3">Categoría</th>
                    <th className="p-3">Responsable</th>
                    <th className="p-3 text-right">Horas</th>
                    <th className="p-3 text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-sans">
                  {filteredTimeEntries.map(t => (
                    <tr key={t.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="p-3 font-mono text-[11px] text-slate-500">{t.fecha}</td>
                      <td className="p-3 font-semibold text-white">{t.cliente}</td>
                      <td className="p-3 text-slate-200">{t.concepto}</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono text-[10px] uppercase">
                          {t.categoria}
                        </span>
                      </td>
                      <td className="p-3 text-slate-400 font-medium">{t.responsable}</td>
                      <td className="p-3 text-right font-mono font-bold text-emerald-400 text-sm">
                        {t.horas} h
                      </td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => handleDeleteTimeEntry(t.id)}
                          className="p-1 rounded text-slate-500 hover:text-rose-400 transition-colors"
                          title="Eliminar registro"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredTimeEntries.length === 0 && (
                    <tr>
                      <td colSpan="7" className="p-8 text-center text-slate-500">
                        <Timer className="w-8 h-8 mx-auto mb-2 opacity-30 text-slate-400" />
                        <p className="font-semibold text-slate-300">Bitácora de tiempos vacía</p>
                        <p className="text-[11px] text-slate-500 mt-1">
                          Inicia el Cronómetro de 1-Clic o pulsa "Registrar Horas" para asentar tu primera sesión de trabajo.
                        </p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 7. TAB 5: CONFIGURACIÓN FINANCIERA, TARIFAS & BANCOS REGIONALES */}
      {activeTab === 'config' && (
        <form onSubmit={handleSaveConfig} className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-xs">
          {/* Header Card with Clean Settings Info & Discrete Maintenance Action */}
          <div className="col-span-full flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-[#0e131f] border border-slate-800 rounded-xl">
            <div>
              <div className="text-xs font-bold text-white flex items-center gap-1.5">
                <Settings className="w-3.5 h-3.5 text-orange-400" />
                <span>Configuración de Finanzas & Cuentas Bancarias</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Cuentas receptoras oficiales (El Salvador, Rep. Dominicana y uglyCash EE.UU.) y parámetros de coste horario.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleClearFinanzasData}
                className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-rose-950/40 text-slate-400 hover:text-rose-300 text-xs font-medium flex items-center gap-1.5 transition-colors border border-slate-700 hover:border-rose-500/40"
                title="Vaciar facturas, gastos y horas para prueba manual limpia"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                <span>Limpiar Pruebas</span>
              </button>
            </div>
          </div>

          {/* Parámetros de Rentabilidad y Costes */}
          <div className="p-5 rounded-xl bg-[#0c1017] border border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-sm text-white">Parámetros de Coste Hora & Impuestos</h3>
                <p className="text-[11px] text-slate-400">Define las métricas base para el cálculo de Unit Economics y alertas de dilución.</p>
              </div>
              <Sliders className="w-4 h-4 text-orange-400" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-slate-400 block mb-1">Coste Hora Interno ($ USD/h)</label>
                <input
                  type="number"
                  value={configForm.costoHoraInterno}
                  onChange={(e) => setConfigForm({ ...configForm, costoHoraInterno: Number(e.target.value) })}
                  className="w-full bg-[#131926] border border-slate-700 rounded-lg p-2.5 text-white font-mono font-bold"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Tarifa Objetivo Agencia ($ USD/h)</label>
                <input
                  type="number"
                  value={configForm.tarifaObjetivoHora}
                  onChange={(e) => setConfigForm({ ...configForm, tarifaObjetivoHora: Number(e.target.value) })}
                  className="w-full bg-[#131926] border border-slate-700 rounded-lg p-2.5 text-orange-400 font-mono font-bold"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-slate-400 block mb-1">Tasa IVA El Salvador (%)</label>
                <input
                  type="number"
                  value={configForm.tasaIvaSV}
                  onChange={(e) => setConfigForm({ ...configForm, tasaIvaSV: Number(e.target.value) })}
                  className="w-full bg-[#131926] border border-slate-700 rounded-lg p-2.5 text-white font-mono"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Tasa ITBIS Rep. Dominicana (%)</label>
                <input
                  type="number"
                  value={configForm.tasaItbisDO}
                  onChange={(e) => setConfigForm({ ...configForm, tasaItbisDO: Number(e.target.value) })}
                  className="w-full bg-[#131926] border border-slate-700 rounded-lg p-2.5 text-white font-mono"
                />
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800 space-y-2.5">
              <div className="text-[11px] font-mono uppercase text-orange-400 font-bold">Datos Fiscales en Facturas Comerciales</div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-400 block mb-1">Razón Social / Marca</label>
                  <input
                    type="text"
                    value={configForm.emisor?.empresa || ''}
                    onChange={(e) => setConfigForm({
                      ...configForm,
                      emisor: { ...(configForm.emisor || {}), empresa: e.target.value }
                    })}
                    className="w-full bg-[#131926] border border-slate-700 rounded-lg p-2 text-white"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">NIT / RNC Emisor</label>
                  <input
                    type="text"
                    value={configForm.emisor?.identificacion || ''}
                    onChange={(e) => setConfigForm({
                      ...configForm,
                      emisor: { ...(configForm.emisor || {}), identificacion: e.target.value }
                    })}
                    className="w-full bg-[#131926] border border-slate-700 rounded-lg p-2 text-white font-mono"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Cuentas Bancarias & Métodos de Pago Multi-País (DO, US uglyCash, SV) */}
          <div className="p-5 rounded-xl bg-[#0c1017] border border-slate-800 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-sm text-white flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-emerald-400" />
                  <span>Cuentas Bancarias & Pasarelas de Cobro</span>
                </h3>
                <p className="text-[11px] text-slate-400">
                  Manejo de múltiples cuentas para República Dominicana, El Salvador y remesas directas desde EE.UU. con uglyCash.
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleOpenAddAccount()}
                className="px-3 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Agregar Cuenta</span>
              </button>
            </div>

            {/* Presets de 1-Clic */}
            <div className="bg-[#101625] border border-slate-800/80 rounded-xl p-2.5 space-y-1.5">
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold block">
                Carga Rápida de Cuentas / Pasarelas Oficiales:
              </span>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => handleOpenAddAccount('uglycash')}
                  className="px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[11px] font-bold flex items-center gap-1 transition-all"
                  title="Cargar cuenta de uglyCash para recibir remesas instantáneas desde EE.UU."
                >
                  <span>⚡ uglyCash ($victormatos) · EE.UU.</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleOpenAddAccount('popular')}
                  className="px-2.5 py-1 rounded-lg bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border border-sky-500/30 text-[11px] font-medium flex items-center gap-1 transition-all"
                >
                  <span>🇩🇴 Banco Popular (USD)</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleOpenAddAccount('banreservas')}
                  className="px-2.5 py-1 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 text-[11px] font-medium flex items-center gap-1 transition-all"
                >
                  <span>🇩🇴 Banreservas (DOP)</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleOpenAddAccount('agricola')}
                  className="px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[11px] font-medium flex items-center gap-1 transition-all"
                >
                  <span>🇸🇻 Banco Agrícola (SV)</span>
                </button>
              </div>
            </div>

            {/* Filtros por País */}
            <div className="flex items-center gap-1.5 bg-[#121828] p-1 rounded-lg border border-slate-800 text-[11px]">
              <button
                type="button"
                onClick={() => setAccountFilterCountry('ALL')}
                className={`px-2.5 py-1 rounded-md transition-all ${accountFilterCountry === 'ALL' ? 'bg-orange-600 text-white font-bold' : 'text-slate-400 hover:text-white'}`}
              >
                Todas ({normalizeCuentasBancarias(configForm.cuentasBancarias).length})
              </button>
              <button
                type="button"
                onClick={() => setAccountFilterCountry('DO')}
                className={`px-2.5 py-1 rounded-md transition-all ${accountFilterCountry === 'DO' ? 'bg-orange-600 text-white font-bold' : 'text-slate-400 hover:text-white'}`}
              >
                🇩🇴 Rep. Dominicana
              </button>
              <button
                type="button"
                onClick={() => setAccountFilterCountry('US')}
                className={`px-2.5 py-1 rounded-md transition-all ${accountFilterCountry === 'US' ? 'bg-orange-600 text-white font-bold' : 'text-slate-400 hover:text-white'}`}
              >
                🇺🇸 EE.UU. (uglyCash)
              </button>
              <button
                type="button"
                onClick={() => setAccountFilterCountry('SV')}
                className={`px-2.5 py-1 rounded-md transition-all ${accountFilterCountry === 'SV' ? 'bg-orange-600 text-white font-bold' : 'text-slate-400 hover:text-white'}`}
              >
                🇸🇻 El Salvador
              </button>
            </div>

            {/* Lista de Cuentas */}
            <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1">
              {normalizeCuentasBancarias(configForm.cuentasBancarias)
                .filter(acc => accountFilterCountry === 'ALL' || acc.pais === accountFilterCountry)
                .map(acc => {
                  const isUgly = acc.pais === 'US' || acc.banco?.toLowerCase().includes('uglycash');
                  const countryFlag = acc.pais === 'DO' ? '🇩🇴' : acc.pais === 'US' ? '🇺🇸' : acc.pais === 'SV' ? '🇸🇻' : '🌐';

                  return (
                    <div
                      key={acc.id}
                      className={`p-3.5 rounded-xl border transition-all ${
                        isUgly
                          ? 'bg-gradient-to-r from-[#0d1c18] to-[#111726] border-emerald-500/40 shadow-sm'
                          : acc.activa
                          ? 'bg-[#111726] border-slate-800'
                          : 'bg-[#0a0e17] border-slate-900 opacity-60'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-base">{countryFlag}</span>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-white text-xs">{acc.banco}</span>
                              {acc.predeterminada && (
                                <span className="inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold">
                                  <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                                  <span>Predeterminada</span>
                                </span>
                              )}
                              <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono font-bold ${
                                acc.moneda === 'DOP' ? 'bg-sky-500/20 text-sky-300' : 'bg-emerald-500/20 text-emerald-300'
                              }`}>
                                {acc.moneda || 'USD'}
                              </span>
                            </div>
                            <span className="text-[11px] text-slate-400 block">{acc.tipo}</span>
                          </div>
                        </div>

                        {/* Switch Activa */}
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleToggleAccountActive(acc.id)}
                            className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all border ${
                              acc.activa
                                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30'
                                : 'bg-slate-800 text-slate-500 border-slate-700 hover:text-slate-300'
                            }`}
                            title={acc.activa ? 'Desactivar para facturas' : 'Activar para facturas'}
                          >
                            {acc.activa ? '✓ Activa' : 'Inactiva'}
                          </button>
                        </div>
                      </div>

                      {/* Detalles: Número / Tag / Titular */}
                      <div className="mt-2.5 pt-2 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                        <div className="flex items-center gap-1.5">
                          <span className="text-slate-400">{isUgly ? 'uglyCash Tag:' : 'Nº Cuenta:'}</span>
                          <span className={`font-mono font-bold px-1.5 py-0.5 rounded ${
                            isUgly
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : 'bg-slate-800/80 text-orange-400'
                          }`}>
                            {acc.numero}
                          </span>
                        </div>
                        <div className="text-slate-300 truncate">
                          <span className="text-slate-400">Titular: </span>
                          <span className="font-medium text-slate-200">{acc.titular}</span>
                        </div>
                      </div>

                      {acc.instrucciones && (
                        <div className="mt-1.5 text-[10.5px] text-slate-400 bg-black/20 p-1.5 rounded border border-slate-800/50">
                          <span className="text-slate-300 font-semibold">Instrucciones: </span>
                          {acc.instrucciones}
                        </div>
                      )}

                      {/* Botones de acción */}
                      <div className="mt-2.5 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px]">
                        {!acc.predeterminada ? (
                          <button
                            type="button"
                            onClick={() => handleToggleAccountDefault(acc.id)}
                            className="text-slate-400 hover:text-amber-300 flex items-center gap-1 transition-colors"
                          >
                            <Star className="w-3 h-3" />
                            <span>Hacer predeterminada {countryFlag}</span>
                          </button>
                        ) : <div />}

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleOpenEditAccount(acc)}
                            className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
                          >
                            Editar
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteAccount(acc.id)}
                            className="p-1 rounded text-slate-500 hover:text-rose-400 transition-colors"
                            title="Eliminar cuenta"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs shadow-glow-sm transition-all"
            >
              Guardar Configuración Financiera Completa
            </button>
          </div>
        </form>
      )}

      {/* MODAL: PRINTABLE OFFICIAL CORPORATE INVOICE FULLSCREEN (automated-html-invoice style) */}
      {isInvoiceFullscreenModalOpen && selectedInvoice && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0e1320] border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
            
            {/* Header controls */}
            <div className="p-4 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 no-print bg-[#121828]">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-orange-400" />
                <span className="font-bold text-sm text-white">Factura Comercial · {selectedInvoice.numeroFactura}</span>
                <span className="text-[11px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
                  {selectedInvoice.origenModulo || 'Goglite ERP'}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleDownloadInvoiceHtml(selectedInvoice)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs flex items-center gap-1.5 border border-slate-700 transition-all"
                  title="Descargar archivo HTML autosuficiente ($0)"
                >
                  <Download className="w-3.5 h-3.5 text-orange-400" />
                  <span>Descargar HTML</span>
                </button>

                <button
                  type="button"
                  onClick={() => handlePrintInvoicePdf(selectedInvoice)}
                  className="px-3.5 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Imprimir / Guardar PDF</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsInvoiceFullscreenModalOpen(false)}
                  className="w-8 h-8 rounded-lg bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Corporate Invoice Preview */}
            <div className="p-6 sm:p-10 overflow-y-auto space-y-6 bg-[#FAFAFA]">
              <CorporateInvoiceDocument invoice={selectedInvoice} configuracion={configuracion} />
            </div>

          </div>
        </div>
      )}

      {/* MODAL: CREATE INVOICE WITH RETROSPECTIVE M1-M3 SELECTOR */}
      {newInvoiceModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0e1320] border border-slate-800 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-[#121828]">
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-orange-400" />
                <span>Emitir Nueva Factura Proforma</span>
              </h3>
              <button onClick={() => setNewInvoiceModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateInvoice} className="p-5 space-y-3.5 text-xs overflow-y-auto">
              
              {/* Selector de Modo de Factura (Suscripción CMS, Factura Libre, Embudo M1-M3) */}
              <div className="flex items-center gap-1.5 p-1 bg-[#090d16] rounded-xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setInvoiceMode('cms_retainer');
                    setSelectedCmsPeriod(30);
                    setNewInvoiceForm(prev => ({
                      ...prev,
                      origenModulo: 'Membresía Headless CMS',
                      concepto: 'Goglite Care · Suscripción Headless CMS & Mantenimiento Web (1 Mes)',
                      itemDescripcion: 'Goglite Care · Suscripción Headless CMS & Mantenimiento Web (1 Mes)',
                      subtotal: 99,
                      total: 99,
                      montoCobrado: 99,
                      diasVigencia: 30
                    }));
                  }}
                  className={`flex-1 py-2 px-2 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
                    invoiceMode === 'cms_retainer'
                      ? 'bg-purple-600 text-white shadow-md shadow-purple-950/40'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 text-purple-300" />
                  <span>💎 Suscripción CMS</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setInvoiceMode('libre');
                    setNewInvoiceForm(prev => ({
                      ...prev,
                      origenModulo: 'Facturación Libre',
                      concepto: 'Servicio de Desarrollo Web & Crecimiento Digital',
                      itemDescripcion: 'Servicio de Desarrollo Web & Crecimiento Digital',
                      subtotal: 650,
                      total: 650,
                      montoCobrado: 325,
                      diasVigencia: null
                    }));
                  }}
                  className={`flex-1 py-2 px-2 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
                    invoiceMode === 'libre'
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/40'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5 text-emerald-300" />
                  <span>📄 Factura Libre</span>
                </button>

                <button
                  type="button"
                  onClick={() => setInvoiceMode('embudo')}
                  className={`flex-1 py-2 px-2 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
                    invoiceMode === 'embudo'
                      ? 'bg-orange-600 text-white shadow-md shadow-orange-950/40'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Link2 className="w-3.5 h-3.5 text-orange-300" />
                  <span>🔗 Embudo (M1-M3)</span>
                </button>
              </div>

              {/* MODO A: SUSCRIPCIÓN / RETAINER CMS */}
              {invoiceMode === 'cms_retainer' && (
                <div className="p-3.5 rounded-xl bg-purple-500/10 border border-purple-500/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-purple-300 font-bold flex items-center gap-1.5 text-[11px]">
                      <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                      <span>Elegir Período de Suscripción (1-Clic):</span>
                    </span>
                    <span className="text-[10px] font-mono text-purple-400 bg-purple-500/20 px-2 py-0.5 rounded">
                      Goglite Care Oficial
                    </span>
                  </div>

                  {/* 4 Botones de Período Rápido */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { dias: 30, label: '1 Mes', precio: 99, desc: '+30 días' },
                      { dias: 90, label: '3 Meses', precio: 297, desc: '+90 días' },
                      { dias: 180, label: '6 Meses', precio: 594, desc: '+180 días' },
                      { dias: 365, label: '1 Año', precio: 1089, desc: '1 Mes Gratis' }
                    ].map(p => (
                      <button
                        key={p.dias}
                        type="button"
                        onClick={() => {
                          setSelectedCmsPeriod(p.dias);
                          setNewInvoiceForm(prev => ({
                            ...prev,
                            subtotal: p.precio,
                            total: p.precio,
                            montoCobrado: p.precio,
                            diasVigencia: p.dias,
                            itemDescripcion: `Goglite Care · Suscripción Headless CMS & Mantenimiento Web (${p.label})`,
                            concepto: `Goglite Care · Suscripción Headless CMS & Mantenimiento Web (${p.label})`
                          }));
                        }}
                        className={`p-2 rounded-xl text-center border transition-all ${
                          selectedCmsPeriod === p.dias
                            ? 'bg-purple-600 text-white border-purple-400 shadow-md shadow-purple-950/50'
                            : 'bg-[#121828] text-slate-300 border-slate-700/80 hover:border-purple-500/50'
                        }`}
                      >
                        <div className="font-bold text-xs">{p.label}</div>
                        <div className="font-mono text-[11px] font-bold text-amber-300">${p.precio} USD</div>
                        <div className="text-[9px] text-slate-400 font-mono">{p.desc}</div>
                      </button>
                    ))}
                  </div>

                  {/* Checkbox Auto-Extender CMS */}
                  <label className="flex items-center gap-2 pt-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={autoExtendCms}
                      onChange={(e) => setAutoExtendCms(e.target.checked)}
                      className="rounded border-slate-700 text-purple-600 focus:ring-purple-500"
                    />
                    <span className="text-[11px] text-slate-300">
                      ✓ <strong>Activar / Extender automáticamente</strong> la vigencia del cliente en Headless CMS al emitir esta factura (+{selectedCmsPeriod} días)
                    </span>
                  </label>
                </div>
              )}

              {/* SELECTOR RÁPIDO DE CLIENTE (DISPONIBLE EN TODOS LOS MODOS) */}
              {invoiceMode !== 'embudo' && cmsClientsList.length > 0 && (
                <div className="space-y-1">
                  <label className="text-slate-400 text-[11px] block flex items-center justify-between">
                    <span>Seleccionar Cliente Registrado (CMS o CRM):</span>
                    <span className="text-[10px] text-purple-400 font-mono font-bold">{cmsClientsList.length} clientes disponibles</span>
                  </label>
                  <select
                    value={selectedClientPick}
                    onChange={(e) => {
                      const empVal = e.target.value;
                      setSelectedClientPick(empVal);
                      const found = cmsClientsList.find(c => c.empresa === empVal);
                      if (found) {
                        const cuentas = normalizeCuentasBancarias(configuracion.cuentasBancarias);
                        const defaultAcc = cuentas.find(c => c.pais === found.pais && c.activa && c.predeterminada)
                          || cuentas.find(c => c.pais === found.pais && c.activa);

                        setNewInvoiceForm(prev => ({
                          ...prev,
                          empresa: found.empresa,
                          contacto: found.contacto || prev.contacto,
                          email: found.email || prev.email,
                          telefono: found.telefono || prev.telefono,
                          pais: found.pais || prev.pais,
                          cuentaBancariaId: defaultAcc ? defaultAcc.id : prev.cuentaBancariaId,
                          metodoPago: defaultAcc ? defaultAcc.banco : prev.metodoPago
                        }));
                      }
                    }}
                    className="w-full bg-[#131926] border border-slate-700/80 rounded-lg p-2 text-white text-xs"
                  >
                    <option value="">-- Elegir cliente o escribir datos manualmente abajo --</option>
                    {cmsClientsList.map(c => (
                      <option key={c.id || c.empresa} value={c.empresa}>
                        {c.pais === 'DO' ? '🇩🇴' : c.pais === 'US' ? '🇺🇸' : '🇸🇻'} {c.empresa} ({c.contacto}) {c.dominio ? `— ${c.dominio}` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* MODO C: SELECTOR RETROSPECTIVO TRADICIONAL DE EMBUDO */}
              {invoiceMode === 'embudo' && (
                <div className="p-3 rounded-xl bg-orange-500/10 border border-orange-500/30 space-y-1.5">
                  <label className="text-orange-300 font-bold flex items-center gap-1.5 text-[11px]">
                    <Link2 className="w-3.5 h-3.5" />
                    <span>Autocompletar desde Módulos 1, 2 o 3 (Retrospectivo):</span>
                  </label>
                  <select
                    value={selectedSourceKey}
                    onChange={(e) => handleSelectImportSource(e.target.value)}
                    className="w-full bg-[#0b0f19] border border-slate-700 rounded-lg p-2 text-slate-200 focus:outline-none focus:border-orange-500"
                  >
                    <option value="">-- Seleccionar Presupuesto (M3), Cliente CRM (M2) o Lead (M1) --</option>
                    {m3Presupuestos.length > 0 && (
                      <optgroup label="Módulo 3 · Presupuestos VIP">
                        {m3Presupuestos.map(p => (
                          <option key={p.id} value={`M3::${p.id}`}>
                            [M3 {p.codigo}] {p.cliente?.empresa} — ${p.inversion?.precioTotal} USD ({p.estado})
                          </option>
                        ))}
                      </optgroup>
                    )}
                    {m2CrmLeads.length > 0 && (
                      <optgroup label="Módulo 2 · CRM & WhatsApp">
                        {m2CrmLeads.map(l => (
                          <option key={l.id} value={`M2::${l.id}`}>
                            [M2 CRM] {l.empresa} ({l.contacto}) — ${l.valorEstimado || 650} USD
                          </option>
                        ))}
                      </optgroup>
                    )}
                    {m1ScrapperLeads.length > 0 && (
                      <optgroup label="Módulo 1 · Lead Scrapper">
                        {m1ScrapperLeads.slice(0, 15).map(l => (
                          <option key={l.id} value={`M1::${l.id}`}>
                            [M1 Scrapper] {l.nombreEmpresa} ({l.dominio})
                          </option>
                        ))}
                      </optgroup>
                    )}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-400 block mb-1">Nombre de la Empresa *</label>
                  <input
                    type="text"
                    required
                    value={newInvoiceForm.empresa}
                    onChange={(e) => setNewInvoiceForm({ ...newInvoiceForm, empresa: e.target.value })}
                    placeholder="ej: TurisRan / Clientes VIP"
                    className="w-full bg-[#131926] border border-slate-700 rounded-lg p-2 text-white"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Contacto Principal</label>
                  <input
                    type="text"
                    value={newInvoiceForm.contacto}
                    onChange={(e) => setNewInvoiceForm({ ...newInvoiceForm, contacto: e.target.value })}
                    placeholder="ej: Lic. Marcos Almonte"
                    className="w-full bg-[#131926] border border-slate-700 rounded-lg p-2 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-400 block mb-1">País del Cliente</label>
                  <select
                    value={newInvoiceForm.pais}
                    onChange={(e) => {
                      const newPais = e.target.value;
                      const cuentas = normalizeCuentasBancarias(configuracion.cuentasBancarias);
                      const defaultAcc = cuentas.find(c => c.pais === newPais && c.activa && c.predeterminada)
                        || cuentas.find(c => c.pais === newPais && c.activa);
                      setNewInvoiceForm({
                        ...newInvoiceForm,
                        pais: newPais,
                        cuentaBancariaId: defaultAcc ? defaultAcc.id : newInvoiceForm.cuentaBancariaId,
                        metodoPago: defaultAcc ? defaultAcc.banco : newInvoiceForm.metodoPago
                      });
                    }}
                    className="w-full bg-[#131926] border border-slate-700 rounded-lg p-2 text-white"
                  >
                    <option value="DO">🇩🇴 Rep. Dominicana</option>
                    <option value="US">🇺🇸 EE.UU. (uglyCash / Remesas)</option>
                    <option value="SV">🇸🇻 El Salvador</option>
                    <option value="INT">🌐 Internacional</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Régimen de Impuestos</label>
                  <select
                    value={newInvoiceForm.impuestoPorcentaje}
                    onChange={(e) => {
                      const pct = Number(e.target.value);
                      const sub = Number(newInvoiceForm.subtotal) || 0;
                      const tot = Math.round(sub * (1 + pct / 100) * 100) / 100;
                      setNewInvoiceForm({ ...newInvoiceForm, impuestoPorcentaje: pct, total: tot });
                    }}
                    className="w-full bg-[#131926] border border-slate-700 rounded-lg p-2 text-white"
                  >
                    <option value={0}>0% Exento / Exportación / Digital</option>
                    <option value={configuracion.tasaIvaSV || 13}>{configuracion.tasaIvaSV || 13}% IVA (El Salvador)</option>
                    <option value={configuracion.tasaItbisDO || 18}>{configuracion.tasaItbisDO || 18}% ITBIS (Rep. Dominicana)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-slate-400 block mb-1 flex items-center justify-between">
                  <span>Método de Pago / Cuenta Asignada</span>
                  <span className="text-[10px] text-orange-400">Multi-cuenta activa</span>
                </label>
                <select
                  value={newInvoiceForm.cuentaBancariaId || ''}
                  onChange={(e) => {
                    const selId = e.target.value;
                    const cuentas = normalizeCuentasBancarias(configuracion.cuentasBancarias);
                    const acc = cuentas.find(c => c.id === selId);
                    if (acc) {
                      setNewInvoiceForm({
                        ...newInvoiceForm,
                        cuentaBancariaId: acc.id,
                        metodoPago: acc.banco,
                        pais: acc.pais
                      });
                    } else {
                      setNewInvoiceForm({
                        ...newInvoiceForm,
                        cuentaBancariaId: '',
                        metodoPago: 'Transferencia Bancaria'
                      });
                    }
                  }}
                  className="w-full bg-[#131926] border border-slate-700 rounded-lg p-2 text-white text-xs font-medium"
                >
                  <option value="">Selección Predeterminada por País ({newInvoiceForm.pais})</option>
                  {normalizeCuentasBancarias(configuracion.cuentasBancarias).filter(c => c.activa).map(c => (
                    <option key={c.id} value={c.id}>
                      {c.pais === 'DO' ? '🇩🇴' : c.pais === 'US' ? '🇺🇸' : c.pais === 'SV' ? '🇸🇻' : '🌐'} {c.banco} ({c.numero}) — [{c.moneda}]
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-slate-400">Descripción / Concepto Principal</label>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        setNewInvoiceForm({
                          ...newInvoiceForm,
                          itemDescripcion: 'Goglite Care · Retainer Mensual de Mantenimiento & Headless CMS',
                          concepto: 'Goglite Care · Retainer Mensual de Mantenimiento & Headless CMS',
                          subtotal: 99,
                          total: 99,
                          montoCobrado: 99,
                          horasInvertidasEstimadas: 2,
                          itemsCustom: null
                        });
                      }}
                      className="text-[10px] bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 px-2 py-0.5 rounded font-mono font-bold transition-colors"
                    >
                      ⚡ Goglite Care ($99)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setNewInvoiceForm({
                          ...newInvoiceForm,
                          itemDescripcion: 'Desarrollo Web Ultra-Rápido Antigravity & SEO Local',
                          concepto: 'Desarrollo Web Ultra-Rápido Antigravity & SEO Local',
                          subtotal: 650,
                          total: 650,
                          montoCobrado: 325,
                          horasInvertidasEstimadas: 16,
                          itemsCustom: null
                        });
                      }}
                      className="text-[10px] bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 px-2 py-0.5 rounded font-mono font-bold transition-colors"
                    >
                      🌐 Web ($650)
                    </button>
                  </div>
                </div>
                <input
                  type="text"
                  required
                  value={newInvoiceForm.itemDescripcion}
                  onChange={(e) => setNewInvoiceForm({
                    ...newInvoiceForm,
                    itemDescripcion: e.target.value,
                    concepto: e.target.value,
                    itemsCustom: null
                  })}
                  placeholder="ej: Desarrollo Web Mobile-First de Alta Conversión & SEO"
                  className="w-full bg-[#131926] border border-slate-700 rounded-lg p-2 text-white"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-slate-400 block mb-1">Subtotal ($ USD)</label>
                  <input
                    type="number"
                    required
                    value={newInvoiceForm.subtotal}
                    onChange={(e) => {
                      const sub = Number(e.target.value);
                      const pct = Number(newInvoiceForm.impuestoPorcentaje) || 0;
                      const tot = Math.round(sub * (1 + pct / 100) * 100) / 100;
                      setNewInvoiceForm({
                        ...newInvoiceForm,
                        subtotal: sub,
                        total: tot,
                        itemPrecio: sub,
                        montoCobrado: Math.round(tot * 0.5)
                      });
                    }}
                    className="w-full bg-[#131926] border border-slate-700 rounded-lg p-2 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Anticipo Cobrado ($)</label>
                  <input
                    type="number"
                    value={newInvoiceForm.montoCobrado}
                    onChange={(e) => setNewInvoiceForm({ ...newInvoiceForm, montoCobrado: Number(e.target.value) })}
                    className="w-full bg-[#131926] border border-slate-700 rounded-lg p-2 text-emerald-400 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Horas Est. Proyecto</label>
                  <input
                    type="number"
                    value={newInvoiceForm.horasInvertidasEstimadas}
                    onChange={(e) => setNewInvoiceForm({ ...newInvoiceForm, horasInvertidasEstimadas: Number(e.target.value) })}
                    className="w-full bg-[#131926] border border-slate-700 rounded-lg p-2 text-white font-mono"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs mt-2 shadow-glow-sm transition-all"
              >
                Emitir Factura (${newInvoiceForm.total} USD)
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CREATE EXPENSE (WITH PROJECT LINKING) */}
      {newExpenseModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0e1320] border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-[#121828]">
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-rose-400" />
                <span>Registrar Gasto Operativo</span>
              </h3>
              <button onClick={() => setNewExpenseModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateExpense} className="p-5 space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Concepto del Gasto</label>
                <input
                  type="text"
                  required
                  value={newExpenseForm.concepto}
                  onChange={(e) => setNewExpenseForm({ ...newExpenseForm, concepto: e.target.value })}
                  placeholder="ej: Dominio .com anual para cliente"
                  className="w-full bg-[#131926] border border-slate-700 rounded-lg p-2 text-white"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Asignar a Cliente / Proyecto (Para Margen Unitario)</label>
                <select
                  value={newExpenseForm.clienteAsociado}
                  onChange={(e) => setNewExpenseForm({ ...newExpenseForm, clienteAsociado: e.target.value })}
                  className="w-full bg-[#131926] border border-slate-700 rounded-lg p-2 text-white"
                >
                  <option value="General Agencia">Gasto General de Agencia (VPS / Operativo)</option>
                  {facturas.map(f => (
                    <option key={f.id} value={f.cliente?.empresa}>
                      Cliente: {f.cliente?.empresa} ({f.numeroFactura})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-400 block mb-1">Categoría</label>
                  <select
                    value={newExpenseForm.categoria}
                    onChange={(e) => setNewExpenseForm({ ...newExpenseForm, categoria: e.target.value })}
                    className="w-full bg-[#131926] border border-slate-700 rounded-lg p-2 text-white"
                  >
                    <option value="infraestructura">Infraestructura / Dominios</option>
                    <option value="software">Software / APIs</option>
                    <option value="freelancers">Freelancers / Redacción</option>
                    <option value="marketing">Marketing / Diseño</option>
                    <option value="operativo">Operativo General</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Proveedor</label>
                  <input
                    type="text"
                    value={newExpenseForm.proveedor}
                    onChange={(e) => setNewExpenseForm({ ...newExpenseForm, proveedor: e.target.value })}
                    placeholder="ej: Porkbun, Hetzner"
                    className="w-full bg-[#131926] border border-slate-700 rounded-lg p-2 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-400 block mb-1">Monto ($ USD)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={newExpenseForm.monto}
                    onChange={(e) => setNewExpenseForm({ ...newExpenseForm, monto: e.target.value })}
                    placeholder="12.00"
                    className="w-full bg-[#131926] border border-slate-700 rounded-lg p-2 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Frecuencia</label>
                  <select
                    value={newExpenseForm.frecuencia}
                    onChange={(e) => setNewExpenseForm({ ...newExpenseForm, frecuencia: e.target.value })}
                    className="w-full bg-[#131926] border border-slate-700 rounded-lg p-2 text-white"
                  >
                    <option value="unico">Pago Único</option>
                    <option value="mensual">Mensual Recurrente</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs mt-3 shadow-md"
              >
                Guardar Gasto Operativo
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: NUEVO REGISTRO DE TIEMPO */}
      {newTimeModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0e1320] border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-[#121828]">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-400" />
                <span className="font-bold text-sm text-white">Registrar Horas de Trabajo</span>
              </div>
              <button
                onClick={() => setNewTimeModalOpen(false)}
                className="w-7 h-7 rounded-lg bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateTimeEntry} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Cliente / Proyecto</label>
                <select
                  required
                  value={newTimeForm.cliente}
                  onChange={(e) => {
                    const sel = facturas.find(f => f.cliente?.empresa === e.target.value);
                    setNewTimeForm({
                      ...newTimeForm,
                      cliente: e.target.value,
                      proyectoId: sel?.proyectoId || ''
                    });
                  }}
                  className="w-full bg-[#131926] border border-slate-700 rounded-lg p-2 text-white"
                >
                  <option value="">Selecciona un proyecto...</option>
                  {facturas.map(f => (
                    <option key={f.id} value={f.cliente?.empresa}>
                      {f.cliente?.empresa} ({f.numeroFactura})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Concepto de la Tarea</label>
                <input
                  type="text"
                  required
                  value={newTimeForm.concepto}
                  onChange={(e) => setNewTimeForm({ ...newTimeForm, concepto: e.target.value })}
                  placeholder="ej: Diseño UX Hero, Maquetación React, Configuración DNS"
                  className="w-full bg-[#131926] border border-slate-700 rounded-lg p-2 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-400 block mb-1">Categoría</label>
                  <select
                    value={newTimeForm.categoria}
                    onChange={(e) => setNewTimeForm({ ...newTimeForm, categoria: e.target.value })}
                    className="w-full bg-[#131926] border border-slate-700 rounded-lg p-2 text-white"
                  >
                    <option value="diseño">Diseño UX / UI</option>
                    <option value="desarrollo">Desarrollo Frontend / React</option>
                    <option value="seo">SEO & Copywriting</option>
                    <option value="reunion">Reunión de Feedback</option>
                    <option value="soporte">Soporte / Despliegue</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Horas Dedicadas</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0.5"
                    required
                    value={newTimeForm.horas}
                    onChange={(e) => setNewTimeForm({ ...newTimeForm, horas: e.target.value })}
                    className="w-full bg-[#131926] border border-slate-700 rounded-lg p-2 text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Responsable</label>
                <select
                  value={newTimeForm.responsable}
                  onChange={(e) => setNewTimeForm({ ...newTimeForm, responsable: e.target.value })}
                  className="w-full bg-[#131926] border border-slate-700 rounded-lg p-2 text-white"
                >
                  <option value="Senior Dev">Senior Developer</option>
                  <option value="Director UX">Director UX</option>
                  <option value="SEO Lead">SEO Specialist</option>
                  <option value="Project Manager">Project Manager</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs mt-3 shadow-md transition-all"
              >
                Guardar Horas en Bitácora
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD / EDIT BANK ACCOUNT OR PAYMENT METHOD (uglyCash, RD, SV) */}
      {accountModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0e1320] border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-[#121828]">
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-emerald-400" />
                <span>{editingAccountId ? 'Editar Cuenta o Método de Pago' : 'Nueva Cuenta o Pasarela de Cobro'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setAccountModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveAccountModal} className="p-5 space-y-3.5 text-xs overflow-y-auto">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-400 block mb-1">País / Región</label>
                  <select
                    value={accountForm.pais}
                    onChange={(e) => {
                      const newPais = e.target.value;
                      setAccountForm({
                        ...accountForm,
                        pais: newPais,
                        moneda: newPais === 'DO' && accountForm.banco?.toLowerCase().includes('reservas') ? 'DOP' : 'USD'
                      });
                    }}
                    className="w-full bg-[#131926] border border-slate-700 rounded-lg p-2 text-white"
                  >
                    <option value="DO">🇩🇴 República Dominicana</option>
                    <option value="US">🇺🇸 Estados Unidos (uglyCash / Remesas)</option>
                    <option value="SV">🇸🇻 El Salvador</option>
                    <option value="INT">🌐 Internacional</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Moneda de la Cuenta</label>
                  <select
                    value={accountForm.moneda}
                    onChange={(e) => setAccountForm({ ...accountForm, moneda: e.target.value })}
                    className="w-full bg-[#131926] border border-slate-700 rounded-lg p-2 text-white font-mono"
                  >
                    <option value="USD">USD ($ Dólares)</option>
                    <option value="DOP">DOP (RD$ Pesos Dominicanos)</option>
                    <option value="EUR">EUR (€ Euros)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Entidad Bancaria o Billetera</label>
                <input
                  type="text"
                  required
                  value={accountForm.banco}
                  onChange={(e) => setAccountForm({ ...accountForm, banco: e.target.value })}
                  placeholder="ej: uglyCash (Remesas Instantáneas EE.UU.), Banco Popular Dominicano, Banreservas"
                  className="w-full bg-[#131926] border border-slate-700 rounded-lg p-2 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-400 block mb-1">Tipo de Cuenta / Servicio</label>
                  <input
                    type="text"
                    required
                    value={accountForm.tipo}
                    onChange={(e) => setAccountForm({ ...accountForm, tipo: e.target.value })}
                    placeholder="ej: uglyCash Tag, Corriente Comercial, Ahorros, ACH"
                    className="w-full bg-[#131926] border border-slate-700 rounded-lg p-2 text-white"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">
                    {accountForm.pais === 'US' || accountForm.banco?.toLowerCase().includes('uglycash') ? 'uglyCash Tag / Usuario' : 'Número de Cuenta o IBAN'}
                  </label>
                  <input
                    type="text"
                    required
                    value={accountForm.numero}
                    onChange={(e) => setAccountForm({ ...accountForm, numero: e.target.value })}
                    placeholder={accountForm.pais === 'US' ? 'ej: $victormatos' : 'ej: 7829-1928-3011'}
                    className="w-full bg-[#131926] border border-slate-700 rounded-lg p-2 text-white font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Titular Oficial de la Cuenta</label>
                <input
                  type="text"
                  required
                  value={accountForm.titular}
                  onChange={(e) => setAccountForm({ ...accountForm, titular: e.target.value })}
                  placeholder="ej: Víctor Matos · Goglite Digital"
                  className="w-full bg-[#131926] border border-slate-700 rounded-lg p-2 text-white"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Instrucciones de Pago para el Cliente (Opcional)</label>
                <textarea
                  rows={2}
                  value={accountForm.instrucciones}
                  onChange={(e) => setAccountForm({ ...accountForm, instrucciones: e.target.value })}
                  placeholder="ej: Envío instantáneo $0 comisiones desde EE.UU. a través de la aplicación móvil uglyCash hacia el tag $victormatos"
                  className="w-full bg-[#131926] border border-slate-700 rounded-lg p-2 text-white resize-none"
                />
              </div>

              <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={accountForm.activa}
                    onChange={(e) => setAccountForm({ ...accountForm, activa: e.target.checked })}
                    className="rounded bg-slate-900 border-slate-700 text-orange-500 focus:ring-0"
                  />
                  <span>Cuenta activa para facturación</span>
                </label>

                <label className="flex items-center gap-2 text-amber-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={accountForm.predeterminada}
                    onChange={(e) => setAccountForm({ ...accountForm, predeterminada: e.target.checked })}
                    className="rounded bg-slate-900 border-slate-700 text-amber-500 focus:ring-0"
                  />
                  <span>Predeterminada ({accountForm.pais})</span>
                </label>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setAccountModalOpen(false)}
                  className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-orange-600 hover:bg-orange-500 text-white font-bold shadow-glow-sm"
                >
                  {editingAccountId ? 'Actualizar Cuenta' : 'Guardar Nueva Cuenta'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ASENTAR SESIÓN CRONOMETRADA EN BITÁCORA CONTABLE */}
      {stopTimerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#0f1420] border border-emerald-500/40 rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-emerald-950/40 border border-emerald-500/30 text-emerald-400">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Registrar Sesión Cronometrada</h3>
                  <p className="text-xs text-slate-400 font-mono">Asentar horas en la bitácora contable P&L</p>
                </div>
              </div>
              <button
                onClick={() => setStopTimerModalOpen(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmSaveTimer} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Cliente / Proyecto Asociado</label>
                <select
                  required
                  value={stopTimerForm.cliente}
                  onChange={(e) => {
                    const cl = e.target.value;
                    const match = facturas.find(f => f.cliente?.empresa === cl);
                    setStopTimerForm({
                      ...stopTimerForm,
                      cliente: cl,
                      proyectoId: match?.proyectoId || stopTimerForm.proyectoId
                    });
                  }}
                  className="w-full bg-[#131926] border border-slate-700 rounded-lg p-2 text-white"
                >
                  {facturas.map(f => (
                    <option key={f.id} value={f.cliente?.empresa}>
                      {f.cliente?.empresa} ({f.numeroFactura})
                    </option>
                  ))}
                  <option value="General Agencia">General Agencia / I+D</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-400 block mb-1">Horas Calculadas (Decimal)</label>
                  <input
                    type="number"
                    step="0.05"
                    min="0.05"
                    required
                    value={stopTimerForm.horas}
                    onChange={(e) => setStopTimerForm({ ...stopTimerForm, horas: e.target.value })}
                    className="w-full bg-[#131926] border border-slate-700 rounded-lg p-2 text-white font-mono font-bold text-sm"
                  />
                  <span className="text-[10px] text-emerald-400 font-mono mt-0.5 block">
                    Tiempo real: {formatTime(displaySeconds)}
                  </span>
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Categoría</label>
                  <select
                    value={stopTimerForm.categoria}
                    onChange={(e) => setStopTimerForm({ ...stopTimerForm, categoria: e.target.value })}
                    className="w-full bg-[#131926] border border-slate-700 rounded-lg p-2 text-white"
                  >
                    <option value="desarrollo">Desarrollo Web / App</option>
                    <option value="diseño">Diseño UI / UX</option>
                    <option value="geo_ia">GEO & Posicionamiento IA</option>
                    <option value="reunion">Reunión de Cierre / Brief</option>
                    <option value="soporte">Soporte & Mantenimiento</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Concepto / Descripción del Trabajo</label>
                <textarea
                  required
                  rows={2}
                  value={stopTimerForm.concepto}
                  onChange={(e) => setStopTimerForm({ ...stopTimerForm, concepto: e.target.value })}
                  placeholder="ej: Integración de pasarelas, maquetación responsive..."
                  className="w-full bg-[#131926] border border-slate-700 rounded-lg p-2 text-white resize-none"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Responsable</label>
                <input
                  type="text"
                  value={stopTimerForm.responsable}
                  onChange={(e) => setStopTimerForm({ ...stopTimerForm, responsable: e.target.value })}
                  className="w-full bg-[#131926] border border-slate-700 rounded-lg p-2 text-white"
                />
              </div>

              <div className="p-2.5 rounded-lg bg-emerald-950/20 border border-emerald-500/20 text-[11px] text-slate-300">
                <div className="flex justify-between font-mono">
                  <span>Impacto en Coste de Mano de Obra:</span>
                  <span className="text-purple-300 font-bold">
                    +${(Number(stopTimerForm.horas || 0) * (Number(configuracion.costoHoraInterno) || 20)).toFixed(2)} USD
                  </span>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setStopTimerModalOpen(false)}
                  className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-md flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Confirmar & Asentar</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
