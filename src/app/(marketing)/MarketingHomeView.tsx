'use client';

import dynamic from 'next/dynamic';
import { HomeNavbar } from '@/components/homepage/HomeNavbar';
import { HomeHero } from '@/components/homepage/HomeHero';
import { CategoriesSection } from '@/components/homepage/CategoriesSection';
import { StatsAndPopular } from '@/components/homepage/StatsAndPopular';
import { HomeFooter } from '@/components/homepage/HomeFooter';
import type { HomepageCategory } from '@/components/homepage/CategoriesSection';
import type { HomepageStats, PopularGig } from '@/components/homepage/StatsAndPopular';
import type { HomepageTestimonial } from '@/components/homepage/TestimonialsCarousel';

const HomepageWelcomeSplash = dynamic(
  () =>
    import('./HomepageWelcomeSplash').then((m) => ({ default: m.HomepageWelcomeSplash })),
  { ssr: false },
);

const HowItWorks = dynamic(
  () => import('@/components/homepage/HowItWorks').then((m) => ({ default: m.HowItWorks })),
  { ssr: false },
);

const TestimonialsCarousel = dynamic(
  () =>
    import('@/components/homepage/TestimonialsCarousel').then((m) => ({
      default: m.TestimonialsCarousel,
    })),
  { ssr: false },
);

const SellerPromoCTA = dynamic(
  () =>
    import('@/components/homepage/SellerPromoCTA').then((m) => ({ default: m.SellerPromoCTA })),
  { ssr: false },
);

interface MarketingHomeViewProps {
  categories: HomepageCategory[];
  stats: HomepageStats;
  popularGigs: PopularGig[];
  testimonials: HomepageTestimonial[];
}

export function MarketingHomeView({
  categories,
  stats,
  popularGigs,
  testimonials,
}: MarketingHomeViewProps) {
  return (
    <>
      <HomepageWelcomeSplash />
      <HomeNavbar />
      <main>
        <HomeHero />
        <CategoriesSection categories={categories} />
        <StatsAndPopular stats={stats} popularGigs={popularGigs} />
        <HowItWorks />
        <TestimonialsCarousel testimonials={testimonials} />
        <SellerPromoCTA />
      </main>
      <HomeFooter />
    </>
  );
}