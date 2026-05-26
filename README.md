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

# 2. Copia las variables de entorno de ejemplo
cp .env.example .env.local

# 3. (Opcional pero recomendado) Resetea la base de datos y siembra datos de prueba
npm run db:reset

# 4. Iniciar el servidor de desarrollo
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) y usa las cuentas demo:

## Despliegue en Vercel (Producción)

For a complete step-by-step checklist, see [PRODUCTION_CHECKLIST.md](./PRODUCTION_CHECKLIST.md).

## Despliegue en Vercel (Producción)

1. Conecta el repositorio a Vercel.
2. En Vercel Dashboard → Settings → Environment Variables, agrega todas las variables de `.env.example` (usa PostgreSQL para `DATABASE_URL`).
3. **Importante para Auth**:
   - `NEXTAUTH_URL` debe ser tu dominio de producción: `https://oigagig.co.com`
   - Configura Google OAuth con el redirect URI de producción: `https://oigagig.co.com/api/auth/callback/google`
   - Asegúrate de tener HTTPS configurado en tu dominio personalizado (Vercel lo maneja automáticamente cuando agregas el dominio).
4. El build command ya incluye `prisma migrate deploy`, así que las migraciones se aplicarán automáticamente.
5. **Wompi**: Actualmente estamos usando llaves de **Sandbox (pruebas)**. Para recibir pagos reales debes cambiar a las llaves de producción (live).

### ⚠️ Estado Actual del Despliegue

- **Wompi**: Usando modo Sandbox (pagos de prueba). No se procesan pagos reales.
- Las herramientas de testing (botones de simulación, forzar estados de órdenes, etc.) están disponibles solo en desarrollo.

### Crear el primer usuario Admin (después del deploy)

Después del primer despliegue exitoso, ejecuta localmente con tu `DATABASE_URL` de producción:

```bash
# Crear admin con email y contraseña personalizados
DATABASE_URL="postgresql://..." npm run create-admin admin@oigagig.co.com TuPasswordSeguro123!
```

O usa Prisma Studio conectado directamente a tu base de datos de producción.

### Comandos útiles

```bash
npm run db:reset      # Fuerza reset + seed (solo desarrollo local)
npm run seed          # Solo re-sembrar cuentas demo (solo desarrollo)
npx prisma studio     # Explorar la base de datos
npm run build         # Verificar que todo compila correctamente
npm run create-admin  # Crear usuario admin (útil en producción)
```

## Dark Mode

La aplicación tiene soporte completo de modo claro/oscuro. Puedes cambiarlo usando el botón de sol/luna que aparece en todas las barras de navegación.

## Notas

- El proyecto pasó por una revisión exhaustiva de código. Muchos problemas de autenticación, integridad de datos y seguridad fueron corregidos.
- La integración con Wompi está funcional, pero se recomienda revisar la validación de webhooks antes de un despliegue real.

---

¿Quieres contribuir o probar la aplicación? ¡Usa las cuentas demo y explora los flujos de comprador y vendedor!