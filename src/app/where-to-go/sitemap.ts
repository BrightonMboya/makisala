import type {MetadataRoute} from "next"
import {articles_url} from "@/app/where-to-go/[month]/_components/data";
import {BASE_URL} from "@/lib/constants";

export default async function generateSitemaps(): Promise<MetadataRoute.Sitemap> {
    return articles_url.map((page) => ({
        url: `${BASE_URL}/where-to-go/${page.month}`,
        lastModified: new Date("2025-09-05").toISOString(), // cant get updatedAt so leaving this manually for now
    }))
}