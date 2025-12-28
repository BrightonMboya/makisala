export const commonActivities = [
    { value: 'game-drive', label: 'Game Drive' },
    { value: 'gorilla-trekking', label: 'Gorilla Trekking' },
    { value: 'golden-monkey-trekking', label: 'Golden Monkey Trekking' },
    { value: 'boat-cruise', label: 'Boat Cruise' },
    { value: 'nature-walk', label: 'Nature Walk' },
    { value: 'cultural-tour', label: 'Cultural Tour' },
    { value: 'bird-watching', label: 'Bird Watching' },
    { value: 'chimpanzee-trekking', label: 'Chimpanzee Trekking' },
    { value: 'city-tour', label: 'City Tour' },
    { value: 'canopy-walk', label: 'Canopy Walk' },
]

export const nationalParks = [
    { value: 'akagera-np', label: 'Akagera National Park' },
    { value: 'volcanoes-np', label: 'Volcanoes National Park' },
    { value: 'nyungwe-np', label: 'Nyungwe Forest National Park' },
    { value: 'gishwati-mukura-np', label: 'Gishwati-Mukura National Park' },
    { value: 'kigali', label: 'Kigali' },
    { value: 'lake-kivu', label: 'Lake Kivu' },
]

export const airports = [
    { value: 'kgl', label: 'Kigali International Airport (KGL)' },
    { value: 'jro', label: 'Kilimanjaro International Airport (JRO)' },
    { value: 'nbo', label: 'Jomo Kenyatta International Airport (NBO)' },
    { value: 'dar', label: 'Julius Nyerere International Airport (DAR)' },
    { value: 'ebb', label: 'Entebbe International Airport (EBB)' },
]

export const commonExtras = [
    { value: 'Airport Transfer', label: 'Airport Transfer' },
    { value: 'Pre-tour Accommodation', label: 'Pre-tour Accommodation' },
    { value: 'Post-tour Accommodation', label: 'Post-tour Accommodation' },
    { value: 'Visa Fee', label: 'Visa Fee' },
    { value: 'Travel Insurance', label: 'Travel Insurance' },
    { value: 'Gorilla Permit', label: 'Gorilla Permit' },
]

// --- Rich Content for Preview ---

export const destinationDetails: Record<string, { description: string; image: string }> = {
    'kigali': {
        description: "Rwanda's vibrant capital, Kigali, is a clean, safe, and modern city nestled among rolling hills. It serves as the country's cultural and economic hub, offering a blend of traditional charm and contemporary energy. Visitors can explore the poignant Kigali Genocide Memorial, vibrant markets like Kimironko, and a burgeoning art scene.",
        image: "https://images.unsplash.com/photo-1576023799446-2775f0d3c468?q=80&w=2000&auto=format&fit=crop",
    },
    'volcanoes-np': {
        description: "Volcanoes National Park, part of the Virunga Massif, is a majestic landscape of rainforests and five dormant volcanoes. It is world-renowned as the sanctuary for the endangered mountain gorillas and the golden monkeys. The park offers a dramatic backdrop for some of the most profound wildlife encounters on Earth.",
        image: "https://images.unsplash.com/photo-1544224726-52c713844622?q=80&w=2000&auto=format&fit=crop",
    },
    'akagera-np': {
        description: "Akagera National Park is Central Africa's largest protected wetland and the last remaining refuge for savannah-adapted species in Rwanda. It offers a classic safari experience with the chance to see the Big Five (lion, leopard, elephant, rhino, buffalo) amidst rolling highlands, vast plains, and swamp-fringed lakes.",
        image: "https://images.unsplash.com/photo-1516426122078-c23e76319801?q=80&w=2000&auto=format&fit=crop",
    },
    'nyungwe-np': {
        description: "One of the oldest rainforests in Africa, Nyungwe is rich in biodiversity and spectacularly beautiful. The mountainous region is teaming with wildlife, including a small population of chimpanzees as well as 12 other species of primate, including the L'Hoest's monkey endemic to the Albertine Rift.",
        image: "https://images.unsplash.com/photo-1518182170546-0766aa6f5926?q=80&w=2000&auto=format&fit=crop",
    },
    'lake-kivu': {
        description: "Lake Kivu is one of Africa's Great Lakes and a stunningly beautiful inland sea enclosed by steep, green terraced hills. It offers a relaxing retreat with opportunities for swimming, kayaking, and boat tours to explore the many islands and coffee plantations along its shores.",
        image: "https://images.unsplash.com/photo-1573155993874-d5d48af862ba?q=80&w=2000&auto=format&fit=crop",
    }
}

export const activityDetails: Record<string, { description: string; image: string }> = {
    'Game Drive': {
        description: "Embark on a thrilling game drive through the savannah. Our expert guides will lead you in search of the Big Five and other wildlife, sharing their deep knowledge of the ecosystem. Morning drives offer the best chance to see predators active, while afternoon drives showcase the stunning African sunset.",
        image: "https://images.unsplash.com/photo-1516426122078-c23e76319801?q=80&w=2000&auto=format&fit=crop",
    },
    'Gorilla Trekking': {
        description: "A once-in-a-lifetime experience. Trek through the misty rainforests of the Virunga volcanoes to find a habituated family of mountain gorillas. Spending one magical hour observing these gentle giants in their natural habitat is a profound and moving encounter.",
        image: "https://images.unsplash.com/photo-1544224726-52c713844622?q=80&w=2000&auto=format&fit=crop",
    },
    'Golden Monkey Trekking': {
        description: "Trek into the bamboo forests of the Virunga volcanoes to observe the rare and playful Golden Monkeys. These energetic primates are endemic to the region and are known for their striking golden-orange fur and lively interactions.",
        image: "https://images.unsplash.com/photo-1535941339077-2dd1c7963098?q=80&w=2000&auto=format&fit=crop",
    },
    'Boat Cruise': {
        description: "Relax on a scenic boat cruise. Whether on Lake Ihema in Akagera to see hippos and crocodiles, or on the tranquil waters of Lake Kivu, a boat cruise offers a unique perspective of the landscape and its wildlife.",
        image: "https://images.unsplash.com/photo-1544224726-52c713844622?q=80&w=2000&auto=format&fit=crop",
    },
    'City Tour': {
        description: "Explore the city's highlights, from historical landmarks to vibrant markets. Learn about the culture, history, and modern life of the destination with a guided tour that takes you to the heart of the city.",
        image: "https://images.unsplash.com/photo-1576023799446-2775f0d3c468?q=80&w=2000&auto=format&fit=crop",
    },
    'Canopy Walk': {
        description: "Experience the rainforest from a new perspective on a canopy walk. Suspended high above the forest floor, you'll enjoy panoramic views of the canopy and have the chance to spot birds and primates that inhabit the upper levels of the forest.",
        image: "https://images.unsplash.com/photo-1518182170546-0766aa6f5926?q=80&w=2000&auto=format&fit=crop",
    },
    'Cultural Tour': {
        description: "Immerse yourself in the local culture. Visit traditional villages, learn about local customs, dance, and crafts. This is a wonderful opportunity to connect with the people and understand their way of life.",
        image: "https://images.unsplash.com/photo-1489749798305-4fea3ae63d43?q=80&w=2000&auto=format&fit=crop",
    }
}

export const accommodationDetails: Record<string, { name: string; description: string; image: string; amenities: string[] }> = {
    'nature-kigali': {
        name: "Nature Kigali",
        description: "A serene oasis in the heart of the city, Nature Kigali offers a blend of modern comfort and eco-friendly design. Enjoy lush gardens, spacious rooms, and a tranquil atmosphere perfect for relaxing after your journey.",
        image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=2000&auto=format&fit=crop",
        amenities: ["Free Wi-Fi", "Swimming Pool", "Restaurant", "Spa"],
    },
    'mountain-gorilla-view': {
        name: "Mountain Gorilla View Lodge",
        description: "Located on the edge of Volcanoes National Park, this lodge offers stunning views of the volcanoes. The spacious cottages are built with local materials and feature fireplaces to keep you warm during the cool mountain evenings.",
        image: "https://images.unsplash.com/photo-1582719508461-905c673771fd?q=80&w=2000&auto=format&fit=crop",
        amenities: ["Fireplace", "Restaurant", "Bar", "Cultural Performances"],
    },
    'akagera-game-lodge': {
        name: "Akagera Game Lodge",
        description: "Perched on a ridge overlooking Lake Ihema, Akagera Game Lodge offers panoramic views of the park. It's the perfect base for exploring the savannah, with comfortable rooms and a pool to cool off after a game drive.",
        image: "https://images.unsplash.com/photo-1549294413-26f195200c16?q=80&w=2000&auto=format&fit=crop",
        amenities: ["Swimming Pool", "Conference Center", "Tennis Court", "Restaurant"],
    },
    'one-and-only-nyungwe': {
        name: "One&Only Nyungwe House",
        description: "Set alongside an ancient rainforest within a working tea plantation, One&Only Nyungwe House offers an exclusive luxury experience. Immerse yourself in nature with tailored experiences, from tea ceremonies to primate trekking.",
        image: "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?q=80&w=2000&auto=format&fit=crop",
        amenities: ["Infinity Pool", "Spa", "Gym", "Fine Dining"],
    }
}
