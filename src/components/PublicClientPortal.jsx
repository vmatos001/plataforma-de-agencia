import React, { useState, useEffect, useRef } from 'react';
import {
  ShieldCheck,
  Shield,
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
  ShieldAlert,
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
  Trash2,
  Sliders,
  Smartphone
} from 'lucide-react';
import {
  getStoredCrmLeads,
  saveStoredCrmLeads
} from '../services/localStore';
import {
  getStoredProyectos,
  saveStoredProyectos,
  buildProyectoFromPresupuesto,
  ensureProyectoForPresupuesto,
  reconcileProyectoWithPresupuesto
} from '../services/contractGenerator';
import { evaluateProjectMilestones } from '../services/projectMilestoneSync';
import { 
  CorporateInvoiceDocument, 
  buildCorporateInvoiceHtml, 
  printHtmlViaHiddenIframe, 
  buildInvoiceFromPresupuesto, 
  buildMilestoneInvoices,
  reconcileInvoiceWithPresupuesto,
  normalizeFacturaItems 
} from './GestionRentabilidadModule';
import { DEFAULT_AGENCY_BRANDING, getAgencyContactForCountry } from '../constants/defaultAgencyBranding';
import { apiClient } from '../services/apiClient';
import { auth } from '../services/firebase';
import { getPortalCloud, savePortalCloud, subscribePortalCloud, saveProyectoCloud, uploadReceiptToCloudStorage } from '../services/firestoreSyncService';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import WarrantyCountdownTimer from './portal/WarrantyCountdownTimer';
import GogliteCareCard from './portal/GogliteCareCard';

function GoogleProtectedCard({
  title,
  subtitle,
  description,
  clientEmpresa,
  leadEmail,
  boundClientEmail,
  onAuthenticate,
  loading,
  clientAuthPass,
  setClientAuthPass,
  clientAuthEmail,
  setClientAuthEmail,
  matchingFactura,
  onViewInvoice
}) {
  const displayedAuthorized = boundClientEmail || leadEmail;
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
        {boundClientEmail ? (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-900/80 border border-slate-700/80 text-[11px] font-mono text-slate-300">
            <span className="text-slate-500">Acceso exclusivo cliente:</span>
            <span className="text-amber-400 font-bold">{boundClientEmail}</span>
          </div>
        ) : (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-950/40 border border-emerald-500/30 text-[11px] font-mono text-emerald-300">
            <span>✨ Inicia sesión con tu cuenta de Google (Gmail o Workspace) para registrar tu acceso oficial</span>
          </div>
        )}
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
          <span>{loading ? 'Verificando con Google...' : (boundClientEmail ? `Acceder con Google (${boundClientEmail})` : 'Registrar y Acceder con tu Cuenta de Google')}</span>
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

      {matchingFactura && (
        <div className="pt-2 border-t border-slate-800/80 max-w-md mx-auto w-full">
          <div className="p-3.5 rounded-xl bg-slate-900/90 border border-orange-500/30 flex items-center justify-between gap-3 text-left">
            <div className="flex items-center gap-2.5">
              <FileText className="w-5 h-5 text-orange-400 shrink-0" />
              <div>
                <div className="text-xs font-bold text-white flex items-center gap-1.5">
                  <span>Factura Oficial · {matchingFactura.numeroFactura}</span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-mono">
                    ${Number(matchingFactura.total).toLocaleString()} USD
                  </span>
                </div>
                <div className="text-[11px] text-slate-400">
                  Comprobante y desglose de inversión disponible
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setSelectedClientInvoiceModal(matchingFactura)}
              className="px-3 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs shrink-0 flex items-center gap-1 shadow-md transition-all"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Ver Factura</span>
            </button>
          </div>
        </div>
      )}

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
    const fallback = {
      ...DEFAULT_AGENCY_BRANDING
    };
    if (initialAgencySettings && typeof initialAgencySettings === 'object') {
      return {
        ...fallback,
        ...initialAgencySettings,
        logoUrl: initialAgencySettings.logoUrl || fallback.logoUrl,
        logoDocumentosUrl: initialAgencySettings.logoDocumentosUrl || ''
      };
    }
    try {
      const raw = localStorage.getItem('goglite_agency_settings');
      const storedLogo = localStorage.getItem('goglite_agency_logo');
      const storedLogoDocs = localStorage.getItem('goglite_agency_logo_docs');
      if (raw) {
        const parsed = JSON.parse(raw);
        return {
          ...fallback,
          ...parsed,
          logoUrl: parsed.logoUrl || storedLogo || fallback.logoUrl,
          logoDocumentosUrl: parsed.logoDocumentosUrl || storedLogoDocs || ''
        };
      }
      if (storedLogo || storedLogoDocs) {
        return {
          ...fallback,
          logoUrl: storedLogo || fallback.logoUrl,
          logoDocumentosUrl: storedLogoDocs || ''
        };
      }
    } catch (e) {}
    return fallback;
  });

  // Sincronización en vivo con ajustes remotos y eventos globales de marca blanca
  useEffect(() => {
    if (initialAgencySettings && typeof initialAgencySettings === 'object') {
      setAgencyBranding(prev => ({
        ...prev,
        ...initialAgencySettings
      }));
    }
  }, [initialAgencySettings]);

  useEffect(() => {
    let isMounted = true;
    const fetchRemoteSettings = async () => {
      try {
        const res = await apiClient.get('/api/agency/settings');
        const cType = res.headers?.get?.('content-type') || '';
        if (res.ok && cType.includes('application/json')) {
          const data = await res.json();
          if (data && typeof data === 'object' && isMounted) {
            setAgencyBranding(prev => ({
              ...prev,
              ...data
            }));
          }
        }
      } catch (e) {}
    };

    fetchRemoteSettings();

    const handleSettingsUpdated = (e) => {
      if (e?.detail && typeof e.detail === 'object' && isMounted) {
        setAgencyBranding(prev => ({
          ...prev,
          ...e.detail
        }));
      }
    };

    window.addEventListener('goglite_agency_settings_updated', handleSettingsUpdated);
    return () => {
      isMounted = false;
      window.removeEventListener('goglite_agency_settings_updated', handleSettingsUpdated);
    };
  }, []);

  // Dedicated Document Logo (Texto Negro / Fondo Blanco para Impresión)
  const documentBrandLogo = agencyBranding?.logoDocumentosUrl 
    || (typeof window !== 'undefined' ? localStorage.getItem('goglite_agency_logo_docs') : null)
    || agencyBranding?.logoUrl 
    || DEFAULT_AGENCY_BRANDING.logoUrl;

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
  const [selectedClientInvoiceModal, setSelectedClientInvoiceModal] = useState(null);
  const [clientFacturaList, setClientFacturaList] = useState([]);

  // Fase 3 - Assets intake states
  const [assetName, setAssetName] = useState('');
  const [assetCategory, setAssetCategory] = useState('Logotipo Vectorial');
  const [assetNotes, setAssetNotes] = useState('');
  const fileInputRef = useRef(null);
  const [selectedFile, setSelectedFile] = useState(null);

  // Fase 4 - Settlement states
  const [settlementReceiptRef, setSettlementReceiptRef] = useState('');
  const [settlementReceiptImage, setSettlementReceiptImage] = useState('');
  const [settlementReceiptFileName, setSettlementReceiptFileName] = useState('');
  const settlementReceiptInputRef = useRef(null);
  const [unlockAnimating, setUnlockAnimating] = useState(false);
  const [showResubmitSettlementForm, setShowResubmitSettlementForm] = useState(false);

  // Fase 5 - Maintenance state
  const [carePlanActive, setCarePlanActive] = useState(false);
  const [syncingDrive, setSyncingDrive] = useState(false);
  const [subiendoInsumo, setSubiendoInsumo] = useState(false);

  useEffect(() => {
    const loadFacturas = () => {
      try {
        if (typeof window !== 'undefined') {
          let list = [];
          const raw = localStorage.getItem('goglite_facturas');
          if (raw) {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed) && parsed.length > 0) list = parsed;
          }
          if (list.length === 0) {
            const rawFinanzas = localStorage.getItem('goglite_finanzas_pnl');
            if (rawFinanzas) {
              const finanzas = JSON.parse(rawFinanzas);
              if (Array.isArray(finanzas?.facturas)) list = finanzas.facturas;
            }
          }
          if (Array.isArray(list)) setClientFacturaList(list);
        }
      } catch {}
    };
    loadFacturas();
    window.addEventListener('goglite_facturas_updated', loadFacturas);
    window.addEventListener('goglite_proyectos_synced', loadFacturas);
    return () => {
      window.removeEventListener('goglite_facturas_updated', loadFacturas);
      window.removeEventListener('goglite_proyectos_synced', loadFacturas);
    };
  }, []);

  // Compuertas de Verificación Administrativa de Facturas y Pagos
  const isAnticipoConfirmed = Boolean(
    data?.proyecto?.pagos?.anticipoEstado === 'confirmado' || 
    data?.portalConfig?.anticipoConfirmadoAgencia === true ||
    data?.portalConfig?.facturaAnticipoHabilitada === true
  );

  const isSaldoConfirmed = Boolean(
    data?.proyecto?.pagos?.saldoEstado === 'confirmado' || 
    data?.portalConfig?.fase4Liquidada === true ||
    data?.portalConfig?.saldoConfirmadoAgencia === true
  );

  const hasAdvanceReceiptSubmitted = Boolean(
    advanceReceiptImage || 
    advanceReceiptRef || 
    data?.portalConfig?.comprobanteAnticipo || 
    data?.portalConfig?.comprobanteAnticipoImagen || 
    data?.proyecto?.pagos?.anticipoComprobante || 
    data?.proyecto?.pagos?.anticipoComprobanteImagen ||
    data?.portalConfig?.fase2Firmada
  );

  const hasSettlementReceiptSubmitted = Boolean(
    data?.portalConfig?.liquidacionReportada === true ||
    data?.portalConfig?.fechaReporteLiquidacion ||
    data?.proyecto?.pagos?.saldoEstado === 'verificacion' ||
    data?.proyecto?.pagos?.saldoEstado === 'confirmado' ||
    data?.portalConfig?.fase4Liquidada === true ||
    data?.portalConfig?.liquidacionPagada === true ||
    data?.portalConfig?.saldoConfirmadoAgencia === true ||
    (data?.portalConfig?.comprobanteLiquidacion && data?.portalConfig?.liquidacionReportada) ||
    (data?.proyecto?.pagos?.saldoComprobante && data?.proyecto?.pagos?.saldoEstado === 'verificacion')
  );

  // Lista de facturas oficiales formalmente confirmadas por administración
  const clientFacturasDisponibles = React.useMemo(() => {
    if (!isAnticipoConfirmed && !isSaldoConfirmed) {
      return [];
    }

    const targetEmpresa = (data?.presupuesto?.cliente?.empresa || data?.lead?.empresa || '').toLowerCase().trim();
    const targetPresupuestoId = data?.presupuesto?.id;
    const targetPresupuestoCodigo = data?.presupuesto?.codigo || data?.lead?.presupuestoCodigo;

    let matched = [];
    if (Array.isArray(clientFacturaList) && clientFacturaList.length > 0) {
      matched = clientFacturaList.filter(f => 
        (targetPresupuestoId && (f.presupuestoId === targetPresupuestoId || f.id === targetPresupuestoId)) ||
        (targetPresupuestoCodigo && (f.codigoPresupuesto === targetPresupuestoCodigo || f.numeroFactura?.includes(targetPresupuestoCodigo))) ||
        (targetEmpresa && f.cliente?.empresa && f.cliente.empresa.toLowerCase().trim() === targetEmpresa)
      );
    }

    // Filtrar estrictamente por el estado confirmado de cada hito
    const valid = matched.filter(f => {
      if (f.tipoHito === 'anticipo' || f.id?.endsWith('-anticipo')) return isAnticipoConfirmed;
      if (f.tipoHito === 'saldo' || f.id?.endsWith('-saldo')) return isSaldoConfirmed || hasSettlementReceiptSubmitted;
      return isAnticipoConfirmed || isSaldoConfirmed || hasSettlementReceiptSubmitted;
    }).map(f => {
      let inv = normalizeFacturaItems(f);
      if (data?.presupuesto) {
        inv = reconcileInvoiceWithPresupuesto(inv, data.presupuesto, {
          isAnticipoPaid: isAnticipoConfirmed,
          isSaldoPaid: isSaldoConfirmed || hasSettlementReceiptSubmitted,
          proyecto: data.proyecto,
          portalConfig: data.portalConfig
        });
      }
      return inv;
    });

    // Si la administración confirmó en el panel pero la factura aún no sincronizó en clientFacturaList
    if (valid.length === 0 && (isAnticipoConfirmed || isSaldoConfirmed || hasSettlementReceiptSubmitted) && data?.presupuesto) {
      const isSettlement = isSaldoConfirmed || hasSettlementReceiptSubmitted;
      const milestoneInvoices = buildMilestoneInvoices(data.presupuesto, 0);
      if (milestoneInvoices.length === 2) {
        const facAnticipo = reconcileInvoiceWithPresupuesto(milestoneInvoices[0], data.presupuesto, { isAnticipoPaid: isAnticipoConfirmed });
        const facSaldo = reconcileInvoiceWithPresupuesto(milestoneInvoices[1], data.presupuesto, { isSaldoPaid: isSettlement });
        if (isAnticipoConfirmed) valid.push(normalizeFacturaItems(facAnticipo));
        if (isSettlement) valid.push(normalizeFacturaItems(facSaldo));
      } else {
        let built = buildInvoiceFromPresupuesto(data.presupuesto);
        built = reconcileInvoiceWithPresupuesto(built, data.presupuesto, {
          isAnticipoPaid: isAnticipoConfirmed,
          isSaldoPaid: isSettlement
        });
        valid.push(normalizeFacturaItems(built));
      }
    }

    return valid;
  }, [clientFacturaList, data, isAnticipoConfirmed, isSaldoConfirmed, hasSettlementReceiptSubmitted]);

  const matchingFactura = React.useMemo(() => {
    // Si la agencia no ha confirmado ningún pago ni se ha reportado liquidación, NUNCA mostrar factura en el portal
    if (!isAnticipoConfirmed && !isSaldoConfirmed && !hasSettlementReceiptSubmitted) {
      return null;
    }

    if (clientFacturasDisponibles.length > 0) {
      if (isSaldoConfirmed || hasSettlementReceiptSubmitted) {
        // En liquidación o saldo confirmado, preferir la de saldo si existe
        const saldoInv = clientFacturasDisponibles.find(f => f.tipoHito === 'saldo' || f.id?.endsWith('-saldo'));
        return saldoInv || clientFacturasDisponibles[clientFacturasDisponibles.length - 1];
      }
      return clientFacturasDisponibles[0];
    }

    return null;
  }, [clientFacturasDisponibles, isAnticipoConfirmed, isSaldoConfirmed, hasSettlementReceiptSubmitted]);

  const handlePrintClientInvoicePdf = (fac) => {
    if (!fac) return;
    const invPais = (fac.pais || data?.presupuesto?.pais || data?.lead?.pais || (fac.cliente?.ubicacion || '').toLowerCase().includes('dominicana') ? 'DO' : 'SV');
    const invEmisor = getAgencyContactForCountry(invPais, agencyBranding);
    const invoiceConfig = {
      emisor: {
        empresa: invEmisor.empresa || agencyBranding?.nombreAgencia || 'Goglite Digital Hub',
        subtitulo: agencyBranding?.eslogan || 'Suite Integral de Crecimiento Digital & Desarrollo Web Antigravity',
        logoUrl: documentBrandLogo,
        logoDocumentosUrl: documentBrandLogo,
        identificacion: invEmisor.identificacion || agencyBranding?.identificacion || (invPais === 'DO' ? 'RNC: 1-32-45678-9' : 'NIT: 0614-290390-102-1'),
        email: invEmisor.email || agencyBranding?.emailContacto || 'contacto@goglite.com',
        telefono: invEmisor.telefonoWhatsapp || invEmisor.telefono || agencyBranding?.telefonoWhatsapp,
        ubicacion: invEmisor.ubicacion || agencyBranding?.ubicacionPrincipal
      },
      cuentasBancarias: data?.portalConfig?.cuentasBancarias
    };
    const html = buildCorporateInvoiceHtml(fac, invoiceConfig);
    printHtmlViaHiddenIframe(html);
  };

  const applyReceiptDataUrl = async (finalUrl, fileName, target = 'advance') => {
    const activeToken = token || data?.lead?.portalToken || data?.lead?.id || 'general';
    // Mostrar previsualización inmediata y respaldar en Firebase Cloud Storage
    if (target === 'settlement') {
      setSettlementReceiptImage(finalUrl);
      setSettlementReceiptFileName(fileName);
    } else {
      setAdvanceReceiptImage(finalUrl);
      setAdvanceReceiptFileName(fileName);
    }
    if (target === 'settlement') {
      showNotification(`✓ Captura "${fileName}" cargada. Haz clic en "Ya hice el pago" para notificar a administración.`);
    } else {
      showNotification(`✓ Captura del comprobante "${fileName}" cargada y sincronizando en la nube...`);
    }

    const cloudUrl = await uploadReceiptToCloudStorage(finalUrl, fileName, activeToken, target);
    const persistedUrl = cloudUrl || finalUrl;

    if (target === 'settlement') {
      setSettlementReceiptImage(persistedUrl);
      await savePortalUpdates({
        comprobanteLiquidacionImagen: persistedUrl,
        comprobanteLiquidacionNombre: fileName
      });
    } else {
      setAdvanceReceiptImage(persistedUrl);
      await savePortalUpdates({
        comprobanteAnticipoImagen: persistedUrl,
        comprobanteAnticipoNombre: fileName
      });
    }
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



  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    setAssetName(file.name);
  };

  const handleClientLogout = async () => {
    if (!window.confirm('¿Deseas cerrar tu sesión segura en este portal? Las tarjetas de Aprobación y Contrato SOW quedarán protegidas bajo autenticación de Google.')) return;
    try {
      await auth.signOut();
    } catch (e) {
      console.warn('Error signing out from auth:', e);
    }
    await savePortalUpdates({
      clienteAutenticado: false,
      clienteAuthProvider: '',
      sesionCerradaProtegida: true
    });
    setData(prev => ({
      ...prev,
      portalConfig: {
        ...(prev?.portalConfig || {}),
        clienteAutenticado: false,
        clienteAuthProvider: '',
        sesionCerradaProtegida: true
      }
    }));
    showNotification('Sesión cerrada. Aprobación y Contrato SOW ahora están protegidos con Google.');
  };

  const handleUnlinkClientAccount = async () => {
    if (!window.confirm('¿Deseas desvincular la cuenta registrada de este cliente? Esto permitirá que el cliente registre una nueva cuenta de Google al volver a ingresar.')) return;
    try {
      await auth.signOut();
    } catch (e) {}
    await savePortalUpdates({
      cuentaClienteRegistrada: '',
      clienteAuthEmail: '',
      clienteAutenticado: false,
      sesionCerradaProtegida: true
    });
    setData(prev => ({
      ...prev,
      portalConfig: {
        ...(prev?.portalConfig || {}),
        cuentaClienteRegistrada: '',
        clienteAuthEmail: '',
        clienteAutenticado: false,
        sesionCerradaProtegida: true
      }
    }));
    showNotification('Cuenta de cliente desvinculada. El portal está listo para registrar una nueva cuenta de Google.');
  };

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

    // Escuchar actualizaciones en tiempo real de Firestore para sincronización instantánea multiplataforma (PC <-> Móvil)
    const unsubscribeFirestore = subscribePortalCloud(token, (livePortal) => {
      if (livePortal && (livePortal.lead || livePortal.presupuesto || livePortal.proyecto || livePortal.portalConfig)) {
        setData(prev => {
          if (!prev) return livePortal;
          return {
            ...prev,
            ...livePortal,
            lead: { ...(prev.lead || {}), ...(livePortal.lead || {}) },
            presupuesto: livePortal.presupuesto || prev.presupuesto,
            proyecto: livePortal.proyecto || prev.proyecto,
            portalConfig: { ...(prev.portalConfig || {}), ...(livePortal.portalConfig || {}) }
          };
        });
      }
    });

    const handleDatabaseSync = () => {
      loadPortalData({ silent: true });
    };

    window.addEventListener('storage', handleDatabaseSync);
    window.addEventListener('goglite_proyectos_synced', handleDatabaseSync);

    return () => {
      if (typeof unsubscribeFirestore === 'function') unsubscribeFirestore();
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
        if (cfg.fase4Liquidada || (cfg.faseActual && cfg.faseActual >= 5)) setActiveTab(5);
        else if (cfg.fase3InsumosCompletos || (cfg.faseActual && cfg.faseActual >= 4)) setActiveTab(4);
        else if (cfg.fase2Firmada || (cfg.faseActual && cfg.faseActual >= 3)) setActiveTab(3);
        else if (cfg.fase1Aprobada || (cfg.faseActual && cfg.faseActual >= 2)) setActiveTab(2);
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
      let email = clientAuthEmail.trim() || data?.lead?.email || '';
      let nombre = signerName.trim() || data?.lead?.contacto || data?.lead?.empresa || 'Cliente';

      // Si el proveedor seleccionado es Google o Google Workspace, abrir la ventana oficial de Google
      if (provider === 'google' || provider === 'Google Workspace') {
        try {
          const googleProvider = new GoogleAuthProvider();
          // Forzar a Google a mostrar el diálogo de selección de cuentas para permitir cambiar o agregar otra cuenta
          googleProvider.setCustomParameters({ prompt: 'select_account' });
          const userCredential = await signInWithPopup(auth, googleProvider);
          if (userCredential?.user) {
            email = userCredential.user.email || email;
            nombre = userCredential.user.displayName || nombre;
          }
        } catch (popupErr) {
          console.warn('[Portal Google Auth] Error o cancelación en popup:', popupErr);
          // Si el usuario cerró intencionalmente el popup de Google, no forzar login
          if (popupErr?.code === 'auth/popup-closed-by-user' || popupErr?.code === 'auth/cancelled-popup-request') {
            setClientAuthLoading(false);
            return;
          }
          if (popupErr?.code === 'auth/popup-blocked') {
            alert('El navegador bloqueó la ventana emergente de Google. Por favor, permite las ventanas emergentes (popups) para iniciar sesión con Google.');
            setClientAuthLoading(false);
            return;
          }
          throw popupErr;
        }
      }

      const cleanAttemptEmail = (email || '').toLowerCase().trim();
      if (!cleanAttemptEmail) {
        alert('Por favor ingresa un correo electrónico válido para autenticarte.');
        setClientAuthLoading(false);
        return;
      }

      // =========================================================================
      // FILTRO DE SEGURIDAD 1-A-1: UN SOLO CLIENTE A UN SOLO REGISTRO
      // =========================================================================
      const agencyEmail = (agencyBranding?.emailContacto || data?.presupuesto?.emisor?.email || 'info@goglite.com').toLowerCase().trim();
      const isAgency = cleanAttemptEmail.endsWith('@goglite.com') ||
                       cleanAttemptEmail === 'info@goglite.com' ||
                       cleanAttemptEmail === 'sitesgoglite@gmail.com' ||
                       cleanAttemptEmail === 'vmatos001@gmail.com' ||
                       cleanAttemptEmail === 'victor@goglite.com' ||
                       cleanAttemptEmail === agencyEmail;

      const boundClientEmail = (
        data?.portalConfig?.cuentaClienteRegistrada ||
        data?.lead?.cuentaClienteRegistrada ||
        ''
      ).toLowerCase().trim();

      const additionalAuth = Array.isArray(data?.portalConfig?.cuentasAutorizadas)
        ? data.portalConfig.cuentasAutorizadas.map(e => e.toLowerCase().trim())
        : (Array.isArray(data?.lead?.cuentasAutorizadas) ? data.lead.cuentasAutorizadas.map(e => e.toLowerCase().trim()) : []);

      let isAuthorized = false;
      let authRole = 'client';

      if (isAgency) {
        // Acceso administrativo de agencia: siempre autorizado, sin sobrescribir la cuenta del cliente
        isAuthorized = true;
        authRole = 'agency';
      } else if (boundClientEmail) {
        // El cliente ya registró previamente su cuenta oficial de Google:
        // Solo se permite esa cuenta oficial registrada (o cuentas adicionales autorizadas)
        if (cleanAttemptEmail === boundClientEmail || additionalAuth.includes(cleanAttemptEmail)) {
          isAuthorized = true;
          authRole = 'client';
        } else {
          isAuthorized = false;
        }
      } else {
        // Primera vinculación para este expediente:
        // El cliente puede ingresar con cualquier cuenta de Google (personal o de trabajo).
        // A partir de este momento, dicha cuenta queda guardada y vinculada como la cuenta oficial de este cliente.
        isAuthorized = true;
        authRole = 'client';
      }

      if (!isAuthorized) {
        try {
          await auth.signOut();
        } catch (e) {}
        setClientAuthLoading(false);
        alert(`⛔ Acceso Denegado (Cuenta No Autorizada)\n\nLa cuenta (${email}) no está autorizada para acceder al expediente de "${clientEmpresa}".\n\nEste portal ya se encuentra registrado y vinculado exclusivamente a:\n👉 ${boundClientEmail}\n\nPor favor inicia sesión con la cuenta oficial registrada del cliente o personal de Goglite Digital.`);
        return;
      }

      // Si es acceso de cliente, consolidar permanentemente la cuenta vinculada al registro
      const newCuentaRegistrada = boundClientEmail || (authRole === 'client' ? cleanAttemptEmail : '');

      try {
        await fetch('/api/auth/client-register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            portalToken: token,
            email: cleanAttemptEmail,
            nombre,
            authProvider: provider,
            authRole
          })
        });
      } catch (e) {
        console.warn('API client register fallback:', e);
      }

      await savePortalUpdates({
        clienteAutenticado: true,
        clienteAuthEmail: cleanAttemptEmail,
        cuentaClienteRegistrada: newCuentaRegistrada,
        clienteAuthProvider: provider,
        clienteAuthRol: authRole,
        sesionCerradaProtegida: false,
        fechaAutenticacion: new Date().toISOString()
      });

      setData(prev => ({
        ...prev,
        portalConfig: {
          ...(prev?.portalConfig || {}),
          clienteAutenticado: true,
          clienteAuthEmail: cleanAttemptEmail,
          cuentaClienteRegistrada: newCuentaRegistrada,
          clienteAuthProvider: provider,
          clienteAuthRol: authRole,
          sesionCerradaProtegida: false,
          fechaAutenticacion: new Date().toISOString()
        }
      }));

      setClientAuthSuccess(true);
      const roleNotice = authRole === 'agency' ? '👑 Acceso Administrativo Verificado' : `✓ Acceso verificado para ${cleanAttemptEmail}`;
      showNotification(`${roleNotice}. Documentos desbloqueados.`);
      setTimeout(() => {
        setShowClientAuthModal(false);
        setClientAuthSuccess(false);
      }, 1500);
    } catch (err) {
      alert('Error vinculando cuenta: ' + (err.message || err));
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

      // 0. Prioridad Absoluta: Payload transmitido en la URL (?d=...)
      if (typeof window !== 'undefined') {
        try {
          const searchParams = new URLSearchParams(window.location.search);
          const encodedData = searchParams.get('d');
          if (encodedData) {
            try {
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
                  if (matchedProj) {
                    matchedProj = reconcileProyectoWithPresupuesto(matchedProj, parsedProp);
                    if (parsedProp.proyecto) {
                      matchedProj = {
                        ...matchedProj,
                        ...parsedProp.proyecto,
                        portalConfig: {
                          ...(matchedProj.portalConfig || {}),
                          ...(parsedProp.proyecto.portalConfig || {})
                        },
                        pagos: {
                          ...(matchedProj.pagos || {}),
                          ...(parsedProp.proyecto.pagos || {})
                        },
                        onboarding: {
                          ...(matchedProj.onboarding || {}),
                          ...(parsedProp.proyecto.onboarding || {})
                        }
                      };
                    }
                  } else if (parsedProp.proyecto) {
                    matchedProj = {
                      ...buildProyectoFromPresupuesto(parsedProp, projs),
                      ...parsedProp.proyecto
                    };
                    saveStoredProyectos([matchedProj, ...projs]);
                  } else if (storedPortalConfig.fase1Aprobada || parsedProp.estado === 'aceptado') {
                    matchedProj = buildProyectoFromPresupuesto(parsedProp, projs);
                    saveStoredProyectos([matchedProj, ...projs]);
                  }
                } catch (e) {}

                loadedData = {
                  lead: resolvedLead,
                  portalConfig: { 
                    ...(parsedProp.portalConfig || {}), 
                    ...(parsedProp.proyecto?.portalConfig || {}), 
                    ...storedPortalConfig 
                  },
                  presupuesto: parsedProp,
                  proyecto: matchedProj || parsedProp.proyecto
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
            } catch (innerDecodeErr) {
              console.warn('[Portal] Ignorando payload de URL malformado o truncado:', innerDecodeErr);
            }

            // Limpiar la barra del navegador para mantener la URL corta y limpia
            try {
              window.history.replaceState({}, document.title, window.location.pathname);
            } catch (histErr) {}
          }
        } catch (urlDecodeErr) {
          console.warn('[Portal] Error leyendo parámetros de URL:', urlDecodeErr);
        }
      }

      // 1. Consultar Firestore en tiempo real para sincronización multidispositivo (PC <-> Móvil)
      try {
        const firestoreData = await getPortalCloud(token);
        if (firestoreData && (firestoreData.lead || firestoreData.presupuesto || firestoreData.proyecto)) {
          if (loadedData) {
            loadedData = {
              ...loadedData,
              ...firestoreData,
              lead: { ...(loadedData.lead || {}), ...(firestoreData.lead || {}) },
              presupuesto: firestoreData.presupuesto || loadedData.presupuesto,
              proyecto: firestoreData.proyecto || loadedData.proyecto,
              portalConfig: { ...(loadedData.portalConfig || {}), ...(firestoreData.portalConfig || {}) }
            };
          } else {
            loadedData = firestoreData;
          }
        }
      } catch (fErr) {
        console.warn('[Portal] Error leyendo de Firestore:', fErr);
      }

      // 1.1 Consultar en tiempo real la Base de Datos de la Aplicación (Fases 1 a 7) vía API si está disponible
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

      // 5. Si no hay datos registrados para este portal, marcar como no disponible
      if (!loadedData || !loadedData.lead) {
        setData(null);
        setLoading(false);
        return;
      }

      // Default country tab for banking
      if (loadedData.lead.pais === 'DO') {
        setSelectedBankTab('DO');
      } else {
        setSelectedBankTab('SV');
      }

      // Enlazar con proyecto formal si existe (en localStorage o desde Firestore) y reconciliar progreso por eventos y sprint
      try {
        const storedProjs = getStoredProyectos();
        const leadEmp = (loadedData?.lead?.empresa || '').toLowerCase().trim();
        const localProj = storedProjs.find(p => 
          (loadedData.proyecto && p.id === loadedData.proyecto.id) ||
          (loadedData.presupuesto && (p.presupuestoId === loadedData.presupuesto.id || p.presupuestoCodigo === loadedData.presupuesto.codigo)) ||
          (leadEmp && p.cliente?.empresa && p.cliente.empresa.toLowerCase().trim() === leadEmp)
        );
        const matchedProj = loadedData.proyecto
          ? { ...(localProj || {}), ...loadedData.proyecto }
          : localProj;

        if (matchedProj) {
          const synchronizedProj = loadedData.presupuesto
            ? reconcileProyectoWithPresupuesto(matchedProj, loadedData.presupuesto)
            : matchedProj;
          const evaluatedProj = evaluateProjectMilestones(synchronizedProj);
          loadedData.proyecto = evaluatedProj;

          const isFirmadoEnProj = Boolean(
            evaluatedProj.contrato?.firmaCliente?.firmado ||
            evaluatedProj.contrato?.firmaCliente?.firmaBase64 ||
            evaluatedProj.portalConfig?.fase2Firmada
          );

          const isAnticipoEnProj = Boolean(
            evaluatedProj.pagos?.anticipoEstado === 'confirmado' ||
            evaluatedProj.pagos?.anticipoEstado === 'verificacion' ||
            evaluatedProj.pagos?.anticipoComprobante ||
            evaluatedProj.portalConfig?.anticipoPagado
          );

          const isValidadosEnProj = Boolean(
            evaluatedProj.onboarding?.insumosValidados100 || 
            evaluatedProj.portalConfig?.fase3InsumosCompletos ||
            evaluatedProj.faseActual >= 4
          );

          const isClienteConfirmoEnProj = Boolean(
            evaluatedProj.onboarding?.clienteConfirmoInsumos ||
            evaluatedProj.portalConfig?.clienteConfirmoInsumos
          );

          const isSaldoLiquidadoEnProj = Boolean(
            evaluatedProj.pagos?.saldoEstado === 'confirmado' ||
            evaluatedProj.portalConfig?.fase4Liquidada ||
            evaluatedProj.portalConfig?.liquidacionPagada ||
            evaluatedProj.estado === 'entregado' ||
            evaluatedProj.faseActual >= 5
          );

          loadedData.portalConfig = {
            ...(evaluatedProj.portalConfig || {}),
            ...(loadedData.portalConfig || {}),
            fase1Aprobada: isFirmadoEnProj || isAnticipoEnProj || Boolean(loadedData.portalConfig?.fase1Aprobada),
            fase2Firmada: isFirmadoEnProj || Boolean(loadedData.portalConfig?.fase2Firmada),
            firmaDigital: loadedData.portalConfig?.firmaDigital || evaluatedProj.contrato?.firmaCliente?.firmaBase64 || '',
            nombreFirmante: loadedData.portalConfig?.nombreFirmante || evaluatedProj.contrato?.firmaCliente?.nombreFirmante || '',
            documentoFirmante: loadedData.portalConfig?.documentoFirmante || evaluatedProj.contrato?.firmaCliente?.identificacion || '',
            anticipoPagado: isAnticipoEnProj || Boolean(loadedData.portalConfig?.anticipoPagado),
            progresoPorcentaje: isSaldoLiquidadoEnProj ? 100 : (evaluatedProj.seguimiento?.porcentajeAvance || loadedData.portalConfig?.progresoPorcentaje || 20),
            fase3InsumosCompletos: isValidadosEnProj || Boolean(loadedData.portalConfig?.fase3InsumosCompletos),
            clienteConfirmoInsumos: isClienteConfirmoEnProj || Boolean(loadedData.portalConfig?.clienteConfirmoInsumos),
            fase4Liquidada: isSaldoLiquidadoEnProj || Boolean(loadedData.portalConfig?.fase4Liquidada),
            liquidacionPagada: isSaldoLiquidadoEnProj || Boolean(loadedData.portalConfig?.liquidacionPagada),
            fechaLiquidacion: loadedData.portalConfig?.fechaLiquidacion || evaluatedProj.pagos?.saldoFecha || new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }),
            faseActual: isSaldoLiquidadoEnProj ? 5 : (isValidadosEnProj ? Math.max(4, loadedData.portalConfig?.faseActual || 4) : (isFirmadoEnProj ? Math.max(3, loadedData.portalConfig?.faseActual || 3) : (loadedData.portalConfig?.faseActual || 1)))
          };
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
            const isValidadosEnProj = Boolean(
              loadedData.proyecto?.onboarding?.insumosValidados100 ||
              loadedData.proyecto?.portalConfig?.fase3InsumosCompletos ||
              loadedData.proyecto?.faseActual >= 4
            );
            const isSaldoLiquidadoEnProj = Boolean(
              loadedData.proyecto?.pagos?.saldoEstado === 'confirmado' ||
              loadedData.proyecto?.portalConfig?.fase4Liquidada ||
              loadedData.proyecto?.portalConfig?.liquidacionPagada ||
              loadedData.proyecto?.estado === 'entregado' ||
              loadedData.proyecto?.faseActual >= 5
            );
            loadedData.portalConfig = {
              ...(loadedData.portalConfig || {}),
              ...parsedLocalPortal,
              fase3InsumosCompletos: isValidadosEnProj || Boolean(parsedLocalPortal.fase3InsumosCompletos) || Boolean(loadedData.portalConfig?.fase3InsumosCompletos),
              fase4Liquidada: isSaldoLiquidadoEnProj || Boolean(parsedLocalPortal.fase4Liquidada) || Boolean(loadedData.portalConfig?.fase4Liquidada),
              liquidacionPagada: isSaldoLiquidadoEnProj || Boolean(parsedLocalPortal.liquidacionPagada) || Boolean(loadedData.portalConfig?.liquidacionPagada),
              faseActual: isSaldoLiquidadoEnProj ? 5 : (isValidadosEnProj ? Math.max(4, parsedLocalPortal.faseActual || loadedData.portalConfig?.faseActual || 4) : (parsedLocalPortal.faseActual || loadedData.portalConfig?.faseActual || 1)),
              progresoPorcentaje: isSaldoLiquidadoEnProj ? 100 : (parsedLocalPortal.progresoPorcentaje || loadedData.portalConfig?.progresoPorcentaje || 80)
            };
          }
        }
      } catch (e) {}

      // Sincronizar automáticamente el estado consolidado hacia Firestore si no es el portal demo
      if (loadedData && loadedData.lead && loadedData.lead.id !== 'lead-demo-portal') {
        const activeToken = token || loadedData.lead.portalToken || loadedData.lead.id;
        savePortalCloud(activeToken, {
          token: activeToken,
          lead: loadedData.lead,
          presupuesto: loadedData.presupuesto || null,
          proyecto: loadedData.proyecto || null,
          portalConfig: loadedData.portalConfig || {},
          workflowData: loadedData.workflowData || null
        }).catch(() => {});
      }

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
  const savePortalUpdates = async (updates, overrideProyecto = null) => {
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

    const effectiveProyecto = overrideProyecto || data.proyecto || null;

    setData(prev => ({
      ...prev,
      lead: newLead,
      proyecto: effectiveProyecto || prev?.proyecto || null,
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

    // Sync con Firestore Cloud para persistencia multiplataforma inmediata (Móvil <-> PC)
    try {
      const activeToken = token || data.lead.portalToken || data.lead.id;
      savePortalCloud(activeToken, {
        token: activeToken,
        lead: newLead,
        presupuesto: data.presupuesto || null,
        proyecto: effectiveProyecto ? { ...effectiveProyecto, portalConfig: newPortalConfig } : null,
        portalConfig: newPortalConfig
      }).catch(err => console.warn('[Portal] Firestore sync background err:', err));

      if (effectiveProyecto?.id) {
        saveProyectoCloud({
          ...effectiveProyecto,
          portalConfig: newPortalConfig
        }).catch(() => {});
      }
    } catch (fsErr) {
      console.warn('[Portal] Error sincronizando con Firestore:', fsErr);
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

  // Canvas signature helpers optimizados para pantallas táctiles (Mobile-First)
  const getCoordinates = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches && e.touches.length > 0 ? e.touches[0] : (e.changedTouches && e.changedTouches.length > 0 ? e.changedTouches[0] : null);
    const clientX = touch ? touch.clientX : e.clientX;
    const clientY = touch ? touch.clientY : e.clientY;
    const scaleX = canvas.width / (rect.width || 1);
    const scaleY = canvas.height / (rect.height || 1);
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    };
  };

  const startDrawing = (e) => {
    if (e.cancelable && e.type.startsWith('touch')) {
      e.preventDefault();
    }
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
    if (e.cancelable && e.type.startsWith('touch')) {
      e.preventDefault();
    }
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const { x, y } = getCoordinates(e);
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#0f172a'; // Tinta oscura/negra profesional
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
      }, generatedProj);
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

    // 3. Persistir en portal config y Firestore Cloud con el proyecto firmado
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
    }, targetUpdatedProj);

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

  const handleConfirmarSubidaInsumosCliente = async () => {
    const nowFecha = new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
    const nowHora = new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    const fullTimestamp = `${nowFecha} (${nowHora})`;

    try {
      const storedProjs = getStoredProyectos();
      const leadEmp = (data?.lead?.empresa || '').toLowerCase().trim();
      const idx = storedProjs.findIndex(p => 
        (data?.proyecto && p.id === data.proyecto.id) ||
        (data?.presupuesto && (p.presupuestoId === data.presupuesto.id || p.presupuestoCodigo === data.presupuesto.codigo)) ||
        (leadEmp && p.cliente?.empresa && p.cliente.empresa.toLowerCase().trim() === leadEmp)
      );
      if (idx !== -1) {
        storedProjs[idx] = {
          ...storedProjs[idx],
          onboarding: {
            ...(storedProjs[idx].onboarding || {}),
            clienteConfirmoInsumos: true,
            fechaConfirmacionCliente: fullTimestamp,
            estadoInsumos: 'pendiente_validacion_agencia'
          }
        };
        saveStoredProyectos(storedProjs);
        window.dispatchEvent(new CustomEvent('goglite_proyectos_synced', { detail: { proyectos: storedProjs } }));
      }
    } catch (e) {
      console.warn('Error sync confirmation with project:', e);
    }

    await savePortalUpdates({
      clienteConfirmoInsumos: true,
      fechaConfirmacionClienteInsumos: fullTimestamp,
      fase3InsumosCompletos: false // Regla: el cliente confirma subida, pero NO activa el reloj de 10 días hasta que la agencia valide
    });

    showNotification('✓ Confirmación registrada. Nuestro equipo validará los archivos en Google Drive antes de activar el reloj de 10 días.');
  };

  const handleCompletarInsumos = async () => {
    const nowStr = new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
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
          faseActual: 4,
          onboarding: {
            ...(storedProjs[idx].onboarding || {}),
            completado: true,
            insumosValidados100: true,
            clienteConfirmoInsumos: true,
            fecha: nowStr,
            fechaValidacionAgencia: nowStr
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
      clienteConfirmoInsumos: true,
      fechaInsumosCompletos: nowStr,
      progresoPorcentaje: 80,
      faseActual: 4
    });
    setActiveTab(4);
    showNotification('✓ ¡Insumos validados al 100%! El cronómetro oficial de 10 días hábiles ha iniciado.');
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
            pagos: {
              ...(storedProjs[idx].pagos || {}),
              saldoEstado: 'verificacion',
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

      try {
        let storedFacturas = [];
        const rawFac = localStorage.getItem('goglite_facturas');
        if (rawFac) storedFacturas = JSON.parse(rawFac);
        if (Array.isArray(storedFacturas) && storedFacturas.length > 0) {
          const leadEmp = (data?.lead?.empresa || '').toLowerCase().trim();
          let facUpdated = false;
          storedFacturas = storedFacturas.map(f => {
            const isTargetProject = (data?.proyecto && (f.proyectoId === data.proyecto.id || f.id?.includes(data.proyecto.id))) ||
              (data?.presupuesto && (f.presupuestoId === data.presupuesto.id || f.codigoPresupuesto === data.presupuesto.codigo)) ||
              (leadEmp && f.cliente?.empresa && f.cliente.empresa.toLowerCase().trim() === leadEmp);
            const isSaldo = f.tipoHito === 'saldo' || f.id?.endsWith('-saldo') || f.concepto?.toLowerCase().includes('saldo') || f.concepto?.toLowerCase().includes('liquidaci');
            
            if (isTargetProject && isSaldo) {
              facUpdated = true;
              const saldoTotal = Number(f.total) || Number(data?.presupuesto?.inversion?.contraEntrega) || 125;
              return {
                ...f,
                tipoHito: 'saldo',
                subtotal: saldoTotal,
                total: saldoTotal,
                montoCobrado: saldoTotal,
                saldoPendiente: 0,
                estado: 'cobrada',
                habilitadaCliente: true
              };
            }
            return f;
          });
          if (facUpdated) {
            localStorage.setItem('goglite_facturas', JSON.stringify(storedFacturas));
            const rawFin = localStorage.getItem('goglite_finanzas_v1');
            if (rawFin) {
              try {
                const parsedFin = JSON.parse(rawFin);
                parsedFin.facturas = storedFacturas;
                localStorage.setItem('goglite_finanzas_v1', JSON.stringify(parsedFin));
              } catch {}
            }
            window.dispatchEvent(new CustomEvent('goglite_facturas_updated'));
          }
        }
      } catch (errFac) {
        console.warn('Error sync settlement with invoice:', errFac);
      }

      await savePortalUpdates({
        comprobanteLiquidacion: textoLiquidacion,
        comprobanteLiquidacionImagen: finalSettlementImg || null,
        comprobanteLiquidacionNombre: finalSettlementName || null,
        liquidacionReportada: true,
        fechaReporteLiquidacion: new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })
      });
      setShowResubmitSettlementForm(false);
      setUnlockAnimating(false);
      showNotification('✓ Comprobante enviado. En proceso de verificación administrativa por Goglite Studio.');
    }, 1200);
  };

  const careService = React.useMemo(() => {
    let list = agencyBranding?.serviciosOficiales;
    if (!Array.isArray(list) || list.length === 0) {
      try {
        const raw = localStorage.getItem('goglite_agency_settings');
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed?.serviciosOficiales) && parsed.serviciosOficiales.length > 0) {
            list = parsed.serviciosOficiales;
          }
        }
      } catch {}
    }
    const found = (list || []).find(s => s.id === 'goglite-care' || s.id === 'mantenimiento-seo-soporte' || s.nombre?.toLowerCase().includes('care') || s.nombre?.toLowerCase().includes('mantenimiento'));
    return found || {
      id: 'goglite-care',
      nombre: 'Goglite Care · Mantenimiento Continuo & CMS',
      precioUSD: 99,
      precioDOP: 5940
    };
  }, [agencyBranding]);

  const handleActivarGogliteCare = async () => {
    const now = Date.now();
    let baseMs = now;
    if (portalConfig?.careVenceAt) {
      const curMs = new Date(portalConfig.careVenceAt).getTime();
      if (!isNaN(curMs) && curMs > now) baseMs = curMs;
    }
    const newVenceIso = new Date(baseMs + 30 * 86400000).toISOString();
    const nowStr = new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });

    await savePortalUpdates({
      fase5CareActivo: true,
      careVenceAt: newVenceIso,
      fechaActivacionCare: portalConfig?.fechaActivacionCare || nowStr,
      progresoPorcentaje: 100,
      faseActual: 5
    });
    setCarePlanActive(true);
    const precioDisplay = currentPais === 'DO' ? `RD$ ${(Number(careService.precioDOP) || 5940).toLocaleString()}` : `$${Number(careService.precioUSD) || 99}`;
    showNotification(`👑 ¡Plan Goglite Care (${precioDisplay}/mes) activado! Tu plataforma cuenta con soporte prioritario.`);
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

  if (!data || !data.lead) {
    return (
      <div className="min-h-screen bg-[#080b11] text-slate-200 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mb-4 text-orange-500">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Portal no disponible o enlace no registrado</h2>
        <p className="text-sm text-slate-400 max-w-md mb-6">
          El portal que intentas consultar no existe o aún no ha sido activado por el equipo comercial de Goglite.
        </p>
        <a href="/" className="px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-medium text-sm transition-all shadow-lg shadow-orange-500/20">
          Volver a Goglite
        </a>
      </div>
    );
  }

  const { lead, portalConfig, presupuesto } = data;
  const rawUbicacion = (presupuesto?.cliente?.ubicacion || data.proyecto?.cliente?.ubicacion || lead.ubicacion || '').toLowerCase();
  const rawTelefono = (presupuesto?.cliente?.telefono || lead.telefono || '').replace(/\D/g, '');
  const isDominicanPhone = rawTelefono.startsWith('1809') || rawTelefono.startsWith('1829') || rawTelefono.startsWith('1849') || (rawTelefono.length === 10 && (rawTelefono.startsWith('809') || rawTelefono.startsWith('829') || rawTelefono.startsWith('849')));
  const currentPais = (presupuesto?.pais === 'DO' || data.proyecto?.pais === 'DO' || lead.pais === 'DO' || rawUbicacion.includes('dominicana') || rawUbicacion.includes('santo domingo') || isDominicanPhone) ? 'DO' : 'SV';
  const resolvedAgencyContact = getAgencyContactForCountry(currentPais, agencyBranding);
  const displayPresupuestoEmisor = {
    ...(presupuesto?.emisor || {}),
    ...resolvedAgencyContact
  };
  const isSV = currentPais === 'SV';
  const activeBankTab = selectedBankTab === 'US' ? 'US' : currentPais;
  const totalInversion = Number(presupuesto?.inversion?.precioTotal || lead.presupuestoMonto) || 650;
  const anticipoMonto = Number(presupuesto?.inversion?.anticipo) || Math.round(totalInversion * 0.5);
  const liquidacionMonto = Number(presupuesto?.inversion?.contraEntrega) || (totalInversion - anticipoMonto);
  const clientEmpresa = presupuesto?.cliente?.empresa || lead.empresa || 'Empresa Cliente';
  const clientContacto = presupuesto?.cliente?.nombre || lead.contacto || 'Representante Legal';
  const clientUbicacion = presupuesto?.cliente?.ubicacion || (currentPais === 'DO' ? 'Santo Domingo, República Dominicana' : 'San Salvador, El Salvador');

  // Asegurar que el contrato formal SOW y el proyecto estén siempre resueltos y reconciliados con el presupuesto
  const rawActiveProyecto = data.proyecto || (presupuesto ? buildProyectoFromPresupuesto(presupuesto) : (lead ? buildProyectoFromPresupuesto({
    id: lead.id,
    codigo: lead.presupuestoCodigo || 'P-2026',
    cliente: { nombre: clientContacto, empresa: clientEmpresa, telefono: lead.telefono, email: lead.email, ubicacion: clientUbicacion },
    pais: currentPais,
    inversion: { precioTotal: totalInversion, anticipo: anticipoMonto, contraEntrega: liquidacionMonto }
  }) : null));

  const activeProyecto = (rawActiveProyecto && (presupuesto || totalInversion))
    ? reconcileProyectoWithPresupuesto(rawActiveProyecto, presupuesto || {
        codigo: lead.presupuestoCodigo || 'P-2026',
        inversion: { precioTotal: totalInversion, anticipo: anticipoMonto, contraEntrega: liquidacionMonto }
      })
    : rawActiveProyecto;

  const contrato = activeProyecto?.contrato;

  const isFase1Done = Boolean(
    portalConfig?.fase1Aprobada ||
    portalConfig?.fase2Firmada ||
    portalConfig?.fase3InsumosCompletos ||
    portalConfig?.fase4Liquidada ||
    presupuesto?.estado === 'aceptado'
  );
  const isFase2Done = Boolean(
    portalConfig?.fase2Firmada ||
    portalConfig?.anticipoPagado ||
    portalConfig?.fase3InsumosCompletos ||
    portalConfig?.fase4Liquidada
  );
  const isFase3Done = Boolean(
    portalConfig?.fase3InsumosCompletos ||
    activeProyecto?.onboarding?.insumosValidados100 ||
    activeProyecto?.portalConfig?.fase3InsumosCompletos ||
    activeProyecto?.faseActual >= 4
  );
  const isFase4Done = Boolean(
    portalConfig?.fase4Liquidada ||
    portalConfig?.liquidacionPagada ||
    activeProyecto?.pagos?.saldoEstado === 'confirmado' ||
    activeProyecto?.estado === 'entregado' ||
    activeProyecto?.portalConfig?.fase4Liquidada ||
    activeProyecto?.portalConfig?.liquidacionPagada ||
    activeProyecto?.faseActual >= 5
  );
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
      unlocked: isFase1Done || isFase2Done,
      isGoogleProtected: isDocumentosAnterioresProtegidos
    },
    { 
      num: 3, 
      title: 'Intake Insumos', 
      label: portalConfig?.fase3InsumosCompletos ? '✓ Validados' : portalConfig?.clienteConfirmoInsumos ? '⏳ En Revisión' : 'Garantía 10 Días', 
      done: isFase3Done, 
      unlocked: isFase2Done || isFase3Done || (isFase1Done && isFase2Done)
    },
    { num: 4, title: 'Liquidación', label: 'Candado de Accesos', done: isFase4Done, unlocked: isFase3Done || isFase4Done || (isFase1Done && isFase2Done && isFase3Done) },
    { num: 5, title: 'Garantía 30 Días', label: 'Plan CMS $99/mes', done: isFase5Done, unlocked: isFase4Done || isFase5Done || (isFase1Done && isFase2Done && isFase3Done && isFase4Done) }
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
      <header className="border-b border-slate-800/80 bg-[#0b0f19]/95 backdrop-blur sticky top-0 z-40 px-4 sm:px-6 py-2.5 sm:py-3.5 no-print print:hidden">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-4">
          {/* Fila 1 en móvil / Izquierda en Desktop: Ícono y Título de la Agencia */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#090d16] border border-slate-700 flex items-center justify-center shrink-0 overflow-hidden shadow-lg shadow-orange-500/10">
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
              <span className="font-bold text-white text-sm sm:text-base tracking-tight block">
                {agencyBranding.nombreAgencia || 'Goglite Digital Hub'}
              </span>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                {agencyBranding.eslogan || 'Portal Blindado de Cliente · 5 Fases de Ejecución'}
              </p>
            </div>
          </div>

          {/* Fila 2 en móvil / Derecha en Desktop: Botones de Acción */}
          <div className="flex items-center gap-2 sm:gap-2.5 w-full sm:w-auto">
            {matchingFactura && (
              <button
                type="button"
                onClick={() => setSelectedClientInvoiceModal(matchingFactura)}
                className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2 sm:py-1.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold shadow-lg shadow-orange-950/40 border border-orange-500/30 transition-all transform hover:scale-[1.02]"
                title="Consultar e Imprimir Factura Oficial"
              >
                <FileText className="w-3.5 h-3.5 text-orange-200" />
                <span className="hidden sm:inline">Factura Oficial</span>
                <span className="sm:hidden">Factura</span>
              </button>
            )}
            <a
              href={`https://wa.me/${(resolvedAgencyContact.telefonoWhatsapp || resolvedAgencyContact.telefono || agencyBranding.telefonoWhatsapp || '+18295284713').replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Hola, te escribo desde el Portal de Cliente de ${clientEmpresa}.`)}`}
              target="_blank"
              rel="noreferrer"
              className="flex-1 sm:flex-none px-3.5 py-2 sm:py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-950 transition-all"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>WhatsApp de Soporte</span>
            </a>
          </div>
        </div>
      </header>

      {/* Main Content Container (Mobile-First Spacing & Bottom Padding) */}
      <main className="max-w-6xl mx-auto px-3.5 sm:px-6 py-4 sm:py-8 space-y-5 sm:space-y-6 flex-1 w-full pb-28 sm:pb-8">
        
        {/* Welcome Client Hero Box */}
        <div className="no-print print:hidden portal-welcome-hero rounded-2xl bg-gradient-to-br from-[#101626] to-[#0b0e17] border border-slate-800 p-5 sm:p-7 relative overflow-hidden shadow-2xl">
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
          <div className="no-print print:hidden portal-auth-banner p-4 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-[#0d1525] to-cyan-500/10 border border-emerald-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
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
                  <div className={`flex items-center gap-1.5 text-xs font-mono px-3 py-1.5 rounded-xl border ${
                    portalConfig.clienteAuthRol === 'agency'
                      ? 'text-amber-400 bg-amber-500/10 border-amber-500/20'
                      : 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                  }`}>
                    <UserCheck className="w-4 h-4" />
                    <span>{portalConfig.clienteAuthRol === 'agency' ? '👑 Acceso Agencia' : `Autenticado (${portalConfig.clienteAuthProvider || 'Google'})`}</span>
                  </div>
                  {portalConfig?.cuentaClienteRegistrada && (
                    <div className="hidden sm:flex items-center gap-1 text-[11px] font-mono text-slate-400 bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800">
                      <span className="text-slate-500">Cliente:</span>
                      <span className="text-emerald-400 font-bold">{portalConfig.cuentaClienteRegistrada}</span>
                      {portalConfig?.clienteAuthRol === 'agency' && (
                        <button
                          type="button"
                          onClick={handleUnlinkClientAccount}
                          className="ml-1 text-[10px] text-rose-400 hover:text-rose-300 underline"
                          title="Desvincular cuenta registrada del cliente"
                        >
                          (Desvincular)
                        </button>
                      )}
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={handleClientLogout}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-rose-950/60 text-slate-300 hover:text-rose-300 border border-slate-700 hover:border-rose-500/50 text-xs font-medium transition-all shadow-sm"
                    title="Cerrar sesión"
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

        {/* 5-Phase Interactive Stepper Bar (Mobile-First Horizontal Swipe Snap + Desktop Grid) */}
        <div className="no-print print:hidden portal-stepper flex overflow-x-auto no-scrollbar snap-x touch-pan-x gap-2 pb-2 -mx-3.5 px-3.5 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-5 sm:gap-2.5">
          {steps.map((st) => {
            const isCurrent = activeTab === st.num;
            const isCompleted = st.done;
            const isLocked = !st.unlocked && !isCompleted;

            const isGoogleProtected = st.isGoogleProtected;

            return (
              <button
                key={st.num}
                type="button"
                onClick={() => handleSelectTab(st)}
                className={`shrink-0 snap-start min-w-[145px] sm:min-w-0 sm:w-auto p-3 sm:p-3.5 rounded-xl border text-left transition-all relative overflow-hidden select-none active:scale-[0.98] ${
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
              boundClientEmail={portalConfig?.cuentaClienteRegistrada || lead?.cuentaClienteRegistrada || ''}
              onAuthenticate={handleRegisterClientAuth}
              loading={clientAuthLoading}
              clientAuthPass={clientAuthPass}
              setClientAuthPass={setClientAuthPass}
              clientAuthEmail={clientAuthEmail}
              setClientAuthEmail={setClientAuthEmail}
              matchingFactura={matchingFactura}
              onViewInvoice={setSelectedClientInvoiceModal}
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
                    className="hidden sm:flex px-4 py-2.5 rounded-xl bg-emerald-600/20 border border-emerald-500/40 text-emerald-300 font-bold text-xs items-center gap-2 shadow-sm"
                  >
                    <CheckCheck className="w-4 h-4" />
                    <span>Propuesta Aprobada · Ir a Contrato SOW →</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleAprobarPropuesta}
                    className="hidden sm:flex px-5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs items-center gap-2 shadow-xl shadow-orange-950 transition-all transform hover:scale-[1.02]"
                  >
                    <Check className="w-4 h-4" />
                    <span>Aprobar Propuesta (1-Clic)</span>
                  </button>
                )}
              </div>
            </div>

            {/* FULL EXECUTIVE PROPOSAL DOCUMENT (ESTILO OFICIAL GOGLITE / 3 HOJAS 8.5 x 11 in) */}
            <div 
              id="printable-client-proposal"
              className="bg-transparent p-0 text-slate-900 overflow-visible print:border-none print:p-0 print:shadow-none print:bg-transparent print:m-0 space-y-6 sm:space-y-8 print:space-y-0"
            >
              {/* =========================================================================
                  HOJA 1: PORTADA OFICIAL GOGLITE (TAMAÑO CARTA 8.5 x 11 in / AJUSTE EXACTO)
                  ========================================================================= */}
              <div className="print-letter-page print-cover-sheet relative w-full max-w-4xl mx-auto overflow-hidden bg-[#090808] shadow-2xl rounded-2xl print:rounded-none print:shadow-none print:m-0 flex items-center justify-center">
                <img 
                  src="/assets/portada_oficial_fija.png" 
                  alt="Propuesta de Desarrollo Digital VIP" 
                  className="w-full h-auto object-contain block mx-auto print:w-full print:h-full print:object-contain"
                />
              </div>

              {/* =========================================================================
                  HOJA 2: RESUMEN EJECUTIVO & ALCANCE TÉCNICO (TAMAÑO CARTA 8.5 x 11 in)
                  ========================================================================= */}
              <div className="print-letter-page print-content-sheet max-w-4xl mx-auto p-6 sm:p-10 bg-white shadow-2xl rounded-2xl print:rounded-none print:shadow-none print:m-0 text-slate-900 font-sans leading-relaxed text-xs aspect-auto sm:min-h-[11in] flex flex-col justify-between">
                <div>
                  {/* Sub-Header con Marca Goglite y Metadatos */}
                  <div className="border-b-2 border-slate-900 pb-3 mb-4 avoid-break">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <img 
                          src={documentBrandLogo || (typeof window !== 'undefined' ? localStorage.getItem('goglite_agency_logo_docs') : null) || displayPresupuestoEmisor?.logoDocumentosUrl || displayPresupuestoEmisor?.logoUrl || DEFAULT_AGENCY_BRANDING.logoUrl} 
                          alt={agencyBranding?.nombreAgencia || displayPresupuestoEmisor?.empresa || 'Agencia'} 
                          className="h-8 sm:h-9 w-auto object-contain shrink-0"
                        />
                        <div className="text-[10px] text-slate-600 font-medium space-y-0.5 border-l border-slate-300 pl-2.5 sm:pl-3">
                          <div><strong>Ubicación:</strong> {displayPresupuestoEmisor?.ubicacion}</div>
                          <div><strong>Contacto:</strong> {displayPresupuestoEmisor?.telefono} | {displayPresupuestoEmisor?.email}</div>
                          <div><strong>Director:</strong> {displayPresupuestoEmisor?.responsable || 'Víctor Matos'}</div>
                        </div>
                      </div>

                      <div className="flex sm:flex-col items-center sm:items-end justify-between border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-200">
                        <div className="text-[10px] sm:text-[11px] font-mono font-bold text-slate-900 uppercase">
                          Fecha: {presupuesto?.fecha || new Date().toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
                        </div>
                        <div className="text-[11px] font-mono text-orange-600 font-bold sm:mt-0.5">
                          {presupuesto?.codigo || 'P-2026-001'}
                        </div>
                      </div>
                    </div>

                    {/* DESTINATARIO */}
                    <div className="mt-3 p-3 rounded-lg bg-slate-50 border border-slate-200">
                      <div className="text-[9.5px] font-mono uppercase text-slate-500 font-bold">Cliente / Destinatario:</div>
                      <div className="text-sm font-extrabold text-slate-900 mt-0.5">
                        {clientContacto} | {clientEmpresa}
                      </div>
                      <div className="text-[10.5px] text-slate-700">
                        Tel: {presupuesto?.cliente?.telefono || lead?.telefono || ''} · {presupuesto?.cliente?.actividad || 'Servicios Comerciales'}
                      </div>
                    </div>
                  </div>

                  {/* 2. TÍTULO DE LA PROPUESTA VIP */}
                  <div className="mb-4 avoid-break">
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
                  <div className="space-y-2 mb-4 bg-slate-50 p-3.5 sm:p-4 rounded-xl border border-slate-200/80 avoid-break text-[10.5px]">
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
                  <div className="mb-2">
                    <h2 className="text-xs font-black uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1 mb-2.5">
                      1. Componentes del Sistema Integral (Alcance y Entregables)
                    </h2>

                    <div className="space-y-2.5">
                      {(presupuesto?.modulos && presupuesto.modulos.length > 0 ? presupuesto.modulos : [
                        { numero: 'MÓDULO 1', titulo: 'Plataforma Web Corporativa de Alta Conversión (Mobile-First)', descripcion: 'Arquitectura responsive optimizada al 100% para dispositivos móviles. Incluye secciones estratégicas StoryBrand, catálogo de servicios, cobertura y llamado a la acción.' },
                        { numero: 'MÓDULO 2', titulo: 'Canales de Cierre y Contacto Directo (WhatsApp & Click-to-Call)', descripcion: 'Integración de botón flotante inteligente de WhatsApp Business con mensaje preconfigurado y marcado directo de un solo toque.' },
                        { numero: 'MÓDULO 3', titulo: 'Optimización del Perfil de Google Negocio & SEO/GEO Local', descripcion: 'Configuración técnica de Schema.org JSON-LD, categorización en Google Maps y ecosistema de códigos QR para captación de reseñas 5 estrellas.' }
                      ]).map((m, i) => (
                        <div key={i} className="pl-3 border-l-2 border-orange-500 space-y-0.5 avoid-break">
                          <div className="font-extrabold text-slate-900 text-xs">
                            {m.numero}: {m.titulo}
                          </div>
                          <p className="text-slate-700 text-[10.5px] leading-relaxed">
                            {m.descripcion}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Footer de Hoja 2 */}
                <div className="pt-3 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-400 font-mono avoid-break">
                  <span>Goglite Digital Hub · Suite Integral</span>
                  <span>Página 2 de 3 · Propuesta Oficial</span>
                </div>
              </div>

              {/* =========================================================================
                  HOJA 3: CRONOGRAMA, INVERSIÓN Y FIRMA (TAMAÑO CARTA 8.5 x 11 in)
                  ========================================================================= */}
              <div className="print-letter-page print-content-sheet max-w-4xl mx-auto p-6 sm:p-10 bg-white shadow-2xl rounded-2xl print:rounded-none print:shadow-none print:m-0 text-slate-900 font-sans leading-relaxed text-xs aspect-auto sm:min-h-[11in] flex flex-col justify-between">
                <div>
                  {/* Mini-Header Hoja 3 */}
                  <div className="border-b border-slate-200 pb-2.5 mb-4 flex items-center justify-between avoid-break">
                    <div className="flex items-center gap-2">
                      <img 
                        src={documentBrandLogo || (typeof window !== 'undefined' ? localStorage.getItem('goglite_agency_logo_docs') : null) || displayPresupuestoEmisor?.logoDocumentosUrl || displayPresupuestoEmisor?.logoUrl || DEFAULT_AGENCY_BRANDING.logoUrl} 
                        alt={agencyBranding?.nombreAgencia || displayPresupuestoEmisor?.empresa || 'Agencia'} 
                        className="h-6 w-auto object-contain"
                      />
                      <span className="font-bold text-slate-900 text-xs">{agencyBranding?.nombreAgencia || displayPresupuestoEmisor?.empresa || 'Goglite Digital Hub'}</span>
                    </div>
                    <div className="text-[10px] font-mono text-slate-500">
                      {presupuesto?.codigo || 'P-2026-001'} · {clientEmpresa}
                    </div>
                  </div>

                  {/* 2. HOJA DE RUTA Y FASES */}
                  <div className="mb-4 avoid-break">
                    <h2 className="text-xs font-black uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1 mb-2.5">
                      2. Hoja de Ruta y Fases de Implementación (10 a 15 Días Hábiles)
                    </h2>

                    <div className="space-y-2">
                      {(presupuesto?.fases && presupuesto.fases.length > 0 ? presupuesto.fases : [
                        { fase: 'Fase 1', plazo: 'Días 1 a 4', detalle: 'Configuración de activos digitales, arquitectura de información StoryBrand, ficha de Google Maps y códigos QR vectoriales.' },
                        { fase: 'Fase 2', plazo: 'Días 5 a 10', detalle: 'Desarrollo de la plataforma web Mobile-First, integración de canales de cierre en WhatsApp y optimización SEO/GEO.' },
                        { fase: 'Fase 3', plazo: 'Días 11 a 15', detalle: 'Auditoría de velocidad móvil, revisión conjunta con el cliente, ajustes finales y despliegue en producción.' }
                      ]).map((f, i) => (
                        <div key={i} className="text-[10.5px] text-slate-800">
                          <span className="font-extrabold text-slate-900">• {f.fase} ({f.plazo}):</span> {f.detalle}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 3. INVERSIÓN ESTRATÉGICA Y CONDICIONES */}
                  <div className="mb-4 p-4 sm:p-5 rounded-xl bg-slate-900 text-white avoid-break shadow-md">
                    <h2 className="text-xs font-black uppercase tracking-wider text-orange-400 mb-2">
                      3. Inversión Estratégica y Condiciones Comerciales
                    </h2>

                    <p className="text-[10.5px] text-slate-300 leading-relaxed mb-3">
                      La inversión en un sistema digital integral de esta envergadura suele oscilar entre los <strong>${presupuesto?.inversion?.precioMercadoReferencial || Math.max(1500, totalInversion * 2)} USD</strong> en el mercado profesional. Para <strong>{clientEmpresa}</strong> hemos estructurado un paquete preferencial:
                    </p>

                    <div className="bg-white/10 p-3 sm:p-3.5 rounded-lg border border-white/15 space-y-1 font-mono mb-3">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-300">Inversión Total del Sistema Completo:</span>
                        <span className="text-sm sm:text-base font-extrabold text-orange-400">
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
                  <div className="pt-3 border-t border-slate-300 flex items-center justify-between text-[10.5px] text-slate-600 avoid-break">
                    <div>
                      <div className="font-extrabold text-slate-900 text-xs">{displayPresupuestoEmisor?.responsable || 'Víctor Matos'}</div>
                      <div className="text-orange-600 font-bold">{displayPresupuestoEmisor?.empresa || agencyBranding?.nombreAgencia || 'Goglite'}</div>
                      <div className="text-[10px] text-slate-500">{displayPresupuestoEmisor?.telefono} | {displayPresupuestoEmisor?.email}</div>
                    </div>

                    <div className="text-right">
                      <div className="font-mono text-[9.5px] text-slate-400">Documento Oficial Certificado</div>
                      <div className="text-xs font-bold text-slate-900 uppercase">Estado: {presupuesto?.estado || 'EMITIDO'}</div>
                    </div>
                  </div>
                </div>

                {/* Footer de Hoja 3 */}
                <div className="pt-3 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-400 font-mono avoid-break">
                  <span>Goglite Digital Hub · Suite Integral</span>
                  <span>Página 3 de 3 · Conclusión & Firmas</span>
                </div>
              </div>
            </div>

            {/* Bottom Executive Approval Banner */}
            <div className="no-print print:hidden rounded-2xl bg-gradient-to-r from-[#101626] via-[#121c33] to-[#101626] border border-orange-500/30 p-6 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-2xl">
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
                    className="hidden sm:flex w-full sm:w-auto px-7 py-3 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-bold text-xs items-center justify-center gap-2 shadow-2xl shadow-orange-950 transition-all transform hover:scale-[1.02]"
                  >
                    <Check className="w-4 h-4" />
                    <span>Aprobar Propuesta (1-Clic) & Continuar</span>
                  </button>
                )}
              </div>
            </div>

            {/* Barra Móvil Flotante Fija (Mobile-First Thumb-Zone) */}
            <div className="no-print print:hidden portal-thumb-bar sm:hidden fixed bottom-0 left-0 right-0 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] bg-[#080b12]/95 backdrop-blur-lg border-t border-orange-500/30 z-40 shadow-2xl flex items-center gap-2">
              {portalConfig?.fase1Aprobada ? (
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab(2);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/60"
                >
                  <CheckCheck className="w-4 h-4" />
                  <span>Propuesta Aprobada · Ir a Contrato SOW →</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleAprobarPropuesta}
                  className="w-full py-3.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xl shadow-orange-950/60 transition-all active:scale-[0.99]"
                >
                  <Check className="w-4 h-4" />
                  <span>Aprobar Propuesta VIP (1-Clic)</span>
                </button>
              )}
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
              boundClientEmail={portalConfig?.cuentaClienteRegistrada || lead?.cuentaClienteRegistrada || ''}
              onAuthenticate={handleRegisterClientAuth}
              loading={clientAuthLoading}
              clientAuthPass={clientAuthPass}
              setClientAuthPass={setClientAuthPass}
              clientAuthEmail={clientAuthEmail}
              setClientAuthEmail={setClientAuthEmail}
              matchingFactura={matchingFactura}
              onViewInvoice={setSelectedClientInvoiceModal}
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

            {/* Factura Oficial de Servicios Habilitada para el Cliente tras Confirmación */}
            {matchingFactura ? (
              <div className="no-print p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-[#0c1424] via-[#0f172a] to-[#141d33] border border-orange-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-xl bg-orange-500/15 border border-orange-500/30 text-orange-400 flex items-center justify-center shrink-0 shadow-inner">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-bold text-white">Factura Comercial Oficial · {matchingFactura.numeroFactura}</span>
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold uppercase ${
                        matchingFactura.estado === 'cobrada' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                        matchingFactura.estado === 'parcial' ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30' :
                        'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      }`}>
                        {matchingFactura.estado === 'cobrada' ? '✓ Anticipo Acreditado (100% Cobrado)' : '✓ Anticipo Acreditado (50%)'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 mt-0.5">
                      Comprobante comercial oficial con desglose de entregables e inversión por <strong className="text-white">${Number(matchingFactura.total).toLocaleString()} USD</strong> disponible para consulta y descarga.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setSelectedClientInvoiceModal(matchingFactura)}
                    className="px-4 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-orange-950/40 transition-all transform hover:scale-[1.02]"
                  >
                    <Eye className="w-4 h-4" />
                    <span>Ver Factura Oficial</span>
                  </button>
                </div>
              </div>
            ) : hasAdvanceReceiptSubmitted ? (
              <div className="no-print p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-[#14120e] via-[#1c1813] to-[#17130f] border border-amber-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center shrink-0 shadow-inner">
                    <Clock className="w-6 h-6 animate-pulse" />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-bold text-white">Comprobante de Anticipo en Verificación Administrativa</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full font-bold uppercase bg-amber-500/20 text-amber-400 border border-amber-500/30">
                        Validación Interna Pendiente
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 mt-0.5">
                      Tu comprobante de anticipo fue registrado correctamente. El equipo administrativo está validando la acreditación en cuenta; una vez confirmado el depósito en nuestro panel interno, tu <strong>Factura Comercial Oficial</strong> quedará disponible aquí para consulta y descarga.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[11px] font-mono text-amber-300/80 bg-amber-950/40 px-3 py-1.5 rounded-xl border border-amber-500/20">
                    Factura en emisión pendiente
                  </span>
                </div>
              </div>
            ) : null}

            {/* FULL PRINTABLE SOW CONTRACT SHEET (2 HOJAS CARTA 8.5 x 11 in) */}
            <div 
              id="printable-client-contract"
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
                        src={documentBrandLogo} 
                        alt={agencyBranding?.nombreAgencia || 'Agencia'} 
                        className="h-8 w-auto object-contain"
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                      <div>
                        <div className="font-black text-sm uppercase tracking-wider text-slate-900">{agencyBranding?.nombreAgencia || 'Goglite Digital'}</div>
                        <div className="text-[10px] text-slate-500 font-mono">{agencyBranding?.eslogan || 'Agencia de Desarrollo Web Nativo & IA'}</div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="font-mono text-xs font-bold text-orange-600">{activeProyecto?.codigo || 'CON-2026-001'}</div>
                      <div className="text-[10px] text-slate-500">{contrato?.fechaEmision || new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
                    </div>
                  </div>

                  {/* Title */}
                  <div className="text-center my-4 avoid-break">
                    <h1 className="text-base sm:text-lg font-black uppercase tracking-tight text-slate-950">
                      {contrato?.titulo || 'CONTRATO OFICIAL DE PRESTACIÓN DE SERVICIOS DIGITALES Y DESARROLLO WEB'}
                    </h1>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Entre Goglite Digital y {clientEmpresa}
                    </p>
                  </div>

                  {/* Parties Section */}
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs mb-4 space-y-1.5 avoid-break">
                    <p className="leading-relaxed">
                      <strong>DE UNA PARTE:</strong> <strong>{(resolvedAgencyContact.empresa || agencyBranding?.nombreAgencia || 'GOGLITE DIGITAL').toUpperCase()}</strong>, representada por su {resolvedAgencyContact.cargo || 'Director General'} <strong>{resolvedAgencyContact.responsable || 'Víctor Matos'}</strong>, con facultades suficientes para celebrar este acto en calidad de <strong>EL PRESTADOR</strong>.
                    </p>
                    <p className="leading-relaxed">
                      <strong>DE OTRA PARTE:</strong> <strong>{clientContacto}</strong>, en representación legal de <strong>{clientEmpresa}</strong>, con domicilio en {clientUbicacion}, en adelante <strong>EL CLIENTE</strong>.
                    </p>
                    <p className="text-slate-600 text-[10.5px] pt-1 border-t border-slate-200">
                      Ambas partes se reconocen recíprocamente la capacidad legal necesaria para otorgar el presente contrato de servicios con base en las siguientes cláusulas:
                    </p>
                  </div>

                  {/* Clauses 1 to 4 */}
                  <div className="space-y-3 text-xs text-slate-800">
                    {(contrato?.clausulas || []).slice(0, 4).map((c, i) => (
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
                        src={documentBrandLogo} 
                        alt={agencyBranding?.nombreAgencia || 'Agencia'} 
                        className="h-6 w-auto object-contain"
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                      <span className="font-bold text-slate-900 text-xs">{agencyBranding?.nombreAgencia || 'Goglite Digital'} · Contrato Oficial</span>
                    </div>
                    <div className="text-[10px] font-mono text-slate-500">
                      {activeProyecto?.codigo || 'CON-2026-001'} · {clientEmpresa}
                    </div>
                  </div>

                  {/* Clauses 5 to end */}
                  <div className="space-y-3 text-xs text-slate-800 mb-4">
                    {(contrato?.clausulas || []).slice(4).map((c, i) => (
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
                  <div className="pt-3 border-t-2 border-slate-300 grid grid-cols-1 sm:grid-cols-2 gap-6 avoid-break">
                    {/* Agency Signature */}
                    <div className="border border-slate-200 rounded-xl p-3.5 bg-slate-50 flex flex-col justify-between">
                      <div>
                        <div className="text-[9.5px] uppercase font-bold text-slate-500 mb-1.5">Por {resolvedAgencyContact.empresa || agencyBranding?.nombreAgencia || 'Goglite Digital'}:</div>
                        <div className="h-14 flex items-center justify-center border-b border-slate-300 pb-1.5">
                          <span className="font-serif italic text-base text-slate-800">{resolvedAgencyContact.responsable || 'Víctor Matos'}</span>
                        </div>
                      </div>
                      <div className="mt-1.5 text-center text-[10px] text-slate-600">
                        <div className="font-bold text-slate-900 text-[11px]">{resolvedAgencyContact.responsable || 'Víctor Matos'}</div>
                        <div>{resolvedAgencyContact.cargo || 'Director General'} · {resolvedAgencyContact.empresa || agencyBranding?.nombreAgencia || 'Goglite Digital'}</div>
                        <div className="text-emerald-700 font-mono font-bold text-[9.5px] mt-0.5">Certificado por {resolvedAgencyContact.empresa || agencyBranding?.nombreAgencia || 'Goglite Digital'}</div>
                      </div>
                    </div>

                    {/* Client Signature Preview Inside Document */}
                    <div className="border border-slate-200 rounded-xl p-3.5 bg-slate-50 flex flex-col justify-between">
                      <div>
                        <div className="text-[9.5px] uppercase font-bold text-slate-500 mb-1.5">Por El Cliente ({clientEmpresa}):</div>
                        
                        {portalConfig?.fase2Firmada && portalConfig?.firmaDigital ? (
                          <div className="h-14 flex items-center justify-center border-b border-slate-300 pb-1.5">
                            <img 
                              src={portalConfig.firmaDigital} 
                              alt="Firma Digital Cliente" 
                              className="max-h-12 max-w-full object-contain filter brightness-0"
                              style={{ filter: 'brightness(0)' }}
                            />
                          </div>
                        ) : (
                          <div className="h-14 flex items-center justify-center border-b border-dashed border-slate-300 text-slate-400 text-[10.5px] italic pb-1.5 text-center">
                            ✍ Firma digital registrada en el portal
                          </div>
                        )}
                      </div>
                      <div className="mt-1.5 text-center text-[10px] text-slate-600">
                        <div className="font-bold text-slate-900 text-[11px]">
                          {portalConfig?.nombreFirmante || clientContacto}
                        </div>
                        <div>
                          {portalConfig?.documentoFirmante ? `ID: ${portalConfig.documentoFirmante}` : 'Representante Legal'}
                        </div>
                        {portalConfig?.fase2Firmada && (
                          <div className="text-emerald-700 font-mono font-bold text-[9.5px] mt-0.5">
                            ✓ Firmado Electrónicamente ({portalConfig.fechaFirmaContrato || '16 Oct 2026'})
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer Hoja 2 */}
                <div className="pt-3 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-400 font-mono avoid-break">
                  <span>Goglite Digital · Contrato SOW</span>
                  <span>Página 2 de 2 · Cierre Legal & Firmas</span>
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
                      <div className="p-4 rounded-xl bg-slate-100 border border-emerald-500/30 flex flex-col items-center">
                        <img 
                          src={portalConfig.firmaDigital} 
                          alt="Firma Registrada" 
                          className="h-20 object-contain filter brightness-0" 
                          style={{ filter: 'brightness(0)' }} 
                        />
                        <div className="text-[11px] text-emerald-800 font-mono font-bold mt-2">
                          ✓ Firmado digitalmente por: {portalConfig.nombreFirmante} ({portalConfig.documentoFirmante})
                        </div>
                      </div>
                    ) : (
                      <div className="border-2 border-dashed border-slate-300 rounded-xl overflow-hidden bg-white relative">
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
                          className="w-full h-36 cursor-crosshair touch-none bg-white"
                        />
                        {!hasSignature && (
                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-slate-400 text-xs font-mono">
                            ✍ Haz clic y dibuja tu firma aquí con tinta digital
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
                        className={`flex-1 py-2 sm:py-1.5 text-xs font-bold rounded-lg transition-all ${
                          activeBankTab === 'SV' ? 'bg-orange-600 text-white shadow' : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        🇸🇻 El Salvador
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setSelectedBankTab('DO')}
                        className={`flex-1 py-2 sm:py-1.5 text-xs font-bold rounded-lg transition-all ${
                          activeBankTab === 'DO' ? 'bg-orange-600 text-white shadow' : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        🇩🇴 Rep. Dominicana
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setSelectedBankTab('US')}
                      className={`flex-1 py-2 sm:py-1.5 text-xs font-bold rounded-lg transition-all ${
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
                          className="w-full mt-2.5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 active:bg-slate-900 text-slate-100 text-xs font-bold flex items-center justify-center gap-2 border border-slate-700 active:scale-[0.99] transition-all min-h-[46px]"
                        >
                          {copiedBank === 'SV' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-orange-400" />}
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
                          className="w-full mt-2.5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 active:bg-slate-900 text-slate-100 text-xs font-bold flex items-center justify-center gap-2 border border-slate-700 active:scale-[0.99] transition-all min-h-[46px]"
                        >
                          {copiedBank === 'DO' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-orange-400" />}
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
                          className="w-full mt-2.5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 active:bg-slate-900 text-slate-100 text-xs font-bold flex items-center justify-center gap-2 border border-slate-700 active:scale-[0.99] transition-all min-h-[46px]"
                        >
                          {copiedBank === 'US' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-orange-400" />}
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
                        type="button"
                        onClick={() => {
                          setActiveTab(3);
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        className="w-full py-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center justify-center gap-2 border border-slate-700 min-h-[46px]"
                      >
                        <span>Ir a la Fase 3: Intake de Insumos</span>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    ) : (
                      <button
                        id="btn-submit-contract-sow"
                        type="button"
                        onClick={handleFirmarContrato}
                        className="w-full py-3.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xl shadow-orange-950 transition-all min-h-[48px] active:scale-[0.99]"
                      >
                        <CheckCheck className="w-4 h-4" />
                        <span>Confirmar Firma y Enviar Captura de Comprobante (50%)</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Barra Móvil Flotante Fija para Fase 2 (Mobile-First Thumb-Zone) */}
            <div className="no-print print:hidden portal-thumb-bar sm:hidden fixed bottom-0 left-0 right-0 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] bg-[#080b12]/95 backdrop-blur-lg border-t border-orange-500/30 z-40 shadow-2xl flex items-center gap-2">
              {portalConfig?.fase2Firmada ? (
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab(3);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/60"
                >
                  <CheckCheck className="w-4 h-4" />
                  <span>Contrato Firmado · Ir a Intake de Insumos →</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleFirmarContrato}
                  className="w-full py-3.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xl shadow-orange-950/60 transition-all active:scale-[0.99]"
                >
                  <PenTool className="w-4 h-4" />
                  <span>Confirmar Firma y Reportar Anticipo</span>
                </button>
              )}
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

            {matchingFactura && (
        <div className="pt-2 border-t border-slate-800/80 max-w-md mx-auto w-full">
          <div className="p-3.5 rounded-xl bg-slate-900/90 border border-orange-500/30 flex items-center justify-between gap-3 text-left">
            <div className="flex items-center gap-2.5">
              <FileText className="w-5 h-5 text-orange-400 shrink-0" />
              <div>
                <div className="text-xs font-bold text-white flex items-center gap-1.5">
                  <span>Factura Oficial · {matchingFactura.numeroFactura}</span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-mono">
                    ${Number(matchingFactura.total).toLocaleString()} USD
                  </span>
                </div>
                <div className="text-[11px] text-slate-400">
                  Comprobante y desglose de inversión disponible
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setSelectedClientInvoiceModal(matchingFactura)}
              className="px-3 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs shrink-0 flex items-center gap-1 shadow-md transition-all"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Ver Factura</span>
            </button>
          </div>
        </div>
      )}

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

            {/* INSTRUCTIVO DETALLADO DE CARGA DE INSUMOS EN GOOGLE DRIVE */}
            <div className="rounded-2xl bg-[#0e1320] border border-slate-800 p-6 sm:p-7 space-y-6 shadow-xl">
              {/* Header del Instructivo */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-800/80">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-mono uppercase text-orange-400 font-bold tracking-wider">
                      Fase 3 · Entrega de Insumos & Materiales
                    </span>
                    <span className="text-[10px] bg-blue-500/15 border border-blue-500/30 text-blue-300 px-2 py-0.5 rounded-full font-mono font-bold">
                      Google Drive Vault
                    </span>
                  </div>
                  <h2 className="text-xl font-bold text-white">
                    Instructivo para Carga de Materiales de tu Marca
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-300 max-w-2xl">
                    Para asegurar que tus fotografías mantengan resolución 4K y tus logotipos vectoriales no pierdan nitidez ni calidad, los insumos se gestionan directamente a través de tu carpeta privada de Google Drive.
                  </p>
                </div>

                <div className="shrink-0">
                  <a
                    href={data.portalConfig?.driveVault?.subfolders?.insumos?.url || data.portalConfig?.driveVault?.vaultUrl || 'https://drive.google.com'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-blue-950/60 transition-all hover:scale-[1.02]"
                  >
                    <FolderOpen className="w-4 h-4" />
                    <span>Abrir Carpeta 01_Insumos_Cliente</span>
                    <ExternalLink className="w-3.5 h-3.5 ml-0.5" />
                  </a>
                </div>
              </div>

              {/* Los 3 Pasos del Flujo */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-[#141b2c] border border-slate-700/60 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-mono font-bold text-blue-400">
                    <span className="w-6 h-6 rounded-lg bg-blue-500/20 flex items-center justify-center text-xs">1</span>
                    <span>ABRE TU CARPETA</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Haz clic en el botón superior o en el acceso rápido <strong className="text-white">01_Insumos_Cliente</strong> para abrir tu carpeta privada de Google Drive en una nueva pestaña.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-[#141b2c] border border-slate-700/60 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-mono font-bold text-orange-400">
                    <span className="w-6 h-6 rounded-lg bg-orange-500/20 flex items-center justify-center text-xs">2</span>
                    <span>SUBE TUS MATERIALES</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Arrastra y suelta tus archivos directamente en la carpeta: logos, fotografías en alta definición, textos descriptivos y credenciales de dominio o redes.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-[#141b2c] border border-slate-700/60 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-mono font-bold text-emerald-400">
                    <span className="w-6 h-6 rounded-lg bg-emerald-500/20 flex items-center justify-center text-xs">3</span>
                    <span>CONFIRMA LA ENTREGA</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Regresa a este portal y presiona el botón inferior para avisar a la agencia que ya subiste los documentos para que el equipo valide el contenido.
                  </p>
                </div>
              </div>

              {/* Guía de Insumos Obligatorios a Cargar */}
              <div className="space-y-3 pt-2">
                <h3 className="text-xs font-bold uppercase font-mono tracking-wider text-slate-400">
                  📋 Lista de Materiales Recomendados a Depositar en la Carpeta:
                </h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                  <div className="p-4 rounded-xl bg-[#111726] border border-slate-800 hover:border-slate-700 transition-colors space-y-2">
                    <div className="flex items-center gap-2 text-orange-400">
                      <span className="text-lg">🎨</span>
                      <span className="font-bold text-white text-xs">1. Logotipo Oficial</span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Formatos vectoriales (<code className="text-orange-300 font-mono">.SVG</code>, <code className="text-orange-300 font-mono">.AI</code>) o imágenes en alta resolución con fondo transparente (<code className="text-orange-300 font-mono">.PNG</code>).
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-[#111726] border border-slate-800 hover:border-slate-700 transition-colors space-y-2">
                    <div className="flex items-center gap-2 text-sky-400">
                      <span className="text-lg">📸</span>
                      <span className="font-bold text-white text-xs">2. Fotos en Alta Calidad</span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Fotografías reales del establecimiento, consultorios, productos, equipo o trabajos. Evitar capturas borrosas de pantalla.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-[#111726] border border-slate-800 hover:border-slate-700 transition-colors space-y-2">
                    <div className="flex items-center gap-2 text-purple-400">
                      <span className="text-lg">📝</span>
                      <span className="font-bold text-white text-xs">3. Textos & Servicios</span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Documento Word o PDF con la lista de servicios, precios o catálogo, historia, testimonios y números de contacto WhatsApp.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-[#111726] border border-slate-800 hover:border-slate-700 transition-colors space-y-2">
                    <div className="flex items-center gap-2 text-emerald-400">
                      <span className="text-lg">🔑</span>
                      <span className="font-bold text-white text-xs">4. Accesos & Dominio</span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Credenciales o proveedor de tu dominio actual (GoDaddy, Namecheap, Cloudflare, etc.) para el despliegue y lanzamiento.
                    </p>
                  </div>
                </div>
              </div>

              {/* SECCIÓN DE ESTADO & CONFIRMACIÓN DE ENTREGA */}
              <div className="pt-3 border-t border-slate-800/80">
                {(portalConfig?.fase3InsumosCompletos || isFase3Done) ? (
                  /* ESTADO 1: INSUMOS VALIDADOS POR LA AGENCIA (RELOJ ACTIVO) */
                  <div className="p-5 rounded-2xl bg-emerald-500/10 border-2 border-emerald-500/40 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5 border border-emerald-500/30">
                          <CheckCircle2 className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-white flex items-center gap-2">
                            <span>✓ Insumos Validados al 100% en Google Drive</span>
                            <span className="text-[10px] font-mono bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/30">
                              Sprint Activo
                            </span>
                          </h4>
                          <p className="text-xs text-slate-200 mt-1 leading-relaxed">
                            El equipo de Goglite Digital verificó y validó formalmente que los materiales en tu carpeta están completos. El cronómetro oficial de <strong>10 días hábiles</strong> de desarrollo se encuentra activo.
                          </p>
                          {portalConfig?.fechaInsumosCompletos && (
                            <p className="text-[11px] font-mono text-emerald-400 mt-1">
                              📅 Fecha de validación por la agencia: <strong>{portalConfig.fechaInsumosCompletos}</strong>
                            </p>
                          )}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => setActiveTab(4)}
                        className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-950 transition-all shrink-0"
                      >
                        <span>Ir a la Fase 4: Liquidación & Staging</span>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ) : portalConfig?.clienteConfirmoInsumos ? (
                  /* ESTADO 2: EL CLIENTE CONFIRMÓ LA SUBIDA, PERO PENDIENTE DE VALIDACIÓN POR AGENCIA */
                  <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-[#0e1424] border-2 border-amber-500/40 space-y-4">
                    <div className="flex items-start gap-3.5">
                      <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 mt-0.5 border border-amber-500/30">
                        <Clock className="w-5 h-5 animate-pulse" />
                      </div>
                      <div className="space-y-1 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="text-sm font-bold text-white">
                            ⏳ Confirmación Recibida · Insumos en Proceso de Validación
                          </h4>
                          <span className="text-[10px] font-mono bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full border border-amber-500/30 font-bold">
                            Pendiente Validación de Agencia
                          </span>
                        </div>
                        <p className="text-xs text-slate-200 leading-relaxed">
                          Has notificado que subiste tus archivos a Google Drive el <strong>{portalConfig?.fechaConfirmacionClienteInsumos || 'recientemente'}</strong>. Nuestro equipo técnico está inspeccionando la carpeta <strong className="text-white">01_Insumos_Cliente</strong> para verificar que los archivos estén completos y cumplan con los requerimientos técnicos de resolución y formato.
                        </p>
                        <div className="p-3 rounded-xl bg-slate-900/70 border border-slate-800 text-[11px] text-amber-300/90 flex items-start gap-2 mt-2">
                          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                          <span>
                            ⚖️ <strong>Cláusula de Garantía de Plazos:</strong> El reloj oficial de <strong>10 días hábiles</strong> de desarrollo se activará formalmente en cuanto la agencia confirme que los archivos en el Drive están completos y validados.
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2 border-t border-amber-500/20">
                      <a
                        href={data.portalConfig?.driveVault?.subfolders?.insumos?.url || data.portalConfig?.driveVault?.vaultUrl || 'https://drive.google.com'}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-2 border border-slate-700 transition-colors"
                      >
                        <ExternalLink className="w-3.5 h-3.5 text-blue-400" />
                        <span>Ver mi Carpeta en Google Drive</span>
                      </a>

                      <button
                        type="button"
                        onClick={handleConfirmarSubidaInsumosCliente}
                        className="text-xs text-slate-400 hover:text-white underline font-mono text-center sm:text-right"
                      >
                        ¿Subiste más archivos recientemente? Re-confirmar subida
                      </button>
                    </div>

                    {/* Botón de validación de insumos en Google Drive */}
                    <div className="p-3.5 rounded-xl bg-orange-950/40 border border-orange-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-3">
                      <div className="flex items-center gap-2 text-orange-300 text-xs font-mono font-bold">
                        <ShieldCheck className="w-4 h-4 text-orange-400 shrink-0" />
                        <span>¿Archivos verificados en Google Drive? Validar para desbloquear la Fase 4:</span>
                      </div>
                      <button
                        type="button"
                        onClick={handleCompletarInsumos}
                        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md transition-all shrink-0"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Validar Insumos en Drive & Activar Reloj 10 Días</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  /* ESTADO 3: EL CLIENTE AÚN NO HA CONFIRMADO LA SUBIDA */
                  <div className="p-6 rounded-2xl bg-gradient-to-r from-[#101728] via-[#0e1424] to-[#12192a] border border-slate-700/80 space-y-4 text-center sm:text-left">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <h4 className="text-sm sm:text-base font-bold text-white flex items-center justify-center sm:justify-start gap-2">
                          <CheckCheck className="w-4 h-4 text-orange-400" />
                          <span>¿Ya subiste los insumos a tu carpeta de Google Drive?</span>
                        </h4>
                        <p className="text-xs text-slate-300 max-w-xl">
                          Una vez que hayas colocado tus logotipos, fotos y textos dentro de la carpeta <strong className="text-white">01_Insumos_Cliente</strong>, presiona el botón a continuación para notificar al equipo técnico:
                        </p>
                      </div>

                      <div className="shrink-0 flex flex-col items-center sm:items-end gap-1.5">
                        <button
                          type="button"
                          onClick={handleConfirmarSubidaInsumosCliente}
                          className="w-full sm:w-auto px-6 py-3 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2.5 shadow-xl shadow-orange-950/60 border border-orange-500/30 transition-all transform hover:scale-[1.02]"
                        >
                          <Upload className="w-4 h-4 text-orange-200" />
                          <span>He Subido los Documentos a mi Carpeta de Google Drive</span>
                        </button>
                        <span className="text-[10px] text-slate-400 font-mono">
                          Notifica al equipo de desarrollo de Goglite Digital
                        </span>
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-[11px] text-slate-400 flex items-start gap-2 text-left">
                      <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      <span>
                        ℹ️ <strong>Importante:</strong> Al presionar este botón confirmas que cargaste tus documentos. El plazo contractual de <strong>10 días hábiles</strong> de entrega se activará formalmente una vez que la agencia confirme que en el Google Drive sí se encuentran todos los insumos necesarios.
                      </span>
                    </div>

                    {/* Botón de validación rápida si la sesión pertenece a la agencia */}
                    {portalConfig?.clienteAuthRol === 'agency' && (
                      <div className="p-3.5 rounded-xl bg-orange-950/40 border border-orange-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-left">
                        <div className="flex items-center gap-2 text-orange-300 text-xs font-mono font-bold">
                          <ShieldCheck className="w-4 h-4 text-orange-400" />
                          <span>[Vista de Agencia] ¿Ya validaste los archivos en Drive?</span>
                        </div>
                        <button
                          type="button"
                          onClick={handleCompletarInsumos}
                          className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md transition-all shrink-0"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Validar Insumos en Drive y Activar Reloj de 10 Días</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}
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

              {/* Pre-visualización y Verificación de Staging */}
              <div className="p-4 rounded-xl bg-[#111726] border border-slate-800 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-orange-500/20 text-orange-400 flex items-center justify-center shrink-0 mt-0.5 border border-orange-500/30">
                    <Smartphone className="w-4 h-4" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                      Pre-Visualización Privada & Verificación de Staging
                    </h4>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      Tu plataforma web se encuentra alojada en nuestro servidor privado de pruebas con tus insumos de marca, estructura visual y canales de WhatsApp. Puedes navegar el sitio y comprobar la experiencia móvil antes de la conexión a tu dominio definitivo.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-[11px] text-slate-300">
                  <div className="flex items-center gap-1.5 p-2 rounded-lg bg-[#0a0d16] border border-slate-800/80">
                    <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Diseño Mobile-First adaptado</span>
                  </div>
                  <div className="flex items-center gap-1.5 p-2 rounded-lg bg-[#0a0d16] border border-slate-800/80">
                    <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Canales de WhatsApp configurados</span>
                  </div>
                  <div className="flex items-center gap-1.5 p-2 rounded-lg bg-[#0a0d16] border border-slate-800/80">
                    <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Listo para despliegue en producción</span>
                  </div>
                </div>
              </div>

              {/* SECURITY LOCK / CREDENTIALS VAULT */}
              {isFase4Done ? (
                /* UNLOCKED VAULT */
                <div className="p-6 rounded-2xl bg-gradient-to-br from-emerald-500/10 via-[#101b24] to-[#0c121d] border-2 border-emerald-500/50 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                        <Unlock className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-white">¡Candado Liberado con Éxito!</h3>
                        <p className="text-xs text-emerald-400">Liquidación recibida el {portalConfig?.fechaLiquidacion || activeProyecto?.pagos?.saldoFecha || 'recientemente'}. Tus accesos oficiales están activos:</p>
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

                    <div className="p-3.5 rounded-xl bg-[#090d16] border border-slate-800 font-mono text-xs overflow-hidden">
                      <span className="text-[10px] text-slate-400 block mb-1">Panel Administrativo / CMS:</span>
                      <div className="text-white break-all">Usuario: <strong className="text-orange-400">admin@{lead.empresa.toLowerCase().replace(/\s+/g, '')}.com</strong></div>
                      <div className="text-white">Clave: <strong className="text-emerald-400">Goglite#2026!Secured</strong></div>
                    </div>

                    <div className="p-3.5 rounded-xl bg-[#090d16] border border-slate-800 font-mono text-xs">
                      <span className="text-[10px] text-slate-400 block mb-1">Repositorio Privado GitHub:</span>
                      <strong className="text-white block truncate">github.com/goglite-clients/{lead.empresa.toLowerCase().replace(/\s+/g, '-')}</strong>
                      <span className="text-[9px] text-sky-400">Propiedad Intelectual 100% Cedida</span>
                    </div>
                  </div>

                  {/* Factura Oficial de Liquidación Final si está confirmada */}
                  {(() => {
                    const facSaldo = clientFacturasDisponibles.find(f => f.tipoHito === 'saldo' || f.id?.endsWith('-saldo')) || (isSaldoConfirmed ? matchingFactura : null);
                    if (!facSaldo) return null;
                    return (
                      <div className="p-4 rounded-xl bg-gradient-to-r from-[#0c1424] via-[#0f172a] to-[#141d33] border border-orange-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-orange-500/20 text-orange-400 flex items-center justify-center shrink-0">
                            <FileText className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-white">Factura de Liquidación Final · {facSaldo.numeroFactura}</span>
                              <span className="text-[9px] font-mono px-2 py-0.5 rounded-full font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                ✓ Liquidado 100%
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-300">
                              Comprobante fiscal y finiquito final por <strong className="text-white">${Number(facSaldo.total).toLocaleString()} USD</strong> disponible para descarga.
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setSelectedClientInvoiceModal(facSaldo)}
                          className="px-3.5 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs flex items-center gap-1.5 shadow transition-all shrink-0"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Ver Factura</span>
                        </button>
                      </div>
                    );
                  })()}

                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab(5);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 border border-emerald-500/40 shadow-lg shadow-emerald-950/40 transition-all cursor-pointer"
                    >
                      <span>Continuar a Fase 5: Garantía de 30 Días & Mantenimiento</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : hasSettlementReceiptSubmitted && !showResubmitSettlementForm ? (
                /* ESTADO: COMPROBANTE EN VERIFICACIÓN ADMINISTRATIVA */
                <div className="p-6 rounded-2xl bg-gradient-to-br from-[#16131c] via-[#1a1724] to-[#0f111a] border-2 border-amber-500/40 space-y-4 shadow-xl">
                  <div className="flex items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3.5">
                      <div className="w-12 h-12 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                        <Clock className="w-6 h-6 animate-pulse" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-bold text-white">Comprobante de Liquidación en Verificación Administrativa</h3>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full font-bold uppercase bg-amber-500/20 text-amber-400 border border-amber-500/30">
                            Validación en Curso
                          </span>
                        </div>
                        <p className="text-xs text-slate-300 mt-1">
                          Tu comprobante bancario del 50% de saldo final (${liquidacionMonto} USD) ha sido registrado y se encuentra en revisión.
                        </p>
                        <p className="text-xs text-amber-300 font-semibold mt-1">
                          Nuestro departamento administrativo está validando la acreditación bancaria en el panel interno. Tan pronto se confirme el depósito, el candado de accesos se liberará automáticamente y tu factura comercial final estará disponible para su descarga.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-slate-800/80">
                    <div className="flex items-center gap-2">
                      {(settlementReceiptImage || data?.portalConfig?.comprobanteLiquidacionImagen || data?.proyecto?.pagos?.saldoComprobanteImagen) && (
                        <button
                          type="button"
                          onClick={() => setPreviewReceiptModalUrl(settlementReceiptImage || data?.portalConfig?.comprobanteLiquidacionImagen || data?.proyecto?.pagos?.saldoComprobanteImagen)}
                          className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 font-bold flex items-center gap-1.5 border border-slate-700 transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5 text-orange-400" />
                          <span>Ver Comprobante Adjunto</span>
                        </button>
                      )}
                      <span className="text-[10px] text-slate-500 font-mono">
                        Estado: Esperando validación interna de administración
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => setShowResubmitSettlementForm(true)}
                      className="text-[11px] text-orange-400 hover:text-orange-300 underline font-semibold transition-colors"
                    >
                      Resubir o corregir comprobante
                    </button>
                  </div>
                </div>
              ) : (
                /* LOCKED CARD WITH SETTLEMENT REQUIREMENT FORM */
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
                        {(settlementReceiptImage || data?.portalConfig?.comprobanteLiquidacionImagen || data?.proyecto?.pagos?.saldoComprobanteImagen) ? (
                          <div className="p-3 rounded-xl bg-[#141b2b] border border-emerald-500/40 space-y-2.5">
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2 min-w-0">
                                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                                <span className="text-xs font-bold text-emerald-300 truncate">
                                  {settlementReceiptFileName || data?.portalConfig?.comprobanteLiquidacionNombre || data?.proyecto?.pagos?.saldoComprobanteNombre || 'Comprobante_Liquidacion.jpg'}
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => setPreviewReceiptModalUrl(settlementReceiptImage || data?.portalConfig?.comprobanteLiquidacionImagen || data?.proyecto?.pagos?.saldoComprobanteImagen)}
                                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-orange-400 text-[11px] font-bold flex items-center gap-1 border border-slate-700 transition-colors"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                  <span>Ver</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => settlementReceiptInputRef.current?.click()}
                                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-semibold border border-slate-700 transition-colors"
                                >
                                  Cambiar
                                </button>
                              </div>
                            </div>

                            <div
                              onClick={() => setPreviewReceiptModalUrl(settlementReceiptImage || data?.portalConfig?.comprobanteLiquidacionImagen || data?.proyecto?.pagos?.saldoComprobanteImagen)}
                              className="relative rounded-lg overflow-hidden border border-slate-700/80 bg-[#090d16] max-h-36 flex items-center justify-center cursor-pointer group"
                            >
                              <img
                                src={settlementReceiptImage || data?.portalConfig?.comprobanteLiquidacionImagen || data?.proyecto?.pagos?.saldoComprobanteImagen}
                                alt="Comprobante de Liquidación"
                                className="max-h-32 w-auto object-contain group-hover:scale-105 transition-transform"
                              />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-[11px] font-bold text-white gap-1">
                                <Eye className="w-3.5 h-3.5" /> Ampliar Comprobante
                              </div>
                            </div>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => settlementReceiptInputRef.current?.click()}
                            className="w-full py-3.5 px-3 rounded-xl bg-[#141b2b] hover:bg-slate-800 border-2 border-dashed border-orange-500/40 hover:border-orange-500 text-xs text-orange-300 font-bold flex items-center justify-center gap-2 transition-all cursor-pointer min-h-[46px]"
                          >
                            <FileUp className="w-4 h-4 text-orange-400 shrink-0" />
                            <span className="truncate">
                              Subir Captura de la Transferencia Bancaria
                            </span>
                          </button>
                        )}
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

                    <div className="flex items-center gap-2 pt-2">
                      <button
                        type="submit"
                        disabled={unlockAnimating}
                        className="flex-1 py-3.5 px-4 rounded-xl bg-gradient-to-r from-orange-600 via-orange-500 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xl shadow-orange-950/50 border border-orange-400/40 transition-all cursor-pointer"
                      >
                        {unlockAnimating ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            <span>Notificando Pago a Administración...</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="w-4 h-4 text-white" />
                            <span>✓ Ya hice el pago · Notificar Liquidación Final (${liquidacionMonto} USD)</span>
                          </>
                        )}
                      </button>

                      {hasSettlementReceiptSubmitted && showResubmitSettlementForm && (
                        <button
                          type="button"
                          onClick={() => setShowResubmitSettlementForm(false)}
                          className="px-4 py-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-colors"
                        >
                          Cancelar
                        </button>
                      )}
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
        {activeTab === 5 && portalConfig?.clienteAutenticado && (
          <div className="space-y-6">

            {/* Banner Superior de Producción en Vivo & Conexión al CMS */}
            <div className="p-4 sm:p-6 rounded-2xl bg-gradient-to-r from-[#0d1526] via-[#101b30] to-[#0a101f] border-2 border-emerald-500/40 shadow-xl space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/30">
                    <Globe className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-mono font-bold uppercase bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/30">
                        Sitio Oficial en Producción · Conectado al CMS
                      </span>
                      <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                        SSL 256-bit Activo
                      </span>
                    </div>
                    <h3 className="text-base sm:text-lg font-extrabold text-white mt-0.5 break-all">
                      https://{(lead.empresa || 'empresa').toLowerCase().replace(/\s+/g, '')}.com
                    </h3>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <a
                    href={`https://${(lead.empresa || 'empresa').toLowerCase().replace(/\s+/g, '')}.com`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 sm:flex-none justify-center px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md transition-all"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Visitar Sitio Oficial</span>
                  </a>
                  <a
                    href={`/cms-cliente/${token || lead.portalToken || lead.id}`}
                    className="flex-1 sm:flex-none justify-center px-4 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs flex items-center gap-1.5 border border-orange-500/40 shadow-lg shadow-orange-950/40 transition-colors"
                  >
                    <Sliders className="w-3.5 h-3.5 text-white" />
                    <span>Panel CMS Admin</span>
                  </a>
                </div>
              </div>

              {/* Aviso de Vigencia de 30 Días del Portal de Entrega de Proyecto */}
              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div className="text-xs text-slate-200 leading-relaxed">
                  <strong className="text-amber-300 font-bold">Vigencia del Portal de Entrega (30 Días):</strong>{' '}
                  Este portal de proyecto permanecerá abierto durante 30 días para que descargues tus entregables y archivos desde Google Drive. Para la gestión operativa continua de tu sitio web (textos sencillos, reseñas de Google y Site Kit), utiliza tu <strong>Panel CMS Admin</strong>.
                </div>
                <a
                  href={`/cms-cliente/${token || lead.portalToken || lead.id}`}
                  className="px-3.5 py-2 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-bold text-[11px] font-mono border border-amber-500/40 shrink-0 text-center"
                >
                  Ir al CMS del Sitio →
                </a>
              </div>

              {/* Quality Audit Badges (Auditadas en Producción / CMS) */}
              <div className="space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
                  <span className="font-bold text-slate-300 font-mono uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Métricas de Rendimiento & Salud Web en Producción</span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    Conectado con Goglite Headless CMS
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3.5 rounded-xl bg-[#141b2b] border border-slate-800 text-center shadow-inner">
                    <div className="text-[10px] font-mono text-slate-400 uppercase">Velocidad Móvil</div>
                    <div className="text-xl font-black text-emerald-400 font-mono mt-0.5">99 / 100</div>
                    <div className="text-[9px] text-slate-500">Google PageSpeed Producción</div>
                  </div>
                  <div className="p-3.5 rounded-xl bg-[#141b2b] border border-slate-800 text-center shadow-inner">
                    <div className="text-[10px] font-mono text-slate-400 uppercase">Tiempo de Carga</div>
                    <div className="text-xl font-black text-emerald-400 font-mono mt-0.5">0.65s</div>
                    <div className="text-[9px] text-slate-500">Core Web Vitals LCP</div>
                  </div>
                  <div className="p-3.5 rounded-xl bg-[#141b2b] border border-slate-800 text-center shadow-inner">
                    <div className="text-[10px] font-mono text-slate-400 uppercase">Diseño Responsive</div>
                    <div className="text-xl font-black text-sky-400 font-mono mt-0.5">100% OK</div>
                    <div className="text-[9px] text-slate-500">Móvil, Tablet & Desktop</div>
                  </div>
                  <div className="p-3.5 rounded-xl bg-[#141b2b] border border-slate-800 text-center shadow-inner">
                    <div className="text-[10px] font-mono text-slate-400 uppercase">WhatsApp & SEO</div>
                    <div className="text-xl font-black text-purple-400 font-mono mt-0.5">Activo</div>
                    <div className="text-[9px] text-slate-500">Canales & Eventos de Cierre</div>
                  </div>
                </div>
              </div>
            </div>

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

                    {/* Countdown Display Card en Vivo con Segundos */}
                    <WarrantyCountdownTimer
                      fechaInicio={portalConfig?.fechaLiquidacion || portalConfig?.fechaInicioGarantia || data?.proyecto?.pagos?.saldoFecha || portalConfig?.fechaReporteLiquidacion}
                      diasGarantia={30}
                    />

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
                    href={`https://wa.me/${(resolvedAgencyContact.telefonoWhatsapp || agencyBranding.telefonoWhatsapp || '+18295284713').replace(/\D/g, '')}?text=${encodeURIComponent(`Hola Víctor, necesito solicitar un ajuste bajo la garantía de 30 días para ${lead.empresa}.`)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs flex items-center justify-center gap-2 border border-slate-700 mt-4 transition-colors"
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Solicitar Ajuste bajo Garantía de 30 Días</span>
                  </a>
                </div>
              </div>

              {/* Right Column: Goglite Care Conversion */}
              <div className="lg:col-span-6 space-y-6">
                <GogliteCareCard
                  careService={careService}
                  carePlanActive={carePlanActive}
                  careVenceAt={portalConfig?.careVenceAt}
                  onActivarCare={handleActivarGogliteCare}
                  lead={lead}
                  resolvedAgencyContact={resolvedAgencyContact}
                  moneda={currentPais === 'DO' ? 'DOP' : 'USD'}
                />
              </div>

            </div>

            {/* Facturas Comerciales Oficiales del Proyecto en Fase 5 */}
            {clientFacturasDisponibles.length > 0 && (
              <div className="no-print rounded-2xl bg-[#0e1320] border border-slate-800 p-5 space-y-4 shadow-xl">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2.5">
                    <FileText className="w-5 h-5 text-orange-400" />
                    <div>
                      <h3 className="text-sm font-bold text-white">Facturas Comerciales Oficiales del Proyecto</h3>
                      <p className="text-[11px] text-slate-400">Comprobantes y recibos fiscales emitidos y confirmados por administración</p>
                    </div>
                  </div>
                  <span className="text-xs font-mono text-emerald-400 font-bold bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
                    {clientFacturasDisponibles.length} {clientFacturasDisponibles.length === 1 ? 'Factura Validada' : 'Facturas Validadas'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {clientFacturasDisponibles.map(fac => (
                    <div key={fac.id} className="p-4 rounded-xl bg-[#131929] border border-slate-700/70 flex items-center justify-between gap-3 shadow-sm hover:border-orange-500/40 transition-all">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-bold text-orange-400">{fac.numeroFactura}</span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-mono font-bold">
                            ${Number(fac.total).toLocaleString()} USD
                          </span>
                        </div>
                        <div className="text-xs text-white font-medium line-clamp-1">{fac.concepto}</div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {fac.tipoHito === 'saldo' ? 'Liquidación y Saldo Final (50%)' : 'Anticipo Inicial (50%)'} · {fac.fechaEmision}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedClientInvoiceModal(fac)}
                        className="px-3 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs flex items-center gap-1.5 shrink-0 shadow transition-all"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Ver Factura</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="no-print print:hidden border-t border-slate-800/80 mt-10 py-6 text-center text-xs text-slate-500 bg-[#080b12]">
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

      {/* MODAL: FACTURA COMERCIAL OFICIAL CLIENTE */}
      {selectedClientInvoiceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="bg-[#0e1320] border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-[#121828]">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-orange-400" />
                <span className="font-bold text-sm text-white">Factura Comercial Oficial · {selectedClientInvoiceModal.numeroFactura}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handlePrintClientInvoicePdf(selectedClientInvoiceModal)}
                  className="px-3.5 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs flex items-center gap-1.5 shadow transition-all"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Imprimir / Guardar PDF</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedClientInvoiceModal(null)}
                  className="w-8 h-8 rounded-lg bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            {clientFacturasDisponibles.length > 1 && (
              <div className="px-4 py-2.5 bg-[#090d16] border-b border-slate-800 flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-mono text-slate-400">Facturas confirmadas:</span>
                {clientFacturasDisponibles.map((fac, idx) => {
                  const isSelected = selectedClientInvoiceModal?.id === fac.id || selectedClientInvoiceModal?.numeroFactura === fac.numeroFactura;
                  return (
                    <button
                      key={fac.id || idx}
                      type="button"
                      onClick={() => setSelectedClientInvoiceModal(fac)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                        isSelected 
                          ? 'bg-orange-600 text-white shadow-md' 
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700/60'
                      }`}
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>{fac.tipoHito === 'saldo' ? 'Saldo Final (50%)' : 'Anticipo Inicial (50%)'} · {fac.numeroFactura}</span>
                    </button>
                  );
                })}
              </div>
            )}
            <div className="p-6 overflow-y-auto bg-[#FAFAFA]">
              <CorporateInvoiceDocument 
                invoice={selectedClientInvoiceModal} 
                configuracion={{
                  ...(portalConfig || {}),
                  emisor: {
                    empresa: resolvedAgencyContact.empresa || agencyBranding?.nombreAgencia || 'Goglite Digital Hub',
                    subtitulo: agencyBranding?.eslogan,
                    logoUrl: documentBrandLogo,
                    logoDocumentosUrl: documentBrandLogo,
                    identificacion: resolvedAgencyContact.identificacion || agencyBranding?.identificacion || (currentPais === 'DO' ? 'RNC: 1-32-45678-9' : 'NIT: 0614-290390-102-1'),
                    email: resolvedAgencyContact.email || agencyBranding?.emailContacto || 'contacto@goglite.com',
                    telefono: resolvedAgencyContact.telefonoWhatsapp || resolvedAgencyContact.telefono || agencyBranding?.telefonoWhatsapp,
                    ubicacion: resolvedAgencyContact.ubicacion || agencyBranding?.ubicacionPrincipal || 'San Salvador, SV · Santo Domingo, DO'
                  }
                }} 
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
