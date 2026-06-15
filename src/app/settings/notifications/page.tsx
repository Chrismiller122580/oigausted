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
    <div className="max-w-2xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-2">Preferencias de Notificaciones</h1>
      <p className="text-muted-foreground mb-8">
        Controla cómo y cuándo quieres recibir notificaciones.
      </p>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Canales de entrega</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Notificaciones en la app</div>
              <div className="text-sm text-muted-foreground">Campana en la barra superior + historial</div>
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
              <div className="text-sm text-muted-foreground">Recibe actualizaciones por correo electrónico</div>
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

          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Push del navegador</div>
              <div className="text-sm text-muted-foreground">Notificaciones nativas del escritorio (usa el polling actual)</div>
            </div>
            <input 
              type="checkbox" 
              checked={prefs.desktopNotifications} 
              onChange={() => handleToggle('desktopNotifications')}
              className="w-5 h-5 accent-orange-600"
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Sonido de alerta</div>
              <div className="text-sm text-muted-foreground">Reproduce un tono cuando llega una notificación nueva</div>
            </div>
            <input 
              type="checkbox" 
              checked={prefs.soundEnabled} 
              onChange={() => handleToggle('soundEnabled')}
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
          <div className="flex items-center justify-between">
            <div>Mensajes de chat</div>
            <input 
              type="checkbox" 
              checked={prefs.messageAlerts} 
              onChange={() => handleToggle('messageAlerts')}
              className="w-5 h-5 accent-orange-600"
            />
          </div>
          <div className="flex items-center justify-between">
            <div>Notificaciones del sistema</div>
            <input 
              type="checkbox" 
              checked={prefs.systemAlerts} 
              onChange={() => handleToggle('systemAlerts')}
              className="w-5 h-5 accent-orange-600"
            />
          </div>
          <div className="flex items-center justify-between pt-1 border-t border-border/60">
            <div>
              <div>Correos de marketing y actualizaciones</div>
              <div className="text-[11px] text-muted-foreground -mt-0.5">Promociones, novedades de la plataforma y anuncios importantes</div>
            </div>
            <input 
              type="checkbox" 
              checked={prefs.marketingEmails} 
              onChange={() => handleToggle('marketingEmails')}
              className="w-5 h-5 accent-orange-600"
            />
          </div>
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
                  new Notification('Oigagig', {
                    body: 'Notificaciones de escritorio listas ✅',
                    icon: '/logo.png'
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
            <div className="flex items-center justify-between mb-2">
              <div>
                <div className="font-medium flex items-center gap-2">
                  Horario silencioso
                  {prefs.quietHoursEnabled && isQuietNow && (
                    <span className="text-[10px] px-2 py-0.5 bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300 rounded-full font-normal">
                      ACTIVO AHORA
                    </span>
                  )}
                </div>
                <div className="text-sm text-muted-foreground">No enviar emails ni push durante estas horas (solo in-app)</div>
              </div>
              <input 
                type="checkbox" 
                checked={prefs.quietHoursEnabled} 
                onChange={() => handleToggle('quietHoursEnabled')}
                className="w-5 h-5 accent-orange-600"
              />
            </div>

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
            <div className="flex items-center justify-between mb-2">
              <div>
                <div className="font-medium">Resúmenes (Digest)</div>
                <div className="text-sm text-muted-foreground">Recibe un resumen en vez de notificaciones individuales</div>
              </div>
              <input 
                type="checkbox" 
                checked={prefs.digestEnabled} 
                onChange={() => handleToggle('digestEnabled')}
                className="w-5 h-5 accent-orange-600"
              />
            </div>

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
