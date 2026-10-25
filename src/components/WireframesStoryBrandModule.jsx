import React, { useState, useEffect } from 'react';
import apiClient from '../services/apiClient';
import { getStoredProyectos } from '../services/contractGenerator';
import {
  Sparkles,
  Copy,
  Check,
  Save,
  Download,
  Layout,
  UserCheck,
  AlertTriangle,
  Award,
  ListOrdered,
  Zap,
  CheckCircle2,
  FileText,
  RefreshCw,
  ArrowRight,
  ShieldAlert,
  Flame,
  Layers,
  HeartHandshake,
  Target,
  FileCheck
} from 'lucide-react';

export default function WireframesStoryBrandModule({ selectedCountry = 'SV', externalSelectedProyectoId = null }) {
  const [proyectos, setProyectos] = useState([]);
  const [selectedProyectoId, setSelectedProyectoId] = useState(externalSelectedProyectoId || '');
  const [activeStoryBrand, setActiveStoryBrand] = useState(null);
  const [loading, setLoading] = useState(true);

  // Notifications & Loaders
  const [copiedScript, setCopiedScript] = useState(false);
  const [savedNotice, setSavedNotice] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // Sync externalSelectedProyectoId when changed from parent
  useEffect(() => {
    if (externalSelectedProyectoId) {
      setSelectedProyectoId(externalSelectedProyectoId);
      loadOrGenerateStoryBrand(externalSelectedProyectoId);
    }
  }, [externalSelectedProyectoId]);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    let projs = getStoredProyectos();
    try {
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
      const targetId = externalSelectedProyectoId || (projs.length > 0 ? projs[0].id : '');
      if (targetId) {
        setSelectedProyectoId(targetId);
        loadOrGenerateStoryBrand(targetId, projs);
      }
      setLoading(false);
    }
  };

  // Local storage management
  const getStoredStoryBrandsMap = () => {
    try {
      const raw = localStorage.getItem('goglite_storybrand_by_project');
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  };

  const saveStoredStoryBrand = (sbData) => {
    if (!sbData || !sbData.proyectoId) return;
    try {
      const map = getStoredStoryBrandsMap();
      map[sbData.proyectoId] = sbData;
      localStorage.setItem('goglite_storybrand_by_project', JSON.stringify(map));

      // Also mirror into legacy goglite_wireframes_v1 for backward compatibility
      try {
        const legacyRaw = localStorage.getItem('goglite_wireframes_v1');
        let legacyList = legacyRaw ? JSON.parse(legacyRaw) : [];
        const idx = legacyList.findIndex(w => w.proyectoId === sbData.proyectoId);
        if (idx !== -1) {
          legacyList[idx] = sbData;
        } else {
          legacyList.unshift(sbData);
        }
        localStorage.setItem('goglite_wireframes_v1', JSON.stringify(legacyList));
      } catch (e) {}
    } catch (e) {
      console.warn('Error saving StoryBrand to localStorage:', e);
    }
  };

  // Detect corrupted or stale dental clinic mockups on non-dental projects
  const isStaleDentalMockup = (data, proyecto) => {
    if (!data || !data.storyBrand) return true;
    const actividad = (proyecto?.cliente?.actividad || '').toLowerCase();
    const isDentalProject = actividad.includes('dental') || actividad.includes('odontol');
    if (isDentalProject) return false;

    const raw = JSON.stringify(data.storyBrand).toLowerCase();
    return (
      raw.includes('dental') ||
      raw.includes('odontolog') ||
      raw.includes('ortodoncia') ||
      raw.includes('implantes dentales') ||
      raw.includes('pacientes y familias en') ||
      raw.includes('tu sonrisa en manos')
    );
  };

  // Load from local storage, backend or generate dynamically
  const loadOrGenerateStoryBrand = async (projId, currentProjs = null) => {
    if (!projId) return;
    const list = currentProjs || proyectos;
    const proj = list.find(p => p.id === projId) || { id: projId };

    // 1. Check local dedicated map
    const map = getStoredStoryBrandsMap();
    const saved = map[projId];

    if (saved && !isStaleDentalMockup(saved, proj)) {
      setActiveStoryBrand(saved);
      return;
    }

    // 2. Check legacy storage
    try {
      const legacyRaw = localStorage.getItem('goglite_wireframes_v1');
      if (legacyRaw) {
        const legacyList = JSON.parse(legacyRaw);
        const legacyFound = legacyList.find(w => w.proyectoId === projId);
        if (legacyFound && !isStaleDentalMockup(legacyFound, proj)) {
          setActiveStoryBrand(legacyFound);
          saveStoredStoryBrand(legacyFound);
          return;
        }
      }
    } catch (e) {}

    // 3. Fallback: generate fresh context-aware StoryBrand for this project
    const freshStoryBrand = buildContextualStoryBrand(proj);
    setActiveStoryBrand(freshStoryBrand);
    saveStoredStoryBrand(freshStoryBrand);
  };

  // Niche-aware, context-rich StoryBrand Generator (Donald Miller Framework)
  const buildContextualStoryBrand = (proyecto) => {
    const cliente = proyecto?.cliente || {};
    const nombreComercial = proyecto?.onboarding?.datos?.nombreComercial || cliente.empresa || cliente.nombre || 'Negocio';
    const slogan = proyecto?.onboarding?.datos?.slogan || 'Soluciones confiables y atención de primera clase';
    const actividad = cliente.actividad || 'Servicios Especializados';
    const telefono = proyecto?.onboarding?.datos?.telefonoEmergencia || cliente.telefono || '';
    const whatsapp = proyecto?.onboarding?.datos?.whatsappVentas || cliente.telefono || '';
    const pais = proyecto?.pais || 'DO';
    const ubicacion = cliente.ubicacion || (pais === 'DO' ? 'Punta Cana, República Dominicana' : 'San Salvador, El Salvador');

    const actLower = (actividad + ' ' + (proyecto?.onboarding?.datos?.rubro || '') + ' ' + nombreComercial).toLowerCase();

    // 1. NICHO: TURISMO / VILLAS VACACIONALES / TRANSPORTE PRIVADO & EXCURSIONES
    const isTurismoVillas = actLower.includes('villa') || 
                            actLower.includes('transporte') || 
                            actLower.includes('turis') || 
                            actLower.includes('viaje') || 
                            actLower.includes('excurs') || 
                            actLower.includes('hotel') || 
                            actLower.includes('traslado') || 
                            actLower.includes('punta cana') || 
                            actLower.includes('bavaro');

    if (isTurismoVillas) {
      return {
        id: 'sb-' + proyecto.id,
        proyectoId: proyecto.id,
        clienteNombre: cliente.nombre || 'Cliente',
        empresa: nombreComercial,
        nicho: actividad,
        pais,
        ubicacion,
        fechaActualizacion: new Date().toISOString().split('T')[0],
        aiGenerated: false,
        generatorType: 'Motor Estratégico Goglite (Especialidad Turismo & Movilidad)',
        storyBrand: {
          heroe: {
            identidad: `Turistas, familias, grupos y ejecutivos que visitan ${ubicacion} en busca de confort, exclusividad y tranquilidad absoluta en su viaje.`,
            deseo: `Hospedarse en villas vacacionales exclusivas y seguras, y contar con transporte privado puntual, cómodo y sin contratiempos de principio a fin.`
          },
          problema: {
            externo: `Dificultad para encontrar villas reales y verificadas en ${ubicacion}, sumado al estrés de lidiar con transporte informal o tarifas infladas al llegar al aeropuerto.`,
            interno: `Inseguridad y frustración de ser engañados con fotos falsas en internet, sufrir retrasos con choferes impuntuales o arruinar las vacaciones familiares.`,
            filosofico: `Toda persona que ahorra e invierte en sus vacaciones merece disfrutarlas al máximo con total seguridad, confort y respaldo local de primer nivel.`,
            villano: `La informalidad turística, las estafas de reservas engañosas y los intermediarios oportunistas que prometen lujo pero entregan dolores de cabeza.`
          },
          guia: {
            empatia: `En ${nombreComercial} entendemos lo valiosas que son tus vacaciones y el esfuerzo que hay detrás de este viaje. Nos apasiona brindarte una experiencia impecable y sin sorpresas.`,
            autoridad: `Flota propia de vehículos ejecutivos climatizados, catálogo de villas 100% verificadas, choferes profesionales certificados y asistencia personalizada 24/7 en ${ubicacion}.`
          },
          plan: {
            paso1: `1. Elige tu villa o ruta de transporte y escríbenos directamente por WhatsApp.`,
            paso2: `2. Confirmamos disponibilidad inmediata, personalizamos tus horarios de vuelo y te entregamos tu reserva con tarifa fija garantizada.`,
            paso3: `3. Disfruta tu estadía y traslados con chofer privado, bienvenida VIP y soporte permanente durante todo tu viaje.`,
            garantia: `Garantía de puntualidad en traslados de aeropuerto y verificación física previa de cada villa para asegurar los más altos estándares de higiene y privacidad.`
          },
          llamadaAccion: {
            directa: `Reservar Villa o Transporte VIP por WhatsApp (${whatsapp || telefono || 'Contacto Inmediato'})`,
            transitoria: `Consultar Catálogo de Villas Disponibles y Tarifario de Traslados`
          },
          fracasoEvitado: `Evitas estafas de alojamientos inexistentes, vehículos deteriorados, largas esperas en el aeropuerto, sobrecostos inesperados y el estrés de improvisar tus vacaciones en un destino desconocido.`,
          exito: `Vives unas vacaciones inolvidables en el Caribe: descanso en villas de lujo con vista al paraíso, traslados seguros y cómodos, y recuerdos imborrables junto a tus seres queridos con total paz mental.`
        }
      };
    }

    // 2. NICHO: SALUD / MÉDICO / CLÍNICA (Solo si el proyecto realmente es de salud)
    const isSalud = actLower.includes('salud') || actLower.includes('medic') || actLower.includes('clinic') || actLower.includes('terapia');
    if (isSalud) {
      return {
        id: 'sb-' + proyecto.id,
        proyectoId: proyecto.id,
        clienteNombre: cliente.nombre || 'Cliente',
        empresa: nombreComercial,
        nicho: actividad,
        pais,
        ubicacion,
        fechaActualizacion: new Date().toISOString().split('T')[0],
        aiGenerated: false,
        generatorType: 'Motor Estratégico Goglite (Especialidad Salud & Bienestar)',
        storyBrand: {
          heroe: {
            identidad: `Personas y familias en ${ubicacion} que buscan atención médica profesional, cálida y de alta confianza.`,
            deseo: `Recuperar su salud y bienestar con diagnósticos certeros, tecnología moderna y un trato humano y digno.`
          },
          problema: {
            externo: `Dificultad para acceder a especialistas calificados de forma ágil, con citas puntuales e instalaciones seguras.`,
            interno: `Preocupación por su salud o la de sus familiares, temor a tratamientos innecesarios o presupuestos sorpresa.`,
            filosofico: `Toda persona merece tener acceso a atención de salud honesta, humana y de excelencia cuando más lo necesita.`,
            villano: `La atención médica despersonalizada, las salas de espera interminables y los diagnósticos apresurados.`
          },
          guia: {
            empatia: `En ${nombreComercial} comprendemos la angustia que produce una molestia de salud. Tu bienestar y tranquilidad son nuestra mayor vocación.`,
            autoridad: `Especialistas médicos certificados, protocolos clínicos avalados, tecnología diagnóstica de punta y cientos de pacientes atendidos con éxito.`
          },
          plan: {
            paso1: `1. Escríbenos a WhatsApp y agenda tu cita en el horario que mejor te convenga.`,
            paso2: `2. Evaluación diagnóstica completa y explicación clara de tu plan de tratamiento sin rodeos.`,
            paso3: `3. Inicia tu proceso de recuperación con seguimiento cercano y acompañamiento constante.`
          },
          llamadaAccion: {
            directa: `Agendar Consulta Médica por WhatsApp (${whatsapp || telefono})`,
            transitoria: `Consultar Especialidades Disponibles y Horarios de Atención`
          },
          fracasoEvitado: `Evitas complicaciones médicas por falta de atención oportuna, pérdida de tiempo en salas de espera y tratamientos ineficaces.`,
          exito: `Recuperas tu vitalidad, tranquilidad y calidad de vida sabiendo que tu salud está en manos de verdaderos expertos.`
        }
      };
    }

    // 3. PLANTILLA CONTEXTUAL INTELIGENTE PARA CUALQUIER OTRO NICHO PROFESIONAL
    return {
      id: 'sb-' + proyecto.id,
      proyectoId: proyecto.id,
      clienteNombre: cliente.nombre || 'Cliente',
      empresa: nombreComercial,
      nicho: actividad,
      pais,
      ubicacion,
      fechaActualizacion: new Date().toISOString().split('T')[0],
      aiGenerated: false,
      generatorType: 'Motor Estratégico Goglite (StoryBrand Contextual)',
      storyBrand: {
        heroe: {
          identidad: `Clientes y empresas en ${ubicacion} que requieren soluciones de ${actividad.toLowerCase()} con respaldo, rapidez y garantía.`,
          deseo: `Resolver su necesidad de forma ágil y profesional, obteniendo resultados de máxima calidad sin perder tiempo ni dinero.`
        },
        problema: {
          externo: `Dificultad para encontrar proveedores serios y verificados que ofrezcan ${actividad.toLowerCase()} con cumplimiento estricto y precios transparentes.`,
          interno: `Frustración y desconfianza por cotizaciones infladas, falta de puntualidad o malas experiencias pasadas con personal informal.`,
          filosofico: `Toda persona o negocio merece recibir una atención profesional, honesta y de alto nivel al contratar servicios esenciales.`,
          villano: `La informalidad comercial, los intermediarios irresponsables y las promesas vacías que no se cumplen al momento de entregar el servicio.`
        },
        guia: {
          empatia: `En ${nombreComercial} sabemos lo valioso que es tu tiempo y lo importante que es contar con aliados de total confianza.`,
          autoridad: `Amplia trayectoria en ${ubicacion}, procesos estandarizados, equipo calificado y el respaldo de clientes satisfechos que confirman nuestra calidad.`
        },
        plan: {
          paso1: `1. Contáctanos por WhatsApp o teléfono (${whatsapp || telefono || 'Chat directo'}).`,
          paso2: `2. Evaluamos tu requerimiento y te entregamos una propuesta clara con tiempos y tarifas transparentes sin letras pequeñas.`,
          paso3: `3. Ejecutamos el servicio con puntualidad, excelencia y garantía de satisfacción total.`
        },
        llamadaAccion: {
          directa: `Solicitar Asesoría Inmediata por WhatsApp (${whatsapp || telefono || 'Escríbenos'})`,
          transitoria: `Consultar Catálogo de Servicios y Portafolio de Trabajos`
        },
        fracasoEvitado: `Evitas desperdiciar presupuesto en soluciones a medias, retrasos innecesarios, incumplimientos de entrega y dolores de cabeza con proveedores no calificados.`,
        exito: `Tu necesidad queda resuelta de forma impecable, optimizando tus recursos y disfrutando de la tranquilidad de trabajar con los mejores en ${ubicacion}.`
      }
    };
  };

  // Switch project handler
  const handleSelectProject = (projId) => {
    setSelectedProyectoId(projId);
    loadOrGenerateStoryBrand(projId);
  };

  // Regenerate with Google Gemini AI or Contextual Engine
  const handleRegenerateStoryBrand = async () => {
    const projId = selectedProyectoId;
    if (!projId) return;

    setIsGenerating(true);
    const proj = proyectos.find(p => p.id === projId) || { id: projId };

    const cliente = proj.cliente || {};
    const nombreComercial = proj.onboarding?.datos?.nombreComercial || cliente.empresa || cliente.nombre || 'Negocio';
    const actividad = cliente.actividad || 'Servicios Especializados';
    const telefono = proj.onboarding?.datos?.telefonoEmergencia || cliente.telefono || '';
    const whatsapp = proj.onboarding?.datos?.whatsappVentas || cliente.telefono || '';
    const pais = proj.pais || 'DO';
    const paisNombre = pais === 'DO' ? 'República Dominicana' : 'El Salvador';
    const ubicacion = cliente.ubicacion || (pais === 'DO' ? 'Punta Cana, República Dominicana' : 'San Salvador, El Salvador');

    const modulosContratados = Array.isArray(proj.modulos) && proj.modulos.length > 0
      ? proj.modulos.map(m => `- ${m.titulo}: ${m.descripcion || ''}`).join('\n')
      : '- Plataforma Web Mobile-First\n- Canales de Cierre & WhatsApp 24/7\n- Posicionamiento en Google Maps & SEO Local';

    const onboardingDatos = proj.onboarding?.datos || {};
    const insumosOnboarding = Object.entries(onboardingDatos)
      .filter(([_, v]) => typeof v === 'string' && v.trim().length > 0)
      .map(([k, v]) => `- ${k}: ${v}`)
      .join('\n') || '- Datos base registrados en SOW';

    // Retrieve Gemini API Key from secure Vite environment or Global settings
    const geminiKey = (typeof import.meta !== 'undefined' && import.meta.env && (import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.GEMINI_API_KEY)) || 
                      (typeof window !== 'undefined' && window.__GOGLITE_GEMINI_KEY) || 
                      localStorage.getItem('goglite_gemini_api_key') || '';

    let generated = null;

    if (geminiKey && geminiKey.trim()) {
      const prompt = `Eres el Director Creativo de Copywriting de la agencia "Goglite" y un experto de clase mundial en el Framework StoryBrand de Donald Miller.
Diseña el guion BrandScript de 7 partes de alta conversión para este cliente real:
EMPRESA / MARCA: "${nombreComercial}"
NICHO / ACTIVIDAD: "${actividad}"
PAÍS / UBICACIÓN: "${paisNombre}" (Zona: ${ubicacion})
TELÉFONO OFICIAL: "${telefono}"
WHATSAPP COMERCIAL: "${whatsapp}"
MÓDULOS CONTRATADOS EN SOW:
${modulosContratados}
INSUMOS DEL CLIENTE:
${insumosOnboarding}

REGLAS DE COPYWRITING STORYBRAND DE DONALD MILLER:
1. El cliente es el HÉROE; tu empresa es la GUÍA (Empatía genuina + Autoridad sólida).
2. Tono persuasivo, humano, adaptado a ${paisNombre} (${ubicacion}). Cero clichés genéricos.
3. El Héroe tiene un deseo claro.
4. El Problema tiene 3 niveles: Externo, Interno, Filosófico, y se identifica al Villano.
5. El Guía expresa Empatía y demuestra Autoridad.
6. El Plan tiene 3 pasos sencillos y una garantía.
7. Las Llamadas a la Acción son Directa y Transitoria.
8. Se define claramente el Fracaso Evitado y el Éxito Transformacional.

Devuelve EXCLUSIVAMENTE un JSON válido (sin markdown ni texto antes o después) con esta estructura exacta:
{
  "heroe": { "identidad": "...", "deseo": "..." },
  "problema": { "externo": "...", "interno": "...", "filosofico": "...", "villano": "..." },
  "guia": { "empatia": "...", "autoridad": "..." },
  "plan": { "paso1": "1. ...", "paso2": "2. ...", "paso3": "3. ...", "garantia": "..." },
  "llamadaAccion": { "directa": "...", "transitoria": "..." },
  "fracasoEvitado": "...",
  "exito": "..."
}`;

      const modelsToTry = ['gemini-flash-latest', 'gemini-2.5-flash-lite', 'gemini-flash-lite-latest'];
      for (const m of modelsToTry) {
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
            if (parsed.heroe && parsed.problema && parsed.guia && parsed.plan && parsed.llamadaAccion) {
              generated = {
                id: 'sb-' + proj.id,
                proyectoId: proj.id,
                clienteNombre: cliente.nombre || 'Cliente',
                empresa: nombreComercial,
                nicho: actividad,
                pais,
                ubicacion,
                fechaActualizacion: new Date().toISOString().split('T')[0],
                aiGenerated: true,
                aiModel: m,
                generatorType: `Google Gemini AI (${m})`,
                storyBrand: parsed
              };
              break;
            }
          }
        } catch (e) {
          console.warn(`[StoryBrand AI] Fallo en ${m}:`, e);
        }
      }
    }

    // Fallback if AI was unavailable or timed out
    if (!generated) {
      generated = buildContextualStoryBrand(proj);
    }

    setActiveStoryBrand(generated);
    saveStoredStoryBrand(generated);
    setIsGenerating(false);
    showNotification('¡Brand Story regenerado con éxito para este proyecto!');
  };

  // Helper to safely update StoryBrand fields in state
  const updateStoryBrandField = (section, field, value) => {
    setActiveStoryBrand(prev => {
      if (!prev) return prev;
      const copy = { ...prev };
      const sb = { ...(copy.storyBrand || {}) };

      if (!field) {
        // Direct root fields: exito, fracasoEvitado
        sb[section] = value;
      } else {
        // Nested section fields: heroe.identidad, etc.
        sb[section] = {
          ...(sb[section] || {}),
          [field]: value
        };
      }

      copy.storyBrand = sb;
      return copy;
    });
  };

  // Save changes to localStorage & backend
  const handleSave = async () => {
    if (!activeStoryBrand) return;
    saveStoredStoryBrand(activeStoryBrand);
    try {
      await apiClient.post('/api/wireframes', activeStoryBrand);
    } catch (e) {
      // Backend offline
    }
    showNotification('¡Brand Story guardado con éxito!');
  };

  const showNotification = () => {
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2500);
  };

  // Generate formatted Markdown script
  const generateMarkdownScript = () => {
    if (!activeStoryBrand || !activeStoryBrand.storyBrand) return '';
    const sb = activeStoryBrand.storyBrand;

    let md = `# BRAND STORY (STORYBRAND DE 7 PARTES) — ${activeStoryBrand.empresa}\n\n`;
    md += `> **Metodología Donald Miller (Building a StoryBrand)**\n`;
    md += `> **Cliente:** ${activeStoryBrand.clienteNombre} | **Nicho:** ${activeStoryBrand.nicho} | **Ubicación:** ${activeStoryBrand.ubicacion || 'Punta Cana, DO'}\n`;
    md += `> **Fecha:** ${activeStoryBrand.fechaActualizacion} | **Origen:** ${activeStoryBrand.generatorType || 'Estratégico Goglite'}\n\n`;
    md += `---\n\n`;

    md += `## 1. EL PERSONAJE (EL HÉROE)\n`;
    md += `* **Identidad del Cliente Ideal:** ${sb.heroe?.identidad || ''}\n`;
    md += `* **Deseo Concreto / Meta Principal:** ${sb.heroe?.deseo || ''}\n\n`;

    md += `## 2. TIENE UN PROBLEMA (LOS 3 NIVELES + EL VILLANO)\n`;
    md += `* **Problema Externo (Traba práctica/logística):** ${sb.problema?.externo || ''}\n`;
    md += `* **Problema Interno (Frustración / Emoción):** ${sb.problema?.interno || ''}\n`;
    md += `* **Problema Filosófico (Por qué es injusto):** ${sb.problema?.filosofico || ''}\n`;
    if (sb.problema?.villano) {
      md += `* **El Villano Antagónico:** ${sb.problema?.villano}\n`;
    }
    md += `\n`;

    md += `## 3. Y ENCUENTRA A UN GUÍA (TU MARCA)\n`;
    md += `* **Declaración de Empatía:** "${sb.guia?.empatia || ''}"\n`;
    md += `* **Demostración de Autoridad:** "${sb.guia?.autoridad || ''}"\n\n`;

    md += `## 4. QUE LE DA UN PLAN EN 3 PASOS\n`;
    md += `* **Paso 1:** ${sb.plan?.paso1 || ''}\n`;
    md += `* **Paso 2:** ${sb.plan?.paso2 || ''}\n`;
    md += `* **Paso 3:** ${sb.plan?.paso3 || ''}\n`;
    if (sb.plan?.garantia) {
      md += `* **Garantía / Reducción de Riesgo:** ${sb.plan?.garantia}\n`;
    }
    md += `\n`;

    md += `## 5. Y LO LLAMA A LA ACCIÓN (CTAs)\n`;
    md += `* **Llamada Directa (Botón Primario de Cierre):** ${sb.llamadaAccion?.directa || ''}\n`;
    md += `* **Llamada Transitoria (Botón Secundario de Nutrición):** ${sb.llamadaAccion?.transitoria || ''}\n\n`;

    md += `## 6. QUE LE AYUDA A EVITAR EL FRACASO\n`;
    md += `${sb.fracasoEvitado || ''}\n\n`;

    md += `## 7. Y TERMINA CON EL ÉXITO (LA TRANSFORMACIÓN DEL HÉROE)\n`;
    md += `${sb.exito || ''}\n\n`;

    md += `---\n`;
    md += `*Generado por Goglite Agency Suite — Base de partida estratégica para el Constructor de IA y Copywriting Web.*`;

    return md;
  };

  // Copy Markdown to clipboard
  const handleCopyScript = () => {
    const md = generateMarkdownScript();
    if (!md) return;
    navigator.clipboard.writeText(md);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2000);
  };

  // Download Markdown file
  const handleDownloadScript = () => {
    const md = generateMarkdownScript();
    if (!md) return;
    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const safeEmpresa = (activeStoryBrand?.empresa || 'Cliente').replace(/[^a-zA-Z0-9_-]/g, '_');
    link.href = url;
    link.download = `StoryBrand_7Partes_${safeEmpresa}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const selectedProj = proyectos.find(p => p.id === selectedProyectoId);
  const sb = activeStoryBrand?.storyBrand || {};

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      
      {/* Toast Notice */}
      {savedNotice && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-emerald-600 text-white px-4 py-2.5 rounded-xl shadow-2xl font-semibold text-xs animate-bounce">
          <Check className="w-4 h-4" />
          <span>¡Brand Story guardado con éxito!</span>
        </div>
      )}

      {/* Top Banner / Hero */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-[#0d121f] via-[#101726] to-[#141b2d] border border-orange-500/20 shadow-xl relative overflow-hidden">
        {/* Tier 1: Title & Badge */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-800/60">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-orange-400 uppercase tracking-wider mb-1">
              <Sparkles className="w-4 h-4 text-orange-400" />
              <span>Módulo 4 · Fase 4 · StoryBrand Framework (Donald Miller)</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white">
              Brand Story de 7 Partes (Base de Partida Estratégica)
            </h1>
          </div>
          <div className="shrink-0 self-start sm:self-center">
            {activeStoryBrand?.aiGenerated ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 shadow-sm whitespace-nowrap">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                Redactado con Google AI ({activeStoryBrand.aiModel || 'Gemini Flash'})
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-blue-500/15 border border-blue-500/30 text-blue-300 shadow-sm whitespace-nowrap">
                <FileCheck className="w-3.5 h-3.5 text-blue-400" />
                {activeStoryBrand?.generatorType || 'Motor Estratégico Goglite'}
              </span>
            )}
          </div>
        </div>

        {/* Tier 2: Full-width descriptive text */}
        <p className="text-xs text-slate-300 leading-relaxed max-w-4xl mt-3">
          Construye la narrativa persuasiva de 7 partes que posiciona al cliente como el héroe y a la empresa como la guía. 
          Este guion es la base de partida fundamental para alimentar el constructor de IA y redactar copy de alta conversión sin plantillas rígidas.
        </p>

        {/* Tier 3: Dedicated Control & Action Toolbar */}
        <div className="mt-4 p-3 rounded-xl bg-[#080c16]/90 border border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-3 shadow-inner">
          {/* Left: Project Selector */}
          <div className="flex items-center gap-2.5 flex-1 min-w-[280px]">
            <span className="text-xs font-bold text-slate-400 uppercase font-mono tracking-wider shrink-0">
              Proyecto:
            </span>
            <select
              value={selectedProyectoId}
              onChange={(e) => handleSelectProject(e.target.value)}
              className="w-full sm:w-auto px-3 py-2 rounded-lg bg-[#0e1424] border border-slate-700 text-xs font-bold text-slate-200 focus:outline-none focus:border-orange-500 shadow-sm"
            >
              {proyectos.map(p => (
                <option key={p.id} value={p.id}>
                  {p.codigo} · {p.cliente?.empresa || p.cliente?.nombre}
                </option>
              ))}
            </select>
          </div>

          {/* Right: Action Buttons */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              onClick={handleRegenerateStoryBrand}
              disabled={isGenerating}
              className="px-3.5 py-2 rounded-lg bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-1.5 shadow-md transition-all"
              title="Regenerar Brand Story con IA para el proyecto activo"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
              <span>{isGenerating ? 'Generando...' : 'Regenerar con IA'}</span>
            </button>

            <button
              onClick={handleCopyScript}
              className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs flex items-center gap-1.5 transition-colors border border-slate-700"
              title="Copiar guion StoryBrand completo en Markdown"
            >
              {copiedScript ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedScript ? '¡Copiado!' : 'Copiar Markdown'}</span>
            </button>

            <button
              onClick={handleDownloadScript}
              className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs flex items-center gap-1.5 transition-colors border border-slate-700"
              title="Descargar archivo Markdown del Brand Story"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Descargar .md</span>
            </button>

            <button
              onClick={handleSave}
              className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md transition-all"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Guardar</span>
            </button>
          </div>
        </div>

        {/* Tier 4: Client Metadata Grid */}
        {selectedProj && (
          <div className="mt-3 pt-3 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-xs">
            <div className="p-2.5 rounded-lg bg-[#0e1424]/60 border border-slate-800/60">
              <span className="text-slate-500 block text-[10px] uppercase font-mono mb-0.5">Cliente Activo</span>
              <strong className="text-slate-200 truncate block">{selectedProj.cliente?.nombre} ({selectedProj.cliente?.empresa})</strong>
            </div>
            <div className="p-2.5 rounded-lg bg-[#0e1424]/60 border border-slate-800/60">
              <span className="text-slate-500 block text-[10px] uppercase font-mono mb-0.5">Nicho / Especialidad</span>
              <strong className="text-orange-400 truncate block">{selectedProj.cliente?.actividad}</strong>
            </div>
            <div className="p-2.5 rounded-lg bg-[#0e1424]/60 border border-slate-800/60">
              <span className="text-slate-500 block text-[10px] uppercase font-mono mb-0.5">Ubicación</span>
              <strong className="text-slate-200 truncate block">{selectedProj.cliente?.ubicacion || (selectedProj.pais === 'DO' ? 'Punta Cana, RD' : 'El Salvador')}</strong>
            </div>
            <div className="p-2.5 rounded-lg bg-[#0e1424]/60 border border-slate-800/60">
              <span className="text-slate-500 block text-[10px] uppercase font-mono mb-0.5">Contacto / WhatsApp</span>
              <strong className="text-emerald-400 truncate block">{selectedProj.cliente?.telefono || 'No especificado'}</strong>
            </div>
          </div>
        )}
      </div>

      {/* Guide Banner: Donald Miller Framework */}
      <div className="p-4 rounded-xl bg-orange-500/10 border border-orange-500/20 text-xs text-orange-200 flex items-start gap-3">
        <Sparkles className="w-4 h-4 shrink-0 mt-0.5 text-orange-400" />
        <div className="space-y-1">
          <p className="font-bold text-orange-300">
            Regla de Oro de Donald Miller (Building a StoryBrand):
          </p>
          <p className="text-slate-300 leading-relaxed">
            "El cliente siempre es el <strong>Héroe</strong> de la historia, nunca tu marca. Tu empresa es el <strong>Guía</strong> (como Yoda o Haymitch) que le brinda empatía, autoridad y un plan de 3 pasos para triunfar. Este BrandScript es la base de partida que alimentará la redacción y los bloques dinámicos en el Constructor de IA."
          </p>
        </div>
      </div>

      {/* =========================================================================
          THE 7 PARTS OF DONALD MILLER'S STORYBRAND FRAMEWORK
          ========================================================================= */}
      <div className="space-y-5">
        
        {/* PARTE 1: EL PERSONAJE (EL HÉROE) */}
        <div className="p-5 rounded-2xl bg-[#0d121c] border border-indigo-500/30 shadow-lg space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-sm font-bold font-mono">
                1
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-indigo-400" />
                  <span>El Personaje / El Héroe</span>
                </h3>
                <p className="text-[11px] text-slate-400">
                  ¿Quién es tu cliente ideal y qué deseo concreto busca alcanzar?
                </p>
              </div>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/15 text-indigo-300 font-bold uppercase">
              El Protagonista
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] font-bold text-slate-300 block mb-1.5">
                Identidad del Cliente Ideal (Perfil & Contexto):
              </label>
              <textarea
                rows={3}
                value={sb.heroe?.identidad || ''}
                onChange={e => updateStoryBrandField('heroe', 'identidad', e.target.value)}
                placeholder="Ej: Turistas y familias que visitan Punta Cana..."
                className="w-full p-3 rounded-xl bg-[#080b11] border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 leading-relaxed"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-300 block mb-1.5">
                Deseo Concreto / Objetivo Principal que Busca:
              </label>
              <textarea
                rows={3}
                value={sb.heroe?.deseo || ''}
                onChange={e => updateStoryBrandField('heroe', 'deseo', e.target.value)}
                placeholder="Ej: Hospedarse en villas exclusivas y contar con transporte puntual..."
                className="w-full p-3 rounded-xl bg-[#080b11] border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 leading-relaxed"
              />
            </div>
          </div>
        </div>

        {/* PARTE 2: TIENE UN PROBLEMA (3 NIVELES + EL VILLANO) */}
        <div className="p-5 rounded-2xl bg-[#0d121c] border border-red-500/30 shadow-lg space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-red-500/20 text-red-400 flex items-center justify-center text-sm font-bold font-mono">
                2
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-400" />
                  <span>Tiene un Problema (Los 3 Niveles de Conflicto + El Villano)</span>
                </h3>
                <p className="text-[11px] text-slate-400">
                  Las historias enganchan cuando el héroe enfrenta un villano que causa 3 niveles de frustración.
                </p>
              </div>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-red-500/15 text-red-300 font-bold uppercase">
              Conflicto
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] font-bold text-slate-300 block mb-1.5">
                1. Problema Externo (La traba tangible o logística):
              </label>
              <textarea
                rows={2}
                value={sb.problema?.externo || ''}
                onChange={e => updateStoryBrandField('problema', 'externo', e.target.value)}
                placeholder="La dificultad física o práctica a resolver..."
                className="w-full p-2.5 rounded-xl bg-[#080b11] border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-red-500"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-300 block mb-1.5">
                2. Problema Interno (Cómo se siente: estrés, desconfianza, frustración):
              </label>
              <textarea
                rows={2}
                value={sb.problema?.interno || ''}
                onChange={e => updateStoryBrandField('problema', 'interno', e.target.value)}
                placeholder="La emoción negativa o temor que experimenta..."
                className="w-full p-2.5 rounded-xl bg-[#080b11] border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-red-500"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-300 block mb-1.5">
                3. Problema Filosófico ("¿Por qué es injusto que esto suceda?"):
              </label>
              <textarea
                rows={2}
                value={sb.problema?.filosofico || ''}
                onChange={e => updateStoryBrandField('problema', 'filosofico', e.target.value)}
                placeholder="El principio moral: Nadie debería sufrir de..."
                className="w-full p-2.5 rounded-xl bg-[#080b11] border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-red-500"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-red-300 block mb-1.5 flex items-center gap-1">
                <Flame className="w-3.5 h-3.5 text-red-400" />
                <span>4. El Villano Antagónico (La causa raíz que sabotea al cliente):</span>
              </label>
              <textarea
                rows={2}
                value={sb.problema?.villano || ''}
                onChange={e => updateStoryBrandField('problema', 'villano', e.target.value)}
                placeholder="Ej: La informalidad turística, los intermediarios abusivos y las tarifas sorpresa..."
                className="w-full p-2.5 rounded-xl bg-[#080b11] border border-red-500/20 text-xs text-red-200 focus:outline-none focus:border-red-500"
              />
            </div>
          </div>
        </div>

        {/* PARTE 3: Y CONOCE A UN GUÍA (TU MARCA) */}
        <div className="p-5 rounded-2xl bg-[#0d121c] border border-emerald-500/30 shadow-lg space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-sm font-bold font-mono">
                3
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                  <HeartHandshake className="w-4 h-4 text-emerald-400" />
                  <span>Y Conoce a un Guía (Tu Marca: Empatía + Autoridad)</span>
                </h3>
                <p className="text-[11px] text-slate-400">
                  El Guía nunca compite con el Héroe; lo comprende y le demuestra que tiene la capacidad de ayudarlo.
                </p>
              </div>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 font-bold uppercase">
              La Guía
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] font-bold text-emerald-300 block mb-1.5">
                Declaración de Empatía ("Entendemos cómo te sientes..."):
              </label>
              <textarea
                rows={3}
                value={sb.guia?.empatia || ''}
                onChange={e => updateStoryBrandField('guia', 'empatia', e.target.value)}
                placeholder="Conectamos con su dolor y le aseguramos que nos importa genuinamente..."
                className="w-full p-3 rounded-xl bg-[#080b11] border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 leading-relaxed"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-emerald-300 block mb-1.5">
                Demostración de Autoridad (Experiencia, flota, certificaciones, track record):
              </label>
              <textarea
                rows={3}
                value={sb.guia?.autoridad || ''}
                onChange={e => updateStoryBrandField('guia', 'autoridad', e.target.value)}
                placeholder="Por qué pueden confiar en nosotros: Flota propia, atención 24/7, años en la zona..."
                className="w-full p-3 rounded-xl bg-[#080b11] border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 leading-relaxed"
              />
            </div>
          </div>
        </div>

        {/* PARTE 4: QUE LE DA UN PLAN (3 PASOS + GARANTÍA) */}
        <div className="p-5 rounded-2xl bg-[#0d121c] border border-amber-500/30 shadow-lg space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center text-sm font-bold font-mono">
                4
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                  <ListOrdered className="w-4 h-4 text-amber-400" />
                  <span>Que le Da un Plan (3 Pasos Claros hacia el Éxito)</span>
                </h3>
                <p className="text-[11px] text-slate-400">
                  Un plan simple de 3 pasos elimina la niebla mental y hace que contratar sea obvio y sin fricciones.
                </p>
              </div>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/15 text-amber-300 font-bold uppercase">
              El Camino
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="text-[11px] font-bold text-amber-300 block mb-1">
                Paso 1: Contacto / Selección Inicial
              </label>
              <textarea
                rows={2}
                value={sb.plan?.paso1 || ''}
                onChange={e => updateStoryBrandField('plan', 'paso1', e.target.value)}
                placeholder="1. Escríbenos por WhatsApp..."
                className="w-full p-2.5 rounded-xl bg-[#080b11] border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-amber-300 block mb-1">
                Paso 2: Coordinación & Tarifa Clara
              </label>
              <textarea
                rows={2}
                value={sb.plan?.paso2 || ''}
                onChange={e => updateStoryBrandField('plan', 'paso2', e.target.value)}
                placeholder="2. Confirmamos disponibilidad y fijamos tarifa..."
                className="w-full p-2.5 rounded-xl bg-[#080b11] border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-amber-300 block mb-1">
                Paso 3: Disfrutar el Servicio con Garantía
              </label>
              <textarea
                rows={2}
                value={sb.plan?.paso3 || ''}
                onChange={e => updateStoryBrandField('plan', 'paso3', e.target.value)}
                placeholder="3. Disfrutas tu experiencia VIP sin estrés..."
                className="w-full p-2.5 rounded-xl bg-[#080b11] border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-300 block mb-1">
              Garantía de Cero Riesgos / Reducción de Temores:
            </label>
            <input
              type="text"
              value={sb.plan?.garantia || ''}
              onChange={e => updateStoryBrandField('plan', 'garantia', e.target.value)}
              placeholder="Ej: Garantía de puntualidad en aeropuerto y verificación física de cada villa..."
              className="w-full p-2.5 rounded-xl bg-[#080b11] border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
            />
          </div>
        </div>

        {/* PARTE 5: Y LO LLAMA A LA ACCIÓN (CTAs) */}
        <div className="p-5 rounded-2xl bg-[#0d121c] border border-orange-500/30 shadow-lg space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center text-sm font-bold font-mono">
                5
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                  <Zap className="w-4 h-4 text-orange-400" />
                  <span>Y lo Llama a la Acción (Llamadas Directas & Transitorias)</span>
                </h3>
                <p className="text-[11px] text-slate-400">
                  Los clientes no toman acción a menos que se les desafíe claramente a dar el siguiente paso.
                </p>
              </div>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-orange-500/15 text-orange-300 font-bold uppercase">
              Conversión
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] font-bold text-orange-300 block mb-1.5">
                Llamada a la Acción Directa (El botón primario de compra/reserva):
              </label>
              <input
                type="text"
                value={sb.llamadaAccion?.directa || ''}
                onChange={e => updateStoryBrandField('llamadaAccion', 'directa', e.target.value)}
                placeholder="Ej: Reservar Villa o Transporte por WhatsApp..."
                className="w-full p-3 rounded-xl bg-[#080b11] border border-slate-800 text-xs font-bold text-orange-400 focus:outline-none focus:border-orange-500"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-300 block mb-1.5">
                Llamada a la Acción Transitoria (Para los que aún no están listos):
              </label>
              <input
                type="text"
                value={sb.llamadaAccion?.transitoria || ''}
                onChange={e => updateStoryBrandField('llamadaAccion', 'transitoria', e.target.value)}
                placeholder="Ej: Consultar Catálogo de Villas y Tarifas en PDF..."
                className="w-full p-3 rounded-xl bg-[#080b11] border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-orange-500"
              />
            </div>
          </div>
        </div>

        {/* PARTE 6 Y 7: LO QUE ESTÁ EN JUEGO (FRACASO EVITADO VS ÉXITO TRIUNFANTE) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          
          {/* PARTE 6: EL FRACASO EVITADO */}
          <div className="p-5 rounded-2xl bg-[#0d121c] border border-rose-500/30 shadow-lg space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-rose-500/20 text-rose-400 flex items-center justify-center text-xs font-bold font-mono">
                  6
                </div>
                <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-rose-400" />
                  <span>El Fracaso Evitado</span>
                </h3>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-500/15 text-rose-300 font-bold uppercase">
                Riesgo
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              ¿Qué costo, pérdida, estafa o mala experiencia evita el cliente si contrata contigo?
            </p>
            <textarea
              rows={4}
              value={sb.fracasoEvitado || ''}
              onChange={e => updateStoryBrandField('fracasoEvitado', '', e.target.value)}
              placeholder="Ej: Evitas estafas de hospedaje inexistente, conductores informales en el aeropuerto..."
              className="w-full p-3 rounded-xl bg-[#080b11] border border-slate-800 text-xs text-rose-200 focus:outline-none focus:border-rose-500 leading-relaxed"
            />
          </div>

          {/* PARTE 7: EL ÉXITO Y TRANSFORMACIÓN */}
          <div className="p-5 rounded-2xl bg-[#0d121c] border border-emerald-500/30 shadow-lg space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs font-bold font-mono">
                  7
                </div>
                <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                  <Target className="w-4 h-4 text-emerald-400" />
                  <span>El Éxito (La Transformación)</span>
                </h3>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 font-bold uppercase">
                Final Feliz
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              ¿Cómo luce la vida del cliente tras resolver su necesidad? ¿En quién se convierte?
            </p>
            <textarea
              rows={4}
              value={sb.exito || ''}
              onChange={e => updateStoryBrandField('exito', '', e.target.value)}
              placeholder="Ej: Disfrutas de unas vacaciones soñadas en el Caribe, descanso absoluto en villas de lujo..."
              className="w-full p-3 rounded-xl bg-[#080b11] border border-slate-800 text-xs text-emerald-200 focus:outline-none focus:border-emerald-500 leading-relaxed"
            />
          </div>

        </div>

      </div>

      {/* Footer / AI Builder Transition Notice */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-[#101726] to-[#080b11] border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h4 className="text-sm font-extrabold text-white flex items-center gap-2">
            <Layers className="w-4 h-4 text-orange-400" />
            <span>Listo para el Constructor de Sitios con IA</span>
          </h4>
          <p className="text-xs text-slate-400 mt-1 max-w-xl">
            Este guion BrandScript está preparado como prompt y base de conocimiento para alimentar los módulos del constructor de IA, asegurando que cada sección del sitio web convierta sin estar atado a una plantilla rígida.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleCopyScript}
            className="px-4 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg transition-all"
          >
            {copiedScript ? <Check className="w-4 h-4 text-emerald-200" /> : <Copy className="w-4 h-4" />}
            <span>{copiedScript ? '¡Guion Copiado!' : 'Copiar BrandScript'}</span>
          </button>
        </div>
      </div>

    </div>
  );
}
