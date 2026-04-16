import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Política de Cookies — Francielly Costa',
  description: 'Informação sobre a utilização de cookies no site da Francielly Costa.',
}

export default function CookiesPage() {
  return (
    <div className="pt-20 min-h-screen bg-cream">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h1 className="font-playfair font-bold text-4xl text-text-primary mb-2">
          Política de Cookies
        </h1>
        <p className="text-text-muted text-sm font-inter mb-10">
          Última atualização: abril 2026
        </p>

        <div className="prose prose-sm max-w-none text-text-secondary font-inter space-y-8">
          <section>
            <h2 className="font-playfair font-semibold text-xl text-text-primary mb-3">
              O que são cookies?
            </h2>
            <p className="leading-relaxed">
              Os cookies são pequenos ficheiros de texto que são armazenados no seu dispositivo
              quando visita um website. Permitem que o site memorize as suas preferências e
              melhore a sua experiência de navegação.
            </p>
          </section>

          <section>
            <h2 className="font-playfair font-semibold text-xl text-text-primary mb-3">
              Que cookies utilizamos?
            </h2>
            <div className="space-y-4">
              <div className="bg-white rounded-2xl p-5 border border-cream-dark">
                <h3 className="font-semibold text-text-primary mb-1">Cookies Essenciais</h3>
                <p className="text-sm leading-relaxed">
                  Necessários para o funcionamento do site. Incluem cookies de sessão, preferências
                  de idioma e consentimento de cookies. Não podem ser desativados.
                </p>
              </div>
              <div className="bg-white rounded-2xl p-5 border border-cream-dark">
                <h3 className="font-semibold text-text-primary mb-1">Cookies de Desempenho</h3>
                <p className="text-sm leading-relaxed">
                  Ajudam-nos a compreender como os visitantes interagem com o site, permitindo-nos
                  melhorar a experiência. Utilizamos o Google Analytics (apenas com o seu
                  consentimento).
                </p>
              </div>
              <div className="bg-white rounded-2xl p-5 border border-cream-dark">
                <h3 className="font-semibold text-text-primary mb-1">Cookies de Funcionalidade</h3>
                <p className="text-sm leading-relaxed">
                  Permitem que o site memorize as suas preferências (ex.: histórico de conversa
                  com a assistente Sofia).
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="font-playfair font-semibold text-xl text-text-primary mb-3">
              Como gerir os cookies?
            </h2>
            <p className="leading-relaxed">
              Pode aceitar ou recusar cookies não essenciais através do banner que aparece quando
              visita o site pela primeira vez. Para alterar a sua preferência, limpe os dados de
              navegação do seu browser e volte a visitar o site.
            </p>
            <p className="leading-relaxed mt-3">
              Também pode configurar o seu browser para recusar cookies. Consulte as instruções
              do seu browser para mais informações.
            </p>
          </section>

          <section>
            <h2 className="font-playfair font-semibold text-xl text-text-primary mb-3">
              Contacto
            </h2>
            <p className="leading-relaxed">
              Para questões sobre cookies ou privacidade, contacte-nos em{' '}
              <a
                href="mailto:geral@franciellycosta.com"
                className="text-rose-gold hover:underline"
              >
                geral@franciellycosta.com
              </a>
              .
            </p>
          </section>

          <div className="pt-4 border-t border-cream-dark flex flex-wrap gap-4 text-sm">
            <Link href="/privacidade" className="text-rose-gold hover:underline">
              Política de Privacidade
            </Link>
            <Link href="/termos" className="text-rose-gold hover:underline">
              Termos e Condições
            </Link>
            <Link href="/" className="text-text-muted hover:text-text-primary">
              ← Voltar ao início
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
