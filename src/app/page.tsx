"use client";

import Image from 'next/image'
import { Star } from 'lucide-react'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { safaris, featured_national_parks, why_travel_with_us } from '@/lib/constants'
import ContactForm from '@/components/contact-form'
import { fetchAllNps, getWeekendDeals } from '@/lib/cms-service';
import { useQuery } from '@tanstack/react-query'
import Hero from '@/components/hero'

export default function Page() {
    const { data: parks = [] } = useQuery({
        queryKey: ['national-parks'],
        queryFn: fetchAllNps,
    })

    const { data: deals = [] } = useQuery({
        queryKey: ['weekend-deals'],
        queryFn: getWeekendDeals,
    })

    return (
        <main className="min-h-screen">
            {/* Hero Section */}
            <Hero parks={parks} />

            {/* Experience Cards - TripAdvisor Style */}
            <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
                <h2 className="mb-4 text-5xl font-bold text-gray-900">
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
                    <h2 className="mb-4 text-5xl font-bold text-gray-900">
                        Why travel with Makisala
                    </h2>
                    <p className="mb-12 text-lg text-gray-600 max-w-2xl">
                        We don't just book trips; we craft unforgettable experiences rooted in local expertise and sustainable travel.
                    </p>
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
                <h2 className="mb-4 text-5xl font-bold text-gray-900">
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
                        <h2 className="text-5xl font-bold text-gray-900">
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

             {/* Google Reviews Section */}
            <section className="bg-white py-16">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <h2 className="mb-12 text-center text-5xl font-bold text-gray-900">
                        What our travellers say
                    </h2>
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

            {/* Contact Form Section */}
            <section className="py-16">
                <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-12">
                        <h2 className="text-5xl font-bold text-gray-900">
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
        </main>
    )
}
