import React from 'react'
import Link from 'next/link'

const CallToAction = () => {
    return (
        <div className='relative overflow-hidden'>
            <section className="mx-auto border border-border border-t-0 rounded-b-4xl w-fit px-8 space-y-20 relative py-28">
            <div className="bg-dot-pattern pointer-events-none absolute inset-0 mask-[radial-gradient(ellipse_at_center,black_20%,transparent_60%)] opacity-30" />
                <div className="relative mx-auto min-w-5xl px-4 text-center w-full">
                    <h2
                        className="animate-slide-up-fade font-heading mb-6 text-4xl font-bold tracking-tight sm:text-5xl leading-tight"
                        style={{ '--delay': '0ms' } as React.CSSProperties}
                    >
                        Your next proposal could take <br />
                        <span className='text-primary'>10 minutes, not 2 hours</span>
                    </h2>
                    <p
                        className="animate-slide-up-fade text-muted-foreground mb-10 text-xl"
                        style={{ '--delay': '100ms' } as React.CSSProperties}
                    >
                        Sign up, build your first itinerary, and send it to a client today. No credit card
                        needed.
                    </p>
                    <div
                        className="animate-slide-up-fade flex flex-col items-center justify-center gap-4 sm:flex-row"
                        style={{ '--delay': '200ms' } as React.CSSProperties}
                    >
                        <Link
                            href="/sign-up"
                            className="bg-primary text-primary-foreground hover:bg-primary/90 focus-visible:ring-ring shadow-primary/20 inline-flex h-12 items-center justify-center rounded-full px-8 text-sm font-medium shadow-lg transition-colors focus-visible:ring-1 focus-visible:outline-none"
                        >
                            Create your first itinerary free
                        </Link>
                        <Link
                            href="https://cal.com/brightonmboya/30min"
                            className="border-input bg-background hover:bg-accent hover:text-accent-foreground focus-visible:ring-ring inline-flex h-12 items-center justify-center rounded-full border px-8 text-sm font-medium shadow-sm transition-colors focus-visible:ring-1 focus-visible:outline-none"
                        >
                            Book a demo call
                        </Link>
                    </div>
                </div>
            </section>

            <div className='bg-dot-pattern pointer-events-none absolute inset-0 mask-[radial-gradient(ellipse_at_center,black_20%,transparent_60%)] opacity-30 py-96' />
        </div>
    )
}

export default CallToAction