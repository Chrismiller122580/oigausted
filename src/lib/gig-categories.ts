export const gigCategories = [
  {
    slug: "limpieza",
    name: "Limpieza de Hogar y Oficinas",
    icon: "🧹",
    fields: [
      { key: "rooms", label: "Número de habitaciones", type: "number", required: true, extraPrice: 35000 },
      { key: "bathrooms", label: "Número de baños", type: "number", extraPrice: 25000 },
      { key: "kitchen", label: "Limpieza profunda de cocina", type: "checkbox", extraPrice: 45000 },
      { key: "windows", label: "Limpieza de ventanas", type: "checkbox", extraPrice: 30000 },
      { key: "deepClean", label: "Limpieza profunda completa", type: "checkbox", extraPrice: 80000 },
      { key: "pets", label: "Hay mascotas", type: "checkbox", extraPrice: 20000 }
    ]
  },
  {
    slug: "musica",
    name: "Música y DJ para Eventos",
    icon: "🎧",
    fields: [
      { key: "eventType", label: "Tipo de evento", type: "select", options: ["Boda", "Fiesta", "Corporativo", "Otro"] },
      { key: "hours", label: "Horas de servicio", type: "number", required: true, extraPrice: 120000 },
      { key: "equipment", label: "Equipo premium (luces + humo)", type: "checkbox", extraPrice: 150000 },
      { key: "travel", label: "Desplazamiento fuera de Bogotá", type: "checkbox", extraPrice: 80000 }
    ]
  },
  {
    slug: "asesoria",
    name: "Asesoría Legal y Tributaria",
    icon: "⚖️",
    fields: [
      { key: "serviceType", label: "Tipo de asesoría", type: "select", options: ["Impuestos", "Contratos", "Empresa", "Otro"] },
      { key: "urgency", label: "Urgencia", type: "select", options: ["Normal", "Alta"] },
      { key: "documents", label: "Revisión de documentos", type: "checkbox", extraPrice: 120000 }
    ]
  },
  {
    slug: "diseno",
    name: "Diseño Gráfico y Logos",
    icon: "🖼️",
    fields: [
      { key: "designType", label: "Tipo de diseño", type: "select", options: ["Logo", "Flyer", "Banner", "Redes Sociales", "Packaging"] },
      { key: "revisions", label: "Revisiones incluidas", type: "number", extraPrice: 0 },
      { key: "vector", label: "Archivo Vectorial", type: "checkbox", extraPrice: 50000 },
      { key: "source", label: "Archivos fuente (AI/PSD)", type: "checkbox", extraPrice: 80000 }
    ]
  },
  {
    slug: "cocina",
    name: "Cocina Casera y Catering",
    icon: "🍲",
    fields: [
      { key: "people", label: "Número de personas", type: "number", required: true, extraPrice: 15000 },
      { key: "cuisine", label: "Tipo de cocina", type: "select", options: ["Colombiana", "Internacional", "Vegetariana", "Vegana"] },
      { key: "delivery", label: "Entrega a domicilio", type: "checkbox", extraPrice: 35000 }
    ]
  },
  {
    slug: "fotografia",
    name: "Fotografía y Video",
    icon: "📸",
    fields: [
      { key: "sessionType", label: "Tipo de sesión", type: "select", options: ["Retrato", "Evento", "Producto", "Inmobiliaria", "Video"] },
      { key: "hours", label: "Horas de sesión", type: "number", required: true, extraPrice: 80000 },
      { key: "drone", label: "Tomas con dron", type: "checkbox", extraPrice: 150000 }
    ]
  },
  {
    slug: "transporte",
    name: "Transporte y Mudanzas",
    icon: "🚚",
    fields: [
      { key: "items", label: "Volumen aproximado (m³)", type: "number", required: true, extraPrice: 45000 },
      { key: "distance", label: "Distancia (km)", type: "number", extraPrice: 0 },
      { key: "withLabor", label: "Con ayudantes de carga", type: "checkbox", extraPrice: 120000 }
    ]
  },
  {
    slug: "belleza",
    name: "Belleza y Maquillaje a Domicilio",
    icon: "💄",
    fields: [
      { key: "serviceType", label: "Tipo de servicio", type: "select", options: ["Maquillaje", "Corte", "Manicure", "Spa Facial", "Peinado"] },
      { key: "people", label: "Número de personas", type: "number", extraPrice: 45000 },
      { key: "travel", label: "Desplazamiento", type: "checkbox", extraPrice: 25000 }
    ]
  },
  {
    slug: "clases",
    name: "Clases Particulares",
    icon: "📚",
    fields: [
      { key: "subject", label: "Materia o tema", type: "text" },
      { key: "level", label: "Nivel", type: "select", options: ["Primaria", "Secundaria", "Universidad", "Adultos"] },
      { key: "sessions", label: "Número de clases", type: "number", extraPrice: 0 }
    ]
  },
  {
    slug: "artesanias",
    name: "Artesanías y Productos Hechos a Mano",
    icon: "🧶",
    fields: [
      { key: "itemType", label: "Tipo de producto", type: "select", options: ["Joyas", "Decoración", "Ropa", "Cerámica", "Personalizado"] },
      { key: "custom", label: "Personalizado", type: "checkbox", extraPrice: 60000 }
    ]
  },
  {
    slug: "cuidado",
    name: "Cuidado Holístico y Bienestar",
    icon: "🧘",
    fields: [
      { key: "serviceType", label: "Tipo de servicio", type: "select", options: ["Yoga", "Meditación", "Masaje", "Reiki", "Terapia"] },
      { key: "sessions", label: "Número de sesiones", type: "number", extraPrice: 0 },
      { key: "homeVisit", label: "Visita a domicilio", type: "checkbox", extraPrice: 40000 }
    ]
  },
  {
    slug: "marketing",
    name: "Marketing Digital y Redes Sociales",
    icon: "📱",
    fields: [
      { key: "platform", label: "Plataforma principal", type: "select", options: ["Instagram", "Facebook", "TikTok", "Google Ads"] },
      { key: "duration", label: "Duración de la campaña (días)", type: "number", extraPrice: 0 },
      { key: "content", label: "Creación de contenido incluida", type: "checkbox", extraPrice: 250000 }
    ]
  },
  {
    slug: "desarrollo",
    name: "Desarrollo Web y Tiendas Online",
    icon: "💻",
    fields: [
      { key: "projectType", label: "Tipo de proyecto", type: "select", options: ["Landing Page", "Tienda Online", "Sitio Web Corporativo", "App"] },
      { key: "pages", label: "Número de páginas", type: "number", extraPrice: 180000 }
    ]
  },
  {
    slug: "video",
    name: "Edición de Video y Contenido Audiovisual",
    icon: "🎥",
    fields: [
      { key: "videoType", label: "Tipo de video", type: "select", options: ["Publicidad", "Evento", "YouTube", "Drone"] },
      { key: "duration", label: "Duración aproximada (min)", type: "number", extraPrice: 0 },
      { key: "drone", label: "Incluye dron", type: "checkbox", extraPrice: 120000 }
    ]
  },
  {
    slug: "asistente",
    name: "Asistente Virtual y Soporte Administrativo",
    icon: "📋",
    fields: [
      { key: "hours", label: "Horas por semana", type: "number", required: true, extraPrice: 0 },
      { key: "tasks", label: "Tareas principales", type: "text" }
    ]
  },
  {
    slug: "redaccion",
    name: "Redacción de Contenidos y Copywriting",
    icon: "✍️",
    fields: [
      { key: "contentType", label: "Tipo de contenido", type: "select", options: ["Artículos", "Copy Publicitario", "Redes Sociales", "Email"] },
      { key: "words", label: "Número aproximado de palabras", type: "number", extraPrice: 0 }
    ]
  },
  {
    slug: "reparaciones",
    name: "Reparaciones y Mantenimiento del Hogar",
    icon: "🔧",
    fields: [
      { key: "repairType", label: "Tipo de reparación", type: "select", options: ["Plomería", "Eléctrica", "Carpintería", "Pintura", "Techos"] },
      { key: "urgency", label: "Urgencia", type: "select", options: ["Normal", "Mismo día"] },
      { key: "materials", label: "Materiales incluidos", type: "checkbox", extraPrice: 80000 }
    ]
  },
  {
    slug: "idiomas",
    name: "Clases de Idiomas y Tutorías Online",
    icon: "🗣️",
    fields: [
      { key: "language", label: "Idioma", type: "text" },
      { key: "level", label: "Nivel", type: "select", options: ["Principiante", "Intermedio", "Avanzado"] },
      { key: "sessions", label: "Número de clases", type: "number", extraPrice: 0 }
    ]
  },
  {
    slug: "interiores",
    name: "Diseño de Interiores y Arquitectura",
    icon: "🏠",
    fields: [
      { key: "projectType", label: "Tipo de proyecto", type: "select", options: ["Residencial", "Comercial", "Remodelación"] },
      { key: "area", label: "Área aproximada (m²)", type: "number", extraPrice: 0 }
    ]
  },
  {
    slug: "eventos",
    name: "Gestión de Eventos y Organización de Fiestas",
    icon: "🎉",
    fields: [
      { key: "eventType", label: "Tipo de evento", type: "select", options: ["Boda", "Cumpleaños", "Corporativo", "Otro"] },
      { key: "guests", label: "Número aproximado de invitados", type: "number", extraPrice: 0 },
      { key: "decoration", label: "Decoración incluida", type: "checkbox", extraPrice: 350000 }
    ]
  }
];
