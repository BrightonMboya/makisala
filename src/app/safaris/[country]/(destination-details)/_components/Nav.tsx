'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function Nav({ country }: { country: string }) {
    const pathname = usePathname()

    return (
        <nav className="sticky top-0 z-40 border-b border-gray-200 bg-white">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="flex h-16 items-center justify-center">
                    {/* Desktop navigation */}
                    <div className="hidden md:flex md:items-center md:space-x-8">
                        <Link
                            href={`/safaris/${country}/why-go`}
                            className={`${pathname.includes('why-go') ? 'text-primary border-primary border-b py-2 font-medium' : 'text-gray-600 hover:text-gray-900'} px-3 py-2 text-sm font-medium`}
                        >
                            Why Go
                        </Link>
                        {/*<Link*/}
                        {/*    href={`/safaris/${country}/where-to-go`}*/}
                        {/*    className={`${pathname.includes('where-to-go') ? 'text-primary border-primary border-b py-2 font-medium' : 'text-gray-600 hover:text-gray-900'} px-3 py-2 text-sm font-medium`}*/}
                        {/*>*/}
                        {/*    Where To Go*/}
                        {/*</Link>*/}
                        <Link
                            href={`/safaris/${country}/best-time-to-go`}
                            className={`${pathname.includes('best-time-to-go') ? 'text-primary border-primary border-b py-2 font-medium' : 'text-gray-600 hover:text-gray-900'} px-3 py-2 text-sm font-medium`}
                        >
                            When To Go
                        </Link>
                        <Link
                            href={`/safaris/${country}/travel-advice`}
                            className={`${pathname.includes('travel-advice') ? 'text-primary border-primary border-b' : 'text-gray-600 hover:text-gray-900'} px-3 py-2 text-sm font-medium`}
                        >
                            Travel Advice
                        </Link>
                        <Link
                            href={`/safaris/${country}`}
                            className={`${pathname.endsWith(country) ? 'text-primary border-primary border-b py-2 font-medium' : 'text-gray-600 hover:text-gray-900'} px-3 py-2 text-sm font-medium`}
                        >
                            Tours & Safaris
                        </Link>
                        {/*<Link href="/accommodation"*/}
                        {/*      className="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium">*/}
                        {/*    Accommodation*/}
                        {/*</Link>*/}
                    </div>
                </div>

                {/* Mobile navigation menu */}
                <div className="md:hidden">
                    <div className="flex flex-col space-y-1 border-t border-gray-200 px-2 pt-2 pb-3">
                        <Link
                            href={`/safaris/${country}/why-go`}
                            className={`${pathname.includes('why-go') ? 'text-primary bg-primary/20 py-2 font-semibold' : 'text-gray-600 hover:text-gray-900'} px-3 py-2 text-sm font-medium`}
                        >
                            Why Go
                        </Link>
                        {/*<Link*/}
                        {/*    href={`/safaris/${country}/where-to-go`}*/}
                        {/*    className={`${pathname.includes('where-to-go') ? 'text-primary bg-primary/20 py-2 font-semibold' : 'text-gray-600 hover:text-gray-900'} px-3 py-2 text-sm font-medium`}*/}
                        {/*>*/}
                        {/*    Where To Go*/}
                        {/*</Link>*/}
                        <Link
                            href={`/safaris/${country}/best-time-to-go`}
                            className={`${pathname.includes('best-time-to-go') ? 'text-primary bg-primary/20 py-2 font-semibold' : 'text-gray-600 hover:text-gray-900'} px-3 py-2 text-sm font-medium`}
                        >
                            When To Go
                        </Link>
                        <Link
                            href={`/safaris/${country}/travel-advice`}
                            className={`${pathname.includes('travel-advice') ? 'text-primary bg-primary/20 py-2 font-semibold' : 'text-gray-600 hover:text-gray-900'} px-3 py-2 text-sm font-medium`}
                        >
                            Travel Advice
                        </Link>
                        <Link
                            href={`/safaris/${country}`}
                            className={`${pathname.endsWith(country) ? 'text-primary bg-primary/20 py-2 font-semibold' : 'text-gray-600 hover:text-gray-900'} px-3 py-2 text-sm font-medium`}
                        >
                            Tours & Safaris
                        </Link>
                    </div>
                </div>
            </div>
        </nav>
    )
}
