/**
 * server/services/googleDriveService.js
 * Servicio de Bóveda Centralizada en Google Drive para Goglite Agency Suite
 * Conexión nativa con Google Drive API v3 (OAuth2)
 * Cuenta de la agencia: sitesgoglite@gmail.com
 */

import fs from 'fs';
import path from 'path';

const CREDENTIALS_PATH = process.env.GOOGLE_SUITE_CREDENTIALS || 'C:/Users/laura hart/google-suite-mcp/credentials.json';
const TOKEN_PATH = process.env.GOOGLE_SUITE_TOKENS || 'C:/Users/laura hart/google-suite-mcp/token.json';

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

/**
 * Configura permisos de lectura pública para la carpeta compartida con el cliente
 */
async function makeFolderShareable(token, folderId) {
  try {
    await fetch(`https://www.googleapis.com/drive/v3/files/${folderId}/permissions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        role: 'reader',
        type: 'anyone'
      })
    });
  } catch (e) {
    console.warn('[DRIVE] Permisos públicos no aplicados (opcional):', e.message);
  }
}

/**
 * Busca si ya existe una carpeta con el nombre dado
 */
async function findExistingFolder(token, name) {
  try {
    const safeName = name.replace(/'/g, "\\'");
    const q = `name = '${safeName}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;
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
 * Crea o recupera la Bóveda Centralizada del Cliente con sus 3 subcarpetas
 */
export async function createClientVault(clientName, clientEmail = '', leadId = null) {
  const token = await getAccessToken();
  const folderTitle = `📁 [Goglite] ${clientName || 'Cliente'}`;

  // Si no hay conexión con Google Drive, devolver estructura mock funcional
  if (!token) {
    console.warn('[DRIVE] Operando en modo local sin token de Drive');
    const mockId = 'local-drive-' + Date.now();
    return {
      success: true,
      mode: 'local',
      vaultId: mockId,
      vaultUrl: `https://drive.google.com/drive/search?q=${encodeURIComponent(folderTitle)}`,
      name: folderTitle,
      subfolders: {
        insumos: { id: `${mockId}-insumos`, name: '01_Insumos_Cliente', url: `https://drive.google.com/drive/folders/${mockId}-insumos` },
        contratos: { id: `${mockId}-contratos`, name: '02_Contratos_Firmados', url: `https://drive.google.com/drive/folders/${mockId}-contratos` },
        entregables: { id: `${mockId}-entregables`, name: '03_Entregables_Codigo', url: `https://drive.google.com/drive/folders/${mockId}-entregables` }
      }
    };
  }

  try {
    // 1. Verificar si ya existe
    let mainFolder = await findExistingFolder(token, folderTitle);

    if (!mainFolder) {
      console.log(`[DRIVE] Creando carpeta principal para cliente: "${folderTitle}"`);
      mainFolder = await createFolder(token, folderTitle);
      await makeFolderShareable(token, mainFolder.id);
    }

    const vaultId = mainFolder.id;
    const vaultUrl = mainFolder.webViewLink || `https://drive.google.com/drive/folders/${vaultId}`;

    // 2. Crear las 3 subcarpetas
    let insumosFolder = await findExistingFolder(token, '01_Insumos_Cliente');
    if (!insumosFolder) {
      insumosFolder = await createFolder(token, '01_Insumos_Cliente', vaultId);
    }

    let contratosFolder = await findExistingFolder(token, '02_Contratos_Firmados');
    if (!contratosFolder) {
      contratosFolder = await createFolder(token, '02_Contratos_Firmados', vaultId);
    }

    let entregablesFolder = await findExistingFolder(token, '03_Entregables_Codigo');
    if (!entregablesFolder) {
      entregablesFolder = await createFolder(token, '03_Entregables_Codigo', vaultId);
    }

    // 3. Crear archivo de bienvenida e instrucciones en la carpeta de Insumos
    const instruccionesTexto = `========================================================================
GOGLITE DIGITAL · BÓVEDA CENTRALIZADA DE ACTIVOS Y PROYECTO
Cliente: ${clientName}
Fecha de Alta: ${new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
Cuenta Gestora: sitesgoglite@gmail.com
========================================================================

ESTRUCTURA DE TU BÓVEDA EN LA NUBE:
- 📁 01_Insumos_Cliente      -> Deposita aquí logos (SVG/PNG), fotos de alta resolución y textos.
- 📁 02_Contratos_Firmados   -> Contrato SOW oficial, firma digital manuscrita y comprobantes.
- 📁 03_Entregables_Codigo   -> Especificaciones PRD, credenciales, DNS y entregables finales.

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
