import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataDir = path.join(__dirname, '../data');

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const leadsFile = path.join(dataDir, 'leads.json');
const settingsFile = path.join(dataDir, 'settings.json');
const searchesFile = path.join(dataDir, 'searches.json');

// Initial sample data tailored to Goglite markets (SV & DO)
const initialLeads = [
  {
    id: "lead-sv-001",
    dominio: "clinicadentalsv.com",
    nombreEmpresa: "Clínica Dental San Salvador",
    pais: "SV",
    email: "dr.rodriguez@clinicadentalsv.com",
    responsable: "Dr. Carlos Rodríguez",
    cargo: "Director Médico & Propietario",
    telefono: "+503 2260-4490",
    posicionGoogle: 5,
    estado: "enviado_instantly",
    actualizado: "2026-10-09",
    auditoria: {
      fecha: "2026-10-09 18:20",
      puntos: [
        {
          categoria: "GEO / IA",
          prioridad: "ALTA",
          titulo: "Ausencia de marcado semántico Schema (Invisibles ante ChatGPT y Perplexity)",
          problema: "clinicadentalsv.com no implementa JSON-LD MedicalBusiness ni DentalClinic. Cuando pacientes consultan a Perplexity o ChatGPT por 'mejores dentistas en San Salvador', la IA no puede estructurar sus especialidades ni reputación.",
          porQueImporta: "El 42% de los pacientes de alto poder adquisitivo investigan con IAs antes de agendar citas. La falta de entidades estructuradas cede todas las recomendaciones a competidores.",
          competidores: "DentalStudioSV (pos #1) cuenta con 14 esquemas de entidad médica validados y es la primera recomendación citada por Perplexity en San Salvador."
        },
        {
          categoria: "SEO",
          prioridad: "ALTA",
          titulo: "Title y H1 sin keyword transaccional 'dentista san salvador'",
          problema: "El title dice únicamente 'Inicio - Especialistas' y el H1 repite 'Bienvenidos', omitiendo la intención explícita de compra y tratamiento que Google prioriza en El Salvador.",
          porQueImporta: "Pierde hasta un 65% del CTR potencial frente a búsquedas locales transaccionales en Google.",
          competidores: "Clínicas rivales posicionan en title 'Clínica Dental en San Salvador | Ortodoncia e Implantes' capturando el primer clic."
        },
        {
          categoria: "Velocidad & CRO",
          prioridad: "MEDIA",
          titulo: "LCP móvil de 4.8s y ausencia de botón flotante con WhatsApp directo",
          problema: "La web tarda 4.8 segundos en responder en redes 4G móviles y los usuarios deben llenar un formulario de 8 campos en vez de agendar por WhatsApp.",
          porQueImporta: "Más del 78% del tráfico médico en El Salvador llega por smartphone; cada segundo extra de carga duplica el rebote.",
          competidores: "Webs optimizadas cargan en 1.1s con botón háptico de WhatsApp directo."
        }
      ]
    },
    pitch: `Hola Dr. Carlos,

Estuve analizando la presencia digital de Clínica Dental San Salvador frente a las clínicas médicas de mayor crecimiento en El Salvador.

Detectamos 3 fugas técnicas clave que están afectando directamente la captación de nuevos pacientes:

1. Invisibilidad ante motores de IA: Su sitio carece de marcado semántico Schema, por lo que consultas en ChatGPT o Perplexity sobre 'mejores especialistas dentales en San Salvador' recomiendan directamente a DentalStudioSV en vez de su clínica.
2. Su Title y H1 actuales omiten términos transaccionales de búsqueda clave en Google.
3. El tiempo de carga en smartphones supera los 4.8s, perdiendo pacientes potenciales que buscan atención ágil.

En Goglite ayudamos a clínicas de alto nivel a dominar tanto Google como los nuevos motores de IA mediante arquitecturas ultrarrápidas y optimización GEO.

¿Tiene 10 minutos esta semana para mostrarle el diagnóstico completo y cómo solucionarlo?

Saludos,
Víctor Matos
Goglite — Agencia Web & Inteligencia Artificial`
  },
  {
    id: "lead-do-002",
    dominio: "inmobiliariapuntacana.do",
    nombreEmpresa: "Punta Cana Prime Realty",
    pais: "DO",
    email: "ventas@inmobiliariapuntacana.do",
    responsable: "Lic. Alejandro Mendoza",
    cargo: "Managing Director",
    telefono: "+1 809 552-8811",
    posicionGoogle: 7,
    estado: "contactado",
    actualizado: "2026-10-08",
    auditoria: {
      fecha: "2026-10-08 14:15",
      puntos: [
        {
          categoria: "GEO / IA",
          prioridad: "ALTA",
          titulo: "Falta de entidades inmobiliarias para inversionistas internacionales",
          problema: "Inversionistas de EE.UU. y Europa preguntan en ChatGPT por 'best luxury villas for sale in Punta Cana' y la web no es referenciada debido a ausencia de arquitectura semántica multidioma.",
          porQueImporta: "Los compradores de propiedades de lujo (\$300k+ USD) inician su prospección con asistentes inteligentes.",
          competidores: "PalmaRealRealty cuenta con sitemap semántico y citas automáticas en motores de IA."
        },
        {
          categoria: "Contenido",
          prioridad: "MEDIA",
          titulo: "Sin sección de FAQs sobre ley CONFOTUR y beneficios fiscales en RD",
          problema: "No resuelven en la web las dudas tributarias más buscadas por compradores extranjeros, perdiendo tráfico long-tail clave.",
          porQueImporta: "Las dudas fiscales son el principal freno de conversión antes de solicitar una visita.",
          competidores: "Las agencias líderes posicionan guías detalladas de CONFOTUR."
        }
      ]
    },
    pitch: `Estimado Lic. Mendoza,

Revisando el mercado de bienes raíces turísticos en Punta Cana, noté que Punta Cana Prime Realty tiene un portafolio excepcional pero presenta una oportunidad crítica no aprovechada en adquisición digital:

Cuando inversionistas extranjeros consultan en asistentes de IA como Perplexity o ChatGPT sobre oportunidades inmobiliarias en la zona, su inventario no aparece citado debido a la falta de marcado de datos estructurados para IA (GEO).

Adicionalmente, su web no aborda las preguntas clave sobre exenciones fiscales (Ley CONFOTUR), que hoy son el principal filtro de decisión de los compradores.

En Goglite desarrollamos infraestructuras web diseñadas para ser priorizadas tanto por Google como por las nuevas IAs de búsqueda.

¿Le parecería interesante revisar una breve comparativa de cómo su competencia está captando estos inversionistas?

Atentamente,
Víctor Matos
Goglite — Agencia de Alto Rendimiento & GEO`
  },
  {
    id: "lead-sv-003",
    dominio: "lexcorporativo.sv",
    nombreEmpresa: "Lex Consultores Legales",
    pais: "SV",
    email: "contacto@lexcorporativo.sv",
    responsable: "Dra. Sofía Valiente",
    cargo: "Socia Directora",
    telefono: "+503 2505-1200",
    posicionGoogle: 6,
    estado: "nuevo",
    actualizado: "2026-10-09",
    auditoria: null,
    pitch: null
  }
];

export const getLeads = () => {
  if (!fs.existsSync(leadsFile)) {
    fs.writeFileSync(leadsFile, JSON.stringify(initialLeads, null, 2));
    return initialLeads;
  }
  try {
    return JSON.parse(fs.readFileSync(leadsFile, 'utf8'));
  } catch {
    return initialLeads;
  }
};

export const saveLeads = (leads) => {
  fs.writeFileSync(leadsFile, JSON.stringify(leads, null, 2));
  return leads;
};

export const getSettings = () => {
  const defaultSettings = {
    geminiApiKey: process.env.GEMINI_API_KEY || "",
    serperApiKey: process.env.SERPER_API_KEY || "",
    apolloApiKey: process.env.APOLLO_API_KEY || "",
    instantlyApiKey: process.env.INSTANTLY_API_KEY || "",
    defaultCountry: "SV",
    demoMode: true, // Enables rich heuristic simulator if external paid keys aren't set
  };

  if (!fs.existsSync(settingsFile)) {
    fs.writeFileSync(settingsFile, JSON.stringify(defaultSettings, null, 2));
    return defaultSettings;
  }
  try {
    return { ...defaultSettings, ...JSON.parse(fs.readFileSync(settingsFile, 'utf8')) };
  } catch {
    return defaultSettings;
  }
};

export const saveSettings = (newSettings) => {
  const current = getSettings();
  const merged = { ...current, ...newSettings };
  fs.writeFileSync(settingsFile, JSON.stringify(merged, null, 2));
  return merged;
};

export const getSearches = () => {
  if (!fs.existsSync(searchesFile)) return [];
  try {
    return JSON.parse(fs.readFileSync(searchesFile, 'utf8'));
  } catch {
    return [];
  }
};

export const saveSearch = (searchRecord) => {
  const list = getSearches();
  list.unshift(searchRecord);
  fs.writeFileSync(searchesFile, JSON.stringify(list.slice(0, 50), null, 2));
  return list;
};
