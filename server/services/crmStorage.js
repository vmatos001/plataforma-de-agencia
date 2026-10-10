import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getLeads } from './storage.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CRM_PATH = path.join(__dirname, '../data/crm_leads.json');

// Initialize with sample leads from leads.json if empty
function initializeCrmData() {
  if (fs.existsSync(CRM_PATH)) {
    try {
      const content = fs.readFileSync(CRM_PATH, 'utf8');
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    } catch (e) {
      console.warn('Error parseando crm_leads.json, recreando:', e);
    }
  }

  // Seed from leads.json
  const rawLeads = getLeads();
  const stages = ['nuevo', 'contactado', 'reunion', 'propuesta_enviada', 'negociacion', 'ganado'];
  const values = [950, 1500, 2200, 1800, 3200, 2600];

  const initialCrmLeads = rawLeads.slice(0, 12).map((l, index) => {
    const stage = stages[index % stages.length];
    const val = values[index % values.length];
    const token = 'portal-' + (l.id || 'lead') + '-' + Math.random().toString(36).substring(2, 8);

    return {
      id: 'crm-' + (l.id || `lead-${index}`),
      leadId: l.id || null,
      empresa: l.nombreEmpresa || l.dominio || 'Empresa Prospectada',
      contacto: l.responsable || 'Director General',
      cargo: l.cargo || 'Propietario / Gerente',
      email: l.email || `contacto@${l.dominio}`,
      telefono: l.telefono || (l.pais === 'DO' ? '+1 809 555-0199' : '+503 7000-1122'),
      pais: l.pais || 'SV',
      dominio: l.dominio || '',
      etapa: stage,
      valorEstimado: val,
      probabilidad: stage === 'ganado' ? 100 : stage === 'negociacion' ? 80 : stage === 'propuesta_enviada' ? 60 : stage === 'reunion' ? 40 : stage === 'contactado' ? 25 : 10,
      fuente: 'Scraper Google SERP',
      portalToken: token,
      interacciones: [
        {
          id: 'int-1-' + index,
          tipo: 'nota',
          fecha: '2026-10-09',
          titulo: 'Diagnóstico Inicial Detectado',
          detalle: 'Prospecto captado vía Scraper. Puntos críticos: falta de Schema JSON-LD y tiempo de respuesta.',
          proximoPaso: 'Enviar primer contacto de auditoría por WhatsApp',
          fechaProximoPaso: '2026-10-11'
        },
        ...(stage !== 'nuevo' ? [{
          id: 'int-2-' + index,
          tipo: 'whatsapp',
          fecha: '2026-10-10',
          titulo: 'Primer Contacto por WhatsApp',
          detalle: 'Enviado pitch de valor enfocado en conversión local y optimización en motores de IA.',
          proximoPaso: stage === 'contactado' ? 'Esperar respuesta o dar seguimiento en 48h' : 'Agendar videollamada de 15 min',
          fechaProximoPaso: '2026-10-12'
        }] : []),
        ...(stage === 'reunion' || stage === 'propuesta_enviada' || stage === 'negociacion' || stage === 'ganado' ? [{
          id: 'int-3-' + index,
          tipo: 'reunion',
          fecha: '2026-10-10',
          titulo: 'Reunión de Diagnóstico Estratégico',
          detalle: 'El cliente confirmó interés en rediseñar su sitio para superar a su principal competidor local.',
          proximoPaso: 'Enviar propuesta formal VIP con opciones de inversión',
          fechaProximoPaso: '2026-10-11'
        }] : [])
      ],
      portalConfig: {
        portalActivo: true,
        faseActual: stage === 'ganado' ? 'Desarrollo Web & StoryBrand' : 'Diagnóstico Comercial',
        progresoPorcentaje: stage === 'ganado' ? 50 : stage === 'negociacion' ? 35 : stage === 'propuesta_enviada' ? 25 : 10,
        archivosSubidos: [
          { id: 'f-1', nombre: 'Logo_Vector_Marca.png', fecha: '2026-10-10', tipo: 'imagen', tamaño: '1.2 MB' }
        ],
        notasCliente: 'Prioridad: Captación de citas directas por WhatsApp móvil.',
        presupuestoId: null,
        proyectoId: null
      },
      creadoEn: '2026-10-08',
      actualizadoEn: '2026-10-10'
    };
  });

  try {
    fs.writeFileSync(CRM_PATH, JSON.stringify(initialCrmLeads, null, 2), 'utf8');
  } catch (err) {
    console.error('Error inicializando crm_leads.json:', err);
  }

  return initialCrmLeads;
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
    return parsed;
  } catch (err) {
    console.error('Error leyendo crm_leads.json:', err);
    return initializeCrmData();
  }
}

export function saveCrmLeads(list) {
  try {
    fs.writeFileSync(CRM_PATH, JSON.stringify(list, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error('Error guardando crm_leads.json:', err);
    return false;
  }
}

export function getCrmLeadById(id) {
  const leads = getCrmLeads();
  return leads.find(l => l.id === id) || null;
}

export function getCrmLeadByToken(token) {
  const leads = getCrmLeads();
  return leads.find(l => l.portalToken === token) || null;
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
