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

const formSchema = z.object({
    fullName: z.string().min(1, 'Full name is required'),
    email: z.email('Valid email is required'),
    travelMonth: z.string().min(1, 'Please select a travel month'),
    numberOfTravellers: z.number().min(1, 'At least 1 traveler'),
    whatsapp: z.string().optional(),
    comments: z.string().optional(),
})

type FormData = z.infer<typeof formSchema>

export default function GorillaTrekForm() {
    const { toast } = useToast()
    const log = useLogger()
    const pathname = usePathname()
    const router = useRouter()
    const [isPending, setIsPending] = React.useState(false)

    const form = useForm<FormData>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            fullName: '',
            email: '',
            travelMonth: '',
            numberOfTravellers: 2,
            whatsapp: '',
            comments: '',
        },
    })

    const onSubmit = async (data: FormData) => {
        setIsPending(true)
        try {
            await createInquiry({
                fullName: data.fullName,
                email: data.email,
                countryOfResidence: '',
                numberOfTravellers: data.numberOfTravellers,
                startDate: new Date(),
                comments: `Travel month: ${data.travelMonth}.${data.whatsapp ? ` WhatsApp: ${data.whatsapp}.` : ''} ${data.comments || ''}`.trim(),
                url: `${BASE_URL}${pathname}`,
            })
            sendGTMEvent({
                event: 'conversion',
                send_to: 'AW-17982843958/autmCMmsk4EcELbY8f5C',
            })
            form.reset()
            router.push('/thank-you')
        } catch (error) {
            log.error('Gorilla trek form submission failed', {
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

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                                        value={field.value}
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
                                        value={field.value}
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

                <FormField
                    control={form.control}
                    name="comments"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>
                                Message{' '}
                                <span className="text-muted-foreground font-normal">
                                    (optional)
                                </span>
                            </FormLabel>
                            <FormControl>
                                <Textarea
                                    placeholder="Preferred dates, questions..."
                                    className="min-h-[70px]"
                                    {...field}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <Button
                    type="submit"
                    className="w-full py-3 text-base font-semibold"
                    size="lg"
                    disabled={isPending}
                >
                    {isPending ? 'Checking...' : 'Check Availability'}
                </Button>
                <p className="text-muted-foreground text-center text-xs">
                    No payment required. We respond within 24 hours.
                </p>
            </form>
        </Form>
    )
}
