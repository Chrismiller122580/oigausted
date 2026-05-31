'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Bell, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRealtimeNotifications } from '@/lib/useRealtimeNotifications';

interface AppNotification {
  id: string;
  title: string;
  message: string;
  link: string | null;
  read: boolean;
  createdAt: string;
}

export function NotificationsBell() {
  const { 
    notifications: realtimeNotifs, 
    unreadCount: realtimeUnread, 
    isConnected,
    refresh 
  } = useRealtimeNotifications({
    enableToasts: true,
    enableSound: true,
    enableDesktop: true,
  });

  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Sync with realtime hook
  useEffect(() => {
    if (realtimeNotifs.length > 0) {
      const mapped = realtimeNotifs.map(n => ({
        ...n,
        read: false,
      })) as AppNotification[];
      setNotifications(mapped);
      setUnreadCount(realtimeUnread);
      setLoading(false);
    }
  }, [realtimeNotifs, realtimeUnread]);

  const fetchNotifications = async (isInitial = false) => {
    try {
      const res = await fetch('/api/notifications?limit=5');
      if (res.ok) {
        const data = await res.json();
        const notifs: AppNotification[] = data.notifications || [];
        setNotifications(notifs);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (e) {
      // silent
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Initial load + manual refresh support
    fetchNotifications(true);
    // The useRealtimeNotifications hook handles the real-time updates now
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Load client notification presentation prefs (desktop + sound)
  useEffect(() => {
    const loadPrefs = async () => {
      try {
        const res = await fetch('/api/user/notification-preferences');
        if (res.ok) {
          const p = await res.json();
          setClientPrefs({
            desktop: p.desktopNotifications ?? true,
            sound: p.soundEnabled ?? true,
          });
        }
      } catch {
        // fallback to localStorage or defaults
        const d = localStorage.getItem('desktopNotifs');
        const s = localStorage.getItem('soundNotifs');
        setClientPrefs({
          desktop: d === null ? true : d !== 'false',
          sound: s === null ? true : s !== 'false',
        });
      }
    };
    loadPrefs();
  }, []);

  // Simple chime using Web Audio (no asset files required)
  const playNotificationSound = () => {
    if (!clientPrefs.sound) return;
    try {
      const AudioContextCtor = (window as any).AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextCtor) return;
      const audio = new AudioContextCtor();
      const t = audio.currentTime;

      // Pleasant two-tone notification chime
      const o1 = audio.createOscillator();
      const g1 = audio.createGain();
      o1.type = 'sine';
      o1.frequency.value = 932; // A#5
      g1.gain.value = 0.09;

      const o2 = audio.createOscillator();
      const g2 = audio.createGain();
      o2.type = 'sine';
      o2.frequency.value = 698; // F5
      g2.gain.value = 0.07;

      const filter = audio.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 1800;

      o1.connect(g1); g1.connect(filter);
      o2.connect(g2); g2.connect(filter);
      filter.connect(audio.destination);

      o1.start(t);
      o1.stop(t + 0.18);
      o2.start(t + 0.09);
      o2.stop(t + 0.32);

      // gentle release
      g1.gain.linearRampToValueAtTime(0.001, t + 0.25);
      g2.gain.linearRampToValueAtTime(0.001, t + 0.42);
    } catch (e) {
      // ignore audio errors (some browsers block autoplay until interaction)
    }
  };

  const triggerDesktopNotification = (n: AppNotification) => {
    if (!clientPrefs.desktop) return;
    if (!('Notification' in window) || Notification.permission !== 'granted') return;

    try {
      const desktopNotif = new Notification(n.title, {
        body: n.message?.slice(0, 120) || 'Tienes una nueva notificación',
        icon: '/logo.png',
        tag: `oiga-${n.id}`, // avoid duplicates
        requireInteraction: false,
      });

      desktopNotif.onclick = () => {
        window.focus();
        if (n.link) window.location.href = n.link;
        desktopNotif.close();
      };
    } catch (e) {
      // permission or security error - ignore
    }
  };

  // Detect new notifications from polling and trigger sound + desktop
  useEffect(() => {
    if (loading) return;

    const currentIds = new Set(notifications.map(n => n.id));
    let hasNew = false;

    // Check for brand new notification ids
    notifications.forEach(n => {
      if (!seenIdsRef.current.has(n.id) && !n.read) {
        seenIdsRef.current.add(n.id);
        if (prevUnreadRef.current > 0 || notifications.length > 0) { // avoid initial burst
          hasNew = true;
          triggerDesktopNotification(n);
        }
      }
    });

    // Also detect unread count jump (covers some edge cases)
    if (unreadCount > prevUnreadRef.current && prevUnreadRef.current > 0) {
      hasNew = true;
      // trigger for the first unread if possible
      const firstNew = notifications.find(n => !n.read);
      if (firstNew) triggerDesktopNotification(firstNew);
    }

    if (hasNew) {
      playNotificationSound();
    }

    prevUnreadRef.current = unreadCount;
  }, [notifications, unreadCount, loading, clientPrefs]);

  const markAsRead = async (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    try {
      await fetch(`/api/notifications/${id}/read`, { method: 'PATCH' });
      fetchNotifications();
    } catch (err) {
      // ignore
    }
  };

  const markAllAsRead = async () => {
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAllAsRead: true }),
      });
      fetchNotifications();
    } catch (err) {
      // ignore
    }
  };

  const handleBellClick = () => {
    if (!isOpen) {
      fetchNotifications(); // refresh when opening
    }
    setIsOpen(!isOpen);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        variant="ghost"
        size="icon"
        className="relative"
        onClick={handleBellClick}
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5" />
        {!loading && unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-[10px] font-medium text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </Button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-[calc(100vw-2rem)] max-w-80 bg-background border border-border rounded-xl shadow-lg z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b">
            <span className="font-semibold">Notificaciones</span>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-xs text-orange-600 hover:underline flex items-center gap-1"
              >
                <Check size={14} /> Marcar todas
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-sm text-muted-foreground">
                No tienes notificaciones todavía.
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className={`px-4 py-3 border-b last:border-b-0 hover:bg-muted/50 cursor-pointer transition-colors ${!n.read ? 'bg-orange-50/60 dark:bg-orange-950/30' : ''}`}
                  onClick={() => {
                    if (!n.read) markAsRead(n.id);
                    if (n.link) window.location.href = n.link;
                    setIsOpen(false);
                  }}
                >
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm truncate">{n.title}</div>
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5 pr-2">{n.message}</p>
                    </div>
                    {!n.read && (
                      <button
                        onClick={(e) => markAsRead(n.id, e)}
                        className="text-[10px] px-2 py-0.5 rounded bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300 hover:bg-orange-200 flex-shrink-0"
                        title="Marcar como leída"
                      >
                        ✓
                      </button>
                    )}
                  </div>
                  <div className="text-[10px] text-muted-foreground mt-1.5">
                    {new Date(n.createdAt).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })}
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="p-2 border-t text-center">
            <Link 
              href="/notifications" 
              className="text-sm text-orange-600 hover:underline"
              onClick={() => setIsOpen(false)}
            >
              Ver todas las notificaciones →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
