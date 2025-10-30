'use client'
import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import {
    Award,
    ChevronLeft,
    ChevronRight,
    Clock,
    Key,
    MapPin,
    Phone,
    Star,
    User,
    X,
} from 'lucide-react'
import { Separator } from '@/components/ui/separator'
import { Card, CardContent } from '@/components/ui/card'
import {
    type StaysAccommodation,
    type StaysAccommodationReview,
} from '@duffel/api/Stays/StaysTypes'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { StaysAmenities } from '@duffel/components'

const formatTime = (time: string) => {
    if (time === '00:00') return 'Midnight'
    const [hours, minutes] = time.split(':')
    const hour = Number.parseInt(hours)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour % 12 || 12
    return `${displayHour}:${minutes} ${ampm}`
}

export default function PropertyDetails({
    propertyData,
    reviews,
}: {
    propertyData: StaysAccommodation
    reviews: StaysAccommodationReview[]
}) {
    const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(
        null,
    )

    const {
        photos,
        location,
        name,
        chain,
        description,
        amenities,
        brand,
        rating,
        review_score,
        phone_number,
        key_collection,
        supported_loyalty_programme,
        check_in_information,
        review_count,
    } = propertyData
    const handlePrevImage = () => {
        if (selectedImageIndex !== null) {
            setSelectedImageIndex(
                (selectedImageIndex - 1 + photos?.length!) % photos.length,
            )
        }
    }

    const handleNextImage = () => {
        if (selectedImageIndex !== null) {
            setSelectedImageIndex((selectedImageIndex + 1) % photos.length)
        }
    }

    return (
        <div className="bg-background min-h-screen">
            {/* Hero Image */}
            <div className="relative w-full">
                {/* Main Image */}
                <div
                    className="bg-muted group relative h-[500px] w-full cursor-pointer overflow-hidden"
                    onClick={() => setSelectedImageIndex(0)}
                >
                    {photos && photos.length > 0 && (
                        <>
                            <img
                                src={photos[0].url || '/placeholder.svg'}
                                alt={name}
                                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                            />
                            <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/10">
                                <div className="rounded-lg bg-white/90 px-4 py-2 opacity-0 transition-opacity group-hover:opacity-100">
                                    <p className="text-sm font-medium">
                                        Click to view all {photos.length} photos
                                    </p>
                                </div>
                            </div>
                        </>
                    )}
                </div>

                {/* Image Gallery Grid */}
                {photos.length > 1 && (
                    <div className="relative z-10 mx-auto -mt-20 max-w-7xl px-4 sm:px-6 lg:px-8">
                        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
                            {photos.slice(1, 5).map((photo, index) => (
                                <div
                                    key={index}
                                    className="bg-muted group aspect-video cursor-pointer overflow-hidden rounded-lg shadow-lg"
                                    onClick={() =>
                                        setSelectedImageIndex(index + 1)
                                    }
                                >
                                    <img
                                        src={photo.url || '/placeholder.svg'}
                                        alt={`${name} - Image ${index + 2}`}
                                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                                    />
                                </div>
                            ))}
                        </div>
                        {photos?.length > 5 && (
                            <button
                                onClick={() => setSelectedImageIndex(5)}
                                className="text-primary mt-4 w-full text-center text-sm font-medium hover:underline"
                            >
                                View all {photos?.length} photos
                            </button>
                        )}
                    </div>
                )}
            </div>

            <Dialog
                open={selectedImageIndex !== null}
                onOpenChange={() => setSelectedImageIndex(null)}
            >
                <DialogContent className="h-[90vh] w-full max-w-7xl bg-black/95 p-0">
                    <div className="relative flex h-full w-full items-center justify-center">
                        {/* Close button */}
                        <Button
                            variant="ghost"
                            size="icon"
                            className="absolute top-4 right-4 z-50 text-white hover:bg-white/20"
                            onClick={() => setSelectedImageIndex(null)}
                        >
                            <X className="h-6 w-6" />
                        </Button>

                        {/* Image counter */}
                        <div className="absolute top-4 left-4 z-50 rounded-lg bg-black/60 px-4 py-2 text-sm font-medium text-white">
                            {selectedImageIndex !== null &&
                                `${selectedImageIndex + 1} / ${photos.length}`}
                        </div>

                        {/* Previous button */}
                        <Button
                            variant="ghost"
                            size="icon"
                            className="absolute left-4 z-50 h-12 w-12 text-white hover:bg-white/20"
                            onClick={handlePrevImage}
                        >
                            <ChevronLeft className="h-8 w-8" />
                        </Button>

                        {/* Current image */}
                        {selectedImageIndex !== null && (
                            <img
                                src={
                                    photos[selectedImageIndex].url ||
                                    '/placeholder.svg'
                                }
                                alt={`${name} - Image ${selectedImageIndex + 1}`}
                                className="max-h-full max-w-full object-contain"
                            />
                        )}

                        {/* Next button */}
                        <Button
                            variant="ghost"
                            size="icon"
                            className="absolute right-4 z-50 h-12 w-12 text-white hover:bg-white/20"
                            onClick={handleNextImage}
                        >
                            <ChevronRight className="h-8 w-8" />
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Main Content */}
            <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                <div className="grid gap-8 lg:grid-cols-3">
                    {/* Left Column - Main Info */}
                    <div className="space-y-6 lg:col-span-2">
                        {/* Header */}
                        <div>
                            <div className="mb-2 flex items-center gap-2">
                                {chain && (
                                    <Badge
                                        variant="secondary"
                                        className="text-xs"
                                    >
                                        {chain.name}
                                    </Badge>
                                )}
                                {brand && (
                                    <Badge
                                        variant="outline"
                                        className="text-xs"
                                    >
                                        {brand.name}
                                    </Badge>
                                )}
                            </div>
                            <h1 className="mb-3 text-4xl font-bold tracking-tight text-balance">
                                {name}
                            </h1>
                            <div className="flex flex-wrap items-center gap-4">
                                <div className="flex items-center gap-1">
                                    {Array.from({ length: rating! }).map(
                                        (_, i) => (
                                            <Star
                                                key={i}
                                                className="fill-primary text-primary h-4 w-4"
                                            />
                                        ),
                                    )}
                                    <span className="text-muted-foreground ml-1 text-sm">
                                        {rating} Star Hotel
                                    </span>
                                </div>
                                <Separator
                                    orientation="vertical"
                                    className="h-4"
                                />
                                <div className="flex items-center gap-2">
                                    <div className="bg-primary text-primary-foreground flex items-center gap-1 rounded-md px-2 py-1 text-sm font-semibold">
                                        {review_score}
                                    </div>
                                    <span className="text-muted-foreground text-sm">
                                        {review_count} reviews
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Description */}
                        <h2 className="mb-3 text-xl font-semibold">{`About ${name}`}</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            {description}
                        </p>

                        <p className="pt-5 text-xl font-semibold">Amenities</p>
                        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                            <StaysAmenities amenities={amenities} />
                        </div>

                        <p className="pt-5 text-xl font-semibold">Location</p>
                        <div className="space-y-3 pt-5">
                            <div className="flex items-start gap-3">
                                <MapPin className="text-primary mt-0.5 h-5 w-5 flex-shrink-0" />
                                <div>
                                    <p className="font-medium">
                                        {location.address.line_one}
                                    </p>
                                    <p className="text-muted-foreground">
                                        {location.address.city_name},{' '}
                                        {location.address.region}{' '}
                                        {location.address.postal_code},{' '}
                                        {location.address.country_code}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Reviews Section */}
                        {reviews && reviews.length > 0 && (
                            <Card>
                                <CardContent className="h-[500px] overflow-y-auto pt-6">
                                    <h2 className="mb-4 text-xl font-semibold">
                                        Guest Reviews
                                    </h2>
                                    <div className="space-y-4">
                                        {reviews
                                            .slice(0, 100)
                                            .map((review, index) => (
                                                <div
                                                    key={index}
                                                    className="border-b pb-4 last:border-b-0 last:pb-0"
                                                >
                                                    <div className="mb-2 flex items-start justify-between gap-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-full">
                                                                <User className="text-primary h-5 w-5" />
                                                            </div>
                                                            <div>
                                                                <p className="font-semibold">
                                                                    {
                                                                        review.reviewer_name
                                                                    }
                                                                </p>
                                                                <p className="text-muted-foreground text-xs">
                                                                    {
                                                                        review.created_at
                                                                    }
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <div className="bg-primary text-primary-foreground flex items-center gap-1 rounded-md px-2 py-1 text-sm font-semibold">
                                                            {`${review.score} / 10`}
                                                        </div>
                                                    </div>
                                                    <p className="text-muted-foreground ml-13 leading-relaxed">
                                                        {review.text}
                                                    </p>
                                                </div>
                                            ))}
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>

                    {/* Right Column - Booking Info */}
                    <div className="space-y-6">
                        {/* Check-in Information */}
                        <Card className="sticky top-4">
                            <CardContent className="space-y-6 pt-6">
                                <div>
                                    <h3 className="mb-4 text-lg font-semibold">
                                        Check-in & Check-out
                                    </h3>
                                    <div className="space-y-4">
                                        <div className="flex items-start gap-3">
                                            <Clock className="text-primary mt-0.5 h-5 w-5" />
                                            <div className="flex-1">
                                                <p className="text-sm font-medium">
                                                    Check-in
                                                </p>
                                                {check_in_information && (
                                                    <p className="text-muted-foreground text-sm">
                                                        From{' '}
                                                        {formatTime(
                                                            check_in_information.check_in_after_time,
                                                        )}
                                                        {check_in_information?.check_in_after_time !==
                                                            '00:00' &&
                                                            ` to ${formatTime(check_in_information?.check_out_before_time)}`}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-3">
                                            <Clock className="text-primary mt-0.5 h-5 w-5" />
                                            <div className="flex-1">
                                                <p className="text-sm font-medium">
                                                    Check-out
                                                </p>
                                                <p className="text-muted-foreground text-sm">
                                                    Before{' '}
                                                    {formatTime(
                                                        check_in_information.check_out_before_time,
                                                    )}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <Separator />

                                {/* Key Collection */}
                                {key_collection && (
                                    <>
                                        <div className="flex items-start gap-3">
                                            <Key className="text-primary mt-0.5 h-5 w-5" />
                                            <div>
                                                <p className="mb-1 text-sm font-medium">
                                                    Key Collection
                                                </p>
                                                <p className="text-muted-foreground text-sm">
                                                    {
                                                        key_collection.instructions
                                                    }
                                                </p>
                                            </div>
                                        </div>
                                        <Separator />
                                    </>
                                )}

                                {/* Contact Information */}
                                <div>
                                    <h3 className="mb-4 text-lg font-semibold">
                                        Contact
                                    </h3>
                                    <div className="space-y-3">
                                        <a
                                            href={`tel:${phone_number}`}
                                            className="hover:bg-secondary/50 flex items-center gap-3 rounded-lg p-3 transition-colors"
                                        >
                                            <Phone className="text-primary h-5 w-5" />
                                            <span className="text-sm">
                                                {phone_number}
                                            </span>
                                        </a>
                                    </div>
                                </div>

                                {/* Loyalty Program */}
                                {supported_loyalty_programme && (
                                    <>
                                        <Separator />
                                        <div className="flex items-start gap-3">
                                            <Award className="text-primary mt-0.5 h-5 w-5" />
                                            <div>
                                                <p className="mb-1 text-sm font-medium">
                                                    Loyalty Program
                                                </p>
                                                <p className="text-muted-foreground text-sm">
                                                    {supported_loyalty_programme.replace(
                                                        /_/g,
                                                        ' ',
                                                    )}
                                                </p>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    )
}
