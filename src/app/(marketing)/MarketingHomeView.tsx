import dynamic from 'next/dynamic';
import { WorldwideHeader } from '@/components/marketing/WorldwideHeader';
import { HomeHero } from '@/components/homepage/HomeHero';
import { HomeFooter } from '@/components/homepage/HomeFooter';
import { CountryMapSection } from '@/components/homepage/CountryMapSection';
import type { HomepageCategory } from '@/components/homepage/CategoriesSection';
import type { HomepageStats, PopularGig } from '@/components/homepage/StatsAndPopular';
import type { HomepageTestimonial } from '@/components/homepage/TestimonialsCarousel';
import { MarketingHomeWelcome } from './MarketingHomeWelcome';
import { MarketingHomeBelowFold } from './MarketingHomeBelowFold';
import { WorldMapHashScroll } from '@/components/homepage/WorldMapHashScroll';

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
  sellerCounts: Record<string, number>;
}

export function MarketingHomeView({
  categories,
  stats,
  popularGigs,
  testimonials,
  sellerCounts,
}: MarketingHomeViewProps) {
  return (
    <>
      <MarketingHomeWelcome />
      <WorldMapHashScroll />
      <WorldwideHeader activeCountry="co" />
      <main>
        <HomeHero />
        <CountryMapSection sellerCounts={sellerCounts} />
        <CategoriesSection categories={categories} />
        <StatsAndPopular stats={stats} popularGigs={popularGigs} />
        <MarketingHomeBelowFold testimonials={testimonials} />
      </main>
      <HomeFooter />
    </>
  );
}