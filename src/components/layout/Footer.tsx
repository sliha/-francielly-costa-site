import Link from 'next/link'
import { Sparkles, MapPin, Phone, Mail, Clock, Facebook, Instagram } from 'lucide-react'

const navLinks = [
  { href: '/', label: 'Início' },
  { href: '/sobre', label: 'Sobre Mim' },
  { href: '/servicos', label: 'Serviços' },
  { href: '/galeria', label: 'Galeria' },
  { href: '/blog', label: 'Blog' },
  { href: '/contacto', label: 'Contacto' },
]

const services = [
  { href: '/servicos/microblading', label: 'Microblading' },
  { href: '/servicos/microshading', label: 'Microshading' },
  { href: '/servicos/eyeliner', label: 'Eyeliner Permanente' },
  { href: '/servicos/micropigmentacao-labial', label: 'Micropigmentação Labial' },
]

export default function Footer() {
  return (
    <footer className="bg-dark-bg text-white">
      {/* Main Footer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand Column */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 rounded-full bg-gradient-rose flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="font-playfair font-bold text-lg text-white leading-none">
                  Francielly Costa
                </p>
                <p className="text-xs tracking-widest uppercase text-golden font-inter mt-0.5">
                  Dermopigmentação
                </p>
              </div>
            </div>
            <p className="text-white/60 text-sm font-inter leading-relaxed mb-6">
              Especialista em Dermopigmentação Avançada em Braga, Portugal.
              Transformando beleza com precisão, arte e cuidado.
            </p>
            {/* Social */}
            <div className="flex items-center gap-3">
              <a
                href="https://www.facebook.com/Franciellycostaespecialista/"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-full border border-white/20 flex items-center justify-center hover:border-rose-gold hover:bg-rose-gold transition-all duration-300 group"
                aria-label="Facebook"
              >
                <Facebook className="w-4 h-4 text-white/60 group-hover:text-white" />
              </a>
              <a
                href="https://www.instagram.com/franciellycostamaster/"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-full border border-white/20 flex items-center justify-center hover:border-rose-gold hover:bg-rose-gold transition-all duration-300 group"
                aria-label="Instagram"
              >
                <Instagram className="w-4 h-4 text-white/60 group-hover:text-white" />
              </a>
            </div>
          </div>

          {/* Navigation */}
          <div>
            <h3 className="font-playfair font-semibold text-white mb-5 text-lg">
              Navegação
            </h3>
            <ul className="space-y-2.5">
              {navLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-white/60 hover:text-golden text-sm font-inter transition-colors duration-200 flex items-center gap-1.5 group"
                  >
                    <span className="w-0 h-0.5 bg-golden rounded-full transition-all duration-300 group-hover:w-3" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Services */}
          <div>
            <h3 className="font-playfair font-semibold text-white mb-5 text-lg">
              Serviços
            </h3>
            <ul className="space-y-2.5">
              {services.map((service) => (
                <li key={service.href}>
                  <Link
                    href={service.href}
                    className="text-white/60 hover:text-golden text-sm font-inter transition-colors duration-200 flex items-center gap-1.5 group"
                  >
                    <span className="w-0 h-0.5 bg-golden rounded-full transition-all duration-300 group-hover:w-3" />
                    {service.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-playfair font-semibold text-white mb-5 text-lg">
              Contacto
            </h3>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-rose-gold/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <MapPin className="w-3.5 h-3.5 text-rose-gold" />
                </div>
                <div>
                  <p className="text-white/60 text-sm font-inter leading-relaxed">
                    Av. Dr. António Palha 53<br />
                    4715-091 Braga, Portugal
                  </p>
                </div>
              </li>
              <li className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-rose-gold/20 flex items-center justify-center flex-shrink-0">
                  <Phone className="w-3.5 h-3.5 text-rose-gold" />
                </div>
                <div className="flex flex-col gap-0.5">
                  <a
                    href="tel:+351913112232"
                    className="text-white/60 hover:text-white text-sm font-inter transition-colors duration-200"
                  >
                    +351 913 112 232
                  </a>
                  <a
                    href="tel:+351917132116"
                    className="text-white/60 hover:text-white text-sm font-inter transition-colors duration-200"
                  >
                    +351 917 132 116 (WhatsApp)
                  </a>
                </div>
              </li>
              <li className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-rose-gold/20 flex items-center justify-center flex-shrink-0">
                  <Mail className="w-3.5 h-3.5 text-rose-gold" />
                </div>
                <a
                  href="mailto:geral@franciellycosta.com"
                  className="text-white/60 hover:text-white text-sm font-inter transition-colors duration-200"
                >
                  geral@franciellycosta.com
                </a>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-rose-gold/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Clock className="w-3.5 h-3.5 text-rose-gold" />
                </div>
                <div className="text-white/60 text-sm font-inter">
                  <p>Segunda – Sexta: 9h–18h</p>
                  <p>Sábado: 9h–13h</p>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-white/40 text-xs font-inter text-center sm:text-left">
              © {new Date().getFullYear()} Francielly Costa. Todos os direitos reservados.
            </p>
            <div className="flex items-center gap-4">
              <Link
                href="/privacidade"
                className="text-white/40 hover:text-white/70 text-xs font-inter transition-colors duration-200"
              >
                Política de Privacidade
              </Link>
              <span className="text-white/20">|</span>
              <Link
                href="/cookies"
                className="text-white/40 hover:text-white/70 text-xs font-inter transition-colors duration-200"
              >
                Política de Cookies
              </Link>
              <span className="text-white/20">|</span>
              <Link
                href="/termos"
                className="text-white/40 hover:text-white/70 text-xs font-inter transition-colors duration-200"
              >
                Termos e Condições
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
