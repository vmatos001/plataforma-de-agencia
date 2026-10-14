import React, { useState } from 'react';
import { 
  ShieldCheck, 
  UserCheck, 
  Users, 
  Lock, 
  KeyRound, 
  Smartphone, 
  X, 
  Check, 
  UserPlus, 
  LogOut, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle,
  ExternalLink
} from 'lucide-react';

export default function AuthRoleSelectorModal({
  isOpen,
  onClose,
  currentUser,
  usersList = [],
  onSwitchUser,
  onCreateCollaborator,
  onClientPortalLogin
}) {
  const [activeTab, setActiveTab] = useState('perfiles'); // 'perfiles' | 'nuevo_colaborador' | 'google_auth'
  const [totpCode, setTotpCode] = useState('');
  const [totpError, setTotpError] = useState('');
  const [targetAdminUser, setTargetAdminUser] = useState(null);

  // Form para nuevo colaborador
  const [newColab, setNewColab] = useState({
    nombre: '',
    email: '',
    cargo: 'Desarrollador Web Antigravity',
    rol: 'colaborador',
    permisos: ['desarrollo_prd', 'seo_motor', 'headless_cms']
  });
  const [colabSuccess, setColabSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSelectUser = (user) => {
    // Si es admin y tiene MFA activo, pedir código de Google Authenticator
    if (user.rol === 'admin' && user.mfaActivo && user.id !== currentUser?.id) {
      setTargetAdminUser(user);
      setActiveTab('google_auth');
      setTotpCode('');
      setTotpError('');
      return;
    }

    onSwitchUser(user);
    onClose();
  };

  const handleVerifyTotp = (e) => {
    e.preventDefault();
    if (totpCode.trim().length !== 6) {
      setTotpError('El código de Google Authenticator debe tener exactamente 6 dígitos.');
      return;
    }
    // Verificación de código TOTP (simulación exitosa para cualquier código de 6 dígitos o 123456)
    if (targetAdminUser) {
      onSwitchUser(targetAdminUser);
      setTargetAdminUser(null);
      onClose();
    }
  };

  const handleCreateColabSubmit = async (e) => {
    e.preventDefault();
    if (!newColab.nombre.trim() || !newColab.email.trim()) return;

    try {
      await onCreateCollaborator(newColab);
      setColabSuccess(true);
      setTimeout(() => {
        setColabSuccess(false);
        setActiveTab('perfiles');
        setNewColab({
          nombre: '',
          email: '',
          cargo: 'Desarrollador Web Antigravity',
          rol: 'colaborador',
          permisos: ['desarrollo_prd', 'seo_motor', 'headless_cms']
        });
      }, 1200);
    } catch (err) {
      alert('Error creando colaborador: ' + err.message);
    }
  };

  const handleTogglePermiso = (permiso) => {
    setNewColab(prev => {
      const exists = prev.permisos.includes(permiso);
      return {
        ...prev,
        permisos: exists ? prev.permisos.filter(p => p !== permiso) : [...prev.permisos, permiso]
      };
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-2xl rounded-2xl bg-[#0d121d] border border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header Modal */}
        <div className="p-5 border-b border-slate-800/80 bg-[#101625] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center border border-orange-500/30">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">Autenticación, Roles & Colaboradores</h2>
                <span className="text-[10px] font-mono bg-blue-500/20 text-blue-300 border border-blue-500/30 px-2 py-0.5 rounded-full font-bold">
                  Firebase Auth + RBAC
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Control de acceso por roles (Admin, Colaborador, Cliente) con soporte de Google Authenticator.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Active User Banner */}
        <div className="px-5 py-3 bg-[#0a0e17] border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold border ${
              currentUser?.rol === 'admin' 
                ? 'bg-orange-500/20 border-orange-500 text-orange-300' 
                : currentUser?.rol === 'colaborador'
                ? 'bg-blue-500/20 border-blue-500 text-blue-300'
                : 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
            }`}>
              {currentUser?.avatar || 'VM'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white">{currentUser?.nombre || 'Usuario'}</span>
                <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded uppercase ${
                  currentUser?.rol === 'admin' 
                    ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' 
                    : currentUser?.rol === 'colaborador'
                    ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                    : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                }`}>
                  {currentUser?.rol || 'admin'}
                </span>
                {currentUser?.mfaActivo && (
                  <span className="text-[9px] font-mono bg-purple-500/20 text-purple-300 border border-purple-500/30 px-1.5 py-0.2 rounded flex items-center gap-1">
                    <Smartphone className="w-2.5 h-2.5" /> 2FA Activo
                  </span>
                )}
              </div>
              <span className="text-[10px] text-slate-400 font-mono">{currentUser?.email} · {currentUser?.cargo}</span>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
              ● Sesión Activa
            </span>
          </div>
        </div>

        {/* Tab Buttons */}
        <div className="px-5 pt-3 border-b border-slate-800 bg-[#0e1320] flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('perfiles')}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold border-b-2 transition-all ${
              activeTab === 'perfiles'
                ? 'border-orange-500 text-orange-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Perfiles de Colaboradores & Switch</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('nuevo_colaborador')}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold border-b-2 transition-all ${
              activeTab === 'nuevo_colaborador'
                ? 'border-orange-500 text-orange-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Dar de Alta Colaborador</span>
          </button>
          {targetAdminUser && (
            <button
              type="button"
              onClick={() => setActiveTab('google_auth')}
              className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold border-b-2 border-purple-500 text-purple-400"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Verificación 2FA</span>
            </button>
          )}
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          
          {/* TAB 1: LISTA DE PERFILES */}
          {activeTab === 'perfiles' && (
            <div className="space-y-4">
              <div className="text-xs text-slate-400">
                Selecciona un perfil para cambiar de usuario al instante y auditar los permisos de cada rol en la plataforma:
              </div>

              <div className="space-y-2.5">
                {usersList.map((u) => {
                  const isCurrent = u.id === currentUser?.id;
                  return (
                    <div
                      key={u.id}
                      className={`p-3.5 rounded-xl border transition-all flex items-center justify-between ${
                        isCurrent 
                          ? 'bg-[#151d2f] border-orange-500/50 shadow-md' 
                          : 'bg-[#111624] border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold border ${
                          u.rol === 'admin' 
                            ? 'bg-orange-500/20 border-orange-500 text-orange-400' 
                            : u.rol === 'colaborador'
                            ? 'bg-blue-500/20 border-blue-500 text-blue-400'
                            : 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                        }`}>
                          {u.avatar}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-white">{u.nombre}</span>
                            <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded font-bold uppercase ${
                              u.rol === 'admin' 
                                ? 'bg-orange-500/20 text-orange-400' 
                                : u.rol === 'colaborador'
                                ? 'bg-blue-500/20 text-blue-400'
                                : 'bg-emerald-500/20 text-emerald-400'
                            }`}>
                              {u.rol}
                            </span>
                            {u.mfaActivo && (
                              <span className="text-[9px] text-purple-400 font-mono">2FA TOTP</span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                            {u.cargo} · {u.email}
                          </div>
                          <div className="text-[9px] text-slate-500 mt-1">
                            {u.rol === 'admin' 
                              ? '👑 Acceso Total: Fases 1 a 7, Finanzas, Márgenes & Marca Blanca'
                              : u.rol === 'colaborador'
                              ? '🛠️ Acceso Producción: Desarrollo, Wireframes, QA (Módulo 7 P&L Protegido)'
                              : '👤 Acceso Cliente: Exclusivo a su Portal de Cliente'}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {isCurrent ? (
                          <span className="px-3 py-1.5 rounded-lg bg-orange-500/20 text-orange-300 text-xs font-bold font-mono border border-orange-500/30 flex items-center gap-1">
                            <Check className="w-3 h-3" /> Activo
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleSelectUser(u)}
                            className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
                          >
                            Cambiar a este Usuario
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Informative Security Callout */}
              <div className="p-3.5 rounded-xl bg-[#0a0e18] border border-slate-800 flex items-start gap-3 text-xs text-slate-400">
                <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white">Blindaje Financiero de Agencia (RBAC):</strong> Cuando inicias sesión como colaborador, el Módulo 7 de Rentabilidad & P&L queda automáticamente bloqueado y oculto. El colaborador puede cronometrar sus horas en Módulo 4 sin conocer la tarifa general cobrada al cliente ni el margen neto de la empresa.
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: NUEVO COLABORADOR */}
          {activeTab === 'nuevo_colaborador' && (
            <form onSubmit={handleCreateColabSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-mono text-slate-300 block mb-1 font-semibold">
                    Nombre Completo del Colaborador *
                  </label>
                  <input
                    type="text"
                    required
                    value={newColab.nombre}
                    onChange={(e) => setNewColab({ ...newColab, nombre: e.target.value })}
                    placeholder="Ej. Andrés Morales"
                    className="w-full bg-[#141b2a] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-mono text-slate-300 block mb-1 font-semibold">
                    Correo Electrónico (Google / Workspace) *
                  </label>
                  <input
                    type="email"
                    required
                    value={newColab.email}
                    onChange={(e) => setNewColab({ ...newColab, email: e.target.value })}
                    placeholder="andres@goglite.com"
                    className="w-full bg-[#141b2a] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-mono text-slate-300 block mb-1 font-semibold">
                  Cargo / Rol Operativo
                </label>
                <input
                  type="text"
                  value={newColab.cargo}
                  onChange={(e) => setNewColab({ ...newColab, cargo: e.target.value })}
                  placeholder="Ej. Desarrollador Web Antigravity & QA"
                  className="w-full bg-[#141b2a] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
                />
              </div>

              {/* Permisos Asignables */}
              <div>
                <label className="text-xs font-mono text-slate-300 block mb-2 font-semibold">
                  Permisos de Módulos Asignados al Colaborador:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <label className="flex items-center gap-2 p-2 rounded-lg bg-[#141b2a] border border-slate-800 cursor-pointer hover:border-slate-700">
                    <input
                      type="checkbox"
                      checked={newColab.permisos.includes('lead_scrapper')}
                      onChange={() => handleTogglePermiso('lead_scrapper')}
                      className="rounded accent-orange-500"
                    />
                    <span className="text-slate-300">Fase 1: Lead Scrapper</span>
                  </label>
                  <label className="flex items-center gap-2 p-2 rounded-lg bg-[#141b2a] border border-slate-800 cursor-pointer hover:border-slate-700">
                    <input
                      type="checkbox"
                      checked={newColab.permisos.includes('crm_portal')}
                      onChange={() => handleTogglePermiso('crm_portal')}
                      className="rounded accent-orange-500"
                    />
                    <span className="text-slate-300">Fase 2: CRM & WhatsApp</span>
                  </label>
                  <label className="flex items-center gap-2 p-2 rounded-lg bg-[#141b2a] border border-slate-800 cursor-pointer hover:border-slate-700">
                    <input
                      type="checkbox"
                      checked={newColab.permisos.includes('presupuestos')}
                      onChange={() => handleTogglePermiso('presupuestos')}
                      className="rounded accent-orange-500"
                    />
                    <span className="text-slate-300">Fase 3: Presupuestos & Contratos</span>
                  </label>
                  <label className="flex items-center gap-2 p-2 rounded-lg bg-[#141b2a] border border-slate-800 cursor-pointer hover:border-slate-700">
                    <input
                      type="checkbox"
                      checked={newColab.permisos.includes('desarrollo_prd')}
                      onChange={() => handleTogglePermiso('desarrollo_prd')}
                      className="rounded accent-orange-500"
                    />
                    <span className="text-slate-300 font-semibold text-white">Fase 4: Centro Desarrollo & PRD (Kanban)</span>
                  </label>
                  <label className="flex items-center gap-2 p-2 rounded-lg bg-[#141b2a] border border-slate-800 cursor-pointer hover:border-slate-700">
                    <input
                      type="checkbox"
                      checked={newColab.permisos.includes('seo_motor')}
                      onChange={() => handleTogglePermiso('seo_motor')}
                      className="rounded accent-orange-500"
                    />
                    <span className="text-slate-300 font-semibold text-white">Fase 5: Motor SEO & Launch QA</span>
                  </label>
                  <label className="flex items-center gap-2 p-2 rounded-lg bg-[#141b2a] border border-slate-800 cursor-pointer hover:border-slate-700">
                    <input
                      type="checkbox"
                      checked={newColab.permisos.includes('headless_cms')}
                      onChange={() => handleTogglePermiso('headless_cms')}
                      className="rounded accent-orange-500"
                    />
                    <span className="text-slate-300 font-semibold text-white">Fase 6: Hub Headless CMS</span>
                  </label>
                </div>
                <p className="text-[10px] text-slate-500 mt-1.5 italic">
                  * Nota de seguridad: El Módulo 7 (Rentabilidad & P&L) está reservado exclusivamente para Administradores y no puede ser asignado a colaboradores.
                </p>
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('perfiles')}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-orange-950"
                >
                  {colabSuccess ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-white" />
                      <span>¡Colaborador Registrado!</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>Crear Perfil de Colaborador</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* TAB 3: GOOGLE AUTHENTICATOR MFA PROMPT */}
          {activeTab === 'google_auth' && targetAdminUser && (
            <form onSubmit={handleVerifyTotp} className="p-4 rounded-xl bg-[#111726] border border-purple-500/30 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-purple-500/20 text-purple-400 flex items-center justify-center border border-purple-500/30">
                  <Smartphone className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Verificación de 2 Factores (Google Authenticator)</h3>
                  <p className="text-xs text-slate-300 mt-0.5">
                    El usuario <strong className="text-white">{targetAdminUser.nombre}</strong> tiene rol Administrador protegido con MFA.
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-[#0c101a] border border-slate-800 text-xs text-slate-300 space-y-1">
                <div>Abre la aplicación <strong>Google Authenticator</strong> en tu teléfono móvil e introduce el código de 6 dígitos:</div>
                <div className="text-[10px] text-slate-500 font-mono">Clave secreta simulada: {targetAdminUser.totpKeySecret || 'JBSWY3DPEHPK3PXP'}</div>
              </div>

              <div>
                <label className="text-xs font-mono text-slate-300 block mb-1">
                  Código de 6 Dígitos de Google Authenticator:
                </label>
                <input
                  type="text"
                  maxLength={6}
                  required
                  value={totpCode}
                  onChange={(e) => {
                    setTotpCode(e.target.value.replace(/[^0-9]/g, ''));
                    setTotpError('');
                  }}
                  placeholder="000000"
                  className="w-full max-w-xs bg-[#141b2a] border border-slate-700 rounded-xl px-4 py-2.5 text-center text-lg tracking-widest text-white font-mono focus:outline-none focus:border-purple-500"
                />
                {totpError && (
                  <p className="text-xs text-rose-400 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" /> {totpError}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-purple-950"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Verificar e Iniciar Sesión como Admin</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('perfiles');
                    setTargetAdminUser(null);
                  }}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                >
                  Volver a Perfiles
                </button>
              </div>
            </form>
          )}

        </div>

      </div>
    </div>
  );
}
