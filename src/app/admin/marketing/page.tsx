'use client';

import dynamic from 'next/dynamic';
import MapsPollutionNuke from '@/components/maps/MapsPollutionNuke';

function MarketingPageSkeleton() {
  return (
    <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8 pb-12 animate-pulse">
      <p className="text-sm text-muted-foreground">Cargando Marketing Studio…</p>
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-2xl bg-muted" />
        <div className="space-y-2">
          <div className="h-8 w-64 rounded-lg bg-muted" />
          <div className="h-4 w-96 max-w-full rounded bg-muted" />
        </div>
      </div>
      <div className="h-72 rounded-2xl bg-muted/60" />
      <div className="h-96 rounded-2xl bg-muted/40" />
      <div className="h-64 rounded-2xl bg-muted/40" />
    </div>
  );
}

const AdminMarketingContent = dynamic(() => import('./AdminMarketingContent'), {
  ssr: false,
  loading: () => <MarketingPageSkeleton />,
});

export default function AdminMarketingPage() {
  return (
    <>
      <MapsPollutionNuke />
      <AdminMarketingContent />
    </>
  );
}