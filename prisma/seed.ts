import { prisma } from '../src/lib/prisma';
import bcrypt from 'bcryptjs';

const DEMO_PASSWORD = 'demo1234';

async function main() {
  console.log("🌱 Seeding demo users + sample gigs...");

  const hashedPassword = await bcrypt.hash(DEMO_PASSWORD, 10);

  // Demo users with stable UUIDs (so FKs and sessions are consistent)
  await prisma.user.upsert({
    where: { id: "11111111-1111-1111-1111-111111111111" },
    update: { password: hashedPassword },
    create: {
      id: "11111111-1111-1111-1111-111111111111",
      name: "Buyer Demo",
      email: "buyer@demo.com",
      role: "buyer",
      password: hashedPassword,
    },
  });

  await prisma.user.upsert({
    where: { id: "22222222-2222-2222-2222-222222222222" },
    update: { password: hashedPassword },
    create: {
      id: "22222222-2222-2222-2222-222222222222",
      name: "Seller Demo",
      email: "seller@demo.com",
      role: "seller",
      password: hashedPassword,
    },
  });

  await prisma.user.upsert({
    where: { id: "33333333-3333-3333-3333-333333333333" },
    update: { password: hashedPassword },
    create: {
      id: "33333333-3333-3333-3333-333333333333",
      name: "Admin Demo",
      email: "admin@demo.com",
      role: "admin",
      password: hashedPassword,
    },
  });

  console.log("✅ Demo users seeded (password: demo1234)");

  // Sample gigs belonging to the demo seller
  await prisma.gig.createMany({
    data: [
      {
        title: "Limpieza Profunda de Apartamento en Bogotá",
        description: "Limpieza completa con productos ecológicos. Incluye cocina, baños y salas.",
        price: 185000,
        category: "Limpieza de Hogar y Oficinas",
        imageUrl: "https://picsum.photos/id/1015/600/400",
        sellerId: "22222222-2222-2222-2222-222222222222",
        completionTime: "1-2 días"
      },
      {
        title: "Clases de Inglés Conversacional Personalizadas",
        description: "Mejora tu inglés con clases enfocadas en conversación y negocios.",
        price: 65000,
        category: "Clases de Idiomas y Tutorías Online",
        imageUrl: "https://picsum.photos/id/201/600/400",
        sellerId: "22222222-2222-2222-2222-222222222222",
        completionTime: "Por sesión"
      },
      {
        title: "Diseño de Logos y Branding Profesional",
        description: "Diseño moderno y memorable para tu marca. Incluye 3 revisiones.",
        price: 450000,
        category: "Diseño Gráfico y Logos",
        imageUrl: "https://picsum.photos/id/180/600/400",
        sellerId: "22222222-2222-2222-2222-222222222222",
        completionTime: "3-5 días"
      }
    ],
  });

  console.log("✅ 3 sample gigs created successfully!");
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
