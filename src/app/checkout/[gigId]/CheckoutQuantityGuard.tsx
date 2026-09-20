'use client';

import { useEffect } from 'react';
import { isQuantityField } from '@/lib/order-price';
import { isSellerAttributeField } from '@/lib/persist-gig-fields';

type FieldDef = {
  key?: string;
  label?: string;
  type?: string;
  value?: string | number | boolean;
  owner?: 'seller' | 'buyer';
};

function parseFields(raw: unknown): FieldDef[] {
  let fields = raw;
  if (typeof fields === 'string') {
    try { fields = JSON.parse(fields); } catch { return []; }
  }
  return Array.isArray(fields) ? fields : [];
}

function urlQuantity(): number | null {
  if (typeof window === 'undefined') return null;
  const n = Math.floor(Number(new URLSearchParams(window.location.search).get('quantity') || 0));
  return n >= 1 ? n : null;
}

function sellerFactsFromFields(fields: FieldDef[]): Record<string, string | number | boolean> {
  const facts: Record<string, string | number | boolean> = {};
  const qty = urlQuantity();
  for (const field of fields) {
    if (!field?.key) continue;
    if (isQuantityField(field)) {
      facts[field.key] = qty ?? 1;
      continue;
    }
    if (!isSellerAttributeField({
      key: field.key,
      label: field.label || '',
      type: field.type || 'text',
      owner: field.owner,
    })) continue;
    if (field.value !== undefined && field.value !== null && field.value !== '') {
      facts[field.key] = field.value;
    }
  }
  return facts;
}

function mergeFacts(customFields: Record<string, unknown>, facts: Record<string, string | number | boolean>) {
  const next = { ...customFields };
  const qty = urlQuantity();
  for (const [key, value] of Object.entries(facts)) {
    if (qty != null && isQuantityField({ key })) {
      next[key] = qty;
      continue;
    }
    if (next[key] == null || next[key] === '' || next[key] === 0) next[key] = value;
  }
  return next;
}

function lockSellerSelects() {
  if (typeof document === 'undefined') return;
  const qty = urlQuantity();
  const blocks = document.querySelectorAll('label');
  blocks.forEach((el) => {
    const text = (el.textContent || '').trim();
    if (!/(tipo de producto|origen|condici[oó]n|tipo de veh[í]culo|tipo de recurso|a[nñ]o del modelo|unidad de medida|product type|origin|condition)/i.test(text)) {
      return;
    }
    const wrap = el.parentElement;
    if (!wrap || wrap.getAttribute('data-seller-fact-locked')) return;
    const select = wrap.querySelector('select');
    if (!select) return;
    const selected = select.querySelector('option:checked') as HTMLOptionElement | null;
    const value = selected && selected.value ? selected.textContent?.replace(/\s\(\+\$.*\)$/, '').trim() : '';
    if (value) {
      const readout = document.createElement('p');
      readout.className = 'font-medium';
      readout.textContent = value;
      select.replaceWith(readout);
      wrap.setAttribute('data-seller-fact-locked', '1');
    } else {
      wrap.remove();
    }
  });

  document.querySelectorAll('input[type="number"]').forEach((node) => {
    const input = node as HTMLInputElement;
    const wrap = input.closest('div');
    const label = (wrap?.querySelector('label')?.textContent || input.getAttribute('aria-label') || '').trim();
    if (!isQuantityField({ key: input.name || input.id || '', label })) return;
    if (input.getAttribute('data-qty-seeded')) return;
    if (input.value === '' || input.value === '0' || (qty != null && input.value === '1' && !input.dataset.userEdited)) {
      const next = String(qty ?? 1);
      const desc = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value');
      desc?.set?.call(input, next);
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
      input.setAttribute('data-qty-seeded', '1');
    }
    if (!input.min || Number(input.min) < 1) input.min = '1';
    input.addEventListener('input', () => { input.dataset.userEdited = '1'; }, { once: true });
  });
}

export default function CheckoutQuantityGuard() {
  useEffect(() => {
    const originalFetch = window.fetch.bind(window);
    const sellerFactsByGig: Record<string, Record<string, string | number | boolean>> = {};

    window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
      const method = (init?.method || (typeof input !== 'string' && !(input instanceof URL) ? input.method : 'GET') || 'GET').toUpperCase();

      if (init?.body && typeof init.body === 'string' && (url.includes('/api/checkout') || /\/api\/orders\//.test(url)) && method !== 'GET') {
        try {
          const body = JSON.parse(init.body);
          const existing = body.customFields && typeof body.customFields === 'object' ? body.customFields : {};
          const gigId = body.gigId || Object.keys(sellerFactsByGig)[0];
          const facts = (gigId && sellerFactsByGig[String(gigId)]) || {};
          const customFields = mergeFacts(existing, facts);
          init = { ...init, body: JSON.stringify({ ...body, customFields }) };
        } catch {
          // leave request unchanged
        }
      }

      const res = await originalFetch(input, init);

      try {
        if (/\/api\/gigs\/[^/?]+$/.test(url.split('?')[0]) && method === 'GET' && res.ok) {
          const json = await res.clone().json();
          const gig = json.gig || json;
          const fields = parseFields(gig?.fields);
          const facts = sellerFactsFromFields(fields);
          if (gig?.id) sellerFactsByGig[String(gig.id)] = facts;
        }
      } catch {
        // ignore parse errors
      }

      return res;
    };

    lockSellerSelects();
    const observer = new MutationObserver(() => lockSellerSelects());
    observer.observe(document.body, { childList: true, subtree: true });
    const interval = window.setInterval(lockSellerSelects, 800);

    return () => {
      window.fetch = originalFetch;
      observer.disconnect();
      window.clearInterval(interval);
    };
  }, []);
  return null;
}
