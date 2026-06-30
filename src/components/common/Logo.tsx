'use client';

import React from 'react';
import Link from 'next/link';
import { usePlatformConfig } from '@/components/providers/PlatformConfigProvider';
import { sanitizeLogoUrl } from '@/lib/logo-url';

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
  const { config } = usePlatformConfig();
  const siteName = config?.siteName || 'Oigagig';
  const logoUrl = sanitizeLogoUrl(config?.logoUrl);

  const iconSize = size;
  const icon = logoUrl ? (
    <img 
      src={logoUrl} 
      alt={siteName} 
      style={{ width: iconSize, height: iconSize }} 
      className="rounded-xl object-contain shadow-sm" 
    />
  ) : (
    <div 
      style={{ width: iconSize, height: iconSize }} 
      className="bg-orange-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-sm"
    >
      OG
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
          {siteName}
        </span>
      )}
    </Link>
  );
}