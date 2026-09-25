'use client';

import Script from 'next/script';
import { usePathname } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { getMetaPixelId, trackMetaPageView } from '@/lib/meta-pixel';

export function MetaPixel() {
  const pixelId = getMetaPixelId();
  const pathname = usePathname();
  const skipFirstPath = useRef(true);

  useEffect(() => {
    if (!pixelId || pathname.startsWith('/invite')) return;
    if (skipFirstPath.current) {
      skipFirstPath.current = false;
      return;
    }
    trackMetaPageView();
  }, [pathname, pixelId]);

  if (!pixelId || pathname.startsWith('/invite')) return null;

  return (
    <>
      <Script id="meta-pixel" strategy="afterInteractive">
        {`
          !function(f,b,e,v,n,t,s)
          {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
          n.callMethod.apply(n,arguments):n.queue.push(arguments)};
          if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
          n.queue=[];t=b.createElement(e);t.async=!0;
          t.src=v;s=b.getElementsByTagName(e)[0];
          s.parentNode.insertBefore(t,s)}(window, document,'script',
          'https://connect.facebook.net/en_US/fbevents.js');
          fbq('init', '${pixelId}');
          fbq('track', 'PageView');
        `}
      </Script>
      <noscript>
        <img
          height={1}
          width={1}
          style={{ display: 'none' }}
          src={`https://www.facebook.com/tr?id=${pixelId}&ev=PageView&noscript=1`}
          alt=""
        />
      </noscript>
    </>
  );
}
