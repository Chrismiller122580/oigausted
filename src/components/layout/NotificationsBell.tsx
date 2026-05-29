'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Bell, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Notification {
  id: string;
  title: string;
  message: string;
  link: string | null;
  read: boolean;
  createdAt: string;
}

export function NotificationsBell() {
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/notifications?limit=5');
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (e) {
      // silent
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 45000); // poll every 45s
    return () => clearInterval(interval);
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
        <div className="absolute right-0 mt-2 w-80 bg-background border border-border rounded-xl shadow-lg z-50 overflow-hidden">
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
