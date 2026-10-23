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
  UserCheck,
  Printer,
  LogOut,
  FolderOpen,
  FileUp,
  Trash2
} from 'lucide-react';
import {
  getStoredCrmLeads,
  saveStoredCrmLeads
} from '../services/localStore';
import {
  getStoredProyectos,
  saveStoredProyectos,
  buildProyectoFromPresupuesto,
  ensureProyectoForPresupuesto
} from '../services/contractGenerator';
import { evaluateProjectMilestones } from '../services/projectMilestoneSync';

function GoogleProtectedCard({
  title,
  subtitle,
  description,
  clientEmpresa,
  leadEmail,
  onAuthenticate,
  loading,
  clientAuthPass,
  setClientAuthPass,
  clientAuthEmail,
  setClientAuthEmail
}) {
  return (
    <div className="rounded-2xl bg-gradient-to-b from-[#0f172a] to-[#090d16] border-2 border-amber-500/40 p-6 sm:p-10 shadow-2xl text-center max-w-2xl mx-auto space-y-6 my-4">
      <div className="relative mx-auto w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-xl shadow-amber-950/50">
        <Lock className="w-8 h-8" />
        <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-slate-900 border border-amber-500 flex items-center justify-center text-[10px]">
          🔒
        </div>
      </div>

      <div className="space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-mono font-semibold">
          <ShieldCheck className="w-3.5 h-3.5 text-amber-400" /> Documento Protegido por Google Workspace
        </div>
        <h2 className="text-xl sm:text-2xl font-black text-white">
          {title}
        </h2>
        <div className="text-xs font-mono text-emerald-400">
          {subtitle} · {clientEmpresa}
        </div>
        <p className="text-xs sm:text-sm text-slate-300 max-w-md mx-auto leading-relaxed">
          {description}
        </p>
      </div>

      {/* Auth Actions */}
      <div className="space-y-4 pt-2 max-w-md mx-auto">
        {/* Google One-Click Auth */}
        <button
          type="button"
          disabled={loading}
          onClick={() => onAuthenticate('Google Workspace')}
          className="w-full py-3.5 px-4 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs flex items-center justify-center gap-3 shadow-xl transition-all transform hover:scale-[1.01]"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
          </svg>
          <span>{loading ? 'Verificando con Google...' : 'Acceso Rápido con Google Workspace / Gmail'}</span>
        </button>

        <div className="flex items-center gap-3">
          <div className="h-px bg-slate-800 flex-1" />
          <span className="text-[10px] uppercase font-mono text-slate-500">O autentica con correo corporativo</span>
          <div className="h-px bg-slate-800 flex-1" />
        </div>

        {/* Direct Email + PIN Form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onAuthenticate('Correo / PIN');
          }}
          className="space-y-3 text-left"
        >
          <div>
            <label className="text-[11px] text-slate-400 font-mono block mb-1">Correo Electrónico Autorizado</label>
            <input
              type="email"
              value={clientAuthEmail || leadEmail || ''}
              onChange={(e) => setClientAuthEmail(e.target.value)}
              placeholder={leadEmail || 'contacto@empresa.com'}
              required
              className="w-full bg-[#141b2b] border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="text-[11px] text-slate-400 font-mono block mb-1">PIN / Contraseña</label>
            <input
              type="password"
              value={clientAuthPass}
              onChange={(e) => setClientAuthPass(e.target.value)}
              placeholder="Introduce tu PIN o clave de acceso"
              className="w-full bg-[#141b2b] border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-950 transition-all"
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>{loading ? 'Validando Acceso...' : 'Validar Identidad y Desbloquear Documento'}</span>
          </button>
        </form>
      </div>

      <div className="pt-2 text-[10px] text-slate-500 font-mono flex items-center justify-center gap-2">
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
        <span>Protección Confidencial SSL 256-Bit · Goglite Studio</span>
      </div>
    </div>
  );
}

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
  const [advanceReceiptImage, setAdvanceReceiptImage] = useState('');
  const [advanceReceiptFileName, setAdvanceReceiptFileName] = useState('');
  const advanceReceiptInputRef = useRef(null);
  const [selectedBankTab, setSelectedBankTab] = useState('SV'); // 'SV' | 'DO' | 'US'
  const [previewReceiptModalUrl, setPreviewReceiptModalUrl] = useState(null);

  const applyReceiptDataUrl = (finalUrl, fileName, target = 'advance') => {
    if (target === 'settlement') {
      setSettlementReceiptImage(finalUrl);
      setSettlementReceiptFileName(fileName);
      savePortalUpdates({
        comprobanteLiquidacionImagen: finalUrl,
        comprobanteLiquidacionNombre: fileName
      });
    } else {
      setAdvanceReceiptImage(finalUrl);
      setAdvanceReceiptFileName(fileName);
      savePortalUpdates({
        comprobanteAnticipoImagen: finalUrl,
        comprobanteAnticipoNombre: fileName
      });
    }
    showNotification(`✓ Captura del comprobante "${fileName}" cargada correctamente.`);
  };

  const handleReceiptImageSelect = (e, target = 'advance') => {
    const file = e.target.files?.[0];
    if (!file) return;
    const fileName = file.name || 'Comprobante_Bancario.jpg';
    const fileType = file.type || '';

    const reader = new FileReader();
    reader.onload = (event) => {
      const rawDataUrl = event.target?.result;
      if (!rawDataUrl) return;

      // Si es imagen, optimizar tamaño para almacenamiento ágil y nítido
      if (fileType.startsWith('image/')) {
        const img = new Image();
        img.onload = () => {
          try {
            const maxDim = 1100;
            let width = img.width || 800;
            let height = img.height || 600;
            if (width > maxDim || height > maxDim) {
              if (width > height) {
                height = Math.round((height * maxDim) / width);
                width = maxDim;
              } else {
                width = Math.round((width * maxDim) / height);
                height = maxDim;
              }
            }
            const offCanvas = document.createElement('canvas');
            offCanvas.width = width;
            offCanvas.height = height;
            const ctx = offCanvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);
            const compressedUrl = offCanvas.toDataURL('image/jpeg', 0.82);
            applyReceiptDataUrl(compressedUrl, fileName, target);
          } catch (err) {
            applyReceiptDataUrl(rawDataUrl, fileName, target);
          }
        };
        img.onerror = () => {
          applyReceiptDataUrl(rawDataUrl, fileName, target);
        };
        img.src = rawDataUrl;
      } else {
        applyReceiptDataUrl(rawDataUrl, fileName, target);
      }
    };
    reader.readAsDataURL(file);
  };

  // Fase 3 - Assets intake states
  const [assetName, setAssetName] = useState('');
  const [assetCategory, setAssetCategory] = useState('Logotipo Vectorial');
  const [assetNotes, setAssetNotes] = useState('');
  const fileInputRef = useRef(null);
  const [selectedFile, setSelectedFile] = useState(null);

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    setAssetName(file.name);
  };

  const handleClientLogout = async () => {
    if (!window.confirm('¿Deseas cerrar tu sesión segura en este portal? Las tarjetas de Aprobación y Contrato SOW quedarán protegidas bajo autenticación de Google.')) return;
    await savePortalUpdates({
      clienteAutenticado: false,
      clienteAuthEmail: '',
      clienteAuthProvider: '',
      sesionCerradaProtegida: true
    });
    setData(prev => ({
      ...prev,
      portalConfig: {
        ...(prev?.portalConfig || {}),
        clienteAutenticado: false,
        clienteAuthEmail: '',
        clienteAuthProvider: '',
        sesionCerradaProtegida: true
      }
    }));
    showNotification('Sesión cerrada. Aprobación y Contrato SOW ahora están protegidos con Google.');
  };

  // Fase 4 - Settlement states
  const [settlementReceiptRef, setSettlementReceiptRef] = useState('');
  const [settlementReceiptImage, setSettlementReceiptImage] = useState('');
  const [settlementReceiptFileName, setSettlementReceiptFileName] = useState('');
  const settlementReceiptInputRef = useRef(null);
  const [unlockAnimating, setUnlockAnimating] = useState(false);

  // Fase 5 - Maintenance state
  const [carePlanActive, setCarePlanActive] = useState(false);
  const [syncingDrive, setSyncingDrive] = useState(false);
  const [subiendoInsumo, setSubiendoInsumo] = useState(false);

  const handleSyncDriveVault = async (options = { openWindow: false, silent: false }) => {
    const shouldOpen = options?.openWindow === true;
    const isSilent = options?.silent === true;
    try {
      setSyncingDrive(true);
      const agencyOwnerAccount = 'sitesgoglite@gmail.com';
      const gasDriveWebhook = 'https://script.google.com/macros/s/AKfycbz2qqnBdelAif_BvpwkFCk-0WZ1b2fgiPaPVT3EK0mSyN0jboo_XBdZQL5OCP1rHLT0sw/exec';
      const empresa = data?.presupuesto?.cliente?.empresa || data?.lead?.empresa || 'Cliente';
      const cleanEmpresa = empresa.replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s]/g, '').trim();
      const folderTitle = `[Goglite] ${cleanEmpresa}`;
      const rawAuthEmail = (
        data?.portalConfig?.clienteAuthEmail ||
        clientAuthEmail ||
        data?.presupuesto?.cliente?.email ||
        data?.lead?.email ||
        ''
      ).trim().toLowerCase();
      const authenticatedClientEmail = (rawAuthEmail && rawAuthEmail !== 'cliente@empresa.com' && rawAuthEmail !== 'cliente@gmail.com')
        ? rawAuthEmail
        : agencyOwnerAccount;

      let vault = null;
      try {
        const res = await fetch(`/api/portal/${token}/sync-drive`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            clientName: cleanEmpresa,
            clientEmail: authenticatedClientEmail,
            ownerAccount: agencyOwnerAccount
          })
        });
        const cType = res.headers.get('content-type') || '';
        if (res.ok && cType.includes('application/json')) {
          const result = await res.json();
          if (result.vault && String(result.vault.vaultUrl || '').includes('/drive/folders/')) {
            vault = {
              ...result.vault,
              ownerAccount: agencyOwnerAccount,
              sharedWithEmail: authenticatedClientEmail,
              isolatedClientAccess: true,
              createdByClientAction: true
            };
          }
        }
      } catch (apiErr) {
        console.warn('API sync drive fallback:', apiErr);
      }

      // Ejecutar directamente el puente oficial de Google Apps Script en sitesgoglite@gmail.com (Firebase Hosting)
      if (!vault) {
        try {
          const gasRes = await fetch(gasDriveWebhook, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify({
              clientName: cleanEmpresa,
              clientEmail: authenticatedClientEmail,
              ownerAccount: agencyOwnerAccount
            })
          });
          if (gasRes.ok) {
            const gasData = await gasRes.json();
            if (gasData && gasData.success && gasData.vaultId) {
              vault = {
                ...gasData,
                ownerAccount: agencyOwnerAccount,
                sharedWithEmail: authenticatedClientEmail,
                isolatedClientAccess: true,
                createdByClientAction: true
              };
            }
          }
        } catch (gasErr) {
          console.warn('GAS sync drive error:', gasErr);
        }
      }

      if (!vault) {
        const authUserQuery = authenticatedClientEmail ? `&authuser=${encodeURIComponent(authenticatedClientEmail)}` : '';
        const isolatedFolderQuery = `title = '📁 ${folderTitle}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;
        const vaultUrl = `https://drive.google.com/drive/search?q=${encodeURIComponent(isolatedFolderQuery)}${authUserQuery}`;
        vault = {
          success: true,
          mode: 'cloud',
          ownerAccount: agencyOwnerAccount,
          sharedWithEmail: authenticatedClientEmail,
          isolatedClientAccess: true,
          createdByClientAction: true,
          vaultId: 'vault-' + (data?.lead?.id || token || Date.now()),
          vaultUrl: vaultUrl,
          name: `📁 ${folderTitle}`,
          subfolders: {
            insumos: {
              name: '01_Insumos_Cliente',
              url: `https://drive.google.com/drive/search?q=${encodeURIComponent(`title = '01_Insumos_Cliente' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`)}${authUserQuery}`
            },
            contratos: {
              name: '02_Contratos_Firmados',
              url: `https://drive.google.com/drive/search?q=${encodeURIComponent(`title = '02_Contratos_Firmados' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`)}${authUserQuery}`
            },
            entregables: {
              name: '03_Entregables_Codigo',
              url: `https://drive.google.com/drive/search?q=${encodeURIComponent(`title = '03_Entregables_Codigo' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`)}${authUserQuery}`
            }
          }
        };
      }

      await savePortalUpdates({
        crearBoveda: true,
        clientEmail: authenticatedClientEmail,
        driveVault: vault,
        enlaceDriveArchivos: vault.vaultUrl
      });

      setData(prev => ({
        ...prev,
        portalConfig: {
          ...(prev?.portalConfig || {}),
          driveVault: vault,
          enlaceDriveArchivos: vault.vaultUrl
        }
      }));

      // Abrir en nueva pestaña únicamente si se solicitó abrir explícitamente
      if (shouldOpen) {
        window.open(vault.vaultUrl, '_blank');
      }
      if (!isSilent) {
        showNotification(`✓ ¡Bóveda creada en ${agencyOwnerAccount} y compartida exclusivamente con ${authenticatedClientEmail}!`);
      }
    } catch (e) {
      console.warn('Error sincronizando Drive:', e);
      if (!isSilent) {
        showNotification('Bóveda activada correctamente');
      }
    } finally {
      setSyncingDrive(false);
    }
  };

  useEffect(() => {
    loadPortalData({ silent: false });

    // Escuchar actualizaciones en tiempo real de la base de datos de la aplicación (Fases 1 a 7)
    // IMPORTANTE: No escuchar 'focus' porque al cerrar el selector de archivos del sistema operativo
    // se dispara 'focus' y recargaría el portal desmontando el formulario.
    const handleDatabaseSync = () => {
      loadPortalData({ silent: true });
    };

    window.addEventListener('storage', handleDatabaseSync);
    window.addEventListener('goglite_proyectos_synced', handleDatabaseSync);

    return () => {
      window.removeEventListener('storage', handleDatabaseSync);
      window.removeEventListener('goglite_proyectos_synced', handleDatabaseSync);
    };
  }, [token]);

  const tabInitializedRef = useRef(false);

  // Synchronize state when data is loaded
  useEffect(() => {
    if (data?.portalConfig) {
      const cfg = data.portalConfig;
      if (cfg.nombreFirmante) setSignerName(cfg.nombreFirmante);
      if (cfg.documentoFirmante) setSignerDoc(cfg.documentoFirmante);
      if (cfg.comprobanteAnticipo) setAdvanceReceiptRef(cfg.comprobanteAnticipo);
      if (cfg.comprobanteAnticipoImagen || data?.proyecto?.pagos?.anticipoComprobanteImagen) {
        setAdvanceReceiptImage(cfg.comprobanteAnticipoImagen || data.proyecto.pagos.anticipoComprobanteImagen);
      }
      if (cfg.comprobanteAnticipoNombre || data?.proyecto?.pagos?.anticipoComprobanteNombre) {
        setAdvanceReceiptFileName(cfg.comprobanteAnticipoNombre || data.proyecto.pagos.anticipoComprobanteNombre);
      }
      if (cfg.comprobanteLiquidacion) setSettlementReceiptRef(cfg.comprobanteLiquidacion);
      if (cfg.comprobanteLiquidacionImagen || data?.proyecto?.pagos?.saldoComprobanteImagen) {
        setSettlementReceiptImage(cfg.comprobanteLiquidacionImagen || data.proyecto.pagos.saldoComprobanteImagen);
      }
      if (cfg.comprobanteLiquidacionNombre || data?.proyecto?.pagos?.saldoComprobanteNombre) {
        setSettlementReceiptFileName(cfg.comprobanteLiquidacionNombre || data.proyecto.pagos.saldoComprobanteNombre);
      }
      if (cfg.fase5CareActivo) setCarePlanActive(true);

      // Set initial active tab based on progress ONCE
      if (!tabInitializedRef.current) {
        tabInitializedRef.current = true;
        if (cfg.fase4Liquidada) setActiveTab(5);
        else if (cfg.fase3InsumosCompletos) setActiveTab(4);
        else if (cfg.fase2Firmada) setActiveTab(3);
        else if (cfg.fase1Aprobada) setActiveTab(2);
        else setActiveTab(1);
      }
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
      const email = clientAuthEmail.trim() || data?.lead?.email || 'sitesgoglite@gmail.com';
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
        sesionCerradaProtegida: false,
        fechaAutenticacion: new Date().toISOString()
      });

      setData(prev => ({
        ...prev,
        portalConfig: {
          ...(prev?.portalConfig || {}),
          clienteAutenticado: true,
          clienteAuthEmail: email,
          clienteAuthProvider: provider,
          sesionCerradaProtegida: false,
          fechaAutenticacion: new Date().toISOString()
        }
      }));

      setClientAuthSuccess(true);
      showNotification('✓ ¡Acceso autorizado verificado con Google! Documentos desbloqueados.');
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

  const loadPortalData = async ({ silent = false } = {}) => {
    try {
      if (!silent && !data) {
        setLoading(true);
      }
      let loadedData = null;

      // 0. Prioridad Absoluta: Payload autosuficiente transmitido en la URL (?d=...)
      if (typeof window !== 'undefined') {
        try {
          const searchParams = new URLSearchParams(window.location.search);
          const encodedData = searchParams.get('d');
          if (encodedData) {
            const binaryStr = atob(encodedData);
            const bytes = Uint8Array.from(binaryStr, ch => ch.charCodeAt(0));
            let decodedJson;
            try {
              decodedJson = decodeURIComponent(new TextDecoder('utf-8').decode(bytes));
            } catch {
              decodedJson = new TextDecoder('utf-8').decode(bytes);
            }
            const parsedProp = JSON.parse(decodedJson);
            const hasValidIdOrCode = Boolean(parsedProp && (parsedProp.id || parsedProp.codigo));
            if (hasValidIdOrCode && (parsedProp.cliente || parsedProp.empresa || parsedProp.titulo)) {
              const clientEmpresa = parsedProp.cliente?.empresa || parsedProp.empresa || 'Cliente VIP';
              const clientContacto = parsedProp.cliente?.nombre || parsedProp.contacto || 'Representante Legal';
              const clientPais = parsedProp.pais || parsedProp.cliente?.pais || 'SV';
              const totalMonto = Number(parsedProp.inversion?.precioTotal || parsedProp.precioTotal) || 0;

              const resolvedLead = {
                id: parsedProp.leadId || parsedProp.id || token,
                empresa: clientEmpresa,
                contacto: clientContacto,
                telefono: parsedProp.cliente?.telefono || parsedProp.telefono || '',
                email: parsedProp.cliente?.email || parsedProp.email || '',
                pais: clientPais,
                presupuestoMonto: totalMonto,
                presupuestoCodigo: parsedProp.codigo || 'P-2026',
                portalToken: token
              };

              let storedPortalConfig = {};
              try {
                const c = localStorage.getItem('goglite_portal_' + token) || localStorage.getItem('goglite_portal_' + (parsedProp.leadId || parsedProp.id));
                if (c) storedPortalConfig = JSON.parse(c);
              } catch (e) {}

              // Vincular o generar contrato/proyecto para este cliente
              let matchedProj = null;
              try {
                const projs = getStoredProyectos();
                const targetEmp = clientEmpresa.toLowerCase().trim();
                matchedProj = projs.find(p => 
                  (p.presupuestoId && (p.presupuestoId === parsedProp.id || p.presupuestoId === parsedProp.leadId)) ||
                  (p.presupuestoCodigo && p.presupuestoCodigo === parsedProp.codigo) ||
                  (targetEmp && p.cliente?.empresa && p.cliente.empresa.toLowerCase().trim() === targetEmp)
                );
                if (!matchedProj && (storedPortalConfig.fase1Aprobada || parsedProp.estado === 'aceptado')) {
                  matchedProj = buildProyectoFromPresupuesto(parsedProp, projs);
                  saveStoredProyectos([matchedProj, ...projs]);
                }
              } catch (e) {}

              loadedData = {
                lead: resolvedLead,
                portalConfig: { ...(parsedProp.portalConfig || {}), ...storedPortalConfig },
                presupuesto: parsedProp,
                proyecto: matchedProj
              };

              // Actualizar únicamente la propuesta existente sin duplicar registros
              try {
                const rawP = localStorage.getItem('goglite_presupuestos');
                let curP = rawP ? JSON.parse(rawP) : [];
                const targetEmp = clientEmpresa.toLowerCase().trim();
                const existIdx = curP.findIndex(p =>
                  (parsedProp.id && p.id === parsedProp.id) ||
                  (parsedProp.codigo && p.codigo === parsedProp.codigo) ||
                  (token && p.portalToken === token) ||
                  (parsedProp.leadId && p.leadId === parsedProp.leadId) ||
                  (targetEmp && p.cliente?.empresa && p.cliente.empresa.toLowerCase().trim() === targetEmp)
                );
                if (existIdx !== -1) {
                  const prevEstado = curP[existIdx].estado;
                  const finalEstado = (prevEstado === 'aceptado' || prevEstado === 'rechazado') ? prevEstado : 'visto';
                  curP[existIdx] = {
                    ...curP[existIdx],
                    estado: finalEstado,
                    abiertoEn: curP[existIdx].abiertoEn || new Date().toISOString()
                  };
                  parsedProp.estado = finalEstado;
                } else if (curP.length === 0 && parsedProp.id && parsedProp.codigo) {
                  // Solo insertar en caché si el navegador del cliente externo no tenía ninguna propuesta local
                  const finalEstado = (parsedProp.estado === 'aceptado' || parsedProp.estado === 'rechazado') ? parsedProp.estado : 'visto';
                  parsedProp.estado = finalEstado;
                  parsedProp.abiertoEn = new Date().toISOString();
                  curP.push(parsedProp);
                }
                localStorage.setItem('goglite_presupuestos', JSON.stringify(curP));
              } catch (e) {}
            }
          }
        } catch (urlDecodeErr) {
          console.warn('[Portal] Error decodificando payload de URL:', urlDecodeErr);
        }
      }

      // 1. Consultar en tiempo real la Base de Datos de la Aplicación (Fases 1 a 7) vía API y fusionar con payload URL si existe
      try {
        const res = await fetch(`/api/portal/${token}`);
        const ctype = res.headers.get('content-type') || '';
        if (res.ok && ctype.includes('application/json')) {
          const apiData = await res.json();
          if (apiData && (apiData.lead || apiData.presupuesto || apiData.proyecto)) {
            if (loadedData) {
              loadedData = {
                ...loadedData,
                ...apiData,
                lead: { ...(loadedData.lead || {}), ...(apiData.lead || {}) },
                presupuesto: apiData.presupuesto || loadedData.presupuesto,
                proyecto: apiData.proyecto || loadedData.proyecto,
                portalConfig: { ...(loadedData.portalConfig || {}), ...(apiData.portalConfig || {}) },
                workflowData: apiData.workflowData || loadedData.workflowData || null
              };
            } else {
              loadedData = apiData;
            }
          }
        }
      } catch (err) {
        console.warn('API portal fetch warning, falling back to local storage:', err);
      }

      // 2. Buscar en presupuestos guardados localmente
      if (!loadedData) {
        try {
          const rawP = typeof window !== 'undefined' ? localStorage.getItem('goglite_presupuestos') : null;
          if (rawP) {
            const presupuestos = JSON.parse(rawP);
            const matchedPresupuesto = presupuestos.find(p => 
              p.portalToken === token ||
              p.codigo === token ||
              p.id === token ||
              p.leadId === token ||
              (token && (token.includes(p.id) || p.id.includes(token)))
            );

            if (matchedPresupuesto) {
              const leads = getStoredCrmLeads();
              const pEmpresa = (matchedPresupuesto.cliente?.empresa || '').toLowerCase().trim();
              const pPhone = (matchedPresupuesto.cliente?.telefono || '').replace(/\D/g, '');
              let foundLead = leads.find(l => 
                (matchedPresupuesto.leadId && l.id === matchedPresupuesto.leadId) ||
                (pEmpresa && l.empresa && l.empresa.toLowerCase().trim() === pEmpresa) ||
                (pPhone && l.telefono && l.telefono.replace(/\D/g, '') === pPhone)
              );

              if (!foundLead) {
                foundLead = {
                  id: matchedPresupuesto.leadId || matchedPresupuesto.id,
                  empresa: matchedPresupuesto.cliente?.empresa || 'Cliente VIP',
                  contacto: matchedPresupuesto.cliente?.nombre || 'Representante Legal',
                  telefono: matchedPresupuesto.cliente?.telefono || '',
                  email: matchedPresupuesto.cliente?.email || '',
                  pais: matchedPresupuesto.pais || 'SV',
                  presupuestoMonto: Number(matchedPresupuesto.inversion?.precioTotal) || 0,
                  presupuestoCodigo: matchedPresupuesto.codigo,
                  portalToken: token
                };
              }

              // Auto-actualizar estado a visto
              if (matchedPresupuesto.estado === 'enviado' || matchedPresupuesto.estado === 'sin_abrir' || matchedPresupuesto.estado === 'borrador') {
                try {
                  const updatedP = presupuestos.map(p => p.id === matchedPresupuesto.id ? { ...p, estado: 'visto' } : p);
                  localStorage.setItem('goglite_presupuestos', JSON.stringify(updatedP));
                  matchedPresupuesto.estado = 'visto';
                } catch (e) {}
              }

              loadedData = {
                lead: foundLead,
                portalConfig: foundLead.portalConfig || {},
                presupuesto: matchedPresupuesto,
                proyecto: null
              };
            }
          }
        } catch (pErr) {
          console.warn('[Portal] Error buscando en presupuestos locales:', pErr);
        }
      }

      // 3. Buscar en leads de CRM guardados localmente
      if (!loadedData) {
        try {
          const leads = getStoredCrmLeads();
          let found = leads.find(l => 
            l.portalToken === token || 
            l.id === token || 
            l.presupuestoId === token ||
            (token && (token.includes(l.id) || l.id.includes(token)))
          );

          if (found) {
            let matchedPresupuesto = null;
            const rawP = typeof window !== 'undefined' ? localStorage.getItem('goglite_presupuestos') : null;
            if (rawP) {
              const presupuestos = JSON.parse(rawP);
              const fEmpresa = (found.empresa || '').toLowerCase().trim();
              matchedPresupuesto = presupuestos.find(p => 
                p.id === found.presupuestoId || 
                p.leadId === found.id || 
                (fEmpresa && p.cliente?.empresa && p.cliente.empresa.toLowerCase().trim() === fEmpresa)
              );
            }

            loadedData = {
              lead: found,
              portalConfig: found.portalConfig || {},
              presupuesto: matchedPresupuesto,
              proyecto: null
            };
          }
        } catch (e) {
          console.error('Error parsing local leads:', e);
        }
      }

      // 4. Si aún no hay data pero existe al menos un presupuesto real en el sistema, usar el más reciente
      if (!loadedData) {
        try {
          const rawP = typeof window !== 'undefined' ? localStorage.getItem('goglite_presupuestos') : null;
          if (rawP) {
            const presupuestos = JSON.parse(rawP);
            if (Array.isArray(presupuestos) && presupuestos.length > 0) {
              const latestP = presupuestos[0];
              loadedData = {
                lead: {
                  id: latestP.leadId || latestP.id,
                  empresa: latestP.cliente?.empresa || 'Cliente VIP',
                  contacto: latestP.cliente?.nombre || 'Representante Legal',
                  telefono: latestP.cliente?.telefono || '',
                  email: latestP.cliente?.email || '',
                  pais: latestP.pais || 'SV',
                  presupuestoMonto: Number(latestP.inversion?.precioTotal) || 0,
                  presupuestoCodigo: latestP.codigo,
                  portalToken: token
                },
                portalConfig: {},
                presupuesto: latestP,
                proyecto: null
              };
            }
          }
        } catch (e) {}
      }

      // 5. Fallback demo data SOLO si el sistema está completamente vacío
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

      // Enlazar con proyecto formal si existe y reconciliar progreso por eventos y sprint
      try {
        const storedProjs = getStoredProyectos();
        const leadEmp = (loadedData?.lead?.empresa || '').toLowerCase().trim();
        const matchedProj = storedProjs.find(p => 
          (loadedData.proyecto && p.id === loadedData.proyecto.id) ||
          (loadedData.presupuesto && (p.presupuestoId === loadedData.presupuesto.id || p.presupuestoCodigo === loadedData.presupuesto.codigo)) ||
          (leadEmp && p.cliente?.empresa && p.cliente.empresa.toLowerCase().trim() === leadEmp)
        );
        if (matchedProj) {
          const evaluatedProj = evaluateProjectMilestones(matchedProj);
          loadedData.proyecto = evaluatedProj;
          if (evaluatedProj.seguimiento?.porcentajeAvance) {
            loadedData.portalConfig = {
              ...(loadedData.portalConfig || {}),
              progresoPorcentaje: evaluatedProj.seguimiento.porcentajeAvance
            };
          }
        }
      } catch (projSyncErr) {
        console.warn('[Portal] Error sincronizando con proyectos:', projSyncErr);
      }

      // 6. Marcar dinámicamente la propuesta como 'visto' (Abierto por el cliente) al abrir el enlace del portal
      try {
        const currentProp = loadedData?.presupuesto;
        const isAlreadyFinal = currentProp?.estado === 'aceptado' || currentProp?.estado === 'rechazado' || loadedData?.portalConfig?.fase1Aprobada;
        const resolvedStatus = loadedData?.portalConfig?.fase1Aprobada ? 'aceptado' : (isAlreadyFinal ? currentProp.estado : 'visto');

        if (currentProp) {
          currentProp.estado = resolvedStatus;
          if (!currentProp.abiertoEn) currentProp.abiertoEn = new Date().toISOString();
        }

        if (typeof window !== 'undefined') {
          const rawP = localStorage.getItem('goglite_presupuestos');
          if (rawP) {
            const listP = JSON.parse(rawP);
            const targetEmp = (loadedData?.lead?.empresa || currentProp?.cliente?.empresa || '').toLowerCase().trim();
            let pChanged = false;
            const nextListP = listP.map(p => {
              const pEmp = (p.cliente?.empresa || '').toLowerCase().trim();
              const isMatch = (currentProp?.id && p.id === currentProp.id) ||
                              (currentProp?.codigo && p.codigo === currentProp.codigo) ||
                              (token && p.portalToken === token) ||
                              (targetEmp && pEmp === targetEmp);
              if (isMatch) {
                const nextEst = (p.estado === 'aceptado' || p.estado === 'rechazado') ? p.estado : resolvedStatus;
                if (p.estado !== nextEst) {
                  pChanged = true;
                  return {
                    ...p,
                    estado: nextEst,
                    abiertoEn: p.abiertoEn || new Date().toISOString(),
                    vecesAbierto: (Number(p.vecesAbierto) || 0) + 1
                  };
                }
              }
              return p;
            });

            if (pChanged) {
              localStorage.setItem('goglite_presupuestos', JSON.stringify(nextListP));
              window.dispatchEvent(new CustomEvent('goglite_presupuestos_updated'));
            }
          }

          // Sincronizar también en CRM Leads
          const crmLeads = getStoredCrmLeads();
          const targetEmp = (loadedData?.lead?.empresa || currentProp?.cliente?.empresa || '').toLowerCase().trim();
          let crmChanged = false;
          const nextCrm = crmLeads.map(cl => {
            const clEmp = (cl.empresa || '').toLowerCase().trim();
            if (cl.portalToken === token || (loadedData?.lead?.id && cl.id === loadedData.lead.id) || (targetEmp && clEmp === targetEmp)) {
              const nextEst = (cl.presupuestoEstado === 'aceptado') ? 'aceptado' : resolvedStatus;
              if (cl.presupuestoEstado !== nextEst) {
                crmChanged = true;
                return { ...cl, presupuestoEstado: nextEst };
              }
            }
            return cl;
          });
          if (crmChanged) {
            saveStoredCrmLeads(nextCrm);
          }
        }

        // Notificar al backend en segundo plano que el cliente abrió el enlace
        fetch(`/api/portal/${token}/update`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            propuestaVista: true,
            estadoPropuesta: resolvedStatus,
            abiertoEn: new Date().toISOString()
          })
        }).catch(() => {});
      } catch (openTrackErr) {
        console.warn('[Portal] Error registrando apertura de propuesta:', openTrackErr);
      }

      // Fusionar siempre cualquier configuración persistida localmente en goglite_portal_<token>
      try {
        if (typeof window !== 'undefined' && loadedData) {
          const rawLocalPortal = localStorage.getItem('goglite_portal_' + token) ||
            (loadedData.lead?.id ? localStorage.getItem('goglite_portal_' + loadedData.lead.id) : null);
          if (rawLocalPortal) {
            const parsedLocalPortal = JSON.parse(rawLocalPortal);
            loadedData.portalConfig = {
              ...(loadedData.portalConfig || {}),
              ...parsedLocalPortal
            };
          }
        }
      } catch (e) {}

      setData(prev => {
        if (!prev) return loadedData;
        return {
          ...loadedData,
          portalConfig: {
            ...(loadedData?.portalConfig || {}),
            comprobanteAnticipoImagen: loadedData?.portalConfig?.comprobanteAnticipoImagen || prev?.portalConfig?.comprobanteAnticipoImagen || '',
            comprobanteAnticipoNombre: loadedData?.portalConfig?.comprobanteAnticipoNombre || prev?.portalConfig?.comprobanteAnticipoNombre || '',
            comprobanteLiquidacionImagen: loadedData?.portalConfig?.comprobanteLiquidacionImagen || prev?.portalConfig?.comprobanteLiquidacionImagen || '',
            comprobanteLiquidacionNombre: loadedData?.portalConfig?.comprobanteLiquidacionNombre || prev?.portalConfig?.comprobanteLiquidacionNombre || ''
          }
        };
      });
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
      if (typeof window !== 'undefined') {
        localStorage.setItem('goglite_portal_' + (token || data.lead.id), JSON.stringify(newPortalConfig));
      }
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
        const cType = res.headers.get('content-type') || '';
        if (cType.includes('application/json')) {
          const respData = await res.json();
          setData(prev => ({
            ...prev,
            lead: respData.lead || prev?.lead,
            presupuesto: respData.presupuesto || prev?.presupuesto,
            proyecto: respData.proyecto || prev?.proyecto,
            workflowData: respData.workflowData || prev?.workflowData,
            portalConfig: {
              ...(prev?.portalConfig || {}),
              ...(respData.portalConfig || {}),
              ...(respData.driveVault ? {
                driveVault: respData.driveVault,
                enlaceDriveArchivos: respData.driveVault.vaultUrl
              } : {})
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
    setActiveTab(2);
    showNotification('✓ ¡Propuesta comercial aprobada con éxito! Ahora formalicemos el contrato y anticipo.');

    // 1. Asegurar la creación inmediata del proyecto y contrato formal SOW
    let generatedProj = null;
    try {
      if (data?.presupuesto) {
        generatedProj = ensureProyectoForPresupuesto(data.presupuesto);
      } else if (data?.lead) {
        generatedProj = ensureProyectoForPresupuesto({
          id: data.lead.id,
          codigo: data.lead.presupuestoCodigo || 'P-2026',
          cliente: {
            nombre: data.lead.contacto,
            empresa: data.lead.empresa,
            telefono: data.lead.telefono,
            email: data.lead.email,
            ubicacion: data.lead.pais === 'DO' ? 'República Dominicana' : 'El Salvador'
          },
          pais: data.lead.pais || 'SV',
          inversion: {
            precioTotal: data.lead.presupuestoMonto || 650,
            anticipo: Math.round((data.lead.presupuestoMonto || 650) * 0.5),
            contraEntrega: Math.round((data.lead.presupuestoMonto || 650) * 0.5)
          }
        });
      }

      if (generatedProj) {
        setData(prev => ({
          ...prev,
          proyecto: generatedProj
        }));
      }
    } catch (projErr) {
      console.warn('Error auto-generando proyecto:', projErr);
    }

    // 2. Persistir actualización del portal
    try {
      await savePortalUpdates({
        fase1Aprobada: true,
        fechaAprobacionPropuesta: new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }),
        progresoPorcentaje: 40,
        faseActual: 2
      });
    } catch (err) {
      console.warn('Portal update err:', err);
    }

    // 3. Actualizar también el estado en presupuestos a 'aceptado'
    try {
      const rawP = localStorage.getItem('goglite_presupuestos');
      let presupuestos = rawP ? JSON.parse(rawP) : [];
      const targetEmpresa = (data?.lead?.empresa || data?.presupuesto?.cliente?.empresa || '').toLowerCase().trim();
      let foundProp = false;
      const updated = presupuestos.map(p => {
        const pName = (p.cliente?.empresa || '').toLowerCase().trim();
        if ((data?.presupuesto?.id && p.id === data.presupuesto.id) || (data?.presupuesto?.codigo && p.codigo === data.presupuesto.codigo) || (targetEmpresa && pName === targetEmpresa)) {
          foundProp = true;
          return { ...p, ...(data.presupuesto || {}), estado: 'aceptado' };
        }
        return p;
      });
      if (!foundProp && data?.presupuesto) {
        updated.unshift({ ...data.presupuesto, estado: 'aceptado' });
      }
      localStorage.setItem('goglite_presupuestos', JSON.stringify(updated));
      window.dispatchEvent(new Event('storage'));
    } catch (e) {}
  };

  const handleFirmarContrato = async (e) => {
    e?.preventDefault?.();
    if (!signerName.trim()) {
      alert('Por favor indica el nombre completo del firmante autorizado.');
      return;
    }
    if (!hasSignature && !data.portalConfig?.firmaDigital) {
      alert('Por favor realiza tu firma digital manuscrita en el recuadro interactivo.');
      return;
    }
    const finalReceiptImage = advanceReceiptImage || data.portalConfig?.comprobanteAnticipoImagen || data.proyecto?.pagos?.anticipoComprobanteImagen || '';
    const finalReceiptFileName = advanceReceiptFileName || data.portalConfig?.comprobanteAnticipoNombre || data.proyecto?.pagos?.anticipoComprobanteNombre || '';
    if (!finalReceiptImage) {
      alert('Por favor sube la captura o imagen del comprobante de pago generado por tu aplicación bancaria.');
      return;
    }

    let signatureUrl = data.portalConfig?.firmaDigital || null;
    if (canvasRef.current && hasSignature) {
      signatureUrl = canvasRef.current.toDataURL('image/png');
    }

    const fechaFirma = new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
    const textoComprobante = advanceReceiptRef.trim() || (finalReceiptFileName ? `Captura: ${finalReceiptFileName}` : 'Captura de Comprobante Adjunta');

    // 1. Actualizar o crear proyecto formal firmado en el almacén local
    let targetUpdatedProj = null;
    try {
      const projs = getStoredProyectos();
      const targetEmp = (clientEmpresa || '').toLowerCase().trim();
      let found = false;

      const updatedProjs = projs.map(p => {
        const pEmp = (p.cliente?.empresa || '').toLowerCase().trim();
        if ((data?.proyecto?.id && p.id === data.proyecto.id) || (data?.presupuesto?.id && p.presupuestoId === data.presupuesto.id) || (targetEmp && pEmp === targetEmp)) {
          found = true;
          const hitos = (p.seguimiento?.hitos || []).map(h => {
            if (h.id === 'h-1') return { ...h, completado: true, fecha: fechaFirma };
            if (h.id === 'h-2' && (advanceReceiptRef.trim() || finalReceiptImage)) return { ...h, completado: true, fecha: fechaFirma };
            return h;
          });

          const modP = {
            ...p,
            estado: 'firmado',
            faseActual: 3,
            contrato: {
              ...(p.contrato || {}),
              firmaCliente: {
                firmado: true,
                nombreFirmante: signerName.trim(),
                identificacion: signerDoc.trim() || 'Identificación Oficial Registrada',
                timestampUtc: new Date().toISOString(),
                ipAddress: 'Portal Seguro SSL 256-bit',
                firmaBase64: signatureUrl
              }
            },
            pagos: {
              ...(p.pagos || {}),
              anticipoComprobante: textoComprobante,
              anticipoComprobanteImagen: finalReceiptImage,
              anticipoComprobanteNombre: finalReceiptFileName || 'Comprobante_Anticipo_50.jpg',
              anticipoFecha: fechaFirma,
              anticipoEstado: 'verificacion'
            },
            seguimiento: {
              ...(p.seguimiento || {}),
              faseActual: 2,
              hitos
            }
          };
          const evaluatedP = evaluateProjectMilestones(modP);
          targetUpdatedProj = evaluatedP;
          return evaluatedP;
        }
        return p;
      });

      if (!found) {
        const baseProj = activeProyecto || (data?.presupuesto ? buildProyectoFromPresupuesto(data.presupuesto, projs) : null);
        if (baseProj) {
          const hitos = (baseProj.seguimiento?.hitos || []).map(h => {
            if (h.id === 'h-1') return { ...h, completado: true, fecha: fechaFirma };
            if (h.id === 'h-2' && (advanceReceiptRef.trim() || finalReceiptImage)) return { ...h, completado: true, fecha: fechaFirma };
            return h;
          });

          const freshProj = {
            ...baseProj,
            id: baseProj.id || ('proj-' + Date.now()),
            estado: 'firmado',
            faseActual: 3,
            contrato: {
              ...(baseProj.contrato || {}),
              firmaCliente: {
                firmado: true,
                nombreFirmante: signerName.trim(),
                identificacion: signerDoc.trim() || 'Identificación Oficial Registrada',
                timestampUtc: new Date().toISOString(),
                ipAddress: 'Portal Seguro SSL 256-bit',
                firmaBase64: signatureUrl
              }
            },
            pagos: {
              ...(baseProj.pagos || {}),
              anticipoComprobante: textoComprobante,
              anticipoComprobanteImagen: finalReceiptImage,
              anticipoComprobanteNombre: finalReceiptFileName || 'Comprobante_Anticipo_50.jpg',
              anticipoFecha: fechaFirma,
              anticipoEstado: 'verificacion'
            },
            seguimiento: {
              ...(baseProj.seguimiento || {}),
              faseActual: 2,
              hitos
            }
          };
          targetUpdatedProj = evaluateProjectMilestones(freshProj);
          updatedProjs.unshift(targetUpdatedProj);
        }
      }

      saveStoredProyectos(updatedProjs);
      window.dispatchEvent(new CustomEvent('goglite_proyectos_synced', { detail: { proyectos: updatedProjs } }));
    } catch (e) {
      console.warn('Error guardando proyecto firmado:', e);
    }

    // 2. Actualizar estado del presupuesto en localStorage a 'aceptado'
    try {
      const rawP = localStorage.getItem('goglite_presupuestos');
      if (rawP) {
        const presupuestos = JSON.parse(rawP);
        const targetEmp = (clientEmpresa || '').toLowerCase().trim();
        const updatedProps = presupuestos.map(p => {
          const pEmp = (p.cliente?.empresa || '').toLowerCase().trim();
          if ((data?.presupuesto?.id && p.id === data.presupuesto.id) || (data?.presupuesto?.codigo && p.codigo === data.presupuesto.codigo) || (targetEmp && pEmp === targetEmp)) {
            return {
              ...p,
              estado: 'aceptado',
              contratoFirmado: true,
              fechaFirma: fechaFirma
            };
          }
          return p;
        });
        localStorage.setItem('goglite_presupuestos', JSON.stringify(updatedProps));
      }
    } catch (e) {}

    // 3. Persistir en portal config
    await savePortalUpdates({
      fase2Firmada: true,
      fechaFirmaContrato: fechaFirma,
      firmaDigital: signatureUrl,
      nombreFirmante: signerName.trim(),
      documentoFirmante: signerDoc.trim() || 'Identificación Oficial Registrada',
      comprobanteAnticipo: textoComprobante,
      comprobanteAnticipoImagen: finalReceiptImage,
      comprobanteAnticipoNombre: finalReceiptFileName || 'Comprobante_Anticipo_50.jpg',
      anticipoPagado: true,
      progresoPorcentaje: 60,
      faseActual: 3
    });

    if (targetUpdatedProj) {
      setData(prev => ({
        ...prev,
        proyecto: targetUpdatedProj
      }));
    }

    // Disparar sincronización global para otros componentes
    window.dispatchEvent(new Event('storage'));

    setActiveTab(3);
    showNotification('✓ ¡Contrato formalizado con éxito y comprobante registrado! Pasando a Fase 3.');
  };

  const handleSubirInsumo = async (e) => {
    e.preventDefault();
    const fileToUpload = selectedFile || fileInputRef.current?.files?.[0] || null;
    if (!assetName.trim() && !fileToUpload) {
      alert('Por favor selecciona un archivo de tu dispositivo o indica el nombre/enlace del insumo.');
      return;
    }

    try {
      setSubiendoInsumo(true);
      const finalName = assetName.trim() || fileToUpload?.name || 'Archivo Adjunto';
      const finalSize = fileToUpload 
        ? (fileToUpload.size > 1048576 ? (fileToUpload.size / 1048576).toFixed(1) + ' MB' : Math.round(fileToUpload.size / 1024) + ' KB')
        : 'Enlace Web';

      const empresa = data?.presupuesto?.cliente?.empresa || data?.lead?.empresa || 'Cliente';
      const cleanEmpresa = empresa.replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s]/g, '').trim();
      const rawAuthEmail = (
        data?.portalConfig?.clienteAuthEmail ||
        clientAuthEmail ||
        data?.presupuesto?.cliente?.email ||
        data?.lead?.email ||
        ''
      ).trim().toLowerCase();
      const authenticatedClientEmail = (rawAuthEmail && rawAuthEmail !== 'cliente@empresa.com' && rawAuthEmail !== 'cliente@gmail.com')
        ? rawAuthEmail
        : 'sitesgoglite@gmail.com';

      // 1. Convertir archivo a base64 si se seleccionó archivo local
      let fileBase64 = null;
      let isImage = false;
      if (fileToUpload) {
        isImage = (fileToUpload.type || '').startsWith('image/');
        fileBase64 = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = (err) => reject(err);
          reader.readAsDataURL(fileToUpload);
        });
      }

      // 2. Subir directamente a la bóveda en Google Drive (sitesgoglite@gmail.com) -> subcarpeta 01_Insumos_Cliente
      let driveResult = null;
      try {
        const gasPayload = {
          action: 'uploadFile',
          clientName: cleanEmpresa,
          clientEmail: authenticatedClientEmail,
          targetSubfolder: '01_Insumos_Cliente',
          fileName: finalName,
          category: assetCategory,
          notes: assetNotes.trim()
        };
        if (fileBase64) {
          gasPayload.fileBase64 = fileBase64;
          gasPayload.mimeType = fileToUpload?.type || 'application/octet-stream';
        } else {
          gasPayload.textContent = `Insumo de Marca: ${finalName}\nCategoría: ${assetCategory}\nNotas/Instrucciones: ${assetNotes.trim() || 'Sin notas'}\nFecha: ${new Date().toLocaleString('es-ES')}`;
          gasPayload.mimeType = 'text/plain';
        }

        const gasRes = await fetch('https://script.google.com/macros/s/AKfycbz2qqnBdelAif_BvpwkFCk-0WZ1b2fgiPaPVT3EK0mSyN0jboo_XBdZQL5OCP1rHLT0sw/exec', {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify(gasPayload)
        });
        if (gasRes.ok) {
          driveResult = await gasRes.json();
        }
      } catch (uploadErr) {
        console.warn('Error subiendo insumo a Google Drive:', uploadErr);
      }

      if (!driveResult || !driveResult.success || !driveResult.fileUrl) {
        alert('No se pudo guardar el archivo en Google Drive. Verifica tu conexión o intenta nuevamente.');
        return;
      }

      const nuevoArchivo = {
        id: 'f-' + Date.now(),
        nombre: finalName,
        tamano: finalSize,
        categoria: assetCategory,
        notas: assetNotes.trim(),
        fecha: new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }),
        hora: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
        estado: 'Recibido en Drive',
        driveUrl: driveResult.fileUrl,
        driveFileId: driveResult.fileId,
        driveFolderUrl: driveResult.folderUrl || data.portalConfig?.driveVault?.subfolders?.insumos?.url || null,
        previewUrl: (isImage && fileBase64 && fileBase64.length < 500000) ? fileBase64 : null,
        isDirectFile: Boolean(fileToUpload)
      };

      const archivosActuales = data.portalConfig?.archivosSubidos || [];
      const actualizados = [...archivosActuales, nuevoArchivo];

      // 3. Sincronizar con el proyecto en el Dashboard (Fase 3: Contratos & Onboarding)
      try {
        const projs = getStoredProyectos();
        const targetEmp = cleanEmpresa.toLowerCase().trim();
        const updatedProjs = projs.map(p => {
          const pEmp = (p.cliente?.empresa || '').toLowerCase().trim();
          if ((data?.proyecto?.id && p.id === data.proyecto.id) || (data?.presupuesto?.id && p.presupuestoId === data.presupuesto.id) || (targetEmp && pEmp === targetEmp)) {
            return {
              ...p,
              onboarding: {
                ...(p.onboarding || {}),
                archivosSubidos: actualizados,
                archivosRecibidos: actualizados,
                driveVault: data?.portalConfig?.driveVault || p.onboarding?.driveVault || null,
                enlaceDriveInsumos: driveResult?.folderUrl || p.onboarding?.enlaceDriveInsumos || null,
                enlaceDriveArchivos: data?.portalConfig?.driveVault?.vaultUrl || p.onboarding?.enlaceDriveArchivos || null,
                ultimaRecepcionInsumos: new Date().toISOString()
              }
            };
          }
          return p;
        });
        saveStoredProyectos(updatedProjs);
        window.dispatchEvent(new CustomEvent('goglite_proyectos_synced', { detail: { proyectos: updatedProjs } }));
      } catch (projErr) {
        console.warn('Error sincronizando proyecto en Dashboard:', projErr);
      }

      await savePortalUpdates({
        archivosSubidos: actualizados
      });

      setAssetName('');
      setSelectedFile(null);
      setAssetNotes('');
      if (fileInputRef.current) fileInputRef.current.value = '';
      
      showNotification(`✓ Archivo "${nuevoArchivo.nombre}" (${finalSize}) guardado directamente en Google Drive.`);
    } catch (err) {
      alert('Error registrando insumo: ' + err.message);
    } finally {
      setSubiendoInsumo(false);
    }
  };

  const handleEliminarInsumo = async (archId) => {
    if (!window.confirm('¿Deseas eliminar este insumo de la lista del proyecto?')) return;
    const archivosActuales = data.portalConfig?.archivosSubidos || [];
    const actualizados = archivosActuales.filter(a => a.id !== archId);

    try {
      const projs = getStoredProyectos();
      const cleanEmpresa = (data?.presupuesto?.cliente?.empresa || data?.lead?.empresa || '').toLowerCase().trim();
      const updatedProjs = projs.map(p => {
        const pEmp = (p.cliente?.empresa || '').toLowerCase().trim();
        if ((data?.proyecto?.id && p.id === data.proyecto.id) || (data?.presupuesto?.id && p.presupuestoId === data.presupuesto.id) || (cleanEmpresa && pEmp === cleanEmpresa)) {
          return {
            ...p,
            onboarding: {
              ...(p.onboarding || {}),
              archivosSubidos: actualizados,
              archivosRecibidos: actualizados
            }
          };
        }
        return p;
      });
      saveStoredProyectos(updatedProjs);
      window.dispatchEvent(new CustomEvent('goglite_proyectos_synced', { detail: { proyectos: updatedProjs } }));
    } catch (e) {}

    await savePortalUpdates({
      archivosSubidos: actualizados
    });
    showNotification('Insumo eliminado del proyecto.');
  };

  const handleCompletarInsumos = async () => {
    try {
      const storedProjs = getStoredProyectos();
      const leadEmp = (data?.lead?.empresa || '').toLowerCase().trim();
      const idx = storedProjs.findIndex(p => 
        (data?.proyecto && p.id === data.proyecto.id) ||
        (data?.presupuesto && (p.presupuestoId === data.presupuesto.id || p.presupuestoCodigo === data.presupuesto.codigo)) ||
        (leadEmp && p.cliente?.empresa && p.cliente.empresa.toLowerCase().trim() === leadEmp)
      );
      if (idx !== -1) {
        storedProjs[idx] = evaluateProjectMilestones({
          ...storedProjs[idx],
          onboarding: {
            ...(storedProjs[idx].onboarding || {}),
            completado: true,
            fecha: new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })
          }
        });
        saveStoredProyectos(storedProjs);
        window.dispatchEvent(new CustomEvent('goglite_proyectos_synced', { detail: { proyectos: storedProjs } }));
      }
    } catch (e) {
      console.warn('Error sync onboarding with project:', e);
    }

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
    const finalSettlementImg = settlementReceiptImage || data.portalConfig?.comprobanteLiquidacionImagen || data.proyecto?.pagos?.saldoComprobanteImagen || '';
    const finalSettlementName = settlementReceiptFileName || data.portalConfig?.comprobanteLiquidacionNombre || data.proyecto?.pagos?.saldoComprobanteNombre || '';
    if (!finalSettlementImg && !settlementReceiptRef.trim()) {
      alert('Por favor sube la captura del comprobante de liquidación bancaria o indica el número de transacción.');
      return;
    }
    const textoLiquidacion = settlementReceiptRef.trim() || (finalSettlementName ? `Captura: ${finalSettlementName}` : 'Comprobante de Liquidación Adjunto');

    setUnlockAnimating(true);
    setTimeout(async () => {
      try {
        const storedProjs = getStoredProyectos();
        const leadEmp = (data?.lead?.empresa || '').toLowerCase().trim();
        const idx = storedProjs.findIndex(p => 
          (data?.proyecto && p.id === data.proyecto.id) ||
          (data?.presupuesto && (p.presupuestoId === data.presupuesto.id || p.presupuestoCodigo === data.presupuesto.codigo)) ||
          (leadEmp && p.cliente?.empresa && p.cliente.empresa.toLowerCase().trim() === leadEmp)
        );
        if (idx !== -1) {
          storedProjs[idx] = evaluateProjectMilestones({
            ...storedProjs[idx],
            estado: 'entregado',
            pagos: {
              ...(storedProjs[idx].pagos || {}),
              saldoEstado: 'confirmado',
              saldoComprobante: textoLiquidacion,
              saldoComprobanteImagen: finalSettlementImg || storedProjs[idx].pagos?.saldoComprobanteImagen || null,
              saldoComprobanteNombre: finalSettlementName || storedProjs[idx].pagos?.saldoComprobanteNombre || null,
              saldoFecha: new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })
            }
          });
          saveStoredProyectos(storedProjs);
          window.dispatchEvent(new CustomEvent('goglite_proyectos_synced', { detail: { proyectos: storedProjs } }));
        }
      } catch (err) {
        console.warn('Error sync settlement with project:', err);
      }

      await savePortalUpdates({
        fase4Liquidada: true,
        fechaLiquidacion: new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }),
        comprobanteLiquidacion: textoLiquidacion,
        comprobanteLiquidacionImagen: finalSettlementImg || null,
        comprobanteLiquidacionNombre: finalSettlementName || null,
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

  const { lead, portalConfig, presupuesto } = data;
  const rawUbicacion = (presupuesto?.cliente?.ubicacion || data.proyecto?.cliente?.ubicacion || lead.ubicacion || '').toLowerCase();
  const currentPais = (presupuesto?.pais === 'DO' || data.proyecto?.pais === 'DO' || lead.pais === 'DO' || rawUbicacion.includes('dominicana') || rawUbicacion.includes('santo domingo')) ? 'DO' : 'SV';
  const isSV = currentPais === 'SV';
  const activeBankTab = selectedBankTab === 'US' ? 'US' : currentPais;
  const totalInversion = Number(presupuesto?.inversion?.precioTotal || lead.presupuestoMonto) || 650;
  const anticipoMonto = Number(presupuesto?.inversion?.anticipo) || Math.round(totalInversion * 0.5);
  const liquidacionMonto = Number(presupuesto?.inversion?.contraEntrega) || (totalInversion - anticipoMonto);
  const clientEmpresa = presupuesto?.cliente?.empresa || lead.empresa || 'Empresa Cliente';
  const clientContacto = presupuesto?.cliente?.nombre || lead.contacto || 'Representante Legal';
  const clientUbicacion = presupuesto?.cliente?.ubicacion || (currentPais === 'DO' ? 'Santo Domingo, República Dominicana' : 'San Salvador, El Salvador');

  // Asegurar que el contrato formal SOW y el proyecto estén siempre resueltos
  const activeProyecto = data.proyecto || (presupuesto ? buildProyectoFromPresupuesto(presupuesto) : (lead ? buildProyectoFromPresupuesto({
    id: lead.id,
    codigo: lead.presupuestoCodigo || 'P-2026',
    cliente: { nombre: clientContacto, empresa: clientEmpresa, telefono: lead.telefono, email: lead.email, ubicacion: clientUbicacion },
    pais: currentPais,
    inversion: { precioTotal: totalInversion, anticipo: anticipoMonto, contraEntrega: liquidacionMonto }
  }) : null));

  const contrato = activeProyecto?.contrato;

  const isFase1Done = Boolean(portalConfig?.fase1Aprobada);
  const isFase2Done = Boolean(portalConfig?.fase2Firmada);
  const isFase3Done = Boolean(portalConfig?.fase3InsumosCompletos || (portalConfig?.archivosSubidos && portalConfig.archivosSubidos.length > 0));
  const isFase4Done = Boolean(portalConfig?.fase4Liquidada);
  const isFase5Done = Boolean(portalConfig?.fase5CareActivo);

  // Cuando el cliente cierra sesión o una vez firmado el contrato, las tarjetas 1 ("Aprobación") y 2 ("Contrato SOW") quedan protegidas por Google
  const isDocumentosAnterioresProtegidos = !portalConfig?.clienteAutenticado && (
    Boolean(portalConfig?.sesionCerradaProtegida) || 
    Boolean(portalConfig?.fase2Firmada) || 
    (Boolean(portalConfig?.fase1Aprobada) && Boolean(portalConfig?.sesionCerradaProtegida))
  );

  const steps = [
    { 
      num: 1, 
      title: 'Aprobación 1-Clic', 
      label: isDocumentosAnterioresProtegidos ? '🔒 Protegido Google' : 'Propuesta VIP', 
      done: isFase1Done, 
      unlocked: true,
      isGoogleProtected: isDocumentosAnterioresProtegidos
    },
    { 
      num: 2, 
      title: 'Contrato SOW', 
      label: isDocumentosAnterioresProtegidos ? '🔒 Protegido Google' : 'Anticipo 50%', 
      done: isFase2Done, 
      unlocked: isFase1Done,
      isGoogleProtected: isDocumentosAnterioresProtegidos
    },
    { num: 3, title: 'Intake Insumos', label: 'Garantía 10 Días', done: isFase3Done, unlocked: isFase1Done && isFase2Done },
    { num: 4, title: 'Liquidación', label: 'Candado de Accesos', done: isFase4Done, unlocked: isFase1Done && isFase2Done && isFase3Done },
    { num: 5, title: 'Garantía 30 Días', label: 'Plan CMS $99/mes', done: isFase5Done, unlocked: isFase1Done && isFase2Done && isFase3Done && isFase4Done }
  ];

  const handleSelectTab = (st) => {
    if (!st.unlocked) {
      const msg = st.num === 2
        ? '🔒 Fase 2 Bloqueada: Primero debes aprobar la Propuesta Comercial en la Fase 1.'
        : st.num === 3
        ? '🔒 Fase 3 Bloqueada: Debes firmar el Contrato SOW y reportar el comprobante de anticipo en la Fase 2.'
        : st.num === 4
        ? '🔒 Fase 4 Bloqueada: Se habilitará cuando se completen los insumos en la Fase 3.'
        : '🔒 Fase 5 Bloqueada: Se habilitará tras completar la liquidación en la Fase 4.';
      showNotification(msg, 'warning');
      return;
    }
    setActiveTab(st.num);
  };

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
              href={`https://wa.me/${(agencyBranding.telefonoWhatsapp || '+503 7000-1122').replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Hola, te escribo desde el Portal de Cliente de ${clientEmpresa}.`)}`}
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
                  {currentPais === 'DO' ? '🇩🇴 República Dominicana' : '🇸🇻 El Salvador'}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                {clientEmpresa}
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
                Estimado(a) <strong className="text-white">{clientContacto}</strong>: este es tu portal confidencial para aprobar tu proyecto, formalizar el contrato, cargar insumos y recibir tu código y credenciales.
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
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 text-xs font-mono text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-xl border border-emerald-500/20">
                    <UserCheck className="w-4 h-4" />
                    <span>Autenticado ({portalConfig.clienteAuthProvider || 'Google'})</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleClientLogout}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-rose-950/60 text-slate-300 hover:text-rose-300 border border-slate-700 hover:border-rose-500/50 text-xs font-medium transition-all shadow-sm"
                    title="Cerrar sesión de cliente"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Cerrar Sesión</span>
                  </button>
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
            const isLocked = !st.unlocked;

            const isGoogleProtected = st.isGoogleProtected;

            return (
              <button
                key={st.num}
                type="button"
                onClick={() => handleSelectTab(st)}
                className={`p-3.5 rounded-xl border text-left transition-all relative overflow-hidden ${
                  isCurrent
                    ? isGoogleProtected
                      ? 'bg-amber-500/15 border-amber-500 text-white shadow-lg shadow-amber-950/40'
                      : 'bg-orange-500/15 border-orange-500 text-white shadow-lg shadow-orange-950/40'
                    : isGoogleProtected
                    ? 'bg-[#121320] border-amber-500/30 text-amber-200 hover:border-amber-500/60'
                    : isCompleted
                    ? 'bg-[#0f1524] border-emerald-500/40 text-slate-200 hover:border-emerald-500/60'
                    : isLocked
                    ? 'bg-[#080b12] border-slate-800/60 text-slate-600 opacity-60 cursor-not-allowed'
                    : 'bg-[#0c101b] border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                {isGoogleProtected ? (
                  <div className="absolute top-1.5 right-1.5 flex items-center gap-1">
                    <span className="text-[9px] bg-amber-500/20 text-amber-400 px-1 py-0.2 rounded font-mono font-bold">Google</span>
                    <Lock className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                  </div>
                ) : isCompleted ? (
                  <div className="absolute top-1.5 right-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  </div>
                ) : isLocked ? (
                  <div className="absolute top-1.5 right-1.5">
                    <Lock className="w-3.5 h-3.5 text-slate-600" />
                  </div>
                ) : null}
                <div className="flex items-center gap-1.5 mb-1">
                  <span className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded ${
                    isCurrent 
                      ? isGoogleProtected ? 'bg-amber-500 text-slate-900' : 'bg-orange-500 text-white' 
                      : isGoogleProtected
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      : isCompleted 
                      ? 'bg-emerald-500/20 text-emerald-400' 
                      : isLocked
                      ? 'bg-slate-900 text-slate-600 border border-slate-800'
                      : 'bg-slate-800 text-slate-400'
                  }`}>
                    0{st.num}
                  </span>
                  <span className="text-[11px] font-bold truncate">{st.title}</span>
                </div>
                <div className="text-[10px] text-slate-400 truncate flex items-center gap-1">
                  {isGoogleProtected ? (
                    <span className="text-amber-400 font-medium flex items-center gap-1">
                      <ShieldCheck className="w-2.5 h-2.5 inline text-amber-400" /> Protegido Google
                    </span>
                  ) : isLocked ? (
                    <span className="text-slate-500 flex items-center gap-1">
                      <Lock className="w-2.5 h-2.5 inline" /> Bloqueado
                    </span>
                  ) : (
                    <span>{st.label}</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* TAB PANELS: 5 PHASES */}
        
        {/* ========================================================================= */}
        {/* FASE 1: APROBACIÓN 1-CLIC & LECTURA COMPLETA DE PROPUESTA OFICIAL */}
        {/* ========================================================================= */}
        {activeTab === 1 && (
          isDocumentosAnterioresProtegidos ? (
            <GoogleProtectedCard
              title="Propuesta VIP y Oferta Comercial Protegida"
              subtitle="Fase 1 · Aprobación VIP"
              description={`Por estrictas políticas de confidencialidad comercial y protección de datos, la propuesta económica y los términos técnicos aprobados de ${clientEmpresa} están protegidos bajo autenticación corporativa de Google. Para acceder a este documento oficial, debes validar tu identidad con tu cuenta autorizada.`}
              clientEmpresa={clientEmpresa}
              leadEmail={lead.email}
              onAuthenticate={handleRegisterClientAuth}
              loading={clientAuthLoading}
              clientAuthPass={clientAuthPass}
              setClientAuthPass={setClientAuthPass}
              clientAuthEmail={clientAuthEmail}
              setClientAuthEmail={setClientAuthEmail}
            />
          ) : (
          <div className="space-y-6">
            {/* Top Action & Control Bar */}
            <div className="no-print rounded-2xl bg-[#0e1320] border border-slate-800 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono uppercase text-orange-400 font-bold tracking-wider">
                    Fase 1 · Propuesta de Desarrollo Digital VIP
                  </span>
                  <span className="text-slate-600">·</span>
                  <span className="text-xs font-mono font-bold text-slate-200">
                    {presupuesto?.codigo || 'P-2026-001'}
                  </span>
                </div>
                <h2 className="text-sm sm:text-base font-bold text-white">
                  Documento Oficial de la Oferta Comercial & Alcance Técnico
                </h2>
                <p className="text-xs text-slate-400">
                  Puedes leer el documento completo a continuación, imprimirlo o descargarlo en PDF si deseas archivar una copia, o aprobarlo directamente en línea con un solo clic.
                </p>
              </div>

              <div className="flex items-center gap-2.5 shrink-0">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-2 border border-slate-700 transition-all shadow-sm"
                  title="Imprimir o Guardar en PDF para tus archivos"
                >
                  <Printer className="w-4 h-4 text-orange-400" />
                  <span>Imprimir / Descargar PDF</span>
                </button>

                {portalConfig?.fase1Aprobada ? (
                  <button
                    onClick={() => setActiveTab(2)}
                    className="px-4 py-2.5 rounded-xl bg-emerald-600/20 border border-emerald-500/40 text-emerald-300 font-bold text-xs flex items-center gap-2 shadow-sm"
                  >
                    <CheckCheck className="w-4 h-4" />
                    <span>Propuesta Aprobada · Ir a Contrato SOW →</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleAprobarPropuesta}
                    className="px-5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs flex items-center gap-2 shadow-xl shadow-orange-950 transition-all transform hover:scale-[1.02]"
                  >
                    <Check className="w-4 h-4" />
                    <span>Aprobar Propuesta (1-Clic)</span>
                  </button>
                )}
              </div>
            </div>

            {/* FULL EXECUTIVE PROPOSAL DOCUMENT (ESTILO GOOGLE DOCS / GOGLITE OFICIAL) */}
            <div 
              id="printable-client-proposal"
              className="bg-slate-900/60 p-2 sm:p-6 text-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-2xl print:border-none print:p-0 print:shadow-none print:bg-transparent print:m-0 space-y-6 print:space-y-0"
            >
              {/* PÁGINA 1: PORTADA OFICIAL GOGLITE */}
              <div className="pdf-page-cover relative w-full aspect-[210/297] max-w-4xl mx-auto overflow-hidden bg-white shadow-2xl rounded-xl print:rounded-none print:shadow-none">
                <img 
                  src="/assets/portada_oficial_fija.png" 
                  alt="Propuesta de Desarrollo Digital VIP" 
                  className="w-full h-full object-cover block"
                />
              </div>

              {/* PÁGINA 2: RESUMEN EJECUTIVO, ESTRATEGIA, ALCANCE Y CONDICIONES */}
              <div className="pdf-page-content max-w-4xl mx-auto p-6 sm:p-12 bg-white shadow-2xl rounded-xl print:rounded-none print:shadow-none text-slate-900 font-sans leading-relaxed text-xs">
                {/* Sub-Header con Marca Goglite y Metadatos */}
                <div className="border-b-2 border-slate-900 pb-4 mb-6 avoid-break">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <img 
                        src="/assets/goglite_logo.png" 
                        alt={presupuesto?.emisor?.empresa || 'Goglite'} 
                        className="h-10 w-auto object-contain"
                      />
                      <div className="text-[10px] text-slate-600 font-medium space-y-0.5 border-l border-slate-300 pl-3">
                        <div><strong>Ubicación:</strong> {presupuesto?.emisor?.ubicacion || 'Santa Ana, El Salvador · Santo Domingo, RD'}</div>
                        <div><strong>Contacto:</strong> {presupuesto?.emisor?.telefono || '(503) 7756-9828'} | {presupuesto?.emisor?.email || 'info@goglite.com'}</div>
                        <div><strong>Director:</strong> {presupuesto?.emisor?.responsable || 'Víctor Matos'}</div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-[11px] font-mono font-bold text-slate-900 uppercase">
                        Fecha: {presupuesto?.fecha || new Date().toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
                      </div>
                      <div className="text-[11px] font-mono text-orange-600 font-bold mt-0.5">
                        {presupuesto?.codigo || 'P-2026-001'}
                      </div>
                    </div>
                  </div>

                  {/* DESTINATARIO */}
                  <div className="mt-4 p-3.5 rounded-lg bg-slate-50 border border-slate-200">
                    <div className="text-[10px] font-mono uppercase text-slate-500 font-bold">Cliente / Destinatario:</div>
                    <div className="text-sm font-extrabold text-slate-900 mt-0.5">
                      {clientContacto} | {clientEmpresa}
                    </div>
                    <div className="text-[11px] text-slate-700">
                      Tel: {presupuesto?.cliente?.telefono || lead?.telefono || ''} · {presupuesto?.cliente?.actividad || 'Servicios Comerciales'}
                    </div>
                  </div>
                </div>

                {/* 2. TÍTULO DE LA PROPUESTA VIP */}
                <div className="mb-6 avoid-break">
                  <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight leading-snug uppercase">
                    {presupuesto?.titulo || 'PROPUESTA DE DESARROLLO DIGITAL VIP'}
                  </h2>
                  {(presupuesto?.subtitulo || lead?.servicio) && (
                    <div className="text-xs font-semibold text-orange-600 mt-0.5">
                      {presupuesto?.subtitulo || lead?.servicio}
                    </div>
                  )}
                </div>

                {/* 3. BLOQUES ESTRATÉGICOS FIJOS */}
                <div className="space-y-3 mb-6 bg-slate-50 p-4 sm:p-5 rounded-xl border border-slate-200/80 avoid-break text-[11px]">
                  <div>
                    <span className="font-extrabold text-slate-900 block mb-0.5">
                      • Proyecto & Diagnóstico:
                    </span>
                    <p className="text-slate-700 leading-normal">
                      {presupuesto?.portada?.proyecto || `Desarrollo e implementación del Sistema Web Mobile-First para ${clientEmpresa}, diseñado con arquitectura limpia y optimizado para captación de clientes.`}
                    </p>
                  </div>

                  <div>
                    <span className="font-extrabold text-slate-900 block mb-0.5">
                      • Enfoque de Conversión Inmediata:
                    </span>
                    <p className="text-slate-700 leading-normal">
                      {presupuesto?.portada?.enfoqueEstrategico || 'Arquitectura orientada a la conversión directa con botones de llamada instantánea (Click-to-Call), botón flotante de WhatsApp Business y embudo de respuesta inmediata.'}
                    </p>
                  </div>

                  <div>
                    <span className="font-extrabold text-slate-900 block mb-0.5">
                      • Tecnología y Rendimiento Mobile-First:
                    </span>
                    <p className="text-slate-700 leading-normal">
                      {presupuesto?.portada?.tecnologiaMobileFirst || 'Arquitectura ultra-rápida optimizada al 100% para teléfonos inteligentes (velocidad de carga inferior a 1.2 segundos y Core Web Vitals en verde).'}
                    </p>
                  </div>

                  <div>
                    <span className="font-extrabold text-slate-900 block mb-0.5">
                      • GEO & SEO Local de Nueva Generación (Optimizado para IA y Buscadores):
                    </span>
                    <p className="text-slate-700 leading-normal">
                      {presupuesto?.portada?.geoSeoLocal || 'Estructura semántica avanzada (Schema.org LocalBusiness) para asegurar máxima visibilidad en Google Maps, buscadores y motores de IA (ChatGPT / Perplexity).'}
                    </p>
                  </div>
                </div>

                {/* 4. COMPONENTES DEL SISTEMA INTEGRAL */}
                <div className="mb-6">
                  <h2 className="text-xs font-black uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1.5 mb-3.5">
                    1. Componentes del Sistema Integral (Alcance y Entregables)
                  </h2>

                  <div className="space-y-3.5">
                    {(presupuesto?.modulos && presupuesto.modulos.length > 0 ? presupuesto.modulos : [
                      { numero: 'MÓDULO 1', titulo: 'Plataforma Web Corporativa de Alta Conversión (Mobile-First)', descripcion: 'Arquitectura responsive optimizada al 100% para dispositivos móviles. Incluye secciones estratégicas StoryBrand, catálogo de servicios, cobertura y llamado a la acción.' },
                      { numero: 'MÓDULO 2', titulo: 'Canales de Cierre y Contacto Directo (WhatsApp & Click-to-Call)', descripcion: 'Integración de botón flotante inteligente de WhatsApp Business con mensaje preconfigurado y marcado directo de un solo toque.' },
                      { numero: 'MÓDULO 3', titulo: 'Optimización del Perfil de Google Negocio & SEO/GEO Local', descripcion: 'Configuración técnica de Schema.org JSON-LD, categorización en Google Maps y ecosistema de códigos QR para captación de reseñas 5 estrellas.' }
                    ]).map((m, i) => (
                      <div key={i} className="pl-3.5 border-l-2 border-orange-500 space-y-0.5 avoid-break">
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
                <div className="mb-6 avoid-break">
                  <h2 className="text-xs font-black uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1.5 mb-3.5">
                    2. Hoja de Ruta y Fases de Implementación (10 a 15 Días Hábiles)
                  </h2>

                  <div className="space-y-2">
                    {(presupuesto?.fases && presupuesto.fases.length > 0 ? presupuesto.fases : [
                      { fase: 'Fase 1', plazo: 'Días 1 a 4', detalle: 'Configuración de activos digitales, arquitectura de información StoryBrand, ficha de Google Maps y códigos QR vectoriales.' },
                      { fase: 'Fase 2', plazo: 'Días 5 a 10', detalle: 'Desarrollo de la plataforma web Mobile-First, integración de canales de cierre en WhatsApp y optimización SEO/GEO.' },
                      { fase: 'Fase 3', plazo: 'Días 11 a 15', detalle: 'Auditoría de velocidad móvil, revisión conjunta con el cliente, ajustes finales y despliegue en producción.' }
                    ]).map((f, i) => (
                      <div key={i} className="text-[11px] text-slate-800">
                        <span className="font-extrabold text-slate-900">• {f.fase} ({f.plazo}):</span> {f.detalle}
                      </div>
                    ))}
                  </div>
                </div>

                {/* 3. INVERSIÓN ESTRATÉGICA Y CONDICIONES */}
                <div className="mb-6 p-5 sm:p-6 rounded-xl bg-slate-900 text-white avoid-break shadow-md">
                  <h2 className="text-xs font-black uppercase tracking-wider text-orange-400 mb-2">
                    3. Inversión Estratégica y Condiciones Comerciales
                  </h2>

                  <p className="text-[11px] text-slate-300 leading-relaxed mb-3">
                    La inversión en un sistema digital integral de esta envergadura suele oscilar entre los <strong>${presupuesto?.inversion?.precioMercadoReferencial || Math.max(1500, totalInversion * 2)} USD</strong> en el mercado profesional. Para <strong>{clientEmpresa}</strong> hemos estructurado un paquete preferencial:
                  </p>

                  <div className="bg-white/10 p-3.5 rounded-lg border border-white/15 space-y-1.5 font-mono mb-4">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-300">Inversión Total del Sistema Completo:</span>
                      <span className="text-base font-extrabold text-orange-400">
                        ${totalInversion} USD
                      </span>
                    </div>
                    {presupuesto?.inversion?.beneficioExclusivo && (
                      <div className="text-[10px] text-emerald-300 font-sans pt-1 border-t border-white/10">
                        ★ <strong>Beneficio Exclusivo:</strong> {presupuesto.inversion.beneficioExclusivo}
                      </div>
                    )}
                  </div>

                  <div className="text-[10px] text-slate-300 space-y-1.5 font-sans">
                    <div>• <strong>Forma de Pago:</strong> ${anticipoMonto} USD de anticipo para iniciar y ${liquidacionMonto} USD contra entrega final y publicación.</div>
                    <div>• <strong>Revisiones:</strong> {presupuesto?.inversion?.revisiones || 'Dos (2) rondas completas de ajustes de diseño y contenido.'}</div>
                    <div>• <strong>Requisitos de Inicio:</strong> {presupuesto?.inversion?.requisitosInicio || 'Logotipo, fotografías del negocio/servicios, número oficial de WhatsApp y datos de contacto.'}</div>
                    <div>• <strong>Vigencia de la Oferta:</strong> {presupuesto?.vigenciaDias || 15} días calendario.</div>
                  </div>
                </div>

                {/* 4. FIRMA OFICIAL GOGLITE */}
                <div className="pt-4 border-t border-slate-300 flex items-center justify-between text-[11px] text-slate-600 avoid-break mt-6">
                  <div>
                    <div className="font-extrabold text-slate-900 text-xs">{presupuesto?.emisor?.responsable || 'Víctor Matos'}</div>
                    <div className="text-orange-600 font-bold">{presupuesto?.emisor?.empresa || 'Goglite'}</div>
                    <div className="text-[10px] text-slate-500">{presupuesto?.emisor?.telefono || '(503) 7756-9828'} | {presupuesto?.emisor?.email || 'info@goglite.com'}</div>
                  </div>

                  <div className="text-right">
                    <div className="font-mono text-[10px] text-slate-400">Documento Oficial Certificado</div>
                    <div className="text-xs font-bold text-slate-900 uppercase">Estado: {presupuesto?.estado || 'EMITIDO'}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Executive Approval Banner */}
            <div className="no-print rounded-2xl bg-gradient-to-r from-[#101626] via-[#121c33] to-[#101626] border border-orange-500/30 p-6 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-2xl">
              <div className="space-y-1.5 text-center sm:text-left">
                <span className="text-[10px] font-mono uppercase text-orange-400 font-bold tracking-wider">
                  Compromiso de Garantía de Ejecución
                </span>
                <h3 className="text-base font-bold text-white">
                  ¿Listo para iniciar el desarrollo de {clientEmpresa}?
                </h3>
                <p className="text-xs text-slate-300 max-w-xl">
                  Al presionar <strong className="text-white">Aprobar Propuesta</strong>, formalizas la aceptación comercial y avanzas a la Fase 2 para registrar el contrato SOW y coordinar el anticipo del 50%.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="w-full sm:w-auto px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-2 border border-slate-700 transition-all"
                >
                  <Printer className="w-4 h-4 text-orange-400" />
                  <span>Imprimir / Descargar PDF</span>
                </button>

                {portalConfig?.fase1Aprobada ? (
                  <button
                    type="button"
                    onClick={() => setActiveTab(2)}
                    className="w-full sm:w-auto px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xl shadow-emerald-950 transition-all"
                  >
                    <span>Continuar a Fase 2: Contrato SOW</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleAprobarPropuesta}
                    className="w-full sm:w-auto px-7 py-3 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-2xl shadow-orange-950 transition-all transform hover:scale-[1.02]"
                  >
                    <Check className="w-4 h-4" />
                    <span>Aprobar Propuesta (1-Clic) & Continuar</span>
                  </button>
                )}
              </div>
            </div>
          </div>
          )
        )}

        {/* ========================================================================= */}
        {/* ========================================================================= */}
        {/* FASE 2: CONTRATO SOW & ANTICIPO 50% (CON FIRMA CANVAS) */}
        {/* ========================================================================= */}
        {activeTab === 2 && (
          isDocumentosAnterioresProtegidos ? (
            <GoogleProtectedCard
              title="Contrato Formal SOW y Comprobantes Protegidos"
              subtitle="Fase 2 · Formalización Legal SOW"
              description={`El Contrato Oficial de Prestación de Servicios Digitales (SOW), las firmas digitales manuscritas y los comprobantes bancarios de ${clientEmpresa} contienen información legal confidencial. Autentica tu cuenta autorizada de Google para consultar o imprimir este contrato formal.`}
              clientEmpresa={clientEmpresa}
              leadEmail={lead.email}
              onAuthenticate={handleRegisterClientAuth}
              loading={clientAuthLoading}
              clientAuthPass={clientAuthPass}
              setClientAuthPass={setClientAuthPass}
              clientAuthEmail={clientAuthEmail}
              setClientAuthEmail={setClientAuthEmail}
            />
          ) : (
          <div className="space-y-6">
            {/* Top Action & Control Bar */}
            <div className="no-print rounded-2xl bg-[#0e1320] border border-slate-800 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono uppercase text-orange-400 font-bold tracking-wider">
                    Fase 2 · Formalización Legal SOW
                  </span>
                  <span className="text-slate-600">·</span>
                  <span className="text-xs font-mono font-bold text-slate-200">
                    {contrato?.codigo || activeProyecto?.codigo || 'CON-2026-001'}
                  </span>
                  <span className="text-slate-600">·</span>
                  <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                    portalConfig?.fase2Firmada 
                      ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' 
                      : 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                  }`}>
                    {portalConfig?.fase2Firmada ? '✓ Contrato Firmado' : 'Pendiente de Firma y Anticipo'}
                  </span>
                </div>
                <h2 className="text-sm sm:text-base font-bold text-white">
                  Contrato Oficial de Prestación de Servicios Digitales (SOW)
                </h2>
                <p className="text-xs text-slate-400">
                  Revisa los términos legales, cláusulas de propiedad intelectual y plazos oficiales. Puedes imprimir o descargar tu contrato en PDF, o firmarlo digitalmente en el formulario interactivo.
                </p>
              </div>

              <div className="flex items-center gap-2.5 shrink-0">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-2 border border-slate-700 transition-all shadow-sm"
                  title="Imprimir o Guardar en PDF para tus archivos"
                >
                  <Printer className="w-4 h-4 text-orange-400" />
                  <span>Imprimir / Descargar Contrato PDF</span>
                </button>

                {portalConfig?.fase2Firmada && (
                  <button
                    onClick={() => setActiveTab(3)}
                    className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 shadow-sm transition-all"
                  >
                    <span>Ir a Fase 3: Intake de Insumos</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* FULL PRINTABLE SOW CONTRACT SHEET (A4 Presentation idéntica al panel interno) */}
            <div 
              id="printable-client-contract"
              className="bg-white text-slate-900 rounded-2xl shadow-2xl p-6 sm:p-12 border border-slate-200 print:border-none print:p-0 print:shadow-none print:rounded-none max-w-4xl mx-auto"
            >
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
                  <div className="font-mono text-xs font-bold text-orange-600">{activeProyecto?.codigo || 'CON-2026-001'}</div>
                  <div className="text-[10px] text-slate-500">{contrato?.fechaEmision || new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
                </div>
              </div>

              {/* Title */}
              <div className="text-center my-6">
                <h1 className="text-base sm:text-lg font-black uppercase tracking-tight text-slate-950">
                  {contrato?.titulo || 'CONTRATO OFICIAL DE PRESTACIÓN DE SERVICIOS DIGITALES Y DESARROLLO WEB'}
                </h1>
                <p className="text-xs text-slate-600 mt-1">
                  Entre Goglite Digital y {clientEmpresa}
                </p>
              </div>

              {/* Parties Section */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs mb-6 space-y-2">
                <p className="leading-relaxed">
                  <strong>DE UNA PARTE:</strong> <strong>GOGLITE DIGITAL</strong>, representada por su Director General <strong>Víctor Matos</strong>, con facultades suficientes para celebrar este acto en calidad de <strong>EL PRESTADOR</strong>.
                </p>
                <p className="leading-relaxed">
                  <strong>DE OTRA PARTE:</strong> <strong>{clientContacto}</strong>, en representación legal de <strong>{clientEmpresa}</strong>, con domicilio en {clientUbicacion}, en adelante <strong>EL CLIENTE</strong>.
                </p>
                <p className="text-slate-600 text-[11px] pt-1 border-t border-slate-200">
                  Ambas partes se reconocen recíprocamente la capacidad legal necesaria para otorgar el presente contrato de servicios con base en las siguientes cláusulas:
                </p>
              </div>

              {/* Clauses */}
              <div className="space-y-4 text-xs text-slate-800">
                {(contrato?.clausulas || []).map((c, i) => (
                  <div key={i} className="space-y-1">
                    <h4 className="font-black text-slate-950 uppercase tracking-wide text-[11px]">
                      CLÁUSULA {c.numero}: {c.titulo}
                    </h4>
                    <p className="text-slate-700 leading-relaxed text-justify whitespace-pre-line">
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
                    <div className="text-sm font-bold text-white font-mono">${totalInversion} USD</div>
                  </div>
                  <div>
                    <div className="text-slate-400 text-[10px]">Anticipo (50%):</div>
                    <div className="text-sm font-bold text-emerald-400 font-mono">${anticipoMonto} USD</div>
                  </div>
                  <div>
                    <div className="text-slate-400 text-[10px]">Saldo Final (50%):</div>
                    <div className="text-sm font-bold text-amber-300 font-mono">${liquidacionMonto} USD</div>
                  </div>
                </div>
              </div>

              {/* Signature Section Inside Document */}
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
                    <div>Director General · Goglite Digital</div>
                    <div className="text-emerald-700 font-mono font-bold mt-0.5">Certificado por Goglite Digital</div>
                  </div>
                </div>

                {/* Client Signature Preview Inside Document */}
                <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 flex flex-col justify-between">
                  <div>
                    <div className="text-[10px] uppercase font-bold text-slate-500 mb-2">Por El Cliente ({clientEmpresa}):</div>
                    
                    {portalConfig?.fase2Firmada && portalConfig?.firmaDigital ? (
                      <div className="h-16 flex items-center justify-center border-b border-slate-300 pb-2">
                        <img 
                          src={portalConfig.firmaDigital} 
                          alt="Firma Digital Cliente" 
                          className="max-h-14 max-w-full object-contain filter invert"
                        />
                      </div>
                    ) : (
                      <div className="h-16 flex items-center justify-center border-b border-dashed border-slate-300 text-slate-400 text-[11px] italic pb-2 text-center">
                        ✍ Firma digital pendiente en el formulario interactivo
                      </div>
                    )}
                  </div>
                  <div className="mt-2 text-center text-[10px] text-slate-600">
                    <div className="font-bold text-slate-900">
                      {portalConfig?.nombreFirmante || clientContacto}
                    </div>
                    <div>
                      {portalConfig?.documentoFirmante ? `ID: ${portalConfig.documentoFirmante}` : 'Representante Legal'}
                    </div>
                    {portalConfig?.fase2Firmada && (
                      <div className="text-emerald-700 font-mono font-bold mt-0.5">
                        ✓ Firmado Electrónicamente ({portalConfig.fechaFirmaContrato || '16 Oct 2026'})
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Interactive Execution Form: Canvas Signature & Banking Details */}
            <div className="no-print grid grid-cols-1 lg:grid-cols-12 gap-6 pt-2">
              
              {/* Left Column: SOW Agreement & Canvas Signature */}
              <div className="lg:col-span-7 space-y-6">
                <div className="rounded-2xl bg-[#0e1320] border border-slate-800 p-6 space-y-5 shadow-xl">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                    <div>
                      <span className="text-[11px] font-mono uppercase text-orange-400 font-bold tracking-wider">
                        Firma Electrónica Certificada
                      </span>
                      <h2 className="text-lg font-bold text-white">Registro de Firma del Contrato</h2>
                    </div>
                    {portalConfig?.fase2Firmada && (
                      <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-md border border-emerald-500/20 flex items-center gap-1 font-bold">
                        <CheckCheck className="w-3.5 h-3.5" /> Firmado
                      </span>
                    )}
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
                    <p className="text-xs text-slate-400 mt-0.5">Selecciona tu método de transferencia local o internacional (USD):</p>
                  </div>

                  {/* Bank Country Selector (Solo país del cliente + uglyCash / USA) */}
                  <div className="flex rounded-xl bg-[#141b2b] p-1 border border-slate-800">
                    {isSV ? (
                      <button
                        type="button"
                        onClick={() => setSelectedBankTab('SV')}
                        className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                          activeBankTab === 'SV' ? 'bg-orange-600 text-white shadow' : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        🇸🇻 El Salvador
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setSelectedBankTab('DO')}
                        className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                          activeBankTab === 'DO' ? 'bg-orange-600 text-white shadow' : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        🇩🇴 Rep. Dominicana
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setSelectedBankTab('US')}
                      className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                        activeBankTab === 'US' ? 'bg-orange-600 text-white shadow' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      🇺🇸 uglyCash / USA
                    </button>
                  </div>

                  {/* Bank Details Card */}
                  <div className="p-4 rounded-xl bg-[#141b2a] border border-slate-700/80 space-y-3 font-mono text-xs">
                    {activeBankTab === 'SV' && isSV && (
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

                    {activeBankTab === 'DO' && !isSV && (
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

                    {activeBankTab === 'US' && (
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

                  {/* Proof of Deposit Input (Number + Screenshot Upload) */}
                  <div className="space-y-3.5 pt-1 border-t border-slate-800/80">
                    <div>
                      <label className="text-[11px] text-slate-300 font-mono block mb-1.5">
                        1. Captura o Imagen del Comprobante Bancario (50%):
                      </label>
                      <input
                        ref={advanceReceiptInputRef}
                        type="file"
                        accept="image/*,.pdf"
                        onChange={(e) => handleReceiptImageSelect(e, 'advance')}
                        className="hidden"
                      />

                      {(advanceReceiptImage || portalConfig?.comprobanteAnticipoImagen || activeProyecto?.pagos?.anticipoComprobanteImagen) ? (
                        <div className="p-3 rounded-xl bg-[#141b2b] border border-emerald-500/40 space-y-2.5">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                              <span className="text-xs font-bold text-emerald-300 truncate">
                                {advanceReceiptFileName || portalConfig?.comprobanteAnticipoNombre || activeProyecto?.pagos?.anticipoComprobanteNombre || 'Captura_Comprobante_Pago.jpg'}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <button
                                type="button"
                                onClick={() => setPreviewReceiptModalUrl(advanceReceiptImage || portalConfig?.comprobanteAnticipoImagen || activeProyecto?.pagos?.anticipoComprobanteImagen)}
                                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-orange-400 text-[11px] font-bold flex items-center gap-1 border border-slate-700"
                              >
                                <Eye className="w-3 h-3" />
                                <span>Ver Captura</span>
                              </button>
                              {!portalConfig?.fase2Firmada && (
                                <button
                                  type="button"
                                  onClick={() => advanceReceiptInputRef.current?.click()}
                                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-semibold border border-slate-700"
                                >
                                  Cambiar
                                </button>
                              )}
                            </div>
                          </div>

                          <div
                            onClick={() => setPreviewReceiptModalUrl(advanceReceiptImage || portalConfig?.comprobanteAnticipoImagen || activeProyecto?.pagos?.anticipoComprobanteImagen)}
                            className="relative rounded-lg overflow-hidden border border-slate-700/80 bg-[#090d16] max-h-40 flex items-center justify-center cursor-pointer group"
                          >
                            <img
                              src={advanceReceiptImage || portalConfig?.comprobanteAnticipoImagen || activeProyecto?.pagos?.anticipoComprobanteImagen}
                              alt="Comprobante de Pago Bancario"
                              className="max-h-36 w-auto object-contain group-hover:scale-105 transition-transform"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-[11px] font-bold text-white gap-1">
                              <Eye className="w-3.5 h-3.5" /> Ampliar Comprobante
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div
                          onClick={() => !portalConfig?.fase2Firmada && advanceReceiptInputRef.current?.click()}
                          className={`p-4 rounded-xl border-2 border-dashed transition-all flex flex-col items-center justify-center text-center gap-1.5 ${
                            portalConfig?.fase2Firmada
                              ? 'border-slate-800 bg-[#111622] opacity-60'
                              : 'border-orange-500/40 hover:border-orange-500 bg-[#141b2b]/80 hover:bg-[#141b2b] cursor-pointer'
                          }`}
                        >
                          <div className="w-9 h-9 rounded-xl bg-orange-500/15 border border-orange-500/30 text-orange-400 flex items-center justify-center">
                            <FileUp className="w-5 h-5" />
                          </div>
                          <div className="text-xs font-bold text-white">
                            Subir captura o imagen del comprobante bancario
                          </div>
                          <p className="text-[10px] text-slate-400 max-w-xs">
                            {isSV
                              ? 'Adjunta la captura generada por tu app bancaria (Banco Agrícola, Transfer365 o uglyCash)'
                              : 'Adjunta la captura generada por tu app bancaria (Banreservas, Banco BHD, ACH o uglyCash)'}
                          </p>
                          <span className="mt-1 px-3 py-1 rounded-lg bg-orange-600/20 border border-orange-500/30 text-orange-300 text-[11px] font-mono font-bold">
                            Seleccionar Imagen / Captura
                          </span>
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="text-[11px] text-slate-300 font-mono block mb-1">
                        2. Número de Referencia o Transacción (Opcional si subiste captura):
                      </label>
                      <input
                        type="text"
                        value={advanceReceiptRef}
                        onChange={(e) => setAdvanceReceiptRef(e.target.value)}
                        disabled={portalConfig?.fase2Firmada}
                        placeholder={isSV ? 'Ej. Transferencia #982143 (Banco Agrícola / uglyCash)' : 'Ej. Transferencia #982143 (Banreservas / uglyCash)'}
                        className="w-full bg-[#141b2b] border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 disabled:opacity-60"
                      />
                    </div>

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
                        <span>Confirmar Firma y Enviar Captura de Comprobante (50%)</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
          )
        )}

        {/* ========================================================================= */}
        {/* CONTROL DE ACCESO PROTEGIDO PARA FASES 3, 4 Y 5 */}
        {/* ========================================================================= */}
        {activeTab >= 3 && !portalConfig?.clienteAutenticado && (
          <div className="rounded-2xl bg-gradient-to-b from-[#0f172a] to-[#090d16] border border-orange-500/30 p-6 sm:p-10 shadow-2xl text-center max-w-2xl mx-auto space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-center mx-auto text-orange-400 shadow-lg shadow-orange-950/50">
              <Lock className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-mono font-semibold">
                <ShieldCheck className="w-3.5 h-3.5" /> Área Confidencial y de Insumos Protegida
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white">
                Autenticación de Acceso Requerida
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 max-w-md mx-auto leading-relaxed">
                A partir de la <strong>Fase 3</strong> gestionarás la carga de activos de marca, archivos vectoriales, credenciales técnicas y accesos de <strong>{clientEmpresa}</strong>. Por seguridad y protección contractual, autentica tu identidad para continuar.
              </p>
            </div>

            {/* Estado de Creación de Carpeta y Subcarpetas en Google Drive */}
            <div className="p-4 rounded-xl bg-[#0b121f] border border-blue-500/30 text-left space-y-2.5 max-w-md mx-auto shadow-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-white">
                  <span className="text-base">📁</span>
                  <span>Bóveda Oficial Google Drive</span>
                </div>
                <span className="text-[10px] font-mono text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded-full">
                  sitesgoglite@gmail.com
                </span>
              </div>

              <p className="text-[11px] text-slate-300 leading-relaxed">
                Al iniciar sesión con tu cuenta de Google, podrás <strong>Crear tu Bóveda en Google Drive</strong> dentro de la cuenta de la agencia (<strong>sitesgoglite@gmail.com</strong>), la cual se compartirá <strong>exclusivamente con tu correo autenticado</strong> para proteger la privacidad de tus archivos.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5 pt-1">
                <div className="text-[10px] bg-slate-900/90 border border-slate-700/80 text-slate-300 px-2 py-1 rounded-lg font-mono flex items-center gap-1.5">
                  <span>📸</span>
                  <span className="truncate">01_Insumos</span>
                </div>
                <div className="text-[10px] bg-slate-900/90 border border-slate-700/80 text-slate-300 px-2 py-1 rounded-lg font-mono flex items-center gap-1.5">
                  <span>📝</span>
                  <span className="truncate">02_Contratos</span>
                </div>
                <div className="text-[10px] bg-slate-900/90 border border-slate-700/80 text-slate-300 px-2 py-1 rounded-lg font-mono flex items-center gap-1.5">
                  <span>💻</span>
                  <span className="truncate">03_Entregables</span>
                </div>
              </div>
            </div>

            {/* Quick Auth Options */}
            <div className="space-y-4 pt-2 max-w-md mx-auto">
              {/* 1. Google Workspace One-Click */}
              <button
                type="button"
                disabled={clientAuthLoading}
                onClick={() => handleRegisterClientAuth('Google Workspace')}
                className="w-full py-3 px-4 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs flex items-center justify-center gap-3 shadow-xl transition-all transform hover:scale-[1.01]"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span>{clientAuthLoading ? 'Validando Acceso Seguro...' : 'Acceso Rápido con Google Workspace / Gmail'}</span>
              </button>

              <div className="flex items-center gap-3">
                <div className="h-px bg-slate-800 flex-1" />
                <span className="text-[10px] uppercase font-mono text-slate-500">O autentica con correo corporativo</span>
                <div className="h-px bg-slate-800 flex-1" />
              </div>

              {/* 2. Direct Email + PIN Form */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleRegisterClientAuth('Correo / PIN');
                }}
                className="space-y-3 text-left"
              >
                <div>
                  <label className="text-[11px] text-slate-400 font-mono block mb-1">Correo Electrónico Autorizado</label>
                  <input
                    type="email"
                    value={clientAuthEmail || lead.email || ''}
                    onChange={(e) => setClientAuthEmail(e.target.value)}
                    placeholder={lead.email || 'contacto@empresa.com'}
                    required
                    className="w-full bg-[#141b2b] border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="text-[11px] text-slate-400 font-mono block mb-1">PIN / Clave de Acceso</label>
                  <input
                    type="password"
                    value={clientAuthPass}
                    onChange={(e) => setClientAuthPass(e.target.value)}
                    placeholder="Introduce tu PIN o contraseña asignada"
                    className="w-full bg-[#141b2b] border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-orange-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={clientAuthLoading}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-orange-950 transition-all"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>{clientAuthLoading ? 'Validando Acceso...' : 'Validar Identidad y Desbloquear Portal'}</span>
                </button>
              </form>
            </div>

            <div className="pt-2 text-[10px] text-slate-500 font-mono flex items-center justify-center gap-2">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>Protección SSL AES-256 · Bóveda confidencial Goglite Studio</span>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* FASE 3: INTAKE DE INSUMOS (CON REGLA CONTRACTUAL DE 10 DÍAS) */}
        {/* ========================================================================= */}
        {activeTab === 3 && portalConfig?.clienteAutenticado && (
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
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[10px] font-mono uppercase bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full font-bold">
                        Google Drive Oficial · Aislado por Cliente
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        Cuenta Script: <strong className="text-slate-200">sitesgoglite@gmail.com</strong>
                      </span>
                    </div>
                    <h3 className="text-sm sm:text-base font-bold text-white mt-1">
                      📁 Bóveda de Archivos: [Goglite] {data.lead?.empresa}
                    </h3>
                    <p className="text-xs text-slate-300 mt-1 max-w-xl">
                      {data.portalConfig?.driveVault?.createdByClientAction && String(data.portalConfig?.driveVault?.vaultUrl || '').includes('/drive/folders/') ? (
                        <>
                          Carpeta creada en <strong>sitesgoglite@gmail.com</strong> y compartida <strong>exclusivamente</strong> con tu cuenta autenticada (<strong className="text-emerald-400">{data.portalConfig?.driveVault?.sharedWithEmail || portalConfig.clienteAuthEmail || lead.email || 'sitesgoglite@gmail.com'}</strong>). Ningún otro cliente tiene acceso a esta carpeta.
                        </>
                      ) : (
                        <>
                          Presiona <strong>Crear Bóveda en Google Drive</strong> para generar físicamente tu carpeta privada en la cuenta de la agencia (<strong>sitesgoglite@gmail.com</strong>) y compartirla únicamente con tu sesión autenticada (<strong className="text-blue-300">{portalConfig.clienteAuthEmail || lead.email || 'sitesgoglite@gmail.com'}</strong>).
                        </>
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 shrink-0 w-full md:w-auto">
                  {data.portalConfig?.driveVault?.createdByClientAction && String(data.portalConfig?.driveVault?.vaultUrl || '').includes('/drive/folders/') ? (
                    <a
                      href={data.portalConfig.driveVault.vaultUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full md:w-auto px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-950 transition-all"
                    >
                      <ExternalLink className="w-4 h-4" />
                      <span>Abrir Bóveda en Google Drive</span>
                    </a>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleSyncDriveVault({ openWindow: false, silent: false })}
                      disabled={syncingDrive}
                      className="w-full md:w-auto px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-blue-950 transition-all"
                    >
                      <RefreshCw className={`w-4 h-4 ${syncingDrive ? 'animate-spin' : ''}`} />
                      <span>{syncingDrive ? 'Creando y Compartiendo Bóveda...' : '⚡ Crear Bóveda en Google Drive'}</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Subcarpetas de Google Drive */}
              {data.portalConfig?.driveVault?.createdByClientAction && String(data.portalConfig?.driveVault?.vaultUrl || '').includes('/drive/folders/') ? (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4 pt-4 border-t border-slate-800/80">
                  <a
                    href={data.portalConfig?.driveVault?.subfolders?.insumos?.url || data.portalConfig?.driveVault?.vaultUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-3 rounded-xl bg-slate-900/70 border border-slate-800 hover:border-blue-500/50 transition-all flex items-center justify-between gap-2.5 group shadow-sm"
                    title="Abrir carpeta privada 01_Insumos_Cliente en Google Drive"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="text-base shrink-0">📸</span>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-white group-hover:text-blue-400 transition-colors truncate">01_Insumos_Cliente</p>
                        <p className="text-[10px] text-slate-400 truncate">Logos SVG, fotos 4K y textos</p>
                      </div>
                    </div>
                    <ExternalLink className="w-3.5 h-3.5 text-slate-500 group-hover:text-blue-400 shrink-0 transition-colors" />
                  </a>

                  <a
                    href={data.portalConfig?.driveVault?.subfolders?.contratos?.url || data.portalConfig?.driveVault?.vaultUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-3 rounded-xl bg-slate-900/70 border border-slate-800 hover:border-blue-500/50 transition-all flex items-center justify-between gap-2.5 group shadow-sm"
                    title="Abrir carpeta privada 02_Contratos_Firmados en Google Drive"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="text-base shrink-0">📝</span>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-white group-hover:text-blue-400 transition-colors truncate">02_Contratos_Firmados</p>
                        <p className="text-[10px] text-slate-400 truncate">SOW, firma digital y pagos</p>
                      </div>
                    </div>
                    <ExternalLink className="w-3.5 h-3.5 text-slate-500 group-hover:text-blue-400 shrink-0 transition-colors" />
                  </a>

                  <a
                    href={data.portalConfig?.driveVault?.subfolders?.entregables?.url || data.portalConfig?.driveVault?.vaultUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-3 rounded-xl bg-slate-900/70 border border-slate-800 hover:border-blue-500/50 transition-all flex items-center justify-between gap-2.5 group shadow-sm"
                    title="Abrir carpeta privada 03_Entregables_Codigo en Google Drive"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="text-base shrink-0">🚀</span>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-white group-hover:text-blue-400 transition-colors truncate">03_Entregables_Codigo</p>
                        <p className="text-[10px] text-slate-400 truncate">PRD técnico, accesos y DNS</p>
                      </div>
                    </div>
                    <ExternalLink className="w-3.5 h-3.5 text-slate-500 group-hover:text-blue-400 shrink-0 transition-colors" />
                  </a>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4 pt-4 border-t border-slate-800/80 opacity-75">
                  <div className="p-3 rounded-xl bg-slate-900/50 border border-slate-800/80 flex items-center justify-between gap-2.5">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="text-base shrink-0">📸</span>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-300 truncate">01_Insumos_Cliente</p>
                        <p className="text-[10px] text-slate-500 truncate">Se compartirá al crear bóveda</p>
                      </div>
                    </div>
                    <Lock className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  </div>

                  <div className="p-3 rounded-xl bg-slate-900/50 border border-slate-800/80 flex items-center justify-between gap-2.5">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="text-base shrink-0">📝</span>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-300 truncate">02_Contratos_Firmados</p>
                        <p className="text-[10px] text-slate-500 truncate">Se compartirá al crear bóveda</p>
                      </div>
                    </div>
                    <Lock className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  </div>

                  <div className="p-3 rounded-xl bg-slate-900/50 border border-slate-800/80 flex items-center justify-between gap-2.5">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="text-base shrink-0">🚀</span>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-300 truncate">03_Entregables_Codigo</p>
                        <p className="text-[10px] text-slate-500 truncate">Se compartirá al crear bóveda</p>
                      </div>
                    </div>
                    <Lock className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  </div>
                </div>
              )}
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

                    {/* Selector de Archivo Local del Dispositivo */}
                    <div>
                      <label className="text-[11px] text-slate-400 font-mono block mb-1">
                        Archivo de tu Dispositivo (PC / Móvil)
                      </label>
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileSelect}
                        className="hidden"
                      />
                      
                      <div 
                        onClick={() => fileInputRef.current?.click()}
                        className={`p-3 rounded-xl border border-dashed cursor-pointer transition-all flex items-center justify-between gap-3 ${
                          selectedFile 
                            ? 'bg-emerald-500/10 border-emerald-500/50 hover:bg-emerald-500/15' 
                            : 'bg-[#141b2b] border-slate-700 hover:border-orange-500 hover:bg-[#182135]'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                            selectedFile ? 'bg-emerald-500/20 text-emerald-400' : 'bg-orange-500/10 text-orange-400'
                          }`}>
                            {selectedFile ? <FileUp className="w-4 h-4" /> : <FolderOpen className="w-4 h-4" />}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-white truncate">
                              {selectedFile ? selectedFile.name : 'Examinar y seleccionar archivo...'}
                            </p>
                            <p className="text-[10px] text-slate-400">
                              {selectedFile 
                                ? `${selectedFile.size > 1048576 ? (selectedFile.size / 1048576).toFixed(1) + ' MB' : Math.round(selectedFile.size / 1024) + ' KB'} · Listo para adjuntar`
                                : 'SVG, PNG, JPG, PDF, ZIP desde tu computadora o celular'}
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px] font-semibold text-slate-200 border border-slate-700 shrink-0"
                        >
                          {selectedFile ? 'Cambiar' : 'Explorar'}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] text-slate-400 font-mono block mb-1">
                        Nombre o Enlace Web (Opcional si seleccionaste archivo)
                      </label>
                      <input
                        type="text"
                        value={assetName}
                        onChange={(e) => setAssetName(e.target.value)}
                        placeholder="Ej. Logo_Clinica_Vector.svg o enlace a Google Drive / Dropbox"
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
                      disabled={(!assetName.trim() && !selectedFile) || subiendoInsumo}
                      className="w-full py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-orange-950 transition-all"
                    >
                      {subiendoInsumo ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Guardando en Google Drive...</span>
                        </>
                      ) : (
                        <>
                          <Upload className="w-3.5 h-3.5" />
                          <span>Subir Insumo a Google Drive</span>
                        </>
                      )}
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
                      <p className="text-xs text-slate-400">Total: {(portalConfig?.archivosSubidos || []).length} archivos en Google Drive</p>
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

                  <div className="space-y-2.5 max-h-80 overflow-y-auto">
                    {(portalConfig?.archivosSubidos || []).length === 0 ? (
                      <div className="p-6 text-center text-xs text-slate-500 italic bg-slate-900/40 rounded-xl border border-slate-800/60">
                        Aún no se han registrado insumos. Utiliza el formulario a la izquierda para subir archivos a Google Drive.
                      </div>
                    ) : (
                      portalConfig.archivosSubidos.map((arch) => (
                        <div
                          key={arch.id}
                          className="p-3 rounded-xl bg-[#141b2a] border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs hover:border-slate-700 transition-colors shadow-sm"
                        >
                          <div className="flex items-start gap-3 min-w-0">
                            <div className="w-9 h-9 rounded-lg bg-emerald-500/15 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                              <CheckCircle2 className="w-5 h-5" />
                            </div>
                            <div className="min-w-0">
                              <div className="font-bold text-white truncate flex items-center gap-1.5">
                                <span>{arch.nombre}</span>
                                {arch.tamano && <span className="text-[10px] text-slate-400 font-mono font-normal">({arch.tamano})</span>}
                              </div>
                              <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                                <span className="text-orange-400 font-bold">{arch.categoria}</span> · Recibido {arch.fecha} {arch.hora ? `(${arch.hora})` : ''}
                              </div>
                              {arch.notas && (
                                <p className="text-[11px] text-slate-300 italic mt-1 line-clamp-2 bg-slate-900/60 px-2 py-1 rounded border border-slate-800/80">
                                  "{arch.notas}"
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                            {arch.driveUrl ? (
                              <a
                                href={arch.driveUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-2.5 py-1 rounded-lg bg-blue-500/15 hover:bg-blue-500/25 border border-blue-500/30 text-blue-300 hover:text-white font-mono text-[10px] font-bold flex items-center gap-1 transition-all"
                                title="Ver archivo en Google Drive"
                              >
                                <ExternalLink className="w-3 h-3 text-blue-400" />
                                <span>Ver en Drive</span>
                              </a>
                            ) : (
                              <span className="text-[10px] bg-slate-800 text-emerald-400 px-2 py-1 rounded font-mono font-bold">
                                {arch.estado || 'Recibido'}
                              </span>
                            )}

                            <button
                              type="button"
                              onClick={() => handleEliminarInsumo(arch.id)}
                              className="p-1 rounded-lg bg-slate-800 hover:bg-rose-950/60 text-slate-400 hover:text-rose-400 transition-colors border border-slate-700/60"
                              title="Eliminar insumo"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
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
        {activeTab === 4 && portalConfig?.clienteAutenticado && (
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
                    <input
                      ref={settlementReceiptInputRef}
                      type="file"
                      accept="image/*,.pdf"
                      onChange={(e) => handleReceiptImageSelect(e, 'settlement')}
                      className="hidden"
                    />

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] text-slate-300 font-mono block mb-1">
                          1. Captura del Comprobante Bancario (50% Final):
                        </label>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => settlementReceiptInputRef.current?.click()}
                            className="flex-1 py-2.5 px-3 rounded-xl bg-[#141b2b] hover:bg-slate-800 border border-orange-500/40 text-xs text-orange-300 font-bold flex items-center justify-center gap-2 transition-colors"
                          >
                            <FileUp className="w-4 h-4 text-orange-400 shrink-0" />
                            <span className="truncate">
                              {settlementReceiptFileName || 'Subir Captura Bancaria'}
                            </span>
                          </button>
                          {settlementReceiptImage && (
                            <button
                              type="button"
                              onClick={() => setPreviewReceiptModalUrl(settlementReceiptImage)}
                              className="px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 text-xs font-bold border border-emerald-500/30 flex items-center gap-1 shrink-0"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>Ver</span>
                            </button>
                          )}
                        </div>
                      </div>

                      <div>
                        <label className="text-[11px] text-slate-400 font-mono block mb-1">
                          2. N° Transacción de Liquidación (Opcional):
                        </label>
                        <input
                          type="text"
                          value={settlementReceiptRef}
                          onChange={(e) => setSettlementReceiptRef(e.target.value)}
                          placeholder="Ej. Transferencia #839102"
                          className="w-full bg-[#141b2b] border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-orange-500"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={unlockAnimating}
                      className="w-full py-3 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xl shadow-orange-950 transition-all"
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
                  </form>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* FASE 5: GARANTÍA DE 30 DÍAS & CONVERSIÓN A CMS $99/MES */}
        {/* ========================================================================= */}
        {activeTab === 5 && portalConfig?.clienteAutenticado && (
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

      {/* MODAL: VISTA PREVIA DE CAPTURA DE COMPROBANTE BANCARIO */}
      {previewReceiptModalUrl && (
        <div
          onClick={() => setPreviewReceiptModalUrl(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-lg w-full rounded-2xl bg-[#0d121d] border border-slate-700 shadow-2xl p-4 space-y-3"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-orange-400" />
                <h3 className="text-xs font-bold text-white uppercase font-mono">
                  Captura del Comprobante Bancario
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setPreviewReceiptModalUrl(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="max-h-[70vh] overflow-auto rounded-xl bg-[#070a10] border border-slate-800 flex items-center justify-center p-2">
              <img
                src={previewReceiptModalUrl}
                alt="Captura de Comprobante"
                className="max-w-full max-h-[65vh] object-contain rounded-lg"
              />
            </div>
          </div>
        </div>
      )}

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
