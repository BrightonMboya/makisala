'use client'

import { Button } from '@repo/ui/button'
import { useEffect, useState } from 'react'

export default function StickyMobileCTA() {
    const [visible, setVisible] = useState(false)

    useEffect(() => {
        const handleScroll = () => {
            // Show after scrolling past the hero (roughly 600px)
            setVisible(window.scrollY > 600)
        }
        window.addEventListener('scroll', handleScroll, { passive: true })
        return () => window.removeEventListener('scroll', handleScroll)
    }, [])

    if (!visible) return null

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200 bg-white p-3 shadow-lg lg:hidden">
            <a href="#bottom-form">
                <Button className="w-full py-3 text-base font-semibold" size="lg">
                    Plan My Gorilla Trek
                </Button>
            </a>
        </div>
    )
}
