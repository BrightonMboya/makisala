import { format, addDays } from 'date-fns'
import type { ItineraryData, Day as ThemeDay, DayActivity, Location, Accommodation } from '@/data/itineraries'
import type { Day as BuilderDay, TravelerGroup, PricingRow, ExtraOption } from '@/components/itinerary-builder/builder-context'
import { destinationDetails, accommodationDetails } from './data/itinerary-data'

// GeoJSON data for different countries
const RWANDA_GEOJSON = {
    type: "FeatureCollection",
    features: [
        {
            type: "Feature",
            properties: { name: "Rwanda" },
            geometry: {
                type: "Polygon",
                coordinates: [
                    [
                        [29.3399, -1.2132], [29.5833, -1.4333], [30.1500, -1.0500],
                        [30.4000, -1.1000], [30.8500, -1.3500], [30.7000, -2.1500],
                        [30.8000, -2.3500], [30.4500, -2.4000], [29.9000, -2.3500],
                        [29.6000, -2.8500], [29.0000, -2.7000], [28.8500, -2.4000],
                        [29.3000, -1.8000], [29.2500, -1.5500], [29.3399, -1.2132],
                    ],
                ],
            },
        }
    ],
}

const TANZANIA_GEOJSON = {
    type: "FeatureCollection",
    features: [
        {
            type: "Feature",
            properties: { name: "Tanzania" },
            geometry: {
                type: "Polygon",
                coordinates: [
                    [
                        [30.4, -1.0], [33.0, -1.0], [34.0, -3.0], [39.0, -4.5],
                        [41.0, -10.5], [35.0, -11.5], [30.0, -8.0], [29.0, -4.5],
                        [30.4, -1.0]
                    ]
                ]
            }
        }
    ]
}

const BOTSWANA_GEOJSON = {
    type: "FeatureCollection",
    features: [
        {
            type: "Feature",
            properties: { name: "Botswana" },
            geometry: {
                type: "Polygon",
                coordinates: [
                    [
                        [22.0, -18.0], [25.0, -18.0], [26.0, -20.0], [29.0, -22.0],
                        [28.0, -27.0], [25.0, -26.0], [20.0, -25.0], [20.0, -20.0],
                        [22.0, -18.0]
                    ]
                ]
            }
        }
    ]
}

// Map destinations to countries for geojson selection
function getCountryFromDestination(destination: string | null): string {
    if (!destination) return 'rwanda'
    const dest = destination.toLowerCase()
    if (dest.includes('tanzania') || dest.includes('serengeti') || dest.includes('kilimanjaro')) {
        return 'tanzania'
    }
    if (dest.includes('botswana') || dest.includes('okavango') || dest.includes('chobe')) {
        return 'botswana'
    }
    return 'rwanda'
}

function getGeoJsonForCountry(country: string) {
    switch (country) {
        case 'tanzania':
            return TANZANIA_GEOJSON
        case 'botswana':
            return BOTSWANA_GEOJSON
        default:
            return RWANDA_GEOJSON
    }
}

function getMapConfigForCountry(country: string) {
    switch (country) {
        case 'tanzania':
            return { scale: 6000, rotate: [-35.5, 3.2, 0] }
        case 'botswana':
            return { scale: 10000, rotate: [-23.5, 19.0, 0] }
        default:
            return { scale: 40000, rotate: [-29.85, 1.7, 0] }
    }
}

// Convert builder activity to theme activity
function convertActivity(builderActivity: BuilderDay['activities'][0], index: number): DayActivity {
    const momentToTime: Record<string, string> = {
        'Morning': '08:00',
        'Afternoon': '14:00',
        'Evening': '18:00',
        'Half Day': '09:00',
        'Full Day': '08:00',
        'Night': '20:00',
    }
    
    return {
        time: momentToTime[builderActivity.moment] || `${8 + index}:00`,
        activity: builderActivity.name,
        description: builderActivity.description || '',
        location: builderActivity.location || undefined,
    }
}

// Convert meals object to string
function mealsToString(meals: BuilderDay['meals']): string {
    const parts: string[] = []
    if (meals.breakfast) parts.push('Breakfast')
    if (meals.lunch) parts.push('Lunch')
    if (meals.dinner) parts.push('Dinner')
    return parts.join(', ') || 'None'
}

// Convert builder day to theme day
function convertDay(builderDay: BuilderDay, startDate: Date | undefined, dayIndex: number): ThemeDay {
    const currentDate = startDate ? addDays(startDate, dayIndex) : new Date()
    const dateStr = format(currentDate, 'MMMM d, yyyy')
    
    // Convert activities
    const activities: DayActivity[] = builderDay.activities.map((act, idx) => convertActivity(act, idx))
    
    // If no activities but there's a description, create a default activity
    if (activities.length === 0 && builderDay.description) {
        activities.push({
            time: '09:00',
            activity: 'Day Activities',
            description: builderDay.description,
            location: builderDay.destination || undefined,
        })
    }
    
    // Generate title from destination or first activity
    let title = builderDay.destination || ''
    if (!title && activities.length > 0) {
        title = activities[0].activity
    }
    if (!title) {
        title = `Day ${builderDay.dayNumber}`
    }
    
    return {
        day: builderDay.dayNumber,
        date: dateStr,
        title,
        activities,
        accommodation: builderDay.accommodation || 'To be confirmed',
        meals: mealsToString(builderDay.meals),
    }
}

// Extract unique accommodations
function extractAccommodations(days: BuilderDay[]): Accommodation[] {
    const accMap = new Map<string, Accommodation>()
    
    days.forEach(day => {
        if (day.accommodation && !accMap.has(day.accommodation)) {
            const accDetail = accommodationDetails[day.accommodation]
            const destDetail = day.destination ? destinationDetails[day.destination] : null
            
            accMap.set(day.accommodation, {
                id: day.accommodation,
                name: accDetail?.name || day.accommodation,
                image: day.accommodationImage || accDetail?.image || 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?q=80&w=2670&auto=format&fit=crop',
                description: accDetail?.description || `Luxury accommodation in ${day.destination || 'Rwanda'}`,
                location: day.destination || 'Rwanda',
            })
        }
    })
    
    return Array.from(accMap.values())
}

// Generate map locations from destinations
function generateMapLocations(days: BuilderDay[], country: string): Location[] {
    const locations: Location[] = []
    const seen = new Set<string>()
    
    // Helper to normalize destination names for lookup
    const normalizeDestination = (dest: string): string => {
        const normalized = dest.toLowerCase().trim()
        // Try exact match first
        if (destinationDetails[normalized]) {
            return normalized
        }
        // Try common variations
        const variations: Record<string, string> = {
            'akagera': 'akagera-np',
            'akagera national park': 'akagera-np',
            'volcanoes': 'volcanoes-np',
            'volcanoes national park': 'volcanoes-np',
            'nyungwe': 'nyungwe-np',
            'nyungwe forest national park': 'nyungwe-np',
            'nyungwe national park': 'nyungwe-np',
            'gishwati-mukura': 'gishwati-mukura-np',
            'gishwati-mukura national park': 'gishwati-mukura-np',
            'lake kivu': 'lake-kivu',
        }
        
        for (const [key, value] of Object.entries(variations)) {
            if (normalized.includes(key)) {
                return value
            }
        }
        
        return normalized
    }
    
    days.forEach(day => {
        if (day.destination) {
            const dest = day.destination.toLowerCase()
            if (!seen.has(dest)) {
                seen.add(dest)
                const normalizedDest = normalizeDestination(day.destination)
                const destDetail = destinationDetails[normalizedDest]
                if (destDetail) {
                    locations.push({
                        name: day.destination,
                        coordinates: [destDetail.coordinates.lng, destDetail.coordinates.lat],
                    })
                }
            }
        }
    })
    
    // If no locations found, provide a default based on country
    if (locations.length === 0) {
        const defaultLocations: Record<string, Location> = {
            'rwanda': {
                name: 'Kigali',
                coordinates: [30.0619, -1.9441],
            },
            'tanzania': {
                name: 'Arusha',
                coordinates: [36.683, -3.367],
            },
            'botswana': {
                name: 'Maun',
                coordinates: [23.41, -19.98],
            },
        }
        const defaultLoc = defaultLocations[country] || defaultLocations['rwanda']
        locations.push(defaultLoc)
    }
    
    return locations
}

// Calculate pricing
function calculatePricing(pricingRows: PricingRow[], extras: ExtraOption[], travelerGroups: TravelerGroup[]): ItineraryData['pricing'] {
    const totalPrice = pricingRows.reduce((acc, row) => acc + (row.unitPrice * row.count), 0) +
                       extras.filter(e => e.selected).reduce((acc, e) => acc + e.price, 0)
    
    const totalTravelers = travelerGroups.reduce((acc, g) => acc + g.count, 0)
    const perPerson = totalTravelers > 0 ? totalPrice / totalTravelers : 0
    
    return {
        total: `$${Math.round(totalPrice).toLocaleString()}`,
        perPerson: `$${Math.round(perPerson).toLocaleString()}`,
        currency: 'USD',
    }
}

export function transformProposalToItineraryData(
    proposalId: string,
    proposalData: any,
    proposalName: string
): ItineraryData {
    const days: BuilderDay[] = proposalData.days || []
    const startDate = proposalData.startDate ? new Date(proposalData.startDate) : undefined
    const travelerGroups: TravelerGroup[] = proposalData.travelerGroups || []
    const pricingRows: PricingRow[] = proposalData.pricingRows || []
    const extras: ExtraOption[] = proposalData.extras || []
    const inclusions: string[] = proposalData.inclusions || []
    const exclusions: string[] = proposalData.exclusions || []
    const tourTitle = proposalData.tourTitle || proposalName || 'Safari Adventure'
    const clientName = proposalData.clientName || ''
    
    // Determine country/location from first destination
    const firstDestination = days[0]?.destination || 'Rwanda'
    const country = getCountryFromDestination(firstDestination)
    const location = firstDestination.includes('National Park') 
        ? firstDestination 
        : firstDestination.includes('Rwanda') || country === 'rwanda'
            ? 'Rwanda'
            : firstDestination
    
    // Convert days
    const itinerary: ThemeDay[] = days.map((day, index) => convertDay(day, startDate, index))
    
    // Extract accommodations
    const accommodations = extractAccommodations(days)
    
    // Generate map data
    const mapLocations = generateMapLocations(days, country)
    const geoJson = getGeoJsonForCountry(country)
    const mapConfig = getMapConfigForCountry(country)
    
    // Get hero image from first destination or default
    const firstDestDetail = days[0]?.destination ? destinationDetails[days[0].destination.toLowerCase()] : null
    const heroImage = firstDestDetail?.image || 'https://images.unsplash.com/photo-1516426122078-c23e76319801?q=80&w=2000&auto=format&fit=crop'
    
    // Calculate pricing
    const pricing = calculatePricing(pricingRows, extras, travelerGroups)
    
    // Generate subtitle
    const duration = `${days.length} Days`
    const subtitle = `${duration} ${tourTitle.includes('Gorilla') ? 'Gorilla Trekking Safari' : 'Safari Adventure'}`
    
    return {
        id: proposalId,
        title: tourTitle,
        subtitle: subtitle,
        duration,
        location,
        heroImage,
        theme: 'minimalistic', // Default theme, could be configurable
        itinerary,
        accommodations,
        pricing,
        includedItems: inclusions,
        excludedItems: exclusions,
        importantNotes: {
            description: "This itinerary has been carefully curated to offer you the best experience. Please review all details and contact us with any questions.",
            points: [
                "Prices are subject to availability",
                "Booking confirmation required",
                "Travel insurance recommended",
            ],
        },
        mapData: {
            geojson: geoJson,
            locations: mapLocations,
            scale: mapConfig.scale,
            rotate: mapConfig.rotate,
        },
    }
}

