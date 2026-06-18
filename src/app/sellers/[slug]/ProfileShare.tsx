'use client';

import { useState } from 'react';
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
    } catch (err) {
      toast.error('No se pudo copiar el enlace');
    }
  };

  const shareText = `Mira los servicios de ${displayName} en Oigagig: ${url}`;
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`;

  return (
    <div className="flex flex-col sm:flex-row flex-wrap justify-center gap-3 w-full max-w-md mx-auto">
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-5 py-3 rounded-2xl border bg-background text-sm font-medium hover:bg-orange-50 dark:hover:bg-orange-950/30 transition !min-w-0"
      >
        Compartir por WhatsApp
      </a>
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
