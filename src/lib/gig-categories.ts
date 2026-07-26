export const gigCategories = [
  {
    name: "Limpieza de Hogar y Oficinas",
    icon: "🧹",
    fields: [
      { key: "rooms", label: "Número de habitaciones", type: "number", extraPrice: 35000 },
      { key: "bathrooms", label: "Número de baños", type: "number", extraPrice: 25000 },
      { key: "kitchen", label: "Cocina incluida", type: "checkbox", extraPrice: 40000 },
      { key: "deepClean", label: "Limpieza profunda", type: "checkbox", extraPrice: 60000 }
    ]
  },
  {
    name: "Música y DJ para Eventos",
    icon: "🎧",
    fields: [
      { key: "hours", label: "Horas de servicio", type: "number", extraPrice: 45000 },
      { key: "guests", label: "Número de invitados", type: "number", extraPrice: 15000 },
      { key: "soundSystem", label: "Sistema de sonido premium", type: "checkbox", extraPrice: 80000 }
    ]
  },
  {
    name: "Asesoría Legal y Tributaria",
    icon: "⚖️",
    fields: [
      { key: "serviceType", label: "Tipo de asesoría", type: "select", options: [
        { label: "Revisión de contratos", extraPrice: 50000 },
        { label: "Declaración de impuestos", extraPrice: 80000 },
        { label: "Asesoría general", extraPrice: 30000 }
      ] },
      { key: "urgency", label: "Urgencia", type: "checkbox", extraPrice: 120000 }
    ]
  },
  {
    name: "Diseño Gráfico y Logos",
    icon: "🖼️",
    fields: [
      { key: "revisions", label: "Número de revisiones incluidas", type: "number", extraPrice: 25000 },
      { key: "sourceFiles", label: "Archivos fuente incluidos", type: "checkbox", extraPrice: 40000 }
    ]
  },
  {
    name: "Cocina Casera y Catering",
    icon: "🍲",
    fields: [
      { key: "guests", label: "Número de personas", type: "number", extraPrice: 18000 },
      { key: "delivery", label: "Entrega a domicilio", type: "checkbox", extraPrice: 35000 }
    ]
  },
  {
    name: "Fotografía y Video",
    icon: "📸",
    fields: [
      { key: "hours", label: "Horas de sesión", type: "number", extraPrice: 40000 },
      { key: "editing", label: "Edición incluida", type: "checkbox", extraPrice: 60000 }
    ]
  },
  {
    name: "Transporte y Mudanzas",
    icon: "🚚",
    fields: [
      { key: "rooms", label: "Número de habitaciones", type: "number", extraPrice: 80000 },
      { key: "distance", label: "Distancia aproximada (km)", type: "number", extraPrice: 5000 }
    ]
  },
  {
    name: "Mensajería y Delivery",
    icon: "📦",
    fields: [
      { key: "distance", label: "Distancia aproximada (km)", type: "number", extraPrice: 8000 },
      { key: "packageSize", label: "Tamaño del paquete", type: "select", options: [
        { label: "Pequeño (sobre o caja chica)", extraPrice: 0 },
        { label: "Mediano", extraPrice: 8000 },
        { label: "Grande", extraPrice: 18000 }
      ] },
      { key: "urgency", label: "Entrega express (mismo día)", type: "checkbox", extraPrice: 15000 }
    ]
  },
  {
    name: "Belleza y Maquillaje a Domicilio",
    icon: "💄",
    fields: [
      { key: "people", label: "Número de personas", type: "number", extraPrice: 25000 },
      { key: "travel", label: "Desplazamiento", type: "checkbox", extraPrice: 30000 }
    ]
  },
  {
    name: "Clases Particulares",
    icon: "📚",
    fields: [
      { key: "sessions", label: "Número de sesiones", type: "number", extraPrice: 35000 },
      { key: "online", label: "Clase online", type: "checkbox", extraPrice: 0 }
    ]
  },
  {
    name: "Artesanías y Productos Hechos a Mano",
    icon: "🧶",
    fields: [
      { key: "quantity", label: "Cantidad de piezas", type: "number", extraPrice: 15000 }
    ]
  },
  {
    name: "Cuidado Holístico y Bienestar",
    icon: "🧘",
    fields: [
      { key: "sessions", label: "Número de sesiones", type: "number", extraPrice: 45000 },
      { key: "homeVisit", label: "Visita a domicilio", type: "checkbox", extraPrice: 30000 }
    ]
  },
  {
    name: "Marketing Digital y Redes Sociales",
    icon: "📱",
    fields: [
      { key: "months", label: "Meses de gestión", type: "number", extraPrice: 80000 }
    ]
  },
  {
    name: "Desarrollo Web y Tiendas Online",
    icon: "💻",
    fields: [
      { key: "pages", label: "Número de páginas", type: "number", extraPrice: 120000 }
    ]
  },
  {
    name: "Edición de Video y Contenido Audiovisual",
    icon: "🎥",
    fields: [
      { key: "minutes", label: "Minutos de video", type: "number", extraPrice: 25000 }
    ]
  },
  {
    name: "Asistente Virtual y Soporte Administrativo",
    icon: "📋",
    fields: [
      { key: "hours", label: "Horas por semana", type: "number", extraPrice: 35000 }
    ]
  },
  {
    name: "Redacción de Contenidos y Copywriting",
    icon: "✍️",
    fields: [
      { key: "words", label: "Número de palabras", type: "number", extraPrice: 8000 }
    ]
  },
  {
    name: "Reparaciones y Mantenimiento del Hogar",
    icon: "🔧",
    fields: [
      { key: "urgency", label: "Urgencia (mismo día)", type: "checkbox", extraPrice: 50000 }
    ]
  },
  {
    name: "Plomería y Fontanería",
    icon: "🚰",
    fields: [
      { key: "repairs", label: "Número de reparaciones o instalaciones", type: "number", extraPrice: 28000 },
      { key: "materials", label: "Materiales incluidos por el profesional", type: "checkbox", extraPrice: 55000 },
      { key: "urgency", label: "Urgencia (mismo día)", type: "checkbox", extraPrice: 65000 }
    ]
  },
  {
    name: "Clases de Idiomas y Tutorías Online",
    icon: "🗣️",
    fields: [
      { key: "hours", label: "Horas por semana", type: "number", extraPrice: 40000 }
    ]
  },
  {
    name: "Diseño de Interiores y Arquitectura",
    icon: "🏠",
    fields: [
      { key: "rooms", label: "Número de espacios", type: "number", extraPrice: 80000 }
    ]
  },
  {
    name: "Gestión de Eventos y Organización de Fiestas",
    icon: "🎉",
    fields: [
      { key: "guests", label: "Número de invitados", type: "number", extraPrice: 15000 },
      { key: "hours", label: "Horas de coordinación", type: "number", extraPrice: 45000 }
    ]
  },
  {
    name: "Turismo",
    icon: "🗺️",
    fields: [
      { key: "people", label: "Número de personas", type: "number", extraPrice: 20000 },
      { key: "hours", label: "Duración del tour (horas)", type: "number", extraPrice: 35000 },
      { key: "transport", label: "Transporte incluido", type: "checkbox", extraPrice: 45000 },
      { key: "language", label: "Idioma del guía", type: "select", options: [
        { label: "Español", extraPrice: 0 },
        { label: "Inglés", extraPrice: 15000 },
        { label: "Francés", extraPrice: 20000 },
        { label: "Portugués", extraPrice: 15000 }
      ] }
    ]
  },
  {
    name: "Recursos Naturales y Minerales",
    icon: "🌿",
    fields: [
      { key: "resourceType", label: "Tipo de recurso", type: "select", options: [
        { label: "Carbón", extraPrice: 0 },
        { label: "Oro", extraPrice: 50000 },
        { label: "Cobre", extraPrice: 35000 },
        { label: "Plantas", extraPrice: 15000 },
        { label: "Árboles", extraPrice: 25000 },
        { label: "Frutas", extraPrice: 12000 },
        { label: "Semillas", extraPrice: 10000 },
        { label: "Otros minerales", extraPrice: 20000 }
      ] },
      { key: "quantity", label: "Cantidad", type: "number", extraPrice: 8000 },
      { key: "unit", label: "Unidad de medida", type: "select", options: [
        { label: "Toneladas", extraPrice: 0 },
        { label: "Kilogramos", extraPrice: 5000 },
        { label: "Unidades", extraPrice: 3000 },
        { label: "Metros cúbicos", extraPrice: 15000 }
      ] },
      { key: "transport", label: "Transporte/entrega incluido", type: "checkbox", extraPrice: 45000 },
      { key: "certification", label: "Certificación de calidad u origen", type: "checkbox", extraPrice: 30000 }
    ]
  },
  {
    name: "Servicios de Recursos Naturales",
    icon: "⛏️",
    fields: [
      { key: "serviceType", label: "Tipo de servicio", type: "select", options: [
        { label: "Minería y extracción", extraPrice: 80000 },
        { label: "Forestal y tala", extraPrice: 55000 },
        { label: "Agricultura y cultivo", extraPrice: 40000 },
        { label: "Consultoría ambiental", extraPrice: 60000 },
        { label: "Transporte de recursos", extraPrice: 35000 },
        { label: "Otro", extraPrice: 0 }
      ] },
      { key: "hours", label: "Horas o días de servicio", type: "number", extraPrice: 40000 },
      { key: "area", label: "Área o volumen aproximado", type: "number", extraPrice: 25000 },
      { key: "equipment", label: "Equipo y maquinaria incluidos", type: "checkbox", extraPrice: 70000 },
      { key: "permits", label: "Gestión de permisos/licencias incluida", type: "checkbox", extraPrice: 50000 }
    ]
  },
  {
    name: "Venta de Autos y Vehículos",
    icon: "🚗",
    fields: [
      { key: "vehicleType", label: "Tipo de vehículo", type: "select", options: [
        { label: "Auto / carro", extraPrice: 0 },
        { label: "Moto", extraPrice: 0 },
        { label: "Camioneta / SUV", extraPrice: 25000 },
        { label: "Camión / utilitario", extraPrice: 50000 },
        { label: "Otro", extraPrice: 0 }
      ] },
      { key: "condition", label: "Condición", type: "select", options: [
        { label: "Usado", extraPrice: 0 },
        { label: "Nuevo", extraPrice: 40000 }
      ] },
      { key: "year", label: "Año del modelo", type: "number", extraPrice: 5000 },
      { key: "inspection", label: "Inspección / peritaje incluido", type: "checkbox", extraPrice: 80000 },
      { key: "testDrive", label: "Prueba de manejo incluida", type: "checkbox", extraPrice: 25000 },
      { key: "delivery", label: "Entrega o traslado del vehículo", type: "checkbox", extraPrice: 120000 }
    ]
  }
];

export default gigCategories;
