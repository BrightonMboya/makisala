'use client'

import { useState } from 'react'
import { Button } from '@repo/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui/card'
import { ChevronDown, ChevronUp, Menu } from 'lucide-react'
import { cn } from '@/lib/utils'
import { usePathname } from 'next/navigation'

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
            active: pathname.endsWith(`best-time-to-visit`),
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
        <aside className="lg:sticky lg:top-10 lg:h-fit lg:w-80 lg:flex-shrink-0 lg:self-start">
            {/* Mobile navigation toggle */}
            <div className="mb-6 lg:hidden">
                <Button
                    variant="outline"
                    onClick={() => setIsOpen(!isOpen)}
                    className="w-full justify-between"
                >
                    <span className="flex items-center gap-2">
                        <Menu className="h-4 w-4" />
                    </span>
                    {isOpen ? (
                        <ChevronUp className="h-4 w-4" />
                    ) : (
                        <ChevronDown className="h-4 w-4" />
                    )}
                </Button>
            </div>

            {/* Navigation content */}
            <div className={cn('lg:block', isOpen ? 'block' : 'hidden')}>
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">On this page</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        {items.map((item, index) => (
                            <a
                                key={index}
                                href={item.href}
                                className={cn(
                                    'hover:bg-accent hover:text-accent-foreground block rounded-md px-3 py-2 text-sm transition-colors',
                                    item.active
                                        ? 'bg-primary text-primary-foreground font-medium'
                                        : 'text-muted-foreground'
                                )}
                                onClick={() => setIsOpen(false)}
                            >
                                {item.name}
                            </a>
                        ))}
                    </CardContent>
                </Card>
            </div>
        </aside>
    )
}
