'use client';

import { useState } from 'react';
import { Share2 } from 'lucide-react';
import { toast } from 'sonner';

interface ProfileShareProps {
  url: string;
  displayName: string;
}

export default function ProfileShare({ url, displayName }: ProfileShareProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success('Enlace copiado al portapapeles');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('No se pudo copiar el enlace');
    }
  };

  const handleShare = async () => {
    const shareText = `Mira los servicios de ${displayName} en OigaGIG`;
    try {
      if (navigator.share) {
        await navigator.share({ title: displayName, text: shareText, url });
        return;
      }
      await navigator.clipboard.writeText(`${shareText}: ${url}`);
      toast.success('Enlace copiado — pégalo donde quieras compartir');
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return;
      toast.error('No se pudo compartir el enlace');
    }
  };

  return (
    <div className="flex flex-col sm:flex-row flex-wrap justify-center gap-3 w-full max-w-md mx-auto">
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
        {copied ? '✓ Copiado' : 'Copiar enlace del perfil'}
      </button>
    </div>
  );
}