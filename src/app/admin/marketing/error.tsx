'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';

function isBenignDomReconcileError(error: unknown) {
  const anyErr = error as { name?: string; message?: string } | null;
  const msg = `${anyErr?.name || ''} ${anyErr?.message || ''} ${String(error || '')}`;
  return /NotFoundError|removeChild|insertBefore|not a child of this node/i.test(msg);
}

export default function MarketingError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const benign = isBenignDomReconcileError(error);

  useEffect(() => {
    if (!benign) {
      console.error('Admin marketing page error:', error);
      return;
    }
    const t = window.setTimeout(() => {
      try {
        reset();
      } catch {
        window.location.replace('/admin/marketing');
      }
    }, 20);
    return () => window.clearTimeout(t);
  }, [error, reset, benign]);

  if (benign) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center p-8 text-sm text-muted-foreground">
        Cargando Marketing Studio…
      </div>
    );
  }

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-8">
      <div className="max-w-md text-center space-y-4">
        <h1 className="text-2xl font-semibold text-red-600">Error en Marketing Studio</h1>
        <p className="text-sm text-muted-foreground">
          No se pudo cargar la página de marketing. Intenta de nuevo o recarga el navegador.
        </p>
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
