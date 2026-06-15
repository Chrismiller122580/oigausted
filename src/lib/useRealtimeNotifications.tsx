'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner'; // Using Sonner for 2027-grade beautiful actionable toasts
import { playNotificationSound } from './notificationSound';

// Types
export interface RealtimeNotification {
  id: string;
  title: string;
  message: string;
  link?: string | null;
  category: string;
  createdAt: string;
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

  // Global dedup for toasts across any hook instances (prevents multiples from responsive nav renders etc.)
  // Module level so shared.
  if (!(globalThis as any).__notifShownIds) {
    (globalThis as any).__notifShownIds = new Set<string>();
  }
  const globalShownIds: Set<string> = (globalThis as any).__notifShownIds;

  const isAuthed = sessionStatus === 'authenticated' && !!session?.user;

  // Show rich actionable toast with 2027-grade buttons
  const showNotificationToast = useCallback((notif: RealtimeNotification) => {
    if (!enableToasts) return;

    if (globalShownIds.has(notif.id)) return;
    globalShownIds.add(notif.id);

    const notifData = (notif as any).data || {};
    const customActions: Array<{ label: string; action: string; data?: any }> = notifData.actions || [];

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

  // Handle rich actions from notifications (2027-grade quick actions)
  const handleNotificationAction = async (actionType: string, actionData: any, notif: RealtimeNotification) => {
    const orderId = actionData?.orderId || notif.link?.split('/').pop();
    const userId = actionData?.userId || actionData?.otherUserId;

    try {
      switch (actionType) {
        // Order actions
        case 'mark_order_completed':
        case 'complete_order':
          if (orderId) {
            await fetch(`/api/orders/${orderId}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ status: 'Completed' }),
            });
            toast.success('Pedido marcado como completado');
            window.location.href = `/orders/${orderId}`;
          }
          break;

        case 'mark_as_shipped':
        case 'ship_order':
          if (orderId) {
            await fetch(`/api/orders/${orderId}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ status: 'In Progress' }),
            });
            toast.success('Pedido marcado como enviado');
            window.location.href = `/orders/${orderId}`;
          }
          break;

        case 'start_order':
        case 'mark_in_progress':
          if (orderId) {
            await fetch(`/api/orders/${orderId}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ status: 'In Progress' }),
            });
            toast.success('Pedido iniciado');
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
          if (actionData?.reviewId) {
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
          toast.success('Notificación marcada como leída');
          break;

        case 'edit_gig':
          if (actionData?.gigId) {
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

  // Connect to SSE (primary real-time channel)
  const connectSSE = useCallback(() => {
    if (typeof window === 'undefined') return;
    if (!isAuthed) return;

    connectionCount++;
    if (globalEventSource) {
      setIsConnected(true);
      return;
    }

    try {
      const es = new EventSource('/api/notifications/stream');
      globalEventSource = es;

      es.onopen = () => {
        setIsConnected(true);
        console.log('[Notifications] SSE connected');
        // Reset error log flag on successful reconnect
        if (globalEventSource) (globalEventSource as any)._sseErrorLogged = false;
      };

      es.addEventListener('notification', (event) => {
        try {
          const notif: RealtimeNotification = JSON.parse(event.data);

          // Dedupe
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

      es.onerror = (e) => {
        setIsConnected(false);
        // Do not close the EventSource here - browser's EventSource automatically
        // retries with backoff on errors. We keep the reference so reconnects
        // can succeed and fire onopen again. Polling runs in parallel as reliable backup.
        // Log only once per "drop" to avoid spam; transient errors are normal on Vercel/prod.
        if (! (globalEventSource as any)?._sseErrorLogged) {
          console.warn('[Notifications] SSE error - auto-retrying (polling as backup)');
          (globalEventSource as any)._sseErrorLogged = true;
        }
        // Do NOT close or null here. Let browser retry. Cleanup on unmount will handle close.
      };

    } catch (err) {
      console.error('Failed to connect SSE', err);
      setIsConnected(false);
    }
  }, [showNotificationToast, onNewNotification]);

  // Fallback polling (when SSE fails or as backup)
  const startPollingFallback = useCallback(() => {
    if (pollingIntervalRef.current) return;
    if (!isAuthed) return;

    pollingIntervalRef.current = setInterval(async () => {
      try {
        const res = await fetch('/api/notifications?limit=5');
        if (!res.ok) return;

        const data = await res.json();
        const newOnes = (data.notifications || []).filter(
          (n: any) => !lastNotificationIds.current.has(n.id)
        );

        if (newOnes.length > 0) {
          newOnes.forEach((n: any) => lastNotificationIds.current.add(n.id));
          setNotifications(prev => [...newOnes, ...prev].slice(0, 50));
          setUnreadCount(data.unreadCount || 0);

          // Show toasts for new ones
          newOnes.forEach((n: RealtimeNotification) => showNotificationToast(n));
        } else {
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
      if (connectionCount <= 0 && globalEventSource) {
        globalEventSource.close();
        globalEventSource = null;
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
      const res = await fetch('/api/notifications?limit=20');
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
        (data.notifications || []).forEach((n: any) => lastNotificationIds.current.add(n.id));
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

  // Register service worker (idempotent)
  const registration = await navigator.serviceWorker.register('/notification-sw.js');
  await navigator.serviceWorker.ready;

  // If already subscribed, just return the existing one (avoid duplicate server entries)
  const existing = await registration.pushManager.getSubscription();
  if (existing) {
    // Re-send to server in case it was lost (idempotent upsert)
    await fetch('/api/notifications/push/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subscription: existing.toJSON(),
        device: navigator.userAgent.includes('Mobile') ? 'Mobile' : 'Desktop',
      }),
    }).catch(() => {});
    return existing;
  }

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
