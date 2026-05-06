'use client'

import { useEffect, useState } from 'react'
import Script from 'next/script'
import { usePathname, useSearchParams } from 'next/navigation'

const GA_ID = process.env.NEXT_PUBLIC_GA_ID || 'G-GM7S2XXBZS'
const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID || '1370527093885024'
const GOOGLE_ADS_ID = process.env.NEXT_PUBLIC_GOOGLE_ADS_ID || 'AW-18049747314'
const STORAGE_KEY = 'cookie_consent'

function readConsent(): boolean {
  if (typeof window === 'undefined') return false
  try {
    return localStorage.getItem(STORAGE_KEY) === 'accepted'
  } catch {
    return false
  }
}

export default function Analytics() {
  const [hasConsent, setHasConsent] = useState(false)
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    setHasConsent(readConsent())
    const onConsent = () => setHasConsent(readConsent())
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) setHasConsent(readConsent())
    }
    window.addEventListener('cookie_consent_changed', onConsent)
    window.addEventListener('storage', onStorage)
    return () => {
      window.removeEventListener('cookie_consent_changed', onConsent)
      window.removeEventListener('storage', onStorage)
    }
  }, [])

  useEffect(() => {
    if (!hasConsent) return
    const url = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : '')
    if (typeof window.fbq === 'function') window.fbq('track', 'PageView')
    if (typeof window.gtag === 'function') {
      window.gtag('event', 'page_view', {
        page_path: url,
        page_location: window.location.href,
        page_title: document.title,
      })
    }
  }, [pathname, searchParams, hasConsent])

  if (!hasConsent) return null

  return (
    <>
      {GA_ID && (
        <>
          <Script
            id="ga-loader"
            strategy="afterInteractive"
            src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
          />
          <Script
            id="ga-init"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: `
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                window.gtag = gtag;
                gtag('js', new Date());
                gtag('config', '${GA_ID}', { anonymize_ip: true, send_page_view: true });
                gtag('config', '${GOOGLE_ADS_ID}');
              `,
            }}
          />
        </>
      )}
      {META_PIXEL_ID && (
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
              height="1"
              width="1"
              style={{ display: 'none' }}
              alt=""
              src={`https://www.facebook.com/tr?id=${META_PIXEL_ID}&ev=PageView&noscript=1`}
            />
          </noscript>
        </>
      )}
    </>
  )
}
