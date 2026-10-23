/**
 * Goglite Headless CMS — Universal Client Script (v1.1.0)
 * Ultra-rápido, tolerante a fallos, 0ms en visitas recurrentes con caché local.
 * Conectado en tiempo real a Google Cloud Firestore REST API.
 */
(function() {
  var scriptTag = document.currentScript || (function() {
    var scripts = document.getElementsByTagName('script');
    return scripts[scripts.length - 1];
  })();

  var siteSlug = (scriptTag && scriptTag.getAttribute('data-site')) || 'goglite';
  var apiUrl = (scriptTag && scriptTag.getAttribute('data-api')) || 'https://goglite-agency.web.app';
  var cacheKey = 'goglite_cms_' + siteSlug;

  function getVal(path, obj) {
    if (!path || !obj) return '';
    return path.split('.').reduce(function(o, k) {
      return (o && typeof o[k] !== 'undefined') ? o[k] : '';
    }, obj);
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

    // Disparar evento para scripts del cliente
    window.dispatchEvent(new CustomEvent('goglite_cms_applied', { detail: c }));
    console.log('[Goglite CMS] Contenido sincronizado con éxito para:', siteSlug);
  }

  // A. Carga instantánea desde caché local si existe
  try {
    var cached = localStorage.getItem(cacheKey);
    if (cached) {
      applyCmsData(JSON.parse(cached));
    }
  } catch (e) {}

  // Parseador ligero para documentos de Google Cloud Firestore REST API
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
            // Documento proveniente de Google Cloud Firestore
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

  // C. Listener para previsualización en vivo desde el CMS en tiempo real
  window.addEventListener('message', function(event) {
    if (event.data && event.data.type === 'GOGLITE_CMS_LIVE_PREVIEW') {
      applyCmsData(event.data.content);
    }
  });
})();
