import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getLeads } from './storage.js';
import { syncLeadToCloud, deleteLeadFromCloud } from './cloudSync.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CRM_PATH = path.join(__dirname, '../data/crm_leads.json');

// Helper to seed or format WhatsApp conversation data following whatsapp-conversational-selling
function ensureLeadWhatsApp(l, index = 0) {
  if (l.whatsappData && Array.isArray(l.whatsappData.mensajes) && l.whatsappData.mensajes.length > 0) {
    return l;
  }
  const nombre = (l.contacto || 'Estimado').split(' ')[0];
  const empresa = l.empresa || 'su empresa';
  const dominio = l.dominio || '';
  const stage = l.etapa || 'contactado';

  let temperatura = 'tibio';
  let estadoSeguimiento = 'esperando_respuesta';
  let mensajes = [];

  if (stage === 'nuevo') {
    temperatura = 'frio';
    estadoSeguimiento = 'esperando_respuesta';
    mensajes = [
      {
        id: `wa-m-${index}-1`,
        emisor: 'agencia',
        texto: `¡Hola ${nombre}! 👋 Qué gusto saludarte. Vi el sitio de ${empresa} (${dominio}) y noté un par de oportunidades clave en velocidad móvil y posicionamiento en Google para búsquedas locales. ¿Te gustaría que te comparta una auditoría breve de 2 minutos sin costo?`,
        fechaHora: '10 Oct 09:15',
        leido: true
      }
    ];
  } else if (stage === 'contactado') {
    temperatura = 'tibio';
    estadoSeguimiento = 'dia_1_valor';
    mensajes = [
      {
        id: `wa-m-${index}-1`,
        emisor: 'agencia',
        texto: `¡Hola ${nombre}! 👋 Qué gusto saludarte. Vi el sitio de ${empresa} y noté que tarda más de 4.5s en abrir en celulares en conexiones locales. ¿Me permites hacerte un par de preguntas rápidas sobre cómo están captando clientes hoy?`,
        fechaHora: '09 Oct 10:30',
        leido: true
      },
      {
        id: `wa-m-${index}-2`,
        emisor: 'cliente',
        texto: `Hola, buenos días. Sí, cuéntame qué detectaron. La web la hicieron hace tiempo y casi no nos genera contactos directos.`,
        fechaHora: '09 Oct 11:05',
        leido: true
      },
      {
        id: `wa-m-${index}-3`,
        emisor: 'agencia',
        texto: `Justo eso detectamos ${nombre}. La falta de optimización móvil y Schema local hace que pierdan clientes calificados frente a competidores directos. Estamos implementando sitios en Antigravity que cargan en menos de 1s con StoryBrand para triplicar la conversión directa a WhatsApp. ¿Para cuándo les gustaría tener este canal generando ventas activas?`,
        fechaHora: '09 Oct 11:20',
        leido: true
      }
    ];
  } else if (stage === 'reunion' || stage === 'propuesta_enviada') {
    temperatura = 'caliente';
    estadoSeguimiento = 'dia_3_seguimiento';
    mensajes = [
      {
        id: `wa-m-${index}-1`,
        emisor: 'agencia',
        texto: `Hola ${nombre}, un gusto saludarte. Te comparto el enlace a tu Portal de Cliente privado con la auditoría técnica completa y la estructura de conversión propuesta:`,
        fechaHora: '09 Oct 15:00',
        leido: true
      },
      {
        id: `wa-m-${index}-2`,
        emisor: 'agencia',
        texto: `🔗 Acceso al Portal: http://localhost:5173/portal/${l.portalToken || 'portal-demo'}`,
        fechaHora: '09 Oct 15:01',
        leido: true
      },
      {
        id: `wa-m-${index}-3`,
        emisor: 'cliente',
        texto: `Excelente, ya pude entrar al portal. Se ve muy claro el diagnóstico y el wireframe propuesto. ¿Qué opciones de presupuesto tenemos para arrancar?`,
        fechaHora: '10 Oct 09:40',
        leido: true
      },
      {
        id: `wa-m-${index}-4`,
        emisor: 'agencia',
        texto: `¡Qué bueno que lo viste ${nombre}! Te cargamos una propuesta VIP con opciones escalonadas y pagos 50/50. ¿Te parece si agendamos una llamada rápida de 15 min hoy a las 3:00 PM o prefieres a las 5:00 PM para revisar el plan de entrega en 10 días?`,
        fechaHora: '10 Oct 10:15',
        leido: true
      }
    ];
  } else if (stage === 'negociacion' || stage === 'ganado') {
    temperatura = 'caliente';
    estadoSeguimiento = stage === 'ganado' ? 'cerrado_ganado' : 'en_dialogo';
    mensajes = [
      {
        id: `wa-m-${index}-1`,
        emisor: 'cliente',
        texto: `Hola, ya revisamos la propuesta con la gerencia. Nos gustó el paquete Growth con optimización SEO local y motor de conversión. ¿Cuál es el siguiente paso para dar inicio?`,
        fechaHora: '10 Oct 14:10',
        leido: true
      },
      {
        id: `wa-m-${index}-2`,
        emisor: 'agencia',
        texto: `¡Excelente noticia ${nombre}! 🚀 El siguiente paso es activar el contrato digital SOW y registrar el anticipo del 50%. En tu portal de cliente ya tienes el contrato listo para firma electrónica. ¡Arrancamos de inmediato con la arquitectura StoryBrand!`,
        fechaHora: '10 Oct 14:25',
        leido: true
      },
      ...(stage === 'ganado' ? [{
        id: `wa-m-${index}-3`,
        emisor: 'cliente',
        texto: `Listo, ya firmamos el contrato y enviamos el comprobante por el portal. ¡Avanzamos con todo!`,
        fechaHora: '10 Oct 16:00',
        leido: true
      }] : [])
    ];
  } else {
    temperatura = 'frio';
    estadoSeguimiento = 'dia_7_cierre';
    mensajes = [
      {
        id: `wa-m-${index}-1`,
        emisor: 'agencia',
        texto: `Hola ${nombre}, asumo que las prioridades cambiaron por ahora. Dejo tu cotización en pausa y cuando estés listo retomamos sin problema. ¡Un gran abrazo!`,
        fechaHora: '08 Oct 11:00',
        leido: true
      }
    ];
  }

  l.whatsappData = {
    telefono: l.telefono || (l.pais === 'DO' ? '+1 809 555-0199' : '+503 7000-1122'),
    temperatura,
    estadoSeguimiento,
    ultimoMensajeFecha: '2026-10-10',
    mensajes
  };

  return l;
}

// Initialize with sample leads from leads.json if empty
function initializeCrmData() {
  if (fs.existsSync(CRM_PATH)) {
    try {
      const content = fs.readFileSync(CRM_PATH, 'utf8');
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed)) {
        if (parsed.length === 0) return [];
        let changed = false;
        const enriched = parsed.map((item, idx) => {
          if (!item.whatsappData || !Array.isArray(item.whatsappData.mensajes)) {
            changed = true;
            return ensureLeadWhatsApp(item, idx);
          }
          return item;
        });
        if (changed) {
          saveCrmLeads(enriched);
        }
        return enriched;
      }
    } catch (e) {
      console.warn('Error parseando crm_leads.json, recreando:', e);
    }
  }

  try {
    fs.writeFileSync(CRM_PATH, JSON.stringify([], null, 2), 'utf8');
  } catch (err) {
    console.error('Error inicializando crm_leads.json:', err);
  }

  return [];
}

export function getCrmLeads() {
  try {
    if (!fs.existsSync(CRM_PATH)) {
      return initializeCrmData();
    }
    const data = fs.readFileSync(CRM_PATH, 'utf8');
    const parsed = JSON.parse(data);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      return initializeCrmData();
    }

    let modified = false;
    const enriched = parsed.map((item, idx) => {
      if (!item.whatsappData || !Array.isArray(item.whatsappData.mensajes)) {
        modified = true;
        return ensureLeadWhatsApp(item, idx);
      }
      return item;
    });

    if (modified) {
      saveCrmLeads(enriched);
    }

    return enriched;
  } catch (err) {
    console.error('Error leyendo crm_leads.json:', err);
    return initializeCrmData();
  }
}

export function saveCrmLeads(list) {
  try {
    fs.writeFileSync(CRM_PATH, JSON.stringify(list, null, 2), 'utf8');
  } catch (err) {
    console.warn('[CRM Storage] Entorno Serverless/Read-only, persistiendo directo a la nube:', err.message);
  }
  // Sincronización transparente en segundo plano con Cloud Firestore y Neon PostgreSQL
  if (Array.isArray(list)) {
    list.forEach(lead => {
      syncLeadToCloud(lead).catch(err => {
        console.warn('[CRM Sync] Error sincronizando lead en background:', lead.id, err.message);
      });
    });
  }
  return true;
}

export function deleteCrmLead(id) {
  try {
    const leads = getCrmLeads();
    const filtered = leads.filter(l => l.id !== id && l.leadId !== id);
    fs.writeFileSync(CRM_PATH, JSON.stringify(filtered, null, 2), 'utf8');
  } catch (err) {
    console.warn('[CRM Storage] Entorno Serverless/Read-only al eliminar lead:', err.message);
  }
  deleteLeadFromCloud(id).catch(err => {
    console.warn('[CRM Sync] Error eliminando lead en background:', id, err.message);
  });
  return true;
}

export function getCrmLeadById(id) {
  const leads = getCrmLeads();
  return leads.find(l => l.id === id) || null;
}

export function getCrmLeadByToken(token) {
  const leads = getCrmLeads();
  const found = leads.find(l => l.portalToken === token || l.id === token);
  if (found) return found;
  if (token === 'portal-demo' && leads.length > 0) return leads[0];
  return null;
}

export function updateCrmLeadStage(id, nuevaEtapa) {
  const leads = getCrmLeads();
  const idx = leads.findIndex(l => l.id === id);
  if (idx === -1) return null;

  const probabilidades = {
    nuevo: 10,
    contactado: 25,
    reunion: 45,
    propuesta_enviada: 65,
    negociacion: 85,
    ganado: 100,
    perdido: 0
  };

  leads[idx].etapa = nuevaEtapa;
  leads[idx].probabilidad = probabilidades[nuevaEtapa] ?? 20;
  leads[idx].actualizadoEn = new Date().toISOString().split('T')[0];

  // Auto-update client portal progress
  if (leads[idx].portalConfig) {
    if (nuevaEtapa === 'ganado') {
      leads[idx].portalConfig.progresoPorcentaje = 60;
      leads[idx].portalConfig.faseActual = 'Desarrollo Web & StoryBrand';
    } else if (nuevaEtapa === 'negociacion') {
      leads[idx].portalConfig.progresoPorcentaje = 40;
      leads[idx].portalConfig.faseActual = 'Revisión de Contrato SOW';
    } else if (nuevaEtapa === 'propuesta_enviada') {
      leads[idx].portalConfig.progresoPorcentaje = 25;
      leads[idx].portalConfig.faseActual = 'Presupuesto Presentado';
    }
  }

  saveCrmLeads(leads);
  return leads[idx];
}

export function addCrmInteraction(id, interaction) {
  const leads = getCrmLeads();
  const idx = leads.findIndex(l => l.id === id);
  if (idx === -1) return null;

  const nuevaInteraccion = {
    id: 'int-' + Date.now(),
    tipo: interaction.tipo || 'nota', // 'whatsapp' | 'email' | 'llamada' | 'reunion' | 'nota'
    fecha: interaction.fecha || new Date().toISOString().split('T')[0],
    titulo: interaction.titulo || 'Registro de Actividad',
    detalle: interaction.detalle || '',
    proximoPaso: interaction.proximoPaso || '',
    fechaProximoPaso: interaction.fechaProximoPaso || ''
  };

  if (!leads[idx].interacciones) leads[idx].interacciones = [];
  leads[idx].interacciones.unshift(nuevaInteraccion);
  leads[idx].actualizadoEn = new Date().toISOString().split('T')[0];

  saveCrmLeads(leads);
  return leads[idx];
}

export function addClientUploadedAsset(token, asset) {
  const leads = getCrmLeads();
  const idx = leads.findIndex(l => l.portalToken === token);
  if (idx === -1) return null;

  if (!leads[idx].portalConfig) {
    leads[idx].portalConfig = { archivosSubidos: [] };
  }
  if (!leads[idx].portalConfig.archivosSubidos) {
    leads[idx].portalConfig.archivosSubidos = [];
  }

  const nuevoArchivo = {
    id: 'file-' + Date.now(),
    nombre: asset.nombre || 'Archivo_Cliente.zip',
    fecha: new Date().toISOString().split('T')[0],
    tipo: asset.tipo || 'documento',
    tamaño: asset.tamaño || '2.5 MB'
  };

  leads[idx].portalConfig.archivosSubidos.push(nuevoArchivo);
  saveCrmLeads(leads);
  return leads[idx];
}

export function updateClientPortalConfig(token, updates) {
  const leads = getCrmLeads();
  const idx = leads.findIndex(l => l.portalToken === token || l.id === token);
  if (idx === -1) return null;

  if (!leads[idx].portalConfig) {
    leads[idx].portalConfig = {};
  }

  // Merge portal config updates
  leads[idx].portalConfig = {
    ...leads[idx].portalConfig,
    ...updates,
    ultimaActualizacion: new Date().toISOString()
  };

  // If contract signed in phase 2 or deposit confirmed, advance lead to 'ganado'
  if (updates.fase2Firmada || updates.anticipoPagado) {
    leads[idx].etapa = 'ganado';
    leads[idx].probabilidad = 100;
  }

  leads[idx].actualizadoEn = new Date().toISOString().split('T')[0];
  saveCrmLeads(leads);
  return leads[idx];
}

// Add a WhatsApp chat message to a lead
export function addWhatsAppMessage(id, messageData) {
  const leads = getCrmLeads();
  const idx = leads.findIndex(l => l.id === id);
  if (idx === -1) return null;

  if (!leads[idx].whatsappData) {
    ensureLeadWhatsApp(leads[idx], idx);
  }

  const now = new Date();
  const timeStr = `${now.getDate()} ${['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'][now.getMonth()]} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  const nuevoMsg = {
    id: 'wa-msg-' + Date.now(),
    emisor: messageData.emisor || 'agencia', // 'agencia' | 'cliente'
    texto: messageData.texto || '',
    tipo: messageData.tipo || 'texto',
    fechaHora: timeStr,
    leido: true
  };

  leads[idx].whatsappData.mensajes.push(nuevoMsg);
  leads[idx].whatsappData.ultimoMensajeFecha = now.toISOString().split('T')[0];
  leads[idx].actualizadoEn = now.toISOString().split('T')[0];

  // Also register an activity interaction in the lead's history
  if (!leads[idx].interacciones) leads[idx].interacciones = [];
  leads[idx].interacciones.unshift({
    id: 'int-wa-' + Date.now(),
    tipo: 'whatsapp',
    fecha: now.toISOString().split('T')[0],
    titulo: messageData.emisor === 'agencia' ? 'Mensaje Enviado por WhatsApp' : 'Respuesta Recibida de Cliente (WhatsApp)',
    detalle: (messageData.texto || '').substring(0, 120) + ((messageData.texto || '').length > 120 ? '...' : ''),
    proximoPaso: messageData.proximoPaso || 'Continuar conversación / Agendar demo',
    fechaProximoPaso: ''
  });

  saveCrmLeads(leads);
  return leads[idx];
}

// Update WhatsApp lead metadata (temperature, follow-up status, phone)
export function updateWhatsAppLeadMeta(id, meta) {
  const leads = getCrmLeads();
  const idx = leads.findIndex(l => l.id === id);
  if (idx === -1) return null;

  if (!leads[idx].whatsappData) {
    ensureLeadWhatsApp(leads[idx], idx);
  }

  if (meta.temperatura) leads[idx].whatsappData.temperatura = meta.temperatura;
  if (meta.estadoSeguimiento) leads[idx].whatsappData.estadoSeguimiento = meta.estadoSeguimiento;
  if (meta.telefono) {
    leads[idx].whatsappData.telefono = meta.telefono;
    leads[idx].telefono = meta.telefono;
  }
  if (meta.etapa) {
    leads[idx].etapa = meta.etapa;
  }

  leads[idx].actualizadoEn = new Date().toISOString().split('T')[0];

  saveCrmLeads(leads);
  return leads[idx];
}

