'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@repo/ui/button'
import { Input } from '@repo/ui/input'
import { Label } from '@repo/ui/label'
import { Textarea } from '@repo/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui/card'
import { X, Upload, Loader2, MapPin } from 'lucide-react'
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

export default function AccomodationForm({ initialData }: AccomodationFormProps) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [images, setImages] = useState<any[]>(initialData?.images || [])
    const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([])
    const [removedImageIds, setRemovedImageIds] = useState<string[]>([])
    const createMutation = trpc.accommodations.create.useMutation()
    const updateMutation = trpc.accommodations.update.useMutation()

    async function uploadFiles(files: PendingFile[], folder: string) {
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
                const uploaded = await uploadFiles(pendingFiles, `accommodations/${initialData.id}`)
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
                if (accId && pendingFiles.length > 0) {
                    const uploaded = await uploadFiles(pendingFiles, `accommodations/${accId}`)
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
            setPendingFiles(prev => [...prev, { file, previewUrl: URL.createObjectURL(file) }])
        }
    }

    const removeExistingImage = (id: string) => {
        setRemovedImageIds(prev => [...prev, id])
        setImages(prev => prev.filter(img => img.id !== id))
    }

    const removeNewImage = (index: number) => {
        setPendingFiles(prev => {
            const removed = prev[index]
            if (removed) URL.revokeObjectURL(removed.previewUrl)
            return prev.filter((_, i) => i !== index)
        })
    }

    return (
        <form onSubmit={onSubmit} className="space-y-8 pb-20">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Basic Information</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Accomodation Name</Label>
                                <Input id="name" name="name" defaultValue={initialData?.name} required placeholder="e.g. One&Only Gorilla's Nest" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="url">Website URL</Label>
                                <Input id="url" name="url" defaultValue={initialData?.url || ''} type="url" placeholder="https://..." />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="overview">Overview (Short)</Label>
                                <Textarea id="overview" name="overview" defaultValue={initialData?.overview || ''} placeholder="Brief summary for listings..." />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="description">Full Description</Label>
                                <Textarea id="description" name="description" defaultValue={initialData?.description || ''} rows={6} placeholder="Detailed description of the accomodation..." />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="enhancedDescription">Property Overview (shown on detail page)</Label>
                                <Textarea id="enhancedDescription" name="enhancedDescription" defaultValue={initialData?.enhancedDescription || ''} rows={8} placeholder="Rich property overview displayed on the public accommodation page..." />
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
                                    <Input id="latitude" name="latitude" defaultValue={initialData?.latitude || ''} className="pl-10" placeholder="-1.5862" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="longitude">Longitude</Label>
                                <div className="relative">
                                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                    <Input id="longitude" name="longitude" defaultValue={initialData?.longitude || ''} className="pl-10" placeholder="29.6331" />
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
                                {pendingFiles.map((img, i) => (
                                    <div key={i} className="relative aspect-square rounded-md overflow-hidden bg-blue-50 border border-blue-200">
                                        <img src={img.previewUrl} alt="" className="object-cover w-full h-full opacity-60" />
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <span className="text-[10px] font-medium text-blue-700 bg-white/80 px-1 rounded">New</span>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => removeNewImage(i)}
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
