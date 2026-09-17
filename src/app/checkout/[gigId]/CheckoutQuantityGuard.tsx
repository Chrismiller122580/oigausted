'use client';

import { useEffect } from 'react';
import { isQuantityField } from '@/lib/order-price';

/** Ensures POST /api/checkout always sends quantity (default 1) even if the form state is empty. */
export default function CheckoutQuantityGuard() {
  useEffect(() => {
    const originalFetch = window.fetch.bind(window);
    window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
      const method = (init?.method || (typeof input !== 'string' && !(input instanceof URL) ? input.method : 'GET') || 'GET').toUpperCase();
      if (url.includes('/api/checkout') && method === 'POST' && init?.body && typeof init.body === 'string') {
        try {
          const body = JSON.parse(init.body);
          const existing = body.customFields && typeof body.customFields === 'object' ? body.customFields : {};
          const hasQty = Object.keys(existing).some((k) => /quantity|qty|unidades|units|cantidad/i.test(k));
          if (body.gigId && !hasQty) {
            const gigRes = await originalFetch(`/api/gigs/${body.gigId}`);
            if (gigRes.ok) {
              const gigJson = await gigRes.json();
              const gig = gigJson.gig || gigJson;
              let fields = gig?.fields;
              if (typeof fields === 'string') {
                try { fields = JSON.parse(fields); } catch { fields = []; }
              }
              if (Array.isArray(fields)) {
                const customFields = { ...existing };
                for (const field of fields) {
                  if (isQuantityField(field) && (customFields[field.key] == null || customFields[field.key] === '' || customFields[field.key] === 0)) {
                    customFields[field.key] = 1;
                  }
                }
                body.customFields = customFields;
                init = { ...init, body: JSON.stringify(body) };
              }
            }
          }
        } catch {
          // leave request unchanged
        }
      }
      return originalFetch(input, init);
    };
    return () => {
      window.fetch = originalFetch;
    };
  }, []);
  return null;
}
