export type AddOn = {
  id: string;
  label: string;
  price: number;
  type: 'checkbox' | 'number' | 'select' | 'text';
  options?: string[];
  unit?: string;
};

export type Category = {
  slug: string;
  name: string;
  icon: string;
  basePriceMin: number;
  basePriceMax: number;
  description: string;
  addOns: AddOn[];
  questions: string[];
};

export const categories: Category[] = [
  // Previous categories (kept)
  {
    slug: "limpieza",
    name: "Limpieza de Hogar y Oficinas",
    icon: "Home",
    basePriceMin: 50000,
    basePriceMax: 150000,
    description: "Limpieza profunda, general o de oficinas",
    addOns: [
      { id: "rooms", label: "Número de habitaciones", price: 15000, type: "number", unit: "habitaciones" },
      { id: "kitchen", label: "Limpieza profunda de cocina", price: 25000, type: "checkbox" },
      { id: "windows", label: "Limpieza de ventanas", price: 20000, type: "checkbox" },
      { id: "hours", label: "Horas extras", price: 12000, type: "number", unit: "horas" },
    ],
    questions: ["¿Qué tipo de limpieza necesitas?", "¿Hay mascotas en el hogar?", "¿Necesitas limpieza de garaje o patio?"]
  },
  {
    slug: "musica",
    name: "Música y DJ para Eventos",
    icon: "Music",
    basePriceMin: 120000,
    basePriceMax: 350000,
    description: "DJ, banda en vivo o sonido para fiestas",
    addOns: [
      { id: "duration", label: "Duración del evento", price: 0, type: "select", options: ["3 horas", "5 horas", "8 horas"] },
      { id: "lights", label: "Luces y efectos especiales", price: 45000, type: "checkbox" },
      { id: "mc", label: "Animador / Maestro de Ceremonias", price: 60000, type: "checkbox" },
    ],
    questions: ["¿Qué tipo de música prefieres?", "¿Es para boda, fiesta o evento corporativo?", "¿Necesitas equipo de sonido completo?"]
  },
  {
    slug: "legal",
    name: "Asesoría Legal y Tributaria",
    icon: "Briefcase",
    basePriceMin: 80000,
    basePriceMax: 250000,
    description: "Consultoría legal, contratos, impuestos",
    addOns: [
      { id: "document", label: "Redacción de contrato", price: 45000, type: "checkbox" },
      { id: "tax", label: "Declaración de impuestos", price: 70000, type: "checkbox" },
      { id: "consult", label: "Consulta por hora", price: 35000, type: "number", unit: "horas" },
    ],
    questions: ["¿Qué tipo de asesoría necesitas?", "¿Es para persona natural o empresa?", "¿Tienes documentos listos?"]
  },
  {
    slug: "diseno",
    name: "Diseño Gráfico y Logos",
    icon: "Palette",
    basePriceMin: 60000,
    basePriceMax: 180000,
    description: "Logos, banners, redes sociales",
    addOns: [
      { id: "revisions", label: "Revisiones extras", price: 15000, type: "number", unit: "revisiones" },
      { id: "source", label: "Archivos fuente (editable)", price: 30000, type: "checkbox" },
    ],
    questions: ["¿Qué tipo de diseño necesitas?", "¿Tienes referencias o estilo preferido?"]
  },
  {
    slug: "cocina",
    name: "Cocina Casera y Catering",
    icon: "Utensils",
    basePriceMin: 80000,
    basePriceMax: 220000,
    description: "Comida para eventos o entrega a domicilio",
    addOns: [
      { id: "guests", label: "Número de personas", price: 0, type: "number", unit: "personas" },
      { id: "delivery", label: "Servicio de entrega", price: 25000, type: "checkbox" },
    ],
    questions: ["¿Qué tipo de comida prefieres?", "¿Es para evento o entrega diaria?"]
  },
  {
    slug: "fotografia",
    name: "Fotografía y Video",
    icon: "Camera",
    basePriceMin: 95000,
    basePriceMax: 280000,
    description: "Sesiones fotográficas y video",
    addOns: [
      { id: "hours", label: "Horas de sesión", price: 40000, type: "number", unit: "horas" },
      { id: "drone", label: "Tomas con dron", price: 80000, type: "checkbox" },
    ],
    questions: ["¿Qué tipo de sesión necesitas?", "¿Es para boda, producto o evento?"]
  },
  {
    slug: "transporte",
    name: "Transporte y Mudanzas",
    icon: "Truck",
    basePriceMin: 70000,
    basePriceMax: 180000,
    description: "Mudanzas, envíos y transporte",
    addOns: [
      { id: "size", label: "Tamaño del vehículo", price: 0, type: "select", options: ["Camioneta pequeña", "Camión mediano", "Camión grande"] },
      { id: "distance", label: "Distancia aproximada (km)", price: 5000, type: "number", unit: "km" },
    ],
    questions: ["¿Qué tipo de transporte necesitas?", "¿Es mudanza o entrega de mercancía?"]
  },
  {
    slug: "eventos",
    name: "Organización de Eventos y Fiestas",
    icon: "Calendar",
    basePriceMin: 150000,
    basePriceMax: 450000,
    description: "Planificación completa de eventos",
    addOns: [
      { id: "guests", label: "Número de invitados", price: 0, type: "number", unit: "invitados" },
      { id: "decoration", label: "Decoración completa", price: 80000, type: "checkbox" },
    ],
    questions: ["¿Qué tipo de evento es?", "¿Necesitas catering incluido?"]
  },
  {
    slug: "belleza",
    name: "Belleza y Maquillaje a Domicilio",
    icon: "Smile",
    basePriceMin: 45000,
    basePriceMax: 120000,
    description: "Maquillaje, peinado y tratamientos",
    addOns: [
      { id: "people", label: "Número de personas", price: 0, type: "number", unit: "personas" },
      { id: "travel", label: "Desplazamiento fuera de la ciudad", price: 30000, type: "checkbox" },
    ],
    questions: ["¿Qué servicio de belleza necesitas?", "¿Es para boda o evento especial?"]
  },
  {
    slug: "clases",
    name: "Clases Particulares",
    icon: "BookOpen",
    basePriceMin: 40000,
    basePriceMax: 100000,
    description: "Clases de idiomas, música, matemáticas, etc.",
    addOns: [
      { id: "sessions", label: "Número de sesiones", price: 0, type: "number", unit: "sesiones" },
      { id: "online", label: "Clases virtuales", price: -10000, type: "checkbox" },
    ],
    questions: ["¿Qué materia o habilidad quieres aprender?", "¿Prefieres clases presenciales o virtuales?"]
  },
  {
    slug: "artesanias",
    name: "Artesanías y Productos Hechos a Mano",
    icon: "Gift",
    basePriceMin: 35000,
    basePriceMax: 250000,
    description: "Mochilas Wayuu, joyería filigrana, cerámica, cuero, textiles y más",
    addOns: [
      { id: "personalization", label: "Personalización (nombre o diseño)", price: 20000, type: "checkbox" },
      { id: "premium-material", label: "Materiales premium / naturales", price: 25000, type: "checkbox" },
      { id: "gift-wrap", label: "Envoltura de regalo artesanal", price: 8000, type: "checkbox" },
      { id: "quantity", label: "Cantidad (pedido mayor)", price: 0, type: "number", unit: "piezas" },
    ],
    questions: ["¿Qué tipo de artesanía buscas?", "¿Quieres personalización?", "¿Es para regalo?"]
  },
  {
    slug: "bienestar",
    name: "Cuidado Holístico y Bienestar",
    icon: "Heart",
    basePriceMin: 45000,
    basePriceMax: 180000,
    description: "Yoga, reiki, masajes, meditación y terapias naturales",
    addOns: [
      { id: "sessions", label: "Número de sesiones", price: 0, type: "number", unit: "sesiones" },
      { id: "home-visit", label: "Visita a domicilio", price: 25000, type: "checkbox" },
      { id: "group", label: "Sesión grupal", price: 15000, type: "checkbox" },
      { id: "herbs", label: "Hierbas medicinales", price: 20000, type: "checkbox" },
    ],
    questions: ["¿Qué tipo de terapia buscas?", "¿Sesión individual o grupal?", "¿Tienes alguna condición de salud?"]
  },

  // === Newly Added Categories ===
  {
    slug: "guiaturistico",
    name: "Guía Turístico",
    icon: "Map",
    basePriceMin: 80000,
    basePriceMax: 250000,
    description: "Guías locales para tours en Colombia (Bogotá, Medellín, Cartagena, Santander, etc.)",
    addOns: [
      { id: "duration", label: "Duración del tour", price: 0, type: "select", options: ["Medio día", "Día completo", "2-3 días"] },
      { id: "transport", label: "Transporte incluido", price: 40000, type: "checkbox" },
      { id: "group", label: "Tour grupal (hasta 10 personas)", price: 20000, type: "checkbox" },
    ],
    questions: ["¿Qué ciudad o región quieres explorar?", "¿Prefieres tour privado o grupal?", "¿Intereses especiales (historia, naturaleza, gastronomía)?"]
  },
  {
    slug: "fitness",
    name: "Entrenador Personal y Fitness",
    icon: "Dumbbell",
    basePriceMin: 45000,
    basePriceMax: 120000,
    description: "Entrenamientos personales, funcional, yoga y rutinas a domicilio",
    addOns: [
      { id: "sessions", label: "Número de sesiones", price: 0, type: "number", unit: "sesiones" },
      { id: "home", label: "Entrenamiento a domicilio", price: 15000, type: "checkbox" },
      { id: "nutrition", label: "Plan básico de nutrición", price: 25000, type: "checkbox" },
    ],
    questions: ["¿Qué tipo de entrenamiento buscas?", "¿Nivel actual (principiante, intermedio, avanzado)?", "¿Entrenamiento en casa o gym?"]
  },
  {
    slug: "mecanico",
    name: "Mecánico y Reparación de Vehículos",
    icon: "Wrench",
    basePriceMin: 60000,
    basePriceMax: 200000,
    description: "Reparaciones móviles, mantenimiento y diagnóstico de autos y motos",
    addOns: [
      { id: "urgency", label: "Servicio urgente (mismo día)", price: 30000, type: "checkbox" },
      { id: "diagnostic", label: "Diagnóstico completo", price: 25000, type: "checkbox" },
      { id: "parts", label: "Piezas incluidas", price: 0, type: "select", options: ["No incluidas", "Básicas", "Premium"] },
    ],
    questions: ["¿Qué tipo de vehículo es?", "¿Qué problema tiene?", "¿Necesitas servicio a domicilio?"]
  },
  {
    slug: "foodtruck",
    name: "Food Truck y Comida Callejera",
    icon: "Truck",
    basePriceMin: 120000,
    basePriceMax: 350000,
    description: "Servicio de food truck para eventos, fiestas y entregas",
    addOns: [
      { id: "guests", label: "Número de personas", price: 0, type: "number", unit: "personas" },
      { id: "hours", label: "Horas de servicio", price: 0, type: "select", options: ["2 horas", "4 horas", "Todo el día"] },
      { id: "setup", label: "Montaje y decoración", price: 30000, type: "checkbox" },
    ],
    questions: ["¿Qué tipo de comida ofreces?", "¿Es para evento privado o público?", "¿Necesitas electricidad o agua?"]
  },
  {
    slug: "joyeria",
    name: "Joyería y Bisutería",
    icon: "Gem",
    basePriceMin: 40000,
    basePriceMax: 180000,
    description: "Joyería filigrana, piezas personalizadas y bisutería artesanal",
    addOns: [
      { id: "personalization", label: "Personalización (nombre o iniciales)", price: 25000, type: "checkbox" },
      { id: "material", label: "Material premium (oro, plata, piedras)", price: 40000, type: "checkbox" },
      { id: "quantity", label: "Cantidad mayor", price: 0, type: "number", unit: "piezas" },
    ],
    questions: ["¿Qué tipo de joya buscas?", "¿Quieres pieza única o en serie?", "¿Es para regalo especial?"]
  }
];

export function getCategory(slug: string): Category | undefined {
  return categories.find(c => c.slug === slug);
}
