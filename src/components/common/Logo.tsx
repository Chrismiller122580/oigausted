'use client';

import React from 'react';
import Link from 'next/link';
import { usePlatformConfig } from '@/components/providers/PlatformConfigProvider';
import { BRAND_NAME, BRAND_ICON_PATH } from '@/lib/brand';
import { sanitizeLogoUrl } from '@/lib/logo-url';

interface LogoProps {
  size?: number;
  showText?: boolean;
  /** compact: nav bars; hero: login/signup (slightly larger radius) */
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
  const logoUrl = sanitizeLogoUrl(config?.logoUrl) ?? BRAND_ICON_PATH;

  const iconSize = size;
  const radius = variant === 'hero' ? 'rounded-2xl' : 'rounded-xl';

  const icon = (
    <img
      src={logoUrl}
      alt={siteName}
      style={{ width: iconSize, height: iconSize }}
      className={`${radius} object-contain shadow-sm`}
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