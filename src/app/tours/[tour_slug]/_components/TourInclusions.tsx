import { Check, X } from 'lucide-react'

interface TourInclusionsProps {
    inclusions: string[]
    exclusions: string[]
}

export default function TourInclusions({
    inclusions,
    exclusions,
}: TourInclusionsProps) {
    return (
        <div className="grid gap-8 md:grid-cols-2">
            <div className="rounded-2xl bg-green-50/50 p-8">
                <div className="mb-6 flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 text-green-600">
                        <Check className="h-5 w-5" />
                    </div>
                    <h3 className="font-heading text-xl font-bold text-gray-900">
                        What's Included
                    </h3>
                </div>
                <ul className="space-y-4">
                    {inclusions.map((item, index) => (
                        <li key={index} className="flex items-start gap-3 text-gray-700">
                            <Check className="mt-1 h-4 w-4 shrink-0 text-green-600" />
                            <span className="text-sm md:text-base">{item}</span>
                        </li>
                    ))}
                </ul>
            </div>

            <div className="rounded-2xl bg-red-50/50 p-8">
                <div className="mb-6 flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-100 text-red-600">
                        <X className="h-5 w-5" />
                    </div>
                    <h3 className="font-heading text-xl font-bold text-gray-900">
                        What's Excluded
                    </h3>
                </div>
                <ul className="space-y-4">
                    {exclusions.map((item, index) => (
                        <li key={index} className="flex items-start gap-3 text-gray-700">
                            <X className="mt-1 h-4 w-4 shrink-0 text-red-600" />
                            <span className="text-sm md:text-base">{item}</span>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    )
}
