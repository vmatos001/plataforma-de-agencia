import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

function base64url(str) {
  return Buffer.from(str).toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

async function getAccessToken(sa) {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'RS256', typ: 'JWT' };
  const payload = {
    iss: sa.client_email,
    sub: sa.client_email,
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
    scope: 'https://www.googleapis.com/auth/cloud-platform https://www.googleapis.com/auth/datastore https://www.googleapis.com/auth/firebase'
  };

  const encodedHeader = base64url(JSON.stringify(header));
  const encodedPayload = base64url(JSON.stringify(payload));
  const signInput = `${encodedHeader}.${encodedPayload}`;

  const signer = crypto.createSign('RSA-SHA256');
  signer.update(signInput);
  signer.end();
  const signature = signer.sign(sa.private_key, 'base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');

  const jwt = `${signInput}.${signature}`;

  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt
    }).toString()
  });

  const data = await tokenRes.json();
  if (!data.access_token) {
    throw new Error(`Failed to get OAuth token: ${JSON.stringify(data)}`);
  }
  return data.access_token;
}

async function deployFirestoreRules(accessToken, projectId) {
  console.log('\n[1/2] Evaluando y desplegando reglas de Firestore en la nube...');
  const rulesPath = path.resolve('firestore.rules');
  if (!fs.existsSync(rulesPath)) {
    console.warn('firestore.rules no encontrado en el directorio raíz.');
    return false;
  }

  const rulesContent = fs.readFileSync(rulesPath, 'utf8');

  // 1. Crear Ruleset
  const createRulesetUrl = `https://firebaserules.googleapis.com/v1/projects/${projectId}/rulesets`;
  const rulesetRes = await fetch(createRulesetUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      source: {
        files: [
          {
            name: 'firestore.rules',
            content: rulesContent
          }
        ]
      }
    })
  });

  const rulesetData = await rulesetRes.json();
  if (!rulesetRes.ok || !rulesetData.name) {
    console.warn('No se pudo crear ruleset vía REST API (puede requerir roles/firebaserules.admin):', rulesetData);
    return false;
  }

  const rulesetName = rulesetData.name;
  console.log(`Ruleset creado exitosamente: ${rulesetName}`);

  // 2. Liberar el Ruleset a cloud.firestore
  const releaseUrl = `https://firebaserules.googleapis.com/v1/projects/${projectId}/releases/cloud.firestore?updateMask=rulesetName`;
  const releaseRes = await fetch(releaseUrl, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      release: {
        name: `projects/${projectId}/releases/cloud.firestore`,
        rulesetName: rulesetName
      }
    })
  });

  const releaseData = await releaseRes.json();
  if (releaseRes.ok) {
    console.log('✅ Reglas de Firestore desplegadas y activadas en producción:', releaseData.name);
    return true;
  } else if (releaseRes.status === 404) {
    // Si no existía la release cloud.firestore, crearla
    const createReleaseUrl = `https://firebaserules.googleapis.com/v1/projects/${projectId}/releases`;
    const createReleaseRes = await fetch(createReleaseUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: `projects/${projectId}/releases/cloud.firestore`,
        rulesetName: rulesetName
      })
    });
    const createData = await createReleaseRes.json();
    if (createReleaseRes.ok) {
      console.log('✅ Release cloud.firestore creada y activada:', createData.name);
      return true;
    }
  }

  console.warn('Respuesta al actualizar release de reglas:', releaseData);
  return false;
}

async function purgeFirestoreCollections(accessToken, projectId) {
  console.log('\n[2/2] Purgando colecciones transaccionales en Firestore Cloud...');
  const collections = ['crm_leads', 'presupuestos', 'proyectos', 'portales', 'sprint_tasks', 'app_state', 'leads'];

  for (const col of collections) {
    try {
      const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${col}?pageSize=300`;
      const res = await fetch(url, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });

      if (!res.ok) {
        const errText = await res.text();
        console.log(`Colección ${col}: ${res.status} (${errText.slice(0, 100)})`);
        continue;
      }

      const data = await res.json();
      const docs = data.documents || [];
      if (docs.length === 0) {
        console.log(`✅ Colección '${col}': limpia (0 documentos)`);
        continue;
      }

      let deleted = 0;
      for (const doc of docs) {
        const delRes = await fetch(`https://firestore.googleapis.com/v1/${doc.name}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${accessToken}` }
        });
        if (delRes.ok) deleted++;
      }
      console.log(`🧹 Colección '${col}': purgados ${deleted} de ${docs.length} documentos`);
    } catch (e) {
      console.warn(`Error purgando colección ${col}:`, e.message);
    }
  }
}

async function purgeSpecificTestRecords(accessToken, projectId) {
  console.log('\n[2/2] Limpiando registros de prueba específicos en Firestore Cloud...');
  const collections = ['presupuestos', 'proyectos', 'portales', 'crm_leads'];
  const bannedPatterns = [
    'multiservicios gisselle',
    'clínica dental escalón',
    'con-2026-001',
    'con-2026-002'
  ];

  for (const col of collections) {
    try {
      const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${col}?pageSize=300`;
      const res = await fetch(url, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      if (!res.ok) continue;

      const data = await res.json();
      const docs = data.documents || [];
      let deleted = 0;

      for (const doc of docs) {
        const serialized = JSON.stringify(doc).toLowerCase();
        const isTest = bannedPatterns.some(pattern => serialized.includes(pattern));
        if (isTest) {
          const delRes = await fetch(`https://firestore.googleapis.com/v1/${doc.name}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${accessToken}` }
          });
          if (delRes.ok) {
            deleted++;
            console.log(`🗑️ Eliminado documento de prueba en '${col}': ${doc.name.split('/').pop()}`);
          }
        }
      }
      if (deleted > 0) {
        console.log(`✅ Colección '${col}': eliminados ${deleted} documentos de prueba.`);
      }
    } catch (e) {
      console.warn(`Error limpiando documentos de prueba en ${col}:`, e.message);
    }
  }
}

async function main() {
  const saPath = process.argv[2] || process.env.GOOGLE_APPLICATION_CREDENTIALS || '/tmp/sa.json';
  if (!fs.existsSync(saPath)) {
    console.error(`Archivo de Service Account no encontrado en: ${saPath}`);
    process.exit(0);
  }

  console.log(`Cargando Service Account desde ${saPath}...`);
  const sa = JSON.parse(fs.readFileSync(saPath, 'utf8'));
  const projectId = sa.project_id || 'goglite-agency';
  console.log(`Proyecto destino: ${projectId}`);
  console.log(`Service Account Email: ${sa.client_email}`);

  try {
    const accessToken = await getAccessToken(sa);
    console.log('Token de acceso obtenido exitosamente.');

    await deployFirestoreRules(accessToken, projectId);
    await purgeSpecificTestRecords(accessToken, projectId);
    if (process.env.PURGE_FIRESTORE_ON_DEPLOY === 'true') {
      await purgeFirestoreCollections(accessToken, projectId);
    }

    console.log('\n🎉 Despliegue de reglas de Firebase Firestore completado con éxito.');
  } catch (err) {
    console.error('Error durante el mantenimiento de Firestore:', err);
    // No romper el build si el SA tiene restricciones de IAM
  }
}

main();
