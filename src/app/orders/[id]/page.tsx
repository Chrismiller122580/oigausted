'use client';

import { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import MapsPollutionNuke from '@/components/maps/MapsPollutionNuke';
import { useParams, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { useGigCategories } from '@/lib/useGigCategories';
import { parseCustomFields } from '@/lib/utils';
import GoogleMap from '@/components/maps/GoogleMap';
import { MapPin } from 'lucide-react';

declare global {
  interface Window {
    WompiCheckout?: any;
  }
}

function OrderDetailClient() {
  const params = useParams();
  const searchParams = useSearchParams();
  const orderId = params.id as string;
  const { data: session } = useSession();
  const { categories: gigCategories } = useGigCategories();

  const [order, setOrder] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [reviewText, setReviewText] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [existingReview, setExistingReview] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'chat' | 'progress' | 'review'>('overview');
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Polling for Wompi payment confirmation (smart non-bypass UX)
  const [isPollingPayment, setIsPollingPayment] = useState(false);
  const paymentPollRef = useRef<NodeJS.Timeout | null>(null);

  // For the Wompi debugger panel
  const [lastWompiPrepareDebug, setLastWompiPrepareDebug] = useState<any>(null);

  // Robust Wompi script readiness (mirrors checkout page to avoid "cargando" / silent fail to open payment UI)
  const [wompiReady, setWompiReady] = useState(false);
  const [wompiLoadFailed, setWompiLoadFailed] = useState(false);
  const [maintenanceMode, setMaintenanceMode] = useState(false);

  const ensureWompiReady = async (): Promise<boolean> => {
    if (wompiReady) return true;
    if (typeof window === 'undefined') return false;

    const hasGlobal = () => !!(window as any).WompiCheckout || !!(window as any).WidgetCheckout;

    if (hasGlobal()) {
      setWompiReady(true);
      setWompiLoadFailed(false);
      return true;
    }

    // Inject script if missing
    if (!document.querySelector('script[src*="checkout.wompi.co"]')) {
      // Set globals before loading the script so Wompi's bundle can see the public key during its own initialization
      const pk = (window as any).WOMPI_PUBLIC_KEY || '';
      if (pk) {
        (window as any).WOMPI_PUBLIC_KEY = pk;
        if ((window as any).$wompi && typeof (window as any).$wompi.initialize === 'function') {
          try { (window as any).$wompi.initialize({ publicKey: pk }); } catch {}
        }
      }

      const script = document.createElement('script');
      script.src = 'https://checkout.wompi.co/widget.js';
      script.async = true;
      script.onload = () => {
        setTimeout(() => {
          if (hasGlobal()) {
            setWompiReady(true);
            setWompiLoadFailed(false);

            // Force globals + initialize as soon as the class appears.
            // Catches Wompi internal auto merchant fetches that happen right after script load.
            const earlyKey = (window as any).WOMPI_PUBLIC_KEY || '';
            if (earlyKey) {
              (window as any).WOMPI_PUBLIC_KEY = earlyKey;
              (window as any).$wompi = (window as any).$wompi || {};
              (window as any).$wompi.publicKey = earlyKey;
              if (typeof (window as any).$wompi.initialize === 'function') {
                try { (window as any).$wompi.initialize({ publicKey: earlyKey }); } catch {}
              }
            }
          }
        }, 250);
      };
      script.onerror = () => setWompiLoadFailed(true);
      document.head.appendChild(script);
    }

    // Poll up to ~5s
    for (let i = 0; i < 25; i++) {
      if (hasGlobal()) {
        setWompiReady(true);
        setWompiLoadFailed(false);
        return true;
      }
      await new Promise(r => setTimeout(r, 200));
    }
    setWompiLoadFailed(true);
    return false;
  };

  const uid = (session?.user as any)?.id;
  const isBuyer = order?.buyerId === uid;
  const isSeller = order?.sellerId === uid;
  const isAdmin = (session?.user as any)?.role === 'admin';
  const isCompleted = order?.status === 'Completed';

  useEffect(() => {
    if (!orderId) return;
    Promise.all([
      fetch(`/api/orders/${orderId}`).then(r => r.json()),
      fetch(`/api/orders/${orderId}/messages`).then(r => r.json().catch(() => ({ messages: [] }))),
      fetch(`/api/orders/${orderId}/review`).then(r => r.json().catch(() => ({ review: null })))
    ]).then(([orderData, msgData, reviewData]) => {
      setOrder(orderData.order || orderData);
      setMessages(msgData.messages || []);
      setExistingReview(reviewData.review || null);

      // Fetch maintenance mode to gate debug tools
      fetch('/api/admin/config')
        .then(r => r.json())
        .then(data => setMaintenanceMode(!!data.maintenanceMode))
        .catch(() => {});
      if (reviewData.review) {
        setReviewRating(reviewData.review.rating);
        setReviewText(reviewData.review.comment || '');
      }

      // Smart default tab
      const urlTab = searchParams.get('tab') as any;
      const needsReview = (orderData.order || orderData)?.status === 'Completed' && !reviewData.review;

      if (urlTab === 'review' && (orderData.order || orderData)?.status === 'Completed') {
        setActiveTab('review');
      } else if (needsReview) {
        setActiveTab('review');
      } else if (urlTab) {
        setActiveTab(urlTab);
      }

      setLoading(false);

      // === Smart Wompi payment polling (non-bypass UX) ===
      // If the order is still Pending shortly after creation/redirect from checkout,
      // start polling the order status so the user sees the update without manual refresh.
      const currentOrder = orderData.order || orderData;
      if (currentOrder?.status === 'Pending') {
        const createdRecently = currentOrder.createdAt && (Date.now() - new Date(currentOrder.createdAt).getTime() < 1000 * 60 * 10);
        if (createdRecently || searchParams.get('from') === 'wompi' || searchParams.get('tab') === 'overview') {
          startPaymentPolling();
        }
      }

      // Auto-mark any unread notifications related to this order (message / order updates)
      // so the bell stops ringing for conversations the user has now opened/read.
      // Runs once per order load (best-effort, non-blocking).
      (async () => {
        try {
          const notifRes = await fetch('/api/notifications?limit=30');
          if (!notifRes.ok) return;
          const notifData = await notifRes.json();
          const related = (notifData.notifications || []).filter((n: any) =>
            !n.read &&
            (n.link?.includes(orderId) || n.link?.includes(`/orders/${orderId}`))
          );
          if (related.length > 0) {
            const ids = related.map((n: any) => n.id);
            await fetch('/api/notifications', {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ ids }),
            }).catch(() => {});
            // Nudge bell
            if (typeof window !== 'undefined') {
              window.dispatchEvent(new CustomEvent('notifications:read-updated'));
            }
          }
        } catch {}
      })();
    }).catch(() => setLoading(false));
  }, [orderId, searchParams]);

  // Polling helper for pending Wompi payments
  const startPaymentPolling = () => {
    if (paymentPollRef.current) return;
    setIsPollingPayment(true);

    paymentPollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/orders/${orderId}`);
        if (!res.ok) return;
        const data = await res.json();
        const fresh = data.order || data;

        if (fresh.status !== 'Pending') {
          setOrder(fresh);
          setIsPollingPayment(false);
          if (paymentPollRef.current) {
            clearInterval(paymentPollRef.current);
            paymentPollRef.current = null;
          }
          toast.success(`Pago confirmado: ${fresh.status}`);
          // Refresh other data like messages if needed
        }
      } catch (e) {
        // ignore transient fetch errors
      }
    }, 4000); // every 4s

    // Auto-stop after ~2 minutes
    setTimeout(() => {
      if (paymentPollRef.current) {
        clearInterval(paymentPollRef.current);
        paymentPollRef.current = null;
        setIsPollingPayment(false);
      }
    }, 1000 * 120);
  };

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (paymentPollRef.current) {
        clearInterval(paymentPollRef.current);
        paymentPollRef.current = null;
      }
    };
  }, []);

  // Auto-scroll chat to bottom when messages update
  useEffect(() => {
    if (activeTab === 'chat' && chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages, activeTab]);

  // Poll for new messages when on chat tab (no websockets yet)
  useEffect(() => {
    if (!orderId || activeTab !== 'chat') return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/orders/${orderId}/messages`);
        if (res.ok) {
          const data = await res.json();
          const newMsgs = data.messages || [];
          // Only update if we have more messages (simple diff)
          if (newMsgs.length > messages.length) {
            setMessages(newMsgs);
          }
        }
      } catch {}
    }, 8000); // every 8s while on chat

    return () => clearInterval(interval);
  }, [orderId, activeTab, messages.length]);

  const sendMessage = useCallback(async () => {
    if (!newMessage.trim() || !orderId) return;
    try {
      const res = await fetch(`/api/orders/${orderId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newMessage })
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setMessages(prev => [...prev, data.message]);
      setNewMessage('');
      toast.success('✅ Mensaje enviado');
    } catch {
      toast.error('Error enviando mensaje');
    }
  }, [newMessage, orderId]);

  const uploadFile = useCallback(async (e: any) => {
    const file = e.target.files[0];
    if (!file || !orderId) return;
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await fetch(`/api/orders/${orderId}/messages`, { method: 'POST', body: formData });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setMessages(prev => [...prev, data.message]);
      toast.success('📎 Archivo subido');
    } catch {
      toast.error('Error subiendo archivo');
    }
  }, [orderId]);

  const updateStatus = async (status: string) => {
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      
      if (res.ok) {
        toast.success(`Estado actualizado: ${status}`);
        // Refetch order data
        const updatedOrder = await fetch(`/api/orders/${orderId}`).then(r => r.json());
        setOrder(updatedOrder.order || updatedOrder);
      } else {
        toast.error('Error actualizando estado');
      }
    } catch {
      toast.error('Error actualizando');
    }
  };

  const submitReview = async () => {
    if (!reviewText.trim()) return toast.error("Escribe una reseña");
    try {
      const res = await fetch(`/api/orders/${orderId}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating: reviewRating, comment: reviewText })
      });
      
      if (res.ok) {
        toast.success("¡Reseña enviada! Gracias por tu opinión.");
        // Refetch to update existingReview
        const reviewRes = await fetch(`/api/orders/${orderId}/review`).then(r => r.json());
        setExistingReview(reviewRes.review || null);
        setActiveTab('overview'); // Switch away after submitting
      } else {
        toast.error("Error enviando reseña");
      }
    } catch {
      toast.error("Error enviando reseña");
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-orange-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-lg text-muted-foreground">Cargando pedido...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-4xl mx-auto p-12 text-center">
        <p className="text-2xl text-red-600 mb-4">Pedido no encontrado</p>
        <a href="/orders" className="text-orange-600 hover:underline">Volver a mis pedidos →</a>
      </div>
    );
  }

  const categoryInfo = gigCategories.find(c => c.name === order.gig?.category) || {};
  const emoji = (categoryInfo as any).icon || (categoryInfo as any).emoji || '📦';
  const isCleaningGig = order.gig?.category?.toLowerCase().includes("limpieza");

  return (
    <div className="max-w-6xl mx-auto p-6">
      <MapsPollutionNuke />
      {/* HEADER */}
      <div className="mb-4">
        <a href="/orders" className="text-sm text-orange-600 hover:underline flex items-center gap-1">
          ← Volver a mis pedidos
        </a>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4 bg-card p-6 rounded-3xl shadow">
        <div className="flex items-center gap-4">
          <span className="text-6xl">{emoji}</span>
          <div>
            <h1 className="text-3xl font-bold">Pedido #{order.id.slice(0, 8)}</h1>
            <p className="text-xl text-foreground">{order.gig?.title}</p>
            <p className="text-sm text-muted-foreground mt-1">
              {isBuyer ? 'Vendedor' : 'Comprador'}: {isBuyer ? (order.seller?.businessName || order.seller?.name) : (order.buyer?.name)}
            </p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-5xl font-bold text-orange-600">
            ${Number(order.price || 0).toLocaleString('es-CO')}
          </div>
          <div className="text-sm uppercase tracking-widest text-muted-foreground mt-1">
            {order.status}
          </div>
        </div>
      </div>

      {/* Payment in progress banner - smart UX for real Wompi flow (no bypass) */}
      {order.status === 'Pending' && (
        <div className="mb-6 p-4 rounded-2xl bg-blue-500/10 border border-blue-500/30 text-sm">
          <div className="flex items-center gap-3">
            {isPollingPayment && <div className="animate-pulse w-2 h-2 bg-blue-500 rounded-full" />}
            <div>
              <strong>Esperando confirmación de pago de Wompi</strong>
              <span className="text-muted-foreground"> — el webhook de Wompi + polling cada 4s actualizan el estado.</span>
            </div>
          </div>
          {maintenanceMode && (
            <div className="text-[10px] text-muted-foreground mt-1">
              Reference en Wompi: <span className="font-mono font-medium">order_{order.id}</span>. Revisa el panel de debugger abajo para más detalles y forzar chequeo.
            </div>
          )}
        </div>
      )}

      {/* DEBUG TOOLS - Force Order Status (only in maintenance mode) */}
      {maintenanceMode && (
        <div className="mb-6 p-4 border-2 border-dashed border-orange-500 rounded-2xl bg-orange-50 dark:bg-orange-950/40">
          <div className="font-semibold text-orange-700 dark:text-orange-400 mb-3 flex items-center gap-2">
            🧪 DEBUG TOOLS — Force Order Status (maintenance mode)
          </div>
          <div className="flex flex-wrap gap-2">
            {['Pending', 'Paid', 'In Progress', 'Completed', 'Cancelled'].map((s) => (
              <Button
                key={s}
                size="sm"
                variant={order.status === s ? "default" : "outline"}
                onClick={() => updateStatus(s)}
                className={order.status === s ? "bg-orange-600 hover:bg-orange-700" : ""}
              >
                {s}
              </Button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Quickly jump between states to test seller dashboards, reviews, earnings, etc.
          </p>
        </div>
      )}

      {/* TABS */}
      <div className="flex border-b mb-8 bg-card rounded-t-2xl">
        {[
          { key: 'overview', label: '📋 Resumen' },
          { key: 'chat', label: '💬 Chat' },
          { key: 'progress', label: '📈 Progreso' },
          ...(isCompleted && isBuyer ? [{ key: 'review', label: '⭐ Reseña' }] : [])
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`flex-1 md:flex-none px-8 py-5 font-medium text-lg border-b-4 transition-all ${
              activeTab === tab.key ? 'border-orange-600 text-orange-600' : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* OVERVIEW + BEFORE/AFTER */}
      {activeTab === 'overview' && (
        <div className="grid md:grid-cols-12 gap-8">
          <div className="md:col-span-8">
            <Card>
              <CardHeader><CardTitle>Detalles del Servicio</CardTitle></CardHeader>
              <CardContent className="space-y-4 pt-6">
                {Object.entries(parseCustomFields(order.customFields)).map(([key, val]) => (
                  <div key={key} className="flex justify-between py-4 border-b last:border-0 text-lg">
                    <span className="capitalize text-foreground">{key.replace(/([A-Z])/g, ' $1')}</span>
                    <span className="font-semibold">{String(val)}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Service Location Map */}
            {(order.serviceLatitude && order.serviceLongitude) && (
              <Card className="mt-8">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="w-5 h-5" /> Ubicación del Servicio
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {order.serviceAddress && (
                    <div className="mb-3 flex items-center justify-between">
                      <p className="text-sm text-muted-foreground">{order.serviceAddress}</p>
                      <a 
                        href={`https://www.google.com/maps/dir/?api=1&destination=${order.serviceLatitude},${order.serviceLongitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-orange-600 hover:underline font-medium"
                      >
                        Cómo llegar →
                      </a>
                    </div>
                  )}
                  <GoogleMap 
                    center={{ lat: order.serviceLatitude, lng: order.serviceLongitude }} 
                    zoom={15}
                    markers={[{ lat: order.serviceLatitude, lng: order.serviceLongitude, title: "Lugar del servicio" }]}
                    height="320px"
                  />
                  <p className="text-[10px] text-muted-foreground mt-2">Esta es la dirección donde se realizará el servicio.</p>
                </CardContent>
              </Card>
            )}

            {isCleaningGig && (
              <Card className="mt-8">
                <CardHeader><CardTitle>📸 Antes y Después</CardTitle></CardHeader>
                <CardContent className="text-muted-foreground py-8 text-center">
                  El vendedor subirá fotos aquí una vez completado.
                </CardContent>
              </Card>
            )}
          </div>

          <div className="md:col-span-4">
            <Card>
              <CardHeader><CardTitle>Acciones</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {isSeller && (
                  <>
                    {order.status === 'Pending' && (
                      <Button onClick={() => updateStatus('In Progress')} className="w-full bg-blue-600 hover:bg-blue-700">🚀 Aceptar e Iniciar</Button>
                    )}
                    {['Pending', 'In Progress'].includes(order.status) && (
                      <Button onClick={() => updateStatus('Completed')} className="w-full">✅ Marcar como Completado</Button>
                    )}
                    {order.status !== 'Completed' && order.status !== 'Cancelled' && (
                      <Button onClick={() => updateStatus('Cancelled')} variant="outline" className="w-full text-red-600 border-red-200 hover:bg-red-50">Cancelar Pedido</Button>
                    )}
                  </>
                )}
                {!isSeller && !isCompleted && (
                  <p className="text-sm text-muted-foreground text-center py-2">El vendedor actualizará el progreso aquí.</p>
                )}

                {/* Buyer can pay from the order page for Pending orders — this shows the order *before* the payment step */}
                {isBuyer && order.status === 'Pending' && (
                  <Button 
                    onClick={async () => {
                      try {
                        // Robust ensure (prevents "El sistema de pagos aún está cargando" / nowhere to enter payment)
                        if (!wompiReady) {
                          const ready = await ensureWompiReady();
                          if (!ready) {
                            toast.error("El sistema de pagos aún está cargando. Intenta de nuevo en unos segundos.");
                            return;
                          }
                        }

                        // Prepare Wompi config (amount, reference, signature etc. from server)
                        console.log('[Wompi][Client] Preparing payment for order', { orderId: order.id, currentStatus: order.status });

                        const res = await fetch('/api/checkout/wompi', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ orderId: order.id })
                        });
                        const data = await res.json();
                        if (data.error) throw new Error(data.error);

                        const checkoutData = data.checkoutData;

                        // Loud client-side guard for the most common prod signature failure
                        const pubIsProd = /prod/i.test((window as any).WOMPI_PUBLIC_KEY || '');
                        if (pubIsProd && !data.hasIntegritySignature) {
                          toast.error(
                            "⚠️ Using PRODUCTION Wompi key (pub_prod_) but the server did not return an integrity signature. " +
                            "WOMPI_INTEGRITY_KEY (prod_integrity_...) is probably missing or scoped only to Production/Preview in Vercel. " +
                            "Add it for Development too (or to .env.local) and redeploy. This is the #1 cause of 'La firma es inválida'.",
                            { duration: 15000 }
                          );
                        }

                        // Capture for the in-page debugger (include the actual sig sent + the rich debug)
                        setLastWompiPrepareDebug({
                          ...(data.debug || {}),
                          signature: data.checkoutData?.signature?.integrity,
                          checkoutData: data.checkoutData ? { reference: data.checkoutData.reference, amountInCents: data.checkoutData.amountInCents, signature: data.checkoutData.signature } : undefined,
                          keyMismatchWarning: data.keyMismatchWarning,
                        });

                        console.log('[Wompi][Client] Received checkoutData from server', {
                          reference: checkoutData?.reference,
                          amountInCents: checkoutData?.amountInCents,
                          hasSignature: !!checkoutData?.signature?.integrity,
                          debug: data.debug,
                        });

                        // Fix 2 (orders page): Force globals from prepare response (top-level + defensive)
                        const responsePubKey = data.publicKey || checkoutData?.publicKey || (window as any).WOMPI_PUBLIC_KEY || '';
                        const responseIntegrity = data.integrity || checkoutData?.signature?.integrity;

                        if (responsePubKey) {
                          (window as any).WOMPI_PUBLIC_KEY = responsePubKey;
                          (window as any).$wompi = (window as any).$wompi || {};
                          (window as any).$wompi.publicKey = responsePubKey;

                          console.log("[Wompi] Globals forced from prepare response (orders):", responsePubKey?.slice(0, 20) + '...', {
                            source: data.publicKey ? 'top-level' : 'fallback',
                            hasIntegrity: !!responseIntegrity,
                          });

                          // Extra defensive re-force + initialize (prevents races that cause "firma inválida" or init errors)
                          setTimeout(() => {
                            if ((window as any).WOMPI_PUBLIC_KEY !== responsePubKey) {
                              (window as any).WOMPI_PUBLIC_KEY = responsePubKey;
                              (window as any).$wompi.publicKey = responsePubKey;
                              console.log("[Wompi] Re-forced globals on orders page (was overwritten)");
                            }
                            if ((window as any).$wompi?.initialize) {
                              try {
                                (window as any).$wompi.initialize({ publicKey: responsePubKey });
                              } catch {}
                            }
                          }, 100);
                        } else {
                          console.warn("[Wompi] No publicKey from prepare on orders page — using env fallback");
                        }

                        const pubKeyFromServer = responsePubKey;

                        // Extra defensive set right here with the exact value from the server prepare response.
                        // Some Wompi internal paths seem to snapshot the key at unexpected times.
                        (window as any).WOMPI_PUBLIC_KEY = pubKeyFromServer;
                        (window as any).$wompi = (window as any).$wompi || {};
                        (window as any).$wompi.publicKey = pubKeyFromServer;
                        console.log('[Wompi][Client] Forcing globals from server response', {
                          pubKey: pubKeyFromServer?.slice(0, 12) + '...',
                          $wompiPublic: (window as any).$wompi?.publicKey?.slice(0, 12) + '...',
                        });

                        if (typeof (window as any).$wompi.initialize === 'function') {
                          try { (window as any).$wompi.initialize({ publicKey: pubKeyFromServer }); } catch {}
                        }

                        const WidgetCheckoutClass = (window as any).WidgetCheckout || (window as any).WompiCheckout;

                        if (WidgetCheckoutClass && checkoutData) {
                          const pubKey = checkoutData.publicKey || (window as any).WOMPI_PUBLIC_KEY || '';

                          // Aggressively set globals from the *server* response (runtime truth).
                          // Prevents "merchants/undefined" and init 422 even across deploys with stale client bundles.
                          (window as any).WOMPI_PUBLIC_KEY = pubKey;
                          (window as any).$wompi = (window as any).$wompi || {};
                          (window as any).$wompi.publicKey = pubKey;

                          // Help Wompi internal init to avoid merchants/undefined and init errors
                          if (typeof (window as any).$wompi.initialize === 'function') {
                            try {
                              (window as any).$wompi.initialize({ publicKey: pubKey });
                              console.log('[Wompi][Client] Explicit $wompi.initialize called with', pubKey?.slice(0,12)+'...');
                            } catch (e) {
                              console.warn('[Wompi][Client] $wompi.initialize call failed (non-fatal):', e);
                            }
                          }

                          const widgetConfig: any = {
                            publicKey: pubKey,
                            currency: checkoutData.currency,
                            amountInCents: checkoutData.amountInCents,
                            reference: checkoutData.reference,
                            redirectUrl: checkoutData.redirectUrl,
                            customerData: checkoutData.customerData,
                          };
                          if (checkoutData.signature?.integrity) {
                            widgetConfig.signature = { integrity: checkoutData.signature.integrity };
                          }
                          console.log('[Wompi][Client] Opening Wompi widget', { reference: checkoutData.reference });

                          // Small delay after forcing globals lets Wompi sub-bundles settle.
                          setTimeout(() => {
                            try {
                              const checkout = new WidgetCheckoutClass(widgetConfig);

                              toast.info('Abriendo Wompi Checkout seguro. Ingresa los datos de pago allí.');

                              checkout.open((result: any) => {
                                console.log('[Wompi][Client] Widget closed with result:', result);
                                const possibleSigError = result?.error || result?.transaction?.error || result?.transaction?.status_message;
                                if (possibleSigError) {
                                  const errText = typeof possibleSigError === 'string' ? possibleSigError : JSON.stringify(possibleSigError);
                                  toast.error(`Error Wompi: ${errText}`);
                                  setLastWompiPrepareDebug((prev: any) => ({
                                    ...(prev || {}),
                                    lastWidgetResultError: errText,
                                    lastWidgetResult: result,
                                  }));
                                } else if (result?.transaction?.status === 'ERROR') {
                                  setLastWompiPrepareDebug((prev: any) => ({
                                    ...(prev || {}),
                                    lastWidgetResult: result,
                                  }));
                                }
                                setTimeout(async () => {
                                  try {
                                    const fresh = await fetch(`/api/orders/${orderId}`).then(r => r.json());
                                    const upd = fresh.order || fresh;
                                    setOrder(upd);
                                    if (upd.status === 'Pending') {
                                      fetch(`/api/orders/${orderId}/check-wompi`, { method: 'POST' }).catch(() => {});
                                      startPaymentPolling();
                                    } else {
                                      setIsPollingPayment(false);
                                      toast.success(`Estado actualizado: ${upd.status}`);
                                    }
                                  } catch {}
                                }, 1500);
                              });
                            } catch (e: any) {
                              console.error('[Wompi][Client] Failed to instantiate WidgetCheckout', e);
                              toast.error('No se pudo inicializar el widget de Wompi. Revisa el Debugger.');
                              setLastWompiPrepareDebug((prev: any) => ({ ...(prev || {}), lastWidgetResultError: 'Instantiation failed: ' + (e?.message || e) }));
                            }
                          }, 120);
                        } else {
                          toast.error("No se pudo iniciar el pago con Wompi. Verifica la conexión e intenta de nuevo.");
                        }
                      } catch (e: any) {
                        toast.error(e.message || "Error al iniciar el pago.");
                      }
                    }}
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    💳 Pagar ahora con Wompi
                  </Button>
                )}

                {/* === Wompi Transaction Debugger ===
                    Helps see exactly what reference is being sent and forces a status refresh.
                    Visible to the buyer when payment is still pending (and always to admins).
                    This is the main tool for "what is happening to the transaction?"
                */}
                {maintenanceMode && (isBuyer || isAdmin) && order.status === 'Pending' && (
                  <div className="mt-4 p-3 border border-blue-300 bg-blue-50 dark:bg-blue-950/30 rounded-xl text-xs">
                    <div className="font-semibold text-blue-800 dark:text-blue-300 mb-1 flex items-center gap-1">
                      🔧 Wompi Debugger
                    </div>
                    <div className="font-mono space-y-0.5 text-[10px] text-blue-700 dark:text-blue-400">
                      <div>Reference: <span className="font-bold">order_{order.id}</span></div>
                      <div>DB Status: <span className="font-bold">{order.status}</span></div>
                      <div>Polling: {isPollingPayment ? 'ACTIVE (every 4s)' : 'stopped'}</div>
                      <div>Last DB update: {new Date(order.updatedAt).toLocaleTimeString('es-CO')}</div>
                      {lastWompiPrepareDebug && (
                        <div className="mt-1 border-t border-blue-300 pt-1 overflow-auto max-h-24 text-[9px]">
                          Last prepare/check: {JSON.stringify(lastWompiPrepareDebug, null, 2)}
                        </div>
                      )}
                      {(lastWompiPrepareDebug?.signedStringPreview || lastWompiPrepareDebug?.lastRecompute) && (
                        <div className="mt-1 p-1 bg-blue-100 dark:bg-blue-900/50 rounded text-[9px]">
                          {lastWompiPrepareDebug?.signedStringPreview && (
                            <div>Signed string preview: <span className="font-mono">{lastWompiPrepareDebug.signedStringPreview}</span></div>
                          )}
                          {lastWompiPrepareDebug?.lastRecompute && (
                            <div className="mt-0.5">
                              Recompute: matches previous = {String(lastWompiPrepareDebug.lastRecompute.matchesPrevious)} — {lastWompiPrepareDebug.lastRecompute.note}
                            </div>
                          )}
                        </div>
                      )}
                      {lastWompiPrepareDebug?.keyMismatchWarning && (
                        <div className="mt-1 p-1 bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300 rounded text-[9px] font-semibold">
                          ⚠️ KEY MISMATCH: {lastWompiPrepareDebug.keyMismatchWarning}
                        </div>
                      )}
                      {lastWompiPrepareDebug?.lastCheckWompi?.wompiError && (
                        <div className="mt-1 text-red-600 font-semibold">
                          Último error de Wompi: {lastWompiPrepareDebug.lastCheckWompi.wompiError}
                        </div>
                      )}
                      {lastWompiPrepareDebug?.lastCheckWompi?.wompiSummary && (
                        <div className="mt-1 p-1 bg-blue-100 dark:bg-blue-900/50 rounded text-[9px]">
                          <div className="font-semibold">Wompi Tx (from Consultar):</div>
                          <div>ID: {lastWompiPrepareDebug.lastCheckWompi.wompiSummary.id}</div>
                          <div>Status: <span className="font-bold">{lastWompiPrepareDebug.lastCheckWompi.wompiSummary.status}</span></div>
                          <div>Amount: {lastWompiPrepareDebug.lastCheckWompi.wompiSummary.amount_in_cents} {lastWompiPrepareDebug.lastCheckWompi.wompiSummary.currency}</div>
                          {lastWompiPrepareDebug.lastCheckWompi.wompiSummary.error && (
                            <div className="text-red-600">Error: {lastWompiPrepareDebug.lastCheckWompi.wompiSummary.error}</div>
                          )}
                          <div className="text-[8px] mt-0.5">Ref: {lastWompiPrepareDebug.lastCheckWompi.wompiSummary.reference}</div>
                          {lastWompiPrepareDebug.lastCheckWompi.wompiBase && (
                            <div className="text-[8px] opacity-70">Queried: {lastWompiPrepareDebug.lastCheckWompi.wompiBase}</div>
                          )}
                          {(lastWompiPrepareDebug.lastCheckWompi.queriedBy || lastWompiPrepareDebug.lastCheckWompi.authType) && (
                            <div className="text-[8px] opacity-70">
                              Via: {lastWompiPrepareDebug.lastCheckWompi.queriedBy || 'reference'} (auth: {lastWompiPrepareDebug.lastCheckWompi.authType || 'unknown'})
                            </div>
                          )}
                          {lastWompiPrepareDebug.lastCheckWompi.details && (
                            <div className="text-red-600 mt-0.5">Details: {typeof lastWompiPrepareDebug.lastCheckWompi.details === 'string' ? lastWompiPrepareDebug.lastCheckWompi.details : JSON.stringify(lastWompiPrepareDebug.lastCheckWompi.details)}</div>
                          )}
                          {lastWompiPrepareDebug.lastCheckWompi.error && !lastWompiPrepareDebug.lastCheckWompi.wompiSummary && (
                            <div className="text-red-600 mt-0.5">Query error: {lastWompiPrepareDebug.lastCheckWompi.error}</div>
                          )}
                        </div>
                      )}
                      {lastWompiPrepareDebug?.lastWidgetResultError && (
                        <div className="mt-1 text-red-600 font-semibold">
                          Widget error: {lastWompiPrepareDebug.lastWidgetResultError}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2 mt-2">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="text-xs h-7"
                        onClick={async () => {
                          try {
                            // First ask Wompi (applies full confirmation via check-wompi if APPROVED)
                            const candidateTxId = lastWompiPrepareDebug?.lastCheckWompi?.transactionId ||
                              lastWompiPrepareDebug?.lastCheckWompi?.wompiTransactionId ||
                              lastWompiPrepareDebug?.lastWidgetResult?.transaction?.id || null;

                            const fetchOpts: RequestInit = { method: 'POST' };
                            if (candidateTxId) {
                              fetchOpts.headers = { 'Content-Type': 'application/json' };
                              fetchOpts.body = JSON.stringify({ transactionId: candidateTxId });
                            }
                            await fetch(`/api/orders/${orderId}/check-wompi`, fetchOpts).catch(() => {});

                            // Then refresh DB order (check-wompi may have flipped it to Paid + side effects)
                            const res = await fetch(`/api/orders/${orderId}`);
                            if (res.ok) {
                              const fresh = await res.json();
                              const updated = fresh.order || fresh;
                              setOrder(updated);
                              if (updated.status === 'Pending') {
                                startPaymentPolling();
                              } else {
                                setIsPollingPayment(false);
                              }
                              toast.info('Consultado Wompi + estado actualizado');
                            } else {
                              toast.info('Estado refrescado (Wompi consult may have been skipped)');
                            }
                          } catch {
                            toast.error('No se pudo forzar chequeo');
                          }
                        }}
                      >
                        Forzar chequeo ahora
                      </Button>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="text-xs h-7"
                        onClick={() => {
                          const ref = `order_${order.id}`;
                          navigator.clipboard?.writeText(ref);
                          toast.success('Referencia copiada: ' + ref);
                        }}
                      >
                        Copiar referencia
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="text-xs h-7"
                        onClick={async () => {
                          try {
                            // Prefer direct transaction ID lookup (official + reliable) if we captured one from a prior widget result or previous check.
                            const prev = lastWompiPrepareDebug || {};
                            const candidateTxId =
                              prev.lastWidgetResult?.transaction?.id ||
                              prev.lastWidgetResult?.id ||
                              prev.lastWidgetResult?.transactionId ||
                              prev.lastCheckWompi?.transactionId ||
                              prev.lastCheckWompi?.wompiTransactionId ||
                              null;

                            const fetchOpts: RequestInit = { method: 'POST' };
                            if (candidateTxId) {
                              fetchOpts.headers = { 'Content-Type': 'application/json' };
                              fetchOpts.body = JSON.stringify({ transactionId: candidateTxId });
                            }

                            const res = await fetch(`/api/orders/${orderId}/check-wompi`, fetchOpts);
                            const data = await res.json();
                            if (res.ok && data.success) {
                              // Surface detailed Wompi error (e.g. invalid signature) if present
                              if (data.wompiError) {
                                toast.error(`Wompi: ${data.wompiError}`);
                              } else {
                                toast.success(data.message || 'Consultado en Wompi');
                              }
                              // Store full check result in debugger for easy copy/feedback
                              setLastWompiPrepareDebug((prev: any) => ({
                                ...(prev || {}),
                                lastCheckWompi: {
                                  status: data.transaction?.status,
                                  wompiError: data.wompiError,
                                  message: data.message,
                                  transactionId: data.wompiTransactionId || data.transaction?.id,
                                  amount: data.transaction?.amount_in_cents,
                                  wompiSummary: data.wompiSummary,
                                  fullTransaction: data.transaction,
                                  wompiBase: data.wompiBase,
                                  queriedBy: data.queriedBy,
                                  authType: data.authType,
                                  details: data.details,
                                }
                              }));
                              // Refresh the order from our DB (the route may have updated it)
                              const freshRes = await fetch(`/api/orders/${orderId}`);
                              if (freshRes.ok) {
                                const fresh = await freshRes.json();
                                const updated = fresh.order || fresh;
                                setOrder(updated);
                                if (updated.status !== 'Pending') {
                                  setIsPollingPayment(false);
                                }
                              }
                            } else {
                              toast.error(data.error || data.message || 'Error consultando Wompi');
                              // Still capture the failure + Wompi details (e.g. 401 INVALID_ACCESS_TOKEN + reason) for the debugger panel
                              setLastWompiPrepareDebug((p: any) => ({
                                ...(p || {}),
                                lastCheckWompi: {
                                  ...(data || {}),
                                  error: data?.error,
                                  details: data?.details,
                                  wompiBase: data?.wompiBase,
                                  queriedBy: data?.queriedBy,
                                  authType: data?.authType,
                                }
                              }));
                            }
                          } catch (e) {
                            toast.error('No se pudo consultar Wompi');
                          }
                        }}
                      >
                        Consultar Wompi API
                      </Button>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="text-xs h-7"
                        onClick={async () => {
                          try {
                            const res = await fetch('/api/checkout/wompi', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ orderId: order.id })
                            });
                            const freshPrepare = await res.json();
                            const previousSig = (lastWompiPrepareDebug?.signature || lastWompiPrepareDebug?.checkoutData?.signature?.integrity || lastWompiPrepareDebug?.integrity);
                            const newSig = freshPrepare?.checkoutData?.signature?.integrity;
                            const match = !!previousSig && !!newSig && previousSig === newSig;
                            const freshDebug = freshPrepare?.debug || {};
                            const info = {
                              previousSigPrefix: previousSig ? String(previousSig).slice(0,10)+'...' : 'none',
                              newSigPrefix: newSig ? String(newSig).slice(0,10)+'...' : null,
                              matchesPrevious: match,
                              signedStringPreview: freshDebug.signedStringPreview,
                              note: match 
                                ? 'Misma llave de integridad (el secreto actual produce la misma firma)' 
                                : 'La firma recomputada DIFERENTE — la llave de integridad en Vercel probablemente no coincide con la de Wompi para esta publicKey',
                            };
                            setLastWompiPrepareDebug((prev: any) => ({ 
                              ...(prev || {}), 
                              ...freshDebug, 
                              signature: newSig, 
                              lastRecompute: info 
                            }));
                            if (newSig) {
                              toast.info(match ? 'Firma recomputada coincide con la anterior' : 'Firma recomputada DIFERENTE — revisa Wompi INTEGRITY_KEY en Vercel envs');
                            } else {
                              toast.error('No se pudo recomputar firma');
                            }
                          } catch {
                            toast.error('No se pudo recomputar firma');
                          }
                        }}
                      >
                        Recomputar firma
                      </Button>
                      <a 
                        href="https://comercios.wompi.co/debugger" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-xs h-7 px-3 py-1 border border-blue-300 rounded hover:bg-blue-100 dark:hover:bg-blue-900 text-blue-700 dark:text-blue-300 inline-flex items-center"
                      >
                        Ver en Wompi Debugger →
                      </a>
                    </div>
                    <p className="mt-2 text-[9px] text-blue-600/80 dark:text-blue-400/80 leading-tight">
                      Si Wompi muestra el pago como APPROVED pero aquí sigue Pending: el webhook probablemente falló (revisa logs de Vercel con "[Wompi][Webhook]"). 
                      Usa "Consultar Wompi API" para forzar la consulta usando la llave privada (actualiza el estado si APPROVED). 
                      El reference exacto que debe aparecer en Wompi dashboard es <span className="font-mono">order_{order.id}</span>.
                    </p>
                    <p className="mt-1 text-[9px] text-blue-600/80 dark:text-blue-400/80 leading-tight">
                      La "Fecha de vencimiento 00/00" o datos de tarjeta incompletos en los detalles de Wompi es normal en transacciones que fallan con "firma inválida" (el rechazo ocurre a nivel de la config del checkout antes de procesar completamente los datos de tarjeta). No es la causa del error. La firma se valida con la llave de integridad del servidor; tu ubicación geográfica o IP del comprador NO afecta el cálculo de la firma (ref + amount + COP + secret).
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* CHAT - Mobile friendly */}
      {activeTab === 'chat' && (
        <Card className="flex flex-col shadow-lg overflow-hidden min-h-[420px] max-h-[calc(100dvh-180px)] md:max-h-[620px]">
          <CardHeader className="border-b">
            <CardTitle className="flex items-center gap-2">💬 Chat en Vivo</CardTitle>
            <p className="text-sm text-muted-foreground">Comunicación directa con {isBuyer ? 'el vendedor' : 'el comprador'}</p>
          </CardHeader>
          
          <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-6 space-y-4 bg-muted/30">
            {messages.length === 0 && (
              <div className="text-center py-16 text-muted-foreground">
                <div className="text-4xl mb-3">💬</div>
                <p>No hay mensajes aún.</p>
                <p className="text-sm mt-1">¡Envía el primero para coordinar!</p>
              </div>
            )}
            {messages.map((msg: any, idx: number) => {
              // Use isFromBuyer (from DB) + our local isBuyer flag to determine ownership
              const isMine = !!msg.isFromBuyer === isBuyer;
              return (
                <div key={msg.id || idx} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] px-4 py-3 rounded-2xl text-[15px] ${
                    isMine ? 'bg-orange-600 text-white' : 'bg-background border shadow-sm'
                  }`}>
                    {!isMine && (
                      <div className="text-[12px] opacity-70 mb-0.5 font-medium text-muted-foreground">
                        {isBuyer ? 'Vendedor' : 'Comprador'}
                      </div>
                    )}
                    {msg.content && <div>{msg.content}</div>}
                    {msg.fileUrl && (
                      <div className="mt-2">
                        <a href={msg.fileUrl} target="_blank" rel="noopener noreferrer" className="block">
                          {msg.fileUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                            <img src={msg.fileUrl} alt="adjunto" className="max-h-48 rounded-xl" />
                          ) : (
                            <span className="underline">📎 Ver archivo adjunto</span>
                          )}
                        </a>
                      </div>
                    )}
                    <div className={`text-[10px] mt-1.5 opacity-70 ${isMine ? 'text-right' : ''}`}>
                      {msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }) : ''}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="p-3 border-t bg-card flex gap-2 items-end safe-area-inset-bottom">
            <label className="cursor-pointer flex items-center justify-center w-11 h-11 border rounded-2xl hover:bg-gray-100 text-xl flex-shrink-0 active:scale-95 transition" title="Adjuntar archivo">
              📎
              <input type="file" onChange={uploadFile} className="hidden" />
            </label>
            <Textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Escribe un mensaje..."
              className="flex-1 resize-y min-h-[44px] max-h-[120px] text-base"
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), sendMessage())}
            />
            <Button onClick={sendMessage} disabled={!newMessage.trim()} className="px-6 h-[44px] active:scale-95">
              Enviar
            </Button>
          </div>
        </Card>
      )}

      {/* PROGRESS TIMELINE */}
      {activeTab === 'progress' && (
        <Card className="shadow-lg">
          <CardHeader><CardTitle>📈 Progreso del Pedido</CardTitle></CardHeader>
          <CardContent className="pt-8">
            <div className="space-y-10 relative pl-8 before:absolute before:left-4 before:top-0 before:bottom-0 before:w-0.5 before:bg-muted">
              {[
                { step: "Pedido creado", date: order.createdAt, done: true },
                { step: "En progreso", date: null, done: order.status === 'In Progress' || isCompleted },
                { step: "Trabajo completado", date: null, done: isCompleted },
              ].map((s, i) => (
                <div key={i} className="flex gap-6 relative">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${s.done ? 'bg-green-500 text-white' : 'bg-muted'}`}>
                    {s.done ? '✓' : i+1}
                  </div>
                  <div>
                    <p className={`font-semibold ${s.done ? 'text-green-600' : ''}`}>{s.step}</p>
                    {s.date && <p className="text-sm text-muted-foreground">{new Date(s.date).toLocaleString('es-CO')}</p>}
                  </div>
                </div>
              ))}
            </div>

            {isSeller && (
              <div className="mt-12 flex flex-wrap gap-3">
                {order.status !== 'In Progress' && order.status !== 'Completed' && (
                  <Button onClick={() => updateStatus('In Progress')} size="lg">🚀 Iniciar Trabajo</Button>
                )}
                {order.status !== 'Completed' && (
                  <Button onClick={() => updateStatus('Completed')} size="lg">✅ Marcar Completado</Button>
                )}
                {order.status !== 'Cancelled' && order.status !== 'Completed' && (
                  <Button onClick={() => updateStatus('Cancelled')} size="lg" variant="outline" className="text-red-600">Cancelar</Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* REVIEW */}
      {activeTab === 'review' && isBuyer && isCompleted && (
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>
              {existingReview ? '⭐ Tu reseña' : '⭐ ¿Cómo te fue con el servicio?'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {existingReview ? (
              <div className="bg-green-50 border border-green-200 rounded-2xl p-6">
                <div className="flex gap-1 text-3xl mb-4">
                  {[1,2,3,4,5].map(n => (
                    <span key={n}>{n <= existingReview.rating ? '⭐' : '☆'}</span>
                  ))}
                </div>
                <p className="text-foreground text-lg">
                  {existingReview.comment || "No dejaste comentario."}
                </p>
                <p className="text-xs text-muted-foreground mt-4">
                  Enviada el {new Date(existingReview.createdAt).toLocaleDateString('es-CO')}
                </p>
              </div>
            ) : (
              <>
                <div className="flex gap-1 text-5xl">
                  {[1,2,3,4,5].map(n => (
                    <button 
                      key={n} 
                      onClick={() => setReviewRating(n)} 
                      className="hover:scale-125 transition active:scale-95"
                    >
                      {n <= reviewRating ? '⭐' : '☆'}
                    </button>
                  ))}
                </div>
                <p className="text-sm text-muted-foreground -mt-1">Tu calificación: {reviewRating} / 5</p>
                <Textarea
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  placeholder="Cuéntanos tu experiencia con el servicio..."
                  className="min-h-[160px]"
                />
                <Button onClick={submitReview} className="w-full py-6 text-lg">Publicar Reseña</Button>
              </>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Suspense wrapper for useSearchParams + useParams safety in production
export default function OrderDetailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-orange-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando pedido...</p>
        </div>
      </div>
    }>
      <OrderDetailClient />
    </Suspense>
  );
}
