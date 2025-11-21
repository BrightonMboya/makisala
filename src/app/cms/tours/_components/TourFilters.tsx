'use client'

import { Input } from '@/components/ui/input'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { useDebounce } from '@/lib/hooks/use-debounce'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function TourFilters() {
    const searchParams = useSearchParams()
    const router = useRouter()
    const [searchTerm, setSearchTerm] = useState(searchParams.get('query')?.toString() || '')
    const debouncedSearchTerm = useDebounce(searchTerm, 300)

    useEffect(() => {
        const currentQuery = searchParams.get('query') || ''
        if (debouncedSearchTerm === currentQuery) return

        const params = new URLSearchParams(searchParams)
        if (debouncedSearchTerm) {
            params.set('query', debouncedSearchTerm)
        } else {
            params.delete('query')
        }
        params.set('page', '1') // Reset to page 1
        router.replace(`?${params.toString()}`)
    }, [debouncedSearchTerm, router, searchParams])

    const handleCountryChange = (value: string) => {
        const params = new URLSearchParams(searchParams)
        if (value && value !== 'all') {
            params.set('country', value)
        } else {
            params.delete('country')
        }
        params.set('page', '1')
        router.replace(`?${params.toString()}`)
    }

    const handleDaysChange = (value: string) => {
        const params = new URLSearchParams(searchParams)
        if (value === 'short') {
            params.set('maxDays', '5')
            params.delete('minDays')
        } else if (value === 'medium') {
            params.set('minDays', '6')
            params.set('maxDays', '10')
        } else if (value === 'long') {
            params.set('minDays', '11')
            params.delete('maxDays')
        } else {
            params.delete('minDays')
            params.delete('maxDays')
        }
        params.set('page', '1')
        router.replace(`?${params.toString()}`)
    }

    return (
        <div className="mb-6 flex flex-col gap-4 md:flex-row">
            <div className="flex-1">
                <Input
                    placeholder="Search tours..."
                    onChange={(e) => setSearchTerm(e.target.value)}
                    value={searchTerm}
                />
            </div>
            <div className="w-full md:w-48">
                <Select
                    onValueChange={handleCountryChange}
                    defaultValue={searchParams.get('country')?.toString() || 'all'}
                >
                    <SelectTrigger>
                        <SelectValue placeholder="Filter by Country" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Countries</SelectItem>
                        <SelectItem value="Tanzania">Tanzania</SelectItem>
                        {/* <SelectItem value="Kenya">Kenya</SelectItem>
                        <SelectItem value="Uganda">Uganda</SelectItem> */}
                        <SelectItem value="Rwanda">Rwanda</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <div className="w-full md:w-48">
                <Select
                    onValueChange={handleDaysChange}
                    defaultValue={
                        searchParams.get('maxDays') === '5'
                            ? 'short'
                            : searchParams.get('minDays') === '6'
                            ? 'medium'
                            : searchParams.get('minDays') === '11'
                            ? 'long'
                            : 'all'
                    }
                >
                    <SelectTrigger>
                        <SelectValue placeholder="Duration" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Any Duration</SelectItem>
                        <SelectItem value="short">Short (1-5 days)</SelectItem>
                        <SelectItem value="medium">Medium (6-10 days)</SelectItem>
                        <SelectItem value="long">Long (11+ days)</SelectItem>
                    </SelectContent>
                </Select>
            </div>
        </div>
    )
}
