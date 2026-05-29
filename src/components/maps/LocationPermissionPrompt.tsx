'use client';

import { Button } from '@/components/ui/button';
import { MapPin, X } from 'lucide-react';

interface LocationPermissionPromptProps {
  onAllow: () => void;
  onDismiss: () => void;
  isLoading?: boolean;
  error?: string;
}

export default function LocationPermissionPrompt({
  onAllow,
  onDismiss,
  isLoading = false,
  error,
}: LocationPermissionPromptProps) {
  return (
    <div className="bg-white dark:bg-zinc-900 border border-border rounded-2xl p-5 shadow-sm">
      <div className="flex items-start gap-4">
        <div className="mt-1">
          <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-900/40 flex items-center justify-center">
            <MapPin className="w-5 h-5 text-orange-600 dark:text-orange-400" />
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-semibold text-foreground">¿Quieres ver gigs cerca de ti?</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Te mostraremos servicios disponibles en tu zona actual. 
                Solo usamos tu ubicación para mejorar tu experiencia.
              </p>
            </div>
            <button 
              onClick={onDismiss} 
              className="text-muted-foreground hover:text-foreground ml-2"
            >
              <X size={18} />
            </button>
          </div>

          {error && (
            <p className="text-sm text-red-600 mt-2">{error}</p>
          )}

          <div className="flex gap-3 mt-4">
            <Button 
              onClick={onAllow} 
              disabled={isLoading}
              className="flex-1 sm:flex-none"
            >
              {isLoading ? "Obteniendo ubicación..." : "Usar mi ubicación actual"}
            </Button>
            <Button 
              variant="outline" 
              onClick={onDismiss}
              className="flex-1 sm:flex-none"
            >
              Ahora no
            </Button>
          </div>

          <p className="text-[10px] text-muted-foreground mt-3">
            Puedes cambiar esto después en los ajustes de tu navegador.
          </p>
        </div>
      </div>
    </div>
  );
}
