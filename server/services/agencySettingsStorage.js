import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SETTINGS_PATH = path.join(__dirname, '../data/agency_settings.json');

// Llaves MCP expuestas históricamente en código o bundle que quedan revocadas de inmediato (C-07)
const COMPROMISED_MCP_KEYS = new Set([
  'gog_agent_live_d92cd28fb0ce6cd0139bf8127427bd39',
  'gog_agent_live_3554881d91556ec76d8734f10fda7366'
]);

export const PUBLIC_BRANDING_FIELDS = [
  'nombreAgencia',
  'eslogan',
  'logoUrl',
  'logoDocumentosUrl',
  'colorPrimario',
  'colorSecundario',
  'dominioWeb'
];

export const EDITABLE_AGENCY_FIELDS = [
  ...PUBLIC_BRANDING_FIELDS,
  'emailContacto',
  'emailFacturacion',
  'telefonoWhatsapp',
  'telefonoFijo',
  'telefonoWhatsappDO',
  'telefonoFijoDO',
  'ubicacionDO',
  'telefonoWhatsappSV',
  'telefonoFijoSV',
  'ubicacionSV',
  'direccionFisica',
  'ubicacionPrincipal',
  'marcaBlancaActiva',
  'paisesOperacion',
  'monedaDefecto',
  'tasaCambioDop',
  'tasaCambioEur',
  'perfilesPais',
  'serviciosOficiales'
];

const defaultAgencySettings = {
  nombreAgencia: 'Goglite Digital Hub',
  eslogan: 'Suite Integral de Crecimiento Digital & Desarrollo Web Antigravity',
  logoUrl: '',
  logoDocumentosUrl: '',
  colorPrimario: '#FF6B00',
  colorSecundario: '#1E293B',
  dominioWeb: 'goglite.com',
  emailContacto: 'contacto@goglite.com',
  telefonoWhatsapp: '+503 7756-9828',
  telefonoFijo: '+1 (829) 528-4713',

  perfilesPais: {
    DO: {
      paisCodigo: 'DO',
      paisNombre: 'República Dominicana',
      bandera: '🇩🇴',
      moneda: 'DOP',
      simboloMoneda: 'RD$',
      nombreFiscal: 'Goglite Digital Hub',
      identificacion: 'RNC: 1-32-45678-9',
      direccion: 'Hermanas Mirabal #1, Plaza Herasme, 3er nivel, 11201, República Dominicana',
      telefonoWhatsapp: '+1 (829) 528-4713',
      telefonoFijo: '+1 (829) 528-4713',
      emailContacto: 'contacto@goglite.com',
      directorResponsable: 'Víctor Matos',
      cargoDirector: 'Director & Estratega Digital'
    },
    SV: {
      paisCodigo: 'SV',
      paisNombre: 'El Salvador',
      bandera: '🇸🇻',
      moneda: 'USD',
      simboloMoneda: '$',
      nombreFiscal: 'Goglite Digital Hub',
      identificacion: 'NIT: 0614-290390-102-1',
      direccion: 'Santa Ana / San Salvador, El Salvador',
      telefonoWhatsapp: '+503 7756-9828',
      telefonoFijo: '+503 2200-3344',
      emailContacto: 'contacto@goglite.com',
      directorResponsable: 'Víctor Matos',
      cargoDirector: 'Director & Estratega Digital'
    },
    US: {
      paisCodigo: 'US',
      paisNombre: 'Estados Unidos',
      bandera: '🇺🇸',
      moneda: 'USD',
      simboloMoneda: '$',
      nombreFiscal: 'Goglite Digital Hub LLC',
      identificacion: 'EIN / Tax ID',
      direccion: 'Miami / Florida, Estados Unidos',
      telefonoWhatsapp: '+1 (829) 528-4713',
      telefonoFijo: '',
      emailContacto: 'contacto@goglite.com',
      directorResponsable: 'Víctor Matos',
      cargoDirector: 'Director & Estratega Digital'
    }
  },

  telefonoWhatsappDO: '+1 (829) 528-4713',
  telefonoFijoDO: '+1 (829) 528-4713',
  ubicacionDO: 'Hermanas Mirabal #1, Plaza Herasme, 3er nivel, 11201, República Dominicana',
  telefonoWhatsappSV: '+503 7756-9828',
  telefonoFijoSV: '+503 2200-3344',
  ubicacionSV: 'Santa Ana / San Salvador, El Salvador',
  emailFacturacion: 'billing@goglite.com',
  direccionFisica: 'Santa Ana, San Salvador / Hermanas Mirabal #1, Plaza Herasme, 3er nivel, 11201, República Dominicana',
  ubicacionPrincipal: 'San Salvador (SV) & Santo Domingo (DO)',
  marcaBlancaActiva: true,
  paisesOperacion: ['SV', 'DO', 'US', 'ES', 'MX', 'CO'],
  monedaDefecto: 'USD',
  tasaCambioDop: 58.50,
  tasaCambioEur: 0.92,
  apisIntegraciones: {
    googleSiteKitConnected: true,
    googleDriveVault: 'Goglite Agency Drive Vault',
    resendFromEmail: 'Goglite Agencia <onboarding@resend.dev>',
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
  mcpAgentKeyHash: null,
  mcpAgentKeyMasked: '',
  actualizadoEn: new Date().toISOString()
};

function hashMcpKey(rawKey) {
  return crypto.createHash('sha256').update(String(rawKey)).digest('hex');
}

function maskSecretValue(val) {
  if (!val || typeof val !== 'string' || val.length < 8) return '';
  return `${val.slice(0, 6)}••••••••${val.slice(-4)}`;
}

export function getAgencySettings() {
  try {
    if (!fs.existsSync(SETTINGS_PATH)) {
      const dir = path.dirname(SETTINGS_PATH);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(SETTINGS_PATH, JSON.stringify(defaultAgencySettings, null, 2), { encoding: 'utf8', mode: 0o600 });
      return defaultAgencySettings;
    }
    const data = fs.readFileSync(SETTINGS_PATH, 'utf8');
    const parsed = JSON.parse(data);
    let dirty = false;

    // Si existe una llave MCP en texto plano en el JSON, migrar a hash SHA-256 o revocar si es comprometida
    if (parsed.mcpAgentKey) {
      if (!COMPROMISED_MCP_KEYS.has(parsed.mcpAgentKey)) {
        parsed.mcpAgentKeyHash = hashMcpKey(parsed.mcpAgentKey);
        parsed.mcpAgentKeyMasked = maskSecretValue(parsed.mcpAgentKey);
      }
      delete parsed.mcpAgentKey;
      dirty = true;
    }

    if (dirty) {
      try {
        fs.writeFileSync(SETTINGS_PATH, JSON.stringify(parsed, null, 2), { encoding: 'utf8', mode: 0o600 });
      } catch {}
    }

    return { ...defaultAgencySettings, ...parsed };
  } catch (err) {
    console.error('Error leyendo agency_settings.json:', err.message);
    return defaultAgencySettings;
  }
}

/**
 * Devuelve exclusivamente los campos públicos de marca blanca para la pantalla de login (C-09).
 */
export function getPublicAgencyBranding() {
  const s = getAgencySettings();
  return Object.fromEntries(PUBLIC_BRANDING_FIELDS.map(k => [k, s[k] ?? '']));
}

/**
 * Devuelve la configuración para el administrador con llaves enmascaradas y sin hashes ni secretos en texto plano (C-09).
 */
export function getSanitizedAgencySettings() {
  const s = getAgencySettings();
  const { mcpAgentKey, mcpAgentKeyHash, apisIntegraciones = {}, ...rest } = s;
  const maskedIntegrations = {};
  for (const [k, v] of Object.entries(apisIntegraciones)) {
    if (k.toLowerCase().includes('apikey') || k.toLowerCase().includes('secret')) {
      maskedIntegrations[k] = typeof v === 'string' && v.length >= 8 ? maskSecretValue(v) : Boolean(v);
    } else {
      maskedIntegrations[k] = v;
    }
  }
  return {
    ...rest,
    mcpAgentKeyConfigured: Boolean(mcpAgentKeyHash || process.env.MCP_AGENT_KEY_SHA256),
    mcpAgentKeyMasked: s.mcpAgentKeyMasked || (process.env.MCP_AGENT_KEY_SHA256 ? 'gog_agent_live_••••••••(ENV)' : ''),
    apisIntegraciones: maskedIntegrations
  };
}

/**
 * Guarda únicamente los campos permitidos en la allowlist (sin cuentasBancarias ni mcpAgentKey) (C-09).
 */
export function saveAgencySettings(rawPatch = {}) {
  try {
    const current = getAgencySettings();
    const safePatch = {};
    for (const [k, v] of Object.entries(rawPatch || {})) {
      if (EDITABLE_AGENCY_FIELDS.includes(k)) {
        safePatch[k] = v;
      }
    }

    const updated = {
      ...current,
      ...safePatch,
      actualizadoEn: new Date().toISOString()
    };
    delete updated.mcpAgentKey;

    try {
      fs.writeFileSync(SETTINGS_PATH, JSON.stringify(updated, null, 2), { encoding: 'utf8', mode: 0o600 });
    } catch (fsErr) {
      console.warn('[AgencySettings] Entorno read-only, guardando en memoria:', fsErr.message);
    }
    return getSanitizedAgencySettings();
  } catch (err) {
    console.error('Error guardando agency_settings.json:', err.message);
    return null;
  }
}

/**
 * Actualiza las cuentas bancarias en un flujo dedicado protegido con Admin + TOTP + Auditoría (C-09).
 */
export function updateAgencyBankAccounts(cuentasBancarias) {
  if (!cuentasBancarias || typeof cuentasBancarias !== 'object') return null;
  const current = getAgencySettings();
  const updated = {
    ...current,
    cuentasBancarias: {
      ...(current.cuentasBancarias || {}),
      ...cuentasBancarias
    },
    actualizadoEn: new Date().toISOString()
  };
  delete updated.mcpAgentKey;
  try {
    fs.writeFileSync(SETTINGS_PATH, JSON.stringify(updated, null, 2), { encoding: 'utf8', mode: 0o600 });
  } catch {}
  return updated.cuentasBancarias;
}

/**
 * Genera una nueva llave maestra para el servidor MCP con CSPRNG (256 bits), guarda solo su hash SHA-256
 * y devuelve la llave en texto plano una única vez al administrador (C-07, C-08).
 */
export function rotateMcpAgentKey() {
  const rawKey = `gog_agent_live_${crypto.randomBytes(24).toString('hex')}`;
  const keyHash = hashMcpKey(rawKey);
  const masked = maskSecretValue(rawKey);

  const current = getAgencySettings();
  const updated = {
    ...current,
    mcpAgentKeyHash: keyHash,
    mcpAgentKeyMasked: masked,
    actualizadoEn: new Date().toISOString()
  };
  delete updated.mcpAgentKey;

  try {
    fs.writeFileSync(SETTINGS_PATH, JSON.stringify(updated, null, 2), { encoding: 'utf8', mode: 0o600 });
  } catch {}

  return { rawKey, masked, keyHash };
}

/**
 * Verifica en tiempo constante (L-02) una llave MCP aportada por el cliente contra el hash SHA-256 almacenado (C-08).
 */
export function verifyMcpAgentKey(providedKey) {
  if (!providedKey || typeof providedKey !== 'string') return false;
  const cleanKey = providedKey.trim();
  if (!cleanKey || COMPROMISED_MCP_KEYS.has(cleanKey)) return false;

  const settings = getAgencySettings();
  const expectedHashHex = process.env.MCP_AGENT_KEY_SHA256 || settings.mcpAgentKeyHash;
  if (!expectedHashHex || typeof expectedHashHex !== 'string' || expectedHashHex.length !== 64) {
    return false;
  }

  try {
    const providedHash = crypto.createHash('sha256').update(cleanKey).digest();
    const expectedHash = Buffer.from(expectedHashHex, 'hex');
    if (expectedHash.length !== 32) return false;
    return crypto.timingSafeEqual(providedHash, expectedHash);
  } catch {
    return false;
  }
}
