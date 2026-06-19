'use client'

import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@repo/ui/form'
import { Input } from '@repo/ui/input'
import { Textarea } from '@repo/ui/textarea'
import { Button } from '@repo/ui/button'
import React from 'react'
import { z } from 'zod'
import { useToast } from '@/lib/hooks/use-toast'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createInquiry } from '@/lib/cms-service'
import { usePathname, useRouter } from 'next/navigation'
import { BASE_URL } from '@/lib/constants'
import { sendGTMEvent } from '@next/third-parties/google'
import { useLogger } from 'next-axiom'
import { Check } from 'lucide-react'

// Shared inquiry form for every (ads) landing page. Behaviour is identical
// across pages: write the lead via createInquiry, fire the page's Google Ads
// conversion, then redirect to /thank-you. Everything that differs per campaign
// is a prop. See the per-page configs in each page.tsx.

const travelMonths = [
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
    'Flexible',
]

// Superset schema covering both variants. travelMonth is enforced in onSubmit
// for the detailed variant (kept optional here so the simple variant validates).
const formSchema = z.object({
    fullName: z.string().min(1, 'Full name is required'),
    email: z.email('Valid email is required'),
    travelMonth: z.string().optional(),
    numberOfTravellers: z.number().min(1, 'At least 1 traveler').optional(),
    whatsapp: z.string().optional(),
    message: z.string().optional(),
    comments: z.string().optional(),
})

type FormData = z.infer<typeof formSchema>

declare global {
    interface Window {
        fbq?: (...args: unknown[]) => void
    }
}

type Variant = 'detailed' | 'simple'

export interface LandingInquiryFormProps {
    /**
     * Google Ads conversion action this page reports to. DIFFERS PER CAMPAIGN.
     * This is the one prop that must never be crossed between pages.
     */
    conversionSendTo: string
    /** Axiom error label, e.g. 'Gorilla trek form submission failed'. */
    logLabel: string
    /**
     * 'detailed' = Travel Month + Travelers selects (gorilla, honeymoon).
     * 'simple'   = single Message box + reassurance row (kilimanjaro, uganda).
     */
    variant?: Variant
    /** Prepended to the saved inquiry comments, e.g. '[Tanzania Honeymoon LP] '. */
    commentPrefix?: string
    submitLabel?: string
    pendingLabel?: string
    messagePlaceholder?: string
    /** Show the green "100% free quote" reassurance row above the fields. */
    showRiskReducer?: boolean
}

export default function LandingInquiryForm({
    conversionSendTo,
    logLabel,
    variant = 'detailed',
    commentPrefix = '',
    submitLabel = 'Get a Free Quote',
    pendingLabel = 'Sending...',
    messagePlaceholder = 'Tell us about your trip: dates, group size, anything special...',
    showRiskReducer = false,
}: LandingInquiryFormProps) {
    const { toast } = useToast()
    const log = useLogger()
    const pathname = usePathname()
    const router = useRouter()
    const [isPending, setIsPending] = React.useState(false)

    const isDetailed = variant === 'detailed'
    // Detailed binds the free-text box to `comments`; simple binds it to `message`.
    const messageFieldName: 'comments' | 'message' = isDetailed ? 'comments' : 'message'

    const form = useForm<FormData>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            fullName: '',
            email: '',
            travelMonth: '',
            numberOfTravellers: 2,
            whatsapp: '',
            message: '',
            comments: '',
        },
    })

    const onSubmit = async (data: FormData) => {
        if (isDetailed && !data.travelMonth) {
            form.setError('travelMonth', { message: 'Please select a travel month' })
            return
        }
        setIsPending(true)
        try {
            const whatsappNote = data.whatsapp ? ` WhatsApp: ${data.whatsapp}.` : ''
            const comments = isDetailed
                ? `${commentPrefix}Travel month: ${data.travelMonth}.${whatsappNote} ${data.comments || ''}`.trim()
                : `${commentPrefix}${data.message || ''}${whatsappNote}`.trim()

            await createInquiry({
                fullName: data.fullName,
                email: data.email,
                countryOfResidence: '',
                numberOfTravellers: isDetailed ? (data.numberOfTravellers ?? 2) : 2,
                startDate: new Date(),
                comments,
                url: `${BASE_URL}${pathname}`,
            })
            sendGTMEvent({
                event: 'conversion',
                send_to: conversionSendTo,
            })
            // Meta pixel lead conversion. Reliable event-based signal fired at
            // submit time (the /thank-you redirect is too flaky to key off of).
            window.fbq?.('track', 'Lead')
            form.reset()
            router.push('/thank-you')
        } catch (error) {
            log.error(logLabel, {
                error: error instanceof Error ? error.message : String(error),
                email: data.email,
                pathname,
            })
            toast('Error', {
                description: 'Failed to submit inquiry. Please try again.',
            })
        } finally {
            setIsPending(false)
        }
    }

    const messageField = (
        <FormField
            control={form.control}
            name={messageFieldName}
            render={({ field }) => (
                <FormItem>
                    <FormLabel>
                        Message{' '}
                        <span className="text-muted-foreground font-normal">(optional)</span>
                    </FormLabel>
                    <FormControl>
                        <Textarea
                            placeholder={messagePlaceholder}
                            className="min-h-[70px]"
                            {...field}
                        />
                    </FormControl>
                    <FormMessage />
                </FormItem>
            )}
        />
    )

    const whatsappField = (
        <FormField
            control={form.control}
            name="whatsapp"
            render={({ field }) => (
                <FormItem>
                    <FormLabel>
                        WhatsApp Number{' '}
                        <span className="text-muted-foreground font-normal">
                            (for faster response)
                        </span>
                    </FormLabel>
                    <FormControl>
                        <Input placeholder="+1 234 567 8900" type="tel" {...field} />
                    </FormControl>
                    <FormMessage />
                </FormItem>
            )}
        />
    )

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                {showRiskReducer && (
                    <div className="flex items-center gap-2 rounded-lg bg-green-50 px-3 py-2 text-sm">
                        <Check className="h-4 w-4 text-green-600 shrink-0" />
                        <span className="text-gray-700">
                            100% free quote, no obligation to book
                        </span>
                    </div>
                )}

                <FormField
                    control={form.control}
                    name="fullName"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Full Name</FormLabel>
                            <FormControl>
                                <Input placeholder="Your full name" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                                <Input placeholder="you@email.com" type="email" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {isDetailed && (
                    <div className="grid grid-cols-2 gap-3">
                        <FormField
                            control={form.control}
                            name="travelMonth"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Travel Month</FormLabel>
                                    <FormControl>
                                        <select
                                            className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
                                            value={field.value ?? ''}
                                            onChange={field.onChange}
                                        >
                                            <option value="">Select month</option>
                                            {travelMonths.map(month => (
                                                <option key={month} value={month}>
                                                    {month}
                                                </option>
                                            ))}
                                        </select>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="numberOfTravellers"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Travelers</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="number"
                                            min="1"
                                            max="20"
                                            value={field.value ?? ''}
                                            onChange={e => {
                                                const val = parseInt(e.target.value, 10)
                                                if (!isNaN(val)) field.onChange(val)
                                            }}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                )}

                {/* Detailed puts WhatsApp before the message box; simple reverses it,
                    matching each variant's original layout. */}
                {isDetailed ? (
                    <>
                        {whatsappField}
                        {messageField}
                    </>
                ) : (
                    <>
                        {messageField}
                        {whatsappField}
                    </>
                )}

                <Button
                    type="submit"
                    className="w-full py-3 text-base font-semibold"
                    size="lg"
                    disabled={isPending}
                >
                    {isPending ? pendingLabel : submitLabel}
                </Button>
                <p className="text-muted-foreground text-center text-xs">
                    No payment required. We respond within 24 hours.
                </p>
            </form>
        </Form>
    )
}
