'use client'
import { TabsContent } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Globe, FileText } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { PageData } from '../page'

export default function Manage({
    savedPages,
    handleLoadPage,
}: {
    savedPages: PageData[]
    handleLoadPage: (page: PageData) => void
}) {
    return (
        <TabsContent value="manage" className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                        <Globe className="h-5 w-5" />
                        <span>Manage Content</span>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {savedPages.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p>No saved content yet. Create your first page or blog post!</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {savedPages.map(page => (
                                <div
                                    key={page.id}
                                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                                >
                                    <div className="flex-1">
                                        <div className="flex items-center space-x-3">
                                            <h3 className="font-medium">{page.title}</h3>
                                            <Badge
                                                variant={
                                                    page.status === 'published'
                                                        ? 'default'
                                                        : 'secondary'
                                                }
                                            >
                                                {page.status}
                                            </Badge>
                                            <Badge variant="outline">{page.page_type}</Badge>
                                        </div>
                                        <p className="text-sm text-gray-600 mt-1">{page.excerpt}</p>
                                        <p className="text-xs text-gray-500 mt-2">
                                            Last updated:{' '}
                                            {page.updated_at
                                                ? new Date(page.updated_at).toLocaleDateString()
                                                : 'Never'}
                                        </p>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleLoadPage(page)}
                                        >
                                            Edit
                                        </Button>
                                        <Button variant="outline" size="sm">
                                            View
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </TabsContent>
    )
}
