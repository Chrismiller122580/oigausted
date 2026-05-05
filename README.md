# Oiga Usted

**La plataforma colombiana de gigs y servicios locales**

## Descripción
Oiga Usted conecta personas que necesitan servicios con freelancers y negocios locales confiables en Colombia (enfoque inicial en Bucaramanga).

## Estado Actual (Mayo 2026)

**✅ Funcionalidades Completas**
- Autenticación con roles (Buyer, Seller, Admin)
- Creación de gigs con campos dinámicos por categoría
- Listado y detalle de gigs
- Checkout inteligente + creación de órdenes
- Dashboards para Buyer y Seller
- Chat persistente dentro de las órdenes (con archivos)
- Base de datos PostgreSQL conectada

**🔴 Prioridad Actual**
- Hacer que **Wompi** funcione de forma confiable (el widget no abre consistentemente)

## Tecnologías
- Next.js 16 (App Router)
- TypeScript
- Prisma + PostgreSQL (Vercel Postgres)
- NextAuth.js
- Tailwind + shadcn/ui
- Vercel (Deploy)

## Cómo Ejecutar Localmente

```bash
npm install
npx prisma generate
npm run dev