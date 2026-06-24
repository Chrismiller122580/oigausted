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
  if (name.includes('transporte') || name.includes('mudanza') || name.includes('turismo')) {
    return ['maps'];
  }
  if (name.includes('plomer') || name.includes('fontaner') || name.includes('electric') || name.includes('repar')) {
    return ['maps'];
  }
  if (name.includes('jardin') || name.includes('pintura') || name.includes('hogar')) {
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
