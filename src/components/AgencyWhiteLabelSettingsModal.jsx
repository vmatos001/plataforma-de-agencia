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
  Coins,
  Eye,
  EyeOff,
  Save,
  Server,
  Zap
} from 'lucide-react';
import { apiClient } from '../services/apiClient';

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
      gmailWorkspaceConnected: true,
      serperApiKey: 'serper_api_active',
      geminiApiKey: 'AIzaSy_storybrand_active',
      whatsappGatewayStatus: 'Conectado (Baileys v6)'
    }
  });

  const [activeTab, setActiveTab] = useState('branding'); 
  // 'branding' | 'colaboradores' | 'contacto' | 'paises' | 'apis'
  
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

  // Estado real de APIs y Variables de Entorno (Railway)
  const [apiSettings, setApiSettings] = useState({
    geminiApiKey: '',
    serperApiKey: '',
    apolloApiKey: '',
    resendApiKey: '',
    resendFromEmail: 'Goglite Digital <contacto@goglite.com>'
  });

  const [maskedApiKeys, setMaskedApiKeys] = useState({
    geminiApiKeyMasked: '',
    serperApiKeyMasked: '',
    apolloApiKeyMasked: '',
    resendApiKeyMasked: ''
  });

  const [showKeyPassword, setShowKeyPassword] = useState({
    gemini: false,
    serper: false,
    apollo: false,
    resend: false
  });

  const [apiFeedback, setApiFeedback] = useState({});
  const [testingService, setTestingService] = useState(null);
  const [savingService, setSavingService] = useState(null);
  const [backendStatus, setBackendStatus] = useState(null);
  const [loadingBackendStatus, setLoadingBackendStatus] = useState(false);

  const fetchApiSettings = async () => {
    try {
      setLoadingBackendStatus(true);
      const [settingsRes, statusRes] = await Promise.allSettled([
        apiClient.get('/api/settings'),
        apiClient.get('/api/status')
      ]);

      if (settingsRes.status === 'fulfilled' && settingsRes.value.ok) {
        const data = await settingsRes.value.json();
        setMaskedApiKeys({
          geminiApiKeyMasked: data.geminiApiKeyMasked || '',
          serperApiKeyMasked: data.serperApiKeyMasked || '',
          apolloApiKeyMasked: data.apolloApiKeyMasked || '',
          resendApiKeyMasked: data.resendApiKeyMasked || ''
        });
        setApiSettings(prev => ({
          ...prev,
          geminiApiKey: data.geminiApiKey || prev.geminiApiKey || '',
          serperApiKey: data.serperApiKey || prev.serperApiKey || '',
          apolloApiKey: data.apolloApiKey || prev.apolloApiKey || '',
          resendApiKey: data.resendApiKey || prev.resendApiKey || '',
          resendFromEmail: data.resendFromEmail || prev.resendFromEmail || 'Goglite Digital <contacto@goglite.com>'
        }));
      }

      if (statusRes.status === 'fulfilled' && statusRes.value.ok) {
        const statusData = await statusRes.value.json();
        setBackendStatus({ online: true, services: statusData.services || {} });
      } else {
        setBackendStatus({ online: false });
      }
    } catch (err) {
      console.warn('[APIs] Error cargando configuración de APIs:', err);
      setBackendStatus({ online: false });
    } finally {
      setLoadingBackendStatus(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchApiSettings();
    }
  }, [isOpen]);

  const handleSaveIndividualApi = async (serviceKey, label) => {
    try {
      setSavingService(serviceKey);
      const payload = {
        [serviceKey]: apiSettings[serviceKey]
      };
      if (serviceKey === 'resendApiKey') {
        payload.resendFromEmail = apiSettings.resendFromEmail;
      }
      await apiClient.post('/api/settings', payload);
      
      try {
        const currentLocal = JSON.parse(localStorage.getItem('goglite_api_settings') || '{}');
        localStorage.setItem('goglite_api_settings', JSON.stringify({ ...currentLocal, ...payload }));
      } catch (e) {}

      setApiFeedback(prev => ({
        ...prev,
        [serviceKey]: { type: 'success', msg: `Clave de ${label} guardada con éxito.` }
      }));
      setTimeout(() => {
        setApiFeedback(prev => ({ ...prev, [serviceKey]: null }));
      }, 4000);
      fetchApiSettings();
    } catch (err) {
      setApiFeedback(prev => ({
        ...prev,
        [serviceKey]: { type: 'error', msg: `Error al guardar: ${err.message}` }
      }));
    } finally {
      setSavingService(null);
    }
  };

  const handleDeleteApi = async (serviceKey, label) => {
    if (!window.confirm(`¿Estás seguro de que deseas eliminar la clave de ${label}?`)) return;
    try {
      setSavingService(serviceKey);
      const payload = { [serviceKey]: '' };
      await apiClient.post('/api/settings', payload);

      setApiSettings(prev => ({ ...prev, [serviceKey]: '' }));
      setMaskedApiKeys(prev => ({ ...prev, [`${serviceKey}Masked`]: '' }));
      
      try {
        const currentLocal = JSON.parse(localStorage.getItem('goglite_api_settings') || '{}');
        delete currentLocal[serviceKey];
        localStorage.setItem('goglite_api_settings', JSON.stringify(currentLocal));
      } catch (e) {}

      setApiFeedback(prev => ({
        ...prev,
        [serviceKey]: { type: 'success', msg: `Clave de ${label} eliminada correctamente.` }
      }));
      setTimeout(() => {
        setApiFeedback(prev => ({ ...prev, [serviceKey]: null }));
      }, 4000);
      fetchApiSettings();
    } catch (err) {
      setApiFeedback(prev => ({
        ...prev,
        [serviceKey]: { type: 'error', msg: `Error al eliminar: ${err.message}` }
      }));
    } finally {
      setSavingService(null);
    }
  };

  const handleTestApi = async (provider, serviceKey, label) => {
    try {
      setTestingService(serviceKey);
      setApiFeedback(prev => ({ ...prev, [serviceKey]: null }));
      
      const res = await apiClient.post('/api/settings/test', {
        provider,
        apiKey: apiSettings[serviceKey]
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        setApiFeedback(prev => ({
          ...prev,
          [serviceKey]: { type: 'success', msg: `✅ ${data.message || 'Conexión verificada (HTTP 200)'}` }
        }));
      } else {
        setApiFeedback(prev => ({
          ...prev,
          [serviceKey]: { type: 'error', msg: `❌ ${data.message || 'Error validando credencial'}` }
        }));
      }
    } catch (err) {
      setApiFeedback(prev => ({
        ...prev,
        [serviceKey]: { type: 'error', msg: `❌ Error de conexión: ${err.message}` }
      }));
    } finally {
      setTestingService(null);
    }
  };

  useEffect(() => {
    if (agencySettings) {
      const storedLogo = typeof window !== 'undefined' ? localStorage.getItem('goglite_agency_logo') : null;
      setForm(prev => ({
        ...prev,
        ...agencySettings,
        logoUrl: agencySettings.logoUrl || storedLogo || prev.logoUrl || '/assets/goglite_logo.png',
        apisIntegraciones: {
          ...prev.apisIntegraciones,
          ...(agencySettings.apisIntegraciones || {})
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
    if (!file) return;

    // SVG se lee directamente sin compresión
    if (file.type === 'image/svg+xml') {
      const reader = new FileReader();
      reader.onload = (event) => {
        const svgResult = event.target?.result;
        if (svgResult) {
          setForm(prev => ({ ...prev, logoUrl: svgResult }));
          try {
            localStorage.setItem('goglite_agency_logo', svgResult);
          } catch (err) {
            console.warn('[Logo] Error guardando SVG en localStorage:', err);
          }
        }
      };
      reader.readAsDataURL(file);
      return;
    }

    // Para imágenes raster (PNG, JPEG, WebP): Redimensionar vía Canvas offscreen a máx 512px para evitar desbordar cuota
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new window.Image();
      img.onload = () => {
        const MAX_DIM = 512;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_DIM) {
            height = Math.round((height * MAX_DIM) / width);
            width = MAX_DIM;
          }
        } else {
          if (height > MAX_DIM) {
            width = Math.round((width * MAX_DIM) / height);
            height = MAX_DIM;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        // Exportar a PNG ligero con canal alfa transparente preservado (~15-30 KB)
        const optimizedDataUrl = canvas.toDataURL('image/png');
        setForm(prev => ({ ...prev, logoUrl: optimizedDataUrl }));

        try {
          localStorage.setItem('goglite_agency_logo', optimizedDataUrl);
        } catch (err) {
          console.warn('[Logo] Error guardando logo optimizado en localStorage:', err);
        }
      };
      img.src = event.target?.result;
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setSaving(true);
    try {
      // 1. Asegurar copia de seguridad del logo en clave independiente
      if (form.logoUrl) {
        try {
          localStorage.setItem('goglite_agency_logo', form.logoUrl);
        } catch (err) {
          console.warn('[Logo] Error persistiendo logo dedicado:', err);
        }
      }

      // 2. Persistir en almacenamiento institucional y notificar a App
      await onSaveAgencySettings(form);

      // Persistir APIs en el servidor backend (Railway)
      try {
        await apiClient.post('/api/settings', apiSettings);
      } catch (apiErr) {
        console.warn('[APIs] No se pudo guardar configuración en backend remoto:', apiErr);
      }

      // 3. Emitir evento global para actualización instantánea en toda la interfaz
      window.dispatchEvent(new CustomEvent('goglite_agency_settings_updated', { detail: form }));

      setSavedSuccess(true);
      setTimeout(() => {
        setSavedSuccess(false);
        onClose();
      }, 1000);
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
            onClick={() => setActiveTab('contacto')}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'contacto'
                ? 'border-orange-500 text-orange-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Phone className="w-3.5 h-3.5" />
            <span>3. Contacto & Soporte</span>
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
            <span>4. Países & Monedas</span>
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
            <span>5. APIs & Conexiones</span>
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

          {/* TAB 3: CONTACTO & SOPORTE DE LA EMPRESA */}
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

          {/* TAB 4: PAÍSES DE OPERACIÓN & MONEDAS */}
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

          {/* TAB 5: APIS & CONEXIONES EN VIVO */}
          {activeTab === 'apis' && (
            <div className="space-y-5">
              {/* Encabezado Railway & Backend */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-950/40 via-[#0e1424] to-slate-900 border border-blue-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Server className="w-4 h-4 text-blue-400" />
                    <span className="text-xs font-bold text-white">Servidor Backend & Variables de Entorno (Railway)</span>
                    <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                      backendStatus?.online 
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${backendStatus?.online ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`}></span>
                      {backendStatus?.online ? 'Railway En Línea (200 OK)' : 'Conectando / Modo Local'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Las credenciales maestras residen en tu entorno de Railway. Puedes editarlas, probarlas o eliminarlas en tiempo real sin reiniciar el despliegue.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={fetchApiSettings}
                  disabled={loadingBackendStatus}
                  className="px-3 py-1.5 rounded-xl bg-blue-500/15 hover:bg-blue-500/25 border border-blue-500/30 text-blue-300 text-xs font-semibold flex items-center gap-1.5 transition-all shrink-0 self-start sm:self-center"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingBackendStatus ? 'animate-spin' : ''}`} />
                  <span>Verificar Estado</span>
                </button>
              </div>

              {/* LISTA DE CONECTORES DE APIS */}
              <div className="space-y-4">
                
                {/* 1. GOOGLE GEMINI */}
                <div className="p-4 rounded-xl bg-[#121724] border border-slate-800 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center shrink-0">
                        <Sparkles className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-bold text-white">Google Gemini AI (1.5 / 2.0 Flash)</h4>
                          <span className="text-[9px] font-mono bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded border border-slate-700">
                            GEMINI_API_KEY
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Motor de IA para auditorías técnicas automáticas, generación de copy StoryBrand, cold pitches de prospección y análisis de objeciones.
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                        backendStatus?.services?.gemini || maskedApiKeys.geminiApiKeyMasked || apiSettings.geminiApiKey
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'bg-slate-800 text-slate-400'
                      }`}>
                        {backendStatus?.services?.gemini || maskedApiKeys.geminiApiKeyMasked || apiSettings.geminiApiKey
                          ? '● Conectada'
                          : '○ Sin configurar'}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-mono text-slate-400 flex items-center justify-between">
                      <span>Clave Secreta de API (Google AI Studio)</span>
                      {maskedApiKeys.geminiApiKeyMasked && !apiSettings.geminiApiKey && (
                        <span className="text-[10px] text-slate-500 font-mono">
                          Activa en servidor: {maskedApiKeys.geminiApiKeyMasked}
                        </span>
                      )}
                    </label>
                    <div className="relative">
                      <input
                        type={showKeyPassword.gemini ? 'text' : 'password'}
                        value={apiSettings.geminiApiKey}
                        onChange={(e) => setApiSettings({ ...apiSettings, geminiApiKey: e.target.value })}
                        placeholder={maskedApiKeys.geminiApiKeyMasked ? `Guardada (${maskedApiKeys.geminiApiKeyMasked})` : 'AIzaSy...'}
                        className="w-full bg-[#141b2a] border border-slate-700 rounded-xl pl-3.5 pr-10 py-2 text-xs text-white font-mono focus:outline-none focus:border-orange-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowKeyPassword({ ...showKeyPassword, gemini: !showKeyPassword.gemini })}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                        title={showKeyPassword.gemini ? 'Ocultar' : 'Ver'}
                      >
                        {showKeyPassword.gemini ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {apiFeedback['geminiApiKey'] && (
                    <div className={`p-2.5 rounded-lg text-xs flex items-center gap-2 ${
                      apiFeedback['geminiApiKey'].type === 'success' 
                        ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-300' 
                        : 'bg-rose-500/15 border border-rose-500/30 text-rose-300'
                    }`}>
                      {apiFeedback['geminiApiKey'].type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />}
                      <span>{apiFeedback['geminiApiKey'].msg}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-800/80">
                    <button
                      type="button"
                      onClick={() => handleTestApi('gemini', 'geminiApiKey', 'Google Gemini')}
                      disabled={testingService === 'geminiApiKey'}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-all"
                    >
                      <Zap className={`w-3.5 h-3.5 text-amber-400 ${testingService === 'geminiApiKey' ? 'animate-spin' : ''}`} />
                      <span>{testingService === 'geminiApiKey' ? 'Probando...' : 'Probar Conexión'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteApi('geminiApiKey', 'Google Gemini')}
                      disabled={savingService === 'geminiApiKey'}
                      className="px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/20 text-xs font-semibold flex items-center gap-1.5 transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Eliminar</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSaveIndividualApi('geminiApiKey', 'Google Gemini')}
                      disabled={savingService === 'geminiApiKey'}
                      className="px-3.5 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>{savingService === 'geminiApiKey' ? 'Guardando...' : 'Guardar Clave'}</span>
                    </button>
                  </div>
                </div>

                {/* 2. SERPER.DEV */}
                <div className="p-4 rounded-xl bg-[#121724] border border-slate-800 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
                        <Globe className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-bold text-white">Serper.dev (Google Maps & SERP Scraper)</h4>
                          <span className="text-[9px] font-mono bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded border border-slate-700">
                            SERPER_API_KEY
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Extracción de prospectos locales en Google Maps y Google SERP con filtros de negocios sin página web, reseñas y teléfonos de contacto.
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                        backendStatus?.services?.serper || maskedApiKeys.serperApiKeyMasked || apiSettings.serperApiKey
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'bg-slate-800 text-slate-400'
                      }`}>
                        {backendStatus?.services?.serper || maskedApiKeys.serperApiKeyMasked || apiSettings.serperApiKey
                          ? '● Conectada'
                          : '○ Sin configurar'}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-mono text-slate-400 flex items-center justify-between">
                      <span>Clave de API Serper (serper.dev)</span>
                      {maskedApiKeys.serperApiKeyMasked && !apiSettings.serperApiKey && (
                        <span className="text-[10px] text-slate-500 font-mono">
                          Activa en servidor: {maskedApiKeys.serperApiKeyMasked}
                        </span>
                      )}
                    </label>
                    <div className="relative">
                      <input
                        type={showKeyPassword.serper ? 'text' : 'password'}
                        value={apiSettings.serperApiKey}
                        onChange={(e) => setApiSettings({ ...apiSettings, serperApiKey: e.target.value })}
                        placeholder={maskedApiKeys.serperApiKeyMasked ? `Guardada (${maskedApiKeys.serperApiKeyMasked})` : 'serper_api_...'}
                        className="w-full bg-[#141b2a] border border-slate-700 rounded-xl pl-3.5 pr-10 py-2 text-xs text-white font-mono focus:outline-none focus:border-orange-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowKeyPassword({ ...showKeyPassword, serper: !showKeyPassword.serper })}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                        title={showKeyPassword.serper ? 'Ocultar' : 'Ver'}
                      >
                        {showKeyPassword.serper ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {apiFeedback['serperApiKey'] && (
                    <div className={`p-2.5 rounded-lg text-xs flex items-center gap-2 ${
                      apiFeedback['serperApiKey'].type === 'success' 
                        ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-300' 
                        : 'bg-rose-500/15 border border-rose-500/30 text-rose-300'
                    }`}>
                      {apiFeedback['serperApiKey'].type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />}
                      <span>{apiFeedback['serperApiKey'].msg}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-800/80">
                    <button
                      type="button"
                      onClick={() => handleTestApi('serper', 'serperApiKey', 'Serper.dev')}
                      disabled={testingService === 'serperApiKey'}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-all"
                    >
                      <Zap className={`w-3.5 h-3.5 text-amber-400 ${testingService === 'serperApiKey' ? 'animate-spin' : ''}`} />
                      <span>{testingService === 'serperApiKey' ? 'Probando...' : 'Probar Conexión'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteApi('serperApiKey', 'Serper.dev')}
                      disabled={savingService === 'serperApiKey'}
                      className="px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/20 text-xs font-semibold flex items-center gap-1.5 transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Eliminar</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSaveIndividualApi('serperApiKey', 'Serper.dev')}
                      disabled={savingService === 'serperApiKey'}
                      className="px-3.5 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>{savingService === 'serperApiKey' ? 'Guardando...' : 'Guardar Clave'}</span>
                    </button>
                  </div>
                </div>

                {/* 3. APOLLO.IO */}
                <div className="p-4 rounded-xl bg-[#121724] border border-slate-800 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0">
                        <Users className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-bold text-white">Apollo.io B2B Enrichment</h4>
                          <span className="text-[9px] font-mono bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded border border-slate-700">
                            APOLLO_API_KEY
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Enriquecimiento comercial de empresas para descubrir nombres de decisores (CEOs, Directores de Marketing) y correos de contacto corporativos.
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                        backendStatus?.services?.apollo || maskedApiKeys.apolloApiKeyMasked || apiSettings.apolloApiKey
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'bg-slate-800 text-slate-400'
                      }`}>
                        {backendStatus?.services?.apollo || maskedApiKeys.apolloApiKeyMasked || apiSettings.apolloApiKey
                          ? '● Conectada'
                          : '○ Sin configurar'}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-mono text-slate-400 flex items-center justify-between">
                      <span>Clave de API Apollo (apollo.io)</span>
                      {maskedApiKeys.apolloApiKeyMasked && !apiSettings.apolloApiKey && (
                        <span className="text-[10px] text-slate-500 font-mono">
                          Activa en servidor: {maskedApiKeys.apolloApiKeyMasked}
                        </span>
                      )}
                    </label>
                    <div className="relative">
                      <input
                        type={showKeyPassword.apollo ? 'text' : 'password'}
                        value={apiSettings.apolloApiKey}
                        onChange={(e) => setApiSettings({ ...apiSettings, apolloApiKey: e.target.value })}
                        placeholder={maskedApiKeys.apolloApiKeyMasked ? `Guardada (${maskedApiKeys.apolloApiKeyMasked})` : 'apollo_api_...'}
                        className="w-full bg-[#141b2a] border border-slate-700 rounded-xl pl-3.5 pr-10 py-2 text-xs text-white font-mono focus:outline-none focus:border-orange-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowKeyPassword({ ...showKeyPassword, apollo: !showKeyPassword.apollo })}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                        title={showKeyPassword.apollo ? 'Ocultar' : 'Ver'}
                      >
                        {showKeyPassword.apollo ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {apiFeedback['apolloApiKey'] && (
                    <div className={`p-2.5 rounded-lg text-xs flex items-center gap-2 ${
                      apiFeedback['apolloApiKey'].type === 'success' 
                        ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-300' 
                        : 'bg-rose-500/15 border border-rose-500/30 text-rose-300'
                    }`}>
                      {apiFeedback['apolloApiKey'].type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />}
                      <span>{apiFeedback['apolloApiKey'].msg}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-800/80">
                    <button
                      type="button"
                      onClick={() => handleTestApi('apollo', 'apolloApiKey', 'Apollo.io')}
                      disabled={testingService === 'apolloApiKey'}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-all"
                    >
                      <Zap className={`w-3.5 h-3.5 text-amber-400 ${testingService === 'apolloApiKey' ? 'animate-spin' : ''}`} />
                      <span>{testingService === 'apolloApiKey' ? 'Probando...' : 'Probar Conexión'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteApi('apolloApiKey', 'Apollo.io')}
                      disabled={savingService === 'apolloApiKey'}
                      className="px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/20 text-xs font-semibold flex items-center gap-1.5 transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Eliminar</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSaveIndividualApi('apolloApiKey', 'Apollo.io')}
                      disabled={savingService === 'apolloApiKey'}
                      className="px-3.5 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>{savingService === 'apolloApiKey' ? 'Guardando...' : 'Guardar Clave'}</span>
                    </button>
                  </div>
                </div>

                {/* 4. RESEND EMAIL GATEWAY */}
                <div className="p-4 rounded-xl bg-[#121724] border border-slate-800 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                        <Mail className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-bold text-white">Resend Email Gateway (Facturas & Contratos)</h4>
                          <span className="text-[9px] font-mono bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded border border-slate-700">
                            RESEND_API_KEY
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Entrega transaccional y automatizada de presupuestos SOW, enlaces de pago de anticipo, facturas fiscales y contratos con clientes.
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                        backendStatus?.services?.resend || maskedApiKeys.resendApiKeyMasked || apiSettings.resendApiKey
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'bg-slate-800 text-slate-400'
                      }`}>
                        {backendStatus?.services?.resend || maskedApiKeys.resendApiKeyMasked || apiSettings.resendApiKey
                          ? '● Conectada'
                          : '○ Sin configurar'}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-mono text-slate-400 flex items-center justify-between">
                        <span>Clave de API Resend (resend.com)</span>
                        {maskedApiKeys.resendApiKeyMasked && !apiSettings.resendApiKey && (
                          <span className="text-[10px] text-slate-500 font-mono">
                            {maskedApiKeys.resendApiKeyMasked}
                          </span>
                        )}
                      </label>
                      <div className="relative">
                        <input
                          type={showKeyPassword.resend ? 'text' : 'password'}
                          value={apiSettings.resendApiKey}
                          onChange={(e) => setApiSettings({ ...apiSettings, resendApiKey: e.target.value })}
                          placeholder={maskedApiKeys.resendApiKeyMasked ? `Guardada (${maskedApiKeys.resendApiKeyMasked})` : 're_...'}
                          className="w-full bg-[#141b2a] border border-slate-700 rounded-xl pl-3.5 pr-10 py-2 text-xs text-white font-mono focus:outline-none focus:border-orange-500"
                        />
                        <button
                          type="button"
                          onClick={() => setShowKeyPassword({ ...showKeyPassword, resend: !showKeyPassword.resend })}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                          title={showKeyPassword.resend ? 'Ocultar' : 'Ver'}
                        >
                          {showKeyPassword.resend ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-mono text-slate-400">
                        Remitente Oficial de Correos (From Header)
                      </label>
                      <input
                        type="text"
                        value={apiSettings.resendFromEmail}
                        onChange={(e) => setApiSettings({ ...apiSettings, resendFromEmail: e.target.value })}
                        placeholder="Goglite Agencia <contacto@goglite.com>"
                        className="w-full bg-[#141b2a] border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
                      />
                    </div>
                  </div>

                  {apiFeedback['resendApiKey'] && (
                    <div className={`p-2.5 rounded-lg text-xs flex items-center gap-2 ${
                      apiFeedback['resendApiKey'].type === 'success' 
                        ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-300' 
                        : 'bg-rose-500/15 border border-rose-500/30 text-rose-300'
                    }`}>
                      {apiFeedback['resendApiKey'].type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />}
                      <span>{apiFeedback['resendApiKey'].msg}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-800/80">
                    <button
                      type="button"
                      onClick={() => handleTestApi('resend', 'resendApiKey', 'Resend')}
                      disabled={testingService === 'resendApiKey'}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-all"
                    >
                      <Zap className={`w-3.5 h-3.5 text-amber-400 ${testingService === 'resendApiKey' ? 'animate-spin' : ''}`} />
                      <span>{testingService === 'resendApiKey' ? 'Probando...' : 'Probar Conexión'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteApi('resendApiKey', 'Resend')}
                      disabled={savingService === 'resendApiKey'}
                      className="px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/20 text-xs font-semibold flex items-center gap-1.5 transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Eliminar</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSaveIndividualApi('resendApiKey', 'Resend')}
                      disabled={savingService === 'resendApiKey'}
                      className="px-3.5 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>{savingService === 'resendApiKey' ? 'Guardando...' : 'Guardar Clave'}</span>
                    </button>
                  </div>
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
