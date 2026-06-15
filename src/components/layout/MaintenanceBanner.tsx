'use client';

import { AlertTriangle } from 'lucide-react';
import { usePlatformConfig } from '@/components/providers/PlatformConfigProvider';

export default function MaintenanceBanner() {
  const { config } = usePlatformConfig();

  if (!config?.maintenanceMode) return null;

  const message = config.maintenanceMessage || 'Estamos realizando mejoras. Volveremos pronto.';

  return (
    <div className="bg-red-600 text-white px-4 py-3 text-center font-semibold flex items-center justify-center gap-3 text-sm sticky top-0 z-[100] shadow-lg">
      <AlertTriangle className="h-5 w-5 flex-shrink-0" />
      <span>{message}</span>
      <AlertTriangle className="h-5 w-5 flex-shrink-0" />
    </div>
  );
}