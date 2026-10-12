import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

const BACKEND_URL = process.env.GOGLITE_BACKEND_URL || 'http://localhost:3001';

const server = new Server(
  {
    name: 'goglite-agency-mcp',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

/**
 * Definición de herramientas del Gerente de IA para operar la plataforma y WhatsApp
 */
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'get_pipeline_summary',
        description: 'Obtiene el resumen de todos los prospectos en el pipeline comercial de Goglite (etapas, valores cotizados, temperaturas).',
        inputSchema: {
          type: 'object',
          properties: {
            country: {
              type: 'string',
              description: 'Filtro por país: SV (El Salvador), DO (República Dominicana), o ALL',
              enum: ['SV', 'DO', 'ALL'],
              default: 'ALL',
            },
          },
        },
      },
      {
        name: 'get_lead_details',
        description: 'Obtiene el contexto completo de un lead específico (auditoría técnica, empresa, teléfono y notas del portal).',
        inputSchema: {
          type: 'object',
          properties: {
            leadId: {
              type: 'string',
              description: 'Identificador único del lead',
            },
          },
          required: ['leadId'],
        },
      },
      {
        name: 'propose_whatsapp_reply',
        description: 'Genera y registra una propuesta de respuesta comercial bajo metodología StoryBrand para revisión del supervisor humano (Human-in-the-Middle).',
        inputSchema: {
          type: 'object',
          properties: {
            leadId: {
              type: 'string',
              description: 'Identificador del prospecto en el CRM',
            },
            draftReply: {
              type: 'string',
              description: 'Texto propuesto para responder al cliente',
            },
            category: {
              type: 'string',
              description: 'Categoría de la respuesta: saludo, valor, objecion_precio, followup o cierre',
              enum: ['saludo', 'valor', 'objecion_precio', 'followup', 'cierre'],
            },
          },
          required: ['leadId', 'draftReply'],
        },
      },
      {
        name: 'update_lead_stage',
        description: 'Actualiza la etapa comercial de un prospecto en el pipeline Kanban tras una interacción.',
        inputSchema: {
          type: 'object',
          properties: {
            leadId: {
              type: 'string',
              description: 'Identificador del lead',
            },
            stage: {
              type: 'string',
              description: 'Nueva etapa en el pipeline',
              enum: ['nuevo', 'contactado', 'reunion', 'propuesta_enviada', 'negociacion', 'ganado', 'perdido'],
            },
          },
          required: ['leadId', 'stage'],
        },
      },
      {
        name: 'get_proposals_list',
        description: 'Obtiene el listado de presupuestos emitidos en la agencia con sus estados, montos de inversión y clientes.',
        inputSchema: {
          type: 'object',
          properties: {
            filterStatus: {
              type: 'string',
              description: 'Filtrar por estado: todos, borrador, enviado, visto, aceptado, rechazado',
              default: 'todos',
            },
          },
        },
      },
      {
        name: 'create_budget_proposal',
        description: 'Crea un borrador de propuesta comercial VIP (Módulo 3) para un cliente, calculando inversión total, anticipo 50/50 y módulos StoryBrand para revisión humana.',
        inputSchema: {
          type: 'object',
          properties: {
            clienteEmpresa: {
              type: 'string',
              description: 'Nombre de la empresa o negocio del cliente',
            },
            clienteContacto: {
              type: 'string',
              description: 'Nombre del tomador de decisión',
            },
            clienteTelefono: {
              type: 'string',
              description: 'Teléfono oficial de contacto',
            },
            precioTotal: {
              type: 'number',
              description: 'Monto de inversión final en USD (ej: 250, 650, 950)',
            },
            anticipo: {
              type: 'number',
              description: 'Monto de anticipo para inicio en USD (ej: 100, 350)',
            },
            contraEntrega: {
              type: 'number',
              description: 'Monto contra entrega final en USD (ej: 150, 300)',
            },
            tituloPropuesta: {
              type: 'string',
              description: 'Título descriptivo de la propuesta VIP',
              default: 'PROPUESTA DE DESARROLLO DIGITAL VIP',
            },
          },
          required: ['clienteEmpresa', 'precioTotal', 'anticipo', 'contraEntrega'],
        },
      },
    ],
  };
});

/**
 * Manejador de llamadas de herramientas
 */
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    if (name === 'get_pipeline_summary') {
      const res = await fetch(`${BACKEND_URL}/api/crm/leads`);
      const leads = await res.json();
      const filtered = args.country && args.country !== 'ALL'
        ? leads.filter((l) => l.pais === args.country)
        : leads;

      const summary = {
        totalLeads: filtered.length,
        valorTotalPipeline: filtered.reduce((acc, l) => acc + (Number(l.valorEstimado) || 0), 0),
        etapas: filtered.reduce((acc, l) => {
          acc[l.etapa] = (acc[l.etapa] || 0) + 1;
          return acc;
        }, {}),
        leads: filtered.map((l) => ({
          id: l.id,
          contacto: l.contacto,
          empresa: l.empresa,
          telefono: l.telefono,
          pais: l.pais,
          etapa: l.etapa,
          valor: l.valorEstimado,
        })),
      };

      return {
        content: [{ type: 'text', text: JSON.stringify(summary, null, 2) }],
      };
    }

    if (name === 'get_lead_details') {
      const res = await fetch(`${BACKEND_URL}/api/crm/leads`);
      const leads = await res.json();
      const lead = leads.find((l) => l.id === args.leadId || (l.telefono && l.telefono.includes(args.leadId)));

      if (!lead) {
        return {
          content: [{ type: 'text', text: `Lead no encontrado para el identificador: ${args.leadId}` }],
          isError: true,
        };
      }

      return {
        content: [{ type: 'text', text: JSON.stringify(lead, null, 2) }],
      };
    }

    if (name === 'propose_whatsapp_reply') {
      // Registrar la propuesta en el CRM bajo revisión
      const res = await fetch(`${BACKEND_URL}/api/crm/leads/${args.leadId}/whatsapp-message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          emisor: 'agencia',
          texto: `[BORRADOR IA PENDIENTE DE APROBACIÓN HUMANA]:\n${args.draftReply}`,
        }),
      });

      const updated = await res.json();
      return {
        content: [
          {
            type: 'text',
            text: `✅ Propuesta registrada en el CRM para el prospecto. Requiere que el supervisor humano haga clic en "Enviar" en WhatsApp Web oficial.\n\nBorrador:\n"${args.draftReply}"`,
          },
        ],
      };
    }

    if (name === 'update_lead_stage') {
      const res = await fetch(`${BACKEND_URL}/api/crm/leads/${args.leadId}/stage`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ etapa: args.stage }),
      });

      const updated = await res.json();
      return {
        content: [
          {
            type: 'text',
            text: `✅ Etapa del lead ${updated.contacto} actualizada a "${args.stage}".`,
          },
        ],
      };
    }

    if (name === 'get_proposals_list') {
      const res = await fetch(`${BACKEND_URL}/api/presupuestos`);
      const list = await res.json();
      const filtered = args.filterStatus && args.filterStatus !== 'todos'
        ? list.filter((p) => p.estado === args.filterStatus)
        : list;

      const summary = {
        totalPropuestas: filtered.length,
        propuestas: filtered.map((p) => ({
          id: p.id,
          codigo: p.codigo,
          titulo: p.titulo,
          cliente: p.cliente?.empresa || 'Sin empresa',
          contacto: p.cliente?.nombre || 'Sin contacto',
          telefono: p.cliente?.telefono || '',
          precioTotal: p.inversion?.precioTotal || 0,
          anticipo: p.inversion?.anticipo || 0,
          contraEntrega: p.inversion?.contraEntrega || 0,
          estado: p.estado,
          fecha: p.fecha,
        })),
      };

      return {
        content: [{ type: 'text', text: JSON.stringify(summary, null, 2) }],
      };
    }

    if (name === 'create_budget_proposal') {
      // Obtenemos la plantilla base oficial para poblar los 6 módulos
      const plantillasRes = await fetch(`${BACKEND_URL}/api/presupuestos/plantillas`);
      const plantillas = await plantillasRes.json();
      const base = plantillas[0]?.datos || {};

      const nuevaPropuesta = {
        ...base,
        titulo: args.tituloPropuesta || base.titulo || 'PROPUESTA DE DESARROLLO DIGITAL VIP',
        cliente: {
          nombre: args.clienteContacto || 'Tomador de Decisión',
          empresa: args.clienteEmpresa,
          telefono: args.clienteTelefono || '',
          email: `contacto@${args.clienteEmpresa.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`,
          actividad: 'Servicios Profesionales / Comercio',
          ubicacion: 'Cobertura Regional'
        },
        inversion: {
          ...(base.inversion || {}),
          precioTotal: Number(args.precioTotal),
          anticipo: Number(args.anticipo),
          contraEntrega: Number(args.contraEntrega),
          precioMercadoReferencial: Number(args.precioTotal) * 2.5,
          descuentoEspecial: Number(args.precioTotal) * 1.5
        },
        estado: 'borrador' // Siempre creado como borrador para aprobación humana
      };

      const createRes = await fetch(`${BACKEND_URL}/api/presupuestos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nuevaPropuesta)
      });
      const created = await createRes.json();

      return {
        content: [
          {
            type: 'text',
            text: `✅ [MÓDULO 3 VIP] Presupuesto ${created.codigo} creado exitosamente como BORRADOR para ${args.clienteEmpresa}.\n` +
                  `Monto Total: $${args.precioTotal} USD | Anticipo (50%): $${args.anticipo} USD | Contra Entrega: $${args.contraEntrega} USD.\n` +
                  `Requiere revisión y aprobación del supervisor humano en la plataforma antes del envío oficial.`
          }
        ]
      };
    }

    return {
      content: [{ type: 'text', text: `Herramienta desconocida: ${name}` }],
      isError: true,
    };
  } catch (err) {
    return {
      content: [{ type: 'text', text: `Error ejecutando ${name}: ${err.message}` }],
      isError: true,
    };
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Goglite Agency MCP Server iniciado en stdio');
}

main().catch((err) => {
  console.error('Fallo iniciando el servidor MCP:', err);
  process.exit(1);
});
