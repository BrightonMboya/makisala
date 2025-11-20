import * as React from 'react'
import Image from 'next/image'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import {
    Dialog,
    DialogContent,
    DialogTitle,
    DialogDescription,
    DialogClose,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface AccommodationImageCarouselProps {
    images: { imageUrl: string; alt?: string }[]
    initialIndex: number
    open: boolean
    onOpenChange: (open: boolean) => void
    accommodationName: string
}

export default function AccommodationImageCarousel({
    images,
    initialIndex,
    open,
    onOpenChange,
    accommodationName,
}: AccommodationImageCarouselProps) {
    const [currentIndex, setCurrentIndex] = React.useState(initialIndex)

    // Reset current index when dialog opens with a new initialIndex
    React.useEffect(() => {
        if (open) {
            setCurrentIndex(initialIndex)
        }
    }, [open, initialIndex])

    const nextImage = React.useCallback(() => {
        setCurrentIndex((prev) => (prev + 1) % images.length)
    }, [images.length])

    const prevImage = React.useCallback(() => {
        setCurrentIndex((prev) => (prev - 1 + images.length) % images.length)
    }, [images.length])

    const handleKeyDown = React.useCallback(
        (e: React.KeyboardEvent) => {
            if (e.key === 'ArrowRight') nextImage()
            if (e.key === 'ArrowLeft') prevImage()
        },
        [nextImage, prevImage]
    )

    if (!images || images.length === 0) return null

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                className="max-w-4xl border-none bg-transparent p-0 shadow-none sm:max-w-5xl"
                showCloseButton={false}
                onKeyDown={handleKeyDown}
            >
                <DialogTitle className="sr-only">
                    {accommodationName} Gallery
                </DialogTitle>
                <DialogDescription className="sr-only">
                    View images of {accommodationName}
                </DialogDescription>

                <div className="relative flex h-[80vh] w-full flex-col items-center justify-center outline-none">
                    {/* Close Button */}
                    <div className="absolute top-2 right-2 z-50 md:-top-4 md:-right-4">
                        <DialogClose asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-10 w-10 rounded-full bg-black/50 text-white hover:bg-black/70"
                            >
                                <X className="h-6 w-6" />
                                <span className="sr-only">Close</span>
                            </Button>
                        </DialogClose>
                    </div>

                    {/* Main Image */}
                    <div className="relative h-full w-full overflow-hidden rounded-lg bg-black/20 backdrop-blur-sm">
                        <Image
                            src={images[currentIndex].imageUrl}
                            alt={
                                images[currentIndex].alt ||
                                `${accommodationName} - Image ${currentIndex + 1}`
                            }
                            fill
                            className="object-contain"
                            priority
                            sizes="(max-width: 768px) 100vw, 1200px"
                        />
                    </div>

                    {/* Navigation Buttons */}
                    {images.length > 1 && (
                        <>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/50 text-white hover:bg-black/70 md:-left-12"
                                onClick={(e) => {
                                    e.stopPropagation()
                                    prevImage()
                                }}
                            >
                                <ChevronLeft className="h-8 w-8" />
                                <span className="sr-only">Previous image</span>
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/50 text-white hover:bg-black/70 md:-right-12"
                                onClick={(e) => {
                                    e.stopPropagation()
                                    nextImage()
                                }}
                            >
                                <ChevronRight className="h-8 w-8" />
                                <span className="sr-only">Next image</span>
                            </Button>
                        </>
                    )}

                    {/* Thumbnails / Counter */}
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black/50 px-4 py-1 text-sm font-medium text-white backdrop-blur-sm">
                        {currentIndex + 1} / {images.length}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
