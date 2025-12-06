'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import TourCard from '@/app/safaris/[country]/[modifier]/_components/TourCard'
import {
    type FilterState,
    TourFilters,
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

interface ToursPageProps {
    initialCountry?: string
}

export default function ToursPage({ initialCountry }: ToursPageProps) {
    const router = useRouter()
    const searchParams = useSearchParams()

    // 🔹 Default Values
    const DEFAULT_MIN_PRICE = 0
    const DEFAULT_MAX_PRICE = 5000
    const DEFAULT_MIN_DAYS = 1
    const DEFAULT_MAX_DAYS = 15

    // 🔹 Helper to update the URL
    const updateUrl = (
        params: Record<string, string | string[] | undefined>,
    ) => {
        const newParams = new URLSearchParams(searchParams.toString())

        for (const key in params) {
            const value = params[key]
            
            // Check for default values to exclude from URL
            let isDefault = false
            if (key === 'minPrice' && Number(value) === DEFAULT_MIN_PRICE) isDefault = true
            if (key === 'maxPrice' && Number(value) === DEFAULT_MAX_PRICE) isDefault = true
            if (key === 'minDays' && Number(value) === DEFAULT_MIN_DAYS) isDefault = true
            if (key === 'maxDays' && Number(value) === DEFAULT_MAX_DAYS) isDefault = true
            if (key === 'page' && Number(value) === 1) isDefault = true
            if (key === 'country' && value === initialCountry) isDefault = true

            if (!value || (Array.isArray(value) && value.length === 0) || isDefault) {
                newParams.delete(key)
            } else if (Array.isArray(value)) {
                newParams.set(key, value.join(','))
            } else {
                newParams.set(key, value as string)
            }
        }

        router.push(`?${newParams.toString()}`, { scroll: false })
    }

    // 🔹 Hydrate state from URL on first load
    const [searchQuery, setSearchQuery] = useState(
        searchParams.get('search') || '',
    )
    const [npFilter, setNpFilter] = useState(searchParams.get('np') || '')
    const [filters, setFilters] = useState<FilterState>({
        priceRange: [
            Number(searchParams.get('minPrice') || DEFAULT_MIN_PRICE),
            Number(searchParams.get('maxPrice') || DEFAULT_MAX_PRICE),
        ],
        daysRange: [
            Number(searchParams.get('minDays') || DEFAULT_MIN_DAYS),
            Number(searchParams.get('maxDays') || DEFAULT_MAX_DAYS),
        ],
        selectedCountries: searchParams.get('country')
            ? searchParams.get('country')!.split(',')
            : initialCountry
              ? [initialCountry]
              : [],
        selectedTags: searchParams.get('tags')
            ? searchParams.get('tags')!.split(',')
            : [],
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
                np: npFilter || '',
                minPrice: filters.priceRange[0].toString(),
                maxPrice: filters.priceRange[1].toString(),
                minDays: filters.daysRange[0].toString(),
                maxDays: filters.daysRange[1].toString(),
                page: page.toString(),
                limit: '12',
                country:
                    filters.selectedCountries.length > 0
                        ? filters.selectedCountries.join(',')
                        : '',
                tags:
                    filters.selectedTags.length > 0
                        ? filters.selectedTags.join(',')
                        : '',
            }

            // 🔑 Update URL so link is sharable
            updateUrl(params)

            try {
                const response = await fetch(
                    `/api/tours?${new URLSearchParams(params)}`,
                )
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
        [searchQuery, filters],
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
        setNpFilter('')
        setPagination((prev) => ({ ...prev, currentPage: 1 }))

        router.push('?', { scroll: false }) // reset URL completely
    }

    const handlePageChange = (page: number) => {
        fetchTours(page)
    }

    return (
        <div className="bg-background min-h-screen">
            <div className="container mx-auto px-4 py-8">
                <div className="flex flex-col gap-8 lg:flex-row">
                    {/* Filters Sidebar */}
                    <aside className="flex-shrink-0 lg:w-80">
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
                            <div className="py-12 text-center">
                                <div className="border-primary mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2"></div>
                                <p className="text-muted-foreground">
                                    Loading tours...
                                </p>
                            </div>
                        ) : tours.length === 0 ? (
                            <div className="py-12 text-center">
                                <div className="mb-4 text-6xl">🔍</div>
                                <h3 className="text-foreground mb-2 text-xl font-semibold">
                                    No tours found
                                </h3>
                                <p className="text-muted-foreground mb-4 text-pretty">
                                    Try adjusting your filters or search terms
                                    to find more tours.
                                </p>
                                <Button
                                    onClick={clearFilters}
                                    variant="outline"
                                >
                                    Clear All Filters
                                </Button>
                            </div>
                        ) : (
                            <>
                                <div className="mb-6 flex items-center justify-between">
                                    <h2 className="text-foreground text-xl font-semibold">
                                        Showing {tours.length} of{' '}
                                        {pagination.totalCount} tours
                                    </h2>
                                </div>

                                <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2">
                                    {tours.map((tour) => (
                                        <TourCard
                                            key={tour.id}
                                            tour={{
                                                ...tour,
                                                slug: tour.slug || '',
                                            }}
                                        />
                                    ))}
                                </div>

                                {pagination.totalPages > 1 && (
                                    <div className="flex items-center justify-center gap-2">
                                        <Button
                                            variant="outline"
                                            onClick={() =>
                                                handlePageChange(
                                                    pagination.currentPage - 1,
                                                )
                                            }
                                            disabled={
                                                !pagination.hasPreviousPage
                                            }
                                        >
                                            Previous
                                        </Button>

                                        <div className="flex items-center gap-1">
                                            {Array.from(
                                                {
                                                    length: pagination.totalPages,
                                                },
                                                (_, i) => i + 1,
                                            ).map((page) => (
                                                <Button
                                                    key={page}
                                                    variant={
                                                        page ===
                                                        pagination.currentPage
                                                            ? 'default'
                                                            : 'outline'
                                                    }
                                                    size="sm"
                                                    onClick={() =>
                                                        handlePageChange(page)
                                                    }
                                                    className="w-10"
                                                >
                                                    {page}
                                                </Button>
                                            ))}
                                        </div>

                                        <Button
                                            variant="outline"
                                            onClick={() =>
                                                handlePageChange(
                                                    pagination.currentPage + 1,
                                                )
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
