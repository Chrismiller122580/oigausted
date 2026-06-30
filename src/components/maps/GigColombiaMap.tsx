'use client';

import { useRouter } from 'next/navigation';
import { forwardRef } from 'react';
import GigMapExplorer, { type GigMapExplorerHandle } from '@/components/maps/GigMapExplorer';
import type { CityCluster, GigMapPin } from '@/lib/gig-map';

export type GigColombiaMapHandle = GigMapExplorerHandle;

type GigColombiaMapProps = {
  pins: GigMapPin[];
  clusters: CityCluster[];
  className?: string;
};

const GigColombiaMap = forwardRef<GigColombiaMapHandle, GigColombiaMapProps>(
  function GigColombiaMap({ pins, clusters, className }, ref) {
    const router = useRouter();

    return (
      <GigMapExplorer
        ref={ref}
        pins={pins}
        clusters={clusters}
        className={className}
        height="100%"
        onPinClick={(pin) => router.push(`/gigs/${pin.id}`)}
      />
    );
  },
);

export default GigColombiaMap;