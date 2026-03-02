import { Button } from '@repo/ui/button'
import Link from 'next/link'

export const metadata = {
    title: 'Thank You | Makisala Safaris',
    robots: { index: false, follow: false },
}

export default function ThankYouPage() {
    return (
        <section className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Thank you for your inquiry!
            </h1>
            <p className="text-muted-foreground mt-4 max-w-md text-lg">
                We've received your details and will get back to you within 24 hours with availability
                and next steps.
            </p>
            <Button asChild className="mt-8">
                <Link href="/">Back to Home</Link>
            </Button>
        </section>
    )
}
