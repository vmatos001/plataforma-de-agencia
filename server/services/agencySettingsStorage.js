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
    fs.writeFileSync(SETTINGS_PATH, JSON.stringify(updated, null, 2), 'utf8');
    return updated;
  } catch (err) {
    console.error('Error guardando agency_settings.json:', err);
    return null;
  }
}
