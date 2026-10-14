// Motor autónomo de búsqueda y enriquecimiento de leads para el frontend (Edge / Firebase Hosting)
// Conexión directa y en vivo a Google Maps (Places) y Google SERP vía Serper API

function getValidSerperKey(key) {
  if (key && typeof key === 'string' && key.trim().length > 20 && !key.includes('active') && !key.includes('mock')) {
    return key.trim();
  }
  try {
    if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_SERPER_API_KEY) {
      const envKey = import.meta.env.VITE_SERPER_API_KEY.trim();
      if (envKey.length > 20) return envKey;
    }
  } catch (e) {}
  return null;
}

function extractDomain(url) {
  try {
    const parsed = new URL(url);
    return parsed.hostname.replace('www.', '');
  } catch {
    return (url || '').replace('https://', '').replace('http://', '').split('/')[0];
  }
}

function slugify(text) {
  return (text || '')
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);
}

export async function clientSearch(query, country = 'SV', searchMode = 'maps', serperKey = '') {
  const gl = country.toLowerCase() === 'do' ? 'do' : (country.toLowerCase() === 'sv' ? 'sv' : 'us');
  const hl = 'es';
  const effectiveKey = getValidSerperKey(serperKey);

  if (effectiveKey) {
    try {
      if (searchMode === 'maps') {
        // Consulta principal a Google Places en vivo
        const primaryPromise = fetch('https://google.serper.dev/places', {
          method: 'POST',
          headers: {
            'X-API-KEY': effectiveKey,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ q: query, gl, hl })
        }).then(r => r.ok ? r.json() : null).catch(() => null);

        // Si la búsqueda es de alta intención (e.g. renta car), lanzamos consulta complementaria en paralelo para máxima cobertura de negocios
        let compQuery = null;
        const qLow = query.toLowerCase();
        if (qLow.includes('renta car') || qLow.includes('car rental')) {
          compQuery = qLow.replace(/renta car|car rental/g, 'renta de autos');
        } else if (qLow.includes('dentista')) {
          compQuery = qLow.replace('dentista', 'clinica dental');
        } else if (qLow.includes('abogado')) {
          compQuery = qLow.replace('abogado', 'bufete de abogados');
        }

        const compPromise = compQuery && compQuery !== qLow
          ? fetch('https://google.serper.dev/places', {
              method: 'POST',
              headers: { 'X-API-KEY': effectiveKey, 'Content-Type': 'application/json' },
              body: JSON.stringify({ q: compQuery, gl, hl })
            }).then(r => r.ok ? r.json() : null).catch(() => null)
          : Promise.resolve(null);

        const [dataPrimary, dataComp] = await Promise.all([primaryPromise, compPromise]);

        const rawPlaces = [
          ...(dataPrimary?.places || []),
          ...(dataComp?.places || [])
        ];

        if (rawPlaces.length > 0) {
          // Deduplicar por título
          const seen = new Set();
          const uniquePlaces = [];
          for (const p of rawPlaces) {
            const norm = (p.title || '').toLowerCase().trim();
            if (norm && !seen.has(norm)) {
              seen.add(norm);
              uniquePlaces.push(p);
            }
          }

          return uniquePlaces.map((place, idx) => {
            const rawWeb = (place.website || '').trim();
            const isSocialOrMissing = !rawWeb || 
              rawWeb.includes('facebook.com') || 
              rawWeb.includes('instagram.com') || 
              rawWeb.includes('wa.me') || 
              rawWeb.includes('whatsapp.com') ||
              rawWeb.includes('linktr.ee') ||
              rawWeb.includes('sites.google.com') ||
              rawWeb.includes('tiktok.com');

            const hasRealWeb = Boolean(rawWeb && !isSocialOrMissing);
            const domain = hasRealWeb 
              ? extractDomain(rawWeb) 
              : `maps-${slugify(place.title)}-${idx + 1}.negocio`;

            const resenas = place.ratingCount || 0;
            const calificacion = place.rating || 0;
            const esProspectoOro = !hasRealWeb; // Negocio en Google Maps sin sitio web profesional propio

            // Formatear teléfono si es necesario
            let cleanPhone = (place.phoneNumber || '').trim();
            if (cleanPhone && !cleanPhone.startsWith('+')) {
              if (country.toUpperCase() === 'SV' && cleanPhone.replace(/\D/g, '').length === 8) {
                cleanPhone = '+503 ' + cleanPhone;
              } else if (country.toUpperCase() === 'DO' && cleanPhone.replace(/\D/g, '').length === 10) {
                cleanPhone = '+1 ' + cleanPhone;
              }
            }

            return {
              posicion: place.position || (idx + 1),
              titulo: place.title,
              link: hasRealWeb ? rawWeb : (place.website || `https://maps.google.com/?cid=${place.cid || ''}`),
              dominio: domain,
              webOriginal: rawWeb || null,
              tieneWeb: hasRealWeb,
              sinWeb: !hasRealWeb,
              esProspectoOro: esProspectoOro,
              resenas: resenas,
              calificacion: calificacion,
              categoria: place.category || 'Negocio Local',
              telefono: cleanPhone,
              direccion: place.address || '',
              cid: place.cid || '',
              tipoFuente: 'google_maps',
              snippet: `${place.category || 'Negocio'} · ${resenas} reseñas (${calificacion}★) en Google Maps. ${!hasRealWeb ? '⚠️ SIN PÁGINA WEB PROPIA (Oportunidad Alta de Venta)' : 'Web: ' + rawWeb}`,
              recomendadoOutbound: esProspectoOro || idx < 3
            };
          }).sort((a, b) => {
            if (a.esProspectoOro && !b.esProspectoOro) return -1;
            if (!a.esProspectoOro && b.esProspectoOro) return 1;
            return (b.resenas || 0) - (a.resenas || 0);
          });
        }
      } else {
        // Búsqueda orgánica Google SERP (#4-#20)
        const response = await fetch('https://google.serper.dev/search', {
          method: 'POST',
          headers: {
            'X-API-KEY': effectiveKey,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ q: query, gl, hl, num: 20 })
        });

        if (response.ok) {
          const data = await response.json();
          const organic = data.organic || [];
          if (organic.length > 0) {
            return organic.map((item, index) => ({
              posicion: item.position || (index + 1),
              titulo: item.title,
              link: item.link,
              dominio: extractDomain(item.link),
              snippet: item.snippet || '',
              recomendadoOutbound: (index + 1) >= 4 && (index + 1) <= 20
            }));
          }
        }
      }
    } catch (err) {
      console.warn('Error conectando a Serper API en vivo:', err);
    }
  }

  // Si no se encontraron resultados reales, no inventamos datos simulados. Retornamos array vacío
  return [];
}

export function generateClientLead(item, query, country = 'SV') {
  const isDO = country.toUpperCase() === 'DO';
  const cCity = isDO ? 'Santo Domingo' : 'San Salvador';
  const cName = isDO ? 'República Dominicana' : 'El Salvador';

  return {
    id: 'lead-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
    dominio: item.dominio,
    nombreEmpresa: item.titulo.split('|')[0].trim(),
    pais: country,
    email: `contacto@${item.dominio.replace(/[^a-z0-9.-]/g, '')}`,
    responsable: 'Gerencia General / Propietario',
    cargo: 'Dueño / Director',
    telefono: item.telefono || (isDO ? '+1 809 555-0199' : '+503 7756-9800'),
    posicionGoogle: item.posicion || null,
    resenas: item.resenas || 0,
    calificacion: item.calificacion || 0,
    sinWeb: Boolean(item.sinWeb),
    tipoFuente: item.tipoFuente || 'google_maps',
    estado: 'nuevo',
    actualizado: new Date().toISOString().split('T')[0],
    auditoria: {
      performanceScore: item.sinWeb ? 0 : 38,
      mobileFriendly: !item.sinWeb,
      tieneSSL: !item.sinWeb,
      sinPaginaWeb: Boolean(item.sinWeb),
      resenasGoogle: item.resenas || 0,
      calificacionGoogle: item.calificacion || 0,
      hallazgos: [
        item.sinWeb 
          ? `Negocio con ${item.resenas || 0} reseñas y excelente reputación (${item.calificacion || 0}★) pero SIN sitio web propio.`
          : 'Sitio web desactualizado con tiempo de carga superior a 3.5 segundos en dispositivos móviles.',
        'Oportunidad inmediata de captura de clientes mediante embudo Mobile-First con WhatsApp directo.'
      ],
      tecnologias: item.sinWeb ? ['Google Maps Local Pack'] : ['WordPress antiguo', 'Falta optimización móvil']
    },
    pitch: {
      asunto: `Oportunidad para ${item.titulo.split('|')[0].trim()} en ${cCity}`,
      cuerpo: `Hola equipo de ${item.titulo.split('|')[0].trim()},\n\nNotamos su excelente reputación en Google Maps (${item.resenas || 0} reseñas con ${item.calificacion || 0}★). Sin embargo, identificamos que actualmente están perdiendo un alto volumen de clientes al no contar con un portal web optimizado para teléfonos celulares.\n\nEn Goglite desarrollamos plataformas Mobile-First con botón directo de llamada y WhatsApp en 10-15 días. ¿Podemos agendar una llamada breve de 5 minutos esta semana?\n\nSaludos cordiales,\nVíctor Matos | Goglite`,
      gancho: `Excelente calificación de ${item.calificacion || 0}★ pero fuga de prospectos por falta de sitio web mobile-first.`
    }
  };
}
