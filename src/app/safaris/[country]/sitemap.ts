import {countries} from '@/lib/p_seo_info';
import type {MetadataRoute} from 'next';
import {BASE_URL} from "@/lib/constants";


export default function sitemap(): MetadataRoute.Sitemap {
    const today = new Date();

    return countries.map(country => ({
        url: `${BASE_URL}/${country}`,
        lastModified: today,
        changeFrequency: 'weekly',
        priority: 0.9,
    }));
}
