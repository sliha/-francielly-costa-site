'use client'
import { useState } from 'react'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, Lock, Mail } from 'lucide-react'
import Link from 'next/link'

export default function AdminLogin() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await signInWithEmailAndPassword(auth, email, password)
      router.push('/admin')
    } catch {
      setError('Email ou palavra-passe incorretos.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0F0F0F] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header / Logo */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-rose-gold to-golden flex items-center justify-center mx-auto mb-4 shadow-xl">
            <span className="text-white font-playfair text-3xl font-bold">FC</span>
          </div>
          <h1 className="text-white font-playfair text-2xl font-semibold">
            FC Admin
          </h1>
          <p className="text-white/40 text-sm mt-1">
            Francielly Costa — Painel de Administração
          </p>
        </div>

        {/* Login form */}
        <form
          onSubmit={handleSubmit}
          className="bg-[#1A1A1A] rounded-2xl p-8 border border-white/5 shadow-2xl"
        >
          <div className="space-y-4">
            {/* Email */}
            <div>
              <label className="text-white/60 text-sm mb-1.5 block">
                Email
              </label>
              <div className="relative">
                <Mail
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30"
                />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="geral@franciellycosta.com"
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-3 text-white placeholder:text-white/20 text-sm focus:outline-none focus:border-rose-gold/50 transition-colors"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="text-white/60 text-sm mb-1.5 block">
                Palavra-passe
              </label>
              <div className="relative">
                <Lock
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30"
                />
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-10 py-3 text-white placeholder:text-white/20 text-sm focus:outline-none focus:border-rose-gold/50 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                  aria-label={showPw ? 'Ocultar palavra-passe' : 'Mostrar palavra-passe'}
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Error message */}
            {error && (
              <p className="text-red-400 text-sm bg-red-400/10 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-rose-gold to-golden text-white font-semibold py-3 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
            >
              {loading && (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              )}
              {loading ? 'A entrar...' : 'Entrar'}
            </button>
          </div>
        </form>

        {/* Back to public site */}
        <p className="text-center mt-6">
          <Link
            href="/"
            className="text-white/30 hover:text-white/50 text-sm transition-colors"
          >
            ← Voltar ao site
          </Link>
        </p>
      </div>
    </div>
  )
}
