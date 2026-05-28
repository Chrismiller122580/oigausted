'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch'; // Assuming shadcn switch exists, fallback to checkbox if not
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
    // TODO: Fetch real preferences from /api/user/notification-preferences
    setLoading(false);
  }, []);

  const handleToggle = (key: keyof Preferences) => {
    setPrefs(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // TODO: POST to /api/user/notification-preferences
      await new Promise(r => setTimeout(r, 400)); // simulate
      toast.success('Preferencias guardadas');
    } catch (e) {
      toast.error('Error al guardar');
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
            <Switch checked={prefs.inAppEnabled} onCheckedChange={() => handleToggle('inAppEnabled')} />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Email</div>
              <div className="text-sm text-muted-foreground">Recibe actualizaciones por correo</div>
            </div>
            <Switch checked={prefs.emailEnabled} onCheckedChange={() => handleToggle('emailEnabled')} />
          </div>

          <div className="flex items-center justify-between opacity-60">
            <div>
              <div className="font-medium">SMS (próximamente)</div>
            </div>
            <Switch checked={prefs.smsEnabled} onCheckedChange={() => handleToggle('smsEnabled')} disabled />
          </div>

          <div className="flex items-center justify-between opacity-60">
            <div>
              <div className="font-medium">Push (próximamente)</div>
            </div>
            <Switch checked={prefs.pushEnabled} onCheckedChange={() => handleToggle('pushEnabled')} disabled />
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
            <Switch checked={prefs.orderUpdates} onCheckedChange={() => handleToggle('orderUpdates')} />
          </div>
          <div className="flex items-center justify-between">
            <div>Actualizaciones de gigs</div>
            <Switch checked={prefs.gigUpdates} onCheckedChange={() => handleToggle('gigUpdates')} />
          </div>
          <div className="flex items-center justify-between">
            <div>Alertas de reseñas</div>
            <Switch checked={prefs.reviewAlerts} onCheckedChange={() => handleToggle('reviewAlerts')} />
          </div>
          <div className="flex items-center justify-between">
            <div>Alertas de pagos</div>
            <Switch checked={prefs.paymentAlerts} onCheckedChange={() => handleToggle('paymentAlerts')} />
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
