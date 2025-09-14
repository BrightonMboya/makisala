import {fetchAllNps} from "@/lib/cms-service";
import {BASE_URL} from "@/lib/constants";
import type {MetadataRoute} from "next";

const subpages = ['best-time-to-visit', 'climate', 'getting-there', 'wildlife']

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const parks = await fetchAllNps()
    const urls: MetadataRoute.Sitemap = []

    const today = new Date("2025-09-14");

    parks.forEach(park => {
        urls.push({
            url: `${BASE_URL}/national-parks/${park.name}`,
            lastModified: today,
            changeFrequency: 'weekly',
            priority: 0.9
        });

        subpages.forEach(page => {
            urls.push({
                url: `${BASE_URL}/national-parks/${park.name}/${page}`,
                lastModified: today,
                changeFrequency: 'weekly',
                priority: 0.8,
            })
        })
    })

    return urls;

}