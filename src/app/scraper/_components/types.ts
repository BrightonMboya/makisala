export interface TourData {
    pricing: number
    overview: string
    tourName: string
    country: string
    sourceUrl: string
    img_url: string
    number_of_days: number
    itinerary: ItineraryDay[]
    activities: Activity[]
    topFeatures: TopFeature[]
}

export interface ItineraryDay {
    day_number: number
    itinerary_day_title: string
    overview: string
    accomodation: Accommodation
}

export interface Accommodation {
    accomodation_name: string
    accomodation_url: string
    img_urls: ImageUrl[]
    overview: string
}

export interface ImageUrl {
    image_url: string
}

export interface Activity {
    activity_name: string
}

export interface TopFeature {
    title: string
    description: string
}
