'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner'; // Using Sonner for 2027-grade beautiful actionable toasts
import { playNotificationSound } from './notificationSound';
import type { JsonObject } from '@/types/json';

// Types
export interface NotificationAction {
  label: string;
  action: string;
  data?: JsonObject;
}

export interface RealtimeNotification {
  id: string;
  title: string;
  message: string;
  link?: string | null;
  category: string;
  createdAt: string;
  read?: boolean;
  data?: JsonObject & {
    actions?: NotificationAction[];
  };
}

interface UseRealtimeNotificationsOptions {
  enableToasts?: boolean;
  enableSound?: boolean;
  enableDesktop?: boolean;
  onNewNotification?: (notif: RealtimeNotification) => void;
}

// Global singleton to avoid multiple SSE connections
let globalEventSource: EventSource | null = null;
let connectionCount = 0;
let sseErrorLogged = false;
let reconnectTimeoutId: number | null = null;

// Global dedup for toasts across hook instances (prevents multiples from responsive nav renders etc.)
const globalShownIds: Set<string> =
  typeof globalThis !== 'undefined' && '__notifShownIds' in globalThis
    ? (globalThis as typeof globalThis & { __notifShownIds: Set<string> }).__notifShownIds
    : (() => {
        const set = new Set<string>();
        if (typeof globalThis !== 'undefined') {
          (globalThis as typeof globalThis & { __notifShownIds: Set<string> }).__notifShownIds = set;
        }
        return set;
      })();

/**
 * Best-in-2027 Realtime Notifications Hook
 * - SSE for instant updates (replaces 45s polling)
 * - Beautiful actionable toasts (Sonner)
 * - Sound + Desktop (existing logic)
 * - Graceful fallback to polling
 */
export function useRealtimeNotifications(options: UseRealtimeNotificationsOptions = {}) {
  const {
    enableToasts = true,
    enableSound = true,
    enableDesktop = true,
    onNewNotification,
  } = options;

  const { data: session, status: sessionStatus } = useSession();

  const [notifications, setNotifications] = useState<RealtimeNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const lastNotificationIds = useRef<Set<string>>(new Set());
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const scheduleReconnectRef = useRef<(delayMs?: number) => void>(() => {});

  const isAuthed = sessionStatus === 'authenticated' && !!session?.user;

  // Show rich actionable toast with 2027-grade buttons
  const showNotificationToast = useCallback((notif: RealtimeNotification) => {
    if (!enableToasts) return;

    if (globalShownIds.has(notif.id)) return;
    globalShownIds.add(notif.id);

    const notifData = notif.data || {};
    const customActions: NotificationAction[] = Array.isArray(notifData.actions) ? notifData.actions : [];

    // Build action buttons for description (when we have rich custom actions)
    // or a simple action object for Sonner's action prop (simple link case)
    let descriptionExtra: React.ReactNode = null;
    let toastAction: { label: string; onClick: () => void } | undefined = undefined;

    if (customActions.length > 0) {
      descriptionExtra = (
        <div className="flex gap-2 mt-2">
          {customActions.map((act, index) => (
            <button
              key={index}
              onClick={async () => {
                toast.dismiss();
                await handleNotificationAction(act.action, act.data, notif);
              }}
              className="text-xs px-3 py-1.5 rounded bg-orange-600 hover:bg-orange-700 text-white font-medium"
            >
              {act.label}
            </button>
          ))}
          {notif.link && (
            <button
              onClick={() => {
                toast.dismiss();
                window.location.href = notif.link!;
              }}
              className="text-xs px-3 py-1.5 rounded border"
            >
              Ver
            </button>
          )}
        </div>
      );
    } else if (notif.link) {
      toastAction = {
        label: 'Ver',
        onClick: () => { window.location.href = notif.link!; },
      };
    }

    const toastId = toast(notif.title, {
      description: (
        <div>
          <p>{notif.message}</p>
          {descriptionExtra}
        </div>
      ),
      action: toastAction,
      cancel: {
        label: 'Cerrar',
        onClick: () => toast.dismiss(toastId),
      },
      duration: customActions.length > 0 ? 12000 : 8000,
      className: 'font-medium',
    });

    // Browser desktop + sound
    if (enableDesktop && 'Notification' in window && Notification.permission === 'granted') {
      try {
        const desktop = new Notification(notif.title, {
          body: notif.message,
          icon: '/logo.png',
          tag: `realtime-${notif.id}`,
        });
        desktop.onclick = () => {
          window.focus();
          if (notif.link) window.location.href = notif.link;
          desktop.close();
        };
      } catch {}
    }

    if (enableSound) {
      playNotificationSound();
    }
  }, [enableToasts, enableDesktop, enableSound]);

  const patchOrderStatusFromNotification = async (
    orderId: string,
    targetStatus: 'In Progress' | 'Completed'
  ): Promise<{ ok: boolean; message?: string }> => {
    const orderRes = await fetch(`/api/orders/${orderId}`);
    if (!orderRes.ok) {
      return { ok: false, message: 'No se pudo cargar el pedido' };
    }
    const orderPayload = await orderRes.json().catch(() => ({}));
    const currentStatus = orderPayload?.order?.status ?? orderPayload?.status;

    if (targetStatus === 'In Progress') {
      if (currentStatus === 'In Progress' || currentStatus === 'Completed') {
        return { ok: true, message: 'El pedido ya está en progreso o completado' };
      }
      if (currentStatus !== 'Paid') {
        return {
          ok: false,
          message: 'El pedido debe estar pagado antes de iniciar el trabajo',
        };
      }
    }

    if (targetStatus === 'Completed') {
      if (currentStatus === 'Completed') {
        return { ok: true, message: 'El pedido ya está completado' };
      }
      if (currentStatus !== 'Paid' && currentStatus !== 'In Progress') {
        return {
          ok: false,
          message: 'Solo puedes completar pedidos pagados o en progreso',
        };
      }
    }

    const res = await fetch(`/api/orders/${orderId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: targetStatus }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      const message = typeof err.error === 'string' ? err.error : 'No se pudo actualizar el estado';
      return { ok: false, message };
    }

    return { ok: true };
  };

  // Handle rich actions from notifications (2027-grade quick actions)
  const handleNotificationAction = async (actionType: string, actionData: JsonObject | undefined, notif: RealtimeNotification) => {
    const orderId = (typeof actionData?.orderId === 'string' ? actionData.orderId : undefined) || notif.link?.split('/').pop();
    const userId =
      (typeof actionData?.userId === 'string' ? actionData.userId : undefined) ||
      (typeof actionData?.otherUserId === 'string' ? actionData.otherUserId : undefined);

    try {
      switch (actionType) {
        // Order actions
        case 'mark_order_completed':
        case 'complete_order':
          if (orderId) {
            const result = await patchOrderStatusFromNotification(orderId, 'Completed');
            if (result.ok) {
              toast.success(result.message || 'Pedido marcado como completado');
            } else {
              toast.error(result.message || 'No se pudo completar el pedido');
            }
            window.location.href = `/orders/${orderId}`;
          }
          break;

        case 'mark_as_shipped':
        case 'ship_order':
          if (orderId) {
            const result = await patchOrderStatusFromNotification(orderId, 'In Progress');
            if (result.ok) {
              toast.success(result.message || 'Pedido marcado como en progreso');
            } else {
              toast.error(result.message || 'No se pudo actualizar el pedido');
            }
            window.location.href = `/orders/${orderId}`;
          }
          break;

        case 'start_order':
        case 'mark_in_progress':
          if (orderId) {
            const result = await patchOrderStatusFromNotification(orderId, 'In Progress');
            if (result.ok) {
              toast.success(result.message || 'Pedido iniciado');
            } else {
              toast.error(result.message || 'No se pudo iniciar el pedido');
            }
            window.location.href = `/orders/${orderId}`;
          }
          break;

        case 'request_review':
        case 'leave_review':
          if (orderId) {
            window.location.href = `/orders/${orderId}`;
          }
          break;

        // Messaging
        case 'message_buyer':
        case 'message_seller':
        case 'reply_message':
          if (orderId) {
            window.location.href = `/orders/${orderId}`;
          } else if (userId) {
            // Fallback: go to profile or orders
            window.location.href = `/orders`;
          }
          break;

        // Reviews
        case 'respond_to_review':
          if (typeof actionData?.reviewId === 'string' && actionData.reviewId) {
            window.location.href = `/seller/earnings`; // or a dedicated review response page
          } else {
            window.location.href = `/seller/earnings`;
          }
          break;

        // Referrals / Payouts
        case 'request_payout':
        case 'view_earnings':
          window.location.href = '/referrals';
          break;

        // General
        case 'view_order':
        case 'view':
        case 'view_gig':
          window.location.href = notif.link || '/orders';
          break;

        case 'mark_as_read':
          await fetch(`/api/notifications/${notif.id}/read`, { method: 'PATCH' });
          setNotifications((prev) => prev.filter((n) => n.id !== notif.id));
          setUnreadCount((c) => Math.max(0, c - 1));
          toast.success('Notificación marcada como leída');
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('notifications:read-updated'));
          }
          break;

        case 'edit_gig':
          if (typeof actionData?.gigId === 'string' && actionData.gigId) {
            window.location.href = `/seller/gigs`;
          }
          break;

        default:
          if (notif.link) window.location.href = notif.link;
      }
    } catch (err) {
      toast.error('No se pudo completar la acción');
      console.error('Action failed:', actionType, err);
    }
  };

  const openEventSource = useCallback(() => {
    if (typeof window === 'undefined' || !isAuthed || globalEventSource) return;

    try {
      const es = new EventSource('/api/notifications/stream');
      globalEventSource = es;

      es.onopen = () => {
        setIsConnected(true);
        sseErrorLogged = false;
      };

      es.addEventListener('notification', (event) => {
        try {
          const notif: RealtimeNotification = JSON.parse(event.data);

          if (lastNotificationIds.current.has(notif.id)) return;
          lastNotificationIds.current.add(notif.id);

          setNotifications(prev => [notif, ...prev].slice(0, 50));
          setUnreadCount(c => c + 1);

          showNotificationToast(notif);
          onNewNotification?.(notif);
        } catch (e) {
          console.error('Failed to parse SSE notification', e);
        }
      });

      es.addEventListener('heartbeat', () => {
        // Connection alive
      });

      es.addEventListener('reconnect', () => {
        setIsConnected(false);
        es.close();
        globalEventSource = null;
        scheduleReconnectRef.current(1000);
      });

      es.onerror = () => {
        setIsConnected(false);
        if (!sseErrorLogged) {
          console.warn('[Notifications] SSE dropped - reconnecting (polling as backup)');
          sseErrorLogged = true;
        }
        if (globalEventSource === es) {
          es.close();
          globalEventSource = null;
          scheduleReconnectRef.current(1000);
        }
      };
    } catch (err) {
      console.error('Failed to connect SSE', err);
      setIsConnected(false);
    }
  }, [isAuthed, showNotificationToast, onNewNotification]);

  const scheduleReconnect = useCallback((delayMs = 1000) => {
    if (typeof window === 'undefined' || !isAuthed) return;
    if (reconnectTimeoutId !== null) return;

    reconnectTimeoutId = window.setTimeout(() => {
      reconnectTimeoutId = null;
      openEventSource();
    }, delayMs);
  }, [isAuthed, openEventSource]);

  scheduleReconnectRef.current = scheduleReconnect;

  // Connect to SSE (primary real-time channel)
  const connectSSE = useCallback(() => {
    if (typeof window === 'undefined') return;
    if (!isAuthed) return;

    connectionCount++;
    if (globalEventSource) {
      setIsConnected(true);
      return;
    }

    openEventSource();
  }, [isAuthed, openEventSource]);

  // Fallback polling (when SSE fails or as backup)
  const startPollingFallback = useCallback(() => {
    if (pollingIntervalRef.current) return;
    if (!isAuthed) return;

    pollingIntervalRef.current = setInterval(async () => {
      try {
        const res = await fetch('/api/notifications?limit=5&unreadOnly=true');
        if (!res.ok) return;

        const data = await res.json();
        const unread = (data.notifications || []).filter((n: RealtimeNotification) => !n.read);
        const newOnes = unread.filter(
          (n: RealtimeNotification) => !lastNotificationIds.current.has(n.id)
        );

        if (newOnes.length > 0) {
          newOnes.forEach((n: RealtimeNotification) => lastNotificationIds.current.add(n.id));
          setNotifications((prev) => [...newOnes, ...prev.filter((p) => !p.read)].slice(0, 50));
          setUnreadCount(data.unreadCount || 0);
          newOnes.forEach((n: RealtimeNotification) => showNotificationToast(n));
        } else {
          setNotifications(unread);
          setUnreadCount(data.unreadCount || 0);
        }
      } catch (e) {
        // silent
      }
    }, 30000); // 30s fallback polling (much better than 45s, and only when needed)
  }, [showNotificationToast]);

  // Main connection effect
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Do not attempt SSE or polling for unauthenticated users.
    // Prevents 401 errors and console noise on public pages (login, /gigs when logged out, etc.).
    if (!isAuthed) {
      setIsConnected(false);
      return;
    }

    connectSSE();
    startPollingFallback();

    // Cleanup
    return () => {
      connectionCount--;
      if (connectionCount <= 0) {
        if (reconnectTimeoutId !== null) {
          clearTimeout(reconnectTimeoutId);
          reconnectTimeoutId = null;
        }
        if (globalEventSource) {
          globalEventSource.close();
          globalEventSource = null;
        }
      }
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, [connectSSE, startPollingFallback, isAuthed]);

  // Manual refresh (authoritative from DB)
  const refresh = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications?limit=20&unreadOnly=true');
      if (res.ok) {
        const data = await res.json();
        const unread = (data.notifications || []).filter((n: RealtimeNotification) => !n.read);
        setNotifications(unread);
        setUnreadCount(data.unreadCount || 0);
        unread.forEach((n: RealtimeNotification) => lastNotificationIds.current.add(n.id));
      }
    } catch {}
  }, []);

  // Listen for external "notifications were marked read" events (from full /notifications page or other contexts)
  // This lets marks done outside the bell immediately correct the bell badge / hook state.
  useEffect(() => {
    const handler = () => {
      // Pull fresh count + recent list without waiting for the 30s poll
      refresh();
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('notifications:read-updated', handler);
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('notifications:read-updated', handler);
      }
    };
  }, [refresh]);

  return {
    notifications,
    unreadCount,
    isConnected,
    refresh,
    showNotificationToast,
  };
}

/**
 * Push Subscription Management (for real Web Push)
 */
export async function subscribeToPushNotifications() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    throw new Error('Push notifications not supported');
  }

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    throw new Error('Notification permission denied');
  }

  // Register service worker
  const registration = await navigator.serviceWorker.register('/notification-sw.js');
  await navigator.serviceWorker.ready;

  const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  if (!vapidKey) {
    throw new Error('VAPID public key not configured');
  }

  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(vapidKey),
  });

  // Send to server
  const res = await fetch('/api/notifications/push/subscribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      subscription: subscription.toJSON(),
      device: navigator.userAgent.includes('Mobile') ? 'Mobile' : 'Desktop',
    }),
  });

  if (!res.ok) throw new Error('Failed to save subscription');

  return subscription;
}

export async function unsubscribeFromPushNotifications() {
  if (!('serviceWorker' in navigator)) return;

  const registration = await navigator.serviceWorker.getRegistration('/notification-sw.js');
  if (registration) {
    const subscription = await registration.pushManager.getSubscription();
    if (subscription) {
      await subscription.unsubscribe();
      await fetch('/api/notifications/push/unsubscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoint: subscription.endpoint }),
      });
    }
  }
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

// Simple sound utility (extracted for reuse)
export { playNotificationSound } from './notificationSound';
