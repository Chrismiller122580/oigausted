import {
  normalizeSearchText,
  textIncludes,
  tokenizeQuery,
  isNearMeLocation,
  isRemoteQuery,
  cityMatchesFilter,
  gigMatchesSearch,
  scoreGigRelevance,
  compareByRelevance,
  type SearchableGig,
} from '../../src/lib/search-text'

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg)
}

// --- normalize / includes ---
assert(normalizeSearchText('Plomería') === 'plomeria', 'strip accent plomería')
assert(normalizeSearchText('  Bogotá  ') === 'bogota', 'strip accent Bogotá + trim')
assert(textIncludes('Servicio de plomería residencial', 'plomeria'), 'accent-insensitive includes')
assert(textIncludes('Bogotá', 'bogota'), 'Bogotá matches bogota')
assert(!textIncludes('Limpieza', 'plomeria'), 'non-match')

// --- tokenize ---
assert(
  JSON.stringify(tokenizeQuery('plomería y limpieza')) === JSON.stringify(['plomeria', 'limpieza']),
  'tokenize multi-word',
)

// --- near me / remote ---
assert(isNearMeLocation('Cerca de mí') === true, 'cerca de mí')
assert(isNearMeLocation('cerca de mi') === true, 'cerca de mi no accent')
assert(isNearMeLocation('Bogotá') === false, 'bogota not near me')
assert(isRemoteQuery('servicios remoto') === true, 'remote token')
assert(isRemoteQuery('online') === true, 'online')
assert(isRemoteQuery('plomería') === false, 'plomeria not remote')

// --- fixtures ---
const plumberBogota: SearchableGig = {
  title: 'Plomería a domicilio',
  description: 'Reparaciones de grifos y cañerías',
  category: 'Plomería y Fontanería',
  city: 'Bogotá',
  isRemote: false,
  createdAt: new Date().toISOString(),
  seller: {
    name: 'Carlos',
    businessName: 'AquaFix Bogotá',
    city: 'Bogotá',
    rating: 4.8,
    reviewCount: 12,
  },
}

const designRemote: SearchableGig = {
  title: 'Diseño de logos profesional',
  description: 'Identidad de marca para startups',
  category: 'Diseño Gráfico y Logos',
  city: null,
  isRemote: true,
  createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString(),
  seller: {
    name: 'Ana',
    businessName: 'Pixel Studio',
    city: 'Medellín',
    rating: 5,
    reviewCount: 3,
  },
}

const cleaningMedellin: SearchableGig = {
  title: 'Limpieza de oficinas',
  description: 'Equipos con experiencia corporativa',
  category: 'Limpieza de Hogar y Oficinas',
  city: 'Medellín',
  isRemote: false,
  seller: { businessName: 'CleanPro', city: 'Medellín', rating: 4, reviewCount: 2 },
}

// --- multi-field match ---
assert(gigMatchesSearch(plumberBogota, 'plomeria') === true, 'match title accent fold')
assert(gigMatchesSearch(plumberBogota, 'fontaneria') === true, 'match category token')
assert(gigMatchesSearch(plumberBogota, 'AquaFix') === true, 'match business name')
assert(gigMatchesSearch(plumberBogota, 'Carlos') === true, 'match seller name')
assert(gigMatchesSearch(plumberBogota, 'diseño logo') === false, 'no false positive')
assert(gigMatchesSearch(designRemote, 'remoto') === true, 'remote keyword')
assert(gigMatchesSearch(designRemote, 'logos') === true, 'design logos')
assert(gigMatchesSearch(plumberBogota, '') === true, 'empty query matches all')

// --- city filter ---
assert(cityMatchesFilter(plumberBogota, 'Bogotá') === true, 'city exact')
assert(cityMatchesFilter(plumberBogota, 'Bogota') === true, 'city no accent')
assert(cityMatchesFilter(plumberBogota, 'Medellín') === false, 'wrong city')
assert(cityMatchesFilter(designRemote, 'Medellín') === true, 'seller city fallback')
assert(cityMatchesFilter(plumberBogota, 'Cerca de mí') === true, 'near me skips city filter')
assert(cityMatchesFilter(plumberBogota, '') === true, 'empty city filter')

// --- relevance ---
const titleHit = scoreGigRelevance(plumberBogota, 'plomeria')
const weakHit = scoreGigRelevance(cleaningMedellin, 'plomeria')
assert(titleHit > weakHit, 'title match scores higher than non-match')
assert(scoreGigRelevance(designRemote, 'logo') > scoreGigRelevance(plumberBogota, 'logo'), 'logo prefers design gig')

const sorted = [cleaningMedellin, plumberBogota, designRemote].sort((a, b) =>
  compareByRelevance(a, b, 'plomeria'),
)
assert(sorted[0] === plumberBogota, 'plomeria sorts plumber first')

const remoteSorted = [plumberBogota, designRemote].sort((a, b) =>
  compareByRelevance(a, b, 'remoto logo'),
)
assert(remoteSorted[0] === designRemote, 'remote+logo prefers design remote')

console.log('search-text.test.ts OK')
