'use client'

import { useState } from 'react'
import { ChevronDown, Menu } from 'lucide-react'
import { cn } from '@/lib/utils'
import { usePathname } from 'next/navigation'
import { InquiryDialog } from '@/components/enquire-dialog-button'

export function NavigationSidebar({ park_name }: { park_name: string }) {
    const pathname = usePathname()
    const [isOpen, setIsOpen] = useState(false)

    const items = [
        {
            name: 'Park Overview',
            href: `/national-parks/${park_name}`,
            active: pathname.endsWith(park_name),
        },
        {
            name: 'Best time to visit',
            href: `/national-parks/${park_name}/best-time-to-visit`,
            active: pathname.endsWith('best-time-to-visit'),
        },
        {
            name: 'Wildlife',
            href: `/national-parks/${park_name}/wildlife`,
            active: pathname.endsWith('wildlife'),
        },
        {
            name: 'Malaria & Safety',
            href: `/national-parks/${park_name}/safety`,
            active: pathname.endsWith('safety'),
        },
        {
            name: 'Getting there',
            href: `/national-parks/${park_name}/getting-there`,
            active: pathname.endsWith('getting-there'),
        },
        {
            name: 'Climate',
            href: `/national-parks/${park_name}/climate`,
            active: pathname.endsWith('climate'),
        },
    ]

    return (
        <aside className="lg:sticky lg:top-[100px] lg:h-[calc(100vh-120px)] lg:w-64 lg:flex-shrink-0 lg:self-start">
            {/* Mobile toggle */}
            <div className="lg:hidden">
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="flex w-full items-center justify-between rounded-lg border border-stone-200 bg-[#F9F7F4] px-4 py-3 text-sm font-medium text-stone-700"
                >
                    <span className="flex items-center gap-2">
                        <Menu className="h-4 w-4" />
                        Navigate
                    </span>
                    <ChevronDown className={cn('h-4 w-4 transition-transform', isOpen && 'rotate-180')} />
                </button>
            </div>

            {/* Sidebar content */}
            <div className={cn(
                'mt-3 overflow-hidden rounded-xl bg-[#F9F7F4] lg:mt-0 lg:block lg:rounded-none lg:bg-transparent',
                isOpen ? 'block' : 'hidden'
            )}>
                <nav className="px-2 py-4 lg:px-0 lg:py-0">
                    <ul className="space-y-1">
                        {items.map((item, index) => (
                            <li key={index}>
                                <a
                                    href={item.href}
                                    onClick={() => setIsOpen(false)}
                                    className={cn(
                                        'group relative block px-4 py-2.5 text-sm transition-colors',
                                        item.active
                                            ? 'font-medium text-stone-900'
                                            : 'text-stone-500 hover:text-stone-900'
                                    )}
                                >
                                    {item.name}
                                    {/* Underline animation */}
                                    <span className={cn(
                                        'absolute bottom-1.5 left-4 right-4 h-px bg-stone-900 transition-transform duration-300 origin-left',
                                        item.active ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'
                                    )} />
                                </a>
                            </li>
                        ))}
                    </ul>
                </nav>

                {/* CTA */}
                <div className="border-t border-stone-200 p-4 lg:mt-6 lg:border-t-0 lg:p-0">
                    <InquiryDialog>
                        <button className="w-full rounded-none border border-stone-900 bg-stone-900 px-6 py-3 text-sm font-medium tracking-wide text-white transition-all hover:bg-stone-800">
                            Start Planning
                        </button>
                    </InquiryDialog>
                </div>
            </div>
        </aside>
    )
}
