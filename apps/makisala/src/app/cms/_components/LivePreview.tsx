'use client'
import { TabsContent } from '@repo/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui/card'
import { Eye } from 'lucide-react'
import { Badge } from '@repo/ui/badge'
import { type IPage as PageData } from '@/db/schema'
import { RemoteMdx } from '@/components/markdown-renderer'
import { FAQ } from '@/components/faq'
import { Suspense } from 'react'

export default function Preview({
    pageData,
    wordCount,
}: {
    pageData: PageData
    wordCount: number
}) {
    return (
        <TabsContent value="preview" className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                        <Eye className="h-5 w-5" />
                        <span>Full Page Preview</span>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="rounded-lg border bg-white p-8 shadow-sm">
                        <div className="mx-auto max-w-4xl">
                            {pageData.featured_image_url && (
                                <div className="mb-8">
                                    <img
                                        src={pageData.featured_image_url || '/placeholder.svg'}
                                        alt={pageData.title}
                                        className="h-64 w-full rounded-lg object-cover"
                                    />
                                </div>
                            )}

                            <header className="mb-8">
                                <h1 className="mb-4 text-4xl font-bold text-gray-900">
                                    {pageData.title || 'Page Title'}
                                </h1>
                                {pageData.excerpt && (
                                    <p className="text-xl leading-relaxed text-gray-600">
                                        {pageData.excerpt}
                                    </p>
                                )}
                                <div className="mt-4 flex items-center space-x-4 text-sm text-gray-500">
                                    <Badge
                                        variant={
                                            pageData.status === 'published'
                                                ? 'default'
                                                : 'secondary'
                                        }
                                    >
                                        {pageData.status}
                                    </Badge>
                                    <span>
                                        {pageData.page_type === 'blog' ? 'Blog Post' : 'Page'}
                                    </span>
                                    <span>{wordCount} words</span>
                                </div>
                            </header>

                            <Suspense>
                                <RemoteMdx
                                    content={
                                        pageData.content ||
                                        '*No content yet. Start writing in the editor tab.*'
                                    }
                                />
                            </Suspense>

                            {pageData.faqs && <FAQ faqs={pageData.faqs} />}
                        </div>
                    </div>
                </CardContent>
            </Card>
        </TabsContent>
    )
}
