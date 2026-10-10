import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { getLeads, saveLeads, getSettings, saveSettings, getSearches, saveSearch } from './services/storage.js';
import { searchGoogleSERP } from './services/scraper.js';
import { enrichDomain } from './services/enricher.js';
import { auditDomain } from './services/auditor.js';
import { generatePitch } from './services/pitcher.js';
import { getPresupuestos, savePresupuestos, getPlantillas } from './services/presupuestosStorage.js';
import { getProyectos, saveProyectos, crearProyectoDesdePresupuesto } from './services/proyectosStorage.js';
import { getWireframes, saveWireframes, getWireframeByProyectoId, generarStoryBrandAuto } from './services/wireframesStorage.js';
import { getSeoAudits, saveSeoAudits, getSeoAuditByProyectoId, generarSeoAuto } from './services/seoStorage.js';

import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distPath = path.join(__dirname, '../dist');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// 1. Status & Settings
app.get('/api/status', (req, res) => {
  const settings = getSettings();
  res.json({
    status: 'ok',
    version: '1.0.0',
    module: 'Lead Scrapper & Outbound AI',
    activeKeys: {
      gemini: Boolean(settings.geminiApiKey),
      serper: Boolean(settings.serperApiKey),
      apollo: Boolean(settings.apolloApiKey),
      instantly: Boolean(settings.instantlyApiKey)
    }
  });
});

app.get('/api/settings', (req, res) => {
  const settings = getSettings();
  // Mask sensitive keys for security in UI
  const masked = {
    ...settings,
    geminiApiKeyMasked: settings.geminiApiKey ? `${settings.geminiApiKey.slice(0, 4)}...${settings.geminiApiKey.slice(-4)}` : '',
    serperApiKeyMasked: settings.serperApiKey ? `${settings.serperApiKey.slice(0, 4)}...${settings.serperApiKey.slice(-4)}` : '',
    apolloApiKeyMasked: settings.apolloApiKey ? `${settings.apolloApiKey.slice(0, 4)}...${settings.apolloApiKey.slice(-4)}` : '',
    instantlyApiKeyMasked: settings.instantlyApiKey ? `${settings.instantlyApiKey.slice(0, 4)}...${settings.instantlyApiKey.slice(-4)}` : '',
  };
  res.json(masked);
});

app.post('/api/settings', (req, res) => {
  const updated = saveSettings(req.body);
  res.json({ success: true, settings: updated });
});

// 2. Search SERP
app.post('/api/search', async (req, res) => {
  try {
    const { query, country = 'SV' } = req.body;
    if (!query || !query.trim()) {
      return res.status(400).json({ error: 'La intención de búsqueda es obligatoria' });
    }

    const results = await searchGoogleSERP(query, country);

    // Save to search history
    saveSearch({
      id: 'search-' + Date.now(),
      query,
      country,
      timestamp: new Date().toISOString(),
      resultsCount: results.length
    });

    res.json({ success: true, query, country, results });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Enrich Contacts for selected items
app.post('/api/enrich', async (req, res) => {
  try {
    const { domain, companyName = '', country = 'SV' } = req.body;
    if (!domain) {
      return res.status(400).json({ error: 'Dominio es requerido' });
    }

    const contact = await enrichDomain(domain, companyName, country);
    res.json({ success: true, domain, contact });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. Audit domain
app.post('/api/audit', async (req, res) => {
  try {
    const { domain, query = '', country = 'SV' } = req.body;
    if (!domain) {
      return res.status(400).json({ error: 'Dominio es requerido' });
    }

    const audit = await auditDomain(domain, query, country);
    res.json({ success: true, domain, audit });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 5. Generate Pitch
app.post('/api/pitch', async (req, res) => {
  try {
    const { lead, audit, country = 'SV' } = req.body;
    if (!lead || !audit) {
      return res.status(400).json({ error: 'Datos de lead y auditoría son requeridos' });
    }

    const pitch = await generatePitch(lead, audit, country);
    res.json({ success: true, pitch });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 6. The 1-Click Pipeline!
app.post('/api/pipeline', async (req, res) => {
  try {
    const { query, country = 'SV', limit = 10 } = req.body;
    if (!query) return res.status(400).json({ error: 'Consulta requerida' });

    console.log(`[PIPELINE] Iniciando ejecución para "${query}" (${country})...`);

    // Step A: Search Google
    const serpResults = await searchGoogleSERP(query, country);

    // Step B: Filter out positions 1-3, keep 4 to 20
    const targetItems = serpResults.filter(r => r.posicion >= 4 && r.posicion <= 20).slice(0, limit);

    console.log(`[PIPELINE] ${targetItems.length} candidatos seleccionados en posiciones 4-20.`);

    const currentLeads = getLeads();
    const processedLeads = [];

    // Step C: Enrich, Audit, and Draft Pitch for each target
    for (const item of targetItems) {
      try {
        console.log(`[PIPELINE] Procesando: ${item.dominio}...`);
        
        // Enrich
        const contact = await enrichDomain(item.dominio, item.titulo, country);
        
        // Audit
        const audit = await auditDomain(item.dominio, query, country);

        const newLead = {
          id: 'lead-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
          dominio: item.dominio,
          nombreEmpresa: item.titulo.split('|')[0].trim(),
          pais: country,
          email: contact.email,
          responsable: contact.responsable,
          cargo: contact.cargo,
          telefono: contact.telefono,
          posicionGoogle: item.posicion,
          estado: 'nuevo',
          actualizado: new Date().toISOString().split('T')[0],
          auditoria: audit,
          pitch: null
        };

        // Generate Pitch
        newLead.pitch = await generatePitch(newLead, audit, country);

        processedLeads.push(newLead);
      } catch (e) {
        console.error(`Error procesando item ${item.dominio}:`, e.message);
      }
    }

    // Merge into storage without duplicate domains
    const existingDomains = new Set(currentLeads.map(l => l.dominio.toLowerCase()));
    const leadsToAdd = processedLeads.filter(l => !existingDomains.has(l.dominio.toLowerCase()));
    const finalLeads = [...leadsToAdd, ...currentLeads];
    saveLeads(finalLeads);

    console.log(`[PIPELINE] Completado con éxito: ${leadsToAdd.length} leads nuevos guardados.`);

    res.json({
      success: true,
      query,
      country,
      totalProcesados: processedLeads.length,
      nuevosGuardados: leadsToAdd.length,
      leads: leadsToAdd
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 7. Leads CRUD
app.get('/api/leads', (req, res) => {
  const leads = getLeads();
  res.json(leads);
});

app.post('/api/leads', (req, res) => {
  const leads = getLeads();
  const newLead = {
    id: 'lead-' + Date.now(),
    actualizado: new Date().toISOString().split('T')[0],
    estado: 'nuevo',
    ...req.body
  };
  leads.unshift(newLead);
  saveLeads(leads);
  res.json(newLead);
});

app.patch('/api/leads/:id', (req, res) => {
  const leads = getLeads();
  const idx = leads.findIndex(l => l.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Lead no encontrado' });

  leads[idx] = { ...leads[idx], ...req.body, actualizado: new Date().toISOString().split('T')[0] };
  saveLeads(leads);
  res.json(leads[idx]);
});

app.delete('/api/leads/:id', (req, res) => {
  let leads = getLeads();
  leads = leads.filter(l => l.id !== req.params.id);
  saveLeads(leads);
  res.json({ success: true });
});

// 8. Export CSV
app.get('/api/export/csv', (req, res) => {
  const leads = getLeads();
  
  const headers = ['Dominio', 'Empresa', 'País', 'Email', 'Responsable', 'Cargo', 'Teléfono', 'Posición Google', 'Estado', 'Puntos Auditoría', 'Fecha'];
  
  const rows = leads.map(l => [
    `"${l.dominio || ''}"`,
    `"${(l.nombreEmpresa || '').replace(/"/g, '""')}"`,
    `"${l.pais || ''}"`,
    `"${l.email || ''}"`,
    `"${(l.responsable || '').replace(/"/g, '""')}"`,
    `"${(l.cargo || '').replace(/"/g, '""')}"`,
    `"${l.telefono || ''}"`,
    l.posicionGoogle || '',
    `"${l.estado || ''}"`,
    `"${(l.auditoria?.puntos?.map(p => p.titulo).join('; ') || '').replace(/"/g, '""')}"`,
    `"${l.actualizado || ''}"`
  ]);

  const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="leads_goglite_outbound.csv"');
  res.send('\uFEFF' + csvContent); // BOM for Excel
});

// 9. Send to Instantly API or mark sent
app.post('/api/send-instantly', async (req, res) => {
  const { leadId } = req.body;
  const leads = getLeads();
  const lead = leads.find(l => l.id === leadId);

  if (!lead) return res.status(404).json({ error: 'Lead no encontrado' });

  const settings = getSettings();
  if (settings.instantlyApiKey) {
    // Call Instantly API webhook / lead push if configured
    try {
      await fetch('https://api.instantly.ai/api/v1/lead/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          api_key: settings.instantlyApiKey,
          email: lead.email,
          first_name: lead.responsable?.split(' ')[0] || '',
          last_name: lead.responsable?.split(' ').slice(1).join(' ') || '',
          company_name: lead.nombreEmpresa || lead.dominio,
          custom_variables: {
            dominio: lead.dominio,
            pitch: lead.pitch
          }
        })
      });
    } catch (e) {
      console.warn('Instantly push failed:', e.message);
    }
  }

  // Update lead status
  lead.estado = 'enviado_instantly';
  lead.actualizado = new Date().toISOString().split('T')[0];
  saveLeads(leads);

  res.json({ success: true, lead });
});

// ==========================================
// 10. MÓDULO 2: PRESUPUESTOS & PROPUESTAS
// ==========================================

app.get('/api/presupuestos/plantillas', (req, res) => {
  const plantillas = getPlantillas();
  res.json(plantillas);
});

app.get('/api/presupuestos', (req, res) => {
  const list = getPresupuestos();
  res.json(list);
});

app.get('/api/presupuestos/:id', (req, res) => {
  const list = getPresupuestos();
  const prop = list.find(p => p.id === req.params.id);
  if (!prop) return res.status(404).json({ error: 'Presupuesto no encontrado' });
  res.json(prop);
});

app.post('/api/presupuestos', (req, res) => {
  const list = getPresupuestos();
  const nextNum = list.length + 1;
  const newProp = {
    id: 'prop-' + Date.now(),
    codigo: `P-2026-${String(nextNum).padStart(3, '0')}`,
    fecha: new Date().toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }),
    estado: 'borrador',
    ...req.body
  };
  list.unshift(newProp);
  savePresupuestos(list);
  res.json(newProp);
});

app.patch('/api/presupuestos/:id', (req, res) => {
  const list = getPresupuestos();
  const idx = list.findIndex(p => p.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Presupuesto no encontrado' });

  list[idx] = { ...list[idx], ...req.body };
  savePresupuestos(list);
  res.json(list[idx]);
});

app.delete('/api/presupuestos/:id', (req, res) => {
  let list = getPresupuestos();
  list = list.filter(p => p.id !== req.params.id);
  savePresupuestos(list);
  res.json({ success: true });
});

// Beacon / Client viewed proposal
app.post('/api/presupuestos/:id/view', (req, res) => {
  const list = getPresupuestos();
  const prop = list.find(p => p.id === req.params.id);
  if (prop && prop.estado === 'sin_abrir') {
    prop.estado = 'visto';
    savePresupuestos(list);
  }
  res.json({ success: true, estado: prop?.estado });
});

// Client accepted proposal
app.post('/api/presupuestos/:id/accept', (req, res) => {
  const list = getPresupuestos();
  const prop = list.find(p => p.id === req.params.id);
  if (prop) {
    prop.estado = 'aceptado';
    savePresupuestos(list);
  }
  res.json({ success: true, estado: prop?.estado });
});

// ==========================================
// 11. MÓDULO 3: CONTRATOS, ONBOARDING & PROYECTOS
// ==========================================

// Listar todos los proyectos
app.get('/api/proyectos', (req, res) => {
  const list = getProyectos();
  res.json(list);
});

// Obtener un proyecto por ID
app.get('/api/proyectos/:id', (req, res) => {
  const list = getProyectos();
  const proj = list.find(p => p.id === req.params.id);
  if (!proj) return res.status(404).json({ error: 'Proyecto no encontrado' });
  res.json(proj);
});

// Crear proyecto desde un presupuesto aprobado
app.post('/api/proyectos/crear-desde-presupuesto/:presupuestoId', (req, res) => {
  const presupuestos = getPresupuestos();
  const prop = presupuestos.find(p => p.id === req.params.presupuestoId);
  if (!prop) return res.status(404).json({ error: 'Presupuesto no encontrado' });

  // Si no estaba aceptado, lo marcamos como aceptado
  prop.estado = 'aceptado';
  savePresupuestos(presupuestos);

  const nuevoProj = crearProyectoDesdePresupuesto(prop);
  res.json({ success: true, proyecto: nuevoProj });
});

// Crear proyecto manual
app.post('/api/proyectos', (req, res) => {
  const list = getProyectos();
  const nextNum = list.length + 1;
  const nuevo = {
    id: 'proj-' + Date.now(),
    codigo: `CON-2026-${String(nextNum).padStart(3, '0')}`,
    fechaCreacion: new Date().toISOString().split('T')[0],
    estado: 'contrato_pendiente',
    ...req.body
  };
  list.unshift(nuevo);
  saveProyectos(list);
  res.json(nuevo);
});

// Actualizar campos generales de un proyecto
app.patch('/api/proyectos/:id', (req, res) => {
  const list = getProyectos();
  const idx = list.findIndex(p => p.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Proyecto no encontrado' });

  list[idx] = { ...list[idx], ...req.body };
  saveProyectos(list);
  res.json(list[idx]);
});

// Eliminar proyecto
app.delete('/api/proyectos/:id', (req, res) => {
  let list = getProyectos();
  list = list.filter(p => p.id !== req.params.id);
  saveProyectos(list);
  res.json({ success: true });
});

// Firma electrónica del contrato por parte del cliente
app.post('/api/proyectos/:id/firmar', (req, res) => {
  const list = getProyectos();
  const proj = list.find(p => p.id === req.params.id);
  if (!proj) return res.status(404).json({ error: 'Proyecto no encontrado' });

  const { nombreFirmante, identificacion, firmaBase64 } = req.body;
  if (!firmaBase64) return res.status(400).json({ error: 'La firma manuscrita es obligatoria' });

  const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
  const userAgent = req.headers['user-agent'] || 'Navegador Web';

  proj.contrato.firmaCliente = {
    firmado: true,
    nombreFirmante: nombreFirmante || proj.cliente.nombre,
    identificacion: identificacion || proj.cliente.identificacion || 'Firma Digital Certificada',
    timestampUtc: new Date().toISOString(),
    ipAddress: clientIp,
    userAgent: userAgent,
    firmaBase64: firmaBase64
  };

  // Actualizar estado del proyecto e hito correspondiente
  if (proj.estado === 'contrato_pendiente') {
    proj.estado = 'firmado';
  }

  // Marcar hito de firma si existe
  const hitoFirma = proj.seguimiento?.hitos?.find(h => h.id === 'h-1');
  if (hitoFirma) {
    hitoFirma.completado = true;
    hitoFirma.fecha = new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  saveProyectos(list);
  res.json({ success: true, proyecto: proj });
});

// Guardar datos de Onboarding / Client Intake
app.post('/api/proyectos/:id/onboarding', (req, res) => {
  const list = getProyectos();
  const proj = list.find(p => p.id === req.params.id);
  if (!proj) return res.status(404).json({ error: 'Proyecto no encontrado' });

  proj.onboarding = {
    completado: true,
    fecha: new Date().toISOString().split('T')[0],
    datos: {
      ...proj.onboarding?.datos,
      ...req.body
    }
  };

  // Marcar hito de onboarding si existe
  const hitoOnb = proj.seguimiento?.hitos?.find(h => h.id === 'h-3');
  if (hitoOnb) {
    hitoOnb.completado = true;
    hitoOnb.fecha = new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  if (proj.estado === 'firmado' && proj.pagos?.anticipoEstado === 'confirmado') {
    proj.estado = 'en_desarrollo';
  }

  saveProyectos(list);
  res.json({ success: true, proyecto: proj });
});

// Actualizar hito de seguimiento
app.post('/api/proyectos/:id/hito', (req, res) => {
  const list = getProyectos();
  const proj = list.find(p => p.id === req.params.id);
  if (!proj) return res.status(404).json({ error: 'Proyecto no encontrado' });

  const { hitoId, completado } = req.body;
  const hito = proj.seguimiento?.hitos?.find(h => h.id === hitoId);
  if (!hito) return res.status(404).json({ error: 'Hito no encontrado' });

  hito.completado = completado;
  hito.fecha = completado 
    ? new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })
    : 'Pendiente';

  // Recalcular porcentaje de avance
  const hitos = proj.seguimiento.hitos;
  const completados = hitos.filter(h => h.completado).length;
  proj.seguimiento.porcentajeAvance = Math.round((completados / hitos.length) * 100);

  if (proj.seguimiento.porcentajeAvance >= 100) {
    proj.estado = 'entregado';
  } else if (proj.seguimiento.porcentajeAvance >= 25 && proj.estado !== 'en_desarrollo') {
    proj.estado = 'en_desarrollo';
  }

  saveProyectos(list);
  res.json({ success: true, proyecto: proj });
});

// Confirmar o actualizar estado de pago
app.post('/api/proyectos/:id/pago', (req, res) => {
  const list = getProyectos();
  const proj = list.find(p => p.id === req.params.id);
  if (!proj) return res.status(404).json({ error: 'Proyecto no encontrado' });

  const { tipoPago, estado, metodo, comprobanteUrl } = req.body; // tipoPago: 'anticipo' | 'saldo'

  if (tipoPago === 'anticipo') {
    proj.pagos.anticipoEstado = estado || 'confirmado';
    if (metodo) proj.pagos.anticipoMetodo = metodo;
    if (comprobanteUrl) proj.pagos.comprobanteUrl = comprobanteUrl;
    if (estado === 'confirmado') {
      proj.pagos.anticipoFecha = new Date().toISOString().split('T')[0];
      const hitoPago = proj.seguimiento?.hitos?.find(h => h.id === 'h-2');
      if (hitoPago) {
        hitoPago.completado = true;
        hitoPago.fecha = new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
      }
    }
  } else if (tipoPago === 'saldo') {
    proj.pagos.saldoEstado = estado || 'confirmado';
    if (estado === 'confirmado') {
      const hitoFinal = proj.seguimiento?.hitos?.find(h => h.id === 'h-7');
      if (hitoFinal) {
        hitoFinal.completado = true;
        hitoFinal.fecha = new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
      }
    }
  }

  saveProyectos(list);
  res.json({ success: true, proyecto: proj });
});

// ==========================================
// 12. MÓDULO 4: STORYBRAND & WIREFRAMES UX
// ==========================================

// Listar todos los wireframes
app.get('/api/wireframes', (req, res) => {
  const list = getWireframes();
  res.json(list);
});

// Obtener wireframe por ID de proyecto
app.get('/api/wireframes/proyecto/:proyectoId', (req, res) => {
  const wf = getWireframeByProyectoId(req.params.proyectoId);
  if (!wf) return res.status(404).json({ error: 'Wireframe no encontrado para este proyecto' });
  res.json(wf);
});

// Generar StoryBrand y Wireframe para un proyecto
app.post('/api/wireframes/generar/:proyectoId', (req, res) => {
  const proyectos = getProyectos();
  const proj = proyectos.find(p => p.id === req.params.proyectoId);
  if (!proj) return res.status(404).json({ error: 'Proyecto no encontrado' });

  const wf = generarStoryBrandAuto(proj);
  res.json({ success: true, wireframe: wf });
});

// Guardar o actualizar un wireframe
app.post('/api/wireframes', (req, res) => {
  const list = getWireframes();
  const data = req.body;
  if (!data.id) {
    data.id = 'wf-' + (data.proyectoId || Date.now());
  }
  data.fechaActualizacion = new Date().toISOString().split('T')[0];

  const idx = list.findIndex(w => w.id === data.id);
  if (idx !== -1) {
    list[idx] = data;
  } else {
    list.unshift(data);
  }

  saveWireframes(list);
  res.json({ success: true, wireframe: data });
});

// ==========================================
// 13. MÓDULO 5: SEO LOCAL, TRACKING & LAUNCH QA
// ==========================================

// Listar todas las auditorías SEO
app.get('/api/seo', (req, res) => {
  const list = getSeoAudits();
  res.json(list);
});

// Obtener auditoría SEO por ID de proyecto
app.get('/api/seo/proyecto/:proyectoId', (req, res) => {
  const seo = getSeoAuditByProyectoId(req.params.proyectoId);
  if (!seo) return res.status(404).json({ error: 'Auditoría SEO no encontrada para este proyecto' });
  res.json(seo);
});

// Generar Schema.org, Meta Tags y checklist para un proyecto
app.post('/api/seo/generar/:proyectoId', (req, res) => {
  const proyectos = getProyectos();
  const proj = proyectos.find(p => p.id === req.params.proyectoId);
  if (!proj) return res.status(404).json({ error: 'Proyecto no encontrado' });

  const seo = generarSeoAuto(proj);
  res.json({ success: true, seo });
});

// Guardar o actualizar auditoría SEO
app.post('/api/seo', (req, res) => {
  const list = getSeoAudits();
  const data = req.body;
  if (!data.id) {
    data.id = 'seo-' + (data.proyectoId || Date.now());
  }
  data.fechaAuditoria = new Date().toISOString().split('T')[0];

  const idx = list.findIndex(s => s.id === data.id);
  if (idx !== -1) {
    list[idx] = data;
  } else {
    list.unshift(data);
  }

  saveSeoAudits(list);
  res.json({ success: true, seo: data });
});

// Toggle checklist item
app.post('/api/seo/:proyectoId/checklist', (req, res) => {
  const list = getSeoAudits();
  const seo = list.find(s => s.proyectoId === req.params.proyectoId);
  if (!seo) return res.status(404).json({ error: 'Auditoría SEO no encontrada' });

  const { itemId, completado } = req.body;
  const item = seo.checklist?.find(c => c.id === itemId);
  if (!item) return res.status(404).json({ error: 'Item de checklist no encontrado' });

  item.completado = completado;

  // Recalcular score de salud (0 a 100%)
  const totalItems = seo.checklist.length;
  const completados = seo.checklist.filter(c => c.completado).length;
  seo.scoreSalud = Math.round((completados / totalItems) * 100);

  saveSeoAudits(list);
  res.json({ success: true, seo });
});

// Serve assets directly from public/assets and dist
app.use('/assets', express.static(path.join(__dirname, '../public/assets')));
app.use(express.static(distPath));

// Catch-all route for SPA (Express 5 syntax)
app.use((req, res) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ error: 'Endpoint no encontrado' });
  }
  const indexPath = path.join(distPath, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.send('Frontend build no encontrado. Ejecuta npm run build o npm run dev.');
  }
});

app.listen(PORT, () => {
  console.log(`🚀 [GOGLITE TOOLS API] Servidor activo en http://localhost:${PORT}`);
});
