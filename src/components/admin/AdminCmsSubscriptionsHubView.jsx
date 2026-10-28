import React, { useState, useEffect, useMemo } from 'react';
import {
  ShieldCheck,
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Zap,
  Search,
  Filter,
  ExternalLink,
  Sliders,
  FileText,
  PlusCircle,
  Building2,
  DollarSign,
  Sparkles,
  RefreshCw,
  Users,
  Globe,
  Printer,
  Send,
  X,
  Check,
  CreditCard,
  MapPin,
  Activity,
  MousePointerClick
} from 'lucide-react';
import { getStoredProyectos, saveStoredProyectos } from '../../services/contractGenerator';
import { saveProyectoCloud, savePortalCloud, saveAppStateCloud } from '../../services/firestoreSyncService';

const CMS_MEMBERSHIP_PLANS = [
  {
    id: 'mensual',
    label: '1 Mes (+30 días)',
    periodo: '1 Mes',
    dias: 30,
    precio: 99,
    concepto: 'Suscripción Mensual Headless CMS & Goglite Care (Hosting Cloud, Editor Visual, Google Business IA & Site Kit — 30 días)'
  },
  {
    id: 'trimestral',
    label: '3 Meses (+90 días)',
    periodo: '3 Meses',
    dias: 90,
    precio: 270,
    concepto: 'Suscripción Trimestral Headless CMS & Goglite Care (Cobertura Acumulativa 90 días)'
  },
  {
    id: 'semestral',
    label: '6 Meses (+180 días)',
    periodo: '6 Meses',
    dias: 180,
    precio: 499,
    concepto: 'Suscripción Semestral Headless CMS & Goglite Care (Cobertura Acumulativa 180 días)'
  },
  {
    id: 'anual',
    label: '1 Año VIP (+365 días)',
    periodo: '1 Año',
    dias: 365,
    precio: 950,
    concepto: 'Membresía Anual VIP Headless CMS & Goglite Care (Soporte Prioritario, SEO Local & Renovación 365 días)'
  },
  {
    id: 'libre',
    label: 'Factura Libre / Personalizada',
    periodo: 'Personalizado',
    dias: 30,
    precio: 150,
    concepto: 'Servicio de Administración Digital, Actualización Web & Mantenimiento Headless CMS'
  }
];

/**
 * Vista Centralizada de Gestión de Suscriptores, Facturación Nativa y Activación de Membresía
 * Funciona de principio a fin dentro del Módulo 6 y reporta automáticamente las facturas al Módulo 7 (Rentabilidad).
 */
export default function AdminCmsSubscriptionsHubView({
  sites = [],
  selectedSlug,
  onSelectSiteInHub,
  onOpenNewSiteModal,
  initialInvoiceClientSlug = null,
  onClearInitialInvoiceClient
}) {
  const [proyectos, setProyectos] = useState([]);
  const [cmsInvoices, setCmsInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [toastMsg, setToastMsg] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('todos'); // 'todos' | 'activos' | 'por_vencer' | 'vencidos'

  // Estado del Modal Nativo de Facturación + Activación de Membresía
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [selectedInvoicePreview, setSelectedInvoicePreview] = useState(null);
  const [invoiceForm, setInvoiceForm] = useState({
    subId: '',
    planId: 'mensual',
    empresa: '',
    contacto: '',
    email: '',
    telefono: '',
    identificacion: '',
    pais: 'DO',
    dominio: '',
    concepto: CMS_MEMBERSHIP_PLANS[0].concepto,
    diasVigencia: 30,
    periodoLabel: '1 Mes',
    subtotal: 99,
    impuestoPorcentaje: 0,
    estadoCobro: 'pagado', // 'pagado' | 'pendiente'
    metodoPago: 'Transferencia Bancaria',
    activarMembresia: true
  });

  // Cargar proyectos y facturas de membresía CMS
  const loadData = () => {
    try {
      setLoading(true);
      const stored = getStoredProyectos();
      setProyectos(Array.isArray(stored) ? stored : []);

      // Cargar facturas desde goglite_finanzas_v1 para mostrar historial nativo y sincronizar con Módulo 7
      const rawFin = localStorage.getItem('goglite_finanzas_v1');
      if (rawFin) {
        const parsedFin = JSON.parse(rawFin);
        if (Array.isArray(parsedFin.facturas)) {
          const filteredCmsFacs = parsedFin.facturas.filter(
            f => f.tipoHito === 'recurrente_cms' || (f.origenModulo || '').toLowerCase().includes('cms')
          );
          setCmsInvoices(filteredCmsFacs);
        }
      }
    } catch (e) {
      console.warn('Error cargando proyectos para suscripciones CMS:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const handleSync = () => loadData();
    window.addEventListener('goglite_proyectos_synced', handleSync);
    window.addEventListener('goglite_finanzas_synced', handleSync);
    return () => {
      window.removeEventListener('goglite_proyectos_synced', handleSync);
      window.removeEventListener('goglite_finanzas_synced', handleSync);
    };
  }, []);

  // Consolidar suscriptores: Proyectos formales + Sitios CMS
  const combinedSubscribers = useMemo(() => {
    const list = [];
    const seenSlugs = new Set();

    // 1. Añadir desde proyectos existentes
    proyectos.forEach(proj => {
      const empresa = proj.cliente?.empresa || proj.lead?.empresa || 'Cliente VIP';
      const slug = proj.cmsSlug || (proj.cliente?.empresa || proj.id || '').toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
      seenSlugs.add(slug);

      const portalConfig = proj.portalConfig || {};
      const careVenceAt = portalConfig.careVenceAt || null;
      const stats = computeRemainingStats(careVenceAt);

      list.push({
        id: proj.id,
        slug,
        tipo: 'proyecto',
        proyectoRef: proj,
        empresa,
        contacto: proj.cliente?.contacto || proj.lead?.contacto || 'Administrador',
        email: proj.cliente?.email || proj.lead?.email || '',
        telefono: proj.cliente?.telefono || proj.lead?.telefono || '',
        identificacion: proj.cliente?.identificacion || proj.cliente?.rnc || '',
        pais: proj.cliente?.pais || proj.lead?.pais || proj.pais || 'DO',
        dominio: proj.dominio || portalConfig.dominio || `${empresa.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`,
        portalToken: proj.portalToken || proj.presupuestoId || proj.id,
        careVenceAt,
        fase5CareActivo: Boolean(portalConfig.fase5CareActivo),
        ultimaRecargaPeriodo: portalConfig.ultimaRecargaPeriodo || null,
        fechaUltimaRecarga: portalConfig.fechaUltimaRecarga || null,
        historialRecargas: portalConfig.historialRecargas || [],
        planMensual: Number(portalConfig.planMensual) || 99,
        stats
      });
    });

    // 2. Añadir sitios CMS registrados directamente en el Módulo 6
    sites.forEach(site => {
      const slug = site.slug || site.id;
      if (seenSlugs.has(slug)) return;
      seenSlugs.add(slug);

      const portalConfig = site.portalConfig || {};
      const careVenceAt = portalConfig.careVenceAt || null;
      const stats = computeRemainingStats(careVenceAt);

      list.push({
        id: site.id || ('site-' + slug),
        slug,
        tipo: 'site',
        siteRef: site,
        empresa: site.nombre || site.contenido?.branding?.nombreMarca || 'Sitio CMS',
        contacto: site.cliente?.contacto || 'Administrador',
        email: site.cliente?.email || '',
        telefono: site.cliente?.telefono || site.contenido?.branding?.telefonoWhatsApp || '',
        identificacion: site.cliente?.identificacion || '',
        pais: site.pais || 'SV',
        dominio: site.dominio || `${slug}.com`,
        portalToken: slug,
        careVenceAt,
        fase5CareActivo: Boolean(portalConfig.fase5CareActivo),
        ultimaRecargaPeriodo: portalConfig.ultimaRecargaPeriodo || null,
        fechaUltimaRecarga: portalConfig.fechaUltimaRecarga || null,
        historialRecargas: portalConfig.historialRecargas || [],
        planMensual: Number(site.planMensual || portalConfig.planMensual) || 99,
        stats
      });
    });

    return list;
  }, [proyectos, sites]);

  // Si se solicitó abrir el modal de factura para un cliente específico desde la cabecera del Hub
  useEffect(() => {
    if (initialInvoiceClientSlug && combinedSubscribers.length > 0) {
      const targetSub = combinedSubscribers.find(s => s.slug === initialInvoiceClientSlug || s.portalToken === initialInvoiceClientSlug) || combinedSubscribers[0];
      if (targetSub) {
        handleOpenNativeInvoiceModal(targetSub, 'mensual');
      }
      if (typeof onClearInitialInvoiceClient === 'function') {
        onClearInitialInvoiceClient();
      }
    }
  }, [initialInvoiceClientSlug, combinedSubscribers.length]);

  // Cálculo de tiempo restante y estado semafórico
  function computeRemainingStats(venceStr) {
    if (!venceStr) {
      return { dias: 0, horas: 0, minutos: 0, estado: 'vencido', label: 'Sin Suscripción Activa' };
    }
    const endMs = new Date(venceStr).getTime();
    if (isNaN(endMs)) {
      return { dias: 0, horas: 0, minutos: 0, estado: 'vencido', label: 'Fecha Inválida' };
    }
    const diff = endMs - Date.now();
    if (diff <= 0) {
      return { dias: 0, horas: 0, minutos: 0, estado: 'vencido', label: 'Vencido' };
    }

    const dias = Math.floor(diff / (1000 * 60 * 60 * 24));
    const horas = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutos = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (dias <= 7) {
      return { dias, horas, minutos, estado: 'por_vencer', label: `Vence en ${dias}d ${horas}h` };
    }
    return { dias, horas, minutos, estado: 'activo', label: `Activo (${dias}d restantes)` };
  }

  // Filtrado de suscriptores
  const filteredSubscribers = useMemo(() => {
    return combinedSubscribers.filter(sub => {
      const matchesSearch =
        sub.empresa.toLowerCase().includes(searchQuery.toLowerCase()) ||
        sub.dominio.toLowerCase().includes(searchQuery.toLowerCase()) ||
        sub.contacto.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      if (statusFilter === 'activos') return sub.stats.estado === 'activo';
      if (statusFilter === 'por_vencer') return sub.stats.estado === 'por_vencer';
      if (statusFilter === 'vencidos') return sub.stats.estado === 'vencido';
      return true;
    });
  }, [combinedSubscribers, searchQuery, statusFilter]);

  // Métricas Globales de Suscripción (KPIs)
  const metrics = useMemo(() => {
    const total = combinedSubscribers.length;
    const activos = combinedSubscribers.filter(s => s.stats.estado === 'activo').length;
    const porVencer = combinedSubscribers.filter(s => s.stats.estado === 'por_vencer').length;
    const vencidos = combinedSubscribers.filter(s => s.stats.estado === 'vencido').length;
    const mrrUSD = combinedSubscribers
      .filter(s => s.stats.estado === 'activo' || s.stats.estado === 'por_vencer')
      .reduce((acc, s) => acc + (Number(s.planMensual) || 99), 0);
    const totalFacturadoCMS = cmsInvoices.reduce((acc, f) => acc + (Number(f.montoCobrado) || 0), 0);

    return { total, activos, porVencer, vencidos, mrrUSD, totalFacturadoCMS };
  }, [combinedSubscribers, cmsInvoices]);

  // Handler: Sumar tiempo de vigencia de forma acumulativa al cliente
  const handleExtenderSuscripcion = async (sub, diasASumar, labelPeriodo, silent = false) => {
    if (!silent) {
      setActionLoadingId(sub.id);
      setToastMsg('');
    }

    try {
      const now = Date.now();
      let baseMs = now;

      // Si el cliente ya tiene una fecha activa en el futuro, acumular sumando a esa fecha
      if (sub.careVenceAt) {
        const currentEndMs = new Date(sub.careVenceAt).getTime();
        if (!isNaN(currentEndMs) && currentEndMs > now) {
          baseMs = currentEndMs;
        }
      }

      const newEndMs = baseMs + (diasASumar * 86400000);
      const newVenceIso = new Date(newEndMs).toISOString();
      const nowStr = new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });

      const nuevoRegistroRecarga = {
        fecha: nowStr,
        periodo: labelPeriodo,
        dias: diasASumar,
        venceHasta: newVenceIso,
        timestamp: Date.now()
      };

      // 1. Actualizar en goglite_proyectos si existe o crear vínculo
      const allProjs = getStoredProyectos();
      const existingProjIdx = allProjs.findIndex(
        p => p.id === sub.id || p.portalToken === sub.portalToken || p.cmsSlug === sub.slug
      );

      if (existingProjIdx !== -1) {
        const targetProj = allProjs[existingProjIdx];
        const currentConfig = targetProj.portalConfig || {};
        const historial = Array.isArray(currentConfig.historialRecargas) ? currentConfig.historialRecargas : [];

        const updatedPortalConfig = {
          ...currentConfig,
          fase5CareActivo: true,
          careVenceAt: newVenceIso,
          fechaActivacionCare: currentConfig.fechaActivacionCare || nowStr,
          ultimaRecargaPeriodo: labelPeriodo,
          fechaUltimaRecarga: nowStr,
          historialRecargas: [nuevoRegistroRecarga, ...historial],
          faseActual: 5,
          progresoPorcentaje: 100
        };

        const updatedProyecto = {
          ...targetProj,
          portalConfig: updatedPortalConfig
        };

        const nextProjs = [...allProjs];
        nextProjs[existingProjIdx] = updatedProyecto;
        saveStoredProyectos(nextProjs);
        setProyectos(nextProjs);

        if (targetProj.id) {
          await saveProyectoCloud(targetProj.id, updatedProyecto);
        }
        if (sub.portalToken) {
          await savePortalCloud(sub.portalToken, {
            token: sub.portalToken,
            portalConfig: updatedPortalConfig
          });
        }
      }

      // 2. Actualizar siempre también en localStorage goglite_cms_sites para sincronía total en el Módulo 6
      const localSites = JSON.parse(localStorage.getItem('goglite_cms_sites') || '[]');
      const updatedSites = localSites.map(s => {
        if (s.slug === sub.slug || s.slug === sub.portalToken) {
          const prevHist = Array.isArray(s.portalConfig?.historialRecargas) ? s.portalConfig.historialRecargas : [];
          return {
            ...s,
            portalConfig: {
              ...(s.portalConfig || {}),
              fase5CareActivo: true,
              careVenceAt: newVenceIso,
              ultimaRecargaPeriodo: labelPeriodo,
              fechaUltimaRecarga: nowStr,
              historialRecargas: [nuevoRegistroRecarga, ...prevHist]
            }
          };
        }
        return s;
      });
      localStorage.setItem('goglite_cms_sites', JSON.stringify(updatedSites));

      if (sub.portalToken) {
        try {
          await savePortalCloud(sub.portalToken, {
            token: sub.portalToken,
            portalConfig: {
              fase5CareActivo: true,
              careVenceAt: newVenceIso,
              ultimaRecargaPeriodo: labelPeriodo,
              fechaUltimaRecarga: nowStr
            }
          });
        } catch (e) {}
      }

      window.dispatchEvent(new CustomEvent('goglite_proyectos_synced'));
      const fechaFinalStr = new Date(newEndMs).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
      if (!silent) {
        setToastMsg(`✓ Suscripción de ${sub.empresa} extendida +${labelPeriodo}. Vence el ${fechaFinalStr}.`);
        setTimeout(() => setToastMsg(''), 5000);
      }
      return { newVenceIso, fechaFinalStr };
    } catch (err) {
      console.error('Error extendiendo membresía CMS:', err);
      if (!silent) {
        setToastMsg(`Error al extender suscripción: ${err.message}`);
      }
      return null;
    } finally {
      if (!silent) {
        setActionLoadingId(null);
      }
    }
  };

  // Abrir Modal Nativo de Factura + Activación de Membresía
  const handleOpenNativeInvoiceModal = (sub, defaultPlanId = 'mensual') => {
    const targetSub = sub || combinedSubscribers[0];
    const planObj = CMS_MEMBERSHIP_PLANS.find(p => p.id === defaultPlanId) || CMS_MEMBERSHIP_PLANS[0];
    const customPrice = defaultPlanId === 'mensual' && targetSub?.planMensual ? Number(targetSub.planMensual) : planObj.precio;

    setInvoiceForm({
      subId: targetSub?.id || '',
      planId: planObj.id,
      empresa: targetSub?.empresa || '',
      contacto: targetSub?.contacto || 'Administrador',
      email: targetSub?.email || '',
      telefono: targetSub?.telefono || '',
      identificacion: targetSub?.identificacion || '',
      pais: targetSub?.pais || 'DO',
      dominio: targetSub?.dominio || '',
      concepto: `${planObj.concepto} — Dominio: ${targetSub?.dominio || 'sitio.com'}`,
      diasVigencia: planObj.dias,
      periodoLabel: planObj.periodo,
      subtotal: customPrice,
      impuestoPorcentaje: 0,
      estadoCobro: 'pagado',
      metodoPago: 'Transferencia Bancaria',
      activarMembresia: true
    });
    setShowInvoiceModal(true);
  };

  // Cambiar el cliente seleccionado dentro del modal de facturación
  const handleSelectSubscriberInModal = (subId) => {
    const targetSub = combinedSubscribers.find(s => s.id === subId);
    if (!targetSub) return;
    const currentPlan = CMS_MEMBERSHIP_PLANS.find(p => p.id === invoiceForm.planId) || CMS_MEMBERSHIP_PLANS[0];
    const price = currentPlan.id === 'mensual' && targetSub.planMensual ? Number(targetSub.planMensual) : currentPlan.precio;

    setInvoiceForm(prev => ({
      ...prev,
      subId: targetSub.id,
      empresa: targetSub.empresa,
      contacto: targetSub.contacto,
      email: targetSub.email,
      telefono: targetSub.telefono,
      identificacion: targetSub.identificacion || '',
      pais: targetSub.pais || 'DO',
      dominio: targetSub.dominio,
      subtotal: price,
      concepto: `${currentPlan.concepto} — Dominio: ${targetSub.dominio}`
    }));
  };

  // Cambiar el plan dentro del modal de facturación
  const handleSelectPlanInModal = (planId) => {
    const planObj = CMS_MEMBERSHIP_PLANS.find(p => p.id === planId);
    if (!planObj) return;
    const targetSub = combinedSubscribers.find(s => s.id === invoiceForm.subId);
    const price = planId === 'mensual' && targetSub?.planMensual ? Number(targetSub.planMensual) : planObj.precio;

    setInvoiceForm(prev => ({
      ...prev,
      planId: planObj.id,
      diasVigencia: planObj.dias,
      periodoLabel: planObj.periodo,
      subtotal: price,
      concepto: `${planObj.concepto}${prev.dominio ? ` — Dominio: ${prev.dominio}` : ''}`
    }));
  };

  // Emitir Factura en Módulo 6, Activar Membresía y Sincronizar con Módulo 7 (Rentabilidad)
  const handleEmitirFacturaYActivar = async (e) => {
    e.preventDefault();
    if (!invoiceForm.empresa.trim()) return;

    const targetSub = combinedSubscribers.find(s => s.id === invoiceForm.subId);
    const subtotal = Number(invoiceForm.subtotal) || 0;
    const impPct = Number(invoiceForm.impuestoPorcentaje) || 0;
    const impuestoTotal = Number(((subtotal * impPct) / 100).toFixed(2));
    const total = Number((subtotal + impuestoTotal).toFixed(2));
    const isPaid = invoiceForm.estadoCobro === 'pagado';
    const montoCobrado = isPaid ? total : 0;
    const saldoPendiente = isPaid ? 0 : total;

    // 1. Si corresponde activar/extender la membresía del cliente en el CMS
    let vigenciaResult = null;
    if (invoiceForm.activarMembresia && targetSub && Number(invoiceForm.diasVigencia) > 0) {
      vigenciaResult = await handleExtenderSuscripcion(
        targetSub,
        Number(invoiceForm.diasVigencia),
        invoiceForm.periodoLabel || `${invoiceForm.diasVigencia} Días`,
        true
      );
    }

    // 2. Construir la factura oficial compatible al 100% con el Módulo 7 (GestionRentabilidadModule)
    let rawFin = {};
    try {
      rawFin = JSON.parse(localStorage.getItem('goglite_finanzas_v1') || '{}');
    } catch (err) {
      rawFin = {};
    }

    const existingFacturas = Array.isArray(rawFin.facturas) ? rawFin.facturas : [];
    const nextNum = String(existingFacturas.length + 1).padStart(3, '0');
    const today = new Date().toISOString().split('T')[0];
    const due = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];

    const nuevaFactura = {
      id: 'fac-cms-' + Date.now(),
      numeroFactura: `FAC-2026-${nextNum}`,
      presupuestoId: null,
      proyectoId: targetSub?.id || ('proj-cms-' + Date.now()),
      codigoProyecto: `CMS-2026-${nextNum}`,
      origenModulo: 'Módulo 6 · Membresía Headless CMS',
      tipoHito: 'recurrente_cms',
      periodoMembresia: invoiceForm.periodoLabel,
      diasActivados: Number(invoiceForm.diasVigencia) || 30,
      venceHasta: vigenciaResult?.fechaFinalStr || null,
      cliente: {
        empresa: invoiceForm.empresa,
        contacto: invoiceForm.contacto || 'Administrador',
        email: invoiceForm.email || '',
        telefono: invoiceForm.telefono || '',
        identificacion: invoiceForm.identificacion || '',
        pais: invoiceForm.pais || 'DO'
      },
      concepto: invoiceForm.concepto,
      fechaEmision: today,
      fechaVencimiento: due,
      subtotal,
      impuestoPorcentaje: impPct,
      impuestoTotal,
      total,
      moneda: 'USD',
      montoCobrado,
      saldoPendiente,
      metodoPago: invoiceForm.metodoPago || 'Transferencia Bancaria',
      cuentaBancariaId: 'bank-1',
      horasInvertidasEstimadas: 2,
      items: [
        {
          id: 'item-cms-1',
          descripcion: invoiceForm.concepto,
          cantidad: 1,
          precioUnitario: subtotal,
          total: subtotal
        }
      ]
    };

    const updatedFacturas = [nuevaFactura, ...existingFacturas];
    const updatedFinanzasState = {
      ...rawFin,
      facturas: updatedFacturas
    };

    try {
      localStorage.setItem('goglite_finanzas_v1', JSON.stringify(updatedFinanzasState));
      localStorage.setItem('goglite_facturas', JSON.stringify(updatedFacturas));
      await saveAppStateCloud('finanzas_v1', 'finanzas', updatedFinanzasState);
    } catch (err) {
      console.warn('Error sincronizando factura CMS con Módulo 7:', err);
    }

    setCmsInvoices(
      updatedFacturas.filter(
        f => f.tipoHito === 'recurrente_cms' || (f.origenModulo || '').toLowerCase().includes('cms')
      )
    );

    window.dispatchEvent(new CustomEvent('goglite_finanzas_synced'));
    setShowInvoiceModal(false);
    setSelectedInvoicePreview(nuevaFactura);

    setToastMsg(
      `✓ Factura ${nuevaFactura.numeroFactura} emitida ($${total.toFixed(2)} USD), membresía activada (+${invoiceForm.periodoLabel}) y sincronizada con el Módulo 7 de Rentabilidad.`
    );
    setTimeout(() => setToastMsg(''), 6000);
  };

  return (
    <div className="space-y-6">
      
      {/* Toast Notification */}
      {toastMsg && (
        <div className={`p-3.5 rounded-xl text-xs font-bold flex items-center justify-between gap-3 shadow-xl animate-fade-in ${
          toastMsg.startsWith('✓')
            ? 'bg-emerald-950/90 text-emerald-300 border border-emerald-500/50'
            : 'bg-rose-950/90 text-rose-300 border border-rose-500/50'
        }`}>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{toastMsg}</span>
          </div>
          <button onClick={() => setToastMsg('')} className="text-slate-400 hover:text-white">✕</button>
        </div>
      )}

      {/* KPI Cards: Resumen de Suscripciones, MRR y Facturación CMS */}
      <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
        <div className="p-4 rounded-2xl bg-[#0e1320] border border-slate-800 shadow-md">
          <div className="text-[10px] font-mono text-slate-400 uppercase font-semibold">Total Clientes CMS</div>
          <div className="text-2xl font-black text-white font-mono mt-1">{metrics.total}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Sitios en plataforma</div>
        </div>

        <div className="p-4 rounded-2xl bg-[#0e1320] border border-emerald-500/30 shadow-md">
          <div className="text-[10px] font-mono text-emerald-400 uppercase font-semibold flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            <span>Activas</span>
          </div>
          <div className="text-2xl font-black text-emerald-400 font-mono mt-1">{metrics.activos}</div>
          <div className="text-[10px] text-emerald-500/80 mt-0.5">Vigencia al día</div>
        </div>

        <div className="p-4 rounded-2xl bg-[#0e1320] border border-amber-500/30 shadow-md">
          <div className="text-[10px] font-mono text-amber-400 uppercase font-semibold">Por Vencer</div>
          <div className="text-2xl font-black text-amber-400 font-mono mt-1">{metrics.porVencer}</div>
          <div className="text-[10px] text-amber-500/80 mt-0.5">&le; 7 días restantes</div>
        </div>

        <div className="p-4 rounded-2xl bg-[#0e1320] border border-rose-500/30 shadow-md">
          <div className="text-[10px] font-mono text-rose-400 uppercase font-semibold">Vencidas</div>
          <div className="text-2xl font-black text-rose-400 font-mono mt-1">{metrics.vencidos}</div>
          <div className="text-[10px] text-rose-500/80 mt-0.5">Modo lectura / pausado</div>
        </div>

        <div className="p-4 rounded-2xl bg-gradient-to-br from-[#12192b] to-[#1a152d] border border-purple-500/40 shadow-md">
          <div className="text-[10px] font-mono text-purple-300 uppercase font-semibold flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            <span>MRR Estimado</span>
          </div>
          <div className="text-2xl font-black text-purple-300 font-mono mt-1">${metrics.mrrUSD} <span className="text-xs font-normal">USD/m</span></div>
          <div className="text-[10px] text-purple-400/80 mt-0.5">Retainers activos</div>
        </div>

        <div className="p-4 rounded-2xl bg-gradient-to-br from-[#0f221d] to-[#0e1320] border border-emerald-500/40 shadow-md">
          <div className="text-[10px] font-mono text-emerald-300 uppercase font-semibold flex items-center gap-1">
            <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
            <span>Cobrado en CMS</span>
          </div>
          <div className="text-2xl font-black text-emerald-300 font-mono mt-1">${metrics.totalFacturadoCMS.toLocaleString()}</div>
          <div className="text-[10px] text-emerald-400/80 mt-0.5">Reportado a Módulo 7</div>
        </div>
      </div>

      {/* Control Bar: Búsqueda, Filtro y Acciones Principales del Programa CMS */}
      <div className="p-4 rounded-2xl bg-[#0e1320] border border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-3 shadow-md">
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por cliente, dominio o contacto..."
              className="w-full bg-[#131926] border border-slate-700/80 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Filtros de estado */}
          <div className="flex items-center gap-1.5 overflow-x-auto">
            {[
              { id: 'todos', label: 'Todos' },
              { id: 'activos', label: 'Activos' },
              { id: 'por_vencer', label: 'Por Vencer' },
              { id: 'vencidos', label: 'Vencidos' }
            ].map(flt => (
              <button
                key={flt.id}
                onClick={() => setStatusFilter(flt.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  statusFilter === flt.id
                    ? 'bg-purple-600 text-white shadow-md shadow-purple-950/40'
                    : 'bg-[#131926] text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                {flt.label}
              </button>
            ))}
          </div>

          <div className="h-5 w-px bg-slate-800 hidden sm:block mx-1" />

          {typeof onOpenNewSiteModal === 'function' && (
            <button
              type="button"
              onClick={onOpenNewSiteModal}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-emerald-500/30 text-xs font-bold flex items-center gap-1.5 transition-all"
            >
              <PlusCircle className="w-3.5 h-3.5 text-emerald-400" />
              <span>Ingresar Cliente CMS</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => handleOpenNativeInvoiceModal(combinedSubscribers[0], 'mensual')}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-orange-950/50 transition-all"
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>💳 Emitir Factura & Activar Membresía</span>
          </button>
        </div>
      </div>

      {/* Grid de Suscriptores / Fichas de Clientes */}
      {filteredSubscribers.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-[#0e1320] border border-slate-800 space-y-3">
          <Users className="w-10 h-10 text-slate-600 mx-auto" />
          <h4 className="text-sm font-bold text-slate-300">No se encontraron clientes con suscripción CMS</h4>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            {searchQuery
              ? 'No hay resultados que coincidan con tu búsqueda.'
              : 'Ingresa un nuevo cliente en el Headless CMS para gestionar sus herramientas y renovaciones mensuales o anuales.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredSubscribers.map(sub => {
            const isProcessing = actionLoadingId === sub.id;
            const isCurrentlySelected = selectedSlug === sub.slug || selectedSlug === sub.portalToken;
            const formattedVence = sub.careVenceAt ? (() => {
              try {
                return new Date(sub.careVenceAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
              } catch {
                return sub.careVenceAt;
              }
            })() : null;

            return (
              <div
                key={sub.id}
                className={`p-5 rounded-2xl bg-[#0e1320] border transition-all shadow-xl hover:border-purple-500/40 ${
                  isCurrentlySelected
                    ? 'border-purple-500/60 ring-1 ring-purple-500/30'
                    : sub.stats.estado === 'activo'
                    ? 'border-emerald-500/20'
                    : sub.stats.estado === 'por_vencer'
                    ? 'border-amber-500/40 bg-gradient-to-r from-[#14120e] to-[#0e1320]'
                    : 'border-slate-800'
                }`}
              >
                <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
                  
                  {/* Info Cliente & Dominio */}
                  <div className="flex items-start gap-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500/20 to-orange-500/20 border border-purple-500/30 flex items-center justify-center font-black text-white text-base shrink-0">
                      {sub.empresa[0]?.toUpperCase() || 'C'}
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-sm font-extrabold text-white">{sub.empresa}</h4>
                        <span className="text-xs">{sub.pais === 'DO' ? '🇩🇴' : sub.pais === 'US' ? '🇺🇸' : '🇸🇻'}</span>
                        
                        {/* Estado Badge */}
                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold uppercase ${
                          sub.stats.estado === 'activo'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : sub.stats.estado === 'por_vencer'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        }`}>
                          {sub.stats.estado === 'activo' ? '✓ Activo' : sub.stats.estado === 'por_vencer' ? '⚠️ Por Vencer' : '⛔ Inactivo / Vencido'}
                        </span>

                        {isCurrentlySelected && (
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40 font-bold">
                            🎯 Seleccionado en Hub
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3 text-xs text-slate-400 flex-wrap">
                        <a
                          href={`https://${sub.dominio}`}
                          target="_blank"
                          rel="noreferrer"
                          className="hover:text-purple-300 flex items-center gap-1 font-mono text-[11px]"
                        >
                          <Globe className="w-3.5 h-3.5 text-slate-500" />
                          <span>{sub.dominio}</span>
                          <ExternalLink className="w-2.5 h-2.5 text-slate-500" />
                        </a>
                        <span className="text-slate-600">·</span>
                        <span>Contacto: <strong className="text-slate-300">{sub.contacto}</strong></span>
                        {sub.telefono && (
                          <>
                            <span className="text-slate-600">·</span>
                            <span className="font-mono text-[11px] text-slate-400">{sub.telefono}</span>
                          </>
                        )}
                      </div>

                      {/* Vigencia & Última Recarga */}
                      <div className="pt-0.5 flex items-center gap-2 text-xs flex-wrap">
                        {formattedVence ? (
                          <span className="text-[11px] font-mono text-slate-300">
                            Vigencia activa hasta: <strong className="text-purple-300">{formattedVence}</strong>{' '}
                            {sub.stats.estado !== 'vencido' && (
                              <span className="text-emerald-400 font-bold">({sub.stats.dias} días restantes)</span>
                            )}
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-500 italic">Sin fecha de corte registrada</span>
                        )}

                        {sub.ultimaRecargaPeriodo && (
                          <span className="text-[10px] font-mono text-slate-400 bg-slate-900/90 px-2 py-0.5 rounded border border-slate-800">
                            Última recarga: {sub.ultimaRecargaPeriodo} ({sub.fechaUltimaRecarga})
                          </span>
                        )}
                      </div>

                      {/* Barra de Salto Directo a las 3 Herramientas del Cliente en este Módulo 6 */}
                      {typeof onSelectSiteInHub === 'function' && (
                        <div className="pt-1.5 flex flex-wrap items-center gap-1.5">
                          <span className="text-[10px] font-mono text-slate-400 uppercase mr-1">Abrir herramientas de este cliente:</span>
                          <button
                            type="button"
                            onClick={() => onSelectSiteInHub(sub, 'editor_visual')}
                            className="px-2.5 py-1 rounded-lg bg-orange-500/10 hover:bg-orange-500/20 text-orange-300 border border-orange-500/30 text-[11px] font-bold flex items-center gap-1 transition-all"
                          >
                            <MousePointerClick className="w-3 h-3" />
                            <span>🎨 Editor Web</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => onSelectSiteInHub(sub, 'google_profile')}
                            className="px-2.5 py-1 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 border border-blue-500/30 text-[11px] font-bold flex items-center gap-1 transition-all"
                          >
                            <MapPin className="w-3 h-3" />
                            <span>📍 Google Business IA</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => onSelectSiteInHub(sub, 'site_kit')}
                            className="px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[11px] font-bold flex items-center gap-1 transition-all"
                          >
                            <Activity className="w-3 h-3" />
                            <span>⚡ Site Kit</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Acciones Rápidas: CMS del Cliente, Activación 1-Clic y Facturación Nativa */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shrink-0">
                    
                    {/* Botonera de 1-Clic: Activar +1M, +3M, +6M, +1A */}
                    <div className="p-2.5 rounded-xl bg-[#131926] border border-slate-800 space-y-1.5">
                      <span className="text-[9px] font-mono uppercase text-slate-400 font-bold block text-center sm:text-left">
                        Recarga Rápida de Vigencia (Acumulativa):
                      </span>
                      <div className="grid grid-cols-4 gap-1.5">
                        <button
                          type="button"
                          disabled={isProcessing}
                          onClick={() => handleExtenderSuscripcion(sub, 30, '1 Mes')}
                          title="Sumar 30 días de cobertura a la suscripción"
                          className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-purple-600/30 text-purple-300 border border-slate-700/80 hover:border-purple-500/50 text-xs font-bold font-mono transition-all disabled:opacity-50 text-center"
                        >
                          +1 Mes
                        </button>
                        <button
                          type="button"
                          disabled={isProcessing}
                          onClick={() => handleExtenderSuscripcion(sub, 90, '3 Meses')}
                          title="Sumar 90 días de cobertura a la suscripción"
                          className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-purple-600/30 text-purple-300 border border-slate-700/80 hover:border-purple-500/50 text-xs font-bold font-mono transition-all disabled:opacity-50 text-center"
                        >
                          +3 Meses
                        </button>
                        <button
                          type="button"
                          disabled={isProcessing}
                          onClick={() => handleExtenderSuscripcion(sub, 180, '6 Meses')}
                          title="Sumar 180 días de cobertura a la suscripción"
                          className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-purple-600/30 text-purple-300 border border-slate-700/80 hover:border-purple-500/50 text-xs font-bold font-mono transition-all disabled:opacity-50 text-center"
                        >
                          +6 Meses
                        </button>
                        <button
                          type="button"
                          disabled={isProcessing}
                          onClick={() => handleExtenderSuscripcion(sub, 365, '1 Año')}
                          title="Sumar 365 días de cobertura VIP a la suscripción"
                          className="px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-orange-600/30 to-amber-600/30 hover:from-orange-600 hover:to-amber-600 text-amber-300 border border-amber-500/40 text-xs font-bold font-mono transition-all disabled:opacity-50 text-center"
                        >
                          +1 Año
                        </button>
                      </div>
                    </div>

                    {/* Enlaces de Acceso al Portal del Cliente y Facturación Nativa */}
                    <div className="flex sm:flex-col gap-1.5 justify-center">
                      <a
                        href={`/cms-cliente/${sub.portalToken}`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex-1 sm:flex-none px-3 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow transition-all"
                        title="Abrir Panel Autoadministrable en modo cliente"
                      >
                        <Sliders className="w-3.5 h-3.5" />
                        <span>Portal Cliente</span>
                      </a>

                      <button
                        type="button"
                        onClick={() => handleOpenNativeInvoiceModal(sub, 'mensual')}
                        className="flex-1 sm:flex-none px-3 py-2 rounded-xl bg-gradient-to-r from-orange-600/20 to-amber-600/20 hover:from-orange-600 hover:to-amber-600 text-orange-300 hover:text-white font-bold text-xs flex items-center justify-center gap-1.5 border border-orange-500/40 transition-all"
                        title="Emitir factura de membresía y activar suscripción automáticamente"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>Facturar Plan</span>
                      </button>
                    </div>

                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* HISTORIAL NATIVO DE FACTURAS DE MEMBRESÍA CMS (SINCRONIZADO CON MÓDULO 7) */}
      <div className="p-5 rounded-2xl bg-[#0e1320] border border-slate-800 shadow-md space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-orange-400">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span>Facturas de Membresía Emitidas en Headless CMS</span>
                <span className="text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                  Sincronizadas con Módulo 7 (Rentabilidad)
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Cada factura emitida aquí activa la suscripción del cliente y se contabiliza automáticamente en el P&amp;L financiero de la agencia.
              </p>
            </div>
          </div>
        </div>

        {cmsInvoices.length === 0 ? (
          <div className="p-6 text-center rounded-xl bg-[#131926] border border-slate-800/80 text-xs text-slate-400">
            Aún no se han emitido facturas de membresía desde el Headless CMS. Usa el botón <strong>"Facturar Plan"</strong> en cualquier cliente para generar su comprobante y activar su vigencia.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-[10px] font-mono uppercase text-slate-400">
                  <th className="py-2.5 px-3">Nº Factura</th>
                  <th className="py-2.5 px-3">Cliente</th>
                  <th className="py-2.5 px-3">Plan / Concepto</th>
                  <th className="py-2.5 px-3">Fecha</th>
                  <th className="py-2.5 px-3">Total</th>
                  <th className="py-2.5 px-3">Estado</th>
                  <th className="py-2.5 px-3 text-right">Comprobante</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70">
                {cmsInvoices.slice(0, 10).map(fac => {
                  const pagada = Number(fac.saldoPendiente) <= 0;
                  return (
                    <tr key={fac.id} className="hover:bg-[#131926]/80 transition-colors">
                      <td className="py-2.5 px-3 font-mono font-bold text-orange-300">{fac.numeroFactura}</td>
                      <td className="py-2.5 px-3 font-bold text-white">{fac.cliente?.empresa}</td>
                      <td className="py-2.5 px-3 text-slate-300 max-w-xs truncate">{fac.concepto}</td>
                      <td className="py-2.5 px-3 font-mono text-slate-400">{fac.fechaEmision}</td>
                      <td className="py-2.5 px-3 font-mono font-bold text-white">${Number(fac.total || 0).toFixed(2)} USD</td>
                      <td className="py-2.5 px-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                          pagada
                            ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                            : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                        }`}>
                          {pagada ? '✓ Cobrada & Activa' : 'Pendiente'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <button
                          type="button"
                          onClick={() => setSelectedInvoicePreview(fac)}
                          className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-[11px] inline-flex items-center gap-1 border border-slate-700"
                        >
                          <Printer className="w-3 h-3 text-orange-400" />
                          <span>Ver / PDF</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL NATIVO DE FACTURACIÓN Y ACTIVACIÓN DE MEMBRESÍA CMS */}
      {showInvoiceModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#0e1320] border border-orange-500/40 rounded-2xl max-w-2xl w-full p-6 space-y-5 shadow-2xl my-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-orange-500/15 border border-orange-500/30 flex items-center justify-center text-orange-400">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">
                    Facturar Retainer &amp; Activar Membresía Headless CMS
                  </h3>
                  <p className="text-xs text-slate-400">
                    Activa automáticamente los días de servicio en el CMS y registra el ingreso en el Módulo 7 (Rentabilidad).
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowInvoiceModal(false)}
                className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleEmitirFacturaYActivar} className="space-y-4">
              {/* Selector de Cliente y Dominio */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1 font-semibold">Seleccionar Cliente del CMS</label>
                  <select
                    value={invoiceForm.subId}
                    onChange={(e) => handleSelectSubscriberInModal(e.target.value)}
                    className="w-full bg-[#131926] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-bold"
                  >
                    {combinedSubscribers.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.empresa} ({s.dominio})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1 font-semibold">Nombre Comercial / Empresa *</label>
                  <input
                    type="text"
                    required
                    value={invoiceForm.empresa}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, empresa: e.target.value })}
                    className="w-full bg-[#131926] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>

              {/* Selección de Plan con 1 Clic */}
              <div className="space-y-1.5">
                <label className="block text-xs text-slate-400 font-semibold">Seleccionar Plan de Membresía a Facturar y Activar:</label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {CMS_MEMBERSHIP_PLANS.map(plan => {
                    const active = invoiceForm.planId === plan.id;
                    return (
                      <button
                        key={plan.id}
                        type="button"
                        onClick={() => handleSelectPlanInModal(plan.id)}
                        className={`p-2.5 rounded-xl border text-left transition-all ${
                          active
                            ? 'bg-orange-600/20 border-orange-500 text-white shadow-md'
                            : 'bg-[#131926] border-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        <div className="text-[11px] font-bold truncate">{plan.periodo}</div>
                        <div className="text-sm font-black font-mono text-orange-400 mt-0.5">${plan.precio}</div>
                        <div className="text-[10px] font-mono text-slate-400">+{plan.dias} días</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Datos fiscales y contacto */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Contacto / Representante</label>
                  <input
                    type="text"
                    value={invoiceForm.contacto}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, contacto: e.target.value })}
                    className="w-full bg-[#131926] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">RNC / NIT / ID Fiscal</label>
                  <input
                    type="text"
                    value={invoiceForm.identificacion}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, identificacion: e.target.value })}
                    placeholder="Ej. 131-XXXXX-X"
                    className="w-full bg-[#131926] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">WhatsApp Cliente</label>
                  <input
                    type="text"
                    value={invoiceForm.telefono}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, telefono: e.target.value })}
                    placeholder="+1 809..."
                    className="w-full bg-[#131926] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono"
                  />
                </div>
              </div>

              {/* Concepto */}
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Concepto de la Factura *</label>
                <input
                  type="text"
                  required
                  value={invoiceForm.concepto}
                  onChange={(e) => setInvoiceForm({ ...invoiceForm, concepto: e.target.value })}
                  className="w-full bg-[#131926] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              {/* Monto, Días, Impuesto y Método de Pago */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Subtotal ($ USD)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={invoiceForm.subtotal}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, subtotal: e.target.value })}
                    className="w-full bg-[#131926] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Días a Activar</label>
                  <input
                    type="number"
                    value={invoiceForm.diasVigencia}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, diasVigencia: e.target.value })}
                    className="w-full bg-[#131926] border border-slate-700 rounded-xl px-3 py-2 text-xs text-emerald-400 font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Impuesto</label>
                  <select
                    value={invoiceForm.impuestoPorcentaje}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, impuestoPorcentaje: Number(e.target.value) })}
                    className="w-full bg-[#131926] border border-slate-700 rounded-xl px-2.5 py-2 text-xs text-white"
                  >
                    <option value={0}>0% Exento</option>
                    <option value={18}>18% ITBIS (RD)</option>
                    <option value={13}>13% IVA (SV)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Estado del Pago</label>
                  <select
                    value={invoiceForm.estadoCobro}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, estadoCobro: e.target.value })}
                    className="w-full bg-[#131926] border border-slate-700 rounded-xl px-2.5 py-2 text-xs text-white font-bold"
                  >
                    <option value="pagado">✓ Pagado 100%</option>
                    <option value="pendiente">⏳ Pendiente de Cobro</option>
                  </select>
                </div>
              </div>

              {/* Switch de Activación Automática de Membresía */}
              <label className="p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-500/40 flex items-center justify-between gap-3 cursor-pointer">
                <div className="flex items-center gap-2.5">
                  <input
                    type="checkbox"
                    checked={invoiceForm.activarMembresia}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, activarMembresia: e.target.checked })}
                    className="w-4 h-4 accent-emerald-500 rounded"
                  />
                  <div>
                    <div className="text-xs font-bold text-emerald-300">
                      Activar y acumular vigencia en el Headless CMS automáticamente (+{invoiceForm.diasVigencia} días)
                    </div>
                    <div className="text-[11px] text-slate-400">
                      El portal del cliente <code className="text-emerald-300 font-mono">/cms-cliente/{combinedSubscribers.find(s => s.id === invoiceForm.subId)?.portalToken || 'sitio'}</code> quedará activo de inmediato.
                    </div>
                  </div>
                </div>
                <span className="text-sm font-black font-mono text-white shrink-0">
                  Total: ${(Number(invoiceForm.subtotal || 0) * (1 + Number(invoiceForm.impuestoPorcentaje || 0) / 100)).toFixed(2)} USD
                </span>
              </label>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowInvoiceModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-orange-950"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Emitir Factura, Activar Membresía &amp; Sincronizar</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE VISTA PREVIA E IMPRESIÓN PDF DE LA FACTURA EMITIDA EN EL CMS */}
      {selectedInvoicePreview && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white text-slate-900 rounded-2xl max-w-2xl w-full p-8 space-y-6 shadow-2xl my-8">
            <div className="flex items-start justify-between border-b border-slate-200 pb-5">
              <div>
                <div className="text-xs font-mono uppercase tracking-widest text-orange-600 font-bold">
                  GOGLITE DIGITAL HUB · HEADLESS CMS CARE
                </div>
                <h3 className="text-2xl font-black text-slate-900 mt-1">
                  FACTURA COMERCIAL #{selectedInvoicePreview.numeroFactura}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Fecha de Emisión: {selectedInvoicePreview.fechaEmision} · Estado:{' '}
                  <strong className={Number(selectedInvoicePreview.saldoPendiente) <= 0 ? 'text-emerald-600' : 'text-amber-600'}>
                    {Number(selectedInvoicePreview.saldoPendiente) <= 0 ? 'PAGADA & MEMBRESÍA ACTIVA' : 'PENDIENTE DE PAGO'}
                  </strong>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedInvoicePreview(null)}
                className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
              <div>
                <div className="text-[10px] font-mono uppercase text-slate-400 font-bold">Facturado a:</div>
                <div className="font-bold text-slate-900 text-sm mt-0.5">{selectedInvoicePreview.cliente?.empresa}</div>
                <div className="text-slate-600">Atención: {selectedInvoicePreview.cliente?.contacto}</div>
                {selectedInvoicePreview.cliente?.identificacion && (
                  <div className="text-slate-600 font-mono">ID Fiscal: {selectedInvoicePreview.cliente.identificacion}</div>
                )}
              </div>
              <div className="text-right">
                <div className="text-[10px] font-mono uppercase text-slate-400 font-bold">Cobertura Headless CMS:</div>
                <div className="font-bold text-emerald-700 text-sm mt-0.5">
                  +{selectedInvoicePreview.periodoMembresia || '30 Días'} de Suscripción Activa
                </div>
                {selectedInvoicePreview.venceHasta && (
                  <div className="text-slate-600">Vigencia hasta: <strong>{selectedInvoicePreview.venceHasta}</strong></div>
                )}
                <div className="text-slate-500 font-mono text-[11px]">Método: {selectedInvoicePreview.metodoPago}</div>
              </div>
            </div>

            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b-2 border-slate-200 text-slate-500 uppercase text-[10px] font-mono">
                  <th className="py-2">Descripción del Servicio / Membresía</th>
                  <th className="py-2 text-right">Cant.</th>
                  <th className="py-2 text-right">Total (USD)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {(selectedInvoicePreview.items || []).map((it, i) => (
                  <tr key={i}>
                    <td className="py-3 font-medium text-slate-800">{it.descripcion}</td>
                    <td className="py-3 text-right font-mono">{it.cantidad}</td>
                    <td className="py-3 text-right font-mono font-bold">${Number(it.total || 0).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="border-t border-slate-200 pt-4 flex flex-col items-end space-y-1 text-xs">
              <div className="flex justify-between w-56 text-slate-600">
                <span>Subtotal:</span>
                <span className="font-mono">${Number(selectedInvoicePreview.subtotal || 0).toFixed(2)} USD</span>
              </div>
              {Number(selectedInvoicePreview.impuestoTotal) > 0 && (
                <div className="flex justify-between w-56 text-slate-600">
                  <span>Impuestos ({selectedInvoicePreview.impuestoPorcentaje}%):</span>
                  <span className="font-mono">${Number(selectedInvoicePreview.impuestoTotal).toFixed(2)} USD</span>
                </div>
              )}
              <div className="flex justify-between w-56 text-base font-black text-slate-900 pt-1 border-t border-slate-200">
                <span>Total Facturado:</span>
                <span className="font-mono text-orange-600">${Number(selectedInvoicePreview.total || 0).toFixed(2)} USD</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-200">
              <span className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" />
                <span>Contabilizada automáticamente en el Módulo 7 (Rentabilidad &amp; Finanzas)</span>
              </span>

              <div className="flex items-center gap-2">
                {selectedInvoicePreview.cliente?.telefono && (
                  <a
                    href={`https://wa.me/${selectedInvoicePreview.cliente.telefono.replace(/\D/g, '')}?text=${encodeURIComponent(
                      `Hola ${selectedInvoicePreview.cliente.contacto || selectedInvoicePreview.cliente.empresa}, te compartimos el comprobante de tu factura *${selectedInvoicePreview.numeroFactura}* por *$${Number(selectedInvoicePreview.total).toFixed(2)} USD* correspondiente a tu *Membresía Headless CMS (${selectedInvoicePreview.periodoMembresia || 'Activa'})*. ¡Tu plataforma web y herramientas IA están 100% activas!`
                    )}`}
                    target="_blank"
                    rel="noreferrer"
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Enviar por WhatsApp</span>
                  </a>
                )}

                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Imprimir / Guardar PDF</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedInvoicePreview(null)}
                  className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
