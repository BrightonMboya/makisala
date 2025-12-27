'use client'

import { Card, CardContent } from '@repo/ui/card'
import { Skeleton } from '@repo/ui/skeleton'
import { Badge } from '@repo/ui/badge'
import { Calendar, ExternalLink, FileText, User } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { searchPagesByTitle } from '@/lib/cms-service'
import { type IPage as Page } from '@repo/db'
import { Button } from '@repo/ui/button'
import { type HandleLoadPage } from '../page'

interface PageListProps {
    query: string
    handleLoadPage: HandleLoadPage
}

export default function PageList({ query, handleLoadPage }: PageListProps) {
    const { data, isLoading, error } = useQuery({
        queryKey: ['fetch_pages', query],
        queryFn: () => searchPagesByTitle({ query: query }),
    })

    if (error) {
        return (
            <div className="py-12 text-center">
                <p className="text-destructive">Failed to load pages. Please try again.</p>
            </div>
        )
    }

    if (isLoading) {
        return (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 12 }).map((_, i) => (
                    <PageCardSkeleton key={i} />
                ))}
            </div>
        )
    }

    const pages = data || []

    if (pages.length === 0) {
        return (
            <div className="py-12 text-center">
                <p className="text-muted-foreground text-lg">
                    {query ? `No pages found for "${query}"` : 'No pages available'}
                </p>
            </div>
        )
    }

    return (
        <div>
            <p className="text-muted-foreground mb-4 text-sm">
                {query
                    ? `Found ${pages.length} results for "${query}"`
                    : `Showing ${pages.length} pages`}
            </p>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {data &&
                    data.map(page => (
                        <PageCard key={page.id} page={page} handleLoadPage={handleLoadPage} />
                    ))}
            </div>
        </div>
    )
}

function PageCard({ page, handleLoadPage }: { page: Page; handleLoadPage: HandleLoadPage }) {
    const statusColor = {
        published: 'bg-green-500/10 text-green-700 dark:text-green-400',
        draft: 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400',
        archived: 'bg-gray-500/10 text-gray-700 dark:text-gray-400',
    }

    const formattedDate = new Date(page.createdAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    })

    return (
        <Card className="flex flex-col overflow-hidden transition-shadow duration-300 hover:shadow-lg">
            <CardContent className="flex flex-1 flex-col p-6">
                <div className="mb-3 flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                        <FileText className="text-primary h-5 w-5" />
                        <Badge variant="secondary" className="text-xs">
                            {page.page_type}
                        </Badge>
                    </div>
                    <Badge className={statusColor[page.status!]} variant="outline">
                        {page.status}
                    </Badge>
                </div>

                <h3 className="mb-2 line-clamp-2 text-lg font-semibold text-balance">
                    {page.title}
                </h3>

                <div className="text-muted-foreground mb-3 flex flex-col gap-2 text-sm">
                    <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        <span>Brighton Mboya</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <span>{formattedDate}</span>
                    </div>
                </div>

                <p className="text-muted-foreground mb-4 line-clamp-3 flex-1 text-sm text-pretty">
                    {page.content}
                </p>

                <div className="flex items-center justify-between border-t pt-3">
                    <span className="text-muted-foreground text-xs">
                        {/*{page.views.toLocaleString()} views*/}
                    </span>
                    <Button
                        variant="ghost"
                        className="text-primary flex items-center gap-1 text-base hover:underline"
                        size="sm"
                        onClick={() => handleLoadPage(page)}
                    >
                        Edit
                        <ExternalLink className="h-3 w-3" />
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}

function PageCardSkeleton() {
    return (
        <Card className="overflow-hidden">
            <CardContent className="p-6">
                <div className="mb-3 flex items-start justify-between">
                    <Skeleton className="h-5 w-24" />
                    <Skeleton className="h-5 w-20" />
                </div>
                <Skeleton className="mb-3 h-6 w-3/4" />
                <div className="mb-3 flex flex-col gap-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-28" />
                </div>
                <Skeleton className="mb-4 h-16 w-full" />
                <Skeleton className="h-4 w-full" />
            </CardContent>
        </Card>
    )
}
