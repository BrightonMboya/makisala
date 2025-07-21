import Image from "next/image";
import {Button} from "@/components/ui/button";
import {MarkdownRenderer} from "@/components/markdown-renderer";
import {PageData} from "@/app/cms/page";

export default function PagePreview({page}: {page: PageData}) {
    return (
        <div className="min-h-screen bg-white relative">
            {page.featured_image_url && (
                <section className="relative h-screen flex items-center justify-start overflow-hidden mt-16">
                    <div className="absolute inset-0">
                        <Image
                            src={page.featured_image_url}
                            alt="Makisala Safaris"
                            fill
                            className="object-cover"
                            priority
                        />
                        <div className="absolute inset-0 bg-black/70" />
                    </div>
                    <div className="relative z-10 text-white max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
                        <div className="max-w-2xl">
                            <div className="text-sm font-medium tracking-wider mb-4">
                                DESTINATION
                            </div>
                            <h1 className="text-5xl md:text-6xl font-bold leading-tight">
                                {page.title}
                            </h1>
                            <p className="text-white text-lg md:text-xl mb-8">
                                {page.excerpt}
                            </p>
                            <div className="flex space-x-4">
                                <Button className="bg-white text-black hover:bg-gray-100 px-8 py-3 text-sm font-medium"
                                        variant={"outline"}
                                >
                                    START PLANNING
                                </Button>
                            </div>
                        </div>
                    </div>
                </section>
            )}
            <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:max-w-7xl py-16">
                <MarkdownRenderer content={page.content} />
            </article>
        </div>
    )
}