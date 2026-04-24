import Link from 'next/link'
import { getPagesByType } from '@/lib/content-service'
import { Navbar } from '@/components/landing/Navbar'
import { Footer } from '@/components/landing/Footer'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Blog - Tour Operator Insights & Guides',
  description:
    'Tips, guides, and insights for safari operators, DMCs, and travel agencies. Learn how to build better itineraries, send winning proposals, and grow your business.',
}

export default async function BlogPage() {
  const posts = await getPagesByType('blog')

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-5xl px-6 pb-20 pt-32">
        <h1 className="font-heading text-4xl font-bold">Blog</h1>
        <p className="mt-2 text-lg text-gray-500">
          Insights for tour operators and travel agencies
        </p>

        <div className="mt-12 grid gap-8 md:grid-cols-2">
          {posts.map((post) => (
            <Link
              key={post.id}
              href={`/blog/${post.slug}`}
              className="group block rounded-xl border border-gray-200 p-6 transition-shadow hover:shadow-md"
            >
              <h2 className="font-heading text-xl font-semibold group-hover:text-green-700">
                {post.title}
              </h2>
              {post.excerpt && (
                <p className="mt-2 line-clamp-3 text-sm text-gray-600">{post.excerpt}</p>
              )}
              <p className="mt-4 text-xs text-gray-400">
                {post.createdAt ? new Date(post.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : ''}
              </p>
            </Link>
          ))}
        </div>

        {posts.length === 0 && (
          <p className="mt-12 text-center text-gray-400">Coming soon.</p>
        )}
      </main>
      <Footer />
    </>
  )
}
