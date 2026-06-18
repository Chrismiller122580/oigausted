'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';

interface Notification {
  id: string;
  category: string;
  title: string;
  message: string;
  link: string | null;
  read: boolean;
  createdAt: string;
}

export default function NotificationsPage() {
  const { data: session } = useSession();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/notifications?unreadOnly=true');
      if (res.ok) {
        const data = await res.json();
        const unread = (data.notifications || []).filter((n: Notification) => !n.read);
        setNotifications(unread);
        setUnreadCount(data.unreadCount ?? unread.length);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session?.user) {
      fetchNotifications();
    }
  }, [session]);

  const markAsRead = async (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    setUnreadCount((prev) => Math.max(0, prev - 1));

    try {
      await fetch(`/api/notifications/${id}/read`, { method: 'PATCH' });
      fetchNotifications();
      // Nudge any bell/realtime listeners (they have their own polls + will correct on next open)
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('notifications:read-updated'));
      }
    } catch (e) {
      toast.error('Error marking as read');
      fetchNotifications(); // revert on error
    }
  };

  const markAllAsRead = async () => {
    setNotifications([]);
    setUnreadCount(0);

    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAllAsRead: true }),
      });
      fetchNotifications();
      toast.success('Todas marcadas como leídas');
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('notifications:read-updated'));
      }
    } catch (e) {
      toast.error('Error');
      fetchNotifications();
    }
  };

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Debes iniciar sesión para ver tus notificaciones.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-12">
      <div className="max-w-3xl mx-auto px-6">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold">Notificaciones</h1>
            <p className="text-muted-foreground mt-1">
              {unreadCount > 0 ? `${unreadCount} sin leer` : 'Todo al día'}
            </p>
          </div>
          {unreadCount > 0 && (
            <Button variant="outline" onClick={markAllAsRead}>
              Marcar todas como leídas
            </Button>
          )}
        </div>

        {loading ? (
          <p>Cargando...</p>
        ) : notifications.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center text-muted-foreground">
              No tienes notificaciones sin leer.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {notifications.map((n) => (
              <Card
                key={n.id}
                className={`transition ${!n.read ? 'border-orange-500/50 bg-orange-50/5 dark:bg-orange-950/10' : ''}`}
              >
                <CardContent className="p-5">
                  <div className="flex justify-between gap-4">
                    <div className="flex-1">
                      <div className="font-semibold text-lg">{n.title}</div>
                      <p className="text-muted-foreground mt-1">{n.message}</p>
                      {n.link && (
                        <Link href={n.link} className="text-sm text-orange-600 hover:underline mt-2 inline-block">
                          Ver detalles →
                        </Link>
                      )}
                    </div>
                    <div className="text-right text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(n.createdAt).toLocaleDateString('es-CO')}
                      {!n.read && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="mt-2 block"
                          onClick={() => markAsRead(n.id)}
                        >
                          Marcar leída
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
