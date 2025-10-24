'use client'
import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import {
    Award,
    Clock,
    Key,
    MapPin,
    Phone,
    Star,
    ChevronLeft,
    ChevronRight,
    X,
    User,
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
    const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null)

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
        email,
    } = propertyData
    const handlePrevImage = () => {
        if (selectedImageIndex !== null) {
            setSelectedImageIndex((selectedImageIndex - 1 + photos.length) % photos.length)
        }
    }

    const handleNextImage = () => {
        if (selectedImageIndex !== null) {
            setSelectedImageIndex((selectedImageIndex + 1) % photos.length)
        }
    }

    return (
        <div className="min-h-screen bg-background">
            {/* Hero Image */}
            <div className="relative w-full">
                {/* Main Image */}
                <div
                    className="relative h-[500px] w-full overflow-hidden bg-muted cursor-pointer group"
                    onClick={() => setSelectedImageIndex(0)}
                >
                    {photos && photos.length > 0 && (
                        <>
                            <img
                                src={photos[0].url || '/placeholder.svg'}
                                alt={name}
                                className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                                <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 px-4 py-2 rounded-lg">
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
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 -mt-20 relative z-10">
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                            {photos.slice(1, 5).map((photo, index) => (
                                <div
                                    key={index}
                                    className="aspect-video overflow-hidden rounded-lg shadow-lg bg-muted cursor-pointer group"
                                    onClick={() => setSelectedImageIndex(index + 1)}
                                >
                                    <img
                                        src={photo.url || '/placeholder.svg'}
                                        alt={`${name} - Image ${index + 2}`}
                                        className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                                    />
                                </div>
                            ))}
                        </div>
                        {photos?.length > 5 && (
                            <button
                                onClick={() => setSelectedImageIndex(5)}
                                className="w-full text-center text-sm text-primary hover:underline mt-4 font-medium"
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
                <DialogContent className="max-w-7xl w-full h-[90vh] p-0 bg-black/95">
                    <div className="relative w-full h-full flex items-center justify-center">
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
                        <div className="absolute top-4 left-4 z-50 bg-black/60 text-white px-4 py-2 rounded-lg text-sm font-medium">
                            {selectedImageIndex !== null &&
                                `${selectedImageIndex + 1} / ${photos.length}`}
                        </div>

                        {/* Previous button */}
                        <Button
                            variant="ghost"
                            size="icon"
                            className="absolute left-4 z-50 text-white hover:bg-white/20 h-12 w-12"
                            onClick={handlePrevImage}
                        >
                            <ChevronLeft className="h-8 w-8" />
                        </Button>

                        {/* Current image */}
                        {selectedImageIndex !== null && (
                            <img
                                src={photos[selectedImageIndex].url || '/placeholder.svg'}
                                alt={`${name} - Image ${selectedImageIndex + 1}`}
                                className="max-h-full max-w-full object-contain"
                            />
                        )}

                        {/* Next button */}
                        <Button
                            variant="ghost"
                            size="icon"
                            className="absolute right-4 z-50 text-white hover:bg-white/20 h-12 w-12"
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
                    <div className="lg:col-span-2 space-y-6">
                        {/* Header */}
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                {chain && (
                                    <Badge variant="secondary" className="text-xs">
                                        {chain.name}
                                    </Badge>
                                )}
                                {brand && (
                                    <Badge variant="outline" className="text-xs">
                                        {brand.name}
                                    </Badge>
                                )}
                            </div>
                            <h1 className="text-4xl font-bold tracking-tight text-balance mb-3">
                                {name}
                            </h1>
                            <div className="flex items-center gap-4 flex-wrap">
                                <div className="flex items-center gap-1">
                                    {Array.from({ length: rating! }).map((_, i) => (
                                        <Star
                                            key={i}
                                            className="h-4 w-4 fill-primary text-primary"
                                        />
                                    ))}
                                    <span className="ml-1 text-sm text-muted-foreground">
                                        {rating} Star Hotel
                                    </span>
                                </div>
                                <Separator orientation="vertical" className="h-4" />
                                <div className="flex items-center gap-2">
                                    <div className="flex items-center gap-1 bg-primary text-primary-foreground px-2 py-1 rounded-md font-semibold text-sm">
                                        {review_score}
                                    </div>
                                    <span className="text-sm text-muted-foreground">
                                        {review_count} reviews
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Description */}
                        <h2 className="text-xl font-semibold mb-3">{`About ${name}`}</h2>
                        <p className="text-muted-foreground leading-relaxed">{description}</p>

                        <p className="text-xl font-semibold pt-5">Amenities</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-5">
                            <StaysAmenities amenities={amenities} />
                        </div>

                        <p className="text-xl font-semibold pt-5">Location</p>
                        <div className="space-y-3 pt-5">
                            <div className="flex items-start gap-3">
                                <MapPin className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                                <div>
                                    <p className="font-medium">{location.address.line_one}</p>
                                    <p className="text-muted-foreground">
                                        {location.address.city_name}, {location.address.region}{' '}
                                        {location.address.postal_code},{' '}
                                        {location.address.country_code}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Reviews Section */}
                        {reviews && reviews.length > 0 && (
                            <Card>
                                <CardContent className="pt-6 h-[500px] overflow-y-auto">
                                    <h2 className="text-xl font-semibold mb-4">Guest Reviews</h2>
                                    <div className="space-y-4">
                                        {reviews.slice(0, 100).map((review, index) => (
                                            <div
                                                key={index}
                                                className="border-b last:border-b-0 pb-4 last:pb-0"
                                            >
                                                <div className="flex items-start justify-between gap-4 mb-2">
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                                                            <User className="h-5 w-5 text-primary" />
                                                        </div>
                                                        <div>
                                                            <p className="font-semibold">
                                                                {review.reviewer_name}
                                                            </p>
                                                            <p className="text-xs text-muted-foreground">
                                                                {review.created_at}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-1 bg-primary text-primary-foreground px-2 py-1 rounded-md font-semibold text-sm">
                                                        {`${review.score} / 10`}
                                                    </div>
                                                </div>
                                                <p className="text-muted-foreground leading-relaxed ml-13">
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
                            <CardContent className="pt-6 space-y-6">
                                <div>
                                    <h3 className="text-lg font-semibold mb-4">
                                        Check-in & Check-out
                                    </h3>
                                    <div className="space-y-4">
                                        <div className="flex items-start gap-3">
                                            <Clock className="h-5 w-5 text-primary mt-0.5" />
                                            <div className="flex-1">
                                                <p className="font-medium text-sm">Check-in</p>
                                                {check_in_information && (
                                                    <p className="text-muted-foreground text-sm">
                                                        From{' '}
                                                        {formatTime(
                                                            check_in_information.check_in_after_time
                                                        )}
                                                        {check_in_information?.check_in_after_time !==
                                                            '00:00' &&
                                                            ` to ${formatTime(check_in_information?.check_out_before_time)}`}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-3">
                                            <Clock className="h-5 w-5 text-primary mt-0.5" />
                                            <div className="flex-1">
                                                <p className="font-medium text-sm">Check-out</p>
                                                <p className="text-muted-foreground text-sm">
                                                    Before{' '}
                                                    {formatTime(
                                                        check_in_information.check_out_before_time
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
                                            <Key className="h-5 w-5 text-primary mt-0.5" />
                                            <div>
                                                <p className="font-medium text-sm mb-1">
                                                    Key Collection
                                                </p>
                                                <p className="text-muted-foreground text-sm">
                                                    {key_collection.instructions}
                                                </p>
                                            </div>
                                        </div>
                                        <Separator />
                                    </>
                                )}

                                {/* Contact Information */}
                                <div>
                                    <h3 className="text-lg font-semibold mb-4">Contact</h3>
                                    <div className="space-y-3">
                                        <a
                                            href={`tel:${phone_number}`}
                                            className="flex items-center gap-3 p-3 rounded-lg hover:bg-secondary/50 transition-colors"
                                        >
                                            <Phone className="h-5 w-5 text-primary" />
                                            <span className="text-sm">{phone_number}</span>
                                        </a>
                                    </div>
                                </div>

                                {/* Loyalty Program */}
                                {supported_loyalty_programme && (
                                    <>
                                        <Separator />
                                        <div className="flex items-start gap-3">
                                            <Award className="h-5 w-5 text-primary mt-0.5" />
                                            <div>
                                                <p className="font-medium text-sm mb-1">
                                                    Loyalty Program
                                                </p>
                                                <p className="text-muted-foreground text-sm">
                                                    {supported_loyalty_programme.replace(/_/g, ' ')}
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
