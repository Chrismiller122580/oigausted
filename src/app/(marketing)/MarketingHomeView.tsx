import { HomeNavbar } from '@/components/homepage/HomeNavbar';
import { HomeHero } from '@/components/homepage/HomeHero';
import { CategoriesSection } from '@/components/homepage/CategoriesSection';
import { StatsAndPopular } from '@/components/homepage/StatsAndPopular';
import { HomeFooter } from '@/components/homepage/HomeFooter';
import type { HomepageCategory } from '@/components/homepage/CategoriesSection';
import type { HomepageStats, PopularGig } from '@/components/homepage/StatsAndPopular';
import type { HomepageTestimonial } from '@/components/homepage/TestimonialsCarousel';
import { MarketingHomeWelcome } from './MarketingHomeWelcome';
import { MarketingHomeBelowFold } from './MarketingHomeBelowFold';

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
        <StatsAndPopular stats={stats} popularGigs={popularGigs} />
        <MarketingHomeBelowFold testimonials={testimonials} />
      </main>
      <HomeFooter />
    </>
  );
}