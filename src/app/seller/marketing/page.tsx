'use client';

import { Suspense, useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  Sparkles,
  Copy,
  Loader2,
  Instagram,
  MessageCircle,
  Download,
  ExternalLink,
  Crown,
  Store,
  ImageIcon,
  Clock,
  Lightbulb,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { MARKETING_BRAND_LOGO_PATH } from '@/lib/seller-marketing-brand';
import { getGigImages } from '@/lib/gig-images';
import { buildWompiWidgetConfig } from '@/lib/wompi-widget';
import type { WompiPrepareResponse, WompiWidgetResult } from '@/types/wompi';
import type { SellerGeneratedContent } from '@/lib/seller-marketing-types';
import MarketingPreviewPanel, { type PreviewMode } from './MarketingPreviewPanel';

type GigOption = { id: string; title: string; isActive?: boolean; photos: string[] };

type SubscriptionState = {
  tier: string;
  usedThisMonth: number;
  limit: number | null;
  canGenerate: boolean;
  isUnlimited: boolean;
  allowed: boolean;
  blockedReason?: string;
  expiresAt: string | null;
  storeUrl: string;
  storePath: string;
  proPriceCOP: number;
  adminState: { enabled: boolean; adminOverride: string | null; adminNote: string | null };
};

const QUICK_GOALS = [
  'Promocionar mi servicio en Instagram',
  'Conseguir clientes por WhatsApp',
  'Anunciar un servicio nuevo',
  'Destacar mis reseñas y confianza',
];

const TONES = [
  'cercano y confiable',
  'profesional',
  'amigable y local',
  'inspirador',
  'directo y claro',
];

type ResultTab = 'instagram' | 'whatsapp' | 'downloads' | 'tips';

function SellerMarketingPageClient() {
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const [subscription, setSubscription] = useState<SubscriptionState | null>(null);
  const [gigs, setGigs] = useState<GigOption[]>([]);
  const [selectedGigId, setSelectedGigId] = useState('');
  const [selectedPhotoUrl, setSelectedPhotoUrl] = useState('');
  const [useAiVisual, setUseAiVisual] = useState(false);
  const [goal, setGoal] = useState('');
  const [prompt, setPrompt] = useState('');
  const [tone, setTone] = useState(TONES[0]);
  const [generating, setGenerating] = useState(false);
  const [upgrading, setUpgrading] = useState(false);
  const [content, setContent] = useState<SellerGeneratedContent | null>(null);
  const [brandCardUrls, setBrandCardUrls] = useState<{ feed: string; story: string } | null>(null);
  const [activeTab, setActiveTab] = useState<ResultTab>('instagram');
  const [previewMode, setPreviewMode] = useState<PreviewMode>('feed');
  const [loading, setLoading] = useState(true);

  const fetchSubscription = useCallback(async () => {
    const res = await fetch('/api/seller/marketing/subscription');
    if (res.ok) {
      const data = await res.json();
      setSubscription(data);
    }
  }, []);

  const fetchGigs = useCallback(async () => {
    const res = await fetch('/api/seller/gigs');
    if (res.ok) {
      const data = await res.json();
      const list = Array.isArray(data) ? data : data?.gigs || [];
      setGigs(
        list
          .filter((g: { isActive?: boolean }) => g.isActive !== false)
          .map((g: { id: string; title: string; isActive?: boolean; imageUrl?: string | null; images?: unknown }) => ({
            id: g.id,
            title: g.title,
            isActive: g.isActive,
            photos: getGigImages(g),
          })),
      );
    }
  }, []);

  useEffect(() => {
    Promise.all([fetchSubscription(), fetchGigs()]).finally(() => setLoading(false));
  }, [fetchSubscription, fetchGigs]);

  useEffect(() => {
    const gig = gigs.find((g) => g.id === selectedGigId);
    if (!gig?.photos.length) {
      setSelectedPhotoUrl('');
      return;
    }
    setSelectedPhotoUrl((prev) =>
      prev && gig.photos.includes(prev) ? prev : gig.photos[0],
    );
  }, [selectedGigId, gigs]);

  useEffect(() => {
    if (searchParams.get('upgraded') === '1') {
      toast.success('¡Pago recibido! Tu plan Pro se activará en unos segundos.');
      void fetchSubscription();
    }
  }, [searchParams, fetchSubscription]);

  const copyText = (text: string, label?: string) => {
    void navigator.clipboard.writeText(text);
    toast.success(label ? `${label} copiado` : 'Copiado');
  };

  const getFormErrors = (goalValue: string, gigId: string): string[] => {
    const errors: string[] = [];
    if (!gigId) errors.push('Selecciona un servicio a promocionar');
    if (!goalValue.trim()) errors.push('Escribe un objetivo o elige una sugerencia abajo');
    return errors;
  };

  const generate = async () => {
    const errors = getFormErrors(goal, selectedGigId);
    if (errors.length > 0) {
      toast.error(errors[0]);
      return;
    }

    setGenerating(true);
    setContent(null);
    setBrandCardUrls(null);
    try {
      const res = await fetch('/api/seller/marketing/ai-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          goal: goal.trim(),
          prompt: prompt.trim(),
          tone,
          gigId: selectedGigId,
          photoUrl: selectedPhotoUrl || undefined,
          useAiVisual,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 402) {
          toast.error(data.error || 'Límite alcanzado. Mejora a Pro.');
        } else {
          toast.error(data.error || 'No se pudo generar');
        }
        return;
      }
      setContent(data.content);
      if (data.selectedPhotoUrl) {
        setSelectedPhotoUrl(data.selectedPhotoUrl);
      }
      const cacheBust = Date.now();
      if (data.brandCardUrls) {
        setBrandCardUrls({
          feed: `${data.brandCardUrls.feed}&_t=${cacheBust}`,
          story: `${data.brandCardUrls.story}&_t=${cacheBust}`,
        });
      }
      setActiveTab('instagram');
      setPreviewMode('instagram');
      if (data.fallback) {
        toast.success('Contenido de respaldo generado');
      } else if (useAiVisual && !data.aiVisualApplied) {
        toast.success('Contenido generado. La mejora con IA no estuvo disponible; usamos tu foto original.');
      } else if (data.aiVisualApplied) {
        toast.success('¡Contenido e imagen mejorada con IA generados!');
      } else {
        toast.success('¡Contenido e imágenes generados!');
      }
      await fetchSubscription();
    } catch {
      toast.error('Error de conexión');
    } finally {
      setGenerating(false);
    }
  };

  const openWompiUpgrade = async () => {
    setUpgrading(true);
    try {
      const res = await fetch('/api/seller/marketing/subscribe', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'No se pudo iniciar el pago');
        return;
      }

      const widgetConfig = buildWompiWidgetConfig(data as WompiPrepareResponse);
      const scriptId = 'wompi-marketing-widget';
      if (!document.getElementById(scriptId)) {
        const script = document.createElement('script');
        script.id = scriptId;
        script.src = 'https://checkout.wompi.co/widget.js';
        script.async = true;
        document.body.appendChild(script);
        await new Promise<void>((resolve) => {
          script.onload = () => resolve();
        });
      }

      const WidgetCheckout = window.WidgetCheckout || window.WompiCheckout;
      if (!WidgetCheckout) {
        toast.error('Widget de pago no disponible');
        return;
      }
      const checkout = new WidgetCheckout(widgetConfig);
      checkout.open((result: WompiWidgetResult) => {
        if (result.transaction?.status === 'APPROVED') {
          toast.success('¡Plan Pro activado!');
          void fetchSubscription();
        }
      });
    } catch {
      toast.error('Error abriendo pago');
    } finally {
      setUpgrading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
      </div>
    );
  }

  const blocked = !!(subscription && !subscription.allowed);
  const atLimit = !!(subscription && !subscription.canGenerate && !subscription.isUnlimited);
  const noGigs = gigs.length === 0;

  const formErrors = getFormErrors(goal, selectedGigId);
  const canGenerate = formErrors.length === 0 && !generating && !atLimit;
  const selectedGig = gigs.find((g) => g.id === selectedGigId) ?? null;
  const businessName =
    session?.user?.businessName || session?.user?.name || 'Mi negocio';

  return (
    <div className="bg-background py-8 mobile-page-bottom">
      <div className="max-w-6xl mx-auto px-6 space-y-8">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-2xl bg-gradient-to-br from-orange-500 to-red-600 text-white shrink-0">
              <Sparkles className="h-7 w-7" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Estudio de Marketing IA</h1>
              <p className="text-muted-foreground mt-1">
                Genera posts para Instagram y WhatsApp con tu tienda OigaGIG incluida.
              </p>
            </div>
          </div>
          <Image
            src={MARKETING_BRAND_LOGO_PATH}
            alt="OigaGIG"
            width={160}
            height={72}
            className="object-contain shrink-0"
          />
        </div>

        {subscription?.storeUrl && (
          <div className="flex flex-wrap items-center gap-3 rounded-xl border border-orange-200 bg-orange-50/80 dark:bg-orange-950/30 dark:border-orange-900/50 px-4 py-3">
            <Store className="h-5 w-5 text-orange-600 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">Tu tienda pública</p>
              <p className="text-xs text-muted-foreground truncate">
                Todas las descargas incluyen {subscription.storeUrl.replace(/^https?:\/\//, '')}
              </p>
            </div>
            <Button asChild variant="outline" size="sm" className="gap-1.5 shrink-0">
              <Link href={subscription.storePath} target="_blank" rel="noreferrer">
                <ExternalLink className="h-3.5 w-3.5" />
                Ver tienda
              </Link>
            </Button>
          </div>
        )}

        {subscription && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-3">
            <div className="text-sm">
              {subscription.isUnlimited ? (
                <span className="inline-flex items-center gap-1.5 font-medium text-orange-600">
                  <Crown className="h-4 w-4" />
                  Plan Pro · generaciones ilimitadas
                  {subscription.expiresAt && (
                    <span className="text-muted-foreground font-normal">
                      · hasta {new Date(subscription.expiresAt).toLocaleDateString('es-CO')}
                    </span>
                  )}
                </span>
              ) : (
                <span>
                  <strong>{subscription.usedThisMonth}</strong> de{' '}
                  <strong>{subscription.limit ?? 3}</strong> generaciones este mes (gratis)
                </span>
              )}
            </div>
            {!subscription.isUnlimited && (
              <Button
                size="sm"
                className="bg-orange-600 hover:bg-orange-700 gap-1.5"
                onClick={openWompiUpgrade}
                disabled={upgrading}
              >
                {upgrading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Crown className="h-4 w-4" />}
                Mejorar a Pro · ${(subscription.proPriceCOP || 29900).toLocaleString('es-CO')}/mes
              </Button>
            )}
          </div>
        )}

        {blocked && (
          <div className="rounded-2xl border border-red-300 bg-red-50 dark:bg-red-950/30 p-6 text-center">
            <h2 className="text-lg font-semibold text-red-800 dark:text-red-200">Acceso desactivado</h2>
            <p className="text-sm text-red-700 dark:text-red-300 mt-2">
              {subscription?.blockedReason || 'Contacta soporte para más información.'}
            </p>
            <Button asChild variant="outline" className="mt-4">
              <Link href="/support">Contactar soporte</Link>
            </Button>
          </div>
        )}

        {!blocked && noGigs && (
          <div className="rounded-2xl border border-dashed border-orange-300 p-8 text-center">
            <h2 className="text-xl font-semibold">Publica tu primer servicio</h2>
            <p className="text-muted-foreground mt-2 mb-6">
              Necesitas al menos un gig activo para generar contenido de marketing.
            </p>
            <Button asChild className="bg-orange-600 hover:bg-orange-700">
              <Link href="/create-gig">Crear mi servicio</Link>
            </Button>
          </div>
        )}

        {!blocked && !noGigs && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
            <div className="bg-card border-2 border-orange-500/30 rounded-2xl p-6 space-y-5">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-orange-500" />
                Generador de contenido
              </h2>

              {atLimit && (
                <div className="rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-300 px-4 py-3 text-sm text-amber-900 dark:text-amber-200">
                  Has alcanzado el límite gratuito este mes. Mejora a Pro para seguir generando.
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">
                    Servicio a promocionar <span className="text-orange-600">*</span>
                  </label>
                  <select
                    value={selectedGigId}
                    onChange={(e) => {
                      setSelectedGigId(e.target.value);
                      setBrandCardUrls(null);
                    }}
                    className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                    required
                  >
                    <option value="">Selecciona un servicio…</option>
                    {gigs.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.title}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium">Tono</label>
                  <select
                    value={tone}
                    onChange={(e) => setTone(e.target.value)}
                    className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                  >
                    {TONES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">
                  Objetivo <span className="text-orange-600">*</span>
                </label>
                <Input
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  placeholder="Ej: Conseguir más clientes por WhatsApp esta semana"
                  className="mt-1"
                  required
                />
                <p className="text-xs text-muted-foreground mt-2 mb-2">Sugerencias rápidas (solo rellenan el objetivo):</p>
                <div className="flex flex-wrap gap-2">
                  {QUICK_GOALS.map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => setGoal(g)}
                      disabled={generating || atLimit}
                      className={`text-sm px-3 py-1.5 rounded-full border transition ${
                        goal === g
                          ? 'border-orange-500 bg-orange-50 text-orange-800 dark:bg-orange-950/40 dark:text-orange-200'
                          : 'border-border hover:border-orange-400 hover:bg-orange-50 dark:hover:bg-orange-950/30'
                      }`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>

              {selectedGig && selectedGig.photos.length > 0 && (
                <div>
                  <label className="text-sm font-medium flex items-center gap-1.5">
                    <ImageIcon className="h-4 w-4 text-orange-500" />
                    Foto para el visual <span className="text-orange-600">*</span>
                  </label>
                  <p className="text-xs text-muted-foreground mt-1 mb-2">
                    Elige una foto de tu servicio. Se usará en la imagen de marketing con tu marca.
                  </p>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {selectedGig.photos.map((url) => (
                      <button
                        key={url}
                        type="button"
                        onClick={() => {
                          setSelectedPhotoUrl(url);
                          setBrandCardUrls(null);
                        }}
                        className={`relative aspect-square rounded-lg overflow-hidden border-2 transition ${
                          selectedPhotoUrl === url
                            ? 'border-orange-500 ring-2 ring-orange-500/30'
                            : 'border-border hover:border-orange-400'
                        }`}
                      >
                        <Image src={url} alt="" fill className="object-cover" sizes="96px" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <label className="flex items-start gap-3 rounded-lg border border-border px-3 py-3 cursor-pointer hover:bg-muted/40 transition">
                <input
                  type="checkbox"
                  checked={useAiVisual}
                  onChange={(e) => setUseAiVisual(e.target.checked)}
                  disabled={generating || atLimit || !selectedPhotoUrl}
                  className="mt-1 h-4 w-4 rounded border-border text-orange-600 focus:ring-orange-500"
                />
                <span className="text-sm">
                  <span className="font-medium">Mejorar visual con IA</span>
                  <span className="block text-xs text-muted-foreground mt-0.5">
                    Opcional. Aplica un estilo profesional a tu foto elegida al generar el contenido.
                  </span>
                </span>
              </label>

              <div>
                <label className="text-sm font-medium">Instrucciones extra (opcional)</label>
                <Textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  rows={2}
                  placeholder="Menciona tu zona, horarios, especialidad..."
                  className="mt-1"
                />
              </div>

              {formErrors.length > 0 && !atLimit && (
                <p className="text-sm text-muted-foreground">
                  Completa los campos obligatorios: {formErrors.join(' · ')}
                </p>
              )}

              <Button
                onClick={() => void generate()}
                disabled={!canGenerate}
                className="bg-orange-600 hover:bg-orange-700 gap-2 w-full sm:w-auto"
              >
                {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                {generating ? 'Generando contenido e imágenes…' : 'Generar contenido'}
              </Button>
            </div>

            <MarketingPreviewPanel
              previewMode={previewMode}
              onPreviewModeChange={setPreviewMode}
              selectedGigId={selectedGigId}
              selectedGigTitle={selectedGig?.title ?? null}
              selectedPhotoUrl={selectedPhotoUrl}
              businessName={businessName}
              storePath={subscription?.storePath ?? ''}
              storeUrl={subscription?.storeUrl ?? ''}
              goal={goal}
              tone={tone}
              generating={generating}
              content={content}
              brandCardUrls={brandCardUrls}
            />
          </div>
        )}

        {content && (
          <div className="bg-card border rounded-2xl p-6 space-y-6">
            {brandCardUrls && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <ImageIcon className="h-5 w-5 text-orange-500" />
                  Imágenes con tu marca
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {(
                    [
                      ['feed', 'Imagen feed (1080×1080)', brandCardUrls.feed],
                      ['story', 'Imagen story (1080×1920)', brandCardUrls.story],
                    ] as const
                  ).map(([key, label, url]) => (
                    <div key={key} className="space-y-3">
                      <p className="font-medium text-sm">{label}</p>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={url}
                        alt={label}
                        className="w-full rounded-xl border border-border shadow-sm bg-muted/30"
                      />
                      <Button asChild variant="outline" size="sm" className="w-full gap-2">
                        <a href={url} download={`oigagig-marketing-${key}.svg`} target="_blank" rel="noreferrer">
                          <Download className="h-4 w-4" />
                          Descargar con marca
                        </a>
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex flex-wrap gap-2 border-b border-border pb-3">
              {(
                [
                  ['instagram', 'Instagram', Instagram],
                  ['whatsapp', 'WhatsApp', MessageCircle],
                  ['downloads', 'Descargas', Download],
                  ['tips', 'Consejos', Lightbulb],
                ] as const
              ).map(([key, label, Icon]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setActiveTab(key)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm transition ${
                    activeTab === key
                      ? 'bg-orange-600 text-white'
                      : 'border border-border hover:bg-muted'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {label}
                </button>
              ))}
            </div>

            {activeTab === 'instagram' && (
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="font-medium flex items-center gap-2">
                    <Instagram className="h-4 w-4" /> Instagram
                  </span>
                  <Button size="sm" variant="ghost" onClick={() => copyText(content.social.instagram, 'Instagram')}>
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                </div>
                <p className="text-sm whitespace-pre-wrap bg-muted/50 rounded-xl p-4">{content.social.instagram}</p>
              </div>
            )}

            {activeTab === 'whatsapp' && (
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="font-medium flex items-center gap-2">
                    <MessageCircle className="h-4 w-4" /> WhatsApp
                  </span>
                  <Button size="sm" variant="ghost" onClick={() => copyText(content.social.whatsapp, 'WhatsApp')}>
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                </div>
                <p className="text-sm whitespace-pre-wrap bg-muted/50 rounded-xl p-4">{content.social.whatsapp}</p>
              </div>
            )}

            {activeTab === 'downloads' && brandCardUrls && (
              <p className="text-sm text-muted-foreground">
                Las imágenes con tu marca y código QR están arriba. Descárgalas para publicar en Instagram o WhatsApp.
              </p>
            )}

            {activeTab === 'downloads' && !brandCardUrls && (
              <p className="text-sm text-muted-foreground">
                No se pudieron generar las imágenes. Intenta de nuevo o contacta soporte.
              </p>
            )}

            {activeTab === 'tips' && (
              <div className="space-y-4 text-sm">
                <div>
                  <p className="font-medium flex items-center gap-2 mb-2">
                    <Clock className="h-4 w-4" /> Mejores horarios
                  </p>
                  <p className="text-muted-foreground">{content.bestTimes}</p>
                </div>
                <div>
                  <p className="font-medium mb-2">{content.postingTips}</p>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {content.hashtags.map((h) => (
                    <span key={h} className="text-xs px-2 py-0.5 bg-muted rounded-full">
                      {h}
                    </span>
                  ))}
                  <Button
                    size="sm"
                    variant="outline"
                    className="ml-auto"
                    onClick={() => copyText(content.hashtags.join(' '), 'Hashtags')}
                  >
                    Copiar hashtags
                  </Button>
                </div>
                {content.visualPrompts.length > 0 && (
                  <div className="space-y-2">
                    <p className="font-medium">Prompts visuales (con marca OigaGIG)</p>
                    {content.visualPrompts.map((p, i) => (
                      <p key={i} className="text-xs font-mono bg-muted p-3 rounded-lg">
                        {p}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function SellerMarketingPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[60vh] flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
        </div>
      }
    >
      <SellerMarketingPageClient />
    </Suspense>
  );
}