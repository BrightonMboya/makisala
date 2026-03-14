import { Button } from '@repo/ui/button'
import { Check, MessageCircle } from 'lucide-react'
import Link from 'next/link'

export const metadata = {
    title: 'Thank You | Makisala Safaris',
    robots: { index: false, follow: false },
}

export default function ThankYouPage() {
    return (
        <section className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
            <div className="bg-primary/10 mb-6 flex h-16 w-16 items-center justify-center rounded-full">
                <Check className="text-primary h-8 w-8" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                We're checking permit availability
            </h1>
            <p className="text-muted-foreground mt-4 max-w-md text-lg">
                You'll hear from us within 24 hours with availability for your dates
                and a personalized quote. No obligation.
            </p>
            <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row">
                <a
                    href="https://wa.me/255788323254?text=Hi%2C%20I%20just%20submitted%20an%20inquiry%20on%20your%20website%20about%20gorilla%20trekking.%20Can%20we%20chat%3F"
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    <Button className="gap-2 bg-green-600 hover:bg-green-700">
                        <MessageCircle className="h-4 w-4" />
                        Want a faster reply? Chat on WhatsApp
                    </Button>
                </a>
                <Button asChild variant="outline">
                    <Link href="/">Back to Home</Link>
                </Button>
            </div>
        </section>
    )
}
