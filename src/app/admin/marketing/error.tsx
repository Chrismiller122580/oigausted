'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';

export default function MarketingError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Admin marketing page error:', error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-8">
      <div className="max-w-md text-center space-y-4">
        <h1 className="text-2xl font-semibold text-red-600">Error en Marketing Studio</h1>
        <p className="text-sm text-muted-foreground">
          No se pudo cargar la página de marketing. Intenta de nuevo o recarga el navegador.
        </p>
        {error.message ? (
          <p className="text-xs text-muted-foreground font-mono bg-muted rounded-lg p-3 break-words">
            {error.message}
          </p>
        ) : null}
        <div className="flex flex-wrap gap-2 justify-center">
          <Button onClick={() => reset()}>Reintentar</Button>
          <Button variant="outline" onClick={() => window.location.reload()}>
            Recargar página
          </Button>
        </div>
      </div>
    </div>
  );
}