'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@repo/ui/button'
import { Input } from '@repo/ui/input'
import { Label } from '@repo/ui/label'
import { Textarea } from '@repo/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui/card'
import { X, Upload, Loader2, MapPin, Link2 } from 'lucide-react'
import { trpc } from '@/lib/trpc'

interface AccomodationFormProps {
    initialData?: {
        id: string
        name: string
        url?: string | null
        overview?: string | null
        description?: string | null
        enhancedDescription?: string | null
        latitude?: string | null
        longitude?: string | null
        images: { id: string; imageUrl: string }[]
    }
}

interface PendingFile {
    file: File
    previewUrl: string
}

interface PendingUrl {
    url: string
}

type PendingImage = PendingFile | PendingUrl

function isPendingFile(img: PendingImage): img is PendingFile {
    return 'file' in img
}

export default function AccomodationForm({ initialData }: AccomodationFormProps) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [images, setImages] = useState<any[]>(initialData?.images || [])
    const [pendingImages, setPendingImages] = useState<PendingImage[]>([])
    const [removedImageIds, setRemovedImageIds] = useState<string[]>([])
    const createMutation = trpc.accommodations.create.useMutation()
    const updateMutation = trpc.accommodations.update.useMutation()

    // Airbnb import state
    const [showAirbnbImport, setShowAirbnbImport] = useState(false)
    const [airbnbUrl, setAirbnbUrl] = useState('')
    const [scraping, setScraping] = useState(false)

    // Form refs for programmatic value setting
    const nameRef = useRef<HTMLInputElement>(null)
    const urlRef = useRef<HTMLInputElement>(null)
    const overviewRef = useRef<HTMLTextAreaElement>(null)
    const descriptionRef = useRef<HTMLTextAreaElement>(null)
    const enhancedDescRef = useRef<HTMLTextAreaElement>(null)
    const latRef = useRef<HTMLInputElement>(null)
    const lngRef = useRef<HTMLInputElement>(null)

    async function scrapeAirbnb() {
        if (!airbnbUrl.trim()) return
        setScraping(true)
        try {
            const res = await fetch('/api/scrape-airbnb', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url: airbnbUrl.trim() }),
            })
            if (!res.ok) {
                const err = await res.json().catch(() => ({}))
                throw new Error(err.error || 'Failed to scrape listing')
            }
            const data = await res.json()

            // Add scraped images to pending images
            if (data.images?.length) {
                const urlImages: PendingUrl[] = data.images.map((url: string) => ({ url }))
                setPendingImages(prev => [...prev, ...urlImages])
            }

            // Auto-fill form fields
            if (data.name && nameRef.current && !nameRef.current.value) {
                nameRef.current.value = data.name
            }
            if (data.sourceUrl && urlRef.current && !urlRef.current.value) {
                urlRef.current.value = data.sourceUrl
            }
            if (data.description) {
                if (overviewRef.current && !overviewRef.current.value) {
                    overviewRef.current.value = data.description.slice(0, 200)
                }
                if (descriptionRef.current && !descriptionRef.current.value) {
                    descriptionRef.current.value = data.description
                }
                if (enhancedDescRef.current && !enhancedDescRef.current.value) {
                    enhancedDescRef.current.value = data.description
                }
            }
            if (data.location?.latitude != null && latRef.current && !latRef.current.value) {
                latRef.current.value = String(data.location.latitude)
            }
            if (data.location?.longitude != null && lngRef.current && !lngRef.current.value) {
                lngRef.current.value = String(data.location.longitude)
            }
        } catch (error) {
            alert(error instanceof Error ? error.message : 'Failed to scrape Airbnb listing')
        } finally {
            setScraping(false)
        }
    }

    async function uploadLocalFiles(files: PendingFile[], folder: string) {
        if (files.length === 0) return []

        const body = new FormData()
        body.set('folder', folder)
        for (const f of files) body.append('files', f.file)

        const res = await fetch('/api/upload', { method: 'POST', body })
        if (!res.ok) {
            const err = await res.json().catch(() => ({}))
            throw new Error(err.error || 'Upload failed')
        }
        return (await res.json()).images as { key: string; bucket: string }[]
    }

    async function uploadUrlImages(urls: string[], folder: string) {
        if (urls.length === 0) return []

        const res = await fetch('/api/upload-url', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ urls, folder }),
        })
        if (!res.ok) {
            const err = await res.json().catch(() => ({}))
            throw new Error(err.error || 'Image upload failed')
        }
        return (await res.json()).images as { key: string; bucket: string }[]
    }

    async function uploadAllPending(folder: string) {
        const files = pendingImages.filter(isPendingFile)
        const urls = pendingImages.filter((img): img is PendingUrl => !isPendingFile(img)).map(img => img.url)

        const [fileResults, urlResults] = await Promise.all([
            uploadLocalFiles(files, folder),
            uploadUrlImages(urls, folder),
        ])
        return [...fileResults, ...urlResults]
    }

    async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setLoading(true)

        const formData = new FormData(e.currentTarget)
        const latitudeRaw = formData.get('latitude') as string
        const longitudeRaw = formData.get('longitude') as string

        const data = {
            name: formData.get('name') as string,
            url: formData.get('url') as string,
            overview: formData.get('overview') as string,
            description: formData.get('description') as string,
            enhancedDescription: formData.get('enhancedDescription') as string,
            latitude: latitudeRaw || undefined,
            longitude: longitudeRaw || undefined,
        }

        try {
            if (initialData) {
                const uploaded = await uploadAllPending(`accommodations/${initialData.id}`)
                await updateMutation.mutateAsync({
                    id: initialData.id,
                    ...data,
                    newImages: uploaded,
                    removedImageIds,
                })
                router.push('/accomodations')
            } else {
                const result = await createMutation.mutateAsync({ ...data })
                const accId = result?.id
                if (accId && pendingImages.length > 0) {
                    const uploaded = await uploadAllPending(`accommodations/${accId}`)
                    if (uploaded.length > 0) {
                        await updateMutation.mutateAsync({
                            id: accId,
                            ...data,
                            newImages: uploaded,
                        })
                    }
                }
                router.push(accId ? `/accomodations/${accId}/edit` : '/accomodations')
            }
            router.refresh()
        } catch (error) {
            alert('Failed to save accomodation')
        } finally {
            setLoading(false)
        }
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files
        if (!files) return

        for (let i = 0; i < files.length; i++) {
            const file = files[i]
            if (!file) continue
            setPendingImages(prev => [...prev, { file, previewUrl: URL.createObjectURL(file) }])
        }
    }

    const removeExistingImage = (id: string) => {
        setRemovedImageIds(prev => [...prev, id])
        setImages(prev => prev.filter(img => img.id !== id))
    }

    const removePendingImage = (index: number) => {
        setPendingImages(prev => {
            const removed = prev[index]
            if (removed && isPendingFile(removed)) URL.revokeObjectURL(removed.previewUrl)
            return prev.filter((_, i) => i !== index)
        })
    }

    return (
        <form onSubmit={onSubmit} className="space-y-8 pb-20">
            {/* Airbnb Import Toggle */}
            {!initialData && !showAirbnbImport && (
                <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowAirbnbImport(true)}
                    className="flex items-center gap-2"
                >
                    <Link2 className="h-4 w-4" />
                    Import from Airbnb
                </Button>
            )}

            {!initialData && showAirbnbImport && (
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle className="flex items-center gap-2">
                                <Link2 className="h-5 w-5" />
                                Import from Airbnb
                            </CardTitle>
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => setShowAirbnbImport(false)}
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex gap-2">
                            <Input
                                value={airbnbUrl}
                                onChange={e => setAirbnbUrl(e.target.value)}
                                placeholder="https://www.airbnb.com/rooms/..."
                                className="flex-1"
                            />
                            <Button
                                type="button"
                                onClick={scrapeAirbnb}
                                disabled={scraping || !airbnbUrl.trim()}
                                variant="outline"
                            >
                                {scraping ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Loading...
                                    </>
                                ) : (
                                    'Fetch Listing'
                                )}
                            </Button>
                        </div>
                        <p className="text-xs text-gray-500">
                            Paste an Airbnb listing URL to auto-fill details and import images.
                        </p>
                    </CardContent>
                </Card>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Basic Information</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Accomodation Name</Label>
                                <Input ref={nameRef} id="name" name="name" defaultValue={initialData?.name} required placeholder="e.g. One&Only Gorilla's Nest" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="url">Website URL</Label>
                                <Input ref={urlRef} id="url" name="url" defaultValue={initialData?.url || ''} type="url" placeholder="https://..." />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="overview">Overview (Short)</Label>
                                <Textarea ref={overviewRef} id="overview" name="overview" defaultValue={initialData?.overview || ''} placeholder="Brief summary for listings..." />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="description">Full Description</Label>
                                <Textarea ref={descriptionRef} id="description" name="description" defaultValue={initialData?.description || ''} rows={6} placeholder="Detailed description of the accomodation..." />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="enhancedDescription">Property Overview (shown on detail page)</Label>
                                <Textarea ref={enhancedDescRef} id="enhancedDescription" name="enhancedDescription" defaultValue={initialData?.enhancedDescription || ''} rows={8} placeholder="Rich property overview displayed on the public accommodation page..." />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Location (GPS Coordinates)</CardTitle>
                        </CardHeader>
                        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="latitude">Latitude</Label>
                                <div className="relative">
                                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                    <Input ref={latRef} id="latitude" name="latitude" defaultValue={initialData?.latitude || ''} className="pl-10" placeholder="-1.5862" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="longitude">Longitude</Label>
                                <div className="relative">
                                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                    <Input ref={lngRef} id="longitude" name="longitude" defaultValue={initialData?.longitude || ''} className="pl-10" placeholder="29.6331" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Images</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-2">
                                {images.map(img => (
                                    <div key={img.id} className="relative aspect-square rounded-md overflow-hidden bg-gray-100 border">
                                        <img src={img.imageUrl} alt="" className="object-cover w-full h-full" />
                                        <button
                                            type="button"
                                            onClick={() => removeExistingImage(img.id)}
                                            className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                                        >
                                            <X className="h-3 w-3" />
                                        </button>
                                    </div>
                                ))}
                                {pendingImages.map((img, i) => (
                                    <div key={i} className="relative aspect-square rounded-md overflow-hidden bg-blue-50 border border-blue-200">
                                        <img
                                            src={isPendingFile(img) ? img.previewUrl : img.url}
                                            alt=""
                                            className="object-cover w-full h-full opacity-60"
                                        />
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <span className="text-[10px] font-medium text-blue-700 bg-white/80 px-1 rounded">New</span>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => removePendingImage(i)}
                                            className="absolute top-1 right-1 p-1 bg-gray-500 text-white rounded-full hover:bg-gray-600"
                                        >
                                            <X className="h-3 w-3" />
                                        </button>
                                    </div>
                                ))}
                                <label className="relative aspect-square flex flex-col items-center justify-center rounded-md border-2 border-dashed border-gray-300 hover:border-gray-400 cursor-pointer">
                                    <Upload className="h-6 w-6 text-gray-400" />
                                    <span className="mt-1 text-xs text-gray-500">Upload</span>
                                    <input type="file" className="hidden" multiple accept="image/*" onChange={handleFileChange} />
                                </label>
                            </div>
                            <p className="text-xs text-gray-500 italic">
                                * Images are uploaded directly to Cloudflare R2.
                            </p>
                        </CardContent>
                    </Card>

                    <div className="flex flex-col gap-2">
                        <Button type="submit" disabled={loading} className="w-full">
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                'Save Accomodation'
                            )}
                        </Button>
                        <Button type="button" variant="outline" onClick={() => router.back()} disabled={loading} className="w-full">
                            Cancel
                        </Button>
                    </div>
                </div>
            </div>
        </form>
    )
}
