'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { 
  subscribeToPushNotifications, 
  unsubscribeFromPushNotifications 
} from '@/lib/useRealtimeNotifications';

function PreferenceRow({
  label,
  description,
  checked,
  onChange,
  disabled = false,
  bordered = false,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: () => void;
  disabled?: boolean;
  bordered?: boolean;
}) {
  return (
    <div className={`flex items-start justify-between gap-4 ${bordered ? 'pt-1 border-t border-border/60' : ''}`}>
      <div className="min-w-0 flex-1">
        <div className="font-medium leading-snug">{label}</div>
        {description && (
          <div className="text-sm text-muted-foreground mt-0.5 leading-snug">{description}</div>
        )}
      </div>
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        className="w-5 h-5 shrink-0 mt-0.5 accent-orange-600"
      />
    </div>
  );
}

interface Preferences {
  inAppEnabled: boolean;
  emailEnabled: boolean;
  smsEnabled: boolean;
  pushEnabled: boolean;
  orderUpdates: boolean;
  gigUpdates: boolean;
  reviewAlerts: boolean;
  paymentAlerts: boolean;
  messageAlerts: boolean;
  systemAlerts: boolean;
  marketingEmails: boolean;
  desktopNotifications: boolean;
  soundEnabled: boolean;

  // 2027 Respect features
  quietHoursEnabled: boolean;
  quietHoursStart: string;
  quietHoursEnd: string;
  digestEnabled: boolean;
  digestFrequency: string;
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
    messageAlerts: true,
    systemAlerts: true,
    marketingEmails: true,
    desktopNotifications: true,
    soundEnabled: true,
    quietHoursEnabled: false,
    quietHoursStart: "22:00",
    quietHoursEnd: "08:00",
    digestEnabled: false,
    digestFrequency: "daily",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pushSubscribed, setPushSubscribed] = useState(false);
  const [isQuietNow, setIsQuietNow] = useState(false);

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
            messageAlerts: data.messageAlerts ?? true,
            systemAlerts: data.systemAlerts ?? true,
            marketingEmails: data.marketingEmails ?? true,
            desktopNotifications: data.desktopNotifications ?? true,
            soundEnabled: data.soundEnabled ?? true,
            quietHoursEnabled: data.quietHoursEnabled ?? false,
            quietHoursStart: data.quietHoursStart ?? "22:00",
            quietHoursEnd: data.quietHoursEnd ?? "08:00",
            digestEnabled: data.digestEnabled ?? false,
            digestFrequency: data.digestFrequency ?? "daily",
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
      // Check if already subscribed to push
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistration('/notification-sw.js').then(reg => {
          if (reg) {
            reg.pushManager.getSubscription().then(sub => {
              setPushSubscribed(!!sub);
            });
          }
        });
      }
    } else {
      setLoading(false);
    }
  }, [session]);

  // Live check: Is it currently quiet hours? (client-side mirror of server logic)
  useEffect(() => {
    const checkQuietNow = () => {
      if (!prefs.quietHoursEnabled || !prefs.quietHoursStart || !prefs.quietHoursEnd) {
        setIsQuietNow(false);
        return;
      }
      try {
        const now = new Date();
        const currentMinutes = now.getHours() * 60 + now.getMinutes();
        const [startH, startM] = prefs.quietHoursStart.split(':').map(Number);
        const [endH, endM] = prefs.quietHoursEnd.split(':').map(Number);
        const startMinutes = startH * 60 + (startM || 0);
        const endMinutes = endH * 60 + (endM || 0);

        let quiet = false;
        if (startMinutes < endMinutes) {
          quiet = currentMinutes >= startMinutes && currentMinutes <= endMinutes;
        } else {
          quiet = currentMinutes >= startMinutes || currentMinutes <= endMinutes;
        }
        setIsQuietNow(quiet);
      } catch {
        setIsQuietNow(false);
      }
    };

    checkQuietNow();
    const interval = setInterval(checkQuietNow, 60000); // update every minute
    return () => clearInterval(interval);
  }, [prefs.quietHoursEnabled, prefs.quietHoursStart, prefs.quietHoursEnd]);

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
    <div className="max-w-2xl mx-auto px-4 py-6 sm:p-8">
      <h1 className="text-2xl sm:text-3xl font-bold mb-2">Preferencias de Notificaciones</h1>
      <p className="text-muted-foreground mb-8">
        Controla cómo y cuándo quieres recibir notificaciones.
      </p>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Canales de entrega</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <PreferenceRow
            label="Notificaciones en la app"
            description="Campana en la barra superior + historial"
            checked={prefs.inAppEnabled}
            onChange={() => handleToggle('inAppEnabled')}
          />
          <PreferenceRow
            label="Email"
            description="Recibe actualizaciones por correo electrónico"
            checked={prefs.emailEnabled}
            onChange={() => handleToggle('emailEnabled')}
          />
          <div className="opacity-60">
            <PreferenceRow
              label="SMS (próximamente)"
              checked={prefs.smsEnabled}
              onChange={() => handleToggle('smsEnabled')}
              disabled
            />
          </div>
          <PreferenceRow
            label="Push del navegador"
            description="Notificaciones nativas del escritorio (usa el polling actual)"
            checked={prefs.desktopNotifications}
            onChange={() => handleToggle('desktopNotifications')}
          />
          <PreferenceRow
            label="Sonido de alerta"
            description="Reproduce un tono cuando llega una notificación nueva"
            checked={prefs.soundEnabled}
            onChange={() => handleToggle('soundEnabled')}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tipos de notificaciones</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <PreferenceRow label="Actualizaciones de pedidos" checked={prefs.orderUpdates} onChange={() => handleToggle('orderUpdates')} />
          <PreferenceRow label="Actualizaciones de gigs" checked={prefs.gigUpdates} onChange={() => handleToggle('gigUpdates')} />
          <PreferenceRow label="Alertas de reseñas" checked={prefs.reviewAlerts} onChange={() => handleToggle('reviewAlerts')} />
          <PreferenceRow label="Alertas de pagos" checked={prefs.paymentAlerts} onChange={() => handleToggle('paymentAlerts')} />
          <PreferenceRow label="Mensajes de chat" checked={prefs.messageAlerts} onChange={() => handleToggle('messageAlerts')} />
          <PreferenceRow label="Notificaciones del sistema" checked={prefs.systemAlerts} onChange={() => handleToggle('systemAlerts')} />
          <PreferenceRow
            label="Correos de marketing y actualizaciones"
            description="Promociones, novedades de la plataforma y anuncios importantes"
            checked={prefs.marketingEmails}
            onChange={() => handleToggle('marketingEmails')}
            bordered
          />
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Notificaciones de escritorio y sonido</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Las notificaciones de escritorio usan la API nativa del navegador. El sonido se reproduce localmente cuando se detectan nuevas notificaciones.
          </p>

          <div className="flex flex-wrap gap-3">
            <Button
              variant="outline"
              onClick={async () => {
                if (!('Notification' in window)) {
                  toast.error('Tu navegador no soporta notificaciones de escritorio');
                  return;
                }
                const perm = await Notification.requestPermission();
                if (perm === 'granted') {
                  toast.success('¡Notificaciones de escritorio activadas!');
                  // fire a test notification
                  new Notification('OigaGIG', {
                    body: 'Notificaciones de escritorio listas ✅',
                    icon: '/brand/oiga-gig-marketing.png'
                  });
                } else if (perm === 'denied') {
                  toast.error('Permiso denegado. Habilítalo en la configuración del navegador.');
                } else {
                  toast('Permiso pendiente. Intenta de nuevo.');
                }
              }}
            >
              Activar notificaciones del navegador
            </Button>

            <Button
              variant="outline"
              onClick={() => {
                // Test sound using the same logic as bell (simple chime)
                try {
                  const win = window as Window & { webkitAudioContext?: typeof AudioContext };
                  const AudioCtx = window.AudioContext || win.webkitAudioContext;
                  const audio = new AudioCtx();
                  const o = audio.createOscillator();
                  const g = audio.createGain();
                  o.type = 'sine'; o.frequency.value = 880;
                  g.gain.value = 0.12;
                  const o2 = audio.createOscillator(); o2.frequency.value = 660;
                  const g2 = audio.createGain(); g2.gain.value = 0.09;
                  const t = audio.currentTime;
                  o.connect(g); g.connect(audio.destination);
                  o2.connect(g2); g2.connect(audio.destination);
                  o.start(t); o.stop(t + 0.22);
                  o2.start(t + 0.12); o2.stop(t + 0.38);
                  toast.success('Sonido de prueba reproducido');
                } catch (e) {
                  toast.error('No se pudo reproducir el sonido');
                }
              }}
            >
              🔊 Probar sonido
            </Button>
          </div>

          <p className="text-xs text-muted-foreground">
            Estado del permiso de escritorio: <span className="font-mono">{typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'no disponible en SSR'}</span> (se actualiza tras usar el botón)
          </p>
        </CardContent>
      </Card>

      {/* === 2027 User Respect Features === */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Respeto al usuario (Horario silencioso + Resúmenes)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <PreferenceRow
              label={
                prefs.quietHoursEnabled && isQuietNow
                  ? 'Horario silencioso (ACTIVO AHORA)'
                  : 'Horario silencioso'
              }
              description="No enviar emails ni push durante estas horas (solo in-app)"
              checked={prefs.quietHoursEnabled}
              onChange={() => handleToggle('quietHoursEnabled')}
            />

            {prefs.quietHoursEnabled && (
              <>
                <div className="grid grid-cols-2 gap-4 mt-3 pl-1">
                  <div>
                    <label className="text-xs text-muted-foreground block mb-1">Desde</label>
                    <input 
                      type="time" 
                      value={prefs.quietHoursStart} 
                      onChange={(e) => setPrefs(p => ({...p, quietHoursStart: e.target.value}))}
                      className="w-full border rounded-md p-2 bg-background text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground block mb-1">Hasta</label>
                    <input 
                      type="time" 
                      value={prefs.quietHoursEnd} 
                      onChange={(e) => setPrefs(p => ({...p, quietHoursEnd: e.target.value}))}
                      className="w-full border rounded-md p-2 bg-background text-sm"
                    />
                  </div>
                </div>

                {/* Visual preview + status */}
                <div className="mt-3 pl-1 text-xs">
                  <div className="text-muted-foreground">
                    Suprimir emails y push de <strong>{prefs.quietHoursStart}</strong> a <strong>{prefs.quietHoursEnd}</strong>.
                  </div>
                  {isQuietNow ? (
                    <div className="mt-1 text-orange-600 dark:text-orange-400 font-medium">
                      🕒 Horario silencioso activo en este momento. Solo se guardarán notificaciones en la app.
                    </div>
                  ) : (
                    <div className="mt-1 text-green-600 dark:text-green-400 text-xs">
                      Las notificaciones por email y push están activas ahora.
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          <div className="pt-4 border-t">
            <PreferenceRow
              label="Resúmenes (Digest)"
              description="Recibe un resumen en vez de notificaciones individuales"
              checked={prefs.digestEnabled}
              onChange={() => handleToggle('digestEnabled')}
            />

            {prefs.digestEnabled && (
              <select 
                value={prefs.digestFrequency} 
                onChange={(e) => setPrefs(p => ({...p, digestFrequency: e.target.value}))}
                className="w-full border rounded-md p-2 bg-background text-sm mt-2"
              >
                <option value="daily">Resumen diario (recomendado)</option>
                <option value="weekly">Resumen semanal</option>
              </select>
            )}
          </div>
        </CardContent>
      </Card>

      {/* === Real Web Push (True Push Notifications) === */}
      <Card className="mt-6 border-orange-200 dark:border-orange-900">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Notificaciones Push Reales 
            <span className="text-xs px-2 py-0.5 bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300 rounded-full">2027</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Recibe notificaciones incluso cuando la pestaña está cerrada o la app no está abierta. 
            Requiere VAPID keys configuradas.
          </p>

          <div className="flex flex-wrap gap-3">
            <Button
              onClick={async () => {
                try {
                  await subscribeToPushNotifications();
                  toast.success('¡Push real activado! Recibirás notificaciones en segundo plano.');
                  setPushSubscribed(true);
                } catch (e: unknown) {
                  toast.error(e instanceof Error ? e.message : 'No se pudo activar push');
                }
              }}
              className="bg-orange-600 hover:bg-orange-700"
            >
              Activar Push Real (Web Push)
            </Button>

            <Button
              variant="outline"
              onClick={async () => {
                try {
                  await unsubscribeFromPushNotifications();
                  toast.success('Push real desactivado');
                  setPushSubscribed(false);
                } catch (e) {
                  toast.error('Error al desactivar');
                }
              }}
            >
              Desactivar Push
            </Button>

            <Button
              variant="outline"
              onClick={async () => {
                try {
                  const res = await fetch('/api/test-email', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ type: 'push-test' }),
                  });
                  if (res.ok) {
                    toast.success('Notificación de prueba enviada');
                  } else {
                    toast.error('Configura VAPID keys primero');
                  }
                } catch {
                  toast.error('Error enviando prueba');
                }
              }}
            >
              Enviar notificación de prueba
            </Button>
          </div>

          <div className="text-xs text-muted-foreground pt-2 border-t">
            Estado: {pushSubscribed ? 'Suscrito a push real ✓' : 'No suscrito'} 
            {typeof window !== 'undefined' && 'serviceWorker' in navigator ? ' • Service Worker soportado' : ''}
          </div>
        </CardContent>
      </Card>

      <div className="mt-6 flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? 'Guardando...' : 'Guardar preferencias'}
        </Button>
      </div>

      <p className="text-xs text-muted-foreground mt-6 text-center">
        Tus preferencias se sincronizan con la cuenta. Las notificaciones por email se envían automáticamente cuando se dispara una notificación in-app (si está habilitado).
      </p>
    </div>
  );
}
