# Plan de Acción: Migración a Arquitectura 100% Cloud-Only (Firebase Firestore)

Este documento contiene las instrucciones técnicas exactas para que el agente ejecutor transforme **Goglite Digital Hub** a una arquitectura **100% Cloud-Only** usando **Firebase Firestore** como única fuente de verdad, eliminando por completo la persistencia de datos de negocio en `localStorage` (`src/services/localStore.js`) y evitando cualquier dependencia de archivos JSON locales en producción.

---

## 1. Reglas de Oro para el Agente Ejecutor

1. **Cero pérdida de datos**: Antes de desconectar `localStorage`, verificar que los documentos actuales en Firestore (`crm_leads`, `presupuestos`, `proyectos`, `portales`, `sprint_tasks`, `app_state`) estén intactos en la nube.
2. **Prohibido re-subir caché local a Firestore**: Eliminar de todos los módulos los bloques `if (!cloudIds.has(localItem.id)) save...Cloud(localItem)` que reinyectaban datos borrados desde el navegador hacia Firestore.
3. **Desacoplamiento estricto de entidades**:
   - Eliminar una **Propuesta** (`deletePresupuestoCloud`) solo elimina el documento en `presupuestos` y limpia los campos `presupuestoId: null, presupuestoCodigo: null, presupuestoMonto: null, presupuestoEstado: null` en `crm_leads`. **Jamás elimina el Lead.**
   - Eliminar un **Contrato SOW** (`deleteProyectoCloud`) solo elimina el documento en `proyectos` y limpia `proyectoId: null` en `crm_leads`. **Jamás elimina la Propuesta ni el Lead.**
   - Eliminar un **Lead** (`deleteCrmLeadCloud`) solo elimina ese documento por su `id` en `crm_leads`.
4. **Reglas de Firestore**: Si se requiere tocar `firestore.rules`, delegar obligatoriamente al subagente `firestore-rules-author`.
5. **Uso permitido de `localStorage` (Solo UI/Sesión)**:
   - Solo pueden permanecer en `localStorage` preferencias visuales (`goglite_active_module`, `goglite_sidebar_collapsed`, `goglite_crm_active_tab`, `goglite_crm_country`, `goglite_crm_archive_filter`) y el sello MFA del dispositivo (`goglite_mfa_seal_*`).

---

## 2. Fases de Implementación

### Fase 0: Purga de `localStorage` de Negocio y Desactivación de `localStore.js`
- **Archivo:** `src/services/localStore.js`
  1. Al iniciar la aplicación, eliminar automáticamente de `localStorage` todas las llaves de negocio legacy:
     `goglite_outbound_leads`, `goglite_crm_leads`, `goglite_crm_leads_v3`, `goglite_crm_leads_v4_prod`, `goglite_presupuestos`, `goglite_contratos`, `goglite_proyectos`, `goglite_finanzas_v1`, `goglite_live_timer_v1`, `goglite_sprint_tasks`, `goglite_sprint_tasks_by_project`, `goglite_repo_vault`, `goglite_cms_sites`, `goglite_cms_hub_v1`, `goglite_seo_launch_qa_v1`, `goglite_seo_geo_v1`, y llaves con prefijo `goglite_portal_`, `goglite_launch_qa_`, `goglite_gbp_`, `goglite_sitekit_`, `goglite_pagespeed_`, `goglite_ga4_`.
  2. Refactorizar `syncCrmLeadsWithPresupuestos(crmLeads, presupuestosList = [])` para que **no lea `localStorage.getItem('goglite_presupuestos')`** ni modifique `lead.archivado`. Debe recibir `presupuestosList` en memoria desde Firestore.
  3. Hacer que `getStoredCrmLeads()` devuelva `[]` y `saveStoredCrmLeads()` sea un no-op.

### Fase 1: Fortalecer `src/services/firestoreSyncService.js`
- **Archivo:** `src/services/firestoreSyncService.js`
  1. En `deletePresupuestoCloud(presupuestoId, extraKeys)`: tras eliminar el documento de la colección `presupuestos`, buscar en `crm_leads` cualquier lead cuyo `presupuestoId` o `presupuestoCodigo` coincida y actualizar ese documento en Firestore con `{ presupuestoId: null, presupuestoCodigo: null, presupuestoMonto: null, presupuestoEstado: null }`.
  2. En `deleteProyectoCloud(proyectoId, extraKeys)`: tras eliminar el documento de la colección `proyectos`, buscar en `crm_leads` cualquier lead cuyo `proyectoId` coincida y actualizarlo en Firestore con `{ proyectoId: null }`.

### Fase 2: Refactorizar Módulos Frontend a 100% Firestore
1. **`src/components/CrmPortalModule.jsx`**:
   - Eliminar lecturas/escrituras a `getStoredCrmLeads` y `saveStoredCrmLeads`.
   - Alimentar `leads` exclusivamente desde `subscribeCrmLeadsCloud` y `getCrmLeadsCloud()`.
   - Mantener una suscripción a `subscribePresupuestosCloud` en memoria para cruzar propuestas activas con `syncCrmLeadsWithPresupuestos(cloudLeads, cloudPresupuestos)`.
   - Eliminar el bloque que re-subía `local` a Firestore en `fetchCrmLeads`.
2. **`src/components/PresupuestosModule.jsx`**:
   - Eliminar `syncPresupuestosFromStorage()`, el polling `setInterval` de 2500ms a `localStorage` y toda llamada a `localStorage.getItem('goglite_presupuestos')` / `localStorage.setItem('goglite_presupuestos', ...)`.
   - Alimentar `presupuestos` exclusivamente desde `subscribePresupuestosCloud` y `getPresupuestosCloud()`.
   - Eliminar la re-subida de caché local en `fetchPresupuestos`.
3. **`src/components/ContratosOnboardingModule.jsx` y `src/services/contractGenerator.js`**:
   - Eliminar lecturas/escrituras de `localStorage.getItem('goglite_proyectos')` y `localStorage.getItem('goglite_presupuestos')`.
   - Alimentar `proyectos` y `presupuestos` exclusivamente desde `subscribeProyectosCloud`, `getProyectosCloud()`, `subscribePresupuestosCloud` y `getPresupuestosCloud()`.
   - Eliminar la re-subida de proyectos locales en `fetchProyectos`.
4. **`src/components/PublicClientPortal.jsx` y `src/components/ClientCmsPortal.jsx`**:
   - Eliminar lecturas/escrituras de `goglite_presupuestos`, `goglite_proyectos`, `goglite_cms_sites`, `goglite_portal_*`, `goglite_gbp_*`, `goglite_sitekit_*` y `goglite_pagespeed_*` en `localStorage`.
   - Usar exclusivamente `getPortalCloud`, `subscribePortalCloud`, `savePortalCloud`, `savePresupuestoCloud`, `saveProyectoCloud` y `app_state` en Firestore.
5. **Módulos restantes (`LeadScrapperModule.jsx`, `CentroDesarrolloPrdModule.jsx`, `projectMilestoneSync.js`, `SeoLaunchQaModule.jsx`, `HeadlessCmsHubModule.jsx`, `GoogleSiteKitView.jsx`, `GoogleBusinessProfileView.jsx`, `GestionRentabilidadModule.jsx`, `App.jsx`, `AgencyWhiteLabelSettingsModal.jsx`)**:
   - Reemplazar las lecturas/escrituras de datos de negocio en `localStorage` por sus equivalentes en `firestoreSyncService.js` (`getSprintTasksCloud` / `saveSprintTasksCloud`, `getFinanzasCloud` / `saveFinanzasCloud`, `getAppStateCloud` / `saveAppStateCloud` / `subscribeAppStateCloud`).

---

## 3. Checklist de Verificación Final

- [ ] `grep -rn "localStorage\.\(getItem\|setItem\)" src/` confirma que ningún dato de negocio se lee ni escribe en `localStorage`.
- [ ] Eliminar una propuesta no elimina el lead en `crm_leads`.
- [ ] Eliminar un contrato SOW no elimina la propuesta ni el lead.
- [ ] Archivar/desarchivar un lead persiste en Firestore al recargar (`F5`).
- [ ] Ningún registro eliminado vuelve a aparecer al recargar (`F5`).
- [ ] `npm run build` compila con 0 errores.
- [ ] Commit, `git push origin main` y despliegue exitoso en GitHub Actions (`https://agencia.goglite.com`).
