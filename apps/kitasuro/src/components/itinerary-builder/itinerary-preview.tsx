'use client'

import React from 'react'
import Image from 'next/image'
import { format, addDays } from 'date-fns'
import { 
    Calendar, 
    MapPin, 
    Users, 
    Clock, 
    DollarSign,
    Utensils,
    BedDouble,
    Mountain,
    Camera,
    Map,
    X,
    Check
} from 'lucide-react'
import { ItineraryMap } from './itinerary-map'
import { 
    type Day, 
    type TravelerGroup, 
    type PricingRow, 
    type ExtraOption 
} from './builder-context'
import { 
    accommodationDetails, 
    activityDetails, 
    destinationDetails 
} from '@/lib/data/itinerary-data'
import { cn } from '@/lib/utils'

export function ItineraryPreview({
    days,
    startDate,
    travelerGroups,
    tourType,
    pricingRows,
    extras,
    clientName,
    tourTitle = "Your Safari Adventure",
    isPublic = false,
    className,
    inclusions,
    exclusions
}: {
    days: Day[]
    startDate: Date | undefined
    travelerGroups: TravelerGroup[]
    tourType: string
    pricingRows: PricingRow[]
    extras: ExtraOption[]
    clientName: string
    tourTitle?: string
    isPublic?: boolean
    className?: string
    inclusions?: string[]
    exclusions?: string[]
}) {
    // Calculations
    const totalDuration = days.length
    const endDate = startDate ? addDays(startDate, totalDuration - 1) : undefined

    const totalPrice = pricingRows.reduce((acc, row) => acc + (row.unitPrice * row.count), 0) + 
                       extras.filter(e => e.selected).reduce((acc, e) => acc + e.price, 0)
    
    const heroImage = (days.length > 0 && days[0].destination && destinationDetails[days[0].destination]) 
        ? destinationDetails[days[0].destination].image 
        : "https://images.unsplash.com/photo-1516426122078-c23e76319801?q=80&w=2000&auto=format&fit=crop"

    return (
        <div className={cn("max-w-5xl mx-auto space-y-16 pb-24 font-sans text-stone-800 bg-white", className)}>
            
            {/* Header / Hero Section */}
            <div className="relative h-[60vh] w-full overflow-hidden rounded-b-3xl">
                {/* Fallback hero image or dynamic one based on first destination */}
                <Image
                    src={heroImage}
                    alt="Safari Hero"
                    fill
                    className="object-cover"
                    priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                
                <div className="absolute bottom-0 left-0 right-0 p-8 md:p-16 text-white space-y-6">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 text-xs font-medium uppercase tracking-wider">
                        <span>{tourType}</span>
                    </div>
                    <h1 className="text-4xl md:text-6xl font-serif font-bold leading-tight">
                        {tourTitle || "Your Safari Adventure"}
                    </h1>
                    {clientName && (
                        <p className="text-lg md:text-xl font-light text-white/90">
                            Prepared exclusively for <span className="font-semibold italic">{clientName}</span>
                        </p>
                    )}
                    
                    <div className="flex flex-wrap gap-6 pt-4 text-sm font-medium tracking-wide uppercase text-white/80">
                        <div className="flex items-center gap-2">
                            <Clock className="w-5 h-5" />
                            <span>{totalDuration} Days / {totalDuration - 1} Nights</span>
                        </div>
                        {startDate && endDate && (
                            <div className="flex items-center gap-2">
                                <Calendar className="w-5 h-5" />
                                <span>{format(startDate, 'MMM d, yyyy')} - {format(endDate, 'MMM d, yyyy')}</span>
                            </div>
                        )}
                        <div className="flex items-center gap-2">
                            <Users className="w-5 h-5" />
                            <span>{travelerGroups.reduce((acc, g) => acc + g.count, 0)} Travelers</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="px-6 md:px-12 grid grid-cols-1 lg:grid-cols-[1fr_350px] gap-16">
                
                {/* Left Column: Itinerary Details */}
                <div className="space-y-16">
                    
                    {/* Introduction / Summary */}
                    <div className="prose prose-stone max-w-none">
                        <p className="text-xl leading-relaxed text-stone-600 font-light">
                            Welcome to your personalized itinerary. This journey has been carefully curated to offer you the best of Rwanda's landscapes, wildlife, and culture. From the vibrant streets of Kigali to the misty volcanoes and savannah plains, get ready for an unforgettable adventure.
                        </p>

                        {/* Interactive Map Section */}
                        <div className="mb-12 border rounded-2xl overflow-hidden shadow-sm border-stone-100">
                            <div className="bg-stone-50 px-6 py-4 border-b border-stone-100 flex items-center gap-2">
                                <Map className="w-5 h-5 text-green-600" />
                                <h3 className="text-lg font-bold font-serif text-stone-900">Your Route</h3>
                            </div>
                            <ItineraryMap days={days} className="border-0 shadow-none rounded-none" />
                        </div>
                    </div>

                    {/* Day by Day Plan */}
                    <div className="space-y-12">
                        <div className="flex items-center gap-4">
                            <h2 className="text-2xl font-serif font-bold text-stone-900">Daily Itinerary</h2>
                            <div className="h-px flex-1 bg-stone-200" />
                        </div>

                        <div className="space-y-12">
                            {days.map((day, index) => {
                                const currentDate = startDate ? addDays(startDate, index) : null
                                const richDestination = day.destination ? destinationDetails[day.destination] : null
                                const richAccommodation = day.accommodation ? accommodationDetails[day.accommodation] : null

                                return (
                                    <div key={day.id} className="relative pl-8 md:pl-12 border-l border-stone-200 pb-12 last:pb-0 last:border-0">
                                        {/* Day Marker */}
                                        <div className="absolute -left-[17px] top-0 flex items-center justify-center w-9 h-9 rounded-full bg-stone-900 text-white font-bold text-sm shadow-lg ring-4 ring-white">
                                            {day.dayNumber}
                                        </div>

                                        <div className="space-y-8">
                                            {/* Date & Destination Header */}
                                            <div>
                                                <div className="flex flex-col md:flex-row md:items-baseline gap-2 md:gap-4 mb-2">
                                                    <span className="text-sm font-bold uppercase tracking-widest text-green-700">
                                                        {currentDate ? format(currentDate, 'EEEE, MMMM do') : `Day ${day.dayNumber}`}
                                                    </span>
                                                    {day.destination && (
                                                         <span className="text-sm text-stone-400 font-medium flex items-center gap-1">
                                                            <MapPin className="w-3 h-3" />
                                                            {nationalParksMap[day.destination] || day.destination}
                                                         </span>
                                                    )}
                                                </div>
                                                <h3 className="text-2xl font-bold text-stone-900 mb-4">
                                                    {richDestination && day.destination ? `Explore ${nationalParksMap[day.destination] || day.destination}` : (day.activities[0]?.name || "Leisure Day")}
                                                </h3>
                                                
                                                {/* Day Narrative / Description */}
                                                {day.description && (
                                                    <div className="prose prose-stone prose-sm max-w-none mb-6">
                                                        <p className="text-stone-600 leading-relaxed whitespace-pre-wrap">
                                                            {day.description}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Destination Highlight if New or Main (Keep existing logic, but maybe move it after narrative) */}
                                            {richDestination && !day.description && (
                                                <div className="group relative h-64 w-full overflow-hidden rounded-2xl mb-6">
                                                    <Image
                                                        src={richDestination.image}
                                                        alt={day.destination || "Destination"}
                                                        fill
                                                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                                                    />
                                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-6">
                                                        <p className="text-white text-sm md:text-base leading-relaxed line-clamp-3">
                                                            {richDestination.description}
                                                        </p>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Activities List */}
                                            {day.activities.length > 0 && (
                                                <div className="space-y-4">
                                                    <h4 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-stone-500">
                                                        <Camera className="w-4 h-4" /> Today's Highlights
                                                    </h4>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        {day.activities.map(activity => {
                                                            const richActivity = activityDetails[activity.name]
                                                            const description = activity.description || richActivity?.description
                                                            const imageUrl = activity.imageUrl || (richActivity?.image) // We don't have richActivity.image in the type yet but assuming for future or if added.
                                                            // Actually activityDetails in itinerary-data.ts has 'description' and 'image' (generic).

                                                            return (
                                                                <div key={activity.id} className="bg-stone-50 rounded-xl overflow-hidden hover:shadow-md transition-shadow duration-300 border border-stone-100">
                                                                    {imageUrl && (
                                                                        <div className="relative h-40 w-full">
                                                                            <Image 
                                                                                src={imageUrl} 
                                                                                alt={activity.name}
                                                                                fill
                                                                                className="object-cover"
                                                                            />
                                                                            <div className="absolute top-2 right-2">
                                                                                <span className="text-[10px] bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full uppercase tracking-wide font-bold text-stone-800 shadow-sm">
                                                                                    {activity.moment}
                                                                                </span>
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                    <div className="p-4 space-y-3">
                                                                        {!imageUrl && (
                                                                             <div className="flex justify-between items-start">
                                                                                <span className="text-[10px] bg-stone-200 px-2 py-1 rounded-full uppercase tracking-wide font-medium text-stone-600">
                                                                                    {activity.moment}
                                                                                </span>
                                                                            </div>
                                                                        )}
                                                                        <div>
                                                                            <h5 className="font-bold text-stone-800 text-lg leading-tight mb-1">{activity.name}</h5>
                                                                            {activity.isOptional && (
                                                                                <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider border border-amber-200 px-1.5 py-0.5 rounded">Optional</span>
                                                                            )}
                                                                        </div>
                                                                        
                                                                        {description && (
                                                                            <p className="text-xs text-stone-600 leading-relaxed line-clamp-4">
                                                                                {description}
                                                                            </p>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            )
                                                        })}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Accommodation & Meals */}
                                            <div className="flex flex-col md:flex-row gap-4">
                                                {/* Accommodation Card */}
                                                <div className="flex-1 bg-white border border-stone-100 rounded-xl p-4 shadow-sm flex gap-4 items-start">
                                                    {(richAccommodation || day.accommodationImage) && (
                                                        <div className="relative w-20 h-20 shrink-0 rounded-lg overflow-hidden bg-stone-100">
                                                            <Image 
                                                                src={day.accommodationImage || richAccommodation?.image || ''}
                                                                alt={richAccommodation?.name || "Accommodation"}
                                                                fill
                                                                className="object-cover"
                                                            />
                                                        </div>
                                                    )}
                                                    <div>
                                                        <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-stone-400 mb-1">
                                                            <BedDouble className="w-3 h-3" /> Accommodation
                                                        </h4>
                                                        <p className="font-bold text-stone-800 text-lg">
                                                            {richAccommodation ? richAccommodation.name : (day.accommodation || "To be confirmed")}
                                                        </p>
                                                        {richAccommodation && (
                                                            <div className="flex flex-wrap gap-2 mt-2">
                                                                {richAccommodation.amenities.slice(0, 3).map(am => (
                                                                    <span key={am} className="text-[10px] bg-green-50 text-green-700 px-1.5 py-0.5 rounded border border-green-100">
                                                                        {am}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Meals Card */}
                                                <div className="md:w-1/3 bg-stone-50 rounded-xl p-4 flex flex-col justify-center">
                                                    <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-stone-400 mb-2">
                                                        <Utensils className="w-3 h-3" /> Meal Plan
                                                    </h4>
                                                    <div className="flex gap-2">
                                                        <MealIndicator label="B" active={day.meals.breakfast} full="Breakfast" />
                                                        <MealIndicator label="L" active={day.meals.lunch} full="Lunch" />
                                                        <MealIndicator label="D" active={day.meals.dinner} full="Dinner" />
                                                    </div>
                                                    <p className="text-xs text-stone-500 mt-2 italic">
                                                        Drinks not included unless specified
                                                    </p>
                                                </div>
                                            </div>

                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>

                </div>

                {/* Right Column: Sticky Summary & Pricing */}
                <div className="relative">
                    <div className="sticky top-8 space-y-8">
                        
                        {/* Inclusions & Exclusions */}
                        {(inclusions?.length || exclusions?.length) && (
                            <div className="bg-white border border-stone-200 rounded-2xl overflow-hidden shadow-sm">
                                {inclusions && inclusions.length > 0 && (
                                    <div className="p-6 space-y-4">
                                        <h3 className="font-bold text-stone-800 flex items-center gap-2 text-sm uppercase tracking-wider">
                                            <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center">
                                                <Check className="w-3 h-3 text-green-600" />
                                            </div>
                                            Included
                                        </h3>
                                        <ul className="space-y-2.5">
                                            {inclusions.map((item, idx) => (
                                                <li key={idx} className="flex items-start gap-2.5 text-sm text-stone-600">
                                                    <span className="mt-2 w-1 h-1 rounded-full bg-green-500 shrink-0" />
                                                    <span className="leading-snug">{item}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                                
                                {inclusions && exclusions && <div className="h-px bg-stone-100 mx-6" />}
                                
                                {exclusions && exclusions.length > 0 && (
                                    <div className="p-6 space-y-4 bg-stone-50/50">
                                        <h3 className="font-bold text-stone-800 flex items-center gap-2 text-sm uppercase tracking-wider">
                                            <div className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center">
                                                <X className="w-3 h-3 text-red-600" />
                                            </div>
                                            Excluded
                                        </h3>
                                        <ul className="space-y-2.5">
                                            {exclusions.map((item, idx) => (
                                                <li key={idx} className="flex items-start gap-2.5 text-sm text-stone-600">
                                                    <span className="mt-2 w-1 h-1 rounded-full bg-red-400 shrink-0" />
                                                    <span className="leading-snug">{item}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Pricing Summary */}
                        {!isPublic && (
                             <div className="bg-stone-900 text-white rounded-3xl p-8 space-y-6 shadow-xl">
                                <h3 className="text-lg font-serif font-bold flex items-center gap-2">
                                    <DollarSign className="w-5 h-5 text-green-400" />
                                    Investment Summary
                                </h3>

                                <div className="space-y-4 text-sm text-stone-300">
                                    {pricingRows.map(row => (
                                        <div key={row.id} className="flex justify-between items-center">
                                            <span>{row.count}x {row.type}</span>
                                            <span className="font-mono text-white">${(row.unitPrice * row.count).toLocaleString()}</span>
                                        </div>
                                    ))}
                                    
                                    {extras.filter(e => e.selected).length > 0 && (
                                        <>
                                            <div className="h-px bg-white/10 my-2" />
                                            <div className="text-xs font-bold uppercase tracking-wider text-stone-500 mb-2">Extras</div>
                                            {extras.filter(e => e.selected).map(extra => (
                                                 <div key={extra.id} className="flex justify-between items-center text-xs">
                                                    <span>{extra.name}</span>
                                                    <span className="font-mono text-white">${extra.price.toLocaleString()}</span>
                                                </div>
                                            ))}
                                        </>
                                    )}

                                    <div className="h-px bg-white/20 my-4" />
                                    
                                    <div className="flex justify-between items-baseline pt-2">
                                        <span className="text-base font-medium">Total Estimated Cost</span>
                                        <span className="text-3xl font-serif font-bold text-green-400">
                                            ${totalPrice.toLocaleString()}
                                        </span>
                                    </div>
                                    <p className="text-[10px] text-stone-500 text-center pt-4">
                                        * Prices are subject to availability and change until confirmed.
                                    </p>
                                </div>
                            </div>
                        )}

                        <div className="bg-white border border-stone-200 rounded-2xl p-6 space-y-4">
                            <h3 className="font-bold text-stone-800">Why Travel With Us?</h3>
                            <ul className="space-y-3 text-sm text-stone-600">
                                <li className="flex gap-3">
                                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-2" />
                                    <span>24/7 On-ground support throughout your journey</span>
                                </li>
                                <li className="flex gap-3">
                                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-2" />
                                    <span>Expert driver-guides with deep local knowledge</span>
                                </li>
                                 <li className="flex gap-3">
                                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-2" />
                                    <span>Sustainable tourism effectively contributing to conservation</span>
                                </li>
                            </ul>
                        </div>

                    </div>
                </div>

            </div>
        </div>
    )
}

function MealIndicator({ label, style, full, active }: { label: string, style?: string, full: string, active: boolean }) {
    if (!active) return null
    return (
        <span 
            title={full}
            className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-green-100 text-green-800 text-xs font-bold border border-green-200 cursor-help"
        >
            {label}
        </span>
    )
}

// Helper to map values to labels for destinations if needed, 
// though we use the rich content map primarily.
const nationalParksMap: Record<string, string> = {
    'akagera-np': 'Akagera National Park',
    'volcanoes-np': 'Volcanoes National Park',
    'nyungwe-np': 'Nyungwe National Park',
    'gishwati-mukura-np': 'Gishwati-Mukura',
    'kigali': 'Kigali City',
    'lake-kivu': 'Lake Kivu',
}
