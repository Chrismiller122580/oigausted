'use client';

import dynamic from 'next/dynamic';

const HomepageWelcomeSplash = dynamic(
  () =>
    import('./HomepageWelcomeSplash').then((m) => ({ default: m.HomepageWelcomeSplash })),
  { ssr: false },
);

export function MarketingHomeWelcome() {
  return <HomepageWelcomeSplash />;
}