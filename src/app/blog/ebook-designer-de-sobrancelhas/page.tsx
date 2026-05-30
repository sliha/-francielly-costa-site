import type { Metadata } from 'next'
import EbookLanding from '@/components/blog/EbookLanding'
import JsonLd, { bookSchema, breadcrumbSchema, SITE_URL } from '@/components/JsonLd'
import { EBOOK } from '@/components/blog/ebookData'

const url = `${SITE_URL}/blog/${EBOOK.slug}`
const ogImage = `${SITE_URL}${EBOOK.ogImage}`

export const metadata: Metadata = {
  title: 'eBook Grátis: A Chave para o Sucesso — Curso de Designer de Sobrancelhas',
  description:
    'Descarregue gratuitamente o eBook de 28 páginas da Francielly Costa: o método completo de design de sobrancelhas — ferramentas, anatomia, ética e o sistema de medição perfeito. Leia online ou em PDF.',
  keywords: [
    'ebook sobrancelhas grátis',
    'curso designer de sobrancelhas',
    'método francielly costa',
    'design de sobrancelhas pdf',
    'brow lamination ebook',
    'medição de sobrancelhas',
    'curso sobrancelhas braga',
  ],
  alternates: { canonical: url },
  openGraph: {
    title: 'eBook Grátis: A Chave para o Sucesso — Curso de Designer de Sobrancelhas',
    description:
      'O método completo de design de sobrancelhas da Francielly Costa em 28 páginas. Grátis, sem registo — leia online ou descarregue em PDF.',
    url,
    siteName: 'Francielly Costa',
    locale: 'pt_PT',
    type: 'article',
    publishedTime: EBOOK.date,
    authors: ['Francielly Costa'],
    images: [{ url: ogImage, width: 1200, height: 630, alt: `eBook ${EBOOK.title} — Francielly Costa` }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'eBook Grátis: A Chave para o Sucesso',
    description: 'O método completo de design de sobrancelhas da Francielly Costa. Grátis em PDF.',
    images: [ogImage],
  },
}

export default function EbookPage() {
  return (
    <>
      <JsonLd
        id="ld-breadcrumb-ebook"
        data={breadcrumbSchema([
          { name: 'Início', url: SITE_URL },
          { name: 'Blog', url: `${SITE_URL}/blog` },
          { name: EBOOK.title, url },
        ])}
      />
      <JsonLd
        id="ld-book-ebook"
        data={bookSchema({
          name: `${EBOOK.title} — ${EBOOK.subtitle}`,
          description: EBOOK.description,
          url,
          image: ogImage,
          pdfUrl: `${SITE_URL}${EBOOK.pdf}`,
          numberOfPages: EBOOK.pageCount,
          datePublished: EBOOK.date,
          about: [
            'Design de sobrancelhas',
            'Brow Lamination',
            'Dermopigmentação',
            'Visagismo facial',
          ],
        })}
      />
      <EbookLanding />
    </>
  )
}
