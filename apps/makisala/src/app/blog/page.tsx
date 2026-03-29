import { fetchAllBlogs } from '@/lib/cms-service'
import ImageCard from '../../components/home/image-card'
import Link from 'next/link'
import { BreadcrumbSchema } from '@/components/schema'
import { BASE_URL } from '@/lib/constants'
import type { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Safari Blog | Makisala Safaris',
    description:
        'Read our latest safari guides, travel tips, and stories from Tanzania, Rwanda, and beyond. Plan your perfect African wildlife adventure with expert insights.',
    openGraph: {
        title: 'Safari Blog | Makisala Safaris',
        description:
            'Read our latest safari guides, travel tips, and stories from Tanzania, Rwanda, and beyond.',
    },
}

export default async function Page() {
    const blogs = await fetchAllBlogs('blog')

    return (
        <main className="mt-10">
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify([
                        BreadcrumbSchema({
                            breadcrumbs: [
                                { name: 'Home', url: BASE_URL },
                                { name: 'Blog', url: `${BASE_URL}/blog` },
                            ],
                        }),
                    ]),
                }}
            />
            <h1 className="mb-8 text-center text-4xl font-bold text-gray-900">Safari Blog</h1>
            <section>
                <div className="mx-auto mb-24 grid max-w-7xl justify-center gap-12 max-sm:flex max-sm:h-full max-sm:flex-col md:grid-cols-2 xl:grid-cols-3">
                    {blogs?.map(blog => (
                        <div key={blog.id}>
                            <Link href={`/blog/${blog.slug}`}>
                                <ImageCard
                                    title={blog.title}
                                    img_url={blog.featured_image_url || '/placeholder.svg'}
                                    alt={blog.title}
                                    description={blog.excerpt!}
                                />
                            </Link>
                        </div>
                    ))}
                </div>
                {(!blogs || blogs.length === 0) && (
                    <p className="text-center text-gray-500">No blog posts yet. Check back soon!</p>
                )}
            </section>
        </main>
    )
}
