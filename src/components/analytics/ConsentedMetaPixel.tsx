'use client'

import { useEffect, useRef, useState } from 'react'
import Script from 'next/script'
import { usePathname } from 'next/navigation'
import { getAnalyticsConsent } from '@/lib/analytics-consent'
import { META_PIXEL_ID } from '@/lib/meta-pixel'

export default function ConsentedMetaPixel() {
  const pathname = usePathname()
  const [enabled, setEnabled] = useState(false)
  const lastTrackedPath = useRef<string | null>(null)

  useEffect(() => {
    const sync = () => {
      setEnabled(getAnalyticsConsent() === 'accepted' && !!META_PIXEL_ID)
    }

    sync()
    window.addEventListener('analytics-consent-changed', sync)
    return () => window.removeEventListener('analytics-consent-changed', sync)
  }, [])

  useEffect(() => {
    if (!enabled) {
      lastTrackedPath.current = null
      return
    }

    // The init snippet already sends PageView on first load.
    if (lastTrackedPath.current === null) {
      lastTrackedPath.current = pathname
      return
    }

    if (lastTrackedPath.current === pathname) return
    lastTrackedPath.current = pathname

    if (typeof window.fbq === 'function') {
      window.fbq('track', 'PageView')
    }
  }, [enabled, pathname])

  if (!enabled || !META_PIXEL_ID) return null

  return (
    <>
      <Script
        id="meta-pixel"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '${META_PIXEL_ID}');
            fbq('track', 'PageView');
          `,
        }}
      />
      <noscript>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          height={1}
          width={1}
          style={{ display: 'none' }}
          src={`https://www.facebook.com/tr?id=${META_PIXEL_ID}&ev=PageView&noscript=1`}
          alt=""
        />
      </noscript>
    </>
  )
}
