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
  Kanban,
  FolderOpen,
  FileUp,
  Download,
  X
} from 'lucide-react';
import {
  getStoredProyectos,
  saveStoredProyectos,
  buildProyectoFromPresupuesto,
  reconcileProyectoWithPresupuesto
} from '../services/contractGenerator';
import {
  evaluateProjectMilestones,
  syncAllProyectosWithEvents,
  getStoredSprintTasks
} from '../services/projectMilestoneSync';
import { 
  getProyectosCloud, 
  saveProyectoCloud, 
  deleteProyectoCloud,
  subscribeProyectosCloud, 
  savePortalCloud 
} from '../services/firestoreSyncService';
import { DEFAULT_AGENCY_BRANDING } from '../constants/defaultAgencyBranding';

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
  const [syncingDriveFiles, setSyncingDriveFiles] = useState(false);
  const [previewFileModal, setPreviewFileModal] = useState(null);

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

    // Suscripción en tiempo real a proyectos en Firestore para actualización instantánea multiplataforma
    const unsubscribeProyectos = subscribeProyectosCloud((cloudList) => {
      if (Array.isArray(cloudList) && cloudList.length > 0) {
        setProyectos(prev => {
          const map = new Map();
          [...cloudList, ...prev].forEach(p => {
            if (p?.id && !map.has(p.id)) map.set(p.id, p);
          });
          return Array.from(map.values());
        });
      }
    });

    const handleStorageChange = () => {
      fetchProyectos();
      fetchPresupuestos();
    };
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('goglite_proyectos_synced', handleStorageChange);
    window.addEventListener('goglite_tasks_updated', handleStorageChange);
    return () => {
      if (typeof unsubscribeProyectos === 'function') unsubscribeProyectos();
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('goglite_proyectos_synced', handleStorageChange);
      window.removeEventListener('goglite_tasks_updated', handleStorageChange);
    };
  }, []);

  const fetchProyectos = async () => {
    let localList = getStoredProyectos();

    // 1. Consultar Firestore para proyectos en la nube
    try {
      const cloudList = await getProyectosCloud();
      if (Array.isArray(cloudList) && cloudList.length > 0) {
        const map = new Map();
        [...cloudList, ...localList].forEach(p => {
          if (p?.id && !map.has(p.id)) map.set(p.id, p);
        });
        localList = Array.from(map.values());
      }
    } catch (cErr) {
      console.warn('[Contratos] Error leyendo proyectos de Firestore:', cErr);
    }

    // Auto-generar y vincular contratos para cualquier propuesta que ya haya sido aceptada
    try {
      const rawProps = localStorage.getItem('goglite_presupuestos');
      if (rawProps) {
        const parsedProps = JSON.parse(rawProps);
        let createdAny = false;
        parsedProps.forEach(prop => {
          if (prop?.estado === 'aceptado') {
            const targetEmp = (prop.cliente?.empresa || '').toLowerCase().trim();
            const existingIdx = localList.findIndex(p => 
              (p.presupuestoId && p.presupuestoId === prop.id) ||
              (p.presupuestoCodigo && p.presupuestoCodigo === prop.codigo) ||
              (targetEmp && p.cliente?.empresa && p.cliente.empresa.toLowerCase().trim() === targetEmp)
            );
            if (existingIdx >= 0) {
              localList[existingIdx] = reconcileProyectoWithPresupuesto(localList[existingIdx], prop);
              createdAny = true;
            } else {
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
      // y auto-sincronizar datos de comprobante de anticipo desde portalConfig si faltan en pagos
      localList = localList.map(p => {
        let evaluated = evaluateProjectMilestones(p);
        try {
          const tokensToCheck = [evaluated.portalToken, evaluated.presupuestoId, evaluated.id, evaluated.codigo, evaluated.leadId].filter(Boolean);
          for (const tk of tokensToCheck) {
            const raw = localStorage.getItem('goglite_portal_' + tk);
            if (raw) {
              const pcfg = JSON.parse(raw);
              if (pcfg.comprobanteAnticipo || pcfg.comprobanteAnticipoImagen) {
                const currentPagos = evaluated.pagos || {};
                evaluated = {
                  ...evaluated,
                  pagos: {
                    ...currentPagos,
                    anticipoComprobante: currentPagos.anticipoComprobante || pcfg.comprobanteAnticipo || '',
                    anticipoComprobanteImagen: currentPagos.anticipoComprobanteImagen || pcfg.comprobanteAnticipoImagen || '',
                    anticipoComprobanteNombre: currentPagos.anticipoComprobanteNombre || pcfg.comprobanteAnticipoNombre || 'Comprobante_Anticipo.jpg',
                    anticipoFecha: currentPagos.anticipoFecha || pcfg.fechaFirmaContrato || '',
                    anticipoEstado: currentPagos.anticipoEstado === 'confirmado' ? 'confirmado' : 'verificacion'
                  }
                };
                break;
              }
            }
          }
        } catch (e) {}
        return evaluated;
      });
      saveStoredProyectos(localList);
      // Sincronizar hacia Firestore cualquier proyecto local para disponibilidad inmediata en celulares
      localList.forEach(p => {
        if (p?.id) saveProyectoCloud(p).catch(() => {});
      });

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

      // 3. Persistir en estado, localStorage y Firestore Cloud
      const updatedList = [createdProj, ...proyectos.filter(p => p.id !== createdProj.id)];
      setProyectos(updatedList);
      saveStoredProyectos(updatedList);
      saveProyectoCloud(createdProj).catch(() => {});
      syncPortalStorageForProyecto(createdProj);

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
      deleteProyectoCloud(id).catch(() => {});
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

    saveProyectoCloud(updatedProj).catch(() => {});
    syncPortalStorageForProyecto(updatedProj);

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

    saveProyectoCloud(updatedProj).catch(() => {});
    syncPortalStorageForProyecto(updatedProj);

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
    saveProyectoCloud(reEvaluated).catch(() => {});
    syncPortalStorageForProyecto(reEvaluated);
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

  // Helper para sincronizar todas las llaves goglite_portal_* asociadas a un proyecto
  const syncPortalStorageForProyecto = (proj, updates = {}) => {
    if (!proj || typeof window === 'undefined') return;
    try {
      const targetEmp = (proj.cliente?.empresa || '').toLowerCase().trim();
      const targetPresId = proj.presupuestoId;
      const targetProjId = proj.id;
      const targetToken = proj.portalToken;

      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('goglite_portal_')) {
          try {
            const raw = localStorage.getItem(key);
            if (raw) {
              const cfg = JSON.parse(raw);
              const matches = 
                (targetToken && key === 'goglite_portal_' + targetToken) ||
                (targetProjId && key === 'goglite_portal_' + targetProjId) ||
                (targetPresId && key === 'goglite_portal_' + targetPresId) ||
                (cfg.proyectoId && cfg.proyectoId === targetProjId) ||
                (cfg.presupuestoId && cfg.presupuestoId === targetPresId) ||
                (cfg.leadId && proj.leadId && cfg.leadId === proj.leadId) ||
                (targetEmp && cfg.empresa && cfg.empresa.toLowerCase().trim() === targetEmp);

              if (matches) {
                localStorage.setItem(key, JSON.stringify({
                  ...cfg,
                  ...updates,
                  ultimaModificacion: new Date().toISOString()
                }));
              }
            }
          } catch (e) {}
        }
      }

      const directTokens = [proj.portalToken, proj.presupuestoId, proj.id, proj.codigo].filter(Boolean);
      directTokens.forEach(tk => {
        const key = 'goglite_portal_' + tk;
        const raw = localStorage.getItem(key);
        const prevCfg = raw ? JSON.parse(raw) : {};
        localStorage.setItem(key, JSON.stringify({
          ...prevCfg,
          ...updates,
          ultimaModificacion: new Date().toISOString()
        }));
      });

      // Sincronizar en Firestore para acceso inmediato desde celulares y otros dispositivos
      const syncToken = proj.portalToken || (proj.leadId ? 'portal-' + proj.leadId : 'portal-' + proj.id);
      saveProyectoCloud({
        ...proj,
        faseActual: updates.faseActual || proj.faseActual || 1,
        portalConfig: { ...(proj.portalConfig || {}), ...updates }
      }).catch(() => {});

      savePortalCloud(syncToken, {
        token: syncToken,
        lead: {
          id: proj.leadId || proj.id,
          empresa: proj.cliente?.empresa || '',
          contacto: proj.cliente?.nombre || '',
          telefono: proj.cliente?.telefono || '',
          email: proj.cliente?.email || '',
          pais: proj.cliente?.pais || 'SV',
          portalToken: syncToken
        },
        proyecto: {
          id: proj.id,
          faseActual: updates.faseActual || proj.faseActual || 1,
          portalConfig: { ...(proj.portalConfig || {}), ...updates },
          pagos: proj.pagos || {},
          onboarding: proj.onboarding || {},
          contrato: proj.contrato || {},
          estado: proj.estado || 'activo'
        },
        portalConfig: { ...(proj.portalConfig || {}), ...updates }
      }).catch(() => {});
    } catch (e) {
      console.warn('[SyncPortalStorage] Error sincronizando claves:', e);
    }
  };

  // Save onboarding
  const handleSaveOnboarding = async () => {
    if (!activeProyecto) return;
    const nowStr = new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
    const currentInsumos = getInsumosList(activeProyecto);

    // Comprobar si el cliente ya notificó que subió los documentos o si ya estaban validados
    const isClienteAlreadyConfirmed = Boolean(
      activeProyecto.onboarding?.clienteConfirmoInsumos ||
      activeProyecto.portalConfig?.clienteConfirmoInsumos
    );
    const shouldValidate100 = Boolean(
      isClienteAlreadyConfirmed ||
      activeProyecto.onboarding?.insumosValidados100
    );

    const updatedOnboarding = {
      ...(activeProyecto.onboarding || {}),
      completado: true,
      insumosValidados100: shouldValidate100,
      clienteConfirmoInsumos: isClienteAlreadyConfirmed || Boolean(activeProyecto.onboarding?.clienteConfirmoInsumos),
      fecha: activeProyecto.onboarding?.fecha || nowStr,
      fechaValidacionAgencia: shouldValidate100 ? (activeProyecto.onboarding?.fechaValidacionAgencia || nowStr) : activeProyecto.onboarding?.fechaValidacionAgencia,
      datos: activeProyecto.onboarding?.datos || {},
      archivosSubidos: currentInsumos,
      archivosRecibidos: currentInsumos,
      estadoInsumos: shouldValidate100 ? 'validados_agencia' : (activeProyecto.onboarding?.estadoInsumos || 'en_revision')
    };

    const updatedPortalConfig = {
      ...(activeProyecto.portalConfig || {}),
      clienteConfirmoInsumos: isClienteAlreadyConfirmed,
      fase3InsumosCompletos: shouldValidate100,
      fechaInsumosCompletos: shouldValidate100 ? nowStr : activeProyecto.portalConfig?.fechaInsumosCompletos,
      faseActual: shouldValidate100 ? 4 : (activeProyecto.portalConfig?.faseActual || 3),
      progresoPorcentaje: shouldValidate100 ? 80 : (activeProyecto.portalConfig?.progresoPorcentaje || 60)
    };

    const baseProj = {
      ...activeProyecto,
      faseActual: shouldValidate100 ? 4 : (activeProyecto.faseActual || 3),
      onboarding: updatedOnboarding,
      portalConfig: updatedPortalConfig
    };

    const updatedProj = evaluateProjectMilestones(baseProj);

    setActiveProyecto(updatedProj);
    setProyectos(prev => {
      const next = prev.map(p => p.id === updatedProj.id ? updatedProj : p);
      saveStoredProyectos(next);
      return next;
    });

    // Sincronizar todas las llaves de portal en localStorage
    syncPortalStorageForProyecto(updatedProj, {
      clienteConfirmoInsumos: true,
      fase3InsumosCompletos: shouldValidate100,
      fechaInsumosCompletos: nowStr,
      faseActual: shouldValidate100 ? 4 : 3,
      progresoPorcentaje: shouldValidate100 ? 80 : 60
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

    window.dispatchEvent(new CustomEvent('goglite_proyectos_synced', { detail: { proyectos: [updatedProj] } }));
    window.dispatchEvent(new Event('storage'));
    showNotification();
  };

  // Helper para obtener los insumos recibidos del proyecto (desde proyecto y portalConfig)
  const getInsumosList = (proj = null) => {
    const target = proj || activeProyecto;
    if (!target) return [];
    let list = [];
    if (Array.isArray(target.onboarding?.archivosSubidos) && target.onboarding.archivosSubidos.length > 0) {
      list = target.onboarding.archivosSubidos;
    } else if (Array.isArray(target.onboarding?.archivosRecibidos) && target.onboarding.archivosRecibidos.length > 0) {
      list = target.onboarding.archivosRecibidos;
    }

    // Complementar con archivos en portalConfig de localStorage si existen
    try {
      if (typeof window !== 'undefined') {
        const tokensToCheck = [
          target.portalToken,
          target.presupuestoId,
          target.id,
          target.codigo
        ].filter(Boolean);
        for (const tk of tokensToCheck) {
          const raw = localStorage.getItem('goglite_portal_' + tk);
          if (raw) {
            const pcfg = JSON.parse(raw);
            if (Array.isArray(pcfg.archivosSubidos) && pcfg.archivosSubidos.length > list.length) {
              list = pcfg.archivosSubidos;
              break;
            }
          }
        }
      }
    } catch (e) {}

    return list;
  };

  // Helper para obtener datos e imagen del comprobante de anticipo (desde proyecto y portalConfig)
  const getAnticipoComprobanteData = (proj = null) => {
    const target = proj || activeProyecto;
    if (!target) return { texto: '', imagen: '', nombre: '', fecha: '' };

    let texto = target.pagos?.anticipoComprobante || '';
    let imagen = target.pagos?.anticipoComprobanteImagen || '';
    let nombre = target.pagos?.anticipoComprobanteNombre || '';
    let fecha = target.pagos?.anticipoFecha || '';

    // Complementar con datos guardados en el portal del cliente si no están en pagos
    try {
      if (typeof window !== 'undefined') {
        const tokensToCheck = [
          target.portalToken,
          target.presupuestoId,
          target.id,
          target.codigo,
          target.leadId
        ].filter(Boolean);
        for (const tk of tokensToCheck) {
          const raw = localStorage.getItem('goglite_portal_' + tk);
          if (raw) {
            const pcfg = JSON.parse(raw);
            if (!texto && pcfg.comprobanteAnticipo) texto = pcfg.comprobanteAnticipo;
            if (!imagen && pcfg.comprobanteAnticipoImagen) imagen = pcfg.comprobanteAnticipoImagen;
            if (!nombre && pcfg.comprobanteAnticipoNombre) nombre = pcfg.comprobanteAnticipoNombre;
            if (!fecha && (pcfg.fechaFirmaContrato || pcfg.fechaAutenticacion)) {
              fecha = pcfg.fechaFirmaContrato || pcfg.fechaAutenticacion;
            }
            if (imagen || texto) break;
          }
        }
      }
    } catch (e) {}

    return { texto, imagen, nombre, fecha };
  };

  // Helper para obtener datos e imagen del comprobante de liquidación/saldo final (desde proyecto y portalConfig)
  const getSaldoComprobanteData = (proj = null) => {
    const target = proj || activeProyecto;
    if (!target) return { texto: '', imagen: '', nombre: '', fecha: '' };

    let texto = target.pagos?.saldoComprobante || '';
    let imagen = target.pagos?.saldoComprobanteImagen || '';
    let nombre = target.pagos?.saldoComprobanteNombre || '';
    let fecha = target.pagos?.saldoFecha || '';

    try {
      if (typeof window !== 'undefined') {
        const tokensToCheck = [
          target.portalToken,
          target.presupuestoId,
          target.id,
          target.codigo,
          target.leadId
        ].filter(Boolean);
        for (const tk of tokensToCheck) {
          const raw = localStorage.getItem('goglite_portal_' + tk);
          if (raw) {
            const pcfg = JSON.parse(raw);
            if (!texto && pcfg.comprobanteLiquidacion) texto = pcfg.comprobanteLiquidacion;
            if (!imagen && pcfg.comprobanteLiquidacionImagen) imagen = pcfg.comprobanteLiquidacionImagen;
            if (!nombre && pcfg.comprobanteLiquidacionNombre) nombre = pcfg.comprobanteLiquidacionNombre;
            if (!fecha && pcfg.fechaLiquidacion) fecha = pcfg.fechaLiquidacion;
            if (imagen || texto) break;
          }
        }
      }
    } catch (e) {}

    return { texto, imagen, nombre, fecha };
  };

  // Sincronizar insumos en vivo directamente con Google Drive (sitesgoglite@gmail.com -> 01_Insumos_Cliente)
  const handleSyncDriveInsumos = async () => {
    if (!activeProyecto) return;
    try {
      setSyncingDriveFiles(true);
      const clientName = activeProyecto.cliente?.empresa || activeProyecto.cliente?.nombre || 'Cliente';
      const cleanClientName = clientName.replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s]/g, '').trim();

      const res = await fetch('https://script.google.com/macros/s/AKfycbz2qqnBdelAif_BvpwkFCk-0WZ1b2fgiPaPVT3EK0mSyN0jboo_XBdZQL5OCP1rHLT0sw/exec', {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
          action: 'listFiles',
          clientName: cleanClientName,
          targetSubfolder: '01_Insumos_Cliente'
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data && data.success && Array.isArray(data.files)) {
          const driveFiles = data.files.filter(f => !f.name.includes('00_LEER_PRIMERO'));
          const currentList = getInsumosList(activeProyecto);
          const merged = [...currentList];

          driveFiles.forEach(df => {
            const exists = merged.some(m => m.driveFileId === df.id || m.nombre === df.name);
            if (!exists) {
              merged.push({
                id: 'drive-' + df.id,
                nombre: df.name,
                tamano: df.size > 1048576 ? (df.size / 1048576).toFixed(1) + ' MB' : Math.round(df.size / 1024) + ' KB',
                categoria: df.name.toLowerCase().includes('logo') ? 'Logotipo Vectorial' : 'Insumos en Drive',
                notas: 'Sincronizado directamente desde Google Drive',
                fecha: new Date(df.dateCreated).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }),
                hora: new Date(df.dateCreated).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
                estado: 'Recibido en Drive',
                driveUrl: df.url,
                driveFileId: df.id,
                driveFolderUrl: data.folderUrl
              });
            } else {
              const idx = merged.findIndex(m => m.driveFileId === df.id || m.nombre === df.name);
              if (idx !== -1 && !merged[idx].driveUrl) {
                merged[idx].driveUrl = df.url;
                merged[idx].driveFileId = df.id;
              }
            }
          });

          const updatedProj = {
            ...activeProyecto,
            onboarding: {
              ...(activeProyecto.onboarding || {}),
              archivosSubidos: merged,
              archivosRecibidos: merged,
              enlaceDriveInsumos: data.folderUrl || activeProyecto.onboarding?.enlaceDriveInsumos,
              enlaceDriveArchivos: data.vaultUrl || activeProyecto.onboarding?.enlaceDriveArchivos
            }
          };

          setActiveProyecto(updatedProj);
          setProyectos(prev => {
            const next = prev.map(p => p.id === updatedProj.id ? updatedProj : p);
            saveStoredProyectos(next);
            return next;
          });

          window.dispatchEvent(new CustomEvent('goglite_proyectos_synced', { detail: { proyectos: [updatedProj] } }));
          alert(`✓ ¡Bóveda sincronizada con éxito! Se detectaron ${driveFiles.length} archivo(s) en la carpeta 01_Insumos_Cliente de sitesgoglite@gmail.com.`);
        }
      }
    } catch (err) {
      console.warn('Error sincronizando insumos:', err);
      alert('Error consultando Google Drive: ' + err.message);
    } finally {
      setSyncingDriveFiles(false);
    }
  };

  // Eliminar insumo del proyecto
  const handleDeleteInsumo = async (archId) => {
    if (!activeProyecto) return;
    if (!confirm('¿Deseas eliminar este insumo del proyecto?')) return;
    const currentList = getInsumosList(activeProyecto);
    const updated = currentList.filter(a => a.id !== archId);
    const updatedProj = {
      ...activeProyecto,
      onboarding: {
        ...(activeProyecto.onboarding || {}),
        archivosSubidos: updated,
        archivosRecibidos: updated
      }
    };
    setActiveProyecto(updatedProj);
    setProyectos(prev => {
      const next = prev.map(p => p.id === updatedProj.id ? updatedProj : p);
      saveStoredProyectos(next);
      return next;
    });
    try {
      const tokensToCheck = [activeProyecto.portalToken, activeProyecto.presupuestoId, activeProyecto.id].filter(Boolean);
      tokensToCheck.forEach(tk => {
        const raw = localStorage.getItem('goglite_portal_' + tk);
        if (raw) {
          const cfg = JSON.parse(raw);
          localStorage.setItem('goglite_portal_' + tk, JSON.stringify({
            ...cfg,
            archivosSubidos: updated
          }));
        }
      });
    } catch (e) {}
    window.dispatchEvent(new CustomEvent('goglite_proyectos_synced', { detail: { proyectos: [updatedProj] } }));
    window.dispatchEvent(new Event('storage'));
  };

  // Validar insumos al 100% desde la agencia para iniciar formalmente los 10 días
  const handleValidateInsumosAgency = async () => {
    if (!activeProyecto) return;
    const nowStr = new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
    const currentInsumos = getInsumosList(activeProyecto);
    const updatedProj = evaluateProjectMilestones({
      ...activeProyecto,
      faseActual: 4,
      onboarding: {
        ...(activeProyecto.onboarding || {}),
        completado: true,
        insumosValidados100: true,
        clienteConfirmoInsumos: true,
        fecha: nowStr,
        fechaValidacionAgencia: nowStr,
        archivosSubidos: currentInsumos,
        archivosRecibidos: currentInsumos,
        estadoInsumos: 'validados_agencia'
      },
      portalConfig: {
        ...(activeProyecto.portalConfig || {}),
        clienteConfirmoInsumos: true,
        fase3InsumosCompletos: true,
        fechaInsumosCompletos: nowStr,
        faseActual: 4,
        progresoPorcentaje: 80
      }
    });

    setActiveProyecto(updatedProj);
    setProyectos(prev => {
      const next = prev.map(p => p.id === updatedProj.id ? updatedProj : p);
      saveStoredProyectos(next);
      return next;
    });

    // Sincronizar todas las llaves de portal existentes en localStorage
    syncPortalStorageForProyecto(updatedProj, {
      clienteConfirmoInsumos: true,
      fase3InsumosCompletos: true,
      fechaInsumosCompletos: nowStr,
      faseActual: 4,
      progresoPorcentaje: 80
    });

    window.dispatchEvent(new CustomEvent('goglite_proyectos_synced', { detail: { proyectos: [updatedProj] } }));
    window.dispatchEvent(new Event('storage'));
    showNotification();
    alert('✓ ¡Insumos validados al 100% en Google Drive! El cronómetro oficial de 10 días hábiles de desarrollo ha comenzado formalmente y la Fase 4 está desbloqueada.');
  };

  // Confirm payment (Anticipo 50% o Saldo Final 50% de Liquidación)
  const handleConfirmPayment = async (tipoPago) => {
    if (!activeProyecto) return;
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
      estado: tipoPago === 'saldo' ? 'entregado' : (activeProyecto.estado || 'en_desarrollo'),
      pagos: updatedPagos,
      portalConfig: {
        ...(activeProyecto.portalConfig || {}),
        ...(tipoPago === 'saldo' ? {
          fase4Liquidada: true,
          liquidacionPagada: true,
          fechaLiquidacion: nowStr,
          faseActual: 5,
          progresoPorcentaje: 100
        } : {
          anticipoPagado: true,
          faseActual: Math.max(3, activeProyecto.portalConfig?.faseActual || 3),
          progresoPorcentaje: Math.max(60, activeProyecto.portalConfig?.progresoPorcentaje || 60)
        })
      }
    };

    const updatedProj = evaluateProjectMilestones(baseProj);

    setActiveProyecto(updatedProj);
    setProyectos(prev => {
      const next = prev.map(p => p.id === updatedProj.id ? updatedProj : p);
      saveStoredProyectos(next);
      return next;
    });

    // Sincronizar todas las llaves de portal existentes en localStorage
    if (tipoPago === 'saldo') {
      syncPortalStorageForProyecto(updatedProj, {
        fase4Liquidada: true,
        liquidacionPagada: true,
        fechaLiquidacion: nowStr,
        faseActual: 5,
        progresoPorcentaje: 100
      });
      alert('✓ ¡Liquidación confirmada con éxito! El candado de accesos ha sido liberado y la Fase 5 (Garantía de 30 Días & CMS) está desbloqueada en el portal del cliente.');
    } else {
      syncPortalStorageForProyecto(updatedProj, {
        anticipoPagado: true,
        faseActual: Math.max(3, updatedProj.portalConfig?.faseActual || 3),
        progresoPorcentaje: Math.max(60, updatedProj.portalConfig?.progresoPorcentaje || 60)
      });
      alert('✓ ¡Anticipo del 50% confirmado! El proyecto avanza formalmente a desarrollo y configuración de insumos.');
    }

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

    window.dispatchEvent(new CustomEvent('goglite_proyectos_synced', { detail: { proyectos: [updatedProj] } }));
    window.dispatchEvent(new Event('storage'));
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
          cliente: prop.cliente || target.cliente,
          titulo: prop.titulo || target.titulo,
          pais: prop.pais || target.pais,
          inversion: prop.inversion,
          modulos: prop.modulos || [],
          fases: prop.fases || [],
          vigenciaDias: prop.vigenciaDias || 15,
          estado: prop.estado || 'aceptado',
          // Incluir el estado completo y verificado del proyecto para sincronizar cualquier dispositivo externo
          proyecto: {
            id: target.id,
            faseActual: target.faseActual || (target.pagos?.saldoEstado === 'confirmado' ? 5 : (target.onboarding?.insumosValidados100 ? 4 : 1)),
            portalConfig: target.portalConfig || {},
            pagos: target.pagos || {},
            onboarding: target.onboarding || {},
            contrato: target.contrato || {},
            estado: target.estado || 'activo'
          }
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
          <div className="no-print print:hidden flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-[#0f1422] border border-slate-800">
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
          <div className="no-print print:hidden flex items-center gap-2 border-b border-slate-800 pb-2">
            {[
              { id: 'contrato', label: '1. Contrato & Firma Digital', icon: PenTool },
              { id: 'onboarding', label: `2. Onboarding & Insumos (${getInsumosList(activeProyecto).length})`, icon: FileCheck2 },
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
              
              {/* Document Paper Container (2 HOJAS CARTA 8.5 x 11 in) */}
              <div 
                id="printable-contract"
                className="bg-transparent p-0 text-slate-900 overflow-visible print:border-none print:p-0 print:shadow-none print:bg-transparent print:m-0 space-y-6 sm:space-y-8 print:space-y-0"
              >
                {/* =========================================================================
                    HOJA 1 DE CONTRATO SOW: ENCABEZADO, PARTES Y CLÁUSULAS 1 A 4 (8.5 x 11 in)
                    ========================================================================= */}
                <div className="print-letter-page print-content-sheet max-w-4xl mx-auto p-6 sm:p-10 bg-white shadow-2xl rounded-2xl print:rounded-none print:shadow-none print:m-0 text-slate-900 font-sans leading-relaxed text-xs aspect-auto sm:min-h-[11in] flex flex-col justify-between">
                  <div>
                    {/* Header Document */}
                    <div className="flex items-center justify-between border-b-2 border-slate-900 pb-3 mb-4 avoid-break">
                      <div className="flex items-center gap-3">
                        <img 
                          src={(typeof window !== 'undefined' ? localStorage.getItem('goglite_agency_logo_docs') : null) || (typeof window !== 'undefined' ? localStorage.getItem('goglite_agency_logo') : null) || DEFAULT_AGENCY_BRANDING.logoUrl} 
                          alt="Agencia" 
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
                        <div className="text-[10px] text-slate-500">{activeProyecto.contrato?.fechaEmision || new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
                      </div>
                    </div>

                    {/* Title */}
                    <div className="text-center my-4 avoid-break">
                      <h1 className="text-base sm:text-lg font-black uppercase tracking-tight text-slate-950">
                        {activeProyecto.contrato?.titulo || 'CONTRATO OFICIAL DE PRESTACIÓN DE SERVICIOS DIGITALES Y DESARROLLO WEB'}
                      </h1>
                      <p className="text-xs text-slate-600 mt-0.5">
                        Entre Goglite Digital y {activeProyecto.cliente?.empresa || activeProyecto.cliente?.nombre}
                      </p>
                    </div>

                    {/* Parties Section */}
                    <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs mb-4 space-y-1.5 avoid-break">
                      <p className="leading-relaxed">
                        <strong>DE UNA PARTE:</strong> <strong>GOGLITE DIGITAL</strong>, representada por su Director General <strong>Víctor Matos</strong>, con facultades suficientes para celebrar este acto en calidad de <strong>EL PRESTADOR</strong>.
                      </p>
                      <p className="leading-relaxed">
                        <strong>DE OTRA PARTE:</strong> <strong>{activeProyecto.cliente?.nombre}</strong>, en representación de <strong>{activeProyecto.cliente?.empresa}</strong>, con domicilio en {activeProyecto.cliente?.ubicacion}, en adelante <strong>EL CLIENTE</strong>.
                      </p>
                      <p className="text-slate-600 text-[10.5px] pt-1 border-t border-slate-200">
                        Ambas partes se reconocen recíprocamente la capacidad legal necesaria para otorgar el presente contrato de servicios con base en las siguientes cláusulas:
                      </p>
                    </div>

                    {/* Clauses 1 to 4 */}
                    <div className="space-y-3 text-xs text-slate-800">
                      {(activeProyecto.contrato?.clausulas || []).slice(0, 4).map((c, i) => (
                        <div key={i} className="space-y-0.5 avoid-break">
                          <h4 className="font-black text-slate-950 uppercase tracking-wide text-[11px]">
                            CLÁUSULA {c.numero}: {c.titulo}
                          </h4>
                          <p className="text-slate-700 leading-relaxed text-justify whitespace-pre-line text-[10.5px]">
                            {(c.texto || '')
                              .replace(/\s*\(\$\s*[\d,]+(?:\.\d+)?\s*USD\)/gi, '')
                              .replace(/\s*\(\$\s*[\d,]+(?:\.\d+)?\)/gi, '')}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Footer Hoja 1 */}
                  <div className="pt-3 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-400 font-mono avoid-break">
                    <span>Goglite Digital · Contrato SOW</span>
                    <span>Página 1 de 2 · Términos & Alcance</span>
                  </div>
                </div>

                {/* =========================================================================
                    HOJA 2 DE CONTRATO SOW: CLÁUSULAS 5+, INVERSIÓN Y FIRMAS (8.5 x 11 in)
                    ========================================================================= */}
                <div className="print-letter-page print-content-sheet max-w-4xl mx-auto p-6 sm:p-10 bg-white shadow-2xl rounded-2xl print:rounded-none print:shadow-none print:m-0 text-slate-900 font-sans leading-relaxed text-xs aspect-auto sm:min-h-[11in] flex flex-col justify-between">
                  <div>
                    {/* Mini-Header Hoja 2 */}
                    <div className="border-b border-slate-200 pb-2.5 mb-4 flex items-center justify-between avoid-break">
                      <div className="flex items-center gap-2">
                        <img 
                          src={(typeof window !== 'undefined' ? localStorage.getItem('goglite_agency_logo_docs') : null) || (typeof window !== 'undefined' ? localStorage.getItem('goglite_agency_logo') : null) || DEFAULT_AGENCY_BRANDING.logoUrl} 
                          alt="Agencia" 
                          className="h-6 w-auto object-contain"
                          onError={(e) => { e.target.style.display = 'none'; }}
                        />
                        <span className="font-bold text-slate-900 text-xs">Goglite Digital · Contrato Oficial</span>
                      </div>
                      <div className="text-[10px] font-mono text-slate-500">
                        {activeProyecto.codigo} · {activeProyecto.cliente?.empresa}
                      </div>
                    </div>

                    {/* Clauses 5 to end */}
                    <div className="space-y-3 text-xs text-slate-800 mb-4">
                      {(activeProyecto.contrato?.clausulas || []).slice(4).map((c, i) => (
                        <div key={i} className="space-y-0.5 avoid-break">
                          <h4 className="font-black text-slate-950 uppercase tracking-wide text-[11px]">
                            CLÁUSULA {c.numero}: {c.titulo}
                          </h4>
                          <p className="text-slate-700 leading-relaxed text-justify whitespace-pre-line text-[10.5px]">
                            {(c.texto || '')
                              .replace(/\s*\(\$\s*[\d,]+(?:\.\d+)?\s*USD\)/gi, '')
                              .replace(/\s*\(\$\s*[\d,]+(?:\.\d+)?\)/gi, '')}
                          </p>
                        </div>
                      ))}
                    </div>

                    {/* Summary Table: Investment */}
                    <div className="mb-4 p-4 rounded-xl bg-slate-900 text-white text-xs avoid-break shadow-md">
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
                    <div className="pt-3 border-t-2 border-slate-300 grid grid-cols-1 sm:grid-cols-2 gap-6 avoid-break">
                      {/* Agency Signature */}
                      <div className="border border-slate-200 rounded-xl p-3.5 bg-slate-50 flex flex-col justify-between">
                        <div>
                          <div className="text-[9.5px] uppercase font-bold text-slate-500 mb-1.5">Por Goglite Digital:</div>
                          <div className="h-14 flex items-center justify-center border-b border-slate-300 pb-1.5">
                            <span className="font-serif italic text-base text-slate-800">Victor Matos</span>
                          </div>
                        </div>
                        <div className="mt-1.5 text-center text-[10px] text-slate-600">
                          <div className="font-bold text-slate-900 text-[11px]">Víctor Matos</div>
                          <div>Director General · Goglite</div>
                          <div className="text-emerald-700 font-mono font-bold text-[9.5px] mt-0.5">Certificado por Goglite Digital</div>
                        </div>
                      </div>

                      {/* Client Signature */}
                      <div className="border border-slate-200 rounded-xl p-3.5 bg-slate-50 flex flex-col justify-between">
                        <div>
                          <div className="text-[9.5px] uppercase font-bold text-slate-500 mb-1.5">Por El Cliente:</div>
                          
                          {activeProyecto.contrato?.firmaCliente?.firmado ? (
                            <div className="h-14 flex items-center justify-center border-b border-slate-300 pb-1.5">
                              <img 
                                src={activeProyecto.contrato.firmaCliente.firmaBase64} 
                                alt="Firma Digital Cliente" 
                                className="max-h-12 max-w-full object-contain filter brightness-0"
                                style={{ filter: 'brightness(0)' }}
                              />
                            </div>
                          ) : (
                            <div className="h-14 flex items-center justify-center border-b border-dashed border-amber-400 bg-amber-50 rounded text-amber-700 text-xs font-semibold">
                              Pendiente de Firma Manuscrita
                            </div>
                          )}
                        </div>

                        <div className="mt-1.5 text-center text-[10px] text-slate-600">
                          <div className="font-bold text-slate-900 text-[11px]">
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
                    <div className="mt-4 pt-2 border-t border-slate-200 text-center text-[8.5px] text-slate-400 font-mono">
                      Documento emitido electrónicamente con validez jurídica bajo la Ley de Firma Electrónica de El Salvador (Decreto N° 182) y Ley 126-02 de Rep. Dominicana. Sello criptográfico Goglite.
                    </div>
                  </div>

                  {/* Footer Hoja 2 */}
                  <div className="pt-3 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-400 font-mono avoid-break">
                    <span>Goglite Digital · Contrato SOW</span>
                    <span>Página 2 de 2 · Cierre Legal & Firmas</span>
                  </div>
                </div>
              </div>

              {/* Digital E-Signature Pad (If not signed yet) */}
              {!activeProyecto.contrato?.firmaCliente?.firmado && (
                <div className="no-print print:hidden p-6 rounded-2xl bg-[#0f1422] border border-orange-500/30 max-w-4xl mx-auto shadow-xl space-y-4">
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

              {/* Banner de Validación de Insumos Drive / Fase 3 a Fase 4 */}
              {(() => {
                const is100Validados = Boolean(
                  activeProyecto.onboarding?.insumosValidados100 ||
                  activeProyecto.portalConfig?.fase3InsumosCompletos ||
                  activeProyecto.faseActual >= 4
                );
                const isClienteNotifico = Boolean(
                  activeProyecto.onboarding?.clienteConfirmoInsumos ||
                  activeProyecto.portalConfig?.clienteConfirmoInsumos
                );

                if (isClienteNotifico && !is100Validados) {
                  return (
                    <div className="p-4 rounded-xl bg-gradient-to-r from-amber-500/20 via-orange-500/15 to-[#0b101c] border-2 border-amber-500/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
                      <div className="flex items-start gap-3">
                        <div className="w-9 h-9 rounded-xl bg-amber-500/25 text-amber-300 flex items-center justify-center shrink-0 border border-amber-500/40 mt-0.5">
                          <Clock className="w-5 h-5 animate-pulse" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-black uppercase text-amber-300">
                              🔔 El Cliente Notificó Subida de Insumos al Google Drive
                            </span>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-200 border border-amber-500/30 font-bold">
                              En Revisión
                            </span>
                          </div>
                          <p className="text-xs text-slate-200 mt-1 leading-relaxed">
                            El cliente confirmó que subió sus documentos a Google Drive ({activeProyecto.onboarding?.fechaConfirmacionCliente || 'reciente'}). 
                            Presiona el botón a continuación para validar que los archivos están en Drive y desbloquear la Fase 4 en el portal del cliente:
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={handleValidateInsumosAgency}
                        className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-950 transition-all shrink-0 border border-emerald-400/40 transform hover:scale-[1.02]"
                      >
                        <Check className="w-4 h-4" />
                        <span>Aprobar Insumos en Drive & Desbloquear Fase 4</span>
                      </button>
                    </div>
                  );
                }

                if (is100Validados) {
                  return (
                    <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-2 text-emerald-300">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>
                          <strong>✓ Insumos Validados al 100% en Google Drive:</strong> El cronómetro oficial de 10 días hábiles está activo y la Fase 4 está desbloqueada en el portal del cliente.
                        </span>
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold shrink-0">
                        Fase 4 Desbloqueada
                      </span>
                    </div>
                  );
                }

                return null;
              })()}

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

                {/* Paso 2: Bóveda Centralizada e Insumos Recibidos en Google Drive */}
                {(() => {
                  const insumos = getInsumosList(activeProyecto);
                  const clientName = activeProyecto.cliente?.empresa || activeProyecto.cliente?.nombre || 'Cliente';
                  const cleanClientName = clientName.replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s]/g, '').trim();
                  const driveVault = activeProyecto.onboarding?.driveVault || activeProyecto.driveVault;
                  const insumosFolderUrl = activeProyecto.onboarding?.enlaceDriveInsumos ||
                    driveVault?.subfolders?.insumos?.url ||
                    (driveVault?.vaultUrl ? `${driveVault.vaultUrl}` : `https://drive.google.com/drive/search?q=${encodeURIComponent(`title = '01_Insumos_Cliente' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`)}`);
                  const mainVaultUrl = driveVault?.vaultUrl || activeProyecto.onboarding?.enlaceDriveArchivos || `https://drive.google.com/drive/search?q=${encodeURIComponent(`title = '📁 [Goglite] ${cleanClientName}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`)}`;

                  const is100InsumosValidados = Boolean(activeProyecto.onboarding?.insumosValidados100 || activeProyecto.onboarding?.completado);

                  return (
                    <div className="p-5 rounded-2xl bg-[#0f1523] border border-blue-500/30 space-y-4 shadow-xl">
                      {/* Header Bóveda */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
                            <FolderOpen className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-[10px] font-mono font-bold uppercase bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-full">
                                Bóveda Oficial Google Drive
                              </span>
                              <span className="text-[10px] font-mono text-slate-400">
                                Cuenta: <strong className="text-slate-200">sitesgoglite@gmail.com</strong>
                              </span>
                            </div>
                            <h4 className="text-sm font-bold text-white mt-0.5">
                              📁 [Goglite] {clientName} / 01_Insumos_Cliente
                            </h4>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 flex-wrap">
                          <button
                            type="button"
                            onClick={handleSyncDriveInsumos}
                            disabled={syncingDriveFiles}
                            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-mono text-xs font-semibold flex items-center gap-1.5 transition-colors border border-slate-700"
                            title="Consultar Google Drive y actualizar insumos"
                          >
                            <RefreshCw className={`w-3.5 h-3.5 text-orange-400 ${syncingDriveFiles ? 'animate-spin' : ''}`} />
                            <span>{syncingDriveFiles ? 'Sincronizando...' : 'Sincronizar Drive'}</span>
                          </button>

                          <a
                            href={insumosFolderUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-md shadow-blue-950"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            <span>Abrir Carpeta Insumos</span>
                          </a>

                          <a
                            href={mainVaultUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-all border border-slate-700"
                            title="Abrir la Bóveda Principal con las 3 subcarpetas"
                          >
                            <Globe className="w-3.5 h-3.5 text-slate-400" />
                            <span>Bóveda Raíz</span>
                          </a>
                        </div>
                      </div>

                      {/* Regla Contractual de 10 Días y Estado */}
                      <div className={`p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs ${
                        is100InsumosValidados
                          ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-200'
                          : activeProyecto.onboarding?.clienteConfirmoInsumos
                          ? 'bg-amber-950/30 border-amber-500/50 text-amber-200'
                          : 'bg-amber-950/20 border-amber-500/30 text-amber-200'
                      }`}>
                        <div className="flex items-center gap-2.5">
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                            is100InsumosValidados 
                              ? 'bg-emerald-500/20 text-emerald-400' 
                              : activeProyecto.onboarding?.clienteConfirmoInsumos
                              ? 'bg-amber-500/30 text-amber-300'
                              : 'bg-amber-500/20 text-amber-400'
                          }`}>
                            {is100InsumosValidados ? <CheckCircle2 className="w-4 h-4" /> : <Clock className={`w-4 h-4 ${activeProyecto.onboarding?.clienteConfirmoInsumos ? 'animate-pulse' : ''}`} />}
                          </div>
                          <div>
                            <div className="font-bold text-white text-xs">
                              {is100InsumosValidados 
                                ? '✓ 100% Insumos Validados · Plazo de 10 Días Oficial Iniciado' 
                                : activeProyecto.onboarding?.clienteConfirmoInsumos
                                ? '🔔 El Cliente Confirmó Subida de Insumos al Drive · Pendiente Validación'
                                : '⚖️ Esperando Recepción & Validación de Insumos (Regla 10 Días)'}
                            </div>
                            <div className="text-[11px] opacity-90 mt-0.5">
                              {is100InsumosValidados 
                                ? `Validado el ${activeProyecto.onboarding?.fechaValidacionAgencia || activeProyecto.onboarding?.fecha || 'hoy'}. El equipo de desarrollo tiene luz verde.`
                                : activeProyecto.onboarding?.clienteConfirmoInsumos
                                ? `El cliente notificó que subió los documentos (${activeProyecto.onboarding?.fechaConfirmacionCliente || 'reciente'}). Revisa la carpeta 01_Insumos_Cliente y haz clic en validar para iniciar el reloj.`
                                : 'El cliente debe subir sus archivos a la carpeta 01_Insumos_Cliente en Google Drive y confirmar. El plazo de 10 días se activará cuando la agencia confirme los archivos.'}
                            </div>
                          </div>
                        </div>

                        {!is100InsumosValidados && (
                          <button
                            type="button"
                            onClick={handleValidateInsumosAgency}
                            className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-md shrink-0 self-start sm:self-center"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Validar Insumos en Drive y Activar Reloj de 10 Días</span>
                          </button>
                        )}
                      </div>

                      {/* Lista de Insumos Recibidos */}
                      <div className="space-y-3 pt-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-white uppercase font-mono tracking-wider flex items-center gap-2">
                            <span>Insumos y Archivos Guardados ({insumos.length})</span>
                          </span>
                          <span className="text-[11px] text-slate-400">
                            Almacenados en <strong className="text-slate-300">Google Drive · 01_Insumos_Cliente</strong>
                          </span>
                        </div>

                        {insumos.length === 0 ? (
                          <div className="p-6 rounded-xl bg-[#090d16] border border-dashed border-slate-800 text-center text-xs text-slate-400 space-y-2">
                            <p className="italic">
                              Aún no se han recibido insumos o materiales de <strong>{clientName}</strong> en el portal.
                            </p>
                            <p className="text-[11px] text-slate-500">
                              Cuando el cliente suba su logotipo, fotos o textos en la Fase 3 del Portal Público, aparecerán aquí automáticamente y se guardarán en Google Drive.
                            </p>
                            <div className="pt-1 flex items-center justify-center gap-2">
                              <button
                                type="button"
                                onClick={handleSyncDriveInsumos}
                                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-orange-400 text-xs font-semibold flex items-center gap-1.5 border border-slate-700"
                              >
                                <RefreshCw className="w-3.5 h-3.5" />
                                <span>Comprobar Google Drive Ahora</span>
                              </button>
                              <a
                                href={insumosFolderUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 border border-slate-700"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                                <span>Subir Manualmente a Drive</span>
                              </a>
                            </div>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 gap-2.5 max-h-96 overflow-y-auto pr-1">
                            {insumos.map((arch) => {
                              const isLogo = (arch.categoria || '').toLowerCase().includes('logo') || (arch.nombre || '').toLowerCase().includes('logo');
                              const isFoto = (arch.categoria || '').toLowerCase().includes('foto');
                              const isAcceso = (arch.categoria || '').toLowerCase().includes('acceso') || (arch.categoria || '').toLowerCase().includes('dominio');
                              const isTexto = (arch.categoria || '').toLowerCase().includes('texto') || (arch.categoria || '').toLowerCase().includes('catálogo');
                              
                              const catBadgeColor = isLogo ? 'bg-orange-500/15 text-orange-300 border-orange-500/30' :
                                isFoto ? 'bg-sky-500/15 text-sky-300 border-sky-500/30' :
                                isAcceso ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' :
                                isTexto ? 'bg-purple-500/15 text-purple-300 border-purple-500/30' :
                                'bg-slate-800 text-slate-300 border-slate-700';

                              return (
                                <div
                                  key={arch.id}
                                  className="p-3.5 rounded-xl bg-[#121826] border border-slate-800/90 hover:border-slate-700 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-sm"
                                >
                                  <div className="flex items-start gap-3 min-w-0">
                                    <div className="w-10 h-10 rounded-xl bg-slate-800/90 border border-slate-700/80 flex items-center justify-center shrink-0 text-base">
                                      {isLogo ? '🎨' : isFoto ? '📸' : isAcceso ? '🔑' : isTexto ? '📄' : '📁'}
                                    </div>
                                    <div className="min-w-0">
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${catBadgeColor}`}>
                                          {arch.categoria || 'Insumo'}
                                        </span>
                                        <h5 className="font-bold text-white text-xs truncate max-w-xs sm:max-w-md">
                                          {arch.nombre}
                                        </h5>
                                        {arch.tamano && (
                                          <span className="text-[10px] text-slate-400 font-mono">
                                            ({arch.tamano})
                                          </span>
                                        )}
                                      </div>

                                      <div className="text-[11px] text-slate-400 font-mono mt-1 flex items-center gap-2 flex-wrap">
                                        <span>Recibido: <strong className="text-slate-300">{arch.fecha || 'Reciente'}</strong></span>
                                        {arch.hora && <span>({arch.hora})</span>}
                                        <span className="text-emerald-400 flex items-center gap-1 font-semibold">
                                          <Check className="w-3 h-3" /> En Google Drive
                                        </span>
                                      </div>

                                      {arch.notas && (
                                        <div className="mt-1.5 p-2 rounded-lg bg-[#090d16] border border-slate-800/80 text-[11px] text-slate-300 leading-relaxed">
                                          <strong className="text-slate-400 font-semibold block text-[10px] uppercase font-mono mb-0.5">Indicaciones del Cliente:</strong>
                                          "{arch.notas}"
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                                    {arch.driveUrl ? (
                                      <a
                                        href={arch.driveUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="px-3 py-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 hover:text-white border border-blue-500/40 text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm"
                                        title="Abrir o descargar archivo en Google Drive"
                                      >
                                        <ExternalLink className="w-3.5 h-3.5 text-blue-400" />
                                        <span>Ver en Google Drive</span>
                                      </a>
                                    ) : (
                                      <a
                                        href={insumosFolderUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1 transition-colors"
                                      >
                                        <FolderOpen className="w-3.5 h-3.5" />
                                        <span>Abrir Carpeta</span>
                                      </a>
                                    )}

                                    {arch.previewUrl && (
                                      <button
                                        type="button"
                                        onClick={() => setPreviewFileModal(arch)}
                                        className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1 transition-colors"
                                        title="Ver vista previa de la imagen"
                                      >
                                        <Eye className="w-3.5 h-3.5 text-orange-400" />
                                        <span>Vista Previa</span>
                                      </button>
                                    )}

                                    <button
                                      type="button"
                                      onClick={() => handleDeleteInsumo(arch.id)}
                                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950/60 text-slate-400 hover:text-rose-400 transition-colors border border-slate-700/60"
                                      title="Eliminar insumo del proyecto"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      {/* Enlace alternativo opcional a Google Drive / Dropbox */}
                      <div className="pt-2 border-t border-slate-800/80">
                        <label className="text-[11px] text-slate-400 block mb-1">
                          Enlace Adicional de Google Drive / Dropbox / WeTransfer (Opcional):
                        </label>
                        <input
                          type="text"
                          value={activeProyecto.onboarding?.datos?.enlaceDriveArchivos || ''}
                          onChange={e => handleUpdateOnboardingField('enlaceDriveArchivos', e.target.value)}
                          placeholder={insumosFolderUrl}
                          className="w-full px-3 py-2 rounded-lg bg-[#080b11] border border-slate-800 text-xs text-white focus:outline-none focus:border-orange-500 font-mono"
                        />
                      </div>
                    </div>
                  );
                })()}

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
                    <span>Facturación & Gestión Financiera de Anticipo (50%)</span>
                  </div>
                  <h3 className="text-base font-extrabold text-white">
                    Gestión de Anticipos y Desglose Financiero
                  </h3>
                </div>
              </div>

              {/* Status Summary */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Anticipo Box */}
                {(() => {
                  const comprobanteData = getAnticipoComprobanteData(activeProyecto);
                  const hasComprobante = Boolean(comprobanteData.texto || comprobanteData.imagen);

                  return (
                    <div className="p-5 rounded-2xl bg-[#111622] border border-slate-800 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-400">1. Anticipo (50%)</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          activeProyecto.pagos?.anticipoEstado === 'confirmado'
                            ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                            : hasComprobante
                            ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                            : 'bg-slate-800 text-slate-400 border-slate-700'
                        }`}>
                          {activeProyecto.pagos?.anticipoEstado === 'confirmado' ? '✓ Confirmado' : hasComprobante ? 'En Verificación' : 'Pendiente de Pago'}
                        </span>
                      </div>

                      <div className="text-2xl font-mono font-black text-white">
                        ${activeProyecto.pagos?.anticipoMonto} USD
                      </div>

                      <p className="text-[11px] text-slate-400">
                        Requerido formalmente para la reserva de agenda y comienzo de la Fase 1.
                      </p>

                      {hasComprobante && (
                        <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200 space-y-2.5">
                          <div className="font-bold flex items-center justify-between gap-1.5 text-amber-400">
                            <div className="flex items-center gap-1.5">
                              <FileText className="w-3.5 h-3.5" />
                              <span>Comprobante Reportado por Cliente:</span>
                            </div>
                            {comprobanteData.fecha && (
                              <span className="text-[10px] text-slate-400 font-normal">
                                {comprobanteData.fecha}
                              </span>
                            )}
                          </div>

                          {comprobanteData.texto && (
                            <div className="font-mono text-white text-[11px] bg-slate-900/60 p-2 rounded-lg border border-amber-500/20">
                              {comprobanteData.texto}
                            </div>
                          )}

                          {comprobanteData.imagen && (
                            <div className="space-y-1.5 pt-1">
                              <div
                                onClick={() => setPreviewFileModal({
                                  nombre: comprobanteData.nombre || 'Captura Comprobante de Anticipo (50%)',
                                  previewUrl: comprobanteData.imagen
                                })}
                                className="block rounded-lg overflow-hidden border border-slate-700 bg-[#090d16] max-h-56 flex items-center justify-center group relative cursor-pointer hover:border-orange-500/60 transition-all shadow-inner"
                                title="Clic para ampliar captura en pantalla completa"
                              >
                                <img
                                  src={comprobanteData.imagen}
                                  alt="Captura de Comprobante"
                                  className="max-h-52 w-auto object-contain group-hover:scale-105 transition-transform duration-300"
                                />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-1.5 text-white text-xs font-bold transition-opacity">
                                  <Eye className="w-4 h-4 text-orange-400" />
                                  <span>Ampliar Comprobante</span>
                                </div>
                              </div>

                              <div className="flex items-center justify-between text-[10px] pt-1">
                                <span className="text-emerald-400 font-mono flex items-center gap-1 truncate max-w-[200px]" title={comprobanteData.nombre}>
                                  <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                                  <span className="truncate">✓ Captura adjunta ({comprobanteData.nombre || 'Imagen verificada'})</span>
                                </span>
                                <a
                                  href={comprobanteData.imagen}
                                  download={comprobanteData.nombre || 'Comprobante_Anticipo.jpg'}
                                  className="text-orange-400 hover:text-orange-300 flex items-center gap-1 font-semibold shrink-0 transition-colors"
                                  title="Descargar comprobante"
                                >
                                  <Download className="w-3 h-3" />
                                  <span>Descargar</span>
                                </a>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {activeProyecto.pagos?.anticipoEstado !== 'confirmado' ? (
                        <button
                          onClick={() => handleConfirmPayment('anticipo')}
                          className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-md"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>{hasComprobante ? 'Validar Anticipo y Pasar a Desarrollo' : 'Marcar Anticipo como Confirmado'}</span>
                        </button>
                      ) : (
                        <div className="text-[11px] text-emerald-400 font-mono flex items-center gap-1.5 pt-1">
                          <Check className="w-3.5 h-3.5" />
                          <span>Validado el {activeProyecto.pagos?.anticipoFecha || '10 Oct 2026'}</span>
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* Saldo Final Box */}
                {(() => {
                  const comprobanteData = getSaldoComprobanteData(activeProyecto);
                  const hasComprobante = Boolean(comprobanteData.texto || comprobanteData.imagen);

                  return (
                    <div className="p-5 rounded-2xl bg-[#111622] border border-slate-800 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-400">2. Saldo Final (50%) · Liquidación</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          activeProyecto.pagos?.saldoEstado === 'confirmado'
                            ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                            : hasComprobante
                            ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                            : 'bg-slate-800 text-slate-400 border-slate-700'
                        }`}>
                          {activeProyecto.pagos?.saldoEstado === 'confirmado' ? '✓ Liquidado' : hasComprobante ? 'En Verificación' : 'Pendiente contra Entrega'}
                        </span>
                      </div>

                      <div className="text-2xl font-mono font-black text-white">
                        ${activeProyecto.pagos?.saldoMonto} USD
                      </div>

                      <p className="text-[11px] text-slate-400">
                        Se abona contra entrega final una vez aprobado el sitio para liberar el candado de accesos y la Fase 5.
                      </p>

                      {hasComprobante && (
                        <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200 space-y-2.5">
                          <div className="font-bold flex items-center justify-between gap-1.5 text-amber-400">
                            <div className="flex items-center gap-1.5">
                              <FileText className="w-3.5 h-3.5" />
                              <span>Comprobante de Liquidación Reportado:</span>
                            </div>
                            {comprobanteData.fecha && (
                              <span className="text-[10px] text-slate-400 font-normal">
                                {comprobanteData.fecha}
                              </span>
                            )}
                          </div>

                          {comprobanteData.texto && (
                            <div className="font-mono text-white text-[11px] bg-slate-900/60 p-2 rounded-lg border border-amber-500/20">
                              {comprobanteData.texto}
                            </div>
                          )}

                          {comprobanteData.imagen && (
                            <div className="space-y-1.5 pt-1">
                              <div
                                onClick={() => setPreviewFileModal({
                                  nombre: comprobanteData.nombre || 'Captura Comprobante de Liquidación Final',
                                  previewUrl: comprobanteData.imagen
                                })}
                                className="block rounded-lg overflow-hidden border border-slate-700 bg-[#090d16] max-h-56 flex items-center justify-center group relative cursor-pointer hover:border-orange-500/60 transition-all shadow-inner"
                                title="Clic para ampliar captura en pantalla completa"
                              >
                                <img
                                  src={comprobanteData.imagen}
                                  alt="Captura de Liquidación"
                                  className="max-h-52 w-auto object-contain group-hover:scale-105 transition-transform duration-300"
                                />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-1.5 text-white text-xs font-bold transition-opacity">
                                  <Eye className="w-4 h-4 text-orange-400" />
                                  <span>Ampliar Comprobante</span>
                                </div>
                              </div>

                              <div className="flex items-center justify-between text-[10px] pt-1">
                                <span className="text-emerald-400 font-mono flex items-center gap-1 truncate max-w-[200px]" title={comprobanteData.nombre}>
                                  <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                                  <span className="truncate">✓ Captura adjunta ({comprobanteData.nombre || 'Imagen verificada'})</span>
                                </span>
                                <a
                                  href={comprobanteData.imagen}
                                  download={comprobanteData.nombre || 'Comprobante_Liquidacion.jpg'}
                                  className="text-orange-400 hover:text-orange-300 flex items-center gap-1 font-semibold shrink-0 transition-colors"
                                  title="Descargar comprobante"
                                >
                                  <Download className="w-3.5 h-3.5" />
                                  <span>Descargar</span>
                                </a>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      <div className="pt-2 space-y-2">
                        <button
                          type="button"
                          onClick={() => handleConfirmPayment('saldo')}
                          className={`w-full py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-lg ${
                            activeProyecto.pagos?.saldoEstado === 'confirmado'
                              ? 'bg-emerald-700/80 hover:bg-emerald-600 text-white border border-emerald-500/50 shadow-emerald-950/40'
                              : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-950/60'
                          }`}
                        >
                          <CheckCircle2 className="w-4 h-4 text-emerald-200" />
                          <span>
                            {activeProyecto.pagos?.saldoEstado === 'confirmado'
                              ? '✓ Confirmar Pago Recibido (Re-validar & Sincronizar Fase 5)'
                              : 'Confirmar Pago Recibido & Desbloquear Fase 5'}
                          </span>
                        </button>

                        {activeProyecto.pagos?.saldoEstado === 'confirmado' && (
                          <div className="flex items-center justify-between text-[11px] text-emerald-400 font-mono px-1">
                            <span className="flex items-center gap-1.5">
                              <Check className="w-3.5 h-3.5" />
                              <span>Validado el {activeProyecto.pagos?.saldoFecha || '24 oct 2026'} · Fase 5 Desbloqueada</span>
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                const updatedPagos = { ...(activeProyecto.pagos || {}), saldoEstado: 'verificacion' };
                                const modProj = { ...activeProyecto, pagos: updatedPagos };
                                setActiveProyecto(modProj);
                                setProyectos(prev => {
                                  const next = prev.map(p => p.id === modProj.id ? modProj : p);
                                  saveStoredProyectos(next);
                                  return next;
                                });
                                syncPortalStorageForProyecto(modProj, { fase4Liquidada: false, liquidacionPagada: false });
                              }}
                              className="text-[10px] text-slate-500 hover:text-amber-400 underline transition-colors"
                              title="Revertir estado a pendiente"
                            >
                              (Revertir a Pendiente)
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })()}
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

      {/* Modal de Vista Previa de Archivo/Insumo */}
      {previewFileModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0f1422] border border-slate-700 rounded-2xl max-w-2xl w-full p-5 space-y-4 shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <span className="text-[10px] font-mono font-bold text-orange-400 uppercase tracking-wider">
                  {previewFileModal.categoria || 'Insumo de Cliente'}
                </span>
                <h4 className="text-sm font-bold text-white truncate max-w-md">
                  {previewFileModal.nombre}
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setPreviewFileModal(null)}
                className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-[#070a10] rounded-xl p-4 flex items-center justify-center max-h-[60vh] overflow-auto border border-slate-800/80">
              {previewFileModal.previewUrl ? (
                <img
                  src={previewFileModal.previewUrl}
                  alt={previewFileModal.nombre}
                  className="max-h-[50vh] max-w-full object-contain rounded-lg shadow-lg"
                />
              ) : (
                <div className="text-center py-8 space-y-2">
                  <div className="text-3xl">📁</div>
                  <div className="text-xs text-slate-400">Este archivo se encuentra almacenado de forma segura en Google Drive.</div>
                </div>
              )}
            </div>

            {previewFileModal.notas && (
              <div className="p-3 rounded-xl bg-[#0a0d16] border border-slate-800 text-xs text-slate-300">
                <span className="text-[10px] uppercase font-mono font-bold text-slate-400 block mb-0.5">Indicaciones del Cliente:</span>
                "{previewFileModal.notas}"
              </div>
            )}

            <div className="flex items-center justify-between pt-2 border-t border-slate-800">
              <span className="text-[11px] text-slate-400 font-mono">
                {previewFileModal.tamano || ''}
              </span>
              <div className="flex items-center gap-2">
                {previewFileModal.driveUrl && (
                  <a
                    href={previewFileModal.driveUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 transition-colors shadow-sm"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Abrir en Google Drive</span>
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => setPreviewFileModal(null)}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
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
