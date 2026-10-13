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
  Link2
} from 'lucide-react';

const STORAGE_KEY_FINANZAS = 'goglite_finanzas_v1';

const DEFAULT_CONFIGURACION = {
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
  cuentasBancarias: {
    SV: {
      banco: 'Banco Agrícola El Salvador (Transferencia365)',
      tipo: 'Cuenta Corriente Empresarial',
      numero: '0031-0029-4821',
      titular: 'Goglite Agency SV · Víctor Matos'
    },
    DO: {
      banco: 'Banco Popular Dominicano (LBTR / ACH)',
      tipo: 'Cuenta Corriente Comercial',
      numero: '7829-1928-3011',
      titular: 'Goglite Digital DO · Víctor Matos'
    }
  }
};

const INITIAL_SEED_STATE = {
  facturas: [
    {
      id: 'fac-prop-2026-001',
      numeroFactura: 'FAC-2026-001',
      presupuestoId: 'prop-2026-001',
      codigoPresupuesto: 'P-2026-001',
      proyectoId: 'proj-001',
      codigoProyecto: 'CON-2026-001',
      origenModulo: 'Módulo 3 · Presupuesto VIP',
      cliente: {
        empresa: 'Grúas Andrea / Grúas Andrés',
        contacto: 'Brayan Muñoz',
        email: 'contacto@gruasandrea.com',
        telefono: '+1 (323) 901-3886',
        identificacion: 'ID Comercial · Los Ángeles / SV',
        pais: 'SV'
      },
      concepto: 'Sistema Integral Web Mobile-First, Plan Google Ads, Google Maps & Códigos QR',
      fechaEmision: '2026-10-10',
      fechaVencimiento: '2026-10-25',
      subtotal: 250,
      impuestoPorcentaje: 0,
      impuestoTotal: 0,
      total: 250,
      moneda: 'USD',
      montoCobrado: 100,
      saldoPendiente: 150,
      estado: 'parcial',
      metodoPago: 'Banco Agrícola El Salvador (Transferencia365)',
      horasInvertidasEstimadas: 5,
      items: [
        {
          descripcion: 'MÓDULO 1 & 2: Plataforma Web Corporativa Mobile-First + Canales WhatsApp & Click-to-Call',
          cantidad: 1,
          precioUnitario: 135,
          total: 135
        },
        {
          descripcion: 'MÓDULO 3 & 4: Optimización Google Maps (Local Pack) + Ecosistema Redes Sociales',
          cantidad: 1,
          precioUnitario: 60,
          total: 60
        },
        {
          descripcion: 'MÓDULO 5 & 6: Plan Estratégico Google Ads + Códigos QR Inteligentes (Flota y Reseñas)',
          cantidad: 1,
          precioUnitario: 55,
          total: 55
        }
      ]
    },
    {
      id: 'fac-crm-caribes',
      numeroFactura: 'FAC-2026-002',
      presupuestoId: null,
      proyectoId: 'proj-002',
      codigoProyecto: 'CON-2026-002',
      origenModulo: 'Módulo 2 · CRM WhatsApp DO',
      cliente: {
        empresa: 'Caribes Tours',
        contacto: 'Sr. Peña Lavia',
        email: 'gerencia@caribestours.com.do',
        telefono: '+1 809 221-4422',
        identificacion: 'RNC: 1-01-58291-2',
        pais: 'DO'
      },
      concepto: 'Plataforma Web de Reservas, Optimización GEO IA & Automatización WhatsApp',
      fechaEmision: '2026-10-11',
      fechaVencimiento: '2026-10-26',
      subtotal: 1800,
      impuestoPorcentaje: 0,
      impuestoTotal: 0,
      total: 1800,
      moneda: 'USD',
      montoCobrado: 900,
      saldoPendiente: 900,
      estado: 'parcial',
      metodoPago: 'Banco Popular Dominicano (LBTR)',
      horasInvertidasEstimadas: 22,
      items: [
        {
          descripcion: 'Arquitectura Web Mobile-First de Alta Conversión & Consulta de Rutas',
          cantidad: 1,
          precioUnitario: 1200,
          total: 1200
        },
        {
          descripcion: 'Optimización Schema.org TravelAgency, GEO IA & Embudo WhatsApp Directo',
          cantidad: 1,
          precioUnitario: 600,
          total: 600
        }
      ]
    }
  ],
  gastos: [
    {
      id: 'gas-001',
      concepto: 'Servidor VPS Cloud NVMe (Hospedaje Multi-Sitio Agencia)',
      categoria: 'infraestructura',
      proveedor: 'Hetzner Cloud / Autohosteado',
      monto: 14.50,
      fecha: '2026-10-01',
      proyectoId: null,
      clienteAsociado: 'General Agencia',
      frecuencia: 'mensual',
      pagado: true
    },
    {
      id: 'gas-002',
      concepto: 'Dominio .com + SSL y DNS Cloudflare (Grúas Andrea)',
      categoria: 'infraestructura',
      proveedor: 'Porkbun Registrar',
      monto: 12.00,
      fecha: '2026-10-05',
      proyectoId: 'proj-001',
      clienteAsociado: 'Grúas Andrea / Grúas Andrés',
      frecuencia: 'unico',
      pagado: true
    },
    {
      id: 'gas-003',
      concepto: 'Consumo API Modelos IA (Auditorías GEO & Pitches)',
      categoria: 'software',
      proveedor: 'Google Gemini Flash Free/Tier',
      monto: 0.00,
      fecha: '2026-10-08',
      proyectoId: null,
      clienteAsociado: 'General Agencia',
      frecuencia: 'mensual',
      pagado: true
    }
  ],
  timeEntries: [
    {
      id: 'time-001',
      proyectoId: 'proj-001',
      cliente: 'Grúas Andrea / Grúas Andrés',
      concepto: 'Diseño UX Hero de Emergencia & Estructura StoryBrand',
      categoria: 'diseño',
      horas: 2.0,
      costoHora: 20,
      fecha: '2026-10-10',
      responsable: 'Director UX'
    },
    {
      id: 'time-002',
      proyectoId: 'proj-001',
      cliente: 'Grúas Andrea / Grúas Andrés',
      concepto: 'Maquetación Mobile-First, Botón WhatsApp & Códigos QR',
      categoria: 'desarrollo',
      horas: 3.0,
      costoHora: 20,
      fecha: '2026-10-11',
      responsable: 'Senior Dev'
    },
    {
      id: 'time-003',
      proyectoId: 'proj-002',
      cliente: 'Caribes Tours',
      concepto: 'Arquitectura Frontend, Catálogo de Rutas & Schema JSON-LD',
      categoria: 'desarrollo',
      horas: 14.0,
      costoHora: 20,
      fecha: '2026-10-12',
      responsable: 'Senior Dev'
    }
  ],
  configuracion: DEFAULT_CONFIGURACION
};

/**
 * Motor Contable Reactivo Isomórfico ($0 Cost Client + Server)
 * Calcula KPIs P&L, Unit Economics por proyecto y Alertas de Dilución Horaria en 0ms.
 */
function computeFinanzasSummary(rawState) {
  const facturas = Array.isArray(rawState?.facturas) ? rawState.facturas : [];
  const gastos = Array.isArray(rawState?.gastos) ? rawState.gastos : [];
  const timeEntries = Array.isArray(rawState?.timeEntries) ? rawState.timeEntries : [];
  const configuracion = {
    ...DEFAULT_CONFIGURACION,
    ...(rawState?.configuracion || {}),
    emisor: {
      ...DEFAULT_CONFIGURACION.emisor,
      ...(rawState?.configuracion?.emisor || {})
    },
    cuentasBancarias: {
      SV: {
        ...DEFAULT_CONFIGURACION.cuentasBancarias.SV,
        ...(rawState?.configuracion?.cuentasBancarias?.SV || {})
      },
      DO: {
        ...DEFAULT_CONFIGURACION.cuentasBancarias.DO,
        ...(rawState?.configuracion?.cuentasBancarias?.DO || {})
      }
    }
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

  // Rentabilidad Unitaria por cada Factura / Proyecto
  const proyectosRentabilidad = facturas.map(f => {
    const empLower = (f.cliente?.empresa || '').toLowerCase().trim();

    // Gastos directos vinculados a este proyecto o cliente
    const gastosProyecto = gastos
      .filter(g => {
        if (g.proyectoId && f.proyectoId && g.proyectoId === f.proyectoId) return true;
        if (g.facturaId && g.facturaId === f.id) return true;
        if (g.clienteAsociado && empLower && g.clienteAsociado.toLowerCase().trim() === empLower) return true;
        return false;
      })
      .reduce((acc, g) => acc + (Number(g.monto) || 0), 0);

    // Horas registradas en Time Tracking para este proyecto o cliente
    const entriesProj = timeEntries.filter(t => {
      if (t.proyectoId && f.proyectoId && t.proyectoId === f.proyectoId) return true;
      if (t.cliente && empLower && t.cliente.toLowerCase().trim() === empLower) return true;
      return false;
    });

    const horasRegistradas = entriesProj.reduce((acc, t) => acc + (Number(t.horas) || 0), 0);
    const horasEstimadas = Number(f.horasInvertidasEstimadas) || 10;
    const horasInvertidas = horasRegistradas > 0 ? horasRegistradas : horasEstimadas;

    const costeHoras = horasInvertidas * costoHora;
    const costeTotalProyecto = gastosProyecto + costeHoras;
    const precioVenta = Number(f.total) || 0;
    const gananciaNeta = precioVenta - costeTotalProyecto;
    const margenUnitario = precioVenta > 0 ? Math.round((gananciaNeta / precioVenta) * 100) : 0;

    const tarifaEfectivaHora = horasInvertidas > 0 ? Math.round(precioVenta / horasInvertidas) : 0;
    const rentabilidadHorariaNeta = horasInvertidas > 0 ? Math.round((precioVenta - gastosProyecto) / horasInvertidas) : 0;
    const alertaDilucion = tarifaEfectivaHora < Math.round(tarifaObjetivo * 0.7);

    return {
      facturaId: f.id,
      numeroFactura: f.numeroFactura,
      proyectoId: f.proyectoId || f.id,
      presupuestoId: f.presupuestoId || null,
      origenModulo: f.origenModulo || 'Facturación Directa',
      cliente: f.cliente?.empresa || 'Cliente',
      contacto: f.cliente?.contacto || '',
      pais: f.cliente?.pais || 'SV',
      precioVendido: precioVenta,
      cobrado: Number(f.montoCobrado) || 0,
      saldoPendiente: Math.max(0, precioVenta - (Number(f.montoCobrado) || 0)),
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
 * Convierte un Presupuesto del Módulo 3 en un objeto Factura Proforma compatible con Módulo 4
 */
function buildInvoiceFromPresupuesto(prop, existingCount = 0, configuracion = DEFAULT_CONFIGURACION) {
  const nextNum = String(existingCount + 1).padStart(3, '0');
  const subtotal = Number(prop.inversion?.precioTotal) || 250;
  const anticipo = Number(prop.inversion?.anticipo) ?? Math.round(subtotal * 0.5);
  const pais = prop.pais || (prop.cliente?.ubicacion?.toLowerCase().includes('dominicana') ? 'DO' : 'SV');

  // Calcular horas estimadas sumando las horas de los módulos de la propuesta
  const modulosHoras = Array.isArray(prop.modulos)
    ? prop.modulos.reduce((acc, m) => acc + (Number(m.horas) || 0), 0)
    : 0;
  const horasInvertidasEstimadas = modulosHoras > 0 ? modulosHoras : Math.max(5, Math.round(subtotal / 50));

  const items = Array.isArray(prop.modulos) && prop.modulos.length > 0
    ? prop.modulos.map(m => ({
        descripcion: `${m.numero ? m.numero + ': ' : ''}${m.titulo}`,
        cantidad: 1,
        precioUnitario: Number(m.precio) || Math.round(subtotal / prop.modulos.length),
        total: Number(m.precio) || Math.round(subtotal / prop.modulos.length)
      }))
    : [
        {
          descripcion: prop.titulo || 'Desarrollo de Sistema Digital Web & Posicionamiento IA',
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
    metodoPago: pais === 'DO'
      ? (configuracion?.cuentasBancarias?.DO?.banco || 'Banco Popular Dominicano')
      : (configuracion?.cuentasBancarias?.SV?.banco || 'Banco Agrícola El Salvador'),
    horasInvertidasEstimadas,
    items
  };
}

/**
 * Generador de Factura Comercial HTML/PDF Autosuficiente (Skill: automated-html-invoice)
 * Sigue estrictamente la paleta corporativa (#FF6B00, #1A1A1A, #FAFAFA)
 */
function buildCorporateInvoiceHtml(invoice, configuracion = DEFAULT_CONFIGURACION) {
  const emisor = configuracion?.emisor || DEFAULT_CONFIGURACION.emisor;
  const pais = invoice.cliente?.pais || 'SV';
  const cuenta = pais === 'DO'
    ? (configuracion?.cuentasBancarias?.DO || DEFAULT_CONFIGURACION.cuentasBancarias.DO)
    : (configuracion?.cuentasBancarias?.SV || DEFAULT_CONFIGURACION.cuentasBancarias.SV);

  const estadoLabel = invoice.estado === 'cobrada'
    ? 'PAGADA 100%'
    : invoice.estado === 'parcial'
    ? 'ANTICIPO COBRADO (PARCIAL)'
    : 'PENDIENTE DE PAGO';

  const badgeBg = invoice.estado === 'cobrada' ? '#DCFCE7' : '#FFF0E6';
  const badgeColor = invoice.estado === 'cobrada' ? '#15803D' : '#FF6B00';

  const rowsHtml = (invoice.items || []).map((item, idx) => `
    <tr style="background: ${idx % 2 === 1 ? '#FAFAFA' : '#FFFFFF'};">
      <td style="padding: 14px 16px; font-size: 13px; border-bottom: 1px solid #EEEEEE; color: #1A1A1A; font-weight: 500;">
        ${item.descripcion || 'Servicio Digital'}
      </td>
      <td style="padding: 14px 16px; font-size: 13px; border-bottom: 1px solid #EEEEEE; text-align: center; font-family: monospace;">
        ${item.cantidad || 1}
      </td>
      <td style="padding: 14px 16px; font-size: 13px; border-bottom: 1px solid #EEEEEE; text-align: right; font-family: monospace;">
        $${Number(item.precioUnitario || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })} USD
      </td>
      <td style="padding: 14px 16px; font-size: 13px; border-bottom: 1px solid #EEEEEE; text-align: right; font-family: monospace; font-weight: 700; color: #1A1A1A;">
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
    body { background-color: #FAFAFA; color: #1A1A1A; padding: 36px 20px; display: flex; justify-content: center; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .invoice-card { background: #FFFFFF; width: 100%; max-width: 820px; padding: 48px; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.06); border: 1px solid #EBEBEB; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 36px; padding-bottom: 24px; border-bottom: 2px solid #1A1A1A; }
    .brand-box { display: flex; align-items: center; gap: 14px; }
    .brand-badge { width: 46px; height: 46px; border-radius: 10px; background: #FF6B00; color: #FFFFFF; display: flex; align-items: center; justify-content: center; font-size: 24px; font-weight: 900; }
    .logo { font-size: 24px; font-weight: 900; color: #1A1A1A; text-transform: uppercase; letter-spacing: -0.5px; }
    .logo span { color: #FF6B00; }
    .brand-sub { font-size: 12px; color: #555555; margin-top: 2px; }
    .invoice-meta { text-align: right; }
    .invoice-label { font-size: 11px; text-transform: uppercase; letter-spacing: 1.2px; color: #888888; font-weight: 700; }
    .invoice-title { font-size: 26px; font-weight: 900; color: #FF6B00; font-family: monospace; margin-top: 2px; }
    .status-badge { display: inline-block; padding: 6px 14px; background: ${badgeBg}; color: ${badgeColor}; font-size: 11px; font-weight: 800; border-radius: 20px; margin-top: 8px; letter-spacing: 0.5px; }
    .parties { display: flex; justify-content: space-between; gap: 32px; margin-bottom: 32px; }
    .party-col { flex: 1; background: #FAFAFA; padding: 18px 20px; border-radius: 10px; border: 1px solid #EEEEEE; }
    .party-title { font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: #FF6B00; font-weight: 800; margin-bottom: 8px; }
    .party-name { font-size: 15px; font-weight: 800; color: #1A1A1A; margin-bottom: 4px; }
    .party-detail { font-size: 12.5px; color: #555555; line-height: 1.55; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 28px; page-break-inside: avoid; }
    th { background: #1A1A1A; color: #FFFFFF; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.6px; padding: 12px 16px; text-align: left; }
    .totals-wrapper { display: flex; justify-content: flex-end; margin-bottom: 32px; page-break-inside: avoid; }
    .totals-box { width: 320px; background: #FAFAFA; padding: 18px 20px; border-radius: 10px; border: 1px solid #EEEEEE; }
    .totals-row { display: flex; justify-content: space-between; padding: 7px 0; font-size: 13px; color: #555555; }
    .totals-row.final { border-top: 2px solid #1A1A1A; color: #1A1A1A; font-size: 17px; font-weight: 900; padding-top: 12px; margin-top: 6px; }
    .totals-row.final span.highlight { color: #FF6B00; font-family: monospace; }
    .confirmation-box { background: #FAFAFA; border-left: 4px solid #FF6B00; padding: 16px 20px; border-radius: 6px; font-size: 12.5px; color: #444444; line-height: 1.6; page-break-inside: avoid; }
    @media print {
      @page { size: A4 portrait; margin: 12mm; }
      body { background: #FFFFFF; padding: 0; }
      .invoice-card { box-shadow: none; border: none; padding: 0; width: 100%; max-width: 100%; }
    }
  </style>
</head>
<body>
  <div class="invoice-card">
    <div class="header">
      <div class="brand-box">
        <div class="brand-badge">G</div>
        <div>
          <div class="logo">GOG<span>LITE</span></div>
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
        <div class="totals-row" style="color: #15803D; font-weight: 700; padding-top: 10px;">
          <span>Monto Cobrado / Anticipo:</span>
          <span style="font-family: monospace;">$${Number(invoice.montoCobrado || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })} USD</span>
        </div>
        <div class="totals-row" style="color: #D97706; font-weight: 800; border-top: 1px solid #E5E7EB; padding-top: 8px;">
          <span>Saldo Pendiente:</span>
          <span style="font-family: monospace;">$${Number(invoice.saldoPendiente ?? Math.max(0, (invoice.total || 0) - (invoice.montoCobrado || 0))).toLocaleString('en-US', { minimumFractionDigits: 2 })} USD</span>
        </div>
      </div>
    </div>

    <div class="confirmation-box">
      <strong style="color: #1A1A1A; display: block; margin-bottom: 4px;">CONFIRMACIÓN DEL SISTEMA & DATOS BANCARIOS DE PAGO:</strong>
      • <strong>Método / Banco:</strong> ${cuenta.banco} (${cuenta.tipo})<br/>
      • <strong>Número de Cuenta:</strong> <span style="font-family: monospace; font-weight: 700; color: #1A1A1A;">${cuenta.numero}</span> · <strong>Titular:</strong> ${cuenta.titular}<br/>
      • <strong>Condiciones:</strong> Anticipo del 50% al inicio y 50% contra entrega final verificada. Referencia de sistema: <span style="font-family: monospace;">${invoice.id}</span> (${invoice.origenModulo || 'Goglite ERP'}).
    </div>
  </div>
</body>
</html>`;
}

export default function GestionRentabilidadModule({
  selectedCountry = 'SV',
  presupuestoToBill,
  onClearPresupuestoToBill,
  onNavigateToPresupuestos
}) {
  // 1. Estado Local-First persistido en localStorage (0ms latency, 100% offline/static resilient)
  const [finanzasState, setFinanzasState] = useState(() => {
    try {
      if (typeof window !== 'undefined') {
        const saved = localStorage.getItem(STORAGE_KEY_FINANZAS);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed && Array.isArray(parsed.facturas) && parsed.facturas.length > 0) {
            return parsed;
          }
        }
      }
    } catch (e) {
      console.warn('Error leyendo caché de finanzas:', e);
    }
    return INITIAL_SEED_STATE;
  });

  const [activeTab, setActiveTab] = useState('resumen'); // 'resumen' | 'facturas' | 'gastos' | 'horas' | 'config'
  const [countryFilter, setCountryFilter] = useState('ALL'); // 'ALL' | 'SV' | 'DO'
  const [searchTerm, setSearchTerm] = useState('');
  const [toastMsg, setToastMsg] = useState('');

  // Sources from Modules 1, 2, and 3 for retrospective compatibility
  const [m3Presupuestos, setM3Presupuestos] = useState([]);
  const [m2CrmLeads, setM2CrmLeads] = useState([]);
  const [m1ScrapperLeads, setM1ScrapperLeads] = useState([]);

  // Invoice view / print modal
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [customPaymentAmount, setCustomPaymentAmount] = useState('');

  // New Invoice Modal
  const [newInvoiceModalOpen, setNewInvoiceModalOpen] = useState(false);
  const [selectedSourceKey, setSelectedSourceKey] = useState('');
  const [newInvoiceForm, setNewInvoiceForm] = useState({
    numeroFactura: '',
    presupuestoId: null,
    origenModulo: 'Facturación Directa',
    empresa: '',
    contacto: '',
    email: '',
    telefono: '',
    identificacion: '',
    pais: selectedCountry || 'SV',
    concepto: 'Desarrollo Web & GEO IA',
    subtotal: 1500,
    impuestoPorcentaje: 0,
    total: 1500,
    montoCobrado: 750,
    horasInvertidasEstimadas: 18,
    metodoPago: 'Transferencia Bancaria',
    itemDescripcion: 'Implementación Web & Posicionamiento IA',
    itemCantidad: 1,
    itemPrecio: 1500,
    itemsCustom: null
  });

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

  // Config Form State
  const [configForm, setConfigForm] = useState(() => ({
    ...DEFAULT_CONFIGURACION,
    ...(finanzasState?.configuracion || {})
  }));

  const getBackendEndpoint = (endpoint) => {
    if (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
      return `http://localhost:3001${endpoint}`;
    }
    return endpoint;
  };

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3200);
  };

  // Persistir automáticamente en localStorage cada vez que cambie finanzasState
  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && finanzasState) {
        localStorage.setItem(STORAGE_KEY_FINANZAS, JSON.stringify(finanzasState));
      }
    } catch (e) {
      console.warn('Error guardando finanzas en localStorage:', e);
    }
  }, [finanzasState]);

  // Cargar datos retrospectivos de Módulos 1, 2 y 3 + sincronizar con backend si está online
  useEffect(() => {
    loadRetrospectiveModules();
    fetchFinanzasFromBackend();
  }, []);

  const loadRetrospectiveModules = () => {
    try {
      if (typeof window === 'undefined') return;

      const rawM3 = localStorage.getItem('goglite_presupuestos');
      const parsedM3 = rawM3 ? JSON.parse(rawM3) : [];
      if (Array.isArray(parsedM3)) setM3Presupuestos(parsedM3);

      const rawM2 = localStorage.getItem('goglite_crm_leads_v3');
      const parsedM2 = rawM2 ? JSON.parse(rawM2) : [];
      if (Array.isArray(parsedM2)) setM2CrmLeads(parsedM2);

      const rawM1 = localStorage.getItem('goglite_outbound_leads');
      const parsedM1 = rawM1 ? JSON.parse(rawM1) : [];
      if (Array.isArray(parsedM1)) setM1ScrapperLeads(parsedM1);

      // Auto-importar presupuestos aceptados del Módulo 3 que aún no tengan factura en Módulo 4
      if (Array.isArray(parsedM3) && parsedM3.length > 0) {
        setFinanzasState(prev => {
          const currentFacturas = [...(prev.facturas || [])];
          let added = 0;

          parsedM3.forEach(prop => {
            if (prop.estado === 'aceptado') {
              const alreadyExists = currentFacturas.some(
                f => f.presupuestoId === prop.id ||
                     f.codigoPresupuesto === prop.codigo ||
                     (f.cliente?.empresa && prop.cliente?.empresa &&
                      f.cliente.empresa.toLowerCase().trim() === prop.cliente.empresa.toLowerCase().trim())
              );
              if (!alreadyExists) {
                const newFac = buildInvoiceFromPresupuesto(prop, currentFacturas.length, prev.configuracion);
                currentFacturas.unshift(newFac);
                added++;
              }
            }
          });

          if (added > 0) {
            return { ...prev, facturas: currentFacturas };
          }
          return prev;
        });
      }
    } catch (e) {
      console.warn('Error cargando módulos retrospectivos 1-3:', e);
    }
  };

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
            facturas: mergedFacturas.length > 0 ? mergedFacturas : INITIAL_SEED_STATE.facturas,
            gastos: mergedGastos.length > 0 ? mergedGastos : INITIAL_SEED_STATE.gastos,
            timeEntries: mergedTimes.length > 0 ? mergedTimes : INITIAL_SEED_STATE.timeEntries,
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

      // 1. Revisar presupuestos en Módulo 3
      let listM3 = m3Presupuestos;
      try {
        const raw = localStorage.getItem('goglite_presupuestos');
        if (raw) listM3 = JSON.parse(raw);
      } catch {}

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
        const raw = localStorage.getItem('goglite_crm_leads_v3');
        if (raw) listM2 = JSON.parse(raw);
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

  // Create Invoice (Local-First + Backend Sync)
  const handleCreateInvoice = async (e) => {
    e.preventDefault();
    const nextNum = String(facturas.length + 1).padStart(3, '0');
    const subtotal = Number(newInvoiceForm.subtotal) || Number(newInvoiceForm.total) || 250;
    const taxPct = Number(newInvoiceForm.impuestoPorcentaje) || 0;
    const impuestoTotal = Math.round(subtotal * (taxPct / 100) * 100) / 100;
    const total = Math.round((subtotal + impuestoTotal) * 100) / 100;
    const montoCobrado = Number(newInvoiceForm.montoCobrado) || 0;

    const nuevaFactura = {
      id: 'fac-' + Date.now(),
      numeroFactura: newInvoiceForm.numeroFactura || `FAC-2026-${nextNum}`,
      presupuestoId: newInvoiceForm.presupuestoId || null,
      proyectoId: 'proj-' + Date.now(),
      codigoProyecto: `CON-2026-${nextNum}`,
      origenModulo: newInvoiceForm.origenModulo || 'Facturación Directa',
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
      estado: montoCobrado >= total ? 'cobrada' : montoCobrado > 0 ? 'parcial' : 'pendiente',
      metodoPago: newInvoiceForm.metodoPago || 'Transferencia Bancaria',
      horasInvertidasEstimadas: Number(newInvoiceForm.horasInvertidasEstimadas) || 10,
      items: Array.isArray(newInvoiceForm.itemsCustom) && newInvoiceForm.itemsCustom.length > 0
        ? newInvoiceForm.itemsCustom
        : [
            {
              descripcion: newInvoiceForm.itemDescripcion || 'Implementación Web & Posicionamiento IA',
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

  // Print or Save PDF using Corporate Automated HTML Invoice Template ($0 Cost)
  const handlePrintInvoicePdf = (invoice) => {
    const html = buildCorporateInvoiceHtml(invoice, configuracion);
    const printWin = window.open('', '_blank', 'width=900,height=950');
    if (printWin) {
      printWin.document.open();
      printWin.document.write(html);
      printWin.document.close();
      printWin.focus();
      setTimeout(() => {
        printWin.print();
      }, 250);
    } else {
      window.print();
    }
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

  // Filtered lists
  const filteredFacturas = facturas.filter(f => {
    const matchCountry = countryFilter === 'ALL' || f.cliente?.pais === countryFilter;
    const term = searchTerm.toLowerCase();
    const matchSearch = !term ||
      f.cliente?.empresa?.toLowerCase().includes(term) ||
      f.numeroFactura?.toLowerCase().includes(term) ||
      f.concepto?.toLowerCase().includes(term) ||
      f.origenModulo?.toLowerCase().includes(term);
    return matchCountry && matchSearch;
  });

  const filteredRentabilidad = proyectosRentabilidad.filter(p => {
    const matchCountry = countryFilter === 'ALL' || p.pais === countryFilter;
    const term = searchTerm.toLowerCase();
    const matchSearch = !term ||
      p.cliente?.toLowerCase().includes(term) ||
      p.numeroFactura?.toLowerCase().includes(term) ||
      p.origenModulo?.toLowerCase().includes(term);
    return matchCountry && matchSearch;
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

      {/* 1. TOP METRICS P&L DASHBOARD */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        
        {/* Facturación Total */}
        <div className="p-4 rounded-xl bg-[#0e131f] border border-slate-800/80 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase text-slate-400 font-semibold">Facturación Bruta</span>
            <span className="p-1.5 rounded-lg bg-orange-500/10 text-orange-400"><DollarSign className="w-4 h-4" /></span>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-black text-white font-mono">
              ${kpis.totalFacturado.toLocaleString()} <span className="text-xs font-normal text-slate-400">USD</span>
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">{facturas.length} proyectos facturados</div>
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
              ${kpis.totalCobrado.toLocaleString()} <span className="text-xs font-normal text-slate-400">USD</span>
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
              ${kpis.saldoPorCobrar.toLocaleString()} <span className="text-xs font-normal text-slate-400">USD</span>
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
              ${(kpis.totalGastosOperativos + kpis.costeManoObraTotal).toLocaleString()} <span className="text-xs font-normal text-slate-400">USD</span>
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">
              Directos (${kpis.totalGastosOperativos.toFixed(0)}) + Horas (${kpis.costeManoObraTotal.toFixed(0)})
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
              {kpis.margenNetoPorcentaje}%
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">
              Beneficio Neto: <span className="font-bold text-white">${kpis.beneficioNetoReal.toLocaleString()} USD</span>
            </div>
          </div>
        </div>

      </div>

      {/* 2. NAVIGATION BAR & FILTER CONTROLS */}
      <div className="flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-3 p-3.5 rounded-xl bg-[#0e131f] border border-slate-800/80">
        
        {/* Tabs Switch */}
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
            className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-colors ${activeTab === 'horas' ? 'bg-slate-800 text-orange-400 font-semibold' : 'text-slate-400 hover:text-slate-200'}`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Time Tracking ({timeEntries.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('config')}
            className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-colors ${activeTab === 'config' ? 'bg-slate-800 text-orange-400 font-semibold' : 'text-slate-400 hover:text-slate-200'}`}
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Bancos & Tarifas</span>
          </button>
        </div>

        {/* Actions & Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar cliente o factura..."
              className="bg-[#131926] border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-orange-500 w-44"
            />
          </div>

          {/* Country Filter */}
          <div className="flex items-center bg-[#131926] border border-slate-800 rounded-lg p-0.5 text-xs">
            <button
              onClick={() => setCountryFilter('ALL')}
              className={`px-2.5 py-1 rounded-md transition-colors ${countryFilter === 'ALL' ? 'bg-orange-600 text-white font-semibold' : 'text-slate-400 hover:text-slate-200'}`}
            >
              Todos
            </button>
            <button
              onClick={() => setCountryFilter('SV')}
              className={`px-2.5 py-1 rounded-md transition-colors ${countryFilter === 'SV' ? 'bg-orange-600 text-white font-semibold' : 'text-slate-400 hover:text-slate-200'}`}
            >
              🇸🇻 SV
            </button>
            <button
              onClick={() => setCountryFilter('DO')}
              className={`px-2.5 py-1 rounded-md transition-colors ${countryFilter === 'DO' ? 'bg-orange-600 text-white font-semibold' : 'text-slate-400 hover:text-slate-200'}`}
            >
              🇩🇴 DO
            </button>
          </div>

          {/* Sync M1-M2-M3 Button */}
          <button
            onClick={handleSyncRetrospectiveModules}
            className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1.5 transition-colors border border-slate-700"
            title="Sincronizar presupuestos aceptados (Módulo 3) y cierres CRM (Módulo 2)"
          >
            <RefreshCw className="w-3.5 h-3.5 text-orange-400" />
            <span>Sync M1-M3</span>
          </button>

          {/* Export CSV */}
          <button
            onClick={handleExportCsv}
            className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1.5 transition-colors border border-slate-700"
            title="Exportar P&L y Facturas a Excel CSV ($0)"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span>CSV</span>
          </button>

          {/* Primary CTA depending on active tab */}
          {(activeTab === 'resumen' || activeTab === 'facturas') && (
            <button
              onClick={() => {
                loadRetrospectiveModules();
                setNewInvoiceModalOpen(true);
              }}
              className="px-3.5 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-glow-sm transition-all shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Nueva Factura</span>
            </button>
          )}

          {activeTab === 'gastos' && (
            <button
              onClick={() => setNewExpenseModalOpen(true)}
              className="px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md transition-all shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Registrar Gasto</span>
            </button>
          )}

          {activeTab === 'horas' && (
            <button
              onClick={() => setNewTimeModalOpen(true)}
              className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md transition-all shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Registrar Horas</span>
            </button>
          )}
        </div>
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
                          <span className="text-[10px] text-orange-400 font-mono font-semibold">{p.numeroFactura}</span>
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
                            const found = facturas.find(f => f.id === p.facturaId);
                            if (found) {
                              setSelectedInvoice(found);
                              setCustomPaymentAmount(String(found.montoCobrado || 0));
                            }
                          }}
                          className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors"
                        >
                          Ver Factura
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* 4. TAB 2: GESTOR DE FACTURAS & PROFORMAS */}
      {activeTab === 'facturas' && (
        <div className="bg-[#0c1017] border border-slate-800/80 rounded-xl overflow-hidden shadow-sm">
          <div className="p-3 bg-[#101522] border-b border-slate-800 text-xs font-bold text-slate-200 flex items-center justify-between">
            <span>Listado de Facturas Comerciales, Proformas & Cobros (50% / 50%)</span>
            <span className="text-[11px] font-mono text-slate-400">{filteredFacturas.length} registradas</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-[#0d121c] border-b border-slate-800 text-[11px] font-mono uppercase text-slate-400">
                <tr>
                  <th className="p-3">Nº Factura</th>
                  <th className="p-3">Cliente & Concepto</th>
                  <th className="p-3">Fechas</th>
                  <th className="p-3 text-right">Total USD</th>
                  <th className="p-3 text-right">Cobrado</th>
                  <th className="p-3 text-right">Saldo</th>
                  <th className="p-3 text-center">Estado</th>
                  <th className="p-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-sans">
                {filteredFacturas.map(fac => (
                  <tr key={fac.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="p-3 font-mono">
                      <div className="font-bold text-orange-400">{fac.numeroFactura}</div>
                      <div className="text-[10px] text-slate-500">{fac.origenModulo || 'Directa'}</div>
                    </td>
                    <td className="p-3">
                      <div className="font-semibold text-white">{fac.cliente?.empresa}</div>
                      <div className="text-[11px] text-slate-500 truncate max-w-xs">{fac.concepto}</div>
                    </td>
                    <td className="p-3 font-mono text-[11px] text-slate-400">
                      <div>Emisión: {fac.fechaEmision}</div>
                      <div className="text-slate-500">Vence: {fac.fechaVencimiento}</div>
                    </td>
                    <td className="p-3 text-right font-mono font-bold text-white">
                      ${Number(fac.total).toLocaleString()}
                    </td>
                    <td className="p-3 text-right font-mono text-emerald-400 font-semibold">
                      ${Number(fac.montoCobrado).toLocaleString()}
                    </td>
                    <td className="p-3 text-right font-mono text-amber-400">
                      ${Math.max(0, Number(fac.total) - Number(fac.montoCobrado)).toLocaleString()}
                    </td>
                    <td className="p-3 text-center">
                      <span className={`px-2 py-0.5 rounded-full font-mono text-[10px] font-bold uppercase ${
                        fac.estado === 'cobrada' ? 'bg-emerald-500/20 text-emerald-400' :
                        fac.estado === 'parcial' ? 'bg-sky-500/20 text-sky-400' :
                        'bg-amber-500/20 text-amber-400'
                      }`}>
                        {fac.estado === 'cobrada' ? 'Cobrada 100%' : fac.estado === 'parcial' ? 'Parcial (Anticipo)' : 'Pendiente'}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {fac.estado === 'pendiente' && (
                          <button
                            onClick={() => handleUpdatePayment(fac.id, Math.round(Number(fac.total) * 0.5))}
                            className="px-2 py-1 rounded bg-sky-500/15 hover:bg-sky-500/25 text-sky-300 text-[11px] font-semibold transition-colors"
                            title="Registrar cobro de anticipo (50%)"
                          >
                            50%
                          </button>
                        )}
                        {fac.estado !== 'cobrada' && (
                          <button
                            onClick={() => handleUpdatePayment(fac.id, fac.total)}
                            className="px-2 py-1 rounded bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 text-[11px] font-semibold transition-colors"
                            title="Marcar como cobrada 100%"
                          >
                            ✓ 100%
                          </button>
                        )}
                        <button
                          onClick={() => {
                            setSelectedInvoice(fac);
                            setCustomPaymentAmount(String(fac.montoCobrado || 0));
                          }}
                          className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors"
                        >
                          Factura PDF
                        </button>
                        <button
                          onClick={() => handleDeleteInvoice(fac.id)}
                          className="p-1 rounded text-slate-500 hover:text-rose-400 transition-colors"
                          title="Eliminar factura"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 5. TAB 3: CONTROL DE GASTOS OPERATIVOS */}
      {activeTab === 'gastos' && (
        <div className="bg-[#0c1017] border border-slate-800/80 rounded-xl overflow-hidden shadow-sm">
          <div className="p-3 bg-[#101522] border-b border-slate-800 text-xs font-bold text-slate-200 flex items-center justify-between">
            <span>Registro de Gastos Operativos Directos por Cliente & Agencia ($0 Suscripciones)</span>
            <span className="text-[11px] font-mono text-slate-400">Total: ${kpis.totalGastosOperativos.toFixed(2)} USD</span>
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
                {gastos.map(g => (
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
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 6. TAB 4: CONTROL DE HORAS & TIME TRACKING */}
      {activeTab === 'horas' && (
        <div className="space-y-6">
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
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-sans">
                  {proyectosRentabilidad.map(p => (
                    <tr key={p.facturaId} className="hover:bg-slate-800/30 transition-colors">
                      <td className="p-3">
                        <div className="font-semibold text-white">{p.cliente}</div>
                        <div className="text-[10px] font-mono text-slate-500">{p.numeroFactura}</div>
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
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Table: Time Entries Log */}
          <div className="bg-[#0c1017] border border-slate-800/80 rounded-xl overflow-hidden shadow-sm">
            <div className="p-3 bg-[#101522] border-b border-slate-800 text-xs font-bold text-slate-200 flex items-center justify-between">
              <span>Bitácora de Tiempos Registrados</span>
              <button
                onClick={() => setNewTimeModalOpen(true)}
                className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-[11px] flex items-center gap-1 transition-all shadow-sm"
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
                  {timeEntries.map(t => (
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
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 7. TAB 5: CONFIGURACIÓN FINANCIERA, TARIFAS & BANCOS REGIONALES */}
      {activeTab === 'config' && (
        <form onSubmit={handleSaveConfig} className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-xs">
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

          {/* Cuentas Bancarias Regionales */}
          <div className="p-5 rounded-xl bg-[#0c1017] border border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-sm text-white">Cuentas Bancarias Oficiales (SV & DO)</h3>
                <p className="text-[11px] text-slate-400">Se incrustan automáticamente en la Caja de Confirmación de cada factura PDF.</p>
              </div>
              <Building2 className="w-4 h-4 text-emerald-400" />
            </div>

            {/* El Salvador */}
            <div className="p-3.5 rounded-xl bg-[#111726] border border-slate-800 space-y-2">
              <div className="font-bold text-orange-400">🇸🇻 Cuenta Bancaria El Salvador</div>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={configForm.cuentasBancarias?.SV?.banco || ''}
                  onChange={(e) => setConfigForm({
                    ...configForm,
                    cuentasBancarias: {
                      ...configForm.cuentasBancarias,
                      SV: { ...(configForm.cuentasBancarias?.SV || {}), banco: e.target.value }
                    }
                  })}
                  placeholder="Banco"
                  className="bg-[#0b0f19] border border-slate-700 rounded-lg p-2 text-white"
                />
                <input
                  type="text"
                  value={configForm.cuentasBancarias?.SV?.numero || ''}
                  onChange={(e) => setConfigForm({
                    ...configForm,
                    cuentasBancarias: {
                      ...configForm.cuentasBancarias,
                      SV: { ...(configForm.cuentasBancarias?.SV || {}), numero: e.target.value }
                    }
                  })}
                  placeholder="Número de cuenta"
                  className="bg-[#0b0f19] border border-slate-700 rounded-lg p-2 text-white font-mono"
                />
              </div>
            </div>

            {/* República Dominicana */}
            <div className="p-3.5 rounded-xl bg-[#111726] border border-slate-800 space-y-2">
              <div className="font-bold text-sky-400">🇩🇴 Cuenta Bancaria República Dominicana</div>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={configForm.cuentasBancarias?.DO?.banco || ''}
                  onChange={(e) => setConfigForm({
                    ...configForm,
                    cuentasBancarias: {
                      ...configForm.cuentasBancarias,
                      DO: { ...(configForm.cuentasBancarias?.DO || {}), banco: e.target.value }
                    }
                  })}
                  placeholder="Banco"
                  className="bg-[#0b0f19] border border-slate-700 rounded-lg p-2 text-white"
                />
                <input
                  type="text"
                  value={configForm.cuentasBancarias?.DO?.numero || ''}
                  onChange={(e) => setConfigForm({
                    ...configForm,
                    cuentasBancarias: {
                      ...configForm.cuentasBancarias,
                      DO: { ...(configForm.cuentasBancarias?.DO || {}), numero: e.target.value }
                    }
                  })}
                  placeholder="Número de cuenta"
                  className="bg-[#0b0f19] border border-slate-700 rounded-lg p-2 text-white font-mono"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs shadow-glow-sm transition-all"
            >
              Guardar Configuración Financiera
            </button>
          </div>
        </form>
      )}

      {/* MODAL: PRINTABLE OFFICIAL CORPORATE INVOICE (automated-html-invoice style) */}
      {selectedInvoice && (
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

              {/* Quick Payment Adjuster inside Modal */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-1 bg-[#0b0f19] border border-slate-700 rounded-lg px-2 py-1 text-xs">
                  <span className="text-slate-400 text-[11px]">Cobrado $:</span>
                  <input
                    type="number"
                    value={customPaymentAmount}
                    onChange={(e) => setCustomPaymentAmount(e.target.value)}
                    className="w-20 bg-transparent text-emerald-400 font-mono font-bold focus:outline-none text-xs"
                  />
                  <button
                    onClick={() => handleUpdatePayment(selectedInvoice.id, customPaymentAmount)}
                    className="px-2 py-0.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold"
                  >
                    Aplicar
                  </button>
                </div>

                <button
                  onClick={() => handleDownloadInvoiceHtml(selectedInvoice)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs flex items-center gap-1.5 border border-slate-700 transition-all"
                  title="Descargar archivo HTML autosuficiente ($0)"
                >
                  <Download className="w-3.5 h-3.5 text-orange-400" />
                  <span>Descargar HTML</span>
                </button>

                <button
                  onClick={() => handlePrintInvoicePdf(selectedInvoice)}
                  className="px-3.5 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Imprimir / Guardar PDF</span>
                </button>

                <button
                  onClick={() => setSelectedInvoice(null)}
                  className="w-8 h-8 rounded-lg bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Corporate Invoice Preview (#FF6B00, #1A1A1A, #FAFAFA) */}
            <div className="p-6 sm:p-10 overflow-y-auto space-y-6 bg-[#FAFAFA] text-[#1A1A1A] font-sans">
              <div className="bg-white p-6 sm:p-10 rounded-xl border border-[#EBEBEB] shadow-sm space-y-7">
                
                {/* 1. Header de Factura */}
                <div className="flex flex-col sm:flex-row items-start justify-between gap-4 pb-6 border-b-2 border-[#1A1A1A]">
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-xl bg-[#FF6B00] flex items-center justify-center font-black text-white text-2xl shadow-sm">
                      G
                    </div>
                    <div>
                      <h1 className="text-2xl font-black text-[#1A1A1A] tracking-tight">
                        GOG<span className="text-[#FF6B00]">LITE</span>
                      </h1>
                      <p className="text-xs text-[#555555] font-medium">{configuracion.emisor?.subtitulo}</p>
                      <p className="text-xs text-[#555555]">{configuracion.emisor?.ubicacion}</p>
                    </div>
                  </div>

                  <div className="sm:text-right">
                    <div className="text-[11px] font-mono uppercase tracking-wider text-[#888888] font-bold">
                      FACTURA COMERCIAL / PROFORMA
                    </div>
                    <div className="text-2xl font-mono font-black text-[#FF6B00]">{selectedInvoice.numeroFactura}</div>
                    <div className="text-xs text-[#555555] mt-1">
                      Emisión: <strong>{selectedInvoice.fechaEmision}</strong> · Vence: <strong>{selectedInvoice.fechaVencimiento}</strong>
                    </div>
                    <span className={`inline-block mt-2 px-3 py-1 rounded-full text-[11px] font-extrabold ${
                      selectedInvoice.estado === 'cobrada'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-[#FFF0E6] text-[#FF6B00]'
                    }`}>
                      {selectedInvoice.estado === 'cobrada'
                        ? 'PAGADA 100%'
                        : selectedInvoice.estado === 'parcial'
                        ? 'ANTICIPO COBRADO (50%)'
                        : 'PENDIENTE DE PAGO'}
                    </span>
                  </div>
                </div>

                {/* 2. Bloque Bilateral (De / Para) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
                  <div className="p-4 rounded-xl bg-[#FAFAFA] border border-[#EEEEEE]">
                    <span className="font-extrabold text-[#FF6B00] uppercase tracking-wider text-[10px] block mb-1">
                      DE (EMISOR):
                    </span>
                    <div className="font-extrabold text-sm text-[#1A1A1A]">{configuracion.emisor?.empresa}</div>
                    <div className="text-[#555555] mt-0.5">{configuracion.emisor?.identificacion}</div>
                    <div className="text-[#555555]">{configuracion.emisor?.email}</div>
                    <div className="text-[#555555]">{configuracion.emisor?.telefono}</div>
                  </div>

                  <div className="p-4 rounded-xl bg-[#FAFAFA] border border-[#EEEEEE]">
                    <span className="font-extrabold text-[#FF6B00] uppercase tracking-wider text-[10px] block mb-1">
                      PARA (CLIENTE):
                    </span>
                    <div className="font-extrabold text-sm text-[#1A1A1A]">{selectedInvoice.cliente?.empresa}</div>
                    <div className="text-[#555555] mt-0.5">Atención: {selectedInvoice.cliente?.contacto}</div>
                    <div className="text-[#555555]">{selectedInvoice.cliente?.email} · {selectedInvoice.cliente?.telefono}</div>
                    <div className="font-semibold text-[#1A1A1A] mt-1">
                      {selectedInvoice.cliente?.pais === 'DO' ? '🇩🇴 República Dominicana' : '🇸🇻 El Salvador'}
                    </div>
                  </div>
                </div>

                {/* 3. Tabla de Servicios con cabecera #1A1A1A */}
                <div className="border border-[#EEEEEE] rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#1A1A1A] text-white font-bold uppercase text-[11px]">
                      <tr>
                        <th className="py-3 px-4">Descripción del Servicio / Entregable</th>
                        <th className="py-3 px-4 text-center">Cant.</th>
                        <th className="py-3 px-4 text-right">Precio Unitario</th>
                        <th className="py-3 px-4 text-right">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#EEEEEE] text-[#1A1A1A]">
                      {selectedInvoice.items?.map((item, idx) => (
                        <tr key={idx} className={idx % 2 === 1 ? 'bg-[#FAFAFA]' : 'bg-white'}>
                          <td className="py-3.5 px-4 font-medium">{item.descripcion}</td>
                          <td className="py-3.5 px-4 text-center font-mono">{item.cantidad}</td>
                          <td className="py-3.5 px-4 text-right font-mono">${Number(item.precioUnitario).toLocaleString()} USD</td>
                          <td className="py-3.5 px-4 text-right font-mono font-bold">${Number(item.total).toLocaleString()} USD</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* 4. Caja de Totales */}
                <div className="flex justify-end">
                  <div className="w-80 bg-[#FAFAFA] p-4 rounded-xl border border-[#EEEEEE] space-y-2 text-xs">
                    <div className="flex justify-between text-[#555555]">
                      <span>Subtotal Neto:</span>
                      <span className="font-mono font-bold text-[#1A1A1A]">${Number(selectedInvoice.subtotal || selectedInvoice.total).toLocaleString()} USD</span>
                    </div>
                    <div className="flex justify-between text-[#555555]">
                      <span>Impuestos ({selectedInvoice.impuestoPorcentaje || 0}%):</span>
                      <span className="font-mono">${Number(selectedInvoice.impuestoTotal || 0).toLocaleString()} USD</span>
                    </div>
                    <div className="flex justify-between text-[#1A1A1A] font-black text-base pt-2 border-t-2 border-[#1A1A1A]">
                      <span>Total Facturado:</span>
                      <span className="font-mono text-[#FF6B00]">${Number(selectedInvoice.total).toLocaleString()} USD</span>
                    </div>
                    <div className="flex justify-between text-emerald-700 font-bold pt-1">
                      <span>Monto Cobrado / Anticipo:</span>
                      <span className="font-mono">${Number(selectedInvoice.montoCobrado).toLocaleString()} USD</span>
                    </div>
                    <div className="flex justify-between text-amber-700 font-bold pt-1 border-t border-[#E5E7EB]">
                      <span>Saldo Pendiente:</span>
                      <span className="font-mono">${Math.max(0, Number(selectedInvoice.total) - Number(selectedInvoice.montoCobrado)).toLocaleString()} USD</span>
                    </div>
                  </div>
                </div>

                {/* 5. Caja de Confirmación del Sistema */}
                <div className="bg-[#FAFAFA] border-l-4 border-[#FF6B00] p-4 rounded-r-lg text-xs text-[#444444] space-y-1">
                  <div className="font-extrabold text-[#1A1A1A]">
                    CONFIRMACIÓN DEL SISTEMA & INSTRUCCIONES BANCARIAS:
                  </div>
                  <div>
                    • <strong>Cuenta Oficial:</strong>{' '}
                    {selectedInvoice.cliente?.pais === 'DO'
                      ? `${configuracion.cuentasBancarias?.DO?.banco} — Nº ${configuracion.cuentasBancarias?.DO?.numero} (${configuracion.cuentasBancarias?.DO?.titular})`
                      : `${configuracion.cuentasBancarias?.SV?.banco} — Nº ${configuracion.cuentasBancarias?.SV?.numero} (${configuracion.cuentasBancarias?.SV?.titular})`}
                  </div>
                  <div>
                    • <strong>Condiciones Comerciales:</strong> Anticipo 50% al inicio · Saldo 50% contra entrega final verificada.
                  </div>
                </div>

              </div>
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
              
              {/* Selector Retrospectivo de Módulos 1, 2 y 3 */}
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

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-400 block mb-1">Nombre de la Empresa</label>
                  <input
                    type="text"
                    required
                    value={newInvoiceForm.empresa}
                    onChange={(e) => setNewInvoiceForm({ ...newInvoiceForm, empresa: e.target.value })}
                    placeholder="ej: Grúas Andrea / Caribes Tours"
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
                  <label className="text-slate-400 block mb-1">País & Cuenta Destino</label>
                  <select
                    value={newInvoiceForm.pais}
                    onChange={(e) => setNewInvoiceForm({ ...newInvoiceForm, pais: e.target.value })}
                    className="w-full bg-[#131926] border border-slate-700 rounded-lg p-2 text-white"
                  >
                    <option value="SV">🇸🇻 El Salvador (Banco Agrícola)</option>
                    <option value="DO">🇩🇴 Rep. Dominicana (Banco Popular)</option>
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
                    <option value={0}>0% Exento / Servicio Digital</option>
                    <option value={configuracion.tasaIvaSV || 13}>{configuracion.tasaIvaSV || 13}% IVA (El Salvador)</option>
                    <option value={configuracion.tasaItbisDO || 18}>{configuracion.tasaItbisDO || 18}% ITBIS (Rep. Dominicana)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Descripción / Concepto Principal</label>
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

    </div>
  );
}
