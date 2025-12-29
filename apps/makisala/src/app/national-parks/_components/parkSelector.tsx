'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { ChevronDownIcon, SlashIcon } from 'lucide-react'
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from '@repo/ui/breadcrumb'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@repo/ui/dropdown-menu'

interface Destination {
    id: string
    name: string
}

interface Park {
    id: string
    name: string
}

interface NationalParkBreadcrumbProps {
    allDestinations: Destination[]
    currentDestination: Destination
    currentPark: Park
    initialParks: Park[]
    currentPageType: string
}

export default function NationalParkBreadcrumb({
    allDestinations,
    currentDestination,
    currentPark,
    initialParks,
    currentPageType,
}: NationalParkBreadcrumbProps) {
    const router = useRouter()
    const [selectedDestinationId, setSelectedDestinationId] = useState(currentDestination.id)

    // React Query automatically refetches when selectedDestinationId changes!
    const { data: parks = initialParks, isLoading } = useQuery({
        queryKey: ['parks', selectedDestinationId],
        queryFn: async () => {
            const res = await fetch(`/api/parks/${selectedDestinationId}`)
            if (!res.ok) throw new Error('Failed to fetch parks')
            return res.json()
        },
        initialData: selectedDestinationId === currentDestination.id ? initialParks : undefined,
        staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    })

    const handleDestinationChange = (destinationId: string) => {
        setSelectedDestinationId(destinationId) // This triggers React Query to refetch!
    }

    const handleParkChange = (parkName: string) => {
        router.push(`/national-parks/${parkName}/${currentPageType}`)
    }

    const selectedDestination =
        allDestinations.find(d => d.id === selectedDestinationId) || currentDestination

    return (
        <Breadcrumb>
            <BreadcrumbList>
                <BreadcrumbItem>
                    <BreadcrumbLink asChild>
                        <Link href="/apps/makisala/public">Africa</Link>
                    </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator>
                    <SlashIcon />
                </BreadcrumbSeparator>

                {/* First Dropdown: Destinations */}
                <BreadcrumbItem>
                    <DropdownMenu>
                        <DropdownMenuTrigger className="flex items-center gap-1 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-3.5">
                            {selectedDestination.name}
                            <ChevronDownIcon />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start">
                            {allDestinations.map(destination => (
                                <DropdownMenuItem
                                    key={destination.id}
                                    onClick={() => handleDestinationChange(destination.id)}
                                    className={
                                        destination.id === selectedDestinationId ? 'bg-accent' : ''
                                    }
                                >
                                    {destination.name}
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </BreadcrumbItem>
                <BreadcrumbSeparator>
                    <SlashIcon />
                </BreadcrumbSeparator>

                {/* Second Dropdown: Parks */}
                <BreadcrumbItem>
                    <DropdownMenu>
                        <DropdownMenuTrigger className="flex items-center gap-1 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-3.5">
                            {currentPark.name}
                            <ChevronDownIcon />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start">
                            {isLoading ? (
                                <DropdownMenuItem disabled>Loading...</DropdownMenuItem>
                            ) : parks.length === 0 ? (
                                <DropdownMenuItem disabled>No parks available</DropdownMenuItem>
                            ) : (
                                parks.map(park => (
                                    <DropdownMenuItem
                                        key={park.id}
                                        onClick={() => handleParkChange(park.name)}
                                        className={park.id === currentPark.id ? 'bg-accent' : ''}
                                    >
                                        {park.name}
                                    </DropdownMenuItem>
                                ))
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </BreadcrumbItem>
                <BreadcrumbSeparator>
                    <SlashIcon />
                </BreadcrumbSeparator>

                {/* Current Page */}
                <BreadcrumbItem>
                    <BreadcrumbPage className="capitalize">{currentPageType}</BreadcrumbPage>
                </BreadcrumbItem>
            </BreadcrumbList>
        </Breadcrumb>
    )
}
