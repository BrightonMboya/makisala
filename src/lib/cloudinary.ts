import {v2 as cloudinary} from "cloudinary";

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
    api_key: process.env.CLOUDINARY_API_KEY!,
    api_secret: process.env.CLOUDINARY_API_SECRET!,
});


export async function getImagesInFolder(folderName: string) {
    try {
        const res = await cloudinary.api.resources_by_asset_folder(folderName, {});

        return res.resources.map(r => ({
            public_id: r.public_id,
            url: r.secure_url,
            format: r.format,
            width: r.width,
            height: r.height,
        }));
    } catch (err) {
        console.error('Cloudinary fetch error:', err);
        return [];
    }
}

export default cloudinary;