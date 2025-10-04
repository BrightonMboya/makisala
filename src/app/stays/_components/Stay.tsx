"use client"
import {StaysSummary} from "@duffel/components";
import {StaysAccommodation, StaysSearchResult} from "@duffel/api/Stays/StaysTypes";
import Image from "next/image";
import {Star} from "lucide-react";
import {Button} from "@/components/ui/button";

interface IProps {
    stay: StaysAccommodation
}

export default function Stay({stay}: IProps) {
    // if (!stay || !stay.accomodation.photos) {
    //     return <div>No photos available for {stay?.name || "this stay"}</div>;
    // }

    const renderStars = (rating?: number) => {
        if (!rating) return null;

        const stars = [];
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 !== 0;

        for (let i = 0; i < fullStars; i++) {
            stars.push(<span key={i} className="text-yellow-400">★</span>);
        }

        if (hasHalfStar) {
            stars.push(<span key="half" className="text-yellow-400">☆</span>);
        }

        return <div className="flex items-center">{stars}</div>;
    };

    return (
        <>
            <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                {stay.photos && stay.photos.length > 0 && (
                    <div className="aspect-w-16 aspect-h-9">
                        <img
                            src={stay.photos[0].url}
                            alt={stay.name}
                            className="w-full h-48 object-cover"
                        />
                    </div>
                )}

                <div className="p-4">
                    <div className="flex justify-between items-start mb-2">
                        <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
                            {stay.name}
                        </h3>
                        {stay.rating && (
                            <div className="flex items-center ml-2">
                                {renderStars(stay.rating)}
                                <span className="text-sm text-gray-600 ml-1">
                                  ({stay.review_count || 0})
                                </span>
                            </div>
                        )}
                    </div>

                    {/*{stay.propertyType && (*/}
                    {/*    <p className="text-sm text-gray-600 mb-2 capitalize">*/}
                    {/*        {stay.propertyType}*/}
                    {/*    </p>*/}
                    {/*)}*/}

                    {stay.location.address && (
                        <p className="text-sm text-gray-500 mb-3 line-clamp-2">
                            {stay.location.address.city_name}, {stay.location.address.region}
                        </p>
                    )}

                    {stay.amenities && stay.amenities.length > 0 && (
                        <div className="mb-3">
                            <div className="flex flex-wrap gap-1">
                                {stay.amenities.slice(0, 3).map((amenity, index) => (
                                    <span
                                        key={index}
                                        className="inline-block bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded"
                                    >
                                     {amenity.type}
                                    </span>
                                ))}
                                {stay.amenities.length > 3 && (
                                    <span className="text-xs text-gray-500">
                    +{stay.amenities.length - 3} more
                  </span>
                                )}
                            </div>
                        </div>
                    )}

                    <div className="flex justify-between items-center mx-auto">
                        <div>
                            {/*<div className="text-xl font-bold text-gray-900">*/}
                            {/*    ${stay.cheapest_rate_base_amount}*/}
                            {/*</div>*/}
                            <div className="text-sm text-gray-500">per night</div>
                        </div>

                        {/*<button*/}
                        {/*    onClick={() => setShowBookingModal(true)}*/}
                        {/*    className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"*/}
                        {/*>*/}
                        {/*    Book Now*/}
                        {/*</button>*/}
                    </div>
                </div>
            </div>

            {/*{showBookingModal && (*/}
            {/*    <BookingModal*/}
            {/*        stay={stay}*/}
            {/*        searchParams={searchParams}*/}
            {/*        onClose={() => setShowBookingModal(false)}*/}
            {/*    />*/}
            {/*)}*/}
        </>
    )

}