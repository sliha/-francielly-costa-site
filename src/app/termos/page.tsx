import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Termos e Condições',
  description:
    'Termos e Condições de utilização do site e dos serviços de Francielly Costa — Dermopigmentação Avançada em Braga.',
  alternates: { canonical: '/termos' },
  robots: { index: true, follow: true },
}

function H2({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="font-playfair font-bold text-2xl text-text-primary mt-10 mb-3">{children}</h2>
  )
}

export default function Termos() {
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
          Termos e Condições
        </h1>
        <p className="text-text-muted text-sm font-inter mb-8">Última atualização: junho de 2026</p>
        <div className="divider-rose-left mb-8" />

        <div className="prose prose-lg max-w-none space-y-4 text-text-secondary font-inter leading-relaxed">
          <p>
            Os presentes Termos e Condições regulam a utilização do site{' '}
            <strong>franciellycosta.pt</strong> e a prestação dos serviços de{' '}
            <strong>Francielly Costa — Dermopigmentação Avançada</strong>, com estúdio na Av. Dr.
            António Palha 53, 4715-091 Braga, Portugal (doravante «Prestadora»). Ao utilizar o site
            ou agendar um serviço, declara ter lido e aceite estes termos.
          </p>

          <H2>1. Serviços</H2>
          <p>
            Os serviços de dermopigmentação (microblading, microshading, micropigmentação labial,
            eyeliner, tricopigmentação, FiberBROWS, entre outros) são prestados mediante
            agendamento prévio e avaliação individual. Os preços apresentados no site são
            indicativos e podem ser ajustados após avaliação presencial ou virtual, sendo o valor
            final sempre comunicado antes do procedimento.
          </p>

          <H2>2. Agendamento, Cancelamentos e Remarcações</H2>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              A marcação é feita online, por telefone ou presencialmente, ficando sempre
              sujeita a confirmação de disponibilidade.
            </li>
            <li>
              Cancelamentos e remarcações devem ser comunicados com, pelo menos,{' '}
              <strong>48 horas de antecedência</strong>, para que o horário possa ser
              disponibilizado a outra cliente.
            </li>
            <li>
              A Prestadora reserva-se o direito de remarcar por motivos de força maior, doença ou
              indisponibilidade, propondo nova data sem custos para a cliente.
            </li>
          </ul>

          <H2>3. Saúde, Contraindicações e Consentimento</H2>
          <p>
            A cliente é responsável por prestar informações de saúde verdadeiras e completas no
            formulário de consentimento/anamnese. A omissão de condições relevantes (gravidez,
            alergias, medicação, doenças de pele, entre outras) é da exclusiva responsabilidade da
            cliente. A Prestadora reserva-se o direito de recusar ou interromper qualquer
            procedimento que possa colocar em risco a saúde da cliente. A realização do
            procedimento depende da assinatura prévia do consentimento informado.
          </p>

          <H2>4. Resultados</H2>
          <p>
            Os resultados de dermopigmentação variam de pessoa para pessoa em função do tipo de
            pele, cicatrização, estilo de vida e cuidados pós-procedimento. As imagens apresentadas
            no site correspondem a trabalhos reais, mas <strong>não constituem garantia de
            resultado idêntico</strong>. A retenção do pigmento pode exigir sessões de retoque,
            orçamentadas em separado quando aplicável.
          </p>

          <H2>5. Conteúdos Informativos e Funcionalidades de IA</H2>
          <p>
            Os conteúdos do blog, do eBook e das páginas de serviços têm natureza meramente
            informativa e <strong>não substituem aconselhamento médico</strong>. A assistente
            virtual «Sofia» e o simulador de resultados utilizam inteligência artificial: as suas
            respostas e análises são aproximações informativas, podem conter imprecisões e{' '}
            <strong>não constituem avaliação profissional nem promessa de resultado</strong>. A
            avaliação vinculativa é sempre efetuada pela Prestadora.
          </p>

          <H2>6. Utilização do Site</H2>
          <p>
            O utilizador compromete-se a utilizar o site de forma lícita, abstendo-se de introduzir
            dados falsos, de tentar aceder a áreas reservadas, de interferir com o funcionamento da
            plataforma ou de utilizar mecanismos automatizados para criar marcações. A Prestadora
            pode cancelar marcações manifestamente abusivas ou fraudulentas.
          </p>

          <H2>7. Propriedade Intelectual</H2>
          <p>
            Todos os conteúdos do site — textos, fotografias, logótipos, eBook e identidade visual
            — são propriedade da Prestadora ou utilizados sob licença, estando protegidos por
            direitos de autor. É proibida a sua reprodução ou utilização comercial sem autorização
            prévia por escrito. O eBook gratuito destina-se a uso pessoal e não comercial.
          </p>

          <H2>8. Limitação de Responsabilidade</H2>
          <p>
            O site é disponibilizado «tal como está». Na máxima medida permitida pela lei, a
            Prestadora não responde por: (i) indisponibilidades temporárias, erros técnicos ou
            falhas de serviços de terceiros (pagamentos, email, calendário, IA); (ii) danos
            resultantes de informações de saúde omitidas ou incorretas prestadas pela cliente;
            (iii) utilização dos conteúdos informativos como substituto de aconselhamento
            profissional. Nada nestes termos exclui ou limita responsabilidades que não possam ser
            excluídas por lei, incluindo as decorrentes dos direitos do consumidor.
          </p>
          <p>
            Os fornecedores técnicos e desenvolvedores do site atuam por conta da Prestadora e não
            assumem qualquer relação contratual com o utilizador, não podendo ser responsabilizados
            diretamente por este pela utilização do site ou dos serviços.
          </p>

          <H2>9. Resolução Alternativa de Litígios e Livro de Reclamações</H2>
          <p>
            Em caso de litígio de consumo, o consumidor pode recorrer à entidade de resolução
            alternativa de litígios competente para a área de Braga:{' '}
            <strong>CIAB — Centro de Informação, Mediação e Arbitragem de Consumo</strong> (
            <a
              href="https://www.ciab.pt"
              target="_blank"
              rel="noopener noreferrer"
              className="text-rose-gold hover:underline"
            >
              www.ciab.pt
            </a>
            ), ou consultar a lista atualizada de entidades RAL no Portal do Consumidor (
            <a
              href="https://www.consumidor.gov.pt"
              target="_blank"
              rel="noopener noreferrer"
              className="text-rose-gold hover:underline"
            >
              www.consumidor.gov.pt
            </a>
            ), nos termos da Lei n.º 144/2015.
          </p>
          <p>
            Está igualmente disponível o{' '}
            <a
              href="https://www.livroreclamacoes.pt"
              target="_blank"
              rel="noopener noreferrer"
              className="text-rose-gold hover:underline"
            >
              Livro de Reclamações Eletrónico
            </a>
            .
          </p>

          <H2>10. Lei Aplicável e Foro</H2>
          <p>
            Estes termos regem-se pela lei portuguesa. Para qualquer litígio emergente da sua
            interpretação ou execução é competente o tribunal da comarca de Braga, sem prejuízo das
            normas imperativas de competência aplicáveis aos consumidores.
          </p>

          <H2>11. Alterações</H2>
          <p>
            A Prestadora pode atualizar estes termos a qualquer momento, produzindo efeitos a
            partir da publicação no site. A data da última atualização consta no topo da página.
          </p>

          <H2>12. Contacto</H2>
          <p>
            Para questões sobre estes termos:{' '}
            <a href="mailto:geral@franciellycosta.com" className="text-rose-gold hover:underline">
              geral@franciellycosta.com
            </a>{' '}
            · +351 913 112 232
          </p>

          <div className="pt-6 border-t border-cream-dark flex flex-wrap gap-4 text-sm">
            <Link href="/privacidade" className="text-rose-gold hover:underline">
              Política de Privacidade
            </Link>
            <Link href="/cookies" className="text-rose-gold hover:underline">
              Política de Cookies
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
