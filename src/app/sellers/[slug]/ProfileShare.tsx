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
    <div className="flex flex-wrap justify-center gap-3">
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 px-5 py-2 rounded-2xl border bg-background text-sm font-medium hover:bg-orange-50 dark:hover:bg-orange-950/30 transition"
      >
        Compartir por WhatsApp
      </a>
      <button
        onClick={handleCopy}
        className="inline-flex items-center gap-2 px-5 py-2 rounded-2xl border bg-background text-sm font-medium hover:bg-orange-50 dark:hover:bg-orange-950/30 transition"
      >
        {copied ? '✓ Copiado' : 'Copiar enlace del perfil'}
      </button>
    </div>
  );
}
