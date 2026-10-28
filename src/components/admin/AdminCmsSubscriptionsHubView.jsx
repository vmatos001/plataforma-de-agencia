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
  MousePointerClick,
  Settings,
  Gift,
  Copy
} from 'lucide-react';
import { getStoredProyectos, saveStoredProyectos } from '../../services/contractGenerator';
import { saveProyectoCloud, savePortalCloud, saveAppStateCloud, saveCmsSiteCloud } from '../../services/firestoreSyncService';

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
 * Vista Centralizada de Gestión de Suscriptores, Facturación Nativa, Reloj de 30 Días de Prueba
 * y Vinculación de Administrador Delegado (sitesgoglite@gmail.com).
 */
export default function AdminCmsSubscriptionsHubView({
  sites = [],
  selectedSlug,
  onSelectSiteInHub,
  onOpenNewSiteModal,
  onUpdateSiteConfig,
  initialInvoiceClientSlug = null,
  onClearInitialInvoiceClient
}) {
  const [proyectos, setProyectos] = useState([]);
  const [cmsInvoices, setCmsInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [toastMsg, setToastMsg] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('todos'); // 'todos' | 'activos' | 'prueba' | 'por_vencer' | 'vencidos'
  const [nowTick, setNowTick] = useState(() => Date.now());

  // Actualizar reloj cada 30 segundos para mostrar días y horas exactas
  useEffect(() => {
    const interval = setInterval(() => setNowTick(Date.now()), 30000);
    return () => clearInterval(interval);
  }, []);

  // 1. Modal de Confirmación Anti-Error para los Botones +1M, +3M, +6M, +1A (Genera Factura al Confirmar)
  const [confirmPlanModal, setConfirmPlanModal] = useState(null);
  // confirmPlanModal = { sub, planId, periodoLabel, dias, precio, concepto, metodoPago, impuestoPorcentaje, esPruebaGratis }

  // 2. Modal de Configuración de Sitio en Producción & Delegación a sitesgoglite@gmail.com (ej. TurisRan)
  const [configSiteModal, setConfigSiteModal] = useState(null);
  const [copiedDelegationMsg, setCopiedDelegationMsg] = useState(false);

  // 3. Estado del Modal Completo de Facturación + Vista Previa Imprimible PDF
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
    estadoCobro: 'pagado',
    metodoPago: 'Transferencia Bancaria',
    activarMembresia: true
  });

  // Cargar proyectos y facturas de membresía CMS
  const loadData = () => {
    try {
      setLoading(true);
      const stored = getStoredProyectos();
      setProyectos(Array.isArray(stored) ? stored : []);

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

  // Consolidar suscriptores: Proyectos + Sitios en Producción (con detección automática de los 30 días de gracia post-Fase 5)
  const combinedSubscribers = useMemo(() => {
    const list = [];
    const seenSlugs = new Set();

    const normalizeSlug = (str) =>
      (str || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

    // 1. Añadir desde proyectos existentes
    proyectos.forEach(proj => {
      const empresa = proj.cliente?.empresa || proj.lead?.empresa || 'Cliente VIP';
      const slug = proj.cmsSlug || normalizeSlug(empresa) || proj.id;
      seenSlugs.add(slug);

      // Buscar si también tiene entrada en sites para combinar URL de producción
      const matchingSite = sites.find(s => s.slug === slug || normalizeSlug(s.nombre) === slug);
      const portalConfig = {
        ...(matchingSite?.portalConfig || {}),
        ...(proj.portalConfig || {})
      };

      // Detectar si el proyecto terminó las 5 fases (Liquidación confirmada / Fase 5) para activar el reloj de 30 días de prueba
      const fase5Completada = Boolean(
        portalConfig.fase4Liquidada ||
        portalConfig.liquidacionPagada ||
        proj.pagos?.saldoEstado === 'confirmado' ||
        proj.estado === 'entregado' ||
        proj.seguimiento?.porcentajeAvance >= 100
      );

      const fechaBaseEntrega =
        portalConfig.fechaLiquidacion ||
        proj.pagos?.saldoFecha ||
        portalConfig.fechaInicioGarantia ||
        proj.fechaCreacion ||
        null;

      let careVenceAt = portalConfig.careVenceAt || null;
      let esMesDePrueba = Boolean(portalConfig.esMesDePrueba);

      // Si completó las 5 fases (o no tenía fecha de corte aún) y tiene fecha de entrega, calcular sus 30 días de gracia iniciales
      if (!careVenceAt && (fase5Completada || fechaBaseEntrega)) {
        const startMs = fechaBaseEntrega ? new Date(fechaBaseEntrega).getTime() : Date.now();
        if (!isNaN(startMs)) {
          careVenceAt = new Date(startMs + 30 * 86400000).toISOString();
          esMesDePrueba = true;
        }
      }

      const stats = computeRemainingStats(careVenceAt, esMesDePrueba, nowTick);
      const dominioLimpio = (
        matchingSite?.dominio ||
        proj.dominio ||
        portalConfig.dominio ||
        `${empresa.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`
      ).replace(/^https?:\/\//, '').replace(/\/$/, '');

      list.push({
        id: proj.id,
        slug,
        tipo: 'proyecto',
        proyectoRef: proj,
        siteRef: matchingSite || null,
        empresa,
        contacto: proj.cliente?.contacto || proj.lead?.contacto || 'Administrador',
        email: portalConfig.cuentaCmsSitioRegistrada || proj.cliente?.email || proj.lead?.email || '',
        telefono: proj.cliente?.telefono || proj.lead?.telefono || '',
        identificacion: proj.cliente?.identificacion || proj.cliente?.rnc || '',
        pais: proj.cliente?.pais || proj.lead?.pais || proj.pais || 'DO',
        dominio: dominioLimpio,
        urlProduccion: portalConfig.urlProduccion || matchingSite?.urlProduccion || `https://${dominioLimpio}`,
        portalToken: proj.portalToken || proj.presupuestoId || slug,
        careVenceAt,
        esMesDePrueba,
        fase5CareActivo: Boolean(portalConfig.fase5CareActivo || stats.estado !== 'vencido'),
        delegacionGoogleActiva: portalConfig.delegacionGoogleActiva !== false,
        cuentaAdminDelegada: portalConfig.cuentaAdminDelegada || 'sitesgoglite@gmail.com',
        ultimaRecargaPeriodo: portalConfig.ultimaRecargaPeriodo || (esMesDePrueba ? '30 Días de Prueba Post-Entrega' : null),
        fechaUltimaRecarga: portalConfig.fechaUltimaRecarga || null,
        historialRecargas: portalConfig.historialRecargas || [],
        planMensual: Number(portalConfig.planMensual) || 99,
        stats
      });
    });

    // 2. Añadir sitios CMS registrados directamente en el Módulo 6 (proyectos anteriores ya en producción)
    sites.forEach(site => {
      const slug = site.slug || normalizeSlug(site.nombre) || site.id;
      if (seenSlugs.has(slug)) return;
      seenSlugs.add(slug);

      const portalConfig = site.portalConfig || {};
      let careVenceAt = portalConfig.careVenceAt || null;
      let esMesDePrueba = Boolean(portalConfig.esMesDePrueba);

      // Para el sitio oficial de la agencia (goglite), mantenerlo activo permanentemente
      if (slug === 'goglite' && !careVenceAt) {
        careVenceAt = new Date(Date.now() + 365 * 86400000).toISOString();
      }

      const stats = computeRemainingStats(careVenceAt, esMesDePrueba, nowTick);
      const dominioLimpio = (site.dominio || `${slug}.com`).replace(/^https?:\/\//, '').replace(/\/$/, '');

      list.push({
        id: site.id || ('site-' + slug),
        slug,
        tipo: 'site',
        siteRef: site,
        empresa: site.nombre || site.contenido?.branding?.nombreMarca || 'Sitio CMS',
        contacto: site.cliente?.contacto || 'Administrador',
        email: portalConfig.cuentaCmsSitioRegistrada || site.cliente?.email || '',
        telefono: site.cliente?.telefono || site.contenido?.branding?.telefonoWhatsApp || '',
        identificacion: site.cliente?.identificacion || '',
        pais: site.pais || 'DO',
        dominio: dominioLimpio,
        urlProduccion: portalConfig.urlProduccion || site.urlProduccion || `https://${dominioLimpio}`,
        portalToken: slug,
        careVenceAt,
        esMesDePrueba,
        fase5CareActivo: Boolean(portalConfig.fase5CareActivo || stats.estado !== 'vencido'),
        delegacionGoogleActiva: portalConfig.delegacionGoogleActiva !== false,
        cuentaAdminDelegada: portalConfig.cuentaAdminDelegada || 'sitesgoglite@gmail.com',
        ultimaRecargaPeriodo: portalConfig.ultimaRecargaPeriodo || null,
        fechaUltimaRecarga: portalConfig.fechaUltimaRecarga || null,
        historialRecargas: portalConfig.historialRecargas || [],
        planMensual: Number(site.planMensual || portalConfig.planMensual) || 99,
        stats
      });
    });

    return list;
  }, [proyectos, sites, nowTick]);

  // Si se solicitó abrir el modal de factura para un cliente específico desde la cabecera del Hub
  useEffect(() => {
    if (initialInvoiceClientSlug && combinedSubscribers.length > 0) {
      const targetSub =
        combinedSubscribers.find(
          s => s.slug === initialInvoiceClientSlug || s.portalToken === initialInvoiceClientSlug
        ) || combinedSubscribers[0];
      if (targetSub) {
        handleOpenNativeInvoiceModal(targetSub, 'mensual');
      }
      if (typeof onClearInitialInvoiceClient === 'function') {
        onClearInitialInvoiceClient();
      }
    }
  }, [initialInvoiceClientSlug, combinedSubscribers.length]);

  // Cálculo de tiempo restante (Reloj regresivo desde 30d hasta 0) y estado semafórico
  function computeRemainingStats(venceStr, esMesDePrueba = false, currentNow = Date.now()) {
    if (!venceStr) {
      return { dias: 0, horas: 0, minutos: 0, estado: 'vencido', esMesDePrueba: false, label: 'Sin Suscripción Activa' };
    }
    const endMs = new Date(venceStr).getTime();
    if (isNaN(endMs)) {
      return { dias: 0, horas: 0, minutos: 0, estado: 'vencido', esMesDePrueba: false, label: 'Fecha Inválida' };
    }
    const diff = endMs - currentNow;
    if (diff <= 0) {
      return { dias: 0, horas: 0, minutos: 0, estado: 'vencido', esMesDePrueba, label: 'Vencido (0d restantes)' };
    }

    const dias = Math.floor(diff / (1000 * 60 * 60 * 24));
    const horas = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutos = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (dias <= 7) {
      return {
        dias,
        horas,
        minutos,
        estado: 'por_vencer',
        esMesDePrueba,
        label: `${esMesDePrueba ? '🎁 Prueba vence en' : '⚠️ Vence en'} ${dias}d ${horas}h`
      };
    }
    return {
      dias,
      horas,
      minutos,
      estado: 'activo',
      esMesDePrueba,
      label: `${esMesDePrueba ? '🎁 Mes de Prueba' : '💎 Membresía Activa'} (${dias}d ${horas}h)`
    };
  }

  // Filtrado de suscriptores
  const filteredSubscribers = useMemo(() => {
    return combinedSubscribers.filter(sub => {
      const matchesSearch =
        sub.empresa.toLowerCase().includes(searchQuery.toLowerCase()) ||
        sub.dominio.toLowerCase().includes(searchQuery.toLowerCase()) ||
        sub.contacto.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      if (statusFilter === 'activos') return sub.stats.estado === 'activo' && !sub.esMesDePrueba;
      if (statusFilter === 'prueba') return sub.esMesDePrueba && sub.stats.estado !== 'vencido';
      if (statusFilter === 'por_vencer') return sub.stats.estado === 'por_vencer';
      if (statusFilter === 'vencidos') return sub.stats.estado === 'vencido';
      return true;
    });
  }, [combinedSubscribers, searchQuery, statusFilter]);

  // Métricas Globales de Suscripción (KPIs)
  const metrics = useMemo(() => {
    const total = combinedSubscribers.length;
    const activos = combinedSubscribers.filter(s => s.stats.estado === 'activo' && !s.esMesDePrueba).length;
    const enPrueba = combinedSubscribers.filter(s => s.esMesDePrueba && s.stats.estado !== 'vencido').length;
    const porVencer = combinedSubscribers.filter(s => s.stats.estado === 'por_vencer').length;
    const vencidos = combinedSubscribers.filter(s => s.stats.estado === 'vencido').length;
    const mrrUSD = combinedSubscribers
      .filter(s => s.stats.estado === 'activo' || s.stats.estado === 'por_vencer')
      .reduce((acc, s) => acc + (Number(s.planMensual) || 99), 0);
    const totalFacturadoCMS = cmsInvoices.reduce((acc, f) => acc + (Number(f.montoCobrado) || 0), 0);

    return { total, activos, enPrueba, porVencer, vencidos, mrrUSD, totalFacturadoCMS };
  }, [combinedSubscribers, cmsInvoices]);

  // Handler interno: Sumar o fijar tiempo de vigencia al cliente y sincronizar con su Portal /cms-cliente/:token
  const handleExtenderSuscripcion = async (sub, diasASumar, labelPeriodo, silent = false, esPruebaGratis = false) => {
    if (!silent) {
      setActionLoadingId(sub.id);
      setToastMsg('');
    }

    try {
      const now = Date.now();
      let baseMs = now;

      // Si es recarga pagada y el cliente ya tiene días vigentes, acumular sumando a su fecha actual
      if (!esPruebaGratis && sub.careVenceAt) {
        const currentEndMs = new Date(sub.careVenceAt).getTime();
        if (!isNaN(currentEndMs) && currentEndMs > now) {
          baseMs = currentEndMs;
        }
      }

      const newEndMs = baseMs + diasASumar * 86400000;
      const newVenceIso = new Date(newEndMs).toISOString();
      const nowStr = new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });

      const nuevoRegistroRecarga = {
        fecha: nowStr,
        periodo: labelPeriodo,
        dias: diasASumar,
        venceHasta: newVenceIso,
        esPruebaGratis,
        timestamp: Date.now()
      };

      const updatedPortalConfigBase = {
        dominio: sub.dominio,
        urlProduccion: sub.urlProduccion,
        fase5CareActivo: true,
        esMesDePrueba: Boolean(esPruebaGratis),
        careVenceAt: newVenceIso,
        fechaActivacionCare: nowStr,
        ultimaRecargaPeriodo: labelPeriodo,
        fechaUltimaRecarga: nowStr,
        cuentaAdminDelegada: 'sitesgoglite@gmail.com',
        delegacionGoogleActiva: true,
        faseActual: 5,
        progresoPorcentaje: 100
      };

      // 1. Actualizar en goglite_proyectos
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
          ...updatedPortalConfigBase,
          historialRecargas: [nuevoRegistroRecarga, ...historial]
        };

        const updatedProyecto = {
          ...targetProj,
          cmsSlug: sub.slug,
          dominio: sub.dominio,
          portalConfig: updatedPortalConfig
        };

        const nextProjs = [...allProjs];
        nextProjs[existingProjIdx] = updatedProyecto;
        saveStoredProyectos(nextProjs);
        setProyectos(nextProjs);

        if (targetProj.id) {
          await saveProyectoCloud(targetProj.id, updatedProyecto);
        }
      }

      // 2. Actualizar en localStorage goglite_cms_sites
      const localSites = JSON.parse(localStorage.getItem('goglite_cms_sites') || '[]');
      const updatedSites = localSites.map(s => {
        if (s.slug === sub.slug || s.slug === sub.portalToken) {
          const prevHist = Array.isArray(s.portalConfig?.historialRecargas) ? s.portalConfig.historialRecargas : [];
          return {
            ...s,
            portalConfig: {
              ...(s.portalConfig || {}),
              ...updatedPortalConfigBase,
              historialRecargas: [nuevoRegistroRecarga, ...prevHist]
            }
          };
        }
        return s;
      });
      localStorage.setItem('goglite_cms_sites', JSON.stringify(updatedSites));

      // 3. Sincronizar con Firestore Portal Cloud para que /cms-cliente/:token refleje el contador al instante
      const tokensToSync = Array.from(new Set([sub.portalToken, sub.slug].filter(Boolean)));
      for (const tk of tokensToSync) {
        try {
          await savePortalCloud(tk, {
            token: tk,
            cmsSlug: sub.slug,
            dominio: sub.dominio,
            cliente: {
              empresa: sub.empresa,
              contacto: sub.contacto,
              email: sub.email,
              telefono: sub.telefono,
              pais: sub.pais
            },
            portalConfig: updatedPortalConfigBase
          });
        } catch (e) {}
      }

      window.dispatchEvent(new CustomEvent('goglite_proyectos_synced'));
      const fechaFinalStr = new Date(newEndMs).toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
      if (!silent) {
        setToastMsg(`✓ Vigencia de ${sub.empresa} activada (+${labelPeriodo}). Vence el ${fechaFinalStr}.`);
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

  // Helper para crear y guardar la factura en Módulo 6 y Módulo 7 (Rentabilidad)
  const createAndPersistCmsInvoice = async ({
    targetSub,
    empresa,
    contacto,
    email,
    telefono,
    identificacion,
    pais,
    concepto,
    periodoLabel,
    diasVigencia,
    venceHasta,
    subtotal,
    impuestoPorcentaje,
    estadoCobro,
    metodoPago
  }) => {
    const subNum = Number(subtotal) || 0;
    const impPct = Number(impuestoPorcentaje) || 0;
    const impuestoTotal = Number(((subNum * impPct) / 100).toFixed(2));
    const total = Number((subNum + impuestoTotal).toFixed(2));
    const isPaid = estadoCobro === 'pagado';
    const montoCobrado = isPaid ? total : 0;
    const saldoPendiente = isPaid ? 0 : total;

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
      periodoMembresia: periodoLabel,
      diasActivados: Number(diasVigencia) || 30,
      venceHasta: venceHasta || null,
      cliente: {
        empresa: empresa || targetSub?.empresa || 'Cliente CMS',
        contacto: contacto || targetSub?.contacto || 'Administrador',
        email: email || targetSub?.email || '',
        telefono: telefono || targetSub?.telefono || '',
        identificacion: identificacion || targetSub?.identificacion || '',
        pais: pais || targetSub?.pais || 'DO'
      },
      concepto,
      fechaEmision: today,
      fechaVencimiento: due,
      subtotal: subNum,
      impuestoPorcentaje: impPct,
      impuestoTotal,
      total,
      moneda: 'USD',
      montoCobrado,
      saldoPendiente,
      metodoPago: metodoPago || 'Transferencia Bancaria',
      cuentaBancariaId: 'bank-1',
      horasInvertidasEstimadas: 2,
      items: [
        {
          id: 'item-cms-1',
          descripcion: concepto,
          cantidad: 1,
          precioUnitario: subNum,
          total: subNum
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
    return nuevaFactura;
  };

  // Abrir Modal de Confirmación cuando se hace clic en +1 Mes, +3 Meses, +6 Meses, +1 Año o 30d Prueba
  const handleRequestPlanConfirmation = (sub, planId, esPruebaGratis = false) => {
    if (esPruebaGratis) {
      const targetDateStr = new Date(Date.now() + 30 * 86400000).toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
      setConfirmPlanModal({
        sub,
        planId: 'prueba_30d',
        periodoLabel: '30 Días de Prueba Gratis',
        dias: 30,
        precio: 0,
        concepto: `Activación de Mes de Prueba Gratis (30 Días) · Portal Headless CMS (${sub.dominio})`,
        metodoPago: 'Cortesía Post-Entrega (Garantía 30 Días)',
        impuestoPorcentaje: 0,
        esPruebaGratis: true,
        fechaEstimadaVencimiento: targetDateStr
      });
      return;
    }

    const planObj = CMS_MEMBERSHIP_PLANS.find(p => p.id === planId) || CMS_MEMBERSHIP_PLANS[0];
    const customPrice = planId === 'mensual' && sub?.planMensual ? Number(sub.planMensual) : planObj.precio;

    const now = Date.now();
    let baseMs = now;
    if (!sub.esMesDePrueba && sub.careVenceAt) {
      const currentEnd = new Date(sub.careVenceAt).getTime();
      if (!isNaN(currentEnd) && currentEnd > now) baseMs = currentEnd;
    }
    const targetDateStr = new Date(baseMs + planObj.dias * 86400000).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });

    setConfirmPlanModal({
      sub,
      planId: planObj.id,
      periodoLabel: planObj.periodo,
      dias: planObj.dias,
      precio: customPrice,
      concepto: `${planObj.concepto} — Dominio: ${sub.dominio}`,
      metodoPago: 'Transferencia Bancaria',
      impuestoPorcentaje: 0,
      esPruebaGratis: false,
      fechaEstimadaVencimiento: targetDateStr
    });
  };

  // Confirmar en el Modal -> Activa la Suscripción y Genera la Factura para Entregar al Cliente
  const handleConfirmPlanAndGenerateInvoice = async (e) => {
    e.preventDefault();
    if (!confirmPlanModal || !confirmPlanModal.sub) return;

    const { sub, dias, periodoLabel, precio, concepto, metodoPago, impuestoPorcentaje, esPruebaGratis } = confirmPlanModal;
    setConfirmPlanModal(null);

    // 1. Extender / Activar vigencia en CMS y en el Portal del Cliente
    const vigenciaResult = await handleExtenderSuscripcion(sub, Number(dias), periodoLabel, true, esPruebaGratis);

    // 2. Si es un plan pagado (1, 3, 6 meses o 1 año), generar automáticamente la factura oficial y abrir el PDF para entregarla al cliente
    if (!esPruebaGratis) {
      const nuevaFactura = await createAndPersistCmsInvoice({
        targetSub: sub,
        empresa: sub.empresa,
        contacto: sub.contacto,
        email: sub.email,
        telefono: sub.telefono,
        identificacion: sub.identificacion,
        pais: sub.pais,
        concepto,
        periodoLabel,
        diasVigencia: dias,
        venceHasta: vigenciaResult?.fechaFinalStr,
        subtotal: precio,
        impuestoPorcentaje,
        estadoCobro: 'pagado',
        metodoPago
      });

      setSelectedInvoicePreview(nuevaFactura);
      setToastMsg(
        `✓ Plan de ${periodoLabel} activado para ${sub.empresa} y Factura ${nuevaFactura.numeroFactura} generada lista para entregar.`
      );
      setTimeout(() => setToastMsg(''), 6000);
    } else {
      setToastMsg(
        `✓ Reloj de 30 Días de Prueba Gratis activado para ${sub.empresa} (sincronizado con /cms-cliente/${sub.portalToken}).`
      );
      setTimeout(() => setToastMsg(''), 6000);
    }
  };

  // Guardar Configuración de Producción y Delegación Google (sitesgoglite@gmail.com) para proyectos como TurisRan
  const handleSaveSiteProductionConfig = async (e) => {
    e.preventDefault();
    if (!configSiteModal) return;

    const { sub, dominio, urlProduccion, emailClienteCms, telefono, planMensual, cuentaAdminDelegada } = configSiteModal;
    const cleanDomain = (dominio || sub.dominio)
      .replace(/^https?:\/\//, '')
      .replace(/\/$/, '')
      .trim();
    const cleanUrlProd = (urlProduccion || `https://${cleanDomain}`).trim();

    try {
      // 1. Actualizar en goglite_proyectos si existe
      const allProjs = getStoredProyectos();
      const idx = allProjs.findIndex(p => p.id === sub.id || p.portalToken === sub.portalToken || p.cmsSlug === sub.slug);
      if (idx !== -1) {
        const updatedProj = {
          ...allProjs[idx],
          cmsSlug: sub.slug,
          dominio: cleanDomain,
          cliente: {
            ...(allProjs[idx].cliente || {}),
            email: emailClienteCms,
            telefono
          },
          portalConfig: {
            ...(allProjs[idx].portalConfig || {}),
            dominio: cleanDomain,
            urlProduccion: cleanUrlProd,
            cuentaCmsSitioRegistrada: emailClienteCms,
            cuentaAdminDelegada: cuentaAdminDelegada || 'sitesgoglite@gmail.com',
            delegacionGoogleActiva: true,
            planMensual: Number(planMensual) || 99
          }
        };
        const nextProjs = [...allProjs];
        nextProjs[idx] = updatedProj;
        saveStoredProyectos(nextProjs);
        setProyectos(nextProjs);
        await saveProyectoCloud(updatedProj.id, updatedProj);
      }

      // 2. Actualizar en goglite_cms_sites y notificar al componente padre HeadlessCmsHubModule
      const localSites = JSON.parse(localStorage.getItem('goglite_cms_sites') || '[]');
      const siteExists = localSites.some(s => s.slug === sub.slug);
      let nextSites = [];

      if (siteExists) {
        nextSites = localSites.map(s => {
          if (s.slug === sub.slug) {
            return {
              ...s,
              dominio: cleanDomain,
              urlProduccion: cleanUrlProd,
              planMensual: Number(planMensual) || 99,
              cliente: {
                ...(s.cliente || {}),
                email: emailClienteCms,
                telefono
              },
              portalConfig: {
                ...(s.portalConfig || {}),
                dominio: cleanDomain,
                urlProduccion: cleanUrlProd,
                cuentaCmsSitioRegistrada: emailClienteCms,
                cuentaAdminDelegada: cuentaAdminDelegada || 'sitesgoglite@gmail.com',
                delegacionGoogleActiva: true,
                planMensual: Number(planMensual) || 99
              }
            };
          }
          return s;
        });
      } else {
        nextSites = [
          ...localSites,
          {
            id: sub.id,
            slug: sub.slug,
            nombre: sub.empresa,
            pais: sub.pais || 'DO',
            dominio: cleanDomain,
            urlProduccion: cleanUrlProd,
            estado: 'publicado',
            planMensual: Number(planMensual) || 99,
            portalConfig: {
              dominio: cleanDomain,
              urlProduccion: cleanUrlProd,
              cuentaCmsSitioRegistrada: emailClienteCms,
              cuentaAdminDelegada: cuentaAdminDelegada || 'sitesgoglite@gmail.com',
              delegacionGoogleActiva: true,
              planMensual: Number(planMensual) || 99,
              careVenceAt: sub.careVenceAt
            }
          }
        ];
      }

      localStorage.setItem('goglite_cms_sites', JSON.stringify(nextSites));
      if (typeof onUpdateSiteConfig === 'function') {
        onUpdateSiteConfig(sub.slug, {
          dominio: cleanDomain,
          urlProduccion: cleanUrlProd,
          planMensual: Number(planMensual) || 99,
          emailClienteCms,
          telefono
        });
      }

      // 3. Sincronizar con Firestore Portal y CMS Cloud
      await savePortalCloud(sub.portalToken, {
        token: sub.portalToken,
        cmsSlug: sub.slug,
        dominio: cleanDomain,
        portalConfig: {
          dominio: cleanDomain,
          urlProduccion: cleanUrlProd,
          cuentaCmsSitioRegistrada: emailClienteCms,
          cuentaAdminDelegada: cuentaAdminDelegada || 'sitesgoglite@gmail.com',
          delegacionGoogleActiva: true,
          careVenceAt: sub.careVenceAt,
          esMesDePrueba: sub.esMesDePrueba,
          fase5CareActivo: true
        }
      });

      await saveCmsSiteCloud(sub.slug, {
        slug: sub.slug,
        nombre: sub.empresa,
        dominio: cleanDomain,
        urlProduccion: cleanUrlProd,
        adminDelegadoGoogle: cuentaAdminDelegada || 'sitesgoglite@gmail.com'
      });

      window.dispatchEvent(new CustomEvent('goglite_proyectos_synced'));
      setConfigSiteModal(null);
      setToastMsg(
        `✓ Sitio en producción (${cleanDomain}) y delegación a ${cuentaAdminDelegada || 'sitesgoglite@gmail.com'} actualizados para ${sub.empresa}.`
      );
      setTimeout(() => setToastMsg(''), 5000);
    } catch (err) {
      console.error('Error guardando configuración de producción:', err);
    }
  };

  // Abrir Modal Nativo Completo de Factura
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

  const handleEmitirFacturaYActivar = async (e) => {
    e.preventDefault();
    if (!invoiceForm.empresa.trim()) return;

    const targetSub = combinedSubscribers.find(s => s.id === invoiceForm.subId);
    let vigenciaResult = null;
    if (invoiceForm.activarMembresia && targetSub && Number(invoiceForm.diasVigencia) > 0) {
      vigenciaResult = await handleExtenderSuscripcion(
        targetSub,
        Number(invoiceForm.diasVigencia),
        invoiceForm.periodoLabel || `${invoiceForm.diasVigencia} Días`,
        true,
        false
      );
    }

    const nuevaFactura = await createAndPersistCmsInvoice({
      targetSub,
      empresa: invoiceForm.empresa,
      contacto: invoiceForm.contacto,
      email: invoiceForm.email,
      telefono: invoiceForm.telefono,
      identificacion: invoiceForm.identificacion,
      pais: invoiceForm.pais,
      concepto: invoiceForm.concepto,
      periodoLabel: invoiceForm.periodoLabel,
      diasVigencia: invoiceForm.diasVigencia,
      venceHasta: vigenciaResult?.fechaFinalStr,
      subtotal: invoiceForm.subtotal,
      impuestoPorcentaje: invoiceForm.impuestoPorcentaje,
      estadoCobro: invoiceForm.estadoCobro,
      metodoPago: invoiceForm.metodoPago
    });

    setShowInvoiceModal(false);
    setSelectedInvoicePreview(nuevaFactura);

    setToastMsg(
      `✓ Factura ${nuevaFactura.numeroFactura} emitida ($${Number(nuevaFactura.total).toFixed(2)} USD), membresía activada (+${invoiceForm.periodoLabel}) y sincronizada con el Módulo 7.`
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

      {/* KPI Cards: Resumen de Suscripciones, Mes de Prueba, MRR y Facturación CMS */}
      <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
        <div className="p-4 rounded-2xl bg-[#0e1320] border border-slate-800 shadow-md">
          <div className="text-[10px] font-mono text-slate-400 uppercase font-semibold">Total Clientes CMS</div>
          <div className="text-2xl font-black text-white font-mono mt-1">{metrics.total}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Sitios en producción</div>
        </div>

        <div className="p-4 rounded-2xl bg-[#0e1320] border border-amber-500/30 shadow-md">
          <div className="text-[10px] font-mono text-amber-300 uppercase font-semibold flex items-center gap-1">
            <Gift className="w-3.5 h-3.5 text-amber-400" />
            <span>En Mes de Prueba</span>
          </div>
          <div className="text-2xl font-black text-amber-300 font-mono mt-1">{metrics.enPrueba}</div>
          <div className="text-[10px] text-amber-400/80 mt-0.5">Reloj 30d → 0d activo</div>
        </div>

        <div className="p-4 rounded-2xl bg-[#0e1320] border border-emerald-500/30 shadow-md">
          <div className="text-[10px] font-mono text-emerald-400 uppercase font-semibold flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            <span>Suscripción Pagada</span>
          </div>
          <div className="text-2xl font-black text-emerald-400 font-mono mt-1">{metrics.activos}</div>
          <div className="text-[10px] text-emerald-500/80 mt-0.5">Membresía al día</div>
        </div>

        <div className="p-4 rounded-2xl bg-[#0e1320] border border-rose-500/30 shadow-md">
          <div className="text-[10px] font-mono text-rose-400 uppercase font-semibold">Vencidas (0d)</div>
          <div className="text-2xl font-black text-rose-400 font-mono mt-1">{metrics.vencidos}</div>
          <div className="text-[10px] text-rose-500/80 mt-0.5">CMS bloqueado al cliente</div>
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
              { id: 'prueba', label: '🎁 Mes de Prueba (30d)' },
              { id: 'activos', label: '💎 Pagados' },
              { id: 'por_vencer', label: '⚠️ Por Vencer' },
              { id: 'vencidos', label: '⛔ Vencidos' }
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
              <span>Integrar Sitio en Producción</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => handleOpenNativeInvoiceModal(combinedSubscribers[0], 'mensual')}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-orange-950/50 transition-all"
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>💳 Emitir Factura Libre / Plan</span>
          </button>
        </div>
      </div>

      {/* Grid de Suscriptores / Fichas de Clientes */}
      {filteredSubscribers.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-[#0e1320] border border-slate-800 space-y-3">
          <Users className="w-10 h-10 text-slate-600 mx-auto" />
          <h4 className="text-sm font-bold text-slate-300">No se encontraron clientes en esta categoría</h4>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Usa el botón <strong>"Integrar Sitio en Producción"</strong> para dar de alta cualquier proyecto anterior ya terminado sin pasar por los Módulos 1 al 5.
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
                  
                  {/* Info Cliente, Reloj 30d/Suscripción & Delegación sitesgoglite@gmail.com */}
                  <div className="flex items-start gap-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500/20 to-orange-500/20 border border-purple-500/30 flex items-center justify-center font-black text-white text-base shrink-0">
                      {sub.empresa[0]?.toUpperCase() || 'C'}
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-sm font-extrabold text-white">{sub.empresa}</h4>
                        <span className="text-xs">{sub.pais === 'DO' ? '🇩🇴' : sub.pais === 'US' ? '🇺🇸' : '🇸🇻'}</span>
                        
                        {/* Estado Badge: Distingue Mes de Prueba (30d -> 0d) vs Membresía Pagada vs Vencido */}
                        <span className={`text-[10px] font-mono px-2.5 py-0.5 rounded-full font-bold uppercase flex items-center gap-1 ${
                          sub.stats.estado === 'vencido'
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            : sub.esMesDePrueba
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                            : sub.stats.estado === 'por_vencer'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        }`}>
                          <Clock className="w-3 h-3" />
                          <span>{sub.stats.label}</span>
                        </span>

                        {/* Badge de Delegación Google Admin */}
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-300 border border-blue-500/30">
                          🔗 Admin Delegado: {sub.cuentaAdminDelegada}
                        </span>

                        {isCurrentlySelected && (
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40 font-bold">
                            🎯 Activo en Hub
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3 text-xs text-slate-400 flex-wrap">
                        <a
                          href={sub.urlProduccion || `https://${sub.dominio}`}
                          target="_blank"
                          rel="noreferrer"
                          className="hover:text-purple-300 flex items-center gap-1 font-mono text-[11px] text-emerald-400 font-bold"
                        >
                          <Globe className="w-3.5 h-3.5" />
                          <span>{sub.dominio}</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                        <span className="text-slate-600">·</span>
                        <span>Contacto: <strong className="text-slate-300">{sub.contacto}</strong></span>
                        {sub.email && (
                          <>
                            <span className="text-slate-600">·</span>
                            <span className="font-mono text-[11px] text-sky-300">Acceso CMS: {sub.email}</span>
                          </>
                        )}
                      </div>

                      {/* Contador Regresivo Exacto y Fecha de Corte Sincronizada con el Portal del Cliente */}
                      <div className="pt-0.5 flex items-center gap-2 text-xs flex-wrap">
                        {formattedVence ? (
                          <span className="text-[11px] font-mono text-slate-300">
                            {sub.esMesDePrueba ? 'Fin de los 30 días de prueba:' : 'Vigencia pagada hasta:'}{' '}
                            <strong className="text-purple-300">{formattedVence}</strong>{' '}
                            {sub.stats.estado !== 'vencido' && (
                              <span className="text-emerald-400 font-bold">
                                (Quedan {sub.stats.dias} días y {sub.stats.horas} horas en /cms-cliente/{sub.portalToken})
                              </span>
                            )}
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-500 italic">Sin fecha de corte registrada</span>
                        )}
                      </div>

                      {/* Barra de Salto Directo a las 3 Herramientas + Configuración de URL en Producción */}
                      <div className="pt-1.5 flex flex-wrap items-center gap-1.5">
                        {typeof onSelectSiteInHub === 'function' && (
                          <>
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
                          </>
                        )}

                        <button
                          type="button"
                          onClick={() =>
                            setConfigSiteModal({
                              sub,
                              dominio: sub.dominio,
                              urlProduccion: sub.urlProduccion || `https://${sub.dominio}`,
                              emailClienteCms: sub.email || '',
                              telefono: sub.telefono || '',
                              planMensual: sub.planMensual || 99,
                              cuentaAdminDelegada: sub.cuentaAdminDelegada || 'sitesgoglite@gmail.com'
                            })
                          }
                          className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-[11px] font-semibold flex items-center gap-1 transition-all"
                          title="Configurar URL real en producción y delegación de sitesgoglite@gmail.com sin pasar por Módulos 1-5"
                        >
                          <Settings className="w-3 h-3 text-purple-400" />
                          <span>⚙️ URL Producción &amp; Delegación Google</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Acciones de Activación con Confirmación Anti-Error y Generación Automática de Factura */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shrink-0">
                    
                    <div className="p-2.5 rounded-xl bg-[#131926] border border-slate-800 space-y-1.5">
                      <span className="text-[9px] font-mono uppercase text-slate-400 font-bold block text-center sm:text-left">
                        Activar Plan (Con Confirmación + Factura Automática):
                      </span>
                      <div className="grid grid-cols-5 gap-1.5">
                        <button
                          type="button"
                          disabled={isProcessing}
                          onClick={() => handleRequestPlanConfirmation(sub, 'prueba_30d', true)}
                          title="Iniciar o reiniciar reloj de 30 días de prueba gratis ($0)"
                          className="px-2 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 text-[11px] font-bold font-mono transition-all disabled:opacity-50 text-center"
                        >
                          🎁 30d Prueba
                        </button>
                        <button
                          type="button"
                          disabled={isProcessing}
                          onClick={() => handleRequestPlanConfirmation(sub, 'mensual', false)}
                          title="Confirmar activación de 1 Mes (+30 días) y generar factura"
                          className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-purple-600/30 text-purple-300 border border-slate-700/80 hover:border-purple-500/50 text-xs font-bold font-mono transition-all disabled:opacity-50 text-center"
                        >
                          +1 Mes
                        </button>
                        <button
                          type="button"
                          disabled={isProcessing}
                          onClick={() => handleRequestPlanConfirmation(sub, 'trimestral', false)}
                          title="Confirmar activación de 3 Meses (+90 días) y generar factura"
                          className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-purple-600/30 text-purple-300 border border-slate-700/80 hover:border-purple-500/50 text-xs font-bold font-mono transition-all disabled:opacity-50 text-center"
                        >
                          +3 Meses
                        </button>
                        <button
                          type="button"
                          disabled={isProcessing}
                          onClick={() => handleRequestPlanConfirmation(sub, 'semestral', false)}
                          title="Confirmar activación de 6 Meses (+180 días) y generar factura"
                          className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-purple-600/30 text-purple-300 border border-slate-700/80 hover:border-purple-500/50 text-xs font-bold font-mono transition-all disabled:opacity-50 text-center"
                        >
                          +6 Meses
                        </button>
                        <button
                          type="button"
                          disabled={isProcessing}
                          onClick={() => handleRequestPlanConfirmation(sub, 'anual', false)}
                          title="Confirmar activación de 1 Año VIP (+365 días) y generar factura"
                          className="px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-orange-600/30 to-amber-600/30 hover:from-orange-600 hover:to-amber-600 text-amber-300 hover:text-white border border-amber-500/40 text-xs font-bold font-mono transition-all disabled:opacity-50 text-center"
                        >
                          +1 Año
                        </button>
                      </div>
                    </div>

                    {/* Enlaces de Acceso al Portal del Cliente y Facturación Libre */}
                    <div className="flex sm:flex-col gap-1.5 justify-center">
                      <a
                        href={`/cms-cliente/${sub.portalToken}`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex-1 sm:flex-none px-3 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow transition-all"
                        title="Abrir el Portal CMS Todo-en-Uno que ve el cliente"
                      >
                        <Sliders className="w-3.5 h-3.5" />
                        <span>Portal Cliente</span>
                      </a>

                      <button
                        type="button"
                        onClick={() => handleOpenNativeInvoiceModal(sub, 'mensual')}
                        className="flex-1 sm:flex-none px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-orange-300 hover:text-white font-bold text-xs flex items-center justify-center gap-1.5 border border-slate-700 transition-all"
                        title="Abrir facturador detallado para este cliente"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>Factura Libre</span>
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
                Cada plan confirmado genera su factura entregable al cliente y se contabiliza automáticamente en el P&amp;L financiero.
              </p>
            </div>
          </div>
        </div>

        {cmsInvoices.length === 0 ? (
          <div className="p-6 text-center rounded-xl bg-[#131926] border border-slate-800/80 text-xs text-slate-400">
            Aún no se han emitido facturas de membresía desde el Headless CMS. Haz clic en <strong>+1 Mes, +3 Meses, +6 Meses o +1 Año</strong> en cualquier cliente para confirmar la activación y generar su factura.
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
                          <span>Ver / Entregar Factura</span>
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

      {/* ========================================================================= */}
      {/* MODAL 1: CONFIRMACIÓN DE SEGURIDAD AL PULSAR +1M, +3M, +6M, +1A O 30D     */}
      {/* ========================================================================= */}
      {confirmPlanModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0e1320] border-2 border-purple-500/50 rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between gap-3 border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-300 shrink-0">
                  <AlertTriangle className="w-6 h-6 text-amber-400" />
                </div>
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-amber-400 font-bold block">
                    Confirmación de Activación de Membresía
                  </span>
                  <h3 className="text-base font-black text-white">
                    ¿Confirmas activar el plan de {confirmPlanModal.periodoLabel}?
                  </h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setConfirmPlanModal(null)}
                className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmPlanAndGenerateInvoice} className="space-y-4">
              <div className="p-4 rounded-xl bg-[#131926] border border-slate-800 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Cliente / Sitio:</span>
                  <strong className="text-white">{confirmPlanModal.sub.empresa} ({confirmPlanModal.sub.dominio})</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Días a sumar al reloj del CMS:</span>
                  <strong className="text-emerald-400 font-mono">+{confirmPlanModal.dias} días ({confirmPlanModal.periodoLabel})</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Nueva fecha de vencimiento:</span>
                  <strong className="text-purple-300 font-mono">{confirmPlanModal.fechaEstimadaVencimiento}</strong>
                </div>
              </div>

              {!confirmPlanModal.esPruebaGratis ? (
                <div className="space-y-3 p-4 rounded-xl bg-orange-950/20 border border-orange-500/30">
                  <div className="text-xs font-bold text-orange-300 flex items-center gap-1.5">
                    <FileText className="w-4 h-4" />
                    <span>Datos de la Factura que se generará automáticamente para el cliente:</span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-mono text-slate-400 mb-1">Monto a Facturar ($ USD)</label>
                      <input
                        type="number"
                        step="0.01"
                        required
                        value={confirmPlanModal.precio}
                        onChange={(e) => setConfirmPlanModal({ ...confirmPlanModal, precio: e.target.value })}
                        className="w-full bg-[#0a0d14] border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white font-mono font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono text-slate-400 mb-1">Método de Pago Recibido</label>
                      <select
                        value={confirmPlanModal.metodoPago}
                        onChange={(e) => setConfirmPlanModal({ ...confirmPlanModal, metodoPago: e.target.value })}
                        className="w-full bg-[#0a0d14] border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                      >
                        <option value="Transferencia Bancaria">Transferencia Bancaria</option>
                        <option value="Tarjeta / PayPal / Stripe">Tarjeta / PayPal / Stripe</option>
                        <option value="Efectivo / Depósito">Efectivo / Depósito</option>
                      </select>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-300 leading-relaxed">
                  Se activará el contador regresivo de <strong>30 días de prueba gratis (30d → 0d)</strong> sincronizado con el portal del cliente (<code className="text-amber-300 font-mono">/cms-cliente/{confirmPlanModal.sub.portalToken}</code>).
                </p>
              )}

              <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setConfirmPlanModal(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                >
                  No, Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-emerald-950"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>
                    {confirmPlanModal.esPruebaGratis
                      ? 'Sí, Iniciar 30 Días de Prueba'
                      : 'Sí, Activar Plan y Generar Factura'}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: CONFIGURAR SITIO EN PRODUCCIÓN Y DELEGACIÓN SITESGOGLITE@GMAIL   */}
      {/* ========================================================================= */}
      {configSiteModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#0e1320] border border-purple-500/40 rounded-2xl max-w-xl w-full p-6 space-y-5 shadow-2xl my-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-300">
                  <Settings className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">
                    Configurar Sitio en Producción: {configSiteModal.sub.empresa}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Conecta un proyecto ya terminado directamente al Headless CMS sin pasar por los Módulos 1–5.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setConfigSiteModal(null)}
                className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveSiteProductionConfig} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1 font-semibold">Dominio Oficial *</label>
                  <input
                    type="text"
                    required
                    value={configSiteModal.dominio}
                    onChange={(e) =>
                      setConfigSiteModal({
                        ...configSiteModal,
                        dominio: e.target.value,
                        urlProduccion: `https://${e.target.value.replace(/^https?:\/\//, '')}`
                      })
                    }
                    placeholder="Ej. turisran.com"
                    className="w-full bg-[#131926] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1 font-semibold">URL Exacta en Producción *</label>
                  <input
                    type="text"
                    required
                    value={configSiteModal.urlProduccion}
                    onChange={(e) => setConfigSiteModal({ ...configSiteModal, urlProduccion: e.target.value })}
                    placeholder="https://turisran.com"
                    className="w-full bg-[#131926] border border-slate-700 rounded-xl px-3 py-2 text-xs text-emerald-400 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Correo Google del Cliente (Acceso a su CMS)</label>
                  <input
                    type="email"
                    value={configSiteModal.emailClienteCms}
                    onChange={(e) => setConfigSiteModal({ ...configSiteModal, emailClienteCms: e.target.value })}
                    placeholder="cliente@empresa.com"
                    className="w-full bg-[#131926] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">WhatsApp del Cliente</label>
                  <input
                    type="text"
                    value={configSiteModal.telefono}
                    onChange={(e) => setConfigSiteModal({ ...configSiteModal, telefono: e.target.value })}
                    placeholder="+1 809..."
                    className="w-full bg-[#131926] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono"
                  />
                </div>
              </div>

              {/* Bloque de Delegación de Administrador a sitesgoglite@gmail.com */}
              <div className="p-4 rounded-xl bg-blue-950/20 border border-blue-500/30 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-blue-300 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-blue-400" />
                    <span>Cuenta Administradora Delegada (Sin pedir contraseñas al cliente)</span>
                  </span>
                  <span className="text-[10px] font-mono bg-emerald-500/15 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/30">
                    sitesgoglite@gmail.com
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  El cliente agrega a <strong>sitesgoglite@gmail.com</strong> como Administrador en su <em>Ficha de Google Business</em>, <em>Search Console</em> y <em>Google Analytics</em>. Así el CMS le inyecta y muestra toda su información en <code className="text-purple-300 font-mono">/cms-cliente/{configSiteModal.sub.portalToken}</code> mientras su membresía esté activa.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    const msg = `Hola ${configSiteModal.sub.empresa}! Para activar tu Portal Todo-en-Uno (${window.location.origin}/cms-cliente/${configSiteModal.sub.portalToken}) sin que tengas que compartir ninguna contraseña, por favor agrega a nuestra cuenta técnica *sitesgoglite@gmail.com* como Administrador en:\n1. Tu Ficha de Google Maps (Personas y accesos -> Agregar -> sitesgoglite@gmail.com)\n2. Google Search Console y Analytics.`;
                    navigator.clipboard.writeText(msg);
                    setCopiedDelegationMsg(true);
                    setTimeout(() => setCopiedDelegationMsg(false), 2500);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-blue-600/30 hover:bg-blue-600/50 text-blue-200 border border-blue-500/40 text-xs font-bold flex items-center gap-1.5"
                >
                  {copiedDelegationMsg ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedDelegationMsg ? '¡Instrucciones Copiadas!' : 'Copiar Instrucciones para el Cliente'}</span>
                </button>
              </div>

              <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setConfigSiteModal(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-lg shadow-purple-950"
                >
                  Guardar Vinculación de Producción
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: FACTURADOR DETALLADO / LIBRE Y ACTIVACIÓN DE MEMBRESÍA CMS */}
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

      {/* MODAL 4: VISTA PREVIA E IMPRESIÓN PDF DE LA FACTURA PARA ENTREGAR AL CLIENTE */}
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
                    <span>Entregar por WhatsApp</span>
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
