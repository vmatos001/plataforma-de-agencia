import React, { useState, useEffect } from 'react';
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
  Wallet
} from 'lucide-react';

export default function GestionRentabilidadModule({ selectedCountry }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('resumen'); // 'resumen' | 'facturas' | 'gastos' | 'config'
  const [countryFilter, setCountryFilter] = useState('ALL'); // 'ALL' | 'SV' | 'DO'
  const [searchTerm, setSearchTerm] = useState('');

  // Invoice view / print modal
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  // New Invoice Modal
  const [newInvoiceModalOpen, setNewInvoiceModalOpen] = useState(false);
  const [newInvoiceForm, setNewInvoiceForm] = useState({
    numeroFactura: '',
    empresa: '',
    contacto: '',
    email: '',
    telefono: '',
    pais: 'SV',
    concepto: 'Desarrollo Web & GEO IA',
    total: 1500,
    montoCobrado: 750,
    horasInvertidasEstimadas: 18,
    metodoPago: 'Transferencia Bancaria',
    itemDescripcion: 'Implementación Web & Posicionamiento IA',
    itemCantidad: 1,
    itemPrecio: 1500
  });

  // New Expense Modal
  const [newExpenseModalOpen, setNewExpenseModalOpen] = useState(false);
  const [newExpenseForm, setNewExpenseForm] = useState({
    concepto: '',
    categoria: 'infraestructura',
    proveedor: '',
    monto: '',
    frecuencia: 'unico'
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

  // Fetch financial data
  useEffect(() => {
    fetchFinanzas();
  }, []);

  const fetchFinanzas = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/finanzas/resumen');
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error('Error fetching finanzas:', err);
    } finally {
      setLoading(false);
    }
  };

  // Update Invoice Payment / Status
  const handleUpdatePayment = async (facturaId, montoNuevo) => {
    try {
      const res = await fetch(`/api/finanzas/facturas/${facturaId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ montoCobrado: Number(montoNuevo) })
      });
      if (res.ok) {
        fetchFinanzas();
        if (selectedInvoice && selectedInvoice.id === facturaId) {
          const updated = await res.json();
          setSelectedInvoice(updated);
        }
      }
    } catch (err) {
      console.error('Error actualizando pago:', err);
    }
  };

  // Create Invoice
  const handleCreateInvoice = async (e) => {
    e.preventDefault();
    try {
      const body = {
        numeroFactura: newInvoiceForm.numeroFactura || undefined,
        cliente: {
          empresa: newInvoiceForm.empresa,
          contacto: newInvoiceForm.contacto,
          email: newInvoiceForm.email,
          telefono: newInvoiceForm.telefono,
          pais: newInvoiceForm.pais
        },
        concepto: newInvoiceForm.concepto,
        subtotal: Number(newInvoiceForm.total),
        total: Number(newInvoiceForm.total),
        montoCobrado: Number(newInvoiceForm.montoCobrado),
        horasInvertidasEstimadas: Number(newInvoiceForm.horasInvertidasEstimadas),
        metodoPago: newInvoiceForm.metodoPago,
        items: [
          {
            descripcion: newInvoiceForm.itemDescripcion,
            cantidad: Number(newInvoiceForm.itemCantidad),
            precioUnitario: Number(newInvoiceForm.itemPrecio),
            total: Number(newInvoiceForm.itemPrecio) * Number(newInvoiceForm.itemCantidad)
          }
        ]
      };

      const res = await fetch('/api/finanzas/facturas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      if (res.ok) {
        fetchFinanzas();
        setNewInvoiceModalOpen(false);
        setNewInvoiceForm({
          numeroFactura: '',
          empresa: '',
          contacto: '',
          email: '',
          telefono: '',
          pais: 'SV',
          concepto: 'Desarrollo Web & GEO IA',
          total: 1500,
          montoCobrado: 750,
          horasInvertidasEstimadas: 18,
          metodoPago: 'Transferencia Bancaria',
          itemDescripcion: 'Implementación Web & Posicionamiento IA',
          itemCantidad: 1,
          itemPrecio: 1500
        });
      }
    } catch (err) {
      console.error('Error creando factura:', err);
    }
  };

  // Create Expense
  const handleCreateExpense = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/finanzas/gastos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newExpenseForm,
          monto: Number(newExpenseForm.monto)
        })
      });
      if (res.ok) {
        fetchFinanzas();
        setNewExpenseModalOpen(false);
        setNewExpenseForm({
          concepto: '',
          categoria: 'infraestructura',
          proveedor: '',
          monto: '',
          frecuencia: 'unico'
        });
      }
    } catch (err) {
      console.error('Error creando gasto:', err);
    }
  };

  // Delete Expense
  const handleDeleteExpense = async (id) => {
    if (!confirm('¿Eliminar este gasto operativo?')) return;
    try {
      const res = await fetch(`/api/finanzas/gastos/${id}`, { method: 'DELETE' });
      if (res.ok) fetchFinanzas();
    } catch (err) {
      console.error('Error eliminando gasto:', err);
    }
  };

  // Create Time Entry
  const handleCreateTimeEntry = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/finanzas/horas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTimeForm)
      });
      if (res.ok) {
        fetchFinanzas();
        setNewTimeModalOpen(false);
        setNewTimeForm({
          proyectoId: '',
          cliente: '',
          concepto: '',
          categoria: 'desarrollo',
          horas: 2.5,
          responsable: 'Senior Dev'
        });
      }
    } catch (err) {
      console.error('Error registrando horas:', err);
    }
  };

  // Delete Time Entry
  const handleDeleteTimeEntry = async (id) => {
    if (!confirm('¿Eliminar este registro de horas?')) return;
    try {
      const res = await fetch(`/api/finanzas/horas/${id}`, { method: 'DELETE' });
      if (res.ok) fetchFinanzas();
    } catch (err) {
      console.error('Error eliminando horas:', err);
    }
  };

  if (loading || !data) {
    return (
      <div className="flex-1 flex items-center justify-center p-12 text-slate-400">
        <RefreshCw className="w-6 h-6 animate-spin text-orange-500 mr-3" />
        <span>Cargando métricas de rentabilidad y finanzas...</span>
      </div>
    );
  }

  const { kpis, facturas, gastos, proyectosRentabilidad, configuracion } = data;

  // Filter facturas
  const filteredFacturas = facturas.filter(f => {
    const matchCountry = countryFilter === 'ALL' || f.cliente?.pais === countryFilter;
    const term = searchTerm.toLowerCase();
    const matchSearch = !term ||
      f.cliente?.empresa?.toLowerCase().includes(term) ||
      f.numeroFactura?.toLowerCase().includes(term) ||
      f.concepto?.toLowerCase().includes(term);
    return matchCountry && matchSearch;
  });

  return (
    <div className="flex-1 overflow-y-auto bg-[#080b11] p-6 text-slate-100 flex flex-col gap-6">
      
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
            <div className="text-[10px] text-slate-500 mt-0.5">Total proyectos emitidos</div>
          </div>
        </div>

        {/* Total Cobrado en Caja */}
        <div className="p-4 rounded-xl bg-[#0e131f] border border-slate-800/80 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase text-emerald-400 font-semibold">Cobrado Real</span>
            <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400"><Wallet className="w-4 h-4" /></span>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-black text-emerald-400 font-mono">
              ${kpis.totalCobrado.toLocaleString()} <span className="text-xs font-normal text-slate-400">USD</span>
            </div>
            <div className="text-[10px] text-emerald-500/80 mt-0.5">Dinero en banco disponible</div>
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
            <div className="text-[10px] text-slate-500 mt-0.5">Saldos pendientes del 50%</div>
          </div>
        </div>

        {/* Gastos y Costes Operativos */}
        <div className="p-4 rounded-xl bg-[#0e131f] border border-slate-800/80 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase text-rose-400 font-semibold">Gastos Totales</span>
            <span className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400"><ArrowDownRight className="w-4 h-4" /></span>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-black text-rose-400 font-mono">
              ${(kpis.totalGastosOperativos + kpis.costeManoObraTotal).toLocaleString()} <span className="text-xs font-normal text-slate-400">USD</span>
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">Directos (${kpis.totalGastosOperativos}) + Horas (${kpis.costeManoObraTotal})</div>
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
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 p-4 rounded-xl bg-[#0e131f] border border-slate-800/80">
        
        {/* Tabs Switch */}
        <div className="flex items-center bg-[#131926] border border-slate-800 rounded-lg p-0.5 text-xs">
          <button
            onClick={() => setActiveTab('resumen')}
            className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-colors ${activeTab === 'resumen' ? 'bg-slate-800 text-orange-400 font-semibold' : 'text-slate-400 hover:text-slate-200'}`}
          >
            <PieChart className="w-3.5 h-3.5" />
            <span>Rentabilidad por Proyecto</span>
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
            <span>Gastos Operativos ({gastos.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('horas')}
            className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-colors ${activeTab === 'horas' ? 'bg-slate-800 text-orange-400 font-semibold' : 'text-slate-400 hover:text-slate-200'}`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Time Tracking ({data.timeEntries?.length || 0})</span>
          </button>
        </div>

        {/* Actions & Filters */}
        <div className="flex items-center gap-2.5">
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
              🇸🇻 El Salvador
            </button>
            <button
              onClick={() => setCountryFilter('DO')}
              className={`px-2.5 py-1 rounded-md transition-colors ${countryFilter === 'DO' ? 'bg-orange-600 text-white font-semibold' : 'text-slate-400 hover:text-slate-200'}`}
            >
              🇩🇴 Rep. Dominicana
            </button>
          </div>

          {activeTab === 'facturas' && (
            <button
              onClick={() => setNewInvoiceModalOpen(true)}
              className="px-3.5 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-500 text-white font-semibold text-xs flex items-center gap-1.5 shadow-md transition-all shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Nueva Factura</span>
            </button>
          )}

          {activeTab === 'gastos' && (
            <button
              onClick={() => setNewExpenseModalOpen(true)}
              className="px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs flex items-center gap-1.5 shadow-md transition-all shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Registrar Gasto</span>
            </button>
          )}

          {activeTab === 'horas' && (
            <button
              onClick={() => setNewTimeModalOpen(true)}
              className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center gap-1.5 shadow-md transition-all shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Registrar Horas</span>
            </button>
          )}
        </div>
      </div>

      {/* 3. TAB 1: RENTABILIDAD POR PROYECTO (UNIT ECONOMICS) */}
      {activeTab === 'resumen' && (
        <div className="space-y-6">
          
          {/* Health Banner */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-950/30 via-[#0e1422] to-[#0e1422] border border-emerald-500/30 flex items-center justify-between text-xs">
            <div className="flex items-center gap-3">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <div>
                <span className="font-bold text-emerald-300">Margen Saludable Objetivo: &ge; 60%</span>
                <p className="text-[11px] text-slate-400">
                  Calculado descontando costes directos (hosting/dominios) y coste hora interno (${configuracion?.costoHoraInterno} USD/h).
                </p>
              </div>
            </div>
            <span className="text-[11px] font-mono bg-emerald-500/20 text-emerald-400 px-2.5 py-1 rounded-full font-semibold">
              Alternativa a Holded: $0 USD/mes
            </span>
          </div>

          {/* Unit Profitability Table */}
          <div className="bg-[#0c1017] border border-slate-800/80 rounded-xl overflow-hidden shadow-sm">
            <div className="p-3 bg-[#101522] border-b border-slate-800 text-xs font-bold text-slate-200 flex items-center justify-between">
              <span>Desglose de Rentabilidad Unitaria por Cliente</span>
              <span className="text-[11px] font-mono text-slate-400">{proyectosRentabilidad.length} proyectos auditados</span>
            </div>

            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-[#0d121c] border-b border-slate-800 text-[11px] font-mono uppercase text-slate-400">
                <tr>
                  <th className="p-3">Cliente & Factura</th>
                  <th className="p-3">País</th>
                  <th className="p-3 text-right">Precio Venta</th>
                  <th className="p-3 text-right">Gastos Directos</th>
                  <th className="p-3 text-right">Horas & Coste</th>
                  <th className="p-3 text-right">Coste Total</th>
                  <th className="p-3 text-right">Beneficio Neto</th>
                  <th className="p-3 text-center">Margen %</th>
                  <th className="p-3 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-sans">
                {proyectosRentabilidad.map(p => (
                  <tr key={p.facturaId} className="hover:bg-slate-800/30 transition-colors">
                    <td className="p-3">
                      <div className="font-semibold text-white">{p.cliente}</div>
                      <div className="text-[11px] text-slate-500 font-mono">{p.numeroFactura}</div>
                    </td>
                    <td className="p-3 font-mono text-xs">
                      {p.pais === 'SV' ? '🇸🇻 SV' : '🇩🇴 DO'}
                    </td>
                    <td className="p-3 text-right font-mono font-bold text-white">
                      ${p.precioVendido.toLocaleString()}
                    </td>
                    <td className="p-3 text-right font-mono text-rose-400">
                      ${p.gastosDirectos.toFixed(2)}
                    </td>
                    <td className="p-3 text-right font-mono text-slate-300">
                      <div>{p.horasInvertidas}h</div>
                      <div className="text-[10px] text-slate-500">(${p.costeHoras})</div>
                    </td>
                    <td className="p-3 text-right font-mono text-rose-400 font-semibold">
                      ${p.costeTotal.toFixed(2)}
                    </td>
                    <td className="p-3 text-right font-mono font-bold text-emerald-400">
                      +${p.gananciaNeta.toFixed(2)}
                    </td>
                    <td className="p-3 text-center font-mono">
                      <span className={`px-2 py-0.5 rounded-full font-bold text-xs ${p.margenUnitario >= 60 ? 'bg-emerald-500/20 text-emerald-400' : p.margenUnitario >= 40 ? 'bg-amber-500/20 text-amber-400' : 'bg-rose-500/20 text-rose-400'}`}>
                        {p.margenUnitario}%
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => {
                          const found = facturas.find(f => f.id === p.facturaId);
                          if (found) setSelectedInvoice(found);
                        }}
                        className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors"
                      >
                        Ver Proforma
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        </div>
      )}

      {/* 4. TAB 2: GESTOR DE FACTURAS & PROFORMAS */}
      {activeTab === 'facturas' && (
        <div className="bg-[#0c1017] border border-slate-800/80 rounded-xl overflow-hidden shadow-sm">
          <div className="p-3 bg-[#101522] border-b border-slate-800 text-xs font-bold text-slate-200 flex items-center justify-between">
            <span>Listado de Facturas Proforma & Recibos de Agencia</span>
            <span className="text-[11px] font-mono text-slate-400">{filteredFacturas.length} registradas</span>
          </div>

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
                  <td className="p-3 font-mono font-bold text-orange-400">
                    {fac.numeroFactura}
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
                    ${Number(fac.saldoPendiente).toLocaleString()}
                  </td>
                  <td className="p-3 text-center">
                    <span className={`px-2 py-0.5 rounded-full font-mono text-[10px] font-bold uppercase ${
                      fac.estado === 'cobrada' ? 'bg-emerald-500/20 text-emerald-400' :
                      fac.estado === 'parcial' ? 'bg-sky-500/20 text-sky-400' :
                      'bg-amber-500/20 text-amber-400'
                    }`}>
                      {fac.estado === 'cobrada' ? 'Cobrada 100%' : fac.estado === 'parcial' ? 'Parcial (50%)' : 'Pendiente'}
                    </span>
                  </td>
                  <td className="p-3 text-right space-x-2">
                    {fac.estado !== 'cobrada' && (
                      <button
                        onClick={() => handleUpdatePayment(fac.id, fac.total)}
                        className="px-2 py-1 rounded bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs font-medium transition-colors"
                        title="Marcar como cobrada 100%"
                      >
                        ✓ Cobrar 100%
                      </button>
                    )}
                    <button
                      onClick={() => setSelectedInvoice(fac)}
                      className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors"
                    >
                      Imprimir Proforma
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 5. TAB 3: CONTROL DE GASTOS OPERATIVOS */}
      {activeTab === 'gastos' && (
        <div className="bg-[#0c1017] border border-slate-800/80 rounded-xl overflow-hidden shadow-sm">
          <div className="p-3 bg-[#101522] border-b border-slate-800 text-xs font-bold text-slate-200 flex items-center justify-between">
            <span>Registro de Gastos Operativos Directos ($0 Subscripciones)</span>
            <span className="text-[11px] font-mono text-slate-400">Total: ${kpis.totalGastosOperativos.toFixed(2)} USD</span>
          </div>

          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-[#0d121c] border-b border-slate-800 text-[11px] font-mono uppercase text-slate-400">
              <tr>
                <th className="p-3">Concepto</th>
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
      )}

      {/* 6. TAB 4: CONTROL DE HORAS & TIME TRACKING */}
      {activeTab === 'horas' && (
        <div className="space-y-6">
          {/* Top Metrics Cards for Time Tracking */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-[#0c1017] border border-slate-800 shadow-sm">
              <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
                <span>TOTAL HORAS REGISTRADAS</span>
                <Clock className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-2xl font-black text-white font-mono mt-2">
                {kpis.horasRealesTotales || kpis.horasTotales} hrs
              </div>
              <p className="text-[10px] text-slate-500 mt-0.5">Dedicación activa en proyectos</p>
            </div>

            <div className="p-4 rounded-xl bg-[#0c1017] border border-slate-800 shadow-sm">
              <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
                <span>TARIFA MEDIA EFECTIVA</span>
                <DollarSign className="w-4 h-4 text-orange-400" />
              </div>
              <div className="text-2xl font-black text-orange-400 font-mono mt-2">
                ${kpis.tarifaMediaEfectivaHora || 50} <span className="text-xs font-normal text-slate-400">USD/h</span>
              </div>
              <p className="text-[10px] text-slate-500 mt-0.5">Promedio ponderado cobrado</p>
            </div>

            <div className="p-4 rounded-xl bg-[#0c1017] border border-slate-800 shadow-sm">
              <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
                <span>TARIFA OBJETIVO AGENCIA</span>
                <TrendingUp className="w-4 h-4 text-sky-400" />
              </div>
              <div className="text-2xl font-black text-sky-400 font-mono mt-2">
                $50 <span className="text-xs font-normal text-slate-400">USD/h</span>
              </div>
              <p className="text-[10px] text-slate-500 mt-0.5">Meta para alta rentabilidad</p>
            </div>

            <div className="p-4 rounded-xl bg-[#0c1017] border border-slate-800 shadow-sm">
              <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
                <span>COSTE INTERNO HORA</span>
                <Wallet className="w-4 h-4 text-purple-400" />
              </div>
              <div className="text-2xl font-black text-purple-400 font-mono mt-2">
                ${configuracion?.costoHoraInterno || 20} <span className="text-xs font-normal text-slate-400">USD/h</span>
              </div>
              <p className="text-[10px] text-slate-500 mt-0.5">Coste base de producción</p>
            </div>
          </div>

          {/* Table: Rentabilidad Horaria por Proyecto */}
          <div className="bg-[#0c1017] border border-slate-800/80 rounded-xl overflow-hidden shadow-sm">
            <div className="p-3 bg-[#101522] border-b border-slate-800 text-xs font-bold text-slate-200 flex items-center justify-between">
              <span>Rentabilidad Horaria & Alerta de Dilución por Proyecto</span>
              <span className="text-[11px] font-mono text-slate-400">Tarifa Objetivo: $50 USD/hora</span>
            </div>

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
                      {p.horasRegistradas > 0 && (
                        <span className="text-[10px] text-emerald-400 block font-mono">({p.horasRegistradas}h registradas)</span>
                      )}
                    </td>
                    <td className="p-3 font-mono font-bold text-sm">
                      <span className={p.tarifaEfectivaHora >= 50 ? 'text-emerald-400' : p.tarifaEfectivaHora >= 35 ? 'text-amber-400' : 'text-rose-400'}>
                        ${p.tarifaEfectivaHora} USD/h
                      </span>
                    </td>
                    <td className="p-3">
                      {p.alertaDilucion ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[10px] font-bold">
                          <AlertCircle className="w-3 h-3 text-rose-400" />
                          <span>DILUCIÓN DE TARIFA (Exceso de Horas)</span>
                        </span>
                      ) : p.tarifaEfectivaHora >= 50 ? (
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

          {/* Table: Time Entries Log */}
          <div className="bg-[#0c1017] border border-slate-800/80 rounded-xl overflow-hidden shadow-sm">
            <div className="p-3 bg-[#101522] border-b border-slate-800 text-xs font-bold text-slate-200 flex items-center justify-between">
              <span>Bitácora de Tiempos Registrados</span>
              <button
                onClick={() => setNewTimeModalOpen(true)}
                className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-[11px] flex items-center gap-1 transition-all shadow-sm"
              >
                <Plus className="w-3 h-3" />
                <span>+ Agregar Registro</span>
              </button>
            </div>

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
                {(data.timeEntries || []).map(t => (
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
      )}

      {/* MODAL: PRINTABLE OFFICIAL PROFORMA INVOICE */}
      {selectedInvoice && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0e1320] border border-slate-800 rounded-2xl w-full max-w-3xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
            
            {/* Header controls */}
            <div className="p-4 border-b border-slate-800 flex items-center justify-between no-print bg-[#121828]">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-orange-400" />
                <span className="font-bold text-sm text-white">Factura Proforma Oficial · {selectedInvoice.numeroFactura}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-3 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-500 text-white font-medium text-xs flex items-center gap-1.5 shadow-sm transition-all"
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

            {/* Printable Area */}
            <div className="p-8 overflow-y-auto space-y-6 text-slate-200 bg-white text-slate-900 font-sans print:p-0">
              
              {/* Header Invoice */}
              <div className="flex items-start justify-between pb-6 border-b border-slate-200">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-orange-600 flex items-center justify-center font-black text-white text-2xl">
                    G
                  </div>
                  <div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight">GOGLITE</h1>
                    <p className="text-xs text-slate-500 font-medium">Agencia Web & Soluciones Digitales</p>
                    <p className="text-xs text-slate-500">San Salvador · Santo Domingo · Remoto Internacional</p>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-xs font-mono uppercase tracking-wider text-slate-400 font-bold">FACTURA PROFORMA</div>
                  <div className="text-xl font-mono font-black text-orange-600">{selectedInvoice.numeroFactura}</div>
                  <div className="text-xs text-slate-500 mt-1">Fecha Emisión: {selectedInvoice.fechaEmision}</div>
                  <div className="text-xs text-slate-500">Fecha Vencimiento: {selectedInvoice.fechaVencimiento}</div>
                </div>
              </div>

              {/* Bill to */}
              <div className="grid grid-cols-2 gap-6 text-xs">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px] block mb-1">FACTURAR A:</span>
                  <div className="font-bold text-sm text-slate-900">{selectedInvoice.cliente?.empresa}</div>
                  <div className="text-slate-600">Atención: {selectedInvoice.cliente?.contacto}</div>
                  <div className="text-slate-600">{selectedInvoice.cliente?.email} · {selectedInvoice.cliente?.telefono}</div>
                  <div className="text-slate-500 font-mono mt-1">{selectedInvoice.cliente?.identificacion || 'ID Fiscal Comercial'}</div>
                  <div className="font-semibold text-slate-700 mt-0.5">{selectedInvoice.cliente?.pais === 'SV' ? '🇸🇻 El Salvador' : '🇩🇴 República Dominicana'}</div>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px] block mb-1">CONDICIONES DE PAGO:</span>
                  <div className="text-slate-700 font-medium">Forma de Pago: {selectedInvoice.metodoPago}</div>
                  <div className="text-slate-700 mt-1">
                    Cuenta: {selectedInvoice.cliente?.pais === 'SV' 
                      ? configuracion?.cuentasBancarias?.SV?.banco + ' (' + configuracion?.cuentasBancarias?.SV?.numero + ')'
                      : configuracion?.cuentasBancarias?.DO?.banco + ' (' + configuracion?.cuentasBancarias?.DO?.numero + ')'}
                  </div>
                  <div className="mt-2 text-[11px] text-slate-500">
                    Anticipo: 50% al inicio · Saldo: 50% contra entrega final verificada.
                  </div>
                </div>
              </div>

              {/* Items Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-600 font-bold uppercase text-[10px]">
                    <tr>
                      <th className="p-3">Descripción del Servicio</th>
                      <th className="p-3 text-center">Cant.</th>
                      <th className="p-3 text-right">Precio Unitario</th>
                      <th className="p-3 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-slate-800">
                    {selectedInvoice.items?.map((item, idx) => (
                      <tr key={idx}>
                        <td className="p-3 font-medium">{item.descripcion}</td>
                        <td className="p-3 text-center font-mono">{item.cantidad}</td>
                        <td className="p-3 text-right font-mono">${Number(item.precioUnitario).toLocaleString()} USD</td>
                        <td className="p-3 text-right font-mono font-bold">${Number(item.total).toLocaleString()} USD</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totals Summary */}
              <div className="flex justify-end">
                <div className="w-72 space-y-2 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Subtotal:</span>
                    <span className="font-mono font-bold">${Number(selectedInvoice.subtotal).toLocaleString()} USD</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Impuestos (0% Exento Digital):</span>
                    <span className="font-mono">$0.00 USD</span>
                  </div>
                  <div className="flex justify-between text-slate-900 font-bold text-sm pt-2 border-t border-slate-300">
                    <span>Total Facturado:</span>
                    <span className="font-mono text-orange-600">${Number(selectedInvoice.total).toLocaleString()} USD</span>
                  </div>
                  <div className="flex justify-between text-emerald-700 font-semibold pt-1">
                    <span>Monto Cobrado (Anticipo):</span>
                    <span className="font-mono">${Number(selectedInvoice.montoCobrado).toLocaleString()} USD</span>
                  </div>
                  <div className="flex justify-between text-amber-700 font-bold pt-1 border-t border-slate-200">
                    <span>Saldo Pendiente:</span>
                    <span className="font-mono">${Number(selectedInvoice.saldoPendiente).toLocaleString()} USD</span>
                  </div>
                </div>
              </div>

              {/* Legal Footer */}
              <div className="pt-6 border-t border-slate-200 text-[11px] text-slate-500 leading-relaxed">
                <p>
                  Esta proforma constituye una orden de servicio válida según los términos suscritos en la propuesta comercial de Goglite. 
                  Para cualquier consulta contable o validación de transferencia, contacte directamente a la dirección de proyectos.
                </p>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* MODAL: CREATE INVOICE */}
      {newInvoiceModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0e1320] border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-orange-400" />
                <span>Emitir Nueva Factura Proforma</span>
              </h3>
              <button onClick={() => setNewInvoiceModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateInvoice} className="p-5 space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Nombre de la Empresa</label>
                <input
                  type="text"
                  required
                  value={newInvoiceForm.empresa}
                  onChange={(e) => setNewInvoiceForm({ ...newInvoiceForm, empresa: e.target.value })}
                  placeholder="ej: Inmobiliarias Punta Cana"
                  className="w-full bg-[#131926] border border-slate-700 rounded-lg p-2 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
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
                <div>
                  <label className="text-slate-400 block mb-1">País</label>
                  <select
                    value={newInvoiceForm.pais}
                    onChange={(e) => setNewInvoiceForm({ ...newInvoiceForm, pais: e.target.value })}
                    className="w-full bg-[#131926] border border-slate-700 rounded-lg p-2 text-white"
                  >
                    <option value="SV">🇸🇻 El Salvador</option>
                    <option value="DO">🇩🇴 Rep. Dominicana</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Descripción del Servicio</label>
                <input
                  type="text"
                  required
                  value={newInvoiceForm.itemDescripcion}
                  onChange={(e) => setNewInvoiceForm({ ...newInvoiceForm, itemDescripcion: e.target.value })}
                  placeholder="ej: Desarrollo Web de Alta Conversión & SEO"
                  className="w-full bg-[#131926] border border-slate-700 rounded-lg p-2 text-white"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-slate-400 block mb-1">Total ($ USD)</label>
                  <input
                    type="number"
                    required
                    value={newInvoiceForm.total}
                    onChange={(e) => {
                      const t = Number(e.target.value);
                      setNewInvoiceForm({ ...newInvoiceForm, total: t, itemPrecio: t });
                    }}
                    className="w-full bg-[#131926] border border-slate-700 rounded-lg p-2 text-white"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Anticipo Cobrado</label>
                  <input
                    type="number"
                    value={newInvoiceForm.montoCobrado}
                    onChange={(e) => setNewInvoiceForm({ ...newInvoiceForm, montoCobrado: Number(e.target.value) })}
                    className="w-full bg-[#131926] border border-slate-700 rounded-lg p-2 text-white"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Horas Est.</label>
                  <input
                    type="number"
                    value={newInvoiceForm.horasInvertidasEstimadas}
                    onChange={(e) => setNewInvoiceForm({ ...newInvoiceForm, horasInvertidasEstimadas: Number(e.target.value) })}
                    className="w-full bg-[#131926] border border-slate-700 rounded-lg p-2 text-white"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs mt-3 shadow-md"
              >
                Emitir Factura Proforma
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CREATE EXPENSE */}
      {newExpenseModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0e1320] border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
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
                  placeholder="ej: Dominio anual para cliente"
                  className="w-full bg-[#131926] border border-slate-700 rounded-lg p-2 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-400 block mb-1">Categoría</label>
                  <select
                    value={newExpenseForm.categoria}
                    onChange={(e) => setNewExpenseForm({ ...newExpenseForm, categoria: e.target.value })}
                    className="w-full bg-[#131926] border border-slate-700 rounded-lg p-2 text-white"
                  >
                    <option value="infraestructura">Infraestructura / VPS</option>
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
                    placeholder="15.00"
                    className="w-full bg-[#131926] border border-slate-700 rounded-lg p-2 text-white"
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
                    className="w-full bg-[#131926] border border-slate-700 rounded-lg p-2 text-white"
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
