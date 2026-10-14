import React, { useState, useEffect, useRef } from 'react';
import {
  ShieldCheck,
  FileText,
  Briefcase,
  CheckCircle2,
  Clock,
  Upload,
  MessageSquare,
  Building2,
  Download,
  ExternalLink,
  ChevronRight,
  AlertCircle,
  Copy,
  Check,
  ArrowLeft,
  Lock,
  Unlock,
  PenTool,
  Sparkles,
  AlertTriangle,
  CreditCard,
  Laptop,
  Globe,
  RefreshCw,
  Star,
  Zap,
  CheckCheck,
  Eye,
  Calendar,
  X,
  KeyRound,
  UserCheck
} from 'lucide-react';
import {
  getStoredCrmLeads,
  saveStoredCrmLeads
} from '../services/localStore';

export default function PublicClientPortal({ token, onBackToAdmin, agencySettings: initialAgencySettings }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(1); // 1: Propuesta, 2: Contrato/Anticipo, 3: Insumos, 4: Liquidación/Accesos, 5: Garantía/CMS
  const [notification, setNotification] = useState(null);
  const [copiedBank, setCopiedBank] = useState(null);

  // Agency White-Label Branding State
  const [agencyBranding, setAgencyBranding] = useState(() => {
    if (initialAgencySettings) return initialAgencySettings;
    try {
      const raw = localStorage.getItem('goglite_agency_settings');
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    return {
      nombreAgencia: 'Goglite Digital Hub',
      logoUrl: '',
      colorPrimario: '#FF6B00',
      telefonoWhatsapp: '+503 7000-1122',
      emailContacto: 'contacto@goglite.com',
      dominioWeb: 'goglite.com',
      ubicacionPrincipal: 'San Salvador (SV) & Santo Domingo (DO)'
    };
  });

  // Client Post-Payment Authentication State
  const [showClientAuthModal, setShowClientAuthModal] = useState(false);
  const [clientAuthEmail, setClientAuthEmail] = useState('');
  const [clientAuthPass, setClientAuthPass] = useState('');
  const [clientAuthLoading, setClientAuthLoading] = useState(false);
  const [clientAuthSuccess, setClientAuthSuccess] = useState(false);

  // Fase 2 - Signature & Payment states
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [signerName, setSignerName] = useState('');
  const [signerDoc, setSignerDoc] = useState('');
  const [advanceReceiptRef, setAdvanceReceiptRef] = useState('');
  const [selectedBankTab, setSelectedBankTab] = useState('SV'); // 'SV' | 'DO' | 'US'

  // Fase 3 - Assets intake states
  const [assetName, setAssetName] = useState('');
  const [assetCategory, setAssetCategory] = useState('Logotipo Vectorial');
  const [assetNotes, setAssetNotes] = useState('');

  // Fase 4 - Settlement states
  const [settlementReceiptRef, setSettlementReceiptRef] = useState('');
  const [unlockAnimating, setUnlockAnimating] = useState(false);

  // Fase 5 - Maintenance state
  const [carePlanActive, setCarePlanActive] = useState(false);
  const [syncingDrive, setSyncingDrive] = useState(false);

  const handleSyncDriveVault = async () => {
    try {
      setSyncingDrive(true);
      const res = await fetch(`/api/portal/${token}/sync-drive`, { method: 'POST' });
      if (res.ok) {
        const result = await res.json();
        if (result.vault) {
          setData(prev => ({
            ...prev,
            portalConfig: {
              ...(prev?.portalConfig || {}),
              driveVault: result.vault,
              enlaceDriveArchivos: result.vault.vaultUrl
            }
          }));
          showNotification('¡Bóveda de Google Drive creada y centralizada con éxito!');
        }
      }
    } catch (e) {
      console.warn('Error sincronizando Drive:', e);
      showNotification('Bóveda activada en modo local', 'warning');
    } finally {
      setSyncingDrive(false);
    }
  };

  useEffect(() => {
    loadPortalData();
  }, [token]);

  // Synchronize state when data is loaded
  useEffect(() => {
    if (data?.portalConfig) {
      const cfg = data.portalConfig;
      if (cfg.nombreFirmante) setSignerName(cfg.nombreFirmante);
      if (cfg.documentoFirmante) setSignerDoc(cfg.documentoFirmante);
      if (cfg.comprobanteAnticipo) setAdvanceReceiptRef(cfg.comprobanteAnticipo);
      if (cfg.comprobanteLiquidacion) setSettlementReceiptRef(cfg.comprobanteLiquidacion);
      if (cfg.fase5CareActivo) setCarePlanActive(true);

      // Set initial active tab based on progress
      if (cfg.fase4Liquidada) setActiveTab(5);
      else if (cfg.fase3InsumosCompletos) setActiveTab(4);
      else if (cfg.fase2Firmada) setActiveTab(3);
      else if (cfg.fase1Aprobada) setActiveTab(2);
      else setActiveTab(1);
    }
  }, [data?.portalConfig]);

  const showNotification = (msg, type = 'success') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3500);
  };

  useEffect(() => {
    if (initialAgencySettings) {
      setAgencyBranding(initialAgencySettings);
    }
  }, [initialAgencySettings]);

  const handleRegisterClientAuth = async (provider = 'google') => {
    try {
      setClientAuthLoading(true);
      const email = clientAuthEmail.trim() || data?.lead?.email || 'cliente@empresa.com';
      const nombre = signerName.trim() || data?.lead?.contacto || data?.lead?.empresa || 'Cliente';

      try {
        await fetch('/api/auth/client-register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            portalToken: token,
            email,
            nombre,
            authProvider: provider
          })
        });
      } catch (e) {
        console.warn('API client register fallback:', e);
      }

      await savePortalUpdates({
        clienteAutenticado: true,
        clienteAuthEmail: email,
        clienteAuthProvider: provider,
        fechaAutenticacion: new Date().toISOString()
      });

      setClientAuthSuccess(true);
      showNotification('✓ ¡Cuenta de cliente autenticada con éxito! Ya tienes acceso permanente.');
      setTimeout(() => {
        setShowClientAuthModal(false);
        setClientAuthSuccess(false);
      }, 1500);
    } catch (err) {
      alert('Error vinculando cuenta: ' + err.message);
    } finally {
      setClientAuthLoading(false);
    }
  };

  const loadPortalData = async () => {
    try {
      setLoading(true);
      let loadedData = null;

      // 1. Try fetching from server API
      try {
        const res = await fetch(`/api/portal/${token}`);
        if (res.ok) {
          loadedData = await res.json();
        }
      } catch (err) {
        console.warn('API portal fetch warning, falling back to local storage:', err);
      }

      // 2. If no data from API, search local store
      if (!loadedData || !loadedData.lead) {
        try {
          const leads = getStoredCrmLeads();
          const found = leads.find(l => l.portalToken === token || l.id === token);
          if (found) {
            loadedData = {
              lead: found,
              portalConfig: found.portalConfig || {},
              presupuesto: null,
              proyecto: null
            };
          }
        } catch (e) {
          console.error('Error parsing local leads:', e);
        }
      }

      // 3. Fallback demo data if token is demo or not found
      if (!loadedData || !loadedData.lead) {
        loadedData = {
          lead: {
            id: 'lead-demo-portal',
            empresa: 'Clínica Dental Escalón',
            contacto: 'Dr. Roberto Solano',
            telefono: '+503 7890-1234',
            email: 'contacto@dentalescalon.com',
            pais: 'SV',
            servicio: 'Web Antigravity Ultra-Rápida + SEO Local',
            presupuestoMonto: 650,
            etapa: 'negociacion',
            portalToken: token || 'portal-demo'
          },
          portalConfig: {
            faseActual: 1,
            progresoPorcentaje: 20,
            fase1Aprobada: false,
            fase2Firmada: false,
            fase3InsumosCompletos: false,
            fase4Liquidada: false,
            fase5CareActivo: false,
            archivosSubidos: [
              { id: 'f-1', nombre: 'Logo_Dental_Escalon.svg', categoria: 'Logotipo Vectorial', fecha: '2026-10-12', estado: 'Aprobado' },
              { id: 'f-2', nombre: 'Fotos_Consultorio_HD.zip', categoria: 'Fotografías & Gráficos', fecha: '2026-10-13', estado: 'Aprobado' }
            ]
          },
          presupuesto: null,
          proyecto: null
        };
      }

      // Default country tab for banking
      if (loadedData.lead.pais === 'DO') {
        setSelectedBankTab('DO');
      } else {
        setSelectedBankTab('SV');
      }

      setData(loadedData);
    } catch (err) {
      console.error('Fatal portal load error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Helper to persist portal config changes
  const savePortalUpdates = async (updates) => {
    if (!data?.lead) return;

    const newPortalConfig = {
      ...(data.portalConfig || {}),
      ...updates,
      ultimaModificacion: new Date().toISOString()
    };

    const newLead = {
      ...data.lead,
      portalConfig: newPortalConfig
    };

    if (updates.fase2Firmada) {
      newLead.etapa = 'ganado';
      newLead.probabilidad = 100;
    }

    setData(prev => ({
      ...prev,
      lead: newLead,
      portalConfig: newPortalConfig
    }));

    // Sync with localStore
    try {
      const leads = getStoredCrmLeads();
      const idx = leads.findIndex(l => l.portalToken === token || l.id === data.lead.id);
      if (idx !== -1) {
        leads[idx] = { ...leads[idx], ...newLead };
        saveStoredCrmLeads(leads);
      }
    } catch (e) {
      console.error('Error saving to localStore:', e);
    }

    // Sync with server API
    try {
      const res = await fetch(`/api/portal/${token}/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      if (res.ok) {
        const respData = await res.json();
        if (respData.driveVault) {
          setData(prev => ({
            ...prev,
            portalConfig: {
              ...(prev?.portalConfig || {}),
              driveVault: respData.driveVault,
              enlaceDriveArchivos: respData.driveVault.vaultUrl
            }
          }));
        }
      }
    } catch (err) {
      console.warn('API sync warn:', err);
    }
  };

  // Canvas signature helpers
  const getCoordinates = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  };

  const startDrawing = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const { x, y } = getCoordinates(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
    setHasSignature(true);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const { x, y } = getCoordinates(e);
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#ffffff';
    ctx.lineTo(x, y);
    ctx.stroke();
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

  const handleCopyBank = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedBank(id);
    setTimeout(() => setCopiedBank(null), 2000);
  };

  // Phase Actions
  const handleAprobarPropuesta = async () => {
    await savePortalUpdates({
      fase1Aprobada: true,
      fechaAprobacionPropuesta: new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }),
      progresoPorcentaje: 40,
      faseActual: 2
    });
    setActiveTab(2);
    showNotification('✓ ¡Propuesta comercial aprobada con éxito! Ahora formalicemos el contrato y anticipo.');
  };

  const handleFirmarContrato = async (e) => {
    e.preventDefault();
    if (!signerName.trim()) {
      alert('Por favor indica el nombre completo del firmante autorizado.');
      return;
    }
    if (!hasSignature && !data.portalConfig?.firmaDigital) {
      alert('Por favor realiza tu firma digital manuscrita en el recuadro interactivo.');
      return;
    }

    let signatureUrl = data.portalConfig?.firmaDigital || null;
    if (canvasRef.current && hasSignature) {
      signatureUrl = canvasRef.current.toDataURL('image/png');
    }

    await savePortalUpdates({
      fase2Firmada: true,
      fechaFirmaContrato: new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }),
      firmaDigital: signatureUrl,
      nombreFirmante: signerName.trim(),
      documentoFirmante: signerDoc.trim() || 'Identificación Oficial Registrada',
      comprobanteAnticipo: advanceReceiptRef.trim() || 'En verificación bancaria',
      anticipoPagado: true,
      progresoPorcentaje: 60,
      faseActual: 3
    });
    setActiveTab(3);
    showNotification('✓ Contrato formalizado con éxito. ¡Bienvenido a Goglite Studio!');
  };

  const handleSubirInsumo = async (e) => {
    e.preventDefault();
    if (!assetName.trim()) return;

    const nuevoArchivo = {
      id: 'f-' + Date.now(),
      nombre: assetName.trim(),
      categoria: assetCategory,
      notas: assetNotes.trim(),
      fecha: new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }),
      estado: 'Recibido'
    };

    const archivosActuales = data.portalConfig?.archivosSubidos || [];
    const actualizados = [...archivosActuales, nuevoArchivo];

    await savePortalUpdates({
      archivosSubidos: actualizados
    });

    setAssetName('');
    setAssetNotes('');
    showNotification(`✓ Insumo "${nuevoArchivo.nombre}" registrado correctamente.`);
  };

  const handleCompletarInsumos = async () => {
    await savePortalUpdates({
      fase3InsumosCompletos: true,
      fechaInsumosCompletos: new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }),
      progresoPorcentaje: 80,
      faseActual: 4
    });
    setActiveTab(4);
    showNotification('✓ Insumos validados al 100%. El cronómetro oficial de 10 días ha iniciado.');
  };

  const handleLiquidarProyecto = async (e) => {
    e.preventDefault();
    setUnlockAnimating(true);
    setTimeout(async () => {
      await savePortalUpdates({
        fase4Liquidada: true,
        fechaLiquidacion: new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }),
        comprobanteLiquidacion: settlementReceiptRef.trim() || 'Referencia Verificada',
        liquidacionPagada: true,
        progresoPorcentaje: 95,
        faseActual: 5
      });
      setUnlockAnimating(false);
      showNotification('🔓 ¡Candado liberado! Tus credenciales oficiales y código fuente están disponibles.');
    }, 1200);
  };

  const handleActivarGogliteCare = async () => {
    await savePortalUpdates({
      fase5CareActivo: true,
      fechaActivacionCare: new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }),
      progresoPorcentaje: 100,
      faseActual: 5
    });
    setCarePlanActive(true);
    showNotification('👑 ¡Plan Goglite Care ($99/mes) activado! Tu plataforma cuenta con soporte prioritario.');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#080b11] text-slate-200 flex flex-col items-center justify-center p-6">
        <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-sm font-semibold text-white tracking-wide">Cargando tu Portal de Cliente Seguro...</p>
        <span className="text-xs text-slate-500 mt-1">Conexión encriptada SSL 256-bit</span>
      </div>
    );
  }

  const { lead, portalConfig } = data;
  const isSV = lead.pais === 'SV';
  const totalInversion = Number(lead.presupuestoMonto) || 650;
  const anticipoMonto = Math.round(totalInversion * 0.5);
  const liquidacionMonto = totalInversion - anticipoMonto;

  const steps = [
    { num: 1, title: 'Aprobación 1-Clic', label: 'Propuesta VIP', done: Boolean(portalConfig?.fase1Aprobada) },
    { num: 2, title: 'Contrato SOW', label: 'Anticipo 50%', done: Boolean(portalConfig?.fase2Firmada) },
    { num: 3, title: 'Intake Insumos', label: 'Garantía 10 Días', done: Boolean(portalConfig?.fase3InsumosCompletos) },
    { num: 4, title: 'Liquidación', label: 'Candado de Accesos', done: Boolean(portalConfig?.fase4Liquidada) },
    { num: 5, title: 'Garantía 30 Días', label: 'Plan CMS $99/mes', done: Boolean(portalConfig?.fase5CareActivo) }
  ];

  return (
    <div className="min-h-screen bg-[#070a10] text-slate-200 antialiased selection:bg-orange-500 selection:text-white flex flex-col">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed top-5 right-5 z-50 animate-bounce bg-slate-900 border border-emerald-500/50 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2.5 text-xs font-semibold">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{notification.msg}</span>
        </div>
      )}

      {/* Top Header Navigation */}
      <header className="border-b border-slate-800/80 bg-[#0b0f19]/95 backdrop-blur sticky top-0 z-40 px-4 sm:px-6 py-3.5">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#090d16] border border-slate-700 flex items-center justify-center shrink-0 overflow-hidden shadow-lg shadow-orange-500/10">
              {agencyBranding.logoUrl ? (
                <img src={agencyBranding.logoUrl} alt={agencyBranding.nombreAgencia} className="max-w-full max-h-full object-contain p-0.5" />
              ) : (
                <div 
                  className="w-full h-full flex items-center justify-center font-black text-white text-base shadow-sm"
                  style={{ backgroundColor: agencyBranding.colorPrimario || '#FF6B00' }}
                >
                  {(agencyBranding.nombreAgencia || 'G')[0].toUpperCase()}
                </div>
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-white text-sm sm:text-base tracking-tight">
                  {agencyBranding.nombreAgencia || 'Goglite Studio'}
                </span>
                <span className="text-[10px] bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 px-2 py-0.5 rounded-full font-mono font-semibold flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> SSL Protegido
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                {agencyBranding.eslogan || 'Portal Blindado de Cliente · 5 Fases de Ejecución'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {onBackToAdmin && (
              <button
                onClick={onBackToAdmin}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition-colors"
                title="Volver al panel administrativo"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Panel Interno</span>
              </button>
            )}
            <a
              href={`https://wa.me/${(agencyBranding.telefonoWhatsapp || '+503 7000-1122').replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Hola, te escribo desde el Portal de Cliente de ${lead.empresa}.`)}`}
              target="_blank"
              rel="noreferrer"
              className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center gap-2 shadow-lg shadow-emerald-950 transition-all"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>WhatsApp de Soporte</span>
            </a>
          </div>
        </div>
      </header>

      {/* Main Content Container */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6 flex-1 w-full">
        
        {/* Welcome Client Hero Box */}
        <div className="rounded-2xl bg-gradient-to-br from-[#101626] to-[#0b0e17] border border-slate-800 p-5 sm:p-7 relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-80 h-80 bg-orange-500/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono uppercase tracking-wider text-orange-400 font-bold">
                  Espacio Asignado
                </span>
                <span className="text-slate-600">·</span>
                <span className="text-xs text-slate-300 font-medium">
                  {isSV ? '🇸🇻 El Salvador' : '🇩🇴 República Dominicana'}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                {lead.empresa}
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
                Estimado(a) <strong className="text-white">{lead.contacto}</strong>: este es tu portal confidencial para aprobar tu proyecto, formalizar el contrato, cargar insumos y recibir tu código y credenciales.
              </p>
            </div>

            <div className="bg-[#141b2c] border border-slate-700/60 rounded-xl p-4 min-w-[250px] space-y-2 shrink-0">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-slate-400 uppercase font-mono tracking-wider">Estado Global</span>
                <span className="text-[10px] font-mono text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  {portalConfig?.progresoPorcentaje || 20}% Completado
                </span>
              </div>
              <div className="text-sm font-bold text-white flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>Fase {activeTab} de 5: {steps[activeTab - 1]?.title}</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden mt-1">
                <div
                  className="bg-gradient-to-r from-orange-500 to-emerald-400 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${portalConfig?.progresoPorcentaje || 20}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Post-Payment Authentication Banner (Visible when Fase 2 is signed/paid) */}
        {portalConfig?.fase2Firmada && (
          <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-[#0d1525] to-cyan-500/10 border border-emerald-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/30">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-white">
                    {portalConfig?.clienteAutenticado ? 'Cuenta de Cliente Autenticada & Blindada' : '¡Propuesta Aprobada y Anticipo Registrado!'}
                  </span>
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold ${
                    portalConfig?.clienteAutenticado 
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  }`}>
                    {portalConfig?.clienteAutenticado ? '✓ Acceso Permanente' : 'Paso Recomendado'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 mt-0.5">
                  {portalConfig?.clienteAutenticado 
                    ? `Sesión vinculada a: ${portalConfig.clienteAuthEmail || lead.email}. Tienes acceso directo a la Bóveda de Drive y al Headless CMS.`
                    : 'Vincula tu cuenta de Google o define una contraseña para entrar a tu Portal y Bóveda en cualquier momento sin depender de enlaces.'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {portalConfig?.clienteAutenticado ? (
                <div className="flex items-center gap-1.5 text-xs font-mono text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-xl border border-emerald-500/20">
                  <UserCheck className="w-4 h-4" />
                  <span>Autenticado ({portalConfig.clienteAuthProvider || 'Google'})</span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setClientAuthEmail(lead.email || '');
                    setShowClientAuthModal(true);
                  }}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-emerald-950 transition-all transform hover:scale-[1.01]"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>Vincular Credenciales de Acceso</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* 5-Phase Interactive Stepper Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
          {steps.map((st) => {
            const isCurrent = activeTab === st.num;
            const isCompleted = st.done;
            return (
              <button
                key={st.num}
                onClick={() => setActiveTab(st.num)}
                className={`p-3.5 rounded-xl border text-left transition-all relative overflow-hidden ${
                  isCurrent
                    ? 'bg-orange-500/15 border-orange-500 text-white shadow-lg shadow-orange-950/40'
                    : isCompleted
                    ? 'bg-[#0f1524] border-emerald-500/40 text-slate-200 hover:border-emerald-500/60'
                    : 'bg-[#0c101b] border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                {isCompleted && (
                  <div className="absolute top-1 right-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  </div>
                )}
                <div className="flex items-center gap-1.5 mb-1">
                  <span className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded ${
                    isCurrent ? 'bg-orange-500 text-white' : isCompleted ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-400'
                  }`}>
                    0{st.num}
                  </span>
                  <span className="text-[11px] font-bold truncate">{st.title}</span>
                </div>
                <div className="text-[10px] text-slate-400 truncate">{st.label}</div>
              </button>
            );
          })}
        </div>

        {/* TAB PANELS: 5 PHASES */}
        
        {/* ========================================================================= */}
        {/* FASE 1: APROBACIÓN 1-CLIC */}
        {/* ========================================================================= */}
        {activeTab === 1 && (
          <div className="space-y-6">
            <div className="rounded-2xl bg-[#0e1320] border border-slate-800 p-6 space-y-6 shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-3">
                <div className="space-y-1">
                  <span className="text-[11px] font-mono uppercase text-orange-400 font-bold tracking-wider">
                    Fase 1 · Aprobación de Presupuesto VIP
                  </span>
                  <h2 className="text-xl font-bold text-white">Resumen Ejecutivo de la Propuesta</h2>
                  <p className="text-xs text-slate-400">Diseño y desarrollo web a medida con código nativo, sin dependencias de WordPress ni plugins lentos.</p>
                </div>
                {portalConfig?.fase1Aprobada ? (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold font-mono">
                    <CheckCheck className="w-4 h-4" /> Aprobada el {portalConfig.fechaAprobacionPropuesta}
                  </div>
                ) : (
                  <span className="text-xs font-mono text-amber-400 bg-amber-500/10 border border-amber-500/30 px-3 py-1 rounded-lg">
                    Pendiente de Aprobación
                  </span>
                )}
              </div>

              {/* Core Deliverables Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-[#141b2b] border border-slate-800 space-y-2">
                  <div className="w-8 h-8 rounded-lg bg-orange-500/15 text-orange-400 flex items-center justify-center font-bold">
                    <Zap className="w-4 h-4" />
                  </div>
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">Velocidad Extrema</h3>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Arquitectura nativa Antigravity que carga en menos de <strong>0.8 segundos</strong> en dispositivos móviles con 95-100 en Google PageSpeed.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-[#141b2b] border border-slate-800 space-y-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/15 text-emerald-400 flex items-center justify-center font-bold">
                    <Globe className="w-4 h-4" />
                  </div>
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">SEO Local & Conversión</h3>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Microdatos Schema estructurados para dominar búsquedas locales de Google y botones de WhatsApp inteligentes con tracking directo.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-[#141b2b] border border-slate-800 space-y-2">
                  <div className="w-8 h-8 rounded-lg bg-purple-500/15 text-purple-400 flex items-center justify-center font-bold">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">StoryBrand Framework</h3>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Textos persuasivos enfocados en tu cliente ideal como el héroe y tu empresa como la guía confiable que resuelve su problema.
                  </p>
                </div>
              </div>

              {/* Pricing & Terms Box */}
              <div className="p-5 rounded-xl bg-[#121827] border border-slate-700/80 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div className="space-y-1">
                  <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Estructura de Inversión 50/50</span>
                  <div className="text-2xl font-black text-white font-mono flex items-center gap-2">
                    <span>${totalInversion} USD</span>
                    <span className="text-xs text-slate-400 font-normal">Precio Llave en Mano</span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Anticipo al inicio: <strong className="text-white">${anticipoMonto} USD</strong> · Liquidación contra entrega: <strong className="text-white">${liquidacionMonto} USD</strong>
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
                  {portalConfig?.fase1Aprobada ? (
                    <button
                      onClick={() => setActiveTab(2)}
                      className="w-full sm:w-auto px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center justify-center gap-2 border border-slate-700"
                    >
                      <span>Ir al Contrato SOW & Anticipo</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      onClick={handleAprobarPropuesta}
                      className="w-full sm:w-auto px-7 py-3 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xl shadow-orange-950 transition-all transform hover:scale-[1.02]"
                    >
                      <Check className="w-4 h-4" />
                      <span>Aprobar Propuesta & Continuar a Contrato</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* FASE 2: CONTRATO SOW & ANTICIPO 50% (CON FIRMA CANVAS) */}
        {/* ========================================================================= */}
        {activeTab === 2 && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Left Column: SOW Agreement & Canvas Signature */}
              <div className="lg:col-span-7 space-y-6">
                <div className="rounded-2xl bg-[#0e1320] border border-slate-800 p-6 space-y-5 shadow-xl">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                    <div>
                      <span className="text-[11px] font-mono uppercase text-orange-400 font-bold tracking-wider">
                        Fase 2 · Formalización Legal
                      </span>
                      <h2 className="text-lg font-bold text-white">Contrato de Servicios (SOW)</h2>
                    </div>
                    {portalConfig?.fase2Firmada && (
                      <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-md border border-emerald-500/20 flex items-center gap-1 font-bold">
                        <CheckCheck className="w-3.5 h-3.5" /> Firmado
                      </span>
                    )}
                  </div>

                  {/* Legal Terms Scrollbox */}
                  <div className="bg-[#121827] border border-slate-800 rounded-xl p-4 text-xs text-slate-300 space-y-3 max-h-52 overflow-y-auto leading-relaxed font-mono">
                    <p><strong className="text-white">CLÁUSULA PRIMERA (OBJETO):</strong> Goglite Studio se compromete al diseño, desarrollo y puesta en producción de la plataforma web corporativa de {lead.empresa}, garantizando una infraestructura sin WordPress y tiempos de carga menores a 1.0s.</p>
                    <p><strong className="text-white">CLÁUSULA SEGUNDA (PLAZO DE 10 DÍAS):</strong> El plazo oficial de ejecución técnica es de diez (10) días hábiles, los cuales comenzarán a computarse formalmente a partir de la entrega del 100% de los insumos requeridos (logotipos, textos y accesos de marca).</p>
                    <p><strong className="text-white">CLÁUSULA TERCERA (FORMA DE PAGO):</strong> Cincuenta por ciento (50%) como anticipo de inicio (${anticipoMonto} USD) y cincuenta por ciento (50%) a la entrega final en staging (${liquidacionMonto} USD), previo a la liberación de credenciales maestras.</p>
                    <p><strong className="text-white">CLÁUSULA CUARTA (PROPIEDAD INTELECTUAL):</strong> Tras la liquidación final, el cliente recibe el 100% de los derechos de propiedad intelectual, código fuente limpio y accesos administrativos sin candados de permanencia.</p>
                  </div>

                  {/* Interactive Signature Canvas */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                        <PenTool className="w-3.5 h-3.5 text-orange-400" />
                        <span>Firma Digital Manuscrita (Dibuja con tu mouse o pantalla táctil):</span>
                      </label>
                      {!portalConfig?.fase2Firmada && (
                        <button
                          type="button"
                          onClick={clearCanvas}
                          className="text-[11px] text-slate-400 hover:text-red-400 font-mono transition-colors"
                        >
                          Limpiar Firma
                        </button>
                      )}
                    </div>

                    {portalConfig?.fase2Firmada && portalConfig?.firmaDigital ? (
                      <div className="p-4 rounded-xl bg-[#141b2a] border border-emerald-500/30 flex flex-col items-center">
                        <img src={portalConfig.firmaDigital} alt="Firma Registrada" className="h-20 object-contain filter invert" />
                        <div className="text-[11px] text-emerald-400 font-mono mt-2">
                          ✓ Firmado digitalmente por: {portalConfig.nombreFirmante} ({portalConfig.documentoFirmante})
                        </div>
                      </div>
                    ) : (
                      <div className="border-2 border-dashed border-slate-700 rounded-xl overflow-hidden bg-[#0a0d15] relative">
                        <canvas
                          ref={canvasRef}
                          width={520}
                          height={140}
                          onMouseDown={startDrawing}
                          onMouseMove={draw}
                          onMouseUp={stopDrawing}
                          onMouseLeave={stopDrawing}
                          onTouchStart={startDrawing}
                          onTouchMove={draw}
                          onTouchEnd={stopDrawing}
                          className="w-full h-36 cursor-crosshair touch-none"
                        />
                        {!hasSignature && (
                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-slate-600 text-xs font-mono">
                            ✍ Haz clic y dibuja tu firma aquí
                          </div>
                        )}
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      <div>
                        <label className="text-[11px] text-slate-400 font-mono block mb-1">Nombre Completo del Firmante</label>
                        <input
                          type="text"
                          value={signerName}
                          onChange={(e) => setSignerName(e.target.value)}
                          disabled={portalConfig?.fase2Firmada}
                          placeholder={lead.contacto}
                          className="w-full bg-[#141b2b] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500 disabled:opacity-60"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] text-slate-400 font-mono block mb-1">DUI / Cédula / Identificación</label>
                        <input
                          type="text"
                          value={signerDoc}
                          onChange={(e) => setSignerDoc(e.target.value)}
                          disabled={portalConfig?.fase2Firmada}
                          placeholder="Ej. 02489123-5 o 402-2839182-1"
                          className="w-full bg-[#141b2b] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500 disabled:opacity-60"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Banking Accounts & Deposit Proof */}
              <div className="lg:col-span-5 space-y-6">
                <div className="rounded-2xl bg-[#0e1320] border border-slate-800 p-6 space-y-5 shadow-xl">
                  <div>
                    <span className="text-[11px] font-mono uppercase text-orange-400 font-bold tracking-wider">
                      Datos de Pago Oficiales
                    </span>
                    <h2 className="text-lg font-bold text-white">Anticipo del 50%: ${anticipoMonto} USD</h2>
                    <p className="text-xs text-slate-400 mt-0.5">Selecciona tu país para visualizar las cuentas bancarias oficiales:</p>
                  </div>

                  {/* Bank Country Selector */}
                  <div className="flex rounded-xl bg-[#141b2b] p-1 border border-slate-800">
                    <button
                      type="button"
                      onClick={() => setSelectedBankTab('SV')}
                      className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                        selectedBankTab === 'SV' ? 'bg-orange-600 text-white shadow' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      🇸🇻 El Salvador
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedBankTab('DO')}
                      className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                        selectedBankTab === 'DO' ? 'bg-orange-600 text-white shadow' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      🇩🇴 Rep. Dominicana
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedBankTab('US')}
                      className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                        selectedBankTab === 'US' ? 'bg-orange-600 text-white shadow' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      🇺🇸 uglyCash / USA
                    </button>
                  </div>

                  {/* Bank Details Card */}
                  <div className="p-4 rounded-xl bg-[#141b2a] border border-slate-700/80 space-y-3 font-mono text-xs">
                    {selectedBankTab === 'SV' && (
                      <div className="space-y-2">
                        <div className="text-emerald-400 font-bold flex items-center justify-between">
                          <span>Banco Agrícola El Salvador</span>
                          <span className="text-[10px] bg-emerald-500/20 px-2 py-0.5 rounded">Transfer365 / UNI</span>
                        </div>
                        <div className="text-slate-300">· Cuenta Corriente: <strong className="text-white">0054-019283-01</strong></div>
                        <div className="text-slate-300">· Beneficiario: <strong className="text-white">Goglite Studio S.A. de C.V.</strong></div>
                        <div className="text-slate-300">· Moneda: <strong className="text-white">USD ($)</strong></div>
                        <button
                          type="button"
                          onClick={() => handleCopyBank('0054-019283-01', 'SV')}
                          className="w-full mt-2 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5"
                        >
                          {copiedBank === 'SV' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{copiedBank === 'SV' ? '¡Número de Cuenta Copiado!' : 'Copiar Cuenta Banco Agrícola'}</span>
                        </button>
                      </div>
                    )}

                    {selectedBankTab === 'DO' && (
                      <div className="space-y-2">
                        <div className="text-emerald-400 font-bold flex items-center justify-between">
                          <span>Banreservas / Banco BHD</span>
                          <span className="text-[10px] bg-emerald-500/20 px-2 py-0.5 rounded">ACH / Pagos al Instante</span>
                        </div>
                        <div className="text-slate-300">· Cuenta Corriente: <strong className="text-white">960-239481-2</strong></div>
                        <div className="text-slate-300">· Beneficiario: <strong className="text-white">Goglite Studio SRL</strong></div>
                        <div className="text-slate-300">· RNC: <strong className="text-white">1-32-84918-2</strong></div>
                        <button
                          type="button"
                          onClick={() => handleCopyBank('960-239481-2', 'DO')}
                          className="w-full mt-2 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5"
                        >
                          {copiedBank === 'DO' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{copiedBank === 'DO' ? '¡Número de Cuenta Copiado!' : 'Copiar Cuenta Banreservas'}</span>
                        </button>
                      </div>
                    )}

                    {selectedBankTab === 'US' && (
                      <div className="space-y-2">
                        <div className="text-emerald-400 font-bold flex items-center justify-between">
                          <span>uglyCash / ACH Internacional</span>
                          <span className="text-[10px] bg-emerald-500/20 px-2 py-0.5 rounded">Zelle / uglyCash Direct</span>
                        </div>
                        <div className="text-slate-300">· uglyTag: <strong className="text-white">$goglite</strong></div>
                        <div className="text-slate-300">· Routing Number (ACH): <strong className="text-white">026014881</strong></div>
                        <div className="text-slate-300">· Account (Evolve Bank): <strong className="text-white">92817293810</strong></div>
                        <button
                          type="button"
                          onClick={() => handleCopyBank('$goglite', 'US')}
                          className="w-full mt-2 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5"
                        >
                          {copiedBank === 'US' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{copiedBank === 'US' ? '¡uglyTag Copiado!' : 'Copiar Tag uglyCash ($goglite)'}</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Proof of Deposit Input */}
                  <div className="space-y-3">
                    <label className="text-[11px] text-slate-300 font-mono block">
                      Número de Referencia o Comprobante de Depósito (50%):
                    </label>
                    <input
                      type="text"
                      value={advanceReceiptRef}
                      onChange={(e) => setAdvanceReceiptRef(e.target.value)}
                      disabled={portalConfig?.fase2Firmada}
                      placeholder="Ej. Transferencia #982143 o Ref. Banco Agrícola"
                      className="w-full bg-[#141b2b] border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 disabled:opacity-60"
                    />

                    {portalConfig?.fase2Firmada ? (
                      <button
                        onClick={() => setActiveTab(3)}
                        className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center justify-center gap-2 border border-slate-700"
                      >
                        <span>Ir a la Fase 3: Intake de Insumos</span>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    ) : (
                      <button
                        onClick={handleFirmarContrato}
                        className="w-full py-3 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xl shadow-orange-950 transition-all"
                      >
                        <CheckCheck className="w-4 h-4" />
                        <span>Confirmar Firma y Enviar Comprobante (50%)</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* FASE 3: INTAKE DE INSUMOS (CON REGLA CONTRACTUAL DE 10 DÍAS) */}
        {/* ========================================================================= */}
        {activeTab === 3 && (
          <div className="space-y-6">
            {/* MANDATORY CONTRACTUAL SHIELD NOTICE */}
            <div className="rounded-2xl bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-transparent border-2 border-amber-500/40 p-5 sm:p-6 space-y-2">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                <AlertTriangle className="w-5 h-5 shrink-0" />
                <span className="uppercase tracking-wider font-mono">Regla de Blindaje Contractual de Entrega</span>
              </div>
              <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                ⚖️ <strong>Cláusula de Garantía de Plazos:</strong> El plazo oficial de <strong>10 días hábiles</strong> para la entrega y presentación de tu plataforma web inicia formalmente una vez recibido el <strong>100% de los insumos obligatorios</strong> de tu marca (logotipo vectorial, fotografías, textos y accesos).
              </p>
            </div>

            {/* BANNER DE BÓVEDA CENTRALIZADA EN GOOGLE DRIVE */}
            <div className="rounded-2xl bg-[#0b121e] border border-blue-500/30 p-5 sm:p-6 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
              
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-start gap-3.5">
                  <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center shrink-0">
                    <Globe className="w-6 h-6 text-blue-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono uppercase bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full font-bold">
                        Google Drive Oficial · Centralizado
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">sitesgoglite@gmail.com</span>
                    </div>
                    <h3 className="text-sm sm:text-base font-bold text-white mt-1">
                      📁 Bóveda de Archivos: [Goglite] {data.lead?.empresa}
                    </h3>
                    <p className="text-xs text-slate-300 mt-1 max-w-xl">
                      Todos los logos, fotos, contratos y entregables técnicos quedan centralizados y organizados en 3 subcarpetas en Google Drive para histórico permanente.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 shrink-0 w-full md:w-auto">
                  {data.portalConfig?.driveVault?.vaultUrl ? (
                    <a
                      href={data.portalConfig.driveVault.vaultUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full md:w-auto px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-blue-950 transition-all"
                    >
                      <ExternalLink className="w-4 h-4" />
                      <span>Abrir Bóveda en Google Drive</span>
                    </a>
                  ) : (
                    <button
                      type="button"
                      onClick={handleSyncDriveVault}
                      disabled={syncingDrive}
                      className="w-full md:w-auto px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-blue-950 transition-all"
                    >
                      <RefreshCw className={`w-4 h-4 ${syncingDrive ? 'animate-spin' : ''}`} />
                      <span>{syncingDrive ? 'Creando Bóveda...' : '⚡ Crear Bóveda en Google Drive'}</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Subcarpetas de Google Drive */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4 pt-4 border-t border-slate-800/80">
                <a
                  href={data.portalConfig?.driveVault?.subfolders?.insumos?.url || data.portalConfig?.driveVault?.vaultUrl || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3 rounded-xl bg-slate-900/70 border border-slate-800 hover:border-blue-500/50 transition-all flex items-center gap-2.5 group"
                >
                  <span className="text-base">📸</span>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-white group-hover:text-blue-400 transition-colors">01_Insumos_Cliente</p>
                    <p className="text-[10px] text-slate-400 truncate">Logos SVG, fotos 4K y textos</p>
                  </div>
                </a>

                <a
                  href={data.portalConfig?.driveVault?.subfolders?.contratos?.url || data.portalConfig?.driveVault?.vaultUrl || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3 rounded-xl bg-slate-900/70 border border-slate-800 hover:border-blue-500/50 transition-all flex items-center gap-2.5 group"
                >
                  <span className="text-base">📝</span>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-white group-hover:text-blue-400 transition-colors">02_Contratos_Firmados</p>
                    <p className="text-[10px] text-slate-400 truncate">SOW, firma digital y pagos</p>
                  </div>
                </a>

                <a
                  href={data.portalConfig?.driveVault?.subfolders?.entregables?.url || data.portalConfig?.driveVault?.vaultUrl || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3 rounded-xl bg-slate-900/70 border border-slate-800 hover:border-blue-500/50 transition-all flex items-center gap-2.5 group"
                >
                  <span className="text-base">🚀</span>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-white group-hover:text-blue-400 transition-colors">03_Entregables_Codigo</p>
                    <p className="text-[10px] text-slate-400 truncate">PRD técnico, accesos y DNS</p>
                  </div>
                </a>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: Asset Upload Form */}
              <div className="lg:col-span-5 space-y-6">
                <div className="rounded-2xl bg-[#0e1320] border border-slate-800 p-6 space-y-4 shadow-xl">
                  <div>
                    <span className="text-[11px] font-mono uppercase text-orange-400 font-bold tracking-wider">
                      Fase 3 · Entrega de Materiales
                    </span>
                    <h2 className="text-lg font-bold text-white">Subir Insumos de Marca</h2>
                    <p className="text-xs text-slate-400 mt-1">Registra aquí los archivos y recursos necesarios para la construcción:</p>
                  </div>

                  <form onSubmit={handleSubirInsumo} className="space-y-3.5">
                    <div>
                      <label className="text-[11px] text-slate-400 font-mono block mb-1">Categoría del Insumo</label>
                      <select
                        value={assetCategory}
                        onChange={(e) => setAssetCategory(e.target.value)}
                        className="w-full bg-[#141b2b] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
                      >
                        <option value="Logotipo Vectorial">1. Logotipo Vectorial (SVG / PNG HD)</option>
                        <option value="Fotografías & Gráficos">2. Fotografías de Local / Equipo / Productos</option>
                        <option value="Textos & Catálogo">3. Textos de Servicios / Precios / Historia</option>
                        <option value="Accesos & Dominio">4. Accesos de Dominio / DNS Cloudflare</option>
                        <option value="WhatsApp & Redes">5. Teléfonos Oficiales de Contacto WhatsApp</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[11px] text-slate-400 font-mono block mb-1">Nombre o Enlace del Archivo</label>
                      <input
                        type="text"
                        value={assetName}
                        onChange={(e) => setAssetName(e.target.value)}
                        placeholder="Ej. Logo_Clinica_Vector.svg o Carpeta_GoogleDrive"
                        className="w-full bg-[#141b2b] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-orange-500"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] text-slate-400 font-mono block mb-1">Notas o Instrucciones (Opcional)</label>
                      <textarea
                        value={assetNotes}
                        onChange={(e) => setAssetNotes(e.target.value)}
                        rows={2}
                        placeholder="Instrucciones sobre colores corporativos o tipografía..."
                        className="w-full bg-[#141b2b] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 resize-none"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={!assetName.trim()}
                      className="w-full py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-orange-950 transition-all"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Registrar Insumo de Marca</span>
                    </button>
                  </form>
                </div>
              </div>

              {/* Right Column: Uploaded Assets Checklist */}
              <div className="lg:col-span-7 space-y-6">
                <div className="rounded-2xl bg-[#0e1320] border border-slate-800 p-6 space-y-4 shadow-xl">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <div>
                      <h2 className="text-base font-bold text-white">Insumos Registrados en el Proyecto</h2>
                      <p className="text-xs text-slate-400">Total: {(portalConfig?.archivosSubidos || []).length} archivos recibidos</p>
                    </div>
                    {portalConfig?.fase3InsumosCompletos ? (
                      <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-md border border-emerald-500/20 font-bold">
                        ✓ 100% Insumos Recibidos
                      </span>
                    ) : (
                      <span className="text-xs font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded">
                        En Proceso de Recepción
                      </span>
                    )}
                  </div>

                  <div className="space-y-2 max-h-72 overflow-y-auto">
                    {(portalConfig?.archivosSubidos || []).length === 0 ? (
                      <div className="p-6 text-center text-xs text-slate-500 italic bg-slate-900/40 rounded-xl">
                        Aún no se han registrado insumos. Utiliza el formulario a la izquierda.
                      </div>
                    ) : (
                      portalConfig.archivosSubidos.map((arch) => (
                        <div
                          key={arch.id}
                          className="p-3 rounded-xl bg-[#141b2a] border border-slate-800 flex items-center justify-between text-xs hover:border-slate-700 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-emerald-500/15 text-emerald-400 flex items-center justify-center shrink-0">
                              <CheckCircle2 className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="font-bold text-white truncate">{arch.nombre}</div>
                              <div className="text-[10px] text-slate-400 font-mono">{arch.categoria} · {arch.fecha}</div>
                            </div>
                          </div>
                          <span className="text-[10px] bg-slate-800 text-emerald-400 px-2 py-0.5 rounded font-mono font-bold">
                            {arch.estado || 'Recibido'}
                          </span>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Completion Action */}
                  <div className="pt-2">
                    {portalConfig?.fase3InsumosCompletos ? (
                      <button
                        onClick={() => setActiveTab(4)}
                        className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center justify-center gap-2 border border-slate-700"
                      >
                        <span>Ir a la Fase 4: Liquidación & Candado de Accesos</span>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    ) : (
                      <button
                        onClick={handleCompletarInsumos}
                        className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xl shadow-emerald-950 transition-all"
                      >
                        <CheckCheck className="w-4 h-4" />
                        <span>Confirmar Recepción 100% de Insumos & Iniciar Desarrollo</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* FASE 4: LIQUIDACIÓN Y CANDADO DE ACCESOS */}
        {/* ========================================================================= */}
        {activeTab === 4 && (
          <div className="space-y-6">
            <div className="rounded-2xl bg-[#0e1320] border border-slate-800 p-6 space-y-6 shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-3">
                <div>
                  <span className="text-[11px] font-mono uppercase text-orange-400 font-bold tracking-wider">
                    Fase 4 · Staging & Liberación
                  </span>
                  <h2 className="text-xl font-bold text-white">Staging en Vivo & Candado de Seguridad</h2>
                  <p className="text-xs text-slate-400">Revisa tu plataforma web terminada en entorno de pruebas antes del despliegue final.</p>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href="https://goglite-studio-demo.web.app"
                    target="_blank"
                    rel="noreferrer"
                    className="px-3.5 py-1.5 rounded-lg bg-orange-500/15 border border-orange-500/30 text-orange-400 hover:bg-orange-500/25 text-xs font-bold flex items-center gap-1.5 transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Ver Staging Web Demo</span>
                  </a>
                </div>
              </div>

              {/* Quality Audit Badges */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-xl bg-[#141b2b] border border-slate-800 text-center">
                  <div className="text-[10px] font-mono text-slate-400 uppercase">Velocidad Móvil</div>
                  <div className="text-lg font-black text-emerald-400 font-mono mt-0.5">99 / 100</div>
                  <div className="text-[9px] text-slate-500">Google PageSpeed</div>
                </div>
                <div className="p-3 rounded-xl bg-[#141b2b] border border-slate-800 text-center">
                  <div className="text-[10px] font-mono text-slate-400 uppercase">Tiempo de Carga</div>
                  <div className="text-lg font-black text-emerald-400 font-mono mt-0.5">0.65s</div>
                  <div className="text-[9px] text-slate-500">Core Web Vitals LCP</div>
                </div>
                <div className="p-3 rounded-xl bg-[#141b2b] border border-slate-800 text-center">
                  <div className="text-[10px] font-mono text-slate-400 uppercase">Diseño Responsive</div>
                  <div className="text-lg font-black text-sky-400 font-mono mt-0.5">100% OK</div>
                  <div className="text-[9px] text-slate-500">Móvil, Tablet & Desktop</div>
                </div>
                <div className="p-3 rounded-xl bg-[#141b2b] border border-slate-800 text-center">
                  <div className="text-[10px] font-mono text-slate-400 uppercase">WhatsApp & SEO</div>
                  <div className="text-lg font-black text-purple-400 font-mono mt-0.5">Activo</div>
                  <div className="text-[9px] text-slate-500">Eventos de conversión</div>
                </div>
              </div>

              {/* SECURITY LOCK / CREDENTIALS VAULT */}
              {portalConfig?.fase4Liquidada ? (
                /* UNLOCKED VAULT */
                <div className="p-6 rounded-2xl bg-gradient-to-br from-emerald-500/10 via-[#101b24] to-[#0c121d] border-2 border-emerald-500/50 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                        <Unlock className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-white">¡Candado Liberado con Éxito!</h3>
                        <p className="text-xs text-emerald-400">Liquidación recibida el {portalConfig.fechaLiquidacion}. Tus accesos oficiales están activos:</p>
                      </div>
                    </div>
                    <span className="text-xs font-mono font-bold bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full border border-emerald-500/30">
                      Entregado & Transferido
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                    <div className="p-3.5 rounded-xl bg-[#090d16] border border-slate-800 font-mono text-xs">
                      <span className="text-[10px] text-slate-400 block mb-1">Dominio Oficial de Producción:</span>
                      <strong className="text-white block truncate">https://{lead.empresa.toLowerCase().replace(/\s+/g, '')}.com</strong>
                      <span className="text-[9px] text-emerald-400">SSL Let's Encrypt Activo</span>
                    </div>

                    <div className="p-3.5 rounded-xl bg-[#090d16] border border-slate-800 font-mono text-xs">
                      <span className="text-[10px] text-slate-400 block mb-1">Panel Administrativo / CMS:</span>
                      <div className="text-white">Usuario: <strong className="text-orange-400">admin@{lead.empresa.toLowerCase().replace(/\s+/g, '')}.com</strong></div>
                      <div className="text-white">Clave: <strong className="text-emerald-400">Goglite#2026!Secured</strong></div>
                    </div>

                    <div className="p-3.5 rounded-xl bg-[#090d16] border border-slate-800 font-mono text-xs">
                      <span className="text-[10px] text-slate-400 block mb-1">Repositorio Privado GitHub:</span>
                      <strong className="text-white block truncate">github.com/goglite-clients/{lead.empresa.toLowerCase().replace(/\s+/g, '-')}</strong>
                      <span className="text-[9px] text-sky-400">Propiedad Intelectual 100% Cedida</span>
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      onClick={() => setActiveTab(5)}
                      className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center justify-center gap-2 border border-slate-700"
                    >
                      <span>Continuar a Fase 5: Garantía de 30 Días & Mantenimiento</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                /* LOCKED CARD WITH SETTLEMENT REQUIREMENT */
                <div className="p-6 rounded-2xl bg-gradient-to-br from-amber-500/10 via-[#18151f] to-[#0f111a] border-2 border-amber-500/40 space-y-4">
                  <div className="flex items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                        <Lock className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-white">Candado de Accesos Activo</h3>
                        <p className="text-xs text-slate-300">
                          Tu sitio está completado al 100% en staging. Para realizar la conexión a tu dominio oficial, transferir el repositorio y liberar credenciales, realiza la liquidación del 50% restante:
                        </p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-[10px] font-mono text-slate-400 block">Saldo Pendiente (50%)</span>
                      <span className="text-xl font-black text-amber-400 font-mono">${liquidacionMonto} USD</span>
                    </div>
                  </div>

                  <form onSubmit={handleLiquidarProyecto} className="space-y-3 pt-2">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] text-slate-400 font-mono block mb-1">
                          N° Comprobante o Transacción de Liquidación:
                        </label>
                        <input
                          type="text"
                          value={settlementReceiptRef}
                          onChange={(e) => setSettlementReceiptRef(e.target.value)}
                          placeholder="Ej. Transferencia #839102 (Banco Agrícola / Banreservas / uglyCash)"
                          className="w-full bg-[#141b2b] border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-orange-500"
                        />
                      </div>
                      <div className="flex items-end">
                        <button
                          type="submit"
                          disabled={unlockAnimating}
                          className="w-full py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xl shadow-orange-950 transition-all h-[42px]"
                        >
                          {unlockAnimating ? (
                            <>
                              <RefreshCw className="w-4 h-4 animate-spin" />
                              <span>Liberando Credenciales y Repositorio...</span>
                            </>
                          ) : (
                            <>
                              <Unlock className="w-4 h-4" />
                              <span>Confirmar Liquidación y Desbloquear Accesos</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </form>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* FASE 5: GARANTÍA DE 30 DÍAS & CONVERSIÓN A CMS $99/MES */}
        {/* ========================================================================= */}
        {activeTab === 5 && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Left Column: 30-Day Free Post-Launch Guarantee */}
              <div className="lg:col-span-6 space-y-6">
                <div className="rounded-2xl bg-[#0e1320] border border-slate-800 p-6 space-y-5 shadow-xl h-full flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                      <div>
                        <span className="text-[11px] font-mono uppercase text-orange-400 font-bold tracking-wider">
                          Fase 5 · Protección Post-Lanzamiento
                        </span>
                        <h2 className="text-lg font-bold text-white">Garantía VIP de 30 Días</h2>
                      </div>
                      <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-md border border-emerald-500/20 font-bold">
                        100% Incluida
                      </span>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed">
                      Durante los primeros 30 días posteriores al lanzamiento oficial, cuentas con cobertura técnica completa sin ningún costo adicional para asegurar la estabilidad absoluta de tu sitio:
                    </p>

                    {/* Countdown Display Card */}
                    <div className="p-4 rounded-xl bg-[#141b2a] border border-slate-700/80 text-center space-y-2">
                      <span className="text-[11px] font-mono text-slate-400 uppercase">Tiempo Restante de Soporte Gratuito</span>
                      <div className="flex items-center justify-center gap-4 text-white font-mono">
                        <div>
                          <span className="text-2xl font-black text-orange-400">28</span>
                          <span className="text-[10px] text-slate-500 block">DÍAS</span>
                        </div>
                        <span className="text-xl text-slate-600">:</span>
                        <div>
                          <span className="text-2xl font-black text-orange-400">14</span>
                          <span className="text-[10px] text-slate-500 block">HORAS</span>
                        </div>
                        <span className="text-xl text-slate-600">:</span>
                        <div>
                          <span className="text-2xl font-black text-orange-400">35</span>
                          <span className="text-[10px] text-slate-500 block">MIN</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2 pt-2">
                      <div className="flex items-center gap-2 text-xs text-slate-300">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>Corrección inmediata de cualquier error o desajuste visual.</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-300">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>Ajustes menores de textos de contacto, teléfonos o enlaces.</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-300">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>Canal de consulta directa por WhatsApp con respuesta en &lt; 2 horas.</span>
                      </div>
                    </div>
                  </div>

                  <a
                    href={`https://wa.me/50370001122?text=${encodeURIComponent(`Hola Víctor, necesito solicitar un ajuste bajo la garantía de 30 días para ${lead.empresa}.`)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs flex items-center justify-center gap-2 border border-slate-700 mt-4 transition-colors"
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Solicitar Ajuste bajo Garantía de 30 Días</span>
                  </a>
                </div>
              </div>

              {/* Right Column: Goglite Care Conversion ($99/mo) */}
              <div className="lg:col-span-6 space-y-6">
                <div className="rounded-2xl bg-gradient-to-br from-[#121829] via-[#0e1322] to-[#0a0d16] border-2 border-orange-500/50 p-6 space-y-5 shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-48 h-48 bg-orange-500/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>

                  <div className="flex items-center justify-between pb-3 border-b border-slate-800 relative z-10">
                    <div>
                      <span className="text-[11px] font-mono uppercase text-orange-400 font-bold tracking-wider">
                        Mantenimiento Continuo
                      </span>
                      <h2 className="text-xl font-bold text-white">Plan Goglite Care</h2>
                    </div>
                    <div className="text-right">
                      <span className="text-2xl font-black text-white font-mono">$99</span>
                      <span className="text-xs text-slate-400 font-mono"> / mes</span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed relative z-10">
                    Mantén tu plataforma blindada, rápida y actualizada sin preocuparte por caídas de servidor, vencimientos de dominio ni cuellos de botella técnicos:
                  </p>

                  <div className="space-y-2.5 relative z-10">
                    <div className="p-2.5 rounded-lg bg-[#141b2a] border border-slate-800 flex items-start gap-2.5 text-xs text-slate-200">
                      <Star className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-white">Cloud Hosting & CDN Enterprise:</strong> Servidores ultrarrápidos, renovación de SSL y protección anti-DDoS.
                      </div>
                    </div>
                    <div className="p-2.5 rounded-lg bg-[#141b2a] border border-slate-800 flex items-start gap-2.5 text-xs text-slate-200">
                      <Star className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-white">2 Horas Mensuales de Cambios:</strong> Actualización de textos, nuevos banners, fotos de productos y promociones.
                      </div>
                    </div>
                    <div className="p-2.5 rounded-lg bg-[#141b2a] border border-slate-800 flex items-start gap-2.5 text-xs text-slate-200">
                      <Star className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-white">Copias de Seguridad Diarias:</strong> Respaldos automáticos en la nube para restauración en 1 clic ante cualquier eventualidad.
                      </div>
                    </div>
                    <div className="p-2.5 rounded-lg bg-[#141b2a] border border-slate-800 flex items-start gap-2.5 text-xs text-slate-200">
                      <Star className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-white">Soporte WhatsApp Prioritario:</strong> Respuestas en menos de 1 hora directamente con el equipo técnico.
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 relative z-10">
                    {carePlanActive ? (
                      <div className="p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-center space-y-1">
                        <div className="text-xs font-bold text-emerald-400 flex items-center justify-center gap-1.5">
                          <CheckCheck className="w-4 h-4" /> Plan Goglite Care Activo ($99/mes)
                        </div>
                        <p className="text-[11px] text-slate-300">Tu empresa cuenta con protección permanente y soporte prioritario.</p>
                      </div>
                    ) : (
                      <button
                        onClick={handleActivarGogliteCare}
                        className="w-full py-3.5 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-2xl shadow-orange-950 transition-all transform hover:scale-[1.01]"
                      >
                        <Shield className="w-4 h-4" />
                        <span>Activar Plan Goglite Care ($99/mes)</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 mt-10 py-6 text-center text-xs text-slate-500 bg-[#080b12]">
        {agencyBranding.nombreAgencia || 'Goglite Studio Agency'} · {agencyBranding.eslogan || 'Suite Integral de Crecimiento Digital'} · {agencyBranding.ubicacionPrincipal || 'San Salvador (SV) & Santo Domingo (DO)'}
      </footer>

      {/* MODAL: POST-PAYMENT CLIENT AUTHENTICATION */}
      {showClientAuthModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-md rounded-2xl bg-[#0d121d] border border-slate-800 shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Vincular Credenciales de Cliente</h3>
                  <p className="text-[11px] text-slate-400">Acceso permanente a tu portal y bóveda</p>
                </div>
              </div>
              <button
                onClick={() => setShowClientAuthModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              <p className="text-xs text-slate-300 leading-relaxed">
                Elige tu método preferido para ingresar a tu espacio de trabajo de <strong className="text-white">{lead.empresa}</strong>:
              </p>

              {/* Opción 1: Continuar con Google */}
              <button
                type="button"
                disabled={clientAuthLoading}
                onClick={() => handleRegisterClientAuth('google')}
                className="w-full py-3 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs flex items-center justify-center gap-2.5 shadow-md transition-all"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span>{clientAuthLoading ? 'Vinculando con Google...' : 'Continuar con Google (1-Clic)'}</span>
              </button>

              <div className="flex items-center gap-3">
                <div className="h-px bg-slate-800 flex-1"></div>
                <span className="text-[10px] font-mono text-slate-500 uppercase">O con tu Correo y Contraseña</span>
                <div className="h-px bg-slate-800 flex-1"></div>
              </div>

              {/* Opción 2: Correo y Contraseña */}
              <div className="space-y-3">
                <div>
                  <label className="text-[11px] font-mono text-slate-400 block mb-1">Correo Electrónico:</label>
                  <input
                    type="email"
                    value={clientAuthEmail}
                    onChange={(e) => setClientAuthEmail(e.target.value)}
                    placeholder="tu-correo@empresa.com"
                    className="w-full bg-[#141b2a] border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-mono text-slate-400 block mb-1">Crear Contraseña:</label>
                  <input
                    type="password"
                    value={clientAuthPass}
                    onChange={(e) => setClientAuthPass(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full bg-[#141b2a] border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>

                <button
                  type="button"
                  disabled={clientAuthLoading || !clientAuthEmail.trim()}
                  onClick={() => handleRegisterClientAuth('password')}
                  className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-950 transition-all disabled:opacity-50"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>{clientAuthLoading ? 'Guardando...' : 'Guardar y Activar Acceso'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
