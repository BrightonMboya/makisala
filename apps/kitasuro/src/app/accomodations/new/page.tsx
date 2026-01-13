import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@repo/ui/button'
import AccomodationForm from '../_components/AccomodationForm'

export default function NewAccomodationPage() {
    return (
        <div className="mx-auto max-w-7xl p-4 mt-10">
            <div className="mb-8">
                <Button variant="ghost" asChild className="-ml-4 mb-4">
                    <Link href="/accomodations">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to List
                    </Link>
                </Button>
                <h1 className="text-3xl font-bold text-gray-900">Add New Accomodation</h1>
                <p className="mt-2 text-gray-600">Create a new accomodation entry with details and images.</p>
            </div>

            <AccomodationForm />
        </div>
    )
}
