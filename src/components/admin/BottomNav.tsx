'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Calendar, Heart, Clock, BarChart3 } from 'lucide-react'

const tabs = [
  { href: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/admin/agenda', icon: Calendar, label: 'Agenda' },
  { href: '/admin/acompanhamento', icon: Heart, label: 'Acomp.' },
  { href: '/admin/lista-espera', icon: Clock, label: 'Espera' },
  { href: '/admin/relatorio', icon: BarChart3, label: 'Relatório' },
]

export default function AdminBottomNav() {
  const pathname = usePathname()

  return (
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
                isActive
                  ? 'text-rose-gold'
                  : 'text-white/40 hover:text-white/70'
              }`}
            >
              <Icon size={20} strokeWidth={isActive ? 2.5 : 1.5} />
              <span className="text-[9px] font-medium">{label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
