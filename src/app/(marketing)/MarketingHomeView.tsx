import dynamic from 'next/dynamic';
import { HomeNavbar } from '@/components/homepage/HomeNavbar';
import { HomeHero } from '@/components/homepage/HomeHero';
import { HomeFooter } from '@/components/homepage/HomeFooter';
import type { HomepageCategory } from '@/components/homepage/CategoriesSection';
import type { HomepageStats, PopularGig } from '@/components/homepage/StatsAndPopular';
import type { HomepageTestimonial } from '@/components/homepage/TestimonialsCarousel';
import { MarketingHomeWelcome } from './MarketingHomeWelcome';
import { MarketingHomeBelowFold } from './MarketingHomeBelowFold';
import { DocumentosHomeSection } from '@/components/homepage/DocumentosHomeSection';

const CategoriesSection = dynamic(
  () =>
    import('@/components/homepage/CategoriesSection').then((m) => ({
      default: m.CategoriesSection,
    })),
  { ssr: true },
);

const StatsAndPopular = dynamic(
  () =>
    import('@/components/homepage/StatsAndPopular').then((m) => ({
      default: m.StatsAndPopular,
    })),
  { ssr: true },
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
      <MarketingHomeWelcome />
      <HomeNavbar />
      <main>
        <HomeHero />
        <CategoriesSection categories={categories} />
        <DocumentosHomeSection />
        <StatsAndPopular stats={stats} popularGigs={popularGigs} />
        <MarketingHomeBelowFold testimonials={testimonials} />
      </main>
      <HomeFooter />
    </>
  );
}