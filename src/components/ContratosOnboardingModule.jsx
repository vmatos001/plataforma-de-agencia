import React, { useState, useEffect, useRef } from 'react';
import {
  FileText,
  Plus,
  CheckCircle2,
  Clock,
  Printer,
  Copy,
  Check,
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
  Save,
  BookmarkPlus,
  Eye,
  Sliders,
  PenTool,
  Upload,
  Globe,
  Share2,
  AlertCircle,
  HelpCircle,
  CreditCard,
  Briefcase,
  CheckSquare,
  Square,
  Flame,
  FileCheck2,
  RefreshCw,
  Zap,
  Kanban
} from 'lucide-react';
import {
  getStoredProyectos,
  saveStoredProyectos,
  buildProyectoFromPresupuesto
} from '../services/contractGenerator';
import {
  evaluateProjectMilestones,
  syncAllProyectosWithEvents,
  getStoredSprintTasks
} from '../services/projectMilestoneSync';

export default function ContratosOnboardingModule({ selectedCountry = 'SV', onNavigateToPresupuestos }) {
  const [proyectos, setProyectos] = useState([]);
  const [presupuestos, setPresupuestos] = useState([]);
  const [loading, setLoading] = useState(true);

  // View modes: 'list' | 'detalle'
  const [viewMode, setViewMode] = useState('list');
  const [activeProyecto, setActiveProyecto] = useState(null);
  
  // Tabs within project detail: 'contrato' | 'onboarding' | 'seguimiento' | 'pagos'
  const [detailTab, setDetailTab] = useState('contrato');

  // Filter & Search
  const [filterEstado, setFilterEstado] = useState('todos');
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [savedNotice, setSavedNotice] = useState(false);

  // E-Signature Canvas Ref & State
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [signerName, setSignerName] = useState('');
  const [signerDoc, setSignerDoc] = useState('');

  // Import from proposal modal
  const [showImportModal, setShowImportModal] = useState(false);

  useEffect(() => {
    fetchProyectos();
    fetchPresupuestos();

    const handleStorageChange = () => {
      fetchProyectos();
      fetchPresupuestos();
    };
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('goglite_proyectos_synced', handleStorageChange);
    window.addEventListener('goglite_tasks_updated', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('goglite_proyectos_synced', handleStorageChange);
      window.removeEventListener('goglite_tasks_updated', handleStorageChange);
    };
  }, []);

  const fetchProyectos = async () => {
    let localList = getStoredProyectos();

    // Auto-generar y vincular contratos para cualquier propuesta que ya haya sido aceptada
    try {
      const rawProps = localStorage.getItem('goglite_presupuestos');
      if (rawProps) {
        const parsedProps = JSON.parse(rawProps);
        let createdAny = false;
        parsedProps.forEach(prop => {
          if (prop?.estado === 'aceptado') {
            const targetEmp = (prop.cliente?.empresa || '').toLowerCase().trim();
            const exists = localList.some(p => 
              (p.presupuestoId && p.presupuestoId === prop.id) ||
              (p.presupuestoCodigo && p.presupuestoCodigo === prop.codigo) ||
              (targetEmp && p.cliente?.empresa && p.cliente.empresa.toLowerCase().trim() === targetEmp)
            );
            if (!exists) {
              const newProj = buildProyectoFromPresupuesto(prop, localList);
              localList.unshift(newProj);
              createdAny = true;
            }
          }
        });
        if (createdAny) {
          saveStoredProyectos(localList);
        }
      }
    } catch (e) {}

    try {
      const res = await fetch('/api/proyectos');
      const cType = res.headers.get('content-type') || '';
      if (res.ok && cType.includes('application/json')) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          const map = new Map();
          // localList toma precedencia para preservar firmas y datos offline
          [...localList, ...data].forEach(p => {
            if (p?.id && !map.has(p.id)) map.set(p.id, p);
          });
          localList = Array.from(map.values());
        }
      }
    } catch (err) {
      console.warn('[Contratos] Usando proyectos locales:', err);
    } finally {
      // Re-evaluar automáticamente hitos con eventos del cliente y sprint de desarrollo
      localList = localList.map(p => evaluateProjectMilestones(p));
      saveStoredProyectos(localList);

      setProyectos(localList);
      setActiveProyecto(prev => {
        if (!prev) return null;
        const targetEmp = (prev.cliente?.empresa || '').toLowerCase().trim();
        const found = localList.find(p => 
          p.id === prev.id || 
          (prev.presupuestoId && p.presupuestoId === prev.presupuestoId) || 
          (targetEmp && p.cliente?.empresa && p.cliente.empresa.toLowerCase().trim() === targetEmp)
        );
        return found ? evaluateProjectMilestones(found) : prev;
      });
      setLoading(false);
    }
  };

  const fetchPresupuestos = async () => {
    let localProps = [];
    try {
      const raw = localStorage.getItem('goglite_presupuestos');
      if (raw) localProps = JSON.parse(raw);
    } catch (e) {}

    try {
      const res = await fetch('/api/presupuestos');
      const cType = res.headers.get('content-type') || '';
      if (res.ok && cType.includes('application/json')) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          const map = new Map();
          // localProps toma precedencia para preservar estado 'aceptado'
          [...localProps, ...data].forEach(p => {
            if (p?.id && !map.has(p.id)) map.set(p.id, p);
          });
          localProps = Array.from(map.values());
        }
      }
    } catch (err) {
      console.warn('[Contratos] Usando presupuestos locales:', err);
    } finally {
      setPresupuestos(localProps);
    }
  };

  // Open project detail
  const handleOpenProyecto = (proj, tab = 'contrato') => {
    setActiveProyecto(proj);
    setDetailTab(tab);
    setViewMode('detalle');
    setSignerName(proj.cliente?.nombre || '');
    setSignerDoc(proj.cliente?.identificacion || '');
  };

  // Create project from proposal
  const handleImportProposal = async (propId) => {
    try {
      const prop = presupuestos.find(p => p.id === propId);
      if (!prop) {
        alert('Presupuesto no encontrado');
        return;
      }

      let createdProj = null;

      // 1. Intentar backend API
      try {
        const res = await fetch(`/api/proyectos/crear-desde-presupuesto/${propId}`, {
          method: 'POST'
        });
        const cType = res.headers.get('content-type') || '';
        if (res.ok && cType.includes('application/json')) {
          const data = await res.json();
          if (data.success && data.proyecto) {
            createdProj = data.proyecto;
          }
        }
      } catch (apiErr) {
        console.warn('Backend API no disponible para crear proyecto, usando generador local:', apiErr);
      }

      // 2. Si backend no lo generó, generarlo localmente
      if (!createdProj) {
        createdProj = buildProyectoFromPresupuesto(prop, proyectos);
      }

      // 3. Persistir en estado y localStorage
      const updatedList = [createdProj, ...proyectos.filter(p => p.id !== createdProj.id)];
      setProyectos(updatedList);
      saveStoredProyectos(updatedList);

      // 4. Actualizar estado del presupuesto a 'aceptado' si no lo estaba
      try {
        const updatedPresupuestos = presupuestos.map(p => p.id === propId ? { ...p, estado: 'aceptado' } : p);
        setPresupuestos(updatedPresupuestos);
        localStorage.setItem('goglite_presupuestos', JSON.stringify(updatedPresupuestos));
      } catch (e) {}

      setShowImportModal(false);
      handleOpenProyecto(createdProj, 'contrato');
    } catch (err) {
      alert('Error importando propuesta: ' + err.message);
    }
  };

  // Delete project
  const handleDeleteProyecto = async (id, e) => {
    e?.stopPropagation();
    if (!confirm('¿Seguro que deseas eliminar este proyecto y su contrato?')) return;
    try {
      try {
        await fetch(`/api/proyectos/${id}`, { method: 'DELETE' });
      } catch (e) {}
      const updated = proyectos.filter(p => p.id !== id);
      setProyectos(updated);
      saveStoredProyectos(updated);

      if (activeProyecto?.id === id) {
        setViewMode('list');
        setActiveProyecto(null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Canvas drawing handlers
  const startDrawing = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX || e.touches?.[0]?.clientX) - rect.left;
    const y = (e.clientY || e.touches?.[0]?.clientY) - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX || e.touches?.[0]?.clientX) - rect.left;
    const y = (e.clientY || e.touches?.[0]?.clientY) - rect.top;

    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#0f172a';
    ctx.lineTo(x, y);
    ctx.stroke();
    setHasSignature(true);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
  };

  // Sign contract digitally
  const handleSignContract = async () => {
    const canvas = canvasRef.current;
    if (!canvas || !hasSignature) {
      alert('Por favor realiza tu firma en el recuadro antes de confirmar.');
      return;
    }
    const signatureBase64 = canvas.toDataURL('image/png');

    const updatedFirma = {
      firmado: true,
      nombreFirmante: signerName || activeProyecto.cliente?.nombre,
      identificacion: signerDoc || 'Documento no especificado',
      timestampUtc: new Date().toISOString(),
      ipAddress: '127.0.0.1 (Panel Interno)',
      userAgent: navigator.userAgent,
      firmaBase64: signatureBase64
    };

    const baseProj = {
      ...activeProyecto,
      estado: activeProyecto.estado === 'contrato_pendiente' ? 'firmado' : activeProyecto.estado,
      contrato: {
        ...activeProyecto.contrato,
        firmaCliente: updatedFirma
      }
    };

    const updatedProj = evaluateProjectMilestones(baseProj);

    setActiveProyecto(updatedProj);
    setProyectos(prev => {
      const next = prev.map(p => p.id === updatedProj.id ? updatedProj : p);
      saveStoredProyectos(next);
      return next;
    });

    try {
      await fetch(`/api/proyectos/${activeProyecto.id}/firmar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombreFirmante: updatedFirma.nombreFirmante,
          identificacion: updatedFirma.identificacion,
          firmaBase64: signatureBase64
        })
      });
    } catch (err) {
      console.warn('API firmar warn:', err);
    }

    showNotification();
  };

  // Toggle milestone completion (Modo Híbrido: Permite alternar manualmente cualquier hito)
  const handleToggleHito = async (hitoId, currentStatus) => {
    const updatedHitos = (activeProyecto.seguimiento?.hitos || []).map(h => {
      if (h.id === hitoId) {
        return {
          ...h,
          completado: !currentStatus,
          origen: 'manual',
          fecha: !currentStatus ? new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Pendiente'
        };
      }
      return h;
    });

    const baseProj = {
      ...activeProyecto,
      seguimiento: {
        ...activeProyecto.seguimiento,
        hitos: updatedHitos
      }
    };

    const updatedProj = evaluateProjectMilestones(baseProj);

    setActiveProyecto(updatedProj);
    setProyectos(prev => {
      const next = prev.map(p => p.id === updatedProj.id ? updatedProj : p);
      saveStoredProyectos(next);
      return next;
    });

    try {
      await fetch(`/api/proyectos/${activeProyecto.id}/hito`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hitoId,
          completado: !currentStatus
        })
      });
    } catch (err) {
      console.warn('API hito warn:', err);
    }
  };

  // Re-evaluación forzada de eventos automáticos
  const handleReSyncEvents = () => {
    if (!activeProyecto) return;
    const reEvaluated = evaluateProjectMilestones(activeProyecto);
    setActiveProyecto(reEvaluated);
    setProyectos(prev => {
      const next = prev.map(p => p.id === reEvaluated.id ? reEvaluated : p);
      saveStoredProyectos(next);
      return next;
    });
    showNotification();
  };


  // Update onboarding form data
  const handleUpdateOnboardingField = (field, val) => {
    setActiveProyecto(prev => ({
      ...prev,
      onboarding: {
        ...prev.onboarding,
        datos: {
          ...prev.onboarding?.datos,
          [field]: val
        }
      }
    }));
  };

  // Save onboarding
  const handleSaveOnboarding = async () => {
    const baseProj = {
      ...activeProyecto,
      onboarding: {
        completado: true,
        fecha: new Date().toISOString().split('T')[0],
        datos: activeProyecto.onboarding?.datos || {}
      }
    };

    const updatedProj = evaluateProjectMilestones(baseProj);

    setActiveProyecto(updatedProj);
    setProyectos(prev => {
      const next = prev.map(p => p.id === updatedProj.id ? updatedProj : p);
      saveStoredProyectos(next);
      return next;
    });

    try {
      await fetch(`/api/proyectos/${activeProyecto.id}/onboarding`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(activeProyecto.onboarding?.datos || {})
      });
    } catch (err) {
      console.warn('API onboarding warn:', err);
    }

    showNotification();
  };

  // Confirm payment
  const handleConfirmPayment = async (tipoPago) => {
    const updatedPagos = { ...(activeProyecto.pagos || {}) };
    const nowStr = new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });

    if (tipoPago === 'anticipo') {
      updatedPagos.anticipoEstado = 'confirmado';
      updatedPagos.anticipoFecha = nowStr;
      updatedPagos.anticipoMetodo = 'transferencia_bancaria';
    } else if (tipoPago === 'saldo') {
      updatedPagos.saldoEstado = 'confirmado';
      updatedPagos.saldoFecha = nowStr;
      updatedPagos.saldoMetodo = 'transferencia_bancaria';
    }

    const baseProj = {
      ...activeProyecto,
      pagos: updatedPagos
    };

    const updatedProj = evaluateProjectMilestones(baseProj);

    setActiveProyecto(updatedProj);
    setProyectos(prev => {
      const next = prev.map(p => p.id === updatedProj.id ? updatedProj : p);
      saveStoredProyectos(next);
      return next;
    });

    try {
      await fetch(`/api/proyectos/${activeProyecto.id}/pago`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipoPago,
          estado: 'confirmado',
          metodo: 'transferencia_bancaria'
        })
      });
    } catch (err) {
      console.warn('API pago warn:', err);
    }

    showNotification();
  };

  const showNotification = () => {
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2500);
  };

  const getPortalUrlForProyecto = (proj = null) => {
    const target = proj || activeProyecto;
    if (!target) return '';
    const prop = presupuestos.find(p => 
      p.id === target.presupuestoId || 
      p.codigo === target.presupuestoCodigo || 
      (target.cliente?.empresa && p.cliente?.empresa && p.cliente.empresa.toLowerCase().trim() === target.cliente.empresa.toLowerCase().trim())
    );
    const token = target.portalToken || prop?.portalToken || target.codigo || target.id;
    let payloadQuery = '';
    if (prop) {
      try {
        const compactPayload = {
          id: prop.id,
          codigo: prop.codigo,
          cliente: prop.cliente,
          titulo: prop.titulo,
          pais: prop.pais,
          inversion: prop.inversion,
          modulos: prop.modulos || [],
          fases: prop.fases || [],
          vigenciaDias: prop.vigenciaDias || 15,
          estado: prop.estado || 'aceptado'
        };
        const jsonStr = JSON.stringify(compactPayload);
        const encoded = btoa(encodeURIComponent(jsonStr).replace(/%([0-9A-F]{2})/g, (m, p) => String.fromCharCode('0x' + p)));
        payloadQuery = `?d=${encodeURIComponent(encoded)}`;
      } catch (e) {}
    }
    return `${window.location.origin}/portal/${token}${payloadQuery}`;
  };

  const copyPortalLink = () => {
    const url = getPortalUrlForProyecto(activeProyecto);
    if (!url) return;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  // Filtered list
  const filteredProyectos = proyectos.filter(p => {
    const matchesStatus = filterEstado === 'todos' || p.estado === filterEstado;
    const matchesSearch = 
      p.cliente?.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.cliente?.empresa?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.codigo?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  // Calculate Metrics
  const totalActivos = proyectos.length;
  const totalFirmados = proyectos.filter(p => p.contrato?.firmaCliente?.firmado).length;
  const totalEnDesarrollo = proyectos.filter(p => p.estado === 'en_desarrollo').length;
  const anticiposPendientes = proyectos
    .filter(p => p.pagos?.anticipoEstado !== 'confirmado')
    .reduce((sum, p) => sum + (p.pagos?.anticipoMonto || 0), 0);

  return (
    <div className="space-y-6">
      
      {/* Toast Notification */}
      {savedNotice && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-emerald-600 text-white px-4 py-2.5 rounded-xl shadow-2xl font-semibold text-xs animate-bounce">
          <Check className="w-4 h-4" />
          <span>¡Guardado y sincronizado con éxito!</span>
        </div>
      )}

      {/* =========================================================================
          VISTA 1: LISTADO DE PROYECTOS & CONTRATOS
          ========================================================================= */}
      {viewMode === 'list' && (
        <div className="space-y-6 max-w-6xl mx-auto">
          
          {/* Top Banner / Hero */}
          <div className="p-6 rounded-2xl bg-gradient-to-r from-[#0d121f] via-[#101726] to-[#141b2d] border border-orange-500/20 shadow-xl relative overflow-hidden">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
              <div>
                <div className="flex items-center gap-2 text-xs font-bold text-orange-400 uppercase tracking-wider mb-1">
                  <Briefcase className="w-4 h-4 text-orange-400" />
                  <span>Módulo 3 · Cierre, Legal & Ejecución</span>
                </div>
                <h1 className="text-xl sm:text-2xl font-extrabold text-white">
                  Contratos Formales, Onboarding & Seguimiento
                </h1>
                <p className="text-xs text-slate-400 max-w-2xl mt-1 leading-relaxed">
                  Convierte propuestas aceptadas en acuerdos legales con firma digital manuscrita certificada, 
                  recolecta activos de marca con el intake wizard y comparte el portal de progreso del proyecto a coste $0.
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => {
                    fetchPresupuestos();
                    fetchProyectos();
                    setShowImportModal(true);
                  }}
                  className="px-4 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs flex items-center gap-2 shadow-glow-sm transition-all"
                >
                  <Plus className="w-4 h-4" />
                  <span>Importar Presupuesto Aceptado</span>
                </button>
              </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-5 border-t border-slate-800/80">
              <div className="bg-[#0b0f19]/70 border border-slate-800/80 rounded-xl p-3">
                <div className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Proyectos Totales</div>
                <div className="text-xl font-black text-slate-100 font-mono mt-0.5">{totalActivos}</div>
              </div>

              <div className="bg-[#0b0f19]/70 border border-slate-800/80 rounded-xl p-3">
                <div className="text-[10px] text-emerald-400 font-medium uppercase tracking-wider">Contratos Firmados</div>
                <div className="text-xl font-black text-emerald-300 font-mono mt-0.5">{totalFirmados}</div>
              </div>

              <div className="bg-[#0b0f19]/70 border border-slate-800/80 rounded-xl p-3">
                <div className="text-[10px] text-sky-400 font-medium uppercase tracking-wider">En Desarrollo Activo</div>
                <div className="text-xl font-black text-sky-300 font-mono mt-0.5">{totalEnDesarrollo}</div>
              </div>

              <div className="bg-[#0b0f19]/70 border border-slate-800/80 rounded-xl p-3">
                <div className="text-[10px] text-amber-400 font-medium uppercase tracking-wider">Anticipos por Recaudar</div>
                <div className="text-xl font-black text-amber-300 font-mono mt-0.5">${anticiposPendientes} USD</div>
              </div>
            </div>
          </div>

          {/* Filters & Search */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 overflow-x-auto text-xs pb-1">
              {[
                { id: 'todos', label: 'Todos' },
                { id: 'contrato_pendiente', label: 'Pendiente Firma' },
                { id: 'firmado', label: 'Firmado' },
                { id: 'en_desarrollo', label: 'En Desarrollo' },
                { id: 'entregado', label: 'Completado' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setFilterEstado(tab.id)}
                  className={`px-3 py-1.5 rounded-lg font-medium transition-colors shrink-0 ${
                    filterEstado === tab.id
                      ? 'bg-orange-600 text-white font-bold'
                      : 'bg-[#0f1422] text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="w-full sm:w-64">
              <input
                type="text"
                placeholder="Buscar por cliente, empresa o código..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg bg-[#0f1422] border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-orange-500"
              />
            </div>
          </div>

          {/* Projects Cards List */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredProyectos.length === 0 ? (
              <div className="col-span-2 p-12 text-center rounded-2xl border border-dashed border-slate-800 bg-[#0c1017]">
                <FileCheck2 className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                <h3 className="text-sm font-bold text-slate-300">No hay contratos registrados</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                  Importa una propuesta aprobada desde el Módulo 2 para generar automáticamente su contrato con cláusulas legales y firma electrónica.
                </p>
                <button
                  onClick={() => {
                    fetchPresupuestos();
                    fetchProyectos();
                    setShowImportModal(true);
                  }}
                  className="mt-4 px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs inline-flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Importar Presupuesto Ahora</span>
                </button>
              </div>
            ) : (
              filteredProyectos.map(p => {
                const isFirmado = Boolean(p.contrato?.firmaCliente?.firmado || p.estado === 'firmado' || p.estado === 'en_desarrollo' || p.estado === 'entregado');
                const isOnboardingOk = Boolean(p.onboarding?.completado);
                const isAnticipoOk = p.pagos?.anticipoEstado === 'confirmado';
                const isAnticipoReportado = Boolean(p.pagos?.anticipoComprobante || p.pagos?.anticipoEstado === 'verificacion');
                const avance = p.seguimiento?.porcentajeAvance || (p.estado === 'entregado' ? 100 : p.estado === 'en_desarrollo' ? 50 : isFirmado ? 35 : 15);

                const displayStatus = p.estado === 'entregado' ? 'entregado' :
                                      p.estado === 'en_desarrollo' ? 'en_desarrollo' :
                                      isFirmado ? 'firmado' : 'contrato_pendiente';

                return (
                  <div
                    key={p.id}
                    onClick={() => handleOpenProyecto(p, 'contrato')}
                    className="p-5 rounded-2xl bg-[#0d121c] border border-slate-800 hover:border-orange-500/40 transition-all cursor-pointer group flex flex-col justify-between shadow-md hover:shadow-orange-950/20"
                  >
                    <div>
                      {/* Top Row: Code & Status */}
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-mono text-xs font-bold text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded border border-orange-500/20">
                          {p.codigo}
                        </span>
                        
                        <div className="flex items-center gap-1.5">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            displayStatus === 'entregado' ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' :
                            displayStatus === 'en_desarrollo' ? 'bg-sky-500/15 text-sky-400 border-sky-500/30' :
                            displayStatus === 'firmado' ? 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30' :
                            'bg-amber-500/15 text-amber-400 border-amber-500/30'
                          }`}>
                            {displayStatus === 'entregado' ? 'Completado' :
                             displayStatus === 'en_desarrollo' ? 'En Desarrollo' :
                             displayStatus === 'firmado' ? '✓ Contrato Firmado' : 'Pendiente de Firma'}
                          </span>

                          <button
                            onClick={(e) => handleDeleteProyecto(p.id, e)}
                            className="p-1 rounded text-slate-500 hover:text-red-400 hover:bg-slate-800/60 transition-colors"
                            title="Eliminar proyecto"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Client Info */}
                      <h3 className="text-base font-extrabold text-white group-hover:text-orange-300 transition-colors">
                        {p.cliente?.empresa || p.cliente?.nombre}
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                        <span>{p.cliente?.nombre}</span> · <span className="text-slate-500">{p.cliente?.ubicacion}</span>
                      </p>

                      <div className="text-[11px] text-slate-500 mt-2 line-clamp-2">
                        {p.contrato?.alcanceResumen}
                      </div>

                      {/* Badges / Checkpoints */}
                      <div className="grid grid-cols-3 gap-2 mt-4 text-[10px]">
                        <div className={`p-2 rounded-lg border flex flex-col items-center justify-center text-center ${
                          isFirmado ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-300' : 'bg-slate-900 border-slate-800 text-slate-500'
                        }`}>
                          <PenTool className="w-3.5 h-3.5 mb-1" />
                          <span>{isFirmado ? 'Contrato Firmado' : 'Firma Pendiente'}</span>
                        </div>

                        <div className={`p-2 rounded-lg border flex flex-col items-center justify-center text-center ${
                          isAnticipoOk ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-300' :
                          isAnticipoReportado ? 'bg-amber-950/20 border-amber-500/30 text-amber-300' :
                          'bg-slate-900 border-slate-800 text-slate-500'
                        }`}>
                          <DollarSign className="w-3.5 h-3.5 mb-1" />
                          <span>{isAnticipoOk ? 'Anticipo Pagado' : isAnticipoReportado ? 'Anticipo Reportado' : 'Anticipo $0'}</span>
                        </div>

                        <div className={`p-2 rounded-lg border flex flex-col items-center justify-center text-center ${
                          isOnboardingOk ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-300' : 'bg-slate-900 border-slate-800 text-slate-500'
                        }`}>
                          <FileCheck2 className="w-3.5 h-3.5 mb-1" />
                          <span>{isOnboardingOk ? 'Activos Listos' : 'Onboarding Pendiente'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Progress Bar & Total */}
                    <div className="mt-5 pt-3 border-t border-slate-800/80">
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="text-[11px] text-slate-400 font-medium">Progreso Global:</span>
                        <span className="font-mono font-bold text-orange-400">{avance}%</span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-orange-500 to-amber-400 rounded-full transition-all duration-500"
                          style={{ width: `${avance}%` }}
                        />
                      </div>

                      <div className="flex items-center justify-between mt-3 text-xs">
                        <div className="font-mono font-bold text-slate-200">
                          Inversión: ${p.contrato?.totalInversion} USD
                        </div>
                        <span className="text-[11px] text-orange-400 group-hover:translate-x-1 transition-transform flex items-center gap-1 font-semibold">
                          Gestionar Proyecto <ChevronRight className="w-3.5 h-3.5" />
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          VISTA 2: DETALLE DEL PROYECTO (CONTRATO, ONBOARDING, SEGUIMIENTO)
          ========================================================================= */}
      {viewMode === 'detalle' && activeProyecto && (
        <div className="space-y-6 max-w-5xl mx-auto">
          
          {/* Header Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-[#0f1422] border border-slate-800">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setViewMode('list')}
                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                title="Volver al listado"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-xs font-bold text-orange-400">{activeProyecto.codigo}</span>
                  <span className="text-slate-500">·</span>
                  <h2 className="text-base font-extrabold text-white">
                    {activeProyecto.cliente?.empresa || activeProyecto.cliente?.nombre}
                  </h2>
                  <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                    activeProyecto.estado === 'entregado' ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' :
                    activeProyecto.estado === 'en_desarrollo' ? 'bg-sky-500/15 text-sky-400 border-sky-500/30' :
                    (activeProyecto.contrato?.firmaCliente?.firmado || activeProyecto.estado === 'firmado') ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' :
                    'bg-amber-500/15 text-amber-400 border-amber-500/30'
                  }`}>
                    {activeProyecto.estado === 'entregado' ? '✓ Completado' :
                     activeProyecto.estado === 'en_desarrollo' ? '⚙ En Desarrollo' :
                     (activeProyecto.contrato?.firmaCliente?.firmado || activeProyecto.estado === 'firmado') ? '✓ Contrato Firmado' : 'Pendiente de Firma'}
                  </span>
                </div>
                <div className="text-xs text-slate-400">
                  {activeProyecto.cliente?.nombre} · {activeProyecto.cliente?.telefono} · {activeProyecto.cliente?.ubicacion}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <a
                href={getPortalUrlForProyecto(activeProyecto)}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-orange-400 hover:text-orange-300 text-xs font-semibold flex items-center gap-1.5 transition-colors border border-slate-700"
                title="Abrir vista interactiva del portal del cliente en nueva pestaña"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Ver Portal en Vivo</span>
              </a>

              <button
                onClick={copyPortalLink}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedLink ? '¡Enlace Copiado!' : 'Copiar Link Portal'}</span>
              </button>

              <button
                onClick={() => window.print()}
                className="px-3 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-glow-sm"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Imprimir Contrato</span>
              </button>
            </div>
          </div>

          {/* Tabs Navigation */}
          <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
            {[
              { id: 'contrato', label: '1. Contrato & Firma Digital', icon: PenTool },
              { id: 'onboarding', label: '2. Onboarding & Activos', icon: FileCheck2 },
              { id: 'seguimiento', label: '3. Portal & Hitos de Proyecto', icon: CheckSquare },
              { id: 'pagos', label: '4. Pasarela & Anticipo', icon: CreditCard }
            ].map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setDetailTab(tab.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all ${
                    detailTab === tab.id
                      ? 'bg-orange-600/20 text-orange-400 border border-orange-500/30'
                      : 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-200'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* TAB 1: CONTRATO FORMAL & FIRMA ELECTRÓNICA */}
          {detailTab === 'contrato' && (
            <div className="space-y-6">
              
              {/* Document Paper Container (Print-ready) */}
              <div className="bg-white text-slate-900 rounded-2xl shadow-2xl p-8 sm:p-12 print:p-0 print:shadow-none print:rounded-none max-w-4xl mx-auto border border-slate-200">
                
                {/* Header Document */}
                <div className="flex items-center justify-between border-b-2 border-slate-900 pb-4 mb-6">
                  <div className="flex items-center gap-3">
                    <img 
                      src="/assets/goglite_logo.png" 
                      alt="Goglite Digital" 
                      className="h-8 w-auto object-contain"
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                    <div>
                      <div className="font-black text-sm uppercase tracking-wider text-slate-900">Goglite Digital</div>
                      <div className="text-[10px] text-slate-500 font-mono">Agencia de Desarrollo Web Nativo & IA</div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="font-mono text-xs font-bold text-orange-600">{activeProyecto.codigo}</div>
                    <div className="text-[10px] text-slate-500">{activeProyecto.contrato?.fechaEmision}</div>
                  </div>
                </div>

                {/* Title */}
                <div className="text-center my-6">
                  <h1 className="text-base sm:text-lg font-black uppercase tracking-tight text-slate-950">
                    {activeProyecto.contrato?.titulo}
                  </h1>
                  <p className="text-xs text-slate-600 mt-1">
                    Entre Goglite Digital y {activeProyecto.cliente?.empresa || activeProyecto.cliente?.nombre}
                  </p>
                </div>

                {/* Parties Section */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs mb-6 space-y-2">
                  <p className="leading-relaxed">
                    <strong>DE UNA PARTE:</strong> <strong>GOGLITE DIGITAL</strong>, representada por su Director General <strong>Víctor Matos</strong>, con facultades suficientes para celebrar este acto en calidad de <strong>EL PRESTADOR</strong>.
                  </p>
                  <p className="leading-relaxed">
                    <strong>DE OTRA PARTE:</strong> <strong>{activeProyecto.cliente?.nombre}</strong>, en representación de <strong>{activeProyecto.cliente?.empresa}</strong>, con domicilio en {activeProyecto.cliente?.ubicacion}, en adelante <strong>EL CLIENTE</strong>.
                  </p>
                  <p className="text-slate-600 text-[11px] pt-1 border-t border-slate-200">
                    Ambas partes se reconocen recíprocamente la capacidad legal necesaria para otorgar el presente contrato de servicios con base en las siguientes cláusulas:
                  </p>
                </div>

                {/* Clauses */}
                <div className="space-y-4 text-xs text-slate-800">
                  {activeProyecto.contrato?.clausulas?.map((c, i) => (
                    <div key={i} className="space-y-1">
                      <h4 className="font-black text-slate-950 uppercase tracking-wide text-[11px]">
                        CLÁUSULA {c.numero}: {c.titulo}
                      </h4>
                      <p className="text-slate-700 leading-relaxed text-justify">
                        {c.texto}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Summary Table: Investment */}
                <div className="my-6 p-4 rounded-xl bg-slate-900 text-white text-xs">
                  <div className="font-bold text-orange-400 uppercase text-[10px] tracking-wider mb-2">
                    Resumen Financiero del Acuerdo
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <div className="text-slate-400 text-[10px]">Inversión Total:</div>
                      <div className="text-sm font-bold text-white font-mono">${activeProyecto.contrato?.totalInversion} USD</div>
                    </div>
                    <div>
                      <div className="text-slate-400 text-[10px]">Anticipo (50%):</div>
                      <div className="text-sm font-bold text-emerald-400 font-mono">${activeProyecto.contrato?.anticipo} USD</div>
                    </div>
                    <div>
                      <div className="text-slate-400 text-[10px]">Saldo Final (50%):</div>
                      <div className="text-sm font-bold text-amber-300 font-mono">${activeProyecto.contrato?.saldo} USD</div>
                    </div>
                  </div>
                </div>

                {/* Signature Section */}
                <div className="mt-8 pt-6 border-t-2 border-slate-300 grid grid-cols-1 sm:grid-cols-2 gap-8">
                  
                  {/* Agency Signature */}
                  <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 flex flex-col justify-between">
                    <div>
                      <div className="text-[10px] uppercase font-bold text-slate-500 mb-2">Por Goglite Digital:</div>
                      <div className="h-16 flex items-center justify-center border-b border-slate-300 pb-2">
                        <span className="font-serif italic text-lg text-slate-800">Victor Matos</span>
                      </div>
                    </div>
                    <div className="mt-2 text-center text-[10px] text-slate-600">
                      <div className="font-bold text-slate-900">Víctor Matos</div>
                      <div>Director General · Goglite</div>
                      <div className="text-emerald-700 font-mono font-bold mt-0.5">Certificado por Goglite Digital</div>
                    </div>
                  </div>

                  {/* Client Signature */}
                  <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 flex flex-col justify-between">
                    <div>
                      <div className="text-[10px] uppercase font-bold text-slate-500 mb-2">Por El Cliente:</div>
                      
                      {activeProyecto.contrato?.firmaCliente?.firmado ? (
                        <div className="h-16 flex items-center justify-center border-b border-slate-300 pb-2">
                          <img 
                            src={activeProyecto.contrato.firmaCliente.firmaBase64} 
                            alt="Firma Digital Cliente" 
                            className="max-h-14 max-w-full object-contain"
                          />
                        </div>
                      ) : (
                        <div className="h-16 flex items-center justify-center border-b border-dashed border-amber-400 bg-amber-50 rounded text-amber-700 text-xs font-semibold">
                          Pendiente de Firma Manuscrita
                        </div>
                      )}
                    </div>

                    <div className="mt-2 text-center text-[10px] text-slate-600">
                      <div className="font-bold text-slate-900">
                        {activeProyecto.contrato?.firmaCliente?.nombreFirmante || activeProyecto.cliente?.nombre}
                      </div>
                      <div>{activeProyecto.contrato?.firmaCliente?.identificacion || 'Representante Legal'}</div>
                      
                      {activeProyecto.contrato?.firmaCliente?.firmado ? (
                        <div className="text-[9px] text-emerald-700 font-mono mt-1">
                          Firmado: {new Date(activeProyecto.contrato.firmaCliente.timestampUtc).toLocaleString('es-ES')}
                          <br />IP: {activeProyecto.contrato.firmaCliente.ipAddress}
                        </div>
                      ) : (
                        <div className="text-amber-600 text-[10px] font-bold mt-1">Pendiente de Aprobación</div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Legal Certification Footer */}
                <div className="mt-8 pt-4 border-t border-slate-200 text-center text-[9px] text-slate-400 font-mono">
                  Documento emitido electrónicamente con validez jurídica bajo la Ley de Firma Electrónica de El Salvador (Decreto N° 182) y Ley 126-02 de Rep. Dominicana. Sello criptográfico Goglite.
                </div>
              </div>

              {/* Digital E-Signature Pad (If not signed yet) */}
              {!activeProyecto.contrato?.firmaCliente?.firmado && (
                <div className="p-6 rounded-2xl bg-[#0f1422] border border-orange-500/30 max-w-4xl mx-auto shadow-xl space-y-4">
                  <div className="flex items-center gap-2 text-sm font-bold text-orange-400">
                    <PenTool className="w-4 h-4" />
                    <span>Lienzo de Firma Manuscrita Digital (E-Signature $0)</span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Dibuja tu firma con el ratón o con el dedo en pantallas táctiles. Al confirmar, se estampará un sello de tiempo UTC y la dirección IP para certificar la validez legal del contrato.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-semibold text-slate-300 block mb-1">Nombre Completo del Firmante</label>
                      <input
                        type="text"
                        value={signerName}
                        onChange={e => setSignerName(e.target.value)}
                        placeholder="Ej. Bryan Muñoz"
                        className="w-full px-3 py-2 rounded-lg bg-[#080b11] border border-slate-800 text-xs text-white focus:outline-none focus:border-orange-500"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-slate-300 block mb-1">DUI / Cédula / Identificación Oficial</label>
                      <input
                        type="text"
                        value={signerDoc}
                        onChange={e => setSignerDoc(e.target.value)}
                        placeholder="Ej. DUI: 05482910-4 / Cédula: 402-..."
                        className="w-full px-3 py-2 rounded-lg bg-[#080b11] border border-slate-800 text-xs text-white focus:outline-none focus:border-orange-500"
                      />
                    </div>
                  </div>

                  {/* HTML5 Canvas */}
                  <div className="border-2 border-dashed border-slate-700 rounded-xl overflow-hidden bg-white relative">
                    <canvas
                      ref={canvasRef}
                      width={600}
                      height={180}
                      className="w-full h-44 cursor-crosshair touch-none"
                      onMouseDown={startDrawing}
                      onMouseMove={draw}
                      onMouseUp={stopDrawing}
                      onMouseLeave={stopDrawing}
                      onTouchStart={startDrawing}
                      onTouchMove={draw}
                      onTouchEnd={stopDrawing}
                    />
                    <div className="absolute top-2 right-2 flex gap-1.5">
                      <button
                        onClick={clearCanvas}
                        className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-white text-[10px] font-semibold transition-colors"
                      >
                        Limpiar Trazo
                      </button>
                    </div>
                    <div className="absolute bottom-2 left-3 text-[10px] text-slate-400 select-none pointer-events-none">
                      Firma aquí con el ratón o tu dedo
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      onClick={handleSignContract}
                      className="px-5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs flex items-center gap-2 shadow-glow-sm transition-all"
                    >
                      <FileCheck2 className="w-4 h-4" />
                      <span>Sellar y Firmar Contrato Digitalmente</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: CUESTIONARIO DE ONBOARDING & ACTIVOS */}
          {detailTab === 'onboarding' && (
            <div className="p-6 rounded-2xl bg-[#0d121c] border border-slate-800 space-y-6 max-w-4xl mx-auto shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div>
                  <div className="flex items-center gap-2 text-xs font-bold text-orange-400 uppercase tracking-wider mb-0.5">
                    <FileCheck2 className="w-4 h-4" />
                    <span>Cuestionario de Onboarding & Intake de Activos ($0)</span>
                  </div>
                  <h3 className="text-base font-extrabold text-white">
                    Activos de Marca e Infraestructura Técnica
                  </h3>
                </div>

                <button
                  onClick={handleSaveOnboarding}
                  className="px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-glow-sm transition-all"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Guardar Activos</span>
                </button>
              </div>

              {/* Wizard Sections */}
              <div className="space-y-5">
                
                {/* Paso 1: Identidad Visual */}
                <div className="p-4 rounded-xl bg-[#111622] border border-slate-800 space-y-3">
                  <h4 className="text-xs font-black uppercase text-slate-300 flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-orange-500/20 text-orange-400 flex items-center justify-center text-[10px]">1</span>
                    Identidad de Marca & Colores
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">Nombre Comercial de la Marca</label>
                      <input
                        type="text"
                        value={activeProyecto.onboarding?.datos?.nombreComercial || ''}
                        onChange={e => handleUpdateOnboardingField('nombreComercial', e.target.value)}
                        placeholder="Ej. Grúas Andrea"
                        className="w-full px-3 py-2 rounded-lg bg-[#080b11] border border-slate-800 text-xs text-white focus:outline-none focus:border-orange-500"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">Slogan o Propuesta de Valor</label>
                      <input
                        type="text"
                        value={activeProyecto.onboarding?.datos?.slogan || ''}
                        onChange={e => handleUpdateOnboardingField('slogan', e.target.value)}
                        placeholder="Ej. Llegamos en minutos a cualquier carretera"
                        className="w-full px-3 py-2 rounded-lg bg-[#080b11] border border-slate-800 text-xs text-white focus:outline-none focus:border-orange-500"
                      />
                    </div>
                  </div>

                  {/* Color Palette Picker */}
                  <div className="pt-2">
                    <label className="text-[11px] text-slate-400 block mb-2">Paleta de Colores Corporativos</label>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <div className="text-[10px] text-slate-500 mb-1">Color Primario:</div>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={activeProyecto.onboarding?.datos?.colorPrimario || '#FF6600'}
                            onChange={e => handleUpdateOnboardingField('colorPrimario', e.target.value)}
                            className="w-8 h-8 rounded border-0 bg-transparent cursor-pointer"
                          />
                          <span className="font-mono text-xs text-slate-300">{activeProyecto.onboarding?.datos?.colorPrimario}</span>
                        </div>
                      </div>

                      <div>
                        <div className="text-[10px] text-slate-500 mb-1">Color Secundario:</div>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={activeProyecto.onboarding?.datos?.colorSecundario || '#0B0E16'}
                            onChange={e => handleUpdateOnboardingField('colorSecundario', e.target.value)}
                            className="w-8 h-8 rounded border-0 bg-transparent cursor-pointer"
                          />
                          <span className="font-mono text-xs text-slate-300">{activeProyecto.onboarding?.datos?.colorSecundario}</span>
                        </div>
                      </div>

                      <div>
                        <div className="text-[10px] text-slate-500 mb-1">Color de Acento:</div>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={activeProyecto.onboarding?.datos?.colorAcento || '#22C55E'}
                            onChange={e => handleUpdateOnboardingField('colorAcento', e.target.value)}
                            className="w-8 h-8 rounded border-0 bg-transparent cursor-pointer"
                          />
                          <span className="font-mono text-xs text-slate-300">{activeProyecto.onboarding?.datos?.colorAcento}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Paso 2: Activos Digitales & Materiales */}
                <div className="p-4 rounded-xl bg-[#111622] border border-slate-800 space-y-3">
                  <h4 className="text-xs font-black uppercase text-slate-300 flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-orange-500/20 text-orange-400 flex items-center justify-center text-[10px]">2</span>
                    Logos, Fotos & Materiales en Google Drive
                  </h4>

                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Enlace a Carpeta de Google Drive / Dropbox con Logos y Fotos</label>
                    <input
                      type="text"
                      value={activeProyecto.onboarding?.datos?.enlaceDriveArchivos || ''}
                      onChange={e => handleUpdateOnboardingField('enlaceDriveArchivos', e.target.value)}
                      placeholder="https://drive.google.com/drive/folders/..."
                      className="w-full px-3 py-2 rounded-lg bg-[#080b11] border border-slate-800 text-xs text-white focus:outline-none focus:border-orange-500 font-mono"
                    />
                    <p className="text-[10px] text-slate-500 mt-1">
                      Sube aquí el logotipo en formato PNG sin fondo, fotos del equipo, flota de vehículos o catálogo de servicios.
                    </p>
                  </div>
                </div>

                {/* Paso 3: Infraestructura & Dominio */}
                <div className="p-4 rounded-xl bg-[#111622] border border-slate-800 space-y-3">
                  <h4 className="text-xs font-black uppercase text-slate-300 flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-orange-500/20 text-orange-400 flex items-center justify-center text-[10px]">3</span>
                    Canales de Cierre & Infraestructura
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">WhatsApp Business Principal (Click-to-Chat)</label>
                      <input
                        type="text"
                        value={activeProyecto.onboarding?.datos?.whatsappVentas || ''}
                        onChange={e => handleUpdateOnboardingField('whatsappVentas', e.target.value)}
                        placeholder="Ej. +503 7756-9828"
                        className="w-full px-3 py-2 rounded-lg bg-[#080b11] border border-slate-800 text-xs text-white focus:outline-none focus:border-orange-500"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">Teléfono Directo de Emergencia / Llamada Rápida</label>
                      <input
                        type="text"
                        value={activeProyecto.onboarding?.datos?.telefonoEmergencia || ''}
                        onChange={e => handleUpdateOnboardingField('telefonoEmergencia', e.target.value)}
                        placeholder="Ej. +1 (323) 901-3886"
                        className="w-full px-3 py-2 rounded-lg bg-[#080b11] border border-slate-800 text-xs text-white focus:outline-none focus:border-orange-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Proveedor de Dominio / Hosting (si ya dispone de uno)</label>
                    <input
                      type="text"
                      value={activeProyecto.onboarding?.datos?.proveedorDominio || ''}
                      onChange={e => handleUpdateOnboardingField('proveedorDominio', e.target.value)}
                      placeholder="Ej. Cloudflare, Namecheap, GoDaddy (o dejar vacío si Goglite lo gestiona)"
                      className="w-full px-3 py-2 rounded-lg bg-[#080b11] border border-slate-800 text-xs text-white focus:outline-none focus:border-orange-500"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Instrucciones u Observaciones Especiales</label>
                    <textarea
                      rows={3}
                      value={activeProyecto.onboarding?.datos?.observaciones || ''}
                      onChange={e => handleUpdateOnboardingField('observaciones', e.target.value)}
                      placeholder="Notas adicionales sobre estilo, competidores directos o peticiones del cliente..."
                      className="w-full px-3 py-2 rounded-lg bg-[#080b11] border border-slate-800 text-xs text-white focus:outline-none focus:border-orange-500"
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={handleSaveOnboarding}
                    className="px-6 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs flex items-center gap-2 shadow-glow-sm transition-all"
                  >
                    <Save className="w-4 h-4" />
                    <span>Guardar y Validar Cuestionario de Onboarding</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: PORTAL DEL CLIENTE & SEGUIMIENTO DE HITOS */}
          {detailTab === 'seguimiento' && (
            <div className="space-y-6 max-w-4xl mx-auto">
              
              {/* Progress Summary Card */}
              <div className="p-6 rounded-2xl bg-gradient-to-br from-[#0f1422] to-[#0a0d17] border border-slate-800 shadow-xl space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-bold text-orange-400 uppercase tracking-wider font-mono">
                      Portal del Cliente · Enlace Activo
                    </span>
                    <h3 className="text-lg font-black text-white mt-0.5">
                      Seguimiento de Implementación en Tiempo Real
                    </h3>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-black text-orange-400 font-mono">
                      {activeProyecto.seguimiento?.porcentajeAvance}%
                    </span>
                    <span className="text-xs text-slate-400">completado</span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-orange-500 to-amber-400 rounded-full transition-all duration-500"
                    style={{ width: `${activeProyecto.seguimiento?.porcentajeAvance}%` }}
                  />
                </div>

                {/* Public Link Share Box */}
                <div className="p-3.5 rounded-xl bg-[#080b11] border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="space-y-0.5 overflow-hidden">
                    <div className="text-[10px] text-slate-400 uppercase font-mono font-bold">Enlace Público Oficial del Portal de Cliente:</div>
                    <div className="truncate font-mono text-orange-400 text-xs">
                      {getPortalUrlForProyecto(activeProyecto)}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <a
                      href={getPortalUrlForProyecto(activeProyecto)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs flex items-center gap-1.5 transition-colors shadow-glow-sm"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Abrir Portal</span>
                    </a>
                    <button
                      onClick={copyPortalLink}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors"
                    >
                      {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedLink ? 'Copiado' : 'Copiar URL'}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Milestones Checklist con Sincronización Inteligente por Eventos */}
              <div className="p-6 rounded-2xl bg-[#0d121c] border border-slate-800 shadow-xl space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-800/80">
                  <div>
                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                      <CheckSquare className="w-4 h-4 text-orange-400" />
                      <span>Hoja de Ruta de Hitos Entregables</span>
                    </h4>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      <span className="inline-flex items-center gap-1 text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                        <Sparkles className="w-3 h-3 text-emerald-400" />
                        Sincronización por Eventos Activa
                      </span>
                      <span className="text-[11px] text-slate-500">
                        (Haz clic en cualquier hito si deseas forzar avance manual)
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={handleReSyncEvents}
                      title="Re-evaluar eventos de cliente y tareas del sprint ahora"
                      className="px-2.5 py-1 text-[11px] font-mono text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700 rounded-lg flex items-center gap-1.5 transition-colors border border-slate-700/60 shadow-sm"
                    >
                      <RefreshCw className="w-3 h-3 text-orange-400" />
                      <span>Re-evaluar Eventos</span>
                    </button>
                    <span className="text-xs font-mono text-slate-400 bg-slate-800/60 px-2.5 py-1 rounded-lg border border-slate-700">
                      Fase {activeProyecto.seguimiento?.faseActual} de 3
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  {activeProyecto.seguimiento?.hitos?.map((h) => (
                    <div
                      key={h.id}
                      onClick={() => handleToggleHito(h.id, h.completado)}
                      className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 cursor-pointer transition-all ${
                        h.completado
                          ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-200 shadow-sm'
                          : 'bg-[#111622] border-slate-800 hover:border-slate-700 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-5 h-5 rounded-md flex items-center justify-center border shrink-0 ${
                          h.completado 
                            ? 'bg-emerald-500 border-emerald-400 text-white' 
                            : 'border-slate-700 bg-slate-800 text-transparent'
                        }`}>
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </div>
                        <div className="min-w-0">
                          <div className={`text-xs font-semibold truncate ${h.completado ? 'text-emerald-100' : 'text-slate-200'}`}>
                            {h.titulo}
                          </div>
                          {h.eventReason && h.completado && (
                            <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5 font-mono">
                              <span className="text-cyan-400">↳</span>
                              <span>{h.eventReason}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-[11px] font-mono shrink-0">
                        {h.origen === 'auto' ? (
                          <span className="px-2 py-0.5 rounded text-[10px] bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 flex items-center gap-1" title={h.eventReason || 'Evento del sistema'}>
                            <Zap className="w-2.5 h-2.5 text-cyan-400" />
                            <span>Auto</span>
                          </span>
                        ) : h.completado ? (
                          <span className="px-2 py-0.5 rounded text-[10px] bg-amber-500/15 text-amber-300 border border-amber-500/30">
                            Manual
                          </span>
                        ) : null}

                        <span className={`px-2 py-0.5 rounded text-[10px] ${
                          h.fase === 1 ? 'bg-indigo-500/20 text-indigo-300' :
                          h.fase === 2 ? 'bg-orange-500/20 text-orange-300' :
                          'bg-emerald-500/20 text-emerald-300'
                        }`}>
                          Fase {h.fase}
                        </span>
                        <span className="text-slate-500 text-[10px]">{h.fecha}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Card: Vinculación con las 12 Fases de Desarrollo del Playbook Maestro */}
                {(() => {
                  const tasks = getStoredSprintTasks();
                  const compCount = tasks.filter(t => t.columna === 'completado').length;
                  const pctSprint = Math.round((Math.min(compCount, 12) / 12) * 45);
                  return (
                    <div className="p-4 rounded-xl bg-[#090d15] border border-slate-800/80 space-y-3 mt-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400 shrink-0">
                            <Kanban className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="text-xs font-bold text-white flex items-center gap-2">
                              <span>Sprint Técnico: 12 Fases del Playbook Maestro Goglite</span>
                              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-orange-500/15 text-orange-300 border border-orange-500/30 font-bold">
                                {compCount} / 12 Fases Listas
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-400">
                              Al completar tarjetas en el Centro de Desarrollo & PRD (Fase 4), los hitos técnicos avanzan automáticamente.
                            </div>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20">
                            +{pctSprint}% aporte al proyecto
                          </span>
                        </div>
                      </div>

                      {/* Barra de progreso de las 12 fases */}
                      <div className="space-y-1">
                        <div className="w-full bg-slate-800/80 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="bg-gradient-to-r from-orange-500 via-amber-400 to-emerald-400 h-1.5 rounded-full transition-all duration-500"
                            style={{ width: `${(compCount / 12) * 100}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-[10px] font-mono text-slate-500">
                          <span>Fases 1-4: Wireframes & Identidad</span>
                          <span>Fases 5-8: Frontend & Integraciones</span>
                          <span>Fases 9-12: WPO, QA & Entrega</span>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Deliverables Section */}
              <div className="p-6 rounded-2xl bg-[#0d121c] border border-slate-800 shadow-xl space-y-4">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <Globe className="w-4 h-4 text-orange-400" />
                  <span>Accesos y Entregables del Proyecto</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-[#111622] border border-slate-800 space-y-1">
                    <div className="text-[10px] text-slate-400 font-semibold uppercase">Demo de Prueba en Vivo</div>
                    <a
                      href={activeProyecto.seguimiento?.entregables?.demoUrl || '#'}
                      target="_blank"
                      rel="noreferrer"
                      className="text-orange-400 font-bold hover:underline flex items-center gap-1 font-mono text-[11px]"
                    >
                      <span>{activeProyecto.seguimiento?.entregables?.demoUrl || 'En preparación...'}</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>

                  <div className="p-3 rounded-xl bg-[#111622] border border-slate-800 space-y-1">
                    <div className="text-[10px] text-slate-400 font-semibold uppercase">Repositorio de Código Fuente</div>
                    <div className="text-slate-300 font-mono text-[11px]">
                      {activeProyecto.seguimiento?.entregables?.repositorioUrl || 'Privado en GitHub'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: PASARELA & GESTIÓN DE ANTICIPO */}
          {detailTab === 'pagos' && (
            <div className="p-6 rounded-2xl bg-[#0d121c] border border-slate-800 space-y-6 max-w-4xl mx-auto shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div>
                  <div className="flex items-center gap-2 text-xs font-bold text-orange-400 uppercase tracking-wider mb-0.5">
                    <CreditCard className="w-4 h-4" />
                    <span>Facturación, Anticipo & Cuentas Bancarias ($0 Cuota Fija)</span>
                  </div>
                  <h3 className="text-base font-extrabold text-white">
                    Gestión de Anticipos y Desglose Financiero
                  </h3>
                </div>
              </div>

              {/* Status Summary */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Anticipo Box */}
                <div className="p-5 rounded-2xl bg-[#111622] border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-400">1. Anticipo (50%)</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      activeProyecto.pagos?.anticipoEstado === 'confirmado'
                        ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                        : 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                    }`}>
                      {activeProyecto.pagos?.anticipoEstado === 'confirmado' ? 'Confirmado' : 'Pendiente de Pago'}
                    </span>
                  </div>

                  <div className="text-2xl font-mono font-black text-white">
                    ${activeProyecto.pagos?.anticipoMonto} USD
                  </div>

                  <p className="text-[11px] text-slate-400">
                    Requerido formalmente para la reserva de agenda y comienzo de la Fase 1.
                  </p>

                  {(activeProyecto.pagos?.anticipoComprobante || activeProyecto.pagos?.anticipoComprobanteImagen) && (
                    <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200 space-y-2">
                      <div className="font-bold flex items-center gap-1.5 text-amber-400">
                        <FileText className="w-3.5 h-3.5" />
                        <span>Comprobante Reportado por Cliente:</span>
                      </div>
                      {activeProyecto.pagos?.anticipoComprobante && (
                        <div className="font-mono text-white text-[11px]">{activeProyecto.pagos.anticipoComprobante}</div>
                      )}
                      {activeProyecto.pagos?.anticipoComprobanteImagen && (
                        <div className="space-y-1.5 pt-1">
                          <a
                            href={activeProyecto.pagos.anticipoComprobanteImagen}
                            download={activeProyecto.pagos?.anticipoComprobanteNombre || 'Comprobante_Anticipo.jpg'}
                            target="_blank"
                            rel="noreferrer"
                            className="block rounded-lg overflow-hidden border border-slate-700 bg-[#090d16] max-h-44 flex items-center justify-center group relative"
                          >
                            <img
                              src={activeProyecto.pagos.anticipoComprobanteImagen}
                              alt="Captura de Comprobante"
                              className="max-h-40 w-auto object-contain"
                            />
                          </a>
                          <div className="text-[10px] text-emerald-400 font-mono">
                            ✓ Captura bancaria adjunta ({activeProyecto.pagos?.anticipoComprobanteNombre || 'Imagen verificada'})
                          </div>
                        </div>
                      )}
                      {activeProyecto.pagos?.anticipoFecha && (
                        <div className="text-[10px] text-slate-400">Reportado el: {activeProyecto.pagos.anticipoFecha}</div>
                      )}
                    </div>
                  )}

                  {activeProyecto.pagos?.anticipoEstado !== 'confirmado' ? (
                    <button
                      onClick={() => handleConfirmPayment('anticipo')}
                      className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-md"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{activeProyecto.pagos?.anticipoComprobante ? 'Validar Anticipo y Pasar a Desarrollo' : 'Marcar Anticipo como Confirmado'}</span>
                    </button>
                  ) : (
                    <div className="text-[11px] text-emerald-400 font-mono flex items-center gap-1.5 pt-1">
                      <Check className="w-3.5 h-3.5" />
                      <span>Validado el {activeProyecto.pagos?.anticipoFecha || '10 Oct 2026'}</span>
                    </div>
                  )}
                </div>

                {/* Saldo Final Box */}
                <div className="p-5 rounded-2xl bg-[#111622] border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-400">2. Saldo Final (50%)</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      activeProyecto.pagos?.saldoEstado === 'confirmado'
                        ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                        : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}>
                      {activeProyecto.pagos?.saldoEstado === 'confirmado' ? 'Liquidado' : 'Pendiente contra Entrega'}
                    </span>
                  </div>

                  <div className="text-2xl font-mono font-black text-white">
                    ${activeProyecto.pagos?.saldoMonto} USD
                  </div>

                  <p className="text-[11px] text-slate-400">
                    Se abona contra entrega final una vez desplegado el sitio en el dominio oficial.
                  </p>

                  {activeProyecto.pagos?.saldoEstado !== 'confirmado' ? (
                    <button
                      onClick={() => handleConfirmPayment('saldo')}
                      className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Marcar Saldo como Liquidado</span>
                    </button>
                  ) : (
                    <div className="text-[11px] text-emerald-400 font-mono flex items-center gap-1.5 pt-1">
                      <Check className="w-3.5 h-3.5" />
                      <span>Proyecto 100% Liquidado</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Bank Accounts Section (SV & DO) */}
              <div className="p-5 rounded-2xl bg-[#080b11] border border-slate-800 space-y-4">
                <h4 className="text-xs font-black uppercase text-slate-300 flex items-center gap-2">
                  <Building className="w-4 h-4 text-orange-400" />
                  <span>Cuentas Bancarias de la Agencia para Transferencias Directas ($0 Comisiones)</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  {/* El Salvador */}
                  <div className="p-3.5 rounded-xl bg-[#101522] border border-slate-800/80 space-y-1.5">
                    <div className="flex items-center justify-between font-bold text-slate-200">
                      <span>El Salvador 🇸🇻</span>
                      <span className="text-[10px] text-orange-400 font-mono">Transfer365 / Chivo</span>
                    </div>
                    <div className="text-slate-400 text-[11px]">
                      <strong>Banco:</strong> Banco Agrícola / Banco Cuscatlán<br />
                      <strong>Cuenta Corriente:</strong> 054-01-92841-0<br />
                      <strong>Titular:</strong> Víctor Matos / Goglite Digital<br />
                      <strong>Moneda:</strong> USD ($)
                    </div>
                  </div>

                  {/* República Dominicana */}
                  <div className="p-3.5 rounded-xl bg-[#101522] border border-slate-800/80 space-y-1.5">
                    <div className="flex items-center justify-between font-bold text-slate-200">
                      <span>República Dominicana 🇩🇴</span>
                      <span className="text-[10px] text-orange-400 font-mono">ACH Directo</span>
                    </div>
                    <div className="text-slate-400 text-[11px]">
                      <strong>Banco:</strong> Banreservas / Banco Popular Dominicano<br />
                      <strong>Cuenta Ahorros:</strong> 960-249102-3<br />
                      <strong>Titular:</strong> Víctor Matos<br />
                      <strong>Moneda:</strong> DOP (Pesos) / USD
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          MODAL: IMPORTAR PRESUPUESTO ACEPTADO
          ========================================================================= */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0f1422] border border-slate-800 rounded-2xl w-full max-w-xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-orange-400" />
                <h3 className="text-sm font-bold text-white">
                  Seleccionar Presupuesto para Generar Contrato
                </h3>
              </div>
              <button
                onClick={() => setShowImportModal(false)}
                className="text-slate-400 hover:text-white text-xs font-bold"
              >
                Cerrar
              </button>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Selecciona una propuesta existente. Se importarán automáticamente los módulos técnicos, inversión acordada, datos del cliente y se redactará el contrato legal oficial listo para firma.
            </p>

            <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
              {presupuestos.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-500">
                  No hay presupuestos creados en el Módulo 3.
                </div>
              ) : (
                [...presupuestos]
                  .sort((a, b) => (b.estado === 'aceptado' ? 1 : 0) - (a.estado === 'aceptado' ? 1 : 0))
                  .map(prop => {
                    const isAceptado = prop.estado === 'aceptado';
                    return (
                      <div
                        key={prop.id}
                        onClick={() => handleImportProposal(prop.id)}
                        className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between group ${
                          isAceptado 
                            ? 'bg-emerald-950/20 border-emerald-500/50 hover:border-emerald-400 hover:bg-emerald-900/30 shadow-md' 
                            : 'bg-[#090d16] border-slate-800 hover:border-orange-500/50 hover:bg-slate-800/30'
                        }`}
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-orange-400">{prop.codigo}</span>
                            <span className="text-xs font-bold text-white group-hover:text-orange-300">
                              {prop.cliente?.empresa || prop.cliente?.nombre}
                            </span>
                            {isAceptado && (
                              <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30 flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                                <span>Aceptado por Cliente</span>
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-400 truncate max-w-sm mt-0.5">
                            {prop.titulo}
                          </div>
                          <div className="text-[10px] text-slate-500 mt-0.5">
                            {prop.cliente?.ubicacion || (prop.pais === 'DO' ? 'República Dominicana' : 'El Salvador')} · {prop.cliente?.telefono}
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <div className="font-mono font-bold text-xs text-slate-200">
                            ${prop.inversion?.precioTotal || 300} {prop.moneda || 'USD'}
                          </div>
                          <span className={`text-[10px] font-semibold group-hover:underline flex items-center gap-1 justify-end ${
                            isAceptado ? 'text-emerald-400 font-bold' : 'text-orange-400'
                          }`}>
                            Generar Contrato <ChevronRight className="w-3 h-3" />
                          </span>
                        </div>
                      </div>
                    );
                  })
              )}
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-800">
              <button
                onClick={() => setShowImportModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
