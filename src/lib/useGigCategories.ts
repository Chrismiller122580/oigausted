'use client';

import { useState, useEffect } from 'react';
import type { DynamicFieldDef } from '@/types/gig-fields';

export interface GigCategory {
  name: string;
  icon: string;
  fields: DynamicFieldDef[];
  description?: string;
}

/**
 * Client hook to load categories from the public API.
 * Replaces the previous static import from gig-categories.ts in client components.
 * Components can now react to newly created categories from the admin page.
 */
export function useGigCategories() {
  const [categories, setCategories] = useState<GigCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/categories', { cache: 'no-store' });
        const data = await res.json();
        if (!cancelled) {
          setCategories(data.categories || []);
        }
      } catch (e: unknown) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Error loading categories');
          // graceful fallback to empty; UIs should handle
          setCategories([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  return { categories, loading, error };
}
