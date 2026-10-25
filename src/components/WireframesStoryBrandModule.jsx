import React, { useState, useEffect } from 'react';
import apiClient from '../services/apiClient';
import { getStoredProyectos } from '../services/contractGenerator';
import {
  Layout,
  Sparkles,
  Copy,
  Check,
  Save,
  Eye,
  Smartphone,
  Monitor,
  ChevronRight,
  Shield,
  Layers,
  Heart,
  Award,
  ListOrdered,
  Zap,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  MessageSquare,
  PhoneCall,
  Star,
  ExternalLink,
  Code2,
  FileText,
  UserCheck
} from 'lucide-react';

export default function WireframesStoryBrandModule({ selectedCountry = 'SV', externalSelectedProyectoId = null }) {
  const [proyectos, setProyectos] = useState([]);
  const [selectedProyectoId, setSelectedProyectoId] = useState(externalSelectedProyectoId || '');
  const [activeWireframe, setActiveWireframe] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (externalSelectedProyectoId) {
      setSelectedProyectoId(externalSelectedProyectoId);
    }
  }, [externalSelectedProyectoId]);

  // Tabs: 'storybrand' | 'editor_wireframe' | 'preview_visual'
  const [activeTab, setActiveTab] = useState('storybrand');

  // Preview device mode: 'desktop' | 'mobile'
  const [deviceMode, setDeviceMode] = useState('desktop');

  // Notifications
  const [copiedScript, setCopiedScript] = useState(false);
  const [savedNotice, setSavedNotice] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    let projs = getStoredProyectos();
    try {
      // 1. Fetch Proyectos
      const resProj = await apiClient.get('/api/proyectos');
      const cType = resProj.headers.get('content-type') || '';
      if (resProj.ok && cType.includes('application/json')) {
        const apiProjs = await resProj.json();
        if (Array.isArray(apiProjs) && apiProjs.length > 0) {
          projs = apiProjs;
        }
      }
    } catch (err) {
      console.warn('Error fetching initial projects:', err);
    } finally {
      setProyectos(projs);
      if (projs.length > 0) {
        const firstId = projs[0].id;
        setSelectedProyectoId(firstId);
        fetchWireframeForProject(firstId);
      }
      setLoading(false);
    }
  };

  const getLocalWireframes = () => {
    try {
      const raw = localStorage.getItem('goglite_wireframes_v1');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  };

  const saveLocalWireframe = (wf) => {
    try {
      const list = getLocalWireframes();
      const idx = list.findIndex(w => w.id === wf.id || w.proyectoId === wf.proyectoId);
      if (idx !== -1) {
        list[idx] = wf;
      } else {
        list.unshift(wf);
      }
      localStorage.setItem('goglite_wireframes_v1', JSON.stringify(list));
    } catch (e) {}
  };

  // Motor Inteligente de StoryBrand en Cliente (Google Gemini Flash Free Tier + Fallback Determinista)
  const generateClientSideStoryBrand = async (proyecto) => {
    const cliente = proyecto.cliente || {};
    const nombreComercial = proyecto.onboarding?.datos?.nombreComercial || cliente.empresa || cliente.nombre || 'Negocio';
    const slogan = proyecto.onboarding?.datos?.slogan || 'Soluciones profesionales y atención de primera clase';
    const actividad = cliente.actividad || 'Servicios Especializados';
    const telefono = proyecto.onboarding?.datos?.telefonoEmergencia || cliente.telefono || '';
    const whatsapp = proyecto.onboarding?.datos?.whatsappVentas || cliente.telefono || '';
    const pais = proyecto.pais || 'SV';
    const paisNombre = pais === 'DO' ? 'República Dominicana' : 'El Salvador';
    const ubicacion = cliente.ubicacion || (pais === 'DO' ? 'Santo Domingo' : 'San Salvador');

    const modulosContratados = Array.isArray(proyecto.modulos) && proyecto.modulos.length > 0
      ? proyecto.modulos.map(m => `- ${m.titulo}: ${m.descripcion || ''}`).join('\n')
      : '- Plataforma Web Mobile-First\n- Canales de Cierre & WhatsApp 24/7\n- Posicionamiento en Google Maps & SEO Local';

    const onboardingDatos = proyecto.onboarding?.datos || {};
    const insumosOnboarding = Object.entries(onboardingDatos)
      .filter(([_, v]) => typeof v === 'string' && v.trim().length > 0)
      .map(([k, v]) => `- ${k}: ${v}`)
      .join('\n') || '- Datos base cargados en contrato SOW';

    // Clave de API de Gemini (Leída de variables de entorno seguras o Backend en Render)
    const geminiKey = (typeof import.meta !== 'undefined' && import.meta.env && (import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.GEMINI_API_KEY)) || (typeof window !== 'undefined' && window.__GOGLITE_GEMINI_KEY) || '';

    if (geminiKey && geminiKey.trim()) {
      const prompt = `Eres el Director Creativo de Copywriting de la agencia "Goglite" y un experto de clase mundial en el Framework StoryBrand de Donald Miller.
Diseña la estrategia completa de copywriting de alta conversión para este cliente:
EMPRESA / MARCA: "${nombreComercial}"
NICHO / ACTIVIDAD: "${actividad}"
PAÍS / UBICACIÓN: "${paisNombre}" (Zona: ${ubicacion})
TELÉFONO OFICIAL: "${telefono}"
WHATSAPP COMERCIAL: "${whatsapp}"
MÓDULOS CONTRATADOS EN SOW:
${modulosContratados}
INSUMOS DEL CLIENTE (FASE 3):
${insumosOnboarding}

REGLAS DE COPYWRITING STORYBRAND:
1. El cliente es el HÉROE; la empresa es la GUÍA (Empatía + Autoridad).
2. Tono humano, persuasivo, adaptado a ${paisNombre}. Cero frases genéricas vacías ("somos líderes", "los mejores").
3. Prueba de los 5 segundos en el Hero: Muy claro qué hacen, qué resuelven y cómo contactar por WhatsApp o llamada directa.
4. Genera las 7 secciones completas y detalladas listas para maquetar en web.

Devuelve EXCLUSIVAMENTE un JSON válido (sin markdown) con esta estructura exacta:
{
  "storyBrand": {
    "heroe": { "identidad": "...", "deseo": "..." },
    "problema": { "externo": "...", "interno": "...", "filosofico": "..." },
    "guia": { "empatia": "...", "autoridad": "..." },
    "plan": { "paso1": "1. ...", "paso2": "2. ...", "paso3": "3. ..." },
    "llamadaAccion": { "directa": "...", "transitoria": "..." },
    "exito": "...",
    "fracasoEvitado": "..."
  },
  "seccionesWireframe": [
    {
      "id": "sec-1",
      "tipo": "hero",
      "etiqueta": "Sección 1: Cabecera Hero (Prueba de los 5 Segundos)",
      "titular": "...",
      "subtitulo": "...",
      "ctaPrincipal": "...",
      "ctaSecundario": "...",
      "insigniasConfianza": ["...", "...", "..."],
      "layout": "split_hero_cta"
    },
    {
      "id": "sec-2",
      "tipo": "problema",
      "etiqueta": "Sección 2: El Problema (Puntos de Dolor)",
      "titular": "...",
      "subtitulo": "...",
      "puntosDolor": [
        { "titulo": "...", "desc": "..." },
        { "titulo": "...", "desc": "..." },
        { "titulo": "...", "desc": "..." }
      ],
      "layout": "3_cards_pain_points"
    },
    {
      "id": "sec-3",
      "tipo": "solucion",
      "etiqueta": "Sección 3: Servicios & Soluciones",
      "titular": "...",
      "subtitulo": "...",
      "servicios": [
        { "nombre": "...", "detalle": "..." },
        { "nombre": "...", "detalle": "..." },
        { "nombre": "...", "detalle": "..." }
      ],
      "layout": "4_services_grid"
    },
    {
      "id": "sec-4",
      "tipo": "guia",
      "etiqueta": "Sección 4: La Guía (Empatía + Autoridad)",
      "titular": "...",
      "subtitulo": "...",
      "metricas": [
        { "valor": "...", "label": "..." },
        { "valor": "...", "label": "..." },
        { "valor": "...", "label": "..." }
      ],
      "layout": "guide_empathy_stats"
    },
    {
      "id": "sec-5",
      "tipo": "plan",
      "etiqueta": "Sección 5: El Plan en 3 Pasos (Sencillo y Transparente)",
      "titular": "...",
      "subtitulo": "...",
      "pasos": [
        { "num": "1", "titulo": "...", "desc": "..." },
        { "num": "2", "titulo": "...", "desc": "..." },
        { "num": "3", "titulo": "...", "desc": "..." }
      ],
      "layout": "3_step_horizontal"
    },
    {
      "id": "sec-6",
      "tipo": "social_proof",
      "etiqueta": "Sección 6: Prueba Social & Testimonios",
      "titular": "...",
      "subtitulo": "...",
      "testimonios": [
        { "cliente": "...", "texto": "...", "rating": 5 },
        { "cliente": "...", "texto": "...", "rating": 5 }
      ],
      "layout": "testimonials_carousel"
    },
    {
      "id": "sec-7",
      "tipo": "cta_final",
      "etiqueta": "Sección 7: Llamada a la Acción Final",
      "titular": "...",
      "subtitulo": "...",
      "ctaPrincipal": "...",
      "ctaSecundario": "...",
      "layout": "high_contrast_closing_banner"
    }
  ]
}`;

      const models = ['gemini-3.5-flash', 'gemini-3.1-flash-lite', 'gemini-flash-lite-latest'];
      for (const m of models) {
        try {
          const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${geminiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: {
                temperature: 0.7,
                responseMimeType: 'application/json'
              }
            })
          });

          if (res.ok) {
            const data = await res.json();
            let raw = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
            raw = raw.replace(/```json/gi, '').replace(/```/g, '').trim();
            const parsed = JSON.parse(raw);
            if (parsed.storyBrand && Array.isArray(parsed.seccionesWireframe)) {
              return {
                id: 'wf-' + proyecto.id,
                proyectoId: proyecto.id,
                clienteNombre: cliente.nombre,
                empresa: nombreComercial,
                nicho: actividad,
                pais,
                fechaActualizacion: new Date().toISOString().split('T')[0],
                aiGenerated: true,
                aiModel: m,
                storyBrand: parsed.storyBrand,
                seccionesWireframe: parsed.seccionesWireframe
              };
            }
          }
        } catch (e) {
          console.warn(`[Client StoryBrand AI] Error en ${m}:`, e);
        }
      }
    }

    // Fallback Determinista
    return {
      id: 'wf-' + proyecto.id,
      proyectoId: proyecto.id,
      clienteNombre: cliente.nombre,
      empresa: nombreComercial,
      nicho: actividad,
      pais,
      fechaActualizacion: new Date().toISOString().split('T')[0],
      aiGenerated: false,
      storyBrand: {
        heroe: {
          identidad: `Pacientes y familias en ${ubicacion} que buscan atención dental confiable, indolora y con tecnología moderna.`,
          deseo: `Tener una sonrisa sana, estética y comer con total seguridad sin temor al dolor ni a presupuestos excesivos.`
        },
        problema: {
          externo: `Requieren tratamientos dentales de alta calidad y les preocupa el dolor, citas demoradas o clínicas informales.`,
          interno: `Ansiedad dental por malas experiencias pasadas o temor a cotizaciones sorpresa sin garantía.`,
          filosofico: `Toda persona merece sonreír con orgullo y recibir atención médica dental honesta, digna y sin estrés.`
        },
        guia: {
          empatia: `En ${nombreComercial} entendemos lo valiosa que es tu tranquilidad. Eliminamos el miedo al dentista con atención humana y cálida.`,
          autoridad: `Especialistas certificados, tecnología digital avanzada y cientos de sonrisas recuperadas con satisfacción total.`
        },
        plan: {
          paso1: `1. Escríbenos a WhatsApp y elige el horario de tu preferencia.`,
          paso2: `2. Diagnóstico integral con cámara intraoral y presupuesto transparente sin letras pequeñas.`,
          paso3: `3. Disfruta de un tratamiento cómodo, seguro y con garantía de durabilidad.`
        },
        llamadaAccion: {
          directa: `Agendar Cita en WhatsApp (${whatsapp || telefono})`,
          transitoria: `Consultar Costos y Promociones por Chat`
        },
        exito: `Recuperas la seguridad de sonreír, masticar sin molestias y la confianza en tu salud bucal para siempre.`,
        fracasoEvitado: `Evitas dolores agudos de emergencia, pérdidas dentales por descuido y gastos desorbitados por tratamientos mal realizados.`
      },
      seccionesWireframe: [
        {
          id: 'sec-1',
          tipo: 'hero',
          etiqueta: 'Sección 1: Cabecera Hero (Prueba de los 5 Segundos)',
          titular: `${nombreComercial}: Tu Sonrisa en Manos de Expertos`,
          subtitulo: `Atención odontológica avanzada y sin dolor en ${ubicacion}. Diseños de sonrisa, ortodoncia, implantes y odontología integral con facilidades de pago.`,
          ctaPrincipal: `Agendar Cita en WhatsApp`,
          ctaSecundario: `Llamar a Clínica (${telefono || '+503 2289-4411'})`,
          insigniasConfianza: ['⚡ Citas Puntuales', '🛡️ Tecnología Sin Dolor', '⭐ 5.0 en Google Maps'],
          layout: 'split_hero_cta'
        },
        {
          id: 'sec-2',
          tipo: 'problema',
          etiqueta: 'Sección 2: El Problema (Puntos de Dolor)',
          titular: '¿Posponiendo tu Visita al Dentista por Temor al Dolor o al Costo?',
          subtitulo: 'Sabemos que ir al odontólogo puede causar incertidumbre. En nuestra clínica dejamos atrás esos miedos:',
          puntosDolor: [
            { titulo: 'Miedo al Dolor', desc: 'Protocolos de anestesia suave y tecnología mínimamente invasiva.' },
            { titulo: 'Precios Ocultos', desc: 'Presupuestos claros desde el primer día, sin costos sorpresa.' },
            { titulo: 'Falta de Tiempo', desc: 'Atención ágil, sin salas de espera interminables ni demoras.' }
          ],
          layout: '3_cards_pain_points'
        },
        {
          id: 'sec-3',
          tipo: 'solucion',
          etiqueta: 'Sección 3: Servicios & Especialidades Odontológicas',
          titular: 'Tratamientos Integrales para Toda tu Familia',
          subtitulo: 'Todo lo que necesitas para tu salud y estética dental en un solo lugar.',
          servicios: [
            { nombre: 'Ortodoncia & Alineadores Invisibles', detalle: 'Corrige la posición de tus dientes con opciones cómodas y discretas.' },
            { nombre: 'Implantes Dentales & Rehabilitación', detalle: 'Recupera piezas perdidas con prótesis fijas idénticas al diente natural.' },
            { nombre: 'Diseño de Sonrisa & Blanqueamiento', detalle: 'Dientes más blancos y armónicos para potenciar tu seguridad.' },
            { nombre: 'Odontopediatría & Limpiezas Profundas', detalle: 'Cuidado preventivo cariñoso para niños y chequeos periódicos de adultos.' }
          ],
          layout: '4_services_grid'
        },
        {
          id: 'sec-4',
          tipo: 'guia',
          etiqueta: 'Sección 4: La Guía (Empatía + Autoridad)',
          titular: `Respaldados por Cientos de Pacientes Satisfechos`,
          subtitulo: `Nos dedicamos a cuidar tu salud bucodental con vocación, ética y los más altos estándares sanitarios.`,
          metricas: [
            { valor: '+10 Años', label: 'Cuidando Sonrisas' },
            { valor: '99.4%', label: 'Pacientes Sin Dolor' },
            { valor: '100%', label: 'Garantía de Satisfacción' }
          ],
          layout: 'guide_empathy_stats'
        },
        {
          id: 'sec-5',
          tipo: 'plan',
          etiqueta: 'Sección 5: El Plan en 3 Pasos',
          titular: 'Comenzar es Fácil y Rápido',
          subtitulo: 'Tu nueva sonrisa está a solo 3 pasos de distancia:',
          pasos: [
            { num: '1', titulo: 'Escríbenos por WhatsApp', desc: 'Elige el día y hora que mejor se adapte a tu agenda.' },
            { num: '2', titulo: 'Evaluación y Diagnóstico', desc: 'Revisamos tu caso con honestidad y te presentamos tu plan.' },
            { num: '3', titulo: 'Sonríe con Confianza', desc: 'Inicias tu tratamiento en un ambiente relajado y profesional.' }
          ],
          layout: '3_step_horizontal'
        },
        {
          id: 'sec-6',
          tipo: 'social_proof',
          etiqueta: 'Sección 6: Opiniones de Pacientes Reales',
          titular: 'Historias que Inspiran Confianza',
          subtitulo: 'Lee lo que opinan quienes ya transformaron su sonrisa con nosotros:',
          testimonios: [
            { cliente: 'Mariana G. (San Salvador)', texto: 'Tenía pánico a los dentistas. Desde que llegué aquí el trato fue increíble y el tratamiento de ortodoncia superó mis expectativas.', rating: 5 },
            { cliente: 'Carlos R. (San Salvador)', texto: 'Puntualidad británica, instalaciones impecables y precios justos. Muy recomendados para toda la familia.', rating: 5 }
          ],
          layout: 'testimonials_carousel'
        },
        {
          id: 'sec-7',
          tipo: 'cta_final',
          etiqueta: 'Sección 7: Llamado a la Acción Directo',
          titular: `¿Listo para Lucir la Sonrisa que Siempre Has Querido?`,
          subtitulo: `Agenda tu valoración hoy mismo. Cupos limitados por día para asegurar atención personalizada.`,
          ctaPrincipal: `Agendar por WhatsApp en 1 Minuto`,
          ctaSecundario: `Llamar a Recepción`,
          layout: 'high_contrast_closing_banner'
        }
      ]
    };
  };

  const fetchWireframeForProject = async (projId) => {
    // 1. Revisar si ya está guardado en localStorage
    const localWfs = getLocalWireframes();
    const localFound = localWfs.find(w => w.proyectoId === projId);
    if (localFound) {
      setActiveWireframe(localFound);
    }

    // 2. Sincronizar con backend si está disponible
    try {
      const res = await apiClient.get(`/api/wireframes/proyecto/${projId}`);
      const cType = res.headers.get('content-type') || '';
      if (res.ok && cType.includes('application/json')) {
        const data = await res.json();
        if (data) {
          setActiveWireframe(data);
          saveLocalWireframe(data);
          return;
        }
      }
    } catch (err) {
      // Backend offline
    }

    // Si no existía ni local ni en backend, generar
    if (!localFound) {
      handleGenerateForProject(projId);
    }
  };

  const handleSelectProject = (projId) => {
    setSelectedProyectoId(projId);
    fetchWireframeForProject(projId);
  };

  const handleGenerateForProject = async (projId) => {
    const pId = projId || selectedProyectoId;
    if (!pId) return;

    setIsGenerating(true);
    let generatedWireframe = null;

    // 1. Intentar llamar al backend oficial
    try {
      const res = await apiClient.post(`/api/wireframes/generar/${pId}`);
      const cType = res.headers.get('content-type') || '';
      if (res.ok && cType.includes('application/json')) {
        const data = await res.json();
        if (data.wireframe) {
          generatedWireframe = data.wireframe;
        }
      }
    } catch (err) {
      console.warn('Backend offline o sin proxy, ejecutando motor IA resiliente:', err);
    }

    // 2. Si el backend no respondió, ejecutar generación con IA o plantilla en cliente
    if (!generatedWireframe) {
      const proj = proyectos.find(p => p.id === pId) || { id: pId };
      generatedWireframe = await generateClientSideStoryBrand(proj);
    }

    if (generatedWireframe) {
      setActiveWireframe(generatedWireframe);
      saveLocalWireframe(generatedWireframe);
      showNotification();
    }
    setIsGenerating(false);
  };

  const handleSaveWireframe = async () => {
    if (!activeWireframe) return;
    saveLocalWireframe(activeWireframe);
    try {
      await apiClient.post('/api/wireframes', activeWireframe);
    } catch (err) {
      console.warn('Wireframe guardado localmente (Backend offline)');
    }
    showNotification();
  };

  const showNotification = () => {
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2500);
  };

  // Helpers to update StoryBrand fields
  const updateStoryBrand = (category, field, val) => {
    setActiveWireframe(prev => ({
      ...prev,
      storyBrand: {
        ...prev.storyBrand,
        [category]: {
          ...prev.storyBrand?.[category],
          [field]: val
        }
      }
    }));
  };

  // Helpers to update Section fields
  const updateSection = (secIndex, field, val) => {
    setActiveWireframe(prev => {
      const copy = { ...prev };
      copy.seccionesWireframe = [...copy.seccionesWireframe];
      copy.seccionesWireframe[secIndex] = {
        ...copy.seccionesWireframe[secIndex],
        [field]: val
      };
      return copy;
    });
  };

  // Copy Complete Copywriting Blueprint as Markdown
  const copyCompleteBlueprint = () => {
    if (!activeWireframe) return;
    const sb = activeWireframe.storyBrand || {};
    const secs = activeWireframe.seccionesWireframe || [];

    let md = `# BLUEPRINT STORYBRAND & WIREFRAME UX — ${activeWireframe.empresa}\n\n`;
    md += `**Cliente:** ${activeWireframe.clienteNombre} | **Nicho:** ${activeWireframe.nicho} | **Fecha:** ${activeWireframe.fechaActualizacion}\n\n`;
    md += `## 1. GUION STORYBRAND (BRANDSCRIPT)\n\n`;
    md += `* **El Héroe:** ${sb.heroe?.identidad} — Deseo: ${sb.heroe?.deseo}\n`;
    md += `* **El Problema:** Externo: ${sb.problema?.externo} | Interno: ${sb.problema?.interno} | Filosófico: ${sb.problema?.filosofico}\n`;
    md += `* **El Guía:** Empatía: "${sb.guia?.empatia}" | Autoridad: "${sb.guia?.autoridad}"\n`;
    md += `* **El Plan (3 Pasos):**\n  1. ${sb.plan?.paso1}\n  2. ${sb.plan?.paso2}\n  3. ${sb.plan?.paso3}\n`;
    md += `* **Llamadas a la Acción:** Directa: "${sb.llamadaAccion?.directa}" | Transitoria: "${sb.llamadaAccion?.transitoria}"\n`;
    md += `* **El Éxito:** ${sb.exito}\n`;
    md += `* **El Fracaso Evitado:** ${sb.fracasoEvitado}\n\n`;

    md += `## 2. ARQUITECTURA DE SECCIONES WIREFRAME UX (7 SECCIONES)\n\n`;
    secs.forEach((s, idx) => {
      md += `### [${s.etiqueta}]\n`;
      md += `* **Titular Principal:** ${s.titular}\n`;
      md += `* **Subtítulo / Bajada:** ${s.subtitulo}\n`;
      if (s.ctaPrincipal) md += `* **Botón Primario:** ${s.ctaPrincipal}\n`;
      if (s.ctaSecundario) md += `* **Botón Secundario:** ${s.ctaSecundario}\n\n`;
    });

    navigator.clipboard.writeText(md);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2000);
  };

  const selectedProj = proyectos.find(p => p.id === selectedProyectoId);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      
      {/* Toast Notice */}
      {savedNotice && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-emerald-600 text-white px-4 py-2.5 rounded-xl shadow-2xl font-semibold text-xs animate-bounce">
          <Check className="w-4 h-4" />
          <span>¡Estrategia StoryBrand y Wireframe guardados con éxito!</span>
        </div>
      )}

      {/* Top Banner / Hero */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-[#0d121f] via-[#101726] to-[#141b2d] border border-orange-500/20 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-orange-400 uppercase tracking-wider mb-1">
              <Layout className="w-4 h-4 text-orange-400" />
              <span>Módulo 4 · Estrategia StoryBrand & Wireframes UX</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-white">
              Arquitectura Web, Copywriting de Conversión & Blueprints
            </h1>
            <p className="text-xs text-slate-400 max-w-2xl mt-1 leading-relaxed">
              Diseña la estructura de alta conversión en 7 secciones basada en el framework StoryBrand de Donald Miller. 
              Convierte visitantes en clientes eliminando la ambigüedad y asegurando la prueba de los 5 segundos.
            </p>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              {activeWireframe?.aiGenerated ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-emerald-500/15 border border-emerald-500/30 text-emerald-300">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                  Redactado con Google AI ({activeWireframe.aiModel || 'Gemini Flash'})
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono text-slate-400 bg-slate-800/80 border border-slate-700/80">
                  Plantilla StoryBrand Base
                </span>
              )}
            </div>
          </div>

          {/* Action Buttons & Project Switcher */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {/* Project Dropdown */}
            <select
              value={selectedProyectoId}
              onChange={(e) => handleSelectProject(e.target.value)}
              className="px-3 py-2 rounded-xl bg-[#080b11] border border-slate-800 text-xs font-bold text-slate-200 focus:outline-none focus:border-orange-500"
            >
              {proyectos.map(p => (
                <option key={p.id} value={p.id}>
                  {p.codigo} · {p.cliente?.empresa || p.cliente?.nombre}
                </option>
              ))}
            </select>

            <button
              onClick={() => handleGenerateForProject()}
              disabled={isGenerating}
              className="px-3.5 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-1.5 shadow-glow-sm transition-all"
              title="Regenerar narrativa StoryBrand con IA"
            >
              <Sparkles className="w-4 h-4" />
              <span>{isGenerating ? 'Generando...' : 'Regenerar con IA'}</span>
            </button>

            <button
              onClick={copyCompleteBlueprint}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs flex items-center gap-1.5 transition-colors"
              title="Copiar guion completo a portapapeles"
            >
              {copiedScript ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedScript ? '¡Copiado!' : 'Copiar Blueprint'}</span>
            </button>

            <button
              onClick={handleSaveWireframe}
              className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md transition-all"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Guardar</span>
            </button>
          </div>
        </div>

        {/* Client Subhead Context */}
        {selectedProj && (
          <div className="mt-4 pt-4 border-t border-slate-800/80 flex flex-wrap items-center gap-4 text-xs">
            <div className="text-slate-400">
              <span className="text-slate-500">Cliente Activo:</span>{' '}
              <strong className="text-slate-200">{selectedProj.cliente?.nombre}</strong> ({selectedProj.cliente?.empresa})
            </div>
            <div className="text-slate-400">
              <span className="text-slate-500">Nicho / Especialidad:</span>{' '}
              <strong className="text-orange-400">{selectedProj.cliente?.actividad}</strong>
            </div>
            <div className="text-slate-400">
              <span className="text-slate-500">Ubicación:</span>{' '}
              <strong className="text-slate-200">{selectedProj.cliente?.ubicacion}</strong>
            </div>
          </div>
        )}
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
        <div className="flex items-center gap-2">
          {[
            { id: 'storybrand', label: '1. BrandScript StoryBrand (7 Partes)', icon: Sparkles },
            { id: 'editor_wireframe', label: '2. Arquitectura de Secciones (7 Bloques)', icon: Layers },
            { id: 'preview_visual', label: '3. Maqueta Wireframe UX (Visual)', icon: Eye }
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all ${
                  activeTab === tab.id
                    ? 'bg-orange-600/20 text-orange-400 border border-orange-500/30'
                    : 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-200'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Device Switcher (Visible on preview) */}
        {activeTab === 'preview_visual' && (
          <div className="flex items-center gap-1 bg-[#101522] p-1 rounded-lg border border-slate-800 text-xs">
            <button
              onClick={() => setDeviceMode('desktop')}
              className={`p-1.5 rounded flex items-center gap-1 ${
                deviceMode === 'desktop' ? 'bg-orange-600 text-white font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Monitor className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Desktop</span>
            </button>
            <button
              onClick={() => setDeviceMode('mobile')}
              className={`p-1.5 rounded flex items-center gap-1 ${
                deviceMode === 'mobile' ? 'bg-orange-600 text-white font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Móvil</span>
            </button>
          </div>
        )}
      </div>

      {/* =========================================================================
          PESTAÑA 1: BRANDSCRIPT STORYBRAND (LAS 7 PARTES)
          ========================================================================= */}
      {activeTab === 'storybrand' && activeWireframe && (
        <div className="space-y-6">
          <div className="p-4 rounded-xl bg-orange-500/10 border border-orange-500/20 text-xs text-orange-300 flex items-start gap-3">
            <Sparkles className="w-4 h-4 shrink-0 mt-0.5 text-orange-400" />
            <div>
              <strong>Principio Fundamental de Donald Miller:</strong> "El cliente siempre es el héroe de la historia, no tu marca. Tu marca es el Guía (como Yoda o Haymitch) que le brinda empatía, autoridad y un plan para triunfar."
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* 1. EL HÉROE */}
            <div className="p-5 rounded-2xl bg-[#0d121c] border border-slate-800 space-y-3">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-xs font-bold font-mono">1</span>
                <h3 className="text-sm font-bold text-white">El Personaje / El Héroe</h3>
              </div>
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">¿Quién es el cliente y qué desea alcanzar?</label>
                <textarea
                  rows={2}
                  value={activeWireframe.storyBrand?.heroe?.identidad || ''}
                  onChange={e => updateStoryBrand('heroe', 'identidad', e.target.value)}
                  className="w-full p-2.5 rounded-lg bg-[#080b11] border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-orange-500"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Deseo Principal / Objetivo Concreto:</label>
                <input
                  type="text"
                  value={activeWireframe.storyBrand?.heroe?.deseo || ''}
                  onChange={e => updateStoryBrand('heroe', 'deseo', e.target.value)}
                  className="w-full p-2 rounded-lg bg-[#080b11] border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-orange-500"
                />
              </div>
            </div>

            {/* 2. EL PROBLEMA */}
            <div className="p-5 rounded-2xl bg-[#0d121c] border border-slate-800 space-y-3">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center text-xs font-bold font-mono">2</span>
                <h3 className="text-sm font-bold text-white">Tiene un Problema (3 Niveles)</h3>
              </div>
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Problema Externo (La situación física):</label>
                <input
                  type="text"
                  value={activeWireframe.storyBrand?.problema?.externo || ''}
                  onChange={e => updateStoryBrand('problema', 'externo', e.target.value)}
                  className="w-full p-2 rounded-lg bg-[#080b11] border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-orange-500"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Problema Interno (Cómo se siente):</label>
                <input
                  type="text"
                  value={activeWireframe.storyBrand?.problema?.interno || ''}
                  onChange={e => updateStoryBrand('problema', 'interno', e.target.value)}
                  className="w-full p-2 rounded-lg bg-[#080b11] border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-orange-500"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Problema Filosófico (Por qué está mal):</label>
                <input
                  type="text"
                  value={activeWireframe.storyBrand?.problema?.filosofico || ''}
                  onChange={e => updateStoryBrand('problema', 'filosofico', e.target.value)}
                  className="w-full p-2 rounded-lg bg-[#080b11] border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-orange-500"
                />
              </div>
            </div>

            {/* 3. EL GUÍA */}
            <div className="p-5 rounded-2xl bg-[#0d121c] border border-slate-800 space-y-3">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs font-bold font-mono">3</span>
                <h3 className="text-sm font-bold text-white">Encuentra a un Guía (Tu Marca)</h3>
              </div>
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Declaración de Empatía ("Entendemos lo que sientes"):</label>
                <textarea
                  rows={2}
                  value={activeWireframe.storyBrand?.guia?.empatia || ''}
                  onChange={e => updateStoryBrand('guia', 'empatia', e.target.value)}
                  className="w-full p-2 rounded-lg bg-[#080b11] border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-orange-500"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Declaración de Autoridad (Credibilidad y experiencia):</label>
                <textarea
                  rows={2}
                  value={activeWireframe.storyBrand?.guia?.autoridad || ''}
                  onChange={e => updateStoryBrand('guia', 'autoridad', e.target.value)}
                  className="w-full p-2 rounded-lg bg-[#080b11] border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-orange-500"
                />
              </div>
            </div>

            {/* 4. EL PLAN */}
            <div className="p-5 rounded-2xl bg-[#0d121c] border border-slate-800 space-y-3">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center text-xs font-bold font-mono">4</span>
                <h3 className="text-sm font-bold text-white">Que le Da un Plan en 3 Pasos</h3>
              </div>
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Paso 1 (Contacto inicial):</label>
                <input
                  type="text"
                  value={activeWireframe.storyBrand?.plan?.paso1 || ''}
                  onChange={e => updateStoryBrand('plan', 'paso1', e.target.value)}
                  className="w-full p-2 rounded-lg bg-[#080b11] border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-orange-500"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Paso 2 (Acuerdo o coordinación):</label>
                <input
                  type="text"
                  value={activeWireframe.storyBrand?.plan?.paso2 || ''}
                  onChange={e => updateStoryBrand('plan', 'paso2', e.target.value)}
                  className="w-full p-2 rounded-lg bg-[#080b11] border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-orange-500"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Paso 3 (Resultado exitoso):</label>
                <input
                  type="text"
                  value={activeWireframe.storyBrand?.plan?.paso3 || ''}
                  onChange={e => updateStoryBrand('plan', 'paso3', e.target.value)}
                  className="w-full p-2 rounded-lg bg-[#080b11] border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-orange-500"
                />
              </div>
            </div>

            {/* 5. LLAMADA A LA ACCIÓN */}
            <div className="p-5 rounded-2xl bg-[#0d121c] border border-slate-800 space-y-3">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-orange-500/20 text-orange-400 flex items-center justify-center text-xs font-bold font-mono">5</span>
                <h3 className="text-sm font-bold text-white">Y lo Llama a la Acción (CTA)</h3>
              </div>
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Llamada a la Acción Directa (El botón principal):</label>
                <input
                  type="text"
                  value={activeWireframe.storyBrand?.llamadaAccion?.directa || ''}
                  onChange={e => updateStoryBrand('llamadaAccion', 'directa', e.target.value)}
                  className="w-full p-2 rounded-lg bg-[#080b11] border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-orange-500 font-bold"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Llamada a la Acción Transitoria (Para los que aún no están listos):</label>
                <input
                  type="text"
                  value={activeWireframe.storyBrand?.llamadaAccion?.transitoria || ''}
                  onChange={e => updateStoryBrand('llamadaAccion', 'transitoria', e.target.value)}
                  className="w-full p-2 rounded-lg bg-[#080b11] border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-orange-500"
                />
              </div>
            </div>

            {/* 6 & 7. ÉXITO Y FRACASO */}
            <div className="p-5 rounded-2xl bg-[#0d121c] border border-slate-800 space-y-3">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-sky-500/20 text-sky-400 flex items-center justify-center text-xs font-bold font-mono">6/7</span>
                <h3 className="text-sm font-bold text-white">Lo que Está en Juego (Éxito vs Fracaso)</h3>
              </div>
              <div>
                <label className="text-[11px] text-emerald-400 block mb-1">El Éxito (Cómo luce su vida tras resolverlo):</label>
                <textarea
                  rows={2}
                  value={activeWireframe.storyBrand?.exito || ''}
                  onChange={e => updateStoryBrand('exito', '', e.target.value)}
                  className="w-full p-2 rounded-lg bg-[#080b11] border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-orange-500"
                />
              </div>
              <div>
                <label className="text-[11px] text-red-400 block mb-1">El Fracaso Evitado (Las consecuencias negativas):</label>
                <textarea
                  rows={2}
                  value={activeWireframe.storyBrand?.fracasoEvitado || ''}
                  onChange={e => updateStoryBrand('fracasoEvitado', '', e.target.value)}
                  className="w-full p-2 rounded-lg bg-[#080b11] border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-orange-500"
                />
              </div>
            </div>

          </div>
        </div>
      )}

      {/* =========================================================================
          PESTAÑA 2: ARQUITECTURA DE SECCIONES (EDITOR DE LOS 7 BLOQUES)
          ========================================================================= */}
      {activeTab === 'editor_wireframe' && activeWireframe && (
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-2">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-orange-400" />
              <span>Estructura de Secciones UX (Flujo Narrativo de Conversión)</span>
            </h3>
            <span className="text-xs text-slate-400 font-mono">
              {activeWireframe.seccionesWireframe?.length || 0} Secciones Maquetadas
            </span>
          </div>

          <div className="space-y-4">
            {activeWireframe.seccionesWireframe?.map((sec, idx) => (
              <div 
                key={sec.id || idx}
                className="p-5 rounded-2xl bg-[#0d121c] border border-slate-800 hover:border-slate-700 transition-all space-y-3"
              >
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded bg-orange-500/20 text-orange-400 flex items-center justify-center font-mono text-[11px] font-bold">
                      {idx + 1}
                    </span>
                    <span className="font-bold text-xs text-slate-200">{sec.etiqueta}</span>
                  </div>
                  <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                    Tipo: {sec.tipo}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Titular (H1 / H2):</label>
                    <input
                      type="text"
                      value={sec.titular || ''}
                      onChange={e => updateSection(idx, 'titular', e.target.value)}
                      className="w-full p-2.5 rounded-lg bg-[#080b11] border border-slate-800 text-xs text-white font-bold focus:outline-none focus:border-orange-500"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Subtítulo / Bajada Explicativa:</label>
                    <input
                      type="text"
                      value={sec.subtitulo || ''}
                      onChange={e => updateSection(idx, 'subtitulo', e.target.value)}
                      className="w-full p-2.5 rounded-lg bg-[#080b11] border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-orange-500"
                    />
                  </div>
                </div>

                {/* CTAs if applicable */}
                {(sec.ctaPrincipal || sec.ctaSecundario) && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="text-[10px] text-slate-500 block mb-1">Texto del Botón Primario:</label>
                      <input
                        type="text"
                        value={sec.ctaPrincipal || ''}
                        onChange={e => updateSection(idx, 'ctaPrincipal', e.target.value)}
                        className="w-full p-2 rounded-lg bg-[#080b11] border border-slate-800 text-xs text-orange-300 font-semibold focus:outline-none focus:border-orange-500"
                      />
                    </div>
                    {sec.ctaSecundario && (
                      <div>
                        <label className="text-[10px] text-slate-500 block mb-1">Texto del Botón Secundario:</label>
                        <input
                          type="text"
                          value={sec.ctaSecundario || ''}
                          onChange={e => updateSection(idx, 'ctaSecundario', e.target.value)}
                          className="w-full p-2 rounded-lg bg-[#080b11] border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-orange-500"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =========================================================================
          PESTAÑA 3: VISTA PREVIA DE MAQUETACIÓN WIREFRAME UX (ESCALA DE GRISES)
          ========================================================================= */}
      {activeTab === 'preview_visual' && activeWireframe && (
        <div className="flex justify-center">
          
          <div className={`transition-all duration-300 w-full ${
            deviceMode === 'mobile' ? 'max-w-sm border-8 border-slate-800 rounded-[2.5rem] p-2 bg-slate-900 shadow-2xl' : 'max-w-4xl'
          }`}>
            
            {/* The Wireframe Page Body */}
            <div className="bg-[#f8fafc] text-slate-900 rounded-2xl overflow-hidden shadow-2xl border border-slate-300">
              
              {/* Wireframe Mock Header / Nav */}
              <div className="border-b border-slate-300 bg-white px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-slate-800 text-white font-bold flex items-center justify-center text-xs">
                    G
                  </div>
                  <span className="font-extrabold text-sm tracking-tight text-slate-900 uppercase">
                    {activeWireframe.empresa}
                  </span>
                </div>

                <div className="hidden sm:flex items-center gap-4 text-xs font-semibold text-slate-600">
                  <span>Inicio</span>
                  <span>Servicios</span>
                  <span>Por Qué Elegirnos</span>
                  <span>Contacto</span>
                </div>

                <button className="px-3 py-1.5 rounded-lg bg-orange-600 text-white font-bold text-xs shadow-sm">
                  Emergencias 24/7
                </button>
              </div>

              {/* SECTION 1: HERO */}
              <div className="px-6 py-12 sm:py-16 text-center bg-gradient-to-b from-slate-100 to-white border-b border-slate-200">
                <span className="text-[10px] font-mono uppercase tracking-wider text-orange-600 font-bold bg-orange-100 px-2.5 py-1 rounded-full">
                  Prueba de 5 Segundos · Hero Section
                </span>
                <h1 className="text-xl sm:text-3xl font-black text-slate-950 mt-4 max-w-2xl mx-auto leading-tight">
                  {activeWireframe.seccionesWireframe?.[0]?.titular}
                </h1>
                <p className="text-xs sm:text-sm text-slate-600 mt-3 max-w-xl mx-auto leading-relaxed">
                  {activeWireframe.seccionesWireframe?.[0]?.subtitulo}
                </p>

                {/* CTAs */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-6">
                  <button className="w-full sm:w-auto px-5 py-3 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-extrabold text-xs shadow-md">
                    {activeWireframe.seccionesWireframe?.[0]?.ctaPrincipal}
                  </button>
                  <button className="w-full sm:w-auto px-5 py-3 rounded-xl bg-slate-200 text-slate-800 font-bold text-xs hover:bg-slate-300">
                    {activeWireframe.seccionesWireframe?.[0]?.ctaSecundario}
                  </button>
                </div>

                {/* Trust Badges */}
                <div className="flex flex-wrap items-center justify-center gap-4 mt-8 pt-6 border-t border-slate-200 text-[11px] font-semibold text-slate-600">
                  {activeWireframe.seccionesWireframe?.[0]?.insigniasConfianza?.map((b, i) => (
                    <span key={i} className="flex items-center gap-1">{b}</span>
                  ))}
                </div>
              </div>

              {/* SECTION 2: PROBLEM */}
              <div className="px-6 py-12 bg-white border-b border-slate-200">
                <div className="text-center max-w-xl mx-auto mb-8">
                  <h2 className="text-lg sm:text-xl font-black text-slate-900">
                    {activeWireframe.seccionesWireframe?.[1]?.titular}
                  </h2>
                  <p className="text-xs text-slate-600 mt-1">
                    {activeWireframe.seccionesWireframe?.[1]?.subtitulo}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {activeWireframe.seccionesWireframe?.[1]?.puntosDolor?.map((p, i) => (
                    <div key={i} className="p-4 rounded-xl border border-red-200 bg-red-50/50 space-y-1.5">
                      <div className="w-6 h-6 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-xs font-bold font-mono">!</div>
                      <h4 className="font-bold text-xs text-slate-900">{p.titulo}</h4>
                      <p className="text-[11px] text-slate-600 leading-snug">{p.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* SECTION 3: SERVICES */}
              <div className="px-6 py-12 bg-slate-50 border-b border-slate-200">
                <div className="text-center max-w-xl mx-auto mb-8">
                  <h2 className="text-lg sm:text-xl font-black text-slate-900">
                    {activeWireframe.seccionesWireframe?.[2]?.titular}
                  </h2>
                  <p className="text-xs text-slate-600 mt-1">
                    {activeWireframe.seccionesWireframe?.[2]?.subtitulo}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {activeWireframe.seccionesWireframe?.[2]?.servicios?.map((s, i) => (
                    <div key={i} className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm space-y-1.5">
                      <div className="font-black text-xs text-slate-900 flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>{s.nombre}</span>
                      </div>
                      <p className="text-[11px] text-slate-600 leading-snug">{s.detalle}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* SECTION 4: THE GUIDE */}
              <div className="px-6 py-10 bg-slate-900 text-white border-b border-slate-200">
                <div className="max-w-2xl mx-auto text-center space-y-3">
                  <h3 className="text-lg font-black text-white">
                    {activeWireframe.seccionesWireframe?.[3]?.titular}
                  </h3>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {activeWireframe.seccionesWireframe?.[3]?.subtitulo}
                  </p>

                  <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-800">
                    {activeWireframe.seccionesWireframe?.[3]?.metricas?.map((m, i) => (
                      <div key={i}>
                        <div className="text-lg sm:text-xl font-black text-orange-400 font-mono">{m.valor}</div>
                        <div className="text-[10px] text-slate-400">{m.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* SECTION 5: 3-STEP PLAN */}
              <div className="px-6 py-12 bg-white border-b border-slate-200">
                <div className="text-center max-w-xl mx-auto mb-8">
                  <h2 className="text-lg sm:text-xl font-black text-slate-900">
                    {activeWireframe.seccionesWireframe?.[4]?.titular}
                  </h2>
                  <p className="text-xs text-slate-600 mt-1">
                    {activeWireframe.seccionesWireframe?.[4]?.subtitulo}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {activeWireframe.seccionesWireframe?.[4]?.pasos?.map((paso, i) => (
                    <div key={i} className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center space-y-2">
                      <div className="w-8 h-8 rounded-full bg-orange-600 text-white font-black flex items-center justify-center mx-auto text-xs">
                        {paso.num}
                      </div>
                      <h4 className="font-extrabold text-xs text-slate-900">{paso.titulo}</h4>
                      <p className="text-[11px] text-slate-600 leading-snug">{paso.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* SECTION 6: SOCIAL PROOF */}
              <div className="px-6 py-12 bg-slate-50 border-b border-slate-200">
                <div className="text-center max-w-xl mx-auto mb-8">
                  <h2 className="text-lg sm:text-xl font-black text-slate-900">
                    {activeWireframe.seccionesWireframe?.[5]?.titular}
                  </h2>
                  <p className="text-xs text-slate-600 mt-1">
                    {activeWireframe.seccionesWireframe?.[5]?.subtitulo}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {activeWireframe.seccionesWireframe?.[5]?.testimonios?.map((t, i) => (
                    <div key={i} className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm space-y-2">
                      <div className="flex text-amber-500 text-xs">
                        {'★'.repeat(t.rating || 5)}
                      </div>
                      <p className="text-[11px] text-slate-700 italic leading-snug">"{t.texto}"</p>
                      <div className="font-bold text-xs text-slate-900 pt-1 border-t border-slate-100">
                        {t.cliente}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* SECTION 7: FINAL CLOSING CTA */}
              <div className="px-6 py-12 bg-slate-950 text-white text-center">
                <h2 className="text-xl sm:text-2xl font-black text-white max-w-xl mx-auto">
                  {activeWireframe.seccionesWireframe?.[6]?.titular}
                </h2>
                <p className="text-xs text-slate-400 mt-2 max-w-md mx-auto">
                  {activeWireframe.seccionesWireframe?.[6]?.subtitulo}
                </p>

                <div className="mt-6">
                  <button className="px-6 py-3 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-extrabold text-xs shadow-lg shadow-orange-600/30">
                    {activeWireframe.seccionesWireframe?.[6]?.ctaPrincipal}
                  </button>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}
