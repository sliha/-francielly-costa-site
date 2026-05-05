import HeroSection from '@/components/home/HeroSection'
import FiberBROWSSection from '@/components/home/FiberBROWSSection'
import StatsSection from '@/components/home/StatsSection'
import ServicesSection from '@/components/home/ServicesSection'
import AboutPreviewSection from '@/components/home/AboutPreviewSection'
import TestimonialsSection from '@/components/home/TestimonialsSection'
import InstagramSection from '@/components/home/InstagramSection'
import FAQSection from '@/components/home/FAQSection'
import LocationSection from '@/components/home/LocationSection'
import InstagramPopup from '@/components/home/InstagramPopup'
import JsonLd, { faqSchema } from '@/components/JsonLd'

const faqs = [
  {
    question: 'O que é dermopigmentação e como funciona?',
    answer:
      'A dermopigmentação (também conhecida como maquilhagem permanente ou PMU) é uma técnica que introduz pigmentos naturais na camada superficial da pele através de micro-agulhas especializadas, criando resultados naturais e duradouros em sobrancelhas, olhos e lábios.',
  },
  {
    question: 'Quanto tempo duram os resultados?',
    answer:
      'Microblading dura 1 a 3 anos, Microshading 1 a 2 anos, Eyeliner Permanente 2 a 4 anos e Micropigmentação Labial 1 a 3 anos. Peles oleosas e maior exposição solar aceleram o desvanecimento.',
  },
  {
    question: 'Os procedimentos doem?',
    answer:
      'Todos os procedimentos são realizados com anestesia tópica, tornando o desconforto mínimo. A maioria das clientes descreve a sensação como um arranhão suave.',
  },
  {
    question: 'Quantas sessões são necessárias?',
    answer:
      'Geralmente 2 sessões: a sessão inicial e um retoque obrigatório entre 4 a 8 semanas depois. Algumas clientes podem necessitar de uma terceira sessão dependendo do tipo de pele.',
  },
  {
    question: 'Como é o período de recuperação?',
    answer:
      'Nos primeiros dias pode haver vermelhidão e ligeiro inchaço. Ao longo de 7 a 14 dias forma-se uma película fina que cai naturalmente, revelando o resultado final.',
  },
  {
    question: 'Existem contraindicações?',
    answer:
      'Sim: gravidez, amamentação, uso de isotretinoína nos últimos 6 meses, distúrbios de coagulação, diabetes não controlada, doenças autoimunes ativas, e quimioterapia ou radioterapia recente. Recomendamos consulta prévia.',
  },
]

export default function Home() {
  return (
    <>
      <JsonLd id="ld-faq-home" data={faqSchema(faqs)} />
      <HeroSection />
      <FiberBROWSSection />
      <StatsSection />
      <ServicesSection />
      <AboutPreviewSection />
      <TestimonialsSection />
      <InstagramSection />
      <FAQSection />
      <LocationSection />
      <InstagramPopup />
    </>
  )
}
