import React, { useState, useEffect } from 'react';
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
  ArrowLeft
} from 'lucide-react';

export default function PublicClientPortal({ token, onBackToAdmin }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [uploadName, setUploadName] = useState('');
  const [uploadCategory, setUploadCategory] = useState('Logotipo');
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  useEffect(() => {
    fetchPortalData();
  }, [token]);

  const fetchPortalData = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/portal/${token}`);
      if (!res.ok) throw new Error('Portal no encontrado o enlace inválido');
      const json = await res.json();
      setData(json);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUploadAsset = async (e) => {
    e.preventDefault();
    if (!uploadName.trim()) return;

    try {
      setUploading(true);
      const res = await fetch(`/api/portal/${token}/upload-assets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: uploadName.trim(),
          categoria: uploadCategory,
          tipo: 'application/octet-stream',
          tamano: '2.4 MB'
        })
      });
      if (res.ok) {
        setUploadSuccess(true);
        setUploadName('');
        await fetchPortalData();
        setTimeout(() => setUploadSuccess(false), 3000);
      }
    } catch (err) {
      alert('Error al registrar archivo: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#080b11] text-slate-200 flex flex-col items-center justify-center p-6">
        <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-sm font-medium text-slate-400">Cargando tu Portal de Cliente seguro...</p>
      </div>
    );
  }

  if (error || !data || !data.lead) {
    return (
      <div className="min-h-screen bg-[#080b11] text-slate-200 flex flex-col items-center justify-center p-6">
        <div className="max-w-md w-full bg-[#0e1320] border border-red-500/30 rounded-2xl p-6 text-center space-y-4">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto" />
          <h2 className="text-lg font-bold text-white">Enlace de Portal No Válido</h2>
          <p className="text-xs text-slate-400">{error || 'El identificador de portal proporcionado no existe o ha expirado.'}</p>
          {onBackToAdmin && (
            <button
              onClick={onBackToAdmin}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold"
            >
              Volver al Panel Principal
            </button>
          )}
        </div>
      </div>
    );
  }

  const { lead, portalConfig, presupuesto, proyecto } = data;
  const isSV = lead.pais === 'SV';

  const milestones = [
    { num: '01', title: 'Diagnóstico & Auditoría', done: true, desc: 'Análisis de visibilidad SERP y oportunidades' },
    { num: '02', title: 'Propuesta & Presupuesto VIP', done: ['propuesta_enviada', 'negociacion', 'ganado'].includes(lead.etapa), desc: 'Alcance técnico y tiers de inversión aprobados' },
    { num: '03', title: 'Contrato SOW & Facturación', done: ['negociacion', 'ganado'].includes(lead.etapa), desc: 'Formalización de términos y proforma oficial' },
    { num: '04', title: 'Recepción de Activos', done: (portalConfig?.archivosSubidos?.length || 0) > 0, desc: 'Logotipo vectorizado, fotos y accesos recibidos' },
    { num: '05', title: 'Desarrollo Nativo & SEO', done: false, desc: 'Programación frontend de alta velocidad sin WordPress' },
    { num: '06', title: 'Lanzamiento & Traspaso', done: false, desc: 'Publicación en producción y entrega de accesos CMS' }
  ];

  return (
    <div className="min-h-screen bg-[#070a0f] text-slate-200 antialiased selection:bg-orange-500 selection:text-white">
      {/* Top Banner Navigation */}
      <header className="border-b border-slate-800/80 bg-[#0c101a]/90 backdrop-blur sticky top-0 z-40 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center font-black text-white text-lg shadow-lg shadow-orange-500/20">
              G
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-white text-base tracking-tight">Goglite Studio</span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full font-mono font-semibold">
                  Portal Seguro SSL
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Área exclusiva para clientes y seguimiento de proyectos</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {onBackToAdmin && (
              <button
                onClick={onBackToAdmin}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Panel Interno</span>
              </button>
            )}
            <a
              href={`https://wa.me/50370001122?text=${encodeURIComponent(`Hola Víctor, te escribo desde el Portal de ${lead.empresa}.`)}`}
              target="_blank"
              rel="noreferrer"
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center gap-2 shadow-lg shadow-emerald-950 transition-all"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Soporte WhatsApp</span>
            </a>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-6xl mx-auto px-6 py-8 space-y-8">
        
        {/* Welcome Hero Box */}
        <div className="rounded-2xl bg-gradient-to-br from-[#101625] to-[#0c101a] border border-slate-800 p-6 sm:p-8 relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-96 h-96 bg-orange-500/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono uppercase tracking-wider text-orange-400 font-bold">
                  Espacio de Trabajo Asignado
                </span>
                <span className="text-slate-600">·</span>
                <span className="text-xs text-slate-400">
                  {isSV ? '🇸🇻 El Salvador' : '🇩🇴 República Dominicana'}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                {lead.empresa}
              </h1>
              <p className="text-sm text-slate-300 max-w-xl">
                Bienvenido, <strong className="text-white">{lead.contacto}</strong>. Aquí puedes monitorear en tiempo real el progreso de tu plataforma web, descargar tus contratos y subir los insumos de tu marca.
              </p>
            </div>

            <div className="bg-[#151c2e] border border-slate-700/60 rounded-xl p-4 min-w-[240px] space-y-2">
              <div className="text-[11px] text-slate-400 uppercase font-mono tracking-wider">Estado Actual</div>
              <div className="text-base font-bold text-white flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>{portalConfig?.faseActual || 'Desarrollo en Proceso'}</span>
              </div>
              <div className="pt-2">
                <div className="flex justify-between text-xs text-slate-400 mb-1">
                  <span>Progreso Global</span>
                  <span className="font-mono font-bold text-orange-400">{portalConfig?.progresoPorcentaje || 35}%</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-orange-500 to-emerald-400 h-2 rounded-full"
                    style={{ width: `${portalConfig?.progresoPorcentaje || 35}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Milestones Checklist */}
        <div className="space-y-4">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-orange-400" />
            <span>Ruta Crítica y Entregables del Proyecto</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {milestones.map((m, idx) => (
              <div
                key={idx}
                className={`p-4 rounded-xl border transition-all ${
                  m.done
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-slate-200'
                    : 'bg-[#0f1422] border-slate-800/80 text-slate-400'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-mono font-bold text-slate-500">{m.num}</span>
                  {m.done ? (
                    <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-1">
                      <Check className="w-3 h-3" /> Hecho
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-500 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> Pendiente
                    </span>
                  )}
                </div>
                <div className={`text-xs font-bold mb-1 ${m.done ? 'text-white' : 'text-slate-300'}`}>
                  {m.title}
                </div>
                <p className="text-[10px] text-slate-500 leading-relaxed">{m.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Two-Column Grid: Legal/Invoices & Asset Upload */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Column 1: Financial & Legal Documents */}
          <div className="space-y-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-orange-400" />
              <span>Documentos & Datos de Pago</span>
            </h2>

            <div className="p-6 rounded-2xl bg-[#0e1320] border border-slate-800 space-y-4 shadow-xl">
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#141b2b] border border-slate-700/60">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-orange-500/15 text-orange-400 flex items-center justify-center">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white">Presupuesto VIP & Plan de Trabajo</div>
                    <div className="text-[11px] text-slate-400">PDF Oficial de 3 Páginas con Alcance</div>
                  </div>
                </div>
                <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-md border border-emerald-500/20">
                  Aprobado
                </span>
              </div>

              {/* Local Banking Instructions */}
              <div className="p-4 rounded-xl bg-[#090d15] border border-slate-800/80 space-y-3">
                <div className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono">
                  Instrucciones de Pago Local Oficial
                </div>
                {isSV ? (
                  <div className="space-y-1.5 text-xs text-slate-400 font-mono">
                    <div className="text-white font-semibold">🇸🇻 El Salvador (USD):</div>
                    <div>· Banco: <strong className="text-slate-200">Banco Agrícola El Salvador</strong></div>
                    <div>· Cuenta Corriente: <strong className="text-slate-200">0054-019283-01</strong></div>
                    <div>· A nombre de: <strong className="text-slate-200">Goglite Studio S.A. de C.V.</strong></div>
                    <div className="text-[11px] text-slate-500">Acepta transferencias UNI / Transfer365 al instante</div>
                  </div>
                ) : (
                  <div className="space-y-1.5 text-xs text-slate-400 font-mono">
                    <div className="text-white font-semibold">🇩🇴 República Dominicana (DOP / USD):</div>
                    <div>· Banco: <strong className="text-slate-200">Banreservas / Banco BHD</strong></div>
                    <div>· Cuenta Corriente: <strong className="text-slate-200">960-239481-2</strong></div>
                    <div>· A nombre de: <strong className="text-slate-200">Goglite Studio SRL</strong></div>
                    <div className="text-[11px] text-slate-500">Acepta pagos vía ACH / Pagos al Instante DGII</div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Column 2: Upload Brand Assets */}
          <div className="space-y-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Upload className="w-4 h-4 text-orange-400" />
              <span>Carga de Activos de tu Marca</span>
            </h2>

            <div className="p-6 rounded-2xl bg-[#0e1320] border border-slate-800 space-y-4 shadow-xl">
              <p className="text-xs text-slate-400">
                Sube tu logotipo (preferiblemente en formato vectorial SVG o PNG transparente), manual de identidad o fotos de alta calidad para integrarlos a tu plataforma web.
              </p>

              <form onSubmit={handleUploadAsset} className="space-y-3">
                <div>
                  <label className="block text-[11px] font-mono text-slate-400 uppercase mb-1">Nombre o Descripción del Archivo</label>
                  <input
                    type="text"
                    value={uploadName}
                    onChange={(e) => setUploadName(e.target.value)}
                    placeholder="Ej. Logotipo_Oficial_Vector.svg o Fotos_Instalaciones.zip"
                    className="w-full bg-[#141b2b] border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono text-slate-400 uppercase mb-1">Categoría</label>
                  <select
                    value={uploadCategory}
                    onChange={(e) => setUploadCategory(e.target.value)}
                    className="w-full bg-[#141b2b] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
                  >
                    <option value="Logotipo">Logotipo & Paleta de Colores</option>
                    <option value="Fotografías">Fotografías de Productos o Equipo</option>
                    <option value="Manual de Marca">Manual de Identidad Corporativa</option>
                    <option value="Accesos / Dominios">Accesos de Hosting o Dominio</option>
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={uploading || !uploadName.trim()}
                  className="w-full py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white font-semibold text-xs transition-all shadow-lg shadow-orange-950 flex items-center justify-center gap-2"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>{uploading ? 'Registrando...' : 'Subir Insumo de Marca'}</span>
                </button>

                {uploadSuccess && (
                  <div className="p-2.5 rounded-lg bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs text-center font-medium">
                    ✓ Archivo registrado con éxito. El equipo técnico ha sido notificado.
                  </div>
                )}
              </form>

              {/* Uploaded Files Table */}
              <div className="pt-2">
                <div className="text-[11px] font-mono text-slate-400 uppercase mb-2">Archivos Registrados en tu Proyecto</div>
                <div className="space-y-1.5 max-h-40 overflow-y-auto">
                  {(portalConfig?.archivosSubidos || []).length === 0 ? (
                    <div className="text-xs text-slate-500 italic p-3 text-center bg-slate-900/40 rounded-lg">
                      No has subido insumos aún. Utiliza el formulario arriba.
                    </div>
                  ) : (
                    portalConfig.archivosSubidos.map((arch) => (
                      <div key={arch.id} className="flex items-center justify-between p-2.5 rounded-lg bg-[#141b2b] border border-slate-800 text-xs">
                        <div className="flex items-center gap-2 truncate">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span className="text-white font-medium truncate">{arch.nombre}</span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono shrink-0 ml-2">
                          {arch.categoria || 'Recibido'}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>
          </div>

        </div>

      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 mt-12 py-6 text-center text-xs text-slate-500">
        Goglite Studio Agency · Plataforma de Servicios Digitales · San Salvador & Santo Domingo
      </footer>
    </div>
  );
}
