'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle } from 'lucide-react';

export default function MaintenanceBanner() {
  const [maintenance, setMaintenance] = useState<{ active: boolean; message: string; bypassIps?: string } | null>(null);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const res = await fetch('/api/admin/config');
        if (res.ok) {
          const data = await res.json();
          if (data.maintenanceMode) {
            setMaintenance({
              active: true,
              message: data.maintenanceMessage || 'Estamos realizando mejoras. Volveremos pronto.',
              bypassIps: data.maintenanceBypassIps || '',
            });
          } else {
            setMaintenance(null);
          }
        } else if (res.status === 403) {
          setMaintenance(null);
        }
      } catch (e) {
        // silently ignore
      }
    };

    fetchConfig();
    const interval = setInterval(fetchConfig, 30000);
    return () => clearInterval(interval);
  }, []);

  if (!maintenance?.active) return null;

  return (
    <div className="bg-red-600 text-white px-4 py-3 text-center font-semibold flex items-center justify-center gap-3 text-sm sticky top-0 z-[100] shadow-lg">
      <AlertTriangle className="h-5 w-5 flex-shrink-0" />
      <span>{maintenance.message}</span>
      <AlertTriangle className="h-5 w-5 flex-shrink-0" />
    </div>
  );
}