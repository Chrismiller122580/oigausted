'use client';

import { useState, useEffect } from 'react';
import MapsPollutionNuke from '@/components/maps/MapsPollutionNuke';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { parseJsonArrayField, devLog } from '@/lib/utils';
import { getAuthCallbackUrl } from '@/lib/getAuthCallbackUrl';

declare global {
  interface Window {
    WompiCheckout?: any;
    WOMPI_PUBLIC_KEY?: string;
    $wompi?: any;
    Wompi?: any;
    WOMPI_CONFIG?: any;
  }
}

export default function CheckoutPage() {
  const params = useParams();
  const gigId = params.gigId as string;
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession();

  const [gig, setGig] = useState<any>(null);
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [opening, setOpening] = useState(false);
  const [wompiReady, setWompiReady] = useState(false);
  const [wompiLoadFailed, setWompiLoadFailed] = useState(false);
  const [realPaymentsEnabled, setRealPaymentsEnabled] = useState<boolean | null>(null);
  const [maintenanceMode, setMaintenanceMode] = useState(false);

  const WOMPI_PUBLIC_KEY = process.env.NEXT_PUBLIC_WOMPI_PUBLIC_KEY || '';

  // Set globals early so Wompi's widget script and internal bundles (including $wompi and merchant lookups)
  // can find the public key even if their init runs on script load or in payment form sub-flows.
  // This helps avoid "merchants/undefined" and init 422 errors.
  if (typeof window !== 'undefined' && WOMPI_PUBLIC_KEY) {
    (window as any).WOMPI_PUBLIC_KEY = WOMPI_PUBLIC_KEY;
    (window as any).$wompi = { publicKey: WOMPI_PUBLIC_KEY };
  }

  // Dynamic fields selections
  const [selectedOptions, setSelectedOptions] = useState<Record<string, any>>({});

  // Service location for non-remote gigs
  const [serviceAddress, setServiceAddress] = useState("");
  const [serviceLatitude, setServiceLatitude] = useState<number | null>(null);
  const [serviceLongitude, setServiceLongitude] = useState<number | null>(null);

  // Wompi debug info for real feedback
  const [lastWompiPrepare, setLastWompiPrepare] = useState<any>(null);

  // Function to ensure Wompi script is loaded (for reliable payment entry)
  const ensureWompiReady = async (): Promise<boolean> => {
    if (wompiReady) return true;

    // Try to load dynamically if not already
    const loadScriptDynamically = () => {
      if (document.querySelector('script[src*="checkout.wompi.co"]')) return;

      devLog('[Wompi] Attempting dynamic script load on demand...');

      // Set globals before loading the script so Wompi's bundle can see the public key during its own initialization
      (window as any).WOMPI_PUBLIC_KEY = WOMPI_PUBLIC_KEY;
      if ((window as any).$wompi && typeof (window as any).$wompi.initialize === 'function') {
        try { (window as any).$wompi.initialize({ publicKey: WOMPI_PUBLIC_KEY }); } catch {}
      }

      const script = document.createElement('script');
      script.src = 'https://checkout.wompi.co/widget.js';
      script.async = true;

      script.onload = () => {
        setTimeout(() => {
          if (window.WompiCheckout || (window as any).WidgetCheckout) {
            setWompiReady(true);
            setWompiLoadFailed(false);

            // Force globals + initialize as soon as the class appears.
            // Wompi's internal bundles (v1.js etc.) often do their own merchant lookups
            // right after the main script loads. Setting here catches those paths.
            const earlyKey = WOMPI_PUBLIC_KEY;
            if (earlyKey) {
              (window as any).WOMPI_PUBLIC_KEY = earlyKey;
              (window as any).$wompi = (window as any).$wompi || {};
              (window as any).$wompi.publicKey = earlyKey;
              if (typeof (window as any).$wompi.initialize === 'function') {
                try { (window as any).$wompi.initialize({ publicKey: earlyKey }); } catch {}
              }
            }
          }
        }, 300);
      };

      script.onerror = () => {
        devLog('[Wompi] Failed to load widget script on demand');
        setWompiLoadFailed(true);
      };

      document.head.appendChild(script);
    };

    loadScriptDynamically();

    // Wait up to 5 seconds for it to be ready
    for (let i = 0; i < 25; i++) {
      if (window.WompiCheckout || (window as any).WidgetCheckout) {
        setWompiReady(true);
        setWompiLoadFailed(false);
        return true;
      }
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    setWompiLoadFailed(true);
    return false;
  };

  // Robust Wompi script loader (improved for production reliability)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    let attempts = 0;
    const maxAttempts = 60; // ~12 seconds of polling

    const trySetReady = () => {
      if (window.WompiCheckout) {
        setWompiReady(true);
        setWompiLoadFailed(false);
        return true;
      }
      return false;
    };

    // Immediate check
    if (trySetReady()) return;

    // Aggressive polling
    const interval = setInterval(() => {
      attempts++;

      if (trySetReady()) {
        clearInterval(interval);
        return;
      }

      // After many attempts without success, mark as failed
      if (attempts >= maxAttempts) {
        clearInterval(interval);
        devLog('[Wompi] Failed to load after multiple attempts');
        setWompiLoadFailed(true);
      }
    }, 200);

    // Dynamic injection fallback
    const loadScriptDynamically = () => {
      if (document.querySelector('script[src*="checkout.wompi.co"]')) return;

      devLog('[Wompi] Attempting dynamic script load...');

      const script = document.createElement('script');
      script.src = 'https://checkout.wompi.co/widget.js';
      script.async = true;

      script.onload = () => {
        // Wompi script can take a moment to expose the global
        setTimeout(() => {
          if (!trySetReady()) {
            // Keep polling a bit more after load
            const extraCheck = setInterval(() => {
              if (trySetReady()) {
                clearInterval(extraCheck);
              }
            }, 150);
            setTimeout(() => clearInterval(extraCheck), 3000);
          }
        }, 300);
      };

      script.onerror = () => {
        devLog('[Wompi] Failed to load widget script dynamically');
        setWompiLoadFailed(true);
      };

      document.head.appendChild(script);
    };

    // Trigger dynamic fallback after 2.2 seconds if primary method failed
    const fallbackTimeout = setTimeout(() => {
      if (!window.WompiCheckout && !wompiReady) {
        loadScriptDynamically();
      }
    }, 2200);

    // Hard timeout: if still not ready after 13 seconds, show failure UI
    const hardFailTimeout = setTimeout(() => {
      if (!window.WompiCheckout && !wompiReady) {
        setWompiLoadFailed(true);
        clearInterval(interval);
      }
    }, 13000);

    return () => {
      clearInterval(interval);
      clearTimeout(fallbackTimeout);
      clearTimeout(hardFailTimeout);
    };
  }, [wompiReady]);

  // Auth guard + load order when ready
  useEffect(() => {
    if (!gigId) return;

    if (sessionStatus === 'loading') return;

    if (!session?.user) {
      const callbackUrl = encodeURIComponent(getAuthCallbackUrl(`/checkout/${gigId}`));
      router.replace(`/login?callbackUrl=${callbackUrl}`);
      return;
    }

    // User is authenticated → proceed to create order
    loadGigAndCreateOrder();
    // Also fetch public payment gate status and maintenance mode (for gating debug tools)
    fetch('/api/admin/config')
      .then(r => r.json())
      .then(data => {
        setRealPaymentsEnabled(!!data.wompiRealPaymentsEnabled);
        setMaintenanceMode(!!data.maintenanceMode);
      })
      .catch(() => setRealPaymentsEnabled(false));
  }, [gigId, sessionStatus, session?.user, router]);

  const loadGigAndCreateOrder = async () => {
    try {
      // Load gig details (the API now returns { gig: ... } or the gig directly)
      const gigRes = await fetch(`/api/gigs/${gigId}`);
      const gigResponse = await gigRes.json();
      const gigData = gigResponse.gig || gigResponse;

      if (!gigData) throw new Error("Gig not found");

      setGig(gigData);

      // Create order (Pending) — this happens before payment
      const orderRes = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gigId })
      });

      const orderResponse = await orderRes.json();
      if (!orderRes.ok) throw new Error(orderResponse.error || "Failed to create order");
      
      setOrder(orderResponse.order || orderResponse);
    } catch (err: any) {
      devLog('Checkout load error:', err);
      toast.error(err.message || "No se pudo cargar el checkout. ¿Estás logueado?");
    } finally {
      setLoading(false);
    }
  };

  // Per latest targeted fix: openPayment uses server-returned full config + setWompiReady to drive a strict useEffect.
  // We keep the critical order save/PATCH (finalPrice + customFields) because selections must be persisted before payment.
  const openPayment = async (orderId: string) => {
    if (!orderId || !order || !gig) return;

    if (realPaymentsEnabled === false) {
      toast.error("Los pagos reales están desactivados en la configuración de administración. No se procesarán cobros.");
      return;
    }

    // Address is recommended for non-remote gigs but not strictly required here.
    // Buyer/seller can always coordinate exact details via the order chat.
    if (!gig.isRemote && !serviceAddress?.trim()) {
      toast.info("Recomendamos indicar una dirección aproximada (o deja en blanco para coordinar por chat).");
    }

    setOpening(true);

    try {
      // 1. Save the buyer's selections + final price to the order before payment (required for correct amount/summary)
      const updateRes = await fetch(`/api/orders/${order.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          price: finalPrice,
          customFields: selectedOptions,
          serviceAddress: serviceAddress || undefined,
          serviceLatitude,
          serviceLongitude,
        }),
      });

      if (!updateRes.ok) {
        const errData = await updateRes.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to save your selections');
      }

      // 2. Fetch full server config (now includes top-level reference/amountInCents/publicKey/integrity + other widget fields)
      const res = await fetch('/api/checkout/wompi', {
        method: 'POST',
        body: JSON.stringify({ orderId })
      });
      const config = await res.json();

      if (config?.error) {
        throw new Error(config.error);
      }

      // Store full config (as specified)
      (window as any).WOMPI_CONFIG = config;

      // Force everything (publicKey + $wompi + Wompi) from server response
      (window as any).WOMPI_PUBLIC_KEY = config.publicKey;
      (window as any).$wompi = { publicKey: config.publicKey };
      (window as any).Wompi = { publicKey: config.publicKey };

      // Also update last debug info for the in-page debugger
      setLastWompiPrepare(config);

      console.log("🔥 WOMPI_CONFIG stored + globals forced from server config. Triggering ready for useEffect init.");

      // Trigger the strict useEffect below (flip to guarantee re-run even if wompiReady was already true from initial script load)
      setWompiReady(false);
      setTimeout(() => setWompiReady(true), 0);
    } catch (err: any) {
      devLog('Wompi widget error:', err);
      toast.error(err.message || "No se pudo abrir Wompi. Por favor intenta de nuevo o contacta soporte.");
      setLastWompiPrepare((prev: any) => ({ ...(prev || {}), lastWidgetError: err?.message || String(err) }));
    } finally {
      setOpening(false);
    }
  };

  // Strict useEffect version per spec: when wompiReady is signaled after openPayment stores the fresh server config,
  // force initialize on $wompi (with safety timeout). We also launch the actual WidgetCheckout here using the stored full config
  // so the payment dialog opens (the initialize alone is not sufficient to surface the UI; WidgetCheckoutClass + .open is).
  useEffect(() => {
    if (!wompiReady) return;

    const config = (window as any).WOMPI_CONFIG;

    const init = () => {
      if ((window as any).$wompi?.initialize) {
        try {
          (window as any).$wompi.initialize();
          console.log("✅ Wompi initialized with full config");
        } catch (e) {
          console.warn('[Wompi] $wompi.initialize() (no arg) failed (non-fatal):', e);
        }
      }
    };

    init();
    const timer = setTimeout(init, 400); // extra safety

    // Launch the actual payment widget UI using server config + dynamic script if needed.
    // This replaces the previous inline onload logic while following the "setReady -> useEffect" trigger.
    const launch = () => {
      if (!config) return;

      // Ensure the Wompi widget script is present (idempotent)
      if (!document.querySelector('script[src*="checkout.wompi.co"]')) {
        const script = document.createElement('script');
        script.src = 'https://checkout.wompi.co/widget.js';
        script.async = true;
        script.onerror = () => {
          toast.error('No se pudo cargar el script de Wompi.');
        };
        document.head.appendChild(script);
      }

      const tryLaunchWidget = (attempt = 0) => {
        const WidgetCheckoutClass = (window as any).WidgetCheckout || (window as any).WompiCheckout;
        if (!WidgetCheckoutClass) {
          if (attempt < 15) {
            setTimeout(() => tryLaunchWidget(attempt + 1), 200);
          } else {
            toast.error('Wompi widget class not available after load.');
          }
          return;
        }

        const pubKey = config.publicKey || (window as any).WOMPI_PUBLIC_KEY || WOMPI_PUBLIC_KEY;

        // Re-force from the fresh config one more time right before constructing
        (window as any).WOMPI_PUBLIC_KEY = pubKey;
        (window as any).$wompi = (window as any).$wompi || {};
        (window as any).$wompi.publicKey = pubKey;
        if (typeof (window as any).$wompi.initialize === 'function') {
          try { (window as any).$wompi.initialize({ publicKey: pubKey }); } catch {}
        }

        const widgetConfig: any = {
          publicKey: pubKey,
          currency: config.currency || 'COP',
          amountInCents: config.amountInCents,
          reference: config.reference,
          redirectUrl: config.redirectUrl || `${window.location.origin}/orders/${order?.id}`,
          customerData: config.customerData || {
            email: session?.user?.email || '',
            fullName: session?.user?.name || '',
          },
        };

        if (config.integrity) {
          widgetConfig.signature = { integrity: config.integrity };
        }

        try {
          const checkout = new WidgetCheckoutClass(widgetConfig);

          checkout.open((result: any) => {
            console.log('[Wompi] Widget result (callback):', result);
            if (result?.transaction) {
              console.log('[Wompi] Transaction from callback:', {
                id: result.transaction.id,
                status: result.transaction.status,
                reference: result.transaction.reference,
              });
            }
            const err = result?.error || result?.transaction?.error || result?.transaction?.status_message;
            if (err) {
              const errText = typeof err === 'string' ? err : JSON.stringify(err);
              toast.error(`Error Wompi en widget: ${errText}`);
              setLastWompiPrepare((prev: any) => ({ ...(prev || {}), lastWidgetError: errText, lastWidgetResult: result }));
            }
            // Post-payment: let webhook or check-wompi update order, then go to order page
            const targetOrderId = order?.id;
            setTimeout(async () => {
              try {
                if (targetOrderId) {
                  await fetch(`/api/orders/${targetOrderId}/check-wompi`, { method: 'POST' }).catch(() => {});
                  const fresh = await fetch(`/api/orders/${targetOrderId}`).then(r => r.json());
                  if (fresh?.order?.status && fresh.order.status !== 'Pending') {
                    toast.success(`Pago detectado: ${fresh.order.status}. Redirigiendo...`);
                    router.push(`/orders/${targetOrderId}?from=wompi`);
                  } else {
                    router.push(`/orders/${targetOrderId}?from=wompi`);
                  }
                } else {
                  router.push('/orders');
                }
              } catch {
                if (targetOrderId) router.push(`/orders/${targetOrderId}?from=wompi`);
                else router.push('/orders');
              }
            }, 1200);
          });
        } catch (t: any) {
          if (t && t.json) {
            console.error("🔍 Wompi VALIDATION ERROR DETAILS:", JSON.stringify(t.json, null, 2));
            alert("Wompi Error: " + JSON.stringify(t.json.error || t.json));
          } else {
            console.error("Error during initialization:", t);
          }
          console.error('[Wompi][Client] Failed to instantiate WidgetCheckout', t);
          toast.error('No se pudo inicializar el widget de Wompi. Revisa el Debugger.');
          setLastWompiPrepare((prev: any) => ({ ...(prev || {}), lastWidgetError: 'Instantiation failed: ' + (t?.message || t) }));
        }
      };

      // Give the script a moment if we just injected it
      setTimeout(tryLaunchWidget, 150);
    };

    // Kick off launch (the initialize above + the widget open)
    launch();

    return () => clearTimeout(timer);
  }, [wompiReady]);

  // Confirm smart config (fields + location + final price), save to the order, then redirect to the order page.
  // This ensures the user sees the order page (in "Mis Pedidos") *before* the actual payment step.
  const confirmAndGoToOrder = async () => {
    if (!order || !gig) return;

    // Basic validation — address recommended for non-remote but optional
    // (matches the "Deja en blanco si prefieres coordinarlo por chat" hint in the form)
    if (!gig.isRemote && !serviceAddress?.trim()) {
      toast.info("Recomendamos una dirección aproximada para el vendedor. Puedes dejarla en blanco y coordinar los detalles por chat.");
      // Continue anyway — the order will be created and the seller can discuss location in chat.
    }

    setOpening(true);
    try {
      // Save details (this makes the order "smart" with custom fields etc.)
      const updateRes = await fetch(`/api/orders/${order.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          price: finalPrice,
          customFields: selectedOptions,
          serviceAddress: serviceAddress || undefined,
          serviceLatitude,
          serviceLongitude,
        }),
      });

      if (!updateRes.ok) {
        const errData = await updateRes.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to save your selections');
      }

      toast.success('Configuración guardada. Pedido creado como pendiente de pago.');
      router.push(`/orders/${order.id}`);
    } catch (err: any) {
      devLog('Confirm order error:', err);
      toast.error(err.message || "No se pudo confirmar el pedido.");
    } finally {
      setOpening(false);
    }
  };

  // (Beta bypass handler removed per security review — prod users can no longer force Paid without webhook.
  // Dev simulate button below remains for local testing.)

  const fields = parseJsonArrayField(gig?.fields);

  // Calculate extra cost from selections
  // Coerce to finite numbers defensively (bad JSON data in fields can produce NaN -> bad amountInCents -> signature/amount errors at Wompi)
  const toNum = (v: any) => {
    const n = typeof v === 'number' ? v : parseFloat(v);
    return Number.isFinite(n) ? n : 0;
  };
  const calculateExtra = () => {
    let extra = 0;
    fields.forEach((field: any) => {
      const value = selectedOptions[field.key];
      if (!value) return;

      if (field.type === 'number' && typeof value === 'number') {
        extra += value * toNum(field.extraPrice);
      } else if (field.type === 'checkbox' && value === true) {
        extra += toNum(field.extraPrice);
      } else if (field.type === 'select' && field.options) {
        const chosen = field.options.find((o: any) => (typeof o === 'string' ? o === value : o.label === value));
        if (chosen && typeof chosen === 'object' && chosen.extraPrice != null) {
          extra += toNum(chosen.extraPrice);
        }
      }
    });
    return extra;
  };

  const extraCost = calculateExtra();
  const finalPrice = (gig?.price || 0) + extraCost;

  // Handle field change
  const handleFieldChange = (key: string, value: any) => {
    setSelectedOptions(prev => ({
      ...prev,
      [key]: value
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-orange-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-lg text-muted-foreground">Cargando checkout...</p>
        </div>
      </div>
    );
  }

  if (!gig || !order) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 text-xl mb-4">Error cargando el checkout</p>
          <Button onClick={() => router.push('/gigs')} variant="outline">
            Volver a los gigs
          </Button>
        </div>
      </div>
    );
  }

  const isOwnGig = session?.user && gig?.sellerId && (session.user as any).id === gig.sellerId;

  if (isOwnGig) {
    return (
      <div className="max-w-2xl mx-auto p-8 text-center">
        <h1 className="text-2xl font-bold mb-4">No puedes comprar tu propio gig</h1>
        <p className="text-muted-foreground mb-6">Este servicio te pertenece.</p>
        <Button onClick={() => router.push('/seller')} variant="outline">
          Ir a Mi Negocio
        </Button>
      </div>
    );
  }

  const isWompiSandbox = WOMPI_PUBLIC_KEY?.includes('test') || false;

  // Render interactive dynamic fields
  const renderDynamicFields = () => {
    if (!fields || fields.length === 0) return null;

    return (
      <div className="bg-muted p-6 rounded-2xl">
        <p className="font-semibold text-foreground mb-4">Personaliza tu servicio</p>
        <div className="space-y-5">
          {fields.map((field: any, index: number) => {
            const currentValue = selectedOptions[field.key];

            return (
              <div key={index}>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  {field.label}
                  {field.extraPrice && (
                    <span className="text-orange-600 ml-1">
                      (+${field.extraPrice.toLocaleString('es-CO')})
                    </span>
                  )}
                </label>

                {field.type === 'number' && (
                  <input
                    type="number"
                    min="0"
                    value={currentValue ?? ''}
                    onChange={(e) => handleFieldChange(field.key, parseInt(e.target.value) || 0)}
                    className="w-full border rounded-xl px-4 py-3 text-lg"
                    placeholder="0"
                  />
                )}

                {field.type === 'checkbox' && (
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={!!currentValue}
                      onChange={(e) => handleFieldChange(field.key, e.target.checked)}
                      className="w-5 h-5 accent-orange-600"
                    />
                    <span className="text-foreground">Sí, incluir</span>
                  </label>
                )}

                {field.type === 'select' && field.options && (
                  <select
                    value={currentValue || ''}
                    onChange={(e) => handleFieldChange(field.key, e.target.value)}
                    className="w-full border rounded-xl px-4 py-3 text-lg bg-card"
                  >
                    <option value="">Seleccionar...</option>
                    {field.options.map((opt: any, idx: number) => {
                      const label = typeof opt === 'string' ? opt : opt.label;
                      const price = typeof opt === 'object' && opt.extraPrice ? ` (+$${opt.extraPrice.toLocaleString('es-CO')})` : '';
                      return <option key={idx} value={label}>{label}{price}</option>;
                    })}
                  </select>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-2xl mx-auto p-8">
      <MapsPollutionNuke />
      <h1 className="text-3xl font-bold mb-8">Confirmar Compra</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">{gig.title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <p className="text-sm text-muted-foreground">Vendedor</p>
            <p className="font-medium">{gig.seller?.businessName || gig.seller?.name}</p>
          </div>

          {/* Dynamic fields configuration */}
          {renderDynamicFields()}

          {/* Service Location (only for non-remote gigs) */}
          {!gig?.isRemote && (
            <div className="bg-muted p-6 rounded-2xl">
              <p className="font-semibold text-foreground mb-1">¿Dónde se realizará el servicio? <span className="text-xs font-normal text-muted-foreground">(recomendado)</span></p>
              <p className="text-xs text-muted-foreground mb-4">Opcional: puedes dejarlo en blanco y coordinar la dirección exacta por chat después de confirmar el pedido.</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={serviceAddress}
                  onChange={(e) => setServiceAddress(e.target.value)}
                  placeholder="Dirección donde se hará el trabajo (ej: Calle 45, Bucaramanga)"
                  className="flex-1 border rounded-xl px-4 py-3"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (!navigator.geolocation) {
                      toast.error("Tu navegador no soporta geolocalización.");
                      return;
                    }
                    navigator.geolocation.getCurrentPosition(
                      (pos) => {
                        const lat = pos.coords.latitude;
                        const lng = pos.coords.longitude;
                        setServiceLatitude(lat);
                        setServiceLongitude(lng);
                        if (!serviceAddress) {
                          setServiceAddress(`Ubicación actual (${lat.toFixed(4)}, ${lng.toFixed(4)})`);
                        }
                      },
                      () => toast.error("No pudimos obtener tu ubicación.")
                    );
                  }}
                  className="px-4 py-2 border rounded-xl text-sm hover:bg-muted"
                  title="Usar mi ubicación actual"
                >
                  📍 Mi ubicación
                </button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                El vendedor podrá ver esta información. Usa el botón de ubicación o escribe una dirección aproximada.
              </p>
              {gig?.seller?.serviceRadiusKm && (
                <p className="text-[11px] text-orange-600 mt-1 font-medium">
                  Este vendedor suele atender hasta {gig.seller.serviceRadiusKm} km desde su ubicación.
                </p>
              )}
            </div>
          )}

          {/* Payment Breakdown */}
          <div className="bg-card border rounded-2xl p-5 text-sm">
            <p className="font-semibold text-foreground mb-3">Resumen del pago</p>

            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Precio base del servicio</span>
                <span>${(gig?.price || 0).toLocaleString('es-CO')}</span>
              </div>

              {Object.keys(selectedOptions).length > 0 && (
                <div className="pl-2 border-l-2 border-border">
                  {Object.entries(selectedOptions).map(([key, value], idx) => {
                    const fieldDef = fields.find((f: any) => f.key === key);
                    let extra = 0;
                    if (fieldDef) {
                      if (fieldDef.type === 'number' && typeof value === 'number') {
                        extra = value * (fieldDef.extraPrice || 0);
                      } else if (fieldDef.type === 'checkbox' && value === true) {
                        extra = fieldDef.extraPrice || 0;
                      } else if (fieldDef.type === 'select' && fieldDef.options) {
                        const chosen = fieldDef.options.find((o: any) => (typeof o === 'string' ? o === value : o.label === value));
                        if (chosen && typeof chosen === 'object' && chosen.extraPrice) {
                          extra = chosen.extraPrice;
                        }
                      }
                    }
                    if (extra <= 0) return null;
                    return (
                      <div key={idx} className="flex justify-between text-muted-foreground">
                        <span>
                          {fieldDef?.label || key}
                          {value !== true && value != null && value !== false ? ` (${value})` : ''}
                        </span>
                        <span>+${extra.toLocaleString('es-CO')}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="border-t mt-3 pt-3 flex justify-between font-semibold text-base">
              <span>Total a pagar</span>
              <span className="text-orange-600">${finalPrice.toLocaleString('es-CO')} COP</span>
            </div>
          </div>

          <div className="border-t pt-4 flex justify-between text-2xl font-semibold">
            <span>Total a pagar</span>
            <span className="text-orange-600">
              ${finalPrice.toLocaleString('es-CO')} COP
            </span>
          </div>

          {/* Payment mode status */}
          {realPaymentsEnabled === false && (
            <div className="p-4 rounded-2xl bg-yellow-500/10 border border-yellow-500/30 text-sm text-yellow-700 dark:text-yellow-300">
              ⚠️ <strong>Modo de prueba activo</strong> — Los pagos reales están desactivados en el panel de administración. No se cobrará dinero real.
            </div>
          )}
          {realPaymentsEnabled === true && (
            <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-sm text-emerald-700 dark:text-emerald-300">
              ✅ Pagos reales habilitados
            </div>
          )}

          {/* Primary action: confirm the smart config → save order details → show the order page (in Mis Pedidos) before payment.
              This addresses the flow where users want to see the created order *before* the payment step. */}
          <Button 
            onClick={confirmAndGoToOrder} 
            disabled={opening || !order}
            className="w-full py-8 text-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60"
          >
            {opening 
              ? "Guardando configuración..." 
              : `Confirmar pedido y ver en Mis Pedidos — $${finalPrice.toLocaleString('es-CO')} COP`}
          </Button>

          <p className="text-center text-xs text-muted-foreground mt-2">
            Se guardarán los campos dinámicos, precio final y dirección (si aplica). 
            El pedido quedará como "Pendiente". Podrás pagar con Wompi desde la página de tu pedido.
            {realPaymentsEnabled === false && " (Los pagos reales están desactivados por el administrador por ahora.)"}
          </p>

          {/* Optional immediate pay (still available for those who want to pay right after config) */}
          {realPaymentsEnabled === true && wompiReady && (
            <Button 
              onClick={() => openPayment(order?.id)} 
              disabled={opening || !order}
              variant="outline"
              className="w-full mt-3"
            >
              Pagar ahora mismo con Wompi (sin ir a la página de pedido)
            </Button>
          )}

          {/* Wompi loading failure state */}
          {wompiLoadFailed && (
            <div className="mt-3 text-center">
              <p className="text-sm text-red-600 mb-2">
                No pudimos cargar el sistema de pagos de Wompi.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setWompiLoadFailed(false);
                  setWompiReady(false);
                  // Force re-trigger dynamic load
                  const script = document.createElement('script');
                  script.src = 'https://checkout.wompi.co/widget.js';
                  script.async = true;
                  script.onload = () => {
                    const check = setInterval(() => {
                      if (window.WompiCheckout) {
                        setWompiReady(true);
                        setWompiLoadFailed(false);
                        clearInterval(check);
                      }
                    }, 150);
                  };
                  document.head.appendChild(script);
                }}
              >
                Reintentar cargar Wompi
              </Button>
              <p className="text-xs text-muted-foreground mt-2">
                Si el problema persiste, intenta recargar la página o usa otro navegador.
              </p>
            </div>
          )}

          {/* Wompi load failed message (no more bypass button in prod; use support or wait for real payment/webhook) */}
          {wompiLoadFailed && order && (
            <div className="mt-6 p-4 border border-dashed border-orange-500 rounded-xl bg-orange-50 dark:bg-orange-950/20 text-sm">
              <p className="font-medium text-orange-800 dark:text-orange-300">Wompi no pudo cargarse.</p>
              <p className="mt-1 text-orange-700 dark:text-orange-400">
                El pedido quedó en estado Pendiente. El pago se confirmará automáticamente vía webhook cuando se complete (o contacta soporte).
              </p>
              <Button variant="outline" size="sm" className="mt-3" onClick={() => router.push(`/orders/${order.id}`)}>
                Ir a mi pedido
              </Button>
            </div>
          )}

          {/* DEBUG TOOLS: Simulate Wompi payment (shown when maintenance mode active, or in local dev) */}
          {(maintenanceMode || process.env.NODE_ENV === 'development') && order && (
            <div className="mt-4 p-4 border border-dashed border-gray-400 rounded-xl bg-gray-50 dark:bg-gray-950/30 text-sm">
              <p className="font-medium text-gray-700 dark:text-gray-400 mb-2">
                DEBUG / DEV TESTING — Only in maintenance mode or local dev
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                  try {
                    setOpening(true);
                    await fetch(`/api/orders/${order.id}`, {
                      method: 'PATCH',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ price: finalPrice, customFields: selectedOptions }),
                    });
                    await fetch(`/api/orders/${order.id}`, {
                      method: 'PATCH',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ status: 'Paid' }),
                    });
                    toast.success('Dev simulate: order marked Paid (use only for testing flow)');
                    router.push(`/orders/${order.id}`);
                  } catch (e) {
                    toast.error('Failed to simulate');
                  } finally {
                    setOpening(false);
                  }
                }}
                className="border-gray-400"
              >
                Simulate Wompi Payment (Dev)
              </Button>
              <p className="text-[10px] text-muted-foreground mt-1">
                Only visible in development. Real flow uses Wompi widget + webhook.
              </p>
            </div>
          )}

          <p className="text-center text-xs text-muted-foreground">
            Se abrirá Wompi Checkout en una ventana segura. 
            Completa el pago allí → serás redirigido de vuelta. 
            El estado se actualiza vía webhook (no confíes solo en la redirección).
          </p>

          {isWompiSandbox && (
            <div className="mt-4 p-3 bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-500 rounded-xl text-sm text-yellow-800 dark:text-yellow-200">
              ⚠️ <strong>Modo Beta / Pruebas activado</strong><br />
              Estás usando llaves de sandbox de Wompi. Los pagos no son reales.
            </div>
          )}

          {/* Wompi Debugger for real feedback on checkout page */}
          {maintenanceMode && order && (
            <div className="mt-6 p-4 border border-blue-300 bg-blue-50 dark:bg-blue-950/30 rounded-xl text-xs">
              <div className="font-semibold text-blue-800 dark:text-blue-300 mb-2 flex items-center gap-1">
                🔧 Wompi Debugger (for real feedback)
              </div>
              <div className="font-mono space-y-0.5 text-[10px] text-blue-700 dark:text-blue-400">
                <div>Order ID: {order.id}</div>
                <div>Reference: order_{order.id}</div>
                <div>Final Price: ${finalPrice.toLocaleString('es-CO')}</div>
                {lastWompiPrepare && (
                  <div className="mt-1 border-t border-blue-300 pt-1">
                    Last prepare debug: {JSON.stringify(lastWompiPrepare)}
                  </div>
                )}
              </div>
              <div className="flex gap-2 mt-2">
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="text-xs h-7"
                  onClick={async () => {
                    if (!order) return;
                    try {
                      const res = await fetch('/api/checkout/wompi', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ orderId: order.id })
                      });
                      const data = await res.json();
                      setLastWompiPrepare(data);
                      if (data.error) {
                        toast.error(data.error);
                      } else {
                        toast.success('Wompi config prepared');
                        if (data.keyMismatchWarning) {
                          toast.error('KEY MISMATCH detected in prepare: ' + data.keyMismatchWarning, { duration: 10000 });
                        }
                      }
                    } catch {
                      toast.error('Failed to prepare');
                    }
                  }}
                >
                  Prepare Wompi Config (debug)
                </Button>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  className="text-xs h-7"
                  onClick={() => {
                    const debugInfo = {
                      orderId: order.id,
                      reference: `order_${order.id}`,
                      finalPrice,
                      selectedOptions,
                      serviceAddress,
                      serviceLatitude,
                      serviceLongitude,
                      lastWompiPrepare,
                    };
                    navigator.clipboard?.writeText(JSON.stringify(debugInfo, null, 2));
                    toast.success('Debug info copied to clipboard');
                  }}
                >
                  Copy Debug Info
                </Button>
                {lastWompiPrepare && lastWompiPrepare.success && (
                  <Button 
                    size="sm" 
                    variant="default" 
                    className="text-xs h-7 bg-emerald-600 hover:bg-emerald-700"
                    onClick={() => openPayment(order?.id)} 
                    disabled={opening || !realPaymentsEnabled}
                  >
                    Launch Wompi to Enter Payment
                  </Button>
                )}
              </div>
              <p className="mt-2 text-[9px] text-blue-600/80 dark:text-blue-400/80 leading-tight">
                Use "Prepare Wompi Config" to see what will be sent to the widget (amount, signature, reference). 
                Copy this and send as feedback. The reference must match exactly in Wompi dashboard.
                "firma inválida" = the INTEGRITY_KEY (server env) does not match the secret registered for your public key in Wompi dashboard. Location of the buyer does not affect the signature.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
