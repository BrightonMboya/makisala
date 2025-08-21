"use client"

import {useState} from 'react';
import {Button} from '@/components/ui/button';
import {Textarea} from '@/components/ui/textarea';
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/card';

import {useToast} from "@/lib/hooks/use-toast";
import {TourData} from "@/app/scraper/_components/types";
import {TourPreview} from "@/app/scraper/_components/TourPreview";
import {Upload, FileText, Sparkles} from 'lucide-react';
import {saveTourData} from "@/lib/scraper";

export default function Page() {
    const {toast} = useToast();
    const [jsonInput, setJsonInput] = useState('');
    const [parsedData, setParsedData] = useState<TourData | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const parseJSON = () => {
        try {
            const raw = JSON.parse(jsonInput);

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
                itinerary: (raw.itinerary ?? []).map((day: any) => ({
                    ...day,
                    accomodation: {
                        ...day.accomodation,
                        overview: day.accomodation?.accomodation_overview ?? null,
                        img_urls: (day.accomodation?.img_urls ?? []).map((img: any) => ({
                            image_url: img.img_url // normalize key for our upload function
                        })),
                        accomodation_name: day.accomodation?.accomodation_name ?? null,
                        accomodation_url: day.accomodation?.accomodation_url ?? null,
                    },
                }))
            };

            setParsedData(normalized);

            toast({
                title: "JSON Parsed Successfully",
                description: `Found tour: ${normalized.tourName}`,
            });
        } catch (error) {
            toast({
                title: "Invalid JSON",
                description: "Please check your JSON format and try again.",
                variant: "destructive",
            });
        }
    };


    const importToDatabase = async () => {
        if (!parsedData) {
            toast({
                title: "No Data to Import",
                description: "Please parse JSON data first.",
                variant: "destructive",
            });
            return;
        }

        setIsLoading(true);

        try {
            const res = await fetch("/api/cms/scraper", {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify(parsedData),
            });

            const json = await res.json();

            if (!json.success) {
                throw new Error(json.error || "Unknown error");
            }
            setParsedData(null)
            setJsonInput('')

            toast({
                title: "Import Successful",
                description: "Tour and related data saved to database.",
            });
        } catch (err: any) {
            toast({
                title: "Import Failed",
                description: err.message,
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    const clearData = () => {
        setJsonInput('');
        setParsedData(null);
    };

    return (
        <div className="container mx-auto py-8 px-4 max-w-7xl mt-10">
            {/* Header */}
            <div className="text-center mb-12">
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                    Import luxury safari and travel tour data from JSON format into your database with automatic image
                    processing.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* JSON Input Section */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <FileText className="w-5 h-5 text-primary"/>
                            JSON Data Input
                        </CardTitle>
                        <CardDescription>
                            Paste your tour JSON data below to parse and preview before importing.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Textarea
                            placeholder="Paste your tour JSON data here..."
                            value={jsonInput}
                            onChange={(e) => setJsonInput(e.target.value)}
                            className="min-h-[300px] font-mono text-sm resize-none"
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
                            <Upload className="w-5 h-5 text-success"/>
                            Import to Database
                        </CardTitle>
                        <CardDescription>
                            Upload images to Cloudinary and save tour data to your Supabase database.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="p-6 bg-gradient-sunset rounded-lg text-white">
                            <h3 className="font-semibold mb-2">Ready to Import</h3>
                            <p className="text-sm opacity-90 mb-4">
                                {parsedData
                                    ? `Tour "${parsedData.tourName}" is ready to be imported with ${parsedData.itinerary.length} days.`
                                    : "Parse JSON data first to see import options."
                                }
                            </p>
                            <Button
                                onClick={importToDatabase}
                                disabled={!parsedData || isLoading}
                                className="w-full"
                            >
                                {isLoading ? "Importing..." : "Import Tour Data"}
                            </Button>
                        </div>

                        {parsedData && (
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Tour Name:</span>
                                    <span className="font-medium">{parsedData.tourName}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Duration:</span>
                                    <span className="font-medium">{parsedData.itinerary.length} days</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Activities:</span>
                                    <span className="font-medium">{parsedData.activities.length}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Pricing:</span>
                                    <span className="font-medium">${parsedData.pricing?.toLocaleString()}</span>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Tour Preview */}
            {parsedData && (
                <div className="mt-12">
                    <TourPreview data={parsedData}/>
                </div>
            )}
        </div>
    );
};