'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Check, Search, Link as LinkIcon, Image as ImageIcon } from 'lucide-react'
import { Button } from '@repo/ui/button'
import { Input } from '@repo/ui/input'
import { 
    Tabs, 
    TabsContent, 
    TabsList, 
    TabsTrigger 
} from '@repo/ui/tabs'
import { 
    destinationDetails, 
    activityDetails, 
    accommodationDetails 
} from '@/lib/data/itinerary-data'
import { cn } from '@/lib/utils'

interface ImagePickerProps {
    value?: string
    onChange: (url: string) => void
}

export function ImagePicker({ value, onChange }: ImagePickerProps) {
    const [search, setSearch] = useState('')
    const [customUrl, setCustomUrl] = useState('')

    // Flatten data for easier searching
    const images = [
        ...Object.entries(activityDetails).map(([key, details]) => ({
            category: 'Activities',
            name: key,
            url: details.image
        })),
        ...Object.entries(destinationDetails).map(([key, details]) => ({
            category: 'Destinations',
            name: key.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()), // Prettify key
            url: details.image
        })),
        ...Object.entries(accommodationDetails).map(([key, details]) => ({
            category: 'Accommodations',
            name: details.name,
            url: details.image
        }))
    ]

    const filteredImages = images.filter(img => 
        img.name.toLowerCase().includes(search.toLowerCase())
    )

    const handleCustomUrlSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (customUrl) {
            onChange(customUrl)
        }
    }

    return (
        <div className="w-[400px] p-4 bg-white rounded-lg shadow-lg border border-stone-200">
            <Tabs defaultValue="library" className="w-full">
                <TabsList className="w-full grid grid-cols-2 mb-4">
                    <TabsTrigger value="library">Library</TabsTrigger>
                    <TabsTrigger value="custom">Custom URL</TabsTrigger>
                </TabsList>

                <TabsContent value="library" className="space-y-4">
                    <div className="relative">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-stone-400" />
                        <Input
                            placeholder="Search images..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-8"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-2 max-h-[300px] overflow-y-auto pr-1">
                        {filteredImages.map((img, idx) => (
                            <button
                                key={`${img.name}-${idx}`}
                                className={cn(
                                    "relative group aspect-video rounded-md overflow-hidden border-2 transition-all",
                                    value === img.url ? "border-green-500" : "border-transparent hover:border-stone-300"
                                )}
                                onClick={() => onChange(img.url)}
                            >
                                <Image
                                    src={img.url}
                                    alt={img.name}
                                    fill
                                    className="object-cover"
                                />
                                <div className={cn(
                                    "absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 transition-opacity",
                                    value === img.url ? "opacity-100" : "group-hover:opacity-100"
                                )}>
                                    {value === img.url ? (
                                        <Check className="h-6 w-6 text-white" />
                                    ) : (
                                        <span className="text-xs text-white font-medium px-2 text-center">{img.name}</span>
                                    )}
                                </div>
                            </button>
                        ))}
                    </div>
                </TabsContent>

                <TabsContent value="custom" className="space-y-4">
                    <form onSubmit={handleCustomUrlSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-stone-700">Image URL</label>
                            <div className="flex gap-2">
                                <Input
                                    placeholder="https://..."
                                    value={customUrl}
                                    onChange={(e) => setCustomUrl(e.target.value)}
                                />
                                <Button type="submit" size="icon" variant="outline">
                                    <Check className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                        
                        {(customUrl || value) && (
                            <div className="relative aspect-video w-full rounded-md overflow-hidden border border-stone-200 bg-stone-50">
                                <img
                                    src={customUrl || value}
                                    alt="Preview"
                                    className="w-full h-full object-cover"
                                    onError={(e) => (e.currentTarget.style.display = 'none')}
                                />
                                <div className="absolute inset-0 flex items-center justify-center -z-10 text-stone-400">
                                    <ImageIcon className="h-8 w-8" />
                                </div>
                            </div>
                        )}
                        <p className="text-xs text-stone-500">
                            Paste a direct link to an image (e.g. from Unsplash).
                        </p>
                    </form>
                </TabsContent>
            </Tabs>
        </div>
    )
}
