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
  Globe
} from 'lucide-react';
import { getStoredProyectos, saveStoredProyectos } from '../../services/contractGenerator';
import { saveProyectoCloud, savePortalCloud } from '../../services/firestoreSyncService';

/**
 * Vista Centralizada de Gestión de Suscriptores & Clientes Activos del Headless CMS
 * Permite a la agencia activar y acumular vigencia (+1 mes, +3 meses, +6 meses, +1 año)
 * de forma directa e intuitiva con un solo clic una vez recibido el pago.
 */
export default function AdminCmsSubscriptionsHubView({ sites = [], onOpenInvoiceModal }) {
  const [proyectos, setProyectos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [toastMsg, setToastMsg] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('todos'); // 'todos' | 'activos' | 'por_vencer' | 'vencidos'

  // Cargar proyectos de la plataforma
  const loadData = () => {
    try {
      setLoading(true);
      const stored = getStoredProyectos();
      setProyectos(Array.isArray(stored) ? stored : []);
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
    return () => window.removeEventListener('goglite_proyectos_synced', handleSync);
  }, []);

  // Consolidar suscriptores: Proyectos formales + Sitios CMS que no tengan proyecto
  const combinedSubscribers = useMemo(() => {
    const list = [];
    const seenSlugs = new Set();

    // 1. Añadir desde proyectos existentes
    proyectos.forEach(proj => {
      const empresa = proj.cliente?.empresa || proj.lead?.empresa || 'Cliente VIP';
      const slug = (proj.cliente?.empresa || proj.id || '').toLowerCase().replace(/\s+/g, '-');
      seenSlugs.add(slug);

      const portalConfig = proj.portalConfig || {};
      const careVenceAt = portalConfig.careVenceAt || null;
      const stats = computeRemainingStats(careVenceAt);

      list.push({
        id: proj.id,
        tipo: 'proyecto',
        proyectoRef: proj,
        empresa,
        contacto: proj.cliente?.contacto || proj.lead?.contacto || 'Administrador',
        email: proj.cliente?.email || proj.lead?.email || '',
        telefono: proj.cliente?.telefono || proj.lead?.telefono || '',
        pais: proj.cliente?.pais || proj.lead?.pais || proj.pais || 'DO',
        dominio: proj.dominio || portalConfig.dominio || `${empresa.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`,
        portalToken: proj.portalToken || proj.presupuestoId || proj.id,
        careVenceAt,
        fase5CareActivo: Boolean(portalConfig.fase5CareActivo),
        ultimaRecargaPeriodo: portalConfig.ultimaRecargaPeriodo || null,
        fechaUltimaRecarga: portalConfig.fechaUltimaRecarga || null,
        historialRecargas: portalConfig.historialRecargas || [],
        stats
      });
    });

    // 2. Añadir sitios CMS huérfanos (si existen en el Hub CMS)
    sites.forEach(site => {
      const slug = site.slug || site.id;
      if (seenSlugs.has(slug)) return;

      const portalConfig = site.portalConfig || {};
      const careVenceAt = portalConfig.careVenceAt || null;
      const stats = computeRemainingStats(careVenceAt);

      list.push({
        id: 'site-' + slug,
        tipo: 'site',
        siteRef: site,
        empresa: site.nombre || site.contenido?.branding?.nombreMarca || 'Sitio CMS',
        contacto: 'Webmaster',
        email: '',
        telefono: site.contenido?.branding?.telefonoWhatsApp || '',
        pais: site.pais || 'SV',
        dominio: site.dominio || `${slug}.com`,
        portalToken: slug,
        careVenceAt,
        fase5CareActivo: Boolean(portalConfig.fase5CareActivo),
        ultimaRecargaPeriodo: portalConfig.ultimaRecargaPeriodo || null,
        fechaUltimaRecarga: portalConfig.fechaUltimaRecarga || null,
        historialRecargas: portalConfig.historialRecargas || [],
        stats
      });
    });

    return list;
  }, [proyectos, sites]);

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
    // MRR base estimado: $99 USD por cliente activo/por vencer
    const mrrUSD = (activos + porVencer) * 99;

    return { total, activos, porVencer, vencidos, mrrUSD };
  }, [combinedSubscribers]);

  // Handler: Sumar tiempo de vigencia de forma acumulativa al cliente
  const handleExtenderSuscripcion = async (sub, diasASumar, labelPeriodo) => {
    setActionLoadingId(sub.id);
    setToastMsg('');

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

      if (sub.tipo === 'proyecto' && sub.proyectoRef) {
        const currentConfig = sub.proyectoRef.portalConfig || {};
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
          ...sub.proyectoRef,
          portalConfig: updatedPortalConfig
        };

        // Guardar en goglite_proyectos local
        const allProjs = getStoredProyectos();
        const nextProjs = allProjs.map(p => p.id === sub.id ? updatedProyecto : p);
        saveStoredProyectos(nextProjs);
        setProyectos(nextProjs);

        // Guardar en Firestore Cloud
        if (sub.proyectoRef.id) {
          await saveProyectoCloud(sub.proyectoRef.id, updatedProyecto);
        }
        if (sub.portalToken) {
          await savePortalCloud(sub.portalToken, {
            token: sub.portalToken,
            portalConfig: updatedPortalConfig
          });
        }
      } else if (sub.tipo === 'site') {
        // Actualizar en localStorage goglite_cms_sites
        const localSites = JSON.parse(localStorage.getItem('goglite_cms_sites') || '[]');
        const updatedSites = localSites.map(s => {
          if (s.slug === sub.portalToken) {
            return {
              ...s,
              portalConfig: {
                ...(s.portalConfig || {}),
                fase5CareActivo: true,
                careVenceAt: newVenceIso,
                ultimaRecargaPeriodo: labelPeriodo,
                fechaUltimaRecarga: nowStr
              }
            };
          }
          return s;
        });
        localStorage.setItem('goglite_cms_sites', JSON.stringify(updatedSites));
      }

      window.dispatchEvent(new CustomEvent('goglite_proyectos_synced'));
      const fechaFinalStr = new Date(newEndMs).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
      setToastMsg(`✓ Suscripción de ${sub.empresa} extendida +${labelPeriodo}. Vence el ${fechaFinalStr}.`);
      setTimeout(() => setToastMsg(''), 5000);
    } catch (err) {
      console.error('Error extendiendo membresía CMS:', err);
      setToastMsg(`Error al extender suscripción: ${err.message}`);
    } finally {
      setActionLoadingId(null);
    }
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

      {/* KPI Cards: Resumen de Suscripciones & Retainers */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
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
          <div className="text-[10px] text-rose-500/80 mt-0.5">Modo lectura o pausado</div>
        </div>

        <div className="col-span-2 sm:col-span-1 p-4 rounded-2xl bg-gradient-to-br from-[#12192b] to-[#1a152d] border border-purple-500/40 shadow-md">
          <div className="text-[10px] font-mono text-purple-300 uppercase font-semibold flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            <span>MRR Estimado</span>
          </div>
          <div className="text-2xl font-black text-purple-300 font-mono mt-1">${metrics.mrrUSD} <span className="text-xs font-normal">USD/m</span></div>
          <div className="text-[10px] text-purple-400/80 mt-0.5">Retainers recurrentes</div>
        </div>
      </div>

      {/* Control Bar: Búsqueda, Filtro y Acción Rápida */}
      <div className="p-4 rounded-2xl bg-[#0e1320] border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
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
      </div>

      {/* Grid de Suscriptores / Fichas de Clientes */}
      {filteredSubscribers.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-[#0e1320] border border-slate-800 space-y-3">
          <Users className="w-10 h-10 text-slate-600 mx-auto" />
          <h4 className="text-sm font-bold text-slate-300">No se encontraron clientes con suscripción CMS</h4>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            {searchQuery
              ? 'No hay resultados que coincidan con tu búsqueda.'
              : 'Cuando tus clientes aprueben proyectos o registres sitios en el Headless CMS, aparecerán aquí para gestionar sus renovaciones mensuales o anuales.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredSubscribers.map(sub => {
            const isProcessing = actionLoadingId === sub.id;
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
                  sub.stats.estado === 'activo'
                    ? 'border-emerald-500/20'
                    : sub.stats.estado === 'por_vencer'
                    ? 'border-amber-500/40 bg-gradient-to-r from-[#14120e] to-[#0e1320]'
                    : 'border-slate-800'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  
                  {/* Info Cliente & Dominio */}
                  <div className="flex items-start gap-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500/20 to-orange-500/20 border border-purple-500/30 flex items-center justify-center font-black text-white text-base shrink-0">
                      {sub.empresa[0]?.toUpperCase() || 'C'}
                    </div>

                    <div className="space-y-1">
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
                      <div className="pt-1 flex items-center gap-2 text-xs flex-wrap">
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
                    </div>
                  </div>

                  {/* Acciones Rápidas: CMS del Cliente & Botones de Activación de Pago */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shrink-0">
                    
                    {/* Botonera de 1-Clic: Activar +1M, +3M, +6M, +1A */}
                    <div className="p-2 rounded-xl bg-[#131926] border border-slate-800 space-y-1.5">
                      <span className="text-[9px] font-mono uppercase text-slate-400 font-bold block text-center sm:text-left">
                        Activar Pago Recibido (Acumulativo):
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

                    {/* Enlaces de Acceso y Facturación */}
                    <div className="flex sm:flex-col gap-1.5 justify-center">
                      <a
                        href={`/cms-cliente/${sub.portalToken}`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex-1 sm:flex-none px-3 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow transition-all"
                        title="Abrir Panel CMS en modo cliente"
                      >
                        <Sliders className="w-3.5 h-3.5" />
                        <span>Abrir CMS</span>
                      </a>

                      {typeof onOpenInvoiceModal === 'function' && (
                        <button
                          type="button"
                          onClick={() => onOpenInvoiceModal(sub)}
                          className="flex-1 sm:flex-none px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-semibold text-xs flex items-center justify-center gap-1.5 border border-slate-700 transition-all"
                          title="Emitir factura libre de retainer para este cliente"
                        >
                          <FileText className="w-3.5 h-3.5 text-orange-400" />
                          <span>Factura</span>
                        </button>
                      )}
                    </div>

                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
