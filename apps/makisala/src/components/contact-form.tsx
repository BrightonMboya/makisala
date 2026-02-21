'use client'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@repo/ui/form'
import { Input } from '@repo/ui/input'
import { Textarea } from '@repo/ui/textarea'
import { Calendar } from '@repo/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@repo/ui/popover'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { CalendarIcon } from 'lucide-react'

import { Button } from '@repo/ui/button'
import React from 'react'
import { z } from 'zod'
import { useToast } from '@/lib/hooks/use-toast'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createInquiry } from '@/lib/cms-service'
import { usePathname } from 'next/navigation'
import { BASE_URL } from '@/lib/constants'
import { CountryDropdown } from '@repo/ui/country-dropdown'

export default function ContactForm({
    setOpen,
}: {
    setOpen?: React.Dispatch<React.SetStateAction<boolean>>
}) {
    const [openCalendar, setOpenCalendar] = React.useState<boolean>(false)
    const { toast } = useToast()
    const pathname = usePathname()

    const formSchema = z.object({
        fullName: z.string().min(1, 'Full Name is required'),
        email: z.string().email('Valid email is required'),
        countryOfResidence: z.string().min(1, 'Country of residence is required'),
        phoneNumber: z.string().min(1, 'Phone number is required'),
        numberOfTravellers: z.number().min(1, 'Number of travellers is required'),
        startDate: z.date().min(1, 'Start date is required'),
        comments: z.string().min(1, 'Comments are required'),
    })

    type FormData = z.infer<typeof formSchema>
    const form = useForm<FormData>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            fullName: '',
            countryOfResidence: '',
            phoneNumber: '',
            email: '',
            comments: '',
            numberOfTravellers: 1,
            startDate: new Date(),
        },
    })
    const onSubmit = async (data: FormData) => {
        try {
            await createInquiry({
                ...data,
                url: `${BASE_URL}/${pathname}`,
            })
            toast('Inquiry Submitted', {
                description: "We'll get back to you within 24 hours!",
            })
            setOpen && setOpen(false)
            form.reset()
        } catch (error) {
            toast('Error', {
                description: 'Failed to submit inquiry. Please try again.',
            })
            console.log(error)
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Personal Information */}
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Personal Details</h3>
                    <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Email*</FormLabel>
                                <FormControl>
                                    <Input placeholder="hi@makisala.com" type="email" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <div className="">
                        <FormField
                            control={form.control}
                            name="fullName"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Full Names*</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Brighton Mboya" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <FormField
                            control={form.control}
                            name="countryOfResidence"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Country of Residence*</FormLabel>
                                    <CountryDropdown
                                        placeholder="Select countries"
                                        onChange={country => field.onChange(country.name)}
                                        defaultValue={field.value}
                                        value={field.value}
                                    />
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="phoneNumber"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Phone Number*</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Phone number" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                </div>

                {/* Travel Information */}
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Travel Information</h3>
                    <FormField
                        control={form.control}
                        name="startDate"
                        render={({ field }) => (
                            <FormItem className="flex flex-col">
                                <FormLabel>What is your start date?*</FormLabel>
                                <Popover open={openCalendar} onOpenChange={setOpenCalendar}>
                                    <PopoverTrigger asChild>
                                        <FormControl>
                                            <Button
                                                variant={'outline'}
                                                className={cn(
                                                    'w-full pl-3 text-left font-normal',
                                                    !field.value && 'text-muted-foreground'
                                                )}
                                            >
                                                {field.value ? (
                                                    format(field.value, 'PPP')
                                                ) : (
                                                    <span>Pick a date</span>
                                                )}
                                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                            </Button>
                                        </FormControl>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar
                                            mode="single"
                                            selected={field.value}
                                            onSelect={e => {
                                                setOpenCalendar(false)
                                                field.onChange(e)
                                            }}
                                            disabled={date => date < new Date()}
                                            initialFocus
                                            className={cn('pointer-events-auto p-3')}
                                        />
                                    </PopoverContent>
                                </Popover>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="numberOfTravellers"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Number of Travellers*</FormLabel>
                                <FormControl>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="icon"
                                            className="h-10 w-10 shrink-0"
                                            onClick={() => {
                                                const newValue = Math.max(1, field.value - 1)
                                                field.onChange(newValue)
                                            }}
                                            disabled={field.value <= 1}
                                        >
                                            -
                                        </Button>
                                        <Input
                                            type="number"
                                            min="1"
                                            placeholder="1"
                                            className="text-center"
                                            value={field.value}
                                            onChange={e => {
                                                const value = e.target.value
                                                // Allow empty string during typing
                                                if (value === '') {
                                                    field.onChange(undefined)
                                                } else {
                                                    const parsed = parseInt(value, 10)
                                                    if (!isNaN(parsed)) {
                                                        field.onChange(parsed)
                                                    }
                                                }
                                            }}
                                            onBlur={e => {
                                                // Ensure minimum value on blur
                                                const value = e.target.value
                                                if (value === '' || parseInt(value, 10) < 1) {
                                                    field.onChange(1)
                                                }
                                            }}
                                        />
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="icon"
                                            className="h-10 w-10 shrink-0"
                                            onClick={() => {
                                                field.onChange(field.value + 1)
                                            }}
                                        >
                                            +
                                        </Button>
                                    </div>
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
                                <FormLabel>Any other comments or requests?*</FormLabel>
                                <FormControl>
                                    <Textarea
                                        placeholder="We are two families travelling together and would love to see gorillas and chimps, do a 7-day safari to experience the wildebeest migration and then spend 5 days on the beach with great snorkelling and diving. We are an adventurous bunch and would also love to include some walking safaris with the BIG5!"
                                        className="min-h-[100px]"
                                        {...field}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <p className="text-muted-foreground text-center text-xs">
                    We'll confirm availability and next steps within 24 hours.
                </p>
                <Button type="submit" className="w-full">
                    Check Availability
                </Button>
            </form>
        </Form>
    )
}
