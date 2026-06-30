import { heroCollageImages } from '@/lib/design-tokens';

const lcpHeroImage = heroCollageImages[0];

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <link
        rel="preload"
        as="image"
        href={lcpHeroImage}
        fetchPriority="high"
      />
      {children}
    </>
  );
}