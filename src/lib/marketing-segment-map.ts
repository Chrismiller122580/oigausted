const KNOWN_CITIES = [
  'bucaramanga',
  'floridablanca',
  'girón',
  'giron',
  'piedecuesta',
  'bogotá',
  'bogota',
  'medellín',
  'medellin',
  'cali',
  'barranquilla',
  'cartagena',
];

const CITY_DISPLAY: Record<string, string> = {
  bucaramanga: 'Bucaramanga',
  floridablanca: 'Floridablanca',
  girón: 'Girón',
  giron: 'Girón',
  piedecuesta: 'Piedecuesta',
  bogotá: 'Bogotá',
  bogota: 'Bogotá',
  medellín: 'Medellín',
  medellin: 'Medellín',
  cali: 'Cali',
  barranquilla: 'Barranquilla',
  cartagena: 'Cartagena',
};

export function mapRecommendedSegment(text: string): { segment: string; city?: string } {
  const lower = text.toLowerCase();

  let segment = 'all';
  if (/\b(inactiv|dormant|churn)\w*/.test(lower)) segment = 'inactive';
  else if (/\b(comprador|buyer)\w*/.test(lower)) segment = 'buyers';
  else if (/\b(vendedor|seller|freelanc)\w*/.test(lower)) segment = 'sellers';
  else if (/\b(admin)\w*/.test(lower)) segment = 'admins';
  else if (/\b(activ|recient|engag)\w*/.test(lower)) segment = 'active';

  let city: string | undefined;
  for (const c of KNOWN_CITIES) {
    if (lower.includes(c)) {
      city = CITY_DISPLAY[c] ?? c.charAt(0).toUpperCase() + c.slice(1);
      break;
    }
  }

  return { segment, city };
}