import type { Metadata, Viewport } from 'next'
import { Playfair_Display, Inter } from 'next/font/google'
import './globals.css'
import PublicShell from '@/components/layout/PublicShell'

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
  title: {
    default: 'Francielly Costa | Dermopigmentação Avançada em Braga',
    template: '%s | Francielly Costa',
  },
  description:
    'Especialista em Dermopigmentação em Braga, Portugal. Microblading, Microshading, Eyeliner e Micropigmentação Labial. Resultados naturais e duradouros.',
  keywords: [
    'dermopigmentação',
    'microblading',
    'microshading',
    'eyeliner permanente',
    'micropigmentação labial',
    'Braga',
    'Portugal',
    'sobrancelhas',
    'PMU',
  ],
  authors: [{ name: 'Francielly Costa' }],
  creator: 'Francielly Costa',
  publisher: 'Francielly Costa',
  manifest: '/manifest.json',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://franciellycosta.com'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'pt_PT',
    url: 'https://franciellycosta.com',
    siteName: 'Francielly Costa',
    title: 'Francielly Costa | Dermopigmentação Avançada em Braga',
    description:
      'Especialista em Dermopigmentação em Braga, Portugal. Microblading, Microshading, Eyeliner e Micropigmentação Labial.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Francielly Costa | Dermopigmentação Avançada em Braga',
    description:
      'Especialista em Dermopigmentação em Braga, Portugal.',
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
}

export const viewport: Viewport = {
  themeColor: '#B76E79',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt" className={`${playfair.variable} ${inter.variable}`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: `window.addEventListener('error',function(e){if(e.message&&(e.message.includes('ChunkLoadError')||e.message.includes('Loading chunk'))){window.location.reload();}});` }} />
      </head>
      <body className="bg-cream font-inter text-text-primary antialiased">
        <PublicShell>{children}</PublicShell>
      </body>
    </html>
  )
}
