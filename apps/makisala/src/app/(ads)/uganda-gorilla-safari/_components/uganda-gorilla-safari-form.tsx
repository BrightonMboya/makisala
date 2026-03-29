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

const formSchema = z.object({
    email: z.email('Valid email is required'),
    message: z.string().optional(),
})

type FormData = z.infer<typeof formSchema>

export default function UgandaGorillaSafariForm() {
    const { toast } = useToast()
    const log = useLogger()
    const pathname = usePathname()
    const router = useRouter()
    const [isPending, setIsPending] = React.useState(false)

    const form = useForm<FormData>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            email: '',
            message: '',
        },
    })

    const onSubmit = async (data: FormData) => {
        setIsPending(true)
        try {
            await createInquiry({
                fullName: '',
                email: data.email,
                countryOfResidence: '',
                numberOfTravellers: 2,
                startDate: new Date(),
                comments: data.message || '',
                url: `${BASE_URL}${pathname}`,
            })
            sendGTMEvent({
                event: 'conversion',
                send_to: 'AW-17982843958/autmCMmsk4EcELbY8f5C',
            })
            form.reset()
            router.push('/thank-you')
        } catch (error) {
            log.error('Uganda gorilla safari form submission failed', {
                error: error instanceof Error ? error.message : String(error),
                email: data.email,
                pathname,
            })
            toast('Error', {
                description: 'Failed to submit. Please try again.',
            })
        } finally {
            setIsPending(false)
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="flex items-center gap-2 rounded-lg bg-green-50 px-3 py-2 text-sm">
                    <Check className="h-4 w-4 shrink-0 text-green-600" />
                    <span className="text-gray-700">Free quote, no obligation. We reply within 24 hours.</span>
                </div>

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

                <FormField
                    control={form.control}
                    name="message"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>
                                What are you looking for?{' '}
                                <span className="text-muted-foreground font-normal">
                                    (optional)
                                </span>
                            </FormLabel>
                            <FormControl>
                                <Textarea
                                    placeholder="E.g. gorilla trekking for 2 people in July, mid-range lodges..."
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
                    {isPending ? 'Sending...' : 'Get My Free Quote'}
                </Button>
                <p className="text-muted-foreground text-center text-xs">
                    No payment required. We respond within 24 hours.
                </p>
            </form>
        </Form>
    )
}
