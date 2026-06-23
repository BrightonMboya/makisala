'use client'

import { Button } from '@repo/ui/button'
import { Input } from '@repo/ui/input'
import { Textarea } from '@repo/ui/textarea'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@repo/ui/select'
import { ArrowLeft, ArrowRight, Check, Clock, Loader2, ShieldCheck, Star } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { usePostHog } from 'posthog-js/react'
import { createInquiry } from '@/lib/cms-service'
import { BASE_URL } from '@/lib/constants'
import { sendGTMEvent } from '@next/third-parties/google'
import { useToast } from '@/lib/hooks/use-toast'

type Destination = 'Tanzania' | 'Rwanda' | 'Not sure yet'

const DESTINATIONS: Destination[] = ['Tanzania', 'Rwanda', 'Not sure yet']

// en-US full month names, matching the toLocaleString('en-US', { month: 'long' })
// values used to build TRAVEL_WINDOWS. Used to parse a window back into a Date.
const MONTHS = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
]

const TRAVEL_WINDOWS = (() => {
    const out: string[] = ['I am flexible', 'Within the next 3 months']
    const now = new Date()
    for (let i = 0; i < 12; i++) {
        const d = new Date(now.getFullYear(), now.getMonth() + i, 1)
        out.push(d.toLocaleString('en-US', { month: 'long', year: 'numeric' }))
    }
    return out
})()

const BUDGETS = [
    'Under $3,000 per person',
    '$3,000 - $5,000 per person',
    '$5,000 - $8,000 per person',
    '$8,000 - $12,000 per person',
    '$12,000+ per person',
    'Not sure yet',
]

export default function HeroPlanForm() {
    const router = useRouter()
    const posthog = usePostHog()
    const { toast } = useToast()

    const [stage, setStage] = useState<'details' | 'contact'>('details')
    const [submitting, setSubmitting] = useState(false)

    const [destination, setDestination] = useState<Destination | null>(null)
    const [travelWindow, setTravelWindow] = useState<string>('')
    const [budget, setBudget] = useState<string>('')
    const [travellers, setTravellers] = useState<number>(2)
    const [details, setDetails] = useState('')

    const [email, setEmail] = useState('')
    const [phoneNumber, setPhoneNumber] = useState('')

    const canContinue =
        !!destination && !!travelWindow && !!budget && travellers >= 1

    const canSubmit = canContinue && email.trim().length > 3

    const handleContinue = () => {
        if (!canContinue) return
        posthog?.capture('Plan Form Details Completed', {
            destination,
            travelWindow,
            budget,
            travellers,
            has_details: details.length > 0,
        })
        setStage('contact')
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!canSubmit) return
        setSubmitting(true)

        const structuredComments = [
            `Destination interest: ${destination}`,
            `Travel window: ${travelWindow}`,
            `Budget per person: ${budget}`,
            `Travellers: ${travellers}`,
            details ? `\nFrom traveller:\n${details}` : null,
        ]
            .filter(Boolean)
            .join('\n')

        const startDate = (() => {
            if (
                travelWindow &&
                travelWindow !== 'I am flexible' &&
                travelWindow !== 'Within the next 3 months'
            ) {
                // travelWindow is always "<Month> <Year>" (e.g. "May 2027").
                // Parse it by hand: feeding a non-standard string like
                // "May 2027 01" to new Date() works in some engines but returns
                // Invalid Date in stricter ones (e.g. Safari), which silently
                // fell through to the today+60d fallback and produced wrong dates.
                const [monthName, yearStr] = travelWindow.split(' ')
                const monthIndex = monthName ? MONTHS.indexOf(monthName) : -1
                const year = Number(yearStr)
                if (monthIndex !== -1 && Number.isFinite(year)) {
                    return new Date(year, monthIndex, 1)
                }
            }
            return new Date(Date.now() + 60 * 24 * 60 * 60 * 1000)
        })()

        const fullNameFallback = email.split('@')[0] || 'New inquiry'

        try {
            await createInquiry({
                fullName: fullNameFallback,
                email,
                phoneNumber,
                countryOfResidence: '',
                numberOfTravellers: travellers,
                startDate,
                comments: structuredComments,
                url: `${BASE_URL}/`,
            })

            sendGTMEvent({
                event: 'conversion',
                send_to: 'AW-17982843958/autmCMmsk4EcELbY8f5C',
            })

            posthog?.capture('Plan Form Submitted', {
                destination,
                travelWindow,
                budget,
                travellers,
                has_details: details.length > 0,
                has_phone: phoneNumber.length > 0,
            })

            router.push('/thank-you')
        } catch (error) {
            console.error(error)
            toast('Error', {
                description: 'Failed to submit. Please try again.',
            })
            setSubmitting(false)
        }
    }

    return (
        <section className="relative w-full bg-white pt-16 pb-16 md:pt-24 md:pb-20">
            <div className="mx-auto grid w-full max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-2 lg:gap-12 lg:px-8">
                {/* Left: pitch */}
                <div className="flex flex-col justify-center">
                    <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 md:text-6xl">
                        Tailor-Made Safaris Across Tanzania & Rwanda
                    </h1>
                    <p className="mt-6 max-w-xl text-base text-gray-600 md:text-lg">
                        Tell us what you're looking for and our local experts will craft the perfect
                        itinerary for you within 24 hours.
                    </p>

                    <div className="mt-8 grid max-w-xl gap-4 sm:grid-cols-3">
                        <div className="flex items-start gap-2.5">
                            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-green-700" />
                            <div>
                                <div className="text-sm font-semibold text-gray-900">
                                    Local Safari Experts
                                </div>
                                <div className="text-xs text-gray-500">On the ground, in your corner</div>
                            </div>
                        </div>
                        <div className="flex items-start gap-2.5">
                            <Star className="mt-0.5 h-5 w-5 shrink-0 fill-yellow-400 text-yellow-400" />
                            <div>
                                <div className="text-sm font-semibold text-gray-900">Rated 4.9/5</div>
                                <div className="text-xs text-gray-500">From 200+ travellers</div>
                            </div>
                        </div>
                        <div className="flex items-start gap-2.5">
                            <Check className="mt-0.5 h-5 w-5 shrink-0 text-green-700" />
                            <div>
                                <div className="text-sm font-semibold text-gray-900">
                                    No Planning Fees
                                </div>
                                <div className="text-xs text-gray-500">You pay nothing extra</div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 hidden text-sm text-gray-600 lg:block">
                        <a
                            href="/safaris/tanzania"
                            className="font-medium underline-offset-4 hover:underline"
                        >
                            Or browse sample trips →
                        </a>
                    </div>
                </div>

                {/* Right: form card */}
                <div className="lg:pl-4">
                    <form
                        onSubmit={handleSubmit}
                        className="rounded-3xl border border-gray-200 bg-white p-6 shadow-[0_2px_24px_rgba(0,0,0,0.08)] md:p-8"
                    >
                        <div className="mb-1 text-center">
                            <h2 className="text-2xl font-bold text-gray-900 md:text-3xl">
                                Plan Your Safari
                            </h2>
                            <p className="mt-1 text-sm text-gray-500">
                                {stage === 'details'
                                    ? 'Get a custom itinerary in 24 hours'
                                    : 'Almost done. Where should we send it?'}
                            </p>
                        </div>

                        {stage === 'details' && (
                            <div className="mt-6 space-y-5">
                                {/* Destination */}
                                <div>
                                    <label className="text-xs font-bold tracking-wider text-gray-700 uppercase">
                                        Where do you want to go?
                                    </label>
                                    <div className="mt-2 grid grid-cols-3 gap-2">
                                        {DESTINATIONS.map(d => {
                                            const active = destination === d
                                            return (
                                                <button
                                                    key={d}
                                                    type="button"
                                                    onClick={() => setDestination(d)}
                                                    className={cn(
                                                        'flex items-center justify-center gap-1.5 rounded-lg border px-2 py-2.5 text-sm font-medium transition-all',
                                                        active
                                                            ? 'border-primary bg-primary/10 text-primary'
                                                            : 'border-gray-300 bg-white text-gray-800 hover:border-gray-400'
                                                    )}
                                                >
                                                    {d}
                                                    {active && <Check className="h-3.5 w-3.5" />}
                                                </button>
                                            )
                                        })}
                                    </div>
                                </div>

                                {/* When */}
                                <div>
                                    <label className="text-xs font-bold tracking-wider text-gray-700 uppercase">
                                        When are you traveling?
                                    </label>
                                    <Select value={travelWindow} onValueChange={setTravelWindow}>
                                        <SelectTrigger className="mt-2 h-12 w-full">
                                            <SelectValue placeholder="Select travel dates" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {TRAVEL_WINDOWS.map(w => (
                                                <SelectItem key={w} value={w}>
                                                    {w}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Budget */}
                                <div>
                                    <label className="text-xs font-bold tracking-wider text-gray-700 uppercase">
                                        What's your budget? (per person)
                                    </label>
                                    <Select value={budget} onValueChange={setBudget}>
                                        <SelectTrigger className="mt-2 h-12 w-full">
                                            <SelectValue placeholder="Select budget range" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {BUDGETS.map(b => (
                                                <SelectItem key={b} value={b}>
                                                    {b}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Travellers */}
                                <div>
                                    <label className="text-xs font-bold tracking-wider text-gray-700 uppercase">
                                        How many travellers?
                                    </label>
                                    <div className="mt-2 flex items-center gap-3 rounded-lg border border-gray-300 bg-white px-4 py-2.5">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="icon"
                                            className="h-8 w-8 rounded-full"
                                            onClick={() =>
                                                setTravellers(Math.max(1, travellers - 1))
                                            }
                                            disabled={travellers <= 1}
                                        >
                                            -
                                        </Button>
                                        <span className="flex-1 text-center text-sm font-medium">
                                            {travellers}{' '}
                                            {travellers === 1 ? 'traveller' : 'travellers'}
                                        </span>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="icon"
                                            className="h-8 w-8 rounded-full"
                                            onClick={() => setTravellers(travellers + 1)}
                                        >
                                            +
                                        </Button>
                                    </div>
                                </div>

                                <Button
                                    type="button"
                                    onClick={handleContinue}
                                    disabled={!canContinue}
                                    className="bg-primary hover:bg-primary/90 mt-2 h-12 w-full rounded-xl text-white"
                                >
                                    Continue
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>

                                <div className="flex items-center justify-center gap-1.5 text-xs text-gray-500">
                                    <Clock className="h-3.5 w-3.5" />
                                    Takes 30 seconds. No spam, ever.
                                </div>
                            </div>
                        )}

                        {stage === 'contact' && (
                            <div className="mt-6 space-y-4">
                                {/* Recap */}
                                <div className="rounded-lg bg-gray-50 p-3 text-sm text-gray-700">
                                    <div className="flex items-baseline justify-between gap-2">
                                        <div>
                                            <span className="font-medium">{destination}</span>
                                            {' • '}
                                            <span>{travelWindow}</span>
                                            {' • '}
                                            <span>
                                                {travellers}{' '}
                                                {travellers === 1 ? 'traveller' : 'travellers'}
                                            </span>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setStage('details')}
                                            className="shrink-0 text-xs font-medium text-gray-500 underline-offset-2 hover:underline"
                                        >
                                            Edit
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <label className="text-xs font-bold tracking-wider text-gray-700 uppercase">
                                        Anything else we should know?{' '}
                                        <span className="text-gray-400 normal-case">(optional)</span>
                                    </label>
                                    <Textarea
                                        value={details}
                                        onChange={e => setDetails(e.target.value)}
                                        placeholder="Honeymoon, kids' ages, must-see wildlife, lodge preferences, mobility, extending to Zanzibar..."
                                        className="mt-2 min-h-[72px] resize-none"
                                    />
                                </div>

                                <Input
                                    type="email"
                                    inputMode="email"
                                    autoComplete="email"
                                    placeholder="Your email"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    className="h-12"
                                    required
                                    autoFocus
                                />
                                <Input
                                    type="tel"
                                    inputMode="tel"
                                    autoComplete="tel"
                                    placeholder="Phone or WhatsApp (optional, faster reply)"
                                    value={phoneNumber}
                                    onChange={e => setPhoneNumber(e.target.value)}
                                    className="h-12"
                                />

                                <Button
                                    type="submit"
                                    disabled={!canSubmit || submitting}
                                    className="bg-primary hover:bg-primary/90 mt-2 h-12 w-full rounded-xl text-white"
                                >
                                    {submitting ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending
                                        </>
                                    ) : (
                                        <>
                                            Get my custom itinerary
                                            <ArrowRight className="ml-2 h-4 w-4" />
                                        </>
                                    )}
                                </Button>

                                <div className="flex items-center justify-between text-xs text-gray-500">
                                    <button
                                        type="button"
                                        onClick={() => setStage('details')}
                                        className="flex items-center gap-1 hover:text-gray-700"
                                    >
                                        <ArrowLeft className="h-3 w-3" />
                                        Back
                                    </button>
                                    <span>We reply within 24 hours.</span>
                                </div>
                            </div>
                        )}
                    </form>

                    <div className="mt-6 text-center lg:hidden">
                        <a
                            href="/safaris/tanzania"
                            className="text-sm font-medium text-gray-600 underline-offset-4 hover:underline"
                        >
                            Or browse sample trips →
                        </a>
                    </div>
                </div>
            </div>
        </section>
    )
}
