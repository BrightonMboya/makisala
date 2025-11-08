'use client'

import { useState } from 'react'
import { Eye, FileText, Globe, Save, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/lib/hooks/use-toast'
import { createPage, updatePage } from '@/lib/cms-service'
import Editor from './_components/Editor'
import SEOTab from './_components/seo'
import Preview from './_components/LivePreview'
import { FAQItem } from '@/components/faq'
import Manage from '@/app/cms/_components/Manage'
import { type Pages as PageData } from '@/db/schema'

export type HandleInputChange = (field: keyof PageData, value: string) => void
export type HandleLoadPage = (page: PageData) => void

// TODO: Gentle reminder to refactor this to use Forms

export default function CMSPage() {
    const { toast } = useToast()
    const [activeTab, setActiveTab] = useState('editor')
    const [isLoading, setIsLoading] = useState(false)

    const [pageData, setPageData] = useState<Partial<PageData>>({
        title: '',
        slug: '',
        content: '',
        excerpt: '',
        faqs: [],
        featured_image_url: '',
        meta_title: '',
        meta_description: '',
        meta_keywords: '',
        status: 'draft',
        page_type: 'page',
    })

    const handleInputChange = (field: keyof PageData, value: string) => {
        setPageData((prev) => ({ ...prev, [field]: value }))
    }

    const handleFaqsChange = (faqs: FAQItem[]) => {
        setPageData((prev) => ({ ...prev, faqs }))
    }

    const handleSave = async () => {
        setIsLoading(true)
        try {
            let savedPage: PageData

            if (pageData.id) {
                // Update existing page
                savedPage = await updatePage(pageData.id, pageData)
            } else {
                // Create new page
                savedPage = await createPage(pageData as PageData)
            }

            // Update local state
            setPageData(savedPage)

            toast({
                title: 'Success!',
                description: `${
                    pageData.page_type === 'blog' ? 'Blog post' : 'Page'
                } saved successfully.`,
            })
        } catch (error) {
            console.error('Save error:', error)
            toast({
                title: 'Error',
                description: 'Failed to save. Please try again.',
                variant: 'destructive',
            })
        } finally {
            setIsLoading(false)
        }
    }

    const handleLoadPage = (page: PageData) => {
        setPageData(page)
        setActiveTab('editor')
    }

    const handleNewPage = () => {
        setPageData({
            title: '',
            slug: '',
            content: '',
            excerpt: '',
            featured_image_url: '',
            meta_title: '',
            meta_description: '',
            meta_keywords: '',
            status: 'draft',
            page_type: 'page',
        })
        setActiveTab('editor')
    }

    const wordCount = pageData.content
        ? pageData.content.split(/\s+/).filter((word) => word.length > 0).length
        : 0

    return (
        <div className="mt-10 min-h-screen bg-gray-50 p-4">
            <div className="mx-auto max-w-7xl">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">
                                Content Management System
                            </h1>
                            <p className="mt-2 text-gray-600">
                                Create and manage your safari website content
                            </p>
                        </div>
                        <div className="flex items-center space-x-4">
                            <Button onClick={handleNewPage} variant="outline">
                                <FileText className="mr-2 h-4 w-4" />
                                New Page
                            </Button>
                            <Button onClick={handleSave} disabled={isLoading}>
                                <Save className="mr-2 h-4 w-4" />
                                {isLoading ? 'Saving...' : 'Save'}
                            </Button>
                        </div>
                    </div>
                </div>

                <Tabs
                    value={activeTab}
                    onValueChange={setActiveTab}
                    className="space-y-6"
                >
                    <TabsList className="grid w-full grid-cols-4">
                        <TabsTrigger
                            value="editor"
                            className="flex items-center space-x-2"
                        >
                            <FileText className="h-4 w-4" />
                            <span>Editor</span>
                        </TabsTrigger>
                        <TabsTrigger
                            value="seo"
                            className="flex items-center space-x-2"
                        >
                            <Settings className="h-4 w-4" />
                            <span>SEO & Meta</span>
                        </TabsTrigger>
                        <TabsTrigger
                            value="preview"
                            className="flex items-center space-x-2"
                        >
                            <Eye className="h-4 w-4" />
                            <span>Preview</span>
                        </TabsTrigger>
                        <TabsTrigger
                            value="manage"
                            className="flex items-center space-x-2"
                        >
                            <Globe className="h-4 w-4" />
                            <span>Manage</span>
                        </TabsTrigger>
                    </TabsList>

                    <Editor
                        wordCount={wordCount}
                        pageData={pageData}
                        handleInputChange={handleInputChange}
                        faqs={pageData.faqs || []}
                        onFaqsChange={handleFaqsChange}
                    />
                    <SEOTab
                        pageData={pageData}
                        handleInputChange={handleInputChange}
                    />
                    <Preview wordCount={wordCount} pageData={pageData} />
                    <Manage handleLoadPage={handleLoadPage} />
                </Tabs>
            </div>
        </div>
    )
}
