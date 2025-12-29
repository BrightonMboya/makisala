import type { FAQItem } from './faq'
import { BASE_URL } from '@/lib/constants'
import { addYears } from 'date-fns'
import {
    type StaysAmenity,
    type StaysLocation,
    type StaysRating,
} from '@duffel/api/Stays/StaysTypes'

export const OrganizationSchema = () => {
    return {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        '@id': 'https://www.makisala.com/#website',
        url: 'https://www.makisala.com',
        logo: 'https://www.makisala.com/makisala_icon.png',
        image: 'https://www.makisala.com/makisala_icon.png',
        name: 'Makisala Safaris',
        description:
            'Makisala Safaris offers unforgettable African safari experiences including walking safaris, canoe safaris, and 4x4 game drives across Tanzania and East Africa.',
        email: 'info@makisala.com',
        telephone: '+255788323254',
        address: {
            '@type': 'PostalAddress',
            streetAddress: 'Ngaramtoni',
            addressLocality: 'Arusha',
            addressCountry: 'TZ',
            addressRegion: 'Arusha',
            postalCode: '1865',
        },
        contactPoint: {
            '@type': 'ContactPoint',
            telephone: '+255788323254',
            email: 'info@makisala.com',
            contactType: 'Customer Service',
            areaServed: 'TZ',
            availableLanguage: ['English', 'Swahili'],
        },
        foundingDate: '2022',
        founder: {
            '@type': 'Person',
            name: 'Brighton Mboya',
        },
    }
}

export const WebsiteSchema = () => {
    return {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        '@id': 'https://www.makisala.com/#website',
        publisher: 'https://www.makisala.com#organization',
        name: 'Makisala Safaris',
        url: 'https://www.makisala.com',
        description:
            'Makisala Safaris is a Tanzania-based safari company offering guided walking safaris, canoe trips, and 4x4 wildlife adventures across East Africa.',
        inLanguage: 'en',
    }
}

export const BlogSchema = ({
    headline,
    image,
    description,
}: {
    headline: string
    image: string
    description: string
}) => {
    return {
        '@context': 'https://schema.org',
        '@type': 'BlogPosting',
        headline: `${headline}`,
        image: `${image}`,
        author: {
            '@type': 'Person',
            name: 'Uwiduhaye Diane',
        },
        publisher: {
            '@type': 'Organization',
            name: 'Makisala Safaris',
            logo: {
                '@type': 'ImageObject',
                url: 'https://www.makisala.com/makisala_icon.png',
            },
        },
        datePublished: '2025-07-15',
        dateModified: '2025-07-15',
        description: description,
    }
}

export const BreadcrumbSchema = ({
    breadcrumbs,
}: {
    breadcrumbs: { name: string; url: string }[]
}) => {
    return {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: breadcrumbs.map((crumb, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            name: crumb.name,
            item: crumb.url,
        })),
    }
}

export const FAQSchema = ({ faqs }: { faqs: FAQItem[] }) => {
    return {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: faqs.map(faq => ({
            '@type': 'Question',
            name: faq.question,
            acceptedAnswer: {
                '@type': 'Answer',
                text: faq.answer,
            },
        })),
    }
}

export const TouristTripSchema = ({
    name,
    description,
    url,
    pricingStartsFrom,
    itineraryItems,
}: {
    name: string
    description: string
    url: string
    pricingStartsFrom: string
    itineraryItems: {
        name: string
        description: string
    }[]
}) => {
    return {
        '@context': 'https://schema.org',
        '@type': 'TouristTrip',
        name: name,
        description: description,
        touristType: [
            'Family Safari',
            'African Safari',
            'Couples and honeymooners Safari',
            'Group Safari',
        ],
        offers: {
            '@type': 'Offer',
            name: name,
            description: description,
            price: pricingStartsFrom,
            priceCurrency: 'USD',
            url: url,
            offeredBy: {
                '@type': 'Organization',
                name: 'Makisala Safaris',
                url: 'https://www.makisala.com',
            },
        },
        itinerary: {
            '@type': 'ItemList',
            numberOfItems: itineraryItems.length,
            itemListElement: itineraryItems.map((item, index) => ({
                '@type': 'ListItem',
                position: index + 1,
                item: {
                    '@type': 'TouristAttraction',
                    name: item.name,
                    description: item.description,
                },
            })),
        },
    }
}

export const TouristDestinationSchema = ({
    name,
    description,
    image,
    url,
    country,
}: {
    name: string
    description: string
    image: string
    url: string
    country: string
}) => {
    return {
        '@context': 'https://schema.org',
        '@type': 'TouristDestination',
        name: name,
        description: description,
        image: image,
        url: url,
        touristType: {
            '@type': 'Audience',
            audienceType: [
                'Family Safari',
                'African Safari',
                'Couples and honeymooners Safari',
                'Group Safari',
            ],
        },
        geo: {
            '@type': 'Place',
            address: {
                '@type': 'PostalAddress',
                addressCountry: country,
            },
        },
    }
}

export const ProductSchema = ({
    name,
    description,
    imgUrl,
    price,
    tour_slug,
    tour_id,
}: {
    name: string
    description: string
    imgUrl: string
    price: string
    tour_slug: string
    tour_id: string
}) => {
    return {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: name,
        image: [imgUrl],
        description: description,
        brand: OrganizationSchema(),
        sku: tour_id,
        // aggregateRating: {
        //     '@type': 'AggregateRating',
        //     ratingValue: '4.9',
        //     reviewCount: '100',
        // },
        offers: {
            '@type': 'Offer',
            price: price,
            priceCurrency: 'USD',
            priceValidUntil: addYears(new Date(), 1).toISOString().split('T')[0],
            availability: 'https://schema.org/InStock',
            url: `${BASE_URL}/tours/${tour_slug}`,
        },
    }
}

export const TouristAttractionSchema = ({
    name,
    description,
    image,
    url,
}: {
    name: string
    description: string
    image: string
    url: string
}) => {
    return {
        '@context': 'https://schema.org',
        '@type': 'TouristAttraction',
        name: name,
        description: description,
        image: image,
        url: url,
        // geo: {
        //     '@type': 'GeoCoordinates',
        //     latitude: '48.8584',
        //     longitude: '2.2945',
        // },
        openingHoursSpecification: {
            '@type': 'OpeningHoursSpecification',
            dayOfWeek: [
                'Monday',
                'Tuesday',
                'Wednesday',
                'Thursday',
                'Friday',
                'Saturday',
                'Sunday',
            ],
            opens: '06:00',
            closes: '18:00',
        },
        isAccessibleForFree: false,
        touristType: ['Couples', 'Families', 'Solo Travelers'],
    }
}

export const ParkSchema = ({
    name,
    description,
    image,
    url,
    telephone,
    address,
}: {
    name: string
    description: string
    image: string
    url: string
    telephone?: string
    address?: {
        streetAddress?: string
        addressLocality?: string
        addressRegion?: string
        postalCode?: string
        addressCountry: string
    }
}) => {
    return {
        '@context': 'https://schema.org',
        '@type': 'Park',
        name: name,
        description: description,
        image: image,
        url: url,
        telephone: telephone,
        address: address
            ? {
                  '@type': 'PostalAddress',
                  ...address,
              }
            : undefined,
        openingHoursSpecification: {
            '@type': 'OpeningHoursSpecification',
            dayOfWeek: [
                'Monday',
                'Tuesday',
                'Wednesday',
                'Thursday',
                'Friday',
                'Saturday',
                'Sunday',
            ],
            opens: '06:00',
            closes: '18:00',
        },
        isAccessibleForFree: false,
    }
}

export const AccomodationSchema = ({
    name,
    url,
    location,
    description,
    telephone,
    ratings,
    review_count,
    amenities,
}: {
    name: string
    url: string
    description: string
    telephone: string
    location: StaysLocation
    ratings: StaysRating[] | null
    review_count: number
    amenities: StaysAmenity[] | null
}) => {
    return {
        '@context': 'https://schema.org',
        '@type': 'Hotel',
        name: name,
        description: description,
        url: url,
        telephone: telephone,
        // priceRange: '€€€',
        address: {
            '@type': 'PostalAddress',
            streetAddress: location.address.line_one,
            addressLocality: location.address.city_name,
            postalCode: location.address.postal_code,
            addressCountry: location.address.country_code,
        },
        aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: !ratings || ratings[0].value || 4.5,
            reviewCount: review_count,
        },
        amenityFeature: amenities?.map(amenity => {
            return {
                '@type': 'LocationFeatureSpecification',
                name: amenity.type,
                value: true,
            }
        }),
    }
}
