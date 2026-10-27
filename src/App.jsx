import React, { useState, useEffect, Suspense, lazy } from 'react';
import { 
  Search, 
  Sparkles, 
  Users, 
  Settings as SettingsIcon, 
  Zap, 
  ChevronRight, 
  ExternalLink, 
  Trash2,
  FileText,
  Layout,
  Kanban,
  DollarSign,
  Lock,
  PanelLeftClose,
  PanelLeftOpen,
  Globe,
  ShieldCheck,
  LogOut
} from 'lucide-react';
import AgencyWhiteLabelSettingsModal from './components/AgencyWhiteLabelSettingsModal';
import { DEFAULT_AGENCY_BRANDING } from './constants/defaultAgencyBranding';
import UserProfileModal from './components/UserProfileModal';
import LoginGatekeeper from './components/LoginGatekeeper';
import { signOutUser } from './services/firebase';
import { apiClient, subscribeToPlatformEvents } from './services/apiClient';
import {
  STORAGE_KEYS,
  getLocalItem,
  setLocalItem,
  clearAllPlatformData
} from './services/localStore';

// Code-Splitting (React.lazy) para carga ultrarrápida en dispositivos móviles
const PresupuestosContratosModule = lazy(() => import('./components/PresupuestosContratosModule'));
const MotorSeoQaModule = lazy(() => import('./components/MotorSeoQaModule'));
const CrmPortalModule = lazy(() => import('./components/CrmPortalModule'));
const GestionRentabilidadModule = lazy(() => import('./components/GestionRentabilidadModule'));
const HeadlessCmsHubModule = lazy(() => import('./components/HeadlessCmsHubModule'));
const CentroDesarrolloPrdModule = lazy(() => import('./components/CentroDesarrolloPrdModule'));
const PublicClientPortal = lazy(() => import('./components/PublicClientPortal'));
const ClientCmsPortal = lazy(() => import('./components/ClientCmsPortal'));
const ProspectorModule = lazy(() => import('./components/ProspectorModule'));

function ModuleLoadingFallback({ label = 'Cargando módulo...' }) {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-slate-300">
      <div className="w-10 h-10 rounded-xl bg-orange-500/20 border border-orange-500/40 flex items-center justify-center animate-pulse mb-3">
        <Zap className="w-5 h-5 text-orange-400" />
      </div>
      <span className="text-xs font-mono text-slate-400">{label}</span>
    </div>
  );
}

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error('[ErrorBoundary caught error]:', error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#080b11] text-slate-200 flex flex-col items-center justify-center p-6 text-center">
          <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center mb-4 text-rose-500">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">No se pudo cargar la vista</h2>
          <p className="text-xs text-slate-400 max-w-md mb-4 font-mono">
            {this.state.error?.message || 'Error inesperado al renderizar el componente.'}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-medium text-xs transition-all shadow-lg shadow-orange-500/20"
          >
            Recargar Página
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  const [clientPortalToken, setClientPortalToken] = useState(() => {
    if (typeof window !== 'undefined') {
      const match = window.location.pathname.match(/^\/portal\/([a-zA-Z0-9_-]+)/);
      return match ? match[1] : null;
    }
    return null;
  });

  const [clientCmsToken, setClientCmsToken] = useState(() => {
    if (typeof window !== 'undefined') {
      const match = window.location.pathname.match(/^\/cms-cliente\/([a-zA-Z0-9_-]+)/);
      return match ? match[1] : null;
    }
    return null;
  });

  const [activeModule, setActiveModule] = useState(() => {
    const saved = getLocalItem(STORAGE_KEYS.ACTIVE_MODULE);
    if (saved === 'contratos_onboarding') return 'presupuestos';
    if (saved === 'wireframes_storybrand') return 'desarrollo_prd';
    if (saved === 'seo_geo' || saved === 'seo_qa') return 'seo_motor';
    if (saved) return saved;
    return 'crm_portal';
  });

  const [prospectorSubTab, setProspectorSubTab] = useState('buscar');
  const [selectedCountry, setSelectedCountry] = useState('SV'); // 'SV' | 'DO'
  const [presupuestosInitialTab, setPresupuestosInitialTab] = useState('presupuestos');
  const [seoInitialTab, setSeoInitialTab] = useState('seo_geo');
  const [leadForPresupuesto, setLeadForPresupuesto] = useState(null);
  const [presupuestoForFactura, setPresupuestoForFactura] = useState(null);

  useEffect(() => {
    setLocalItem(STORAGE_KEYS.ACTIVE_MODULE, activeModule);
  }, [activeModule]);

  // White-Label Agency Settings State
  const [agencySettings, setAgencySettings] = useState(() => {
    const defaultSettings = {
      ...DEFAULT_AGENCY_BRANDING
    };

    const stored = getLocalItem(STORAGE_KEYS.AGENCY_SETTINGS, null);
    const storedLogo = typeof window !== 'undefined' ? localStorage.getItem('goglite_agency_logo') : null;
    const storedLogoDocs = typeof window !== 'undefined' ? localStorage.getItem('goglite_agency_logo_docs') : null;

    if (stored && typeof stored === 'object') {
      return {
        ...defaultSettings,
        ...stored,
        logoUrl: stored.logoUrl || storedLogo || defaultSettings.logoUrl,
        logoDocumentosUrl: stored.logoDocumentosUrl || storedLogoDocs || defaultSettings.logoDocumentosUrl || ''
      };
    }

    if (storedLogo || storedLogoDocs) {
      if (storedLogo) defaultSettings.logoUrl = storedLogo;
      if (storedLogoDocs) defaultSettings.logoDocumentosUrl = storedLogoDocs;
      return defaultSettings;
    }
    return defaultSettings;
  });
  const [showAgencySettingsModal, setShowAgencySettingsModal] = useState(false);

  // Users & Role-Based Authentication State (RBAC) - Solo Administrador Maestro Activo
  const defaultMasterAdmin = {
    id: 'user-admin-victor',
    nombre: 'Víctor Matos',
    email: 'sitesgoglite@gmail.com',
    secondaryEmail: 'victor@goglite.com',
    cargo: 'CEO & Director General',
    rol: 'admin',
    avatar: 'VM',
    mfaActivo: true,
    totpKeySecret: 'JBSWY3DPEHPK3PXP',
    permisos: ['all']
  };

  const [currentUser, setCurrentUser] = useState(() => {
    return getLocalItem(STORAGE_KEYS.CURRENT_USER, defaultMasterAdmin);
  });

  const [usersList, setUsersList] = useState([defaultMasterAdmin]);
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Protocolo de Seguridad de Sesiones (NIST SP 800-63B / OWASP)
  const SESSION_POLICIES = {
    ABSOLUTE_LIFETIME_MS: 8 * 60 * 60 * 1000, // 8 horas máximas continuas
    IDLE_TIMEOUT_ADMIN_MS: 15 * 60 * 1000,    // 15 minutos sin actividad para Administrador
    IDLE_TIMEOUT_COLAB_MS: 30 * 60 * 1000,    // 30 minutos sin actividad para Colaboradores
    ACTIVITY_THROTTLE_MS: 15 * 1000,          // Throttling de registro de actividad (15s)
    CHECK_INTERVAL_MS: 10 * 1000              // Intervalo de evaluación de estado (10s)
  };

  const [sessionExpiredNotice, setSessionExpiredNotice] = useState('');

  // Gatekeeper de Seguridad: Verificación de sesión con Google OAuth + MFA Authenticator
  const [isAuthenticatedSession, setIsAuthenticatedSession] = useState(() => {
    try {
      if (typeof window !== 'undefined') {
        const stored = sessionStorage.getItem('goglite_auth_session');
        if (stored) {
          const parsed = JSON.parse(stored);
          const now = Date.now();
          const loginTime = parsed?.loginTimestamp || now;
          const lastActivity = parsed?.lastActivityTimestamp || now;
          const isAdmin = parsed?.rol === 'admin' || parsed?.email === 'sitesgoglite@gmail.com' || parsed?.email === 'victor@goglite.com';
          const idleLimit = isAdmin ? 15 * 60 * 1000 : 30 * 60 * 1000;

          // Si superó la jornada de 8h o el límite de inactividad, invalidar de inmediato
          if (now - loginTime > 8 * 60 * 60 * 1000 || now - lastActivity > idleLimit) {
            sessionStorage.removeItem('goglite_auth_session');
            return false;
          }

          if (parsed?.mfaVerified && (parsed?.email === 'sitesgoglite@gmail.com' || parsed?.email === 'victor@goglite.com' || parsed?.email)) {
            return true;
          }
        }
      }
    } catch {}
    return false;
  });

  const handleLoginSuccess = (user) => {
    setSessionExpiredNotice('');
    setCurrentUser(user);
    setLocalItem(STORAGE_KEYS.CURRENT_USER, user);
    setIsAuthenticatedSession(true);
  };

  const handleLogout = async (expiredMessage = '') => {
    try {
      await signOutUser();
    } catch {}
    try {
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('goglite_auth_session');
      }
    } catch {}
    if (expiredMessage) {
      setSessionExpiredNotice(expiredMessage);
    }
    setIsAuthenticatedSession(false);
  };

  // Protocolo de Sesión Activa: Auditoría de Inactividad y Duración Absoluta
  useEffect(() => {
    if (!isAuthenticatedSession) return;

    const getStoredSession = () => {
      try {
        const raw = sessionStorage.getItem('goglite_auth_session');
        return raw ? JSON.parse(raw) : null;
      } catch {
        return null;
      }
    };

    const session = getStoredSession();
    if (!session) return;

    const isAdmin = currentUser?.rol === 'admin' || session?.email === 'sitesgoglite@gmail.com' || session?.email === 'victor@goglite.com';
    const idleLimit = isAdmin ? SESSION_POLICIES.IDLE_TIMEOUT_ADMIN_MS : SESSION_POLICIES.IDLE_TIMEOUT_COLAB_MS;
    const idleMinutes = isAdmin ? 15 : 30;

    let lastRecordedActivity = session.lastActivityTimestamp || Date.now();

    const handleUserInteraction = () => {
      const now = Date.now();
      if (now - lastRecordedActivity > SESSION_POLICIES.ACTIVITY_THROTTLE_MS) {
        lastRecordedActivity = now;
        try {
          const current = getStoredSession();
          if (current) {
            current.lastActivityTimestamp = now;
            sessionStorage.setItem('goglite_auth_session', JSON.stringify(current));
          }
        } catch {}
      } else {
        lastRecordedActivity = now;
      }
    };

    const monitoredEvents = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];
    monitoredEvents.forEach(evt => window.addEventListener(evt, handleUserInteraction, { passive: true }));

    const sessionWatcher = setInterval(() => {
      const now = Date.now();
      const current = getStoredSession();
      if (!current) return;

      const loginTime = current.loginTimestamp || now;
      const activityTime = current.lastActivityTimestamp || lastRecordedActivity;

      // 1. Verificación de Duración Absoluta (8 Horas)
      if (now - loginTime > SESSION_POLICIES.ABSOLUTE_LIFETIME_MS) {
        handleLogout('Tu jornada de sesión segura (8 horas) ha concluido. Por favor, inicia sesión nuevamente.');
        return;
      }

      // 2. Verificación de Inactividad (15 min Admin / 30 min Colaborador)
      if (now - activityTime > idleLimit) {
        handleLogout(`Sesión suspendida por inactividad (${idleMinutes} minutos sin interacción). Valida tus credenciales para continuar.`);
        return;
      }
    }, SESSION_POLICIES.CHECK_INTERVAL_MS);

    return () => {
      monitoredEvents.forEach(evt => window.removeEventListener(evt, handleUserInteraction));
      clearInterval(sessionWatcher);
    };
  }, [isAuthenticatedSession, currentUser]);

  // Sidebar Collapsed State
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    return getLocalItem(STORAGE_KEYS.SIDEBAR_COLLAPSED, false);
  });

  const toggleSidebar = () => {
    setIsSidebarCollapsed(prev => {
      const next = !prev;
      setLocalItem(STORAGE_KEYS.SIDEBAR_COLLAPSED, next);
      return next;
    });
  };

  useEffect(() => {
    fetchAgencySettings();
    fetchUsers();

    // Suscripción al Canal SSE en Tiempo Real (Server-Sent Events)
    const unsubscribeSSE = subscribeToPlatformEvents((event) => {
      if (!event || !event.type) return;

      if (event.type === 'budget:created' || event.type === 'budget:updated') {
        window.dispatchEvent(new CustomEvent('goglite_presupuestos_updated', { detail: event.payload }));
      }

      if (event.type === 'crm:created' || event.type === 'crm:updated' || event.type === 'crm:deleted') {
        window.dispatchEvent(new CustomEvent('goglite_crm_updated', { detail: event.payload }));
      }
    });

    // Sincronización reactiva en tiempo real al actualizar ajustes
    const handleSettingsUpdated = (e) => {
      if (e.detail && typeof e.detail === 'object') {
        setAgencySettings(prev => ({
          ...prev,
          ...e.detail,
          logoUrl: e.detail.logoUrl || prev.logoUrl
        }));
      }
    };
    window.addEventListener('goglite_agency_settings_updated', handleSettingsUpdated);
    return () => {
      unsubscribeSSE();
      window.removeEventListener('goglite_agency_settings_updated', handleSettingsUpdated);
    };
  }, []);

  const fetchAgencySettings = async () => {
    try {
      const res = await apiClient.get('/api/agency/settings');
      const cType = res.headers.get('content-type') || '';
      // Validar estrictamente que sea JSON del backend y no la plantilla HTML de Vite
      if (res.ok && cType.includes('application/json')) {
        const data = await res.json();
        if (data && typeof data === 'object') {
          const storedLogo = localStorage.getItem('goglite_agency_logo');
          const storedLogoDocs = localStorage.getItem('goglite_agency_logo_docs');
          const merged = {
            ...data,
            logoUrl: data.logoUrl || storedLogo || DEFAULT_AGENCY_BRANDING.logoUrl,
            logoDocumentosUrl: data.logoDocumentosUrl || storedLogoDocs || ''
          };
          setAgencySettings(merged);
          setLocalItem(STORAGE_KEYS.AGENCY_SETTINGS, merged);
        }
      }
    } catch {
      console.warn('[App] Usando configuración de agencia local persistida');
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await apiClient.get('/api/users');
      const cType = res.headers.get('content-type') || '';
      if (res.ok && cType.includes('application/json')) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          // Filtrar colaboradores de prueba y asegurar que Víctor Matos esté con sus datos correctos
          const cleaned = data.filter(u => u.id !== 'user-colab-carlos' && u.id !== 'user-colab-sofia');
          setUsersList(cleaned.length > 0 ? cleaned : [defaultMasterAdmin]);
        }
      }
    } catch {
      console.warn('[App] Usando lista de usuarios local persistida');
    }
  };

  const handleSaveAgencySettings = async (newSettings) => {
    try {
      setAgencySettings(newSettings);
      setLocalItem(STORAGE_KEYS.AGENCY_SETTINGS, newSettings);
      if (newSettings?.logoUrl) {
        try {
          localStorage.setItem('goglite_agency_logo', newSettings.logoUrl);
        } catch (e) {
          console.warn('[App] Error guardando logo en clave dedicada:', e);
        }
      }
      if (newSettings?.logoDocumentosUrl) {
        try {
          localStorage.setItem('goglite_agency_logo_docs', newSettings.logoDocumentosUrl);
        } catch (e) {
          console.warn('[App] Error guardando logo documentos en clave dedicada:', e);
        }
      }
      try {
        await apiClient.post('/api/agency/settings', newSettings);
      } catch {}
    } catch (err) {
      console.warn('[App] Guardado de ajustes local:', err.message);
    }
  };

  const handleSwitchUser = (user) => {
    setCurrentUser(user);
    setLocalItem(STORAGE_KEYS.CURRENT_USER, user);
    if (user.rol === 'colaborador' && activeModule === 'gestion_rentabilidad') {
      setActiveModule('desarrollo_prd');
    }
  };

  const handleCreateCollaborator = async (colabData) => {
    try {
      const res = await apiClient.post('/api/users/collaborator', colabData);
      if (res.ok) {
        const result = await res.json();
        if (result.user) {
          setUsersList(prev => [...prev, result.user]);
        }
      } else {
        const initials = colabData.nombre.split(' ').filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join('') || 'CO';
        const dummy = { ...colabData, id: `user-colab-${Date.now()}`, avatar: initials, mfaActivo: false };
        setUsersList(prev => [...prev, dummy]);
      }
    } catch {
      const initials = colabData.nombre.split(' ').filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join('') || 'CO';
      const dummy = { ...colabData, id: `user-colab-${Date.now()}`, avatar: initials, mfaActivo: false };
      setUsersList(prev => [...prev, dummy]);
    }
  };

  const handleDeleteCollaborator = async (userId) => {
    try {
      setUsersList(prev => prev.filter(u => u.id !== userId));
      await apiClient.delete(`/api/users/${userId}`);
    } catch (err) {
      console.warn('Delete colab local fallback:', err);
    }
  };

  const handleUpdateCurrentUser = async (updates) => {
    const updated = { ...currentUser, ...updates };
    setCurrentUser(updated);
    setLocalItem(STORAGE_KEYS.CURRENT_USER, updated);
    setUsersList(prev => prev.map(u => u.id === updated.id ? { ...u, ...updates } : u));
    try {
      await apiClient.patch(`/api/users/${updated.id}`, updates);
    } catch (err) {
      console.warn('Update user profile local save:', err);
    }
  };

  // Botón Maestro: Limpieza integral de datos de prueba para Fases 1 a 7
  const handleResetAllPlatformData = async () => {
    if (!window.confirm('¿Deseas LIMPIAR TODOS LOS DATOS de prueba de las Fases 1 a 7?\n\n' +
      '• Fase 1: Limpiará leads y búsquedas del Scrapper.\n' +
      '• Fase 2: Limpiará leads, contactos y chats del CRM.\n' +
      '• Fase 3: Limpiará presupuestos y contratos SOW.\n' +
      '• Fase 4: Limpiará tareas de desarrollo y repositorios PRD.\n' +
      '• Fase 5: Limpiará auditorías SEO/GEO y reportes Launch QA.\n' +
      '• Fase 6: Limpiará sitios del Hub Headless CMS.\n' +
      '• Fase 7: Limpiará facturas, gastos y registros de horas de Finanzas.\n\n' +
      '(Tus ajustes institucionales de marca blanca, perfil de usuario y claves API se mantendrán a salvo).')) {
      return;
    }

    try {
      clearAllPlatformData();

      try {
        await apiClient.post('/api/system/reset');
      } catch (err) {
        console.warn('[RESET] Aviso en llamada backend:', err.message);
      }

      setLeadForPresupuesto(null);
      setPresupuestoForFactura(null);

      alert('✓ Plataforma reseteada con éxito. Se reiniciará en la Fase 1 (Lead Scrapper) con un entorno limpio.');
      window.location.reload();
    } catch (e) {
      console.error('Error al resetear plataforma:', e);
    }
  };

  if (clientCmsToken) {
    return (
      <ErrorBoundary>
        <Suspense fallback={<ModuleLoadingFallback label="Cargando Panel CMS del Sitio Web..." />}>
          <ClientCmsPortal token={clientCmsToken} />
        </Suspense>
      </ErrorBoundary>
    );
  }

  if (clientPortalToken) {
    return (
      <ErrorBoundary>
        <Suspense fallback={<ModuleLoadingFallback label="Cargando Portal del Cliente..." />}>
          <PublicClientPortal
            token={clientPortalToken}
            agencySettings={agencySettings}
            onBackToAdmin={() => {
              window.history.pushState({}, '', '/');
              setClientPortalToken(null);
            }}
          />
        </Suspense>
      </ErrorBoundary>
    );
  }

  const handleUpdateUserMfa = (userId, mfaState = true) => {
    setUsersList(prev => prev.map(u => u.id === userId ? { ...u, mfaActivo: mfaState } : u));
    try {
      const stored = getLocalItem(STORAGE_KEYS.USERS, []);
      if (Array.isArray(stored) && stored.length > 0) {
        setLocalItem(STORAGE_KEYS.USERS, stored.map(u => u.id === userId ? { ...u, mfaActivo: mfaState } : u));
      }
    } catch {}
  };

  // Gatekeeper de Seguridad: Bloqueo de Acceso hasta validar Google OAuth + MFA Authenticator
  if (!isAuthenticatedSession) {
    return (
      <LoginGatekeeper
        usersList={usersList}
        agencySettings={agencySettings}
        onLoginSuccess={handleLoginSuccess}
        onUpdateUserMfa={handleUpdateUserMfa}
        sessionExpiredNotice={sessionExpiredNotice}
      />
    );
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-[#080b11] text-slate-100 flex flex-col selection:bg-orange-600 selection:text-white">
      {/* 1. TOP NAVIGATION BAR */}
      <header className="no-print h-16 border-b border-slate-800/80 bg-[#0c1017]/90 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-4">
          {/* Logo Badge Dinámico de Marca Blanca */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#090d16] border border-slate-700 flex items-center justify-center shrink-0 overflow-hidden shadow-glow-sm">
              {agencySettings.logoUrl ? (
                <img src={agencySettings.logoUrl} alt={agencySettings.nombreAgencia} className="max-w-full max-h-full object-contain p-0.5" />
              ) : (
                <span 
                  className="w-full h-full flex items-center justify-center font-black text-white text-base shadow-sm"
                  style={{ backgroundColor: agencySettings.colorPrimario || '#FF6B00' }}
                >
                  {(agencySettings.nombreAgencia || 'G')[0].toUpperCase()}
                </span>
              )}
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
                {agencySettings.nombreAgencia || 'Goglite'}
              </span>
            </div>
          </div>

        </div>

        {/* Right Header Options */}
        <div className="flex items-center gap-3">
          {/* Country Selector */}
          <div className="flex items-center bg-[#131926] border border-slate-800 rounded-lg p-0.5 text-xs">
            <button
              onClick={() => setSelectedCountry('SV')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md font-medium transition-all ${
                selectedCountry === 'SV' ? 'bg-orange-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>🇸🇻</span>
              <span>El Salvador</span>
            </button>
            <button
              onClick={() => setSelectedCountry('DO')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md font-medium transition-all ${
                selectedCountry === 'DO' ? 'bg-orange-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>🇩🇴</span>
              <span>Rep. Dominicana</span>
            </button>
          </div>

          {/* User Profile & Security */}
          <button
            onClick={() => setShowAuthModal(true)}
            className="flex items-center gap-2 pl-2 border-l border-slate-800 hover:opacity-90 transition-opacity text-left cursor-pointer"
            title="Mi Perfil, Contraseña & Google Authenticator 2FA"
          >
            <div className={`w-7 h-7 rounded-full border flex items-center justify-center text-xs font-bold ${
              currentUser.rol === 'admin' 
                ? 'bg-orange-500/20 border-orange-500 text-orange-400' 
                : 'bg-blue-500/20 border-blue-500 text-blue-400'
            }`}>
              {currentUser.avatar || 'VM'}
            </div>
            <div className="text-left hidden sm:block">
              <div className="text-xs font-semibold leading-tight text-slate-200 flex items-center gap-1.5">
                <span>{currentUser.nombre || 'Víctor Matos'}</span>
                <span className={`text-[8px] font-mono px-1 py-0.2 rounded font-bold uppercase ${
                  currentUser.rol === 'admin' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                }`}>
                  {currentUser.rol}
                </span>
              </div>
              <div className="text-[10px] text-slate-500 leading-tight">
                {currentUser.email || 'sitesgoglite@gmail.com'}
              </div>
            </div>
          </button>

          {/* Botón Cerrar Sesión */}
          <button
            type="button"
            onClick={handleLogout}
            className="p-1.5 rounded-lg bg-[#101522] hover:bg-rose-500/15 border border-slate-800 hover:border-rose-500/30 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
            title="Cerrar Sesión Segura"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* 2. BODY LAYOUT: SIDEBAR + MAIN CONTENT */}
      <div className="flex flex-1 overflow-hidden">
        {/* SIDEBAR COLAPSABLE */}
        <aside className={`no-print ${isSidebarCollapsed ? 'w-16 p-2' : 'w-56 p-3'} border-r border-slate-800/80 bg-[#0b0e16] flex flex-col justify-between shrink-0 transition-all duration-300 ease-in-out`}>
          <div className="space-y-3">
            <div className={`flex items-center pb-2 border-b border-slate-800/80 ${isSidebarCollapsed ? 'justify-center' : 'justify-between px-1'}`}>
              {!isSidebarCollapsed && (
                <div className="text-[10px] uppercase font-mono tracking-wider text-slate-500">
                  7 Fases de Agencia
                </div>
              )}
              <button
                onClick={toggleSidebar}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                title={isSidebarCollapsed ? "Expandir menú lateral" : "Ocultar menú lateral"}
              >
                {isSidebarCollapsed ? (
                  <PanelLeftOpen className="w-4 h-4 text-orange-400" />
                ) : (
                  <PanelLeftClose className="w-4 h-4 text-slate-400" />
                )}
              </button>
            </div>

            {/* Selector de Fases */}
            <div className="space-y-1">
              {/* Lead Scrapper */}
              <button
                onClick={() => setActiveModule('lead_scrapper')}
                title="Lead Scrapper (Outbound)"
                className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center p-2' : 'justify-between px-2.5 py-1.5'} rounded-lg text-xs font-semibold transition-all relative ${
                  activeModule === 'lead_scrapper'
                    ? 'bg-orange-600/20 text-orange-400 border border-orange-500/30'
                    : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Zap className="w-3.5 h-3.5" />
                  {!isSidebarCollapsed && <span>Lead Scrapper</span>}
                </div>
              </button>

              {/* CRM & WhatsApp */}
              <button
                onClick={() => setActiveModule('crm_portal')}
                title="CRM & WhatsApp Web"
                className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center p-2' : 'justify-between px-2.5 py-1.5'} rounded-lg text-xs font-semibold transition-all relative ${
                  activeModule === 'crm_portal'
                    ? 'bg-orange-600/20 text-orange-400 border border-orange-500/30'
                    : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Kanban className="w-3.5 h-3.5" />
                  {!isSidebarCollapsed && <span>CRM & WhatsApp</span>}
                </div>
              </button>

              {/* Presupuestos & Contratos */}
              <button
                onClick={() => {
                  setActiveModule('presupuestos');
                  setPresupuestosInitialTab('presupuestos');
                }}
                title="Presupuestos & Contratos SOW"
                className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center p-2' : 'justify-between px-2.5 py-1.5'} rounded-lg text-xs font-semibold transition-all relative ${
                  activeModule === 'presupuestos'
                    ? 'bg-orange-600/20 text-orange-400 border border-orange-500/30'
                    : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-2">
                  <FileText className="w-3.5 h-3.5" />
                  {!isSidebarCollapsed && <span>Presupuestos</span>}
                </div>
              </button>

              {/* Centro Desarrollo & PRD */}
              <button
                onClick={() => setActiveModule('desarrollo_prd')}
                title="Centro Desarrollo & PRD"
                className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center p-2' : 'justify-between px-2.5 py-1.5'} rounded-lg text-xs font-semibold transition-all relative ${
                  activeModule === 'desarrollo_prd'
                    ? 'bg-orange-600/20 text-orange-400 border border-orange-500/30'
                    : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Layout className="w-3.5 h-3.5" />
                  {!isSidebarCollapsed && <span>Desarrollo & PRD</span>}
                </div>
              </button>

              {/* Control de Calidad Launch QA */}
              <button
                onClick={() => {
                  setActiveModule('seo_motor');
                }}
                title="Launch QA & Control de Calidad"
                className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center p-2' : 'justify-between px-2.5 py-1.5'} rounded-lg text-xs font-semibold transition-all relative ${
                  activeModule === 'seo_motor'
                    ? 'bg-orange-600/20 text-orange-400 border border-orange-500/30'
                    : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  {!isSidebarCollapsed && <span>Launch QA & Calidad</span>}
                </div>
              </button>

              {/* Hub Headless CMS */}
              <button
                onClick={() => setActiveModule('headless_cms')}
                title="Hub Headless CMS"
                className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center p-2' : 'justify-between px-2.5 py-1.5'} rounded-lg text-xs font-semibold transition-all relative ${
                  activeModule === 'headless_cms'
                    ? 'bg-orange-600/20 text-orange-400 border border-orange-500/30'
                    : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Globe className="w-3.5 h-3.5" />
                  {!isSidebarCollapsed && <span>Headless CMS</span>}
                </div>
              </button>

              {/* Rentabilidad & P&L */}
              <button
                onClick={() => setActiveModule('gestion_rentabilidad')}
                title="Rentabilidad & P&L (Exclusivo Admin)"
                className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center p-2' : 'justify-between px-2.5 py-1.5'} rounded-lg text-xs font-semibold transition-all relative ${
                  activeModule === 'gestion_rentabilidad'
                    ? 'bg-orange-600/20 text-orange-400 border border-orange-500/30'
                    : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-2">
                  <DollarSign className="w-3.5 h-3.5" />
                  {!isSidebarCollapsed && <span>Rentabilidad & P&L</span>}
                </div>
              </button>
            </div>

            {/* Sub-nav for Lead Scrapper (cuando expandido) */}
            {!isSidebarCollapsed && activeModule === 'lead_scrapper' && (
              <nav className="space-y-1 pt-2 border-t border-slate-800/80">
                <div className="text-[10px] uppercase font-mono tracking-wider text-slate-500 px-1 mb-1">Scrapper Nav</div>
                <button
                  onClick={() => setProspectorSubTab('buscar')}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                    prospectorSubTab === 'buscar' 
                      ? 'bg-orange-600/15 text-orange-400 border border-orange-500/30' 
                      : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                  }`}
                >
                  <Search className="w-4 h-4" />
                  <span>Buscar</span>
                </button>

                <button
                  onClick={() => setProspectorSubTab('sugerencias')}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                    prospectorSubTab === 'sugerencias' 
                      ? 'bg-orange-600/15 text-orange-400 border border-orange-500/30' 
                      : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                  }`}
                >
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>Sugerencias Nichos</span>
                </button>

                <button
                  onClick={() => setProspectorSubTab('leads')}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                    prospectorSubTab === 'leads' 
                      ? 'bg-orange-600/15 text-orange-400 border border-orange-500/30' 
                      : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Users className="w-4 h-4" />
                    <span>Leads Guardados</span>
                  </div>
                </button>
              </nav>
            )}
          </div>

          {/* PARTE INFERIOR DEL SIDEBAR */}
          <div className="pt-2 border-t border-slate-800/80 space-y-2">
            {currentUser?.rol === 'admin' && (
              isSidebarCollapsed ? (
                <button
                  onClick={() => setShowAgencySettingsModal(true)}
                  className="w-10 h-10 mx-auto rounded-xl bg-slate-900/90 hover:bg-orange-500/15 text-orange-400 border border-slate-800 hover:border-orange-500/50 flex items-center justify-center transition-all shadow-sm"
                  title="Ajustes Globales de la Agencia (Solo Administrador)"
                >
                  <SettingsIcon className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={() => setShowAgencySettingsModal(true)}
                  className="w-full flex items-center justify-between px-2.5 py-2 rounded-xl bg-slate-900/90 hover:bg-orange-500/15 text-slate-300 hover:text-white border border-slate-800 hover:border-orange-500/50 text-xs font-semibold transition-all shadow-sm group"
                  title="Ajustes Globales de la Agencia (Solo Administrador)"
                >
                  <div className="flex items-center gap-2">
                    <SettingsIcon className="w-4 h-4 text-orange-400 group-hover:rotate-45 transition-transform" />
                    <span>Ajustes</span>
                  </div>
                  <span className="text-[9px] font-mono bg-orange-500/20 text-orange-400 border border-orange-500/30 px-1.5 py-0.2 rounded font-bold">
                    Admin
                  </span>
                </button>
              )
            )}

            <button
              onClick={toggleSidebar}
              className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center py-2' : 'gap-2 px-2.5 py-1.5'} rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-800/50 text-[11px] font-medium transition-colors`}
              title={isSidebarCollapsed ? "Expandir menú lateral" : "Ocultar menú lateral"}
            >
              {isSidebarCollapsed ? (
                <PanelLeftOpen className="w-4 h-4 text-slate-400" />
              ) : (
                <>
                  <PanelLeftClose className="w-3.5 h-3.5 text-slate-500" />
                  <span>Ocultar menú</span>
                </>
              )}
            </button>
          </div>
        </aside>

        {/* MAIN CONTENT AREA */}
        <main className="flex-1 overflow-y-auto p-6 bg-[#080b11]">
          <Suspense fallback={<ModuleLoadingFallback />}>
            {activeModule === 'presupuestos' ? (
              <PresupuestosContratosModule 
                selectedCountry={selectedCountry}
                leadToConvert={leadForPresupuesto}
                onClearLeadConvert={() => setLeadForPresupuesto(null)}
                initialTab={presupuestosInitialTab}
                agencySettings={agencySettings}
                onConvertToFactura={(presupuesto) => {
                  setPresupuestoForFactura(presupuesto);
                  setActiveModule('gestion_rentabilidad');
                }}
              />
            ) : activeModule === 'crm_portal' ? (
              <CrmPortalModule
                onConvertToPresupuesto={(lead) => {
                  setLeadForPresupuesto({
                    id: lead.id,
                    leadId: lead.leadId || lead.id,
                    portalToken: lead.portalToken,
                    presupuestoId: lead.presupuestoId,
                    nombreEmpresa: lead.empresa,
                    responsable: lead.contacto,
                    cargo: lead.cargo,
                    email: lead.email,
                    telefono: lead.telefono,
                    pais: lead.pais,
                    dominio: lead.dominio,
                    valorEstimado: lead.valorEstimado
                  });
                  setPresupuestosInitialTab('presupuestos');
                  setActiveModule('presupuestos');
                }}
              />
            ) : activeModule === 'desarrollo_prd' ? (
              <CentroDesarrolloPrdModule selectedCountry={selectedCountry} />
            ) : activeModule === 'seo_motor' ? (
              <MotorSeoQaModule
                selectedCountry={selectedCountry}
                initialTab={seoInitialTab}
              />
            ) : activeModule === 'headless_cms' ? (
              <HeadlessCmsHubModule
                onOpenInvoiceModal={(sub) => {
                  setActiveModule('gestion_rentabilidad');
                }}
              />
            ) : activeModule === 'gestion_rentabilidad' ? (
              currentUser?.rol !== 'admin' ? (
                <div className="p-8 max-w-2xl mx-auto my-12 text-center rounded-2xl bg-[#0f1422] border border-slate-800 space-y-4 shadow-2xl">
                  <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20">
                    <Lock className="w-8 h-8" />
                  </div>
                  <h2 className="text-xl font-bold text-slate-100">Acceso Restringido a Finanzas & Rentabilidad</h2>
                  <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                    El Módulo de Rentabilidad, P&L, Cuentas Bancarias y Nómina está reservado exclusivamente para usuarios con rol de <strong>Administrador (Víctor Matos)</strong>.
                  </p>
                  <div className="pt-2">
                    <button
                      onClick={() => setActiveModule('desarrollo_prd')}
                      className="px-5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-semibold text-xs shadow-md transition-all"
                    >
                      Volver a Centro de Desarrollo & PRD
                    </button>
                  </div>
                </div>
              ) : (
                <GestionRentabilidadModule
                  selectedCountry={selectedCountry}
                  presupuestoToBill={presupuestoForFactura}
                  onClearPresupuestoToBill={() => setPresupuestoForFactura(null)}
                  onNavigateToPresupuestos={() => {
                    setPresupuestosInitialTab('presupuestos');
                    setActiveModule('presupuestos');
                  }}
                />
              )
            ) : (
              <ProspectorModule
                selectedCountry={selectedCountry}
                activeSubTab={prospectorSubTab}
                onSubTabChange={(tab) => setProspectorSubTab(tab)}
                onConvertToPresupuesto={(lead) => {
                  setLeadForPresupuesto(lead);
                  setPresupuestosInitialTab('presupuestos');
                  setActiveModule('presupuestos');
                }}
                onNavigateToCrm={() => setActiveModule('crm_portal')}
                onNavigateToPresupuestos={() => {
                  setPresupuestosInitialTab('presupuestos');
                  setActiveModule('presupuestos');
                }}
              />
            )}
          </Suspense>
        </main>
      </div>

      {/* 4. MODALES GLOBALES DE AJUSTES DE AGENCIA Y PERFIL / SEGURIDAD */}
      <AgencyWhiteLabelSettingsModal
        isOpen={showAgencySettingsModal}
        onClose={() => setShowAgencySettingsModal(false)}
        agencySettings={agencySettings}
        onSaveAgencySettings={handleSaveAgencySettings}
        usersList={usersList}
        onCreateCollaborator={handleCreateCollaborator}
        onDeleteCollaborator={handleDeleteCollaborator}
      />

      <UserProfileModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        currentUser={currentUser}
        usersList={usersList}
        onSwitchUser={handleSwitchUser}
        onUpdateCurrentUser={handleUpdateCurrentUser}
        onLogout={handleLogout}
      />
    </div>
  </ErrorBoundary>
  );
}
