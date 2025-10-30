'use client'

import React from 'react'
import Image from 'next/image'
import {
    ChevronDown,
    Home,
    Shirt,
    Sparkles,
    Trees,
    Utensils,
    UtensilsCrossed,
    Waves,
    Wifi,
} from 'lucide-react'

interface Accommodation {
    id: string
    name: string
    url: string
    overview: string
    images?: { imageUrl: string; alt?: string }[]
}

interface ItineraryAccommodation {
    id: string
    itineraryDayId: string
    accommodationId: string
    accommodation: Accommodation
}

interface Props {
    dayNumber: number
    dayTitle: string
    overview: string
    itineraryAccommodations?: ItineraryAccommodation[]

    // Optional additional props
    mealPlan?: string[]
    note?: string
}

// Amenity icon mapping
const amenityIconMap: Record<string, React.ReactNode> = {
    wifi: <Wifi className="mr-1 inline-block h-3 w-3" />,
    'swimming pool': <Waves className="mr-1 inline-block h-3 w-3" />,
    laundry: <Shirt className="mr-1 inline-block h-3 w-3" />,
    'wildlife area': <Trees className="mr-1 inline-block h-3 w-3" />,
    spa: <Sparkles className="mr-1 inline-block h-3 w-3" />,
    restaurant: <UtensilsCrossed className="mr-1 inline-block h-3 w-3" />,
}

const ItineraryAccordion: React.FunctionComponent<Props> = ({
    dayNumber,
    dayTitle,
    overview,
    itineraryAccommodations = [],
    mealPlan,
    note,
}) => {
    const [toggle, setToggle] = React.useState(true)
    const [hotelOpen, setHotelOpen] = React.useState(false)

    const accommodationData = itineraryAccommodations?.[0]?.accommodation

    // Normalize amenity labels for icon mapping
    const renderAmenityChip = (label: string, idx: number) => {
        const key = label.trim().toLowerCase()
        const icon = amenityIconMap[key]
        return (
            <span
                key={`${label}-${idx}`}
                className="bg-lighter text-darker border-dark/50 font-raleway inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs"
                title={label}
            >
                {icon ? icon : null}
                {label}
            </span>
        )
    }

    return (
        <div className="relative">
            {/* Header (clickable) */}
            <div
                className="flex cursor-pointer items-center justify-between rounded-3xl p-2 pl-3"
                onClick={() => {
                    setToggle(!toggle)
                }}
            >
                <div className="flex flex-row items-center gap-4">
                    {/* Day badge with small DAY label */}
                    <div className="relative">
                        <div className="border-primary text-primary flex h-10 w-10 items-center justify-center rounded-full border-2 font-bold md:h-12 md:w-12">
                            <span className="text-lg">{dayNumber}</span>
                        </div>
                        <span className="bg-primary font-raleway absolute -bottom-1.5 left-1/2 -translate-x-1/2 rounded px-1 py-1 text-[0.6rem] leading-none text-white">
                            Day
                        </span>
                    </div>
                    <h6 className="line-clamp-1 p-2 text-lg md:text-3xl">
                        {dayTitle}
                    </h6>
                </div>

                <ChevronDown
                    className={`mr-2 h-5 w-5 transition-transform ${toggle ? 'rotate-180' : ''}`}
                />
            </div>

            {toggle && (
                <div className="overflow-hidden">
                    {/* Timeline rail */}
                    <div className="relative pl-6 md:pl-10">
                        <div className="border-primary absolute top-4 bottom-0 left-9 border-l-2 border-dashed max-md:hidden" />
                        <div className="ml-2 flex flex-col gap-5 py-4 md:ml-4">
                            <p>{overview}</p>

                            {/* Note */}
                            {note && (
                                <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                                    <div className="mb-2 flex items-start gap-2">
                                        <Home className="h-4 w-4 text-amber-600" />
                                        <p className="text-sm font-semibold text-amber-800">
                                            Note
                                        </p>
                                    </div>
                                    <p className="text-sm text-amber-800">
                                        {note}
                                    </p>
                                </div>
                            )}

                            {accommodationData && (
                                <div className="flex flex-col gap-2">
                                    <p className="text-neutral-600 italic">
                                        Accommodation
                                    </p>
                                    <p className="font-extrabold uppercase">
                                        {accommodationData.name}
                                    </p>
                                    {accommodationData.url && (
                                        <a
                                            href={accommodationData.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-primary text-sm underline hover:no-underline"
                                        >
                                            Visit Website
                                        </a>
                                    )}
                                </div>
                            )}

                            {accommodationData?.images &&
                                accommodationData.images.length > 0 && (
                                    <div className="grid grid-cols-2 gap-3">
                                        {accommodationData.images
                                            // .slice(0, 6)
                                            .map((img, idx) => (
                                                <div
                                                    key={idx}
                                                    className="relative h-40 w-full md:h-48"
                                                >
                                                    <Image
                                                        src={
                                                            img.imageUrl ||
                                                            '/placeholder.svg'
                                                        }
                                                        alt={
                                                            img.alt ??
                                                            accommodationData.name ??
                                                            `Gallery ${idx + 1}`
                                                        }
                                                        fill
                                                        className="rounded-xl object-cover"
                                                        sizes="(max-width: 768px) 100vw, 600px"
                                                    />
                                                </div>
                                            ))}
                                    </div>
                                )}

                            {/* Meal Plan */}
                            {Array.isArray(mealPlan) && mealPlan.length > 0 && (
                                <div className="flex items-center gap-2">
                                    <Utensils
                                        size={22}
                                        className="text-neutral-700"
                                    />
                                    <div className="flex flex-wrap items-center gap-1">
                                        <p className="mr-1 text-neutral-600 italic">
                                            Meal Plan:
                                        </p>
                                        {mealPlan.map((food, index) => (
                                            <span
                                                key={index}
                                                className="bg-lighter text-darker border-dark/50 font-raleway rounded-full border px-2 py-1 text-xs"
                                            >
                                                {food}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {accommodationData?.overview && (
                                <div className="border-dark/50 rounded-xl border">
                                    <button
                                        onClick={() => setHotelOpen((v) => !v)}
                                        className="flex w-full items-center justify-between px-4 py-2 text-left text-sm"
                                    >
                                        <span>Hotel&apos;s Description</span>
                                        <span
                                            className={`transition-transform ${hotelOpen ? 'rotate-180' : ''}`}
                                        >
                                            <ChevronDown
                                                size={14}
                                                className="text-dark/50"
                                            />
                                        </span>
                                    </button>
                                    {hotelOpen && (
                                        <div className="font-raleway px-4 pb-3 text-sm text-neutral-700">
                                            {accommodationData.overview}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default ItineraryAccordion
