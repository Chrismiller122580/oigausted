'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'react-hot-toast';
import { parseJsonArrayField } from '@/lib/utils';
import Script from 'next/script';
import { getAuthCallbackUrl } from '@/lib/getAuthCallbackUrl';

declare global {
  interface Window {
    WompiCheckout?: any;
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

  const WOMPI_PUBLIC_KEY = process.env.NEXT_PUBLIC_WOMPI_PUBLIC_KEY || '';

  // Dynamic fields selections
  const [selectedOptions, setSelectedOptions] = useState<Record<string, any>>({});

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
        console.error('[Wompi] Failed to load after multiple attempts');
        setWompiLoadFailed(true);
      }
    }, 200);

    // Dynamic injection fallback
    const loadScriptDynamically = () => {
      if (document.querySelector('script[src*="checkout.wompi.co"]')) return;

      console.log('[Wompi] Attempting dynamic script load...');

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
        console.error('[Wompi] Failed to load widget script dynamically');
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
      console.error('Checkout load error:', err);
      toast.error(err.message || "No se pudo cargar el checkout. ¿Estás logueado?");
    } finally {
      setLoading(false);
    }
  };

  const openWompiWidget = async () => {
    if (!order || !gig) return;

    if (!wompiReady) {
      toast.error("El sistema de pagos aún está cargando. Intenta de nuevo en unos segundos.");
      return;
    }

    setOpening(true);

    try {
      // 1. Save the buyer's selections + final price to the order before payment
      const updateRes = await fetch(`/api/orders/${order.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          price: finalPrice,
          customFields: selectedOptions,
        }),
      });

      if (!updateRes.ok) {
        const errData = await updateRes.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to save your selections');
      }

      // 2. Prepare Wompi checkout
      const res = await fetch('/api/checkout/wompi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: order.id })
      });

      const data = await res.json();
      if (data.error) throw new Error(data.error);

      const checkoutData = data.checkoutData;

      // 3. Open Wompi with the final amount (include integrity signature if available)
      if (window.WompiCheckout && checkoutData) {
        const widgetConfig: any = {
          publicKey: checkoutData.publicKey,
          currency: checkoutData.currency,
          amountInCents: finalPrice * 100,
          reference: checkoutData.reference,
          redirectUrl: checkoutData.redirectUrl,
          customerData: checkoutData.customerData,
        };

        // Pass integrity signature for better security (when backend provides it)
        if (checkoutData.signature?.integrity) {
          widgetConfig.signature = {
            integrity: checkoutData.signature.integrity,
          };
        }

        const checkout = new window.WompiCheckout(widgetConfig);
        checkout.open();
      } else if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        toast.error("No se pudo abrir Wompi. ¿Tienes las llaves de sandbox configuradas?");
      }
    } catch (err: any) {
      console.error('Wompi widget error:', err);
      toast.error(err.message || "No se pudo abrir Wompi. Por favor intenta de nuevo o contacta soporte.");
    } finally {
      setOpening(false);
    }
  };

  // Beta bypass for when Wompi widget fails to load (explicit user action only)
  const handleBypassPayment = async () => {
    if (!order || !gig) return;

    const confirmed = window.confirm(
      '⚠️ BYPASS BETA: Esto marcará el pedido como PAGADO manualmente sin usar Wompi.\n\n' +
      'Úsalo SOLO si Wompi no carga y necesitas avanzar.\n' +
      'El vendedor verá el pedido como pagado y podrá comenzar.\n\n' +
      '¿Confirmas que quieres usar el bypass temporal?'
    );
    if (!confirmed) return;

    try {
      setOpening(true);

      // 1. Save selections + final price (same as real flow)
      const updateRes = await fetch(`/api/orders/${order.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          price: finalPrice,
          customFields: {
            ...selectedOptions,
            __bypass: true,
            __bypassReason: 'wompi_widget_failed',
            __bypassAt: new Date().toISOString(),
          },
        }),
      });

      if (!updateRes.ok) {
        const errData = await updateRes.json().catch(() => ({}));
        throw new Error(errData.error || 'No se pudieron guardar las selecciones');
      }

      // 2. Mark as Paid (bypass)
      const paidRes = await fetch(`/api/orders/${order.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'Paid' }),
      });

      if (!paidRes.ok) {
        throw new Error('No se pudo marcar el pedido como pagado');
      }

      toast.success('Pedido marcado como pagado manualmente (Bypass Beta). Redirigiendo...');
      router.push(`/orders/${order.id}`);
    } catch (err: any) {
      console.error('Bypass error:', err);
      toast.error(err.message || 'Error al aplicar el bypass. Intenta de nuevo.');
    } finally {
      setOpening(false);
    }
  };

  const fields = parseJsonArrayField(gig?.fields);

  // Calculate extra cost from selections
  const calculateExtra = () => {
    let extra = 0;
    fields.forEach((field: any) => {
      const value = selectedOptions[field.key];
      if (!value) return;

      if (field.type === 'number' && typeof value === 'number') {
        extra += value * (field.extraPrice || 0);
      } else if (field.type === 'checkbox' && value === true) {
        extra += field.extraPrice || 0;
      } else if (field.type === 'select' && field.options) {
        const chosen = field.options.find((o: any) => (typeof o === 'string' ? o === value : o.label === value));
        if (chosen && typeof chosen === 'object' && chosen.extraPrice) {
          extra += chosen.extraPrice;
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
        <p className="font-semibold text-gray-800 mb-4">Personaliza tu servicio</p>
        <div className="space-y-5">
          {fields.map((field: any, index: number) => {
            const currentValue = selectedOptions[field.key];

            return (
              <div key={index}>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
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
                    <span className="text-gray-700">Sí, incluir</span>
                  </label>
                )}

                {field.type === 'select' && field.options && (
                  <select
                    value={currentValue || ''}
                    onChange={(e) => handleFieldChange(field.key, e.target.value)}
                    className="w-full border rounded-xl px-4 py-3 text-lg bg-white"
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
      {/* Load Wompi widget reliably for this page only */}
      <Script
        src="https://checkout.wompi.co/widget.js"
        strategy="lazyOnload"
        onLoad={() => setWompiReady(true)}
      />

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

          {/* Payment Breakdown */}
          <div className="bg-white border rounded-2xl p-5 text-sm">
            <p className="font-semibold text-gray-800 mb-3">Resumen del pago</p>

            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Precio base del servicio</span>
                <span>${(gig?.price || 0).toLocaleString('es-CO')}</span>
              </div>

              {Object.keys(selectedOptions).length > 0 && (
                <div className="pl-2 border-l-2 border-gray-200">
                  {Object.entries(selectedOptions).map(([key, value], idx) => {
                    // Find the field definition to show the extra price
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

                    return (
                      <div key={idx} className="flex justify-between text-muted-foreground">
                        <span>{key} {value && `(${value})`}</span>
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

          <Button 
            onClick={openWompiWidget} 
            disabled={opening || !order || (!wompiReady && !wompiLoadFailed)}
            className="w-full py-8 text-lg bg-green-600 hover:bg-green-700"
          >
            {opening 
              ? "Abriendo Wompi..." 
              : wompiLoadFailed
                ? "Error al cargar Wompi - Reintentar"
                : !wompiReady 
                  ? "Cargando sistema de pagos de Wompi..." 
                  : `Pagar con Wompi — $${finalPrice.toLocaleString('es-CO')}`}
          </Button>

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

          {/* BETA BYPASS - Only when Wompi widget fails to load (explicit, warned action) */}
          {wompiLoadFailed && order && (
            <div className="mt-6 p-5 border-2 border-dashed border-orange-500 rounded-2xl bg-orange-50 dark:bg-orange-950/20">
              <div className="flex items-start gap-3">
                <span className="text-3xl mt-0.5">⚠️</span>
                <div className="flex-1 space-y-3">
                  <div>
                    <p className="font-bold text-orange-800 dark:text-orange-300 text-lg">
                      Wompi no está disponible ahora (Beta)
                    </p>
                    <p className="text-sm text-orange-700 dark:text-orange-400 mt-1">
                      El widget de pagos falló al cargar. Este es un <strong>bypass temporal</strong> para que puedas completar tu compra durante la fase beta.
                    </p>
                  </div>

                  <Button
                    onClick={handleBypassPayment}
                    disabled={opening}
                    className="w-full py-7 text-base font-semibold bg-orange-600 hover:bg-orange-700 text-white"
                  >
                    {opening ? 'Procesando bypass...' : '✅ Confirmar pago manualmente (Bypass Beta)'}
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => router.push(`/orders/${order.id}`)}
                    className="w-full border-orange-300 text-orange-700 hover:bg-orange-100 dark:border-orange-700 dark:text-orange-300"
                  >
                    Dejar pedido pendiente (ir a mis pedidos)
                  </Button>

                  <div className="text-[11px] text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-950/40 p-3 rounded-xl leading-snug">
                    <strong>IMPORTANTE:</strong> Este botón marca tu pedido como <strong>Pagado</strong> sin pasar por Wompi. 
                    El vendedor recibirá el pedido como pagado y podrá comenzar el trabajo. 
                    Úsalo solo si Wompi no funciona o si ya pagaste por otro medio (transferencia, etc). 
                    Este bypass será eliminado cuando el pago con Wompi esté estable. 
                    Cualquier abuso será revisado.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Temporary debug info (dev only) */}
          {process.env.NODE_ENV === 'development' && (
            <div className="text-[10px] text-muted-foreground text-center -mt-2">
              Debug: wompiReady={wompiReady ? 'true' : 'false'} | order={order ? 'ok' : 'no'}
            </div>
          )}

          {/* DEV BYPASS - Simulate successful Wompi payment (now properly saves fields too) */}
          {process.env.NODE_ENV === 'development' && (!wompiReady || wompiLoadFailed) && order && (
            <div className="mt-4 p-4 border border-dashed border-orange-500 rounded-xl bg-orange-50 dark:bg-orange-950/30">
              <p className="text-sm font-medium text-orange-700 dark:text-orange-400 mb-2">
                DEV TESTING ONLY
              </p>
              <Button
                variant="outline"
                onClick={async () => {
                  try {
                    setOpening(true);
                    // Save selections + price with dev bypass marker
                    await fetch(`/api/orders/${order.id}`, {
                      method: 'PATCH',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        price: finalPrice,
                        customFields: {
                          ...selectedOptions,
                          __bypass: true,
                          __bypassReason: 'dev_simulate',
                          __bypassAt: new Date().toISOString(),
                        },
                      }),
                    });
                    // Then mark Paid
                    await fetch(`/api/orders/${order.id}`, {
                      method: 'PATCH',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ status: 'Paid' }),
                    });
                    toast.success('Payment simulated (order marked as Paid + fields saved)');
                    router.push(`/orders/${order.id}`);
                  } catch (e) {
                    toast.error('Failed to simulate payment');
                  } finally {
                    setOpening(false);
                  }
                }}
                className="w-full border-orange-500 hover:bg-orange-100 dark:hover:bg-orange-950"
              >
                Simulate Successful Wompi Payment (Dev Only)
              </Button>
              <p className="text-xs text-muted-foreground mt-2 text-center">
                Bypasses the real Wompi widget so you can test the rest of the flow. Now correctly saves custom fields.
              </p>
            </div>
          )}

          <p className="text-center text-xs text-muted-foreground">
            Serás redirigido a Wompi para completar el pago de forma segura. 
            Una vez pagado, volverás automáticamente a tus pedidos.
          </p>

          {isWompiSandbox && (
            <div className="mt-4 p-3 bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-500 rounded-xl text-sm text-yellow-800 dark:text-yellow-200">
              ⚠️ <strong>Modo Beta / Pruebas activado</strong><br />
              Estás usando llaves de sandbox de Wompi. Los pagos no son reales.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
