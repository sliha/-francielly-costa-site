import type { Metadata } from 'next'
import Link from 'next/link'
import GerirCookiesButton from '@/components/GerirCookiesButton'

export const metadata: Metadata = {
  title: 'Política de Cookies',
  description:
    'Informação sobre os cookies e tecnologias semelhantes utilizados no site da Francielly Costa e como gerir as suas preferências.',
  alternates: { canonical: '/cookies' },
  robots: { index: true, follow: true },
}

export default function CookiesPage() {
  return (
    <div className="pt-20 min-h-screen bg-cream">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h1 className="font-playfair font-bold text-4xl text-text-primary mb-2">
          Política de Cookies
        </h1>
        <p className="text-text-muted text-sm font-inter mb-10">
          Última atualização: junho de 2026
        </p>

        <div className="prose prose-sm max-w-none text-text-secondary font-inter space-y-8">
          <section>
            <h2 className="font-playfair font-semibold text-xl text-text-primary mb-3">
              O que são cookies?
            </h2>
            <p className="leading-relaxed">
              Os cookies são pequenos ficheiros de texto armazenados no seu dispositivo quando
              visita um website. Utilizamos também tecnologias semelhantes (como o armazenamento
              local do navegador). Servem para o site funcionar, memorizar preferências e — apenas
              com o seu consentimento — medir a utilização e o desempenho de campanhas.
            </p>
          </section>

          <section>
            <h2 className="font-playfair font-semibold text-xl text-text-primary mb-3">
              Que cookies utilizamos?
            </h2>
            <div className="space-y-4">
              <div className="bg-white rounded-2xl p-5 border border-cream-dark">
                <h3 className="font-semibold text-text-primary mb-1">
                  Estritamente necessários <span className="text-text-muted font-normal">(sempre ativos)</span>
                </h3>
                <p className="text-sm leading-relaxed">
                  Indispensáveis ao funcionamento do site. Incluem a memorização da sua escolha de
                  cookies (<code>cookie_consent</code>) e o histórico temporário da conversa com a
                  assistente Sofia (guardado apenas no seu navegador, durante a sessão). Não podem
                  ser desativados.
                </p>
              </div>
              <div className="bg-white rounded-2xl p-5 border border-cream-dark">
                <h3 className="font-semibold text-text-primary mb-1">
                  Estatísticas <span className="text-text-muted font-normal">(apenas com consentimento)</span>
                </h3>
                <p className="text-sm leading-relaxed">
                  <strong>Google Analytics</strong> (cookies <code>_ga</code>, <code>_ga_*</code>)
                  — ajuda-nos a perceber como o site é utilizado, com IP anonimizado. Conservação
                  até 14 meses.
                </p>
              </div>
              <div className="bg-white rounded-2xl p-5 border border-cream-dark">
                <h3 className="font-semibold text-text-primary mb-1">
                  Marketing <span className="text-text-muted font-normal">(apenas com consentimento)</span>
                </h3>
                <p className="text-sm leading-relaxed">
                  <strong>Meta Pixel</strong> (cookie <code>_fbp</code>) e{' '}
                  <strong>Google Ads</strong> (cookies <code>_gcl_*</code>) — medem o desempenho
                  das nossas campanhas publicitárias. Sem o seu consentimento, estas ferramentas
                  não são carregadas.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="font-playfair font-semibold text-xl text-text-primary mb-3">
              Gerir as suas preferências
            </h2>
            <p className="leading-relaxed mb-4">
              Pode aceitar ou recusar os cookies não essenciais no banner apresentado na primeira
              visita — e pode <strong>alterar a sua escolha a qualquer momento</strong> com o botão
              abaixo. Recusar cookies não afeta a navegação no site.
            </p>
            <GerirCookiesButton />
            <p className="leading-relaxed mt-4 text-sm">
              Pode ainda configurar o seu navegador para bloquear ou eliminar cookies. Consulte as
              instruções do seu navegador para mais informações.
            </p>
          </section>

          <section>
            <h2 className="font-playfair font-semibold text-xl text-text-primary mb-3">
              Contacto
            </h2>
            <p className="leading-relaxed">
              Para questões sobre cookies ou privacidade, contacte-nos em{' '}
              <a
                href="mailto:geral@franciellycosta.pt"
                className="text-rose-gold hover:underline"
              >
                geral@franciellycosta.pt
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
