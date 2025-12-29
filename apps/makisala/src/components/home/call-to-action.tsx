import { InquiryDialog } from '../enquire-dialog-button'
import { Button } from '@repo/ui/button'
import { Users } from 'lucide-react'

export default function C2A() {
    return (
        <section className="from-primary/10 to-secondary/10 bg-gradient-to-r py-16">
            <div className="container mx-auto px-4 text-center">
                <h2 className="mb-6 text-3xl font-bold md:text-4xl">
                    Ready to Start Your Journey?
                </h2>
                <p className="mx-auto mb-8 max-w-2xl text-xl opacity-90">
                    Let us help you create memories that will last a lifetime. Explore our
                    destinations and find your next adventure.
                </p>
                <InquiryDialog>
                    <Button size="lg" className="bg-primary hover:bg-primary/90">
                        <Users className="mr-2 h-5 w-5" />
                        Speak with Our Experts
                    </Button>
                </InquiryDialog>
            </div>
        </section>
    )
}
