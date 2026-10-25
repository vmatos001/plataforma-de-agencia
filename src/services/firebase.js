import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc, setDoc, collection, getDocs } from 'firebase/firestore';
import { getAuth, signInAnonymously, onAuthStateChanged, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyAZifkGcuDk3gwP4H8tyT0DKEGDiF7obrY",
  authDomain: "goglite-agency.firebaseapp.com",
  projectId: "goglite-agency",
  storageBucket: "goglite-agency.firebasestorage.app",
  messagingSenderId: "203131738358"
};

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

let authInitPromise = null;
export function ensureAuth() {
  if (!authInitPromise) {
    authInitPromise = new Promise((resolve) => {
      onAuthStateChanged(auth, (user) => {
        if (user) {
          resolve(user);
        } else {
          signInAnonymously(auth)
            .then((cred) => resolve(cred.user))
            .catch((err) => {
              console.warn('[Firebase Auth] Anonymous sign-in fallback:', err);
              resolve(null);
            });
        }
      });
    });
  }
  return authInitPromise;
}

/**
 * Guarda o actualiza un sitio CMS directamente en Firestore
 */
export async function saveCmsSiteToFirestore(slug, siteData, editableContent) {
  await ensureAuth();
  const siteRef = doc(db, 'cms_sites', slug);
  const payload = {
    slug: slug,
    nombre: siteData.nombre || 'Sitio Web',
    contenido: editableContent,
    pais: siteData.pais || 'SV',
    dominio: siteData.dominio || `${slug}.com`,
    estado: 'publicado',
    ultimaActualizacion: new Date().toISOString().split('T')[0]
  };

  await setDoc(siteRef, payload, { merge: true });
  return payload;
}

/**
 * Obtiene el contenido de un sitio desde Firestore
 */
export async function getCmsSiteFromFirestore(slug) {
  try {
    const siteRef = doc(db, 'cms_sites', slug);
    const snap = await getDoc(siteRef);
    if (snap.exists()) {
      return snap.data();
    }
  } catch (err) {
    console.warn('[Firestore] Error leyendo sitio:', slug, err);
  }
  return null;
}

/**
 * Guarda o actualiza el estado completo de un portal de cliente en Firestore
 */
export async function savePortalToFirestore(token, portalData) {
  try {
    if (!token) return null;
    await ensureAuth();
    const cleanToken = String(token).trim();
    const portalRef = doc(db, 'portales', cleanToken);
    const payload = {
      token: cleanToken,
      lead: portalData.lead || null,
      presupuesto: portalData.presupuesto || null,
      proyecto: portalData.proyecto || null,
      portalConfig: portalData.portalConfig || {},
      updatedAt: new Date().toISOString()
    };
    await setDoc(portalRef, payload, { merge: true });
    return payload;
  } catch (err) {
    console.warn('[Firestore] Error guardando portal:', token, err);
    return null;
  }
}

/**
 * Obtiene el estado de un portal desde Firestore para sincronización multidispositivo
 */
export async function getPortalFromFirestore(token) {
  try {
    if (!token) return null;
    const cleanToken = String(token).trim();
    const portalRef = doc(db, 'portales', cleanToken);
    const snap = await getDoc(portalRef);
    if (snap.exists()) {
      return snap.data();
    }
  } catch (err) {
    console.warn('[Firestore] Error leyendo portal:', token, err);
  }
  return null;
}

/**
 * Conecta la cuenta de Google mediante OAuth 2.0 con permisos de Google Business Profile
 */
export async function connectGoogleBusinessAccount() {
  try {
    const provider = new GoogleAuthProvider();
    provider.addScope('https://www.googleapis.com/auth/business.manage');
    provider.setCustomParameters({ prompt: 'select_account' });
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    const token = credential?.accessToken;
    return { success: true, user: result.user, token };
  } catch (err) {
    console.warn('[Firebase Auth Google GBP]', err);
    return { success: false, error: err.message };
  }
}

/**
 * Conecta la cuenta de Google con permisos de Search Console y Analytics (Site Kit)
 */
export async function connectGoogleSiteKitAccount() {
  try {
    const provider = new GoogleAuthProvider();
    provider.addScope('https://www.googleapis.com/auth/webmasters.readonly');
    provider.addScope('https://www.googleapis.com/auth/analytics.readonly');
    provider.setCustomParameters({ prompt: 'select_account' });
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    const token = credential?.accessToken;
    return { success: true, user: result.user, token };
  } catch (err) {
    console.warn('[Firebase Auth Google Site Kit]', err);
    return { success: false, error: err.message };
  }
}

/**
 * Inicia sesión oficial del Administrador o Colaborador con cuenta de Google
 */
export async function signInWithGoogle() {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  return signInWithPopup(auth, provider);
}

/**
 * Cierra la sesión activa en Firebase Auth
 */
export async function signOutUser() {
  return auth.signOut();
}

export default { 
  app, 
  db, 
  auth, 
  ensureAuth, 
  signInWithGoogle, 
  signOutUser, 
  saveCmsSiteToFirestore, 
  getCmsSiteFromFirestore, 
  connectGoogleBusinessAccount, 
  connectGoogleSiteKitAccount 
};
