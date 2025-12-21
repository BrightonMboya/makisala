'use client'
import { useEffect, useState } from 'react'
import { useFieldArray, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, Trash2 } from 'lucide-react'
import { Button } from '@repo/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui/card'
import { Input } from '@repo/ui/input'
import { Textarea } from '@repo/ui/textarea'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@repo/ui/form'
import { useToast } from '@/lib/hooks/use-toast'
import SelectAccommodation from './_components/SelectAccommodation'
import SelectDestination from './_components/SelectDestination'
import { CloudinaryImagePicker } from './_components/CloudinaryImagePicker'
import { useRouter, useSearchParams } from 'next/navigation'
import { createTour, getAccommodations, getNationalParks, getTourById, updateTour } from './actions'
import { TagInput } from '@repo/ui/tag-input'

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
    const searchParams = useSearchParams()
    const router = useRouter()
    const tourId = searchParams.get('id')
    const isEditing = !!tourId

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

    const {
        fields: itineraryFields,
        append: appendItinerary,
        remove: removeItinerary,
    } = useFieldArray({
        control: form.control,
        name: 'itineraries',
    })

    const {
        fields: activityFields,
        append: appendActivity,
        remove: removeActivity,
    } = useFieldArray({
        control: form.control,
        name: 'activities',
    })

    const {
        fields: featureFields,
        append: appendFeature,
        remove: removeFeature,
    } = useFieldArray({
        control: form.control,
        name: 'topFeatures',
    })

    useEffect(() => {
        fetchData()
    }, [])

    useEffect(() => {
        if (tourId) {
            fetchTourData(tourId)
        }
    }, [tourId])

    const fetchData = async () => {
        try {
            const [p, a] = await Promise.all([getNationalParks(), getAccommodations()])
            setParks(p)
            setAccommodations(a)
        } catch (error) {
            console.error('Failed to fetch data', error)
        }
    }

    const fetchTourData = async (id: string) => {
        try {
            const tour = await getTourById(id)
            if (tour) {
                form.reset({
                    tourName: tour.tourName,
                    number_of_days: tour.number_of_days,
                    country: tour.country,
                    overview: tour.overview,
                    pricing: tour.pricing.toString(),
                    img_url: tour.img_url,
                    tags: tour.tags,
                    activities: tour.activities as any[],
                    topFeatures: tour.topFeatures as any[],
                    itineraries: tour.days.map((day: any) => ({
                        title: day.dayTitle || '',
                        overview: day.overview || '',
                        national_park_id: day.national_park_id || '',
                        accommodation_id: day.itineraryAccommodations?.[0]?.accommodationId || '',
                    })),
                })
            }
        } catch (error) {
            console.error('Failed to fetch tour data', error)
            toast('', {
                description: 'Failed to load tour data.',
                variant: 'destructive',
            })
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

            let result
            if (isEditing) {
                result = await updateTour(tourId, formattedData)
            } else {
                result = await createTour(formattedData)
            }

            if (result.success) {
                toast('', {
                    description: `Tour package has been ${isEditing ? 'updated' : 'created'} successfully.`,
                })
                if (!isEditing) {
                    form.reset()
                } else {
                    router.push('/cms/tours')
                }
            } else {
                throw result.error
            }
        } catch (error) {
            console.error('Error saving tour package:', error)
            toast('', {
                description: 'Failed to save tour package. Please try again.',
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
                    <h1 className="mb-2 text-4xl font-bold">
                        {isEditing ? 'Edit Tour' : 'Tour Builder'}
                    </h1>
                    <p className="text-muted-foreground text-lg">
                        {isEditing
                            ? 'Update your tour package details'
                            : 'Create amazing travel experiences'}
                    </p>
                </div>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                        {/* Basic Info */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Basic Information</CardTitle>
                            </CardHeader>
                            <CardContent className="grid grid-cols-1 gap-6 md:grid-cols-2">
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
                                                <Input
                                                    type="number"
                                                    min="1"
                                                    {...field}
                                                    onChange={e =>
                                                        field.onChange(parseInt(e.target.value))
                                                    }
                                                />
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
                                                <Textarea
                                                    placeholder="Tour description..."
                                                    className="min-h-32"
                                                    {...field}
                                                />
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
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between">
                                    <CardTitle>Activities</CardTitle>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() =>
                                            appendActivity({
                                                title: '',
                                                activity_name: '',
                                            })
                                        }
                                    >
                                        <Plus className="h-4 w-4" />
                                    </Button>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {activityFields.map((field, index) => (
                                        <div key={field.id} className="flex items-start gap-2">
                                            <div className="grid flex-1 gap-2">
                                                <FormField
                                                    control={form.control}
                                                    name={`activities.${index}.title`}
                                                    render={({ field }) => (
                                                        <Input
                                                            placeholder="Title (e.g. Morning)"
                                                            {...field}
                                                        />
                                                    )}
                                                />
                                                <FormField
                                                    control={form.control}
                                                    name={`activities.${index}.activity_name`}
                                                    render={({ field }) => (
                                                        <Input
                                                            placeholder="Activity (e.g. Game Drive)"
                                                            {...field}
                                                        />
                                                    )}
                                                />
                                            </div>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => removeActivity(index)}
                                            >
                                                <Trash2 className="text-destructive h-4 w-4" />
                                            </Button>
                                        </div>
                                    ))}
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between">
                                    <CardTitle>Top Features</CardTitle>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() =>
                                            appendFeature({
                                                title: '',
                                                description: '',
                                            })
                                        }
                                    >
                                        <Plus className="h-4 w-4" />
                                    </Button>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {featureFields.map((field, index) => (
                                        <div key={field.id} className="flex items-start gap-2">
                                            <div className="grid flex-1 gap-2">
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
                                                        <Textarea
                                                            placeholder="Description"
                                                            className="min-h-[60px]"
                                                            {...field}
                                                        />
                                                    )}
                                                />
                                            </div>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => removeFeature(index)}
                                            >
                                                <Trash2 className="text-destructive h-4 w-4" />
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
                                <Button
                                    type="button"
                                    onClick={() =>
                                        appendItinerary({
                                            title: `Day ${itineraryFields.length + 1}`,
                                            overview: '',
                                            national_park_id: '',
                                            accommodation_id: '',
                                        })
                                    }
                                >
                                    <Plus className="mr-2 h-4 w-4" /> Add Day
                                </Button>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {itineraryFields.map((field, index) => (
                                    <Card key={field.id} className="border-accent/50 bg-accent/10">
                                        <CardHeader className="pb-2">
                                            <div className="flex items-center justify-between">
                                                <CardTitle className="text-base">
                                                    Day {index + 1}
                                                </CardTitle>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => removeItinerary(index)}
                                                >
                                                    <Trash2 className="text-destructive h-4 w-4" />
                                                </Button>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                            <FormField
                                                control={form.control}
                                                name={`itineraries.${index}.title`}
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Title</FormLabel>
                                                        <FormControl>
                                                            <Input
                                                                placeholder="Day Title"
                                                                {...field}
                                                            />
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
                                                            <Textarea
                                                                placeholder="Day details..."
                                                                {...field}
                                                            />
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
                                {isSubmitting
                                    ? isEditing
                                        ? 'Updating Tour...'
                                        : 'Creating Tour...'
                                    : isEditing
                                      ? 'Update Tour Package'
                                      : 'Create Tour Package'}
                            </Button>
                        </div>
                    </form>
                </Form>
            </div>
        </div>
    )
}
