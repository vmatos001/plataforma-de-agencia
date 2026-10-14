import React, { useState, useEffect } from 'react';
import {
  FileText,
  Plus,
  Copy,
  Printer,
  CheckCircle2,
  XCircle,
  Clock,
  Send,
  ExternalLink,
  ChevronRight,
  ArrowLeft,
  Trash2,
  DollarSign,
  Calendar,
  Building,
  User,
  Phone,
  Mail,
  Shield,
  Layers,
  Sparkles,
  Check,
  Save,
  BookmarkPlus,
  Eye,
  Sliders,
  TrendingDown
} from 'lucide-react';

const DEFAULT_VIP_TEMPLATE = {
  titulo: "PROPUESTA DE DESARROLLO DIGITAL VIP",
  subtitulo: "(SISTEMA INTEGRAL WEB, PLAN GOOGLE ADS, REPUTACIÓN LOCAL & CÓDIGOS QR)",
  vigenciaDias: 15,
  moneda: "USD",
  simboloMoneda: "$",
  pais: "SV",
  emisor: {
    empresa: "Goglite",
    ubicacion: "Santa Ana, El Salvador · Santo Domingo, RD",
    telefono: "(503) 7756-9828",
    email: "info@goglite.com",
    responsable: "Víctor Matos",
    cargo: "Director & Estratega Digital"
  },
  portada: {
    proyecto: "Implementación de un Sistema Digital Integral de Captación Inmediata y Posicionamiento Comercial, transformando su presencia digital en un activo que genera clientes y contactos de alta intención las 24 horas del día.",
    enfoqueEstrategico: "Arquitectura orientada a la conversión directa con botones de llamada instantánea (Click-to-Call), botón flotante de WhatsApp Business y embudo de respuesta inmediata.",
    tecnologiaMobileFirst: "Arquitectura ultra-rápida optimizada al 100% para teléfonos inteligentes (velocidad de carga inferior a 1.2 segundos y Core Web Vitals en verde).",
    geoSeoLocal: "Estructura semántica avanzada (Schema.org LocalBusiness) para asegurar máxima visibilidad en Google Maps, buscadores y motores de IA (ChatGPT / Perplexity)."
  },
  modulos: [
    {
      id: "mod-1",
      numero: "MÓDULO 1",
      titulo: "Plataforma Web Corporativa de Alta Conversión (Mobile-First)",
      descripcion: "Arquitectura responsive optimizada al 100% para dispositivos móviles. Incluye secciones estratégicas StoryBrand, catálogo de servicios, cobertura y llamado a la acción.",
      tipo: "precio_cerrado",
      horas: 10,
      precio: 150
    },
    {
      id: "mod-2",
      numero: "MÓDULO 2",
      titulo: "Canales de Cierre y Contacto Directo (WhatsApp & Click-to-Call)",
      descripcion: "Integración de botón flotante inteligente de WhatsApp Business con mensaje preconfigurado y marcado directo de un solo toque.",
      tipo: "precio_cerrado",
      horas: 3,
      precio: 50
    },
    {
      id: "mod-3",
      numero: "MÓDULO 3",
      titulo: "Optimización del Perfil de Google Negocio & SEO/GEO Local",
      descripcion: "Configuración técnica de Schema.org JSON-LD, categorización en Google Maps y ecosistema de códigos QR para captación de reseñas 5 estrellas.",
      tipo: "precio_cerrado",
      horas: 5,
      precio: 50
    }
  ],
  fases: [
    {
      fase: "Fase 1",
      plazo: "Días 1 a 4",
      detalle: "Configuración de activos digitales, arquitectura de información StoryBrand, ficha de Google Maps y códigos QR vectoriales."
    },
    {
      fase: "Fase 2",
      plazo: "Días 5 a 10",
      detalle: "Desarrollo de la plataforma web Mobile-First, integración de canales de cierre en WhatsApp y optimización SEO/GEO."
    },
    {
      fase: "Fase 3",
      plazo: "Días 11 a 15",
      detalle: "Auditoría de velocidad móvil, revisión conjunta con el cliente, ajustes finales y despliegue en producción."
    }
  ],
  inversion: {
    precioMercadoReferencial: 750,
    precioTotal: 250,
    descuentoEspecial: 500,
    anticipo: 125,
    contraEntrega: 125,
    beneficioExclusivo: "1 mes de soporte técnico, supervisión y acompañamiento gratuito tras el lanzamiento oficial.",
    revisiones: "Dos (2) rondas completas de ajustes de diseño y contenido.",
    requisitosInicio: "Logotipo, fotografías del negocio/servicios, número oficial de WhatsApp y datos de contacto."
  }
};

export default function PresupuestosModule({
  selectedCountry = 'SV',
  leadToConvert,
  onClearLeadConvert,
  onNavigateToContratos,
  onNavigateToRentabilidad
}) {
  const [presupuestos, setPresupuestos] = useState([]);
  const [plantillas, setPlantillas] = useState([]);
  const [loading, setLoading] = useState(true);

  // Mode: 'list' | 'editor' | 'preview_client'
  const [viewMode, setViewMode] = useState('list');
  const [activePresupuesto, setActivePresupuesto] = useState(null);
  const [editorTab, setEditorTab] = useState('portada'); // 'portada' | 'modulos' | 'fases' | 'inversion'

  const [filterStatus, setFilterStatus] = useState('todos');
  const [copiedLink, setCopiedLink] = useState(false);
  const [savedNotification, setSavedNotification] = useState(false);

  const getBackendEndpoint = (endpoint) => {
    if (typeof window !== 'undefined') {
      if (window.location.protocol === 'https:') {
        return endpoint;
      }
      if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
        return `http://localhost:3001${endpoint}`;
      }
    }
    return endpoint;
  };

  useEffect(() => {
    // Cargar caché local inmediato si existe
    try {
      if (typeof window !== 'undefined') {
        const cached = localStorage.getItem('goglite_presupuestos');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) setPresupuestos(parsed);
        }
      }
    } catch (e) {}

    fetchPresupuestos();
    fetchPlantillas();
  }, []);

  // Recibir prospecto desde el Módulo 2 (CRM & WhatsApp) o Módulo 1
  useEffect(() => {
    if (leadToConvert) {
      const base = plantillas[0]?.datos || DEFAULT_VIP_TEMPLATE;
      const precioAcordado = Number(leadToConvert.valorEstimado) > 0 ? Number(leadToConvert.valorEstimado) : (base.inversion?.precioTotal || 250);
      const anticipoMitad = Math.round(precioAcordado * 0.5);
      const nextNum = presupuestos.length + 1;
      const convertedProp = {
        ...JSON.parse(JSON.stringify(base)),
        id: 'prop-' + Date.now(),
        codigo: `P-2026-${String(nextNum).padStart(3, '0')}`,
        fecha: new Date().toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }),
        estado: 'borrador',
        pais: leadToConvert.pais || selectedCountry || 'SV',
        cliente: {
          nombre: leadToConvert.responsable || 'Director / Propietario',
          empresa: leadToConvert.nombreEmpresa || 'Empresa Cliente',
          telefono: leadToConvert.telefono || (leadToConvert.pais === 'DO' ? '+1 809 ' : '+503 '),
          email: leadToConvert.email || '',
          actividad: leadToConvert.dominio ? `Presencia Digital (${leadToConvert.dominio})` : 'Servicios Comerciales',
          ubicacion: leadToConvert.pais === 'DO' ? 'Santo Domingo / República Dominicana' : 'San Salvador / El Salvador'
        },
        inversion: {
          ...(base.inversion || DEFAULT_VIP_TEMPLATE.inversion),
          precioMercadoReferencial: Math.max(750, Math.round(precioAcordado * 2)),
          precioTotal: precioAcordado,
          descuentoEspecial: Math.max(0, Math.round(precioAcordado * 2) - precioAcordado),
          anticipo: anticipoMitad,
          contraEntrega: precioAcordado - anticipoMitad
        }
      };
      setActivePresupuesto(convertedProp);
      setViewMode('editor');
      if (onClearLeadConvert) onClearLeadConvert();
    }
  }, [leadToConvert]);

  const fetchPresupuestos = async () => {
    try {
      let res;
      try {
        res = await fetch(getBackendEndpoint('/api/presupuestos'));
      } catch {
        res = await fetch('/api/presupuestos');
      }
      if (res && res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setPresupuestos(data);
          if (typeof window !== 'undefined') {
            localStorage.setItem('goglite_presupuestos', JSON.stringify(data));
          }
        }
      }
    } catch (err) {
      console.warn('API presupuestos offline:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPlantillas = async () => {
    try {
      let res;
      try {
        res = await fetch(getBackendEndpoint('/api/presupuestos/plantillas'));
      } catch {
        res = await fetch('/api/presupuestos/plantillas');
      }
      if (res && res.ok) {
        const data = await res.json();
        setPlantillas(data);
      }
    } catch (err) {
      console.warn('API plantillas offline:', err);
    }
  };

  // Create new proposal from template
  const handleCreateNew = (templateData = null) => {
    const base = templateData || plantillas[0]?.datos || DEFAULT_VIP_TEMPLATE;
    const nextNum = presupuestos.length + 1;
    const newProp = {
      ...JSON.parse(JSON.stringify(base)),
      id: 'prop-' + Date.now(),
      codigo: `P-2026-${String(nextNum).padStart(3, '0')}`,
      fecha: new Date().toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }),
      estado: 'borrador',
      pais: selectedCountry || 'SV',
      cliente: {
        nombre: 'Nuevo Cliente',
        empresa: 'Empresa / Negocio',
        telefono: selectedCountry === 'DO' ? '+1 809 ' : '+503 ',
        email: '',
        actividad: 'Servicios Comerciales',
        ubicacion: selectedCountry === 'DO' ? 'Santo Domingo / Rep. Dominicana' : 'San Salvador / El Salvador'
      }
    };
    setActivePresupuesto(newProp);
    setViewMode('editor');
  };

  // Save current proposal
  const handleSavePresupuesto = async () => {
    if (!activePresupuesto) return;
    try {
      const exists = presupuestos.some(p => p.id === activePresupuesto.id);
      const url = exists ? getBackendEndpoint(`/api/presupuestos/${activePresupuesto.id}`) : getBackendEndpoint('/api/presupuestos');
      const method = exists ? 'PATCH' : 'POST';

      // 1. Persistir de inmediato en el estado local y en localStorage
      setPresupuestos(prev => {
        let updated;
        if (exists) {
          updated = prev.map(p => p.id === activePresupuesto.id ? activePresupuesto : p);
        } else {
          updated = [activePresupuesto, ...prev];
        }
        if (typeof window !== 'undefined') {
          localStorage.setItem('goglite_presupuestos', JSON.stringify(updated));
        }
        return updated;
      });

      // 2. Intentar sincronizar con el backend
      try {
        await fetch(url, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(activePresupuesto)
        });
      } catch (e) {
        console.warn('Backend sync error (usando local):', e);
      }

      setSavedNotification(true);
      setTimeout(() => setSavedNotification(false), 2500);
    } catch (err) {
      alert('Error al guardar: ' + err.message);
    }
  };

  // Delete proposal
  const handleDeletePresupuesto = async (id, e) => {
    e?.stopPropagation();
    if (!confirm('¿Eliminar esta propuesta?')) return;
    try {
      try {
        await fetch(getBackendEndpoint(`/api/presupuestos/${id}`), { method: 'DELETE' });
      } catch (err) {
        console.warn('Delete backend error, removiendo localmente:', err);
      }
      setPresupuestos(prev => {
        const updated = prev.filter(p => p.id !== id);
        if (typeof window !== 'undefined') {
          localStorage.setItem('goglite_presupuestos', JSON.stringify(updated));
        }
        return updated;
      });
      fetchPresupuestos();
      if (activePresupuesto?.id === id) {
        setViewMode('list');
        setActivePresupuesto(null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Update field in active proposal
  const updatePropField = (path, value) => {
    setActivePresupuesto(prev => {
      const copy = JSON.parse(JSON.stringify(prev));
      const keys = path.split('.');
      let current = copy;
      for (let i = 0; i < keys.length - 1; i++) {
        current = current[keys[i]];
      }
      current[keys[keys.length - 1]] = value;
      return copy;
    });
  };

  // Module item helper
  const updateModulo = (index, field, value) => {
    setActivePresupuesto(prev => {
      const copy = { ...prev };
      copy.modulos = [...copy.modulos];
      copy.modulos[index] = { ...copy.modulos[index], [field]: value };
      return copy;
    });
  };

  const addModulo = () => {
    setActivePresupuesto(prev => ({
      ...prev,
      modulos: [
        ...prev.modulos,
        {
          id: 'mod-' + Date.now(),
          numero: `MÓDULO ${prev.modulos.length + 1}`,
          titulo: 'Nuevo Módulo / Entregable',
          descripcion: 'Descripción del alcance y especificaciones del entregable.',
          tipo: 'precio_cerrado',
          horas: 6,
          precio: 50
        }
      ]
    }));
  };

  const removeModulo = (index) => {
    setActivePresupuesto(prev => ({
      ...prev,
      modulos: prev.modulos.filter((_, i) => i !== index)
    }));
  };

  // Phase item helper
  const updateFase = (index, field, value) => {
    setActivePresupuesto(prev => {
      const copy = { ...prev };
      copy.fases = [...copy.fases];
      copy.fases[index] = { ...copy.fases[index], [field]: value };
      return copy;
    });
  };

  // Copy link
  const handleCopyLink = () => {
    const url = `${window.location.origin}/#propuesta-${activePresupuesto?.id}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  // Trigger print
  const handlePrint = () => {
    window.print();
  };

  // Filtered proposals
  const filteredList = presupuestos.filter(p => {
    if (filterStatus === 'todos') return true;
    return p.estado === filterStatus;
  });

  // Calculate metrics
  const totalCotizado = presupuestos.reduce((acc, p) => acc + (p.inversion?.precioTotal || 0), 0);
  const totalAceptadas = presupuestos.filter(p => p.estado === 'aceptado').length;

  return (
    <div className="space-y-6">
      
      {/* VIEW 1: LISTADO DE PRESUPUESTOS */}
      {viewMode === 'list' && (
        <div className="space-y-5">
          {/* Action Button Above the 4th Card */}
          <div className="flex justify-end">
            <button
              onClick={() => handleCreateNew()}
              className="px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-glow-sm transition-all shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Crear Propuesta</span>
            </button>
          </div>

          {/* Top Bar with KPI Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-[#0e131d] border border-slate-800">
              <div className="text-[11px] font-mono uppercase text-slate-400 font-semibold mb-1">Propuestas Creadas</div>
              <div className="text-2xl font-extrabold text-slate-100">{presupuestos.length}</div>
            </div>

            <div className="p-4 rounded-xl bg-[#0e131d] border border-slate-800">
              <div className="text-[11px] font-mono uppercase text-slate-400 font-semibold mb-1">Volumen Total Cotizado</div>
              <div className="text-2xl font-extrabold text-orange-400">
                ${totalCotizado.toLocaleString()} <span className="text-xs text-slate-500 font-mono">USD</span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[#0e131d] border border-slate-800">
              <div className="text-[11px] font-mono uppercase text-slate-400 font-semibold mb-1">Aceptadas / Cerradas</div>
              <div className="text-2xl font-extrabold text-emerald-400">{totalAceptadas}</div>
            </div>

            <div className="p-4 rounded-xl bg-[#0e131d] border border-slate-800 flex flex-col justify-center">
              <div className="text-[11px] font-mono uppercase text-slate-400 font-semibold mb-1">Plantilla Oficial</div>
              <div className="text-sm text-slate-100 font-bold truncate">Portada Goglite VIP</div>
            </div>
          </div>

          {/* Table Header & Filters */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-extrabold text-slate-100">Presupuestos Emitidos</h2>
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-mono">
                {filteredList.length}
              </span>
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
              {[
                { id: 'todos', label: 'Todos' },
                { id: 'borrador', label: 'Borrador' },
                { id: 'enviado', label: 'Enviado' },
                { id: 'visto', label: 'Visto por Cliente' },
                { id: 'aceptado', label: 'Aceptado' },
                { id: 'rechazado', label: 'Rechazado' },
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => setFilterStatus(f.id)}
                  className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                    filterStatus === f.id
                      ? 'bg-slate-700 text-white'
                      : 'bg-[#101522] text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Proposals Table */}
          <div className="rounded-xl border border-slate-800 overflow-hidden bg-[#0c1017]">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#0f1422] text-slate-400 font-mono text-[11px] uppercase border-b border-slate-800">
                <tr>
                  <th className="px-4 py-3 font-semibold">Código</th>
                  <th className="px-4 py-3 font-semibold">Cliente / Proyecto</th>
                  <th className="px-4 py-3 font-semibold">Fecha & Vigencia</th>
                  <th className="px-4 py-3 font-semibold">Inversión Total</th>
                  <th className="px-4 py-3 font-semibold">Estado</th>
                  <th className="px-4 py-3 font-semibold text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredList.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-4 py-8 text-center text-slate-500">
                      No hay presupuestos registrados en este estado.
                    </td>
                  </tr>
                ) : (
                  filteredList.map(prop => (
                    <tr
                      key={prop.id}
                      onClick={() => {
                        setActivePresupuesto(prop);
                        setViewMode('editor');
                      }}
                      className="hover:bg-slate-800/30 transition-colors cursor-pointer group"
                    >
                      <td className="px-4 py-3.5 font-mono font-bold text-orange-400">
                        {prop.codigo}
                      </td>

                      <td className="px-4 py-3.5">
                        <div className="font-bold text-slate-100 group-hover:text-orange-300 transition-colors">
                          {prop.cliente?.empresa || prop.cliente?.nombre}
                        </div>
                        <div className="text-[11px] text-slate-400 truncate max-w-xs">
                          {prop.titulo}
                        </div>
                      </td>

                      <td className="px-4 py-3.5 text-slate-300">
                        <div>{prop.fecha}</div>
                        <div className="text-[10px] text-slate-500 font-mono">{prop.vigenciaDias || 15} días vigencia</div>
                      </td>

                      <td className="px-4 py-3.5 font-mono font-bold text-slate-100">
                        ${prop.inversion?.precioTotal?.toLocaleString()} {prop.moneda}
                        {prop.inversion?.descuentoEspecial > 0 && (
                          <div className="text-[10px] text-emerald-400 font-medium">
                            -${prop.inversion?.descuentoEspecial} de ahorro
                          </div>
                        )}
                      </td>

                      <td className="px-4 py-3.5">
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                          prop.estado === 'aceptado' ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' :
                          prop.estado === 'enviado' ? 'bg-sky-500/15 text-sky-400 border-sky-500/30' :
                          prop.estado === 'visto' ? 'bg-amber-500/15 text-amber-400 border-amber-500/30' :
                          prop.estado === 'rechazado' ? 'bg-red-500/15 text-red-400 border-red-500/30' :
                          'bg-slate-800 text-slate-400 border-slate-700'
                        }`}>
                          {prop.estado === 'enviado' ? 'Enviado al cliente' :
                           prop.estado === 'visto' ? 'Visto por el cliente' :
                           prop.estado === 'aceptado' ? 'Aceptado' :
                           prop.estado === 'borrador' ? 'Borrador' : prop.estado}
                        </span>
                      </td>

                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5" onClick={e => e.stopPropagation()}>
                          {onNavigateToRentabilidad && (
                            <button
                              onClick={() => onNavigateToRentabilidad(prop)}
                              className="px-2 py-1 rounded bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold flex items-center gap-1 transition-colors"
                              title="Emitir Factura Proforma y Auditar Rentabilidad en Módulo 4"
                            >
                              <DollarSign className="w-3 h-3" />
                              <span>Facturar M4</span>
                            </button>
                          )}
                          <button
                            onClick={() => {
                              setActivePresupuesto(prop);
                              setViewMode('editor');
                            }}
                            className="p-1.5 rounded hover:bg-slate-700 text-slate-300 hover:text-white"
                            title="Editar en Constructor"
                          >
                            <Sliders className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={(e) => handleDeletePresupuesto(prop.id, e)}
                            className="p-1.5 rounded hover:bg-slate-700 text-red-400 hover:text-red-300"
                            title="Eliminar"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW 2: CONSTRUCTOR EN PANTALLA DIVIDIDA (EDITOR IZQUIERDA | PORTADA EN VIVO DERECHA) */}
      {viewMode === 'editor' && activePresupuesto && (
        <div className="space-y-4">
          
          {/* Top Bar of the Editor */}
          <div className="no-print flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  setViewMode('list');
                  fetchPresupuestos();
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Volver</span>
              </button>
              
              <div className="flex items-baseline gap-2">
                <span className="font-mono text-base font-extrabold text-orange-400">{activePresupuesto.codigo}</span>
                <span className="text-xs text-slate-400">· {activePresupuesto.cliente?.empresa}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={activePresupuesto.estado}
                onChange={(e) => updatePropField('estado', e.target.value)}
                className="bg-[#121929] border border-slate-700 text-slate-200 text-xs px-2.5 py-1.5 rounded-lg font-semibold cursor-pointer focus:outline-none"
              >
                <option value="borrador">Borrador</option>
                <option value="sin_abrir">Sin abrir</option>
                <option value="enviado">Enviado al cliente</option>
                <option value="visto">Visto por el cliente</option>
                <option value="aceptado">Aceptado</option>
                <option value="rechazado">Rechazado</option>
              </select>

              <button
                onClick={handleCopyLink}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors"
                title="Copiar enlace interactivo para el cliente"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedLink ? 'Copiado' : 'Copiar enlace'}</span>
              </button>

              <button
                onClick={handlePrint}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold shadow-glow-sm transition-all"
                title="Imprimir o Guardar PDF con Portada Goglite"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Imprimir / PDF</span>
              </button>

              <button
                onClick={handleSavePresupuesto}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-all"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Guardar</span>
              </button>

              {onNavigateToRentabilidad && (
                <button
                  onClick={async () => {
                    await handleSavePresupuesto();
                    onNavigateToRentabilidad(activePresupuesto);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-500/20 hover:bg-orange-500/30 text-orange-300 border border-orange-500/30 text-xs font-bold transition-all shadow-sm"
                  title="Enviar a Módulo 4 (Rentabilidad & Factura Proforma)"
                >
                  <DollarSign className="w-3.5 h-3.5" />
                  <span>Facturar en Módulo 4 →</span>
                </button>
              )}

              {onNavigateToContratos && (
                <button
                  onClick={async () => {
                    await handleSavePresupuesto();
                    try {
                      await fetch(`/api/proyectos/crear-desde-presupuesto/${activePresupuesto.id}`, { method: 'POST' });
                    } catch (e) {}
                    onNavigateToContratos();
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-xs font-bold transition-all shadow-sm"
                  title="Formalizar con Contrato y Onboarding"
                >
                  <span>Contrato SOW →</span>
                </button>
              )}
            </div>
          </div>

          {savedNotification && (
            <div className="no-print bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs px-4 py-2 rounded-xl flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>Propuesta guardada correctamente.</span>
            </div>
          )}

          {/* TWO COLUMNS: LEFT EDITOR (FORM) | RIGHT PREVIEW (GOGLITE COVER & PROPOSAL) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* LEFT PANEL: 5 COLUMNS ON DESKTOP */}
            <div className="no-print lg:col-span-5 space-y-4 max-h-[85vh] overflow-y-auto pr-1">
              
              {/* Editor Tabs */}
              <div className="flex border-b border-slate-800 text-xs bg-[#0c1017] rounded-xl p-1 gap-1">
                {[
                  { id: 'portada', label: '1. Portada & Cliente' },
                  { id: 'modulos', label: `2. Módulos (${activePresupuesto.modulos?.length || 0})` },
                  { id: 'fases', label: '3. Fases' },
                  { id: 'inversion', label: '4. Inversión & Cierre' }
                ].map(t => (
                  <button
                    key={t.id}
                    onClick={() => setEditorTab(t.id)}
                    className={`flex-1 py-1.5 text-center font-semibold rounded-lg transition-colors ${
                      editorTab === t.id
                        ? 'bg-orange-600 text-white'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {/* TAB 1: PORTADA & CLIENTE */}
              {editorTab === 'portada' && (
                <div className="p-4 rounded-xl bg-[#0e131d] border border-slate-800 space-y-3.5 text-xs">
                  <div className="text-[11px] font-mono uppercase tracking-wider text-orange-400 font-bold">
                    Datos del Cliente & Proyecto
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Empresa / Negocio</label>
                    <input
                      type="text"
                      value={activePresupuesto.cliente?.empresa || ''}
                      onChange={(e) => updatePropField('cliente.empresa', e.target.value)}
                      className="w-full bg-[#080b11] border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-orange-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">Persona de Contacto</label>
                      <input
                        type="text"
                        value={activePresupuesto.cliente?.nombre || ''}
                        onChange={(e) => updatePropField('cliente.nombre', e.target.value)}
                        className="w-full bg-[#080b11] border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-orange-500"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">Teléfono</label>
                      <input
                        type="text"
                        value={activePresupuesto.cliente?.telefono || ''}
                        onChange={(e) => updatePropField('cliente.telefono', e.target.value)}
                        className="w-full bg-[#080b11] border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-orange-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Título de la Propuesta VIP</label>
                    <input
                      type="text"
                      value={activePresupuesto.titulo || ''}
                      onChange={(e) => updatePropField('titulo', e.target.value)}
                      className="w-full bg-[#080b11] border border-slate-800 rounded-lg px-3 py-2 text-slate-200 font-semibold focus:outline-none focus:border-orange-500"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Subtítulo / Módulos Incluidos</label>
                    <input
                      type="text"
                      value={activePresupuesto.subtitulo || ''}
                      onChange={(e) => updatePropField('subtitulo', e.target.value)}
                      className="w-full bg-[#080b11] border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-orange-500"
                    />
                  </div>

                  <div className="pt-2 border-t border-slate-800">
                    <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-bold mb-2">
                      Bloques Fijos de Portada Goglite
                    </div>

                    <div className="space-y-2">
                      <div>
                        <label className="text-[10px] text-slate-500 block mb-0.5">Enfoque de Conversión / Urgencia</label>
                        <textarea
                          rows="2"
                          value={activePresupuesto.portada?.enfoqueEstrategico || ''}
                          onChange={(e) => updatePropField('portada.enfoqueEstrategico', e.target.value)}
                          className="w-full bg-[#080b11] border border-slate-800 rounded-lg px-3 py-1.5 text-slate-300 focus:outline-none focus:border-orange-500 text-[11px]"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] text-slate-500 block mb-0.5">Tecnología & Rendimiento Mobile-First</label>
                        <textarea
                          rows="2"
                          value={activePresupuesto.portada?.tecnologiaMobileFirst || ''}
                          onChange={(e) => updatePropField('portada.tecnologiaMobileFirst', e.target.value)}
                          className="w-full bg-[#080b11] border border-slate-800 rounded-lg px-3 py-1.5 text-slate-300 focus:outline-none focus:border-orange-500 text-[11px]"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] text-slate-500 block mb-0.5">GEO & SEO Local (Schema / IA)</label>
                        <textarea
                          rows="2"
                          value={activePresupuesto.portada?.geoSeoLocal || ''}
                          onChange={(e) => updatePropField('portada.geoSeoLocal', e.target.value)}
                          className="w-full bg-[#080b11] border border-slate-800 rounded-lg px-3 py-1.5 text-slate-300 focus:outline-none focus:border-orange-500 text-[11px]"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: MODULOS Y PARTIDAS */}
              {editorTab === 'modulos' && (
                <div className="space-y-3 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono uppercase text-slate-400 font-bold">
                      Alcance & Entregables por Módulo
                    </span>
                    <button
                      onClick={addModulo}
                      className="px-2.5 py-1 rounded-lg bg-orange-600/20 text-orange-400 hover:bg-orange-600/30 font-semibold flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Añadir Módulo</span>
                    </button>
                  </div>

                  {activePresupuesto.modulos?.map((mod, idx) => (
                    <div key={mod.id || idx} className="p-3.5 rounded-xl bg-[#0e131d] border border-slate-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono font-bold text-orange-400">{mod.numero}</span>
                        <button
                          onClick={() => removeModulo(idx)}
                          className="text-slate-500 hover:text-red-400 p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <input
                        type="text"
                        value={mod.titulo}
                        onChange={(e) => updateModulo(idx, 'titulo', e.target.value)}
                        placeholder="Título del entregable"
                        className="w-full bg-[#080b11] border border-slate-800 rounded-lg px-3 py-1.5 font-bold text-slate-200 focus:outline-none focus:border-orange-500 text-xs"
                      />

                      <textarea
                        rows="2"
                        value={mod.descripcion}
                        onChange={(e) => updateModulo(idx, 'descripcion', e.target.value)}
                        placeholder="Especificaciones técnicas y detalles"
                        className="w-full bg-[#080b11] border border-slate-800 rounded-lg px-3 py-1.5 text-slate-300 focus:outline-none focus:border-orange-500 text-[11px]"
                      />
                    </div>
                  ))}
                </div>
              )}

              {/* TAB 3: FASES Y HOJA DE RUTA */}
              {editorTab === 'fases' && (
                <div className="space-y-3 text-xs">
                  <div className="text-[11px] font-mono uppercase text-slate-400 font-bold">
                    Hoja de Ruta de Implementación
                  </div>

                  {activePresupuesto.fases?.map((fase, idx) => (
                    <div key={idx} className="p-3.5 rounded-xl bg-[#0e131d] border border-slate-800 space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono font-bold text-orange-400">{fase.fase}:</span>
                        <input
                          type="text"
                          value={fase.plazo}
                          onChange={(e) => updateFase(idx, 'plazo', e.target.value)}
                          className="bg-[#080b11] border border-slate-800 rounded px-2 py-0.5 text-xs text-slate-200 font-semibold"
                        />
                      </div>
                      <textarea
                        rows="2"
                        value={fase.detalle}
                        onChange={(e) => updateFase(idx, 'detalle', e.target.value)}
                        className="w-full bg-[#080b11] border border-slate-800 rounded-lg px-3 py-1.5 text-slate-300 focus:outline-none focus:border-orange-500 text-[11px]"
                      />
                    </div>
                  ))}
                </div>
              )}

              {/* TAB 4: INVERSIÓN & CONDICIONES */}
              {editorTab === 'inversion' && (
                <div className="p-4 rounded-xl bg-[#0e131d] border border-slate-800 space-y-3.5 text-xs">
                  <div className="text-[11px] font-mono uppercase tracking-wider text-orange-400 font-bold">
                    Inversión y Condiciones Comerciales
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">Precio Mercado Referencial ($)</label>
                      <input
                        type="number"
                        value={activePresupuesto.inversion?.precioMercadoReferencial || 0}
                        onChange={(e) => updatePropField('inversion.precioMercadoReferencial', Number(e.target.value))}
                        className="w-full bg-[#080b11] border border-slate-800 rounded-lg px-3 py-2 text-slate-200 font-mono focus:outline-none focus:border-orange-500"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">Inversión Final Acordada ($)</label>
                      <input
                        type="number"
                        value={activePresupuesto.inversion?.precioTotal || 0}
                        onChange={(e) => updatePropField('inversion.precioTotal', Number(e.target.value))}
                        className="w-full bg-[#080b11] border border-slate-800 rounded-lg px-3 py-2 text-orange-400 font-mono font-bold focus:outline-none focus:border-orange-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">Anticipo al Inicio ($)</label>
                      <input
                        type="number"
                        value={activePresupuesto.inversion?.anticipo || 0}
                        onChange={(e) => updatePropField('inversion.anticipo', Number(e.target.value))}
                        className="w-full bg-[#080b11] border border-slate-800 rounded-lg px-3 py-2 text-slate-200 font-mono focus:outline-none focus:border-orange-500"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">Contra Entrega Final ($)</label>
                      <input
                        type="number"
                        value={activePresupuesto.inversion?.contraEntrega || 0}
                        onChange={(e) => updatePropField('inversion.contraEntrega', Number(e.target.value))}
                        className="w-full bg-[#080b11] border border-slate-800 rounded-lg px-3 py-2 text-slate-200 font-mono focus:outline-none focus:border-orange-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Beneficio Exclusivo Incluido</label>
                    <textarea
                      rows="2"
                      value={activePresupuesto.inversion?.beneficioExclusivo || ''}
                      onChange={(e) => updatePropField('inversion.beneficioExclusivo', e.target.value)}
                      className="w-full bg-[#080b11] border border-slate-800 rounded-lg px-3 py-1.5 text-slate-300 focus:outline-none focus:border-orange-500 text-[11px]"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Revisiones Incluidas</label>
                    <input
                      type="text"
                      value={activePresupuesto.inversion?.revisiones || ''}
                      onChange={(e) => updatePropField('inversion.revisiones', e.target.value)}
                      className="w-full bg-[#080b11] border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-orange-500"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* RIGHT PANEL: 7 COLUMNS - VISTA PREVIA CORPORATIVA EN VIVO CON PORTADA GOGLITE */}
            <div className="lg:col-span-7 bg-[#0c1017] p-2 rounded-2xl border border-slate-800 overflow-hidden shadow-2xl print:border-none print:p-0 print:shadow-none print:bg-transparent print:m-0 print:overflow-visible">
              
              {/* PRINTABLE PROPOSAL SHEET (ESTILO OFICIAL GOOGLE DOCS / GOGLITE) */}
              <div 
                id="printable-proposal"
                className="bg-slate-900/60 p-2 sm:p-4 text-slate-900 rounded-xl text-xs leading-relaxed max-h-[85vh] overflow-y-auto print:max-h-none print:shadow-none print:p-0 print:text-black font-sans space-y-4 print:space-y-0 print:bg-white"
              >
                {/* =========================================================================
                    PÁGINA 1: PORTADA OFICIAL GOGLITE (DEL PDF ADJUNTO, 100% FIEL Y EXACTA)
                    ========================================================================= */}
                <div className="pdf-page-cover relative w-full aspect-[210/297] sm:h-auto overflow-hidden bg-white shadow-xl rounded-lg print:rounded-none print:shadow-none">
                  <img 
                    src="/assets/portada_oficial_fija.png" 
                    alt="Propuesta de Desarrollo Digital VIP" 
                    className="w-full h-full object-cover block"
                  />
                </div>

                {/* =========================================================================
                    PÁGINA 2: RESUMEN EJECUTIVO, ESTRATEGIA Y ALCANCE TÉCNICO (MÓDULOS)
                    ========================================================================= */}
                <div className="pdf-page-content p-8 sm:p-10 bg-white shadow-xl rounded-lg print:rounded-none print:shadow-none">
                  {/* Sub-Header with Goglite Brand & Metadata */}
                  <div className="border-b-2 border-slate-900 pb-4 mb-5 avoid-break">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <img 
                          src="/assets/goglite_logo.png" 
                          alt="Goglite" 
                          className="h-10 w-auto object-contain"
                        />
                        <div className="text-[10px] text-slate-600 font-medium space-y-0.5 border-l border-slate-300 pl-3">
                          <div><strong>Ubicación:</strong> {activePresupuesto.emisor?.ubicacion}</div>
                          <div><strong>Contacto:</strong> {activePresupuesto.emisor?.telefono} | {activePresupuesto.emisor?.email}</div>
                          <div><strong>Director:</strong> {activePresupuesto.emisor?.responsable}</div>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-[11px] font-mono font-bold text-slate-900 uppercase">
                          Fecha: {activePresupuesto.fecha}
                        </div>
                        <div className="text-[10px] font-mono text-orange-600 font-bold mt-0.5">
                          {activePresupuesto.codigo}
                        </div>
                      </div>
                    </div>

                    {/* DESTINATARIO */}
                    <div className="mt-4 p-3 rounded-lg bg-slate-50 border border-slate-200">
                      <div className="text-[10px] font-mono uppercase text-slate-500 font-bold">Cliente / Destinatario:</div>
                      <div className="text-sm font-extrabold text-slate-900 mt-0.5">
                        {activePresupuesto.cliente?.nombre} | {activePresupuesto.cliente?.empresa}
                      </div>
                      <div className="text-[11px] text-slate-700">
                        Tel: {activePresupuesto.cliente?.telefono} · {activePresupuesto.cliente?.actividad}
                      </div>
                    </div>
                  </div>

                  {/* 2. TÍTULO DE LA PROPUESTA VIP */}
                  <div className="mb-5 avoid-break">
                    <h2 className="text-base font-black text-slate-900 tracking-tight leading-snug uppercase">
                      {activePresupuesto.titulo}
                    </h2>
                    {activePresupuesto.subtitulo && (
                      <div className="text-[11px] font-semibold text-orange-600 mt-0.5">
                        {activePresupuesto.subtitulo}
                      </div>
                    )}
                  </div>

                  {/* 3. BLOQUES ESTRATÉGICOS FIJOS */}
                  <div className="space-y-2.5 mb-6 bg-slate-50 p-4 rounded-xl border border-slate-200/80 avoid-break text-[11px]">
                    {activePresupuesto.portada?.proyecto && (
                      <div>
                        <span className="font-extrabold text-slate-900 block mb-0.5">
                          • Proyecto & Diagnóstico:
                        </span>
                        <p className="text-slate-700 leading-normal">
                          {activePresupuesto.portada?.proyecto}
                        </p>
                      </div>
                    )}

                    {activePresupuesto.portada?.enfoqueEstrategico && (
                      <div>
                        <span className="font-extrabold text-slate-900 block mb-0.5">
                          • Enfoque de Conversión Inmediata:
                        </span>
                        <p className="text-slate-700 leading-normal">
                          {activePresupuesto.portada?.enfoqueEstrategico}
                        </p>
                      </div>
                    )}

                    {activePresupuesto.portada?.tecnologiaMobileFirst && (
                      <div>
                        <span className="font-extrabold text-slate-900 block mb-0.5">
                          • Tecnología y Rendimiento Mobile-First:
                        </span>
                        <p className="text-slate-700 leading-normal">
                          {activePresupuesto.portada?.tecnologiaMobileFirst}
                        </p>
                      </div>
                    )}

                    {activePresupuesto.portada?.geoSeoLocal && (
                      <div>
                        <span className="font-extrabold text-slate-900 block mb-0.5">
                          • GEO & SEO Local de Nueva Generación (Optimizado para IA y Buscadores):
                        </span>
                        <p className="text-slate-700 leading-normal">
                          {activePresupuesto.portada?.geoSeoLocal}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* 4. COMPONENTES DEL SISTEMA INTEGRAL */}
                  <div className="mb-5">
                    <h2 className="text-xs font-black uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1 mb-3">
                      1. Componentes del Sistema Integral (Alcance y Entregables)
                    </h2>

                    <div className="space-y-3">
                      {activePresupuesto.modulos?.map((m, i) => (
                        <div key={i} className="pl-3 border-l-2 border-orange-500 space-y-0.5 avoid-break">
                          <div className="font-extrabold text-slate-900 text-xs">
                            {m.numero}: {m.titulo}
                          </div>
                          <p className="text-slate-700 text-[11px] leading-relaxed">
                            {m.descripcion}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 2. HOJA DE RUTA Y FASES */}
                  <div className="mb-5 avoid-break">
                    <h2 className="text-xs font-black uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1 mb-3">
                      2. Hoja de Ruta y Fases de Implementación (10 a 15 Días Hábiles)
                    </h2>

                    <div className="space-y-2">
                      {activePresupuesto.fases?.map((f, i) => (
                        <div key={i} className="text-[11px] text-slate-800">
                          <span className="font-extrabold text-slate-900">• {f.fase} ({f.plazo}):</span> {f.detalle}
                        </div>
                      ))}
                    </div>
                  </div>

                    {/* 3. INVERSIÓN ESTRATÉGICA Y CONDICIONES */}
                    <div className="mb-6 p-5 rounded-xl bg-slate-900 text-white avoid-break">
                      <h2 className="text-xs font-black uppercase tracking-wider text-orange-400 mb-2">
                        3. Inversión Estratégica y Condiciones Comerciales
                      </h2>

                      <p className="text-[11px] text-slate-300 leading-relaxed mb-3">
                        La inversión en un sistema digital integral de esta envergadura suele oscilar entre los <strong>${activePresupuesto.inversion?.precioMercadoReferencial} USD</strong> en el mercado profesional. Para <strong>{activePresupuesto.cliente?.empresa}</strong> hemos estructurado un paquete preferencial:
                      </p>

                      <div className="bg-white/10 p-3.5 rounded-lg border border-white/15 space-y-1.5 font-mono mb-4">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-300">Inversión Total del Sistema Completo:</span>
                          <span className="text-base font-extrabold text-orange-400">
                            ${activePresupuesto.inversion?.precioTotal} USD
                          </span>
                        </div>
                        {activePresupuesto.inversion?.beneficioExclusivo && (
                          <div className="text-[10px] text-emerald-300 font-sans pt-1 border-t border-white/10">
                            ★ <strong>Beneficio Exclusivo:</strong> {activePresupuesto.inversion?.beneficioExclusivo}
                          </div>
                        )}
                      </div>

                      <div className="text-[10px] text-slate-300 space-y-1.5 font-sans">
                        <div>• <strong>Forma de Pago:</strong> ${activePresupuesto.inversion?.anticipo} USD de anticipo para iniciar y ${activePresupuesto.inversion?.contraEntrega} USD contra entrega final y publicación.</div>
                        <div>• <strong>Revisiones:</strong> {activePresupuesto.inversion?.revisiones}</div>
                        <div>• <strong>Requisitos de Inicio:</strong> {activePresupuesto.inversion?.requisitosInicio}</div>
                        <div>• <strong>Vigencia de la Oferta:</strong> {activePresupuesto.vigenciaDias || 15} días calendario.</div>
                      </div>
                    </div>
                  </div>

                  {/* 4. FIRMA OFICIAL GOGLITE */}
                  <div className="pt-4 border-t border-slate-300 flex items-center justify-between text-[11px] text-slate-600 avoid-break mt-6">
                    <div>
                      <div className="font-extrabold text-slate-900 text-xs">{activePresupuesto.emisor?.responsable}</div>
                      <div className="text-orange-600 font-bold">{activePresupuesto.emisor?.empresa}</div>
                      <div className="text-[10px] text-slate-500">{activePresupuesto.emisor?.telefono} | {activePresupuesto.emisor?.email}</div>
                    </div>

                    <div className="text-right">
                      <div className="font-mono text-[10px] text-slate-400">Documento Oficial Certificado</div>
                      <div className="text-xs font-bold text-slate-900">Estado: {activePresupuesto.estado.toUpperCase()}</div>
                    </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
