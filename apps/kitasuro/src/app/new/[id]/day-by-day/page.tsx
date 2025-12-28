'use client'

import { Button } from '@repo/ui/button'
import { CheckCircle, ArrowRight } from 'lucide-react'
import { DayTable } from '@/components/itinerary-builder/day-table'
import { DatePicker } from '@repo/ui/date-picker'
import { useEffect, useState } from 'react'
import { addDays, format } from 'date-fns'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@repo/ui/select'
import { Input } from '@repo/ui/input'
import { Combobox } from '@repo/ui/combobox'
import { airports } from '@/lib/data/itinerary-data'
import { useBuilder } from '@/components/itinerary-builder/builder-context'
import { getAllAccommodations, getAllNationalParks } from '@/app/new/actions'
import { useSearchParams } from 'next/navigation'

export default function DayByDayPage() {
    const params = useParams()
    const id = params.id as string
    const searchParams = useSearchParams()
    const tourId = searchParams.get('tourId')
    const startDateParam = searchParams.get('startDate')
    
    const {
        days,
        setDays,
        startDate,
        setStartDate,
        startCity,
        setStartCity,
        transferIncluded,
        setTransferIncluded,
        pickupPoint,
        setPickupPoint,
    } = useBuilder()

    const [accommodationsList, setAccommodationsList] = useState<{ value: string; label: string }[]>([])
    const [destinationsList, setDestinationsList] = useState<{ value: string; label: string }[]>([])

    // Fetch data on mount
    useEffect(() => {
        const fetchData = async () => {
            const [accs, parks] = await Promise.all([
                getAllAccommodations(),
                getAllNationalParks()
            ])
            
            setAccommodationsList(accs.map(a => ({ value: a.name, label: a.name })))
            setDestinationsList(parks.map(p => ({ value: p.name, label: p.name })))

            // If tourId is present AND days are empty (or default), fetch tour details
            // We check days.length <= 1 assuming default state has 1 or 0 days, 
            // or we could check a specific flag. 
            // Better: rely on the fact that Layout handles the initial fetch.
            // But if we navigated directly here without layout fetch completing? 
            // Layout handles it. We should probably NOT fetch here if we trust Layout.
            // However, to be safe, we can check if days are "touched" or if we have the specific tour loaded.
            // For now, let's just remove the tour fetching logic from here since Layout handles it via initialData.
            // But wait, Layout only sets initialData on mount. If we change tourId in URL?
            // The Layout key doesn't change on query param change unless we force it.
            // But Layout's useEffect depends on tourId.
            
            // So Layout will update initialData. But BuilderProvider only reads initialData on mount!
            // This is a problem with the Context pattern used here.
            // BuilderProvider uses useEffect(() => { ... }, [initialData])
            // So if Layout updates initialData, Provider updates state.
            
            // So we DON'T need to fetch here.
        }
        fetchData()
    }, []) // Remove dependencies that cause re-runs


    // Update dates whenever start date changes
    useEffect(() => {
        if (!startDate) return

        setDays(days.map((day, index) => ({
            ...day,
            date: format(addDays(startDate, index), 'MMM d'),
        })))
    }, [startDate])

    return (
        <div className="space-y-8 max-w-6xl mx-auto px-6 pb-20">
            <div className="flex items-center justify-between border-b border-stone-200 pb-6">
                <div>
                    <h2 className="font-serif text-3xl font-bold text-stone-900">
                        Day-by-Day Itinerary
                    </h2>
                    <p className="mt-1 text-stone-500">Build the daily schedule and manage activities.</p>
                </div>
                <div className="flex items-center gap-4 text-sm bg-white rounded-lg shadow-sm border border-stone-200 px-4 py-2">
                    <div className="flex items-center gap-2">
                        <span className="font-bold text-stone-700">
                            Destinations:
                        </span>
                        <div className="flex items-center gap-1.5">
                            <span className="text-lg">🇷🇼</span>
                            <span className="text-stone-600">Rwanda</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="rounded-xl border border-stone-200 bg-white shadow-sm">
                <div className="rounded-t-xl border-b border-stone-100 bg-stone-50/50 px-6 py-4 flex items-center gap-2 text-sm font-bold text-green-800">
                    <CheckCircle className="h-4 w-4" />
                    Tour Logistics: Arrival & Start
                </div>
                
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Left Column: Dates & Location */}
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-xs font-semibold uppercase tracking-wide text-stone-500">Start Date</label>
                            <DatePicker date={startDate} setDate={setStartDate} />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-semibold uppercase tracking-wide text-stone-500">Start City / Location</label>
                            <Input 
                                value={startCity} 
                                onChange={(e) => setStartCity(e.target.value)}
                                placeholder="e.g. Kigali, Rwanda"
                                className="bg-stone-50 border-stone-200 focus:bg-white"
                            />
                        </div>
                    </div>

                    {/* Right Column: Transfers & Options */}
                    <div className="space-y-6">
                         <div className="space-y-2">
                            <label className="text-xs font-semibold uppercase tracking-wide text-stone-500">Arrival Transfer</label>
                            <div className="grid grid-cols-2 gap-2">
                                <Select value={transferIncluded} onValueChange={setTransferIncluded}>
                                    <SelectTrigger className="bg-stone-50 border-stone-200">
                                        <SelectValue placeholder="Select option" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="included">Included</SelectItem>
                                        <SelectItem value="excluded">Excluded</SelectItem>
                                    </SelectContent>
                                </Select>
                                {transferIncluded === 'included' && (
                                    <Combobox
                                        items={airports}
                                        value={pickupPoint}
                                        onChange={setPickupPoint}
                                        placeholder="Select airport"
                                        className="bg-stone-50 border-stone-200"
                                    />
                                )}
                            </div>
                        </div>

                        <div className="space-y-3 pt-2">
                            <label className="flex items-center gap-3 p-3 rounded-lg border border-stone-200 hover:bg-stone-50 cursor-pointer transition-colors">
                                <input type="checkbox" className="h-4 w-4 rounded border-stone-300 text-green-700 focus:ring-green-600/20" />
                                <span className="text-sm font-medium text-stone-700">Arrange accommodation before tour start</span>
                            </label>
                            <label className="flex items-center gap-3 p-3 rounded-lg border border-stone-200 hover:bg-stone-50 cursor-pointer transition-colors">
                                <input type="checkbox" className="h-4 w-4 rounded border-stone-300 text-green-700 focus:ring-green-600/20" />
                                <span className="text-sm font-medium text-stone-700">Client arrives days before tour start</span>
                            </label>
                        </div>
                    </div>
                </div>
            </div>

            <div className="space-y-4">
                 <div className="flex items-center justify-between">
                    <h3 className="font-serif text-xl font-bold text-stone-900">Itinerary Schedule</h3>
                    <div className="text-sm text-stone-500">
                        {days.length} Days Total
                    </div>
                </div>
                <DayTable 
                    days={days} 
                    setDays={setDays} 
                    accommodations={accommodationsList}
                    destinations={destinationsList}
                    startDate={startDate}
                />
            </div>

            <div className="rounded-lg border border-green-200 bg-green-50/50 p-4 flex items-center justify-between">
                <div className="flex items-center gap-3 text-sm text-green-800 font-medium">
                    <div className="p-2 bg-green-100 rounded-full text-green-700">
                        <CheckCircle className="h-4 w-4" />
                    </div>
                    Tour Conclusion & Departure
                </div>
                <div className="flex items-center gap-4 text-sm font-medium text-stone-700">
                    <span className="text-stone-500">Ends:</span>
                    <span>
                        {startDate && days.length > 0
                            ? format(addDays(startDate, days.length - 1), 'PPP')
                            : '—'}
                    </span>
                    <span className="text-stone-300">|</span>
                    <span>Kigali</span>
                </div>
            </div>

            <div className="flex justify-end pt-6">
                <Link href={`/new/${id}/pricing`}>
                    <Button size="lg" className="bg-green-700 hover:bg-green-800 text-base px-8 py-6 shadow-md shadow-green-900/10">
                        Proceed to Pricing <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                </Link>
            </div>
        </div>
    )
}
