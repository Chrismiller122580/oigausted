'use client';

import React from 'react';
import Link from 'next/link';
import { usePlatformConfig } from '@/components/providers/PlatformConfigProvider';
import { BRAND_NAME, BRAND_NAV_LOGO_PATH, isSquareBrandLogo } from '@/lib/brand';
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
  // Default to the square OU app mark everywhere for now; admin logoUrl can override.
  const defaultLogoPath = BRAND_NAV_LOGO_PATH;
  const logoUrl = sanitizeLogoUrl(config?.logoUrl) ?? defaultLogoPath;

  const iconSize = size;
  const square = isSquareBrandLogo(logoUrl);

  const icon = (
    <img
      src={logoUrl}
      alt={BRAND_NAME}
      style={
        square
          ? { width: iconSize, height: iconSize }
          : { height: iconSize, width: 'auto', maxWidth: variant === 'hero' ? iconSize * 2.4 : iconSize * 2.5 }
      }
      className={square ? 'rounded-xl object-contain shadow-sm' : 'object-contain'}
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