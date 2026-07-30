import { getGigCategories } from './categories';
import { gigCategories } from './gig-categories';

// Helper functions first (name-based "smart" logic).
// These work for *any* category name, including ones created by admins in /admin/categories.
// For categories that don't match a specific case, we provide good defaults so the dynamic smart system still feels rich.

function getBuyerFields(categoryName: string) {
  switch (categoryName) {
    case 'Limpieza de Hogar y Oficinas':
      return [
        { key: 'rooms', label: 'Número de habitaciones', type: 'number', placeholder: 'Ej: 3' },
        { key: 'bathrooms', label: 'Número de baños', type: 'number', placeholder: 'Ej: 2' },
        { key: 'deepClean', label: '¿Limpieza profunda?', type: 'checkbox' },
        { key: 'pets', label: '¿Hay mascotas?', type: 'checkbox' },
        { key: 'date', label: 'Fecha preferida', type: 'date' },
      ];
    case 'Mensajería y Delivery':
      return [
        { key: 'pickupAddress', label: 'Dirección de recogida', type: 'text' },
        { key: 'deliveryAddress', label: 'Dirección de entrega', type: 'text' },
        { key: 'packageSize', label: 'Tamaño del paquete', type: 'select', options: ['Pequeño', 'Mediano', 'Grande'] },
        { key: 'urgency', label: 'Urgencia', type: 'select', options: ['Normal', 'Rápido', 'Mismo día'] },
      ];
    case 'Plomería y Fontanería':
      return [
        { key: 'problemType', label: 'Tipo de problema', type: 'select', options: ['Fuga de agua', 'Desagüe tapado', 'Instalación nueva', 'Reparación general'] },
        { key: 'urgency', label: '¿Es urgente (sin agua)?', type: 'checkbox' },
        { key: 'access', label: 'Acceso a la zona (ej: sótano, azotea)', type: 'text' },
      ];
    case 'Recursos Naturales y Minerales':
      return [
        { key: 'resourceSpecs', label: 'Especificaciones del recurso (pureza, variedad, etc.)', type: 'text' },
        { key: 'deliveryAddress', label: 'Dirección de entrega', type: 'text' },
        { key: 'preferredDate', label: 'Fecha de entrega preferida', type: 'date' },
        { key: 'notes', label: 'Notas adicionales', type: 'text' },
      ];
    case 'Servicios de Recursos Naturales':
      return [
        { key: 'siteLocation', label: 'Ubicación del sitio de trabajo', type: 'text' },
        { key: 'preferredDate', label: 'Fecha de inicio preferida', type: 'date' },
        { key: 'urgency', label: '¿Es urgente?', type: 'checkbox' },
        { key: 'notes', label: 'Detalles del proyecto o terreno', type: 'text' },
      ];
    case 'Venta de Autos y Vehículos':
      return [
        { key: 'preferredDate', label: 'Fecha preferida para visita o entrega', type: 'date' },
        { key: 'city', label: 'Ciudad donde está el vehículo', type: 'text' },
        { key: 'financingInterest', label: '¿Te interesa financiación?', type: 'checkbox' },
        { key: 'notes', label: 'Notas (SOAT, tecnomecánica, papeles, etc.)', type: 'text' },
      ];
    case 'Reparación de Computadores y Electrónica':
      return [
        { key: 'deviceModel', label: 'Marca y modelo del equipo', type: 'text' },
        { key: 'problemDescription', label: '¿Qué problema tiene?', type: 'text' },
        { key: 'preferredDate', label: 'Fecha preferida', type: 'date' },
        { key: 'address', label: 'Dirección del servicio (si es a domicilio)', type: 'text' },
        { key: 'notes', label: 'Notas adicionales (garantía previa, accesorios, etc.)', type: 'text' },
      ];
    default:
      // For newly created admin categories (or any not explicitly configured),
      // provide a sensible generic set of buyer fields.
      // The main "smart" pricing fields come from Category.fields in the DB
      // (used by create-gig + DynamicCheckoutFields).
      return [
        { key: 'preferredDate', label: 'Fecha preferida', type: 'date' },
        { key: 'address', label: 'Dirección del servicio', type: 'text' },
        { key: 'notes', label: 'Notas o detalles adicionales', type: 'text' },
      ];
  }
}

function getSellerFields(categoryName: string) {
  return getBuyerFields(categoryName);
}

function getTools(categoryName: string) {
  const name = categoryName.toLowerCase();
  if (name.includes('delivery') || name.includes('mensajer')) {
    return ['maps', 'liveLocation'];
  }
  if (name.includes('transporte') || name.includes('mudanza') || name.includes('turismo') || name.includes('autos') || name.includes('vehículo') || name.includes('vehiculo')) {
    return ['maps'];
  }
  if (
    name.includes('plomer') ||
    name.includes('fontaner') ||
    name.includes('electric') ||
    name.includes('repar') ||
    name.includes('computador') ||
    name.includes('electrón') ||
    name.includes('electron')
  ) {
    return ['maps'];
  }
  if (name.includes('jardin') || name.includes('pintura') || name.includes('hogar')) {
    return ['maps'];
  }
  if (name.includes('recursos naturales') && name.includes('servicios')) {
    return ['maps'];
  }
  if (name.includes('recursos naturales') || name.includes('minerales')) {
    return ['maps'];
  }
  return [];
}

function getAIPrompts(categoryName: string) {
  return {
    description: `Escribe una descripción atractiva y profesional para un servicio de ${categoryName} en Colombia.`,
  };
}

function getUpgrades(categoryName: string) {
  const name = categoryName.toLowerCase();
  const base = [
    { name: 'Garantía de satisfacción', price: 10000, description: 'Devolución si no te gusta' },
  ];
  if (name.includes('delivery') || name.includes('mensajer') || name.includes('transporte')) {
    return [
      { name: 'Entrega exprés', price: 15000, description: '50% más rápido' },
      ...base,
    ];
  }
  if (name.includes('turismo')) {
    return [
      { name: 'Tour privado exclusivo', price: 50000, description: 'Solo para tu grupo' },
      { name: 'Fotos profesionales incluidas', price: 30000, description: 'Recuerdos del recorrido' },
      ...base,
    ];
  }
  if (name.includes('evento') || name.includes('fiesta')) {
    return [
      { name: 'Coordinación extra', price: 20000, description: 'Más horas de atención' },
      ...base,
    ];
  }
  if (name.includes('recursos naturales y minerales')) {
    return [
      { name: 'Entrega urgente', price: 35000, description: 'Entrega prioritaria en menos tiempo' },
      { name: 'Muestreo de calidad', price: 25000, description: 'Análisis o muestra antes de la compra' },
      ...base,
    ];
  }
  if (name.includes('servicios de recursos naturales')) {
    return [
      { name: 'Informe técnico incluido', price: 45000, description: 'Documentación profesional del trabajo' },
      { name: 'Seguro de operación', price: 40000, description: 'Cobertura durante la ejecución' },
      ...base,
    ];
  }
  if (name.includes('autos') || name.includes('vehículo') || name.includes('vehiculo') || name.includes('automotriz')) {
    return [
      { name: 'Entrega prioritaria', price: 80000, description: 'Traslado del vehículo en menos tiempo' },
      { name: 'Documentación incluida', price: 50000, description: 'Apoyo con papeles y trámite de traspaso' },
      { name: 'Peritaje completo', price: 90000, description: 'Inspección técnica profesional' },
      ...base,
    ];
  }
  if (
    name.includes('computador') ||
    name.includes('electrón') ||
    name.includes('electron') ||
    (name.includes('reparación') && name.includes('electr'))
  ) {
    return [
      { name: 'Diagnóstico prioritario', price: 25000, description: 'Atención y revisión en menos tiempo' },
      { name: 'Backup de datos incluido', price: 40000, description: 'Copia de seguridad antes de la reparación' },
      { name: 'Garantía extendida del servicio', price: 35000, description: 'Mayor cobertura post-reparación' },
      ...base,
    ];
  }
  return [
    { name: 'Servicio prioritario', price: 12000, description: 'Atención preferencial' },
    ...base,
  ];
}

// Smart Category Registry - The brain of the dynamic system.
// Fully dynamic: loads live from the database so admin-created categories
// (via /admin/categories) automatically participate.
export async function getCategoryRegistry() {
  const cats = await getGigCategories();
  return cats.map(cat => ({
    ...cat,
    buyerFields: getBuyerFields(cat.name),
    sellerFields: getSellerFields(cat.name),
    tools: getTools(cat.name),
    aiPrompts: getAIPrompts(cat.name),
    upgrades: getUpgrades(cat.name),
  }));
}

// For backward compatibility with any existing (sync) imports of the registry.
// IMPORTANT: This only contains the originally seeded categories.
// Any categories created later by an admin will ONLY be present when using the async API.
// Always prefer: const registry = await getCategoryRegistry();
export const categoryRegistry = gigCategories.map(cat => ({
  ...cat,
  buyerFields: getBuyerFields(cat.name),
  sellerFields: getSellerFields(cat.name),
  tools: getTools(cat.name),
  aiPrompts: getAIPrompts(cat.name),
  upgrades: getUpgrades(cat.name),
}));

export default getCategoryRegistry;
