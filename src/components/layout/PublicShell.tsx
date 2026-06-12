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

  return (
    <>
      {!isAdmin && <Navbar />}
      <main>{children}</main>
      {!isAdmin && <Footer />}
      {!isAdmin && <ChatWidget />}
      {!isAdmin && <CookieBanner />}
    </>
  )
}
