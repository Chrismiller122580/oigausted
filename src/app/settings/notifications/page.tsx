'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
// Using simple checkbox toggles for now (no shadcn Switch component installed)
import { toast } from 'react-hot-toast';

interface Preferences {
  inAppEnabled: boolean;
  emailEnabled: boolean;
  smsEnabled: boolean;
  pushEnabled: boolean;
  orderUpdates: boolean;
  gigUpdates: boolean;
  reviewAlerts: boolean;
  paymentAlerts: boolean;
}

export default function NotificationPreferences() {
  const { data: session } = useSession();
  const [prefs, setPrefs] = useState<Preferences>({
    inAppEnabled: true,
    emailEnabled: true,
    smsEnabled: false,
    pushEnabled: true,
    orderUpdates: true,
    gigUpdates: true,
    reviewAlerts: true,
    paymentAlerts: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // For now, preferences are stored in memory / local (we'll persist to DB in next step)
  // This is a UI scaffold. Real persistence will come with the preference model.

  useEffect(() => {
    const fetchPreferences = async () => {
      try {
        const res = await fetch('/api/user/notification-preferences');
        if (res.ok) {
          const data = await res.json();
          setPrefs({
            inAppEnabled: data.inAppEnabled ?? true,
            emailEnabled: data.emailEnabled ?? true,
            smsEnabled: data.smsEnabled ?? false,
            pushEnabled: data.pushEnabled ?? true,
            orderUpdates: data.orderUpdates ?? true,
            gigUpdates: data.gigUpdates ?? true,
            reviewAlerts: data.reviewAlerts ?? true,
            paymentAlerts: data.paymentAlerts ?? true,
          });
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };

    if (session?.user) {
      fetchPreferences();
    } else {
      setLoading(false);
    }
  }, [session]);

  const handleToggle = (key: keyof Preferences) => {
    setPrefs(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/user/notification-preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(prefs),
      });

      if (res.ok) {
        toast.success('Preferencias guardadas correctamente');
      } else {
        toast.error('Error al guardar preferencias');
      }
    } catch (e) {
      toast.error('Error de conexión');
    } finally {
      setSaving(false);
    }
  };

  if (!session) {
    return <div className="p-8">Debes iniciar sesión.</div>;
  }

  return (
    <div className="max-w-2xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-2">Preferencias de Notificaciones</h1>
      <p className="text-muted-foreground mb-8">
        Controla cómo y cuándo quieres recibir notificaciones.
      </p>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Canales</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Notificaciones en la app</div>
              <div className="text-sm text-muted-foreground">Campana en la barra superior</div>
            </div>
            <input 
              type="checkbox" 
              checked={prefs.inAppEnabled} 
              onChange={() => handleToggle('inAppEnabled')}
              className="w-5 h-5 accent-orange-600"
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Email</div>
              <div className="text-sm text-muted-foreground">Recibe actualizaciones por correo</div>
            </div>
            <input 
              type="checkbox" 
              checked={prefs.emailEnabled} 
              onChange={() => handleToggle('emailEnabled')}
              className="w-5 h-5 accent-orange-600"
            />
          </div>

          <div className="flex items-center justify-between opacity-60">
            <div>
              <div className="font-medium">SMS (próximamente)</div>
            </div>
            <input 
              type="checkbox" 
              checked={prefs.smsEnabled} 
              onChange={() => handleToggle('smsEnabled')}
              disabled
              className="w-5 h-5 accent-orange-600"
            />
          </div>

          <div className="flex items-center justify-between opacity-60">
            <div>
              <div className="font-medium">Push (próximamente)</div>
            </div>
            <input 
              type="checkbox" 
              checked={prefs.pushEnabled} 
              onChange={() => handleToggle('pushEnabled')}
              disabled
              className="w-5 h-5 accent-orange-600"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tipos de notificaciones</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>Actualizaciones de pedidos</div>
            <input 
              type="checkbox" 
              checked={prefs.orderUpdates} 
              onChange={() => handleToggle('orderUpdates')}
              className="w-5 h-5 accent-orange-600"
            />
          </div>
          <div className="flex items-center justify-between">
            <div>Actualizaciones de gigs</div>
            <input 
              type="checkbox" 
              checked={prefs.gigUpdates} 
              onChange={() => handleToggle('gigUpdates')}
              className="w-5 h-5 accent-orange-600"
            />
          </div>
          <div className="flex items-center justify-between">
            <div>Alertas de reseñas</div>
            <input 
              type="checkbox" 
              checked={prefs.reviewAlerts} 
              onChange={() => handleToggle('reviewAlerts')}
              className="w-5 h-5 accent-orange-600"
            />
          </div>
          <div className="flex items-center justify-between">
            <div>Alertas de pagos</div>
            <input 
              type="checkbox" 
              checked={prefs.paymentAlerts} 
              onChange={() => handleToggle('paymentAlerts')}
              className="w-5 h-5 accent-orange-600"
            />
          </div>
        </CardContent>
      </Card>

      <div className="mt-6 flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? 'Guardando...' : 'Guardar preferencias'}
        </Button>
      </div>

      <p className="text-xs text-muted-foreground mt-6 text-center">
        Las preferencias se guardarán en tu cuenta cuando completemos la integración completa.
      </p>
    </div>
  );
}
