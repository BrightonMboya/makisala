'use client'
import { fetchAllBlogs } from '@/lib/cms-service'
import { useQuery } from '@tanstack/react-query'
import ImageCard from '../../components/home/image-card'
import Link from 'next/link'
import { BreadcrumbSchema } from '@/components/schema'
import Script from 'next/script'
import { BASE_URL } from '@/lib/constants'

export default function Page() {
    const { data: blogs, isLoading } = useQuery({
        queryKey: ['pages'],
        queryFn: () => fetchAllBlogs('blog'),
    })

    return (
        <main className="mt-10">
            <Script type={'application/ld+json'} strategy={'lazyOnload'} id="schema">
                {JSON.stringify([
                    BreadcrumbSchema({
                        breadcrumbs: [
                            { name: 'Home', url: BASE_URL },
                            {
                                name: 'Blog',
                                url: `${BASE_URL}/blog`,
                            },
                        ],
                    }),
                ])}
            </Script>
            <h3>All Blogs</h3>
            <section className="">
                <div className="mx-auto mb-24 grid max-w-7xl justify-center gap-12 max-sm:flex max-sm:h-full max-sm:flex-col md:grid-cols-2 xl:grid-cols-3">
                    {blogs?.map(blog => (
                        <div key={blog.id} className="">
                            <Link href={`/blog/${blog.slug}`}>
                                <ImageCard
                                    title={blog.title}
                                    img_url={blog.featured_image_url || '/placeholder.svg'}
                                    alt="Makisala Blog"
                                    description={blog.excerpt!}
                                />
                            </Link>
                        </div>
                    ))}
                </div>
                {isLoading && <p className="text-center">Loading ...</p>}
            </section>
        </main>
    )
}
