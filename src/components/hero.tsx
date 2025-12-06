"use client";

import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover'
import { CalendarIcon, MapPin, Users, Check, Search } from 'lucide-react'
import { format } from 'date-fns'
import { capitalize, cn } from '@/lib/utils'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from '@/components/ui/command'

interface HeroProps {
    parks: any[]; // Using any[] for now to match the implicit type in page.tsx, ideally should be typed
}

export default function Hero({ parks }: HeroProps) {
    const [date, setDate] = useState<Date | undefined>()
    const [openDate, setOpenDate] = useState(false)
    const [destination, setDestination] = useState("")
    const [openDestination, setOpenDestination] = useState(false)
    const [travellers, setTravellers] = useState(1)
    const router = useRouter()

    const handleSearch = () => {
        const params = new URLSearchParams()
        if (date) params.set('date', date.toISOString())
        if (travellers) params.set('travellers', travellers.toString())
        
        // Check if destination is a country or a park
        const isCountry = ['Tanzania', 'Rwanda'].includes(destination)
        
        if (isCountry) {
            router.push(`/safaris/${destination.toLowerCase()}?${params.toString()}`)
        } else if (destination) {
            // It's a park, find the country
            const park = parks.find(p => p.name === destination)
            const country = park?.country || 'tanzania' // Default to Tanzania if not found
            params.set('np', destination)
            router.push(`/safaris/${country.toLowerCase()}?${params.toString()}`)
        } else {
            // No destination selected, go to generic safaris page or default
            router.push(`/safaris?${params.toString()}`)
        }
    }

    return (
        <section className="relative w-full py-20 flex flex-col items-center justify-center bg-white">
            <div className="relative z-10 w-full max-w-5xl px-4 sm:px-6 lg:px-8 flex flex-col items-center">
                <h1 className="mb-12 text-center text-4xl font-extrabold text-gray-900 md:text-7xl tracking-tight">
                    Experience the Magic of East Africa
                </h1>
                
                {/* Search Widget - TripAdvisor Style */}
                <div className="w-full bg-white rounded-3xl shadow-[0_2px_16px_rgba(0,0,0,0.12)] border border-gray-200 p-2 flex flex-col md:flex-row items-center gap-2 md:gap-0 md:h-20">
                    
                    {/* Destination Input */}
                    <div className="relative w-full md:flex-1">
                        <Popover open={openDestination} onOpenChange={setOpenDestination}>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="ghost"
                                    role="combobox"
                                    aria-expanded={openDestination}
                                    className="h-14 md:h-16 w-full justify-start rounded-2xl hover:bg-gray-100 px-6 text-left font-normal border-none"
                                >
                                    <MapPin className="h-5 w-5 text-gray-900 mr-3 shrink-0" />
                                    <div className="flex flex-col items-start truncate w-full">
                                        <span className="text-xs font-bold uppercase text-gray-900 tracking-wider">Destination</span>
                                        <span className={cn("text-base truncate font-medium text-gray-900", !destination && "text-gray-500 font-normal")}>
                                            {destination || "Where to..."}
                                        </span>
                                    </div>
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[350px] p-0" align="start">
                                <Command>
                                    <CommandInput placeholder="Search country or park..." />
                                    <CommandList>
                                        <CommandEmpty>No destination found.</CommandEmpty>
                                        <CommandGroup heading="Popular Countries">
                                            {['Tanzania', 'Rwanda'].map((country) => (
                                                <CommandItem
                                                    key={country}
                                                    value={country}
                                                    onSelect={(currentValue) => {
                                                        setDestination(currentValue === destination ? "" : currentValue)
                                                        setOpenDestination(false)
                                                    }}
                                                >
                                                    <Check
                                                        className={cn(
                                                            "mr-2 h-4 w-4",
                                                            destination === country ? "opacity-100" : "opacity-0"
                                                        )}
                                                    />
                                                    {country}
                                                </CommandItem>
                                            ))}
                                        </CommandGroup>
                                        <CommandGroup heading="Popular Parks & Reserves">
                                            {parks.map((park) => (
                                                <CommandItem
                                                    key={park.name}
                                                    value={park.name}
                                                    onSelect={(currentValue) => {
                                                        setDestination(currentValue === destination ? "" : currentValue)
                                                        setOpenDestination(false)
                                                    }}
                                                >
                                                    <Check
                                                        className={cn(
                                                            "mr-2 h-4 w-4",
                                                            destination === park.name ? "opacity-100" : "opacity-0"
                                                        )}
                                                    />
                                                    {capitalize(park.name)}
                                                </CommandItem>
                                            ))}
                                        </CommandGroup>
                                    </CommandList>
                                </Command>
                            </PopoverContent>
                        </Popover>
                    </div>

                    {/* Divider */}
                    <div className="hidden md:block h-10 w-px bg-gray-200 mx-1" />

                    {/* Date Input */}
                    <div className="relative w-full md:flex-1">
                        <Popover open={openDate} onOpenChange={setOpenDate}>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="ghost"
                                    className={cn(
                                        'h-14 md:h-16 w-full justify-start rounded-2xl hover:bg-gray-100 px-6 text-left font-normal border-none',
                                    )}
                                >
                                    <CalendarIcon className="h-5 w-5 text-gray-900 mr-3 shrink-0" />
                                    <div className="flex flex-col items-start w-full">
                                        <span className="text-xs font-bold uppercase text-gray-900 tracking-wider">Date</span>
                                        <span className={cn("text-base font-medium text-gray-900", !date && "text-gray-500 font-normal")}>
                                            {date ? format(date, 'PPP') : "Add dates"}
                                        </span>
                                    </div>
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                    mode="single"
                                    selected={date}
                                    onSelect={(newDate) => {
                                        setDate(newDate)
                                        setOpenDate(false)
                                    }}
                                    disabled={(date) => date < new Date()}
                                    className="p-3"
                                />
                            </PopoverContent>
                        </Popover>
                    </div>

                    {/* Divider */}
                    <div className="hidden md:block h-10 w-px bg-gray-200 mx-1" />

                    {/* Travellers Input */}
                    <div className="relative w-full md:flex-1">
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="ghost"
                                    className="h-14 md:h-16 w-full justify-start rounded-2xl hover:bg-gray-100 px-6 text-left font-normal border-none"
                                >
                                    <Users className="h-5 w-5 text-gray-900 mr-3 shrink-0" />
                                    <div className="flex flex-col items-start w-full">
                                        <span className="text-xs font-bold uppercase text-gray-900 tracking-wider">Travellers</span>
                                        <span className="text-base font-medium text-gray-900">
                                            {travellers} Adult{travellers !== 1 ? 's' : ''}
                                        </span>
                                    </div>
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-64 p-4" align="start">
                                <div className="flex items-center justify-between">
                                    <span className="font-medium text-sm">Adults (18+ years)</span>
                                    <div className="flex items-center gap-3">
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            className="h-8 w-8 rounded-full"
                                            onClick={() => setTravellers(Math.max(1, travellers - 1))}
                                            disabled={travellers <= 1}
                                        >
                                            -
                                        </Button>
                                        <span className="w-4 text-center text-base font-medium">{travellers}</span>
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            className="h-8 w-8 rounded-full"
                                            onClick={() => setTravellers(travellers + 1)}
                                        >
                                            +
                                        </Button>
                                    </div>
                                </div>
                            </PopoverContent>
                        </Popover>
                    </div>

                    {/* Search Button */}
                    <div className="p-1 w-full md:w-auto">
                        <Button 
                            className="h-14 md:h-16 w-full md:w-auto md:aspect-square rounded-2xl md:rounded-full bg-primary hover:bg-primary/80 text-white shadow-md transition-all hover:scale-105"
                            onClick={handleSearch}
                        >
                            <Search className="h-6 w-6" />
                            <span className="md:hidden ml-2 font-bold">Search</span>
                        </Button>
                    </div>
                </div>

                {/* Trust Indicators */}
                <div className="mt-8 flex flex-col items-center justify-center gap-2 text-sm font-medium text-gray-600 sm:flex-row sm:gap-6">
                    <div className="flex items-center gap-1.5">
                        <div className="flex text-yellow-500">
                            {[...Array(5)].map((_, i) => (
                                <Search key={i} className="h-4 w-4 fill-current hidden" /> // Dummy to keep imports if needed, but we need Star
                            ))}
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-yellow-500">
                                <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" />
                            </svg>
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-yellow-500">
                                <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" />
                            </svg>
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-yellow-500">
                                <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" />
                            </svg>
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-yellow-500">
                                <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" />
                            </svg>
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-yellow-500">
                                <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <span className="text-gray-900 font-semibold">4.9/5</span>
                        <span className="text-gray-500">from 200+ travellers</span>
                    </div>
                    <div className="hidden h-4 w-px bg-gray-300 sm:block" />
                    <div className="flex items-center gap-1.5">
                        <Check className="h-4 w-4 text-green-600" />
                        <span>Local experts in East Africa</span>
                    </div>
                    <div className="hidden h-4 w-px bg-gray-300 sm:block" />
                    <div className="flex items-center gap-1.5">
                        <Check className="h-4 w-4 text-green-600" />
                        <span>Tailor-made itineraries</span>
                    </div>
                </div>
            </div>
        </section>
    )
}
