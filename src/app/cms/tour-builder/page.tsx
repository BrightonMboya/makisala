"use client"
import { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Trash2, MapPin, Calendar, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Separator } from '@/components/ui/separator';
import {useToast} from "@/lib/hooks/use-toast";
import {CreateTourPackageData} from "@/lib/cms-service";
// import type { CreateTourPackageData } from '@/lib/api/tour-packages';

const itinerarySchema = z.object({
    title: z.string().min(1, 'Day title is required'),
    estimatedDrivingDistance: z.string().optional(),
    activities: z.string().min(1, 'Activities are required'),
    accommodation: z.string().optional(),
});

const tourPackageSchema = z.object({
    title: z.string().min(1, 'Title is required'),
    numberOfDays: z.number().min(1, 'Number of days must be at least 1'),
    country: z.string().min(1, 'Country is required'),
    destination: z.string().min(1, 'Destination is required'),
    overview: z.string().min(1, 'Overview is required'),
    slug: z.string().min(1, 'Slug is required'),
    pricing_starts_from: z.string().min(1, 'Pricing starts from is missing'),
    hero_image_url: z.string().min(1, 'Hero image is required'),
    itineraries: z.array(itinerarySchema).min(1, 'At least one day itinerary is required'),
});

type TourPackageForm = z.infer<typeof tourPackageSchema>;

export default function TourPackageBuilder () {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { toast } = useToast();

    const form = useForm<TourPackageForm>({
        resolver: zodResolver(tourPackageSchema),
        defaultValues: {
            title: '',
            numberOfDays: 1,
            country: '',
            destination: '',
            overview: '',
            slug: '',
            pricing_starts_from: '',
            hero_image_url: '',
            itineraries: [
                {
                    title: 'Day 1',
                    estimatedDrivingDistance: '',
                    activities: '',
                    accommodation: '',
                },
            ],
        },
    });

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: 'itineraries',
    });

    const addItineraryDay = () => {
        const dayNumber = fields.length + 1;
        append({
            title: `Day ${dayNumber}`,
            estimatedDrivingDistance: '',
            activities: '',
            accommodation: '',
        });
    };

    const removeItineraryDay = (index: number) => {
        if (fields.length > 1) {
            remove(index);
        }
    };

    const onSubmit = async (data: TourPackageForm) => {
        setIsSubmitting(true);
        try {
            console.log(data)
            // Import the API function dynamically to avoid build issues
            const { createTourPackage } = await import('@/lib/cms-service');

            // Form validation ensures all required fields are present
            await createTourPackage(data as CreateTourPackageData);

            toast({
                title: 'Success!',
                description: 'Tour package has been created successfully.',
            });

            // Reset form after successful submission
            form.reset();
        } catch (error) {
            console.error('Error creating tour package:', error);
            toast({
                title: 'Error',
                description: 'Failed to create tour package. Please try again.',
                variant: 'destructive',
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-background to-accent/20 p-6 mt-10">
            <div className="max-w-4xl mx-auto">
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold mb-2">
                        Tour Package Builder
                    </h1>
                    <p className="text-muted-foreground text-lg">Create amazing travel experiences</p>
                </div>

                <Card className="shadow-elegant border-0 bg-card/50 backdrop-blur-sm">
                    <CardHeader className="pb-6">
                        <CardTitle className="flex items-center gap-2 text-2xl">
                            <Globe className="h-6 w-6 text-primary" />
                            Package Details
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                                {/* Basic Information */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <FormField
                                        control={form.control}
                                        name="title"
                                        render={({ field }) => (
                                            <FormItem className="md:col-span-2">
                                                <FormLabel className="text-base font-semibold">Package Title</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        placeholder="Amazing Safari Adventure"
                                                        className="h-12 text-base"
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="numberOfDays"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-base font-semibold flex items-center gap-2">
                                                    <Calendar className="h-4 w-4" />
                                                    Number of Days
                                                </FormLabel>
                                                <FormControl>
                                                    <Input
                                                        type="number"
                                                        min="1"
                                                        className="h-12"
                                                        {...field}
                                                        onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                                                    />
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
                                                <FormLabel className="text-base font-semibold">Country</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        placeholder="Kenya"
                                                        className="h-12"
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="slug"
                                        render={({ field }) => (
                                            <FormItem className="md:col-span-2">
                                                <FormLabel className="text-base font-semibold flex items-center gap-2">
                                                    Slug Url
                                                </FormLabel>
                                                <FormControl>
                                                    <Input
                                                        placeholder="kilimanjaro-marangu-route"
                                                        className="h-12"
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="destination"
                                        render={({ field }) => (
                                            <FormItem className="md:col-span-2">
                                                <FormLabel className="text-base font-semibold flex items-center gap-2">
                                                    <MapPin className="h-4 w-4" />
                                                    Destination
                                                </FormLabel>
                                                <FormControl>
                                                    <Input
                                                        placeholder="Maasai Mara National Reserve"
                                                        className="h-12"
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="hero_image_url"
                                        render={({ field }) => (
                                            <FormItem className="md:col-span-2">
                                                <FormLabel className="text-base font-semibold">
                                                   Hero Image Url
                                                </FormLabel>
                                                <FormControl>
                                                    <Input
                                                        placeholder="res.cloudinary.image"
                                                        className="h-12"
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="pricing_starts_from"
                                        render={({ field }) => (
                                            <FormItem className="md:col-span-2">
                                                <FormLabel className="text-base font-semibold">
                                                    Price Starts From
                                                </FormLabel>
                                                <FormControl>
                                                    <Input
                                                        placeholder="5500"
                                                        className="h-12"
                                                        {...field}
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
                                                <FormLabel className="text-base font-semibold">Overview</FormLabel>
                                                <FormControl>
                                                    <Textarea
                                                        placeholder="Describe the tour package experience..."
                                                        className="min-h-24 resize-none"
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <Separator className="my-8" />

                                {/* Itinerary Section */}
                                <div>
                                    <div className="flex justify-between items-center mb-6">
                                        <h3 className="text-xl font-semibold">Daily Itinerary</h3>
                                        <Button
                                            type="button"
                                            onClick={addItineraryDay}
                                            variant="outline"
                                            className="hover:bg-primary hover:text-primary-foreground transition-colors"
                                        >
                                            <Plus className="h-4 w-4 mr-2" />
                                            Add Day
                                        </Button>
                                    </div>

                                    <div className="space-y-6">
                                        {fields.map((field, index) => (
                                            <Card key={field.id} className="border-accent/50 bg-accent/10">
                                                <CardHeader className="pb-4">
                                                    <div className="flex justify-between items-center">
                                                        <CardTitle className="text-lg text-primary">
                                                            Day {index + 1}
                                                        </CardTitle>
                                                        {fields.length > 1 && (
                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => removeItineraryDay(index)}
                                                                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        )}
                                                    </div>
                                                </CardHeader>
                                                <CardContent className="space-y-4">
                                                    <FormField
                                                        control={form.control}
                                                        name={`itineraries.${index}.title`}
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel>Day Title</FormLabel>
                                                                <FormControl>
                                                                    <Input
                                                                        placeholder="Arrival and Welcome"
                                                                        {...field}
                                                                    />
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />

                                                    <FormField
                                                        control={form.control}
                                                        name={`itineraries.${index}.estimatedDrivingDistance`}
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel>Estimated Driving Distance (km)</FormLabel>
                                                                <FormControl>
                                                                    <Input
                                                                        placeholder="150"
                                                                        {...field}
                                                                    />
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />

                                                    <FormField
                                                        control={form.control}
                                                        name={`itineraries.${index}.activities`}
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel>Activities</FormLabel>
                                                                <FormControl>
                                                                    <Textarea
                                                                        placeholder="Game drive, cultural visit, sunset viewing..."
                                                                        className="min-h-20 resize-none"
                                                                        {...field}
                                                                    />
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />

                                                    <FormField
                                                        control={form.control}
                                                        name={`itineraries.${index}.accommodation`}
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel>Accommodation</FormLabel>
                                                                <FormControl>
                                                                    <Textarea
                                                                        placeholder="Safari Lodge or Tented Camp"
                                                                        className="min-h-20 resize-none"
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
                                    </div>
                                </div>

                                <div className="flex justify-end pt-6">
                                    <Button
                                        type="submit"
                                        size="lg"
                                        disabled={isSubmitting}
                                        className="min-w-32 cursor-poiner"
                                    >
                                        {isSubmitting ? 'Creating...' : 'Create Package'}
                                    </Button>
                                </div>
                            </form>
                        </Form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};