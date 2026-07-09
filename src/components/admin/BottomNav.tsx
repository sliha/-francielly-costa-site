'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import {
  LayoutDashboard,
  Calendar,
  Heart,
  Clock,
  Menu,
  X,
  Users,
  MessageSquare,
  Scissors,
  Video,
  Shield,
  Gift,
  BarChart3,
  Image as ImageIcon,
  Award,
  BookOpen,
  Activity,
  Settings,
  LogOut,
} from 'lucide-react'
import { supabase } from '@/lib/supabase/client'

const tabs = [
  { href: '/admin', icon: LayoutDashboard, label: 'Início' },
  { href: '/admin/agenda', icon: Calendar, label: 'Agenda' },
  { href: '/admin/acompanhamento', icon: Heart, label: 'Acomp.' },
  { href: '/admin/lista-espera', icon: Clock, label: 'Espera' },
]

// Páginas que não cabem nos tabs principais — acessíveis pelo menu "Mais".
const maisItems = [
  { href: '/admin/clientes', icon: Users, label: 'Clientes' },
  { href: '/admin/contactos', icon: MessageSquare, label: 'Contactos' },
  { href: '/admin/servicos', icon: Scissors, label: 'Serviços & Preços' },
  { href: '/admin/consultas-virtuais', icon: Video, label: 'Consultas Virtuais' },
  { href: '/admin/consentimentos', icon: Shield, label: 'Consentimentos' },
  { href: '/admin/referencias', icon: Gift, label: 'Referências' },
  { href: '/admin/relatorio', icon: BarChart3, label: 'Relatório' },
  { href: '/admin/galeria', icon: ImageIcon, label: 'Galeria' },
  { href: '/admin/certificacoes', icon: Award, label: 'Certificações' },
  { href: '/admin/blog', icon: BookOpen, label: 'Blog' },
  { href: '/admin/diagnostico', icon: Activity, label: 'Diagnóstico' },
  { href: '/admin/definicoes', icon: Settings, label: 'Definições' },
]

export default function AdminBottomNav() {
  const pathname = usePathname()
  const router = useRouter()
  const [sheetOpen, setSheetOpen] = useState(false)
  const [alertasCount, setAlertasCount] = useState(0)

  useEffect(() => {
    const fetchCount = async () => {
      const { count } = await supabase
        .from('alertas')
        .select('*', { count: 'exact', head: true })
        .eq('resolvido', false)
      setAlertasCount(count ?? 0)
    }
    fetchCount()
  }, [])

  // Fechar o sheet ao navegar.
  useEffect(() => {
    setSheetOpen(false)
  }, [pathname])

  const isMaisActive = maisItems.some(
    (item) => pathname === item.href || pathname.startsWith(item.href + '/')
  )

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut()
      router.push('/admin/login')
    } catch {
      // ignore
    }
  }

  return (
    <>
      {/* Sheet "Mais" */}
      {sheetOpen && (
        <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-label="Mais opções">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setSheetOpen(false)}
          />
          <div className="absolute bottom-0 left-0 right-0 bg-[#1A1A1A] rounded-t-3xl border-t border-white/10 max-h-[80vh] overflow-y-auto pb-safe-bottom">
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/5 sticky top-0 bg-[#1A1A1A]">
              <h2 className="text-white font-semibold text-base">Mais opções</h2>
              <button
                onClick={() => setSheetOpen(false)}
                className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-white/60"
                aria-label="Fechar"
              >
                <X size={18} />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-3 p-4">
              {maisItems.map(({ href, icon: Icon, label }) => {
                const showBadge = href === '/admin/diagnostico' && alertasCount > 0
                return (
                  <Link
                    key={href}
                    href={href}
                    className="relative flex flex-col items-center gap-2 bg-white/5 hover:bg-white/10 rounded-2xl py-4 px-2 text-center transition-colors"
                  >
                    <Icon size={22} className="text-rose-gold" />
                    <span className="text-white/70 text-[11px] leading-tight">{label}</span>
                    {showBadge && (
                      <span className="absolute top-2 right-2 bg-red-500 text-white text-[9px] font-bold rounded-full min-w-[16px] h-[16px] flex items-center justify-center px-1">
                        {alertasCount > 9 ? '9+' : alertasCount}
                      </span>
                    )}
                  </Link>
                )
              })}
            </div>
            <div className="px-4 pb-4">
              <button
                onClick={handleLogout}
                className="flex items-center justify-center gap-2 w-full bg-white/5 hover:bg-white/10 text-white/60 text-sm rounded-2xl py-3 transition-colors"
              >
                <LogOut size={16} />
                Terminar Sessão
              </button>
            </div>
          </div>
        </div>
      )}

      <nav className="bg-[#1A1A1A] border-t border-white/10 px-2 pb-safe-bottom">
        <div className="flex items-center justify-around">
          {tabs.map(({ href, icon: Icon, label }) => {
            const isActive =
              href === '/admin'
                ? pathname === '/admin'
                : pathname === href || pathname.startsWith(href + '/')

            return (
              <Link
                key={href}
                href={href}
                className={`flex flex-col items-center gap-1 py-3 px-3 rounded-xl transition-colors ${
                  isActive ? 'text-rose-gold' : 'text-white/40 hover:text-white/70'
                }`}
              >
                <Icon size={20} strokeWidth={isActive ? 2.5 : 1.5} />
                <span className="text-[9px] font-medium">{label}</span>
              </Link>
            )
          })}

          {/* Tab "Mais" */}
          <button
            onClick={() => setSheetOpen(true)}
            className={`relative flex flex-col items-center gap-1 py-3 px-3 rounded-xl transition-colors ${
              isMaisActive || sheetOpen ? 'text-rose-gold' : 'text-white/40 hover:text-white/70'
            }`}
          >
            <Menu size={20} strokeWidth={isMaisActive || sheetOpen ? 2.5 : 1.5} />
            <span className="text-[9px] font-medium">Mais</span>
            {alertasCount > 0 && (
              <span className="absolute top-2 right-2 bg-red-500 rounded-full w-2 h-2" />
            )}
          </button>
        </div>
      </nav>
    </>
  )
}
