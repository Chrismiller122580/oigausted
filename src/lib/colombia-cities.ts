/** Client-safe Colombia city data — no Prisma/server imports. */

export type ColombiaCity = {
  id: string;
  label: string;
  slug: string;
  region: string;
  aliases: string[];
  lat?: number;
  lng?: number;
};

/** Capitals + major metros (~35) for marketing segmentation nationwide. */
export const COLOMBIA_CITIES: ColombiaCity[] = [
  { id: 'bogota', label: 'Bogotá', slug: 'Bogotá', region: 'Centro', aliases: ['bogota', 'santa fe de bogota'], lat: 4.711, lng: -74.0721 },
  { id: 'medellin', label: 'Medellín', slug: 'Medellín', region: 'Antioquia', aliases: ['medellin'], lat: 6.2476, lng: -75.5658 },
  { id: 'cali', label: 'Cali', slug: 'Cali', region: 'Valle del Cauca', aliases: ['santiago de cali'], lat: 3.4516, lng: -76.532 },
  { id: 'barranquilla', label: 'Barranquilla', slug: 'Barranquilla', region: 'Atlántico', aliases: [], lat: 10.9639, lng: -74.7964 },
  { id: 'cartagena', label: 'Cartagena', slug: 'Cartagena', region: 'Bolívar', aliases: ['cartagena de indias'], lat: 10.391, lng: -75.4794 },
  { id: 'bucaramanga', label: 'Bucaramanga', slug: 'Bucaramanga', region: 'Santander', aliases: ['bga', 'b/manga'], lat: 7.1193, lng: -73.1227 },
  { id: 'floridablanca', label: 'Floridablanca', slug: 'Floridablanca', region: 'Santander', aliases: ['flori'], lat: 7.062, lng: -73.086 },
  { id: 'giron', label: 'Girón', slug: 'Girón', region: 'Santander', aliases: ['giron'], lat: 7.073, lng: -73.168 },
  { id: 'piedecuesta', label: 'Piedecuesta', slug: 'Piedecuesta', region: 'Santander', aliases: [], lat: 6.988, lng: -73.048 },
  { id: 'cucuta', label: 'Cúcuta', slug: 'Cúcuta', region: 'Norte de Santander', aliases: ['cucuta', 'san jose de cucuta'], lat: 7.8939, lng: -72.5078 },
  { id: 'pereira', label: 'Pereira', slug: 'Pereira', region: 'Risaralda', aliases: [], lat: 4.8133, lng: -75.6961 },
  { id: 'manizales', label: 'Manizales', slug: 'Manizales', region: 'Caldas', aliases: [], lat: 5.0703, lng: -75.5138 },
  { id: 'ibague', label: 'Ibagué', slug: 'Ibagué', region: 'Tolima', aliases: ['ibague'], lat: 4.4389, lng: -75.2322 },
  { id: 'pasto', label: 'Pasto', slug: 'Pasto', region: 'Nariño', aliases: ['san juan de pasto'], lat: 1.2136, lng: -77.2811 },
  { id: 'villavicencio', label: 'Villavicencio', slug: 'Villavicencio', region: 'Meta', aliases: [], lat: 4.142, lng: -73.6266 },
  { id: 'monteria', label: 'Montería', slug: 'Montería', region: 'Córdoba', aliases: ['monteria'], lat: 8.748, lng: -75.8814 },
  { id: 'valledupar', label: 'Valledupar', slug: 'Valledupar', region: 'Cesar', aliases: [], lat: 10.4631, lng: -73.2532 },
  { id: 'neiva', label: 'Neiva', slug: 'Neiva', region: 'Huila', aliases: [], lat: 2.9273, lng: -75.2819 },
  { id: 'popayan', label: 'Popayán', slug: 'Popayán', region: 'Cauca', aliases: ['popayan'], lat: 2.4448, lng: -76.6147 },
  { id: 'armenia', label: 'Armenia', slug: 'Armenia', region: 'Quindío', aliases: [], lat: 4.5339, lng: -75.6811 },
  { id: 'santa-marta', label: 'Santa Marta', slug: 'Santa Marta', region: 'Magdalena', aliases: [], lat: 11.2408, lng: -74.199 },
  { id: 'sincelejo', label: 'Sincelejo', slug: 'Sincelejo', region: 'Sucre', aliases: [], lat: 9.3047, lng: -75.3978 },
  { id: 'tunja', label: 'Tunja', slug: 'Tunja', region: 'Boyacá', aliases: [], lat: 5.5353, lng: -73.3678 },
  { id: 'riohacha', label: 'Riohacha', slug: 'Riohacha', region: 'La Guajira', aliases: [], lat: 11.5444, lng: -72.9072 },
  { id: 'quibdo', label: 'Quibdó', slug: 'Quibdó', region: 'Chocó', aliases: ['quibdo'], lat: 5.6947, lng: -76.6611 },
  { id: 'florencia', label: 'Florencia', slug: 'Florencia', region: 'Caquetá', aliases: [], lat: 1.6144, lng: -75.6062 },
  { id: 'yopal', label: 'Yopal', slug: 'Yopal', region: 'Casanare', aliases: [], lat: 5.3378, lng: -72.3959 },
  { id: 'arauca', label: 'Arauca', slug: 'Arauca', region: 'Arauca', aliases: [], lat: 7.0903, lng: -70.7617 },
  { id: 'mocoa', label: 'Mocoa', slug: 'Mocoa', region: 'Putumayo', aliases: [], lat: 1.1528, lng: -76.6528 },
  { id: 'leticia', label: 'Leticia', slug: 'Leticia', region: 'Amazonas', aliases: [], lat: -4.2153, lng: -69.9406 },
  { id: 'san-andres', label: 'San Andrés', slug: 'San Andrés', region: 'Archipiélago', aliases: ['san andres'], lat: 12.5847, lng: -81.7006 },
  { id: 'mitu', label: 'Mitú', slug: 'Mitú', region: 'Vaupés', aliases: ['mitu'], lat: 1.1983, lng: -70.1733 },
  { id: 'inirida', label: 'Inírida', slug: 'Inírida', region: 'Guainía', aliases: ['inirida'], lat: 3.8653, lng: -67.9239 },
  { id: 'puerto-carreno', label: 'Puerto Carreño', slug: 'Puerto Carreño', region: 'Vichada', aliases: ['puerto carreno'], lat: 6.189, lng: -67.4858 },
  { id: 'soacha', label: 'Soacha', slug: 'Soacha', region: 'Cundinamarca', aliases: [], lat: 4.5791, lng: -74.2168 },
  { id: 'bello', label: 'Bello', slug: 'Bello', region: 'Antioquia', aliases: [], lat: 6.3369, lng: -75.5577 },
  { id: 'envigado', label: 'Envigado', slug: 'Envigado', region: 'Antioquia', aliases: [], lat: 6.1706, lng: -75.5856 },
];

export const COLOMBIA_NATIONAL_SCOPE = 'Todo Colombia';

const CITY_BY_LABEL_LOWER = new Map(
  COLOMBIA_CITIES.flatMap((c) => [
    [c.label.toLowerCase(), c] as const,
    [c.slug.toLowerCase(), c] as const,
    ...c.aliases.map((a) => [a.toLowerCase(), c] as const),
  ]),
);

function stripAccents(s: string): string {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

export function normalizeCityName(input: string): ColombiaCity | null {
  const trimmed = (input || '').trim();
  if (!trimmed || trimmed.toLowerCase() === COLOMBIA_NATIONAL_SCOPE.toLowerCase()) return null;

  const lower = stripAccents(trimmed.toLowerCase());
  const exact = CITY_BY_LABEL_LOWER.get(lower);
  if (exact) return exact;

  for (const city of COLOMBIA_CITIES) {
    const labelLower = stripAccents(city.label.toLowerCase());
    if (lower.includes(labelLower) || labelLower.includes(lower)) return city;
    for (const alias of city.aliases) {
      const aliasLower = stripAccents(alias.toLowerCase());
      if (lower.includes(aliasLower) || aliasLower.includes(lower)) return city;
    }
  }
  return null;
}

export function matchCityInText(text: string): ColombiaCity | null {
  const lower = stripAccents((text || '').toLowerCase());
  let best: ColombiaCity | null = null;
  let bestLen = 0;

  for (const city of COLOMBIA_CITIES) {
    const candidates = [city.label, city.slug, ...city.aliases].map((s) =>
      stripAccents(s.toLowerCase()),
    );
    for (const c of candidates) {
      if (c.length >= 3 && lower.includes(c) && c.length > bestLen) {
        best = city;
        bestLen = c.length;
      }
    }
  }
  return best;
}

export function getCityById(id: string): ColombiaCity | undefined {
  return COLOMBIA_CITIES.find((c) => c.id === id);
}

export function citiesByRegion(): Record<string, ColombiaCity[]> {
  const groups: Record<string, ColombiaCity[]> = {};
  for (const city of COLOMBIA_CITIES) {
    if (!groups[city.region]) groups[city.region] = [];
    groups[city.region].push(city);
  }
  return groups;
}

export const colombianCitiesLegacy = COLOMBIA_CITIES.filter((c) => c.lat != null).map((c) => ({
  id: c.id,
  label: c.label,
  slug: c.slug,
  lat: c.lat!,
  lng: c.lng!,
}));