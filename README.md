# Oiga Usted

**La plataforma colombiana de gigs y servicios locales**

Oiga Usted conecta personas que necesitan servicios con freelancers y negocios locales confiables en Colombia (enfoque inicial en Bucaramanga).

## Estado Actual (Mayo 2026)

**✅ Funcionalidades Completas**
- Autenticación real con roles (Buyer, Seller, Admin) usando base de datos + bcrypt
- Creación de gigs con campos dinámicos inteligentes por categoría
- Listado, búsqueda y detalle de gigs
- Checkout con precios dinámicos + integración con Wompi
- Dashboards completos para Buyer, Seller y Admin
- Chat persistente dentro de las órdenes (con soporte de archivos)
- Sistema de reseñas y calificaciones
- Soporte completo de **modo claro/oscuro** (dark mode)
- Flujo de creación de órdenes, pagos y gestión de gigs

**🔧 Estado del Proyecto**
- La aplicación pasó por una limpieza importante post-revisión de código.
- La autenticación y los flujos principales ahora funcionan con datos reales en base de datos.
- El proyecto está listo para pruebas end-to-end.

## Cuentas Demo (para pruebas rápidas)

| Rol     | Email                | Contraseña |
|---------|----------------------|------------|
| Buyer   | buyer@demo.com       | demo1234   |
| Seller  | seller@demo.com      | demo1234   |
| Admin   | admin@demo.com       | demo1234   |

> También puedes registrarte normalmente desde `/signup`.

## Tecnologías

- **Next.js 16** (App Router)
- **TypeScript**
- **Prisma** + **SQLite** (desarrollo local) / **PostgreSQL** (producción)
- **NextAuth.js** (con Credentials + Google)
- **Tailwind + shadcn/ui**
- **Wompi** (pagos)
- **Vercel** (deploy)

> **Nota:** Para desarrollo local se usa SQLite (`prisma/dev.db`). En producción se recomienda PostgreSQL.

## Cómo Ejecutar Localmente

```bash
# 1. Instalar dependencias
npm install

# 2. Generar cliente de Prisma
npx prisma generate

# 3. Aplicar esquema a la base de datos local
npx prisma db push

# 4. Sembrar datos de prueba (incluye las 3 cuentas demo)
npm run seed

# 5. Iniciar el servidor de desarrollo
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) y usa las cuentas demo para iniciar sesión.

### Comandos útiles

```bash
npm run seed          # Re-sembrar cuentas demo
npx prisma studio     # Explorar la base de datos
```

## Dark Mode

La aplicación tiene soporte completo de modo claro/oscuro. Puedes cambiarlo usando el botón de sol/luna que aparece en todas las barras de navegación.

## Notas

- El proyecto pasó por una revisión exhaustiva de código. Muchos problemas de autenticación, integridad de datos y seguridad fueron corregidos.
- La integración con Wompi está funcional, pero se recomienda revisar la validación de webhooks antes de un despliegue real.

---

¿Quieres contribuir o probar la aplicación? ¡Usa las cuentas demo y explora los flujos de comprador y vendedor!