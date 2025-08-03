export const OrganizationSchema = () => {
    return {
        "@context": "https://schema.org",
        "@type": "Organization",
        "url": "https://www.makisala.com",
        "logo": "https://www.makisala.com/makisala_icon.png",
        "name": "Makisala Safaris",
        "description": "Makisala Safaris offers unforgettable African safari experiences including walking safaris, canoe safaris, and 4x4 game drives across Tanzania and East Africa.",
        "email": "info@makisala.com",
        "telephone": "+255788323254",
        "address": {
            "@type": "PostalAddress",
            "streetAddress": "Ngaramtoni",
            "addressLocality": "Arusha",
            "addressCountry": "TZ",
            "addressRegion": "Arusha",
        },
        "ContactPoint": {
            "@type": "ContactPoint",
            "telephone": "+255788323254",
            "email": "info@makisala.com",
            "contactType": "Customer Support",
            "areaServed": "TZ",
            "availableLanguage": ["English", "Swahili"]
        },
        "foundingDate": "2022",
        "founder": {
            "@type": "Person",
            "name": "Brighton Mboya"
        },
    }
}

export const WebsiteSchema = () => {
    return {
        "@context": "https://schema.org",
        "@type": "WebSite",
        "name": "Makisala Safaris",
        "url": "https://www.makisala.com",
        "description": "Makisala Safaris is a Tanzania-based safari company offering guided walking safaris, canoe trips, and 4x4 wildlife adventures across East Africa.",
        "inLanguage": "en",
        "publisher": {
            "@type": "Organization",
            "name": "Makisala Safaris",
            "logo": {
                "@type": "ImageObject",
                "url": "https://www.makisala.com/makisala_icon.png"
            }
        }
    }
}

export const BlogSchema = ({headline, image, description}: {
    headline: string;
    image: string;
    description: string;
}) => {
    return {
        "@context": "https://schema.org",
        "@type": "BlogPosting",
        "headline": `${headline}`,
        "image": `${image}`,
        "author": {
            "@type": "Person",
            "name": "Uwiduhaye Diane"
        },
        "publisher": {
            "@type": "Organization",
            "name": "Makisala Safaris",
            "logo": {
                "@type": "ImageObject",
                "url": "https://www.makisala.com/makisala_icon.png"
            }
        },
        "datePublished": "2025-07-15",
        "dateModified": "2025-07-15",
        "description": "Safari guides, wildlife tips, and East African travel stories to inspire your next adventure with Makisala Safaris."
    }
}

export const BreadcrumbSchema = ({breadcrumbs}: {
    breadcrumbs: { name: string; url: string }[];
}) => {
    return {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": breadcrumbs.map((crumb, index) => ({
            "@type": "ListItem",
            "position": index + 1,
            "name": crumb.name,
            "item": crumb.url
        }))
    };
};

export const TouristTripSchema = ({
                                      name,
                                      description,
                                      url,
                                      pricingStartsFrom,
                                      itineraryItems
                                  }: {
    name: string;
    description: string;
    url: string;
    pricingStartsFrom: string;
    itineraryItems: {
        name: string;
        description: string;
    }[];
}) => {
    return {
        "@context": "https://schema.org",
        "@type": "TouristTrip",
        "name": name,
        "description": description,
        "touristType": [
            "Family Safari",
            "African Safari",
            "Couples and honeymooners Safari",
            "Group Safari"
        ],
        "offers": {
            "@type": "Offer",
            "name": name,
            "description": description,
            "price": pricingStartsFrom,
            "priceCurrency": "USD",
            "url": url,
            "offeredBy": {
                "@type": "Organization",
                "name": "Makisala Safaris",
                "url": "https://www.makisala.com"
            }
        },
        "itinerary": {
            "@type": "ItemList",
            "numberOfItems": itineraryItems.length,
            "itemListElement": itineraryItems.map((item, index) => ({
                "@type": "ListItem",
                "position": index + 1,
                "item": {
                    "@type": "TouristAttraction",
                    "name": item.name,
                    "description": item.description
                }
            }))
        }
    };
};

export const TouristDestinationSchema = ({
                                             name,
                                             description,
                                             image,
                                             url,
                                             country
                                         }: {
    name: string;
    description: string;
    image: string;
    url: string;
    country: string;
}) => {
    return {
        "@context": "https://schema.org",
        "@type": "TouristDestination",
        "name": name,
        "description": description,
        "image": image,
        "url": url,
        "touristType": {
            "@type": "Audience",
            "audienceType": [
                "Family Safari",
                "African Safari",
                "Couples and honeymooners Safari",
                "Group Safari"
            ]
        },
        "geo": {
            "@type": "Place",
            "address": {
                "@type": "PostalAddress",
                "addressCountry": country,
            }
        }
    };
};
