'use client';

import React from 'react';
import Link from 'next/link';
import { usePlatformConfig } from '@/components/providers/PlatformConfigProvider';
import { BRAND_NAME, BRAND_LOGO_PATH, BRAND_NAV_LOGO_PATH } from '@/lib/brand';
import { sanitizeLogoUrl } from '@/lib/logo-url';

interface LogoProps {
  size?: number;
  showText?: boolean;
  /** compact: nav bars; hero: login/signup */
  variant?: 'compact' | 'hero';
  className?: string;
  linkClassName?: string;
}

export default function Logo({
  size = 36,
  showText = false,
  variant = 'compact',
  className = '',
  linkClassName = '',
}: LogoProps) {
  const { config } = usePlatformConfig();
  const siteName = config?.siteName || BRAND_NAME;
  const defaultLogo = variant === 'compact' ? BRAND_NAV_LOGO_PATH : BRAND_LOGO_PATH;
  const logoUrl = sanitizeLogoUrl(config?.logoUrl) ?? defaultLogo;

  const iconSize = size;
  const maxWidth = variant === 'compact' ? iconSize * 2.8 : iconSize * 2.4;

  const icon = (
    <img
      src={logoUrl}
      alt={siteName}
      style={{ height: iconSize, width: 'auto', maxWidth }}
      className="object-contain"
    />
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