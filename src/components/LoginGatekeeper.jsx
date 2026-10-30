import React, { useState, useEffect, useRef } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  Smartphone, 
  AlertCircle, 
  CheckCircle2, 
  RefreshCw, 
  LogOut, 
  Copy, 
  Check, 
  QrCode,
  ArrowRight,
  Clock
} from 'lucide-react';
import { signInWithGoogle, signOutUser } from '../services/firebase';
import { DEFAULT_AGENCY_BRANDING } from '../constants/defaultAgencyBranding';
import { apiFetch, setSessionToken } from '../services/apiClient';

export default function LoginGatekeeper({
  agencySettings = null,
  onLoginSuccess,
  onUpdateUserMfa,
  sessionExpiredNotice = ''
}) {
  const [step, setStep] = useState('google'); // 'google' | 'mfa'
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const [googleUser, setGoogleUser] = useState(null);
  const [googleIdToken, setGoogleIdToken] = useState('');
  const [matchedAppUser, setMatchedAppUser] = useState(null);
  const [isMfaEnrolled, setIsMfaEnrolled] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  // Logo & Branding público de Agencia (C-09)
  const [imgError, setImgError] = useState(false);
  const [fetchedLogo, setFetchedLogo] = useState('');
  const [fetchedName, setFetchedName] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedDedicated = localStorage.getItem('goglite_agency_logo');
      if (storedDedicated) {
        setFetchedLogo(storedDedicated);
      }
      try {
        const storedSettings = JSON.parse(localStorage.getItem('goglite_agency_settings') || '{}');
        if (storedSettings?.logoUrl && !storedDedicated) {
          setFetchedLogo(storedSettings.logoUrl);
        }
        if (storedSettings?.nombreAgencia) {
          setFetchedName(storedSettings.nombreAgencia);
        }
      } catch {}
    }

    apiFetch('/api/agency/branding')
      .then(res => {
        const cType = res.headers.get('content-type') || '';
        return (res.ok && cType.includes('application/json')) ? res.json() : null;
      })
      .then(data => {
        if (data?.logoUrl) setFetchedLogo(data.logoUrl);
        if (data?.nombreAgencia) setFetchedName(data.nombreAgencia);
      })
      .catch(() => {});
  }, []);

  const rawLogo = agencySettings?.logoUrl || fetchedLogo || DEFAULT_AGENCY_BRANDING.logoUrl;
  const resolvedLogo = (!imgError && rawLogo) ? rawLogo : null;
  const agencyName = agencySettings?.nombreAgencia || fetchedName || DEFAULT_AGENCY_BRANDING.nombreAgencia || 'Goglite Digital Hub';

  // Estado MFA gestionado exclusivamente por el servidor (C-02, C-03, C-04)
  const [totpCode, setTotpCode] = useState('');
  const [verifyingMfa, setVerifyingMfa] = useState(false);
  const [mfaSuccess, setMfaSuccess] = useState(false);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState('');
  const [enrollmentSecret, setEnrollmentSecret] = useState('');
  const [copiedSecret, setCopiedSecret] = useState(false);
  const [loadingResyncQr, setLoadingResyncQr] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(30 - (Math.floor(Date.now() / 1000) % 30));
  const verifyingLockRef = useRef(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsLeft(30 - (Math.floor(Date.now() / 1000) % 30));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Paso 1: Iniciar Sesión con Google y validar token criptográficamente en el backend
  const handleGoogleSignIn = async () => {
    try {
      setLoadingGoogle(true);
      setErrorMessage('');
      const result = await signInWithGoogle();
      const user = result.user;

      if (!user || !user.email) {
        throw new Error('No se pudo obtener el correo de la cuenta de Google.');
      }

      const cleanEmail = user.email.trim().toLowerCase();
      const storedMfaSeal =
        (typeof window !== 'undefined' && (
          localStorage.getItem(`goglite_mfa_seal_${cleanEmail}`) ||
          localStorage.getItem('goglite_mfa_seal_default')
        )) || '';

      const idToken = await user.getIdToken();
      const checkRes = await apiFetch('/api/auth/google-check', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${idToken}`
        },
        body: { mfaSeal: storedMfaSeal }
      });

      const checkData = await checkRes.json().catch(() => ({}));
      if (!checkRes.ok) {
        await signOutUser();
        setErrorMessage(
          checkData.error ||
          `Acceso Denegado: La cuenta de Google (${user.email}) no está autorizada en Goglite Agency.`
        );
        setLoadingGoogle(false);
        return;
      }

      setGoogleUser(user);
      setGoogleIdToken(idToken);
      setMatchedAppUser(checkData.user);
      const enrolled = Boolean(checkData.mfaEnrolled);
      setIsMfaEnrolled(enrolled);

      // Si aún no tiene MFA enrolado, solicitar al backend el inicio de enrolamiento único (C-02, C-03)
      if (!enrolled) {
        const enrollRes = await apiFetch('/api/auth/2fa/enroll/start', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${idToken}`
          }
        });
        const enrollData = await enrollRes.json().catch(() => ({}));
        if (!enrollRes.ok) {
          throw new Error(enrollData.error || 'No se pudo iniciar el enrolamiento 2FA en el servidor.');
        }
        setQrCodeDataUrl(enrollData.qrCodeDataUrl || '');
        setEnrollmentSecret(enrollData.secret || '');
      } else {
        setQrCodeDataUrl('');
        setEnrollmentSecret('');
      }

      setStep('mfa');
    } catch (err) {
      if (err.code === 'auth/popup-closed-by-user') {
        setErrorMessage('La ventana de inicio de sesión con Google fue cerrada antes de completarse.');
      } else {
        setErrorMessage(`Error al autenticar con Google: ${err.message}`);
      }
    } finally {
      setLoadingGoogle(false);
    }
  };

  // Re-sincronizar / Mostrar el código QR único determinístico de esta cuenta
  const handleShowResyncQr = async () => {
    try {
      setLoadingResyncQr(true);
      setErrorMessage('');
      const freshIdToken = googleUser ? await googleUser.getIdToken() : googleIdToken;
      const enrollRes = await apiFetch('/api/auth/2fa/enroll/start', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${freshIdToken}`
        },
        body: { forceResync: true }
      });
      const enrollData = await enrollRes.json().catch(() => ({}));
      if (!enrollRes.ok) {
        throw new Error(enrollData.error || 'No se pudo obtener el código QR.');
      }
      setQrCodeDataUrl(enrollData.qrCodeDataUrl || '');
      setEnrollmentSecret(enrollData.secret || '');
      setIsMfaEnrolled(false);
    } catch (err) {
      setErrorMessage(`Error mostrando código QR: ${err.message}`);
    } finally {
      setLoadingResyncQr(false);
    }
  };

  // Paso 2: Verificar código TOTP de Google Authenticator exclusivamente en el backend (C-03, C-04)
  const handleVerifyTotp = async (e, explicitCode = null) => {
    if (e) e.preventDefault();
    if (verifyingLockRef.current || mfaSuccess) return;

    const code = String(explicitCode !== null ? explicitCode : totpCode).trim();
    if (code.length !== 6) {
      setErrorMessage('Ingresa los 6 dígitos del código de Google Authenticator.');
      return;
    }

    try {
      verifyingLockRef.current = true;
      setVerifyingMfa(true);
      setErrorMessage('');

      const freshIdToken = googleUser ? await googleUser.getIdToken() : googleIdToken;
      const endpoint = isMfaEnrolled ? '/api/auth/2fa/verify' : '/api/auth/2fa/enroll/confirm';

      const res = await apiFetch(endpoint, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${freshIdToken}`
        },
        body: { token: code }
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok && data.valid && data.user) {
        setMfaSuccess(true);
        setEnrollmentSecret('');
        setQrCodeDataUrl('');

        if (data.sessionToken) {
          setSessionToken(data.sessionToken);
        }

        if (data.mfaSeal && typeof window !== 'undefined') {
          const emailKey = (googleUser?.email || data.user.email || '').trim().toLowerCase();
          if (emailKey) {
            localStorage.setItem(`goglite_mfa_seal_${emailKey}`, data.mfaSeal);
          }
          localStorage.setItem('goglite_mfa_seal_default', data.mfaSeal);
        }

        if (onUpdateUserMfa && data.user.id) {
          onUpdateUserMfa(data.user.id, true);
        }

        setTimeout(() => {
          onLoginSuccess(data.user);
        }, 500);
      } else {
        setErrorMessage(
          data.error ||
          'Código incorrecto o expirado. Si tienes varios códigos antiguos en tu app, pulsa abajo "Sincronizar código QR único".'
        );
      }
    } catch (err) {
      setErrorMessage(`Error validando código en el servidor: ${err.message}`);
    } finally {
      verifyingLockRef.current = false;
      setVerifyingMfa(false);
    }
  };

  const handleSignOutAndReset = async () => {
    try {
      await signOutUser();
    } catch {}
    setGoogleUser(null);
    setGoogleIdToken('');
    setMatchedAppUser(null);
    setTotpCode('');
    setQrCodeDataUrl('');
    setEnrollmentSecret('');
    setErrorMessage('');
    setMfaSuccess(false);
    setStep('google');
  };

  const handleCopySecret = () => {
    if (!enrollmentSecret) return;
    navigator.clipboard.writeText(enrollmentSecret);
    setCopiedSecret(true);
    setTimeout(() => setCopiedSecret(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#070a10] px-4 selection:bg-orange-500 selection:text-white overflow-y-auto py-8">
      {/* Fondo de resplandor ambiental corporativo */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-orange-600/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 left-1/3 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="relative w-full max-w-md bg-[#0e1422] border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl space-y-6">
        
        {/* Encabezado de Marca */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#121929] border border-orange-500/30 text-orange-400 mb-1 shadow-lg shadow-orange-500/10 p-2 overflow-hidden">
            {resolvedLogo ? (
              <img 
                src={resolvedLogo} 
                alt={agencyName} 
                className="w-full h-full object-contain filter drop-shadow"
                onError={() => setImgError(true)}
              />
            ) : (
              <ShieldCheck className="w-7 h-7 stroke-[2.2]" />
            )}
          </div>
          <div className="space-y-0.5">
            <span className="text-[10px] font-mono font-bold tracking-widest uppercase text-orange-400 bg-orange-500/10 px-2.5 py-0.5 rounded-full border border-orange-500/20">
              {agencyName}
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Control de Acceso Seguro
            </h1>
            <p className="text-xs text-slate-400">
              Autenticación oficial de dos factores
            </p>
          </div>
        </div>

        {/* Notificación de Expiración de Sesión */}
        {sessionExpiredNotice && !errorMessage && (
          <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-start gap-2.5 animate-fade-in">
            <Clock className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
            <span className="leading-relaxed">{sessionExpiredNotice}</span>
          </div>
        )}

        {/* Mensaje de Error si ocurre */}
        {errorMessage && (
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5 animate-shake">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
            <span className="leading-relaxed">{errorMessage}</span>
          </div>
        )}

        {/* ======================================================== */}
        {/* PASO 1: INICIO DE SESIÓN CON GOOGLE                      */}
        {/* ======================================================== */}
        {step === 'google' && (
          <div className="space-y-4 animate-fade-in">
            <div className="p-4 rounded-2xl bg-[#121929] border border-slate-800/80 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-white">
                <Lock className="w-4 h-4 text-orange-400" />
                <span>Paso 1: Validación de Identidad Corporativa</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Ingresa con tu cuenta de Google autorizada de la agencia. Las cuentas no registradas son bloqueadas automáticamente.
              </p>
            </div>

            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loadingGoogle}
              className="w-full py-3 px-4 rounded-xl bg-white hover:bg-slate-100 disabled:opacity-60 text-slate-900 font-bold text-xs flex items-center justify-center gap-3 transition-all cursor-pointer shadow-lg shadow-white/5 active:scale-[0.98]"
            >
              {loadingGoogle ? (
                <RefreshCw className="w-4 h-4 animate-spin text-slate-900" />
              ) : (
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                </svg>
              )}
              <span>{loadingGoogle ? 'Conectando con Google...' : 'Continuar con Google'}</span>
            </button>
          </div>
        )}

        {/* ======================================================== */}
        {/* PASO 2: RETO MFA CON GOOGLE AUTHENTICATOR                */}
        {/* ======================================================== */}
        {step === 'mfa' && (
          <div className="space-y-5 animate-fade-in">
            {/* Cuenta de Google Verificada */}
            <div className="p-3 rounded-xl bg-[#121929] border border-slate-800 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-orange-500/20 text-orange-400 flex items-center justify-center font-bold text-xs shrink-0">
                  {matchedAppUser?.avatar || 'VM'}
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-white truncate">{matchedAppUser?.nombre}</div>
                  <div className="text-[10px] text-emerald-400 font-mono truncate flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 shrink-0" />
                    <span>{googleUser?.email || matchedAppUser?.email}</span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleSignOutAndReset}
                className="text-[11px] text-slate-400 hover:text-rose-400 p-1.5 rounded-lg hover:bg-slate-800/80 transition-colors shrink-0"
                title="Cambiar de cuenta"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Enrolamiento / Sincronización de QR Único Determinístico */}
            {!isMfaEnrolled && (
              <div className="p-4 rounded-2xl bg-[#0c1018] border border-orange-500/30 space-y-3 animate-fade-in text-center">
                <div className="inline-flex items-center gap-1.5 text-xs font-bold text-orange-400">
                  <QrCode className="w-4 h-4" />
                  <span>Código QR Único Oficial de Google Authenticator</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Si tienes códigos anteriores de Goglite en tu app <strong>Google Authenticator</strong>, <strong>elimínalos primero</strong> en tu teléfono, pulsa <strong>"+"</strong> y escanea este único código QR permanente:
                </p>

                {qrCodeDataUrl ? (
                  <div className="inline-block p-2 bg-white rounded-xl shadow-md my-1">
                    <img src={qrCodeDataUrl} alt="QR Google Authenticator" className="w-40 h-40 object-contain" />
                  </div>
                ) : (
                  <div className="w-40 h-40 mx-auto bg-slate-900 rounded-xl flex items-center justify-center text-xs text-slate-500">
                    Generando código QR...
                  </div>
                )}

                {enrollmentSecret && (
                  <div className="space-y-1">
                    <div className="text-[10px] text-slate-500 font-mono">Clave de configuración manual permanente:</div>
                    <div className="inline-flex items-center gap-2 bg-[#121929] border border-slate-800 px-3 py-1.5 rounded-lg text-xs font-mono text-white">
                      <span>{enrollmentSecret}</span>
                      <button
                        type="button"
                        onClick={handleCopySecret}
                        className="text-slate-400 hover:text-white transition-colors"
                        title="Copiar clave"
                      >
                        {copiedSecret ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                )}

                <div className="text-[10px] text-slate-400">
                  Una vez escaneado, introduce abajo el código de 6 dígitos para dejar vinculada tu cuenta de forma permanente (no volverá a cambiar al cerrar sesión).
                </div>
              </div>
            )}

            {/* Formulario de Código de 6 dígitos */}
            <form onSubmit={handleVerifyTotp} className="space-y-4">
              <div className="space-y-1.5 text-center">
                <label className="text-xs font-bold text-white flex items-center justify-center gap-1.5">
                  <Smartphone className="w-4 h-4 text-orange-400" />
                  <span>{isMfaEnrolled ? 'Código de Google Authenticator' : 'Introduce el código de 6 dígitos'}</span>
                </label>
                <p className="text-[11px] text-slate-400">
                  {isMfaEnrolled 
                    ? 'Abre la app en tu teléfono e introduce el código dinámico de 6 dígitos.'
                    : 'Ingresa los 6 dígitos generados en tu móvil para activar y entrar.'}
                </p>

                <div className="pt-2">
                  <input
                    type="text"
                    inputMode="numeric"
                    autoFocus
                    maxLength={6}
                    value={totpCode}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                      setTotpCode(val);
                      if (val.length === 6) {
                        setTimeout(() => handleVerifyTotp(null, val), 80);
                      }
                    }}
                    placeholder="••••••"
                    className="w-full bg-[#141b2a] border border-orange-500/50 rounded-2xl py-3 text-center text-2xl font-mono font-bold tracking-[0.35em] text-white focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 shadow-inner"
                  />
                </div>

                <div className="flex items-center justify-center gap-1 text-[10px] font-mono text-slate-500 pt-1">
                  <span>Renovación en:</span>
                  <span className="text-orange-400 font-bold">{secondsLeft}s</span>
                </div>
              </div>

              {mfaSuccess ? (
                <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center justify-center gap-2 animate-pulse">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>¡Código Verificado! Abriendo plataforma...</span>
                </div>
              ) : (
                <div className="space-y-2.5">
                  <button
                    type="submit"
                    disabled={verifyingMfa || totpCode.length !== 6}
                    className="w-full py-3 px-4 rounded-xl bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-orange-600/30 transition-all cursor-pointer"
                  >
                    {verifyingMfa ? (
                      <RefreshCw className="w-4 h-4 animate-spin text-white" />
                    ) : (
                      <ArrowRight className="w-4 h-4" />
                    )}
                    <span>{verifyingMfa ? 'Validando con Google Authenticator...' : (isMfaEnrolled ? 'Verificar y Acceder' : 'Activar MFA y Acceder')}</span>
                  </button>

                  {isMfaEnrolled && (
                    <button
                      type="button"
                      onClick={handleShowResyncQr}
                      disabled={loadingResyncQr}
                      className="w-full py-2 px-3 rounded-xl bg-[#121929] hover:bg-slate-800/80 border border-slate-800 text-slate-300 hover:text-orange-400 text-[11px] font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <QrCode className="w-3.5 h-3.5 text-orange-400" />
                      <span>
                        {loadingResyncQr
                          ? 'Cargando código QR único...'
                          : '¿Tienes códigos duplicados o quieres re-escanear el QR único?'}
                      </span>
                    </button>
                  )}
                </div>
              )}
            </form>

          </div>
        )}

      </div>
    </div>
  );
}
