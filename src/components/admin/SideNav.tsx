'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard,
  Calendar,
  Image,
  Settings,
  LogOut,
  BookOpen,
  Users,
  PlusCircle,
  Heart,
  Clock,
  BarChart3,
  Sun,
  Moon,
  Shield,
  Gift,
  Video,
  Sparkles,
  Scissors,
  MessageSquare,
  Award,
  Activity,
} from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'

const navItems = [
  { href: '/admin', icon: LayoutDashboard, label: 'Dashboard', exact: true },
  { href: '/admin/agenda', icon: Calendar, label: 'Agenda', exact: false },
  { href: '/admin/clientes', icon: Users, label: 'Clientes', exact: false },
  { href: '/admin/contactos', icon: MessageSquare, label: 'Contactos', exact: false },
  { href: '/admin/acompanhamento', icon: Heart, label: 'Acompanhamento', exact: false },
  { href: '/admin/lista-espera', icon: Clock, label: 'Lista de Espera', exact: false },
  { href: '/admin/fiberbrows-waitlist', icon: Sparkles, label: 'FiberBROWS Waitlist', exact: false },
  { href: '/admin/servicos', icon: Scissors, label: 'Serviços & Preços', exact: false },
  { href: '/admin/consultas-virtuais', icon: Video, label: 'Consultas Virtuais', exact: false },
  { href: '/admin/consentimentos', icon: Shield, label: 'Consentimentos', exact: false },
  { href: '/admin/referencias', icon: Gift, label: 'Referências', exact: false },
  { href: '/admin/relatorio', icon: BarChart3, label: 'Relatório', exact: false },
  { href: '/admin/galeria', icon: Image, label: 'Galeria', exact: false },
  { href: '/admin/certificacoes', icon: Award, label: 'Certificações', exact: false },
  { href: '/admin/blog', icon: BookOpen, label: 'Blog', exact: false },
  { href: '/admin/diagnostico', icon: Activity, label: 'Diagnóstico', exact: false },
  { href: '/admin/definicoes', icon: Settings, label: 'Definições', exact: false },
]

export default function AdminSideNav() {
  const pathname = usePathname()
  const router = useRouter()
  const [darkMode, setDarkMode] = useState(true)
  const [alertasCount, setAlertasCount] = useState(0)

  useEffect(() => {
    const read = () => {
      const saved = localStorage.getItem('admin_theme')
      setDarkMode(saved !== 'light')
    }
    read()
    const onCustom = () => read()
    window.addEventListener('admin-theme-change', onCustom)
    return () => window.removeEventListener('admin-theme-change', onCustom)
  }, [])

  useEffect(() => {
    const fetchCount = async () => {
      const { count, error } = await supabase
        .from('alertas')
        .select('*', { count: 'exact', head: true })
        .eq('resolvido', false)
      if (error) setAlertasCount(0)
      else setAlertasCount(count ?? 0)
    }
    fetchCount()

    const ch = supabase
      .channel('sidenav-alertas')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'alertas' },
        () => fetchCount(),
      )
      .subscribe()

    return () => {
      supabase.removeChannel(ch)
    }
  }, [])

  const toggleDarkMode = () => {
    const novo = !darkMode
    setDarkMode(novo)
    localStorage.setItem('admin_theme', novo ? 'dark' : 'light')
    window.dispatchEvent(new Event('admin-theme-change'))
  }

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut()
      router.push('/admin/login')
    } catch {
      // Silently handle logout errors
    }
  }

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-[#111111] border-r border-white/5 flex flex-col z-40">
      {/* Brand header */}
      <div className="p-6 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-gold to-golden flex items-center justify-center flex-shrink-0">
            <span className="text-white font-playfair font-bold text-sm">FC</span>
          </div>
          <div>
            <p className="text-white font-semibold text-sm">FC Admin</p>
            <p className="text-white/40 text-xs">Francielly Costa</p>
          </div>
        </div>
      </div>

      {/* Quick action — Nova Marcação */}
      <div className="px-4 py-3">
        <Link
          href="/admin/agenda/nova"
          className="flex items-center gap-2 bg-rose-gold text-white rounded-xl px-4 py-2.5 text-sm font-medium hover:bg-opacity-90 transition-colors w-full justify-center"
        >
          <PlusCircle size={16} />
          Nova Marcação
        </Link>
      </div>

      {/* Navigation links */}
      <nav className="flex-1 px-3 py-2 overflow-y-auto">
        {navItems.map(({ href, icon: Icon, label, exact }) => {
          const isActive = exact
            ? pathname === href
            : pathname === href || pathname.startsWith(href + '/')

          const showAlertBadge = href === '/admin/diagnostico' && alertasCount > 0
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl mb-1 transition-colors text-sm relative ${
                isActive
                  ? 'bg-rose-gold/10 text-rose-gold font-medium'
                  : 'text-white/50 hover:text-white/80 hover:bg-white/5'
              }`}
            >
              <Icon size={18} strokeWidth={isActive ? 2 : 1.5} />
              <span className="flex-1">{label}</span>
              {showAlertBadge && (
                <span className="ml-auto bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                  {alertasCount > 9 ? '9+' : alertasCount}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Footer: dark mode toggle + logout */}
      <div className="p-4 border-t border-white/5 space-y-1">
        <button
          onClick={toggleDarkMode}
          className="flex items-center gap-3 text-white/40 hover:text-white/70 text-sm px-3 py-2 rounded-xl hover:bg-white/5 transition-colors w-full"
        >
          {darkMode ? <Sun size={16} /> : <Moon size={16} />}
          {darkMode ? 'Modo Claro' : 'Modo Escuro'}
        </button>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 text-white/40 hover:text-white/70 text-sm px-3 py-2 rounded-xl hover:bg-white/5 transition-colors w-full"
        >
          <LogOut size={16} />
          Terminar Sessão
        </button>
      </div>
    </aside>
  )
}
