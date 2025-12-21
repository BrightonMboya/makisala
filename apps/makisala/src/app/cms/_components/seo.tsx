'use client'
import { TabsContent } from '@repo/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui/card'
import { Input } from '@repo/ui/input'
import { Textarea } from '@repo/ui/textarea'
import { Label } from '@repo/ui/label'
import { Separator } from '@repo/ui/separator'
import { Settings } from 'lucide-react'
import type { IPage as PageData } from '@/db/schema'
import { type HandleInputChange } from '../page'

export default function SEOTab({
    pageData,
    handleInputChange,
}: {
    pageData: PageData
    handleInputChange: HandleInputChange
}) {
    return (
        <TabsContent value="seo" className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                        <Settings className="h-5 w-5" />
                        <span>SEO & Meta Data</span>
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <Label htmlFor="meta-title">Meta Title</Label>
                        <Input
                            id="meta-title"
                            value={pageData.meta_title!}
                            onChange={e => handleInputChange('meta_title', e.target.value)}
                            placeholder="SEO optimized title..."
                            maxLength={60}
                        />
                        <p className="mt-1 text-sm text-gray-500">
                            {pageData.meta_title?.length}/60 characters
                        </p>
                    </div>

                    <div>
                        <Label htmlFor="meta-description">Meta Description</Label>
                        <Textarea
                            id="meta-description"
                            value={pageData.meta_description!}
                            onChange={e => handleInputChange('meta_description', e.target.value)}
                            placeholder="Brief description for search engines..."
                            rows={3}
                            maxLength={160}
                        />
                        <p className="mt-1 text-sm text-gray-500">
                            {pageData.meta_description?.length}/160 characters
                        </p>
                    </div>

                    <div>
                        <Label htmlFor="meta-keywords">Meta Keywords</Label>
                        <Input
                            id="meta-keywords"
                            value={pageData.meta_keywords!}
                            onChange={e => handleInputChange('meta_keywords', e.target.value)}
                            placeholder="safari, tanzania, wildlife, luxury travel"
                        />
                        <p className="mt-1 text-sm text-gray-500">Separate keywords with commas</p>
                    </div>

                    <Separator />

                    <div className="rounded-lg bg-gray-50 p-4">
                        <h3 className="mb-3 font-medium">Search Engine Preview</h3>
                        <div className="space-y-2">
                            <div className="cursor-pointer text-lg text-blue-600 hover:underline">
                                {pageData.meta_title || pageData.title || 'Page Title'}
                            </div>
                            <div className="text-sm text-green-700">
                                https://makisala.com/
                                {pageData.page_type === 'blog' ? 'blog' : 'pages'}/
                                {pageData.slug || 'page-url'}
                            </div>
                            <div className="text-sm text-gray-600">
                                {pageData.meta_description ||
                                    pageData.excerpt ||
                                    'Page description will appear here...'}
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </TabsContent>
    )
}
