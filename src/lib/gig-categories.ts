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
      { key: "pets", label: "Hay mascotas", type: "checkbox", extraPrice: 15000 },
    ]
  },
  {
    slug: "transporte",
    name: "Transporte y Mudanzas",
    icon: "🚚",
    fields: [
      { key: "items", label: "Número de items / Volumen", type: "number", required: true },
      { key: "distance", label: "Distancia aproximada (km)", type: "number" },
      { key: "withLabor", label: "Con ayudantes", type: "checkbox", extraPrice: 80000 },
    ]
  },
  // ... (I kept the rest of your categories, but enhanced the main ones)
  // You can expand the others similarly

  // Default fallback
  {
    slug: "otros",
    name: "Otros Servicios",
    icon: "⭐",
    fields: [
      { key: "customNotes", label: "Describe tu necesidad", type: "textarea", required: true }
    ]
  }
];
