export const gigCategories = [
  {
    slug: "limpieza",
    name: "Limpieza de Hogar y Oficinas",
    icon: "🧹",
    fields: [
      { key: "rooms", label: "Número de habitaciones", type: "number", required: true },
      { key: "bathrooms", label: "Número de baños", type: "number" },
      { key: "deepClean", label: "Limpieza profunda", type: "checkbox", extraPrice: 45000 },
      { key: "windows", label: "Limpieza de ventanas", type: "checkbox", extraPrice: 25000 },
      { key: "kitchen", label: "Limpieza profunda de cocina", type: "checkbox", extraPrice: 30000 },
      { key: "pets", label: "Hay mascotas", type: "checkbox", extraPrice: 15000 }
    ]
  },
  {
    slug: "musica",
    name: "Música y DJ para Eventos",
    icon: "🎧",
    fields: [
      { key: "eventType", label: "Tipo de evento", type: "select", options: ["Boda", "Fiesta", "Corporativo", "Otro"] },
      { key: "hours", label: "Horas de servicio", type: "number", required: true },
      { key: "equipment", label: "Equipo propio incluido", type: "checkbox", extraPrice: 0 }
    ]
  },
  {
    slug: "asesoria",
    name: "Asesoría Legal y Tributaria",
    icon: "⚖️",
    fields: [
      { key: "serviceType", label: "Tipo de asesoría", type: "select", options: ["Impuestos", "Contratos", "Empresa", "Otro"] },
      { key: "urgency", label: "Urgencia", type: "select", options: ["Normal", "Alta"] }
    ]
  },
  {
    slug: "diseno",
    name: "Diseño Gráfico y Logos",
    icon: "🖼️",
    fields: [
      { key: "designType", label: "Tipo de diseño", type: "select", options: ["Logo", "Flyer", "Banner", "Redes Sociales"] },
      { key: "revisions", label: "Revisiones incluidas", type: "number", default: 3 },
      { key: "vector", label: "Archivo Vectorial", type: "checkbox", extraPrice: 20000 },
      { key: "png", label: "PNG Alta Resolución", type: "checkbox", extraPrice: 15000 }
    ]
  },
  {
    slug: "cocina",
    name: "Cocina Casera y Catering",
    icon: "🍲",
    fields: [
      { key: "people", label: "Número de personas", type: "number", required: true },
      { key: "cuisine", label: "Tipo de cocina", type: "select", options: ["Colombiana", "Internacional", "Vegetariana"] }
    ]
  },
  {
    slug: "fotografia",
    name: "Fotografía y Video",
    icon: "📸",
    fields: [
      { key: "sessionType", label: "Tipo de sesión", type: "select", options: ["Retrato", "Evento", "Producto", "Inmobiliaria"] },
      { key: "hours", label: "Horas de sesión", type: "number", required: true }
    ]
  },
  {
    slug: "transporte",
    name: "Transporte y Mudanzas",
    icon: "🚚",
    fields: [
      { key: "items", label: "Número de items / Volumen", type: "number", required: true },
      { key: "distance", label: "Distancia aproximada (km)", type: "number" },
      { key: "withLabor", label: "Con ayudantes", type: "checkbox", extraPrice: 80000 }
    ]
  },
  {
    slug: "belleza",
    name: "Belleza y Maquillaje a Domicilio",
    icon: "💄",
    fields: [
      { key: "serviceType", label: "Tipo de servicio", type: "select", options: ["Corte", "Maquillaje", "Manicure", "Spa"] },
      { key: "people", label: "Número de personas", type: "number" }
    ]
  },
  {
    slug: "clases",
    name: "Clases Particulares",
    icon: "📚",
    fields: [
      { key: "subject", label: "Materia", type: "text" },
      { key: "level", label: "Nivel", type: "select", options: ["Primaria", "Secundaria", "Universidad"] }
    ]
  },
  {
    slug: "artesanias",
    name: "Artesanías y Productos Hechos a Mano",
    icon: "🧶",
    fields: [
      { key: "itemType", label: "Tipo de producto", type: "select", options: ["Joyas", "Decoración", "Ropa", "Cerámica"] }
    ]
  },
  {
    slug: "cuidado",
    name: "Cuidado Holístico y Bienestar",
    icon: "🧘",
    fields: [
      { key: "serviceType", label: "Tipo de servicio", type: "select", options: ["Yoga", "Meditación", "Masaje", "Otro"] },
      { key: "sessions", label: "Número de sesiones", type: "number" }
    ]
  },
  {
    slug: "marketing",
    name: "Marketing Digital y Redes Sociales",
    icon: "📱",
    fields: [
      { key: "platform", label: "Plataforma principal", type: "select", options: ["Instagram", "Facebook", "TikTok"] },
      { key: "duration", label: "Duración de la campaña (días)", type: "number" }
    ]
  },
  {
    slug: "desarrollo",
    name: "Desarrollo Web y Tiendas Online",
    icon: "💻",
    fields: [
      { key: "projectType", label: "Tipo de proyecto", type: "select", options: ["Landing Page", "Tienda Online", "Sitio Web"] }
    ]
  },
  {
    slug: "video",
    name: "Edición de Video y Contenido Audiovisual",
    icon: "🎥",
    fields: [
      { key: "videoType", label: "Tipo de video", type: "select", options: ["Publicidad", "Evento", "YouTube"] },
      { key: "duration", label: "Duración aproximada (min)", type: "number" }
    ]
  },
  {
    slug: "asistente",
    name: "Asistente Virtual y Soporte Administrativo",
    icon: "📋",
    fields: [
      { key: "hours", label: "Horas por semana", type: "number" },
      { key: "tasks", label: "Tipo de tareas", type: "text" }
    ]
  },
  {
    slug: "redaccion",
    name: "Redacción de Contenidos y Copywriting",
    icon: "✍️",
    fields: [
      { key: "contentType", label: "Tipo de contenido", type: "select", options: ["Artículos", "Copy Publicitario", "Redes Sociales"] }
    ]
  },
  {
    slug: "reparaciones",
    name: "Reparaciones y Mantenimiento del Hogar",
    icon: "🔧",
    fields: [
      { key: "repairType", label: "Tipo de reparación", type: "select", options: ["Plomería", "Eléctrica", "Carpintería", "Pintura"] },
      { key: "urgency", label: "Urgencia", type: "select", options: ["Normal", "Mismo día"] }
    ]
  },
  {
    slug: "idiomas",
    name: "Clases de Idiomas y Tutorías Online",
    icon: "🗣️",
    fields: [
      { key: "language", label: "Idioma", type: "text" },
      { key: "level", label: "Nivel", type: "select", options: ["Principiante", "Intermedio", "Avanzado"] }
    ]
  },
  {
    slug: "interiores",
    name: "Diseño de Interiores y Arquitectura",
    icon: "🏠",
    fields: [
      { key: "projectType", label: "Tipo de proyecto", type: "select", options: ["Residencial", "Comercial", "Remodelación"] }
    ]
  },
  {
    slug: "eventos",
    name: "Gestión de Eventos y Organización de Fiestas",
    icon: "🎉",
    fields: [
      { key: "eventType", label: "Tipo de evento", type: "select", options: ["Boda", "Cumpleaños", "Corporativo"] },
      { key: "guests", label: "Número aproximado de invitados", type: "number" }
    ]
  }
];
