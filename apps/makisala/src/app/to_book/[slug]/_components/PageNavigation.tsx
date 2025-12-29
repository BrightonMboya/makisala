'use client'

import { Calendar, CheckCircle, Image as ImageIcon, XCircle } from 'lucide-react'
import { Button } from '@repo/ui/button'
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
                        className="hover:bg-accent/50 group flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors"
                    >
                        <Icon className="text-primary h-3 w-3" />
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
        <div className="bg-card/95 border-border shadow-elegant hidden h-full border-r backdrop-blur-lg lg:block">
            <div className="p-6">
                <nav className="space-y-2">
                    {navigationItems.map(item => {
                        const Icon = item.icon
                        return (
                            <button
                                key={item.id}
                                onClick={() => scrollToSection(item.id)}
                                className="hover:bg-accent/50 group flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left transition-colors"
                            >
                                <Icon className="text-primary group-hover:text-primary-glow h-4 w-4" />
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
