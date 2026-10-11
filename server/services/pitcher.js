import { getSettings } from './storage.js';

/**
 * Generates an ultra-personalized cold email pitch based on audit findings and lead profile
 */
export async function generatePitch(lead, audit, country = 'SV') {
  const settings = getSettings();
  const geminiKey = process.env.GEMINI_API_KEY || settings.geminiApiKey;

  const isDO = country.toUpperCase() === 'DO';
  const cName = isDO ? 'República Dominicana' : 'El Salvador';

  const isMapsNoWeb = Boolean(lead.sinWeb || lead.dominio?.startsWith('maps-') || audit.tipoAuditoria === 'google_maps_no_web');
  const resenasCount = lead.resenas || audit.resenas || 50;
  const ratingVal = lead.calificacion || audit.rating || 4.8;

  // 1. Try Gemini if configured
  if (geminiKey && geminiKey.trim()) {
    try {
      const prompt = isMapsNoWeb 
        ? `Redacta una propuesta de prospección comercial persuasiva, empática y directa para la agencia de desarrollo web y posicionamiento IA "Goglite".
Destinatario: ${lead.responsable || 'Dirección / Gerencia General'} del negocio "${lead.nombreEmpresa || lead.titulo || lead.dominio}".
País: ${cName}.
Canal: Google Maps (Lead sin página web).
Datos de reputación: Tiene ${resenasCount} reseñas con calificación de ${ratingVal} estrellas en Google Maps.
Puntos detectados en auditoría:
${audit.puntos.map((p, idx) => `${idx + 1}. ${p.titulo}: ${p.problema}`).join('\n')}

Reglas de redacción:
1. Tono: Muy profesional, felicitándolos sinceramente por su sólida reputación de ${resenasCount} reseñas en Google Maps.
2. Problema real: Explicarles que carecer de sitio web propio provoca fugas de clientes ante Google orgánico y ante IAs (ChatGPT, Perplexity) que no pueden verificar sus servicios ni permitir agendamiento 24/7.
3. Propuesta de valor: En Goglite transformamos esa reputación en una máquina web moderna de captación directa de clientes.
4. CTA suave: Preguntar si tienen 10 minutos para revisar una propuesta/demo sin compromiso.
5. Firma: Víctor Matos, Goglite — Agencia Web & Inteligencia Artificial.
Devuelve únicamente el cuerpo del correo en texto plano.`
        : `Redacta un correo electrónico en frío corto, directo y de altísima conversión para la agencia de tecnología web y posicionamiento IA "Goglite".
Destinatario: ${lead.responsable} (${lead.cargo}) en la empresa "${lead.nombreEmpresa || lead.dominio}".
País: ${cName}.
Puntos críticos detectados en la auditoría técnica de su web:
${audit.puntos.map((p, idx) => `${idx + 1}. ${p.titulo}: ${p.problema}`).join('\n')}

Reglas de redacción:
1. Tono: Respetuoso, profesional, de consultor experto que descubrió fallos reales, cero tono de vendedor agresivo.
2. Longitud máxima: 4 párrafos concisos.
3. Menciona que no estás vendiendo una web genérica, sino cerrando fugas de ventas ante Google y los nuevos motores de IA (ChatGPT, Perplexity).
4. Llamada a la acción (CTA) suave: Preguntar si tienen 10 minutos esta semana para revisar el informe completo sin compromiso.
5. Firma: Víctor Matos, Goglite — Agencia Web & Inteligencia Artificial.

Devuelve únicamente el cuerpo del correo en texto plano.`;

      // Try gemini-1.5-flash first, fallback to gemini-2.0-flash
      const modelsToTry = ['gemini-1.5-flash', 'gemini-2.0-flash'];
      for (const model of modelsToTry) {
        try {
          const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`, {
            method: 'POST',
            signal: AbortSignal.timeout(5000),
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }]
            })
          });

          if (res.ok) {
            const data = await res.json();
            const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
            if (text) {
              console.log(`[PITCHER] Pitch generado exitosamente con Gemini (${model}) para ${lead.dominio}`);
              return text.trim();
            }
          }
        } catch (mErr) {
          console.warn(`[PITCHER] Fallo intento con modelo ${model}:`, mErr.message);
        }
      }
    } catch (err) {
      console.warn(`Gemini pitch generation failed for ${lead.dominio}:`, err.message);
    }
  }

  // 2. High-converting fallback formula
  const primerNombre = lead.responsable ? lead.responsable.split(' ')[0] : 'Estimado/a';
  const empresa = lead.nombreEmpresa || lead.dominio;

  if (isMapsNoWeb) {
    return `Hola ${primerNombre},

Felicitaciones por la destacada reputación de ${empresa} en Google Maps (${resenasCount} reseñas con ${ratingVal}★). Es evidente la confianza que tienen sus clientes en ${cName}.

Al analizar su presencia digital, identificamos una gran oportunidad: actualmente no cuentan con un sitio web oficial propio, lo que genera una fuga silenciosa de prospectos que buscan servicios en Google o consultan en IAs como ChatGPT y terminan con la competencia que sí permite agendar online.

En Goglite ayudamos a negocios líderes a transformar su reputación local en un canal automatizado de captación y reservas directas las 24 horas.

¿Le parecería interesante revisar una breve propuesta o maqueta preliminar sin ningún compromiso?

Atentamente,
Víctor Matos
Goglite — Agencia Web & Inteligencia Artificial`;
  }
  const p1 = audit.puntos[0]?.titulo || 'Invisibilidad ante asistentes de IA';
  const p2 = audit.puntos[1]?.titulo || 'Falta de optimización transaccional en Google';

  return `Hola ${primerNombre},

Estuve analizando la presencia digital de ${empresa} frente a los principales referentes de su sector en ${cName}.

Detectamos 3 puntos críticos que están frenando la captación directa de clientes y pacientes potenciales:

1. ${p1}: Su sitio carece de arquitectura semántica para los nuevos buscadores de IA (Perplexity, SearchGPT), por lo que las recomendaciones automáticas están yendo a competidores.
2. ${p2}: La estructura actual de encabezados no responde a la intención de compra directa que Google premia en las primeras 3 posiciones.
3. Tiempo de respuesta móvil: Su web presenta fricciones de carga que elevan el porcentaje de rebote en smartphones.

En Goglite ayudamos a marcas líderes a dominar tanto el posicionamiento clásico como la optimización para motores de IA (GEO) mediante infraestructuras web de alto impacto y cero lentitud.

¿Tiene 10 minutos disponibles esta semana para compartirle el diagnóstico comparativo completo y cómo resolverlo?

Saludos cordiales,
Víctor Matos
Goglite — Agencia Web & Inteligencia Artificial
WhatsApp: +1 (809) 000-0000 | goglite.com`;
}
