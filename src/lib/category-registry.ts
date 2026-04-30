import { gigCategories } from '@/lib/gig-categories';

// Smart Category Registry - The brain of the dynamic system
export const categoryRegistry = gigCategories.map(cat => ({
  ...cat,
  buyerFields: getBuyerFields(cat.name),
  sellerFields: getSellerFields(cat.name),
  tools: getTools(cat.name),
  aiPrompts: getAIPrompts(cat.name),
  upgrades: getUpgrades(cat.name),
}));

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
    default:
      return [];
  }
}

function getSellerFields(categoryName: string) {
  return getBuyerFields(categoryName);
}

function getTools(categoryName: string) {
  if (categoryName.includes('Delivery') || categoryName.includes('Mensajería')) {
    return ['maps', 'liveLocation'];
  }
  return [];
}

function getAIPrompts(categoryName: string) {
  return {
    description: `Escribe una descripción atractiva y profesional para un servicio de ${categoryName} en Colombia.`,
  };
}

function getUpgrades(categoryName: string) {
  return [
    { name: 'Entrega exprés', price: 15000, description: '50% más rápido' },
    { name: 'Garantía de satisfacción', price: 10000, description: 'Devolución si no te gusta' },
  ];
}

export default categoryRegistry;
