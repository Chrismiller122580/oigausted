'use client';

import { useState } from 'react';
import { Share2, MessageCircle, Link2 } from 'lucide-react';
import { toast } from 'sonner';
import { copyToClipboard, shareOrCopy, whatsAppShareHref } from '@/lib/share';

interface ProfileShareProps {
  url: string;
  displayName: string;
}

export default function ProfileShare({ url, displayName }: ProfileShareProps) {
  const [copied, setCopied] = useState(false);
  const shareText = `Mira los servicios de ${displayName} en OigaGIG`;
  const whatsappHref = whatsAppShareHref(shareText, url);

  const handleCopy = async () => {
    const ok = await copyToClipboard(url);
    if (!ok) {
      toast.error('No se pudo copiar el enlace. Selecciónalo y cópialo manualmente.');
      return;
    }
    setCopied(true);
    toast.success('Enlace copiado al portapapeles');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    const result = await shareOrCopy({
      title: displayName,
      text: shareText,
      url,
    });
    if (result === 'shared') return;
    if (result === 'copied') {
      toast.success('Enlace copiado — pégalo donde quieras compartir');
      return;
    }
    if (result === 'cancelled') return;
    toast.error('No se pudo compartir. Prueba WhatsApp o copia el enlace.');
  };

  return (
    <div className="flex flex-col sm:flex-row flex-wrap justify-center gap-3 w-full max-w-lg mx-auto">
      <a
        href={whatsappHref}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-5 py-3 rounded-2xl border bg-background text-sm font-medium hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition !min-w-0"
      >
        <MessageCircle size={16} className="text-emerald-600" />
        WhatsApp
      </a>
      <button
        type="button"
        onClick={handleShare}
        className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-5 py-3 rounded-2xl border bg-background text-sm font-medium hover:bg-orange-50 dark:hover:bg-orange-950/30 transition !min-w-0"
      >
        <Share2 size={16} />
        Compartir perfil
      </button>
      <button
        type="button"
        onClick={handleCopy}
        className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-5 py-3 rounded-2xl border bg-background text-sm font-medium hover:bg-orange-50 dark:hover:bg-orange-950/30 transition !min-w-0"
      >
        <Link2 size={16} />
        {copied ? '✓ Copiado' : 'Copiar enlace'}
      </button>
    </div>
  );
}
