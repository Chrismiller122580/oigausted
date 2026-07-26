import { COLOMBIA_CITIES, normalizeCityName, type ColombiaCity } from '@/lib/colombia-cities'
import type { CityDocProfile } from './types'

const DEFAULT_DISCLAIMER =
  'Este documento es una plantilla de apoyo generada por OigaGIG. No constituye asesoría legal. El traspaso formal se realiza ante la autoridad de tránsito / RUNT y, cuando aplique, notaría. Verifica requisitos vigentes en tu ciudad.'

/** City-specific transit agency and tax wording for vehicle sale paperwork. */
const CITY_OVERRIDES: Record<
  string,
  Partial<Pick<CityDocProfile, 'transitAgency' | 'taxClearanceLabel' | 'extraSteps'>>
> = {
  bogota: {
    transitAgency: 'Secretaría Distrital de Movilidad de Bogotá (SDM) / RUNT',
    taxClearanceLabel: 'Paz y salvo de impuestos del vehículo (Bogotá / Secretaría de Hacienda)',
    extraSteps: [
      'Consulta el impuesto vehicular en la Secretaría de Hacienda de Bogotá.',
      'Agenda el trámite de traspaso según lineamientos de la SDM / organismo de tránsito.',
    ],
  },
  medellin: {
    transitAgency: 'Secretaría de Movilidad de Medellín / Área Metropolitana / RUNT',
    taxClearanceLabel: 'Paz y salvo de impuestos del vehículo (Medellín / Antioquia)',
    extraSteps: [
      'Verifica impuestos municipales y departamentales según el lugar de matrícula.',
      'Confirma citas o ventanillas en la Secretaría de Movilidad de Medellín.',
    ],
  },
  cali: {
    transitAgency: 'Secretaría de Movilidad de Cali / RUNT',
    taxClearanceLabel: 'Paz y salvo de impuestos del vehículo (Cali / Valle del Cauca)',
    extraSteps: ['Revisa requisitos de la Secretaría de Movilidad de Santiago de Cali.'],
  },
  barranquilla: {
    transitAgency: 'Secretaría de Tránsito y Seguridad Vial de Barranquilla / RUNT',
    taxClearanceLabel: 'Paz y salvo de impuestos del vehículo (Barranquilla / Atlántico)',
    extraSteps: [],
  },
  cartagena: {
    transitAgency: 'Departamento Administrativo de Tránsito y Transporte (DATT) Cartagena / RUNT',
    taxClearanceLabel: 'Paz y salvo de impuestos del vehículo (Cartagena / Bolívar)',
    extraSteps: [],
  },
  bucaramanga: {
    transitAgency: 'Área Metropolitana de Bucaramanga (AMB) – Tránsito / RUNT',
    taxClearanceLabel: 'Paz y salvo de impuestos del vehículo (Bucaramanga / Santander)',
    extraSteps: [
      'Para el área metropolitana (Bucaramanga, Floridablanca, Girón, Piedecuesta), confirma en AMB el organismo competente.',
    ],
  },
  floridablanca: {
    transitAgency: 'Área Metropolitana de Bucaramanga (AMB) – Tránsito / RUNT',
    taxClearanceLabel: 'Paz y salvo de impuestos del vehículo (Floridablanca / Santander)',
    extraSteps: ['Trámites de traspaso del área metropolitana suelen gestionarse vía AMB.'],
  },
  giron: {
    transitAgency: 'Área Metropolitana de Bucaramanga (AMB) – Tránsito / RUNT',
    taxClearanceLabel: 'Paz y salvo de impuestos del vehículo (Girón / Santander)',
    extraSteps: [],
  },
  piedecuesta: {
    transitAgency: 'Área Metropolitana de Bucaramanga (AMB) – Tránsito / RUNT',
    taxClearanceLabel: 'Paz y salvo de impuestos del vehículo (Piedecuesta / Santander)',
    extraSteps: [],
  },
  cucuta: {
    transitAgency: 'Instituto de Tránsito y Transporte de Cúcuta / RUNT',
    taxClearanceLabel: 'Paz y salvo de impuestos del vehículo (Cúcuta / Norte de Santander)',
    extraSteps: [],
  },
  pereira: {
    transitAgency: 'Secretaría de Movilidad de Pereira / RUNT',
    taxClearanceLabel: 'Paz y salvo de impuestos del vehículo (Pereira / Risaralda)',
    extraSteps: [],
  },
  manizales: {
    transitAgency: 'Secretaría de Tránsito de Manizales / RUNT',
    taxClearanceLabel: 'Paz y salvo de impuestos del vehículo (Manizales / Caldas)',
    extraSteps: [],
  },
}

function baseProfile(city: Pick<ColombiaCity, 'id' | 'label' | 'region'>): CityDocProfile {
  const override = CITY_OVERRIDES[city.id] || {}
  return {
    cityId: city.id,
    cityLabel: city.label,
    region: city.region,
    transitAgency:
      override.transitAgency ||
      `Organismo de tránsito de ${city.label} (o del municipio de matrícula) / RUNT`,
    taxClearanceLabel:
      override.taxClearanceLabel ||
      `Paz y salvo de impuestos del vehículo (${city.label}${city.region ? ` / ${city.region}` : ''})`,
    extraSteps: override.extraSteps || [],
    disclaimer: DEFAULT_DISCLAIMER,
  }
}

export function getNationalFallbackProfile(cityLabel = 'Colombia'): CityDocProfile {
  return {
    cityId: 'national',
    cityLabel,
    region: undefined,
    transitAgency: 'Organismo de tránsito del municipio de matrícula / RUNT nacional',
    taxClearanceLabel: 'Paz y salvo de impuestos del vehículo (municipio / departamento de matrícula)',
    extraSteps: [
      'Confirma el organismo de tránsito y requisitos exactos del municipio donde está matriculado el vehículo.',
    ],
    disclaimer: DEFAULT_DISCLAIMER,
  }
}

export function getCityDocProfile(cityIdOrLabel?: string | null): CityDocProfile {
  if (!cityIdOrLabel?.trim()) return getNationalFallbackProfile()

  const raw = cityIdOrLabel.trim()
  const byId = COLOMBIA_CITIES.find((c) => c.id === raw.toLowerCase() || c.id === raw)
  if (byId) return baseProfile(byId)

  const normalized = normalizeCityName(raw)
  if (normalized) return baseProfile(normalized)

  return getNationalFallbackProfile(raw)
}
