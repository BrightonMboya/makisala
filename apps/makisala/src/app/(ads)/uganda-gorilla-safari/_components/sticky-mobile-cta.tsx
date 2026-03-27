'use client'

import { MessageCircle } from 'lucide-react'
import { useEffect, useState } from 'react'

export default function StickyMobileCTA() {
    const [visible, setVisible] = useState(false)

    useEffect(() => {
        const handleScroll = () => {
            setVisible(window.scrollY > 400)
        }
        window.addEventListener('scroll', handleScroll, { passive: true })
        return () => window.removeEventListener('scroll', handleScroll)
    }, [])

    if (!visible) return null

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200 bg-white p-3 shadow-lg lg:hidden">
            <a
                href="https://wa.me/255788323254?text=Hi%2C%20I%20saw%20your%20Uganda%20gorilla%20safari%20page.%20I%27d%20love%20to%20get%20a%20quote!"
                target="_blank"
                rel="noopener noreferrer"
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-green-600 py-3 text-base font-semibold text-white transition-colors hover:bg-green-700"
            >
                <MessageCircle className="h-5 w-5" />
                Chat with Us on WhatsApp
            </a>
        </div>
    )
}
