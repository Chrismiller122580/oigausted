'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Loader2, Send, Sparkles } from 'lucide-react';

export default function AdminMarketingContent() {
  const [sellerLoading, setSellerLoading] = useState(false);
  const [buyerLoading, setBuyerLoading] = useState(false);
  const [lastResult, setLastResult] = useState<Record<string, unknown> | null>(null);

  const runBlast = async (path: string, dryRun: boolean, confirmMsg: string) => {
    if (!dryRun && !confirm(confirmMsg)) return;
    const setLoading = path.includes('buyer') ? setBuyerLoading : setSellerLoading;
    setLoading(true);
    try {
      const res = await fetch(`${path}?dryRun=${dryRun}`, { method: 'POST' });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setLastResult(data);
        toast.success(data.message || (dryRun ? 'Vista previa lista' : 'Campaña enviada'));
      } else {
        toast.error(data.error || 'No se pudo ejecutar el envío');
      }
    } catch {
      toast.error('Error al conectar con el envío masivo');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12">
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-2xl bg-gradient-to-br from-orange-500 to-red-600 text-white shrink-0">
          <Sparkles className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl sm:text-4xl font-bold tracking-tight">AI Marketing Studio</h1>
          <p className="text-sm text-muted-foreground mt-1">
            El panel completo se está restaurando. Los envíos masivos siguen disponibles.
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-orange-200/60 bg-orange-50/30 dark:bg-orange-950/20 p-4 space-y-3">
        <p className="text-xs uppercase tracking-widest text-muted-foreground font-medium">
          Envío masivo vendedores
        </p>
        <p className="text-sm text-muted-foreground">
          Guía “conseguir compradores” a vendedores que aún no la recibieron.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={sellerLoading}
            onClick={() => runBlast('/api/admin/marketing/seller-toolkit-blast', true, '')}
          >
            {sellerLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Vista previa
          </Button>
          <Button
            size="sm"
            className="bg-orange-600 hover:bg-orange-700"
            disabled={sellerLoading}
            onClick={() =>
              runBlast(
                '/api/admin/marketing/seller-toolkit-blast',
                false,
                '¿Enviar la guía de compradores a TODOS los vendedores que aún no la recibieron?',
              )
            }
          >
            {sellerLoading ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Send className="h-4 w-4 mr-1" />}
            Enviar a vendedores
          </Button>
        </div>
      </div>

      <div className="rounded-2xl border border-border p-4 space-y-3">
        <p className="text-xs uppercase tracking-widest text-muted-foreground font-medium">
          Envío masivo compradores
        </p>
        <p className="text-sm text-muted-foreground">
          Cómo comprar: buscar gig, chatear in-app, pagar con Wompi y dejar reseña. Respeta idioma preferido (es/en).
        </p>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={buyerLoading}
            onClick={() => runBlast('/api/admin/marketing/buyer-purchase-guide-blast', true, '')}
          >
            {buyerLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Vista previa
          </Button>
          <Button
            size="sm"
            className="bg-orange-600 hover:bg-orange-700"
            disabled={buyerLoading}
            onClick={() =>
              runBlast(
                '/api/admin/marketing/buyer-purchase-guide-blast',
                false,
                '¿Enviar la guía de compra a los compradores que aún no la recibieron?',
              )
            }
          >
            {buyerLoading ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Send className="h-4 w-4 mr-1" />}
            Enviar a compradores
          </Button>
        </div>
      </div>

      {lastResult && (
        <div className="rounded-xl border bg-muted/30 px-4 py-3 text-sm">
          <div className="font-medium mb-1">Último resultado</div>
          <pre className="text-xs whitespace-pre-wrap break-words text-muted-foreground">
            {JSON.stringify(lastResult, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
