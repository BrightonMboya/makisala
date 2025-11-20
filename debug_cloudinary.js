require('dotenv').config();
const cloudinary = require('cloudinary').v2;

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

async function run() {
    console.log("--- DEBUG START ---");
    
            // 1. Check tours_cover_images to verify config
            console.log(`\n1. Checking 'tours_cover_images' (sanity check)...`);
            try {
                const res = await cloudinary.api.resources({
                    type: 'upload',
                    prefix: 'tours_cover_images',
                    max_results: 5
                });
                console.log(`   Found ${res.resources.length} resources.`);
                if (res.resources.length > 0) {
            // 1. Check Search API with 'folder:tours_cover_images'
            console.log(`\n1. Checking Search API with 'folder:tours_cover_images'...`);
            try {
                const res = await cloudinary.search
                    .expression('folder:tours_cover_images')
                    .max_results(5)
                    .execute();
                
                console.log(`   Found ${res.resources.length} resources.`);
                if (res.resources.length > 0) {
                    console.log("   Sample:", res.resources[0].public_id);
                }
            } catch (e) {
                console.log(`   Error: ${e.message}`);
            }

            // 3. Check Search API with 'folder' expression
            console.log(`\n3. Checking Search API with 'folder:parks/rwanda/akagera'...`);
            try {
                const res = await cloudinary.search
                    .expression('folder:parks/rwanda/akagera')
                    .max_results(10)
                    .execute();
                
                console.log(`   Found ${res.resources.length} resources.`);
                if (res.resources.length > 0) {
                    console.log("   Sample:", res.resources[0].public_id);
                    console.log("   Sample Folder:", res.resources[0].folder);
                }
            } catch (e) {
                console.log(`   Error: ${e.message}`);
            }
    
    console.log("\n--- DEBUG END ---");
}

run().catch(console.error);
