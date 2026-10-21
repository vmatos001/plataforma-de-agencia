import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROYECTOS_PATH = path.join(__dirname, '../data/proyectos.json');

export function getProyectos() {
  try {
    if (!fs.existsSync(PROYECTOS_PATH)) {
      fs.writeFileSync(PROYECTOS_PATH, '[]', 'utf8');
      return [];
    }
    const data = fs.readFileSync(PROYECTOS_PATH, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Error leyendo proyectos.json:', err);
    return [];
  }
}

export function saveProyectos(list) {
  try {
    fs.writeFileSync(PROYECTOS_PATH, JSON.stringify(list, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error('Error guardando proyectos.json:', err);
    return false;
  }
}

export function crearProyectoDesdePresupuesto(presupuesto) {
  const list = getProyectos();
  const nextNum = list.length + 1;
  const codigo = `CON-2026-${String(nextNum).padStart(3, '0')}`;

  const modulosTotal = presupuesto.modulos?.reduce((acc, m) => acc + (Number(m.precio) || 0), 0) || 0;
  const total = Number(presupuesto.inversion?.precioTotal) || modulosTotal || 0;
  const anticipo = Math.round(total * 0.5);
  const saldo = total - anticipo;

  const nuevoProyecto = {
    id: 'proj-' + Date.now(),
    codigo,
    presupuestoId: presupuesto.id,
    fechaCreacion: new Date().toISOString().split('T')[0],
    estado: 'contrato_pendiente',
    pais: presupuesto.pais || 'SV',
    cliente: {
      nombre: presupuesto.cliente?.nombre || 'Cliente',
      empresa: presupuesto.cliente?.empresa || 'Empresa',
      telefono: presupuesto.cliente?.telefono || '',
      email: presupuesto.cliente?.email || '',
      identificacion: '',
      actividad: presupuesto.cliente?.actividad || 'Servicios',
      ubicacion: presupuesto.cliente?.ubicacion || 'El Salvador'
    },
    contrato: {
      titulo: 'CONTRATO OFICIAL DE PRESTACIÓN DE SERVICIOS DIGITALES Y DESARROLLO WEB',
      fechaEmision: new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' }),
      plazoEjecucionDias: 15,
      totalInversion: total,
      anticipo,
      saldo,
      moneda: presupuesto.moneda || 'USD',
      alcanceResumen: presupuesto.portada?.proyecto || 'Desarrollo de plataforma digital de alta conversión.',
      clausulas: [
        {
          numero: 'PRIMERA',
          titulo: 'OBJETO Y ALCANCE DEL SERVICIO',
          texto: `GOGLITE se compromete a diseñar, desarrollar y desplegar la solución digital para EL CLIENTE (${presupuesto.cliente?.empresa || presupuesto.cliente?.nombre}), ejecutando los módulos acordados en la propuesta formal ${presupuesto.codigo}.`
        },
        {
          numero: 'SEGUNDA',
          titulo: 'PLAZOS DE EJECUCIÓN Y ENTREGAS',
          texto: 'El plazo de implementación pactado es de 10 a 15 días hábiles a partir de la firma de este contrato y de la recepción del anticipo y los activos esenciales del proyecto.'
        },
        {
          numero: 'TERCERA',
          titulo: 'HONORARIOS Y CONDICIONES DE PAGO',
          texto: `El valor total del proyecto es de $${total.toFixed(2)} USD. Se abonará un 50% ($${anticipo.toFixed(2)} USD) en concepto de anticipo para iniciar los trabajos y el 50% restante ($${saldo.toFixed(2)} USD) contra entrega final y despliegue.`
        },
        {
          numero: 'CUARTA',
          titulo: 'PROPIEDAD INTELECTUAL Y CÓDIGO FUENTE',
          texto: 'Una vez completado el pago del 100%, EL CLIENTE será propietario absoluto del código fuente, diseños y activos desarrollados, sin contratos forzosos ni comisiones mensuales.'
        },
        {
          numero: 'QUINTA',
          titulo: 'CONFIDENCIALIDAD',
          texto: 'Las partes acuerdan mantener estricta reserva de toda la información confidencial, accesos de servidores y datos de negocio intercambiados.'
        },
        {
          numero: 'SEXTA',
          titulo: 'GARANTÍA Y SOPORTE POST-LANZAMIENTO',
          texto: 'GOGLITE otorga 30 días calendario de garantía post-lanzamiento para corregir fallos, dudas o ajustes técnicos sin costo alguno.'
        }
      ],
      firmaCliente: {
        firmado: false,
        nombreFirmante: '',
        identificacion: '',
        timestampUtc: null,
        ipAddress: null,
        userAgent: null,
        firmaBase64: null
      },
      firmaAgencia: {
        firmado: true,
        nombreFirmante: 'Víctor Matos',
        cargo: 'Director General · Goglite Digital',
        timestampUtc: new Date().toISOString()
      }
    },
    onboarding: {
      completado: false,
      fecha: null,
      datos: {
        nombreComercial: presupuesto.cliente?.empresa || '',
        slogan: '',
        colorPrimario: '#FF6600',
        colorSecundario: '#0B0E16',
        colorAcento: '#22C55E',
        tipografia: 'Inter / Montserrat',
        telefonoEmergencia: presupuesto.cliente?.telefono || '',
        whatsappVentas: presupuesto.cliente?.telefono || '',
        enlaceDriveArchivos: '',
        proveedorDominio: '',
        observaciones: ''
      }
    },
    pagos: {
      anticipoMonto: anticipo,
      anticipoEstado: 'pendiente',
      anticipoFecha: null,
      anticipoMetodo: '',
      comprobanteUrl: '',
      saldoMonto: saldo,
      saldoEstado: 'pendiente'
    },
    seguimiento: {
      faseActual: 1,
      porcentajeAvance: 10,
      hitos: [
        {
          id: 'h-1',
          titulo: 'Firma del Contrato Legal & Aprobación de Términos',
          fase: 1,
          completado: false,
          fecha: 'Pendiente'
        },
        {
          id: 'h-2',
          titulo: 'Confirmación de Anticipo del 50%',
          fase: 1,
          completado: false,
          fecha: 'Pendiente'
        },
        {
          id: 'h-3',
          titulo: 'Recepción de Activos & Cuestionario de Onboarding',
          fase: 1,
          completado: false,
          fecha: 'Pendiente'
        },
        {
          id: 'h-4',
          titulo: 'Wireframes UX & Estructura de Mensajes StoryBrand',
          fase: 2,
          completado: false,
          fecha: 'Pendiente'
        },
        {
          id: 'h-5',
          titulo: 'Construcción Nativa Frontend React & Velocidad CWV',
          fase: 2,
          completado: false,
          fecha: 'Pendiente'
        },
        {
          id: 'h-6',
          titulo: 'SEO Local (Schema.org), Google Maps & Auditoría Final',
          fase: 3,
          completado: false,
          fecha: 'Pendiente'
        },
        {
          id: 'h-7',
          titulo: 'Lanzamiento Oficial en Vivo, Entrega de Accesos & Saldo',
          fase: 3,
          completado: false,
          fecha: 'Pendiente'
        }
      ],
      entregables: {
        demoUrl: '',
        driveEntregables: '',
        repositorioUrl: ''
      }
    }
  };

  list.unshift(nuevoProyecto);
  saveProyectos(list);
  return nuevoProyecto;
}
