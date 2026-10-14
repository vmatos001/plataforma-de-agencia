import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Image, 
  Palette, 
  DollarSign, 
  Phone, 
  Mail, 
  Globe, 
  Check, 
  X, 
  Sparkles, 
  ShieldCheck, 
  Upload, 
  RefreshCw,
  CreditCard,
  Users,
  UserPlus,
  Trash2,
  Lock,
  Layers,
  KeyRound,
  ExternalLink,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Cpu,
  Coins
} from 'lucide-react';

export default function AgencyWhiteLabelSettingsModal({
  isOpen,
  onClose,
  agencySettings,
  onSaveAgencySettings,
  usersList = [],
  onCreateCollaborator,
  onDeleteCollaborator
}) {
  const [form, setForm] = useState({
    nombreAgencia: 'Goglite Digital Hub',
    eslogan: 'Suite Integral de Crecimiento Digital & Desarrollo Web Antigravity',
    logoUrl: '',
    colorPrimario: '#FF6B00',
    colorSecundario: '#1E293B',
    dominioWeb: 'goglite.com',
    emailContacto: 'contacto@goglite.com',
    telefonoWhatsapp: '+503 7000-1122',
    telefonoFijo: '+503 2200-3344',
    emailFacturacion: 'billing@goglite.com',
    direccionFisica: 'Torre Millenium, Piso 9, San Salvador / Av. Winston Churchill, Piantini, Sto. Dgo.',
    ubicacionPrincipal: 'San Salvador (SV) & Santo Domingo (DO)',
    marcaBlancaActiva: true,
    paisesOperacion: ['SV', 'DO', 'US', 'ES', 'MX', 'CO'],
    monedaDefecto: 'USD',
    tasaCambioDop: 58.50,
    tasaCambioEur: 0.92,
    apisIntegraciones: {
      googleSiteKitConnected: true,
      googleDriveVault: 'Goglite Agency Drive Vault',
      resendApiKey: 're_live_goglite_free_tier',
      resendFromEmail: 'Goglite Agencia <onboarding@resend.dev>',
      serperApiKey: 'serper_api_active',
      geminiApiKey: 'AIzaSy_storybrand_active',
      whatsappGatewayStatus: 'Conectado (Baileys v6)'
    },
    cuentasBancarias: {
      elSalvador: {
        banco: 'Banco Agrícola',
        tipo: 'Cuenta Corriente',
        numero: '500-128941-01',
        titular: 'Goglite Studio S.A. de C.V.',
        chivoUglyCash: '$goglite.sv'
      },
      republicaDominicana: {
        banco: 'Banreservas / Banco Popular',
        tipo: 'Cuenta Corriente Corredores',
        numero: '960-441208-5',
        titular: 'Goglite Digital Dominicana SRL',
        rnc: '1-32-88901-4'
      },
      internacional: {
        metodo: 'Zelle / Stripe / Wire Transfer',
        destinatario: 'billing@goglite.com',
        swift: 'AGRISVSX'
      }
    }
  });

  const [activeTab, setActiveTab] = useState('branding'); 
  // 'branding' | 'colaboradores' | 'bancos' | 'contacto' | 'paises' | 'apis'
  
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Form para nuevo colaborador
  const [showAddColabForm, setShowAddColabForm] = useState(false);
  const [newColab, setNewColab] = useState({
    nombre: '',
    email: '',
    cargo: 'Desarrollador Web Antigravity',
    rol: 'colaborador',
    costoPorHora: 25,
    permisos: ['desarrollo_prd', 'seo_motor', 'headless_cms']
  });
  const [colabSuccess, setColabSuccess] = useState(false);

  useEffect(() => {
    if (agencySettings) {
      setForm(prev => ({
        ...prev,
        ...agencySettings,
        apisIntegraciones: {
          ...prev.apisIntegraciones,
          ...(agencySettings.apisIntegraciones || {})
        },
        cuentasBancarias: {
          ...prev.cuentasBancarias,
          ...(agencySettings.cuentasBancarias || {})
        }
      }));
    }
  }, [agencySettings, isOpen]);

  if (!isOpen) return null;

  const colorPresets = [
    { label: 'Naranja Goglite', hex: '#FF6B00' },
    { label: 'Azul Real', hex: '#2563EB' },
    { label: 'Violeta Digital', hex: '#7C3AED' },
    { label: 'Esmeralda Tech', hex: '#059669' },
    { label: 'Cyan Futuro', hex: '#0891B2' },
    { label: 'Rosa Magenta', hex: '#DB2777' }
  ];

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setForm(prev => ({ ...prev, logoUrl: event.target.result }));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setSaving(true);
    try {
      await onSaveAgencySettings(form);
      setSavedSuccess(true);
      setTimeout(() => {
        setSavedSuccess(false);
        onClose();
      }, 1200);
    } catch (err) {
      alert('Error guardando ajustes: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleTogglePais = (code) => {
    setForm(prev => {
      const exists = prev.paisesOperacion.includes(code);
      return {
        ...prev,
        paisesOperacion: exists 
          ? prev.paisesOperacion.filter(c => c !== code)
          : [...prev.paisesOperacion, code]
      };
    });
  };

  const handleTogglePermisoColab = (permiso) => {
    setNewColab(prev => {
      const exists = prev.permisos.includes(permiso);
      return {
        ...prev,
        permisos: exists ? prev.permisos.filter(p => p !== permiso) : [...prev.permisos, permiso]
      };
    });
  };

  const handleCreateColabSubmit = async (e) => {
    e.preventDefault();
    if (!newColab.nombre.trim() || !newColab.email.trim()) return;

    try {
      if (onCreateCollaborator) {
        await onCreateCollaborator(newColab);
      }
      setColabSuccess(true);
      setTimeout(() => {
        setColabSuccess(false);
        setShowAddColabForm(false);
        setNewColab({
          nombre: '',
          email: '',
          cargo: 'Desarrollador Web Antigravity',
          rol: 'colaborador',
          costoPorHora: 25,
          permisos: ['desarrollo_prd', 'seo_motor', 'headless_cms']
        });
      }, 1200);
    } catch (err) {
      alert('Error creando colaborador: ' + err.message);
    }
  };

  const handleDeleteColab = async (userId) => {
    if (!window.confirm('¿Deseas revocar el acceso de este colaborador de la plataforma?')) return;
    try {
      if (onDeleteCollaborator) {
        await onDeleteCollaborator(userId);
      }
    } catch (err) {
      alert('Error eliminando colaborador: ' + err.message);
    }
  };

  const countriesCatalog = [
    { code: 'SV', flag: '🇸🇻', name: 'El Salvador' },
    { code: 'DO', flag: '🇩🇴', name: 'República Dominicana' },
    { code: 'US', flag: '🇺🇸', name: 'Estados Unidos' },
    { code: 'ES', flag: '🇪🇸', name: 'España' },
    { code: 'MX', flag: '🇲🇽', name: 'México' },
    { code: 'CO', flag: '🇨🇴', name: 'Colombia' },
    { code: 'PA', flag: '🇵🇦', name: 'Panamá' },
    { code: 'CR', flag: '🇨🇷', name: 'Costa Rica' }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-4xl rounded-2xl bg-[#0d121d] border border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header Modal */}
        <div className="p-5 border-b border-slate-800/80 bg-[#101625] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center border border-orange-500/30">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">Ajustes Globales de la Agencia</h2>
                <span className="text-[10px] font-mono bg-orange-500/20 text-orange-300 border border-orange-500/30 px-2 py-0.5 rounded-full font-bold">
                  Exclusivo Administrador
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Configura la identidad corporativa, equipo de colaboradores, cuentas de banco, contactos, países y APIs.
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

        {/* Tab Navigation (6 Tabs) */}
        <div className="px-5 pt-3 border-b border-slate-800 bg-[#0e1320] flex items-center gap-1.5 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('branding')}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'branding'
                ? 'border-orange-500 text-orange-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Palette className="w-3.5 h-3.5" />
            <span>1. Marca & Logo</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('colaboradores')}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'colaboradores'
                ? 'border-orange-500 text-orange-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>2. Colaboradores</span>
            <span className="text-[10px] bg-slate-800 px-1.5 py-0.2 rounded-full font-mono text-slate-300">
              {usersList.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('bancos')}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'bancos'
                ? 'border-orange-500 text-orange-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>3. Cuentas de Banco</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('contacto')}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'contacto'
                ? 'border-orange-500 text-orange-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Phone className="w-3.5 h-3.5" />
            <span>4. Contacto & Soporte</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('paises')}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'paises'
                ? 'border-orange-500 text-orange-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>5. Países & Monedas</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('apis')}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'apis'
                ? 'border-orange-500 text-orange-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>6. APIs & Conexiones</span>
          </button>
        </div>

        {/* Tab Body Content */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          
          {/* TAB 1: BRANDING & MARCA BLANCA */}
          {activeTab === 'branding' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-mono text-slate-300 block mb-1.5 font-semibold">
                    Nombre Comercial de la Empresa / Agencia *
                  </label>
                  <input
                    type="text"
                    required
                    value={form.nombreAgencia}
                    onChange={(e) => setForm({ ...form, nombreAgencia: e.target.value })}
                    placeholder="Ej. Goglite Digital Hub"
                    className="w-full bg-[#141b2a] border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-orange-500"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">Se proyecta en la cabecera, presupuestos, contratos y portal de clientes.</p>
                </div>

                <div>
                  <label className="text-xs font-mono text-slate-300 block mb-1.5 font-semibold">
                    Eslogan o Subtítulo Institucional
                  </label>
                  <input
                    type="text"
                    value={form.eslogan}
                    onChange={(e) => setForm({ ...form, eslogan: e.target.value })}
                    placeholder="Ej. Suite Integral de Crecimiento Digital & Desarrollo Web"
                    className="w-full bg-[#141b2a] border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              {/* Logo Manager */}
              <div className="p-4 rounded-xl bg-[#121724] border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Image className="w-4 h-4 text-orange-400" />
                    Logotipo Oficial de la Empresa
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">Reemplaza la letra G estática</span>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-4 pt-1">
                  {/* Preview Box */}
                  <div className="w-24 h-16 rounded-xl bg-[#090d16] border border-slate-700 flex items-center justify-center p-2 shrink-0 overflow-hidden shadow-inner">
                    {form.logoUrl ? (
                      <img src={form.logoUrl} alt="Logo de Agencia" className="max-w-full max-h-full object-contain" />
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <span 
                          className="w-9 h-9 rounded-lg flex items-center justify-center font-black text-white text-base shadow-sm"
                          style={{ backgroundColor: form.colorPrimario }}
                        >
                          {(form.nombreAgencia || 'G')[0].toUpperCase()}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex-1 w-full space-y-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="url"
                        value={form.logoUrl}
                        onChange={(e) => setForm({ ...form, logoUrl: e.target.value })}
                        placeholder="URL de la imagen del logo (https://...)"
                        className="flex-1 bg-[#141b2a] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
                      />
                      {form.logoUrl && (
                        <button
                          type="button"
                          onClick={() => setForm({ ...form, logoUrl: '' })}
                          className="px-2.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs"
                          title="Restablecer"
                        >
                          Quitar
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <label className="cursor-pointer flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-600/20 hover:bg-orange-600/30 text-orange-300 border border-orange-500/30 text-xs font-semibold transition-all">
                        <Upload className="w-3.5 h-3.5" />
                        <span>Subir archivo de imagen</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleFileUpload}
                          className="hidden"
                        />
                      </label>
                      <span className="text-[10px] text-slate-500">JPG, PNG o SVG con fondo transparente</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Color Presets */}
              <div className="p-4 rounded-xl bg-[#121724] border border-slate-800 space-y-3">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Palette className="w-4 h-4 text-orange-400" />
                  Color de Acento Institucional
                </span>

                <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
                  {colorPresets.map((preset) => (
                    <button
                      key={preset.hex}
                      type="button"
                      onClick={() => setForm({ ...form, colorPrimario: preset.hex })}
                      className={`p-2 rounded-xl border text-left transition-all flex flex-col gap-1.5 ${
                        form.colorPrimario.toUpperCase() === preset.hex.toUpperCase()
                          ? 'border-white bg-slate-800 shadow-md ring-1 ring-white/30'
                          : 'border-slate-800 bg-[#0d121d] hover:border-slate-700'
                      }`}
                    >
                      <div className="w-full h-5 rounded-md shadow-sm" style={{ backgroundColor: preset.hex }}></div>
                      <span className="text-[10px] font-semibold text-slate-300 truncate">{preset.label}</span>
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <label className="text-xs font-mono text-slate-400">Color Personalizado:</label>
                  <input
                    type="color"
                    value={form.colorPrimario}
                    onChange={(e) => setForm({ ...form, colorPrimario: e.target.value })}
                    className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0"
                  />
                  <input
                    type="text"
                    value={form.colorPrimario}
                    onChange={(e) => setForm({ ...form, colorPrimario: e.target.value })}
                    className="w-24 bg-[#141b2a] border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white font-mono"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PERFILES DE COLABORADORES */}
          {activeTab === 'colaboradores' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-orange-400" />
                    Equipo de Trabajo & Colaboradores
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Administra los accesos y roles. Los colaboradores tienen acceso al desarrollo pero nunca al Módulo 7 (Rentabilidad y P&L).
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setShowAddColabForm(!showAddColabForm)}
                  className="px-3 py-1.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-semibold text-xs transition-all flex items-center gap-1.5 shadow-sm"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>{showAddColabForm ? 'Cancelar' : 'Nuevo Colaborador'}</span>
                </button>
              </div>

              {/* Formulario Agregar Colaborador */}
              {showAddColabForm && (
                <form onSubmit={handleCreateColabSubmit} className="p-4 rounded-xl bg-[#141b2a] border border-orange-500/40 space-y-3 animate-fade-in">
                  <div className="font-bold text-xs text-orange-400 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Registrar Nuevo Colaborador</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-mono text-slate-300 block mb-1">Nombre Completo *</label>
                      <input
                        type="text"
                        required
                        value={newColab.nombre}
                        onChange={(e) => setNewColab({ ...newColab, nombre: e.target.value })}
                        placeholder="Ej. Andrés Morales"
                        className="w-full bg-[#0d121d] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-mono text-slate-300 block mb-1">Correo Electrónico *</label>
                      <input
                        type="email"
                        required
                        value={newColab.email}
                        onChange={(e) => setNewColab({ ...newColab, email: e.target.value })}
                        placeholder="andres@goglite.com"
                        className="w-full bg-[#0d121d] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-mono text-slate-300 block mb-1">Cargo / Especialidad</label>
                      <input
                        type="text"
                        value={newColab.cargo}
                        onChange={(e) => setNewColab({ ...newColab, cargo: e.target.value })}
                        placeholder="Ej. Desarrollador Web Antigravity"
                        className="w-full bg-[#0d121d] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-mono text-slate-300 block mb-1">Tarifa por Hora Estimada (USD/h)</label>
                      <input
                        type="number"
                        min="5"
                        max="200"
                        value={newColab.costoPorHora}
                        onChange={(e) => setNewColab({ ...newColab, costoPorHora: Number(e.target.value) })}
                        className="w-full bg-[#0d121d] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500 font-mono"
                      />
                    </div>
                  </div>

                  {/* Permisos de Fases */}
                  <div>
                    <label className="text-[11px] font-mono text-slate-400 block mb-1.5">Permisos de Módulos Autorizados:</label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {[
                        { id: 'lead_scrapper', label: '1. Lead Scrapper' },
                        { id: 'crm_portal', label: '2. CRM & WhatsApp' },
                        { id: 'presupuestos', label: '3. Presupuestos' },
                        { id: 'desarrollo_prd', label: '4. Desarrollo & PRD' },
                        { id: 'seo_motor', label: '5. Motor SEO & QA' },
                        { id: 'headless_cms', label: '6. Hub Headless CMS' }
                      ].map((mod) => (
                        <button
                          key={mod.id}
                          type="button"
                          onClick={() => handleTogglePermisoColab(mod.id)}
                          className={`px-2.5 py-1.5 rounded-lg border text-left text-xs transition-all flex items-center justify-between ${
                            newColab.permisos.includes(mod.id)
                              ? 'bg-orange-500/15 border-orange-500/40 text-orange-300 font-semibold'
                              : 'bg-[#0d121d] border-slate-800 text-slate-400'
                          }`}
                        >
                          <span>{mod.label}</span>
                          {newColab.permisos.includes(mod.id) && <Check className="w-3 h-3 text-orange-400" />}
                        </button>
                      ))}
                    </div>
                    <div className="mt-2 p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[10px] flex items-center gap-1.5">
                      <Lock className="w-3 h-3 shrink-0" />
                      <span>Fase 7 (Rentabilidad y P&L) está permanentemente bloqueada para cualquier colaborador.</span>
                    </div>
                  </div>

                  {colabSuccess && (
                    <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>¡Colaborador agregado exitosamente al equipo!</span>
                    </div>
                  )}

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowAddColabForm(false)}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-500 text-white font-semibold text-xs shadow-md"
                    >
                      Guardar Colaborador
                    </button>
                  </div>
                </form>
              )}

              {/* Lista de Colaboradores Existentes */}
              <div className="space-y-2">
                {usersList.map((user) => (
                  <div
                    key={user.id}
                    className="p-3.5 rounded-xl bg-[#121724] border border-slate-800 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold border ${
                        user.rol === 'admin'
                          ? 'bg-orange-500/20 text-orange-400 border-orange-500'
                          : 'bg-blue-500/20 text-blue-400 border-blue-500'
                      }`}>
                        {user.avatar || 'U'}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-white">{user.nombre}</span>
                          <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded uppercase font-bold ${
                            user.rol === 'admin'
                              ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                              : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                          }`}>
                            {user.rol}
                          </span>
                          {user.mfaActivo && (
                            <span className="text-[9px] font-mono bg-emerald-500/20 text-emerald-300 px-1 py-0.2 rounded border border-emerald-500/30">
                              2FA Activo
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400">{user.email} · {user.cargo}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {user.rol === 'admin' ? (
                        <span className="text-[11px] font-mono text-orange-400 font-semibold px-2 py-1 bg-orange-500/10 rounded-lg">
                          Admin Principal
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleDeleteColab(user.id)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                          title="Eliminar colaborador"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: CUENTAS BANCARIAS */}
          {activeTab === 'bancos' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>
                  Estas cuentas se imprimen en los contratos, facturas y en la pantalla de pago del Portal del Cliente.
                </span>
              </div>

              {/* El Salvador */}
              <div className="p-4 rounded-xl bg-[#121724] border border-slate-800 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-base">🇸🇻</span>
                  <span className="text-xs font-bold text-white">Cuentas Oficiales El Salvador (SV)</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-mono text-slate-400 block mb-1">Banco e Institución</label>
                    <input
                      type="text"
                      value={form.cuentasBancarias?.elSalvador?.banco || ''}
                      onChange={(e) => setForm({
                        ...form,
                        cuentasBancarias: {
                          ...form.cuentasBancarias,
                          elSalvador: { ...form.cuentasBancarias?.elSalvador, banco: e.target.value }
                        }
                      })}
                      className="w-full bg-[#141b2a] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-mono text-slate-400 block mb-1">Número de Cuenta</label>
                    <input
                      type="text"
                      value={form.cuentasBancarias?.elSalvador?.numero || ''}
                      onChange={(e) => setForm({
                        ...form,
                        cuentasBancarias: {
                          ...form.cuentasBancarias,
                          elSalvador: { ...form.cuentasBancarias?.elSalvador, numero: e.target.value }
                        }
                      })}
                      className="w-full bg-[#141b2a] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-orange-500"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-mono text-slate-400 block mb-1">Titular de la Cuenta</label>
                    <input
                      type="text"
                      value={form.cuentasBancarias?.elSalvador?.titular || ''}
                      onChange={(e) => setForm({
                        ...form,
                        cuentasBancarias: {
                          ...form.cuentasBancarias,
                          elSalvador: { ...form.cuentasBancarias?.elSalvador, titular: e.target.value }
                        }
                      })}
                      className="w-full bg-[#141b2a] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-mono text-slate-400 block mb-1">Chivo Wallet / UglyCash</label>
                    <input
                      type="text"
                      value={form.cuentasBancarias?.elSalvador?.chivoUglyCash || ''}
                      onChange={(e) => setForm({
                        ...form,
                        cuentasBancarias: {
                          ...form.cuentasBancarias,
                          elSalvador: { ...form.cuentasBancarias?.elSalvador, chivoUglyCash: e.target.value }
                        }
                      })}
                      className="w-full bg-[#141b2a] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-orange-500"
                    />
                  </div>
                </div>
              </div>

              {/* República Dominicana */}
              <div className="p-4 rounded-xl bg-[#121724] border border-slate-800 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-base">🇩🇴</span>
                  <span className="text-xs font-bold text-white">Cuentas Oficiales República Dominicana (DO)</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-mono text-slate-400 block mb-1">Banco e Institución</label>
                    <input
                      type="text"
                      value={form.cuentasBancarias?.republicaDominicana?.banco || ''}
                      onChange={(e) => setForm({
                        ...form,
                        cuentasBancarias: {
                          ...form.cuentasBancarias,
                          republicaDominicana: { ...form.cuentasBancarias?.republicaDominicana, banco: e.target.value }
                        }
                      })}
                      className="w-full bg-[#141b2a] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-mono text-slate-400 block mb-1">Número de Cuenta</label>
                    <input
                      type="text"
                      value={form.cuentasBancarias?.republicaDominicana?.numero || ''}
                      onChange={(e) => setForm({
                        ...form,
                        cuentasBancarias: {
                          ...form.cuentasBancarias,
                          republicaDominicana: { ...form.cuentasBancarias?.republicaDominicana, numero: e.target.value }
                        }
                      })}
                      className="w-full bg-[#141b2a] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-orange-500"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-mono text-slate-400 block mb-1">Titular de la Cuenta</label>
                    <input
                      type="text"
                      value={form.cuentasBancarias?.republicaDominicana?.titular || ''}
                      onChange={(e) => setForm({
                        ...form,
                        cuentasBancarias: {
                          ...form.cuentasBancarias,
                          republicaDominicana: { ...form.cuentasBancarias?.republicaDominicana, titular: e.target.value }
                        }
                      })}
                      className="w-full bg-[#141b2a] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-mono text-slate-400 block mb-1">RNC o Cédula Fiscal</label>
                    <input
                      type="text"
                      value={form.cuentasBancarias?.republicaDominicana?.rnc || ''}
                      onChange={(e) => setForm({
                        ...form,
                        cuentasBancarias: {
                          ...form.cuentasBancarias,
                          republicaDominicana: { ...form.cuentasBancarias?.republicaDominicana, rnc: e.target.value }
                        }
                      })}
                      className="w-full bg-[#141b2a] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-orange-500"
                    />
                  </div>
                </div>
              </div>

              {/* Internacional */}
              <div className="p-4 rounded-xl bg-[#121724] border border-slate-800 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-base">🌎</span>
                  <span className="text-xs font-bold text-white">Canales de Pago Internacionales</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-mono text-slate-400 block mb-1">Métodos Habilitados</label>
                    <input
                      type="text"
                      value={form.cuentasBancarias?.internacional?.metodo || ''}
                      onChange={(e) => setForm({
                        ...form,
                        cuentasBancarias: {
                          ...form.cuentasBancarias,
                          internacional: { ...form.cuentasBancarias?.internacional, metodo: e.target.value }
                        }
                      })}
                      className="w-full bg-[#141b2a] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-mono text-slate-400 block mb-1">Destinatario / Correo Zelle o Stripe</label>
                    <input
                      type="text"
                      value={form.cuentasBancarias?.internacional?.destinatario || ''}
                      onChange={(e) => setForm({
                        ...form,
                        cuentasBancarias: {
                          ...form.cuentasBancarias,
                          internacional: { ...form.cuentasBancarias?.internacional, destinatario: e.target.value }
                        }
                      })}
                      className="w-full bg-[#141b2a] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-orange-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: CONTACTO & SOPORTE DE LA EMPRESA */}
          {activeTab === 'contacto' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-mono text-slate-300 block mb-1.5 font-semibold">
                    WhatsApp Comercial Oficial *
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={form.telefonoWhatsapp}
                      onChange={(e) => setForm({ ...form, telefonoWhatsapp: e.target.value })}
                      placeholder="+503 7000-1122"
                      className="w-full bg-[#141b2a] border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-orange-500"
                    />
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">Se utiliza para los botones de contacto y soporte del portal de clientes.</p>
                </div>

                <div>
                  <label className="text-xs font-mono text-slate-300 block mb-1.5 font-semibold">
                    Teléfono Fijo / PBX de Soporte
                  </label>
                  <input
                    type="text"
                    value={form.telefonoFijo}
                    onChange={(e) => setForm({ ...form, telefonoFijo: e.target.value })}
                    placeholder="+503 2200-3344"
                    className="w-full bg-[#141b2a] border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-mono text-slate-300 block mb-1.5 font-semibold">
                    Correo Electrónico de Contacto General *
                  </label>
                  <input
                    type="email"
                    required
                    value={form.emailContacto}
                    onChange={(e) => setForm({ ...form, emailContacto: e.target.value })}
                    placeholder="contacto@goglite.com"
                    className="w-full bg-[#141b2a] border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-mono text-slate-300 block mb-1.5 font-semibold">
                    Correo de Facturación & Cobranzas
                  </label>
                  <input
                    type="email"
                    value={form.emailFacturacion}
                    onChange={(e) => setForm({ ...form, emailFacturacion: e.target.value })}
                    placeholder="billing@goglite.com"
                    className="w-full bg-[#141b2a] border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-xs font-mono text-slate-300 block mb-1.5 font-semibold">
                    Dirección Física y Fiscal de la Empresa
                  </label>
                  <input
                    type="text"
                    value={form.direccionFisica}
                    onChange={(e) => setForm({ ...form, direccionFisica: e.target.value })}
                    placeholder="Torre Millenium, Piso 9, San Salvador / Av. Winston Churchill, Piantini, Sto. Dgo."
                    className="w-full bg-[#141b2a] border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-xs font-mono text-slate-300 block mb-1.5 font-semibold">
                    Dominio Web Oficial
                  </label>
                  <input
                    type="text"
                    value={form.dominioWeb}
                    onChange={(e) => setForm({ ...form, dominioWeb: e.target.value })}
                    placeholder="goglite.com"
                    className="w-full bg-[#141b2a] border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: PAÍSES DE OPERACIÓN & MONEDAS */}
          {activeTab === 'paises' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-xs font-bold text-white flex items-center gap-1.5 mb-1">
                  <Globe className="w-4 h-4 text-orange-400" />
                  Países Activos de Operación de la Agencia
                </h3>
                <p className="text-[11px] text-slate-400">
                  Selecciona los mercados donde la agencia prospecta clientes y emite propuestas comerciales.
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {countriesCatalog.map((country) => {
                  const isActive = form.paisesOperacion.includes(country.code);
                  return (
                    <button
                      key={country.code}
                      type="button"
                      onClick={() => handleTogglePais(country.code)}
                      className={`p-3 rounded-xl border text-left transition-all flex items-center gap-2.5 ${
                        isActive
                          ? 'bg-orange-500/15 border-orange-500/40 text-orange-300 font-semibold shadow-sm'
                          : 'bg-[#121724] border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <span className="text-xl">{country.flag}</span>
                      <div className="truncate">
                        <div className="text-xs text-white">{country.name}</div>
                        <span className="text-[10px] font-mono text-slate-400">{country.code}</span>
                      </div>
                      {isActive && <Check className="w-3.5 h-3.5 text-orange-400 ml-auto shrink-0" />}
                    </button>
                  );
                })}
              </div>

              {/* Monedas & Tasas */}
              <div className="p-4 rounded-xl bg-[#121724] border border-slate-800 space-y-3 pt-4">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Coins className="w-4 h-4 text-orange-400" />
                  Moneda Base y Tasas de Conversión Referenciales
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[11px] font-mono text-slate-400 block mb-1">Moneda Base</label>
                    <select
                      value={form.monedaDefecto}
                      onChange={(e) => setForm({ ...form, monedaDefecto: e.target.value })}
                      className="w-full bg-[#141b2a] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
                    >
                      <option value="USD">USD ($) Dólares Estadounidenses</option>
                      <option value="DOP">DOP ($) Pesos Dominicanos</option>
                      <option value="EUR">EUR (€) Euros</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-mono text-slate-400 block mb-1">Tasa 1 USD a Pesos (DOP)</label>
                    <input
                      type="number"
                      step="0.05"
                      value={form.tasaCambioDop}
                      onChange={(e) => setForm({ ...form, tasaCambioDop: Number(e.target.value) })}
                      className="w-full bg-[#141b2a] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-orange-500"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-mono text-slate-400 block mb-1">Tasa 1 USD a Euros (EUR)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={form.tasaCambioEur}
                      onChange={(e) => setForm({ ...form, tasaCambioEur: Number(e.target.value) })}
                      className="w-full bg-[#141b2a] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-orange-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: APIS & CONEXIONES */}
          {activeTab === 'apis' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-300 text-xs">
                <span className="font-bold">Ecosistema de Integraciones Antigravity:</span>
                <p className="text-[11px] text-slate-300 mt-0.5">
                  Conexión directa con Google Workspace, Resend ($0 emails), Gemini IA y WhatsApp Baileys.
                </p>
              </div>

              <div className="space-y-3">
                {/* Google Site Kit & Drive */}
                <div className="p-3.5 rounded-xl bg-[#121724] border border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold">
                      G
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white flex items-center gap-1.5">
                        <span>Google Site Kit, Console & Drive Vault</span>
                        <span className="text-[9px] font-mono bg-emerald-500/20 text-emerald-300 px-1.5 py-0.2 rounded font-bold">
                          Conectado
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400">
                        Bóvedas automáticas en Google Drive y auditoría de Google Search Console.
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-mono text-emerald-400 font-bold">Activo</span>
                </div>

                {/* Resend Email $0 */}
                <div className="p-3.5 rounded-xl bg-[#121724] border border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center">
                      <Mail className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white flex items-center gap-1.5">
                        <span>Resend API (Transaccionales $0.00)</span>
                        <span className="text-[9px] font-mono bg-emerald-500/20 text-emerald-300 px-1.5 py-0.2 rounded font-bold">
                          Free Tier
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400">
                        Envío de propuestas y avisos automáticos a clientes desde onboarding@resend.dev.
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-mono text-emerald-400 font-bold">3,000 / mes</span>
                </div>

                {/* WhatsApp Baileys */}
                <div className="p-3.5 rounded-xl bg-[#121724] border border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                      <Phone className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white flex items-center gap-1.5">
                        <span>WhatsApp Web Gateway (Baileys v6)</span>
                        <span className="text-[9px] font-mono bg-emerald-500/20 text-emerald-300 px-1.5 py-0.2 rounded font-bold">
                          QR Autenticado
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400">
                        Conexión segura 100% nativa sin coste mensual para envío de mensajes en el CRM.
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-mono text-emerald-400 font-bold">Listo</span>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-[#101625] flex items-center justify-between">
          <div className="flex items-center gap-2">
            {savedSuccess ? (
              <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1 animate-fade-in">
                <Check className="w-4 h-4" />
                ¡Ajustes de la agencia guardados con éxito!
              </span>
            ) : (
              <span className="text-[11px] text-slate-500">
                Los cambios se aplican automáticamente en la suite y portales públicos.
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={handleSubmit}
              className="px-5 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white font-semibold text-xs shadow-lg shadow-orange-600/30 transition-all flex items-center gap-1.5"
            >
              {saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
              <span>{saving ? 'Guardando...' : 'Guardar Ajustes'}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
