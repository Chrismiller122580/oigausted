'use client';

import { useMemo, type ReactNode } from 'react';
import Image from 'next/image';
import {
  Eye,
  Instagram,
  MessageCircle,
  ImageIcon,
  Smartphone,
  Loader2,
} from 'lucide-react';
import { MARKETING_BRAND_LOGO_PATH, buildBrandCardPath } from '@/lib/seller-marketing-brand';
import type { SellerGeneratedContent } from '@/lib/seller-marketing-types';

export type PreviewMode = 'feed' | 'story' | 'instagram' | 'whatsapp';

type Props = {
  previewMode: PreviewMode;
  onPreviewModeChange: (mode: PreviewMode) => void;
  selectedGigId: string;
  selectedGigTitle: string | null;
  selectedPhotoUrl: string;
  businessName: string;
  storePath: string;
  storeUrl: string;
  goal: string;
  tone: string;
  generating: boolean;
  content: SellerGeneratedContent | null;
  brandCardUrls: { feed: string; story: string } | null;
};

function PreviewTabs({
  previewMode,
  onPreviewModeChange,
  hasContent,
}: {
  previewMode: PreviewMode;
  onPreviewModeChange: (mode: PreviewMode) => void;
  hasContent: boolean;
}) {
  const tabs: { key: PreviewMode; label: string; icon: typeof ImageIcon }[] = hasContent
    ? [
        { key: 'feed', label: 'Feed', icon: ImageIcon },
        { key: 'story', label: 'Story', icon: Smartphone },
        { key: 'instagram', label: 'Instagram', icon: Instagram },
        { key: 'whatsapp', label: 'WhatsApp', icon: MessageCircle },
      ]
    : [
        { key: 'feed', label: 'Feed', icon: ImageIcon },
        { key: 'story', label: 'Story', icon: Smartphone },
      ];

  return (
    <div className="flex flex-wrap gap-1.5">
      {tabs.map(({ key, label, icon: Icon }) => (
        <button
          key={key}
          type="button"
          onClick={() => onPreviewModeChange(key)}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition ${
            previewMode === key
              ? 'bg-orange-600 text-white'
              : 'bg-muted text-muted-foreground hover:bg-muted/80'
          }`}
        >
          <Icon className="h-3 w-3" />
          {label}
        </button>
      ))}
    </div>
  );
}

function PhoneFrame({
  aspect,
  children,
  label,
}: {
  aspect: 'square' | 'story';
  children: ReactNode;
  label?: string;
}) {
  return (
    <div className="mx-auto w-full max-w-[280px]">
      <div className="rounded-[2rem] border-[6px] border-zinc-800 dark:border-zinc-600 bg-zinc-900 p-2 shadow-xl">
        <div className="rounded-[1.4rem] overflow-hidden bg-black">
          <div
            className={`relative w-full bg-muted/20 ${
              aspect === 'story' ? 'aspect-[9/16]' : 'aspect-square'
            }`}
          >
            {children}
          </div>
        </div>
      </div>
      {label && <p className="text-center text-xs text-muted-foreground mt-2">{label}</p>}
    </div>
  );
}

export default function MarketingPreviewPanel({
  previewMode,
  onPreviewModeChange,
  selectedGigId,
  selectedGigTitle,
  selectedPhotoUrl,
  businessName,
  storePath,
  storeUrl,
  goal,
  tone,
  generating,
  content,
  brandCardUrls,
}: Props) {
  const headline = selectedGigTitle || 'Mis servicios';
  const hasGig = !!selectedGigId;

  const liveBrandUrls = useMemo(() => {
    const base = {
      headline,
      businessName,
      gigId: selectedGigId || undefined,
      photoUrl: selectedPhotoUrl || undefined,
    };
    return {
      feed: buildBrandCardPath({ ...base, format: 'feed' }),
      story: buildBrandCardPath({ ...base, format: 'story' }),
    };
  }, [headline, businessName, selectedGigId, selectedPhotoUrl]);

  const previewCacheKey = encodeURIComponent(selectedPhotoUrl).slice(0, 24);
  const imageUrl =
    previewMode === 'story'
      ? brandCardUrls?.story ?? `${liveBrandUrls.story}&_p=${previewCacheKey}`
      : brandCardUrls?.feed ?? `${liveBrandUrls.feed}&_p=${previewCacheKey}`;

  const showInstagramLayout = previewMode === 'instagram' && content;
  const showWhatsAppLayout = previewMode === 'whatsapp' && content;
  const showImageOnly = previewMode === 'feed' || previewMode === 'story' || !content;

  return (
    <div className="bg-card border-2 border-border rounded-2xl p-5 space-y-4 lg:sticky lg:top-24 h-fit">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Eye className="h-5 w-5 text-orange-500" />
          Vista previa
        </h2>
        {generating && (
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Loader2 className="h-3 w-3 animate-spin" />
            Generando…
          </span>
        )}
      </div>

      <PreviewTabs
        previewMode={previewMode}
        onPreviewModeChange={onPreviewModeChange}
        hasContent={!!content}
      />

      {!hasGig && (
        <div className="rounded-xl border border-dashed border-border bg-muted/30 p-8 text-center">
          <ImageIcon className="h-10 w-10 text-muted-foreground/50 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">
            Selecciona un servicio y una foto para ver la vista previa con tu marca.
          </p>
        </div>
      )}

      {hasGig && !selectedPhotoUrl && (
        <div className="rounded-xl border border-dashed border-amber-300 bg-amber-50/80 dark:bg-amber-950/30 px-4 py-3 text-sm text-amber-900 dark:text-amber-200">
          Este servicio no tiene fotos. Sube imágenes en tu gig para usarlas en el marketing.
        </div>
      )}

      {hasGig && selectedPhotoUrl && (
        <>
          {showImageOnly && (
            <PhoneFrame
              aspect={previewMode === 'story' ? 'story' : 'square'}
              label={
                previewMode === 'story'
                  ? 'Vista previa story (1080×1920)'
                  : 'Vista previa feed (1080×1080)'
              }
            >
              {generating ? (
                <div className="absolute inset-0 flex items-center justify-center bg-muted/40">
                  <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
                </div>
              ) : (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={imageUrl}
                  alt="Vista previa con marca"
                  className="absolute inset-0 w-full h-full object-cover"
                />
              )}
            </PhoneFrame>
          )}

          {showInstagramLayout && (
            <div className="rounded-xl border border-border overflow-hidden bg-background">
              <div className="flex items-center gap-2 px-3 py-2 border-b border-border">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center text-white text-xs font-bold">
                  {businessName.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate">{businessName}</p>
                  <p className="text-[10px] text-muted-foreground">Publicación · Vista previa</p>
                </div>
                <Instagram className="h-4 w-4 text-pink-600 ml-auto shrink-0" />
              </div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={brandCardUrls?.feed ?? liveBrandUrls.feed}
                alt="Post Instagram"
                className="w-full aspect-square object-cover"
              />
              <div className="p-3 text-sm whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto">
                {content.social.instagram}
              </div>
            </div>
          )}

          {showWhatsAppLayout && (
            <div className="rounded-xl border border-border overflow-hidden bg-[#e5ddd5] dark:bg-zinc-900 p-4 min-h-[320px]">
              <div className="flex justify-end">
                <div className="max-w-[90%] rounded-lg rounded-tr-none bg-[#dcf8c6] dark:bg-emerald-900/60 px-3 py-2 shadow-sm">
                  <p className="text-sm whitespace-pre-wrap text-zinc-900 dark:text-zinc-100 leading-relaxed">
                    {content.social.whatsapp}
                  </p>
                  <p className="text-[10px] text-zinc-500 text-right mt-1">12:00 ✓✓</p>
                </div>
              </div>
            </div>
          )}

          <div className="rounded-lg bg-muted/40 px-3 py-2 text-xs space-y-1">
            <p>
              <span className="text-muted-foreground">Servicio:</span>{' '}
              <span className="font-medium">{headline}</span>
            </p>
            {goal.trim() && (
              <p>
                <span className="text-muted-foreground">Objetivo:</span>{' '}
                <span className="font-medium">{goal}</span>
              </p>
            )}
            <p>
              <span className="text-muted-foreground">Tono:</span>{' '}
              <span className="font-medium">{tone}</span>
            </p>
            {storeUrl && (
              <p className="truncate">
                <span className="text-muted-foreground">Tienda:</span>{' '}
                <span className="font-medium">{storeUrl.replace(/^https?:\/\//, '')}</span>
              </p>
            )}
          </div>

          {!content && !generating && (
            <p className="text-xs text-muted-foreground text-center">
              La imagen se actualiza al elegir un servicio. Pulsa{' '}
              <strong>Generar contenido</strong> para crear los textos de Instagram y WhatsApp.
            </p>
          )}

          {content && (
            <div className="flex items-center gap-2 pt-1 border-t border-border">
              <Image
                src={MARKETING_BRAND_LOGO_PATH}
                alt="OigaGIG"
                width={72}
                height={32}
                className="object-contain opacity-80"
              />
              <p className="text-[10px] text-muted-foreground">
                Incluye marca OigaGIG y enlace a tu tienda
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}