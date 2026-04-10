export const gigCategories = [
  {
    slug: "limpieza",
    name: "Limpieza",
    icon: "Sparkles",
    description: "Limpieza de hogares, oficinas y espacios",
    fields: [
      { key: "rooms", label: "Número de habitaciones", type: "number", required: true },
      { key: "floors", label: "Número de pisos", type: "number" },
      { key: "deepClean", label: "Limpieza profunda", type: "checkbox", extraPrice: 45000 },
      { key: "windows", label: "Limpieza de ventanas", type: "checkbox", extraPrice: 25000 },
      { key: "kitchen", label: "Limpieza profunda de cocina", type: "checkbox", extraPrice: 30000 }
    ],
    addons: [
      { id: "petFriendly", label: "Pet Friendly", extraPrice: 15000 },
      { id: "ecoProducts", label: "Productos ecológicos", extraPrice: 20000 }
    ],
    deliveryTimeOptions: ["Mismo día", "1 día", "2-3 días"],
    hasTracking: false
  },
  {
    slug: "transporte",
    name: "Transporte",
    icon: "Truck",
    description: "Mudanzas, delivery y transporte",
    fields: [
      { key: "items", label: "Número de items / volumen", type: "number", required: true },
      { key: "distance", label: "Distancia aproximada (km)", type: "number" },
      { key: "withLabor", label: "Con ayudantes de carga", type: "checkbox", extraPrice: 80000 }
    ],
    addons: [
      { id: "insurance", label: "Seguro de carga", extraPrice: 35000 }
    ],
    deliveryTimeOptions: ["Mismo día", "1 día", "2 días"],
    hasTracking: true
  },
  {
    slug: "reparaciones",
    name: "Reparaciones",
    icon: "Wrench",
    description: "Reparaciones del hogar",
    fields: [
      { key: "repairType", label: "Tipo de reparación", type: "select", options: ["Plomería", "Eléctrica", "Carpintería", "Pintura", "Otros"], required: true },
      { key: "urgency", label: "Urgencia", type: "select", options: ["Normal", "Mismo día", "Emergencia"] }
    ],
    addons: [],
    deliveryTimeOptions: ["1 día", "2-3 días", "4-7 días"],
    hasTracking: false
  },
  {
    slug: "fotografia",
    name: "Fotografía",
    icon: "Camera",
    description: "Sesiones fotográficas y video",
    fields: [
      { key: "sessionType", label: "Tipo de sesión", type: "select", options: ["Retrato", "Evento", "Producto", "Inmobiliaria"], required: true },
      { key: "hours", label: "Horas de sesión", type: "number", required: true },
      { key: "editing", label: "Edición incluida", type: "checkbox", extraPrice: 60000 }
    ],
    addons: [
      { id: "drone", label: "Tomas con drone", extraPrice: 120000 }
    ],
    deliveryTimeOptions: ["1 día", "2-3 días", "4-7 días"],
    hasTracking: false
  },
  {
    slug: "diseño",
    name: "Diseño Gráfico",
    icon: "Palette",
    description: "Logos, flyers y diseño digital",
    fields: [
      { key: "designType", label: "Tipo de diseño", type: "select", options: ["Logo", "Flyer", "Banner", "Redes Sociales"], required: true },
      { key: "revisions", label: "Número de revisiones incluidas", type: "number", default: 3 }
    ],
    addons: [],
    deliveryTimeOptions: ["1 día", "2-3 días", "4-7 días"],
    hasTracking: false
  },
  {
    slug: "marketing",
    name: "Marketing Digital",
    icon: "Megaphone",
    description: "Campañas y promoción en redes",
    fields: [
      { key: "platform", label: "Plataforma principal", type: "select", options: ["Instagram", "Facebook", "Google", "TikTok"], required: true },
      { key: "duration", label: "Duración de la campaña (días)", type: "number", required: true }
    ],
    addons: [],
    deliveryTimeOptions: ["7 días", "15 días", "30 días"],
    hasTracking: true
  },
  {
    slug: "joyeria",
    name: "Joyería",
    icon: "Gem",
    description: "Reparación y diseño de joyas",
    fields: [
      { key: "serviceType", label: "Tipo de servicio", type: "select", options: ["Reparación", "Diseño personalizado", "Limpieza", "Engraving"], required: true }
    ],
    addons: [],
    deliveryTimeOptions: ["2-3 días", "4-7 días", "10 días"],
    hasTracking: false
  },
  {
    slug: "musica",
    name: "Música y Sonido",
    icon: "Music",
    description: "DJ, sonido para eventos",
    fields: [
      { key: "eventType", label: "Tipo de evento", type: "select", options: ["Boda", "Fiesta", "Corporativo"], required: true },
      { key: "hours", label: "Horas de servicio", type: "number", required: true }
    ],
    addons: [],
    deliveryTimeOptions: ["Mismo día", "1 día"],
    hasTracking: false
  },
  {
    slug: "belleza",
    name: "Belleza",
    icon: "Scissors",
    description: "Peluquería, maquillaje, manicure",
    fields: [
      { key: "serviceType", label: "Tipo de servicio", type: "select", options: ["Corte", "Maquillaje", "Manicure", "Spa"], required: true },
      { key: "people", label: "Número de personas", type: "number" }
    ],
    addons: [],
    deliveryTimeOptions: ["Mismo día", "1 día"],
    hasTracking: false
  },
  {
    slug: "artesanias",
    name: "Artesanías",
    icon: "Hand",
    description: "Productos hechos a mano",
    fields: [
      { key: "itemType", label: "Tipo de producto", type: "select", options: ["Joyas", "Decoración", "Ropa", "Cerámica"] }
    ],
    addons: [],
    deliveryTimeOptions: ["3-5 días", "7-10 días"],
    hasTracking: true
  },
  {
    slug: "delivery",
    name: "Delivery",
    icon: "Bike",
    description: "Entrega de comida y paquetes",
    fields: [
      { key: "packageSize", label: "Tamaño del paquete", type: "select", options: ["Pequeño", "Mediano", "Grande"] }
    ],
    addons: [],
    deliveryTimeOptions: ["30 min", "1 hora", "2 horas"],
    hasTracking: true
  },
  {
    slug: "ceramica",
    name: "Cerámica",
    icon: "Pot",
    description: "Alfarería y piezas de cerámica",
    fields: [
      { key: "itemType", label: "Tipo de pieza", type: "select", options: ["Vajilla", "Decorativa", "Personalizada"] }
    ],
    addons: [],
    deliveryTimeOptions: ["5-7 días", "10-15 días"],
    hasTracking: false
  },
  {
    slug: "sastreria",
    name: "Sastrería",
    icon: "Scissors",
    description: "Costura y arreglos de ropa",
    fields: [
      { key: "serviceType", label: "Tipo de servicio", type: "select", options: ["Arreglo", "Confección", "Personalizado"] }
    ],
    addons: [],
    deliveryTimeOptions: ["2-3 días", "4-7 días"],
    hasTracking: false
  },
  {
    slug: "confeccion",
    name: "Confección de Ropa",
    icon: "Shirt",
    description: "Diseño y fabricación de prendas",
    fields: [
      { key: "garmentType", label: "Tipo de prenda", type: "select", options: ["Camisa", "Pantalón", "Vestido", "Traje"] }
    ],
    addons: [],
    deliveryTimeOptions: ["5-10 días", "15 días"],
    hasTracking: false
  },
  {
    slug: "comida",
    name: "Comida y Catering",
    icon: "Utensils",
    description: "Preparación de comida y catering",
    fields: [
      { key: "eventSize", label: "Número de personas", type: "number" },
      { key: "cuisineType", label: "Tipo de cocina", type: "select", options: ["Colombiana", "Internacional", "Vegetariana"] }
    ],
    addons: [],
    deliveryTimeOptions: ["Mismo día", "1 día"],
    hasTracking: true
  },
  {
    slug: "jardineria",
    name: "Jardinería",
    icon: "Leaf",
    description: "Cuidado de jardines y plantas",
    fields: [
      { key: "gardenSize", label: "Tamaño del jardín (m²)", type: "number" },
      { key: "serviceType", label: "Tipo de servicio", type: "select", options: ["Mantenimiento", "Diseño", "Poda"] }
    ],
    addons: [],
    deliveryTimeOptions: ["1 día", "2-3 días"],
    hasTracking: false
  },
  {
    slug: "mascotas",
    name: "Mascotas",
    icon: "PawPrint",
    description: "Paseo, grooming y cuidado de mascotas",
    fields: [
      { key: "petType", label: "Tipo de mascota", type: "select", options: ["Perro", "Gato", "Otros"] },
      { key: "serviceType", label: "Servicio", type: "select", options: ["Paseo", "Grooming", "Cuidado diario"] }
    ],
    addons: [],
    deliveryTimeOptions: ["Mismo día", "Diario"],
    hasTracking: false
  },
  {
    slug: "clases",
    name: "Clases Particulares",
    icon: "BookOpen",
    description: "Clases y tutorías",
    fields: [
      { key: "subject", label: "Materia", type: "text" },
      { key: "level", label: "Nivel", type: "select", options: ["Primaria", "Secundaria", "Universidad"] }
    ],
    addons: [],
    deliveryTimeOptions: ["Por sesión", "Paquete semanal"],
    hasTracking: false
  },
  {
    slug: "eventos",
    name: "Eventos y Decoración",
    icon: "PartyPopper",
    description: "Organización de eventos y decoración",
    fields: [
      { key: "eventType", label: "Tipo de evento", type: "select", options: ["Boda", "Cumpleaños", "Corporativo"] },
      { key: "guests", label: "Número aproximado de invitados", type: "number" }
    ],
    addons: [],
    deliveryTimeOptions: ["1 semana", "2 semanas"],
    hasTracking: false
  },
  {
    slug: "lavado",
    name: "Lavado de Autos",
    icon: "Car",
    description: "Lavado y detailing de vehículos",
    fields: [
      { key: "vehicleType", label: "Tipo de vehículo", type: "select", options: ["Carro", "Moto", "Camioneta"] },
      { key: "serviceLevel", label: "Nivel de servicio", type: "select", options: ["Básico", "Completo", "Premium"] }
    ],
    addons: [],
    deliveryTimeOptions: ["Mismo día"],
    hasTracking: false
  },
  {
    slug: "organizacion",
    name: "Organización del Hogar",
    icon: "Box",
    description: "Organización y orden de espacios",
    fields: [
      { key: "spaceType", label: "Tipo de espacio", type: "select", options: ["Armario", "Cocina", "Oficina", "Completo"] }
    ],
    addons: [],
    deliveryTimeOptions: ["1 día", "2-3 días"],
    hasTracking: false
  },
  {
    slug: "cuidado",
    name: "Cuidado de Adultos Mayores",
    icon: "Heart",
    description: "Cuidado y compañía para personas mayores",
    fields: [
      { key: "hours", label: "Horas por día", type: "number" },
      { key: "serviceType", label: "Tipo de servicio", type: "select", options: ["Compañía", "Asistencia médica básica", "Cuidado completo"] }
    ],
    addons: [],
    deliveryTimeOptions: ["Diario", "Semanal"],
    hasTracking: false
  },
  {
    slug: "entrenamiento",
    name: "Entrenamiento Personal",
    icon: "Dumbbell",
    description: "Entrenamiento físico y fitness",
    fields: [
      { key: "sessions", label: "Número de sesiones", type: "number" },
      { key: "goal", label: "Objetivo", type: "select", options: ["Pérdida de peso", "Ganancia muscular", "Bienestar general"] }
    ],
    addons: [],
    deliveryTimeOptions: ["Por sesión", "Paquete mensual"],
    hasTracking: false
  },
  {
    slug: "motos",
    name: "Reparación de Motos",
    icon: "Motorcycle",
    description: "Reparación y mantenimiento de motocicletas",
    fields: [
      { key: "repairType", label: "Tipo de reparación", type: "select", options: ["Mecánica", "Eléctrica", "Llantas", "General"] }
    ],
    addons: [],
    deliveryTimeOptions: ["1 día", "2-3 días"],
    hasTracking: false
  },
  {
    slug: "otros",
    name: "Otros Servicios",
    icon: "Star",
    description: "Servicios varios",
    fields: [
      { key: "customDescription", label: "Describe tu servicio", type: "textarea", required: true }
    ],
    addons: [],
    deliveryTimeOptions: ["Flexible"],
    hasTracking: false
  }
];
