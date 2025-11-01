'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card'

import { useToast } from '@/lib/hooks/use-toast'
import { TourData } from '@/app/scraper/_components/types'
import { TourPreview } from '@/app/scraper/_components/TourPreview'
import { FileText, Upload } from 'lucide-react'

export default function Page() {
    const { toast } = useToast()
    const [jsonInput, setJsonInput] = useState('')
    const [parsedData, setParsedData] = useState<TourData | null>(null)
    const [isLoading, setIsLoading] = useState(false)

    const parseJSON = () => {
        try {
            const raw = JSON.parse(jsonInput)

            // Normalize keys for your backend
            const normalized: TourData = {
                tourName: raw.tour_name,
                overview: raw.overview ?? null,
                pricing: raw.price ?? null,
                country: raw.country ?? null,
                sourceUrl: raw.source_url ?? null,
                number_of_days: raw.number_of_days,
                img_url: raw.img_url,
                activities: raw.activities ?? [],
                topFeatures: raw.top_features ?? [],
                itinerary: (raw.itinerary ?? []).map(
                    (day: {
                        accomodation: {
                            accomodation_overview: string
                            img_urls: Array<{ img_url: string }>
                            accomodation_name: string
                            accomodation_url: string
                        }
                    }) => ({
                        ...day,
                        accomodation: {
                            ...day.accomodation,
                            overview:
                                day.accomodation?.accomodation_overview ?? null,
                            img_urls: (day.accomodation?.img_urls ?? []).map(
                                (img) => ({
                                    image_url: img.img_url, // normalize key for our upload function
                                }),
                            ),
                            accomodation_name:
                                day.accomodation?.accomodation_name ?? null,
                            accomodation_url:
                                day.accomodation?.accomodation_url ?? null,
                        },
                    }),
                ),
            }

            setParsedData(normalized)

            toast('JSON Parsed Successfully', {
                description: `Found tour: ${normalized.tourName}`,
            })
        } catch (error) {
            toast('Invalid JSON', {
                description: 'Please check your JSON format and try again.',
                variant: 'destructive',
            })
        }
    }

    const importToDatabase = async () => {
        if (!parsedData) {
            toast('No Data to Import', {
                description: 'Please parse JSON data first.',
                variant: 'destructive',
            })
            return
        }

        setIsLoading(true)

        try {
            const res = await fetch('/api/cms/scraper', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(parsedData),
            })

            const json = await res.json()

            if (!json.success) {
                throw new Error(json.error || 'Unknown error')
            }
            setParsedData(null)
            setJsonInput('')

            toast('Import Successful', {
                description: 'Tour and related data saved to database.',
            })
        } catch (err: any) {
            toast('Import Failed', {
                description: err.message,
                variant: 'destructive',
            })
        } finally {
            setIsLoading(false)
        }
    }

    const clearData = () => {
        setJsonInput('')
        setParsedData(null)
    }

    return (
        <div className="container mx-auto mt-10 max-w-7xl px-4 py-8">
            {/* Header */}
            <div className="mb-12 text-center">
                <p className="text-muted-foreground mx-auto max-w-2xl text-lg">
                    Import luxury safari and travel tour data from JSON format
                    into your database with automatic image processing.
                </p>
            </div>

            <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
                {/* JSON Input Section */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <FileText className="text-primary h-5 w-5" />
                            JSON Data Input
                        </CardTitle>
                        <CardDescription>
                            Paste your tour JSON data below to parse and preview
                            before importing.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Textarea
                            placeholder="Paste your tour JSON data here..."
                            value={jsonInput}
                            onChange={(e) => setJsonInput(e.target.value)}
                            className="min-h-[300px] resize-none font-mono text-sm"
                        />
                        <div className="flex gap-2">
                            <Button
                                onClick={parseJSON}
                                disabled={!jsonInput.trim()}
                                className="flex-1"
                            >
                                Parse JSON
                            </Button>
                            <Button
                                onClick={clearData}
                                variant="outline"
                                disabled={!jsonInput && !parsedData}
                            >
                                Clear
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Import Actions */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Upload className="text-success h-5 w-5" />
                            Import to Database
                        </CardTitle>
                        <CardDescription>
                            Upload images to Cloudinary and save tour data to
                            your Supabase database.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="bg-gradient-sunset rounded-lg p-6 text-white">
                            <h3 className="mb-2 font-semibold">
                                Ready to Import
                            </h3>
                            <p className="mb-4 text-sm opacity-90">
                                {parsedData
                                    ? `Tour "${parsedData.tourName}" is ready to be imported with ${parsedData.itinerary.length} days.`
                                    : 'Parse JSON data first to see import options.'}
                            </p>
                            <Button
                                onClick={importToDatabase}
                                disabled={!parsedData || isLoading}
                                className="w-full"
                            >
                                {isLoading
                                    ? 'Importing...'
                                    : 'Import Tour Data'}
                            </Button>
                        </div>

                        {parsedData && (
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">
                                        Tour Name:
                                    </span>
                                    <span className="font-medium">
                                        {parsedData.tourName}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">
                                        Duration:
                                    </span>
                                    <span className="font-medium">
                                        {parsedData.itinerary.length} days
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">
                                        Activities:
                                    </span>
                                    <span className="font-medium">
                                        {parsedData.activities.length}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">
                                        Pricing:
                                    </span>
                                    <span className="font-medium">
                                        ${parsedData.pricing?.toLocaleString()}
                                    </span>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Tour Preview */}
            {parsedData && (
                <div className="mt-12">
                    <TourPreview data={parsedData} />
                </div>
            )}
        </div>
    )
}
