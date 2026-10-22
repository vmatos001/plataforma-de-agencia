import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getSettings } from './storage.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const WIREFRAMES_PATH = path.join(__dirname, '../data/wireframes.json');

export function getWireframes() {
  try {
    if (!fs.existsSync(WIREFRAMES_PATH)) {
      fs.writeFileSync(WIREFRAMES_PATH, '[]', 'utf8');
      return [];
    }
    const data = fs.readFileSync(WIREFRAMES_PATH, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Error leyendo wireframes.json:', err);
    return [];
  }
}

export function saveWireframes(list) {
  try {
    fs.writeFileSync(WIREFRAMES_PATH, JSON.stringify(list, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error('Error guardando wireframes.json:', err);
    return false;
  }
}

export function getWireframeByProyectoId(proyectoId) {
  const list = getWireframes();
  return list.find(w => w.proyectoId === proyectoId);
}

/**
 * Genera StoryBrand y Wireframe UX de alta conversión usando Google Gemini Flash (Capa Gratuita),
 * con fallback instantáneo a plantilla determinista en caso de desconexión o límite de cuota.
 */
export async function generarStoryBrandAuto(proyecto) {
  const list = getWireframes();
  const existing = list.find(w => w.proyectoId === proyecto.id);

  const cliente = proyecto.cliente || {};
  const nombreComercial = proyecto.onboarding?.datos?.nombreComercial || cliente.empresa || cliente.nombre || 'Negocio';
  const slogan = proyecto.onboarding?.datos?.slogan || 'Soluciones profesionales y atención de primera clase';
  const actividad = cliente.actividad || 'Servicios Especializados';
  const telefono = proyecto.onboarding?.datos?.telefonoEmergencia || cliente.telefono || '';
  const whatsapp = proyecto.onboarding?.datos?.whatsappVentas || cliente.telefono || '';
  const pais = proyecto.pais || 'SV';
  const paisNombre = pais === 'DO' ? 'República Dominicana' : 'El Salvador';
  const ubicacion = cliente.ubicacion || (pais === 'DO' ? 'Santo Domingo' : 'San Salvador');

  // Recopilar módulos contratados en SOW
  const modulosContratados = Array.isArray(proyecto.modulos) && proyecto.modulos.length > 0
    ? proyecto.modulos.map(m => `- ${m.titulo}: ${m.descripcion || ''}`).join('\n')
    : '- Plataforma Web Mobile-First\n- Canales de Cierre & WhatsApp 24/7\n- Posicionamiento en Google Maps & SEO Local';

  // Recopilar insumos de onboarding de Fase 3
  const onboardingDatos = proyecto.onboarding?.datos || {};
  const insumosOnboarding = Object.entries(onboardingDatos)
    .filter(([_, v]) => typeof v === 'string' && v.trim().length > 0)
    .map(([k, v]) => `- ${k}: ${v}`)
    .join('\n') || '- Datos base proporcionados en contrato inicial';

  // 1. Intentar generación con Google Gemini (Free Tier)
  const settings = getSettings();
  const geminiKey = process.env.GEMINI_API_KEY || settings.geminiApiKey;

  if (geminiKey && geminiKey.trim()) {
    const prompt = `Eres el Director Creativo de Copywriting de la agencia "Goglite" y un experto de clase mundial en el Framework StoryBrand de Donald Miller.
Tu misión es diseñar la estrategia completa de copywriting de alta conversión para el siguiente cliente real:

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
1. El cliente es el HÉROE; la empresa es la GUÍA (Empatía genuina + Autoridad sólida).
2. Tono persuasivo, humano, hiper-local para ${paisNombre}. Cero clichés genéricos.
3. Prueba de los 5 segundos: El titular y subtítulo del Hero deben responder con total claridad: ¿Qué ofreces? ¿Cómo mejora mi vida? ¿Cómo lo adquiero?
4. Genera las 7 secciones completas y detalladas listas para maquetar en web.

Devuelve EXCLUSIVAMENTE un JSON válido (sin formato markdown adicional) con esta estructura exacta:
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

    const modelsToTry = ['gemini-3.5-flash', 'gemini-3.1-flash-lite', 'gemini-flash-lite-latest'];
    for (const model of modelsToTry) {
      try {
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`, {
          method: 'POST',
          signal: AbortSignal.timeout(14000),
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
          let rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
          rawText = rawText.replace(/\`\`\`json/gi, '').replace(/\`\`\`/g, '').trim();
          const parsed = JSON.parse(rawText);

          if (parsed.storyBrand && Array.isArray(parsed.seccionesWireframe)) {
            const aiWireframe = {
              id: existing ? existing.id : 'wf-' + proyecto.id,
              proyectoId: proyecto.id,
              clienteNombre: cliente.nombre,
              empresa: nombreComercial,
              nicho: actividad,
              pais,
              fechaActualizacion: new Date().toISOString().split('T')[0],
              aiGenerated: true,
              aiModel: model,
              storyBrand: parsed.storyBrand,
              seccionesWireframe: parsed.seccionesWireframe
            };

            if (existing) {
              const idx = list.findIndex(w => w.id === existing.id);
              list[idx] = aiWireframe;
            } else {
              list.unshift(aiWireframe);
            }
            saveWireframes(list);
            return aiWireframe;
          }
        }
      } catch (geminiErr) {
        console.warn(`[StoryBrand AI] Fallo en modelo ${model}:`, geminiErr.message);
      }
    }
  }

  // 2. Fallback Determinista a Plantilla Estructurada (Cero Caídas)
  const nuevoWireframe = {
    id: existing ? existing.id : 'wf-' + proyecto.id,
    proyectoId: proyecto.id,
    clienteNombre: cliente.nombre,
    empresa: nombreComercial,
    nicho: actividad,
    pais: proyecto.pais || 'SV',
    fechaActualizacion: new Date().toISOString().split('T')[0],
    storyBrand: {
      heroe: {
        identidad: `Clientes y usuarios que buscan ${actividad.toLowerCase()} confiables y con garantía.`,
        deseo: `Resolver su necesidad de forma ágil, transparente y con resultados garantizados sin pérdidas de tiempo.`
      },
      problema: {
        externo: `Requiere contratar ${actividad.toLowerCase()} de calidad y no encuentra proveedores serios o disponibles de inmediato.`,
        interno: `Frustración por cotizaciones infladas, falta de puntualidad o malas experiencias previas con profesionales informales.`,
        filosofico: `Toda persona o empresa merece recibir una atención profesional, justa y sin complicaciones al momento de contratar.`
      },
      guia: {
        empatia: `En ${nombreComercial} comprendemos lo valioso que es tu tiempo y tu dinero. Sabemos que buscas tranquilidad y efectividad.`,
        autoridad: `Trayectoria consolidada, atención personalizada, procesos estandarizados y cientos de clientes satisfechos respaldan nuestro trabajo.`
      },
      plan: {
        paso1: `1. Contáctanos por WhatsApp o teléfono al instante.`,
        paso2: `2. Evaluamos tu requerimiento y te brindamos una cotización clara y sin letras pequeñas.`,
        paso3: `3. Ejecutamos el servicio con puntualidad y garantía total de satisfacción.`
      },
      llamadaAccion: {
        directa: `Solicitar Asistencia Ahora (${telefono || 'Llamada Directa'})`,
        transitoria: `Consultar por WhatsApp sin compromiso`
      },
      exito: `Tu problema queda resuelto en tiempo récord, con calidad superior y la tranquilidad de haber confiado en los mejores.`,
      fracasoEvitado: `Evitas desperdiciar dinero en soluciones a medias, demoras injustificadas y dolores de cabeza con proveedores informales.`
    },
    seccionesWireframe: [
      {
        id: 'sec-1',
        tipo: 'hero',
        etiqueta: 'Sección 1: Cabecera Hero (Prueba de los 5 Segundos)',
        titular: `${nombreComercial}: ${slogan}`,
        subtitulo: `Especialistas en ${actividad.toLowerCase()}. Te atendemos de inmediato con garantía de calidad y atención personalizada.`,
        ctaPrincipal: `Llamar Ahora (${telefono || 'Contacto Directo'})`,
        ctaSecundario: `Escribir por WhatsApp (${whatsapp || 'Chat Rápido'})`,
        insigniasConfianza: [
          '⚡ Respuesta en minutos',
          '🛡️ Garantía de servicio 100%',
          '⭐ Calificación destacada'
        ],
        layout: 'split_hero_cta'
      },
      {
        id: 'sec-2',
        tipo: 'problema',
        etiqueta: 'Sección 2: El Problema (Puntos de Dolor)',
        titular: '¿Cansado de la Informalidad y las Promesas Incumplidas?',
        subtitulo: 'Sabemos lo difícil que es encontrar un servicio confiable. Esto es lo que evitas al trabajar con nosotros:',
        puntosDolor: [
          { titulo: 'Retrasos Injustificados', desc: 'Proveedores que no cumplen sus horarios ni sus compromisos pactados.' },
          { titulo: 'Precios Ocultos', desc: 'Sorpresas desagradables al final del servicio que no estaban en la cotización.' },
          { titulo: 'Trabajos de Baja Calidad', desc: 'Soluciones improvisadas que se dañan a los pocos días y no tienen garantía.' }
        ],
        layout: '3_cards_pain_points'
      },
      {
        id: 'sec-3',
        tipo: 'solucion',
        etiqueta: 'Sección 3: Servicios & Soluciones',
        titular: `Nuestras Soluciones para Tu Tranquilidad`,
        subtitulo: `Servicios diseñados para cubrir cada una de tus necesidades con el más alto estándar.`,
        servicios: [
          { nombre: 'Servicio Estándar de Alta Eficiencia', detalle: 'Atención rápida y diagnósticos precisos para resolver tu requerimiento.' },
          { nombre: 'Atención Inmediata y Urgente', detalle: 'Disponibilidad prioritaria para emergencias y necesidades imprevistas.' },
          { nombre: 'Mantenimiento y Soporte Continuo', detalle: 'Seguimiento especializado para asegurar la durabilidad y correcto funcionamiento.' }
        ],
        layout: '4_services_grid'
      },
      {
        id: 'sec-4',
        tipo: 'guia',
        etiqueta: 'Sección 4: La Guía (Empatía + Autoridad)',
        titular: `Tu Aliado de Confianza en ${proyecto.cliente?.ubicacion || 'la Zona'}`,
        subtitulo: `Más que proveedores, somos un equipo comprometido con resolver tu problema de la manera más honesta y profesional.`,
        metricas: [
          { valor: '+10 Años', label: 'Experiencia Comprobada' },
          { valor: '99%', label: 'Satisfacción de Clientes' },
          { valor: '100%', label: 'Garantía en Cada Trabajo' }
        ],
        layout: 'guide_empathy_stats'
      },
      {
        id: 'sec-5',
        tipo: 'plan',
        etiqueta: 'Sección 5: El Plan en 3 Pasos (Sencillo y Transparente)',
        titular: 'Cómo Trabajamos: Fácil y Sin Enredos',
        subtitulo: 'Un proceso directo pensado para tu comodidad:',
        pasos: [
          { num: '1', titulo: 'Contáctanos', desc: 'Llámanos o escríbenos por WhatsApp con los detalles de tu necesidad.' },
          { num: '2', titulo: 'Recibe tu Propuesta', desc: 'Te damos una cotización transparente y fijamos el plan de acción.' },
          { num: '3', titulo: 'Disfruta el Resultado', desc: 'Realizamos el trabajo con excelencia y garantía total.' }
        ],
        layout: '3_step_horizontal'
      },
      {
        id: 'sec-6',
        tipo: 'social_proof',
        etiqueta: 'Sección 6: Prueba Social & Testimonios',
        titular: 'Lo Que Dicen Nuestros Clientes',
        subtitulo: 'La satisfacción de quienes ya confían en nosotros es nuestra mejor carta de presentación.',
        testimonios: [
          { cliente: 'Cliente Satisfecho', texto: 'Excelente atención y puntualidad. Resolvieron exactamente lo que necesitaba y a un precio justo.', rating: 5 },
          { cliente: 'Empresa Local', texto: 'Muy formales y profesionales. Nos atendieron el mismo día y con una amabilidad impecable.', rating: 5 }
        ],
        layout: 'testimonials_carousel'
      },
      {
        id: 'sec-7',
        tipo: 'cta_final',
        etiqueta: 'Sección 7: Llamada a la Acción Final',
        titular: `¿Listo para Resolver tu Necesidad con ${nombreComercial}?`,
        subtitulo: `No dejes pasar más tiempo. Contáctanos hoy mismo y recibe atención inmediata y asesoría experta.`,
        ctaPrincipal: `Contactar Ahora Mismo (${telefono || 'Llamada'})`,
        ctaSecundario: `Escribir a WhatsApp`,
        layout: 'high_contrast_closing_banner'
      }
    ]
  };

  if (existing) {
    const idx = list.findIndex(w => w.id === existing.id);
    list[idx] = nuevoWireframe;
  } else {
    list.unshift(nuevoWireframe);
  }

  saveWireframes(list);
  return nuevoWireframe;
}
