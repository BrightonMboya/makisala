'use client'

import { Button } from '@repo/ui/button'
import { MessageCircle } from 'lucide-react'
import { useEffect, useState } from 'react'

const WHATSAPP_LINK =
    'https://wa.me/255788323254?text=Hi%2C%20I%27m%20interested%20in%20a%20Tanzania%20safari%20and%20Zanzibar%20beach%20trip%20for%20two.%20Can%20you%20help%20me%20plan%20it%3F'

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
            <div className="flex gap-2">
                <a href="#inquiry-form" className="flex-1">
                    <Button className="w-full py-3 text-base font-semibold" size="lg">
                        Plan Our Trip
                    </Button>
                </a>
                <a
                    href={WHATSAPP_LINK}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center rounded-lg bg-green-600 px-4 text-white transition-colors hover:bg-green-700"
                >
                    <MessageCircle className="h-5 w-5" />
                </a>
            </div>
        </div>
    )
}
