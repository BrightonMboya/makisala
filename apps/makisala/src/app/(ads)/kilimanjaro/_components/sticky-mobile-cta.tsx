'use client'

import { Button } from '@repo/ui/button'
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
            <div className="flex gap-2">
                <a href="#inquiry-form" className="flex-1">
                    <Button className="w-full py-3 text-base font-semibold" size="lg">
                        Get a Free Quote
                    </Button>
                </a>
                <a
                    href="https://wa.me/255788323254?text=Hi%2C%20I%27m%20interested%20in%20climbing%20Kilimanjaro.%20Can%20you%20help%20me%20plan%20my%20climb%3F"
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
