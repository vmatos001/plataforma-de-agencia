# Goglite Tools — Módulo 1: Lead Scrapper & Prospección Outbound con IA

Plataforma operativa y de adquisición para **Goglite**, inspirada en la arquitectura de herramientas de agencia de alto rendimiento vista en el sistema de Palo Seco, adaptada específicamente para **El Salvador (SV)** y **República Dominicana (DO)**.

---

## 🚀 Capacidades del Módulo 1

1. **Pipeline Automático 1-Click (`▷ Lanzar pipeline`):**
   - Introduce una intención de búsqueda (ej. *"clínicas dentales en San Salvador"* o *"inmobiliarias en Punta Cana"*).
   - Busca en Google y filtra automáticamente las **posiciones #4 a #20** (empresas con tracción pero fuera del top 3).
   - Extrae el decisor (CEO, Socio Director) y su correo electrónico verificado.
   - Ejecuta una **auditoría técnica de 3 puntos (GEO/IA, SEO, Velocidad/CRO)**.
   - Redacta un **email pitch hiperpersonalizado** citando errores reales y comparando con competidores líderes.
   - Guarda el prospecto directamente en tu base de datos de leads.

2. **Buscador Manual con Selección Selectiva:**
   - Visualiza los resultados de Google en tiempo real con sus posiciones (#1 a #20).
   - Destaca con badge verde los prospectos ideales para outbound (#4-#20).
   - Barra flotante inferior para **"Extraer contactos y auditar"** los prospectos seleccionados.

3. **Catálogo de Sugerencias de Nichos de Alto Ticket:**
   - Acceso rápido a sectores validados con alto ROI en El Salvador y República Dominicana (Clínicas estéticas, Inmobiliarias de lujo, Cirugía plástica, Bufetes corporativos, Logística).

4. **Gestión Completa de Leads:**
   - Tabla interactiva con estados: `Nuevo`, `Contactado`, `Enviado a Instantly`, `Respondió`, `Cliente`, `Descartado`.
   - Visualizador modal con el desglose de la auditoría y el borrador de email.
   - Botón directo para **"Abrir en Gmail / Mail"** o enviar a **Instantly**.
   - Exportación completa en **CSV** con un solo clic para Excel / Google Sheets.

5. **Panel de Ajustes de Conectores (APIs):**
   - Configuración de Google Gemini API, Serper.dev, Apollo.io e Instantly.
   - **Modo Inteligente Sin Costo:** El sistema cuenta con analizador heurístico local y scraper web directo, funcionando al 100% incluso sin contratar APIs de pago.

---

## 🛠️ Cómo Iniciar la Plataforma

### Opción 1: Servidor Integrado (Producción / Local)
```bash
npm start
```
Abre en tu navegador: **[http://localhost:3001](http://localhost:3001)**

### Opción 2: Modo Desarrollo con Hot Reload (Vite + Node)
```bash
npm run dev
```
- Frontend Vite con HMR: **http://localhost:5173**
- Backend API Express: **http://localhost:3001**

---

## 📁 Estructura del Código

```text
plataforma-de-agencia/
├── server/
│   ├── data/                 # Base de datos local en JSON (leads, ajustes, historial)
│   ├── services/
│   │   ├── scraper.js        # Motor de búsqueda SERP (Serper API + Scraper local)
│   │   ├── enricher.js       # Extracción de decisores y correos (Apollo + Web scraper)
│   │   ├── auditor.js        # Diagnóstico técnico de 3 puntos (Gemini IA + Análisis semántico)
│   │   ├── pitcher.js        # Redactor de emails en frío hiperpersonalizados
│   │   └── storage.js        # Servicio de persistencia y exportación CSV
│   └── index.js              # Servidor Express API + Servidor de archivos estáticos
├── src/
│   ├── App.jsx               # Aplicación React maestra (Buscador, Pipeline, Leads, Modales)
│   ├── index.css             # Tailwind CSS v4 + Estilos Dark Mode de Goglite
│   └── main.jsx              # Punto de entrada React
├── dist/                     # Compilación lista para producción
└── package.json
```
