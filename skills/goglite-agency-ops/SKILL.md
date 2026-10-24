---
name: goglite-agency-ops
description: Protocolo de operaciones comerciales y técnicas para agentes de IA conectados a la plataforma Goglite Digital Hub mediante MCP. Permite prospección, gestión del pipeline CRM, registro de resúmenes y temperatura de WhatsApp, elaboración de propuestas, generación de PRD, auditorías de QA y publicación en el Headless CMS.
---

# Goglite Agency Operations Protocol (MCP & AI Agent Skill)

Esta skill define la guía operativa, herramientas y protocolos de seguridad para que cualquier agente de Inteligencia Artificial opere de manera autónoma o asistida dentro de la suite **Goglite Digital Hub** (`https://agencia.goglite.com`).

---

## 1. Arquitectura de Autenticación & Seguridad

Para interactuar con la plataforma, el agente **NUNCA** requiere credenciales de usuario ni códigos MFA de inicio de sesión web. La plataforma utiliza un modelo de autorización por **Bearer Token Institucional**:

1. **Obtención de la Llave**: El Administrador Maestro ingresa a la plataforma web con Google Auth y 2FA TOTP, se dirige a:
   `Ajustes de la Empresa (Engranaje) > Pestaña 5: APIs & Conexiones > Servidor MCP & Agente IA Autónomo`.
2. **Copiado de la Clave**: Hace clic en **Copiar Llave** (`GOGLITE_AGENT_KEY`).
3. **Inyección en el Agente**: Se configura la variable de entorno en el cliente MCP:
   ```bash
   GOGLITE_AGENT_KEY=gog_agent_live_3554881d91556ec76d8734f10fda7366
   ```
4. **Barrera de Seguridad (Boundary Enforcement)**:
   - ✅ **Permitido**: Prospección, CRM, Resúmenes de WhatsApp, Presupuestos SOW, PRD Técnico, QA Checklist, Headless CMS.
   - ⛔ **ESTRICTAMENTE BLOQUEADO**: Módulo 7 (Finanzas, P&L, cuentas bancarias maestras, balance neto de la agencia) y administración de contraseñas/2FA. El agente tiene denegado el acceso a estos dominios a nivel de protocolo.

---

## 2. Catálogo de Herramientas MCP Disponibles

El servidor MCP expone 17 herramientas especializadas agrupadas por fase operativa:

### Fase 1: Prospección & Enriquecimiento Comercial
- `search_leads`: Busca prospectos en la base de datos o directorio comercial filtrando por rubro, ubicación o país (`SV`, `DO`, `US`, `ES`, `MX`, `CO`).
- `enrich_lead`: Ejecuta diagnóstico digital preliminar (velocidad móvil, presencia SSL, Schema LocalBusiness) y genera el pitch de prospección.
- `get_lead_details`: Consulta la ficha completa de un prospecto incluyendo historial y enlaces al portal de auditoría.

### Fase 2: Pipeline CRM & WhatsApp Inteligente (Sin Conexión Directa)
> **Protocolo Clave**: La conexión con WhatsApp es gestionada de forma externa o por el agente. En esta plataforma, el agente **registra y sincroniza** el contexto estratégico:
- `get_pipeline_leads`: Obtiene los prospectos filtrados por etapa (`nuevo`, `contactado`, `reunion_agendada`, `propuesta_enviada`, `ganado`, `perdido`) o temperatura (`frio`, `tibio`, `caliente`).
- `update_lead_intelligence`: **Herramienta principal post-conversación**. Actualiza:
  - `temperatura`: `'frio'` | `'tibio'` | `'caliente'`
  - `resumenEjecutivo`: Síntesis de lo conversado, necesidades detectadas y objeciones del cliente.
  - `proximaAccion`: Siguiente paso acordado (ej. "Enviar propuesta SOW con anticipo de $600").
- `update_lead_stage`: Mueve al prospecto entre las columnas del embudo comercial Kanban.
- `add_lead_note`: Agrega una minuta o bitácora de interacción detallada.

### Fase 3: Propuestas Comerciales & Presupuestos SOW
- `get_service_catalog`: Consulta el catálogo oficial de servicios con precios base y tiempos estándar de entrega:
  - Landing Page StoryBrand Pro ($450 - $650 USD)
  - Plataforma Corporativa Headless ($850 - $1,400 USD)
  - E-Commerce Transaccional ($1,200 - $2,200 USD)
  - Mantenimiento & Optimización Mensual ($150 - $350/mes)
- `create_budget_proposal`: Genera un presupuesto formal con desglose de ítems, términos de anticipo (50%) y enlace público para el cliente.
- `get_budget_details`: Consulta el estado y detalle de un presupuesto existente.
- `update_budget_status`: Actualiza el estado (`borrador`, `enviado`, `aprobado`, `rechazado`).

### Fase 4: Arquitectura Técnica & PRD
- `generate_project_prd`: Genera y estructura el Documento de Requisitos de Producto (PRD) con alcance funcional, stack tecnológico Antigravity y arquitectura de datos.
- `get_project_prd`: Consulta el PRD de un proyecto para que el equipo técnico ejecute el desarrollo.

### Fase 5: Control de Calidad (QA Pre-Lanzamiento)
- `run_qa_audit`: Ejecuta la verificación de los 10 puntos críticos de calidad pre-lanzamiento (Mobile Responsive, Core Web Vitals, Metadatos OpenGraph, Formulario WhatsApp, Favicon, etc.).
- `update_qa_checklist`: Marca ítems individuales del checklist técnico como aprobados o pendientes.

### Fase 6: Headless CMS
- `list_cms_sites`: Lista los sitios web corporativos gestionados bajo el CMS.
- `publish_cms_article`: Publica o actualiza artículos de blog, landing pages y contenido estructurado directamente en el frontend del cliente.

### Información Institucional
- `get_agency_branding`: Obtiene nombre, eslogan, colores institucionales y canales de soporte de Goglite.

---

## 3. Flujo de Trabajo Recomendado para el Agente (Ejemplo Práctico)

1. **Recepción o Escucha de Contacto**:
   Un prospecto interactúa por WhatsApp externo solicitando cotización de desarrollo web.
2. **Consulta de Contexto**:
   El agente ejecuta `get_lead_details(leadId)` para conocer el estado y notas previas del cliente.
3. **Registro de Conversación & Temperatura**:
   El agente llama a `update_lead_intelligence`:
   ```json
   {
     "leadId": "lead_123",
     "temperatura": "caliente",
     "resumenEjecutivo": "Cliente interesado en rediseño web para su clínica dental. Requiere catálogo de servicios y agendamiento vía WhatsApp.",
     "proximaAccion": "Elaborar propuesta Landing Page Pro con 50% de anticipo."
   }
   ```
4. **Mover Etapa en el Pipeline**:
   El agente llama a `update_lead_stage(leadId, "propuesta_enviada")`.
5. **Generar Presupuesto**:
   El agente ejecuta `create_budget_proposal` con los ítems acordados y comparte el enlace del portal con el cliente.
