'use client'

import { usePathname } from 'next/navigation'
import dynamic from 'next/dynamic'
import Navbar from './Navbar'
import Footer from './Footer'
import CookieBanner from '@/components/CookieBanner'

// O chat completo só é necessário se/quando o utilizador interagir — carregá-lo
// fora do bundle inicial reduz o JS de primeiro carregamento em todas as páginas.
const ChatWidget = dynamic(() => import('@/components/chat/ChatWidget'), { ssr: false })

export default function PublicShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isAdmin = pathname?.startsWith('/admin')
  // A anamnese/consentimento é um fluxo focado (como o admin): sem navbar, rodapé,
  // chat nem banner de cookies, para reduzir distrações e desistências.
  const isFocado = pathname?.startsWith('/anamnese') || pathname?.startsWith('/consentimento')
  const semChrome = isAdmin || isFocado

  return (
    <>
      {!semChrome && <Navbar />}
      <main>{children}</main>
      {!semChrome && <Footer />}
      {!semChrome && <ChatWidget />}
      {!semChrome && <CookieBanner />}
    </>
  )
}
