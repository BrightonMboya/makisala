import { Button } from '@repo/ui/button'
import Link from 'next/link'

export default function LandingNav() {
    return (
        <nav className="fixed top-0 z-[60] w-full border-b border-gray-100 bg-white/95 backdrop-blur-sm">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="flex h-16 items-center justify-between">
                    <Link href="/">
                        <div className="flex items-center space-x-2 pl-10">
                            <div className="flex h-8 w-8 items-center justify-center gap-3 rounded-sm">
                                <img src="/makisala_icon.png" className="object-cover" />
                                <div className="text-sm font-medium tracking-wider">
                                    <div>MAKISALA</div>
                                </div>
                            </div>
                        </div>
                    </Link>
                    <a href="#inquiry-form">
                        <Button className="bg-primary px-6 py-2 text-sm font-medium text-white">
                            CHECK AVAILABILITY
                        </Button>
                    </a>
                </div>
            </div>
        </nav>
    )
}
