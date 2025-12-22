export interface DayActivity {
  time: string;
  activity: string;
  description: string;
  location?: string;
}

export interface Day {
  day: number;
  date: string;
  title: string;
  activities: DayActivity[];
  accommodation: string;
  meals: string;
}

export interface Location {
  name: string;
  coordinates: [number, number];
}

export interface Accommodation {
  id: string;
  name: string;
  image: string;
  description: string;
  location: string;
}

export interface ItineraryData {
  id: string;
  title: string;
  subtitle: string;
  duration: string;
  location: string;
  heroImage: string;
  theme: "minimalistic" | "safari-portal";
  itinerary: Day[];
  accommodations: Accommodation[];
  pricing: {
    total: string;
    perPerson: string;
    currency: string;
  };
  includedItems: string[];
  excludedItems: string[];
  importantNotes: {
    description: string;
    points: string[];
  };
  mapData: {
    geojson: any;
    locations: Location[];
    scale: number;
    rotate: [number, number, number];
  };
}

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
};

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
};

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
};

export const itineraries: Record<string, ItineraryData> = {
  "rwanda-gorilla-3d": {
    id: "rwanda-gorilla-3d",
    title: "Into the Mist",
    subtitle: "Gorilla Trekking Safari",
    duration: "3 Days",
    location: "Rwanda",
    heroImage: "/hero-gorilla.png",
    theme: "minimalistic",
    pricing: {
      total: "$4,250",
      perPerson: "$2,125",
      currency: "USD"
    },
    accommodations: [
      {
        id: "mv-lodge",
        name: "Mountain Gorilla View Lodge",
        image: "/lodge-preview.png",
        description: "Nestled on the slopes of Mt. Sabyinyo, providing a seamless blend of luxury and wilderness with stunning views of the Virunga volcanoes.",
        location: "Volcanoes National Park"
      }
    ],
    includedItems: [
      "Gorilla trekking permit",
      "All park fees and conservation fees",
      "Luxury accommodation for 2 nights",
      "All specified meals",
      "Private expert guide",
      "Private 4x4 ground transportation",
      "Airport transfers",
      "Bottled water throughout",
    ],
    excludedItems: [
      "International flights",
      "Visa fees",
      "Travel insurance",
      "Staff gratuities",
      "Optional excursions",
      "Personal expenses",
    ],
    importantNotes: {
      description: "Gorilla trekking requires a reasonable level of fitness. Treks can last 2-6 hours through challenging terrain.",
      points: ["Minimum age: 15 years", "Max 8 visitors per group", "Distance: 7m from gorillas"],
    },
    itinerary: [
      {
        day: 1,
        date: "March 15, 2025",
        title: "Arrival & Transfer to Volcanoes",
        activities: [
          { time: "08:00", activity: "Airport Pickup", description: "Welcome at Kigali International Airport.", location: "Kigali Airport" },
          { time: "09:00", activity: "City Tour", description: "Visit the Kigali Genocide Memorial.", location: "Kigali" },
          { time: "13:30", activity: "Scenic Drive", description: "Drive to Volcanoes National Park.", location: "Musanze" }
        ],
        accommodation: "Mountain Gorilla View Lodge",
        meals: "Lunch, Dinner"
      },
      {
        day: 2,
        date: "March 16, 2025",
        title: "The Gorilla Encounter",
        activities: [
          { time: "06:30", activity: "Trek Briefing", description: "Morning briefing at Park HQ.", location: "Park Headquarters" },
          { time: "08:00", activity: "Gorilla Trekking", description: "Meet the majestic mountain gorillas.", location: "Volcanoes NP" }
        ],
        accommodation: "Mountain Gorilla View Lodge",
        meals: "Breakfast, Lunch, Dinner"
      },
      {
        day: 3,
        date: "March 17, 2025",
        title: "Farewell Rwanda",
        activities: [
          { time: "08:30", activity: "Return to Kigali", description: "Scenic drive back to the capital.", location: "Kigali" },
          { time: "16:00", activity: "Departure", description: "Transfer to airport for your flight.", location: "Kigali Airport" }
        ],
        accommodation: "N/A",
        meals: "Breakfast, Lunch"
      }
    ],
    mapData: {
      geojson: RWANDA_GEOJSON,
      locations: [
        { name: "Kigali", coordinates: [30.0619, -1.9441] },
        { name: "Volcanoes NP", coordinates: [29.5833, -1.4333] }
      ],
      scale: 40000,
      rotate: [-29.85, 1.7, 0]
    }
  },
  "tanzania-safari-7d": {
    id: "tanzania-safari-7d",
    title: "The Great Migration",
    subtitle: "Classic Serengeti Safari",
    duration: "7 Days",
    location: "Tanzania",
    heroImage: "/hero-gorilla.png", 
    theme: "minimalistic",
    pricing: {
      total: "$12,400",
      perPerson: "$6,200",
      currency: "USD"
    },
    accommodations: [
      {
        id: "arusha-coffee",
        name: "Arusha Coffee Lodge",
        image: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?q=80&w=2670&auto=format&fit=crop",
        description: "Hidden within one of Tanzania's largest coffee plantations, this lodge offers a sensory transition from the bustle of the city to the serenity of the safari.",
        location: "Arusha"
      },
      {
        id: "ngorongoro-crater",
        name: "Ngorongoro Crater Lodge",
        image: "https://images.unsplash.com/photo-1574169208507-84376144848b?q=80&w=2574&auto=format&fit=crop",
        description: "Described as 'Maasai meeting Versailles', this lodge sits perched on the crater rim with architecture that is as dramatic as the landscape itself.",
        location: "Ngorongoro"
      },
      {
        id: "fs-serengeti",
        name: "Four Seasons Safari Lodge Serengeti",
        image: "https://images.unsplash.com/photo-1493246507139-91e8bef99c02?q=80&w=2670&auto=format&fit=crop",
        description: "Deep in the heart of the Serengeti, this lodge offers unparalleled luxury and a front-row seat to the migration through its infinity pool overlooking an elephant watering hole.",
        location: "Central Serengeti"
      }
    ],
    includedItems: [
      "Serengeti Balloon Safari",
      "Professional safari guide",
      "Private 4x4 land cruiser",
      "All park entry fees",
      "Luxury tented camps",
      "Internal regional flights",
    ],
    excludedItems: ["Tipping", "Visas", "Alcoholic beverages"],
    importantNotes: {
      description: "Best time to visit is during the dry season for wildlife viewing.",
      points: ["Bring binoculars", "Neutral colored clothing", "Dust protection"],
    },
    itinerary: [
      {
        day: 1,
        date: "July 10, 2025",
        title: "Arusha Arrival",
        activities: [{ time: "14:00", activity: "Hotel Transfer", description: "Relax at the coffee plantation lodge.", location: "Arusha" }],
        accommodation: "Arusha Coffee Lodge",
        meals: "Dinner"
      },
      {
        day: 2,
        date: "July 11, 2025",
        title: "Tarangire National Park",
        activities: [{ time: "08:00", activity: "Game Drive", description: "View herds of elephants and baobabs.", location: "Tarangire" }],
        accommodation: "Tarangire Treetops",
        meals: "Full Board"
      },
      {
        day: 3,
        date: "July 12, 2025",
        title: "Ngorongoro Conservation Area",
        activities: [{ time: "09:00", activity: "Nature Walk", description: "Guided walk along the crater rim.", location: "Ngorongoro" }],
        accommodation: "Ngorongoro Crater Lodge",
        meals: "Full Board"
      },
      {
        day: 4,
        date: "July 13, 2025",
        title: "The Crater Floor",
        activities: [{ time: "06:30", activity: "Crater Game Drive", description: "Spot the rare black rhino.", location: "Ngorongoro Crater" }],
        accommodation: "Ngorongoro Crater Lodge",
        meals: "Full Board"
      },
      {
        day: 5,
        date: "July 14, 2025",
        title: "Serengeti Plains",
        activities: [{ time: "10:00", activity: "Flight to Serengeti", description: "Light aircraft flight to the heart of the wildebeest migration.", location: "Serengeti" }],
        accommodation: "Four Seasons Safari Lodge",
        meals: "Full Board"
      },
      {
        day: 6,
        date: "July 15, 2025",
        title: "Serengeti Game Drives",
        activities: [{ time: "06:30", activity: "Full Day Game Drive", description: "Exploring the vast plains for predators.", location: "Central Serengeti" }],
        accommodation: "Four Seasons Safari Lodge",
        meals: "Full Board"
      },
      {
        day: 7,
        date: "July 16, 2025",
        title: "Departure",
        activities: [{ time: "09:00", activity: "Final Game Drive", description: "Morning pursuit of the Big Five.", location: "Serengeti" }],
        accommodation: "N/A",
        meals: "Breakfast, Lunch"
      }
    ],
    mapData: {
      geojson: TANZANIA_GEOJSON,
      locations: [
        { name: "Arusha", coordinates: [36.683, -3.367] },
        { name: "Tarangire", coordinates: [36.0, -3.8] },
        { name: "Ngorongoro", coordinates: [35.5, -3.2] },
        { name: "Serengeti", coordinates: [34.8, -2.3] }
      ],
      scale: 6000,
      rotate: [-35.5, 3.2, 0]
    }
  },
  "kilimanjaro-trek-7d": {
    id: "kilimanjaro-trek-7d",
    title: "The Roof of Africa",
    subtitle: "Machame Route Expedition",
    duration: "7 Days",
    location: "Tanzania",
    heroImage: "/hero-gorilla.png", 
    theme: "safari-portal",
    pricing: {
      total: "$6,800",
      perPerson: "$3,400",
      currency: "USD"
    },
    accommodations: [
      {
        id: "machame-camp",
        name: "Machame High-Alt Luxury Camp",
        image: "https://images.unsplash.com/photo-1523906834658-6e24ef2386f9?q=80&w=2574&auto=format&fit=crop",
        description: "Strategic high-altitude camps featuring walk-in tents, heated sleeping bags, and a dedicated dining tent with mountain views.",
        location: "Kilimanjaro Slopes"
      }
    ],
    includedItems: [
      "Professional mountain guides",
      "Full porters and cook team",
      "All park and rescue fees",
      "Mountain tent accommodation",
      "High-altitude diet meals",
      "Oxygen for emergency",
    ],
    excludedItems: ["Climbing gear", "Personal insurance"],
    importantNotes: {
      description: "Summit day is extremely demanding. High altitude experience recommended.",
      points: ["Drink 3-4L water daily", "Walk 'pole pole' (slowly)", "Pack for all seasons"],
    },
    itinerary: [
      {
        day: 1,
        date: "Sept 5, 2025",
        title: "Machame Gate to Machame Camp",
        activities: [{ time: "10:00", activity: "Start Trek", description: "Rainforest hike to the first camp.", location: "Machame Gate" }],
        accommodation: "Machame Camp (3,000m)",
        meals: "Full Board"
      },
      {
        day: 2,
        date: "Sept 6, 2025",
        title: "Machame Camp to Shira Camp",
        activities: [{ time: "08:30", activity: "Shira Plateau Hike", description: "Steep ascent through the moorland zone.", location: "Shira Plateau" }],
        accommodation: "Shira 2 Camp (3,840m)",
        meals: "Full Board"
      },
      {
        day: 3,
        date: "Sept 7, 2025",
        title: "Lava Tower & Barranco",
        activities: [{ time: "08:00", activity: "Acclimatization", description: "Hike to Lava Tower for altitude prep.", location: "Lava Tower" }],
        accommodation: "Barranco Camp (3,950m)",
        meals: "Full Board"
      },
      {
        day: 4,
        date: "Sept 8, 2025",
        title: "The Barranco Wall",
        activities: [{ time: "07:30", activity: "Wall Climbing", description: "Fun scramble up the iconic wall.", location: "Barranco Wall" }],
        accommodation: "Karanga Camp (4,200m)",
        meals: "Full Board"
      },
      {
        day: 5,
        date: "Sept 9, 2025",
        title: "Ascent to Base Camp",
        activities: [{ time: "08:00", activity: "Barafu Prep", description: "Short hike to high camp before summit.", location: "Barafu Camp" }],
        accommodation: "Barafu Camp (4,600m)",
        meals: "Full Board"
      },
      {
        day: 6,
        date: "Sept 10, 2025",
        title: "Summit Day",
        activities: [{ time: "00:00", activity: "Summit Push", description: "Midnight start for Uhuru Peak.", location: "Uhuru Peak" }],
        accommodation: "Mweka Camp (3,100m)",
        meals: "Full Board"
      },
      {
        day: 7,
        date: "Sept 11, 2025",
        title: "Descent & Celebration",
        activities: [{ time: "08:00", activity: "Return to Gate", description: "Final descent and certificate ceremony.", location: "Mweka Gate" }],
        accommodation: "Arusha Hotel",
        meals: "Breakfast, Lunch"
      }
    ],
    mapData: {
      geojson: TANZANIA_GEOJSON,
      locations: [
        { name: "Machame Gate", coordinates: [37.27, -3.15] },
        { name: "Uhuru Peak", coordinates: [37.35, -3.06] }
      ],
      scale: 50000,
      rotate: [-37.3, 3.1, 0]
    }
  },
  "botswana-safari-6d": {
    id: "botswana-safari-6d",
    title: "Water & Wildlife",
    subtitle: "Delta & Chobe Discovery",
    duration: "6 Days",
    location: "Botswana",
    heroImage: "/hero-gorilla.png", 
    theme: "safari-portal",
    pricing: {
      total: "$9,200",
      perPerson: "$4,600",
      currency: "USD"
    },
    accommodations: [
      {
        id: "sandibe",
        name: "Sandibe Okavango Safari Lodge",
        image: "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?q=80&w=2670&auto=format&fit=crop",
        description: "Constructed like a weaving weaver bird's nest, this sustainable lodge offers unfiltered access to the Okavango Delta's rich wildlife.",
        location: "Okavango Delta"
      },
      {
        id: "chobe-chilwero",
        name: "Chobe Chilwero Lodge",
        image: "https://images.unsplash.com/photo-1516422213484-2afce9925c10?q=80&w=2670&auto=format&fit=crop",
        description: "Overlooking the Chobe River, this luxurious lodge features the best split-level swimming pool in Botswana and a serene spa retreat.",
        location: "Chobe Riverfront"
      }
    ],
    includedItems: [
      "Okavango Mokoro excursions",
      "Chobe River boat cruise",
      "Charter flights between camps",
      "Professional safari guides",
      "Premium beverages",
    ],
    excludedItems: ["Premium champagnes", "Gratuities"],
    importantNotes: {
      description: "Okavango Delta experience depends on seasonality and water levels.",
      points: ["Small luggage only (charters)", "Malaria prevention", "Hat and sunscreen"],
    },
    itinerary: [
      {
        day: 1,
        date: "Oct 12, 2025",
        title: "Maun to Okavango",
        activities: [{ time: "11:00", activity: "Bush Flight", description: "Aerial view of the Delta pans.", location: "Maun" }],
        accommodation: "Sandibe Okavango Safari Lodge",
        meals: "Lunch, Dinner"
      },
      {
        day: 2,
        date: "Oct 13, 2025",
        title: "Delta Explorations",
        activities: [{ time: "06:30", activity: "Mokoro Trip", description: "Poling through quiet lagoons.", location: "Okavango Delta" }],
        accommodation: "Sandibe Okavango Safari Lodge",
        meals: "Full Board"
      },
      {
        day: 3,
        date: "Oct 14, 2025",
        title: "Linyanti Reservve",
        activities: [{ time: "10:00", activity: "Wildlife Flight", description: "Transfer to the northern border.", location: "Linyanti" }],
        accommodation: "DumaTau Camp",
        meals: "Full Board"
      },
      {
        day: 4,
        date: "Oct 15, 2025",
        title: "Chobe Riverfront",
        activities: [{ time: "14:00", activity: "Boat Safari", description: "Sunsets and swimming elephants.", location: "Chobe River" }],
        accommodation: "Chobe Chilwero Lodge",
        meals: "Full Board"
      },
      {
        day: 5,
        date: "Oct 16, 2025",
        title: "Chobe Game Drives",
        activities: [{ time: "06:30", activity: "Morning Drive", description: "Track the pride of lions.", location: "Chobe NP" }],
        accommodation: "Chobe Chilwero Lodge",
        meals: "Full Board"
      },
      {
        day: 6,
        date: "Oct 17, 2025",
        title: "Departure",
        activities: [{ time: "09:00", activity: "Final Breakfast", description: "Transfer to Kasane airport.", location: "Kasane" }],
        accommodation: "N/A",
        meals: "Breakfast"
      }
    ],
    mapData: {
      geojson: BOTSWANA_GEOJSON,
      locations: [
        { name: "Maun", coordinates: [23.41, -19.98] },
        { name: "Okavango", coordinates: [22.9, -19.1] },
        { name: "Chobe", coordinates: [25.1, -17.8] }
      ],
      scale: 10000,
      rotate: [-23.5, 19.0, 0]
    }
  }
};
