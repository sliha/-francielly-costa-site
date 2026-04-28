'use client'
import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import AdminBottomNav from '@/components/admin/BottomNav'
import AdminSideNav from '@/components/admin/SideNav'
import InstallBanner from '@/components/admin/InstallBanner'
import AdminSplashScreen from '@/components/admin/SplashScreen'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [showSplash, setShowSplash] = useState(true)
  const pathname = usePathname()
  const router = useRouter()
  const isLoginPage = pathname === '/admin/login'

  useEffect(() => {
    // Desregistar service workers antigos (causavam ChunkLoadError/CORS)
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then((regs) => {
        regs.forEach((r) => r.unregister())
      }).catch(() => {})
    }

    // Show splash for 1.5s on initial load
    const splashTimer = setTimeout(() => setShowSplash(false), 1500)

    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u)
      setLoading(false)
      if (!u && !isLoginPage) router.push('/admin/login')
      if (u && isLoginPage) router.push('/admin')
    })

    return () => {
      clearTimeout(splashTimer)
      unsub()
    }
  }, [isLoginPage, router])

  if (showSplash) return <AdminSplashScreen />

  if (loading) {
    return (
      <div className="min-h-screen bg-[#1A1A1A] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-rose-gold border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!user && !isLoginPage) return null

  if (isLoginPage) return <>{children}</>

  return (
    <div className="min-h-screen bg-[#0F0F0F] text-white flex">
      {/* Desktop sidebar — hidden on mobile */}
      <div className="hidden md:flex">
        <AdminSideNav />
      </div>

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-h-screen md:ml-64">
        <InstallBanner />
        <main className="flex-1 pb-20 md:pb-0">
          {children}
        </main>
      </div>

      {/* Mobile bottom navigation — hidden on desktop */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50">
        <AdminBottomNav />
      </div>
    </div>
  )
}
