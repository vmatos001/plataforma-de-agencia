// Service for On-Page Semantic Analysis, Local GEO Prominence & Schema JSON-LD Generator ($0 USD Rank Math Pro alternative)

export function analyzeOnPageSeo({ title, metaDescription, h1, content, focusKeyword, country, city }) {
  const kw = (focusKeyword || '').toLowerCase().trim();
  const t = (title || '').trim();
  const desc = (metaDescription || '').trim();
  const header = (h1 || '').trim();
  const text = (content || '').trim();
  const lowerText = text.toLowerCase();

  const words = text ? text.split(/\s+/).filter(Boolean) : [];
  const wordCount = words.length;

  // Keyword occurrences
  const regexKw = kw ? new RegExp(`\\b${escapeRegExp(kw)}\\b`, 'gi') : null;
  const kwInContent = regexKw && text ? (text.match(regexKw) || []).length : 0;
  const density = wordCount > 0 ? ((kwInContent / wordCount) * 100).toFixed(1) : 0;

  // Title checks
  const titleHasKw = kw ? t.toLowerCase().includes(kw) : false;
  const titleLength = t.length;
  const titleScore = (titleLength >= 40 && titleLength <= 65 && titleHasKw) ? 100 : (titleHasKw ? 75 : 30);

  // Description checks
  const descHasKw = kw ? desc.toLowerCase().includes(kw) : false;
  const descLength = desc.length;
  const descScore = (descLength >= 120 && descLength <= 165 && descHasKw) ? 100 : (descHasKw ? 70 : 25);

  // H1 checks
  const h1HasKw = kw ? header.toLowerCase().includes(kw) : false;

  // GEO Prominence
  const targetCity = (city || (country === 'DO' ? 'Santo Domingo' : 'San Salvador')).toLowerCase();
  const geoMentionInTitle = t.toLowerCase().includes(targetCity);
  const geoMentionInDesc = desc.toLowerCase().includes(targetCity);
  const geoMentionInContent = lowerText.includes(targetCity);
  const hasPhone = /(\+?[0-9]{3}[ -]?[0-9]{4}[ -]?[0-9]{4}|\+?[0-9]{1,3}[ -]?\(?[0-9]{3}\)?[ -]?[0-9]{3}[ -]?[0-9]{4})/.test(text);

  // Detailed Checklist Points
  const checks = [
    {
      id: 'kw_in_title',
      title: 'Palabra clave en el Título SEO',
      status: titleHasKw ? 'pass' : 'fail',
      msg: titleHasKw ? 'Excelente: La palabra clave aparece en el título principal.' : 'Falta: Agrega la palabra clave objetivo al inicio del Title.'
    },
    {
      id: 'title_length',
      title: 'Longitud del Título (40-65 caracteres)',
      status: (titleLength >= 40 && titleLength <= 65) ? 'pass' : 'warn',
      msg: `Actual: ${titleLength} caracteres. ${titleLength < 40 ? 'Demasiado corto.' : titleLength > 65 ? 'Demasiado largo (Google podría truncarlo).' : 'Longitud óptima.'}`
    },
    {
      id: 'kw_in_desc',
      title: 'Palabra clave en Meta Descripción',
      status: descHasKw ? 'pass' : 'fail',
      msg: descHasKw ? 'Excelente: La meta descripción incluye la palabra clave.' : 'Falta: Incluye la palabra clave para mejorar el Click-Through Rate.'
    },
    {
      id: 'desc_length',
      title: 'Longitud de Meta Descripción (120-165 caracteres)',
      status: (descLength >= 120 && descLength <= 165) ? 'pass' : 'warn',
      msg: `Actual: ${descLength} caracteres. ${descLength < 120 ? 'Agrega más argumentos de valor.' : descLength > 165 ? 'Podría cortarse en resultados móviles.' : 'Longitud óptima para snippets.'}`
    },
    {
      id: 'kw_in_h1',
      title: 'Palabra clave en Encabezado H1',
      status: h1HasKw ? 'pass' : 'fail',
      msg: h1HasKw ? 'Correcto: El encabezado H1 comunica la intención exacta.' : 'Falta: El H1 debe contener tu palabra clave principal.'
    },
    {
      id: 'kw_density',
      title: 'Densidad de Palabra Clave (1.0% - 2.5%)',
      status: (density >= 1.0 && density <= 2.8) ? 'pass' : (density > 2.8 ? 'warn' : 'fail'),
      msg: `Densidad actual: ${density}% (${kwInContent} repeticiones en ${wordCount} palabras).`
    },
    {
      id: 'content_length',
      title: 'Volumen de Contenido Principal',
      status: wordCount >= 300 ? 'pass' : 'warn',
      msg: `Total: ${wordCount} palabras. ${wordCount < 300 ? 'Recomendado al menos 350 palabras para rankear sobre la competencia.' : 'Volumen competitivo.'}`
    },
    {
      id: 'geo_city_mention',
      title: `Prominencia Geográfica Local (${city || targetCity})`,
      status: (geoMentionInTitle || geoMentionInContent) ? 'pass' : 'fail',
      msg: (geoMentionInTitle || geoMentionInContent) 
        ? `Detectada mención geográfica explícita de ${city || targetCity}.` 
        : `Crucial para SEO local: menciona explícitamente "${city || targetCity}" en el texto y عنوان.`
    },
    {
      id: 'geo_phone_contact',
      title: 'Visibilidad de Teléfono / WhatsApp Local (NAP)',
      status: hasPhone ? 'pass' : 'warn',
      msg: hasPhone ? 'Teléfono comercial identificado para contacto inmediato.' : 'Agrega un número local con código de país para aumentar la confianza y citación de IA.'
    }
  ];

  // Calculate Overall Rank Math-like Score (0 to 100)
  const passCount = checks.filter(c => c.status === 'pass').length;
  const warnCount = checks.filter(c => c.status === 'warn').length;
  const overallScore = Math.min(100, Math.round(((passCount * 11) + (warnCount * 5))));

  return {
    score: overallScore,
    metrics: {
      wordCount,
      kwOccurrences: kwInContent,
      keywordDensity: Number(density),
      titleLength,
      descLength
    },
    checks,
    lsiSuggestions: generateLsiKeywords(focusKeyword, country, city)
  };
}

export function generateLsiKeywords(keyword, country, city) {
  const base = keyword ? keyword.toLowerCase() : 'servicios web';
  const loc = city || (country === 'DO' ? 'Santo Domingo' : 'San Salvador');

  return [
    `mejores ${base} en ${loc}`,
    `precios de ${base} 2026`,
    `${base} cerca de mí`,
    `opiniones y reseñas de ${base}`,
    `contacto WhatsApp ${base} ${loc}`,
    `${base} atención 24 horas y cotización rápida`
  ];
}

export function generateSchemaJsonLd({ type, name, description, url, phone, address, country, city, faqs }) {
  const isSV = country === 'SV';
  const defaultCity = city || (isSV ? 'San Salvador' : 'Santo Domingo');
  const defaultCountryCode = isSV ? 'SV' : 'DO';

  const schema = {
    '@context': 'https://schema.org',
    '@type': type || 'LocalBusiness',
    name: name || 'Empresa Local',
    description: description || 'Servicios profesionales de alta calidad con atención personalizada.',
    url: url || 'https://empresa.com',
    telephone: phone || (isSV ? '+503 7000 0000' : '+1 809 555 0100'),
    priceRange: '$$',
    address: {
      '@type': 'PostalAddress',
      streetAddress: address || (isSV ? 'Colonia Escalón' : 'Avenida Winston Churchill, Piantini'),
      addressLocality: defaultCity,
      addressRegion: defaultCity,
      addressCountry: defaultCountryCode
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: isSV ? 13.6929 : 18.4861,
      longitude: isSV ? -89.2182 : -69.9312
    },
    openingHoursSpecification: [
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
        opens: '08:00',
        closes: '18:00'
      }
    ]
  };

  if (Array.isArray(faqs) && faqs.length > 0) {
    const faqSchema = {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faqs.map(f => ({
        '@type': 'Question',
        name: f.pregunta,
        acceptedAnswer: {
          '@type': 'Answer',
          text: f.respuesta
        }
      }))
    };
    return { localBusiness: schema, faqPage: faqSchema };
  }

  return { localBusiness: schema };
}

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
