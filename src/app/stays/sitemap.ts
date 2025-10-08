import {destinationCoordinates} from "@/app/stays/_components/data";
import type {MetadataRoute} from "next";
import {BASE_URL} from "@/lib/constants";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const urls: MetadataRoute.Sitemap = [];

    for (const key of Object.keys(destinationCoordinates)) {
        urls.push({
            url: `${BASE_URL}/stays/${key}`,
            lastModified: new Date("2025-10-09").toISOString(),
        })
    }

    return urls;
}