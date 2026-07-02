import type { DynamicFieldDef } from '@/types/gig-fields'

export const DOCUMENT_CATEGORY_NAME = 'Buro de Documentos — Presentado por OigaGIG'
export const CUSTOM_TEMPLATE_ID = 'custom'

export interface ColombianDocumentTemplate {
  id: string
  name: string
  description: string
  icon: string
  categoryHint: string
  fields: DynamicFieldDef[]
  aiPromptHint: string
  /** When true, surfaced from community learning rather than static catalog */
  fromLearning?: boolean
  learnedRequestId?: string
  requestCount?: number
}

const COMMON_EXTRAS: DynamicFieldDef[] = [
  {
    key: 'copias',
    label: 'Copias adicionales para imprimir',
    type: 'number',
    extraPrice: 3000,
  },
  {
    key: 'urgencia',
    label: 'Entrega urgente (mismo día)',
    type: 'checkbox',
    extraPrice: 8000,
  },
]

export const STATIC_COLOMBIAN_DOCUMENTS: ColombianDocumentTemplate[] = [
  {
    id: 'carta-laboral',
    name: 'Carta laboral',
    description: 'Certificación de empleo, cargo, salario y antigüedad.',
    icon: '💼',
    categoryHint: 'laboral',
    aiPromptHint: 'Carta laboral formal según práctica colombiana (Ley 50/1990, Código Sustantivo del Trabajo).',
    fields: [
      { key: 'empleador', label: 'Nombre del empleador / empresa', type: 'text', required: true },
      { key: 'empleadorNit', label: 'NIT del empleador', type: 'text' },
      { key: 'empleado', label: 'Nombre del trabajador', type: 'text', required: true },
      { key: 'empleadoCc', label: 'Cédula del trabajador', type: 'text', required: true },
      { key: 'cargo', label: 'Cargo desempeñado', type: 'text', required: true },
      { key: 'salario', label: 'Salario (COP)', type: 'text' },
      { key: 'fechaIngreso', label: 'Fecha de ingreso', type: 'text' },
      { key: 'ciudad', label: 'Ciudad', type: 'text', required: true },
      ...COMMON_EXTRAS,
    ],
  },
  {
    id: 'contrato-arrendamiento',
    name: 'Contrato de arrendamiento',
    description: 'Arrendamiento de vivienda u otro inmueble en Colombia.',
    icon: '🏠',
    categoryHint: 'civil',
    aiPromptHint: 'Contrato de arrendamiento de vivienda urbana conforme Ley 820 de 2003.',
    fields: [
      { key: 'arrendador', label: 'Nombre del arrendador', type: 'text', required: true },
      { key: 'arrendadorCc', label: 'Cédula/NIT arrendador', type: 'text', required: true },
      { key: 'arrendatario', label: 'Nombre del arrendatario', type: 'text', required: true },
      { key: 'arrendatarioCc', label: 'Cédula arrendatario', type: 'text', required: true },
      { key: 'inmueble', label: 'Dirección del inmueble', type: 'text', required: true },
      { key: 'canon', label: 'Canon mensual (COP)', type: 'text', required: true },
      { key: 'duracion', label: 'Duración del contrato', type: 'text', required: true },
      { key: 'ciudad', label: 'Ciudad', type: 'text', required: true },
      ...COMMON_EXTRAS,
    ],
  },
  {
    id: 'poder-especial',
    name: 'Poder especial',
    description: 'Facultades específicas otorgadas a un apoderado.',
    icon: '📜',
    categoryHint: 'civil',
    aiPromptHint: 'Poder especial conforme Código General del Proceso y Código Civil colombiano.',
    fields: [
      { key: 'otorgante', label: 'Nombre del otorgante', type: 'text', required: true },
      { key: 'otorganteCc', label: 'Cédula del otorgante', type: 'text', required: true },
      { key: 'apoderado', label: 'Nombre del apoderado', type: 'text', required: true },
      { key: 'apoderadoCc', label: 'Cédula del apoderado', type: 'text', required: true },
      { key: 'facultades', label: 'Facultades otorgadas', type: 'text', required: true },
      { key: 'ciudad', label: 'Ciudad', type: 'text', required: true },
      ...COMMON_EXTRAS,
    ],
  },
  {
    id: 'carta-recomendacion',
    name: 'Carta de recomendación',
    description: 'Recomendación personal o laboral.',
    icon: '✉️',
    categoryHint: 'laboral',
    aiPromptHint: 'Carta de recomendación profesional en tono formal colombiano.',
    fields: [
      { key: 'referente', label: 'Nombre del referente', type: 'text', required: true },
      { key: 'referenteCargo', label: 'Cargo del referente', type: 'text' },
      { key: 'candidato', label: 'Nombre del candidato', type: 'text', required: true },
      { key: 'relacion', label: 'Relación (ej: jefe, colega)', type: 'text', required: true },
      { key: 'motivo', label: 'Motivo de la recomendación', type: 'text' },
      { key: 'ciudad', label: 'Ciudad', type: 'text', required: true },
      ...COMMON_EXTRAS,
    ],
  },
  {
    id: 'declaracion-juramentada',
    name: 'Declaración juramentada',
    description: 'Declaración de hechos bajo gravedad de juramento.',
    icon: '⚖️',
    categoryHint: 'civil',
    aiPromptHint: 'Declaración extrajuicio conforme práctica notarial colombiana.',
    fields: [
      { key: 'declarante', label: 'Nombre del declarante', type: 'text', required: true },
      { key: 'declaranteCc', label: 'Cédula del declarante', type: 'text', required: true },
      { key: 'hechos', label: 'Hechos a declarar', type: 'text', required: true },
      { key: 'ciudad', label: 'Ciudad', type: 'text', required: true },
      ...COMMON_EXTRAS,
    ],
  },
  {
    id: 'carta-renuncia',
    name: 'Carta de renuncia',
    description: 'Renuncia voluntaria al empleo.',
    icon: '📝',
    categoryHint: 'laboral',
    aiPromptHint: 'Carta de renuncia voluntaria según Código Sustantivo del Trabajo.',
    fields: [
      { key: 'empleado', label: 'Nombre del trabajador', type: 'text', required: true },
      { key: 'empleadoCc', label: 'Cédula', type: 'text', required: true },
      { key: 'empleador', label: 'Nombre del empleador', type: 'text', required: true },
      { key: 'cargo', label: 'Cargo actual', type: 'text', required: true },
      { key: 'fechaRenuncia', label: 'Fecha efectiva de renuncia', type: 'text', required: true },
      { key: 'ciudad', label: 'Ciudad', type: 'text', required: true },
      ...COMMON_EXTRAS,
    ],
  },
  {
    id: 'solicitud-permiso',
    name: 'Solicitud de permiso',
    description: 'Permiso laboral, escolar u otro trámite.',
    icon: '📋',
    categoryHint: 'laboral',
    aiPromptHint: 'Solicitud formal de permiso con motivo y fechas.',
    fields: [
      { key: 'solicitante', label: 'Nombre del solicitante', type: 'text', required: true },
      { key: 'destinatario', label: 'Dirigido a (empresa/institución)', type: 'text', required: true },
      { key: 'motivo', label: 'Motivo del permiso', type: 'text', required: true },
      { key: 'fechaInicio', label: 'Fecha inicio', type: 'text', required: true },
      { key: 'fechaFin', label: 'Fecha fin', type: 'text' },
      { key: 'ciudad', label: 'Ciudad', type: 'text', required: true },
      ...COMMON_EXTRAS,
    ],
  },
  {
    id: 'contrato-prestacion-servicios',
    name: 'Contrato de prestación de servicios',
    description: 'Contrato entre contratante y contratista independiente.',
    icon: '🤝',
    categoryHint: 'comercial',
    aiPromptHint: 'Contrato de prestación de servicios conforme normativa colombiana de contratación.',
    fields: [
      { key: 'contratante', label: 'Nombre del contratante', type: 'text', required: true },
      { key: 'contratanteNit', label: 'NIT/CC contratante', type: 'text', required: true },
      { key: 'contratista', label: 'Nombre del contratista', type: 'text', required: true },
      { key: 'contratistaCc', label: 'Cédula/NIT contratista', type: 'text', required: true },
      { key: 'objeto', label: 'Objeto del contrato', type: 'text', required: true },
      { key: 'valor', label: 'Valor (COP)', type: 'text', required: true },
      { key: 'duracion', label: 'Duración', type: 'text', required: true },
      { key: 'ciudad', label: 'Ciudad', type: 'text', required: true },
      ...COMMON_EXTRAS,
    ],
  },
  {
    id: 'carta-notificacion',
    name: 'Carta de notificación',
    description: 'Notificación formal a persona o empresa.',
    icon: '📬',
    categoryHint: 'civil',
    aiPromptHint: 'Carta de notificación formal con hechos, petición y plazo.',
    fields: [
      { key: 'remitente', label: 'Nombre del remitente', type: 'text', required: true },
      { key: 'destinatario', label: 'Nombre del destinatario', type: 'text', required: true },
      { key: 'asunto', label: 'Asunto', type: 'text', required: true },
      { key: 'contenido', label: 'Contenido de la notificación', type: 'text', required: true },
      { key: 'ciudad', label: 'Ciudad', type: 'text', required: true },
      ...COMMON_EXTRAS,
    ],
  },
  {
    id: 'autorizacion-menor',
    name: 'Autorización de viaje para menor',
    description: 'Permiso de viaje nacional o internacional.',
    icon: '✈️',
    categoryHint: 'familiar',
    aiPromptHint: 'Autorización de viaje para menor de edad conforme Migración Colombia.',
    fields: [
      { key: 'padreMadre', label: 'Nombre del padre/madre/tutor', type: 'text', required: true },
      { key: 'padreMadreCc', label: 'Cédula del autorizante', type: 'text', required: true },
      { key: 'menor', label: 'Nombre del menor', type: 'text', required: true },
      { key: 'menorCc', label: 'Tarjeta de identidad / registro civil', type: 'text', required: true },
      { key: 'destino', label: 'Destino del viaje', type: 'text', required: true },
      { key: 'fechas', label: 'Fechas del viaje', type: 'text', required: true },
      { key: 'ciudad', label: 'Ciudad', type: 'text', required: true },
      ...COMMON_EXTRAS,
    ],
  },
]

export function getStaticTemplateById(id: string): ColombianDocumentTemplate | undefined {
  return STATIC_COLOMBIAN_DOCUMENTS.find((t) => t.id === id)
}

export function getCustomTemplate(): ColombianDocumentTemplate {
  return {
    id: CUSTOM_TEMPLATE_ID,
    name: 'Otro documento',
    description: 'Describe el documento que necesitas. OigaGIG aprende de cada solicitud nueva.',
    icon: '✨',
    categoryHint: 'custom',
    aiPromptHint: 'Documento personalizado según descripción del usuario y normativa colombiana aplicable.',
    fields: [
      {
        key: 'descripcion',
        label: '¿Qué documento necesitas?',
        type: 'text',
        required: true,
      },
      { key: 'partes', label: 'Partes involucradas (nombres)', type: 'text' },
      { key: 'detalles', label: 'Detalles adicionales', type: 'text' },
      { key: 'ciudad', label: 'Ciudad', type: 'text', required: true },
      ...COMMON_EXTRAS,
    ],
  }
}