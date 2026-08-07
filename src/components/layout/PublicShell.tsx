'use client'

import { useState } from 'react'
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

  // A banner de cookies e o botão do chat são fixed e partilham a camada do menu
  // mobile; enquanto o menu está aberto escondemo-los para não taparem os CTAs
  // (banner) nem se sobreporem ao painel (chat).
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <>
      {!semChrome && <Navbar onMobileOpenChange={setMobileMenuOpen} />}
      <main>{children}</main>
      {!semChrome && <Footer />}
      {!semChrome && <ChatWidget hidden={mobileMenuOpen} />}
      {!semChrome && <CookieBanner hidden={mobileMenuOpen} />}
    </>
  )
}
