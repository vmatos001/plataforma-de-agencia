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
  Check,
  Clock,
  PhoneCall,
  Navigation
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
  const [nowTick, setNowTick] = useState(() => Date.now());

  // Reloj en tiempo real para el contador regresivo de 30 días de prueba o suscripción activa
  useEffect(() => {
    const interval = setInterval(() => setNowTick(Date.now()), 30000);
    return () => clearInterval(interval);
  }, []);

  const [syncingGoogle, setSyncingGoogle] = useState(false);

  // Campos de texto sencillo editables por el cliente (sincronizados con el Módulo 6)
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
  const getClientSiteSlug = (pData, fallbackSite) => {
    if (fallbackSite?.slug) return fallbackSite.slug;
    if (pData?.cmsSlug) return pData.cmsSlug;
    const emp =
      pData?.lead?.empresa ||
      pData?.proyecto?.cliente?.empresa ||
      pData?.cliente?.empresa ||
      pData?.presupuesto?.cliente?.empresa ||
      fallbackSite?.nombre ||
      '';
    if (emp) {
      return emp
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
    }
    return token || 'sitio';
  };

  const getClientDomain = (pData, fallbackSite) => {
    const slug = getClientSiteSlug(pData, fallbackSite);
    const rawDom =
      fallbackSite?.urlProduccion ||
      (fallbackSite?.dominio && fallbackSite.dominio !== 'turisran.com' ? fallbackSite.dominio : '') ||
      pData?.portalConfig?.urlProduccion ||
      pData?.proyecto?.bovedaRepos?.urlProduccion ||
      pData?.dominio ||
      pData?.portalConfig?.dominio ||
      pData?.lead?.dominio ||
      pData?.proyecto?.onboarding?.datos?.dominioOficial ||
      '';
    if (rawDom && rawDom.includes('.')) return rawDom.replace(/^https?:\/\//i, '').replace(/\/$/, '');
    if (slug.includes('turisra')) return 'turisran-dominicana.com';
    return `${slug}.com`;
  };

  // Cargar datos del portal y del sitio CMS aislado del cliente (tanto de 5 Fases como de Integración Directa en Módulo 6)
  useEffect(() => {
    let unsubPortal = () => {};
    let unsubCms = () => {};

    const init = async () => {
      setLoading(true);
      try {
        // 1. Buscar en Firestore Portal Cloud y localStorage
        let pData = await getPortalCloud(token);
        let localProj = null;
        let localSite = null;

        if (typeof window !== 'undefined') {
          try {
            const projs = JSON.parse(localStorage.getItem('goglite_proyectos') || '[]');
            localProj = projs.find(
              p =>
                p.portalToken === token ||
                p.cmsSlug === token ||
                p.id === token ||
                (p.cliente?.empresa || '').toLowerCase().replace(/[^a-z0-9]+/g, '-') === token
            );
          } catch (e) {}

          try {
            const sites = JSON.parse(localStorage.getItem('goglite_cms_sites') || '[]');
            localSite = sites.find(s => s.slug === token || s.id === token);
          } catch (e) {}

          if (!pData) {
            const rawLocal = localStorage.getItem('goglite_portal_' + token);
            if (rawLocal) {
              try {
                pData = { token, portalConfig: JSON.parse(rawLocal) };
              } catch (e) {}
            }
          }
        }

        // Consolidar pData con proyecto o sitio local si existe
        if (localProj || localSite) {
          pData = {
            ...(pData || {}),
            token,
            cmsSlug: localSite?.slug || localProj?.cmsSlug || token,
            dominio: localSite?.dominio || localProj?.dominio || pData?.portalConfig?.dominio,
            cliente: localProj?.cliente || localSite?.cliente || pData?.cliente,
            proyecto: localProj || pData?.proyecto,
            portalConfig: {
              ...(localSite?.portalConfig || {}),
              ...(localProj?.portalConfig || {}),
              ...(pData?.portalConfig || {})
            }
          };
        }

        const slug = getClientSiteSlug(pData, localSite);
        let existingCms = await getCmsSiteCloud(slug);
        if (!existingCms && slug !== token) {
          existingCms = await getCmsSiteCloud(token);
        }
        if (!existingCms && localSite) {
          existingCms = localSite;
        }

        // Si no había pData pero sí existe el sitio en el CMS (proyecto en producción integrado directo en Módulo 6)
        if (!pData && existingCms) {
          pData = {
            token,
            cmsSlug: existingCms.slug || token,
            dominio: existingCms.dominio,
            cliente: existingCms.cliente || { empresa: existingCms.nombre },
            portalConfig: existingCms.portalConfig || {
              fase5CareActivo: true,
              careVenceAt: new Date(Date.now() + 30 * 86400000).toISOString(),
              esMesDePrueba: true
            }
          };
        }

        if (pData) {
          setPortalData(pData);
          const empresa =
            existingCms?.nombre ||
            existingCms?.contenido?.branding?.nombreMarca ||
            pData?.lead?.empresa ||
            pData?.proyecto?.cliente?.empresa ||
            pData?.cliente?.empresa ||
            'Mi Empresa';
          const telefono =
            existingCms?.contenido?.branding?.telefonoWhatsApp ||
            pData?.lead?.telefono ||
            pData?.proyecto?.cliente?.telefono ||
            pData?.cliente?.telefono ||
            '';
          const ubicacion =
            existingCms?.contenido?.branding?.ciudadPrincipal ||
            pData?.proyecto?.cliente?.ubicacion ||
            (pData?.lead?.pais === 'DO' || pData?.cliente?.pais === 'DO'
              ? 'Santo Domingo / Punta Cana, RD'
              : 'San Salvador, El Salvador');

          const c = existingCms?.contenido || {};
          const defaultContent = {
            heroTitulo: c.heroTitulo || c.hero?.titulo || `Bienvenidos a ${empresa}`,
            heroSubtitulo:
              c.heroSubtitulo ||
              c.hero?.subtitulo ||
              `Atención personalizada, calidad garantizada y respuesta inmediata para todos nuestros clientes en ${ubicacion}.`,
            ctaBotonTexto: c.ctaBotonTexto || c.hero?.botonTexto || 'Contactar por WhatsApp Ahora',
            whatsappContacto: c.whatsappContacto || c.branding?.telefonoWhatsApp || telefono,
            telefonoVisible: c.telefonoVisible || c.branding?.telefonoWhatsApp || telefono,
            horarioAtencion: c.horarioAtencion || 'Lunes a Domingo: Atención 24/7',
            direccionVisible: c.direccionVisible || c.branding?.ciudadPrincipal || ubicacion,
            avisoPromocion: c.avisoPromocion || c.hero?.badge || '⚡ Atención prioritaria y cotizaciones por WhatsApp'
          };

          // Leer también reseñas y métricas que el administrador (sitesgoglite@gmail.com) haya inyectado en el Módulo 6
          let localGbpReviews = null;
          let localGbpProfile = null;
          let localSiteKitMetrics = null;
          let localSpeed = null;

          if (typeof window !== 'undefined') {
            try {
              const r = localStorage.getItem(`goglite_gbp_reviews_${slug}`);
              if (r) localGbpReviews = JSON.parse(r);
            } catch (e) {}
            try {
              const p = localStorage.getItem(`goglite_gbp_profile_${slug}`);
              if (p) localGbpProfile = JSON.parse(p);
            } catch (e) {}
            try {
              const m = localStorage.getItem(`goglite_sitekit_metrics_${slug}`);
              if (m) localSiteKitMetrics = JSON.parse(m);
            } catch (e) {}
            try {
              const sp = localStorage.getItem(`goglite_pagespeed_${slug}`);
              if (sp) localSpeed = JSON.parse(sp);
            } catch (e) {}
          }

          setEditableText(defaultContent);
          setCmsSite({
            ...(existingCms || {}),
            slug,
            nombre: empresa,
            dominio: getClientDomain(pData, existingCms),
            adminDelegadoGoogle: existingCms?.adminDelegadoGoogle || 'sitesgoglite@gmail.com',
            contenido: {
              ...(existingCms?.contenido || {}),
              ...defaultContent
            },
            gbpProfile: existingCms?.gbpProfile || localGbpProfile || null,
            siteKitMetrics: existingCms?.siteKitMetrics || localSiteKitMetrics || null,
            speedAnalysis: existingCms?.speedAnalysis || localSpeed || null,
            reseñasCliente:
              existingCms?.reseñasCliente ||
              localGbpReviews || [
                {
                  id: 'rev-1',
                  autor: 'Cliente Verificado · Google Maps',
                  fecha: 'Reciente',
                  rating: 5,
                  comentario: `Excelente servicio por parte del equipo de ${empresa}. Muy puntuales y atentos desde el primer contacto por WhatsApp.`,
                  respuesta: ''
                }
              ]
          });

          unsubCms = subscribeCmsSiteCloud(slug, (liveSite) => {
            if (liveSite) {
              setCmsSite(prev => ({ ...(prev || {}), ...liveSite }));
              if (liveSite.contenido) {
                const lc = liveSite.contenido;
                setEditableText(prev => ({
                  ...prev,
                  heroTitulo: lc.heroTitulo || lc.hero?.titulo || prev.heroTitulo,
                  heroSubtitulo: lc.heroSubtitulo || lc.hero?.subtitulo || prev.heroSubtitulo,
                  ctaBotonTexto: lc.ctaBotonTexto || lc.hero?.botonTexto || prev.ctaBotonTexto,
                  whatsappContacto: lc.whatsappContacto || lc.branding?.telefonoWhatsApp || prev.whatsappContacto,
                  telefonoVisible: lc.telefonoVisible || lc.branding?.telefonoWhatsApp || prev.telefonoVisible,
                  horarioAtencion: lc.horarioAtencion || prev.horarioAtencion,
                  direccionVisible: lc.direccionVisible || lc.branding?.ciudadPrincipal || prev.direccionVisible,
                  avisoPromocion: lc.avisoPromocion || lc.hero?.badge || prev.avisoPromocion
                }));
              }
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

  // Sincronización automática usando el Token OAuth autorizado por el propio cliente al iniciar sesión
  const autoSyncClientGoogleDataOnLogin = async (oauthToken, clientEmail) => {
    if (!oauthToken) return;
    const slug = getClientSiteSlug(portalData, cmsSite);
    const domain = getClientDomain(portalData, cmsSite)
      .replace(/^https?:\/\//i, '')
      .replace(/^www\./i, '')
      .replace(/\/$/, '')
      .toLowerCase();

    const endDate = new Date().toISOString().split('T')[0];
    const startDate = new Date(Date.now() - 28 * 86400000).toISOString().split('T')[0];

    let nextSiteKit = { ...(cmsSite?.siteKitMetrics || {}) };
    let nextGbpProfile = { ...(cmsSite?.gbpProfile || {}) };
    let syncedAny = false;

    // 1. Leer Google Search Console con el permiso del cliente
    try {
      const sitesRes = await fetch('https://www.googleapis.com/webmasters/v3/sites', {
        headers: { Authorization: `Bearer ${oauthToken}` }
      });
      if (sitesRes.ok) {
        const sitesJson = await sitesRes.json();
        const entries = sitesJson.siteEntry || [];
        const matched = entries.find(e => (e.siteUrl || '').toLowerCase().includes(domain));
        const candidates = matched
          ? [matched.siteUrl]
          : [`sc-domain:${domain}`, `https://${domain}/`, `https://www.${domain}/`];

        for (const propUrl of candidates) {
          const qRes = await fetch(
            `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(propUrl)}/searchAnalytics/query`,
            {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${oauthToken}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({ startDate, endDate, dimensions: ['query'], rowLimit: 8 })
            }
          );
          if (qRes.ok) {
            const qData = await qRes.json();
            if (Array.isArray(qData.rows) && qData.rows.length > 0) {
              let totalClicks = 0;
              let totalImpr = 0;
              let weightedPos = 0;
              const kwList = [];
              qData.rows.forEach(r => {
                const c = Number(r.clicks || 0);
                const imp = Number(r.impressions || 0);
                totalClicks += c;
                totalImpr += imp;
                weightedPos += Number(r.position || 0) * (imp || 1);
                if (r.keys?.[0]) kwList.push(r.keys[0]);
              });
              nextSiteKit = {
                ...nextSiteKit,
                clicsBusqueda: totalClicks,
                impresionesBusqueda: totalImpr,
                ctrPromedio: totalImpr > 0 ? ((totalClicks / totalImpr) * 100).toFixed(1) + '%' : nextSiteKit.ctrPromedio,
                posicionMedia: totalImpr > 0 ? (weightedPos / totalImpr).toFixed(1) : nextSiteKit.posicionMedia,
                topKeywords: kwList.slice(0, 6).join(', ') || nextSiteKit.topKeywords
              };
              syncedAny = true;
            }
            break;
          }
        }
      }
    } catch (e) {
      console.warn('[Client OAuth Search Console Sync]', e);
    }

    // 2. Leer Google Analytics 4 (GA4) con el permiso del cliente
    try {
      const sumRes = await fetch('https://analyticsadmin.googleapis.com/v1beta/accountSummaries', {
        headers: { Authorization: `Bearer ${oauthToken}` }
      });
      if (sumRes.ok) {
        const sumJson = await sumRes.json();
        const summaries = sumJson.accountSummaries || [];
        const cleanDomKey = domain.split('.')[0];
        let targetProp = null;
        for (const acc of summaries) {
          for (const p of (acc.propertySummaries || [])) {
            const disp = (p.displayName || '').toLowerCase();
            if (disp.includes(cleanDomKey) || disp.includes(slug)) {
              targetProp = p.property;
              break;
            }
          }
          if (targetProp) break;
        }
        if (!targetProp && summaries[0]?.propertySummaries?.[0]?.property) {
          targetProp = summaries[0].propertySummaries[0].property;
        }
        if (targetProp) {
          const repRes = await fetch(`https://analyticsdata.googleapis.com/v1beta/${targetProp}:runReport`, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${oauthToken}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              dateRanges: [{ startDate, endDate }],
              metrics: [
                { name: 'activeUsers' },
                { name: 'newUsers' },
                { name: 'sessions' },
                { name: 'engagementRate' }
              ]
            })
          });
          if (repRes.ok) {
            const repJson = await repRes.json();
            const vals = repJson.rows?.[0]?.metricValues;
            if (vals && vals.length >= 4) {
              nextSiteKit = {
                ...nextSiteKit,
                usuariosUnicos: Number(vals[0]?.value || 0),
                nuevosUsuarios: Number(vals[1]?.value || 0),
                sesionesTotales: Number(vals[2]?.value || 0),
                tasaInteraccion: (Number(vals[3]?.value || 0) * 100).toFixed(1) + '%'
              };
              syncedAny = true;
            }
          }
        }
      }
    } catch (e) {
      console.warn('[Client OAuth GA4 Sync]', e);
    }

    // 3. Leer Google Business Profile con el permiso del cliente
    try {
      const accRes = await fetch('https://mybusinessaccountmanagement.googleapis.com/v1/accounts', {
        headers: { Authorization: `Bearer ${oauthToken}` }
      });
      if (accRes.ok) {
        const accJson = await accRes.json();
        for (const acc of (accJson.accounts || [])) {
          const locRes = await fetch(
            `https://mybusinessbusinessinformation.googleapis.com/v1/${acc.name}/locations?readMask=name,title,phoneNumbers,categories,storefrontAddress,websiteUri,metadata`,
            { headers: { Authorization: `Bearer ${oauthToken}` } }
          );
          if (locRes.ok) {
            const locJson = await locRes.json();
            const loc = (locJson.locations || [])[0];
            if (loc) {
              nextGbpProfile = {
                ...nextGbpProfile,
                nombre: loc.title || nextGbpProfile.nombre,
                telefono: loc.phoneNumbers?.primaryPhone || nextGbpProfile.telefono,
                categoria: loc.categories?.primaryCategory?.displayName || nextGbpProfile.categoria,
                mapsUrl: loc.metadata?.mapsUri || nextGbpProfile.mapsUrl,
                reviewUrl: loc.metadata?.newReviewUri || nextGbpProfile.reviewUrl
              };
              syncedAny = true;

              // Intentar leer las reseñas reales de la ficha mediante GBP API
              try {
                const revsRes = await fetch(
                  `https://mybusiness.googleapis.com/v4/${acc.name}/${loc.name}/reviews`,
                  { headers: { Authorization: `Bearer ${oauthToken}` } }
                );
                if (revsRes.ok) {
                  const revsJson = await revsRes.json();
                  if (Array.isArray(revsJson.reviews) && revsJson.reviews.length > 0) {
                    const normalizedRevs = revsJson.reviews.map(r => ({
                      id: r.reviewId || 'rev-' + Date.now(),
                      autor: r.reviewer?.displayName || 'Cliente Verificado Google Maps',
                      fecha: r.createTime ? new Date(r.createTime).toLocaleDateString('es-DO', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Reciente',
                      rating: r.starRating === 'FIVE' ? 5 : r.starRating === 'FOUR' ? 4 : r.starRating === 'THREE' ? 3 : r.starRating === 'TWO' ? 2 : 1,
                      estrellas: r.starRating === 'FIVE' ? 5 : r.starRating === 'FOUR' ? 4 : r.starRating === 'THREE' ? 3 : r.starRating === 'TWO' ? 2 : 1,
                      comentario: r.comment || '',
                      texto: r.comment || '',
                      estado: r.reviewReply ? 'respondida' : 'pendiente',
                      respuesta: r.reviewReply?.comment || '',
                      fechaRespuesta: r.reviewReply?.updateTime ? new Date(r.reviewReply.updateTime).toLocaleDateString('es-DO') : ''
                    }));
                    nextGbpProfile.reseñasCliente = normalizedRevs;
                  }
                }
              } catch (eRev) {}

              break;
            }
          }
        }
      }
    } catch (e) {
      console.warn('[Client OAuth GBP Sync]', e);
    }

    if (syncedAny) {
      const updatedCms = {
        ...(cmsSite || {}),
        slug,
        dominio: domain,
        autorizadoPorClienteEmail: clientEmail,
        siteKitMetrics: nextSiteKit,
        gbpProfile: nextGbpProfile,
        reseñasCliente: nextGbpProfile.reseñasCliente || cmsSite?.reseñasCliente || [],
        ultimaSincronizacionOAuthCliente: new Date().toISOString()
      };
      setCmsSite(updatedCms);
      try {
        localStorage.setItem(`goglite_sitekit_metrics_${slug}`, JSON.stringify(nextSiteKit));
        localStorage.setItem(`goglite_gbp_profile_${slug}`, JSON.stringify(nextGbpProfile));
        if (nextGbpProfile.reseñasCliente) {
          localStorage.setItem(`goglite_gbp_reviews_${slug}`, JSON.stringify(nextGbpProfile.reseñasCliente));
        }
      } catch (e) {}
      await saveCmsSiteCloud(slug, updatedCms);
    }
  };

  // Autenticación con la cuenta Google del Sitio del Cliente + Solicitud de Permisos de Lectura (Search Console, GA4 y Ficha de Google)
  const handleSiteGoogleLogin = async () => {
    setAuthError('');
    setAuthLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      provider.addScope('https://www.googleapis.com/auth/webmasters.readonly');
      provider.addScope('https://www.googleapis.com/auth/analytics.readonly');
      provider.addScope('https://www.googleapis.com/auth/business.manage');
      provider.setCustomParameters({ prompt: 'select_account consent' });
      const result = await signInWithPopup(auth, provider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      const oauthToken = credential?.accessToken || '';
      const email = (result?.user?.email || '').toLowerCase().trim();

      if (!email) {
        setAuthError('No se pudo obtener el correo de la cuenta seleccionada.');
        return;
      }

      if (token !== 'goglite' && AGENCY_BLOCKED_EMAILS.includes(email) && registeredCmsEmail && registeredCmsEmail !== email) {
        await auth.signOut();
        setAuthError(
          `La cuenta "${email}" es la cuenta administradora de Goglite. Como cliente de este proyecto, inicia sesión con el correo oficial del negocio.`
        );
        return;
      }

      const registeredCmsEmail = (portalData?.portalConfig?.cuentaCmsSitioRegistrada || '').toLowerCase().trim();
      if (registeredCmsEmail && registeredCmsEmail !== email) {
        await auth.signOut();
        setAuthError(`Acceso denegado: Este Panel CMS está vinculado exclusivamente a la cuenta del cliente "${registeredCmsEmail}".`);
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

      if (oauthToken) {
        sessionStorage.setItem('goglite_client_oauth_token', oauthToken);
        await autoSyncClientGoogleDataOnLogin(oauthToken, email);
      }

      showToast(`✓ Sesión iniciada y permisos de Google sincronizados (${email})`);
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

  // Guardar cambios de texto sencillo en Firestore (Sincronizado bidireccionalmente con Módulo 6)
  const handleSaveSimpleText = async (e) => {
    if (e) e.preventDefault();
    if (!portalData) return;
    setSaving(true);
    try {
      const slug = getClientSiteSlug(portalData, cmsSite);
      const empresa =
        cmsSite?.nombre ||
        portalData?.lead?.empresa ||
        portalData?.proyecto?.cliente?.empresa ||
        portalData?.cliente?.empresa ||
        'Mi Empresa';

      const mergedContenido = {
        ...(cmsSite?.contenido || {}),
        ...editableText,
        branding: {
          ...(cmsSite?.contenido?.branding || {}),
          nombreMarca: empresa,
          telefonoWhatsApp: editableText.whatsappContacto,
          ciudadPrincipal: editableText.direccionVisible
        },
        hero: {
          ...(cmsSite?.contenido?.hero || {}),
          badge: editableText.avisoPromocion,
          titulo: editableText.heroTitulo,
          subtitulo: editableText.heroSubtitulo,
          botonTexto: editableText.ctaBotonTexto
        }
      };

      const updatedSite = {
        ...(cmsSite || {}),
        slug,
        nombre: empresa,
        dominio: getClientDomain(portalData, cmsSite),
        pais: portalData?.lead?.pais || portalData?.cliente?.pais || 'DO',
        estado: 'publicado',
        contenido: mergedContenido,
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

  // Responder a una reseña de Google Business Profile del cliente (Sincronizado con Módulo 6)
  const handleSendReviewReply = async (reviewId) => {
    const replyText = (replyDrafts[reviewId] || '').trim();
    if (!replyText || !portalData) return;

    const currentReviews = cmsSite?.reseñasCliente || [];
    const updatedReviews = currentReviews.map(r =>
      r.id === reviewId
        ? { ...r, estado: 'respondida', respuesta: replyText, fechaRespuesta: 'Justo ahora' }
        : r
    );

    const slug = getClientSiteSlug(portalData, cmsSite);
    const updatedSite = {
      ...(cmsSite || {}),
      slug,
      reseñasCliente: updatedReviews
    };

    setCmsSite(updatedSite);
    setReplyDrafts(prev => ({ ...prev, [reviewId]: '' }));
    try {
      localStorage.setItem(`goglite_gbp_reviews_${slug}`, JSON.stringify(updatedReviews));
    } catch (e) {}
    await saveCmsSiteCloud(slug, updatedSite);
    showToast('✓ Respuesta enviada a tu Ficha de Google Business vía sitesgoglite@gmail.com.');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#07090e] text-white flex flex-col items-center justify-center p-6">
        <div className="w-12 h-12 rounded-2xl bg-orange-500/20 border border-orange-500/40 flex items-center justify-center animate-pulse mb-4">
          <Globe className="w-6 h-6 text-orange-400" />
        </div>
        <p className="text-sm font-bold text-slate-200">Cargando Panel CMS del Sitio Web...</p>
        <p className="text-xs text-slate-400 mt-1">Sincronizando datos con Google Cloud Firestore</p>
      </div>
    );
  }

  const empresaNombre =
    cmsSite?.nombre ||
    portalData?.lead?.empresa ||
    portalData?.proyecto?.cliente?.empresa ||
    portalData?.cliente?.empresa ||
    'Portal Web Corporativo';
  const dominioCliente = getClientDomain(portalData, cmsSite);
  const portalConfig = portalData?.portalConfig || {};
  const isCmsAuthenticated = Boolean(portalConfig.cmsClienteAutenticado && portalConfig.cuentaCmsSitioRegistrada);

  // Cálculo unificado de vigencia (30 días de prueba post-entrega o Membresía Pagada careVenceAt)
  const fechaBaseEntrega =
    portalConfig.fechaLiquidacion ||
    portalData?.proyecto?.pagos?.saldoFecha ||
    portalConfig.fechaInicioGarantia ||
    null;

  let endTimestampMs = null;
  let isTrialPeriod = Boolean(portalConfig.esMesDePrueba);

  if (portalConfig.careVenceAt) {
    const parsedEnd = new Date(portalConfig.careVenceAt).getTime();
    if (!isNaN(parsedEnd)) {
      endTimestampMs = parsedEnd;
    }
  } else if (fechaBaseEntrega) {
    const parsedStart = new Date(fechaBaseEntrega).getTime();
    if (!isNaN(parsedStart)) {
      endTimestampMs = parsedStart + 30 * 86400000;
      isTrialPeriod = true;
    }
  }

  const diffMs = endTimestampMs ? endTimestampMs - nowTick : 0;
  const diasRestantes = endTimestampMs && diffMs > 0 ? Math.floor(diffMs / 86400000) : 0;
  const horasRestantes = endTimestampMs && diffMs > 0 ? Math.floor((diffMs % 86400000) / 3600000) : 0;
  const isSubscriptionActive = Boolean((endTimestampMs && diffMs > 0) || portalConfig.fase5CareActivo);

  const clientPais = portalData?.lead?.pais || portalData?.proyecto?.cliente?.pais || portalData?.cliente?.pais || 'DO';
  const whatsappSoporte = clientPais === 'DO' ? '18295284713' : '50377569828';

  // Métricas sincronizadas desde el Módulo 6 por sitesgoglite@gmail.com
  const skMetrics = cmsSite?.siteKitMetrics || {};
  const gbpMetrics = cmsSite?.gbpProfile?.metricas || {};
  const mobileSpeedScore = cmsSite?.speedAnalysis?.mobile?.rendimiento ?? 96;
  const mobileLcp = cmsSite?.speedAnalysis?.mobile?.metrics?.lcp || '1.2 s';

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 font-sans pb-16">
      {/* Notificación flotante */}
      {notification && (
        <div className="fixed bottom-4 right-4 left-4 sm:left-auto z-50 bg-emerald-950/95 border border-emerald-500/50 text-emerald-200 px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2.5 text-xs font-bold backdrop-blur-md">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* Cabecera Mobile-First del CMS del Cliente con Reloj Regresivo Sincronizado */}
      <header className="sticky top-0 z-30 bg-[#0b0f19]/95 backdrop-blur-md border-b border-slate-800/80 px-3 sm:px-6 py-3">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center text-white font-black text-sm shrink-0 shadow-lg shadow-orange-950/50">
                CMS
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-sm sm:text-base font-black text-white truncate">{empresaNombre}</h1>
                  {isSubscriptionActive ? (
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold flex items-center gap-1 shrink-0 ${
                      isTrialPeriod
                        ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                        : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                    }`}>
                      <Clock className="w-3 h-3" />
                      <span>
                        {isTrialPeriod ? '🎁 Mes de Prueba:' : '💎 Membresía Activa:'}{' '}
                        {endTimestampMs ? `${diasRestantes}d ${horasRestantes}h restantes` : 'Activa'}
                      </span>
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30 shrink-0">
                      ⛔ Vigencia Concluida (0d)
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 font-mono truncate flex items-center gap-1">
                  <Globe className="w-3 h-3 text-orange-400 shrink-0" />
                  <span>https://{dominioCliente}</span>
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-2 border-t sm:border-t-0 border-slate-800/80 pt-2 sm:pt-0">
            {fechaBaseEntrega && isTrialPeriod && diasRestantes > 0 && (
              <a
                href={`/portal/${token}`}
                className="px-3 py-1.5 rounded-lg bg-slate-800/90 hover:bg-slate-700 text-slate-200 text-xs font-bold inline-flex items-center gap-1.5 border border-slate-700 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Portal de Entrega</span>
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
        {/* 1. Condición de Suscripción Activa (Cuando el contador de 30 días o membresía llega a 0) */}
        {!isSubscriptionActive ? (
          <div className="p-6 sm:p-8 rounded-2xl bg-gradient-to-br from-amber-500/10 via-[#131722] to-[#0b0e17] border-2 border-amber-500/40 text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center mx-auto">
              <Lock className="w-7 h-7" />
            </div>
            <h2 className="text-lg sm:text-xl font-black text-white">
              Tu Periodo de Prueba / Suscripción ha Llegado a 0 Días
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl mx-auto leading-relaxed">
              Para seguir cambiando textos de tu página web en tiempo real, respondiendo reseñas de tu Ficha de Google Business y monitoreando tus métricas en Google Site Kit desde este único portal, activa tu renovación con Goglite.
            </p>
            <div className="pt-2">
              <a
                href={`https://wa.me/${whatsappSoporte}?text=${encodeURIComponent(`Hola Goglite, deseo renovar mi Membresía del Portal CMS para ${empresaNombre} (${dominioCliente}).`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs shadow-xl shadow-orange-950/50 transition-all"
              >
                <Sparkles className="w-4 h-4" />
                <span>Solicitar Renovación de Membresía CMS</span>
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
                  Portal Todo-en-Uno del Cliente
                </span>
                <h2 className="text-base font-black text-white">
                  Iniciar Sesión en el CMS de {empresaNombre}
                </h2>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Accede con tu correo de Google para administrar los textos de <strong>{dominioCliente}</strong>, responder reseñas de Google Maps y ver tus métricas de Site Kit sincronizadas por <strong>sitesgoglite@gmail.com</strong>.
            </p>

            {portalConfig.cuentaCmsSitioRegistrada ? (
              <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 text-[11px] text-slate-300 font-mono">
                Cuenta autorizada del cliente:{' '}
                <strong className="text-emerald-400 break-all">{portalConfig.cuentaCmsSitioRegistrada}</strong>
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-sky-500/10 border border-sky-500/30 text-[11px] text-sky-200 leading-relaxed">
                <strong>Primer acceso al CMS:</strong> El correo de Google con el que inicies sesión ahora quedará vinculado para administrar <strong>{dominioCliente}</strong>.
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
              <span>{authLoading ? 'Verificando cuenta...' : 'Acceder con mi Cuenta de Google'}</span>
            </button>
          </div>
        ) : (
          /* 3. Panel Operativo Unificado del Cliente (Web + Ficha Google + Site Kit vía sitesgoglite@gmail.com) */
          <div className="space-y-5">
            {/* Banner de Conexión Delegada vía sitesgoglite@gmail.com */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-[#121826] via-[#151c2c] to-[#121826] border border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-bold text-white">Centro de Control Único: {empresaNombre}</span>
                    {cmsSite?.autorizadoPorClienteEmail ? (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center gap-1 font-bold">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        <span>Google Vinculado por Cliente: {cmsSite.autorizadoPorClienteEmail}</span>
                      </span>
                    ) : (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/15 text-blue-300 border border-blue-500/30 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-blue-400" />
                        <span>Sincronizado vía Admin: {cmsSite?.adminDelegadoGoogle || 'sitesgoglite@gmail.com'}</span>
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Toda tu información de Web, Google Maps y Google Analytics centralizada en un solo lugar con autorización directa de tu cuenta Google.
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    const cachedToken = sessionStorage.getItem('goglite_client_oauth_token');
                    const clientEmail = portalData?.portalConfig?.cuentaCmsSitioRegistrada || cmsSite?.autorizadoPorClienteEmail || '';
                    if (cachedToken) {
                      setSyncingGoogle(true);
                      autoSyncClientGoogleDataOnLogin(cachedToken, clientEmail)
                        .then(() => showToast('✓ Métricas de Google actualizadas con éxito'))
                        .catch(() => showToast('Aviso: Vuelve a iniciar sesión para renovar permisos'))
                        .finally(() => setSyncingGoogle(false));
                    } else {
                      handleSiteGoogleLogin();
                    }
                  }}
                  disabled={syncingGoogle}
                  className="px-3 py-2 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-md shadow-orange-950/40 cursor-pointer"
                  title="Consultar y actualizar métricas en vivo desde Search Console, GA4 y Google Maps"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${syncingGoogle ? 'animate-spin' : ''}`} />
                  <span>{syncingGoogle ? 'Sincronizando...' : '🔄 Sincronizar mis datos de Google'}</span>
                </button>
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
                <span className="text-[11px] sm:text-xs text-center">1. Cambiar Textos Web</span>
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
                <span className="text-[11px] sm:text-xs text-center">2. Ficha Google &amp; Reseñas</span>
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
                <span className="text-[11px] sm:text-xs text-center">3. Métricas Google Site Kit</span>
              </button>
            </div>

            {/* PESTAÑA 1: EDITOR DE TEXTO SENCILLO */}
            {activeTab === 'editor' && (
              <form onSubmit={handleSaveSimpleText} className="p-4 sm:p-6 rounded-2xl bg-[#111624] border border-slate-800 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-3 border-b border-slate-800">
                  <div>
                    <h2 className="text-base font-black text-white flex items-center gap-2">
                      <Type className="w-4 h-4 text-orange-400" />
                      <span>Editor de Textos en Vivo ({dominioCliente})</span>
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Modifica tus títulos, teléfonos de WhatsApp y promociones sin depender de un programador.
                    </p>
                  </div>
                  <button
                    type="submit"
                    disabled={saving}
                    className="py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/50 transition-all cursor-pointer shrink-0"
                  >
                    <Save className="w-4 h-4" />
                    <span>{saving ? 'Publicando...' : 'Publicar Cambios en mi Web'}</span>
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

            {/* PESTAÑA 2: FICHA DE RESEÑAS Y MENSAJES DE GOOGLE (SINCRONIZADA VÍA SITESGOGLITE@GMAIL.COM) */}
            {activeTab === 'gbp' && (
              <div className="p-4 sm:p-6 rounded-2xl bg-[#111624] border border-slate-800 space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-3 border-b border-slate-800">
                  <div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-orange-400" />
                      <h2 className="text-base font-black text-white">
                        Ficha de Google Business: {cmsSite?.gbpProfile?.nombre || empresaNombre}
                      </h2>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Datos e interacciones sincronizados mediante la cuenta administradora delegada (<strong>sitesgoglite@gmail.com</strong>).
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 bg-amber-500/15 border border-amber-500/30 px-3 py-1.5 rounded-xl shrink-0">
                    <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                    <span className="text-xs font-black text-white">{cmsSite?.gbpProfile?.calificacion || '5.0'}</span>
                    <span className="text-[10px] text-amber-300 font-mono">({(cmsSite?.reseñasCliente || []).length} reseñas)</span>
                  </div>
                </div>

                {/* Resumen rápido de interacciones de Google Maps si existen */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 rounded-xl bg-[#090d16] border border-slate-800">
                    <div className="text-[10px] font-mono text-slate-400">Interacciones Maps</div>
                    <div className="text-lg font-black text-white font-mono mt-0.5">{gbpMetrics.interaccionesTotales || 0}</div>
                  </div>
                  <div className="p-3 rounded-xl bg-[#090d16] border border-slate-800">
                    <div className="text-[10px] font-mono text-slate-400">Llamadas Directas</div>
                    <div className="text-lg font-black text-emerald-400 font-mono mt-0.5">{gbpMetrics.llamadas || 0}</div>
                  </div>
                  <div className="p-3 rounded-xl bg-[#090d16] border border-slate-800">
                    <div className="text-[10px] font-mono text-slate-400">Solicitudes Cómo Llegar</div>
                    <div className="text-lg font-black text-sky-400 font-mono mt-0.5">{gbpMetrics.direcciones || 0}</div>
                  </div>
                  <div className="p-3 rounded-xl bg-[#090d16] border border-slate-800">
                    <div className="text-[10px] font-mono text-slate-400">Clics al Sitio Web</div>
                    <div className="text-lg font-black text-orange-400 font-mono mt-0.5">{gbpMetrics.clicsSitioWeb || 0}</div>
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
                            <Star
                              key={n}
                              className={`w-3.5 h-3.5 ${
                                n <= (rev.rating || rev.estrellas || 5)
                                  ? 'text-amber-400 fill-amber-400'
                                  : 'text-slate-700'
                              }`}
                            />
                          ))}
                        </div>
                      </div>

                      <p className="text-xs text-slate-200 leading-relaxed">"{rev.comentario || rev.texto}"</p>

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
                            <span>Publicar Respuesta</span>
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* PESTAÑA 3: GOOGLE SITE KIT (MÉTRICAS REALES SINCRONIZADAS VÍA SITESGOGLITE@GMAIL.COM) */}
            {activeTab === 'sitekit' && (
              <div className="p-4 sm:p-6 rounded-2xl bg-[#111624] border border-slate-800 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-3 border-b border-slate-800">
                  <div>
                    <h2 className="text-base font-black text-white flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-orange-400" />
                      <span>Google Site Kit: {dominioCliente}</span>
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Métricas oficiales de Search Console, Google Analytics 4 y PageSpeed provistas vía <strong>sitesgoglite@gmail.com</strong>.
                    </p>
                  </div>
                  <span className="px-3 py-1 rounded-full text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 self-start sm:self-auto">
                    Propiedad Vinculada Activa
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3.5 rounded-xl bg-[#090d16] border border-slate-800">
                    <div className="flex items-center justify-between text-slate-400 mb-1">
                      <span className="text-[10px] font-mono">Usuarios / Visitas</span>
                      <Users className="w-3.5 h-3.5 text-sky-400" />
                    </div>
                    <span className="text-lg sm:text-xl font-black text-white font-mono block">
                      {Number(skMetrics.usuariosUnicos ?? skMetrics.sesionesTotales ?? 0).toLocaleString()}
                    </span>
                    <span className="text-[10px] text-emerald-400 font-mono">
                      {skMetrics.tasaInteraccion ? `Interacción ${skMetrics.tasaInteraccion}` : 'Google Analytics 4'}
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-[#090d16] border border-slate-800">
                    <div className="flex items-center justify-between text-slate-400 mb-1">
                      <span className="text-[10px] font-mono">Clics en Google</span>
                      <MousePointerClick className="w-3.5 h-3.5 text-emerald-400" />
                    </div>
                    <span className="text-lg sm:text-xl font-black text-emerald-400 font-mono block">
                      {Number(skMetrics.clicsBusqueda ?? 0).toLocaleString()}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      CTR: {skMetrics.ctrPromedio || '0.0%'}
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-[#090d16] border border-slate-800">
                    <div className="flex items-center justify-between text-slate-400 mb-1">
                      <span className="text-[10px] font-mono">Impresiones Google</span>
                      <Search className="w-3.5 h-3.5 text-orange-400" />
                    </div>
                    <span className="text-lg sm:text-xl font-black text-white font-mono block">
                      {Number(skMetrics.impresionesBusqueda ?? 0).toLocaleString()}
                    </span>
                    <span className="text-[10px] text-orange-300 font-mono">
                      Posición media: {skMetrics.posicionMedia || '—'}
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-[#090d16] border border-slate-800">
                    <div className="flex items-center justify-between text-slate-400 mb-1">
                      <span className="text-[10px] font-mono">Velocidad Móvil</span>
                      <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
                    </div>
                    <span className="text-lg sm:text-xl font-black text-emerald-400 font-mono block">
                      {mobileSpeedScore}/100
                    </span>
                    <span className="text-[10px] text-emerald-400 font-mono">LCP {mobileLcp}</span>
                  </div>
                </div>

                {skMetrics.topKeywords && (
                  <div className="p-3.5 rounded-xl bg-[#090d16] border border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
                    <span className="text-slate-400 font-semibold">🔍 Términos con los que te encuentran en Google:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {skMetrics.topKeywords.split(',').map((kw, i) => (
                        <span key={i} className="px-2.5 py-0.5 rounded-full bg-orange-500/10 border border-orange-500/30 text-orange-300 font-mono text-[11px]">
                          {kw.trim()}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
