'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';

interface LogoProps {
  size?: number;
  showText?: boolean;
  className?: string;
  linkClassName?: string;
}

export default function Logo({ 
  size = 36, 
  showText = false, 
  className = '', 
  linkClassName = '' 
}: LogoProps) {
  const [branding, setBranding] = useState<{
    siteName: string;
    logoUrl: string | null;
  }>({
    siteName: 'OigaUsted',
    logoUrl: null,
  });
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let mounted = true;
    fetch('/api/admin/config')
      .then((r) => r.json())
      .then((data) => {
        if (mounted && (data.siteName || data.logoUrl)) {
          setBranding({
            siteName: data.siteName || 'OigaUsted',
            logoUrl: data.logoUrl || null,
          });
        }
      })
      .catch(() => {})
      .finally(() => setLoaded(true));

    return () => { mounted = false; };
  }, []);

  const iconSize = size;
  const icon = branding.logoUrl ? (
    <img 
      src={branding.logoUrl} 
      alt={branding.siteName} 
      style={{ width: iconSize, height: iconSize }} 
      className="rounded-xl object-contain shadow-sm" 
    />
  ) : (
    <div 
      style={{ width: iconSize, height: iconSize }} 
      className="bg-orange-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-sm"
    >
      OU
    </div>
  );

  return (
    <Link 
      href="/" 
      className={`flex items-center gap-2.5 text-muted-foreground hover:text-foreground transition ${linkClassName} ${className}`}
    >
      {icon}
      {showText && (
        <span className="font-semibold tracking-tight text-base">
          {branding.siteName}
        </span>
      )}
    </Link>
  );
}
