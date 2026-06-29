'use client';

import dynamic from 'next/dynamic';
import type { HomepageTestimonial } from '@/components/homepage/TestimonialsCarousel';

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

type Props = {
  testimonials: HomepageTestimonial[];
};

export function MarketingHomeBelowFold({ testimonials }: Props) {
  return (
    <>
      <HowItWorks />
      <TestimonialsCarousel testimonials={testimonials} />
      <SellerPromoCTA />
    </>
  );
}