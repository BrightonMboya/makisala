import { Button } from '@repo/ui/button'
import { Card, CardContent, CardFooter, CardHeader } from '@repo/ui/card'
import { Check } from 'lucide-react'
import { InquiryDialog } from '@/components/enquire-dialog-button'

interface BookTourCardProps {
    price: string
}

export default function BookTourCard({ price }: BookTourCardProps) {
    return (
        <Card className="sticky top-24 overflow-hidden border-none shadow-xl ring-1 ring-gray-200">
            <CardHeader className="bg-primary p-6 text-white">
                <p className="text-primary-foreground/80 text-sm font-medium tracking-wider uppercase">
                    Starting from
                </p>
                <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold">${price}</span>
                    <span className="text-primary-foreground/80 text-sm">/ per person</span>
                </div>
            </CardHeader>
            <CardContent className="space-y-6 p-6">
                <div className="space-y-2">
                    <h3 className="font-medium text-gray-900">Why book with us?</h3>
                    <ul className="space-y-2">
                        <li className="flex items-start gap-2 text-sm text-gray-600">
                            <Check className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
                            <span>Expert local guides</span>
                        </li>
                        <li className="flex items-start gap-2 text-sm text-gray-600">
                            <Check className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
                            <span>Tailor-made experiences</span>
                        </li>
                        <li className="flex items-start gap-2 text-sm text-gray-600">
                            <Check className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
                            <span>24/7 support during your trip</span>
                        </li>
                    </ul>
                </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-3 bg-gray-50 p-6">
                <InquiryDialog>
                    <Button
                        size="lg"
                        className="bg-primary w-full px-6 py-2 text-lg text-sm font-medium text-white"
                    >
                        Book This Tour
                    </Button>
                </InquiryDialog>
                {/* <Button
                    variant="outline"
                    size="lg"
                    className="w-full text-lg"
                    asChild
                >
                    <Link href="/contact">
                        <Phone className="mr-2 h-4 w-4" />
                        Enquire Now
                    </Link>
                </Button> */}
                <p className="text-muted-foreground text-center text-xs">
                    No credit card required for enquiry
                </p>
            </CardFooter>
        </Card>
    )
}
