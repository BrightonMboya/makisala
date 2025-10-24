import { MarkdownRenderer } from '@/components/markdown-renderer'
import { notFound } from 'next/navigation'
import { getImagesInFolder } from '@/lib/cloudinary'
import Image from 'next/image'
import { capitalize } from '@/lib/utils'
import { getWildlifeByNameAndPark } from '@/lib/cms-service'
import { FAQ } from '@/components/faq'
import type { Metadata } from 'next'
import Script from 'next/script'
import { BreadcrumbSchema, FAQSchema } from '@/components/schema'
import { BASE_URL } from '@/lib/constants'

interface IParams {
    params: {
        animal: string
        destination: string
    }
}

export default async function Page({ params }: IParams) {
    const { animal, destination } = await params
    const data = await getWildlifeByNameAndPark(animal, destination)
    const images = await getImagesInFolder(`wildlife/${animal}`)

    if (!data) {
        return notFound()
    }

    return (
        <main className="mt-[50px]">
            <Script type={'application/ld+json'} strategy={'lazyOnload'}>
                {JSON.stringify([
                    BreadcrumbSchema({
                        breadcrumbs: [
                            { name: 'Home', url: 'https://www.makisala.com' },
                            {
                                name: `National Parks/${destination}`,
                                url: `${BASE_URL}/national-parks/${destination}/`,
                            },
                            {
                                name: `National Parks/${destination} Wildlife`,
                                url: `${BASE_URL}/wildlife/${animal}/${destination}/`,
                            },
                        ],
                    }),
                    FAQSchema({ faqs: data.faqs! }),
                ])}
            </Script>
            <section className="relative h-[80vh] flex items-center justify-center">
                <Image
                    src={images[0].url}
                    alt={`${animal} in ${destination}`}
                    fill
                    className="object-cover"
                    priority
                />
                <div className="absolute inset-0 bg-black/20" />

                <div className="relative z-10 text-center text-white">
                    <h1 className="text-8xl font-serif font-light tracking-wide">
                        {capitalize(animal)}
                    </h1>
                </div>
            </section>
            <section className="py-20">
                <div className="container mx-auto px-6">
                    <div className="text-center mb-16">
                        <h1 className="text-4xl mb-6 text-balance">{`Where to see ${capitalize(animal)} in ${capitalize(destination)}`}</h1>
                        <p className="text-lg  max-w-4xl mx-auto text-pretty">
                            <MarkdownRenderer content={data.excerpt} />
                        </p>
                    </div>

                    <div className="grid lg:grid-cols-2 gap-12 items-start">
                        <div className="relative">
                            <Image
                                src={images[1].url}
                                alt="Lions in their natural habitat"
                                width={600}
                                height={400}
                                className="rounded-lg object-cover w-full"
                            />
                        </div>

                        <div className="space-y-8">
                            <div>
                                <h2 className="text-lg font-semibold tracking-wider mb-6">
                                    {`Quick Facts about ${capitalize(animal)}`}
                                </h2>
                            </div>

                            <div className="space-y-4 leading-relaxed">
                                <MarkdownRenderer content={data.description} />
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section className="py-16 ">
                <div className="container mx-auto px-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {data.quick_facts?.map((fact, index) => (
                            <div key={index} className="text-center">
                                <div className="text-4xl lg:text-3xl mb-2">
                                    <MarkdownRenderer content={fact.fact} />
                                </div>
                                <div className="text-sm tracking-wider">{fact.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <section className="py-20">
                <div className="container mx-auto px-6">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl  mb-6 text-balance">{`Where to see ${capitalize(animal)} in ${capitalize(destination)}`}</h2>
                        <p className="text-lg max-w-4xl mx-auto text-pretty">
                            {data.where_to_see_title as string}
                        </p>
                    </div>

                    <div className="grid lg:grid-cols-2 gap-12 items-start">
                        <div className="space-y-6">
                            <h2 className="text-2xl">{`Top tips for viewing ${capitalize(animal)}`}</h2>

                            <div className="space-y-4 leading-relaxed">
                                <MarkdownRenderer
                                    content={data.where_to_see_description as string}
                                />
                            </div>
                        </div>

                        <div className="relative">
                            <Image
                                src={images[3].url}
                                alt="Lions with safari vehicle in background"
                                width={600}
                                height={400}
                                className="rounded-lg object-cover w-full"
                            />
                        </div>
                    </div>
                </div>
            </section>
            {/*// @ts-ignore*/}
            <FAQ faqs={data.faqs} />
        </main>
    )
}

export async function generateMetadata({ params }: IParams): Promise<Metadata> {
    try {
        const { animal, destination } = await params
        const page = await getWildlifeByNameAndPark(animal, destination)
        const images = await getImagesInFolder(`wildlife/${animal}`)

        if (!page) {
            return {
                title: 'Page Not Found',
                description: 'The requested page could not be found.',
            }
        }

        return {
            title: page.meta_title,
            description: page.meta_description,
            openGraph: {
                title: page?.meta_title,
                description: page?.meta_description,
                images: images[0].url,
            },
        }
    } catch {
        return {
            title: 'Page Not Found',
            description: 'The requested page could not be found.',
        }
    }
}
