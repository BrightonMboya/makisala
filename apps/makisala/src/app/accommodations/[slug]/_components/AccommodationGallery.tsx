'use client'

import * as React from 'react'
import Image from 'next/image'
import AccommodationImageCarousel from '@/app/tours/[tour_slug]/_components/AccommodationImageCarousel'

interface GalleryImage {
    imageUrl: string
    alt?: string
}

interface Props {
    images: GalleryImage[]
    accommodationName: string
}

export default function AccommodationGallery({ images, accommodationName }: Props) {
    const [open, setOpen] = React.useState(false)
    const [activeIndex, setActiveIndex] = React.useState(0)

    if (!images || images.length === 0) return null

    const hero = images[0]!
    const thumbs = images.slice(1, 5)
    const extra = images.length - 5

    return (
        <>
            <div className="grid gap-2 md:grid-cols-4 md:grid-rows-2">
                <button
                    type="button"
                    onClick={() => {
                        setActiveIndex(0)
                        setOpen(true)
                    }}
                    className="relative col-span-2 row-span-2 h-64 overflow-hidden rounded-xl md:h-[420px]"
                >
                    <Image
                        src={hero.imageUrl}
                        alt={hero.alt || `${accommodationName} main view`}
                        fill
                        sizes="(max-width: 768px) 100vw, 50vw"
                        className="object-cover transition-transform hover:scale-105"
                        priority
                    />
                </button>
                {thumbs.map((img, i) => (
                    <button
                        key={i}
                        type="button"
                        onClick={() => {
                            setActiveIndex(i + 1)
                            setOpen(true)
                        }}
                        className="relative hidden h-[206px] overflow-hidden rounded-xl md:block"
                    >
                        <Image
                            src={img.imageUrl}
                            alt={img.alt || `${accommodationName} image ${i + 2}`}
                            fill
                            sizes="25vw"
                            className="object-cover transition-transform hover:scale-105"
                        />
                        {i === thumbs.length - 1 && extra > 0 && (
                            <span className="absolute inset-0 flex items-center justify-center bg-black/50 text-lg font-semibold text-white">
                                +{extra} more
                            </span>
                        )}
                    </button>
                ))}
            </div>
            <AccommodationImageCarousel
                images={images}
                initialIndex={activeIndex}
                open={open}
                onOpenChange={setOpen}
                accommodationName={accommodationName}
            />
        </>
    )
}
