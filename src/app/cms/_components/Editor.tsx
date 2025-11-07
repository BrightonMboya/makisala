import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { TabsContent } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { RemoteMdx } from '@/components/markdown-renderer'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@radix-ui/react-label'
import {
    Eye,
    FileText,
    HelpCircle,
    ImageIcon,
    Plus,
    Trash2,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { type PageData } from '../page'
import { Suspense } from 'react'
import { Button } from '@/components/ui/button'
import { FAQ, FAQItem } from '@/components/faq'

interface EditorProps {
    wordCount: number
    pageData: PageData
    handleInputChange: any
    faqs: FAQItem[] | null
    onFaqsChange: (faqs: FAQItem[]) => void
}

export default function Editor({
    wordCount,
    pageData,
    handleInputChange,
    faqs,
    onFaqsChange,
}: EditorProps) {
    const handleAddFaq = () => {
        onFaqsChange([...faqs, { question: '', answer: '' }])
    }

    const handleRemoveFaq = (index: number) => {
        onFaqsChange(faqs.filter((_, i) => i !== index))
    }

    const handleFaqChange = (
        index: number,
        field: 'question' | 'answer',
        value: string,
    ) => {
        const updatedFaqs = [...faqs]
        updatedFaqs[index][field] = value
        onFaqsChange(updatedFaqs)
    }
    return (
        <TabsContent value="editor" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
                {/* Content Editor */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                            <FileText className="h-5 w-5" />
                            <span>Content Editor</span>
                            <Badge variant="secondary">{wordCount} words</Badge>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="page-type">Content Type</Label>
                                <Select
                                    value={pageData.page_type}
                                    onValueChange={(value: 'page' | 'blog') =>
                                        handleInputChange('page_type', value)
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="page">
                                            Page
                                        </SelectItem>
                                        <SelectItem value="blog">
                                            Blog Post
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label htmlFor="status">Status</Label>
                                <Select
                                    value={pageData.status}
                                    onValueChange={(
                                        value: 'draft' | 'published',
                                    ) => handleInputChange('status', value)}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="draft">
                                            Draft
                                        </SelectItem>
                                        <SelectItem value="published">
                                            Published
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div>
                            <Label htmlFor="title">Title</Label>
                            <Input
                                id="title"
                                value={pageData.title}
                                onChange={(e) =>
                                    handleInputChange('title', e.target.value)
                                }
                                placeholder="Enter page title..."
                            />
                        </div>

                        <div>
                            <Label htmlFor="slug">URL Slug</Label>
                            <Input
                                id="slug"
                                value={pageData.slug}
                                onChange={(e) =>
                                    handleInputChange('slug', e.target.value)
                                }
                                placeholder="url-slug"
                            />
                            <p className="mt-1 text-sm text-gray-500">
                                URL: /safari/
                                {pageData.page_type === 'blog'
                                    ? 'blog'
                                    : 'pages'}
                                /{pageData.slug}
                            </p>
                        </div>

                        <div>
                            <Label htmlFor="excerpt">Excerpt</Label>
                            <Textarea
                                id="excerpt"
                                value={pageData.excerpt!}
                                onChange={(e) =>
                                    handleInputChange('excerpt', e.target.value)
                                }
                                placeholder="Brief description of the content..."
                                rows={3}
                            />
                        </div>

                        <div>
                            <Label
                                htmlFor="featured-image"
                                className="flex items-center space-x-2"
                            >
                                <ImageIcon className="h-4 w-4" />
                                <span>Featured Image URL</span>
                            </Label>
                            <Input
                                id="featured-image"
                                value={pageData.featured_image_url!}
                                onChange={(e) =>
                                    handleInputChange(
                                        'featured_image_url',
                                        e.target.value,
                                    )
                                }
                                placeholder="https://example.com/image.jpg"
                            />
                        </div>

                        <div>
                            <Label htmlFor="content">Content (Markdown)</Label>
                            <Textarea
                                id="content"
                                value={pageData.content}
                                onChange={(e) =>
                                    handleInputChange('content', e.target.value)
                                }
                                placeholder="Write your content in Markdown..."
                                rows={20}
                                className="font-mono text-sm"
                            />
                        </div>

                        <div className="space-y-4 border-t pt-4">
                            <div className="flex items-center justify-between">
                                <Label className="flex items-center space-x-2 text-base">
                                    <HelpCircle className="h-5 w-5" />
                                    <span>Frequently Asked Questions</span>
                                </Label>
                                <Button
                                    type="button"
                                    onClick={handleAddFaq}
                                    size="sm"
                                    variant="outline"
                                >
                                    <Plus className="mr-2 h-4 w-4" />
                                    Add FAQ
                                </Button>
                            </div>

                            {faqs?.length === 0 && (
                                <p className="text-muted-foreground text-sm">
                                    No FAQs added yet. Click &#34;Add FAQ&#34;
                                    to get started.
                                </p>
                            )}

                            <div className="space-y-4">
                                {faqs?.map((faq, index) => (
                                    <div
                                        key={index}
                                        className="bg-muted/20 space-y-2 rounded-lg border p-4"
                                    >
                                        <div className="flex items-start justify-between">
                                            <Label className="text-sm font-medium">
                                                FAQ #{index + 1}
                                            </Label>
                                            <Button
                                                type="button"
                                                onClick={() =>
                                                    handleRemoveFaq(index)
                                                }
                                                size="sm"
                                                variant="ghost"
                                                className="h-8 w-8 p-0"
                                            >
                                                <Trash2 className="text-destructive h-4 w-4" />
                                            </Button>
                                        </div>
                                        <div>
                                            <Label htmlFor={`faq-q-${index}`}>
                                                Question
                                            </Label>
                                            <Input
                                                id={`faq-q-${index}`}
                                                value={faq.question}
                                                onChange={(e) =>
                                                    handleFaqChange(
                                                        index,
                                                        'question',
                                                        e.target.value,
                                                    )
                                                }
                                                placeholder="Enter question..."
                                            />
                                        </div>
                                        <div>
                                            <Label htmlFor={`faq-a-${index}`}>
                                                Answer
                                            </Label>
                                            <Textarea
                                                id={`faq-a-${index}`}
                                                value={faq.answer}
                                                onChange={(e) =>
                                                    handleFaqChange(
                                                        index,
                                                        'answer',
                                                        e.target.value,
                                                    )
                                                }
                                                placeholder="Enter answer..."
                                                rows={3}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Live Preview */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                            <Eye className="h-5 w-5" />
                            <span>Live Preview</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="prose prose-sm max-w-none">
                            {pageData.featured_image_url && (
                                <img
                                    src={
                                        pageData.featured_image_url ||
                                        '/placeholder.svg'
                                    }
                                    alt={pageData.title}
                                    className="mb-4 h-48 w-full rounded-lg object-cover"
                                />
                            )}
                            {pageData.title && (
                                <h1 className="mb-4 text-2xl font-bold">
                                    {pageData.title}
                                </h1>
                            )}
                            {pageData.excerpt && (
                                <p className="mb-6 text-gray-600 italic">
                                    {pageData.excerpt}
                                </p>
                            )}
                            <Suspense>
                                <RemoteMdx content={pageData.content || ''} />
                            </Suspense>

                            {pageData.faqs && pageData.faqs.length > 0 && (
                                <FAQ faqs={pageData.faqs} />
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </TabsContent>
    )
}
