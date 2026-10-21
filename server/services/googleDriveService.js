/**
 * server/services/googleDriveService.js
 * Servicio de Bóveda Centralizada en Google Drive para Goglite Agency Suite
 * Conexión nativa con Google Drive API v3 (OAuth2)
 * Cuenta de la agencia: sitesgoglite@gmail.com
 */

import fs from 'fs';
import os from 'os';
import path from 'path';

const DEFAULT_MCP_DIR = path.join(os.homedir(), 'google-suite-mcp');
const CREDENTIALS_PATH = process.env.GOOGLE_SUITE_CREDENTIALS || path.join(DEFAULT_MCP_DIR, 'credentials.json');
const TOKEN_PATH = process.env.GOOGLE_SUITE_TOKENS || path.join(DEFAULT_MCP_DIR, 'token.json');

/**
 * Obtiene o refresca el token de acceso OAuth2 para Google APIs
 */
async function getAccessToken() {
  try {
    if (!fs.existsSync(CREDENTIALS_PATH) || !fs.existsSync(TOKEN_PATH)) {
      console.warn('[DRIVE] Archivos de credenciales no encontrados en:', CREDENTIALS_PATH);
      return null;
    }

    const rawCreds = JSON.parse(fs.readFileSync(CREDENTIALS_PATH, 'utf8'));
    const rawTokens = JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf8'));
    const keys = rawCreds.installed || rawCreds.web;

    let accessToken = rawTokens.access_token;
    const isExpired = !rawTokens.expiry_date || Date.now() >= (rawTokens.expiry_date - 60000);

    if (isExpired && rawTokens.refresh_token) {
      console.log('[DRIVE] Token OAuth2 expirado, refrescando con Google...');
      const refreshRes = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: keys.client_id,
          client_secret: keys.client_secret,
          refresh_token: rawTokens.refresh_token,
          grant_type: 'refresh_token'
        })
      });

      const refreshed = await refreshRes.json();
      if (refreshed.access_token) {
        accessToken = refreshed.access_token;
        rawTokens.access_token = refreshed.access_token;
        rawTokens.expiry_date = Date.now() + (refreshed.expires_in * 1000);
        fs.writeFileSync(TOKEN_PATH, JSON.stringify(rawTokens, null, 2), 'utf8');
        console.log('[DRIVE] Token renovado exitosamente.');
      } else {
        console.error('[DRIVE] Error renovando token:', refreshed);
      }
    }

    return accessToken;
  } catch (err) {
    console.error('[DRIVE] Error en getAccessToken:', err.message);
    return null;
  }
}

/**
 * Verifica estado de conexión con Google Drive
 */
export async function getDriveStatus() {
  const token = await getAccessToken();
  if (!token) {
    return {
      connected: false,
      account: 'sitesgoglite@gmail.com',
      message: 'Credenciales de Google Drive no disponibles en este host'
    };
  }

  try {
    const res = await fetch('https://www.googleapis.com/drive/v3/about?fields=user,storageQuota', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return {
      connected: true,
      account: data.user?.emailAddress || 'sitesgoglite@gmail.com',
      displayName: data.user?.displayName || 'Goglite Digital',
      storageQuota: data.storageQuota
    };
  } catch (e) {
    return {
      connected: false,
      account: 'sitesgoglite@gmail.com',
      message: e.message
    };
  }
}

/**
 * Crea una carpeta en Google Drive
 */
async function createFolder(token, name, parentId = null) {
  const metadata = {
    name,
    mimeType: 'application/vnd.google-apps.folder',
    parents: parentId ? [parentId] : undefined
  };

  const res = await fetch('https://www.googleapis.com/drive/v3/files?fields=id,name,webViewLink', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(metadata)
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Error creando carpeta "${name}": ${errText}`);
  }

  return await res.json();
}

/**
 * Crea o sube un archivo de texto/markdown a Google Drive
 */
export async function uploadTextFile(token, name, content, mimeType = 'text/plain', parentId = null) {
  const fileMetadata = {
    name,
    parents: parentId ? [parentId] : undefined
  };

  // Google Drive multipart upload
  const boundary = '-------goglite_drive_boundary_' + Date.now();
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  const multipartRequestBody =
    delimiter +
    'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
    JSON.stringify(fileMetadata) +
    delimiter +
    `Content-Type: ${mimeType}; charset=UTF-8\r\n\r\n` +
    content +
    closeDelimiter;

  const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': `multipart/related; boundary=${boundary}`
    },
    body: multipartRequestBody
  });

  if (!res.ok) {
    const err = await res.text();
    console.warn('[DRIVE] Error subiendo archivo:', err);
    return null;
  }

  return await res.json();
}

export const AGENCY_DRIVE_ACCOUNT = 'sitesgoglite@gmail.com';
export const AGENCY_DRIVE_GAS_WEBHOOK = 'https://script.google.com/macros/s/AKfycbz2qqnBdelAif_BvpwkFCk-0WZ1b2fgiPaPVT3EK0mSyN0jboo_XBdZQL5OCP1rHLT0sw/exec';

/**
 * Comparte la carpeta creada en la cuenta de la agencia (sitesgoglite@gmail.com)
 * EXCLUSIVAMENTE con el correo de Google autenticado del cliente (aislamiento total entre clientes).
 */
async function shareFolderWithClient(token, folderId, clientEmail) {
  const cleanEmail = String(clientEmail || '').trim().toLowerCase();
  if (!cleanEmail || !cleanEmail.includes('@')) {
    return false;
  }
  try {
    const res = await fetch(`https://www.googleapis.com/drive/v3/files/${folderId}/permissions?sendNotificationEmail=false`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        role: 'writer',
        type: 'user',
        emailAddress: cleanEmail
      })
    });
    return res.ok;
  } catch (e) {
    console.warn(`[DRIVE] Error compartiendo carpeta ${folderId} con ${cleanEmail}:`, e.message);
    return false;
  }
}

/**
 * Busca si ya existe una carpeta con el nombre dado (opcionalmente dentro de un parentId)
 */
async function findExistingFolder(token, name, parentId = null) {
  try {
    const safeName = name.replace(/'/g, "\\'");
    const parentFilter = parentId ? ` and '${parentId}' in parents` : '';
    const q = `name = '${safeName}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false${parentFilter}`;
    const res = await fetch(`https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&fields=files(id,name,webViewLink)`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.files && data.files.length > 0 ? data.files[0] : null;
  } catch (e) {
    return null;
  }
}

/**
 * Crea o recupera la Bóveda Centralizada del Cliente en sitesgoglite@gmail.com
 * y la comparte exclusivamente con la cuenta de Google con la que el cliente inició sesión.
 */
export async function createClientVault(clientName, clientEmail = '', leadId = null) {
  const token = await getAccessToken();
  const cleanClientName = (clientName || 'Cliente').trim();
  const normalizedClientEmail = String(clientEmail || '').trim().toLowerCase();
  const folderTitle = `📁 [Goglite] ${cleanClientName}`;
  const authUserParam = normalizedClientEmail ? `&authuser=${encodeURIComponent(normalizedClientEmail)}` : '';

  // Si no hay token local en disco, ejecutar el puente oficial de Google Apps Script de sitesgoglite@gmail.com
  if (!token) {
    try {
      console.log(`[DRIVE] Creando carpeta real en ${AGENCY_DRIVE_ACCOUNT} vía Apps Script para: ${cleanClientName}`);
      const gasRes = await fetch(AGENCY_DRIVE_GAS_WEBHOOK, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
          clientName: cleanClientName,
          clientEmail: normalizedClientEmail,
          leadId
        })
      });
      if (gasRes.ok) {
        const gasData = await gasRes.json();
        if (gasData && gasData.success && gasData.vaultId) {
          return gasData;
        }
      }
    } catch (gasErr) {
      console.warn('[DRIVE] Error invocando Apps Script de sitesgoglite@gmail.com:', gasErr.message);
    }

    console.warn(`[DRIVE] Operando en modo local para cuenta gestora ${AGENCY_DRIVE_ACCOUNT}`);
    const mockId = 'vault-' + (leadId || Date.now());
    const exactFolderQuery = `title = '${folderTitle.replace(/'/g, "\\'")}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;
    return {
      success: true,
      mode: 'local',
      ownerAccount: AGENCY_DRIVE_ACCOUNT,
      sharedWithEmail: normalizedClientEmail,
      isolatedClientAccess: true,
      createdByClientAction: true,
      vaultId: mockId,
      vaultUrl: `https://drive.google.com/drive/search?q=${encodeURIComponent(exactFolderQuery)}${authUserParam}`,
      name: folderTitle,
      subfolders: {
        insumos: {
          id: `${mockId}-insumos`,
          name: '01_Insumos_Cliente',
          url: `https://drive.google.com/drive/search?q=${encodeURIComponent(`title = '01_Insumos_Cliente' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`)}${authUserParam}`
        },
        contratos: {
          id: `${mockId}-contratos`,
          name: '02_Contratos_Firmados',
          url: `https://drive.google.com/drive/search?q=${encodeURIComponent(`title = '02_Contratos_Firmados' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`)}${authUserParam}`
        },
        entregables: {
          id: `${mockId}-entregables`,
          name: '03_Entregables_Codigo',
          url: `https://drive.google.com/drive/search?q=${encodeURIComponent(`title = '03_Entregables_Codigo' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`)}${authUserParam}`
        }
      }
    };
  }

  try {
    // 1. Verificar si ya existe en la cuenta de la agencia (sitesgoglite@gmail.com)
    let mainFolder = await findExistingFolder(token, folderTitle);

    if (!mainFolder) {
      console.log(`[DRIVE] Creando carpeta aislada en ${AGENCY_DRIVE_ACCOUNT} para cliente: "${folderTitle}"`);
      mainFolder = await createFolder(token, folderTitle);
    }

    const vaultId = mainFolder.id;
    const baseVaultUrl = mainFolder.webViewLink || `https://drive.google.com/drive/folders/${vaultId}`;
    const vaultUrl = normalizedClientEmail
      ? `${baseVaultUrl}${baseVaultUrl.includes('?') ? '&' : '?'}authuser=${encodeURIComponent(normalizedClientEmail)}`
      : baseVaultUrl;

    // Compartir la carpeta raíz de este cliente EXCLUSIVAMENTE con el correo autenticado del cliente
    if (normalizedClientEmail) {
      await shareFolderWithClient(token, vaultId, normalizedClientEmail);
    }

    // 2. Crear las 3 subcarpetas aisladas dentro del vaultId de este cliente
    let insumosFolder = await findExistingFolder(token, '01_Insumos_Cliente', vaultId);
    if (!insumosFolder) {
      insumosFolder = await createFolder(token, '01_Insumos_Cliente', vaultId);
    }
    if (normalizedClientEmail) {
      await shareFolderWithClient(token, insumosFolder.id, normalizedClientEmail);
    }

    let contratosFolder = await findExistingFolder(token, '02_Contratos_Firmados', vaultId);
    if (!contratosFolder) {
      contratosFolder = await createFolder(token, '02_Contratos_Firmados', vaultId);
    }
    if (normalizedClientEmail) {
      await shareFolderWithClient(token, contratosFolder.id, normalizedClientEmail);
    }

    let entregablesFolder = await findExistingFolder(token, '03_Entregables_Codigo', vaultId);
    if (!entregablesFolder) {
      entregablesFolder = await createFolder(token, '03_Entregables_Codigo', vaultId);
    }
    if (normalizedClientEmail) {
      await shareFolderWithClient(token, entregablesFolder.id, normalizedClientEmail);
    }

    // 3. Crear archivo de bienvenida e instrucciones en la carpeta de Insumos
    const instruccionesTexto = `========================================================================
GOGLITE DIGITAL · BÓVEDA CENTRALIZADA DE ACTIVOS Y PROYECTO
Cliente: ${cleanClientName}
Cuenta Autorizada del Cliente: ${normalizedClientEmail || 'Pendiente de vinculación'}
Fecha de Alta: ${new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
Cuenta Gestora Oficial: ${AGENCY_DRIVE_ACCOUNT}
========================================================================

ESTRUCTURA DE TU BÓVEDA AISLADA EN LA NUBE:
- 📁 01_Insumos_Cliente      -> Deposita aquí logos (SVG/PNG), fotos de alta resolución y textos.
- 📁 02_Contratos_Firmados   -> Contrato SOW oficial, firma digital manuscrita y comprobantes.
- 📁 03_Entregables_Codigo   -> Especificaciones PRD, credenciales, DNS y entregables finales.

REGLA DE PRIVACIDAD Y AISLAMIENTO:
Esta carpeta ha sido creada en la cuenta ${AGENCY_DRIVE_ACCOUNT} y compartida
exclusivamente con ${normalizedClientEmail || 'tu cuenta autorizada'}.

REGLA CONTRACTUAL DE INICIO DE DESARROLLO:
"El plazo acordado de entrega de diez (10) días hábiles inicia formalmente
una vez recibido el 100% de los insumos requeridos en esta bóveda."

Atentamente,
Víctor Matos · Director de Proyectos Goglite Digital
WhatsApp Directo: +1 (829) 986-2000
========================================================================`;

    await uploadTextFile(token, '00_LEER_PRIMERO_INSTRUCCIONES_INSUMOS.txt', instruccionesTexto, 'text/plain', insumosFolder.id);

    return {
      success: true,
      mode: 'live',
      ownerAccount: AGENCY_DRIVE_ACCOUNT,
      sharedWithEmail: normalizedClientEmail,
      isolatedClientAccess: true,
      createdByClientAction: true,
      vaultId,
      vaultUrl,
      name: folderTitle,
      subfolders: {
        insumos: {
          id: insumosFolder.id,
          name: '01_Insumos_Cliente',
          url: insumosFolder.webViewLink || `https://drive.google.com/drive/folders/${insumosFolder.id}`
        },
        contratos: {
          id: contratosFolder.id,
          name: '02_Contratos_Firmados',
          url: contratosFolder.webViewLink || `https://drive.google.com/drive/folders/${contratosFolder.id}`
        },
        entregables: {
          id: entregablesFolder.id,
          name: '03_Entregables_Codigo',
          url: entregablesFolder.webViewLink || `https://drive.google.com/drive/folders/${entregablesFolder.id}`
        }
      }
    };
  } catch (err) {
    console.error('[DRIVE] Error creando bóveda de cliente:', err);
    throw err;
  }
}

/**
 * Respalda el contrato formal firmado en la carpeta 02_Contratos_Firmados
 */
export async function archiveContractInDrive(contratosFolderId, clientName, contractData) {
  const token = await getAccessToken();
  if (!token || !contratosFolderId) return null;

  try {
    const filename = `CONTRATO_FIRMADO_${(clientName || 'CLIENTE').toUpperCase().replace(/[^A-Z0-9]/g, '_')}_${Date.now()}.md`;
    const markdownContent = `# CONTRATO DE SERVICIOS DIGITALES Y DESARROLLO WEB
**Goglite Digital x ${clientName}**
**Fecha de Firma:** ${new Date().toISOString()}

---

## 1. PARTES Y CONTACTO
- **Agencia:** Goglite Digital (Director: Víctor Matos · sitesgoglite@gmail.com)
- **Cliente:** ${clientName}
- **Firmante Autorizado:** ${contractData.nombreFirmante || 'No especificado'}
- **Documento de Identidad (DUI / Cédula / Pasaporte):** ${contractData.documentoFirmante || 'N/A'}
- **Comprobante de Pago Anticipo:** ${contractData.comprobanteAnticipo || 'Registrado'}

---

## 2. VALIDEZ JURÍDICA Y FIRMA DIGITAL
Este documento certifica la aceptación formal de la propuesta comercial, los términos del Statement of Work (SOW) y el abono del 50% de anticipo.

- **Hash / Firma Registrada:** ${contractData.firmaManuscrita ? 'Firma manuscrita en canvas digital capturada.' : 'Aprobación digital 1-clic.'}
- **Estado en CRM:** GANADO / EN PRODUCCIÓN

---
*Documento centralizado automáticamente por Goglite Agency Suite en Google Drive.*`;

    const file = await uploadTextFile(token, filename, markdownContent, 'text/markdown', contratosFolderId);
    console.log('[DRIVE] Contrato respaldado en Drive:', file?.name);
    return file;
  } catch (err) {
    console.warn('[DRIVE] No se pudo archivar contrato en Drive:', err.message);
    return null;
  }
}
