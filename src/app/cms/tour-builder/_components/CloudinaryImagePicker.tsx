'use client'

import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import { getCloudinaryFolders, getCloudinaryImages } from '../actions'
import { useEffect, useState } from 'react'
import Image from 'next/image'
import { Loader2, Image as ImageIcon, ChevronRight, Home, Folder } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CloudinaryImagePickerProps {
    onSelect: (url: string) => void
    value?: string
}

export function CloudinaryImagePicker({
    onSelect,
    value,
}: CloudinaryImagePickerProps) {
    const [images, setImages] = useState<{ public_id: string; secure_url: string }[]>([])
    const [folders, setFolders] = useState<{ name: string; path: string }[]>([])
    const [currentPath, setCurrentPath] = useState<string[]>([]) 
    const [loading, setLoading] = useState(false)
    const [open, setOpen] = useState(false)

    // Helper to get current folder path string
    const getCurrentFolderPath = () => {
        return currentPath.length > 0 ? currentPath.join('/') : undefined
    }

    useEffect(() => {
        if (open) {
            fetchContent()
        }
    }, [open, currentPath])

    async function fetchContent() {
    setLoading(true)
    try {
        const path = getCurrentFolderPath()
        
        const fetchedFolders = await getCloudinaryFolders(path)
        setFolders(fetchedFolders)

        // Always try to fetch images, not just when path exists
        const fetchedImages = await getCloudinaryImages(path)
        setImages(fetchedImages)
    } catch (error) {
        console.error("Error fetching content", error)
    } finally {
        setLoading(false)
    }
}

    const handleFolderClick = (folderPath: string) => {
        // Split the full path and set it as the current path
        setCurrentPath(folderPath.split('/'))
    }

    const handleBreadcrumbClick = (index: number) => {
        if (index === -1) {
            setCurrentPath([])
        } else {
            setCurrentPath(currentPath.slice(0, index + 1))
        }
    }

    const handleSelect = (url: string) => {
        onSelect(url)
        setOpen(false)
    }

    return (
        <div className="flex items-center gap-4">
            {value && (
                <div className="relative h-20 w-32 overflow-hidden rounded-md border">
                    <Image
                        src={value}
                        alt="Selected"
                        fill
                        className="object-cover"
                    />
                </div>
            )}
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                    <Button variant="outline" className="gap-2">
                        <ImageIcon className="h-4 w-4" />
                        {value ? 'Change Image' : 'Select Image'}
                    </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl h-[600px] flex flex-col">
                    <DialogHeader>
                        <DialogTitle>Select Image from Cloudinary</DialogTitle>
                    </DialogHeader>
                    
                    {/* Breadcrumbs */}
                    <div className="flex items-center gap-1 text-sm text-muted-foreground border-b pb-2 overflow-x-auto">
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-6 px-2"
                            onClick={() => handleBreadcrumbClick(-1)}
                        >
                            <Home className="h-4 w-4" />
                        </Button>
                        {currentPath.map((folder, index) => (
                            <div key={folder} className="flex items-center shrink-0">
                                <ChevronRight className="h-4 w-4" />
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 px-2"
                                    onClick={() => handleBreadcrumbClick(index)}
                                >
                                    {folder}
                                </Button>
                            </div>
                        ))}
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 min-h-0">
                        {loading ? (
                            <div className="flex h-full items-center justify-center">
                                <Loader2 className="h-8 w-8 animate-spin" />
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {/* Folders - Vertical List */}
                                {folders.length > 0 && (
                                    <div>
                                        <h3 className="mb-2 text-sm font-medium text-muted-foreground">Folders</h3>
                                        <div className="flex flex-col gap-1">
                                            {folders.map((folder) => (
                                                <Button
                                                    key={folder.path}
                                                    variant="ghost"
                                                    className="justify-start h-auto py-2 px-3 font-normal"
                                                    onClick={() => handleFolderClick(folder.path)}
                                                >
                                                    <Folder className="h-4 w-4 mr-2 text-blue-500 fill-blue-500/20" />
                                                    <span className="truncate">{folder.name}</span>
                                                </Button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Images */}
                                <div>
                                    <h3 className="mb-2 text-sm font-medium text-muted-foreground">Images</h3>
                                    {images.length === 0 && currentPath.length > 0 ? (
                                        <div className="text-sm text-muted-foreground">No images in this folder.</div>
                                    ) : (
                                        <div className="grid grid-cols-3 gap-4">
                                            {images.map((img) => (
                                                <div
                                                    key={img.public_id}
                                                    className={cn(
                                                        "group relative aspect-video cursor-pointer overflow-hidden rounded-md border transition-all hover:ring-2 hover:ring-primary",
                                                        value === img.secure_url && "ring-2 ring-primary"
                                                    )}
                                                    onClick={() => handleSelect(img.secure_url)}
                                                >
                                                    <Image
                                                        src={img.secure_url}
                                                        alt={img.public_id}
                                                        fill
                                                        className="object-cover transition-transform group-hover:scale-105"
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}
