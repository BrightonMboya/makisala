import { notFound } from 'next/navigation'
import { getPageBySlug, getAllSlugs } from '@/lib/content-service'
import { Navbar } from '@/components/landing/Navbar'
import { Footer } from '@/components/landing/Footer'
import type { Metadata } from 'next'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  const slugs = await getAllSlugs('blog')
  return slugs.map((s) => ({ slug: s.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const page = await getPageBySlug(slug)
  if (!page) return { title: 'Not Found' }
  return {
    title: page.meta_title || page.title,
    description: page.meta_description || page.excerpt,
    openGraph: {
      title: page.meta_title || page.title,
      description: page.meta_description || page.excerpt || '',
    },
  }
}

export default async function BlogPost({ params }: Props) {
  const { slug } = await params
  const page = await getPageBySlug(slug)
  if (!page) return notFound()

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-3xl px-6 pb-20 pt-32">
        <article>
          <h1 className="font-heading text-4xl font-bold leading-tight">{page.title}</h1>
          {page.excerpt && (
            <p className="mt-4 text-lg text-gray-500">{page.excerpt}</p>
          )}
          <div
            className="prose prose-lg mt-10 max-w-none"
            dangerouslySetInnerHTML={{ __html: page.content }}
          />

          {page.faqs && page.faqs.length > 0 && (
            <section className="mt-16">
              <h2 className="font-heading text-2xl font-bold">FAQ</h2>
              <div className="mt-6 space-y-6">
                {page.faqs.map((faq, i) => (
                  <div key={i}>
                    <h3 className="font-semibold">{faq.question}</h3>
                    <p className="mt-1 text-gray-600">{faq.answer}</p>
                  </div>
                ))}
              </div>
              <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                  __html: JSON.stringify({
                    '@context': 'https://schema.org',
                    '@type': 'FAQPage',
                    mainEntity: page.faqs.map((faq) => ({
                      '@type': 'Question',
                      name: faq.question,
                      acceptedAnswer: { '@type': 'Answer', text: faq.answer },
                    })),
                  }),
                }}
              />
            </section>
          )}
        </article>
      </main>
      <Footer />
    </>
  )
}
