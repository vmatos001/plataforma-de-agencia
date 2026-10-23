/**
 * Goglite Headless CMS — Universal Client Script (v1.2.0)
 * Ultra-rápido, tolerante a fallos, 0ms en visitas recurrentes con caché local.
 * Conectado en tiempo real a Google Cloud Firestore REST API.
 * Incluye Motor de Edición Visual Inline (Click-to-Edit) para la agencia.
 */
(function() {
  var scriptTag = document.currentScript || (function() {
    var scripts = document.getElementsByTagName('script');
    return scripts[scripts.length - 1];
  })();

  var siteSlug = (scriptTag && scriptTag.getAttribute('data-site')) || 'goglite';
  var apiUrl = (scriptTag && scriptTag.getAttribute('data-api')) || 'https://goglite-agency.web.app';
  var cacheKey = 'goglite_cms_' + siteSlug;
  var isEditorMode = false;

  function getVal(path, obj) {
    if (!path || !obj) return '';
    return path.split('.').reduce(function(o, k) {
      return (o && typeof o[k] !== 'undefined') ? o[k] : '';
    }, obj);
  }

  function setVal(path, val, obj) {
    if (!path || !obj) return;
    var keys = path.split('.');
    var last = keys.pop();
    var target = keys.reduce(function(o, k) {
      if (!o[k] || typeof o[k] !== 'object') o[k] = {};
      return o[k];
    }, obj);
    target[last] = val;
  }

  function applyCmsData(c) {
    if (!c) return;

    // 1. Textos
    document.querySelectorAll('[data-cms]').forEach(function(el) {
      var key = el.getAttribute('data-cms');
      var val = getVal(key, c);
      if (val !== '') {
        el.textContent = val;
      }
    });

    // 2. Enlaces (Href / WhatsApp / Teléfono)
    document.querySelectorAll('[data-cms-href]').forEach(function(el) {
      var key = el.getAttribute('data-cms-href');
      var val = getVal(key, c);
      if (val !== '') {
        if (key.indexOf('WhatsApp') !== -1 || key.indexOf('telefono') !== -1 || key.indexOf('phone') !== -1) {
          var cleanPhone = String(val).replace(/[^0-9]/g, '');
          var currentHref = el.getAttribute('href') || '';
          var queryParams = '';
          if (currentHref.indexOf('?') !== -1) {
            queryParams = currentHref.substring(currentHref.indexOf('?'));
          } else {
            queryParams = '?text=' + encodeURIComponent('Hola, deseo información comercial.');
          }
          el.setAttribute('href', 'https://wa.me/' + cleanPhone + queryParams);
        } else {
          el.setAttribute('href', val);
        }
      }
    });

    // 3. Imágenes y Logos
    document.querySelectorAll('[data-cms-src]').forEach(function(el) {
      var key = el.getAttribute('data-cms-src');
      var val = getVal(key, c);
      if (val !== '') el.setAttribute('src', val);
    });

    // 4. Fondos CSS
    document.querySelectorAll('[data-cms-bg]').forEach(function(el) {
      var key = el.getAttribute('data-cms-bg');
      var val = getVal(key, c);
      if (val !== '') el.style.backgroundImage = 'url(' + val + ')';
    });

    window.dispatchEvent(new CustomEvent('goglite_cms_applied', { detail: c }));
  }

  // A. Carga instantánea desde caché local
  try {
    var cached = localStorage.getItem(cacheKey);
    if (cached) {
      applyCmsData(JSON.parse(cached));
    }
  } catch (e) {}

  // Parseador de Google Cloud Firestore REST API
  function parseFirestoreValue(val) {
    if (!val || typeof val !== 'object') return val;
    if ('stringValue' in val) return val.stringValue;
    if ('integerValue' in val) return parseInt(val.integerValue, 10);
    if ('doubleValue' in val) return parseFloat(val.doubleValue);
    if ('booleanValue' in val) return val.booleanValue;
    if ('timestampValue' in val) return val.timestampValue;
    if ('nullValue' in val) return null;
    if ('arrayValue' in val) {
      return ((val.arrayValue && val.arrayValue.values) || []).map(parseFirestoreValue);
    }
    if ('mapValue' in val) {
      var out = {};
      var f = (val.mapValue && val.mapValue.fields) || {};
      for (var k in f) {
        out[k] = parseFirestoreValue(f[k]);
      }
      return out;
    }
    return val;
  }

  function parseFirestoreDoc(doc) {
    if (!doc || !doc.fields) return doc;
    var res = {};
    for (var k in doc.fields) {
      res[k] = parseFirestoreValue(doc.fields[k]);
    }
    return res;
  }

  // B. Sincronización en vivo con la nube
  function fetchContent() {
    var endpoints = [
      'https://firestore.googleapis.com/v1/projects/goglite-agency/databases/(default)/documents/cms_sites/' + siteSlug,
      apiUrl + '/cms-data/' + siteSlug + '.json',
      apiUrl + '/api/cms/content/' + siteSlug,
      'https://raw.githubusercontent.com/vmatos001/plataforma-de-agencia/main/server/data/cms_sites.json'
    ];

    function tryNext(idx) {
      if (idx >= endpoints.length) return;
      fetch(endpoints[idx], { cache: 'no-cache' })
        .then(function(res) {
          if (!res.ok) throw new Error('Status ' + res.status);
          var ct = res.headers.get('content-type') || '';
          if (ct.indexOf('text/html') !== -1) throw new Error('Returned HTML instead of JSON');
          return res.json();
        })
        .then(function(data) {
          var content = null;
          if (data && data.fields) {
            var parsedDoc = parseFirestoreDoc(data);
            if (parsedDoc && parsedDoc.contenido) content = parsedDoc.contenido;
          } else if (Array.isArray(data)) {
            var found = data.find(function(s) { return s.slug === siteSlug; });
            if (found && found.contenido) content = found.contenido;
          } else if (data && data.contenido) {
            content = data.contenido;
          } else if (data) {
            content = data;
          }

          if (content) {
            applyCmsData(content);
            try {
              localStorage.setItem(cacheKey, JSON.stringify(content));
            } catch (err) {}
          } else {
            tryNext(idx + 1);
          }
        })
        .catch(function(err) {
          tryNext(idx + 1);
        });
    }

    tryNext(0);
  }

  fetchContent();

  // ===============================================================
  // C. Motor de Edición Visual Inline (Click-to-Edit · Opción C)
  // ===============================================================

  function enableInlineEditor() {
    if (isEditorMode) return;
    isEditorMode = true;

    // Inyectar estilos visuales del editor en la página
    var style = document.createElement('style');
    style.id = 'goglite-cms-editor-styles';
    style.textContent = [
      '.goglite-cms-field-hover {',
      '  outline: 2px dashed #FF6B00 !important;',
      '  outline-offset: 4px !important;',
      '  cursor: pointer !important;',
      '  position: relative !important;',
      '  transition: outline 0.15s ease !important;',
      '}',
      '.goglite-cms-field-active {',
      '  outline: 2px solid #22c55e !important;',
      '  outline-offset: 4px !important;',
      '  background-color: rgba(34, 197, 94, 0.08) !important;',
      '  border-radius: 4px !important;',
      '}',
      '.goglite-cms-badge {',
      '  position: absolute !important;',
      '  top: -26px !important;',
      '  left: 0 !important;',
      '  background: #111827 !important;',
      '  color: #FF8A00 !important;',
      '  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;',
      '  font-size: 11px !important;',
      '  font-weight: 700 !important;',
      '  padding: 2px 8px !important;',
      '  border-radius: 4px !important;',
      '  border: 1px solid #FF8A00 !important;',
      '  z-index: 2147483647 !important;',
      '  pointer-events: none !important;',
      '  box-shadow: 0 4px 12px rgba(0,0,0,0.4) !important;',
      '  display: flex !important;',
      '  align-items: center !important;',
      '  gap: 4px !important;',
      '  white-space: nowrap !important;',
      '}'
    ].join('\n');
    document.head.appendChild(style);

    var badge = document.createElement('div');
    badge.className = 'goglite-cms-badge';
    badge.style.display = 'none';
    document.body.appendChild(badge);

    var discoveredElements = [];

    // 1. Configurar elementos de texto [data-cms]
    document.querySelectorAll('[data-cms]').forEach(function(el) {
      var key = el.getAttribute('data-cms');
      discoveredElements.push({
        type: 'text',
        key: key,
        tag: el.tagName.toLowerCase(),
        text: el.textContent.trim().slice(0, 80)
      });

      el.setAttribute('title', 'Clic para editar este texto');
      
      el.addEventListener('mouseenter', function() {
        if (document.activeElement === el) return;
        el.classList.add('goglite-cms-field-hover');
        var rect = el.getBoundingClientRect();
        badge.innerHTML = '✏️ ' + key;
        badge.style.top = (rect.top + window.scrollY - 26) + 'px';
        badge.style.left = (rect.left + window.scrollX) + 'px';
        badge.style.display = 'flex';
      });

      el.addEventListener('mouseleave', function() {
        el.classList.remove('goglite-cms-field-hover');
        if (document.activeElement !== el) {
          badge.style.display = 'none';
        }
      });

      el.addEventListener('click', function(e) {
        // Habilitar edición de contenido al hacer clic
        el.setAttribute('contenteditable', 'true');
        el.classList.add('goglite-cms-field-active');
        el.classList.remove('goglite-cms-field-hover');
        badge.style.display = 'none';
        el.focus();
      });

      el.addEventListener('blur', function() {
        el.removeAttribute('contenteditable');
        el.classList.remove('goglite-cms-field-active');
        badge.style.display = 'none';
        
        var newVal = el.textContent.trim();
        // Notificar a la plataforma de agencia
        if (window.parent && window.parent !== window) {
          window.parent.postMessage({
            type: 'GOGLITE_CMS_INLINE_CHANGE',
            key: key,
            value: newVal
          }, '*');
        }
      });

      // Guardar con Enter si es una sola línea
      el.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && (el.tagName === 'H1' || el.tagName === 'H2' || el.tagName === 'H3' || el.tagName === 'SPAN')) {
          e.preventDefault();
          el.blur();
        }
      });
    });

    // 2. Configurar enlaces y WhatsApp [data-cms-href]
    document.querySelectorAll('[data-cms-href]').forEach(function(el) {
      var key = el.getAttribute('data-cms-href');
      discoveredElements.push({
        type: 'href',
        key: key,
        tag: el.tagName.toLowerCase(),
        href: el.getAttribute('href')
      });

      el.addEventListener('mouseenter', function() {
        el.classList.add('goglite-cms-field-hover');
        var rect = el.getBoundingClientRect();
        badge.innerHTML = '🔗 ' + key;
        badge.style.top = (rect.top + window.scrollY - 26) + 'px';
        badge.style.left = (rect.left + window.scrollX) + 'px';
        badge.style.display = 'flex';
      });

      el.addEventListener('mouseleave', function() {
        el.classList.remove('goglite-cms-field-hover');
        badge.style.display = 'none';
      });

      el.addEventListener('click', function(e) {
        e.preventDefault();
        var currentHref = el.getAttribute('href') || '';
        var promptText = key.indexOf('WhatsApp') !== -1 || key.indexOf('telefono') !== -1
          ? 'Ingresa el nuevo número de WhatsApp (ej. +829 528-4713):'
          : 'Ingresa el nuevo enlace URL:';
        
        var newHref = window.prompt(promptText, currentHref);
        if (newHref !== null && newHref.trim() !== '') {
          var cleanPhone = newHref.trim();
          if (window.parent && window.parent !== window) {
            window.parent.postMessage({
              type: 'GOGLITE_CMS_INLINE_CHANGE',
              key: key,
              value: cleanPhone
            }, '*');
          }
          if (key.indexOf('WhatsApp') !== -1 || key.indexOf('telefono') !== -1) {
            var digits = cleanPhone.replace(/[^0-9]/g, '');
            el.setAttribute('href', 'https://wa.me/' + digits + '?text=' + encodeURIComponent('Hola, deseo información.'));
          } else {
            el.setAttribute('href', cleanPhone);
          }
        }
      });
    });

    // Notificar al panel de agencia los elementos descubiertos en esta página
    if (window.parent && window.parent !== window) {
      window.parent.postMessage({
        type: 'GOGLITE_CMS_PAGE_DISCOVERED',
        url: window.location.href,
        pathname: window.location.pathname,
        title: document.title,
        elementsCount: discoveredElements.length,
        elements: discoveredElements
      }, '*');
    }
  }

  // Activar si está dentro de un iframe o si tiene ?goglite_edit=true
  if (window.self !== window.top || window.location.search.indexOf('goglite_edit=true') !== -1) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', enableInlineEditor);
    } else {
      setTimeout(enableInlineEditor, 400);
    }
  }

  // Listener para mensajes de la plataforma de agencia
  window.addEventListener('message', function(event) {
    if (!event.data) return;
    if (event.data.type === 'GOGLITE_CMS_LIVE_PREVIEW') {
      applyCmsData(event.data.content);
    } else if (event.data.type === 'GOGLITE_CMS_ENABLE_INLINE_EDITOR') {
      enableInlineEditor();
    } else if (event.data.type === 'GOGLITE_CMS_SAVE_CONFIRMED') {
      var toast = document.createElement('div');
      toast.style.cssText = 'position:fixed;bottom:24px;right:24px;background:#10b981;color:white;padding:12px 20px;border-radius:8px;font-weight:bold;z-index:9999999;box-shadow:0 8px 24px rgba(0,0,0,0.3);font-family:sans-serif;animation:fadeIn 0.3s ease;';
      toast.textContent = '✅ Cambios publicados en vivo con éxito';
      document.body.appendChild(toast);
      setTimeout(function() { toast.remove(); }, 3500);
    }
  });
})();
