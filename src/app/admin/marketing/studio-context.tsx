'use client';

import { createContext, useContext } from 'react';

export const StudioCtx = createContext<any>(null);

export function useStudio() {
  const ctx = useContext(StudioCtx);
  if (!ctx) throw new Error('StudioCtx missing');
  return ctx;
}
