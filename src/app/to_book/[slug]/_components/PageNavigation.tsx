'use client'

import { Calendar, CheckCircle, Image as ImageIcon, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { InquiryDialog } from '@/components/enquire-dialog-button'

export const navigationItems = [
    { id: 'overview', label: 'Overview', icon: ImageIcon },
    { id: 'itinerary', label: 'Itinerary', icon: Calendar },
    { id: 'inclusions', label: 'Inclusions', icon: CheckCircle },
    { id: 'exclusions', label: 'Exclusions', icon: XCircle },
]

const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId)
    if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
}

export function MobileNavigation() {
    return (
        <>
            {navigationItems.map(item => {
                const Icon = item.icon
                return (
                    <button
                        key={item.id}
                        onClick={() => {
                            scrollToSection(item.id)
                        }}
                        className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg hover:bg-accent/50 transition-colors group"
                    >
                        <Icon className="h-3 w-3 text-primary" />
                        <span className="text-foreground">{item.label}</span>
                    </button>
                )
            })}
            <InquiryDialog>
                <Button className="w-full">BOOK NOW</Button>
            </InquiryDialog>
        </>
    )
}

export function DesktopNavigation() {
    return (
        <div className="hidden lg:block bg-card/95 backdrop-blur-lg border-r border-border shadow-elegant h-full">
            <div className="p-6">
                <nav className="space-y-2">
                    {navigationItems.map(item => {
                        const Icon = item.icon
                        return (
                            <button
                                key={item.id}
                                onClick={() => scrollToSection(item.id)}
                                className="w-full flex items-center gap-3 px-4 py-3 text-left rounded-lg hover:bg-accent/50 transition-colors group"
                            >
                                <Icon className="h-4 w-4 text-primary group-hover:text-primary-glow" />
                                <span className="text-foreground group-hover:text-primary">
                                    {item.label}
                                </span>
                            </button>
                        )
                    })}
                </nav>

                <div className="mt-8">
                    <InquiryDialog>
                        <Button className="w-full">BOOK NOW</Button>
                    </InquiryDialog>
                </div>
            </div>
        </div>
    )
}
