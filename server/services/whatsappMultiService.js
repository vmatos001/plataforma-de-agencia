import makeWASocket, { 
  useMultiFileAuthState, 
  DisconnectReason 
} from '@whiskeysockets/baileys';
import QRCode from 'qrcode';
import pino from 'pino';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { getCrmLeads, saveCrmLeads, addWhatsAppMessage } from './crmStorage.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SESSIONS_BASE_DIR = process.env.VERCEL
  ? path.join('/tmp', 'sessions')
  : path.join(__dirname, '../sessions');

// Ensure base sessions directory exists
try {
  if (!fs.existsSync(SESSIONS_BASE_DIR)) {
    fs.mkdirSync(SESSIONS_BASE_DIR, { recursive: true });
  }
} catch (e) {
  console.warn('[WhatsApp] Could not create sessions directory:', e.message);
}

// Logger silencioso para no ensuciar la consola de dev
const logger = pino({ level: 'silent' });

// Almacén en memoria de sockets y estados por país
const sessions = {
  SV: {
    country: 'SV',
    label: 'El Salvador (🇸🇻)',
    prefix: '+503',
    status: 'disconnected', // 'disconnected' | 'connecting' | 'qr_ready' | 'connected'
    qrCode: null,
    phoneNumber: null,
    socket: null,
    retryCount: 0
  },
  DO: {
    country: 'DO',
    label: 'Rep. Dominicana (🇩🇴)',
    prefix: '+1',
    status: 'disconnected',
    qrCode: null,
    phoneNumber: null,
    socket: null,
    retryCount: 0
  }
};

/**
 * Obtener estado actual de todas las sesiones o de una específica
 */
export function getSessionsStatus(countryCode = null) {
  if (countryCode) {
    const key = countryCode.toUpperCase();
    const s = sessions[key];
    if (!s) return null;
    return {
      country: s.country,
      label: s.label,
      prefix: s.prefix,
      status: s.status,
      qrCode: s.qrCode,
      phoneNumber: s.phoneNumber
    };
  }

  return {
    SV: {
      country: sessions.SV.country,
      label: sessions.SV.label,
      prefix: sessions.SV.prefix,
      status: sessions.SV.status,
      qrCode: sessions.SV.qrCode,
      phoneNumber: sessions.SV.phoneNumber
    },
    DO: {
      country: sessions.DO.country,
      label: sessions.DO.label,
      prefix: sessions.DO.prefix,
      status: sessions.DO.status,
      qrCode: sessions.DO.qrCode,
      phoneNumber: sessions.DO.phoneNumber
    }
  };
}

/**
 * Iniciar o solicitar QR para una sesión (SV o DO)
 */
export async function startWhatsAppSession(countryCode) {
  const key = countryCode.toUpperCase();
  const session = sessions[key];
  if (!session) throw new Error(`País no soportado: ${countryCode}`);

  if (session.status === 'connected' && session.socket) {
    return { status: 'connected', phoneNumber: session.phoneNumber };
  }

  // Si había un socket previo no conectado, cerrarlo limpiamente
  if (session.socket) {
    try {
      session.socket.ev.removeAllListeners();
      session.socket.end(undefined);
    } catch (e) {}
    session.socket = null;
  }

  const sessionDir = path.join(SESSIONS_BASE_DIR, `whatsapp_${key.toLowerCase()}`);
  try {
    if (!fs.existsSync(sessionDir)) {
      fs.mkdirSync(sessionDir, { recursive: true });
    }
  } catch (e) {
    console.warn(`[WhatsApp] Could not create sessionDir for ${key}:`, e.message);
  }

  session.status = 'connecting';
  session.qrCode = null;
  session.retryCount = 0;

  return new Promise(async (resolve, reject) => {
    let hasResolved = false;
    const timeoutTimer = setTimeout(() => {
      if (!hasResolved) {
        hasResolved = true;
        resolve({
          status: session.status,
          qrCode: session.qrCode,
          phoneNumber: session.phoneNumber
        });
      }
    }, 4500);

    const safeResolve = () => {
      if (!hasResolved) {
        hasResolved = true;
        clearTimeout(timeoutTimer);
        resolve({
          status: session.status,
          qrCode: session.qrCode,
          phoneNumber: session.phoneNumber
        });
      }
    };

    try {
      const { state, saveCreds } = await useMultiFileAuthState(sessionDir);

      const sock = makeWASocket({
        auth: state,
        logger,
        printQRInTerminal: false,
        browser: ['Goglite Agency CRM', 'Chrome', '1.0.0'],
        syncFullHistory: false
      });

      session.socket = sock;

      // Manejador de credenciales
      sock.ev.on('creds.update', saveCreds);

      // Manejador de estado de conexión
      sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
          try {
            const qrDataUrl = await QRCode.toDataURL(qr, {
              margin: 2,
              width: 340,
              color: { dark: '#0a0f1d', light: '#ffffff' }
            });
            session.qrCode = qrDataUrl;
            session.status = 'qr_ready';
            console.log(`[WhatsApp ${key}] Código QR listo para escanear`);
            safeResolve();
          } catch (qrErr) {
            console.error(`[WhatsApp ${key}] Error generando QR DataURL:`, qrErr);
          }
        }

        if (connection === 'open') {
          session.status = 'connected';
          session.qrCode = null;
          session.retryCount = 0;
          const jid = sock.user?.id || '';
          const phone = jid.split(':')[0] || jid.split('@')[0];
          session.phoneNumber = phone;
          console.log(`[WhatsApp ${key}] Conectado exitosamente con teléfono: +${phone}`);
          safeResolve();
        }

        if (connection === 'close') {
          const statusCode = lastDisconnect?.error?.output?.statusCode;
          const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
          console.warn(`[WhatsApp ${key}] Conexión cerrada. Código: ${statusCode}. Reconectar: ${shouldReconnect}`);

          session.status = 'disconnected';
          session.socket = null;

          if (statusCode === DisconnectReason.loggedOut) {
            // El usuario cerró sesión en su teléfono; limpiamos la carpeta
            session.phoneNumber = null;
            session.qrCode = null;
            try {
              fs.rmSync(sessionDir, { recursive: true, force: true });
            } catch (e) {}
          } else if (shouldReconnect && session.retryCount < 8) {
            session.retryCount++;
            setTimeout(() => {
              console.log(`[WhatsApp ${key}] Reintentando conexión (${session.retryCount}/8)...`);
              startWhatsAppSession(key).catch(() => {});
            }, 3000);
          }
        }
      });

    // Manejador de mensajes entrantes reales
    sock.ev.on('messages.upsert', async ({ messages, type }) => {
      if (type !== 'notify' || !messages || messages.length === 0) return;

      for (const msg of messages) {
        // Ignorar mensajes enviados por nosotros mismos para evitar bucles
        if (msg.key.fromMe) continue;

        const remoteJid = msg.key.remoteJid || '';
        if (!remoteJid.endsWith('@s.whatsapp.net')) continue; // Solo chats privados

        const rawPhone = remoteJid.replace('@s.whatsapp.net', '');
        const text = msg.message?.conversation ||
          msg.message?.extendedTextMessage?.text ||
          msg.message?.imageMessage?.caption ||
          '[Contenido multimedia recibido]';

        console.log(`[WhatsApp ${key}] Mensaje recibido de +${rawPhone}: "${text.slice(0, 40)}..."`);

        // Buscar lead asociado por teléfono o crearlo automáticamente
        try {
          const leads = getCrmLeads();
          const cleanIncoming = rawPhone.replace(/[^0-9]/g, '');
          const matchingLead = leads.find(l => {
            if (!l.telefono) return false;
            const cleanLeadPhone = l.telefono.replace(/[^0-9]/g, '');
            return cleanIncoming.endsWith(cleanLeadPhone) || cleanLeadPhone.endsWith(cleanIncoming);
          });

          if (matchingLead) {
            addWhatsAppMessage(matchingLead.id, {
              emisor: 'cliente',
              texto: text,
              origen: `whatsapp_real_${key}`
            });
            console.log(`[WhatsApp ${key}] Mensaje sincronizado al lead existente: ${matchingLead.contacto} (${matchingLead.empresa})`);
          } else {
            // Auto-crear el lead en el CRM para que aparezca de inmediato en la lista
            const pushName = msg.pushName || `Cliente WhatsApp +${rawPhone}`;
            const newLead = {
              id: 'lead-wa-' + cleanIncoming + '-' + Date.now(),
              empresa: `Contacto WhatsApp (+${rawPhone})`,
              contacto: pushName,
              telefono: `+${rawPhone}`,
              pais: key,
              etapa: 'nuevo',
              valorEstimado: 0,
              createdAt: new Date().toISOString(),
              whatsappData: {
                telefono: `+${rawPhone}`,
                temperatura: 'caliente',
                estadoSeguimiento: 'primer_contacto',
                ultimoMensajeFecha: 'Hoy',
                mensajes: [{
                  id: 'msg-' + Date.now(),
                  emisor: 'cliente',
                  texto: text,
                  fechaHora: 'Hoy',
                  leido: false,
                  origen: `whatsapp_real_${key}`
                }]
              }
            };
            const updatedLeads = [newLead, ...leads];
            saveCrmLeads(updatedLeads);
            console.log(`[WhatsApp ${key}] Nuevo lead creado automáticamente para +${rawPhone}: "${pushName}"`);
          }
        } catch (dbErr) {
          console.warn(`[WhatsApp ${key}] Error guardando mensaje entrante en CRM:`, dbErr.message);
        }
      }
    });

    // Manejador de sincronización de historial de chats de WhatsApp
    sock.ev.on('messaging-history.set', async ({ chats }) => {
      console.log(`[WhatsApp ${key}] Historial recibido de WhatsApp: ${chats?.length || 0} chats.`);
      if (!chats || chats.length === 0) return;
      try {
        const leads = getCrmLeads();
        let added = false;
        for (const chat of chats.slice(0, 30)) {
          const jid = chat.id || '';
          if (!jid.endsWith('@s.whatsapp.net')) continue;
          const phone = jid.replace('@s.whatsapp.net', '');
          const clean = phone.replace(/[^0-9]/g, '');
          const exists = leads.some(l => (l.telefono || '').replace(/[^0-9]/g, '').endsWith(clean));
          if (!exists) {
            leads.unshift({
              id: 'lead-wa-' + clean + '-' + Date.now(),
              empresa: `WhatsApp (+${phone})`,
              contacto: chat.name || `Contacto +${phone}`,
              telefono: `+${phone}`,
              pais: key,
              etapa: 'nuevo',
              valorEstimado: 0,
              createdAt: new Date().toISOString(),
              whatsappData: {
                telefono: `+${phone}`,
                temperatura: 'tibio',
                estadoSeguimiento: 'esperando_respuesta',
                ultimoMensajeFecha: 'Reciente',
                mensajes: []
              }
            });
            added = true;
          }
        }
        if (added) {
          saveCrmLeads(leads);
          console.log(`[WhatsApp ${key}] Chats sincronizados automáticamente al CRM.`);
        }
      } catch (err) {
        console.warn(`[WhatsApp ${key}] Error procesando historial:`, err.message);
      }
    });

    } catch (err) {
      session.status = 'disconnected';
      session.socket = null;
      console.error(`[WhatsApp ${key}] Error iniciando sesión:`, err);
      safeResolve();
    }
  });
}

/**
 * Enviar mensaje real a través de la línea indicada (SV o DO)
 */
export async function sendRealWhatsAppMessage(countryCode, targetPhone, text) {
  const key = (countryCode || 'SV').toUpperCase();
  const session = sessions[key];

  if (!session || session.status !== 'connected' || !session.socket) {
    throw new Error(`La línea de WhatsApp para ${session?.label || countryCode} no está conectada. Escanea el código QR primero.`);
  }

  // Normalizar número telefónico
  let cleanNumber = targetPhone.replace(/[^0-9]/g, '');
  if (!cleanNumber) throw new Error('Número telefónico no válido');

  // Si no tiene código de país, anteponer según la línea
  if (key === 'SV' && cleanNumber.length === 8) {
    cleanNumber = '503' + cleanNumber;
  } else if (key === 'DO' && (cleanNumber.length === 10 && (cleanNumber.startsWith('809') || cleanNumber.startsWith('829') || cleanNumber.startsWith('849')))) {
    cleanNumber = '1' + cleanNumber;
  }

  const jid = `${cleanNumber}@s.whatsapp.net`;

  try {
    const result = await session.socket.sendMessage(jid, { text });
    return {
      success: true,
      messageId: result.key?.id,
      to: cleanNumber,
      country: key
    };
  } catch (err) {
    console.error(`[WhatsApp ${key}] Error enviando mensaje a ${cleanNumber}:`, err);
    throw err;
  }
}

/**
 * Desconectar sesión manualmente
 */
export async function disconnectWhatsAppSession(countryCode) {
  const key = countryCode.toUpperCase();
  const session = sessions[key];
  if (!session) return { success: false };

  try {
    if (session.socket) {
      await session.socket.logout();
    }
  } catch (e) {}

  const sessionDir = path.join(SESSIONS_BASE_DIR, `whatsapp_${key.toLowerCase()}`);
  try {
    fs.rmSync(sessionDir, { recursive: true, force: true });
  } catch (e) {}

  session.status = 'disconnected';
  session.socket = null;
  session.qrCode = null;
  session.phoneNumber = null;
  session.retryCount = 0;

  return { success: true, country: key };
}
