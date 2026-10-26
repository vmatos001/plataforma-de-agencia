import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SETTINGS_PATH = path.join(__dirname, '../data/agency_settings.json');

const defaultAgencySettings = {
  nombreAgencia: 'Goglite Digital Hub',
  eslogan: 'Suite Integral de Crecimiento Digital & Desarrollo Web Antigravity',
  logoUrl: '', // Si está vacío, se muestra el badge estilizado con las iniciales
  colorPrimario: '#FF6B00', // Naranja Goglite oficial
  colorSecundario: '#1E293B',
  dominioWeb: 'goglite.com',
  emailContacto: 'contacto@goglite.com',
  telefonoWhatsapp: '+503 7000-1122',
  telefonoFijo: '+503 2200-3344',
  emailFacturacion: 'billing@goglite.com',
  direccionFisica: 'Torre Millenium, Piso 9, San Salvador / Av. Winston Churchill, Piantini, Sto. Dgo.',
  ubicacionPrincipal: 'San Salvador (SV) & Santo Domingo (DO)',
  marcaBlancaActiva: true,
  paisesOperacion: ['SV', 'DO', 'US', 'ES', 'MX', 'CO'],
  monedaDefecto: 'USD',
  tasaCambioDop: 58.50,
  tasaCambioEur: 0.92,
  apisIntegraciones: {
    googleSiteKitConnected: true,
    googleDriveVault: 'Goglite Agency Drive Vault',
    resendApiKey: 're_live_goglite_free_tier',
    resendFromEmail: 'Goglite Agencia <onboarding@resend.dev>',
    serperApiKey: 'serper_api_active',
    geminiApiKey: 'AIzaSy_storybrand_active',
    whatsappGatewayStatus: 'Conectado (Baileys v6)'
  },
  cuentasBancarias: {
    elSalvador: {
      banco: 'Banco Agrícola',
      tipo: 'Cuenta Corriente',
      numero: '500-128941-01',
      titular: 'Goglite Studio S.A. de C.V.',
      chivoUglyCash: '$goglite.sv'
    },
    republicaDominicana: {
      banco: 'Banreservas / Banco Popular',
      tipo: 'Cuenta Corriente Corredores',
      numero: '960-441208-5',
      titular: 'Goglite Digital Dominicana SRL',
      rnc: '1-32-88901-4'
    },
    internacional: {
      metodo: 'Zelle / Stripe / Wire Transfer',
      destinatario: 'billing@goglite.com',
      swift: 'AGRISVSX'
    }
  },
  serviciosOficiales: [
    {
      id: 'web-antigravity-vip',
      nombre: 'Plataforma Web Antigravity VIP con StoryBrand',
      categoria: 'Desarrollo Web & StoryBrand',
      precioUSD: 650,
      precioDOP: 39000,
      tipoCobro: 'proyecto',
      anticipoPorcentaje: 50,
      descripcion: 'Plataforma web de ultra-alta conversión, arquitectura de carga <1s y copywriting StoryBrand.',
      entregables: [
        'Diseño UI/UX de alta conversión',
        'Velocidad de carga <1s y Core Web Vitals verdes',
        'Integración WhatsApp Direct & Lead Capture',
        'Copywriting StoryBrand (Guion de Marca)',
        'Panel CMS autogestionable'
      ]
    },
    {
      id: 'lead-machine-pro',
      nombre: 'Sistema de Aceleración y Captación de Leads B2B',
      categoria: 'Crecimiento Comercial & CRM',
      precioUSD: 950,
      precioDOP: 57000,
      tipoCobro: 'proyecto',
      anticipoPorcentaje: 50,
      descripcion: 'Sistema completo con sitio web de alto impacto, CRM multicanal y automatización.',
      entregables: [
        'Sitio Web Antigravity VIP',
        'Configuración CRM WhatsApp multi-línea',
        'Automatización de seguimiento y bitácora',
        'Portal Privado de Cliente 360°',
        'Integración Google Site Kit & Search Console'
      ]
    },
    {
      id: 'landing-express',
      nombre: 'Landing Page de Alta Conversión Express',
      categoria: 'Conversión Rápida',
      precioUSD: 250,
      precioDOP: 15000,
      tipoCobro: 'proyecto',
      anticipoPorcentaje: 50,
      descripcion: 'Página única optimizada para campañas publicitarias y tráfico de Google Ads o Meta.',
      entregables: [
        'Diseño 1 página de alto impacto visual',
        'Optimización móvil y botón WhatsApp Flotante',
        'Despliegue en dominio personalizado con SSL',
        'Formulario de cotización directa'
      ]
    },
    {
      id: 'mantenimiento-seo-soporte',
      nombre: 'Mantenimiento Web Continuo, SEO Local & Soporte',
      categoria: 'Mantenimiento & Retainer',
      precioUSD: 120,
      precioDOP: 7000,
      tipoCobro: 'mensual',
      anticipoPorcentaje: 100,
      descripcion: 'Suscripción mensual de mantenimiento, actualizaciones, hosting seguro y optimización SEO.',
      entregables: [
        'Alojamiento cloud de alta disponibilidad y certificado SSL',
        'Monitoreo continuo y copias de seguridad semanales',
        'Optimización mensual de SEO local y Google Business',
        'Soporte técnico prioritario y cambios menores de contenido'
      ]
    },
    {
      id: 'ecommerce-pro',
      nombre: 'Tienda Online / E-commerce de Alto Rendimiento',
      categoria: 'Comercio Electrónico',
      precioUSD: 1200,
      precioDOP: 72000,
      tipoCobro: 'proyecto',
      anticipoPorcentaje: 50,
      descripcion: 'Tienda virtual con pasarelas de pago, catálogo de productos y checkout optimizado.',
      entregables: [
        'Catálogo ilimitado y configuración de categorías',
        'Integración con pasarelas de pago (Stripe, Pagadito, Azul, PayPal)',
        'Notificaciones de pedidos por WhatsApp y Correo',
        'Panel administrativo de inventario y pedidos'
      ]
    }
  ],
  actualizadoEn: new Date().toISOString()
};

export function getAgencySettings() {
  try {
    if (!fs.existsSync(SETTINGS_PATH)) {
      fs.writeFileSync(SETTINGS_PATH, JSON.stringify(defaultAgencySettings, null, 2), 'utf8');
      return defaultAgencySettings;
    }
    const data = fs.readFileSync(SETTINGS_PATH, 'utf8');
    return { ...defaultAgencySettings, ...JSON.parse(data) };
  } catch (err) {
    console.error('Error leyendo agency_settings.json:', err);
    return defaultAgencySettings;
  }
}

export function saveAgencySettings(newSettings) {
  try {
    const current = getAgencySettings();
    const updated = {
      ...current,
      ...newSettings,
      actualizadoEn: new Date().toISOString()
    };
    try {
      fs.writeFileSync(SETTINGS_PATH, JSON.stringify(updated, null, 2), 'utf8');
    } catch (fsErr) {
      console.warn('[AgencySettings] Entorno read-only, guardando en memoria:', fsErr.message);
    }
    return updated;
  } catch (err) {
    console.error('Error guardando agency_settings.json:', err);
    return null;
  }
}
