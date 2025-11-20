'use client'
import { useState, useEffect } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form'
import { useToast } from '@/lib/hooks/use-toast'
import SelectAccommodation from '@/app/cms/tour-builder/_components/SelectAccommodation'
import SelectDestination from '@/app/cms/tour-builder/_components/SelectDestination'
import { CloudinaryImagePicker } from '@/app/cms/tour-builder/_components/CloudinaryImagePicker'
import { createTour, getAccommodations, getNationalParks } from './actions'
import { TagInput } from '@/components/ui/tag-input'

const itinerarySchema = z.object({
    title: z.string().min(1, 'Day title is required'),
    overview: z.string().optional(),
    national_park_id: z.string().optional(),
    accommodation_id: z.string().optional(),
})

const activitySchema = z.object({
    title: z.string().min(2),
    activity_name: z.string().min(2),
})

const featureSchema = z.object({
    title: z.string().min(2),
    description: z.string().min(2),
})

const tourPackageSchema = z.object({
    tourName: z.string().min(2, {
        message: 'Tour name must be at least 2 characters.',
    }),
    slug: z.string().optional(),
    overview: z.string().min(10, {
        message: 'Overview must be at least 10 characters.',
    }),
    pricing: z.string().min(1, {
        message: 'Pricing is required.',
    }),
    country: z.string().min(2, {
        message: 'Country is required.',
    }),
    img_url: z.string().url({
        message: 'Please enter a valid URL for the image.',
    }),
    number_of_days: z.number().min(1, {
        message: 'Number of days must be at least 1.',
    }),
    tags: z.array(z.string()).min(1, {
        message: 'At least one tag is required.',
    }),
    activities: z.array(activitySchema),
    topFeatures: z.array(featureSchema),
    itineraries: z.array(itinerarySchema).min(1, 'At least one day itinerary is required'),
})

export type TourPackageForm = z.infer<typeof tourPackageSchema>

export default function TourPackageBuilder() {
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [parks, setParks] = useState<any[]>([])
    const [accommodations, setAccommodations] = useState<any[]>([])
    const { toast } = useToast()

    const form = useForm<TourPackageForm>({
        resolver: zodResolver(tourPackageSchema),
        defaultValues: {
            tourName: '',
            number_of_days: 1,
            country: '',
            overview: '',
            pricing: '',
            img_url: '',
            tags: [],
            activities: [],
            topFeatures: [],
            itineraries: [
                {
                    title: 'Day 1',
                    overview: '',
                    national_park_id: '',
                    accommodation_id: '',
                },
            ],
        },
    })

    const { fields: itineraryFields, append: appendItinerary, remove: removeItinerary } = useFieldArray({
        control: form.control,
        name: 'itineraries',
    })

    const { fields: activityFields, append: appendActivity, remove: removeActivity } = useFieldArray({
        control: form.control,
        name: 'activities',
    })

    const { fields: featureFields, append: appendFeature, remove: removeFeature } = useFieldArray({
        control: form.control,
        name: 'topFeatures',
    })

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        try {
            const [p, a] = await Promise.all([getNationalParks(), getAccommodations()])
            setParks(p)
            setAccommodations(a)
        } catch (error) {
            console.error('Failed to fetch data', error)
        }
    }

    const onSubmit = async (data: TourPackageForm) => {
        setIsSubmitting(true)
        try {
            const formattedData = {
                ...data,
                itineraries: data.itineraries.map((it, index) => ({
                    dayNumber: index + 1,
                    ...it,
                })),
            }

            const result = await createTour(formattedData)

            if (result.success) {
                toast('', {
                    description: 'Tour package has been created successfully.',
                })
                form.reset()
            } else {
                throw result.error
            }
        } catch (error) {
            console.error('Error creating tour package:', error)
            toast('', {
                description: 'Failed to create tour package. Please try again.',
                variant: 'destructive',
            })
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className="from-background to-accent/20 mt-10 min-h-screen bg-gradient-to-br p-6">
            <div className="mx-auto max-w-5xl">
                <div className="mb-8 text-center">
                    <h1 className="mb-2 text-4xl font-bold">Tour Builder</h1>
                    <p className="text-muted-foreground text-lg">Create amazing travel experiences</p>
                </div>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                        {/* Basic Info */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Basic Information</CardTitle>
                            </CardHeader>
                            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <FormField
                                    control={form.control}
                                    name="tourName"
                                    render={({ field }) => (
                                        <FormItem className="md:col-span-2">
                                            <FormLabel>Tour Name</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Amazing Safari" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="country"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Country</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Tanzania" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="number_of_days"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Number of Days</FormLabel>
                                            <FormControl>
                                                <Input type="number" min="1" {...field} onChange={e => field.onChange(parseInt(e.target.value))} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="pricing"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Pricing (USD)</FormLabel>
                                            <FormControl>
                                                <Input placeholder="5000" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="tags"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Tags</FormLabel>
                                            <FormControl>
                                                <TagInput
                                                    placeholder="Enter tags (press Enter to add)"
                                                    tags={field.value}
                                                    setTags={field.onChange}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="overview"
                                    render={({ field }) => (
                                        <FormItem className="md:col-span-2">
                                            <FormLabel>Overview</FormLabel>
                                            <FormControl>
                                                <Textarea placeholder="Tour description..." className="min-h-32" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="img_url"
                                    render={({ field }) => (
                                        <FormItem className="md:col-span-2">
                                            <FormLabel>Cover Image</FormLabel>
                                            <FormControl>
                                                <CloudinaryImagePicker 
                                                    value={field.value} 
                                                    onSelect={field.onChange} 
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </CardContent>
                        </Card>

                        {/* Activities & Features */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between">
                                    <CardTitle>Activities</CardTitle>
                                    <Button type="button" variant="outline" size="sm" onClick={() => appendActivity({ title: '', activity_name: '' })}>
                                        <Plus className="h-4 w-4" />
                                    </Button>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {activityFields.map((field, index) => (
                                        <div key={field.id} className="flex gap-2 items-start">
                                            <div className="grid gap-2 flex-1">
                                                <FormField
                                                    control={form.control}
                                                    name={`activities.${index}.title`}
                                                    render={({ field }) => (
                                                        <Input placeholder="Title (e.g. Morning)" {...field} />
                                                    )}
                                                />
                                                <FormField
                                                    control={form.control}
                                                    name={`activities.${index}.activity_name`}
                                                    render={({ field }) => (
                                                        <Input placeholder="Activity (e.g. Game Drive)" {...field} />
                                                    )}
                                                />
                                            </div>
                                            <Button type="button" variant="ghost" size="icon" onClick={() => removeActivity(index)}>
                                                <Trash2 className="h-4 w-4 text-destructive" />
                                            </Button>
                                        </div>
                                    ))}
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between">
                                    <CardTitle>Top Features</CardTitle>
                                    <Button type="button" variant="outline" size="sm" onClick={() => appendFeature({ title: '', description: '' })}>
                                        <Plus className="h-4 w-4" />
                                    </Button>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {featureFields.map((field, index) => (
                                        <div key={field.id} className="flex gap-2 items-start">
                                            <div className="grid gap-2 flex-1">
                                                <FormField
                                                    control={form.control}
                                                    name={`topFeatures.${index}.title`}
                                                    render={({ field }) => (
                                                        <Input placeholder="Title" {...field} />
                                                    )}
                                                />
                                                <FormField
                                                    control={form.control}
                                                    name={`topFeatures.${index}.description`}
                                                    render={({ field }) => (
                                                        <Textarea placeholder="Description" className="min-h-[60px]" {...field} />
                                                    )}
                                                />
                                            </div>
                                            <Button type="button" variant="ghost" size="icon" onClick={() => removeFeature(index)}>
                                                <Trash2 className="h-4 w-4 text-destructive" />
                                            </Button>
                                        </div>
                                    ))}
                                </CardContent>
                            </Card>
                        </div>

                        {/* Itinerary */}
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <CardTitle>Daily Itinerary</CardTitle>
                                <Button type="button" onClick={() => appendItinerary({ title: `Day ${itineraryFields.length + 1}`, overview: '', national_park_id: '', accommodation_id: '' })}>
                                    <Plus className="mr-2 h-4 w-4" /> Add Day
                                </Button>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {itineraryFields.map((field, index) => (
                                    <Card key={field.id} className="border-accent/50 bg-accent/10">
                                        <CardHeader className="pb-2">
                                            <div className="flex items-center justify-between">
                                                <CardTitle className="text-base">Day {index + 1}</CardTitle>
                                                <Button type="button" variant="ghost" size="sm" onClick={() => removeItinerary(index)}>
                                                    <Trash2 className="h-4 w-4 text-destructive" />
                                                </Button>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <FormField
                                                control={form.control}
                                                name={`itineraries.${index}.title`}
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Title</FormLabel>
                                                        <FormControl>
                                                            <Input placeholder="Day Title" {...field} />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={form.control}
                                                name={`itineraries.${index}.national_park_id`}
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Destination / Park</FormLabel>
                                                        <FormControl>
                                                            <SelectDestination 
                                                                destinations={parks} 
                                                                field={field} 
                                                                onCreated={fetchData}
                                                            />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={form.control}
                                                name={`itineraries.${index}.accommodation_id`}
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Accommodation</FormLabel>
                                                        <FormControl>
                                                            <SelectAccommodation 
                                                                accomodations={accommodations} 
                                                                field={field} 
                                                                onCreated={fetchData}
                                                            />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={form.control}
                                                name={`itineraries.${index}.overview`}
                                                render={({ field }) => (
                                                    <FormItem className="md:col-span-2">
                                                        <FormLabel>Day Overview</FormLabel>
                                                        <FormControl>
                                                            <Textarea placeholder="Day details..." {...field} />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </CardContent>
                                    </Card>
                                ))}
                            </CardContent>
                        </Card>

                        <div className="flex justify-end">
                            <Button type="submit" size="lg" disabled={isSubmitting}>
                                {isSubmitting ? 'Creating Tour...' : 'Create Tour Package'}
                            </Button>
                        </div>
                    </form>
                </Form>
            </div>
        </div>
    )
}
