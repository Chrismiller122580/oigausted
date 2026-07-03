'use client';

import { useEffect } from 'react';
import { WORLD_MAP_SECTION_ID } from '@/lib/countries';

export function WorldMapHashScroll() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.location.hash !== `#${WORLD_MAP_SECTION_ID}`) return;

    const scrollToMap = () => {
      const el = document.getElementById(WORLD_MAP_SECTION_ID);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    };

    const timer = window.setTimeout(scrollToMap, 100);
    return () => window.clearTimeout(timer);
  }, []);

  return null;
}