'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Badge } from '@/components/ui/badge'
import { X, Filter } from 'lucide-react'
import { countries, tour_tags as tags } from '@/lib/p_seo_info'
import { capitalize } from '@/lib/utils'

export interface FilterState {
    priceRange: [number, number]
    daysRange: [number, number]
    selectedCountries: string[]
    selectedTags: string[]
}

interface TourFiltersProps {
    filters: FilterState
    onFiltersChange: (filters: FilterState) => void
    onClearFilters: () => void
}

export function TourFilters({ filters, onFiltersChange, onClearFilters }: TourFiltersProps) {
    const [isCollapsed, setIsCollapsed] = useState(false)
    const [debouncedFilters, setDebouncedFilters] = useState(filters)

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedFilters(filters)
        }, 300)

        return () => clearTimeout(timer)
    }, [filters])

    useEffect(() => {
        onFiltersChange(debouncedFilters)
    }, [debouncedFilters, onFiltersChange])

    const updateFilters = (updates: Partial<FilterState>) => {
        const newFilters = { ...filters, ...updates }
        onFiltersChange(newFilters)
    }

    const handleCountryChange = (country: string, checked: boolean) => {
        const newCountries = checked
            ? [...filters.selectedCountries, country]
            : filters.selectedCountries.filter(c => c !== country)
        updateFilters({ selectedCountries: newCountries })
    }

    const handleTagChange = (tag: string, checked: boolean) => {
        const newTags = checked
            ? [...filters.selectedTags, tag]
            : filters.selectedTags.filter(t => t !== tag)
        updateFilters({ selectedTags: newTags })
    }

    const activeFiltersCount =
        (filters.priceRange[0] > 0 || filters.priceRange[1] < 5000 ? 1 : 0) +
        (filters.daysRange[0] > 1 || filters.daysRange[1] < 15 ? 1 : 0) +
        filters.selectedCountries.length +
        filters.selectedTags.length

    return (
        <Card className="bg-card border-border">
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-bold text-card-foreground flex items-center gap-2">
                        <Filter className="w-5 h-5" />
                        Filters
                        {activeFiltersCount > 0 && (
                            <Badge variant="secondary" className="ml-2">
                                {activeFiltersCount}
                            </Badge>
                        )}
                    </CardTitle>
                    <div className="flex gap-2">
                        {activeFiltersCount > 0 && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={onClearFilters}
                                className="text-muted-foreground hover:text-foreground"
                            >
                                Clear All
                            </Button>
                        )}
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setIsCollapsed(!isCollapsed)}
                            className="lg:hidden"
                        >
                            {isCollapsed ? 'Show' : 'Hide'}
                        </Button>
                    </div>
                </div>
            </CardHeader>

            <CardContent className={`space-y-6 ${isCollapsed ? 'hidden lg:block' : ''}`}>
                {/* Price Range */}
                <div className="space-y-3">
                    <Label className="text-sm font-semibold text-card-foreground">
                        Price Range: ${filters.priceRange[0]} - ${filters.priceRange[1]}
                    </Label>
                    <Slider
                        value={filters.priceRange}
                        onValueChange={value =>
                            updateFilters({ priceRange: value as [number, number] })
                        }
                        max={5000}
                        min={0}
                        step={100}
                        className="w-full"
                    />
                </div>

                {/* Days Range */}
                <div className="space-y-3">
                    <Label className="text-sm font-semibold text-card-foreground">
                        Duration: {filters.daysRange[0]} - {filters.daysRange[1]} days
                    </Label>
                    <Slider
                        value={filters.daysRange}
                        onValueChange={value =>
                            updateFilters({ daysRange: value as [number, number] })
                        }
                        max={15}
                        min={1}
                        step={1}
                        className="w-full"
                    />
                </div>

                {/* Countries */}
                <div className="space-y-3">
                    <Label className="text-sm font-semibold text-card-foreground">
                        Destinations
                    </Label>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                        {countries.map(country => (
                            <div key={country} className="flex items-center space-x-2">
                                <Checkbox
                                    id={`country-${country}`}
                                    checked={filters.selectedCountries.includes(country)}
                                    onCheckedChange={checked =>
                                        handleCountryChange(country, checked as boolean)
                                    }
                                />
                                <Label
                                    htmlFor={`country-${country}`}
                                    className="text-sm text-muted-foreground cursor-pointer"
                                >
                                    {capitalize(country)}
                                </Label>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Tags */}
                <div className="space-y-3">
                    <Label className="text-sm font-semibold text-card-foreground">Categories</Label>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                        {tags.map(tag => (
                            <div key={tag} className="flex items-center space-x-2">
                                <Checkbox
                                    id={`tag-${tag}`}
                                    checked={filters.selectedTags.includes(tag)}
                                    onCheckedChange={checked =>
                                        handleTagChange(tag, checked as boolean)
                                    }
                                />
                                <Label
                                    htmlFor={`tag-${tag}`}
                                    className="text-sm text-muted-foreground cursor-pointer capitalize"
                                >
                                    {capitalize(tag)}
                                </Label>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Active Filters */}
                {activeFiltersCount > 0 && (
                    <div className="space-y-3 pt-3 border-t border-border">
                        <Label className="text-sm font-semibold text-card-foreground">
                            Active Filters
                        </Label>
                        <div className="flex flex-wrap gap-2">
                            {filters.selectedCountries.map(country => (
                                <Badge
                                    key={country}
                                    variant="secondary"
                                    className="flex items-center gap-1"
                                >
                                    {country}
                                    <X
                                        className="w-3 h-3 cursor-pointer"
                                        onClick={() => handleCountryChange(country, false)}
                                    />
                                </Badge>
                            ))}
                            {filters.selectedTags.map(tag => (
                                <Badge
                                    key={tag}
                                    variant="secondary"
                                    className="flex items-center gap-1"
                                >
                                    {tag}
                                    <X
                                        className="w-3 h-3 cursor-pointer"
                                        onClick={() => handleTagChange(tag, false)}
                                    />
                                </Badge>
                            ))}
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
