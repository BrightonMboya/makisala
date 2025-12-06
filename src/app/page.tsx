"use client";

import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover'
import { CalendarIcon, MapPin, Users, Star, Check } from 'lucide-react'
import { format } from 'date-fns'
import { capitalize, cn } from '@/lib/utils'
import { useState } from 'react'
import Link from 'next/link'
import { safaris, featured_national_parks, why_travel_with_us } from '@/lib/constants'
import ContactForm from '@/components/contact-form'
import { useRouter } from 'next/navigation'
import { fetchAllNps, getWeekendDeals } from '@/lib/cms-service';
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from '@/components/ui/command'

import { useQuery } from '@tanstack/react-query'

export default function Page() {
    const [date, setDate] = useState<Date | undefined>()
    const [openDate, setOpenDate] = useState(false)
    const [destination, setDestination] = useState("")
    const [openDestination, setOpenDestination] = useState(false)
    const [travellers, setTravellers] = useState(1)
    const router = useRouter()

    const { data: parks = [] } = useQuery({
        queryKey: ['national-parks'],
        queryFn: fetchAllNps,
    })

    const { data: deals = [] } = useQuery({
        queryKey: ['weekend-deals'],
        queryFn: getWeekendDeals,
    })

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
        <main className="min-h-screen bg-gray-50">
            {/* Hero Section */}
            <section className="relative min-h-[600px] w-full lg:h-[600px] h-auto">
                <div className="absolute inset-0">
                    <Image
                        src="https://res.cloudinary.com/dr2tdyz2w/image/upload/v1757620218/Serengeti-Balloon-Safari-andBeyond-Experience_itpmf9.jpg"
                        alt="Hero Background"
                        fill
                        className="object-cover"
                        priority
                    />
                    <div className="absolute inset-0 bg-black/50" />
                </div>

                <div className="relative z-10 mx-auto flex h-full max-w-7xl flex-col justify-center px-4 py-20 sm:px-6 lg:px-8">
                    <h1 className="mb-6 text-center text-3xl font-bold text-white shadow-black/50 drop-shadow-md md:text-6xl">
                        Find your perfect African safari
                    </h1>
                    <p className="mb-8 text-center text-lg text-white shadow-black/50 drop-shadow-md max-w-3xl mx-auto md:text-xl">
                        Tailor-made journeys crafted by local East African experts. Personalized advice,
                        vetted lodges and ethical travel practices.
                    </p>

                    {/* Search Widget - Functional */}
                    <div className="mx-auto flex w-full max-w-5xl flex-col gap-0 rounded-lg bg-white p-1 shadow-lg md:flex-row">
                        <div className="relative flex-1 border-b md:border-b-0 md:border-r border-gray-200">
                            <Popover open={openDestination} onOpenChange={setOpenDestination}>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        role="combobox"
                                        aria-expanded={openDestination}
                                        className="h-14 w-full justify-between rounded-none hover:bg-gray-50 px-4 text-left font-normal"
                                    >
                                        <div className="flex flex-col items-start truncate">
                                            <span className="text-xs font-bold uppercase text-gray-500">Destination</span>
                                            <span className={cn("text-base truncate", !destination && "text-gray-400")}>
                                                {destination || "Where To?"}
                                            </span>
                                        </div>
                                        <MapPin className="h-4 w-4 text-gray-400 shrink-0 ml-2" />
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

                        <div className="relative flex-1 border-b md:border-b-0 md:border-r border-gray-200">
                            <Popover open={openDate} onOpenChange={setOpenDate}>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        className={cn(
                                            'h-14 w-full justify-between rounded-none hover:bg-gray-50 px-4 text-left font-normal',
                                            !date && 'text-gray-500'
                                        )}
                                    >
                                        <div className="flex flex-col items-start">
                                            <span className="text-xs font-bold uppercase text-gray-500">Start Date</span>
                                            <span className={cn("text-base", !date && "text-gray-400")}>
                                                {date ? format(date, 'PPP') : "When?"}
                                            </span>
                                        </div>
                                        <CalendarIcon className="h-4 w-4 text-gray-400 shrink-0 ml-2" />
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

                        <div className="relative flex-1">
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        className="h-14 w-full justify-between rounded-none hover:bg-gray-50 px-4 text-left font-normal"
                                    >
                                        <div className="flex flex-col items-start">
                                            <span className="text-xs font-bold uppercase text-gray-500">Travellers</span>
                                            <span className="text-base text-gray-900">
                                                {travellers} Adult{travellers !== 1 ? 's' : ''}
                                            </span>
                                        </div>
                                        <Users className="h-4 w-4 text-gray-400 shrink-0 ml-2" />
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

                        <Button 
                            className="h-14 bg-primary px-8 text-base font-bold text-white hover:bg-primary/80 rounded-md md:w-auto m-1"
                            onClick={handleSearch}
                        >
                            Show Tours
                        </Button>
                    </div>

                    {/* Trust Indicators */}
                    <div className="mt-6 flex flex-col items-center justify-center gap-2 text-sm font-medium text-white/90 shadow-black/50 drop-shadow-md sm:flex-row sm:gap-6">
                        <div className="flex items-center gap-1.5">
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                            <span>4.9/5 from 200+ travellers</span>
                        </div>
                        <div className="hidden h-4 w-px bg-white/40 sm:block" />
                        <div>Local experts in East Africa</div>
                        <div className="hidden h-4 w-px bg-white/40 sm:block" />
                        <div>Tailor-made itineraries</div>
                    </div>
                </div>
            </section>

            {/* Experience Cards - TripAdvisor Style */}
            <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
                <h2 className="mb-2 text-2xl font-bold text-gray-900">
                    Popular experiences
                </h2>
                <p className="mb-8 text-gray-600">
                    Tap into the kind of safari you’ve dreamed about.
                </p>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                    {safaris.map((safari, index) => (
                        <Link
                            href={safari.page_url}
                            key={index}
                            className={cn(
                                "group relative overflow-hidden rounded-xl",
                                index < 2 ? "md:col-span-2 h-[300px] md:h-[400px]" : "md:col-span-1 h-[300px]"
                            )}
                        >
                            <Image
                                src={safari.image || '/placeholder.svg'}
                                alt={safari.title}
                                fill
                                className="object-cover transition-transform duration-500 group-hover:scale-110"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                            <div className="absolute bottom-0 left-0 p-6">
                                <h3 className="text-xl font-bold text-white uppercase tracking-wide">
                                    {safari.title}
                                </h3>
                            </div>
                        </Link>
                    ))}
                </div>
            </section>

            {/* Why Travel With Us Section */}
            <section className="py-12">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <h2 className="mb-2 text-2xl font-bold text-gray-900">
                        Why travel with Makisala
                    </h2>
                    <div className="grid gap-12 md:grid-cols-3">
                        {why_travel_with_us.map((item, index) => (
                            <div key={index} className="flex flex-col items-center text-center">
                                <div className="relative mb-6 h-64 w-full overflow-hidden rounded-2xl shadow-sm">
                                    <Image
                                        src={item.img_url}
                                        alt={item.alt}
                                        fill
                                        className="object-cover transition-transform duration-500 hover:scale-105"
                                    />
                                </div>
                                <h3 className="mb-3 text-xl font-semibold text-gray-900">
                                    {item.title}
                                </h3>
                                <p className="max-w-sm leading-relaxed text-gray-600">
                                    {item.description}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
            

            {/* National Parks Section */}
            <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
                <h2 className="mb-2 text-2xl font-bold text-gray-900">
                    Popular National Parks
                </h2>
                <p className="mb-8 text-gray-600">
                    Explore the best of Tanzania's wilderness
                </p>

                <div className="flex w-full gap-6 overflow-x-auto pb-6 scrollbar-hide snap-x">
                    {featured_national_parks.map((destination, index) => (
                        <Link
                            href={destination.page_url}
                            key={index}
                            className="group relative min-w-[280px] flex-none snap-start aspect-[4/3] overflow-hidden rounded-xl sm:min-w-[320px]"
                        >
                            <Image
                                src={destination.image || '/placeholder.svg'}
                                alt={destination.name}
                                fill
                                className="object-cover transition-transform duration-300 group-hover:scale-110"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                            <div className="absolute bottom-0 left-0 p-6">
                                <h3 className="text-xl font-bold text-white">
                                    {destination.name}
                                </h3>
                                <p className="text-sm text-gray-200">
                                    {destination.description}
                                </p>
                            </div>
                        </Link>
                    ))}
                </div>
            </section>

            {/* Featured Section (Existing) */}
            <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
                <div className="mb-8 flex items-center">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">
                            Featured itineraries
                        </h2>
                        <p className="mt-1 text-gray-500">
                            Real trips real travellers loved, fully customizable.
                        </p>
                    </div>
                   
                </div>

                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                    {deals.map((item) => (
                        <Link
                            href={`/tours/${item.slug}`}
                            key={item.id}
                            className="group relative overflow-hidden rounded-xl bg-white shadow-md transition-shadow hover:shadow-lg"
                        >
                            <div className="relative aspect-[4/3]">
                                <Image
                                    src={item.img_url || '/placeholder.svg'}
                                    alt={item.tourName}
                                    fill
                                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                                />
                                <div className="absolute left-3 top-3 flex flex-wrap gap-2">
                                    <div className="rounded bg-gray-900 px-2 py-1 text-xs font-medium text-white">
                                        {item.number_of_days} Days
                                    </div>
                                </div>
                            </div>
                            <div className="p-4">
                                <h3 className="text-lg font-semibold text-gray-900 line-clamp-1">
                                    {item.tourName}
                                </h3>
                                <p className="text-sm text-gray-500 capitalize">
                                    {item.country}
                                </p>
                                <div className="mt-2 flex items-center gap-2">
                                    <span className="rounded bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
                                        {item.rating || '4.8'}/5
                                    </span>
                                    <span className="text-xs text-gray-500">
                                        ({item.reviews || '24'} reviews)
                                    </span>
                                </div>
                                <div className="mt-4">
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-lg font-bold text-gray-900">
                                            {new Intl.NumberFormat('en-US', {
                                                style: 'currency',
                                                currency: 'USD',
                                                maximumFractionDigits: 0,
                                            }).format(Number(item.pricing))}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            </section>

            {/* Contact Form Section */}
            <section className="bg-gray-50 py-16">
                <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-bold text-gray-900">
                            Start Planning Your Safari
                        </h2>
                        <p className="mt-4 text-lg text-gray-600">
                            Tell us about your dream trip and we'll make it happen.
                        </p>
                    </div>
                    <div className="bg-white rounded-2xl shadow-xl p-8">
                        <ContactForm />
                    </div>
                </div>
            </section>

            {/* Google Reviews Section */}
            <section className="bg-white py-16">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="mb-12 flex items-center justify-center gap-4">
                        <div className="flex items-center gap-1">
                            <span className="text-2xl font-bold text-gray-900">
                                4.9
                            </span>
                            <div className="flex text-yellow-400">
                                {[...Array(5)].map((_, i) => (
                                    <Star
                                        key={i}
                                        className="h-6 w-6 fill-current"
                                    />
                                ))}
                            </div>
                        </div>
                        <span className="text-gray-500">
                            Based on 150+ Google Reviews
                        </span>
                        <Image
                            src="https://upload.wikimedia.org/wikipedia/commons/2/2f/Google_2015_logo.svg"
                            alt="Google"
                            width={80}
                            height={26}
                            className="opacity-80"
                        />
                    </div>

                    <div className="grid gap-8 md:grid-cols-3">
                        {[
                            {
                                name: 'Sarah Johnson',
                                date: '2 weeks ago',
                                text: 'An absolutely incredible experience. The attention to detail and personalized service exceeded all expectations. Our guide was phenomenal!',
                            },
                            {
                                name: 'Michael Chen',
                                date: '1 month ago',
                                text: 'We had the most amazing honeymoon safari. Everything was perfectly planned, from the lodges to the game drives. Highly recommend Makisala!',
                            },
                            {
                                name: 'Emma Davis',
                                date: '2 months ago',
                                text: 'A trip of a lifetime! Seeing the Great Migration was magical. The team took care of everything so we could just enjoy the adventure.',
                            },
                        ].map((review, index) => (
                            <div
                                key={index}
                                className="rounded-xl bg-gray-50 p-8 shadow-sm"
                            >
                                <div className="mb-4 flex items-center gap-1 text-yellow-400">
                                    {[...Array(5)].map((_, i) => (
                                        <Star
                                            key={i}
                                            className="h-4 w-4 fill-current"
                                        />
                                    ))}
                                </div>
                                <p className="mb-6 text-gray-700">
                                    "{review.text}"
                                </p>
                                <div className="flex items-center gap-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 font-bold text-blue-600">
                                        {review.name.charAt(0)}
                                    </div>
                                    <div>
                                        <div className="font-semibold text-gray-900">
                                            {review.name}
                                        </div>
                                        <div className="text-xs text-gray-500">
                                            {review.date}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        </main>
    )
}
