import Link from 'next/link'
import { Home, ArrowLeft } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-cream flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        {/* 404 */}
        <div className="font-playfair font-bold text-[120px] leading-none gradient-text mb-4">
          404
        </div>
        <h1 className="font-playfair font-bold text-3xl text-text-primary mb-4">
          Página não encontrada
        </h1>
        <p className="text-text-secondary font-inter mb-8">
          A página que procura não existe ou foi movida. Explore o nosso site
          para descobrir os nossos serviços de dermopigmentação.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link href="/" className="btn-primary">
            <Home className="w-4 h-4" />
            Voltar ao Início
          </Link>
          <Link href="/servicos" className="btn-outline">
            <ArrowLeft className="w-4 h-4" />
            Ver Serviços
          </Link>
        </div>
      </div>
    </div>
  )
}
