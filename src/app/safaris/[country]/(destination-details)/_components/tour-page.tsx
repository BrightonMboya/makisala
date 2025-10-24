'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import TourCard from '@/app/safaris/[country]/[modifier]/_components/TourCard'
import {
    TourFilters,
    type FilterState,
} from '@/app/safaris/[country]/(destination-details)/_components/tour-filter'
import { Button } from '@/components/ui/button'
import { type Tours } from '@/db'

interface ToursResponse {
    tours: Tours[]
    pagination: {
        currentPage: number
        totalPages: number
        totalCount: number
        hasNextPage: boolean
        hasPreviousPage: boolean
    }
}

export default function ToursPage() {
    const router = useRouter()
    const searchParams = useSearchParams()

    // 🔹 Helper to update the URL
    const updateUrl = (params: Record<string, string | string[] | undefined>) => {
        const newParams = new URLSearchParams(searchParams.toString())

        for (const key in params) {
            const value = params[key]
            if (!value || (Array.isArray(value) && value.length === 0)) {
                newParams.delete(key)
            } else if (Array.isArray(value)) {
                newParams.set(key, value.join(','))
            } else {
                newParams.set(key, value)
            }
        }

        router.push(`?${newParams.toString()}`, { scroll: false })
    }

    // 🔹 Hydrate state from URL on first load
    const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '')
    const [filters, setFilters] = useState<FilterState>({
        priceRange: [
            Number(searchParams.get('minPrice') || 0),
            Number(searchParams.get('maxPrice') || 5000),
        ],
        daysRange: [
            Number(searchParams.get('minDays') || 1),
            Number(searchParams.get('maxDays') || 15),
        ],
        selectedCountries: searchParams.get('country')
            ? searchParams.get('country')!.split(',')
            : [],
        selectedTags: searchParams.get('tags') ? searchParams.get('tags')!.split(',') : [],
    })

    const [tours, setTours] = useState<Tours[]>([])
    const [pagination, setPagination] = useState({
        currentPage: Number(searchParams.get('page') || 1),
        totalPages: 1,
        totalCount: 0,
        hasNextPage: false,
        hasPreviousPage: false,
    })
    const [isLoading, setIsLoading] = useState(true)

    const fetchTours = useCallback(
        async (page = 1) => {
            setIsLoading(true)

            const params = {
                search: searchQuery || '',
                minPrice: filters.priceRange[0].toString(),
                maxPrice: filters.priceRange[1].toString(),
                minDays: filters.daysRange[0].toString(),
                maxDays: filters.daysRange[1].toString(),
                page: page.toString(),
                limit: '12',
                country:
                    filters.selectedCountries.length > 0 ? filters.selectedCountries.join(',') : '',
                tags: filters.selectedTags.length > 0 ? filters.selectedTags.join(',') : '',
            }

            // 🔑 Update URL so link is sharable
            updateUrl(params)

            try {
                const response = await fetch(`/api/tours?${new URLSearchParams(params as any)}`)
                const data: ToursResponse = await response.json()

                setTours(data.tours)
                setPagination(data.pagination)
            } catch (error) {
                console.error('Failed to fetch tours:', error)
                setTours([])
            } finally {
                setIsLoading(false)
            }
        },
        [searchQuery, filters]
    )

    useEffect(() => {
        fetchTours(pagination.currentPage) // refresh results when filters/search change
    }, [fetchTours])

    // 🔹 Reset filters + clear URL params
    const clearFilters = () => {
        setFilters({
            priceRange: [0, 5000],
            daysRange: [1, 15],
            selectedCountries: [],
            selectedTags: [],
        })
        setSearchQuery('')
        setPagination(prev => ({ ...prev, currentPage: 1 }))

        router.push('?', { scroll: false }) // reset URL completely
    }

    const handlePageChange = (page: number) => {
        fetchTours(page)
    }

    return (
        <div className="min-h-screen bg-background">
            <div className="container mx-auto px-4 py-8">
                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Filters Sidebar */}
                    <aside className="lg:w-80 flex-shrink-0">
                        <div className="sticky top-8">
                            <TourFilters
                                filters={filters}
                                onFiltersChange={setFilters}
                                onClearFilters={clearFilters}
                            />
                            <Button
                                onClick={clearFilters}
                                variant="outline"
                                className="mt-4 w-full"
                            >
                                Reset All Filters
                            </Button>
                        </div>
                    </aside>

                    {/* Tours Grid */}
                    <main className="flex-1">
                        {isLoading ? (
                            <div className="text-center py-12">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                                <p className="text-muted-foreground">Loading tours...</p>
                            </div>
                        ) : tours.length === 0 ? (
                            <div className="text-center py-12">
                                <div className="text-6xl mb-4">🔍</div>
                                <h3 className="text-xl font-semibold text-foreground mb-2">
                                    No tours found
                                </h3>
                                <p className="text-muted-foreground mb-4 text-pretty">
                                    Try adjusting your filters or search terms to find more tours.
                                </p>
                                <Button onClick={clearFilters} variant="outline">
                                    Clear All Filters
                                </Button>
                            </div>
                        ) : (
                            <>
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-xl font-semibold text-foreground">
                                        Showing {tours.length} of {pagination.totalCount} tours
                                    </h2>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                                    {tours.map(tour => (
                                        <TourCard key={tour.id} tour={tour} />
                                    ))}
                                </div>

                                {pagination.totalPages > 1 && (
                                    <div className="flex items-center justify-center gap-2">
                                        <Button
                                            variant="outline"
                                            onClick={() =>
                                                handlePageChange(pagination.currentPage - 1)
                                            }
                                            disabled={!pagination.hasPreviousPage}
                                        >
                                            Previous
                                        </Button>

                                        <div className="flex items-center gap-1">
                                            {Array.from(
                                                { length: pagination.totalPages },
                                                (_, i) => i + 1
                                            ).map(page => (
                                                <Button
                                                    key={page}
                                                    variant={
                                                        page === pagination.currentPage
                                                            ? 'default'
                                                            : 'outline'
                                                    }
                                                    size="sm"
                                                    onClick={() => handlePageChange(page)}
                                                    className="w-10"
                                                >
                                                    {page}
                                                </Button>
                                            ))}
                                        </div>

                                        <Button
                                            variant="outline"
                                            onClick={() =>
                                                handlePageChange(pagination.currentPage + 1)
                                            }
                                            disabled={!pagination.hasNextPage}
                                        >
                                            Next
                                        </Button>
                                    </div>
                                )}
                            </>
                        )}
                    </main>
                </div>
            </div>
        </div>
    )
}
