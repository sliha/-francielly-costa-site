'use client'

import { useEffect, useState } from 'react'
import Script from 'next/script'
import { usePathname, useSearchParams } from 'next/navigation'
import { readConsent, CONSENT_EVENT, CONSENT_STORAGE_KEY, type CookieConsent } from '@/lib/consent'

const GA_ID = process.env.NEXT_PUBLIC_GA_ID || 'G-GM7S2XXBZS'
const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID || '1370527093885024'
const GOOGLE_ADS_ID = process.env.NEXT_PUBLIC_GOOGLE_ADS_ID || 'AW-18049747314'
const METRICOOL_HASH = process.env.NEXT_PUBLIC_METRICOOL_HASH || '103e1418e76e4353b021093bb6841c8'

const NO_CONSENT: CookieConsent = { analytics: false, marketing: false }

export default function Analytics() {
  const [consent, setConsent] = useState<CookieConsent>(NO_CONSENT)
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    const sync = () => setConsent(readConsent() ?? NO_CONSENT)
    sync()
    const onStorage = (e: StorageEvent) => {
      if (e.key === CONSENT_STORAGE_KEY) sync()
    }
    window.addEventListener(CONSENT_EVENT, sync)
    window.addEventListener('storage', onStorage)
    return () => {
      window.removeEventListener(CONSENT_EVENT, sync)
      window.removeEventListener('storage', onStorage)
    }
  }, [])

  useEffect(() => {
    if (!consent.analytics && !consent.marketing) return
    const url = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : '')
    if (consent.marketing && typeof window.fbq === 'function') window.fbq('track', 'PageView')
    if (consent.analytics && typeof window.gtag === 'function') {
      window.gtag('event', 'page_view', {
        page_path: url,
        page_location: window.location.href,
        page_title: document.title,
      })
    }
  }, [pathname, searchParams, consent])

  if (!consent.analytics && !consent.marketing) return null

  return (
    <>
      {GA_ID && consent.analytics && (
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
                // Google Consent Mode v2 — obrigatório para anunciantes no EEE.
                // Os scripts só montam após consentimento, por isso refletimos
                // exatamente as categorias que o utilizador aceitou.
                gtag('consent', 'default', {
                  ad_storage: '${consent.marketing ? 'granted' : 'denied'}',
                  ad_user_data: '${consent.marketing ? 'granted' : 'denied'}',
                  ad_personalization: '${consent.marketing ? 'granted' : 'denied'}',
                  analytics_storage: 'granted'
                });
                gtag('js', new Date());
                gtag('config', '${GA_ID}', { anonymize_ip: true, send_page_view: true });
                ${consent.marketing ? `gtag('config', '${GOOGLE_ADS_ID}');` : ''}
              `,
            }}
          />
        </>
      )}
      {META_PIXEL_ID && consent.marketing && (
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
      {METRICOOL_HASH && consent.analytics && (
        <Script
          id="metricool-tracker"
          strategy="afterInteractive"
          src="https://tracker.metricool.com/resources/be.js"
          onLoad={() => {
            if (typeof window.beTracker?.t === 'function') {
              window.beTracker.t({ hash: METRICOOL_HASH })
            }
          }}
        />
      )}
    </>
  )
}
