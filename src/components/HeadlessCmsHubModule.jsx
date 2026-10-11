import React, { useState, useEffect } from 'react';
import {
  Globe,
  Layout,
  Edit,
  Save,
  Check,
  Smartphone,
  Monitor,
  Copy,
  ExternalLink,
  Plus,
  Trash2,
  Sparkles,
  RefreshCw,
  Sliders,
  Eye,
  CheckCircle2,
  FileCode
} from 'lucide-react';

export default function HeadlessCmsHubModule() {
  const [sites, setSites] = useState([]);
  const [selectedSlug, setSelectedSlug] = useState('gruas-andrea');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [previewDevice, setPreviewDevice] = useState('desktop'); // 'desktop' | 'mobile'
  const [copiedApi, setCopiedApi] = useState(false);

  // Form state for editing current site
  const [editableContent, setEditableContent] = useState(null);

  useEffect(() => {
    fetchSites();
  }, []);

  const fetchSites = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/cms/sites');
      if (res.ok) {
        const json = await res.json();
        setSites(json);
        if (json.length > 0) {
          const target = json.find(s => s.slug === selectedSlug) || json[0];
          setSelectedSlug(target.slug);
          setEditableContent(JSON.parse(JSON.stringify(target.contenido)));
        }
      }
    } catch (err) {
      console.error('Error fetching CMS sites:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectSite = (slug) => {
    setSelectedSlug(slug);
    const target = sites.find(s => s.slug === slug);
    if (target) {
      setEditableContent(JSON.parse(JSON.stringify(target.contenido)));
    }
  };

  const handleSaveContent = async () => {
    try {
      setSaving(true);
      const res = await fetch(`/api/cms/content/${selectedSlug}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editableContent)
      });
      if (res.ok) {
        const updated = await res.json();
        setSites(prev => prev.map(s => s.slug === selectedSlug ? updated : s));
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 2500);
      }
    } catch (err) {
      console.error('Error guardando CMS:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleAddService = () => {
    if (!editableContent) return;
    const newService = {
      id: 's-' + Date.now(),
      titulo: 'Nuevo Servicio Comercial',
      descripcion: 'Descripción detallada de la solución ofrecida al cliente.',
      precio: 'Desde $50 USD'
    };
    setEditableContent({
      ...editableContent,
      servicios: [...(editableContent.servicios || []), newService]
    });
  };

  const handleDeleteService = (id) => {
    if (!editableContent) return;
    setEditableContent({
      ...editableContent,
      servicios: editableContent.servicios.filter(s => s.id !== id)
    });
  };

  const handleCopyApiUrl = () => {
    const url = `${window.location.origin}/api/cms/content/${selectedSlug}`;
    navigator.clipboard.writeText(url);
    setCopiedApi(true);
    setTimeout(() => setCopiedApi(false), 2000);
  };

  if (loading || !editableContent) {
    return (
      <div className="flex-1 flex items-center justify-center p-12 text-slate-400">
        <RefreshCw className="w-6 h-6 animate-spin text-orange-500 mr-3" />
        <span>Cargando Hub de Proyectos & Headless CMS...</span>
      </div>
    );
  }

  const currentSite = sites.find(s => s.slug === selectedSlug) || sites[0];

  return (
    <div className="flex-1 overflow-y-auto bg-[#080b11] p-6 text-slate-100 flex flex-col gap-6">
      
      {/* 1. TOP HEADER & HUB CONTROLS */}
      <div className="p-5 rounded-2xl bg-[#0e1320] border border-slate-800/80 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-black text-white">Hub de Proyectos & Headless CMS</h2>
            <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-mono font-semibold">
              $0 USD · Sin WordPress ni Strapi
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Gestor de contenido ligero y API JSON en tiempo real para actualizar páginas web desplegadas sin tocar código.
          </p>
        </div>

        {/* Project Selector & Save */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 bg-[#131926] border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-300">
            <span>Sitio:</span>
            <select
              value={selectedSlug}
              onChange={(e) => handleSelectSite(e.target.value)}
              className="bg-transparent text-white font-bold focus:outline-none"
            >
              {sites.map(s => (
                <option key={s.id} value={s.slug} className="bg-[#131926]">
                  {s.nombre} ({s.pais === 'SV' ? '🇸🇻 SV' : '🇩🇴 DO'})
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleCopyApiUrl}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-all"
          >
            {copiedApi ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedApi ? 'API Copiada' : 'Copiar URL API'}</span>
          </button>

          <button
            onClick={handleSaveContent}
            disabled={saving}
            className="px-4 py-1.5 rounded-xl bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-orange-950 transition-all"
          >
            {saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            <span>{savedSuccess ? '¡Publicado con Éxito!' : 'Publicar Cambios'}</span>
          </button>
        </div>
      </div>

      {/* 2. MAIN LAYOUT: EDITOR (LEFT) + LIVE SIMULATOR (RIGHT) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COLUMN: VISUAL CONTENT EDITOR (6 cols) */}
        <div className="lg:col-span-6 space-y-4">
          
          {/* Identity & Branding Box */}
          <div className="p-4 rounded-xl bg-[#0e1320] border border-slate-800 space-y-3">
            <h3 className="text-xs font-mono uppercase tracking-wider text-slate-400 font-bold flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-orange-400" />
              <span>Identidad & Contacto Directo</span>
            </h3>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Nombre Comercial</label>
                <input
                  type="text"
                  value={editableContent.branding?.nombreMarca || ''}
                  onChange={(e) => setEditableContent({
                    ...editableContent,
                    branding: { ...editableContent.branding, nombreMarca: e.target.value }
                  })}
                  className="w-full bg-[#131926] border border-slate-700 rounded-lg p-2 text-white"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Teléfono / WhatsApp de Cierre</label>
                <input
                  type="text"
                  value={editableContent.branding?.telefonoWhatsApp || ''}
                  onChange={(e) => setEditableContent({
                    ...editableContent,
                    branding: { ...editableContent.branding, telefonoWhatsApp: e.target.value }
                  })}
                  className="w-full bg-[#131926] border border-slate-700 rounded-lg p-2 text-white"
                />
              </div>
            </div>
          </div>

          {/* Hero Section Editor */}
          <div className="p-4 rounded-xl bg-[#0e1320] border border-slate-800 space-y-3">
            <h3 className="text-xs font-mono uppercase tracking-wider text-slate-400 font-bold flex items-center gap-1.5">
              <Layout className="w-3.5 h-3.5 text-orange-400" />
              <span>Sección Hero (Encabezado Principal)</span>
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Badge de Confianza / Urgencia</label>
                <input
                  type="text"
                  value={editableContent.hero?.badge || ''}
                  onChange={(e) => setEditableContent({
                    ...editableContent,
                    hero: { ...editableContent.hero, badge: e.target.value }
                  })}
                  className="w-full bg-[#131926] border border-slate-700 rounded-lg p-2 text-white"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Título de Impacto (H1)</label>
                <textarea
                  rows={2}
                  value={editableContent.hero?.titulo || ''}
                  onChange={(e) => setEditableContent({
                    ...editableContent,
                    hero: { ...editableContent.hero, titulo: e.target.value }
                  })}
                  className="w-full bg-[#131926] border border-slate-700 rounded-lg p-2 text-white font-semibold"
                ></textarea>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Subtítulo / Propuesta de Valor</label>
                <textarea
                  rows={3}
                  value={editableContent.hero?.subtitulo || ''}
                  onChange={(e) => setEditableContent({
                    ...editableContent,
                    hero: { ...editableContent.hero, subtitulo: e.target.value }
                  })}
                  className="w-full bg-[#131926] border border-slate-700 rounded-lg p-2 text-slate-300"
                ></textarea>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Texto del Botón CTA</label>
                <input
                  type="text"
                  value={editableContent.hero?.botonTexto || ''}
                  onChange={(e) => setEditableContent({
                    ...editableContent,
                    hero: { ...editableContent.hero, botonTexto: e.target.value }
                  })}
                  className="w-full bg-[#131926] border border-slate-700 rounded-lg p-2 text-white"
                />
              </div>
            </div>
          </div>

          {/* Services Cards Editor */}
          <div className="p-4 rounded-xl bg-[#0e1320] border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-mono uppercase tracking-wider text-slate-400 font-bold flex items-center gap-1.5">
                <FileCode className="w-3.5 h-3.5 text-orange-400" />
                <span>Servicios Comerciales ({editableContent.servicios?.length || 0})</span>
              </h3>
              <button
                onClick={handleAddService}
                className="px-2.5 py-1 rounded-lg bg-orange-600/20 hover:bg-orange-600/30 text-orange-400 text-xs font-semibold flex items-center gap-1"
              >
                <Plus className="w-3 h-3" />
                <span>+ Agregar Servicio</span>
              </button>
            </div>

            <div className="space-y-3">
              {editableContent.servicios?.map((s, idx) => (
                <div key={s.id || idx} className="p-3 rounded-xl bg-[#131926] border border-slate-800 space-y-2 text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <input
                      type="text"
                      value={s.titulo}
                      onChange={(e) => {
                        const updated = [...editableContent.servicios];
                        updated[idx].titulo = e.target.value;
                        setEditableContent({ ...editableContent, servicios: updated });
                      }}
                      className="flex-1 bg-[#0b0f18] border border-slate-700 rounded p-1.5 text-white font-bold"
                    />
                    <input
                      type="text"
                      value={s.precio}
                      onChange={(e) => {
                        const updated = [...editableContent.servicios];
                        updated[idx].precio = e.target.value;
                        setEditableContent({ ...editableContent, servicios: updated });
                      }}
                      className="w-28 bg-[#0b0f18] border border-slate-700 rounded p-1.5 text-orange-400 font-mono text-right"
                    />
                    <button
                      onClick={() => handleDeleteService(s.id)}
                      className="text-slate-500 hover:text-rose-400 p-1"
                      title="Eliminar servicio"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <textarea
                    rows={2}
                    value={s.descripcion}
                    onChange={(e) => {
                      const updated = [...editableContent.servicios];
                      updated[idx].descripcion = e.target.value;
                      setEditableContent({ ...editableContent, servicios: updated });
                    }}
                    className="w-full bg-[#0b0f18] border border-slate-700 rounded p-1.5 text-slate-300"
                  ></textarea>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: LIVE SIMULATOR (6 cols) */}
        <div className="lg:col-span-6 sticky top-6 space-y-3">
          
          {/* Simulator Bar */}
          <div className="p-3 rounded-xl bg-[#0e1320] border border-slate-800 flex items-center justify-between text-xs">
            <span className="font-bold text-slate-300 flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5 text-orange-400" />
              <span>Simulador del Sitio en Vivo</span>
            </span>

            <div className="flex items-center gap-1 bg-[#131926] p-0.5 rounded-lg border border-slate-700">
              <button
                onClick={() => setPreviewDevice('desktop')}
                className={`p-1.5 rounded transition-colors ${previewDevice === 'desktop' ? 'bg-orange-600 text-white' : 'text-slate-400 hover:text-white'}`}
                title="Vista Escritorio"
              >
                <Monitor className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setPreviewDevice('mobile')}
                className={`p-1.5 rounded transition-colors ${previewDevice === 'mobile' ? 'bg-orange-600 text-white' : 'text-slate-400 hover:text-white'}`}
                title="Vista Móvil"
              >
                <Smartphone className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Rendered Frame */}
          <div className={`mx-auto rounded-2xl bg-[#0a0d14] border border-slate-800 shadow-2xl overflow-hidden transition-all duration-300 ${
            previewDevice === 'mobile' ? 'max-w-[340px]' : 'w-full'
          }`}>
            
            {/* Fake Browser Top Bar */}
            <div className="px-3 py-2 bg-[#121724] border-b border-slate-800 flex items-center gap-2">
              <div className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80"></span>
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80"></span>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80"></span>
              </div>
              <div className="flex-1 bg-[#090c12] rounded-md px-2 py-0.5 text-[10px] font-mono text-slate-400 text-center truncate">
                https://{currentSite.dominio}
              </div>
            </div>

            {/* In-Frame Rendered Content */}
            <div className="p-6 space-y-6 text-slate-100 font-sans">
              
              {/* Site Mini-Navbar */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <span className="font-black text-sm text-white tracking-tight">
                  {editableContent.branding?.nombreMarca || 'Marca'}
                </span>
                <span className="text-[10px] font-mono text-orange-400 font-bold">
                  {editableContent.branding?.telefonoWhatsApp}
                </span>
              </div>

              {/* Hero Banner */}
              <div className="space-y-3 text-center py-4">
                {editableContent.hero?.badge && (
                  <span className="inline-block px-2.5 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-[10px] font-bold">
                    {editableContent.hero.badge}
                  </span>
                )}
                <h1 className="text-base font-black text-white leading-tight">
                  {editableContent.hero?.titulo}
                </h1>
                <p className="text-xs text-slate-400 leading-relaxed max-w-sm mx-auto">
                  {editableContent.hero?.subtitulo}
                </p>
                <div className="pt-2">
                  <button className="px-4 py-2 rounded-xl bg-orange-600 text-white font-bold text-xs shadow-lg shadow-orange-950">
                    {editableContent.hero?.botonTexto || 'Contactar'}
                  </button>
                </div>
              </div>

              {/* Services Mini-Grid */}
              <div className="space-y-2.5 pt-4 border-t border-slate-800/80">
                <div className="text-[11px] font-bold text-slate-300 uppercase tracking-wider text-center">
                  Servicios Disponibles
                </div>
                <div className="space-y-2">
                  {editableContent.servicios?.map((s, i) => (
                    <div key={i} className="p-3 rounded-lg bg-[#111624] border border-slate-800/70 text-xs flex justify-between items-start gap-2">
                      <div>
                        <div className="font-bold text-white text-[11px]">{s.titulo}</div>
                        <div className="text-[10px] text-slate-400 leading-snug mt-0.5">{s.descripcion}</div>
                      </div>
                      <span className="text-[10px] font-mono font-bold text-orange-400 shrink-0">
                        {s.precio}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

            </div>

          </div>

        </div>

      </div>

    </div>
  );
}
