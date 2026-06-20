import { prisma } from '@/lib/prisma';
import { getGigCategories } from '@/lib/categories';
import { getCategoryIcon } from '@/lib/icon-registry';
import { MarketingHomeView } from './MarketingHomeView';

export const revalidate = 60;

export default async function MarketingHomePage() {
  const allCategories = await getGigCategories();
  const topCategoryNames = allCategories.slice(0, 12).map((c) => c.name);

  // Pro counts per category
  let proCountMap: Record<string, number> = {};
  try {
    const gigCounts = await prisma.gig.groupBy({
      by: ['category'],
      where: { isActive: true, category: { in: topCategoryNames } },
      _count: { id: true },
    });
    proCountMap = Object.fromEntries(
      gigCounts
        .filter((g: { category: string | null }) => g.category)
        .map((g: { category: string | null; _count: { id: number } }) => [
          g.category!,
          g._count.id,
        ])
    );
  } catch (e) {
    console.error('Failed to load category pro counts:', e);
  }

  const popularCategories = topCategoryNames.map((name) => {
    const cat = allCategories.find((c) => c.name === name);
    return {
      name,
      icon: getCategoryIcon(name),
      description: (cat?.description as string | undefined) || 'Profesionales locales disponibles',
      proCount: proCountMap[name] || 0,
    };
  });

  // Live stats
  let stats = { gigs: 0, reviews: 0, cities: 0, sellers: 0 };
  try {
    const [totalGigs, totalReviews, cityAgg, totalSellers] = await Promise.all([
      prisma.gig.count({ where: { isActive: true } }),
      prisma.review.count(),
      prisma.gig.findMany({
        where: { isActive: true, city: { not: null } },
        select: { city: true },
        distinct: ['city'],
      }),
      prisma.user.count({ where: { role: 'seller' } }),
    ]);
    stats = {
      gigs: totalGigs,
      reviews: totalReviews,
      cities: cityAgg.length,
      sellers: totalSellers,
    };
  } catch (e) {
    console.error('Failed to load homepage stats:', e);
  }

  // Popular gigs for horizontal scroll
  let popularGigs: {
    id: string;
    title: string;
    price: number;
    category: string | null;
    imageUrl: string | null;
    city: string | null;
    seller: {
      name: string | null;
      businessName: string | null;
      rating: number | null;
      reviewCount: number | null;
    } | null;
  }[] = [];

  try {
    popularGigs = await prisma.gig.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
      take: 12,
      select: {
        id: true,
        title: true,
        price: true,
        category: true,
        imageUrl: true,
        city: true,
        seller: {
          select: {
            name: true,
            businessName: true,
            rating: true,
            reviewCount: true,
          },
        },
      },
    });
  } catch (e) {
    console.error('Failed to load popular gigs:', e);
  }

  const testimonials = [
    {
      quote:
        'Encontré una plomera excelente en 20 minutos. El trabajo quedó perfecto y el pago fue seguro con Wompi.',
      name: 'Laura Mendoza',
      role: 'Propietaria',
      city: 'Bucaramanga',
    },
    {
      quote:
        'Contraté un fotógrafo para el evento de mi empresa. Calidad profesional, comunicación directa y precio justo.',
      name: 'Carlos Ramírez',
      role: 'Gerente de Eventos',
      city: 'Bogotá',
    },
    {
      quote:
        'La tutora de inglés que encontré aquí es increíble. Mis hijos avanzaron muchísimo en solo un mes.',
      name: 'Sofía Vargas',
      role: 'Madre de familia',
      city: 'Medellín',
    },
    {
      quote:
        'Publicar mi servicio de catering fue muy fácil. Ya tengo clientes recurrentes gracias a las reseñas reales.',
      name: 'Andrés López',
      role: 'Chef & Catering',
      city: 'Cali',
    },
  ];

  return (
    <MarketingHomeView
      categories={popularCategories}
      stats={stats}
      popularGigs={popularGigs}
      testimonials={testimonials}
    />
  );
}