/**
 * Goglite Headless CMS — Universal Client Script (v1.4.1)
 * Ultra-rápido, tolerante a fallos, 0ms en visitas recurrentes con caché local.
 * Conectado en tiempo real a Google Cloud Firestore REST API.
 * Motor Universal de Auto-Escaneo de Textos & Edición Visual Inline (Click-to-Edit).
 * Protege la estructura del sitio: solo permite editar textos puros sin alterar diseño ni CSS.
 */
(function() {
  var scriptTag = document.currentScript || (function() {
    var scripts = document.getElementsByTagName('script');
    return scripts[scripts.length - 1];
  })();

  var rawSlugAttr = (scriptTag && scriptTag.getAttribute('data-site')) || '';
  var host = (window.location && window.location.hostname || '').toLowerCase();
  var siteSlug = rawSlugAttr || 'goglite';
  if ((!rawSlugAttr || rawSlugAttr === 'goglite') && host && host.indexOf('goglite') === -1 && host !== 'localhost' && host !== '127.0.0.1') {
    if (host.indexOf('turisra') !== -1) {
      siteSlug = 'turisran';
    } else {
      siteSlug = host.replace(/^www\./, '').split('.')[0].replace(/[^a-z0-9-]/g, '');
    }
  }
  var apiUrl = (scriptTag && scriptTag.getAttribute('data-api')) || 'https://goglite-agency.web.app';
  var cacheKey = 'goglite_cms_' + siteSlug;
  var isEditorMode = false;

  function getVal(path, obj) {
    if (!path || !obj) return undefined;
    var parts = path.split('.');
    var curr = obj;
    for (var i = 0; i < parts.length; i++) {
      if (curr && typeof curr[parts[i]] !== 'undefined') {
        curr = curr[parts[i]];
      } else {
        return undefined;
      }
    }
    return curr;
  }

  // ===============================================================
  // 1. Escáner Universal de Textos (Auto-Discovery)
  // Escanea todo el árbol de la página y detecta cualquier elemento de texto editable.
  // ===============================================================
  function scanAndTagAllTextElements() {
    var sectionCounters = {};

    function walk(node) {
      if (node.nodeType === Node.ELEMENT_NODE) {
        var tag = node.tagName.toLowerCase();

        // Ignorar scripts, estilos, SVGs, iframes y elementos del CMS
        if (['script', 'style', 'svg', 'noscript', 'iframe'].indexOf(tag) !== -1 ||
            (node.classList && (node.classList.contains('goglite-cms-badge') || node.classList.contains('goglite-cms-toolbar')))) {
          return;
        }

        // Calcular texto directo del elemento
        var directText = '';
        for (var i = 0; i < node.childNodes.length; i++) {
          var child = node.childNodes[i];
          if (child.nodeType === Node.TEXT_NODE) {
            var t = (child.nodeValue || '').trim();
            if (t) directText += (directText ? ' ' : '') + t;
          }
        }

        var isTextContainer = ['h1','h2','h3','h4','h5','h6','p','a','button','label','blockquote','li','span','div'].indexOf(tag) !== -1;
        var isMeaningfulText = directText.length > 1 || (directText.length === 1 && /[a-zA-Z0-9]/.test(directText));

        if (isTextContainer && isMeaningfulText) {
          // Si es un contenedor con elementos de bloque hijos, no lo etiquetamos (etiquetaremos sus hijos)
          var hasBlockChildren = node.querySelector('h1, h2, h3, h4, h5, h6, p, ul, ol, table, form, section, article, header, footer');

          if (!hasBlockChildren) {
            if (!node.hasAttribute('data-cms')) {
              var section = node.closest('section, header, footer, nav, [id], article, main, .hero-grid-layout, .w-layout-grid');
              var secName = 'gen';
              if (section) {
                secName = section.id || section.getAttribute('data-section') || (section.className ? String(section.className).split(' ')[0] : 'sec');
                secName = secName.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 16) || 'sec';
              }

              var counterKey = secName + '_' + tag;
              sectionCounters[counterKey] = (sectionCounters[counterKey] || 0) + 1;
              var key = 'textos.' + secName + '.' + tag + '_' + sectionCounters[counterKey];
              node.setAttribute('data-cms', key);
            }
          }
        }

        for (var j = 0; j < node.children.length; j++) {
          walk(node.children[j]);
        }
      }
    }

    if (document.body) {
      walk(document.body);
    }
  }

  function applyCmsData(c) {
    if (!c) return;

    // Asegurar que todos los elementos de la página tengan identificadores
    scanAndTagAllTextElements();

    // 1. Textos
    document.querySelectorAll('[data-cms]').forEach(function(el) {
      var key = el.getAttribute('data-cms');
      var val = getVal(key, c);
      if (typeof val === 'string' && val.trim() !== '') {
        var hasImg = el.querySelector('img, svg');
        if (!hasImg) {
          el.textContent = val;
        } else {
          for (var i = 0; i < el.childNodes.length; i++) {
            if (el.childNodes[i].nodeType === Node.TEXT_NODE && el.childNodes[i].nodeValue.trim()) {
              el.childNodes[i].nodeValue = val;
              break;
            }
          }
        }
      }
    });

    // 2. Enlaces (Href / WhatsApp / Teléfono)
    document.querySelectorAll('[data-cms-href]').forEach(function(el) {
      var key = el.getAttribute('data-cms-href');
      var val = getVal(key, c);
      if (typeof val === 'string' && val.trim() !== '') {
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
      if (val && typeof val === 'string') el.setAttribute('src', val);
    });

    // 4. Fondos CSS
    document.querySelectorAll('[data-cms-bg]').forEach(function(el) {
      var key = el.getAttribute('data-cms-bg');
      var val = getVal(key, c);
      if (val && typeof val === 'string') el.style.backgroundImage = 'url(' + val + ')';
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

    // 1. Escanear todo el texto de la página
    scanAndTagAllTextElements();

    // 2. Desactivar navegación nativa de enlaces para evitar saltos de pantalla
    document.querySelectorAll('a').forEach(function(a) {
      if (!a.hasAttribute('data-cms-orig-href')) {
        a.setAttribute('data-cms-orig-href', a.getAttribute('href') || '');
        a.setAttribute('href', 'javascript:void(0);');
      }
    });

    // 3. Inyectar estilos visuales del editor en la página
    var style = document.createElement('style');
    style.id = 'goglite-cms-editor-styles';
    style.textContent = [
      '.goglite-cms-field-hover {',
      '  outline: 2px dashed #FF6B00 !important;',
      '  outline-offset: 3px !important;',
      '  cursor: text !important;',
      '  transition: outline 0.1s ease !important;',
      '}',
      '.goglite-cms-field-active {',
      '  outline: 2px solid #22c55e !important;',
      '  outline-offset: 3px !important;',
      '  background-color: rgba(34, 197, 94, 0.08) !important;',
      '  border-radius: 4px !important;',
      '  cursor: text !important;',
      '}',
      '.goglite-cms-badge {',
      '  position: fixed !important;',
      '  background: #111827 !important;',
      '  color: #FF8A00 !important;',
      '  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;',
      '  font-size: 11px !important;',
      '  font-weight: 700 !important;',
      '  padding: 3px 10px !important;',
      '  border-radius: 6px !important;',
      '  border: 1px solid #FF8A00 !important;',
      '  z-index: 2147483647 !important;',
      '  pointer-events: auto !important;',
      '  box-shadow: 0 4px 16px rgba(0,0,0,0.5) !important;',
      '  display: flex !important;',
      '  align-items: center !important;',
      '  gap: 6px !important;',
      '  white-space: nowrap !important;',
      '}',
      '.goglite-cms-badge-btn {',
      '  background: #374151 !important;',
      '  color: #F9FAFB !important;',
      '  border: none !important;',
      '  border-radius: 3px !important;',
      '  padding: 1px 6px !important;',
      '  font-size: 10px !important;',
      '  cursor: pointer !important;',
      '}',
      '.goglite-cms-badge-btn:hover {',
      '  background: #4B5563 !important;',
      '}'
    ].join('\n');
    document.head.appendChild(style);

    var badge = document.createElement('div');
    badge.className = 'goglite-cms-badge';
    badge.style.display = 'none';
    document.body.appendChild(badge);

    function positionBadge(el, label, hasLink) {
      var rect = el.getBoundingClientRect();
      var top = rect.top - 30;
      if (top < 10) top = rect.bottom + 6;
      var left = Math.max(8, rect.left);

      var btnHtml = hasLink ? ' <button class="goglite-cms-badge-btn" id="goglite-btn-edit-link">🔗 Enlace</button>' : '';
      badge.innerHTML = '<span>✏️ ' + label + '</span>' + btnHtml;
      badge.style.top = top + 'px';
      badge.style.left = left + 'px';
      badge.style.display = 'flex';

      var linkBtn = document.getElementById('goglite-btn-edit-link');
      if (linkBtn) {
        linkBtn.onclick = function(e) {
          e.preventDefault();
          e.stopPropagation();
          var linkEl = el.closest('a') || el;
          var cur = linkEl.getAttribute('data-cms-orig-href') || linkEl.getAttribute('href') || '';
          var n = window.prompt('Ingresa la nueva URL o número de WhatsApp (+829...):', cur);
          if (n !== null && n.trim() !== '') {
            var val = n.trim();
            linkEl.setAttribute('data-cms-orig-href', val);
            var linkKey = el.getAttribute('data-cms') + '_href';
            if (window.parent && window.parent !== window) {
              window.parent.postMessage({
                type: 'GOGLITE_CMS_INLINE_CHANGE',
                key: linkKey,
                value: val
              }, '*');
            }
          }
        };
      }
    }

    // 4. Delegación de Eventos para Mouseover (Hover badge)
    document.addEventListener('mouseover', function(e) {
      if (!isEditorMode) return;
      var el = e.target.closest('[data-cms]');
      if (el) {
        if (document.activeElement === el) return;
        el.classList.add('goglite-cms-field-hover');
        var key = el.getAttribute('data-cms') || '';
        var label = key.replace('textos.', '').replace('hero.', '');
        var isLink = !!el.closest('a, button');
        positionBadge(el, label, isLink);
      }
    }, true);

    document.addEventListener('mouseout', function(e) {
      if (!isEditorMode) return;
      var el = e.target.closest('[data-cms]');
      if (el) {
        el.classList.remove('goglite-cms-field-hover');
        if (document.activeElement !== el) {
          if (e.relatedTarget && e.relatedTarget.closest('.goglite-cms-badge')) return;
          badge.style.display = 'none';
        }
      }
    }, true);

    // 5. Delegación de Clics: Activar contenteditable sin saltar de página
    document.addEventListener('click', function(e) {
      if (!isEditorMode) return;

      // Si hace clic en el botón del badge para editar el enlace
      if (e.target.closest('#goglite-btn-edit-link')) return;

      // Interceptar clics en enlaces o botones para evitar navegación
      var clickable = e.target.closest('a, button, [role="button"], input[type="submit"]');
      if (clickable) {
        e.preventDefault();
      }

      var el = e.target.closest('[data-cms]');
      if (el) {
        e.preventDefault();

        // Desactivar cualquier otro campo activo
        document.querySelectorAll('.goglite-cms-field-active').forEach(function(item) {
          if (item !== el) {
            item.removeAttribute('contenteditable');
            item.classList.remove('goglite-cms-field-active');
          }
        });

        // Activar modo texto puro (plaintext-only garantiza que no se altere HTML ni CSS)
        el.setAttribute('contenteditable', 'plaintext-only');
        el.classList.add('goglite-cms-field-active');
        el.classList.remove('goglite-cms-field-hover');
        badge.style.display = 'none';
        el.focus();

        try {
          var range = document.createRange();
          var sel = window.getSelection();
          range.selectNodeContents(el);
          range.collapse(false);
          sel.removeAllRanges();
          sel.addRange(range);
        } catch (err) {}
      }
    }, true);

    // 6. Focusout: Guardar el texto editado y notificar a la plataforma
    document.addEventListener('focusout', function(e) {
      var el = e.target.closest('[data-cms]');
      if (el && el.hasAttribute('contenteditable')) {
        el.removeAttribute('contenteditable');
        el.classList.remove('goglite-cms-field-active');
        badge.style.display = 'none';

        var key = el.getAttribute('data-cms');
        var newVal = (el.innerText || el.textContent || '').trim();

        if (window.parent && window.parent !== window) {
          window.parent.postMessage({
            type: 'GOGLITE_CMS_INLINE_CHANGE',
            key: key,
            value: newVal
          }, '*');
        }
      }
    }, true);

    // 7. Enter: Salir de edición en títulos, botones o líneas únicas
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Enter') {
        var el = document.activeElement;
        if (el && el.hasAttribute('contenteditable')) {
          var tag = el.tagName.toLowerCase();
          if (['h1','h2','h3','h4','h5','h6','button','a','span','label'].indexOf(tag) !== -1 || el.closest('a, button')) {
            e.preventDefault();
            el.blur();
          }
        }
      }
    }, true);

    // 8. Reportar elementos descubiertos a la plataforma
    var discoveredElements = [];
    document.querySelectorAll('[data-cms]').forEach(function(el) {
      discoveredElements.push({
        type: 'text',
        key: el.getAttribute('data-cms'),
        tag: el.tagName.toLowerCase(),
        text: (el.innerText || el.textContent || '').trim().slice(0, 80)
      });
    });

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
      setTimeout(enableInlineEditor, 300);
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
      toast.style.cssText = 'position:fixed;bottom:24px;right:24px;background:#10b981;color:white;padding:12px 20px;border-radius:8px;font-weight:bold;z-index:2147483647;box-shadow:0 8px 24px rgba(0,0,0,0.3);font-family:sans-serif;animation:fadeIn 0.3s ease;';
      toast.textContent = '✅ Cambios publicados en vivo con éxito';
      document.body.appendChild(toast);
      setTimeout(function() { toast.remove(); }, 3500);
    }
  });
})();
