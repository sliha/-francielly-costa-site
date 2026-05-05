import type { Metadata, Viewport } from 'next'
import { Playfair_Display, Inter } from 'next/font/google'
import './globals.css'
import PublicShell from '@/components/layout/PublicShell'
import JsonLd, { localBusinessSchema, SITE_URL } from '@/components/JsonLd'

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
  weight: ['400', '500', '600', '700', '800', '900'],
})

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
  weight: ['300', '400', '500', '600', '700'],
})

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'Francielly Costa — Dermopigmentação Avançada em Braga | Microblading, Micropigmentação Labial',
    template: '%s | Francielly Costa Braga',
  },
  description:
    'Especialista com +8 anos de experiência e +2300 clientes. Microblading, micropigmentação labial, eyeliner, tricopigmentação e FiberBROWS em Braga. Agende online.',
  keywords: [
    'micropigmentação braga',
    'microblading braga',
    'dermopigmentação braga',
    'micropigmentação labial braga',
    'sobrancelhas perfeitas braga',
    'micropigmentação porto',
    'eyeliner permanente braga',
    'tricopigmentação braga',
    'fiberbrows portugal',
    'francielly costa',
  ],
  authors: [{ name: 'Francielly Costa', url: SITE_URL }],
  creator: 'Francielly Costa',
  publisher: 'Francielly Costa',
  manifest: '/manifest.json',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  alternates: {
    canonical: '/',
    languages: {
      'pt-PT': SITE_URL,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'pt_PT',
    url: SITE_URL,
    siteName: 'Francielly Costa — Dermopigmentação Avançada',
    title: 'Francielly Costa — Dermopigmentação Avançada em Braga',
    description:
      'Especialista com +8 anos de experiência e +2300 clientes. Microblading, micropigmentação labial, eyeliner, tricopigmentação e FiberBROWS em Braga.',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Francielly Costa — Dermopigmentação Avançada em Braga',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Francielly Costa — Dermopigmentação Avançada em Braga',
    description:
      'Especialista com +8 anos de experiência e +2300 clientes em Braga, Portugal.',
    images: ['/og-image.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'PLACEHOLDER_VERIFICATION_CODE',
  },
  category: 'beauty',
}

export const viewport: Viewport = {
  themeColor: '#B76E79',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-PT" className={`${playfair.variable} ${inter.variable}`}>
      <head>
        <link rel="canonical" href={SITE_URL} />
        <script dangerouslySetInnerHTML={{ __html: `window.addEventListener('error',function(e){if(e.message&&(e.message.includes('ChunkLoadError')||e.message.includes('Loading chunk'))){window.location.reload();}});` }} />
      </head>
      <body className="bg-cream font-inter text-text-primary antialiased">
        <JsonLd id="ld-localbusiness" data={localBusinessSchema} />
        <PublicShell>{children}</PublicShell>
      </body>
    </html>
  )
}
