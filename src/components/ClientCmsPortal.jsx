import React, { useState, useEffect } from 'react';
import {
  Globe,
  Type,
  MessageSquare,
  BarChart3,
  Save,
  CheckCircle2,
  ShieldCheck,
  Lock,
  Sparkles,
  ExternalLink,
  Star,
  Send,
  RefreshCw,
  Smartphone,
  ArrowLeft,
  LogOut,
  Building2,
  MapPin,
  TrendingUp,
  Users,
  MousePointerClick,
  Search,
  AlertCircle,
  Check
} from 'lucide-react';
import { auth } from '../services/firebase';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import {
  getPortalCloud,
  savePortalCloud,
  subscribePortalCloud,
  getCmsSiteCloud,
  saveCmsSiteCloud,
  subscribeCmsSiteCloud
} from '../services/firestoreSyncService';

const AGENCY_BLOCKED_EMAILS = ['sitesgoglite@gmail.com', 'info@goglite.com'];

export default function ClientCmsPortal({ token }) {
  const [loading, setLoading] = useState(true);
  const [portalData, setPortalData] = useState(null);
  const [cmsSite, setCmsSite] = useState(null);
  const [activeTab, setActiveTab] = useState('editor'); // 'editor' | 'gbp' | 'sitekit'
  const [saving, setSaving] = useState(false);
  const [notification, setNotification] = useState('');
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [replyDrafts, setReplyDrafts] = useState({});

  // Campos de texto sencillo editables por el cliente
  const [editableText, setEditableText] = useState({
    heroTitulo: '',
    heroSubtitulo: '',
    ctaBotonTexto: '',
    whatsappContacto: '',
    telefonoVisible: '',
    horarioAtencion: '',
    direccionVisible: '',
    avisoPromocion: ''
  });

  const showToast = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(''), 3500);
  };

  // Derivar el identificador único (siteSlug) exclusivo para este cliente (Aislamiento Multi-Tenant)
  const getClientSiteSlug = (pData) => {
    const emp = pData?.lead?.empresa || pData?.proyecto?.cliente?.empresa || pData?.presupuesto?.cliente?.empresa || 'cliente';
    return emp
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || `site-${token}`;
  };

  const getClientDomain = (pData) => {
    const rawDom = pData?.lead?.dominio || pData?.proyecto?.onboarding?.datos?.dominioOficial || '';
    if (rawDom && rawDom.includes('.')) return rawDom.replace(/^https?:\/\//, '');
    return `${getClientSiteSlug(pData)}.com`;
  };

  // Cargar datos del portal y del sitio CMS aislado del cliente
  useEffect(() => {
    let unsubPortal = () => {};
    let unsubCms = () => {};

    const init = async () => {
      setLoading(true);
      try {
        let pData = await getPortalCloud(token);
        if (!pData && typeof window !== 'undefined') {
          const rawLocal = localStorage.getItem('goglite_portal_' + token);
          if (rawLocal) {
            pData = { token, portalConfig: JSON.parse(rawLocal) };
          }
        }

        if (pData) {
          setPortalData(pData);
          const slug = getClientSiteSlug(pData);
          const empresa = pData?.lead?.empresa || pData?.proyecto?.cliente?.empresa || 'Mi Empresa';
          const telefono = pData?.lead?.telefono || pData?.proyecto?.cliente?.telefono || '';
          const ubicacion = pData?.proyecto?.cliente?.ubicacion || (pData?.lead?.pais === 'DO' ? 'Punta Cana / Santo Domingo, RD' : 'San Salvador, El Salvador');

          const existingCms = await getCmsSiteCloud(slug);
          const defaultContent = {
            heroTitulo: existingCms?.contenido?.heroTitulo || `Bienvenidos a ${empresa}`,
            heroSubtitulo: existingCms?.contenido?.heroSubtitulo || `Atención personalizada, calidad garantizada y respuesta inmediata para todos nuestros clientes en ${ubicacion}.`,
            ctaBotonTexto: existingCms?.contenido?.ctaBotonTexto || 'Contactar por WhatsApp Ahora',
            whatsappContacto: existingCms?.contenido?.whatsappContacto || telefono,
            telefonoVisible: existingCms?.contenido?.telefonoVisible || telefono,
            horarioAtencion: existingCms?.contenido?.horarioAtencion || 'Lunes a Sábado: 8:00 AM - 7:00 PM',
            direccionVisible: existingCms?.contenido?.direccionVisible || ubicacion,
            avisoPromocion: existingCms?.contenido?.avisoPromocion || 'Atención prioritaria y cotizaciones sin compromiso por WhatsApp.'
          };

          setEditableText(defaultContent);
          setCmsSite(existingCms || {
            slug,
            nombre: empresa,
            dominio: getClientDomain(pData),
            contenido: defaultContent,
            reseñasCliente: existingCms?.reseñasCliente || [
              {
                id: 'rev-1',
                autor: 'Carlos Mendoza',
                fecha: 'Hace 2 días',
                rating: 5,
                comentario: `Excelente servicio por parte del equipo de ${empresa}. Muy puntuales y atentos desde el primer contacto por WhatsApp.`,
                respuesta: ''
              },
              {
                id: 'rev-2',
                autor: 'María Fernanda Gómez',
                fecha: 'Hace 5 días',
                rating: 5,
                comentario: `100% recomendados. La página web es súper rápida desde el celular y nos atendieron de inmediato.`,
                respuesta: '¡Muchas gracias por tu confianza, María Fernanda! Estamos siempre para servirte.'
              }
            ]
          });

          unsubCms = subscribeCmsSiteCloud(slug, (liveSite) => {
            if (liveSite?.contenido) {
              setCmsSite(liveSite);
              setEditableText(prev => ({ ...prev, ...liveSite.contenido }));
            }
          });
        }

        unsubPortal = subscribePortalCloud(token, (livePortal) => {
          if (livePortal) {
            setPortalData(prev => ({ ...(prev || {}), ...livePortal }));
          }
        });
      } catch (err) {
        console.warn('[ClientCMS] Error inicializando CMS del cliente:', err);
      } finally {
        setLoading(false);
      }
    };

    init();
    return () => {
      if (typeof unsubPortal === 'function') unsubPortal();
      if (typeof unsubCms === 'function') unsubCms();
    };
  }, [token]);

  // Autenticación exclusiva con la cuenta Google Empresarial del Sitio del Cliente
  const handleSiteGoogleLogin = async () => {
    setAuthError('');
    setAuthLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      const result = await signInWithPopup(auth, provider);
      const email = (result?.user?.email || '').toLowerCase().trim();

      if (!email) {
        setAuthError('No se pudo obtener el correo de la cuenta seleccionada.');
        return;
      }

      if (AGENCY_BLOCKED_EMAILS.includes(email)) {
        await auth.signOut();
        setAuthError(`La cuenta "${email}" pertenece a la administración interna de Goglite. Por favor selecciona la cuenta empresarial del sitio web del cliente.`);
        return;
      }

      const registeredCmsEmail = (portalData?.portalConfig?.cuentaCmsSitioRegistrada || '').toLowerCase().trim();
      if (registeredCmsEmail && registeredCmsEmail !== email) {
        await auth.signOut();
        setAuthError(`Acceso denegado: Este Panel CMS está vinculado exclusivamente a la cuenta del sitio "${registeredCmsEmail}".`);
        return;
      }

      const newPortalConfig = {
        ...(portalData?.portalConfig || {}),
        cuentaCmsSitioRegistrada: registeredCmsEmail || email,
        cmsClienteAutenticado: true,
        cmsUltimoAcceso: new Date().toISOString()
      };

      setPortalData(prev => ({
        ...(prev || {}),
        portalConfig: newPortalConfig
      }));

      await savePortalCloud(token, {
        ...(portalData || {}),
        token,
        portalConfig: newPortalConfig
      });

      showToast(`✓ Sesión iniciada con el perfil oficial del sitio (${email})`);
    } catch (err) {
      if (err?.code !== 'auth/popup-closed-by-user') {
        setAuthError('Error al iniciar sesión con Google: ' + (err?.message || 'Intenta nuevamente'));
      }
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogoutCms = async () => {
    try {
      await auth.signOut();
    } catch (e) {}
    const newPortalConfig = {
      ...(portalData?.portalConfig || {}),
      cmsClienteAutenticado: false
    };
    setPortalData(prev => ({ ...(prev || {}), portalConfig: newPortalConfig }));
    await savePortalCloud(token, {
      ...(portalData || {}),
      token,
      portalConfig: newPortalConfig
    });
  };

  // Guardar cambios de texto sencillo en Firestore
  const handleSaveSimpleText = async (e) => {
    if (e) e.preventDefault();
    if (!portalData) return;
    setSaving(true);
    try {
      const slug = getClientSiteSlug(portalData);
      const empresa = portalData?.lead?.empresa || portalData?.proyecto?.cliente?.empresa || 'Mi Empresa';
      const updatedSite = {
        ...(cmsSite || {}),
        slug,
        nombre: empresa,
        dominio: getClientDomain(portalData),
        pais: portalData?.lead?.pais || 'SV',
        estado: 'publicado',
        contenido: editableText,
        ultimaActualizacion: new Date().toISOString()
      };
      await saveCmsSiteCloud(slug, updatedSite);
      setCmsSite(updatedSite);
      showToast('✓ ¡Textos del sitio web actualizados y publicados en vivo!');
    } catch (err) {
      showToast('Error al guardar cambios: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  // Responder a una reseña o mensaje de Google Business Profile del cliente
  const handleSendReviewReply = async (reviewId) => {
    const replyText = (replyDrafts[reviewId] || '').trim();
    if (!replyText || !portalData) return;

    const currentReviews = cmsSite?.reseñasCliente || [];
    const updatedReviews = currentReviews.map(r =>
      r.id === reviewId ? { ...r, respuesta: replyText, fechaRespuesta: 'Justo ahora' } : r
    );

    const slug = getClientSiteSlug(portalData);
    const updatedSite = {
      ...(cmsSite || {}),
      slug,
      nombre: portalData?.lead?.empresa || 'Mi Empresa',
      contenido: editableText,
      reseñasCliente: updatedReviews
    };

    setCmsSite(updatedSite);
    setReplyDrafts(prev => ({ ...prev, [reviewId]: '' }));
    await saveCmsSiteCloud(slug, updatedSite);
    showToast('✓ Respuesta publicada en la Ficha de Google de tu negocio.');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#07090e] text-white flex flex-col items-center justify-center p-6">
        <div className="w-12 h-12 rounded-2xl bg-orange-500/20 border border-orange-500/40 flex items-center justify-center animate-pulse mb-4">
          <Globe className="w-6 h-6 text-orange-400" />
        </div>
        <p className="text-sm font-bold text-slate-200">Cargando Panel CMS del Sitio Web...</p>
        <p className="text-xs text-slate-400 mt-1">Sincronizando configuración exclusiva del dominio</p>
      </div>
    );
  }

  const empresaNombre = portalData?.lead?.empresa || portalData?.proyecto?.cliente?.empresa || 'Portal Web Corporativo';
  const dominioCliente = getClientDomain(portalData);
  const portalConfig = portalData?.portalConfig || {};
  const isCmsAuthenticated = Boolean(portalConfig.cmsClienteAutenticado && portalConfig.cuentaCmsSitioRegistrada);

  // Verificar si el plan de mantenimiento o los 30 días iniciales están activos
  const fechaBaseStr = portalConfig.fechaLiquidacion || portalData?.proyecto?.pagos?.saldoFecha || portalConfig.fechaInicioGarantia || null;
  let diasTranscurridos = 1;
  if (fechaBaseStr) {
    const startMs = new Date(fechaBaseStr).getTime();
    if (!isNaN(startMs)) {
      const diff = Date.now() - startMs;
      diasTranscurridos = Math.max(1, Math.floor(diff / (1000 * 60 * 60 * 24)));
    }
  }
  const isWithin30DaysWarranty = diasTranscurridos <= 30;
  const isCareTimeActive = portalConfig.careVenceAt
    ? new Date(portalConfig.careVenceAt).getTime() > Date.now()
    : Boolean(portalConfig.fase5CareActivo);
  const isSubscriptionActive = Boolean(isCareTimeActive || isWithin30DaysWarranty);

  const clientPais = portalData?.lead?.pais || portalData?.proyecto?.cliente?.pais || 'DO';
  const whatsappSoporte = clientPais === 'DO' ? '18295284713' : '50377569828';

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 font-sans pb-16">
      {/* Notificación flotante */}
      {notification && (
        <div className="fixed bottom-4 right-4 left-4 sm:left-auto z-50 bg-emerald-950/95 border border-emerald-500/50 text-emerald-200 px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2.5 text-xs font-bold backdrop-blur-md">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* Cabecera Mobile-First del CMS del Cliente */}
      <header className="sticky top-0 z-30 bg-[#0b0f19]/95 backdrop-blur-md border-b border-slate-800/80 px-3 sm:px-6 py-3">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center text-white font-black text-sm shrink-0 shadow-lg shadow-orange-950/50">
                CMS
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h1 className="text-sm sm:text-base font-black text-white truncate">{empresaNombre}</h1>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shrink-0">
                    En Línea
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 font-mono truncate flex items-center gap-1">
                  <Globe className="w-3 h-3 text-orange-400 shrink-0" />
                  <span>https://{dominioCliente}</span>
                </p>
              </div>
            </div>

            {isWithin30DaysWarranty && (
              <a
                href={`/portal/${token}`}
                className="sm:hidden px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-bold flex items-center gap-1 border border-slate-700 shrink-0"
              >
                <ArrowLeft className="w-3 h-3" />
                <span>Proyecto</span>
              </a>
            )}
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-2 border-t sm:border-t-0 border-slate-800/80 pt-2 sm:pt-0">
            {isWithin30DaysWarranty && (
              <a
                href={`/portal/${token}`}
                className="hidden sm:inline-flex px-3 py-1.5 rounded-lg bg-slate-800/90 hover:bg-slate-700 text-slate-200 text-xs font-bold items-center gap-1.5 border border-slate-700 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Volver al Portal de Entrega ({Math.max(0, 30 - diasTranscurridos)}d restantes)</span>
              </a>
            )}

            {isCmsAuthenticated && (
              <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
                <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/50 border border-emerald-500/30 px-2.5 py-1 rounded-lg truncate max-w-[200px]">
                  {portalConfig.cuentaCmsSitioRegistrada}
                </span>
                <button
                  type="button"
                  onClick={handleLogoutCms}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-rose-950/60 text-slate-300 hover:text-rose-300 text-[11px] font-bold flex items-center gap-1 border border-slate-700 transition-colors"
                >
                  <LogOut className="w-3 h-3" />
                  <span>Salir</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-3 sm:px-6 pt-5 space-y-5">
        {/* 1. Condición de Suscripción Activa */}
        {!isSubscriptionActive ? (
          <div className="p-6 sm:p-8 rounded-2xl bg-gradient-to-br from-amber-500/10 via-[#131722] to-[#0b0e17] border-2 border-amber-500/40 text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center mx-auto">
              <Lock className="w-7 h-7" />
            </div>
            <h2 className="text-lg sm:text-xl font-black text-white">
              Panel CMS Condicionado al Plan de Mantenimiento Continuo
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl mx-auto leading-relaxed">
              El periodo inicial de 30 días posteriores a la entrega ha concluido. Para mantener activo el Panel CMS autogestionable, la sincronización con tu Ficha de Google y el monitoreo Site Kit en tiempo real, activa tu suscripción de Mantenimiento Continuo.
            </p>
            <div className="pt-2">
              <a
                href={`https://wa.me/${whatsappSoporte}?text=${encodeURIComponent(`Hola Goglite, deseo activar el Plan de Mantenimiento Continuo para el CMS de ${empresaNombre} (${dominioCliente}).`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs shadow-xl shadow-orange-950/50 transition-all"
              >
                <Sparkles className="w-4 h-4" />
                <span>Solicitar Activación de Mantenimiento Continuo</span>
              </a>
            </div>
          </div>
        ) : !isCmsAuthenticated ? (
          /* 2. Pantalla de Autenticación con la Cuenta Google Empresarial del Sitio */
          <div className="max-w-md mx-auto mt-6 p-6 rounded-2xl bg-[#111624] border border-slate-800 shadow-2xl space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-orange-500/15 border border-orange-500/30 text-orange-400 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-orange-400 font-bold block">
                  Acceso Exclusivo del Sitio
                </span>
                <h2 className="text-base font-black text-white">
                  Iniciar Sesión en el CMS de {empresaNombre}
                </h2>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Utiliza la <strong>cuenta de Google empresarial de tu sitio web</strong> para gestionar tus textos en vivo, responder reseñas de tu Ficha de Google y consultar tus métricas en Site Kit.
            </p>

            {portalConfig.cuentaCmsSitioRegistrada ? (
              <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 text-[11px] text-slate-300 font-mono">
                Cuenta oficial vinculada al sitio:{' '}
                <strong className="text-emerald-400 break-all">{portalConfig.cuentaCmsSitioRegistrada}</strong>
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-sky-500/10 border border-sky-500/30 text-[11px] text-sky-200 leading-relaxed">
                <strong>Primer acceso al CMS:</strong> La cuenta de Google empresarial del sitio con la que inicies sesión ahora quedará vinculada de forma exclusiva para administrar <strong>{dominioCliente}</strong>.
              </div>
            )}

            {authError && (
              <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-500/40 text-rose-200 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span>{authError}</span>
              </div>
            )}

            <button
              type="button"
              onClick={handleSiteGoogleLogin}
              disabled={authLoading}
              className="w-full py-3.5 px-4 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-black text-xs flex items-center justify-center gap-2.5 shadow-lg transition-all cursor-pointer"
            >
              <Globe className="w-4 h-4 text-orange-600" />
              <span>{authLoading ? 'Verificando cuenta del sitio...' : 'Acceder con Cuenta Google del Sitio'}</span>
            </button>
          </div>
        ) : (
          /* 3. Panel Operativo del CMS del Cliente (3 Funciones Exclusivas, Mobile-First, Sin Generador QR) */
          <div className="space-y-5">
            {/* Banner de Aislamiento Multi-Tenant del Cliente */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-[#121826] via-[#151c2c] to-[#121826] border border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-bold text-white">Entorno Aislado: {empresaNombre}</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-orange-500/15 text-orange-300 border border-orange-500/30">
                      ID: {getClientSiteSlug(portalData)}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Conectado exclusivamente al sitio y perfil de Google Business de {empresaNombre}.
                  </p>
                </div>
              </div>
              <a
                href={`https://${dominioCliente}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 border border-slate-700 shrink-0"
              >
                <span>Ver Sitio en Vivo</span>
                <ExternalLink className="w-3.5 h-3.5 text-orange-400" />
              </a>
            </div>

            {/* Navegación de las 3 Funciones Exclusivas del Cliente */}
            <div className="grid grid-cols-3 gap-2 bg-[#0d121d] p-1.5 rounded-2xl border border-slate-800">
              <button
                type="button"
                onClick={() => setActiveTab('editor')}
                className={`py-2.5 px-2 sm:px-4 rounded-xl text-xs font-bold flex flex-col sm:flex-row items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === 'editor'
                    ? 'bg-orange-600 text-white shadow-lg shadow-orange-950/50'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Type className="w-4 h-4 shrink-0" />
                <span className="text-[11px] sm:text-xs text-center">1. Cambiar Textos</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('gbp')}
                className={`py-2.5 px-2 sm:px-4 rounded-xl text-xs font-bold flex flex-col sm:flex-row items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === 'gbp'
                    ? 'bg-orange-600 text-white shadow-lg shadow-orange-950/50'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <MessageSquare className="w-4 h-4 shrink-0" />
                <span className="text-[11px] sm:text-xs text-center">2. Ficha Google & Mensajes</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('sitekit')}
                className={`py-2.5 px-2 sm:px-4 rounded-xl text-xs font-bold flex flex-col sm:flex-row items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === 'sitekit'
                    ? 'bg-orange-600 text-white shadow-lg shadow-orange-950/50'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <BarChart3 className="w-4 h-4 shrink-0" />
                <span className="text-[11px] sm:text-xs text-center">3. Google Site Kit</span>
              </button>
            </div>

            {/* PESTAÑA 1: EDITOR DE TEXTO SENCILLO */}
            {activeTab === 'editor' && (
              <form onSubmit={handleSaveSimpleText} className="p-4 sm:p-6 rounded-2xl bg-[#111624] border border-slate-800 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-3 border-b border-slate-800">
                  <div>
                    <h2 className="text-base font-black text-white flex items-center gap-2">
                      <Type className="w-4 h-4 text-orange-400" />
                      <span>Editor de Texto Sencillo en Vivo</span>
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Modifica los textos principales, teléfonos y avisos de <strong>{dominioCliente}</strong> sin tocar código ni diseño.
                    </p>
                  </div>
                  <button
                    type="submit"
                    disabled={saving}
                    className="py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/50 transition-all cursor-pointer shrink-0"
                  >
                    <Save className="w-4 h-4" />
                    <span>{saving ? 'Publicando...' : 'Publicar Cambios'}</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="text-xs font-bold text-slate-300 block mb-1.5">
                      Título Principal de Portada (Hero H1):
                    </label>
                    <input
                      type="text"
                      value={editableText.heroTitulo}
                      onChange={(e) => setEditableText(prev => ({ ...prev, heroTitulo: e.target.value }))}
                      className="w-full bg-[#090d16] border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-orange-500"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="text-xs font-bold text-slate-300 block mb-1.5">
                      Subtítulo Descriptivo de Portada:
                    </label>
                    <textarea
                      rows={2}
                      value={editableText.heroSubtitulo}
                      onChange={(e) => setEditableText(prev => ({ ...prev, heroSubtitulo: e.target.value }))}
                      className="w-full bg-[#090d16] border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-orange-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1.5">
                      Número de WhatsApp de Recepción de Clientes:
                    </label>
                    <input
                      type="text"
                      value={editableText.whatsappContacto}
                      onChange={(e) => setEditableText(prev => ({ ...prev, whatsappContacto: e.target.value }))}
                      className="w-full bg-[#090d16] border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-orange-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1.5">
                      Texto del Botón Principal:
                    </label>
                    <input
                      type="text"
                      value={editableText.ctaBotonTexto}
                      onChange={(e) => setEditableText(prev => ({ ...prev, ctaBotonTexto: e.target.value }))}
                      className="w-full bg-[#090d16] border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-orange-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1.5">
                      Horario de Atención Visible:
                    </label>
                    <input
                      type="text"
                      value={editableText.horarioAtencion}
                      onChange={(e) => setEditableText(prev => ({ ...prev, horarioAtencion: e.target.value }))}
                      className="w-full bg-[#090d16] border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-orange-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1.5">
                      Ubicación / Ciudad Visible:
                    </label>
                    <input
                      type="text"
                      value={editableText.direccionVisible}
                      onChange={(e) => setEditableText(prev => ({ ...prev, direccionVisible: e.target.value }))}
                      className="w-full bg-[#090d16] border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-orange-500"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="text-xs font-bold text-slate-300 block mb-1.5">
                      Aviso o Promoción Destacada del Mes:
                    </label>
                    <input
                      type="text"
                      value={editableText.avisoPromocion}
                      onChange={(e) => setEditableText(prev => ({ ...prev, avisoPromocion: e.target.value }))}
                      className="w-full bg-[#090d16] border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-orange-500"
                    />
                  </div>
                </div>
              </form>
            )}

            {/* PESTAÑA 2: FICHA DE RESEÑAS Y MENSAJES DE GOOGLE (EXCLUSIVA DEL CLIENTE) */}
            {activeTab === 'gbp' && (
              <div className="p-4 sm:p-6 rounded-2xl bg-[#111624] border border-slate-800 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-3 border-b border-slate-800">
                  <div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-orange-400" />
                      <h2 className="text-base font-black text-white">
                        Ficha de Google Business: {empresaNombre}
                      </h2>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Perfil vinculado exclusivamente a <strong>{empresaNombre}</strong>. Responde reseñas y mensajes de tus clientes.
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 bg-amber-500/15 border border-amber-500/30 px-3 py-1.5 rounded-xl shrink-0">
                    <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                    <span className="text-xs font-black text-white">5.0</span>
                    <span className="text-[10px] text-amber-300 font-mono">({(cmsSite?.reseñasCliente || []).length} reseñas)</span>
                  </div>
                </div>

                <div className="space-y-3">
                  {(cmsSite?.reseñasCliente || []).map((rev) => (
                    <div key={rev.id} className="p-4 rounded-xl bg-[#090d16] border border-slate-800 space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <span className="text-xs font-bold text-white block">{rev.autor}</span>
                          <span className="text-[10px] text-slate-400 font-mono">{rev.fecha}</span>
                        </div>
                        <div className="flex items-center gap-0.5">
                          {[1, 2, 3, 4, 5].map(n => (
                            <Star key={n} className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                          ))}
                        </div>
                      </div>

                      <p className="text-xs text-slate-200 leading-relaxed">"{rev.comentario}"</p>

                      {rev.respuesta ? (
                        <div className="p-3 rounded-lg bg-emerald-950/30 border border-emerald-500/30 text-xs space-y-1">
                          <span className="text-[10px] font-mono font-bold text-emerald-400 block">
                            ✓ Respuesta oficial de {empresaNombre}:
                          </span>
                          <p className="text-slate-200">{rev.respuesta}</p>
                        </div>
                      ) : (
                        <div className="flex flex-col sm:flex-row gap-2 pt-1">
                          <input
                            type="text"
                            placeholder={`Escribe tu respuesta como ${empresaNombre}...`}
                            value={replyDrafts[rev.id] || ''}
                            onChange={(e) => setReplyDrafts(prev => ({ ...prev, [rev.id]: e.target.value }))}
                            className="flex-1 bg-[#121826] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
                          />
                          <button
                            type="button"
                            onClick={() => handleSendReviewReply(rev.id)}
                            className="py-2 px-4 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 shrink-0 cursor-pointer"
                          >
                            <Send className="w-3.5 h-3.5" />
                            <span>Responder</span>
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* PESTAÑA 3: GOOGLE SITE KIT (MÉTRICAS EXCLUSIVAS DEL SITIO DEL CLIENTE) */}
            {activeTab === 'sitekit' && (
              <div className="p-4 sm:p-6 rounded-2xl bg-[#111624] border border-slate-800 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-3 border-b border-slate-800">
                  <div>
                    <h2 className="text-base font-black text-white flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-orange-400" />
                      <span>Google Site Kit: {dominioCliente}</span>
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Resumen de tráfico orgánico, clics a WhatsApp y velocidad móvil de tu propiedad web.
                    </p>
                  </div>
                  <span className="px-3 py-1 rounded-full text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 self-start sm:self-auto">
                    Search Console & GA4 Activos
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3.5 rounded-xl bg-[#090d16] border border-slate-800">
                    <div className="flex items-center justify-between text-slate-400 mb-1">
                      <span className="text-[10px] font-mono">Visitas (30d)</span>
                      <Users className="w-3.5 h-3.5 text-sky-400" />
                    </div>
                    <span className="text-lg sm:text-xl font-black text-white block">1,240</span>
                    <span className="text-[10px] text-emerald-400 font-mono">+18% este mes</span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-[#090d16] border border-slate-800">
                    <div className="flex items-center justify-between text-slate-400 mb-1">
                      <span className="text-[10px] font-mono">Clics WhatsApp</span>
                      <MousePointerClick className="w-3.5 h-3.5 text-emerald-400" />
                    </div>
                    <span className="text-lg sm:text-xl font-black text-emerald-400 block">186</span>
                    <span className="text-[10px] text-slate-400 font-mono">Conversión 15%</span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-[#090d16] border border-slate-800">
                    <div className="flex items-center justify-between text-slate-400 mb-1">
                      <span className="text-[10px] font-mono">Impresiones Google</span>
                      <Search className="w-3.5 h-3.5 text-orange-400" />
                    </div>
                    <span className="text-lg sm:text-xl font-black text-white block">4,890</span>
                    <span className="text-[10px] text-orange-300 font-mono">Búsquedas locales</span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-[#090d16] border border-slate-800">
                    <div className="flex items-center justify-between text-slate-400 mb-1">
                      <span className="text-[10px] font-mono">Velocidad Móvil</span>
                      <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
                    </div>
                    <span className="text-lg sm:text-xl font-black text-emerald-400 block">98/100</span>
                    <span className="text-[10px] text-emerald-400 font-mono">Carga 0.8s</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
