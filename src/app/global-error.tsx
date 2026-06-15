'use client';

import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Global app error:', error);

    // Known benign React DOM error often caused by Google Maps / Places Autocomplete
    // pollution or browser extensions mutating DOM outside React.
    // We have nukes in layout/profile/address components, but it can still surface.
    // Auto-reset the error boundary so the app doesn't stay in broken error screen.
    const msg = error?.message || '';
    if (msg.includes('removeChild') && msg.includes('not a child of this node')) {
      console.warn('Auto-recovering from known removeChild error (maps/extension pollution).');
      // Small delay to avoid tight loop
      setTimeout(() => {
        try { reset(); } catch {}
      }, 50);
    }
  }, [error, reset]);

  return (
    <html>
      <body>
        <div className="min-h-screen flex items-center justify-center bg-background text-foreground p-8">
          <div className="max-w-md text-center">
            <h1 className="text-4xl font-bold mb-4 text-red-600">Algo salió mal</h1>
            <p className="text-muted-foreground mb-6">
              Ocurrió un error inesperado en la aplicación. Nuestro equipo ha sido notificado.
            </p>
            <button
              onClick={() => reset()}
              className="px-6 py-3 bg-orange-600 text-white rounded-xl hover:bg-orange-700 transition"
            >
              Intentar de nuevo
            </button>
            <p className="text-xs text-muted-foreground mt-4">
              {error.digest ? `Error ID: ${error.digest}` : ''}
            </p>
          </div>
        </div>
      </body>
    </html>
  );
}
