'use client'
import { use } from 'react'
import Link from 'next/link'
import C2A from '@/components/home/call-to-action'
import { usePathname } from 'next/navigation'

export default function Layout({
    children,
    params,
}: {
    children: React.ReactNode
    params: Promise<{ country: string }>
}) {
    const { country } = use(params)
    const pathname = usePathname()

    return (
        <>
            <nav className="bg-white border-b border-gray-200 sticky top-0 z-40 lg:mt-[80px]">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-center h-16">
                        {/* Desktop navigation */}
                        <div className="hidden md:flex md:items-center md:space-x-8">
                            <Link
                                href={`/safaris/${country}/why-go`}
                                className={`${pathname.includes('why-go') ? 'text-primary border-b border-primary py-2 font-medium' : 'text-gray-600 hover:text-gray-900 '} px-3 py-2 text-sm font-medium`}
                            >
                                Why Go
                            </Link>
                            <Link
                                href={`/safaris/${country}/where-to-go`}
                                className={`${pathname.includes('where-to-go') ? 'text-primary border-b border-primary py-2 font-medium' : 'text-gray-600 hover:text-gray-900 '} px-3 py-2 text-sm font-medium`}
                            >
                                Where To Go
                            </Link>
                            <Link
                                href={`/safaris/${country}/best-time-to-go`}
                                className={`${pathname.includes('best-time-to-go') ? 'text-primary border-b border-primary py-2 font-medium' : 'text-gray-600 hover:text-gray-900 '} px-3 py-2 text-sm font-medium`}
                            >
                                When To Go
                            </Link>
                            <Link
                                href={`/safaris/${country}/travel-advice`}
                                className={`${pathname.includes('travel-advice') ? 'text-primary border-b border-primary' : 'text-gray-600 hover:text-gray-900 '} px-3 py-2 text-sm font-medium`}
                            >
                                Travel Advice
                            </Link>
                            <Link
                                href={`/safaris/${country}`}
                                className={`${pathname.endsWith(country) ? 'text-primary border-b border-primary py-2 font-medium' : 'text-gray-600 hover:text-gray-900 '} px-3 py-2 text-sm font-medium`}
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
                        <div className="px-2 flex-col flex pt-2 pb-3 space-y-1  border-t border-gray-200">
                            <Link
                                href={`/safaris/${country}/why-go`}
                                className={`${pathname.includes('why-go') ? 'text-primary bg-primary/20 py-2 font-semibold' : 'text-gray-600 hover:text-gray-900 '} px-3 py-2 text-sm font-medium`}
                            >
                                Why Go
                            </Link>
                            <Link
                                href={`/safaris/${country}/where-to-go`}
                                className={`${pathname.includes('where-to-go') ? 'text-primary bg-primary/20 py-2 font-semibold' : 'text-gray-600 hover:text-gray-900 '} px-3 py-2 text-sm font-medium`}
                            >
                                Where To Go
                            </Link>
                            <Link
                                href={`/safaris/${country}/best-time-to-go`}
                                className={`${pathname.includes('best-time-to-go') ? 'text-primary bg-primary/20 py-2 font-semibold' : 'text-gray-600 hover:text-gray-900 '} px-3 py-2 text-sm font-medium`}
                            >
                                When To Go
                            </Link>
                            <Link
                                href={`/safaris/${country}/travel-advice`}
                                className={`${pathname.includes('travel-advice') ? 'text-primary bg-primary/20 py-2 font-semibold' : 'text-gray-600 hover:text-gray-900 '} px-3 py-2 text-sm font-medium`}
                            >
                                Travel Advice
                            </Link>
                            <Link
                                href={`/safaris/${country}`}
                                className={`${pathname.endsWith(country) ? 'text-primary bg-primary/20 py-2 font-semibold' : 'text-gray-600 hover:text-gray-900 '} px-3 py-2 text-sm font-medium`}
                            >
                                Tours & Safaris
                            </Link>
                        </div>
                    </div>
                </div>
            </nav>
            <main
                className={`${pathname.endsWith(country) ? 'max-w-none flex items-center justify-center' : 'max-w-4xl'}  mx-auto px-4 sm:px-6 lg:px-8 my-[40px]`}
            >
                {children}
            </main>
            <C2A />
        </>
    )
}
