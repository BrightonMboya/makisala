import { notFound } from "next/navigation";
import Image from "next/image";
import type { Metadata } from "next";

import { getPageBySlug } from "@/lib/cms-service";
import { MarkdownRenderer } from "@/components/markdown-renderer";

interface BlogPostPageProps {
  params: {
    slug: string;
  };
}

// Metadata for SEO
export async function generateMetadata({
                                         params,
                                       }: BlogPostPageProps): Promise<Metadata> {
  try {
    const page = await getPageBySlug(params.slug);

    if (!page || page.status !== "published") {
      return {
        title: "Page Not Found",
        description: "The requested page could not be found.",
      };
    }

    return {
      title: page.meta_title || page.title,
      description: page.meta_description || page.excerpt,
      keywords: page.meta_keywords,
      openGraph: {
        title: page.meta_title || page.title,
        description: page.meta_description! || page.excerpt!,
        images: page.featured_image_url ? [page.featured_image_url] : [],
      },
    };
  } catch {
    return {
      title: "Page Not Found",
      description: "The requested page could not be found.",
    };
  }
}

// Page renderer
export default async function BlogPostPage({ params }: BlogPostPageProps) {
  try {
    const page = await getPageBySlug(await params.slug);

    if (!page || page.status !== "published") {
      notFound();
    }

    return (
        <div className="min-h-screen bg-white">
          <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            {page.featured_image_url && (
                <div className="mb-8">
                  <Image
                      src={page.featured_image_url}
                      alt={page.title}
                      width={800}
                      height={400}
                      className="w-full h-64 md:h-96 object-cover rounded-lg shadow-lg"
                  />
                </div>
            )}

            <header className="mb-8">
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                {page.title}
              </h1>
              {page.excerpt && (
                  <p className="text-xl text-gray-600 leading-relaxed">
                    {page.excerpt}
                  </p>
              )}
              <div className="flex items-center space-x-4 mt-6 text-sm text-gray-500">
                <time dateTime={page.createdAt}>
                  {new Date(page.createdAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </time>
                <span>•</span>
                <span>{page.page_type === "blog" ? "Blog Post" : "Page"}</span>
              </div>
            </header>

            <MarkdownRenderer content={page.content} />
          </article>
        </div>
    );
  } catch {
    notFound();
  }
}
