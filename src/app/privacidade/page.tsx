import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Política de Privacidade',
  description:
    'Política de Privacidade de Francielly Costa — como recolhemos, utilizamos e protegemos os seus dados pessoais, em conformidade com o RGPD.',
  alternates: { canonical: '/privacidade' },
  robots: { index: true, follow: true },
}

function H2({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="font-playfair font-bold text-2xl text-text-primary mt-10 mb-3">{children}</h2>
  )
}

function H3({ children }: { children: React.ReactNode }) {
  return <h3 className="font-semibold text-lg text-text-primary mt-6 mb-2">{children}</h3>
}

export default function Privacidade() {
  return (
    <div className="pt-20 min-h-screen bg-cream">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-text-secondary hover:text-rose-gold transition-colors duration-200 mb-8 font-inter text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar ao Início
        </Link>

        <h1 className="font-playfair font-bold text-4xl text-text-primary mb-2">
          Política de Privacidade
        </h1>
        <p className="text-text-muted text-sm font-inter mb-8">Última atualização: junho de 2026</p>
        <div className="divider-rose-left mb-8" />

        <div className="prose prose-lg max-w-none space-y-4 text-text-secondary font-inter leading-relaxed">
          <p>
            A presente Política de Privacidade descreve como os seus dados pessoais são recolhidos,
            utilizados e protegidos quando visita o site <strong>franciellycosta.pt</strong> ou
            utiliza os nossos serviços, em conformidade com o Regulamento (UE) 2016/679 (RGPD) e a
            Lei n.º 58/2019.
          </p>

          <H2>1. Responsável pelo Tratamento</H2>
          <p>
            <strong>Francielly Costa — Dermopigmentação Avançada</strong>
            <br />
            Av. Dr. António Palha 53, 4715-091 Braga, Portugal
            <br />
            Email:{' '}
            <a href="mailto:geral@franciellycosta.pt" className="text-rose-gold hover:underline">
              geral@franciellycosta.pt
            </a>{' '}
            · Telefone: +351 913 112 232
          </p>

          <H2>2. Dados que Recolhemos e Finalidades</H2>

          <H3>a) Agendamentos e consultas virtuais</H3>
          <p>
            Nome, telefone, email, serviço pretendido, data/hora e notas que decida partilhar.
            Finalidade: gestão da sua marcação, confirmações por email e contacto relacionado com o
            serviço. <em>Base legal: execução de contrato (art. 6.º, n.º 1, al. b) RGPD).</em>
          </p>

          <H3>b) Formulário de consentimento e anamnese (dados de saúde)</H3>
          <p>
            Antes de um procedimento de dermopigmentação pedimos informações de saúde (alergias,
            medicação, condições clínicas relevantes) e a sua assinatura digital. Estes dados são
            <strong> categorias especiais de dados (art. 9.º RGPD)</strong> e só são tratados com o
            seu <strong>consentimento explícito</strong>, para avaliar contraindicações e garantir a
            segurança do procedimento. São conservados de forma confidencial e nunca utilizados
            para outra finalidade.
          </p>

          <H3>c) Formulário de contacto, lista de espera e referências</H3>
          <p>
            Nome, email, telefone e mensagem. Finalidade: responder ao seu pedido ou avisá-la quando
            o serviço estiver disponível. <em>Base legal: consentimento e diligências
            pré-contratuais.</em>
          </p>

          <H3>d) Pagamentos</H3>
          <p>
            Caso sejam efetuados pagamentos online, são processados pela <strong>Stripe</strong>. Os dados do
            cartão são introduzidos diretamente na plataforma da Stripe e{' '}
            <strong>nunca passam pelos nossos servidores nem são por nós armazenados</strong>.
          </p>

          <H3>e) Assistente virtual «Sofia» (inteligência artificial)</H3>
          <p>
            As mensagens que escreve no chat são processadas pela <strong>Anthropic</strong>{' '}
            (fornecedor do modelo de IA) para gerar respostas. O histórico fica guardado apenas no
            seu navegador durante a sessão. Não introduza dados de saúde ou outros dados sensíveis
            no chat. <em>Base legal: consentimento (utilização voluntária do chat).</em>
          </p>

          <H3>f) Simulador de resultados (fotografia)</H3>
          <p>
            Se utilizar o simulador, a fotografia que envia é analisada por um serviço de IA para
            gerar uma descrição personalizada e é{' '}
            <strong>processada de forma transitória — não é guardada nos nossos sistemas</strong>.
            A utilização é voluntária. <em>Base legal: consentimento explícito, manifestado pelo
            envio da fotografia.</em>
          </p>

          <H3>g) Fotografias de acompanhamento e portefólio</H3>
          <p>
            As fotografias de evolução que carregar na área de acompanhamento destinam-se
            exclusivamente ao seu acompanhamento clínico. Fotografias antes/depois só são
            publicadas na galeria ou redes sociais com o seu{' '}
            <strong>consentimento prévio, expresso e por escrito</strong>, que pode retirar a
            qualquer momento.
          </p>

          <H3>h) Estatísticas e marketing (cookies)</H3>
          <p>
            Com o seu consentimento, utilizamos Google Analytics, Meta Pixel e Google Ads para
            medir a utilização do site e o desempenho de campanhas. Sem consentimento, nenhuma
            destas ferramentas é carregada. Consulte a{' '}
            <Link href="/cookies" className="text-rose-gold hover:underline">
              Política de Cookies
            </Link>
            .
          </p>

          <H2>3. Subcontratantes e Destinatários</H2>
          <p>Recorremos a prestadores que tratam dados por nossa conta, ao abrigo de contratos de
            subcontratação conformes com o art. 28.º RGPD:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li><strong>Supabase</strong> — base de dados e armazenamento;</li>
            <li><strong>Vercel</strong> — alojamento do site;</li>
            <li><strong>Stripe</strong> — processamento de pagamentos;</li>
            <li><strong>Resend</strong> — envio de emails transacionais;</li>
            <li><strong>Google</strong> — calendário/Meet (consultas virtuais), Analytics e Ads;</li>
            <li><strong>Anthropic</strong> — assistente virtual e simulador (IA);</li>
            <li><strong>Meta</strong> — medição de campanhas (Pixel), apenas com consentimento.</li>
          </ul>
          <p>
            Alguns destes prestadores estão estabelecidos fora do Espaço Económico Europeu
            (nomeadamente nos EUA). Nesses casos, as transferências assentam em decisões de
            adequação (EU–US Data Privacy Framework) e/ou cláusulas contratuais-tipo aprovadas pela
            Comissão Europeia. Não vendemos nem cedemos os seus dados a terceiros para fins
            próprios.
          </p>

          <H2>4. Prazos de Conservação</H2>
          <ul className="list-disc pl-6 space-y-1">
            <li>Dados de agendamento e ficha de cliente — durante a relação comercial e até 5 anos
              após o último contacto;</li>
            <li>Formulários de consentimento/anamnese — 5 anos após o procedimento, para garantia
              de segurança clínica e defesa em caso de litígio;</li>
            <li>Dados de faturação — 10 anos (obrigação legal fiscal);</li>
            <li>Mensagens de contacto — até 2 anos;</li>
            <li>Fotografia do simulador — não é conservada;</li>
            <li>Dados de analytics — até 14 meses (Google Analytics).</li>
          </ul>

          <H2>5. Os Seus Direitos</H2>
          <p>
            Pode, a qualquer momento, exercer os direitos de <strong>acesso, retificação,
            apagamento, limitação, portabilidade e oposição</strong>, bem como{' '}
            <strong>retirar o consentimento</strong> (sem afetar a licitude do tratamento
            anterior), contactando-nos por email. Responderemos no prazo máximo de 30 dias.
          </p>
          <p>
            Tem ainda o direito de apresentar reclamação à autoridade de controlo:{' '}
            <strong>CNPD — Comissão Nacional de Proteção de Dados</strong> (
            <a
              href="https://www.cnpd.pt"
              target="_blank"
              rel="noopener noreferrer"
              className="text-rose-gold hover:underline"
            >
              www.cnpd.pt
            </a>
            ).
          </p>

          <H2>6. Segurança</H2>
          <p>
            Aplicamos medidas técnicas e organizativas adequadas: comunicações cifradas (HTTPS),
            acesso à área de gestão restrito por autenticação, minimização dos dados recolhidos e
            controlo de acessos aos sistemas. Nenhum sistema é 100% infalível; em caso de violação
            de dados com risco para os titulares, notificaremos a CNPD e os afetados nos termos
            legais.
          </p>

          <H2>7. Menores</H2>
          <p>
            Os nossos serviços destinam-se a maiores de 18 anos. Não recolhemos conscientemente
            dados de menores; procedimentos em menores de idade exigem consentimento do titular das
            responsabilidades parentais.
          </p>

          <H2>8. Alterações</H2>
          <p>
            Esta política pode ser atualizada para refletir alterações legais ou dos serviços. A
            data da última atualização consta no topo da página.
          </p>

          <H2>9. Contacto</H2>
          <p>
            Para exercer os seus direitos ou esclarecer qualquer questão de privacidade:{' '}
            <a href="mailto:geral@franciellycosta.pt" className="text-rose-gold hover:underline">
              geral@franciellycosta.pt
            </a>
          </p>

          <div className="pt-6 border-t border-cream-dark flex flex-wrap gap-4 text-sm">
            <Link href="/cookies" className="text-rose-gold hover:underline">
              Política de Cookies
            </Link>
            <Link href="/termos" className="text-rose-gold hover:underline">
              Termos e Condições
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
