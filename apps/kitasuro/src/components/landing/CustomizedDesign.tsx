import React from "react"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@repo/ui/button"

const CustomizedDesign = () => {
    return (
        <div className="border-b border-border">
            <section id="features" className="mx-auto border-border border-x w-fit px-8 py-16">
                <div className="mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl space-y-8">
                    <div className="flex justify-between items-end">
                        <div
                            className="animate-slide-up-fade"
                        >
                            <h2 className="font-heading text-3xl font-bold tracking-tight sm:text-5xl">
                                Your Brand, <span className="text-primary">Your Look</span>
                            </h2>
                            <p className="text-muted-foreground mt-4 max-w-2xl text-lg">
                                Pick a theme, add your logo, and match your brand colors. Every proposal looks like it came from your team.
                            </p>
                        </div>

                        <Button asChild size="lg" className="rounded-full px-6">
                            <Link href="/sign-up">Get Started</Link>
                        </Button>
                    </div>

                    <div className="w-full">
                        <Image
                            src="/screenshots/browser-mockup.png"
                            alt="Design Variety"
                            width={1200}
                            height={600}
                            className="border border-border rounded-2xl"
                        />
                    </div>
                </div>
            </section>
        </div>
    )
}

export default CustomizedDesign